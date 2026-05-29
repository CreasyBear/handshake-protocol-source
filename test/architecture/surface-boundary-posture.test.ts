import { describe, expect, it } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize, relative } from "node:path";
import {
  surfaceBoundaryManifest,
  surfaceBoundaryManifestVersion,
  surfaceIds,
  surfaceNonAuthorityFlags,
  type SurfaceBoundary,
  type SurfaceId,
  type SurfaceRouteFamily,
} from "../../src/surfaces/boundary-manifest";

const expectedSurfaceIds: readonly SurfaceId[] = [
  "sdk.runtime",
  "sdk.evidence",
  "sdk.control_plane",
  "sdk.policy",
  "sdk.adapter",
  "sdk.install",
  "sdk.gateway",
  "cli.operator",
  "cli.evidence",
  "cli.process",
  "mcp.runtime",
  "x402.protected_tool",
  "surfaces.a2a_negotiation",
  "surfaces.a2a_readback",
  "surfaces.service_workflow_admission",
  "surfaces.hosted_admission",
];

const authorityRouteFamilies: readonly SurfaceRouteFamily[] = [
  "certificate_mint_write",
  "isolation_write",
  "policy_decision_write",
  "raw_record_read",
  "receipt_export_write",
  "recovery_write",
];

const modelOrOperatorSurfaces: readonly SurfaceId[] = [
  "sdk.runtime",
  "sdk.evidence",
  "sdk.control_plane",
  "sdk.adapter",
  "sdk.install",
  "cli.operator",
  "cli.evidence",
  "cli.process",
  "mcp.runtime",
  "x402.protected_tool",
  "surfaces.a2a_negotiation",
  "surfaces.a2a_readback",
  "surfaces.service_workflow_admission",
  "surfaces.hosted_admission",
];

const roleScopedTransitionClients: readonly SurfaceId[] = ["sdk.policy"];

