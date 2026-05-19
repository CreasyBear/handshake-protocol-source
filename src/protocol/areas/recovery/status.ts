import { digestCanonical } from "../../foundation/canonical";
import type { ActionContract } from "../action-contract";
import { HandshakeProtocolError } from "../../foundation/errors";
import { actionLifecycleStreamRefs, type EventDescriptor } from "../../events/chains";
import { createId, nowIso } from "../../foundation/ids";
import type { ProtocolRecord } from "../object-registry";
import {
  TransitionRecoveryRecommendationStatusInputSchema,
  type TransitionRecoveryRecommendationStatusInput,
} from "./types";
import type { ProtocolRecorder } from "../../events/records";
import { recordRecoveryTerminalConflictProofGap } from "./terminal/terminal-conflicts";
import {
  PROTOCOL_VERSION,
  RecoveryRecommendationSchema,
  RecoveryRecommendationStatusTransitionSchema,
  type JsonValue,
  type RecoveryRecommendation,
  type RecoveryRecommendationStatusTransition,
  type RecoveryRecommendationTerminalStatus,
} from "./types";
import type { RecoveryTerminalClaim } from "../../store/port";

export type RecoveryRecommendationStatusChange = {
  recoveryRecommendation: RecoveryRecommendation;
  statusTransition: RecoveryRecommendationStatusTransition;
  terminalClaim: RecoveryTerminalClaim;
};

type ParsedTransitionRecoveryRecommendationStatusInput = ReturnType<
  typeof TransitionRecoveryRecommendationStatusInputSchema.parse
>;

type RecoveryRecommendationStatusContext = {
  input: ParsedTransitionRecoveryRecommendationStatusInput;
  recommendation: RecoveryRecommendation;
  sourceContract: ActionContract;
  now: string;
};

export type BuildRecoveryRecommendationStatusChangeInput = {
  recommendation: RecoveryRecommendation;
  sourceContract: ActionContract;
  nextStatus: RecoveryRecommendationTerminalStatus;
  reasonCode: string;
  reasonSummary: string;
  changedByRef: string;
  supersededByActionContractId: string | null;
  now: string;
};

export async function transitionRecoveryRecommendationStatus(
  recorder: ProtocolRecorder,
  inputValue: TransitionRecoveryRecommendationStatusInput,
): Promise<RecoveryRecommendationStatusChange> {
  const input = TransitionRecoveryRecommendationStatusInputSchema.parse(inputValue);
  const context = await getRecoveryRecommendationStatusContext(recorder, input);
  const statusChange = await buildRecoveryRecommendationStatusChange(
    buildRecoveryRecommendationStatusChangeInput(context),
  );
  await commitRecoveryRecommendationStatusChange(recorder, context, statusChange);
  return statusChange;
}

async function getRecoveryRecommendationStatusContext(
  recorder: ProtocolRecorder,
  input: ParsedTransitionRecoveryRecommendationStatusInput,
): Promise<RecoveryRecommendationStatusContext> {
  const recommendationRecord = await recorder.requiredRecord<RecoveryRecommendation>(
    "recovery_recommendation",
    input.recoveryRecommendationId,
    "recovery_recommendation_missing",
  );
  const sourceContractRecord = await recorder.requiredRecord<ActionContract>(
    "action_contract",
    recommendationRecord.payload.sourceActionContractId,
    "recovery_source_contract_missing",
  );
  const supersedingContract = input.supersededByActionContractId
    ? await recorder.requiredRecord<ActionContract>(
        "action_contract",
        input.supersededByActionContractId,
        "recovery_superseding_contract_missing",
      )
    : null;
  if (supersedingContract) {
    assertSupersedingContract(recommendationRecord.payload, supersedingContract.payload);
  }
  return {
    input,
    recommendation: recommendationRecord.payload,
    sourceContract: sourceContractRecord.payload,
    now: nowIso(),
  };
}

function buildRecoveryRecommendationStatusChangeInput(
  context: RecoveryRecommendationStatusContext,
): BuildRecoveryRecommendationStatusChangeInput {
  const { input, recommendation, sourceContract, now } = context;
  return {
    recommendation,
    sourceContract,
    nextStatus: input.nextStatus,
    reasonCode: input.reasonCode,
    reasonSummary: input.reasonSummary,
    changedByRef: input.changedByRef,
    supersededByActionContractId: input.supersededByActionContractId,
    now,
  };
}

async function commitRecoveryRecommendationStatusChange(
  recorder: ProtocolRecorder,
  context: RecoveryRecommendationStatusContext,
  statusChange: RecoveryRecommendationStatusChange,
): Promise<void> {
  await recorder
    .commitRecordsWithEvents(
      statusChangeRecords(statusChange),
      statusChangeEvents(statusChange, context.sourceContract),
      { recoveryTerminalClaims: [statusChange.terminalClaim] },
    )
    .catch(async (error: unknown) => {
      if (isRecoveryTerminalConflict(error)) {
        const proofGap = await recordRecoveryTerminalConflictProofGap(recorder, {
          recommendation: context.recommendation,
          sourceContract: context.sourceContract,
          attemptedObjectRef: statusChange.statusTransition.recoveryRecommendationStatusTransitionId,
          changedByRef: context.input.changedByRef,
        });
        throw new HandshakeProtocolError(error.code, error.message, error.status, {
          ...error.metadata,
          retryability: "recoverable",
          commitState: "committed",
          proofRef: proofGap.proofGapId,
        });
      }
      throw error;
    });
}

