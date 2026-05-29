import { describe, expect, it } from "bun:test";
import packageJson from "../../package.json";
import {
  buildCodexMcpServerTomlBlock,
  parseCodexMcpServerNames,
  parseCodexMcpServerRecords,
  projectCleanInstalledActivationProof,
  projectCodexHostActivationReadback,
  projectDistributionProvenanceReadback,
  projectLiveX402RequirementReadback,
  projectProductCompletionReadback,
  upsertCodexMcpServerToml,
} from "../../src/surfaces/proof-packets";

describe("proof packet projectors", () => {
  it("keeps clean installed activation proof non-authority and explicit about remaining gaps", () => {
    const proof = projectCleanInstalledActivationProof({
      generatedAt: "2026-05-25T00:00:00.000Z",
      package: {
        name: packageJson.name,
        version: packageJson.version,
        packedFile: "handshake-protocol-kernel-0.2.8.tgz",
        localArtifactPath: ".planning/artifacts/handshake-protocol-kernel-0.2.8.tgz",
        tarballSha256: "a".repeat(64),
        tarballSizeBytes: 123,
        npmIntegrity: "sha512-example",
        npmShasum: "b".repeat(40),
        fileCount: 321,
      },
      requiredInstalledSurfaces: {
        bins: ["handshake", "handshake-mcp", "handshake-protocol-kernel"],
        exports: [".", "./x402-protected-tool"],
        protectedToolExports: ["prepareProtectedX402ToolDispatch"],
      },
      activationEvidence: {
        facadeImportSource: "clean_installed_package",
        runtimeDispatchPrepared: true,
        gatewayAdmissionStatus: "admitted",
        downstreamOutcomeStatus: "pending",
        policyDecision: "greenlight",
        gateDecision: "passed",
        changedParameterDecision: "refused",
        replayDecision: "refused",
        signerInvocationsAfterGatewayAdmission: 1,
        signerInvocationsAfterReplay: 1,
        hostileGeneratedExecutionCaseIds: ["raw_x402_payment_payload_input"],
        rawCredentialMaterialVisible: false,
        outputRefs: ["examples/x402-protected-spend/output/latest.json"],
      },
      commandRefs: ["npm run build", "node scripts/check-clean-installed-activation.mjs"],
    });

    expect(proof.proofKind).toBe("clean_installed_activation_proof");
    expect(proof.status).toBe("local_activation_passed");
    expect(proof.authorityBoundary.createsAuthority).toBe(false);
    expect(proof.authorityBoundary.performsGatewayCheck).toBe(false);
    expect(proof.authorityBoundary.invokesSigner).toBe(false);
    expect(proof.proofGaps.map((gap) => gap.reasonCode)).toEqual([
      "live_codex_host_not_configured_by_clean_install_check",
      "mcp_registry_discoverability_not_checked_by_clean_install_check",
      "public_npm_current_surface_not_checked_by_clean_install_check",
      "customer_gateway_live_payment_not_checked_by_clean_install_check",
    ]);
  });

  it("parses only top-level Codex MCP server names", () => {
    expect(
      parseCodexMcpServerNames(`
[mcp_servers.exa]
url = "https://mcp.exa.ai/mcp?exaApiKey=secret"

[mcp_servers.node_repl]
command = "node"

[mcp_servers.node_repl.env]
SECRET = "hidden"
`),
    ).toEqual(["exa", "node_repl"]);
  });

  it("parses Codex MCP command and args without carrying env values", () => {
    expect(
      parseCodexMcpServerRecords(`
[mcp_servers.handshake_x402]
command = "/Users/joelchan/.nvm/versions/node/v25.2.1/bin/node"
args = ["/Users/joelchan/.codex/handshake/activations/handshake_x402/pkg/dist/bin/handshake-mcp.mjs"]
startup_timeout_sec = 120

[mcp_servers.handshake_x402.env]
SECRET_TOKEN = "redacted-value"
`),
    ).toEqual([
      {
        name: "handshake_x402",
        command: "/Users/joelchan/.nvm/versions/node/v25.2.1/bin/node",
        args: ["/Users/joelchan/.codex/handshake/activations/handshake_x402/pkg/dist/bin/handshake-mcp.mjs"],
        startupTimeoutSec: 120,
        envKeys: ["SECRET_TOKEN"],
      },
    ]);
  });

  it("upserts the Codex MCP server block without preserving stale sibling env values", () => {
    const serverBlock = buildCodexMcpServerTomlBlock({
      name: "handshake_x402",
      command: "/usr/local/bin/node",
      args: ["/tmp/handshake/dist/bin/handshake-mcp.mjs"],
    });
    const result = upsertCodexMcpServerToml({
      serverName: "handshake_x402",
      serverBlockToml: serverBlock,
      existingToml: `
model = "gpt-5.5"

[mcp_servers.exa]
url = "https://example.invalid"

[mcp_servers.handshake_x402]
command = "npx"
args = ["handshake-mcp"]

[mcp_servers.handshake_x402.env]
STALE_SECRET = "must-not-survive"

[projects."/repo"]
trust_level = "trusted"
`,
    });

    expect(result.changed).toBe(true);
    expect(result.toml).toContain(`[mcp_servers.handshake_x402]\ncommand = "/usr/local/bin/node"`);
    expect(result.toml).toContain(`args = ["/tmp/handshake/dist/bin/handshake-mcp.mjs"]`);
    expect(result.toml).not.toContain("STALE_SECRET");
    expect(result.toml.indexOf("[mcp_servers.handshake_x402]")).toBeLessThan(result.toml.indexOf("[projects."));
  });

  it("records absent handshake_x402 host config as a blocker without carrying config contents", () => {
    const proof = projectCodexHostActivationReadback({
      generatedAt: "2026-05-25T00:00:00.000Z",
      commandRefs: ["node scripts/check-codex-host-activation.mjs"],
      configPath: "/Users/joelchan/.codex/config.toml",
      configExists: true,
      configSha256: "a".repeat(64),
      configText: `
[mcp_servers.exa]
url = "https://mcp.exa.ai/mcp?exaApiKey=secret"
`,
      expectedArtifact: {
        path: ".planning/artifacts/handshake-protocol-kernel-0.2.8.tgz",
        exists: true,
        sha256: "b".repeat(64),
        sizeBytes: 123,
      },
    });
    const serialized = JSON.stringify(proof);

    expect(proof.status).toBe("blocked");
    expect(proof.config.observedMcpServers).toEqual(["exa"]);
    expect(proof.config.targetPresent).toBe(false);
    expect(proof.proofGaps.map((gap) => gap.reasonCode)).toEqual([
      "codex_handshake_x402_mcp_server_absent",
      "host_origin_tool_invocation_not_exercised",
    ]);
    expect(serialized).not.toContain("secret");
    expect(proof.authorityBoundary.observesHostToolInvocation).toBe(false);
  });

  it("blocks Codex host readback when the server name exists but is not pinned to the expected artifact executable", () => {
    const proof = projectCodexHostActivationReadback({
      generatedAt: "2026-05-25T00:00:00.000Z",
      commandRefs: ["node scripts/check-codex-host-activation.mjs"],
      configPath: "/Users/joelchan/.codex/config.toml",
      configExists: true,
      configSha256: "a".repeat(64),
      configText: '[mcp_servers.handshake_x402]\ncommand = "npx"\nargs = ["handshake-mcp"]\n',
      expectedServer: expectedCodexServer(),
      expectedArtifact: {
        path: ".planning/artifacts/handshake-protocol-kernel-0.2.8.tgz",
        exists: true,
        sha256: "b".repeat(64),
        sizeBytes: 123,
      },
    });

    expect(proof.status).toBe("blocked");
    expect(proof.config.targetPresent).toBe(true);
    expect(proof.config.expectedServerMatches).toBe(false);
    expect(proof.proofGaps.map((gap) => gap.reasonCode)).toEqual([
      "codex_handshake_x402_mcp_server_config_mismatch",
      "host_origin_tool_invocation_not_exercised",
    ]);
  });

  it("separates configured Codex host readback from host-origin tool invocation proof", () => {
    const proof = projectCodexHostActivationReadback({
      generatedAt: "2026-05-25T00:00:00.000Z",
      commandRefs: ["node scripts/check-codex-host-activation.mjs"],
      configPath: "/Users/joelchan/.codex/config.toml",
      configExists: true,
      configSha256: "a".repeat(64),
      configText:
        '[mcp_servers.handshake_x402]\ncommand = "/usr/local/bin/node"\nargs = ["/tmp/handshake/dist/bin/handshake-mcp.mjs"]\n',
      expectedServer: expectedCodexServer(),
      expectedArtifact: {
        path: ".planning/artifacts/handshake-protocol-kernel-0.2.8.tgz",
        exists: true,
        sha256: "b".repeat(64),
        sizeBytes: 123,
      },
    });

    expect(proof.status).toBe("configured_unverified");
    expect(proof.config.targetPresent).toBe(true);
    expect(proof.proofGaps.map((gap) => gap.reasonCode)).toEqual(["host_origin_tool_invocation_not_exercised"]);
    expect(proof.nextMechanism).toContain("Exercise `handshake.actions.x402_payment.propose`");
  });

  it("records Codex host tool invocation without converting it into authority", () => {
    const proof = projectCodexHostActivationReadback({
      generatedAt: "2026-05-25T00:00:00.000Z",
      commandRefs: ["codex exec --ephemeral ..."],
      configPath: "/Users/joelchan/.codex/config.toml",
      configExists: true,
      configSha256: "a".repeat(64),
      configText:
        '[mcp_servers.handshake_x402]\ncommand = "/usr/local/bin/node"\nargs = ["/tmp/handshake/dist/bin/handshake-mcp.mjs"]\n',
      expectedServer: expectedCodexServer(),
      hostToolInvocation: {
        proofRef: ".planning/evidence/codex-exec-handshake-x402-readback.txt",
        toolVisible: true,
        toolCallAttempted: true,
        outcome: "input_validation_error_missing_required_fields",
        nonAuthorityClaims: [
          "empty_json_object_only",
          "no_credentials_provided",
          "no_payment_performed",
          "no_authority_granted",
          "no_protected_action_proposed",
        ],
      },
      expectedArtifact: {
        path: ".planning/artifacts/handshake-protocol-kernel-0.2.8.tgz",
        exists: true,
        sha256: "b".repeat(64),
        sizeBytes: 123,
      },
    });

    expect(proof.status).toBe("host_tool_invocation_observed");
    expect(proof.config.hostToolInvocationObserved).toBe(true);
    expect(proof.authorityBoundary.observesHostToolInvocation).toBe(true);
    expect(proof.authorityBoundary.createsAuthority).toBe(false);
    expect(proof.authorityBoundary.performsGatewayCheck).toBe(false);
    expect(proof.proofGaps).toEqual([]);
  });

  it("blocks distribution when npm latest is stale and MCP Registry is absent", () => {
    const proof = projectDistributionProvenanceReadback({
      generatedAt: "2026-05-25T00:00:00.000Z",
      localPackage: localPackage([".", "./adapter-sdk", "./x402-protected-tool"]),
      npmLatest: {
        url: "https://registry.npmjs.org/handshake-protocol-kernel/latest",
        status: 200,
        version: packageJson.version,
        tarball: "https://registry.npmjs.org/example.tgz",
        integrity: "sha512-example",
        shasum: "example",
        signatureCount: 1,
        fileCount: 288,
        exports: ["."],
      },
      mcpRegistry: {
        lookupUrl: "https://registry.modelcontextprotocol.io/example",
        lookupStatus: 404,
        lookupProblemTitle: "Not Found",
        searchUrl: "https://registry.modelcontextprotocol.io/search",
        searchStatus: 200,
        searchCount: 0,
      },
      evidenceRefs: ["evidence:npm", "evidence:mcp"],
      commandRefs: ["node scripts/check-distribution-provenance.mjs"],
    });

    expect(proof.status).toBe("blocked");
    expect(proof.npmLatest.missingLocalExports).toEqual(["./adapter-sdk", "./x402-protected-tool"]);
    expect(proof.mcpRegistry.discoverable).toBe(false);
    expect(proof.proofGaps.map((gap) => gap.reasonCode)).toEqual([
      "npm_latest_missing_current_local_exports",
      "current_surface_not_publicly_published",
      "mcp_registry_lookup_not_accepted",
      "mcp_registry_discoverability_not_verified",
    ]);
  });

  it("marks distribution discoverable only after current exports and MCP lookup/search are proven", () => {
    const exports = Object.keys(packageJson.exports).sort();
    const proof = projectDistributionProvenanceReadback({
      generatedAt: "2026-05-25T00:00:00.000Z",
      localPackage: localPackage(exports),
      npmLatest: {
        url: "https://registry.npmjs.org/handshake-protocol-kernel/latest",
        status: 200,
        version: packageJson.version,
        tarball: "https://registry.npmjs.org/example.tgz",
        integrity: "sha512-example",
        shasum: "example",
        signatureCount: 1,
        fileCount: 321,
        exports,
      },
      mcpRegistry: {
        lookupUrl: "https://registry.modelcontextprotocol.io/example",
        lookupStatus: 200,
        lookupProblemTitle: null,
        searchUrl: "https://registry.modelcontextprotocol.io/search",
        searchStatus: 200,
        searchCount: 1,
      },
      evidenceRefs: ["evidence:npm", "evidence:mcp"],
      commandRefs: ["node scripts/check-distribution-provenance.mjs"],
    });

    expect(proof.status).toBe("registry_discoverable");
    expect(proof.proofGaps).toEqual([]);
    expect(proof.authorityBoundary.createsAuthority).toBe(false);
    expect(proof.authorityBoundary.performsGatewayCheck).toBe(false);
  });

  it("records unsupported npm provenance as a distribution proof gap", () => {
    const exports = Object.keys(packageJson.exports).sort();
    const proof = projectDistributionProvenanceReadback({
      generatedAt: "2026-05-25T00:00:00.000Z",
      localPackage: localPackage(exports),
      npmLatest: {
        url: "https://registry.npmjs.org/handshake-protocol-kernel/latest",
        status: 200,
        version: "0.2.5",
        tarball: "https://registry.npmjs.org/example.tgz",
        integrity: "sha512-example",
        shasum: "example",
        signatureCount: 1,
        fileCount: 321,
        exports,
      },
      mcpRegistry: {
        lookupUrl: "https://registry.modelcontextprotocol.io/example",
        lookupStatus: 404,
        lookupProblemTitle: "Not Found",
        searchUrl: "https://registry.modelcontextprotocol.io/search",
        searchStatus: 200,
        searchCount: 0,
      },
      publishAttempt: {
        attempted: true,
        commandRef: "npm --cache /tmp/handshake-npm-cache publish --provenance --access public",
        status: "failed",
        provenanceRequested: true,
        provenanceSupported: false,
        errorCode: "EUSAGE",
        errorMessage: "Automatic provenance generation not supported for provider: null",
        evidenceRef: "publish-attempt:sha256:abc",
      },
      evidenceRefs: ["evidence:npm", "evidence:mcp", "publish-attempt:sha256:abc"],
      commandRefs: ["node scripts/check-distribution-provenance.mjs"],
    });

    expect(proof.publishAttempt?.provenanceSupported).toBe(false);
    expect(proof.proofGaps.map((gap) => gap.reasonCode)).toContain("npm_provenance_generation_unsupported");
  });

  it("turns a live x402 challenge into non-authority readback and blocks without customer custody", () => {
    const proof = projectLiveX402RequirementReadback({
      generatedAt: "2026-05-25T00:00:00.000Z",
      commandRefs: ["node scripts/check-live-x402-proof.mjs"],
      request: {
        method: "GET",
        url: "https://regimeshift.xyz/api/v1/asset/eth/vrp",
        responseStatus: 402,
        providerEnvironmentPosture: "live",
        headersEvidenceRef: "live-x402-headers:sha256:abc",
      },
      paymentRequiredHeader: base64Json(livePaymentRequired()),
      selectedPaymentRequirementIndex: 0,
      customerGatewayCustody: {
        present: false,
        proofRef: null,
        digest: null,
      },
    });

    expect(proof.status).toBe("blocked");
    expect(proof.paymentRequired.selectedPaymentRequirement).toMatchObject({
      scheme: "exact",
      network: "eip155:8453",
      amount: "5000",
    });
    expect(proof.authorityBoundary.createsGreenlight).toBe(false);
    expect(proof.authorityBoundary.invokesSigner).toBe(false);
    expect(proof.proofGaps.map((gap) => gap.reasonCode)).toEqual([
      "customer_gateway_custody_packet_absent",
      "live_paid_retry_not_performed",
      "settlement_finality_not_proven",
    ]);
  });

  it("aggregates product gates without hiding hard blockers or dual-enforcement proof gaps", () => {
    const readback = projectProductCompletionReadback({
      generatedAt: "2026-05-25T00:00:00.000Z",
      commandRefs: ["npm run check:repo", "node scripts/check-distribution-provenance.mjs"],
      qualityGate: {
        command: "npm run check:repo",
        passed: true,
        evidenceRef: "quality-gate:npm-run-check-repo:598-pass",
      },
      gates: {
        codexLocalHostActivation: {
          status: "host_tool_invocation_observed",
          artifactVersion: packageJson.version,
          artifactSha256: "a".repeat(64),
          observesHostToolInvocation: true,
          authorityCreated: false,
          evidenceRefs: ["codex-host-activation-readback.json"],
        },
        publicDistributionAndRegistry: {
          status: "blocked",
          localVersion: packageJson.version,
          npmLatestVersion: "0.2.5",
          currentSurfacePublished: false,
          mcpRegistryAccepted: false,
          mcpRegistryDiscoverable: false,
          provenanceAttempted: true,
          provenanceSupported: false,
          proofGapReasonCodes: [
            "current_surface_not_publicly_published",
            "mcp_registry_discoverability_not_verified",
            "npm_provenance_generation_unsupported",
          ],
          evidenceRefs: ["distribution-provenance-readback.json"],
        },
        customerGatewayLiveX402PaidProof: {
          status: "blocked",
          customerGatewayCustodyPresent: false,
          livePaidRetryPerformed: false,
          terminalReadbackPresent: false,
          signerInvocationPosture: "not_observed",
          proofGapReasonCodes: ["customer_gateway_custody_packet_absent", "live_paid_retry_not_performed"],
          evidenceRefs: ["live-x402-requirement-readback.json"],
        },
        authMdX402AdmissionPacket: {
          packetVersion: "v0",
          packetProjectorPresent: true,
          refusalFirstTestsPassed: true,
          redactedReadbackTestsPassed: true,
          createsAuthority: false,
          evidenceRefs: ["auth-md-x402-interlock-packet.test.ts"],
        },
        dualEnforcementPosture: {
          dualEnforcementPostureTestPassed: false,
          mutationManifestGatingTestPassed: false,
          evidenceRefs: [],
        },
        perCustomerBypassScaffold: {
          customerOnboardingRef: null,
          firstPartyDogfoodCustomerId: null,
          evidenceRefs: ["per-customer-bypass-scaffold-readback.json"],
        },
      },
    });

    expect(readback.status).toBe("incomplete");
    expect(readback.incompleteGateIds).toEqual(["dual_enforcement_posture"]);
    expect(readback.hardBlockedGateIds).toEqual([
      "public_distribution_and_registry",
      "customer_gateway_live_x402_paid_proof",
      "per_customer_bypass_scaffold",
    ]);
    expect(readback.overclaimViolations).toEqual([]);
    expect(readback.authorityBoundary.createsAuthority).toBe(false);
    expect(readback.authorityBoundary.publishesPackage).toBe(false);
    expect(readback.authorityBoundary.invokesSigner).toBe(false);
  });

  it("refuses aggregate closeout when any gate overclaims authority", () => {
    const readback = projectProductCompletionReadback({
      generatedAt: "2026-05-25T00:00:00.000Z",
      commandRefs: ["npm run check:repo"],
      qualityGate: {
        command: "npm run check:repo",
        passed: true,
        evidenceRef: "quality-gate:npm-run-check-repo",
      },
      gates: {
        codexLocalHostActivation: {
          status: "host_tool_invocation_observed",
          artifactVersion: packageJson.version,
          artifactSha256: "a".repeat(64),
          observesHostToolInvocation: true,
          authorityCreated: true,
          evidenceRefs: ["bad-codex-readback.json"],
        },
        publicDistributionAndRegistry: {
          status: "registry_discoverable",
          localVersion: packageJson.version,
          npmLatestVersion: packageJson.version,
          currentSurfacePublished: true,
          mcpRegistryAccepted: true,
          mcpRegistryDiscoverable: true,
          provenanceAttempted: true,
          provenanceSupported: true,
          proofGapReasonCodes: [],
          evidenceRefs: ["distribution-provenance-readback.json"],
        },
        customerGatewayLiveX402PaidProof: {
          status: "ready_for_gateway_signed_retry",
          customerGatewayCustodyPresent: true,
          livePaidRetryPerformed: true,
          terminalReadbackPresent: true,
          signerInvocationPosture: "post_gateway_check_only",
          proofGapReasonCodes: [],
          evidenceRefs: ["live-x402-terminal-readback.json"],
        },
        authMdX402AdmissionPacket: {
          packetVersion: "v0",
          packetProjectorPresent: true,
          refusalFirstTestsPassed: true,
          redactedReadbackTestsPassed: true,
          createsAuthority: true,
          evidenceRefs: ["bad-auth-md-x402-packet.json"],
        },
      },
    });

    expect(readback.status).toBe("incomplete");
    expect(readback.overclaimViolations).toEqual([
      "auth_md_x402_packet_claims_authority",
      "codex_host_activation_claims_authority",
    ]);
  });
});

