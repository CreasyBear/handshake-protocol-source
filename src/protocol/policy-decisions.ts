import { digestCanonical, signCanonicalHmac } from "./canonical";
import { HandshakeProtocolError } from "./errors";
import { actionLifecycleStreamRefs } from "./events";
import { createId, nowIso } from "./ids";
import { EvaluatePolicyInputSchema, type EvaluatePolicyInput } from "./inputs";
import { evaluateDeterministicPolicy, isolationSnapshotRef, reviewDecisionAllowsGreenlight } from "./policy";
import type { ProtocolRecorder } from "./records";
import { evaluateSequenceDependencies, loadSequenceDependencyStates } from "./sequence-dependencies";
import {
  GreenlightSchema,
  PolicyDecisionSchema,
  PROTOCOL_VERSION,
  type ActionContract,
  type Greenlight,
  type OperatingEnvelope,
  type PolicyDecision,
  type ReviewDecision,
} from "./schemas";
import { guardGreenlightIssuance, guardPolicyEvaluation, type TransitionGuardResult } from "./transitions";
import type { ProtocolStore } from "../storage/store";
import { scopeIdsForContract } from "../storage/store";

export async function evaluatePolicy(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  inputValue: EvaluatePolicyInput,
): Promise<{ decision: PolicyDecision; greenlight: Greenlight | null }> {
  const input = EvaluatePolicyInputSchema.parse(inputValue);
  const contract = await recorder.requiredRecord<ActionContract>("action_contract", input.actionContractId, "contract_missing");
  const envelope = await recorder.requiredRecord<OperatingEnvelope>("operating_envelope", input.envelopeId, "envelope_missing");
  assertTransition(guardPolicyEvaluation(contract.payload, envelope.payload));

  const now = nowIso();
  const isolationStates = await store.listIsolationStates(scopeIdsForContract(contract.payload));
  const sequenceDependencyStates = await loadSequenceDependencyStates(store, contract.payload);
  let decisionValue = evaluateDeterministicPolicy(contract.payload, envelope.payload, isolationStates, now);
  if (decisionValue.decision === "greenlight") {
    decisionValue = evaluateSequenceDependencies(sequenceDependencyStates) ?? decisionValue;
  }
  const policyInput = {
    contractDigest: contract.payload.actionContractDigest,
    envelopeId: envelope.payload.envelopeId,
    envelopePolicyPackVersion: envelope.payload.policyPackVersion,
    isolationStateIds: isolationStates.map((state) => state.isolationStateId).sort(),
    sequenceDependencyStates,
  };
  const policyInputDigest = await digestCanonical(policyInput);
  if (decisionValue.decision === "review_required" && input.reviewDecisionId) {
    const reviewDecision = await recorder.requiredRecord<ReviewDecision>(
      "review_decision",
      input.reviewDecisionId,
      "review_decision_missing",
    );
    decisionValue = reviewDecisionAllowsGreenlight(reviewDecision.payload, contract.payload, policyInputDigest, now)
      ? {
          decision: "greenlight",
          reasonCode: "review_approved",
          reason: "Exact contract and policy input were approved by a bound review decision.",
          matchedRuleIds: ["review_decision_approved"],
        }
      : {
          decision: "refuse",
          reasonCode: "review_decision_invalid",
          reason: "Review decision did not bind to the current exact contract and policy input.",
          matchedRuleIds: ["review_decision_binding"],
        };
  }

  const decision = await buildPolicyDecision(
    input,
    contract.payload,
    envelope.payload,
    decisionValue,
    policyInputDigest,
    isolationSnapshotRef(isolationStates),
    now,
  );
  if (decision.decision !== "greenlight") {
    await recorder.commitRecordsWithEvents([{ objectType: "policy_decision", payload: decision }], [
      {
        source: decision,
        eventType: "policy_decision_recorded",
        objectRefs: [decision.policyDecisionId, contract.payload.actionContractId],
        streamRefs: actionLifecycleStreamRefs(contract.payload),
        payload: { decision: decision.decision, reasonCode: decision.decisionReasonCode },
      },
      {
        source: decision,
        eventType: decision.decision === "review_required" ? "review_required" : "action_refused",
        objectRefs: [decision.policyDecisionId, contract.payload.actionContractId],
        streamRefs: actionLifecycleStreamRefs(contract.payload),
        payload: { reasonCode: decision.decisionReasonCode },
      },
    ]);
    return { decision, greenlight: null };
  }

  const greenlight = buildGreenlight(contract.payload, decision, now);
  const existingGreenlights = await store.listRecordsByType<Greenlight>("greenlight", {
    tenantId: contract.payload.tenantId,
    organizationId: contract.payload.organizationId,
  });
  assertTransition(guardGreenlightIssuance(contract.payload, existingGreenlights.map((record) => record.payload)));
  await recorder.commitRecordsWithEvents(
    [
      { objectType: "policy_decision", payload: decision },
      { objectType: "greenlight", payload: greenlight },
    ],
    [
      {
        source: decision,
        eventType: "policy_decision_recorded",
        objectRefs: [decision.policyDecisionId, contract.payload.actionContractId],
        streamRefs: actionLifecycleStreamRefs(contract.payload),
        payload: { decision: decision.decision, reasonCode: decision.decisionReasonCode },
      },
      {
        source: greenlight,
        eventType: "action_greenlit",
        objectRefs: [greenlight.greenlightId, greenlight.actionContractId],
        streamRefs: actionLifecycleStreamRefs(contract.payload),
        payload: { receiverId: greenlight.receiverId, actionClass: greenlight.actionClass },
      },
    ],
    {
      greenlightIssuanceClaims: [
        {
          actionContractId: contract.payload.actionContractId,
          greenlightId: greenlight.greenlightId,
          policyDecisionId: decision.policyDecisionId,
          tenantId: contract.payload.tenantId,
          organizationId: contract.payload.organizationId,
          claimedAt: now,
        },
      ],
    },
  );
  return { decision, greenlight };
}

