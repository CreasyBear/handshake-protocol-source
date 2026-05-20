import { digestCanonical } from "../../foundation/canonical";
import type { ActionContract } from "../action-contract";
import type { ContractStreamEvent } from "../../events/schemas";
import {
  receiptStreamReferencesForEvents,
  type ActionLifecycleStreamRefs,
  type EventDescriptor,
} from "../../events/chains";
import { createId } from "../../foundation/ids";
import type { GatewayCheckInputSchema } from "./types";
import { isolationSnapshotRef } from "../policy-greenlight";
import { GreenlightSchema, type Greenlight } from "../policy-greenlight";
import type { IsolationState } from "../isolation-breaker";
import type { ProtocolRecord } from "../object-registry";
import type { ProtectedSurfaceOperationClaim } from "../operation-lifecycle";
import { buildProofGap } from "../proof-gap";
import type { ProofGap } from "../proof-gap";
import type { ProtectedPathPosture } from "../protected-path-posture";
import { buildRefusal, protocolObjectRef, type Refusal } from "../refusal";
import {
  deriveDownstreamOutcomeStatus,
  deriveGatewayAdmissionStatus,
  ReceiptSchema,
  type Receipt,
} from "../receipt-export";
import {
  downstreamStatusFor,
  mutationOutcomeFor,
  receiptFinalityFor,
  surfaceOperationRefFor,
  type GatewayPolicyDriftCheck,
} from "./gateway-policy";
import {
  MutationAttemptSchema,
  PROTOCOL_VERSION,
  GatewayCheckAttemptSchema,
  type JsonValue,
  type MutationAttempt,
  type GatewayCheckAttempt,
} from "./types";
import type { StoredProtocolRecord } from "../../store/port";

export type GatewayCheckResult = {
  gateAttempt: GatewayCheckAttempt;
  mutationAttempt: MutationAttempt | null;
  receipt: Receipt;
  proofGap: ProofGap | null;
};

export type GatewayCheckArtifacts = {
  result: GatewayCheckResult;
  refusal: Refusal | null;
};

export type VerifiedGatewayCheck = {
  gatewayCheckStatus: "passed";
  gateAttemptId: string;
  mutationAttemptId: string;
  actionContractId: string;
  greenlightId: string;
  gatewayId: string;
  actionClass: string;
  resourceRef: string;
  idempotencyKey: string;
  surfaceOperationRef: string;
};

export type GatewayCheckArtifactInput = {
  input: ReturnType<typeof GatewayCheckInputSchema.parse>;
  contract: ActionContract;
  greenlight: Greenlight;
  gateAttemptId: string;
  refusal: string | null;
  now: string;
  observedParamsDigest: `sha256:${string}`;
  greenlightDigestSeen: `sha256:${string}`;
  isolationStates: IsolationState[];
  gatewayPolicyDrift: GatewayPolicyDriftCheck;
  protectedPathPosture: StoredProtocolRecord<ProtectedPathPosture> | null;
};

export function verifiedGatewayCheckFromResult(result: GatewayCheckResult): VerifiedGatewayCheck | null {
  if (result.gateAttempt.gateDecision !== "passed" || !result.mutationAttempt?.surfaceOperationRef) return null;
  return {
    gatewayCheckStatus: result.gateAttempt.gateDecision,
    gateAttemptId: result.gateAttempt.gateAttemptId,
    mutationAttemptId: result.mutationAttempt.mutationAttemptId,
    actionContractId: result.mutationAttempt.actionContractId,
    greenlightId: result.mutationAttempt.greenlightId,
    gatewayId: result.mutationAttempt.gatewayId,
    actionClass: result.mutationAttempt.actionClass,
    resourceRef: result.mutationAttempt.resourceRef,
    idempotencyKey: result.mutationAttempt.idempotencyKey,
    surfaceOperationRef: result.mutationAttempt.surfaceOperationRef,
  };
}

