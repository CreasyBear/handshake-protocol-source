import type { ProtocolTransitionPhase } from "../navigation";

export type ProtocolReasonCodeKind =
  | "transition_error"
  | "refusal"
  | "policy_decision"
  | "gateway_decision"
  | "proof_gap"
  | "recovery"
  | "isolation"
  | "generated_graph_terminal"
  | "protected_path_posture";

export type ProtocolReasonCodeEntry = {
  code: string;
  kind: ProtocolReasonCodeKind;
  phase: ProtocolTransitionPhase;
  publicSafe: boolean;
};

export type ProtocolReasonCodePrefixEntry = {
  prefix: string;
  kind: ProtocolReasonCodeKind;
  phase: ProtocolTransitionPhase;
  publicSafe: boolean;
};

export const protocolReasonCodes = [
  code("bootstrap_record_digest_conflict", "transition_error", "catalog"),
  code("invalid_transition_greenlight_already_issued", "transition_error", "policy"),
  code("stream_append_conflict", "transition_error", "gateway"),
  code("ambiguous_commit", "transition_error", "gateway", false),

  code("secret_bearing_param_in_non_secret_params", "transition_error", "intent_compilation"),
  code("undeclared_secret_ref", "transition_error", "intent_compilation"),
  code("unwrapped_consequential_tool", "refusal", "intent_compilation"),
  code("runtime_unwrapped_consequential_tool", "refusal", "intent_compilation"),
  code("generated_execution_block_sibling_refused", "refusal", "intent_compilation"),
  code("generated_execution_graph_missing", "refusal", "intent_compilation"),
  code("generated_execution_graph_not_contractable", "refusal", "intent_compilation"),
  code("generated_execution_node_not_contractable", "refusal", "intent_compilation"),

  code("candidate_params_digest_mismatch", "transition_error", "action_contract"),
  code("candidate_action_mismatch", "transition_error", "action_contract"),
  code("intent_compilation_not_contractable", "transition_error", "action_contract"),
  code("candidate_digest_mismatch", "transition_error", "action_contract"),
  code("candidate_digest_missing", "transition_error", "action_contract"),
  code("candidate_catalog_digest_drift", "transition_error", "action_contract"),
  code("candidate_generated_execution_graph_runtime_mismatch", "transition_error", "action_contract"),
  code("candidate_generated_execution_graph_not_contractable", "transition_error", "action_contract"),
  code("candidate_generated_execution_graph_status_mismatch", "transition_error", "action_contract"),
  code("candidate_generated_execution_node_missing", "transition_error", "action_contract"),
  code("candidate_generated_execution_node_digest_mismatch", "transition_error", "action_contract"),
  code("candidate_generated_execution_node_gateway_binding_mismatch", "transition_error", "action_contract"),
  code("followup_action_contract_proposed", "recovery", "action_contract"),

  code("policy_passed", "policy_decision", "policy"),
  code("isolation_review_only", "policy_decision", "policy"),
  code("contract_expired", "policy_decision", "policy"),
  code("envelope_not_active", "policy_decision", "policy"),
  code("action_class_outside_envelope", "policy_decision", "policy"),
  code("gateway_outside_envelope", "policy_decision", "policy"),
  code("resource_outside_envelope", "policy_decision", "policy"),
  code("prior_action_missing", "policy_decision", "policy"),
  code("prior_action_refused", "policy_decision", "policy"),
  code("prior_action_not_greenlit", "policy_decision", "policy"),
  code("review_approved", "policy_decision", "policy"),
  code("review_decision_invalid", "policy_decision", "policy"),

  code("gateway_registry_not_enforcing", "protected_path_posture", "protected_path_posture"),
  code("protected_path_posture_missing", "protected_path_posture", "protected_path_posture"),
  code("protected_path_posture_scope_mismatch", "protected_path_posture", "protected_path_posture"),
  code("protected_path_posture_binding_mismatch", "protected_path_posture", "protected_path_posture"),
  code("protected_path_posture_stale", "protected_path_posture", "protected_path_posture"),
  code("protected_path_posture_not_gateway_checked", "protected_path_posture", "protected_path_posture"),
  code("protected_path_source_authority_weak", "protected_path_posture", "protected_path_posture"),
  code("protected_path_credential_custody_unsafe", "protected_path_posture", "protected_path_posture"),
  code("protected_path_raw_sibling_tool_present", "protected_path_posture", "protected_path_posture"),

  code("contract_mismatch", "gateway_decision", "gateway"),
  code("gateway_registry_mismatch", "gateway_decision", "gateway"),
  code("gateway_registry_version_mismatch", "gateway_decision", "gateway"),
  code("gateway_mismatch", "gateway_decision", "gateway"),
  code("greenlight_policy_mismatch", "gateway_decision", "gateway"),
  code("action_class_mismatch", "gateway_decision", "gateway"),
  code("resource_mismatch", "gateway_decision", "gateway"),
  code("params_mismatch", "gateway_decision", "gateway"),
  code("contract_digest_mismatch", "gateway_decision", "gateway"),
  code("protected_path_requirement_mismatch", "gateway_decision", "gateway"),
  code("greenlight_not_active", "gateway_decision", "gateway"),
  code("greenlight_expired", "gateway_decision", "gateway"),
  code("already_consumed", "gateway_decision", "gateway"),
  code("gateway_policy_unknown", "gateway_decision", "gateway"),
  code("gateway_policy_drift", "gateway_decision", "gateway"),
  code("protected_surface_operation_in_progress", "gateway_decision", "gateway"),
  code("gate_passed", "gateway_decision", "gateway"),
  code("downstream_status_unknown", "proof_gap", "gateway"),

  code("invalid_transition_unknown_reconciliation_cannot_resolve_proof_gap", "transition_error", "operation_lifecycle"),
  code("orphan_mitigation_required", "proof_gap", "operation_lifecycle"),
  code("unneeded_retry", "proof_gap", "operation_lifecycle"),

  code("breaker_watermark_digest_missing", "transition_error", "isolation"),
  code("breaker_watermark_event_missing", "transition_error", "isolation"),
  code("breaker_watermark_digest_mismatch", "transition_error", "isolation"),
  code("breaker_trip", "isolation", "isolation"),
  code("foreign_tenant_breaker", "isolation", "isolation"),
  code("foreign_org_resource_breaker", "isolation", "isolation"),
  code("gateway_scope_only", "isolation", "isolation"),
  code("model_quarantine", "isolation", "isolation"),
  code("sequence_divergence", "isolation", "isolation"),

  code("review_artifact_policy_contract_mismatch", "transition_error", "review"),
  code("review_artifact_not_required", "transition_error", "review"),
  code("review_artifact_contract_digest_mismatch", "transition_error", "review"),
  code("review_artifact_policy_input_digest_mismatch", "transition_error", "review"),
  code("review_artifact_digest_mismatch", "transition_error", "review"),
  code("review_artifact_contract_mismatch", "transition_error", "review"),
  code("review_artifact_policy_input_mismatch", "transition_error", "review"),
  code("review_artifact_gateway_policy_mismatch", "transition_error", "review"),
  code("human_verified_exact_contract", "policy_decision", "review"),
  code("sensitive_action", "policy_decision", "review"),

  code("receipt_digest_missing", "transition_error", "receipt_export"),
  code("receipt_stream_offsets_missing", "transition_error", "receipt_export"),
  code("receipt_digest_mismatch", "transition_error", "receipt_export"),
  code("audit_chain_digest_mismatch", "transition_error", "receipt_export"),

  code("proof_gap_already_resolved", "transition_error", "recovery"),
  code("invalid_transition_proof_gap_mismatch", "transition_error", "recovery"),
  code("recovery_terminal_conflict", "proof_gap", "recovery"),
  code("recovery_terminal_conflict_gap_mismatch", "transition_error", "recovery"),
  code("recovery_terminal_conflict_scope_mismatch", "transition_error", "recovery"),
  code("recovery_terminal_conflict_claim_mismatch", "transition_error", "recovery"),
  code("recovery_terminal_conflict_evidence_mismatch", "transition_error", "recovery"),
  code("recovery_terminal_transition_not_current", "transition_error", "recovery"),
  code("recovery_source_not_recoverable", "transition_error", "recovery"),
  code("recovery_receipt_digest_missing", "transition_error", "recovery"),
  code("recovery_receipt_stream_offsets_missing", "transition_error", "recovery"),
  code("recovery_receipt_digest_mismatch", "transition_error", "recovery"),
  code("recovery_audit_chain_digest_mismatch", "transition_error", "recovery"),
  code("recovery_source_ref_mismatch", "transition_error", "recovery"),
  code("recovery_next_action_class_missing", "transition_error", "recovery"),
  code("recovery_halt_has_next_action_classes", "transition_error", "recovery"),
  code("recovery_recommendation_not_open", "transition_error", "recovery"),
  code("recovery_recommendation_expired", "transition_error", "recovery"),
  code("recovery_retry_not_before", "transition_error", "recovery"),
  code("recovery_followup_not_later", "transition_error", "recovery"),
  code("recovery_action_class_not_allowed", "transition_error", "recovery"),
  code("recovery_required_evidence_missing", "transition_error", "recovery"),
  code("recovery_followup_scope_mismatch", "transition_error", "recovery"),
  code("recovery_path_not_contractable", "transition_error", "recovery"),
  code("recovery_superseding_contract_missing", "transition_error", "recovery"),
  code("recovery_expired_has_superseding_contract", "transition_error", "recovery"),
  code("recovery_not_expired", "transition_error", "recovery"),
  code("recovery_superseding_contract_mismatch", "transition_error", "recovery"),
  code("recovery_expired", "recovery", "recovery"),

  code("generated_execution_graph_issuer_scope_mismatch", "transition_error", "generated_execution_graph"),
  code("generated_execution_graph_nonce_replay", "transition_error", "generated_execution_graph"),
  code("generated_execution_graph_duplicate_node_id", "transition_error", "generated_execution_graph"),
  code("generated_execution_graph_unknown_node_ref", "transition_error", "generated_execution_graph"),
  code("generated_execution_graph_empty", "generated_graph_terminal", "generated_execution_graph"),
  code("generated_execution_graph_missing_entry_node", "generated_graph_terminal", "generated_execution_graph"),
  code("generated_execution_graph_cycle_detected", "generated_graph_terminal", "generated_execution_graph"),
  code("generated_execution_graph_node_limit_exceeded", "generated_graph_terminal", "generated_execution_graph"),
  code("generated_execution_graph_edge_limit_exceeded", "generated_graph_terminal", "generated_execution_graph"),
  code("generated_execution_graph_depth_limit_exceeded", "generated_graph_terminal", "generated_execution_graph"),
  code("generated_execution_graph_byte_limit_exceeded", "generated_graph_terminal", "generated_execution_graph"),
  code("generated_execution_graph_complete", "generated_graph_terminal", "generated_execution_graph"),
  code("generated_execution_graph_truncated", "generated_graph_terminal", "generated_execution_graph"),
  code("generated_execution_graph_over_limit", "generated_graph_terminal", "generated_execution_graph"),
  code("generated_execution_graph_truncation_unknown", "generated_graph_terminal", "generated_execution_graph"),
  code("generated_execution_node_kind_unknown", "generated_graph_terminal", "generated_execution_graph"),
  code("generated_execution_node_raw_secret_material", "generated_graph_terminal", "generated_execution_graph"),
  code("generated_execution_node_raw_argv_material", "generated_graph_terminal", "generated_execution_graph"),
  code("generated_execution_node_raw_stdin_material", "generated_graph_terminal", "generated_execution_graph"),
  code("generated_execution_node_bypass_risk", "generated_graph_terminal", "generated_execution_graph"),
  code("generated_execution_node_hidden_trigger", "generated_graph_terminal", "generated_execution_graph"),
  code("generated_execution_node_observer_only", "generated_graph_terminal", "generated_execution_graph"),
  code("generated_execution_node_unsupported", "generated_graph_terminal", "generated_execution_graph"),
  code("generated_execution_node_ambiguous", "generated_graph_terminal", "generated_execution_graph"),
  code("generated_execution_command_risk_denied", "generated_graph_terminal", "generated_execution_graph"),
  code("generated_execution_command_risk_warned", "generated_graph_terminal", "generated_execution_graph"),
  code("generated_execution_command_risk_allowlist", "generated_graph_terminal", "generated_execution_graph"),
  code("generated_execution_command_risk_allow_once", "generated_graph_terminal", "generated_execution_graph"),
  code("generated_execution_command_risk_bypass_detected", "generated_graph_terminal", "generated_execution_graph"),
  code("generated_execution_command_risk_fail_open", "generated_graph_terminal", "generated_execution_graph"),
  code("generated_execution_command_risk_skipped", "generated_graph_terminal", "generated_execution_graph"),
  code("generated_execution_command_risk_unknown", "generated_graph_terminal", "generated_execution_graph"),
] as const satisfies readonly ProtocolReasonCodeEntry[];

