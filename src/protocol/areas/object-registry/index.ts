import type { ZodType } from "zod";
export * from "./schemas";
import { ActionContractSchema, type ActionContract } from "../action-contract/schemas";
import { AuthorityCertificateSchema } from "../authority-certificate/schemas";
import {
  ActionTypeSchema,
  GatewayRegistryEntrySchema,
  OperatingEnvelopeSchema,
  ToolCapabilitySchema,
} from "../catalog-envelope/schemas";
import {
  CredentialResolutionEvidenceSchema,
  GatewayCredentialRefSchema,
  GatewayCustodyProofPacketSchema,
} from "../credential-custody/schemas";
import { DelegatedAuthorityRefSchema, DelegatedAuthorityStatusTransitionSchema } from "../delegated-authority/schemas";
import { ContractStreamEventSchema } from "../../events/schemas";
import { GatewayCheckAttemptSchema, MutationAttemptSchema } from "../gateway-gate/schemas";
import { GeneratedExecutionGraphSchema } from "../generated-execution-graph/schemas";
import { IdempotencyLedgerEntrySchema } from "../idempotency-ledger/schemas";
import { BypassProbeSchema } from "../bypass-probe/schemas";
import { ToolCallDraftSchema } from "../tool-call-draft/schemas";
import { IntentCompilationRecordSchema } from "../intent-compilation/schemas";
import {
  AgreementObligationBindingSchema,
  AgreementStatusTransitionSchema,
  LinkedAgreementSchema,
  NegotiationDecisionSchema,
  NegotiationOfferSchema,
  NegotiationSessionSchema,
} from "../negotiation/schemas";
import { BreakerDecisionSchema, IsolationStateSchema, type IsolationState } from "../isolation-breaker/schemas";
import {
  ProtectedSurfaceOperationClaimSchema,
  SurfaceOperationReconciliationSchema,
} from "../operation-lifecycle/schemas";
import { ProtocolObjectTypeSchema, type ProtocolObjectType, type ProtocolRecord } from "./schemas";
import { GreenlightSchema, PolicyDecisionSchema, type Greenlight } from "../policy-greenlight/schemas";
import { ProofGapSchema } from "../proof-gap/schemas";
import { ProtectedPathPostureSchema } from "../protected-path-posture/schemas";
import { RefusalSchema } from "../refusal/schemas";
import { ReceiptExportSchema, ReceiptSchema } from "../receipt-export/schemas";
import { RecoveryRecommendationSchema, RecoveryRecommendationStatusTransitionSchema } from "../recovery/schemas";
import { ReviewArtifactRecordSchema, ReviewDecisionSchema } from "../review-binding/schemas";
import { RuntimeExecutionRecordSchema } from "../runtime-evidence/schemas";
import { TransitionRequestContextSchema } from "../../context/request-context-schemas";

export type ProtocolObjectExportPosture =
  | "catalog_public"
  | "transition_evidence"
  | "receipt_evidence"
  | "internal_evidence";
export type ProtocolObjectRawReadPosture = "control_plane_read" | "audit_read" | "internal_only";
export type IsolationScopeRef = Pick<IsolationState, "tenantId" | "organizationId" | "scopeType" | "scopeId">;

export type ProtocolObjectRegistryEntry<T extends ProtocolObjectType = ProtocolObjectType> = {
  objectType: T;
  schema: ZodType;
  idSelector: (record: ProtocolRecord) => string;
  exportPosture: ProtocolObjectExportPosture;
  rawReadPosture: ProtocolObjectRawReadPosture;
};

export const protocolObjectTypes = ProtocolObjectTypeSchema.options;

