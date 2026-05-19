import type { ActionContract } from "../action-contract";
import { HandshakeProtocolError } from "../../foundation/errors";
import { actionLifecycleStreamRefs, type EventDescriptor } from "../../events/chains";
import { createId, nowIso } from "../../foundation/ids";
import type { ProtocolRecord } from "../object-registry";
import type { PolicyDecision } from "../policy-greenlight";
import { CreateReviewDecisionInputSchema, type CreateReviewDecisionInput } from "./types";
import type { ProtocolRecorder } from "../../events/records";
import { PROTOCOL_VERSION, ReviewDecisionSchema, type ReviewArtifactRecord, type ReviewDecision } from "./types";
import { guardReviewDecision } from "./guards";
import type { TransitionGuardResult } from "../../foundation/transition-guards";

type ParsedCreateReviewDecisionInput = ReturnType<typeof CreateReviewDecisionInputSchema.parse>;

type ReviewDecisionContext = {
  input: ParsedCreateReviewDecisionInput;
  contract: ActionContract;
  policyDecision: PolicyDecision;
  reviewArtifact: ReviewArtifactRecord;
  now: string;
};

export async function createReviewDecision(
  recorder: ProtocolRecorder,
  inputValue: CreateReviewDecisionInput,
): Promise<ReviewDecision> {
  const input = CreateReviewDecisionInputSchema.parse(inputValue);
  const context = await getReviewDecisionContext(recorder, input);
  const reviewDecision = buildReviewDecision(context);
  await commitReviewDecision(recorder, context, reviewDecision);
  return reviewDecision;
}

async function getReviewDecisionContext(
  recorder: ProtocolRecorder,
  input: ParsedCreateReviewDecisionInput,
): Promise<ReviewDecisionContext> {
  const [contract, policyDecision, reviewArtifact] = await Promise.all([
    recorder.requiredRecord<ActionContract>("action_contract", input.actionContractId, "contract_missing"),
    recorder.requiredRecord<PolicyDecision>("policy_decision", input.policyDecisionId, "policy_decision_missing"),
    recorder.requiredRecord<ReviewArtifactRecord>("review_artifact", input.reviewArtifactId, "review_artifact_missing"),
  ]);
  assertTransition(guardReviewDecision(contract.payload, policyDecision.payload));
  assertReviewArtifactBinding(
    reviewArtifact.payload,
    contract.payload,
    policyDecision.payload,
    input.reviewArtifactDigest,
  );
  return {
    input,
    contract: contract.payload,
    policyDecision: policyDecision.payload,
    reviewArtifact: reviewArtifact.payload,
    now: nowIso(),
  };
}

function buildReviewDecision(context: ReviewDecisionContext): ReviewDecision {
  const { input, contract, policyDecision, reviewArtifact, now } = context;
  return ReviewDecisionSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: contract.tenantId,
    organizationId: contract.organizationId,
    createdAt: now,
    reviewDecisionId: createId("rev"),
    reviewArtifactId: reviewArtifact.reviewArtifactId,
    reviewArtifactRef: reviewArtifact.reviewArtifactRef,
    reviewArtifactDigest: reviewArtifact.reviewArtifactDigest,
    reviewRenderSchemaVersion: reviewArtifact.reviewRenderSchemaVersion,
    reviewerPrincipalId: input.reviewerPrincipalId,
    actionContractId: contract.actionContractId,
    actionContractDigest: contract.actionContractDigest,
    policyInputDigest: policyDecision.policyInputDigest,
    gatewayPolicyVersion: contract.gatewayPolicyVersion,
    decision: input.decision,
    decisionReasonCode: input.decisionReasonCode,
    decisionExpiresAt: input.decisionExpiresAt,
    signatureOrAttestationRef: input.signatureOrAttestationRef,
  });
}

async function commitReviewDecision(
  recorder: ProtocolRecorder,
  context: ReviewDecisionContext,
  reviewDecision: ReviewDecision,
): Promise<void> {
  await recorder.commitRecordsWithEvents(
    reviewDecisionRecords(reviewDecision),
    reviewDecisionEvents(context, reviewDecision),
  );
}

function reviewDecisionRecords(reviewDecision: ReviewDecision): ProtocolRecord[] {
  return [{ objectType: "review_decision", payload: reviewDecision }];
}

function reviewDecisionEvents(context: ReviewDecisionContext, reviewDecision: ReviewDecision): EventDescriptor[] {
  return [
    {
      source: reviewDecision,
      eventType: "review_decision_recorded",
      objectRefs: [
        reviewDecision.reviewDecisionId,
        reviewDecision.reviewArtifactId,
        reviewDecision.actionContractId,
        reviewDecision.policyInputDigest,
      ],
      streamRefs: actionLifecycleStreamRefs(context.contract),
      payload: {
        decision: reviewDecision.decision,
        decisionReasonCode: reviewDecision.decisionReasonCode,
      },
    },
  ];
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
