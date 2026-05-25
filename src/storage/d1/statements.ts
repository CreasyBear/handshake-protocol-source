import type {
  ContractStreamEvent,
  GreenlightConsumption,
  GreenlightIssuanceClaim,
  IdempotencyLedgerIndexEntry,
  IsolationStateIndexEntry,
  ProtocolCommit,
  ProtectedPathPostureIndexEntry,
  ProtectedSurfaceOperationClaimIndexEntry,
  ReceiptMutationAttemptIndexEntry,
  RecoveryTerminalClaim,
  StoredProtocolRecord,
} from "../../protocol/store/port";
import { actionContractIdsForRecord } from "../../protocol/store/action-contract-index";

type ProtocolCommitStatementOptions = Pick<
  ProtocolCommit,
  | "recordConflictMode"
  | "greenlightIssuanceClaims"
  | "idempotencyLedgerReservationEntries"
  | "idempotencyLedgerIndexEntries"
  | "recoveryTerminalClaims"
  | "isolationStateIndexEntries"
  | "protectedPathPostureIndexEntries"
  | "protectedSurfaceOperationClaimIndexEntries"
  | "protectedSurfaceOperationClaimIndexReleases"
  | "receiptMutationAttemptIndexEntries"
>;

export class D1ProtocolStatements {
  constructor(private readonly db: D1Database) {}

