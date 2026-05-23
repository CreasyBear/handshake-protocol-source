import { expect } from "bun:test";
import {
  buildAuthMdDiscoveryEvidence,
  buildAuthMdGatewayCredentialIntake,
  authMdEvidenceRef,
  authMdProtectedResourceRef,
} from "../../src/adapters/auth-md";
import { nowIso } from "../../src/protocol/foundation/ids";
import { HandshakeKernel } from "../../src/protocol/kernel";
import type {
  ActionType,
  GatewayRegistryEntry,
  OperatingEnvelope,
  ToolCapability,
} from "../../src/protocol/public/schemas";
import { PROTOCOL_VERSION } from "../../src/protocol/public/schemas";
import type { ProtocolObjectType, ProtocolStore } from "../../src/protocol/store/port";
import { proposeRuntimeIngressActionContracts, type RuntimeIngressObservedDispatch } from "../../src/runtime";
import { InMemoryProtocolStore } from "../../src/storage/memory";
import { futureIso } from "./fixtures";

export const authMdProtectedResource = "https://api.example.com";
export const authMdAuthorizationServer = "https://auth.example.com";
export const authMdSelectedHeadersDigest = `sha256:${"8".repeat(64)}` as const;
export const authMdRequestBodyDigest = `sha256:${"9".repeat(64)}` as const;
export const authMdRawCredential = "Bearer sk_live_authmd_secret_000000000000000000000000";

export type AuthMdFixture = Awaited<ReturnType<typeof installedAuthMdKernel>>;

export async function installedAuthMdKernel() {
  const store = new InMemoryProtocolStore();
  const kernel = new HandshakeKernel(store);
  const discovery = await authMdDiscoveryEvidence();
  const intake = await buildAuthMdGatewayCredentialIntake({
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    principalId: "principal_demo",
    gatewayId: "gateway_auth_md",
    gatewayRegistryEntryId: "gateway_registry_auth_md",
    registrationId: "reg_authmd_demo",
    protectedResourceMetadataDigest: discovery.protectedResourceMetadataDigest,
    authorizationServerMetadataDigest: discovery.authorizationServerMetadataDigest,
    protectedResource: authMdProtectedResource,
    authorizationServer: authMdAuthorizationServer,
    identityFlow: "identity_assertion",
    credentialType: "access_token",
    scopes: ["deploy.preview"],
    credentialMaterial: authMdRawCredential,
    idJagIssuer: "https://provider.example.com",
    idJagSubject: "user:joel@example.com",
    idJagAudience: authMdProtectedResource,
    idJagJti: "jti-authmd-demo",
    issuedAt: nowIso(),
    expiresAt: futureIso(),
    registeredAt: nowIso(),
  });
  const credentialRef = await kernel.registerGatewayCredentialRef(intake.credentialRefInput);
  const records = authMdCatalogRecords();
  await kernel.putCatalogObject({ objectType: "tool_capability", payload: records.tool });
  await kernel.putCatalogObject({ objectType: "action_type", payload: records.actionType });
  await kernel.putCatalogObject({ objectType: "gateway_registry_entry", payload: records.gateway });
  await kernel.putCatalogObject({ objectType: "operating_envelope", payload: records.envelope });

  return { store, kernel, discovery, registrationEvidence: intake.registrationEvidence, credentialRef, ...records };
}

export async function authMdDiscoveryEvidence() {
  return buildAuthMdDiscoveryEvidence({
    protectedResourceMetadata: {
      resource: authMdProtectedResource,
      resource_name: "Example API",
      authorization_servers: [authMdAuthorizationServer],
      scopes_supported: ["deploy.preview"],
      bearer_methods_supported: ["header"],
    },
    authorizationServerMetadata: {
      resource: authMdProtectedResource,
      authorization_servers: [authMdAuthorizationServer],
      scopes_supported: ["deploy.preview"],
      bearer_methods_supported: ["header"],
      agent_auth: {
        register_uri: `${authMdAuthorizationServer}/agent/auth`,
        claim_uri: `${authMdAuthorizationServer}/agent/auth/claim`,
        revocation_uri: `${authMdAuthorizationServer}/agent/auth/revoke`,
        identity_types_supported: ["identity_assertion"],
        identity_assertion: {
          assertion_types_supported: ["urn:ietf:params:oauth:token-type:id-jag"],
          credential_types_supported: ["access_token"],
        },
        events_supported: ["https://schemas.workos.com/events/agent/auth/identity/assertion/revoked"],
      },
    },
    authMdDocumentDigest: null,
    discoveredAt: nowIso(),
  });
}

