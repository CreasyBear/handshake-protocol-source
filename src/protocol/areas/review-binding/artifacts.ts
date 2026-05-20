import { digestCanonical } from "../../foundation/canonical";
import type { ActionContract } from "../action-contract";
import { HandshakeProtocolError } from "../../foundation/errors";
import { actionLifecycleStreamRefs, type EventDescriptor } from "../../events/chains";
import { createId, nowIso } from "../../foundation/ids";
import type { PolicyDecision } from "../policy-greenlight";
import { CreateReviewArtifactInputSchema, type CreateReviewArtifactInput } from "./types";
import type { ProtocolRecorder } from "../../events/records";
import type { ProtocolRecord } from "../object-registry";
import { PROTOCOL_VERSION, ReviewArtifactRecordSchema, type JsonValue, type ReviewArtifactRecord } from "./types";

type ParsedCreateReviewArtifactInput = ReturnType<typeof CreateReviewArtifactInputSchema.parse>;

type ReviewArtifactContext = {
  input: ParsedCreateReviewArtifactInput;
  contract: ActionContract;
  policyDecision: PolicyDecision;
  reviewArtifactId: string;
  now: string;
};

export async function createReviewArtifact(
  recorder: ProtocolRecorder,
  inputValue: CreateReviewArtifactInput,
): Promise<ReviewArtifactRecord> {
  const input = CreateReviewArtifactInputSchema.parse(inputValue);
  const context = await getReviewArtifactContext(recorder, input);
  const reviewArtifact = await buildReviewArtifact(context);
  await commitReviewArtifact(recorder, context, reviewArtifact);
  return reviewArtifact;
}

async function getReviewArtifactContext(
  recorder: ProtocolRecorder,
  input: ParsedCreateReviewArtifactInput,
): Promise<ReviewArtifactContext> {
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
  return {
    input,
    contract: contract.payload,
    policyDecision: policyDecision.payload,
    reviewArtifactId: createId("rart"),
    now: nowIso(),
  };
}

async function buildReviewArtifact(context: ReviewArtifactContext): Promise<ReviewArtifactRecord> {
  const { input, contract, policyDecision, reviewArtifactId, now } = context;
  const reviewArtifactDigest = await digestCanonical(buildReviewArtifactBinding(context));
  return ReviewArtifactRecordSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: contract.tenantId,
    organizationId: contract.organizationId,
    createdAt: now,
    reviewArtifactId,
    reviewArtifactRef: input.reviewArtifactRef,
    reviewRenderSchemaVersion: input.reviewRenderSchemaVersion,
    rendererRef: input.rendererRef,
    actionContractId: contract.actionContractId,
    actionContractDigest: contract.actionContractDigest,
    policyDecisionId: policyDecision.policyDecisionId,
    policyInputDigest: policyDecision.policyInputDigest,
    gatewayPolicyVersion: contract.gatewayPolicyVersion,
    renderedContractDigest: input.renderedContractDigest,
    renderedPolicyInputDigest: input.renderedPolicyInputDigest,
    renderedUncertaintyDigest: input.renderedUncertaintyDigest,
    renderedArtifactDigest: input.renderedArtifactDigest,
    catalogDigest: input.catalogDigest,
    rendererDigest: input.rendererDigest,
    actionBindingDigest: input.actionBindingDigest,
    hiddenActionPosture: input.hiddenActionPosture,
    secondaryActionPosture: input.secondaryActionPosture,
    uncertaintyMarkers: input.uncertaintyMarkers,
    evidenceRefs: input.evidenceRefs,
    reviewArtifactDigest,
  });
}

function buildReviewArtifactBinding(context: ReviewArtifactContext): JsonValue {
  const { input, contract, policyDecision } = context;
  const digestMaterial = {
    reviewArtifactRef: input.reviewArtifactRef,
    reviewRenderSchemaVersion: input.reviewRenderSchemaVersion,
    rendererRef: input.rendererRef,
    actionContractId: contract.actionContractId,
    actionContractDigest: contract.actionContractDigest,
    policyDecisionId: policyDecision.policyDecisionId,
    policyInputDigest: policyDecision.policyInputDigest,
    gatewayPolicyVersion: contract.gatewayPolicyVersion,
    renderedContractDigest: input.renderedContractDigest,
    renderedPolicyInputDigest: input.renderedPolicyInputDigest,
    renderedUncertaintyDigest: input.renderedUncertaintyDigest,
    renderedArtifactDigest: input.renderedArtifactDigest,
    catalogDigest: input.catalogDigest,
    rendererDigest: input.rendererDigest,
    actionBindingDigest: input.actionBindingDigest,
    hiddenActionPosture: input.hiddenActionPosture,
    secondaryActionPosture: input.secondaryActionPosture,
    uncertaintyMarkers: input.uncertaintyMarkers,
    evidenceRefs: input.evidenceRefs,
  } satisfies JsonValue;
  return digestMaterial;
}

async function commitReviewArtifact(
  recorder: ProtocolRecorder,
  context: ReviewArtifactContext,
  reviewArtifact: ReviewArtifactRecord,
): Promise<void> {
  await recorder.commitRecordsWithEvents(
    reviewArtifactRecords(reviewArtifact),
    reviewArtifactEvents(context, reviewArtifact),
  );
}

function reviewArtifactRecords(reviewArtifact: ReviewArtifactRecord): ProtocolRecord[] {
  return [{ objectType: "review_artifact", payload: reviewArtifact }];
}

function reviewArtifactEvents(context: ReviewArtifactContext, reviewArtifact: ReviewArtifactRecord): EventDescriptor[] {
  return [
    {
      source: reviewArtifact,
      eventType: "review_artifact_recorded",
      objectRefs: [
        reviewArtifact.reviewArtifactId,
        reviewArtifact.actionContractId,
        reviewArtifact.policyDecisionId,
        reviewArtifact.reviewArtifactDigest,
      ],
      streamRefs: actionLifecycleStreamRefs(context.contract),
      payload: {
        reviewRenderSchemaVersion: reviewArtifact.reviewRenderSchemaVersion,
        rendererRef: reviewArtifact.rendererRef,
      },
    },
  ];
}
