import { describe, expect, it } from "bun:test";
import { HandshakeKernel } from "../../src/protocol/kernel";
import { protectedPathPostureScopeKeyForContract } from "../../src/protocol/areas/protected-path-posture";
import { runBypassProbeExecutors } from "../../src/adapters/protected-path-probes";
import { ProtocolRecorder } from "../../src/protocol/events/records";
import { digestCanonical } from "../../src/protocol/foundation/canonical";
import { InMemoryProtocolStore } from "../../src/storage/memory";
import { FaultInjectingProtocolStore } from "../support/fault-injecting-protocol-store";
import {
  createGreenlitContract,
  futureIso,
  makeKernelFixture,
  makePackageInstallCandidate,
  proposalInputForCompilation,
  recordSafeBypassProbes,
  registerFixtureObjects,
} from "../support/fixtures";
import {
  requiredGatewayCheckedBypassProbeKinds,
  type BypassProbeKind,
  type BypassProbeOutcome,
  type Refusal,
} from "../../src/protocol/public/schemas";
import {
  replaceGatewayRecordOutOfBand,
  createContractRequiringGatewayCheckedPosture,
} from "../support/kernel-invariant-helpers";

describe("Handshake kernel invariants: policy and gateway", () => {
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

  it("records refusal instead of issuing a second greenlight for the same action contract", async () => {
    const fixture = await createGreenlitContract();

    const duplicate = await fixture.kernel.evaluatePolicy({
      actionContractId: fixture.contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
    });

    expect(duplicate.decision.decision).toBe("refuse");
    expect(duplicate.decision.decisionReasonCode).toBe("idempotency_duplicate_authority");
    expect(duplicate.greenlight).toBeNull();
    expect(fixture.store.countRecordsOfType("greenlight")).toBe(1);
    const refusals = await fixture.store.listRecordsByType<Refusal>("refusal");
    expect(refusals.at(-1)?.payload).toMatchObject({
      phase: "policy",
      actionContractId: fixture.contract.actionContractId,
      policyDecisionId: duplicate.decision.policyDecisionId,
      greenlightId: null,
      mutationAttempted: false,
      authorityCreated: false,
      reasonCode: "idempotency_duplicate_authority",
    });
  });

  it("uses the idempotency ledger even when the durable greenlight claim read is stale", async () => {
    const base = makeKernelFixture();
    const store = new FaultInjectingProtocolStore(new InMemoryProtocolStore());
    const fixture = await createGreenlitContract({ ...base, store, kernel: new HandshakeKernel(store) });
    store.hideListRecordsByTypeOnce("greenlight");

    const duplicate = await fixture.kernel.evaluatePolicy({
      actionContractId: fixture.contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
    });

    expect(duplicate.decision.decision).toBe("refuse");
    expect(duplicate.decision.decisionReasonCode).toBe("idempotency_duplicate_authority");
    expect(duplicate.greenlight).toBeNull();
    expect(store.countRecordsOfType("greenlight")).toBe(1);
  });

  it("requires fresh gateway_checked protected-path posture before policy can greenlight", async () => {
    const base = makeKernelFixture();
    const store = new FaultInjectingProtocolStore(new InMemoryProtocolStore());
    const fixture = await createContractRequiringGatewayCheckedPosture("idem_posture_required", {
      ...base,
      store,
      kernel: new HandshakeKernel(store),
    });

    const missingPosture = await fixture.kernel.evaluatePolicy({
      actionContractId: fixture.contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
    });
    expect(missingPosture.decision.decision).toBe("refuse");
    expect(missingPosture.decision.decisionReasonCode).toBe("protected_path_posture_missing");
    expect(missingPosture.greenlight).toBeNull();
    const policyRefusals = await fixture.store.listRecordsByType<Refusal>("refusal");
    expect(policyRefusals).toHaveLength(1);
    expect(policyRefusals[0]?.payload).toMatchObject({
      phase: "policy",
      actionContractId: fixture.contract.actionContractId,
      policyDecisionId: missingPosture.decision.policyDecisionId,
      greenlightId: null,
      gateAttemptId: null,
      refusedObjectRef: `policy_decision:${missingPosture.decision.policyDecisionId}`,
      reasonCode: "protected_path_posture_missing",
      mutationAttempted: false,
      authorityCreated: false,
    });

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
      reasonCodes: ["local_fixture_gateway_checked"],
      evidenceRefs: ["evidence:posture:caller-reported"],
      expiresAt: futureIso(),
    });
    const callerReported = await fixture.kernel.evaluatePolicy({
      actionContractId: fixture.contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
    });
    expect(callerReported.decision.decision).toBe("refuse");
    expect(callerReported.decision.decisionReasonCode).toBe("protected_path_source_authority_weak");
    expect(callerReported.greenlight).toBeNull();

    const bypassProbeIds = await recordSafeBypassProbes(fixture);
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
      sourceAuthority: "gateway_probe",
      reasonCodes: ["local_fixture_gateway_checked"],
      evidenceRefs: ["evidence:posture:local-fixture"],
      bypassProbeIds,
      expiresAt: futureIso(),
    });
    const currentPosture = await fixture.store.getCurrentProtectedPathPosture(
      protectedPathPostureScopeKeyForContract(fixture.contract),
    );
    expect(currentPosture?.payload.protectedPathPostureId).toBe(posture.protectedPathPostureId);
    if (!currentPosture) throw new Error("expected current posture");

    store.hideCurrentProtectedPathPostureOnce(protectedPathPostureScopeKeyForContract(fixture.contract));
    const delayedIndex = await fixture.kernel.evaluatePolicy({
      actionContractId: fixture.contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
    });
    expect(delayedIndex.decision.decision).toBe("refuse");
    expect(delayedIndex.decision.decisionReasonCode).toBe("protected_path_posture_missing");

    store.replaceCurrentProtectedPathPostureOnce({
      ...currentPosture,
      payload: {
        ...currentPosture.payload,
        expiresAt: new Date(Date.now() - 1_000).toISOString(),
      },
    });
    const staleIndex = await fixture.kernel.evaluatePolicy({
      actionContractId: fixture.contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
    });
    expect(staleIndex.decision.decision).toBe("refuse");
    expect(staleIndex.decision.decisionReasonCode).toBe("protected_path_posture_stale");

    const greenlit = await fixture.kernel.evaluatePolicy({
      actionContractId: fixture.contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
    });
    expect(greenlit.decision.decision).toBe("greenlight");
    expect(greenlit.greenlight?.protectedPathPostureId).toBe(posture.protectedPathPostureId);
    expect(greenlit.greenlight?.protectedPathPostureDigest).toBe(posture.postureDigest);
  });

  it("treats executor-recorded unsafe bypass probes as protection failure", async () => {
    const fixture = await createContractRequiringGatewayCheckedPosture("idem_probe_executor_failed");
    const probes = await runBypassProbeExecutors(
      fixture.kernel,
      {
        tenantId: "tenant_demo",
        organizationId: "org_demo",
        runtimeAdapterId: "runtime_codex",
        gatewayId: fixture.gateway.gatewayId,
        actionClass: "package.install",
        resourceRef: fixture.contract.resourceRef,
        protectedSurfaceKind: "package_manager",
        expiresAt: futureIso(),
      },
      gatewayProbeExecutors({ token_passthrough_blocking: "failed" }),
    );
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
      sourceAuthority: "gateway_probe",
      reasonCodes: ["local_fixture_gateway_checked"],
      evidenceRefs: ["evidence:posture:local-probe-executor"],
      bypassProbeIds: probes.map((probe) => probe.bypassProbeId),
      expiresAt: futureIso(),
    });

    const decision = await fixture.kernel.evaluatePolicy({
      actionContractId: fixture.contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
    });

    expect(decision.decision.decision).toBe("refuse");
    expect(decision.decision.decisionReasonCode).toBe("protected_path_probe_failed");
    expect(decision.greenlight).toBeNull();
  });

  it("refuses at the gateway when protected-path posture drifts unsafe after greenlight", async () => {
    const fixture = await createContractRequiringGatewayCheckedPosture("idem_posture_drift");
    const bypassProbeIds = await recordSafeBypassProbes(fixture);
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
      sourceAuthority: "gateway_probe",
      bypassProbeIds,
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

    const refusals = await fixture.store.listRecordsByType<Refusal>("refusal");
    expect(refusals).toHaveLength(1);
    expect(refusals[0]?.payload).toMatchObject({
      phase: "gateway",
      actionContractId: fixture.contract.actionContractId,
      policyDecisionId: fixture.greenlight.policyDecisionId,
      greenlightId: fixture.greenlight.greenlightId,
      gateAttemptId: replay.gateAttempt.gateAttemptId,
      refusedObjectRef: `gateway_check_attempt:${replay.gateAttempt.gateAttemptId}`,
      reasonCode: "already_consumed",
      mutationAttempted: false,
      authorityCreated: false,
    });
    expect(fixture.store.countRecordsOfType("mutation_attempt")).toBe(1);
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
      "idempotency_ledger_recorded",
    ]);
    expect(beforeGate.map((event) => event.offset)).toEqual([0, 1, 2, 3]);
    expect(beforeGate[0]?.previousEventDigest).toBeNull();
    expect(beforeGate[1]?.previousEventDigest).toBe(beforeGate[0]?.eventDigest);
    expect(beforeGate[2]?.previousEventDigest).toBe(beforeGate[1]?.eventDigest);
    expect(beforeGate[3]?.previousEventDigest).toBe(beforeGate[2]?.eventDigest);

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
      "idempotency_ledger_recorded",
      "gateway_checked",
      "mutation_attempted",
      "protected_surface_operation_claimed",
      "receipt_emitted",
    ]);
    expect(afterGate.map((event) => event.offset)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    for (let index = 1; index < afterGate.length; index += 1) {
      expect(afterGate[index]?.previousEventDigest).toBe(afterGate[index - 1]?.eventDigest);
    }

    const runEvents = fixture.store.listEventsForPartition(streamId, `run:${fixture.contract.runId}`);
    expect(runEvents.map((event) => event.eventType)).toEqual(afterGate.map((event) => event.eventType));
    expect(runEvents.map((event) => event.offset)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(runEvents.every((event) => event.streamScope === "run")).toBe(true);
    for (let index = 1; index < runEvents.length; index += 1) {
      expect(runEvents[index]?.previousEventDigest).toBe(runEvents[index - 1]?.eventDigest);
    }

    const resourceEvents = fixture.store.listEventsForPartition(
      streamId,
      `protected_surface_resource:${fixture.contract.gatewayId}:${fixture.contract.resourceRef}`,
    );
    expect(resourceEvents.map((event) => event.eventType)).toEqual(afterGate.map((event) => event.eventType));
    expect(resourceEvents.map((event) => event.offset)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
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
    expect(gate.receipt.streamEventIds).toHaveLength(12);
    expect(gate.receipt.receiptDigest).toMatch(/^sha256:/);
    expect(gate.receipt.auditChainDigest).toMatch(/^sha256:/);
    expect(gate.receipt.streamOffsets).toEqual([
      {
        streamId,
        streamScope: "organization",
        partitionKey,
        offsetStart: 0,
        offsetEnd: 7,
        terminalEventDigest: actionReceiptEvent.eventDigest,
      },
      {
        streamId,
        streamScope: "run",
        partitionKey: `run:${fixture.contract.runId}`,
        offsetStart: 0,
        offsetEnd: 7,
        terminalEventDigest: runReceiptEvent.eventDigest,
      },
      {
        streamId,
        streamScope: "protected_surface_resource",
        partitionKey: `protected_surface_resource:${fixture.contract.gatewayId}:${fixture.contract.resourceRef}`,
        offsetStart: 0,
        offsetEnd: 7,
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

  it("rebuilds policy and greenlight events after an offset conflict", async () => {
    const base = makeKernelFixture();
    const store = new FaultInjectingProtocolStore(new InMemoryProtocolStore()).injectProtocolCommitResultOnce(
      "stream_conflict",
      { targetEventType: "policy_decision_recorded", appendCompetingEvent: true },
    );
    const fixture = await createGreenlitContract({ ...base, store, kernel: new HandshakeKernel(store) });
    const streamId = `stream_${fixture.contract.tenantId}_${fixture.contract.organizationId}`;
    const partitionKey = `action:${fixture.contract.actionContractId}`;
    const events = store.listEventsForPartition(streamId, partitionKey);
    const policyEvent = events.find(
      (event) =>
        event.eventType === "policy_decision_recorded" && event.objectRefs.includes(fixture.decision.policyDecisionId),
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
    const base = makeKernelFixture();
    const store = new FaultInjectingProtocolStore(new InMemoryProtocolStore()).injectGatewayCommitResultOnce(
      "already_consumed",
      { when: (commit) => Boolean(commit.consumption) },
    );
    const fixture = await createGreenlitContract({ ...base, store, kernel: new HandshakeKernel(store) });

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
    const refusals = await fixture.store.listRecordsByType<Refusal>("refusal");
    expect(refusals).toHaveLength(1);
    expect(refusals[0]?.payload.gateAttemptId).toBe(result.gateAttempt.gateAttemptId);
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

    const isolationEvents = fixture.store.listEventsForPartition(streamId, "isolation:agent:agent_demo");
    expect(isolationEvents.at(-1)?.payload).toEqual({
      state: "quarantined",
      reasonCode: "breaker_trip",
      observedStreamOffsets: isolationState.observedStreamOffsets,
    });
  });

  it("refuses incompatible gateway policy drift before mutation", async () => {
    const base = makeKernelFixture();
    const store = new FaultInjectingProtocolStore(new InMemoryProtocolStore());
    const fixture = await createGreenlitContract({ ...base, store, kernel: new HandshakeKernel(store) });
    const recorder = new ProtocolRecorder(fixture.store);
    const driftedGateway = await recorder.buildRecord({
      objectType: "gateway_registry_entry",
      payload: {
        ...fixture.gateway,
        gatewayRegistryVersion: "v2",
        gatewayPolicyVersion: "v2",
      },
    });
    store.replaceRecordOnce(driftedGateway);

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
    const contract = await fixture.kernel.proposeActionContract(
      proposalInputForCompilation(compilation, "test-secret"),
    );
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
      catalogDigest: await digestCanonical({ catalog: "action_catalog_demo@v1" }),
      rendererDigest: await digestCanonical({ renderer: "renderer:test-review" }),
      actionBindingDigest: await digestCanonical({ actionContractId: contract.actionContractId }),
      hiddenActionPosture: "no_hidden_actions_detected",
      secondaryActionPosture: "no_secondary_actions_detected",
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
    const rejectedReview = await fixture.kernel.createReviewDecision({
      actionContractId: contract.actionContractId,
      policyDecisionId: reviewRequired.decision.policyDecisionId,
      reviewArtifactId: reviewArtifact.reviewArtifactId,
      reviewArtifactDigest: reviewArtifact.reviewArtifactDigest,
      reviewerPrincipalId: "principal_reviewer",
      decision: "reject",
      decisionReasonCode: "sensitive_action",
      decisionExpiresAt: new Date(Date.now() + 60_000).toISOString(),
      signatureOrAttestationRef: "attestation:test-review-reject",
    });
    const reviewRefusals = (await fixture.store.listRecordsByType<Refusal>("refusal")).filter(
      (record) => record.payload.phase === "review",
    );
    expect(reviewRefusals).toHaveLength(1);
    expect(reviewRefusals[0]?.payload).toMatchObject({
      actionContractId: contract.actionContractId,
      policyDecisionId: reviewRequired.decision.policyDecisionId,
      refusedObjectRef: `review_decision:${rejectedReview.reviewDecisionId}`,
      reasonCode: "sensitive_action",
      mutationAttempted: false,
      authorityCreated: false,
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
});

function gatewayProbeExecutors(posture: Partial<Record<BypassProbeKind, BypassProbeOutcome>> = {}) {
  return requiredGatewayCheckedBypassProbeKinds.map((probeKind) => ({
    probeKind,
    async execute() {
      const probeOutcome = posture[probeKind] ?? "passed";
      return {
        probeOutcome,
        sourceAuthority: "gateway_probe" as const,
        reasonCodes: [probeOutcome === "passed" ? "bypass_probe_passed" : "protected_path_probe_failed"],
        evidenceRefs: [`evidence:gateway-probe:${probeKind}:${probeOutcome}`],
      };
    },
  }));
}
