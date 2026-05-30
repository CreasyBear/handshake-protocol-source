import { McpServer, StdioServerTransport } from "@modelcontextprotocol/server";
import {
  mcpProposalTools,
  mcpReadOnlyTools,
  MCP_X402_PAYMENT_PROPOSE_TOOL,
  MCP_DELEGATION_VERIFY_TOOL,
} from "../catalog";
import { McpStructuredContentSchema } from "../output";
import {
  MCP_REFERENCE_METADATA_URI,
  MCP_REFERENCE_GATEWAY_READINESS_DIGEST,
  MCP_REFERENCE_GATEWAY_READINESS_REF,
  MCP_REFERENCE_POLICY_VERSION_DIGEST,
  MCP_REFERENCE_POLICY_VERSION_REF,
  MCP_REFERENCE_RECEIPT_TIMELINE_URI,
  MCP_REFERENCE_TRUSTED_MAX_ATOMIC_AMOUNT,
  referenceEvidenceClient,
  referenceRuntimeClient,
} from "../reference-transcript-fixtures";
import { readMcpResource, type McpEvidenceResourceClient } from "../resources";
import { McpX402PaymentProposalInputSchema, proposeMcpX402Payment } from "../x402-proposal";
import { McpDelegationVerifyInputSchema, verifyMcpDelegationEvidence } from "../tools/delegation-verify.js";
import type { McpGatewayPosture, McpInstallPosture, McpRuntimeProposalClient } from "../x402-proposal";

export const MCP_STDIO_SERVER_VERSION = "handshake.mcp.stdio-server.v0.1" as const;

export const mcpStdioStaticResourceUris = [
  MCP_REFERENCE_METADATA_URI,
  "handshake://evidence/contracts/act_mcp_reference_x402",
  "handshake://evidence/envelopes/act_mcp_reference_x402",
  MCP_REFERENCE_RECEIPT_TIMELINE_URI,
  "handshake://health/install/pre-contract/req_mcp_x402_1",
] as const;

export type HandshakeMcpStdioServerOptions = {
  readonly runtimeClient?: McpRuntimeProposalClient;
  readonly evidenceClient?: McpEvidenceResourceClient;
  readonly currentMetadataDigest?: `sha256:${string}`;
  readonly toolsListChanged?: boolean;
  readonly installPosture?: McpInstallPosture;
  readonly gatewayPosture?: McpGatewayPosture;
  readonly trustedMaxAtomicAmountPerCall?: string;
  readonly gatewayReadinessRef?: string;
  readonly gatewayReadinessDigest?: `sha256:${string}` | string;
  readonly policyVersionRef?: string;
  readonly policyVersionDigest?: `sha256:${string}` | string;
};

export function createHandshakeMcpStdioServer(options: HandshakeMcpStdioServerOptions = {}): McpServer {
  const server = new McpServer({
    name: "handshake-self-hosted-local-mcp",
    version: MCP_STDIO_SERVER_VERSION,
  });
  const runtimeClient = options.runtimeClient ?? referenceRuntimeClient().client;
  const evidenceClient = options.evidenceClient ?? referenceEvidenceClient();

  for (const uri of mcpStdioStaticResourceUris) {
    server.registerResource(
      resourceName(uri),
      uri,
      {
        title: resourceTitle(uri),
        mimeType: "application/json",
      },
      async (requestedUri) => {
        const read = await readMcpResource(requestedUri.href, evidenceClient);
        return {
          contents: [
            {
              uri: read.uri,
              mimeType: "application/json",
              text: JSON.stringify(read),
            },
          ],
        };
      },
    );
  }

  registerMcpX402ProposalTool(server, {
    runtimeClient,
    options,
  });
  registerMcpDelegationVerifyTool(server);

  return server;
}

function registerMcpX402ProposalTool(
  server: McpServer,
  ctx: {
    runtimeClient: McpRuntimeProposalClient;
    options: HandshakeMcpStdioServerOptions;
  },
): void {
  const { runtimeClient, options } = ctx;
  const tool = mcpProposalTools.find((entry) => entry.name === MCP_X402_PAYMENT_PROPOSE_TOOL);
  if (!tool) throw new Error("Handshake MCP x402 proposal tool is missing from the source catalog.");

  server.registerTool(
    MCP_X402_PAYMENT_PROPOSE_TOOL,
    {
      title: "Propose exact x402 payment",
      description: tool.description,
      inputSchema: McpX402PaymentProposalInputSchema,
      outputSchema: McpStructuredContentSchema,
      annotations: tool.annotations,
    },
    async (input) => {
      const result = await proposeMcpX402Payment(input, {
        runtimeClient,
        ...(options.currentMetadataDigest ? { currentMetadataDigest: options.currentMetadataDigest } : {}),
        ...(options.toolsListChanged !== undefined ? { toolsListChanged: options.toolsListChanged } : {}),
        ...(options.installPosture ? { installPosture: options.installPosture } : {}),
        ...(options.gatewayPosture ? { gatewayPosture: options.gatewayPosture } : {}),
        trustedMaxAtomicAmountPerCall: options.trustedMaxAtomicAmountPerCall ?? MCP_REFERENCE_TRUSTED_MAX_ATOMIC_AMOUNT,
        gatewayReadinessRef: options.gatewayReadinessRef ?? MCP_REFERENCE_GATEWAY_READINESS_REF,
        gatewayReadinessDigest: options.gatewayReadinessDigest ?? MCP_REFERENCE_GATEWAY_READINESS_DIGEST,
        policyVersionRef: options.policyVersionRef ?? MCP_REFERENCE_POLICY_VERSION_REF,
        policyVersionDigest: options.policyVersionDigest ?? MCP_REFERENCE_POLICY_VERSION_DIGEST,
      });
      return {
        content: result.content,
        structuredContent: result.structuredContent,
        isError: result.isError,
      };
    },
  );
}

function registerMcpDelegationVerifyTool(server: McpServer): void {
  const tool = mcpReadOnlyTools.find((entry) => entry.name === MCP_DELEGATION_VERIFY_TOOL);
  if (!tool) throw new Error("Handshake MCP delegation verify tool is missing from the source catalog.");

  server.registerTool(
    MCP_DELEGATION_VERIFY_TOOL,
    {
      title: "Verify A1 delegation evidence",
      description: tool.description,
      inputSchema: McpDelegationVerifyInputSchema,
      outputSchema: McpStructuredContentSchema,
      annotations: tool.annotations,
    },
    async (input) => {
      const result = verifyMcpDelegationEvidence(input);
      return {
        content: result.content,
        structuredContent: result.structuredContent,
        isError: result.isError,
      };
    },
  );
}

export async function startHandshakeMcpStdioServer(options: HandshakeMcpStdioServerOptions = {}): Promise<McpServer> {
  const server = createHandshakeMcpStdioServer(options);
  await server.connect(new StdioServerTransport());
  return server;
}

function resourceName(uri: string): string {
  return uri.replace(/^handshake:\/\//u, "").replace(/[^a-zA-Z0-9_.-]+/gu, ".");
}

function resourceTitle(uri: string): string {
  if (uri === MCP_REFERENCE_METADATA_URI) return "Handshake x402 action metadata";
  if (uri === MCP_REFERENCE_RECEIPT_TIMELINE_URI) return "Handshake x402 proof-gap timeline";
  if (uri.includes("/contracts/")) return "Handshake x402 contract evidence";
  if (uri.includes("/envelopes/")) return "Handshake x402 transaction envelope";
  return "Handshake x402 install health";
}
