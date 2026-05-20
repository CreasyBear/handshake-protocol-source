import type { Context } from "hono";
import { HandshakeProtocolError } from "../../protocol/foundation/errors";
import { projectGeneratedGraphEvidence } from "../../protocol/areas/generated-execution-graph";
import type {
  ActionContract,
  ContractStreamEvent,
  GatewayRegistryEntry,
  GatewayCheckAttempt,
  Greenlight,
  GeneratedExecutionGraph,
  MutationAttempt,
  PolicyDecision,
  ProofGap,
  Refusal,
  Receipt,
  SurfaceOperationReconciliation,
} from "../../protocol/public/schemas";
import {
  projectAgentTransactionEnvelope,
  projectContractEvidence,
  projectIdempotencyRecovery,
  projectProtectedPathInstallHealth,
  projectReceiptTimeline,
} from "../../protocol/evidence-projections";
import { idempotencyLedgerKey, idempotencyLedgerKeyDigest } from "../../protocol/areas/idempotency-ledger";
import { protectedPathPostureScopeKeyForContract } from "../../protocol/areas/protected-path-posture";
import type { ProtocolStore } from "../../protocol/store/port";
import { authorizeEvidenceReadAdmission } from "../admission";
import type { AppOptions, WorkerBindings } from "../app-options";
import type { EvidenceReadRouteDefinition } from "../routes/evidence-read-route-registry";
import { transitionErrorResult, type TransitionErrorContext } from "../errors/transition-error-envelope";
import { storeFor } from "../store/resolution";

