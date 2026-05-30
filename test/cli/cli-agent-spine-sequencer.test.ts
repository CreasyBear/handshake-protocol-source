import { describe, expect, it } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runAgentSpineQuickstart } from "../../src/cli/quickstart/agent-spine";
import { runX402Quickstart } from "../../src/cli/quickstart/x402";
import { simulateX402PaymentCommand } from "../../src/cli/simulate/x402-payment";
import { runCliCommand } from "../../src/cli/main";

describe("quickstart agent-spine sequencer", () => {
  it("keeps every step non-authority and forbids bundled execute claims", async () => {
    const { workspace, stateRoot } = await localProject("agent-spine");
    await runCliCommand(["init", "--cwd", workspace, "--state-root", stateRoot, "--project-id", "proj_agent_spine"]);
    const output = await runAgentSpineQuickstart({ cwd: workspace });

    expect(output).toMatchObject({
      command: "quickstart agent-spine",
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    });
    expect(output.nonClaims).toEqual(
      expect.arrayContaining(["bundled execute API", "greenlight reuse", "live wallet mutation"]),
    );

    const steps = (output.result as { steps: Array<Record<string, unknown>> }).steps;
    expect(steps.length).toBeGreaterThanOrEqual(1);
    for (const step of steps) {
      expect(step).toMatchObject({
        authorityCreated: false,
        greenlightCreated: false,
        gatewayCheckPerformed: false,
        mutationAttempted: false,
      });
    }
  });

  it("keeps delegated quickstart and simulate commands non-authority", async () => {
    const { workspace, stateRoot } = await localProject("agent-spine-delegates");
    await runCliCommand([
      "init",
      "--cwd",
      workspace,
      "--state-root",
      stateRoot,
      "--project-id",
      "proj_agent_spine_delegates",
    ]);
    const quickstart = await runX402Quickstart({ cwd: workspace });
    const simulate = await simulateX402PaymentCommand({ cwd: workspace });
    for (const output of [quickstart, simulate]) {
      expect(output).toMatchObject({
        authorityCreated: false,
        greenlightCreated: false,
        gatewayCheckPerformed: false,
        mutationAttempted: false,
      });
    }
    expect(simulate.warnings.join(" ")).toContain("non-authority");
  });

  it("does not run later steps when host doctor fails", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "handshake-agent-spine-"));
    const output = await runAgentSpineQuickstart({ cwd: workspace });

    expect(output.ok).toBe(false);
    const steps = (output.result as { steps: Array<{ stepId: string; ok: boolean }> }).steps;
    expect(steps).toHaveLength(1);
    expect(steps[0]?.stepId).toBe("host_doctor");
    expect(steps[0]?.ok).toBe(false);
  });

  it("routes through CLI manifest alias", async () => {
    const { workspace, stateRoot } = await localProject("agent-spine-cli");
    await runCliCommand([
      "init",
      "--cwd",
      workspace,
      "--state-root",
      stateRoot,
      "--project-id",
      "proj_agent_spine_cli",
    ]);
    const output = await runCliCommand(["quickstart", "agent-spine", "--cwd", workspace]);
    expect(output).toMatchObject({
      command: "quickstart agent-spine",
      authorityCreated: false,
    });
  });
});

async function localProject(prefix: string) {
  const root = await mkdtemp(join(tmpdir(), `handshake-cli-${prefix}-`));
  return {
    workspace: join(root, "workspace"),
    stateRoot: join(root, "state"),
  };
}
