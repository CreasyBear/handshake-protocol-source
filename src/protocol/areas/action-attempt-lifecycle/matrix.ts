import type { ProtocolTransitionId, TransitionOutcomeClass } from "../../navigation";
import { protocolNavigation } from "../../navigation";
import {
  ActionAttemptLifecycleEntrySchema,
  type ActionAttemptLifecycleEntry,
  type ActionAttemptLifecycleState,
} from "./types";

export type ActionAttemptLifecycleKey = `${ProtocolTransitionId}:${TransitionOutcomeClass}`;

export type ActionAttemptLifecycleMatrixEntry = ActionAttemptLifecycleEntry & {
  transitionId: ProtocolTransitionId;
  outcomeClass: TransitionOutcomeClass;
};

export const actionAttemptHostileTraceClasses = [
  "unknown_consequential_tool",
  "raw_sibling_mutation_path",
  "dynamic_tool_or_params",
  "stale_or_abandoned_draft",
  "hidden_lifecycle_side_effect",
  "changed_payment_requirements",
  "missing_downstream_response",
  "params_mismatch",
] as const;
export type ActionAttemptHostileTraceClass = (typeof actionAttemptHostileTraceClasses)[number];

export type ActionAttemptHostileTraceEntry = ActionAttemptLifecycleEntry & {
  traceClass: ActionAttemptHostileTraceClass;
  sourceDocRef: "doc08:4.4.1" | "doc08:4.10";
};

const catalogRecorded = {
  phase: "observation",
  state: "catalog_registered",
  authorityEffect: "evidence_only",
  terminalOutcome: "evidence_only",
} as const;

export const actionAttemptHostileTraceMatrix: Record<ActionAttemptHostileTraceClass, ActionAttemptLifecycleEntry> = {
  unknown_consequential_tool: entry(
    {
      phase: "compilation",
      state: "candidate_refused",
      authorityEffect: "none",
      terminalOutcome: "refusal",
    },
    "unknown consequential tool evidence must refuse before candidate contractability",
  ),
  raw_sibling_mutation_path: entry(
    {
      phase: "observation",
      state: "bypass_risk_recorded",
      authorityEffect: "evidence_only",
      terminalOutcome: "evidence_only",
    },
    "raw shell, browser, package, network, filesystem, or MCP sibling paths remain bypass-risk evidence only",
  ),
  dynamic_tool_or_params: entry(
    {
      phase: "compilation",
      state: "candidate_refused",
      authorityEffect: "none",
      terminalOutcome: "refusal",
    },
    "dynamic tool names or dynamically constructed consequential params must refuse before contract proposal",
  ),
  stale_or_abandoned_draft: entry(
    {
      phase: "drafting",
      state: "draft_refused",
      authorityEffect: "none",
      terminalOutcome: "refusal",
    },
    "stale or abandoned drafts cannot compile into authority",
  ),
  hidden_lifecycle_side_effect: entry(
    {
      phase: "downstream",
      state: "downstream_proof_gap",
      authorityEffect: "downstream_evidence",
      terminalOutcome: "terminal_unknown",
    },
    "hidden lifecycle side effects remain terminal-unknown evidence until recovery resolves them",
  ),
  changed_payment_requirements: entry(
    {
      phase: "compilation",
      state: "candidate_refused",
      authorityEffect: "none",
      terminalOutcome: "refusal",
    },
    "changed payment requirements must refuse before the exact contract can be proposed",
  ),
  missing_downstream_response: entry(
    {
      phase: "downstream",
      state: "downstream_proof_gap",
      authorityEffect: "downstream_evidence",
      terminalOutcome: "proof_gap",
    },
    "missing downstream response records proof gap instead of downstream success",
  ),
  params_mismatch: entry(
    {
      phase: "compilation",
      state: "candidate_refused",
      authorityEffect: "none",
      terminalOutcome: "refusal",
    },
    "parameter mismatches stop as refusal before the mismatched consequence can execute",
  ),
};

