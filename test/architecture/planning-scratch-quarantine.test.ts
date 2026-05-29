import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// D-62: the concierge demand test is non-engineering scope — scaffold lives only
// in .planning/macro/ and must never be promoted into source, CI scripts, or
// product canon until a named buyer engages. This quarantine forbids promotion;
// it does NOT forbid the scratch file existing on disk under .planning/.

const repoRoot = process.cwd();

const quarantinedScratchMarkers = [
  ".planning/macro-plan",
  ".planning/macro/concierge",
  "concierge-demand-test-scaffold",
] as const;

type PackageJson = { scripts?: Record<string, string> };

function walkSource(root: string): string[] {
  const absolute = join(repoRoot, root);
  if (!existsSync(absolute)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(absolute)) {
    const full = join(absolute, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walkSource(relative(repoRoot, full)));
      continue;
    }
    if (/\.(ts|tsx|md)$/.test(entry)) files.push(relative(repoRoot, full));
  }
  return files;
}

describe("planning scratch quarantine", () => {
  it("does not wire macro-plan or concierge scaffold into package scripts (D-62)", () => {
    const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as PackageJson;
    const violations: string[] = [];
    for (const [name, command] of Object.entries(packageJson.scripts ?? {})) {
      for (const marker of quarantinedScratchMarkers) {
        if (command.includes(marker)) violations.push(`${name}: ${marker}`);
      }
    }

    expect(violations).toEqual([]);
  });

  it("does not promote macro-plan or concierge scaffold as canonical setup in README (D-62)", () => {
    const readme = readFileSync(join(repoRoot, "README.md"), "utf8");
    const violations = quarantinedScratchMarkers.filter((marker) => readme.includes(marker));

    expect(violations).toEqual([]);
  });

  it("does not import or re-export planning scratch from src/test/docs (D-62)", () => {
    const sources = [...walkSource("src"), ...walkSource("test"), ...walkSource("docs")].filter(
      (file) => file !== "test/architecture/planning-scratch-quarantine.test.ts",
    );
    const violations: string[] = [];
    for (const file of sources) {
      const text = readFileSync(join(repoRoot, file), "utf8");
      for (const marker of quarantinedScratchMarkers) {
        if (text.includes(marker)) violations.push(`${file}: ${marker}`);
      }
    }

    expect(violations).toEqual([]);
  });
});
