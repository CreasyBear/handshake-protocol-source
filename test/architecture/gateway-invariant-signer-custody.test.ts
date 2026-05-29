import { describe, expect, it } from "bun:test";
import {
  assertGatewayHeldSigningCommand,
  type X402PaymentParameters,
  type X402PaymentSignatureCommand,
} from "../../src/adapters/x402-payment/wallet-gateway";
import {
  CredentialResolutionEvidenceSchema,
  type CredentialResolutionEvidence,
} from "../../src/protocol/areas/credential-custody";
import type { VerifiedGatewayCheck } from "../../src/protocol/areas/gateway-gate";

// D3 promotion (05-14, D-65): architecture-level pin of AGENTS invariant
// "the gateway check is the enforcement point before consequence" at the x402
// signer boundary (Phase-05 invariant 3 / coherence invariant 6).
//
// Structural site (added by 05-13, D-64 Mechanism A):
//   src/adapters/x402-payment/wallet-gateway.ts → assertGatewayHeldSigningCommand
//
// IMPORTANT (D-65 promotion-after-structure rule): this test depends on the
// EXISTENCE of `assertGatewayHeldSigningCommand`. Run against a pre-05-13 tree
// the import resolves to `undefined` and every assertion below throws at call
// time — i.e. this architecture guard cannot pass until the structural custody
// lift has landed. That ordering is exactly why 05-13 must precede 05-14.
//
// The signer STRUCTURALLY refuses to mint a payment signature unless the
// command carries a genuine passed VerifiedGatewayCheck bound to the same gate
// attempt as its gateway-resolved, redacted credential-resolution evidence. A
// raw caller-supplied credential can never reach the signer.

const digest = (fill: string): `sha256:${string}` => `sha256:${fill.repeat(64)}` as const;

function gatewayResolvedCredentialEvidence(
  overrides: Partial<CredentialResolutionEvidence> = {},
): CredentialResolutionEvidence {
  return CredentialResolutionEvidenceSchema.parse({
    schemaVersion: "0.2.4",
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt: "2026-01-01T00:00:00.000Z",
    credentialResolutionEvidenceId: "cre_demo_0001",
    gatewayCredentialRefId: "gcred_demo_0001",
    gatewayCredentialRefDigest: digest("a"),
    actionContractId: "ac_demo_0001",
    greenlightId: "gl_demo_0001",
    gateAttemptId: "gate_demo_0001",
    mutationAttemptId: "mut_demo_0001",
    gatewayId: "gateway_x402_wallet",
    providerClass: "x402_wallet_gateway",
    providerRegistryRef: "gateway_registry:x402-wallet",
    resolverRef: "resolver:x402-wallet-gateway",
    resolverVersion: "v0",
    requestDigest: digest("b"),
    resultClass: "used_by_gateway",
    resultReasonCode: "gate_passed",
    redactionStatus: "redacted",
    redactionProfileRef: "credential-resolution-evidence:v0.2-redacted",
    credentialMaterialIncluded: false,
    recordedAt: "2026-01-01T00:00:00.000Z",
    evidenceDigest: digest("c"),
    ...overrides,
  });
}

function gatewayHeldCommand(
  overrides: {
    verifiedGate?: Partial<VerifiedGatewayCheck>;
    credentialResolutionEvidence?: Partial<CredentialResolutionEvidence>;
  } = {},
): X402PaymentSignatureCommand {
  const verifiedGate: VerifiedGatewayCheck = {
    gatewayCheckStatus: "passed",
    gateAttemptId: "gate_demo_0001",
    mutationAttemptId: "mut_demo_0001",
    actionContractId: "ac_demo_0001",
    greenlightId: "gl_demo_0001",
    gatewayId: "gateway_x402_wallet",
    actionClass: "x402_payment.exact",
    resourceRef: "resource:x402-premium-context",
    idempotencyKey: "idem_demo_0001",
    surfaceOperationRef: "surface-op:x402:demo",
    ...overrides.verifiedGate,
  };
  return {
    verifiedGate,
    parameters: { gatewayCredentialRefId: "gcred_demo_0001" } as X402PaymentParameters,
    credentialResolutionEvidence: gatewayResolvedCredentialEvidence(overrides.credentialResolutionEvidence),
    credentialUseRef: `gateway-credential-use:x402:${verifiedGate.gateAttemptId}`,
    providerRequestRef: `provider-request:x402:${verifiedGate.gateAttemptId}`,
    providerOperationRef: `provider-operation:x402:${verifiedGate.gateAttemptId}`,
  };
}

describe("gateway invariant: x402 signer refuses without a VerifiedGatewayCheck (D3 promotion)", () => {
  it("accepts a command bound to a passed verified gate with gateway-resolved evidence", () => {
    expect(() => assertGatewayHeldSigningCommand(gatewayHeldCommand())).not.toThrow();
  });

  it("refuses a command whose verified gate is not passed", () => {
    expect(() =>
      assertGatewayHeldSigningCommand(
        gatewayHeldCommand({ verifiedGate: { gatewayCheckStatus: "refused" as never } }),
      ),
    ).toThrow();
  });

  it("refuses a command whose credential evidence is bound to a different gate attempt", () => {
    expect(() =>
      assertGatewayHeldSigningCommand(
        gatewayHeldCommand({ credentialResolutionEvidence: { gateAttemptId: "gate_other_9999" } }),
      ),
    ).toThrow();
  });
});
