import type { ActionContract } from "../../action-contract";
import { actionLifecycleStreamRefs, type EventDescriptor } from "../../../events/chains";
import { createId, nowIso } from "../../../foundation/ids";
import { ProofGapSchema, type ProofGap } from "../../proof-gap";
import type { ProtocolRecord } from "../../object-registry";
import type { ProtocolRecorder } from "../../../events/records";
import { PROTOCOL_VERSION, type RecoveryRecommendation } from "../types";

export type RecordRecoveryTerminalConflictInput = {
  recommendation: RecoveryRecommendation;
  sourceContract: ActionContract;
  attemptedObjectRef: string;
  changedByRef: string;
};

type RecoveryTerminalConflictContext = {
  input: RecordRecoveryTerminalConflictInput;
  now: string;
  proofGapId: string;
};

export async function recordRecoveryTerminalConflictProofGap(
  recorder: ProtocolRecorder,
  input: RecordRecoveryTerminalConflictInput,
): Promise<ProofGap> {
  const context = buildRecoveryTerminalConflictContext(input);
  const proofGap = buildRecoveryTerminalConflictProofGap(context);
  await commitRecoveryTerminalConflictProofGap(recorder, context, proofGap);
  return proofGap;
}

function buildRecoveryTerminalConflictContext(
  input: RecordRecoveryTerminalConflictInput,
): RecoveryTerminalConflictContext {
  return {
    input,
    now: nowIso(),
    proofGapId: createId("gap"),
  };
}

function buildRecoveryTerminalConflictProofGap(context: RecoveryTerminalConflictContext): ProofGap {
  const { input, now, proofGapId } = context;
  return ProofGapSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: input.recommendation.tenantId,
    organizationId: input.recommendation.organizationId,
    createdAt: now,
    proofGapId,
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
}

async function commitRecoveryTerminalConflictProofGap(
  recorder: ProtocolRecorder,
  context: RecoveryTerminalConflictContext,
  proofGap: ProofGap,
): Promise<void> {
  await recorder.commitRecordsWithEvents(
    recoveryTerminalConflictProofGapRecords(proofGap),
    recoveryTerminalConflictProofGapEvents(context, proofGap),
  );
}

function recoveryTerminalConflictProofGapRecords(proofGap: ProofGap): ProtocolRecord[] {
  return [{ objectType: "proof_gap", payload: proofGap }];
}

function recoveryTerminalConflictProofGapEvents(
  context: RecoveryTerminalConflictContext,
  proofGap: ProofGap,
): EventDescriptor[] {
  const { input } = context;
  return [
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
  ];
}
