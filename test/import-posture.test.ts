import { describe, expect, it } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const protocolAreas = [
  "action-contract",
  "catalog-envelope",
  "gateway-gate",
  "intent-compilation",
  "isolation-breaker",
  "operation-lifecycle",
  "policy-greenlight",
  "proof-gap",
  "protected-path-posture",
  "receipt-export",
  "recovery",
  "review-binding",
  "runtime-evidence",
] as const;

const compatibilityShims = [
  "src/protocol/action-contracts.ts",
  "src/protocol/breaker-decisions.ts",
  "src/protocol/gateway-check.ts",
  "src/protocol/gateway-check-artifacts.ts",
  "src/protocol/gateway-check-attempts.ts",
  "src/protocol/intent-compilation.ts",
  "src/protocol/isolation-states.ts",
  "src/protocol/policy.ts",
  "src/protocol/policy-decisions.ts",
  "src/protocol/proof-gaps.ts",
  "src/protocol/protected-path-postures.ts",
  "src/protocol/protected-surface-operation-claims.ts",
  "src/protocol/receipt-exports.ts",
  "src/protocol/recovery-action-linkage.ts",
  "src/protocol/recovery-recommendation-status.ts",
  "src/protocol/recovery-recommendations.ts",
  "src/protocol/recovery-terminal-conflict-resolutions.ts",
  "src/protocol/recovery-terminal-conflicts.ts",
  "src/protocol/review-artifacts.ts",
  "src/protocol/review-decisions.ts",
  "src/protocol/runtime-executions.ts",
  "src/protocol/sequence-dependencies.ts",
  "src/protocol/surface-operation-reconciliations.ts",
] as const;

