import { describe, expect, it } from "bun:test";
import {
  buildAuthMdDiscoveryEvidence,
  buildAuthMdGatewayCredentialIntake,
  authMdProtectedResourceRef,
  proposeAuthMdProtectedApiCallActionContract,
  runAuthMdProtectedApiCallGateway,
  type AuthMdProtectedApiCallCommand,
  type AuthMdProtectedApiCallParameters,
  type AuthMdProtectedApiCallSurface,
} from "../../src/adapters/auth-md";
import type { CredentialResolutionEvidence } from "../../src/protocol/areas/credential-custody";
import type { ProofGap } from "../../src/protocol/areas/proof-gap";
import type { Refusal } from "../../src/protocol/areas/refusal";
import { digestCanonical } from "../../src/protocol/foundation/canonical";
import { nowIso } from "../../src/protocol/foundation/ids";
import { HandshakeKernel } from "../../src/protocol/kernel";
import type {
  ActionType,
  GatewayRegistryEntry,
  OperatingEnvelope,
  ToolCapability,
} from "../../src/protocol/public/schemas";
import { PROTOCOL_VERSION } from "../../src/protocol/public/schemas";
import { InMemoryProtocolStore } from "../../src/storage/memory";
import { futureIso } from "../support/fixtures";

const protectedResource = "https://api.example.com";
const authorizationServer = "https://auth.example.com";
const selectedHeadersDigest = `sha256:${"8".repeat(64)}` as const;
const requestBodyDigest = `sha256:${"9".repeat(64)}` as const;
const rawCredential = "Bearer sk_live_authmd_secret_000000000000000000000000";