export async function handleEvidenceRead(
  c: Context<{ Bindings: WorkerBindings }>,
  options: AppOptions,
  fallbackStore: ProtocolStore | null,
  route: EvidenceReadRouteDefinition,
): Promise<Response> {
  const errorContext: TransitionErrorContext = {
    transitionName: route.routeId,
    callerCustodyRole: route.roles[0] ?? null,
    requestIdentity: null,
  };
  try {
    const admission = await authorizeEvidenceReadAdmission(c, options, route, errorContext);
    if (admission.failure) return admission.failure;
    const store = storeFor(c, fallbackStore);
    switch (route.routeId) {
      case "getGeneratedGraphEvidenceProjection": {
        const graphId = c.req.param("generatedExecutionGraphId");
        if (!graphId) return recordNotFound(c, errorContext);
        const graphRecord = await store.getRecord<GeneratedExecutionGraph>("generated_execution_graph", graphId);
        if (!graphRecord || !callerCanReadRecord(admission.hostedIdentity, graphRecord)) {
          return recordNotFound(c, errorContext);
        }
        return c.json(projectGeneratedGraphEvidence(graphRecord.payload));
      }
      case "getContractEvidenceProjection": {
        const actionContractId = c.req.param("actionContractId");
        if (!actionContractId) return recordNotFound(c, errorContext);
        const contractRecord = await store.getRecord<ActionContract>("action_contract", actionContractId);
        if (!contractRecord || !callerCanReadRecord(admission.hostedIdentity, contractRecord)) {
          return recordNotFound(c, errorContext);
        }
        return c.json(projectContractEvidence(contractRecord.payload));
      }
      case "getAgentTransactionEnvelopeProjection": {
        const actionContractId = c.req.param("actionContractId");
        if (!actionContractId) return recordNotFound(c, errorContext);
        const contractRecord = await store.getRecord<ActionContract>("action_contract", actionContractId);
        if (!contractRecord || !callerCanReadRecord(admission.hostedIdentity, contractRecord)) {
          return recordNotFound(c, errorContext);
        }
        const projection = await projectAgentTransactionEnvelope(
          await agentTransactionEnvelopeInput(store, contractRecord.payload),
        );
        return c.json(projection);
      }
      case "getIdempotencyRecoveryProjection": {
        const actionContractId = c.req.param("actionContractId");
        if (!actionContractId) return recordNotFound(c, errorContext);
        const contractRecord = await store.getRecord<ActionContract>("action_contract", actionContractId);
        if (!contractRecord || !callerCanReadRecord(admission.hostedIdentity, contractRecord)) {
          return recordNotFound(c, errorContext);
        }
        const ledger = await store.getCurrentIdempotencyLedgerEntry(
          await idempotencyLedgerKeyDigest(idempotencyLedgerKey(contractRecord.payload)),
        );
        return c.json(
          await projectIdempotencyRecovery({
            contract: contractRecord.payload,
            ledger: ledger?.payload ?? null,
          }),
        );
      }
      case "getReceiptTimelineProjection": {
        const receiptId = c.req.param("receiptId");
        if (!receiptId) return recordNotFound(c, errorContext);
        const receiptRecord = await store.getRecord<Receipt>("receipt", receiptId);
        if (!receiptRecord || !callerCanReadRecord(admission.hostedIdentity, receiptRecord)) {
          return recordNotFound(c, errorContext);
        }
        const events = await loadReceiptTimelineEvents(store, receiptRecord.payload);
        const reconciliations = await store.listRecordsByType<SurfaceOperationReconciliation>(
          "surface_operation_reconciliation",
          {
            tenantId: receiptRecord.tenantId,
            organizationId: receiptRecord.organizationId,
          },
        );
        return c.json(
          projectReceiptTimeline({
            receipt: receiptRecord.payload,
            events: events.events,
            missingEventCount: events.missingEventCount,
            reconciliations: reconciliations.map((record) => record.payload),
          }),
        );
      }
      case "getProtectedPathInstallHealthProjection": {
        const actionContractId = c.req.param("actionContractId");
        if (!actionContractId) return recordNotFound(c, errorContext);
        const contractRecord = await store.getRecord<ActionContract>("action_contract", actionContractId);
        if (!contractRecord || !callerCanReadRecord(admission.hostedIdentity, contractRecord)) {
          return recordNotFound(c, errorContext);
        }
        const gatewayRecord = await store.getRecord<GatewayRegistryEntry>(
          "gateway_registry_entry",
          contractRecord.payload.gatewayRegistryEntryId,
        );
        const postureRecord = await store.getCurrentProtectedPathPosture(
          protectedPathPostureScopeKeyForContract(contractRecord.payload),
        );
        return c.json(
          projectProtectedPathInstallHealth({
            contract: contractRecord.payload,
            gateway: gatewayRecord?.payload ?? null,
            posture: postureRecord,
            now: new Date().toISOString(),
          }),
        );
      }
    }
  } catch (error) {
    const result = transitionErrorResult(error, errorContext);
    return c.json(result.body, result.status as 400);
  }
}

function callerCanReadRecord(
  hostedIdentity: { tenantId: string; organizationId: string } | null,
  record: { tenantId: string; organizationId: string },
): boolean {
  return (
    !hostedIdentity ||
    (record.tenantId === hostedIdentity.tenantId && record.organizationId === hostedIdentity.organizationId)
  );
}

