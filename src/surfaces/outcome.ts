import { z } from "zod";

export const surfaceOutcomeSchemaVersion = "handshake.surface-outcome.v0.1" as const;

export const surfaceOutcomeKinds = [
  "action_contract_proposed",
  "refused",
  "review_required",
  "proof_gap",
  "install_not_ready",
  "gateway_offline",
  "metadata_stale",
  "tools_list_changed",
  "replay_refused",
  "raw_sibling_bypass_detected",
  "tool_execution_error",
] as const;

export type SurfaceOutcomeKind = (typeof surfaceOutcomeKinds)[number];

export const nonContractSurfaceOutcomeKinds = [
  "refused",
  "review_required",
  "proof_gap",
  "install_not_ready",
  "gateway_offline",
  "metadata_stale",
  "tools_list_changed",
  "replay_refused",
  "raw_sibling_bypass_detected",
  "tool_execution_error",
] as const;

export const surfaceOutcomePhases = [
  "metadata",
  "proposal",
  "evidence",
  "readiness",
  "freshness",
  "replay",
  "bypass",
  "tool_execution",
] as const;

export const surfaceNextActions = [
  "read_evidence",
  "recraft_request",
  "request_review",
  "reload_metadata",
  "fix_install",
  "wait_for_gateway",
  "stop",
] as const;

export const surfaceRetryability = ["not_retryable", "retryable_after_recraft", "retryable_after_reload"] as const;

export const surfaceCommitStates = ["not_started", "protocol_recorded", "ambiguous"] as const;

export const SurfaceOutcomeCommonSchema = z.strictObject({
  schemaVersion: z.literal(surfaceOutcomeSchemaVersion),
  outcome: z.enum(surfaceOutcomeKinds),
  phase: z.enum(surfaceOutcomePhases),
  authorityCreated: z.literal(false),
  authorityCertificateMinted: z.literal(false),
  credentialMaterialIncluded: z.literal(false),
  gatewayCheckPerformed: z.literal(false),
  greenlightCreated: z.literal(false),
  mutationAttempted: z.literal(false),
  mutationCommandIncluded: z.literal(false),
  rawInternalRecordIncluded: z.literal(false),
  receiptExportCreated: z.literal(false),
  greenlightRef: z.null(),
  gatewayCheckRef: z.null(),
  mutationAttemptRef: z.null(),
  reasonCodes: z.array(z.string().min(2)),
  nextAction: z.enum(surfaceNextActions),
  retryability: z.enum(surfaceRetryability),
  commitState: z.enum(surfaceCommitStates),
  metadataRef: z.string().min(1).nullable(),
  evidenceRefs: z.array(z.string().min(1)),
  challengeRef: z.string().min(1).nullable(),
  correlationRef: z.string().min(1).nullable(),
  idempotencyKey: z.string().min(1).nullable(),
});

export const ActionContractProposedOutcomeSchema = SurfaceOutcomeCommonSchema.extend({
  outcome: z.literal("action_contract_proposed"),
  phase: z.literal("proposal"),
  actionContractId: z.string().min(1),
  contractDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  paramsDigest: z
    .string()
    .regex(/^sha256:[a-f0-9]{64}$/)
    .nullable(),
  runtimeExecutionId: z.string().min(1),
  toolCallDraftId: z.string().min(1),
  intentCompilationId: z.string().min(1),
  generatedExecutionGraphId: z.null(),
  generatedExecutionGraphPosture: z.literal("not_exposed_by_role_scoped_runtime_surface"),
});

export const NonContractOutcomeSchema = SurfaceOutcomeCommonSchema.extend({
  outcome: z.enum(nonContractSurfaceOutcomeKinds),
});

export const SurfaceOutcomeSchema = z.discriminatedUnion("outcome", [
  ActionContractProposedOutcomeSchema,
  NonContractOutcomeSchema,
]);

export type SurfaceOutcome = z.infer<typeof SurfaceOutcomeSchema>;

export type SurfaceOutcomeBaseInput = {
  outcome: Exclude<SurfaceOutcomeKind, "action_contract_proposed">;
  phase: z.infer<typeof SurfaceOutcomeCommonSchema>["phase"];
  reasonCodes?: string[];
  nextAction: z.infer<typeof SurfaceOutcomeCommonSchema>["nextAction"];
  retryability?: z.infer<typeof SurfaceOutcomeCommonSchema>["retryability"];
  commitState?: z.infer<typeof SurfaceOutcomeCommonSchema>["commitState"];
  metadataRef?: string | null;
  evidenceRefs?: string[];
  challengeRef?: string | null;
  correlationRef?: string | null;
  idempotencyKey?: string | null;
};

export function surfaceOutcomeBase(input: SurfaceOutcomeBaseInput): SurfaceOutcome {
  return SurfaceOutcomeSchema.parse({
    schemaVersion: surfaceOutcomeSchemaVersion,
    authorityCreated: false,
    authorityCertificateMinted: false,
    credentialMaterialIncluded: false,
    gatewayCheckPerformed: false,
    greenlightCreated: false,
    mutationAttempted: false,
    mutationCommandIncluded: false,
    rawInternalRecordIncluded: false,
    receiptExportCreated: false,
    greenlightRef: null,
    gatewayCheckRef: null,
    mutationAttemptRef: null,
    reasonCodes: input.reasonCodes ?? [],
    retryability: input.retryability ?? "not_retryable",
    commitState: input.commitState ?? "not_started",
    metadataRef: input.metadataRef ?? null,
    evidenceRefs: input.evidenceRefs ?? [],
    challengeRef: input.challengeRef ?? null,
    correlationRef: input.correlationRef ?? null,
    idempotencyKey: input.idempotencyKey ?? null,
    outcome: input.outcome,
    phase: input.phase,
    nextAction: input.nextAction,
  });
}
