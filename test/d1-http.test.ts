import { describe, expect, it } from "bun:test";
import { runPackageInstallReceiver } from "../src/adapters/package-install/receiver";
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
  ReceiverOperationReconciliation,
} from "../src/protocol/schemas";
import { ProtocolRecorder } from "../src/protocol/records";
import { recordRecoveryTerminalConflictProofGap } from "../src/protocol/recovery-terminal-conflicts";
import { verifiedReceiverGateCheckFromResult } from "../src/protocol/receiver-gate-artifacts";
import { HandshakeClient } from "../src/sdk/client";
import { proposePackageInstallActionContract } from "../src/runtime/package-install/tool-wrapper";
import { D1ProtocolStore } from "../src/storage/d1";
import { futureIso, makeKernelFixture } from "./fixtures";
import { createD1HttpHarness, type D1HttpHarness } from "./support/d1-http-harness";
import {
  createPackageManifestSurface,
  packageInstallRuntimeConfig,
  registerFixtureObjectsWithClient,
} from "./support/package-install-flow";

type IntentCompilationResponse = IntentCompilationRecord;
type ActionContractResponse = ActionContract;
type PolicyDecisionResponse = { decision: PolicyDecision; greenlight: Greenlight | null };
type ReceiverGateResponse = {
  gateAttempt: { gateDecision: string };
  mutationAttempt: MutationAttempt | null;
  receipt: Receipt;
};
type ReconciliationResponse = {
  reconciliation: ReceiverOperationReconciliation;
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

  it("persists a contiguous contract stream through pending mutation reconciliation", async () => {
    const harness = await createD1HttpHarness();
    try {
      const fixture = makeKernelFixture();
      await harness.post("/v0.2/catalog/tool-capabilities", fixture.tool);
      await harness.post("/v0.2/catalog/action-types", fixture.actionType);
      await harness.post("/v0.2/catalog/receivers", fixture.receiver);
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
        receiverRegistryRef: "receiver_registry@v1",
        generatedCodeOrSpecRefs: ["code:d1-http-generated-plan"],
        declaredAssumptions: ["package name is explicit"],
        requiredEvidenceRefs: ["evidence:package-lock-diff"],
        candidate: {
          toolCapabilityId: fixture.tool.toolCapabilityId,
          actionTypeId: fixture.actionType.actionTypeId,
          receiverRegistryEntryId: fixture.receiver.receiverRegistryEntryId,
          actionClass: "package.install",
          receiverId: fixture.receiver.receiverId,
          resourceRef: "npm:hono",
        },
      });

      const contract = await harness.post<ActionContractResponse>("/v0.2/action-contracts", {
        tenantId: "tenant_demo",
        organizationId: "org_demo",
        intentCompilationId: compilation.intentCompilationId,
        envelopeId: fixture.envelope.envelopeId,
        receiverRegistryEntryId: fixture.receiver.receiverRegistryEntryId,
        receiverId: fixture.receiver.receiverId,
        principalId: "principal_demo",
        agentId: "agent_demo",
        runId: "run_demo",
        sequenceNumber: 1,
        actionClass: "package.install",
        resourceRef: "npm:hono",
        parameters: { package: "hono", versionRange: "^4.12.19" },
        nonSecretParamsSummary: { package: "hono", versionRange: "^4.12.19" },
        purposeCode: "dependency_add",
        expectedSideEffectCodes: ["package_json_change", "lockfile_change"],
        evidenceRefs: ["evidence:package-lock-diff"],
        bounds: { maxPackages: 1 },
        idempotencyKey: "idem_d1_http_hono",
        rollbackHint: "remove package and restore lockfile",
        expiresAt: futureIso(),
        signingSecret: "test-secret",
      });

      const policy = await harness.post<PolicyDecisionResponse>("/v0.2/policy-decisions", {
        actionContractId: contract.actionContractId,
        envelopeId: fixture.envelope.envelopeId,
        signingSecret: "test-secret",
      });
      if (!policy.greenlight) throw new Error("expected policy to greenlight exact D1 contract");

      const gate = await harness.post<ReceiverGateResponse>("/v0.2/receiver-gate-attempts", {
        actionContractId: contract.actionContractId,
        greenlightId: policy.greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
        downstreamMode: "pending",
        receiverOperationRef: "receiver-op:d1-pending-install",
      });
      if (!gate.mutationAttempt) throw new Error("expected receiver gate to record a mutation attempt");

      const reconciliation = await harness.post<ReconciliationResponse>("/v0.2/receiver-operation-reconciliations", {
        mutationAttemptId: gate.mutationAttempt.mutationAttemptId,
        idempotencyKey: contract.idempotencyKey,
        observedReceiverOperationRef: "receiver-op:d1-pending-install",
        observedDownstreamStatus: "succeeded",
        evidenceRefs: ["evidence:d1-receiver-operation-complete"],
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
        "receiver_gate_checked",
        "mutation_attempted",
        "receipt_emitted",
        "receiver_operation_reconciled",
      ]);
      expect(events.map((event) => event.offset)).toEqual([0, 1, 2, 3, 4, 5, 6]);
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
      expect(runEvents.map((event) => event.offset)).toEqual([0, 1, 2, 3, 4, 5, 6]);
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
        `receiver_resource:${contract.receiverId}:${contract.resourceRef}`,
      );
      expect(resourceEvents.map((event) => event.event_type)).toEqual(events.map((event) => event.event_type));
      expect(resourceEvents.map((event) => event.offset)).toEqual([0, 1, 2, 3, 4, 5, 6]);
      expect(resourceEvents.every((event) => event.stream_scope === "receiver_resource")).toBe(true);
      for (let index = 1; index < resourceEvents.length; index += 1) {
        expect(resourceEvents[index]?.previous_event_digest).toBe(resourceEvents[index - 1]?.event_digest);
      }

      const actionReceiptEvent = events[5];
      const runReceiptEvent = runEvents[5];
      const resourceReceiptEvent = resourceEvents[5];
      if (!actionReceiptEvent || !runReceiptEvent || !resourceReceiptEvent) {
        throw new Error("expected receipt events for action, run, and receiver resource partitions");
      }
      expect(gate.receipt.streamEventIds).toHaveLength(9);
      expect(gate.receipt.receiptDigest).toMatch(/^sha256:/);
      expect(gate.receipt.auditChainDigest).toMatch(/^sha256:/);
      expect(gate.receipt.streamOffsets).toEqual([
        {
          streamId: `stream_${contract.tenantId}_${contract.organizationId}`,
          streamScope: "organization",
          partitionKey: `action:${contract.actionContractId}`,
          offsetStart: 0,
          offsetEnd: 5,
          terminalEventDigest: actionReceiptEvent.event_digest,
        },
        {
          streamId: `stream_${contract.tenantId}_${contract.organizationId}`,
          streamScope: "run",
          partitionKey: `run:${contract.runId}`,
          offsetStart: 0,
          offsetEnd: 5,
          terminalEventDigest: runReceiptEvent.event_digest,
        },
        {
          streamId: `stream_${contract.tenantId}_${contract.organizationId}`,
          streamScope: "receiver_resource",
          partitionKey: `receiver_resource:${contract.receiverId}:${contract.resourceRef}`,
          offsetStart: 0,
          offsetEnd: 5,
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
        "receiver_operation_reconciliation",
      );
      expect(mutationCounts[0]?.count).toBe(1);
      expect(reconciliationCounts[0]?.count).toBe(1);
    } finally {
      await harness.dispose();
    }
  });

  it("runs the package-install runtime and receiver adapters through the Hono/D1 protocol surface", async () => {
    const harness = await createD1HttpHarness();
    try {
      const { actionContract, client, greenlight, surface } = await createHttpPackageInstallContract(
        harness,
        "code:codemode-package-install-http-wrapper",
      );
      expect((await surface.readManifest()).dependencies).toEqual({});
      expect(surface.mutationCount).toBe(0);

      const receiverResult = await runPackageInstallReceiver({
        protocol: client,
        surface,
        actionContractId: actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
        receiverOperationRef: "receiver-op:d1-http-package-install-hono",
      });

      expect(receiverResult.outcome).toBe("mutation_reconciled");
      expect(receiverResult.receiverGate.gateAttempt.gateDecision).toBe("passed");
      expect(receiverResult.receiverGate.receipt.finalityStatus).toBe("pending");
      expect(receiverResult.reconciliation?.finalityStatus).toBe("final");
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
        "receiver_gate_checked",
        "mutation_attempted",
        "receipt_emitted",
        "receiver_operation_reconciled",
      ]);
      expect(events.map((event) => event.offset)).toEqual([0, 1, 2, 3, 4, 5, 6]);
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
        "receiver_operation_reconciliation",
      );
      expect(mutationCounts[0]?.count).toBe(1);
      expect(reconciliationCounts[0]?.count).toBe(1);
    } finally {
      await harness.dispose();
    }
  });

  it("records a Hono/D1 receiver refusal without mutating the package manifest", async () => {
    const harness = await createD1HttpHarness();
    try {
      const { actionContract, client, greenlight, surface } = await createHttpPackageInstallContract(
        harness,
        "code:codemode-package-install-http-parameter-mismatch",
      );

      const receiverResult = await runPackageInstallReceiver({
        protocol: client,
        surface,
        actionContractId: actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^5.0.0" },
        receiverOperationRef: "receiver-op:d1-http-package-install-mismatch",
      });

      expect(receiverResult.outcome).toBe("receiver_gate_refused");
      expect(receiverResult.receiverGate.gateAttempt.gateDecision).toBe("refused");
      expect(receiverResult.receiverGate.gateAttempt.gateDecisionReasonCode).toBe("params_mismatch");
      expect(receiverResult.receiverGate.receipt.downstreamExecutionStatus).toBe("not_started");
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
        "receiver_gate_checked",
        "receipt_emitted",
      ]);
      expect(events.map((event) => event.offset)).toEqual([0, 1, 2, 3, 4]);

      const mutationCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
        "mutation_attempt",
      );
      const gateCounts = await harness.query<CountRow>(
        "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
        "receiver_gate_attempt",
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
      const gate = await client.receiverGate({
        actionContractId: actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
        downstreamMode: "succeed",
        receiverOperationRef: "receiver-op:d1-receipt-export-install",
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
      const gate = await client.receiverGate({
        actionContractId: actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
        downstreamMode: "unknown",
        receiverOperationRef: "receiver-op:d1-recovery-unknown",
      });
      const proofGapId = gate.proofGap?.proofGapId;
      if (!proofGapId) throw new Error("expected proof gap before recovery recommendation");

      const recommendation = await client.createRecoveryRecommendation({
        sourceReceiptId: gate.receipt.receiptId,
        sourceRefusalOrGapRef: proofGapId,
        recommendedPath: "narrower_action_contract_required",
        allowedNextActionClasses: [actionContract.actionClass],
        requiredNewEvidence: ["receiver_finality_evidence"],
        requiresHumanReview: true,
        reasonCode: "downstream_status_unknown",
        reasonSummary: "Receiver did not produce downstream finality evidence.",
      });

      expect(recommendation.sourceReceiptId).toBe(gate.receipt.receiptId);
      expect(recommendation.sourceRefusalOrGapRef).toBe(proofGapId);
      expect(recommendation.mustCreateNewActionContract).toBe(true);
      expect(recommendation.mayReuseGreenlight).toBe(false);
      expect(recommendation.mayMutateReceiver).toBe(false);
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
        receiverRegistryRef: "receiver_registry@v1",
        generatedCodeOrSpecRefs: ["code:d1-recovery-follow-up"],
        declaredAssumptions: ["follow-up is narrowed by recovery recommendation"],
        requiredEvidenceRefs: ["receiver_finality_evidence"],
        candidate: {
          toolCapabilityId: fixture.tool.toolCapabilityId,
          actionTypeId: fixture.actionType.actionTypeId,
          receiverRegistryEntryId: fixture.receiver.receiverRegistryEntryId,
          actionClass: actionContract.actionClass,
          receiverId: actionContract.receiverId,
          resourceRef: actionContract.resourceRef,
        },
      });
      const followUp = await client.proposeActionContract({
        tenantId: actionContract.tenantId,
        organizationId: actionContract.organizationId,
        intentCompilationId: followUpCompilation.intentCompilationId,
        envelopeId: fixture.envelope.envelopeId,
        receiverRegistryEntryId: fixture.receiver.receiverRegistryEntryId,
        receiverId: actionContract.receiverId,
        principalId: actionContract.principalId,
        agentId: actionContract.agentId,
        runId: actionContract.runId,
        sequenceNumber: actionContract.sequenceNumber + 1,
        recoveryRecommendationId: recommendation.recoveryRecommendationId,
        actionClass: actionContract.actionClass,
        resourceRef: actionContract.resourceRef,
        parameters: { package: "hono", versionRange: "^4.12.19" },
        nonSecretParamsSummary: { package: "hono", versionRange: "^4.12.19" },
        purposeCode: "dependency_add_recovery",
        expectedSideEffectCodes: ["package_json_change", "lockfile_change"],
        evidenceRefs: ["receiver_finality_evidence"],
        bounds: { maxPackages: 1 },
        idempotencyKey: "idem_d1_recovery_followup",
        rollbackHint: "remove package and restore lockfile",
        expiresAt: futureIso(),
        signingSecret: "test-secret",
      });

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
      const gate = await client.receiverGate({
        actionContractId: actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
        downstreamMode: "unknown",
        receiverOperationRef: "receiver-op:d1-recovery-expire-unknown",
      });
      const proofGapId = gate.proofGap?.proofGapId;
      if (!proofGapId) throw new Error("expected proof gap before recovery expiration");

      const recommendation = await client.createRecoveryRecommendation({
        sourceReceiptId: gate.receipt.receiptId,
        sourceRefusalOrGapRef: proofGapId,
        recommendedPath: "narrower_action_contract_required",
        allowedNextActionClasses: [actionContract.actionClass],
        requiredNewEvidence: ["receiver_finality_evidence"],
        requiresHumanReview: true,
        reasonCode: "downstream_status_unknown",
        reasonSummary: "Receiver did not produce downstream finality evidence.",
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
      const gate = await client.receiverGate({
        actionContractId: actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
        downstreamMode: "unknown",
        receiverOperationRef: "receiver-op:d1-recovery-terminal-race",
      });
      const proofGapId = gate.proofGap?.proofGapId;
      if (!proofGapId) throw new Error("expected proof gap before recovery terminal race");

      const recommendation = await client.createRecoveryRecommendation({
        sourceReceiptId: gate.receipt.receiptId,
        sourceRefusalOrGapRef: proofGapId,
        recommendedPath: "narrower_action_contract_required",
        allowedNextActionClasses: [actionContract.actionClass],
        requiredNewEvidence: ["receiver_finality_evidence"],
        requiresHumanReview: true,
        reasonCode: "downstream_status_unknown",
        reasonSummary: "Receiver did not produce downstream finality evidence.",
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
      const gate = await client.receiverGate({
        actionContractId: actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
        downstreamMode: "unknown",
        receiverOperationRef: "receiver-op:d1-recovery-terminal-resolution",
      });
      const proofGapId = gate.proofGap?.proofGapId;
      if (!proofGapId) throw new Error("expected proof gap before recovery terminal resolution");

      const recommendation = await client.createRecoveryRecommendation({
        sourceReceiptId: gate.receipt.receiptId,
        sourceRefusalOrGapRef: proofGapId,
        recommendedPath: "narrower_action_contract_required",
        allowedNextActionClasses: [actionContract.actionClass],
        requiredNewEvidence: ["receiver_finality_evidence"],
        requiresHumanReview: true,
        reasonCode: "downstream_status_unknown",
        reasonSummary: "Receiver did not produce downstream finality evidence.",
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
        receiverId: actionContract.receiverId,
        resourceRef: actionContract.resourceRef,
        actionClass: actionContract.actionClass,
        matchedBreakerRuleIds: ["sequence_dependency_final_receipt"],
        supportingEventRefs: [actionTail.stream_event_id],
      });

      const gate = await client.receiverGate({
        actionContractId: actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
        downstreamMode: "succeed",
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

  it("records and resolves a Hono/D1 package-install proof gap for unknown downstream finality", async () => {
    const harness = await createD1HttpHarness();
    try {
      const { actionContract, client, greenlight, surface } = await createHttpPackageInstallContract(
        harness,
        "code:codemode-package-install-http-proof-gap",
      );

      const receiverGate = await client.receiverGate({
        actionContractId: actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
        receiverOperationRef: "receiver-op:d1-http-package-install-proof-gap",
        downstreamMode: "pending",
      });
      const verifiedGate = verifiedReceiverGateCheckFromResult(receiverGate);
      if (!verifiedGate) throw new Error("expected passed receiver gate");

      const mutationEvidence = await surface.applyPackageInstall({
        verifiedGate,
        packageName: "hono",
        versionRange: "^4.12.19",
      });
      const reconciliationResult = await client.reconcileReceiverOperation({
        mutationAttemptId: verifiedGate.mutationAttemptId,
        idempotencyKey: verifiedGate.idempotencyKey,
        observedReceiverOperationRef: mutationEvidence.receiverOperationRef,
        observedDownstreamStatus: "unknown",
        evidenceRefs: [],
      });
      const proofGapId = reconciliationResult.createdProofGap?.proofGapId;
      if (!proofGapId) throw new Error("expected reconciliation-created proof gap");

      expect(receiverGate.gateAttempt.gateDecision).toBe("passed");
      expect(receiverGate.receipt.finalityStatus).toBe("pending");
      expect(receiverGate.receipt.proofGapIds).toEqual([]);
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
        "receiver_gate_checked",
        "mutation_attempted",
        "receipt_emitted",
        "receiver_operation_reconciled",
        "proof_gap_recorded",
      ]);
      expect(events.map((event) => event.offset)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
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
        "receiver_operation_reconciliation",
      );
      expect(mutationCounts[0]?.count).toBe(1);
      expect(proofGapCounts[0]?.count).toBe(1);
      expect(reconciliationCounts[0]?.count).toBe(1);
    } finally {
      await harness.dispose();
    }
  });
});

async function createHttpPackageInstallContract(
  harness: D1HttpHarness,
  generatedCodeOrSpecRef: string,
) {
  const client = new HandshakeClient("http://handshake.test", harness.fetch);
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
