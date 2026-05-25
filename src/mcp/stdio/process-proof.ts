import { Client, StdioClientTransport } from "@modelcontextprotocol/client";
import { MCP_X402_PAYMENT_PROPOSE_TOOL } from "../catalog";
import { McpToolResultSchema, type McpToolResult } from "../output";
import {
  actionContractIdFrom,
  MCP_REFERENCE_METADATA_URI,
  metadataDigestFrom,
  referenceProposalInput,
} from "../reference-transcript-fixtures";
import { McpResourceReadSchema, type McpResourceRead } from "../resources";

export const MCP_STDIO_PROCESS_PROOF_VERSION = "handshake.mcp.stdio-process-proof.v0.1" as const;

export type McpStdioProcessProofRow = {
  readonly id: "connect" | "tools_list" | "metadata_read" | "valid_proposal" | "contract_read";
  readonly outcome: string;
  readonly source:
    | "official_mcp_client_sdk"
    | "official_mcp_server_sdk"
    | "handshake_mcp_resource"
    | "handshake_mcp_tool";
  readonly authorityCreated: false;
  readonly greenlightCreated: false;
  readonly gatewayCheckPerformed: false;
  readonly mutationAttempted: false;
  readonly rawInternalRecordIncluded: false;
  readonly credentialMaterialIncluded: false;
};

export type McpStdioProcessProof = {
  readonly schemaVersion: typeof MCP_STDIO_PROCESS_PROOF_VERSION;
  readonly transport: "stdio";
  readonly serverEntrypoint: string;
  readonly serverCommand: string;
  readonly serverArgs: readonly string[];
  readonly processTimeoutMs: number;
  readonly sdkPosture: {
    readonly clientPackage: "@modelcontextprotocol/client";
    readonly serverPackage: "@modelcontextprotocol/server";
    readonly releasePosture: "alpha_v2_sdk";
  };
  readonly toolNames: readonly string[];
  readonly metadataRead: McpResourceRead;
  readonly toolResult: McpToolResult;
  readonly contractRead: McpResourceRead;
  readonly rows: readonly McpStdioProcessProofRow[];
  readonly stderr: string;
  readonly nonClaims: readonly string[];
};

export type RunMcpStdioProcessProofOptions = {
  readonly cwd?: string;
  readonly command?: string;
  readonly args?: readonly string[];
  readonly timeoutMs?: number;
};

export class McpProcessTimeoutError extends Error {
  readonly code = "mcp_process_timeout" as const;

  constructor(
    readonly phase: string,
    readonly timeoutMs: number,
  ) {
    super(`MCP stdio process timed out during ${phase} after ${timeoutMs}ms.`);
    this.name = "McpProcessTimeoutError";
  }
}

