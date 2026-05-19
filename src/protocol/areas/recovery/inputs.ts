import { z } from "zod";
import { RecoveryRecommendationTerminalStatusSchema, RecoveryRecommendedPathSchema } from "./schemas";

export const CreateRecoveryRecommendationInputSchema = z.strictObject({
  sourceReceiptId: z.string().min(1),
  sourceRefusalOrGapRef: z.string().min(1).optional(),
  recommendedPath: RecoveryRecommendedPathSchema,
  allowedNextActionClasses: z.array(z.string().min(1)).default([]),
  requiredNewEvidence: z.array(z.string().min(1)).default([]),
  requiresHumanReview: z.boolean().default(true),
  reasonCode: z.string().min(2),
  reasonSummary: z.string().min(1),
  reviewDecisionRef: z.string().min(1).nullable().default(null),
  policyChangeRef: z.string().min(1).nullable().default(null),
  recoveryExpiresAt: z.string().datetime({ offset: true }).nullable().default(null),
  reviewDueAt: z.string().datetime({ offset: true }).nullable().default(null),
  retryNotBefore: z.string().datetime({ offset: true }).nullable().default(null),
});
export type CreateRecoveryRecommendationInput = z.input<typeof CreateRecoveryRecommendationInputSchema>;

export const TransitionRecoveryRecommendationStatusInputSchema = z.strictObject({
  recoveryRecommendationId: z.string().min(1),
  nextStatus: RecoveryRecommendationTerminalStatusSchema,
  reasonCode: z.string().min(2),
  reasonSummary: z.string().min(1),
  changedByRef: z.string().min(1),
  supersededByActionContractId: z.string().min(1).nullable().default(null),
});
export type TransitionRecoveryRecommendationStatusInput = z.input<
  typeof TransitionRecoveryRecommendationStatusInputSchema
>;

export const ResolveRecoveryTerminalConflictInputSchema = z.strictObject({
  proofGapId: z.string().min(1),
  recoveryRecommendationStatusTransitionId: z.string().min(1),
  observedByRef: z.string().min(1),
});
export type ResolveRecoveryTerminalConflictInput = z.input<typeof ResolveRecoveryTerminalConflictInputSchema>;
