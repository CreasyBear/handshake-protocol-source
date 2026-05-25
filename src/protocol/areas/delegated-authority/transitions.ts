import { digestCanonical } from "../../foundation/canonical";
import { HandshakeProtocolError } from "../../foundation/errors";
import { createId, nowIso } from "../../foundation/ids";
import type { ActionContract } from "../action-contract";
import type { EventDescriptor } from "../../events/chains";
import type { ProtocolRecorder } from "../../events/records";
import { IsolationStateSchema, isolationStateIndexEntry, type IsolationState } from "../isolation-breaker";
import type { ProtocolRecord } from "../object-registry";
import type { ProtocolStore, StoredProtocolRecord } from "../../store/port";
import {
  DelegatedAuthorityStatusTransitionSchema,
  DelegatedAuthorityRefSchema,
  PROTOCOL_VERSION,
  RegisterDelegatedAuthorityRefInputSchema,
  TransitionDelegatedAuthorityStatusInputSchema,
  type DelegatedAuthorityBinding,
  type DelegatedAuthorityRef,
  type DelegatedAuthorityStatusTransition,
  type RegisterDelegatedAuthorityRefInput,
  type TransitionDelegatedAuthorityStatusInput,
  type JsonValue,
} from "./types";

type ParsedRegisterDelegatedAuthorityRefInput = ReturnType<typeof RegisterDelegatedAuthorityRefInputSchema.parse>;
type ParsedTransitionDelegatedAuthorityStatusInput = ReturnType<
  typeof TransitionDelegatedAuthorityStatusInputSchema.parse
>;

export type DelegatedAuthorityStatusChange = {
  statusTransition: DelegatedAuthorityStatusTransition;
  isolationState: IsolationState;
};

export type DelegatedAuthorityBindingEvaluation = {
  records: StoredProtocolRecord<DelegatedAuthorityRef>[];
  policyInput: DelegatedAuthorityBindingPolicyInput[];
} & (
  | { ok: true }
  | {
      ok: false;
      reasonCode: string;
      reason: string;
    }
);

export type DelegatedAuthorityBindingPolicyInput = {
  authorityUseName: string;
  delegatedAuthorityRefId: string;
  delegatedAuthorityRefDigest: string;
  authorityKind: DelegatedAuthorityBinding["authorityKind"];
  grantStatus: DelegatedAuthorityRef["grantStatus"] | null;
  requiredGrantStatus: DelegatedAuthorityBinding["requiredGrantStatus"];
  freshness: "fresh" | "stale" | "missing";
  amountParameterName: string | null;
  maxAtomicAmountPerAction: string | null;
  requestedAtomicAmount: string | null;
};

export async function registerDelegatedAuthorityRef(
  recorder: ProtocolRecorder,
  inputValue: RegisterDelegatedAuthorityRefInput,
): Promise<DelegatedAuthorityRef> {
  const input = RegisterDelegatedAuthorityRefInputSchema.parse(inputValue);
  const record = await buildDelegatedAuthorityRef(input);
  await recorder.commitRecordsWithEvents(delegatedAuthorityRefRecords(record), delegatedAuthorityRefEvents(record));
  return record;
}

export async function transitionDelegatedAuthorityStatus(
  recorder: ProtocolRecorder,
  inputValue: TransitionDelegatedAuthorityStatusInput,
): Promise<DelegatedAuthorityStatusTransition> {
  const input = TransitionDelegatedAuthorityStatusInputSchema.parse(inputValue);
  const record = await recorder.requiredRecord<DelegatedAuthorityRef>(
    "delegated_authority_ref",
    input.delegatedAuthorityRefId,
    "delegated_authority_ref_missing",
  );
  const statusChange = await buildDelegatedAuthorityStatusChange(input, record.payload, nowIso());
  await recorder.commitRecordsWithEvents(
    delegatedAuthorityStatusChangeRecords(statusChange),
    delegatedAuthorityStatusChangeEvents(statusChange),
    { isolationStateIndexEntries: [isolationStateIndexEntry(statusChange.isolationState)] },
  );
  return statusChange.statusTransition;
}

export async function evaluateDelegatedAuthorityBindings(
  store: ProtocolStore,
  contract: ActionContract,
  now: string,
): Promise<DelegatedAuthorityBindingEvaluation> {
  const records: StoredProtocolRecord<DelegatedAuthorityRef>[] = [];
  const policyInput: DelegatedAuthorityBindingPolicyInput[] = [];
  for (const binding of contract.delegatedAuthorityRefs) {
    const record = await store.getRecord<DelegatedAuthorityRef>(
      "delegated_authority_ref",
      binding.delegatedAuthorityRefId,
    );
    const ref = record?.payload ?? null;
    if (record) records.push(record);
    policyInput.push(delegatedAuthorityBindingPolicyInput(binding, ref, contract, now));
    const failure = evaluateDelegatedAuthorityBinding(contract, binding, ref, now);
    if (failure) return { ok: false, records, policyInput, ...failure };
  }
  return { ok: true, records, policyInput };
}

