import { signCanonicalHmac } from "../../../foundation/canonical";
import { HandshakeProtocolError } from "../../../foundation/errors";
import type { ActionContract } from "../../action-contract";
import { idempotencyLedgerIndexEntry, type IdempotencyLedgerEntry } from "../../idempotency-ledger";
import type { OperatingEnvelope } from "../../catalog-envelope";
import { actionLifecycleStreamRefs } from "../../../events/chains";
import { createId } from "../../../foundation/ids";
import type { ProtocolRecorder } from "../../../events/records";
import type { ProtectedPathPosture } from "../../protected-path-posture";
import { ProofGapSchema, type ProofGap } from "../../proof-gap";
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
  | { status: "committed"; refusal: Refusal | null; proofGap: ProofGap | null }
  | { status: "greenlight_issuance_conflict"; refusal: null; proofGap: null }
  | { status: "idempotency_ledger_conflict"; refusal: null; proofGap: null };

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
  idempotencyLedgerKeyDigest: `sha256:${string}`,
  idempotencyKey = contract.idempotencyKey,
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
    gatewayRegistryDigest: contract.gatewayRegistryDigest,
    gatewayRegistryVersion: contract.gatewayRegistryVersion,
    gatewayId: contract.gatewayId,
    gatewayPolicyVersion: contract.gatewayPolicyVersion,
    policyVersionRef: stringParameter(contract, "policyVersionRef"),
    policyVersionDigest: digestParameter(contract, "policyVersionDigest"),
    gatewayReadinessRef: stringParameter(contract, "gatewayReadinessRef"),
    gatewayReadinessDigest: digestParameter(contract, "gatewayReadinessDigest"),
    actionClass: contract.actionClass,
    resourceRef: contract.resourceRef,
    requiredProtectedPathState: contract.requiredProtectedPathState,
    protectedPathPostureId: protectedPathPosture?.payload.protectedPathPostureId ?? null,
    protectedPathPostureDigest: protectedPathPosture?.payload.postureDigest ?? null,
    gatewayCredentialRefIds: contract.gatewayCredentialRefs.map((ref) => ref.gatewayCredentialRefId),
    gatewayCredentialRefDigests: contract.gatewayCredentialRefs.map((ref) => ref.gatewayCredentialRefDigest),
    delegatedAuthorityRefIds: contract.delegatedAuthorityRefs.map((ref) => ref.delegatedAuthorityRefId),
    delegatedAuthorityRefDigests: contract.delegatedAuthorityRefs.map((ref) => ref.delegatedAuthorityRefDigest),
    paramsDigest: contract.paramsDigest,
    contractDigest: contract.actionContractDigest,
    idempotencyKey,
    idempotencyLedgerKeyDigest,
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
    const { refusal, proofGap } = await commitPolicyDecisionOnly(recorder, plan);
    return { status: "committed", refusal, proofGap };
  }
  return commitGreenlightPolicyDecision(recorder, plan, plan.greenlight);
}

async function commitPolicyDecisionOnly(
  recorder: ProtocolRecorder,
  plan: PolicyCommitPlan,
): Promise<{ refusal: Refusal | null; proofGap: ProofGap | null }> {
  const { contract, decision } = plan;
  const refusal =
    decision.decision === "review_required" || decision.decision === "proof_gap"
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
  const proofGap = decision.decision === "proof_gap" ? buildPolicyProofGap(contract, decision, plan.now) : null;
  await recorder.commitRecordsWithEvents(
    [
      { objectType: "policy_decision", payload: decision },
      ...(refusal ? ([{ objectType: "refusal", payload: refusal }] as const) : []),
      ...(proofGap ? ([{ objectType: "proof_gap", payload: proofGap }] as const) : []),
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
        source: proofGap ?? refusal ?? decision,
        eventType:
          decision.decision === "review_required"
            ? "review_required"
            : decision.decision === "proof_gap"
              ? "proof_gap_recorded"
              : "action_refused",
        objectRefs: [
          ...(refusal ? [refusal.refusalId] : []),
          ...(proofGap ? [proofGap.proofGapId] : []),
          decision.policyDecisionId,
          contract.actionContractId,
        ],
        streamRefs: actionLifecycleStreamRefs(contract),
        payload: proofGap
          ? { reasonCode: decision.decisionReasonCode, finalityImpact: proofGap.finalityImpact }
          : { reasonCode: decision.decisionReasonCode },
      },
    ],
  );
  return { refusal, proofGap };
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
  if (commitResult.status === "record_digest_conflict") {
    throw new HandshakeProtocolError(
      "bootstrap_record_digest_conflict",
      "Policy commit cannot replace an existing record with a different canonical digest.",
      409,
    );
  }
  return { status: commitResult.status, refusal: null, proofGap: null };
}

function buildPolicyProofGap(contract: ActionContract, decision: PolicyDecision, now: string): ProofGap {
  return ProofGapSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: contract.tenantId,
    organizationId: contract.organizationId,
    createdAt: now,
    proofGapId: createId("gap"),
    gapPhase: "policy",
    expectedEvidenceType: "exact_protected_action_policy_binding",
    missingOrInvalidEvidenceRef: decision.decisionReasonCode,
    affectedObjectRefs: [contract.actionContractId, decision.policyDecisionId],
    gateAttemptId: null,
    mutationAttemptId: null,
    receiptId: null,
    reasonCode: decision.decisionReasonCode,
    finalityImpact: "invalid",
    recoveryRequirement:
      "Create a new exact action contract with trusted readiness, policy-version, credential, and idempotency bindings before policy can greenlight.",
    resolvedAt: null,
    resolvedByRef: null,
  });
}

function stringParameter(contract: ActionContract, key: string): string | null {
  const value = contract.parameters[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function digestParameter(contract: ActionContract, key: string): `sha256:${string}` | null {
  const value = stringParameter(contract, key);
  return value && /^sha256:[a-f0-9]{64}$/.test(value) ? (value as `sha256:${string}`) : null;
}
