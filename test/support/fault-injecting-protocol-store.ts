import { digestCanonical } from "../../src/protocol/canonical";
import { HandshakeAmbiguousCommitError } from "../../src/protocol/errors";
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

type ProtocolCommitFault = {
  result: ProtocolCommitResult | "applied_then_ambiguous";
  targetEventType?: ContractStreamEvent["eventType"];
  appendCompetingEvent?: boolean;
  when?: (commit: ProtocolCommit) => boolean;
};

type GatewayCommitFault = {
  result: GatewayCheckCommitResult | "applied_then_ambiguous";
  targetEventType?: ContractStreamEvent["eventType"];
  appendCompetingEvent?: boolean;
  when?: (commit: GatewayCheckCommit) => boolean;
};

type RecordReadFault<T = unknown> = {
  objectType: ProtocolObjectType;
  objectId?: string;
  replacement?: StoredProtocolRecord<T> | null;
};

type ListReadFault = {
  objectType: ProtocolObjectType;
};

type CurrentPostureFault = {
  postureScopeKey?: string;
  replacement?: StoredProtocolRecord<ProtectedPathPosture> | null;
};

type AppendEventStore = ProtocolStore & {
  appendEvent(event: ContractStreamEvent): Promise<void>;
};

type MemoryInspectionStore = ProtocolStore & {
  countRecordsOfType?(objectType: ProtocolObjectType): number;
  listEventsForPartition?(streamId: string, partitionKey: string): ContractStreamEvent[];
};

export class FaultInjectingProtocolStore implements ProtocolStore {
  private protocolCommitFaults: ProtocolCommitFault[] = [];
  private gatewayCommitFaults: GatewayCommitFault[] = [];
  private recordReadFaults: RecordReadFault[] = [];
  private listReadFaults: ListReadFault[] = [];
  private currentPostureFaults: CurrentPostureFault[] = [];
  private competingEventCounter = 0;

  constructor(readonly delegate: ProtocolStore) {}

  injectProtocolCommitResultOnce(
    result: ProtocolCommitResult,
    options: Omit<ProtocolCommitFault, "result"> = {},
  ): this {
    this.protocolCommitFaults.push({ result, ...options });
    return this;
  }

  injectGatewayCommitResultOnce(
    result: GatewayCheckCommitResult,
    options: Omit<GatewayCommitFault, "result"> = {},
  ): this {
    this.gatewayCommitFaults.push({ result, ...options });
    return this;
  }

  injectAmbiguousProtocolCommitOnce(options: Omit<ProtocolCommitFault, "result"> = {}): this {
    this.protocolCommitFaults.push({ result: "applied_then_ambiguous", ...options });
    return this;
  }

  injectAmbiguousGatewayCommitOnce(options: Omit<GatewayCommitFault, "result"> = {}): this {
    this.gatewayCommitFaults.push({ result: "applied_then_ambiguous", ...options });
    return this;
  }

  hideRecordOnce(objectType: ProtocolObjectType, objectId?: string): this {
    this.recordReadFaults.push({
      objectType,
      ...(objectId ? { objectId } : {}),
      replacement: null,
    });
    return this;
  }

  replaceRecordOnce<T>(record: StoredProtocolRecord<T>): this {
    this.recordReadFaults.push({
      objectType: record.objectType,
      objectId: record.objectId,
      replacement: record,
    });
    return this;
  }

  hideListRecordsByTypeOnce(objectType: ProtocolObjectType): this {
    this.listReadFaults.push({ objectType });
    return this;
  }

  hideCurrentProtectedPathPostureOnce(postureScopeKey?: string): this {
    this.currentPostureFaults.push({
      ...(postureScopeKey ? { postureScopeKey } : {}),
      replacement: null,
    });
    return this;
  }

  replaceCurrentProtectedPathPostureOnce(
    replacement: StoredProtocolRecord<ProtectedPathPosture>,
    postureScopeKey = replacement.payload.postureScopeKey,
  ): this {
    this.currentPostureFaults.push({ postureScopeKey, replacement });
    return this;
  }

  async putRecord(record: StoredProtocolRecord): Promise<void> {
    return this.delegate.putRecord(record);
  }

  async putRecordIfAbsentOrSame(record: StoredProtocolRecord): Promise<"inserted" | "unchanged" | "conflict"> {
    return this.delegate.putRecordIfAbsentOrSame(record);
  }

  async getRecord<T>(objectType: ProtocolObjectType, objectId: string): Promise<StoredProtocolRecord<T> | null> {
    const fault = takeFirst(this.recordReadFaults, (candidate) =>
      candidate.objectType === objectType && (!candidate.objectId || candidate.objectId === objectId),
    );
    if (fault) return (fault.replacement as StoredProtocolRecord<T> | null | undefined) ?? null;
    return this.delegate.getRecord<T>(objectType, objectId);
  }

  async listRecordsByType<T>(
    objectType: ProtocolObjectType,
    scope: { tenantId?: string; organizationId?: string } = {},
  ): Promise<StoredProtocolRecord<T>[]> {
    const fault = takeFirst(this.listReadFaults, (candidate) => candidate.objectType === objectType);
    if (fault) return [];
    return this.delegate.listRecordsByType<T>(objectType, scope);
  }

  async getStreamTail(streamId: string, partitionKey: string): Promise<StreamTail> {
    return this.delegate.getStreamTail(streamId, partitionKey);
  }

  async getStreamEvent(streamId: string, partitionKey: string, offset: number): Promise<ContractStreamEvent | null> {
    return this.delegate.getStreamEvent(streamId, partitionKey, offset);
  }

