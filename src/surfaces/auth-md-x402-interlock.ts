import { z } from "zod";
import { DigestSchema, IdSchema } from "../protocol/foundation/schema-core";

const NonEmptyStringSchema = z.string().min(1);

export const AuthMdX402InterlockAuthorityBoundarySchema = z.strictObject({
  createsAuthority: z.literal(false),
  createsPolicyDecision: z.literal(false),
  createsGreenlight: z.literal(false),
  performsGatewayCheck: z.literal(false),
  performsMutation: z.literal(false),
  resolvesCredential: z.literal(false),
  invokesSigner: z.literal(false),
  createsPaymentPayload: z.literal(false),
  createsPaymentSignature: z.literal(false),
  exportsReceipt: z.literal(false),
  mintsTerminalCertificate: z.literal(false),
  claimsSettlement: z.literal(false),
  claimsProviderCustody: z.literal(false),
  claimsHostedOperation: z.literal(false),
  certifiesMarketplace: z.literal(false),
  establishesCrossOrgTrust: z.literal(false),
});
export type AuthMdX402InterlockAuthorityBoundary = z.infer<typeof AuthMdX402InterlockAuthorityBoundarySchema>;

export const authMdX402InterlockAuthorityBoundary = AuthMdX402InterlockAuthorityBoundarySchema.parse({
  createsAuthority: false,
  createsPolicyDecision: false,
  createsGreenlight: false,
  performsGatewayCheck: false,
  performsMutation: false,
  resolvesCredential: false,
  invokesSigner: false,
  createsPaymentPayload: false,
  createsPaymentSignature: false,
  exportsReceipt: false,
  mintsTerminalCertificate: false,
  claimsSettlement: false,
  claimsProviderCustody: false,
  claimsHostedOperation: false,
  certifiesMarketplace: false,
  establishesCrossOrgTrust: false,
});

export const AuthMdX402InterlockNonClaimSchema = z.enum([
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
export type AuthMdX402InterlockNonClaim = z.infer<typeof AuthMdX402InterlockNonClaimSchema>;

const authMdX402InterlockNonClaims = AuthMdX402InterlockNonClaimSchema.array().parse([
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

export const AuthMdX402InterlockProofGapSchema = z.strictObject({
  reasonCode: NonEmptyStringSchema,
  evidenceRefs: z.array(NonEmptyStringSchema),
});
export type AuthMdX402InterlockProofGap = z.infer<typeof AuthMdX402InterlockProofGapSchema>;

export const AuthMdX402GeneratedAttemptSchema = z.strictObject({
  principalIntentRef: NonEmptyStringSchema,
  generatedCodeOrSpecRef: NonEmptyStringSchema,
  runtimeExecutionId: IdSchema.nullable(),
  generatedExecutionGraphId: IdSchema.nullable(),
  toolCallDraftId: IdSchema.nullable(),
  candidateActionIds: z.array(IdSchema).min(1),
});
export type AuthMdX402GeneratedAttempt = z.infer<typeof AuthMdX402GeneratedAttemptSchema>;

export const AuthMdCredentialResolutionPostureSchema = z.enum([
  "post_gateway_check_evidence",
  "not_present",
  "proof_gap",
]);
export type AuthMdCredentialResolutionPosture = z.infer<typeof AuthMdCredentialResolutionPostureSchema>;

export const AuthMdCredentialLifecycleStateSchema = z.enum([
  "active",
  "expired",
  "revoked",
  "quarantined",
  "proof_gap",
]);
export type AuthMdCredentialLifecycleState = z.infer<typeof AuthMdCredentialLifecycleStateSchema>;

export const AuthMdProvenanceEvidenceSchema = z.strictObject({
  discoveryEvidenceRefs: z.array(NonEmptyStringSchema),
  registrationEvidenceRefs: z.array(NonEmptyStringSchema),
  identityAssertionEvidenceRefs: z.array(NonEmptyStringSchema),
  claimEvidenceRefs: z.array(NonEmptyStringSchema),
  revocationEvidenceRefs: z.array(NonEmptyStringSchema),
  gatewayCredentialRefId: IdSchema,
  gatewayCredentialRefDigest: DigestSchema,
  credentialResolutionEvidenceRef: NonEmptyStringSchema.nullable(),
  credentialResolutionPosture: AuthMdCredentialResolutionPostureSchema,
  credentialLifecycleState: AuthMdCredentialLifecycleStateSchema,
  providerRegistryRef: NonEmptyStringSchema,
  providerRegistryDigest: DigestSchema.nullable(),
  rawCredentialMaterialObserved: z.boolean(),
});
export type AuthMdProvenanceEvidence = z.infer<typeof AuthMdProvenanceEvidenceSchema>;

export const X402SignerInvocationPostureSchema = z.enum(["post_gateway_check_evidence", "not_present", "proof_gap"]);
export type X402SignerInvocationPosture = z.infer<typeof X402SignerInvocationPostureSchema>;

export const X402ProtectedSpendEvidenceSchema = z.strictObject({
  paymentRequiredEvidenceRef: NonEmptyStringSchema,
  paymentRequirementsDigest: DigestSchema,
  selectedPaymentRequirementDigest: DigestSchema.nullable(),
  actionContractId: IdSchema,
  actionContractDigest: DigestSchema,
  policyDecisionRef: NonEmptyStringSchema.nullable(),
  greenlightId: IdSchema.nullable(),
  gatewayCheckRef: NonEmptyStringSchema.nullable(),
  paymentSignatureEvidenceRef: NonEmptyStringSchema.nullable(),
  paymentPayloadDigest: DigestSchema.nullable(),
  paymentSignatureDigest: DigestSchema.nullable(),
  signerInvocationPosture: X402SignerInvocationPostureSchema,
  replayRefusalEvidenceRefs: z.array(NonEmptyStringSchema),
  rawPaymentMaterialObserved: z.boolean(),
});
export type X402ProtectedSpendEvidence = z.infer<typeof X402ProtectedSpendEvidenceSchema>;

export const AuthMdX402InterlockPacketInputSchema = z
  .strictObject({
    packetId: IdSchema,
    profile: z.literal("protected_spend_provenance.v0").default("protected_spend_provenance.v0"),
    generatedAttempt: AuthMdX402GeneratedAttemptSchema,
    authMdProvenance: AuthMdProvenanceEvidenceSchema,
    x402ProtectedSpend: X402ProtectedSpendEvidenceSchema,
    proofGaps: z.array(AuthMdX402InterlockProofGapSchema).default([]),
  })
  .superRefine((input, ctx) => {
    if (input.authMdProvenance.rawCredentialMaterialObserved) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["authMdProvenance", "rawCredentialMaterialObserved"],
        message: "auth.md x402 interlock packets must not contain or attest raw credential material",
      });
    }
    if (input.x402ProtectedSpend.rawPaymentMaterialObserved) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["x402ProtectedSpend", "rawPaymentMaterialObserved"],
        message: "auth.md x402 interlock packets must not contain or attest raw x402 payment material",
      });
    }
  });
