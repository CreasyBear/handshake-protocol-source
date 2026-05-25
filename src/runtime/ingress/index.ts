import { z } from "zod";
import { AuthMdProtectedApiCallRuntimeConfigSchema } from "../../adapters/auth-md/action-proposal";
import { X402PaymentRuntimeConfigSchema } from "../../adapters/x402-payment/action-proposal";
import type { ActionContract, ProposeActionContractInput } from "../../protocol/areas/action-contract";
import type {
  CreateGeneratedExecutionGraphInput,
  GeneratedExecutionGraph,
  GeneratedExecutionNodeInput,
  GraphEvidenceIssuerContext,
} from "../../protocol/areas/generated-execution-graph";
import type { CompileIntentInput, IntentCompilationRecord } from "../../protocol/areas/intent-compilation";
import type { CreateRuntimeExecutionInput, RuntimeExecutionRecord } from "../../protocol/areas/runtime-evidence";
import type {
  CreateToolCallDraftInput,
  ToolCallDraft,
  TransitionToolCallDraftInput,
} from "../../protocol/areas/tool-call-draft";
import { PackageInstallRuntimeConfigSchema } from "../package-install/action-proposal";
import { digestCanonical, protectedActionParamsDigest } from "../../protocol/foundation/canonical";
import type { JsonValue } from "../../protocol/foundation/schema-core";
import {
  buildCompileIntentInputForDispatch,
  dispatchGeneratedCodeOrSpecRef,
  dispatchSpecificRefusalReasonCodes,
  isAmbiguousDispatch,
  isRawSiblingDispatch,
  runtimeConfigForDispatch,
  runtimeIngressEvidenceRefs,
  signingSecretForDispatch,
  supportedGrammarVersionForBlock,
  type RuntimeIngressConfig,
} from "./families";
import { runtimeIngressDispatchNodeId } from "./node-ids";
import {
  RuntimeIngressDispatchBlockSchema,
  type ParsedRuntimeIngressDispatchBlock,
  type ParsedRuntimeIngressObservedDispatch,
  type RuntimeIngressDispatchBlock,
} from "./schemas";
export { RuntimeIngressDispatchBlockSchema, RuntimeIngressObservedDispatchSchema } from "./schemas";
export { runtimeIngressDispatchNodeId } from "./node-ids";
export type { RuntimeIngressConfig } from "./families";
export type {
  ParsedAuthMdProtectedApiCallDispatch,
  ParsedPackageInstallDispatch,
  ParsedRuntimeIngressDispatchBlock,
  ParsedRuntimeIngressObservedDispatch,
  ParsedX402PaymentDispatch,
  RuntimeIngressDispatchBlock,
  RuntimeIngressDispatchBlockRefs,
  RuntimeIngressObservedDispatch,
} from "./schemas";

export const RuntimeIngressConfigSchema = z
  .strictObject({
    packageInstall: PackageInstallRuntimeConfigSchema.optional(),
    x402Payment: X402PaymentRuntimeConfigSchema.optional(),
    authMdProtectedApiCall: AuthMdProtectedApiCallRuntimeConfigSchema.optional(),
  })
  .superRefine((config, context) => {
    if (!config.packageInstall && !config.x402Payment && !config.authMdProtectedApiCall) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Runtime ingress proposal requires at least one dispatch-family config.",
        path: ["config"],
      });
    }
  });

export const RuntimeIngressProposalInputSchema = z
  .strictObject({
    tenantId: z.string().min(1),
    organizationId: z.string().min(1),
    config: RuntimeIngressConfigSchema,
    dispatchBlock: RuntimeIngressDispatchBlockSchema,
  })
  .superRefine((input, context) => {
    const scopedConfigs = [
      ["packageInstall", input.config.packageInstall],
      ["x402Payment", input.config.x402Payment],
      ["authMdProtectedApiCall", input.config.authMdProtectedApiCall],
    ] as const;
    for (const [family, config] of scopedConfigs) {
      if (!config) continue;
      if (config.tenantId !== input.tenantId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${family} runtime config tenantId must match the request tenantId.`,
          path: ["config", family, "tenantId"],
        });
      }
      if (config.organizationId !== input.organizationId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${family} runtime config organizationId must match the request organizationId.`,
          path: ["config", family, "organizationId"],
        });
      }
    }
  });

