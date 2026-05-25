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
import { evaluateDelegatedAuthorityBindings, type DelegatedAuthorityBindingEvaluation } from "../delegated-authority";
import type { ProtectedPathPosture } from "../protected-path-posture";
import type { ProtocolRecorder } from "../../events/records";
import type { ReviewDecision } from "../review-binding";
import {
  evaluateSequenceDependencies,
  loadSequenceDependencyStates,
  type SequenceDependencyState,
} from "./sequence-dependencies";
import { type Greenlight, type PolicyDecision } from "./types";
import type { JsonValue } from "./types";
import { guardGreenlightIssuance, guardPolicyEvaluation } from "./guards";
import type { TransitionGuardResult } from "../../foundation/transition-guards";
import type { ProtocolStore, StoredProtocolRecord } from "../../store/port";
import { isolationScopeRefsForContract } from "../object-registry";
import type { ProofGap } from "../proof-gap";
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
  delegatedAuthorityBindingEvaluation: DelegatedAuthorityBindingEvaluation;
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
    delegatedAuthorityRefs: DelegatedAuthorityBindingEvaluation["policyInput"];
    protectedPathPosture: ReturnType<typeof protectedPathPolicyInput>;
    idempotencyLedger: {
      ledgerKeyDigest: `sha256:${string}`;
      existingLedgerEntryId: string | null;
      existingLedgerState: IdempotencyLedgerEntry["ledgerState"] | null;
      paramsDigestMatch: boolean | null;
    };
    exactProtectedAction: ExactProtectedActionPolicyInput | null;
  };
  policyInputDigest: `sha256:${string}`;
  isolationSnapshot: string;
};

