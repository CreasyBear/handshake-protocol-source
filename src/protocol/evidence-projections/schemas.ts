import { z } from "zod";
import {
  ClearingEvidenceRefsSchema,
  DigestSchema,
  IdSchema,
  IsoDateSchema,
  JsonValueSchema,
  ReasonCodeSchema,
  ResourceRefSchema,
  SignaturePostureSchema,
} from "../foundation/schema-core";
import {
  CredentialCustodyStatusSchema,
  ParticipantIdentityBindingSchema,
  RequiredProtectedPathStateSchema,
} from "../areas/catalog-envelope/schemas";
import { GateDecisionSchema } from "../areas/gateway-gate/schemas";
import { IdempotencyLedgerStateSchema } from "../areas/idempotency-ledger/schemas";
import {
  DownstreamDiagnosticsRedactionPostureSchema,
  DownstreamRetryabilitySchema,
} from "../areas/operation-lifecycle/schemas";
import { PolicyDecisionValueSchema } from "../areas/policy-greenlight/schemas";
import {
  PostureSourceAuthoritySchema,
  ProtectedPathBypassProbeCoverageSchema,
  ProtectedPathStateSchema,
  RawSiblingToolStatusSchema,
} from "../areas/protected-path-posture/schemas";
import { GatewayCredentialBindingSchema } from "../areas/credential-custody/schemas";
import { DelegatedAuthorityBindingSchema } from "../areas/delegated-authority/schemas";
import {
  DownstreamOutcomeStatusSchema,
  GatewayAdmissionStatusSchema,
  ReceiptStreamReferenceSchema,
} from "../areas/receipt-export/schemas";
import { ContractStreamEventSchema } from "../events/schemas";

export const ContractEvidenceProjectionSchema = z.strictObject({
  actionContractRef: IdSchema,
  contractDigest: DigestSchema,
  intentCompilationRef: IdSchema,
  candidateActionRef: IdSchema,
  candidateDigest: DigestSchema,
  envelopeRef: IdSchema,
  principalRef: IdSchema,
  agentRef: IdSchema,
  participantIdentityBindings: z.array(ParticipantIdentityBindingSchema).default([]),
  runId: IdSchema,
  runtimeAdapterRef: IdSchema,
  actionClass: z.string().min(1),
  protectedSurfaceKind: z.string().min(1),
  resourceRef: ResourceRefSchema,
  gatewayId: IdSchema,
  gatewayPolicyVersion: z.string().min(1),
  requiredProtectedPathState: RequiredProtectedPathStateSchema,
  idempotencyKey: IdSchema,
  paramsDigest: DigestSchema,
  nonSecretParamsSummary: z.record(z.string(), JsonValueSchema),
  gatewayCredentialRefs: z.array(GatewayCredentialBindingSchema).default([]),
  delegatedAuthorityRefs: z.array(DelegatedAuthorityBindingSchema).default([]),
  evidenceRefs: z.array(z.string()).default([]),
  clearingEvidenceRefs: ClearingEvidenceRefsSchema,
  signaturePosture: SignaturePostureSchema,
  keyIdentityRef: z.string().min(1).nullable(),
  verificationPolicyRef: z.string().min(1).nullable(),
  generatedExecutionGraphRef: IdSchema.nullable(),
  generatedExecutionNodeRef: IdSchema.nullable(),
  redactionProfileRef: z.literal("contract-view:v0.2-redacted"),
  omittedFields: z.array(z.string().min(1)).default([]),
});
export type ContractEvidenceProjection = z.infer<typeof ContractEvidenceProjectionSchema>;

export const IdempotencyRecoveryDispositionSchema = z.enum([
  "missing",
  "same_params_result_available",
  "same_params_duplicate_refused",
  "different_params_refused",
  "terminal_unknown_requires_recovery",
]);
export type IdempotencyRecoveryDisposition = z.infer<typeof IdempotencyRecoveryDispositionSchema>;

