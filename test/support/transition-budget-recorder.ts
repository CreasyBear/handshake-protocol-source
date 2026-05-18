import type { ContractStreamEvent } from "../../src/protocol/event-schemas";
import type {
  GatewayCheckCommit,
  GatewayCheckCommitResult,
  GreenlightConsumption,
  IsolationState,
  ProtocolCommit,
  ProtocolCommitResult,
  ProtocolObjectType,
  ProtocolStore,
  ProtectedPathPosture,
  ProtectedSurfaceOperationClaim,
  Receipt,
  StoredProtocolRecord,
  StreamTail,
} from "../../src/protocol/store-port";

export type TransitionBudgetSnapshot = {
  reads: number;
  writes: number;
  committedRecords: number;
  emittedEvents: number;
  streamPartitionsTouched: number;
  streamPartitions: string[];
  recordWritesByType: Partial<Record<ProtocolObjectType, number>>;
  eventWritesByType: Partial<Record<ContractStreamEvent["eventType"], number>>;
  methodCounts: Partial<Record<keyof ProtocolStore, number>>;
};

export type TransitionBudgetLimit = {
  maxReads: number;
  maxWrites: number;
  maxCommittedRecords: number;
  maxEmittedEvents: number;
  maxStreamPartitionsTouched: number;
};

type MemoryInspectionStore = ProtocolStore & {
  countRecordsOfType?(objectType: ProtocolObjectType): number;
  listEventsForPartition?(streamId: string, partitionKey: string): ContractStreamEvent[];
};

export class TransitionBudgetRecorder implements ProtocolStore {
  private reads = 0;
  private writes = 0;
  private committedRecords = 0;
  private emittedEvents = 0;
  private streamPartitions = new Set<string>();
  private recordWritesByType = new Map<ProtocolObjectType, number>();
  private eventWritesByType = new Map<ContractStreamEvent["eventType"], number>();
  private methodCounts = new Map<keyof ProtocolStore, number>();

  constructor(readonly delegate: ProtocolStore) {}

  reset(): void {
    this.reads = 0;
    this.writes = 0;
    this.committedRecords = 0;
    this.emittedEvents = 0;
    this.streamPartitions.clear();
    this.recordWritesByType.clear();
    this.eventWritesByType.clear();
    this.methodCounts.clear();
  }

  snapshot(): TransitionBudgetSnapshot {
    return {
      reads: this.reads,
      writes: this.writes,
      committedRecords: this.committedRecords,
      emittedEvents: this.emittedEvents,
      streamPartitionsTouched: this.streamPartitions.size,
      streamPartitions: [...this.streamPartitions].sort(),
      recordWritesByType: Object.fromEntries(this.recordWritesByType) as Partial<Record<ProtocolObjectType, number>>,
      eventWritesByType: Object.fromEntries(this.eventWritesByType) as Partial<
        Record<ContractStreamEvent["eventType"], number>
      >,
      methodCounts: Object.fromEntries(this.methodCounts) as Partial<Record<keyof ProtocolStore, number>>,
    };
  }

  assertWithin(transitionName: string, budget: TransitionBudgetLimit): void {
    const snapshot = this.snapshot();
    const violations = [
      ["reads", snapshot.reads, budget.maxReads],
      ["writes", snapshot.writes, budget.maxWrites],
      ["committedRecords", snapshot.committedRecords, budget.maxCommittedRecords],
      ["emittedEvents", snapshot.emittedEvents, budget.maxEmittedEvents],
      ["streamPartitionsTouched", snapshot.streamPartitionsTouched, budget.maxStreamPartitionsTouched],
    ].filter(([, actual, max]) => Number(actual) > Number(max));

    if (violations.length === 0) return;
    throw new Error(
      [
        `Transition budget exceeded for ${transitionName}.`,
        `Violations: ${violations.map(([name, actual, max]) => `${name}=${actual} > ${max}`).join(", ")}`,
        `Snapshot: ${JSON.stringify(snapshot, null, 2)}`,
      ].join("\n"),
    );
  }

  async putRecord(record: StoredProtocolRecord): Promise<void> {
    this.countWrite("putRecord");
    this.countRecord(record);
    return this.delegate.putRecord(record);
  }

  async putRecordIfAbsentOrSame(record: StoredProtocolRecord): Promise<"inserted" | "unchanged" | "conflict"> {
    this.countWrite("putRecordIfAbsentOrSame");
    this.countRecord(record);
    return this.delegate.putRecordIfAbsentOrSame(record);
  }

  async getRecord<T>(objectType: ProtocolObjectType, objectId: string): Promise<StoredProtocolRecord<T> | null> {
    this.countRead("getRecord");
    return this.delegate.getRecord<T>(objectType, objectId);
  }

