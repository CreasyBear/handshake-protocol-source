import { describe, expect, it } from "bun:test";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const ACTIVE_ROOTS = [
  "AGENTS.md",
  "README.md",
  "QUALITY.md",
  "STRUCTURE.md",
  "package.json",
  ".github",
  "wrangler.toml",
  "migrations",
  "src",
  "test",
  "docs/internal",
];
const PROVENANCE_SEGMENTS = new Set(["docs/internal/archive"]);
const SELF = "test/architecture/active-vocabulary.test.ts";
const staleBoundaryWord = "Rece" + "iver";
const staleBoundaryLower = staleBoundaryWord.toLowerCase();
const STALE_PATTERNS = [
  new RegExp(`\\b${staleBoundaryWord}\\b`),
  new RegExp(`${staleBoundaryWord}Gate`),
  new RegExp(`${staleBoundaryLower}_`),
  new RegExp(`${staleBoundaryLower}-`),
  new RegExp(`${staleBoundaryLower} gate`),
  new RegExp(`register${staleBoundaryWord}`),
  new RegExp(`${staleBoundaryLower}Gate`),
  new RegExp(`reconcile${staleBoundaryWord}`),
];
const BADGE_AUTHORITY_PATTERN = /\bbadge\b/i;
const BADGE_ALLOWED_CONTEXT_PATTERN =
  /not (?:a )?badge|Do not .*badge|must not .*badge|keeps badge language out|ambient authority wearing a badge|Badge-as-bearer-token|badge-as-bearer-token|forbidden/i;

describe("active vocabulary guard", () => {
  it("keeps stale receiver vocabulary out of active docs, commands, migrations, and code", async () => {
    const files = await activeFiles();
    const violations: string[] = [];

    for (const file of files) {
      const text = await readFile(join(ROOT, file), "utf8");
      for (const pattern of STALE_PATTERNS) {
        if (pattern.test(text)) violations.push(`${file}: ${pattern.source}`);
      }
    }

    expect(violations).toEqual([]);
  });

  it("keeps badge vocabulary constrained to anti-authority warnings", async () => {
    const files = await activeFiles();
    const violations: string[] = [];

    for (const file of files) {
      const text = await readFile(join(ROOT, file), "utf8");
      const lines = text.split("\n");
      for (const [index, line] of lines.entries()) {
        if (BADGE_AUTHORITY_PATTERN.test(line) && !BADGE_ALLOWED_CONTEXT_PATTERN.test(line)) {
          violations.push(`${file}:${index + 1}: badge language lacks anti-authority context`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

async function activeFiles(): Promise<string[]> {
  const files: string[] = [];
  for (const root of ACTIVE_ROOTS) {
    const path = join(ROOT, root);
    const rootStat = await stat(path).catch(() => null);
    if (!rootStat) continue;
    if (rootStat.isFile()) {
      files.push(path);
      continue;
    }
    files.push(...(await walk(path)));
  }
  return files
    .map((file) => normalize(file))
    .filter((file) => file !== SELF)
    .filter((file) => !isProvenancePath(file))
    .filter((file) => /\.(md|ts|tsx|js|mjs|cjs|json|sql)$/.test(file));
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", "dist", "coverage"].includes(entry.name)) continue;
      files.push(...(await walk(path)));
      continue;
    }
    files.push(path);
  }
  return files;
}

function normalize(path: string): string {
  return relative(ROOT, path).replaceAll("\\", "/");
}

function isProvenancePath(path: string): boolean {
  return [...PROVENANCE_SEGMENTS].some((segment) => path === segment || path.startsWith(`${segment}/`));
}
