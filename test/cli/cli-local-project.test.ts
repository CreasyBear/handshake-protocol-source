import { describe, expect, it } from "bun:test";
import { chmod, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runCliCommand } from "../../src/cli/main";
import { cliRoleNames, localProjectConfigRef, type LocalProjectConfig } from "../../src/cli/local-project";

describe("CLI local project readiness", () => {
  it("initializes non-secret project pointers and external role credential placeholders", async () => {
    const { workspace, stateRoot } = await tempProject();
    const output = await runCliCommand([
      "init",
      "--cwd",
      workspace,
      "--state-root",
      stateRoot,
      "--project-id",
      "proj_cli_test",
    ]);

    expect(output).toMatchObject({
      schemaVersion: "handshake.cli.v1",
      command: "init",
      plane: "operator",
      ok: true,
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
      credentialMaterialIncluded: false,
      mutationCommandIncluded: false,
      reasonCodes: [],
      nextAction: "run_doctor",
      retryability: "not_retryable",
      commitState: "not_applicable",
      redactionProfileRef: "cli-local-project:v1-redacted",
      result: {
        projectId: "proj_cli_test",
        workspaceRef: workspace,
        stateRootRef: stateRoot,
        roleCredentialValuesCreatedByCli: false,
        roleCredentialProvisioningRequired: cliRoleNames,
        secretMaterialPrinted: false,
      },
    });

    const config = await readConfig(workspace);
    expect(config.projectId).toBe("proj_cli_test");
    expect(config.stateRootRef.startsWith(workspace)).toBe(false);
    expect("roleTokenRefs" in config).toBe(false);
    expect(JSON.stringify(config)).not.toContain("hs.control_plane.");
    const profile = await readCredentialProfile(config);
    expect(profile.credentialValuesCreatedByCli).toBe(false);
    expect(new Set(Object.values(profile.roleCredentialRefs)).size).toBe(cliRoleNames.length);
    for (const role of cliRoleNames) {
      expect(profile.roleCredentialRefs[role].startsWith(workspace)).toBe(false);
      await expect(readFile(profile.roleCredentialRefs[role], "utf8")).rejects.toThrow();
    }
  });

  it("doctor fails closed on missing install/gateway posture without exposing secrets", async () => {
    const { workspace, stateRoot } = await tempProject();
    await runCliCommand(["init", "--cwd", workspace, "--state-root", stateRoot, "--project-id", "proj_cli_doctor"]);

    const output = await runCliCommand(["doctor", "--cwd", workspace]);

    expect(output).toMatchObject({
      command: "doctor",
      ok: false,
      authorityCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
      credentialMaterialIncluded: false,
      reasonCodes: ["cli_gateway_posture_unknown", "cli_install_not_configured", "cli_token_ref_missing"],
      nextAction: "fix_install",
      retryability: "retryable_after_fix",
      redactionProfileRef: "cli-local-project:v1-redacted",
      result: {
        status: "not_ready",
        projectId: "proj_cli_doctor",
      },
    });
    expect((output as { result: { reasonCodes: string[] } }).result.reasonCodes).toEqual([
      "cli_gateway_posture_unknown",
      "cli_install_not_configured",
      "cli_token_ref_missing",
    ]);
    expect(JSON.stringify(output)).not.toContain("hs.control_plane.");
    expect(JSON.stringify(output)).not.toContain(".token");
    expect(JSON.stringify(output)).not.toContain("gatewayCheckInput");
  });

  it("doctor reports unsafe token storage instead of smoothing readiness", async () => {
    const { workspace, stateRoot } = await tempProject();
    await runCliCommand(["init", "--cwd", workspace, "--state-root", stateRoot, "--project-id", "proj_cli_unsafe"]);
    const config = await readConfig(workspace);
    const profile = await readCredentialProfile(config);
    await mkdir(dirname(profile.roleCredentialRefs.control_plane), { recursive: true });
    await writeFile(profile.roleCredentialRefs.control_plane, "externally-provisioned-control-token\n");
    await chmod(profile.roleCredentialRefs.control_plane, 0o644);

    const output = await runCliCommand(["doctor", "--cwd", workspace]);

    expect(output).toMatchObject({
      command: "doctor",
      ok: false,
      result: {
        status: "not_ready",
      },
    });
    expect((output as { result: { reasonCodes: string[] } }).result.reasonCodes).toContain(
      "cli_token_ref_permissions_unsafe",
    );
  });
});

async function tempProject(): Promise<{ workspace: string; stateRoot: string }> {
  const root = await mkdtemp(join(tmpdir(), "handshake-cli-local-"));
  return {
    workspace: join(root, "workspace"),
    stateRoot: join(root, "state"),
  };
}

async function readConfig(workspace: string): Promise<LocalProjectConfig> {
  return JSON.parse(await readFile(localProjectConfigRef(workspace), "utf8")) as LocalProjectConfig;
}

async function readCredentialProfile(config: LocalProjectConfig): Promise<{
  credentialValuesCreatedByCli: false;
  roleCredentialRefs: Record<(typeof cliRoleNames)[number], string>;
}> {
  return JSON.parse(await readFile(config.roleCredentialProfileRef ?? "", "utf8")) as {
    credentialValuesCreatedByCli: false;
    roleCredentialRefs: Record<(typeof cliRoleNames)[number], string>;
  };
}
