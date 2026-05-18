import { digestCanonical } from "../canonical";
import type { ActionContract } from "../action-contract";
import type { GatewayRegistryEntry } from "../catalog-envelope";
import { actionLifecycleStreamRefs, buildEventChain } from "../events";
import { HandshakeProtocolError } from "../errors";
import { createId, nowIso } from "../ids";
import { GatewayCheckInputSchema, type GatewayCheckInput } from "./types";
import { isolationSnapshotRef } from "../policy-greenlight";
import type { Greenlight, PolicyDecision } from "../policy-greenlight";
import type { IsolationState } from "../isolation-breaker";
import {
  buildGateArtifacts,
  gateEventDescriptors,
  gateProtocolRecords,
  withReceiptStreamReferences,
  type GatewayCheckResult,
} from "./artifacts";
import type { ProtocolRecorder } from "../records";
import {
  checkGatewayPolicyDrift,
  gateRefusalReason,
  type GatewayPolicyDriftCheck,
} from "./gateway-policy";
import { buildActiveProtectedSurfaceOperationClaim } from "../operation-lifecycle/index";
import type { ProtectedSurfaceOperationClaim } from "../operation-lifecycle";
import {
  evaluateRequiredProtectedPathPosture,
  loadCurrentPostureForContract,
} from "../protected-path-posture";
import type { ProtectedPathPosture } from "../protected-path-posture";
import { ReceiptSchema, type Receipt } from "../receipt-export";
import {
  PROTOCOL_VERSION,
  GatewayCheckAttemptSchema,
  type JsonValue,
  type GatewayCheckAttempt,
} from "./types";
import {
  loadGatewayCheckSequenceDependencyStates,
  gatewayCheckSequenceDependencyRefusalReason,
} from "../policy-greenlight";
import type { ProtocolStore, StoredProtocolRecord } from "../store-port";
import { scopeIdsForContract, scopeIdsForGreenlight } from "../object-registry";
import { guardGatewayCheckAuthority } from "./guards";
import type { TransitionGuardResult } from "../transition-guards";

const MAX_STREAM_COMMIT_RETRIES = 3;

export type { GatewayCheckResult } from "./artifacts";

