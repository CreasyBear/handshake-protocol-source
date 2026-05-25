import { z } from "zod";
import {
  ActionContractSchema,
  BreakerDecisionSchema,
  GeneratedExecutionCoverageStatusSchema,
  GeneratedExecutionGraphSchema,
  GatewayCheckAttemptSchema,
  GreenlightSchema,
  IntentCompilationRecordSchema,
  IsolationStateSchema,
  MutationAttemptSchema,
  PolicyDecisionSchema,
  ProofGapSchema,
  ReceiptSchema,
  RecoveryRecommendationSchema,
  RecoveryRecommendationStatusTransitionSchema,
  RuntimeExecutionRecordSchema,
  SurfaceOperationReconciliationSchema,
  ToolCallDraftSchema,
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

export const RuntimeIngressResponsePostureSchema = z.strictObject({
  schemaVersion: z.literal("handshake.runtime-ingress.outcome.v1"),
  authorityCreated: z.literal(false),
  authorityCertificateMinted: z.literal(false),
  credentialMaterialIncluded: z.literal(false),
  gatewayCheckPerformed: z.literal(false),
  greenlightCreated: z.literal(false),
  mutationAttempted: z.literal(false),
  mutationCommandIncluded: z.literal(false),
  rawInternalRecordIncluded: z.literal(false),
  receiptExportCreated: z.literal(false),
  reasonCodes: z.array(z.string().min(1)),
  nextAction: z.enum(["read_evidence", "recraft_request", "stop"]),
  retryability: z.enum(["not_retryable", "retryable_after_recraft"]),
  redactionProfileRef: z.literal("runtime-ingress:v0.1-redacted"),
  evidenceRefs: z.array(z.string().min(1)),
  runtimeExecutionRef: z.string().min(1),
  generatedExecutionGraphRef: z.string().min(1),
  graphCoverageStatus: GeneratedExecutionCoverageStatusSchema,
  toolCallDraftRefs: z.array(z.string().min(1)),
  intentCompilationRefs: z.array(z.string().min(1)),
  actionContractRefs: z.array(z.string().min(1)),
  refusalRefs: z.array(z.string().min(1)),
  dispatchCount: z.number().int().nonnegative(),
});

export const RuntimeIngressActionProposalResponseSchema = z.discriminatedUnion("outcome", [
  z.strictObject({
    outcome: z.literal("action_contract_proposed"),
    dispatchRef: z.string().min(1),
    sequenceNumber: z.number().int().positive(),
    toolCallDraft: ToolCallDraftSchema,
    intentCompilation: IntentCompilationRecordSchema,
    actionContract: ActionContractSchema,
    refusalReasonCodes: z.tuple([]),
  }),
  z.strictObject({
    outcome: z.literal("intent_compilation_refused"),
    dispatchRef: z.string().min(1),
    sequenceNumber: z.number().int().positive(),
    toolCallDraft: ToolCallDraftSchema,
    intentCompilation: IntentCompilationRecordSchema,
    actionContract: z.null(),
    refusalReasonCodes: z.array(z.string().min(1)),
  }),
]);

export const RuntimeIngressProposalResponseSchema = z.strictObject({
  outcome: z.enum(["action_contracts_proposed", "one_or_more_dispatches_refused"]),
  responsePosture: RuntimeIngressResponsePostureSchema,
  runtimeExecution: RuntimeExecutionRecordSchema,
  generatedExecutionGraph: GeneratedExecutionGraphSchema,
  proposals: z.array(RuntimeIngressActionProposalResponseSchema),
});