export type RuntimeIngressProposalInput = z.input<typeof RuntimeIngressProposalInputSchema>;

export type RuntimeIngressResponsePosture = {
  schemaVersion: "handshake.runtime-ingress.outcome.v1";
  authorityCreated: false;
  authorityCertificateMinted: false;
  credentialMaterialIncluded: false;
  gatewayCheckPerformed: false;
  greenlightCreated: false;
  mutationAttempted: false;
  mutationCommandIncluded: false;
  rawInternalRecordIncluded: false;
  receiptExportCreated: false;
  reasonCodes: string[];
  nextAction: "read_evidence" | "recraft_request" | "stop";
  retryability: "not_retryable" | "retryable_after_recraft";
  redactionProfileRef: "runtime-ingress:v0.1-redacted";
  evidenceRefs: string[];
  runtimeExecutionRef: string;
  generatedExecutionGraphRef: string;
  graphCoverageStatus: GeneratedExecutionGraph["coverageStatus"];
  toolCallDraftRefs: string[];
  intentCompilationRefs: string[];
  actionContractRefs: string[];
  refusalRefs: string[];
  dispatchCount: number;
};

export type RuntimeIngressProtocol = {
  compileIntent(input: CompileIntentInput): Promise<IntentCompilationRecord>;
  proposeActionContract(input: ProposeActionContractInput): Promise<ActionContract>;
  createRuntimeExecution(input: CreateRuntimeExecutionInput): Promise<RuntimeExecutionRecord>;
  createGeneratedExecutionGraph(
    input: CreateGeneratedExecutionGraphInput,
    issuerContext: GraphEvidenceIssuerContext,
  ): Promise<GeneratedExecutionGraph>;
  createToolCallDraft(input: CreateToolCallDraftInput): Promise<ToolCallDraft>;
  transitionToolCallDraft(input: TransitionToolCallDraftInput): Promise<ToolCallDraft>;
};

export type RuntimeIngressActionProposal =
  | {
      outcome: "action_contract_proposed";
      dispatchRef: string;
      sequenceNumber: number;
      toolCallDraft: ToolCallDraft;
      intentCompilation: IntentCompilationRecord;
      actionContract: ActionContract;
      refusalReasonCodes: [];
    }
  | {
      outcome: "intent_compilation_refused";
      dispatchRef: string;
      sequenceNumber: number;
      toolCallDraft: ToolCallDraft;
      intentCompilation: IntentCompilationRecord;
      actionContract: null;
      refusalReasonCodes: string[];
    };

export type RuntimeIngressResult = {
  outcome: "action_contracts_proposed" | "one_or_more_dispatches_refused";
  responsePosture: RuntimeIngressResponsePosture;
  runtimeExecution: RuntimeExecutionRecord;
  generatedExecutionGraph: GeneratedExecutionGraph;
  proposals: RuntimeIngressActionProposal[];
};

