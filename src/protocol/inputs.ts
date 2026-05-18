import { z } from "zod";
import {
  BreakerIsolationDecisionSchema,
  IsolationStateSchema,
  JsonValueSchema,
  RecoveryRecommendationTerminalStatusSchema,
  RecoveryRecommendedPathSchema,
  StreamWatermarkSchema,
} from "./schemas";

export const CompileIntentInputSchema = z.strictObject({
  tenantId: z.string().min(1),
  organizationId: z.string().min(1),
  principalIntentRef: z.string().min(1),
  principalId: z.string().min(1),
  agentId: z.string().min(1),
  runId: z.string().min(1),
  runtimeAdapterId: z.string().min(1),
  operatingEnvelopeId: z.string().min(1),
  toolCatalogRef: z.string().min(1),
  actionCatalogRef: z.string().min(1),
  receiverRegistryRef: z.string().min(1),
  generatedCodeOrSpecRefs: z.array(z.string()).default([]),
  declaredAssumptions: z.array(z.string()).default([]),
  requiredEvidenceRefs: z.array(z.string()).default([]),
  candidate: z.strictObject({
    toolCapabilityId: z.string().min(1),
    actionTypeId: z.string().min(1),
    receiverRegistryEntryId: z.string().min(1),
    actionClass: z.string().min(1),
    receiverId: z.string().min(1),
    resourceRef: z.string().min(1),
  }),
  compilerVersion: z.string().min(1).default("handshake-compiler-0.2"),
});
export type CompileIntentInput = z.input<typeof CompileIntentInputSchema>;

export const ProposeActionContractInputSchema = z.strictObject({
  tenantId: z.string().min(1),
  organizationId: z.string().min(1),
  intentCompilationId: z.string().min(1),
  envelopeId: z.string().min(1),
  receiverRegistryEntryId: z.string().min(1),
  receiverId: z.string().min(1),
  principalId: z.string().min(1),
  agentId: z.string().min(1),
  runId: z.string().min(1),
  sequenceNumber: z.number().int().nonnegative(),
  requiredPriorActionContractIds: z.array(z.string().min(1)).default([]),
  recoveryRecommendationId: z.string().min(1).nullable().default(null),
  actionClass: z.string().min(1),
  resourceRef: z.string().min(1),
  parameters: z.record(z.string(), JsonValueSchema),
  nonSecretParamsSummary: z.record(z.string(), JsonValueSchema),
  purposeCode: z.string().min(1),
  expectedSideEffectCodes: z.array(z.string().min(1)),
  evidenceRefs: z.array(z.string()).default([]),
  bounds: z.record(z.string(), JsonValueSchema).default({}),
  idempotencyKey: z.string().min(1),
  rollbackHint: z.string().max(500).nullable().default(null),
  expiresAt: z.string().datetime({ offset: true }),
  signingSecret: z.string().min(1).optional(),
});
export type ProposeActionContractInput = z.input<typeof ProposeActionContractInputSchema>;

export const EvaluatePolicyInputSchema = z.strictObject({
  actionContractId: z.string().min(1),
  envelopeId: z.string().min(1),
  policyEvaluatorVersion: z.string().min(1).default("handshake-policy-0.2"),
  signingSecret: z.string().min(1).optional(),
  reviewDecisionId: z.string().min(1).optional(),
});
export type EvaluatePolicyInput = z.input<typeof EvaluatePolicyInputSchema>;

export const CreateReviewDecisionInputSchema = z.strictObject({
  actionContractId: z.string().min(1),
  policyDecisionId: z.string().min(1),
  reviewerPrincipalId: z.string().min(1),
  reviewArtifactRef: z.string().min(1),
  reviewRenderSchemaVersion: z.string().min(1),
  decision: z.enum(["approve", "reject", "needs_changes"]),
  decisionReasonCode: z.string().min(2),
  decisionExpiresAt: z.string().datetime({ offset: true }),
  signatureOrAttestationRef: z.string().min(1),
});
export type CreateReviewDecisionInput = z.input<typeof CreateReviewDecisionInputSchema>;

