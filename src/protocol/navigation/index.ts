import type { ContractStreamEvent } from "../events/schemas";
import type { ProtocolObjectType } from "../areas/object-registry/schemas";

export type KernelTransitionMethod =
  | "putCatalogObject"
  | "registerInstallProposalCompiledRecords"
  | "compileIntent"
  | "createRuntimeExecution"
  | "createGeneratedExecutionGraph"
  | "registerGatewayCredentialRef"
  | "registerDelegatedAuthorityRef"
  | "transitionDelegatedAuthorityStatus"
  | "recordGatewayCustodyProofPacket"
  | "recordCredentialResolutionEvidence"
  | "createBypassProbe"
  | "createToolCallDraft"
  | "transitionToolCallDraft"
  | "createProtectedPathPosture"
  | "proposeActionContract"
  | "recordNegotiationSession"
  | "recordNegotiationOffer"
  | "recordNegotiationDecision"
  | "recordLinkedAgreement"
  | "recordAgreementObligationBinding"
  | "transitionAgreementStatus"
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
  | "registerInstallProposalCompiledRecords"
  | "compileIntent"
  | "createRuntimeExecution"
  | "createGeneratedExecutionGraph"
  | "registerGatewayCredentialRef"
  | "registerDelegatedAuthorityRef"
  | "transitionDelegatedAuthorityStatus"
  | "recordGatewayCustodyProofPacket"
  | "recordCredentialResolutionEvidence"
  | "createBypassProbe"
  | "createToolCallDraft"
  | "transitionToolCallDraft"
  | "createProtectedPathPosture"
  | "proposeActionContract"
  | "recordNegotiationSession"
  | "recordNegotiationOffer"
  | "recordNegotiationDecision"
  | "recordLinkedAgreement"
  | "recordAgreementObligationBinding"
  | "transitionAgreementStatus"
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
  | "install_setup"
  | "intent_compilation"
  | "runtime_evidence"
  | "generated_execution_graph"
  | "credential_custody"
  | "delegated_authority"
  | "protected_path_posture"
  | "action_contract"
  | "negotiation"
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
  integratorParity?: boolean;
};

export const integratorParityTransitionIds = [
  "registerToolCapability",
  "registerActionType",
  "registerGatewayRegistryEntry",
  "registerOperatingEnvelope",
  "registerInstallProposalCompiledRecords",
  "registerDelegatedAuthorityRef",
  "compileIntent",
  "proposeActionContract",
  "evaluatePolicy",
  "gatewayCheck",
  "reconcileSurfaceOperation",
] as const satisfies readonly ProtocolTransitionId[];

const integratorParityIds = new Set<string>(integratorParityTransitionIds);

