import { protectedActionParamsDigest } from "../../foundation/canonical";
import type { ActionType, GatewayRegistryEntry, OperatingEnvelope, ToolCapability } from "../catalog-envelope";
import { HandshakeProtocolError } from "../../foundation/errors";
import { actionLifecycleStreamRefs } from "../../events/chains";
import type { GeneratedExecutionGraph } from "../generated-execution-graph";
import type { CandidateAction, IntentCompilationRecord } from "../intent-compilation";
import { ProposeActionContractInputSchema, type ProposeActionContractInput } from "./types";
import type { ProtocolRecorder } from "../../events/records";
import { evaluateGatewayCredentialBindings } from "../credential-custody";
import { evaluateDelegatedAuthorityBindings } from "../delegated-authority";
import { loadRecoveryActionLinkage } from "../recovery";
import type { RuntimeExecutionRecord } from "../runtime-evidence";
import {
  buildRecoveryRecommendationStatusChange,
  statusChangeEvents,
  statusChangeRecords,
  recordRecoveryTerminalConflictProofGap,
} from "../recovery";
import type { ActionContract, JsonValue } from "./types";
import { guardActionProposal } from "./guards";
import type { TransitionGuardResult } from "../../foundation/transition-guards";
import type { ProtocolStore, StoredProtocolRecord } from "../../store/port";
import { buildActionContractRecord } from "./contract-record";

type ParsedProposeActionContractInput = ReturnType<typeof ProposeActionContractInputSchema.parse>;

type ActionContractProposalContext = {
  input: ParsedProposeActionContractInput;
  compilationRecord: StoredProtocolRecord<IntentCompilationRecord>;
  candidate: CandidateAction;
  envelopeRecord: StoredProtocolRecord<OperatingEnvelope>;
  gatewayRecord: StoredProtocolRecord<GatewayRegistryEntry>;
  toolRecord: StoredProtocolRecord<ToolCapability>;
  actionTypeRecord: StoredProtocolRecord<ActionType>;
  runtimeExecutionRecord: StoredProtocolRecord<RuntimeExecutionRecord> | null;
  generatedExecutionGraphRecord: StoredProtocolRecord<GeneratedExecutionGraph> | null;
  recoveryLinkage: Awaited<ReturnType<typeof loadRecoveryActionLinkage>>;
};

type ActionContractBuildPlan = {
  context: ActionContractProposalContext;
  createdAt: string;
  contractBinding: { [key: string]: JsonValue };
  contract: ActionContract;
};

type ActionContractCommitPlan = ActionContractBuildPlan & {
  recoveryObjectRefs: string[];
  recoveryStatusChange: Awaited<ReturnType<typeof buildRecoveryRecommendationStatusChange>> | null;
  recoveryStatusEvents: ReturnType<typeof statusChangeEvents>;
};

export async function proposeActionContract(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  inputValue: ProposeActionContractInput,
): Promise<ActionContract> {
  const input = ProposeActionContractInputSchema.parse(inputValue);
  const context = await getActionContractProposalContext(recorder, input);
  await assertActionContractProposalContext(context);
  const buildPlan = await buildActionContractPlan(input, context);
  await assertGatewayCredentialBindings(store, buildPlan.contract);
  await assertDelegatedAuthorityBindings(store, buildPlan.contract);
  const commitPlan = await buildActionContractCommitPlan(buildPlan);
  await commitActionContractPlan(recorder, commitPlan);
  return buildPlan.contract;
}

async function assertGatewayCredentialBindings(store: ProtocolStore, contract: ActionContract): Promise<void> {
  const evaluation = await evaluateGatewayCredentialBindings(store, contract, contract.issuedAt);
  if (!evaluation.ok) {
    throw new HandshakeProtocolError(evaluation.reasonCode, evaluation.reason, 409);
  }
}

async function assertDelegatedAuthorityBindings(store: ProtocolStore, contract: ActionContract): Promise<void> {
  const evaluation = await evaluateDelegatedAuthorityBindings(store, contract, contract.issuedAt);
  if (!evaluation.ok) {
    throw new HandshakeProtocolError(evaluation.reasonCode, evaluation.reason, 409);
  }
}

