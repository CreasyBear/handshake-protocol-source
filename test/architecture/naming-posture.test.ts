import { describe, expect, it } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const bannedSourcePathSegments = new Set(["utils", "helpers", "common", "misc", "stuff", "manager", "service"]);
const sourceLooseFileLimit = 7;
const bannedWorkspaceJunkFileNames = new Set([".DS_Store"]);
const internalStageWord = "Ti" + "er";
const repoFacingStagePatterns = [
  new RegExp(`${internalStageWord.toLowerCase()}1`, "i"),
  new RegExp(`\\b${internalStageWord}\\s+1\\b`),
  new RegExp(`\\b${internalStageWord}\\s+2\\b`),
  new RegExp(`\\b${internalStageWord}\\s+3\\b`),
  new RegExp(`\\b${internalStageWord}\\s+4\\b`),
  new RegExp(`${internalStageWord.toLowerCase()} doctrine`, "i"),
];
const repoFacingRoots = [
  "AGENTS.md",
  "README.md",
  "QUALITY.md",
  "STRUCTURE.md",
  "docs/internal",
  "package.json",
  ".github",
  "src",
  "test",
];
const self = "test/architecture/naming-posture.test.ts";
const nonCanonicalScratchFiles = [
  "Agent-Founder.md",
  ".agents",
  ".agents/product-marketing.md",
  "skills-lock.json",
] as const;
const deletedDocsPathPattern =
  /docs\/(?:adr|audits|business|plans|product|protocol|reference|specs)\b|00-product-requirements-spine/;
