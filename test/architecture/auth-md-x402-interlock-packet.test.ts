import { describe, expect, it } from "bun:test";
import {
  authMdX402InterlockAuthorityBoundary,
  AuthMdX402InterlockAuthorityBoundarySchema,
  projectAuthMdX402InterlockPacket,
  type AuthMdX402InterlockPacketInput,
} from "../../src/surfaces/auth-md-x402-interlock";

describe("auth.md x402 interlock packet", () => {
  it("projects auth.md provenance and x402 protected spend evidence without authority", () => {
    const packet = projectAuthMdX402InterlockPacket(basePacketInput());

    expect(packet.packetKind).toBe("auth_md_x402_interlock_packet");
    expect(packet.packetVersion).toBe("v0");
    expect(packet.profile).toBe("protected_spend_provenance.v0");
    expect(packet.authorityBoundary).toEqual(authMdX402InterlockAuthorityBoundary);
    expect(Object.values(packet.authorityBoundary).every((value) => value === false)).toBe(true);
    expect(packet.readyForCompositeExecution).toBe(false);
    expect(packet.rawMaterialPosture).toBe("absent");
    expect(packet.credentialAndSignerOrdering).toBe("post_gate_only");
    expect(packet.nonClaims).toEqual([
      "not_authority",
      "not_policy_decision",
      "not_greenlight",
      "not_gateway_check",
      "not_mutation",
      "not_credential_resolution",
      "not_payment_signing",
      "not_receipt_export",
      "not_downstream_success",
      "not_provider_custody",
      "not_hosted_operation",
      "not_marketplace_certification",
      "not_cross_org_trust",
    ]);
  });

  it("rejects raw auth.md credential material and x402 payment material", () => {
    expect(() =>
      projectAuthMdX402InterlockPacket({
        ...basePacketInput(),
        authMdProvenance: {
          ...basePacketInput().authMdProvenance,
          rawCredentialMaterialObserved: true,
        },
      }),
    ).toThrow();

    expect(() =>
      projectAuthMdX402InterlockPacket({
        ...basePacketInput(),
        x402ProtectedSpend: {
          ...basePacketInput().x402ProtectedSpend,
          rawPaymentMaterialObserved: true,
        },
      }),
    ).toThrow();
  });

  it("records proof gaps instead of readiness when gateway evidence is missing", () => {
    const packet = projectAuthMdX402InterlockPacket(
      basePacketInput({
        x402ProtectedSpend: {
          ...basePacketInput().x402ProtectedSpend,
          policyDecisionRef: null,
          greenlightId: null,
          gatewayCheckRef: null,
          paymentSignatureEvidenceRef: null,
          signerInvocationPosture: "not_present",
        },
      }),
    );

    expect(packet.readyForCompositeExecution).toBe(false);
    expect(packet.credentialAndSignerOrdering).toBe("not_proven");
    expect(packet.proofGaps.map((gap) => gap.reasonCode)).toEqual(
      expect.arrayContaining([
        "x402_policy_decision_missing",
        "x402_greenlight_missing",
        "x402_gateway_check_missing",
        "x402_payment_signature_missing",
      ]),
    );
    expect(packet.blockedChecks).toEqual(expect.arrayContaining(packet.proofGaps.map((gap) => gap.reasonCode)));
  });

  it("makes the interlock authority boundary structural", () => {
    expect(() =>
      AuthMdX402InterlockAuthorityBoundarySchema.parse({
        ...authMdX402InterlockAuthorityBoundary,
        performsGatewayCheck: true,
      }),
    ).toThrow();
  });
});

function basePacketInput(overrides: Partial<AuthMdX402InterlockPacketInput> = {}): AuthMdX402InterlockPacketInput {
  const base: AuthMdX402InterlockPacketInput = {
    packetId: "packet_authmd_x402_demo",
    generatedAttempt: {
      principalIntentRef: "intent:buy-protected-api-call",
      generatedCodeOrSpecRef: "spec:x402-auth-md-demo",
      runtimeExecutionId: "runtime_demo_1",
      generatedExecutionGraphId: "graph_demo_1",
      toolCallDraftId: "draft_demo_1",
      candidateActionIds: ["candidate_auth_md_1", "candidate_x402_1"],
    },
    authMdProvenance: {
      discoveryEvidenceRefs: ["evidence:auth-md-discovery:demo"],
      registrationEvidenceRefs: ["evidence:auth-md-registration:demo"],
      identityAssertionEvidenceRefs: ["evidence:auth-md-identity:demo"],
      claimEvidenceRefs: ["evidence:auth-md-claim:demo"],
      revocationEvidenceRefs: ["evidence:auth-md-revocation:demo"],
      gatewayCredentialRefId: "gateway_credential_auth_md_demo",
      gatewayCredentialRefDigest: digest("01"),
      credentialResolutionEvidenceRef: "evidence:credential-resolution:demo",
      credentialResolutionPosture: "post_gateway_check_evidence",
      credentialLifecycleState: "active",
      providerRegistryRef: "registry:auth-md-provider:demo",
      providerRegistryDigest: digest("02"),
      rawCredentialMaterialObserved: false,
    },
    x402ProtectedSpend: {
      paymentRequiredEvidenceRef: "evidence:x402-payment-required:demo",
      paymentRequirementsDigest: digest("03"),
      selectedPaymentRequirementDigest: digest("04"),
      actionContractId: "contract_x402_demo",
      actionContractDigest: digest("05"),
      policyDecisionRef: "policy:x402:allow-demo",
      greenlightId: "greenlight_x402_demo",
      gatewayCheckRef: "gateway-check:x402:demo",
      paymentSignatureEvidenceRef: "evidence:x402-payment-signature:demo",
      paymentPayloadDigest: digest("06"),
      paymentSignatureDigest: digest("07"),
      signerInvocationPosture: "post_gateway_check_evidence",
      replayRefusalEvidenceRefs: ["evidence:x402-replay-refusal:demo"],
      rawPaymentMaterialObserved: false,
    },
    proofGaps: [],
  };
  return { ...base, ...overrides };
}

function digest(seed: string): `sha256:${string}` {
  return `sha256:${seed.repeat(64).slice(0, 64)}`;
}
