import type { ActionContract } from "../action-contract";
import type { PolicyDecision } from "../policy-greenlight";
import { fail, ok, type TransitionGuardResult } from "../transition-guards";

export function guardReviewDecision(contract: ActionContract, policyDecision: PolicyDecision): TransitionGuardResult {
  if (policyDecision.actionContractId !== contract.actionContractId) {
    return fail("review_policy_contract_mismatch", "Review decision policy reference must match the exact action contract.");
  }
  if (policyDecision.decision !== "review_required") {
    return fail("review_not_required", "Review decisions may only satisfy policy decisions that required review.");
  }
  return ok();
}