export async function runMcpStdioProcessProof(
  options: RunMcpStdioProcessProofOptions = {},
): Promise<McpStdioProcessProof> {
  const timeoutMs = options.timeoutMs ?? 8_000;
  const serverCommand = options.command ?? process.execPath;
  const serverArgs = [...(options.args ?? ["run", "./src/mcp/stdio/entry.ts"])];
  const client = new Client({ name: "handshake-self-hosted-local-proof", version: "0.1.0" });
  const transport = new StdioClientTransport({
    command: serverCommand,
    args: serverArgs,
    cwd: options.cwd ?? process.cwd(),
    stderr: "pipe",
  });
  const stderr = collectText(transport.stderr);

  try {
    await withMcpProcessTimeout(client.connect(transport), timeoutMs, "connect");
    const tools = await withMcpProcessTimeout(client.listTools(), timeoutMs, "tools/list");
    const toolNames = tools.tools.map((tool) => tool.name).sort();
    const metadataResult = await withMcpProcessTimeout(
      client.readResource({ uri: MCP_REFERENCE_METADATA_URI }),
      timeoutMs,
      "resources/read metadata",
    );
    const metadataRead = parseResourceRead(metadataResult);
    const proposalInput = await referenceProposalInput(metadataDigestFrom(metadataRead));
    const toolResult = parseToolResult(
      await withMcpProcessTimeout(
        client.callTool({ name: MCP_X402_PAYMENT_PROPOSE_TOOL, arguments: proposalInput }),
        timeoutMs,
        "tools/call x402 proposal",
      ),
    );
    const actionContractId = actionContractIdFrom(toolResult);
    const contractRead = parseResourceRead(
      await withMcpProcessTimeout(
        client.readResource({ uri: `handshake://evidence/contracts/${encodeURIComponent(actionContractId)}` }),
        timeoutMs,
        "resources/read contract evidence",
      ),
    );

    return {
      schemaVersion: MCP_STDIO_PROCESS_PROOF_VERSION,
      transport: "stdio",
      serverEntrypoint: options.args?.[0] ?? "src/mcp/stdio/entry.ts",
      serverCommand,
      serverArgs,
      processTimeoutMs: timeoutMs,
      sdkPosture: {
        clientPackage: "@modelcontextprotocol/client",
        serverPackage: "@modelcontextprotocol/server",
        releasePosture: "alpha_v2_sdk",
      },
      toolNames,
      metadataRead,
      toolResult,
      contractRead,
      rows: [
        row("connect", "connected", "official_mcp_client_sdk"),
        row("tools_list", toolNames.join(","), "official_mcp_client_sdk"),
        row("metadata_read", metadataRead.uri, "handshake_mcp_resource"),
        row("valid_proposal", toolResult.structuredContent.outcome, "handshake_mcp_tool"),
        row("contract_read", contractRead.uri, "handshake_mcp_resource"),
      ],
      stderr: redactProcessText(stderr()),
      nonClaims: [
        "no_policy_decision",
        "no_greenlight",
        "no_gateway_check",
        "no_mutation",
        "no_provider_custody",
        "no_hosted_operation",
        "no_cross_org_trust",
        "no_broad_mcp_protection",
      ],
    };
  } finally {
    await client.close().catch(() => undefined);
    await transport.close().catch(() => undefined);
  }
}

export function withMcpProcessTimeout<T>(operation: Promise<T>, timeoutMs: number, phase: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new McpProcessTimeoutError(phase, timeoutMs)), timeoutMs);
  });
  return Promise.race([operation, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

function parseResourceRead(result: { contents: readonly ({ text?: string } | { blob?: string })[] }): McpResourceRead {
  const first = result.contents[0];
  if (!first || !("text" in first) || typeof first.text !== "string") {
    throw new Error("MCP resource read did not return JSON text.");
  }
  return McpResourceReadSchema.parse(JSON.parse(first.text));
}

function parseToolResult(result: {
  content: unknown;
  structuredContent?: Record<string, unknown> | undefined;
  isError?: boolean | undefined;
}): McpToolResult {
  return McpToolResultSchema.parse({
    content: result.content,
    structuredContent: result.structuredContent,
    isError: result.isError ?? false,
  });
}

function row(
  id: McpStdioProcessProofRow["id"],
  outcome: string,
  source: McpStdioProcessProofRow["source"],
): McpStdioProcessProofRow {
  return {
    id,
    outcome,
    source,
    authorityCreated: false,
    greenlightCreated: false,
    gatewayCheckPerformed: false,
    mutationAttempted: false,
    rawInternalRecordIncluded: false,
    credentialMaterialIncluded: false,
  };
}

function collectText(
  stream: { on?: (event: "data", listener: (chunk: unknown) => void) => unknown } | null,
): () => string {
  const chunks: string[] = [];
  stream?.on?.("data", (chunk) => chunks.push(String(chunk)));
  return () => chunks.join("");
}

function redactProcessText(value: string): string {
  const paymentHeaderName = "PAYMENT" + "-SIGNATURE";
  const paymentPayloadType = "Payment" + "Payload";
  return value
    .replaceAll(paymentHeaderName, "[redacted-payment-header-name]")
    .replaceAll(paymentPayloadType, "[redacted-payment-payload-type]")
    .replace(/0x[a-fA-F0-9]{64,}/gu, "[redacted-hex-material]");
}
