import type { TransitionCallerRole } from "../../src/http/caller-auth";
import type { TransitionRouteId } from "../../src/http/transition-invokers";
import type { ContractStreamEvent } from "../../src/protocol/event-schemas";
import type { ProtocolObjectType } from "../../src/protocol/object-registry/schemas";

export type KernelTransitionMethod =
  | "putCatalogObject"
  | "compileIntent"
  | "createRuntimeExecution"
  | "createGeneratedExecutionGraph"
  | "createProtectedPathPosture"
  | "proposeActionContract"
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

export type TransitionMatrixEntry = {
  routeId: TransitionRouteId | null;
  kernelMethod: KernelTransitionMethod;
  path: `/v0.2/${string}` | null;
  callerCustodyRole: TransitionCallerRole | "graph_evidence_issuer";
  inputSchema: string;
  outcomeClasses: TransitionOutcomeClass[];
  recordsWritten: ProtocolObjectType[];
  eventsEmitted: ContractStreamEvent["eventType"][];
  indexEffects: string[];
  proofOrRefusalObligation: string;
  commitConflictBehavior: string[];
  illegalAuthorityClaims: string[];
  invariantTests: string[];
};

export const transitionMatrix = [
  catalogEntry("registerToolCapability", "/v0.2/catalog/tool-capabilities", "ToolCapabilitySchema", "tool_capability"),
  catalogEntry("registerActionType", "/v0.2/catalog/action-types", "ActionTypeSchema", "action_type"),
  catalogEntry(
    "registerGatewayRegistryEntry",
    "/v0.2/catalog/gateways",
    "GatewayRegistryEntrySchema",
    "gateway_registry_entry",
  ),
  catalogEntry("registerOperatingEnvelope", "/v0.2/envelopes", "OperatingEnvelopeSchema", "operating_envelope"),
  {
    routeId: "compileIntent",
    kernelMethod: "compileIntent",
    path: "/v0.2/intent-compilations",
    callerCustodyRole: "runtime_evidence",
    inputSchema: "CompileIntentInputSchema",
    outcomeClasses: ["recorded", "refusal"],
    recordsWritten: ["intent_compilation", "contract_stream_event"],
    eventsEmitted: ["intent_compiled"],
    indexEffects: ["appends intent stream evidence"],
    proofOrRefusalObligation: "candidate uncertainty, overreach, missing catalog, or unwrapped tool evidence is recorded as compiler refusal evidence before any ActionContract exists",
    commitConflictBehavior: ["stream_conflict rebuilds event chain without minting authority"],
    illegalAuthorityClaims: ["intent compilation is not an ActionContract", "candidate evidence is not mutation authority"],
    invariantTests: ["kernel refuses unwrapped consequential tool before contract", "runtime execution evidence alone never mints authority"],
  },
  {
    routeId: null,
    kernelMethod: "createGeneratedExecutionGraph",
    path: null,
    callerCustodyRole: "graph_evidence_issuer",
    inputSchema: "CreateGeneratedExecutionGraphInputSchema + GraphEvidenceIssuerContextSchema",
    outcomeClasses: ["recorded", "refusal"],
    recordsWritten: ["generated_execution_graph", "contract_stream_event"],
    eventsEmitted: ["generated_execution_graph_recorded"],
    indexEffects: ["appends generated execution graph evidence for a runtime execution block"],
    proofOrRefusalObligation: "records whole-block graph coverage, unsupported siblings, redaction posture, command-risk posture, and graph issuer custody without authorizing mutation",
    commitConflictBehavior: ["stream_conflict rebuilds graph event chain without minting authority", "nonce replay refuses duplicate graph evidence for the same runtime execution"],
    illegalAuthorityClaims: ["generated graph evidence is not permission", "a clean graph is not an ActionContract"],
    invariantTests: ["missing or unsafe graph coverage rejects generated-block candidates before contract", "graph transition never creates policy, greenlight, gate, mutation, or proof gap"],
  },
  {
    routeId: "createRuntimeExecution",
    kernelMethod: "createRuntimeExecution",
    path: "/v0.2/runtime-executions",
    callerCustodyRole: "runtime_evidence",
    inputSchema: "CreateRuntimeExecutionInputSchema",
    outcomeClasses: ["recorded"],
    recordsWritten: ["runtime_execution", "contract_stream_event"],
    eventsEmitted: ["runtime_execution_recorded"],
    indexEffects: ["appends runtime evidence stream event"],
    proofOrRefusalObligation: "records execution-block shape, uncertainty, dynamic tool construction, and unobserved regions without issuing policy, greenlight, gate, or mutation",
    commitConflictBehavior: ["stream_conflict rebuilds event chain without minting authority"],
    illegalAuthorityClaims: ["runtime execution is not permission", "generated code is not an action contract"],
    invariantTests: ["runtime execution record never creates policy, greenlight, gate, or mutation"],
  },
  {
    routeId: "createProtectedPathPosture",
    kernelMethod: "createProtectedPathPosture",
    path: "/v0.2/protected-path-postures",
    callerCustodyRole: "gateway_custody",
    inputSchema: "CreateProtectedPathPostureInputSchema",
    outcomeClasses: ["recorded"],
    recordsWritten: ["protected_path_posture", "contract_stream_event"],
    eventsEmitted: ["protected_path_posture_recorded"],
    indexEffects: ["updates current protected-path posture pointer atomically with record and event"],
    proofOrRefusalObligation: "posture evidence can inform policy and gate checks but cannot replace a greenlight or gateway check",
    commitConflictBehavior: ["stream_conflict refuses/rebuilds without changing posture separately"],
    illegalAuthorityClaims: ["gateway_checked posture is not a greenlight", "posture evidence is not mutation authority"],
    invariantTests: ["policy refuses missing, stale, or unsafe required posture", "gateway refuses unsafe posture drift after greenlight"],
  },
  {
    routeId: "proposeActionContract",
    kernelMethod: "proposeActionContract",
    path: "/v0.2/action-contracts",
    callerCustodyRole: "control_plane",
    inputSchema: "ProposeActionContractInputSchema",
    outcomeClasses: ["recorded", "refusal", "conflict"],
    recordsWritten: ["action_contract", "recovery_recommendation_status_transition", "proof_gap", "contract_stream_event"],
    eventsEmitted: ["action_proposed", "recovery_status_changed", "proof_gap_recorded"],
    indexEffects: ["may claim recovery recommendation terminal status before linked follow-up action"],
    proofOrRefusalObligation: "only contractable candidate evidence may become an exact ActionContract; recovery-linked proposals must bind required new evidence",
    commitConflictBehavior: ["stream_conflict rebuilds event chain", "recovery_terminal_conflict records proof gap and no ActionContract"],
    illegalAuthorityClaims: ["ActionContract is proposed commitment, not execution authority"],
    invariantTests: ["mismatched candidate digest refuses proposal", "recovery terminal conflict creates proof gap and no contract"],
  },
  {
    routeId: "evaluatePolicy",
    kernelMethod: "evaluatePolicy",
    path: "/v0.2/policy-decisions",
    callerCustodyRole: "control_plane",
    inputSchema: "EvaluatePolicyInputSchema",
    outcomeClasses: ["greenlight", "refusal", "review_required", "conflict"],
    recordsWritten: ["policy_decision", "greenlight", "contract_stream_event"],
    eventsEmitted: ["policy_decision_recorded", "action_greenlit", "action_refused", "review_required"],
    indexEffects: ["claims one greenlight issuance per ActionContract when decision is greenlight"],
    proofOrRefusalObligation: "policy input digest binds exact contract, envelope, isolation, sequence, and required posture evidence",
    commitConflictBehavior: ["greenlight_issuance_conflict refuses second greenlight", "stream_conflict rebuilds policy events"],
    illegalAuthorityClaims: ["policy decision is not execution proof", "review_required is not approval"],
    invariantTests: ["rejects second greenlight for same ActionContract", "refuses isolated or stale-posture policy paths"],
  },
  {
    routeId: "createReviewArtifact",
    kernelMethod: "createReviewArtifact",
    path: "/v0.2/review-artifacts",
    callerCustodyRole: "review_custody",
    inputSchema: "CreateReviewArtifactInputSchema",
    outcomeClasses: ["recorded"],
    recordsWritten: ["review_artifact", "contract_stream_event"],
    eventsEmitted: ["review_artifact_recorded"],
    indexEffects: ["appends review custody evidence"],
    proofOrRefusalObligation: "rendered review artifact must bind exact contract, policy input, gateway policy, and uncertainty digests",
    commitConflictBehavior: ["stream_conflict rebuilds review artifact event"],
    illegalAuthorityClaims: ["rendered review is not permission", "review artifact is not a greenlight"],
    invariantTests: ["review approval succeeds only when artifact and policy digests match"],
  },
  {
    routeId: "createReviewDecision",
    kernelMethod: "createReviewDecision",
    path: "/v0.2/review-decisions",
    callerCustodyRole: "review_custody",
    inputSchema: "CreateReviewDecisionInputSchema",
    outcomeClasses: ["recorded", "refusal"],
    recordsWritten: ["review_decision", "contract_stream_event"],
    eventsEmitted: ["review_decision_recorded"],
    indexEffects: ["appends review custody decision evidence"],
    proofOrRefusalObligation: "review decision must bind the exact review artifact and digests accepted by policy",
    commitConflictBehavior: ["stream_conflict rebuilds review decision event"],
    illegalAuthorityClaims: ["review decision cannot bypass policy evaluation", "review decision is not a reusable approval"],
    invariantTests: ["review artifact digest mismatch refuses approval"],
  },
  {
    routeId: "gatewayCheck",
    kernelMethod: "gatewayCheck",
    path: "/v0.2/gateway-check-attempts",
    callerCustodyRole: "gateway_custody",
    inputSchema: "GatewayCheckInputSchema",
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
    indexEffects: ["consumes one greenlight", "may claim protected surface operation", "indexes receipt by mutation attempt"],
    proofOrRefusalObligation: "the gateway reloads current contract, greenlight, posture, isolation, sequence, and gateway policy before mutation",
    commitConflictBehavior: ["already_consumed records replay refusal", "operation_claim_conflict refuses second same-surface mutation", "stream_conflict rebuilds gate events"],
    illegalAuthorityClaims: ["one greenlight cannot authorize multiple mutations", "gateway check receipt is not downstream business success"],
    invariantTests: ["passes gateway once and refuses replay", "refuses drift, mismatch, isolation, or active operation claim before mutation"],
  },
  {
    routeId: "reconcileSurfaceOperation",
    kernelMethod: "reconcileSurfaceOperation",
    path: "/v0.2/surface-operation-reconciliations",
    callerCustodyRole: "gateway_custody",
    inputSchema: "ReconcileSurfaceOperationInputSchema",
    outcomeClasses: ["recorded", "proof_gap", "recovery"],
    recordsWritten: ["surface_operation_reconciliation", "proof_gap", "contract_stream_event"],
    eventsEmitted: ["surface_operation_reconciled", "protected_surface_operation_released", "proof_gap_recorded", "proof_gap_resolved"],
    indexEffects: ["may release protected surface operation claim"],
    proofOrRefusalObligation: "reconciliation observes downstream finality or records proof gap; it cannot authorize retry mutation",
    commitConflictBehavior: ["stream_conflict rebuilds reconciliation events"],
    illegalAuthorityClaims: ["reconciliation is observation, not retry permission"],
    invariantTests: ["pending operation reconciles without second mutation", "unknown finality becomes proof gap"],
  },
  {
    routeId: "createIsolationState",
    kernelMethod: "createIsolationState",
    path: "/v0.2/isolation-states",
    callerCustodyRole: "control_plane",
    inputSchema: "CreateIsolationInputSchema",
    outcomeClasses: ["recorded"],
    recordsWritten: ["isolation_state", "contract_stream_event"],
    eventsEmitted: ["isolation_changed"],
    indexEffects: ["adds active isolation state consulted by policy and gate"],
    proofOrRefusalObligation: "future policy and gateway checks must refuse or halt affected scopes until isolation is cleared",
    commitConflictBehavior: ["stream_conflict rebuilds isolation event"],
    illegalAuthorityClaims: ["isolation write is not mutation authority"],
    invariantTests: ["isolation checked at policy and gateway"],
  },
  {
    routeId: "createBreakerDecision",
    kernelMethod: "createBreakerDecision",
    path: "/v0.2/breaker-decisions",
    callerCustodyRole: "control_plane",
    inputSchema: "CreateBreakerDecisionInputSchema",
    outcomeClasses: ["recorded"],
    recordsWritten: ["breaker_decision", "isolation_state", "contract_stream_event"],
    eventsEmitted: ["breaker_decision_recorded", "isolation_changed"],
    indexEffects: ["creates watermark-bound isolation state atomically with breaker decision"],
    proofOrRefusalObligation: "breaker decision must bind stream watermark evidence before creating isolation",
    commitConflictBehavior: ["stream_conflict rebuilds breaker/isolation events"],
    illegalAuthorityClaims: ["breaker decision halts authority; it does not grant authority"],
    invariantTests: ["breaker watermark mismatch refuses", "breaker isolation blocks later gate"],
  },
  {
    routeId: "createReceiptExport",
    kernelMethod: "createReceiptExport",
    path: "/v0.2/receipt-exports",
    callerCustodyRole: "control_plane",
    inputSchema: "CreateReceiptExportInputSchema",
    outcomeClasses: ["exported", "refusal"],
    recordsWritten: ["receipt_export", "contract_stream_event"],
    eventsEmitted: ["receipt_exported"],
    indexEffects: ["appends receipt export evidence"],
    proofOrRefusalObligation: "receipt export must bind the stored receipt digest and must not create execution proof",
    commitConflictBehavior: ["stream_conflict rebuilds receipt export event"],
    illegalAuthorityClaims: ["receipt export is not another mutation", "receipt export is not downstream success"],
    invariantTests: ["refuses stale receipt digest before export"],
  },
  {
    routeId: "createRecoveryRecommendation",
    kernelMethod: "createRecoveryRecommendation",
    path: "/v0.2/recovery-recommendations",
    callerCustodyRole: "control_plane",
    inputSchema: "CreateRecoveryRecommendationInputSchema",
    outcomeClasses: ["recovery", "refusal"],
    recordsWritten: ["recovery_recommendation", "contract_stream_event"],
    eventsEmitted: ["recovery_recommended"],
    indexEffects: ["appends recovery recommendation evidence"],
    proofOrRefusalObligation: "recommendation can narrow future proposals from refusal/proof-gap evidence but cannot inherit greenlight",
    commitConflictBehavior: ["stream_conflict rebuilds recovery recommendation event"],
    illegalAuthorityClaims: ["recovery recommendation is not retry authority", "recovery does not inherit prior greenlight"],
    invariantTests: ["recovery recommendation from proof-gap receipt creates no mutation authority"],
  },
  {
    routeId: "transitionRecoveryRecommendationStatus",
    kernelMethod: "transitionRecoveryRecommendationStatus",
    path: "/v0.2/recovery-recommendation-status-transitions",
    callerCustodyRole: "control_plane",
    inputSchema: "TransitionRecoveryRecommendationStatusInputSchema",
    outcomeClasses: ["recorded", "conflict"],
    recordsWritten: ["recovery_recommendation_status_transition", "proof_gap", "contract_stream_event"],
    eventsEmitted: ["recovery_status_changed", "proof_gap_recorded"],
    indexEffects: ["claims recovery terminal status"],
    proofOrRefusalObligation: "terminal status races must not silently choose a winner without evidence",
    commitConflictBehavior: ["recovery_terminal_conflict records proof gap", "stream_conflict rebuilds status event"],
    illegalAuthorityClaims: ["terminal status does not authorize a follow-up mutation"],
    invariantTests: ["terminal claim race records recovery terminal conflict proof gap"],
  },
  {
    routeId: "resolveRecoveryTerminalConflictProofGap",
    kernelMethod: "resolveRecoveryTerminalConflictProofGap",
    path: "/v0.2/recovery-terminal-conflict-resolutions",
    callerCustodyRole: "control_plane",
    inputSchema: "ResolveRecoveryTerminalConflictInputSchema",
    outcomeClasses: ["recovery"],
    recordsWritten: ["proof_gap", "recovery_recommendation_status_transition", "recovery_recommendation", "contract_stream_event"],
    eventsEmitted: ["proof_gap_resolved"],
    indexEffects: ["marks existing terminal-conflict proof gap resolved by winning terminal transition"],
    proofOrRefusalObligation: "resolution must bind the proof gap to observed winning terminal evidence",
    commitConflictBehavior: ["stream_conflict rebuilds proof-gap resolution event"],
    illegalAuthorityClaims: ["proof-gap resolution is not mutation authority"],
    invariantTests: ["resolves terminal conflict proof gap against winning transition"],
  },
] as const satisfies readonly TransitionMatrixEntry[];

