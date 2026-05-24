import { describe, expect, it } from "bun:test";
import {
  compileX402InstallProposal,
  type X402InstallProposal,
  type X402InstallProposalInput,
} from "../../src/adapters/x402-payment/install-proposal";
import type { ProtocolObjectType, ProtocolStore } from "../../src/protocol/store/port";
import { nowIso } from "../../src/protocol/foundation/ids";
import {
  proposeRuntimeIngressActionContracts,
  runtimeIngressDispatchNodeId,
  type RuntimeIngressObservedDispatch,
} from "../../src/runtime";
import { futureIso, makeKernelFixture, registerFixtureObjects } from "../support/fixtures";
import { packageInstallRuntimeConfig } from "../support/package-install-flow";

const x402Digest = `sha256:${"9".repeat(64)}` as const;
const x402SelectedHeadersDigest = `sha256:${"8".repeat(64)}` as const;
const x402SelectedPaymentRequirementDigest = `sha256:${"7".repeat(64)}` as const;
const x402SdkPackageVersions = {
  "@x402/core": "2.12.0",
  "@x402/evm": "2.12.0",
  "@x402/fetch": "2.12.0",
} as const;

describe("runtime ingress adapter", () => {
  it("observes supported dispatch and proposes a contract without policy or gateway authority", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);

    const result = await proposeRuntimeIngressActionContracts(
      fixture.kernel,
      { packageInstall: packageInstallRuntimeConfig(fixture) },
      {
        principalIntentRef: "intent:install hono through dispatch hook",
        generatedCodeOrSpecRef: "runtime:dispatch-block-supported",
        dispatchBoundaryRef: "dispatch-boundary:codex-tool-dispatch",
        dispatches: [
          {
            dispatchKind: "wrapped_package_install",
            dispatchRef: "dispatch:package-install:1",
            package: "hono",
            versionRange: "^4.12.19",
          },
        ],
      },
    );

    expect(result.outcome).toBe("action_contracts_proposed");
    expect(result.responsePosture).toMatchObject({
      schemaVersion: "handshake.runtime-ingress.outcome.v1",
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
      authorityCertificateMinted: false,
      nextAction: "read_evidence",
      retryability: "not_retryable",
      reasonCodes: [],
      graphCoverageStatus: "fully_covered_no_unsupported_nodes",
    });
    expect(result.runtimeExecution.runtimePosture).toBe("hook_assisted");
    expect(result.runtimeExecution.observedConsequentialCallCount).toBe(1);
    expect(result.generatedExecutionGraph.coverageStatus).toBe("fully_covered_no_unsupported_nodes");
    expect(result.generatedExecutionGraph.nodes[0]?.nodeId).toBe(runtimeIngressDispatchNodeId(1));
    const proposal = result.proposals[0];
    if (!proposal || proposal.outcome !== "action_contract_proposed") throw new Error("expected contract proposal");
    expect(proposal.toolCallDraft.draftState).toBe("finalized");
    expect(proposal.toolCallDraft.generatedExecutionNodeId).toBe(runtimeIngressDispatchNodeId(1));
    expect(proposal.intentCompilation.candidateAction.candidateStatus).toBe("contractable");
    expect(proposal.actionContract.resourceRef).toBe("npm:hono");
    expect(result.responsePosture.actionContractRefs).toEqual([proposal.actionContract.actionContractId]);
    expect(proposal.actionContract.runtimeExecutionId).toBe(result.runtimeExecution.runtimeExecutionId);
    expect(proposal.actionContract.generatedExecutionGraphId).toBe(
      result.generatedExecutionGraph.generatedExecutionGraphId,
    );
    expect(await recordCount(fixture.store, "runtime_execution")).toBe(1);
    expect(await recordCount(fixture.store, "generated_execution_graph")).toBe(1);
    expect(await recordCount(fixture.store, "tool_call_draft")).toBe(1);
    expect(await recordCount(fixture.store, "intent_compilation")).toBe(1);
    expect(await recordCount(fixture.store, "action_contract")).toBe(1);
    expect(await recordCount(fixture.store, "policy_decision")).toBe(0);
    expect(await recordCount(fixture.store, "greenlight")).toBe(0);
    expect(await recordCount(fixture.store, "gateway_check_attempt")).toBe(0);
    expect(await recordCount(fixture.store, "mutation_attempt")).toBe(0);
  });

  it("refuses dynamic tool construction and late-bound parameters before contract proposal", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);

    const result = await proposeRuntimeIngressActionContracts(
      fixture.kernel,
      { packageInstall: packageInstallRuntimeConfig(fixture) },
      {
        principalIntentRef: "intent:install hono through dynamic dispatch",
        generatedCodeOrSpecRef: "runtime:dispatch-block-dynamic",
        dispatchBoundaryRef: "dispatch-boundary:dynamic-tool",
        dispatches: [
          {
            dispatchKind: "wrapped_package_install",
            dispatchRef: "dispatch:package-install:dynamic",
            package: "hono",
            versionRange: "^4.12.19",
            dynamicToolConstructionDetected: true,
            lateBoundParameterRefs: ["argv:package-name"],
          },
        ],
      },
    );

    expect(result.outcome).toBe("one_or_more_dispatches_refused");
    expect(result.responsePosture).toMatchObject({
      authorityCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
      nextAction: "recraft_request",
      retryability: "retryable_after_recraft",
      actionContractRefs: [],
    });
    expect(result.responsePosture.reasonCodes).toEqual(
      expect.arrayContaining([
        "runtime_dynamic_tool_construction_detected",
        "runtime_unobserved_regions_present",
        "generated_execution_graph_not_contractable",
      ]),
    );
    expect(result.runtimeExecution.dynamicToolConstructionDetected).toBe(true);
    expect(result.runtimeExecution.unobservedRegionRefs).toEqual(["argv:package-name"]);
    expect(result.generatedExecutionGraph.coverageStatus).toBe("unsupported_or_ambiguous");
    const proposal = result.proposals[0];
    if (!proposal || proposal.outcome !== "intent_compilation_refused") throw new Error("expected refusal");
    expect(proposal.toolCallDraft.draftState).toBe("finalized");
    expect(proposal.intentCompilation.candidateAction.candidateStatus).toBe("rejected");
    expect(proposal.refusalReasonCodes).toContain("runtime_dynamic_tool_construction_detected");
    expect(proposal.refusalReasonCodes).toContain("runtime_unobserved_regions_present");
    expect(proposal.refusalReasonCodes).toContain("generated_execution_graph_not_contractable");
    expect(proposal.refusalReasonCodes).toContain("generated_execution_node_not_contractable");
    expect(await recordCount(fixture.store, "action_contract")).toBe(0);
    expect(await recordCount(fixture.store, "refusal")).toBe(1);
    expect(await recordCount(fixture.store, "greenlight")).toBe(0);
  });

  it("records loop and retry dispatches with distinct sequence and idempotency evidence", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);

    const result = await proposeRuntimeIngressActionContracts(
      fixture.kernel,
      { packageInstall: packageInstallRuntimeConfig(fixture) },
      {
        principalIntentRef: "intent:retry package install explicitly",
        generatedCodeOrSpecRef: "runtime:dispatch-block-retry",
        dispatchBoundaryRef: "dispatch-boundary:retry-loop",
        dispatches: [
          {
            dispatchKind: "wrapped_package_install",
            dispatchRef: "dispatch:package-install:1",
            package: "hono",
            versionRange: "^4.12.19",
          },
          {
            dispatchKind: "wrapped_package_install",
            dispatchRef: "dispatch:package-install:2",
            retryOfDispatchRef: "dispatch:package-install:1",
            loopIteration: 1,
            package: "hono",
            versionRange: "^4.12.19",
          },
        ],
      },
    );

    expect(result.outcome).toBe("action_contracts_proposed");
    expect(result.responsePosture.reasonCodes).toEqual(
      expect.arrayContaining(["runtime_ingress_loop_detected", "runtime_ingress_retry_detected"]),
    );
    expect(result.responsePosture.nextAction).toBe("read_evidence");
    expect(result.runtimeExecution.loopDetected).toBe(true);
    expect(result.runtimeExecution.retryDetected).toBe(true);
    expect(result.runtimeExecution.executionShape).toBe("tool_dispatch_chain");
    expect(result.generatedExecutionGraph.edges).toEqual([
      {
        fromNodeId: runtimeIngressDispatchNodeId(1),
        toNodeId: runtimeIngressDispatchNodeId(2),
        edgeKind: "retry",
      },
    ]);
    expect(result.proposals.map((proposal) => proposal.sequenceNumber)).toEqual([1, 2]);
    expect(result.proposals.map((proposal) => proposal.actionContract?.idempotencyKey)).toEqual([
      "package-install:run_demo:1:hono",
      "package-install:run_demo:2:hono",
    ]);
    const first = result.proposals[0]?.actionContract;
    const second = result.proposals[1]?.actionContract;
    if (!first || !second) throw new Error("expected two contracts");
    expect(second.requiredPriorActionContractIds).toEqual([first.actionContractId]);
    expect(await recordCount(fixture.store, "action_contract")).toBe(2);
    expect(await recordCount(fixture.store, "greenlight")).toBe(0);
  });

  it("rejects oversized dispatch blocks before recording runtime evidence", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);

    await expect(
      proposeRuntimeIngressActionContracts(
        fixture.kernel,
        { packageInstall: packageInstallRuntimeConfig(fixture) },
        {
          principalIntentRef: "intent:oversized dispatch block",
          generatedCodeOrSpecRef: "runtime:dispatch-block-oversized",
          dispatchBoundaryRef: "dispatch-boundary:oversized",
          dispatches: Array.from({ length: 65 }, (_, index) => ({
            dispatchKind: "wrapped_package_install",
            dispatchRef: `dispatch:package-install:${index}`,
            package: "hono",
            versionRange: "^4.12.19",
          })),
        },
      ),
    ).rejects.toThrow();

    expect(await recordCount(fixture.store, "runtime_execution")).toBe(0);
    expect(await recordCount(fixture.store, "generated_execution_graph")).toBe(0);
    expect(await recordCount(fixture.store, "action_contract")).toBe(0);
    expect(await recordCount(fixture.store, "greenlight")).toBe(0);
  });

  it("records raw sibling bypass evidence and cannot manufacture gateway-checked posture", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);

    const result = await proposeRuntimeIngressActionContracts(
      fixture.kernel,
      { packageInstall: packageInstallRuntimeConfig(fixture) },
      {
        principalIntentRef: "intent:install package outside gateway",
        generatedCodeOrSpecRef: "runtime:dispatch-block-raw-bypass",
        dispatchBoundaryRef: "dispatch-boundary:raw-shell",
        dispatches: [
          {
            dispatchKind: "raw_sibling_package_install",
            dispatchRef: "dispatch:raw-package-install:1",
            rawCommandRef: "shell:bun-add-hono",
            rawCommandSummary: ["bun", "add", "hono"],
            package: "hono",
            versionRange: "^4.12.19",
          },
        ],
      },
    );

    expect(result.outcome).toBe("one_or_more_dispatches_refused");
    expect(result.responsePosture).toMatchObject({
      nextAction: "stop",
      retryability: "not_retryable",
      actionContractRefs: [],
    });
    expect(result.responsePosture.reasonCodes).toContain("runtime_ingress_raw_sibling_bypass");
    expect(result.generatedExecutionGraph.coverageStatus).toBe("contains_bypass_risk");
    expect(result.generatedExecutionGraph.terminalReasonCodes).toContain("runtime_ingress_raw_sibling_bypass");
    expect(result.generatedExecutionGraph.terminalReasonCodes).toContain("generated_execution_node_bypass_risk");
    expect(result.generatedExecutionGraph.terminalReasonCodes).toContain(
      "generated_execution_command_risk_bypass_detected",
    );
    const proposal = result.proposals[0];
    if (!proposal || proposal.outcome !== "intent_compilation_refused") throw new Error("expected refusal");
    expect(proposal.intentCompilation.candidateAction.generatedExecutionCoverageStatus).toBe("contains_bypass_risk");
    expect(proposal.refusalReasonCodes).toContain("generated_execution_graph_not_contractable");
    expect(proposal.refusalReasonCodes).toContain("generated_execution_node_not_contractable");
    expect(await recordCount(fixture.store, "action_contract")).toBe(0);
    expect(await recordCount(fixture.store, "protected_path_posture")).toBe(0);
    expect(await recordCount(fixture.store, "gateway_check_attempt")).toBe(0);
    expect(await recordCount(fixture.store, "mutation_attempt")).toBe(0);
  });

  it("turns truncated graph coverage into refusal instead of best-effort authority", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);

    const result = await proposeRuntimeIngressActionContracts(
      fixture.kernel,
      { packageInstall: packageInstallRuntimeConfig(fixture) },
      {
        principalIntentRef: "intent:install from partial graph",
        generatedCodeOrSpecRef: "runtime:dispatch-block-truncated",
        dispatchBoundaryRef: "dispatch-boundary:partial",
        truncationStatus: "truncated",
        dispatches: [
          {
            dispatchKind: "wrapped_package_install",
            dispatchRef: "dispatch:package-install:partial",
            package: "hono",
            versionRange: "^4.12.19",
          },
        ],
      },
    );

    expect(result.outcome).toBe("one_or_more_dispatches_refused");
    expect(result.generatedExecutionGraph.coverageStatus).toBe("contains_coverage_gap");
    expect(result.generatedExecutionGraph.terminalReasonCodes).toContain("generated_execution_graph_truncated");
    const proposal = result.proposals[0];
    if (!proposal || proposal.outcome !== "intent_compilation_refused") throw new Error("expected refusal");
    expect(proposal.refusalReasonCodes).toContain("generated_execution_graph_not_contractable");
    expect(await recordCount(fixture.store, "action_contract")).toBe(0);
    expect(await recordCount(fixture.store, "refusal")).toBe(1);
  });

  it("observes supported x402 payment dispatch and proposes a contract without authority", async () => {
    const { fixture, runtimeConfig, proposal } = await installedX402IngressFixture();

    const result = await proposeRuntimeIngressActionContracts(
      fixture.kernel,
      { x402Payment: runtimeConfig },
      {
        principalIntentRef: "intent:fetch paid context through x402",
        generatedCodeOrSpecRef: "runtime:dispatch-block-x402",
        dispatchBoundaryRef: "dispatch-boundary:x402-fetch",
        dispatches: [x402Dispatch(proposal, "dispatch:x402-payment:1", upstreamX402DispatchBinding(proposal))],
      },
    );

    expect(result.outcome).toBe("action_contracts_proposed");
    expect(result.generatedExecutionGraph.supportedGrammarVersion).toBe("runtime-dispatch-x402-payment-0.1");
    const contract = result.proposals[0]?.actionContract;
    if (!contract) throw new Error("expected x402 action contract");
    expect(contract.actionClass).toBe("x402_payment.exact");
    expect(contract.resourceRef).toBe(proposal.resourceRef);
    expect(contract.parameters).toMatchObject({
      endpointDomain: "api.example.com",
      payee: "0xpayee",
      network: "base-sepolia",
      token: "USDC",
      atomicAmount: "2500",
      intendedHttpMethod: "GET",
      intendedRequestUrl: proposal.endpointEvidence.endpointUrl,
      intendedRequestBodyDigest: null,
      selectedHeadersDigest: x402SelectedHeadersDigest,
      x402Version: 2,
      x402Scheme: "exact",
      asset: "USDC",
      payTo: "0xpayee",
      maxTimeoutSeconds: 60,
      selectedPaymentRequirementDigest: x402SelectedPaymentRequirementDigest,
      sdkPackageVersions: x402SdkPackageVersions,
      extensionKeys: ["payment-identifier"],
    });
    expect(result.runtimeExecution.evidenceRefs).toContain("evidence:x402-payment-required");
    expect(result.proposals[0]?.toolCallDraft.evidenceRefs).toContain("evidence:x402-payment-required");
    expect(JSON.stringify(result)).not.toContain("PAYMENT-SIGNATURE");
    expect(JSON.stringify(result)).not.toContain("PaymentPayload");
    expect(await recordCount(fixture.store, "runtime_execution")).toBe(1);
    expect(await recordCount(fixture.store, "generated_execution_graph")).toBe(1);
    expect(await recordCount(fixture.store, "tool_call_draft")).toBe(1);
    expect(await recordCount(fixture.store, "action_contract")).toBe(1);
    await expectNoRuntimeAuthorityRecords(fixture.store);
  });

  it("refuses dynamic x402 payment dispatch before contract proposal", async () => {
    const { fixture, runtimeConfig, proposal } = await installedX402IngressFixture();

    const result = await proposeRuntimeIngressActionContracts(
      fixture.kernel,
      { x402Payment: runtimeConfig },
      {
        principalIntentRef: "intent:fetch paid context through dynamic x402",
        generatedCodeOrSpecRef: "runtime:dispatch-block-x402-dynamic",
        dispatchBoundaryRef: "dispatch-boundary:x402-dynamic",
        dispatches: [
          {
            dispatchKind: "wrapped_x402_payment",
            dispatchRef: "dispatch:x402-payment:dynamic",
            endpointUrl: proposal.endpointEvidence.endpointUrl,
            payee: proposal.endpointEvidence.payee,
            network: proposal.endpointEvidence.network,
            token: proposal.endpointEvidence.token,
            atomicAmount: "2500",
            paymentRequirementsDigest: proposal.endpointEvidence.paymentRequirementsDigest,
            dynamicToolConstructionDetected: true,
            lateBoundParameterRefs: ["x402:payment-requirements"],
          },
        ],
      },
    );

    expect(result.outcome).toBe("one_or_more_dispatches_refused");
    expect(result.generatedExecutionGraph.coverageStatus).toBe("unsupported_or_ambiguous");
    const proposalResult = result.proposals[0];
    if (!proposalResult || proposalResult.outcome !== "intent_compilation_refused") throw new Error("expected refusal");
    expect(proposalResult.refusalReasonCodes).toContain("runtime_dynamic_tool_construction_detected");
    expect(proposalResult.refusalReasonCodes).toContain("runtime_unobserved_regions_present");
    expect(proposalResult.refusalReasonCodes).toContain("generated_execution_graph_not_contractable");
    expect(await recordCount(fixture.store, "action_contract")).toBe(0);
    await expectNoRuntimeAuthorityRecords(fixture.store);
  });

  it("refuses ambiguous x402 payment dispatch as unknown consequential behavior", async () => {
    const { fixture, runtimeConfig, proposal } = await installedX402IngressFixture();

    const result = await proposeRuntimeIngressActionContracts(
      fixture.kernel,
      { x402Payment: runtimeConfig },
      {
        principalIntentRef: "intent:pay through unresolved x402 helper",
        generatedCodeOrSpecRef: "runtime:dispatch-block-x402-ambiguous",
        dispatchBoundaryRef: "dispatch-boundary:x402-ambiguous",
        dispatches: [
          {
            dispatchKind: "ambiguous_x402_payment",
            dispatchRef: "dispatch:x402-payment:ambiguous",
            ambiguousReasonCodes: ["runtime_ingress_unknown_consequential_dispatch"],
            endpointUrl: proposal.endpointEvidence.endpointUrl,
            payee: proposal.endpointEvidence.payee,
            network: proposal.endpointEvidence.network,
            token: proposal.endpointEvidence.token,
            atomicAmount: "2500",
            paymentRequirementsDigest: proposal.endpointEvidence.paymentRequirementsDigest,
          },
        ],
      },
    );

    expect(result.outcome).toBe("one_or_more_dispatches_refused");
    expect(result.generatedExecutionGraph.coverageStatus).toBe("unsupported_or_ambiguous");
    expect(result.generatedExecutionGraph.nodes[0]?.unsupportedReasonCodes).toContain(
      "runtime_ingress_unknown_consequential_dispatch",
    );
    const proposalResult = result.proposals[0];
    if (!proposalResult || proposalResult.outcome !== "intent_compilation_refused") throw new Error("expected refusal");
    expect(proposalResult.refusalReasonCodes).toContain("generated_execution_graph_not_contractable");
    expect(proposalResult.refusalReasonCodes).toContain("generated_execution_node_not_contractable");
    expect(await recordCount(fixture.store, "action_contract")).toBe(0);
    await expectNoRuntimeAuthorityRecords(fixture.store);
  });

  it("records raw sibling x402 payment bypass evidence without gateway-checked posture", async () => {
    const { fixture, runtimeConfig, proposal } = await installedX402IngressFixture();

    const result = await proposeRuntimeIngressActionContracts(
      fixture.kernel,
      { x402Payment: runtimeConfig },
      {
        principalIntentRef: "intent:sign x402 outside gateway",
        generatedCodeOrSpecRef: "runtime:dispatch-block-x402-raw",
        dispatchBoundaryRef: "dispatch-boundary:x402-raw",
        dispatches: [
          {
            dispatchKind: "raw_sibling_x402_payment",
            dispatchRef: "dispatch:x402-payment:raw",
            rawCommandRef: "shell:x402-fetch",
            rawCommandSummary: ["x402-fetch", "https://api.example.com/mcp/premium-context"],
            endpointUrl: proposal.endpointEvidence.endpointUrl,
            payee: proposal.endpointEvidence.payee,
            network: proposal.endpointEvidence.network,
            token: proposal.endpointEvidence.token,
            atomicAmount: "2500",
            paymentRequirementsDigest: proposal.endpointEvidence.paymentRequirementsDigest,
          },
        ],
      },
    );

    expect(result.outcome).toBe("one_or_more_dispatches_refused");
    expect(result.generatedExecutionGraph.coverageStatus).toBe("contains_bypass_risk");
    expect(result.generatedExecutionGraph.terminalReasonCodes).toContain("runtime_ingress_raw_sibling_bypass");
    const proposalResult = result.proposals[0];
    if (!proposalResult || proposalResult.outcome !== "intent_compilation_refused") throw new Error("expected refusal");
    expect(proposalResult.refusalReasonCodes).toContain("generated_execution_graph_not_contractable");
    expect(await recordCount(fixture.store, "action_contract")).toBe(0);
    expect(await recordCount(fixture.store, "protected_path_posture")).toBe(0);
    await expectNoRuntimeAuthorityRecords(fixture.store);
  });

  it("records direct MCP x402 mutation attempts as bypass evidence", async () => {
    const { fixture, runtimeConfig, proposal } = await installedX402IngressFixture();

    const result = await proposeRuntimeIngressActionContracts(
      fixture.kernel,
      { x402Payment: runtimeConfig },
      {
        principalIntentRef: "intent:pay through direct MCP route",
        generatedCodeOrSpecRef: "runtime:dispatch-block-x402-direct-mcp",
        dispatchBoundaryRef: "dispatch-boundary:x402-direct-mcp",
        dispatches: [
          {
            dispatchKind: "raw_sibling_x402_payment",
            dispatchRef: "dispatch:x402-payment:mcp-direct",
            rawCommandRef: "mcp:x402.directPayment",
            rawCommandSummary: ["mcp.invoke", "x402.directPayment", "https://api.example.com/mcp/premium-context"],
            endpointUrl: proposal.endpointEvidence.endpointUrl,
            payee: proposal.endpointEvidence.payee,
            network: proposal.endpointEvidence.network,
            token: proposal.endpointEvidence.token,
            atomicAmount: "2500",
            paymentRequirementsDigest: proposal.endpointEvidence.paymentRequirementsDigest,
          },
        ],
      },
    );

    expect(result.outcome).toBe("one_or_more_dispatches_refused");
    expect(result.generatedExecutionGraph.coverageStatus).toBe("contains_bypass_risk");
    expect(result.generatedExecutionGraph.nodes[0]?.commandRiskBypassRefs).toContain("mcp:x402.directPayment");
    expect(result.generatedExecutionGraph.terminalReasonCodes).toContain("runtime_ingress_raw_sibling_bypass");
    const proposalResult = result.proposals[0];
    if (!proposalResult || proposalResult.outcome !== "intent_compilation_refused") throw new Error("expected refusal");
    expect(proposalResult.refusalReasonCodes).toContain("generated_execution_graph_not_contractable");
    expect(await recordCount(fixture.store, "action_contract")).toBe(0);
    await expectNoRuntimeAuthorityRecords(fixture.store);
  });

  it("records x402 retry attempts with distinct sequence and idempotency evidence", async () => {
    const { fixture, runtimeConfig, proposal } = await installedX402IngressFixture();

    const result = await proposeRuntimeIngressActionContracts(
      fixture.kernel,
      { x402Payment: runtimeConfig },
      {
        principalIntentRef: "intent:retry x402 payment explicitly",
        generatedCodeOrSpecRef: "runtime:dispatch-block-x402-retry",
        dispatchBoundaryRef: "dispatch-boundary:x402-retry",
        dispatches: [
          x402Dispatch(proposal, "dispatch:x402-payment:1"),
          {
            ...x402Dispatch(proposal, "dispatch:x402-payment:2"),
            retryOfDispatchRef: "dispatch:x402-payment:1",
            loopIteration: 1,
          },
        ],
      },
    );

    expect(result.outcome).toBe("action_contracts_proposed");
    expect(result.runtimeExecution.loopDetected).toBe(true);
    expect(result.runtimeExecution.retryDetected).toBe(true);
    expect(result.proposals.map((item) => item.sequenceNumber)).toEqual([1, 2]);
    const first = result.proposals[0]?.actionContract;
    const second = result.proposals[1]?.actionContract;
    if (!first || !second) throw new Error("expected two x402 contracts");
    expect(first.idempotencyKey).toStartWith("x402-payment:");
    expect(second.idempotencyKey).toStartWith("x402-payment:");
    expect(second.idempotencyKey).not.toBe(first.idempotencyKey);
    expect(second.requiredPriorActionContractIds).toEqual([first.actionContractId]);
    expect(await recordCount(fixture.store, "action_contract")).toBe(2);
    await expectNoRuntimeAuthorityRecords(fixture.store);
  });

  it("records changed-parameter x402 retries as separate per-call attempts, not aggregate spend authority", async () => {
    const { fixture, runtimeConfig, proposal } = await installedX402IngressFixture();

    const result = await proposeRuntimeIngressActionContracts(
      fixture.kernel,
      { x402Payment: runtimeConfig },
      {
        principalIntentRef: "intent:retry x402 payment with changed amount",
        generatedCodeOrSpecRef: "runtime:dispatch-block-x402-changed-retry",
        dispatchBoundaryRef: "dispatch-boundary:x402-changed-retry",
        dispatches: [
          x402Dispatch(proposal, "dispatch:x402-payment:changed-1", { atomicAmount: "2000" }),
          x402Dispatch(proposal, "dispatch:x402-payment:changed-2", {
            atomicAmount: "2500",
            retryOfDispatchRef: "dispatch:x402-payment:changed-1",
            loopIteration: 1,
          }),
        ],
      },
    );

    expect(result.outcome).toBe("action_contracts_proposed");
    expect(result.runtimeExecution.loopDetected).toBe(true);
    expect(result.runtimeExecution.retryDetected).toBe(true);
    const first = result.proposals[0]?.actionContract;
    const second = result.proposals[1]?.actionContract;
    if (!first || !second) throw new Error("expected two x402 contracts");
    expect(first.parameters).toMatchObject({ atomicAmount: "2000" });
    expect(second.parameters).toMatchObject({ atomicAmount: "2500" });
    expect(second.idempotencyKey).not.toBe(first.idempotencyKey);
    expect(second.requiredPriorActionContractIds).toEqual([first.actionContractId]);
    expect(await recordCount(fixture.store, "action_contract")).toBe(2);
    await expectNoRuntimeAuthorityRecords(fixture.store);
  });

  it("turns truncated x402 graph coverage into refusal", async () => {
    const { fixture, runtimeConfig, proposal } = await installedX402IngressFixture();

    const result = await proposeRuntimeIngressActionContracts(
      fixture.kernel,
      { x402Payment: runtimeConfig },
      {
        principalIntentRef: "intent:x402 from partial graph",
        generatedCodeOrSpecRef: "runtime:dispatch-block-x402-truncated",
        dispatchBoundaryRef: "dispatch-boundary:x402-partial",
        truncationStatus: "truncated",
        dispatches: [x402Dispatch(proposal, "dispatch:x402-payment:partial")],
      },
    );

    expect(result.outcome).toBe("one_or_more_dispatches_refused");
    expect(result.generatedExecutionGraph.coverageStatus).toBe("contains_coverage_gap");
    expect(result.generatedExecutionGraph.terminalReasonCodes).toContain("generated_execution_graph_truncated");
    const proposalResult = result.proposals[0];
    if (!proposalResult || proposalResult.outcome !== "intent_compilation_refused") throw new Error("expected refusal");
    expect(proposalResult.refusalReasonCodes).toContain("generated_execution_graph_not_contractable");
    expect(await recordCount(fixture.store, "action_contract")).toBe(0);
    await expectNoRuntimeAuthorityRecords(fixture.store);
  });
});

