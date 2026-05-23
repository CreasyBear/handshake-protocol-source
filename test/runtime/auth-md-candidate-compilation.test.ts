import { describe, expect, it } from "bun:test";
import {
  buildAuthMdDiscoveryEvidence,
  buildAuthMdGatewayCredentialIntake,
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
import {
  proposeRuntimeIngressActionContracts,
  runtimeIngressDispatchNodeId,
  type RuntimeIngressObservedDispatch,
} from "../../src/runtime";
import { InMemoryProtocolStore } from "../../src/storage/memory";
import { futureIso } from "../support/fixtures";

const protectedResource = "https://api.example.com";
const authorizationServer = "https://auth.example.com";
const selectedHeadersDigest = `sha256:${"8".repeat(64)}` as const;
const requestBodyDigest = `sha256:${"9".repeat(64)}` as const;
const rawCredential = "Bearer sk_live_authmd_secret_000000000000000000000000";

describe("auth.md runtime candidate compilation", () => {
  it("compiles a catalog-matching auth.md service mutation into a CandidateAction without authority", async () => {
    const fixture = await installedAuthMdKernel();

    const result = await proposeRuntimeIngressActionContracts(
      fixture.kernel,
      { authMdProtectedApiCall: runtimeConfig(fixture) },
      {
        principalIntentRef: "intent:deploy preview through auth.md credential",
        generatedCodeOrSpecRef: "runtime:auth-md-dispatch-block",
        dispatchBoundaryRef: "dispatch-boundary:auth-md-wrapper",
        dispatches: [authMdDispatch(fixture, "dispatch:auth-md:1")],
      },
    );

    expect(result.outcome).toBe("action_contracts_proposed");
    expect(result.responsePosture).toMatchObject({
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
      nextAction: "read_evidence",
      reasonCodes: [],
      graphCoverageStatus: "fully_covered_no_unsupported_nodes",
    });
    expect(result.generatedExecutionGraph.supportedGrammarVersion).toBe(
      "runtime-dispatch-auth-md-protected-api-call-0.1",
    );
    expect(result.generatedExecutionGraph.nodes[0]?.nodeId).toBe(runtimeIngressDispatchNodeId(1));
    const proposal = result.proposals[0];
    if (!proposal || proposal.outcome !== "action_contract_proposed") throw new Error("expected contract proposal");
    expect(proposal.intentCompilation.candidateAction.candidateStatus).toBe("contractable");
    expect(proposal.actionContract.actionClass).toBe("auth_md_protected_api_call.exact");
    expect(proposal.actionContract.resourceRef).toBe(authMdProtectedResourceRef(protectedResource));
    expect(proposal.actionContract.parameters).toMatchObject({
      profile: "auth_md_protected_api_call.exact.v0",
      targetHttpMethod: "POST",
      endpointUrl: `${protectedResource}/deployments`,
      pathTemplate: "/deployments",
      requiredScopes: ["deploy.preview"],
      metadataCachePosture: "fresh",
      gatewayCredentialRefPosture: "fresh",
      idempotencyMaterialRefPresent: true,
      rawAuthorizationHeaderObserved: false,
      dynamicEndpointConstructionObserved: false,
      dynamicHostConstructionObserved: false,
      retryAuthorityReuseDetected: false,
    });
    expect(proposal.actionContract.gatewayCredentialRefs[0]).toMatchObject({
      gatewayCredentialRefId: fixture.credentialRef.gatewayCredentialRefId,
      gatewayCredentialRefDigest: fixture.credentialRef.gatewayCredentialRefDigest,
      requiredCredentialCustodyStatus: "gateway_held",
    });
    expect(result.responsePosture.evidenceRefs).toEqual(
      expect.arrayContaining([
        `evidence:auth-md-discovery:${fixture.discovery.protectedResourceMetadataDigest.slice(
          "sha256:".length,
          "sha256:".length + 16,
        )}`,
        `evidence:auth-md-authorization-server:${fixture.discovery.authorizationServerMetadataDigest.slice(
          "sha256:".length,
          "sha256:".length + 16,
        )}`,
      ]),
    );
    expect(JSON.stringify(result)).not.toContain(rawCredential);
    expect(await recordCount(fixture.store, "action_contract")).toBe(1);
    await expectNoRuntimeAuthorityRecords(fixture.store);
  });

  it("refuses unsafe generated auth.md shapes before policy, greenlight, gateway, or credential resolution", async () => {
    const fixture = await installedAuthMdKernel();

    const result = await proposeRuntimeIngressActionContracts(
      fixture.kernel,
      { authMdProtectedApiCall: runtimeConfig(fixture) },
      {
        principalIntentRef: "intent:deploy through unsafe auth.md generated client",
        generatedCodeOrSpecRef: "runtime:auth-md-dispatch-block-unsafe",
        dispatchBoundaryRef: "dispatch-boundary:auth-md-unsafe",
        dispatches: [
          authMdDispatch(fixture, "dispatch:auth-md:unsafe", {
            dynamicToolConstructionDetected: true,
            lateBoundParameterRefs: ["expr:auth-md-host", "expr:bearer-header"],
            requiredScopes: ["*"],
            rawAuthorizationHeaderObserved: true,
            dynamicHostConstructionObserved: true,
            metadataCachePosture: "stale",
            gatewayCredentialRefPosture: "revoked",
            idempotencyMaterialRef: null,
            retryAuthorityReuseDetected: true,
          }),
        ],
      },
    );

    expect(result.outcome).toBe("one_or_more_dispatches_refused");
    expect(result.responsePosture).toMatchObject({
      authorityCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
      actionContractRefs: [],
      graphCoverageStatus: "unsupported_or_ambiguous",
    });
    expect(result.runtimeExecution.refusalReasonCodes).toEqual(
      expect.arrayContaining([
        "auth_md_dynamic_host_refused",
        "auth_md_idempotency_material_missing",
        "auth_md_raw_authorization_header_refused",
        "auth_md_retry_authority_reuse_refused",
        "auth_md_stale_credential_ref_refused",
        "auth_md_stale_metadata_refused",
        "auth_md_wildcard_scope_refused",
      ]),
    );
    expect(result.generatedExecutionGraph.terminalReasonCodes).toEqual(
      expect.arrayContaining(["auth_md_wildcard_scope_refused", "generated_execution_node_ambiguous"]),
    );
    const proposal = result.proposals[0];
    if (!proposal || proposal.outcome !== "intent_compilation_refused") throw new Error("expected refusal");
    expect(proposal.refusalReasonCodes).toEqual(
      expect.arrayContaining([
        "runtime_dynamic_tool_construction_detected",
        "runtime_unobserved_regions_present",
        "runtime_auth_md_wildcard_scope_refused",
        "runtime_auth_md_stale_metadata_refused",
        "runtime_auth_md_stale_credential_ref_refused",
        "runtime_auth_md_idempotency_material_missing",
        "runtime_auth_md_retry_authority_reuse_refused",
        "generated_execution_graph_not_contractable",
        "generated_execution_node_not_contractable",
      ]),
    );
    expect(proposal.intentCompilation.candidateAction.candidateStatus).toBe("rejected");
    expect(await recordCount(fixture.store, "action_contract")).toBe(0);
    expect(await recordCount(fixture.store, "refusal")).toBe(1);
    await expectNoRuntimeAuthorityRecords(fixture.store);
  });

  it("records raw auth.md sibling API calls as bypass evidence instead of a gateway posture", async () => {
    const fixture = await installedAuthMdKernel();

    const result = await proposeRuntimeIngressActionContracts(
      fixture.kernel,
      { authMdProtectedApiCall: runtimeConfig(fixture) },
      {
        principalIntentRef: "intent:call auth.md protected service outside gateway",
        generatedCodeOrSpecRef: "runtime:auth-md-dispatch-block-raw",
        dispatchBoundaryRef: "dispatch-boundary:auth-md-raw",
        dispatches: [
          authMdDispatch(fixture, "dispatch:auth-md:raw", {
            dispatchKind: "raw_sibling_auth_md_protected_api_call",
            rawCommandRef: "mcp:authmd.directApiCall",
            rawCommandSummary: ["mcp.invoke", "authmd.directApiCall", "POST", `${protectedResource}/deployments`],
          }),
        ],
      },
    );

    expect(result.outcome).toBe("one_or_more_dispatches_refused");
    expect(result.responsePosture.nextAction).toBe("stop");
    expect(result.generatedExecutionGraph.coverageStatus).toBe("contains_bypass_risk");
    expect(result.generatedExecutionGraph.terminalReasonCodes).toContain("runtime_ingress_raw_sibling_bypass");
    expect(result.generatedExecutionGraph.nodes[0]?.commandRiskBypassRefs).toContain("mcp:authmd.directApiCall");
    const proposal = result.proposals[0];
    if (!proposal || proposal.outcome !== "intent_compilation_refused") throw new Error("expected refusal");
    expect(proposal.refusalReasonCodes).toContain("generated_execution_graph_not_contractable");
    expect(await recordCount(fixture.store, "action_contract")).toBe(0);
    await expectNoRuntimeAuthorityRecords(fixture.store);
  });

  it("turns missing auth.md graph coverage into refusal rather than best-effort authority", async () => {
    const fixture = await installedAuthMdKernel();

    const result = await proposeRuntimeIngressActionContracts(
      fixture.kernel,
      { authMdProtectedApiCall: runtimeConfig(fixture) },
      {
        principalIntentRef: "intent:deploy from partial auth.md graph",
        generatedCodeOrSpecRef: "runtime:auth-md-dispatch-block-partial",
        dispatchBoundaryRef: "dispatch-boundary:auth-md-partial",
        truncationStatus: "truncated",
        dispatches: [authMdDispatch(fixture, "dispatch:auth-md:partial")],
      },
    );

    expect(result.outcome).toBe("one_or_more_dispatches_refused");
    expect(result.generatedExecutionGraph.coverageStatus).toBe("contains_coverage_gap");
    expect(result.generatedExecutionGraph.terminalReasonCodes).toContain("generated_execution_graph_truncated");
    const proposal = result.proposals[0];
    if (!proposal || proposal.outcome !== "intent_compilation_refused") throw new Error("expected refusal");
    expect(proposal.refusalReasonCodes).toContain("generated_execution_graph_not_contractable");
    expect(await recordCount(fixture.store, "action_contract")).toBe(0);
    await expectNoRuntimeAuthorityRecords(fixture.store);
  });
});

async function recordCount(store: ProtocolStore, objectType: ProtocolObjectType): Promise<number> {
  return (await store.listRecordsByType(objectType)).length;
}

async function expectNoRuntimeAuthorityRecords(store: ProtocolStore): Promise<void> {
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

type AuthMdFixture = Awaited<ReturnType<typeof installedAuthMdKernel>>;

function authMdDispatch(
  fixture: AuthMdFixture,
  dispatchRef: string,
  overrides: Partial<RuntimeIngressObservedDispatch> = {},
): RuntimeIngressObservedDispatch {
  const base = {
    dispatchKind: "wrapped_auth_md_protected_api_call",
    dispatchRef,
    protectedResource,
    protectedResourceMetadataDigest: fixture.discovery.protectedResourceMetadataDigest,
    authorizationServerMetadataDigest: fixture.discovery.authorizationServerMetadataDigest,
    authorizationServer,
    targetHttpMethod: "POST",
    endpointUrl: `${protectedResource}/deployments`,
    pathTemplate: "/deployments",
    requestBodyDigest,
    selectedHeadersDigest,
    requiredScopes: ["deploy.preview"],
    gatewayCredentialRefId: fixture.credentialRef.gatewayCredentialRefId,
    gatewayCredentialRefDigest: fixture.credentialRef.gatewayCredentialRefDigest,
    providerRegistryRef: fixture.credentialRef.providerRegistryRef,
    providerRegistryDigest: fixture.credentialRef.providerRegistryDigest,
    requiredCredentialCustodyStatus: "gateway_held",
    operationId: "create_preview_deployment",
    idempotencyMaterialRef: "commit:abc123",
  } satisfies RuntimeIngressObservedDispatch;
  return { ...base, ...overrides } as RuntimeIngressObservedDispatch;
}

async function installedAuthMdKernel() {
  const store = new InMemoryProtocolStore();
  const kernel = new HandshakeKernel(store);
  const discovery = await discoveryEvidence();
  const intake = await buildAuthMdGatewayCredentialIntake({
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    principalId: "principal_demo",
    gatewayId: "gateway_auth_md",
    gatewayRegistryEntryId: "gateway_registry_auth_md",
    registrationId: "reg_authmd_demo",
    protectedResourceMetadataDigest: discovery.protectedResourceMetadataDigest,
    authorizationServerMetadataDigest: discovery.authorizationServerMetadataDigest,
    protectedResource,
    authorizationServer,
    identityFlow: "identity_assertion",
    credentialType: "access_token",
    scopes: ["deploy.preview"],
    credentialMaterial: rawCredential,
    idJagIssuer: "https://provider.example.com",
    idJagSubject: "user:joel@example.com",
    idJagAudience: protectedResource,
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

  return { store, kernel, discovery, credentialRef, ...records };
}

async function discoveryEvidence() {
  return buildAuthMdDiscoveryEvidence({
    protectedResourceMetadata: {
      resource: protectedResource,
      resource_name: "Example API",
      authorization_servers: [authorizationServer],
      scopes_supported: ["deploy.preview"],
      bearer_methods_supported: ["header"],
    },
    authorizationServerMetadata: {
      resource: protectedResource,
      authorization_servers: [authorizationServer],
      scopes_supported: ["deploy.preview"],
      bearer_methods_supported: ["header"],
      agent_auth: {
        register_uri: `${authorizationServer}/agent/auth`,
        claim_uri: `${authorizationServer}/agent/auth/claim`,
        revocation_uri: `${authorizationServer}/agent/auth/revoke`,
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

function authMdCatalogRecords(): {
  tool: ToolCapability;
  actionType: ActionType;
  gateway: GatewayRegistryEntry;
  envelope: OperatingEnvelope;
} {
  const createdAt = nowIso();
  const resourceRef = authMdProtectedResourceRef(protectedResource);
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

function runtimeConfig(fixture: AuthMdFixture) {
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
  };
}
