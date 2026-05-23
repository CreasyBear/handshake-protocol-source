import { describe, expect, it } from "bun:test";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const outputJsonPath = `${repoRoot}/examples/x402-protected-spend/output/latest.json`;
const outputMarkdownPath = `${repoRoot}/examples/x402-protected-spend/output/latest.md`;

describe("x402 protected spend demo report", () => {
  it("emits a buyer-readable local APS report without creating authority claims", async () => {
    const proc = Bun.spawn([process.execPath, "run", "./examples/x402-protected-spend/run.ts"], {
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
    expect(stdout).toContain("Wrote: examples/x402-protected-spend/output/latest.md");

    const output = await Bun.file(outputJsonPath).json();
    const runtimePhase = output.phases.find((phase: { phase: string }) => phase.phase === "1_runtime_proposal") as
      | { evidence: Record<string, string> }
      | undefined;
    expect(runtimePhase?.evidence.runtimeExecutionId).toStartWith("rex_");
    expect(runtimePhase?.evidence.toolCallDraftId).toStartWith("tcd_");
    expect(runtimePhase?.evidence.intentCompilationId).toStartWith("icr_");
    expect(output.report).toMatchObject({
      schemaVersion: "handshake.demo.aps-report.v1",
      proofObject: {
        name: "local x402 protected-spend authority envelope",
        proofBoundary: "local_reference",
      },
      protectedAction: {
        actionClass: "x402_payment.exact",
        protectedSurfaceKind: "x402_payment",
        endpointDomain: "api.example.com",
        intendedHttpMethod: "GET",
        x402EvidenceProfile: "official_payment_required",
        x402Scheme: "exact",
        network: "eip155:84532",
        atomicAmount: "2500",
        selectedPaymentRequirementIndex: 0,
      },
      actorsAndCustody: {
        principalRef: "principal_demo",
        agentRef: "agent_demo",
        runtimeAdapterRef: "runtime_codex",
        gatewayId: "gateway_x402_wallet",
        gatewayAuthorityHolderRef: "gateway-authority:x402-wallet",
        mutationCredentialHolderRef: "secretref:x402-wallet-gateway",
        credentialCustodyStatus: "gateway_held",
        runtimeCredentialMaterialVisible: "absent",
        signerInvocationBoundary: "after_verified_gateway_check_only",
      },
      authorityPath: {
        runtimeProposalOutcome: "action_contracts_proposed",
        policyDecision: "greenlight",
        gateDecision: "passed",
        signerInvocationsAfterGatewayAdmission: 1,
        replayDecision: "refused",
        replayReasonCode: "already_consumed",
        signerInvocationsAfterReplay: 1,
      },
      evidencePosture: {
        gatewayAdmissionStatus: "admitted",
        downstreamOutcomeStatus: "pending",
        idempotencyLedgerState: "terminal_succeeded",
        idempotencyDispositionMeaning: "authority_idempotency_only_not_payment_settlement",
        rawCredentialMaterialVisible: false,
      },
      terminalPosture: {
        terminalKind: "receipt",
        verificationValid: true,
        trustBoundary: "local_pinned_trust_material_only",
        replayRefusal: {
          gateDecision: "refused",
          reasonCode: "already_consumed",
          signerReused: false,
        },
      },
    });
    expect(output.report.authorityPath.authorityRecordsBeforePolicy).toEqual({
      policyDecision: 0,
      greenlight: 0,
      gatewayCheckAttempt: 0,
      mutationAttempt: 0,
      receipt: 0,
      authorityCertificate: 0,
    });
    expect(output.report.evidencePosture.omittedFields).toContain("actionContract.parameters");
    expect(output.report.nonClaims).toContain("clearing-house readiness");
    expect(output.report.missingProofObjects.map((entry: { proofObject: string }) => entry.proofObject)).toContain(
      "spend reservation ledger",
    );
    expect(JSON.stringify(output.report)).not.toContain(`0x${"a".repeat(130)}`);

    const markdown = await Bun.file(outputMarkdownPath).text();
    expect(markdown).toContain("## Buyer-Readable APS Report");
    expect(markdown).toContain("### Actors And Custody");
    expect(markdown).toContain("### Missing Proof Objects");

    const demoSource = await Bun.file(`${repoRoot}/examples/x402-protected-spend/run.ts`).text();
    expect(demoSource).toContain("RuntimeClient");
    expect(demoSource).toContain("EvidenceClient");
    expect(demoSource).not.toContain("HandshakeClient");
    expect(demoSource).not.toContain("proposeRuntimeIngressActionContracts");

    const readme = await Bun.file(`${repoRoot}/README.md`).text();
    expect(readme).toContain("npm run demo:aps");
    expect(readme).toContain("examples/x402-protected-spend/output/latest.md");
    expect(readme).toContain("not hosted operation");
    expect(readme).toContain("not broad x402 compatibility");
  });
});
