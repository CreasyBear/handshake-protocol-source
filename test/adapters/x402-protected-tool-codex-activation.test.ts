import { describe, expect, it } from "bun:test";
import {
  buildCodexX402ProtectedToolActivation,
  buildCodexX402ProtectedToolRuntimeTranscript,
  CODEX_X402_PROTECTED_TOOL_ACTIVATION_VERSION,
  CODEX_X402_PROTECTED_TOOL_RUNTIME_TRANSCRIPT_VERSION,
  type CodexX402ProtectedToolActivationInput,
  X402_PROTECTED_TOOL_READINESS_VERSION,
} from "../../src/adapters/x402-payment";
import type { ProtectedX402ToolHostProfileInput } from "../../src/adapters/x402-payment";

const digest = (seed: number): `sha256:${string}` => `sha256:${seed.toString(16).padStart(64, "0")}`;

describe("Codex x402 protected tool activation artifact", () => {
  it("builds a host-specific Codex activation proof packet without creating authority", () => {
    const artifact = buildCodexX402ProtectedToolActivation(validActivationInput());

    expect(artifact).toMatchObject({
      schemaVersion: CODEX_X402_PROTECTED_TOOL_ACTIVATION_VERSION,
      activationId: "activation_codex_x402_local",
      hostFamily: "codex_local",
      packageIdentifier: "handshake-protocol-kernel",
      toolName: "handshake.actions.x402_payment.propose",
      codexConfigTarget: "~/.codex/config.toml",
      mcpServerName: "handshake_x402",
      command: "npx",
      profileOutcome: "profile_prepared",
      profileNextAction: "read_evidence",
      facadeOutcome: "dispatch_block_prepared",
      readinessContractVersion: X402_PROTECTED_TOOL_READINESS_VERSION,
      gatewayReadinessRef: "handshake://local/x402/gateway-readiness.json",
      gatewayReadinessDigest: digest(13),
      rawSiblingPosture: "unknown",
      runtimeDispatchPrepared: true,
      activationPosture: "host_specific_ready",
      manifest: {
        host: {
          hostKind: "local_cli",
        },
        adapter: {
          adapterId: "adapter_pack_x402_protected_tool_codex",
        },
        action: {
          actionClass: "x402_payment.exact",
          protectedSurfaceKind: "x402_payment",
        },
        protectedPath: {
          configuredWrapperPath: "~/.codex/config.toml#mcp_servers.handshake_x402",
          resolvedWrapperPath: "~/.codex/config.toml#mcp_servers.handshake_x402",
        },
      },
      proofPacket: {
        packetKind: "host_specific_bypass_proof_packet",
        postureState: "READY",
        wrapperIntegrity: {
          status: "matched",
        },
        gatewayBinding: {
          status: "bound",
          gatewayCheckObserved: true,
          oneUseGreenlightObserved: true,
          downstreamExecutionRecordedSeparately: true,
        },
      },
      harnessReport: {
        reportKind: "host_bypass_harness_report",
        postureState: "READY",
        authority: {
          reportAuthority: false,
          cliAuthority: false,
          mcpAuthority: false,
          hostWideAuthority: false,
        },
      },
      authorityAudit: {
        authorityCreated: false,
        policyDecisionCreated: false,
        greenlightCreated: false,
        gatewayCheckPerformedByArtifact: false,
        mutationAttemptedByArtifact: false,
        credentialMaterialIncluded: false,
        signerInvokedByArtifact: false,
        paymentMaterialCreatedByArtifact: false,
        hostWideContainmentClaimed: false,
        liveHostMutationClaimed: false,
      },
    });
    expect(artifact.args).toEqual(["-y", "handshake-protocol-kernel@0.2.8", "handshake-mcp"]);
    expect(artifact.manifest.protectedPath.rawSiblingCandidates.map((candidate) => candidate.routeId)).toEqual([
      "raw_sibling_codex_shell_x402_fetch",
      "raw_sibling_codex_mcp_direct_payment",
      "raw_sibling_codex_env_private_key",
    ]);
    expect(artifact.harnessReport.rawSiblingAttempts.map((attempt) => attempt.resultKind)).toEqual([
      "refused",
      "detected",
      "refused",
    ]);
    expect(artifact.proofGaps).toContain("live_user_codex_config_write_not_performed_by_demo");
    expect(artifact.proofGaps).toContain("codex_host_wide_containment_not_claimed");
    expect(artifact.nonClaims).toContain("codex_activation_artifact_is_not_authorization");
    expect(artifact.nonClaims).toContain("codex_activation_artifact_is_not_host_wide_containment");
    expect(JSON.stringify(artifact)).not.toContain("PaymentPayload");
    expect(JSON.stringify(artifact)).not.toContain("PAYMENT-SIGNATURE");
    expect(JSON.stringify(artifact)).not.toContain("privateKey");
    expect(JSON.stringify(artifact)).not.toContain("signerRef");
  });

  it("records raw sibling mutation possibility as not-ready host posture", () => {
    const artifact = buildCodexX402ProtectedToolActivation(
      validActivationInput({
        rawSiblingResults: [
          {
            routeId: "raw_sibling_codex_mcp_direct_payment",
            resultKind: "mutation_possible",
            probeKind: "mcp_direct_call_blocking",
            evidenceRefs: ["evidence:codex-x402-activation:mcp-direct-payment-mutated"],
            proofGapReasonCodes: [],
          },
        ],
      }),
    );

    expect(artifact.activationPosture).toBe("host_specific_not_ready");
    expect(artifact.proofPacket.postureState).toBe("RAW_SIBLING_MUTATION_POSSIBLE");
    expect(artifact.proofPacket.proofGapReasonCodes).toContain("host_raw_sibling_mutation_possible");
    expect(artifact.harnessReport.authority.hostWideAuthority).toBe(false);
  });

  it("builds a Codex-local runtime transcript without turning host evidence into authority", () => {
    const artifact = buildCodexX402ProtectedToolActivation(validActivationInput());
    const transcript = buildCodexX402ProtectedToolRuntimeTranscript({
      transcriptId: "transcript_codex_x402_local_default",
      activationArtifact: artifact,
      observedAt: "2026-05-25T00:00:00.000Z",
      selectionPosture: "local_default_pending_user_confirmation",
      evidenceRefs: ["evidence:codex-x402-runtime-transcript:source-owned-default"],
    });

    expect(transcript).toMatchObject({
      schemaVersion: CODEX_X402_PROTECTED_TOOL_RUNTIME_TRANSCRIPT_VERSION,
      transcriptId: "transcript_codex_x402_local_default",
      selectedHostFamily: "codex_local",
      selectionPosture: "local_default_pending_user_confirmation",
      activationId: "activation_codex_x402_local",
      proposalCompatibility: {
        proposalToolVisible: true,
        proposalOnly: true,
        profileOutcome: "profile_prepared",
        facadeOutcome: "dispatch_block_prepared",
        runtimeDispatchPrepared: true,
        policyDecisionCreated: false,
        greenlightCreated: false,
        gatewayCheckPerformed: false,
      },
      readbackCompatibility: {
        redactedReadbackOnly: true,
        supportBundleIsPermission: false,
        receiptExportCreated: false,
        terminalCertificateMinted: false,
      },
      rawSiblingPosture: {
        postureState: "READY",
        hostWideContainmentClaimed: false,
      },
      authorityAudit: {
        authorityCreated: false,
        gatewayCheckPerformedByTranscript: false,
        mutationAttemptedByTranscript: false,
        liveHostMutationClaimed: false,
        hostWideContainmentClaimed: false,
      },
    });
    expect(transcript.readbackCompatibility.commands).toEqual([
      "handshake evidence contract-view",
      "handshake evidence receipt-timeline",
      "handshake support bundle",
    ]);
    expect(transcript.rawSiblingPosture.rawSiblingAttempts.map((attempt) => attempt.routeId)).toEqual([
      "raw_sibling_codex_shell_x402_fetch",
      "raw_sibling_codex_mcp_direct_payment",
      "raw_sibling_codex_env_private_key",
    ]);
    expect(transcript.unselectedHostPosture.map((host) => host.hostFamily)).toEqual([
      "claude_code_mcp",
      "hermes",
      "openclaw",
      "generic_mcp",
    ]);
    expect(transcript.unselectedHostPosture.every((host) => host.posture === "parity_artifact_only")).toBe(true);
    expect(transcript.proofGaps).toContain("user_final_runtime_selection_not_recorded");
    expect(transcript.proofGaps).toContain("claude_code_mcp_live_runtime_transcript_not_selected");
    expect(transcript.nonClaims).toContain("codex_runtime_transcript_is_not_gateway_check");
    expect(transcript.nonClaims).toContain("unselected_hosts_remain_parity_artifacts");
    expect(JSON.stringify(transcript)).not.toContain("PaymentPayload");
    expect(JSON.stringify(transcript)).not.toContain("PAYMENT-SIGNATURE");
    expect(JSON.stringify(transcript)).not.toContain("privateKey");
  });
});

