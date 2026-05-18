import { z } from "zod";
import {
  buildPackageInstallCompileIntentInput,
  compilePackageInstallIntent,
  refusalReasonCodesForCompilation as packageInstallRefusalReasonCodesForCompilation,
  type PackageInstallRuntimeConfig,
  type PackageInstallRuntimeProtocol,
} from "../package-install/tool-wrapper";
import {
  buildRepoWriteCompileIntentInput,
  compileRepoWriteIntent,
  type RepoWriteRuntimeConfig,
  type RepoWriteRuntimeProtocol,
  refusalReasonCodesForCompilation as repoWriteRefusalReasonCodesForCompilation,
} from "../repo-write/tool-wrapper";
import type { ActionContract } from "../../protocol/action-contract";
import { digestCanonical } from "../../protocol/canonical";
import type {
  CreateGeneratedExecutionGraphInput,
  GeneratedExecutionGraph,
  GeneratedExecutionNodeInput,
  GraphEvidenceIssuerContext,
} from "../../protocol/generated-execution-graph";
import type { IntentCompilationRecord } from "../../protocol/intent-compilation";
import type { CreateRuntimeExecutionInput, RuntimeExecutionRecord } from "../../protocol/runtime-evidence";
import type { JsonValue } from "../../protocol/schema-core";

const CodemodePackageInstallActionSchema = z.strictObject({
  actionClass: z.literal("package.install"),
  package: z.string().min(1),
  versionRange: z.string().min(1),
});

const CodemodeRepoWriteActionSchema = z.strictObject({
  actionClass: z.literal("repo.write"),
  repositoryRef: z.string().min(1),
  filePath: z.string().min(1),
  content: z.string(),
});

export const CodemodeMultiActionProgramSchema = z.strictObject({
  principalIntentRef: z.string().min(1),
  generatedCodeOrSpecRef: z.string().min(1),
  actions: z.array(z.discriminatedUnion("actionClass", [
    CodemodePackageInstallActionSchema,
    CodemodeRepoWriteActionSchema,
  ])).min(1),
});
export type CodemodeMultiActionProgram = z.input<typeof CodemodeMultiActionProgramSchema>;

export type CodemodeMultiActionRuntimeConfig = {
  packageInstall: PackageInstallRuntimeConfig;
  repoWrite: RepoWriteRuntimeConfig;
};

export type CodemodeMultiActionProtocol = PackageInstallRuntimeProtocol & RepoWriteRuntimeProtocol & {
  createRuntimeExecution(input: CreateRuntimeExecutionInput): Promise<RuntimeExecutionRecord>;
  createGeneratedExecutionGraph(
    input: CreateGeneratedExecutionGraphInput,
    issuerContext: GraphEvidenceIssuerContext,
  ): Promise<GeneratedExecutionGraph>;
};

export type CodemodeActionContractProposal =
  | {
      outcome: "action_contract_proposed";
      actionClass: "package.install" | "repo.write";
      sequenceNumber: number;
      intentCompilation: IntentCompilationRecord;
      actionContract: ActionContract;
      refusalReasonCodes: [];
    }
  | {
      outcome: "intent_compilation_refused";
      actionClass: "package.install" | "repo.write";
      sequenceNumber: number;
      intentCompilation: IntentCompilationRecord;
      actionContract: null;
      refusalReasonCodes: string[];
    }
  | {
      outcome: "generated_execution_block_refused";
      actionClass: "package.install" | "repo.write";
      sequenceNumber: number;
      intentCompilation: IntentCompilationRecord;
      actionContract: null;
      refusalReasonCodes: ["generated_execution_block_sibling_refused"];
    };

export type CodemodeMultiActionResult = {
  outcome: "action_contracts_proposed" | "one_or_more_candidates_refused" | "generated_execution_block_refused";
  proposals: CodemodeActionContractProposal[];
};

