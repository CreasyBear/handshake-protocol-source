import { digestCanonical } from "../../foundation/canonical";
import type { ActionContract } from "../action-contract";
import type { OperatingEnvelope } from "../catalog-envelope";
import { HandshakeProtocolError } from "../../foundation/errors";
import { nowIso } from "../../foundation/ids";
import {
  buildIdempotencyLedgerReservation,
  idempotencyConflictDecisionValue,
  idempotencyLedgerKey,
  idempotencyLedgerKeyDigest,
  type IdempotencyLedgerEntry,
} from "../idempotency-ledger";
import { EvaluatePolicyInputSchema, type EvaluatePolicyInput } from "./types";
import {
  evaluateDeterministicPolicy,
  isolationSnapshotRef,
  reviewDecisionAllowsGreenlight,
  type PolicyEvaluationResult,
} from "./policy";
import {
  evaluateRequiredProtectedPathPosture,
  loadCurrentPostureForContract,
  protectedPathPolicyInput,
} from "../protected-path-posture";
import { evaluateGatewayCredentialBindings, type GatewayCredentialBindingEvaluation } from "../credential-custody";
import type { ProtectedPathPosture } from "../protected-path-posture";
import type { ProtocolRecorder } from "../../events/records";
import type { ReviewDecision } from "../review-binding";
import {
  evaluateSequenceDependencies,
  loadSequenceDependencyStates,
  type SequenceDependencyState,
} from "./sequence-dependencies";
import { type Greenlight, type PolicyDecision } from "./types";
import { guardGreenlightIssuance, guardPolicyEvaluation } from "./guards";
import type { TransitionGuardResult } from "../../foundation/transition-guards";
import type { ProtocolStore, StoredProtocolRecord } from "../../store/port";
import { isolationScopeRefsForContract } from "../object-registry";
import { protocolObjectRef, type Refusal } from "../refusal";
import { buildGreenlight, buildPolicyDecision, commitPolicyEvaluation } from "./policy-record";

type ParsedEvaluatePolicyInput = ReturnType<typeof EvaluatePolicyInputSchema.parse>;

type PolicyEvaluationContext = {
  input: ParsedEvaluatePolicyInput;
  contractRecord: StoredProtocolRecord<ActionContract>;
  envelopeRecord: StoredProtocolRecord<OperatingEnvelope>;
  contract: ActionContract;
  envelope: OperatingEnvelope;
  now: string;
};

type PolicyConstraintEvaluation = PolicyEvaluationContext & {
  isolationStates: Awaited<ReturnType<ProtocolStore["listIsolationStates"]>>;
  sequenceDependencyStates: SequenceDependencyState[];
  protectedPathPosture: StoredProtocolRecord<ProtectedPathPosture> | null;
  idempotencyLedgerEntry: StoredProtocolRecord<IdempotencyLedgerEntry> | null;
  protectedPathEvaluation: ReturnType<typeof evaluateRequiredProtectedPathPosture>;
  gatewayCredentialBindingEvaluation: GatewayCredentialBindingEvaluation;
  policyInput: {
    contractDigest: string;
    envelopeId: string;
    envelopePolicyPackVersion: string;
    isolationStateIds: string[];
    sequenceDependencyStates: SequenceDependencyState[];
    requiredProtectedPathState: ActionContract["requiredProtectedPathState"];
    gatewayEnforcementMode: ActionContract["enforcementMode"];
    credentialCustodyStatus: ActionContract["credentialCustodyStatus"];
    gatewayCredentialRefs: GatewayCredentialBindingEvaluation["policyInput"];
    protectedPathPosture: ReturnType<typeof protectedPathPolicyInput>;
    idempotencyLedger: {
      ledgerKeyDigest: `sha256:${string}`;
      existingLedgerEntryId: string | null;
      existingLedgerState: IdempotencyLedgerEntry["ledgerState"] | null;
      paramsDigestMatch: boolean | null;
    };
  };
  policyInputDigest: `sha256:${string}`;
  isolationSnapshot: string;
};

