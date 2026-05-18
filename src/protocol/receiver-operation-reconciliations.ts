import { HandshakeProtocolError } from "./errors";
import { actionLifecycleStreamRefs } from "./events";
import { createId, nowIso } from "./ids";
import { ReconcileReceiverOperationInputSchema, type ReconcileReceiverOperationInput } from "./inputs";
import { resolveProofGaps } from "./proof-gaps";
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
  type ReceiverOperationReconciliation,
} from "./schemas";
import { guardReceiverOperationReconciliation, type TransitionGuardResult } from "./transitions";

export async function reconcileReceiverOperation(
  recorder: ProtocolRecorder,
  inputValue: ReconcileReceiverOperationInput,
): Promise<{
  reconciliation: ReceiverOperationReconciliation;
  resolvedProofGaps: ProofGap[];
}> {
  const input = ReconcileReceiverOperationInputSchema.parse(inputValue);
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
  await recorder.commitRecordsWithEvents(
    [
      { objectType: "receiver_operation_reconciliation", payload: reconciliation },
      ...resolvedProofGaps.map((proofGap): ProtocolRecord => ({ objectType: "proof_gap", payload: proofGap })),
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
    ],
  );
  return { reconciliation, resolvedProofGaps };
}

function assertTransition(result: TransitionGuardResult): void {
  if (!result.ok) {
    throw new HandshakeProtocolError(result.code, result.message, result.status);
  }
}
