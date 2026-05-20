import { describe, expect, it } from "bun:test";
import type { IdempotencyLedgerEntry } from "../../src/protocol/public/schemas";
import { idempotencyLedgerKey, idempotencyLedgerKeyDigest } from "../../src/protocol/areas/idempotency-ledger";
import { projectIdempotencyRecovery } from "../../src/protocol/evidence-projections";
import {
  createGreenlitContract,
  makeKernelFixture,
  makePackageInstallCandidate,
  proposalInputForCompilation,
} from "../support/fixtures";

describe("Handshake kernel invariants: idempotency ledger", () => {
  it("refuses duplicate same-key authority without minting a second greenlight", async () => {
    const fixture = await createGreenlitContract();

    const duplicate = await proposePackageCandidate(fixture, {
      sequenceNumber: 2,
      idempotencyKey: fixture.contract.idempotencyKey,
    });
    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: duplicate.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });

    expect(policy.greenlight).toBeNull();
    expect(policy.decision.decision).toBe("refuse");
    expect(policy.decision.decisionReasonCode).toBe("idempotency_duplicate_authority");
    expect(fixture.store.countRecordsOfType("greenlight")).toBe(1);
    expect(fixture.store.countRecordsOfType("mutation_attempt")).toBe(0);
    expect(fixture.store.countRecordsOfType("idempotency_ledger_entry")).toBe(1);
    expect(fixture.store.countRecordsOfType("refusal")).toBe(1);

    const projection = await projectIdempotencyRecovery({
      contract: duplicate,
      ledger: await currentLedgerEntry(fixture),
    });
    expect(projection).toMatchObject({
      actionContractRef: duplicate.actionContractId,
      priorActionContractRef: fixture.contract.actionContractId,
      currentLedgerState: "authority_reserved",
      recoveryDisposition: "same_params_duplicate_refused",
      reasonCodes: ["idempotency_duplicate_authority"],
    });
    expect(projection.priorResultRefs).toEqual(
      expect.arrayContaining([
        `action_contract:${fixture.contract.actionContractId}`,
        `policy_decision:${fixture.decision.policyDecisionId}`,
        `greenlight:${fixture.greenlight.greenlightId}`,
      ]),
    );
  });

  it("refuses same idempotency key with a different params digest", async () => {
    const fixture = await createGreenlitContract(makeKernelFixture());

    const duplicate = await proposePackageCandidate(fixture, {
      sequenceNumber: 2,
      idempotencyKey: fixture.contract.idempotencyKey,
      resourceRef: "npm:hono",
      parameters: { package: "hono", versionRange: "^99.0.0" },
      nonSecretParamsSummary: { package: "hono", versionRange: "^99.0.0" },
    });
    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: duplicate.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });

    expect(policy.greenlight).toBeNull();
    expect(policy.decision.decision).toBe("refuse");
    expect(policy.decision.decisionReasonCode).toBe("idempotency_key_params_mismatch");
    expect(fixture.store.countRecordsOfType("greenlight")).toBe(1);
    expect(fixture.store.countRecordsOfType("mutation_attempt")).toBe(0);
    expect(fixture.store.countRecordsOfType("idempotency_ledger_entry")).toBe(1);

    const projection = await projectIdempotencyRecovery({
      contract: duplicate,
      ledger: await currentLedgerEntry(fixture),
    });
    expect(projection).toMatchObject({
      actionContractRef: duplicate.actionContractId,
      priorActionContractRef: fixture.contract.actionContractId,
      paramsDigestMatch: false,
      recoveryDisposition: "different_params_refused",
      reasonCodes: ["idempotency_key_params_mismatch"],
    });
  });

  it("advances ledger state from reservation to mutation and terminal reconciliation", async () => {
    const fixture = await createGreenlitContract();
    const reserved = await currentLedgerEntry(fixture);
    expect(reserved.ledgerState).toBe("authority_reserved");
    expect(reserved.greenlightId).toBe(fixture.greenlight.greenlightId);

    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
      surfaceOperationRef: "surface-op:idempotency-ledger",
    });
    if (!gate.mutationAttempt) throw new Error("expected mutation attempt");
    const started = await currentLedgerEntry(fixture);
    expect(started.ledgerState).toBe("mutation_started");
    expect(started.gateAttemptId).toBe(gate.gateAttempt.gateAttemptId);
    expect(started.mutationAttemptId).toBe(gate.mutationAttempt.mutationAttemptId);

    await fixture.kernel.reconcileSurfaceOperation({
      mutationAttemptId: gate.mutationAttempt.mutationAttemptId,
      idempotencyKey: fixture.contract.idempotencyKey,
      observedSurfaceOperationRef: "surface-op:idempotency-ledger",
      observedDownstreamStatus: "succeeded",
      evidenceRefs: ["evidence:idempotency-ledger-succeeded"],
    });

    const terminal = await currentLedgerEntry(fixture);
    expect(terminal.ledgerState).toBe("terminal_succeeded");
    expect(fixture.store.countRecordsOfType("idempotency_ledger_entry")).toBe(3);
  });

  it("projects duplicate evidence after prior terminal success without minting new authority", async () => {
    const fixture = await createGreenlitContract();
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
      surfaceOperationRef: "surface-op:idempotency-terminal-success",
    });
    if (!gate.mutationAttempt) throw new Error("expected mutation attempt");
    const reconciliation = await fixture.kernel.reconcileSurfaceOperation({
      mutationAttemptId: gate.mutationAttempt.mutationAttemptId,
      idempotencyKey: fixture.contract.idempotencyKey,
      observedSurfaceOperationRef: "surface-op:idempotency-terminal-success",
      observedDownstreamStatus: "succeeded",
      evidenceRefs: ["evidence:idempotency-terminal-success"],
    });

    const duplicate = await proposePackageCandidate(fixture, {
      sequenceNumber: 2,
      idempotencyKey: fixture.contract.idempotencyKey,
    });
    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: duplicate.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });
    expect(policy.greenlight).toBeNull();
    expect(policy.decision.decisionReasonCode).toBe("idempotency_duplicate_authority");

    const projection = await projectIdempotencyRecovery({
      contract: duplicate,
      ledger: await currentLedgerEntry(fixture),
    });
    expect(projection).toMatchObject({
      actionContractRef: duplicate.actionContractId,
      priorActionContractRef: fixture.contract.actionContractId,
      currentLedgerState: "terminal_succeeded",
      recoveryDisposition: "same_params_result_available",
      reasonCodes: ["idempotency_result_reusable"],
      receiptRef: gate.receipt.receiptId,
    });
    expect(projection.priorResultRefs).toEqual(
      expect.arrayContaining([
        `receipt:${gate.receipt.receiptId}`,
        `surface_operation_reconciliation:${reconciliation.reconciliation.reconciliationId}`,
      ]),
    );
  });

  it("projects duplicate evidence after prior terminal unknown as recovery-required", async () => {
    const fixture = await createGreenlitContract();
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
      surfaceOperationRef: "surface-op:idempotency-terminal-unknown",
    });
    if (!gate.mutationAttempt) throw new Error("expected mutation attempt");
    await fixture.kernel.reconcileSurfaceOperation({
      mutationAttemptId: gate.mutationAttempt.mutationAttemptId,
      idempotencyKey: fixture.contract.idempotencyKey,
      observedSurfaceOperationRef: "surface-op:idempotency-terminal-unknown",
      observedDownstreamStatus: "unknown",
      evidenceRefs: [],
    });

    const duplicate = await proposePackageCandidate(fixture, {
      sequenceNumber: 2,
      idempotencyKey: fixture.contract.idempotencyKey,
    });
    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: duplicate.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });
    expect(policy.greenlight).toBeNull();
    expect(policy.decision.decisionReasonCode).toBe("idempotency_duplicate_authority");

    const projection = await projectIdempotencyRecovery({
      contract: duplicate,
      ledger: await currentLedgerEntry(fixture),
    });
    expect(projection).toMatchObject({
      actionContractRef: duplicate.actionContractId,
      priorActionContractRef: fixture.contract.actionContractId,
      currentLedgerState: "terminal_unknown",
      recoveryDisposition: "terminal_unknown_requires_recovery",
      reasonCodes: ["idempotency_terminal_unknown_recovery_required"],
      receiptRef: gate.receipt.receiptId,
    });
    expect(projection.priorResultRefs).toContain(`receipt:${gate.receipt.receiptId}`);
  });
});

