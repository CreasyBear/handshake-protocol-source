import { signCanonicalHmac } from "../../../foundation/canonical";
import type { ActionContract } from "../../action-contract";
import type { OperatingEnvelope } from "../../catalog-envelope";
import { actionLifecycleStreamRefs } from "../../../events/chains";
import { createId } from "../../../foundation/ids";
import type { ProtocolRecorder } from "../../../events/records";
import type { ProtectedPathPosture } from "../../protected-path-posture";
import type { StoredProtocolRecord } from "../../../store/port";
import {
  GreenlightSchema,
  PolicyDecisionSchema,
  PROTOCOL_VERSION,
  type Greenlight,
  type PolicyDecision,
} from "../types";
import type { EvaluatePolicyInputSchema } from "../types";

type ParsedEvaluatePolicyInput = ReturnType<typeof EvaluatePolicyInputSchema.parse>;

type PolicyDecisionValue = {
  decision: PolicyDecision["decision"];
  reasonCode: string;
  reason: string;
  matchedRuleIds: string[];
};

export type PolicyCommitPlan = {
  contract: ActionContract;
  decision: PolicyDecision;
  greenlight: Greenlight | null;
  now: string;
};

export async function buildPolicyDecision(
  input: ParsedEvaluatePolicyInput,
  contract: ActionContract,
  envelope: OperatingEnvelope,
  decisionValue: PolicyDecisionValue,
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

export function buildGreenlight(
  contract: ActionContract,
  decision: PolicyDecision,
  now: string,
  protectedPathPosture: StoredProtocolRecord<ProtectedPathPosture> | null,
): Greenlight {
  return GreenlightSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: contract.tenantId,
    organizationId: contract.organizationId,
    createdAt: now,
    greenlightId: createId("grn"),
    actionContractId: contract.actionContractId,
    policyDecisionId: decision.policyDecisionId,
    gatewayRegistryEntryId: contract.gatewayRegistryEntryId,
    gatewayRegistryVersion: contract.gatewayRegistryVersion,
    gatewayId: contract.gatewayId,
    gatewayPolicyVersion: contract.gatewayPolicyVersion,
    actionClass: contract.actionClass,
    resourceRef: contract.resourceRef,
    requiredProtectedPathState: contract.requiredProtectedPathState,
    protectedPathPostureId: protectedPathPosture?.payload.protectedPathPostureId ?? null,
    protectedPathPostureDigest: protectedPathPosture?.payload.postureDigest ?? null,
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

export async function commitPolicyEvaluation(recorder: ProtocolRecorder, plan: PolicyCommitPlan): Promise<void> {
  if (!plan.greenlight) {
    await commitPolicyDecisionOnly(recorder, plan);
    return;
  }
  await commitGreenlightPolicyDecision(recorder, plan, plan.greenlight);
}

async function commitPolicyDecisionOnly(recorder: ProtocolRecorder, plan: PolicyCommitPlan): Promise<void> {
  const { contract, decision } = plan;
  await recorder.commitRecordsWithEvents(
    [{ objectType: "policy_decision", payload: decision }],
    [
      {
        source: decision,
        eventType: "policy_decision_recorded",
        objectRefs: [decision.policyDecisionId, contract.actionContractId],
        streamRefs: actionLifecycleStreamRefs(contract),
        payload: { decision: decision.decision, reasonCode: decision.decisionReasonCode },
      },
      {
        source: decision,
        eventType: decision.decision === "review_required" ? "review_required" : "action_refused",
        objectRefs: [decision.policyDecisionId, contract.actionContractId],
        streamRefs: actionLifecycleStreamRefs(contract),
        payload: { reasonCode: decision.decisionReasonCode },
      },
    ],
  );
}

async function commitGreenlightPolicyDecision(
  recorder: ProtocolRecorder,
  plan: PolicyCommitPlan,
  greenlight: Greenlight,
): Promise<void> {
  const { contract, decision } = plan;
  await recorder.commitRecordsWithEvents(
    [
      { objectType: "policy_decision", payload: decision },
      { objectType: "greenlight", payload: greenlight },
    ],
    [
      {
        source: decision,
        eventType: "policy_decision_recorded",
        objectRefs: [decision.policyDecisionId, contract.actionContractId],
        streamRefs: actionLifecycleStreamRefs(contract),
        payload: { decision: decision.decision, reasonCode: decision.decisionReasonCode },
      },
      {
        source: greenlight,
        eventType: "action_greenlit",
        objectRefs: [greenlight.greenlightId, greenlight.actionContractId],
        streamRefs: actionLifecycleStreamRefs(contract),
        payload: { gatewayId: greenlight.gatewayId, actionClass: greenlight.actionClass },
      },
    ],
    {
      greenlightIssuanceClaims: [
        {
          actionContractId: contract.actionContractId,
          greenlightId: greenlight.greenlightId,
          policyDecisionId: decision.policyDecisionId,
          tenantId: contract.tenantId,
          organizationId: contract.organizationId,
          claimedAt: plan.now,
        },
      ],
    },
  );
}
