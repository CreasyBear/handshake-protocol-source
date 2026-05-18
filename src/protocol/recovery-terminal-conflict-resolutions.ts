import { HandshakeProtocolError } from "./errors";
import { actionLifecycleStreamRefs } from "./events";
import { nowIso } from "./ids";
import {
  ResolveRecoveryTerminalConflictInputSchema,
  type ResolveRecoveryTerminalConflictInput,
} from "./inputs";
import type { ProtocolRecorder } from "./records";
import {
  ProofGapSchema,
  type ActionContract,
  type ProofGap,
  type RecoveryRecommendation,
  type RecoveryRecommendationStatusTransition,
} from "./schemas";

export type RecoveryTerminalConflictResolution = {
  proofGap: ProofGap;
  statusTransition: RecoveryRecommendationStatusTransition;
  recoveryRecommendation: RecoveryRecommendation;
};

export async function resolveRecoveryTerminalConflictProofGap(
  recorder: ProtocolRecorder,
  inputValue: ResolveRecoveryTerminalConflictInput,
): Promise<RecoveryTerminalConflictResolution> {
  const input = ResolveRecoveryTerminalConflictInputSchema.parse(inputValue);
  const proofGapRecord = await recorder.requiredRecord<ProofGap>("proof_gap", input.proofGapId, "proof_gap_missing");
  const statusTransitionRecord = await recorder.requiredRecord<RecoveryRecommendationStatusTransition>(
    "recovery_recommendation_status_transition",
    input.recoveryRecommendationStatusTransitionId,
    "recovery_terminal_transition_missing",
  );
  const recoveryRecommendationRecord = await recorder.requiredRecord<RecoveryRecommendation>(
    "recovery_recommendation",
    statusTransitionRecord.payload.recoveryRecommendationId,
    "recovery_recommendation_missing",
  );
  const sourceContractRecord = await recorder.requiredRecord<ActionContract>(
    "action_contract",
    statusTransitionRecord.payload.sourceActionContractId,
    "recovery_source_contract_missing",
  );

  assertRecoveryTerminalConflictResolution(
    proofGapRecord.payload,
    statusTransitionRecord.payload,
    recoveryRecommendationRecord.payload,
  );

  const proofGap = ProofGapSchema.parse({
    ...proofGapRecord.payload,
    resolvedAt: nowIso(),
    resolvedByRef: statusTransitionRecord.payload.recoveryRecommendationStatusTransitionId,
  });

  await recorder.commitRecordsWithEvents(
    [{ objectType: "proof_gap", payload: proofGap }],
    [
      {
        source: proofGap,
        eventType: "proof_gap_resolved",
        objectRefs: [
          proofGap.proofGapId,
          statusTransitionRecord.payload.recoveryRecommendationStatusTransitionId,
          statusTransitionRecord.payload.recoveryRecommendationId,
          statusTransitionRecord.payload.sourceReceiptId,
          statusTransitionRecord.payload.sourceActionContractId,
        ],
        streamRefs: actionLifecycleStreamRefs(sourceContractRecord.payload),
        payload: {
          gapPhase: proofGap.gapPhase,
          reasonCode: proofGap.reasonCode,
          finalityImpact: proofGap.finalityImpact,
          recoveryRecommendationId: statusTransitionRecord.payload.recoveryRecommendationId,
          recoveryRecommendationStatusTransitionId:
            statusTransitionRecord.payload.recoveryRecommendationStatusTransitionId,
          nextStatus: statusTransitionRecord.payload.nextStatus,
          transitionDigest: statusTransitionRecord.payload.transitionDigest,
          resolvedByRef: proofGap.resolvedByRef,
          observedByRef: input.observedByRef,
        },
      },
    ],
  );

  return {
    proofGap,
    statusTransition: statusTransitionRecord.payload,
    recoveryRecommendation: recoveryRecommendationRecord.payload,
  };
}

function assertRecoveryTerminalConflictResolution(
  proofGap: ProofGap,
  statusTransition: RecoveryRecommendationStatusTransition,
  recoveryRecommendation: RecoveryRecommendation,
): void {
  if (proofGap.resolvedAt || proofGap.resolvedByRef) {
    throw new HandshakeProtocolError(
      "proof_gap_already_resolved",
      "Recovery terminal conflict proof gap is already resolved.",
      409,
    );
  }
  if (
    proofGap.gapPhase !== "recovery" ||
    proofGap.reasonCode !== "recovery_terminal_conflict" ||
    proofGap.expectedEvidenceType !== "single_recovery_terminal_claim"
  ) {
    throw new HandshakeProtocolError(
      "recovery_terminal_conflict_gap_mismatch",
      "Only recovery terminal conflict proof gaps can be resolved by a recovery terminal transition.",
      409,
    );
  }
  if (
    proofGap.tenantId !== statusTransition.tenantId ||
    proofGap.organizationId !== statusTransition.organizationId ||
    recoveryRecommendation.tenantId !== statusTransition.tenantId ||
    recoveryRecommendation.organizationId !== statusTransition.organizationId
  ) {
    throw new HandshakeProtocolError(
      "recovery_terminal_conflict_scope_mismatch",
      "Recovery terminal conflict proof gap, recommendation, and transition must share tenant and organization scope.",
      409,
    );
  }
  if (
    proofGap.missingOrInvalidEvidenceRef !==
    `recovery_terminal_claim:${statusTransition.recoveryRecommendationId}`
  ) {
    throw new HandshakeProtocolError(
      "recovery_terminal_conflict_claim_mismatch",
      "Recovery terminal conflict proof gap must name the same terminal claim as the winning transition.",
      409,
    );
  }
  if (
    proofGap.receiptId !== statusTransition.sourceReceiptId ||
    !proofGap.affectedObjectRefs.includes(statusTransition.recoveryRecommendationId) ||
    !proofGap.affectedObjectRefs.includes(statusTransition.sourceReceiptId) ||
    !proofGap.affectedObjectRefs.includes(statusTransition.sourceActionContractId)
  ) {
    throw new HandshakeProtocolError(
      "recovery_terminal_conflict_evidence_mismatch",
      "Recovery terminal conflict proof gap does not bind to the winning transition's source evidence.",
      409,
    );
  }
  if (
    recoveryRecommendation.recoveryRecommendationId !== statusTransition.recoveryRecommendationId ||
    recoveryRecommendation.sourceReceiptId !== statusTransition.sourceReceiptId ||
    recoveryRecommendation.sourceActionContractId !== statusTransition.sourceActionContractId ||
    recoveryRecommendation.recommendationDigest !== statusTransition.recommendationDigest ||
    recoveryRecommendation.recommendationStatus !== statusTransition.nextStatus ||
    recoveryRecommendation.statusChangedAt !== statusTransition.changedAt ||
    recoveryRecommendation.statusChangedByRef !== statusTransition.changedByRef ||
    recoveryRecommendation.supersededByActionContractId !== statusTransition.supersededByActionContractId
  ) {
    throw new HandshakeProtocolError(
      "recovery_terminal_transition_not_current",
      "Recovery terminal conflict proof gap can resolve only against the current terminal recommendation transition.",
      409,
    );
  }
}
