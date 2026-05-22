import { z } from "zod";
import type { ActionContract } from "../../protocol/areas/action-contract";
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
import { digestCanonical, protectedActionParamsDigest } from "../../protocol/foundation/canonical";
import type { JsonValue } from "../../protocol/foundation/schema-core";
import {
  buildPackageInstallCompileIntentInput,
  refusalReasonCodesForCompilation,
  type PackageInstallRuntimeConfig,
  type PackageInstallRuntimeProtocol,
  type PackageInstallToolCall,
} from "../package-install/action-proposal";
import {
  buildX402PaymentCompileIntentInput,
  type X402PaymentAttempt,
  type X402PaymentRuntimeConfig,
} from "../../adapters/x402-payment/action-proposal";

const PackageInstallDispatchParameterFields = {
  package: z.string().min(1),
  versionRange: z.string().min(1),
  packageManager: z.string().min(1).default("bun"),
  registryRef: z.string().min(1).default("registry:npmjs"),
  workspaceRef: z.string().min(1).nullable().default(null),
  manifestRef: z.string().min(1).nullable().default("manifest:package.json"),
  lockfileRef: z.string().min(1).nullable().default("lockfile:bun.lock"),
  installFlags: z.array(z.string().min(1)).default([]),
  lifecycleScriptPolicy: z.enum(["blocked", "allowed", "unknown"]).default("blocked"),
  resolvedMaterialDigest: z
    .string()
    .regex(/^sha256:[a-f0-9]{64}$/)
    .nullable()
    .default(null),
  resolvedMaterialEvidenceRefs: z.array(z.string().min(1)).default([]),
} as const;

const X402PaymentDispatchParameterFields = {
  endpointUrl: z.string().url(),
  payee: z.string().min(1),
  network: z.string().min(1),
  token: z.string().min(1),
  atomicAmount: z.string().regex(/^(?:0|[1-9]\d*)$/),
  x402EvidenceProfile: z.enum(["official_payment_required", "local_digest_profile"]).default("local_digest_profile"),
  paymentRequirementsDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  paymentRequiredEvidenceRef: z.string().min(1).optional(),
  facilitatorRef: z.string().min(1).nullable().default(null),
  intendedHttpMethod: z.string().min(1).nullable().default(null),
  intendedRequestUrl: z.string().url().nullable().default(null),
  intendedRequestBodyDigest: z
    .string()
    .regex(/^sha256:[a-f0-9]{64}$/)
    .nullable()
    .default(null),
  selectedHeadersDigest: z
    .string()
    .regex(/^sha256:[a-f0-9]{64}$/)
    .nullable()
    .default(null),
  x402Version: z.number().int().positive().nullable().default(null),
  x402Scheme: z.string().min(1).nullable().default(null),
  asset: z.string().min(1).nullable().default(null),
  payTo: z.string().min(1).nullable().default(null),
  maxTimeoutSeconds: z.number().positive().nullable().default(null),
  selectedPaymentRequirementDigest: z
    .string()
    .regex(/^sha256:[a-f0-9]{64}$/)
    .nullable()
    .default(null),
  selectedPaymentRequirementIndex: z.number().int().nonnegative().nullable().default(null),
  sdkPackageVersions: z.record(z.string(), z.string().min(1)).default({}),
  extensionKeys: z.array(z.string().min(1)).default([]),
} as const;

const RuntimeIngressDispatchCommonFields = {
  dispatchRef: z.string().min(1),
  generatedCodeOrSpecRef: z.string().min(1).nullable().default(null),
  dynamicToolConstructionDetected: z.boolean().default(false),
  lateBoundParameterRefs: z.array(z.string().min(1)).default([]),
  retryOfDispatchRef: z.string().min(1).nullable().default(null),
  branchRef: z.string().min(1).nullable().default(null),
  loopIteration: z.number().int().nonnegative().nullable().default(null),
  evidenceRefs: z.array(z.string().min(1)).default([]),
} as const;

