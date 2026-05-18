import type { ContractStreamEvent, IsolationState, ProtocolObjectType } from "../protocol/schemas";
import type {
  GreenlightConsumption,
  GreenlightIssuanceClaim,
  ProtocolCommit,
  ProtocolCommitResult,
  ProtocolStore,
  RecoveryTerminalClaim,
  ReceiverGateCommit,
  ReceiverGateCommitResult,
  StoredProtocolRecord,
  StreamTail,
} from "./store";

export class InMemoryProtocolStore implements ProtocolStore {
  private records = new Map<string, StoredProtocolRecord>();
  private events: ContractStreamEvent[] = [];
  private consumptions = new Map<string, GreenlightConsumption>();
  private greenlightIssuanceClaims = new Map<string, GreenlightIssuanceClaim>();
  private recoveryTerminalClaims = new Map<string, RecoveryTerminalClaim>();

  async putRecord(record: StoredProtocolRecord): Promise<void> {
    this.records.set(recordKey(record.objectType, record.objectId), structuredClone(record));
  }

  async getRecord<T>(objectType: ProtocolObjectType, objectId: string): Promise<StoredProtocolRecord<T> | null> {
    const record = this.records.get(recordKey(objectType, objectId));
    return record ? (structuredClone(record) as StoredProtocolRecord<T>) : null;
  }

  async listRecordsByType<T>(
    objectType: ProtocolObjectType,
    scope: { tenantId?: string; organizationId?: string } = {},
  ): Promise<StoredProtocolRecord<T>[]> {
    const records: StoredProtocolRecord<T>[] = [];
    for (const record of this.records.values()) {
      if (record.objectType !== objectType) continue;
      if (scope.tenantId && record.tenantId !== scope.tenantId) continue;
      if (scope.organizationId && record.organizationId !== scope.organizationId) continue;
      records.push(structuredClone(record) as StoredProtocolRecord<T>);
    }
    return records;
  }

  async getStreamTail(streamId: string, partitionKey: string): Promise<StreamTail> {
    const tail = this.events
      .filter((event) => event.streamId === streamId && event.partitionKey === partitionKey)
      .sort((a, b) => b.offset - a.offset)[0];
    return tail ? { offset: tail.offset, eventDigest: tail.eventDigest } : null;
  }

  async getStreamEvent(streamId: string, partitionKey: string, offset: number): Promise<ContractStreamEvent | null> {
    const event = this.events.find(
      (candidate) =>
        candidate.streamId === streamId &&
        candidate.partitionKey === partitionKey &&
        candidate.offset === offset,
    );
    return event ? structuredClone(event) : null;
  }

  async appendEvent(event: ContractStreamEvent): Promise<void> {
    this.events.push(structuredClone(event));
    await this.putRecord({
      objectId: event.streamEventId,
      objectType: "contract_stream_event",
      tenantId: event.tenantId,
      organizationId: event.organizationId,
      schemaVersion: event.schemaVersion,
      canonicalDigest: event.eventDigest,
      payload: event,
      createdAt: event.createdAt,
      sourceEventId: null,
    });
  }

  async listIsolationStates(scopeIds: string[]): Promise<IsolationState[]> {
    const scopeSet = new Set(scopeIds);
    const states: IsolationState[] = [];
    for (const record of this.records.values()) {
      if (record.objectType !== "isolation_state") continue;
      const state = record.payload as IsolationState;
      if (scopeSet.has(state.scopeId) && state.clearedAt === null) states.push(structuredClone(state));
    }
    return states;
  }

  async consumeGreenlight(consumption: GreenlightConsumption): Promise<"consumed" | "already_consumed"> {
    if (this.consumptions.has(consumption.greenlightId)) return "already_consumed";
    this.consumptions.set(consumption.greenlightId, structuredClone(consumption));
    return "consumed";
  }

