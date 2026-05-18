import { CANONICALIZER_VERSION, digestCanonical, signCanonicalHmac } from "../canonical";
import type { ActionType, GatewayRegistryEntry, OperatingEnvelope, ToolCapability } from "../catalog-envelope";
import { HandshakeProtocolError } from "../errors";
import { actionLifecycleStreamRefs } from "../events";
import type { GeneratedExecutionGraph } from "../generated-execution-graph";
import { createId, nowIso } from "../ids";
import type { CandidateAction, IntentCompilationRecord } from "../intent-compilation";
import { ProposeActionContractInputSchema, type ProposeActionContractInput } from "./types";
import type { ProtocolRecorder } from "../records";
import { assertRecoveryActionLinkage, loadRecoveryActionLinkage } from "../recovery";
import type { RuntimeExecutionRecord } from "../runtime-evidence";
import {
  buildRecoveryRecommendationStatusChange,
  statusChangeEvents,
  statusChangeRecords,
  recordRecoveryTerminalConflictProofGap,
} from "../recovery";
import {
  ActionContractSchema,
  PROTOCOL_VERSION,
  type ActionContract,
  type JsonValue,
} from "./types";
import { guardActionProposal } from "./guards";
import type { TransitionGuardResult } from "../transition-guards";

export async function proposeActionContract(
  recorder: ProtocolRecorder,
  inputValue: ProposeActionContractInput,
): Promise<ActionContract> {
  const input = ProposeActionContractInputSchema.parse(inputValue);
  const compilation = await recorder.requiredRecord<IntentCompilationRecord>(
    "intent_compilation",
    input.intentCompilationId,
    "intent_compilation_missing",
  );
  const candidate = compilation.payload.candidateAction;
  assertCandidateMatchesProposal(candidate, input.candidateActionId, input.candidateDigest);
  const [envelopeRecord, gatewayRecord, toolRecord, actionTypeRecord, runtimeExecutionRecord, generatedExecutionGraphRecord] = await Promise.all([
    recorder.requiredRecord<OperatingEnvelope>("operating_envelope", candidate.operatingEnvelopeId, "envelope_missing"),
    recorder.requiredRecord<GatewayRegistryEntry>(
      "gateway_registry_entry",
      candidate.gatewayRegistryEntryId,
      "gateway_registry_entry_missing",
    ),
    recorder.requiredRecord<ToolCapability>("tool_capability", candidate.toolCapabilityId, "tool_capability_missing"),
    recorder.requiredRecord<ActionType>("action_type", candidate.actionTypeId, "action_type_missing"),
    candidate.runtimeExecutionId
      ? recorder.requiredRecord<RuntimeExecutionRecord>(
          "runtime_execution",
          candidate.runtimeExecutionId,
          "runtime_execution_missing",
        )
      : Promise.resolve(null),
    candidate.generatedExecutionGraphId
      ? recorder.requiredRecord<GeneratedExecutionGraph>(
          "generated_execution_graph",
          candidate.generatedExecutionGraphId,
          "generated_execution_graph_missing",
        )
      : Promise.resolve(null),
  ]);
  assertPinnedDigest("operating_envelope", envelopeRecord.canonicalDigest, candidate.operatingEnvelopeDigest);
  assertPinnedDigest("gateway_registry_entry", gatewayRecord.canonicalDigest, candidate.gatewayRegistryDigest);
  assertPinnedDigest("tool_capability", toolRecord.canonicalDigest, candidate.toolCapabilityDigest);
  assertPinnedDigest("action_type", actionTypeRecord.canonicalDigest, candidate.actionTypeDigest);
  if (runtimeExecutionRecord) {
    assertPinnedDigest("runtime_execution", runtimeExecutionRecord.payload.runtimeExecutionDigest, candidate.runtimeExecutionDigest);
  }
  if (generatedExecutionGraphRecord) {
    assertGeneratedExecutionGraphPinned(candidate, generatedExecutionGraphRecord.payload);
  }
  const recomputedParamsDigest = await digestCanonical({
    parameters: candidate.parameters,
    secretRefs: candidate.secretRefs,
  });
  if (recomputedParamsDigest !== candidate.paramsDigest) {
    throw new HandshakeProtocolError(
      "candidate_params_digest_mismatch",
      "Candidate params digest no longer matches stored candidate parameter material.",
      409,
    );
  }
  const envelope = envelopeRecord.payload;
  const gateway = gatewayRecord.payload;
  const recoveryLinkage = await loadRecoveryActionLinkage(recorder, candidate.recoveryRecommendationId);

  assertTransition(
    guardActionProposal({
      tenantId: compilation.payload.tenantId,
      organizationId: compilation.payload.organizationId,
      principalId: compilation.payload.principalId,
      agentId: compilation.payload.agentId,
      runId: compilation.payload.runId,
      envelopeId: candidate.operatingEnvelopeId,
      gatewayId: candidate.gatewayId,
      compilation: compilation.payload,
      envelope,
      gateway,
    }),
  );

  const createdAt = nowIso();
  assertRecoveryActionLinkage(
    {
      tenantId: compilation.payload.tenantId,
      organizationId: compilation.payload.organizationId,
      principalId: compilation.payload.principalId,
      agentId: compilation.payload.agentId,
      runId: compilation.payload.runId,
      sequenceNumber: candidate.sequenceNumber,
      actionClass: candidate.actionClass,
      gatewayId: candidate.gatewayId,
      resourceRef: candidate.resourceRef,
      evidenceRefs: candidate.evidenceRefs,
    },
    recoveryLinkage,
    createdAt,
  );
  const contractBinding = {
    tenantId: compilation.payload.tenantId,
    organizationId: compilation.payload.organizationId,
    intentCompilationId: input.intentCompilationId,
    candidateActionId: candidate.candidateActionId,
    candidateDigest: input.candidateDigest,
    envelopeId: envelope.envelopeId,
    operatingEnvelopeDigest: candidate.operatingEnvelopeDigest,
    agentId: compilation.payload.agentId,
    principalId: compilation.payload.principalId,
    runId: compilation.payload.runId,
    runtimeAdapterId: compilation.payload.runtimeAdapterId,
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
    protectedSurfaceKind: actionTypeRecord.payload.protectedSurfaceKind,
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
    paramsDigest: candidate.paramsDigest,
    purposeCode: candidate.purposeCode,
    expectedSideEffectCodes: candidate.expectedSideEffectCodes,
    evidenceRefs: candidate.evidenceRefs,
    bounds: candidate.bounds,
    idempotencyKey: candidate.idempotencyKey,
    canonicalizerVersion: CANONICALIZER_VERSION,
  } satisfies JsonValue;

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
    rollbackHint: candidate.rollbackHint,
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
            gatewayId: contract.gatewayId,
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
      const proofGap = await recordRecoveryTerminalConflictProofGap(recorder, {
        recommendation: recoveryLinkage.recommendation,
        sourceContract: recoveryLinkage.sourceContract,
        attemptedObjectRef: contract.actionContractId,
        changedByRef: contract.actionContractId,
      });
      throw new HandshakeProtocolError(error.code, error.message, error.status, {
        ...error.metadata,
        retryability: "recoverable",
        commitState: "committed",
        proofRef: proofGap.proofGapId,
      });
    }
    throw error;
  }
  return contract;
}