  async listRecordsByType<T>(
    objectType: ProtocolObjectType,
    scope: { tenantId?: string; organizationId?: string } = {},
  ): Promise<StoredProtocolRecord<T>[]> {
    this.countRead("listRecordsByType");
    return this.delegate.listRecordsByType<T>(objectType, scope);
  }

  async getStreamTail(streamId: string, partitionKey: string): Promise<StreamTail> {
    this.countRead("getStreamTail");
    this.countPartition(streamId, partitionKey);
    return this.delegate.getStreamTail(streamId, partitionKey);
  }

  async getStreamEvent(streamId: string, partitionKey: string, offset: number): Promise<ContractStreamEvent | null> {
    this.countRead("getStreamEvent");
    this.countPartition(streamId, partitionKey);
    return this.delegate.getStreamEvent(streamId, partitionKey, offset);
  }

  async getCurrentProtectedPathPosture(
    postureScopeKey: string,
  ): Promise<StoredProtocolRecord<ProtectedPathPosture> | null> {
    this.countRead("getCurrentProtectedPathPosture");
    return this.delegate.getCurrentProtectedPathPosture(postureScopeKey);
  }

  async getCurrentProtectedSurfaceOperationClaim(
    claimKeyDigest: string,
  ): Promise<StoredProtocolRecord<ProtectedSurfaceOperationClaim> | null> {
    this.countRead("getCurrentProtectedSurfaceOperationClaim");
    return this.delegate.getCurrentProtectedSurfaceOperationClaim(claimKeyDigest);
  }

  async getReceiptByMutationAttemptId(mutationAttemptId: string): Promise<StoredProtocolRecord<Receipt> | null> {
    this.countRead("getReceiptByMutationAttemptId");
    return this.delegate.getReceiptByMutationAttemptId(mutationAttemptId);
  }

  async listIsolationStates(scopeIds: string[]): Promise<IsolationState[]> {
    this.countRead("listIsolationStates");
    return this.delegate.listIsolationStates(scopeIds);
  }

  async consumeGreenlight(consumption: GreenlightConsumption): Promise<"consumed" | "already_consumed"> {
    this.countWrite("consumeGreenlight");
    return this.delegate.consumeGreenlight(consumption);
  }

  async commitProtocolRecords(commit: ProtocolCommit): Promise<ProtocolCommitResult> {
    this.countWrite("commitProtocolRecords");
    this.countCommitRecords(commit.records);
    this.countCommitEvents(commit.events);
    return this.delegate.commitProtocolRecords(commit);
  }

  async commitGatewayCheck(commit: GatewayCheckCommit): Promise<GatewayCheckCommitResult> {
    this.countWrite("commitGatewayCheck");
    this.countCommitRecords(commit.records);
    this.countCommitEvents(commit.events);
    return this.delegate.commitGatewayCheck(commit);
  }

  countRecordsOfType(objectType: ProtocolObjectType): number {
    const delegate = this.delegate as MemoryInspectionStore;
    if (!delegate.countRecordsOfType) throw new Error("Delegate store does not expose countRecordsOfType.");
    return delegate.countRecordsOfType(objectType);
  }

  listEventsForPartition(streamId: string, partitionKey: string): ContractStreamEvent[] {
    const delegate = this.delegate as MemoryInspectionStore;
    if (!delegate.listEventsForPartition) throw new Error("Delegate store does not expose listEventsForPartition.");
    return delegate.listEventsForPartition(streamId, partitionKey);
  }

  private countRead(method: keyof ProtocolStore): void {
    this.reads += 1;
    this.countMethod(method);
  }

  private countWrite(method: keyof ProtocolStore): void {
    this.writes += 1;
    this.countMethod(method);
  }

  private countMethod(method: keyof ProtocolStore): void {
    this.methodCounts.set(method, (this.methodCounts.get(method) ?? 0) + 1);
  }

  private countCommitRecords(records: StoredProtocolRecord[]): void {
    this.committedRecords += records.length;
    for (const record of records) this.countRecord(record);
  }

  private countRecord(record: StoredProtocolRecord): void {
    this.recordWritesByType.set(record.objectType, (this.recordWritesByType.get(record.objectType) ?? 0) + 1);
  }

  private countCommitEvents(events: ContractStreamEvent[]): void {
    this.emittedEvents += events.length;
    for (const event of events) {
      this.eventWritesByType.set(event.eventType, (this.eventWritesByType.get(event.eventType) ?? 0) + 1);
      this.countPartition(event.streamId, event.partitionKey);
    }
  }

  private countPartition(streamId: string, partitionKey: string): void {
    this.streamPartitions.add(`${streamId}:${partitionKey}`);
  }
}