const overclaimingFunctionNamePattern =
  /\b(ensureSafe\w*|guarantee\w*|proveExecution\w*|trustedAgent\w*|secureApproval\w*)\s*(?:\(|:|=|<)/;
const vagueProtocolMutationPattern =
  /\b(handle(?!Id\b)[A-Z]\w*|process(?!Id\b)[A-Z]\w*|do(?!Id\b)[A-Z]\w*|run(?!Id\b)[A-Z]\w*)\s*(?:\(|:|=|<)/;
const adapterRailMarkers = [/\bx402\b/i] as const;
const permittedStageLabelLiterals = ["not_enforced_tier1_metadata"] as const;
const adapterRailAllowedFiles = new Set(["src/runtime/ingress/index.ts", "docs/internal/protocol-notes.md"]);

describe("repo naming posture", () => {
  it("keeps workspace metadata junk out of active repo surfaces", () => {
    const violations = walk(".")
      .map((file) => normalize(file))
      .filter((file) => bannedWorkspaceJunkFileNames.has(file.split("/").at(-1) ?? ""))
      .sort();

    expect(violations).toEqual([]);
  });

  it("keeps root test files out of the test tree", () => {
    const rootTests = readdirSync("test")
      .filter((entry) => entry.endsWith(".test.ts"))
      .sort();

    expect(rootTests).toEqual([]);
  });

  it("keeps source paths named by owned concepts instead of buckets", () => {
    const violations = walk("src")
      .map((file) => normalize(file))
      .filter((file) => file.endsWith(".ts"))
      .filter((file) => file.split("/").some((segment) => bannedSourcePathSegments.has(segment)));

    expect(violations).toEqual([]);
  });

  it("keeps source directories below the loose-file threshold", () => {
    const violations: string[] = [];
    for (const dir of walkDirs("src")) {
      const looseFiles = readdirSync(dir)
        .filter((entry) => entry.endsWith(".ts"))
        .filter((entry) => entry !== "index.ts")
        .sort();
      if (looseFiles.length > sourceLooseFileLimit) {
        violations.push(`${normalize(dir)} has ${looseFiles.length} loose TypeScript files: ${looseFiles.join(", ")}`);
      }
    }

    expect(violations).toEqual([]);
  });

  it("gives multi-file source folders a public face", () => {
    const violations: string[] = [];
    for (const dir of walkDirs("src")) {
      const looseFiles = readdirSync(dir).filter((entry) => entry.endsWith(".ts"));
      if (looseFiles.length > 3 && !looseFiles.includes("index.ts")) {
        violations.push(`${normalize(dir)} has ${looseFiles.length} TypeScript files but no index.ts`);
      }
    }

    expect(violations).toEqual([]);
  });

  it("keeps internal planning-stage labels out of repo-facing surfaces", () => {
    const violations: string[] = [];
    for (const file of repoFacingFiles()) {
      if (normalize(file) === self) continue;
      let text = readFileSync(file, "utf8");
      for (const literal of permittedStageLabelLiterals) text = text.replaceAll(literal, "");
      for (const pattern of repoFacingStagePatterns) {
        if (pattern.test(text)) violations.push(`${normalize(file)} matches ${pattern.source}`);
      }
    }

    expect(violations.sort()).toEqual([]);
  });

  it("keeps deleted scratch documents out of the active tree", () => {
    const violations = nonCanonicalScratchFiles.filter((file) => existsSync(file));

    expect(violations).toEqual([]);
  });

  it("keeps references to deleted documentation trees out of repo-facing surfaces", () => {
    const violations: string[] = [];
    for (const file of repoFacingFiles()) {
      if (normalize(file) === self) continue;
      if (normalize(file).startsWith("docs/internal/")) continue;
      const text = readFileSync(file, "utf8");
      if (deletedDocsPathPattern.test(text)) {
        violations.push(`${normalize(file)} references deleted documentation tree`);
      }
    }

    expect(violations.sort()).toEqual([]);
  });

  it("keeps overclaiming function names out of source", () => {
    const violations = sourceMatches("src", overclaimingFunctionNamePattern);

    expect(violations).toEqual([]);
  });

  it("keeps vague mutation verbs out of protocol modules", () => {
    const violations = sourceMatches("src/protocol", vagueProtocolMutationPattern);

    expect(violations).toEqual([]);
  });

  it("keeps adapter rail names out of protocol and runtime kernel lanes", () => {
    const violations = ["src/protocol", "src/runtime", "docs/internal/protocol-notes.md"]
      .flatMap((root) => sourceMatches(root, adapterRailMarkers))
      .filter((entry) => !adapterRailAllowedFiles.has(entry.split(":")[0] ?? entry));

    expect(violations).toEqual([]);
  });

  it("keeps CI bound to the repo check command", () => {
    const workflow = readFileSync(".github/workflows/check.yml", "utf8");

    expect(workflow).toContain("name: check");
    expect(workflow).toContain("npm run check:repo");
  });
});

function sourceMatches(root: string, pattern: RegExp | readonly RegExp[]): string[] {
  const violations: string[] = [];
  const patterns = Array.isArray(pattern) ? pattern : [pattern];
  for (const file of walk(root)) {
    if (!/\.(md|ts)$/.test(file)) continue;
    const text = readFileSync(file, "utf8");
    for (const entry of patterns) {
      for (const match of text.matchAll(new RegExp(entry, "g"))) {
        violations.push(`${normalize(file)}: ${match[1] ?? match[0]}`);
      }
    }
  }
  return violations.sort();
}

function repoFacingFiles(): string[] {
  return repoFacingRoots.flatMap((root) => {
    if (!existsSync(root)) return [];
    const stat = statSync(root);
    if (stat.isDirectory()) {
      return walk(root).filter((file) => /\.(md|ts|tsx|js|mjs|cjs|json|yml|yaml)$/.test(file));
    }
    return [root];
  });
}

function walk(root: string): string[] {
  const files: string[] = [];
  if (!existsSync(root)) return files;
  const stat = statSync(root);
  if (stat.isFile()) return [root];
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    const childStat = statSync(full);
    if (childStat.isDirectory()) {
      if (["node_modules", ".git", ".planning", "dist", "coverage"].includes(entry)) continue;
      files.push(...walk(full));
      continue;
    }
    files.push(full);
  }
  return files;
}

function walkDirs(root: string): string[] {
  const dirs = [root];
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    if (statSync(full).isDirectory()) dirs.push(...walkDirs(full));
  }
  return dirs;
}

function normalize(path: string): string {
  return relative(process.cwd(), path).replaceAll("\\", "/");
}