export async function buildRecoveryRecommendationStatusChange(
  input: BuildRecoveryRecommendationStatusChangeInput,
): Promise<RecoveryRecommendationStatusChange> {
  assertStatusTransitionInput(input);
  const transitionId = createId("rst");
  const transitionBinding = {
    recoveryRecommendationStatusTransitionId: transitionId,
    recoveryRecommendationId: input.recommendation.recoveryRecommendationId,
    previousStatus: input.recommendation.recommendationStatus,
    nextStatus: input.nextStatus,
    recommendationDigest: input.recommendation.recommendationDigest,
    reasonCode: input.reasonCode,
    changedByRef: input.changedByRef,
    changedAt: input.now,
    supersededByActionContractId: input.supersededByActionContractId,
  } satisfies JsonValue;
  const transitionDigest = await digestCanonical(transitionBinding);
  const recoveryRecommendation = RecoveryRecommendationSchema.parse({
    ...input.recommendation,
    recommendationStatus: input.nextStatus,
    statusChangedAt: input.now,
    statusChangedByRef: input.changedByRef,
    statusReasonCode: input.reasonCode,
    statusReasonSummary: input.reasonSummary,
    supersededByActionContractId: input.supersededByActionContractId,
  });
  const statusTransition = RecoveryRecommendationStatusTransitionSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: input.recommendation.tenantId,
    organizationId: input.recommendation.organizationId,
    createdAt: input.now,
    recoveryRecommendationStatusTransitionId: transitionId,
    recoveryRecommendationId: input.recommendation.recoveryRecommendationId,
    sourceReceiptId: input.recommendation.sourceReceiptId,
    sourceActionContractId: input.recommendation.sourceActionContractId,
    previousStatus: input.recommendation.recommendationStatus,
    nextStatus: input.nextStatus,
    recommendationDigest: input.recommendation.recommendationDigest,
    reasonCode: input.reasonCode,
    reasonSummary: input.reasonSummary,
    changedByRef: input.changedByRef,
    changedAt: input.now,
    supersededByActionContractId: input.supersededByActionContractId,
    transitionDigest,
  });
  return {
    recoveryRecommendation,
    statusTransition,
    terminalClaim: {
      recoveryRecommendationId: input.recommendation.recoveryRecommendationId,
      statusTransitionId: transitionId,
      nextStatus: input.nextStatus,
      claimedAt: input.now,
    },
  };
}

export function statusChangeRecords(statusChange: RecoveryRecommendationStatusChange): ProtocolRecord[] {
  return [
    { objectType: "recovery_recommendation", payload: statusChange.recoveryRecommendation },
    { objectType: "recovery_recommendation_status_transition", payload: statusChange.statusTransition },
  ];
}

export function statusChangeEvents(
  statusChange: RecoveryRecommendationStatusChange,
  sourceContract: ActionContract,
): EventDescriptor[] {
  const { recoveryRecommendation, statusTransition } = statusChange;
  return [
    {
      source: statusTransition,
      eventType: "recovery_status_changed",
      objectRefs: [
        recoveryRecommendation.recoveryRecommendationId,
        statusTransition.recoveryRecommendationStatusTransitionId,
        recoveryRecommendation.sourceReceiptId,
        ...(statusTransition.supersededByActionContractId ? [statusTransition.supersededByActionContractId] : []),
      ],
      streamRefs: actionLifecycleStreamRefs(sourceContract),
      payload: {
        previousStatus: statusTransition.previousStatus,
        nextStatus: statusTransition.nextStatus,
        reasonCode: statusTransition.reasonCode,
        changedByRef: statusTransition.changedByRef,
        supersededByActionContractId: statusTransition.supersededByActionContractId,
        transitionDigest: statusTransition.transitionDigest,
      },
    },
  ];
}

function assertStatusTransitionInput(input: BuildRecoveryRecommendationStatusChangeInput): void {
  if (input.recommendation.recommendationStatus !== "open") {
    throw new HandshakeProtocolError(
      "recovery_recommendation_not_open",
      "Recovery recommendation status can change only from open.",
      409,
    );
  }
  if (input.nextStatus === "superseded" && !input.supersededByActionContractId) {
    throw new HandshakeProtocolError(
      "recovery_superseding_contract_missing",
      "Superseding a recovery recommendation requires a follow-up action contract reference.",
      409,
    );
  }
  if (input.nextStatus === "expired" && input.supersededByActionContractId) {
    throw new HandshakeProtocolError(
      "recovery_expired_has_superseding_contract",
      "Expired recovery recommendations cannot name a superseding action contract.",
      409,
    );
  }
  if (input.nextStatus === "expired") {
    if (
      !input.recommendation.recoveryExpiresAt ||
      Date.parse(input.recommendation.recoveryExpiresAt) > Date.parse(input.now)
    ) {
      throw new HandshakeProtocolError(
        "recovery_not_expired",
        "Recovery recommendation cannot transition to expired before recoveryExpiresAt.",
        409,
      );
    }
  }
}

function assertSupersedingContract(recommendation: RecoveryRecommendation, contract: ActionContract): void {
  if (
    contract.recoveryRecommendationId !== recommendation.recoveryRecommendationId ||
    contract.recoverySourceReceiptId !== recommendation.sourceReceiptId ||
    contract.recoveryRecommendationDigest !== recommendation.recommendationDigest
  ) {
    throw new HandshakeProtocolError(
      "recovery_superseding_contract_mismatch",
      "Superseding action contract must be linked to the recovery recommendation.",
      409,
    );
  }
}

function isRecoveryTerminalConflict(error: unknown): error is HandshakeProtocolError {
  return error instanceof HandshakeProtocolError && error.code === "recovery_terminal_conflict";
}
