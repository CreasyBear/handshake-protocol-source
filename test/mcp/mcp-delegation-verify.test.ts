import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MCP_DELEGATION_VERIFY_TOOL, mcpCatalogSnapshot } from "../../src/mcp/catalog";
import { verifyMcpDelegationEvidence } from "../../src/mcp/tools/delegation-verify.js";
import { parseSignedChain } from "../../src/integrations/a1-evidence/wire-types.js";

const fixturesDir = join(process.cwd(), "test/fixtures/a1-evidence");

function loadFixture(name: string) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8")) as {
    signedChain: unknown;
    executorPk: string;
    intentHash: string;
    merkleProof: { siblings: { hash: string; isLeft: boolean }[] };
    nowUnix: number;
    driftToleranceSecs: number;
  };
}

describe("MCP delegation verify tool", () => {
  it("registers read-only verify tool with forbidden-copy-safe naming", () => {
    const catalog = mcpCatalogSnapshot();
    expect(catalog.tools.map((tool) => tool.name)).toContain(MCP_DELEGATION_VERIFY_TOOL);
    expect(MCP_DELEGATION_VERIFY_TOOL).not.toMatch(/a1_authorize|authorize_delegation|mint_greenlight/i);
    const verifyTool = catalog.tools.find((tool) => tool.name === MCP_DELEGATION_VERIFY_TOOL);
    expect(verifyTool?.annotations.readOnlyHint).toBe(true);
    expect(verifyTool?.description.toLowerCase()).toContain("does not authorize");
  });

  it("returns non-authoritative evidence outcome for a valid vector chain", () => {
    const fixture = loadFixture("valid-2hop.json");
    const result = verifyMcpDelegationEvidence({
      signedChain: parseSignedChain(fixture.signedChain),
      executorPk: fixture.executorPk,
      intentHash: fixture.intentHash,
      merkleProof: fixture.merkleProof,
      nowUnix: fixture.nowUnix,
      driftToleranceSecs: fixture.driftToleranceSecs,
    });

    expect(result.isError).toBe(false);
    expect(result.structuredContent.authorityCreated).toBe(false);
    expect(result.structuredContent.greenlightCreated).toBe(false);
    expect(result.structuredContent.gatewayCheckPerformed).toBe(false);
    expect(result.structuredContent.mutationAttempted).toBe(false);
    expect(result.structuredContent.reasonCodes).toContain("delegation_evidence_verified_non_authoritative");
    expect(result.structuredContent.evidenceRefs.some((ref) => ref.startsWith("evidence:a1-chain-fingerprint:"))).toBe(
      true,
    );
  });

  it("returns refusal outcome for an invalid vector chain without creating authority", () => {
    const fixture = loadFixture("invalid-bad-sig.json");
    const result = verifyMcpDelegationEvidence({
      signedChain: parseSignedChain(fixture.signedChain),
      executorPk: fixture.executorPk,
      intentHash: fixture.intentHash,
      merkleProof: fixture.merkleProof,
      nowUnix: fixture.nowUnix,
      driftToleranceSecs: fixture.driftToleranceSecs,
    });

    expect(result.isError).toBe(false);
    expect(result.structuredContent.outcome).toBe("refused");
    expect(result.structuredContent.authorityCreated).toBe(false);
    expect(result.structuredContent.greenlightCreated).toBe(false);
    expect(result.structuredContent.reasonCodes.length).toBeGreaterThan(0);
  });

  it("rejects malformed wire with tool_execution_error", () => {
    const result = verifyMcpDelegationEvidence({
      signedChain: { version: 99 },
      executorPk: "00".repeat(32),
      intentHash: "11".repeat(32),
      merkleProof: { siblings: [] },
    });

    expect(result.isError).toBe(true);
    expect(result.structuredContent.outcome).toBe("tool_execution_error");
    expect(result.structuredContent.authorityCreated).toBe(false);
  });
});
