import type {
  ActionContract,
  ContractStreamEvent,
  Greenlight,
  IsolationState,
  ProtocolObjectType,
  ProtocolRecord,
} from "../protocol/schemas";

export type StoredProtocolRecord<T = unknown> = {
  objectId: string;
  objectType: ProtocolObjectType;
  tenantId: string;
  organizationId: string;
  schemaVersion: string;
  canonicalDigest: string;
  payload: T;
  createdAt: string;
  sourceEventId: string | null;
};

export type GreenlightConsumption = {
  greenlightId: string;
  gateAttemptId: string;
  actionContractId: string;
  idempotencyKey: string;
  consumedAt: string;
};

export type GreenlightIssuanceClaim = {
  actionContractId: string;
  greenlightId: string;
  policyDecisionId: string;
  tenantId: string;
  organizationId: string;
  claimedAt: string;
};

export type RecoveryTerminalClaim = {
  recoveryRecommendationId: string;
  statusTransitionId: string;
  nextStatus: "expired" | "superseded";
  claimedAt: string;
};

export type ReceiverGateCommit = {
  consumption: GreenlightConsumption | null;
  records: StoredProtocolRecord[];
  events: ContractStreamEvent[];
};

export type ProtocolCommit = {
  greenlightIssuanceClaims?: GreenlightIssuanceClaim[];
  recoveryTerminalClaims?: RecoveryTerminalClaim[];
  records: StoredProtocolRecord[];
  events: ContractStreamEvent[];
};

export type ProtocolCommitResult =
  | "committed"
  | "stream_conflict"
  | "recovery_terminal_conflict"
  | "greenlight_issuance_conflict";
export type ReceiverGateCommitResult = "committed" | "already_consumed" | "stream_conflict";

export type StreamTail = {
  offset: number;
  eventDigest: string;
} | null;

export interface ProtocolStore {
  putRecord(record: StoredProtocolRecord): Promise<void>;
  getRecord<T>(objectType: ProtocolObjectType, objectId: string): Promise<StoredProtocolRecord<T> | null>;
  listRecordsByType<T>(objectType: ProtocolObjectType, scope?: { tenantId?: string; organizationId?: string }): Promise<StoredProtocolRecord<T>[]>;
  getStreamTail(streamId: string, partitionKey: string): Promise<StreamTail>;
  getStreamEvent(streamId: string, partitionKey: string, offset: number): Promise<ContractStreamEvent | null>;
  listIsolationStates(scopeIds: string[]): Promise<IsolationState[]>;
  consumeGreenlight(consumption: GreenlightConsumption): Promise<"consumed" | "already_consumed">;
  commitProtocolRecords(commit: ProtocolCommit): Promise<ProtocolCommitResult>;
  commitReceiverGate(commit: ReceiverGateCommit): Promise<ReceiverGateCommitResult>;
}

export function getObjectId(record: ProtocolRecord): string {
  switch (record.objectType) {
    case "tool_capability":
      return record.payload.toolCapabilityId;
    case "action_type":
      return record.payload.actionTypeId;
    case "receiver_registry_entry":
      return record.payload.receiverRegistryEntryId;
    case "operating_envelope":
      return record.payload.envelopeId;
    case "intent_compilation":
      return record.payload.intentCompilationId;
    case "action_contract":
      return record.payload.actionContractId;
    case "policy_decision":
      return record.payload.policyDecisionId;
    case "greenlight":
      return record.payload.greenlightId;
    case "review_decision":
      return record.payload.reviewDecisionId;
    case "breaker_decision":
      return record.payload.breakerDecisionId;
    case "isolation_state":
      return record.payload.isolationStateId;
    case "receiver_gate_attempt":
      return record.payload.gateAttemptId;
    case "mutation_attempt":
      return record.payload.mutationAttemptId;
    case "receiver_operation_reconciliation":
      return record.payload.reconciliationId;
    case "proof_gap":
      return record.payload.proofGapId;
    case "receipt":
      return record.payload.receiptId;
    case "receipt_export":
      return record.payload.receiptExportId;
    case "recovery_recommendation":
      return record.payload.recoveryRecommendationId;
    case "recovery_recommendation_status_transition":
      return record.payload.recoveryRecommendationStatusTransitionId;
    case "contract_stream_event":
      return record.payload.streamEventId;
  }
}

export function scopeIdsForContract(contract: ActionContract): string[] {
  return [
    contract.tenantId,
    contract.organizationId,
    contract.agentId,
    contract.runId,
    contract.envelopeId,
    contract.actionClass,
    contract.receiverId,
    contract.resourceRef,
  ];
}

export function scopeIdsForGreenlight(greenlight: Greenlight): string[] {
  return [
    greenlight.tenantId,
    greenlight.organizationId,
    greenlight.receiverId,
    greenlight.actionClass,
    greenlight.resourceRef,
  ];
}