async function buildDelegatedAuthorityStatusChange(
  input: ParsedTransitionDelegatedAuthorityStatusInput,
  ref: DelegatedAuthorityRef,
  now: string,
): Promise<DelegatedAuthorityStatusChange> {
  assertDelegatedAuthorityStatusTransition(ref, input, now);
  const statusTransitionId = createId("dat");
  const isolationStateId = createId("iso");
  const transitionDigest = await digestCanonical({
    delegatedAuthorityStatusTransitionId: statusTransitionId,
    delegatedAuthorityRefId: ref.delegatedAuthorityRefId,
    delegatedAuthorityRefDigest: ref.delegatedAuthorityRefDigest,
    previousGrantStatus: ref.grantStatus,
    nextGrantStatus: input.nextGrantStatus,
    reasonCode: input.reasonCode,
    changedByRef: input.changedByRef,
    changedAt: now,
    isolationStateId,
  } satisfies JsonValue);
  const statusTransition = DelegatedAuthorityStatusTransitionSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: ref.tenantId,
    organizationId: ref.organizationId,
    createdAt: now,
    delegatedAuthorityStatusTransitionId: statusTransitionId,
    delegatedAuthorityRefId: ref.delegatedAuthorityRefId,
    delegatedAuthorityRefDigest: ref.delegatedAuthorityRefDigest,
    previousGrantStatus: ref.grantStatus,
    nextGrantStatus: input.nextGrantStatus,
    reasonCode: input.reasonCode,
    reasonSummary: input.reasonSummary,
    changedByRef: input.changedByRef,
    changedAt: now,
    isolationStateId,
    transitionDigest,
  });
  const isolationState = IsolationStateSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: ref.tenantId,
    organizationId: ref.organizationId,
    createdAt: now,
    isolationStateId,
    scopeType: "authority_ref",
    scopeId: ref.delegatedAuthorityRefId,
    state: "revoked",
    reasonCode: input.reasonCode,
    reasonSummary: input.reasonSummary,
    sourceDecisionRef: statusTransitionId,
    effectiveAt: now,
    expiresAt: input.isolationExpiresAt,
    clearedAt: null,
    observedStreamOffsets: [],
    version: 1,
  });
  return { statusTransition, isolationState };
}

function assertDelegatedAuthorityStatusTransition(
  ref: DelegatedAuthorityRef,
  input: ParsedTransitionDelegatedAuthorityStatusInput,
  now: string,
): void {
  if (ref.grantStatus !== "active") {
    throw new HandshakeProtocolError(
      "delegated_authority_already_terminal",
      "Delegated authority status transitions require an active authority ref.",
      409,
    );
  }
  if (input.nextGrantStatus === "expired" && Date.parse(ref.expiresAt) > Date.parse(now)) {
    throw new HandshakeProtocolError(
      "delegated_authority_not_expired",
      "Delegated authority cannot transition to expired before expiresAt.",
      409,
    );
  }
}

