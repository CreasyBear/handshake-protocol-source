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
