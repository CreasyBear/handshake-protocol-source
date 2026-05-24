import { describe, expect, it } from "bun:test";
import { chmod, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCliCommand } from "../../src/cli/main";

const digestA = `sha256:${"a".repeat(64)}`;
const digestB = `sha256:${"b".repeat(64)}`;

describe("CLI x402 install and probe posture", () => {
  it("records local x402 install posture without authority or signer use", async () => {
    const { workspace, stateRoot } = await localProject("install");
    const inputPath = await writeJson("x402-install", x402InstallCommandInput());

    const output = await runCliCommand(["install", "x402-payment", inputPath, "--cwd", workspace, "--record-local"]);

    expect(output).toMatchObject({
      command: "install x402-payment",
      ok: true,
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
      receiptExportCreated: false,
      result: {
        installStatus: "ready_to_install",
        actionClass: "x402_payment.exact",
        selectedPaymentRequirementIndex: 1,
        selectedPaymentRequirementDigest: digestB,
        perCallAmountBound: "2500",
        spendWindowEnforcementStatus: "not_enforced_local_metadata",
        rawCredentialRefsIncluded: false,
        controlPlaneRegistrationRequired: true,
        controlPlaneRegistrationPerformed: false,
        readinessAuthority: "local_compilation",
        trustedInstallReadiness: false,
        nextReadinessAction: "register_control_plane_install",
        compiledRecordsIncluded: false,
      },
    });
    expect(JSON.stringify(output)).not.toContain("PAYMENT-SIGNATURE");
    expect(JSON.stringify(output)).not.toContain("PaymentPayload");
    expect(JSON.stringify(output)).not.toContain("signer:gateway-held:cli");
    expect(JSON.stringify(output)).not.toContain("gateway-authority:cli");
    expect(JSON.stringify(output)).not.toContain("mutationCredentialHolderRef");
    expect(JSON.stringify(output)).not.toContain("gatewayAuthorityHolderRef");
    expect((output as { warnings: string[] }).warnings).toContain(
      "Compiled local x402 posture only; trusted readiness requires control-plane install registration and gateway posture evidence.",
    );

    const doctor = await runCliCommand(["doctor", "--cwd", workspace]);
    expect(doctor).toMatchObject({
      command: "doctor",
      ok: false,
      result: {
        status: "not_ready",
        stateRootRef: stateRoot,
      },
    });
    expect((doctor as { result: { reasonCodes: string[] } }).result.reasonCodes).not.toContain(
      "cli_install_not_configured",
    );
    expect((doctor as { result: { reasonCodes: string[] } }).result.reasonCodes).toContain(
      "cli_gateway_posture_unknown",
    );
  });

  it("records x402 probe posture and lets doctor fail closed on unsafe or stale posture", async () => {
    const { workspace } = await localProject("probes");
    await runCliCommand([
      "install",
      "x402-payment",
      await writeJson("x402-install", x402InstallCommandInput()),
      "--cwd",
      workspace,
      "--record-local",
    ]);

    const failed = await runCliCommand([
      "probes",
      "x402-payment",
      await writeJson("x402-probes-failed", { ...safePosture(), paidFetchClientStatus: "present" }),
      "--cwd",
      workspace,
      "--record-local",
    ]);

    expect(failed).toMatchObject({
      command: "probes x402-payment",
      ok: false,
      authorityCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
      result: {
        passed: false,
        reasonCodes: ["x402_paid_fetch_client_not_blocked"],
        readinessAuthority: "local_classification",
        trustedReadiness: false,
      },
    });
    const failedDoctor = await runCliCommand(["doctor", "--cwd", workspace]);
    expect(failedDoctor).toMatchObject({ result: { status: "not_ready" } });
    expect((failedDoctor as { result: { reasonCodes: string[] } }).result.reasonCodes).toContain(
      "cli_gateway_posture_probe_failed",
    );
    expect((failedDoctor as { result: { reasonCodes: string[] } }).result.reasonCodes).toContain(
      "cli_gateway_posture_unknown",
    );

    const passed = await runCliCommand([
      "probes",
      "x402-payment",
      await writeJson("x402-probes-safe", safePosture()),
      "--cwd",
      workspace,
      "--record-local",
    ]);
    expect(passed).toMatchObject({
      command: "probes x402-payment",
      ok: true,
      result: {
        passed: true,
        reasonCodes: [],
        readinessAuthority: "local_classification",
        trustedReadiness: false,
      },
    });
    expect((passed as { result: { probeCoverage: unknown[] } }).result.probeCoverage).toHaveLength(6);

    await expireProbeReport(workspace);
    const staleDoctor = await runCliCommand(["doctor", "--cwd", workspace]);
    expect(staleDoctor).toMatchObject({ result: { status: "not_ready" } });
    expect((staleDoctor as { result: { reasonCodes: string[] } }).result.reasonCodes).toContain(
      "cli_gateway_posture_stale",
    );
    expect((staleDoctor as { result: { reasonCodes: string[] } }).result.reasonCodes).toContain(
      "cli_gateway_posture_unknown",
    );
  });

  it("reports pre-contract install health without pretending to have a contract-keyed projection", async () => {
    const { workspace } = await localProject("health");
    await runCliCommand([
      "install",
      "x402-payment",
      await writeJson("x402-install", x402InstallCommandInput()),
      "--cwd",
      workspace,
      "--record-local",
    ]);
    await runCliCommand([
      "probes",
      "x402-payment",
      await writeJson("x402-probes-safe", safePosture()),
      "--cwd",
      workspace,
      "--record-local",
    ]);

    await expect(runCliCommand(["install", "health", "--cwd", workspace])).resolves.toMatchObject({
      command: "install health",
      ok: false,
      authorityCreated: false,
      mutationAttempted: false,
      result: {
        healthScope: "pre_contract",
        contractKeyedProjectionStatus: "not_contract_keyed_yet",
        installHealthStatus: "not_ready",
        reasonCodes: ["cli_gateway_posture_unknown"],
        localProbeReportStatus: "local_classification_passed",
      },
    });
  });
});

