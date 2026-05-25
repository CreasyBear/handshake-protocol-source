import type { ActionContract } from "../action-contract";
import type { OperatingEnvelope } from "../catalog-envelope";
import type { IsolationState } from "../isolation-breaker";
import type { ReviewDecision } from "../review-binding";

export type PolicyEvaluationResult = {
  decision: "greenlight" | "refuse" | "review_required" | "halt" | "quarantine" | "proof_gap";
  reasonCode: string;
  reason: string;
  matchedRuleIds: string[];
};

export function evaluateDeterministicPolicy(
  contract: ActionContract,
  envelope: OperatingEnvelope,
  isolationStates: IsolationState[],
  now: string,
): PolicyEvaluationResult {
  const blockingIsolation = isolationStates.find((state) =>
    ["quarantined", "halted", "revoked", "state_suspect"].includes(state.state),
  );
  if (blockingIsolation) {
    return {
      decision: blockingIsolation.state === "halted" ? "halt" : "quarantine",
      reasonCode: `isolation_${blockingIsolation.state}`,
      reason: `Current isolation state blocks this action at ${blockingIsolation.scopeType}:${blockingIsolation.scopeId}.`,
      matchedRuleIds: ["isolation_state_blocks_action"],
    };
  }
  if (isolationStates.some((state) => state.state === "review_only")) {
    return {
      decision: "review_required",
      reasonCode: "isolation_review_only",
      reason: "Current isolation state requires review before greenlight.",
      matchedRuleIds: ["isolation_state_requires_review"],
    };
  }
  if (Date.parse(contract.expiresAt) <= Date.parse(now)) {
    return {
      decision: "refuse",
      reasonCode: "contract_expired",
      reason: "Action contract is expired.",
      matchedRuleIds: ["freshness"],
    };
  }
  if (envelope.revokedAt !== null || Date.parse(envelope.expiresAt) <= Date.parse(now)) {
    return {
      decision: "refuse",
      reasonCode: "envelope_not_active",
      reason: "Operating envelope is expired or revoked.",
      matchedRuleIds: ["envelope_active"],
    };
  }
  if (!envelope.allowedActionClasses.includes(contract.actionClass)) {
    return {
      decision: "refuse",
      reasonCode: "action_class_outside_envelope",
      reason: "Action class is outside the operating envelope.",
      matchedRuleIds: ["action_class_allowed"],
    };
  }
  if (!envelope.allowedGateways.includes(contract.gatewayId)) {
    return {
      decision: "refuse",
      reasonCode: "gateway_outside_envelope",
      reason: "Gateway is outside the operating envelope.",
      matchedRuleIds: ["gateway_allowed"],
    };
  }
  if (!envelope.allowedResources.includes("*") && !envelope.allowedResources.includes(contract.resourceRef)) {
    return {
      decision: "refuse",
      reasonCode: "resource_outside_envelope",
      reason: "Resource is outside the operating envelope.",
      matchedRuleIds: ["resource_allowed"],
    };
  }
  return {
    decision: "greenlight",
    reasonCode: "policy_passed",
    reason: "Exact contract is inside envelope and no isolation blocks it.",
    matchedRuleIds: ["envelope_bounds", "isolation_clear"],
  };
}

export function reviewDecisionAllowsGreenlight(
  reviewDecision: ReviewDecision,
  contract: ActionContract,
  policyInputDigest: string,
  now: string,
): boolean {
  return (
    reviewDecision.decision === "approve" &&
    Date.parse(reviewDecision.decisionExpiresAt) > Date.parse(now) &&
    reviewDecision.actionContractId === contract.actionContractId &&
    reviewDecision.actionContractDigest === contract.actionContractDigest &&
    reviewDecision.policyInputDigest === policyInputDigest &&
    reviewDecision.gatewayPolicyVersion === contract.gatewayPolicyVersion
  );
}

export function isolationSnapshotRef(states: IsolationState[]): string {
  if (states.length === 0) return "isolation:none";
  return `isolation:${states
    .map(
      (state) =>
        `${state.tenantId}:${state.organizationId}:${state.scopeType}:${state.scopeId}:${state.isolationStateId}:${state.version}`,
    )
    .sort()
    .join("|")}`;
}