  async commitProtocolRecords(commit: ProtocolCommit): Promise<ProtocolCommitResult> {
    if (commit.greenlightIssuanceClaims?.some((claim) => this.greenlightIssuanceClaims.has(claim.actionContractId))) {
      return "greenlight_issuance_conflict";
    }
    if (commit.recoveryTerminalClaims?.some((claim) => this.recoveryTerminalClaims.has(claim.recoveryRecommendationId))) {
      return "recovery_terminal_conflict";
    }
    if (commit.events.some((event) => this.hasStreamOffset(event))) {
      return "stream_conflict";
    }

    const nextRecords = new Map(this.records);
    const nextEvents = [...this.events];
    const nextGreenlightIssuanceClaims = new Map(this.greenlightIssuanceClaims);
    const nextRecoveryTerminalClaims = new Map(this.recoveryTerminalClaims);
    for (const claim of commit.greenlightIssuanceClaims ?? []) {
      nextGreenlightIssuanceClaims.set(claim.actionContractId, structuredClone(claim));
    }
    for (const claim of commit.recoveryTerminalClaims ?? []) {
      nextRecoveryTerminalClaims.set(claim.recoveryRecommendationId, structuredClone(claim));
    }
    this.stageRecordsAndEvents(nextRecords, nextEvents, commit.records, commit.events);
    this.records = nextRecords;
    this.events = nextEvents;
    this.greenlightIssuanceClaims = nextGreenlightIssuanceClaims;
    this.recoveryTerminalClaims = nextRecoveryTerminalClaims;
    return "committed";
  }

  async commitReceiverGate(commit: ReceiverGateCommit): Promise<ReceiverGateCommitResult> {
    if (commit.consumption && this.consumptions.has(commit.consumption.greenlightId)) {
      return "already_consumed";
    }
    if (commit.events.some((event) => this.hasStreamOffset(event))) {
      return "stream_conflict";
    }

    const nextRecords = new Map(this.records);
    const nextEvents = [...this.events];
    const nextConsumptions = new Map(this.consumptions);

    if (commit.consumption) {
      nextConsumptions.set(commit.consumption.greenlightId, structuredClone(commit.consumption));
    }

    this.stageRecordsAndEvents(nextRecords, nextEvents, commit.records, commit.events);

    this.records = nextRecords;
    this.events = nextEvents;
    this.consumptions = nextConsumptions;
    return "committed";
  }

  countRecordsOfType(objectType: ProtocolObjectType): number {
    let count = 0;
    for (const record of this.records.values()) {
      if (record.objectType === objectType) count += 1;
    }
    return count;
  }

  listEventsForPartition(streamId: string, partitionKey: string): ContractStreamEvent[] {
    return this.events
      .filter((event) => event.streamId === streamId && event.partitionKey === partitionKey)
      .sort((a, b) => a.offset - b.offset)
      .map((event) => structuredClone(event));
  }

  private hasStreamOffset(event: ContractStreamEvent): boolean {
    return this.events.some(
      (existing) =>
        existing.streamId === event.streamId &&
        existing.partitionKey === event.partitionKey &&
        existing.offset === event.offset,
    );
  }

  private stageRecordsAndEvents(
    records: Map<string, StoredProtocolRecord>,
    events: ContractStreamEvent[],
    commitRecords: StoredProtocolRecord[],
    commitEvents: ContractStreamEvent[],
  ): void {
    for (const record of commitRecords) {
      records.set(recordKey(record.objectType, record.objectId), structuredClone(record));
    }

    for (const event of commitEvents) {
      events.push(structuredClone(event));
      records.set(
        recordKey("contract_stream_event", event.streamEventId),
        structuredClone({
          objectId: event.streamEventId,
          objectType: "contract_stream_event",
          tenantId: event.tenantId,
          organizationId: event.organizationId,
          schemaVersion: event.schemaVersion,
          canonicalDigest: event.eventDigest,
          payload: event,
          createdAt: event.createdAt,
          sourceEventId: null,
        }),
      );
    }
  }
}

function recordKey(type: ProtocolObjectType, id: string): string {
  return `${type}:${id}`;
}
