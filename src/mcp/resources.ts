import { z } from "zod";
import { digestMcp, type McpJsonValue } from "./digest";
import { MCP_SCHEMA_VERSION } from "./output";
import { mcpServiceWorkflowBoundary } from "./catalog";

export const McpResourceReadSchema = z.strictObject({
  schemaVersion: z.literal(MCP_SCHEMA_VERSION),
  uri: z.string().min(1),
  readOnly: z.literal(true),
  authorityCreated: z.literal(false),
  authorityCertificateMinted: z.literal(false),
  credentialMaterialIncluded: z.literal(false),
  gatewayCheckPerformed: z.literal(false),
  greenlightCreated: z.literal(false),
  mutationAttempted: z.literal(false),
  mutationCommandIncluded: z.literal(false),
  rawInternalRecordIncluded: z.literal(false),
  receiptExportCreated: z.literal(false),
  payload: z.unknown(),
});

export type McpResourceRead = z.infer<typeof McpResourceReadSchema>;

export type McpEvidenceResourceClient = {
  getContractEvidenceProjection(actionContractId: string): Promise<unknown>;
  getAgentTransactionEnvelopeProjection(actionContractId: string): Promise<unknown>;
  getOperationReadbackProjection(actionContractId: string): Promise<unknown>;
  getReceiptTimelineProjection(receiptId: string): Promise<unknown>;
  getIdempotencyRecoveryProjection(actionContractId: string): Promise<unknown>;
  getProtectedPathInstallHealthProjection(actionContractId: string): Promise<unknown>;
};

export async function readMcpResource(
  uri: string,
  evidenceClient: McpEvidenceResourceClient,
): Promise<McpResourceRead> {
  const parsed = parseMcpResourceUri(uri);
  const payload = await readPayload(parsed, evidenceClient);
  return McpResourceReadSchema.parse({
    schemaVersion: MCP_SCHEMA_VERSION,
    uri,
    readOnly: true,
    authorityCreated: false,
    authorityCertificateMinted: false,
    credentialMaterialIncluded: false,
    gatewayCheckPerformed: false,
    greenlightCreated: false,
    mutationAttempted: false,
    mutationCommandIncluded: false,
    rawInternalRecordIncluded: false,
    receiptExportCreated: false,
    payload,
  });
}

type ParsedMcpResourceUri =
  | { kind: "metadata"; actionClass: string }
  | { kind: "challenge"; challengeId: string }
  | { kind: "contract"; actionContractId: string }
  | { kind: "operationReadback"; actionContractId: string }
  | { kind: "envelope"; actionContractId: string }
  | { kind: "receiptTimeline"; receiptId: string }
  | { kind: "idempotency"; actionContractId: string }
  | { kind: "installHealth"; actionContractId: string }
  | { kind: "installHealthPreContract"; requestId: string }
  | { kind: "certificateRef"; authorityCertificateId: string };

export function parseMcpResourceUri(uri: string): ParsedMcpResourceUri {
  const parsed = new URL(uri);
  if (parsed.protocol !== "handshake:") throw new Error("Unsupported MCP resource protocol.");
  const segments = parsed.pathname.split("/").filter(Boolean).map(decodeURIComponent);

  if (parsed.hostname === "metadata" && segments[0] === "actions" && segments[1]) {
    return { kind: "metadata", actionClass: segments[1] };
  }
  if (parsed.hostname === "challenges" && segments[0]) return { kind: "challenge", challengeId: segments[0] };
  if (parsed.hostname === "evidence" && segments[0] === "contracts" && segments[1]) {
    return { kind: "contract", actionContractId: segments[1] };
  }
  if (
    parsed.hostname === "evidence" &&
    segments[0] === "operations" &&
    segments[1] &&
    segments[2] === "readback"
  ) {
    return { kind: "operationReadback", actionContractId: segments[1] };
  }
  if (parsed.hostname === "evidence" && segments[0] === "envelopes" && segments[1]) {
    return { kind: "envelope", actionContractId: segments[1] };
  }
  if (parsed.hostname === "evidence" && segments[0] === "receipts" && segments[1] && segments[2] === "timeline") {
    return { kind: "receiptTimeline", receiptId: segments[1] };
  }
  if (parsed.hostname === "evidence" && segments[0] === "idempotency" && segments[1]) {
    return { kind: "idempotency", actionContractId: segments[1] };
  }
  if (parsed.hostname === "health" && segments[0] === "install" && segments[1]) {
    if (segments[1] === "pre-contract" && segments[2]) {
      return { kind: "installHealthPreContract", requestId: segments[2] };
    }
    return { kind: "installHealth", actionContractId: segments[1] };
  }
  if (parsed.hostname === "certificates" && segments[0]) {
    return { kind: "certificateRef", authorityCertificateId: segments[0] };
  }
  throw new Error("Unsupported MCP resource URI.");
}

async function readPayload(parsed: ParsedMcpResourceUri, evidenceClient: McpEvidenceResourceClient): Promise<unknown> {
  switch (parsed.kind) {
    case "metadata":
      return withMetadataDigest({
        resourceVersion: "mcp-metadata.v1",
        actionClass: parsed.actionClass,
        proposalTool: "handshake.actions.x402_payment.propose",
        serviceWorkflowBoundary: mcpServiceWorkflowBoundary,
        authorityCreated: false,
        gatewayCheckPerformed: false,
        mutationAttempted: false,
      });
    case "challenge":
      return {
        challengeId: parsed.challengeId,
        authorityCreated: false,
        nextAction: "recraft_request",
      };
    case "contract":
      return evidenceClient.getContractEvidenceProjection(parsed.actionContractId);
    case "operationReadback":
      return evidenceClient.getOperationReadbackProjection(parsed.actionContractId);
    case "envelope":
      return evidenceClient.getAgentTransactionEnvelopeProjection(parsed.actionContractId);
    case "receiptTimeline":
      return evidenceClient.getReceiptTimelineProjection(parsed.receiptId);
    case "idempotency":
      return evidenceClient.getIdempotencyRecoveryProjection(parsed.actionContractId);
    case "installHealth":
      return evidenceClient.getProtectedPathInstallHealthProjection(parsed.actionContractId);
    case "installHealthPreContract":
      return withMetadataDigest({
        resourceVersion: "mcp-install-health.pre-contract.v1",
        requestId: parsed.requestId,
        healthScope: "pre_contract",
        authorityCreated: false,
        greenlightCreated: false,
        gatewayCheckPerformed: false,
        mutationAttempted: false,
      });
    case "certificateRef":
      return {
        authorityCertificateId: parsed.authorityCertificateId,
        authorityCreated: false,
        verificationPosture: "cli_first_reference_only",
      };
  }
}

async function withMetadataDigest(metadata: Record<string, McpJsonValue>): Promise<Record<string, McpJsonValue>> {
  return {
    ...metadata,
    metadataDigest: await digestMcp(metadata),
  };
}
