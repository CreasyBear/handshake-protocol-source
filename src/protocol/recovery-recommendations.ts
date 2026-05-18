import { digestCanonical } from "./canonical";
import { HandshakeProtocolError } from "./errors";
import { actionLifecycleStreamRefs } from "./events";
import { createId, nowIso } from "./ids";
import { CreateRecoveryRecommendationInputSchema, type CreateRecoveryRecommendationInput } from "./inputs";
import type { ProtocolRecorder } from "./records";
import {
  PROTOCOL_VERSION,
  RecoveryRecommendationSchema,
  type ActionContract,
  type JsonValue,
  type ProofGap,
  type Receipt,
  type RecoveryRecommendation,
  type RecoveryRecommendedPath,
} from "./schemas";

type DigestedReceipt = Receipt & {
  receiptDigest: string;
  auditChainDigest: string;
};

export async function createRecoveryRecommendation(
  recorder: ProtocolRecorder,
  inputValue: CreateRecoveryRecommendationInput,
): Promise<RecoveryRecommendation> {
  const input = CreateRecoveryRecommendationInputSchema.parse(inputValue);
  const receiptRecord = await recorder.requiredRecord<Receipt>("receipt", input.sourceReceiptId, "receipt_missing");
  const receipt = receiptRecord.payload;
  assertRecoverableReceipt(receipt);
  assertReceiptDigestMaterial(receipt);
  await assertReceiptDigests(receipt);

  const contractRecord = await recorder.requiredRecord<ActionContract>(
    "action_contract",
    receipt.actionContractId,
    "contract_missing",
  );
  const proofGaps = await loadProofGaps(recorder, receipt.proofGapIds);
  const sourceRefusalOrGapRef = input.sourceRefusalOrGapRef ?? defaultSourceRefusalOrGapRef(receipt);
  assertSourceRefBelongsToReceipt(receipt, sourceRefusalOrGapRef);
  assertRecommendationScope(input.recommendedPath, input.allowedNextActionClasses);

  const now = nowIso();
  const recoveryRecommendationId = createId("rec");
  const contract = contractRecord.payload;
  const recommendationBinding = {
    recoveryRecommendationId,
    sourceReceiptId: receipt.receiptId,
    sourceRefusalOrGapRef,
    sourceActionContractId: receipt.actionContractId,
    sourceReceiptDigest: receipt.receiptDigest,
    sourceAuditChainDigest: receipt.auditChainDigest,
    recommendedPath: input.recommendedPath,
    allowedNextActionClasses: input.allowedNextActionClasses,
    requiredNewEvidence: input.requiredNewEvidence,
    requiresHumanReview: input.requiresHumanReview,
    mustCreateNewActionContract: true,
    mayReuseGreenlight: false,
    mayMutateProtectedSurface: false,
    recommendedAt: now,
  } satisfies JsonValue;
  const recommendationDigest = await digestCanonical(recommendationBinding);
  const recommendation = RecoveryRecommendationSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: receipt.tenantId,
    organizationId: receipt.organizationId,
    createdAt: now,
    recoveryRecommendationId,
    sourceReceiptId: receipt.receiptId,
    sourceActionContractId: receipt.actionContractId,
    sourcePolicyDecisionId: receipt.policyDecisionId,
    sourceGreenlightId: receipt.greenlightId,
    sourceGateAttemptId: receipt.gateAttemptId,
    sourceMutationAttemptId: receipt.mutationAttemptId,
    sourceRefusalOrGapRef,
    sourceFinalityStatus: receipt.finalityStatus,
    sourceGatewayCheckStatus: receipt.gatewayCheckStatus,
    sourceMutationAttemptStatus: receipt.mutationAttemptStatus,
    sourceDownstreamExecutionStatus: receipt.downstreamExecutionStatus,
    recommendedPath: input.recommendedPath,
    allowedNextActionClasses: input.allowedNextActionClasses,
    requiredNewEvidence: input.requiredNewEvidence,
    requiresHumanReview: input.requiresHumanReview,
    safeRetryAvailable: safeRetryAvailable(input.recommendedPath, input.requiresHumanReview, input.allowedNextActionClasses),
    scopeNarrowingRequired: scopeNarrowingRequired(input.recommendedPath),
    policyUpdateCandidate: policyUpdateCandidate(input.recommendedPath, input.reasonCode),
    agentInstructionUpdateCandidate: agentInstructionUpdateCandidate(input.reasonCode),
    principalId: contract.principalId,
    agentId: contract.agentId,
    runId: contract.runId,
    gatewayId: receipt.gatewayId,
    resourceRef: contract.resourceRef,
    actionClass: contract.actionClass,
    failureReceiptRef: receipt.receiptId,
    proofGapIds: receipt.proofGapIds,
    missingEvidenceRefs: proofGaps.map((proofGap) => proofGap.missingOrInvalidEvidenceRef),
    reviewDecisionRef: input.reviewDecisionRef,
    policyChangeRef: input.policyChangeRef,
    sourceReceiptDigest: receipt.receiptDigest,
    sourceAuditChainDigest: receipt.auditChainDigest,
    sourceStreamOffsets: receipt.streamOffsets,
    reasonCode: input.reasonCode,
    reasonSummary: input.reasonSummary,
    recommendedAt: now,
    recoveryExpiresAt: input.recoveryExpiresAt,
    reviewDueAt: input.reviewDueAt,
    retryNotBefore: input.retryNotBefore,
    mustCreateNewActionContract: true,
    mayReuseGreenlight: false,
    mayMutateProtectedSurface: false,
    recommendationStatus: "open",
    statusChangedAt: null,
    statusChangedByRef: null,
    statusReasonCode: null,
    statusReasonSummary: null,
    supersededByActionContractId: null,
    recommendationDigest,
  });

  await recorder.commitRecordsWithEvents(
    [{ objectType: "recovery_recommendation", payload: recommendation }],
    [
      {
        source: recommendation,
        eventType: "recovery_recommended",
        objectRefs: [
          recommendation.recoveryRecommendationId,
          recommendation.sourceReceiptId,
          recommendation.sourceActionContractId,
          recommendation.sourceRefusalOrGapRef,
        ],
        streamRefs: actionLifecycleStreamRefs(contract),
        payload: {
          sourceReceiptId: recommendation.sourceReceiptId,
          sourceRefusalOrGapRef: recommendation.sourceRefusalOrGapRef,
          recommendedPath: recommendation.recommendedPath,
          mustCreateNewActionContract: true,
          mayReuseGreenlight: false,
          mayMutateProtectedSurface: false,
          recommendationDigest: recommendation.recommendationDigest,
        },
      },
    ],
  );
  return recommendation;
}

