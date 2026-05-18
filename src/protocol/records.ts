import { digestCanonical } from "./canonical";
import { buildEventChain, type EventDescriptor } from "./events";
import { HandshakeProtocolError } from "./errors";
import type { ContractStreamEvent, JsonValue, ProtocolObjectType, ProtocolRecord } from "./schemas";
import type {
  GreenlightIssuanceClaim,
  ProtocolStore,
  RecoveryTerminalClaim,
  StoredProtocolRecord,
} from "../storage/store";
import { getObjectId } from "../storage/store";

const MAX_STREAM_COMMIT_RETRIES = 3;

export type CommitRecordsOptions = {
  greenlightIssuanceClaims?: GreenlightIssuanceClaim[];
  recoveryTerminalClaims?: RecoveryTerminalClaim[];
};

export class ProtocolRecorder {
  constructor(private readonly store: ProtocolStore) {}

  async requiredRecord<T>(
    objectType: ProtocolObjectType,
    objectId: string,
    code: string,
  ): Promise<StoredProtocolRecord<T>> {
    const record = await this.store.getRecord<T>(objectType, objectId);
    if (!record) throw new HandshakeProtocolError(code, `${objectType} ${objectId} was not found.`, 404);
    return record;
  }

  async persistRecord(record: ProtocolRecord): Promise<void> {
    await this.store.putRecord(await this.buildRecord(record));
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
    const records = await Promise.all(protocolRecords.map((record) => this.buildRecord(record)));
    for (let attempt = 0; attempt <= MAX_STREAM_COMMIT_RETRIES; attempt += 1) {
      const events = await buildEventChain(this.store, eventDescriptors);
      const commitResult = await this.store.commitProtocolRecords({ records, events, ...options });
      if (commitResult === "committed") return events;
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
}