async function localProject(prefix: string) {
  const workspace = await mkdtemp(join(tmpdir(), `handshake-cli-${prefix}-workspace-`));
  const stateRoot = await mkdtemp(join(tmpdir(), `handshake-cli-${prefix}-state-`));
  await runCliCommand(["init", "--cwd", workspace, "--state-root", stateRoot, "--project-id", `proj_cli_${prefix}`]);
  return { workspace, stateRoot };
}

async function writeJson(prefix: string, value: unknown): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), `handshake-cli-${prefix}-`));
  await mkdir(dir, { recursive: true });
  const path = join(dir, "input.json");
  await writeFile(path, JSON.stringify(value, null, 2));
  return path;
}

async function expireProbeReport(workspace: string): Promise<void> {
  const configPath = join(workspace, ".handshake", "project.json");
  const config = JSON.parse(await readFile(configPath, "utf8")) as { x402ProbeReportRef: string };
  const report = JSON.parse(await readFile(config.x402ProbeReportRef, "utf8")) as Record<string, unknown>;
  report.expiresAt = "2020-01-01T00:00:00.000Z";
  await writeFile(config.x402ProbeReportRef, JSON.stringify(report, null, 2));
  await chmod(config.x402ProbeReportRef, 0o600);
}

function x402InstallCommandInput() {
  return {
    installInput: {
      tenantId: "tenant_cli",
      organizationId: "org_cli",
      createdAt: "2026-05-22T00:00:00.000Z",
      endpointEvidence: {
        endpointUrl: "https://seller.example.com/report",
        payee: "0x0000000000000000000000000000000000000001",
        network: "base-sepolia",
        token: "USDC",
        maxAtomicAmount: "2500",
        paymentRequirementsDigest: digestA,
        facilitatorRef: "facilitator:x402:fixture",
        evidenceRefs: ["evidence:x402-payment-required"],
      },
      walletGatewayProfile: {
        walletGatewayId: "wallet_gateway_cli",
        gatewayId: "gateway_cli",
        signerCustodyStatus: "gateway_held",
        signerRef: "signer:gateway-held:cli",
        authorityHolderRef: "gateway-authority:cli",
        supportedNetworks: ["base-sepolia"],
        supportedTokens: ["USDC"],
      },
      spendBounds: {
        principalId: "principal_cli",
        agentId: "agent_cli",
        runtimeAdapterId: "runtime_cli",
        objectiveRef: "objective:cli:x402",
        allowedDomains: ["seller.example.com"],
        allowedPayees: ["0x0000000000000000000000000000000000000001"],
        allowedNetworks: ["base-sepolia"],
        allowedTokens: ["USDC"],
        maxAtomicAmountPerCall: "2500",
        maxAtomicAmountPerSession: "10000",
        maxAtomicAmountPerDay: "20000",
        reviewThresholdAtomicAmount: "2500",
        issuedAt: "2026-05-22T00:00:00.000Z",
        expiresAt: "2026-05-23T00:00:00.000Z",
      },
    },
    selectedPaymentRequirementIndex: 1,
    selectedPaymentRequirementDigest: digestB,
  };
}

function safePosture() {
  return {
    signerCustodyStatus: "gateway_held",
    rawPrivateKeyEnvStatus: "absent",
    directCoreClientSigningStatus: "blocked",
    paidFetchClientStatus: "blocked",
    paidAxiosClientStatus: "absent",
    rawPaymentSignatureHeaderStatus: "blocked",
    siblingX402WrapperStatus: "blocked",
    mcpDirectPaymentStatus: "blocked",
    tokenPassthroughStatus: "blocked",
    wrapperDriftStatus: "absent",
    failureClosedStatus: "passed",
  };
}