async function recordCount(store: ProtocolStore, objectType: ProtocolObjectType): Promise<number> {
  return (await store.listRecordsByType(objectType)).length;
}

async function expectNoRuntimeAuthorityRecords(store: ProtocolStore): Promise<void> {
  for (const objectType of [
    "policy_decision",
    "greenlight",
    "gateway_check_attempt",
    "mutation_attempt",
    "receipt",
    "authority_certificate",
  ] as const) {
    expect(await recordCount(store, objectType)).toBe(0);
  }
}

async function installedX402IngressFixture() {
  const fixture = makeKernelFixture();
  const proposal = await compileX402InstallProposal(validX402InstallInput());
  const records = requireX402Records(proposal);
  await fixture.kernel.putCatalogObject({ objectType: "tool_capability", payload: records.toolCapability });
  await fixture.kernel.putCatalogObject({ objectType: "action_type", payload: records.actionType });
  await fixture.kernel.putCatalogObject({
    objectType: "gateway_registry_entry",
    payload: records.gatewayRegistryEntry,
  });
  await fixture.kernel.putCatalogObject({ objectType: "operating_envelope", payload: records.operatingEnvelope });
  return {
    fixture,
    proposal,
    records,
    runtimeConfig: {
      tenantId: proposal.tenantId,
      organizationId: proposal.organizationId,
      principalId: records.operatingEnvelope.principalId,
      agentId: records.operatingEnvelope.agentId,
      runId: "run_x402_runtime_ingress",
      runtimeAdapterId: records.toolCapability.runtimeAdapterId,
      operatingEnvelopeId: records.operatingEnvelope.envelopeId,
      toolCatalogRef: `${records.toolCapability.toolCatalogId}@${records.toolCapability.toolCatalogVersion}`,
      actionCatalogRef: `${records.actionType.actionCatalogId}@${records.actionType.actionCatalogVersion}`,
      gatewayRegistryRef: `gateway_registry@${records.gatewayRegistryEntry.gatewayRegistryVersion}`,
      toolCapabilityId: records.toolCapability.toolCapabilityId,
      actionTypeId: records.actionType.actionTypeId,
      gatewayRegistryEntryId: records.gatewayRegistryEntry.gatewayRegistryEntryId,
      gatewayId: records.gatewayRegistryEntry.gatewayId,
      maxAtomicAmountPerCall: proposal.spendBounds.maxAtomicAmountPerCall,
      contractExpiresAt: futureIso(),
      signingSecret: "test-secret",
    },
  };
}

