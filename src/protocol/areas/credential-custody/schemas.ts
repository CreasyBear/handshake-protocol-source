import { z } from "zod";
import {
  DigestSchema,
  IdSchema,
  IsoDateSchema,
  ProtocolBaseSchema,
  ReasonCodeSchema,
  ResourceRefSchema,
} from "../../foundation/schema-core";
import { CredentialCustodyStatusSchema } from "../catalog-envelope/schemas";

const CredentialSafeStringSchema = z
  .string()
  .min(1)
  .refine((value) => !looksLikeCredentialMaterial(value), {
    message: "credential custody records must not contain raw credential material",
  });

export const GatewayCredentialBindingSchema = z.strictObject({
  credentialUseName: z.string().min(1),
  gatewayCredentialRefId: IdSchema,
  gatewayCredentialRefDigest: DigestSchema,
  providerRegistryRef: CredentialSafeStringSchema,
  providerRegistryDigest: DigestSchema.nullable().default(null),
  requiredCredentialCustodyStatus: CredentialCustodyStatusSchema,
  evidenceExpectationRefs: z.array(CredentialSafeStringSchema).default([]),
});
export type GatewayCredentialBinding = z.infer<typeof GatewayCredentialBindingSchema>;

export const GatewayCredentialRefSchema = ProtocolBaseSchema.extend({
  gatewayCredentialRefId: IdSchema,
  gatewayCredentialRefDigest: DigestSchema,
  principalId: IdSchema.nullable().default(null),
  gatewayId: IdSchema,
  gatewayRegistryEntryId: IdSchema,
  protectedSurfaceKind: z.string().min(1),
  actionClasses: z.array(z.string().min(1)).min(1),
  resourceRefs: z.array(ResourceRefSchema).min(1),
  resourceNamespaceRef: z.string().min(1),
  credentialKind: CredentialSafeStringSchema,
  custodyStatus: CredentialCustodyStatusSchema,
  providerClass: CredentialSafeStringSchema,
  providerRegistryRef: CredentialSafeStringSchema,
  providerRegistryDigest: DigestSchema.nullable().default(null),
  resolverRef: CredentialSafeStringSchema,
  resolverVersion: z.string().min(1),
  evidenceExpectationRefs: z.array(CredentialSafeStringSchema).default([]),
  redactionProfileRef: z.literal("gateway-credential-ref:v0.2-redacted"),
  secretMaterialIncluded: z.literal(false),
  issuedAt: IsoDateSchema,
  expiresAt: IsoDateSchema.nullable(),
});
export type GatewayCredentialRef = z.infer<typeof GatewayCredentialRefSchema>;

export const CredentialResolutionResultClassSchema = z.enum([
  "resolved_for_gateway_use",
  "used_by_gateway",
  "refused_missing_ref",
  "refused_stale_ref",
  "refused_provider_unavailable",
  "refused_vault_auth_denied",
  "refused_provider_drift",
  "refused_unsafe_custody",
  "refused_redaction_failure",
  "proof_gap",
  "replay_refused",
  "isolation_blocked",
]);
export type CredentialResolutionResultClass = z.infer<typeof CredentialResolutionResultClassSchema>;

export const CredentialResolutionRedactionStatusSchema = z.enum([
  "redacted",
  "digest_only",
  "proof_gap",
  "redaction_failed",
]);
export type CredentialResolutionRedactionStatus = z.infer<typeof CredentialResolutionRedactionStatusSchema>;

export const CredentialResolutionEvidenceSchema = ProtocolBaseSchema.extend({
  credentialResolutionEvidenceId: IdSchema,
  gatewayCredentialRefId: IdSchema,
  gatewayCredentialRefDigest: DigestSchema,
  actionContractId: IdSchema,
  greenlightId: IdSchema,
  gateAttemptId: IdSchema,
  mutationAttemptId: IdSchema.nullable(),
  gatewayId: IdSchema,
  providerClass: CredentialSafeStringSchema,
  providerRegistryRef: CredentialSafeStringSchema,
  providerRegistryDigest: DigestSchema.nullable().default(null),
  resolverRef: CredentialSafeStringSchema,
  resolverVersion: z.string().min(1),
  requestDigest: DigestSchema,
  resultClass: CredentialResolutionResultClassSchema,
  resultReasonCode: ReasonCodeSchema,
  redactionStatus: CredentialResolutionRedactionStatusSchema,
  providerRequestRef: CredentialSafeStringSchema.nullable().default(null),
  providerOperationRef: CredentialSafeStringSchema.nullable().default(null),
  proofGapId: IdSchema.nullable().default(null),
  refusalId: IdSchema.nullable().default(null),
  evidenceRefs: z.array(CredentialSafeStringSchema).default([]),
  redactionProfileRef: z.literal("credential-resolution-evidence:v0.2-redacted"),
  credentialMaterialIncluded: z.literal(false),
  recordedAt: IsoDateSchema,
  evidenceDigest: DigestSchema,
});
export type CredentialResolutionEvidence = z.infer<typeof CredentialResolutionEvidenceSchema>;

export const GatewayCustodyClaimLevelSchema = z.enum([
  "local_fixture",
  "customer_gateway_evidence",
  "provider_gateway_evidence",
  "proof_gap",
]);
export type GatewayCustodyClaimLevel = z.infer<typeof GatewayCustodyClaimLevelSchema>;