export function authMdCatalogRecords(): {
  tool: ToolCapability;
  actionType: ActionType;
  gateway: GatewayRegistryEntry;
  envelope: OperatingEnvelope;
} {
  const createdAt = nowIso();
  const resourceRef = authMdProtectedResourceRef(authMdProtectedResource);
  return {
    tool: {
      schemaVersion: PROTOCOL_VERSION,
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      createdAt,
      toolCapabilityId: "tool_auth_md_service_call",
      toolCatalogId: "tool_catalog_auth_md",
      toolCatalogVersion: "v1",
      runtimeAdapterId: "runtime_codex",
      toolName: "auth.md protected service call",
      toolNamespace: "auth.md",
      capabilityClass: "network",
      readWriteClassification: "consequential",
      consequentialityDefault: "consequential",
      wrapperStatus: "wrapped",
      rawBypassPossible: true,
      inputSchemaRef: "schema:auth-md-protected-api-call:v0",
      outputSchemaRef: "schema:auth-md-protected-api-result:v0",
      secretBearingFields: [],
      supersededAt: null,
    },
    actionType: {
      schemaVersion: PROTOCOL_VERSION,
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      createdAt,
      actionTypeId: "atype_auth_md_service_call",
      actionCatalogId: "action_catalog_auth_md",
      actionCatalogVersion: "v1",
      actionClass: "auth_md_protected_api_call.exact",
      protectedSurfaceKind: "auth_md_api",
      requiredContractFields: ["gatewayId", "resourceRef", "paramsDigest", "idempotencyKey"],
      canonicalParameterSchemaRef: "schema:auth-md-protected-api-call:v0",
      resourceRefSchemaRef: "schema:auth-md-protected-resource-ref:v0",
      requiredEvidenceTypes: ["auth_md_discovery", "auth_md_registration"],
      allowedBoundsSchemaRef: "schema:auth-md-protected-api-bounds:v0",
      defaultReceiptRequirement: "mutation",
      defaultIdempotencyRequirement: "required",
      supersededAt: null,
    },
    gateway: {
      schemaVersion: PROTOCOL_VERSION,
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      createdAt,
      gatewayRegistryEntryId: "gateway_registry_auth_md",
      gatewayRegistryVersion: "v1",
      gatewayId: "gateway_auth_md",
      protectedSurfaceKind: "auth_md_api",
      gatewayAdapterId: "adapter_auth_md_service_gateway",
      gatewayAdapterVersion: "v0",
      gateEndpointRef: "internal:auth-md-service-gateway",
      gatewayPolicyContractId: "gateway_policy_auth_md",
      gatewayPolicyVersion: "v1",
      gatewayPolicyDriftMode: "refuse_on_drift",
      compatiblePreviousGatewayPolicyVersions: [],
      acceptedActionCatalogVersions: ["v1"],
      resourceNamespaceRef: "auth-md:https://api.example.com",
      canonicalizerVersion: "handshake-jcs-lite-0.2",
      receiptCapabilityStatus: "available",
      isolationCheckCapabilityStatus: "available",
      credentialCustodyStatus: "gateway_held",
      enforcementMode: "customer_gateway_adapter",
      mutationCredentialHolderRef: "gateway-credential-ref:gcr_authmd_demo",
      gatewayAuthorityHolderRef: "gateway-authority:auth-md-service",
      supersededAt: null,
    },
    envelope: {
      schemaVersion: PROTOCOL_VERSION,
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      createdAt,
      envelopeId: "env_auth_md",
      principalId: "principal_demo",
      agentId: "agent_demo",
      participantIdentityBindings: [],
      objectiveRef: "intent:deploy preview using registered service credential",
      allowedActionClasses: ["auth_md_protected_api_call.exact"],
      allowedGateways: ["gateway_auth_md"],
      allowedResources: [resourceRef],
      requiredProtectedPathState: "not_required",
      evidenceRequirements: ["auth_md_discovery", "auth_md_registration"],
      policyPackRef: "policy:auth-md-demo",
      policyPackVersion: "v1",
      issuedAt: createdAt,
      expiresAt: futureIso(),
      revokedAt: null,
    },
  };
}

