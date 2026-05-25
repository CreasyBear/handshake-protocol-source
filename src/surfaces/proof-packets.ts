import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { isPaymentRequiredV2, validatePaymentRequired } from "@x402/core/schemas";

export const PROOF_PACKET_VERSION = "proof-packets.v0.1" as const;

export type ProofGap = {
  readonly reasonCode: string;
  readonly nonClaim: string;
};

export type NonAuthorityBoundary = {
  readonly createsAuthority: false;
  readonly createsPolicyDecision: false;
  readonly createsGreenlight: false;
  readonly performsGatewayCheck: false;
  readonly performsMutation: false;
};

export const nonAuthorityBoundary: NonAuthorityBoundary = {
  createsAuthority: false,
  createsPolicyDecision: false,
  createsGreenlight: false,
  performsGatewayCheck: false,
  performsMutation: false,
};

export type CleanInstalledActivationProofInput = {
  readonly generatedAt: string;
  readonly package: {
    readonly name: string;
    readonly version: string;
    readonly packedFile: string;
    readonly localArtifactPath: string | null;
    readonly tarballSha256: string;
    readonly tarballSizeBytes: number;
    readonly npmIntegrity: string | null;
    readonly npmShasum: string | null;
    readonly fileCount: number | null;
  };
  readonly requiredInstalledSurfaces: {
    readonly bins: readonly string[];
    readonly exports: readonly string[];
    readonly protectedToolExports: readonly string[];
  };
  readonly activationEvidence: {
    readonly facadeImportSource: string;
    readonly runtimeDispatchPrepared: boolean;
    readonly gatewayAdmissionStatus: string;
    readonly downstreamOutcomeStatus: string;
    readonly policyDecision: string;
    readonly gateDecision: string;
    readonly changedParameterDecision: string;
    readonly replayDecision: string;
    readonly signerInvocationsAfterGatewayAdmission: number;
    readonly signerInvocationsAfterReplay: number;
    readonly hostileGeneratedExecutionCaseIds: readonly string[];
    readonly rawCredentialMaterialVisible: boolean;
    readonly outputRefs: readonly string[];
  };
  readonly commandRefs: readonly string[];
};

export type CleanInstalledActivationProof = ReturnType<typeof projectCleanInstalledActivationProof>;

export function projectCleanInstalledActivationProof(input: CleanInstalledActivationProofInput) {
  return {
    proofKind: "clean_installed_activation_proof" as const,
    proofVersion: PROOF_PACKET_VERSION,
    generatedAt: input.generatedAt,
    status: "local_activation_passed" as const,
    scope:
      "Pinned local packed artifact activation for the x402 protected-tool proposal/evidence surface. This is not live host activation.",
    package: input.package,
    requiredInstalledSurfaces: input.requiredInstalledSurfaces,
    activationEvidence: input.activationEvidence,
    commandRefs: input.commandRefs,
    evidenceRefs: [
      `package:${input.package.name}@${input.package.version}:tarball-sha256:${input.package.tarballSha256}`,
      "evidence:clean-installed-import:x402-protected-tool",
      "evidence:clean-installed-demo:x402-protected-spend",
      ...input.activationEvidence.outputRefs,
    ],
    authorityBoundary: {
      ...nonAuthorityBoundary,
      resolvesCredential: false as const,
      invokesSigner: false as const,
      createsPaymentPayload: false as const,
      configuresLiveHost: false as const,
      provesMcpRegistryDiscoverability: false as const,
      provesPublicNpmCurrentSurface: false as const,
      provesCustomerGatewayCustody: false as const,
      provesLivePaidExecution: false as const,
    },
    proofGaps: [
      gap(
        "live_codex_host_not_configured_by_clean_install_check",
        "Clean installed activation does not prove live Codex host configuration or host-origin tool invocation.",
      ),
      gap(
        "mcp_registry_discoverability_not_checked_by_clean_install_check",
        "Clean installed activation does not prove MCP Registry acceptance or lookup.",
      ),
      gap(
        "public_npm_current_surface_not_checked_by_clean_install_check",
        "Clean installed activation uses a local packed artifact and does not prove that the current surface is published.",
      ),
      gap(
        "customer_gateway_live_payment_not_checked_by_clean_install_check",
        "Clean installed activation does not exercise a funded customer-gateway-held signer or live x402 paid retry.",
      ),
    ],
    nextMechanism: "Configure a live Codex MCP host against this exact artifact only after explicit approval.",
  };
}

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