export type PolicyEvaluationResponse = {
  decision: PolicyDecision;
  greenlight: Greenlight | null;
  authorityCreated: boolean;
  gatewayCheckPerformed: false;
  mutationAttempted: false;
  policyDecisionRef: string;
  greenlightRef: string | null;
  refusalRef: string | null;
  refusalReasonCode: string | null;
  reviewRequired: boolean;
  nextAction: "use_greenlight_at_gateway" | "read_evidence" | "request_review";
  retryability: "not_retryable";
  evidenceRefs: string[];
};

export async function evaluatePolicy(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  inputValue: EvaluatePolicyInput,
): Promise<PolicyEvaluationResponse> {
  const input = EvaluatePolicyInputSchema.parse(inputValue);
  const context = await getPolicyEvaluationContext(recorder, input);
  assertTransition(guardPolicyEvaluation(context.contract, context.envelope));
  const constraints = await derivePolicyConstraintEvaluation(store, context);
  const decisionValue = await resolvePolicyDecisionValue(recorder, constraints);
  const decision = await buildPolicyDecision(
    input,
    context.contract,
    context.envelope,
    decisionValue,
    constraints.policyInputDigest,
    constraints.isolationSnapshot,
    context.now,
  );
  const greenlight = decision.decision === "greenlight" ? buildGreenlightFromDecision(decision, constraints) : null;
  const idempotencyLedgerEntry = greenlight
    ? await buildIdempotencyLedgerReservation({
        contract: context.contract,
        policyDecision: decision,
        greenlight,
        now: context.now,
      })
    : null;
  const plan = { ...constraints, decisionValue, decision, greenlight, idempotencyLedgerEntry };
  if (greenlight) {
    await assertGreenlightIssuable(store, context.contract);
  }
  const commitResult = await commitPolicyEvaluation(recorder, plan);
  if (commitResult.status === "idempotency_ledger_conflict") {
    return commitIdempotencyConflictRefusal(store, recorder, constraints);
  }
  return policyEvaluationResponse(decision, greenlight, commitResult.refusal);
}

async function getPolicyEvaluationContext(
  recorder: ProtocolRecorder,
  input: ParsedEvaluatePolicyInput,
): Promise<PolicyEvaluationContext> {
  const contract = await recorder.requiredRecord<ActionContract>(
    "action_contract",
    input.actionContractId,
    "contract_missing",
  );
  const envelope = await recorder.requiredRecord<OperatingEnvelope>(
    "operating_envelope",
    input.envelopeId,
    "envelope_missing",
  );
  return {
    input,
    contractRecord: contract,
    envelopeRecord: envelope,
    contract: contract.payload,
    envelope: envelope.payload,
    now: nowIso(),
  };
}

async function derivePolicyConstraintEvaluation(
  store: ProtocolStore,
  context: PolicyEvaluationContext,
): Promise<PolicyConstraintEvaluation> {
  const isolationStates = await store.listIsolationStates(isolationScopeRefsForContract(context.contract));
  const sequenceDependencyStates = await loadSequenceDependencyStates(store, context.contract);
  const protectedPathPosture = await loadCurrentPostureForContract(store, context.contract);
  const ledgerKeyDigest = await idempotencyLedgerKeyDigest(idempotencyLedgerKey(context.contract));
  const idempotencyLedgerEntry = await store.getCurrentIdempotencyLedgerEntry(ledgerKeyDigest);
  const protectedPathEvaluation = evaluateRequiredProtectedPathPosture({
    contract: context.contract,
    gateway: context.contract,
    posture: protectedPathPosture,
    now: context.now,
  });
  const gatewayCredentialBindingEvaluation = await evaluateGatewayCredentialBindings(
    store,
    context.contract,
    context.now,
  );
  const policyInput = buildPolicyInput(
    context,
    isolationStates,
    sequenceDependencyStates,
    protectedPathPosture,
    ledgerKeyDigest,
    idempotencyLedgerEntry,
    gatewayCredentialBindingEvaluation,
  );
  const policyInputDigest = await digestCanonical(policyInput);
  return {
    ...context,
    isolationStates,
    sequenceDependencyStates,
    protectedPathPosture,
    idempotencyLedgerEntry,
    protectedPathEvaluation,
    gatewayCredentialBindingEvaluation,
    policyInput,
    policyInputDigest,
    isolationSnapshot: isolationSnapshotRef(isolationStates),
  };
}

