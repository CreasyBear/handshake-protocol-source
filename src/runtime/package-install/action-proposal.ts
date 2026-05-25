import { z } from "zod";
import type { ActionContract, ProposeActionContractInput } from "../../protocol/areas/action-contract";
import type { CompileIntentInput, IntentCompilationRecord } from "../../protocol/areas/intent-compilation";

export const PackageInstallToolCallSchema = z.strictObject({
  principalIntentRef: z.string().min(1),
  generatedCodeOrSpecRef: z.string().min(1),
  runtimeExecutionId: z.string().min(1).nullable().default(null),
  generatedExecutionGraphId: z.string().min(1).nullable().default(null),
  generatedExecutionNodeId: z.string().min(1).nullable().default(null),
  toolCallDraftId: z.string().min(1).nullable().default(null),
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
  sequenceNumber: z.number().int().nonnegative().default(1),
  requiredPriorActionContractIds: z.array(z.string().min(1)).default([]),
});
export type PackageInstallToolCall = z.input<typeof PackageInstallToolCallSchema>;

export const PackageInstallRuntimeConfigSchema = z.strictObject({
  tenantId: z.string().min(1),
  organizationId: z.string().min(1),
  principalId: z.string().min(1),
  agentId: z.string().min(1),
  runId: z.string().min(1),
  runtimeAdapterId: z.string().min(1),
  operatingEnvelopeId: z.string().min(1),
  toolCatalogRef: z.string().min(1),
  actionCatalogRef: z.string().min(1),
  gatewayRegistryRef: z.string().min(1),
  toolCapabilityId: z.string().min(1),
  actionTypeId: z.string().min(1),
  gatewayRegistryEntryId: z.string().min(1),
  gatewayId: z.string().min(1),
  contractExpiresAt: z.string().datetime({ offset: true }),
  signingSecret: z.string().min(1).optional(),
});
export type PackageInstallRuntimeConfig = z.input<typeof PackageInstallRuntimeConfigSchema>;

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
  const parameters = {
    package: toolCall.package,
    versionRange: toolCall.versionRange,
    packageManager: toolCall.packageManager,
    registryRef: toolCall.registryRef,
    workspaceRef: toolCall.workspaceRef,
    manifestRef: toolCall.manifestRef,
    lockfileRef: toolCall.lockfileRef,
    installFlags: toolCall.installFlags,
    lifecycleScriptPolicy: toolCall.lifecycleScriptPolicy,
    resolvedMaterialDigest: toolCall.resolvedMaterialDigest,
    resolvedMaterialEvidenceRefs: toolCall.resolvedMaterialEvidenceRefs,
  };
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
    toolCallDraftId: toolCall.toolCallDraftId,
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
  return [...intentCompilation.uncertaintyMarkers, ...intentCompilation.overreachReasonCodes];
}

function requireCandidateDigest(candidateDigest: string | null): string {
  if (!candidateDigest) throw new Error("Contractable candidate is missing candidateDigest.");
  return candidateDigest;
}