async function getActionContractProposalContext(
  recorder: ProtocolRecorder,
  input: ParsedProposeActionContractInput,
): Promise<ActionContractProposalContext> {
  const compilation = await recorder.requiredRecord<IntentCompilationRecord>(
    "intent_compilation",
    input.intentCompilationId,
    "intent_compilation_missing",
  );
  const candidate = compilation.payload.candidateAction;
  assertCandidateMatchesProposal(candidate, input.candidateActionId, input.candidateDigest);
  const [
    envelopeRecord,
    gatewayRecord,
    toolRecord,
    actionTypeRecord,
    runtimeExecutionRecord,
    generatedExecutionGraphRecord,
  ] = await Promise.all([
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
  const recoveryLinkage = await loadRecoveryActionLinkage(recorder, candidate.recoveryRecommendationId);
  return {
    input,
    compilationRecord: compilation,
    candidate,
    envelopeRecord,
    gatewayRecord,
    toolRecord,
    actionTypeRecord,
    runtimeExecutionRecord,
    generatedExecutionGraphRecord,
    recoveryLinkage,
  };
}

async function assertActionContractProposalContext(context: ActionContractProposalContext): Promise<void> {
  const { candidate, compilationRecord, envelopeRecord, gatewayRecord, toolRecord, actionTypeRecord } = context;
  assertPinnedDigest("operating_envelope", envelopeRecord.canonicalDigest, candidate.operatingEnvelopeDigest);
  assertPinnedDigest("gateway_registry_entry", gatewayRecord.canonicalDigest, candidate.gatewayRegistryDigest);
  assertPinnedDigest("tool_capability", toolRecord.canonicalDigest, candidate.toolCapabilityDigest);
  assertPinnedDigest("action_type", actionTypeRecord.canonicalDigest, candidate.actionTypeDigest);
  assertRuntimeExecutionPinned(candidate, context.runtimeExecutionRecord);
  assertGeneratedExecutionGraphRecordPinned(candidate, context.generatedExecutionGraphRecord);
  const recomputedParamsDigest = await protectedActionParamsDigest({
    parameters: candidate.parameters,
    secretRefs: candidate.secretRefs,
    gatewayCredentialRefs: candidate.gatewayCredentialRefs,
    delegatedAuthorityRefs: candidate.delegatedAuthorityRefs,
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

  assertTransition(
    guardActionProposal({
      tenantId: compilationRecord.payload.tenantId,
      organizationId: compilationRecord.payload.organizationId,
      principalId: compilationRecord.payload.principalId,
      agentId: compilationRecord.payload.agentId,
      runId: compilationRecord.payload.runId,
      envelopeId: candidate.operatingEnvelopeId,
      gatewayId: candidate.gatewayId,
      compilation: compilationRecord.payload,
      envelope,
      gateway,
    }),
  );
}

async function buildActionContractPlan(
  input: ParsedProposeActionContractInput,
  context: ActionContractProposalContext,
): Promise<ActionContractBuildPlan> {
  const { candidate, compilationRecord, envelopeRecord, gatewayRecord, actionTypeRecord, recoveryLinkage } = context;
  const recordPlan = await buildActionContractRecord({
    input,
    candidate,
    compilation: compilationRecord.payload,
    envelope: envelopeRecord.payload,
    gateway: gatewayRecord.payload,
    actionType: actionTypeRecord.payload,
    recoveryLinkage,
  });
  return { context, ...recordPlan };
}

async function buildActionContractCommitPlan(buildPlan: ActionContractBuildPlan): Promise<ActionContractCommitPlan> {
  const { contract, context, createdAt } = buildPlan;
  const { recoveryLinkage } = context;
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
  return { ...buildPlan, recoveryObjectRefs, recoveryStatusChange, recoveryStatusEvents };
}

async function commitActionContractPlan(recorder: ProtocolRecorder, plan: ActionContractCommitPlan): Promise<void> {
  const { contract, context, recoveryObjectRefs, recoveryStatusChange, recoveryStatusEvents } = plan;
  const { recoveryLinkage } = context;
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
}

function assertCandidateMatchesProposal(
  candidate: CandidateAction,
  candidateActionId: string,
  candidateDigest: string,
): void {
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

function assertRuntimeExecutionPinned(
  candidate: CandidateAction,
  runtimeExecutionRecord: StoredProtocolRecord<RuntimeExecutionRecord> | null,
): void {
  if (!runtimeExecutionRecord) return;
  assertPinnedDigest(
    "runtime_execution",
    runtimeExecutionRecord.payload.runtimeExecutionDigest,
    candidate.runtimeExecutionDigest,
  );
}

function assertGeneratedExecutionGraphRecordPinned(
  candidate: CandidateAction,
  generatedExecutionGraphRecord: StoredProtocolRecord<GeneratedExecutionGraph> | null,
): void {
  if (!generatedExecutionGraphRecord) return;
  assertGeneratedExecutionGraphPinned(candidate, generatedExecutionGraphRecord.payload);
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
