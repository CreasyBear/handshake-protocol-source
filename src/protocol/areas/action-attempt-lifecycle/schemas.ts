import { z } from "zod";

export const ActionAttemptLifecyclePhaseSchema = z.enum([
  "observation",
  "drafting",
  "compilation",
  "contract",
  "policy",
  "review",
  "gateway",
  "downstream",
  "isolation",
  "recovery",
  "projection",
  "terminal",
]);
export type ActionAttemptLifecyclePhase = z.infer<typeof ActionAttemptLifecyclePhaseSchema>;

export const ActionAttemptLifecycleStateSchema = z.enum([
  "catalog_registered",
  "catalog_conflict",
  "runtime_observed",
  "generated_graph_recorded",
  "bypass_risk_recorded",
  "draft_recorded",
  "draft_refused",
  "protected_path_posture_recorded",
  "candidate_compiled",
  "candidate_refused",
  "contract_proposed",
  "contract_refused",
  "contract_conflict",
  "policy_greenlit",
  "policy_refused",
  "review_required",
  "policy_conflict",
  "review_artifact_recorded",
  "review_decision_recorded",
  "review_decision_refused",
  "gateway_admitted",
  "gateway_proof_gap",
  "gateway_replayed",
  "gateway_conflict",
  "operation_reconciled",
  "downstream_proof_gap",
  "downstream_recovery_available",
  "isolation_recorded",
  "breaker_recorded",
  "receipt_exported",
  "authority_certificate_exported",
  "receipt_export_refused",
  "recovery_recommended",
  "recovery_refused",
  "recovery_status_recorded",
  "recovery_conflict",
  "proof_gap_resolved",
]);
export type ActionAttemptLifecycleState = z.infer<typeof ActionAttemptLifecycleStateSchema>;

export const ActionAttemptAuthorityEffectSchema = z.enum([
  "none",
  "evidence_only",
  "proposed_commitment",
  "one_use_authority",
  "gateway_admission",
  "downstream_evidence",
  "future_authority_reduction",
]);
export type ActionAttemptAuthorityEffect = z.infer<typeof ActionAttemptAuthorityEffectSchema>;

export const ActionAttemptTerminalOutcomeSchema = z.enum([
  "open",
  "contract",
  "refusal",
  "proof_gap",
  "terminal_unknown",
  "evidence_only",
  "recovery",
  "isolation",
  "receipt",
  "projection",
  "closed",
]);
export type ActionAttemptTerminalOutcome = z.infer<typeof ActionAttemptTerminalOutcomeSchema>;

export const ActionAttemptLifecycleEntrySchema = z.strictObject({
  phase: ActionAttemptLifecyclePhaseSchema,
  state: ActionAttemptLifecycleStateSchema,
  authorityEffect: ActionAttemptAuthorityEffectSchema,
  terminalOutcome: ActionAttemptTerminalOutcomeSchema,
  evidenceObligation: z.string().min(1),
});
export type ActionAttemptLifecycleEntry = z.infer<typeof ActionAttemptLifecycleEntrySchema>;