export const IdempotencyRecoveryProjectionSchema = z.strictObject({
  actionContractRef: IdSchema,
  ledgerKeyDigest: DigestSchema,
  idempotencyKey: IdSchema,
  paramsDigest: DigestSchema,
  currentLedgerRef: IdSchema.nullable(),
  currentLedgerState: IdempotencyLedgerStateSchema.nullable(),
  paramsDigestMatch: z.boolean().nullable(),
  priorActionContractRef: IdSchema.nullable(),
  policyDecisionRef: IdSchema.nullable(),
  greenlightRef: IdSchema.nullable(),
  gateAttemptRef: IdSchema.nullable(),
  mutationAttemptRef: IdSchema.nullable(),
  receiptRef: IdSchema.nullable(),
  priorResultRefs: z.array(z.string().min(1)).default([]),
  recoveryDisposition: IdempotencyRecoveryDispositionSchema,
  reasonCodes: z.array(ReasonCodeSchema).default([]),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  redactionProfileRef: z.literal("idempotency-recovery:v0.2-redacted"),
  omittedFields: z.array(z.string().min(1)).default([]),
});
export type IdempotencyRecoveryProjection = z.infer<typeof IdempotencyRecoveryProjectionSchema>;

export const ReceiptTimelineEventProjectionSchema = z.strictObject({
  streamId: IdSchema,
  streamScope: ContractStreamEventSchema.shape.streamScope,
  partitionKey: z.string().min(1),
  offset: z.number().int().nonnegative(),
  eventType: ContractStreamEventSchema.shape.eventType,
  eventTime: IsoDateSchema,
  eventDigest: DigestSchema,
  objectRefs: z.array(z.string().min(1)).default([]),
});
export type ReceiptTimelineEventProjection = z.infer<typeof ReceiptTimelineEventProjectionSchema>;

export const ReceiptTimelineFailureEvidenceProjectionSchema = z.strictObject({
  downstreamRetryability: DownstreamRetryabilitySchema,
  providerRequestRef: z.string().min(1).nullable(),
  providerOperationRef: z.string().min(1).nullable(),
  redactedDiagnosticsDigest: DigestSchema.nullable(),
  traceRef: z.string().min(1).nullable(),
  spanRef: z.string().min(1).nullable(),
  diagnosticsRedactionPosture: DownstreamDiagnosticsRedactionPostureSchema,
});
export type ReceiptTimelineFailureEvidenceProjection = z.infer<typeof ReceiptTimelineFailureEvidenceProjectionSchema>;

export const ReceiptTimelineProjectionSchema = z.strictObject({
  receiptRef: IdSchema,
  actionContractRef: IdSchema,
  policyDecisionRef: IdSchema,
  greenlightRef: IdSchema.nullable(),
  gateAttemptRef: IdSchema.nullable(),
  mutationAttemptRef: IdSchema.nullable(),
  gatewayId: IdSchema,
  policyDecisionStatus: PolicyDecisionValueSchema,
  gatewayCheckStatus: GateDecisionSchema.nullable(),
  gatewayAdmissionStatus: GatewayAdmissionStatusSchema,
  greenlightConsumptionStatus: z.enum(["not_applicable", "not_consumed", "consumed", "replayed"]),
  mutationAttemptStatus: z.enum(["not_attempted", "submitted", "succeeded", "downstream_refused", "failed", "unknown"]),
  downstreamExecutionStatus: z.enum(["not_started", "pending", "succeeded", "refused", "failed", "unknown"]),
  downstreamOutcomeStatus: DownstreamOutcomeStatusSchema,
  proofGapRefs: z.array(IdSchema).default([]),
  finalityStatus: z.enum(["final", "pending", "suspect", "unknown"]),
  receiptDigest: DigestSchema.nullable(),
  auditChainDigest: DigestSchema.nullable(),
  streamOffsets: z.array(ReceiptStreamReferenceSchema).default([]),
  events: z.array(ReceiptTimelineEventProjectionSchema).default([]),
  missingEventCount: z.number().int().nonnegative(),
  failureEvidence: ReceiptTimelineFailureEvidenceProjectionSchema.nullable(),
  redactionProfileRef: z.literal("receipt-timeline:v0.2-redacted"),
  omittedFields: z.array(z.string().min(1)).default([]),
});
export type ReceiptTimelineProjection = z.infer<typeof ReceiptTimelineProjectionSchema>;

