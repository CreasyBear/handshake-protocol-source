import { describe, expect, it } from "bun:test";
import {
  prepareProtectedX402ToolDispatch,
  X402_PROTECTED_TOOL_NAME,
  X402_PROTECTED_TOOL_READINESS_VERSION,
} from "../../src/adapters/x402-payment";

const digest = (seed: number): `sha256:${string}` => `sha256:${seed.toString(16).padStart(64, "0")}`;

describe("runtime-neutral x402 protected tool facade", () => {
  it("prepares one wrapped runtime dispatch without creating authority", () => {
    const result = prepareProtectedX402ToolDispatch(validFacadeInput());

    expect(result).toMatchObject({
      schemaVersion: "handshake.runtime.x402-protected-tool-facade.v1",
      toolName: X402_PROTECTED_TOOL_NAME,
      actionClass: "x402_payment.exact",
      protectedSurfaceKind: "x402_payment",
      productBinding: {
        principalId: "principal_platform_team",
        agentId: "agent_paid_api_worker",
        operatingEnvelopeId: "envelope_x402_paid_api",
        toolCapabilityId: "tool_x402_payment",
        actionTypeId: "atype_x402_payment",
        gatewayRegistryEntryId: "gateway_registry_x402",
        gatewayId: "gateway_x402_self_hosted",
        readinessContractVersion: X402_PROTECTED_TOOL_READINESS_VERSION,
        gatewayReadinessRef: "handshake://local/x402/gateway-readiness.json",
        gatewayReadinessDigest: digest(13),
        readinessProofLevel: "control_plane_registration",
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
        policyOwnerRef: "policy-owner:platform",
        policyVersionRef: "policy:x402-payment-exact:v1",
        policyVersionDigest: digest(17),
        evidenceConsumerRef: "evidence-consumer:support",
        contractExpiresAt: "2026-01-01T00:00:00.000Z",
        metadataDigest: digest(7),
        toolCatalogDigest: digest(8),
        actionCatalogDigest: digest(9),
        gatewayRegistryDigest: digest(10),
      },
      idempotencyKey: "idem:x402:paid-api:1",
      outcome: "dispatch_block_prepared",
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
      credentialMaterialIncluded: false,
      mutationCommandIncluded: false,
      rawInternalRecordIncluded: false,
      receiptExportCreated: false,
      authorityCertificateMinted: false,
      reasonCodes: [],
      nextAction: "read_evidence",
      challengeRef: null,
      runtimeIngressBlock: {
        principalIntentRef: "intent:agent-paid-api",
        generatedCodeOrSpecRef: "generated:agent-program",
        dispatchBoundaryRef: "dispatch-boundary:x402-tool",
        evidenceRefs: [
          "evidence:x402-payment-required:demo",
          "handshake://local/x402/gateway-readiness.json",
          "gateway-registration:x402:self-hosted",
          "gateway-custody-proof:x402:self-hosted",
          "policy:x402-payment-exact:v1",
          "evidence:x402:raw-sibling-posture",
          "evidence:runtime:tool-call",
        ],
        dispatches: [
          {
            dispatchKind: "wrapped_x402_payment",
            dispatchRef: "dispatch:x402:1",
            endpointUrl: "https://seller.example/protected",
            intendedRequestBodyPosture: "no_body",
            intendedRequestBodyDigest: null,
            providerEnvironmentPosture: "local_reference_sandbox",
            providerEnvironmentRef: null,
            x402EvidenceProfile: "official_payment_required",
            x402Scheme: "exact",
            selectedPaymentRequirementIndex: 1,
            selectedPaymentRequirementDigest: digest(6),
          },
        ],
      },
    });
    expect(JSON.stringify(result)).not.toContain("PaymentPayload");
    expect(JSON.stringify(result)).not.toContain("PAYMENT-SIGNATURE");
    expect(JSON.stringify(result)).not.toContain("privateKey");
    expect(JSON.stringify(result)).not.toContain("signerRef");
    expect(JSON.stringify(result)).not.toContain("gatewayCheckInput");
  });

  it("fails closed when readiness is only local posture evidence", () => {
    const result = prepareProtectedX402ToolDispatch({
      ...validFacadeInput(),
      installReadiness: "local_posture_evidence_present",
    });

    expect(result).toMatchObject({
      outcome: "install_not_ready",
      reasonCodes: ["protected_x402_install_not_ready"],
      nextAction: "fix_install",
      runtimeIngressBlock: null,
      authorityCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    });
  });

  it("returns freshness and gateway challenges before runtime dispatch preparation", () => {
    const stale = prepareProtectedX402ToolDispatch({
      ...validFacadeInput(),
      metadataFreshness: "stale",
    });
    expect(stale).toMatchObject({
      outcome: "metadata_stale",
      nextAction: "reload_metadata",
      runtimeIngressBlock: null,
      reasonCodes: ["protected_x402_metadata_stale"],
    });

    const stalePolicy = prepareProtectedX402ToolDispatch({
      ...validFacadeInput(),
      policyFreshness: "stale",
    });
    expect(stalePolicy).toMatchObject({
      outcome: "metadata_stale",
      nextAction: "reload_metadata",
      runtimeIngressBlock: null,
      reasonCodes: ["protected_x402_policy_stale"],
      authorityCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    });

    const offline = prepareProtectedX402ToolDispatch({
      ...validFacadeInput(),
      gatewayPosture: "offline",
    });
    expect(offline).toMatchObject({
      outcome: "gateway_offline",
      nextAction: "wait_for_gateway",
      runtimeIngressBlock: null,
      reasonCodes: ["protected_x402_gateway_offline"],
    });
  });

  it("refuses stale readiness proof before runtime dispatch preparation", () => {
    const result = prepareProtectedX402ToolDispatch({
      ...validFacadeInput(),
      readinessExpiresAt: "2025-12-31T23:59:59.000Z",
    });

    expect(result).toMatchObject({
      outcome: "install_not_ready",
      nextAction: "fix_install",
      runtimeIngressBlock: null,
      reasonCodes: ["protected_x402_readiness_proof_stale"],
      authorityCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    });
  });

  it("refuses trusted facade preparation when readiness proof is not control-plane registered", () => {
    const result = prepareProtectedX402ToolDispatch({
      ...validFacadeInput(),
      readinessProofLevel: "local_classification",
    });

    expect(result).toMatchObject({
      outcome: "install_not_ready",
      reasonCodes: ["protected_x402_trusted_readiness_missing"],
      nextAction: "fix_install",
      runtimeIngressBlock: null,
      authorityCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    });
  });

  it("refuses trusted facade preparation when gateway custody proof is only fixture-local", () => {
    const result = prepareProtectedX402ToolDispatch({
      ...validFacadeInput(),
      gatewayCustodyClaimLevel: "local_fixture",
      gatewayCustodyExternalVerificationStatus: "not_required",
    });

    expect(result).toMatchObject({
      outcome: "install_not_ready",
      reasonCodes: ["protected_x402_custody_proof_unverified"],
      nextAction: "fix_install",
      runtimeIngressBlock: null,
      authorityCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    });
  });

  it("refuses unsafe x402 posture and authority-shaped input", () => {
    const liveProvider = prepareProtectedX402ToolDispatch({
      ...validFacadeInput(),
      providerEnvironmentPosture: "live",
      providerEnvironmentRef: "provider:x402-live",
    });
    expect(liveProvider).toMatchObject({
      outcome: "refused",
      nextAction: "recraft_request",
      runtimeIngressBlock: null,
      reasonCodes: ["x402_provider_environment_not_sandboxed"],
    });

    const authorityShaped = prepareProtectedX402ToolDispatch({
      ...validFacadeInput(),
      PaymentPayload: "raw-payload",
    });
    expect(authorityShaped).toMatchObject({
      outcome: "tool_execution_error",
      reasonCodes: ["protected_x402_input_schema_invalid"],
      runtimeIngressBlock: null,
      authorityCreated: false,
      mutationAttempted: false,
    });
  });

  it("rejects authority-shaped readiness boundary before runtime dispatch preparation", () => {
    const result = prepareProtectedX402ToolDispatch({
      ...validFacadeInput(),
      readinessAuthorityBoundary: {
        readinessScope: "pre_contract",
        createsAuthority: true,
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
    });

    expect(result).toMatchObject({
      outcome: "tool_execution_error",
      reasonCodes: ["protected_x402_input_schema_invalid"],
      runtimeIngressBlock: null,
      authorityCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    });
  });
});

function validFacadeInput() {
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
    policyFreshness: "fresh",
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
