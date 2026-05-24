import { HostFixtureManifestSchema, type HostFixtureManifest } from "../protected-path-probes";

const packageInstallHostToolDigest = `sha256:${"1".repeat(64)}` as const;
const packageInstallWrapperDigest = `sha256:${"2".repeat(64)}` as const;
const packageInstallToolListDigest = `sha256:${"3".repeat(64)}` as const;
const packageInstallGatewayRegistryDigest = `sha256:${"4".repeat(64)}` as const;
const packageInstallPolicyDigest = `sha256:${"5".repeat(64)}` as const;

export function packageInstallLocalHostFixtureManifest(): HostFixtureManifest {
  return HostFixtureManifestSchema.parse({
    manifestKind: "host_fixture_manifest",
    manifestVersion: "v1",
    manifestId: "host_fixture_package_install_local_v1",
    host: {
      hostId: "host_local_package_manager",
      hostKind: "local_package_manager",
      hostVersionRef: "host:local-package-manager@v1",
      hostToolDigest: packageInstallHostToolDigest,
    },
    environment: {
      environmentId: "env_local_dev_package_install",
      environmentKind: "local_dev",
      environmentRef: "environment:local-dev:package-install",
    },
    adapter: {
      adapterId: "adapter_pack_package_install_material",
      adapterVersion: "v1",
    },
    action: {
      actionClass: "package.install",
      protectedSurfaceKind: "package_manager",
      resourceRef: "package:hono",
    },
    protectedPath: {
      protectedPathId: "protected_path_package_install_hono_local",
      configuredWrapperPath: "/usr/local/bin/handshake-package-install",
      resolvedWrapperPath: "/usr/local/bin/handshake-package-install",
      wrapperDigest: packageInstallWrapperDigest,
      toolListDigest: packageInstallToolListDigest,
      rawSiblingCandidates: [
        {
          routeId: "raw_sibling_npm_install",
          displayName: "npm install hono",
          invocationKind: "package_manager_binary",
          commandRef: "npm install hono@^4.12.19",
          expectedOutcome: "refused_or_detected",
        },
        {
          routeId: "raw_sibling_pnpm_add",
          displayName: "pnpm add hono",
          invocationKind: "package_manager_binary",
          commandRef: "pnpm add hono@^4.12.19",
          expectedOutcome: "refused_or_detected",
        },
        {
          routeId: "raw_sibling_bun_add",
          displayName: "bun add hono",
          invocationKind: "package_manager_binary",
          commandRef: "bun add hono@^4.12.19",
          expectedOutcome: "refused_or_detected",
        },
      ],
    },
    registry: {
      gatewayRegistryEntryId: "gateway_registry_package_install",
      gatewayId: "gateway_package_install_local",
      gatewayRegistryDigest: packageInstallGatewayRegistryDigest,
    },
    policy: {
      policyRef: "policy:package-install-material:v1",
      policyDigest: packageInstallPolicyDigest,
    },
    freshness: {
      observedAt: "2026-05-24T00:00:00.000Z",
      expiresAt: "2099-01-01T00:00:00.000Z",
      maxAgeMs: 300000,
    },
    expectedPosture: "gateway_checked",
    redaction: {
      redactionPolicyRef: "redaction:host-bypass-proof:v1",
      sensitiveValuesIncluded: false,
      preservesEnforcementDistinctions: true,
    },
    nonClaims: [
      "not_host_wide_containment",
      "not_package_manager_ecosystem_protection",
      "not_cli_mcp_browser_shell_network_protection",
      "not_package_safety",
      "not_x402_ecosystem_coverage",
      "not_report_enforcement",
    ],
  });
}