const AuthMdEvidenceRefsProjectionSchema = z.strictObject({
  discoveryRefs: z.array(z.string().min(1)).default([]),
  authorizationServerRefs: z.array(z.string().min(1)).default([]),
  identityAssertionRefs: z.array(z.string().min(1)).default([]),
  registrationRefs: z.array(z.string().min(1)).default([]),
  claimRefs: z.array(z.string().min(1)).default([]),
  revocationRefs: z.array(z.string().min(1)).default([]),
  credentialCustodyRefs: z.array(z.string().min(1)).default([]),
  credentialResolutionRefs: z.array(z.string().min(1)).default([]),
  protectedApiCallRefs: z.array(z.string().min(1)).default([]),
  downstreamEvidenceRefs: z.array(z.string().min(1)).default([]),
});
export type AuthMdEvidenceRefsProjection = z.infer<typeof AuthMdEvidenceRefsProjectionSchema>;

export const AgentTransactionEnvelopeProjectionSchema = z.strictObject({
  actionContractRef: IdSchema,
  contractDigest: DigestSchema,
  policyDecisionRef: IdSchema,
  policyDecisionStatus: PolicyDecisionValueSchema,
  greenlightRef: IdSchema.nullable(),
  gateAttemptRef: IdSchema.nullable(),
  mutationAttemptRef: IdSchema.nullable(),
  receiptRef: IdSchema.nullable(),
  principalRef: IdSchema,
  agentRef: IdSchema,
  participantIdentityBindings: z.array(ParticipantIdentityBindingSchema).default([]),
  runId: IdSchema,
  runtimeAdapterRef: IdSchema,
  actionClass: z.string().min(1),
  protectedSurfaceKind: z.string().min(1),
  resourceRef: ResourceRefSchema,
  gatewayId: IdSchema,
  gatewayPolicyVersion: z.string().min(1),
  idempotencyKey: IdSchema,
  paramsDigest: DigestSchema,
  nonSecretParamsSummary: z.record(z.string(), JsonValueSchema),
  clearingEvidenceRefs: ClearingEvidenceRefsSchema,
  surfaceOperationRef: z.string().min(1).nullable(),
  surfaceOperationReconciliationRef: IdSchema.nullable(),
  surfaceOperationEvidenceLabels: z.array(z.string().min(1)).default([]),
  surfaceOperationEvidenceRefs: z.array(z.string().min(1)).default([]),
  gatewayCredentialEvidenceRefs: z.array(z.string().min(1)).default([]),
  delegatedAuthorityEvidenceRefs: z.array(z.string().min(1)).default([]),
  credentialResolutionEvidenceRefs: z.array(z.string().min(1)).default([]),
  signerInvocationEvidenceRefs: z.array(z.string().min(1)).default([]),
  downstreamEvidenceRefs: z.array(z.string().min(1)).default([]),
  authMdEvidenceRefs: AuthMdEvidenceRefsProjectionSchema,
  authMdEvidenceLabels: z.array(z.string().min(1)).default([]),
  providerRequestRef: z.string().min(1).nullable(),
  providerOperationRef: z.string().min(1).nullable(),
  downstreamRetryability: DownstreamRetryabilitySchema.nullable(),
  reconciliationFinalityStatus: z.enum(["final", "pending", "suspect", "unknown"]).nullable(),
  gatewayAdmissionStatus: GatewayAdmissionStatusSchema,
  greenlightConsumptionStatus: z.enum(["not_applicable", "not_consumed", "consumed", "replayed"]).nullable(),
  downstreamOutcomeStatus: DownstreamOutcomeStatusSchema,
  proofGapRefs: z.array(IdSchema).default([]),
  proofGapReasonCodes: z.array(ReasonCodeSchema).default([]),
  refusalRefs: z.array(IdSchema).default([]),
  refusalReasonCodes: z.array(ReasonCodeSchema).default([]),
  idempotencyLedgerRef: IdSchema.nullable(),
  idempotencyLedgerState: IdempotencyLedgerStateSchema.nullable(),
  idempotencyRecoveryDisposition: IdempotencyRecoveryDispositionSchema.nullable(),
  idempotencyReasonCodes: z.array(ReasonCodeSchema).default([]),
  recoveryRefs: z.array(z.string().min(1)).default([]),
  isolationRefs: z.array(z.string().min(1)).default([]),
  authorityCertificateRefs: z.array(IdSchema).default([]),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  streamOffsets: z.array(ReceiptStreamReferenceSchema).default([]),
  receiptDigest: DigestSchema.nullable(),
  auditChainDigest: DigestSchema.nullable(),
  receiptExportRef: IdSchema.nullable(),
  redactionProfileRef: z.literal("agent-transaction-envelope:v0.2-redacted"),
  omittedFields: z.array(z.string().min(1)).default([]),
  envelopeDigest: DigestSchema,
});
export type AgentTransactionEnvelopeProjection = z.infer<typeof AgentTransactionEnvelopeProjectionSchema>;

