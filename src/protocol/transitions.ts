import type {
  ActionContract,
  Greenlight,
  IntentCompilationRecord,
  MutationAttempt,
  OperatingEnvelope,
  PolicyDecision,
  ProtocolRecord,
  GatewayRegistryEntry,
} from "./schemas";

export type TransitionGuardResult =
  | { ok: true }
  | { ok: false; code: string; message: string; status: number };

type TransitionDefinition = {
  from: string;
  to: string;
  guard: string;
};

export const PROTOCOL_TRANSITIONS = {
  registerProtocolConfiguration: {
    from: "external_configuration",
    to: "durable_catalog_or_envelope",
    guard: "Only tool capabilities, action types, gateway registry entries, and operating envelopes may be inserted directly.",
  },
  compileIntent: {
    from: "principal_intent_plus_catalog_refs",
    to: "intent_compilation_recorded",
    guard: "Compilation records uncertainty instead of minting authority.",
  },
  proposeActionContract: {
    from: "clean_intent_compilation",
    to: "action_proposed",
    guard: "Compilation, envelope, gateway, principal, agent, run, tenant, and organization bindings must match.",
  },
  evaluatePolicy: {
    from: "action_proposed",
    to: "policy_decision_recorded",
    guard: "Policy may evaluate only the envelope pinned by the exact action contract.",
  },
  issueGreenlight: {
    from: "policy_decision_recorded",
    to: "action_greenlit",
    guard: "Only one greenlight may ever be issued for one action contract.",
  },
  createReviewDecision: {
    from: "review_required",
    to: "review_decision_recorded",
    guard: "Review may bind only to a policy decision that required review for the exact action contract.",
  },
  createBreakerDecision: {
    from: "observed_contract_stream_window",
    to: "breaker_decision_recorded_and_isolation_changed",
    guard: "Breaker decisions must atomically record observed stream watermarks and the resulting isolation state.",
  },
  gatewayCheck: {
    from: "action_greenlit",
    to: "gateway_checked",
    guard: "A gateway check may proceed only from a greenlight policy decision; binding mismatches become gateway refusals before mutation.",
  },
  reconcileSurfaceOperation: {
    from: "mutation_attempted_pending_or_unknown",
    to: "surface_operation_reconciled",
    guard: "Reconciliation may inspect only the same mutation attempt and idempotency key; it cannot create another mutation attempt.",
  },
  exportReceipt: {
    from: "receipt_emitted",
    to: "receipt_exported",
    guard: "Receipt export may package existing evidence only; it cannot create execution proof or mutate gateway state.",
  },
  recommendRecovery: {
    from: "receipt_refusal_or_proof_gap",
    to: "recovery_recommended",
    guard: "Recovery may recommend a narrower future contract or review path only; it cannot reuse a greenlight or mutate gateway state.",
  },
  linkRecoveryToActionContract: {
    from: "recovery_recommended",
    to: "action_proposed",
    guard: "A recovery-linked action contract must validate recommendation scope, freshness, action class, new evidence, and later sequence number; it inherits no greenlight.",
  },
  transitionRecoveryRecommendationStatus: {
    from: "recovery_recommended_open",
    to: "recovery_status_changed",
    guard: "Recovery recommendation status may move from open to expired or superseded only with a durable status transition record.",
  },
} as const satisfies Record<string, TransitionDefinition>;

export function guardCatalogRegistration(record: ProtocolRecord): TransitionGuardResult {
  if (
    record.objectType === "tool_capability" ||
    record.objectType === "action_type" ||
    record.objectType === "gateway_registry_entry" ||
    record.objectType === "operating_envelope"
  ) {
    return ok();
  }
  return fail(
    "invalid_transition_direct_protocol_write",
    `Direct writes are not allowed for protocol object type ${record.objectType}. Use the protocol lifecycle method instead.`,
  );
}

