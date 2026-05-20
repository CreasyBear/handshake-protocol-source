import { z } from "zod";
import {
  buildPackageInstallCompileIntentInput,
  refusalReasonCodesForCompilation as packageInstallRefusalReasonCodesForCompilation,
  type PackageInstallRuntimeConfig,
  type PackageInstallRuntimeProtocol,
} from "../package-install/action-proposal";
import {
  buildRepoWriteCompileIntentInput,
  type RepoWriteRuntimeConfig,
  type RepoWriteRuntimeProtocol,
  refusalReasonCodesForCompilation as repoWriteRefusalReasonCodesForCompilation,
} from "../repo-write/action-proposal";
import {
  buildPreviewDeployCompileIntentInput,
  refusalReasonCodesForCompilation as previewDeployRefusalReasonCodesForCompilation,
  type PreviewDeployRuntimeConfig,
  type PreviewDeployRuntimeProtocol,
} from "../preview-deploy/action-proposal";
import type { ActionContract } from "../../protocol/areas/action-contract";
import type {
  CreateGeneratedExecutionGraphInput,
  GeneratedExecutionGraph,
  GraphEvidenceIssuerContext,
} from "../../protocol/areas/generated-execution-graph";
import type { IntentCompilationRecord } from "../../protocol/areas/intent-compilation";
import type { CreateRuntimeExecutionInput, RuntimeExecutionRecord } from "../../protocol/areas/runtime-evidence";
import type {
  CreateToolCallDraftInput,
  ToolCallDraft,
  TransitionToolCallDraftInput,
} from "../../protocol/areas/tool-call-draft";
import {
  actionGeneratedCodeOrSpecRef,
  actionNodeId,
  buildGeneratedExecutionGraphInput,
  buildRuntimeExecutionInput,
  graphIssuerContext,
  type GeneratedExecutionGraphRefs,
} from "./generated-graph-evidence";

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

const CodemodePreviewDeployActionSchema = z.strictObject({
  actionClass: z.literal("preview_deploy.create"),
  provider: z.string().min(1),
  projectRef: z.string().min(1),
  branchRef: z.string().min(1),
  commitRef: z.string().min(1),
  previewUrlHint: z.string().min(1).nullable().default(null),
});

export const CodemodeMultiActionProgramSchema = z.strictObject({
  principalIntentRef: z.string().min(1),
  generatedCodeOrSpecRef: z.string().min(1),
  actions: z
    .array(
      z.discriminatedUnion("actionClass", [
        CodemodePackageInstallActionSchema,
        CodemodeRepoWriteActionSchema,
        CodemodePreviewDeployActionSchema,
      ]),
    )
    .min(1),
});
export type CodemodeMultiActionProgram = z.input<typeof CodemodeMultiActionProgramSchema>;

type CodemodeActionClass = "package.install" | "repo.write" | "preview_deploy.create";

export type CodemodeMultiActionRuntimeConfig = {
  packageInstall: PackageInstallRuntimeConfig;
  repoWrite: RepoWriteRuntimeConfig;
  previewDeploy: PreviewDeployRuntimeConfig;
};

export type CodemodeMultiActionProtocol = PackageInstallRuntimeProtocol &
  RepoWriteRuntimeProtocol &
  PreviewDeployRuntimeProtocol & {
    createRuntimeExecution(input: CreateRuntimeExecutionInput): Promise<RuntimeExecutionRecord>;
    createGeneratedExecutionGraph(
      input: CreateGeneratedExecutionGraphInput,
      issuerContext: GraphEvidenceIssuerContext,
    ): Promise<GeneratedExecutionGraph>;
    createToolCallDraft(input: CreateToolCallDraftInput): Promise<ToolCallDraft>;
    transitionToolCallDraft(input: TransitionToolCallDraftInput): Promise<ToolCallDraft>;
  };