type WrappedX402Dispatch = Extract<RuntimeIngressObservedDispatch, { dispatchKind: "wrapped_x402_payment" }>;

function x402Dispatch(
  proposal: X402InstallProposal,
  dispatchRef: string,
  overrides: Partial<WrappedX402Dispatch> = {},
): WrappedX402Dispatch {
  return {
    dispatchKind: "wrapped_x402_payment" as const,
    dispatchRef,
    endpointUrl: proposal.endpointEvidence.endpointUrl,
    payee: proposal.endpointEvidence.payee,
    network: proposal.endpointEvidence.network,
    token: proposal.endpointEvidence.token,
    atomicAmount: "2500",
    paymentRequirementsDigest: proposal.endpointEvidence.paymentRequirementsDigest,
    paymentRequiredEvidenceRef: "evidence:x402-payment-required",
    ...overrides,
  };
}

function upstreamX402DispatchBinding(proposal: X402InstallProposal): Partial<WrappedX402Dispatch> {
  return {
    intendedHttpMethod: "GET",
    intendedRequestUrl: proposal.endpointEvidence.endpointUrl,
    intendedRequestBodyDigest: null,
    selectedHeadersDigest: x402SelectedHeadersDigest,
    x402Version: 2,
    x402Scheme: "exact",
    asset: proposal.endpointEvidence.token,
    payTo: proposal.endpointEvidence.payee,
    maxTimeoutSeconds: 60,
    selectedPaymentRequirementDigest: x402SelectedPaymentRequirementDigest,
    sdkPackageVersions: x402SdkPackageVersions,
    extensionKeys: ["payment-identifier"],
    evidenceRefs: ["evidence:x402-payment-required"],
  };
}

