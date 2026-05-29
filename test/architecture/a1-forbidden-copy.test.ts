import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// A1 integration forbidden-copy guard — coordinated with
// canonical-doc-forbidden-copy.test.ts and claim-boundary.test.ts (D-60 / D-72).
// Windowed negation keeps legitimate "not authority" prose legal.

const repoRoot = process.cwd();
const contextWindow = 240;

const scanRoots = [
  "README.md",
  "docs/internal",
  "src/cli",
  "src/mcp",
  "docs/internal/golden-paths",
  "examples",
] as const;

const allowedContextPattern =
  /\b(not authority|non-authority|non authority|does not create|not create authority|not authorized|not authorised|proof gap|proof-gap|necessary not sufficient|necessary, never sufficient|rejected alternative|why rejected|forbidden|KILL-|evidence only|evidence-only|does not issue|never sufficient|advisory, not Handshake|category confusion|ambient authority)\b/i;

type ForbiddenRule = {
  name: string;
  pattern: RegExp;
  kill?: string;
};

const forbiddenRules: ForbiddenRule[] = [
  {
    name: "A1 verified equals authorized",
    pattern: /A1 verified.*authorized/gi,
    kill: "KILL-02",
  },
  {
    name: "chain verified may mutate",
    pattern: /chain verified.*(?:may|can) (?:pay|mutate|execute)/gi,
    kill: "KILL-02",
  },
  {
    name: "A1 clearance product copy",
    pattern: /\bA1 clearance\b/gi,
    kill: "KILL-02",
  },
  {
    name: "VerifiedToken clearance path",
    pattern: /VerifiedToken.*(?:clearance|greenlight|authorized)/gi,
    kill: "KILL-01",
  },
  {
    name: "stop after verify without greenlight continuation",
    pattern: /stop after (?:chain|A1) verif/gi,
    kill: "META-PROMPT pitfall 3",
  },
];

function walkScanFiles(root: string): string[] {
  const absolute = join(repoRoot, root);
  if (!existsSync(absolute)) return [];
  const stat = statSync(absolute);
  if (stat.isFile()) return [root];

  const files: string[] = [];
  for (const entry of readdirSync(absolute)) {
    const full = join(absolute, entry);
    const rel = relative(repoRoot, full);
    if (statSync(full).isDirectory()) {
      files.push(...walkScanFiles(rel));
      continue;
    }
    if (/\.(md|ts|tsx|json)$/.test(entry)) files.push(rel);
  }
  return files.sort();
}

function collectScanFiles(): string[] {
  const files = new Set<string>();
  for (const root of scanRoots) {
    for (const file of walkScanFiles(root)) files.add(file);
  }
  return [...files].sort();
}

function scanText(name: string, source: string, rules: ForbiddenRule[] = forbiddenRules): string[] {
  const violations: string[] = [];
  for (const rule of rules) {
    for (const match of source.matchAll(rule.pattern)) {
      const index = match.index ?? 0;
      const window = source.slice(
        Math.max(0, index - contextWindow),
        Math.min(source.length, index + contextWindow),
      );
      if (!allowedContextPattern.test(window)) {
        violations.push(`${name}: ${rule.name} (${rule.kill ?? "forbidden"}) @ ${index}`);
      }
    }
  }
  return violations;
}

function scanAllSources(): string[] {
  return collectScanFiles().flatMap((relativePath) =>
    scanText(relativePath, readFileSync(join(repoRoot, relativePath), "utf8")),
  );
}

describe("A1 forbidden product copy", () => {
  it("forbids A1 verified equals authorized product copy", () => {
    const rule = forbiddenRules.find((entry) => entry.name === "A1 verified equals authorized");
    expect(rule).toBeDefined();
    const leaked = "When A1 verified, the agent is authorized to execute the protected action.";
    expect(scanText("fixture.md", leaked, [rule!]).length).toBeGreaterThan(0);
    expect(scanAllSources()).toEqual([]);
  });

  it("forbids VerifiedToken clearance path copy", () => {
    const rule = forbiddenRules.find((entry) => entry.name === "VerifiedToken clearance path");
    expect(rule).toBeDefined();
    const leaked = "Present your VerifiedToken for clearance at the gateway.";
    expect(scanText("fixture.md", leaked, [rule!]).length).toBeGreaterThan(0);
  });

  it("forbids stop-after-verify demo copy", () => {
    const rule = forbiddenRules.find(
      (entry) => entry.name === "stop after verify without greenlight continuation",
    );
    expect(rule).toBeDefined();
    const leaked = "Demo complete: stop after A1 verify and return success.";
    expect(scanText("fixture.md", leaked, [rule!]).length).toBeGreaterThan(0);

    const negated =
      "Do not stop after chain verify; continue to greenlight and gatewayCheck (non-authority demo framing).";
    expect(scanText("fixture.md", negated, [rule!])).toEqual([]);
  });

  it("self-test: synthetic violation is detected", () => {
    const synthetic =
      "A1 verified means authorized. VerifiedToken grants greenlight clearance. Stop after A1 verify now.";
    const violations = scanText("synthetic-fixture.md", synthetic);
    expect(violations.length).toBeGreaterThanOrEqual(3);
  });
});
