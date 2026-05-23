import { z } from "zod";
import {
  BreakerDecisionSchema,
  GatewayCheckAttemptSchema,
  GreenlightSchema,
  IsolationStateSchema,
  MutationAttemptSchema,
  PolicyDecisionSchema,
  ProofGapSchema,
  ReceiptSchema,
  RecoveryRecommendationSchema,
  RecoveryRecommendationStatusTransitionSchema,
  SurfaceOperationReconciliationSchema,
} from "../../protocol/public/schemas";

export const PolicyEvaluationResponseSchema = z.strictObject({
  decision: PolicyDecisionSchema,
  greenlight: GreenlightSchema.nullable(),
  authorityCreated: z.boolean(),
  gatewayCheckPerformed: z.literal(false),
  mutationAttempted: z.literal(false),
  policyDecisionRef: z.string().min(1),
  greenlightRef: z.string().min(1).nullable(),
  refusalRef: z.string().min(1).nullable(),
  refusalReasonCode: z.string().min(1).nullable(),
  reviewRequired: z.boolean(),
  nextAction: z.enum(["use_greenlight_at_gateway", "read_evidence", "request_review"]),
  retryability: z.literal("not_retryable"),
  evidenceRefs: z.array(z.string().min(1)),
});

export const GatewayCheckResponseSchema = z.strictObject({
  gateAttempt: GatewayCheckAttemptSchema,
  mutationAttempt: MutationAttemptSchema.nullable(),
  receipt: ReceiptSchema,
  proofGap: ProofGapSchema.nullable(),
});

export const SurfaceOperationReconciliationResponseSchema = z.strictObject({
  reconciliation: SurfaceOperationReconciliationSchema,
  resolvedProofGaps: z.array(ProofGapSchema),
  createdProofGap: ProofGapSchema.nullable(),
});

export const BreakerDecisionResponseSchema = z.strictObject({
  breakerDecision: BreakerDecisionSchema,
  isolationState: IsolationStateSchema,
});

export const RecoveryRecommendationStatusResponseSchema = z.strictObject({
  recoveryRecommendation: RecoveryRecommendationSchema,
  statusTransition: RecoveryRecommendationStatusTransitionSchema,
});

export const RecoveryTerminalConflictResolutionResponseSchema = z.strictObject({
  proofGap: ProofGapSchema,
  statusTransition: RecoveryRecommendationStatusTransitionSchema,
  recoveryRecommendation: RecoveryRecommendationSchema,
});
