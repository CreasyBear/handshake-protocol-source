import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { mutationRouteDefinitions, assertMutationRouteManifestParity } from "../../src/http/mutation-route-manifest";
import { transitionRouteDefinitions } from "../../src/http/routes/transition-route-registry";

/**
 * Phase-04 plan 04-11 carry-forward (Phase 05 plan 05-01, D-53).
 */

const readOnlyHandlerAllowlist = new Set([
  "src/http/handlers/evidence-read.ts",
  "src/http/handlers/hosted-readiness.ts",
  "src/http/handlers/internal-record-read.ts",
  "src/http/handlers/verifier.ts",
  "src/http/handlers/index.ts",
]);

const mutationExampleRunners = [
  "examples/x402-protected-spend/run.ts",
  "examples/package-install-end-to-end/run.ts",
  "examples/auth-md-protected-call/run.ts",
].filter((path) => existsSync(path));

const gatewayImportPattern = /run[A-Za-z0-9]+Gateway/;
const directMutationPatterns = [
  /\.applyPackageInstall\s*\(/,
  /\.applyRepoWrite\s*\(/,
  /\.applyAuthMd/,
  /fetch\s*\([^)]*\)\s*;[^]*?method:\s*["'](POST|PUT|PATCH|DELETE)/m,
];

function walkTs(root: string): string[] {
  if (!existsSync(root)) return [];
  const stat = statSync(root);
  if (stat.isFile()) return root.endsWith(".ts") ? [root] : [];
  const files: string[] = [];
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walkTs(full));
      continue;
    }
    if (entry.endsWith(".ts")) files.push(full);
  }
  return files;
}

describe("http handler mutation gating (04-11)", () => {
  it("keeps mutation-route-manifest at src/http/mutation-route-manifest.ts", () => {
    expect(existsSync("src/http/mutation-route-manifest.ts")).toBe(true);
    expect(existsSync("src/surfaces/mutation-route-manifest.ts")).toBe(false);
  });

  it("matches transitionRouteDefinitions length and paths", () => {
    expect(() => assertMutationRouteManifestParity()).not.toThrow();
    expect(mutationRouteDefinitions.length).toBe(transitionRouteDefinitions.length);
    expect(mutationRouteDefinitions.every((row) => row.requiresAdapterGatewayCheck)).toBe(true);
  });

  it("keeps first-party HTTP handlers read-only (evidence and admission readback)", () => {
    const handlers = walkTs("src/http/handlers");
    expect(handlers.length).toBeGreaterThan(0);
    for (const file of handlers) {
      expect(readOnlyHandlerAllowlist.has(file)).toBe(true);
    }

    const violations: string[] = [];
    for (const file of handlers) {
      const source = readFileSync(file, "utf8");
      if (gatewayImportPattern.test(source) && !source.includes("readback") && !source.includes("Evidence")) {
        violations.push(`${file}: unexpected gateway import in read handler lane`);
      }
      for (const pattern of directMutationPatterns) {
        if (pattern.test(source)) {
          violations.push(`${file}: direct mutation pattern ${pattern}`);
        }
      }
    }
    expect(violations.sort()).toEqual([]);
  });

  it("requires adapter.run*Gateway before mutation in first-party example runners", () => {
    const violations: string[] = [];
    for (const file of mutationExampleRunners) {
      const source = readFileSync(file, "utf8");
      if (!gatewayImportPattern.test(source)) {
        violations.push(`${file}: missing run*Gateway adapter import/call`);
      }
    }
    expect(violations.sort()).toEqual([]);
  });
});
