import { z } from "zod";
import {
  proposePackageInstallActionContract,
  type PackageInstallRuntimeConfig,
  type PackageInstallRuntimeProtocol,
} from "../package-install/tool-wrapper";
import {
  proposeRepoWriteActionContract,
  type RepoWriteRuntimeConfig,
  type RepoWriteRuntimeProtocol,
} from "../repo-write/tool-wrapper";
import type {
  ActionContract,
  IntentCompilationRecord,
} from "../../protocol/schemas";

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

export type CodemodeMultiActionProtocol = PackageInstallRuntimeProtocol & RepoWriteRuntimeProtocol;

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
    };

export type CodemodeMultiActionResult = {
  outcome: "action_contracts_proposed" | "one_or_more_candidates_refused";
  proposals: CodemodeActionContractProposal[];
};

export async function proposeCodemodeActionContracts(
  protocol: CodemodeMultiActionProtocol,
  config: CodemodeMultiActionRuntimeConfig,
  programValue: CodemodeMultiActionProgram,
): Promise<CodemodeMultiActionResult> {
  const program = CodemodeMultiActionProgramSchema.parse(programValue);
  const proposals: CodemodeActionContractProposal[] = [];
  const requiredPriorActionContractIds: string[] = [];

  for (const [index, action] of program.actions.entries()) {
    const sequenceNumber = index + 1;
    if (action.actionClass === "package.install") {
      const result = await proposePackageInstallActionContract(protocol, config.packageInstall, {
        principalIntentRef: program.principalIntentRef,
        generatedCodeOrSpecRef: actionGeneratedCodeOrSpecRef(program.generatedCodeOrSpecRef, sequenceNumber),
        package: action.package,
        versionRange: action.versionRange,
        sequenceNumber,
        requiredPriorActionContractIds,
      });
      const proposal = actionProposalFromPackageInstall(action.actionClass, sequenceNumber, result);
      proposals.push(proposal);
      if (proposal.actionContract) requiredPriorActionContractIds.push(proposal.actionContract.actionContractId);
      continue;
    }

    const result = await proposeRepoWriteActionContract(protocol, config.repoWrite, {
      principalIntentRef: program.principalIntentRef,
      generatedCodeOrSpecRef: actionGeneratedCodeOrSpecRef(program.generatedCodeOrSpecRef, sequenceNumber),
      repositoryRef: action.repositoryRef,
      filePath: action.filePath,
      content: action.content,
      sequenceNumber,
      requiredPriorActionContractIds,
    });
    const proposal = actionProposalFromRepoWrite(action.actionClass, sequenceNumber, result);
    proposals.push(proposal);
    if (proposal.actionContract) requiredPriorActionContractIds.push(proposal.actionContract.actionContractId);
  }

  return {
    outcome: proposals.every((proposal) => proposal.outcome === "action_contract_proposed")
      ? "action_contracts_proposed"
      : "one_or_more_candidates_refused",
    proposals,
  };
}

function actionGeneratedCodeOrSpecRef(generatedCodeOrSpecRef: string, sequenceNumber: number): string {
  return `${generatedCodeOrSpecRef}#action-${sequenceNumber}`;
}

function actionProposalFromPackageInstall(
  actionClass: "package.install",
  sequenceNumber: number,
  result: Awaited<ReturnType<typeof proposePackageInstallActionContract>>,
): CodemodeActionContractProposal {
  if (result.outcome === "intent_compilation_refused") {
    return {
      outcome: result.outcome,
      actionClass,
      sequenceNumber,
      intentCompilation: result.intentCompilation,
      actionContract: null,
      refusalReasonCodes: result.refusalReasonCodes,
    };
  }
  return {
    outcome: result.outcome,
    actionClass,
    sequenceNumber,
    intentCompilation: result.intentCompilation,
    actionContract: result.actionContract,
    refusalReasonCodes: [],
  };
}

function actionProposalFromRepoWrite(
  actionClass: "repo.write",
  sequenceNumber: number,
  result: Awaited<ReturnType<typeof proposeRepoWriteActionContract>>,
): CodemodeActionContractProposal {
  if (result.outcome === "intent_compilation_refused") {
    return {
      outcome: result.outcome,
      actionClass,
      sequenceNumber,
      intentCompilation: result.intentCompilation,
      actionContract: null,
      refusalReasonCodes: result.refusalReasonCodes,
    };
  }
  return {
    outcome: result.outcome,
    actionClass,
    sequenceNumber,
    intentCompilation: result.intentCompilation,
    actionContract: result.actionContract,
    refusalReasonCodes: [],
  };
}