function expectedCodexServer() {
  return {
    name: "handshake_x402",
    command: "/usr/local/bin/node",
    args: ["/tmp/handshake/dist/bin/handshake-mcp.mjs"],
    executablePath: "/tmp/handshake/dist/bin/handshake-mcp.mjs",
    artifactSha256: "b".repeat(64),
  };
}

function localPackage(exports: readonly string[]) {
  return {
    name: packageJson.name,
    version: packageJson.version,
    mcpName: packageJson.mcpName,
    serverJsonName: packageJson.mcpName,
    serverJsonVersion: packageJson.version,
    exports,
  };
}

function livePaymentRequired() {
  return {
    x402Version: 2,
    resource: {
      url: "https://regimeshift.xyz/api/v1/asset/eth/vrp",
      description: "ETH Volatility Risk Premium",
      mimeType: "application/json",
    },
    accepts: [
      {
        scheme: "exact",
        network: "eip155:8453",
        asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        amount: "5000",
        payTo: "0x82B17D0bb4De9ae6c3491257B60E8245e70acd7B",
        maxTimeoutSeconds: 300,
        extra: {
          name: "USDC",
          version: "2",
        },
      },
    ],
  };
}

function base64Json(value: unknown): string {
  return btoa(JSON.stringify(value));
}
