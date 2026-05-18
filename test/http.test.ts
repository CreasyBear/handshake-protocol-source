import { describe, expect, it } from "bun:test";
import { createApp } from "../src/http/app";
import type { CallerAuthTokens, TransitionCallerRole } from "../src/http/caller-auth";
import { HandshakeKernel } from "../src/protocol/kernel";
import type { ProofGap, RecoveryRecommendationStatusTransition } from "../src/protocol/schemas";
import { InMemoryProtocolStore } from "../src/storage/memory";
import type { ProtocolCommit, ProtocolCommitResult } from "../src/storage/store";
import {
  createGreenlitContract,
  makeKernelFixture,
  makePackageInstallCandidate,
  proposalInputForCompilation,
  recordUnknownDownstreamProofGap,
} from "./fixtures";

const TEST_CALLER_AUTH_TOKENS = {
  control_plane: "test_control_plane_token",
  runtime_evidence: "test_runtime_evidence_token",
  gateway_custody: "test_gateway_custody_token",
  review_custody: "test_review_custody_token",
} as const satisfies CallerAuthTokens;

describe("Hono protocol surface", () => {
  it("serves health and OpenAPI metadata", async () => {
    const app = createApp();

    const health = await app.request("/health");
    expect(health.status).toBe(200);
    expect(await health.json()).toMatchObject({ ok: true, protocol: "handshake" });

    const openapi = await app.request("/openapi.json");
    expect(openapi.status).toBe(200);
    const openapiDocument = (await openapi.json()) as {
      components: { securitySchemes: Record<string, { type: string; scheme: string }> };
      openapi: string;
      paths: Record<string, { post: { security: Array<Record<string, string[]>> } }>;
    };
    expect(openapiDocument).toMatchObject({ openapi: "3.1.0" });
    expect(openapiDocument.components.securitySchemes.handshakeGatewayCustodyBearer).toMatchObject({
      type: "http",
      scheme: "bearer",
    });
    const gatewayCheckPath = openapiDocument.paths["/v0.2/gateway-check-attempts"];
    expect(gatewayCheckPath).toBeDefined();
    expect(gatewayCheckPath?.post.security).toEqual([{ handshakeGatewayCustodyBearer: [] }]);
  });

  it("fails closed for state-changing endpoints without durable storage", async () => {
    const fixture = makeKernelFixture();
    const app = createApp({ callerAuthTokens: TEST_CALLER_AUTH_TOKENS });

    const response = await app.request("/v0.2/catalog/tool-capabilities", {
      method: "POST",
      headers: jsonHeaders("control_plane"),
      body: JSON.stringify(fixture.tool),
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: { code: "durable_store_unavailable" },
    });
  });

  it("requires transition caller auth before parsing state-changing request bodies", async () => {
    const app = createApp({
      store: new InMemoryProtocolStore(),
      callerAuthTokens: TEST_CALLER_AUTH_TOKENS,
    });

    const response = await app.request("/v0.2/runtime-executions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ invalid: true }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      error: { code: "caller_auth_required" },
    });
  });

  it("fails closed when transition caller auth is not configured", async () => {
    const app = createApp({ store: new InMemoryProtocolStore() });

    const response = await app.request("/v0.2/runtime-executions", {
      method: "POST",
      headers: jsonHeaders("runtime_evidence"),
      body: JSON.stringify({ invalid: true }),
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: { code: "caller_auth_not_configured" },
    });
  });

  it("refuses a caller token from the wrong custody role", async () => {
    const app = createApp({
      store: new InMemoryProtocolStore(),
      callerAuthTokens: TEST_CALLER_AUTH_TOKENS,
    });

    const response = await app.request("/v0.2/gateway-check-attempts", {
      method: "POST",
      headers: jsonHeaders("control_plane"),
      body: JSON.stringify({ invalid: true }),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: { code: "caller_auth_forbidden" },
    });
  });

  it("requires control-plane custody for internal record reads", async () => {
    const app = createApp({
      store: new InMemoryProtocolStore(),
      callerAuthTokens: TEST_CALLER_AUTH_TOKENS,
    });

    const missingAuth = await app.request("/v0.2/records/action_contract/ac_missing");
    expect(missingAuth.status).toBe(401);
    expect(await missingAuth.json()).toMatchObject({
      error: { code: "caller_auth_required" },
    });

    const wrongRole = await app.request("/v0.2/records/action_contract/ac_missing", {
      headers: jsonHeaders("runtime_evidence"),
    });
    expect(wrongRole.status).toBe(403);
    expect(await wrongRole.json()).toMatchObject({
      error: { code: "caller_auth_forbidden" },
    });

    const controlPlane = await app.request("/v0.2/records/action_contract/ac_missing", {
      headers: jsonHeaders("control_plane"),
    });
    expect(controlPlane.status).toBe(404);
    expect(await controlPlane.json()).toMatchObject({
      error: { code: "record_not_found" },
    });
  });

  it("returns structured gate receipts through HTTP", async () => {
    const fixture = await createGreenlitContract();
    const app = createApp({ store: fixture.store, callerAuthTokens: TEST_CALLER_AUTH_TOKENS });

    const response = await app.request("/v0.2/gateway-check-attempts", {
      method: "POST",
      headers: jsonHeaders("gateway_custody"),
      body: JSON.stringify({
        actionContractId: fixture.contract.actionContractId,
        greenlightId: fixture.greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
      }),
    });

    expect(response.status).toBe(201);
    const body = (await response.json()) as { gateAttempt: { gateDecision: string }; receipt: { finalityStatus: string } };
    expect(body.gateAttempt.gateDecision).toBe("passed");
    expect(body.receipt.finalityStatus).toBe("pending");
  });

  it("rejects caller-declared downstream outcomes at the gateway-check route", async () => {
    const fixture = await createGreenlitContract();
    const app = createApp({ store: fixture.store, callerAuthTokens: TEST_CALLER_AUTH_TOKENS });

    const response = await app.request("/v0.2/gateway-check-attempts", {
      method: "POST",
      headers: jsonHeaders("gateway_custody"),
      body: JSON.stringify({
        actionContractId: fixture.contract.actionContractId,
        greenlightId: fixture.greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
        downstreamMode: "succeed",
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: "invalid_request" } });
  });

  it("resolves recovery terminal conflict proof gaps through HTTP", async () => {
    const state = await createRecoveryTerminalConflictState();
    const app = createApp({ store: state.fixture.store, callerAuthTokens: TEST_CALLER_AUTH_TOKENS });

    const response = await app.request("/v0.2/recovery-terminal-conflict-resolutions", {
      method: "POST",
      headers: jsonHeaders("control_plane"),
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

function jsonHeaders(role: TransitionCallerRole): Record<string, string> {
  return {
    "content-type": "application/json",
    authorization: `Bearer ${TEST_CALLER_AUTH_TOKENS[role]}`,
  };
}

async function createRecoveryTerminalConflictState() {
  const base = makeKernelFixture();
  const store = new RecoveryTerminalConflictOnceStore();
  const fixture = await createGreenlitContract({ ...base, store, kernel: new HandshakeKernel(store) });
  const gate = await fixture.kernel.gatewayCheck({
    actionContractId: fixture.contract.actionContractId,
    greenlightId: fixture.greenlight.greenlightId,
    observedParameters: { package: "hono", versionRange: "^4.12.19" },
  });
  const sourceProofGapId = (await recordUnknownDownstreamProofGap(fixture, gate)).proofGapId;
  const recommendation = await fixture.kernel.createRecoveryRecommendation({
    sourceReceiptId: gate.receipt.receiptId,
    sourceRefusalOrGapRef: sourceProofGapId,
    recommendedPath: "narrower_action_contract_required",
    allowedNextActionClasses: [fixture.contract.actionClass],
    requiredNewEvidence: ["gateway_finality_evidence"],
    requiresHumanReview: false,
    reasonCode: "downstream_status_unknown",
    reasonSummary: "Gateway did not produce downstream finality evidence.",
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
    gatewayRegistryRef: "gateway_registry@v1",
    candidate: makePackageInstallCandidate(fixture, {
      sequenceNumber: fixture.contract.sequenceNumber + 1,
      recoveryRecommendationId: recommendation.recoveryRecommendationId,
      purposeCode: "dependency_add_recovery",
      evidenceRefs: ["gateway_finality_evidence"],
      idempotencyKey: "idem_http_recovery_terminal",
    }),
  });
  const followUpInput = proposalInputForCompilation(compilation);

  await expect(fixture.kernel.proposeActionContract(followUpInput)).rejects.toThrow(
    "already has a terminal status transition",
  );
  const terminalConflictGap = (await fixture.store.listRecordsByType<ProofGap>("proof_gap"))
    .map((record) => record.payload)
    .find((proofGap) => proofGap.reasonCode === "recovery_terminal_conflict");
  if (!terminalConflictGap) throw new Error("expected terminal conflict proof gap");

  await fixture.kernel.proposeActionContract(followUpInput);
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
