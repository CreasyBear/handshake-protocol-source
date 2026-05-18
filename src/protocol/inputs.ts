import { z } from "zod";
import {
  BreakerIsolationDecisionSchema,
  CredentialCustodyStatusSchema,
  IsolationStateSchema,
  JsonValueSchema,
  PostureSourceAuthoritySchema,
  ProtectedPathStateSchema,
  RawSiblingToolStatusSchema,
  RecoveryRecommendationTerminalStatusSchema,
  RecoveryRecommendedPathSchema,
  RuntimeAccessPostureSchema,
  RuntimeExecutionShapeSchema,
  RuntimePostureSchema,
  StreamWatermarkSchema,
} from "./schemas";

const DigestInputSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/);

export const CreateRuntimeExecutionInputSchema = z.strictObject({
  tenantId: z.string().min(1),
  organizationId: z.string().min(1),
  principalIntentRef: z.string().min(1),
  principalId: z.string().min(1),
  agentId: z.string().min(1),
  runId: z.string().min(1),
  runtimeAdapterId: z.string().min(1),
  executionShape: RuntimeExecutionShapeSchema,
  runtimePosture: RuntimePostureSchema,
  executionBlockRef: z.string().min(1),
  executionBlockDigest: DigestInputSchema,
  generatedCodeOrSpecRefs: z.array(z.string().min(1)).default([]),
  allowedToolCapabilityIds: z.array(z.string().min(1)).default([]),
  observedToolCallRefs: z.array(z.string().min(1)).default([]),
  observedConsequentialCallCount: z.number().int().nonnegative().default(0),
  loopDetected: z.boolean().default(false),
  retryDetected: z.boolean().default(false),
  branchDetected: z.boolean().default(false),
  dynamicToolConstructionDetected: z.boolean().default(false),
  unobservedRegionRefs: z.array(z.string().min(1)).default([]),
  accessPosture: RuntimeAccessPostureSchema,
  uncertaintyMarkers: z.array(z.string().min(1)).default([]),
  refusalReasonCodes: z.array(z.string().min(2)).default([]),
  evidenceRefs: z.array(z.string().min(1)).default([]),
});
export type CreateRuntimeExecutionInput = z.input<typeof CreateRuntimeExecutionInputSchema>;

export const CreateProtectedPathPostureInputSchema = z.strictObject({
  tenantId: z.string().min(1),
  organizationId: z.string().min(1),
  runtimeAdapterId: z.string().min(1),
  gatewayId: z.string().min(1),
  actionClass: z.string().min(1),
  resourceRef: z.string().min(1),
  protectedSurfaceKind: z.string().min(1),
  postureState: ProtectedPathStateSchema,
  credentialCustodyStatus: CredentialCustodyStatusSchema,
  rawSiblingToolStatus: RawSiblingToolStatusSchema,
  sourceAuthority: PostureSourceAuthoritySchema,
  reasonCodes: z.array(z.string().min(2)).default([]),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  observedAt: z.string().datetime({ offset: true }).optional(),
  expiresAt: z.string().datetime({ offset: true }),
});
export type CreateProtectedPathPostureInput = z.input<typeof CreateProtectedPathPostureInputSchema>;

export const CreateReviewArtifactInputSchema = z.strictObject({
  actionContractId: z.string().min(1),
  policyDecisionId: z.string().min(1),
  reviewArtifactRef: z.string().min(1),
  reviewRenderSchemaVersion: z.string().min(1),
  rendererRef: z.string().min(1),
  renderedContractDigest: DigestInputSchema,
  renderedPolicyInputDigest: DigestInputSchema,
  renderedUncertaintyDigest: DigestInputSchema,
  renderedArtifactDigest: DigestInputSchema,
  uncertaintyMarkers: z.array(z.string().min(1)).default([]),
  evidenceRefs: z.array(z.string().min(1)).default([]),
});
export type CreateReviewArtifactInput = z.input<typeof CreateReviewArtifactInputSchema>;

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
  gatewayRegistryRef: z.string().min(1),
  runtimeExecutionId: z.string().min(1).nullable().default(null),
  generatedCodeOrSpecRefs: z.array(z.string()).default([]),
  declaredAssumptions: z.array(z.string()).default([]),
  requiredEvidenceRefs: z.array(z.string()).default([]),
  candidate: z.strictObject({
    toolCapabilityId: z.string().min(1),
    actionTypeId: z.string().min(1),
    gatewayRegistryEntryId: z.string().min(1),
    actionClass: z.string().min(1),
    gatewayId: z.string().min(1),
    resourceRef: z.string().min(1),
    sequenceNumber: z.number().int().nonnegative(),
    requiredPriorActionContractIds: z.array(z.string().min(1)).default([]),
    recoveryRecommendationId: z.string().min(1).nullable().default(null),
    parameters: z.record(z.string(), JsonValueSchema),
    nonSecretParamsSummary: z.record(z.string(), JsonValueSchema),
    secretRefs: z.record(z.string(), z.string().min(1)).default({}),
    purposeCode: z.string().min(1),
    expectedSideEffectCodes: z.array(z.string().min(1)),
    evidenceRefs: z.array(z.string()).default([]),
    bounds: z.record(z.string(), JsonValueSchema).default({}),
    idempotencyKey: z.string().min(1),
    rollbackHint: z.string().max(500).nullable().default(null),
    expiresAt: z.string().datetime({ offset: true }),
  }),
  compilerVersion: z.string().min(1).default("handshake-compiler-0.2"),
});
export type CompileIntentInput = z.input<typeof CompileIntentInputSchema>;

export const ProposeActionContractInputSchema = z.strictObject({
  intentCompilationId: z.string().min(1),
  candidateActionId: z.string().min(1),
  candidateDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/),
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
  reviewArtifactId: z.string().min(1),
  reviewArtifactDigest: DigestInputSchema,
  reviewerPrincipalId: z.string().min(1),
  decision: z.enum(["approve", "reject", "needs_changes"]),
  decisionReasonCode: z.string().min(2),
  decisionExpiresAt: z.string().datetime({ offset: true }),
  signatureOrAttestationRef: z.string().min(1),
});
export type CreateReviewDecisionInput = z.input<typeof CreateReviewDecisionInputSchema>;

export const GatewayCheckInputSchema = z.strictObject({
  actionContractId: z.string().min(1),
  greenlightId: z.string().min(1),
  observedParameters: z.record(z.string(), JsonValueSchema),
  surfaceOperationRef: z.string().min(1).optional(),
});
export type GatewayCheckInput = z.input<typeof GatewayCheckInputSchema>;

export const ReconcileSurfaceOperationInputSchema = z.strictObject({
  mutationAttemptId: z.string().min(1),
  idempotencyKey: z.string().min(1),
  observedDownstreamStatus: z.enum(["pending", "succeeded", "refused", "failed", "unknown"]),
  observedSurfaceOperationRef: z.string().min(1).nullable().default(null),
  evidenceRefs: z.array(z.string()).default([]),
  resolvedProofGapIds: z.array(z.string().min(1)).default([]),
});
export type ReconcileSurfaceOperationInput = z.input<typeof ReconcileSurfaceOperationInputSchema>;

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
  gatewayId: z.string().min(1).nullable().default(null),
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
