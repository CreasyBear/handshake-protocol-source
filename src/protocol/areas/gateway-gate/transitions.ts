import { digestCanonical } from "../../foundation/canonical";
import type { ActionContract } from "../action-contract";
import type { GatewayRegistryEntry } from "../catalog-envelope";
import { actionLifecycleStreamRefs, buildEventChain, type EventDescriptor } from "../../events/chains";
import { HandshakeProtocolError } from "../../foundation/errors";
import { createId, nowIso } from "../../foundation/ids";
import { GatewayCheckInputSchema, type GatewayCheckInput } from "./types";
import type { Greenlight, PolicyDecision } from "../policy-greenlight";
import type { IsolationState } from "../isolation-breaker";
import {
  buildGateArtifacts,
  gateEventDescriptors,
  gateProtocolRecords,
  withReceiptStreamReferences,
  type GatewayCheckResult,
} from "./artifacts";
import type { ProtocolRecorder } from "../../events/records";
import { checkGatewayPolicyDrift, gateRefusalReason, type GatewayPolicyDriftCheck } from "./gateway-policy";
import { buildActiveProtectedSurfaceOperationClaim } from "../operation-lifecycle";
import type { ProtectedSurfaceOperationClaim } from "../operation-lifecycle";
import { evaluateRequiredProtectedPathPosture, loadCurrentPostureForContract } from "../protected-path-posture";
import type { ProtectedPathPosture } from "../protected-path-posture";
import { type JsonValue } from "./types";
import {
  loadGatewayCheckSequenceDependencyStates,
  gatewayCheckSequenceDependencyRefusalReason,
} from "../policy-greenlight";
import type { GatewayCheckCommit, GreenlightConsumption, ProtocolStore, StoredProtocolRecord } from "../../store/port";
import {
  isolationScopeRefsForContract,
  isolationScopeRefsForGreenlight,
  type ProtocolRecord,
} from "../object-registry";
import { guardGatewayCheckAuthority } from "./guards";
import type { TransitionGuardResult } from "../../foundation/transition-guards";
import { commitReplayRefusal } from "./replay-refusal";

const MAX_STREAM_COMMIT_RETRIES = 3;

export type { GatewayCheckResult } from "./artifacts";

type ParsedGatewayCheckInput = ReturnType<typeof GatewayCheckInputSchema.parse>;

type GatewayAuthorityContext = {
  input: ParsedGatewayCheckInput;
  contractRecord: StoredProtocolRecord<ActionContract>;
  greenlightRecord: StoredProtocolRecord<Greenlight>;
  policyDecisionRecord: StoredProtocolRecord<PolicyDecision>;
};

type GatewayConstraintEvaluation = {
  input: ParsedGatewayCheckInput;
  contract: ActionContract;
  greenlight: Greenlight;
  now: string;
  gateAttemptId: string;
  observedParamsDigest: `sha256:${string}`;
  greenlightDigestSeen: `sha256:${string}`;
  isolationStates: IsolationState[];
  gatewayPolicyDrift: GatewayPolicyDriftCheck;
  protectedPathPosture: StoredProtocolRecord<ProtectedPathPosture> | null;
  refusal: string | null;
};

type GatewayCommitPlan = GatewayConstraintEvaluation & {
  artifacts: ReturnType<typeof buildGateArtifacts>;
  operationClaim: ProtectedSurfaceOperationClaim | null;
  requestContextRecord: ProtocolRecord | null;
  events: EventDescriptor[];
  consumption: GreenlightConsumption | null;
};

export async function gatewayCheck(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  inputValue: GatewayCheckInput,
): Promise<GatewayCheckResult> {
  const authorityContext = await getGatewayAuthorityContext(recorder, inputValue);
  assertTransition(
    guardGatewayCheckAuthority(
      authorityContext.greenlightRecord.payload,
      authorityContext.policyDecisionRecord.payload,
    ),
  );

  const evaluation = await deriveGatewayConstraintEvaluation(store, authorityContext);
  const plan = await buildGatewayCommitPlan(recorder, evaluation);
  return commitGatewayCheckPlan(store, recorder, plan);
}

