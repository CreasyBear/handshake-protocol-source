import { z } from "zod";
import {
  DigestSchema,
  IdSchema,
  IsoDateSchema,
  ProtocolBaseSchema,
  ReasonCodeSchema,
  ResourceRefSchema,
} from "../../foundation/schema-core";

const AtomicAmountSchema = z.string().regex(/^(?:0|[1-9]\d*)$/);

const AuthoritySafeStringSchema = z
  .string()
  .min(1)
  .refine((value) => !looksLikeAuthoritySecret(value), {
    message: "delegated authority refs must not contain raw credential or signing material",
  });

export const DelegatedAuthorityKindSchema = z.enum(["spend", "mutation", "api_call"]);
export type DelegatedAuthorityKind = z.infer<typeof DelegatedAuthorityKindSchema>;

export const DelegatedAuthorityGrantStatusSchema = z.enum(["active", "revoked", "expired"]);
export type DelegatedAuthorityGrantStatus = z.infer<typeof DelegatedAuthorityGrantStatusSchema>;

export const DelegatedAuthorityTerminalGrantStatusSchema = z.enum(["revoked", "expired"]);
export type DelegatedAuthorityTerminalGrantStatus = z.infer<typeof DelegatedAuthorityTerminalGrantStatusSchema>;

export const DelegatedAuthorityBindingSchema = z.strictObject({
  authorityUseName: AuthoritySafeStringSchema,
  delegatedAuthorityRefId: IdSchema,
  delegatedAuthorityRefDigest: DigestSchema,
  requiredGrantStatus: z.literal("active").default("active"),
  authorityKind: DelegatedAuthorityKindSchema,
  policyPackRef: AuthoritySafeStringSchema,
  policyPackVersion: z.string().min(1),
  evidenceExpectationRefs: z.array(AuthoritySafeStringSchema).default([]),
});
export type DelegatedAuthorityBinding = z.infer<typeof DelegatedAuthorityBindingSchema>;

export const DelegatedAuthorityRefSchema = ProtocolBaseSchema.extend({
  delegatedAuthorityRefId: IdSchema,
  delegatedAuthorityRefDigest: DigestSchema,
  principalId: IdSchema,
  agentId: IdSchema,
  runtimeAdapterId: IdSchema,
  operatingEnvelopeId: IdSchema,
  gatewayId: IdSchema,
  gatewayRegistryEntryId: IdSchema,
  protectedSurfaceKind: z.string().min(1),
  actionClasses: z.array(z.string().min(1)).min(1),
  resourceRefs: z.array(ResourceRefSchema).min(1),
  authorityKind: DelegatedAuthorityKindSchema,
  grantStatus: DelegatedAuthorityGrantStatusSchema,
  policyPackRef: AuthoritySafeStringSchema,
  policyPackVersion: z.string().min(1),
  amountParameterName: AuthoritySafeStringSchema.nullable().default(null),
  maxAtomicAmountPerAction: AtomicAmountSchema.nullable().default(null),
  evidenceExpectationRefs: z.array(AuthoritySafeStringSchema).default([]),
  redactionProfileRef: z.literal("delegated-authority-ref:v0.2-redacted"),
  secretMaterialIncluded: z.literal(false),
  mutationAuthorityCreated: z.literal(false),
  greenlightCreated: z.literal(false),
  issuedAt: IsoDateSchema,
  expiresAt: IsoDateSchema,
});
export type DelegatedAuthorityRef = z.infer<typeof DelegatedAuthorityRefSchema>;

export const DelegatedAuthorityStatusTransitionSchema = ProtocolBaseSchema.extend({
  delegatedAuthorityStatusTransitionId: IdSchema,
  delegatedAuthorityRefId: IdSchema,
  delegatedAuthorityRefDigest: DigestSchema,
  previousGrantStatus: DelegatedAuthorityGrantStatusSchema,
  nextGrantStatus: DelegatedAuthorityTerminalGrantStatusSchema,
  reasonCode: ReasonCodeSchema,
  reasonSummary: z.string().min(1).max(1000),
  changedByRef: AuthoritySafeStringSchema,
  changedAt: IsoDateSchema,
  isolationStateId: IdSchema,
  transitionDigest: DigestSchema,
});
export type DelegatedAuthorityStatusTransition = z.infer<typeof DelegatedAuthorityStatusTransitionSchema>;

function looksLikeAuthoritySecret(value: string): boolean {
  return authorityStringVariants(value).some((variant) =>
    [
      /BEGIN\s+(?:RSA\s+|EC\s+|OPENSSH\s+)?PRIVATE KEY/i,
      /PAYMENT-SIGNATURE\s*:/i,
      /raw[_-]?payment[_-]?signature/i,
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

function authorityStringVariants(value: string): string[] {
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
