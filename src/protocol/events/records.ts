import { digestCanonical } from "../foundation/canonical";
import type { ContractStreamEvent } from "./schemas";
import { buildEventChain, type EventDescriptor } from "./chains";
import { HandshakeProtocolError } from "../foundation/errors";
import type { ProtocolObjectType, ProtocolRecord } from "../areas/object-registry/schemas";
import type { JsonValue } from "../foundation/schema-core";
import { buildTransitionRequestContext, type TransitionRequestContextDraft } from "../context/request-contexts";
import type {
  GreenlightIssuanceClaim,
  IdempotencyLedgerIndexEntry,
  IsolationStateIndexEntry,
  ProtectedSurfaceOperationClaimIndexEntry,
  ProtectedPathPostureIndexEntry,
  ProtocolStore,
  ReceiptMutationAttemptIndexEntry,
  RecoveryTerminalClaim,
  StoredProtocolRecord,
} from "../store/port";
import { getObjectId } from "../areas/object-registry";

const MAX_STREAM_COMMIT_RETRIES = 3;

export type CommitRecordsOptions = {
  recordConflictMode?: "replace" | "absent_or_same";
  greenlightIssuanceClaims?: GreenlightIssuanceClaim[];
  idempotencyLedgerReservationEntries?: IdempotencyLedgerIndexEntry[];
  idempotencyLedgerIndexEntries?: IdempotencyLedgerIndexEntry[];
  recoveryTerminalClaims?: RecoveryTerminalClaim[];
  protectedPathPostureIndexEntries?: ProtectedPathPostureIndexEntry[];
  isolationStateIndexEntries?: IsolationStateIndexEntry[];
  protectedSurfaceOperationClaimIndexEntries?: ProtectedSurfaceOperationClaimIndexEntry[];
  protectedSurfaceOperationClaimIndexReleases?: string[];
  receiptMutationAttemptIndexEntries?: ReceiptMutationAttemptIndexEntry[];
};

export class ProtocolRecorder {
  constructor(
    private readonly store: ProtocolStore,
    private readonly transitionRequestContext?: TransitionRequestContextDraft,
  ) {}

  async requiredRecord<T>(
    objectType: ProtocolObjectType,
    objectId: string,
    code: string,
  ): Promise<StoredProtocolRecord<T>> {
    const record = await this.store.getRecord<T>(objectType, objectId);
    if (!record) throw new HandshakeProtocolError(code, `${objectType} ${objectId} was not found.`, 404);
    return record;
  }

  async optionalRecord<T>(objectType: ProtocolObjectType, objectId: string): Promise<StoredProtocolRecord<T> | null> {
    return this.store.getRecord<T>(objectType, objectId);
  }

  async persistRecord(record: ProtocolRecord): Promise<void> {
    await this.store.putRecord(await this.buildRecord(record));
    await this.persistTransitionRequestContextIfNeeded(record);
  }

  async persistRecordIfAbsentOrSame(record: ProtocolRecord): Promise<"inserted" | "unchanged" | "conflict"> {
    const result = await this.store.putRecordIfAbsentOrSame(await this.buildRecord(record));
    if (result !== "conflict") await this.persistTransitionRequestContextIfNeeded(record);
    return result;
  }

  async buildRecord(record: ProtocolRecord): Promise<StoredProtocolRecord> {
    return {
      objectId: getObjectId(record),
      objectType: record.objectType,
      tenantId: record.payload.tenantId,
      organizationId: record.payload.organizationId,
      schemaVersion: record.payload.schemaVersion,
      canonicalDigest: await digestCanonical(record.payload as JsonValue),
      payload: record.payload,
      createdAt: record.payload.createdAt,
      sourceEventId: null,
    };
  }

  async commitRecordsWithEvents(
    protocolRecords: ProtocolRecord[],
    eventDescriptors: EventDescriptor[],
    options: CommitRecordsOptions = {},
  ): Promise<ContractStreamEvent[]> {
    const result = await this.tryCommitRecordsWithEvents(protocolRecords, eventDescriptors, options);
    if (result.status === "committed") return result.events;
    if (result.status === "idempotency_ledger_conflict") {
      throw new HandshakeProtocolError(
        "idempotency_ledger_conflict",
        "Idempotency ledger reservation already exists for this protected action key.",
        409,
      );
    }
    if (result.status === "record_digest_conflict") {
      throw new HandshakeProtocolError(
        "bootstrap_record_digest_conflict",
        "Protocol commit cannot replace an existing record with a different canonical digest.",
        409,
      );
    }
    throw new HandshakeProtocolError("ambiguous_commit", "Protocol commit ended in an unknown state.", 500);
  }