const OperationReadbackAgreementObligationPolicySchema = z.strictObject({
  sourceAuthority: z.literal("policy_decision_snapshot"),
  evaluationStatus: z.enum(["greenlight", "refuse", "proof_gap"]),
  ok: z.boolean(),
  reasonCode: ReasonCodeSchema.nullable(),
  reason: z.string().min(1).max(1000).nullable(),
  policyInput: z.strictObject({
    posture: z.enum(["not_applicable", "bound", "proof_gap", "refused"]),
    obligationRef: ResourceRefSchema.nullable(),
    linkedAgreementId: IdSchema.nullable(),
    acceptedNegotiationResolutionId: IdSchema.nullable(),
  }),
});

export const OperationReadbackStatusSchema = z.enum([
  "policy_refused",
  "review_required",
  "halted",
  "quarantined",
  "policy_proof_gap",
  "greenlight_available",
  "gateway_admitted",
  "gateway_refused",
  "gateway_proof_gap",
  "replay_refused",
  "downstream_pending",
  "downstream_succeeded",
  "downstream_refused",
  "downstream_failed",
  "downstream_unknown",
  "recovery_required",
  "isolated",
]);
export type OperationReadbackStatus = z.infer<typeof OperationReadbackStatusSchema>;

export const OperationReadbackStageSchema = z.enum([
  "intent_compilation",
  "candidate_action",
  "action_contract",
  "policy_decision",
  "greenlight",
  "gateway_check",
  "mutation_attempt",
  "receipt",
  "recovery",
  "isolation",
]);
export type OperationReadbackStage = z.infer<typeof OperationReadbackStageSchema>;

