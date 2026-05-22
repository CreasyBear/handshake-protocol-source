import { digestCanonical } from "../../foundation/canonical";
import { HandshakeProtocolError } from "../../foundation/errors";
import { createId, nowIso } from "../../foundation/ids";
import type { ActionContract } from "../action-contract";
import type { EventDescriptor } from "../../events/chains";
import type { GatewayCheckAttempt } from "../gateway-gate";
import type { Greenlight } from "../policy-greenlight";
import type { ProtocolRecorder } from "../../events/records";
import type { ProtocolRecord } from "../object-registry";
import type { ProtocolStore, StoredProtocolRecord } from "../../store/port";
import {
  RecordCredentialResolutionEvidenceInputSchema,
  RegisterGatewayCredentialRefInputSchema,
  type RecordCredentialResolutionEvidenceInput,
  type RegisterGatewayCredentialRefInput,
} from "./types";
import { credentialCustodyCanSatisfyGatewayChecked } from "./custody-posture";
import {
  CredentialResolutionEvidenceSchema,
  GatewayCredentialRefSchema,
  PROTOCOL_VERSION,
  type CredentialResolutionEvidence,
  type GatewayCredentialBinding,
  type GatewayCredentialRef,
  type JsonValue,
} from "./types";

type ParsedRegisterGatewayCredentialRefInput = ReturnType<typeof RegisterGatewayCredentialRefInputSchema.parse>;
type ParsedRecordCredentialResolutionEvidenceInput = ReturnType<
  typeof RecordCredentialResolutionEvidenceInputSchema.parse
>;

export type GatewayCredentialBindingEvaluation = {
  records: StoredProtocolRecord<GatewayCredentialRef>[];
  policyInput: CredentialBindingPolicyInput[];
} & (
  | { ok: true }
  | {
      ok: false;
      reasonCode: string;
      reason: string;
    }
);

export type CredentialBindingPolicyInput = {
  credentialUseName: string;
  gatewayCredentialRefId: string;
  gatewayCredentialRefDigest: string;
  providerRegistryRef: string;
  providerRegistryDigest: string | null;
  custodyStatus: GatewayCredentialRef["custodyStatus"] | null;
  requiredCredentialCustodyStatus: GatewayCredentialBinding["requiredCredentialCustodyStatus"];
  freshness: "fresh" | "stale" | "missing" | "not_expiring";
};

export async function registerGatewayCredentialRef(
  recorder: ProtocolRecorder,
  inputValue: RegisterGatewayCredentialRefInput,
): Promise<GatewayCredentialRef> {
  const input = RegisterGatewayCredentialRefInputSchema.parse(inputValue);
  const record = await buildGatewayCredentialRef(input);
  await recorder.commitRecordsWithEvents(gatewayCredentialRefRecords(record), gatewayCredentialRefEvents(record));
  return record;
}

export async function recordCredentialResolutionEvidence(
  recorder: ProtocolRecorder,
  inputValue: RecordCredentialResolutionEvidenceInput,
): Promise<CredentialResolutionEvidence> {
  const input = RecordCredentialResolutionEvidenceInputSchema.parse(inputValue);
  const context = await loadResolutionEvidenceContext(recorder, input);
  assertResolutionEvidenceContext(context);
  const evidence = await buildCredentialResolutionEvidence(context);
  await recorder.commitRecordsWithEvents(credentialResolutionEvidenceRecords(evidence), [
    credentialResolutionEvidenceEvent(evidence),
  ]);
  return evidence;
}

export async function evaluateGatewayCredentialBindings(
  store: ProtocolStore,
  contract: ActionContract,
  now: string,
): Promise<GatewayCredentialBindingEvaluation> {
  const records: StoredProtocolRecord<GatewayCredentialRef>[] = [];
  const policyInput: CredentialBindingPolicyInput[] = [];
  for (const binding of contract.gatewayCredentialRefs) {
    const record = await store.getRecord<GatewayCredentialRef>(
      "gateway_credential_ref",
      binding.gatewayCredentialRefId,
    );
    const ref = record?.payload ?? null;
    if (record) records.push(record);
    policyInput.push(credentialBindingPolicyInput(binding, ref, now));
    const failure = evaluateGatewayCredentialBinding(contract, binding, ref, now);
    if (failure) return { ok: false, records, policyInput, ...failure };
  }
  return { ok: true, records, policyInput };
}