describe("protocol module import posture", () => {
  it("keeps transports out of protocol area internals", () => {
    const areaPattern = protocolAreas.join("|");
    const violations = importViolations(["src/http", "src/sdk"], [
      new RegExp(`from\\s+["'][^"']*protocol/(?:${areaPattern})/(?!index(?:["']|/))[^"']+["']`),
      new RegExp(`from\\s+["']\\.\\./protocol/(?:${areaPattern})/(?!index(?:["']|/))[^"']+["']`),
    ]);

    expect(violations).toEqual([]);
  });

  it("keeps HTTP route metadata separate from dispatch and response schema definitions", () => {
    const registry = readFileSync("src/http/transition-route-registry.ts", "utf8");
    const registryImports = importsFrom(registry);
    const invokers = readFileSync("src/http/transition-invokers.ts", "utf8");
    const responses = readFileSync("src/http/transition-response-schemas.ts", "utf8");

    expect(registryImports).toContain("./transition-invokers");
    expect(registryImports).toContain("./transition-response-schemas");
    expect(registryImports).not.toContain("../protocol/kernel");
    expect(registry).not.toMatch(/transitionInvokers\s*=/);
    expect(registry).not.toMatch(/const\s+\w+ResponseSchema\s*=/);

    expect(invokers).toMatch(/transitionInvokers\s*=/);
    expect(invokers).toContain("../protocol/kernel");
    expect(invokers).not.toContain("ResponseSchema");

    expect(responses).toContain("ResponseSchema");
    expect(responses).not.toContain("transitionInvokers");
    expect(responses).not.toContain("HandshakeKernel");
  });

  it("keeps reference adapters from importing storage internals", () => {
    const violations = importViolations(["src/adapters"], [
      /from\s+["'][^"']*storage(?:\/|["'])/,
    ]);

    expect(violations).toEqual([]);
  });

  it("keeps reference adapters and runtime wrappers off root compatibility aggregators", () => {
    const violations = importViolations(["src/adapters", "src/runtime"], [
      /from\s+["'][^"']*protocol\/(?:schemas|inputs)(?:["']|\/)/,
    ]);

    expect(violations).toEqual([]);
  });

  it("keeps storage adapters from importing primitive behavior modules", () => {
    const violations = importViolations(["src/storage"], [
      /from\s+["'][^"']*protocol\/(?:schemas|inputs)(?:["']|\/)/,
      /from\s+["'][^"']*protocol\/(?:operation-lifecycle|gateway-gate|policy-greenlight|action-contract|catalog-envelope|intent-compilation|review-binding|recovery|receipt-export|isolation-breaker|runtime-evidence|protected-path-posture|proof-gap)(?:\/|["'])/,
    ]);

    expect(violations).toEqual([]);
  });

  it("keeps D1 store behavior separate from SQL mutation statement assembly", () => {
    const store = readFileSync("src/storage/d1.ts", "utf8");
    const statements = readFileSync("src/storage/d1-statements.ts", "utf8");

    expect(importsFrom(store)).toContain("./d1-statements");
    expect(store).not.toMatch(/private\s+\w+Statement\(/);
    expect(store).not.toMatch(/\.prepare\(\s*(?:`[^`]*(?:INSERT|DELETE|VALUES)|"[^"]*(?:INSERT|DELETE|VALUES))/i);
    expect(statements).toContain("protocolCommitStatements");
    expect(statements).toContain("D1PreparedStatement");
    expect(statements).not.toContain("implements ProtocolStore");
    expect(statements).not.toContain("HandshakeKernel");
  });

  it("keeps protocol modules from importing storage adapters", () => {
    const violations = importViolations(["src/protocol"], [
      /from\s+["'][^"']*storage(?:\/|["'])/,
    ]);

    expect(violations).toEqual([]);
  });

  it("keeps the kernel on public area indexes", () => {
    const text = readFileSync("src/protocol/kernel.ts", "utf8");
    const violations = importsFrom(text).filter((specifier) =>
      protocolAreas.some((area) => specifier.startsWith(`./${area}/`) && specifier !== `./${area}/index`),
    );

    expect(violations).toEqual([]);
  });

  it("keeps area-to-area imports on public indexes", () => {
    const violations: string[] = [];
    for (const area of protocolAreas) {
      for (const file of walkTs(join("src/protocol", area))) {
        const localName = relative(join("src/protocol", area), file);
        const text = readFileSync(file, "utf8");
        for (const specifier of importsFrom(text)) {
          for (const otherArea of protocolAreas) {
            if (otherArea === area) continue;
            const isSchemaContractImport =
              ["schemas.ts", "inputs.ts", "types.ts"].includes(localName) &&
              specifier === `../${otherArea}/schemas`;
            if (isSchemaContractImport) continue;
            if (specifier.startsWith(`../${otherArea}/`) && specifier !== `../${otherArea}/index`) {
              violations.push(`${relative(process.cwd(), file)} imports ${specifier}`);
            }
          }
        }
      }
    }

    expect(violations.sort()).toEqual([]);
  });

  it("keeps area internals on the single local types face", () => {
    const violations: string[] = [];
    for (const area of protocolAreas) {
      for (const file of walkTs(join("src/protocol", area))) {
        if (
          file.endsWith(`${area}/index.ts`) ||
          file.endsWith(`${area}/types.ts`) ||
          file.endsWith(`${area}/schemas.ts`) ||
          file.endsWith(`${area}/inputs.ts`)
        ) {
          continue;
        }
        const text = readFileSync(file, "utf8");
        for (const specifier of importsFrom(text)) {
          if (specifier === "../schemas" || specifier === "../inputs" || specifier === "./schemas" || specifier === "./inputs") {
            violations.push(`${relative(process.cwd(), file)} imports ${specifier}`);
          }
        }
      }
    }

    expect(violations.sort()).toEqual([]);
  });

  it("keeps root schemas and inputs as compatibility aggregators only", () => {
    const violations = ["src/protocol/schemas.ts", "src/protocol/inputs.ts"].flatMap((file) => {
      const text = readFileSync(file, "utf8");
      return text
        .split("\n")
        .filter((line) => line.trim() && !line.startsWith("export * from "))
        .map((line) => `${file}: ${line}`);
    });

    expect(violations.sort()).toEqual([]);
  });

  it("keeps protocol internals off root schema and input compatibility aggregators", () => {
    const violations: string[] = [];
    for (const file of walkTs("src/protocol")) {
      const rel = relative(process.cwd(), file);
      if (rel === "src/protocol/schemas.ts" || rel === "src/protocol/inputs.ts") continue;
      const isRootProtocolFile = relative("src/protocol", file).split("/").length === 1;
      for (const specifier of importsFrom(readFileSync(file, "utf8"))) {
        if (isRootProtocolFile && (specifier === "./schemas" || specifier === "./inputs")) {
          violations.push(`${rel} imports ${specifier}`);
        }
        if (!isRootProtocolFile && (specifier === "../schemas" || specifier === "../inputs")) {
          violations.push(`${rel} imports ${specifier}`);
        }
      }
    }

    expect(violations.sort()).toEqual([]);
  });

  it("keeps area types faces local-only", () => {
    const violations: string[] = [];
    const allowedLines = new Set([
      `export * from "../schema-core";`,
      `export * from "./schemas";`,
      `export * from "./inputs";`,
    ]);
    for (const area of protocolAreas) {
      const typesPath = join("src/protocol", area, "types.ts");
      const text = readFileSync(typesPath, "utf8");
      for (const line of text.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (!allowedLines.has(trimmed)) {
          violations.push(`${relative(process.cwd(), typesPath)}: ${trimmed}`);
        }
      }
    }

    expect(violations.sort()).toEqual([]);
  });

  it("keeps object-registry as object metadata, not primitive logic", () => {
    const text = readFileSync("src/protocol/object-registry/index.ts", "utf8");
    const imports = importsFrom(text).sort();
    const allowedImports = [
      "../action-contract/schemas",
      "../catalog-envelope/schemas",
      "../event-schemas",
      "../gateway-gate/schemas",
      "../intent-compilation/schemas",
      "../isolation-breaker/schemas",
      "../operation-lifecycle/schemas",
      "../policy-greenlight/schemas",
      "../proof-gap/schemas",
      "../protected-path-posture/schemas",
      "../receipt-export/schemas",
      "../recovery/schemas",
      "../review-binding/schemas",
      "../runtime-evidence/schemas",
      "../transition-request-context-schemas",
      "./schemas",
      "zod",
    ];
    const forbiddenLogicTerms = [
      "evaluatePolicy",
      "gatewayCheck",
      "greenlight",
      "reviewDecision",
      "reconcileSurfaceOperation",
      "recoveryRecommendation",
      "isolationState",
      "proofGap",
    ];
    const forbiddenHits = forbiddenLogicTerms.filter((term) => text.includes(`function ${term}`));

    expect(imports).toEqual(allowedImports);
    expect(forbiddenHits).toEqual([]);
  });

  it("keeps deprecated root-level compatibility shims removed", () => {
    const violations = compatibilityShims.filter((file) => existsSync(file));

    expect(violations).toEqual([]);
  });
});

function importViolations(roots: string[], patterns: RegExp[]): string[] {
  const violations: string[] = [];
  for (const root of roots) {
    for (const file of walkTs(root)) {
      const text = readFileSync(file, "utf8");
      for (const pattern of patterns) {
        if (pattern.test(text)) violations.push(`${relative(process.cwd(), file)} matches ${pattern.source}`);
      }
    }
  }
  return violations.sort();
}

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