function validActivationInput(
  overrides: Partial<CodexX402ProtectedToolActivationInput> = {},
): CodexX402ProtectedToolActivationInput {
  return {
    activationId: "activation_codex_x402_local",
    packageIdentifier: "handshake-protocol-kernel",
    packageVersion: "0.2.8",
    profileInput: validProfileInput(),
    codexConfigTarget: "~/.codex/config.toml",
    mcpServerName: "handshake_x402",
    command: "npx",
    args: ["-y", "handshake-protocol-kernel@0.2.8", "handshake-mcp"],
    observedAt: "2026-05-25T00:00:00.000Z",
    expiresAt: "2099-01-01T00:00:00.000Z",
    configDigest: digest(30),
    hostToolDigest: digest(31),
    toolListDigest: digest(32),
    evidenceRefs: ["evidence:codex-x402-activation:wrapped-gateway-check"],
    ...overrides,
  };
}

function validProfileInput(): ProtectedX402ToolHostProfileInput {
  return {
    profileId: "profile_x402_codex_local",
    hostFamily: "codex_local",
    hostProfileRef: "host-profile:codex_local:x402",
    runtimeAdapterRef: "runtime-adapter:codex_local",
    toolCatalogDigest: digest(11),
    metadataDigest: digest(12),
    gatewayReadiness: validGatewayReadiness(),
    facadeInput: validFacadeInput(),
    transcriptRef: "transcript:codex_local:x402",
    evidenceRefs: ["evidence:host-profile:codex_local"],
  };
}