describe("surface boundary posture", () => {
  it("defines one complete manifest entry for each planned product surface", () => {
    expect(surfaceBoundaryManifestVersion).toBe("surface-boundary.v0.1");
    expect([...surfaceIds]).toEqual([...expectedSurfaceIds]);
    expect(Object.keys(surfaceBoundaryManifest).sort()).toEqual([...expectedSurfaceIds].sort());

    const violations: string[] = [];
    for (const id of expectedSurfaceIds) {
      const boundary = boundaryFor(id);
      if (boundary.id !== id) violations.push(`${id} has mismatched id ${boundary.id}`);
      if (boundary.allowedRouteFamilies.length === 0) violations.push(`${id} has no allowed route families`);
      if (boundary.forbiddenRouteFamilies.length === 0) violations.push(`${id} has no forbidden route families`);
      if (boundary.forbiddenCredentialShapes.length === 0) violations.push(`${id} has no forbidden credentials`);
      if (boundary.forbiddenOutputFields.length === 0) violations.push(`${id} has no forbidden output fields`);
      if (boundary.claimBoundaryLabels.length === 0) violations.push(`${id} has no claim-boundary labels`);
      if (boundary.sourceRoots.length === 0) violations.push(`${id} has no source roots`);
    }

    expect(violations.sort()).toEqual([]);
  });

  it("keeps model-facing and operator-facing surfaces away from authority route families", () => {
    const violations: string[] = [];
    for (const id of modelOrOperatorSurfaces) {
      const boundary = boundaryFor(id);
      for (const family of authorityRouteFamilies) {
        if (boundary.allowedRouteFamilies.includes(family)) {
          violations.push(`${id} allows ${family}`);
        }
        if (!boundary.forbiddenRouteFamilies.includes(family)) {
          violations.push(`${id} does not forbid ${family}`);
        }
      }
    }

    expect(violations.sort()).toEqual([]);
  });

  it("keeps role-scoped transition clients narrow and named without making them product authority surfaces", () => {
    const violations: string[] = [];
    for (const id of roleScopedTransitionClients) {
      const boundary = boundaryFor(id);
      if (boundary.authorityPosture !== "policy_transition_transport") {
        violations.push(`${id} is not marked as policy transition transport`);
      }
      if (!boundary.allowedRouteFamilies.includes("policy_decision_write")) {
        violations.push(`${id} cannot write policy decisions`);
      }
      for (const family of ["gateway_check_write", "receipt_export_write", "certificate_mint_write"] as const) {
        if (boundary.allowedRouteFamilies.includes(family)) violations.push(`${id} allows ${family}`);
        if (!boundary.forbiddenRouteFamilies.includes(family)) violations.push(`${id} does not forbid ${family}`);
      }
      if (boundary.claimBoundaryLabels.includes("runtime_evidence_is_not_authority")) {
        violations.push(`${id} is mislabeled as runtime proposal surface`);
      }
      if (!boundary.claimBoundaryLabels.includes("policy_transition_transport_is_not_gateway_execution")) {
        violations.push(`${id} does not say policy transition transport is not gateway execution`);
      }
    }

    expect(JSON.stringify(surfaceBoundaryManifest)).not.toContain("policy_authority");
    expect(violations.sort()).toEqual([]);
  });

  it("requires proposal and evidence outputs to carry explicit non-authority flags", () => {
    const violations: string[] = [];
    for (const id of modelOrOperatorSurfaces) {
      const flags = boundaryFor(id).requiredNonAuthorityFlags;
      for (const flag of surfaceNonAuthorityFlags) {
        if (flags[flag] !== false) violations.push(`${id} does not require ${flag}: false`);
      }
    }

    expect(violations.sort()).toEqual([]);
  });

  it("keeps role maps, fallback tokens, signer material, and raw records out of exposed surface shapes", () => {
    const requiredForbiddenCredentials = ["allRoles", "CallerAuthTokens", "transitionTokens"];
    const requiredForbiddenOutputs = [
      "PaymentPayload",
      "PAYMENT-SIGNATURE",
      "rawCredentialMaterial",
      "rawInternalRecord",
    ];
    const violations: string[] = [];

    for (const id of expectedSurfaceIds) {
      const boundary = boundaryFor(id);
      for (const credential of requiredForbiddenCredentials) {
        if (!boundary.forbiddenCredentialShapes.includes(credential)) {
          violations.push(`${id} does not forbid credential shape ${credential}`);
        }
      }
      for (const output of requiredForbiddenOutputs) {
        if (!boundary.forbiddenOutputFields.includes(output)) {
          violations.push(`${id} does not forbid output field ${output}`);
        }
      }
    }

    expect(violations.sort()).toEqual([]);
  });

  it("keeps claim-boundary labels explicit on every surface", () => {
    const requiredLabels = ["no_hosted_operation", "no_provider_custody", "no_cross_org_trust"];
    const violations: string[] = [];

    for (const id of expectedSurfaceIds) {
      const labels = boundaryFor(id).claimBoundaryLabels;
      for (const label of requiredLabels) {
        if (!labels.includes(label)) violations.push(`${id} lacks ${label}`);
      }
    }

    expect(violations.sort()).toEqual([]);
  });

  it("enforces forbidden imports for existing surface implementation roots", () => {
    const violations: string[] = [];

    for (const id of expectedSurfaceIds) {
      const boundary = boundaryFor(id);
      for (const file of existingSurfaceFiles(boundary)) {
        const text = readFileSync(file, "utf8");
        for (const specifier of importsFrom(text)) {
          const normalizedSpecifier = specifier.replaceAll("\\", "/");
          for (const fragment of boundary.forbiddenImportFragments) {
            if (normalizedSpecifier.includes(fragment)) {
              violations.push(`${relative(process.cwd(), file)} imports ${specifier} for ${id}`);
            }
          }
        }
      }
    }

    expect(violations.sort()).toEqual([]);
  });

  it("enforces allowed internal import roots for existing surface implementation roots", () => {
    const violations: string[] = [];

    for (const id of expectedSurfaceIds) {
      const boundary = boundaryFor(id);
      for (const file of existingSurfaceFiles(boundary)) {
        const text = readFileSync(file, "utf8");
        for (const specifier of importsFrom(text)) {
          const target = internalImportTarget(file, specifier);
          if (!target) continue;
          if (!isAllowedInternalImport(boundary, target)) {
            violations.push(`${relative(process.cwd(), file)} imports ${specifier} for ${id} outside allowed roots`);
          }
        }
      }
    }

    expect(violations.sort()).toEqual([]);
  });

  it("keeps forbidden credential and output shapes out of existing surface source roots", () => {
    const violations: string[] = [];

    for (const id of expectedSurfaceIds) {
      const boundary = boundaryFor(id);
      for (const file of existingSurfaceFiles(boundary)) {
        const text = stripRequiredNonAuthorityFlagMentions(readFileSync(file, "utf8"), boundary);
        for (const credential of boundary.forbiddenCredentialShapes) {
          if (text.includes(credential))
            violations.push(`${relative(process.cwd(), file)} mentions ${credential} for ${id}`);
        }
        for (const outputField of boundary.forbiddenOutputFields) {
          if (text.includes(outputField))
            violations.push(`${relative(process.cwd(), file)} mentions ${outputField} for ${id}`);
        }
      }
    }

    expect(violations.sort()).toEqual([]);
  });

  it("keeps the surface manifest internal to source and off root exports", async () => {
    const root = await import("../../src");

    expect(Object.keys(root)).not.toContain("surfaceBoundaryManifest");
    expect(Object.keys(root)).not.toContain("surfaceIds");
  });
});

