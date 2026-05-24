import { describe, expect, it } from "bun:test";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runCliCommand } from "../../src/cli/main";

describe("CLI evidence surface", () => {
  it("renders an APS report as non-authority CLI JSON", async () => {
    const output = await runCliCommand(["evidence", "aps-report", await writeJson("aps-report", apsReport())]);

    expect(output).toMatchObject({
      schemaVersion: "handshake.cli.v1",
      command: "evidence aps-report",
      plane: "evidence",
      custodyRole: "review_custody",
      ok: true,
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
      rawInternalRecordIncluded: false,
      credentialMaterialIncluded: false,
      mutationCommandIncluded: false,
      receiptExportCreated: false,
      authorityCertificateMinted: false,
      reasonCodes: [],
      nextAction: "read_evidence",
      retryability: "not_retryable",
      commitState: "not_applicable",
      redactionProfileRef: "aps-report:v1-redacted",
      result: {
        proofBoundary: "local_reference",
        protectedAction: {
          actionClass: "x402_payment.exact",
          selectedPaymentRequirementIndex: 0,
          selectedPaymentRequirementDigest: `sha256:${"7".repeat(64)}`,
        },
        phases: [
          { phase: "1_runtime_proposal", verdict: "pass" },
          { phase: "6_replay_refusal", verdict: "pass" },
        ],
      },
    });
    expect(JSON.stringify(output)).not.toContain("PAYMENT-SIGNATURE");
    expect(JSON.stringify(output)).not.toContain("PaymentPayload");
  });

  it("verifies supplied certificate material without minting or reading protocol state", async () => {
    const output = await runCliCommand([
      "cert",
      "verify",
      await writeJson("certificate", {}),
      "--trust-bundle",
      await writeJson("trust", { keys: [], allowDevHmac: false }),
    ]);

    expect(output).toMatchObject({
      command: "cert verify",
      ok: false,
      authorityCreated: false,
      authorityCertificateMinted: false,
      reasonCodes: ["schema_invalid"],
      nextAction: "fix_arguments",
      retryability: "retryable_after_fix",
      redactionProfileRef: "authority-certificate-verification:v1-redacted",
      result: {
        verificationValid: false,
        signingInputDigest: null,
        actionClass: null,
        failureCodes: ["schema_invalid"],
      },
    });
  });

  it("wraps redacted contract and receipt evidence projections without raw dumps", async () => {
    const contract = await runCliCommand(["evidence", "contract-view", await writeJson("contract", contractView())]);
    const timeline = await runCliCommand([
      "evidence",
      "receipt-timeline",
      await writeJson("timeline", receiptTimeline()),
    ]);

    expect(contract).toMatchObject({
      command: "evidence contract-view",
      plane: "evidence",
      custodyRole: "review_custody",
      authorityCreated: false,
      rawInternalRecordIncluded: false,
      receiptExportCreated: false,
      nextAction: "read_evidence",
      redactionProfileRef: "contract-view:v0.2-redacted",
      result: {
        redactionProfileRef: "contract-view:v0.2-redacted",
        actionContractRef: "contract_demo",
      },
    });
    expect(timeline).toMatchObject({
      command: "evidence receipt-timeline",
      plane: "evidence",
      custodyRole: "review_custody",
      authorityCreated: false,
      rawInternalRecordIncluded: false,
      receiptExportCreated: false,
      nextAction: "read_evidence",
      redactionProfileRef: "receipt-timeline:v0.2-redacted",
      result: {
        redactionProfileRef: "receipt-timeline:v0.2-redacted",
        receiptRef: "receipt_demo",
      },
    });
    expect((contract as { result: { secretRefs?: unknown } }).result.secretRefs).toBeUndefined();
    expect(JSON.stringify(timeline)).not.toContain("PAYMENT-SIGNATURE");
  });

  it("exposes only active non-mutating command metadata and x402 protected-spend conformance", async () => {
    await expect(runCliCommand(["schema"])).resolves.toMatchObject({
      command: "schema",
      result: {
        commands: [
          { id: "schema", agentSafe: true },
          { id: "init", agentSafe: false },
          { id: "doctor", agentSafe: true },
          { id: "evidence.aps-report", agentSafe: true },
          { id: "evidence.contract-view", agentSafe: true },
          { id: "evidence.receipt-timeline", agentSafe: true },
          { id: "cert.verify", agentSafe: true },
          { id: "support.bundle", agentSafe: true },
          { id: "install.x402-payment", agentSafe: false },
          { id: "probes.x402-payment", agentSafe: false },
          { id: "install.health", agentSafe: true },
          { id: "conformance.x402-payment", agentSafe: true },
        ],
      },
    });
    await expect(runCliCommand(["conformance", "x402-payment", "--profile", "protected-spend"])).resolves.toMatchObject(
      {
        command: "conformance x402-payment",
        ok: true,
        authorityCreated: false,
        reasonCodes: [],
        nextAction: "read_result",
        result: {
          profile: "protected-spend",
          adapterPackId: "adapter_pack_x402_payment_exact",
          passed: true,
          reasonCodes: [],
        },
      },
    );
  });

  it("returns structured non-authority usage errors for agents and operators", async () => {
    await expect(runCliCommand(["ship", "it"])).resolves.toMatchObject({
      schemaVersion: "handshake.cli.v1",
      command: "ship it",
      plane: "operator",
      ok: false,
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
      credentialMaterialIncluded: false,
      reasonCodes: ["cli_command_unsupported"],
      nextAction: "run_schema",
      retryability: "retryable_after_fix",
      commitState: "not_started",
      result: {
        errorCode: "cli_command_unsupported",
        message: "Unsupported command.",
        nextAction: "run_schema",
        activeCommands: [
          "schema",
          "init",
          "doctor",
          "evidence aps-report",
          "evidence contract-view",
          "evidence receipt-timeline",
          "cert verify",
          "support bundle",
          "install x402-payment",
          "probes x402-payment",
          "install health",
          "conformance x402-payment",
        ],
      },
    });

    await expect(runCliCommand(["cert", "verify", await writeJson("certificate", {})])).resolves.toMatchObject({
      command: "cert verify",
      plane: "evidence",
      ok: false,
      authorityCertificateMinted: false,
      reasonCodes: ["cli_required_argument_missing"],
      nextAction: "fix_arguments",
      retryability: "retryable_after_fix",
      commitState: "not_started",
      result: {
        errorCode: "cli_required_argument_missing",
        message: "cert verify requires --trust-bundle <path>.",
        nextAction: "fix_arguments",
      },
    });

    await expect(runCliCommand(["cert", "verify"])).resolves.toMatchObject({
      command: "cert verify",
      ok: false,
      reasonCodes: ["cli_required_argument_missing"],
      nextAction: "fix_arguments",
      result: {
        errorCode: "cli_required_argument_missing",
        message: "cert verify requires <certificate-path> --trust-bundle <path>.",
      },
    });

    const missingFile = await runCliProcess("evidence", "aps-report", "/tmp/handshake-missing-input.json");
    expect(missingFile.exitCode).toBe(1);
    expect(missingFile.output).toMatchObject({
      command: "evidence aps-report",
      ok: false,
      reasonCodes: ["cli_input_file_unreadable"],
      nextAction: "fix_arguments",
      result: {
        errorCode: "cli_input_file_unreadable",
        message: "Input JSON file could not be read.",
      },
    });
  });
});

