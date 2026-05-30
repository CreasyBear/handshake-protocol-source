import { describe, expect, it } from "bun:test";
import { HandshakeKernel } from "../../src/protocol/kernel";
import { InMemoryProtocolStore } from "../../src/storage/memory";
import {
  makeKernelFixture,
  makePackageInstallCandidate,
  proposalInputForCompilation,
  registerFixtureObjects,
} from "../support/fixtures";
import { TransitionBudgetRecorder, type TransitionBudgetLimit } from "../support/transition-budget-recorder";

const policyBudget = budget({
  maxReads: 9,
  maxWrites: 1,
  maxCommittedRecords: 3,
  maxEmittedEvents: 9,
  maxStreamPartitionsTouched: 3,
});
const gatewayBudget = budget({
  maxReads: 10,
  maxWrites: 1,
  maxCommittedRecords: 6,
  maxEmittedEvents: 12,
  maxStreamPartitionsTouched: 3,
});
const receiptExportBudget = budget({
  maxReads: 7,
  maxWrites: 1,
  maxCommittedRecords: 1,
  maxEmittedEvents: 3,
  maxStreamPartitionsTouched: 3,
});
const reconciliationBudget = budget({
  maxReads: 8,
  maxWrites: 1,
  maxCommittedRecords: 4,
  maxEmittedEvents: 9,
  maxStreamPartitionsTouched: 3,
});
const recoveryStatusBudget = budget({
  maxReads: 5,
  maxWrites: 1,
  maxCommittedRecords: 2,
  maxEmittedEvents: 3,
  maxStreamPartitionsTouched: 3,
});

describe("transition budget recorder", () => {
  it("records conservative budgets for policy, gateway, export, reconciliation, and recovery status transitions", async () => {
    const fixture = await createProposedContractWithBudgetedStore();

    fixture.store.reset();
    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: fixture.contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });
    if (!policy.greenlight) throw new Error("expected budgeted policy greenlight");
    fixture.store.assertWithin("evaluatePolicy", policyBudget);
    expect(fixture.store.snapshot().eventWritesByType).toMatchObject({
      policy_decision_recorded: 3,
      action_greenlit: 3,
      idempotency_ledger_recorded: 3,
    });

    fixture.store.reset();
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: policy.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
      surfaceOperationRef: "surface-op:budgeted-install",
    });
    fixture.store.assertWithin("gatewayCheck", gatewayBudget);
    expect(gate.mutationAttempt).not.toBeNull();
    expect(fixture.store.snapshot().recordWritesByType).toMatchObject({
      gateway_check_attempt: 1,
      mutation_attempt: 1,
      receipt: 1,
      protected_surface_operation_claim: 1,
      idempotency_ledger_entry: 1,
    });

    fixture.store.reset();
    await fixture.kernel.createReceiptExport({
      receiptId: gate.receipt.receiptId,
      exportFormat: "json",
      requestedByRef: "test:budget-recorder",
    });
    fixture.store.assertWithin("createReceiptExport", receiptExportBudget);

    if (!gate.mutationAttempt) throw new Error("expected mutation attempt before reconciliation");
    fixture.store.reset();
    const reconciliation = await fixture.kernel.reconcileSurfaceOperation({
      mutationAttemptId: gate.mutationAttempt.mutationAttemptId,
      idempotencyKey: fixture.contract.idempotencyKey,
      observedSurfaceOperationRef: gate.mutationAttempt.surfaceOperationRef,
      observedDownstreamStatus: "unknown",
      evidenceRefs: [],
      resolvedProofGapIds: [],
    });
    fixture.store.assertWithin("reconcileSurfaceOperation", reconciliationBudget);
    if (!reconciliation.createdProofGap) throw new Error("expected proof gap for unknown downstream finality");

    fixture.store.reset();
    const recommendation = await fixture.kernel.createRecoveryRecommendation({
      sourceReceiptId: gate.receipt.receiptId,
      sourceRefusalOrGapRef: reconciliation.createdProofGap.proofGapId,
      recommendedPath: "narrower_action_contract_required",
      allowedNextActionClasses: [fixture.contract.actionClass],
      requiredNewEvidence: ["gateway_finality_evidence"],
      requiresHumanReview: false,
      reasonCode: "downstream_status_unknown",
      reasonSummary: "Gateway did not produce downstream finality evidence.",
      recoveryExpiresAt: new Date(Date.now() - 1_000).toISOString(),
    });

    fixture.store.reset();
    await fixture.kernel.transitionRecoveryRecommendationStatus({
      recoveryRecommendationId: recommendation.recoveryRecommendationId,
      nextStatus: "expired",
      reasonCode: "recovery_expired",
      reasonSummary: "Recovery recommendation freshness window elapsed.",
      changedByRef: "test:budget-recorder",
    });
    fixture.store.assertWithin("transitionRecoveryRecommendationStatus", recoveryStatusBudget);
  });

  it("prints concrete read/write/record/event/partition counts when a budget drifts", async () => {
    const fixture = await createProposedContractWithBudgetedStore();

    fixture.store.reset();
    await fixture.kernel.evaluatePolicy({
      actionContractId: fixture.contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
    });

    expect(() =>
      fixture.store.assertWithin("evaluatePolicy", {
        ...policyBudget,
        maxReads: 0,
        maxCommittedRecords: 0,
        maxEmittedEvents: 0,
        maxStreamPartitionsTouched: 0,
      }),
    ).toThrow(/reads=.*committedRecords=.*emittedEvents=.*streamPartitionsTouched=.*Snapshot:/s);
  });
});

async function createProposedContractWithBudgetedStore() {
  const base = makeKernelFixture();
  const store = new TransitionBudgetRecorder(new InMemoryProtocolStore());
  const fixture = { ...base, store, kernel: new HandshakeKernel(store) };
  await registerFixtureObjects(fixture);
  const compilation = await fixture.kernel.compileIntent({
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    principalIntentRef: "intent:budget package install",
    principalId: "principal_demo",
    agentId: "agent_demo",
    runId: "run_demo",
    runtimeAdapterId: "runtime_codex",
    operatingEnvelopeId: fixture.envelope.envelopeId,
    toolCatalogRef: "tool_catalog_demo@v1",
    actionCatalogRef: "action_catalog_demo@v1",
    gatewayRegistryRef: "gateway_registry@v1",
    generatedCodeOrSpecRefs: ["code:budget-test"],
    declaredAssumptions: ["package name is explicit"],
    requiredEvidenceRefs: ["evidence:package-lock-diff"],
    candidate: makePackageInstallCandidate(fixture, { idempotencyKey: "idem_budget_package_hono" }),
  });
  const contract = await fixture.kernel.proposeActionContract(proposalInputForCompilation(compilation, "test-secret"));
  return { ...fixture, compilation, contract };
}

function budget(input: TransitionBudgetLimit): TransitionBudgetLimit {
  return input;
}
