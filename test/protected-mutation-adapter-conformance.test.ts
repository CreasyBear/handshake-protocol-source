import { describe, expect, it } from "bun:test";
import { runPackageInstallGateway } from "../src/adapters/package-install/gateway";
import { runPreviewDeployGateway, type PreviewDeploySurface } from "../src/adapters/preview-deploy/gateway";
import { runRepoWriteGateway } from "../src/adapters/repo-write/gateway";
import { HandshakeKernel } from "../src/protocol/kernel";
import { nowIso } from "../src/protocol/ids";
import {
  PROTOCOL_VERSION,
  type ActionType,
  type GatewayRegistryEntry,
  type OperatingEnvelope,
  type ToolCapability,
} from "../src/protocol/schemas";
import {
  proposePreviewDeployActionContract,
  previewDeployResourceRef,
} from "../src/runtime/preview-deploy/tool-wrapper";
import { proposeRepoWriteActionContract } from "../src/runtime/repo-write/tool-wrapper";
import { InMemoryProtocolStore } from "../src/storage/memory";
import { createGreenlitContract, futureIso } from "./fixtures";
import { createPackageManifestSurface } from "./support/package-install-flow";
import {
  createRepoWriteSurface,
  makeRepoWriteFixtureObjects,
  repoWriteRuntimeConfig,
} from "./support/repo-write-flow";

type ProtectedMutationAdapterProbe = {
  name: string;
  mutationCount(): number;
  runWithoutVerifiedGatewayCheck(): Promise<void>;
};

async function expectProtectedMutationAdapterConformance(probe: ProtectedMutationAdapterProbe): Promise<void> {
  const before = probe.mutationCount();
  await probe.runWithoutVerifiedGatewayCheck();
  const after = probe.mutationCount();
  if (after !== before) {
    throw new Error(`${probe.name} mutated without VerifiedGatewayCheck`);
  }
}

describe("ProtectedMutationAdapter conformance contract", () => {
  it("fails a deliberately unsafe adapter that mutates without VerifiedGatewayCheck", async () => {
    let mutationCount = 0;
    await expect(
      expectProtectedMutationAdapterConformance({
        name: "unsafe-adapter",
        mutationCount: () => mutationCount,
        async runWithoutVerifiedGatewayCheck() {
          mutationCount += 1;
        },
      }),
    ).rejects.toThrow("mutated without VerifiedGatewayCheck");
  });

  it("applies no-mutation conformance to package-install, repo-write, and preview-deploy adapters", async () => {
    for (const probe of [
      await packageInstallProbe(),
      await repoWriteProbe(),
      await previewDeployProbe(),
    ]) {
      await expectProtectedMutationAdapterConformance(probe);
    }
  });
});