export const protocolObjectRegistry = {
  tool_capability: entry(
    "tool_capability",
    ToolCapabilitySchema,
    (record) => record.payload.toolCapabilityId,
    "catalog_public",
    "control_plane_read",
  ),
  action_type: entry(
    "action_type",
    ActionTypeSchema,
    (record) => record.payload.actionTypeId,
    "catalog_public",
    "control_plane_read",
  ),
  gateway_registry_entry: entry(
    "gateway_registry_entry",
    GatewayRegistryEntrySchema,
    (record) => record.payload.gatewayRegistryEntryId,
    "catalog_public",
    "control_plane_read",
  ),
  operating_envelope: entry(
    "operating_envelope",
    OperatingEnvelopeSchema,
    (record) => record.payload.envelopeId,
    "catalog_public",
    "control_plane_read",
  ),
  gateway_credential_ref: entry(
    "gateway_credential_ref",
    GatewayCredentialRefSchema,
    (record) => record.payload.gatewayCredentialRefId,
    "transition_evidence",
    "audit_read",
  ),
  delegated_authority_ref: entry(
    "delegated_authority_ref",
    DelegatedAuthorityRefSchema,
    (record) => record.payload.delegatedAuthorityRefId,
    "transition_evidence",
    "audit_read",
  ),
  delegated_authority_status_transition: entry(
    "delegated_authority_status_transition",
    DelegatedAuthorityStatusTransitionSchema,
    (record) => record.payload.delegatedAuthorityStatusTransitionId,
    "transition_evidence",
    "audit_read",
  ),
  gateway_custody_proof_packet: entry(
    "gateway_custody_proof_packet",
    GatewayCustodyProofPacketSchema,
    (record) => record.payload.gatewayCustodyProofPacketId,
    "transition_evidence",
    "audit_read",
  ),
  credential_resolution_evidence: entry(
    "credential_resolution_evidence",
    CredentialResolutionEvidenceSchema,
    (record) => record.payload.credentialResolutionEvidenceId,
    "transition_evidence",
    "audit_read",
  ),
  transition_request_context: entry(
    "transition_request_context",
    TransitionRequestContextSchema,
    (record) => record.payload.transitionRequestContextId,
    "internal_evidence",
    "internal_only",
  ),
  runtime_execution: entry(
    "runtime_execution",
    RuntimeExecutionRecordSchema,
    (record) => record.payload.runtimeExecutionId,
    "transition_evidence",
    "audit_read",
  ),
  generated_execution_graph: entry(
    "generated_execution_graph",
    GeneratedExecutionGraphSchema,
    (record) => record.payload.generatedExecutionGraphId,
    "transition_evidence",
    "audit_read",
  ),
  idempotency_ledger_entry: entry(
    "idempotency_ledger_entry",
    IdempotencyLedgerEntrySchema,
    (record) => record.payload.idempotencyLedgerEntryId,
    "internal_evidence",
    "internal_only",
  ),
  bypass_probe: entry(
    "bypass_probe",
    BypassProbeSchema,
    (record) => record.payload.bypassProbeId,
    "internal_evidence",
    "internal_only",
  ),
  tool_call_draft: entry(
    "tool_call_draft",
    ToolCallDraftSchema,
    (record) => record.payload.toolCallDraftId,
    "internal_evidence",
    "internal_only",
  ),
  protected_path_posture: entry(
    "protected_path_posture",
    ProtectedPathPostureSchema,
    (record) => record.payload.protectedPathPostureId,
    "transition_evidence",
    "audit_read",
  ),
  intent_compilation: entry(
    "intent_compilation",
    IntentCompilationRecordSchema,
    (record) => record.payload.intentCompilationId,
    "transition_evidence",
    "audit_read",
  ),
  negotiation_session: entry(
    "negotiation_session",
    NegotiationSessionSchema,
    (record) => record.payload.negotiationSessionId,
    "transition_evidence",
    "audit_read",
  ),
  negotiation_offer: entry(
    "negotiation_offer",
    NegotiationOfferSchema,
    (record) => record.payload.negotiationOfferId,
    "transition_evidence",
    "audit_read",
  ),
  negotiation_decision: entry(
    "negotiation_decision",
    NegotiationDecisionSchema,
    (record) => record.payload.negotiationDecisionId,
    "transition_evidence",
    "audit_read",
  ),
  linked_agreement: entry(
    "linked_agreement",
    LinkedAgreementSchema,
    (record) => record.payload.linkedAgreementId,
    "transition_evidence",
    "audit_read",
  ),
  agreement_obligation_binding: entry(
    "agreement_obligation_binding",
    AgreementObligationBindingSchema,
    (record) => record.payload.agreementObligationBindingId,
    "transition_evidence",
    "audit_read",
  ),
  agreement_status_transition: entry(
    "agreement_status_transition",
    AgreementStatusTransitionSchema,
    (record) => record.payload.agreementStatusTransitionId,
    "transition_evidence",
    "audit_read",
  ),
  action_contract: entry(
    "action_contract",
    ActionContractSchema,
    (record) => record.payload.actionContractId,
    "transition_evidence",
    "audit_read",
  ),
  authority_certificate: entry(
    "authority_certificate",
    AuthorityCertificateSchema,
    (record) => record.payload.authorityCertificateId,
    "receipt_evidence",
    "audit_read",
  ),
  policy_decision: entry(
    "policy_decision",
    PolicyDecisionSchema,
    (record) => record.payload.policyDecisionId,
    "transition_evidence",
    "audit_read",
  ),
  greenlight: entry(
    "greenlight",
    GreenlightSchema,
    (record) => record.payload.greenlightId,
    "transition_evidence",
    "audit_read",
  ),
  review_artifact: entry(
    "review_artifact",
    ReviewArtifactRecordSchema,
    (record) => record.payload.reviewArtifactId,
    "transition_evidence",
    "audit_read",
  ),
  review_decision: entry(
    "review_decision",
    ReviewDecisionSchema,
    (record) => record.payload.reviewDecisionId,
    "transition_evidence",
    "audit_read",
  ),
  breaker_decision: entry(
    "breaker_decision",
    BreakerDecisionSchema,
    (record) => record.payload.breakerDecisionId,
    "transition_evidence",
    "audit_read",
  ),
  isolation_state: entry(
    "isolation_state",
    IsolationStateSchema,
    (record) => record.payload.isolationStateId,
    "transition_evidence",
    "audit_read",
  ),
  gateway_check_attempt: entry(
    "gateway_check_attempt",
    GatewayCheckAttemptSchema,
    (record) => record.payload.gateAttemptId,
    "transition_evidence",
    "audit_read",
  ),
  mutation_attempt: entry(
    "mutation_attempt",
    MutationAttemptSchema,
    (record) => record.payload.mutationAttemptId,
    "transition_evidence",
    "audit_read",
  ),
  protected_surface_operation_claim: entry(
    "protected_surface_operation_claim",
    ProtectedSurfaceOperationClaimSchema,
    (record) => record.payload.protectedSurfaceOperationClaimId,
    "internal_evidence",
    "internal_only",
  ),
  surface_operation_reconciliation: entry(
    "surface_operation_reconciliation",
    SurfaceOperationReconciliationSchema,
    (record) => record.payload.reconciliationId,
    "transition_evidence",
    "audit_read",
  ),
  proof_gap: entry(
    "proof_gap",
    ProofGapSchema,
    (record) => record.payload.proofGapId,
    "transition_evidence",
    "audit_read",
  ),
  refusal: entry("refusal", RefusalSchema, (record) => record.payload.refusalId, "transition_evidence", "audit_read"),
  receipt: entry("receipt", ReceiptSchema, (record) => record.payload.receiptId, "receipt_evidence", "audit_read"),
  receipt_export: entry(
    "receipt_export",
    ReceiptExportSchema,
    (record) => record.payload.receiptExportId,
    "receipt_evidence",
    "audit_read",
  ),
  recovery_recommendation: entry(
    "recovery_recommendation",
    RecoveryRecommendationSchema,
    (record) => record.payload.recoveryRecommendationId,
    "transition_evidence",
    "audit_read",
  ),
  recovery_recommendation_status_transition: entry(
    "recovery_recommendation_status_transition",
    RecoveryRecommendationStatusTransitionSchema,
    (record) => record.payload.recoveryRecommendationStatusTransitionId,
    "transition_evidence",
    "audit_read",
  ),
  contract_stream_event: entry(
    "contract_stream_event",
    ContractStreamEventSchema,
    (record) => record.payload.streamEventId,
    "internal_evidence",
    "internal_only",
  ),
} satisfies Record<ProtocolObjectType, ProtocolObjectRegistryEntry>;

