import { z } from "zod";

export const PROTOCOL_VERSION = "0.2.3";

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.null(),
    z.boolean(),
    z.number().finite(),
    z.string(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema),
  ]),
);

export const DigestSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/);
export const SignatureSchema = z.string().regex(/^hmac-sha256:[a-f0-9]{64}$/);
export const IdSchema = z.string().min(3).max(160);
export const IsoDateSchema = z.string().datetime({ offset: true });
export const ReasonCodeSchema = z.string().min(2).max(120);
export const ResourceRefSchema = z.string().min(1).max(500);

export const RuntimeExecutionShapeSchema = z.enum([
  "single_tool_call",
  "generated_mcp_tool_chain",
  "codemode_block",
  "shell_exec_block",
  "browser_action",
  "scheduled_job",
  "gateway_only",
  "unknown",
]);
export type RuntimeExecutionShape = z.infer<typeof RuntimeExecutionShapeSchema>;

export const RuntimePostureSchema = z.enum([
  "prompt_guidance",
  "hook_assisted",
  "protected_capability",
  "bounded_generation",
  "gateway_enforced_only",
  "hosted_control_plane",
  "unknown",
]);
export type RuntimePosture = z.infer<typeof RuntimePostureSchema>;

export const RuntimeAccessPostureSchema = z.enum([
  "isolated",
  "controlled_outbound",
  "filesystem_available",
  "network_available",
  "secrets_available",
  "unknown",
]);
export type RuntimeAccessPosture = z.infer<typeof RuntimeAccessPostureSchema>;

export const ProtectedPathStateSchema = z.enum([
  "gateway_checked",
  "advisory",
  "bypass_risk",
  "blind",
  "fixture_only",
]);
export type ProtectedPathState = z.infer<typeof ProtectedPathStateSchema>;

export const RequiredProtectedPathStateSchema = z.enum(["not_required", "gateway_checked"]);
export type RequiredProtectedPathState = z.infer<typeof RequiredProtectedPathStateSchema>;

export const CredentialCustodyStatusSchema = z.enum([
  "gateway_held",
  "fixture_gateway_held",
  "agent_has_raw_credential",
  "shared_or_unknown",
  "no_mutation_credential",
]);
export type CredentialCustodyStatus = z.infer<typeof CredentialCustodyStatusSchema>;

export const RawSiblingToolStatusSchema = z.enum(["absent", "blocked", "present", "unknown"]);
export type RawSiblingToolStatus = z.infer<typeof RawSiblingToolStatusSchema>;

export const PostureSourceAuthoritySchema = z.enum([
  "runtime_probe",
  "gateway_probe",
  "operator_attestation",
  "conformance_fixture",
  "hosted_monitor",
  "unknown",
]);
export type PostureSourceAuthority = z.infer<typeof PostureSourceAuthoritySchema>;

export const GatewayEnforcementModeSchema = z.enum([
  "reference_fixture",
  "customer_gateway_adapter",
  "provider_gateway",
  "hosted_control_plane_only",
  "unknown",
]);
export type GatewayEnforcementMode = z.infer<typeof GatewayEnforcementModeSchema>;

export const ProtocolBaseSchema = z.strictObject({
  schemaVersion: z.literal(PROTOCOL_VERSION),
  tenantId: IdSchema,
  organizationId: IdSchema,
  createdAt: IsoDateSchema,
});

export const ToolCapabilitySchema = ProtocolBaseSchema.extend({
  toolCapabilityId: IdSchema,
  toolCatalogId: IdSchema,
  toolCatalogVersion: z.string().min(1),
  runtimeAdapterId: IdSchema,
  toolName: z.string().min(1),
  toolNamespace: z.string().min(1),
  capabilityClass: z.enum(["read", "write", "network", "filesystem", "deploy", "package", "database", "unknown"]),
  readWriteClassification: z.enum(["read_only", "consequential", "ambiguous"]),
  consequentialityDefault: z.enum(["non_consequential", "consequential", "requires_classification"]),
  wrapperStatus: z.enum(["wrapped", "unwrapped", "unknown"]),
  rawBypassPossible: z.boolean(),
  inputSchemaRef: z.string().min(1),
  outputSchemaRef: z.string().min(1),
  secretBearingFields: z.array(z.string()).default([]),
  supersededAt: IsoDateSchema.nullable(),
});
export type ToolCapability = z.infer<typeof ToolCapabilitySchema>;

