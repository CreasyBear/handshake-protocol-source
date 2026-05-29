import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// D-60: CLI surfaces are projection/readback only — never authority. This lint
// forbids clearance verbs in CLI copy unless a negation/diagnostic window makes
// the non-authority boundary explicit.
//
// DRIFT GUARD: the forbiddenClearancePattern + allowedContextPattern here are the
// CLI-surface twin of test/architecture/canonical-doc-forbidden-copy.test.ts
// (doc surfaces). Keep both phrase lists coordinated — a phrase forbidden in docs
// should stay forbidden in CLI copy and vice versa (PATTERNS.md 05-11 landmine).

const repoRoot = process.cwd();
const cliRoot = "src/cli";

const forbiddenClearancePattern =
  /\b(authorized|cleared|greenlight issued|safe to execute|ready to pay)\b/gi;

const allowedContextPattern =
  /\b(proof gap|proof-gap|non-authority|non authority|diagnostic|simulation|does not create|not authority|readiness only|does not claim|not claimed|never|not authorized|does not)\b/i;

const contextWindow = 120;

function scanText(name: string, source: string): string[] {
  const violations: string[] = [];
  for (const match of source.matchAll(forbiddenClearancePattern)) {
    const index = match.index ?? 0;
    const window = source.slice(
      Math.max(0, index - contextWindow),
      Math.min(source.length, index + contextWindow),
    );
    if (!allowedContextPattern.test(window)) {
      violations.push(`${name}: ${match[0]} @ ${index}`);
    }
  }
  return violations;
}

function walkCopyFiles(root: string): string[] {
  const absolute = join(repoRoot, root);
  if (!existsSync(absolute)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(absolute)) {
    const full = join(absolute, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walkCopyFiles(relative(repoRoot, full)));
      continue;
    }
    if (/\.(ts|md)$/.test(entry)) files.push(relative(repoRoot, full));
  }
  return files;
}

function scanCliSources(): string[] {
  return walkCopyFiles(cliRoot).flatMap((relativePath) =>
    scanText(relativePath, readFileSync(join(repoRoot, relativePath), "utf8")),
  );
}

describe("cli non-authority copy", () => {
  it("keeps clearance verbs out of CLI copy without a non-authority window (D-60)", () => {
    expect(scanCliSources()).toEqual([]);
  });

  it("flags a bare clearance verb that lacks a non-authority window", () => {
    const leaked = "Result: the agent is authorized and safe to execute the protected mutation now.";
    expect(scanText("src/cli/example.ts", leaked).length).toBeGreaterThan(0);
  });

  it("allows clearance verbs inside an explicit non-authority window", () => {
    const negated = "A handle never makes a command authorized to run protected work (non-authority).";
    expect(scanText("src/cli/example.ts", negated)).toEqual([]);
  });
});
