import { CANONICALIZER_VERSION, digestCanonical, signCanonicalHmac } from "./canonical";
import { HandshakeProtocolError } from "./errors";
import { actionLifecycleStreamRefs } from "./events";
import { createId, nowIso } from "./ids";
import { ProposeActionContractInputSchema, type ProposeActionContractInput } from "./inputs";
import type { ProtocolRecorder } from "./records";
import { assertRecoveryActionLinkage, loadRecoveryActionLinkage } from "./recovery-action-linkage";
import {
  buildRecoveryRecommendationStatusChange,
  statusChangeEvents,
  statusChangeRecords,
} from "./recovery-recommendation-status";
import { recordRecoveryTerminalConflictProofGap } from "./recovery-terminal-conflicts";
import {
  ActionContractSchema,
  PROTOCOL_VERSION,
  type ActionContract,
  type IntentCompilationRecord,
  type JsonValue,
  type OperatingEnvelope,
  type ReceiverRegistryEntry,
} from "./schemas";
import { guardActionProposal, type TransitionGuardResult } from "./transitions";

export async function proposeActionContract(
  recorder: ProtocolRecorder,
  inputValue: ProposeActionContractInput,
): Promise<ActionContract> {
  const input = ProposeActionContractInputSchema.parse(inputValue);
  const [compilation, envelopeRecord, receiverRecord] = await Promise.all([
    recorder.requiredRecord<IntentCompilationRecord>(
      "intent_compilation",
      input.intentCompilationId,
      "intent_compilation_missing",
    ),
    recorder.requiredRecord<OperatingEnvelope>("operating_envelope", input.envelopeId, "envelope_missing"),
    recorder.requiredRecord<ReceiverRegistryEntry>(
      "receiver_registry_entry",
      input.receiverRegistryEntryId,
      "receiver_registry_entry_missing",
    ),
  ]);
  const envelope = envelopeRecord.payload;
  const receiver = receiverRecord.payload;
  const recoveryLinkage = await loadRecoveryActionLinkage(recorder, input.recoveryRecommendationId);

  assertTransition(
    guardActionProposal({
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      principalId: input.principalId,
      agentId: input.agentId,
      runId: input.runId,
      envelopeId: input.envelopeId,
      receiverId: input.receiverId,
      compilation: compilation.payload,
      envelope,
      receiver,
    }),
  );

  const createdAt = nowIso();
  assertRecoveryActionLinkage(input, recoveryLinkage, createdAt);
  const paramsDigest = await digestCanonical(input.parameters);
  const contractBinding = {
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    intentCompilationId: input.intentCompilationId,
    envelopeId: envelope.envelopeId,
    agentId: input.agentId,
    principalId: input.principalId,
    runId: input.runId,
    sequenceNumber: input.sequenceNumber,
    requiredPriorActionContractIds: input.requiredPriorActionContractIds,
    recoveryRecommendationId: recoveryLinkage?.recommendation.recoveryRecommendationId ?? null,
    recoverySourceReceiptId: recoveryLinkage?.recommendation.sourceReceiptId ?? null,
    recoveryRecommendationDigest: recoveryLinkage?.recommendation.recommendationDigest ?? null,
    issuedAt: createdAt,
    expiresAt: input.expiresAt,
    receiverRegistryEntryId: receiver.receiverRegistryEntryId,
    receiverRegistryVersion: receiver.receiverRegistryVersion,
    receiverId: receiver.receiverId,
    receiverPolicyContractId: receiver.receiverPolicyContractId,
    receiverPolicyVersion: receiver.receiverPolicyVersion,
    actionClass: input.actionClass,
    resourceRef: input.resourceRef,
    paramsDigest,
    purposeCode: input.purposeCode,
    expectedSideEffectCodes: input.expectedSideEffectCodes,
    evidenceRefs: input.evidenceRefs,
    bounds: input.bounds,
    idempotencyKey: input.idempotencyKey,
    canonicalizerVersion: CANONICALIZER_VERSION,
  } satisfies JsonValue;

  const actionContractDigest = await digestCanonical(contractBinding);
  const contractSignature = input.signingSecret ? await signCanonicalHmac(contractBinding, input.signingSecret) : null;
  const contract = ActionContractSchema.parse({
    ...contractBinding,
    schemaVersion: PROTOCOL_VERSION,
    createdAt,
    actionContractId: createId("act"),
    parameters: input.parameters,
    nonSecretParamsSummary: input.nonSecretParamsSummary,
    rollbackHint: input.rollbackHint,
    actionContractDigest,
    contractSignature,
  });
  const recoveryObjectRefs =
    contract.recoveryRecommendationId && contract.recoverySourceReceiptId
      ? [contract.recoveryRecommendationId, contract.recoverySourceReceiptId]
      : [];
  const recoveryStatusChange = recoveryLinkage
    ? await buildRecoveryRecommendationStatusChange({
        recommendation: recoveryLinkage.recommendation,
        sourceContract: recoveryLinkage.sourceContract,
        nextStatus: "superseded",
        reasonCode: "followup_action_contract_proposed",
        reasonSummary: "Recovery recommendation was superseded by a linked follow-up action contract.",
        changedByRef: contract.actionContractId,
        supersededByActionContractId: contract.actionContractId,
        now: createdAt,
      })
    : null;
  const recoveryStatusEvents =
    recoveryStatusChange && recoveryLinkage
      ? statusChangeEvents(recoveryStatusChange, recoveryLinkage.sourceContract)
      : [];

  try {
    await recorder.commitRecordsWithEvents(
      [
        { objectType: "action_contract", payload: contract },
        ...(recoveryStatusChange ? statusChangeRecords(recoveryStatusChange) : []),
      ],
      [
        {
          source: contract,
          eventType: "action_proposed",
          objectRefs: [contract.actionContractId, ...recoveryObjectRefs],
          streamRefs: actionLifecycleStreamRefs(contract),
          payload: {
            actionClass: contract.actionClass,
            receiverId: contract.receiverId,
            resourceRef: contract.resourceRef,
            recoveryRecommendationId: contract.recoveryRecommendationId,
          },
        },
        ...recoveryStatusEvents,
      ],
      { recoveryTerminalClaims: recoveryStatusChange ? [recoveryStatusChange.terminalClaim] : [] },
    );
  } catch (error) {
    if (isRecoveryTerminalConflict(error) && recoveryLinkage) {
      await recordRecoveryTerminalConflictProofGap(recorder, {
        recommendation: recoveryLinkage.recommendation,
        sourceContract: recoveryLinkage.sourceContract,
        attemptedObjectRef: contract.actionContractId,
        changedByRef: contract.actionContractId,
      });
    }
    throw error;
  }
  return contract;
}

function assertTransition(result: TransitionGuardResult): void {
  if (!result.ok) {
    throw new HandshakeProtocolError(result.code, result.message, result.status);
  }
}

function isRecoveryTerminalConflict(error: unknown): error is HandshakeProtocolError {
  return error instanceof HandshakeProtocolError && error.code === "recovery_terminal_conflict";
}