async function buildPolicyDecision(
  input: ReturnType<typeof EvaluatePolicyInputSchema.parse>,
  contract: ActionContract,
  envelope: OperatingEnvelope,
  decisionValue: {
    decision: PolicyDecision["decision"];
    reasonCode: string;
    reason: string;
    matchedRuleIds: string[];
  },
  policyInputDigest: `sha256:${string}`,
  isolationSnapshot: string,
  now: string,
): Promise<PolicyDecision> {
  const decisionId = createId("pol");
  const decisionUnsigned = {
    policyDecisionId: decisionId,
    actionContractId: contract.actionContractId,
    decision: decisionValue.decision,
    decisionReasonCode: decisionValue.reasonCode,
    policyInputDigest,
  };
  const decisionSignature = input.signingSecret ? await signCanonicalHmac(decisionUnsigned, input.signingSecret) : null;
  return PolicyDecisionSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: contract.tenantId,
    organizationId: contract.organizationId,
    createdAt: now,
    policyDecisionId: decisionId,
    actionContractId: contract.actionContractId,
    envelopeId: envelope.envelopeId,
    policyPackRef: envelope.policyPackRef,
    policyPackVersion: envelope.policyPackVersion,
    policyEvaluatorVersion: input.policyEvaluatorVersion,
    policyInputDigest,
    decision: decisionValue.decision,
    decisionReasonCode: decisionValue.reasonCode,
    decisionReason: decisionValue.reason,
    matchedRuleIds: decisionValue.matchedRuleIds,
    requiredReceipt: "mutation",
    isolationSnapshotRef: isolationSnapshot,
    expiresAt: contract.expiresAt,
    decisionSignature,
  });
}

function buildGreenlight(contract: ActionContract, decision: PolicyDecision, now: string): Greenlight {
  return GreenlightSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: contract.tenantId,
    organizationId: contract.organizationId,
    createdAt: now,
    greenlightId: createId("grn"),
    actionContractId: contract.actionContractId,
    policyDecisionId: decision.policyDecisionId,
    receiverRegistryEntryId: contract.receiverRegistryEntryId,
    receiverRegistryVersion: contract.receiverRegistryVersion,
    receiverId: contract.receiverId,
    receiverPolicyVersion: contract.receiverPolicyVersion,
    actionClass: contract.actionClass,
    resourceRef: contract.resourceRef,
    paramsDigest: contract.paramsDigest,
    contractDigest: contract.actionContractDigest,
    maxUses: 1,
    issuedAt: now,
    notBefore: now,
    expiresAt: contract.expiresAt,
    isolationSnapshotRef: decision.isolationSnapshotRef,
    requiredReceipt: decision.requiredReceipt,
    decisionSignature: decision.decisionSignature,
    consumedAt: null,
    consumedByGateAttemptId: null,
  });
}

function assertTransition(result: TransitionGuardResult): void {
  if (!result.ok) {
    throw new HandshakeProtocolError(result.code, result.message, result.status);
  }
}
