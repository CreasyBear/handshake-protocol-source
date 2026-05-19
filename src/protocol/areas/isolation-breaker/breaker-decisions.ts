import { digestCanonical } from "../../foundation/canonical";
import type { EventDescriptor } from "../../events/chains";
import { HandshakeProtocolError } from "../../foundation/errors";
import { createId, nowIso } from "../../foundation/ids";
import { CreateBreakerDecisionInputSchema, type CreateBreakerDecisionInput } from "./types";
import type { ProtocolRecorder } from "../../events/records";
import type { ProtocolRecord } from "../object-registry";
import {
  BreakerDecisionSchema,
  IsolationStateSchema,
  PROTOCOL_VERSION,
  type BreakerDecision,
  type BreakerIsolationDecision,
  type IsolationState,
  type JsonValue,
  type StreamWatermark,
} from "./types";
import type { ProtocolStore } from "../../store/port";

export type BreakerDecisionResult = {
  breakerDecision: BreakerDecision;
  isolationState: IsolationState;
};

type ParsedCreateBreakerDecisionInput = ReturnType<typeof CreateBreakerDecisionInputSchema.parse>;

type BreakerDecisionContext = {
  input: ParsedCreateBreakerDecisionInput;
  breakerDecisionId: string;
  isolationStateId: string;
  observedWindowDigest: string;
  now: string;
};

export async function createBreakerDecision(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  inputValue: CreateBreakerDecisionInput,
): Promise<BreakerDecisionResult> {
  const input = CreateBreakerDecisionInputSchema.parse(inputValue);
  const context = await getBreakerDecisionContext(store, input);
  const result = buildBreakerDecisionResult(context);
  await commitBreakerDecision(recorder, result);
  return result;
}

async function getBreakerDecisionContext(
  store: ProtocolStore,
  input: ParsedCreateBreakerDecisionInput,
): Promise<BreakerDecisionContext> {
  await assertObservedWatermarks(store, input.observedStreamOffsets);
  const observedWindowDigest = await digestCanonical({
    observedStreamOffsets: input.observedStreamOffsets,
    supportingEventRefs: input.supportingEventRefs,
    missingEventRefs: input.missingEventRefs,
    proofGapRefs: input.proofGapRefs,
  } satisfies JsonValue);
  return {
    input,
    breakerDecisionId: createId("brk"),
    isolationStateId: createId("iso"),
    observedWindowDigest,
    now: nowIso(),
  };
}

function buildBreakerDecisionResult(context: BreakerDecisionContext): BreakerDecisionResult {
  const { input, breakerDecisionId, isolationStateId, observedWindowDigest, now } = context;
  const breakerDecision = BreakerDecisionSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    createdAt: now,
    breakerDecisionId,
    listenerId: input.listenerId,
    listenerVersion: input.listenerVersion,
    rulePackRef: input.rulePackRef,
    rulePackVersion: input.rulePackVersion,
    observedStreamOffsets: input.observedStreamOffsets,
    observedWindowDigest,
    decision: input.decision,
    decisionReasonCode: input.decisionReasonCode,
    decisionReason: input.decisionReason,
    targetScopeType: input.targetScopeType,
    targetScopeId: input.targetScopeId,
    createdIsolationStateId: isolationStateId,
    agentId: input.agentId,
    runId: input.runId,
    gatewayId: input.gatewayId,
    resourceRef: input.resourceRef,
    actionClass: input.actionClass,
    sequenceRiskScore: sequenceRiskScoreFor(input.decision),
    matchedBreakerRuleIds: input.matchedBreakerRuleIds,
    supportingEventRefs: input.supportingEventRefs,
    missingEventRefs: input.missingEventRefs,
    proofGapRefs: input.proofGapRefs,
    decisionEffectiveAt: now,
    decisionExpiresAt: input.decisionExpiresAt,
    watermarkAtDecision: now,
  });

  const isolationState = IsolationStateSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    createdAt: now,
    isolationStateId,
    scopeType: input.targetScopeType,
    scopeId: input.targetScopeId,
    state: input.decision,
    reasonCode: input.decisionReasonCode,
    reasonSummary: input.decisionReason,
    sourceDecisionRef: breakerDecisionId,
    effectiveAt: now,
    expiresAt: input.decisionExpiresAt,
    clearedAt: null,
    observedStreamOffsets: input.observedStreamOffsets,
    version: 1,
  });
  return { breakerDecision, isolationState };
}

async function commitBreakerDecision(recorder: ProtocolRecorder, result: BreakerDecisionResult): Promise<void> {
  await recorder.commitRecordsWithEvents(breakerDecisionRecords(result), breakerDecisionEvents(result));
}

function breakerDecisionRecords(result: BreakerDecisionResult): ProtocolRecord[] {
  return [
    { objectType: "breaker_decision", payload: result.breakerDecision },
    { objectType: "isolation_state", payload: result.isolationState },
  ];
}

function breakerDecisionEvents(result: BreakerDecisionResult): EventDescriptor[] {
  const { breakerDecision, isolationState } = result;
  return [
    {
      source: breakerDecision,
      eventType: "breaker_decision_recorded",
      objectRefs: [breakerDecision.breakerDecisionId, isolationState.isolationStateId],
      payload: {
        decision: breakerDecision.decision,
        decisionReasonCode: breakerDecision.decisionReasonCode,
        targetScopeType: breakerDecision.targetScopeType,
        targetScopeId: breakerDecision.targetScopeId,
        observedWindowDigest: breakerDecision.observedWindowDigest,
      },
    },
    {
      source: isolationState,
      eventType: "isolation_changed",
      objectRefs: [isolationState.isolationStateId, isolationState.scopeType, isolationState.scopeId],
      payload: {
        state: isolationState.state,
        reasonCode: isolationState.reasonCode,
        sourceDecisionRef: isolationState.sourceDecisionRef,
        observedStreamOffsets: isolationState.observedStreamOffsets,
      },
    },
  ];
}

function sequenceRiskScoreFor(decision: BreakerIsolationDecision): number {
  if (decision === "halted" || decision === "revoked") return 1;
  if (decision === "quarantined") return 0.8;
  if (decision === "state_suspect") return 0.6;
  if (decision === "review_only") return 0.4;
  return 0.35;
}

async function assertObservedWatermarks(store: ProtocolStore, watermarks: StreamWatermark[]): Promise<void> {
  for (const watermark of watermarks) {
    if (!watermark.observedEventDigest) {
      throw new HandshakeProtocolError(
        "breaker_watermark_digest_missing",
        "Breaker decision watermarks must bind to a durable stream event digest.",
        409,
      );
    }
    const event = await store.getStreamEvent(watermark.streamId, watermark.partitionKey, watermark.observedOffsetEnd);
    if (!event) {
      throw new HandshakeProtocolError(
        "breaker_watermark_event_missing",
        `No durable stream event exists for ${watermark.streamId}/${watermark.partitionKey} at offset ${watermark.observedOffsetEnd}.`,
        404,
      );
    }
    if (event.eventDigest !== watermark.observedEventDigest) {
      throw new HandshakeProtocolError(
        "breaker_watermark_digest_mismatch",
        "Breaker decision observedEventDigest does not match the durable stream event at observedOffsetEnd.",
        409,
      );
    }
  }
}
