import { z } from "zod";
import {
  IdSchema,
  IsoDateSchema,
  JsonValueSchema,
  ProtocolBaseSchema,
  ReasonCodeSchema,
  ResourceRefSchema,
} from "../../foundation/schema-core";
import { RequiredProtectedPathStateSchema, GatewayEnforcementModeSchema } from "../catalog-envelope/schemas";
import { ProtectedPathStateSchema } from "../protected-path-posture/schemas";
import { RefusalPhaseSchema } from "../refusal/schemas";

const NonAuthorityBoundaryShape = {
  authorityCreated: z.literal(false),
  greenlightRef: z.null(),
  gatewayCheckRef: z.null(),
  mutationAttemptRef: z.null(),
};

export const ProtectedActionMetadataSchema = ProtocolBaseSchema.extend({
  metadataId: IdSchema,
  toolCapabilityId: IdSchema,
  actionTypeId: IdSchema,
  gatewayRegistryEntryId: IdSchema,
  operatingEnvelopeId: IdSchema,
  runtimeAdapterId: IdSchema,
  actionClass: z.string().min(1),
  protectedSurfaceKind: z.string().min(1),
  gatewayId: IdSchema,
  gatewayPolicyVersion: z.string().min(1),
  gatewayEnforcementMode: GatewayEnforcementModeSchema,
  requiredProtectedPathState: RequiredProtectedPathStateSchema,
  currentProtectedPathState: ProtectedPathStateSchema.nullable(),
  protectedPathPostureRef: IdSchema.nullable(),
  resourceNamespaceRef: z.string().min(1),
  allowedResources: z.array(ResourceRefSchema).default([]),
  requiredContractFields: z.array(z.string().min(1)).default([]),
  canonicalParameterSchemaRef: z.string().min(1),
  allowedBoundsSchemaRef: z.string().min(1),
  inputSchemaRef: z.string().min(1),
  outputSchemaRef: z.string().min(1),
  requiredEvidenceTypes: z.array(z.string().min(1)).default([]),
  evidenceRequirements: z.array(z.string().min(1)).default([]),
  requestSchemaRef: z.string().min(1),
  ...NonAuthorityBoundaryShape,
});
export type ProtectedActionMetadata = z.infer<typeof ProtectedActionMetadataSchema>;

export const ProtectedActionChallengeSchema = ProtocolBaseSchema.extend({
  challengeId: IdSchema,
  phase: RefusalPhaseSchema.or(z.enum(["proof_gap", "transport"])),
  actionContractRef: IdSchema.nullable(),
  refusedObjectRef: z.string().min(1).nullable(),
  proofGapRef: IdSchema.nullable(),
  reasonCode: ReasonCodeSchema,
  retryability: z.enum(["terminal", "retryable", "recoverable", "review_required", "ambiguous"]),
  commitState: z.enum(["not_started", "committed", "ambiguous"]),
  mutationAttempted: z.literal(false),
  rawInternalRecordIncluded: z.literal(false),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  nextStepKind: z.enum(["read_evidence", "recraft_request", "request_review", "stop"]).default("read_evidence"),
  ...NonAuthorityBoundaryShape,
});
export type ProtectedActionChallenge = z.infer<typeof ProtectedActionChallengeSchema>;

export const ProtectedActionRequestSchema = ProtocolBaseSchema.extend({
  requestId: IdSchema,
  metadataRef: IdSchema,
  principalIntentRef: z.string().min(1),
  generatedCodeOrSpecRef: z.string().min(1),
  runtimeExecutionId: IdSchema.nullable().default(null),
  generatedExecutionGraphId: IdSchema.nullable().default(null),
  generatedExecutionNodeId: IdSchema.nullable().default(null),
  toolCallDraftId: IdSchema.nullable().default(null),
  actionClass: z.string().min(1),
  resourceRef: ResourceRefSchema,
  parameters: z.record(z.string(), JsonValueSchema),
  nonSecretParamsSummary: z.record(z.string(), JsonValueSchema),
  secretRefs: z.record(z.string(), z.string().min(1)).default({}),
  idempotencyKey: z.string().min(1),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  requestedAt: IsoDateSchema,
  ...NonAuthorityBoundaryShape,
});
export type ProtectedActionRequest = z.infer<typeof ProtectedActionRequestSchema>;

export const ProtectedActionEvidenceProjectionSchema = ProtocolBaseSchema.extend({
  projectionId: IdSchema,
  projectionKind: z.enum([
    "generated_graph",
    "contract",
    "transaction_envelope",
    "receipt_timeline",
    "idempotency_recovery",
    "protected_path_health",
  ]),
  sourceRef: z.string().min(1),
  redactionProfileRef: z.string().min(1),
  rawInternalRecordIncluded: z.literal(false),
  mutationCommandIncluded: z.literal(false),
  omittedFields: z.array(z.string().min(1)).default([]),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  ...NonAuthorityBoundaryShape,
});
export type ProtectedActionEvidenceProjection = z.infer<typeof ProtectedActionEvidenceProjectionSchema>;
