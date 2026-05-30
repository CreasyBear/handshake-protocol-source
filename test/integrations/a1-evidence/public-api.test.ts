import { describe, expect, it } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();
const integrationRoot = join(repoRoot, "src/integrations/a1-evidence");

const ALLOWED_EXPORTS = new Set([
  "A1_VERIFIER_VERSION",
  "computeEvidenceBindingDigest",
  "computeA1VerifyOutcomeDigest",
  "buildDelegationEvidenceRecord",
  "DelegationEvidenceRecordSchema",
  "verifySignedChain",
  "VECTOR_MISMATCH_PROOF_GAP",
  "VECTOR_GROUNDTRUTH_UNAVAILABLE_PROOF_GAP",
]);

const FORBIDDEN_EXPORTS = ["VerifiedToken", "authorize", "issueGreenlight", "gatewayCheck"];

const FORBIDDEN_IMPORT_PATTERNS = [
  /protocol\/kernel/,
  /issueGreenlight/,
  /gatewayCheck/,
  /proposeActionContract/,
  /VerifiedToken/,
  /\/v1\/authorize/,
];

function collectModuleFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectModuleFiles(fullPath));
      continue;
    }
    if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("a1-evidence public API (A1-1)", () => {
  it("exports only the allowed verify + record surface", async () => {
    const mod = await import("../../../src/integrations/a1-evidence/index.js");
    const exportNames = Object.keys(mod).sort();

    for (const name of FORBIDDEN_EXPORTS) {
      expect(exportNames).not.toContain(name);
    }

    for (const allowed of ALLOWED_EXPORTS) {
      expect(exportNames).toContain(allowed);
    }

    expect(mod.verifySignedChain).toBeTypeOf("function");
    expect(mod.computeEvidenceBindingDigest).toBeTypeOf("function");
    expect(mod.buildDelegationEvidenceRecord).toBeTypeOf("function");
    expect(mod.A1_VERIFIER_VERSION).toBe("handshake-delegation-1.0.0-zip215");
  });

  it("does not transitively import kernel transitions or authorize paths", () => {
    expect(existsSync(integrationRoot)).toBe(true);
    const moduleFiles = collectModuleFiles(integrationRoot);

    for (const filePath of moduleFiles) {
      const source = readFileSync(filePath, "utf8");
      for (const pattern of FORBIDDEN_IMPORT_PATTERNS) {
        expect(source).not.toMatch(pattern);
      }
    }
  });
});
