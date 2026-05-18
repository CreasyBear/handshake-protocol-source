import { digestCanonical } from "./canonical";
import { actionLifecycleStreamRefs, buildEventChain } from "./events";
import { HandshakeProtocolError } from "./errors";
import { createId, nowIso } from "./ids";
import { ReceiverGateInputSchema, type ReceiverGateInput } from "./inputs";
import { isolationSnapshotRef } from "./policy";
import {
  buildGateArtifacts,
  gateEventDescriptors,
  gateProtocolRecords,
  withReceiptStreamReferences,
  type ReceiverGateResult,
} from "./receiver-gate-artifacts";
import type { ProtocolRecorder } from "./records";
import {
  checkReceiverPolicyDrift,
  gateRefusalReason,
  type ReceiverPolicyDriftCheck,
} from "./receiver-gate";
import {
  PROTOCOL_VERSION,
  ReceiptSchema,
  ReceiverGateAttemptSchema,
  type ActionContract,
  type Greenlight,
  type IsolationState,
  type JsonValue,
  type PolicyDecision,
  type Receipt,
  type ReceiverGateAttempt,
  type ReceiverRegistryEntry,
} from "./schemas";
import {
  loadReceiverGateSequenceDependencyStates,
  receiverGateSequenceDependencyRefusalReason,
} from "./sequence-dependencies";
import type { ProtocolStore } from "../storage/store";
import { scopeIdsForContract, scopeIdsForGreenlight } from "../storage/store";
import { guardReceiverGateAuthority, type TransitionGuardResult } from "./transitions";

const MAX_STREAM_COMMIT_RETRIES = 3;

export type { ReceiverGateResult } from "./receiver-gate-artifacts";

export async function receiverGate(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  inputValue: ReceiverGateInput,
): Promise<ReceiverGateResult> {
  const input = ReceiverGateInputSchema.parse(inputValue);
  const contract = await recorder.requiredRecord<ActionContract>("action_contract", input.actionContractId, "contract_missing");
  const greenlight = await recorder.requiredRecord<Greenlight>("greenlight", input.greenlightId, "greenlight_missing");
  const policyDecision = await recorder.requiredRecord<PolicyDecision>(
    "policy_decision",
    greenlight.payload.policyDecisionId,
    "policy_decision_missing",
  );
  assertTransition(guardReceiverGateAuthority(greenlight.payload, policyDecision.payload));

  const now = nowIso();
  const receiverPolicyDrift = await currentReceiverPolicyDrift(store, contract.payload, greenlight.payload);
  const observedParamsDigest = await digestCanonical(input.observedParameters);
  const greenlightDigestSeen = await digestCanonical(greenlight.payload as unknown as JsonValue);
  const isolationStates = await store.listIsolationStates([
    ...scopeIdsForContract(contract.payload),
    ...scopeIdsForGreenlight(greenlight.payload),
  ]);
  const sequenceDependencyStates = await loadReceiverGateSequenceDependencyStates(store, contract.payload);
  const sequenceDependencyReasonCode = receiverGateSequenceDependencyRefusalReason(sequenceDependencyStates);
  const gateAttemptId = createId("gat");
  const refusal = gateRefusalReason(
    contract.payload,
    greenlight.payload,
    observedParamsDigest,
    isolationStates,
    now,
    receiverPolicyDrift.reasonCode,
    sequenceDependencyReasonCode,
  );
  const artifacts = buildGateArtifacts({
    input,
    contract: contract.payload,
    greenlight: greenlight.payload,
    gateAttemptId,
    refusal,
    now,
    observedParamsDigest,
    greenlightDigestSeen,
    isolationStates,
    receiverPolicyDrift,
  });
  const streamRefs = actionLifecycleStreamRefs(contract.payload);
  const events = gateEventDescriptors(artifacts, streamRefs);
  const consumption = refusal
    ? null
    : {
        greenlightId: greenlight.payload.greenlightId,
        gateAttemptId,
        actionContractId: contract.payload.actionContractId,
        idempotencyKey: contract.payload.idempotencyKey,
        consumedAt: now,
      };

  for (let attempt = 0; attempt <= MAX_STREAM_COMMIT_RETRIES; attempt += 1) {
    const streamEvents = await buildEventChain(store, events);
    const finalizedResult = await withReceiptStreamReferences(artifacts.result, streamEvents);
    const records = await Promise.all(
      gateProtocolRecords(
        {
          input,
          contract: contract.payload,
          greenlight: greenlight.payload,
          gateAttemptId,
          refusal,
          now,
          observedParamsDigest,
          greenlightDigestSeen,
          isolationStates,
          receiverPolicyDrift,
        },
        finalizedResult,
      ).map((record) => recorder.buildRecord(record)),
    );
    const commitResult = await store.commitReceiverGate({ consumption, records, events: streamEvents });
    if (commitResult === "committed") return finalizedResult;
    if (commitResult === "already_consumed") {
      return commitReplayRefusal(store, recorder, contract.payload, greenlight.payload, {
        observedParamsDigest,
        isolationStates,
        receiverPolicyDrift,
      });
    }
  }
  throw new HandshakeProtocolError(
    "stream_append_conflict",
    "Receiver gate could not commit a contiguous contract stream after retrying fresh stream tails.",
    409,
  );
}