export async function buildGateArtifacts(input: GatewayCheckArtifactInput): Promise<GatewayCheckArtifacts> {
  const receiptId = createId("rcp");
  const mutationAttempt = input.refusal ? null : buildMutationAttempt(input);
  const proofGap = buildMutationProofGap(input, mutationAttempt, receiptId);
  const gateDecision = proofGap ? "proof_gap" : input.refusal ? "refused" : "passed";
  const reasonCode = proofGap ? "downstream_status_unknown" : (input.refusal ?? "gate_passed");
  const gateAttempt = buildGateAttempt(input, gateDecision, reasonCode, mutationAttempt);
  const receipt = buildReceipt(input, receiptId, gateAttempt, mutationAttempt, proofGap);
  const refusal = gateDecision === "refused" ? await buildGatewayRefusal(input, gateAttempt) : null;
  return { result: { gateAttempt, mutationAttempt, receipt, proofGap }, refusal };
}

export async function withReceiptStreamReferences(
  result: GatewayCheckResult,
  events: ContractStreamEvent[],
): Promise<GatewayCheckResult> {
  const receiptWithStreamRefs = {
    ...result.receipt,
    streamEventIds: events.map((event) => event.streamEventId),
    streamOffsets: receiptStreamReferencesForEvents(events),
  };
  const receiptDigest = await digestCanonical({
    ...receiptWithStreamRefs,
    receiptDigest: null,
    auditChainDigest: null,
  } satisfies JsonValue);
  const auditChainDigest = await digestCanonical({
    receiptDigest,
    streamOffsets: receiptWithStreamRefs.streamOffsets,
    proofGapIds: receiptWithStreamRefs.proofGapIds,
    finalityStatus: receiptWithStreamRefs.finalityStatus,
  } satisfies JsonValue);
  const receipt = ReceiptSchema.parse({
    ...receiptWithStreamRefs,
    gatewayAdmissionStatus: deriveGatewayAdmissionStatus(receiptWithStreamRefs),
    downstreamOutcomeStatus: deriveDownstreamOutcomeStatus(receiptWithStreamRefs),
    receiptDigest,
    auditChainDigest,
  });
  return { ...result, receipt };
}

export function gateEventDescriptors(
  artifacts: GatewayCheckArtifacts,
  streamRefs: ActionLifecycleStreamRefs,
  operationClaim?: ProtectedSurfaceOperationClaim | null,
): EventDescriptor[] {
  const { gateAttempt, mutationAttempt, proofGap, receipt } = artifacts.result;
  const { refusal } = artifacts;
  const descriptors: EventDescriptor[] = [
    {
      source: gateAttempt,
      eventType: "gateway_checked",
      objectRefs: [gateAttempt.gateAttemptId, streamRefs.actionContractId],
      streamRefs,
      payload: { gateDecision: gateAttempt.gateDecision, reasonCode: gateAttempt.gateDecisionReasonCode },
    },
  ];
  if (mutationAttempt) {
    descriptors.push({
      source: mutationAttempt,
      eventType: "mutation_attempted",
      objectRefs: [mutationAttempt.mutationAttemptId, streamRefs.actionContractId],
      streamRefs,
      payload: { outcome: mutationAttempt.outcome },
    });
  }
  if (operationClaim) {
    descriptors.push({
      source: operationClaim,
      eventType: "protected_surface_operation_claimed",
      objectRefs: [
        operationClaim.protectedSurfaceOperationClaimId,
        operationClaim.mutationAttemptId ?? operationClaim.gateAttemptId,
        streamRefs.actionContractId,
      ],
      streamRefs,
      payload: { claimState: operationClaim.claimState, claimKeyDigest: operationClaim.claimKeyDigest },
    });
  }
  if (proofGap) {
    descriptors.push({
      source: proofGap,
      eventType: "proof_gap_recorded",
      objectRefs: [proofGap.proofGapId, streamRefs.actionContractId],
      streamRefs,
      payload: { reasonCode: proofGap.reasonCode, finalityImpact: proofGap.finalityImpact },
    });
  }
  if (refusal) {
    descriptors.push({
      source: refusal,
      eventType: "gateway_refused",
      objectRefs: [refusal.refusalId, gateAttempt.gateAttemptId, streamRefs.actionContractId],
      streamRefs,
      payload: { reasonCode: refusal.reasonCode, refusedObjectRef: refusal.refusedObjectRef },
    });
  }
  descriptors.push({
    source: receipt,
    eventType: "receipt_emitted",
    objectRefs: [receipt.receiptId, streamRefs.actionContractId],
    streamRefs,
    payload: { finalityStatus: receipt.finalityStatus, proofGapIds: receipt.proofGapIds },
  });
  return descriptors;
}

