import { nowIso } from "../../src/protocol/foundation/ids";
import type {
  ActionType,
  GatewayRegistryEntry,
  OperatingEnvelope,
  ToolCapability,
} from "../../src/protocol/public/schemas";
import { PROTOCOL_VERSION } from "../../src/protocol/public/schemas";
import {
  previewDeployResourceRef,
  type PreviewDeployRuntimeConfig,
} from "../../src/runtime/preview-deploy/action-proposal";
import { futureIso } from "./fixtures";

export type PreviewDeployFixtureObjects = {
  tool: ToolCapability;
  actionType: ActionType;
  gateway: GatewayRegistryEntry;
  envelope: OperatingEnvelope;
  resourceRef: string;
};

export function makePreviewDeployFixtureObjects(): PreviewDeployFixtureObjects {
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
    participantIdentityBindings: [],
    objectiveRef: "intent:create local preview",
    allowedActionClasses: ["preview_deploy.create"],
    allowedGateways: [gateway.gatewayId],
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

export function previewDeployRuntimeConfig(fixture: PreviewDeployFixtureObjects): PreviewDeployRuntimeConfig {
  return {
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    principalId: "principal_demo",
    agentId: "agent_demo",
    runId: "run_demo",
    runtimeAdapterId: "runtime_codex",
    operatingEnvelopeId: fixture.envelope.envelopeId,
    toolCatalogRef: "tool_catalog_preview@v1",
    actionCatalogRef: "action_catalog_preview@v1",
    gatewayRegistryRef: "gateway_registry_preview@v1",
    toolCapabilityId: fixture.tool.toolCapabilityId,
    actionTypeId: fixture.actionType.actionTypeId,
    gatewayRegistryEntryId: fixture.gateway.gatewayRegistryEntryId,
    gatewayId: fixture.gateway.gatewayId,
    contractExpiresAt: futureIso(),
    signingSecret: "test-secret",
  };
}
