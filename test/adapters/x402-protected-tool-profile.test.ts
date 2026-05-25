import { describe, expect, it } from "bun:test";
import {
  buildProtectedX402ToolHostProfile,
  type ProtectedX402ToolHostProfileInput,
  X402_PROTECTED_TOOL_NAME,
  X402_PROTECTED_TOOL_PROFILE_VERSION,
  X402_PROTECTED_TOOL_READINESS_VERSION,
} from "../../src/adapters/x402-payment";

const digest = (seed: number): `sha256:${string}` => `sha256:${seed.toString(16).padStart(64, "0")}`;

describe("x402 protected tool host profile", () => {
  it("prepares a Codex local profile around the protected facade without creating authority", () => {
    const result = buildProtectedX402ToolHostProfile(validProfileInput("codex_local"));

    expect(result).toMatchObject({
      schemaVersion: X402_PROTECTED_TOOL_PROFILE_VERSION,
      profileId: "profile_x402_codex_local",
      hostFamily: "codex_local",
      toolName: X402_PROTECTED_TOOL_NAME,
      actionClass: "x402_payment.exact",
      protectedSurfaceKind: "x402_payment",
      outcome: "profile_prepared",
      nextAction: "read_evidence",
      gatewayReadinessRef: "handshake://local/x402/gateway-readiness.json",
      gatewayReadinessDigest: digest(13),
      readinessProofLevel: "control_plane_registration",
      gatewayCredentialRefDigest: digest(16),
      gatewayCredentialCustodyStatus: "gateway_held",
      gatewayCustodyProofPacketRef: "gateway-custody-proof:x402:self-hosted",
      gatewayCustodyProofPacketDigest: digest(18),
      gatewayCustodyClaimLevel: "customer_gateway_evidence",
      gatewayCustodyExternalVerificationStatus: "verified_by_official_source",
      gatewayCustodyProofExpiresAt: "2099-01-01T00:00:00.000Z",
      gatewayId: "gateway_x402_self_hosted",
      policyVersionRef: "policy:x402-payment-exact:v1",
      facadeInvoked: true,
      facadeOutcome: "dispatch_block_prepared",
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
      credentialMaterialIncluded: false,
      mutationCommandIncluded: false,
      rawInternalRecordIncluded: false,
      receiptExportCreated: false,
      authorityCertificateMinted: false,
      profileDescriptor: {
        installSurface: "codex_local_profile",
        transport: "local_profile",
        hostWideContainmentClaimed: false,
        runtimeExclusiveClaimed: false,
        rawSiblingPosture: "named_not_controlled",
      },
      readinessContractVersion: X402_PROTECTED_TOOL_READINESS_VERSION,
      rawSiblingPosture: "named_not_controlled",
      readinessAuthorityBoundary: {
        readinessScope: "pre_contract",
        createsAuthority: false,
        createsPolicyDecision: false,
        createsGreenlight: false,
        performsGatewayCheck: false,
        performsMutation: false,
        resolvesCredential: false,
        invokesSigner: false,
        createsPaymentMaterial: false,
        createsPaymentSignature: false,
        exportsReceipt: false,
        mintsTerminalCertificate: false,
        claimsHostedOperation: false,
        claimsProviderCustody: false,
        claimsSettlement: false,
        claimsHostWideContainment: false,
        certifiesMarketplace: false,
      },
      runtimeIngressBlock: {
        dispatches: [
          {
            dispatchKind: "wrapped_x402_payment",
            dispatchRef: "dispatch:x402:1",
          },
        ],
      },
      authorityBoundary: {
        createsAuthority: false,
        createsPolicyDecision: false,
        createsGreenlight: false,
        performsGatewayCheck: false,
        performsMutation: false,
        resolvesCredential: false,
        invokesSigner: false,
        createsPaymentMaterial: false,
        createsPaymentSignature: false,
        exportsReceipt: false,
        mintsTerminalCertificate: false,
        claimsHostWideContainment: false,
        claimsSettlement: false,
        claimsProviderCustody: false,
        claimsHostedOperation: false,
        certifiesMarketplace: false,
        establishesCrossOrgTrust: false,
      },
    });
    expect(result.profileDescriptor?.hostBypassPosture).toContain("raw_sibling_paths_not_controlled");
    expect(result.profileDescriptor?.hostBypassPosture).toContain("host_wide_containment_not_claimed");
    expect(result.nonClaims).toContain("raw sibling posture is bypass evidence, not host-wide containment");
    expect(result.transcript.map((step) => step.status)).toEqual(["passed", "passed", "passed"]);
    expect(JSON.stringify(result)).not.toContain("PaymentPayload");
    expect(JSON.stringify(result)).not.toContain("PAYMENT-SIGNATURE");
    expect(JSON.stringify(result)).not.toContain("privateKey");
    expect(JSON.stringify(result)).not.toContain("signerRef");
    expect(JSON.stringify(result)).not.toContain("gatewayCheckInput");
  });

  it("keeps Claude Code managed MCP as distribution posture, not host-wide enforcement", () => {
    const result = buildProtectedX402ToolHostProfile(validProfileInput("claude_code_mcp"));

    expect(result).toMatchObject({
      outcome: "profile_prepared",
      hostFamily: "claude_code_mcp",
      profileDescriptor: {
        installSurface: "claude_code_managed_mcp",
        transport: "managed_mcp",
        hostWideContainmentClaimed: false,
        runtimeExclusiveClaimed: false,
      },
      authorityCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    });
    expect(result.profileDescriptor?.hostBypassPosture).toContain("host_hooks_advisory_only");
    expect(result.nonClaims).toContain("host profile installation is not host-wide containment");
  });

  it("blocks host profile preparation until trusted gateway readiness is registered", () => {
    const result = buildProtectedX402ToolHostProfile(
      validProfileInput("codex_local", {
        gatewayReadiness: {
          readinessStatus: "local_posture_evidence_present",
          trustedReadiness: false,
          requiredNextMechanism: "register_control_plane_install",
          gatewayReadinessRef: null,
          gatewayReadinessDigest: null,
          readinessProofLevel: "local_classification",
          readinessExpiresAt: null,
          installDigest: digest(14),
          probePostureDigest: digest(15),
          paymentRequirementsDigest: digest(5),
          selectedPaymentRequirementDigest: digest(6),
          gatewayId: null,
          gatewayRegistrationRef: null,
          gatewayCredentialRefDigest: null,
          gatewayCredentialCustodyStatus: "missing",
          gatewayCustodyProofPacketRef: null,
          gatewayCustodyProofPacketDigest: null,
          gatewayCustodyClaimLevel: "proof_gap",
          gatewayCustodyExternalVerificationStatus: "required_before_live_claim",
          gatewayCustodyProofExpiresAt: null,
          gatewayPosture: "unknown",
          policyVersionRef: null,
          policyVersionDigest: null,
          gatewayRegistryEntryRef: null,
          operatingEnvelopeRef: null,
          rawCredentialRefsIncluded: false,
          proofGapReasonCodes: ["cli_install_not_ready"],
          evidenceRefs: ["evidence:x402:local-install"],
        },
      }),
    );

    expect(result).toMatchObject({
      outcome: "profile_not_ready",
      nextAction: "register_control_plane_install",
      facadeInvoked: false,
      facadeOutcome: null,
      facadeResult: null,
      runtimeIngressBlock: null,
      gatewayReadinessRef: null,
      gatewayId: null,
      policyVersionRef: null,
      reasonCodes: [
        "cli_install_not_ready",
        "protected_x402_custody_proof_missing",
        "protected_x402_install_not_ready",
        "protected_x402_trusted_readiness_missing",
      ],
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    });
    expect(result.transcript).toEqual([
      {
        step: "host_profile_selected",
        status: "passed",
        reasonCodes: [],
        evidenceRefs: ["evidence:host-profile:codex_local"],
      },
      {
        step: "gateway_readiness_checked",
        status: "blocked",
        reasonCodes: [
          "cli_install_not_ready",
          "protected_x402_custody_proof_missing",
          "protected_x402_install_not_ready",
          "protected_x402_trusted_readiness_missing",
        ],
        evidenceRefs: ["evidence:x402:local-install"],
      },
      {
        step: "facade_preflight",
        status: "skipped",
        reasonCodes: [
          "cli_install_not_ready",
          "protected_x402_custody_proof_missing",
          "protected_x402_install_not_ready",
          "protected_x402_trusted_readiness_missing",
        ],
        evidenceRefs: [],
      },
    ]);
  });

  it("passes facade challenges through without hiding them as host readiness", () => {
    const result = buildProtectedX402ToolHostProfile(
      validProfileInput("codex_local", {
        facadeInput: {
          ...validFacadeInput(),
          metadataFreshness: "stale",
        },
      }),
    );

    expect(result).toMatchObject({
      outcome: "facade_challenge",
      nextAction: "reload_metadata",
      facadeInvoked: true,
      facadeOutcome: "metadata_stale",
      runtimeIngressBlock: null,
      reasonCodes: ["protected_x402_metadata_stale"],
      authorityCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    });
  });

  it("blocks profile preparation when facade readiness binding drifts from the readiness snapshot", () => {
    const result = buildProtectedX402ToolHostProfile(
      validProfileInput("codex_local", {
        facadeInput: {
          ...validFacadeInput(),
          rawSiblingPosture: "unknown",
        },
      }),
    );

    expect(result).toMatchObject({
      outcome: "profile_not_ready",
      nextAction: "fix_install",
      facadeInvoked: false,
      runtimeIngressBlock: null,
      reasonCodes: ["protected_x402_readiness_binding_mismatch"],
      authorityCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    });
    expect(result.transcript.map((step) => step.status)).toEqual(["passed", "blocked", "skipped"]);
  });

  it("blocks profile preparation when customer gateway custody proof is not externally verified", () => {
    const result = buildProtectedX402ToolHostProfile(
      validProfileInput("codex_local", {
        gatewayReadiness: {
          ...validGatewayReadiness(),
          gatewayCustodyClaimLevel: "local_fixture",
          gatewayCustodyExternalVerificationStatus: "not_required",
        },
        facadeInput: {
          ...validFacadeInput(),
          gatewayCustodyClaimLevel: "local_fixture",
          gatewayCustodyExternalVerificationStatus: "not_required",
        },
      }),
    );

    expect(result).toMatchObject({
      outcome: "profile_not_ready",
      nextAction: "fix_install",
      facadeInvoked: false,
      runtimeIngressBlock: null,
      reasonCodes: ["protected_x402_custody_proof_unverified"],
      authorityCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    });
  });

  it("rejects authority-shaped profile input before facade invocation", () => {
    const result = buildProtectedX402ToolHostProfile({
      ...validProfileInput("codex_local"),
      PaymentPayload: "raw-payload",
    });

    expect(result).toMatchObject({
      outcome: "profile_invalid",
      nextAction: "recraft_request",
      facadeInvoked: false,
      reasonCodes: ["protected_x402_input_schema_invalid"],
      authorityCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    });
  });
});