export const ActionTypeSchema = ProtocolBaseSchema.extend({
  actionTypeId: IdSchema,
  actionCatalogId: IdSchema,
  actionCatalogVersion: z.string().min(1),
  actionClass: z.string().min(1),
  protectedSurfaceKind: z.string().min(1),
  requiredContractFields: z.array(z.string().min(1)),
  canonicalParameterSchemaRef: z.string().min(1),
  resourceRefSchemaRef: z.string().min(1),
  requiredEvidenceTypes: z.array(z.string()).default([]),
  allowedBoundsSchemaRef: z.string().min(1),
  defaultReceiptRequirement: z.enum(["none", "gate", "mutation", "downstream_finality"]),
  defaultIdempotencyRequirement: z.enum(["required", "optional", "forbidden"]),
  supersededAt: IsoDateSchema.nullable(),
});
export type ActionType = z.infer<typeof ActionTypeSchema>;

export const GatewayRegistryEntrySchema = ProtocolBaseSchema.extend({
  gatewayRegistryEntryId: IdSchema,
  gatewayRegistryVersion: z.string().min(1),
  gatewayId: IdSchema,
  protectedSurfaceKind: z.string().min(1),
  gatewayAdapterId: IdSchema,
  gatewayAdapterVersion: z.string().min(1),
  gateEndpointRef: z.string().min(1),
  gatewayPolicyContractId: IdSchema,
  gatewayPolicyVersion: z.string().min(1),
  gatewayPolicyDriftMode: z.enum(["refuse_on_drift", "allow_compatible_stricter"]),
  compatiblePreviousGatewayPolicyVersions: z.array(z.string().min(1)).default([]),
  acceptedActionCatalogVersions: z.array(z.string().min(1)),
  resourceNamespaceRef: z.string().min(1),
  canonicalizerVersion: z.string().min(1),
  receiptCapabilityStatus: z.enum(["available", "unavailable", "unknown"]),
  isolationCheckCapabilityStatus: z.enum(["available", "unavailable", "unknown"]),
  credentialCustodyStatus: CredentialCustodyStatusSchema,
  enforcementMode: GatewayEnforcementModeSchema,
  mutationCredentialHolderRef: z.string().min(1),
  gatewayAuthorityHolderRef: z.string().min(1),
  supersededAt: IsoDateSchema.nullable(),
});
export type GatewayRegistryEntry = z.infer<typeof GatewayRegistryEntrySchema>;

export const OperatingEnvelopeSchema = ProtocolBaseSchema.extend({
  envelopeId: IdSchema,
  principalId: IdSchema,
  agentId: IdSchema,
  objectiveRef: z.string().min(1),
  allowedActionClasses: z.array(z.string().min(1)),
  allowedGateways: z.array(IdSchema),
  allowedResources: z.array(ResourceRefSchema),
  requiredProtectedPathState: RequiredProtectedPathStateSchema.default("not_required"),
  evidenceRequirements: z.array(z.string()).default([]),
  policyPackRef: z.string().min(1),
  policyPackVersion: z.string().min(1),
  issuedAt: IsoDateSchema,
  expiresAt: IsoDateSchema,
  revokedAt: IsoDateSchema.nullable(),
});
export type OperatingEnvelope = z.infer<typeof OperatingEnvelopeSchema>;

export const RuntimeExecutionRecordSchema = ProtocolBaseSchema.extend({
  runtimeExecutionId: IdSchema,
  principalIntentRef: z.string().min(1),
  principalId: IdSchema,
  agentId: IdSchema,
  runId: IdSchema,
  runtimeAdapterId: IdSchema,
  executionShape: RuntimeExecutionShapeSchema,
  runtimePosture: RuntimePostureSchema,
  executionBlockRef: z.string().min(1),
  executionBlockDigest: DigestSchema,
  generatedCodeOrSpecRefs: z.array(z.string()).default([]),
  allowedToolCapabilityIds: z.array(IdSchema).default([]),
  observedToolCallRefs: z.array(z.string().min(1)).default([]),
  observedConsequentialCallCount: z.number().int().nonnegative(),
  loopDetected: z.boolean(),
  retryDetected: z.boolean(),
  branchDetected: z.boolean(),
  dynamicToolConstructionDetected: z.boolean(),
  unobservedRegionRefs: z.array(z.string().min(1)).default([]),
  accessPosture: RuntimeAccessPostureSchema,
  uncertaintyMarkers: z.array(z.string().min(1)).default([]),
  refusalReasonCodes: z.array(ReasonCodeSchema).default([]),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  runtimeExecutionDigest: DigestSchema,
});
export type RuntimeExecutionRecord = z.infer<typeof RuntimeExecutionRecordSchema>;

