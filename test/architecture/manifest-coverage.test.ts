import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import packageJson from "../../package.json";
import {
  surfaceBoundaryManifest,
  type SurfaceBoundary,
  type SurfaceId,
} from "../../src/surfaces/boundary-manifest";

type PackageJson = {
  exports: Record<string, unknown>;
};

const pkg = packageJson as PackageJson;

const exportToManifestExpectation: Record<
  string,
  { readonly surfaceId: SurfaceId; readonly sourcePathPrefix: string }
> = {
  "./hosted-admission": {
    surfaceId: "surfaces.hosted_admission",
    sourcePathPrefix: "src/hosted-admission",
  },
  "./surfaces/service-workflow-admission": {
    surfaceId: "surfaces.service_workflow_admission",
    sourcePathPrefix: "src/surfaces/service-workflow-admission",
  },
  "./surfaces/a2a-negotiation-readback": {
    surfaceId: "surfaces.a2a_readback",
    sourcePathPrefix: "src/surfaces/a2a-negotiation-readback",
  },
  "./mcp": { surfaceId: "mcp.runtime", sourcePathPrefix: "src/mcp" },
  "./x402-protected-tool": {
    surfaceId: "x402.protected_tool",
    sourcePathPrefix: "src/x402-protected-tool",
  },
};

const cliHandlerImplementationFiles = [
  "src/cli/aps-report.ts",
  "src/cli/certificate.ts",
  "src/cli/host/doctor.ts",
  "src/cli/mcp/doctor.ts",
  "src/cli/quality/report.ts",
  "src/cli/state/inspect.ts",
  "src/cli/quickstart/x402.ts",
  "src/cli/simulate/x402-payment.ts",
  "src/cli/demo/x402.ts",
  "src/cli/local-project/doctor.ts",
  "src/cli/local-project/index.ts",
  "src/cli/projection-evidence.ts",
  "src/cli/support-bundle.ts",
  "src/cli/x402/index.ts",
  "src/cli/x402/local-state.ts",
  "src/cli/evidence/operation-readback-view.ts",
] as const;

const cliManifestAllowlist = new Set([
  "src/cli/command-manifest.ts",
  "src/cli/main.ts",
  "src/cli/output.ts",
  "src/cli/index.ts",
]);

function flattenManifestSourceRoots(): string[] {
  return Object.values(surfaceBoundaryManifest).flatMap((boundary) => boundary.sourceRoots);
}

export function assertExportManifestCoverage(
  exports: Record<string, { sourcePathPrefix: string; surfaceId: SurfaceId }>,
): void {
  const violations: string[] = [];
  for (const [exportPath, expectation] of Object.entries(exports)) {
    const boundary = surfaceBoundaryManifest[expectation.surfaceId];
    if (!boundary) {
      violations.push(`missing manifest surface ${expectation.surfaceId} for export ${exportPath}`);
      continue;
    }
    const covered = boundary.sourceRoots.some((root) => pathCoversRoot(expectation.sourcePathPrefix, root));
    if (!covered) {
      violations.push(
        `export ${exportPath} maps to ${expectation.sourcePathPrefix} but ${expectation.surfaceId} sourceRoots do not cover it`,
      );
    }
  }
  if (violations.length > 0) {
    throw new Error(`manifest export coverage failed:\n${violations.join("\n")}`);
  }
}

export function assertCliHandlerManifestCoverage(handlerFiles: readonly string[]): void {
  const violations: string[] = [];
  for (const file of handlerFiles) {
    if (cliManifestAllowlist.has(file)) continue;
    if (!isPathCoveredByManifestSourceRoots(file)) {
      violations.push(`${file} is not under any manifest sourceRoots entry`);
    }
  }
  if (violations.length > 0) {
    throw new Error(`manifest CLI handler coverage failed:\n${violations.join("\n")}`);
  }
}

function isPathCoveredByManifestSourceRoots(filePath: string): boolean {
  const normalized = filePath.replaceAll("\\", "/");
  return flattenManifestSourceRoots().some((root) => pathCoversRoot(normalized, root));
}

