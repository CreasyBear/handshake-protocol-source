import { describe, expect, it } from "bun:test";
import { runPackageInstallGateway } from "../../src/adapters/package-install/gateway";
import type {
  ActionContract,
  Greenlight,
  IntentCompilationRecord,
  MutationAttempt,
  PolicyDecision,
  ProofGap,
  RecoveryRecommendation,
  RecoveryRecommendationStatusTransition,
  Receipt,
  SurfaceOperationReconciliation,
} from "../../src/protocol/public/schemas";
import { ProtocolRecorder } from "../../src/protocol/events/records";
import { verifiedGatewayCheckFromResult } from "../../src/protocol/areas/gateway-gate";
import { recordRecoveryTerminalConflictProofGap } from "../../src/protocol/areas/recovery";
import { HandshakeClient } from "../../src/sdk/client";
import { proposePackageInstallActionContract } from "../../src/runtime/package-install/action-proposal";
import { D1ProtocolStore } from "../../src/storage/d1";
import {
  futureIso,
  makeKernelFixture,
  makePackageInstallCandidate,
  proposalInputForCompilation,
} from "../support/fixtures";
import { createD1HttpHarness, D1_HARNESS_TRANSITION_TOKEN, type D1HttpHarness } from "../support/d1-http-harness";
import {
  createPackageManifestSurface,
  packageInstallRuntimeConfig,
  registerFixtureObjectsWithClient,
} from "../support/package-install-flow";

type IntentCompilationResponse = IntentCompilationRecord;
type ActionContractResponse = ActionContract;
type PolicyDecisionResponse = { decision: PolicyDecision; greenlight: Greenlight | null };
type GatewayCheckResponse = {
  gateAttempt: { gateDecision: string; gateDecisionReasonCode: string };
  mutationAttempt: MutationAttempt | null;
  receipt: Receipt;
};
type ReconciliationResponse = {
  reconciliation: SurfaceOperationReconciliation;
  createdProofGap: ProofGap | null;
};
type StreamEventRow = {
  offset: number;
  event_type: string;
  previous_event_digest: string | null;
  event_digest: string;
};
type ScopedStreamEventRow = StreamEventRow & {
  stream_scope: string;
};
type CountRow = {
  count: number;
};
type ProtocolRecordPayloadRow = {
  payload_json: string;
};
type StreamEventTailRow = {
  stream_event_id: string;
  offset: number;
  event_digest: string;
};
type ProtectedPathPostureCurrentRow = {
  posture_scope_key: string;
  protected_path_posture_id: string;
  tenant_id: string;
  organization_id: string;
};

