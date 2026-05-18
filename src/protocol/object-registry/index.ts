import type { ZodType } from "zod";
import { ActionContractSchema, type ActionContract } from "../action-contract/schemas";
import {
  ActionTypeSchema,
  GatewayRegistryEntrySchema,
  OperatingEnvelopeSchema,
  ToolCapabilitySchema,
} from "../catalog-envelope/schemas";
import { ContractStreamEventSchema } from "../event-schemas";
import { GatewayCheckAttemptSchema, MutationAttemptSchema } from "../gateway-gate/schemas";
import { IntentCompilationRecordSchema } from "../intent-compilation/schemas";
import { BreakerDecisionSchema, IsolationStateSchema } from "../isolation-breaker/schemas";
import {
  ProtectedSurfaceOperationClaimSchema,
  SurfaceOperationReconciliationSchema,
} from "../operation-lifecycle/schemas";
import {
  ProtocolObjectTypeSchema,
  ProtocolRecordSchema,
  type ProtocolObjectType,
  type ProtocolRecord,
} from "./schemas";
import { GreenlightSchema, PolicyDecisionSchema, type Greenlight } from "../policy-greenlight/schemas";
import { ProofGapSchema } from "../proof-gap/schemas";
import { ProtectedPathPostureSchema } from "../protected-path-posture/schemas";
import { ReceiptExportSchema, ReceiptSchema } from "../receipt-export/schemas";
import {
  RecoveryRecommendationSchema,
  RecoveryRecommendationStatusTransitionSchema,
} from "../recovery/schemas";
import { ReviewArtifactRecordSchema, ReviewDecisionSchema } from "../review-binding/schemas";
import { RuntimeExecutionRecordSchema } from "../runtime-evidence/schemas";
import { TransitionRequestContextSchema } from "../transition-request-context-schemas";

export type ProtocolObjectExportPosture = "catalog_public" | "transition_evidence" | "receipt_evidence" | "internal_evidence";
export type ProtocolObjectRawReadPosture = "control_plane_read" | "audit_read" | "internal_only";

export type ProtocolObjectRegistryEntry<T extends ProtocolObjectType = ProtocolObjectType> = {
  objectType: T;
  schema: ZodType;
  idSelector: (record: ProtocolRecord) => string;
  exportPosture: ProtocolObjectExportPosture;
  rawReadPosture: ProtocolObjectRawReadPosture;
};

export const protocolObjectTypes = ProtocolObjectTypeSchema.options;

