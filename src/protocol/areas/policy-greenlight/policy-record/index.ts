import { signCanonicalHmac } from "../../../foundation/canonical";
import type { ActionContract } from "../../action-contract";
import { idempotencyLedgerIndexEntry, type IdempotencyLedgerEntry } from "../../idempotency-ledger";
import type { OperatingEnvelope } from "../../catalog-envelope";
import { actionLifecycleStreamRefs } from "../../../events/chains";
import { createId } from "../../../foundation/ids";
import type { ProtocolRecorder } from "../../../events/records";
import type { ProtectedPathPosture } from "../../protected-path-posture";
import { buildRefusal, protocolObjectRef, type Refusal } from "../../refusal";
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
  idempotencyLedgerEntry: IdempotencyLedgerEntry | null;
  now: string;
};

export type PolicyCommitResult =
  | { status: "committed"; refusal: Refusal | null }
  | { status: "idempotency_ledger_conflict"; refusal: null };

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
    signaturePosture: input.signingSecret ? "local_hmac" : "unsigned",
    keyIdentityRef: input.signingSecret ? "local:hmac" : null,
    verificationPolicyRef: input.signingSecret ? "local-hmac-only" : null,
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
    signaturePosture: decision.signaturePosture,
    keyIdentityRef: decision.keyIdentityRef,
    verificationPolicyRef: decision.verificationPolicyRef,
    consumedAt: null,
    consumedByGateAttemptId: null,
  });
}

export async function commitPolicyEvaluation(
  recorder: ProtocolRecorder,
  plan: PolicyCommitPlan,
): Promise<PolicyCommitResult> {
  if (!plan.greenlight) {
    const refusal = await commitPolicyDecisionOnly(recorder, plan);
    return { status: "committed", refusal };
  }
  return commitGreenlightPolicyDecision(recorder, plan, plan.greenlight);
}

async function commitPolicyDecisionOnly(recorder: ProtocolRecorder, plan: PolicyCommitPlan): Promise<Refusal | null> {
  const { contract, decision } = plan;
  const refusal =
    decision.decision === "review_required"
      ? null
      : await buildRefusal({
          tenantId: contract.tenantId,
          organizationId: contract.organizationId,
          createdAt: plan.now,
          phase: "policy",
          actionContractId: contract.actionContractId,
          policyDecisionId: decision.policyDecisionId,
          refusedObjectRef: protocolObjectRef("policy_decision", decision.policyDecisionId),
          reasonCode: decision.decisionReasonCode,
          reason: decision.decisionReason,
          evidenceRefs: [
            protocolObjectRef("action_contract", contract.actionContractId),
            protocolObjectRef("policy_decision", decision.policyDecisionId),
            decision.policyInputDigest,
          ],
          refusedAt: plan.now,
        });
  await recorder.commitRecordsWithEvents(
    [
      { objectType: "policy_decision", payload: decision },
      ...(refusal ? ([{ objectType: "refusal", payload: refusal }] as const) : []),
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
        source: refusal ?? decision,
        eventType: decision.decision === "review_required" ? "review_required" : "action_refused",
        objectRefs: [...(refusal ? [refusal.refusalId] : []), decision.policyDecisionId, contract.actionContractId],
        streamRefs: actionLifecycleStreamRefs(contract),
        payload: { reasonCode: decision.decisionReasonCode },
      },
    ],
  );
  return refusal;
}

async function commitGreenlightPolicyDecision(
  recorder: ProtocolRecorder,
  plan: PolicyCommitPlan,
  greenlight: Greenlight,
): Promise<PolicyCommitResult> {
  const { contract, decision } = plan;
  const records = [
    { objectType: "policy_decision", payload: decision },
    { objectType: "greenlight", payload: greenlight },
    ...(plan.idempotencyLedgerEntry
      ? ([{ objectType: "idempotency_ledger_entry", payload: plan.idempotencyLedgerEntry }] as const)
      : []),
  ] as const;
  const commitResult = await recorder.tryCommitRecordsWithEvents(
    [...records],
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
      ...(plan.idempotencyLedgerEntry
        ? [
            {
              source: plan.idempotencyLedgerEntry,
              eventType: "idempotency_ledger_recorded" as const,
              objectRefs: [
                plan.idempotencyLedgerEntry.idempotencyLedgerEntryId,
                plan.idempotencyLedgerEntry.ledgerKeyDigest,
                contract.actionContractId,
              ],
              streamRefs: actionLifecycleStreamRefs(contract),
              payload: {
                ledgerState: plan.idempotencyLedgerEntry.ledgerState,
                reasonCode: plan.idempotencyLedgerEntry.reasonCode,
              },
            },
          ]
        : []),
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
      idempotencyLedgerReservationEntries: plan.idempotencyLedgerEntry
        ? [idempotencyLedgerIndexEntry(plan.idempotencyLedgerEntry)]
        : [],
    },
  );
  return { status: commitResult.status, refusal: null };
}
