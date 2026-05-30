import { digestCanonical } from "../../foundation/canonical";
import type { ActionContract } from "../action-contract";
import { actionLifecycleStreamRefs, type EventDescriptor } from "../../events/chains";
import { HandshakeProtocolError } from "../../foundation/errors";
import type { GatewayCheckAttempt } from "../gateway-gate";
import { createId, nowIso } from "../../foundation/ids";
import type { ProofGap } from "../proof-gap";
import type { IntentCompilationRecord } from "../intent-compilation";
import type { StoredDelegationEvidenceRecord } from "../delegation-evidence-record";
import { resolveReceiptDelegationProvenance, type ReceiptDelegationProvenance } from "./delegation-provenance";
import { CreateReceiptExportInputSchema, type CreateReceiptExportInput } from "./types";
import { deriveDownstreamOutcomeStatus, deriveGatewayAdmissionStatus } from "./status";
import type { ProtocolRecorder } from "../../events/records";
import type { ProtocolRecord } from "../object-registry";
import { PROTOCOL_VERSION, ReceiptExportSchema, type JsonValue, type Receipt, type ReceiptExport } from "./types";

type DigestedReceipt = Receipt & {
  receiptDigest: string;
  auditChainDigest: string;
};

type ParsedCreateReceiptExportInput = ReturnType<typeof CreateReceiptExportInputSchema.parse>;

type ReceiptExportContext = {
  recorder: ProtocolRecorder;
  input: ParsedCreateReceiptExportInput;
  receipt: DigestedReceipt;
  contract: ActionContract;
  intentCompilation: IntentCompilationRecord;
  delegationEvidenceRecord: StoredDelegationEvidenceRecord | null;
  gateAttempt: GatewayCheckAttempt | null;
  proofGaps: ProofGap[];
  receiptExportId: string;
  now: string;
};

export async function createReceiptExport(
  recorder: ProtocolRecorder,
  inputValue: CreateReceiptExportInput,
): Promise<ReceiptExport> {
  const input = CreateReceiptExportInputSchema.parse(inputValue);
  const context = await getReceiptExportContext(recorder, input);
  const receiptExport = await buildReceiptExport(context);
  await commitReceiptExport(recorder, context, receiptExport);
  return receiptExport;
}

async function getReceiptExportContext(
  recorder: ProtocolRecorder,
  input: ParsedCreateReceiptExportInput,
): Promise<ReceiptExportContext> {
  const receiptRecord = await recorder.requiredRecord<Receipt>("receipt", input.receiptId, "receipt_missing");
  const receipt = receiptRecord.payload;
  assertReceiptExportable(receipt);
  await assertReceiptDigests(receipt);

  const contractRecord = await recorder.requiredRecord<ActionContract>(
    "action_contract",
    receipt.actionContractId,
    "contract_missing",
  );
  const intentCompilationRecord = await recorder.requiredRecord<IntentCompilationRecord>(
    "intent_compilation",
    contractRecord.payload.intentCompilationId,
    "intent_compilation_missing",
  );
  const delegationRef = intentCompilationRecord.payload.candidateAction.delegationEvidenceRef;
  const delegationEvidenceRecord = delegationRef
    ? await recorder.optionalRecord<StoredDelegationEvidenceRecord>(
        "delegation_evidence_record",
        delegationRef.delegationEvidenceRefId,
      )
    : null;
  const gateAttemptRecord = receipt.gateAttemptId
    ? await recorder.requiredRecord<GatewayCheckAttempt>(
        "gateway_check_attempt",
        receipt.gateAttemptId,
        "gateway_check_attempt_missing",
      )
    : null;
  const proofGaps = await loadProofGaps(recorder, receipt.proofGapIds);
  return {
    recorder,
    input,
    receipt,
    contract: contractRecord.payload,
    intentCompilation: intentCompilationRecord.payload,
    delegationEvidenceRecord: delegationEvidenceRecord?.payload ?? null,
    gateAttempt: gateAttemptRecord?.payload ?? null,
    proofGaps,
    receiptExportId: createId("rex"),
    now: nowIso(),
  };
}