export const protocolObjectRegistry = {
  tool_capability: entry("tool_capability", ToolCapabilitySchema, (record) => record.payload.toolCapabilityId, "catalog_public", "control_plane_read"),
  action_type: entry("action_type", ActionTypeSchema, (record) => record.payload.actionTypeId, "catalog_public", "control_plane_read"),
  gateway_registry_entry: entry("gateway_registry_entry", GatewayRegistryEntrySchema, (record) => record.payload.gatewayRegistryEntryId, "catalog_public", "control_plane_read"),
  operating_envelope: entry("operating_envelope", OperatingEnvelopeSchema, (record) => record.payload.envelopeId, "catalog_public", "control_plane_read"),
  transition_request_context: entry("transition_request_context", TransitionRequestContextSchema, (record) => record.payload.transitionRequestContextId, "internal_evidence", "internal_only"),
  runtime_execution: entry("runtime_execution", RuntimeExecutionRecordSchema, (record) => record.payload.runtimeExecutionId, "transition_evidence", "audit_read"),
  protected_path_posture: entry("protected_path_posture", ProtectedPathPostureSchema, (record) => record.payload.protectedPathPostureId, "transition_evidence", "audit_read"),
  intent_compilation: entry("intent_compilation", IntentCompilationRecordSchema, (record) => record.payload.intentCompilationId, "transition_evidence", "audit_read"),
  action_contract: entry("action_contract", ActionContractSchema, (record) => record.payload.actionContractId, "transition_evidence", "audit_read"),
  policy_decision: entry("policy_decision", PolicyDecisionSchema, (record) => record.payload.policyDecisionId, "transition_evidence", "audit_read"),
  greenlight: entry("greenlight", GreenlightSchema, (record) => record.payload.greenlightId, "transition_evidence", "audit_read"),
  review_artifact: entry("review_artifact", ReviewArtifactRecordSchema, (record) => record.payload.reviewArtifactId, "transition_evidence", "audit_read"),
  review_decision: entry("review_decision", ReviewDecisionSchema, (record) => record.payload.reviewDecisionId, "transition_evidence", "audit_read"),
  breaker_decision: entry("breaker_decision", BreakerDecisionSchema, (record) => record.payload.breakerDecisionId, "transition_evidence", "audit_read"),
  isolation_state: entry("isolation_state", IsolationStateSchema, (record) => record.payload.isolationStateId, "transition_evidence", "audit_read"),
  gateway_check_attempt: entry("gateway_check_attempt", GatewayCheckAttemptSchema, (record) => record.payload.gateAttemptId, "transition_evidence", "audit_read"),
  mutation_attempt: entry("mutation_attempt", MutationAttemptSchema, (record) => record.payload.mutationAttemptId, "transition_evidence", "audit_read"),
  protected_surface_operation_claim: entry("protected_surface_operation_claim", ProtectedSurfaceOperationClaimSchema, (record) => record.payload.protectedSurfaceOperationClaimId, "internal_evidence", "internal_only"),
  surface_operation_reconciliation: entry("surface_operation_reconciliation", SurfaceOperationReconciliationSchema, (record) => record.payload.reconciliationId, "transition_evidence", "audit_read"),
  proof_gap: entry("proof_gap", ProofGapSchema, (record) => record.payload.proofGapId, "transition_evidence", "audit_read"),
  receipt: entry("receipt", ReceiptSchema, (record) => record.payload.receiptId, "receipt_evidence", "audit_read"),
  receipt_export: entry("receipt_export", ReceiptExportSchema, (record) => record.payload.receiptExportId, "receipt_evidence", "audit_read"),
  recovery_recommendation: entry("recovery_recommendation", RecoveryRecommendationSchema, (record) => record.payload.recoveryRecommendationId, "transition_evidence", "audit_read"),
  recovery_recommendation_status_transition: entry(
    "recovery_recommendation_status_transition",
    RecoveryRecommendationStatusTransitionSchema,
    (record) => record.payload.recoveryRecommendationStatusTransitionId,
    "transition_evidence",
    "audit_read",
  ),
  contract_stream_event: entry("contract_stream_event", ContractStreamEventSchema, (record) => record.payload.streamEventId, "internal_evidence", "internal_only"),
} satisfies Record<ProtocolObjectType, ProtocolObjectRegistryEntry>;

export const protocolRecordSchemas = Object.fromEntries(
  protocolObjectTypes.map((objectType) => [objectType, protocolObjectRegistry[objectType].schema]),
) as Record<ProtocolObjectType, ZodType>;

export function getObjectId(record: ProtocolRecord): string {
  return protocolObjectRegistry[record.objectType].idSelector(record);
}

export function scopeIdsForContract(contract: ActionContract): string[] {
  return [
    contract.tenantId,
    contract.organizationId,
    contract.agentId,
    contract.runId,
    contract.envelopeId,
    contract.actionClass,
    contract.gatewayId,
    contract.resourceRef,
  ];
}

export function scopeIdsForGreenlight(greenlight: Greenlight): string[] {
  return [
    greenlight.tenantId,
    greenlight.organizationId,
    greenlight.gatewayId,
    greenlight.actionClass,
    greenlight.resourceRef,
  ];
}

function entry<T extends ProtocolObjectType>(
  objectType: T,
  schema: ZodType,
  idSelector: (record: Extract<ProtocolRecord, { objectType: T }>) => string,
  exportPosture: ProtocolObjectExportPosture,
  rawReadPosture: ProtocolObjectRawReadPosture,
): ProtocolObjectRegistryEntry<T> {
  return {
    objectType,
    schema,
    idSelector: (record) => idSelector(record as Extract<ProtocolRecord, { objectType: T }>),
    exportPosture,
    rawReadPosture,
  };
}