function evaluateDelegatedAuthorityBinding(
  contract: ActionContract,
  binding: DelegatedAuthorityBinding,
  ref: DelegatedAuthorityRef | null,
  now: string,
): { reasonCode: string; reason: string } | null {
  if (!ref) {
    return {
      reasonCode: "delegated_authority_ref_missing",
      reason: "Action contract references a delegated authority ref that is not stored.",
    };
  }
  if (ref.delegatedAuthorityRefDigest !== binding.delegatedAuthorityRefDigest) {
    return {
      reasonCode: "delegated_authority_ref_digest_mismatch",
      reason: "Stored delegated authority ref digest does not match the contract binding.",
    };
  }
  if (ref.tenantId !== contract.tenantId || ref.organizationId !== contract.organizationId) {
    return {
      reasonCode: "delegated_authority_ref_scope_mismatch",
      reason: "Delegated authority ref tenant or organization does not match the action contract.",
    };
  }
  if (
    ref.principalId !== contract.principalId ||
    ref.agentId !== contract.agentId ||
    ref.runtimeAdapterId !== contract.runtimeAdapterId ||
    ref.operatingEnvelopeId !== contract.envelopeId ||
    ref.gatewayId !== contract.gatewayId ||
    ref.gatewayRegistryEntryId !== contract.gatewayRegistryEntryId ||
    ref.protectedSurfaceKind !== contract.protectedSurfaceKind ||
    !ref.actionClasses.includes(contract.actionClass) ||
    (!ref.resourceRefs.includes("*") && !ref.resourceRefs.includes(contract.resourceRef))
  ) {
    return {
      reasonCode: "delegated_authority_ref_scope_mismatch",
      reason:
        "Delegated authority ref does not bind to the same principal, runtime, envelope, gateway, action, or resource.",
    };
  }
  if (
    ref.authorityKind !== binding.authorityKind ||
    ref.policyPackRef !== binding.policyPackRef ||
    ref.policyPackVersion !== binding.policyPackVersion
  ) {
    return {
      reasonCode: "delegated_authority_ref_policy_drift",
      reason: "Delegated authority ref policy material drifted from the contract binding.",
    };
  }
  if (ref.grantStatus !== binding.requiredGrantStatus) {
    return {
      reasonCode: "delegated_authority_ref_not_active",
      reason: "Delegated authority ref is not in the required active grant state.",
    };
  }
  if (Date.parse(ref.expiresAt) <= Date.parse(now)) {
    return {
      reasonCode: "delegated_authority_ref_stale",
      reason: "Delegated authority ref is stale.",
    };
  }
  const amountFailure = evaluateDelegatedAmountBound(contract, ref);
  if (amountFailure) return amountFailure;
  return null;
}

function evaluateDelegatedAmountBound(
  contract: ActionContract,
  ref: DelegatedAuthorityRef,
): { reasonCode: string; reason: string } | null {
  if (ref.authorityKind !== "spend") return null;
  if (ref.amountParameterName === null || ref.maxAtomicAmountPerAction === null) return null;
  const value = contract.parameters[ref.amountParameterName];
  if (typeof value !== "string" || !/^(?:0|[1-9]\d*)$/.test(value)) {
    return {
      reasonCode: "delegated_authority_amount_missing",
      reason: "Spend authority requires an atomic amount parameter bound into the action contract.",
    };
  }
  if (compareAtomic(value, ref.maxAtomicAmountPerAction) > 0) {
    return {
      reasonCode: "delegated_authority_amount_exceeds_action_bound",
      reason: "Action contract amount exceeds the delegated per-action authority bound.",
    };
  }
  return null;
}

function delegatedAuthorityBindingPolicyInput(
  binding: DelegatedAuthorityBinding,
  ref: DelegatedAuthorityRef | null,
  contract: ActionContract,
  now: string,
): DelegatedAuthorityBindingPolicyInput {
  const amountParameterName = ref?.amountParameterName ?? null;
  const requestedAtomicAmount =
    amountParameterName && typeof contract.parameters[amountParameterName] === "string"
      ? contract.parameters[amountParameterName]
      : null;
  return {
    authorityUseName: binding.authorityUseName,
    delegatedAuthorityRefId: binding.delegatedAuthorityRefId,
    delegatedAuthorityRefDigest: binding.delegatedAuthorityRefDigest,
    authorityKind: binding.authorityKind,
    grantStatus: ref?.grantStatus ?? null,
    requiredGrantStatus: binding.requiredGrantStatus,
    freshness: authorityFreshness(ref, now),
    amountParameterName,
    maxAtomicAmountPerAction: ref?.maxAtomicAmountPerAction ?? null,
    requestedAtomicAmount,
  };
}

function authorityFreshness(
  ref: DelegatedAuthorityRef | null,
  now: string,
): DelegatedAuthorityBindingPolicyInput["freshness"] {
  if (!ref) return "missing";
  return Date.parse(ref.expiresAt) > Date.parse(now) ? "fresh" : "stale";
}

