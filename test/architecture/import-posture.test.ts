import { describe, expect, it } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const protocolAreasRoot = "src/protocol/areas";
const protocolAreas = readdirSync(protocolAreasRoot)
  .filter((entry) => statSync(join(protocolAreasRoot, entry)).isDirectory())
  .sort();

const removedCompatibilityShims = [
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

const sourceLaneManifestFields = [
  "Authority owner",
  "Current proof claim",
  "Use cases",
  "Constraints and assumptions",
  "Core components",
  "Failure and scale posture",
  "Future package target",
  "Allowed imports",
  "Forbidden imports",
  "Guarding tests",
  "Public surface",
  "Extraction trigger",
  "Scope boundary",
] as const;

describe("protocol module import posture", () => {
  it("requires first-level source lanes to declare manifest ownership", () => {
    const violations: string[] = [];
    const lanes = readdirSync("src")
      .filter((entry) => statSync(join("src", entry)).isDirectory())
      .sort();

    for (const lane of lanes) {
      const manifestPath = join("src", lane, "LANE.md");
      const readmePath = join("src", lane, "README.md");
      const path = existsSync(manifestPath) ? manifestPath : existsSync(readmePath) ? readmePath : null;
      if (!path) {
        violations.push(`src/${lane} lacks LANE.md or README.md`);
        continue;
      }
      const text = readFileSync(path, "utf8");
      for (const field of sourceLaneManifestFields) {
        if (!new RegExp(`^## ${escapeRegExp(field)}\\s*$`, "m").test(text)) {
          violations.push(`${path} lacks required field: ${field}`);
        }
      }
    }

    expect(violations.sort()).toEqual([]);
  });

  it("keeps transports and clients off protocol area internals", () => {
    const violations: string[] = [];
    for (const file of ["src/http", "src/sdk"].flatMap((root) => walkTs(root))) {
      const rel = relative(process.cwd(), file);
      for (const specifier of importsFrom(readFileSync(file, "utf8"))) {
        const areaInternalImport = protocolAreas.some(
          (area) =>
            specifier.includes(`protocol/areas/${area}/`) && !specifier.endsWith(`protocol/areas/${area}/index`),
        );
        const allowedCertificateVerifyImport =
          rel === "src/sdk/surface-clients/evidence-client.ts" &&
          specifier.endsWith("protocol/areas/authority-certificate/verify");
        if (areaInternalImport && !allowedCertificateVerifyImport) {
          violations.push(`${rel} imports ${specifier}`);
        }
      }
    }

    expect(violations.sort()).toEqual([]);
  });

  it("keeps HTTP route metadata separate from dispatch and response schema definitions", () => {
    const registry = readFileSync("src/http/routes/transition-route-registry.ts", "utf8");
    const registryImports = importsFrom(registry);
    const invokers = readFileSync("src/http/routes/transition-invokers.ts", "utf8");
    const responses = readFileSync("src/http/routes/transition-response-schemas.ts", "utf8");

    expect(registryImports).toContain("./transition-invokers");
    expect(registryImports).toContain("./transition-response-schemas");
    expect(registryImports).not.toContain("../../protocol/kernel");
    expect(registry).not.toMatch(/transitionInvokers\s*=/);
    expect(registry).not.toMatch(/const\s+\w+ResponseSchema\s*=/);

    expect(invokers).toMatch(/transitionInvokers\s*=/);
    expect(invokers).toContain("../../protocol/kernel");
    expect(invokers).not.toContain("ResponseSchema");

    expect(responses).toContain("ResponseSchema");
    expect(responses).not.toContain("transitionInvokers");
    expect(responses).not.toContain("HandshakeKernel");
  });

  it("keeps reference adapters from importing storage internals", () => {
    const violations = importViolations(["src/adapters"], [/from\s+["'][^"']*storage(?:\/|["'])/]);

    expect(violations).toEqual([]);
  });

  it("keeps storage adapters from importing primitive behavior modules", () => {
    const areaPattern = protocolAreas.filter((area) => area !== "object-registry").join("|");
    const violations = importViolations(
      ["src/storage"],
      [
        /from\s+["'][^"']*protocol\/public\/(?:schemas|inputs)(?:["']|\/)/,
        new RegExp(`from\\s+["'][^"']*protocol/areas/(?:${areaPattern})(?:/|["'])`),
      ],
    );

    expect(violations).toEqual([]);
  });

  it("keeps D1 store behavior separate from SQL mutation statement assembly", () => {
    const store = readFileSync("src/storage/d1/index.ts", "utf8");
    const statements = readFileSync("src/storage/d1/statements.ts", "utf8");

    expect(importsFrom(store)).toContain("./statements");
    expect(store).not.toMatch(/private\s+\w+Statement\(/);
    expect(store).not.toMatch(/\.prepare\(\s*(?:`[^`]*(?:INSERT|DELETE|VALUES)|"[^"]*(?:INSERT|DELETE|VALUES))/i);
    expect(statements).toContain("protocolCommitStatements");
    expect(statements).toContain("D1PreparedStatement");
    expect(statements).not.toContain("implements ProtocolStore");
    expect(statements).not.toContain("HandshakeKernel");
  });

  it("keeps protocol modules from importing storage adapters", () => {
    const violations = importViolations(["src/protocol"], [/from\s+["'][^"']*storage(?:\/|["'])/]);

    expect(violations).toEqual([]);
  });

  it("keeps protocol navigation below HTTP transport", () => {
    const text = readFileSync("src/protocol/navigation/index.ts", "utf8");

    expect(
      importsFrom(text).filter((specifier) => specifier.includes("/http") || specifier.startsWith("../http")),
    ).toEqual([]);
  });

  it("keeps the kernel on public area indexes", () => {
    const text = readFileSync("src/protocol/kernel.ts", "utf8");
    const violations = importsFrom(text).filter((specifier) =>
      protocolAreas.some((area) => specifier.startsWith(`./areas/${area}/`) && specifier !== `./areas/${area}/index`),
    );

    expect(violations).toEqual([]);
  });

  it("keeps area-to-area imports on public indexes", () => {
    const violations: string[] = [];
    for (const area of protocolAreas) {
      for (const file of walkTs(join("src/protocol/areas", area))) {
        const localName = relative(join("src/protocol/areas", area), file);
        const text = readFileSync(file, "utf8");
        for (const specifier of importsFrom(text)) {
          for (const otherArea of protocolAreas) {
            if (otherArea === area) continue;
            const isSchemaContractImport =
              ["schemas.ts", "inputs.ts", "types.ts", "index.ts"].includes(localName) &&
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
      for (const file of walkTs(join("src/protocol/areas", area))) {
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
          if (
            specifier === "../../public/schemas" ||
            specifier === "../../public/inputs" ||
            specifier === "./schemas" ||
            specifier === "./inputs"
          ) {
            violations.push(`${relative(process.cwd(), file)} imports ${specifier}`);
          }
        }
      }
    }

    expect(violations.sort()).toEqual([]);
  });

  it("keeps public schemas and inputs as aggregators only", () => {
    const violations = ["src/protocol/public/schemas.ts", "src/protocol/public/inputs.ts"].flatMap((file) => {
      const text = readFileSync(file, "utf8");
      return text
        .split("\n")
        .filter((line) => line.trim() && !line.startsWith("export * from "))
        .map((line) => `${file}: ${line}`);
    });

    expect(violations.sort()).toEqual([]);
  });

  it("keeps protocol internals off public schema and input aggregators", () => {
    const violations: string[] = [];
    for (const file of walkTs("src/protocol")) {
      const rel = relative(process.cwd(), file);
      if (rel === "src/protocol/public/schemas.ts" || rel === "src/protocol/public/inputs.ts") continue;
      for (const specifier of importsFrom(readFileSync(file, "utf8"))) {
        if (specifier === "../../public/schemas" || specifier === "../../public/inputs") {
          violations.push(`${rel} imports ${specifier}`);
        }
      }
    }

    expect(violations.sort()).toEqual([]);
  });

  it("keeps observer and representation helpers off authority behavior imports", () => {
    const violations = importViolations(
      ["src/runtime", "src/protocol/areas/protected-action-representation", "src/protocol/evidence-projections"],
      [
        /from\s+["'][^"']*protocol\/kernel(?:["']|\/)/,
        /from\s+["'][^"']*protocol\/areas\/policy-greenlight\/(?:guards|policy|policy-record|sequence-dependencies|transitions)(?:["']|\/)/,
        /from\s+["'][^"']*protocol\/areas\/gateway-gate\/(?:artifacts|gateway-policy|guards|replay-refusal|transitions)(?:["']|\/)/,
        /from\s+["'][^"']*protocol\/areas\/receipt-export\/transitions(?:["']|\/)/,
        /from\s+["'][^"']*protocol\/areas\/authority-certificate\/(?:signing|transitions)(?:["']|\/)/,
        /from\s+["'][^"']*adapters\/(?:package-install\/gateway|preview-deploy\/gateway|repo-write\/gateway|x402-payment\/wallet-gateway)(?:["']|\/)/,
      ],
    );

    expect(violations).toEqual([]);
  });

  it("keeps runtime ingress family registry proposal-only", () => {
    const registry = readFileSync("src/runtime/ingress/registry.ts", "utf8");

    expect(importsFrom(registry)).toEqual([]);
    expect(registry).toContain(`authorityPosture: "proposal_only"`);
    expect(registry).toContain(`compileInputAuthority: "candidate_only"`);
    expect(registry).toContain(`rawBypassPosture: "bypass_evidence_only"`);
    expect(registry).not.toMatch(
      /gatewayCheck|greenlight|policyDecision|receiptExport|authorityCertificate|signPayment/,
    );
  });

  it("keeps official x402 signer and paid-client imports inside the wallet gateway", () => {
    const allowedOfficialSignerImportFile = "src/adapters/x402-payment/wallet-gateway.ts";
    const forbiddenOutsideGateway = new Set(["@x402/core/client", "@x402/fetch", "@x402/axios"]);
    const violations: string[] = [];

    for (const file of walkTs("src")) {
      const rel = relative(process.cwd(), file);
      if (rel === allowedOfficialSignerImportFile) continue;
      for (const specifier of importsFrom(readFileSync(file, "utf8"))) {
        if (forbiddenOutsideGateway.has(specifier) || specifier.startsWith("@x402/evm")) {
          violations.push(`${rel} imports ${specifier}`);
        }
      }
    }

    expect(violations.sort()).toEqual([]);
  });

  it("keeps vault provider clients and secret retrieval APIs out of foundation protocol surfaces", () => {
    const foundationRoots = ["src/protocol", "src/http", "src/runtime", "src/sdk"];
    const providerImportViolations = importViolations(foundationRoots, [
      /from\s+["'][^"']*(?:infisical|vault)(?:\/|["'])/i,
    ]);
    const retrievalApiViolations: string[] = [];

    for (const file of foundationRoots.flatMap((root) => walkTs(root))) {
      const rel = relative(process.cwd(), file);
      const text = readFileSync(file, "utf8");
      if (/\b(?:getSecret|retrieveSecret|secretPath)\b/.test(text)) {
        retrievalApiViolations.push(rel);
      }
    }

    expect(providerImportViolations).toEqual([]);
    expect(retrievalApiViolations.sort()).toEqual([]);
  });

  it("keeps the official x402 signing factory off adapter barrels and public surfaces", () => {
    const adapterBarrel = readFileSync("src/adapters/x402-payment/index.ts", "utf8");
    const publicSurfaces = [
      "src/index.ts",
      "src/runtime/index.ts",
      "src/conformance/index.ts",
      "src/adapters/x402-payment/index.ts",
      "src/experimental.ts",
    ];

    expect(adapterBarrel).not.toContain("./wallet-gateway");
    for (const surface of publicSurfaces) {
      expect(readFileSync(surface, "utf8")).not.toContain("createOfficialExactX402SigningSurface");
    }
  });

  it("keeps area types faces local-only", () => {
    const violations: string[] = [];
    const allowedLines = new Set([
      `export * from "../../foundation/schema-core";`,
      `export * from "./schemas";`,
      `export * from "./inputs";`,
    ]);
    for (const area of protocolAreas.filter((area) => area !== "object-registry")) {
      const typesPath = join("src/protocol/areas", area, "types.ts");
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
    const text = readFileSync("src/protocol/areas/object-registry/index.ts", "utf8");
    const imports = [...new Set(importsFrom(text))].sort();
    const allowedImports = [
      "../../context/request-context-schemas",
      "../../events/schemas",
      "../action-contract/schemas",
      "../authority-certificate/schemas",
      "../bypass-probe/schemas",
      "../catalog-envelope/schemas",
      "../credential-custody/schemas",
      "../delegated-authority/schemas",
      "../gateway-gate/schemas",
      "../generated-execution-graph/schemas",
      "../idempotency-ledger/schemas",
      "../intent-compilation/schemas",
      "../isolation-breaker/schemas",
      "../negotiation/schemas",
      "../operation-lifecycle/schemas",
      "../policy-greenlight/schemas",
      "../proof-gap/schemas",
      "../protected-path-posture/schemas",
      "../receipt-export/schemas",
      "../recovery/schemas",
      "../refusal/schemas",
      "../review-binding/schemas",
      "../runtime-evidence/schemas",
      "../tool-call-draft/schemas",
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
    const violations = removedCompatibilityShims.filter((file) => existsSync(file));

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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
