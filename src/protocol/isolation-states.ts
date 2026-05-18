import { createId, nowIso } from "./ids";
import { CreateIsolationInputSchema, type CreateIsolationInput } from "./inputs";
import type { ProtocolRecorder } from "./records";
import { IsolationStateSchema, PROTOCOL_VERSION, type IsolationState } from "./schemas";

export async function createIsolationState(
  recorder: ProtocolRecorder,
  inputValue: CreateIsolationInput,
): Promise<IsolationState> {
  const input = CreateIsolationInputSchema.parse(inputValue);
  const now = nowIso();
  const state = IsolationStateSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    createdAt: now,
    isolationStateId: createId("iso"),
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    state: input.state,
    reasonCode: input.reasonCode,
    reasonSummary: input.reasonSummary,
    sourceDecisionRef: input.sourceDecisionRef,
    effectiveAt: now,
    expiresAt: input.expiresAt,
    clearedAt: null,
    observedStreamOffsets: input.observedStreamOffsets,
    version: 1,
  });
  await recorder.commitRecordsWithEvents([{ objectType: "isolation_state", payload: state }], [
    {
      source: state,
      eventType: "isolation_changed",
      objectRefs: [state.isolationStateId, state.scopeId],
      payload: {
        state: state.state,
        reasonCode: state.reasonCode,
        observedStreamOffsets: state.observedStreamOffsets,
      },
    },
  ]);
  return state;
}
