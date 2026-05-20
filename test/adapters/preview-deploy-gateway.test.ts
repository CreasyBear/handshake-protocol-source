import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "bun:test";
import { runPreviewDeployGateway, type PreviewDeploySurface } from "../../src/adapters/preview-deploy/gateway";
import { digestCanonical } from "../../src/protocol/foundation/canonical";
import { HandshakeKernel } from "../../src/protocol/kernel";
import { nowIso } from "../../src/protocol/foundation/ids";
import {
  PROTOCOL_VERSION,
  type ActionType,
  type GeneratedExecutionNodeInput,
  type GatewayRegistryEntry,
  type JsonValue,
  type OperatingEnvelope,
  type ToolCapability,
} from "../../src/protocol/public/schemas";
import {
  proposePreviewDeployActionContract,
  previewDeployResourceRef,
} from "../../src/runtime/preview-deploy/action-proposal";
import { InMemoryProtocolStore } from "../../src/storage/memory";
import { futureIso, recordSafeBypassProbes } from "../support/fixtures";

describe("local preview deploy fixture", () => {
  it("creates a local preview artifact only after exact contract, greenlight, and gateway check", async () => {
    const fixture = await createPreviewDeployFixture();
    const result = await runPreviewDeployGateway({
      protocol: fixture.kernel,
      surface: fixture.surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.parameters,
    });

    expect(result.outcome).toBe("preview_created");
    expect(result.gatewayCheck.gateAttempt.gateDecision).toBe("passed");
    expect(result.previewEvidence?.provider).toBe("local");
    expect(fixture.surface.mutationCount).toBe(1);

    const preview = JSON.parse(await readFile(result.previewEvidence?.evidenceRef.replace("file:", "") ?? "", "utf8"));
    expect(preview).toMatchObject({
      provider: "local",
      projectRef: "demo-web",
      branchRef: "feature/handshake",
      commitRef: "commit_123",
      gateAttemptId: result.gatewayCheck.gateAttempt.gateAttemptId,
    });
  });

  it("refuses mismatched preview params before local preview mutation", async () => {
    const fixture = await createPreviewDeployFixture("idem_preview_mismatch");
    const result = await runPreviewDeployGateway({
      protocol: fixture.kernel,
      surface: fixture.surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { ...fixture.parameters, commitRef: "commit_forged" },
    });

    expect(result.outcome).toBe("gateway_check_refused");
    expect(result.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("params_mismatch");
    expect(result.previewEvidence).toBeNull();
    expect(fixture.surface.mutationCount).toBe(0);
  });

  it("records unknown downstream finality as a proof gap for preview deploy", async () => {
    const fixture = await createPreviewDeployFixture("idem_preview_unknown");
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.parameters,
      surfaceOperationRef: "surface-op:preview-unknown",
    });
    if (!gate.mutationAttempt) throw new Error("expected preview mutation attempt");

    const reconciliation = await fixture.kernel.reconcileSurfaceOperation({
      mutationAttemptId: gate.mutationAttempt.mutationAttemptId,
      idempotencyKey: fixture.contract.idempotencyKey,
      observedSurfaceOperationRef: gate.mutationAttempt.surfaceOperationRef,
      observedDownstreamStatus: "unknown",
      evidenceRefs: [],
      resolvedProofGapIds: [],
    });

    expect(reconciliation.createdProofGap?.gapPhase).toBe("mutation");
    expect(reconciliation.createdProofGap?.reasonCode).toBe("orphan_mitigation_required");
  });
});

