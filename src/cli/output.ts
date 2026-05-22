export const CLI_SCHEMA_VERSION = "handshake.cli.v1" as const;

export const cliNonClaims = [
  "hosted operation",
  "provider custody",
  "payment settlement finality",
  "aggregate spend-window enforcement",
  "broad x402 compatibility",
  "broad MCP/CLI/browser/shell/network control",
  "marketplace certification",
  "clearing-house readiness",
  "cross-org AuthorityCertificate trust",
] as const;

export type CliPlane = "operator" | "evidence";
export type CliCustodyRole = "none" | "review_custody";

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
    nonClaims: [...cliNonClaims, ...(input.nonClaims ?? [])],
    warnings: input.warnings ?? [],
    result: input.result,
  };
}