export function authMdRuntimeConfig(fixture: AuthMdFixture) {
  return {
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    principalId: "principal_demo",
    agentId: "agent_demo",
    runId: "run_demo",
    runtimeAdapterId: "runtime_codex",
    operatingEnvelopeId: fixture.envelope.envelopeId,
    toolCatalogRef: "tool_catalog_auth_md@v1",
    actionCatalogRef: "action_catalog_auth_md@v1",
    gatewayRegistryRef: "gateway_registry_auth_md@v1",
    toolCapabilityId: fixture.tool.toolCapabilityId,
    actionTypeId: fixture.actionType.actionTypeId,
    gatewayRegistryEntryId: fixture.gateway.gatewayRegistryEntryId,
    gatewayId: fixture.gateway.gatewayId,
    contractExpiresAt: futureIso(),
    signingSecret: "test-secret",
  };
}

export function authMdRuntimeDispatch(
  fixture: AuthMdFixture,
  dispatchRef: string,
  overrides: Partial<RuntimeIngressObservedDispatch> = {},
): RuntimeIngressObservedDispatch {
  const base = {
    dispatchKind: "wrapped_auth_md_protected_api_call",
    dispatchRef,
    protectedResource: authMdProtectedResource,
    protectedResourceMetadataDigest: fixture.discovery.protectedResourceMetadataDigest,
    authorizationServerMetadataDigest: fixture.discovery.authorizationServerMetadataDigest,
    authorizationServer: authMdAuthorizationServer,
    targetHttpMethod: "POST",
    endpointUrl: `${authMdProtectedResource}/deployments`,
    pathTemplate: "/deployments",
    requestBodyDigest: authMdRequestBodyDigest,
    selectedHeadersDigest: authMdSelectedHeadersDigest,
    requiredScopes: ["deploy.preview"],
    gatewayCredentialRefId: fixture.credentialRef.gatewayCredentialRefId,
    gatewayCredentialRefDigest: fixture.credentialRef.gatewayCredentialRefDigest,
    providerRegistryRef: fixture.credentialRef.providerRegistryRef,
    providerRegistryDigest: fixture.credentialRef.providerRegistryDigest,
    requiredCredentialCustodyStatus: "gateway_held",
    operationId: "create_preview_deployment",
    idempotencyMaterialRef: "commit:abc123",
    evidenceRefs: [authMdEvidenceRef("registration", fixture.registrationEvidence.registrationEvidenceDigest)],
  } satisfies RuntimeIngressObservedDispatch;
  return { ...base, ...overrides } as RuntimeIngressObservedDispatch;
}

export async function proposeAuthMdRuntimeContract(
  fixture: AuthMdFixture,
  dispatchRef: string,
  overrides: Partial<RuntimeIngressObservedDispatch> = {},
) {
  const result = await proposeRuntimeIngressActionContracts(
    fixture.kernel,
    { authMdProtectedApiCall: authMdRuntimeConfig(fixture) },
    {
      principalIntentRef: "intent:deploy preview through auth.md fixture",
      generatedCodeOrSpecRef: `runtime:auth-md-fixture:${dispatchRef}`,
      dispatchBoundaryRef: "dispatch-boundary:auth-md-fixture",
      dispatches: [authMdRuntimeDispatch(fixture, dispatchRef, overrides)],
    },
  );
  expect(result.outcome).toBe("action_contracts_proposed");
  const proposal = result.proposals[0];
  if (!proposal || proposal.outcome !== "action_contract_proposed") {
    throw new Error("expected auth.md action contract proposal");
  }
  return proposal.actionContract;
}

export async function greenlitAuthMdRuntimeContract(
  fixtureValue?: AuthMdFixture,
  dispatchRef = "dispatch:auth-md:greenlit",
) {
  const fixture = fixtureValue ?? (await installedAuthMdKernel());
  const contract = await proposeAuthMdRuntimeContract(fixture, dispatchRef);
  const policy = await fixture.kernel.evaluatePolicy({
    actionContractId: contract.actionContractId,
    envelopeId: fixture.envelope.envelopeId,
    signingSecret: "test-secret",
  });
  if (!policy.greenlight) throw new Error(`expected auth.md greenlight, got ${policy.decision.decisionReasonCode}`);
  return { ...fixture, contract, decision: policy.decision, greenlight: policy.greenlight };
}

export async function recordCount(store: ProtocolStore, objectType: ProtocolObjectType): Promise<number> {
  return (await store.listRecordsByType(objectType)).length;
}

export async function expectNoRuntimeAuthorityRecords(store: ProtocolStore): Promise<void> {
  for (const objectType of [
    "policy_decision",
    "greenlight",
    "gateway_check_attempt",
    "mutation_attempt",
    "credential_resolution_evidence",
  ] as const) {
    expect(await recordCount(store, objectType)).toBe(0);
  }
}
