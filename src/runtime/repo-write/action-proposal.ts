import { z } from "zod";
import type { ActionContract, ProposeActionContractInput } from "../../protocol/areas/action-contract";
import { digestCanonical } from "../../protocol/foundation/canonical";
import { digestUtf8Content, utf8ByteLength } from "../../protocol/foundation/content-digests";
import type { CompileIntentInput, IntentCompilationRecord } from "../../protocol/areas/intent-compilation";

export const RepoWriteToolCallSchema = z.strictObject({
  principalIntentRef: z.string().min(1),
  generatedCodeOrSpecRef: z.string().min(1),
  runtimeExecutionId: z.string().min(1).nullable().default(null),
  generatedExecutionGraphId: z.string().min(1).nullable().default(null),
  generatedExecutionNodeId: z.string().min(1).nullable().default(null),
  repositoryRef: z.string().min(1),
  filePath: z.string().min(1),
  content: z.string(),
  sequenceNumber: z.number().int().nonnegative().default(1),
  requiredPriorActionContractIds: z.array(z.string().min(1)).default([]),
});
export type RepoWriteToolCall = z.input<typeof RepoWriteToolCallSchema>;

export type RepoWriteRuntimeConfig = {
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

export type RepoWriteRuntimeProtocol = {
  compileIntent(input: CompileIntentInput): Promise<IntentCompilationRecord>;
  proposeActionContract(input: ProposeActionContractInput): Promise<ActionContract>;
};

export type RepoWriteRuntimeResult =
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

export async function proposeRepoWriteActionContract(
  protocol: RepoWriteRuntimeProtocol,
  config: RepoWriteRuntimeConfig,
  toolCallValue: RepoWriteToolCall,
): Promise<RepoWriteRuntimeResult> {
  const intentCompilation = await compileRepoWriteIntent(protocol, config, toolCallValue);
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

export async function compileRepoWriteIntent(
  protocol: Pick<RepoWriteRuntimeProtocol, "compileIntent">,
  config: RepoWriteRuntimeConfig,
  toolCallValue: RepoWriteToolCall,
): Promise<IntentCompilationRecord> {
  return protocol.compileIntent(await buildRepoWriteCompileIntentInput(config, toolCallValue));
}

export async function buildRepoWriteCompileIntentInput(
  config: RepoWriteRuntimeConfig,
  toolCallValue: RepoWriteToolCall,
): Promise<CompileIntentInput> {
  const toolCall = RepoWriteToolCallSchema.parse(toolCallValue);
  const resourceRef = repoWriteResourceRef(toolCall.repositoryRef, toolCall.filePath);
  const contentDigest = await digestUtf8Content(toolCall.content);
  const contentByteLength = utf8ByteLength(toolCall.content);
  const idempotencyDigest = await digestCanonical({
    runId: config.runId,
    sequenceNumber: toolCall.sequenceNumber,
    repositoryRef: toolCall.repositoryRef,
    filePath: toolCall.filePath,
    contentDigest,
  });
  const parameters = {
    repositoryRef: toolCall.repositoryRef,
    filePath: toolCall.filePath,
    contentDigest,
    contentByteLength,
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
    generatedCodeOrSpecRefs: [toolCall.generatedCodeOrSpecRef],
    declaredAssumptions: ["repo write tool call provided explicit repository, file path, and content"],
    requiredEvidenceRefs: ["evidence:repo-file-diff"],
    candidate: {
      toolCapabilityId: config.toolCapabilityId,
      actionTypeId: config.actionTypeId,
      gatewayRegistryEntryId: config.gatewayRegistryEntryId,
      actionClass: "repo.write",
      gatewayId: config.gatewayId,
      resourceRef,
      sequenceNumber: toolCall.sequenceNumber,
      requiredPriorActionContractIds: toolCall.requiredPriorActionContractIds,
      recoveryRecommendationId: null,
      parameters,
      nonSecretParamsSummary: parameters,
      secretRefs: {},
      purposeCode: "repo_file_write",
      expectedSideEffectCodes: ["repo_file_content_change"],
      evidenceRefs: ["evidence:repo-file-diff"],
      bounds: { maxFiles: 1, maxBytes: contentByteLength },
      idempotencyKey: `repo-write:${idempotencyDigest.slice("sha256:".length)}`,
      rollbackHint: "restore previous file content from receipt evidence",
      expiresAt: config.contractExpiresAt,
    },
  };
}

export function refusalReasonCodesForCompilation(intentCompilation: IntentCompilationRecord): string[] {
  return [...intentCompilation.uncertaintyMarkers, ...intentCompilation.overreachReasonCodes];
}

export function repoWriteResourceRef(repositoryRef: string, filePath: string): string {
  return `repo:${repositoryRef}:${filePath}`;
}

function requireCandidateDigest(candidateDigest: string | null): string {
  if (!candidateDigest) throw new Error("Contractable candidate is missing candidateDigest.");
  return candidateDigest;
}