function buildPolicyInput(
  context: PolicyEvaluationContext,
  isolationStates: PolicyConstraintEvaluation["isolationStates"],
  sequenceDependencyStates: SequenceDependencyState[],
  protectedPathPosture: StoredProtocolRecord<ProtectedPathPosture> | null,
  ledgerKeyDigest: `sha256:${string}`,
  idempotencyLedgerEntry: StoredProtocolRecord<IdempotencyLedgerEntry> | null,
  gatewayCredentialBindingEvaluation: GatewayCredentialBindingEvaluation,
): PolicyConstraintEvaluation["policyInput"] {
  return {
    contractDigest: context.contract.actionContractDigest,
    envelopeId: context.envelope.envelopeId,
    envelopePolicyPackVersion: context.envelope.policyPackVersion,
    isolationStateIds: isolationStates.map((state) => state.isolationStateId).sort(),
    sequenceDependencyStates,
    requiredProtectedPathState: context.contract.requiredProtectedPathState,
    gatewayEnforcementMode: context.contract.enforcementMode,
    credentialCustodyStatus: context.contract.credentialCustodyStatus,
    gatewayCredentialRefs: gatewayCredentialBindingEvaluation.policyInput,
    protectedPathPosture: protectedPathPolicyInput(protectedPathPosture, context.now),
    idempotencyLedger: {
      ledgerKeyDigest,
      existingLedgerEntryId: idempotencyLedgerEntry?.payload.idempotencyLedgerEntryId ?? null,
      existingLedgerState: idempotencyLedgerEntry?.payload.ledgerState ?? null,
      paramsDigestMatch: idempotencyLedgerEntry
        ? idempotencyLedgerEntry.payload.paramsDigest === context.contract.paramsDigest
        : null,
    },
  };
}

async function resolvePolicyDecisionValue(
  recorder: ProtocolRecorder,
  constraints: PolicyConstraintEvaluation,
): Promise<PolicyEvaluationResult> {
  let decisionValue = evaluateDeterministicPolicy(
    constraints.contract,
    constraints.envelope,
    constraints.isolationStates,
    constraints.now,
  );
  if (decisionValue.decision === "greenlight") {
    decisionValue = evaluateSequenceDependencies(constraints.sequenceDependencyStates) ?? decisionValue;
  }
  decisionValue = applyProtectedPathPolicy(decisionValue, constraints);
  decisionValue = applyGatewayCredentialRefPolicy(decisionValue, constraints);
  decisionValue = applyIdempotencyLedgerPolicy(decisionValue, constraints);
  if (decisionValue.decision === "review_required" && constraints.input.reviewDecisionId) {
    const reviewDecision = await recorder.requiredRecord<ReviewDecision>(
      "review_decision",
      constraints.input.reviewDecisionId,
      "review_decision_missing",
    );
    decisionValue = reviewDecisionAllowsGreenlight(
      reviewDecision.payload,
      constraints.contract,
      constraints.policyInputDigest,
      constraints.now,
    )
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
    decisionValue = applyProtectedPathPolicy(decisionValue, constraints);
    decisionValue = applyGatewayCredentialRefPolicy(decisionValue, constraints);
    decisionValue = applyIdempotencyLedgerPolicy(decisionValue, constraints);
  }
  return decisionValue;
}

function applyIdempotencyLedgerPolicy(
  decisionValue: PolicyEvaluationResult,
  constraints: PolicyConstraintEvaluation,
): PolicyEvaluationResult {
  if (decisionValue.decision !== "greenlight" || !constraints.idempotencyLedgerEntry) return decisionValue;
  return idempotencyConflictDecisionValue(constraints.contract, constraints.idempotencyLedgerEntry.payload);
}