export async function proposeCodemodeActionContracts(
  protocol: CodemodeMultiActionProtocol,
  config: CodemodeMultiActionRuntimeConfig,
  programValue: CodemodeMultiActionProgram,
): Promise<CodemodeMultiActionResult> {
  const program = CodemodeMultiActionProgramSchema.parse(programValue);
  assertRuntimeConfigScope(config);
  const runtimeExecution = await protocol.createRuntimeExecution(await buildRuntimeExecutionInput(config, program));
  const graph = await protocol.createGeneratedExecutionGraph(
    await buildGeneratedExecutionGraphInput(config, program, runtimeExecution),
    graphIssuerContext(config, program, runtimeExecution),
  );
  const graphRefs = {
    runtimeExecutionId: runtimeExecution.runtimeExecutionId,
    generatedExecutionGraphId: graph.generatedExecutionGraphId,
  };
  const preflightCompilations: CompiledCodemodeAction[] = [];

  // Whole-block preflight prevents a later refused sibling from leaking authority to earlier actions.
  for (const [index, action] of program.actions.entries()) {
    preflightCompilations.push(
      await compileCodemodeAction(protocol, config, program, action, index + 1, [], graphRefs),
    );
  }

  const refusedPreflights = preflightCompilations.filter((compiled) => compiled.refusalReasonCodes.length > 0);
  if (refusedPreflights.length > 0) {
    return {
      outcome: "generated_execution_block_refused",
      proposals: preflightCompilations.map((compiled) => refusalProposalForPreflight(compiled)),
    };
  }

  const proposals: CodemodeActionContractProposal[] = [];
  const requiredPriorActionContractIds: string[] = [];

  for (const [index, action] of program.actions.entries()) {
    const sequenceNumber = index + 1;
    // Later actions are recompiled after prior contract ids exist so policy/gateway sequencing stays explicit.
    const compiled = sequenceNumber === 1
      ? requireCompiled(preflightCompilations[index])
      : await compileCodemodeAction(
          protocol,
          config,
          program,
          action,
          sequenceNumber,
          requiredPriorActionContractIds,
          graphRefs,
        );

    if (compiled.refusalReasonCodes.length > 0) {
      proposals.push({
        outcome: "intent_compilation_refused",
        actionClass: compiled.actionClass,
        sequenceNumber,
        intentCompilation: compiled.intentCompilation,
        actionContract: null,
        refusalReasonCodes: compiled.refusalReasonCodes,
      });
      break;
    }

    const actionContract = await protocol.proposeActionContract({
      intentCompilationId: compiled.intentCompilation.intentCompilationId,
      candidateActionId: compiled.intentCompilation.candidateAction.candidateActionId,
      candidateDigest: requireCandidateDigest(compiled.intentCompilation.candidateAction.candidateDigest),
      signingSecret: signingSecretForAction(config, compiled.actionClass),
    });
    const proposal: CodemodeActionContractProposal = {
      outcome: "action_contract_proposed",
      actionClass: compiled.actionClass,
      sequenceNumber,
      intentCompilation: compiled.intentCompilation,
      actionContract,
      refusalReasonCodes: [],
    };
    proposals.push(proposal);
    requiredPriorActionContractIds.push(actionContract.actionContractId);
  }

  return {
    outcome: proposals.every((proposal) => proposal.outcome === "action_contract_proposed")
      ? "action_contracts_proposed"
      : "one_or_more_candidates_refused",
    proposals,
  };
}

type CodemodeAction = z.infer<typeof CodemodeMultiActionProgramSchema>["actions"][number];

type CompiledCodemodeAction = {
  actionClass: "package.install" | "repo.write";
  sequenceNumber: number;
  intentCompilation: IntentCompilationRecord;
  refusalReasonCodes: string[];
};

type GeneratedExecutionGraphRefs = {
  runtimeExecutionId: string;
  generatedExecutionGraphId: string;
};

function actionGeneratedCodeOrSpecRef(generatedCodeOrSpecRef: string, sequenceNumber: number): string {
  return `${generatedCodeOrSpecRef}#action-${sequenceNumber}`;
}