export const ProtectedPathPostureSchema = ProtocolBaseSchema.extend({
  protectedPathPostureId: IdSchema,
  postureScopeKey: z.string().min(1),
  runtimeAdapterId: IdSchema,
  gatewayId: IdSchema,
  actionClass: z.string().min(1),
  resourceRef: ResourceRefSchema,
  protectedSurfaceKind: z.string().min(1),
  postureState: ProtectedPathStateSchema,
  credentialCustodyStatus: CredentialCustodyStatusSchema,
  rawSiblingToolStatus: RawSiblingToolStatusSchema,
  sourceAuthority: PostureSourceAuthoritySchema,
  reasonCodes: z.array(ReasonCodeSchema).default([]),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  observedAt: IsoDateSchema,
  expiresAt: IsoDateSchema,
  postureDigest: DigestSchema,
});
export type ProtectedPathPosture = z.infer<typeof ProtectedPathPostureSchema>;

export const CandidateActionStatusSchema = z.enum(["contractable", "rejected"]);
export type CandidateActionStatus = z.infer<typeof CandidateActionStatusSchema>;

export const CandidateActionSchema = z.strictObject({
  candidateActionId: IdSchema,
  candidateStatus: CandidateActionStatusSchema,
  candidateDigest: DigestSchema.nullable(),
  refusalReasonCodes: z.array(ReasonCodeSchema).default([]),
  toolCapabilityId: IdSchema,
  toolCapabilityDigest: DigestSchema.nullable(),
  toolCatalogVersion: z.string().min(1).nullable(),
  actionTypeId: IdSchema,
  actionTypeDigest: DigestSchema.nullable(),
  actionCatalogVersion: z.string().min(1).nullable(),
  gatewayRegistryEntryId: IdSchema,
  gatewayRegistryDigest: DigestSchema.nullable(),
  gatewayRegistryVersion: z.string().min(1).nullable(),
  operatingEnvelopeId: IdSchema,
  operatingEnvelopeDigest: DigestSchema.nullable(),
  actionClass: z.string().min(1),
  gatewayId: IdSchema,
  resourceRef: ResourceRefSchema,
  sequenceNumber: z.number().int().nonnegative(),
  requiredPriorActionContractIds: z.array(IdSchema).default([]),
  recoveryRecommendationId: IdSchema.nullable(),
  parameters: z.record(z.string(), JsonValueSchema),
  paramsDigest: DigestSchema,
  nonSecretParamsSummary: z.record(z.string(), JsonValueSchema),
  secretRefs: z.record(z.string(), z.string().min(1)).default({}),
  purposeCode: z.string().min(1),
  expectedSideEffectCodes: z.array(z.string().min(1)),
  evidenceRefs: z.array(z.string()).default([]),
  bounds: z.record(z.string(), JsonValueSchema).default({}),
  idempotencyKey: IdSchema,
  rollbackHint: z.string().max(500).nullable(),
  expiresAt: IsoDateSchema,
  generatedCodeOrSpecRefs: z.array(z.string()).default([]),
  runtimeExecutionId: IdSchema.nullable().default(null),
  runtimeExecutionDigest: DigestSchema.nullable().default(null),
});
export type CandidateAction = z.infer<typeof CandidateActionSchema>;

export const IntentCompilationRecordSchema = ProtocolBaseSchema.extend({
  intentCompilationId: IdSchema,
  principalIntentRef: z.string().min(1),
  principalId: IdSchema,
  agentId: IdSchema,
  runId: IdSchema,
  runtimeAdapterId: IdSchema,
  operatingEnvelopeId: IdSchema,
  toolCatalogRef: z.string().min(1),
  actionCatalogRef: z.string().min(1),
  gatewayRegistryRef: z.string().min(1),
  runtimeExecutionId: IdSchema.nullable().default(null),
  runtimeExecutionDigest: DigestSchema.nullable().default(null),
  generatedCodeOrSpecRefs: z.array(z.string()).default([]),
  declaredAssumptions: z.array(z.string()).default([]),
  uncertaintyMarkers: z.array(z.string()).default([]),
  candidateAction: CandidateActionSchema,
  candidateActionContractRefs: z.array(IdSchema).default([]),
  rejectedCandidateRefs: z.array(IdSchema).default([]),
  overreachReasonCodes: z.array(ReasonCodeSchema).default([]),
  requiredEvidenceRefs: z.array(z.string()).default([]),
  compilerVersion: z.string().min(1),
});
export type IntentCompilationRecord = z.infer<typeof IntentCompilationRecordSchema>;