async function proposePackageCandidate(
  fixture: Awaited<ReturnType<typeof createGreenlitContract>>,
  overrides: Parameters<typeof makePackageInstallCandidate>[1],
) {
  const compilation = await fixture.kernel.compileIntent({
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    principalIntentRef: `intent:idempotency ${overrides?.idempotencyKey ?? "duplicate"}`,
    principalId: "principal_demo",
    agentId: "agent_demo",
    runId: "run_demo",
    runtimeAdapterId: "runtime_codex",
    operatingEnvelopeId: fixture.envelope.envelopeId,
    toolCatalogRef: "tool_catalog_demo@v1",
    actionCatalogRef: "action_catalog_demo@v1",
    gatewayRegistryRef: "gateway_registry@v1",
    generatedCodeOrSpecRefs: ["code:idempotency-ledger-test"],
    declaredAssumptions: ["idempotency duplicate is explicit"],
    requiredEvidenceRefs: ["evidence:package-lock-diff"],
    candidate: makePackageInstallCandidate(fixture, overrides),
  });
  return fixture.kernel.proposeActionContract(proposalInputForCompilation(compilation, "test-secret"));
}

async function currentLedgerEntry(fixture: Awaited<ReturnType<typeof createGreenlitContract>>) {
  const ledgerKeyDigest = await idempotencyLedgerKeyDigest(idempotencyLedgerKey(fixture.contract));
  const current = await fixture.store.getCurrentIdempotencyLedgerEntry(ledgerKeyDigest);
  if (!current) throw new Error("expected idempotency ledger entry");
  return current.payload as IdempotencyLedgerEntry;
}
