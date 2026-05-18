import type { ActionContract } from "../action-contract";
import type { OperatingEnvelope } from "../catalog-envelope";
import type { Greenlight } from "./types";
import { fail, ok, type TransitionGuardResult } from "../transition-guards";

export function guardPolicyEvaluation(contract: ActionContract, envelope: OperatingEnvelope): TransitionGuardResult {
  if (contract.envelopeId !== envelope.envelopeId) {
    return fail("invalid_transition_envelope_mismatch", "Policy may evaluate only the envelope pinned by the action contract.");
  }
  if (
    contract.tenantId !== envelope.tenantId ||
    contract.organizationId !== envelope.organizationId ||
    contract.principalId !== envelope.principalId ||
    contract.agentId !== envelope.agentId
  ) {
    return fail("invalid_transition_scope_mismatch", "Policy envelope scope must match the action contract scope.");
  }
  return ok();
}

export function guardGreenlightIssuance(contract: ActionContract, existingGreenlights: Greenlight[]): TransitionGuardResult {
  const duplicate = existingGreenlights.find((greenlight) => greenlight.actionContractId === contract.actionContractId);
  if (duplicate) {
    return fail(
      "invalid_transition_greenlight_already_issued",
      "A new greenlight requires a new action contract; this action contract already has a greenlight.",
    );
  }
  return ok();
}