describe("D1-backed Hono protocol surface", () => {
  it("preserves same object ids across different protocol object types", async () => {
    const harness = await createD1HttpHarness();
    try {
      const fixture = makeKernelFixture();
      const sharedId = "shared_protocol_object_id";

      await harness.post("/v0.2/catalog/tool-capabilities", {
        ...fixture.tool,
        toolCapabilityId: sharedId,
      });
      await harness.post("/v0.2/catalog/action-types", {
        ...fixture.actionType,
        actionTypeId: sharedId,
      });

      const rows = await harness.query<{ object_type: string; payload_json: string }>(
        "SELECT object_type, payload_json FROM protocol_records WHERE object_id = ? ORDER BY object_type",
        sharedId,
      );
      expect(rows.map((row) => row.object_type)).toEqual(["action_type", "tool_capability"]);
      expect(JSON.parse(rows[0]?.payload_json ?? "{}")).toMatchObject({ actionTypeId: sharedId });
      expect(JSON.parse(rows[1]?.payload_json ?? "{}")).toMatchObject({ toolCapabilityId: sharedId });
    } finally {
      await harness.dispose();
    }
  });

  it("commits protected-path posture record, stream event, and current pointer together", async () => {
    const harness = await createD1HttpHarness();
    try {
      const posture = await harness.post<{ protectedPathPostureId: string; postureScopeKey: string }>(
        "/v0.2/protected-path-postures",
        {
          tenantId: "tenant_demo",
          organizationId: "org_demo",
          runtimeAdapterId: "runtime_codex",
          gatewayId: "gateway_preview_deploy_local",
          actionClass: "preview_deploy.create",
          resourceRef: "preview:local:demo-web:feature/handshake",
          protectedSurfaceKind: "preview_deploy",
          postureState: "gateway_checked",
          credentialCustodyStatus: "fixture_gateway_held",
          rawSiblingToolStatus: "blocked",
          sourceAuthority: "conformance_fixture",
          reasonCodes: ["local_preview_fixture_only"],
          evidenceRefs: ["evidence:posture:d1"],
          expiresAt: futureIso(),
        },
      );

      const currentRows = await harness.query<ProtectedPathPostureCurrentRow>(
        `SELECT posture_scope_key, protected_path_posture_id, tenant_id, organization_id
         FROM protected_path_posture_current
         WHERE posture_scope_key = ?`,
        posture.postureScopeKey,
      );
      expect(currentRows).toEqual([
        {
          posture_scope_key: posture.postureScopeKey,
          protected_path_posture_id: posture.protectedPathPostureId,
          tenant_id: "tenant_demo",
          organization_id: "org_demo",
        },
      ]);

      const events = await harness.query<{ event_type: string; payload_json: string }>(
        "SELECT event_type, payload_json FROM stream_events WHERE event_type = ?",
        "protected_path_posture_recorded",
      );
      expect(events).toHaveLength(1);
      expect(JSON.parse(events[0]?.payload_json ?? "{}").objectRefs).toContain(posture.protectedPathPostureId);
    } finally {
      await harness.dispose();
    }
  });

  it("persists a contiguous contract stream through pending mutation reconciliation", async () => {
    const harness = await createD1HttpHarness();
    try {
      const fixture = makeKernelFixture();
      await harness.post("/v0.2/catalog/tool-capabilities", fixture.tool);
      await harness.post("/v0.2/catalog/action-types", fixture.actionType);
      await harness.post("/v0.2/catalog/gateways", fixture.gateway);
      await harness.post("/v0.2/envelopes", fixture.envelope);

      const compilation = await harness.post<IntentCompilationResponse>("/v0.2/intent-compilations", {
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
        generatedCodeOrSpecRefs: ["code:d1-http-generated-plan"],
        declaredAssumptions: ["package name is explicit"],
        requiredEvidenceRefs: ["evidence:package-lock-diff"],
        candidate: makePackageInstallCandidate(fixture),
      });

      const contract = await harness.post<ActionContractResponse>("/v0.2/action-contracts", {
        intentCompilationId: compilation.intentCompilationId,
        candidateActionId: compilation.candidateAction.candidateActionId,
        candidateDigest: compilation.candidateAction.candidateDigest,
        signingSecret: "test-secret",
      });

      const policy = await harness.post<PolicyDecisionResponse>("/v0.2/policy-decisions", {
        actionContractId: contract.actionContractId,
        envelopeId: fixture.envelope.envelopeId,
        signingSecret: "test-secret",
      });
      if (!policy.greenlight) throw new Error("expected policy to greenlight exact D1 contract");

      const gate = await harness.post<GatewayCheckResponse>("/v0.2/gateway-check-attempts", {
        actionContractId: contract.actionContractId,
        greenlightId: policy.greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
        surfaceOperationRef: "surface-op:d1-pending-install",
      });
      if (!gate.mutationAttempt) throw new Error("expected gateway check to record a mutation attempt");

      const reconciliation = await harness.post<ReconciliationResponse>("/v0.2/surface-operation-reconciliations", {
        mutationAttemptId: gate.mutationAttempt.mutationAttemptId,
        idempotencyKey: contract.idempotencyKey,
        observedSurfaceOperationRef: "surface-op:d1-pending-install",
        observedDownstreamStatus: "succeeded",
        evidenceRefs: ["evidence:d1-surface-operation-complete"],
      });

      expect(gate.gateAttempt.gateDecision).toBe("passed");
      expect(gate.receipt.finalityStatus).toBe("pending");
      expect(reconciliation.reconciliation.finalityStatus).toBe("final");

      const events = await harness.query<StreamEventRow>(
        `SELECT "offset" AS offset, event_type, previous_event_digest, event_digest
         FROM stream_events
         WHERE partition_key = ?
         ORDER BY "offset"`,
        `action:${contract.actionContractId}`,
      );
      expect(events.map((event) => event.event_type)).toEqual([
        "action_proposed",
        "policy_decision_recorded",
        "action_greenlit",
        "gateway_checked",
        "mutation_attempted",
        "protected_surface_operation_claimed",
        "receipt_emitted",
        "surface_operation_reconciled",
        "protected_surface_operation_released",
      ]);
      expect(events.map((event) => event.offset)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
      expect(events[0]?.previous_event_digest).toBeNull();
      for (let index = 1; index < events.length; index += 1) {
        expect(events[index]?.previous_event_digest).toBe(events[index - 1]?.event_digest);
      }

      const runEvents = await harness.query<ScopedStreamEventRow>(
        `SELECT "offset" AS offset, event_type, previous_event_digest, event_digest,
                json_extract(payload_json, '$.streamScope') AS stream_scope
         FROM stream_events
         WHERE partition_key = ?
         ORDER BY "offset"`,
        `run:${contract.runId}`,
      );
      expect(runEvents.map((event) => event.event_type)).toEqual(events.map((event) => event.event_type));
      expect(runEvents.map((event) => event.offset)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
      expect(runEvents.every((event) => event.stream_scope === "run")).toBe(true);
      for (let index = 1; index < runEvents.length; index += 1) {
        expect(runEvents[index]?.previous_event_digest).toBe(runEvents[index - 1]?.event_digest);
      }

      const resourceEvents = await harness.query<ScopedStreamEventRow>(
        `SELECT "offset" AS offset, event_type, previous_event_digest, event_digest,
                json_extract(payload_json, '$.streamScope') AS stream_scope
         FROM stream_events
         WHERE partition_key = ?
         ORDER BY "offset"`,
        `protected_surface_resource:${contract.gatewayId}:${contract.resourceRef}`,
      );
      expect(resourceEvents.map((event) => event.event_type)).toEqual(events.map((event) => event.event_type));
      expect(resourceEvents.map((event) => event.offset)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
      expect(resourceEvents.every((event) => event.stream_scope === "protected_surface_resource")).toBe(true);
      for (let index = 1; index < resourceEvents.length; index += 1) {
        expect(resourceEvents[index]?.previous_event_digest).toBe(resourceEvents[index - 1]?.event_digest);
      }

      const actionReceiptEvent = events[6];
      const runReceiptEvent = runEvents[6];
      const resourceReceiptEvent = resourceEvents[6];
      if (!actionReceiptEvent || !runReceiptEvent || !resourceReceiptEvent) {
        throw new Error("expected receipt events for action, run, and gateway resource partitions");
      }
      expect(gate.receipt.streamEventIds).toHaveLength(12);
      expect(gate.receipt.receiptDigest).toMatch(/^sha256:/);
      expect(gate.receipt.auditChainDigest).toMatch(/^sha256:/);
      expect(gate.receipt.streamOffsets).toEqual([
        {
          streamId: `stream_${contract.tenantId}_${contract.organizationId}`,
          streamScope: "organization",
          partitionKey: `action:${contract.actionContractId}`,
          offsetStart: 0,
          offsetEnd: 6,
          terminalEventDigest: actionReceiptEvent.event_digest,
        },
        {
          streamId: `stream_${contract.tenantId}_${contract.organizationId}`,
          streamScope: "run",
          partitionKey: `run:${contract.runId}`,
          offsetStart: 0,
          offsetEnd: 6,
          terminalEventDigest: runReceiptEvent.event_digest,
        },
        {
          streamId: `stream_${contract.tenantId}_${contract.organizationId}`,
          streamScope: "protected_surface_resource",
          partitionKey: `protected_surface_resource:${contract.gatewayId}:${contract.resourceRef}`,
          offsetStart: 0,
          offsetEnd: 6,
          terminalEventDigest: resourceReceiptEvent.event_digest,
        },
      ]);
      const receiptRows = await harness.query<ProtocolRecordPayloadRow>(
        "SELECT payload_json FROM protocol_records WHERE object_type = ? AND object_id = ?",
        "receipt",
        gate.receipt.receiptId,
      );
      const receiptPayload = JSON.parse(receiptRows[0]?.payload_json ?? "{}") as Receipt;
      expect(receiptPayload.streamOffsets).toEqual(gate.receipt.streamOffsets);
      expect(receiptPayload.receiptDigest).toBe(gate.receipt.receiptDigest);
      expect(receiptPayload.auditChainDigest).toBe(gate.receipt.auditChainDigest);

      const mutationCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
        "mutation_attempt",
      );
      const reconciliationCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
        "surface_operation_reconciliation",
      );
      expect(mutationCounts[0]?.count).toBe(1);
      expect(reconciliationCounts[0]?.count).toBe(1);
    } finally {
      await harness.dispose();
    }
  });

  it("atomically refuses same-surface D1 operation claim races before a second mutation", async () => {
    const harness = await createD1HttpHarness();
    try {
      const state = await createHttpPackageInstallContract(harness, "code:d1-operation-claim-race");
      const second = await createAdditionalHttpPackageInstallContract(state.client, state.fixture, {
        sequenceNumber: 2,
        idempotencyKey: "idem_d1_operation_claim_race_second",
      });

      const [firstGate, secondGate] = await Promise.all([
        state.client.gatewayCheck({
          actionContractId: state.actionContract.actionContractId,
          greenlightId: state.greenlight.greenlightId,
          observedParameters: { package: "hono", versionRange: "^4.12.19" },
        }),
        state.client.gatewayCheck({
          actionContractId: second.actionContract.actionContractId,
          greenlightId: second.greenlight.greenlightId,
          observedParameters: { package: "hono", versionRange: "^4.12.19" },
        }),
      ]);

      const decisions = [firstGate, secondGate].map((gate) => gate.gateAttempt.gateDecision).sort();
      expect(decisions).toEqual(["passed", "refused"]);
      const refused = [firstGate, secondGate].find((gate) => gate.gateAttempt.gateDecision === "refused");
      expect(refused?.gateAttempt.gateDecisionReasonCode).toBe("protected_surface_operation_in_progress");
      expect(refused?.mutationAttempt).toBeNull();
      expect(await recordCount(harness, "mutation_attempt")).toBe(1);
      expect(await recordCount(harness, "protected_surface_operation_claim")).toBe(1);
    } finally {
      await harness.dispose();
    }
  });

  it("runs the package-install runtime and gateway adapters through the Hono/D1 protocol surface", async () => {
    const harness = await createD1HttpHarness();
    try {
      const { actionContract, client, greenlight, surface } = await createHttpPackageInstallContract(
        harness,
        "code:codemode-package-install-http-wrapper",
      );
      expect((await surface.readManifest()).dependencies).toEqual({});
      expect(surface.mutationCount).toBe(0);

      const gatewayResult = await runPackageInstallGateway({
        protocol: client,
        surface,
        actionContractId: actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
        surfaceOperationRef: "surface-op:d1-http-package-install-hono",
      });

      expect(gatewayResult.outcome).toBe("mutation_reconciled");
      expect(gatewayResult.gatewayCheck.gateAttempt.gateDecision).toBe("passed");
      expect(gatewayResult.gatewayCheck.receipt.finalityStatus).toBe("pending");
      expect(gatewayResult.reconciliation?.finalityStatus).toBe("final");
      expect((await surface.readManifest()).dependencies).toEqual({ hono: "^4.12.19" });
      expect(surface.mutationCount).toBe(1);

      const events = await harness.query<StreamEventRow>(
        `SELECT "offset" AS offset, event_type, previous_event_digest, event_digest
         FROM stream_events
         WHERE partition_key = ?
         ORDER BY "offset"`,
        `action:${actionContract.actionContractId}`,
      );
      expect(events.map((event) => event.event_type)).toEqual([
        "action_proposed",
        "policy_decision_recorded",
        "action_greenlit",
        "gateway_checked",
        "mutation_attempted",
        "protected_surface_operation_claimed",
        "receipt_emitted",
        "surface_operation_reconciled",
        "protected_surface_operation_released",
      ]);
      expect(events.map((event) => event.offset)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
      expect(events[0]?.previous_event_digest).toBeNull();
      for (let index = 1; index < events.length; index += 1) {
        expect(events[index]?.previous_event_digest).toBe(events[index - 1]?.event_digest);
      }

      const mutationCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
        "mutation_attempt",
      );
      const reconciliationCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
        "surface_operation_reconciliation",
      );
      expect(mutationCounts[0]?.count).toBe(1);
      expect(reconciliationCounts[0]?.count).toBe(1);
    } finally {
      await harness.dispose();
    }
  });

  it("records a Hono/D1 gateway refusal without mutating the package manifest", async () => {
    const harness = await createD1HttpHarness();
    try {
      const { actionContract, client, greenlight, surface } = await createHttpPackageInstallContract(
        harness,
        "code:codemode-package-install-http-parameter-mismatch",
      );

      const gatewayResult = await runPackageInstallGateway({
        protocol: client,
        surface,
        actionContractId: actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^5.0.0" },
        surfaceOperationRef: "surface-op:d1-http-package-install-mismatch",
      });

      expect(gatewayResult.outcome).toBe("gateway_check_refused");
      expect(gatewayResult.gatewayCheck.gateAttempt.gateDecision).toBe("refused");
      expect(gatewayResult.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("params_mismatch");
      expect(gatewayResult.gatewayCheck.receipt.downstreamExecutionStatus).toBe("not_started");
      expect((await surface.readManifest()).dependencies).toEqual({});
      expect(surface.mutationCount).toBe(0);

      const events = await harness.query<StreamEventRow>(
        `SELECT "offset" AS offset, event_type, previous_event_digest, event_digest
         FROM stream_events
         WHERE partition_key = ?
         ORDER BY "offset"`,
        `action:${actionContract.actionContractId}`,
      );
      expect(events.map((event) => event.event_type)).toEqual([
        "action_proposed",
        "policy_decision_recorded",
        "action_greenlit",
        "gateway_checked",
        "receipt_emitted",
      ]);
      expect(events.map((event) => event.offset)).toEqual([0, 1, 2, 3, 4]);

      const mutationCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
        "mutation_attempt",
      );
      const gateCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
        "gateway_check_attempt",
      );
      const receiptCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
        "receipt",
      );
      expect(mutationCounts[0]?.count).toBe(0);
      expect(gateCounts[0]?.count).toBe(1);
      expect(receiptCounts[0]?.count).toBe(1);
    } finally {
      await harness.dispose();
    }
  });

  it("exports a Hono/D1 receipt drop copy without creating another mutation", async () => {
    const harness = await createD1HttpHarness();
    try {
      const { actionContract, client, greenlight, surface } = await createHttpPackageInstallContract(
        harness,
        "code:codemode-package-install-receipt-export",
      );
      const gate = await client.gatewayCheck({
        actionContractId: actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
        surfaceOperationRef: "surface-op:d1-receipt-export-install",
      });
      const receiptExport = await client.createReceiptExport({
        receiptId: gate.receipt.receiptId,
        exportFormat: "redacted_json",
        redactionProfileRef: "redaction:default",
        requestedByRef: "auditor:d1",
      });

      if (!gate.receipt.receiptDigest || !gate.receipt.auditChainDigest) {
        throw new Error("expected receipt digest material before export");
      }
      expect(receiptExport.receiptId).toBe(gate.receipt.receiptId);
      expect(receiptExport.receiptDigest).toBe(gate.receipt.receiptDigest);
      expect(receiptExport.auditChainDigest).toBe(gate.receipt.auditChainDigest);
      expect(receiptExport.streamOffsets).toEqual(gate.receipt.streamOffsets);
      expect(receiptExport.exportDigest).toMatch(/^sha256:/);
      expect((await surface.readManifest()).dependencies).toEqual({});

      const mutationCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
        "mutation_attempt",
      );
      const exportCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
        "receipt_export",
      );
      expect(mutationCounts[0]?.count).toBe(1);
      expect(exportCounts[0]?.count).toBe(1);
    } finally {
      await harness.dispose();
    }
  });

  it("links a Hono/D1 follow-up action contract to recovery evidence without creating another mutation", async () => {
    const harness = await createD1HttpHarness();
    try {
      const { actionContract, client, fixture, greenlight, surface } = await createHttpPackageInstallContract(
        harness,
        "code:codemode-package-install-recovery",
      );
      const gate = await client.gatewayCheck({
        actionContractId: actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
        surfaceOperationRef: "surface-op:d1-recovery-unknown",
      });
      const proofGapId = await recordUnknownProofGapThroughClient(client, actionContract, gate);

      const recommendation = await client.createRecoveryRecommendation({
        sourceReceiptId: gate.receipt.receiptId,
        sourceRefusalOrGapRef: proofGapId,
        recommendedPath: "narrower_action_contract_required",
        allowedNextActionClasses: [actionContract.actionClass],
        requiredNewEvidence: ["gateway_finality_evidence"],
        requiresHumanReview: true,
        reasonCode: "downstream_status_unknown",
        reasonSummary: "Gateway did not produce downstream finality evidence.",
      });

      expect(recommendation.sourceReceiptId).toBe(gate.receipt.receiptId);
      expect(recommendation.sourceRefusalOrGapRef).toBe(proofGapId);
      expect(recommendation.mustCreateNewActionContract).toBe(true);
      expect(recommendation.mayReuseGreenlight).toBe(false);
      expect(recommendation.mayMutateProtectedSurface).toBe(false);
      expect(recommendation.recommendationDigest).toMatch(/^sha256:/);

      const followUpCompilation = await client.compileIntent({
        tenantId: actionContract.tenantId,
        organizationId: actionContract.organizationId,
        principalIntentRef: "intent:recover package install through d1",
        principalId: actionContract.principalId,
        agentId: actionContract.agentId,
        runId: actionContract.runId,
        runtimeAdapterId: "runtime_codex",
        operatingEnvelopeId: fixture.envelope.envelopeId,
        toolCatalogRef: "tool_catalog_demo@v1",
        actionCatalogRef: "action_catalog_demo@v1",
        gatewayRegistryRef: "gateway_registry@v1",
        generatedCodeOrSpecRefs: ["code:d1-recovery-follow-up"],
        declaredAssumptions: ["follow-up is narrowed by recovery recommendation"],
        requiredEvidenceRefs: ["gateway_finality_evidence"],
        candidate: makePackageInstallCandidate(fixture, {
          sequenceNumber: actionContract.sequenceNumber + 1,
          recoveryRecommendationId: recommendation.recoveryRecommendationId,
          purposeCode: "dependency_add_recovery",
          evidenceRefs: ["gateway_finality_evidence"],
          idempotencyKey: "idem_d1_recovery_followup",
        }),
      });
      const followUp = await client.proposeActionContract(
        proposalInputForCompilation(followUpCompilation, "test-secret"),
      );

      expect(followUp.recoveryRecommendationId).toBe(recommendation.recoveryRecommendationId);
      expect(followUp.recoverySourceReceiptId).toBe(gate.receipt.receiptId);
      expect(followUp.recoveryRecommendationDigest).toBe(recommendation.recommendationDigest);
      expect((await surface.readManifest()).dependencies).toEqual({});

      const recommendationRows = await harness.query<ProtocolRecordPayloadRow>(
        "SELECT payload_json FROM protocol_records WHERE object_type = ? AND object_id = ?",
        "recovery_recommendation",
        recommendation.recoveryRecommendationId,
      );
      const storedRecommendation = JSON.parse(
        recommendationRows[0]?.payload_json ?? "null",
      ) as RecoveryRecommendation | null;
      expect(storedRecommendation?.recommendationStatus).toBe("superseded");
      expect(storedRecommendation?.supersededByActionContractId).toBe(followUp.actionContractId);

      const actionContractCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
        "action_contract",
      );
      const policyCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
        "policy_decision",
      );
      const mutationCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
        "mutation_attempt",
      );
      const recoveryCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
        "recovery_recommendation",
      );
      const recoveryStatusCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
        "recovery_recommendation_status_transition",
      );
      const greenlightCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
        "greenlight",
      );
      expect(actionContractCounts[0]?.count).toBe(2);
      expect(policyCounts[0]?.count).toBe(1);
      expect(mutationCounts[0]?.count).toBe(1);
      expect(recoveryCounts[0]?.count).toBe(1);
      expect(recoveryStatusCounts[0]?.count).toBe(1);
      expect(greenlightCounts[0]?.count).toBe(1);
    } finally {
      await harness.dispose();
    }
  });

  it("expires a Hono/D1 recovery recommendation through an explicit status transition", async () => {
    const harness = await createD1HttpHarness();
    try {
      const { actionContract, client, greenlight } = await createHttpPackageInstallContract(
        harness,
        "code:codemode-package-install-recovery-expire",
      );
      const gate = await client.gatewayCheck({
        actionContractId: actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
        surfaceOperationRef: "surface-op:d1-recovery-expire-unknown",
      });
      const proofGapId = await recordUnknownProofGapThroughClient(client, actionContract, gate);

      const recommendation = await client.createRecoveryRecommendation({
        sourceReceiptId: gate.receipt.receiptId,
        sourceRefusalOrGapRef: proofGapId,
        recommendedPath: "narrower_action_contract_required",
        allowedNextActionClasses: [actionContract.actionClass],
        requiredNewEvidence: ["gateway_finality_evidence"],
        requiresHumanReview: true,
        reasonCode: "downstream_status_unknown",
        reasonSummary: "Gateway did not produce downstream finality evidence.",
        recoveryExpiresAt: new Date(Date.now() - 1_000).toISOString(),
      });

      const statusChange = await client.transitionRecoveryRecommendationStatus({
        recoveryRecommendationId: recommendation.recoveryRecommendationId,
        nextStatus: "expired",
        reasonCode: "recovery_expired",
        reasonSummary: "Recovery recommendation freshness window elapsed.",
        changedByRef: "sweeper:d1",
      });

      expect(statusChange.recoveryRecommendation.recommendationStatus).toBe("expired");
      expect(statusChange.statusTransition.previousStatus).toBe("open");
      expect(statusChange.statusTransition.nextStatus).toBe("expired");
      expect(statusChange.statusTransition.transitionDigest).toMatch(/^sha256:/);

      const statusCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
        "recovery_recommendation_status_transition",
      );
      expect(statusCounts[0]?.count).toBe(1);
    } finally {
      await harness.dispose();
    }
  });

  it("refuses a Hono/D1 recovery status transition when terminal claim is already held", async () => {
    const harness = await createD1HttpHarness();
    try {
      const { actionContract, client, greenlight } = await createHttpPackageInstallContract(
        harness,
        "code:codemode-package-install-recovery-terminal-race",
      );
      const gate = await client.gatewayCheck({
        actionContractId: actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
        surfaceOperationRef: "surface-op:d1-recovery-terminal-race",
      });
      const proofGapId = await recordUnknownProofGapThroughClient(client, actionContract, gate);

      const recommendation = await client.createRecoveryRecommendation({
        sourceReceiptId: gate.receipt.receiptId,
        sourceRefusalOrGapRef: proofGapId,
        recommendedPath: "narrower_action_contract_required",
        allowedNextActionClasses: [actionContract.actionClass],
        requiredNewEvidence: ["gateway_finality_evidence"],
        requiresHumanReview: true,
        reasonCode: "downstream_status_unknown",
        reasonSummary: "Gateway did not produce downstream finality evidence.",
        recoveryExpiresAt: new Date(Date.now() - 1_000).toISOString(),
      });
      await harness.db
        .prepare(
          `INSERT INTO recovery_terminal_claims
            (recovery_recommendation_id, status_transition_id, next_status, claimed_at)
           VALUES (?, ?, ?, ?)`,
        )
        .bind(recommendation.recoveryRecommendationId, "rst_competing", "expired", new Date().toISOString())
        .run();

      await expect(
        client.transitionRecoveryRecommendationStatus({
          recoveryRecommendationId: recommendation.recoveryRecommendationId,
          nextStatus: "expired",
          reasonCode: "recovery_expired",
          reasonSummary: "Recovery recommendation freshness window elapsed.",
          changedByRef: "sweeper:d1",
        }),
      ).rejects.toThrow("recovery_terminal_conflict");

      const recommendationRows = await harness.query<ProtocolRecordPayloadRow>(
        "SELECT payload_json FROM protocol_records WHERE object_type = ? AND object_id = ?",
        "recovery_recommendation",
        recommendation.recoveryRecommendationId,
      );
      const storedRecommendation = JSON.parse(
        recommendationRows[0]?.payload_json ?? "null",
      ) as RecoveryRecommendation | null;
      expect(storedRecommendation?.recommendationStatus).toBe("open");

      const statusCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
        "recovery_recommendation_status_transition",
      );
      expect(statusCounts[0]?.count).toBe(0);
      const proofGapRows = await harness.query<ProtocolRecordPayloadRow>(
        "SELECT payload_json FROM protocol_records WHERE object_type = ?",
        "proof_gap",
      );
      const proofGaps = proofGapRows.map((row) => JSON.parse(row.payload_json) as ProofGap);
      const terminalConflictGap = proofGaps.find((proofGap) => proofGap.reasonCode === "recovery_terminal_conflict");
      expect(terminalConflictGap).toMatchObject({
        gapPhase: "recovery",
        finalityImpact: "none",
        receiptId: gate.receipt.receiptId,
      });
      expect(proofGaps).toHaveLength(2);
    } finally {
      await harness.dispose();
    }
  });

  it("resolves a Hono/D1 recovery terminal conflict proof gap against the winning transition", async () => {
    const harness = await createD1HttpHarness();
    try {
      const { actionContract, client, greenlight } = await createHttpPackageInstallContract(
        harness,
        "code:codemode-package-install-recovery-terminal-resolution",
      );
      const gate = await client.gatewayCheck({
        actionContractId: actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
        surfaceOperationRef: "surface-op:d1-recovery-terminal-resolution",
      });
      const proofGapId = await recordUnknownProofGapThroughClient(client, actionContract, gate);

      const recommendation = await client.createRecoveryRecommendation({
        sourceReceiptId: gate.receipt.receiptId,
        sourceRefusalOrGapRef: proofGapId,
        recommendedPath: "narrower_action_contract_required",
        allowedNextActionClasses: [actionContract.actionClass],
        requiredNewEvidence: ["gateway_finality_evidence"],
        requiresHumanReview: true,
        reasonCode: "downstream_status_unknown",
        reasonSummary: "Gateway did not produce downstream finality evidence.",
        recoveryExpiresAt: new Date(Date.now() - 1_000).toISOString(),
      });

      const recorder = new ProtocolRecorder(new D1ProtocolStore(harness.db));
      const terminalConflictGap = await recordRecoveryTerminalConflictProofGap(recorder, {
        recommendation,
        sourceContract: actionContract,
        attemptedObjectRef: "act_d1_losing_recovery_terminal_transition",
        changedByRef: "sweeper:d1-stale",
      });

      const statusChange = await client.transitionRecoveryRecommendationStatus({
        recoveryRecommendationId: recommendation.recoveryRecommendationId,
        nextStatus: "expired",
        reasonCode: "recovery_expired",
        reasonSummary: "Recovery recommendation freshness window elapsed.",
        changedByRef: "sweeper:d1-winner",
      });

      const resolution = await client.resolveRecoveryTerminalConflictProofGap({
        proofGapId: terminalConflictGap.proofGapId,
        recoveryRecommendationStatusTransitionId:
          statusChange.statusTransition.recoveryRecommendationStatusTransitionId,
        observedByRef: "test:d1-terminal-transition-loader",
      });

      expect(resolution.proofGap.resolvedByRef).toBe(
        statusChange.statusTransition.recoveryRecommendationStatusTransitionId,
      );
      expect(resolution.statusTransition.nextStatus).toBe("expired");
      expect(resolution.recoveryRecommendation.recommendationStatus).toBe("expired");

      const proofGapRows = await harness.query<ProtocolRecordPayloadRow>(
        "SELECT payload_json FROM protocol_records WHERE object_type = ? AND object_id = ?",
        "proof_gap",
        terminalConflictGap.proofGapId,
      );
      const resolvedGap = JSON.parse(proofGapRows[0]?.payload_json ?? "null") as ProofGap | null;
      expect(resolvedGap).toMatchObject({
        proofGapId: terminalConflictGap.proofGapId,
        gapPhase: "recovery",
        reasonCode: "recovery_terminal_conflict",
        resolvedByRef: statusChange.statusTransition.recoveryRecommendationStatusTransitionId,
      });

      const statusRows = await harness.query<ProtocolRecordPayloadRow>(
        "SELECT payload_json FROM protocol_records WHERE object_type = ?",
        "recovery_recommendation_status_transition",
      );
      const statusTransitions = statusRows.map(
        (row) => JSON.parse(row.payload_json) as RecoveryRecommendationStatusTransition,
      );
      expect(statusTransitions).toHaveLength(1);

      const actionContractCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
        "action_contract",
      );
      const greenlightCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
        "greenlight",
      );
      const mutationCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
        "mutation_attempt",
      );
      const terminalClaimCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM recovery_terminal_claims",
      );
      const resolvedEventCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM stream_events WHERE event_type = ?",
        "proof_gap_resolved",
      );
      expect(actionContractCounts[0]?.count).toBe(1);
      expect(greenlightCounts[0]?.count).toBe(1);
      expect(mutationCounts[0]?.count).toBe(1);
      expect(terminalClaimCounts[0]?.count).toBe(1);
      expect(resolvedEventCounts[0]?.count).toBe(3);
    } finally {
      await harness.dispose();
    }
  });

  it("records a breaker decision through Hono/D1 and refuses the resulting isolated gate", async () => {
    const harness = await createD1HttpHarness();
    try {
      const { actionContract, client, greenlight, surface } = await createHttpPackageInstallContract(
        harness,
        "code:codemode-package-install-breaker",
      );
      const streamId = `stream_${actionContract.tenantId}_${actionContract.organizationId}`;
      const actionPartitionKey = `action:${actionContract.actionContractId}`;
      const actionTailRows = await harness.query<StreamEventTailRow>(
        `SELECT stream_event_id, "offset" AS offset, event_digest
         FROM stream_events
         WHERE partition_key = ?
         ORDER BY "offset" DESC
         LIMIT 1`,
        actionPartitionKey,
      );
      const actionTail = actionTailRows[0];
      if (!actionTail) throw new Error("expected action stream tail");

      const breaker = await client.createBreakerDecision({
        tenantId: actionContract.tenantId,
        organizationId: actionContract.organizationId,
        listenerId: "listener_d1_sequence_breaker",
        listenerVersion: "v1",
        rulePackRef: "breaker:sequence",
        rulePackVersion: "v1",
        observedStreamOffsets: [
          {
            streamId,
            partitionKey: actionPartitionKey,
            observedOffsetStart: 0,
            observedOffsetEnd: actionTail.offset,
            observedEventDigest: actionTail.event_digest,
          },
        ],
        decision: "quarantined",
        decisionReasonCode: "sequence_divergence",
        decisionReason: "D1 breaker observed a divergent sequence.",
        targetScopeType: "agent",
        targetScopeId: actionContract.agentId,
        agentId: actionContract.agentId,
        runId: actionContract.runId,
        gatewayId: actionContract.gatewayId,
        resourceRef: actionContract.resourceRef,
        actionClass: actionContract.actionClass,
        matchedBreakerRuleIds: ["sequence_dependency_final_receipt"],
        supportingEventRefs: [actionTail.stream_event_id],
      });

      const gate = await client.gatewayCheck({
        actionContractId: actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
      });

      expect(breaker.isolationState.sourceDecisionRef).toBe(breaker.breakerDecision.breakerDecisionId);
      expect(breaker.isolationState.observedStreamOffsets).toEqual(breaker.breakerDecision.observedStreamOffsets);
      expect(gate.gateAttempt.gateDecision).toBe("refused");
      expect(gate.gateAttempt.gateDecisionReasonCode).toBe("current_isolation_quarantined");
      expect(gate.mutationAttempt).toBeNull();
      expect((await surface.readManifest()).dependencies).toEqual({});

      const breakerCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
        "breaker_decision",
      );
      const isolationCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
        "isolation_state",
      );
      const mutationCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
        "mutation_attempt",
      );
      expect(breakerCounts[0]?.count).toBe(1);
      expect(isolationCounts[0]?.count).toBe(1);
      expect(mutationCounts[0]?.count).toBe(0);
    } finally {
      await harness.dispose();
    }
  });

  it("does not let another tenant isolation state block D1 policy for the same agent id", async () => {
    const harness = await createD1HttpHarness();
    try {
      const client = new HandshakeClient("http://handshake.test", harness.fetch, {
        transitionToken: D1_HARNESS_TRANSITION_TOKEN,
      });
      const fixture = makeKernelFixture();
      await registerFixtureObjectsWithClient(client, fixture);
      const proposed = await proposePackageInstallActionContract(client, packageInstallRuntimeConfig(fixture), {
        principalIntentRef: "intent:install hono through d1 scoped isolation",
        generatedCodeOrSpecRef: "code:d1-cross-tenant-isolation",
        package: "hono",
        versionRange: "^4.12.19",
      });
      if (proposed.outcome !== "action_contract_proposed") throw new Error("expected action contract proposal");

      await client.createIsolationState({
        tenantId: "tenant_foreign",
        organizationId: "org_foreign",
        scopeType: "agent",
        scopeId: "agent_demo",
        state: "quarantined",
        reasonCode: "foreign_tenant_breaker",
        reasonSummary: "Foreign tenant agent state must not block this tenant.",
        sourceDecisionRef: "breaker:foreign-tenant",
      });

      const policy = await client.evaluatePolicy({
        actionContractId: proposed.actionContract.actionContractId,
        envelopeId: fixture.envelope.envelopeId,
        signingSecret: "test-secret",
      });

      expect(policy.decision.decision).toBe("greenlight");
      expect(policy.greenlight).not.toBeNull();
    } finally {
      await harness.dispose();
    }
  });

  it("does not let another organization isolation state block a D1 gate for the same resource", async () => {
    const harness = await createD1HttpHarness();
    try {
      const { actionContract, client, greenlight, surface } = await createHttpPackageInstallContract(
        harness,
        "code:d1-cross-org-resource-isolation",
      );

      await client.createIsolationState({
        tenantId: actionContract.tenantId,
        organizationId: "org_foreign",
        scopeType: "resource",
        scopeId: actionContract.resourceRef,
        state: "quarantined",
        reasonCode: "foreign_org_resource_breaker",
        reasonSummary: "Foreign organization resource state must not block this organization.",
        sourceDecisionRef: "breaker:foreign-org",
      });

      const gate = await client.gatewayCheck({
        actionContractId: actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
      });

      expect(gate.gateAttempt.gateDecision).toBe("passed");
      expect(gate.mutationAttempt).not.toBeNull();
      expect((await surface.readManifest()).dependencies).toEqual({});
    } finally {
      await harness.dispose();
    }
  });

  it("does not treat a D1 gateway isolation as a resource isolation with the same id", async () => {
    const harness = await createD1HttpHarness();
    try {
      const client = new HandshakeClient("http://handshake.test", harness.fetch, {
        transitionToken: D1_HARNESS_TRANSITION_TOKEN,
      });
      const base = makeKernelFixture();
      const fixture = {
        ...base,
        envelope: {
          ...base.envelope,
          allowedResources: ["gw_demo"],
        },
      };
      await registerFixtureObjectsWithClient(client, fixture);
      const compilation = await client.compileIntent({
        tenantId: "tenant_demo",
        organizationId: "org_demo",
        principalIntentRef: "intent:install on D1 scoped resource",
        principalId: "principal_demo",
        agentId: "agent_demo",
        runId: "run_demo",
        runtimeAdapterId: "runtime_codex",
        operatingEnvelopeId: fixture.envelope.envelopeId,
        toolCatalogRef: "tool_catalog_demo@v1",
        actionCatalogRef: "action_catalog_demo@v1",
        gatewayRegistryRef: "gateway_registry@v1",
        generatedCodeOrSpecRefs: ["code:d1-cross-scope-type-isolation"],
        declaredAssumptions: ["package name is explicit"],
        requiredEvidenceRefs: ["evidence:package-lock-diff"],
        candidate: makePackageInstallCandidate(fixture, {
          resourceRef: "gw_demo",
          idempotencyKey: "idem_d1_scope_type_isolation",
        }),
      });
      const actionContract = await client.proposeActionContract(
        proposalInputForCompilation(compilation, "test-secret"),
      );
      const policy = await client.evaluatePolicy({
        actionContractId: actionContract.actionContractId,
        envelopeId: fixture.envelope.envelopeId,
        signingSecret: "test-secret",
      });
      if (!policy.greenlight) throw new Error("expected D1 scope-type contract to greenlight");

      await client.createIsolationState({
        tenantId: "tenant_demo",
        organizationId: "org_demo",
        scopeType: "gateway",
        scopeId: "gw_demo",
        state: "quarantined",
        reasonCode: "gateway_scope_only",
        reasonSummary: "Gateway scope must not block a resource with the same id.",
        sourceDecisionRef: "breaker:scope-type",
      });

      const gate = await client.gatewayCheck({
        actionContractId: actionContract.actionContractId,
        greenlightId: policy.greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
      });

      expect(gate.gateAttempt.gateDecision).toBe("passed");
      expect(gate.mutationAttempt).not.toBeNull();
    } finally {
      await harness.dispose();
    }
  });

  it("records and resolves a Hono/D1 package-install proof gap for unknown downstream finality", async () => {
    const harness = await createD1HttpHarness();
    try {
      const { actionContract, client, greenlight, surface } = await createHttpPackageInstallContract(
        harness,
        "code:codemode-package-install-http-proof-gap",
      );

      const gatewayCheck = await client.gatewayCheck({
        actionContractId: actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
        surfaceOperationRef: "surface-op:d1-http-package-install-proof-gap",
      });
      const verifiedGate = verifiedGatewayCheckFromResult(gatewayCheck);
      if (!verifiedGate) throw new Error("expected passed gateway check");

      const mutationEvidence = await surface.applyPackageInstall({
        verifiedGate,
        packageName: "hono",
        versionRange: "^4.12.19",
      });
      const reconciliationResult = await client.reconcileSurfaceOperation({
        mutationAttemptId: verifiedGate.mutationAttemptId,
        idempotencyKey: verifiedGate.idempotencyKey,
        observedSurfaceOperationRef: mutationEvidence.surfaceOperationRef,
        observedDownstreamStatus: "unknown",
        evidenceRefs: [],
      });
      const proofGapId = reconciliationResult.createdProofGap?.proofGapId;
      if (!proofGapId) throw new Error("expected reconciliation-created proof gap");

      expect(gatewayCheck.gateAttempt.gateDecision).toBe("passed");
      expect(gatewayCheck.receipt.finalityStatus).toBe("pending");
      expect(gatewayCheck.receipt.proofGapIds).toEqual([]);
      expect(reconciliationResult.reconciliation.finalityStatus).toBe("unknown");
      expect(reconciliationResult.reconciliation.resolvedProofGapIds).toEqual([]);
      expect(reconciliationResult.createdProofGap?.mutationAttemptId).toBe(verifiedGate.mutationAttemptId);
      expect((await surface.readManifest()).dependencies).toEqual({ hono: "^4.12.19" });
      expect(surface.mutationCount).toBe(1);

      const proofGapRows = await harness.query<ProtocolRecordPayloadRow>(
        "SELECT payload_json FROM protocol_records WHERE object_type = ? AND object_id = ?",
        "proof_gap",
        proofGapId,
      );
      const proofGap = JSON.parse(proofGapRows[0]?.payload_json ?? "null") as ProofGap | null;
      expect(proofGap?.resolvedByRef).toBeNull();
      expect(proofGap?.resolvedAt).toBeNull();

      const events = await harness.query<StreamEventRow>(
        `SELECT "offset" AS offset, event_type, previous_event_digest, event_digest
         FROM stream_events
         WHERE partition_key = ?
         ORDER BY "offset"`,
        `action:${actionContract.actionContractId}`,
      );
      expect(events.map((event) => event.event_type)).toEqual([
        "action_proposed",
        "policy_decision_recorded",
        "action_greenlit",
        "gateway_checked",
        "mutation_attempted",
        "protected_surface_operation_claimed",
        "receipt_emitted",
        "surface_operation_reconciled",
        "proof_gap_recorded",
        "protected_surface_operation_released",
      ]);
      expect(events.map((event) => event.offset)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      for (let index = 1; index < events.length; index += 1) {
        expect(events[index]?.previous_event_digest).toBe(events[index - 1]?.event_digest);
      }

      const mutationCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
        "mutation_attempt",
      );
      const proofGapCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
        "proof_gap",
      );
      const reconciliationCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
        "surface_operation_reconciliation",
      );
      expect(mutationCounts[0]?.count).toBe(1);
      expect(proofGapCounts[0]?.count).toBe(1);
      expect(reconciliationCounts[0]?.count).toBe(1);
    } finally {
      await harness.dispose();
    }
  });
});