export type AuthMdX402InterlockPacketInput = z.input<typeof AuthMdX402InterlockPacketInputSchema>;

export const AuthMdX402RawMaterialPostureSchema = z.enum(["absent"]);
export type AuthMdX402RawMaterialPosture = z.infer<typeof AuthMdX402RawMaterialPostureSchema>;

export const AuthMdX402OrderingPostureSchema = z.enum(["post_gate_only", "not_proven"]);
export type AuthMdX402OrderingPosture = z.infer<typeof AuthMdX402OrderingPostureSchema>;

export const AuthMdX402InterlockPacketSchema = z.strictObject({
  packetKind: z.literal("auth_md_x402_interlock_packet"),
  packetVersion: z.literal("v0"),
  packetId: IdSchema,
  profile: z.literal("protected_spend_provenance.v0"),
  generatedAttempt: AuthMdX402GeneratedAttemptSchema,
  authMdProvenance: AuthMdProvenanceEvidenceSchema.extend({
    rawCredentialMaterialObserved: z.literal(false),
  }),
  x402ProtectedSpend: X402ProtectedSpendEvidenceSchema.extend({
    rawPaymentMaterialObserved: z.literal(false),
  }),
  proofGaps: z.array(AuthMdX402InterlockProofGapSchema),
  blockedChecks: z.array(NonEmptyStringSchema),
  readyForCompositeExecution: z.literal(false),
  rawMaterialPosture: AuthMdX402RawMaterialPostureSchema,
  credentialAndSignerOrdering: AuthMdX402OrderingPostureSchema,
  nonClaims: z.array(AuthMdX402InterlockNonClaimSchema),
  authorityBoundary: AuthMdX402InterlockAuthorityBoundarySchema,
});
export type AuthMdX402InterlockPacket = z.infer<typeof AuthMdX402InterlockPacketSchema>;

export function projectAuthMdX402InterlockPacket(
  inputValue: AuthMdX402InterlockPacketInput,
): AuthMdX402InterlockPacket {
  const input = AuthMdX402InterlockPacketInputSchema.parse(inputValue);
  const proofGaps = dedupeProofGaps([...input.proofGaps, ...derivedProofGaps(input)]);
  return AuthMdX402InterlockPacketSchema.parse({
    ...input,
    packetKind: "auth_md_x402_interlock_packet",
    packetVersion: "v0",
    proofGaps,
    blockedChecks: proofGaps.map((gap) => gap.reasonCode),
    readyForCompositeExecution: false,
    rawMaterialPosture: "absent",
    credentialAndSignerOrdering: orderingPostureFor(input),
    nonClaims: authMdX402InterlockNonClaims,
    authorityBoundary: authMdX402InterlockAuthorityBoundary,
  });
}

