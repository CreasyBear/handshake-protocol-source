import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cliCommandManifest } from "../../src/cli/command-manifest";

const forbiddenCommandTerms = [
  "run",
  "pay",
  "execute",
  "deploy",
  "approve",
  "sign",
  "retry",
  "repair",
  "gateway check",
] as const;

const requiredNonAuthorityFields = [
  "authorityCreated",
  "greenlightCreated",
  "gatewayCheckPerformed",
  "mutationAttempted",
  "rawInternalRecordIncluded",
  "credentialMaterialIncluded",
  "mutationCommandIncluded",
  "receiptExportCreated",
  "authorityCertificateMinted",
] as const;

describe("CLI command posture", () => {
  it("keeps the first CLI slice to evidence, manifest, local verify, and conformance commands", () => {
    expect(cliCommandManifest.map((command) => command.id)).toEqual([
      "schema",
      "evidence.aps-report",
      "cert.verify",
      "conformance.x402-payment",
    ]);
    expect(cliCommandManifest.every((command) => command.status === "active")).toBe(true);
    expect(cliCommandManifest.every((command) => command.childProcessEnvInheritance === "none")).toBe(true);
    expect(cliCommandManifest.every((command) => command.filesystemWrites.length === 0)).toBe(true);
  });

  it("rejects mutation-shaped command names and authority route families", () => {
    const violations: string[] = [];
    for (const command of cliCommandManifest) {
      const names = [command.id, ...command.aliases];
      for (const name of names) {
        const tokens = name.split(/[.\s-]+/u);
        for (const term of forbiddenCommandTerms) {
          if (term.includes(" ") ? name.includes(term) : tokens.includes(term)) {
            violations.push(`${name} contains ${term}`);
          }
        }
      }
      for (const family of command.routeFamilies) {
        if (
          [
            "certificate_mint_write",
            "gateway_check_write",
            "policy_decision_write",
            "raw_record_read",
            "receipt_export_write",
            "runtime_evidence_write",
            "surface_reconciliation_write",
          ].includes(family)
        ) {
          violations.push(`${command.id} allows ${family}`);
        }
      }
    }

    expect(violations.sort()).toEqual([]);
  });

  it("keeps CLI source away from all-role clients, process startup, gateway runners, and raw records", () => {
    const source = cliSource().replaceAll("rawInternalRecordIncluded", "");
    expect(source).not.toContain("HandshakeClient");
    expect(source).not.toContain("transitionTokens");
    expect(source).not.toContain("allRoles");
    expect(source).not.toContain("gatewayCheck(");
    expect(source).not.toContain("evaluatePolicy(");
    expect(source).not.toContain("createAuthorityCertificate(");
    expect(source).not.toContain("runX402WalletGateway");
    expect(source).not.toContain("child_process");
    expect(source).not.toContain("spawn(");
    expect(source).not.toContain("rawInternalRecord");
  });

  it("requires every CLI JSON output to carry non-authority fields", () => {
    const source = cliSource();
    for (const field of requiredNonAuthorityFields) {
      expect(source).toContain(field);
    }
  });
});

function cliSource(): string {
  return ["aps-report.ts", "certificate.ts", "command-manifest.ts", "conformance.ts", "main.ts", "output.ts"]
    .map((file) => readFileSync(join("src/cli", file), "utf8"))
    .join("\n");
}