async function createPreviewDeployFixture(idempotencyMarker = "preview") {
  const store = new InMemoryProtocolStore();
  const kernel = new HandshakeKernel(store);
  const objects = makePreviewDeployObjects();
  await kernel.putCatalogObject({ objectType: "tool_capability", payload: objects.tool });
  await kernel.putCatalogObject({ objectType: "action_type", payload: objects.actionType });
  await kernel.putCatalogObject({ objectType: "gateway_registry_entry", payload: objects.gateway });
  await kernel.putCatalogObject({ objectType: "operating_envelope", payload: objects.envelope });

  const runtimeExecution = await kernel.createRuntimeExecution({
    tenantId: objects.tool.tenantId,
    organizationId: objects.tool.organizationId,
    principalIntentRef: "intent:create local preview",
    principalId: objects.envelope.principalId,
    agentId: objects.envelope.agentId,
    runId: "run_preview",
    runtimeAdapterId: objects.tool.runtimeAdapterId,
    executionShape: "codemode_block",
    runtimePosture: "bounded_generation",
    executionBlockRef: `codemode:block:${idempotencyMarker}`,
    executionBlockDigest: await digestCanonical({ code: "await tools.previewDeploy.create(...)" }),
    generatedCodeOrSpecRefs: ["code:preview-deploy-block"],
    allowedToolCapabilityIds: [objects.tool.toolCapabilityId],
    observedToolCallRefs: ["tool-call:preview-deploy"],
    observedConsequentialCallCount: 1,
    accessPosture: "controlled_outbound",
  });
  const bypassProbeIds = await recordSafeBypassProbes(
    { kernel, gateway: objects.gateway },
    {
      runtimeAdapterId: objects.tool.runtimeAdapterId,
      actionClass: objects.actionType.actionClass,
      resourceRef: objects.resourceRef,
      protectedSurfaceKind: objects.actionType.protectedSurfaceKind,
    },
  );
  await kernel.createProtectedPathPosture({
    tenantId: objects.tool.tenantId,
    organizationId: objects.tool.organizationId,
    runtimeAdapterId: objects.tool.runtimeAdapterId,
    gatewayId: objects.gateway.gatewayId,
    actionClass: objects.actionType.actionClass,
    resourceRef: objects.resourceRef,
    protectedSurfaceKind: objects.actionType.protectedSurfaceKind,
    postureState: "gateway_checked",
    credentialCustodyStatus: "fixture_gateway_held",
    rawSiblingToolStatus: "blocked",
    sourceAuthority: "gateway_probe",
    reasonCodes: ["local_preview_fixture_only"],
    evidenceRefs: ["evidence:local-preview-posture"],
    bypassProbeIds,
    expiresAt: futureIso(),
  });
  const parameters = {
    provider: "local",
    projectRef: "demo-web",
    branchRef: "feature/handshake",
    commitRef: "commit_123",
    previewUrlHint: "http://127.0.0.1/preview/demo-web",
  };
  const graphNodeId = "node_preview_deploy";
  const graph = await kernel.createGeneratedExecutionGraph(
    {
      runtimeExecutionId: runtimeExecution.runtimeExecutionId,
      graphNonce: `nonce_preview_${idempotencyMarker}`,
      parserVersion: "test-codemode-preview-parser-0.1",
      supportedGrammarVersion: "structured-action-list-0.1",
      entryNodeIds: [graphNodeId],
      edges: [],
      catalogSnapshotDigest: await digestCanonical({ catalog: "tool_catalog_preview@v1" }),
      gatewayRegistrySnapshotDigest: await digestCanonical({ gatewayRegistry: "gateway_registry_preview@v1" }),
      registryBindingSetDigest: await digestCanonical({ bindings: ["preview_deploy.create"] }),
      nodes: [await previewDeployGraphNode(objects, graphNodeId, parameters)],
    },
    {
      tenantId: objects.tool.tenantId,
      organizationId: objects.tool.organizationId,
      principalIntentRef: "intent:create local preview",
      principalId: objects.envelope.principalId,
      agentId: objects.envelope.agentId,
      runId: "run_preview",
      runtimeAdapterId: objects.tool.runtimeAdapterId,
      graphIssuerRef: "runtime-adapter:preview-fixture",
      graphIssuerAuthority: "kernel_fixture",
      graphIssuedAt: runtimeExecution.createdAt,
    },
  );
  const openedDraft = await kernel.createToolCallDraft({
    tenantId: objects.tool.tenantId,
    organizationId: objects.tool.organizationId,
    runtimeExecutionId: runtimeExecution.runtimeExecutionId,
    generatedExecutionGraphId: graph.generatedExecutionGraphId,
    generatedExecutionNodeId: graphNodeId,
    toolCapabilityId: objects.tool.toolCapabilityId,
    actionTypeId: objects.actionType.actionTypeId,
    gatewayRegistryEntryId: objects.gateway.gatewayRegistryEntryId,
    actionClass: objects.actionType.actionClass,
    gatewayId: objects.gateway.gatewayId,
    resourceRef: objects.resourceRef,
    expiresAt: futureIso(),
    evidenceRefs: ["evidence:preview-tool-call-draft"],
  });
  const toolCallDraft = await kernel.transitionToolCallDraft({
    toolCallDraftId: openedDraft.toolCallDraftId,
    nextDraftState: "finalized",
    parameters,
    nonSecretParamsSummary: parameters,
    secretRefs: {},
    finalizedAt: new Date().toISOString(),
    expiresAt: futureIso(),
    evidenceRefs: ["evidence:preview-tool-call-draft"],
  });
  const proposal = await proposePreviewDeployActionContract(
    kernel,
    {
      tenantId: objects.tool.tenantId,
      organizationId: objects.tool.organizationId,
      principalId: objects.envelope.principalId,
      agentId: objects.envelope.agentId,
      runId: "run_preview",
      runtimeAdapterId: objects.tool.runtimeAdapterId,
      operatingEnvelopeId: objects.envelope.envelopeId,
      toolCatalogRef: "tool_catalog_preview@v1",
      actionCatalogRef: "action_catalog_preview@v1",
      gatewayRegistryRef: "gateway_registry_preview@v1",
      toolCapabilityId: objects.tool.toolCapabilityId,
      actionTypeId: objects.actionType.actionTypeId,
      gatewayRegistryEntryId: objects.gateway.gatewayRegistryEntryId,
      gatewayId: objects.gateway.gatewayId,
      contractExpiresAt: futureIso(),
      signingSecret: "test-secret",
    },
    {
      principalIntentRef: "intent:create local preview",
      generatedCodeOrSpecRef: "code:preview-deploy-block",
      runtimeExecutionId: runtimeExecution.runtimeExecutionId,
      generatedExecutionGraphId: graph.generatedExecutionGraphId,
      generatedExecutionNodeId: graphNodeId,
      toolCallDraftId: toolCallDraft.toolCallDraftId,
      ...parameters,
    },
  );
  if (proposal.outcome !== "action_contract_proposed") throw new Error("expected preview contract");
  const policy = await kernel.evaluatePolicy({
    actionContractId: proposal.actionContract.actionContractId,
    envelopeId: objects.envelope.envelopeId,
    signingSecret: "test-secret",
  });
  if (!policy.greenlight) throw new Error("expected preview greenlight");

  return {
    store,
    kernel,
    ...objects,
    runtimeExecution,
    contract: proposal.actionContract,
    greenlight: policy.greenlight,
    parameters,
    surface: await createLocalPreviewSurface(),
  };
}