async function buildGatewayRefusal(
  input: GatewayCheckArtifactInput,
  gateAttempt: GatewayCheckAttempt,
): Promise<Refusal> {
  return buildRefusal({
    tenantId: input.contract.tenantId,
    organizationId: input.contract.organizationId,
    createdAt: input.now,
    phase: "gateway",
    actionContractId: input.contract.actionContractId,
    policyDecisionId: input.greenlight.policyDecisionId,
    greenlightId: input.greenlight.greenlightId,
    gateAttemptId: gateAttempt.gateAttemptId,
    refusedObjectRef: protocolObjectRef("gateway_check_attempt", gateAttempt.gateAttemptId),
    reasonCode: gateAttempt.gateDecisionReasonCode,
    reason: `Gateway refused before mutation with reason code ${gateAttempt.gateDecisionReasonCode}.`,
    evidenceRefs: [
      protocolObjectRef("action_contract", input.contract.actionContractId),
      protocolObjectRef("greenlight", input.greenlight.greenlightId),
      protocolObjectRef("gateway_check_attempt", gateAttempt.gateAttemptId),
    ],
    refusedAt: input.now,
  });
}

function buildMutationAttempt(input: GatewayCheckArtifactInput): MutationAttempt {
  return MutationAttemptSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: input.contract.tenantId,
    organizationId: input.contract.organizationId,
    createdAt: input.now,
    mutationAttemptId: createId("mut"),
    gateAttemptId: input.gateAttemptId,
    actionContractId: input.contract.actionContractId,
    greenlightId: input.greenlight.greenlightId,
    gatewayId: input.contract.gatewayId,
    actionClass: input.contract.actionClass,
    resourceRef: input.contract.resourceRef,
    idempotencyKey: input.contract.idempotencyKey,
    outcome: mutationOutcomeFor(),
    outcomeReasonCode: "pending",
    surfaceOperationRef: surfaceOperationRefFor(input.input.surfaceOperationRef),
    startedAt: input.now,
    finishedAt: null,
  });
}

function buildMutationProofGap(
  input: GatewayCheckArtifactInput,
  mutationAttempt: MutationAttempt | null,
  receiptId: string,
): ProofGap | null {
  if (mutationAttempt?.outcome !== "unknown") return null;
  return buildProofGap(input.contract, "mutation", "downstream_finality", "downstream_status_unknown", {
    gateAttemptId: input.gateAttemptId,
    mutationAttemptId: mutationAttempt.mutationAttemptId,
    receiptId,
  });
}