async function getGatewayAuthorityContext(
  recorder: ProtocolRecorder,
  inputValue: GatewayCheckInput,
): Promise<GatewayAuthorityContext> {
  const input = GatewayCheckInputSchema.parse(inputValue);
  const contractRecord = await recorder.requiredRecord<ActionContract>(
    "action_contract",
    input.actionContractId,
    "contract_missing",
  );
  const greenlightRecord = await recorder.requiredRecord<Greenlight>(
    "greenlight",
    input.greenlightId,
    "greenlight_missing",
  );
  const policyDecisionRecord = await recorder.requiredRecord<PolicyDecision>(
    "policy_decision",
    greenlightRecord.payload.policyDecisionId,
    "policy_decision_missing",
  );
  return { input, contractRecord, greenlightRecord, policyDecisionRecord };
}

async function deriveGatewayConstraintEvaluation(
  store: ProtocolStore,
  context: GatewayAuthorityContext,
): Promise<GatewayConstraintEvaluation> {
  const contract = context.contractRecord.payload;
  const greenlight = context.greenlightRecord.payload;
  const now = nowIso();
  const gatewayPolicyDrift = await currentGatewayPolicyDrift(store, contract, greenlight);
  const observedParamsDigest = await digestCanonical({
    parameters: context.input.observedParameters,
    secretRefs: contract.secretRefs,
  });
  const greenlightDigestSeen = await digestCanonical(greenlight as unknown as JsonValue);
  const isolationStates = await store.listIsolationStates([
    ...isolationScopeRefsForContract(contract),
    ...isolationScopeRefsForGreenlight(greenlight),
  ]);
  const protectedPathPosture = await loadCurrentPostureForContract(store, contract);
  const protectedPathEvaluation = evaluateRequiredProtectedPathPosture({
    contract,
    gateway: contract,
    posture: protectedPathPosture,
    now,
  });
  const sequenceDependencyStates = await loadGatewayCheckSequenceDependencyStates(store, contract);
  const sequenceDependencyReasonCode = gatewayCheckSequenceDependencyRefusalReason(sequenceDependencyStates);
  const gateAttemptId = createId("gat");
  const refusal = gateRefusalReason(
    contract,
    greenlight,
    observedParamsDigest,
    isolationStates,
    now,
    gatewayPolicyDrift.reasonCode,
    protectedPathEvaluation.ok ? null : protectedPathEvaluation.reasonCode,
    sequenceDependencyReasonCode,
  );
  return {
    input: context.input,
    contract,
    greenlight,
    now,
    gateAttemptId,
    observedParamsDigest,
    greenlightDigestSeen,
    isolationStates,
    gatewayPolicyDrift,
    protectedPathPosture,
    refusal,
  };
}

async function buildGatewayCommitPlan(
  recorder: ProtocolRecorder,
  evaluation: GatewayConstraintEvaluation,
): Promise<GatewayCommitPlan> {
  const artifacts = buildGateArtifacts(evaluation);
  const streamRefs = actionLifecycleStreamRefs(evaluation.contract);
  const operationClaim = await deriveProtectedSurfaceOperationClaim(evaluation, artifacts.result);
  const requestContextRecord = await recorder.transitionRequestContextRecordFor({
    tenantId: evaluation.contract.tenantId,
    organizationId: evaluation.contract.organizationId,
  });
  const events = recorder.withTransitionRequestContextEventDescriptors(
    gateEventDescriptors(artifacts, streamRefs, operationClaim),
    requestContextRecord,
  );
  return {
    ...evaluation,
    artifacts,
    operationClaim,
    requestContextRecord,
    events,
    consumption: buildGreenlightConsumption(evaluation),
  };
}