async function currentReceiverPolicyDrift(
  store: ProtocolStore,
  contract: ActionContract,
  greenlight: Greenlight,
): Promise<ReceiverPolicyDriftCheck> {
  const currentReceiverRecord = await store.getRecord<ReceiverRegistryEntry>(
    "receiver_registry_entry",
    contract.receiverRegistryEntryId,
  );
  return checkReceiverPolicyDrift(contract, greenlight, currentReceiverRecord?.payload ?? null);
}

async function commitReplayRefusal(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  contract: ActionContract,
  greenlight: Greenlight,
  context: {
    observedParamsDigest: `sha256:${string}`;
    isolationStates: IsolationState[];
    receiverPolicyDrift: ReceiverPolicyDriftCheck;
  },
): Promise<ReceiverGateResult> {
  const now = nowIso();
  const greenlightDigestSeen = await digestCanonical(greenlight as unknown as JsonValue);
  const gateAttempt = buildReplayGateAttempt(contract, greenlight, context, greenlightDigestSeen, now);
  const receipt = buildReplayReceipt(contract, greenlight, gateAttempt, now);
  const eventDescriptors = gateEventDescriptors(
    { result: { gateAttempt, mutationAttempt: null, receipt, proofGap: null } },
    actionLifecycleStreamRefs(contract),
  );
  for (let attempt = 0; attempt <= MAX_STREAM_COMMIT_RETRIES; attempt += 1) {
    const events = await buildEventChain(store, eventDescriptors);
    const finalizedResult = await withReceiptStreamReferences(
      { gateAttempt, mutationAttempt: null, receipt, proofGap: null },
      events,
    );
    const records = await Promise.all(
      [
        { objectType: "receiver_gate_attempt" as const, payload: finalizedResult.gateAttempt },
        { objectType: "receipt" as const, payload: finalizedResult.receipt },
      ].map((record) => recorder.buildRecord(record)),
    );
    const commitResult = await store.commitReceiverGate({ consumption: null, records, events });
    if (commitResult === "committed" || commitResult === "already_consumed") {
      return finalizedResult;
    }
  }
  throw new HandshakeProtocolError(
    "stream_append_conflict",
    "Replay refusal could not commit a contiguous contract stream after retrying fresh stream tails.",
    409,
  );
}

function buildReplayGateAttempt(
  contract: ActionContract,
  greenlight: Greenlight,
  context: {
    observedParamsDigest: `sha256:${string}`;
    isolationStates: IsolationState[];
    receiverPolicyDrift: ReceiverPolicyDriftCheck;
  },
  greenlightDigestSeen: `sha256:${string}`,
  now: string,
): ReceiverGateAttempt {
  return ReceiverGateAttemptSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: contract.tenantId,
    organizationId: contract.organizationId,
    createdAt: now,
    gateAttemptId: createId("gat"),
    receiverId: contract.receiverId,
    receiverPolicyContractId: contract.receiverPolicyContractId,
    receiverPolicyVersion: contract.receiverPolicyVersion,
    pinnedReceiverPolicyVersion: contract.receiverPolicyVersion,
    currentReceiverPolicyVersion: context.receiverPolicyDrift.currentReceiverPolicyVersion,
    receiverPolicyDriftStatus: context.receiverPolicyDrift.status,
    actionContractId: contract.actionContractId,
    greenlightId: greenlight.greenlightId,
    contractDigestSeen: contract.actionContractDigest,
    greenlightDigestSeen,
    paramsDigestSeen: context.observedParamsDigest,
    idempotencyKeySeen: contract.idempotencyKey,
    isolationSnapshotRef: isolationSnapshotRef(context.isolationStates),
    gateDecision: "refused",
    gateDecisionReasonCode: "already_consumed",
    consumedGreenlight: false,
    mutationAttemptId: null,
  });
}

function buildReplayReceipt(
  contract: ActionContract,
  greenlight: Greenlight,
  gateAttempt: ReceiverGateAttempt,
  now: string,
): Receipt {
  return ReceiptSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: contract.tenantId,
    organizationId: contract.organizationId,
    createdAt: now,
    receiptId: createId("rcp"),
    actionContractId: contract.actionContractId,
    policyDecisionId: greenlight.policyDecisionId,
    greenlightId: greenlight.greenlightId,
    gateAttemptId: gateAttempt.gateAttemptId,
    mutationAttemptId: null,
    receiverId: contract.receiverId,
    policyDecisionStatus: "greenlight",
    receiverGateStatus: "refused",
    greenlightConsumptionStatus: "replayed",
    mutationAttemptStatus: "not_attempted",
    downstreamExecutionStatus: "not_started",
    proofGapIds: [],
    evidenceRefs: contract.evidenceRefs,
    streamEventIds: [],
    streamOffsets: [],
    receiptDigest: null,
    auditChainDigest: null,
    finalityStatus: "suspect",
    emittedAt: now,
  });
}

function assertTransition(result: TransitionGuardResult): void {
  if (!result.ok) {
    throw new HandshakeProtocolError(result.code, result.message, result.status);
  }
}