export async function proposeRuntimeIngressActionContracts(
  protocol: RuntimeIngressProtocol,
  config: RuntimeIngressConfig,
  blockValue: RuntimeIngressDispatchBlock,
): Promise<RuntimeIngressResult> {
  const block = RuntimeIngressDispatchBlockSchema.parse(blockValue);
  const runtimeExecution = await protocol.createRuntimeExecution(
    await buildRuntimeIngressExecutionInput(config, block),
  );
  const graph = await protocol.createGeneratedExecutionGraph(
    await buildRuntimeIngressGraphInput(config, block, runtimeExecution),
    runtimeIngressGraphIssuerContext(config, block, runtimeExecution),
  );
  const proposals: RuntimeIngressActionProposal[] = [];
  const requiredPriorActionContractIds: string[] = [];

  for (const [index, dispatch] of block.dispatches.entries()) {
    const sequenceNumber = index + 1;
    const compileInput = await buildCompileIntentInputForDispatch(
      config,
      block,
      dispatch,
      sequenceNumber,
      graph,
      requiredPriorActionContractIds,
    );
    const toolCallDraft = await createFinalizedToolCallDraft(protocol, compileInput);
    const intentCompilation = await protocol.compileIntent({
      ...compileInput,
      toolCallDraftId: toolCallDraft.toolCallDraftId,
    });
    const refusalReasonCodes = refusalReasonCodesForCompilation(intentCompilation);
    if (refusalReasonCodes.length > 0) {
      proposals.push({
        outcome: "intent_compilation_refused",
        dispatchRef: dispatch.dispatchRef,
        sequenceNumber,
        toolCallDraft,
        intentCompilation,
        actionContract: null,
        refusalReasonCodes,
      });
      continue;
    }

    const actionContract = await protocol.proposeActionContract({
      intentCompilationId: intentCompilation.intentCompilationId,
      candidateActionId: intentCompilation.candidateAction.candidateActionId,
      candidateDigest: requireCandidateDigest(intentCompilation.candidateAction.candidateDigest),
      signingSecret: signingSecretForDispatch(config, dispatch),
    });
    proposals.push({
      outcome: "action_contract_proposed",
      dispatchRef: dispatch.dispatchRef,
      sequenceNumber,
      toolCallDraft,
      intentCompilation,
      actionContract,
      refusalReasonCodes: [],
    });
    requiredPriorActionContractIds.push(actionContract.actionContractId);
  }

  const outcome = proposals.every((proposal) => proposal.outcome === "action_contract_proposed")
    ? "action_contracts_proposed"
    : "one_or_more_dispatches_refused";
  return {
    outcome,
    responsePosture: runtimeIngressResponsePosture(outcome, block, runtimeExecution, graph, proposals),
    runtimeExecution,
    generatedExecutionGraph: graph,
    proposals,
  };
}

function runtimeIngressResponsePosture(
  outcome: RuntimeIngressResult["outcome"],
  block: ParsedRuntimeIngressDispatchBlock,
  runtimeExecution: RuntimeExecutionRecord,
  graph: GeneratedExecutionGraph,
  proposals: RuntimeIngressActionProposal[],
): RuntimeIngressResponsePosture {
  const reasonCodes = unique([
    ...graph.terminalReasonCodes,
    ...proposals.flatMap((proposal) => proposal.refusalReasonCodes),
    ...(runtimeExecution.loopDetected ? ["runtime_ingress_loop_detected"] : []),
    ...(runtimeExecution.retryDetected ? ["runtime_ingress_retry_detected"] : []),
    ...(runtimeExecution.branchDetected ? ["runtime_ingress_branch_detected"] : []),
  ]);
  const nextAction =
    outcome === "action_contracts_proposed"
      ? "read_evidence"
      : graph.coverageStatus === "contains_bypass_risk"
        ? "stop"
        : "recraft_request";
  return {
    schemaVersion: "handshake.runtime-ingress.outcome.v1",
    authorityCreated: false,
    authorityCertificateMinted: false,
    credentialMaterialIncluded: false,
    gatewayCheckPerformed: false,
    greenlightCreated: false,
    mutationAttempted: false,
    mutationCommandIncluded: false,
    rawInternalRecordIncluded: false,
    receiptExportCreated: false,
    reasonCodes,
    nextAction,
    retryability: nextAction === "recraft_request" ? "retryable_after_recraft" : "not_retryable",
    redactionProfileRef: "runtime-ingress:v0.1-redacted",
    evidenceRefs: unique([
      ...runtimeIngressEvidenceRefs(block),
      `runtime_execution:${runtimeExecution.runtimeExecutionId}`,
      `generated_execution_graph:${graph.generatedExecutionGraphId}`,
      ...proposals.flatMap((proposal) => [
        `tool_call_draft:${proposal.toolCallDraft.toolCallDraftId}`,
        `intent_compilation:${proposal.intentCompilation.intentCompilationId}`,
      ]),
    ]),
    runtimeExecutionRef: runtimeExecution.runtimeExecutionId,
    generatedExecutionGraphRef: graph.generatedExecutionGraphId,
    graphCoverageStatus: graph.coverageStatus,
    toolCallDraftRefs: proposals.map((proposal) => proposal.toolCallDraft.toolCallDraftId),
    intentCompilationRefs: proposals.map((proposal) => proposal.intentCompilation.intentCompilationId),
    actionContractRefs: proposals
      .map((proposal) => proposal.actionContract?.actionContractId ?? null)
      .filter((ref): ref is string => ref !== null),
    refusalRefs: [],
    dispatchCount: block.dispatches.length,
  };
}