async function createHttpPackageInstallContract(harness: D1HttpHarness, generatedCodeOrSpecRef: string) {
  const client = new HandshakeClient("http://handshake.test", harness.fetch, {
    transitionToken: D1_HARNESS_TRANSITION_TOKEN,
  });
  const fixture = makeKernelFixture();
  await registerFixtureObjectsWithClient(client, fixture);
  const surface = await createPackageManifestSurface("handshake-package-d1-e2e-");

  const proposed = await proposePackageInstallActionContract(client, packageInstallRuntimeConfig(fixture), {
    principalIntentRef: "intent:install hono through hono d1",
    generatedCodeOrSpecRef,
    package: "hono",
    versionRange: "^4.12.19",
  });
  if (proposed.outcome !== "action_contract_proposed") throw new Error("expected action contract proposal");

  const policy = await client.evaluatePolicy({
    actionContractId: proposed.actionContract.actionContractId,
    envelopeId: fixture.envelope.envelopeId,
    signingSecret: "test-secret",
  });
  if (!policy.greenlight) throw new Error("expected policy to greenlight exact D1 contract");

  return {
    actionContract: proposed.actionContract,
    client,
    fixture,
    greenlight: policy.greenlight,
    policyDecision: policy.decision,
    surface,
  };
}

async function createAdditionalHttpPackageInstallContract(
  client: HandshakeClient,
  fixture: ReturnType<typeof makeKernelFixture>,
  candidateOverrides: Parameters<typeof makePackageInstallCandidate>[1],
) {
  const compilation = await client.compileIntent({
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    principalIntentRef: `intent:additional d1 package ${candidateOverrides?.idempotencyKey ?? "install"}`,
    principalId: "principal_demo",
    agentId: "agent_demo",
    runId: "run_demo",
    runtimeAdapterId: "runtime_codex",
    operatingEnvelopeId: fixture.envelope.envelopeId,
    toolCatalogRef: "tool_catalog_demo@v1",
    actionCatalogRef: "action_catalog_demo@v1",
    gatewayRegistryRef: "gateway_registry@v1",
    generatedCodeOrSpecRefs: ["code:d1-operation-claim-race"],
    declaredAssumptions: ["package name is explicit"],
    requiredEvidenceRefs: ["evidence:package-lock-diff"],
    candidate: makePackageInstallCandidate(fixture, candidateOverrides),
  });
  const actionContract = await client.proposeActionContract(proposalInputForCompilation(compilation, "test-secret"));
  const policy = await client.evaluatePolicy({
    actionContractId: actionContract.actionContractId,
    envelopeId: fixture.envelope.envelopeId,
    signingSecret: "test-secret",
  });
  if (!policy.greenlight) throw new Error("expected additional D1 contract to greenlight");
  return { actionContract, greenlight: policy.greenlight };
}

async function recordCount(harness: D1HttpHarness, objectType: string): Promise<number> {
  const rows = await harness.query<CountRow>(
    "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
    objectType,
  );
  return rows[0]?.count ?? 0;
}

async function recordUnknownProofGapThroughClient(
  client: HandshakeClient,
  actionContract: ActionContract,
  gate: { mutationAttempt: MutationAttempt | null },
): Promise<string> {
  if (!gate.mutationAttempt) throw new Error("expected mutation attempt before recovery proof gap");
  const reconciliation = await client.reconcileSurfaceOperation({
    mutationAttemptId: gate.mutationAttempt.mutationAttemptId,
    idempotencyKey: actionContract.idempotencyKey,
    observedSurfaceOperationRef: gate.mutationAttempt.surfaceOperationRef,
    observedDownstreamStatus: "unknown",
    evidenceRefs: [],
    resolvedProofGapIds: [],
  });
  const proofGapId = reconciliation.createdProofGap?.proofGapId;
  if (!proofGapId) throw new Error("expected reconciliation-created proof gap");
  return proofGapId;
}
