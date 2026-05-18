import { createId, nowIso } from "./ids";
import { CompileIntentInputSchema, type CompileIntentInput } from "./inputs";
import type { ProtocolRecorder } from "./records";
import {
  IntentCompilationRecordSchema,
  PROTOCOL_VERSION,
  type ActionType,
  type IntentCompilationRecord,
  type GatewayRegistryEntry,
  type ToolCapability,
} from "./schemas";
import type { ProtocolStore } from "../storage/store";

export async function compileIntent(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  inputValue: CompileIntentInput,
): Promise<IntentCompilationRecord> {
  const input = CompileIntentInputSchema.parse(inputValue);
  const createdAt = nowIso();
  const uncertaintyMarkers: string[] = [];
  const overreachReasonCodes: string[] = [];

  const [toolRecord, actionTypeRecord, gatewayRecord] = await Promise.all([
    store.getRecord<ToolCapability>("tool_capability", input.candidate.toolCapabilityId),
    store.getRecord<ActionType>("action_type", input.candidate.actionTypeId),
    store.getRecord<GatewayRegistryEntry>("gateway_registry_entry", input.candidate.gatewayRegistryEntryId),
  ]);

  const tool = toolRecord?.payload ?? null;
  const actionType = actionTypeRecord?.payload ?? null;
  const gateway = gatewayRecord?.payload ?? null;

  if (!tool) uncertaintyMarkers.push("unknown_tool_capability");
  if (!actionType) uncertaintyMarkers.push("unknown_action_type");
  if (!gateway) uncertaintyMarkers.push("unknown_gateway_registry_entry");
  if (tool?.readWriteClassification === "consequential" && tool.wrapperStatus !== "wrapped") {
    overreachReasonCodes.push("unwrapped_consequential_tool");
  }
  if (actionType && actionType.actionClass !== input.candidate.actionClass) {
    overreachReasonCodes.push("action_class_mismatch");
  }
  if (gateway && gateway.gatewayId !== input.candidate.gatewayId) {
    overreachReasonCodes.push("gateway_mismatch");
  }

  const record = IntentCompilationRecordSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    createdAt,
    intentCompilationId: createId("icr"),
    principalIntentRef: input.principalIntentRef,
    principalId: input.principalId,
    agentId: input.agentId,
    runId: input.runId,
    runtimeAdapterId: input.runtimeAdapterId,
    operatingEnvelopeId: input.operatingEnvelopeId,
    toolCatalogRef: input.toolCatalogRef,
    actionCatalogRef: input.actionCatalogRef,
    gatewayRegistryRef: input.gatewayRegistryRef,
    generatedCodeOrSpecRefs: input.generatedCodeOrSpecRefs,
    declaredAssumptions: input.declaredAssumptions,
    uncertaintyMarkers,
    candidateActionContractRefs: [],
    rejectedCandidateRefs: [],
    overreachReasonCodes,
    requiredEvidenceRefs: input.requiredEvidenceRefs,
    compilerVersion: input.compilerVersion,
  });

  await recorder.commitRecordsWithEvents(
    [{ objectType: "intent_compilation", payload: record }],
    [
      {
        source: record,
        eventType: "intent_compiled",
        objectRefs: [record.intentCompilationId],
        payload: { uncertaintyMarkers, overreachReasonCodes },
      },
    ],
  );
  return record;
}
