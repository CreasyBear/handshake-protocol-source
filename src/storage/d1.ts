import type {
  ContractStreamEvent,
  GreenlightConsumption,
  IsolationState,
  ProtocolCommit,
  ProtocolCommitResult,
  ProtocolStore,
  ProtocolObjectType,
  ProtectedPathPosture,
  ProtectedSurfaceOperationClaim,
  Receipt,
  GatewayCheckCommit,
  GatewayCheckCommitResult,
  StoredProtocolRecord,
  StreamTail,
} from "../protocol/store-port";
import { D1ProtocolStatements } from "./d1-statements";

export class D1ProtocolStore implements ProtocolStore {
  private readonly statements: D1ProtocolStatements;

  constructor(private readonly db: D1Database) {
    this.statements = new D1ProtocolStatements(db);
  }

  async putRecord(record: StoredProtocolRecord): Promise<void> {
    await this.statements.recordStatement(record).run();
  }

  async putRecordIfAbsentOrSame(record: StoredProtocolRecord): Promise<"inserted" | "unchanged" | "conflict"> {
    await this.statements.recordIfAbsentStatement(record).run();

    const existing = await this.getRecord(record.objectType, record.objectId);
    if (!existing) return "conflict";
    if (existing.canonicalDigest === record.canonicalDigest) return "unchanged";
    return "conflict";
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

  async getCurrentProtectedPathPosture(postureScopeKey: string): Promise<StoredProtocolRecord<ProtectedPathPosture> | null> {
    const row = await this.db
      .prepare(
        `SELECT protected_path_posture_id
         FROM protected_path_posture_current
         WHERE posture_scope_key = ?
         LIMIT 1`,
      )
      .bind(postureScopeKey)
      .first<{ protected_path_posture_id: string }>();
    if (!row) return null;
    return this.getRecord<ProtectedPathPosture>("protected_path_posture", row.protected_path_posture_id);
  }

  async getCurrentProtectedSurfaceOperationClaim(
    claimKeyDigest: string,
  ): Promise<StoredProtocolRecord<ProtectedSurfaceOperationClaim> | null> {
    const row = await this.db
      .prepare(
        `SELECT protected_surface_operation_claim_id
         FROM protected_surface_operation_claim_current
         WHERE claim_key_digest = ?
         LIMIT 1`,
      )
      .bind(claimKeyDigest)
      .first<{ protected_surface_operation_claim_id: string }>();
    if (!row) return null;
    return this.getRecord<ProtectedSurfaceOperationClaim>(
      "protected_surface_operation_claim",
      row.protected_surface_operation_claim_id,
    );
  }

  async getReceiptByMutationAttemptId(mutationAttemptId: string): Promise<StoredProtocolRecord<Receipt> | null> {
    const row = await this.db
      .prepare(
        `SELECT receipt_id
         FROM receipt_by_mutation_attempt
         WHERE mutation_attempt_id = ?
         LIMIT 1`,
      )
      .bind(mutationAttemptId)
      .first<{ receipt_id: string }>();
    if (!row) return null;
    return this.getRecord<Receipt>("receipt", row.receipt_id);
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
      await this.statements.greenlightConsumptionStatement(consumption).run();
      return "consumed";
    } catch {
      return "already_consumed";
    }
  }

  async commitProtocolRecords(commit: ProtocolCommit): Promise<ProtocolCommitResult> {
    try {
      await this.db.batch(this.statements.protocolCommitStatements(commit.records, commit.events, commit));
      return "committed";
    } catch (error) {
      if (isGreenlightIssuanceConflict(error)) {
        return "greenlight_issuance_conflict";
      }
      if (isRecoveryTerminalConflict(error)) {
        return "recovery_terminal_conflict";
      }
      if (isStreamConflict(error)) {
        return "stream_conflict";
      }
      throw error;
    }
  }

  async commitGatewayCheck(commit: GatewayCheckCommit): Promise<GatewayCheckCommitResult> {
    const statements: D1PreparedStatement[] = [];
    if (commit.consumption) {
      statements.push(this.statements.greenlightConsumptionStatement(commit.consumption));
    }
    for (const entry of commit.protectedSurfaceOperationClaimIndexEntries ?? []) {
      statements.push(this.statements.protectedSurfaceOperationClaimIndexStatement(entry, "insert"));
    }
    for (const entry of commit.receiptMutationAttemptIndexEntries ?? []) {
      statements.push(this.statements.receiptMutationAttemptIndexStatement(entry));
    }
    statements.push(...this.statements.protocolCommitStatements(commit.records, commit.events, {}));

    try {
      await this.db.batch(statements);
      return "committed";
    } catch (error) {
      if (commit.consumption && (await this.hasGreenlightConsumption(commit.consumption.greenlightId))) {
        return "already_consumed";
      }
      if (isProtectedSurfaceOperationClaimConflict(error)) {
        return "operation_claim_conflict";
      }
      if (isStreamConflict(error)) {
        return "stream_conflict";
      }
      throw error;
    }
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

function isGreenlightIssuanceConflict(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("greenlight_issuances") &&
    (message.includes("UNIQUE") || message.includes("unique") || message.includes("constraint"))
  );
}

function isProtectedSurfaceOperationClaimConflict(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("protected_surface_operation_claim_current") &&
    (message.includes("UNIQUE") || message.includes("unique") || message.includes("constraint"))
  );
}
