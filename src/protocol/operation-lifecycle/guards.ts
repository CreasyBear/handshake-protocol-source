import type { MutationAttempt } from "../gateway-gate";
import { fail, ok, type TransitionGuardResult } from "../transition-guards";

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