function validGatewayReadiness(): ProtectedX402ToolHostProfileInput["gatewayReadiness"] {
  return {
    readinessStatus: "trusted_gateway_ready",
    readinessScope: "pre_contract",
    readinessProofLevel: "control_plane_registration",
    trustedReadiness: true,
    requiredNextMechanism: "ready_for_runtime_facade",
    gatewayReadinessRef: "handshake://local/x402/gateway-readiness.json",
    gatewayReadinessDigest: digest(13),
    readinessExpiresAt: "2099-01-01T00:00:00.000Z",
    installDigest: digest(14),
    probePostureDigest: digest(15),
    paymentRequirementsDigest: digest(5),
    selectedPaymentRequirementDigest: digest(6),
    gatewayId: "gateway_x402_self_hosted",
    gatewayRegistrationRef: "gateway-registration:x402:self-hosted",
    gatewayCredentialRefDigest: digest(16),
    gatewayCredentialCustodyStatus: "gateway_held",
    gatewayCustodyProofPacketRef: "gateway-custody-proof:x402:self-hosted",
    gatewayCustodyProofPacketDigest: digest(18),
    gatewayCustodyClaimLevel: "customer_gateway_evidence",
    gatewayCustodyExternalVerificationStatus: "verified_by_official_source",
    gatewayCustodyProofExpiresAt: "2099-01-01T00:00:00.000Z",
    gatewayPosture: "online",
    policyVersionRef: "policy:x402-payment-exact:v1",
    policyVersionDigest: digest(17),
    gatewayRegistryEntryRef: "gateway_registry_x402",
    operatingEnvelopeRef: "envelope_x402_paid_api",
    rawCredentialRefsIncluded: false,
    proofGapReasonCodes: [],
    evidenceRefs: ["evidence:x402:gateway-readiness"],
  };
}

