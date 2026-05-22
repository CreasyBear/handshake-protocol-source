import { CANONICALIZER_VERSION, digestCanonical, signCanonicalHmac } from "../../foundation/canonical";
import { createId, nowIso } from "../../foundation/ids";
import type { ActionType, GatewayRegistryEntry, OperatingEnvelope } from "../catalog-envelope";
import type { CandidateAction, IntentCompilationRecord } from "../intent-compilation";
import { assertRecoveryActionLinkage, type loadRecoveryActionLinkage } from "../recovery";
import type { ProposeActionContractInputSchema } from "./types";
import { ActionContractSchema, PROTOCOL_VERSION, type ActionContract, type JsonValue } from "./types";

type ParsedProposeActionContractInput = ReturnType<typeof ProposeActionContractInputSchema.parse>;

export type ActionContractRecordContext = {
  input: ParsedProposeActionContractInput;
  candidate: CandidateAction;
  compilation: IntentCompilationRecord;
  envelope: OperatingEnvelope;
  gateway: GatewayRegistryEntry;
  actionType: ActionType;
  recoveryLinkage: Awaited<ReturnType<typeof loadRecoveryActionLinkage>>;
};

export type ActionContractRecordPlan = {
  createdAt: string;
  contractBinding: { [key: string]: JsonValue };
  contract: ActionContract;
};

export async function buildActionContractRecord(
  context: ActionContractRecordContext,
): Promise<ActionContractRecordPlan> {
  const { input, candidate, compilation, recoveryLinkage } = context;
  const createdAt = nowIso();
  assertRecoveryActionLinkage(
    {
      tenantId: compilation.tenantId,
      organizationId: compilation.organizationId,
      principalId: compilation.principalId,
      agentId: compilation.agentId,
      runId: compilation.runId,
      sequenceNumber: candidate.sequenceNumber,
      actionClass: candidate.actionClass,
      gatewayId: candidate.gatewayId,
      resourceRef: candidate.resourceRef,
      evidenceRefs: candidate.evidenceRefs,
    },
    recoveryLinkage,
    createdAt,
  );
  const contractBinding = buildContractBinding({ ...context, createdAt });
  const actionContractDigest = await digestCanonical(contractBinding);
  const contractSignature = input.signingSecret ? await signCanonicalHmac(contractBinding, input.signingSecret) : null;
  const contract = ActionContractSchema.parse({
    ...contractBinding,
    schemaVersion: PROTOCOL_VERSION,
    createdAt,
    actionContractId: createId("act"),
    parameters: candidate.parameters,
    nonSecretParamsSummary: candidate.nonSecretParamsSummary,
    secretRefs: candidate.secretRefs,
    gatewayCredentialRefs: candidate.gatewayCredentialRefs,
    rollbackHint: candidate.rollbackHint,
    actionContractDigest,
    contractSignature,
    signaturePosture: input.signingSecret ? "local_hmac" : "unsigned",
    keyIdentityRef: input.signingSecret ? "local:hmac" : null,
    verificationPolicyRef: input.signingSecret ? "local-hmac-only" : null,
  });
  return { createdAt, contractBinding, contract };
}

