export const CLI_SCHEMA_VERSION = "handshake.cli.v1" as const;

export const cliNonClaims = [
  "hosted operation",
  "provider custody",
  "payment settlement finality",
  "aggregate payment-budget management",
  "broad x402 compatibility",
  "broad MCP/CLI/browser/shell/network control",
  "marketplace certification",
  "clearing-house readiness",
  "cross-org AuthorityCertificate trust",
  "service workflow admission or handle authority",
] as const;

export type CliPlane = "operator" | "evidence";
export type CliCustodyRole = "none" | "review_custody";
export type CliNextAction =
  | "read_result"
  | "read_evidence"
  | "run_schema"
  | "run_doctor"
  | "fix_arguments"
  | "fix_input_json"
  | "fix_input_schema"
  | "fix_install"
  | "register_control_plane_install"
  | "provision_credentials"
  | "stop";
export type CliRetryability = "not_retryable" | "retryable_after_fix";
export type CliCommitState = "not_started" | "not_applicable" | "protocol_recorded" | "ambiguous";

export type CliOutputEnvelope<T> = {
  schemaVersion: typeof CLI_SCHEMA_VERSION;
  command: string;
  plane: CliPlane;
  custodyRole: CliCustodyRole;
  ok: boolean;
  authorityCreated: false;
  greenlightCreated: false;
  gatewayCheckPerformed: false;
  mutationAttempted: false;
  rawInternalRecordIncluded: false;
  credentialMaterialIncluded: false;
  mutationCommandIncluded: false;
  receiptExportCreated: false;
  authorityCertificateMinted: false;
  reasonCodes: readonly string[];
  nextAction: CliNextAction;
  retryability: CliRetryability;
  commitState: CliCommitState;
  redactionProfileRef: string | null;
  evidenceRefs: readonly string[];
  proofGapRefs: readonly string[];
  refusalRefs: readonly string[];
  nonClaims: readonly string[];
  warnings: readonly string[];
  result: T;
};

export function cliOutput<T>(input: {
  command: string;
  plane: CliPlane;
  custodyRole?: CliCustodyRole;
  ok?: boolean;
  nonClaims?: readonly string[];
  warnings?: readonly string[];
  reasonCodes?: readonly string[];
  nextAction?: CliNextAction;
  retryability?: CliRetryability;
  commitState?: CliCommitState;
  redactionProfileRef?: string | null;
  evidenceRefs?: readonly string[];
  proofGapRefs?: readonly string[];
  refusalRefs?: readonly string[];
  result: T;
}): CliOutputEnvelope<T> {
  return {
    schemaVersion: CLI_SCHEMA_VERSION,
    command: input.command,
    plane: input.plane,
    custodyRole: input.custodyRole ?? "none",
    ok: input.ok ?? true,
    authorityCreated: false,
    greenlightCreated: false,
    gatewayCheckPerformed: false,
    mutationAttempted: false,
    rawInternalRecordIncluded: false,
    credentialMaterialIncluded: false,
    mutationCommandIncluded: false,
    receiptExportCreated: false,
    authorityCertificateMinted: false,
    reasonCodes: input.reasonCodes ?? [],
    nextAction: input.nextAction ?? "read_result",
    retryability: input.retryability ?? "not_retryable",
    commitState: input.commitState ?? "not_applicable",
    redactionProfileRef: input.redactionProfileRef ?? null,
    evidenceRefs: input.evidenceRefs ?? [],
    proofGapRefs: input.proofGapRefs ?? [],
    refusalRefs: input.refusalRefs ?? [],
    nonClaims: [...cliNonClaims, ...(input.nonClaims ?? [])],
    warnings: input.warnings ?? [],
    result: input.result,
  };
}