export const OperationCorrelationIndexSchema = z.strictObject({
  schemaVersion: z.literal("handshake.operation-correlation.v0.1"),
  actionContractRef: IdSchema,
  sourceAuthority: z.literal("protocol_store_projection"),
  authorityCreatedByProjection: z.literal(false),
  greenlightCreatedByReadback: z.literal(false),
  gatewayCheckPerformedByReadback: z.literal(false),
  mutationAttemptedByReadback: z.literal(false),
  intentCompilationRef: IdSchema.nullable(),
  candidateActionRef: IdSchema.nullable(),
  policyDecisionRef: IdSchema,
  greenlightRef: IdSchema.nullable(),
  gateAttemptRef: IdSchema.nullable(),
  mutationAttemptRef: IdSchema.nullable(),
  receiptRef: IdSchema.nullable(),
  proofGapRefs: z.array(IdSchema).default([]),
  refusalRefs: z.array(IdSchema).default([]),
  recoveryRefs: z.array(z.string().min(1)).default([]),
  isolationRefs: z.array(z.string().min(1)).default([]),
  authorityCertificateRefs: z.array(IdSchema).default([]),
  redactionProfileRef: z.literal("operation-correlation:v0.1-redacted"),
  omittedFields: z.array(z.string().min(1)).default([]),
});
export type OperationCorrelationIndex = z.infer<typeof OperationCorrelationIndexSchema>;

export const OperationReadbackNextMechanismSchema = z.enum([
  "read_evidence",
  "use_greenlight_at_gateway",
  "request_review",
  "recraft_request",
  "create_new_contract",
  "recover_terminal_unknown",
  "stop",
  "wait_for_downstream",
]);
export type OperationReadbackNextMechanism = z.infer<typeof OperationReadbackNextMechanismSchema>;

export const OperationReadbackSupportSeveritySchema = z.enum(["none", "info", "warning", "urgent"]);
export type OperationReadbackSupportSeverity = z.infer<typeof OperationReadbackSupportSeveritySchema>;

export const OperationReadbackGreenlightUsePostureSchema = z.enum([
  "none",
  "available_for_one_gateway_check",
  "consumed",
  "replayed_or_unusable",
  "unknown",
]);
export type OperationReadbackGreenlightUsePosture = z.infer<typeof OperationReadbackGreenlightUsePostureSchema>;

export const OperationSupportContextSchema = z.strictObject({
  schemaVersion: z.literal("handshake.support-context.v0.1"),
  supportContextRef: z.string().min(1),
  sourceAuthority: z.literal("protocol_store_projection"),
  surface: z.literal("operation_readback"),
  actionContractRef: IdSchema,
  requestIdentity: z.string().min(1).nullable(),
  operationStatus: OperationReadbackStatusSchema,
  reasonCodes: z.array(ReasonCodeSchema).default([]),
  nextMechanism: OperationReadbackNextMechanismSchema,
  safeToRetryReadback: z.literal(true),
  safeToReuseGreenlight: z.boolean(),
  requiresNewContract: z.boolean(),
  supportSeverity: OperationReadbackSupportSeveritySchema,
  docsUrl: z.string().url().nullable(),
  nextCommand: z.string().min(1).nullable(),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  proofGapRefs: z.array(IdSchema).default([]),
  refusalRefs: z.array(IdSchema).default([]),
  traceRef: z.string().min(1).nullable(),
  spanRef: z.string().min(1).nullable(),
  redactionProfileRef: z.literal("operation-readback:v0.1-redacted"),
});
export type OperationSupportContext = z.infer<typeof OperationSupportContextSchema>;