async function commitIdempotencyConflictRefusal(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  constraints: PolicyConstraintEvaluation,
): Promise<PolicyEvaluationResponse> {
  const ledgerKeyDigest = await idempotencyLedgerKeyDigest(idempotencyLedgerKey(constraints.contract));
  const current = await store.getCurrentIdempotencyLedgerEntry(ledgerKeyDigest);
  const decisionValue = current
    ? idempotencyConflictDecisionValue(constraints.contract, current.payload)
    : {
        decision: "refuse" as const,
        reasonCode: "idempotency_duplicate_authority",
        reason: "Idempotency ledger reservation raced with this policy evaluation; fresh authority is refused.",
        matchedRuleIds: ["idempotency_ledger_duplicate_authority"],
      };
  const decision = await buildPolicyDecision(
    constraints.input,
    constraints.contract,
    constraints.envelope,
    decisionValue,
    constraints.policyInputDigest,
    constraints.isolationSnapshot,
    constraints.now,
  );
  const commitResult = await commitPolicyEvaluation(recorder, {
    ...constraints,
    decision,
    greenlight: null,
    idempotencyLedgerEntry: null,
  });
  if (commitResult.status !== "committed") {
    throw new HandshakeProtocolError(
      "idempotency_refusal_commit_conflict",
      "Idempotency conflict refusal could not be committed.",
      409,
      {
        retryability: "retryable",
        commitState: "not_committed",
      },
    );
  }
  return policyEvaluationResponse(decision, null, commitResult.refusal);
}

function policyEvaluationResponse(
  decision: PolicyDecision,
  greenlight: Greenlight | null,
  refusal: Refusal | null,
): PolicyEvaluationResponse {
  const policyDecisionRef = protocolObjectRef("policy_decision", decision.policyDecisionId);
  const greenlightObjectRef = greenlight ? protocolObjectRef("greenlight", greenlight.greenlightId) : null;
  const refusalObjectRef = refusal ? protocolObjectRef("refusal", refusal.refusalId) : null;
  return {
    decision,
    greenlight,
    authorityCreated: Boolean(greenlight),
    gatewayCheckPerformed: false,
    mutationAttempted: false,
    policyDecisionRef,
    greenlightRef: greenlight?.greenlightId ?? null,
    refusalRef: refusal?.refusalId ?? null,
    refusalReasonCode: refusal?.reasonCode ?? null,
    reviewRequired: decision.decision === "review_required",
    nextAction: greenlight
      ? "use_greenlight_at_gateway"
      : decision.decision === "review_required"
        ? "request_review"
        : "read_evidence",
    retryability: "not_retryable",
    evidenceRefs: [
      protocolObjectRef("action_contract", decision.actionContractId),
      policyDecisionRef,
      greenlightObjectRef,
      refusalObjectRef,
      decision.policyInputDigest,
    ].filter((ref): ref is string => typeof ref === "string"),
  };
}

function applyProtectedPathPolicy(
  decisionValue: PolicyEvaluationResult,
  constraints: PolicyConstraintEvaluation,
): PolicyEvaluationResult {
  if (decisionValue.decision !== "greenlight" || constraints.protectedPathEvaluation.ok) {
    return decisionValue;
  }
  return {
    decision: "refuse",
    reasonCode: constraints.protectedPathEvaluation.reasonCode,
    reason: constraints.protectedPathEvaluation.reason,
    matchedRuleIds: ["protected_path_posture_required"],
  };
}

function applyGatewayCredentialRefPolicy(
  decisionValue: PolicyEvaluationResult,
  constraints: PolicyConstraintEvaluation,
): PolicyEvaluationResult {
  if (decisionValue.decision !== "greenlight" || constraints.gatewayCredentialBindingEvaluation.ok) {
    return decisionValue;
  }
  return {
    decision: "refuse",
    reasonCode: constraints.gatewayCredentialBindingEvaluation.reasonCode,
    reason: constraints.gatewayCredentialBindingEvaluation.reason,
    matchedRuleIds: ["gateway_credential_ref_required"],
  };
}

function buildGreenlightFromDecision(decision: PolicyDecision, constraints: PolicyConstraintEvaluation): Greenlight {
  return buildGreenlight(constraints.contract, decision, constraints.now, constraints.protectedPathPosture);
}

async function assertGreenlightIssuable(store: ProtocolStore, contract: ActionContract): Promise<void> {
  const existingGreenlights = await store.listRecordsByType<Greenlight>("greenlight", {
    tenantId: contract.tenantId,
    organizationId: contract.organizationId,
  });
  assertTransition(
    guardGreenlightIssuance(
      contract,
      existingGreenlights.map((record) => record.payload),
    ),
  );
}

function assertTransition(result: TransitionGuardResult): void {
  if (!result.ok) {
    throw new HandshakeProtocolError(result.code, result.message, result.status);
  }
}
