import type { OperationReadbackProjection } from "../../protocol/evidence-projections/schemas";

/** D-57: compilation stages are readback-only — never authority-bearing labels. */
export const OPERATION_READBACK_STAGE_ORDER = [
  "intent_compilation",
  "candidate_action",
  "action_contract",
  "policy_decision",
  "greenlight",
  "gateway_check",
  "mutation_attempt",
  "receipt",
  "recovery",
  "isolation",
] as const;

export function evidenceOperationReadbackCliView(projection: OperationReadbackProjection) {
  return {
    schemaVersion: "handshake.cli.operation-readback-view.v1" as const,
    viewBoundary: "redacted_cli_projection_view" as const,
    title: `Operation ${projection.actionContractRef}`,
    status: projection.operationStatus,
    stage: projection.latestAuthoritativeStage,
    nextMechanism: projection.nextMechanism,
    stageOrder: OPERATION_READBACK_STAGE_ORDER,
    correlationSummary: {
      policyDecisionRef: projection.policyDecisionRef,
      greenlightRef: projection.greenlightRef,
      gateAttemptRef: projection.gateAttemptRef,
      receiptRef: projection.receiptRef,
    },
    nonClaims: [
      "Readback does not issue greenlights",
      "Readback does not perform gateway checks",
      "Compilation stages do not grant authority",
    ],
  };
}