export const actionAttemptLifecycleMatrix: Partial<Record<ActionAttemptLifecycleKey, ActionAttemptLifecycleEntry>> = {
  "registerToolCapability:recorded": entry(catalogRecorded, "catalog entry was registered as proposal shape evidence"),
  "registerToolCapability:idempotent": entry(
    catalogRecorded,
    "existing catalog entry was reused without new authority",
  ),
  "registerToolCapability:conflict": entry(
    { ...catalogRecorded, state: "catalog_conflict", terminalOutcome: "refusal" },
    "catalog conflict blocks proposal-shape registration",
  ),
  "registerActionType:recorded": entry(catalogRecorded, "action type was registered as proposal shape evidence"),
  "registerActionType:idempotent": entry(catalogRecorded, "existing action type was reused without new authority"),
  "registerActionType:conflict": entry(
    { ...catalogRecorded, state: "catalog_conflict", terminalOutcome: "refusal" },
    "action type conflict blocks proposal-shape registration",
  ),
  "registerGatewayRegistryEntry:recorded": entry(
    catalogRecorded,
    "gateway registry entry was registered as protected-surface evidence",
  ),
  "registerGatewayRegistryEntry:idempotent": entry(
    catalogRecorded,
    "existing gateway registry entry was reused without new authority",
  ),
  "registerGatewayRegistryEntry:conflict": entry(
    { ...catalogRecorded, state: "catalog_conflict", terminalOutcome: "refusal" },
    "gateway registry conflict blocks proposal-shape registration",
  ),
  "registerOperatingEnvelope:recorded": entry(catalogRecorded, "operating envelope was registered as bounds evidence"),
  "registerOperatingEnvelope:idempotent": entry(
    catalogRecorded,
    "existing operating envelope was reused without new authority",
  ),
  "registerOperatingEnvelope:conflict": entry(
    { ...catalogRecorded, state: "catalog_conflict", terminalOutcome: "refusal" },
    "operating envelope conflict blocks bounds registration",
  ),
  "registerInstallProposalCompiledRecords:recorded": entry(
    catalogRecorded,
    "compiled install proposal records were atomically registered as setup evidence",
  ),
  "registerInstallProposalCompiledRecords:refusal": entry(
    {
      phase: "compilation",
      state: "candidate_refused",
      authorityEffect: "none",
      terminalOutcome: "refusal",
    },
    "refused install proposals record refusal evidence without partial catalog writes",
  ),
  "registerInstallProposalCompiledRecords:conflict": entry(
    { ...catalogRecorded, state: "catalog_conflict", terminalOutcome: "refusal" },
    "same-id different-digest install records block the entire setup commit",
  ),

  "createRuntimeExecution:recorded": entry(
    {
      phase: "observation",
      state: "runtime_observed",
      authorityEffect: "evidence_only",
      terminalOutcome: "evidence_only",
    },
    "runtime evidence records observed execution shape only",
  ),
  "createGeneratedExecutionGraph:recorded": entry(
    {
      phase: "observation",
      state: "generated_graph_recorded",
      authorityEffect: "evidence_only",
      terminalOutcome: "evidence_only",
    },
    "generated graph records code/spec evidence only",
  ),
  "createGeneratedExecutionGraph:refusal": entry(
    {
      phase: "observation",
      state: "bypass_risk_recorded",
      authorityEffect: "none",
      terminalOutcome: "proof_gap",
    },
    "unsafe generated graph evidence terminates as refusal or proof gap before contract",
  ),
  "registerGatewayCredentialRef:recorded": entry(
    {
      phase: "observation",
      state: "credential_custody_recorded",
      authorityEffect: "evidence_only",
      terminalOutcome: "evidence_only",
    },
    "gateway credential ref records custody evidence only and cannot expose credential material",
  ),
  "registerDelegatedAuthorityRef:recorded": entry(
    {
      phase: "observation",
      state: "authority_scope_recorded",
      authorityEffect: "evidence_only",
      terminalOutcome: "evidence_only",
    },
    "delegated authority ref records principal-scoped attempt bounds without minting greenlight or mutation authority",
  ),
  "recordGatewayCustodyProofPacket:recorded": entry(
    {
      phase: "observation",
      state: "credential_custody_recorded",
      authorityEffect: "evidence_only",
      terminalOutcome: "evidence_only",
    },
    "gateway custody proof packet records redacted custody posture evidence without minting authority",
  ),
  "recordGatewayCustodyProofPacket:refusal": entry(
    {
      phase: "observation",
      state: "credential_custody_recorded",
      authorityEffect: "none",
      terminalOutcome: "refusal",
    },
    "gateway custody proof packet failures refuse weak custody evidence before policy or gateway authority",
  ),
  "recordGatewayCustodyProofPacket:proof_gap": entry(
    {
      phase: "observation",
      state: "credential_custody_recorded",
      authorityEffect: "evidence_only",
      terminalOutcome: "proof_gap",
    },
    "gateway custody proof packet uncertainty remains evidence instead of permission",
  ),
  "recordCredentialResolutionEvidence:recorded": entry(
    {
      phase: "gateway",
      state: "credential_custody_recorded",
      authorityEffect: "evidence_only",
      terminalOutcome: "open",
    },
    "credential resolution evidence binds to a passed gateway check without minting new authority",
  ),
  "recordCredentialResolutionEvidence:refusal": entry(
    {
      phase: "gateway",
      state: "gateway_conflict",
      authorityEffect: "none",
      terminalOutcome: "refusal",
    },
    "credential resolution evidence that cannot bind to the exact passed gate is refused",
  ),
  "recordCredentialResolutionEvidence:proof_gap": entry(
    {
      phase: "gateway",
      state: "gateway_proof_gap",
      authorityEffect: "evidence_only",
      terminalOutcome: "proof_gap",
    },
    "credential resolution uncertainty remains proof-gap evidence instead of execution proof",
  ),
  "createBypassProbe:recorded": entry(
    {
      phase: "observation",
      state: "bypass_risk_recorded",
      authorityEffect: "evidence_only",
      terminalOutcome: "evidence_only",
    },
    "bypass probe records protected-path posture evidence only",
  ),
  "createToolCallDraft:recorded": entry(
    {
      phase: "drafting",
      state: "draft_recorded",
      authorityEffect: "evidence_only",
      terminalOutcome: "open",
    },
    "tool-call draft records generated parameter state only",
  ),
  "transitionToolCallDraft:recorded": entry(
    {
      phase: "drafting",
      state: "draft_recorded",
      authorityEffect: "evidence_only",
      terminalOutcome: "open",
    },
    "draft transition remains proposal evidence until later candidate validation",
  ),
  "transitionToolCallDraft:refusal": entry(
    {
      phase: "drafting",
      state: "draft_refused",
      authorityEffect: "none",
      terminalOutcome: "refusal",
    },
    "stale, invalid, or abandoned draft cannot compile into authority",
  ),
  "createProtectedPathPosture:recorded": entry(
    {
      phase: "observation",
      state: "protected_path_posture_recorded",
      authorityEffect: "evidence_only",
      terminalOutcome: "evidence_only",
    },
    "protected-path posture is consulted later but does not authorize by itself",
  ),

  "compileIntent:recorded": entry(
    {
      phase: "compilation",
      state: "candidate_compiled",
      authorityEffect: "evidence_only",
      terminalOutcome: "open",
    },
    "compiled candidate is validated proposal evidence only",
  ),
  "compileIntent:refusal": entry(
    {
      phase: "compilation",
      state: "candidate_refused",
      authorityEffect: "none",
      terminalOutcome: "refusal",
    },
    "invalid or overreaching candidate stops before contract",
  ),
  "proposeActionContract:recorded": entry(
    {
      phase: "contract",
      state: "contract_proposed",
      authorityEffect: "proposed_commitment",
      terminalOutcome: "contract",
    },
    "action contract is exact proposed commitment, not execution authority",
  ),
  "proposeActionContract:refusal": entry(
    {
      phase: "contract",
      state: "contract_refused",
      authorityEffect: "none",
      terminalOutcome: "refusal",
    },
    "contract proposal refusal stops before policy authority",
  ),
  "proposeActionContract:conflict": entry(
    {
      phase: "contract",
      state: "contract_conflict",
      authorityEffect: "none",
      terminalOutcome: "proof_gap",
    },
    "contract conflict records proof gap instead of choosing hidden authority",
  ),
  "createAuthorityCertificate:exported": entry(
    {
      phase: "projection",
      state: "authority_certificate_exported",
      authorityEffect: "evidence_only",
      terminalOutcome: "projection",
    },
    "authority certificate signs existing terminal evidence only and cannot create execution authority",
  ),

  "evaluatePolicy:greenlight": entry(
    {
      phase: "policy",
      state: "policy_greenlit",
      authorityEffect: "one_use_authority",
      terminalOutcome: "open",
    },
    "policy greenlight creates one-use authority that still requires gateway admission",
  ),
  "evaluatePolicy:refusal": entry(
    {
      phase: "policy",
      state: "policy_refused",
      authorityEffect: "none",
      terminalOutcome: "refusal",
    },
    "policy refusal is durable terminal evidence",
  ),
  "evaluatePolicy:review_required": entry(
    {
      phase: "policy",
      state: "review_required",
      authorityEffect: "none",
      terminalOutcome: "open",
    },
    "review requirement pauses authority until exact review binding resolves",
  ),
  "evaluatePolicy:proof_gap": entry(
    {
      phase: "policy",
      state: "policy_proof_gap",
      authorityEffect: "none",
      terminalOutcome: "proof_gap",
    },
    "policy evidence gaps record explicit non-authority instead of issuing a greenlight",
  ),
  "evaluatePolicy:conflict": entry(
    {
      phase: "policy",
      state: "policy_conflict",
      authorityEffect: "none",
      terminalOutcome: "proof_gap",
    },
    "policy conflict records uncertainty instead of issuing authority",
  ),
  "createReviewArtifact:recorded": entry(
    {
      phase: "review",
      state: "review_artifact_recorded",
      authorityEffect: "evidence_only",
      terminalOutcome: "open",
    },
    "rendered review artifact is bound evidence only",
  ),
  "createReviewDecision:recorded": entry(
    {
      phase: "review",
      state: "review_decision_recorded",
      authorityEffect: "evidence_only",
      terminalOutcome: "open",
    },
    "review decision records exact human decision evidence only",
  ),
  "createReviewDecision:refusal": entry(
    {
      phase: "review",
      state: "review_decision_refused",
      authorityEffect: "none",
      terminalOutcome: "refusal",
    },
    "stale or mismatched review decision cannot authorize",
  ),

  "gatewayCheck:recorded": entry(
    {
      phase: "gateway",
      state: "gateway_admitted",
      authorityEffect: "gateway_admission",
      terminalOutcome: "receipt",
    },
    "gateway admission is the mutation boundary for one exact attempt",
  ),
  "gatewayCheck:proof_gap": entry(
    {
      phase: "gateway",
      state: "gateway_proof_gap",
      authorityEffect: "none",
      terminalOutcome: "proof_gap",
    },
    "gateway uncertainty records proof gap rather than silently admitting",
  ),
  "gatewayCheck:replay_refusal": entry(
    {
      phase: "gateway",
      state: "gateway_replayed",
      authorityEffect: "none",
      terminalOutcome: "refusal",
    },
    "greenlight replay is refused without mutation",
  ),
  "gatewayCheck:conflict": entry(
    {
      phase: "gateway",
      state: "gateway_conflict",
      authorityEffect: "none",
      terminalOutcome: "proof_gap",
    },
    "gateway commit conflict blocks admission or records uncertainty",
  ),
  "reconcileSurfaceOperation:recorded": entry(
    {
      phase: "downstream",
      state: "operation_reconciled",
      authorityEffect: "downstream_evidence",
      terminalOutcome: "closed",
    },
    "downstream reconciliation observes outcome without authorizing retry mutation",
  ),
  "reconcileSurfaceOperation:proof_gap": entry(
    {
      phase: "downstream",
      state: "downstream_proof_gap",
      authorityEffect: "downstream_evidence",
      terminalOutcome: "proof_gap",
    },
    "unknown downstream outcome remains explicit proof gap",
  ),
  "reconcileSurfaceOperation:recovery": entry(
    {
      phase: "downstream",
      state: "downstream_recovery_available",
      authorityEffect: "downstream_evidence",
      terminalOutcome: "recovery",
    },
    "reconciliation may recommend recovery without inheriting greenlight",
  ),

  "createIsolationState:recorded": entry(
    {
      phase: "isolation",
      state: "isolation_recorded",
      authorityEffect: "future_authority_reduction",
      terminalOutcome: "isolation",
    },
    "isolation state reduces future authority only",
  ),
  "transitionDelegatedAuthorityStatus:recorded": entry(
    {
      phase: "isolation",
      state: "authority_status_recorded",
      authorityEffect: "future_authority_reduction",
      terminalOutcome: "isolation",
    },
    "terminal delegated authority status creates authority-ref isolation for future checks",
  ),
  "createBreakerDecision:recorded": entry(
    {
      phase: "isolation",
      state: "breaker_recorded",
      authorityEffect: "future_authority_reduction",
      terminalOutcome: "isolation",
    },
    "breaker decision records halt/quarantine evidence for future checks",
  ),
  "createReceiptExport:exported": entry(
    {
      phase: "projection",
      state: "receipt_exported",
      authorityEffect: "evidence_only",
      terminalOutcome: "projection",
    },
    "receipt export packages existing evidence only",
  ),
  "createReceiptExport:refusal": entry(
    {
      phase: "projection",
      state: "receipt_export_refused",
      authorityEffect: "none",
      terminalOutcome: "refusal",
    },
    "receipt export refusal cannot create execution proof",
  ),
  "createRecoveryRecommendation:recovery": entry(
    {
      phase: "recovery",
      state: "recovery_recommended",
      authorityEffect: "evidence_only",
      terminalOutcome: "recovery",
    },
    "recovery recommendation derives a future path without inheriting authority",
  ),
  "createRecoveryRecommendation:refusal": entry(
    {
      phase: "recovery",
      state: "recovery_refused",
      authorityEffect: "none",
      terminalOutcome: "refusal",
    },
    "invalid recovery request refuses before any future action",
  ),
  "transitionRecoveryRecommendationStatus:recorded": entry(
    {
      phase: "recovery",
      state: "recovery_status_recorded",
      authorityEffect: "evidence_only",
      terminalOutcome: "closed",
    },
    "recovery status transition is evidence only",
  ),
  "transitionRecoveryRecommendationStatus:conflict": entry(
    {
      phase: "recovery",
      state: "recovery_conflict",
      authorityEffect: "none",
      terminalOutcome: "proof_gap",
    },
    "recovery terminal conflict records proof gap",
  ),
  "resolveRecoveryTerminalConflictProofGap:recovery": entry(
    {
      phase: "recovery",
      state: "proof_gap_resolved",
      authorityEffect: "evidence_only",
      terminalOutcome: "recovery",
    },
    "proof-gap resolution records observed recovery evidence only",
  ),
};

