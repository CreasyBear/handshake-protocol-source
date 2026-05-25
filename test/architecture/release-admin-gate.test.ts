import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

  it("documents the release admin state machine in internal canon", () => {
    const runbook = readFileSync("docs/internal/release-admin-runbook.md", "utf8");
    const decisions = readFileSync("docs/internal/decisions.md", "utf8");
    const structure = readFileSync("STRUCTURE.md", "utf8");

    expect(structure).toContain("docs/internal/release-admin-runbook.md");
    expect(decisions).toContain("docs/internal/release-admin-runbook.md");
    expect(runbook).toContain("Release administration must prove the source-to-artifact boundary");
    expect(runbook).toContain("npm run release:admin:check");
    expect(runbook).toContain("npm run release:admin:check:remote");
    expect(runbook).toContain("First-Time npm Maintainer Practices");
    expect(runbook).toContain("Treat npm download counts as distribution noise");
    expect(runbook).toContain("Promote to `latest` only after registry readback");
    expect(runbook).toContain("two-factor authentication, token restrictions, minimal");
    expect(runbook).toContain("prefer a deprecation warning plus a fixed patch release");
    expect(runbook).toContain("Three-Month High-Activity Readiness");
    expect(runbook).toContain("Only levels 3 through 6 count as adoption evidence");
    expect(runbook).toContain("no install-time telemetry, phone-home behavior");
    expect(runbook).toContain("Support intake should classify every public report");
    expect(runbook).toContain("Do not answer support pressure");
    expect(runbook).toContain("npm Maintainer Posture Command");
    expect(runbook).toContain("npm run release:npm:posture");
    expect(runbook).toContain("npm run release:npm:posture:remote");
    expect(runbook).toContain("manual external checks");
    expect(runbook).toContain("Forbidden Shortcuts");
    expect(runbook).toContain("Do not treat a local green gate as release proof");
    expect(runbook).toContain("do not patch only the observed CI symptom");
    expect(runbook).not.toContain("npm publish --provenance");
  });
});
