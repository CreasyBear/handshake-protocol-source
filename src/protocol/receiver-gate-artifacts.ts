import { digestCanonical } from "./canonical";
import { receiptStreamReferencesForEvents, type ActionLifecycleStreamRefs, type EventDescriptor } from "./events";
import { createId } from "./ids";
import { ReceiverGateInputSchema } from "./inputs";
import { isolationSnapshotRef } from "./policy";
import { buildProofGap } from "./proof-gaps";
import {
  downstreamStatusFor,
  mutationOutcomeFor,
  receiptFinalityFor,
  receiverOperationRefFor,
  type ReceiverPolicyDriftCheck,
} from "./receiver-gate";
import {
  GreenlightSchema,
  MutationAttemptSchema,
  PROTOCOL_VERSION,
  ReceiptSchema,
  ReceiverGateAttemptSchema,
  type ActionContract,
  type ContractStreamEvent,
  type Greenlight,
  type IsolationState,
  type JsonValue,
  type MutationAttempt,
  type ProofGap,
  type ProtocolRecord,
  type Receipt,
  type ReceiverGateAttempt,
} from "./schemas";

export type ReceiverGateResult = {
  gateAttempt: ReceiverGateAttempt;
  mutationAttempt: MutationAttempt | null;
  receipt: Receipt;
  proofGap: ProofGap | null;
};

export type VerifiedReceiverGateCheck = {
  receiverGateStatus: "passed";
  gateAttemptId: string;
  mutationAttemptId: string;
  actionContractId: string;
  greenlightId: string;
  receiverId: string;
  actionClass: string;
  resourceRef: string;
  idempotencyKey: string;
  receiverOperationRef: string;
};

export type ReceiverGateArtifactInput = {
  input: ReturnType<typeof ReceiverGateInputSchema.parse>;
  contract: ActionContract;
  greenlight: Greenlight;
  gateAttemptId: string;
  refusal: string | null;
  now: string;
  observedParamsDigest: `sha256:${string}`;
  greenlightDigestSeen: `sha256:${string}`;
  isolationStates: IsolationState[];
  receiverPolicyDrift: ReceiverPolicyDriftCheck;
};

export function verifiedReceiverGateCheckFromResult(result: ReceiverGateResult): VerifiedReceiverGateCheck | null {
  if (result.gateAttempt.gateDecision !== "passed" || !result.mutationAttempt?.receiverOperationRef) return null;
  return {
    receiverGateStatus: result.gateAttempt.gateDecision,
    gateAttemptId: result.gateAttempt.gateAttemptId,
    mutationAttemptId: result.mutationAttempt.mutationAttemptId,
    actionContractId: result.mutationAttempt.actionContractId,
    greenlightId: result.mutationAttempt.greenlightId,
    receiverId: result.mutationAttempt.receiverId,
    actionClass: result.mutationAttempt.actionClass,
    resourceRef: result.mutationAttempt.resourceRef,
    idempotencyKey: result.mutationAttempt.idempotencyKey,
    receiverOperationRef: result.mutationAttempt.receiverOperationRef,
  };
}

export function buildGateArtifacts(input: ReceiverGateArtifactInput): {
  result: ReceiverGateResult;
} {
  const receiptId = createId("rcp");
  const mutationAttempt = input.refusal ? null : buildMutationAttempt(input);
  const proofGap = buildMutationProofGap(input, mutationAttempt, receiptId);
  const gateDecision = proofGap ? "proof_gap" : input.refusal ? "refused" : "passed";
  const reasonCode = proofGap ? "downstream_status_unknown" : input.refusal ?? "gate_passed";
  const gateAttempt = buildGateAttempt(input, gateDecision, reasonCode, mutationAttempt);
  const receipt = buildReceipt(input, receiptId, gateAttempt, mutationAttempt, proofGap);
  return { result: { gateAttempt, mutationAttempt, receipt, proofGap } };
}