async function buildDelegatedAuthorityRef(
  input: ParsedRegisterDelegatedAuthorityRefInput,
): Promise<DelegatedAuthorityRef> {
  const createdAt = nowIso();
  const issuedAt = input.issuedAt ?? createdAt;
  const delegatedAuthorityRefId = input.delegatedAuthorityRefId ?? createId("dar");
  const delegatedAuthorityRefDigest = await digestCanonical(
    delegatedAuthorityRefDigestMaterial(input, delegatedAuthorityRefId, issuedAt),
  );
  return DelegatedAuthorityRefSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    createdAt,
    delegatedAuthorityRefId,
    delegatedAuthorityRefDigest,
    principalId: input.principalId,
    agentId: input.agentId,
    runtimeAdapterId: input.runtimeAdapterId,
    operatingEnvelopeId: input.operatingEnvelopeId,
    gatewayId: input.gatewayId,
    gatewayRegistryEntryId: input.gatewayRegistryEntryId,
    protectedSurfaceKind: input.protectedSurfaceKind,
    actionClasses: input.actionClasses,
    resourceRefs: input.resourceRefs,
    authorityKind: input.authorityKind,
    grantStatus: input.grantStatus,
    policyPackRef: input.policyPackRef,
    policyPackVersion: input.policyPackVersion,
    amountParameterName: input.amountParameterName,
    maxAtomicAmountPerAction: input.maxAtomicAmountPerAction,
    evidenceExpectationRefs: input.evidenceExpectationRefs,
    redactionProfileRef: "delegated-authority-ref:v0.2-redacted",
    secretMaterialIncluded: false,
    mutationAuthorityCreated: false,
    greenlightCreated: false,
    issuedAt,
    expiresAt: input.expiresAt,
  });
}

function delegatedAuthorityRefDigestMaterial(
  input: ParsedRegisterDelegatedAuthorityRefInput,
  delegatedAuthorityRefId: string,
  issuedAt: string,
): JsonValue {
  return {
    delegatedAuthorityRefId,
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    principalId: input.principalId,
    agentId: input.agentId,
    runtimeAdapterId: input.runtimeAdapterId,
    operatingEnvelopeId: input.operatingEnvelopeId,
    gatewayId: input.gatewayId,
    gatewayRegistryEntryId: input.gatewayRegistryEntryId,
    protectedSurfaceKind: input.protectedSurfaceKind,
    actionClasses: input.actionClasses,
    resourceRefs: input.resourceRefs,
    authorityKind: input.authorityKind,
    grantStatus: input.grantStatus,
    policyPackRef: input.policyPackRef,
    policyPackVersion: input.policyPackVersion,
    amountParameterName: input.amountParameterName,
    maxAtomicAmountPerAction: input.maxAtomicAmountPerAction,
    evidenceExpectationRefs: input.evidenceExpectationRefs,
    issuedAt,
    expiresAt: input.expiresAt,
  };
}

function delegatedAuthorityRefRecords(record: DelegatedAuthorityRef): ProtocolRecord[] {
  return [{ objectType: "delegated_authority_ref", payload: record }];
}

function delegatedAuthorityRefEvents(record: DelegatedAuthorityRef): EventDescriptor[] {
  return [
    {
      source: record,
      eventType: "delegated_authority_ref_registered",
      objectRefs: [record.delegatedAuthorityRefId, record.delegatedAuthorityRefDigest, record.gatewayId],
      payload: {
        gatewayId: record.gatewayId,
        authorityKind: record.authorityKind,
        grantStatus: record.grantStatus,
        policyPackRef: record.policyPackRef,
      },
    },
  ];
}

function delegatedAuthorityStatusChangeRecords(statusChange: DelegatedAuthorityStatusChange): ProtocolRecord[] {
  return [
    { objectType: "delegated_authority_status_transition", payload: statusChange.statusTransition },
    { objectType: "isolation_state", payload: statusChange.isolationState },
  ];
}

function delegatedAuthorityStatusChangeEvents(statusChange: DelegatedAuthorityStatusChange): EventDescriptor[] {
  return [
    {
      source: statusChange.statusTransition,
      eventType: "delegated_authority_status_changed",
      objectRefs: [
        statusChange.statusTransition.delegatedAuthorityRefId,
        statusChange.statusTransition.delegatedAuthorityStatusTransitionId,
        statusChange.statusTransition.isolationStateId,
      ],
      payload: {
        previousGrantStatus: statusChange.statusTransition.previousGrantStatus,
        nextGrantStatus: statusChange.statusTransition.nextGrantStatus,
        reasonCode: statusChange.statusTransition.reasonCode,
        changedByRef: statusChange.statusTransition.changedByRef,
        transitionDigest: statusChange.statusTransition.transitionDigest,
      },
    },
    {
      source: statusChange.isolationState,
      eventType: "isolation_changed",
      objectRefs: [
        statusChange.isolationState.isolationStateId,
        statusChange.isolationState.scopeType,
        statusChange.isolationState.scopeId,
      ],
      payload: {
        state: statusChange.isolationState.state,
        reasonCode: statusChange.isolationState.reasonCode,
        observedStreamOffsets: statusChange.isolationState.observedStreamOffsets,
      },
    },
  ];
}

function compareAtomic(left: string, right: string): number {
  const leftValue = BigInt(left);
  const rightValue = BigInt(right);
  return leftValue === rightValue ? 0 : leftValue > rightValue ? 1 : -1;
}
