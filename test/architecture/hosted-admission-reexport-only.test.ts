import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** Phase-03 D-39 / Phase-05 plan 05-09 (D-71: no hosted workspace promotion). */

const repoRoot = process.cwd();

const reexportOnlyFiles = [
  "hosted-admission-config.ts",
  "hosted-caller-identity.ts",
  "hosted-verifier-adapter.ts",
] as const;

const reexportPattern = /export\s+\*\s+from\s+["']\.\.\/\.\.\/hosted-admission\//;

describe("hosted-admission http shims", () => {
  for (const fileName of reexportOnlyFiles) {
    it(`${fileName} re-exports hosted-admission only`, () => {
      const path = join(repoRoot, "src/http/admission", fileName);
      const source = readFileSync(path, "utf8").trim();
      expect(reexportPattern.test(source)).toBe(true);
      expect(source).not.toMatch(/\bfunction\s+/);
      expect(source).not.toMatch(/\bclass\s+/);
    });
  }

  it("lists all hosted-* shim files under src/http/admission", () => {
    const hostedShims = readdirSync(join(repoRoot, "src/http/admission"))
      .filter((name) => name.startsWith("hosted-") && name.endsWith(".ts"))
      .sort();
    expect(hostedShims).toEqual([...reexportOnlyFiles].sort());
  });

  it("keeps canonical hosted-admission index on disk", () => {
    expect(existsSync(join(repoRoot, "src/hosted-admission/index.ts"))).toBe(true);
  });
});
