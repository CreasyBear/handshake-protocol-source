-- Handshake v0.2 protocol records.
-- D1 is the durable reconstruction source. KV may cache envelope/isolation
-- snapshots, but every consequential state transition must land here.

CREATE TABLE IF NOT EXISTS protocol_records (
  object_id TEXT PRIMARY KEY,
  object_type TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  canonical_digest TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  source_event_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_protocol_records_type
  ON protocol_records (tenant_id, organization_id, object_type, created_at);

CREATE TABLE IF NOT EXISTS greenlight_consumptions (
  greenlight_id TEXT PRIMARY KEY,
  gate_attempt_id TEXT NOT NULL,
  action_contract_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  consumed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_greenlight_consumptions_contract
  ON greenlight_consumptions (action_contract_id, consumed_at);

CREATE TABLE IF NOT EXISTS recovery_terminal_claims (
  recovery_recommendation_id TEXT PRIMARY KEY,
  status_transition_id TEXT NOT NULL,
  next_status TEXT NOT NULL,
  claimed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recovery_terminal_claims_status
  ON recovery_terminal_claims (next_status, claimed_at);

CREATE TABLE IF NOT EXISTS stream_events (
  stream_event_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  stream_id TEXT NOT NULL,
  partition_key TEXT NOT NULL,
  "offset" INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  event_time TEXT NOT NULL,
  event_digest TEXT NOT NULL,
  previous_event_digest TEXT,
  payload_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stream_events_partition
  ON stream_events (stream_id, partition_key, "offset");

CREATE UNIQUE INDEX IF NOT EXISTS idx_stream_events_partition_offset
  ON stream_events (stream_id, partition_key, "offset");
