import { describe, expect, it } from "bun:test";
import { HandshakeKernel } from "../../src/protocol/kernel";
import { InMemoryProtocolStore } from "../../src/storage/memory";
import { FaultInjectingProtocolStore } from "../support/fault-injecting-protocol-store";
import type { ProofGap, RecoveryRecommendationStatusTransition } from "../../src/protocol/public/schemas";
import {
  createGreenlitContract,
  makeKernelFixture,
  makePackageInstallCandidate,
  proposalInputForCompilation,
  recordUnknownDownstreamProofGap,
} from "../support/fixtures";

describe("Handshake kernel invariants: receipts and recovery", () => {
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
    const store = new FaultInjectingProtocolStore(new InMemoryProtocolStore()).injectProtocolCommitResultOnce(
      "recovery_terminal_conflict",
      { when: (commit) => Boolean(commit.recoveryTerminalClaims?.length) },
    );
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
    const store = new FaultInjectingProtocolStore(new InMemoryProtocolStore()).injectProtocolCommitResultOnce(
      "recovery_terminal_conflict",
      { when: (commit) => Boolean(commit.recoveryTerminalClaims?.length) },
    );
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
});