async function packageInstallProbe(): Promise<ProtectedMutationAdapterProbe> {
  const fixture = await createGreenlitContract();
  const surface = await createPackageManifestSurface("handshake-conformance-package-");
  return {
    name: "package-install",
    mutationCount: () => surface.mutationCount,
    async runWithoutVerifiedGatewayCheck() {
      const result = await runPackageInstallGateway({
        protocol: fixture.kernel,
        surface,
        actionContractId: fixture.contract.actionContractId,
        greenlightId: fixture.greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^99.0.0" },
      });
      expect(result.outcome).toBe("gateway_check_refused");
      expect(result.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("params_mismatch");
    },
  };
}

async function repoWriteProbe(): Promise<ProtectedMutationAdapterProbe> {
  const store = new InMemoryProtocolStore();
  const kernel = new HandshakeKernel(store);
  const objects = makeRepoWriteFixtureObjects();
  await kernel.putCatalogObject({ objectType: "tool_capability", payload: objects.tool });
  await kernel.putCatalogObject({ objectType: "action_type", payload: objects.actionType });
  await kernel.putCatalogObject({ objectType: "gateway_registry_entry", payload: objects.gateway });
  await kernel.putCatalogObject({ objectType: "operating_envelope", payload: objects.envelope });

  const proposedContent = "export const generatedValue = 42;\n";
  const proposal = await proposeRepoWriteActionContract(kernel, repoWriteRuntimeConfig(objects), {
    principalIntentRef: "intent:write generated file",
    generatedCodeOrSpecRef: "code:repo-write-conformance",
    repositoryRef: objects.repositoryRef,
    filePath: objects.filePath,
    content: proposedContent,
  });
  if (proposal.outcome !== "action_contract_proposed") throw new Error("expected repo write contract");
  const policy = await kernel.evaluatePolicy({
    actionContractId: proposal.actionContract.actionContractId,
    envelopeId: objects.envelope.envelopeId,
    signingSecret: "test-secret",
  });
  if (!policy.greenlight) throw new Error("expected repo write greenlight");
  const greenlight = policy.greenlight;
  const surface = await createRepoWriteSurface("handshake-conformance-repo-");

  return {
    name: "repo-write",
    mutationCount: () => surface.mutationCount,
    async runWithoutVerifiedGatewayCheck() {
      const result = await runRepoWriteGateway({
        protocol: kernel,
        surface,
        actionContractId: proposal.actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        repositoryRef: objects.repositoryRef,
        filePath: objects.filePath,
        content: "export const generatedValue = 43;\n",
      });
      expect(result.outcome).toBe("gateway_check_refused");
      expect(result.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("params_mismatch");
    },
  };
}

async function previewDeployProbe(): Promise<ProtectedMutationAdapterProbe> {
  const store = new InMemoryProtocolStore();
  const kernel = new HandshakeKernel(store);
  const objects = makePreviewDeployObjects();
  await kernel.putCatalogObject({ objectType: "tool_capability", payload: objects.tool });
  await kernel.putCatalogObject({ objectType: "action_type", payload: objects.actionType });
  await kernel.putCatalogObject({ objectType: "gateway_registry_entry", payload: objects.gateway });
  await kernel.putCatalogObject({ objectType: "operating_envelope", payload: objects.envelope });
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
  const parameters = {
    provider: "local",
    projectRef: "demo-web",
    branchRef: "feature/handshake",
    commitRef: "commit_123",
    previewUrlHint: "http://127.0.0.1/preview/demo-web",
  };
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
    signingSecret: "test-secret",
  }, {
    principalIntentRef: "intent:create local preview",
    generatedCodeOrSpecRef: "code:preview-deploy-conformance",
    ...parameters,
  });
  if (proposal.outcome !== "action_contract_proposed") throw new Error("expected preview deploy contract");
  const policy = await kernel.evaluatePolicy({
    actionContractId: proposal.actionContract.actionContractId,
    envelopeId: objects.envelope.envelopeId,
    signingSecret: "test-secret",
  });
  if (!policy.greenlight) throw new Error("expected preview deploy greenlight");
  const greenlight = policy.greenlight;
  const surface = createPreviewDeploySurface();

  return {
    name: "preview-deploy",
    mutationCount: () => surface.mutationCount,
    async runWithoutVerifiedGatewayCheck() {
      const result = await runPreviewDeployGateway({
        protocol: kernel,
        surface,
        actionContractId: proposal.actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: { ...parameters, commitRef: "commit_forged" },
      });
      expect(result.outcome).toBe("gateway_check_refused");
      expect(result.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("params_mismatch");
    },
  };
}

function makePreviewDeployObjects(): {
  tool: ToolCapability;
  actionType: ActionType;
  gateway: GatewayRegistryEntry;
  envelope: OperatingEnvelope;
  resourceRef: string;
} {
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

function createPreviewDeploySurface(): PreviewDeploySurface & { mutationCount: number } {
  let mutationCount = 0;
  return {
    get mutationCount() {
      return mutationCount;
    },
    async createPreviewDeploy(command) {
      mutationCount += 1;
      return {
        evidenceRef: `evidence:preview-deploy:${command.verifiedGate.surfaceOperationRef}:${mutationCount}`,
        surfaceOperationRef: command.verifiedGate.surfaceOperationRef,
        previewUrl: command.previewUrlHint ?? `local-preview:${command.projectRef}`,
        provider: command.provider,
        projectRef: command.projectRef,
        branchRef: command.branchRef,
        commitRef: command.commitRef,
      };
    },
  };
}
