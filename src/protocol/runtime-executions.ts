import { digestCanonical } from "./canonical";
import { createId, nowIso } from "./ids";
import { CreateRuntimeExecutionInputSchema, type CreateRuntimeExecutionInput } from "./inputs";
import type { ProtocolRecorder } from "./records";
import {
  PROTOCOL_VERSION,
  RuntimeExecutionRecordSchema,
  type JsonValue,
  type RuntimeExecutionRecord,
} from "./schemas";

export async function createRuntimeExecution(
  recorder: ProtocolRecorder,
  inputValue: CreateRuntimeExecutionInput,
): Promise<RuntimeExecutionRecord> {
  const input = CreateRuntimeExecutionInputSchema.parse(inputValue);
  const createdAt = nowIso();
  const runtimeExecutionId = createId("rex");
  const digestMaterial = {
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    principalIntentRef: input.principalIntentRef,
    principalId: input.principalId,
    agentId: input.agentId,
    runId: input.runId,
    runtimeAdapterId: input.runtimeAdapterId,
    executionShape: input.executionShape,
    runtimePosture: input.runtimePosture,
    executionBlockRef: input.executionBlockRef,
    executionBlockDigest: input.executionBlockDigest,
    generatedCodeOrSpecRefs: input.generatedCodeOrSpecRefs,
    allowedToolCapabilityIds: input.allowedToolCapabilityIds,
    observedToolCallRefs: input.observedToolCallRefs,
    observedConsequentialCallCount: input.observedConsequentialCallCount,
    loopDetected: input.loopDetected,
    retryDetected: input.retryDetected,
    branchDetected: input.branchDetected,
    dynamicToolConstructionDetected: input.dynamicToolConstructionDetected,
    unobservedRegionRefs: input.unobservedRegionRefs,
    accessPosture: input.accessPosture,
    uncertaintyMarkers: input.uncertaintyMarkers,
    refusalReasonCodes: input.refusalReasonCodes,
    evidenceRefs: input.evidenceRefs,
  } satisfies JsonValue;
  const runtimeExecutionDigest = await digestCanonical(digestMaterial);
  const record = RuntimeExecutionRecordSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    ...input,
    createdAt,
    runtimeExecutionId,
    runtimeExecutionDigest,
  });

  await recorder.commitRecordsWithEvents(
    [{ objectType: "runtime_execution", payload: record }],
    [
      {
        source: record,
        eventType: "runtime_execution_recorded",
        objectRefs: [record.runtimeExecutionId, record.runtimeExecutionDigest],
        payload: {
          executionShape: record.executionShape,
          runtimePosture: record.runtimePosture,
          observedConsequentialCallCount: record.observedConsequentialCallCount,
          dynamicToolConstructionDetected: record.dynamicToolConstructionDetected,
        },
      },
    ],
  );

  return record;
}
