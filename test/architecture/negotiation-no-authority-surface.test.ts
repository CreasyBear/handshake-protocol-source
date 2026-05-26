import { describe, expect, it } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const negotiationRoot = "src/protocol/areas/negotiation";
const forbiddenAreaSpecifiers = [
  "../policy-greenlight",
  "../gateway-gate",
  "../receipt-export",
  "../authority-certificate",
  "../operation-lifecycle",
] as const;
const downstreamSurfaceRoots = [
  "src/cli",
  "src/mcp",
  "src/http",
  "src/sdk",
  "src/adapters/x402-payment",
  "src/storage",
  "src/runtime",
] as const;

describe("negotiation area authority surface", () => {
  it("keeps negotiation schemas from importing protected-action control areas", () => {
    const violations: string[] = [];

    for (const file of walkTs(negotiationRoot)) {
      const imports = importsFrom(readFileSync(file, "utf8"));
      for (const specifier of imports) {
        if (forbiddenAreaSpecifiers.some((forbidden) => specifier.startsWith(forbidden))) {
          violations.push(`${relative(process.cwd(), file)} imports ${specifier}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("does not add negotiation transition functions or a transition module", () => {
    expect(existsSync(join(negotiationRoot, "transitions.ts"))).toBe(false);

    const exportedFunctions: string[] = [];
    for (const file of walkTs(negotiationRoot)) {
      const rel = relative(process.cwd(), file);
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/g)) {
        exportedFunctions.push(`${rel}:${match[1]}`);
      }
    }

    expect(exportedFunctions).toEqual([]);
  });

  it("keeps negotiation out of the package root for this phase", () => {
    const rootIndex = readFileSync("src/index.ts", "utf8");

    expect(rootIndex).not.toContain("negotiation");
    expect(rootIndex).not.toContain("Negotiation");
  });

  it("keeps downstream product and runtime surfaces from importing negotiation", () => {
    const violations: string[] = [];

    for (const root of downstreamSurfaceRoots) {
      for (const file of walkTs(root)) {
        const imports = importsFrom(readFileSync(file, "utf8"));
        for (const specifier of imports) {
          if (specifier.includes("protocol/areas/negotiation") || specifier.includes("../negotiation")) {
            violations.push(`${relative(process.cwd(), file)} imports ${specifier}`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

function importsFrom(text: string): string[] {
  return [...text.matchAll(/(?:import|export)\s+(?:type\s+)?(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g)].map(
    (match) => match[1] ?? "",
  );
}

function walkTs(root: string): string[] {
  const files: string[] = [];
  if (!existsSync(root)) return files;

  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...walkTs(full));
      continue;
    }
    if (entry.endsWith(".ts")) files.push(full);
  }

  return files.sort();
}
