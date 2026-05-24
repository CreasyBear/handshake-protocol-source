import { describe, expect, it } from "bun:test";
import { buildEventChain } from "../../src/protocol/events/chains";
import type { ContractStreamEvent } from "../../src/protocol/events/schemas";
import { nowIso } from "../../src/protocol/foundation/ids";
import type {
  GatewayCheckCommit,
  GreenlightConsumption,
  GreenlightIssuanceClaim,
  IdempotencyLedgerIndexEntry,
  ProtocolCommit,
  ProtocolObjectType,
  ProtocolStore,
  ProtectedSurfaceOperationClaimIndexEntry,
  ReceiptMutationAttemptIndexEntry,
  StoredProtocolRecord,
} from "../../src/protocol/store/port";
import { D1ProtocolStore } from "../../src/storage/d1";
import { InMemoryProtocolStore } from "../../src/storage/memory";
import { createD1HttpHarness } from "../support/d1-http-harness";

type StoreHarness = {
  store: ProtocolStore;
  dispose(): Promise<void>;
};

const storeFactories: Array<{ name: string; create(): Promise<StoreHarness> }> = [
  {
    name: "memory",
    async create() {
      return { store: new InMemoryProtocolStore(), dispose: async () => {} };
    },
  },
  {
    name: "d1",
    async create() {
      const harness = await createD1HttpHarness();
      return { store: new D1ProtocolStore(harness.db), dispose: () => harness.dispose() };
    },
  },
];

