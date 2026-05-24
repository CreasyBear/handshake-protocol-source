import { describe, expect, it } from "bun:test";
import { packageInstallLocalHostFixtureManifest } from "../../src/adapters/package-install/host-harness";
import {
  deriveHostBypassProofPacket,
  HostFixtureManifestSchema,
  projectHostBypassHarnessReport,
  requiredHostHarnessNonClaims,
  type HostBypassProofPacketInput,
  type HostFixtureManifest,
  type HostHarnessPostureState,
} from "../../src/adapters/protected-path-probes";

describe("package-install host-specific bypass harness", () => {
  it("binds a package-manager local host fixture without host-wide claims", () => {
    const manifest = packageInstallLocalHostFixtureManifest();

    expect(manifest).toMatchObject({
      manifestKind: "host_fixture_manifest",
      manifestVersion: "v1",
      host: {
        hostKind: "local_package_manager",
      },
      adapter: {
        adapterId: "adapter_pack_package_install_material",
      },
      action: {
        actionClass: "package.install",
        protectedSurfaceKind: "package_manager",
      },
      expectedPosture: "gateway_checked",
      redaction: {
        sensitiveValuesIncluded: false,
        preservesEnforcementDistinctions: true,
      },
    });
    expect(manifest.protectedPath.rawSiblingCandidates.map((candidate) => candidate.routeId)).toEqual([
      "raw_sibling_npm_install",
      "raw_sibling_pnpm_add",
      "raw_sibling_bun_add",
    ]);
    expect(manifest.nonClaims).toEqual(expect.arrayContaining([...requiredHostHarnessNonClaims]));
    expect(() =>
      HostFixtureManifestSchema.parse({
        ...manifest,
        protectedPath: { ...manifest.protectedPath, rawSiblingCandidates: [] },
      }),
    ).toThrow();
    expect(() =>
      HostFixtureManifestSchema.parse({
        ...manifest,
        nonClaims: manifest.nonClaims.filter((claim) => claim !== "not_host_wide_containment"),
      }),
    ).toThrow("not_host_wide_containment");
  });

  it("derives READY only from fresh wrapper, gateway, greenlight, and raw sibling evidence", () => {
    const packet = deriveHostBypassProofPacket(readyInput());
    const report = projectHostBypassHarnessReport(packet);

    expect(packet).toMatchObject({
      packetKind: "host_specific_bypass_proof_packet",
      postureState: "READY",
      wrapperIntegrity: {
        status: "matched",
      },
      freshness: {
        status: "fresh",
      },
      gatewayBinding: {
        status: "bound",
        gatewayCheckObserved: true,
        oneUseGreenlightObserved: true,
        downstreamExecutionRecordedSeparately: true,
      },
      proofGapReasonCodes: [],
    });
    expect(report).toMatchObject({
      reportKind: "host_bypass_harness_report",
      postureState: "READY",
      wrapperIntegrityStatus: "matched",
      gatewayBindingStatus: "bound",
      probeFreshnessStatus: "fresh",
      authority: {
        reportAuthority: false,
        cliAuthority: false,
        mcpAuthority: false,
        hostWideAuthority: false,
      },
    });
    expect(report.rawSiblingAttempts.map((attempt) => attempt.resultKind)).toEqual(["refused", "detected", "refused"]);
    expect(report.nonClaims).toEqual(expect.arrayContaining([...requiredHostHarnessNonClaims]));
  });

  it("blocks READY when a named raw sibling package-manager path can mutate", () => {
    const packet = deriveHostBypassProofPacket(
      readyInput({
        rawSiblingResults: [
          {
            routeId: "raw_sibling_npm_install",
            resultKind: "mutation_possible",
            probeKind: "raw_sibling_blocking",
            evidenceRefs: ["evidence:host-package-install:raw-npm-mutation-possible"],
            proofGapReasonCodes: [],
          },
        ],
      }),
    );

    expect(packet.postureState).toBe("RAW_SIBLING_MUTATION_POSSIBLE");
    expect(packet.proofGapReasonCodes).toContain("host_raw_sibling_mutation_possible");
    expect(packet.nonClaims).toContain("not_package_manager_ecosystem_protection");
  });

  it("keeps stale, drifted, unbound, advisory, and proof-gap states distinct", () => {
    const manifest = packageInstallLocalHostFixtureManifest();
    const cases: Array<{
      name: string;
      input: HostBypassProofPacketInput;
      expected: HostHarnessPostureState;
      reasonCode: string;
    }> = [
      {
        name: "wrapper missing",
        input: readyInput({ observedResolvedWrapperPath: null, observedWrapperDigest: null }),
        expected: "WRAPPER_MISSING",
        reasonCode: "host_wrapper_missing",
      },
      {
        name: "wrapper drifted",
        input: readyInput({ observedWrapperDigest: `sha256:${"a".repeat(64)}` }),
        expected: "WRAPPER_DRIFTED",
        reasonCode: "host_wrapper_drifted",
      },
      {
        name: "host tool digest changed",
        input: readyInput({ observedHostToolDigest: `sha256:${"b".repeat(64)}` }),
        expected: "HOST_TOOL_DIGEST_CHANGED",
        reasonCode: "host_tool_digest_changed",
      },
      {
        name: "stale probe",
        input: readyInput({
          manifest: {
            ...manifest,
            freshness: { ...manifest.freshness, expiresAt: "2026-05-23T00:00:00.000Z" },
          },
        }),
        expected: "STALE_PROBE",
        reasonCode: "host_fixture_manifest_stale",
      },
      {
        name: "gateway unbound",
        input: readyInput({ gatewayBindingStatus: "unbound" }),
        expected: "GATEWAY_UNBOUND",
        reasonCode: "host_gateway_unbound",
      },
      {
        name: "advisory only",
        input: readyInput({ gatewayBindingStatus: "advisory_only" }),
        expected: "ADVISORY_ONLY",
        reasonCode: "host_probe_advisory_only",
      },
      {
        name: "raw sibling proof gap",
        input: readyInput({
          rawSiblingResults: [
            {
              routeId: "raw_sibling_bun_add",
              resultKind: "proof_gap",
              probeKind: "raw_sibling_blocking",
              evidenceRefs: ["evidence:host-package-install:bun-add-unobserved"],
              proofGapReasonCodes: ["host_bypass_proof_gap"],
            },
          ],
        }),
        expected: "PROOF_GAP",
        reasonCode: "host_bypass_proof_gap",
      },
    ];

    for (const testCase of cases) {
      const packet = deriveHostBypassProofPacket(testCase.input);
      expect(packet.postureState, testCase.name).toBe(testCase.expected);
      expect(packet.proofGapReasonCodes, testCase.name).toContain(testCase.reasonCode);
      expect(projectHostBypassHarnessReport(packet).authority.hostWideAuthority).toBe(false);
    }
  });
});