function validProfileInput(
  hostFamily: "codex_local" | "claude_code_mcp",
  overrides: {
    gatewayReadiness?: ProtectedX402ToolHostProfileInput["gatewayReadiness"];
    facadeInput?: ProtectedX402ToolHostProfileInput["facadeInput"];
  } = {},
): ProtectedX402ToolHostProfileInput {
  return {
    profileId: `profile_x402_${hostFamily}`,
    hostFamily,
    hostProfileRef: `host-profile:${hostFamily}:x402`,
    runtimeAdapterRef: `runtime-adapter:${hostFamily}`,
    toolCatalogDigest: digest(11),
    metadataDigest: digest(12),
    gatewayReadiness: overrides.gatewayReadiness ?? validGatewayReadiness(),
    facadeInput: overrides.facadeInput ?? validFacadeInput(),
    transcriptRef: `transcript:${hostFamily}:x402`,
    evidenceRefs: [`evidence:host-profile:${hostFamily}`],
  };
}

function validGatewayReadiness(): ProtectedX402ToolHostProfileInput["gatewayReadiness"] {
  return {
    readinessStatus: "trusted_gateway_ready" as const,
    schemaVersion: X402_PROTECTED_TOOL_READINESS_VERSION,
    readinessScope: "pre_contract" as const,
    readinessProofLevel: "control_plane_registration" as const,
    trustedReadiness: true,
    requiredNextMechanism: "ready_for_runtime_facade" as const,
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
    gatewayCredentialCustodyStatus: "gateway_held" as const,
    gatewayCustodyProofPacketRef: "gateway-custody-proof:x402:self-hosted",
    gatewayCustodyProofPacketDigest: digest(18),
    gatewayCustodyClaimLevel: "customer_gateway_evidence" as const,
    gatewayCustodyExternalVerificationStatus: "verified_by_official_source" as const,
    gatewayCustodyProofExpiresAt: "2099-01-01T00:00:00.000Z",
    gatewayPosture: "online" as const,
    policyVersionRef: "policy:x402-payment-exact:v1",
    policyVersionDigest: digest(17),
    gatewayRegistryEntryRef: "gateway_registry_x402",
    operatingEnvelopeRef: "envelope_x402_paid_api",
    rawCredentialRefsIncluded: false,
    rawSiblingPosture: "named_not_controlled",
    rawSiblingProofRefs: ["evidence:x402:raw-sibling-posture"],
    proofGapReasonCodes: [],
    evidenceRefs: ["evidence:x402:gateway-readiness"],
  };
}