for (const factory of storeFactories) {
  describe(`ProtocolStore atomicity contract (${factory.name})`, () => {
    it("does not partially commit protocol records when greenlight issuance conflicts", async () => {
      const { store, dispose } = await factory.create();
      try {
        const claim = greenlightIssuanceClaim("act_atomic_greenlight");
        await expectCommit(store, {
          records: [record("tool_capability", "tool_atomic_greenlight_seed")],
          events: [await event(store, "tool_atomic_greenlight_seed")],
          greenlightIssuanceClaims: [claim],
        });

        const blockedRecord = record("tool_capability", "tool_atomic_greenlight_blocked");
        const result = await store.commitProtocolRecords({
          records: [blockedRecord],
          events: [await event(store, "tool_atomic_greenlight_blocked")],
          greenlightIssuanceClaims: [claim],
        });

        expect(result).toBe("greenlight_issuance_conflict");
        expect(await store.getRecord("tool_capability", blockedRecord.objectId)).toBeNull();
      } finally {
        await dispose();
      }
    });

    it("does not partially commit protocol records when idempotency reservation conflicts", async () => {
      const { store, dispose } = await factory.create();
      try {
        const reservation = idempotencyReservation("ledger_atomic_reservation");
        await expectCommit(store, {
          records: [record("idempotency_ledger_entry", "idle_atomic_reservation_seed")],
          events: [await event(store, "idle_atomic_reservation_seed", "idempotency_ledger_recorded")],
          idempotencyLedgerReservationEntries: [reservation],
        });

        const blockedRecord = record("idempotency_ledger_entry", "idle_atomic_reservation_blocked");
        const result = await store.commitProtocolRecords({
          records: [blockedRecord],
          events: [await event(store, "idle_atomic_reservation_blocked", "idempotency_ledger_recorded")],
          idempotencyLedgerReservationEntries: [reservation],
        });

        expect(result).toBe("idempotency_ledger_conflict");
        expect(await store.getRecord("idempotency_ledger_entry", blockedRecord.objectId)).toBeNull();
      } finally {
        await dispose();
      }
    });

    it("does not partially commit gateway records when greenlight consumption conflicts", async () => {
      const { store, dispose } = await factory.create();
      try {
        const consumption = greenlightConsumption("grn_atomic_consumption");
        await expectGatewayCommit(store, {
          consumption,
          records: [record("gateway_check_attempt", "gca_atomic_consumption_seed")],
          events: [await event(store, "gca_atomic_consumption_seed", "gateway_checked")],
        });

        const blockedRecord = record("mutation_attempt", "mut_atomic_consumption_blocked");
        const result = await store.commitGatewayCheck({
          consumption,
          records: [blockedRecord],
          events: [await event(store, "mut_atomic_consumption_blocked", "mutation_attempted")],
        });

        expect(result).toBe("already_consumed");
        expect(await store.getRecord("mutation_attempt", blockedRecord.objectId)).toBeNull();
      } finally {
        await dispose();
      }
    });

    it("does not partially commit gateway records when operation claims conflict", async () => {
      const { store, dispose } = await factory.create();
      try {
        const claim = operationClaim("claim_atomic_operation");
        await expectGatewayCommit(store, {
          consumption: null,
          records: [record("protected_surface_operation_claim", "pso_atomic_operation_seed")],
          events: [await event(store, "pso_atomic_operation_seed", "protected_surface_operation_claimed")],
          protectedSurfaceOperationClaimIndexEntries: [claim],
        });

        const blockedRecord = record("mutation_attempt", "mut_atomic_operation_blocked");
        const result = await store.commitGatewayCheck({
          consumption: null,
          records: [blockedRecord],
          events: [await event(store, "mut_atomic_operation_blocked", "mutation_attempted")],
          protectedSurfaceOperationClaimIndexEntries: [claim],
        });

        expect(result).toBe("operation_claim_conflict");
        expect(await store.getRecord("mutation_attempt", blockedRecord.objectId)).toBeNull();
      } finally {
        await dispose();
      }
    });

    it("does not partially commit protocol or gateway records when stream offsets conflict", async () => {
      const { store, dispose } = await factory.create();
      try {
        const duplicateProtocolEvent = await event(store, "tool_atomic_stream_seed");
        await expectCommit(store, {
          records: [record("tool_capability", "tool_atomic_stream_seed")],
          events: [duplicateProtocolEvent],
        });

        const blockedProtocolRecord = record("tool_capability", "tool_atomic_stream_blocked");
        const protocolResult = await store.commitProtocolRecords({
          records: [blockedProtocolRecord],
          events: [duplicateProtocolEvent],
        });

        expect(protocolResult).toBe("stream_conflict");
        expect(await store.getRecord("tool_capability", blockedProtocolRecord.objectId)).toBeNull();

        const duplicateGatewayEvent = await event(store, "gca_atomic_stream_seed", "gateway_checked");
        await expectGatewayCommit(store, {
          consumption: null,
          records: [record("gateway_check_attempt", "gca_atomic_stream_seed")],
          events: [duplicateGatewayEvent],
        });

        const blockedGatewayRecord = record("mutation_attempt", "mut_atomic_stream_blocked");
        const gatewayResult = await store.commitGatewayCheck({
          consumption: null,
          records: [blockedGatewayRecord],
          events: [duplicateGatewayEvent],
        });

        expect(gatewayResult).toBe("stream_conflict");
        expect(await store.getRecord("mutation_attempt", blockedGatewayRecord.objectId)).toBeNull();
      } finally {
        await dispose();
      }
    });

    it("does not replace receipt-by-mutation indexes", async () => {
      const { store, dispose } = await factory.create();
      try {
        const receiptIndex = receiptMutationAttemptIndex("mut_atomic_receipt_index");
        await expectGatewayCommit(store, {
          consumption: null,
          records: [record("receipt", "rcp_atomic_receipt_index_seed")],
          events: [await event(store, "rcp_atomic_receipt_index_seed", "receipt_emitted")],
          receiptMutationAttemptIndexEntries: [receiptIndex],
        });

        const blockedRecord = record("receipt", "rcp_atomic_receipt_index_blocked");
        const result = await store.commitGatewayCheck({
          consumption: null,
          records: [blockedRecord],
          events: [await event(store, "rcp_atomic_receipt_index_blocked", "receipt_emitted")],
          receiptMutationAttemptIndexEntries: [{ ...receiptIndex, receiptId: blockedRecord.objectId }],
        });

        expect(result).toBe("receipt_index_conflict");
        expect(await store.getRecord("receipt", blockedRecord.objectId)).toBeNull();
        const current = await store.getReceiptByMutationAttemptId(receiptIndex.mutationAttemptId);
        expect(current?.objectId).toBe(receiptIndex.receiptId);
      } finally {
        await dispose();
      }
    });

    it("lists protocol records by action contract without returning sibling contract evidence", async () => {
      const { store, dispose } = await factory.create();
      try {
        await store.putRecord(
          recordWithPayload("credential_resolution_evidence", "cre_scope_target", {
            credentialResolutionEvidenceId: "cre_scope_target",
            actionContractId: "act_scope_target",
          }),
        );
        await store.putRecord(
          recordWithPayload("credential_resolution_evidence", "cre_scope_sibling", {
            credentialResolutionEvidenceId: "cre_scope_sibling",
            actionContractId: "act_scope_sibling",
          }),
        );
        await store.putRecord(
          recordWithPayload("proof_gap", "pg_scope_target", {
            proofGapId: "pg_scope_target",
            affectedObjectRefs: ["action_contract:act_scope_target"],
          }),
        );
        await store.putRecord(
          recordWithPayload("recovery_recommendation", "rr_scope_target", {
            recoveryRecommendationId: "rr_scope_target",
            sourceActionContractId: "act_scope_target",
          }),
        );

        const credentialEvidence = await store.listRecordsByActionContract(
          "credential_resolution_evidence",
          "act_scope_target",
          { tenantId: "tenant_demo", organizationId: "org_demo" },
        );
        const proofGaps = await store.listRecordsByActionContract("proof_gap", "act_scope_target", {
          tenantId: "tenant_demo",
          organizationId: "org_demo",
        });
        const recovery = await store.listRecordsByActionContract("recovery_recommendation", "act_scope_target", {
          tenantId: "tenant_demo",
          organizationId: "org_demo",
        });

        expect(credentialEvidence.map((entry) => entry.objectId)).toEqual(["cre_scope_target"]);
        expect(proofGaps.map((entry) => entry.objectId)).toEqual(["pg_scope_target"]);
        expect(recovery.map((entry) => entry.objectId)).toEqual(["rr_scope_target"]);
      } finally {
        await dispose();
      }
    });

    it("lists stream events by offset range for batched receipt timelines", async () => {
      const { store, dispose } = await factory.create();
      try {
        const events = await actionPartitionEvents(store, "act_stream_range", 125);
        await expectCommit(store, { records: [], events });

        const firstBatch = await store.listStreamEvents(events[0]?.streamId ?? "", events[0]?.partitionKey ?? "", {
          startOffset: 40,
          endOffset: 89,
          limit: 25,
        });
        const secondBatch = await store.listStreamEvents(events[0]?.streamId ?? "", events[0]?.partitionKey ?? "", {
          startOffset: 65,
          endOffset: 89,
          limit: 25,
        });

        expect(firstBatch.map((event) => event.offset)).toEqual([...Array(25).keys()].map((index) => index + 40));
        expect(secondBatch.map((event) => event.offset)).toEqual([...Array(25).keys()].map((index) => index + 65));
      } finally {
        await dispose();
      }
    });
  });
}