describe("auth.md protected API call gateway adapter", () => {
  it("uses the auth.md credential only after a verified gateway check and records redacted credential evidence", async () => {
    const fixture = await greenlitAuthMdContract();
    const surface = fakeAuthMdSurface("succeeded");

    const result = await runAuthMdProtectedApiCallGateway({
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters as AuthMdProtectedApiCallParameters,
      surfaceOperationRef: "surface-op:auth-md:create-preview",
    });

    expect(result.outcome).toBe("protected_api_call_reconciled");
    expect(result.gatewayCheck.gateAttempt.gateDecision).toBe("passed");
    expect(result.gatewayCheck.mutationAttempt).not.toBeNull();
    if (!result.gatewayCheck.mutationAttempt) throw new Error("expected auth.md mutation attempt");
    expect(surface.callCount()).toBe(1);
    expect(surface.commands()).toHaveLength(1);
    expect(surface.commands()[0]?.verifiedGate).toEqual({
      gatewayCheckStatus: "passed",
      gateAttemptId: result.gatewayCheck.gateAttempt.gateAttemptId,
      mutationAttemptId: result.gatewayCheck.mutationAttempt.mutationAttemptId,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      gatewayId: fixture.contract.gatewayId,
      actionClass: "auth_md_protected_api_call.exact",
      resourceRef: fixture.contract.resourceRef,
      idempotencyKey: fixture.contract.idempotencyKey,
      surfaceOperationRef: "surface-op:auth-md:create-preview",
    });
    expect(result.credentialResolutionEvidence).toMatchObject({
      gatewayCredentialRefId: fixture.credentialRef.gatewayCredentialRefId,
      gatewayCredentialRefDigest: fixture.credentialRef.gatewayCredentialRefDigest,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      gateAttemptId: result.gatewayCheck.gateAttempt.gateAttemptId,
      mutationAttemptId: result.gatewayCheck.mutationAttempt.mutationAttemptId,
      resultClass: "used_by_gateway",
      resultReasonCode: "gate_passed",
      redactionStatus: "redacted",
      credentialMaterialIncluded: false,
    } satisfies Partial<CredentialResolutionEvidence>);
    expect(result.reconciliation?.observedDownstreamStatus).toBe("succeeded");
    if (!result.credentialResolutionEvidence) throw new Error("expected credential resolution evidence");
    expect(result.reconciliation?.evidenceRefs).toContain(
      `credential_resolution_evidence:${result.credentialResolutionEvidence.credentialResolutionEvidenceId}`,
    );
    expect(await fixture.store.listRecordsByType("credential_resolution_evidence")).toHaveLength(1);
    expect(await fixture.store.listRecordsByType("proof_gap")).toHaveLength(0);
    expect(JSON.stringify(result)).not.toContain(rawCredential);
    expect(JSON.stringify(surface.commands())).not.toContain(rawCredential);
  });

  it("refuses changed observed parameters before credential resolution or service execution", async () => {
    const fixture = await greenlitAuthMdContract();
    const surface = fakeAuthMdSurface("succeeded");
    const observedParameters = {
      ...(fixture.contract.parameters as AuthMdProtectedApiCallParameters),
      selectedHeadersDigest: `sha256:${"a".repeat(64)}` as const,
    };

    const result = await runAuthMdProtectedApiCallGateway({
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters,
    });

    expect(result.outcome).toBe("gateway_check_refused");
    expect(result.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("params_mismatch");
    expect(result.gatewayCheck.mutationAttempt).toBeNull();
    expect(surface.callCount()).toBe(0);
    expect(await fixture.store.listRecordsByType("credential_resolution_evidence")).toHaveLength(0);
    expect(await fixture.store.listRecordsByType("mutation_attempt")).toHaveLength(0);
  });

  it("refuses a consumed greenlight replay before resolving credentials again", async () => {
    const fixture = await greenlitAuthMdContract();
    const surface = fakeAuthMdSurface("succeeded");
    const input = {
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters as AuthMdProtectedApiCallParameters,
    };

    const first = await runAuthMdProtectedApiCallGateway({
      ...input,
      surfaceOperationRef: "surface-op:auth-md:first",
    });
    const replay = await runAuthMdProtectedApiCallGateway({
      ...input,
      surfaceOperationRef: "surface-op:auth-md:replay",
    });

    expect(first.outcome).toBe("protected_api_call_reconciled");
    expect(replay.outcome).toBe("gateway_check_refused");
    expect(replay.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("already_consumed");
    expect(replay.gatewayCheck.receipt.greenlightConsumptionStatus).toBe("replayed");
    expect(surface.callCount()).toBe(1);
    expect(await fixture.store.listRecordsByType("credential_resolution_evidence")).toHaveLength(1);
    expect(await fixture.store.listRecordsByType("mutation_attempt")).toHaveLength(1);
    expect(await fixture.store.listRecordsByType<Refusal>("refusal")).toHaveLength(1);
  });

  it("records a proof gap when the downstream auth.md protected API finality is unknown", async () => {
    const fixture = await greenlitAuthMdContract();
    const surface = fakeAuthMdSurface("unknown");

    const result = await runAuthMdProtectedApiCallGateway({
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters as AuthMdProtectedApiCallParameters,
    });

    expect(result.outcome).toBe("protected_api_call_proof_gap");
    expect(result.reconciliation?.observedDownstreamStatus).toBe("unknown");
    expect(result.reconciliation?.finalityStatus).toBe("unknown");
    expect(result.credentialResolutionEvidence?.resultClass).toBe("used_by_gateway");
    const proofGaps = await fixture.store.listRecordsByType<ProofGap>("proof_gap");
    expect(proofGaps).toHaveLength(1);
    expect(proofGaps[0]?.payload.reasonCode).toBe("orphan_mitigation_required");
  });

  it("does not resolve credentials or call the service when the gateway check is not authoritative", async () => {
    const fixture = await greenlitAuthMdContract();
    const proofGapGate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters,
      surfaceOperationRef: "surface-op:auth-md:non-authoritative-source",
    });
    const nonAuthoritativeGate = {
      ...proofGapGate,
      gateAttempt: {
        ...proofGapGate.gateAttempt,
        gateDecision: "proof_gap" as const,
        gateDecisionReasonCode: "gateway_receipt_unavailable",
        consumedGreenlight: false,
        mutationAttemptId: null,
      },
      mutationAttempt: null,
    };
    const surface = fakeAuthMdSurface("succeeded");

    const result = await runAuthMdProtectedApiCallGateway({
      protocol: {
        gatewayCheck: async () => nonAuthoritativeGate,
        recordCredentialResolutionEvidence: async () => {
          throw new Error("non-authoritative gate must not resolve credentials");
        },
        reconcileSurfaceOperation: async () => {
          throw new Error("non-authoritative gate must not reconcile through the adapter");
        },
      },
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters as AuthMdProtectedApiCallParameters,
    });

    expect(result.outcome).toBe("gateway_check_not_authoritative");
    expect(result.gatewayCheck.gateAttempt.gateDecision).toBe("proof_gap");
    expect(surface.callCount()).toBe(0);
    expect(await fixture.store.listRecordsByType("credential_resolution_evidence")).toHaveLength(0);
  });

  it("fails closed when downstream evidence tries to return raw auth material", async () => {
    const fixture = await greenlitAuthMdContract();
    let callCount = 0;
    const surface: AuthMdProtectedApiCallSurface = {
      async executeProtectedApiCall(command) {
        callCount += 1;
        return {
          evidenceRef: `evidence:${rawCredential}`,
          surfaceOperationRef: command.verifiedGate.surfaceOperationRef,
          targetHttpMethod: command.parameters.targetHttpMethod,
          endpointUrl: command.parameters.endpointUrl,
          requestBodyDigest: command.parameters.requestBodyDigest,
          selectedHeadersDigest: command.parameters.selectedHeadersDigest,
          responseDigest: null,
          downstreamStatus: "succeeded",
          providerRequestRef: `provider-request:${rawCredential}`,
          providerOperationRef: command.providerOperationRef,
          evidenceRefs: [],
        };
      },
    };

    const result = await runAuthMdProtectedApiCallGateway({
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters as AuthMdProtectedApiCallParameters,
      surfaceOperationRef: "surface-op:auth-md:redaction-failure",
    });

    expect(result.outcome).toBe("protected_api_call_failed");
    expect(callCount).toBe(1);
    if (!result.reconciliation) throw new Error("expected failed reconciliation");
    expect(result.reconciliation.observedDownstreamStatus).toBe("failed");
    expect(result.reconciliation.diagnosticsRedactionPosture).toBe("digest_only");
    expect(result.credentialResolutionEvidence?.resultClass).toBe("used_by_gateway");
    expect(JSON.stringify(result)).not.toContain(rawCredential);
  });
});

