import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const repoRoot = process.cwd();

const requiredKillTests = [
  "test/architecture/a1-integration-kill-enforcement.test.ts",
  "test/architecture/a1-forbidden-copy.test.ts",
  "test/architecture/a1-integration-phase-gate.test.ts",
] as const;

function walkFiles(root: string): string[] {
  const absolute = join(repoRoot, root);
  if (!existsSync(absolute)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(absolute)) {
    const full = join(absolute, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walkFiles(relative(repoRoot, full)));
      continue;
    }
    files.push(relative(repoRoot, full));
  }
  return files.sort();
}

describe("A1 integration phase gate", () => {
  it("A1-0 composability doc exists with trust-domain sections", () => {
    const path = "docs/internal/a1-handshake-composability.md";
    expect(existsSync(join(repoRoot, path))).toBe(true);
    const text = readFileSync(join(repoRoot, path), "utf8");
    expect(text).toMatch(/Delegation/i);
    expect(text).toMatch(/Mutation/i);
    expect(text).toMatch(/trust domain/i);
  });

  it("D-72 OPP-09 decision is recorded", () => {
    const decisions = readFileSync(join(repoRoot, "docs/internal/decisions.md"), "utf8");
    expect(decisions).toMatch(/D-72.*OPP-09|OPP-09.*D-72/s);
    expect(decisions).toMatch(/evidence-only|evidence only/i);
    expect(decisions).toMatch(/sidecar escalation/i);
  });

  it("minimum KILL test files registered", () => {
    for (const rel of requiredKillTests) {
      expect(existsSync(join(repoRoot, rel)), `${rel} must exist`).toBe(true);
    }
  });

  it("A1-1 paths blocked until gate passes", () => {
    const integrationRoot = "src/integrations/a1-evidence";
    const integrationExists = existsSync(join(repoRoot, integrationRoot));
    if (!integrationExists) {
      expect(walkFiles(integrationRoot)).toEqual([]);
      return;
    }

    const composabilityOk = existsSync(join(repoRoot, "docs/internal/a1-handshake-composability.md"));
    const decisions = readFileSync(join(repoRoot, "docs/internal/decisions.md"), "utf8");
    const d72Ok = /D-72.*OPP-09|OPP-09.*D-72/s.test(decisions);
    const testsOk = requiredKillTests.every((rel) => existsSync(join(repoRoot, rel)));

    expect(composabilityOk && d72Ok && testsOk).toBe(true);
  });
});