export const protocolRecordSchemas = Object.fromEntries(
  protocolObjectTypes.map((objectType) => [objectType, protocolObjectRegistry[objectType].schema]),
) as Record<ProtocolObjectType, ZodType>;

export function getObjectId(record: ProtocolRecord): string {
  return protocolObjectRegistry[record.objectType].idSelector(record);
}

export function isolationScopeRefsForContract(contract: ActionContract): IsolationScopeRef[] {
  return uniqueIsolationScopeRefs([
    isolationScopeRef(contract, "tenant", contract.tenantId),
    isolationScopeRef(contract, "organization", contract.organizationId),
    isolationScopeRef(contract, "agent", contract.agentId),
    isolationScopeRef(contract, "run", contract.runId),
    isolationScopeRef(contract, "envelope", contract.envelopeId),
    isolationScopeRef(contract, "action_class", contract.actionClass),
    isolationScopeRef(contract, "gateway", contract.gatewayId),
    ...contract.gatewayCredentialRefs.map((ref) =>
      isolationScopeRef(contract, "credential_ref", ref.gatewayCredentialRefId),
    ),
    ...contract.delegatedAuthorityRefs.map((ref) =>
      isolationScopeRef(contract, "authority_ref", ref.delegatedAuthorityRefId),
    ),
    isolationScopeRef(contract, "resource", contract.resourceRef),
  ]);
}

export function isolationScopeRefsForGreenlight(greenlight: Greenlight): IsolationScopeRef[] {
  return uniqueIsolationScopeRefs([
    isolationScopeRef(greenlight, "tenant", greenlight.tenantId),
    isolationScopeRef(greenlight, "organization", greenlight.organizationId),
    isolationScopeRef(greenlight, "gateway", greenlight.gatewayId),
    isolationScopeRef(greenlight, "action_class", greenlight.actionClass),
    isolationScopeRef(greenlight, "resource", greenlight.resourceRef),
  ]);
}

function isolationScopeRef(
  source: Pick<IsolationScopeRef, "tenantId" | "organizationId">,
  scopeType: IsolationState["scopeType"],
  scopeId: string,
): IsolationScopeRef {
  return {
    tenantId: source.tenantId,
    organizationId: source.organizationId,
    scopeType,
    scopeId,
  };
}

function uniqueIsolationScopeRefs(scopeRefs: IsolationScopeRef[]): IsolationScopeRef[] {
  const seen = new Set<string>();
  const unique: IsolationScopeRef[] = [];
  for (const scopeRef of scopeRefs) {
    const key = `${scopeRef.tenantId}:${scopeRef.organizationId}:${scopeRef.scopeType}:${scopeRef.scopeId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(scopeRef);
  }
  return unique;
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
