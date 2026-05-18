import { describe, expect, it } from "bun:test";
import { HandshakeProtocolError } from "../src/protocol/errors";
import { HandshakeKernel } from "../src/protocol/kernel";
import { protectedPathPostureScopeKeyForContract } from "../src/protocol/protected-path-postures";
import { ProtocolRecorder } from "../src/protocol/records";
import { digestCanonical } from "../src/protocol/canonical";
import type {
  ContractStreamEvent,
  GatewayRegistryEntry,
  ProofGap,
  ProtocolObjectType,
  RecoveryRecommendationStatusTransition,
} from "../src/protocol/schemas";
import { InMemoryProtocolStore } from "../src/storage/memory";
import type {
  ProtocolCommit,
  ProtocolCommitResult,
  GatewayCheckCommit,
  GatewayCheckCommitResult,
  StoredProtocolRecord,
} from "../src/storage/store";
import {
  createGreenlitContract,
  futureIso,
  makeKernelFixture,
  makePackageInstallCandidate,
  proposalInputForCompilation,
  recordUnknownDownstreamProofGap,
  registerFixtureObjects,
} from "./fixtures";

describe("Handshake kernel invariants", () => {
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
      candidate: makePackageInstallCandidate({ ...fixture, tool: unsafeTool }, {
        toolCapabilityId: unsafeTool.toolCapabilityId,
      }),
    });

    await expect(
      fixture.kernel.proposeActionContract({
        intentCompilationId: compilation.intentCompilationId,
        candidateActionId: compilation.candidateAction.candidateActionId,
        candidateDigest: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
        signingSecret: "test-secret",
      }),
    ).rejects.toThrow(HandshakeProtocolError);
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
        candidate: makePackageInstallCandidate({ ...fixture, tool: secretAwareTool }, {
          parameters: { package: "hono", versionRange: "^4.12.19", authToken: "raw-token-value" },
          nonSecretParamsSummary: { package: "hono", versionRange: "^4.12.19" },
          secretRefs: { authToken: "secretref:package-manager-token" },
        }),
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
      candidate: makePackageInstallCandidate({ ...fixture, tool: secretAwareTool }, {
        secretRefs: { authToken: "secretref:package-manager-token" },
      }),
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

  it("rejects direct writes for lifecycle-owned protocol objects", async () => {
    const fixture = await createGreenlitContract();

    await expect(
      fixture.kernel.putCatalogObject({ objectType: "greenlight", payload: fixture.greenlight }),
    ).rejects.toThrow("Direct writes are not allowed");
  });

  it("rejects policy evaluation against an envelope not pinned by the contract", async () => {
    const fixture = await createGreenlitContract();
    const otherEnvelope = {
      ...fixture.envelope,
      envelopeId: "env_other",
      objectiveRef: "intent:wrong-envelope",
    };
    await fixture.kernel.putCatalogObject({ objectType: "operating_envelope", payload: otherEnvelope });

    await expect(
      fixture.kernel.evaluatePolicy({
        actionContractId: fixture.contract.actionContractId,
        envelopeId: otherEnvelope.envelopeId,
      }),
    ).rejects.toThrow("Policy may evaluate only the envelope pinned by the action contract");
  });

  it("rejects issuing a second greenlight for the same action contract", async () => {
    const fixture = await createGreenlitContract();

    await expect(
      fixture.kernel.evaluatePolicy({
        actionContractId: fixture.contract.actionContractId,
        envelopeId: fixture.envelope.envelopeId,
      }),
    ).rejects.toThrow("already has a greenlight");

    expect(fixture.store.countRecordsOfType("greenlight")).toBe(1);
  });

  it("rejects duplicate greenlight issuance through the durable action-contract claim", async () => {
    const base = makeKernelFixture();
    const store = new GreenlightListBlindStore();
    const fixture = await createGreenlitContract({ ...base, store, kernel: new HandshakeKernel(store) });

    await expect(
      fixture.kernel.evaluatePolicy({
        actionContractId: fixture.contract.actionContractId,
        envelopeId: fixture.envelope.envelopeId,
      }),
    ).rejects.toThrow("already has a greenlight");

    expect(store.countRecordsOfType("greenlight")).toBe(1);
  });

  it("requires fresh gateway_checked protected-path posture before policy can greenlight", async () => {
    const fixture = await createContractRequiringGatewayCheckedPosture();

    const missingPosture = await fixture.kernel.evaluatePolicy({
      actionContractId: fixture.contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
    });
    expect(missingPosture.decision.decision).toBe("refuse");
    expect(missingPosture.decision.decisionReasonCode).toBe("protected_path_posture_missing");
    expect(missingPosture.greenlight).toBeNull();

    await fixture.kernel.createProtectedPathPosture({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      runtimeAdapterId: "runtime_codex",
      gatewayId: fixture.gateway.gatewayId,
      actionClass: "package.install",
      resourceRef: fixture.contract.resourceRef,
      protectedSurfaceKind: "package_manager",
      postureState: "gateway_checked",
      credentialCustodyStatus: "gateway_held",
      rawSiblingToolStatus: "blocked",
      sourceAuthority: "runtime_probe",
      reasonCodes: ["runtime_observed_wrapper"],
      evidenceRefs: ["evidence:posture:runtime-probe"],
      expiresAt: futureIso(),
    });
    const weakSource = await fixture.kernel.evaluatePolicy({
      actionContractId: fixture.contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
    });
    expect(weakSource.decision.decision).toBe("refuse");
    expect(weakSource.decision.decisionReasonCode).toBe("protected_path_source_authority_weak");
    expect(weakSource.greenlight).toBeNull();

    const posture = await fixture.kernel.createProtectedPathPosture({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      runtimeAdapterId: "runtime_codex",
      gatewayId: fixture.gateway.gatewayId,
      actionClass: "package.install",
      resourceRef: fixture.contract.resourceRef,
      protectedSurfaceKind: "package_manager",
      postureState: "gateway_checked",
      credentialCustodyStatus: "gateway_held",
      rawSiblingToolStatus: "blocked",
      sourceAuthority: "conformance_fixture",
      reasonCodes: ["local_fixture_gateway_checked"],
      evidenceRefs: ["evidence:posture:local-fixture"],
      expiresAt: futureIso(),
    });
    const currentPosture = await fixture.store.getCurrentProtectedPathPosture(
      protectedPathPostureScopeKeyForContract(fixture.contract),
    );
    expect(currentPosture?.payload.protectedPathPostureId).toBe(posture.protectedPathPostureId);

    const greenlit = await fixture.kernel.evaluatePolicy({
      actionContractId: fixture.contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
    });
    expect(greenlit.decision.decision).toBe("greenlight");
    expect(greenlit.greenlight?.protectedPathPostureId).toBe(posture.protectedPathPostureId);
    expect(greenlit.greenlight?.protectedPathPostureDigest).toBe(posture.postureDigest);
  });

  it("refuses at the gateway when protected-path posture drifts unsafe after greenlight", async () => {
    const fixture = await createContractRequiringGatewayCheckedPosture("idem_posture_drift");
    await fixture.kernel.createProtectedPathPosture({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      runtimeAdapterId: "runtime_codex",
      gatewayId: fixture.gateway.gatewayId,
      actionClass: "package.install",
      resourceRef: fixture.contract.resourceRef,
      protectedSurfaceKind: "package_manager",
      postureState: "gateway_checked",
      credentialCustodyStatus: "gateway_held",
      rawSiblingToolStatus: "blocked",
      sourceAuthority: "conformance_fixture",
      expiresAt: futureIso(),
    });
    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: fixture.contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
    });
    if (!policy.greenlight) throw new Error("expected greenlight with safe posture");

    await fixture.kernel.createProtectedPathPosture({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      runtimeAdapterId: "runtime_codex",
      gatewayId: fixture.gateway.gatewayId,
      actionClass: "package.install",
      resourceRef: fixture.contract.resourceRef,
      protectedSurfaceKind: "package_manager",
      postureState: "advisory",
      credentialCustodyStatus: "agent_has_raw_credential",
      rawSiblingToolStatus: "present",
      sourceAuthority: "runtime_probe",
      reasonCodes: ["raw_package_manager_available"],
      evidenceRefs: ["evidence:posture:raw-tool-present"],
      expiresAt: futureIso(),
    });

    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: policy.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });

    expect(gate.gateAttempt.gateDecision).toBe("refused");
    expect(gate.gateAttempt.gateDecisionReasonCode).toBe("protected_path_posture_not_gateway_checked");
    expect(gate.gateAttempt.protectedPathPostureStateSeen).toBe("advisory");
    expect(gate.mutationAttempt).toBeNull();
  });

  it("passes the gateway check once and refuses replay", async () => {
    const fixture = await createGreenlitContract();

    expect(fixture.contract.contractSignature).toMatch(/^hmac-sha256:/);

    const first = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });

    expect(first.gateAttempt.gateDecision).toBe("passed");
    expect(first.receipt.finalityStatus).toBe("pending");
    expect(first.mutationAttempt?.outcome).toBe("submitted");

    const replay = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });

    expect(replay.gateAttempt.gateDecision).toBe("refused");
    expect(replay.gateAttempt.gateDecisionReasonCode).toBe("already_consumed");
    expect(replay.mutationAttempt).toBeNull();
    expect(replay.receipt.greenlightConsumptionStatus).toBe("replayed");
  });

  it("chains action stream events with per-partition offsets and previous digests", async () => {
    const fixture = await createGreenlitContract();
    const streamId = `stream_${fixture.contract.tenantId}_${fixture.contract.organizationId}`;
    const partitionKey = `action:${fixture.contract.actionContractId}`;
    const beforeGate = fixture.store.listEventsForPartition(streamId, partitionKey);

    expect(beforeGate.map((event) => event.eventType)).toEqual([
      "action_proposed",
      "policy_decision_recorded",
      "action_greenlit",
    ]);
    expect(beforeGate.map((event) => event.offset)).toEqual([0, 1, 2]);
    expect(beforeGate[0]?.previousEventDigest).toBeNull();
    expect(beforeGate[1]?.previousEventDigest).toBe(beforeGate[0]?.eventDigest);
    expect(beforeGate[2]?.previousEventDigest).toBe(beforeGate[1]?.eventDigest);

    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });

    const afterGate = fixture.store.listEventsForPartition(streamId, partitionKey);
    expect(afterGate.map((event) => event.eventType)).toEqual([
      "action_proposed",
      "policy_decision_recorded",
      "action_greenlit",
      "gateway_checked",
      "mutation_attempted",
      "receipt_emitted",
    ]);
    expect(afterGate.map((event) => event.offset)).toEqual([0, 1, 2, 3, 4, 5]);
    for (let index = 1; index < afterGate.length; index += 1) {
      expect(afterGate[index]?.previousEventDigest).toBe(afterGate[index - 1]?.eventDigest);
    }

    const runEvents = fixture.store.listEventsForPartition(streamId, `run:${fixture.contract.runId}`);
    expect(runEvents.map((event) => event.eventType)).toEqual(afterGate.map((event) => event.eventType));
    expect(runEvents.map((event) => event.offset)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(runEvents.every((event) => event.streamScope === "run")).toBe(true);
    for (let index = 1; index < runEvents.length; index += 1) {
      expect(runEvents[index]?.previousEventDigest).toBe(runEvents[index - 1]?.eventDigest);
    }

    const resourceEvents = fixture.store.listEventsForPartition(
      streamId,
      `protected_surface_resource:${fixture.contract.gatewayId}:${fixture.contract.resourceRef}`,
    );
    expect(resourceEvents.map((event) => event.eventType)).toEqual(afterGate.map((event) => event.eventType));
    expect(resourceEvents.map((event) => event.offset)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(resourceEvents.every((event) => event.streamScope === "protected_surface_resource")).toBe(true);
    for (let index = 1; index < resourceEvents.length; index += 1) {
      expect(resourceEvents[index]?.previousEventDigest).toBe(resourceEvents[index - 1]?.eventDigest);
    }

    const actionReceiptEvent = afterGate.at(-1);
    const runReceiptEvent = runEvents.at(-1);
    const resourceReceiptEvent = resourceEvents.at(-1);
    if (!actionReceiptEvent || !runReceiptEvent || !resourceReceiptEvent) {
      throw new Error("expected receipt events for action, run, and gateway resource partitions");
    }
    expect(gate.receipt.streamEventIds).toHaveLength(9);
    expect(gate.receipt.receiptDigest).toMatch(/^sha256:/);
    expect(gate.receipt.auditChainDigest).toMatch(/^sha256:/);
    expect(gate.receipt.streamOffsets).toEqual([
      {
        streamId,
        streamScope: "organization",
        partitionKey,
        offsetStart: 0,
        offsetEnd: 5,
        terminalEventDigest: actionReceiptEvent.eventDigest,
      },
      {
        streamId,
        streamScope: "run",
        partitionKey: `run:${fixture.contract.runId}`,
        offsetStart: 0,
        offsetEnd: 5,
        terminalEventDigest: runReceiptEvent.eventDigest,
      },
      {
        streamId,
        streamScope: "protected_surface_resource",
        partitionKey: `protected_surface_resource:${fixture.contract.gatewayId}:${fixture.contract.resourceRef}`,
        offsetStart: 0,
        offsetEnd: 5,
        terminalEventDigest: resourceReceiptEvent.eventDigest,
      },
    ]);
    const receiptRecord = await fixture.store.getRecord("receipt", gate.receipt.receiptId);
    expect(receiptRecord?.payload).toMatchObject({
      streamEventIds: gate.receipt.streamEventIds,
      streamOffsets: gate.receipt.streamOffsets,
      receiptDigest: gate.receipt.receiptDigest,
      auditChainDigest: gate.receipt.auditChainDigest,
    });
  });

  it("exports a receipt drop copy without creating execution authority", async () => {
    const fixture = await createGreenlitContract();
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });

    const exportRecord = await fixture.kernel.createReceiptExport({
      receiptId: gate.receipt.receiptId,
      exportFormat: "redacted_json",
      redactionProfileRef: "redaction:default",
      requestedByRef: "auditor:test",
    });

    if (!gate.receipt.receiptDigest || !gate.receipt.auditChainDigest) {
      throw new Error("expected receipt digest material before export");
    }
    expect(exportRecord.receiptId).toBe(gate.receipt.receiptId);
    expect(exportRecord.receiptDigest).toBe(gate.receipt.receiptDigest);
    expect(exportRecord.auditChainDigest).toBe(gate.receipt.auditChainDigest);
    expect(exportRecord.streamOffsets).toEqual(gate.receipt.streamOffsets);
    expect(exportRecord.finalityStatus).toBe("pending");
    expect(exportRecord.exportDigest).toMatch(/^sha256:/);
    expect(fixture.store.countRecordsOfType("mutation_attempt")).toBe(1);
    expect(fixture.store.countRecordsOfType("greenlight")).toBe(1);
    expect(fixture.store.countRecordsOfType("receipt_export")).toBe(1);

    const streamId = `stream_${fixture.contract.tenantId}_${fixture.contract.organizationId}`;
    const exportEvents = fixture.store
      .listEventsForPartition(streamId, `action:${fixture.contract.actionContractId}`)
      .filter((event) => event.eventType === "receipt_exported");
    expect(exportEvents).toHaveLength(1);
    expect(exportEvents[0]?.payload).toEqual({
      receiptId: gate.receipt.receiptId,
      exportDigest: exportRecord.exportDigest,
      finalityStatus: "pending",
    });
  });

  it("refuses receipt export when the stored receipt digest is stale", async () => {
    const fixture = await createGreenlitContract();
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });
    const receiptRecord = await fixture.store.getRecord("receipt", gate.receipt.receiptId);
    if (!receiptRecord) throw new Error("expected receipt record");
    await fixture.store.putRecord({
      ...receiptRecord,
      payload: {
        ...gate.receipt,
        finalityStatus: "suspect",
      },
    });

    await expect(
      fixture.kernel.createReceiptExport({
        receiptId: gate.receipt.receiptId,
        requestedByRef: "auditor:test",
      }),
    ).rejects.toThrow("receiptDigest does not match");
    expect(fixture.store.countRecordsOfType("receipt_export")).toBe(0);
  });

  it("records a recovery recommendation from a proof-gap receipt without creating mutation authority", async () => {
    const fixture = await createGreenlitContract();
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });
    const proofGap = await recordUnknownDownstreamProofGap(fixture, gate);
    const proofGapId = proofGap.proofGapId;
    if (!gate.receipt.receiptDigest || !gate.receipt.auditChainDigest) {
      throw new Error("expected proof-gap receipt with digest material");
    }

    const recommendation = await fixture.kernel.createRecoveryRecommendation({
      sourceReceiptId: gate.receipt.receiptId,
      sourceRefusalOrGapRef: proofGapId,
      recommendedPath: "narrower_action_contract_required",
      allowedNextActionClasses: [fixture.contract.actionClass],
      requiredNewEvidence: ["gateway_finality_evidence"],
      requiresHumanReview: true,
      reasonCode: "downstream_status_unknown",
      reasonSummary: "Gateway did not produce downstream finality evidence.",
      retryNotBefore: new Date(Date.now() + 60_000).toISOString(),
    });

    expect(recommendation.sourceReceiptId).toBe(gate.receipt.receiptId);
    expect(recommendation.sourceRefusalOrGapRef).toBe(proofGapId);
    expect(recommendation.sourceReceiptDigest).toBe(gate.receipt.receiptDigest);
    expect(recommendation.sourceAuditChainDigest).toBe(gate.receipt.auditChainDigest);
    expect(recommendation.proofGapIds).toEqual([proofGapId]);
    expect(recommendation.missingEvidenceRefs).toEqual(["downstream_finality"]);
    expect(recommendation.mustCreateNewActionContract).toBe(true);
    expect(recommendation.mayReuseGreenlight).toBe(false);
    expect(recommendation.mayMutateProtectedSurface).toBe(false);
    expect(recommendation.scopeNarrowingRequired).toBe(true);
    expect(recommendation.safeRetryAvailable).toBe(false);
    expect(recommendation.recommendationDigest).toMatch(/^sha256:/);
    expect(fixture.store.countRecordsOfType("recovery_recommendation")).toBe(1);
    expect(fixture.store.countRecordsOfType("mutation_attempt")).toBe(1);
    expect(fixture.store.countRecordsOfType("greenlight")).toBe(1);

    const streamId = `stream_${fixture.contract.tenantId}_${fixture.contract.organizationId}`;
    const recoveryEvents = fixture.store
      .listEventsForPartition(streamId, `action:${fixture.contract.actionContractId}`)
      .filter((event) => event.eventType === "recovery_recommended");
    expect(recoveryEvents).toHaveLength(1);
    expect(recoveryEvents[0]?.payload).toEqual({
      sourceReceiptId: gate.receipt.receiptId,
      sourceRefusalOrGapRef: proofGapId,
      recommendedPath: "narrower_action_contract_required",
      mustCreateNewActionContract: true,
      mayReuseGreenlight: false,
      mayMutateProtectedSurface: false,
      recommendationDigest: recommendation.recommendationDigest,
    });
  });

  it("refuses recovery recommendations for final successful receipts", async () => {
    const fixture = await createGreenlitContract();
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });

    await expect(
      fixture.kernel.createRecoveryRecommendation({
        sourceReceiptId: gate.receipt.receiptId,
        recommendedPath: "narrower_action_contract_required",
        allowedNextActionClasses: [fixture.contract.actionClass],
        requiredNewEvidence: ["gateway_finality_evidence"],
        reasonCode: "unneeded_retry",
        reasonSummary: "A final successful receipt has no recovery source.",
      }),
    ).rejects.toThrow("requires a refusal, proof gap, failed, unknown, or suspect receipt");
    expect(fixture.store.countRecordsOfType("recovery_recommendation")).toBe(0);
  });

  it("links a recovery recommendation to a later action contract without inheriting a greenlight", async () => {
    const fixture = await createGreenlitContract();
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });
    const proofGapId = (await recordUnknownDownstreamProofGap(fixture, gate)).proofGapId;
    const recommendation = await fixture.kernel.createRecoveryRecommendation({
      sourceReceiptId: gate.receipt.receiptId,
      sourceRefusalOrGapRef: proofGapId,
      recommendedPath: "narrower_action_contract_required",
      allowedNextActionClasses: [fixture.contract.actionClass],
      requiredNewEvidence: ["gateway_finality_evidence"],
      requiresHumanReview: false,
      reasonCode: "downstream_status_unknown",
      reasonSummary: "Gateway did not produce downstream finality evidence.",
    });
    const followUpCompilation = await fixture.kernel.compileIntent({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:recover package install",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      operatingEnvelopeId: fixture.envelope.envelopeId,
      toolCatalogRef: "tool_catalog_demo@v1",
      actionCatalogRef: "action_catalog_demo@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      generatedCodeOrSpecRefs: ["code:recovery-follow-up"],
      declaredAssumptions: ["follow-up is narrowed by recovery recommendation"],
      requiredEvidenceRefs: ["gateway_finality_evidence"],
      candidate: makePackageInstallCandidate(fixture, {
        sequenceNumber: fixture.contract.sequenceNumber + 1,
        recoveryRecommendationId: recommendation.recoveryRecommendationId,
        purposeCode: "dependency_add_recovery",
        evidenceRefs: ["gateway_finality_evidence"],
        idempotencyKey: "idem_package_hono_recovery_followup",
      }),
    });

    const followUp = await fixture.kernel.proposeActionContract(
      proposalInputForCompilation(followUpCompilation, "test-secret"),
    );

    expect(followUp.recoveryRecommendationId).toBe(recommendation.recoveryRecommendationId);
    expect(followUp.recoverySourceReceiptId).toBe(gate.receipt.receiptId);
    expect(followUp.recoveryRecommendationDigest).toBe(recommendation.recommendationDigest);
    expect(followUp.actionContractDigest).toMatch(/^sha256:/);
    expect(fixture.store.countRecordsOfType("action_contract")).toBe(2);
    expect(fixture.store.countRecordsOfType("recovery_recommendation_status_transition")).toBe(1);
    expect(fixture.store.countRecordsOfType("policy_decision")).toBe(1);
    expect(fixture.store.countRecordsOfType("greenlight")).toBe(1);
    expect(fixture.store.countRecordsOfType("mutation_attempt")).toBe(1);
    const updatedRecommendation = await fixture.store.getRecord(
      "recovery_recommendation",
      recommendation.recoveryRecommendationId,
    );
    expect(updatedRecommendation?.payload).toMatchObject({
      recommendationStatus: "superseded",
      supersededByActionContractId: followUp.actionContractId,
      statusReasonCode: "followup_action_contract_proposed",
    });

    const streamId = `stream_${fixture.contract.tenantId}_${fixture.contract.organizationId}`;
    const followUpEvents = fixture.store.listEventsForPartition(streamId, `action:${followUp.actionContractId}`);
    expect(followUpEvents[0]?.objectRefs).toContain(recommendation.recoveryRecommendationId);
    expect(followUpEvents[0]?.payload).toMatchObject({
      recoveryRecommendationId: recommendation.recoveryRecommendationId,
    });
    const sourceRecoveryEvents = fixture.store
      .listEventsForPartition(streamId, `action:${fixture.contract.actionContractId}`)
      .filter((event) => event.eventType === "recovery_status_changed");
    expect(sourceRecoveryEvents).toHaveLength(1);
    expect(sourceRecoveryEvents[0]?.payload).toMatchObject({
      previousStatus: "open",
      nextStatus: "superseded",
      supersededByActionContractId: followUp.actionContractId,
    });

    await expect(
      fixture.kernel.proposeActionContract(proposalInputForCompilation(followUpCompilation)),
    ).rejects.toThrow("only to an open recovery recommendation");
    expect(fixture.store.countRecordsOfType("action_contract")).toBe(2);

    const followUpPolicy = await fixture.kernel.evaluatePolicy({
      actionContractId: followUp.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });
    expect(followUpPolicy.decision.decision).toBe("greenlight");
    expect(followUpPolicy.greenlight).not.toBeNull();
    expect(fixture.store.countRecordsOfType("greenlight")).toBe(2);
  });

  it("records an explicit expired recovery recommendation status transition", async () => {
    const fixture = await createGreenlitContract();
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });
    const proofGapId = (await recordUnknownDownstreamProofGap(fixture, gate)).proofGapId;
    const recommendation = await fixture.kernel.createRecoveryRecommendation({
      sourceReceiptId: gate.receipt.receiptId,
      sourceRefusalOrGapRef: proofGapId,
      recommendedPath: "narrower_action_contract_required",
      allowedNextActionClasses: [fixture.contract.actionClass],
      requiredNewEvidence: ["gateway_finality_evidence"],
      requiresHumanReview: true,
      reasonCode: "downstream_status_unknown",
      reasonSummary: "Gateway did not produce downstream finality evidence.",
      recoveryExpiresAt: new Date(Date.now() - 1_000).toISOString(),
    });

    const statusChange = await fixture.kernel.transitionRecoveryRecommendationStatus({
      recoveryRecommendationId: recommendation.recoveryRecommendationId,
      nextStatus: "expired",
      reasonCode: "recovery_expired",
      reasonSummary: "Recovery recommendation freshness window elapsed.",
      changedByRef: "test:expiry-sweeper",
    });

    expect(statusChange.recoveryRecommendation.recommendationStatus).toBe("expired");
    expect(statusChange.recoveryRecommendation.statusChangedByRef).toBe("test:expiry-sweeper");
    expect(statusChange.statusTransition.previousStatus).toBe("open");
    expect(statusChange.statusTransition.nextStatus).toBe("expired");
    expect(statusChange.statusTransition.transitionDigest).toMatch(/^sha256:/);
    expect(fixture.store.countRecordsOfType("recovery_recommendation_status_transition")).toBe(1);
    const streamId = `stream_${fixture.contract.tenantId}_${fixture.contract.organizationId}`;
    const statusEvents = fixture.store
      .listEventsForPartition(streamId, `action:${fixture.contract.actionContractId}`)
      .filter((event) => event.eventType === "recovery_status_changed");
    expect(statusEvents).toHaveLength(1);
    expect(statusEvents[0]?.payload).toMatchObject({
      previousStatus: "open",
      nextStatus: "expired",
      changedByRef: "test:expiry-sweeper",
    });
  });

  it("does not record a follow-up action contract when recovery terminal claim loses a race", async () => {
    const base = makeKernelFixture();
    const store = new RecoveryTerminalConflictOnceStore();
    const fixture = await createGreenlitContract({ ...base, store, kernel: new HandshakeKernel(store) });
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });
    const proofGapId = (await recordUnknownDownstreamProofGap(fixture, gate)).proofGapId;
    const recommendation = await fixture.kernel.createRecoveryRecommendation({
      sourceReceiptId: gate.receipt.receiptId,
      sourceRefusalOrGapRef: proofGapId,
      recommendedPath: "narrower_action_contract_required",
      allowedNextActionClasses: [fixture.contract.actionClass],
      requiredNewEvidence: ["gateway_finality_evidence"],
      requiresHumanReview: false,
      reasonCode: "downstream_status_unknown",
      reasonSummary: "Gateway did not produce downstream finality evidence.",
    });
    const followUpCompilation = await fixture.kernel.compileIntent({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:recover package install with terminal race",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      operatingEnvelopeId: fixture.envelope.envelopeId,
      toolCatalogRef: "tool_catalog_demo@v1",
      actionCatalogRef: "action_catalog_demo@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      candidate: makePackageInstallCandidate(fixture, {
        sequenceNumber: fixture.contract.sequenceNumber + 1,
        recoveryRecommendationId: recommendation.recoveryRecommendationId,
        purposeCode: "dependency_add_recovery",
        evidenceRefs: ["gateway_finality_evidence"],
        idempotencyKey: "idem_package_hono_recovery_terminal_race",
      }),
    });

    await expect(
      fixture.kernel.proposeActionContract(proposalInputForCompilation(followUpCompilation)),
    ).rejects.toThrow("already has a terminal status transition");

    const storedRecommendation = await fixture.store.getRecord(
      "recovery_recommendation",
      recommendation.recoveryRecommendationId,
    );
    expect(storedRecommendation?.payload).toMatchObject({
      recommendationStatus: "open",
      supersededByActionContractId: null,
    });
    const proofGaps = await fixture.store.listRecordsByType<ProofGap>("proof_gap");
    const terminalConflictGap = proofGaps
      .map((record) => record.payload)
      .find((proofGap) => proofGap.reasonCode === "recovery_terminal_conflict");
    expect(terminalConflictGap).toMatchObject({
      gapPhase: "recovery",
      finalityImpact: "none",
      receiptId: gate.receipt.receiptId,
    });
    expect(terminalConflictGap?.affectedObjectRefs).toEqual([
      recommendation.recoveryRecommendationId,
      gate.receipt.receiptId,
      fixture.contract.actionContractId,
      expect.stringMatching(/^act_/),
    ]);
    expect(fixture.store.countRecordsOfType("action_contract")).toBe(1);
    expect(fixture.store.countRecordsOfType("recovery_recommendation_status_transition")).toBe(0);
    expect(fixture.store.countRecordsOfType("proof_gap")).toBe(2);
  });

  it("resolves a recovery terminal conflict proof gap against the observed winning transition", async () => {
    const base = makeKernelFixture();
    const store = new RecoveryTerminalConflictOnceStore();
    const fixture = await createGreenlitContract({ ...base, store, kernel: new HandshakeKernel(store) });
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });
    const proofGapId = (await recordUnknownDownstreamProofGap(fixture, gate)).proofGapId;
    const recommendation = await fixture.kernel.createRecoveryRecommendation({
      sourceReceiptId: gate.receipt.receiptId,
      sourceRefusalOrGapRef: proofGapId,
      recommendedPath: "narrower_action_contract_required",
      allowedNextActionClasses: [fixture.contract.actionClass],
      requiredNewEvidence: ["gateway_finality_evidence"],
      requiresHumanReview: false,
      reasonCode: "downstream_status_unknown",
      reasonSummary: "Gateway did not produce downstream finality evidence.",
    });
    const followUpCompilation = await fixture.kernel.compileIntent({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:recover package install after terminal conflict",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      operatingEnvelopeId: fixture.envelope.envelopeId,
      toolCatalogRef: "tool_catalog_demo@v1",
      actionCatalogRef: "action_catalog_demo@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      candidate: makePackageInstallCandidate(fixture, {
        sequenceNumber: fixture.contract.sequenceNumber + 1,
        recoveryRecommendationId: recommendation.recoveryRecommendationId,
        purposeCode: "dependency_add_recovery",
        evidenceRefs: ["gateway_finality_evidence"],
        idempotencyKey: "idem_package_hono_recovery_terminal_resolution",
      }),
    });
    const followUpInput = proposalInputForCompilation(followUpCompilation);

    await expect(fixture.kernel.proposeActionContract(followUpInput)).rejects.toThrow(
      "already has a terminal status transition",
    );
    const terminalConflictGap = (await fixture.store.listRecordsByType<ProofGap>("proof_gap"))
      .map((record) => record.payload)
      .find((proofGap) => proofGap.reasonCode === "recovery_terminal_conflict");
    if (!terminalConflictGap) throw new Error("expected recovery terminal conflict proof gap");
    const losingActionContractRef = terminalConflictGap.affectedObjectRefs[3];

    const winningContract = await fixture.kernel.proposeActionContract(followUpInput);
    const statusTransitions = await fixture.store.listRecordsByType<RecoveryRecommendationStatusTransition>(
      "recovery_recommendation_status_transition",
    );
    const winningTransition = statusTransitions[0]?.payload;
    if (!winningTransition) throw new Error("expected winning recovery terminal transition");

    const resolution = await fixture.kernel.resolveRecoveryTerminalConflictProofGap({
      proofGapId: terminalConflictGap.proofGapId,
      recoveryRecommendationStatusTransitionId: winningTransition.recoveryRecommendationStatusTransitionId,
      observedByRef: "test:terminal-transition-loader",
    });
    const resolvedGap = await fixture.store.getRecord<ProofGap>("proof_gap", terminalConflictGap.proofGapId);

    expect(winningContract.actionContractId).not.toBe(losingActionContractRef);
    expect(resolution.proofGap.resolvedByRef).toBe(winningTransition.recoveryRecommendationStatusTransitionId);
    expect(resolution.statusTransition.nextStatus).toBe("superseded");
    expect(resolution.recoveryRecommendation.recommendationStatus).toBe("superseded");
    expect(resolvedGap?.payload).toMatchObject({
      proofGapId: terminalConflictGap.proofGapId,
      resolvedByRef: winningTransition.recoveryRecommendationStatusTransitionId,
    });
    expect(fixture.store.countRecordsOfType("action_contract")).toBe(2);
    expect(fixture.store.countRecordsOfType("recovery_recommendation_status_transition")).toBe(1);
    expect(fixture.store.countRecordsOfType("proof_gap")).toBe(2);
    const streamId = `stream_${fixture.contract.tenantId}_${fixture.contract.organizationId}`;
    const resolvedEvents = fixture.store
      .listEventsForPartition(streamId, `action:${fixture.contract.actionContractId}`)
      .filter((event) => event.eventType === "proof_gap_resolved");
    expect(resolvedEvents).toHaveLength(1);
    expect(resolvedEvents[0]?.payload).toMatchObject({
      reasonCode: "recovery_terminal_conflict",
      finalityImpact: "none",
      recoveryRecommendationId: recommendation.recoveryRecommendationId,
      recoveryRecommendationStatusTransitionId: winningTransition.recoveryRecommendationStatusTransitionId,
      resolvedByRef: winningTransition.recoveryRecommendationStatusTransitionId,
      observedByRef: "test:terminal-transition-loader",
    });
  });

  it("refuses recovery-linked action contracts that omit required new evidence", async () => {
    const fixture = await createGreenlitContract();
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });
    const proofGapId = (await recordUnknownDownstreamProofGap(fixture, gate)).proofGapId;
    const recommendation = await fixture.kernel.createRecoveryRecommendation({
      sourceReceiptId: gate.receipt.receiptId,
      sourceRefusalOrGapRef: proofGapId,
      recommendedPath: "narrower_action_contract_required",
      allowedNextActionClasses: [fixture.contract.actionClass],
      requiredNewEvidence: ["gateway_finality_evidence"],
      requiresHumanReview: false,
      reasonCode: "downstream_status_unknown",
      reasonSummary: "Gateway did not produce downstream finality evidence.",
    });
    const followUpCompilation = await fixture.kernel.compileIntent({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:recover package install without evidence",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      operatingEnvelopeId: fixture.envelope.envelopeId,
      toolCatalogRef: "tool_catalog_demo@v1",
      actionCatalogRef: "action_catalog_demo@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      candidate: makePackageInstallCandidate(fixture, {
        sequenceNumber: fixture.contract.sequenceNumber + 1,
        recoveryRecommendationId: recommendation.recoveryRecommendationId,
        purposeCode: "dependency_add_recovery",
        evidenceRefs: [],
        idempotencyKey: "idem_package_hono_recovery_missing_evidence",
      }),
    });

    await expect(
      fixture.kernel.proposeActionContract(proposalInputForCompilation(followUpCompilation)),
    ).rejects.toThrow("missing required new evidence");
    expect(fixture.store.countRecordsOfType("action_contract")).toBe(1);
  });

  it("rebuilds gateway check stream events after an offset conflict", async () => {
    const base = makeKernelFixture();
    const store = new StreamConflictOnceStore();
    const fixture = await createGreenlitContract({ ...base, store, kernel: new HandshakeKernel(store) });
    const streamId = `stream_${fixture.contract.tenantId}_${fixture.contract.organizationId}`;
    const partitionKey = `action:${fixture.contract.actionContractId}`;

    const result = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });

    const gateEvent = store
      .listEventsForPartition(streamId, partitionKey)
      .find((event) => event.objectRefs.includes(result.gateAttempt.gateAttemptId));

    expect(result.gateAttempt.gateDecision).toBe("passed");
    expect(result.mutationAttempt?.outcome).toBe("submitted");
    expect(gateEvent?.offset).toBe(4);
    expect(gateEvent?.previousEventDigest).toBe(
      store.listEventsForPartition(streamId, partitionKey).find((event) => event.offset === 3)?.eventDigest,
    );
  });

  it("rebuilds action proposal events after an offset conflict", async () => {
    const base = makeKernelFixture();
    const store = new ProtocolStreamConflictOnceStore("action_proposed");
    const fixture = await createGreenlitContract({ ...base, store, kernel: new HandshakeKernel(store) });
    const streamId = `stream_${fixture.contract.tenantId}_${fixture.contract.organizationId}`;
    const partitionKey = `action:${fixture.contract.actionContractId}`;
    const events = store.listEventsForPartition(streamId, partitionKey);
    const proposalEvent = events.find(
      (event) => event.eventType === "action_proposed" && event.objectRefs.includes(fixture.contract.actionContractId),
    );
    const contractRecord = await store.getRecord("action_contract", fixture.contract.actionContractId);

    expect(contractRecord).not.toBeNull();
    expect(proposalEvent?.offset).toBe(1);
    expect(proposalEvent?.previousEventDigest).toBe(events.find((event) => event.offset === 0)?.eventDigest);
  });

  it("rebuilds policy and greenlight events after an offset conflict", async () => {
    const base = makeKernelFixture();
    const store = new ProtocolStreamConflictOnceStore("policy_decision_recorded");
    const fixture = await createGreenlitContract({ ...base, store, kernel: new HandshakeKernel(store) });
    const streamId = `stream_${fixture.contract.tenantId}_${fixture.contract.organizationId}`;
    const partitionKey = `action:${fixture.contract.actionContractId}`;
    const events = store.listEventsForPartition(streamId, partitionKey);
    const policyEvent = events.find(
      (event) => event.eventType === "policy_decision_recorded" && event.objectRefs.includes(fixture.decision.policyDecisionId),
    );
    const greenlightEvent = events.find(
      (event) => event.eventType === "action_greenlit" && event.objectRefs.includes(fixture.greenlight.greenlightId),
    );
    const greenlightRecord = await store.getRecord("greenlight", fixture.greenlight.greenlightId);

    expect(greenlightRecord).not.toBeNull();
    expect(policyEvent?.offset).toBe(2);
    expect(policyEvent?.previousEventDigest).toBe(events.find((event) => event.offset === 1)?.eventDigest);
    expect(greenlightEvent?.offset).toBe(3);
    expect(greenlightEvent?.previousEventDigest).toBe(policyEvent?.eventDigest);
  });

  it("records a replay refusal without mutation when greenlight consumption loses a race", async () => {
    const fixture = await createGreenlitContract();
    await fixture.store.consumeGreenlight({
      greenlightId: fixture.greenlight.greenlightId,
      gateAttemptId: "gat_other",
      actionContractId: fixture.contract.actionContractId,
      idempotencyKey: fixture.contract.idempotencyKey,
      consumedAt: new Date().toISOString(),
    });

    const result = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });

    const greenlightRecord = await fixture.store.getRecord("greenlight", fixture.greenlight.greenlightId);
    expect(result.gateAttempt.gateDecision).toBe("refused");
    expect(result.gateAttempt.gateDecisionReasonCode).toBe("already_consumed");
    expect(result.receipt.greenlightConsumptionStatus).toBe("replayed");
    expect(greenlightRecord?.payload).toMatchObject({ consumedAt: null, consumedByGateAttemptId: null });
    expect(fixture.store.countRecordsOfType("gateway_check_attempt")).toBe(1);
    expect(fixture.store.countRecordsOfType("mutation_attempt")).toBe(0);
    expect(fixture.store.countRecordsOfType("receipt")).toBe(1);
  });

  it("refuses parameter mismatch before mutation", async () => {
    const fixture = await createGreenlitContract();

    const result = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "other", versionRange: "^4.12.19" },
    });

    expect(result.gateAttempt.gateDecision).toBe("refused");
    expect(result.gateAttempt.gateDecisionReasonCode).toBe("params_mismatch");
    expect(result.mutationAttempt).toBeNull();
    expect(result.receipt.downstreamExecutionStatus).toBe("not_started");
  });

  it("checks current isolation at the gate even after greenlight", async () => {
    const fixture = await createGreenlitContract();
    const streamId = `stream_${fixture.contract.tenantId}_${fixture.contract.organizationId}`;
    const actionPartitionKey = `action:${fixture.contract.actionContractId}`;
    const actionEvents = fixture.store.listEventsForPartition(streamId, actionPartitionKey);
    const actionTail = actionEvents.at(-1);
    if (!actionTail) throw new Error("expected action stream tail before isolation");

    const isolationState = await fixture.kernel.createIsolationState({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      scopeType: "agent",
      scopeId: "agent_demo",
      state: "quarantined",
      reasonCode: "breaker_trip",
      reasonSummary: "Agent exceeded retry budget after greenlight.",
      sourceDecisionRef: "breaker:test",
      observedStreamOffsets: [
        {
          streamId,
          partitionKey: actionPartitionKey,
          observedOffsetStart: 0,
          observedOffsetEnd: actionTail.offset,
          observedEventDigest: actionTail.eventDigest,
        },
      ],
    });

    const result = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });

    expect(result.gateAttempt.gateDecision).toBe("refused");
    expect(result.gateAttempt.gateDecisionReasonCode).toBe("current_isolation_quarantined");
    expect(result.mutationAttempt).toBeNull();
    expect(isolationState.observedStreamOffsets).toEqual([
      {
        streamId,
        partitionKey: actionPartitionKey,
        observedOffsetStart: 0,
        observedOffsetEnd: actionTail.offset,
        observedEventDigest: actionTail.eventDigest,
      },
    ]);

    const isolationEvents = fixture.store.listEventsForPartition(streamId, "isolation:agent_demo");
    expect(isolationEvents.at(-1)?.payload).toEqual({
      state: "quarantined",
      reasonCode: "breaker_trip",
      observedStreamOffsets: isolationState.observedStreamOffsets,
    });
  });

  it("records a breaker decision and atomically creates watermark-bound isolation state", async () => {
    const fixture = await createGreenlitContract();
    const streamId = `stream_${fixture.contract.tenantId}_${fixture.contract.organizationId}`;
    const actionPartitionKey = `action:${fixture.contract.actionContractId}`;
    const actionTail = fixture.store.listEventsForPartition(streamId, actionPartitionKey).at(-1);
    if (!actionTail) throw new Error("expected action stream tail before breaker decision");

    const result = await fixture.kernel.createBreakerDecision({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      listenerId: "listener_sequence_breaker",
      listenerVersion: "v1",
      rulePackRef: "breaker:sequence",
      rulePackVersion: "v1",
      observedStreamOffsets: [
        {
          streamId,
          partitionKey: actionPartitionKey,
          observedOffsetStart: 0,
          observedOffsetEnd: actionTail.offset,
          observedEventDigest: actionTail.eventDigest,
        },
      ],
      decision: "quarantined",
      decisionReasonCode: "sequence_divergence",
      decisionReason: "Generated run diverged after policy evaluation.",
      targetScopeType: "agent",
      targetScopeId: "agent_demo",
      agentId: fixture.contract.agentId,
      runId: fixture.contract.runId,
      gatewayId: fixture.contract.gatewayId,
      resourceRef: fixture.contract.resourceRef,
      actionClass: fixture.contract.actionClass,
      matchedBreakerRuleIds: ["sequence_dependency_final_receipt"],
      supportingEventRefs: [actionTail.streamEventId],
    });

    expect(result.breakerDecision.createdIsolationStateId).toBe(result.isolationState.isolationStateId);
    expect(result.breakerDecision.observedWindowDigest).toMatch(/^sha256:/);
    expect(result.isolationState.sourceDecisionRef).toBe(result.breakerDecision.breakerDecisionId);
    expect(result.isolationState.observedStreamOffsets).toEqual(result.breakerDecision.observedStreamOffsets);

    const breakerRecord = await fixture.store.getRecord("breaker_decision", result.breakerDecision.breakerDecisionId);
    const isolationRecord = await fixture.store.getRecord("isolation_state", result.isolationState.isolationStateId);
    expect(breakerRecord).not.toBeNull();
    expect(isolationRecord).not.toBeNull();

    const breakerEvents = fixture.store.listEventsForPartition(
      streamId,
      `object:${result.breakerDecision.breakerDecisionId}`,
    );
    expect(breakerEvents.map((event) => event.eventType)).toEqual(["breaker_decision_recorded"]);

    const isolationEvents = fixture.store.listEventsForPartition(streamId, "isolation:agent_demo");
    expect(isolationEvents.at(-1)?.eventType).toBe("isolation_changed");
    expect(isolationEvents.at(-1)?.payload).toEqual({
      state: "quarantined",
      reasonCode: "sequence_divergence",
      sourceDecisionRef: result.breakerDecision.breakerDecisionId,
      observedStreamOffsets: result.breakerDecision.observedStreamOffsets,
    });

    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });
    expect(gate.gateAttempt.gateDecision).toBe("refused");
    expect(gate.gateAttempt.gateDecisionReasonCode).toBe("current_isolation_quarantined");
    expect(gate.mutationAttempt).toBeNull();
  });

  it("rejects breaker decisions whose watermark digest does not match the durable stream event", async () => {
    const fixture = await createGreenlitContract();
    const streamId = `stream_${fixture.contract.tenantId}_${fixture.contract.organizationId}`;
    const actionPartitionKey = `action:${fixture.contract.actionContractId}`;
    const actionTail = fixture.store.listEventsForPartition(streamId, actionPartitionKey).at(-1);
    if (!actionTail) throw new Error("expected action stream tail before breaker decision");

    await expect(
      fixture.kernel.createBreakerDecision({
        tenantId: "tenant_demo",
        organizationId: "org_demo",
        listenerId: "listener_sequence_breaker",
        listenerVersion: "v1",
        rulePackRef: "breaker:sequence",
        rulePackVersion: "v1",
        observedStreamOffsets: [
          {
            streamId,
            partitionKey: actionPartitionKey,
            observedOffsetStart: 0,
            observedOffsetEnd: actionTail.offset,
            observedEventDigest: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
          },
        ],
        decision: "quarantined",
        decisionReasonCode: "sequence_divergence",
        decisionReason: "Generated run diverged after policy evaluation.",
        targetScopeType: "agent",
        targetScopeId: "agent_demo",
      }),
    ).rejects.toThrow("observedEventDigest does not match");
    expect(fixture.store.countRecordsOfType("breaker_decision")).toBe(0);
    expect(fixture.store.countRecordsOfType("isolation_state")).toBe(0);
  });

  it("refuses incompatible gateway policy drift before mutation", async () => {
    const fixture = await createGreenlitContract();
    await replaceGatewayRecordOutOfBand(fixture, {
      ...fixture.gateway,
      gatewayRegistryVersion: "v2",
      gatewayPolicyVersion: "v2",
    });

    const result = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });

    expect(result.gateAttempt.gateDecision).toBe("refused");
    expect(result.gateAttempt.gateDecisionReasonCode).toBe("gateway_policy_drift");
    expect(result.gateAttempt.gatewayPolicyDriftStatus).toBe("incompatible");
    expect(result.gateAttempt.currentGatewayPolicyVersion).toBe("v2");
    expect(result.mutationAttempt).toBeNull();
    expect(result.receipt.downstreamExecutionStatus).toBe("not_started");
  });

  it("records compatible stricter gateway policy drift at the gate", async () => {
    const fixture = await createGreenlitContract();
    await replaceGatewayRecordOutOfBand(fixture, {
      ...fixture.gateway,
      gatewayRegistryVersion: "v2",
      gatewayPolicyVersion: "v2",
      gatewayPolicyDriftMode: "allow_compatible_stricter",
      compatiblePreviousGatewayPolicyVersions: ["v1"],
    });

    const result = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });

    expect(result.gateAttempt.gateDecision).toBe("passed");
    expect(result.gateAttempt.gatewayPolicyDriftStatus).toBe("compatible_stricter");
    expect(result.gateAttempt.pinnedGatewayPolicyVersion).toBe("v1");
    expect(result.gateAttempt.currentGatewayPolicyVersion).toBe("v2");
    expect(result.mutationAttempt?.outcome).toBe("submitted");
  });

  it("only turns review_required into greenlight when review binds exact contract and policy input", async () => {
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
      candidate: makePackageInstallCandidate(fixture, { idempotencyKey: "idem_review_hono" }),
    });
    const contract = await fixture.kernel.proposeActionContract(proposalInputForCompilation(compilation, "test-secret"));
    await fixture.kernel.createIsolationState({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      scopeType: "agent",
      scopeId: "agent_demo",
      state: "review_only",
      reasonCode: "sensitive_action",
      reasonSummary: "Package install requires review.",
      sourceDecisionRef: "policy:test",
    });
    const reviewRequired = await fixture.kernel.evaluatePolicy({
      actionContractId: contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
    });
    expect(reviewRequired.decision.decision).toBe("review_required");
    expect(reviewRequired.greenlight).toBeNull();

    const reviewArtifact = await fixture.kernel.createReviewArtifact({
      actionContractId: contract.actionContractId,
      policyDecisionId: reviewRequired.decision.policyDecisionId,
      reviewArtifactRef: "review:exact-contract",
      reviewRenderSchemaVersion: "review-render-v1",
      rendererRef: "renderer:test-review",
      renderedContractDigest: contract.actionContractDigest,
      renderedPolicyInputDigest: reviewRequired.decision.policyInputDigest,
      renderedUncertaintyDigest: await digestCanonical({ uncertaintyMarkers: [] }),
      renderedArtifactDigest: await digestCanonical({ artifact: "review:exact-contract" }),
      uncertaintyMarkers: [],
      evidenceRefs: ["review:evidence:test"],
    });
    const review = await fixture.kernel.createReviewDecision({
      actionContractId: contract.actionContractId,
      policyDecisionId: reviewRequired.decision.policyDecisionId,
      reviewArtifactId: reviewArtifact.reviewArtifactId,
      reviewArtifactDigest: reviewArtifact.reviewArtifactDigest,
      reviewerPrincipalId: "principal_reviewer",
      decision: "approve",
      decisionReasonCode: "human_verified_exact_contract",
      decisionExpiresAt: new Date(Date.now() + 60_000).toISOString(),
      signatureOrAttestationRef: "attestation:test-review",
    });
    const approved = await fixture.kernel.evaluatePolicy({
      actionContractId: contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      reviewDecisionId: review.reviewDecisionId,
      signingSecret: "test-secret",
    });

    expect(approved.decision.decision).toBe("greenlight");
    expect(approved.decision.decisionReasonCode).toBe("review_approved");
    expect(approved.greenlight?.actionContractId).toBe(contract.actionContractId);
  });

  it("keeps a passed gateway check pending until reconciliation records downstream finality", async () => {
    const fixture = await createGreenlitContract();

    const result = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });

    expect(result.gateAttempt.gateDecision).toBe("passed");
    expect(result.mutationAttempt?.outcome).toBe("submitted");
    expect(result.proofGap).toBeNull();
    expect(result.receipt.proofGapIds).toEqual([]);
    expect(result.receipt.finalityStatus).toBe("pending");
  });

  it("reconciles a pending surface operation without a second mutation attempt", async () => {
    const fixture = await createGreenlitContract();
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
      surfaceOperationRef: "surface-op:pending-install",
    });
    if (!gate.mutationAttempt) throw new Error("expected mutation attempt");

    const result = await fixture.kernel.reconcileSurfaceOperation({
      mutationAttemptId: gate.mutationAttempt.mutationAttemptId,
      idempotencyKey: fixture.contract.idempotencyKey,
      observedSurfaceOperationRef: "surface-op:pending-install",
      observedDownstreamStatus: "succeeded",
      evidenceRefs: ["evidence:surface-operation-complete"],
    });

    expect(result.reconciliation.mutationAttemptId).toBe(gate.mutationAttempt.mutationAttemptId);
    expect(result.reconciliation.reconciliationStatus).toBe("resolved");
    expect(result.reconciliation.finalityStatus).toBe("final");
    expect(gate.receipt.finalityStatus).toBe("pending");
    expect(fixture.store.countRecordsOfType("mutation_attempt")).toBe(1);
    expect(fixture.store.countRecordsOfType("surface_operation_reconciliation")).toBe(1);
  });

  it("records a post-mutation proof gap when reconciliation cannot prove downstream finality", async () => {
    const fixture = await createGreenlitContract();
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
      surfaceOperationRef: "surface-op:pending-install",
    });
    if (!gate.mutationAttempt) throw new Error("expected mutation attempt");

    const result = await fixture.kernel.reconcileSurfaceOperation({
      mutationAttemptId: gate.mutationAttempt.mutationAttemptId,
      idempotencyKey: fixture.contract.idempotencyKey,
      observedSurfaceOperationRef: "surface-op:pending-install",
      observedDownstreamStatus: "unknown",
      evidenceRefs: [],
    });

    expect(result.reconciliation.finalityStatus).toBe("unknown");
    expect(result.createdProofGap?.mutationAttemptId).toBe(gate.mutationAttempt.mutationAttemptId);
    expect(result.createdProofGap?.receiptId).toBe(gate.receipt.receiptId);
    expect(result.resolvedProofGaps).toHaveLength(0);
    expect(fixture.store.countRecordsOfType("proof_gap")).toBe(1);
    expect(fixture.store.countRecordsOfType("mutation_attempt")).toBe(1);
  });

  it("resolves a downstream unknown proof gap by reconciling the same mutation attempt", async () => {
    const fixture = await createGreenlitContract();
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });
    const mutationAttemptId = gate.mutationAttempt?.mutationAttemptId;
    if (!mutationAttemptId) throw new Error("expected mutation attempt");
    const unknown = await fixture.kernel.reconcileSurfaceOperation({
      mutationAttemptId,
      idempotencyKey: fixture.contract.idempotencyKey,
      observedDownstreamStatus: "unknown",
      observedSurfaceOperationRef: gate.mutationAttempt?.surfaceOperationRef ?? null,
      evidenceRefs: [],
      resolvedProofGapIds: [],
    });
    const proofGapId = unknown.createdProofGap?.proofGapId;
    if (!proofGapId) throw new Error("expected downstream unknown proof gap");

    const result = await fixture.kernel.reconcileSurfaceOperation({
      mutationAttemptId,
      idempotencyKey: fixture.contract.idempotencyKey,
      observedDownstreamStatus: "succeeded",
      observedSurfaceOperationRef: null,
      evidenceRefs: ["evidence:gateway-reconciled-by-idempotency"],
      resolvedProofGapIds: [proofGapId],
    });
    const resolvedGap = await fixture.store.getRecord("proof_gap", proofGapId);

    expect(result.resolvedProofGaps).toHaveLength(1);
    expect(result.resolvedProofGaps[0]?.resolvedByRef).toBe(result.reconciliation.reconciliationId);
    expect(resolvedGap?.payload).toMatchObject({
      proofGapId,
      resolvedByRef: result.reconciliation.reconciliationId,
    });
  });

  it("rejects reconciliation when idempotency does not match the original mutation", async () => {
    const fixture = await createGreenlitContract();
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
      surfaceOperationRef: "surface-op:pending-install",
    });
    if (!gate.mutationAttempt) throw new Error("expected mutation attempt");

    await expect(
      fixture.kernel.reconcileSurfaceOperation({
        mutationAttemptId: gate.mutationAttempt.mutationAttemptId,
        idempotencyKey: "wrong_idempotency_key",
        observedSurfaceOperationRef: "surface-op:pending-install",
        observedDownstreamStatus: "succeeded",
      }),
    ).rejects.toThrow("idempotency key must match");
  });
});