export type CodemodeActionContractProposal =
  | {
      outcome: "action_contract_proposed";
      actionClass: CodemodeActionClass;
      sequenceNumber: number;
      intentCompilation: IntentCompilationRecord;
      actionContract: ActionContract;
      refusalReasonCodes: [];
    }
  | {
      outcome: "intent_compilation_refused";
      actionClass: CodemodeActionClass;
      sequenceNumber: number;
      intentCompilation: IntentCompilationRecord;
      actionContract: null;
      refusalReasonCodes: string[];
    }
  | {
      outcome: "generated_execution_block_refused";
      actionClass: CodemodeActionClass;
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
    const compiled =
      sequenceNumber === 1
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

export type ParsedCodemodeMultiActionProgram = z.infer<typeof CodemodeMultiActionProgramSchema>;

export type CodemodeAction = ParsedCodemodeMultiActionProgram["actions"][number];

type CompiledCodemodeAction = {
  actionClass: CodemodeActionClass;
  sequenceNumber: number;
  intentCompilation: IntentCompilationRecord;
  refusalReasonCodes: string[];
};

async function compileCodemodeAction(
  protocol: CodemodeMultiActionProtocol,
  config: CodemodeMultiActionRuntimeConfig,
  program: ParsedCodemodeMultiActionProgram,
  action: CodemodeAction,
  sequenceNumber: number,
  requiredPriorActionContractIds: string[],
  graphRefs: GeneratedExecutionGraphRefs,
): Promise<CompiledCodemodeAction> {
  if (action.actionClass === "package.install") {
    const compileInput = buildPackageInstallCompileIntentInput(config.packageInstall, {
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
    const draft = await createFinalizedToolCallDraft(protocol, compileInput);
    const intentCompilation = await protocol.compileIntent({ ...compileInput, toolCallDraftId: draft.toolCallDraftId });
    return {
      actionClass: action.actionClass,
      sequenceNumber,
      intentCompilation,
      refusalReasonCodes: packageInstallRefusalReasonCodesForCompilation(intentCompilation),
    };
  }

  if (action.actionClass === "preview_deploy.create") {
    const compileInput = await buildPreviewDeployCompileIntentInput(config.previewDeploy, {
      principalIntentRef: program.principalIntentRef,
      generatedCodeOrSpecRef: actionGeneratedCodeOrSpecRef(program.generatedCodeOrSpecRef, sequenceNumber),
      runtimeExecutionId: graphRefs.runtimeExecutionId,
      generatedExecutionGraphId: graphRefs.generatedExecutionGraphId,
      generatedExecutionNodeId: actionNodeId(sequenceNumber),
      provider: action.provider,
      projectRef: action.projectRef,
      branchRef: action.branchRef,
      commitRef: action.commitRef,
      previewUrlHint: action.previewUrlHint,
      sequenceNumber,
      requiredPriorActionContractIds,
    });
    const draft = await createFinalizedToolCallDraft(protocol, compileInput);
    const intentCompilation = await protocol.compileIntent({ ...compileInput, toolCallDraftId: draft.toolCallDraftId });
    return {
      actionClass: action.actionClass,
      sequenceNumber,
      intentCompilation,
      refusalReasonCodes: previewDeployRefusalReasonCodesForCompilation(intentCompilation),
    };
  }

  const compileInput = await buildRepoWriteCompileIntentInput(config.repoWrite, {
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
  const draft = await createFinalizedToolCallDraft(protocol, compileInput);
  const intentCompilation = await protocol.compileIntent({ ...compileInput, toolCallDraftId: draft.toolCallDraftId });
  return {
    actionClass: action.actionClass,
    sequenceNumber,
    intentCompilation,
    refusalReasonCodes: repoWriteRefusalReasonCodesForCompilation(intentCompilation),
  };
}

async function createFinalizedToolCallDraft(
  protocol: Pick<CodemodeMultiActionProtocol, "createToolCallDraft" | "transitionToolCallDraft">,
  compileInput:
    | Awaited<ReturnType<typeof buildRepoWriteCompileIntentInput>>
    | Awaited<ReturnType<typeof buildPreviewDeployCompileIntentInput>>
    | ReturnType<typeof buildPackageInstallCompileIntentInput>,
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
    expiresAt: compileInput.candidate.expiresAt,
    evidenceRefs: compileInput.requiredEvidenceRefs,
  });
  return protocol.transitionToolCallDraft({
    toolCallDraftId: opened.toolCallDraftId,
    nextDraftState: "finalized",
    parameters: compileInput.candidate.parameters,
    nonSecretParamsSummary: compileInput.candidate.nonSecretParamsSummary,
    secretRefs: compileInput.candidate.secretRefs,
    finalizedAt: new Date().toISOString(),
    expiresAt: compileInput.candidate.expiresAt,
    evidenceRefs: compileInput.requiredEvidenceRefs,
  });
}

function assertRuntimeConfigScope(config: CodemodeMultiActionRuntimeConfig): void {
  const packageConfig = config.packageInstall;
  const repoConfig = config.repoWrite;
  const previewConfig = config.previewDeploy;
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
  ].filter(
    (field) =>
      packageConfig[field as keyof PackageInstallRuntimeConfig] !== repoConfig[field as keyof RepoWriteRuntimeConfig] ||
      packageConfig[field as keyof PackageInstallRuntimeConfig] !==
        previewConfig[field as keyof PreviewDeployRuntimeConfig],
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
  actionClass: CodemodeActionClass,
): string | undefined {
  if (actionClass === "package.install") return config.packageInstall.signingSecret;
  if (actionClass === "preview_deploy.create") return config.previewDeploy.signingSecret;
  return config.repoWrite.signingSecret;
}

function requireCompiled(compiled: CompiledCodemodeAction | undefined): CompiledCodemodeAction {
  if (!compiled) throw new Error("missing codemode preflight compilation");
  return compiled;
}

function requireCandidateDigest(candidateDigest: string | null): string {
  if (!candidateDigest) throw new Error("Contractable candidate is missing candidateDigest.");
  return candidateDigest;
}
