import { z } from "zod";
import {
  compilePackageInstallIntent,
  refusalReasonCodesForCompilation as packageInstallRefusalReasonCodesForCompilation,
  type PackageInstallRuntimeConfig,
  type PackageInstallRuntimeProtocol,
} from "../package-install/tool-wrapper";
import {
  compileRepoWriteIntent,
  type RepoWriteRuntimeConfig,
  type RepoWriteRuntimeProtocol,
  refusalReasonCodesForCompilation as repoWriteRefusalReasonCodesForCompilation,
} from "../repo-write/tool-wrapper";
import type { ActionContract } from "../../protocol/action-contract";
import type { IntentCompilationRecord } from "../../protocol/intent-compilation";

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
  const preflightCompilations: CompiledCodemodeAction[] = [];

  // Whole-block preflight prevents a later refused sibling from leaking authority to earlier actions.
  for (const [index, action] of program.actions.entries()) {
    preflightCompilations.push(
      await compileCodemodeAction(protocol, config, program, action, index + 1, []),
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
      : await compileCodemodeAction(protocol, config, program, action, sequenceNumber, requiredPriorActionContractIds);

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
): Promise<CompiledCodemodeAction> {
  if (action.actionClass === "package.install") {
    const intentCompilation = await compilePackageInstallIntent(protocol, config.packageInstall, {
      principalIntentRef: program.principalIntentRef,
      generatedCodeOrSpecRef: actionGeneratedCodeOrSpecRef(program.generatedCodeOrSpecRef, sequenceNumber),
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
