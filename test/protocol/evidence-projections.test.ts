import { describe, expect, it } from "bun:test";
import {
  projectAgentTransactionEnvelope,
  projectContractEvidence,
  projectProtectedPathInstallHealth,
  projectReceiptTimeline,
} from "../../src/protocol/evidence-projections";
import {
  idempotencyLedgerKey,
  idempotencyLedgerKeyDigest,
  type IdempotencyLedgerEntry,
} from "../../src/protocol/areas/idempotency-ledger";
import type { ProofGap } from "../../src/protocol/areas/proof-gap";
import type { Refusal } from "../../src/protocol/areas/refusal";
import {
  createGreenlitContract,
  makePackageInstallCandidate,
  proposalInputForCompilation,
  recordUnknownDownstreamProofGap,
} from "../support/fixtures";

describe("protocol evidence projections", () => {
  it("carries clearing evidence refs without making them authority", async () => {
    const fixture = await createGreenlitContract();
    const compilation = await fixture.kernel.compileIntent({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:clearing refs should not widen scope",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      operatingEnvelopeId: fixture.envelope.envelopeId,
      toolCatalogRef: "tool_catalog_demo@v1",
      actionCatalogRef: "action_catalog_demo@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      candidate: makePackageInstallCandidate(fixture, {
        idempotencyKey: "idem_clearing_refs",
        sequenceNumber: 2,
        clearingEvidenceRefs: {
          correlationRef: "plan:upgrade-staging",
          obligationRef: "obligation:outside-envelope",
          counterpartyRef: "counterparty:payment-network",
        },
      }),
    });
    const contract = await fixture.kernel.proposeActionContract(proposalInputForCompilation(compilation));
    const projection = projectContractEvidence(contract);

    expect(contract.clearingEvidenceRefs).toEqual({
      correlationRef: "plan:upgrade-staging",
      obligationRef: "obligation:outside-envelope",
      counterpartyRef: "counterparty:payment-network",
    });
    expect(projection.clearingEvidenceRefs).toEqual(contract.clearingEvidenceRefs);

    const invalid = await fixture.kernel.compileIntent({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:clearing refs still cannot authorize package outside envelope",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      operatingEnvelopeId: fixture.envelope.envelopeId,
      toolCatalogRef: "tool_catalog_demo@v1",
      actionCatalogRef: "action_catalog_demo@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      candidate: makePackageInstallCandidate(fixture, {
        idempotencyKey: "idem_clearing_refs_invalid",
        sequenceNumber: 3,
        resourceRef: "npm:left-pad",
        clearingEvidenceRefs: { obligationRef: "obligation:install-left-pad" },
      }),
    });

    expect(invalid.candidateAction.candidateStatus).toBe("rejected");
    expect(invalid.overreachReasonCodes).toContain("envelope_resource_not_allowed");
    expect(invalid.candidateAction.clearingEvidenceRefs).toEqual({ obligationRef: "obligation:install-left-pad" });
  });

  it("derives receipt timeline admission and downstream status from receipt truth", async () => {
    const fixture = await createGreenlitContract();
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters,
      surfaceOperationRef: "surface-op:projection-status",
    });
    const timeline = projectReceiptTimeline({
      receipt: gate.receipt,
      events: [],
      missingEventCount: 0,
      reconciliations: [],
    });

    expect(gate.receipt.gatewayAdmissionStatus).toBe("admitted");
    expect(gate.receipt.downstreamOutcomeStatus).toBe("pending");
    expect(timeline.gatewayAdmissionStatus).toBe("admitted");
    expect(timeline.downstreamOutcomeStatus).toBe("pending");
  });

  it("projects refusal and admitted paths as read-only agent transaction envelopes", async () => {
    const fixture = await createGreenlitContract();
    const duplicateCompilation = await fixture.kernel.compileIntent({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:duplicate should be refused before gateway",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      operatingEnvelopeId: fixture.envelope.envelopeId,
      toolCatalogRef: "tool_catalog_demo@v1",
      actionCatalogRef: "action_catalog_demo@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      candidate: makePackageInstallCandidate(fixture, {
        idempotencyKey: fixture.contract.idempotencyKey,
        sequenceNumber: 2,
      }),
    });
    const duplicateContract = await fixture.kernel.proposeActionContract(
      proposalInputForCompilation(duplicateCompilation),
    );
    const refusedPolicy = await fixture.kernel.evaluatePolicy({
      actionContractId: duplicateContract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
    });
    const refusedEnvelope = await projectAgentTransactionEnvelope({
      contract: duplicateContract,
      policyDecision: refusedPolicy.decision,
      refusals: (await fixture.store.listRecordsByType<Refusal>("refusal")).map((record) => record.payload),
    });

    expect(refusedPolicy.decision.decision).toBe("refuse");
    expect(refusedEnvelope.gatewayAdmissionStatus).toBe("not_requested");
    expect(refusedEnvelope.downstreamOutcomeStatus).toBe("not_started");
    expect(refusedEnvelope.greenlightRef).toBeNull();
    expect(refusedEnvelope.receiptRef).toBeNull();
    expect(refusedEnvelope.refusalRefs).toHaveLength(1);
    expect(refusedEnvelope.refusalReasonCodes).toContain("idempotency_duplicate_authority");

    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters,
      surfaceOperationRef: "surface-op:agent-envelope",
    });
    const ledger = await currentLedgerForContract(fixture);
    const admittedEnvelope = await projectAgentTransactionEnvelope({
      contract: fixture.contract,
      policyDecision: fixture.decision,
      greenlight: fixture.greenlight,
      gateAttempt: gate.gateAttempt,
      mutationAttempt: gate.mutationAttempt,
      receipt: gate.receipt,
      ledger,
    });

    expect(admittedEnvelope.gatewayAdmissionStatus).toBe("admitted");
    expect(admittedEnvelope.downstreamOutcomeStatus).toBe("pending");
    expect(admittedEnvelope.receiptRef).toBe(gate.receipt.receiptId);
    expect(admittedEnvelope.idempotencyLedgerRef).toBe(ledger.idempotencyLedgerEntryId);
    expect(admittedEnvelope.idempotencyLedgerState).toBe("mutation_started");
    expect(admittedEnvelope.idempotencyRecoveryDisposition).toBe("same_params_duplicate_refused");
    expect(admittedEnvelope.idempotencyReasonCodes).toEqual(["idempotency_duplicate_authority"]);
    expect(admittedEnvelope.envelopeDigest).toMatch(/^sha256:/);
  });

  it("projects gateway replay and downstream proof-gap evidence without treating either as admission", async () => {
    const fixture = await createGreenlitContract();
    const firstGate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters,
      surfaceOperationRef: "surface-op:agent-envelope-replay",
    });
    const replay = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters,
      surfaceOperationRef: "surface-op:agent-envelope-replay",
    });
    const replayRefusals = (await fixture.store.listRecordsByType<Refusal>("refusal")).map((record) => record.payload);
    const replayEnvelope = await projectAgentTransactionEnvelope({
      contract: fixture.contract,
      policyDecision: fixture.decision,
      greenlight: fixture.greenlight,
      gateAttempt: replay.gateAttempt,
      receipt: replay.receipt,
      refusals: replayRefusals,
    });

    expect(firstGate.receipt.gatewayAdmissionStatus).toBe("admitted");
    expect(replayEnvelope.gatewayAdmissionStatus).toBe("replayed");
    expect(replayEnvelope.downstreamOutcomeStatus).toBe("not_started");
    expect(replayEnvelope.refusalReasonCodes).toContain("already_consumed");
    expect(replayEnvelope.mutationAttemptRef).toBeNull();

    const proofFixture = await createGreenlitContract();
    const proofGate = await proofFixture.kernel.gatewayCheck({
      actionContractId: proofFixture.contract.actionContractId,
      greenlightId: proofFixture.greenlight.greenlightId,
      observedParameters: proofFixture.contract.parameters,
      surfaceOperationRef: "surface-op:agent-envelope-proof-gap",
    });
    const proofGap = await recordUnknownDownstreamProofGap(proofFixture, proofGate);
    const proofGapEnvelope = await projectAgentTransactionEnvelope({
      contract: proofFixture.contract,
      policyDecision: proofFixture.decision,
      greenlight: proofFixture.greenlight,
      gateAttempt: proofGate.gateAttempt,
      mutationAttempt: proofGate.mutationAttempt,
      receipt: proofGate.receipt,
      proofGaps: (await proofFixture.store.listRecordsByType<ProofGap>("proof_gap")).map((record) => record.payload),
      ledger: await currentLedgerForContract(proofFixture),
    });

    expect(proofGapEnvelope.gatewayAdmissionStatus).toBe("admitted");
    expect(proofGapEnvelope.proofGapRefs).toContain(proofGap.proofGapId);
    expect(proofGapEnvelope.proofGapReasonCodes).toContain("orphan_mitigation_required");
    expect(proofGapEnvelope.idempotencyLedgerState).toBe("terminal_unknown");
    expect(proofGapEnvelope.idempotencyRecoveryDisposition).toBe("terminal_unknown_requires_recovery");
  });

  it("generalizes protected-path health beyond package install action classes", async () => {
    const fixture = await createGreenlitContract();
    const x402LikeContract = {
      ...fixture.contract,
      actionClass: "x402_payment.exact",
      protectedSurfaceKind: "payment",
      requiredProtectedPathState: "gateway_checked" as const,
    };

    const health = projectProtectedPathInstallHealth({
      contract: x402LikeContract,
      gateway: null,
      posture: null,
      now: new Date().toISOString(),
    });

    expect(health.actionClass).toBe("x402_payment.exact");
    expect(health.installHealthStatus).toBe("unknown");
  });
});

async function currentLedgerForContract(
  fixture: Awaited<ReturnType<typeof createGreenlitContract>>,
): Promise<IdempotencyLedgerEntry> {
  const ledgerKeyDigest = await idempotencyLedgerKeyDigest(idempotencyLedgerKey(fixture.contract));
  const current = await fixture.store.getCurrentIdempotencyLedgerEntry(ledgerKeyDigest);
  if (!current) throw new Error("expected current ledger entry");
  return current.payload;
}