export function guardActionProposal(input: {
  tenantId: string;
  organizationId: string;
  principalId: string;
  agentId: string;
  runId: string;
  envelopeId: string;
  gatewayId: string;
  compilation: IntentCompilationRecord;
  envelope: OperatingEnvelope;
  gateway: GatewayRegistryEntry;
}): TransitionGuardResult {
  if (input.compilation.uncertaintyMarkers.length > 0 || input.compilation.overreachReasonCodes.length > 0) {
    return fail(
      "intent_compilation_not_contractable",
      "Intent compilation has uncertainty or overreach markers; no action contract may be emitted.",
    );
  }
  if (input.compilation.operatingEnvelopeId !== input.envelope.envelopeId || input.envelopeId !== input.envelope.envelopeId) {
    return fail("invalid_transition_envelope_mismatch", "Action contract must use the envelope pinned by the intent compilation.");
  }
  if (input.gateway.gatewayId !== input.gatewayId) {
    return fail("gateway_registry_mismatch", "Action contract gateway must match the durable gateway registry entry.");
  }
  if (input.gateway.receiptCapabilityStatus !== "available" || input.gateway.isolationCheckCapabilityStatus !== "available") {
    return fail("gateway_not_enforcing", "Gateway registry entry does not prove receipt and isolation check capability.");
  }
  if (
    input.tenantId !== input.compilation.tenantId ||
    input.tenantId !== input.envelope.tenantId ||
    input.tenantId !== input.gateway.tenantId ||
    input.organizationId !== input.compilation.organizationId ||
    input.organizationId !== input.envelope.organizationId ||
    input.organizationId !== input.gateway.organizationId
  ) {
    return fail("invalid_transition_scope_mismatch", "Action contract scope must match compilation, envelope, and gateway scope.");
  }
  if (
    input.principalId !== input.compilation.principalId ||
    input.principalId !== input.envelope.principalId ||
    input.agentId !== input.compilation.agentId ||
    input.agentId !== input.envelope.agentId ||
    input.runId !== input.compilation.runId
  ) {
    return fail("invalid_transition_actor_mismatch", "Action contract actor bindings must match compilation and envelope.");
  }
  return ok();
}

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

export function guardReviewDecision(contract: ActionContract, policyDecision: PolicyDecision): TransitionGuardResult {
  if (policyDecision.actionContractId !== contract.actionContractId) {
    return fail("review_policy_contract_mismatch", "Review decision policy reference must match the exact action contract.");
  }
  if (policyDecision.decision !== "review_required") {
    return fail("review_not_required", "Review decisions may only satisfy policy decisions that required review.");
  }
  return ok();
}

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

export function guardSurfaceOperationReconciliation(
  mutationAttempt: MutationAttempt,
  input: {
    mutationAttemptId: string;
    idempotencyKey: string;
    observedSurfaceOperationRef: string | null;
  },
): TransitionGuardResult {
  if (mutationAttempt.mutationAttemptId !== input.mutationAttemptId) {
    return fail("invalid_transition_mutation_mismatch", "Reconciliation must target the exact mutation attempt.");
  }
  if (mutationAttempt.idempotencyKey !== input.idempotencyKey) {
    return fail("invalid_transition_idempotency_mismatch", "Reconciliation idempotency key must match the original mutation attempt.");
  }
  if (!["submitted", "unknown"].includes(mutationAttempt.outcome)) {
    return fail(
      "invalid_transition_reconciliation_not_allowed",
      "Only pending or unknown downstream mutation attempts may be reconciled.",
    );
  }
  if (
    mutationAttempt.surfaceOperationRef !== null &&
    input.observedSurfaceOperationRef !== null &&
    mutationAttempt.surfaceOperationRef !== input.observedSurfaceOperationRef
  ) {
    return fail(
      "invalid_transition_surface_operation_mismatch",
      "Observed surface operation reference must match the original mutation attempt.",
    );
  }
  return ok();
}

function ok(): TransitionGuardResult {
  return { ok: true };
}

function fail(code: string, message: string): TransitionGuardResult {
  return { ok: false, code, message, status: 409 };
}
