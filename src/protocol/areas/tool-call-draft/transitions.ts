import { digestCanonical } from "../../foundation/canonical";
import { createId, nowIso } from "../../foundation/ids";
import { HandshakeProtocolError } from "../../foundation/errors";
import type { EventDescriptor } from "../../events/chains";
import type { ProtocolRecorder } from "../../events/records";
import type { ProtocolRecord } from "../object-registry";
import type { ProtocolStore } from "../../store/port";
import {
  CreateToolCallDraftInputSchema,
  TransitionToolCallDraftInputSchema,
  PROTOCOL_VERSION,
  ToolCallDraftSchema,
  type CreateToolCallDraftInput,
  type TransitionToolCallDraftInput,
  type JsonValue,
  type ToolCallDraft,
} from "./types";

type ParsedCreateToolCallDraftInput = ReturnType<typeof CreateToolCallDraftInputSchema.parse>;
type ParsedTransitionToolCallDraftInput = ReturnType<typeof TransitionToolCallDraftInputSchema.parse>;

type ToolCallDraftContext = {
  input: ParsedCreateToolCallDraftInput;
  createdAt: string;
  paramsDigest: `sha256:${string}`;
};

export async function createToolCallDraft(
  recorder: ProtocolRecorder,
  inputValue: CreateToolCallDraftInput,
): Promise<ToolCallDraft> {
  const input = CreateToolCallDraftInputSchema.parse(inputValue);
  const context = {
    input,
    createdAt: nowIso(),
    paramsDigest: await digestCanonical({ parameters: input.parameters, secretRefs: input.secretRefs }),
  };
  const draft = await buildToolCallDraft(context);
  await recorder.commitRecordsWithEvents(toolCallDraftRecords(draft), toolCallDraftEvents(draft));
  return draft;
}

export async function transitionToolCallDraft(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  inputValue: TransitionToolCallDraftInput,
): Promise<ToolCallDraft> {
  const input = TransitionToolCallDraftInputSchema.parse(inputValue);
  const currentRecord = await store.getRecord<ToolCallDraft>("tool_call_draft", input.toolCallDraftId);
  if (!currentRecord) {
    throw new HandshakeProtocolError("tool_call_draft_missing", "Tool call draft was not found.", 404);
  }
  const current = currentRecord.payload;
  assertAllowedTransition(current, input);
  const transitioned = await buildTransitionedToolCallDraft(current, input);
  await recorder.commitRecordsWithEvents(
    toolCallDraftRecords(transitioned),
    toolCallDraftEvents(transitioned, current),
  );
  return transitioned;
}

async function buildToolCallDraft(context: ToolCallDraftContext): Promise<ToolCallDraft> {
  const { input, createdAt, paramsDigest } = context;
  const toolCallDraftId = createId("tcd");
  const draftDigest = await digestCanonical(toolCallDraftDigestMaterial(context, toolCallDraftId));
  return ToolCallDraftSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    createdAt,
    toolCallDraftId,
    runtimeExecutionId: input.runtimeExecutionId,
    generatedExecutionGraphId: input.generatedExecutionGraphId,
    generatedExecutionNodeId: input.generatedExecutionNodeId,
    toolCapabilityId: input.toolCapabilityId,
    actionTypeId: input.actionTypeId,
    gatewayRegistryEntryId: input.gatewayRegistryEntryId,
    actionClass: input.actionClass,
    gatewayId: input.gatewayId,
    resourceRef: input.resourceRef,
    draftState: input.draftState,
    parameters: input.parameters,
    nonSecretParamsSummary: input.nonSecretParamsSummary,
    secretRefs: input.secretRefs,
    paramsDigest,
    finalizedAt: null,
    expiresAt: input.expiresAt,
    invalidReasonCodes: input.invalidReasonCodes,
    evidenceRefs: input.evidenceRefs,
    draftDigest,
  });
}

function toolCallDraftDigestMaterial(context: ToolCallDraftContext, toolCallDraftId: string): JsonValue {
  const { input, paramsDigest } = context;
  return {
    toolCallDraftId,
    runtimeExecutionId: input.runtimeExecutionId,
    generatedExecutionGraphId: input.generatedExecutionGraphId,
    generatedExecutionNodeId: input.generatedExecutionNodeId,
    toolCapabilityId: input.toolCapabilityId,
    actionTypeId: input.actionTypeId,
    gatewayRegistryEntryId: input.gatewayRegistryEntryId,
    actionClass: input.actionClass,
    gatewayId: input.gatewayId,
    resourceRef: input.resourceRef,
    draftState: input.draftState,
    paramsDigest,
    nonSecretParamsSummary: input.nonSecretParamsSummary,
    invalidReasonCodes: input.invalidReasonCodes,
    evidenceRefs: input.evidenceRefs,
    finalizedAt: null,
    expiresAt: input.expiresAt,
  } satisfies JsonValue;
}

