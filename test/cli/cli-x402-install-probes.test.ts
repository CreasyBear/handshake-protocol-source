import { describe, expect, it } from "bun:test";
import { chmod, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { X402_PROTECTED_TOOL_READINESS_VERSION } from "../../src/adapters/x402-payment";
import { runCliCommand } from "../../src/cli/main";

const digestA = `sha256:${"a".repeat(64)}`;
const digestB = `sha256:${"b".repeat(64)}`;
const digestC = `sha256:${"c".repeat(64)}`;

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
        readinessReport: {
          schemaVersion: "handshake.cli.x402-readiness.v1",
          readinessScope: "pre_contract",
          actionClass: "x402_payment.exact",
          protectedSurfaceKind: "x402_payment",
          readinessAuthority: "local_cli",
          readinessStatus: "local_posture_evidence_present",
          proofLevel: "local_classification",
          trustedReadiness: false,
          requiredNextMechanism: "register_control_plane_install",
          checks: {
            projectConfig: "present",
            installCompilation: "ready_to_install",
            controlPlaneRegistration: "required_not_performed",
            signerCustody: "gateway_held",
            custodyProof: "missing",
            gatewayPosture: "local_classification_passed",
            policyVersion: "local_metadata_only",
            probeFreshness: "fresh",
          },
          proofGapPostures: [
            "control_plane_registration_missing",
            "custody_proof_missing",
            "trusted_gateway_posture_missing",
          ],
          proofGapReasonCodes: ["cli_gateway_posture_unknown"],
          authorityCreated: false,
          gatewayCheckPerformed: false,
          mutationAttempted: false,
        },
      },
    });
  });

  it("registers trusted gateway readiness without creating execution authority", async () => {
    const { workspace } = await localProject("gateway-ready");
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

    const registered = await runCliCommand([
      "register",
      "x402-gateway-readiness",
      await writeJson("x402-gateway-readiness", gatewayReadinessRegistrationInput()),
      "--cwd",
      workspace,
      "--record-local",
    ]);

    expect(registered).toMatchObject({
      command: "register x402-gateway-readiness",
      ok: true,
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
      credentialMaterialIncluded: false,
      mutationCommandIncluded: false,
      result: {
        schemaVersion: "handshake.cli.x402-gateway-readiness.v1",
        readinessAuthority: "control_plane_registration",
        trustedReadiness: true,
        actionClass: "x402_payment.exact",
        protectedSurfaceKind: "x402_payment",
        gatewayId: "gateway_cli",
        gatewayPosture: "online",
        gatewayCredentialRefDigest: digestC,
        gatewayCredentialCustodyStatus: "gateway_held",
        gatewayCustodyProofPacketRef: "gateway-custody-proof:x402:cli",
        gatewayCustodyProofPacketDigest: digestB,
        gatewayCustodyClaimLevel: "customer_gateway_evidence",
        gatewayCustodyExternalVerificationStatus: "verified_by_official_source",
        gatewayCustodyProofExpiresAt: "2099-01-01T00:00:00.000Z",
        policyVersionRef: "policy:x402:cli:v1",
        policyVersionDigest: digestA,
        selectedPaymentRequirementDigest: digestB,
        protectedToolReadiness: {
          schemaVersion: X402_PROTECTED_TOOL_READINESS_VERSION,
          readinessStatus: "trusted_gateway_ready",
          readinessScope: "pre_contract",
          readinessProofLevel: "control_plane_registration",
          trustedReadiness: true,
          requiredNextMechanism: "ready_for_runtime_facade",
          readinessExpiresAt: "2099-01-01T00:00:00.000Z",
          installDigest: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
          probePostureDigest: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
          paymentRequirementsDigest: digestA,
          selectedPaymentRequirementDigest: digestB,
          gatewayId: "gateway_cli",
          gatewayRegistrationRef: "gateway-registration:x402:cli",
          gatewayCredentialRefDigest: digestC,
          gatewayCredentialCustodyStatus: "gateway_held",
          gatewayCustodyProofPacketRef: "gateway-custody-proof:x402:cli",
          gatewayCustodyProofPacketDigest: digestB,
          gatewayCustodyClaimLevel: "customer_gateway_evidence",
          gatewayCustodyExternalVerificationStatus: "verified_by_official_source",
          gatewayCustodyProofExpiresAt: "2099-01-01T00:00:00.000Z",
          gatewayPosture: "online",
          policyVersionRef: "policy:x402:cli:v1",
          policyVersionDigest: digestA,
          rawCredentialRefsIncluded: false,
          rawSiblingPosture: "named_not_controlled",
          proofGapReasonCodes: [],
          authorityBoundary: {
            readinessScope: "pre_contract",
            createsAuthority: false,
            createsPolicyDecision: false,
            createsGreenlight: false,
            performsGatewayCheck: false,
            performsMutation: false,
            resolvesCredential: false,
            invokesSigner: false,
            createsPaymentMaterial: false,
            createsPaymentSignature: false,
            exportsReceipt: false,
            mintsTerminalCertificate: false,
            claimsHostedOperation: false,
            claimsProviderCustody: false,
            claimsSettlement: false,
            claimsHostWideContainment: false,
            certifiesMarketplace: false,
          },
        },
        rawCredentialRefsIncluded: false,
        controlPlaneRegistrationPerformed: true,
        authorityCreated: false,
        greenlightCreated: false,
        gatewayCheckPerformed: false,
        mutationAttempted: false,
      },
    });
    const protectedReadiness = (
      registered as {
        result: {
          protectedToolReadiness: {
            gatewayReadinessRef: string;
            gatewayReadinessDigest: string;
            rawSiblingProofRefs: string[];
            evidenceRefs: string[];
          };
        };
      }
    ).result.protectedToolReadiness;
    expect(protectedReadiness.gatewayReadinessRef).toContain("gateway-readiness.json");
    expect(protectedReadiness.gatewayReadinessDigest).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(protectedReadiness.rawSiblingProofRefs).toContain(
      "evidence:x402-hostile-probe:raw_sibling_blocking:raw_private_key_env_absent",
    );
    expect(protectedReadiness.evidenceRefs).toContain("evidence:gateway-readiness:cli");
    expect(JSON.stringify(registered)).not.toContain("PAYMENT-SIGNATURE");
    expect(JSON.stringify(registered)).not.toContain("PaymentPayload");
    expect(JSON.stringify(registered)).not.toContain("signer:gateway-held:cli");
    expect(JSON.stringify(registered)).not.toContain("gatewayCheckInput");

    const health = await runCliCommand(["install", "health", "--cwd", workspace]);
    expect(health).toMatchObject({
      command: "install health",
      ok: true,
      authorityCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
      result: {
        installHealthStatus: "trusted_gateway_ready",
        reasonCodes: [],
        readinessReport: {
          readinessStatus: "trusted_gateway_ready",
          proofLevel: "control_plane_registration",
          trustedReadiness: true,
          requiredNextMechanism: "ready_for_runtime_facade",
          gatewayId: "gateway_cli",
          policyVersionRef: "policy:x402:cli:v1",
          protectedToolReadiness: {
            readinessStatus: "trusted_gateway_ready",
            readinessProofLevel: "control_plane_registration",
            selectedPaymentRequirementDigest: digestB,
            gatewayCredentialRefDigest: digestC,
            rawCredentialRefsIncluded: false,
            rawSiblingPosture: "named_not_controlled",
          },
          checks: {
            controlPlaneRegistration: "registered",
            custodyProof: "registered",
            gatewayPosture: "registered_online",
            policyVersion: "registered",
            probeFreshness: "fresh",
          },
          proofGapPostures: [],
          proofGapReasonCodes: [],
          authorityCreated: false,
          gatewayCheckPerformed: false,
          mutationAttempted: false,
        },
      },
    });
    expect((health as { result: { gatewayReadinessRef: string } }).result.gatewayReadinessRef).toContain(
      "gateway-readiness.json",
    );
  });

  it("refuses trusted gateway readiness when no exact payment requirement was selected", async () => {
    const { workspace } = await localProject("gateway-missing-selected-payment");
    const installInput = {
      ...x402InstallCommandInput(),
      selectedPaymentRequirementIndex: null,
      selectedPaymentRequirementDigest: null,
    };
    await runCliCommand([
      "install",
      "x402-payment",
      await writeJson("x402-install", installInput),
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

    await expect(
      runCliCommand([
        "register",
        "x402-gateway-readiness",
        await writeJson("x402-gateway-readiness", gatewayReadinessRegistrationInput()),
        "--cwd",
        workspace,
        "--record-local",
      ]),
    ).resolves.toMatchObject({
      command: "register x402-gateway-readiness",
      ok: false,
      reasonCodes: ["cli_selected_payment_requirement_missing"],
      result: {
        trustedReadiness: false,
        authorityCreated: false,
        greenlightCreated: false,
        gatewayCheckPerformed: false,
        mutationAttempted: false,
      },
    });
  });

  it("fails closed when the trusted readiness snapshot is tampered after registration", async () => {
    const { workspace } = await localProject("gateway-tampered-readiness");
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
    await runCliCommand([
      "register",
      "x402-gateway-readiness",
      await writeJson("x402-gateway-readiness", gatewayReadinessRegistrationInput()),
      "--cwd",
      workspace,
      "--record-local",
    ]);

    await mutateGatewayReadinessRecord(workspace, (record) => {
      const readiness = record.protectedToolReadiness as Record<string, unknown>;
      readiness.policyVersionDigest = digestB;
    });

    const doctor = await runCliCommand(["doctor", "--cwd", workspace]);
    expect(doctor).toMatchObject({
      command: "doctor",
      ok: false,
      result: {
        status: "not_ready",
      },
    });
    expect((doctor as { result: { reasonCodes: string[] } }).result.reasonCodes).toContain(
      "cli_gateway_posture_unknown",
    );

    const health = await runCliCommand(["install", "health", "--cwd", workspace]);
    expect(health).toMatchObject({
      command: "install health",
      ok: false,
      result: {
        installHealthStatus: "not_ready",
        readinessReport: {
          readinessStatus: "local_posture_evidence_present",
          trustedReadiness: false,
          requiredNextMechanism: "register_control_plane_install",
          checks: {
            gatewayPosture: "unknown",
          },
          proofGapPostures: ["trusted_gateway_posture_invalid"],
          proofGapReasonCodes: ["cli_gateway_posture_unknown"],
        },
      },
    });
  });

  it("refuses trusted gateway readiness registration until local install and probes are present", async () => {
    const { workspace } = await localProject("gateway-missing-probes");
    await runCliCommand([
      "install",
      "x402-payment",
      await writeJson("x402-install", x402InstallCommandInput()),
      "--cwd",
      workspace,
      "--record-local",
    ]);

    await expect(
      runCliCommand([
        "register",
        "x402-gateway-readiness",
        await writeJson("x402-gateway-readiness", gatewayReadinessRegistrationInput()),
        "--cwd",
        workspace,
        "--record-local",
      ]),
    ).resolves.toMatchObject({
      command: "register x402-gateway-readiness",
      ok: false,
      authorityCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
      reasonCodes: ["cli_gateway_posture_unknown"],
      result: {
        trustedReadiness: false,
        authorityCreated: false,
        greenlightCreated: false,
        gatewayCheckPerformed: false,
        mutationAttempted: false,
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

async function mutateGatewayReadinessRecord(
  workspace: string,
  mutate: (record: Record<string, unknown>) => void,
): Promise<void> {
  const configPath = join(workspace, ".handshake", "project.json");
  const config = JSON.parse(await readFile(configPath, "utf8")) as { x402GatewayReadinessRef: string };
  const record = JSON.parse(await readFile(config.x402GatewayReadinessRef, "utf8")) as Record<string, unknown>;
  mutate(record);
  await writeFile(config.x402GatewayReadinessRef, JSON.stringify(record, null, 2));
  await chmod(config.x402GatewayReadinessRef, 0o600);
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

function gatewayReadinessRegistrationInput() {
  return {
    gatewayId: "gateway_cli",
    gatewayRegistrationRef: "gateway-registration:x402:cli",
    gatewayCredentialRefDigest: digestC,
    gatewayCredentialCustodyStatus: "gateway_held",
    gatewayCustodyProofPacketRef: "gateway-custody-proof:x402:cli",
    gatewayCustodyProofPacketDigest: digestB,
    gatewayCustodyClaimLevel: "customer_gateway_evidence",
    gatewayCustodyExternalVerificationStatus: "verified_by_official_source",
    gatewayCustodyProofExpiresAt: "2099-01-01T00:00:00.000Z",
    gatewayPosture: "online",
    policyVersionRef: "policy:x402:cli:v1",
    policyVersionDigest: digestA,
    expiresAt: "2099-01-01T00:00:00.000Z",
    evidenceRefs: ["evidence:gateway-readiness:cli"],
  };
}
