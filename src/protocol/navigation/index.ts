import type { ContractStreamEvent } from "../events/schemas";
import type { ProtocolObjectType } from "../areas/object-registry/schemas";

export type KernelTransitionMethod =
  | "putCatalogObject"
  | "compileIntent"
  | "createRuntimeExecution"
  | "createGeneratedExecutionGraph"
  | "createBypassProbe"
  | "createToolCallDraft"
  | "transitionToolCallDraft"
  | "createProtectedPathPosture"
  | "proposeActionContract"
  | "createAuthorityCertificate"
  | "evaluatePolicy"
  | "createReviewArtifact"
  | "createReviewDecision"
  | "gatewayCheck"
  | "reconcileSurfaceOperation"
  | "createIsolationState"
  | "createBreakerDecision"
  | "createReceiptExport"
  | "createRecoveryRecommendation"
  | "transitionRecoveryRecommendationStatus"
  | "resolveRecoveryTerminalConflictProofGap";

export type ProtocolTransitionId =
  | "registerToolCapability"
  | "registerActionType"
  | "registerGatewayRegistryEntry"
  | "registerOperatingEnvelope"
  | "compileIntent"
  | "createRuntimeExecution"
  | "createGeneratedExecutionGraph"
  | "createBypassProbe"
  | "createToolCallDraft"
  | "transitionToolCallDraft"
  | "createProtectedPathPosture"
  | "proposeActionContract"
  | "createAuthorityCertificate"
  | "evaluatePolicy"
  | "createReviewArtifact"
  | "createReviewDecision"
  | "gatewayCheck"
  | "reconcileSurfaceOperation"
  | "createIsolationState"
  | "createBreakerDecision"
  | "createReceiptExport"
  | "createRecoveryRecommendation"
  | "transitionRecoveryRecommendationStatus"
  | "resolveRecoveryTerminalConflictProofGap";

export type ProtocolTransitionPhase =
  | "catalog"
  | "intent_compilation"
  | "runtime_evidence"
  | "generated_execution_graph"
  | "protected_path_posture"
  | "action_contract"
  | "authority_certificate"
  | "policy"
  | "review"
  | "gateway"
  | "operation_lifecycle"
  | "isolation"
  | "receipt_export"
  | "recovery";

export type TransitionOutcomeClass =
  | "recorded"
  | "idempotent"
  | "greenlight"
  | "refusal"
  | "review_required"
  | "proof_gap"
  | "replay_refusal"
  | "conflict"
  | "recovery"
  | "exported";

export type ProtocolNavigationEntry = {
  transitionId: ProtocolTransitionId;
  kernelMethod: KernelTransitionMethod;
  phase: ProtocolTransitionPhase;
  outcomeClasses: readonly TransitionOutcomeClass[];
  recordsWritten: readonly ProtocolObjectType[];
  eventsEmitted: readonly ContractStreamEvent["eventType"][];
  authorityBoundary: string;
  evidenceObligation: string;
};

