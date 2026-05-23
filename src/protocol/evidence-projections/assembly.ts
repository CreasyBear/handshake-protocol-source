import type { AuthorityCertificate } from "../areas/authority-certificate";
import type { ActionContract } from "../areas/action-contract";
import type { CredentialResolutionEvidence } from "../areas/credential-custody";
import type { GatewayCheckAttempt, MutationAttempt } from "../areas/gateway-gate/schemas";
import { idempotencyLedgerKey, idempotencyLedgerKeyDigest } from "../areas/idempotency-ledger";
import type { IsolationState } from "../areas/isolation-breaker";
import { isolationScopeRefsForContract } from "../areas/object-registry";
import type { SurfaceOperationReconciliation } from "../areas/operation-lifecycle";
import type { Greenlight, PolicyDecision } from "../areas/policy-greenlight/schemas";
import type { ProofGap } from "../areas/proof-gap";
import { protocolObjectRef, type Refusal } from "../areas/refusal";
import type { Receipt } from "../areas/receipt-export/schemas";
import type { RecoveryRecommendation, RecoveryRecommendationStatusTransition } from "../areas/recovery/schemas";
import { HandshakeProtocolError } from "../foundation/errors";
import type { ProtocolStore, StoredProtocolRecord } from "../store/port";
import type { AgentTransactionEnvelopeInput } from "./projections";

export type AgentTransactionEnvelopeAssembly = {
  input: AgentTransactionEnvelopeInput;
  supplementalRecords: StoredProtocolRecord[];
};

export async function assembleAgentTransactionEnvelopeInput(
  store: ProtocolStore,
  contract: ActionContract,
): Promise<AgentTransactionEnvelopeInput> {
  return (await assembleAgentTransactionEnvelope(store, contract)).input;
}

export async function assembleAgentTransactionEnvelope(
  store: ProtocolStore,
  contract: ActionContract,
): Promise<AgentTransactionEnvelopeAssembly> {
  const scope = { tenantId: contract.tenantId, organizationId: contract.organizationId };
  const [
    policyDecisionRecords,
    greenlightRecords,
    gateAttemptRecords,
    mutationAttemptRecords,
    receiptRecords,
    reconciliationRecords,
    authorityCertificateRecords,
    credentialResolutionEvidenceRecords,
    recoveryRecommendationRecords,
    recoveryRecommendationStatusTransitionRecords,
    isolationStateRecords,
  ] = await Promise.all([
    store.listRecordsByType<PolicyDecision>("policy_decision", scope),
    store.listRecordsByType<Greenlight>("greenlight", scope),
    store.listRecordsByType<GatewayCheckAttempt>("gateway_check_attempt", scope),
    store.listRecordsByType<MutationAttempt>("mutation_attempt", scope),
    store.listRecordsByType<Receipt>("receipt", scope),
    store.listRecordsByType<SurfaceOperationReconciliation>("surface_operation_reconciliation", scope),
    store.listRecordsByType<AuthorityCertificate>("authority_certificate", scope),
    store.listRecordsByType<CredentialResolutionEvidence>("credential_resolution_evidence", scope),
    store.listRecordsByType<RecoveryRecommendation>("recovery_recommendation", scope),
    store.listRecordsByType<RecoveryRecommendationStatusTransition>("recovery_recommendation_status_transition", scope),
    store.listRecordsByType<IsolationState>("isolation_state", scope),
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
  const refusals = scopedPayloads(
    await store.listRecordsByType<Refusal>("refusal", scope),
    (refusal) => refusal.actionContractId === contract.actionContractId,
  );
  const credentialResolutionEvidence = scopedRecords(
    credentialResolutionEvidenceRecords,
    (record) => record.payload.actionContractId === contract.actionContractId,
  );
  const recoveryRecommendations = scopedRecords(
    recoveryRecommendationRecords,
    (record) => record.payload.sourceActionContractId === contract.actionContractId,
  );
  const recoveryStatusTransitions = scopedRecords(
    recoveryRecommendationStatusTransitionRecords,
    (record) => record.payload.sourceActionContractId === contract.actionContractId,
  );
  const isolationStates = await store.listIsolationStates(isolationScopeRefsForContract(contract));
  const activeIsolationStateIds = new Set(
    isolationStates.filter((state) => state.clearedAt === null).map((state) => state.isolationStateId),
  );
  const activeIsolationStateRecords = scopedRecords(isolationStateRecords, (record) =>
    activeIsolationStateIds.has(record.payload.isolationStateId),
  );
  const scopedReconciliationRecords = scopedRecords(
    reconciliationRecords,
    (record) => record.payload.actionContractId === contract.actionContractId,
  );

  return {
    input: {
      contract,
      policyDecision,
      greenlight,
      gateAttempt,
      mutationAttempt,
      receipt,
      proofGaps,
      refusals,
      reconciliations: scopedReconciliationRecords.map((record) => record.payload),
      credentialResolutionEvidence: credentialResolutionEvidence.map((record) => record.payload),
      ledger: ledger?.payload ?? null,
      recoveryRefs: recoveryRefs(recoveryRecommendations, recoveryStatusTransitions),
      isolationRefs: activeIsolationStateRecords
        .map((record) => protocolObjectRef("isolation_state", record.payload.isolationStateId))
        .filter(unique),
      authorityCertificates: authorityCertificateRecords.map((record) => record.payload),
    },
    supplementalRecords: [
      ...credentialResolutionEvidence,
      ...(ledger ? [ledger] : []),
      ...recoveryRecommendations,
      ...recoveryStatusTransitions,
      ...activeIsolationStateRecords,
      ...scopedReconciliationRecords,
    ],
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

function scopedPayloads<T>(records: StoredProtocolRecord<T>[], predicate: (payload: T) => boolean): T[] {
  return records.map((record) => record.payload).filter(predicate);
}

function scopedRecords<T>(
  records: StoredProtocolRecord<T>[],
  predicate: (record: StoredProtocolRecord<T>) => boolean,
): StoredProtocolRecord<T>[] {
  return records.filter(predicate);
}

function recoveryRefs(
  recommendations: StoredProtocolRecord<RecoveryRecommendation>[],
  statusTransitions: StoredProtocolRecord<RecoveryRecommendationStatusTransition>[],
): string[] {
  return [
    ...recommendations.map((record) =>
      protocolObjectRef("recovery_recommendation", record.payload.recoveryRecommendationId),
    ),
    ...statusTransitions.map((record) =>
      protocolObjectRef(
        "recovery_recommendation_status_transition",
        record.payload.recoveryRecommendationStatusTransitionId,
      ),
    ),
  ].filter(unique);
}

function latestFirst<T extends { createdAt: string }>(values: T[]): T[] {
  return values
    .map((value, index) => ({ value, index }))
    .sort(
      (left, right) => Date.parse(right.value.createdAt) - Date.parse(left.value.createdAt) || right.index - left.index,
    )
    .map((entry) => entry.value);
}

function unique<T>(value: T, index: number, values: T[]): boolean {
  return values.indexOf(value) === index;
}
