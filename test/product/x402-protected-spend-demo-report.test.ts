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
    const challengePhase = output.phases.find(
      (phase: { phase: string }) => phase.phase === "0_sandbox_payment_required_challenge",
    ) as { evidence: Record<string, unknown> } | undefined;
    const activationSetupPhase = output.phases.find(
      (phase: { phase: string }) => phase.phase === "0b_role_scoped_activation_setup",
    ) as { evidence: Record<string, unknown> } | undefined;
    const runtimePhase = output.phases.find((phase: { phase: string }) => phase.phase === "1_runtime_proposal") as
      | { evidence: Record<string, string> }
      | undefined;
    const facadePhase = output.phases.find(
      (phase: { phase: string }) => phase.phase === "1_protected_tool_facade_dispatch",
    ) as { evidence: Record<string, unknown> } | undefined;
    const runtimeIngressPhase = output.phases.find(
      (phase: { phase: string }) => phase.phase === "2_runtime_proposal",
    ) as { evidence: Record<string, string> } | undefined;
    const policyPhase = output.phases.find((phase: { phase: string }) => phase.phase === "3_policy_greenlight") as
      | { evidence: Record<string, unknown> }
      | undefined;
    const hostileMatrixPhase = output.phases.find(
      (phase: { phase: string }) => phase.phase === "3b_hostile_installed_path_matrix",
    ) as { evidence: { matrix: Array<Record<string, unknown>>; allCasesPreventedConsequence: boolean } } | undefined;
    const certificatePhase = output.phases.find(
      (phase: { phase: string }) => phase.phase === "7_local_reference_terminal_certificate",
    ) as { evidence: Record<string, unknown> } | undefined;
    expect(challengePhase?.evidence.authorityCreated).toBe(false);
    expect(challengePhase?.evidence.signedRetryCountBeforeGateway).toBe(0);
    expect(challengePhase?.evidence.evidenceBoundary).toMatchObject({
      evidenceProfile: "local_reference_downstream_fixture",
      signedRetryPosture: "not_observed",
      settlementFinalityClaimed: false,
      facilitatorOperationClaimed: false,
      sellerMiddlewareClaimed: false,
      providerCustodyClaimed: false,
    });
    expect(runtimePhase).toBeUndefined();
    expect(activationSetupPhase?.evidence).toMatchObject({
      installSetupOutcome: "compiled_records_registered",
      commitAtomicity: "server_store_commit",
      installAuthorityCreated: false,
      installGreenlightCreated: false,
      installGatewayCheckPerformed: false,
      installMutationAttempted: false,
      custodyProofSecretMaterialIncluded: false,
      postureState: "gateway_checked",
      gatewayCredentialCustodyStatus: "gateway_held",
    });
    expect(facadePhase?.evidence).toMatchObject({
      toolName: "handshake.actions.x402_payment.propose",
      outcome: "dispatch_block_prepared",
      runtimeDispatchPrepared: true,
      runtimeDispatchKind: "wrapped_x402_payment",
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
      credentialMaterialIncluded: false,
    });
    expect(runtimeIngressPhase?.evidence.runtimeExecutionId).toStartWith("rex_");
    expect(runtimeIngressPhase?.evidence.generatedExecutionGraphId).toStartWith("geg_");
    expect(runtimeIngressPhase?.evidence.graphCoverageStatus).toBe("fully_covered_no_unsupported_nodes");
    expect(runtimeIngressPhase?.evidence.toolCallDraftId).toStartWith("tcd_");
    expect(runtimeIngressPhase?.evidence.intentCompilationId).toStartWith("icr_");
    expect(policyPhase?.evidence).toMatchObject({
      policyAuthoritySurface: "PolicyClient.evaluatePolicy",
      policyAuthorityRole: "control_plane",
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    });
    expect(hostileMatrixPhase?.evidence.allCasesPreventedConsequence).toBe(true);
    expect(hostileMatrixPhase?.evidence.matrix.map((row) => row.caseId)).toEqual([
      "stale_policy_metadata",
      "raw_x402_payment_payload_input",
      "sibling_mcp_direct_payment",
      "changed_observed_parameters",
      "consumed_greenlight_replay",
    ]);
    expect(certificatePhase?.evidence).toMatchObject({
      issuerSurface: "kernel.createAuthorityCertificate",
      proofBoundary: "local_reference_terminal_evidence_only",
      roleScopedProductionPath: false,
      includedInStrictProtectedGatewayClaim: false,
      terminalEvidenceSource: "receipt",
    });
    expect(output.report).toMatchObject({
      schemaVersion: "handshake.demo.aps-report.v1",
      proofObject: {
        name: "x402_paid_http_call.exact",
        proofBoundary: "local_reference",
      },
      protectedToolGatewayHandoff: {
        toolName: "handshake.actions.x402_payment.propose",
        facadeOutcome: "dispatch_block_prepared",
        runtimeDispatchPrepared: true,
        dispatchBoundaryRef: "dispatch-boundary:x402-protected-tool-gateway-demo",
        dispatchRef: "dispatch:x402-protected-tool-gateway-demo:1",
        authorityCreated: false,
        greenlightCreated: false,
        gatewayCheckPerformed: false,
        mutationAttempted: false,
        credentialMaterialIncluded: false,
      },
      protectedAction: {
        actionClass: "x402_payment.exact",
        protectedSurfaceKind: "x402_payment",
        endpointDomain: "api.example.com",
        intendedHttpMethod: "GET",
        intendedRequestBodyPosture: "no_body",
        providerEnvironmentPosture: "local_reference_sandbox",
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
        signedRetryBoundary: "adapter_fixture_observation_after_gateway_signature_only",
      },
      authorityPath: {
        runtimeProposalOutcome: "action_contracts_proposed",
        policyAuthoritySurface: "PolicyClient.evaluatePolicy",
        policyAuthorityRole: "control_plane",
        policyDecision: "greenlight",
        gateDecision: "passed",
        signerInvocationsAfterGatewayAdmission: 1,
        signedRetryCountAfterGatewayAdmission: 1,
        changedParameterDecision: "refused",
        changedParameterReasonCode: "params_mismatch",
        replayDecision: "refused",
        replayReasonCode: "already_consumed",
        signerInvocationsAfterReplay: 1,
        signedRetryCountAfterReplay: 1,
      },
      evidencePosture: {
        gatewayAdmissionStatus: "admitted",
        downstreamOutcomeStatus: "pending",
        idempotencyLedgerState: "terminal_succeeded",
        idempotencyDispositionMeaning: "authority_idempotency_only_not_payment_settlement",
        rawCredentialMaterialVisible: false,
        localSandbox: {
          providerEnvironmentPosture: "local_reference_sandbox",
          signedRetryCount: 1,
          signedRetryIsAuthority: false,
          evidenceBoundary: {
            evidenceProfile: "local_reference_downstream_fixture",
            signedRetryPosture: "post_gateway_check_observation_only",
            paymentFinalityClaimed: false,
            settlementFinalityClaimed: false,
            facilitatorOperationClaimed: false,
            sellerMiddlewareClaimed: false,
            providerCustodyClaimed: false,
            liveProviderOperationClaimed: false,
          },
        },
      },
      terminalPosture: {
        terminalKind: "receipt",
        productionTerminalEvidenceSource: "receipt",
        verificationOutcome: "verified",
        trustBoundary: "local_pinned_trust_material_only",
        localReferenceCertificate: {
          issuerSurface: "kernel.createAuthorityCertificate",
          proofBoundary: "local_reference_terminal_evidence_only",
          roleScopedProductionPath: false,
          includedInStrictProtectedGatewayClaim: false,
          terminalEvidenceSource: "receipt",
        },
        replayRefusal: {
          gateDecision: "refused",
          reasonCode: "already_consumed",
          signerReused: false,
        },
      },
      hostileGeneratedExecutionMatrix: [
        expect.objectContaining({
          caseId: "stale_policy_metadata",
          outcome: "metadata_stale",
          reasonCodes: ["protected_x402_policy_stale"],
          consequencePrevented: true,
          runtimeDispatchPrepared: false,
        }),
        expect.objectContaining({
          caseId: "raw_x402_payment_payload_input",
          outcome: "tool_execution_error",
          reasonCodes: ["protected_x402_input_schema_invalid"],
          consequencePrevented: true,
          runtimeDispatchPrepared: false,
        }),
        expect.objectContaining({
          caseId: "sibling_mcp_direct_payment",
          outcome: "one_or_more_dispatches_refused",
          reasonCodes: expect.arrayContaining(["runtime_ingress_raw_sibling_bypass"]),
          actionContractsCreated: 0,
          consequencePrevented: true,
        }),
        expect.objectContaining({
          caseId: "changed_observed_parameters",
          outcome: "gateway_check_refused",
          reasonCodes: ["params_mismatch"],
          mutationAttempted: false,
          signerInvocationsAfterAttempt: 0,
          signedRetryCountAfterAttempt: 0,
          consequencePrevented: true,
        }),
        expect.objectContaining({
          caseId: "consumed_greenlight_replay",
          outcome: "gateway_check_refused",
          reasonCodes: ["already_consumed"],
          mutationAttempted: false,
          signerInvocationsAfterAttempt: 1,
          signedRetryCountAfterAttempt: 1,
          consequencePrevented: true,
        }),
      ],
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
    expect(output.report.evidencePosture.surfaceOperationEvidenceLabels).toContain("signed_retry_recorded");
    expect(output.report.evidencePosture.surfaceOperationEvidenceLabels).toContain(
      "local_reference_downstream_fixture",
    );
    expect(output.report.evidencePosture.surfaceOperationEvidenceRefs).toContain(
      "evidence:x402-local-sandbox-signed-retry:1",
    );
    expect(output.report.evidencePosture.downstreamEvidenceRefs).toContain(
      "evidence:x402-local-sandbox-signed-retry:1",
    );
    expect(output.report.nonClaims).toContain("clearing-house readiness");
    expect(output.report.nonClaims).toContain("aggregate payment-budget management");
    expect(output.report.nonClaims).toContain("role-scoped terminal certificate issuer");
    expect(output.report.missingProofObjects).toContainEqual({
      proofObject: "role-scoped terminal evidence issuer",
      requiredBeforeClaim: "production certificate issuance",
    });
    expect(output.report.missingProofObjects.map((entry: { proofObject: string }) => entry.proofObject)).not.toContain(
      "spend reservation ledger",
    );
    expect(
      output.report.missingProofObjects.map((entry: { requiredBeforeClaim: string }) => entry.requiredBeforeClaim),
    ).not.toContain("session/day/review aggregate spend enforcement");
    expect(JSON.stringify(output.report)).not.toMatch(
      /spend reservation ledger|session\/day\/review aggregate spend enforcement/i,
    );
    expect(JSON.stringify(output.report)).not.toContain(`0x${"a".repeat(130)}`);

    const markdown = await Bun.file(outputMarkdownPath).text();
    expect(markdown).toContain("## Buyer-Readable APS Report");
    expect(markdown).toContain("### Protected Tool Gateway Handoff");
    expect(markdown).toContain("### Actors And Custody");
    expect(markdown).toContain("### Missing Proof Objects");

    const demoSource = await Bun.file(`${repoRoot}/examples/x402-protected-spend/run.ts`).text();
    expect(demoSource).toContain("EvidenceClient");
    expect(demoSource).toContain("InstallClient");
    expect(demoSource).toContain("GatewayClient");
    expect(demoSource).toContain("ControlPlaneClient");
    expect(demoSource).toContain("PolicyClient");
    expect(demoSource).toContain("handshake-protocol-kernel/sdk/role-clients");
    expect(demoSource).toContain("roleClients.installClient.registerInstallProposalCompiledRecords");
    expect(demoSource).toContain("roleClients.gatewayClient.registerGatewayCredentialRef");
    expect(demoSource).toContain("roleClients.controlPlaneClient.registerDelegatedAuthorityRef");
    expect(demoSource).toContain("roleClients.policyClient.evaluatePolicy");
    expect(demoSource).toContain("prepareProtectedX402ToolDispatch");
    expect(demoSource).toContain("roleClients.runtimeClient.proposeRuntimeIngressActionContracts");
    expect(demoSource).toContain("protocol: roleClients.gatewayClient");
    expect(demoSource).toContain("mintLocalReferenceTerminalEvidence");
    expect(demoSource).toContain("includedInStrictProtectedGatewayClaim: false");
    expect(demoSource).not.toContain("kernel.evaluatePolicy");
    expect(demoSource).not.toContain("protocol: kernel");
    expect(demoSource).not.toContain('from "../../src/runtime"');
    expect(demoSource).not.toContain("HandshakeClient");

    const readme = await Bun.file(`${repoRoot}/README.md`).text();
    expect(readme).toContain("npm run demo:aps");
    expect(readme).toContain("examples/x402-protected-spend/output/latest.md");
    expect(readme).toContain("not hosted operation");
    expect(readme).toContain("not broad x402 compatibility");
  });
});