class StreamConflictOnceStore extends InMemoryProtocolStore {
  private conflictInjected = false;

  override async commitGatewayCheck(commit: GatewayCheckCommit): Promise<GatewayCheckCommitResult> {
    if (!this.conflictInjected) {
      this.conflictInjected = true;
      const firstEvent = commit.events[0];
      if (firstEvent) await this.appendEvent(await buildCompetingStreamEvent(firstEvent));
      return "stream_conflict";
    }
    return super.commitGatewayCheck(commit);
  }
}

class ProtocolStreamConflictOnceStore extends InMemoryProtocolStore {
  private conflictInjected = false;

  constructor(private readonly targetEventType: ContractStreamEvent["eventType"]) {
    super();
  }

  override async commitProtocolRecords(commit: ProtocolCommit): Promise<ProtocolCommitResult> {
    const targetEvent = commit.events.find((event) => event.eventType === this.targetEventType);
    if (!this.conflictInjected && targetEvent) {
      this.conflictInjected = true;
      await this.appendEvent(await buildCompetingStreamEvent(targetEvent));
      return "stream_conflict";
    }
    return super.commitProtocolRecords(commit);
  }
}

class RecoveryTerminalConflictOnceStore extends InMemoryProtocolStore {
  private conflictInjected = false;

  override async commitProtocolRecords(commit: ProtocolCommit): Promise<ProtocolCommitResult> {
    if (!this.conflictInjected && commit.recoveryTerminalClaims?.length) {
      this.conflictInjected = true;
      return "recovery_terminal_conflict";
    }
    return super.commitProtocolRecords(commit);
  }
}