export const RuntimeIngressObservedDispatchSchema = z.discriminatedUnion("dispatchKind", [
  z.strictObject({
    dispatchKind: z.literal("wrapped_package_install"),
    ...RuntimeIngressDispatchCommonFields,
    ...PackageInstallDispatchParameterFields,
  }),
  z.strictObject({
    dispatchKind: z.literal("raw_sibling_package_install"),
    ...RuntimeIngressDispatchCommonFields,
    rawCommandRef: z.string().min(1),
    rawCommandSummary: z.array(z.string().min(1)).default(["package-manager command outside gateway"]),
    ...PackageInstallDispatchParameterFields,
  }),
  z.strictObject({
    dispatchKind: z.literal("ambiguous_package_install"),
    ...RuntimeIngressDispatchCommonFields,
    ambiguousReasonCodes: z.array(z.string().min(2)).default(["runtime_ingress_ambiguous_dispatch"]),
    ...PackageInstallDispatchParameterFields,
  }),
  z.strictObject({
    dispatchKind: z.literal("wrapped_x402_payment"),
    ...RuntimeIngressDispatchCommonFields,
    ...X402PaymentDispatchParameterFields,
  }),
  z.strictObject({
    dispatchKind: z.literal("raw_sibling_x402_payment"),
    ...RuntimeIngressDispatchCommonFields,
    rawCommandRef: z.string().min(1),
    rawCommandSummary: z.array(z.string().min(1)).default(["x402 payment command outside gateway"]),
    ...X402PaymentDispatchParameterFields,
  }),
  z.strictObject({
    dispatchKind: z.literal("ambiguous_x402_payment"),
    ...RuntimeIngressDispatchCommonFields,
    ambiguousReasonCodes: z.array(z.string().min(2)).default(["runtime_ingress_ambiguous_dispatch"]),
    ...X402PaymentDispatchParameterFields,
  }),
]);
export type RuntimeIngressObservedDispatch = z.input<typeof RuntimeIngressObservedDispatchSchema>;

export const RuntimeIngressDispatchBlockSchema = z.strictObject({
  principalIntentRef: z.string().min(1),
  generatedCodeOrSpecRef: z.string().min(1),
  dispatchBoundaryRef: z.string().min(1),
  executionBlockRef: z.string().min(1).nullable().default(null),
  graphNonce: z.string().min(8).nullable().default(null),
  truncationStatus: z.enum(["complete", "truncated", "over_limit", "unknown"]).default("complete"),
  unobservedRegionRefs: z.array(z.string().min(1)).default([]),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  dispatches: z.array(RuntimeIngressObservedDispatchSchema).min(1),
});
export type RuntimeIngressDispatchBlock = z.input<typeof RuntimeIngressDispatchBlockSchema>;

type ParsedRuntimeIngressDispatchBlock = z.infer<typeof RuntimeIngressDispatchBlockSchema>;
type ParsedRuntimeIngressObservedDispatch = ParsedRuntimeIngressDispatchBlock["dispatches"][number];
type ParsedPackageInstallDispatch = Extract<
  ParsedRuntimeIngressObservedDispatch,
  { dispatchKind: "wrapped_package_install" | "raw_sibling_package_install" | "ambiguous_package_install" }
>;
type ParsedX402PaymentDispatch = Extract<
  ParsedRuntimeIngressObservedDispatch,
  { dispatchKind: "wrapped_x402_payment" | "raw_sibling_x402_payment" | "ambiguous_x402_payment" }
>;
type RuntimeIngressFamilyConfig = PackageInstallRuntimeConfig | X402PaymentRuntimeConfig;

export type RuntimeIngressConfig = {
  packageInstall?: PackageInstallRuntimeConfig;
  x402Payment?: X402PaymentRuntimeConfig;
};

export type RuntimeIngressProtocol = PackageInstallRuntimeProtocol & {
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

  return {
    outcome: proposals.every((proposal) => proposal.outcome === "action_contract_proposed")
      ? "action_contracts_proposed"
      : "one_or_more_dispatches_refused",
    runtimeExecution,
    generatedExecutionGraph: graph,
    proposals,
  };
}

export function runtimeIngressDispatchNodeId(sequenceNumber: number): string {
  return `runtime_dispatch_${sequenceNumber}`;
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
    refusalReasonCodes: [],
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
    dispatch.lateBoundParameterRefs.length > 0
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
  return [...new Set(reasonCodes)];
}

