import { digestCanonical } from "../../foundation/canonical";
import type { EventDescriptor } from "../../events/chains";
import { createId, nowIso } from "../../foundation/ids";
import { CreateRuntimeExecutionInputSchema, type CreateRuntimeExecutionInput } from "./types";
import type { ProtocolRecorder } from "../../events/records";
import type { ProtocolRecord } from "../object-registry";
import { PROTOCOL_VERSION, RuntimeExecutionRecordSchema, type JsonValue, type RuntimeExecutionRecord } from "./types";

type ParsedCreateRuntimeExecutionInput = ReturnType<typeof CreateRuntimeExecutionInputSchema.parse>;

type RuntimeExecutionContext = {
  input: ParsedCreateRuntimeExecutionInput;
  createdAt: string;
  runtimeExecutionId: string;
};

export async function createRuntimeExecution(
  recorder: ProtocolRecorder,
  inputValue: CreateRuntimeExecutionInput,
): Promise<RuntimeExecutionRecord> {
  const input = CreateRuntimeExecutionInputSchema.parse(inputValue);
  const context = buildRuntimeExecutionContext(input);
  const record = await buildRuntimeExecutionRecord(context);
  await commitRuntimeExecution(recorder, record);
  return record;
}

function buildRuntimeExecutionContext(input: ParsedCreateRuntimeExecutionInput): RuntimeExecutionContext {
  return {
    input,
    createdAt: nowIso(),
    runtimeExecutionId: createId("rex"),
  };
}

async function buildRuntimeExecutionRecord(context: RuntimeExecutionContext): Promise<RuntimeExecutionRecord> {
  const { input, createdAt, runtimeExecutionId } = context;
  const runtimeExecutionDigest = await digestCanonical(runtimeExecutionDigestMaterial(context));
  return RuntimeExecutionRecordSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    ...input,
    createdAt,
    runtimeExecutionId,
    runtimeExecutionDigest,
  });
}

function runtimeExecutionDigestMaterial(context: RuntimeExecutionContext): JsonValue {
  const { input } = context;
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
  return digestMaterial;
}

async function commitRuntimeExecution(recorder: ProtocolRecorder, record: RuntimeExecutionRecord): Promise<void> {
  await recorder.commitRecordsWithEvents(runtimeExecutionRecords(record), runtimeExecutionEvents(record));
}

function runtimeExecutionRecords(record: RuntimeExecutionRecord): ProtocolRecord[] {
  return [{ objectType: "runtime_execution", payload: record }];
}

function runtimeExecutionEvents(record: RuntimeExecutionRecord): EventDescriptor[] {
  return [
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
  ];
}
