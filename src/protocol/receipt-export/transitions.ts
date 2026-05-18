import { digestCanonical } from "../canonical";
import type { ActionContract } from "../action-contract";
import { actionLifecycleStreamRefs } from "../events";
import { HandshakeProtocolError } from "../errors";
import type { GatewayCheckAttempt } from "../gateway-gate";
import { createId, nowIso } from "../ids";
import type { ProofGap } from "../proof-gap";
import { CreateReceiptExportInputSchema, type CreateReceiptExportInput } from "./types";
import type { ProtocolRecorder } from "../records";
import {
  PROTOCOL_VERSION,
  ReceiptExportSchema,
  type JsonValue,
  type Receipt,
  type ReceiptExport,
} from "./types";

export async function createReceiptExport(
  recorder: ProtocolRecorder,
  inputValue: CreateReceiptExportInput,
): Promise<ReceiptExport> {
  const input = CreateReceiptExportInputSchema.parse(inputValue);
  const receiptRecord = await recorder.requiredRecord<Receipt>("receipt", input.receiptId, "receipt_missing");
  const receipt = receiptRecord.payload;
  assertReceiptExportable(receipt);
  await assertReceiptDigests(receipt);

  const [contractRecord, gateAttemptRecord] = await Promise.all([
    recorder.requiredRecord<ActionContract>("action_contract", receipt.actionContractId, "contract_missing"),
    receipt.gateAttemptId
      ? recorder.requiredRecord<GatewayCheckAttempt>("gateway_check_attempt", receipt.gateAttemptId, "gateway_check_attempt_missing")
      : Promise.resolve(null),
  ]);
  const proofGaps = await loadProofGaps(recorder, receipt.proofGapIds);
  const now = nowIso();
  const receiptExportId = createId("rex");
  const exportBinding = {
    receiptExportId,
    receiptId: receipt.receiptId,
    actionContractId: receipt.actionContractId,
    receiptDigest: receipt.receiptDigest,
    auditChainDigest: receipt.auditChainDigest,
    streamOffsets: receipt.streamOffsets,
    proofGapIds: receipt.proofGapIds,
    finalityStatus: receipt.finalityStatus,
    exportFormat: input.exportFormat,
    redactionProfileRef: input.redactionProfileRef,
    exportPurposeCode: input.exportPurposeCode,
    requestedByRef: input.requestedByRef,
    exportedAt: now,
  } satisfies JsonValue;
  const exportDigest = await digestCanonical(exportBinding);
  const receiptExport = ReceiptExportSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: receipt.tenantId,
    organizationId: receipt.organizationId,
    createdAt: now,
    receiptExportId,
    receiptId: receipt.receiptId,
    actionContractId: receipt.actionContractId,
    policyDecisionId: receipt.policyDecisionId,
    greenlightId: receipt.greenlightId,
    gateAttemptId: receipt.gateAttemptId,
    mutationAttemptId: receipt.mutationAttemptId,
    gatewayId: receipt.gatewayId,
    principalId: contractRecord.payload.principalId,
    agentId: contractRecord.payload.agentId,
    runId: contractRecord.payload.runId,
    gatewayPolicyVersion: contractRecord.payload.gatewayPolicyVersion,
    policyDecisionStatus: receipt.policyDecisionStatus,
    gatewayCheckStatus: receipt.gatewayCheckStatus,
    gatewayCheckedAt: gateAttemptRecord?.payload.createdAt ?? null,
    greenlightConsumptionStatus: receipt.greenlightConsumptionStatus,
    mutationAttemptStatus: receipt.mutationAttemptStatus,
    downstreamExecutionStatus: receipt.downstreamExecutionStatus,
    proofGapStatus: receipt.proofGapIds.length > 0 ? "present" : "none",
    proofGapIds: receipt.proofGapIds,
    proofGapReasonCodes: proofGaps.map((proofGap) => proofGap.reasonCode),
    finalityStatus: receipt.finalityStatus,
    evidenceRefs: receipt.evidenceRefs,
    streamOffsets: receipt.streamOffsets,
    receiptDigest: receipt.receiptDigest,
    auditChainDigest: receipt.auditChainDigest,
    exportFormat: input.exportFormat,
    redactionProfileRef: input.redactionProfileRef,
    exportPurposeCode: input.exportPurposeCode,
    requestedByRef: input.requestedByRef,
    evidenceRetentionUntil: input.evidenceRetentionUntil,
    exportedAt: now,
    exportDigest,
  });

  await recorder.commitRecordsWithEvents(
    [{ objectType: "receipt_export", payload: receiptExport }],
    [
      {
        source: receiptExport,
        eventType: "receipt_exported",
        objectRefs: [receiptExport.receiptExportId, receiptExport.receiptId, receiptExport.actionContractId],
        streamRefs: actionLifecycleStreamRefs(contractRecord.payload),
        payload: {
          receiptId: receiptExport.receiptId,
          exportDigest: receiptExport.exportDigest,
          finalityStatus: receiptExport.finalityStatus,
        },
      },
    ],
  );
  return receiptExport;
}

function assertReceiptExportable(receipt: Receipt): void {
  if (!receipt.receiptDigest || !receipt.auditChainDigest) {
    throw new HandshakeProtocolError(
      "receipt_digest_missing",
      "Receipt export requires receiptDigest and auditChainDigest.",
      409,
    );
  }
  if (receipt.streamOffsets.length === 0 || receipt.streamEventIds.length === 0) {
    throw new HandshakeProtocolError(
      "receipt_stream_offsets_missing",
      "Receipt export requires stream event references and stream offset windows.",
      409,
    );
  }
}

async function assertReceiptDigests(receipt: Receipt): Promise<void> {
  const expectedReceiptDigest = await digestCanonical({
    ...receipt,
    receiptDigest: null,
    auditChainDigest: null,
  } satisfies JsonValue);
  if (receipt.receiptDigest !== expectedReceiptDigest) {
    throw new HandshakeProtocolError(
      "receipt_digest_mismatch",
      "Stored receiptDigest does not match the receipt body.",
      409,
    );
  }
  const expectedAuditChainDigest = await digestCanonical({
    receiptDigest: receipt.receiptDigest,
    streamOffsets: receipt.streamOffsets,
    proofGapIds: receipt.proofGapIds,
    finalityStatus: receipt.finalityStatus,
  } satisfies JsonValue);
  if (receipt.auditChainDigest !== expectedAuditChainDigest) {
    throw new HandshakeProtocolError(
      "audit_chain_digest_mismatch",
      "Stored auditChainDigest does not match the receipt stream and proof-gap evidence.",
      409,
    );
  }
}

async function loadProofGaps(recorder: ProtocolRecorder, proofGapIds: string[]): Promise<ProofGap[]> {
  const proofGaps: ProofGap[] = [];
  for (const proofGapId of proofGapIds) {
    const proofGap = await recorder.requiredRecord<ProofGap>("proof_gap", proofGapId, "proof_gap_missing");
    proofGaps.push(proofGap.payload);
  }
  return proofGaps;
}
