import type { TransitionCommitState, TransitionErrorRetryability } from "../../protocol/foundation/errors";

export type HttpErrorCodePhase =
  | "auth"
  | "hosted_admission"
  | "request_context"
  | "request_body"
  | "scope_resolution"
  | "record_read"
  | "store_resolution"
  | "error_envelope"
  | "client";

export type HttpTransitionErrorCodeEntry = {
  code: string;
  phase: HttpErrorCodePhase;
  retryability: TransitionErrorRetryability;
  commitState: TransitionCommitState;
  publicSafe: boolean;
};

export const httpTransitionErrorCodes = [
  code("caller_auth_not_configured", "auth", "terminal", "not_started", true),
  code("caller_auth_required", "auth", "terminal", "not_started", true),
  code("caller_auth_forbidden", "auth", "terminal", "not_started", true),
  code("hosted_admission_config_not_configured", "hosted_admission", "terminal", "not_started", true),
  code("hosted_admission_config_invalid", "hosted_admission", "terminal", "not_started", true),
  code("hosted_caller_verifier_not_configured", "hosted_admission", "terminal", "not_started", true),
  code("hosted_caller_auth_required", "hosted_admission", "terminal", "not_started", true),
  code("hosted_caller_identity_invalid", "hosted_admission", "terminal", "not_started", true),
  code("hosted_caller_identity_expired", "hosted_admission", "terminal", "not_started", true),
  code("hosted_caller_identity_stale", "hosted_admission", "terminal", "not_started", true),
  code("hosted_caller_identity_revoked", "hosted_admission", "terminal", "not_started", true),
  code("hosted_caller_role_forbidden", "hosted_admission", "terminal", "not_started", true),
  code("hosted_caller_scope_forbidden", "hosted_admission", "terminal", "not_started", true),
  code("hosted_transition_role_not_admitted", "hosted_admission", "terminal", "not_started", true),
  code("hosted_read_entitlement_forbidden", "hosted_admission", "terminal", "not_started", true),
  code("hosted_readiness_entitlement_forbidden", "hosted_admission", "terminal", "not_started", true),
  code("hosted_raw_read_entitlement_forbidden", "hosted_admission", "terminal", "not_started", true),
  code("hosted_raw_read_unavailable", "hosted_admission", "terminal", "not_started", true),
  code("hosted_raw_read_purpose_required", "hosted_admission", "terminal", "not_started", true),
  code("hosted_raw_read_window_invalid", "hosted_admission", "terminal", "not_started", true),
  code("protocol_version_required", "request_context", "terminal", "not_started", true),
  code("protocol_version_unsupported", "request_context", "terminal", "not_started", true),
  code("request_identity_required", "request_context", "terminal", "not_started", true),
  code("request_identity_invalid", "request_context", "terminal", "not_started", true),
  code("originating_identity_invalid", "request_context", "terminal", "not_started", true),
  code("transition_request_body_too_large", "request_body", "terminal", "not_started", true),
  code("transition_scope_unavailable", "scope_resolution", "terminal", "not_started", true),
  code("transition_scope_reference_invalid", "scope_resolution", "terminal", "not_started", true),
  code("intent_compilation_missing", "scope_resolution", "terminal", "not_started", true),
  code("contract_missing", "scope_resolution", "terminal", "not_started", true),
  code("policy_decision_missing", "scope_resolution", "terminal", "not_started", true),
  code("mutation_attempt_missing", "scope_resolution", "terminal", "not_started", true),
  code("receipt_missing", "scope_resolution", "terminal", "not_started", true),
  code("recovery_recommendation_missing", "scope_resolution", "terminal", "not_started", true),
  code("proof_gap_missing", "scope_resolution", "terminal", "not_started", true),
  code("invalid_protocol_object_type", "record_read", "terminal", "not_applicable", true),
  code("record_not_found", "record_read", "terminal", "not_applicable", true),
  code("durable_store_unavailable", "store_resolution", "retryable", "unknown", true),
  code("invalid_request", "error_envelope", "terminal", "not_started", true),
  code("internal_error", "error_envelope", "retryable", "unknown", false),
  code("http_error", "client", "ambiguous", "unknown", true),
] as const satisfies readonly HttpTransitionErrorCodeEntry[];

export const httpTransitionErrorCodeValues = httpTransitionErrorCodes.map((entry) => entry.code);
const httpTransitionErrorCodeValueSet = new Set<string>(httpTransitionErrorCodeValues);

export function isRegisteredHttpTransitionErrorCode(candidate: string): boolean {
  return httpTransitionErrorCodeValueSet.has(candidate);
}

function code(
  value: string,
  phase: HttpErrorCodePhase,
  retryability: TransitionErrorRetryability,
  commitState: TransitionCommitState,
  publicSafe: boolean,
): HttpTransitionErrorCodeEntry {
  return {
    code: value,
    phase,
    retryability,
    commitState,
    publicSafe,
  };
}
