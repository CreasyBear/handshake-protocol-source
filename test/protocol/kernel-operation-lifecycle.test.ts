import { describe, expect, it } from "bun:test";
import { createGreenlitContract, makeKernelFixture } from "../support/fixtures";
import { createAdditionalGreenlitPackageContract } from "../support/kernel-invariant-helpers";

describe("Handshake kernel invariants: operation lifecycle", () => {
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

  it("refuses a second same-surface gateway check while an operation claim is active", async () => {
    const fixture = await createGreenlitContract();
    const firstGate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });
    expect(firstGate.gateAttempt.gateDecision).toBe("passed");

    const second = await createAdditionalGreenlitPackageContract(fixture, {
      sequenceNumber: 2,
      idempotencyKey: "idem_package_hono_second",
    });
    const secondGate = await fixture.kernel.gatewayCheck({
      actionContractId: second.contract.actionContractId,
      greenlightId: second.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });

    expect(secondGate.gateAttempt.gateDecision).toBe("refused");
    expect(secondGate.gateAttempt.gateDecisionReasonCode).toBe("protected_surface_operation_in_progress");
    expect(secondGate.mutationAttempt).toBeNull();
    expect(fixture.store.countRecordsOfType("mutation_attempt")).toBe(1);
    expect(fixture.store.countRecordsOfType("protected_surface_operation_claim")).toBe(1);
  });

  it("allows unrelated protected surfaces while another operation claim is active", async () => {
    const base = makeKernelFixture();
    base.envelope = { ...base.envelope, allowedResources: ["npm:hono", "npm:zod"] };
    const fixture = await createGreenlitContract(base);
    await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });

    const second = await createAdditionalGreenlitPackageContract(fixture, {
      sequenceNumber: 2,
      resourceRef: "npm:zod",
      parameters: { package: "zod", versionRange: "^4.0.0" },
      nonSecretParamsSummary: { package: "zod", versionRange: "^4.0.0" },
      idempotencyKey: "idem_package_zod",
    });
    const secondGate = await fixture.kernel.gatewayCheck({
      actionContractId: second.contract.actionContractId,
      greenlightId: second.greenlight.greenlightId,
      observedParameters: { package: "zod", versionRange: "^4.0.0" },
    });

    expect(secondGate.gateAttempt.gateDecision).toBe("passed");
    expect(secondGate.mutationAttempt).not.toBeNull();
    expect(fixture.store.countRecordsOfType("mutation_attempt")).toBe(2);
  });

  it("keeps orphan claims blocking and creates scoped isolation when configured", async () => {
    const isolationFixture = await createGreenlitContract();
    const isolationGate = await isolationFixture.kernel.gatewayCheck({
      actionContractId: isolationFixture.contract.actionContractId,
      greenlightId: isolationFixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });
    if (!isolationGate.mutationAttempt) throw new Error("expected mutation attempt");

    const orphan = await isolationFixture.kernel.reconcileSurfaceOperation({
      mutationAttemptId: isolationGate.mutationAttempt.mutationAttemptId,
      idempotencyKey: isolationFixture.contract.idempotencyKey,
      observedSurfaceOperationRef: isolationGate.mutationAttempt.surfaceOperationRef,
      observedDownstreamStatus: "unknown",
      evidenceRefs: [],
      resolvedProofGapIds: [],
      orphanIsolationRequested: true,
    });
    expect(orphan.createdProofGap?.reasonCode).toBe("orphan_mitigation_required");
    expect(isolationFixture.store.countRecordsOfType("isolation_state")).toBe(1);

    const fixture = await createGreenlitContract();
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });
    if (!gate.mutationAttempt) throw new Error("expected mutation attempt");
    await fixture.kernel.reconcileSurfaceOperation({
      mutationAttemptId: gate.mutationAttempt.mutationAttemptId,
      idempotencyKey: fixture.contract.idempotencyKey,
      observedSurfaceOperationRef: gate.mutationAttempt.surfaceOperationRef,
      observedDownstreamStatus: "unknown",
      evidenceRefs: ["policy:orphan-isolation"],
      resolvedProofGapIds: [],
    });
    expect(fixture.store.countRecordsOfType("isolation_state")).toBe(0);

    const second = await createAdditionalGreenlitPackageContract(fixture, {
      sequenceNumber: 2,
      idempotencyKey: "idem_package_hono_after_orphan",
    });
    const secondGate = await fixture.kernel.gatewayCheck({
      actionContractId: second.contract.actionContractId,
      greenlightId: second.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });
    expect(secondGate.gateAttempt.gateDecision).toBe("refused");
    expect(secondGate.gateAttempt.gateDecisionReasonCode).toBe("protected_surface_operation_in_progress");
    expect(secondGate.mutationAttempt).toBeNull();
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