async function buildRuntimeIngressExecutionInput(
  config: RuntimeIngressConfig,
  block: ParsedRuntimeIngressDispatchBlock,
): Promise<CreateRuntimeExecutionInput> {
  const baseConfig = runtimeConfigForDispatch(config, firstDispatch(block));
  const generatedRefs = unique([
    block.generatedCodeOrSpecRef,
    ...block.dispatches.map((dispatch, index) => dispatchGeneratedCodeOrSpecRef(block, dispatch, index + 1)),
  ]);
  return {
    tenantId: baseConfig.tenantId,
    organizationId: baseConfig.organizationId,
    principalIntentRef: block.principalIntentRef,
    principalId: baseConfig.principalId,
    agentId: baseConfig.agentId,
    runId: baseConfig.runId,
    runtimeAdapterId: baseConfig.runtimeAdapterId,
    executionShape: block.dispatches.length === 1 ? "single_tool_call" : "tool_dispatch_chain",
    runtimePosture: "hook_assisted",
    executionBlockRef: block.executionBlockRef ?? block.generatedCodeOrSpecRef,
    executionBlockDigest: await digestCanonical({
      dispatchBoundaryRef: block.dispatchBoundaryRef,
      generatedCodeOrSpecRef: block.generatedCodeOrSpecRef,
      dispatches: block.dispatches,
    } as JsonValue),
    generatedCodeOrSpecRefs: generatedRefs,
    allowedToolCapabilityIds: unique(
      block.dispatches.map((dispatch) => runtimeConfigForDispatch(config, dispatch).toolCapabilityId),
    ),
    observedToolCallRefs: block.dispatches.map((dispatch) => dispatch.dispatchRef),
    observedConsequentialCallCount: block.dispatches.length,
    loopDetected: block.dispatches.some((dispatch) => dispatch.loopIteration !== null),
    retryDetected: block.dispatches.some((dispatch) => dispatch.retryOfDispatchRef !== null),
    branchDetected: block.dispatches.some((dispatch) => dispatch.branchRef !== null),
    dynamicToolConstructionDetected: block.dispatches.some((dispatch) => dispatch.dynamicToolConstructionDetected),
    unobservedRegionRefs: unique([
      ...block.unobservedRegionRefs,
      ...block.dispatches.flatMap((dispatch) => dispatch.lateBoundParameterRefs),
    ]),
    accessPosture: "controlled_outbound",
    uncertaintyMarkers: [],
    refusalReasonCodes: runtimeIngressDispatchRefusalReasonCodes(block),
    evidenceRefs: runtimeIngressEvidenceRefs(block),
  };
}