export async function withReceiptStreamReferences(
  result: ReceiverGateResult,
  events: ContractStreamEvent[],
): Promise<ReceiverGateResult> {
  const receiptWithStreamRefs = {
    ...result.receipt,
    streamEventIds: events.map((event) => event.streamEventId),
    streamOffsets: receiptStreamReferencesForEvents(events),
  };
  const receiptDigest = await digestCanonical({
    ...receiptWithStreamRefs,
    receiptDigest: null,
    auditChainDigest: null,
  } satisfies JsonValue);
  const auditChainDigest = await digestCanonical({
    receiptDigest,
    streamOffsets: receiptWithStreamRefs.streamOffsets,
    proofGapIds: receiptWithStreamRefs.proofGapIds,
    finalityStatus: receiptWithStreamRefs.finalityStatus,
  } satisfies JsonValue);
  const receipt = ReceiptSchema.parse({ ...receiptWithStreamRefs, receiptDigest, auditChainDigest });
  return { ...result, receipt };
}

export function gateEventDescriptors(
  artifacts: { result: ReceiverGateResult },
  streamRefs: ActionLifecycleStreamRefs,
): EventDescriptor[] {
  const { gateAttempt, mutationAttempt, proofGap, receipt } = artifacts.result;
  const descriptors: EventDescriptor[] = [
    {
      source: gateAttempt,
      eventType: "receiver_gate_checked",
      objectRefs: [gateAttempt.gateAttemptId, streamRefs.actionContractId],
      streamRefs,
      payload: { gateDecision: gateAttempt.gateDecision, reasonCode: gateAttempt.gateDecisionReasonCode },
    },
  ];
  if (mutationAttempt) {
    descriptors.push({
      source: mutationAttempt,
      eventType: "mutation_attempted",
      objectRefs: [mutationAttempt.mutationAttemptId, streamRefs.actionContractId],
      streamRefs,
      payload: { outcome: mutationAttempt.outcome },
    });
  }
  if (proofGap) {
    descriptors.push({
      source: proofGap,
      eventType: "proof_gap_recorded",
      objectRefs: [proofGap.proofGapId, streamRefs.actionContractId],
      streamRefs,
      payload: { reasonCode: proofGap.reasonCode, finalityImpact: proofGap.finalityImpact },
    });
  }
  descriptors.push({
    source: receipt,
    eventType: "receipt_emitted",
    objectRefs: [receipt.receiptId, streamRefs.actionContractId],
    streamRefs,
    payload: { finalityStatus: receipt.finalityStatus, proofGapIds: receipt.proofGapIds },
  });
  return descriptors;
}

function buildMutationAttempt(input: ReceiverGateArtifactInput): MutationAttempt {
  return MutationAttemptSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: input.contract.tenantId,
    organizationId: input.contract.organizationId,
    createdAt: input.now,
    mutationAttemptId: createId("mut"),
    gateAttemptId: input.gateAttemptId,
    actionContractId: input.contract.actionContractId,
    greenlightId: input.greenlight.greenlightId,
    receiverId: input.contract.receiverId,
    actionClass: input.contract.actionClass,
    resourceRef: input.contract.resourceRef,
    idempotencyKey: input.contract.idempotencyKey,
    outcome: mutationOutcomeFor(input.input.downstreamMode),
    outcomeReasonCode: input.input.downstreamMode,
    receiverOperationRef: receiverOperationRefFor(input.input.downstreamMode, input.input.receiverOperationRef),
    startedAt: input.now,
    finishedAt: input.input.downstreamMode === "pending" ? null : input.now,
  });
}

function buildMutationProofGap(
  input: ReceiverGateArtifactInput,
  mutationAttempt: MutationAttempt | null,
  receiptId: string,
): ProofGap | null {
  if (mutationAttempt?.outcome !== "unknown") return null;
  return buildProofGap(input.contract, "mutation", "downstream_finality", "downstream_status_unknown", {
    gateAttemptId: input.gateAttemptId,
    mutationAttemptId: mutationAttempt.mutationAttemptId,
    receiptId,
  });
}