export const ReceiverGateInputSchema = z.strictObject({
  actionContractId: z.string().min(1),
  greenlightId: z.string().min(1),
  observedParameters: z.record(z.string(), JsonValueSchema),
  downstreamMode: z.enum(["succeed", "pending", "refuse", "fail", "unknown"]).default("succeed"),
  receiverOperationRef: z.string().min(1).optional(),
});
export type ReceiverGateInput = z.input<typeof ReceiverGateInputSchema>;

export const ReconcileReceiverOperationInputSchema = z.strictObject({
  mutationAttemptId: z.string().min(1),
  idempotencyKey: z.string().min(1),
  observedDownstreamStatus: z.enum(["pending", "succeeded", "refused", "failed", "unknown"]),
  observedReceiverOperationRef: z.string().min(1).nullable().default(null),
  evidenceRefs: z.array(z.string()).default([]),
  resolvedProofGapIds: z.array(z.string().min(1)).default([]),
});
export type ReconcileReceiverOperationInput = z.input<typeof ReconcileReceiverOperationInputSchema>;

export const CreateIsolationInputSchema = z.strictObject({
  tenantId: z.string().min(1),
  organizationId: z.string().min(1),
  scopeType: IsolationStateSchema.shape.scopeType,
  scopeId: z.string().min(1),
  state: IsolationStateSchema.shape.state,
  reasonCode: z.string().min(2),
  reasonSummary: z.string().min(1),
  sourceDecisionRef: z.string().min(1),
  observedStreamOffsets: z.array(StreamWatermarkSchema).default([]),
  expiresAt: z.string().datetime({ offset: true }).nullable().default(null),
});
export type CreateIsolationInput = z.input<typeof CreateIsolationInputSchema>;

export const CreateBreakerDecisionInputSchema = z.strictObject({
  tenantId: z.string().min(1),
  organizationId: z.string().min(1),
  listenerId: z.string().min(1),
  listenerVersion: z.string().min(1),
  rulePackRef: z.string().min(1),
  rulePackVersion: z.string().min(1),
  observedStreamOffsets: z.array(StreamWatermarkSchema).min(1),
  decision: BreakerIsolationDecisionSchema,
  decisionReasonCode: z.string().min(2),
  decisionReason: z.string().min(1),
  targetScopeType: IsolationStateSchema.shape.scopeType,
  targetScopeId: z.string().min(1),
  agentId: z.string().min(1).nullable().default(null),
  runId: z.string().min(1).nullable().default(null),
  receiverId: z.string().min(1).nullable().default(null),
  resourceRef: z.string().min(1).nullable().default(null),
  actionClass: z.string().min(1).nullable().default(null),
  matchedBreakerRuleIds: z.array(z.string().min(1)).default([]),
  supportingEventRefs: z.array(z.string().min(1)).default([]),
  missingEventRefs: z.array(z.string().min(1)).default([]),
  proofGapRefs: z.array(z.string().min(1)).default([]),
  decisionExpiresAt: z.string().datetime({ offset: true }).nullable().default(null),
});
export type CreateBreakerDecisionInput = z.input<typeof CreateBreakerDecisionInputSchema>;

export const CreateReceiptExportInputSchema = z.strictObject({
  receiptId: z.string().min(1),
  exportFormat: z.enum(["json", "redacted_json"]).default("redacted_json"),
  redactionProfileRef: z.string().min(1).default("redaction:default"),
  exportPurposeCode: z.string().min(1).default("audit_drop_copy"),
  requestedByRef: z.string().min(1),
  evidenceRetentionUntil: z.string().datetime({ offset: true }).nullable().default(null),
});
export type CreateReceiptExportInput = z.input<typeof CreateReceiptExportInputSchema>;

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
export type ResolveRecoveryTerminalConflictInput = z.input<
  typeof ResolveRecoveryTerminalConflictInputSchema
>;