async function buildRuntimeIngressGraphInput(
  config: RuntimeIngressConfig,
  block: ParsedRuntimeIngressDispatchBlock,
  runtimeExecution: RuntimeExecutionRecord,
): Promise<CreateGeneratedExecutionGraphInput> {
  const nodes = await Promise.all(
    block.dispatches.map((dispatch, index) => buildRuntimeIngressGraphNode(config, block, dispatch, index + 1)),
  );
  const nodeGatewayBindingDigests = nodes
    .map((node) => node.nodeGatewayBindingDigest)
    .filter((digest): digest is `sha256:${string}` => Boolean(digest));

  return {
    runtimeExecutionId: runtimeExecution.runtimeExecutionId,
    graphNonce: block.graphNonce ?? `nonce_${runtimeExecution.runtimeExecutionId}`,
    parserVersion: "handshake-runtime-dispatch-ingress-0.2.4",
    supportedGrammarVersion: supportedGrammarVersionForBlock(block),
    entryNodeIds: nodes[0] ? [nodes[0].nodeId] : [],
    edges: edgesForDispatches(block.dispatches),
    maxNodeCount: Math.max(64, nodes.length),
    maxEdgeCount: Math.max(128, Math.max(0, nodes.length - 1)),
    maxDepth: Math.max(16, nodes.length),
    maxGraphByteSize: 65536,
    truncationStatus: block.truncationStatus,
    catalogSnapshotDigest: await digestCanonical({
      dispatchCatalogs: block.dispatches.map((dispatch) => {
        const dispatchConfig = runtimeConfigForDispatch(config, dispatch);
        return {
          toolCatalogRef: dispatchConfig.toolCatalogRef,
          actionCatalogRef: dispatchConfig.actionCatalogRef,
          toolCapabilityId: dispatchConfig.toolCapabilityId,
          actionTypeId: dispatchConfig.actionTypeId,
        };
      }),
    } as JsonValue),
    gatewayRegistrySnapshotDigest: await digestCanonical({
      gatewayRegistryEntries: block.dispatches.map((dispatch) => {
        const dispatchConfig = runtimeConfigForDispatch(config, dispatch);
        return {
          gatewayRegistryRef: dispatchConfig.gatewayRegistryRef,
          gatewayRegistryEntryId: dispatchConfig.gatewayRegistryEntryId,
        };
      }),
    } as JsonValue),
    registryBindingSetDigest: await digestCanonical({ nodeGatewayBindingDigests } as JsonValue),
    nodes,
  };
}

function runtimeIngressGraphIssuerContext(
  config: RuntimeIngressConfig,
  block: ParsedRuntimeIngressDispatchBlock,
  runtimeExecution: RuntimeExecutionRecord,
): GraphEvidenceIssuerContext {
  const baseConfig = runtimeConfigForDispatch(config, firstDispatch(block));
  return {
    tenantId: baseConfig.tenantId,
    organizationId: baseConfig.organizationId,
    principalIntentRef: block.principalIntentRef,
    principalId: baseConfig.principalId,
    agentId: baseConfig.agentId,
    runId: baseConfig.runId,
    runtimeAdapterId: baseConfig.runtimeAdapterId,
    graphIssuerRef: `${baseConfig.runtimeAdapterId}:${block.dispatchBoundaryRef}`,
    graphIssuerAuthority: "host_runtime_adapter",
    graphIssuedAt: runtimeExecution.createdAt,
  };
}

