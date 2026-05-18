import { z } from "zod";
import { DigestSchema, IdSchema, IsoDateSchema, ProtocolBaseSchema, ReasonCodeSchema, ResourceRefSchema } from "../schema-core";
import { GateDecisionSchema } from "../gateway-gate/schemas";
import { ReceiptSchema, ReceiptStreamReferenceSchema } from "../receipt-export/schemas";

export const RecoveryRecommendedPathSchema = z.enum([
  "narrower_action_contract_required",
  "gateway_reconciliation_required",
  "human_review_required",
  "compensating_action_contract_required",
  "halt_without_retry",
]);
export type RecoveryRecommendedPath = z.infer<typeof RecoveryRecommendedPathSchema>;

export const RecoveryRecommendationStatusSchema = z.enum(["open", "expired", "superseded"]);
export type RecoveryRecommendationStatus = z.infer<typeof RecoveryRecommendationStatusSchema>;

export const RecoveryRecommendationTerminalStatusSchema = z.enum(["expired", "superseded"]);
export type RecoveryRecommendationTerminalStatus = z.infer<typeof RecoveryRecommendationTerminalStatusSchema>;

export const RecoveryRecommendationSchema = ProtocolBaseSchema.extend({
  recoveryRecommendationId: IdSchema,
  sourceReceiptId: IdSchema,
  sourceActionContractId: IdSchema,
  sourcePolicyDecisionId: IdSchema,
  sourceGreenlightId: IdSchema.nullable(),
  sourceGateAttemptId: IdSchema.nullable(),
  sourceMutationAttemptId: IdSchema.nullable(),
  sourceRefusalOrGapRef: z.string().min(1),
  sourceFinalityStatus: ReceiptSchema.shape.finalityStatus,
  sourceGatewayCheckStatus: GateDecisionSchema.nullable(),
  sourceMutationAttemptStatus: ReceiptSchema.shape.mutationAttemptStatus,
  sourceDownstreamExecutionStatus: ReceiptSchema.shape.downstreamExecutionStatus,
  recommendedPath: RecoveryRecommendedPathSchema,
  allowedNextActionClasses: z.array(z.string().min(1)).default([]),
  requiredNewEvidence: z.array(z.string().min(1)).default([]),
  requiresHumanReview: z.boolean(),
  safeRetryAvailable: z.boolean(),
  scopeNarrowingRequired: z.boolean(),
  policyUpdateCandidate: z.boolean(),
  agentInstructionUpdateCandidate: z.boolean(),
  principalId: IdSchema,
  agentId: IdSchema,
  runId: IdSchema,
  gatewayId: IdSchema,
  resourceRef: ResourceRefSchema,
  actionClass: z.string().min(1),
  failureReceiptRef: IdSchema,
  proofGapIds: z.array(IdSchema).default([]),
  missingEvidenceRefs: z.array(z.string().min(1)).default([]),
  reviewDecisionRef: z.string().min(1).nullable(),
  policyChangeRef: z.string().min(1).nullable(),
  sourceReceiptDigest: DigestSchema,
  sourceAuditChainDigest: DigestSchema,
  sourceStreamOffsets: z.array(ReceiptStreamReferenceSchema).default([]),
  reasonCode: ReasonCodeSchema,
  reasonSummary: z.string().min(1).max(1000),
  recommendedAt: IsoDateSchema,
  recoveryExpiresAt: IsoDateSchema.nullable(),
  reviewDueAt: IsoDateSchema.nullable(),
  retryNotBefore: IsoDateSchema.nullable(),
  mustCreateNewActionContract: z.literal(true),
  mayReuseGreenlight: z.literal(false),
  mayMutateProtectedSurface: z.literal(false),
  recommendationStatus: RecoveryRecommendationStatusSchema,
  statusChangedAt: IsoDateSchema.nullable(),
  statusChangedByRef: z.string().min(1).nullable(),
  statusReasonCode: ReasonCodeSchema.nullable(),
  statusReasonSummary: z.string().min(1).max(1000).nullable(),
  supersededByActionContractId: IdSchema.nullable(),
  recommendationDigest: DigestSchema,
});
export type RecoveryRecommendation = z.infer<typeof RecoveryRecommendationSchema>;

export const RecoveryRecommendationStatusTransitionSchema = ProtocolBaseSchema.extend({
  recoveryRecommendationStatusTransitionId: IdSchema,
  recoveryRecommendationId: IdSchema,
  sourceReceiptId: IdSchema,
  sourceActionContractId: IdSchema,
  previousStatus: RecoveryRecommendationStatusSchema,
  nextStatus: RecoveryRecommendationTerminalStatusSchema,
  recommendationDigest: DigestSchema,
  reasonCode: ReasonCodeSchema,
  reasonSummary: z.string().min(1).max(1000),
  changedByRef: z.string().min(1),
  changedAt: IsoDateSchema,
  supersededByActionContractId: IdSchema.nullable(),
  transitionDigest: DigestSchema,
});
export type RecoveryRecommendationStatusTransition = z.infer<typeof RecoveryRecommendationStatusTransitionSchema>;