function validFacadeInput(): ProtectedX402ToolHostProfileInput["facadeInput"] {
  return {
    requestId: "req_x402_profile_demo",
    principalId: "principal_platform_team",
    agentId: "agent_paid_api_worker",
    principalIntentRef: "intent:agent-paid-api",
    generatedCodeOrSpecRef: "generated:agent-program",
    runtimeAdapterRef: "adapter:runtime-neutral",
    runId: "run_x402_profile_demo",
    dispatchBoundaryRef: "dispatch-boundary:x402-tool",
    dispatchRef: "dispatch:x402:profile-demo",
    operatingEnvelopeId: "envelope_x402_paid_api",
    toolCapabilityId: "tool_x402_payment",
    actionTypeId: "atype_x402_payment",
    gatewayRegistryEntryId: "gateway_registry_x402",
    gatewayId: "gateway_x402_self_hosted",
    policyOwnerRef: "policy-owner:platform",
    evidenceConsumerRef: "evidence-consumer:support",
    contractExpiresAt: "2026-01-01T00:00:00.000Z",
    idempotencyKey: "idem:x402:paid-api:profile-demo",
    metadataDigest: digest(7),
    toolCatalogDigest: digest(8),
    actionCatalogDigest: digest(9),
    gatewayRegistryDigest: digest(10),
    metadataFreshness: "fresh",
    policyFreshness: "fresh",
    installReadiness: "trusted_gateway_ready",
    gatewayPosture: "online",
    readinessProofLevel: "control_plane_registration",
    gatewayReadinessRef: "handshake://local/x402/gateway-readiness.json",
    gatewayReadinessDigest: digest(13),
    readinessExpiresAt: "2099-01-01T00:00:00.000Z",
    installDigest: digest(14),
    probePostureDigest: digest(15),
    gatewayRegistrationRef: "gateway-registration:x402:self-hosted",
    gatewayCredentialRefDigest: digest(16),
    gatewayCredentialCustodyStatus: "gateway_held",
    gatewayCustodyProofPacketRef: "gateway-custody-proof:x402:self-hosted",
    gatewayCustodyProofPacketDigest: digest(18),
    gatewayCustodyClaimLevel: "customer_gateway_evidence",
    gatewayCustodyExternalVerificationStatus: "verified_by_official_source",
    gatewayCustodyProofExpiresAt: "2099-01-01T00:00:00.000Z",
    policyVersionRef: "policy:x402-payment-exact:v1",
    policyVersionDigest: digest(17),
    rawCredentialRefsIncluded: false,
    endpointUrl: "https://seller.example/protected",
    payee: "0x0000000000000000000000000000000000000001",
    payTo: "0x0000000000000000000000000000000000000001",
    network: "base-sepolia",
    token: "USDC",
    asset: "USDC",
    atomicAmount: "1000",
    x402EvidenceProfile: "official_payment_required",
    paymentRequirementsDigest: digest(5),
    paymentRequiredEvidenceRef: "evidence:x402-payment-required:demo",
    facilitatorRef: null,
    intendedHttpMethod: "GET",
    intendedRequestUrl: "https://seller.example/protected",
    intendedRequestBodyPosture: "no_body",
    intendedRequestBodyDigest: null,
    selectedHeadersDigest: digest(4),
    providerEnvironmentPosture: "local_reference_sandbox",
    providerEnvironmentRef: null,
    x402Version: 2,
    x402Scheme: "exact",
    maxTimeoutSeconds: 60,
    selectedPaymentRequirementIndex: 1,
    selectedPaymentRequirementDigest: digest(6),
    sdkPackageVersions: { "@x402/core": "2.12.0", "@x402/evm": "2.12.0" },
    extensionKeys: [],
    correlationRef: "correlation:x402:profile-demo",
    evidenceRefs: ["evidence:runtime:tool-call"],
  };
}
