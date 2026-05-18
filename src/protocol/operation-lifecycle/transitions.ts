import { HandshakeProtocolError } from "../errors";
import type { ActionContract } from "../action-contract";
import { actionLifecycleStreamRefs } from "../events";
import type { MutationAttempt } from "../gateway-gate";
import { createId, nowIso } from "../ids";
import { IsolationStateSchema, type IsolationState } from "../isolation-breaker";
import type { ProtocolRecord } from "../object-registry/schemas";
import { ReconcileSurfaceOperationInputSchema, type ReconcileSurfaceOperationInput } from "./types";
import { buildProofGap, resolveProofGaps } from "../proof-gap";
import type { ProofGap } from "../proof-gap";
import type { Receipt } from "../receipt-export";
import type { ProtocolRecorder } from "../records";
import {
  PROTOCOL_VERSION,
  SurfaceOperationReconciliationSchema,
  type ProtectedSurfaceOperationClaim,
  type SurfaceOperationReconciliation,
} from "./types";
import { guardSurfaceOperationReconciliation } from "./guards";
import type { TransitionGuardResult } from "../transition-guards";
import type { ProtocolStore } from "../store-port";
import { operationLifecycleFor } from "./lifecycle";
import {
  buildTerminalProtectedSurfaceOperationClaim,
  protectedSurfaceOperationClaimKey,
  protectedSurfaceOperationClaimKeyDigest,
} from "./claims";

export type SurfaceOperationReconciliationResult = {
  reconciliation: SurfaceOperationReconciliation;
  resolvedProofGaps: ProofGap[];
  createdProofGap: ProofGap | null;
};