  async getCurrentProtectedPathPosture(
    postureScopeKey: string,
  ): Promise<StoredProtocolRecord<ProtectedPathPosture> | null> {
    const fault = takeFirst(
      this.currentPostureFaults,
      (candidate) => !candidate.postureScopeKey || candidate.postureScopeKey === postureScopeKey,
    );
    if (fault) return fault.replacement ?? null;
    return this.delegate.getCurrentProtectedPathPosture(postureScopeKey);
  }

  async getCurrentProtectedSurfaceOperationClaim(
    claimKeyDigest: string,
  ): Promise<StoredProtocolRecord<ProtectedSurfaceOperationClaim> | null> {
    return this.delegate.getCurrentProtectedSurfaceOperationClaim(claimKeyDigest);
  }

  async getReceiptByMutationAttemptId(mutationAttemptId: string): Promise<StoredProtocolRecord<Receipt> | null> {
    return this.delegate.getReceiptByMutationAttemptId(mutationAttemptId);
  }

  async listIsolationStates(scopeIds: string[]): Promise<IsolationState[]> {
    return this.delegate.listIsolationStates(scopeIds);
  }

  async consumeGreenlight(consumption: GreenlightConsumption): Promise<"consumed" | "already_consumed"> {
    return this.delegate.consumeGreenlight(consumption);
  }

  async commitProtocolRecords(commit: ProtocolCommit): Promise<ProtocolCommitResult> {
    const fault = takeFirst(this.protocolCommitFaults, (candidate) => protocolCommitFaultMatches(candidate, commit));
    if (!fault) return this.delegate.commitProtocolRecords(commit);
    if (fault.result === "stream_conflict" && fault.appendCompetingEvent) {
      await this.appendCompetingEventFor(protocolCommitTargetEvent(commit, fault.targetEventType));
    }
    if (fault.result === "applied_then_ambiguous") {
      const result = await this.delegate.commitProtocolRecords(commit);
      if (result === "committed") throw ambiguousCommitError("commitProtocolRecords");
      return result;
    }
    return fault.result;
  }

  async commitGatewayCheck(commit: GatewayCheckCommit): Promise<GatewayCheckCommitResult> {
    const fault = takeFirst(this.gatewayCommitFaults, (candidate) => gatewayCommitFaultMatches(candidate, commit));
    if (!fault) return this.delegate.commitGatewayCheck(commit);
    if (fault.result === "stream_conflict" && fault.appendCompetingEvent) {
      await this.appendCompetingEventFor(gatewayCommitTargetEvent(commit, fault.targetEventType));
    }
    if (fault.result === "applied_then_ambiguous") {
      const result = await this.delegate.commitGatewayCheck(commit);
      if (result === "committed") throw ambiguousCommitError("commitGatewayCheck");
      return result;
    }
    return fault.result;
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

  private async appendCompetingEventFor(event: ContractStreamEvent | null): Promise<void> {
    if (!event) throw new Error("Cannot inject stream conflict without a target event.");
    const delegate = this.delegate as Partial<AppendEventStore>;
    if (!delegate.appendEvent) throw new Error("Delegate store cannot append competing stream events.");
    this.competingEventCounter += 1;
    await delegate.appendEvent(await buildCompetingStreamEvent(event, this.competingEventCounter));
  }
}

function ambiguousCommitError(operation: "commitProtocolRecords" | "commitGatewayCheck"): HandshakeAmbiguousCommitError {
  return new HandshakeAmbiguousCommitError(
    `${operation} committed in the delegate store, then returned an ambiguous result.`,
  );
}

function protocolCommitFaultMatches(fault: ProtocolCommitFault, commit: ProtocolCommit): boolean {
  if (fault.when && !fault.when(commit)) return false;
  if (!fault.targetEventType) return true;
  return commit.events.some((event) => event.eventType === fault.targetEventType);
}

function gatewayCommitFaultMatches(fault: GatewayCommitFault, commit: GatewayCheckCommit): boolean {
  if (fault.when && !fault.when(commit)) return false;
  if (!fault.targetEventType) return true;
  return commit.events.some((event) => event.eventType === fault.targetEventType);
}

function protocolCommitTargetEvent(
  commit: ProtocolCommit,
  targetEventType?: ContractStreamEvent["eventType"],
): ContractStreamEvent | null {
  return commit.events.find((event) => !targetEventType || event.eventType === targetEventType) ?? null;
}

function gatewayCommitTargetEvent(
  commit: GatewayCheckCommit,
  targetEventType?: ContractStreamEvent["eventType"],
): ContractStreamEvent | null {
  return commit.events.find((event) => !targetEventType || event.eventType === targetEventType) ?? null;
}

function takeFirst<T>(items: T[], predicate: (item: T) => boolean): T | null {
  const index = items.findIndex(predicate);
  if (index < 0) return null;
  const [item] = items.splice(index, 1);
  return item ?? null;
}

async function buildCompetingStreamEvent(event: ContractStreamEvent, sequence: number): Promise<ContractStreamEvent> {
  const competingEvent = {
    ...event,
    streamEventId: `evt_competing_writer_${sequence}`,
    objectRefs: ["fault:competing-writer", event.objectRefs[1] ?? "fault:competing-object"],
    payload: {
      injectedFault: "stream_conflict",
      originalEventType: event.eventType,
    },
  } satisfies ContractStreamEvent;
  const eventSeed = {
    streamId: competingEvent.streamId,
    partitionKey: competingEvent.partitionKey,
    offset: competingEvent.offset,
    eventType: competingEvent.eventType,
    eventTime: competingEvent.eventTime,
    objectRefs: competingEvent.objectRefs,
    previousEventDigest: competingEvent.previousEventDigest,
    payload: competingEvent.payload,
  };
  return {
    ...competingEvent,
    eventDigest: await digestCanonical(eventSeed),
  };
}
