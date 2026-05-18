import type { ContractStreamEvent, IsolationState, ProtocolObjectType } from "../protocol/schemas";
import type {
  GreenlightConsumption,
  ProtocolCommit,
  ProtocolCommitResult,
  ProtocolStore,
  RecoveryTerminalClaim,
  ReceiverGateCommit,
  ReceiverGateCommitResult,
  StoredProtocolRecord,
  StreamTail,
} from "./store";

export class D1ProtocolStore implements ProtocolStore {
  constructor(private readonly db: D1Database) {}

  async putRecord(record: StoredProtocolRecord): Promise<void> {
    await this.db
      .prepare(
        `INSERT OR REPLACE INTO protocol_records
          (object_id, object_type, tenant_id, organization_id, schema_version, canonical_digest, payload_json, created_at, source_event_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        record.objectId,
        record.objectType,
        record.tenantId,
        record.organizationId,
        record.schemaVersion,
        record.canonicalDigest,
        JSON.stringify(record.payload),
        record.createdAt,
        record.sourceEventId,
      )
      .run();
  }

  async getRecord<T>(objectType: ProtocolObjectType, objectId: string): Promise<StoredProtocolRecord<T> | null> {
    const row = await this.db
      .prepare(
        `SELECT object_id, object_type, tenant_id, organization_id, schema_version, canonical_digest, payload_json, created_at, source_event_id
         FROM protocol_records
         WHERE object_type = ? AND object_id = ?`,
      )
      .bind(objectType, objectId)
      .first<RecordRow>();
    if (!row) return null;
    return {
      objectId: row.object_id,
      objectType: row.object_type as ProtocolObjectType,
      tenantId: row.tenant_id,
      organizationId: row.organization_id,
      schemaVersion: row.schema_version,
      canonicalDigest: row.canonical_digest,
      payload: JSON.parse(row.payload_json) as T,
      createdAt: row.created_at,
      sourceEventId: row.source_event_id,
    };
  }

  async listRecordsByType<T>(
    objectType: ProtocolObjectType,
    scope: { tenantId?: string; organizationId?: string } = {},
  ): Promise<StoredProtocolRecord<T>[]> {
    const where = ["object_type = ?"];
    const bindings: string[] = [objectType];
    if (scope.tenantId) {
      where.push("tenant_id = ?");
      bindings.push(scope.tenantId);
    }
    if (scope.organizationId) {
      where.push("organization_id = ?");
      bindings.push(scope.organizationId);
    }
    const result = await this.db
      .prepare(
        `SELECT object_id, object_type, tenant_id, organization_id, schema_version, canonical_digest, payload_json, created_at, source_event_id
         FROM protocol_records
         WHERE ${where.join(" AND ")}`,
      )
      .bind(...bindings)
      .all<RecordRow>();
    return result.results.map((row) => ({
      objectId: row.object_id,
      objectType: row.object_type as ProtocolObjectType,
      tenantId: row.tenant_id,
      organizationId: row.organization_id,
      schemaVersion: row.schema_version,
      canonicalDigest: row.canonical_digest,
      payload: JSON.parse(row.payload_json) as T,
      createdAt: row.created_at,
      sourceEventId: row.source_event_id,
    }));
  }

  async getStreamTail(streamId: string, partitionKey: string): Promise<StreamTail> {
    const row = await this.db
      .prepare(
        `SELECT "offset" AS offset, event_digest
         FROM stream_events
         WHERE stream_id = ? AND partition_key = ?
         ORDER BY "offset" DESC
         LIMIT 1`,
      )
      .bind(streamId, partitionKey)
      .first<{ offset: number; event_digest: string }>();
    return row ? { offset: row.offset, eventDigest: row.event_digest } : null;
  }

  async getStreamEvent(streamId: string, partitionKey: string, offset: number): Promise<ContractStreamEvent | null> {
    const row = await this.db
      .prepare(
        `SELECT payload_json
         FROM stream_events
         WHERE stream_id = ? AND partition_key = ? AND "offset" = ?
         LIMIT 1`,
      )
      .bind(streamId, partitionKey, offset)
      .first<{ payload_json: string }>();
    return row ? (JSON.parse(row.payload_json) as ContractStreamEvent) : null;
  }

  async listIsolationStates(scopeIds: string[]): Promise<IsolationState[]> {
    if (scopeIds.length === 0) return [];
    const placeholders = scopeIds.map(() => "?").join(",");
    const result = await this.db
      .prepare(
        `SELECT payload_json
         FROM protocol_records
         WHERE object_type = 'isolation_state'
           AND json_extract(payload_json, '$.clearedAt') IS NULL
           AND json_extract(payload_json, '$.scopeId') IN (${placeholders})`,
      )
      .bind(...scopeIds)
      .all<{ payload_json: string }>();
    return result.results.map((row) => JSON.parse(row.payload_json) as IsolationState);
  }

  async consumeGreenlight(consumption: GreenlightConsumption): Promise<"consumed" | "already_consumed"> {
    try {
      await this.db
        .prepare(
          `INSERT INTO greenlight_consumptions
            (greenlight_id, gate_attempt_id, action_contract_id, idempotency_key, consumed_at)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(
          consumption.greenlightId,
          consumption.gateAttemptId,
          consumption.actionContractId,
          consumption.idempotencyKey,
          consumption.consumedAt,
        )
        .run();
      return "consumed";
    } catch {
      return "already_consumed";
    }
  }

