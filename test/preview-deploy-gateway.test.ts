import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "bun:test";
import { runPreviewDeployGateway, type PreviewDeploySurface } from "../src/adapters/preview-deploy/gateway";
import { digestCanonical } from "../src/protocol/canonical";
import { HandshakeKernel } from "../src/protocol/kernel";
import { nowIso } from "../src/protocol/ids";
import { PROTOCOL_VERSION, type ActionType, type GatewayRegistryEntry, type OperatingEnvelope, type ToolCapability } from "../src/protocol/schemas";
import { proposePreviewDeployActionContract, previewDeployResourceRef } from "../src/runtime/preview-deploy/tool-wrapper";
import { InMemoryProtocolStore } from "../src/storage/memory";
import { futureIso } from "./fixtures";

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
    expect(reconciliation.createdProofGap?.reasonCode).toBe("downstream_status_unknown");
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
    sourceAuthority: "conformance_fixture",
    reasonCodes: ["local_preview_fixture_only"],
    evidenceRefs: ["evidence:local-preview-posture"],
    expiresAt: futureIso(),
  });
  const proposal = await proposePreviewDeployActionContract(kernel, {
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
    runtimeExecutionId: runtimeExecution.runtimeExecutionId,
    signingSecret: "test-secret",
  }, {
    principalIntentRef: "intent:create local preview",
    generatedCodeOrSpecRef: "code:preview-deploy-block",
    provider: "local",
    projectRef: "demo-web",
    branchRef: "feature/handshake",
    commitRef: "commit_123",
    previewUrlHint: "http://127.0.0.1/preview/demo-web",
  });
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
    parameters: {
      provider: "local",
      projectRef: "demo-web",
      branchRef: "feature/handshake",
      commitRef: "commit_123",
      previewUrlHint: "http://127.0.0.1/preview/demo-web",
    },
    surface: await createLocalPreviewSurface(),
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