async function buildCompileIntentInputForDispatch(
  config: RuntimeIngressConfig,
  block: ParsedRuntimeIngressDispatchBlock,
  dispatch: ParsedRuntimeIngressObservedDispatch,
  sequenceNumber: number,
  graphRefs: { runtimeExecutionId: string; generatedExecutionGraphId: string },
  requiredPriorActionContractIds: string[] = [],
): Promise<CompileIntentInput> {
  if (isPackageInstallDispatch(dispatch)) {
    return buildPackageInstallCompileIntentInput(
      requirePackageInstallConfig(config),
      packageInstallToolCallForDispatch(block, dispatch, sequenceNumber, graphRefs, requiredPriorActionContractIds),
    );
  }
  return buildX402PaymentCompileIntentInput(
    requireX402PaymentConfig(config),
    x402PaymentAttemptForDispatch(block, dispatch, sequenceNumber, graphRefs, requiredPriorActionContractIds),
  );
}

function packageInstallToolCallForDispatch(
  block: ParsedRuntimeIngressDispatchBlock,
  dispatch: ParsedPackageInstallDispatch,
  sequenceNumber: number,
  graphRefs: { runtimeExecutionId: string; generatedExecutionGraphId: string },
  requiredPriorActionContractIds: string[] = [],
): PackageInstallToolCall {
  return {
    principalIntentRef: block.principalIntentRef,
    generatedCodeOrSpecRef: dispatchGeneratedCodeOrSpecRef(block, dispatch, sequenceNumber),
    runtimeExecutionId: graphRefs.runtimeExecutionId,
    generatedExecutionGraphId: graphRefs.generatedExecutionGraphId,
    generatedExecutionNodeId: runtimeIngressDispatchNodeId(sequenceNumber),
    package: dispatch.package,
    versionRange: dispatch.versionRange,
    packageManager: dispatch.packageManager,
    registryRef: dispatch.registryRef,
    workspaceRef: dispatch.workspaceRef,
    manifestRef: dispatch.manifestRef,
    lockfileRef: dispatch.lockfileRef,
    installFlags: dispatch.installFlags,
    lifecycleScriptPolicy: dispatch.lifecycleScriptPolicy,
    resolvedMaterialDigest: dispatch.resolvedMaterialDigest,
    resolvedMaterialEvidenceRefs: dispatch.resolvedMaterialEvidenceRefs,
    sequenceNumber,
    requiredPriorActionContractIds,
  };
}

function x402PaymentAttemptForDispatch(
  block: ParsedRuntimeIngressDispatchBlock,
  dispatch: ParsedX402PaymentDispatch,
  sequenceNumber: number,
  graphRefs: { runtimeExecutionId: string; generatedExecutionGraphId: string },
  requiredPriorActionContractIds: string[] = [],
): X402PaymentAttempt {
  return {
    principalIntentRef: block.principalIntentRef,
    generatedCodeOrSpecRef: dispatchGeneratedCodeOrSpecRef(block, dispatch, sequenceNumber),
    runtimeExecutionId: graphRefs.runtimeExecutionId,
    generatedExecutionGraphId: graphRefs.generatedExecutionGraphId,
    generatedExecutionNodeId: runtimeIngressDispatchNodeId(sequenceNumber),
    endpointUrl: dispatch.endpointUrl,
    payee: dispatch.payee,
    network: dispatch.network,
    token: dispatch.token,
    atomicAmount: dispatch.atomicAmount,
    x402EvidenceProfile: dispatch.x402EvidenceProfile,
    paymentRequirementsDigest: dispatch.paymentRequirementsDigest,
    paymentRequiredEvidenceRef: dispatch.paymentRequiredEvidenceRef,
    facilitatorRef: dispatch.facilitatorRef,
    intendedHttpMethod: dispatch.intendedHttpMethod,
    intendedRequestUrl: dispatch.intendedRequestUrl,
    intendedRequestBodyDigest: dispatch.intendedRequestBodyDigest,
    selectedHeadersDigest: dispatch.selectedHeadersDigest,
    x402Version: dispatch.x402Version,
    x402Scheme: dispatch.x402Scheme,
    asset: dispatch.asset,
    payTo: dispatch.payTo,
    maxTimeoutSeconds: dispatch.maxTimeoutSeconds,
    selectedPaymentRequirementIndex: dispatch.selectedPaymentRequirementIndex,
    selectedPaymentRequirementDigest: dispatch.selectedPaymentRequirementDigest,
    sdkPackageVersions: dispatch.sdkPackageVersions,
    extensionKeys: dispatch.extensionKeys,
    sequenceNumber,
    requiredPriorActionContractIds,
  };
}

