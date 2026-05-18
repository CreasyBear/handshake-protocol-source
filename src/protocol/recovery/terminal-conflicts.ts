import type { ActionContract } from "../action-contract";
import { actionLifecycleStreamRefs } from "../events";
import { createId, nowIso } from "../ids";
import { ProofGapSchema, type ProofGap } from "../proof-gap";
import type { ProtocolRecorder } from "../records";
import {
  PROTOCOL_VERSION,
  type RecoveryRecommendation,
} from "./types";

export type RecordRecoveryTerminalConflictInput = {
  recommendation: RecoveryRecommendation;
  sourceContract: ActionContract;
  attemptedObjectRef: string;
  changedByRef: string;
};

export async function recordRecoveryTerminalConflictProofGap(
  recorder: ProtocolRecorder,
  input: RecordRecoveryTerminalConflictInput,
): Promise<ProofGap> {
  const now = nowIso();
  const proofGap = ProofGapSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: input.recommendation.tenantId,
    organizationId: input.recommendation.organizationId,
    createdAt: now,
    proofGapId: createId("gap"),
    gapPhase: "recovery",
    expectedEvidenceType: "single_recovery_terminal_claim",
    missingOrInvalidEvidenceRef: `recovery_terminal_claim:${input.recommendation.recoveryRecommendationId}`,
    affectedObjectRefs: [
      input.recommendation.recoveryRecommendationId,
      input.recommendation.sourceReceiptId,
      input.recommendation.sourceActionContractId,
      input.attemptedObjectRef,
    ],
    gateAttemptId: null,
    mutationAttemptId: null,
    receiptId: input.recommendation.sourceReceiptId,
    reasonCode: "recovery_terminal_conflict",
    finalityImpact: "none",
    recoveryRequirement: "Load the terminal recovery transition before proposing another follow-up action contract.",
    resolvedAt: null,
    resolvedByRef: null,
  });

  await recorder.commitRecordsWithEvents(
    [{ objectType: "proof_gap", payload: proofGap }],
    [
      {
        source: proofGap,
        eventType: "proof_gap_recorded",
        objectRefs: [
          proofGap.proofGapId,
          input.recommendation.recoveryRecommendationId,
          input.recommendation.sourceReceiptId,
          input.attemptedObjectRef,
        ],
        streamRefs: actionLifecycleStreamRefs(input.sourceContract),
        payload: {
          reasonCode: proofGap.reasonCode,
          finalityImpact: proofGap.finalityImpact,
          recoveryRecommendationId: input.recommendation.recoveryRecommendationId,
          attemptedObjectRef: input.attemptedObjectRef,
          changedByRef: input.changedByRef,
        },
      },
    ],
  );
  return proofGap;
}