class GreenlightListBlindStore extends InMemoryProtocolStore {
  override async listRecordsByType<T>(
    objectType: ProtocolObjectType,
    scope: { tenantId?: string; organizationId?: string } = {},
  ): Promise<StoredProtocolRecord<T>[]> {
    if (objectType === "greenlight") return [];
    return super.listRecordsByType<T>(objectType, scope);
  }
}

async function replaceGatewayRecordOutOfBand(
  fixture: Awaited<ReturnType<typeof createGreenlitContract>>,
  gateway: GatewayRegistryEntry,
): Promise<void> {
  const recorder = new ProtocolRecorder(fixture.store);
  await fixture.store.putRecord(await recorder.buildRecord({ objectType: "gateway_registry_entry", payload: gateway }));
}

async function createContractRequiringGatewayCheckedPosture(idempotencyKey = "idem_posture_required") {
  const fixture = makeKernelFixture();
  fixture.envelope = {
    ...fixture.envelope,
    envelopeId: "env_posture_required",
    objectiveRef: "intent:install-with-enforcing-gateway",
    requiredProtectedPathState: "gateway_checked",
  };
  await registerFixtureObjects(fixture);
  const compilation = await fixture.kernel.compileIntent({
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    principalIntentRef: "intent:install hono with gateway posture",
    principalId: "principal_demo",
    agentId: "agent_demo",
    runId: "run_demo",
    runtimeAdapterId: "runtime_codex",
    operatingEnvelopeId: fixture.envelope.envelopeId,
    toolCatalogRef: "tool_catalog_demo@v1",
    actionCatalogRef: "action_catalog_demo@v1",
    gatewayRegistryRef: "gateway_registry@v1",
    candidate: makePackageInstallCandidate(fixture, { idempotencyKey }),
  });
  const contract = await fixture.kernel.proposeActionContract(proposalInputForCompilation(compilation, "test-secret"));
  return { ...fixture, compilation, contract };
}

async function buildCompetingStreamEvent(event: ContractStreamEvent): Promise<ContractStreamEvent> {
  const competingEvent = {
    ...event,
    streamEventId: "evt_competing_writer",
    objectRefs: ["gat_competing_writer", event.objectRefs[1] ?? "act_competing"],
    payload: {
      gateDecision: "refused",
      reasonCode: "competing_writer",
    },
  } satisfies ContractStreamEvent;
  const eventSeed = {
    streamId: competingEvent.streamId,
    partitionKey: competingEvent.partitionKey,
    offset: competingEvent.offset,
    eventType: competingEvent.eventType,
    eventTime: competingEvent.eventTime,
    objectRefs: competingEvent.objectRefs,
    previousEventDigest: competingEvent.previousEventDigest,
    payload: competingEvent.payload,
  };
  return {
    ...competingEvent,
    eventDigest: await digestCanonical(eventSeed),
  };
}
