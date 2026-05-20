import { digestCanonical } from "../../foundation/canonical";
import { createId } from "../../foundation/ids";
import type { ActionContract } from "../action-contract";
import type { GatewayCheckAttempt, MutationAttempt } from "../gateway-gate";
import type { SurfaceOperationReconciliation } from "../operation-lifecycle";
import type { Greenlight, PolicyDecision } from "../policy-greenlight";
import { protocolObjectRef } from "../refusal";
import {
  IdempotencyLedgerEntrySchema,
  PROTOCOL_VERSION,
  type IdempotencyLedgerEntry,
  type IdempotencyLedgerState,
  type JsonValue,
} from "./types";

export type IdempotencyLedgerKey = {
  tenantId: string;
  organizationId: string;
  gatewayId: string;
  protectedSurfaceKind: string;
  actionClass: string;
  resourceRef: string;
  idempotencyKey: string;
};

export function idempotencyLedgerKey(contract: ActionContract): IdempotencyLedgerKey {
  return {
    tenantId: contract.tenantId,
    organizationId: contract.organizationId,
    gatewayId: contract.gatewayId,
    protectedSurfaceKind: contract.protectedSurfaceKind,
    actionClass: contract.actionClass,
    resourceRef: contract.resourceRef,
    idempotencyKey: contract.idempotencyKey,
  };
}

export function idempotencyLedgerKeyForEntry(entry: IdempotencyLedgerEntry): IdempotencyLedgerKey {
  return {
    tenantId: entry.tenantId,
    organizationId: entry.organizationId,
    gatewayId: entry.gatewayId,
    protectedSurfaceKind: entry.protectedSurfaceKind,
    actionClass: entry.actionClass,
    resourceRef: entry.resourceRef,
    idempotencyKey: entry.idempotencyKey,
  };
}

export function idempotencyLedgerKeyDigest(key: IdempotencyLedgerKey): Promise<`sha256:${string}`> {
  return digestCanonical(key);
}

export async function buildIdempotencyLedgerReservation(input: {
  contract: ActionContract;
  policyDecision: PolicyDecision;
  greenlight: Greenlight;
  now: string;
}): Promise<IdempotencyLedgerEntry> {
  const { contract, policyDecision, greenlight, now } = input;
  return buildIdempotencyLedgerEntry({
    tenantId: contract.tenantId,
    organizationId: contract.organizationId,
    createdAt: now,
    idempotencyLedgerEntryId: createId("idl"),
    ledgerKeyDigest: await idempotencyLedgerKeyDigest(idempotencyLedgerKey(contract)),
    gatewayId: contract.gatewayId,
    protectedSurfaceKind: contract.protectedSurfaceKind,
    actionClass: contract.actionClass,
    resourceRef: contract.resourceRef,
    idempotencyKey: contract.idempotencyKey,
    paramsDigest: contract.paramsDigest,
    actionContractId: contract.actionContractId,
    policyDecisionId: policyDecision.policyDecisionId,
    greenlightId: greenlight.greenlightId,
    gateAttemptId: null,
    mutationAttemptId: null,
    receiptId: null,
    ledgerState: "authority_reserved",
    reasonCode: "policy_passed",
    evidenceRefs: [
      protocolObjectRef("action_contract", contract.actionContractId),
      protocolObjectRef("policy_decision", policyDecision.policyDecisionId),
      protocolObjectRef("greenlight", greenlight.greenlightId),
    ],
    firstReservedAt: now,
    updatedAt: now,
  });
}

export async function buildIdempotencyLedgerMutationStarted(input: {
  current: IdempotencyLedgerEntry;
  gateAttempt: GatewayCheckAttempt;
  mutationAttempt: MutationAttempt;
  receiptId: string;
  now: string;
}): Promise<IdempotencyLedgerEntry> {
  return updateIdempotencyLedgerEntry(input.current, {
    gateAttemptId: input.gateAttempt.gateAttemptId,
    mutationAttemptId: input.mutationAttempt.mutationAttemptId,
    receiptId: input.receiptId,
    ledgerState: "mutation_started",
    reasonCode: "gate_passed",
    evidenceRefs: [
      ...input.current.evidenceRefs,
      protocolObjectRef("gateway_check_attempt", input.gateAttempt.gateAttemptId),
      protocolObjectRef("mutation_attempt", input.mutationAttempt.mutationAttemptId),
      protocolObjectRef("receipt", input.receiptId),
    ],
    updatedAt: input.now,
  });
}

