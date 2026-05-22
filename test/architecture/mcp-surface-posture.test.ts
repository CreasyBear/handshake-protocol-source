import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { surfaceBoundaryManifest } from "../../src/surfaces/boundary-manifest";

describe("MCP surface posture", () => {
  it("keeps MCP active but off root package exports", async () => {
    expect(surfaceBoundaryManifest["mcp.runtime"].status).toBe("active");
    expect(surfaceBoundaryManifest["mcp.runtime"]).toMatchObject({
      custodyRole: "runtime_evidence",
      authorityPosture: "proposal_only",
    });

    const root = await import("../../src");
    expect(Object.keys(root)).not.toContain("proposeMcpX402Payment");
    expect(Object.keys(root)).not.toContain("mcpCatalogSnapshot");
  });

  it("keeps MCP source away from authority imports and all-role clients", () => {
    const violations: string[] = [];
    const forbiddenImportFragments = [
      "protocol/kernel",
      "protocol/areas/policy-greenlight/",
      "protocol/areas/gateway-gate/",
      "protocol/areas/receipt-export/",
      "protocol/areas/authority-certificate/",
      "adapters/",
      "storage/",
      "experimental",
      "sdk/client",
    ];

    for (const file of walkTs("src/mcp")) {
      const rel = relative(process.cwd(), file);
      for (const specifier of importsFrom(readFileSync(file, "utf8"))) {
        for (const fragment of forbiddenImportFragments) {
          if (specifier.includes(fragment)) violations.push(`${rel} imports ${specifier}`);
        }
      }
    }

    expect(violations.sort()).toEqual([]);
  });

  it("keeps MCP source from naming executable authority or credential material", () => {
    const forbiddenText = [
      "HandshakeClient",
      "transitionToken",
      "transitionTokens",
      "allRoles",
      "createAuthorityCertificate",
      "evaluatePolicy(",
      "gatewayCheck(",
      "createReceiptExport",
      "gatewayCheckInput",
      "PaymentPayload",
      "PAYMENT-SIGNATURE",
      "privateKey",
      "signer",
      "wallet",
    ];
    const violations: string[] = [];

    for (const file of walkTs("src/mcp")) {
      const rel = relative(process.cwd(), file);
      const text = readFileSync(file, "utf8");
      for (const forbidden of forbiddenText) {
        if (text.includes(forbidden)) violations.push(`${rel} mentions ${forbidden}`);
      }
    }

    expect(violations.sort()).toEqual([]);
  });
});

function importsFrom(text: string): string[] {
  return [...text.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1] ?? "");
}

function walkTs(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...walkTs(full));
      continue;
    }
    if (entry.endsWith(".ts")) files.push(full);
  }
  return files;
}
