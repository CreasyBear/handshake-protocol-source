import { describe, expect, it } from "bun:test";
import {
  buildAuthMdDiscoveryEvidence,
  buildAuthMdClaimEvidence,
  buildAuthMdGatewayCredentialIntake,
  buildAuthMdIdentityAssertionEvidence,
  buildAuthMdRevocationEvidence,
  authMdProtectedApiCallRefusalReasonCodes,
  authMdProtectedResourceRef,
  proposeAuthMdProtectedApiCallActionContract,
} from "../../src/adapters/auth-md";
import { digestCanonical } from "../../src/protocol/foundation/canonical";
import { nowIso } from "../../src/protocol/foundation/ids";
import type {
  ActionType,
  GatewayRegistryEntry,
  OperatingEnvelope,
  ToolCapability,
} from "../../src/protocol/public/schemas";
import { PROTOCOL_VERSION } from "../../src/protocol/public/schemas";
import { HandshakeKernel } from "../../src/protocol/kernel";
import { InMemoryProtocolStore } from "../../src/storage/memory";
import { futureIso } from "../support/fixtures";

const protectedResource = "https://api.example.com";
const authorizationServer = "https://auth.example.com";
const selectedHeadersDigest = `sha256:${"8".repeat(64)}` as const;
const requestBodyDigest = `sha256:${"9".repeat(64)}` as const;
const rawCredential = "Bearer sk_live_authmd_secret_000000000000000000000000";