export async function gatewayCheck(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  inputValue: GatewayCheckInput,
): Promise<GatewayCheckResult> {
  const input = GatewayCheckInputSchema.parse(inputValue);
  const contract = await recorder.requiredRecord<ActionContract>("action_contract", input.actionContractId, "contract_missing");
  const greenlight = await recorder.requiredRecord<Greenlight>("greenlight", input.greenlightId, "greenlight_missing");
  const policyDecision = await recorder.requiredRecord<PolicyDecision>(
    "policy_decision",
    greenlight.payload.policyDecisionId,
    "policy_decision_missing",
  );
  assertTransition(guardGatewayCheckAuthority(greenlight.payload, policyDecision.payload));

  const now = nowIso();
  const gatewayPolicyDrift = await currentGatewayPolicyDrift(store, contract.payload, greenlight.payload);
  const observedParamsDigest = await digestCanonical({
    parameters: input.observedParameters,
    secretRefs: contract.payload.secretRefs,
  });
  const greenlightDigestSeen = await digestCanonical(greenlight.payload as unknown as JsonValue);
  const isolationStates = await store.listIsolationStates([
    ...scopeIdsForContract(contract.payload),
    ...scopeIdsForGreenlight(greenlight.payload),
  ]);
  const protectedPathPosture = await loadCurrentPostureForContract(store, contract.payload);
  const protectedPathEvaluation = evaluateRequiredProtectedPathPosture({
    contract: contract.payload,
    gateway: contract.payload,
    posture: protectedPathPosture,
    now,
  });
  const sequenceDependencyStates = await loadGatewayCheckSequenceDependencyStates(store, contract.payload);
  const sequenceDependencyReasonCode = gatewayCheckSequenceDependencyRefusalReason(sequenceDependencyStates);
  const gateAttemptId = createId("gat");
  const refusal = gateRefusalReason(
    contract.payload,
    greenlight.payload,
    observedParamsDigest,
    isolationStates,
    now,
    gatewayPolicyDrift.reasonCode,
    protectedPathEvaluation.ok ? null : protectedPathEvaluation.reasonCode,
    sequenceDependencyReasonCode,
  );
  const artifacts = buildGateArtifacts({
    input,
    contract: contract.payload,
    greenlight: greenlight.payload,
    gateAttemptId,
    refusal,
    now,
    observedParamsDigest,
    greenlightDigestSeen,
    isolationStates,
    gatewayPolicyDrift,
    protectedPathPosture,
  });
  const streamRefs = actionLifecycleStreamRefs(contract.payload);
  const operationClaim =
    !refusal && artifacts.result.mutationAttempt
      ? await buildActiveProtectedSurfaceOperationClaim({
          contract: contract.payload,
          greenlight: greenlight.payload,
          gateAttemptId,
          mutationAttempt: artifacts.result.mutationAttempt,
          now,
        })
      : null;
  const requestContextRecord = await recorder.transitionRequestContextRecordFor({
    tenantId: contract.payload.tenantId,
    organizationId: contract.payload.organizationId,
  });
  const events = recorder.withTransitionRequestContextEventDescriptors(
    gateEventDescriptors(artifacts, streamRefs, operationClaim),
    requestContextRecord,
  );
  const consumption = refusal
    ? null
    : {
        greenlightId: greenlight.payload.greenlightId,
        gateAttemptId,
        actionContractId: contract.payload.actionContractId,
        idempotencyKey: contract.payload.idempotencyKey,
        consumedAt: now,
      };

  for (let attempt = 0; attempt <= MAX_STREAM_COMMIT_RETRIES; attempt += 1) {
    const streamEvents = await buildEventChain(store, events);
    const finalizedResult = await withReceiptStreamReferences(artifacts.result, streamEvents);
    const protocolRecords = [
      ...(requestContextRecord ? [requestContextRecord] : []),
      ...gateProtocolRecords(
        {
          input,
          contract: contract.payload,
          greenlight: greenlight.payload,
          gateAttemptId,
          refusal,
          now,
          observedParamsDigest,
          greenlightDigestSeen,
          isolationStates,
          gatewayPolicyDrift,
          protectedPathPosture,
        },
        finalizedResult,
      ),
    ];
    if (operationClaim) {
      protocolRecords.push({ objectType: "protected_surface_operation_claim", payload: operationClaim });
    }
    const records = await Promise.all(protocolRecords.map((record) => recorder.buildRecord(record)));
    const receiptIndexEntries = finalizedResult.receipt.mutationAttemptId
      ? [
          {
            mutationAttemptId: finalizedResult.receipt.mutationAttemptId,
            receiptId: finalizedResult.receipt.receiptId,
            tenantId: finalizedResult.receipt.tenantId,
            organizationId: finalizedResult.receipt.organizationId,
            createdAt: finalizedResult.receipt.createdAt,
          },
        ]
      : [];
    const commitResult = await store.commitGatewayCheck({
      consumption,
      records,
      events: streamEvents,
      protectedSurfaceOperationClaimIndexEntries: operationClaim
        ? [operationClaimIndexEntry(operationClaim, now)]
        : [],
      receiptMutationAttemptIndexEntries: receiptIndexEntries,
    });
    if (commitResult === "committed") return finalizedResult;
    if (commitResult === "already_consumed") {
      return commitReplayRefusal(store, recorder, contract.payload, greenlight.payload, {
        observedParamsDigest,
        isolationStates,
        gatewayPolicyDrift,
        protectedPathPosture,
      });
    }
    if (commitResult === "operation_claim_conflict") {
      return commitReplayRefusal(store, recorder, contract.payload, greenlight.payload, {
        observedParamsDigest,
        isolationStates,
        gatewayPolicyDrift,
        protectedPathPosture,
        refusalReasonCode: "protected_surface_operation_in_progress",
        greenlightConsumptionStatus: "not_consumed",
      });
    }
  }
  throw new HandshakeProtocolError(
    "stream_append_conflict",
    "Gateway gate could not commit a contiguous contract stream after retrying fresh stream tails.",
    409,
  );
}

async function currentGatewayPolicyDrift(
  store: ProtocolStore,
  contract: ActionContract,
  greenlight: Greenlight,
): Promise<GatewayPolicyDriftCheck> {
  const currentGatewayRecord = await store.getRecord<GatewayRegistryEntry>(
    "gateway_registry_entry",
    contract.gatewayRegistryEntryId,
  );
  return checkGatewayPolicyDrift(contract, greenlight, currentGatewayRecord?.payload ?? null);
}

async function commitReplayRefusal(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  contract: ActionContract,
  greenlight: Greenlight,
  context: {
    observedParamsDigest: `sha256:${string}`;
    isolationStates: IsolationState[];
    gatewayPolicyDrift: GatewayPolicyDriftCheck;
    protectedPathPosture?: StoredProtocolRecord<ProtectedPathPosture> | null;
    refusalReasonCode?: string;
    greenlightConsumptionStatus?: Receipt["greenlightConsumptionStatus"];
  },
): Promise<GatewayCheckResult> {
  const now = nowIso();
  const greenlightDigestSeen = await digestCanonical(greenlight as unknown as JsonValue);
  const gateAttempt = buildReplayGateAttempt(contract, greenlight, context, greenlightDigestSeen, now);
  const receipt = buildReplayReceipt(
    contract,
    greenlight,
    gateAttempt,
    now,
    context.greenlightConsumptionStatus ?? "replayed",
  );
  const eventDescriptors = gateEventDescriptors(
    { result: { gateAttempt, mutationAttempt: null, receipt, proofGap: null } },
    actionLifecycleStreamRefs(contract),
  );
  const requestContextRecord = await recorder.transitionRequestContextRecordFor({
    tenantId: contract.tenantId,
    organizationId: contract.organizationId,
  });
  const eventDescriptorsWithContext = recorder.withTransitionRequestContextEventDescriptors(
    eventDescriptors,
    requestContextRecord,
  );
  for (let attempt = 0; attempt <= MAX_STREAM_COMMIT_RETRIES; attempt += 1) {
    const events = await buildEventChain(store, eventDescriptorsWithContext);
    const finalizedResult = await withReceiptStreamReferences(
      { gateAttempt, mutationAttempt: null, receipt, proofGap: null },
      events,
    );
    const records = await Promise.all(
      [
        ...(requestContextRecord ? [requestContextRecord] : []),
        { objectType: "gateway_check_attempt" as const, payload: finalizedResult.gateAttempt },
        { objectType: "receipt" as const, payload: finalizedResult.receipt },
      ].map((record) => recorder.buildRecord(record)),
    );
    const commitResult = await store.commitGatewayCheck({ consumption: null, records, events });
    if (commitResult === "committed" || commitResult === "already_consumed") {
      return finalizedResult;
    }
  }
  throw new HandshakeProtocolError(
    "stream_append_conflict",
    "Replay refusal could not commit a contiguous contract stream after retrying fresh stream tails.",
    409,
  );
}