  async tryCommitRecordsWithEvents(
    protocolRecords: ProtocolRecord[],
    eventDescriptors: EventDescriptor[],
    options: CommitRecordsOptions = {},
  ): Promise<
    | { status: "committed"; events: ContractStreamEvent[] }
    | { status: "idempotency_ledger_conflict" }
    | { status: "record_digest_conflict" }
  > {
    const { records: protocolRecordsWithContext, eventDescriptors: eventDescriptorsWithContext } =
      await this.withTransitionRequestContext(protocolRecords, eventDescriptors);
    const records = await Promise.all(protocolRecordsWithContext.map((record) => this.buildRecord(record)));
    for (let attempt = 0; attempt <= MAX_STREAM_COMMIT_RETRIES; attempt += 1) {
      const events = await buildEventChain(this.store, eventDescriptorsWithContext);
      const commitResult = await this.store.commitProtocolRecords({ records, events, ...options });
      if (commitResult === "committed") return { status: "committed", events };
      if (commitResult === "idempotency_ledger_conflict") {
        return { status: "idempotency_ledger_conflict" };
      }
      if (commitResult === "record_digest_conflict") {
        return { status: "record_digest_conflict" };
      }
      if (commitResult === "greenlight_issuance_conflict") {
        throw new HandshakeProtocolError(
          "invalid_transition_greenlight_already_issued",
          "A new greenlight requires a new action contract; this action contract already has a greenlight.",
          409,
        );
      }
      if (commitResult === "recovery_terminal_conflict") {
        throw new HandshakeProtocolError(
          "recovery_terminal_conflict",
          "Recovery recommendation already has a terminal status transition.",
          409,
        );
      }
    }
    throw new HandshakeProtocolError(
      "stream_append_conflict",
      "Protocol lifecycle record could not commit a contiguous contract stream after retrying fresh stream tails.",
      409,
    );
  }

  private async persistTransitionRequestContextIfNeeded(record: ProtocolRecord): Promise<void> {
    if (!this.transitionRequestContext || record.objectType === "transition_request_context") return;
    const context = await buildTransitionRequestContext(this.transitionRequestContext, {
      tenantId: record.payload.tenantId,
      organizationId: record.payload.organizationId,
    });
    await this.store.putRecord(await this.buildRecord({ objectType: "transition_request_context", payload: context }));
  }

  async transitionRequestContextRecordFor(scope: {
    tenantId: string;
    organizationId: string;
  }): Promise<ProtocolRecord | null> {
    if (!this.transitionRequestContext) return null;
    const context = await buildTransitionRequestContext(this.transitionRequestContext, scope);
    return { objectType: "transition_request_context", payload: context };
  }

  withTransitionRequestContextEventDescriptors(
    eventDescriptors: EventDescriptor[],
    contextRecord: ProtocolRecord | null,
  ): EventDescriptor[] {
    if (!contextRecord || contextRecord.objectType !== "transition_request_context") return eventDescriptors;
    const context = contextRecord.payload;
    return eventDescriptors.map((descriptor) => ({
      ...descriptor,
      objectRefs: [context.transitionRequestContextId, ...descriptor.objectRefs],
      payload: {
        ...descriptor.payload,
        transitionRequestContextId: context.transitionRequestContextId,
        requestContextDigest: context.requestContextDigest,
      },
    }));
  }

  private async withTransitionRequestContext(
    protocolRecords: ProtocolRecord[],
    eventDescriptors: EventDescriptor[],
  ): Promise<{ records: ProtocolRecord[]; eventDescriptors: EventDescriptor[] }> {
    if (!this.transitionRequestContext || protocolRecords.length === 0) {
      return { records: protocolRecords, eventDescriptors };
    }
    const scopeRecord = protocolRecords[0];
    if (!scopeRecord) return { records: protocolRecords, eventDescriptors };
    const scope = scopeRecord.payload;
    const contextRecord = await this.transitionRequestContextRecordFor({
      tenantId: scope.tenantId,
      organizationId: scope.organizationId,
    });
    if (!contextRecord) return { records: protocolRecords, eventDescriptors };
    return {
      records: [contextRecord, ...protocolRecords],
      eventDescriptors: this.withTransitionRequestContextEventDescriptors(eventDescriptors, contextRecord),
    };
  }
}