export const protocolReasonCodePrefixes = [
  prefix("isolation_", "policy_decision", "policy"),
  prefix("current_isolation_", "gateway_decision", "gateway"),
  prefix("prior_action_", "policy_decision", "policy"),
  prefix("runtime_", "refusal", "intent_compilation"),
] as const satisfies readonly ProtocolReasonCodePrefixEntry[];

export const protocolReasonCodeValues = protocolReasonCodes.map((entry) => entry.code);
const protocolReasonCodeValueSet = new Set<string>(protocolReasonCodeValues);

export function isRegisteredProtocolReasonCode(candidate: string): boolean {
  return (
    protocolReasonCodeValueSet.has(candidate) ||
    protocolReasonCodePrefixes.some((entry) => candidate.startsWith(entry.prefix))
  );
}

function code(
  value: string,
  kind: ProtocolReasonCodeKind,
  phase: ProtocolTransitionPhase,
  publicSafe = true,
): ProtocolReasonCodeEntry {
  return {
    code: value,
    kind,
    phase,
    publicSafe,
  };
}

function prefix(
  value: string,
  kind: ProtocolReasonCodeKind,
  phase: ProtocolTransitionPhase,
  publicSafe = true,
): ProtocolReasonCodePrefixEntry {
  return {
    prefix: value,
    kind,
    phase,
    publicSafe,
  };
}