export const GatewayCustodyDriftStatusSchema = z.enum([
  "current",
  "stale",
  "provider_drift",
  "resolver_drift",
  "unsafe_custody",
  "proof_gap",
]);
export type GatewayCustodyDriftStatus = z.infer<typeof GatewayCustodyDriftStatusSchema>;

export const GatewayCustodyExternalVerificationStatusSchema = z.enum([
  "not_required",
  "required_before_live_claim",
  "verified_by_official_source",
]);
export type GatewayCustodyExternalVerificationStatus = z.infer<typeof GatewayCustodyExternalVerificationStatusSchema>;

export const GatewayCustodyProofPacketSchema = ProtocolBaseSchema.extend({
  gatewayCustodyProofPacketId: IdSchema,
  gatewayCustodyProofPacketDigest: DigestSchema,
  gatewayCredentialRefId: IdSchema,
  gatewayCredentialRefDigest: DigestSchema,
  protectedPathPostureId: IdSchema,
  protectedPathPostureDigest: DigestSchema,
  gatewayInstallEvidenceRefs: z.array(CredentialSafeStringSchema).default([]),
  gatewayInstallEvidenceDigests: z.array(DigestSchema).default([]),
  bypassProbeIds: z.array(IdSchema).default([]),
  bypassProbeDigests: z.array(DigestSchema).default([]),
  gatewayId: IdSchema,
  gatewayRegistryEntryId: IdSchema,
  protectedSurfaceKind: z.string().min(1),
  actionClasses: z.array(z.string().min(1)).min(1),
  resourceRefs: z.array(ResourceRefSchema).min(1),
  custodyProviderClass: CredentialSafeStringSchema,
  custodyProviderRegistryRef: CredentialSafeStringSchema,
  custodyProviderRegistryDigest: DigestSchema.nullable().default(null),
  opaqueKeyHandleRef: CredentialSafeStringSchema,
  opaqueKeyHandleDigest: DigestSchema,
  credentialKind: CredentialSafeStringSchema,
  credentialCustodyStatus: CredentialCustodyStatusSchema,
  custodyClaimLevel: GatewayCustodyClaimLevelSchema,
  resolverRef: CredentialSafeStringSchema,
  resolverVersion: z.string().min(1),
  leaseRef: CredentialSafeStringSchema.nullable().default(null),
  leaseVersion: z.string().min(1).nullable().default(null),
  leaseIssuedAt: IsoDateSchema.nullable().default(null),
  leaseExpiresAt: IsoDateSchema.nullable().default(null),
  attestationRefs: z.array(CredentialSafeStringSchema).default([]),
  attestationDigests: z.array(DigestSchema).default([]),
  redactedAuditRefs: z.array(CredentialSafeStringSchema).default([]),
  redactedAuditDigest: DigestSchema.nullable().default(null),
  custodyDriftStatus: GatewayCustodyDriftStatusSchema,
  resolverDriftStatus: GatewayCustodyDriftStatusSchema,
  redactionStatus: CredentialResolutionRedactionStatusSchema,
  externalVerificationStatus: GatewayCustodyExternalVerificationStatusSchema,
  redactionProfileRef: z.literal("gateway-custody-proof-packet:v0.2-redacted"),
  secretMaterialIncluded: z.literal(false),
  authorityCreated: z.literal(false),
  recordedAt: IsoDateSchema,
  expiresAt: IsoDateSchema,
});
export type GatewayCustodyProofPacket = z.infer<typeof GatewayCustodyProofPacketSchema>;

function looksLikeCredentialMaterial(value: string): boolean {
  return credentialMaterialVariants(value).some((variant) =>
    [
      /BEGIN\s+(?:RSA\s+|EC\s+|OPENSSH\s+)?PRIVATE KEY/i,
      /PAYMENT-SIGNATURE\s*:/i,
      /PaymentPayload/i,
      /raw[_-]?payment[_-]?signature/i,
      /token[_-]?passthrough/i,
      /facilitator[_-]?secret/i,
      /private[_-]?key/i,
      /api[_-]?key\s*=/i,
      /access[_-]?token\s*=/i,
      /secret\s*=/i,
      /password\s*=/i,
      /vault:\/\/.*\/secret/i,
      /infisical:\/\/.*\/secret/i,
    ].some((pattern) => pattern.test(variant)),
  );
}

function credentialMaterialVariants(value: string): string[] {
  const variants = new Set<string>([value]);
  try {
    variants.add(decodeURIComponent(value));
  } catch {
    // Keep the original value only when percent decoding is malformed.
  }

  for (const token of value.match(/[A-Za-z0-9+/_=-]{16,}/g) ?? []) {
    const decoded = decodeBase64Like(token);
    if (decoded) variants.add(decoded);
  }

  return [...variants];
}

function decodeBase64Like(token: string): string | null {
  const normalized = token.replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) return null;
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  try {
    const decoded = atob(`${normalized}${"=".repeat(paddingLength)}`);
    return /^[\x09\x0a\x0d\x20-\x7e]+$/.test(decoded) ? decoded : null;
  } catch {
    return null;
  }
}