function toolCallDraftRecords(draft: ToolCallDraft): ProtocolRecord[] {
  return [{ objectType: "tool_call_draft", payload: draft }];
}

function toolCallDraftEvents(draft: ToolCallDraft, previousDraft: ToolCallDraft | null = null): EventDescriptor[] {
  return [
    {
      source: draft,
      eventType: "tool_call_draft_recorded",
      objectRefs: [draft.toolCallDraftId, draft.draftDigest, draft.paramsDigest],
      payload: {
        previousDraftState: previousDraft?.draftState ?? null,
        draftState: draft.draftState,
        actionClass: draft.actionClass,
        resourceRef: draft.resourceRef,
        generatedExecutionGraphId: draft.generatedExecutionGraphId,
        generatedExecutionNodeId: draft.generatedExecutionNodeId,
      },
    },
  ];
}

async function buildTransitionedToolCallDraft(
  current: ToolCallDraft,
  input: ParsedTransitionToolCallDraftInput,
): Promise<ToolCallDraft> {
  const parameters = input.parameters ?? current.parameters;
  const nonSecretParamsSummary = input.nonSecretParamsSummary ?? current.nonSecretParamsSummary;
  const secretRefs = input.secretRefs ?? current.secretRefs;
  const paramsDigest = await digestCanonical({ parameters, secretRefs });
  const finalizedAt =
    input.nextDraftState === "finalized" ? (input.finalizedAt ?? nowIso()) : (input.finalizedAt ?? current.finalizedAt);
  const next = ToolCallDraftSchema.parse({
    ...current,
    draftState: input.nextDraftState,
    parameters,
    nonSecretParamsSummary,
    secretRefs,
    paramsDigest,
    finalizedAt,
    expiresAt: input.expiresAt ?? current.expiresAt,
    invalidReasonCodes: input.invalidReasonCodes ?? current.invalidReasonCodes,
    evidenceRefs: [...new Set([...current.evidenceRefs, ...(input.evidenceRefs ?? [])])],
    draftDigest: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
  });
  const draftDigest = await digestCanonical({
    toolCallDraftId: next.toolCallDraftId,
    runtimeExecutionId: next.runtimeExecutionId,
    generatedExecutionGraphId: next.generatedExecutionGraphId,
    generatedExecutionNodeId: next.generatedExecutionNodeId,
    toolCapabilityId: next.toolCapabilityId,
    actionTypeId: next.actionTypeId,
    gatewayRegistryEntryId: next.gatewayRegistryEntryId,
    actionClass: next.actionClass,
    gatewayId: next.gatewayId,
    resourceRef: next.resourceRef,
    draftState: next.draftState,
    paramsDigest: next.paramsDigest,
    nonSecretParamsSummary: next.nonSecretParamsSummary,
    invalidReasonCodes: next.invalidReasonCodes,
    evidenceRefs: next.evidenceRefs,
    finalizedAt: next.finalizedAt,
    expiresAt: next.expiresAt,
  } satisfies JsonValue);
  return ToolCallDraftSchema.parse({ ...next, draftDigest });
}

function assertAllowedTransition(current: ToolCallDraft, input: ParsedTransitionToolCallDraftInput): void {
  if (["finalized", "invalid", "abandoned"].includes(current.draftState)) {
    throw new HandshakeProtocolError(
      "tool_call_draft_terminal_state",
      "Terminal tool-call drafts cannot transition to another state.",
      409,
    );
  }
  if (
    current.draftState === "opened" &&
    !["streaming", "finalized", "invalid", "abandoned"].includes(input.nextDraftState)
  ) {
    throw new HandshakeProtocolError(
      "tool_call_draft_transition_invalid",
      "Opened tool-call draft can only stream, finalize, invalidate, or abandon.",
      409,
    );
  }
  if (
    current.draftState === "streaming" &&
    !["streaming", "finalized", "invalid", "abandoned"].includes(input.nextDraftState)
  ) {
    throw new HandshakeProtocolError(
      "tool_call_draft_transition_invalid",
      "Streaming tool-call draft can only continue streaming, finalize, invalidate, or abandon.",
      409,
    );
  }
  if (input.nextDraftState === "finalized" && (!input.parameters || !input.nonSecretParamsSummary)) {
    throw new HandshakeProtocolError(
      "tool_call_draft_finalize_params_missing",
      "Finalized tool-call drafts must bind explicit parameters and non-secret parameter summary.",
      422,
    );
  }
  if (input.nextDraftState === "invalid" && (!input.invalidReasonCodes || input.invalidReasonCodes.length === 0)) {
    throw new HandshakeProtocolError(
      "tool_call_draft_invalid_reason_missing",
      "Invalid tool-call drafts must record at least one reason code.",
      422,
    );
  }
}
