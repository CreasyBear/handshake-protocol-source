import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { mcpCatalogSnapshot } from "../../src/mcp/catalog";

const repoRoot = process.cwd();

function walkFiles(root: string, filter: (path: string) => boolean): string[] {
  const absolute = join(repoRoot, root);
  if (!existsSync(absolute)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(absolute)) {
    const full = join(absolute, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walkFiles(relative(repoRoot, full), filter));
      continue;
    }
    const rel = relative(repoRoot, full);
    if (filter(rel)) files.push(rel);
  }
  return files.sort();
}

function walkTs(root: string): string[] {
  return walkFiles(root, (rel) => rel.endsWith(".ts") || rel.endsWith(".tsx"));
}

function walkMd(root: string): string[] {
  return walkFiles(root, (rel) => rel.endsWith(".md"));
}

function readSources(paths: string[]): { rel: string; text: string }[] {
  return paths.map((rel) => ({ rel, text: readFileSync(join(repoRoot, rel), "utf8") }));
}

function findIdentifierViolations(paths: string[], identifiers: string[]): string[] {
  const violations: string[] = [];
  for (const { rel, text } of readSources(paths)) {
    for (const id of identifiers) {
      if (text.includes(id)) violations.push(`${rel}: ${id}`);
    }
  }
  return violations;
}

function findRegexViolations(paths: string[], patterns: RegExp[]): string[] {
  const violations: string[] = [];
  for (const { rel, text } of readSources(paths)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) violations.push(`${rel}: ${pattern}`);
    }
  }
  return violations;
}

const productionSrcRoots = ["src", "src/mcp", "src/cli"] as const;
const productionTsFiles = productionSrcRoots.flatMap((root) => walkTs(root));

