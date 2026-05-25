import { spawnSync } from "node:child_process";
import { describe, expect, it } from "bun:test";

const repoRoot = process.cwd();
const path =
  process.env.PATH ??
  "/Users/joelchan/.nvm/versions/node/v22.22.0/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin";

describe("npm maintainer posture", () => {
  it("emits a non-authority local maintainer posture packet", () => {
    const result = spawnSync("/usr/bin/env", ["node", "scripts/check-npm-maintainer-posture.mjs", "--json"], {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, PATH: path },
    });

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    const packet = JSON.parse(result.stdout);
    expect(packet.postureKind).toBe("handshake.npm_maintainer_posture");
    expect(packet.postureVersion).toBe("v1");
    expect(packet.status).toBe("local_ready");
    expect(packet.authorityBoundary).toEqual({
      createsAuthority: false,
      createsPolicyDecision: false,
      createsGreenlight: false,
      performsGatewayCheck: false,
      performsMutation: false,
      publishesPackage: false,
      changesDistTags: false,
      changesPackageSettings: false,
      deprecatesPackage: false,
    });
    expect(packet.remoteReadback.status).toBe("not_requested");
    expect(packet.localChecks.every((check: { status: string }) => check.status === "passed")).toBe(true);
    expect(packet.localChecks.map((check: { id: string }) => check.id)).toEqual(
      expect.arrayContaining([
        "package_identity_bound",
        "release_scripts_bound",
        "pack_check_runs_maintainer_posture",
        "no_install_lifecycle_scripts",
        "package_surface_allowlisted",
        "readme_non_authority_claims_present",
        "runbook_high_activity_posture_present",
      ]),
    );
    expect(packet.manualExternalChecks.map((check: { id: string }) => check.id)).toEqual(
      expect.arrayContaining([
        "npm_account_2fa_or_token_disallow",
        "trusted_publisher_artifact_boundary",
        "long_lived_write_tokens_absent",
        "maintainer_list_minimal",
        "dist_tags_intended",
        "support_intake_monitored",
      ]),
    );
  });
});
