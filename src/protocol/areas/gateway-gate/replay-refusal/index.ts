import { digestCanonical } from "../../../foundation/canonical";
import type { ActionContract } from "../../action-contract";
import { actionLifecycleStreamRefs, buildEventChain } from "../../../events/chains";
import { HandshakeProtocolError } from "../../../foundation/errors";
import { createId, nowIso } from "../../../foundation/ids";
import { isolationSnapshotRef } from "../../policy-greenlight";
import type { Greenlight } from "../../policy-greenlight";
import type { IsolationState } from "../../isolation-breaker";
import { buildRefusal, protocolObjectRef } from "../../refusal";
import { gateEventDescriptors, withReceiptStreamReferences, type GatewayCheckResult } from "../artifacts";
import type { ProtocolRecorder } from "../../../events/records";
import type { GatewayPolicyDriftCheck } from "../gateway-policy";
import type { ProtectedPathPosture } from "../../protected-path-posture";
import {
  deriveDownstreamOutcomeStatus,
  deriveGatewayAdmissionStatus,
  ReceiptSchema,
  type Receipt,
} from "../../receipt-export";
import { PROTOCOL_VERSION, GatewayCheckAttemptSchema, type GatewayCheckAttempt, type JsonValue } from "../types";
import type { ProtocolStore, StoredProtocolRecord } from "../../../store/port";

const MAX_STREAM_COMMIT_RETRIES = 3;

export async function commitReplayRefusal(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  contract: ActionContract,
  greenlight: Greenlight,
  context: {
    observedParamsDigest: `sha256:${string}`;
    isolationStates: IsolationState[];
    gatewayPolicyDrift: GatewayPolicyDriftCheck;
    protectedPathPosture?: StoredProtocolRecord<ProtectedPathPosture> | null;
    refusalReasonCode?: string;
    greenlightConsumptionStatus?: Receipt["greenlightConsumptionStatus"];
  },
): Promise<GatewayCheckResult> {
  const now = nowIso();
  const greenlightDigestSeen = await digestCanonical(greenlight as unknown as JsonValue);
  const gateAttempt = buildReplayGateAttempt(contract, greenlight, context, greenlightDigestSeen, now);
  const refusal = await buildRefusal({
    tenantId: contract.tenantId,
    organizationId: contract.organizationId,
    createdAt: now,
    phase: "gateway",
    actionContractId: contract.actionContractId,
    policyDecisionId: greenlight.policyDecisionId,
    greenlightId: greenlight.greenlightId,
    gateAttemptId: gateAttempt.gateAttemptId,
    refusedObjectRef: protocolObjectRef("gateway_check_attempt", gateAttempt.gateAttemptId),
    reasonCode: gateAttempt.gateDecisionReasonCode,
    reason: `Gateway refused before mutation with reason code ${gateAttempt.gateDecisionReasonCode}.`,
    evidenceRefs: [
      protocolObjectRef("action_contract", contract.actionContractId),
      protocolObjectRef("greenlight", greenlight.greenlightId),
      protocolObjectRef("gateway_check_attempt", gateAttempt.gateAttemptId),
    ],
    refusedAt: now,
  });
  const receipt = buildReplayReceipt(
    contract,
    greenlight,
    gateAttempt,
    now,
    context.greenlightConsumptionStatus ?? "replayed",
  );
  const eventDescriptors = gateEventDescriptors(
    { result: { gateAttempt, mutationAttempt: null, receipt, proofGap: null }, refusal },
    actionLifecycleStreamRefs(contract),
  );
  const requestContextRecord = await recorder.transitionRequestContextRecordFor({
    tenantId: contract.tenantId,
    organizationId: contract.organizationId,
  });
  const eventDescriptorsWithContext = recorder.withTransitionRequestContextEventDescriptors(
    eventDescriptors,
    requestContextRecord,
  );
  for (let attempt = 0; attempt <= MAX_STREAM_COMMIT_RETRIES; attempt += 1) {
    const events = await buildEventChain(store, eventDescriptorsWithContext);
    const finalizedResult = await withReceiptStreamReferences(
      { gateAttempt, mutationAttempt: null, receipt, proofGap: null },
      events,
    );
    const records = await Promise.all(
      [
        ...(requestContextRecord ? [requestContextRecord] : []),
        { objectType: "gateway_check_attempt" as const, payload: finalizedResult.gateAttempt },
        { objectType: "refusal" as const, payload: refusal },
        { objectType: "receipt" as const, payload: finalizedResult.receipt },
      ].map((record) => recorder.buildRecord(record)),
    );
    const commitResult = await store.commitGatewayCheck({ consumption: null, records, events });
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
    gatewayPolicyDrift: GatewayPolicyDriftCheck;
    protectedPathPosture?: StoredProtocolRecord<ProtectedPathPosture> | null;
    refusalReasonCode?: string;
  },
  greenlightDigestSeen: `sha256:${string}`,
  now: string,
): GatewayCheckAttempt {
  return GatewayCheckAttemptSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: contract.tenantId,
    organizationId: contract.organizationId,
    createdAt: now,
    gateAttemptId: createId("gat"),
    gatewayId: contract.gatewayId,
    gatewayPolicyContractId: contract.gatewayPolicyContractId,
    gatewayPolicyVersion: contract.gatewayPolicyVersion,
    pinnedGatewayPolicyVersion: contract.gatewayPolicyVersion,
    currentGatewayPolicyVersion: context.gatewayPolicyDrift.currentGatewayPolicyVersion,
    gatewayPolicyDriftStatus: context.gatewayPolicyDrift.status,
    actionContractId: contract.actionContractId,
    greenlightId: greenlight.greenlightId,
    contractDigestSeen: contract.actionContractDigest,
    greenlightDigestSeen,
    paramsDigestSeen: context.observedParamsDigest,
    idempotencyKeySeen: contract.idempotencyKey,
    isolationSnapshotRef: isolationSnapshotRef(context.isolationStates),
    protectedPathPostureIdSeen: context.protectedPathPosture?.payload.protectedPathPostureId ?? null,
    protectedPathPostureDigestSeen: context.protectedPathPosture?.payload.postureDigest ?? null,
    protectedPathPostureStateSeen: context.protectedPathPosture?.payload.postureState ?? null,
    gateDecision: "refused",
    gateDecisionReasonCode: context.refusalReasonCode ?? "already_consumed",
    consumedGreenlight: false,
    mutationAttemptId: null,
  });
}

function buildReplayReceipt(
  contract: ActionContract,
  greenlight: Greenlight,
  gateAttempt: GatewayCheckAttempt,
  now: string,
  greenlightConsumptionStatus: Receipt["greenlightConsumptionStatus"],
): Receipt {
  const receiptSeed = {
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
    gatewayId: contract.gatewayId,
    policyDecisionStatus: "greenlight",
    gatewayCheckStatus: "refused",
    greenlightConsumptionStatus,
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
  } satisfies Omit<Receipt, "gatewayAdmissionStatus" | "downstreamOutcomeStatus">;
  return ReceiptSchema.parse({
    ...receiptSeed,
    gatewayAdmissionStatus: deriveGatewayAdmissionStatus(receiptSeed),
    downstreamOutcomeStatus: deriveDownstreamOutcomeStatus(receiptSeed),
  });
}
