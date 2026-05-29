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

// D-64 (Mechanism A — gateway-held credential custody) + D-65 (architecture-test
// promotion only for structurally-enforced invariants). The x402 signer must
// STRUCTURALLY refuse to mint a payment signature unless the command carries a
// genuine VerifiedGatewayCheck AND gateway-resolved, redacted credential
// resolution evidence bound to that same gate attempt. credentialMaterialPosture
// "gateway_held_redacted" is enforced by this guard, not by a label alone.
//
// This pins the structural lift in src/adapters/x402-payment/wallet-gateway.ts:
// raw gatewayCredentialRefId from a caller-only path can never reach signPayment.

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
  const credentialResolutionEvidence = gatewayResolvedCredentialEvidence({
    actionContractId: verifiedGate.actionContractId,
    greenlightId: verifiedGate.greenlightId,
    gateAttemptId: verifiedGate.gateAttemptId,
    ...overrides.credentialResolutionEvidence,
  });
  return {
    verifiedGate,
    parameters: { gatewayCredentialRefId: "gcred_demo_0001" } as X402PaymentParameters,
    credentialResolutionEvidence,
    credentialUseRef: `gateway-credential-use:x402:${verifiedGate.gateAttemptId}`,
    providerRequestRef: `provider-request:x402:${verifiedGate.gateAttemptId}`,
    providerOperationRef: `provider-operation:x402:${verifiedGate.gateAttemptId}`,
  };
}

describe("x402 gateway-held credential custody (D-64, D-65)", () => {
  it("accepts a command bound to a verified gate with gateway-resolved redacted evidence", () => {
    expect(() => assertGatewayHeldSigningCommand(gatewayHeldCommand())).not.toThrow();
  });

  it("refuses a command whose verified gate status is not passed (D-64)", () => {
    expect(() =>
      assertGatewayHeldSigningCommand(
        gatewayHeldCommand({ verifiedGate: { gatewayCheckStatus: "refused" as never } }),
      ),
    ).toThrow();
  });

  it("refuses a command with an empty gate attempt id (D-64)", () => {
    expect(() =>
      assertGatewayHeldSigningCommand(gatewayHeldCommand({ verifiedGate: { gateAttemptId: "" } })),
    ).toThrow();
  });

  it("refuses a command with an empty mutation attempt id (D-64)", () => {
    expect(() =>
      assertGatewayHeldSigningCommand(gatewayHeldCommand({ verifiedGate: { mutationAttemptId: "" } })),
    ).toThrow();
  });

  it("refuses credential resolution evidence bound to a different gate attempt — raw refs cannot reach the signer (D-64)", () => {
    expect(() =>
      assertGatewayHeldSigningCommand(
        gatewayHeldCommand({ credentialResolutionEvidence: { gateAttemptId: "gate_other_9999" } }),
      ),
    ).toThrow();
  });

  it("refuses credential resolution evidence that was not used by the gateway (D-64)", () => {
    expect(() =>
      assertGatewayHeldSigningCommand(
        gatewayHeldCommand({ credentialResolutionEvidence: { resultClass: "proof_gap" } }),
      ),
    ).toThrow();
  });
});