function fakeAuthMdSurface(downstreamStatus: "succeeded" | "unknown") {
  let calls = 0;
  const seenCommands: AuthMdProtectedApiCallCommand[] = [];
  return {
    callCount: () => calls,
    commands: () => seenCommands,
    async executeProtectedApiCall(command: AuthMdProtectedApiCallCommand) {
      calls += 1;
      seenCommands.push(command);
      const responseDigest =
        downstreamStatus === "succeeded"
          ? await digestCanonical({
              ok: true,
              operationId: command.parameters.operationId,
              gateAttemptId: command.verifiedGate.gateAttemptId,
            })
          : null;
      return {
        evidenceRef: `evidence:auth-md-protected-api-call:${command.verifiedGate.gateAttemptId}`,
        surfaceOperationRef: command.verifiedGate.surfaceOperationRef,
        targetHttpMethod: command.parameters.targetHttpMethod,
        endpointUrl: command.parameters.endpointUrl,
        requestBodyDigest: command.parameters.requestBodyDigest,
        selectedHeadersDigest: command.parameters.selectedHeadersDigest,
        responseDigest,
        downstreamStatus,
        providerRequestRef: command.providerRequestRef,
        providerOperationRef: command.providerOperationRef,
        evidenceRefs: [command.credentialUseRef],
      };
    },
  };
}

async function greenlitAuthMdContract() {
  const fixture = await installedAuthMdKernel();
  const proposed = await proposeAuthMdProtectedApiCallActionContract(fixture.kernel, runtimeConfig(fixture), {
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
  if (proposed.outcome !== "action_contract_proposed") {
    throw new Error(`expected auth.md action contract, got ${proposed.outcome}`);
  }
  const policy = await fixture.kernel.evaluatePolicy({
    actionContractId: proposed.actionContract.actionContractId,
    envelopeId: fixture.envelope.envelopeId,
    signingSecret: "test-secret",
  });
  if (!policy.greenlight) throw new Error(`expected auth.md greenlight, got ${policy.decision.decisionReasonCode}`);
  return { ...fixture, contract: proposed.actionContract, greenlight: policy.greenlight };
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
    signingSecret: "test-secret",
  };
}