function readyInput(overrides: Partial<HostBypassProofPacketInput> = {}): HostBypassProofPacketInput {
  const manifest = (overrides.manifest as HostFixtureManifest | undefined) ?? packageInstallLocalHostFixtureManifest();
  const base: HostBypassProofPacketInput = {
    manifest,
    observedAt: manifest.freshness.observedAt,
    observedResolvedWrapperPath: manifest.protectedPath.resolvedWrapperPath,
    observedWrapperDigest: manifest.protectedPath.wrapperDigest,
    observedHostToolDigest: manifest.host.hostToolDigest,
    gatewayBindingStatus: "bound",
    oneUseGreenlightObserved: true,
    gatewayCheckObserved: true,
    downstreamExecutionRecordedSeparately: true,
    rawSiblingResults: manifest.protectedPath.rawSiblingCandidates.map((candidate, index) => ({
      routeId: candidate.routeId,
      resultKind: index === 1 ? "detected" : "refused",
      probeKind: "raw_sibling_blocking",
      evidenceRefs: [`evidence:host-package-install:${candidate.routeId}`],
      proofGapReasonCodes: [],
    })),
    evidenceRefs: ["evidence:host-package-install:wrapped-gateway-check"],
    proofGapReasonCodes: [],
  };
  return { ...base, ...overrides, manifest };
}
