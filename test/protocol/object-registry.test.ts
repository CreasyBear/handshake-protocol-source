import { describe, expect, it } from "bun:test";
import {
  getObjectId,
  protocolObjectRegistry,
  protocolObjectTypes,
  protocolRecordSchemas,
  type ProtocolObjectExportPosture,
  type ProtocolObjectRawReadPosture,
} from "../../src/protocol/areas/object-registry";
import {
  ProtocolObjectTypeSchema,
  type ProtocolObjectType,
  type ProtocolRecord,
} from "../../src/protocol/public/schemas";

const idFields = {
  tool_capability: "toolCapabilityId",
  action_type: "actionTypeId",
  gateway_registry_entry: "gatewayRegistryEntryId",
  operating_envelope: "envelopeId",
  transition_request_context: "transitionRequestContextId",
  runtime_execution: "runtimeExecutionId",
  generated_execution_graph: "generatedExecutionGraphId",
  protected_path_posture: "protectedPathPostureId",
  intent_compilation: "intentCompilationId",
  action_contract: "actionContractId",
  policy_decision: "policyDecisionId",
  greenlight: "greenlightId",
  review_artifact: "reviewArtifactId",
  review_decision: "reviewDecisionId",
  breaker_decision: "breakerDecisionId",
  isolation_state: "isolationStateId",
  gateway_check_attempt: "gateAttemptId",
  mutation_attempt: "mutationAttemptId",
  protected_surface_operation_claim: "protectedSurfaceOperationClaimId",
  surface_operation_reconciliation: "reconciliationId",
  proof_gap: "proofGapId",
  receipt: "receiptId",
  receipt_export: "receiptExportId",
  recovery_recommendation: "recoveryRecommendationId",
  recovery_recommendation_status_transition: "recoveryRecommendationStatusTransitionId",
  contract_stream_event: "streamEventId",
} satisfies Record<ProtocolObjectType, string>;

const exportPostures = new Set<ProtocolObjectExportPosture>([
  "catalog_public",
  "transition_evidence",
  "receipt_evidence",
  "internal_evidence",
]);
const rawReadPostures = new Set<ProtocolObjectRawReadPosture>(["control_plane_read", "audit_read", "internal_only"]);

describe("protocol object registry", () => {
  it("covers every protocol object type exactly once", () => {
    const schemaTypes = [...ProtocolObjectTypeSchema.options].sort();
    expect([...protocolObjectTypes].sort()).toEqual(schemaTypes);
    expect(Object.keys(protocolObjectRegistry).sort()).toEqual(schemaTypes);
    expect(Object.keys(protocolRecordSchemas).sort()).toEqual(schemaTypes);
  });

  it("keeps schemas, export posture, and raw-read posture on each registry entry", () => {
    for (const objectType of ProtocolObjectTypeSchema.options) {
      const entry = protocolObjectRegistry[objectType];
      expect(entry.objectType).toBe(objectType);
      expect(protocolRecordSchemas[objectType]).toBe(entry.schema);
      expect(exportPostures.has(entry.exportPosture)).toBe(true);
      expect(rawReadPostures.has(entry.rawReadPosture)).toBe(true);
    }
  });

  it("owns object id extraction outside storage adapters", () => {
    for (const objectType of ProtocolObjectTypeSchema.options) {
      const id = `id:${objectType}`;
      const record = {
        objectType,
        payload: { [idFields[objectType]]: id },
      } as unknown as ProtocolRecord;
      expect(getObjectId(record)).toBe(id);
    }
  });
});