function evaluateGatewayCredentialBinding(
  contract: ActionContract,
  binding: GatewayCredentialBinding,
  ref: GatewayCredentialRef | null,
  now: string,
): { reasonCode: string; reason: string } | null {
  if (!ref) {
    return {
      reasonCode: "gateway_credential_ref_missing",
      reason: "Action contract references a gateway credential ref that is not stored.",
    };
  }
  if (ref.gatewayCredentialRefDigest !== binding.gatewayCredentialRefDigest) {
    return {
      reasonCode: "gateway_credential_ref_digest_mismatch",
      reason: "Stored gateway credential ref digest does not match the contract binding.",
    };
  }
  if (ref.tenantId !== contract.tenantId || ref.organizationId !== contract.organizationId) {
    return {
      reasonCode: "gateway_credential_ref_scope_mismatch",
      reason: "Gateway credential ref tenant or organization does not match the action contract.",
    };
  }
  if (
    ref.gatewayId !== contract.gatewayId ||
    ref.gatewayRegistryEntryId !== contract.gatewayRegistryEntryId ||
    ref.protectedSurfaceKind !== contract.protectedSurfaceKind ||
    !ref.actionClasses.includes(contract.actionClass) ||
    (!ref.resourceRefs.includes("*") && !ref.resourceRefs.includes(contract.resourceRef)) ||
    (ref.principalId !== null && ref.principalId !== contract.principalId)
  ) {
    return {
      reasonCode: "gateway_credential_ref_scope_mismatch",
      reason: "Gateway credential ref does not bind to the same gateway, action class, principal, or resource.",
    };
  }
  if (ref.providerRegistryRef !== binding.providerRegistryRef) {
    return {
      reasonCode: "gateway_credential_ref_provider_drift",
      reason: "Gateway credential ref provider registry ref drifted from the contract binding.",
    };
  }
  if (
    binding.providerRegistryDigest !== null &&
    ref.providerRegistryDigest !== null &&
    binding.providerRegistryDigest !== ref.providerRegistryDigest
  ) {
    return {
      reasonCode: "gateway_credential_ref_provider_drift",
      reason: "Gateway credential ref provider registry digest drifted from the contract binding.",
    };
  }
  if (ref.expiresAt !== null && Date.parse(ref.expiresAt) <= Date.parse(now)) {
    return {
      reasonCode: "gateway_credential_ref_stale",
      reason: "Gateway credential ref is stale.",
    };
  }
  if (
    ref.custodyStatus !== binding.requiredCredentialCustodyStatus ||
    !credentialCustodyCanSatisfyGatewayChecked(ref.custodyStatus)
  ) {
    return {
      reasonCode: "gateway_credential_ref_unsafe_custody",
      reason: "Gateway credential ref custody posture cannot satisfy gateway-side mutation custody.",
    };
  }
  return null;
}

function credentialBindingPolicyInput(
  binding: GatewayCredentialBinding,
  ref: GatewayCredentialRef | null,
  now: string,
): CredentialBindingPolicyInput {
  return {
    credentialUseName: binding.credentialUseName,
    gatewayCredentialRefId: binding.gatewayCredentialRefId,
    gatewayCredentialRefDigest: binding.gatewayCredentialRefDigest,
    providerRegistryRef: binding.providerRegistryRef,
    providerRegistryDigest: binding.providerRegistryDigest,
    custodyStatus: ref?.custodyStatus ?? null,
    requiredCredentialCustodyStatus: binding.requiredCredentialCustodyStatus,
    freshness: credentialRefFreshness(ref, now),
  };
}

function credentialRefFreshness(
  ref: GatewayCredentialRef | null,
  now: string,
): CredentialBindingPolicyInput["freshness"] {
  if (!ref) return "missing";
  if (ref.expiresAt === null) return "not_expiring";
  return Date.parse(ref.expiresAt) > Date.parse(now) ? "fresh" : "stale";
}