export type CodexMcpServerRecord = {
  readonly name: string;
  readonly command: string | null;
  readonly args: readonly string[] | null;
  readonly startupTimeoutSec: number | null;
  readonly envKeys: readonly string[];
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

export function parseCodexMcpServerNames(configText: string): string[] {
  return parseCodexMcpServerRecords(configText).map((server) => server.name);
}

export function parseCodexMcpServerRecords(configText: string): CodexMcpServerRecord[] {
  const sections = parseTomlSections(configText);
  return sections
    .filter((section) => section.kind === "mcp_server")
    .map((section) => ({
      name: section.name,
      command: parseTomlStringField(section.body, "command"),
      args: parseTomlStringArrayField(section.body, "args"),
      startupTimeoutSec: parseTomlNumberField(section.body, "startup_timeout_sec"),
      envKeys: parseCodexMcpServerEnvKeys(sections, section.name),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function buildCodexMcpServerTomlBlock(input: {
  readonly name: string;
  readonly command: string;
  readonly args: readonly string[];
  readonly startupTimeoutSec?: number;
}): string {
  const startupTimeoutSec = input.startupTimeoutSec ?? 120;
  return [
    `[mcp_servers.${input.name}]`,
    `command = ${tomlString(input.command)}`,
    `args = [${input.args.map(tomlString).join(", ")}]`,
    `startup_timeout_sec = ${startupTimeoutSec}`,
    "",
  ].join("\n");
}

export function upsertCodexMcpServerToml(input: {
  readonly existingToml: string;
  readonly serverName: string;
  readonly serverBlockToml: string;
}) {
  const newline = input.existingToml.includes("\r\n") ? "\r\n" : "\n";
  const sourceLines = input.existingToml.split(/\r?\n/u);
  const retainedLines: string[] = [];
  let skippingTargetSection = false;

  for (const line of sourceLines) {
    const header = parseTomlHeader(line);
    if (header) {
      skippingTargetSection = isCodexMcpServerHeader(header, input.serverName);
    }
    if (!skippingTargetSection) retainedLines.push(line);
  }

  const insertIndex = lastMcpSectionEndIndex(retainedLines);
  const blockLines = input.serverBlockToml.trimEnd().split(/\r?\n/u);
  const before = retainedLines.slice(0, insertIndex);
  const after = retainedLines.slice(insertIndex);
  const nextLines = [...trimTrailingBlankLines(before), "", ...blockLines, "", ...trimLeadingBlankLines(after)];
  const nextToml = `${nextLines.join(newline).replace(/\n{4,}/gu, `${newline}${newline}${newline}`)}${newline}`;

  return {
    changed: nextToml !== input.existingToml,
    toml: nextToml,
  };
}

export type DistributionProvenanceReadbackInput = {
  readonly generatedAt: string;
  readonly localPackage: {
    readonly name: string;
    readonly version: string;
    readonly mcpName: string;
    readonly serverJsonName: string;
    readonly serverJsonVersion: string;
    readonly exports: readonly string[];
  };
  readonly npmLatest: {
    readonly url: string;
    readonly status: number | null;
    readonly version: string | null;
    readonly tarball: string | null;
    readonly integrity: string | null;
    readonly shasum: string | null;
    readonly signatureCount: number;
    readonly fileCount: number | null;
    readonly exports: readonly string[];
  };
  readonly mcpRegistry: {
    readonly lookupUrl: string;
    readonly lookupStatus: number | null;
    readonly lookupProblemTitle: string | null;
    readonly searchUrl: string;
    readonly searchStatus: number | null;
    readonly searchCount: number | null;
  };
  readonly publishAttempt?: DistributionPublishAttemptReadback;
  readonly evidenceRefs: readonly string[];
  readonly commandRefs: readonly string[];
};

export type DistributionProvenanceReadback = ReturnType<typeof projectDistributionProvenanceReadback>;

export type DistributionPublishAttemptReadback = {
  readonly attempted: boolean;
  readonly commandRef: string;
  readonly status: "not_attempted" | "failed" | "succeeded";
  readonly provenanceRequested: boolean;
  readonly provenanceSupported: boolean | null;
  readonly errorCode: string | null;
  readonly errorMessage: string | null;
  readonly evidenceRef: string | null;
};

export function projectDistributionProvenanceReadback(input: DistributionProvenanceReadbackInput) {
  const localExports = [...input.localPackage.exports].sort();
  const publishedExports = [...input.npmLatest.exports].sort();
  const missingLocalExports = localExports.filter((entry) => !publishedExports.includes(entry));
  const extraPublishedExports = publishedExports.filter((entry) => !localExports.includes(entry));
  const npmLatestMatchesLocalVersion = input.npmLatest.version === input.localPackage.version;
  const currentSurfacePublished =
    input.npmLatest.status === 200 && npmLatestMatchesLocalVersion && missingLocalExports.length === 0;
  const mcpRegistryAccepted = input.mcpRegistry.lookupStatus === 200;
  const mcpRegistryDiscoverable =
    mcpRegistryAccepted && input.mcpRegistry.searchCount !== null && input.mcpRegistry.searchCount > 0;
  const status = currentSurfacePublished && mcpRegistryDiscoverable ? "registry_discoverable" : "blocked";

  return {
    proofKind: "distribution_provenance_readback" as const,
    proofVersion: PROOF_PACKET_VERSION,
    generatedAt: input.generatedAt,
    status,
    scope:
      "Public npm and MCP Registry readback for the current local package surface. Publication and registry discovery are distribution facts only.",
    localPackage: {
      ...input.localPackage,
      exports: localExports,
    },
    npmLatest: {
      ...input.npmLatest,
      exports: publishedExports,
      missingLocalExports,
      extraPublishedExports,
      currentSurfacePublished,
    },
    mcpRegistry: {
      ...input.mcpRegistry,
      accepted: mcpRegistryAccepted,
      discoverable: mcpRegistryDiscoverable,
    },
    publishAttempt: input.publishAttempt ?? null,
    commandRefs: input.commandRefs,
    evidenceRefs: input.evidenceRefs,
    authorityBoundary: {
      ...nonAuthorityBoundary,
      holdsCustody: false as const,
      hostsOperation: false as const,
      certifiesMarketplace: false as const,
      managesSettlement: false as const,
      managesPayment: false as const,
      establishesTrust: false as const,
      enforcesHostWidePolicy: false as const,
    },
    proofGaps: distributionProofGaps({
      npmLatestStatus: input.npmLatest.status,
      npmLatestMatchesLocalVersion,
      missingLocalExports,
      currentSurfacePublished,
      mcpRegistryAccepted,
      mcpRegistryDiscoverable,
      publishAttempt: input.publishAttempt ?? null,
    }),
    nextMechanism: currentSurfacePublished
      ? "Submit and verify MCP Registry publication for the current package version."
      : "Publish a new package version containing the current local export surface, then rerun npm and MCP Registry readback.",
  };
}

export type LiveX402RequirementReadbackInput = {
  readonly generatedAt: string;
  readonly commandRefs: readonly string[];
  readonly request: {
    readonly method: string;
    readonly url: string;
    readonly responseStatus: number;
    readonly providerEnvironmentPosture: "live";
    readonly headersEvidenceRef: string;
  };
  readonly paymentRequiredHeader: string;
  readonly selectedPaymentRequirementIndex: number;
  readonly customerGatewayCustody: {
    readonly present: boolean;
    readonly proofRef: string | null;
    readonly digest: `sha256:${string}` | null;
  };
};

export type LiveX402RequirementReadback = ReturnType<typeof projectLiveX402RequirementReadback>;

export function projectLiveX402RequirementReadback(input: LiveX402RequirementReadbackInput) {
  const paymentRequired = validatePaymentRequired(
    JSON.parse(Buffer.from(input.paymentRequiredHeader, "base64").toString("utf8")),
  );
  if (!isPaymentRequiredV2(paymentRequired)) {
    throw new Error("Only x402 v2 PAYMENT-REQUIRED evidence is supported.");
  }
  const selectedPaymentRequirement = paymentRequired.accepts[input.selectedPaymentRequirementIndex];
  if (!selectedPaymentRequirement) throw new Error("Selected x402 payment requirement index is outside accepts.");
  if (selectedPaymentRequirement.scheme !== "exact") {
    throw new Error("The live x402 first wedge only admits exact requirements.");
  }
  const status =
    input.request.responseStatus === 402 && input.customerGatewayCustody.present
      ? ("ready_for_gateway_signed_retry" as const)
      : ("blocked" as const);

  return {
    proofKind: "live_x402_requirement_readback" as const,
    proofVersion: PROOF_PACKET_VERSION,
    generatedAt: input.generatedAt,
    status,
    scope:
      "Live x402 Payment Required challenge readback for one buyer-side exact protected action. This is not payment execution.",
    request: input.request,
    paymentRequired: {
      x402Version: paymentRequired.x402Version,
      resource: paymentRequired.resource,
      acceptsCount: paymentRequired.accepts.length,
      selectedPaymentRequirementIndex: input.selectedPaymentRequirementIndex,
      selectedPaymentRequirement,
      selectedPaymentRequirementDigest: stableDigest({
        paymentRequired,
        selectedPaymentRequirementIndex: input.selectedPaymentRequirementIndex,
        selectedPaymentRequirement,
      }),
    },
    customerGatewayCustody: input.customerGatewayCustody,
    commandRefs: input.commandRefs,
    evidenceRefs: [
      input.request.headersEvidenceRef,
      `selected-payment-requirement:${stableDigest({
        paymentRequired,
        selectedPaymentRequirementIndex: input.selectedPaymentRequirementIndex,
        selectedPaymentRequirement,
      })}`,
    ],
    authorityBoundary: {
      ...nonAuthorityBoundary,
      resolvesCredential: false as const,
      invokesSigner: false as const,
      createsPaymentPayload: false as const,
      provesCustomerGatewayCustody: input.customerGatewayCustody.present,
      provesLivePaidExecution: false as const,
      provesSettlementFinality: false as const,
      provesProviderCustody: false as const,
      certifiesMarketplace: false as const,
    },
    proofGaps: liveX402ProofGaps({
      responseStatus: input.request.responseStatus,
      custodyPresent: input.customerGatewayCustody.present,
    }),
    nextMechanism: input.customerGatewayCustody.present
      ? "Create one exact x402 action contract from the selected requirement and run a post-VerifiedGatewayCheck signed retry."
      : "Attach a funded customer-gateway custody packet before any live signed retry can be attempted.",
  };
}

export type ProductCompletionGateId =
  | "codex_local_host_activation"
  | "public_distribution_and_registry"
  | "customer_gateway_live_x402_paid_proof"
  | "auth_md_x402_admission_packet";

export type ProductCompletionGateStatus = "completed" | "hard_blocked" | "incomplete";

export type ProductCompletionReadbackInput = {
  readonly generatedAt: string;
  readonly commandRefs: readonly string[];
  readonly qualityGate: {
    readonly command: string;
    readonly passed: boolean;
    readonly evidenceRef: string;
  };
  readonly gates: {
    readonly codexLocalHostActivation: {
      readonly status: CodexHostActivationReadback["status"];
      readonly artifactVersion: string;
      readonly artifactSha256: string | null;
      readonly observesHostToolInvocation: boolean;
      readonly authorityCreated: boolean;
      readonly evidenceRefs: readonly string[];
    };
    readonly publicDistributionAndRegistry: {
      readonly status: DistributionProvenanceReadback["status"];
      readonly localVersion: string;
      readonly npmLatestVersion: string | null;
      readonly currentSurfacePublished: boolean;
      readonly mcpRegistryAccepted: boolean;
      readonly mcpRegistryDiscoverable: boolean;
      readonly provenanceAttempted: boolean;
      readonly provenanceSupported: boolean | null;
      readonly proofGapReasonCodes: readonly string[];
      readonly evidenceRefs: readonly string[];
    };
    readonly customerGatewayLiveX402PaidProof: {
      readonly status: LiveX402RequirementReadback["status"];
      readonly customerGatewayCustodyPresent: boolean;
      readonly livePaidRetryPerformed: boolean;
      readonly terminalReadbackPresent: boolean;
      readonly signerInvocationPosture: "post_gateway_check_only" | "not_observed" | "unsafe_or_unknown";
      readonly proofGapReasonCodes: readonly string[];
      readonly evidenceRefs: readonly string[];
    };
    readonly authMdX402AdmissionPacket: {
      readonly packetVersion: "v0";
      readonly packetProjectorPresent: boolean;
      readonly refusalFirstTestsPassed: boolean;
      readonly redactedReadbackTestsPassed: boolean;
      readonly createsAuthority: boolean;
      readonly evidenceRefs: readonly string[];
    };
  };
};

export type ProductCompletionReadback = ReturnType<typeof projectProductCompletionReadback>;

export function projectProductCompletionReadback(input: ProductCompletionReadbackInput) {
  const gateResults = [
    productCompletionGateResult({
      gateId: "codex_local_host_activation",
      title: "Codex-local runtime activation from pinned current-surface artifact",
      completed:
        input.gates.codexLocalHostActivation.status === "host_tool_invocation_observed" &&
        input.gates.codexLocalHostActivation.observesHostToolInvocation &&
        !input.gates.codexLocalHostActivation.authorityCreated,
      hardBlocked: false,
      blockers: [],
      evidenceRefs: input.gates.codexLocalHostActivation.evidenceRefs,
    }),
    productCompletionGateResult({
      gateId: "public_distribution_and_registry",
      title: "Public package distribution, provenance posture, and MCP Registry lookup",
      completed: input.gates.publicDistributionAndRegistry.status === "registry_discoverable",
      hardBlocked:
        !input.gates.publicDistributionAndRegistry.currentSurfacePublished &&
        input.gates.publicDistributionAndRegistry.provenanceAttempted &&
        input.gates.publicDistributionAndRegistry.provenanceSupported === false &&
        !input.gates.publicDistributionAndRegistry.mcpRegistryDiscoverable,
      blockers: input.gates.publicDistributionAndRegistry.proofGapReasonCodes,
      evidenceRefs: input.gates.publicDistributionAndRegistry.evidenceRefs,
    }),
    productCompletionGateResult({
      gateId: "customer_gateway_live_x402_paid_proof",
      title: "Customer-gateway-held live x402 paid proof through Handshake",
      completed:
        input.gates.customerGatewayLiveX402PaidProof.customerGatewayCustodyPresent &&
        input.gates.customerGatewayLiveX402PaidProof.livePaidRetryPerformed &&
        input.gates.customerGatewayLiveX402PaidProof.terminalReadbackPresent &&
        input.gates.customerGatewayLiveX402PaidProof.signerInvocationPosture === "post_gateway_check_only",
      hardBlocked:
        !input.gates.customerGatewayLiveX402PaidProof.customerGatewayCustodyPresent &&
        input.gates.customerGatewayLiveX402PaidProof.proofGapReasonCodes.includes(
          "customer_gateway_custody_packet_absent",
        ),
      blockers: input.gates.customerGatewayLiveX402PaidProof.proofGapReasonCodes,
      evidenceRefs: input.gates.customerGatewayLiveX402PaidProof.evidenceRefs,
    }),
    productCompletionGateResult({
      gateId: "auth_md_x402_admission_packet",
      title: "auth.md+x402 admission packet v0 with refusal tests and redacted readback",
      completed:
        input.gates.authMdX402AdmissionPacket.packetProjectorPresent &&
        input.gates.authMdX402AdmissionPacket.refusalFirstTestsPassed &&
        input.gates.authMdX402AdmissionPacket.redactedReadbackTestsPassed &&
        !input.gates.authMdX402AdmissionPacket.createsAuthority,
      hardBlocked: false,
      blockers: [],
      evidenceRefs: input.gates.authMdX402AdmissionPacket.evidenceRefs,
    }),
  ];
  const incompleteGateIds = gateResults
    .filter((result) => result.status !== "completed" && result.status !== "hard_blocked")
    .map((result) => result.gateId);
  const hardBlockedGateIds = gateResults
    .filter((result) => result.status === "hard_blocked")
    .map((result) => result.gateId);
  const overclaimViolations = productCompletionOverclaimViolations(input);
  const status =
    input.qualityGate.passed && incompleteGateIds.length === 0 && overclaimViolations.length === 0
      ? hardBlockedGateIds.length === 0
        ? ("completed" as const)
        : ("closed_with_hard_blocks" as const)
      : ("incomplete" as const);

  return {
    proofKind: "product_completion_readback" as const,
    proofVersion: PROOF_PACKET_VERSION,
    generatedAt: input.generatedAt,
    status,
    scope:
      "Aggregate source-owned closeout readback for the four product gates. This object audits evidence posture only; it creates no authority.",
    qualityGate: input.qualityGate,
    gates: gateResults,
    incompleteGateIds,
    hardBlockedGateIds,
    overclaimViolations,
    commandRefs: input.commandRefs,
    evidenceRefs: [input.qualityGate.evidenceRef, ...gateResults.flatMap((result) => result.evidenceRefs)],
    authorityBoundary: {
      ...nonAuthorityBoundary,
      createsRelease: false as const,
      publishesPackage: false as const,
      registersMcpServer: false as const,
      configuresHost: false as const,
      resolvesCredential: false as const,
      invokesSigner: false as const,
      createsPaymentPayload: false as const,
      createsPaymentSignature: false as const,
      exportsReceipt: false as const,
      hostsOperation: false as const,
      certifiesMarketplace: false as const,
    },
    nextMechanism:
      status === "completed"
        ? "Move from local/product-surface closeout to hosted operation design."
        : hardBlockedGateIds.includes("public_distribution_and_registry")
          ? "Resolve public distribution: publish the current package with provenance support or explicitly accept the no-provenance release risk, then verify npm and MCP Registry readback."
          : "Resolve the remaining incomplete gate with source-owned evidence before claiming product closeout.",
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

function distributionProofGaps(input: {
  readonly npmLatestStatus: number | null;
  readonly npmLatestMatchesLocalVersion: boolean;
  readonly missingLocalExports: readonly string[];
  readonly currentSurfacePublished: boolean;
  readonly mcpRegistryAccepted: boolean;
  readonly mcpRegistryDiscoverable: boolean;
  readonly publishAttempt: DistributionPublishAttemptReadback | null;
}): ProofGap[] {
  const gaps: ProofGap[] = [];
  if (input.npmLatestStatus !== 200) {
    gaps.push(
      gap(
        "npm_latest_readback_failed",
        "Current package distribution cannot be claimed without npm registry readback.",
      ),
    );
  }
  if (input.npmLatestStatus === 200 && !input.npmLatestMatchesLocalVersion) {
    gaps.push(
      gap("npm_latest_version_does_not_match_local", "The local package version is not the public latest version."),
    );
  }
  if (input.missingLocalExports.length > 0) {
    gaps.push(
      gap(
        "npm_latest_missing_current_local_exports",
        `Public npm latest does not include current local exports: ${input.missingLocalExports.join(", ")}.`,
      ),
    );
  }
  if (!input.currentSurfacePublished) {
    gaps.push(
      gap(
        "current_surface_not_publicly_published",
        "Public npm availability does not yet prove the current local product surface.",
      ),
    );
  }
  if (!input.mcpRegistryAccepted) {
    gaps.push(
      gap("mcp_registry_lookup_not_accepted", "MCP Registry direct lookup does not return the Handshake server."),
    );
  }
  if (!input.mcpRegistryDiscoverable) {
    gaps.push(
      gap(
        "mcp_registry_discoverability_not_verified",
        "MCP Registry search/discovery does not prove the Handshake server is discoverable.",
      ),
    );
  }
  if (
    input.publishAttempt?.attempted === true &&
    input.publishAttempt.provenanceRequested &&
    input.publishAttempt.status === "failed" &&
    input.publishAttempt.provenanceSupported === false
  ) {
    gaps.push(
      gap(
        "npm_provenance_generation_unsupported",
        "npm rejected trusted provenance generation in this local provider context; publishing without provenance requires explicit release-risk acceptance.",
      ),
    );
  }
  return gaps;
}

function liveX402ProofGaps(input: { readonly responseStatus: number; readonly custodyPresent: boolean }): ProofGap[] {
  const gaps: ProofGap[] = [];
  if (input.responseStatus !== 402) {
    gaps.push(
      gap(
        "live_x402_payment_required_not_observed",
        "The live endpoint did not return HTTP 402 in the captured response.",
      ),
    );
  }
  if (!input.custodyPresent) {
    gaps.push(
      gap(
        "customer_gateway_custody_packet_absent",
        "A live 402 challenge does not prove customer-gateway-held signer custody.",
      ),
    );
  }
  gaps.push(gap("live_paid_retry_not_performed", "No post-VerifiedGatewayCheck live x402 signed retry was performed."));
  gaps.push(
    gap(
      "settlement_finality_not_proven",
      "A challenge readback does not prove settlement finality or downstream business success.",
    ),
  );
  return gaps;
}

function productCompletionGateResult(input: {
  readonly gateId: ProductCompletionGateId;
  readonly title: string;
  readonly completed: boolean;
  readonly hardBlocked: boolean;
  readonly blockers: readonly string[];
  readonly evidenceRefs: readonly string[];
}) {
  const status: ProductCompletionGateStatus = input.completed
    ? "completed"
    : input.hardBlocked
      ? "hard_blocked"
      : "incomplete";
  return {
    gateId: input.gateId,
    title: input.title,
    status,
    blockers: [...input.blockers].sort(),
    evidenceRefs: [...input.evidenceRefs],
  };
}

function productCompletionOverclaimViolations(input: ProductCompletionReadbackInput): string[] {
  const violations: string[] = [];
  if (input.gates.codexLocalHostActivation.authorityCreated) {
    violations.push("codex_host_activation_claims_authority");
  }
  if (input.gates.publicDistributionAndRegistry.status === "registry_discoverable") {
    if (
      !input.gates.publicDistributionAndRegistry.currentSurfacePublished ||
      !input.gates.publicDistributionAndRegistry.mcpRegistryAccepted ||
      !input.gates.publicDistributionAndRegistry.mcpRegistryDiscoverable
    ) {
      violations.push("distribution_status_exceeds_public_readback");
    }
  }
  if (
    input.gates.customerGatewayLiveX402PaidProof.livePaidRetryPerformed &&
    input.gates.customerGatewayLiveX402PaidProof.signerInvocationPosture !== "post_gateway_check_only"
  ) {
    violations.push("live_paid_retry_without_post_gateway_signer_posture");
  }
  if (input.gates.authMdX402AdmissionPacket.createsAuthority) {
    violations.push("auth_md_x402_packet_claims_authority");
  }
  if (!input.qualityGate.passed) violations.push("quality_gate_not_passing");
  return violations.sort();
}

function gap(reasonCode: string, nonClaim: string): ProofGap {
  return { reasonCode, nonClaim };
}

type TomlSection = {
  readonly name: string;
  readonly kind: "mcp_server" | "mcp_server_env" | "other";
  readonly body: readonly string[];
};

function parseTomlSections(configText: string): TomlSection[] {
  const sections: TomlSection[] = [];
  let current: { name: string; kind: TomlSection["kind"]; body: string[] } | null = null;
  for (const line of configText.split(/\r?\n/u)) {
    const header = parseTomlHeader(line);
    if (header) {
      if (current) sections.push(current);
      current = {
        name: header.name,
        kind: header.kind,
        body: [],
      };
      continue;
    }
    if (current) current.body.push(line);
  }
  if (current) sections.push(current);
  return sections;
}

function parseTomlHeader(line: string): { readonly name: string; readonly kind: TomlSection["kind"] } | null {
  const trimmed = line.trim();
  const mcpServer = /^\[mcp_servers\.([^\].\n]+)\]$/u.exec(trimmed);
  if (mcpServer?.[1]) return { name: mcpServer[1], kind: "mcp_server" };
  const mcpServerEnv = /^\[mcp_servers\.([^\].\n]+)\.env\]$/u.exec(trimmed);
  if (mcpServerEnv?.[1]) return { name: mcpServerEnv[1], kind: "mcp_server_env" };
  if (/^\[.+\]$/u.test(trimmed)) return { name: trimmed, kind: "other" };
  return null;
}

function parseCodexMcpServerEnvKeys(sections: readonly TomlSection[], serverName: string): string[] {
  return sections
    .filter((section) => section.kind === "mcp_server_env" && section.name === serverName)
    .flatMap((section) =>
      section.body.flatMap((line) => {
        const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/u.exec(line);
        return match?.[1] ? [match[1]] : [];
      }),
    )
    .sort();
}

function parseTomlStringField(lines: readonly string[], key: string): string | null {
  const pattern = new RegExp(`^\\s*${escapeRegExp(key)}\\s*=\\s*(".*")\\s*$`, "u");
  for (const line of lines) {
    const match = pattern.exec(line);
    if (!match?.[1]) continue;
    try {
      const value = JSON.parse(match[1]);
      return typeof value === "string" ? value : null;
    } catch {
      return null;
    }
  }
  return null;
}

function parseTomlStringArrayField(lines: readonly string[], key: string): string[] | null {
  const pattern = new RegExp(`^\\s*${escapeRegExp(key)}\\s*=\\s*(\\[.*\\])\\s*$`, "u");
  for (const line of lines) {
    const match = pattern.exec(line);
    if (!match?.[1]) continue;
    try {
      const value = JSON.parse(match[1]);
      return Array.isArray(value) && value.every((entry) => typeof entry === "string") ? value : null;
    } catch {
      return null;
    }
  }
  return null;
}

function parseTomlNumberField(lines: readonly string[], key: string): number | null {
  const pattern = new RegExp(`^\\s*${escapeRegExp(key)}\\s*=\\s*([0-9]+)\\s*$`, "u");
  for (const line of lines) {
    const match = pattern.exec(line);
    if (!match?.[1]) continue;
    const value = Number.parseInt(match[1], 10);
    return Number.isFinite(value) ? value : null;
  }
  return null;
}

function lastMcpSectionEndIndex(lines: readonly string[]): number {
  let lastMcpHeaderIndex = -1;
  lines.forEach((line, index) => {
    const header = parseTomlHeader(line);
    if (header?.kind === "mcp_server" || header?.kind === "mcp_server_env") lastMcpHeaderIndex = index;
  });
  if (lastMcpHeaderIndex === -1) {
    const firstSectionIndex = lines.findIndex((line) => parseTomlHeader(line) !== null);
    return firstSectionIndex === -1 ? lines.length : firstSectionIndex;
  }
  let index = lastMcpHeaderIndex + 1;
  while (index < lines.length && !parseTomlHeader(lines[index] ?? "")) index += 1;
  return index;
}

function isCodexMcpServerHeader(
  header: { readonly name: string; readonly kind: TomlSection["kind"] },
  serverName: string,
) {
  return (header.kind === "mcp_server" || header.kind === "mcp_server_env") && header.name === serverName;
}

function trimTrailingBlankLines(lines: readonly string[]): string[] {
  const output = [...lines];
  while (output.length > 0 && output.at(-1)?.trim() === "") output.pop();
  return output;
}

function trimLeadingBlankLines(lines: readonly string[]): string[] {
  const output = [...lines];
  while (output.length > 0 && output[0]?.trim() === "") output.shift();
  return output;
}

function tomlString(value: string): string {
  return JSON.stringify(value);
}

function arrayEquals(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((entry, index) => entry === right[index]);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function stableDigest(value: unknown): `sha256:${string}` {
  return `sha256:${sha256Text(stableStringify(value))}`;
}

function sha256Text(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}