function runtimeIngressEvidenceRefs(block: ParsedRuntimeIngressDispatchBlock): string[] {
  return unique(
    [
      block.dispatchBoundaryRef,
      ...block.evidenceRefs,
      ...block.dispatches.flatMap((dispatch) => [
        ...dispatch.evidenceRefs,
        isX402PaymentDispatch(dispatch) ? dispatch.paymentRequiredEvidenceRef : null,
      ]),
    ].filter((value): value is string => Boolean(value)),
  );
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
    finalizedAt: new Date().toISOString(),
    expiresAt: compileInput.candidate.expiresAt,
    evidenceRefs: compileInput.requiredEvidenceRefs,
  });
}

function dispatchGeneratedCodeOrSpecRef(
  block: ParsedRuntimeIngressDispatchBlock,
  dispatch: ParsedRuntimeIngressObservedDispatch,
  sequenceNumber: number,
): string {
  return dispatch.generatedCodeOrSpecRef ?? `${block.generatedCodeOrSpecRef}#dispatch-${sequenceNumber}`;
}

function firstDispatch(block: ParsedRuntimeIngressDispatchBlock): ParsedRuntimeIngressObservedDispatch {
  const dispatch = block.dispatches[0];
  if (!dispatch) throw new Error("Runtime ingress dispatch block must contain at least one dispatch.");
  return dispatch;
}

function runtimeConfigForDispatch(
  config: RuntimeIngressConfig,
  dispatch: ParsedRuntimeIngressObservedDispatch,
): RuntimeIngressFamilyConfig {
  return isPackageInstallDispatch(dispatch) ? requirePackageInstallConfig(config) : requireX402PaymentConfig(config);
}

function requirePackageInstallConfig(config: RuntimeIngressConfig): PackageInstallRuntimeConfig {
  if (!config.packageInstall)
    throw new Error("Runtime ingress package-install dispatch requires packageInstall config.");
  return config.packageInstall;
}

function requireX402PaymentConfig(config: RuntimeIngressConfig): X402PaymentRuntimeConfig {
  if (!config.x402Payment) throw new Error("Runtime ingress x402 payment dispatch requires x402Payment config.");
  return config.x402Payment;
}

function signingSecretForDispatch(
  config: RuntimeIngressConfig,
  dispatch: ParsedRuntimeIngressObservedDispatch,
): string | undefined {
  return runtimeConfigForDispatch(config, dispatch).signingSecret;
}

function supportedGrammarVersionForBlock(block: ParsedRuntimeIngressDispatchBlock): string {
  const families = new Set(
    block.dispatches.map((dispatch) => (isPackageInstallDispatch(dispatch) ? "package" : "x402")),
  );
  if (families.size > 1) return "runtime-dispatch-mixed-0.1";
  return families.has("x402") ? "runtime-dispatch-x402-payment-0.1" : "runtime-dispatch-package-install-0.1";
}

function isPackageInstallDispatch(
  dispatch: ParsedRuntimeIngressObservedDispatch,
): dispatch is ParsedPackageInstallDispatch {
  return dispatch.dispatchKind.endsWith("_package_install");
}

function isX402PaymentDispatch(dispatch: ParsedRuntimeIngressObservedDispatch): dispatch is ParsedX402PaymentDispatch {
  return dispatch.dispatchKind.endsWith("_x402_payment");
}

function isRawSiblingDispatch(
  dispatch: ParsedRuntimeIngressObservedDispatch,
): dispatch is Extract<ParsedRuntimeIngressObservedDispatch, { rawCommandRef: string; rawCommandSummary: string[] }> {
  return dispatch.dispatchKind.startsWith("raw_sibling_");
}

function isAmbiguousDispatch(
  dispatch: ParsedRuntimeIngressObservedDispatch,
): dispatch is Extract<ParsedRuntimeIngressObservedDispatch, { ambiguousReasonCodes: string[] }> {
  return dispatch.dispatchKind.startsWith("ambiguous_");
}

function requireCandidateDigest(candidateDigest: string | null): string {
  if (!candidateDigest) throw new Error("Contractable candidate is missing candidateDigest.");
  return candidateDigest;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
