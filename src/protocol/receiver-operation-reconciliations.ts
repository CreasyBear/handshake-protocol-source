import { HandshakeProtocolError } from "./errors";
import { actionLifecycleStreamRefs } from "./events";
import { createId, nowIso } from "./ids";
import { ReconcileReceiverOperationInputSchema, type ReconcileReceiverOperationInput } from "./inputs";
import { buildProofGap, resolveProofGaps } from "./proof-gaps";
import type { ProtocolRecorder } from "./records";
import {
  reconciliationFinalityFor,
  reconciliationStatusFor,
} from "./receiver-gate";
import {
  PROTOCOL_VERSION,
  ReceiverOperationReconciliationSchema,
  type ActionContract,
  type MutationAttempt,
  type ProofGap,
  type ProtocolRecord,
  type Receipt,
  type ReceiverOperationReconciliation,
} from "./schemas";
import { guardReceiverOperationReconciliation, type TransitionGuardResult } from "./transitions";
import type { ProtocolStore } from "../storage/store";

export type ReceiverOperationReconciliationResult = {
  reconciliation: ReceiverOperationReconciliation;
  resolvedProofGaps: ProofGap[];
  createdProofGap: ProofGap | null;
};

export async function reconcileReceiverOperation(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  inputValue: ReconcileReceiverOperationInput,
): Promise<ReceiverOperationReconciliationResult> {
  const input = ReconcileReceiverOperationInputSchema.parse(inputValue);
  if (input.observedDownstreamStatus === "unknown" && input.resolvedProofGapIds.length > 0) {
    throw new HandshakeProtocolError(
      "invalid_transition_unknown_reconciliation_cannot_resolve_proof_gap",
      "An unknown downstream reconciliation records a new proof gap; it cannot resolve existing proof gaps.",
      409,
    );
  }
  const mutationRecord = await recorder.requiredRecord<MutationAttempt>(
    "mutation_attempt",
    input.mutationAttemptId,
    "mutation_attempt_missing",
  );
  const contractRecord = await recorder.requiredRecord<ActionContract>(
    "action_contract",
    mutationRecord.payload.actionContractId,
    "contract_missing",
  );
  assertTransition(
    guardReceiverOperationReconciliation(mutationRecord.payload, {
      mutationAttemptId: input.mutationAttemptId,
      idempotencyKey: input.idempotencyKey,
      observedReceiverOperationRef: input.observedReceiverOperationRef,
    }),
  );

  const now = nowIso();
  const reconciliation = ReceiverOperationReconciliationSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: mutationRecord.payload.tenantId,
    organizationId: mutationRecord.payload.organizationId,
    createdAt: now,
    reconciliationId: createId("rec"),
    mutationAttemptId: mutationRecord.payload.mutationAttemptId,
    gateAttemptId: mutationRecord.payload.gateAttemptId,
    actionContractId: mutationRecord.payload.actionContractId,
    greenlightId: mutationRecord.payload.greenlightId,
    receiverId: mutationRecord.payload.receiverId,
    idempotencyKey: mutationRecord.payload.idempotencyKey,
    receiverOperationRef: input.observedReceiverOperationRef ?? mutationRecord.payload.receiverOperationRef,
    previousMutationOutcome: mutationRecord.payload.outcome,
    observedDownstreamStatus: input.observedDownstreamStatus,
    observedAt: now,
    evidenceRefs: input.evidenceRefs,
    resolvedProofGapIds: input.resolvedProofGapIds,
    reconciliationStatus: reconciliationStatusFor(input.observedDownstreamStatus),
    finalityStatus: reconciliationFinalityFor(input.observedDownstreamStatus),
  });

  const resolvedProofGaps = await resolveProofGaps(recorder, input.resolvedProofGapIds, reconciliation, now);
  const createdProofGap =
    input.observedDownstreamStatus === "unknown"
      ? buildProofGap(contractRecord.payload, "mutation", "downstream_finality", "downstream_status_unknown", {
          gateAttemptId: mutationRecord.payload.gateAttemptId,
          mutationAttemptId: mutationRecord.payload.mutationAttemptId,
          receiptId: await receiptIdForMutation(store, mutationRecord.payload),
        })
      : null;
  await recorder.commitRecordsWithEvents(
    [
      { objectType: "receiver_operation_reconciliation", payload: reconciliation },
      ...resolvedProofGaps.map((proofGap): ProtocolRecord => ({ objectType: "proof_gap", payload: proofGap })),
      ...(createdProofGap ? ([{ objectType: "proof_gap", payload: createdProofGap }] satisfies ProtocolRecord[]) : []),
    ],
    [
      {
        source: reconciliation,
        eventType: "receiver_operation_reconciled",
        objectRefs: [reconciliation.reconciliationId, reconciliation.mutationAttemptId, reconciliation.actionContractId],
        streamRefs: actionLifecycleStreamRefs(contractRecord.payload),
        payload: {
          observedDownstreamStatus: reconciliation.observedDownstreamStatus,
          reconciliationStatus: reconciliation.reconciliationStatus,
          finalityStatus: reconciliation.finalityStatus,
          resolvedProofGapIds: reconciliation.resolvedProofGapIds,
        },
      },
      ...(createdProofGap
        ? [
            {
              source: createdProofGap,
              eventType: "proof_gap_recorded" as const,
              objectRefs: [
                createdProofGap.proofGapId,
                reconciliation.mutationAttemptId,
                reconciliation.actionContractId,
              ],
              streamRefs: actionLifecycleStreamRefs(contractRecord.payload),
              payload: {
                reasonCode: createdProofGap.reasonCode,
                finalityImpact: createdProofGap.finalityImpact,
                reconciliationId: reconciliation.reconciliationId,
              },
            },
          ]
        : []),
    ],
  );
  return { reconciliation, resolvedProofGaps, createdProofGap };
}

async function receiptIdForMutation(store: ProtocolStore, mutationAttempt: MutationAttempt): Promise<string | null> {
  const receipts = await store.listRecordsByType<Receipt>("receipt", {
    tenantId: mutationAttempt.tenantId,
    organizationId: mutationAttempt.organizationId,
  });
  return (
    receipts.find((receipt) => receipt.payload.mutationAttemptId === mutationAttempt.mutationAttemptId)?.payload.receiptId ??
    null
  );
}

function assertTransition(result: TransitionGuardResult): void {
  if (!result.ok) {
    throw new HandshakeProtocolError(result.code, result.message, result.status);
  }
}