function assertRecoverableReceipt(receipt: Receipt): void {
  const hasRecoverableStatus =
    receipt.proofGapIds.length > 0 ||
    receipt.gatewayCheckStatus === "refused" ||
    receipt.gatewayCheckStatus === "proof_gap" ||
    receipt.mutationAttemptStatus === "downstream_refused" ||
    receipt.mutationAttemptStatus === "failed" ||
    receipt.mutationAttemptStatus === "unknown" ||
    receipt.downstreamExecutionStatus === "refused" ||
    receipt.downstreamExecutionStatus === "failed" ||
    receipt.downstreamExecutionStatus === "unknown" ||
    receipt.finalityStatus === "suspect" ||
    receipt.finalityStatus === "unknown";

  if (!hasRecoverableStatus) {
    throw new HandshakeProtocolError(
      "recovery_source_not_recoverable",
      "Recovery recommendation requires a refusal, proof gap, failed, unknown, or suspect receipt.",
      409,
    );
  }
}

function assertReceiptDigestMaterial(receipt: Receipt): asserts receipt is DigestedReceipt {
  if (!receipt.receiptDigest || !receipt.auditChainDigest) {
    throw new HandshakeProtocolError(
      "recovery_receipt_digest_missing",
      "Recovery recommendation requires receiptDigest and auditChainDigest.",
      409,
    );
  }
  if (receipt.streamOffsets.length === 0 || receipt.streamEventIds.length === 0) {
    throw new HandshakeProtocolError(
      "recovery_receipt_stream_offsets_missing",
      "Recovery recommendation requires stream event references and stream offset windows.",
      409,
    );
  }
}