export const ActionContractSchema = ProtocolBaseSchema.extend({
  actionContractId: IdSchema,
  intentCompilationId: IdSchema,
  candidateActionId: IdSchema,
  candidateDigest: DigestSchema,
  envelopeId: IdSchema,
  operatingEnvelopeDigest: DigestSchema,
  agentId: IdSchema,
  principalId: IdSchema,
  runId: IdSchema,
  runtimeAdapterId: IdSchema,
  sequenceNumber: z.number().int().nonnegative(),
  requiredPriorActionContractIds: z.array(IdSchema).default([]),
  recoveryRecommendationId: IdSchema.nullable(),
  recoverySourceReceiptId: IdSchema.nullable(),
  recoveryRecommendationDigest: DigestSchema.nullable(),
  issuedAt: IsoDateSchema,
  expiresAt: IsoDateSchema,
  gatewayRegistryEntryId: IdSchema,
  gatewayRegistryDigest: DigestSchema,
  gatewayRegistryVersion: z.string().min(1),
  gatewayId: IdSchema,
  gatewayPolicyContractId: IdSchema,
  gatewayPolicyVersion: z.string().min(1),
  credentialCustodyStatus: CredentialCustodyStatusSchema,
  enforcementMode: GatewayEnforcementModeSchema,
  mutationCredentialHolderRef: z.string().min(1),
  gatewayAuthorityHolderRef: z.string().min(1),
  toolCapabilityId: IdSchema,
  toolCapabilityDigest: DigestSchema,
  actionTypeId: IdSchema,
  actionTypeDigest: DigestSchema,
  actionClass: z.string().min(1),
  protectedSurfaceKind: z.string().min(1),
  resourceRef: ResourceRefSchema,
  requiredProtectedPathState: RequiredProtectedPathStateSchema,
  runtimeExecutionId: IdSchema.nullable(),
  runtimeExecutionDigest: DigestSchema.nullable(),
  parameters: z.record(z.string(), JsonValueSchema),
  paramsDigest: DigestSchema,
  nonSecretParamsSummary: z.record(z.string(), JsonValueSchema),
  secretRefs: z.record(z.string(), z.string().min(1)).default({}),
  purposeCode: z.string().min(1),
  expectedSideEffectCodes: z.array(z.string().min(1)),
  evidenceRefs: z.array(z.string()).default([]),
  bounds: z.record(z.string(), JsonValueSchema).default({}),
  idempotencyKey: IdSchema,
  rollbackHint: z.string().max(500).nullable(),
  canonicalizerVersion: z.string().min(1),
  actionContractDigest: DigestSchema,
  contractSignature: SignatureSchema.nullable(),
});
export type ActionContract = z.infer<typeof ActionContractSchema>;

export const PolicyDecisionValueSchema = z.enum(["greenlight", "refuse", "review_required", "halt", "quarantine"]);
export type PolicyDecisionValue = z.infer<typeof PolicyDecisionValueSchema>;

export const PolicyDecisionSchema = ProtocolBaseSchema.extend({
  policyDecisionId: IdSchema,
  actionContractId: IdSchema,
  envelopeId: IdSchema,
  policyPackRef: z.string().min(1),
  policyPackVersion: z.string().min(1),
  policyEvaluatorVersion: z.string().min(1),
  policyInputDigest: DigestSchema,
  decision: PolicyDecisionValueSchema,
  decisionReasonCode: ReasonCodeSchema,
  decisionReason: z.string().min(1).max(1000),
  matchedRuleIds: z.array(z.string()).default([]),
  requiredReceipt: z.enum(["none", "gate", "mutation", "downstream_finality"]),
  isolationSnapshotRef: z.string().min(1),
  expiresAt: IsoDateSchema,
  decisionSignature: SignatureSchema.nullable(),
});
export type PolicyDecision = z.infer<typeof PolicyDecisionSchema>;

export const GreenlightSchema = ProtocolBaseSchema.extend({
  greenlightId: IdSchema,
  actionContractId: IdSchema,
  policyDecisionId: IdSchema,
  gatewayRegistryEntryId: IdSchema,
  gatewayRegistryVersion: z.string().min(1),
  gatewayId: IdSchema,
  gatewayPolicyVersion: z.string().min(1),
  actionClass: z.string().min(1),
  resourceRef: ResourceRefSchema,
  requiredProtectedPathState: RequiredProtectedPathStateSchema,
  protectedPathPostureId: IdSchema.nullable(),
  protectedPathPostureDigest: DigestSchema.nullable(),
  paramsDigest: DigestSchema,
  contractDigest: DigestSchema,
  maxUses: z.literal(1),
  issuedAt: IsoDateSchema,
  notBefore: IsoDateSchema,
  expiresAt: IsoDateSchema,
  isolationSnapshotRef: z.string().min(1),
  requiredReceipt: z.enum(["none", "gate", "mutation", "downstream_finality"]),
  decisionSignature: SignatureSchema.nullable(),
  consumedAt: IsoDateSchema.nullable(),
  consumedByGateAttemptId: IdSchema.nullable(),
});
export type Greenlight = z.infer<typeof GreenlightSchema>;

