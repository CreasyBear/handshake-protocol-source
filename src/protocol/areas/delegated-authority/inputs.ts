import { z } from "zod";
import { DelegatedAuthorityRefSchema, DelegatedAuthorityTerminalGrantStatusSchema } from "./schemas";

export const RegisterDelegatedAuthorityRefInputSchema = z.strictObject({
  tenantId: z.string().min(1),
  organizationId: z.string().min(1),
  delegatedAuthorityRefId: z.string().min(1).optional(),
  principalId: z.string().min(1),
  agentId: z.string().min(1),
  runtimeAdapterId: z.string().min(1),
  operatingEnvelopeId: z.string().min(1),
  gatewayId: z.string().min(1),
  gatewayRegistryEntryId: z.string().min(1),
  protectedSurfaceKind: z.string().min(1),
  actionClasses: DelegatedAuthorityRefSchema.shape.actionClasses,
  resourceRefs: DelegatedAuthorityRefSchema.shape.resourceRefs,
  authorityKind: DelegatedAuthorityRefSchema.shape.authorityKind,
  grantStatus: DelegatedAuthorityRefSchema.shape.grantStatus.default("active"),
  policyPackRef: DelegatedAuthorityRefSchema.shape.policyPackRef,
  policyPackVersion: z.string().min(1),
  amountParameterName: DelegatedAuthorityRefSchema.shape.amountParameterName,
  maxAtomicAmountPerAction: DelegatedAuthorityRefSchema.shape.maxAtomicAmountPerAction,
  evidenceExpectationRefs: DelegatedAuthorityRefSchema.shape.evidenceExpectationRefs,
  issuedAt: z.string().datetime({ offset: true }).optional(),
  expiresAt: z.string().datetime({ offset: true }),
});
export type RegisterDelegatedAuthorityRefInput = z.input<typeof RegisterDelegatedAuthorityRefInputSchema>;

export const TransitionDelegatedAuthorityStatusInputSchema = z.strictObject({
  delegatedAuthorityRefId: z.string().min(1),
  nextGrantStatus: DelegatedAuthorityTerminalGrantStatusSchema,
  reasonCode: z.string().min(2),
  reasonSummary: z.string().min(1),
  changedByRef: z.string().min(1),
  isolationExpiresAt: z.string().datetime({ offset: true }).nullable().default(null),
});
export type TransitionDelegatedAuthorityStatusInput = z.input<typeof TransitionDelegatedAuthorityStatusInputSchema>;
