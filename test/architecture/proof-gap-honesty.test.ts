import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const forbiddenPhrases = [
  /run the auth\.md quickstart/i,
  /bootstrap package install clearance/i,
  /quickstart:package-install/i,
  /demo:auth-md/i,
];

const requiredGoldenPathPhrases = [
  /Proof-gap list/i,
  /runnable in phase 04\?/i,
  /x402_payment\.exact|buyer-side.*x402/i,
];

describe("proof-gap honesty", () => {
  it("forbids stub example directories for proof-gap families", () => {
    expect(existsSync("examples/auth-md-protected-api-stub")).toBe(false);
    expect(existsSync("examples/package-install-protected-action-stub")).toBe(false);
  });

  it("requires golden path proof-gap prose and x402-only runnable wedge", () => {
    const goldenPath = readFileSync("docs/internal/service-operator-golden-path.md", "utf8");
    for (const pattern of requiredGoldenPathPhrases) {
      expect(goldenPath).toMatch(pattern);
    }
    const proseOutsideForbiddenCallouts = goldenPath.split("Forbidden operator language")[0] ?? goldenPath;
    for (const pattern of forbiddenPhrases) {
      expect(proseOutsideForbiddenCallouts).not.toMatch(pattern);
    }
  });

  it("forbids runnable clearance claims in devex index and package scripts", () => {
    const devex = readFileSync("docs/internal/developer-experience-index.md", "utf8");
    for (const pattern of forbiddenPhrases) {
      expect(devex).not.toMatch(pattern);
    }

    const packageJson = readFileSync("package.json", "utf8");
    expect(packageJson).not.toMatch(/demo:auth-md/);
    expect(packageJson).not.toMatch(/quickstart:package-install/);
  });

  it("does not add live-gateway run.ts stubs under examples for proof-gap families", () => {
    const examplesDir = "examples";
    if (!existsSync(examplesDir)) return;

    const suspicious = ["auth-md-protected-api-stub", "package-install-protected-action-stub"];
    for (const name of suspicious) {
      const runPath = join(examplesDir, name, "run.ts");
      expect(existsSync(runPath)).toBe(false);
    }

    for (const entry of readdirSync(examplesDir)) {
      if (!entry.includes("auth-md") && !entry.includes("package-install")) continue;
      if (entry === "external-adapter-sdk") continue;
      const runPath = join(examplesDir, entry, "run.ts");
      if (!existsSync(runPath)) continue;
      const source = readFileSync(runPath, "utf8");
      expect(source).not.toMatch(/runAuthMdProtectedApiCallGateway\s*\(/);
      expect(source).not.toMatch(/runPackageInstallGateway\s*\(/);
    }
  });
});
