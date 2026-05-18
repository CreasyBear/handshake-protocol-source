import type { ActionContract } from "../action-contract";
import { HandshakeProtocolError } from "../errors";
import { actionLifecycleStreamRefs } from "../events";
import { createId, nowIso } from "../ids";
import type { PolicyDecision } from "../policy-greenlight";
import { CreateReviewDecisionInputSchema, type CreateReviewDecisionInput } from "./types";
import type { ProtocolRecorder } from "../records";
import {
  PROTOCOL_VERSION,
  ReviewDecisionSchema,
  type ReviewArtifactRecord,
  type ReviewDecision,
} from "./types";
import { guardReviewDecision } from "./guards";
import type { TransitionGuardResult } from "../transition-guards";

export async function createReviewDecision(
  recorder: ProtocolRecorder,
  inputValue: CreateReviewDecisionInput,
): Promise<ReviewDecision> {
  const input = CreateReviewDecisionInputSchema.parse(inputValue);
  const [contract, policyDecision, reviewArtifact] = await Promise.all([
    recorder.requiredRecord<ActionContract>("action_contract", input.actionContractId, "contract_missing"),
    recorder.requiredRecord<PolicyDecision>("policy_decision", input.policyDecisionId, "policy_decision_missing"),
    recorder.requiredRecord<ReviewArtifactRecord>("review_artifact", input.reviewArtifactId, "review_artifact_missing"),
  ]);
  assertTransition(guardReviewDecision(contract.payload, policyDecision.payload));
  assertReviewArtifactBinding(reviewArtifact.payload, contract.payload, policyDecision.payload, input.reviewArtifactDigest);

  const reviewDecision = ReviewDecisionSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: contract.payload.tenantId,
    organizationId: contract.payload.organizationId,
    createdAt: nowIso(),
    reviewDecisionId: createId("rev"),
    reviewArtifactId: reviewArtifact.payload.reviewArtifactId,
    reviewArtifactRef: reviewArtifact.payload.reviewArtifactRef,
    reviewArtifactDigest: reviewArtifact.payload.reviewArtifactDigest,
    reviewRenderSchemaVersion: reviewArtifact.payload.reviewRenderSchemaVersion,
    reviewerPrincipalId: input.reviewerPrincipalId,
    actionContractId: contract.payload.actionContractId,
    actionContractDigest: contract.payload.actionContractDigest,
    policyInputDigest: policyDecision.payload.policyInputDigest,
    gatewayPolicyVersion: contract.payload.gatewayPolicyVersion,
    decision: input.decision,
    decisionReasonCode: input.decisionReasonCode,
    decisionExpiresAt: input.decisionExpiresAt,
    signatureOrAttestationRef: input.signatureOrAttestationRef,
  });

  await recorder.commitRecordsWithEvents([{ objectType: "review_decision", payload: reviewDecision }], [
    {
      source: reviewDecision,
      eventType: "review_decision_recorded",
      objectRefs: [
        reviewDecision.reviewDecisionId,
        reviewDecision.reviewArtifactId,
        reviewDecision.actionContractId,
        reviewDecision.policyInputDigest,
      ],
      streamRefs: actionLifecycleStreamRefs(contract.payload),
      payload: {
        decision: reviewDecision.decision,
        decisionReasonCode: reviewDecision.decisionReasonCode,
      },
    },
  ]);
  return reviewDecision;
}

function assertReviewArtifactBinding(
  reviewArtifact: ReviewArtifactRecord,
  contract: ActionContract,
  policyDecision: PolicyDecision,
  suppliedDigest: string,
): void {
  if (reviewArtifact.reviewArtifactDigest !== suppliedDigest) {
    throw new HandshakeProtocolError(
      "review_artifact_digest_mismatch",
      "Review decision must supply the exact review artifact digest.",
      409,
    );
  }
  if (
    reviewArtifact.actionContractId !== contract.actionContractId ||
    reviewArtifact.actionContractDigest !== contract.actionContractDigest ||
    reviewArtifact.renderedContractDigest !== contract.actionContractDigest
  ) {
    throw new HandshakeProtocolError(
      "review_artifact_contract_mismatch",
      "Review artifact does not bind to the exact action contract digest.",
      409,
    );
  }
  if (
    reviewArtifact.policyDecisionId !== policyDecision.policyDecisionId ||
    reviewArtifact.policyInputDigest !== policyDecision.policyInputDigest ||
    reviewArtifact.renderedPolicyInputDigest !== policyDecision.policyInputDigest
  ) {
    throw new HandshakeProtocolError(
      "review_artifact_policy_input_mismatch",
      "Review artifact does not bind to the exact policy input digest.",
      409,
    );
  }
  if (reviewArtifact.gatewayPolicyVersion !== contract.gatewayPolicyVersion) {
    throw new HandshakeProtocolError(
      "review_artifact_gateway_policy_mismatch",
      "Review artifact gateway policy version does not match the exact action contract.",
      409,
    );
  }
}

function assertTransition(result: TransitionGuardResult): void {
  if (!result.ok) {
    throw new HandshakeProtocolError(result.code, result.message, result.status);
  }
}