function validFacadeInput(): ProtectedX402ToolHostProfileInput["facadeInput"] {
  return {
    requestId: "req_x402_facade_1",
    principalId: "principal_platform_team",
    agentId: "agent_paid_api_worker",
    principalIntentRef: "intent:agent-paid-api",
    generatedCodeOrSpecRef: "generated:agent-program",
    runtimeAdapterRef: "adapter:runtime-neutral",
    runId: "run_x402_facade",
    dispatchBoundaryRef: "dispatch-boundary:x402-tool",
    dispatchRef: "dispatch:x402:1",
    operatingEnvelopeId: "envelope_x402_paid_api",
    toolCapabilityId: "tool_x402_payment",
    actionTypeId: "atype_x402_payment",
    gatewayRegistryEntryId: "gateway_registry_x402",
    gatewayId: "gateway_x402_self_hosted",
    policyOwnerRef: "policy-owner:platform",
    evidenceConsumerRef: "evidence-consumer:support",
    contractExpiresAt: "2026-01-01T00:00:00.000Z",
    idempotencyKey: "idem:x402:paid-api:1",
    metadataDigest: digest(7),
    toolCatalogDigest: digest(8),
    actionCatalogDigest: digest(9),
    gatewayRegistryDigest: digest(10),
    metadataFreshness: "fresh",
    installReadiness: "trusted_gateway_ready",
    gatewayPosture: "online",
    readinessContractVersion: X402_PROTECTED_TOOL_READINESS_VERSION,
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
    rawSiblingPosture: "named_not_controlled",
    rawSiblingProofRefs: ["evidence:x402:raw-sibling-posture"],
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
    correlationRef: "correlation:x402:demo",
    evidenceRefs: ["evidence:runtime:tool-call"],
  };
}
