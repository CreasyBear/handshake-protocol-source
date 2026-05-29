import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// D-60: forbidden-copy lint is structural, not advisory. Category-claim leakage
// and passport-as-permission metaphors in canonical product docs fail the build,
// mirroring the windowed allowlist used by cli-non-authority-copy.test.ts.
// Negation windows (05-RESEARCH-ADJUDICATION #5) keep legitimate "not X" framing
// legal so service-workflow-story.md negation tables and golden-path disclaimers
// stay green. Forbidden phrase list is coordinated with claim-boundary.test.ts.

const repoRoot = process.cwd();

const canonicalDocPaths = [
  "README.md",
  "CHANGELOG.md",
  "STRUCTURE.md",
  "QUALITY.md",
  "docs/internal/decisions.md",
  "docs/internal/protocol-definition.md",
  "docs/internal/protocol-kernel-architecture.md",
  "docs/internal/protocol-layman.md",
  "docs/internal/protocol-notes.md",
  "docs/internal/service-workflow-story.md",
  "docs/internal/developer-experience-index.md",
  "docs/internal/golden-paths/agent-golden-path.md",
  "docs/internal/golden-paths/service-operator-golden-path.md",
  "docs/internal/golden-paths/auditor-golden-path.md",
] as const;

// Standalone metaphor/category words that must never headline the product
// category without a negation or evidence-framing window. `\bword\b`
// deliberately ignores camelCase identifiers like `passportPackageDigest`.
const forbiddenCategoryPatterns: readonly RegExp[] = [
  /\bpassport\b/gi,
  /\bagent auth\b/gi,
  /\bhuman-in-the-loop\b/gi,
  /\bcompliance theatre\b/gi,
  /\bcompliance theater\b/gi,
  /\baudit trail\b/gi,
  /\bapproval workflow\b/gi,
  /\bagent permissions\b/gi,
];

const allowedContextPattern =
  /\b(not a passport|not permission|not authorization|not authorisation|negation|evidence package|evidence bundle|presented evidence|present passport evidence|non-authority|non authority|does not|do not|not create|not authority|reconstructable clearance|correlation only|readback|proof gap|proof-gap)\b/i;

const contextWindow = 240;

function scanText(name: string, source: string): string[] {
  const violations: string[] = [];
  for (const pattern of forbiddenCategoryPatterns) {
    for (const match of source.matchAll(pattern)) {
      const index = match.index ?? 0;
      const window = source.slice(
        Math.max(0, index - contextWindow),
        Math.min(source.length, index + contextWindow),
      );
      if (!allowedContextPattern.test(window)) {
        violations.push(`${name}: ${match[0]} @ ${index}`);
      }
    }
  }
  return violations;
}

function scanDocSources(relativePaths: readonly string[]): string[] {
  return relativePaths.flatMap((relativePath) =>
    scanText(relativePath, readFileSync(join(repoRoot, relativePath), "utf8")),
  );
}

describe("canonical doc forbidden copy", () => {
  it("keeps category-claim leakage out of canonical docs without a negation window (D-60)", () => {
    expect(scanDocSources(canonicalDocPaths)).toEqual([]);
  });

  it("flags a passport permission metaphor added to a doc lead without a negation window", () => {
    const leaked = "# Handshake\n\nShow your Passport and the service grants the agent the ability to pay.";
    expect(scanText("README.md", leaked).length).toBeGreaterThan(0);
  });

  it("allows passport inside an explicit negation window (service-workflow-story.md)", () => {
    const negated = "Passport is not a passport for permission. Passport is not permission.";
    expect(scanText("docs/internal/service-workflow-story.md", negated)).toEqual([]);
    const story = readFileSync(join(repoRoot, "docs/internal/service-workflow-story.md"), "utf8");
    expect(story).toContain("not a passport");
  });
});
