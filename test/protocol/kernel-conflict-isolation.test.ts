import { describe, expect, it } from "bun:test";
import { HandshakeKernel } from "../../src/protocol/kernel";
import { InMemoryProtocolStore } from "../../src/storage/memory";
import { FaultInjectingProtocolStore } from "../support/fault-injecting-protocol-store";
import {
  createGreenlitContract,
  makeKernelFixture,
  makePackageInstallCandidate,
  proposalInputForCompilation,
  registerFixtureObjects,
} from "../support/fixtures";

describe("Handshake kernel invariants: conflict and isolation", () => {
  it("rebuilds gateway check stream events after an offset conflict", async () => {
    const base = makeKernelFixture();
    const store = new FaultInjectingProtocolStore(new InMemoryProtocolStore()).injectGatewayCommitResultOnce(
      "stream_conflict",
      { appendCompetingEvent: true },
    );
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
    const store = new FaultInjectingProtocolStore(new InMemoryProtocolStore()).injectProtocolCommitResultOnce(
      "stream_conflict",
      { targetEventType: "action_proposed", appendCompetingEvent: true },
    );
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

  it("records an operation-claim conflict refusal without mutation authority", async () => {
    const base = makeKernelFixture();
    const store = new FaultInjectingProtocolStore(new InMemoryProtocolStore()).injectGatewayCommitResultOnce(
      "operation_claim_conflict",
      { when: (commit) => Boolean(commit.protectedSurfaceOperationClaimIndexEntries?.length) },
    );
    const fixture = await createGreenlitContract({ ...base, store, kernel: new HandshakeKernel(store) });

    const result = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });

    expect(result.gateAttempt.gateDecision).toBe("refused");
    expect(result.gateAttempt.gateDecisionReasonCode).toBe("protected_surface_operation_in_progress");
    expect(result.receipt.greenlightConsumptionStatus).toBe("not_consumed");
    expect(result.mutationAttempt).toBeNull();
    expect(fixture.store.countRecordsOfType("mutation_attempt")).toBe(0);
    expect(fixture.store.countRecordsOfType("protected_surface_operation_claim")).toBe(0);
    expect(fixture.store.countRecordsOfType("receipt")).toBe(1);
  });

  it("does not let another tenant isolation state block policy for the same agent id", async () => {
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
      candidate: makePackageInstallCandidate(fixture, { idempotencyKey: "idem_cross_tenant_isolation" }),
    });
    const contract = await fixture.kernel.proposeActionContract(
      proposalInputForCompilation(compilation, "test-secret"),
    );

    await fixture.kernel.createIsolationState({
      tenantId: "tenant_foreign",
      organizationId: "org_foreign",
      scopeType: "agent",
      scopeId: "agent_demo",
      state: "quarantined",
      reasonCode: "foreign_tenant_breaker",
      reasonSummary: "Foreign tenant agent state must not block this tenant.",
      sourceDecisionRef: "breaker:foreign-tenant",
    });

    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });

    expect(policy.decision.decision).toBe("greenlight");
    expect(policy.greenlight).not.toBeNull();
  });

  it("does not let another organization isolation state block the same resource at the gate", async () => {
    const fixture = await createGreenlitContract();

    await fixture.kernel.createIsolationState({
      tenantId: fixture.contract.tenantId,
      organizationId: "org_foreign",
      scopeType: "resource",
      scopeId: fixture.contract.resourceRef,
      state: "quarantined",
      reasonCode: "foreign_org_resource_breaker",
      reasonSummary: "Foreign organization resource state must not block this organization.",
      sourceDecisionRef: "breaker:foreign-org",
    });

    const result = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });

    expect(result.gateAttempt.gateDecision).toBe("passed");
    expect(result.mutationAttempt).not.toBeNull();
  });

  it("does not treat a gateway isolation as a resource isolation with the same id", async () => {
    const base = makeKernelFixture();
    const fixture = {
      ...base,
      envelope: {
        ...base.envelope,
        allowedResources: ["gw_demo"],
      },
    };
    await registerFixtureObjects(fixture);
    const compilation = await fixture.kernel.compileIntent({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:install on scoped resource",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      operatingEnvelopeId: "env_demo",
      toolCatalogRef: "tool_catalog_demo@v1",
      actionCatalogRef: "action_catalog_demo@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      candidate: makePackageInstallCandidate(fixture, {
        resourceRef: "gw_demo",
        idempotencyKey: "idem_scope_type_isolation",
      }),
    });
    const contract = await fixture.kernel.proposeActionContract(
      proposalInputForCompilation(compilation, "test-secret"),
    );
    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });
    if (!policy.greenlight) throw new Error("expected scope-type contract to greenlight");

    await fixture.kernel.createIsolationState({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      scopeType: "gateway",
      scopeId: "gw_demo",
      state: "quarantined",
      reasonCode: "gateway_scope_only",
      reasonSummary: "Gateway scope must not block a resource with the same id.",
      sourceDecisionRef: "breaker:scope-type",
    });

    const result = await fixture.kernel.gatewayCheck({
      actionContractId: contract.actionContractId,
      greenlightId: policy.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });

    expect(result.gateAttempt.gateDecision).toBe("passed");
    expect(result.mutationAttempt).not.toBeNull();
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

    const isolationEvents = fixture.store.listEventsForPartition(streamId, "isolation:agent:agent_demo");
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
});
