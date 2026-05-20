export type { TransitionGuardResult } from "../foundation/transition-guards";
export { guardActionProposal } from "../areas/action-contract";
export { guardCatalogRegistration } from "../areas/catalog-envelope";
export { guardGatewayCheckAuthority } from "../areas/gateway-gate";
export { guardSurfaceOperationReconciliation } from "../areas/operation-lifecycle";
export { guardGreenlightIssuance, guardPolicyEvaluation } from "../areas/policy-greenlight";
export { guardReviewDecision } from "../areas/review-binding";

type TransitionDefinition = {
  from: string;
  to: string;
  guard: string;
};

export const PROTOCOL_TRANSITIONS = {
  registerProtocolConfiguration: {
    from: "external_configuration",
    to: "durable_catalog_or_envelope",
    guard:
      "Only tool capabilities, action types, gateway registry entries, and operating envelopes may be inserted directly.",
  },
  compileIntent: {
    from: "principal_intent_plus_catalog_refs",
    to: "intent_compilation_recorded",
    guard: "Compilation records uncertainty instead of minting authority.",
  },
  createRuntimeExecution: {
    from: "generated_runtime_execution_block",
    to: "runtime_execution_recorded",
    guard:
      "Runtime evidence records orchestration shape only; it cannot mint policy, greenlight, gate, or mutation authority.",
  },
  createBypassProbe: {
    from: "protected_path_probe",
    to: "bypass_probe_recorded",
    guard: "Bypass probes record probe outcomes only; they cannot satisfy posture unless a later posture binds them.",
  },
  createToolCallDraft: {
    from: "generated_tool_input",
    to: "tool_call_draft_recorded",
    guard: "Tool-call drafts record generated input state only; finalized binding is checked later by compilation.",
  },
  createProtectedPathPosture: {
    from: "runtime_gateway_surface_probe",
    to: "protected_path_posture_recorded",
    guard: "Protected path posture must be append-only and atomically update the current posture pointer.",
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
    guard:
      "Review may bind only through a review artifact whose digests match the exact contract, policy input, gateway policy, and uncertainty rendering.",
  },
  createReviewArtifact: {
    from: "review_required",
    to: "review_artifact_recorded",
    guard: "Rendered review artifacts must bind to the exact contract digest and policy input digest.",
  },
  createBreakerDecision: {
    from: "observed_contract_stream_window",
    to: "breaker_decision_recorded_and_isolation_changed",
    guard: "Breaker decisions must atomically record observed stream watermarks and the resulting isolation state.",
  },
  gatewayCheck: {
    from: "action_greenlit",
    to: "gateway_checked",
    guard:
      "A gateway check may proceed only from a greenlight policy decision; binding mismatches become gateway refusals before mutation.",
  },
  reconcileSurfaceOperation: {
    from: "mutation_attempted_pending_or_unknown",
    to: "surface_operation_reconciled",
    guard:
      "Reconciliation may inspect only the same mutation attempt and idempotency key; it cannot create another mutation attempt.",
  },
  exportReceipt: {
    from: "receipt_emitted",
    to: "receipt_exported",
    guard:
      "Receipt export may package existing evidence only; it cannot create execution proof or mutate gateway state.",
  },
  recommendRecovery: {
    from: "receipt_refusal_or_proof_gap",
    to: "recovery_recommended",
    guard:
      "Recovery may recommend a narrower future contract or review path only; it cannot reuse a greenlight or mutate gateway state.",
  },
  linkRecoveryToActionContract: {
    from: "recovery_recommended",
    to: "action_proposed",
    guard:
      "A recovery-linked action contract must validate recommendation scope, freshness, action class, new evidence, and later sequence number; it inherits no greenlight.",
  },
  transitionRecoveryRecommendationStatus: {
    from: "recovery_recommended_open",
    to: "recovery_status_changed",
    guard:
      "Recovery recommendation status may move from open to expired or superseded only with a durable status transition record.",
  },
} as const satisfies Record<string, TransitionDefinition>;