async function previewDeployGraphNode(
  objects: ReturnType<typeof makePreviewDeployObjects>,
  nodeId: string,
  parameters: Record<string, JsonValue>,
): Promise<GeneratedExecutionNodeInput> {
  const paramsDigest = await digestCanonical({ parameters, secretRefs: {} });
  return {
    nodeId,
    nodeKind: "codemode_action",
    classification: "candidate_action_eligible",
    actionClass: objects.actionType.actionClass,
    toolCapabilityId: objects.tool.toolCapabilityId,
    actionTypeId: objects.actionType.actionTypeId,
    gatewayRegistryEntryId: objects.gateway.gatewayRegistryEntryId,
    resourceRef: objects.resourceRef,
    paramsDigest,
    nodeGatewayBindingDigest: await digestCanonical({
      actionClass: objects.actionType.actionClass,
      toolCapabilityId: objects.tool.toolCapabilityId,
      actionTypeId: objects.actionType.actionTypeId,
      gatewayRegistryEntryId: objects.gateway.gatewayRegistryEntryId,
      resourceRef: objects.resourceRef,
      paramsDigest,
    }),
    sourceSpanDigest: await digestCanonical({ source: "tools.previewDeploy.create" }),
    redactedArgvSummary: ["tools.previewDeploy.create"],
    argvRedactionStatus: "redacted",
    stdinRedactionStatus: "digest_only",
    rawSecretMaterialDetected: false,
    commandRiskClassifierPosture: "advisory_no_match",
  };
}