describe("A1 integration KILL enforcement", () => {
  it("KILL-01 forbids VerifiedToken as clearance substitute", () => {
    expect(findIdentifierViolations(productionTsFiles, ["VerifiedToken"])).toEqual([]);
    expect(findIdentifierViolations(["server.json"], ["VerifiedToken"])).toEqual([]);

    const synthetic = "const token: VerifiedToken = issueClearance();";
    expect(synthetic.includes("VerifiedToken")).toBe(true);
  });

  it("KILL-02 forbids A1 authorize HTTP as Handshake clearance", () => {
    const srcViolations = findRegexViolations(productionTsFiles, [
      /\/v1\/authorize/,
      /A1Client\.authorize/,
    ]);
    expect(srcViolations).toEqual([]);

    const docAllowlist = new Set([
      "docs/internal/decisions.md",
      "docs/internal/a1-handshake-composability.md",
    ]);
    const docPaths = walkMd("docs/internal").filter((rel) => !docAllowlist.has(rel));
    const docViolations = findRegexViolations(docPaths, [/\/v1\/authorize/, /A1Client\.authorize/]);
    expect(docViolations).toEqual([]);

    const decisions = readFileSync(join(repoRoot, "docs/internal/decisions.md"), "utf8");
    expect(decisions).toMatch(/rejected alternative/i);
    expect(decisions).toMatch(/\/v1\/authorize/);

    expect("fetch('https://a1.example/v1/authorize')".match(/\/v1\/authorize/)).not.toBeNull();
  });

  it("KILL-03 forbids passport digest as authority input", () => {
    const protocolFiles = walkTs("src/protocol");
    const admissionFiles = walkTs("src/http/admission");
    const forbidden = ["passportDigest", "passportPackageDigest"];
    expect(findIdentifierViolations(protocolFiles, forbidden)).toEqual([]);
    expect(findIdentifierViolations(admissionFiles, forbidden)).toEqual([]);
  });

  it("KILL-04 forbids advisory-only A1 middleware claims in src", () => {
    expect(
      findIdentifierViolations(productionTsFiles, ["a1-middleware", "advisoryOnlyEnforcement"]),
    ).toEqual([]);
  });

  it("KILL-05 forbids Studio check as operator clearance", () => {
    const surfaceFiles = walkTs("src/surfaces");
    const forbidden = ["studio/check", "StudioCheck", "studioCheck"];
    expect(findIdentifierViolations(productionTsFiles, forbidden)).toEqual([]);
    expect(findIdentifierViolations(surfaceFiles, forbidden)).toEqual([]);
  });

  it("KILL-06 forbids MCP authorize/mint/renew tool names", () => {
    const forbiddenToolPattern = /a1_authorize|authorize_delegation|mint_greenlight|renew_.*token/i;
    const catalogText = readFileSync(join(repoRoot, "src/mcp/catalog.ts"), "utf8");
    const serverText = readFileSync(join(repoRoot, "server.json"), "utf8");
    const toolNames = [
      ...catalogText.matchAll(/name:\s*["']([^"']+)["']/g),
      ...serverText.matchAll(/"name"\s*:\s*"([^"]+)"/g),
    ].map((match) => match[1] ?? "");

    const violations = toolNames.filter((name) => forbiddenToolPattern.test(name));
    expect(violations).toEqual([]);

    expect(forbiddenToolPattern.test("a1_authorize_delegation")).toBe(true);
  });

  it("KILL-07 forbids ZK/guest wedge labels without proof-gap framing", () => {
    const canonicalDocs = [
      "README.md",
      "AGENTS.md",
      "QUALITY.md",
      "STRUCTURE.md",
      "docs/internal/protocol-notes.md",
      "docs/internal/a1-handshake-composability.md",
    ];
    const zkViolations: string[] = [];
    for (const rel of canonicalDocs) {
      const text = readFileSync(join(repoRoot, rel), "utf8");
      if (/\bZK\b/.test(text) && !/proof gap|proof-gap|evidence theatre|not a proof system/i.test(text)) {
        zkViolations.push(`${rel}: ZK without proof-gap framing`);
      }
    }
    expect(zkViolations).toEqual([]);

    const srcZk = productionTsFiles.filter((rel) => {
      const text = readFileSync(join(repoRoot, rel), "utf8");
      return /\bZK\b/.test(text);
    });
    expect(srcZk).toEqual([]);

    expect("Ship ZK guest payments now".match(/\bZK\b/)).not.toBeNull();
  });

  it("KILL-08 forbids merged terminal receipt without layer separation", () => {
    const receiptRoot = "src/protocol/areas/receipt-export";
    const receiptFiles = walkTs(receiptRoot);
    const mergedPatterns = [
      /unifiedTerminalStatus/i,
      /mergedClearanceStatus/i,
      /delegationAndGatewayStatus/i,
      /a1AuthorizeStatus.*gatewayCheckStatus/i,
    ];
    expect(findRegexViolations(receiptFiles, mergedPatterns)).toEqual([]);

    const receiptSchemas = readFileSync(
      join(repoRoot, "src/protocol/areas/receipt-export/schemas.ts"),
      "utf8",
    );
    expect(receiptSchemas).toMatch(/gatewayCheckStatus/);
    expect(receiptSchemas).toMatch(/downstreamOutcomeStatus/);
    expect(receiptSchemas).not.toMatch(/unifiedTerminalStatus/);
  });

  it("KILL-09 forbids mapping A1 cert nonce to greenlight consumption", () => {
    const protocolFiles = walkTs("src/protocol");
    expect(findIdentifierViolations(protocolFiles, ["a1Nonce", "certNonce"])).toEqual([]);
  });

  it("KILL-10 forbids A1 milestone copy widening action catalog", () => {
    const composability = readFileSync(
      join(repoRoot, "docs/internal/a1-handshake-composability.md"),
      "utf8",
    );
    const decisions = readFileSync(join(repoRoot, "docs/internal/decisions.md"), "utf8");

    expect(composability).toMatch(/wedge discipline|KILL-10/i);
    expect(composability).toMatch(/action-type agnostic|action type agnostic/i);
    expect(decisions).toMatch(/D-72.*OPP-09|OPP-09.*D-72/s);

    const wideningClaim = /A1 enables all action types/i;
    const allowedWedgeNegation =
      /not an excuse|widen|forbids|KILL-10|claims A1 enables|must not|do not claim/i;
    for (const text of [composability, decisions]) {
      const match = text.match(wideningClaim);
      if (match && match.index !== undefined) {
        const window = text.slice(Math.max(0, match.index - 120), match.index + 120);
        expect(window, "widening claim must appear only in negation/KILL framing").toMatch(
          allowedWedgeNegation,
        );
      }
    }

    expect("A1 enables all action types without Handshake contracts".includes("A1 enables all action types")).toBe(
      true,
    );
  });

  it("golden: evidence records must not expose authority flags", () => {
    const authorityFlags = ["mutationAuthorityCreated", "greenlightCreated"];
    const integrationFiles = walkTs("src/integrations");
    const violations = findIdentifierViolations(integrationFiles, authorityFlags);
    expect(violations).toEqual([]);
  });

  it("golden: MCP catalog denies workflow authority flags for A1", () => {
    const snapshot = mcpCatalogSnapshot() as Record<string, unknown>;
    expect(snapshot.authorityCreated).toBe(false);
    expect(snapshot.greenlightCreated).toBe(false);
    expect(snapshot.gatewayCheckPerformed).toBe(false);
    expect(snapshot).not.toHaveProperty("a1CreatesGreenlight");
    expect(snapshot).not.toHaveProperty("delegationVerifyCreatesAuthority");

    const catalogText = readFileSync(join(repoRoot, "src/mcp/catalog.ts"), "utf8");
    expect(catalogText).not.toMatch(/a1CreatesGreenlight|delegationVerifyCreatesAuthority/);
  });
});