function buildGateAttempt(
  input: ReceiverGateArtifactInput,
  gateDecision: "passed" | "refused" | "proof_gap",
  reasonCode: string,
  mutationAttempt: MutationAttempt | null,
): ReceiverGateAttempt {
  return ReceiverGateAttemptSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: input.contract.tenantId,
    organizationId: input.contract.organizationId,
    createdAt: input.now,
    gateAttemptId: input.gateAttemptId,
    receiverId: input.contract.receiverId,
    receiverPolicyContractId: input.contract.receiverPolicyContractId,
    receiverPolicyVersion: input.contract.receiverPolicyVersion,
    pinnedReceiverPolicyVersion: input.contract.receiverPolicyVersion,
    currentReceiverPolicyVersion: input.receiverPolicyDrift.currentReceiverPolicyVersion,
    receiverPolicyDriftStatus: input.receiverPolicyDrift.status,
    actionContractId: input.contract.actionContractId,
    greenlightId: input.greenlight.greenlightId,
    contractDigestSeen: input.contract.actionContractDigest,
    greenlightDigestSeen: input.greenlightDigestSeen,
    paramsDigestSeen: input.observedParamsDigest,
    idempotencyKeySeen: input.contract.idempotencyKey,
    isolationSnapshotRef: isolationSnapshotRef(input.isolationStates),
    gateDecision,
    gateDecisionReasonCode: reasonCode,
    consumedGreenlight: !input.refusal,
    mutationAttemptId: mutationAttempt?.mutationAttemptId ?? null,
  });
}

function buildReceipt(
  input: ReceiverGateArtifactInput,
  receiptId: string,
  gateAttempt: ReceiverGateAttempt,
  mutationAttempt: MutationAttempt | null,
  proofGap: ProofGap | null,
): Receipt {
  return ReceiptSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: input.contract.tenantId,
    organizationId: input.contract.organizationId,
    createdAt: input.now,
    receiptId,
    actionContractId: input.contract.actionContractId,
    policyDecisionId: input.greenlight.policyDecisionId,
    greenlightId: input.greenlight.greenlightId,
    gateAttemptId: gateAttempt.gateAttemptId,
    mutationAttemptId: mutationAttempt?.mutationAttemptId ?? null,
    receiverId: input.contract.receiverId,
    policyDecisionStatus: "greenlight",
    receiverGateStatus: gateAttempt.gateDecision,
    greenlightConsumptionStatus: !input.refusal ? "consumed" : input.refusal === "already_consumed" ? "replayed" : "not_consumed",
    mutationAttemptStatus: mutationAttempt?.outcome ?? "not_attempted",
    downstreamExecutionStatus: downstreamStatusFor(input.input.downstreamMode, gateAttempt.gateDecision),
    proofGapIds: proofGap ? [proofGap.proofGapId] : [],
    evidenceRefs: input.contract.evidenceRefs,
    streamEventIds: [],
    streamOffsets: [],
    receiptDigest: null,
    auditChainDigest: null,
    finalityStatus: receiptFinalityFor(input.input.downstreamMode, gateAttempt.gateDecision, proofGap !== null),
    emittedAt: input.now,
  });
}

export function gateProtocolRecords(
  input: ReceiverGateArtifactInput,
  result: ReceiverGateResult,
): ProtocolRecord[] {
  const updatedGreenlight = input.refusal
    ? null
    : GreenlightSchema.parse({ ...input.greenlight, consumedAt: input.now, consumedByGateAttemptId: input.gateAttemptId });
  const records: ProtocolRecord[] = [
    { objectType: "receiver_gate_attempt", payload: result.gateAttempt },
    { objectType: "receipt", payload: result.receipt },
  ];
  if (updatedGreenlight) records.push({ objectType: "greenlight", payload: updatedGreenlight });
  if (result.mutationAttempt) records.push({ objectType: "mutation_attempt", payload: result.mutationAttempt });
  if (result.proofGap) records.push({ objectType: "proof_gap", payload: result.proofGap });
  return records;
}