function makePreviewDeployObjects() {
  const createdAt = nowIso();
  const resourceRef = previewDeployResourceRef("local", "demo-web", "feature/handshake");
  const tool: ToolCapability = {
    schemaVersion: PROTOCOL_VERSION,
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt,
    toolCapabilityId: "tool_preview_deploy",
    toolCatalogId: "tool_catalog_preview",
    toolCatalogVersion: "v1",
    runtimeAdapterId: "runtime_codex",
    toolName: "previewDeploy.create",
    toolNamespace: "local_preview",
    capabilityClass: "deploy",
    readWriteClassification: "consequential",
    consequentialityDefault: "consequential",
    wrapperStatus: "wrapped",
    rawBypassPossible: true,
    inputSchemaRef: "schema:preview-deploy-input",
    outputSchemaRef: "schema:preview-deploy-output",
    secretBearingFields: [],
    supersededAt: null,
  };
  const actionType: ActionType = {
    schemaVersion: PROTOCOL_VERSION,
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt,
    actionTypeId: "atype_preview_deploy",
    actionCatalogId: "action_catalog_preview",
    actionCatalogVersion: "v1",
    actionClass: "preview_deploy.create",
    protectedSurfaceKind: "preview_deploy",
    requiredContractFields: ["gatewayId", "resourceRef", "paramsDigest", "idempotencyKey"],
    canonicalParameterSchemaRef: "schema:preview-deploy-params",
    resourceRefSchemaRef: "schema:preview-deploy-resource",
    requiredEvidenceTypes: ["local_preview_artifact"],
    allowedBoundsSchemaRef: "schema:preview-deploy-bounds",
    defaultReceiptRequirement: "mutation",
    defaultIdempotencyRequirement: "required",
    supersededAt: null,
  };
  const gateway: GatewayRegistryEntry = {
    schemaVersion: PROTOCOL_VERSION,
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt,
    gatewayRegistryEntryId: "gateway_registry_preview_deploy",
    gatewayRegistryVersion: "v1",
    gatewayId: "gateway_preview_deploy_local",
    protectedSurfaceKind: "preview_deploy",
    gatewayAdapterId: "adapter_reference_preview_deploy",
    gatewayAdapterVersion: "v1",
    gateEndpointRef: "internal:local-preview-deploy-gate",
    gatewayPolicyContractId: "gateway_policy_preview_deploy",
    gatewayPolicyVersion: "v1",
    gatewayPolicyDriftMode: "refuse_on_drift",
    compatiblePreviousGatewayPolicyVersions: [],
    acceptedActionCatalogVersions: ["v1"],
    resourceNamespaceRef: "preview:local",
    canonicalizerVersion: "handshake-jcs-lite-0.2",
    receiptCapabilityStatus: "available",
    isolationCheckCapabilityStatus: "available",
    credentialCustodyStatus: "fixture_gateway_held",
    enforcementMode: "reference_fixture",
    mutationCredentialHolderRef: "secretref:local-preview-fixture",
    gatewayAuthorityHolderRef: "gateway-authority:local-preview-fixture",
    supersededAt: null,
  };
  const envelope: OperatingEnvelope = {
    schemaVersion: PROTOCOL_VERSION,
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt,
    envelopeId: "env_preview_deploy",
    principalId: "principal_demo",
    agentId: "agent_demo",
    objectiveRef: "intent:create local preview",
    allowedActionClasses: ["preview_deploy.create"],
    allowedGateways: ["gateway_preview_deploy_local"],
    allowedResources: [resourceRef],
    requiredProtectedPathState: "gateway_checked",
    evidenceRequirements: ["local_preview_artifact"],
    policyPackRef: "policy:preview-demo",
    policyPackVersion: "v1",
    issuedAt: createdAt,
    expiresAt: futureIso(),
    revokedAt: null,
  };
  return { tool, actionType, gateway, envelope, resourceRef };
}

async function createLocalPreviewSurface(): Promise<PreviewDeploySurface & { mutationCount: number }> {
  const root = await mkdtemp(join(tmpdir(), "handshake-preview-deploy-"));
  let mutationCount = 0;
  const surface: PreviewDeploySurface & { mutationCount: number } = {
    get mutationCount() {
      return mutationCount;
    },
    async createPreviewDeploy(command) {
      mutationCount += 1;
      const path = join(root, `${command.verifiedGate.mutationAttemptId}.json`);
      const previewUrl = command.previewUrlHint ?? `file://${path}`;
      await writeFile(
        path,
        JSON.stringify(
          {
            provider: command.provider,
            projectRef: command.projectRef,
            branchRef: command.branchRef,
            commitRef: command.commitRef,
            previewUrl,
            gateAttemptId: command.verifiedGate.gateAttemptId,
            mutationAttemptId: command.verifiedGate.mutationAttemptId,
          },
          null,
          2,
        ),
      );
      return {
        evidenceRef: `file:${path}`,
        surfaceOperationRef: command.verifiedGate.surfaceOperationRef,
        previewUrl,
        provider: command.provider,
        projectRef: command.projectRef,
        branchRef: command.branchRef,
        commitRef: command.commitRef,
      };
    },
  };
  return surface;
}
