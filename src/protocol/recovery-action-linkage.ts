import { HandshakeProtocolError } from "./errors";
import type { ProposeActionContractInputSchema } from "./inputs";
import type { ProtocolRecorder } from "./records";
import type {
  ActionContract,
  RecoveryRecommendation,
  RecoveryRecommendedPath,
} from "./schemas";

type ParsedActionContractInput = ReturnType<typeof ProposeActionContractInputSchema.parse>;

export type RecoveryActionLinkage = {
  recommendation: RecoveryRecommendation;
  sourceContract: ActionContract;
};

export async function loadRecoveryActionLinkage(
  recorder: ProtocolRecorder,
  recoveryRecommendationId: string | null,
): Promise<RecoveryActionLinkage | null> {
  if (!recoveryRecommendationId) return null;
  const recommendationRecord = await recorder.requiredRecord<RecoveryRecommendation>(
    "recovery_recommendation",
    recoveryRecommendationId,
    "recovery_recommendation_missing",
  );
  const sourceContractRecord = await recorder.requiredRecord<ActionContract>(
    "action_contract",
    recommendationRecord.payload.sourceActionContractId,
    "recovery_source_contract_missing",
  );
  return {
    recommendation: recommendationRecord.payload,
    sourceContract: sourceContractRecord.payload,
  };
}

export function assertRecoveryActionLinkage(
  input: ParsedActionContractInput,
  linkage: RecoveryActionLinkage | null,
  now: string,
): void {
  if (!linkage) return;
  const { recommendation, sourceContract } = linkage;
  assertContractablePath(recommendation.recommendedPath);
  if (recommendation.recommendationStatus !== "open") {
    throw new HandshakeProtocolError(
      "recovery_recommendation_not_open",
      "Action contract may link only to an open recovery recommendation.",
      409,
    );
  }
  if (recommendation.recoveryExpiresAt && Date.parse(recommendation.recoveryExpiresAt) <= Date.parse(now)) {
    throw new HandshakeProtocolError(
      "recovery_recommendation_expired",
      "Action contract may not link to an expired recovery recommendation.",
      409,
    );
  }
  if (recommendation.retryNotBefore && Date.parse(recommendation.retryNotBefore) > Date.parse(now)) {
    throw new HandshakeProtocolError(
      "recovery_retry_not_before",
      "Action contract may not be proposed before the recovery retry window opens.",
      409,
    );
  }
  if (input.sequenceNumber <= sourceContract.sequenceNumber) {
    throw new HandshakeProtocolError(
      "recovery_followup_not_later",
      "Recovery follow-up action contract must have a later sequence number than the source action contract.",
      409,
    );
  }
  if (!recommendation.allowedNextActionClasses.includes(input.actionClass)) {
    throw new HandshakeProtocolError(
      "recovery_action_class_not_allowed",
      "Recovery follow-up action class must be named by allowedNextActionClasses.",
      409,
    );
  }
  const missingEvidence = recommendation.requiredNewEvidence.filter((evidenceRef) => !input.evidenceRefs.includes(evidenceRef));
  if (missingEvidence.length > 0) {
    throw new HandshakeProtocolError(
      "recovery_required_evidence_missing",
      `Recovery follow-up action contract is missing required new evidence: ${missingEvidence.join(", ")}.`,
      409,
    );
  }
  if (
    input.tenantId !== recommendation.tenantId ||
    input.organizationId !== recommendation.organizationId ||
    input.principalId !== recommendation.principalId ||
    input.agentId !== recommendation.agentId ||
    input.runId !== recommendation.runId ||
    input.gatewayId !== recommendation.gatewayId ||
    input.resourceRef !== recommendation.resourceRef
  ) {
    throw new HandshakeProtocolError(
      "recovery_followup_scope_mismatch",
      "Recovery follow-up action contract must match the recommendation scope.",
      409,
    );
  }
}

function assertContractablePath(recommendedPath: RecoveryRecommendedPath): void {
  if (
    recommendedPath === "narrower_action_contract_required" ||
    recommendedPath === "compensating_action_contract_required"
  ) {
    return;
  }
  throw new HandshakeProtocolError(
    "recovery_path_not_contractable",
    "Recovery path does not permit a follow-up action contract.",
    409,
  );
}
