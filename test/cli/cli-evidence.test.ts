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
      result: {
        verificationValid: false,
        signingInputDigest: null,
        actionClass: null,
        failureCodes: ["schema_invalid"],
      },
    });
  });

  it("exposes only active non-mutating command metadata and x402 protected-spend conformance", async () => {
    await expect(runCliCommand(["schema"])).resolves.toMatchObject({
      command: "schema",
      result: {
        commands: [
          { id: "schema", agentSafe: true },
          { id: "evidence.aps-report", agentSafe: true },
          { id: "cert.verify", agentSafe: true },
          { id: "conformance.x402-payment", agentSafe: true },
        ],
      },
    });
    await expect(runCliCommand(["conformance", "x402-payment", "--profile", "protected-spend"])).resolves.toMatchObject(
      {
        command: "conformance x402-payment",
        ok: true,
        authorityCreated: false,
        result: {
          profile: "protected-spend",
          adapterPackId: "adapter_pack_x402_payment_exact",
          passed: true,
          reasonCodes: [],
        },
      },
    );
  });
});

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
      nonClaims: ["hosted operation", "clearing-house readiness"],
      missingProofObjects: [{ proofObject: "spend reservation ledger" }],
    },
    phases: [
      { phase: "1_runtime_proposal", verdict: "pass" },
      { phase: "6_replay_refusal", verdict: "pass" },
    ],
  };
}
