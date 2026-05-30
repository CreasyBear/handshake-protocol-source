import { describe, expect, it } from "bun:test";
import { fileURLToPath } from "node:url";
import { MCP_DELEGATION_VERIFY_TOOL, MCP_X402_PAYMENT_PROPOSE_TOOL } from "../../src/mcp/catalog";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const outputJsonPath = `${repoRoot}/examples/self-hosted-activation/output/latest.json`;
const outputMarkdownPath = `${repoRoot}/examples/self-hosted-activation/output/latest.md`;

describe("Self-hosted activation packet", () => {
  it("emits one install-and-prove packet with APS, CLI, and MCP process evidence", async () => {
    const proc = Bun.spawn([process.execPath, "run", "./examples/self-hosted-activation/run.ts"], {
      cwd: repoRoot,
      stdout: "pipe",
      stderr: "pipe",
    });
    const stdoutPromise = proc.stdout ? new Response(proc.stdout).text() : Promise.resolve("");
    const stderrPromise = proc.stderr ? new Response(proc.stderr).text() : Promise.resolve("");
    const exitCode = await proc.exited;
    const stdout = await stdoutPromise;
    const stderr = await stderrPromise;

    expect(stderr).toBe("");
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Handshake self-hosted activation");
    expect(stdout).toContain("Wrote: examples/self-hosted-activation/output/latest.md");
    expect(stdout).toContain("PASS mcp_stdio_process");

    const output = await Bun.file(outputJsonPath).json();
    expect(output.schemaVersion).toBe("handshake.demo.self-hosted-activation.v1");
    expect(output.activationCommand).toBe("npm run demo:self-hosted");
    expect(output.rows.map((row: { id: string; verdict: string }) => [row.id, row.verdict])).toEqual([
      ["aps_x402_exact_path", "pass"],
      ["cli_readbacks", "pass"],
      ["mcp_reference_transcript", "pass"],
      ["mcp_stdio_process", "pass"],
    ]);
    expect(output.apsReport.authorityPath).toMatchObject({
      policyDecision: "greenlight",
      gateDecision: "passed",
      replayDecision: "refused",
      replayReasonCode: "already_consumed",
    });
    expect(output.cliReadbacks.map((readback: { id: string }) => readback.id)).toEqual([
      "schema",
      "evidence.aps-report",
      "evidence.contract-view",
      "evidence.receipt-timeline",
      "install.health",
      "cert.verify",
      "support.bundle",
    ]);
    for (const readback of output.cliReadbacks) {
      expect(readback.ok).toBe(true);
      expect(readback.authorityCreated).toBe(false);
      expect(readback.greenlightCreated).toBe(false);
      expect(readback.gatewayCheckPerformed).toBe(false);
      expect(readback.mutationAttempted).toBe(false);
      expect(readback.credentialMaterialIncluded).toBe(false);
    }
    expect(output.mcpStdio.toolNames).toEqual([MCP_X402_PAYMENT_PROPOSE_TOOL, MCP_DELEGATION_VERIFY_TOOL]);
    expect(output.mcpStdio.toolResult.structuredContent).toMatchObject({
      outcome: "action_contract_proposed",
      authorityCreated: false,
      gatewayCheckPerformed: false,
      mutationAttemptRef: null,
    });
    expect(output.nonClaims).toEqual([
      "no_hosted_operation",
      "no_provider_custody",
      "no_customer_custody",
      "no_cross_org_certificate_trust",
      "no_spend_window_ledger_enforcement",
      "no_broad_mcp_browser_shell_network_package_manager_protection",
      "no_workos_auth_md_attestation",
      "no_clearing_house_readiness",
    ]);
    const serialized = JSON.stringify(output);
    expect(serialized).not.toContain("PAYMENT-SIGNATURE");
    expect(serialized).not.toContain("PaymentPayload");
    expect(serialized).not.toContain("privateKey");
    expect(serialized).not.toContain(`0x${"a".repeat(130)}`);

    const markdown = await Bun.file(outputMarkdownPath).text();
    expect(markdown).toContain("# Handshake Self-Hosted Activation Packet");
    expect(markdown).toContain("## MCP Stdio Process");
    expect(markdown).toContain("no_workos_auth_md_attestation");
  });
});
