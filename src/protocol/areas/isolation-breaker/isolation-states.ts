import type { EventDescriptor } from "../../events/chains";
import { createId, nowIso } from "../../foundation/ids";
import { CreateIsolationInputSchema, type CreateIsolationInput } from "./types";
import type { ProtocolRecorder } from "../../events/records";
import type { ProtocolRecord } from "../object-registry";
import { IsolationStateSchema, PROTOCOL_VERSION, type IsolationState } from "./types";
import type { IsolationScopeRef, IsolationStateIndexEntry } from "../../store/port";

type ParsedCreateIsolationInput = ReturnType<typeof CreateIsolationInputSchema.parse>;

type IsolationStateContext = {
  input: ParsedCreateIsolationInput;
  now: string;
  isolationStateId: string;
};

export async function createIsolationState(
  recorder: ProtocolRecorder,
  inputValue: CreateIsolationInput,
): Promise<IsolationState> {
  const input = CreateIsolationInputSchema.parse(inputValue);
  const context = buildIsolationStateContext(input);
  const state = buildIsolationState(context);
  await commitIsolationState(recorder, state);
  return state;
}

function buildIsolationStateContext(input: ParsedCreateIsolationInput): IsolationStateContext {
  return {
    input,
    now: nowIso(),
    isolationStateId: createId("iso"),
  };
}

function buildIsolationState(context: IsolationStateContext): IsolationState {
  const { input, now, isolationStateId } = context;
  return IsolationStateSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    createdAt: now,
    isolationStateId,
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
}

async function commitIsolationState(recorder: ProtocolRecorder, state: IsolationState): Promise<void> {
  await recorder.commitRecordsWithEvents(isolationStateRecords(state), isolationStateEvents(state), {
    isolationStateIndexEntries: [isolationStateIndexEntry(state)],
  });
}

function isolationStateRecords(state: IsolationState): ProtocolRecord[] {
  return [{ objectType: "isolation_state", payload: state }];
}

function isolationStateEvents(state: IsolationState): EventDescriptor[] {
  return [
    {
      source: state,
      eventType: "isolation_changed",
      objectRefs: [state.isolationStateId, state.scopeType, state.scopeId],
      payload: {
        state: state.state,
        reasonCode: state.reasonCode,
        observedStreamOffsets: state.observedStreamOffsets,
      },
    },
  ];
}

export function isolationStateIndexEntry(state: IsolationState): IsolationStateIndexEntry {
  return {
    isolationScopeKey: isolationScopeKey(state),
    isolationStateId: state.isolationStateId,
    tenantId: state.tenantId,
    organizationId: state.organizationId,
    scopeType: state.scopeType,
    scopeId: state.scopeId,
    state: state.state,
    updatedAt: state.createdAt,
  };
}

export function isolationScopeKey(scopeRef: IsolationScopeRef): string {
  return `${scopeRef.tenantId}:${scopeRef.organizationId}:${scopeRef.scopeType}:${scopeRef.scopeId}`;
}