export function actionAttemptLifecycleKey(
  transitionId: ProtocolTransitionId,
  outcomeClass: TransitionOutcomeClass,
): ActionAttemptLifecycleKey {
  return `${transitionId}:${outcomeClass}`;
}

export function actionAttemptLifecycleEntry(
  transitionId: ProtocolTransitionId,
  outcomeClass: TransitionOutcomeClass,
): ActionAttemptLifecycleMatrixEntry {
  const key = actionAttemptLifecycleKey(transitionId, outcomeClass);
  const lifecycleEntry = actionAttemptLifecycleMatrix[key];
  if (!lifecycleEntry) throw new Error(`Missing ActionAttemptLifecycle entry for ${key}.`);
  return { transitionId, outcomeClass, ...lifecycleEntry };
}

export function actionAttemptLifecycleEntries(): ActionAttemptLifecycleMatrixEntry[] {
  return protocolNavigation.flatMap((navigationEntry) =>
    navigationEntry.outcomeClasses.map((outcomeClass) =>
      actionAttemptLifecycleEntry(navigationEntry.transitionId, outcomeClass),
    ),
  );
}

export function actionAttemptHostileTraceEntry(
  traceClass: ActionAttemptHostileTraceClass,
): ActionAttemptHostileTraceEntry {
  const lifecycleEntry = actionAttemptHostileTraceMatrix[traceClass];
  return { traceClass, sourceDocRef: hostileTraceSourceDocRef(traceClass), ...lifecycleEntry };
}

export function actionAttemptHostileTraceEntries(): ActionAttemptHostileTraceEntry[] {
  return actionAttemptHostileTraceClasses.map(actionAttemptHostileTraceEntry);
}

export function actionAttemptLifecycleStatesForTransition(
  transitionId: ProtocolTransitionId,
): ActionAttemptLifecycleState[] {
  const navigationEntry = protocolNavigation.find((entry) => entry.transitionId === transitionId);
  if (!navigationEntry) return [];
  return navigationEntry.outcomeClasses.map(
    (outcomeClass) => actionAttemptLifecycleEntry(transitionId, outcomeClass).state,
  );
}

function entry(
  value: Omit<ActionAttemptLifecycleEntry, "evidenceObligation">,
  evidenceObligation: string,
): ActionAttemptLifecycleEntry {
  return ActionAttemptLifecycleEntrySchema.parse({ ...value, evidenceObligation });
}

function hostileTraceSourceDocRef(
  traceClass: ActionAttemptHostileTraceClass,
): ActionAttemptHostileTraceEntry["sourceDocRef"] {
  if (traceClass === "hidden_lifecycle_side_effect") return "doc08:4.10";
  return "doc08:4.4.1";
}