async function agentTransactionEnvelopeInput(store: ProtocolStore, contract: ActionContract) {
  const scope = { tenantId: contract.tenantId, organizationId: contract.organizationId };
  const [policyDecisionRecords, greenlightRecords, gateAttemptRecords, mutationAttemptRecords, receiptRecords] =
    await Promise.all([
      store.listRecordsByType<PolicyDecision>("policy_decision", scope),
      store.listRecordsByType<Greenlight>("greenlight", scope),
      store.listRecordsByType<GatewayCheckAttempt>("gateway_check_attempt", scope),
      store.listRecordsByType<MutationAttempt>("mutation_attempt", scope),
      store.listRecordsByType<Receipt>("receipt", scope),
    ]);

  const receipts = latestFirst(receiptRecords.map((record) => record.payload)).filter(
    (receipt) => receipt.actionContractId === contract.actionContractId,
  );
  const receipt = receipts[0] ?? null;
  const policyDecision =
    (receipt
      ? await recordPayload<PolicyDecision>(store, "policy_decision", receipt.policyDecisionId)
      : latestFirst(policyDecisionRecords.map((record) => record.payload)).find(
          (decision) => decision.actionContractId === contract.actionContractId,
        )) ?? null;
  if (!policyDecision) {
    throw new HandshakeProtocolError(
      "policy_decision_missing",
      "Agent transaction envelope requires policy evidence.",
      404,
      {
        retryability: "terminal",
        commitState: "not_applicable",
      },
    );
  }

  const greenlight =
    (receipt?.greenlightId
      ? await recordPayload<Greenlight>(store, "greenlight", receipt.greenlightId)
      : latestFirst(greenlightRecords.map((record) => record.payload)).find(
          (record) => record.actionContractId === contract.actionContractId,
        )) ?? null;
  const gateAttempt =
    (receipt?.gateAttemptId
      ? await recordPayload<GatewayCheckAttempt>(store, "gateway_check_attempt", receipt.gateAttemptId)
      : latestFirst(gateAttemptRecords.map((record) => record.payload)).find(
          (record) => record.actionContractId === contract.actionContractId,
        )) ?? null;
  const mutationAttempt =
    (receipt?.mutationAttemptId
      ? await recordPayload<MutationAttempt>(store, "mutation_attempt", receipt.mutationAttemptId)
      : latestFirst(mutationAttemptRecords.map((record) => record.payload)).find(
          (record) => record.actionContractId === contract.actionContractId,
        )) ?? null;
  const ledger = await store.getCurrentIdempotencyLedgerEntry(
    await idempotencyLedgerKeyDigest(idempotencyLedgerKey(contract)),
  );
  const proofGaps = await scopedProofGaps(store, contract);
  const refusals = (await store.listRecordsByType<Refusal>("refusal", scope))
    .map((record) => record.payload)
    .filter((refusal) => refusal.actionContractId === contract.actionContractId);

  return {
    contract,
    policyDecision,
    greenlight,
    gateAttempt,
    mutationAttempt,
    receipt,
    proofGaps,
    refusals,
    ledger: ledger?.payload ?? null,
  };
}

async function recordPayload<T>(
  store: ProtocolStore,
  objectType: Parameters<ProtocolStore["getRecord"]>[0],
  objectId: string,
): Promise<T | null> {
  return (await store.getRecord<T>(objectType, objectId))?.payload ?? null;
}

async function scopedProofGaps(store: ProtocolStore, contract: ActionContract): Promise<ProofGap[]> {
  return (
    await store.listRecordsByType<ProofGap>("proof_gap", {
      tenantId: contract.tenantId,
      organizationId: contract.organizationId,
    })
  )
    .map((record) => record.payload)
    .filter((proofGap) => proofGap.affectedObjectRefs.includes(contract.actionContractId));
}

function latestFirst<T extends { createdAt: string }>(values: T[]): T[] {
  return values
    .map((value, index) => ({ value, index }))
    .sort(
      (left, right) => Date.parse(right.value.createdAt) - Date.parse(left.value.createdAt) || right.index - left.index,
    )
    .map((entry) => entry.value);
}

async function loadReceiptTimelineEvents(
  store: ProtocolStore,
  receipt: Receipt,
): Promise<{ events: ContractStreamEvent[]; missingEventCount: number }> {
  const events: ContractStreamEvent[] = [];
  let missingEventCount = 0;
  for (const reference of receipt.streamOffsets) {
    for (let offset = reference.offsetStart; offset <= reference.offsetEnd; offset += 1) {
      const event = await store.getStreamEvent(reference.streamId, reference.partitionKey, offset);
      if (event) {
        events.push(event);
      } else {
        missingEventCount += 1;
      }
    }
  }
  return { events, missingEventCount };
}

function recordNotFound(c: Context, context: TransitionErrorContext): Response {
  const result = transitionErrorResult(
    new HandshakeProtocolError("record_not_found", "Protocol evidence record was not found.", 404, {
      retryability: "terminal",
      commitState: "not_applicable",
    }),
    context,
  );
  return c.json(result.body, result.status as 404);
}
