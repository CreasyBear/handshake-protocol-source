import type { ContractStreamEvent } from "./event-schemas";
import type { IsolationState } from "./isolation-breaker";
import type { ProtocolObjectType } from "./object-registry/schemas";
import type { ProtectedSurfaceOperationClaim } from "./operation-lifecycle";
import type { ProtectedPathPosture } from "./protected-path-posture";
import type { Receipt } from "./receipt-export";

export type { ContractStreamEvent } from "./event-schemas";
export type { IsolationState } from "./isolation-breaker";
export type { ProtocolObjectType } from "./object-registry/schemas";
export type { ProtectedSurfaceOperationClaim } from "./operation-lifecycle";
export type { ProtectedPathPosture } from "./protected-path-posture";
export type { Receipt } from "./receipt-export";

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

export type GatewayCheckCommit = {
  consumption: GreenlightConsumption | null;
  protectedSurfaceOperationClaimIndexEntries?: ProtectedSurfaceOperationClaimIndexEntry[];
  receiptMutationAttemptIndexEntries?: ReceiptMutationAttemptIndexEntry[];
  records: StoredProtocolRecord[];
  events: ContractStreamEvent[];
};

export type ProtocolCommit = {
  greenlightIssuanceClaims?: GreenlightIssuanceClaim[];
  recoveryTerminalClaims?: RecoveryTerminalClaim[];
  protectedPathPostureIndexEntries?: ProtectedPathPostureIndexEntry[];
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
  | "greenlight_issuance_conflict";
export type GatewayCheckCommitResult =
  | "committed"
  | "already_consumed"
  | "operation_claim_conflict"
  | "stream_conflict";

export type StreamTail = {
  offset: number;
  eventDigest: string;
} | null;

export interface ProtocolStore {
  putRecord(record: StoredProtocolRecord): Promise<void>;
  putRecordIfAbsentOrSame(record: StoredProtocolRecord): Promise<"inserted" | "unchanged" | "conflict">;
  getRecord<T>(objectType: ProtocolObjectType, objectId: string): Promise<StoredProtocolRecord<T> | null>;
  listRecordsByType<T>(
    objectType: ProtocolObjectType,
    scope?: { tenantId?: string; organizationId?: string },
  ): Promise<StoredProtocolRecord<T>[]>;
  getStreamTail(streamId: string, partitionKey: string): Promise<StreamTail>;
  getStreamEvent(streamId: string, partitionKey: string, offset: number): Promise<ContractStreamEvent | null>;
  getCurrentProtectedPathPosture(postureScopeKey: string): Promise<StoredProtocolRecord<ProtectedPathPosture> | null>;
  getCurrentProtectedSurfaceOperationClaim(
    claimKeyDigest: string,
  ): Promise<StoredProtocolRecord<ProtectedSurfaceOperationClaim> | null>;
  getReceiptByMutationAttemptId(mutationAttemptId: string): Promise<StoredProtocolRecord<Receipt> | null>;
  listIsolationStates(scopeIds: string[]): Promise<IsolationState[]>;
  consumeGreenlight(consumption: GreenlightConsumption): Promise<"consumed" | "already_consumed">;
  commitProtocolRecords(commit: ProtocolCommit): Promise<ProtocolCommitResult>;
  commitGatewayCheck(commit: GatewayCheckCommit): Promise<GatewayCheckCommitResult>;
}