  protocolCommitStatements(
    records: StoredProtocolRecord[],
    events: ContractStreamEvent[],
    options: ProtocolCommitStatementOptions = {},
  ): D1PreparedStatement[] {
    const statements: D1PreparedStatement[] = [];
    for (const claim of options.greenlightIssuanceClaims ?? []) {
      statements.push(this.greenlightIssuanceClaimStatement(claim));
    }
    for (const entry of options.idempotencyLedgerReservationEntries ?? []) {
      statements.push(this.idempotencyLedgerIndexStatement(entry, "insert"));
    }
    for (const entry of options.idempotencyLedgerIndexEntries ?? []) {
      statements.push(this.idempotencyLedgerIndexStatement(entry, "replace"));
    }
    for (const claim of options.recoveryTerminalClaims ?? []) {
      statements.push(this.recoveryTerminalClaimStatement(claim));
    }
    for (const entry of options.isolationStateIndexEntries ?? []) {
      statements.push(this.isolationStateIndexStatement(entry));
    }
    for (const entry of options.protectedPathPostureIndexEntries ?? []) {
      statements.push(this.protectedPathPostureIndexStatement(entry));
    }
    for (const claimKeyDigest of options.protectedSurfaceOperationClaimIndexReleases ?? []) {
      statements.push(this.protectedSurfaceOperationClaimReleaseStatement(claimKeyDigest));
    }
    for (const entry of options.protectedSurfaceOperationClaimIndexEntries ?? []) {
      statements.push(this.protectedSurfaceOperationClaimIndexStatement(entry, "replace"));
    }
    for (const entry of options.receiptMutationAttemptIndexEntries ?? []) {
      statements.push(this.receiptMutationAttemptIndexStatement(entry));
    }
    for (const record of records) {
      statements.push(...this.recordReplacementStatements(record, options.recordConflictMode ?? "replace"));
    }
    for (const event of events) {
      statements.push(this.streamEventStatement(event));
      statements.push(
        ...this.recordReplacementStatements({
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

  recordReplacementStatements(
    record: StoredProtocolRecord,
    conflictMode: "replace" | "absent_or_same" = "replace",
  ): D1PreparedStatement[] {
    return [
      this.recordStatement(record, conflictMode),
      this.recordActionContractRefDeleteStatement(record),
      ...this.recordActionContractRefStatements(record),
    ];
  }

  recordAbsentStatements(record: StoredProtocolRecord): D1PreparedStatement[] {
    return [this.recordIfAbsentStatement(record), ...this.recordActionContractRefStatements(record)];
  }

  greenlightConsumptionStatement(consumption: GreenlightConsumption): D1PreparedStatement {
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

  protectedSurfaceOperationClaimIndexStatement(
    entry: ProtectedSurfaceOperationClaimIndexEntry,
    mode: "insert" | "replace",
  ): D1PreparedStatement {
    const verb = mode === "insert" ? "INSERT" : "INSERT OR REPLACE";
    return this.db
      .prepare(
        `${verb} INTO protected_surface_operation_claim_current
          (claim_key_digest, protected_surface_operation_claim_id, tenant_id, organization_id, claim_state, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        entry.claimKeyDigest,
        entry.protectedSurfaceOperationClaimId,
        entry.tenantId,
        entry.organizationId,
        entry.claimState,
        entry.updatedAt,
      );
  }

  idempotencyLedgerIndexStatement(entry: IdempotencyLedgerIndexEntry, mode: "insert" | "replace"): D1PreparedStatement {
    const verb = mode === "insert" ? "INSERT" : "INSERT OR REPLACE";
    return this.db
      .prepare(
        `${verb} INTO idempotency_ledger_current
          (ledger_key_digest, idempotency_ledger_entry_id, tenant_id, organization_id, params_digest, action_contract_id, policy_decision_id, greenlight_id, ledger_state, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        entry.ledgerKeyDigest,
        entry.idempotencyLedgerEntryId,
        entry.tenantId,
        entry.organizationId,
        entry.paramsDigest,
        entry.actionContractId,
        entry.policyDecisionId,
        entry.greenlightId,
        entry.ledgerState,
        entry.updatedAt,
      );
  }

  receiptMutationAttemptIndexStatement(entry: ReceiptMutationAttemptIndexEntry): D1PreparedStatement {
    return this.db
      .prepare(
        `INSERT INTO receipt_by_mutation_attempt
          (mutation_attempt_id, receipt_id, tenant_id, organization_id, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(entry.mutationAttemptId, entry.receiptId, entry.tenantId, entry.organizationId, entry.createdAt);
  }

  recordStatement(
    record: StoredProtocolRecord,
    conflictMode: "replace" | "absent_or_same" = "replace",
  ): D1PreparedStatement {
    if (conflictMode === "absent_or_same") return this.recordAbsentOrSameStatement(record);
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

  recordAbsentOrSameStatement(record: StoredProtocolRecord): D1PreparedStatement {
    return this.db
      .prepare(
        `INSERT INTO protocol_records
          (object_id, object_type, tenant_id, organization_id, schema_version, canonical_digest, payload_json, created_at, source_event_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(object_type, object_id) DO UPDATE SET
           tenant_id = excluded.tenant_id,
           organization_id = excluded.organization_id,
           schema_version = excluded.schema_version,
           canonical_digest = CASE
             WHEN protocol_records.canonical_digest = excluded.canonical_digest THEN excluded.canonical_digest
             ELSE NULL
           END,
           payload_json = excluded.payload_json,
           created_at = excluded.created_at,
           source_event_id = excluded.source_event_id`,
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

  recordIfAbsentStatement(record: StoredProtocolRecord): D1PreparedStatement {
    return this.db
      .prepare(
        `INSERT OR IGNORE INTO protocol_records
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

  private recordActionContractRefDeleteStatement(record: StoredProtocolRecord): D1PreparedStatement {
    return this.db
      .prepare(
        `DELETE FROM protocol_record_action_contract_refs
         WHERE object_type = ? AND object_id = ?`,
      )
      .bind(record.objectType, record.objectId);
  }

  private recordActionContractRefStatements(record: StoredProtocolRecord): D1PreparedStatement[] {
    return actionContractIdsForRecord(record).map((actionContractId) =>
      this.db
        .prepare(
          `INSERT OR REPLACE INTO protocol_record_action_contract_refs
            (object_type, object_id, tenant_id, organization_id, action_contract_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          record.objectType,
          record.objectId,
          record.tenantId,
          record.organizationId,
          actionContractId,
          record.createdAt,
        ),
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

  private greenlightIssuanceClaimStatement(claim: GreenlightIssuanceClaim): D1PreparedStatement {
    return this.db
      .prepare(
        `INSERT INTO greenlight_issuances
          (action_contract_id, greenlight_id, policy_decision_id, tenant_id, organization_id, claimed_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        claim.actionContractId,
        claim.greenlightId,
        claim.policyDecisionId,
        claim.tenantId,
        claim.organizationId,
        claim.claimedAt,
      );
  }

  private recoveryTerminalClaimStatement(claim: RecoveryTerminalClaim): D1PreparedStatement {
    return this.db
      .prepare(
        `INSERT INTO recovery_terminal_claims
          (recovery_recommendation_id, status_transition_id, next_status, claimed_at)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(claim.recoveryRecommendationId, claim.statusTransitionId, claim.nextStatus, claim.claimedAt);
  }

  private isolationStateIndexStatement(entry: IsolationStateIndexEntry): D1PreparedStatement {
    return this.db
      .prepare(
        `INSERT OR REPLACE INTO isolation_state_current
          (isolation_scope_key, isolation_state_id, tenant_id, organization_id, scope_type, scope_id, state, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        entry.isolationScopeKey,
        entry.isolationStateId,
        entry.tenantId,
        entry.organizationId,
        entry.scopeType,
        entry.scopeId,
        entry.state,
        entry.updatedAt,
      );
  }

  private protectedPathPostureIndexStatement(entry: ProtectedPathPostureIndexEntry): D1PreparedStatement {
    return this.db
      .prepare(
        `INSERT OR REPLACE INTO protected_path_posture_current
          (posture_scope_key, protected_path_posture_id, tenant_id, organization_id, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(entry.postureScopeKey, entry.protectedPathPostureId, entry.tenantId, entry.organizationId, entry.updatedAt);
  }

  private protectedSurfaceOperationClaimReleaseStatement(claimKeyDigest: string): D1PreparedStatement {
    return this.db
      .prepare("DELETE FROM protected_surface_operation_claim_current WHERE claim_key_digest = ?")
      .bind(claimKeyDigest);
  }
}