function buildGateAttempt(
  input: GatewayCheckArtifactInput,
  gateDecision: "passed" | "refused" | "proof_gap",
  reasonCode: string,
  mutationAttempt: MutationAttempt | null,
): GatewayCheckAttempt {
  return GatewayCheckAttemptSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: input.contract.tenantId,
    organizationId: input.contract.organizationId,
    createdAt: input.now,
    gateAttemptId: input.gateAttemptId,
    gatewayId: input.contract.gatewayId,
    gatewayPolicyContractId: input.contract.gatewayPolicyContractId,
    gatewayPolicyVersion: input.contract.gatewayPolicyVersion,
    pinnedGatewayPolicyVersion: input.contract.gatewayPolicyVersion,
    currentGatewayPolicyVersion: input.gatewayPolicyDrift.currentGatewayPolicyVersion,
    gatewayPolicyDriftStatus: input.gatewayPolicyDrift.status,
    actionContractId: input.contract.actionContractId,
    greenlightId: input.greenlight.greenlightId,
    contractDigestSeen: input.contract.actionContractDigest,
    greenlightDigestSeen: input.greenlightDigestSeen,
    paramsDigestSeen: input.observedParamsDigest,
    idempotencyKeySeen: input.contract.idempotencyKey,
    isolationSnapshotRef: isolationSnapshotRef(input.isolationStates),
    protectedPathPostureIdSeen: input.protectedPathPosture?.payload.protectedPathPostureId ?? null,
    protectedPathPostureDigestSeen: input.protectedPathPosture?.payload.postureDigest ?? null,
    protectedPathPostureStateSeen: input.protectedPathPosture?.payload.postureState ?? null,
    gateDecision,
    gateDecisionReasonCode: reasonCode,
    consumedGreenlight: !input.refusal,
    mutationAttemptId: mutationAttempt?.mutationAttemptId ?? null,
  });
}

function buildReceipt(
  input: GatewayCheckArtifactInput,
  receiptId: string,
  gateAttempt: GatewayCheckAttempt,
  mutationAttempt: MutationAttempt | null,
  proofGap: ProofGap | null,
): Receipt {
  const receiptSeed = {
    schemaVersion: PROTOCOL_VERSION,
    tenantId: input.contract.tenantId,
    organizationId: input.contract.organizationId,
    createdAt: input.now,
    receiptId,
    actionContractId: input.contract.actionContractId,
    policyDecisionId: input.greenlight.policyDecisionId,
    greenlightId: input.greenlight.greenlightId,
    gateAttemptId: gateAttempt.gateAttemptId,
    mutationAttemptId: mutationAttempt?.mutationAttemptId ?? null,
    gatewayId: input.contract.gatewayId,
    policyDecisionStatus: "greenlight",
    gatewayCheckStatus: gateAttempt.gateDecision,
    greenlightConsumptionStatus: !input.refusal
      ? "consumed"
      : input.refusal === "already_consumed"
        ? "replayed"
        : "not_consumed",
    mutationAttemptStatus: mutationAttempt?.outcome ?? "not_attempted",
    downstreamExecutionStatus: downstreamStatusFor(gateAttempt.gateDecision),
    proofGapIds: proofGap ? [proofGap.proofGapId] : [],
    evidenceRefs: input.contract.evidenceRefs,
    streamEventIds: [],
    streamOffsets: [],
    receiptDigest: null,
    auditChainDigest: null,
    finalityStatus: receiptFinalityFor(gateAttempt.gateDecision, proofGap !== null),
    emittedAt: input.now,
  } satisfies Omit<Receipt, "gatewayAdmissionStatus" | "downstreamOutcomeStatus">;
  return ReceiptSchema.parse({
    ...receiptSeed,
    gatewayAdmissionStatus: deriveGatewayAdmissionStatus(receiptSeed),
    downstreamOutcomeStatus: deriveDownstreamOutcomeStatus(receiptSeed),
  });
}

export function gateProtocolRecords(
  input: GatewayCheckArtifactInput,
  result: GatewayCheckResult,
  refusal: Refusal | null,
): ProtocolRecord[] {
  const updatedGreenlight = input.refusal
    ? null
    : GreenlightSchema.parse({
        ...input.greenlight,
        consumedAt: input.now,
        consumedByGateAttemptId: input.gateAttemptId,
      });
  const records: ProtocolRecord[] = [
    { objectType: "gateway_check_attempt", payload: result.gateAttempt },
    { objectType: "receipt", payload: result.receipt },
  ];
  if (updatedGreenlight) records.push({ objectType: "greenlight", payload: updatedGreenlight });
  if (result.mutationAttempt) records.push({ objectType: "mutation_attempt", payload: result.mutationAttempt });
  if (result.proofGap) records.push({ objectType: "proof_gap", payload: result.proofGap });
  if (refusal) records.push({ objectType: "refusal", payload: refusal });
  return records;
}