function buildContractBinding(args: ActionContractRecordContext & { createdAt: string }): { [key: string]: JsonValue } {
  const { input, candidate, compilation, envelope, gateway, actionType, recoveryLinkage, createdAt } = args;
  return {
    tenantId: compilation.tenantId,
    organizationId: compilation.organizationId,
    intentCompilationId: input.intentCompilationId,
    candidateActionId: candidate.candidateActionId,
    candidateDigest: input.candidateDigest,
    envelopeId: envelope.envelopeId,
    operatingEnvelopeDigest: candidate.operatingEnvelopeDigest,
    agentId: compilation.agentId,
    principalId: compilation.principalId,
    participantIdentityBindings: envelope.participantIdentityBindings,
    runId: compilation.runId,
    runtimeAdapterId: compilation.runtimeAdapterId,
    sequenceNumber: candidate.sequenceNumber,
    requiredPriorActionContractIds: candidate.requiredPriorActionContractIds,
    recoveryRecommendationId: recoveryLinkage?.recommendation.recoveryRecommendationId ?? null,
    recoverySourceReceiptId: recoveryLinkage?.recommendation.sourceReceiptId ?? null,
    recoveryRecommendationDigest: recoveryLinkage?.recommendation.recommendationDigest ?? null,
    issuedAt: createdAt,
    expiresAt: candidate.expiresAt,
    gatewayRegistryEntryId: gateway.gatewayRegistryEntryId,
    gatewayRegistryDigest: candidate.gatewayRegistryDigest,
    gatewayRegistryVersion: gateway.gatewayRegistryVersion,
    gatewayId: gateway.gatewayId,
    gatewayPolicyContractId: gateway.gatewayPolicyContractId,
    gatewayPolicyVersion: gateway.gatewayPolicyVersion,
    credentialCustodyStatus: gateway.credentialCustodyStatus,
    enforcementMode: gateway.enforcementMode,
    mutationCredentialHolderRef: gateway.mutationCredentialHolderRef,
    gatewayAuthorityHolderRef: gateway.gatewayAuthorityHolderRef,
    toolCapabilityId: candidate.toolCapabilityId,
    toolCapabilityDigest: candidate.toolCapabilityDigest,
    actionTypeId: candidate.actionTypeId,
    actionTypeDigest: candidate.actionTypeDigest,
    actionClass: candidate.actionClass,
    protectedSurfaceKind: actionType.protectedSurfaceKind,
    resourceRef: candidate.resourceRef,
    requiredProtectedPathState: envelope.requiredProtectedPathState,
    runtimeExecutionId: candidate.runtimeExecutionId,
    runtimeExecutionDigest: candidate.runtimeExecutionDigest,
    generatedExecutionGraphId: candidate.generatedExecutionGraphId,
    generatedExecutionGraphDigest: candidate.generatedExecutionGraphDigest,
    generatedExecutionCoverageStatus: candidate.generatedExecutionCoverageStatus,
    generatedExecutionNodeId: candidate.generatedExecutionNodeId,
    generatedExecutionNodeDigest: candidate.generatedExecutionNodeDigest,
    generatedExecutionCatalogSnapshotDigest: candidate.generatedExecutionCatalogSnapshotDigest,
    generatedExecutionGatewayRegistrySnapshotDigest: candidate.generatedExecutionGatewayRegistrySnapshotDigest,
    generatedExecutionRegistryBindingSetDigest: candidate.generatedExecutionRegistryBindingSetDigest,
    generatedExecutionNodeGatewayBindingDigest: candidate.generatedExecutionNodeGatewayBindingDigest,
    gatewayCredentialRefs: candidate.gatewayCredentialRefs,
    paramsDigest: candidate.paramsDigest,
    purposeCode: candidate.purposeCode,
    expectedSideEffectCodes: candidate.expectedSideEffectCodes,
    evidenceRefs: candidate.evidenceRefs,
    clearingEvidenceRefs: clearingEvidenceRefsJson(candidate.clearingEvidenceRefs),
    bounds: candidate.bounds,
    idempotencyKey: candidate.idempotencyKey,
    canonicalizerVersion: CANONICALIZER_VERSION,
  } satisfies JsonValue;
}

function clearingEvidenceRefsJson(refs: {
  correlationRef?: string | undefined;
  obligationRef?: string | undefined;
  counterpartyRef?: string | undefined;
}): { [key: string]: JsonValue } {
  const json: { [key: string]: JsonValue } = {};
  if (refs.correlationRef !== undefined) json.correlationRef = refs.correlationRef;
  if (refs.obligationRef !== undefined) json.obligationRef = refs.obligationRef;
  if (refs.counterpartyRef !== undefined) json.counterpartyRef = refs.counterpartyRef;
  return json;
}