export async function reconcileSurfaceOperation(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  inputValue: ReconcileSurfaceOperationInput,
): Promise<SurfaceOperationReconciliationResult> {
  const input = ReconcileSurfaceOperationInputSchema.parse(inputValue);
  if (input.observedDownstreamStatus === "unknown" && input.resolvedProofGapIds.length > 0) {
    throw new HandshakeProtocolError(
      "invalid_transition_unknown_reconciliation_cannot_resolve_proof_gap",
      "An unknown downstream reconciliation records a new proof gap; it cannot resolve existing proof gaps.",
      409,
    );
  }
  const mutationRecord = await recorder.requiredRecord<MutationAttempt>(
    "mutation_attempt",
    input.mutationAttemptId,
    "mutation_attempt_missing",
  );
  const contractRecord = await recorder.requiredRecord<ActionContract>(
    "action_contract",
    mutationRecord.payload.actionContractId,
    "contract_missing",
  );
  assertTransition(
    guardSurfaceOperationReconciliation(mutationRecord.payload, {
      mutationAttemptId: input.mutationAttemptId,
      idempotencyKey: input.idempotencyKey,
      observedSurfaceOperationRef: input.observedSurfaceOperationRef,
    }),
  );

  const now = nowIso();
  const lifecycle = operationLifecycleFor(input.observedDownstreamStatus);
  const reconciliation = SurfaceOperationReconciliationSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: mutationRecord.payload.tenantId,
    organizationId: mutationRecord.payload.organizationId,
    createdAt: now,
    reconciliationId: createId("rec"),
    mutationAttemptId: mutationRecord.payload.mutationAttemptId,
    gateAttemptId: mutationRecord.payload.gateAttemptId,
    actionContractId: mutationRecord.payload.actionContractId,
    greenlightId: mutationRecord.payload.greenlightId,
    gatewayId: mutationRecord.payload.gatewayId,
    idempotencyKey: mutationRecord.payload.idempotencyKey,
    surfaceOperationRef: input.observedSurfaceOperationRef ?? mutationRecord.payload.surfaceOperationRef,
    previousMutationOutcome: mutationRecord.payload.outcome,
    observedDownstreamStatus: input.observedDownstreamStatus,
    observedAt: now,
    evidenceRefs: input.evidenceRefs,
    resolvedProofGapIds: input.resolvedProofGapIds,
    reconciliationStatus: lifecycle.reconciliationStatus,
    finalityStatus: lifecycle.finalityStatus,
  });

  const resolvedProofGaps = await resolveProofGaps(recorder, input.resolvedProofGapIds, reconciliation, now);
  const activeClaim = await currentClaimForContract(store, contractRecord.payload);
  const terminalClaim =
    activeClaim && lifecycle.claimState !== "active"
      ? await buildTerminalProtectedSurfaceOperationClaim(activeClaim.payload, {
          claimState: lifecycle.claimState,
          terminalAt: now,
          terminalReasonCode: lifecycle.proofGapReasonCode ?? input.observedDownstreamStatus,
          releasedByRef: reconciliation.reconciliationId,
        })
      : null;
  const isolationState =
    lifecycle.createIsolation && input.orphanIsolationRequested
      ? buildOrphanIsolationState(contractRecord.payload, reconciliation, now)
      : null;
  const createdProofGap =
    lifecycle.proofGapReasonCode
      ? buildProofGap(contractRecord.payload, "mutation", "downstream_finality", lifecycle.proofGapReasonCode, {
          gateAttemptId: mutationRecord.payload.gateAttemptId,
          mutationAttemptId: mutationRecord.payload.mutationAttemptId,
          receiptId: await receiptIdForMutation(store, mutationRecord.payload),
        })
      : null;
  const protocolRecords: ProtocolRecord[] = [
    { objectType: "surface_operation_reconciliation", payload: reconciliation },
    ...resolvedProofGaps.map((proofGap): ProtocolRecord => ({ objectType: "proof_gap", payload: proofGap })),
    ...(createdProofGap ? ([{ objectType: "proof_gap", payload: createdProofGap }] satisfies ProtocolRecord[]) : []),
    ...(terminalClaim
      ? ([{ objectType: "protected_surface_operation_claim", payload: terminalClaim }] satisfies ProtocolRecord[])
      : []),
    ...(isolationState
      ? ([{ objectType: "isolation_state", payload: isolationState }] satisfies ProtocolRecord[])
      : []),
  ];
  await recorder.commitRecordsWithEvents(
    protocolRecords,
    [
      {
        source: reconciliation,
        eventType: "surface_operation_reconciled",
        objectRefs: [reconciliation.reconciliationId, reconciliation.mutationAttemptId, reconciliation.actionContractId],
        streamRefs: actionLifecycleStreamRefs(contractRecord.payload),
        payload: {
          observedDownstreamStatus: reconciliation.observedDownstreamStatus,
          reconciliationStatus: reconciliation.reconciliationStatus,
          finalityStatus: reconciliation.finalityStatus,
          resolvedProofGapIds: reconciliation.resolvedProofGapIds,
        },
      },
      ...(createdProofGap
        ? [
            {
              source: createdProofGap,
              eventType: "proof_gap_recorded" as const,
              objectRefs: [
                createdProofGap.proofGapId,
                reconciliation.mutationAttemptId,
                reconciliation.actionContractId,
              ],
              streamRefs: actionLifecycleStreamRefs(contractRecord.payload),
              payload: {
                reasonCode: createdProofGap.reasonCode,
                finalityImpact: createdProofGap.finalityImpact,
                reconciliationId: reconciliation.reconciliationId,
              },
            },
          ]
        : []),
      ...(terminalClaim
        ? [
            {
              source: terminalClaim,
              eventType: "protected_surface_operation_released" as const,
              objectRefs: [
                terminalClaim.protectedSurfaceOperationClaimId,
                terminalClaim.mutationAttemptId ?? terminalClaim.gateAttemptId,
                reconciliation.actionContractId,
              ],
              streamRefs: actionLifecycleStreamRefs(contractRecord.payload),
              payload: {
                claimState: terminalClaim.claimState,
                claimKeyDigest: terminalClaim.claimKeyDigest,
                releasedByRef: terminalClaim.releasedByRef,
              },
            },
          ]
        : []),
      ...(isolationState
        ? [
            {
              source: isolationState,
              eventType: "isolation_changed" as const,
              objectRefs: [
                isolationState.isolationStateId,
                isolationState.scopeId,
                reconciliation.actionContractId,
              ],
              streamRefs: actionLifecycleStreamRefs(contractRecord.payload),
              payload: {
                state: isolationState.state,
                reasonCode: isolationState.reasonCode,
                sourceDecisionRef: isolationState.sourceDecisionRef,
              },
            },
          ]
        : []),
    ],
    {
      protectedSurfaceOperationClaimIndexEntries:
        terminalClaim && lifecycle.keepClaimBlocking ? [operationClaimIndexEntry(terminalClaim, now)] : [],
      protectedSurfaceOperationClaimIndexReleases:
        activeClaim && terminalClaim && !lifecycle.keepClaimBlocking ? [activeClaim.payload.claimKeyDigest] : [],
    },
  );
  return { reconciliation, resolvedProofGaps, createdProofGap };
}

async function receiptIdForMutation(store: ProtocolStore, mutationAttempt: MutationAttempt): Promise<string | null> {
  return (await store.getReceiptByMutationAttemptId(mutationAttempt.mutationAttemptId))?.payload.receiptId ?? null;
}

async function currentClaimForContract(
  store: ProtocolStore,
  contract: ActionContract,
) {
  const claimKeyDigest = await protectedSurfaceOperationClaimKeyDigest(protectedSurfaceOperationClaimKey(contract));
  return store.getCurrentProtectedSurfaceOperationClaim(claimKeyDigest);
}

function buildOrphanIsolationState(
  contract: ActionContract,
  reconciliation: SurfaceOperationReconciliation,
  now: string,
): IsolationState {
  return IsolationStateSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: contract.tenantId,
    organizationId: contract.organizationId,
    createdAt: now,
    isolationStateId: createId("iso"),
    scopeType: "resource",
    scopeId: contract.resourceRef,
    state: "state_suspect",
    reasonCode: "orphan_mitigation_required",
    reasonSummary: "Protected surface finality is unknown after a gateway-passed mutation attempt.",
    sourceDecisionRef: reconciliation.reconciliationId,
    effectiveAt: now,
    expiresAt: null,
    clearedAt: null,
    observedStreamOffsets: [],
    version: 0,
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