function derivedProofGaps(input: z.infer<typeof AuthMdX402InterlockPacketInputSchema>): AuthMdX402InterlockProofGap[] {
  const proofGaps: AuthMdX402InterlockProofGap[] = [];
  const authMdEvidenceRefs = authMdEvidenceRefsFor(input.authMdProvenance);
  const x402EvidenceRefs = x402EvidenceRefsFor(input.x402ProtectedSpend);

  if (input.authMdProvenance.discoveryEvidenceRefs.length === 0) {
    proofGaps.push(gap("auth_md_discovery_evidence_missing", authMdEvidenceRefs));
  }
  if (input.authMdProvenance.registrationEvidenceRefs.length === 0) {
    proofGaps.push(gap("auth_md_registration_evidence_missing", authMdEvidenceRefs));
  }
  if (input.authMdProvenance.credentialLifecycleState !== "active") {
    proofGaps.push(gap("auth_md_credential_lifecycle_not_active", authMdEvidenceRefs));
  }
  if (
    input.authMdProvenance.credentialResolutionPosture !== "post_gateway_check_evidence" ||
    input.authMdProvenance.credentialResolutionEvidenceRef === null
  ) {
    proofGaps.push(gap("auth_md_credential_resolution_missing", authMdEvidenceRefs));
  }
  if (input.x402ProtectedSpend.policyDecisionRef === null) {
    proofGaps.push(gap("x402_policy_decision_missing", x402EvidenceRefs));
  }
  if (input.x402ProtectedSpend.greenlightId === null) {
    proofGaps.push(gap("x402_greenlight_missing", x402EvidenceRefs));
  }
  if (input.x402ProtectedSpend.gatewayCheckRef === null) {
    proofGaps.push(gap("x402_gateway_check_missing", x402EvidenceRefs));
  }
  if (
    input.x402ProtectedSpend.signerInvocationPosture !== "post_gateway_check_evidence" ||
    input.x402ProtectedSpend.paymentSignatureEvidenceRef === null
  ) {
    proofGaps.push(gap("x402_payment_signature_missing", x402EvidenceRefs));
  }
  if (input.x402ProtectedSpend.replayRefusalEvidenceRefs.length === 0) {
    proofGaps.push(gap("x402_replay_refusal_evidence_missing", x402EvidenceRefs));
  }
  return proofGaps;
}

function orderingPostureFor(input: z.infer<typeof AuthMdX402InterlockPacketInputSchema>): AuthMdX402OrderingPosture {
  const credentialResolutionIsPostGate =
    input.authMdProvenance.credentialResolutionPosture === "post_gateway_check_evidence" &&
    input.authMdProvenance.credentialResolutionEvidenceRef !== null;
  const signingIsPostGate =
    input.x402ProtectedSpend.signerInvocationPosture === "post_gateway_check_evidence" &&
    input.x402ProtectedSpend.paymentSignatureEvidenceRef !== null;
  const x402GateEvidencePresent =
    input.x402ProtectedSpend.policyDecisionRef !== null &&
    input.x402ProtectedSpend.greenlightId !== null &&
    input.x402ProtectedSpend.gatewayCheckRef !== null;

  if (credentialResolutionIsPostGate && signingIsPostGate && x402GateEvidencePresent) {
    return "post_gate_only";
  }
  return "not_proven";
}

function authMdEvidenceRefsFor(provenance: AuthMdProvenanceEvidence): string[] {
  return [
    ...provenance.discoveryEvidenceRefs,
    ...provenance.registrationEvidenceRefs,
    ...provenance.identityAssertionEvidenceRefs,
    ...provenance.claimEvidenceRefs,
    ...provenance.revocationEvidenceRefs,
    provenance.credentialResolutionEvidenceRef,
    provenance.providerRegistryRef,
  ].filter((ref): ref is string => ref !== null);
}

function x402EvidenceRefsFor(protectedSpend: X402ProtectedSpendEvidence): string[] {
  return [
    protectedSpend.paymentRequiredEvidenceRef,
    protectedSpend.policyDecisionRef,
    protectedSpend.greenlightId,
    protectedSpend.gatewayCheckRef,
    protectedSpend.paymentSignatureEvidenceRef,
    ...protectedSpend.replayRefusalEvidenceRefs,
  ].filter((ref): ref is string => ref !== null);
}

function gap(reasonCode: string, evidenceRefs: string[]): AuthMdX402InterlockProofGap {
  return AuthMdX402InterlockProofGapSchema.parse({ reasonCode, evidenceRefs });
}

function dedupeProofGaps(proofGaps: AuthMdX402InterlockProofGap[]): AuthMdX402InterlockProofGap[] {
  const byReasonCode = new Map<string, AuthMdX402InterlockProofGap>();
  for (const proofGap of proofGaps) byReasonCode.set(proofGap.reasonCode, proofGap);
  return [...byReasonCode.values()].sort((left, right) => left.reasonCode.localeCompare(right.reasonCode));
}
