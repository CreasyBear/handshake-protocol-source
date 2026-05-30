import type { Context } from "hono";
import { HandshakeProtocolError } from "../../protocol/foundation/errors";
import { projectGeneratedGraphEvidence } from "../../protocol/areas/generated-execution-graph";
import type {
  ActionContract,
  ContractStreamEvent,
  GatewayRegistryEntry,
  GeneratedExecutionGraph,
  Receipt,
  SurfaceOperationReconciliation,
} from "../../protocol/public/schemas";
import {
  assembleAgentTransactionEnvelopeInput,
  projectAgentTransactionEnvelope,
  projectContractEvidence,
  projectIdempotencyRecovery,
  projectOperationCorrelationIndex,
  projectOperationReadback,
  projectProtectedPathInstallHealth,
  projectReceiptTimeline,
  resolveReceiptTimelineDelegationProvenance,
} from "../../protocol/evidence-projections";
import { idempotencyLedgerKey, idempotencyLedgerKeyDigest } from "../../protocol/areas/idempotency-ledger";
import { protectedPathPostureScopeKeyForContract } from "../../protocol/areas/protected-path-posture";
import type { ProtocolStore } from "../../protocol/store/port";
import { authorizeEvidenceReadAdmission } from "../admission";
import type { AppOptions, WorkerBindings } from "../app-options";
import type { EvidenceReadRouteDefinition } from "../routes/evidence-read-route-registry";
import { transitionErrorResult, type TransitionErrorContext } from "../errors/transition-error-envelope";
import { storeFor } from "../store/resolution";

const RECEIPT_TIMELINE_EVENT_BATCH_SIZE = 100;

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
          await assembleAgentTransactionEnvelopeInput(store, contractRecord.payload),
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
        const reconciliations = await store.listRecordsByActionContract<SurfaceOperationReconciliation>(
          "surface_operation_reconciliation",
          receiptRecord.payload.actionContractId,
          {
            tenantId: receiptRecord.tenantId,
            organizationId: receiptRecord.organizationId,
          },
        );
        const delegationProvenance = await resolveReceiptTimelineDelegationProvenance(store, receiptRecord.payload);
        return c.json(
          projectReceiptTimeline({
            receipt: receiptRecord.payload,
            events: events.events,
            missingEventCount: events.missingEventCount,
            reconciliations: reconciliations.map((record) => record.payload),
            delegationProvenance,
          }),
        );
      }
      case "getOperationReadbackProjection": {
        const actionContractId = c.req.param("actionContractId");
        if (!actionContractId) return recordNotFound(c, errorContext);
        const contractRecord = await store.getRecord<ActionContract>("action_contract", actionContractId);
        if (!contractRecord || !callerCanReadRecord(admission.hostedIdentity, contractRecord)) {
          return recordNotFound(c, errorContext);
        }
        const projection = await projectOperationReadback(
          await assembleAgentTransactionEnvelopeInput(store, contractRecord.payload),
        );
        return c.json(projection);
      }
      case "getOperationCorrelationIndex": {
        const actionContractId = c.req.param("actionContractId");
        if (!actionContractId) return recordNotFound(c, errorContext);
        const contractRecord = await store.getRecord<ActionContract>("action_contract", actionContractId);
        if (!contractRecord || !callerCanReadRecord(admission.hostedIdentity, contractRecord)) {
          return recordNotFound(c, errorContext);
        }
        return c.json(
          projectOperationCorrelationIndex(await assembleAgentTransactionEnvelopeInput(store, contractRecord.payload)),
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

async function loadReceiptTimelineEvents(
  store: ProtocolStore,
  receipt: Receipt,
): Promise<{ events: ContractStreamEvent[]; missingEventCount: number }> {
  const events: ContractStreamEvent[] = [];
  let missingEventCount = 0;
  for (const reference of receipt.streamOffsets) {
    for (let startOffset = reference.offsetStart; startOffset <= reference.offsetEnd; ) {
      const endOffset = Math.min(reference.offsetEnd, startOffset + RECEIPT_TIMELINE_EVENT_BATCH_SIZE - 1);
      const batch = await store.listStreamEvents(reference.streamId, reference.partitionKey, {
        startOffset,
        endOffset,
        limit: RECEIPT_TIMELINE_EVENT_BATCH_SIZE,
      });
      events.push(...batch);
      const observedOffsets = new Set(batch.map((event) => event.offset));
      missingEventCount += expectedOffsetCount(startOffset, endOffset) - observedOffsets.size;
      startOffset = endOffset + 1;
    }
  }
  return { events, missingEventCount };
}

function expectedOffsetCount(startOffset: number, endOffset: number): number {
  return Math.max(0, endOffset - startOffset + 1);
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