async function compileCodemodeAction(
  protocol: CodemodeMultiActionProtocol,
  config: CodemodeMultiActionRuntimeConfig,
  program: z.infer<typeof CodemodeMultiActionProgramSchema>,
  action: CodemodeAction,
  sequenceNumber: number,
  requiredPriorActionContractIds: string[],
  graphRefs: GeneratedExecutionGraphRefs,
): Promise<CompiledCodemodeAction> {
  if (action.actionClass === "package.install") {
    const intentCompilation = await compilePackageInstallIntent(protocol, config.packageInstall, {
      principalIntentRef: program.principalIntentRef,
      generatedCodeOrSpecRef: actionGeneratedCodeOrSpecRef(program.generatedCodeOrSpecRef, sequenceNumber),
      runtimeExecutionId: graphRefs.runtimeExecutionId,
      generatedExecutionGraphId: graphRefs.generatedExecutionGraphId,
      generatedExecutionNodeId: actionNodeId(sequenceNumber),
      package: action.package,
      versionRange: action.versionRange,
      sequenceNumber,
      requiredPriorActionContractIds,
    });
    return {
      actionClass: action.actionClass,
      sequenceNumber,
      intentCompilation,
      refusalReasonCodes: packageInstallRefusalReasonCodesForCompilation(intentCompilation),
    };
  }

  const intentCompilation = await compileRepoWriteIntent(protocol, config.repoWrite, {
    principalIntentRef: program.principalIntentRef,
    generatedCodeOrSpecRef: actionGeneratedCodeOrSpecRef(program.generatedCodeOrSpecRef, sequenceNumber),
    runtimeExecutionId: graphRefs.runtimeExecutionId,
    generatedExecutionGraphId: graphRefs.generatedExecutionGraphId,
    generatedExecutionNodeId: actionNodeId(sequenceNumber),
    repositoryRef: action.repositoryRef,
    filePath: action.filePath,
    content: action.content,
    sequenceNumber,
    requiredPriorActionContractIds,
  });
  return {
    actionClass: action.actionClass,
    sequenceNumber,
    intentCompilation,
    refusalReasonCodes: repoWriteRefusalReasonCodesForCompilation(intentCompilation),
  };
}

async function buildRuntimeExecutionInput(
  config: CodemodeMultiActionRuntimeConfig,
  program: z.infer<typeof CodemodeMultiActionProgramSchema>,
): Promise<CreateRuntimeExecutionInput> {
  const shared = config.packageInstall;
  return {
    tenantId: shared.tenantId,
    organizationId: shared.organizationId,
    principalIntentRef: program.principalIntentRef,
    principalId: shared.principalId,
    agentId: shared.agentId,
    runId: shared.runId,
    runtimeAdapterId: shared.runtimeAdapterId,
    executionShape: "codemode_block",
    runtimePosture: "bounded_generation",
    executionBlockRef: program.generatedCodeOrSpecRef,
    executionBlockDigest: await digestCanonical({
      generatedCodeOrSpecRef: program.generatedCodeOrSpecRef,
      actions: program.actions,
    } as JsonValue),
    generatedCodeOrSpecRefs: [
      program.generatedCodeOrSpecRef,
      ...program.actions.map((_, index) => actionGeneratedCodeOrSpecRef(program.generatedCodeOrSpecRef, index + 1)),
    ],
    allowedToolCapabilityIds: unique(program.actions.map((action) => configForAction(config, action.actionClass).toolCapabilityId)),
    observedToolCallRefs: program.actions.map((_, index) => actionGeneratedCodeOrSpecRef(program.generatedCodeOrSpecRef, index + 1)),
    observedConsequentialCallCount: program.actions.length,
    loopDetected: false,
    retryDetected: false,
    branchDetected: false,
    dynamicToolConstructionDetected: false,
    unobservedRegionRefs: [],
    accessPosture: "controlled_outbound",
    uncertaintyMarkers: [],
    refusalReasonCodes: [],
    evidenceRefs: [program.generatedCodeOrSpecRef],
  };
}

