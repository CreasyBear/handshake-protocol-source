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

function looksLikeCredentialMaterial(value: string): boolean {
  return [
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
  ].some((pattern) => pattern.test(value));
}