async function runCliProcess(...argv: string[]): Promise<{ exitCode: number; output: unknown }> {
  const proc = Bun.spawn([process.execPath, "run", "./src/cli/main.ts", ...argv], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdoutPromise = proc.stdout ? new Response(proc.stdout).text() : Promise.resolve("");
  const stderrPromise = proc.stderr ? new Response(proc.stderr).text() : Promise.resolve("");
  const exitCode = await proc.exited;
  const stdout = await stdoutPromise;
  const stderr = await stderrPromise;
  return { exitCode, output: JSON.parse(stderr || stdout) };
}

async function writeJson(prefix: string, value: unknown): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), `handshake-cli-${prefix}-`));
  await mkdir(dir, { recursive: true });
  const path = join(dir, "input.json");
  await writeFile(path, JSON.stringify(value, null, 2));
  return path;
}

function apsReport() {
  return {
    schemaVersion: "handshake.demo.x402-protected-spend.v1",
    report: {
      schemaVersion: "handshake.demo.aps-report.v1",
      proofObject: {
        name: "local x402 protected-spend authority envelope",
        proofBoundary: "local_reference",
      },
      protectedAction: {
        actionClass: "x402_payment.exact",
        x402EvidenceProfile: "official_payment_required",
        selectedPaymentRequirementIndex: 0,
        selectedPaymentRequirementDigest: `sha256:${"7".repeat(64)}`,
      },
      authorityPath: {
        runtimeProposalOutcome: "action_contracts_proposed",
      },
      evidencePosture: {
        gatewayAdmissionStatus: "admitted",
        downstreamOutcomeStatus: "pending",
      },
      terminalPosture: {
        terminalKind: "receipt",
        verificationValid: true,
      },
      nonClaims: ["hosted operation", "clearing-house readiness", "aggregate payment-budget management"],
      missingProofObjects: [],
    },
    phases: [
      { phase: "1_runtime_proposal", verdict: "pass" },
      { phase: "6_replay_refusal", verdict: "pass" },
    ],
  };
}

