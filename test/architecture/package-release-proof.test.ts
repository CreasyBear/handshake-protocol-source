import { describe, expect, it } from "bun:test";
import packageJson from "../../package.json";
import serverJson from "../../server.json";
import {
  packageReleaseAuthorityBoundary,
  PackageReleaseAuthorityBoundarySchema,
  projectPackageReleaseProof,
  type PackageReleaseProofInput,
} from "../../src/surfaces/release-proof";

describe("package release proof", () => {
  it("separates ready, published, and registry discoverable states", () => {
    const ready = projectPackageReleaseProof(baseReleaseInput());
    expect(ready.releaseState).toBe("ready_to_publish");
    expect(ready.readyToPublish).toBe(true);
    expect(ready.actuallyPublished).toBe(false);
    expect(ready.registryDiscoverable).toBe(false);
    expect(ready.proofGaps.map((gap) => gap.reasonCode)).toEqual([
      "mcp_registry_discoverability_not_verified",
      "mcp_registry_submission_not_accepted",
      "npm_publish_operation_not_performed",
      "post_publish_clean_install_not_verified",
    ]);

    const published = projectPackageReleaseProof(
      baseReleaseInput({
        publishOperationProof: {
          npmPublished: true,
          packageName: packageJson.name,
          packageVersion: packageJson.version,
          publishedAt: "2026-05-24T00:00:00.000Z",
          publishEvidenceRefs: ["evidence:npm-publish:0.2.4"],
        },
        runtimeSmokeProof: {
          ...baseReleaseInput().runtimeSmokeProof,
          cleanInstallSmokePassed: true,
          installedBinsSmokePassed: true,
          installedExportsSmokePassed: true,
        },
      }),
    );
    expect(published.releaseState).toBe("actually_published");
    expect(published.readyToPublish).toBe(true);
    expect(published.actuallyPublished).toBe(true);
    expect(published.registryDiscoverable).toBe(false);

    const discoverable = projectPackageReleaseProof(
      baseReleaseInput({
        publishOperationProof: published.publishOperationProof,
        runtimeSmokeProof: published.runtimeSmokeProof,
        registryDiscoverabilityProof: {
          mcpRegistryAccepted: true,
          discoverabilityChecked: true,
          registryEvidenceRefs: ["evidence:mcp-registry:accepted"],
        },
      }),
    );
    expect(discoverable.releaseState).toBe("registry_discoverable");
    expect(discoverable.proofGaps).toEqual([]);
  });

  it("records account, token, provenance, and namespace gaps as blockers before publish", () => {
    const blocked = projectPackageReleaseProof(
      baseReleaseInput({
        accountNamespaceProof: {
          npmPackageName: packageJson.name,
          packageVersion: packageJson.version,
          npmNamespaceOwnership: "proof_gap",
          mcpNamespaceOwnership: "proof_gap",
          twoFactorPosture: "proof_gap",
          publishTokenPosture: "proof_gap",
          evidenceRefs: ["evidence:account-posture:not-checked"],
        },
        provenanceProof: {
          posture: "proof_gap",
          provenanceAttestationPublished: false,
          evidenceRefs: ["evidence:provenance:not-checked"],
        },
      }),
    );

    expect(blocked.releaseState).toBe("blocked_by_proof_gap");
    expect(blocked.readyToPublish).toBe(false);
    expect(blocked.proofGaps.map((gap) => gap.reasonCode)).toEqual(
      expect.arrayContaining([
        "mcp_namespace_ownership_unverified",
        "npm_namespace_ownership_unverified",
        "npm_provenance_posture_unknown",
        "npm_publish_token_posture_unknown",
        "npm_two_factor_posture_unverified",
      ]),
    );
  });

  it("makes publication authority non-claims structural", () => {
    const proof = projectPackageReleaseProof(baseReleaseInput());

    expect(proof.authorityBoundary).toEqual(packageReleaseAuthorityBoundary);
    expect(Object.values(proof.authorityBoundary).every((value) => value === false)).toBe(true);
    expect(() =>
      PackageReleaseAuthorityBoundarySchema.parse({
        ...packageReleaseAuthorityBoundary,
        performsGatewayCheck: true,
      }),
    ).toThrow();
  });
});

function baseReleaseInput(overrides: Partial<PackageReleaseProofInput> = {}): PackageReleaseProofInput {
  const base: PackageReleaseProofInput = {
    packageName: packageJson.name,
    packageVersion: packageJson.version,
    mcpName: serverJson.name,
    packageShapeProof: {
      packDryRunChecked: true,
      requiredFilesPresent: true,
      forbiddenPathsAbsent: true,
      exportsReviewed: true,
      binShebangsChecked: true,
      cliSmokePassed: true,
      mcpStdioSmokePassed: true,
      metadataSynchronized: true,
      authorityBoundaryChecked: true,
      evidenceRefs: ["evidence:npm-pack-dry-run", "evidence:published-entrypoints-smoke"],
    },
    accountNamespaceProof: {
      npmPackageName: packageJson.name,
      packageVersion: packageJson.version,
      npmNamespaceOwnership: "verified",
      mcpNamespaceOwnership: "verified",
      twoFactorPosture: "verified",
      publishTokenPosture: "trusted_publishing_preferred",
      evidenceRefs: ["evidence:account-namespace:verified"],
    },
    publishOperationProof: {
      npmPublished: false,
      packageName: packageJson.name,
      packageVersion: packageJson.version,
      publishedAt: null,
      publishEvidenceRefs: [],
    },
    provenanceProof: {
      posture: "trusted_publishing_configured",
      provenanceAttestationPublished: false,
      evidenceRefs: ["evidence:trusted-publishing:configured"],
    },
    registryDiscoverabilityProof: {
      mcpRegistryAccepted: false,
      discoverabilityChecked: false,
      registryEvidenceRefs: [],
    },
    runtimeSmokeProof: {
      localPackSmokePassed: true,
      cleanInstallSmokePassed: false,
      installedBinsSmokePassed: false,
      installedExportsSmokePassed: false,
      proposalEvidenceReadOnlySmokePassed: true,
      evidenceRefs: ["evidence:local-pack-smoke"],
    },
    proofGaps: [],
  };
  return { ...base, ...overrides };
}