async function buildRuntimeIngressGraphNode(
  config: RuntimeIngressConfig,
  block: ParsedRuntimeIngressDispatchBlock,
  dispatch: ParsedRuntimeIngressObservedDispatch,
  sequenceNumber: number,
): Promise<GeneratedExecutionNodeInput> {
  const compileInput = await buildCompileIntentInputForDispatch(config, block, dispatch, sequenceNumber, {
    runtimeExecutionId: "runtime_execution_pending",
    generatedExecutionGraphId: "generated_execution_graph_pending",
  });
  const candidate = compileInput.candidate;
  const paramsDigest = await protectedActionParamsDigest({
    parameters: candidate.parameters,
    secretRefs: candidate.secretRefs,
    gatewayCredentialRefs: candidate.gatewayCredentialRefs,
    delegatedAuthorityRefs: candidate.delegatedAuthorityRefs,
  });
  const classification = nodeClassificationForDispatch(dispatch);
  const nodeGatewayBindingDigest =
    classification === "candidate_action_eligible"
      ? await digestCanonical({
          actionClass: candidate.actionClass,
          toolCapabilityId: candidate.toolCapabilityId,
          actionTypeId: candidate.actionTypeId,
          gatewayRegistryEntryId: candidate.gatewayRegistryEntryId,
          resourceRef: candidate.resourceRef,
          paramsDigest,
        } as JsonValue)
      : null;
  const sourceRef = dispatchGeneratedCodeOrSpecRef(block, dispatch, sequenceNumber);
  return {
    nodeId: runtimeIngressDispatchNodeId(sequenceNumber),
    nodeKind: isRawSiblingDispatch(dispatch) ? "shell_command" : "observer_event",
    classification,
    actionClass: candidate.actionClass,
    toolCapabilityId: candidate.toolCapabilityId,
    actionTypeId: candidate.actionTypeId,
    gatewayRegistryEntryId: candidate.gatewayRegistryEntryId,
    resourceRef: candidate.resourceRef,
    paramsDigest,
    nodeGatewayBindingDigest,
    sourceSpanDigest: await digestCanonical({
      dispatchRef: dispatch.dispatchRef,
      sourceRef,
      sequenceNumber,
    } as JsonValue),
    redactedArgvSummary: isRawSiblingDispatch(dispatch)
      ? dispatch.rawCommandSummary
      : [candidate.actionClass, candidate.resourceRef],
    argvDigest: await digestCanonical({
      dispatchKind: dispatch.dispatchKind,
      dispatchRef: dispatch.dispatchRef,
      sourceRef,
      sequenceNumber,
      paramsDigest,
    } as JsonValue),
    argvRedactionStatus: "redacted",
    stdinDigest: null,
    stdinRedactionStatus: "digest_only",
    envAllowlistDigest: null,
    rawSecretMaterialDetected: false,
    commandRiskClassifierRefs: ["runtime-dispatch-ingress-classifier"],
    commandRiskClassifierPosture: isRawSiblingDispatch(dispatch)
      ? "bypass_detected"
      : classification === "candidate_action_eligible"
        ? "advisory_no_match"
        : "unknown",
    commandRiskRuleRefs: [],
    commandRiskBypassRefs: isRawSiblingDispatch(dispatch) ? [dispatch.rawCommandRef, dispatch.dispatchRef] : [],
    unsupportedReasonCodes: unsupportedReasonCodesForDispatch(dispatch),
  };
}

function edgesForDispatches(dispatches: ParsedRuntimeIngressObservedDispatch[]) {
  return dispatches.slice(1).map((dispatch, index) => ({
    fromNodeId: runtimeIngressDispatchNodeId(index + 1),
    toNodeId: runtimeIngressDispatchNodeId(index + 2),
    edgeKind: dispatch.retryOfDispatchRef ? ("retry" as const) : ("sequence" as const),
  }));
}

function nodeClassificationForDispatch(
  dispatch: ParsedRuntimeIngressObservedDispatch,
): GeneratedExecutionNodeInput["classification"] {
  if (isRawSiblingDispatch(dispatch)) return "bypass_risk";
  if (
    isAmbiguousDispatch(dispatch) ||
    dispatch.dynamicToolConstructionDetected ||
    dispatch.lateBoundParameterRefs.length > 0 ||
    dispatchSpecificRefusalReasonCodes(dispatch).length > 0
  ) {
    return "ambiguous";
  }
  return "candidate_action_eligible";
}