export const protocolNavigation = [
  catalogEntry("registerToolCapability", "tool_capability"),
  catalogEntry("registerActionType", "action_type"),
  catalogEntry("registerGatewayRegistryEntry", "gateway_registry_entry"),
  catalogEntry("registerOperatingEnvelope", "operating_envelope"),
  {
    integratorParity: true,
    transitionId: "registerInstallProposalCompiledRecords",
    kernelMethod: "registerInstallProposalCompiledRecords",
    phase: "install_setup",
    outcomeClasses: ["recorded", "refusal", "conflict"],
    recordsWritten: [
      "tool_capability",
      "action_type",
      "gateway_registry_entry",
      "operating_envelope",
      "refusal",
      "contract_stream_event",
    ],
    eventsEmitted: ["install_setup_recorded", "install_setup_refused"],
    authorityBoundary: "install setup evidence only",
    evidenceObligation:
      "atomically register compiled setup records or refusal without issuing policy, greenlight, gate, credential, mutation, receipt, or certificate authority",
  },
  {
    integratorParity: true,
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
    transitionId: "registerGatewayCredentialRef",
    kernelMethod: "registerGatewayCredentialRef",
    phase: "credential_custody",
    outcomeClasses: ["recorded"],
    recordsWritten: ["gateway_credential_ref", "contract_stream_event"],
    eventsEmitted: ["gateway_credential_ref_registered"],
    authorityBoundary: "gateway credential custody evidence only",
    evidenceObligation: "record opaque gateway credential ref without exposing secret material or minting authority",
  },
  {
    integratorParity: true,
    transitionId: "registerDelegatedAuthorityRef",
    kernelMethod: "registerDelegatedAuthorityRef",
    phase: "delegated_authority",
    outcomeClasses: ["recorded"],
    recordsWritten: ["delegated_authority_ref", "contract_stream_event"],
    eventsEmitted: ["delegated_authority_ref_registered"],
    authorityBoundary: "delegated authority evidence only",
    evidenceObligation:
      "record principal-scoped attempt authority bounds without issuing policy, greenlight, gate, or mutation authority",
  },
  {
    transitionId: "transitionDelegatedAuthorityStatus",
    kernelMethod: "transitionDelegatedAuthorityStatus",
    phase: "delegated_authority",
    outcomeClasses: ["recorded"],
    recordsWritten: ["delegated_authority_status_transition", "isolation_state", "contract_stream_event"],
    eventsEmitted: ["delegated_authority_status_changed", "isolation_changed"],
    authorityBoundary: "future authority reduction only",
    evidenceObligation:
      "record terminal delegated authority status and authority-ref isolation without minting mutation authority",
  },
  {
    transitionId: "recordGatewayCustodyProofPacket",
    kernelMethod: "recordGatewayCustodyProofPacket",
    phase: "credential_custody",
    outcomeClasses: ["recorded", "refusal", "proof_gap"],
    recordsWritten: ["gateway_custody_proof_packet", "contract_stream_event"],
    eventsEmitted: ["gateway_custody_proof_packet_recorded"],
    authorityBoundary: "redacted gateway custody proof evidence only",
    evidenceObligation:
      "bind credential ref, protected-path posture, bypass probes, drift, and redaction posture without issuing policy, greenlight, gate, or mutation authority",
  },
  {
    transitionId: "recordCredentialResolutionEvidence",
    kernelMethod: "recordCredentialResolutionEvidence",
    phase: "credential_custody",
    outcomeClasses: ["recorded", "refusal", "proof_gap"],
    recordsWritten: ["credential_resolution_evidence", "contract_stream_event"],
    eventsEmitted: ["credential_resolution_recorded"],
    authorityBoundary: "post-gate credential resolution evidence only",
    evidenceObligation:
      "bind credential resolution/use evidence to exact contract, greenlight, and passed gateway check without exposing secret material",
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
    integratorParity: true,
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
    transitionId: "recordNegotiationSession",
    kernelMethod: "recordNegotiationSession",
    phase: "negotiation",
    outcomeClasses: ["recorded", "conflict"],
    recordsWritten: ["negotiation_session", "contract_stream_event"],
    eventsEmitted: ["negotiation_session_recorded"],
    authorityBoundary: "negotiation context evidence only",
    evidenceObligation:
      "record parties, runtime posture, assumptions, uncertainty, and imported protocol evidence without issuing policy, greenlight, gate, mutation, receipt, or certificate authority",
  },
  {
    transitionId: "recordNegotiationOffer",
    kernelMethod: "recordNegotiationOffer",
    phase: "negotiation",
    outcomeClasses: ["recorded", "conflict"],
    recordsWritten: ["negotiation_offer", "contract_stream_event"],
    eventsEmitted: ["negotiation_offer_recorded"],
    authorityBoundary: "offer evidence only",
    evidenceObligation:
      "record a specific offer version and reconstruction refs without turning accepted terms into protected-action authority",
  },
  {
    transitionId: "recordNegotiationDecision",
    kernelMethod: "recordNegotiationDecision",
    phase: "negotiation",
    outcomeClasses: ["recorded", "conflict"],
    recordsWritten: ["negotiation_decision", "contract_stream_event"],
    eventsEmitted: ["negotiation_decision_recorded"],
    authorityBoundary: "decision evidence only",
    evidenceObligation:
      "record accept, reject, counter, withdraw, or expire against one current offer version without issuing an action contract or greenlight",
  },
  {
    transitionId: "recordLinkedAgreement",
    kernelMethod: "recordLinkedAgreement",
    phase: "negotiation",
    outcomeClasses: ["recorded", "conflict"],
    recordsWritten: ["linked_agreement", "contract_stream_event"],
    eventsEmitted: ["linked_agreement_recorded"],
    authorityBoundary: "accepted agreement evidence only",
    evidenceObligation:
      "bind the accepted decision, offer digest, accepting party, and counterparty ref without authorizing any mutation",
  },
  {
    transitionId: "recordAgreementObligationBinding",
    kernelMethod: "recordAgreementObligationBinding",
    phase: "negotiation",
    outcomeClasses: ["recorded", "conflict"],
    recordsWritten: ["agreement_obligation_binding", "contract_stream_event"],
    eventsEmitted: ["agreement_obligation_binding_recorded"],
    authorityBoundary: "obligation-to-contract evidence only",
    evidenceObligation:
      "bind one active agreement obligation to one exact action contract digest, params digest, action type, resource, and counterparty before policy may consider it",
  },
  {
    transitionId: "transitionAgreementStatus",
    kernelMethod: "transitionAgreementStatus",
    phase: "negotiation",
    outcomeClasses: ["recorded", "conflict"],
    recordsWritten: ["agreement_status_transition", "contract_stream_event"],
    eventsEmitted: ["agreement_status_transition_recorded"],
    authorityBoundary: "agreement lifecycle evidence only",
    evidenceObligation:
      "record withdrawal, dispute, expiry, supersession, or resolution so future policy can refuse stale agreement-backed contracts",
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
    integratorParity: true,
    transitionId: "evaluatePolicy",
    kernelMethod: "evaluatePolicy",
    phase: "policy",
    outcomeClasses: ["greenlight", "refusal", "review_required", "proof_gap", "conflict"],
    recordsWritten: [
      "policy_decision",
      "greenlight",
      "refusal",
      "proof_gap",
      "idempotency_ledger_entry",
      "contract_stream_event",
    ],
    eventsEmitted: [
      "policy_decision_recorded",
      "action_greenlit",
      "action_refused",
      "review_required",
      "proof_gap_recorded",
      "idempotency_ledger_recorded",
    ],
    authorityBoundary: "policy decision and optional one-use greenlight",
    evidenceObligation:
      "bind exact contract, envelope, isolation, sequence, protected-path, credential, readiness, policy-version, and idempotency evidence",
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
    integratorParity: true,
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
    integratorParity: true,
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
    integratorParity: integratorParityIds.has(transitionId),
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
