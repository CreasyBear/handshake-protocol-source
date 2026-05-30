import { describe, expect, it } from "bun:test";
import { fileURLToPath } from "node:url";
import { MCP_DELEGATION_VERIFY_TOOL, MCP_X402_PAYMENT_PROPOSE_TOOL } from "../../src/mcp/catalog";

import {
  McpProcessTimeoutError,
  runMcpStdioProcessProof,
  withMcpProcessTimeout,
} from "../../src/mcp/stdio/process-proof";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

describe("MCP stdio process proof", () => {
  it("exercises the local MCP server through the official stdio client transport without creating authority", async () => {
    const proof = await runMcpStdioProcessProof({ cwd: repoRoot, timeoutMs: 8_000 });

    expect(proof).toMatchObject({
      schemaVersion: "handshake.mcp.stdio-process-proof.v0.1",
      transport: "stdio",
      serverEntrypoint: "src/mcp/stdio/entry.ts",
      sdkPosture: {
        clientPackage: "@modelcontextprotocol/client",
        serverPackage: "@modelcontextprotocol/server",
        releasePosture: "alpha_v2_sdk",
      },
    });
    expect(proof.stderr).toBe("");
    expect(proof.toolNames).toEqual([MCP_X402_PAYMENT_PROPOSE_TOOL, MCP_DELEGATION_VERIFY_TOOL]);
    expect(proof.metadataRead).toMatchObject({
      uri: "handshake://metadata/actions/x402_payment.exact",
      readOnly: true,
      authorityCreated: false,
      gatewayCheckPerformed: false,
      greenlightCreated: false,
      mutationAttempted: false,
      credentialMaterialIncluded: false,
    });
    expect(proof.toolResult.structuredContent).toMatchObject({
      outcome: "action_contract_proposed",
      actionContractId: "act_mcp_reference_x402",
      authorityCreated: false,
      gatewayCheckPerformed: false,
      greenlightRef: null,
      mutationAttemptRef: null,
    });
    expect(proof.contractRead).toMatchObject({
      uri: "handshake://evidence/contracts/act_mcp_reference_x402",
      readOnly: true,
      authorityCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
      credentialMaterialIncluded: false,
    });
    expect(proof.rows.every((row) => row.authorityCreated === false)).toBe(true);
    expect(proof.rows.every((row) => row.gatewayCheckPerformed === false)).toBe(true);
    expect(proof.rows.every((row) => row.mutationAttempted === false)).toBe(true);
    expect(JSON.stringify(proof)).not.toContain("PAYMENT-SIGNATURE");
    expect(JSON.stringify(proof)).not.toContain("PaymentPayload");
    expect(JSON.stringify(proof)).not.toContain("privateKey");
    expect(JSON.stringify(proof)).not.toContain(`0x${"a".repeat(130)}`);
  });

  it("turns hung process operations into typed timeout failures", async () => {
    await expect(withMcpProcessTimeout(new Promise(() => undefined), 1, "timeout-test")).rejects.toBeInstanceOf(
      McpProcessTimeoutError,
    );
  });
});
