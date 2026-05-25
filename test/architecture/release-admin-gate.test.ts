import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "bun:test";

const repoRoot = process.cwd();

describe("release admin gate", () => {
  it("defines an ordered non-publishing gate from clean source to artifact smoke", () => {
    const artifactOut = join(tmpdir(), "handshake-release-admin-dry-run");
    const path =
      process.env.PATH ??
      "/Users/joelchan/.nvm/versions/node/v22.22.0/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin";
    const result = spawnSync(
      "/usr/bin/env",
      ["node", "scripts/check-release-admin.js", "--dry-run", "--json", "--artifact-out", artifactOut],
      {
        cwd: repoRoot,
        encoding: "utf8",
        env: { ...process.env, PATH: path },
      },
    );

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    const plan = JSON.parse(result.stdout);
    expect(plan.gateKind).toBe("handshake.release_admin_gate");
    expect(plan.gateVersion).toBe("v1");
    expect(plan.authorityBoundary).toEqual({
      createsAuthority: false,
      createsPolicyDecision: false,
      createsGreenlight: false,
      performsGatewayCheck: false,
      performsMutation: false,
      publishesPackage: false,
      createsGitHubRelease: false,
      changesRepositoryMetadata: false,
    });
    expect(plan.stages.map((stage: { id: string }) => stage.id)).toEqual([
      "source.clean_worktree",
      "source.clean_clone",
      "source.install_dependencies",
      "source.repo_gate",
      "artifact.project",
      "artifact.boundary",
      "artifact.smoke_imports",
      "artifact.smoke_cli",
      "remote.readback",
    ]);
    expect(plan.stages.find((stage: { id: string }) => stage.id === "remote.readback").enabled).toBe(false);
  });

  it("keeps release admin separate from publish and metadata mutation", () => {
    const script = readFileSync("scripts/check-release-admin.js", "utf8");

    expect(script).toContain('"check:repo"');
    expect(script).toContain("scripts/project-release-repository.js");
    expect(script).toContain("smoke:imports");
    expect(script).toContain("smoke:cli");
    expect(script).toContain("remote.readback");
    expect(script).not.toContain("npm publish");
    expect(script).not.toContain("workflow_dispatch");
    expect(script).not.toContain("/releases");
    expect(script).not.toContain("PATCH");
  });
});