export const ReviewArtifactRecordSchema = ProtocolBaseSchema.extend({
  reviewArtifactId: IdSchema,
  reviewArtifactRef: z.string().min(1),
  reviewRenderSchemaVersion: z.string().min(1),
  rendererRef: z.string().min(1),
  actionContractId: IdSchema,
  actionContractDigest: DigestSchema,
  policyDecisionId: IdSchema,
  policyInputDigest: DigestSchema,
  gatewayPolicyVersion: z.string().min(1),
  renderedContractDigest: DigestSchema,
  renderedPolicyInputDigest: DigestSchema,
  renderedUncertaintyDigest: DigestSchema,
  renderedArtifactDigest: DigestSchema,
  uncertaintyMarkers: z.array(z.string().min(1)).default([]),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  reviewArtifactDigest: DigestSchema,
});
export type ReviewArtifactRecord = z.infer<typeof ReviewArtifactRecordSchema>;

export const ReviewDecisionSchema = ProtocolBaseSchema.extend({
  reviewDecisionId: IdSchema,
  reviewArtifactId: IdSchema,
  reviewArtifactRef: z.string().min(1),
  reviewArtifactDigest: DigestSchema,
  reviewRenderSchemaVersion: z.string().min(1),
  reviewerPrincipalId: IdSchema,
  actionContractId: IdSchema,
  actionContractDigest: DigestSchema,
  policyInputDigest: DigestSchema,
  gatewayPolicyVersion: z.string().min(1),
  decision: z.enum(["approve", "reject", "needs_changes"]),
  decisionReasonCode: ReasonCodeSchema,
  decisionExpiresAt: IsoDateSchema,
  signatureOrAttestationRef: z.string().min(1),
});
export type ReviewDecision = z.infer<typeof ReviewDecisionSchema>;

export const StreamWatermarkSchema = z.strictObject({
  streamId: IdSchema,
  partitionKey: z.string().min(1),
  observedOffsetStart: z.number().int().nonnegative(),
  observedOffsetEnd: z.number().int().nonnegative(),
  observedEventDigest: DigestSchema.nullable(),
}).refine((watermark) => watermark.observedOffsetStart <= watermark.observedOffsetEnd, {
  message: "observedOffsetEnd must be greater than or equal to observedOffsetStart",
  path: ["observedOffsetEnd"],
});
export type StreamWatermark = z.infer<typeof StreamWatermarkSchema>;

export const BreakerIsolationDecisionSchema = z.enum([
  "review_only",
  "rate_limited",
  "quarantined",
  "halted",
  "revoked",
  "state_suspect",
]);
export type BreakerIsolationDecision = z.infer<typeof BreakerIsolationDecisionSchema>;

export const BreakerDecisionSchema = ProtocolBaseSchema.extend({
  breakerDecisionId: IdSchema,
  listenerId: IdSchema,
  listenerVersion: z.string().min(1),
  rulePackRef: z.string().min(1),
  rulePackVersion: z.string().min(1),
  observedStreamOffsets: z.array(StreamWatermarkSchema).min(1),
  observedWindowDigest: DigestSchema,
  decision: BreakerIsolationDecisionSchema,
  decisionReasonCode: ReasonCodeSchema,
  decisionReason: z.string().min(1).max(1000),
  targetScopeType: z.enum(["tenant", "organization", "agent", "run", "envelope", "action_class", "gateway", "resource"]),
  targetScopeId: IdSchema,
  createdIsolationStateId: IdSchema,
  agentId: IdSchema.nullable(),
  runId: IdSchema.nullable(),
  gatewayId: IdSchema.nullable(),
  resourceRef: ResourceRefSchema.nullable(),
  actionClass: z.string().min(1).nullable(),
  sequenceRiskScore: z.number().min(0).max(1),
  matchedBreakerRuleIds: z.array(z.string().min(1)).default([]),
  supportingEventRefs: z.array(IdSchema).default([]),
  missingEventRefs: z.array(z.string().min(1)).default([]),
  proofGapRefs: z.array(IdSchema).default([]),
  decisionEffectiveAt: IsoDateSchema,
  decisionExpiresAt: IsoDateSchema.nullable(),
  watermarkAtDecision: IsoDateSchema,
});
export type BreakerDecision = z.infer<typeof BreakerDecisionSchema>;