async function buildReceiptExport(context: ReceiptExportContext): Promise<ReceiptExport> {
  const { input, receipt, contract, gateAttempt, proofGaps, receiptExportId, now } = context;
  const delegationResolution = await resolveReceiptDelegationProvenance({
    contract,
    intentCompilation: context.intentCompilation,
    storedRecord: context.delegationEvidenceRecord,
  });
  const evidenceRefs = [...new Set([...receipt.evidenceRefs, ...(delegationResolution?.evidenceRefs ?? [])])];
  const delegationProvenance = delegationResolution?.provenance ?? undefined;
  const exportDigest = await digestCanonical(buildReceiptExportBinding(context, delegationProvenance ?? null));
  return ReceiptExportSchema.parse({
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
    principalId: contract.principalId,
    agentId: contract.agentId,
    runId: contract.runId,
    gatewayPolicyVersion: contract.gatewayPolicyVersion,
    policyDecisionStatus: receipt.policyDecisionStatus,
    gatewayCheckStatus: receipt.gatewayCheckStatus,
    gatewayAdmissionStatus: deriveGatewayAdmissionStatus(receipt),
    gatewayCheckedAt: gateAttempt?.createdAt ?? null,
    greenlightConsumptionStatus: receipt.greenlightConsumptionStatus,
    mutationAttemptStatus: receipt.mutationAttemptStatus,
    downstreamExecutionStatus: receipt.downstreamExecutionStatus,
    downstreamOutcomeStatus: deriveDownstreamOutcomeStatus(receipt),
    proofGapStatus: receipt.proofGapIds.length > 0 ? "present" : "none",
    proofGapIds: receipt.proofGapIds,
    proofGapReasonCodes: proofGaps.map((proofGap) => proofGap.reasonCode),
    finalityStatus: receipt.finalityStatus,
    evidenceRefs,
    ...(delegationProvenance ? { delegationProvenance } : {}),
    streamOffsets: receipt.streamOffsets,
    receiptDigest: receipt.receiptDigest,
    auditChainDigest: receipt.auditChainDigest,
    signaturePosture: contract.signaturePosture,
    keyIdentityRef: contract.keyIdentityRef,
    verificationPolicyRef: contract.verificationPolicyRef,
    exportFormat: input.exportFormat,
    redactionProfileRef: input.redactionProfileRef,
    exportPurposeCode: input.exportPurposeCode,
    requestedByRef: input.requestedByRef,
    evidenceRetentionUntil: input.evidenceRetentionUntil,
    exportedAt: now,
    exportDigest,
  });
}

function buildReceiptExportBinding(
  context: ReceiptExportContext,
  delegationProvenance: ReceiptDelegationProvenance | null,
): JsonValue {
  const { input, receipt, receiptExportId, now } = context;
  const exportBinding = {
    receiptExportId,
    receiptId: receipt.receiptId,
    actionContractId: receipt.actionContractId,
    receiptDigest: receipt.receiptDigest,
    auditChainDigest: receipt.auditChainDigest,
    streamOffsets: receipt.streamOffsets,
    proofGapIds: receipt.proofGapIds,
    finalityStatus: receipt.finalityStatus,
    delegationProvenance,
    exportFormat: input.exportFormat,
    redactionProfileRef: input.redactionProfileRef,
    exportPurposeCode: input.exportPurposeCode,
    requestedByRef: input.requestedByRef,
    exportedAt: now,
  } satisfies JsonValue;
  return exportBinding;
}

async function commitReceiptExport(
  recorder: ProtocolRecorder,
  context: ReceiptExportContext,
  receiptExport: ReceiptExport,
): Promise<void> {
  await recorder.commitRecordsWithEvents(
    receiptExportRecords(receiptExport),
    receiptExportEvents(context, receiptExport),
  );
}

function receiptExportRecords(receiptExport: ReceiptExport): ProtocolRecord[] {
  return [{ objectType: "receipt_export", payload: receiptExport }];
}

function receiptExportEvents(context: ReceiptExportContext, receiptExport: ReceiptExport): EventDescriptor[] {
  return [
    {
      source: receiptExport,
      eventType: "receipt_exported",
      objectRefs: [receiptExport.receiptExportId, receiptExport.receiptId, receiptExport.actionContractId],
      streamRefs: actionLifecycleStreamRefs(context.contract),
      payload: {
        receiptId: receiptExport.receiptId,
        exportDigest: receiptExport.exportDigest,
        finalityStatus: receiptExport.finalityStatus,
      },
    },
  ];
}

function assertReceiptExportable(receipt: Receipt): asserts receipt is DigestedReceipt {
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
