import { digestCanonical } from "./canonical";
import { HandshakeProtocolError } from "./errors";
import { actionLifecycleStreamRefs } from "./events";
import { createId, nowIso } from "./ids";
import { CreateReviewArtifactInputSchema, type CreateReviewArtifactInput } from "./inputs";
import type { ProtocolRecorder } from "./records";
import {
  PROTOCOL_VERSION,
  ReviewArtifactRecordSchema,
  type ActionContract,
  type JsonValue,
  type PolicyDecision,
  type ReviewArtifactRecord,
} from "./schemas";

export async function createReviewArtifact(
  recorder: ProtocolRecorder,
  inputValue: CreateReviewArtifactInput,
): Promise<ReviewArtifactRecord> {
  const input = CreateReviewArtifactInputSchema.parse(inputValue);
  const [contract, policyDecision] = await Promise.all([
    recorder.requiredRecord<ActionContract>("action_contract", input.actionContractId, "contract_missing"),
    recorder.requiredRecord<PolicyDecision>("policy_decision", input.policyDecisionId, "policy_decision_missing"),
  ]);
  if (policyDecision.payload.actionContractId !== contract.payload.actionContractId) {
    throw new HandshakeProtocolError(
      "review_artifact_policy_contract_mismatch",
      "Review artifact policy decision must bind to the exact action contract.",
      409,
    );
  }
  if (policyDecision.payload.decision !== "review_required") {
    throw new HandshakeProtocolError(
      "review_artifact_not_required",
      "Review artifacts may satisfy only policy decisions that required review.",
      409,
    );
  }
  if (input.renderedContractDigest !== contract.payload.actionContractDigest) {
    throw new HandshakeProtocolError(
      "review_artifact_contract_digest_mismatch",
      "Rendered review contract digest does not match the exact action contract.",
      409,
    );
  }
  if (input.renderedPolicyInputDigest !== policyDecision.payload.policyInputDigest) {
    throw new HandshakeProtocolError(
      "review_artifact_policy_input_digest_mismatch",
      "Rendered review policy input digest does not match the exact policy input.",
      409,
    );
  }

  const createdAt = nowIso();
  const reviewArtifactId = createId("rart");
  const digestMaterial = {
    reviewArtifactRef: input.reviewArtifactRef,
    reviewRenderSchemaVersion: input.reviewRenderSchemaVersion,
    rendererRef: input.rendererRef,
    actionContractId: contract.payload.actionContractId,
    actionContractDigest: contract.payload.actionContractDigest,
    policyDecisionId: policyDecision.payload.policyDecisionId,
    policyInputDigest: policyDecision.payload.policyInputDigest,
    gatewayPolicyVersion: contract.payload.gatewayPolicyVersion,
    renderedContractDigest: input.renderedContractDigest,
    renderedPolicyInputDigest: input.renderedPolicyInputDigest,
    renderedUncertaintyDigest: input.renderedUncertaintyDigest,
    renderedArtifactDigest: input.renderedArtifactDigest,
    uncertaintyMarkers: input.uncertaintyMarkers,
    evidenceRefs: input.evidenceRefs,
  } satisfies JsonValue;
  const reviewArtifactDigest = await digestCanonical(digestMaterial);
  const reviewArtifact = ReviewArtifactRecordSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: contract.payload.tenantId,
    organizationId: contract.payload.organizationId,
    createdAt,
    reviewArtifactId,
    reviewArtifactRef: input.reviewArtifactRef,
    reviewRenderSchemaVersion: input.reviewRenderSchemaVersion,
    rendererRef: input.rendererRef,
    actionContractId: contract.payload.actionContractId,
    actionContractDigest: contract.payload.actionContractDigest,
    policyDecisionId: policyDecision.payload.policyDecisionId,
    policyInputDigest: policyDecision.payload.policyInputDigest,
    gatewayPolicyVersion: contract.payload.gatewayPolicyVersion,
    renderedContractDigest: input.renderedContractDigest,
    renderedPolicyInputDigest: input.renderedPolicyInputDigest,
    renderedUncertaintyDigest: input.renderedUncertaintyDigest,
    renderedArtifactDigest: input.renderedArtifactDigest,
    uncertaintyMarkers: input.uncertaintyMarkers,
    evidenceRefs: input.evidenceRefs,
    reviewArtifactDigest,
  });

  await recorder.commitRecordsWithEvents(
    [{ objectType: "review_artifact", payload: reviewArtifact }],
    [
      {
        source: reviewArtifact,
        eventType: "review_artifact_recorded",
        objectRefs: [
          reviewArtifact.reviewArtifactId,
          reviewArtifact.actionContractId,
          reviewArtifact.policyDecisionId,
          reviewArtifact.reviewArtifactDigest,
        ],
        streamRefs: actionLifecycleStreamRefs(contract.payload),
        payload: {
          reviewRenderSchemaVersion: reviewArtifact.reviewRenderSchemaVersion,
          rendererRef: reviewArtifact.rendererRef,
        },
      },
    ],
  );

  return reviewArtifact;
}