function buildReplayGateAttempt(
  contract: ActionContract,
  greenlight: Greenlight,
  context: {
    observedParamsDigest: `sha256:${string}`;
    isolationStates: IsolationState[];
    gatewayPolicyDrift: GatewayPolicyDriftCheck;
    protectedPathPosture?: StoredProtocolRecord<ProtectedPathPosture> | null;
    refusalReasonCode?: string;
  },
  greenlightDigestSeen: `sha256:${string}`,
  now: string,
): GatewayCheckAttempt {
  return GatewayCheckAttemptSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: contract.tenantId,
    organizationId: contract.organizationId,
    createdAt: now,
    gateAttemptId: createId("gat"),
    gatewayId: contract.gatewayId,
    gatewayPolicyContractId: contract.gatewayPolicyContractId,
    gatewayPolicyVersion: contract.gatewayPolicyVersion,
    pinnedGatewayPolicyVersion: contract.gatewayPolicyVersion,
    currentGatewayPolicyVersion: context.gatewayPolicyDrift.currentGatewayPolicyVersion,
    gatewayPolicyDriftStatus: context.gatewayPolicyDrift.status,
    actionContractId: contract.actionContractId,
    greenlightId: greenlight.greenlightId,
    contractDigestSeen: contract.actionContractDigest,
    greenlightDigestSeen,
    paramsDigestSeen: context.observedParamsDigest,
    idempotencyKeySeen: contract.idempotencyKey,
    isolationSnapshotRef: isolationSnapshotRef(context.isolationStates),
    protectedPathPostureIdSeen: context.protectedPathPosture?.payload.protectedPathPostureId ?? null,
    protectedPathPostureDigestSeen: context.protectedPathPosture?.payload.postureDigest ?? null,
    protectedPathPostureStateSeen: context.protectedPathPosture?.payload.postureState ?? null,
    gateDecision: "refused",
    gateDecisionReasonCode: context.refusalReasonCode ?? "already_consumed",
    consumedGreenlight: false,
    mutationAttemptId: null,
  });
}

function buildReplayReceipt(
  contract: ActionContract,
  greenlight: Greenlight,
  gateAttempt: GatewayCheckAttempt,
  now: string,
  greenlightConsumptionStatus: Receipt["greenlightConsumptionStatus"],
): Receipt {
  return ReceiptSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: contract.tenantId,
    organizationId: contract.organizationId,
    createdAt: now,
    receiptId: createId("rcp"),
    actionContractId: contract.actionContractId,
    policyDecisionId: greenlight.policyDecisionId,
    greenlightId: greenlight.greenlightId,
    gateAttemptId: gateAttempt.gateAttemptId,
    mutationAttemptId: null,
    gatewayId: contract.gatewayId,
    policyDecisionStatus: "greenlight",
    gatewayCheckStatus: "refused",
    greenlightConsumptionStatus,
    mutationAttemptStatus: "not_attempted",
    downstreamExecutionStatus: "not_started",
    proofGapIds: [],
    evidenceRefs: contract.evidenceRefs,
    streamEventIds: [],
    streamOffsets: [],
    receiptDigest: null,
    auditChainDigest: null,
    finalityStatus: "suspect",
    emittedAt: now,
  });
}

function operationClaimIndexEntry(claim: ProtectedSurfaceOperationClaim, updatedAt: string) {
  return {
    claimKeyDigest: claim.claimKeyDigest,
    protectedSurfaceOperationClaimId: claim.protectedSurfaceOperationClaimId,
    tenantId: claim.tenantId,
    organizationId: claim.organizationId,
    claimState: claim.claimState,
    updatedAt,
  };
}

function assertTransition(result: TransitionGuardResult): void {
  if (!result.ok) {
    throw new HandshakeProtocolError(result.code, result.message, result.status);
  }
}