  async commitProtocolRecords(commit: ProtocolCommit): Promise<ProtocolCommitResult> {
    try {
      await this.db.batch(this.protocolCommitStatements(commit.records, commit.events, commit.recoveryTerminalClaims));
      return "committed";
    } catch (error) {
      if (isRecoveryTerminalConflict(error)) {
        return "recovery_terminal_conflict";
      }
      if (isStreamConflict(error)) {
        return "stream_conflict";
      }
      throw error;
    }
  }

  async commitReceiverGate(commit: ReceiverGateCommit): Promise<ReceiverGateCommitResult> {
    const statements: D1PreparedStatement[] = [];
    if (commit.consumption) {
      statements.push(this.greenlightConsumptionStatement(commit.consumption));
    }
    statements.push(...this.protocolCommitStatements(commit.records, commit.events));

    try {
      await this.db.batch(statements);
      return "committed";
    } catch (error) {
      if (commit.consumption && (await this.hasGreenlightConsumption(commit.consumption.greenlightId))) {
        return "already_consumed";
      }
      if (isStreamConflict(error)) {
        return "stream_conflict";
      }
      throw error;
    }
  }

  private protocolCommitStatements(
    records: StoredProtocolRecord[],
    events: ContractStreamEvent[],
    recoveryTerminalClaims: RecoveryTerminalClaim[] = [],
  ): D1PreparedStatement[] {
    const statements: D1PreparedStatement[] = [];
    for (const claim of recoveryTerminalClaims) {
      statements.push(this.recoveryTerminalClaimStatement(claim));
    }
    for (const record of records) {
      statements.push(this.recordStatement(record));
    }
    for (const event of events) {
      statements.push(this.streamEventStatement(event));
      statements.push(
        this.recordStatement({
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
    return statements;
  }

  private recordStatement(record: StoredProtocolRecord): D1PreparedStatement {
    return this.db
      .prepare(
        `INSERT OR REPLACE INTO protocol_records
          (object_id, object_type, tenant_id, organization_id, schema_version, canonical_digest, payload_json, created_at, source_event_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        record.objectId,
        record.objectType,
        record.tenantId,
        record.organizationId,
        record.schemaVersion,
        record.canonicalDigest,
        JSON.stringify(record.payload),
        record.createdAt,
        record.sourceEventId,
      );
  }

  private streamEventStatement(event: ContractStreamEvent): D1PreparedStatement {
    return this.db
      .prepare(
        `INSERT INTO stream_events
          (stream_event_id, tenant_id, organization_id, stream_id, partition_key, "offset", event_type, event_time, event_digest, previous_event_digest, payload_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        event.streamEventId,
        event.tenantId,
        event.organizationId,
        event.streamId,
        event.partitionKey,
        event.offset,
        event.eventType,
        event.eventTime,
        event.eventDigest,
        event.previousEventDigest,
        JSON.stringify(event),
      );
  }

  private greenlightConsumptionStatement(consumption: GreenlightConsumption): D1PreparedStatement {
    return this.db
      .prepare(
        `INSERT INTO greenlight_consumptions
          (greenlight_id, gate_attempt_id, action_contract_id, idempotency_key, consumed_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(
        consumption.greenlightId,
        consumption.gateAttemptId,
        consumption.actionContractId,
        consumption.idempotencyKey,
        consumption.consumedAt,
      );
  }

  private recoveryTerminalClaimStatement(claim: RecoveryTerminalClaim): D1PreparedStatement {
    return this.db
      .prepare(
        `INSERT INTO recovery_terminal_claims
          (recovery_recommendation_id, status_transition_id, next_status, claimed_at)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(
        claim.recoveryRecommendationId,
        claim.statusTransitionId,
        claim.nextStatus,
        claim.claimedAt,
      );
  }

  private async hasGreenlightConsumption(greenlightId: string): Promise<boolean> {
    const row = await this.db
      .prepare("SELECT greenlight_id FROM greenlight_consumptions WHERE greenlight_id = ?")
      .bind(greenlightId)
      .first<{ greenlight_id: string }>();
    return row !== null;
  }
}

type RecordRow = {
  object_id: string;
  object_type: string;
  tenant_id: string;
  organization_id: string;
  schema_version: string;
  canonical_digest: string;
  payload_json: string;
  created_at: string;
  source_event_id: string | null;
};

function isStreamConflict(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("stream_events") &&
    (message.includes("UNIQUE") || message.includes("unique") || message.includes("constraint"))
  );
}

function isRecoveryTerminalConflict(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("recovery_terminal_claims") &&
    (message.includes("UNIQUE") || message.includes("unique") || message.includes("constraint"))
  );
}