function unsupportedReasonCodesForDispatch(dispatch: ParsedRuntimeIngressObservedDispatch): string[] {
  const reasonCodes: string[] = [];
  if (isRawSiblingDispatch(dispatch)) {
    reasonCodes.push("runtime_ingress_raw_sibling_bypass");
  }
  if (isAmbiguousDispatch(dispatch)) {
    reasonCodes.push(...dispatch.ambiguousReasonCodes);
  }
  if (dispatch.dynamicToolConstructionDetected) {
    reasonCodes.push("runtime_ingress_dynamic_tool_construction");
  }
  if (dispatch.lateBoundParameterRefs.length > 0) {
    reasonCodes.push("runtime_ingress_late_bound_parameters");
  }
  reasonCodes.push(...dispatchSpecificRefusalReasonCodes(dispatch));
  return [...new Set(reasonCodes)];
}

function runtimeIngressDispatchRefusalReasonCodes(block: ParsedRuntimeIngressDispatchBlock): string[] {
  return unique(block.dispatches.flatMap((dispatch) => dispatchSpecificRefusalReasonCodes(dispatch)));
}

async function createFinalizedToolCallDraft(
  protocol: Pick<RuntimeIngressProtocol, "createToolCallDraft" | "transitionToolCallDraft">,
  compileInput: CompileIntentInput,
): Promise<ToolCallDraft> {
  const opened = await protocol.createToolCallDraft({
    tenantId: compileInput.tenantId,
    organizationId: compileInput.organizationId,
    runtimeExecutionId: compileInput.runtimeExecutionId,
    generatedExecutionGraphId: compileInput.generatedExecutionGraphId,
    generatedExecutionNodeId: compileInput.generatedExecutionNodeId,
    toolCapabilityId: compileInput.candidate.toolCapabilityId,
    actionTypeId: compileInput.candidate.actionTypeId,
    gatewayRegistryEntryId: compileInput.candidate.gatewayRegistryEntryId,
    actionClass: compileInput.candidate.actionClass,
    gatewayId: compileInput.candidate.gatewayId,
    resourceRef: compileInput.candidate.resourceRef,
    gatewayCredentialRefs: compileInput.candidate.gatewayCredentialRefs,
    delegatedAuthorityRefs: compileInput.candidate.delegatedAuthorityRefs,
    expiresAt: compileInput.candidate.expiresAt,
    evidenceRefs: compileInput.requiredEvidenceRefs,
  });
  return protocol.transitionToolCallDraft({
    toolCallDraftId: opened.toolCallDraftId,
    nextDraftState: "finalized",
    parameters: compileInput.candidate.parameters,
    nonSecretParamsSummary: compileInput.candidate.nonSecretParamsSummary,
    secretRefs: compileInput.candidate.secretRefs,
    gatewayCredentialRefs: compileInput.candidate.gatewayCredentialRefs,
    delegatedAuthorityRefs: compileInput.candidate.delegatedAuthorityRefs,
    finalizedAt: new Date().toISOString(),
    expiresAt: compileInput.candidate.expiresAt,
    evidenceRefs: compileInput.requiredEvidenceRefs,
  });
}

function firstDispatch(block: ParsedRuntimeIngressDispatchBlock): ParsedRuntimeIngressObservedDispatch {
  const dispatch = block.dispatches[0];
  if (!dispatch) throw new Error("Runtime ingress dispatch block must contain at least one dispatch.");
  return dispatch;
}

function requireCandidateDigest(candidateDigest: string | null): string {
  if (!candidateDigest) throw new Error("Contractable candidate is missing candidateDigest.");
  return candidateDigest;
}

function refusalReasonCodesForCompilation(intentCompilation: IntentCompilationRecord): string[] {
  return [...intentCompilation.uncertaintyMarkers, ...intentCompilation.overreachReasonCodes];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