async function expectCommit(store: ProtocolStore, commit: ProtocolCommit): Promise<void> {
  expect(await store.commitProtocolRecords(commit)).toBe("committed");
}

async function expectGatewayCommit(store: ProtocolStore, commit: GatewayCheckCommit): Promise<void> {
  expect(await store.commitGatewayCheck(commit)).toBe("committed");
}

function record(objectType: ProtocolObjectType, objectId: string): StoredProtocolRecord {
  const createdAt = nowIso();
  return {
    objectId,
    objectType,
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    schemaVersion: "0.2.4",
    canonicalDigest: digestFor(objectId),
    payload: {
      schemaVersion: "0.2.4",
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      createdAt,
      objectId,
    },
    createdAt,
    sourceEventId: null,
  };
}

function recordWithPayload(
  objectType: ProtocolObjectType,
  objectId: string,
  payload: Record<string, unknown>,
): StoredProtocolRecord {
  const base = record(objectType, objectId);
  return {
    ...base,
    payload: {
      ...(base.payload as Record<string, unknown>),
      ...payload,
    },
  };
}

async function actionPartitionEvents(
  store: ProtocolStore,
  actionContractId: string,
  count: number,
): Promise<ContractStreamEvent[]> {
  return buildEventChain(
    store,
    [...Array(count).keys()].map((index) => ({
      source: { tenantId: "tenant_demo", organizationId: "org_demo", createdAt: nowIso() },
      eventType: "gateway_checked" as const,
      objectRefs: [actionContractId, `gca_stream_range_${index}`],
      payload: { index },
    })),
  );
}

async function event(
  store: ProtocolStore,
  objectId: string,
  eventType: ContractStreamEvent["eventType"] = "runtime_execution_recorded",
): Promise<ContractStreamEvent> {
  const source = { tenantId: "tenant_demo", organizationId: "org_demo", createdAt: nowIso() };
  const events = await buildEventChain(store, [
    {
      source,
      eventType,
      objectRefs: [objectId],
      payload: { objectId },
    },
  ]);
  const first = events[0];
  if (!first) throw new Error("expected event");
  return first;
}

function greenlightIssuanceClaim(actionContractId: string): GreenlightIssuanceClaim {
  return {
    actionContractId,
    greenlightId: `grn_${actionContractId}`,
    policyDecisionId: `pdc_${actionContractId}`,
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    claimedAt: nowIso(),
  };
}

function idempotencyReservation(ledgerKeyDigestSeed: string): IdempotencyLedgerIndexEntry {
  return {
    ledgerKeyDigest: digestFor(ledgerKeyDigestSeed),
    idempotencyLedgerEntryId: `idle_${ledgerKeyDigestSeed}`,
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    paramsDigest: digestFor(`${ledgerKeyDigestSeed}:params`),
    actionContractId: `act_${ledgerKeyDigestSeed}`,
    policyDecisionId: `pdc_${ledgerKeyDigestSeed}`,
    greenlightId: `grn_${ledgerKeyDigestSeed}`,
    ledgerState: "authority_reserved",
    updatedAt: nowIso(),
  };
}

function greenlightConsumption(greenlightId: string): GreenlightConsumption {
  return {
    greenlightId,
    gateAttemptId: `gca_${greenlightId}`,
    actionContractId: `act_${greenlightId}`,
    idempotencyKey: `idem_${greenlightId}`,
    consumedAt: nowIso(),
  };
}

function operationClaim(claimKeyDigestSeed: string): ProtectedSurfaceOperationClaimIndexEntry {
  return {
    claimKeyDigest: digestFor(claimKeyDigestSeed),
    protectedSurfaceOperationClaimId: `pso_${claimKeyDigestSeed}`,
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    claimState: "active",
    updatedAt: nowIso(),
  };
}

function receiptMutationAttemptIndex(mutationAttemptId: string): ReceiptMutationAttemptIndexEntry {
  return {
    mutationAttemptId,
    receiptId: "rcp_atomic_receipt_index_seed",
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt: nowIso(),
  };
}

function digestFor(seed: string): `sha256:${string}` {
  return `sha256:${seed.padEnd(64, "0").slice(0, 64)}`;
}
