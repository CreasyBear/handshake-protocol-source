import type { ContractStreamEvent } from "../events/schemas";
import type { IdempotencyLedgerEntry } from "../areas/idempotency-ledger";
import type { IsolationState } from "../areas/isolation-breaker";
import type { ProtocolObjectType } from "../areas/object-registry/schemas";
import type { ProtectedSurfaceOperationClaim } from "../areas/operation-lifecycle";
import type { ProtectedPathPosture } from "../areas/protected-path-posture";
import type { Receipt } from "../areas/receipt-export";

export type { ContractStreamEvent } from "../events/schemas";
export type { IdempotencyLedgerEntry } from "../areas/idempotency-ledger";
export type { IsolationState } from "../areas/isolation-breaker";
export type { ProtocolObjectType } from "../areas/object-registry/schemas";
export type { ProtectedSurfaceOperationClaim } from "../areas/operation-lifecycle";
export type { ProtectedPathPosture } from "../areas/protected-path-posture";
export type { Receipt } from "../areas/receipt-export";

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

export type ProtectedPathPostureIndexEntry = {
  postureScopeKey: string;
  protectedPathPostureId: string;
  tenantId: string;
  organizationId: string;
  updatedAt: string;
};

export type ProtectedSurfaceOperationClaimIndexEntry = {
  claimKeyDigest: string;
  protectedSurfaceOperationClaimId: string;
  tenantId: string;
  organizationId: string;
  claimState: ProtectedSurfaceOperationClaim["claimState"];
  updatedAt: string;
};

export type ReceiptMutationAttemptIndexEntry = {
  mutationAttemptId: string;
  receiptId: string;
  tenantId: string;
  organizationId: string;
  createdAt: string;
};

export type IdempotencyLedgerIndexEntry = {
  ledgerKeyDigest: string;
  idempotencyLedgerEntryId: string;
  tenantId: string;
  organizationId: string;
  paramsDigest: string;
  actionContractId: string;
  policyDecisionId: string;
  greenlightId: string | null;
  ledgerState: IdempotencyLedgerEntry["ledgerState"];
  updatedAt: string;
};

export type IsolationStateIndexEntry = {
  isolationScopeKey: string;
  isolationStateId: string;
  tenantId: string;
  organizationId: string;
  scopeType: IsolationState["scopeType"];
  scopeId: string;
  state: IsolationState["state"];
  updatedAt: string;
};

export type IsolationScopeRef = Pick<IsolationState, "tenantId" | "organizationId" | "scopeType" | "scopeId">;

export type GatewayCheckCommit = {
  consumption: GreenlightConsumption | null;
  protectedSurfaceOperationClaimIndexEntries?: ProtectedSurfaceOperationClaimIndexEntry[];
  idempotencyLedgerIndexEntries?: IdempotencyLedgerIndexEntry[];
  receiptMutationAttemptIndexEntries?: ReceiptMutationAttemptIndexEntry[];
  records: StoredProtocolRecord[];
  events: ContractStreamEvent[];
};

export type ProtocolCommit = {
  greenlightIssuanceClaims?: GreenlightIssuanceClaim[];
  recoveryTerminalClaims?: RecoveryTerminalClaim[];
  protectedPathPostureIndexEntries?: ProtectedPathPostureIndexEntry[];
  isolationStateIndexEntries?: IsolationStateIndexEntry[];
  idempotencyLedgerReservationEntries?: IdempotencyLedgerIndexEntry[];
  idempotencyLedgerIndexEntries?: IdempotencyLedgerIndexEntry[];
  protectedSurfaceOperationClaimIndexEntries?: ProtectedSurfaceOperationClaimIndexEntry[];
  protectedSurfaceOperationClaimIndexReleases?: string[];
  receiptMutationAttemptIndexEntries?: ReceiptMutationAttemptIndexEntry[];
  records: StoredProtocolRecord[];
  events: ContractStreamEvent[];
};

export type ProtocolCommitResult =
  | "committed"
  | "stream_conflict"
  | "recovery_terminal_conflict"
  | "greenlight_issuance_conflict"
  | "idempotency_ledger_conflict";
export type GatewayCheckCommitResult =
  | "committed"
  | "already_consumed"
  | "operation_claim_conflict"
  | "receipt_index_conflict"
  | "stream_conflict";

export type StreamTail = {
  offset: number;
  eventDigest: string;
} | null;

export type ProtocolRecordScope = { tenantId?: string; organizationId?: string };

export type StreamEventRange = {
  startOffset?: number;
  endOffset?: number;
  limit?: number;
};

export interface ProtocolStore {
  putRecord(record: StoredProtocolRecord): Promise<void>;
  putRecordIfAbsentOrSame(record: StoredProtocolRecord): Promise<"inserted" | "unchanged" | "conflict">;
  getRecord<T>(objectType: ProtocolObjectType, objectId: string): Promise<StoredProtocolRecord<T> | null>;
  listRecordsByType<T>(objectType: ProtocolObjectType, scope?: ProtocolRecordScope): Promise<StoredProtocolRecord<T>[]>;
  listRecordsByActionContract<T>(
    objectType: ProtocolObjectType,
    actionContractId: string,
    scope?: ProtocolRecordScope,
  ): Promise<StoredProtocolRecord<T>[]>;
  getStreamTail(streamId: string, partitionKey: string): Promise<StreamTail>;
  getStreamEvent(streamId: string, partitionKey: string, offset: number): Promise<ContractStreamEvent | null>;
  listStreamEvents(streamId: string, partitionKey: string, range?: StreamEventRange): Promise<ContractStreamEvent[]>;
  getCurrentProtectedPathPosture(postureScopeKey: string): Promise<StoredProtocolRecord<ProtectedPathPosture> | null>;
  getCurrentIdempotencyLedgerEntry(
    ledgerKeyDigest: string,
  ): Promise<StoredProtocolRecord<IdempotencyLedgerEntry> | null>;
  getCurrentProtectedSurfaceOperationClaim(
    claimKeyDigest: string,
  ): Promise<StoredProtocolRecord<ProtectedSurfaceOperationClaim> | null>;
  getReceiptByMutationAttemptId(mutationAttemptId: string): Promise<StoredProtocolRecord<Receipt> | null>;
  listIsolationStates(scopeRefs: IsolationScopeRef[]): Promise<IsolationState[]>;
  consumeGreenlight(consumption: GreenlightConsumption): Promise<"consumed" | "already_consumed">;
  commitProtocolRecords(commit: ProtocolCommit): Promise<ProtocolCommitResult>;
  commitGatewayCheck(commit: GatewayCheckCommit): Promise<GatewayCheckCommitResult>;
}