function requireX402Records(proposal: X402InstallProposal): NonNullable<X402InstallProposal["compiledRecords"]> {
  if (!proposal.compiledRecords) throw new Error("expected installable x402 proposal");
  return proposal.compiledRecords;
}

function validX402InstallInput(): X402InstallProposalInput {
  const createdAt = nowIso();
  return {
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt,
    endpointEvidence: {
      endpointUrl: "https://api.example.com/mcp/premium-context",
      payee: "0xpayee",
      network: "base-sepolia",
      token: "USDC",
      maxAtomicAmount: "2500",
      paymentRequirementsDigest: x402Digest,
      facilitatorRef: "facilitator:local",
      evidenceRefs: ["evidence:x402-payment-required"],
    },
    walletGatewayProfile: {
      walletGatewayId: "wallet_gateway_local",
      gatewayId: "gateway_x402_wallet",
      signerCustodyStatus: "gateway_held",
      signerRef: "secretref:x402-wallet-gateway",
      authorityHolderRef: "gateway-authority:x402-wallet",
      supportedNetworks: ["base-sepolia"],
      supportedTokens: ["USDC"],
    },
    spendBounds: {
      principalId: "principal_demo",
      agentId: "agent_demo",
      runtimeAdapterId: "runtime_codex",
      objectiveRef: "intent:fetch paid context",
      allowedDomains: ["api.example.com"],
      allowedPayees: ["0xpayee"],
      allowedNetworks: ["base-sepolia"],
      allowedTokens: ["USDC"],
      maxAtomicAmountPerCall: "2500",
      maxAtomicAmountPerSession: "10000",
      maxAtomicAmountPerDay: "20000",
      reviewThresholdAtomicAmount: "5000",
      spendWindowEnforcementStatus: "not_enforced_local_metadata",
      issuedAt: createdAt,
      expiresAt: futureIso(),
    },
  };
}
