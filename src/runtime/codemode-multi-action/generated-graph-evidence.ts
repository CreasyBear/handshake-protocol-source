import {
  buildPackageInstallCompileIntentInput,
  type PackageInstallRuntimeConfig,
} from "../package-install/action-proposal";
import { buildRepoWriteCompileIntentInput, type RepoWriteRuntimeConfig } from "../repo-write/action-proposal";
import {
  buildPreviewDeployCompileIntentInput,
  type PreviewDeployRuntimeConfig,
} from "../preview-deploy/action-proposal";
import { digestCanonical, protectedActionParamsDigest } from "../../protocol/foundation/canonical";
import type {
  CreateGeneratedExecutionGraphInput,
  GeneratedExecutionNodeInput,
  GraphEvidenceIssuerContext,
} from "../../protocol/areas/generated-execution-graph";
import type { CreateRuntimeExecutionInput, RuntimeExecutionRecord } from "../../protocol/areas/runtime-evidence";
import type { JsonValue } from "../../protocol/foundation/schema-core";
import type { CodemodeAction, ParsedCodemodeMultiActionProgram } from "./generated-program-runner";

export type CodemodeMultiActionRuntimeConfig = {
  packageInstall: PackageInstallRuntimeConfig;
  repoWrite: RepoWriteRuntimeConfig;
  previewDeploy: PreviewDeployRuntimeConfig;
};

export type GeneratedExecutionGraphRefs = {
  runtimeExecutionId: string;
  generatedExecutionGraphId: string;
};

export function actionGeneratedCodeOrSpecRef(generatedCodeOrSpecRef: string, sequenceNumber: number): string {
  return `${generatedCodeOrSpecRef}#action-${sequenceNumber}`;
}

export function actionNodeId(sequenceNumber: number): string {
  return `codemode_action_${sequenceNumber}`;
}

export async function buildRuntimeExecutionInput(
  config: CodemodeMultiActionRuntimeConfig,
  program: ParsedCodemodeMultiActionProgram,
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
    allowedToolCapabilityIds: unique(
      program.actions.map((action) => configForAction(config, action.actionClass).toolCapabilityId),
    ),
    observedToolCallRefs: program.actions.map((_, index) =>
      actionGeneratedCodeOrSpecRef(program.generatedCodeOrSpecRef, index + 1),
    ),
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

export async function buildGeneratedExecutionGraphInput(
  config: CodemodeMultiActionRuntimeConfig,
  program: ParsedCodemodeMultiActionProgram,
  runtimeExecution: RuntimeExecutionRecord,
): Promise<CreateGeneratedExecutionGraphInput> {
  const nodes = await Promise.all(
    program.actions.map((action, index) => buildGeneratedExecutionNode(config, program, action, index + 1)),
  );
  const nodeGatewayBindingDigests = nodes
    .map((node) => node.nodeGatewayBindingDigest)
    .filter((digest): digest is string => Boolean(digest));
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
      actionCatalogRefs: unique([
        config.packageInstall.actionCatalogRef,
        config.repoWrite.actionCatalogRef,
        config.previewDeploy.actionCatalogRef,
      ]),
      toolCatalogRefs: unique([
        config.packageInstall.toolCatalogRef,
        config.repoWrite.toolCatalogRef,
        config.previewDeploy.toolCatalogRef,
      ]),
      toolCapabilityIds: nodes.map((node) => node.toolCapabilityId),
      actionTypeIds: nodes.map((node) => node.actionTypeId),
    } as JsonValue),
    gatewayRegistrySnapshotDigest: await digestCanonical({
      gatewayRegistryRefs: unique([
        config.packageInstall.gatewayRegistryRef,
        config.repoWrite.gatewayRegistryRef,
        config.previewDeploy.gatewayRegistryRef,
      ]),
      gatewayRegistryEntryIds: nodes.map((node) => node.gatewayRegistryEntryId),
    } as JsonValue),
    registryBindingSetDigest: await digestCanonical({ nodeGatewayBindingDigests } as JsonValue),
    nodes,
  };
}

export function graphIssuerContext(
  config: CodemodeMultiActionRuntimeConfig,
  program: ParsedCodemodeMultiActionProgram,
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

async function buildGeneratedExecutionNode(
  config: CodemodeMultiActionRuntimeConfig,
  program: ParsedCodemodeMultiActionProgram,
  action: CodemodeAction,
  sequenceNumber: number,
): Promise<GeneratedExecutionNodeInput> {
  const compileInput = await buildCompileIntentInputForAction(config, program, action, sequenceNumber, []);
  const candidate = compileInput.candidate;
  const paramsDigest = await protectedActionParamsDigest({
    parameters: candidate.parameters,
    secretRefs: candidate.secretRefs,
    gatewayCredentialRefs: candidate.gatewayCredentialRefs,
    delegatedAuthorityRefs: candidate.delegatedAuthorityRefs,
  });
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
    argvDigest: await digestCanonical({
      actionClass: candidate.actionClass,
      sequenceNumber,
      paramsDigest,
    } as JsonValue),
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
  program: ParsedCodemodeMultiActionProgram,
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
  if (action.actionClass === "preview_deploy.create") {
    return buildPreviewDeployCompileIntentInput(config.previewDeploy, {
      ...base,
      provider: action.provider,
      projectRef: action.projectRef,
      branchRef: action.branchRef,
      commitRef: action.commitRef,
      previewUrlHint: action.previewUrlHint,
    });
  }
  return buildRepoWriteCompileIntentInput(config.repoWrite, {
    ...base,
    repositoryRef: action.repositoryRef,
    filePath: action.filePath,
    content: action.content,
  });
}

function configForAction(
  config: CodemodeMultiActionRuntimeConfig,
  actionClass: "package.install" | "repo.write" | "preview_deploy.create",
): PackageInstallRuntimeConfig | RepoWriteRuntimeConfig | PreviewDeployRuntimeConfig {
  if (actionClass === "package.install") return config.packageInstall;
  if (actionClass === "preview_deploy.create") return config.previewDeploy;
  return config.repoWrite;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
