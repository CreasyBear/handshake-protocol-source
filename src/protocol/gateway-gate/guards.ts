import type { Greenlight, PolicyDecision } from "../policy-greenlight";
import { fail, ok, type TransitionGuardResult } from "../transition-guards";

export function guardGatewayCheckAuthority(
  greenlight: Greenlight,
  policyDecision: PolicyDecision,
): TransitionGuardResult {
  if (policyDecision.policyDecisionId !== greenlight.policyDecisionId) {
    return fail("invalid_transition_policy_greenlight_mismatch", "Greenlight must reference the policy decision loaded for gate authority.");
  }
  if (policyDecision.actionContractId !== greenlight.actionContractId) {
    return fail("invalid_transition_policy_contract_mismatch", "Greenlight policy decision must bind to the same action contract.");
  }
  if (policyDecision.decision !== "greenlight") {
    return fail("invalid_transition_policy_not_greenlight", "Gateway gate requires a policy decision whose value is greenlight.");
  }
  return ok();
}
