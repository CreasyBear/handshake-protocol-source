import { describe, expect, it } from "bun:test";
import { createApp } from "../src/http/app";
import { HandshakeKernel } from "../src/protocol/kernel";
import type { ProofGap, RecoveryRecommendationStatusTransition } from "../src/protocol/schemas";
import { InMemoryProtocolStore } from "../src/storage/memory";
import type { ProtocolCommit, ProtocolCommitResult } from "../src/storage/store";
import { createGreenlitContract, makeKernelFixture } from "./fixtures";

describe("Hono protocol surface", () => {
  it("serves health and OpenAPI metadata", async () => {
    const app = createApp();

    const health = await app.request("/health");
    expect(health.status).toBe(200);
    expect(await health.json()).toMatchObject({ ok: true, protocol: "handshake" });

    const openapi = await app.request("/openapi.json");
    expect(openapi.status).toBe(200);
    expect(await openapi.json()).toMatchObject({ openapi: "3.1.0" });
  });

  it("fails closed for state-changing endpoints without durable storage", async () => {
    const fixture = makeKernelFixture();
    const app = createApp();

    const response = await app.request("/v0.2/catalog/tool-capabilities", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(fixture.tool),
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: { code: "durable_store_unavailable" },
    });
  });

  it("returns structured gate receipts through HTTP", async () => {
    const fixture = await createGreenlitContract();
    const app = createApp({ store: fixture.store });

    const response = await app.request("/v0.2/receiver-gate-attempts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actionContractId: fixture.contract.actionContractId,
        greenlightId: fixture.greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
        downstreamMode: "succeed",
      }),
    });

    expect(response.status).toBe(201);
    const body = (await response.json()) as { gateAttempt: { gateDecision: string }; receipt: { finalityStatus: string } };
    expect(body.gateAttempt.gateDecision).toBe("passed");
    expect(body.receipt.finalityStatus).toBe("final");
  });

  it("resolves recovery terminal conflict proof gaps through HTTP", async () => {
    const state = await createRecoveryTerminalConflictState();
    const app = createApp({ store: state.fixture.store });

    const response = await app.request("/v0.2/recovery-terminal-conflict-resolutions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        proofGapId: state.terminalConflictGap.proofGapId,
        recoveryRecommendationStatusTransitionId:
          state.winningTransition.recoveryRecommendationStatusTransitionId,
        observedByRef: "test:http-terminal-transition-loader",
      }),
    });

    expect(response.status).toBe(201);
    const body = (await response.json()) as { proofGap: ProofGap };
    expect(body.proofGap.resolvedByRef).toBe(
      state.winningTransition.recoveryRecommendationStatusTransitionId,
    );
    const storedGap = await state.fixture.store.getRecord<ProofGap>(
      "proof_gap",
      state.terminalConflictGap.proofGapId,
    );
    expect(storedGap?.payload.resolvedByRef).toBe(
      state.winningTransition.recoveryRecommendationStatusTransitionId,
    );
  });
});

async function createRecoveryTerminalConflictState() {
  const base = makeKernelFixture();
  const store = new RecoveryTerminalConflictOnceStore();
  const fixture = await createGreenlitContract({ ...base, store, kernel: new HandshakeKernel(store) });
  const gate = await fixture.kernel.receiverGate({
    actionContractId: fixture.contract.actionContractId,
    greenlightId: fixture.greenlight.greenlightId,
    observedParameters: { package: "hono", versionRange: "^4.12.19" },
    downstreamMode: "unknown",
  });
  const sourceProofGapId = gate.proofGap?.proofGapId;
  if (!sourceProofGapId) throw new Error("expected source proof gap");
  const recommendation = await fixture.kernel.createRecoveryRecommendation({
    sourceReceiptId: gate.receipt.receiptId,
    sourceRefusalOrGapRef: sourceProofGapId,
    recommendedPath: "narrower_action_contract_required",
    allowedNextActionClasses: [fixture.contract.actionClass],
    requiredNewEvidence: ["receiver_finality_evidence"],
    requiresHumanReview: false,
    reasonCode: "downstream_status_unknown",
    reasonSummary: "Receiver did not produce downstream finality evidence.",
  });
  const compilation = await fixture.kernel.compileIntent({
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    principalIntentRef: "intent:http recovery terminal conflict",
    principalId: "principal_demo",
    agentId: "agent_demo",
    runId: "run_demo",
    runtimeAdapterId: "runtime_codex",
    operatingEnvelopeId: fixture.envelope.envelopeId,
    toolCatalogRef: "tool_catalog_demo@v1",
    actionCatalogRef: "action_catalog_demo@v1",
    receiverRegistryRef: "receiver_registry@v1",
    candidate: {
      toolCapabilityId: fixture.tool.toolCapabilityId,
      actionTypeId: fixture.actionType.actionTypeId,
      receiverRegistryEntryId: fixture.receiver.receiverRegistryEntryId,
      actionClass: fixture.contract.actionClass,
      receiverId: fixture.contract.receiverId,
      resourceRef: fixture.contract.resourceRef,
    },
  });
  const followUpInput = {
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    intentCompilationId: compilation.intentCompilationId,
    envelopeId: fixture.envelope.envelopeId,
    receiverRegistryEntryId: fixture.receiver.receiverRegistryEntryId,
    receiverId: fixture.receiver.receiverId,
    principalId: "principal_demo",
    agentId: "agent_demo",
    runId: "run_demo",
    sequenceNumber: fixture.contract.sequenceNumber + 1,
    recoveryRecommendationId: recommendation.recoveryRecommendationId,
    actionClass: fixture.contract.actionClass,
    resourceRef: fixture.contract.resourceRef,
    parameters: { package: "hono", versionRange: "^4.12.19" },
    nonSecretParamsSummary: { package: "hono", versionRange: "^4.12.19" },
    purposeCode: "dependency_add_recovery",
    expectedSideEffectCodes: ["package_json_change", "lockfile_change"],
    evidenceRefs: ["receiver_finality_evidence"],
    bounds: { maxPackages: 1 },
    idempotencyKey: "idem_http_recovery_terminal_loser",
    rollbackHint: "remove package and restore lockfile",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };

  await expect(fixture.kernel.proposeActionContract(followUpInput)).rejects.toThrow(
    "already has a terminal status transition",
  );
  const terminalConflictGap = (await fixture.store.listRecordsByType<ProofGap>("proof_gap"))
    .map((record) => record.payload)
    .find((proofGap) => proofGap.reasonCode === "recovery_terminal_conflict");
  if (!terminalConflictGap) throw new Error("expected terminal conflict proof gap");

  await fixture.kernel.proposeActionContract({
    ...followUpInput,
    idempotencyKey: "idem_http_recovery_terminal_winner",
  });
  const transitions = await fixture.store.listRecordsByType<RecoveryRecommendationStatusTransition>(
    "recovery_recommendation_status_transition",
  );
  const winningTransition = transitions[0]?.payload;
  if (!winningTransition) throw new Error("expected winning terminal transition");
  return { fixture, terminalConflictGap, winningTransition };
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