export const IsolationStateSchema = ProtocolBaseSchema.extend({
  isolationStateId: IdSchema,
  scopeType: z.enum(["tenant", "organization", "agent", "run", "envelope", "action_class", "gateway", "resource"]),
  scopeId: IdSchema,
  state: z.enum(["active", "review_only", "rate_limited", "quarantined", "halted", "revoked", "state_suspect"]),
  reasonCode: ReasonCodeSchema,
  reasonSummary: z.string().min(1).max(1000),
  sourceDecisionRef: z.string().min(1),
  effectiveAt: IsoDateSchema,
  expiresAt: IsoDateSchema.nullable(),
  clearedAt: IsoDateSchema.nullable(),
  observedStreamOffsets: z.array(StreamWatermarkSchema).default([]),
  version: z.number().int().nonnegative(),
});
export type IsolationState = z.infer<typeof IsolationStateSchema>;

export const GateDecisionSchema = z.enum(["passed", "refused", "proof_gap"]);
export type GateDecision = z.infer<typeof GateDecisionSchema>;

export const GatewayCheckAttemptSchema = ProtocolBaseSchema.extend({
  gateAttemptId: IdSchema,
  gatewayId: IdSchema,
  gatewayPolicyContractId: IdSchema,
  gatewayPolicyVersion: z.string().min(1),
  pinnedGatewayPolicyVersion: z.string().min(1),
  currentGatewayPolicyVersion: z.string().min(1).nullable(),
  gatewayPolicyDriftStatus: z.enum(["same_version", "compatible_stricter", "incompatible", "unknown"]),
  actionContractId: IdSchema,
  greenlightId: IdSchema,
  contractDigestSeen: DigestSchema,
  greenlightDigestSeen: DigestSchema,
  paramsDigestSeen: DigestSchema,
  idempotencyKeySeen: IdSchema,
  isolationSnapshotRef: z.string().min(1),
  protectedPathPostureIdSeen: IdSchema.nullable(),
  protectedPathPostureDigestSeen: DigestSchema.nullable(),
  protectedPathPostureStateSeen: ProtectedPathStateSchema.nullable(),
  gateDecision: GateDecisionSchema,
  gateDecisionReasonCode: ReasonCodeSchema,
  consumedGreenlight: z.boolean(),
  mutationAttemptId: IdSchema.nullable(),
});
export type GatewayCheckAttempt = z.infer<typeof GatewayCheckAttemptSchema>;

export const MutationAttemptSchema = ProtocolBaseSchema.extend({
  mutationAttemptId: IdSchema,
  gateAttemptId: IdSchema,
  actionContractId: IdSchema,
  greenlightId: IdSchema,
  gatewayId: IdSchema,
  actionClass: z.string().min(1),
  resourceRef: ResourceRefSchema,
  idempotencyKey: IdSchema,
  outcome: z.enum(["not_attempted", "submitted", "succeeded", "downstream_refused", "failed", "unknown"]),
  outcomeReasonCode: ReasonCodeSchema,
  surfaceOperationRef: z.string().min(1).nullable(),
  startedAt: IsoDateSchema,
  finishedAt: IsoDateSchema.nullable(),
});
export type MutationAttempt = z.infer<typeof MutationAttemptSchema>;

export const SurfaceOperationReconciliationSchema = ProtocolBaseSchema.extend({
  reconciliationId: IdSchema,
  mutationAttemptId: IdSchema,
  gateAttemptId: IdSchema,
  actionContractId: IdSchema,
  greenlightId: IdSchema,
  gatewayId: IdSchema,
  idempotencyKey: IdSchema,
  surfaceOperationRef: z.string().min(1).nullable(),
  previousMutationOutcome: MutationAttemptSchema.shape.outcome,
  observedDownstreamStatus: z.enum(["pending", "succeeded", "refused", "failed", "unknown"]),
  observedAt: IsoDateSchema,
  evidenceRefs: z.array(z.string()).default([]),
  resolvedProofGapIds: z.array(IdSchema).default([]),
  reconciliationStatus: z.enum(["pending", "resolved", "still_unknown", "failed"]),
  finalityStatus: z.enum(["final", "pending", "suspect", "unknown"]),
});
export type SurfaceOperationReconciliation = z.infer<typeof SurfaceOperationReconciliationSchema>;