function contractView() {
  return {
    actionContractRef: "contract_demo",
    contractDigest: `sha256:${"1".repeat(64)}`,
    intentCompilationRef: "intent_demo",
    candidateActionRef: "candidate_demo",
    candidateDigest: `sha256:${"2".repeat(64)}`,
    envelopeRef: "envelope_demo",
    principalRef: "principal_demo",
    agentRef: "agent_demo",
    participantIdentityBindings: [],
    runId: "run_demo",
    runtimeAdapterRef: "runtime_demo",
    actionClass: "x402_payment.exact",
    protectedSurfaceKind: "x402_payment",
    resourceRef: "x402:base-sepolia:payee:https://seller.example.com/report",
    gatewayId: "gateway_demo",
    gatewayPolicyVersion: "v1",
    requiredProtectedPathState: "gateway_checked",
    idempotencyKey: "idempotency_demo",
    paramsDigest: `sha256:${"3".repeat(64)}`,
    nonSecretParamsSummary: { method: "GET" },
    gatewayCredentialRefs: [],
    evidenceRefs: [],
    clearingEvidenceRefs: {},
    signaturePosture: "local_hmac",
    keyIdentityRef: "key_demo",
    verificationPolicyRef: "verification_demo",
    generatedExecutionGraphRef: null,
    generatedExecutionNodeRef: null,
    redactionProfileRef: "contract-view:v0.2-redacted",
    omittedFields: ["parameters", "secretRefs", "contractSignature"],
  };
}

function receiptTimeline() {
  return {
    receiptRef: "receipt_demo",
    actionContractRef: "contract_demo",
    policyDecisionRef: "policy_demo",
    greenlightRef: "greenlight_demo",
    gateAttemptRef: "gate_demo",
    mutationAttemptRef: "mutation_demo",
    gatewayId: "gateway_demo",
    policyDecisionStatus: "greenlight",
    gatewayCheckStatus: "passed",
    gatewayAdmissionStatus: "admitted",
    greenlightConsumptionStatus: "consumed",
    mutationAttemptStatus: "submitted",
    downstreamExecutionStatus: "pending",
    downstreamOutcomeStatus: "pending",
    proofGapRefs: [],
    finalityStatus: "pending",
    receiptDigest: `sha256:${"4".repeat(64)}`,
    auditChainDigest: `sha256:${"5".repeat(64)}`,
    streamOffsets: [],
    events: [],
    missingEventCount: 0,
    failureEvidence: null,
    redactionProfileRef: "receipt-timeline:v0.2-redacted",
    omittedFields: ["payload", "evidenceRefs"],
  };
}