export async function buildIdempotencyLedgerTerminal(input: {
  current: IdempotencyLedgerEntry;
  reconciliation: SurfaceOperationReconciliation;
  now: string;
}): Promise<IdempotencyLedgerEntry> {
  return updateIdempotencyLedgerEntry(input.current, {
    ledgerState: ledgerStateForReconciliation(input.reconciliation),
    reasonCode: input.reconciliation.observedDownstreamStatus,
    evidenceRefs: [
      ...input.current.evidenceRefs,
      protocolObjectRef("surface_operation_reconciliation", input.reconciliation.reconciliationId),
    ],
    updatedAt: input.now,
  });
}

export function idempotencyConflictDecisionValue(
  contract: ActionContract,
  existing: IdempotencyLedgerEntry,
): { decision: "refuse"; reasonCode: string; reason: string; matchedRuleIds: string[] } {
  if (existing.paramsDigest !== contract.paramsDigest) {
    return {
      decision: "refuse",
      reasonCode: "idempotency_key_params_mismatch",
      reason:
        "Idempotency key is already bound to a different parameter digest for this protected surface; fresh authority is refused.",
      matchedRuleIds: ["idempotency_ledger_params_digest"],
    };
  }
  return {
    decision: "refuse",
    reasonCode: "idempotency_duplicate_authority",
    reason:
      "Idempotency key is already bound to this protected surface and parameter digest; fresh authority is refused.",
    matchedRuleIds: ["idempotency_ledger_duplicate_authority"],
  };
}

export function idempotencyLedgerIndexEntry(entry: IdempotencyLedgerEntry) {
  return {
    ledgerKeyDigest: entry.ledgerKeyDigest,
    idempotencyLedgerEntryId: entry.idempotencyLedgerEntryId,
    tenantId: entry.tenantId,
    organizationId: entry.organizationId,
    paramsDigest: entry.paramsDigest,
    actionContractId: entry.actionContractId,
    policyDecisionId: entry.policyDecisionId,
    greenlightId: entry.greenlightId,
    ledgerState: entry.ledgerState,
    updatedAt: entry.updatedAt,
  };
}

async function updateIdempotencyLedgerEntry(
  current: IdempotencyLedgerEntry,
  updates: {
    gateAttemptId?: string | null;
    mutationAttemptId?: string | null;
    receiptId?: string | null;
    ledgerState: IdempotencyLedgerState;
    reasonCode: string;
    evidenceRefs: string[];
    updatedAt: string;
  },
): Promise<IdempotencyLedgerEntry> {
  return buildIdempotencyLedgerEntry({
    ...current,
    idempotencyLedgerEntryId: createId("idl"),
    createdAt: updates.updatedAt,
    gateAttemptId: updates.gateAttemptId ?? current.gateAttemptId,
    mutationAttemptId: updates.mutationAttemptId ?? current.mutationAttemptId,
    receiptId: updates.receiptId ?? current.receiptId,
    ledgerState: updates.ledgerState,
    reasonCode: updates.reasonCode,
    evidenceRefs: [...new Set(updates.evidenceRefs)],
    updatedAt: updates.updatedAt,
  });
}

async function buildIdempotencyLedgerEntry(
  entry: Omit<IdempotencyLedgerEntry, "schemaVersion" | "ledgerDigest">,
): Promise<IdempotencyLedgerEntry> {
  const seed = {
    schemaVersion: PROTOCOL_VERSION,
    ...entry,
    ledgerDigest: null,
  } satisfies JsonValue;
  const ledgerDigest = await digestCanonical(seed);
  return IdempotencyLedgerEntrySchema.parse({ ...seed, ledgerDigest });
}

function ledgerStateForReconciliation(reconciliation: SurfaceOperationReconciliation): IdempotencyLedgerState {
  if (reconciliation.observedDownstreamStatus === "succeeded") return "terminal_succeeded";
  if (reconciliation.observedDownstreamStatus === "failed") return "terminal_failed";
  if (reconciliation.observedDownstreamStatus === "refused") return "terminal_refused";
  if (reconciliation.observedDownstreamStatus === "unknown") return "terminal_unknown";
  return "mutation_started";
}