async function commitGatewayCheckPlan(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  plan: GatewayCommitPlan,
): Promise<GatewayCheckResult> {
  for (let attempt = 0; attempt <= MAX_STREAM_COMMIT_RETRIES; attempt += 1) {
    const { commit, finalizedResult } = await buildGatewayCheckCommit(store, recorder, plan);
    const commitResult = await store.commitGatewayCheck(commit);
    if (commitResult === "committed") return finalizedResult;
    if (commitResult === "already_consumed") {
      return commitReplayRefusal(store, recorder, plan.contract, plan.greenlight, {
        observedParamsDigest: plan.observedParamsDigest,
        isolationStates: plan.isolationStates,
        gatewayPolicyDrift: plan.gatewayPolicyDrift,
        protectedPathPosture: plan.protectedPathPosture,
      });
    }
    if (commitResult === "operation_claim_conflict") {
      return commitReplayRefusal(store, recorder, plan.contract, plan.greenlight, {
        observedParamsDigest: plan.observedParamsDigest,
        isolationStates: plan.isolationStates,
        gatewayPolicyDrift: plan.gatewayPolicyDrift,
        protectedPathPosture: plan.protectedPathPosture,
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

async function deriveProtectedSurfaceOperationClaim(
  evaluation: GatewayConstraintEvaluation,
  result: GatewayCheckResult,
): Promise<ProtectedSurfaceOperationClaim | null> {
  if (evaluation.refusal || !result.mutationAttempt) return null;
  return buildActiveProtectedSurfaceOperationClaim({
    contract: evaluation.contract,
    greenlight: evaluation.greenlight,
    gateAttemptId: evaluation.gateAttemptId,
    mutationAttempt: result.mutationAttempt,
    now: evaluation.now,
  });
}

function buildGreenlightConsumption(evaluation: GatewayConstraintEvaluation): GreenlightConsumption | null {
  if (evaluation.refusal) return null;
  return {
    greenlightId: evaluation.greenlight.greenlightId,
    gateAttemptId: evaluation.gateAttemptId,
    actionContractId: evaluation.contract.actionContractId,
    idempotencyKey: evaluation.contract.idempotencyKey,
    consumedAt: evaluation.now,
  };
}

async function buildGatewayCheckCommit(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  plan: GatewayCommitPlan,
): Promise<{ commit: GatewayCheckCommit; finalizedResult: GatewayCheckResult }> {
  const streamEvents = await buildEventChain(store, plan.events);
  const finalizedResult = await withReceiptStreamReferences(plan.artifacts.result, streamEvents);
  const protocolRecords = [
    ...(plan.requestContextRecord ? [plan.requestContextRecord] : []),
    ...gateProtocolRecords(plan, finalizedResult),
  ];
  if (plan.operationClaim) {
    protocolRecords.push({ objectType: "protected_surface_operation_claim", payload: plan.operationClaim });
  }
  const records = await Promise.all(protocolRecords.map((record) => recorder.buildRecord(record)));
  return {
    finalizedResult,
    commit: {
      consumption: plan.consumption,
      records,
      events: streamEvents,
      protectedSurfaceOperationClaimIndexEntries: plan.operationClaim
        ? [operationClaimIndexEntry(plan.operationClaim, plan.now)]
        : [],
      receiptMutationAttemptIndexEntries: receiptMutationAttemptIndexEntriesFor(finalizedResult),
    },
  };
}

function receiptMutationAttemptIndexEntriesFor(
  result: GatewayCheckResult,
): NonNullable<GatewayCheckCommit["receiptMutationAttemptIndexEntries"]> {
  if (!result.receipt.mutationAttemptId) return [];
  return [
    {
      mutationAttemptId: result.receipt.mutationAttemptId,
      receiptId: result.receipt.receiptId,
      tenantId: result.receipt.tenantId,
      organizationId: result.receipt.organizationId,
      createdAt: result.receipt.createdAt,
    },
  ];
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