export const transitionMatrixByRouteId = Object.fromEntries(
  transitionMatrix.filter((entry) => entry.routeId !== null).map((entry) => [entry.routeId, entry]),
) as Record<TransitionRouteId, TransitionMatrixEntry>;

export function transitionKernelMethods(): KernelTransitionMethod[] {
  return [...new Set(transitionMatrix.map((entry) => entry.kernelMethod))].sort();
}

function catalogEntry(
  routeId: TransitionRouteId,
  path: `/v0.2/${string}`,
  inputSchema: string,
  objectType: ProtocolObjectType,
): TransitionMatrixEntry {
  return {
    routeId,
    kernelMethod: "putCatalogObject",
    path,
    callerCustodyRole: "control_plane",
    inputSchema,
    outcomeClasses: ["recorded", "idempotent", "conflict"],
    recordsWritten: [objectType],
    eventsEmitted: [],
    indexEffects: ["writes immutable catalog object by object id"],
    proofOrRefusalObligation: "same-id replacement must have the same canonical digest; catalog registration never authorizes mutation",
    commitConflictBehavior: ["bootstrap_record_digest_conflict refuses same-id replacement"],
    illegalAuthorityClaims: ["catalog object is availability, not authorization", "tool availability is not tool authorization"],
    invariantTests: ["bootstrap catalog registration is idempotent for same digest and rejects same-id replacement"],
  };
}