export const ProofGapSchema = ProtocolBaseSchema.extend({
  proofGapId: IdSchema,
  gapPhase: z.enum(["compilation", "policy", "gate", "mutation", "receipt", "stream", "recovery"]),
  expectedEvidenceType: z.string().min(1),
  missingOrInvalidEvidenceRef: z.string().min(1),
  affectedObjectRefs: z.array(z.string().min(1)),
  gateAttemptId: IdSchema.nullable(),
  mutationAttemptId: IdSchema.nullable(),
  receiptId: IdSchema.nullable(),
  reasonCode: ReasonCodeSchema,
  finalityImpact: z.enum(["none", "suspect", "unknown", "invalid"]),
  recoveryRequirement: z.string().min(1),
  resolvedAt: IsoDateSchema.nullable(),
  resolvedByRef: z.string().min(1).nullable(),
});
export type ProofGap = z.infer<typeof ProofGapSchema>;

export const ReceiptStreamReferenceSchema = z.strictObject({
  streamId: IdSchema,
  streamScope: z.enum(["tenant", "organization", "run", "protected_surface_resource"]),
  partitionKey: z.string().min(1),
  offsetStart: z.number().int().nonnegative(),
  offsetEnd: z.number().int().nonnegative(),
  terminalEventDigest: DigestSchema,
}).refine((reference) => reference.offsetStart <= reference.offsetEnd, {
  message: "offsetEnd must be greater than or equal to offsetStart",
  path: ["offsetEnd"],
});
export type ReceiptStreamReference = z.infer<typeof ReceiptStreamReferenceSchema>;

export const ReceiptSchema = ProtocolBaseSchema.extend({
  receiptId: IdSchema,
  actionContractId: IdSchema,
  policyDecisionId: IdSchema,
  greenlightId: IdSchema.nullable(),
  gateAttemptId: IdSchema.nullable(),
  mutationAttemptId: IdSchema.nullable(),
  gatewayId: IdSchema,
  policyDecisionStatus: PolicyDecisionValueSchema,
  gatewayCheckStatus: GateDecisionSchema.nullable(),
  greenlightConsumptionStatus: z.enum(["not_applicable", "not_consumed", "consumed", "replayed"]),
  mutationAttemptStatus: z.enum(["not_attempted", "submitted", "succeeded", "downstream_refused", "failed", "unknown"]),
  downstreamExecutionStatus: z.enum(["not_started", "pending", "succeeded", "refused", "failed", "unknown"]),
  proofGapIds: z.array(IdSchema).default([]),
  evidenceRefs: z.array(z.string()).default([]),
  streamEventIds: z.array(IdSchema).default([]),
  streamOffsets: z.array(ReceiptStreamReferenceSchema).default([]),
  receiptDigest: DigestSchema.nullable(),
  auditChainDigest: DigestSchema.nullable(),
  finalityStatus: z.enum(["final", "pending", "suspect", "unknown"]),
  emittedAt: IsoDateSchema,
});
export type Receipt = z.infer<typeof ReceiptSchema>;

export const ReceiptExportSchema = ProtocolBaseSchema.extend({
  receiptExportId: IdSchema,
  receiptId: IdSchema,
  actionContractId: IdSchema,
  policyDecisionId: IdSchema,
  greenlightId: IdSchema.nullable(),
  gateAttemptId: IdSchema.nullable(),
  mutationAttemptId: IdSchema.nullable(),
  gatewayId: IdSchema,
  principalId: IdSchema,
  agentId: IdSchema,
  runId: IdSchema,
  gatewayPolicyVersion: z.string().min(1),
  policyDecisionStatus: PolicyDecisionValueSchema,
  gatewayCheckStatus: GateDecisionSchema.nullable(),
  gatewayCheckedAt: IsoDateSchema.nullable(),
  greenlightConsumptionStatus: ReceiptSchema.shape.greenlightConsumptionStatus,
  mutationAttemptStatus: ReceiptSchema.shape.mutationAttemptStatus,
  downstreamExecutionStatus: ReceiptSchema.shape.downstreamExecutionStatus,
  proofGapStatus: z.enum(["none", "present"]),
  proofGapIds: z.array(IdSchema).default([]),
  proofGapReasonCodes: z.array(ReasonCodeSchema).default([]),
  finalityStatus: ReceiptSchema.shape.finalityStatus,
  evidenceRefs: z.array(z.string()).default([]),
  streamOffsets: z.array(ReceiptStreamReferenceSchema).default([]),
  receiptDigest: DigestSchema,
  auditChainDigest: DigestSchema,
  exportFormat: z.enum(["json", "redacted_json"]),
  redactionProfileRef: z.string().min(1),
  exportPurposeCode: z.string().min(1),
  requestedByRef: z.string().min(1),
  evidenceRetentionUntil: IsoDateSchema.nullable(),
  exportedAt: IsoDateSchema,
  exportDigest: DigestSchema,
});
export type ReceiptExport = z.infer<typeof ReceiptExportSchema>;

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