type ExactProtectedActionPolicyInput = {
  actionTypeId: string;
  actionTypeDigest: string;
  actionClass: string;
  protectedSurfaceKind: string;
  gatewayRegistryDigest: string;
  gatewayPolicyVersion: string;
  policyVersionRef: string | null;
  policyVersionDigest: string | null;
  gatewayReadinessRef: string | null;
  gatewayReadinessDigest: string | null;
  paymentRequirementsDigest: string | null;
  selectedPaymentRequirementDigest: string | null;
  atomicAmount: string | null;
  maxAtomicAmountPerCall: string | null;
  gatewayCredentialRefDigests: string[];
  delegatedAuthorityRefDigests: string[];
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
  proofGapRef: string | null;
  proofGapReasonCode: string | null;
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
  return policyEvaluationResponse(decision, greenlight, commitResult.refusal, commitResult.proofGap);
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
  const delegatedAuthorityBindingEvaluation = await evaluateDelegatedAuthorityBindings(
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
    delegatedAuthorityBindingEvaluation,
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
    delegatedAuthorityBindingEvaluation,
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
  delegatedAuthorityBindingEvaluation: DelegatedAuthorityBindingEvaluation,
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
    delegatedAuthorityRefs: delegatedAuthorityBindingEvaluation.policyInput,
    protectedPathPosture: protectedPathPolicyInput(protectedPathPosture, context.now),
    idempotencyLedger: {
      ledgerKeyDigest,
      existingLedgerEntryId: idempotencyLedgerEntry?.payload.idempotencyLedgerEntryId ?? null,
      existingLedgerState: idempotencyLedgerEntry?.payload.ledgerState ?? null,
      paramsDigestMatch: idempotencyLedgerEntry
        ? idempotencyLedgerEntry.payload.paramsDigest === context.contract.paramsDigest
        : null,
    },
    exactProtectedAction: exactProtectedActionPolicyInput(context.contract),
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
  decisionValue = applyDelegatedAuthorityPolicy(decisionValue, constraints);
  decisionValue = applyGatewayCredentialRefPolicy(decisionValue, constraints);
  decisionValue = applyExactProtectedActionPolicy(decisionValue, constraints);
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
    decisionValue = applyDelegatedAuthorityPolicy(decisionValue, constraints);
    decisionValue = applyGatewayCredentialRefPolicy(decisionValue, constraints);
    decisionValue = applyExactProtectedActionPolicy(decisionValue, constraints);
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
  return policyEvaluationResponse(decision, null, commitResult.refusal, commitResult.proofGap);
}

function policyEvaluationResponse(
  decision: PolicyDecision,
  greenlight: Greenlight | null,
  refusal: Refusal | null,
  proofGap: ProofGap | null,
): PolicyEvaluationResponse {
  const policyDecisionRef = protocolObjectRef("policy_decision", decision.policyDecisionId);
  const greenlightObjectRef = greenlight ? protocolObjectRef("greenlight", greenlight.greenlightId) : null;
  const refusalObjectRef = refusal ? protocolObjectRef("refusal", refusal.refusalId) : null;
  const proofGapObjectRef = proofGap ? protocolObjectRef("proof_gap", proofGap.proofGapId) : null;
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
    proofGapRef: proofGap?.proofGapId ?? null,
    proofGapReasonCode: proofGap?.reasonCode ?? null,
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
      proofGapObjectRef,
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

function applyDelegatedAuthorityPolicy(
  decisionValue: PolicyEvaluationResult,
  constraints: PolicyConstraintEvaluation,
): PolicyEvaluationResult {
  if (decisionValue.decision !== "greenlight" || constraints.delegatedAuthorityBindingEvaluation.ok) {
    return decisionValue;
  }
  return {
    decision: "refuse",
    reasonCode: constraints.delegatedAuthorityBindingEvaluation.reasonCode,
    reason: constraints.delegatedAuthorityBindingEvaluation.reason,
    matchedRuleIds: ["delegated_authority_ref_required"],
  };
}

function applyExactProtectedActionPolicy(
  decisionValue: PolicyEvaluationResult,
  constraints: PolicyConstraintEvaluation,
): PolicyEvaluationResult {
  if (decisionValue.decision !== "greenlight" || !exactProtectedActionPolicyApplies(constraints.contract)) {
    return decisionValue;
  }

  const failure = evaluateExactProtectedActionPolicyContract(constraints.contract);
  if (!failure) return decisionValue;
  return {
    decision: failure.decision,
    reasonCode: failure.reasonCode,
    reason: failure.reason,
    matchedRuleIds: ["exact_protected_action_policy_binding"],
  };
}

function evaluateExactProtectedActionPolicyContract(
  contract: ActionContract,
): { decision: "refuse" | "proof_gap"; reasonCode: string; reason: string } | null {
  if (contract.gatewayCredentialRefs.length !== 1) {
    return {
      decision: "proof_gap",
      reasonCode: "protected_action_policy_credential_binding_missing",
      reason: "Exact protected-action policy requires exactly one bound gateway credential ref.",
    };
  }
  if (contract.delegatedAuthorityRefs.length !== 1) {
    return {
      decision: "proof_gap",
      reasonCode: "protected_action_policy_delegated_authority_missing",
      reason: "Exact protected-action policy requires exactly one delegated authority ref.",
    };
  }

  const readinessRef = stringParameter(contract.parameters, "gatewayReadinessRef");
  const readinessDigest = digestParameter(contract.parameters, "gatewayReadinessDigest");
  const readinessBound = digestParameter(contract.bounds, "gatewayReadinessDigest");
  if (!readinessRef || !readinessDigest) {
    return {
      decision: "proof_gap",
      reasonCode: "protected_action_policy_readiness_binding_missing",
      reason: "Exact protected-action policy requires trusted runtime-side gateway readiness ref and digest.",
    };
  }
  if (readinessBound && readinessBound !== readinessDigest) {
    return {
      decision: "refuse",
      reasonCode: "protected_action_policy_readiness_binding_mismatch",
      reason: "Exact protected-action readiness digest drifted between parameters and bounds.",
    };
  }

  const policyVersionRef = stringParameter(contract.parameters, "policyVersionRef");
  const policyVersionDigest = digestParameter(contract.parameters, "policyVersionDigest");
  const policyVersionBound = digestParameter(contract.bounds, "policyVersionDigest");
  if (!policyVersionRef || !policyVersionDigest) {
    return {
      decision: "proof_gap",
      reasonCode: "protected_action_policy_version_binding_missing",
      reason: "Exact protected-action policy requires trusted runtime-side policy version ref and digest.",
    };
  }
  if (policyVersionBound && policyVersionBound !== policyVersionDigest) {
    return {
      decision: "refuse",
      reasonCode: "protected_action_policy_version_binding_mismatch",
      reason: "Exact protected-action policy-version digest drifted between parameters and bounds.",
    };
  }

  const paymentRequirementsDigest = digestParameter(contract.parameters, "paymentRequirementsDigest");
  if (!paymentRequirementsDigest) {
    return {
      decision: "proof_gap",
      reasonCode: "protected_action_policy_payment_requirement_binding_missing",
      reason: "Exact protected-action policy requires payment requirement evidence to be digest-bound.",
    };
  }

  const atomicAmount = atomicStringParameter(contract.parameters, "atomicAmount");
  const maxAtomicAmountPerCall = atomicStringParameter(contract.bounds, "maxAtomicAmountPerCall");
  if (!atomicAmount || !maxAtomicAmountPerCall) {
    return {
      decision: "proof_gap",
      reasonCode: "protected_action_policy_amount_binding_missing",
      reason: "Exact protected-action policy requires atomicAmount and maxAtomicAmountPerCall before greenlight.",
    };
  }
  if (compareAtomic(atomicAmount, maxAtomicAmountPerCall) > 0) {
    return {
      decision: "refuse",
      reasonCode: "protected_action_policy_amount_exceeds_action_bound",
      reason: "Exact protected-action atomic amount exceeds the per-call policy bound.",
    };
  }

  return null;
}

function buildGreenlightFromDecision(decision: PolicyDecision, constraints: PolicyConstraintEvaluation): Greenlight {
  return buildGreenlight(
    constraints.contract,
    decision,
    constraints.now,
    constraints.protectedPathPosture,
    constraints.policyInput.idempotencyLedger.ledgerKeyDigest,
  );
}

function exactProtectedActionPolicyInput(contract: ActionContract): ExactProtectedActionPolicyInput | null {
  if (!exactProtectedActionPolicyApplies(contract)) return null;
  return {
    actionTypeId: contract.actionTypeId,
    actionTypeDigest: contract.actionTypeDigest,
    actionClass: contract.actionClass,
    protectedSurfaceKind: contract.protectedSurfaceKind,
    gatewayRegistryDigest: contract.gatewayRegistryDigest,
    gatewayPolicyVersion: contract.gatewayPolicyVersion,
    policyVersionRef: stringParameter(contract.parameters, "policyVersionRef"),
    policyVersionDigest: stringParameter(contract.parameters, "policyVersionDigest"),
    gatewayReadinessRef: stringParameter(contract.parameters, "gatewayReadinessRef"),
    gatewayReadinessDigest: stringParameter(contract.parameters, "gatewayReadinessDigest"),
    paymentRequirementsDigest: stringParameter(contract.parameters, "paymentRequirementsDigest"),
    selectedPaymentRequirementDigest: stringParameter(contract.parameters, "selectedPaymentRequirementDigest"),
    atomicAmount: stringParameter(contract.parameters, "atomicAmount"),
    maxAtomicAmountPerCall: stringParameter(contract.bounds, "maxAtomicAmountPerCall"),
    gatewayCredentialRefDigests: contract.gatewayCredentialRefs.map((ref) => ref.gatewayCredentialRefDigest).sort(),
    delegatedAuthorityRefDigests: contract.delegatedAuthorityRefs.map((ref) => ref.delegatedAuthorityRefDigest).sort(),
  };
}

function exactProtectedActionPolicyApplies(contract: ActionContract): boolean {
  return (
    hasParameter(contract.parameters, "gatewayReadinessRef") ||
    hasParameter(contract.parameters, "gatewayReadinessDigest") ||
    hasParameter(contract.parameters, "policyVersionRef") ||
    hasParameter(contract.parameters, "policyVersionDigest") ||
    hasParameter(contract.parameters, "paymentRequirementsDigest")
  );
}

function hasParameter(parameters: Record<string, JsonValue>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(parameters, key);
}

function stringParameter(parameters: Record<string, JsonValue>, key: string): string | null {
  const value = parameters[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function digestParameter(parameters: Record<string, JsonValue>, key: string): `sha256:${string}` | null {
  const value = stringParameter(parameters, key);
  return value && /^sha256:[a-f0-9]{64}$/.test(value) ? (value as `sha256:${string}`) : null;
}

function atomicStringParameter(parameters: Record<string, JsonValue>, key: string): string | null {
  const value = stringParameter(parameters, key);
  return value && /^(?:0|[1-9]\d*)$/.test(value) ? value : null;
}

function compareAtomic(left: string, right: string): number {
  const leftValue = BigInt(left);
  const rightValue = BigInt(right);
  return leftValue === rightValue ? 0 : leftValue > rightValue ? 1 : -1;
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
