import { digestCanonical } from "../../foundation/canonical";
import type { ActionContract } from "../action-contract";
import type { OperatingEnvelope } from "../catalog-envelope";
import { HandshakeProtocolError } from "../../foundation/errors";
import { nowIso } from "../../foundation/ids";
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
  protectedPathEvaluation: ReturnType<typeof evaluateRequiredProtectedPathPosture>;
  policyInput: {
    contractDigest: string;
    envelopeId: string;
    envelopePolicyPackVersion: string;
    isolationStateIds: string[];
    sequenceDependencyStates: SequenceDependencyState[];
    requiredProtectedPathState: ActionContract["requiredProtectedPathState"];
    gatewayEnforcementMode: ActionContract["enforcementMode"];
    credentialCustodyStatus: ActionContract["credentialCustodyStatus"];
    protectedPathPosture: ReturnType<typeof protectedPathPolicyInput>;
  };
  policyInputDigest: `sha256:${string}`;
  isolationSnapshot: string;
};

export async function evaluatePolicy(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  inputValue: EvaluatePolicyInput,
): Promise<{ decision: PolicyDecision; greenlight: Greenlight | null }> {
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
  const plan = { ...constraints, decisionValue, decision, greenlight };
  if (greenlight) {
    await assertGreenlightIssuable(store, context.contract);
  }
  await commitPolicyEvaluation(recorder, plan);
  return { decision, greenlight };
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
  const protectedPathEvaluation = evaluateRequiredProtectedPathPosture({
    contract: context.contract,
    gateway: context.contract,
    posture: protectedPathPosture,
    now: context.now,
  });
  const policyInput = buildPolicyInput(context, isolationStates, sequenceDependencyStates, protectedPathPosture);
  const policyInputDigest = await digestCanonical(policyInput);
  return {
    ...context,
    isolationStates,
    sequenceDependencyStates,
    protectedPathPosture,
    protectedPathEvaluation,
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
    protectedPathPosture: protectedPathPolicyInput(protectedPathPosture, context.now),
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
  }
  return decisionValue;
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