function assertCandidateMatchesProposal(candidate: CandidateAction, candidateActionId: string, candidateDigest: string): void {
  if (candidate.candidateActionId !== candidateActionId) {
    throw new HandshakeProtocolError(
      "candidate_action_mismatch",
      "Proposal candidateActionId must match the candidate embedded in the intent compilation record.",
      409,
    );
  }
  if (candidate.candidateStatus !== "contractable") {
    throw new HandshakeProtocolError(
      "intent_compilation_not_contractable",
      "Candidate is rejected; no action contract may be emitted.",
      409,
    );
  }
  if (!candidate.candidateDigest || candidate.candidateDigest !== candidateDigest) {
    throw new HandshakeProtocolError(
      "candidate_digest_mismatch",
      "Proposal candidateDigest must match the candidate embedded in the intent compilation record.",
      409,
    );
  }
}

function assertPinnedDigest(objectType: string, currentDigest: string, candidateDigest: string | null): void {
  if (!candidateDigest) {
    throw new HandshakeProtocolError(
      "candidate_digest_missing",
      `Candidate is missing the pinned ${objectType} digest.`,
      409,
    );
  }
  if (currentDigest !== candidateDigest) {
    throw new HandshakeProtocolError(
      "candidate_catalog_digest_drift",
      `Candidate pinned ${objectType} digest does not match the durable record now loaded for proposal.`,
      409,
    );
  }
}

function assertGeneratedExecutionGraphPinned(candidate: CandidateAction, graph: GeneratedExecutionGraph): void {
  assertPinnedDigest("generated_execution_graph", graph.graphDigest, candidate.generatedExecutionGraphDigest);
  if (
    graph.runtimeExecutionId !== candidate.runtimeExecutionId ||
    graph.runtimeExecutionDigest !== candidate.runtimeExecutionDigest
  ) {
    throw new HandshakeProtocolError(
      "candidate_generated_execution_graph_runtime_mismatch",
      "Candidate generated execution graph is not bound to the same runtime execution as the candidate.",
      409,
    );
  }
  if (graph.coverageStatus !== "fully_covered_no_unsupported_nodes") {
    throw new HandshakeProtocolError(
      "candidate_generated_execution_graph_not_contractable",
      "Generated execution graph must be fully covered before an action contract can be proposed.",
      409,
    );
  }
  if (candidate.generatedExecutionCoverageStatus !== graph.coverageStatus) {
    throw new HandshakeProtocolError(
      "candidate_generated_execution_graph_status_mismatch",
      "Candidate generated execution graph coverage status no longer matches the stored graph.",
      409,
    );
  }
  const node = graph.nodes.find((entry) => entry.nodeId === candidate.generatedExecutionNodeId) ?? null;
  if (!node) {
    throw new HandshakeProtocolError(
      "candidate_generated_execution_node_missing",
      "Candidate generated execution node was not found in the stored graph.",
      409,
    );
  }
  if (node.nodeDigest !== candidate.generatedExecutionNodeDigest) {
    throw new HandshakeProtocolError(
      "candidate_generated_execution_node_digest_mismatch",
      "Candidate generated execution node digest no longer matches the stored graph node.",
      409,
    );
  }
  if (node.nodeGatewayBindingDigest !== candidate.generatedExecutionNodeGatewayBindingDigest) {
    throw new HandshakeProtocolError(
      "candidate_generated_execution_node_gateway_binding_mismatch",
      "Candidate generated execution node gateway binding no longer matches the stored graph node.",
      409,
    );
  }
}

function assertTransition(result: TransitionGuardResult): void {
  if (!result.ok) {
    throw new HandshakeProtocolError(result.code, result.message, result.status);
  }
}

function isRecoveryTerminalConflict(error: unknown): error is HandshakeProtocolError {
  return error instanceof HandshakeProtocolError && error.code === "recovery_terminal_conflict";
}
