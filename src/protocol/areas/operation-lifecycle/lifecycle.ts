import type { Receipt } from "../receipt-export";
import type { ProtectedSurfaceOperationClaimState, SurfaceOperationReconciliation } from "./types";

export type ObservedDownstreamStatus = SurfaceOperationReconciliation["observedDownstreamStatus"];

export type OperationLifecycleMapping = {
  observedDownstreamStatus: ObservedDownstreamStatus;
  reconciliationStatus: SurfaceOperationReconciliation["reconciliationStatus"];
  finalityStatus: SurfaceOperationReconciliation["finalityStatus"];
  claimState: ProtectedSurfaceOperationClaimState;
  receiptDownstreamExecutionStatus: Receipt["downstreamExecutionStatus"];
  receiptMutationAttemptStatus: Receipt["mutationAttemptStatus"];
  proofGapReasonCode: string | null;
  keepClaimBlocking: boolean;
  createIsolation: boolean;
};

export const OPERATION_LIFECYCLE_MATRIX = {
  pending: {
    observedDownstreamStatus: "pending",
    reconciliationStatus: "pending",
    finalityStatus: "pending",
    claimState: "active",
    receiptDownstreamExecutionStatus: "pending",
    receiptMutationAttemptStatus: "submitted",
    proofGapReasonCode: null,
    keepClaimBlocking: true,
    createIsolation: false,
  },
  succeeded: {
    observedDownstreamStatus: "succeeded",
    reconciliationStatus: "resolved",
    finalityStatus: "final",
    claimState: "terminal_succeeded",
    receiptDownstreamExecutionStatus: "succeeded",
    receiptMutationAttemptStatus: "succeeded",
    proofGapReasonCode: null,
    keepClaimBlocking: false,
    createIsolation: false,
  },
  refused: {
    observedDownstreamStatus: "refused",
    reconciliationStatus: "resolved",
    finalityStatus: "suspect",
    claimState: "terminal_refused",
    receiptDownstreamExecutionStatus: "refused",
    receiptMutationAttemptStatus: "downstream_refused",
    proofGapReasonCode: null,
    keepClaimBlocking: false,
    createIsolation: false,
  },
  failed: {
    observedDownstreamStatus: "failed",
    reconciliationStatus: "failed",
    finalityStatus: "suspect",
    claimState: "terminal_failed",
    receiptDownstreamExecutionStatus: "failed",
    receiptMutationAttemptStatus: "failed",
    proofGapReasonCode: null,
    keepClaimBlocking: false,
    createIsolation: false,
  },
  unknown: {
    observedDownstreamStatus: "unknown",
    reconciliationStatus: "still_unknown",
    finalityStatus: "unknown",
    claimState: "terminal_unknown",
    receiptDownstreamExecutionStatus: "unknown",
    receiptMutationAttemptStatus: "unknown",
    proofGapReasonCode: "orphan_mitigation_required",
    keepClaimBlocking: true,
    createIsolation: true,
  },
} as const satisfies Record<ObservedDownstreamStatus, OperationLifecycleMapping>;

export function operationLifecycleFor(status: ObservedDownstreamStatus): OperationLifecycleMapping {
  return OPERATION_LIFECYCLE_MATRIX[status];
}

export function reconciliationStatusFor(status: ObservedDownstreamStatus) {
  return operationLifecycleFor(status).reconciliationStatus;
}

export function reconciliationFinalityFor(status: ObservedDownstreamStatus) {
  return operationLifecycleFor(status).finalityStatus;
}