function pathCoversRoot(targetPath: string, root: string): boolean {
  const normalizedRoot = root.replaceAll("\\", "/");
  const normalizedTarget = targetPath.replaceAll("\\", "/");
  if (normalizedRoot.endsWith(".ts")) return normalizedTarget === normalizedRoot;
  if (!existsSync(normalizedRoot)) return false;
  const stat = statSync(normalizedRoot);
  if (stat.isFile()) return normalizedTarget === normalizedRoot;
  return normalizedTarget === normalizedRoot || normalizedTarget.startsWith(`${normalizedRoot}/`);
}

function boundaryCoversSourcePrefix(boundary: SurfaceBoundary, prefix: string): boolean {
  return boundary.sourceRoots.some((root) => pathCoversRoot(prefix, root));
}

describe("manifest coverage", () => {
  it("maps each product surface export to a manifest surface with matching sourceRoots", () => {
    const violations: string[] = [];
    for (const [exportPath, expectation] of Object.entries(exportToManifestExpectation)) {
      if (!(exportPath in pkg.exports)) {
        violations.push(`package.json missing expected export ${exportPath}`);
        continue;
      }
      const boundary = surfaceBoundaryManifest[expectation.surfaceId];
      if (!boundary) {
        violations.push(`missing manifest entry ${expectation.surfaceId} for ${exportPath}`);
        continue;
      }
      if (!boundaryCoversSourcePrefix(boundary, expectation.sourcePathPrefix)) {
        violations.push(
          `${exportPath} requires ${expectation.sourcePathPrefix} covered by ${expectation.surfaceId} sourceRoots`,
        );
      }
    }
    expect(violations.sort()).toEqual([]);
  });

  it("maps ./cli export to combined cli.operator, cli.evidence, and cli.process roots", () => {
    expect("./cli" in pkg.exports).toBe(true);
    const cliBoundaries = ["cli.operator", "cli.evidence", "cli.process"] as const;
    const coversCliTree = (prefix: string): boolean =>
      cliBoundaries.some((id) => boundaryCoversSourcePrefix(surfaceBoundaryManifest[id], prefix));
    expect(coversCliTree("src/cli/main.ts")).toBe(true);
    expect(coversCliTree("src/cli/host/doctor.ts")).toBe(true);
    expect(coversCliTree("src/cli/quality/report.ts")).toBe(true);
  });

  it("requires each CLI handler implementation file to sit under a manifest sourceRoots path", () => {
    const violations: string[] = [];
    for (const file of cliHandlerImplementationFiles) {
      if (cliManifestAllowlist.has(file)) continue;
      if (!isPathCoveredByManifestSourceRoots(file)) {
        violations.push(file);
      }
    }
    expect(violations.sort()).toEqual([]);
  });

  it("rejects manifest-only src/cli/ roots without per-file coverage (D-07)", () => {
    const violations: string[] = [];
    for (const boundary of Object.values(surfaceBoundaryManifest)) {
      if (!boundary.id.startsWith("cli.")) continue;
      for (const root of boundary.sourceRoots) {
        const sourceRoot = String(root);
        if (sourceRoot === "src/cli" || sourceRoot === "src/cli/") {
          violations.push(`${boundary.id} uses directory-wide src/cli root`);
        }
      }
    }
    expect(violations.sort()).toEqual([]);
  });

  it("detects synthetic exports missing manifest mapping (negative drift proof)", () => {
    expect(() =>
      assertExportManifestCoverage({
        "./surfaces/__manifest_drift_probe__": {
          surfaceId: "surfaces.a2a_readback",
          sourcePathPrefix: "src/surfaces/__manifest_drift_probe__",
        },
      }),
    ).toThrow(/manifest export coverage failed/);
  });

  it("detects synthetic CLI handlers outside manifest roots (negative drift proof)", () => {
    expect(() => assertCliHandlerManifestCoverage(["src/cli/__manifest_drift_probe__.ts"])).toThrow(
      /manifest CLI handler coverage failed/,
    );
  });
});
