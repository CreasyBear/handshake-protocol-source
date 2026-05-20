import { z } from "zod";
import type { ActionContract, ProposeActionContractInput } from "../../protocol/areas/action-contract";
import { digestCanonical } from "../../protocol/foundation/canonical";
import type { CompileIntentInput, IntentCompilationRecord } from "../../protocol/areas/intent-compilation";

export const PreviewDeployToolCallSchema = z.strictObject({
  principalIntentRef: z.string().min(1),
  generatedCodeOrSpecRef: z.string().min(1),
  runtimeExecutionId: z.string().min(1).nullable().default(null),
  generatedExecutionGraphId: z.string().min(1).nullable().default(null),
  generatedExecutionNodeId: z.string().min(1).nullable().default(null),
  toolCallDraftId: z.string().min(1).nullable().default(null),
  provider: z.string().min(1),
  projectRef: z.string().min(1),
  branchRef: z.string().min(1),
  commitRef: z.string().min(1),
  previewUrlHint: z.string().min(1).nullable().default(null),
  sequenceNumber: z.number().int().nonnegative().default(1),
  requiredPriorActionContractIds: z.array(z.string().min(1)).default([]),
});
export type PreviewDeployToolCall = z.input<typeof PreviewDeployToolCallSchema>;

export type PreviewDeployRuntimeConfig = {
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

export type PreviewDeployRuntimeProtocol = {
  compileIntent(input: CompileIntentInput): Promise<IntentCompilationRecord>;
  proposeActionContract(input: ProposeActionContractInput): Promise<ActionContract>;
};

export type PreviewDeployRuntimeResult =
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

export async function proposePreviewDeployActionContract(
  protocol: PreviewDeployRuntimeProtocol,
  config: PreviewDeployRuntimeConfig,
  toolCallValue: PreviewDeployToolCall,
): Promise<PreviewDeployRuntimeResult> {
  const intentCompilation = await compilePreviewDeployIntent(protocol, config, toolCallValue);
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

export async function compilePreviewDeployIntent(
  protocol: Pick<PreviewDeployRuntimeProtocol, "compileIntent">,
  config: PreviewDeployRuntimeConfig,
  toolCallValue: PreviewDeployToolCall,
): Promise<IntentCompilationRecord> {
  return protocol.compileIntent(await buildPreviewDeployCompileIntentInput(config, toolCallValue));
}

export async function buildPreviewDeployCompileIntentInput(
  config: PreviewDeployRuntimeConfig,
  toolCallValue: PreviewDeployToolCall,
): Promise<CompileIntentInput> {
  const toolCall = PreviewDeployToolCallSchema.parse(toolCallValue);
  const resourceRef = previewDeployResourceRef(toolCall.provider, toolCall.projectRef, toolCall.branchRef);
  const parameters = {
    provider: toolCall.provider,
    projectRef: toolCall.projectRef,
    branchRef: toolCall.branchRef,
    commitRef: toolCall.commitRef,
    previewUrlHint: toolCall.previewUrlHint,
  };
  const idempotencyDigest = await digestCanonical({
    runId: config.runId,
    provider: toolCall.provider,
    projectRef: toolCall.projectRef,
    branchRef: toolCall.branchRef,
    commitRef: toolCall.commitRef,
    sequenceNumber: toolCall.sequenceNumber,
  });
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
    declaredAssumptions: ["preview deploy tool call provided explicit provider, project, branch, and commit"],
    requiredEvidenceRefs: ["evidence:local-preview-artifact"],
    candidate: {
      toolCapabilityId: config.toolCapabilityId,
      actionTypeId: config.actionTypeId,
      gatewayRegistryEntryId: config.gatewayRegistryEntryId,
      actionClass: "preview_deploy.create",
      gatewayId: config.gatewayId,
      resourceRef,
      sequenceNumber: toolCall.sequenceNumber,
      requiredPriorActionContractIds: toolCall.requiredPriorActionContractIds,
      recoveryRecommendationId: null,
      parameters,
      nonSecretParamsSummary: parameters,
      secretRefs: {},
      purposeCode: "local_preview_deploy",
      expectedSideEffectCodes: ["local_preview_artifact_created"],
      evidenceRefs: ["evidence:local-preview-artifact"],
      bounds: { provider: toolCall.provider, projectRef: toolCall.projectRef, branchRef: toolCall.branchRef },
      idempotencyKey: `preview-deploy:${idempotencyDigest.slice("sha256:".length)}`,
      rollbackHint: "delete the local preview artifact directory",
      expiresAt: config.contractExpiresAt,
    },
  };
}

export function refusalReasonCodesForCompilation(intentCompilation: IntentCompilationRecord): string[] {
  return [...intentCompilation.uncertaintyMarkers, ...intentCompilation.overreachReasonCodes];
}

export function previewDeployResourceRef(provider: string, projectRef: string, branchRef: string): string {
  return `preview:${provider}:${projectRef}:${branchRef}`;
}

function requireCandidateDigest(candidateDigest: string | null): string {
  if (!candidateDigest) throw new Error("Contractable candidate is missing candidateDigest.");
  return candidateDigest;
}