async function buildGeneratedExecutionGraphInput(
  config: CodemodeMultiActionRuntimeConfig,
  program: z.infer<typeof CodemodeMultiActionProgramSchema>,
  runtimeExecution: RuntimeExecutionRecord,
): Promise<CreateGeneratedExecutionGraphInput> {
  const nodes = await Promise.all(
    program.actions.map((action, index) =>
      buildGeneratedExecutionNode(config, program, action, index + 1),
    ),
  );
  const nodeGatewayBindingDigests = nodes.map((node) => node.nodeGatewayBindingDigest).filter((digest): digest is string => Boolean(digest));
  return {
    runtimeExecutionId: runtimeExecution.runtimeExecutionId,
    graphNonce: `nonce_${runtimeExecution.runtimeExecutionId}`,
    parserVersion: "handshake-codemode-action-list-0.2.4",
    supportedGrammarVersion: "codemode-multi-action-list-0.1",
    entryNodeIds: nodes[0] ? [nodes[0].nodeId] : [],
    edges: nodes.slice(1).map((node, index) => ({
      fromNodeId: nodes[index]?.nodeId ?? actionNodeId(index + 1),
      toNodeId: node.nodeId,
      edgeKind: "sequence" as const,
    })),
    maxNodeCount: Math.max(64, nodes.length),
    maxEdgeCount: Math.max(128, nodes.length - 1),
    maxDepth: Math.max(16, nodes.length),
    maxGraphByteSize: 65536,
    truncationStatus: "complete",
    catalogSnapshotDigest: await digestCanonical({
      toolCatalogRefs: unique([config.packageInstall.toolCatalogRef, config.repoWrite.toolCatalogRef]),
      actionCatalogRefs: unique([config.packageInstall.actionCatalogRef, config.repoWrite.actionCatalogRef]),
      toolCapabilityIds: nodes.map((node) => node.toolCapabilityId),
      actionTypeIds: nodes.map((node) => node.actionTypeId),
    } as JsonValue),
    gatewayRegistrySnapshotDigest: await digestCanonical({
      gatewayRegistryRefs: unique([config.packageInstall.gatewayRegistryRef, config.repoWrite.gatewayRegistryRef]),
      gatewayRegistryEntryIds: nodes.map((node) => node.gatewayRegistryEntryId),
    } as JsonValue),
    registryBindingSetDigest: await digestCanonical({ nodeGatewayBindingDigests } as JsonValue),
    nodes,
  };
}

async function buildGeneratedExecutionNode(
  config: CodemodeMultiActionRuntimeConfig,
  program: z.infer<typeof CodemodeMultiActionProgramSchema>,
  action: CodemodeAction,
  sequenceNumber: number,
): Promise<GeneratedExecutionNodeInput> {
  const compileInput = await buildCompileIntentInputForAction(config, program, action, sequenceNumber, []);
  const candidate = compileInput.candidate;
  const paramsDigest = await digestCanonical({
    parameters: candidate.parameters,
    secretRefs: candidate.secretRefs,
  } as JsonValue);
  const nodeGatewayBindingDigest = await digestCanonical({
    actionClass: candidate.actionClass,
    toolCapabilityId: candidate.toolCapabilityId,
    actionTypeId: candidate.actionTypeId,
    gatewayRegistryEntryId: candidate.gatewayRegistryEntryId,
    resourceRef: candidate.resourceRef,
    paramsDigest,
  } as JsonValue);
  const sourceRef = actionGeneratedCodeOrSpecRef(program.generatedCodeOrSpecRef, sequenceNumber);
  return {
    nodeId: actionNodeId(sequenceNumber),
    nodeKind: "codemode_action",
    classification: "candidate_action_eligible",
    actionClass: candidate.actionClass,
    toolCapabilityId: candidate.toolCapabilityId,
    actionTypeId: candidate.actionTypeId,
    gatewayRegistryEntryId: candidate.gatewayRegistryEntryId,
    resourceRef: candidate.resourceRef,
    paramsDigest,
    nodeGatewayBindingDigest,
    sourceSpanDigest: await digestCanonical({ sourceRef, sequenceNumber } as JsonValue),
    redactedArgvSummary: [candidate.actionClass],
    argvDigest: await digestCanonical({ actionClass: candidate.actionClass, sequenceNumber, paramsDigest } as JsonValue),
    argvRedactionStatus: "redacted",
    stdinDigest: null,
    stdinRedactionStatus: "digest_only",
    envAllowlistDigest: null,
    rawSecretMaterialDetected: false,
    commandRiskClassifierRefs: ["codemode-action-list-classifier"],
    commandRiskClassifierPosture: "advisory_no_match",
    commandRiskRuleRefs: [],
    commandRiskBypassRefs: [],
    unsupportedReasonCodes: [],
  };
}