export const protocolNavigation = [
  catalogEntry("registerToolCapability", "tool_capability"),
  catalogEntry("registerActionType", "action_type"),
  catalogEntry("registerGatewayRegistryEntry", "gateway_registry_entry"),
  catalogEntry("registerOperatingEnvelope", "operating_envelope"),
  {
    transitionId: "compileIntent",
    kernelMethod: "compileIntent",
    phase: "intent_compilation",
    outcomeClasses: ["recorded", "refusal"],
    recordsWritten: ["intent_compilation", "contract_stream_event"],
    eventsEmitted: ["intent_compiled"],
    authorityBoundary: "candidate evidence only",
    evidenceObligation: "record uncertainty or compiler refusal before any ActionContract exists",
  },
  {
    transitionId: "createGeneratedExecutionGraph",
    kernelMethod: "createGeneratedExecutionGraph",
    phase: "generated_execution_graph",
    outcomeClasses: ["recorded", "refusal"],
    recordsWritten: ["generated_execution_graph", "contract_stream_event"],
    eventsEmitted: ["generated_execution_graph_recorded"],
    authorityBoundary: "generated graph evidence only",
    evidenceObligation: "record block coverage, redaction posture, terminal reasons, and graph issuer custody",
  },
  {
    transitionId: "createRuntimeExecution",
    kernelMethod: "createRuntimeExecution",
    phase: "runtime_evidence",
    outcomeClasses: ["recorded"],
    recordsWritten: ["runtime_execution", "contract_stream_event"],
    eventsEmitted: ["runtime_execution_recorded"],
    authorityBoundary: "runtime evidence only",
    evidenceObligation: "record execution-block shape without issuing policy, greenlight, gate, or mutation authority",
  },
  {
    transitionId: "createBypassProbe",
    kernelMethod: "createBypassProbe",
    phase: "protected_path_posture",
    outcomeClasses: ["recorded"],
    recordsWritten: ["bypass_probe", "contract_stream_event"],
    eventsEmitted: ["bypass_probe_recorded"],
    authorityBoundary: "bypass probe evidence only",
    evidenceObligation:
      "record protected-path probe outcome without issuing posture, policy, greenlight, or mutation authority",
  },
  {
    transitionId: "createToolCallDraft",
    kernelMethod: "createToolCallDraft",
    phase: "intent_compilation",
    outcomeClasses: ["recorded"],
    recordsWritten: ["tool_call_draft", "contract_stream_event"],
    eventsEmitted: ["tool_call_draft_recorded"],
    authorityBoundary: "tool call draft evidence only",
    evidenceObligation: "open generated tool-call input state without issuing candidate or execution authority",
  },
  {
    transitionId: "transitionToolCallDraft",
    kernelMethod: "transitionToolCallDraft",
    phase: "intent_compilation",
    outcomeClasses: ["recorded", "refusal"],
    recordsWritten: ["tool_call_draft", "contract_stream_event"],
    eventsEmitted: ["tool_call_draft_recorded"],
    authorityBoundary: "tool call draft evidence only",
    evidenceObligation:
      "transition generated tool-call input state monotonically without issuing candidate or execution authority",
  },
  {
    transitionId: "createProtectedPathPosture",
    kernelMethod: "createProtectedPathPosture",
    phase: "protected_path_posture",
    outcomeClasses: ["recorded"],
    recordsWritten: ["protected_path_posture", "contract_stream_event"],
    eventsEmitted: ["protected_path_posture_recorded"],
    authorityBoundary: "protected path posture evidence only",
    evidenceObligation: "record current posture consulted later by policy and gateway checks",
  },
  {
    transitionId: "proposeActionContract",
    kernelMethod: "proposeActionContract",
    phase: "action_contract",
    outcomeClasses: ["recorded", "refusal", "conflict"],
    recordsWritten: [
      "action_contract",
      "recovery_recommendation_status_transition",
      "proof_gap",
      "contract_stream_event",
    ],
    eventsEmitted: ["action_proposed", "recovery_status_changed", "proof_gap_recorded"],
    authorityBoundary: "proposed exact action only",
    evidenceObligation: "bind a contractable candidate or record refusal/proof-gap evidence",
  },
  {
    transitionId: "createAuthorityCertificate",
    kernelMethod: "createAuthorityCertificate",
    phase: "authority_certificate",
    outcomeClasses: ["exported"],
    recordsWritten: ["authority_certificate", "contract_stream_event"],
    eventsEmitted: ["authority_certificate_emitted"],
    authorityBoundary: "terminal signed evidence only",
    evidenceObligation:
      "sign canonical terminal evidence after receipt, durable refusal, proof-gap, or replay-refusal terminalization",
  },
  {
    transitionId: "evaluatePolicy",
    kernelMethod: "evaluatePolicy",
    phase: "policy",
    outcomeClasses: ["greenlight", "refusal", "review_required", "conflict"],
    recordsWritten: ["policy_decision", "greenlight", "contract_stream_event"],
    eventsEmitted: ["policy_decision_recorded", "action_greenlit", "action_refused", "review_required"],
    authorityBoundary: "policy decision and optional one-use greenlight",
    evidenceObligation: "bind exact contract, envelope, isolation, sequence, and posture evidence",
  },
  {
    transitionId: "createReviewArtifact",
    kernelMethod: "createReviewArtifact",
    phase: "review",
    outcomeClasses: ["recorded"],
    recordsWritten: ["review_artifact", "contract_stream_event"],
    eventsEmitted: ["review_artifact_recorded"],
    authorityBoundary: "review rendering evidence only",
    evidenceObligation: "bind rendered artifact to exact contract and policy input digests",
  },
  {
    transitionId: "createReviewDecision",
    kernelMethod: "createReviewDecision",
    phase: "review",
    outcomeClasses: ["recorded", "refusal"],
    recordsWritten: ["review_decision", "contract_stream_event"],
    eventsEmitted: ["review_decision_recorded"],
    authorityBoundary: "review decision evidence only",
    evidenceObligation: "bind decision to the exact review artifact and policy input",
  },
  {
    transitionId: "gatewayCheck",
    kernelMethod: "gatewayCheck",
    phase: "gateway",
    outcomeClasses: ["recorded", "proof_gap", "replay_refusal", "conflict"],
    recordsWritten: [
      "gateway_check_attempt",
      "mutation_attempt",
      "protected_surface_operation_claim",
      "receipt",
      "proof_gap",
      "contract_stream_event",
    ],
    eventsEmitted: [
      "gateway_checked",
      "gateway_refused",
      "mutation_attempted",
      "protected_surface_operation_claimed",
      "receipt_emitted",
      "proof_gap_recorded",
    ],
    authorityBoundary: "one exact gateway-checked mutation attempt",
    evidenceObligation: "reload contract, greenlight, posture, isolation, sequence, and gateway policy before mutation",
  },
  {
    transitionId: "reconcileSurfaceOperation",
    kernelMethod: "reconcileSurfaceOperation",
    phase: "operation_lifecycle",
    outcomeClasses: ["recorded", "proof_gap", "recovery"],
    recordsWritten: ["surface_operation_reconciliation", "proof_gap", "contract_stream_event"],
    eventsEmitted: [
      "surface_operation_reconciled",
      "protected_surface_operation_released",
      "proof_gap_recorded",
      "proof_gap_resolved",
    ],
    authorityBoundary: "downstream observation only",
    evidenceObligation: "observe finality or record proof gap without authorizing retry mutation",
  },
  {
    transitionId: "createIsolationState",
    kernelMethod: "createIsolationState",
    phase: "isolation",
    outcomeClasses: ["recorded"],
    recordsWritten: ["isolation_state", "contract_stream_event"],
    eventsEmitted: ["isolation_changed"],
    authorityBoundary: "future authority reduction only",
    evidenceObligation: "record isolation state that later policy and gateway checks must consult",
  },
  {
    transitionId: "createBreakerDecision",
    kernelMethod: "createBreakerDecision",
    phase: "isolation",
    outcomeClasses: ["recorded"],
    recordsWritten: ["breaker_decision", "isolation_state", "contract_stream_event"],
    eventsEmitted: ["breaker_decision_recorded", "isolation_changed"],
    authorityBoundary: "watermark-bound halt/quarantine decision",
    evidenceObligation: "record observed stream watermark and resulting isolation state atomically",
  },
  {
    transitionId: "createReceiptExport",
    kernelMethod: "createReceiptExport",
    phase: "receipt_export",
    outcomeClasses: ["exported", "refusal"],
    recordsWritten: ["receipt_export", "contract_stream_event"],
    eventsEmitted: ["receipt_exported"],
    authorityBoundary: "existing receipt packaging only",
    evidenceObligation: "bind stored receipt digest without creating execution proof",
  },
  {
    transitionId: "createRecoveryRecommendation",
    kernelMethod: "createRecoveryRecommendation",
    phase: "recovery",
    outcomeClasses: ["recovery", "refusal"],
    recordsWritten: ["recovery_recommendation", "contract_stream_event"],
    eventsEmitted: ["recovery_recommended"],
    authorityBoundary: "recovery recommendation only",
    evidenceObligation: "derive narrower future path from refusal or proof-gap evidence without inheriting greenlight",
  },
  {
    transitionId: "transitionRecoveryRecommendationStatus",
    kernelMethod: "transitionRecoveryRecommendationStatus",
    phase: "recovery",
    outcomeClasses: ["recorded", "conflict"],
    recordsWritten: ["recovery_recommendation_status_transition", "proof_gap", "contract_stream_event"],
    eventsEmitted: ["recovery_status_changed", "proof_gap_recorded"],
    authorityBoundary: "recovery status evidence only",
    evidenceObligation: "record terminal status races as proof gaps instead of silently choosing a winner",
  },
  {
    transitionId: "resolveRecoveryTerminalConflictProofGap",
    kernelMethod: "resolveRecoveryTerminalConflictProofGap",
    phase: "recovery",
    outcomeClasses: ["recovery"],
    recordsWritten: [
      "proof_gap",
      "recovery_recommendation_status_transition",
      "recovery_recommendation",
      "contract_stream_event",
    ],
    eventsEmitted: ["proof_gap_resolved"],
    authorityBoundary: "proof-gap resolution only",
    evidenceObligation: "bind terminal-conflict proof gap to observed winning terminal evidence",
  },
] as const satisfies readonly ProtocolNavigationEntry[];

export const protocolNavigationByTransitionId = Object.fromEntries(
  protocolNavigation.map((entry) => [entry.transitionId, entry]),
) as Record<ProtocolTransitionId, ProtocolNavigationEntry>;

export function protocolKernelMethods(): KernelTransitionMethod[] {
  return [...new Set(protocolNavigation.map((entry) => entry.kernelMethod))].sort();
}

function catalogEntry(
  transitionId: Extract<
    ProtocolTransitionId,
    "registerToolCapability" | "registerActionType" | "registerGatewayRegistryEntry" | "registerOperatingEnvelope"
  >,
  objectType: ProtocolObjectType,
): ProtocolNavigationEntry {
  return {
    transitionId,
    kernelMethod: "putCatalogObject",
    phase: "catalog",
    outcomeClasses: ["recorded", "idempotent", "conflict"],
    recordsWritten: [objectType],
    eventsEmitted: [],
    authorityBoundary: "catalog availability only",
    evidenceObligation: "same-id replacement must have the same canonical digest",
  };
}
