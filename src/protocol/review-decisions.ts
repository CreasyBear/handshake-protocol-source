import { HandshakeProtocolError } from "./errors";
import { actionLifecycleStreamRefs } from "./events";
import { createId, nowIso } from "./ids";
import { CreateReviewDecisionInputSchema, type CreateReviewDecisionInput } from "./inputs";
import type { ProtocolRecorder } from "./records";
import {
  PROTOCOL_VERSION,
  ReviewDecisionSchema,
  type ActionContract,
  type PolicyDecision,
  type ReviewDecision,
} from "./schemas";
import { guardReviewDecision, type TransitionGuardResult } from "./transitions";

export async function createReviewDecision(
  recorder: ProtocolRecorder,
  inputValue: CreateReviewDecisionInput,
): Promise<ReviewDecision> {
  const input = CreateReviewDecisionInputSchema.parse(inputValue);
  const [contract, policyDecision] = await Promise.all([
    recorder.requiredRecord<ActionContract>("action_contract", input.actionContractId, "contract_missing"),
    recorder.requiredRecord<PolicyDecision>("policy_decision", input.policyDecisionId, "policy_decision_missing"),
  ]);
  assertTransition(guardReviewDecision(contract.payload, policyDecision.payload));

  const reviewDecision = ReviewDecisionSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: contract.payload.tenantId,
    organizationId: contract.payload.organizationId,
    createdAt: nowIso(),
    reviewDecisionId: createId("rev"),
    reviewArtifactRef: input.reviewArtifactRef,
    reviewRenderSchemaVersion: input.reviewRenderSchemaVersion,
    reviewerPrincipalId: input.reviewerPrincipalId,
    actionContractId: contract.payload.actionContractId,
    actionContractDigest: contract.payload.actionContractDigest,
    policyInputDigest: policyDecision.payload.policyInputDigest,
    receiverPolicyVersion: contract.payload.receiverPolicyVersion,
    decision: input.decision,
    decisionReasonCode: input.decisionReasonCode,
    decisionExpiresAt: input.decisionExpiresAt,
    signatureOrAttestationRef: input.signatureOrAttestationRef,
  });

  await recorder.commitRecordsWithEvents([{ objectType: "review_decision", payload: reviewDecision }], [
      {
        source: reviewDecision,
        eventType: "review_decision_recorded",
        objectRefs: [reviewDecision.reviewDecisionId, reviewDecision.actionContractId, reviewDecision.policyInputDigest],
        streamRefs: actionLifecycleStreamRefs(contract.payload),
        payload: {
        decision: reviewDecision.decision,
        decisionReasonCode: reviewDecision.decisionReasonCode,
      },
    },
  ]);
  return reviewDecision;
}

function assertTransition(result: TransitionGuardResult): void {
  if (!result.ok) {
    throw new HandshakeProtocolError(result.code, result.message, result.status);
  }
}