async function buildCompileIntentInputForAction(
  config: CodemodeMultiActionRuntimeConfig,
  program: z.infer<typeof CodemodeMultiActionProgramSchema>,
  action: CodemodeAction,
  sequenceNumber: number,
  requiredPriorActionContractIds: string[],
) {
  const base = {
    principalIntentRef: program.principalIntentRef,
    generatedCodeOrSpecRef: actionGeneratedCodeOrSpecRef(program.generatedCodeOrSpecRef, sequenceNumber),
    sequenceNumber,
    requiredPriorActionContractIds,
  };
  if (action.actionClass === "package.install") {
    return buildPackageInstallCompileIntentInput(config.packageInstall, {
      ...base,
      package: action.package,
      versionRange: action.versionRange,
    });
  }
  return buildRepoWriteCompileIntentInput(config.repoWrite, {
    ...base,
    repositoryRef: action.repositoryRef,
    filePath: action.filePath,
    content: action.content,
  });
}

function graphIssuerContext(
  config: CodemodeMultiActionRuntimeConfig,
  program: z.infer<typeof CodemodeMultiActionProgramSchema>,
  runtimeExecution: RuntimeExecutionRecord,
): GraphEvidenceIssuerContext {
  const shared = config.packageInstall;
  return {
    tenantId: shared.tenantId,
    organizationId: shared.organizationId,
    principalIntentRef: program.principalIntentRef,
    principalId: shared.principalId,
    agentId: shared.agentId,
    runId: shared.runId,
    runtimeAdapterId: shared.runtimeAdapterId,
    graphIssuerRef: `${shared.runtimeAdapterId}:codemode-multi-action`,
    graphIssuerAuthority: "host_runtime_adapter",
    graphIssuedAt: runtimeExecution.createdAt,
  };
}

function actionNodeId(sequenceNumber: number): string {
  return `codemode_action_${sequenceNumber}`;
}

function configForAction(
  config: CodemodeMultiActionRuntimeConfig,
  actionClass: "package.install" | "repo.write",
): PackageInstallRuntimeConfig | RepoWriteRuntimeConfig {
  return actionClass === "package.install" ? config.packageInstall : config.repoWrite;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function assertRuntimeConfigScope(config: CodemodeMultiActionRuntimeConfig): void {
  const packageConfig = config.packageInstall;
  const repoConfig = config.repoWrite;
  const mismatchedFields = [
    "tenantId",
    "organizationId",
    "principalId",
    "agentId",
    "runId",
    "runtimeAdapterId",
    "operatingEnvelopeId",
    "toolCatalogRef",
    "actionCatalogRef",
    "gatewayRegistryRef",
  ].filter((field) =>
    packageConfig[field as keyof PackageInstallRuntimeConfig] !== repoConfig[field as keyof RepoWriteRuntimeConfig],
  );
  if (mismatchedFields.length > 0) {
    throw new Error(`Codemode multi-action config scope mismatch: ${mismatchedFields.join(", ")}`);
  }
}

function refusalProposalForPreflight(compiled: CompiledCodemodeAction): CodemodeActionContractProposal {
  if (compiled.refusalReasonCodes.length > 0) {
    return {
      outcome: "intent_compilation_refused",
      actionClass: compiled.actionClass,
      sequenceNumber: compiled.sequenceNumber,
      intentCompilation: compiled.intentCompilation,
      actionContract: null,
      refusalReasonCodes: compiled.refusalReasonCodes,
    };
  }
  return {
    outcome: "generated_execution_block_refused",
    actionClass: compiled.actionClass,
    sequenceNumber: compiled.sequenceNumber,
    intentCompilation: compiled.intentCompilation,
    actionContract: null,
    refusalReasonCodes: ["generated_execution_block_sibling_refused"],
  };
}

function signingSecretForAction(
  config: CodemodeMultiActionRuntimeConfig,
  actionClass: "package.install" | "repo.write",
): string | undefined {
  return actionClass === "package.install" ? config.packageInstall.signingSecret : config.repoWrite.signingSecret;
}

function requireCompiled(compiled: CompiledCodemodeAction | undefined): CompiledCodemodeAction {
  if (!compiled) throw new Error("missing codemode preflight compilation");
  return compiled;
}

function requireCandidateDigest(candidateDigest: string | null): string {
  if (!candidateDigest) throw new Error("Contractable candidate is missing candidateDigest.");
  return candidateDigest;
}