function boundaryFor(id: SurfaceId): SurfaceBoundary {
  return surfaceBoundaryManifest[id];
}

function existingSurfaceFiles(boundary: SurfaceBoundary): string[] {
  return boundary.sourceRoots.flatMap((root) => {
    if (!existsSync(root)) return [];
    const stat = statSync(root);
    if (stat.isFile()) return root.endsWith(".ts") ? [root] : [];
    return walkTs(root);
  });
}

function importsFrom(text: string): string[] {
  return [...text.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1] ?? "");
}

function internalImportTarget(file: string, specifier: string): string | null {
  if (!specifier.startsWith(".") && !specifier.startsWith("src/")) return null;
  const target = specifier.startsWith(".") ? normalize(join(dirname(file), specifier)) : normalize(specifier);
  return target.replaceAll("\\", "/");
}

function isAllowedInternalImport(boundary: SurfaceBoundary, target: string): boolean {
  return boundary.allowedImportRoots.some((root) => target === root || target.startsWith(`${root}/`));
}

const evidenceOnlySchemaNegativeMentions = [
  "PaymentPayload",
  "credentialMaterialIncluded",
  "downstreamSuccessClaimedByAgreement",
  "gatewayCheckRemainsFinalEnforcementPoint",
  "greenlightId",
  "paymentMaterialIncluded",
  "proof_gap:a2a_raw_material:signer_material",
  "rawCredentialMaterial",
  "receiptExport",
  "signerMaterialIncluded",
  "signerMaterialObserved",
  "signer_use",
] as const;

function stripRequiredNonAuthorityFlagMentions(text: string, boundary: SurfaceBoundary): string {
  const withoutManifestFlags = Object.keys(boundary.requiredNonAuthorityFlags).reduce(
    (current, flag) => current.replaceAll(flag, ""),
    text,
  );
  if (boundary.authorityPosture !== "evidence_only" && boundary.authorityPosture !== "proposal_only") {
    return withoutManifestFlags;
  }
  return evidenceOnlySchemaNegativeMentions.reduce(
    (current, term) => current.replaceAll(term, ""),
    withoutManifestFlags,
  );
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
