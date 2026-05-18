import { z } from "zod";
import type { ActionContract, ProposeActionContractInput } from "../../protocol/action-contract";
import type {
  CompileIntentInput,
  IntentCompilationRecord,
} from "../../protocol/intent-compilation";

export const PackageInstallToolCallSchema = z.strictObject({
  principalIntentRef: z.string().min(1),
  generatedCodeOrSpecRef: z.string().min(1),
  runtimeExecutionId: z.string().min(1).nullable().default(null),
  generatedExecutionGraphId: z.string().min(1).nullable().default(null),
  generatedExecutionNodeId: z.string().min(1).nullable().default(null),
  package: z.string().min(1),
  versionRange: z.string().min(1),
  sequenceNumber: z.number().int().nonnegative().default(1),
  requiredPriorActionContractIds: z.array(z.string().min(1)).default([]),
});
export type PackageInstallToolCall = z.input<typeof PackageInstallToolCallSchema>;

export type PackageInstallRuntimeConfig = {
  tenantId: string;
  organizationId: string;
  principalId: string;
  agentId: string;
  runId: string;
  runtimeAdapterId: string;
  operatingEnvelopeId: string;
  toolCatalogRef: string;
  actionCatalogRef: string;
  gatewayRegistryRef: string;
  toolCapabilityId: string;
  actionTypeId: string;
  gatewayRegistryEntryId: string;
  gatewayId: string;
  contractExpiresAt: string;
  signingSecret?: string;
};

export type PackageInstallRuntimeProtocol = {
  compileIntent(input: CompileIntentInput): Promise<IntentCompilationRecord>;
  proposeActionContract(input: ProposeActionContractInput): Promise<ActionContract>;
};

export type PackageInstallRuntimeResult =
  | {
      outcome: "action_contract_proposed";
      intentCompilation: IntentCompilationRecord;
      actionContract: ActionContract;
    }
  | {
      outcome: "intent_compilation_refused";
      intentCompilation: IntentCompilationRecord;
      actionContract: null;
      refusalReasonCodes: string[];
    };

export async function proposePackageInstallActionContract(
  protocol: PackageInstallRuntimeProtocol,
  config: PackageInstallRuntimeConfig,
  toolCallValue: PackageInstallToolCall,
): Promise<PackageInstallRuntimeResult> {
  const intentCompilation = await compilePackageInstallIntent(protocol, config, toolCallValue);
  const refusalReasonCodes = refusalReasonCodesForCompilation(intentCompilation);
  if (refusalReasonCodes.length > 0) {
    return { outcome: "intent_compilation_refused", intentCompilation, actionContract: null, refusalReasonCodes };
  }

  const actionContract = await protocol.proposeActionContract({
    intentCompilationId: intentCompilation.intentCompilationId,
    candidateActionId: intentCompilation.candidateAction.candidateActionId,
    candidateDigest: requireCandidateDigest(intentCompilation.candidateAction.candidateDigest),
    signingSecret: config.signingSecret,
  });
  return { outcome: "action_contract_proposed", intentCompilation, actionContract };
}

export async function compilePackageInstallIntent(
  protocol: Pick<PackageInstallRuntimeProtocol, "compileIntent">,
  config: PackageInstallRuntimeConfig,
  toolCallValue: PackageInstallToolCall,
): Promise<IntentCompilationRecord> {
  return protocol.compileIntent(buildPackageInstallCompileIntentInput(config, toolCallValue));
}

export function buildPackageInstallCompileIntentInput(
  config: PackageInstallRuntimeConfig,
  toolCallValue: PackageInstallToolCall,
): CompileIntentInput {
  const toolCall = PackageInstallToolCallSchema.parse(toolCallValue);
  const parameters = { package: toolCall.package, versionRange: toolCall.versionRange };
  return {
    tenantId: config.tenantId,
    organizationId: config.organizationId,
    principalIntentRef: toolCall.principalIntentRef,
    principalId: config.principalId,
    agentId: config.agentId,
    runId: config.runId,
    runtimeAdapterId: config.runtimeAdapterId,
    operatingEnvelopeId: config.operatingEnvelopeId,
    toolCatalogRef: config.toolCatalogRef,
    actionCatalogRef: config.actionCatalogRef,
    gatewayRegistryRef: config.gatewayRegistryRef,
    runtimeExecutionId: toolCall.runtimeExecutionId,
    generatedExecutionGraphId: toolCall.generatedExecutionGraphId,
    generatedExecutionNodeId: toolCall.generatedExecutionNodeId,
    generatedCodeOrSpecRefs: [toolCall.generatedCodeOrSpecRef],
    declaredAssumptions: ["package install tool call provided explicit package and version range"],
    requiredEvidenceRefs: ["evidence:package-manifest-diff"],
    candidate: {
      toolCapabilityId: config.toolCapabilityId,
      actionTypeId: config.actionTypeId,
      gatewayRegistryEntryId: config.gatewayRegistryEntryId,
      actionClass: "package.install",
      gatewayId: config.gatewayId,
      resourceRef: `npm:${toolCall.package}`,
      sequenceNumber: toolCall.sequenceNumber,
      requiredPriorActionContractIds: toolCall.requiredPriorActionContractIds,
      recoveryRecommendationId: null,
      parameters,
      nonSecretParamsSummary: parameters,
      secretRefs: {},
      purposeCode: "dependency_add",
      expectedSideEffectCodes: ["package_json_change", "lockfile_change"],
      evidenceRefs: ["evidence:package-manifest-diff"],
      bounds: { maxPackages: 1 },
      idempotencyKey: `package-install:${config.runId}:${toolCall.sequenceNumber}:${toolCall.package}`,
      rollbackHint: "remove package and restore manifest from receipt evidence",
      expiresAt: config.contractExpiresAt,
    },
  };
}

export function refusalReasonCodesForCompilation(intentCompilation: IntentCompilationRecord): string[] {
  return [
    ...intentCompilation.uncertaintyMarkers,
    ...intentCompilation.overreachReasonCodes,
  ];
}

function requireCandidateDigest(candidateDigest: string | null): string {
  if (!candidateDigest) throw new Error("Contractable candidate is missing candidateDigest.");
  return candidateDigest;
}