async function buildGatewayCredentialRef(
  input: ParsedRegisterGatewayCredentialRefInput,
): Promise<GatewayCredentialRef> {
  const createdAt = nowIso();
  const issuedAt = input.issuedAt ?? createdAt;
  const gatewayCredentialRefId = input.gatewayCredentialRefId ?? createId("gcr");
  const gatewayCredentialRefDigest = await digestCanonical(
    gatewayCredentialRefDigestMaterial(input, gatewayCredentialRefId, issuedAt),
  );
  return GatewayCredentialRefSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    createdAt,
    gatewayCredentialRefId,
    gatewayCredentialRefDigest,
    principalId: input.principalId,
    gatewayId: input.gatewayId,
    gatewayRegistryEntryId: input.gatewayRegistryEntryId,
    protectedSurfaceKind: input.protectedSurfaceKind,
    actionClasses: input.actionClasses,
    resourceRefs: input.resourceRefs,
    resourceNamespaceRef: input.resourceNamespaceRef,
    credentialKind: input.credentialKind,
    custodyStatus: input.custodyStatus,
    providerClass: input.providerClass,
    providerRegistryRef: input.providerRegistryRef,
    providerRegistryDigest: input.providerRegistryDigest,
    resolverRef: input.resolverRef,
    resolverVersion: input.resolverVersion,
    evidenceExpectationRefs: input.evidenceExpectationRefs,
    redactionProfileRef: "gateway-credential-ref:v0.2-redacted",
    secretMaterialIncluded: false,
    issuedAt,
    expiresAt: input.expiresAt,
  });
}

function gatewayCredentialRefDigestMaterial(
  input: ParsedRegisterGatewayCredentialRefInput,
  gatewayCredentialRefId: string,
  issuedAt: string,
): JsonValue {
  return {
    gatewayCredentialRefId,
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    principalId: input.principalId,
    gatewayId: input.gatewayId,
    gatewayRegistryEntryId: input.gatewayRegistryEntryId,
    protectedSurfaceKind: input.protectedSurfaceKind,
    actionClasses: input.actionClasses,
    resourceRefs: input.resourceRefs,
    resourceNamespaceRef: input.resourceNamespaceRef,
    credentialKind: input.credentialKind,
    custodyStatus: input.custodyStatus,
    providerClass: input.providerClass,
    providerRegistryRef: input.providerRegistryRef,
    providerRegistryDigest: input.providerRegistryDigest,
    resolverRef: input.resolverRef,
    resolverVersion: input.resolverVersion,
    evidenceExpectationRefs: input.evidenceExpectationRefs,
    issuedAt,
    expiresAt: input.expiresAt,
  };
}

function gatewayCredentialRefRecords(record: GatewayCredentialRef): ProtocolRecord[] {
  return [{ objectType: "gateway_credential_ref", payload: record }];
}

function gatewayCredentialRefEvents(record: GatewayCredentialRef): EventDescriptor[] {
  return [
    {
      source: record,
      eventType: "gateway_credential_ref_registered",
      objectRefs: [record.gatewayCredentialRefId, record.gatewayCredentialRefDigest, record.gatewayId],
      payload: {
        gatewayId: record.gatewayId,
        providerRegistryRef: record.providerRegistryRef,
        custodyStatus: record.custodyStatus,
      },
    },
  ];
}

type ResolutionEvidenceContext = {
  input: ParsedRecordCredentialResolutionEvidenceInput;
  contractRecord: StoredProtocolRecord<ActionContract>;
  greenlightRecord: StoredProtocolRecord<Greenlight>;
  gateAttemptRecord: StoredProtocolRecord<GatewayCheckAttempt>;
  gatewayCredentialRefRecord: StoredProtocolRecord<GatewayCredentialRef>;
  now: string;
};

async function loadResolutionEvidenceContext(
  recorder: ProtocolRecorder,
  input: ParsedRecordCredentialResolutionEvidenceInput,
): Promise<ResolutionEvidenceContext> {
  const [contractRecord, greenlightRecord, gateAttemptRecord, gatewayCredentialRefRecord] = await Promise.all([
    recorder.requiredRecord<ActionContract>("action_contract", input.actionContractId, "contract_missing"),
    recorder.requiredRecord<Greenlight>("greenlight", input.greenlightId, "greenlight_missing"),
    recorder.requiredRecord<GatewayCheckAttempt>(
      "gateway_check_attempt",
      input.gateAttemptId,
      "credential_resolution_before_gateway_check",
    ),
    recorder.requiredRecord<GatewayCredentialRef>(
      "gateway_credential_ref",
      input.gatewayCredentialRefId,
      "gateway_credential_ref_missing",
    ),
  ]);
  return { input, contractRecord, greenlightRecord, gateAttemptRecord, gatewayCredentialRefRecord, now: nowIso() };
}