export const ContractStreamEventSchema = ProtocolBaseSchema.extend({
  streamEventId: IdSchema,
  streamId: IdSchema,
  streamScope: z.enum(["tenant", "organization", "run", "protected_surface_resource"]),
  offset: z.number().int().nonnegative(),
  partitionKey: z.string().min(1),
  eventType: z.enum([
    "intent_compiled",
    "runtime_execution_recorded",
    "protected_path_posture_recorded",
    "action_proposed",
    "policy_decision_recorded",
    "action_greenlit",
    "action_refused",
    "review_required",
    "review_artifact_recorded",
    "gateway_checked",
    "mutation_attempted",
    "surface_operation_reconciled",
    "gateway_refused",
    "review_decision_recorded",
    "breaker_decision_recorded",
    "receipt_emitted",
    "receipt_exported",
    "recovery_recommended",
    "recovery_status_changed",
    "proof_gap_recorded",
    "proof_gap_resolved",
    "isolation_changed",
  ]),
  eventTime: IsoDateSchema,
  producerRef: z.string().min(1),
  objectRefs: z.array(z.string().min(1)),
  previousEventDigest: DigestSchema.nullable(),
  eventDigest: DigestSchema,
  payload: z.record(z.string(), JsonValueSchema),
});
export type ContractStreamEvent = z.infer<typeof ContractStreamEventSchema>;

export const ProtocolRecordSchema = z.discriminatedUnion("objectType", [
  z.strictObject({ objectType: z.literal("tool_capability"), payload: ToolCapabilitySchema }),
  z.strictObject({ objectType: z.literal("action_type"), payload: ActionTypeSchema }),
  z.strictObject({ objectType: z.literal("gateway_registry_entry"), payload: GatewayRegistryEntrySchema }),
  z.strictObject({ objectType: z.literal("operating_envelope"), payload: OperatingEnvelopeSchema }),
  z.strictObject({ objectType: z.literal("runtime_execution"), payload: RuntimeExecutionRecordSchema }),
  z.strictObject({ objectType: z.literal("protected_path_posture"), payload: ProtectedPathPostureSchema }),
  z.strictObject({ objectType: z.literal("intent_compilation"), payload: IntentCompilationRecordSchema }),
  z.strictObject({ objectType: z.literal("action_contract"), payload: ActionContractSchema }),
  z.strictObject({ objectType: z.literal("policy_decision"), payload: PolicyDecisionSchema }),
  z.strictObject({ objectType: z.literal("greenlight"), payload: GreenlightSchema }),
  z.strictObject({ objectType: z.literal("review_artifact"), payload: ReviewArtifactRecordSchema }),
  z.strictObject({ objectType: z.literal("review_decision"), payload: ReviewDecisionSchema }),
  z.strictObject({ objectType: z.literal("breaker_decision"), payload: BreakerDecisionSchema }),
  z.strictObject({ objectType: z.literal("isolation_state"), payload: IsolationStateSchema }),
  z.strictObject({ objectType: z.literal("gateway_check_attempt"), payload: GatewayCheckAttemptSchema }),
  z.strictObject({ objectType: z.literal("mutation_attempt"), payload: MutationAttemptSchema }),
  z.strictObject({ objectType: z.literal("surface_operation_reconciliation"), payload: SurfaceOperationReconciliationSchema }),
  z.strictObject({ objectType: z.literal("proof_gap"), payload: ProofGapSchema }),
  z.strictObject({ objectType: z.literal("receipt"), payload: ReceiptSchema }),
  z.strictObject({ objectType: z.literal("receipt_export"), payload: ReceiptExportSchema }),
  z.strictObject({ objectType: z.literal("recovery_recommendation"), payload: RecoveryRecommendationSchema }),
  z.strictObject({
    objectType: z.literal("recovery_recommendation_status_transition"),
    payload: RecoveryRecommendationStatusTransitionSchema,
  }),
  z.strictObject({ objectType: z.literal("contract_stream_event"), payload: ContractStreamEventSchema }),
]);
export type ProtocolRecord = z.infer<typeof ProtocolRecordSchema>;
export type ProtocolObjectType = ProtocolRecord["objectType"];
