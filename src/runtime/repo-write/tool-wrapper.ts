import { z } from "zod";
import { digestCanonical } from "../../protocol/canonical";
import { digestUtf8Content, utf8ByteLength } from "../../protocol/content-digests";
import type {
  CompileIntentInput,
  ProposeActionContractInput,
} from "../../protocol/inputs";
import type {
  ActionContract,
  IntentCompilationRecord,
} from "../../protocol/schemas";

export const RepoWriteToolCallSchema = z.strictObject({
  principalIntentRef: z.string().min(1),
  generatedCodeOrSpecRef: z.string().min(1),
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
  const toolCall = RepoWriteToolCallSchema.parse(toolCallValue);
  const resourceRef = repoWriteResourceRef(toolCall.repositoryRef, toolCall.filePath);
  const intentCompilation = await protocol.compileIntent({
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
    },
  });

  const refusalReasonCodes = [
    ...intentCompilation.uncertaintyMarkers,
    ...intentCompilation.overreachReasonCodes,
  ];
  if (refusalReasonCodes.length > 0) {
    return { outcome: "intent_compilation_refused", intentCompilation, actionContract: null, refusalReasonCodes };
  }

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
  const actionContract = await protocol.proposeActionContract({
    tenantId: config.tenantId,
    organizationId: config.organizationId,
    intentCompilationId: intentCompilation.intentCompilationId,
    envelopeId: config.operatingEnvelopeId,
    gatewayRegistryEntryId: config.gatewayRegistryEntryId,
    gatewayId: config.gatewayId,
    principalId: config.principalId,
    agentId: config.agentId,
    runId: config.runId,
    sequenceNumber: toolCall.sequenceNumber,
    requiredPriorActionContractIds: toolCall.requiredPriorActionContractIds,
    actionClass: "repo.write",
    resourceRef,
    parameters,
    nonSecretParamsSummary: parameters,
    purposeCode: "repo_file_write",
    expectedSideEffectCodes: ["repo_file_content_change"],
    evidenceRefs: ["evidence:repo-file-diff"],
    bounds: { maxFiles: 1, maxBytes: contentByteLength },
    idempotencyKey: `repo-write:${idempotencyDigest.slice("sha256:".length)}`,
    rollbackHint: "restore previous file content from receipt evidence",
    expiresAt: config.contractExpiresAt,
    signingSecret: config.signingSecret,
  });
  return { outcome: "action_contract_proposed", intentCompilation, actionContract };
}

export function repoWriteResourceRef(repositoryRef: string, filePath: string): string {
  return `repo:${repositoryRef}:${filePath}`;
}