function assertResolutionEvidenceContext(context: ResolutionEvidenceContext): void {
  const { input, contractRecord, greenlightRecord, gateAttemptRecord, gatewayCredentialRefRecord, now } = context;
  const contract = contractRecord.payload;
  const greenlight = greenlightRecord.payload;
  const gate = gateAttemptRecord.payload;
  const credentialRef = gatewayCredentialRefRecord.payload;
  if (
    greenlight.actionContractId !== contract.actionContractId ||
    gate.actionContractId !== contract.actionContractId ||
    gate.greenlightId !== greenlight.greenlightId
  ) {
    throw new HandshakeProtocolError(
      "credential_resolution_ref_mismatch",
      "Credential resolution evidence must bind to the same contract, greenlight, and gateway check.",
      409,
    );
  }
  if (gate.gateDecision !== "passed") {
    throw new HandshakeProtocolError(
      "credential_resolution_gate_not_passed",
      "Credential resolution evidence can only be recorded after a passed gateway check.",
      409,
    );
  }
  if (credentialRef.gatewayCredentialRefDigest !== input.gatewayCredentialRefDigest) {
    throw new HandshakeProtocolError(
      "gateway_credential_ref_digest_mismatch",
      "Credential resolution evidence saw a gateway credential ref digest that does not match the durable ref.",
      409,
    );
  }
  const binding = contract.gatewayCredentialRefs.find(
    (candidate) => candidate.gatewayCredentialRefId === credentialRef.gatewayCredentialRefId,
  );
  if (!binding || binding.gatewayCredentialRefDigest !== credentialRef.gatewayCredentialRefDigest) {
    throw new HandshakeProtocolError(
      "credential_resolution_ref_mismatch",
      "Credential resolution evidence must reference a credential ref bound into the exact action contract.",
      409,
    );
  }
  const failure = evaluateGatewayCredentialBinding(contract, binding, credentialRef, now);
  if (failure) throw new HandshakeProtocolError(failure.reasonCode, failure.reason, 409);
}

async function buildCredentialResolutionEvidence(
  context: ResolutionEvidenceContext,
): Promise<CredentialResolutionEvidence> {
  const { input, contractRecord, gateAttemptRecord, gatewayCredentialRefRecord, now } = context;
  const contract = contractRecord.payload;
  const gate = gateAttemptRecord.payload;
  const credentialRef = gatewayCredentialRefRecord.payload;
  const recordedAt = input.recordedAt ?? now;
  const credentialResolutionEvidenceId = createId("cre");
  const evidenceSeed = {
    schemaVersion: PROTOCOL_VERSION,
    tenantId: contract.tenantId,
    organizationId: contract.organizationId,
    createdAt: now,
    credentialResolutionEvidenceId,
    gatewayCredentialRefId: credentialRef.gatewayCredentialRefId,
    gatewayCredentialRefDigest: credentialRef.gatewayCredentialRefDigest,
    actionContractId: contract.actionContractId,
    greenlightId: input.greenlightId,
    gateAttemptId: gate.gateAttemptId,
    mutationAttemptId: gate.mutationAttemptId,
    gatewayId: contract.gatewayId,
    providerClass: credentialRef.providerClass,
    providerRegistryRef: credentialRef.providerRegistryRef,
    providerRegistryDigest: credentialRef.providerRegistryDigest,
    resolverRef: credentialRef.resolverRef,
    resolverVersion: credentialRef.resolverVersion,
    requestDigest: input.requestDigest,
    resultClass: input.resultClass,
    resultReasonCode: input.resultReasonCode,
    redactionStatus: input.redactionStatus,
    providerRequestRef: input.providerRequestRef,
    providerOperationRef: input.providerOperationRef,
    proofGapId: input.proofGapId,
    refusalId: input.refusalId,
    evidenceRefs: input.evidenceRefs,
    redactionProfileRef: "credential-resolution-evidence:v0.2-redacted" as const,
    credentialMaterialIncluded: false as const,
    recordedAt,
    evidenceDigest: null,
  };
  const evidenceDigest = await digestCanonical(evidenceSeed);
  return CredentialResolutionEvidenceSchema.parse({ ...evidenceSeed, evidenceDigest });
}

function credentialResolutionEvidenceRecords(record: CredentialResolutionEvidence): ProtocolRecord[] {
  return [{ objectType: "credential_resolution_evidence", payload: record }];
}

function credentialResolutionEvidenceEvent(record: CredentialResolutionEvidence): EventDescriptor {
  return {
    source: record,
    eventType: "credential_resolution_recorded",
    objectRefs: [
      record.credentialResolutionEvidenceId,
      record.gatewayCredentialRefId,
      record.actionContractId,
      record.gateAttemptId,
    ],
    payload: {
      gatewayCredentialRefDigest: record.gatewayCredentialRefDigest,
      resultClass: record.resultClass,
      resultReasonCode: record.resultReasonCode,
      redactionStatus: record.redactionStatus,
    },
  };
}