describe("auth.md adapter profiles", () => {
  it("treats authorization-server agent_auth metadata as the source of truth and auth.md prose as supporting evidence only", async () => {
    const authMdDocumentDigest = await digestCanonical({ authMd: "human readable instructions" });
    const first = await buildAuthMdDiscoveryEvidence({
      protectedResourceMetadata: {
        resource: protectedResource,
        resource_name: "Example API",
        resource_logo_uri: "https://example.com/logo.png",
        authorization_servers: [authorizationServer],
        scopes_supported: ["repo.write", "deploy.preview"],
        bearer_methods_supported: ["header"],
      },
      protectedResourceMetadataSourceRef: "https://api.example.com/.well-known/oauth-protected-resource",
      authorizationServerMetadata: {
        resource: protectedResource,
        authorization_servers: [authorizationServer],
        scopes_supported: ["repo.write", "deploy.preview"],
        bearer_methods_supported: ["header"],
        jwks_uri: `${authorizationServer}/.well-known/jwks.json`,
        token_endpoint: `${authorizationServer}/oauth/token`,
        authorization_endpoint: `${authorizationServer}/oauth/authorize`,
        claims_supported: ["email", "sub"],
        agent_auth: {
          skill: "https://workos.com/auth.md",
          register_uri: `${authorizationServer}/agent/auth`,
          claim_uri: `${authorizationServer}/agent/auth/claim`,
          revocation_uri: `${authorizationServer}/agent/auth/revoke`,
          identity_types_supported: ["anonymous", "identity_assertion"],
          anonymous: {
            credential_types_supported: ["api_key"],
          },
          identity_assertion: {
            assertion_types_supported: ["urn:ietf:params:oauth:token-type:id-jag", "verified_email"],
            credential_types_supported: ["access_token", "api_key"],
          },
          events_supported: ["https://schemas.workos.com/events/agent/auth/identity/assertion/revoked"],
        },
      },
      authorizationServerMetadataSourceRef: "https://auth.example.com/.well-known/oauth-authorization-server",
      cachePosture: "fresh",
      cacheObservedAt: "2026-05-23T00:00:00.000Z",
      cacheMaxAgeSeconds: 300,
      authMdDocumentDigest,
      discoveredAt: nowIso(),
    });
    const reordered = await buildAuthMdDiscoveryEvidence({
      protectedResourceMetadata: {
        resource: protectedResource,
        resource_name: "Example API",
        resource_logo_uri: "https://example.com/logo.png",
        authorization_servers: [authorizationServer],
        scopes_supported: ["deploy.preview", "repo.write"],
        bearer_methods_supported: ["header"],
      },
      authorizationServerMetadata: {
        resource: protectedResource,
        authorization_servers: [authorizationServer],
        scopes_supported: ["deploy.preview", "repo.write"],
        bearer_methods_supported: ["header"],
        jwks_uri: `${authorizationServer}/.well-known/jwks.json`,
        token_endpoint: `${authorizationServer}/oauth/token`,
        authorization_endpoint: `${authorizationServer}/oauth/authorize`,
        claims_supported: ["sub", "email"],
        agent_auth: {
          register_uri: `${authorizationServer}/agent/auth`,
          claim_uri: `${authorizationServer}/agent/auth/claim`,
          revocation_uri: `${authorizationServer}/agent/auth/revoke`,
          identity_types_supported: ["identity_assertion", "anonymous"],
          identity_assertion: {
            credential_types_supported: ["api_key", "access_token"],
            assertion_types_supported: ["verified_email", "urn:ietf:params:oauth:token-type:id-jag"],
          },
          anonymous: {
            credential_types_supported: ["api_key"],
          },
          events_supported: ["https://schemas.workos.com/events/agent/auth/identity/assertion/revoked"],
          skill: "https://workos.com/auth.md",
        },
      },
      authMdDocumentDigest,
      discoveredAt: first.discoveredAt,
    });

    expect(first.authorityCreated).toBe(false);
    expect(first.metadataSourceOfTruth).toBe("oauth_protected_resource_metadata_chain");
    expect(first.agentAuthSourceOfTruth).toBe("oauth_authorization_server_metadata");
    expect(first.authMdDocumentDigest).toBe(authMdDocumentDigest);
    expect(first.protectedResourceMetadataSourceRef).toBe(
      "https://api.example.com/.well-known/oauth-protected-resource",
    );
    expect(first.authorizationServerMetadata).toMatchObject({
      resource: protectedResource,
      jwksUri: `${authorizationServer}/.well-known/jwks.json`,
      claimsSupported: ["email", "sub"],
      agentAuth: {
        registerUri: `${authorizationServer}/agent/auth`,
        claimUri: `${authorizationServer}/agent/auth/claim`,
        revocationUri: `${authorizationServer}/agent/auth/revoke`,
      },
    });
    expect(first.authorizationServerMetadataDigest).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(first.cachePosture).toBe("fresh");
    expect(first.cacheMaxAgeSeconds).toBe(300);
    expect(first.authorizationServerMetadata.agentAuth.credentialTypes).toEqual(["access_token", "api_key"]);
    expect(first.authorizationServerMetadata.agentAuth.identityTypes).toEqual(["anonymous", "identity_assertion"]);
    expect(first.authorizationServerMetadata.agentAuth.identityAssertionTypes).toEqual([
      "urn:ietf:params:oauth:token-type:id-jag",
      "verified_email",
    ]);
    expect(first.protectedResourceMetadataDigest).toBe(reordered.protectedResourceMetadataDigest);
    expect(first.authorizationServerMetadataDigest).toBe(reordered.authorizationServerMetadataDigest);
  });

  it("refuses discovery metadata without agent_auth before custody activation", async () => {
    await expect(
      buildAuthMdDiscoveryEvidence({
        protectedResourceMetadata: {
          resource: protectedResource,
          authorization_servers: [authorizationServer],
          scopes_supported: ["deploy.preview"],
        },
        authorizationServerMetadata: {
          resource: protectedResource,
          authorization_servers: [authorizationServer],
          scopes_supported: ["deploy.preview"],
        } as never,
        discoveredAt: nowIso(),
      }),
    ).rejects.toThrow();
  });

  it("records ID-JAG identity assertion evidence without raw JWT or PII and refuses audience drift", async () => {
    const rawJwt = "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJqb2VsQGV4YW1wbGUuY29tIn0.signature";
    const evidence = await buildAuthMdIdentityAssertionEvidence({
      protectedResource,
      issuer: "https://provider.example.com",
      subject: "user:joel@example.com",
      audience: protectedResource,
      jti: "jti-authmd-demo",
      verifiedEmail: "joel@example.com",
      jwksOrCimdRef: "jwks:https://provider.example.com/.well-known/jwks.json#kid-1",
      assurancePosture: "jwks_verified",
      identityAssertionJwt: rawJwt,
      issuedAt: nowIso(),
      expiresAt: futureIso(),
    });

    expect(evidence).toMatchObject({
      evidenceKind: "auth_md_identity_assertion",
      authorityCreated: false,
      assurancePosture: "jwks_verified",
      rawJwtIncluded: false,
      piiIncluded: false,
    });
    expect(evidence.identityAssertionJwtDigest).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(JSON.stringify(evidence)).not.toContain(rawJwt);
    expect(JSON.stringify(evidence)).not.toContain("joel@example.com");

    const authorizationServerAudience = await buildAuthMdIdentityAssertionEvidence({
      protectedResource,
      authorizationServer,
      issuer: "https://provider.example.com",
      subject: "user:joel@example.com",
      audience: authorizationServer,
      jti: "jti-authmd-as-audience",
      verifiedEmail: "joel@example.com",
      issuedAt: nowIso(),
      expiresAt: futureIso(),
    });
    expect(authorizationServerAudience.audience).toBe(authorizationServer);

    await expect(
      buildAuthMdIdentityAssertionEvidence({
        protectedResource,
        authorizationServer,
        issuer: "https://provider.example.com",
        subject: "user:joel@example.com",
        audience: "https://evil.example.com",
        jti: "jti-authmd-demo",
        issuedAt: nowIso(),
        expiresAt: futureIso(),
      }),
    ).rejects.toThrow("audience/resource mismatch");
  });

  it("imports auth.md credentials into gateway custody without returning raw credential material", async () => {
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
      scopes: ["deploy.preview", "repo.write"],
      credentialMaterial: rawCredential,
      idJagIssuer: "https://provider.example.com",
      idJagSubject: "user:joel@example.com",
      idJagAudience: protectedResource,
      idJagJti: "jti-authmd-demo",
      idJagAssurancePosture: "jwks_verified",
      idJagJwksOrCimdRef: "jwks:https://provider.example.com/.well-known/jwks.json#kid-1",
      issuedAt: nowIso(),
      expiresAt: futureIso(),
      registeredAt: nowIso(),
    });

    expect(intake.registrationEvidence).toMatchObject({
      evidenceKind: "auth_md_registration",
      authorityCreated: false,
      credentialMaterialIncluded: false,
      credentialMaterialPosture: "gateway_custody_intake_only",
      credentialType: "access_token",
      identityFlow: "identity_assertion",
      idJagAssurancePosture: "jwks_verified",
      idJagJwksOrCimdRef: "jwks:https://provider.example.com/.well-known/jwks.json#kid-1",
    });
    expect(intake.credentialRefInput).toMatchObject({
      credentialKind: "auth_md_access_token",
      custodyStatus: "gateway_held",
      providerClass: "auth_md",
    });
    const serialized = JSON.stringify(intake);
    expect(serialized).not.toContain(rawCredential);
    expect(serialized).not.toContain("joel@example.com");
    expect(serialized).not.toMatch(/Bearer|sk_live|access_token=/);
  });

  it("refuses ID-JAG audience/resource mismatch before gateway credential custody", async () => {
    const discovery = await discoveryEvidence();
    await expect(
      buildAuthMdGatewayCredentialIntake({
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
        idJagAudience: "https://evil.example.com",
        idJagJti: "jti-authmd-demo",
        issuedAt: nowIso(),
        expiresAt: futureIso(),
        registeredAt: nowIso(),
      }),
    ).rejects.toThrow("audience/resource mismatch");
  });

  it("records claim and revocation evidence as redacted non-authority lifecycle evidence", async () => {
    const claimToken = "claim_token=authmd-secret-claim-token";
    const claim = await buildAuthMdClaimEvidence({
      registrationId: "reg_authmd_demo",
      protectedResource,
      claimState: "claimed",
      scopeTransition: "rotated_credential_ref",
      preClaimCredentialRefId: "gcr_pre_claim",
      preClaimCredentialRefDigest: `sha256:${"1".repeat(64)}`,
      postClaimCredentialRefId: "gcr_post_claim",
      postClaimCredentialRefDigest: `sha256:${"2".repeat(64)}`,
      claimToken,
      claimedSubject: "user:joel@example.com",
      verifiedEmail: "joel@example.com",
      rotateOnClaimRequired: true,
      evidenceRefs: ["evidence:auth-md-claim-provider:redacted"],
      claimedAt: nowIso(),
    });

    expect(claim).toMatchObject({
      evidenceKind: "auth_md_claim",
      authorityCreated: false,
      scopeTransition: "rotated_credential_ref",
      rotateOnClaimRequired: true,
      secretMaterialIncluded: false,
      piiIncluded: false,
    });
    expect(JSON.stringify(claim)).not.toContain(claimToken);
    expect(JSON.stringify(claim)).not.toContain("joel@example.com");

    const logoutJwt = "eyJhbGciOiJSUzI1NiJ9.eyJldmVudCI6ImxvZ291dCJ9.signature";
    const revocation = await buildAuthMdRevocationEvidence({
      registrationId: "reg_authmd_demo",
      protectedResource,
      gatewayCredentialRefId: "gcr_post_claim",
      gatewayCredentialRefDigest: `sha256:${"2".repeat(64)}`,
      revocationEventKind: "logout_jwt",
      revocationReasonCode: "auth_md_logout",
      providerEvent: { type: "logout", subject: "user:joel@example.com" },
      logoutJwt,
      evidenceRefs: ["evidence:auth-md-logout:redacted"],
      observedAt: nowIso(),
    });

    expect(revocation).toMatchObject({
      evidenceKind: "auth_md_revocation",
      authorityCreated: false,
      isolationRecommended: true,
      futurePolicyAndGatewayUseAllowed: false,
      secretMaterialIncluded: false,
      piiIncluded: false,
    });
    expect(revocation.logoutJwtDigest).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(JSON.stringify(revocation)).not.toContain(logoutJwt);
    expect(JSON.stringify(revocation)).not.toContain("joel@example.com");
  });

  it("turns an auth.md-backed write into an exact action contract without creating authority", async () => {
    const fixture = await installedAuthMdKernel();

    const result = await proposeAuthMdProtectedApiCallActionContract(fixture.kernel, runtimeConfig(fixture), {
      principalIntentRef: "intent:deploy preview using registered service credential",
      generatedCodeOrSpecRef: "code:auth-md-service-client",
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
    });

    expect(result.outcome).toBe("action_contract_proposed");
    if (result.outcome !== "action_contract_proposed") throw new Error("expected auth.md action contract");
    expect(result.actionContract.actionClass).toBe("auth_md_protected_api_call.exact");
    expect(result.actionContract.resourceRef).toBe(authMdProtectedResourceRef(protectedResource));
    expect(result.actionContract.gatewayCredentialRefs).toEqual([
      {
        credentialUseName: "auth_md_service_credential",
        gatewayCredentialRefId: fixture.credentialRef.gatewayCredentialRefId,
        gatewayCredentialRefDigest: fixture.credentialRef.gatewayCredentialRefDigest,
        providerRegistryRef: fixture.credentialRef.providerRegistryRef,
        providerRegistryDigest: fixture.credentialRef.providerRegistryDigest,
        requiredCredentialCustodyStatus: "gateway_held",
        evidenceExpectationRefs: [
          `evidence:auth-md-discovery:${fixture.discovery.protectedResourceMetadataDigest.slice(
            "sha256:".length,
            "sha256:".length + 16,
          )}`,
          `evidence:auth-md-authorization-server:${fixture.discovery.authorizationServerMetadataDigest.slice(
            "sha256:".length,
            "sha256:".length + 16,
          )}`,
        ],
      },
    ]);
    expect(result.actionContract.parameters).toMatchObject({
      profile: "auth_md_protected_api_call.exact.v0",
      targetHttpMethod: "POST",
      endpointUrl: `${protectedResource}/deployments`,
      requiredScopes: ["deploy.preview"],
      rawAuthorizationHeaderObserved: false,
      dynamicEndpointConstructionObserved: false,
    });
    expect(JSON.stringify(result.actionContract)).not.toContain(rawCredential);
    expect(await fixture.store.listRecordsByType("greenlight")).toHaveLength(0);
    expect(await fixture.store.listRecordsByType("gateway_check_attempt")).toHaveLength(0);
    expect(await fixture.store.listRecordsByType("mutation_attempt")).toHaveLength(0);
  });

  it("refuses raw credential passthrough, dynamic endpoints, read-only methods, and wrong resource origins before compilation", () => {
    const reasons = authMdProtectedApiCallRefusalReasonCodes({
      principalIntentRef: "intent:unsafe authmd call",
      generatedCodeOrSpecRef: "code:unsafe-authmd-client",
      protectedResource,
      protectedResourceMetadataDigest: `sha256:${"a".repeat(64)}`,
      authorizationServerMetadataDigest: `sha256:${"c".repeat(64)}`,
      authorizationServer,
      targetHttpMethod: "GET",
      endpointUrl: "https://evil.example.com/deployments",
      pathTemplate: "/deployments",
      requestBodyDigest: null,
      selectedHeadersDigest,
      requiredScopes: ["deploy.preview"],
      gatewayCredentialRefId: "gcr_authmd_demo",
      gatewayCredentialRefDigest: `sha256:${"b".repeat(64)}`,
      providerRegistryRef: "auth-md:https://api.example.com:registration:reg_authmd_demo",
      providerRegistryDigest: null,
      requiredCredentialCustodyStatus: "unsafe_runtime_visible",
      operationId: "unsafe_read",
      idempotencyMaterialRef: "unsafe",
      rawAuthorizationHeaderObserved: true,
      dynamicEndpointConstructionObserved: true,
    });

    expect(reasons).toEqual([
      "auth_md_dynamic_endpoint_refused",
      "auth_md_non_consequential_method_refused",
      "auth_md_protected_resource_origin_mismatch",
      "auth_md_raw_authorization_header_refused",
      "auth_md_unsafe_credential_custody_refused",
    ]);
  });
});

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

function runtimeConfig(fixture: Awaited<ReturnType<typeof installedAuthMdKernel>>) {
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
