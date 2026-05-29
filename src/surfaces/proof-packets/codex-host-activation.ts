import { parseCodexMcpServerRecords } from "./codex-toml";
import { arrayEquals, gap, nonAuthorityBoundary, PROOF_PACKET_VERSION, type ProofGap } from "./shared";

export type CodexHostActivationReadbackInput = {
  readonly generatedAt: string;
  readonly commandRefs: readonly string[];
  readonly configPath: string;
  readonly configExists: boolean;
  readonly configSha256: string | null;
  readonly configText?: string;
  readonly observedMcpServers?: readonly string[];
  readonly expectedServer?: CodexHostExpectedServer;
  readonly hostToolInvocation?: CodexHostToolInvocationReadback;
  readonly expectedArtifact: {
    readonly path: string;
    readonly exists: boolean;
    readonly sha256: string | null;
    readonly sizeBytes: number | null;
  } | null;
};

export type CodexHostExpectedServer = {
  readonly name: string;
  readonly command: string;
  readonly args: readonly string[];
  readonly executablePath: string;
  readonly artifactSha256: string;
};

export type CodexHostToolInvocationReadback = {
  readonly proofRef: string;
  readonly toolVisible: boolean;
  readonly toolCallAttempted: boolean;
  readonly outcome: string;
  readonly nonAuthorityClaims: readonly string[];
};

export type CodexHostActivationReadback = ReturnType<typeof projectCodexHostActivationReadback>;

export function projectCodexHostActivationReadback(input: CodexHostActivationReadbackInput) {
  const serverRecords = parseCodexMcpServerRecords(input.configText ?? "");
  const observedMcpServers = [...(input.observedMcpServers ?? serverRecords.map((server) => server.name))].sort();
  const targetServerName = input.expectedServer?.name ?? "handshake_x402";
  const targetServer = serverRecords.find((server) => server.name === targetServerName) ?? null;
  const targetPresent = observedMcpServers.includes(targetServerName);
  const expectedServerMatches = input.expectedServer
    ? targetServer !== null &&
      targetServer.command === input.expectedServer.command &&
      arrayEquals(targetServer.args ?? [], input.expectedServer.args)
    : targetPresent;
  const hostToolInvocationObserved =
    expectedServerMatches &&
    input.hostToolInvocation?.toolVisible === true &&
    input.hostToolInvocation.toolCallAttempted === true;
  const status = targetPresent
    ? hostToolInvocationObserved
      ? ("host_tool_invocation_observed" as const)
      : expectedServerMatches
        ? ("configured_unverified" as const)
        : ("blocked" as const)
    : ("blocked" as const);

  return {
    proofKind: "codex_host_activation_readback" as const,
    proofVersion: PROOF_PACKET_VERSION,
    generatedAt: input.generatedAt,
    status,
    scope: "Read-only Codex-local MCP host configuration readback for the Handshake x402 proposal/evidence server.",
    config: {
      path: input.configPath,
      exists: input.configExists,
      sha256: input.configSha256,
      observedMcpServers,
      targetServerName,
      targetPresent,
      targetServer,
      expectedServer: input.expectedServer ?? null,
      expectedServerMatches,
      hostToolInvocation: input.hostToolInvocation ?? null,
      hostToolInvocationObserved,
    },
    expectedArtifact: input.expectedArtifact,
    commandRefs: input.commandRefs,
    evidenceRefs: codexEvidenceRefs({
      configSha256: input.configSha256,
      expectedArtifactSha256: input.expectedArtifact?.sha256 ?? null,
      targetPresent,
    }),
    authorityBoundary: {
      ...nonAuthorityBoundary,
      resolvesCredential: false as const,
      invokesSigner: false as const,
      createsPaymentPayload: false as const,
      configuresLiveHost: false as const,
      observesHostToolInvocation: hostToolInvocationObserved,
      provesHostWideContainment: false as const,
      provesMcpRegistryDiscoverability: false as const,
      provesCustomerGatewayCustody: false as const,
      provesLivePaidExecution: false as const,
    },
    proofGaps: codexProofGaps(input, targetPresent, hostToolInvocationObserved),
    nextMechanism: hostToolInvocationObserved
      ? "Move to public distribution/provenance; Codex-local host invocation does not prove registry discovery, customer gateway custody, or live paid execution."
      : targetPresent
        ? "Exercise `handshake.actions.x402_payment.propose` through the configured Codex host and capture a host-origin transcript."
        : "Add `mcp_servers.handshake_x402` to Codex config against the pinned artifact after explicit approval.",
  };
}

function codexEvidenceRefs(input: {
  readonly configSha256: string | null;
  readonly expectedArtifactSha256: string | null;
  readonly targetPresent: boolean;
}): string[] {
  const refs = [];
  if (input.configSha256) refs.push(`codex-config:sha256:${input.configSha256}`);
  if (input.expectedArtifactSha256) refs.push(`expected-artifact:sha256:${input.expectedArtifactSha256}`);
  refs.push(
    input.targetPresent
      ? "codex-config:mcp-server:handshake_x402:present"
      : "codex-config:mcp-server:handshake_x402:absent",
  );
  return refs;
}

function codexProofGaps(
  input: CodexHostActivationReadbackInput,
  targetPresent: boolean,
  hostToolInvocationObserved: boolean,
): ProofGap[] {
  const gaps: ProofGap[] = [];
  const targetServer = parseCodexMcpServerRecords(input.configText ?? "").find(
    (server) => server.name === (input.expectedServer?.name ?? "handshake_x402"),
  );
  const expectedServerMatches = input.expectedServer
    ? targetServer !== undefined &&
      targetServer.command === input.expectedServer.command &&
      arrayEquals(targetServer.args ?? [], input.expectedServer.args)
    : targetPresent;
  if (!input.configExists) {
    gaps.push(
      gap(
        "codex_config_not_found",
        "Codex-local host activation cannot be claimed without readable host configuration.",
      ),
    );
  }
  if (input.expectedArtifact && !input.expectedArtifact.exists) {
    gaps.push(
      gap(
        "expected_activation_artifact_not_found",
        "Codex-local host activation cannot be pinned to a missing local artifact.",
      ),
    );
  }
  if (!targetPresent) {
    gaps.push(
      gap(
        "codex_handshake_x402_mcp_server_absent",
        "Codex-local host activation is not configured while `mcp_servers.handshake_x402` is absent.",
      ),
    );
  }
  if (targetPresent && !expectedServerMatches) {
    gaps.push(
      gap(
        "codex_handshake_x402_mcp_server_config_mismatch",
        "Codex-local host activation cannot be pinned while the configured command or args differ from the expected artifact-derived executable.",
      ),
    );
  }
  if (!hostToolInvocationObserved) {
    gaps.push(
      gap(
        "host_origin_tool_invocation_not_exercised",
        "Config readback does not prove `handshake.actions.x402_payment.propose` was invoked through the live host.",
      ),
    );
  }
  return gaps;
}