export const OperationReadbackProjectionSchema = z.strictObject({
  schemaVersion: z.literal("handshake.operation-readback.v0.1"),
  actionContractRef: IdSchema,
  contractDigest: DigestSchema,
  principalRef: IdSchema,
  agentRef: IdSchema,
  runId: IdSchema,
  runtimeAdapterRef: IdSchema,
  actionClass: z.string().min(1),
  protectedSurfaceKind: z.string().min(1),
  resourceRef: ResourceRefSchema,
  gatewayId: IdSchema,
  gatewayPolicyVersion: z.string().min(1),
  sourceAuthority: z.literal("protocol_store_projection"),
  operationStatus: OperationReadbackStatusSchema,
  latestAuthoritativeStage: OperationReadbackStageSchema,
  policyDecisionRef: IdSchema,
  policyDecisionStatus: PolicyDecisionValueSchema,
  agreementObligationPolicy: OperationReadbackAgreementObligationPolicySchema,
  greenlightRef: IdSchema.nullable(),
  gateAttemptRef: IdSchema.nullable(),
  mutationAttemptRef: IdSchema.nullable(),
  receiptRef: IdSchema.nullable(),
  gatewayAdmissionStatus: GatewayAdmissionStatusSchema,
  downstreamOutcomeStatus: DownstreamOutcomeStatusSchema,
  finalityStatus: z.enum(["final", "pending", "suspect", "unknown"]).nullable(),
  greenlightUsePosture: OperationReadbackGreenlightUsePostureSchema,
  reasonCodes: z.array(ReasonCodeSchema).default([]),
  nextMechanism: OperationReadbackNextMechanismSchema,
  safeToRetryReadback: z.literal(true),
  safeToReuseGreenlight: z.boolean(),
  requiresNewContract: z.boolean(),
  authorityCreatedByReadback: z.literal(false),
  greenlightCreatedByReadback: z.literal(false),
  gatewayCheckPerformedByReadback: z.literal(false),
  mutationAttemptedByReadback: z.literal(false),
  receiptExportCreatedByReadback: z.literal(false),
  rawInternalRecordIncluded: z.literal(false),
  credentialMaterialIncluded: z.literal(false),
  paymentMaterialIncluded: z.literal(false),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  proofGapRefs: z.array(IdSchema).default([]),
  refusalRefs: z.array(IdSchema).default([]),
  recoveryRefs: z.array(z.string().min(1)).default([]),
  isolationRefs: z.array(z.string().min(1)).default([]),
  authorityCertificateRefs: z.array(IdSchema).default([]),
  providerRequestRef: z.string().min(1).nullable(),
  providerOperationRef: z.string().min(1).nullable(),
  traceRef: z.string().min(1).nullable(),
  spanRef: z.string().min(1).nullable(),
  redactionProfileRef: z.literal("operation-readback:v0.1-redacted"),
  omittedFields: z.array(z.string().min(1)).default([]),
  supportContext: OperationSupportContextSchema,
});
export type OperationReadbackProjection = z.infer<typeof OperationReadbackProjectionSchema>;

export const ProtectedPathInstallHealthStatusSchema = z.enum([
  "not_required",
  "satisfies_gateway_checked",
  "missing",
  "stale",
  "unsafe",
  "unknown",
]);
export type ProtectedPathInstallHealthStatus = z.infer<typeof ProtectedPathInstallHealthStatusSchema>;

export const ProtectedPathInstallHealthProjectionSchema = z.strictObject({
  actionContractRef: IdSchema,
  postureScopeKey: z.string().min(1),
  runtimeAdapterRef: IdSchema,
  gatewayId: IdSchema,
  actionClass: z.string().min(1),
  protectedSurfaceKind: z.string().min(1),
  resourceRef: ResourceRefSchema,
  requiredProtectedPathState: RequiredProtectedPathStateSchema,
  installHealthStatus: ProtectedPathInstallHealthStatusSchema,
  reasonCodes: z.array(ReasonCodeSchema).default([]),
  currentPostureRef: IdSchema.nullable(),
  currentPostureDigest: DigestSchema.nullable(),
  postureState: ProtectedPathStateSchema.nullable(),
  credentialCustodyStatus: CredentialCustodyStatusSchema.nullable(),
  rawSiblingToolStatus: RawSiblingToolStatusSchema.nullable(),
  sourceAuthority: PostureSourceAuthoritySchema.nullable(),
  bypassProbeCoverage: z.array(ProtectedPathBypassProbeCoverageSchema).default([]),
  observedAt: IsoDateSchema.nullable(),
  expiresAt: IsoDateSchema.nullable(),
  redactionProfileRef: z.literal("protected-path-install-health:v0.2-redacted"),
  omittedFields: z.array(z.string().min(1)).default([]),
});
export type ProtectedPathInstallHealthProjection = z.infer<typeof ProtectedPathInstallHealthProjectionSchema>;
