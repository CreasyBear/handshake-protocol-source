import { describe, expect, it } from "bun:test";
import { HandshakeProtocolError } from "../../src/protocol/foundation/errors";
import { digestCanonical } from "../../src/protocol/foundation/canonical";
import type { Refusal } from "../../src/protocol/public/schemas";
import {
  makeKernelFixture,
  makePackageInstallCandidate,
  proposalInputForCompilation,
  registerFixtureObjects,
} from "../support/fixtures";

describe("Handshake kernel invariants: compilation and contracts", () => {
  it("records compiler uncertainty when catalog and gateway records are not durable", async () => {
    const fixture = makeKernelFixture();

    const compilation = await fixture.kernel.compileIntent({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:install hono",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      operatingEnvelopeId: "env_demo",
      toolCatalogRef: "tool_catalog_demo@v1",
      actionCatalogRef: "action_catalog_demo@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      candidate: makePackageInstallCandidate(fixture, {
        toolCapabilityId: "tool_not_registered",
        actionTypeId: "atype_not_registered",
        gatewayRegistryEntryId: "gateway_not_registered",
      }),
    });

    expect(compilation.uncertaintyMarkers).toEqual([
      "unknown_tool_capability",
      "unknown_action_type",
      "unknown_gateway_registry_entry",
      "unknown_operating_envelope",
    ]);
  });

  it("records runtime execution evidence without minting authority", async () => {
    const fixture = makeKernelFixture();
    const executionBlockDigest = await digestCanonical({ code: "await tools.package.install({ package: 'hono' })" });

    const runtimeExecution = await fixture.kernel.createRuntimeExecution({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:install hono",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      executionShape: "codemode_block",
      runtimePosture: "bounded_generation",
      executionBlockRef: "codemode:block:1",
      executionBlockDigest,
      generatedCodeOrSpecRefs: ["code:codemode-block"],
      allowedToolCapabilityIds: [fixture.tool.toolCapabilityId],
      observedToolCallRefs: ["tool-call:package-install"],
      observedConsequentialCallCount: 1,
      loopDetected: false,
      retryDetected: false,
      branchDetected: true,
      dynamicToolConstructionDetected: false,
      unobservedRegionRefs: [],
      accessPosture: "controlled_outbound",
      uncertaintyMarkers: ["branch_condition_observed"],
      refusalReasonCodes: [],
      evidenceRefs: ["trace:codemode-block"],
    });

    expect(runtimeExecution.executionShape).toBe("codemode_block");
    expect(runtimeExecution.runtimeExecutionDigest).toMatch(/^sha256:/);
    expect(fixture.store.countRecordsOfType("runtime_execution")).toBe(1);
    expect(fixture.store.countRecordsOfType("policy_decision")).toBe(0);
    expect(fixture.store.countRecordsOfType("greenlight")).toBe(0);
    expect(fixture.store.countRecordsOfType("gateway_check_attempt")).toBe(0);
  });

  it("requires graph evidence before compiling observed tool-dispatch chains", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const runtimeExecution = await fixture.kernel.createRuntimeExecution({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:install hono through observed dispatch chain",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      executionShape: "tool_dispatch_chain",
      runtimePosture: "hook_assisted",
      executionBlockRef: "dispatch-boundary:package-install",
      executionBlockDigest: await digestCanonical({ dispatches: ["package.install", "package.install"] }),
      observedToolCallRefs: ["dispatch:package-install:1", "dispatch:package-install:2"],
      observedConsequentialCallCount: 2,
      loopDetected: true,
      retryDetected: true,
      branchDetected: false,
      dynamicToolConstructionDetected: false,
      unobservedRegionRefs: [],
      accessPosture: "controlled_outbound",
    });

    const compilation = await fixture.kernel.compileIntent({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:install hono through observed dispatch chain",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      operatingEnvelopeId: fixture.envelope.envelopeId,
      toolCatalogRef: "tool_catalog_demo@v1",
      actionCatalogRef: "action_catalog_demo@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      runtimeExecutionId: runtimeExecution.runtimeExecutionId,
      candidate: makePackageInstallCandidate(fixture, { idempotencyKey: "idem_dispatch_chain" }),
    });

    expect(compilation.candidateAction.candidateStatus).toBe("rejected");
    expect(compilation.overreachReasonCodes).toContain("generated_execution_graph_missing");
    expect(fixture.store.countRecordsOfType("action_contract")).toBe(0);
  });

  it("links multiple compilations to one runtime block and refuses dynamic tool construction", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const runtimeExecution = await fixture.kernel.createRuntimeExecution({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:install hono",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      executionShape: "codemode_block",
      runtimePosture: "bounded_generation",
      executionBlockRef: "codemode:block:multi",
      executionBlockDigest: await digestCanonical({ code: "for (const p of packages) await tools[p.tool](p)" }),
      generatedCodeOrSpecRefs: ["code:codemode-multi"],
      allowedToolCapabilityIds: [fixture.tool.toolCapabilityId],
      observedToolCallRefs: ["tool-call:package-install:1", "tool-call:package-install:2"],
      observedConsequentialCallCount: 2,
      loopDetected: true,
      retryDetected: false,
      branchDetected: false,
      dynamicToolConstructionDetected: false,
      unobservedRegionRefs: [],
      accessPosture: "controlled_outbound",
    });

    const first = await fixture.kernel.compileIntent({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:install hono",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      operatingEnvelopeId: fixture.envelope.envelopeId,
      toolCatalogRef: "tool_catalog_demo@v1",
      actionCatalogRef: "action_catalog_demo@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      runtimeExecutionId: runtimeExecution.runtimeExecutionId,
      candidate: makePackageInstallCandidate(fixture, { idempotencyKey: "idem_runtime_one" }),
    });
    const second = await fixture.kernel.compileIntent({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:install hono",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      operatingEnvelopeId: fixture.envelope.envelopeId,
      toolCatalogRef: "tool_catalog_demo@v1",
      actionCatalogRef: "action_catalog_demo@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      runtimeExecutionId: runtimeExecution.runtimeExecutionId,
      candidate: makePackageInstallCandidate(fixture, { idempotencyKey: "idem_runtime_two", sequenceNumber: 2 }),
    });

    expect(first.runtimeExecutionId).toBe(runtimeExecution.runtimeExecutionId);
    expect(second.runtimeExecutionDigest).toBe(runtimeExecution.runtimeExecutionDigest);

    const dynamicRuntime = await fixture.kernel.createRuntimeExecution({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:dynamic tool",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      executionShape: "codemode_block",
      runtimePosture: "bounded_generation",
      executionBlockRef: "codemode:block:dynamic",
      executionBlockDigest: await digestCanonical({ code: "await tools[name](args)" }),
      observedConsequentialCallCount: 1,
      dynamicToolConstructionDetected: true,
      accessPosture: "controlled_outbound",
    });
    const rejected = await fixture.kernel.compileIntent({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:dynamic tool",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      operatingEnvelopeId: fixture.envelope.envelopeId,
      toolCatalogRef: "tool_catalog_demo@v1",
      actionCatalogRef: "action_catalog_demo@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      runtimeExecutionId: dynamicRuntime.runtimeExecutionId,
      candidate: makePackageInstallCandidate(fixture, { idempotencyKey: "idem_dynamic_tool" }),
    });

    expect(rejected.candidateAction.candidateStatus).toBe("rejected");
    expect(rejected.overreachReasonCodes).toContain("runtime_dynamic_tool_construction_detected");
  });

  it("does not emit an action contract when compilation has an unwrapped consequential tool", async () => {
    const fixture = makeKernelFixture();
    const unsafeTool = { ...fixture.tool, wrapperStatus: "unwrapped" as const };
    await registerFixtureObjects({ ...fixture, tool: unsafeTool });

    const compilation = await fixture.kernel.compileIntent({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:install hono",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      operatingEnvelopeId: "env_demo",
      toolCatalogRef: "tool_catalog_demo@v1",
      actionCatalogRef: "action_catalog_demo@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      candidate: makePackageInstallCandidate(
        { ...fixture, tool: unsafeTool },
        {
          toolCapabilityId: unsafeTool.toolCapabilityId,
        },
      ),
    });

    await expect(
      fixture.kernel.proposeActionContract({
        intentCompilationId: compilation.intentCompilationId,
        candidateActionId: compilation.candidateAction.candidateActionId,
        candidateDigest: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
        signingSecret: "test-secret",
      }),
    ).rejects.toThrow(HandshakeProtocolError);

    const refusals = await fixture.store.listRecordsByType<Refusal>("refusal");
    expect(refusals).toHaveLength(1);
    expect(refusals[0]?.payload).toMatchObject({
      phase: "compilation",
      actionContractId: null,
      policyDecisionId: null,
      greenlightId: null,
      gateAttemptId: null,
      refusedObjectRef: `intent_compilation:${compilation.intentCompilationId}`,
      reasonCode: "unwrapped_consequential_tool",
      mutationAttempted: false,
      authorityCreated: false,
    });
    expect(fixture.store.countRecordsOfType("action_contract")).toBe(0);
  });

  it("refuses contracts whose gateway does not match the durable registry entry", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const compilation = await fixture.kernel.compileIntent({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:install hono",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      operatingEnvelopeId: "env_demo",
      toolCatalogRef: "tool_catalog_demo@v1",
      actionCatalogRef: "action_catalog_demo@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      candidate: makePackageInstallCandidate(fixture, { gatewayId: "gateway_forged" }),
    });

    await expect(
      fixture.kernel.proposeActionContract({
        intentCompilationId: compilation.intentCompilationId,
        candidateActionId: compilation.candidateAction.candidateActionId,
        candidateDigest: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
        signingSecret: "test-secret",
      }),
    ).rejects.toThrow("Candidate is rejected");
  });

  it("refuses proposal when the caller supplies a mismatched candidate digest", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const compilation = await fixture.kernel.compileIntent({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:install hono",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      operatingEnvelopeId: fixture.envelope.envelopeId,
      toolCatalogRef: "tool_catalog_demo@v1",
      actionCatalogRef: "action_catalog_demo@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      candidate: makePackageInstallCandidate(fixture),
    });

    await expect(
      fixture.kernel.proposeActionContract({
        intentCompilationId: compilation.intentCompilationId,
        candidateActionId: compilation.candidateAction.candidateActionId,
        candidateDigest: "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      }),
    ).rejects.toThrow("candidateDigest must match");
  });

  it("derives authority-bearing action contract fields from the compiled candidate", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const compilation = await fixture.kernel.compileIntent({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:install hono",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      operatingEnvelopeId: fixture.envelope.envelopeId,
      toolCatalogRef: "tool_catalog_demo@v1",
      actionCatalogRef: "action_catalog_demo@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      candidate: makePackageInstallCandidate(fixture, {
        parameters: { package: "hono", versionRange: "^4.12.19", installMode: "dev" },
        nonSecretParamsSummary: { package: "hono", versionRange: "^4.12.19", installMode: "dev" },
        bounds: { maxPackages: 1, devDependency: true },
      }),
    });

    const contract = await fixture.kernel.proposeActionContract(proposalInputForCompilation(compilation));
    const candidateDigest = compilation.candidateAction.candidateDigest;
    if (!candidateDigest) throw new Error("expected contractable candidate digest");

    expect(contract.candidateActionId).toBe(compilation.candidateAction.candidateActionId);
    expect(contract.candidateDigest).toBe(candidateDigest);
    expect(contract.gatewayId).toBe(compilation.candidateAction.gatewayId);
    expect(contract.resourceRef).toBe(compilation.candidateAction.resourceRef);
    expect(contract.parameters).toEqual(compilation.candidateAction.parameters);
    expect(contract.paramsDigest).toBe(compilation.candidateAction.paramsDigest);
  });

  it("keeps bootstrap catalog and envelope registration idempotent for same digest and rejects same-id replacement", async () => {
    const fixture = makeKernelFixture();

    await fixture.kernel.putCatalogObject({ objectType: "tool_capability", payload: fixture.tool });
    await fixture.kernel.putCatalogObject({ objectType: "tool_capability", payload: fixture.tool });
    expect(fixture.store.countRecordsOfType("tool_capability")).toBe(1);

    await expect(
      fixture.kernel.putCatalogObject({
        objectType: "tool_capability",
        payload: { ...fixture.tool, toolCatalogVersion: "v2" },
      }),
    ).rejects.toThrow("immutable by object id");
  });

  it("rejects secret-bearing top-level parameters and stores only secret refs plus non-secret params", async () => {
    const fixture = makeKernelFixture();
    const secretAwareTool = { ...fixture.tool, secretBearingFields: ["authToken"] };
    await registerFixtureObjects({ ...fixture, tool: secretAwareTool });

    await expect(
      fixture.kernel.compileIntent({
        tenantId: "tenant_demo",
        organizationId: "org_demo",
        principalIntentRef: "intent:install hono with token",
        principalId: "principal_demo",
        agentId: "agent_demo",
        runId: "run_demo",
        runtimeAdapterId: "runtime_codex",
        operatingEnvelopeId: fixture.envelope.envelopeId,
        toolCatalogRef: "tool_catalog_demo@v1",
        actionCatalogRef: "action_catalog_demo@v1",
        gatewayRegistryRef: "gateway_registry@v1",
        candidate: makePackageInstallCandidate(
          { ...fixture, tool: secretAwareTool },
          {
            parameters: { package: "hono", versionRange: "^4.12.19", authToken: "raw-token-value" },
            nonSecretParamsSummary: { package: "hono", versionRange: "^4.12.19" },
            secretRefs: { authToken: "secretref:package-manager-token" },
          },
        ),
      }),
    ).rejects.toThrow("Secret-bearing parameter authToken");

    const compilation = await fixture.kernel.compileIntent({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:install hono with token ref",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      operatingEnvelopeId: fixture.envelope.envelopeId,
      toolCatalogRef: "tool_catalog_demo@v1",
      actionCatalogRef: "action_catalog_demo@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      candidate: makePackageInstallCandidate(
        { ...fixture, tool: secretAwareTool },
        {
          secretRefs: { authToken: "secretref:package-manager-token" },
        },
      ),
    });
    const contract = await fixture.kernel.proposeActionContract(proposalInputForCompilation(compilation));
    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
    });
    if (!policy.greenlight) throw new Error("expected greenlight for secret-ref candidate");
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: contract.actionContractId,
      greenlightId: policy.greenlight.greenlightId,
      observedParameters: contract.parameters,
    });

    const storedActionContract = await fixture.store.getRecord("action_contract", contract.actionContractId);
    const storedReceipt = await fixture.store.getRecord("receipt", gate.receipt.receiptId);
    expect(contract.secretRefs).toEqual({ authToken: "secretref:package-manager-token" });
    expect(gate.gateAttempt.gateDecision).toBe("passed");
    expect(JSON.stringify([compilation, storedActionContract, storedReceipt])).not.toContain("raw-token-value");
  });
});