async function assertReceiptDigests(receipt: DigestedReceipt): Promise<void> {
  const expectedReceiptDigest = await digestCanonical({
    ...receipt,
    receiptDigest: null,
    auditChainDigest: null,
  } satisfies JsonValue);
  if (receipt.receiptDigest !== expectedReceiptDigest) {
    throw new HandshakeProtocolError(
      "recovery_receipt_digest_mismatch",
      "Stored receiptDigest does not match the receipt body.",
      409,
    );
  }
  const expectedAuditChainDigest = await digestCanonical({
    receiptDigest: receipt.receiptDigest,
    streamOffsets: receipt.streamOffsets,
    proofGapIds: receipt.proofGapIds,
    finalityStatus: receipt.finalityStatus,
  } satisfies JsonValue);
  if (receipt.auditChainDigest !== expectedAuditChainDigest) {
    throw new HandshakeProtocolError(
      "recovery_audit_chain_digest_mismatch",
      "Stored auditChainDigest does not match the receipt stream and proof-gap evidence.",
      409,
    );
  }
}

function defaultSourceRefusalOrGapRef(receipt: Receipt): string {
  if (receipt.proofGapIds[0]) return receipt.proofGapIds[0];
  if (receipt.gatewayCheckStatus === "refused") return receipt.gateAttemptId ?? receipt.receiptId;
  if (receipt.mutationAttemptStatus !== "not_attempted") return receipt.mutationAttemptId ?? receipt.gateAttemptId ?? receipt.receiptId;
  return receipt.gateAttemptId ?? receipt.receiptId;
}

function assertSourceRefBelongsToReceipt(receipt: Receipt, sourceRefusalOrGapRef: string): void {
  const allowedRefs = new Set([
    receipt.receiptId,
    receipt.gateAttemptId,
    receipt.mutationAttemptId,
    ...receipt.proofGapIds,
  ].filter((ref): ref is string => ref !== null));
  if (!allowedRefs.has(sourceRefusalOrGapRef)) {
    throw new HandshakeProtocolError(
      "recovery_source_ref_mismatch",
      "sourceRefusalOrGapRef must reference the source receipt, gate attempt, mutation attempt, or proof gap.",
      409,
    );
  }
}

function assertRecommendationScope(recommendedPath: RecoveryRecommendedPath, allowedNextActionClasses: string[]): void {
  const pathNeedsFutureContract =
    recommendedPath === "narrower_action_contract_required" ||
    recommendedPath === "compensating_action_contract_required";
  if (pathNeedsFutureContract && allowedNextActionClasses.length === 0) {
    throw new HandshakeProtocolError(
      "recovery_next_action_class_missing",
      "Recovery path that can lead to future mutation must name allowed next action classes.",
      400,
    );
  }
  if (recommendedPath === "halt_without_retry" && allowedNextActionClasses.length > 0) {
    throw new HandshakeProtocolError(
      "recovery_halt_has_next_action_classes",
      "halt_without_retry cannot declare allowed next action classes.",
      400,
    );
  }
}

function safeRetryAvailable(
  recommendedPath: RecoveryRecommendedPath,
  requiresHumanReview: boolean,
  allowedNextActionClasses: string[],
): boolean {
  return (
    recommendedPath === "narrower_action_contract_required" &&
    !requiresHumanReview &&
    allowedNextActionClasses.length > 0
  );
}

function scopeNarrowingRequired(recommendedPath: RecoveryRecommendedPath): boolean {
  return (
    recommendedPath === "narrower_action_contract_required" ||
    recommendedPath === "compensating_action_contract_required"
  );
}

function policyUpdateCandidate(recommendedPath: RecoveryRecommendedPath, reasonCode: string): boolean {
  return recommendedPath === "human_review_required" || reasonCode.includes("policy");
}

function agentInstructionUpdateCandidate(reasonCode: string): boolean {
  return reasonCode.includes("agent") || reasonCode.includes("compiler") || reasonCode.includes("overreach");
}

async function loadProofGaps(recorder: ProtocolRecorder, proofGapIds: string[]): Promise<ProofGap[]> {
  const proofGaps: ProofGap[] = [];
  for (const proofGapId of proofGapIds) {
    const proofGap = await recorder.requiredRecord<ProofGap>("proof_gap", proofGapId, "proof_gap_missing");
    proofGaps.push(proofGap.payload);
  }
  return proofGaps;
}
