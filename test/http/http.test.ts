import { describe, expect, it } from "bun:test";
import { createApp } from "../../src/http/app";
import type { CallerAuthTokens, TransitionCallerRole } from "../../src/http/admission/caller-auth";
import { evidenceReadRouteDefinitions } from "../../src/http/routes/evidence-read-route-registry";
import { HandshakeProtocolError } from "../../src/protocol/foundation/errors";
import { transitionInvokers, transitionRouteDefinitions } from "../../src/http/routes/transition-route-registry";
import { HandshakeKernel } from "../../src/protocol/kernel";
import {
  type GeneratedGraphEvidenceProjection,
  PROTOCOL_VERSION,
  type ContractStreamEvent,
  type ProofGap,
  type RecoveryRecommendationStatusTransition,
  type TransitionRequestContext,
} from "../../src/protocol/public/schemas";
import { HandshakeClient } from "../../src/sdk/client";
import type { HandshakeClientError } from "../../src/sdk/client";
import { InMemoryProtocolStore } from "../../src/storage/memory";
import {
  createGreenlitContract,
  makeKernelFixture,
  makePackageInstallCandidate,
  proposalInputForCompilation,
  recordUnknownDownstreamProofGap,
} from "../support/fixtures";
import { FaultInjectingProtocolStore } from "../support/fault-injecting-protocol-store";
import {
  DIGEST_B,
  DIGEST_C,
  createGeneratedGraphEvidenceFixture,
  headerHostedVerifier,
  hostedIdentity,
  runtimeExecutionBody,
  staticHostedVerifier,
} from "../support/http-protocol-fixtures";

const TEST_CALLER_AUTH_TOKENS = {
  control_plane: "test_control_plane_token",
  runtime_evidence: "test_runtime_evidence_token",
  gateway_custody: "test_gateway_custody_token",
  review_custody: "test_review_custody_token",
} as const satisfies CallerAuthTokens;

describe("Hono protocol surface", () => {
  it("serves health and OpenAPI metadata", async () => {
    const app = createApp();

    const health = await app.request("/health");
    expect(health.status).toBe(200);
    expect(await health.json()).toMatchObject({ ok: true, protocol: "handshake" });

    const openapi = await app.request("/openapi.json");
    expect(openapi.status).toBe(200);
    const openapiDocument = (await openapi.json()) as {
      components: { securitySchemes: Record<string, { type: string; scheme: string }> };
      openapi: string;
      paths: Record<
        string,
        { get?: { security: Array<Record<string, string[]>> }; post?: { security: Array<Record<string, string[]>> } }
      >;
    };
    expect(openapiDocument).toMatchObject({ openapi: "3.1.0" });
    expect(openapiDocument.components.securitySchemes.handshakeGatewayCustodyBearer).toMatchObject({
      type: "http",
      scheme: "bearer",
    });
    const gatewayCheckPath = openapiDocument.paths["/v0.2/gateway-check-attempts"];
    expect(gatewayCheckPath).toBeDefined();
    expect(gatewayCheckPath?.post?.security).toEqual([{ handshakeGatewayCustodyBearer: [] }]);
    const graphEvidencePath =
      openapiDocument.paths["/v0.2/evidence/generated-execution-graphs/{generatedExecutionGraphId}"];
    expect(graphEvidencePath?.get?.security).toEqual([{ handshakeControlPlaneBearer: [] }]);
    expect(openapiDocument.paths["/v0.2/records/{objectType}/{objectId}"]).toBeUndefined();
  });

  it("keeps transition route registry, OpenAPI security, and debug route posture in parity", async () => {
    const app = createApp();
    const response = await app.request("/openapi.json");
    const openapiDocument = (await response.json()) as {
      paths: Record<
        string,
        { get?: { security?: Array<Record<string, string[]>> }; post?: { security?: Array<Record<string, string[]>> } }
      >;
    };

    for (const route of transitionRouteDefinitions) {
      expect(transitionInvokers[route.routeId]).toBeFunction();
      expect(openapiDocument.paths[route.path]?.post?.security).toEqual([{ [expectedSecurityScheme(route.role)]: [] }]);
    }
    for (const route of evidenceReadRouteDefinitions) {
      expect(openapiDocument.paths[route.openApiPath]?.get?.security).toEqual([
        { [expectedSecurityScheme(route.role)]: [] },
      ]);
    }

    expect(Object.keys(transitionInvokers).sort()).toEqual(
      transitionRouteDefinitions.map((route) => route.routeId).sort(),
    );

    const registeredPaths = new Set(transitionRouteDefinitions.map((route) => route.path));
    const stateChangingPaths = Object.entries(openapiDocument.paths)
      .filter(([, pathItem]) => Boolean(pathItem.post))
      .map(([path]) => path);
    expect(stateChangingPaths.every((path) => registeredPaths.has(path as `/v0.2/${string}`))).toBe(true);
  });

  it("fails closed for state-changing endpoints without durable storage", async () => {
    const fixture = makeKernelFixture();
    const app = createApp({ callerAuthTokens: TEST_CALLER_AUTH_TOKENS });

    const response = await app.request("/v0.2/catalog/tool-capabilities", {
      method: "POST",
      headers: jsonHeaders("control_plane"),
      body: JSON.stringify(fixture.tool),
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: { code: "durable_store_unavailable" },
    });
  });

  it("requires transition caller auth before parsing state-changing request bodies", async () => {
    const app = createApp({
      store: new InMemoryProtocolStore(),
      callerAuthTokens: TEST_CALLER_AUTH_TOKENS,
    });

    const response = await app.request("/v0.2/runtime-executions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ invalid: true }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      error: {
        code: "caller_auth_required",
        transitionName: "createRuntimeExecution",
        callerCustodyRole: "runtime_evidence",
        retryability: "terminal",
        commitState: "not_started",
        requestIdentity: null,
      },
    });
  });

  it("fails closed when transition caller auth is not configured", async () => {
    const app = createApp({ store: new InMemoryProtocolStore() });

    const response = await app.request("/v0.2/runtime-executions", {
      method: "POST",
      headers: jsonHeaders("runtime_evidence"),
      body: JSON.stringify({ invalid: true }),
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: {
        code: "caller_auth_not_configured",
        transitionName: "createRuntimeExecution",
        callerCustodyRole: "runtime_evidence",
        retryability: "terminal",
        commitState: "not_started",
      },
    });
  });

  it("refuses a caller token from the wrong custody role", async () => {
    const app = createApp({
      store: new InMemoryProtocolStore(),
      callerAuthTokens: TEST_CALLER_AUTH_TOKENS,
    });

    const response = await app.request("/v0.2/gateway-check-attempts", {
      method: "POST",
      headers: jsonHeaders("control_plane"),
      body: JSON.stringify({ invalid: true }),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: {
        code: "caller_auth_forbidden",
        transitionName: "gatewayCheck",
        callerCustodyRole: "gateway_custody",
        retryability: "terminal",
        commitState: "not_started",
      },
    });
  });

  it("requires control-plane custody for internal record reads", async () => {
    const app = createApp({
      store: new InMemoryProtocolStore(),
      callerAuthTokens: TEST_CALLER_AUTH_TOKENS,
    });

    const missingAuth = await app.request("/v0.2/records/action_contract/ac_missing");
    expect(missingAuth.status).toBe(401);
    expect(await missingAuth.json()).toMatchObject({
      error: { code: "caller_auth_required" },
    });

    const wrongRole = await app.request("/v0.2/records/action_contract/ac_missing", {
      headers: jsonHeaders("runtime_evidence"),
    });
    expect(wrongRole.status).toBe(403);
    expect(await wrongRole.json()).toMatchObject({
      error: { code: "caller_auth_forbidden" },
    });

    const controlPlane = await app.request("/v0.2/records/action_contract/ac_missing", {
      headers: jsonHeaders("control_plane"),
    });
    expect(controlPlane.status).toBe(404);
    expect(await controlPlane.json()).toMatchObject({
      error: { code: "record_not_found" },
    });

    const invalidType = await app.request("/v0.2/records/not_a_record/ac_missing", {
      headers: jsonHeaders("control_plane"),
    });
    expect(invalidType.status).toBe(400);
    expect(await invalidType.json()).toMatchObject({
      error: { code: "invalid_protocol_object_type" },
    });
  });

  it("hosted mode refuses lane-token-only transition admission before parsing request bodies", async () => {
    const store = new InMemoryProtocolStore();
    const app = createApp({
      store,
      callerAuthTokens: TEST_CALLER_AUTH_TOKENS,
      authMode: "hosted",
    });

    const response = await app.request("/v0.2/runtime-executions", {
      method: "POST",
      headers: jsonHeaders("runtime_evidence"),
      body: JSON.stringify({ invalid: true }),
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: { code: "hosted_caller_verifier_not_configured", commitState: "not_started" },
    });
    expect(store.countRecordsOfType("runtime_execution")).toBe(0);
    expect(store.countRecordsOfType("transition_request_context")).toBe(0);
  });

  it("hosted mode ignores caller-supplied identity-like fields as admission authority", async () => {
    const store = new InMemoryProtocolStore();
    const app = createApp({
      store,
      authMode: "hosted",
      hostedCallerVerifier: headerHostedVerifier(),
    });

    const response = await app.request("/v0.2/runtime-executions", {
      method: "POST",
      headers: {
        ...jsonHeaders("runtime_evidence"),
        "x-handshake-originating-identity": "ref:workspace_org_demo",
        "x-handshake-caller-email": "admin@example.test",
        "x-handshake-team": "org_demo",
      },
      body: JSON.stringify(runtimeExecutionBody(makeKernelFixture())),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      error: { code: "hosted_caller_auth_required", commitState: "not_started" },
    });
    expect(store.countRecordsOfType("runtime_execution")).toBe(0);
    expect(store.countRecordsOfType("transition_request_context")).toBe(0);
  });

  it("hosted mode checks route custody before body parsing", async () => {
    const store = new InMemoryProtocolStore();
    const app = createApp({
      store,
      authMode: "hosted",
      hostedCallerVerifier: staticHostedVerifier(hostedIdentity({ custodyRoles: ["control_plane"] })),
    });

    const response = await app.request("/v0.2/runtime-executions", {
      method: "POST",
      headers: jsonHeaders("runtime_evidence"),
      body: JSON.stringify({ invalid: true }),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: { code: "hosted_caller_role_forbidden", commitState: "not_started" },
    });
    expect(store.countRecordsOfType("runtime_execution")).toBe(0);
    expect(store.countRecordsOfType("transition_request_context")).toBe(0);
  });

  it("hosted mode rejects wrong tenant scope before kernel invocation", async () => {
    const fixture = makeKernelFixture();
    const store = new InMemoryProtocolStore();
    const app = createApp({
      store,
      authMode: "hosted",
      hostedCallerVerifier: staticHostedVerifier(
        hostedIdentity({ tenantId: "tenant_other", custodyRoles: ["runtime_evidence"] }),
      ),
    });

    const response = await app.request("/v0.2/runtime-executions", {
      method: "POST",
      headers: jsonHeaders("runtime_evidence"),
      body: JSON.stringify(runtimeExecutionBody(fixture)),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: { code: "hosted_caller_scope_forbidden", commitState: "not_started" },
    });
    expect(store.countRecordsOfType("runtime_execution")).toBe(0);
    expect(store.countRecordsOfType("transition_request_context")).toBe(0);
  });

  it("hosted mode rejects expired caller identity before body parsing", async () => {
    const store = new InMemoryProtocolStore();
    const app = createApp({
      store,
      authMode: "hosted",
      hostedCallerVerifier: staticHostedVerifier(
        hostedIdentity({
          custodyRoles: ["runtime_evidence"],
          expiresAt: new Date(Date.now() - 1_000).toISOString(),
        }),
      ),
    });

    const response = await app.request("/v0.2/runtime-executions", {
      method: "POST",
      headers: jsonHeaders("runtime_evidence"),
      body: JSON.stringify({ invalid: true }),
    });

    expect(response.status).toBe(412);
    expect(await response.json()).toMatchObject({
      error: { code: "hosted_caller_identity_expired", commitState: "not_started" },
    });
    expect(store.countRecordsOfType("runtime_execution")).toBe(0);
    expect(store.countRecordsOfType("transition_request_context")).toBe(0);
  });

  it("hosted mode propagates revoked caller refusal with zero records", async () => {
    const store = new InMemoryProtocolStore();
    const app = createApp({
      store,
      authMode: "hosted",
      hostedCallerVerifier: {
        async verify() {
          throw new HandshakeProtocolError(
            "hosted_caller_identity_revoked",
            "Hosted caller identity has been revoked by the configured verifier.",
            412,
            { retryability: "terminal", commitState: "not_started" },
          );
        },
      },
    });

    const response = await app.request("/v0.2/runtime-executions", {
      method: "POST",
      headers: jsonHeaders("runtime_evidence"),
      body: JSON.stringify({ invalid: true }),
    });

    expect(response.status).toBe(412);
    expect(await response.json()).toMatchObject({
      error: { code: "hosted_caller_identity_revoked", commitState: "not_started" },
    });
    expect(store.countRecordsOfType("runtime_execution")).toBe(0);
    expect(store.countRecordsOfType("transition_request_context")).toBe(0);
  });

  it("hosted mode stores only caller digest/ref evidence on accepted transitions", async () => {
    const fixture = makeKernelFixture();
    const store = new InMemoryProtocolStore();
    const app = createApp({
      store,
      authMode: "hosted",
      hostedCallerVerifier: staticHostedVerifier(hostedIdentity({ custodyRoles: ["runtime_evidence"] })),
    });

    const response = await app.request("/v0.2/runtime-executions", {
      method: "POST",
      headers: {
        ...jsonHeaders("runtime_evidence"),
        "x-hosted-test-email": "alice@example.test",
        authorization: "Bearer raw-local-token-that-must-not-persist",
      },
      body: JSON.stringify(runtimeExecutionBody(fixture)),
    });

    expect(response.status).toBe(201);
    const contexts = await store.listRecordsByType<TransitionRequestContext>("transition_request_context");
    expect(contexts).toHaveLength(1);
    expect(contexts[0]?.payload).toMatchObject({
      callerIdentityRef: "ref:hosted-caller-demo",
      callerSubjectDigest: DIGEST_B,
      callerTenantId: "tenant_demo",
      callerOrganizationId: "org_demo",
      callerIdentityClaimsDigest: expect.stringMatching(/^sha256:/),
      authProviderRef: "provider:test",
      authSessionDigest: DIGEST_C,
      serviceCredentialDigest: null,
    });
    const contextJson = JSON.stringify(contexts[0]?.payload);
    expect(contextJson).not.toContain("alice@example.test");
    expect(contextJson).not.toContain("raw-local-token");
  });

  it("hosted reference-scope transitions do not expose missing versus cross-tenant anchors", async () => {
    const fixture = await createGreenlitContract();
    const beforeDecisions =
      fixture.store instanceof InMemoryProtocolStore ? fixture.store.countRecordsOfType("policy_decision") : 0;
    const app = createApp({
      store: fixture.store,
      authMode: "hosted",
      hostedCallerVerifier: staticHostedVerifier(
        hostedIdentity({ tenantId: "tenant_other", custodyRoles: ["control_plane"] }),
      ),
    });

    const crossTenant = await app.request("/v0.2/policy-decisions", {
      method: "POST",
      headers: jsonHeaders("control_plane"),
      body: JSON.stringify({
        actionContractId: fixture.contract.actionContractId,
        envelopeId: fixture.envelope.envelopeId,
        signingSecret: "test-secret",
      }),
    });
    const missingAnchor = await app.request("/v0.2/policy-decisions", {
      method: "POST",
      headers: jsonHeaders("control_plane"),
      body: JSON.stringify({
        actionContractId: "act_missing",
        envelopeId: fixture.envelope.envelopeId,
        signingSecret: "test-secret",
      }),
    });

    expect(crossTenant.status).toBe(404);
    expect(missingAnchor.status).toBe(404);
    const crossTenantBody = (await crossTenant.json()) as { error: { message: string } };
    const missingAnchorBody = (await missingAnchor.json()) as { error: { message: string } };
    expect(crossTenantBody).toMatchObject({
      error: { code: "contract_missing", commitState: "not_started" },
    });
    expect(missingAnchorBody).toMatchObject({
      error: { code: "contract_missing", commitState: "not_started" },
    });
    expect(crossTenantBody.error.message).toBe(missingAnchorBody.error.message);
    if (fixture.store instanceof InMemoryProtocolStore) {
      expect(fixture.store.countRecordsOfType("policy_decision")).toBe(beforeDecisions);
    }
  });

  it("requires protocol version and request identity before committing transition records", async () => {
    const fixture = makeKernelFixture();
    const store = new InMemoryProtocolStore();
    const app = createApp({ store, callerAuthTokens: TEST_CALLER_AUTH_TOKENS });

    const missingVersion = await app.request("/v0.2/catalog/tool-capabilities", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${TEST_CALLER_AUTH_TOKENS.control_plane}`,
        "x-handshake-request-identity": "request-missing-version",
      },
      body: JSON.stringify(fixture.tool),
    });
    expect(missingVersion.status).toBe(400);
    expect(await missingVersion.json()).toMatchObject({ error: { code: "protocol_version_required" } });

    const unsupportedVersion = await app.request("/v0.2/catalog/tool-capabilities", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${TEST_CALLER_AUTH_TOKENS.control_plane}`,
        "x-handshake-protocol-version": "0.0.1",
        "x-handshake-request-identity": "request-unsupported-version",
      },
      body: JSON.stringify(fixture.tool),
    });
    expect(unsupportedVersion.status).toBe(412);
    expect(await unsupportedVersion.json()).toMatchObject({ error: { code: "protocol_version_unsupported" } });

    const unsafeRequestIdentity = await app.request("/v0.2/catalog/tool-capabilities", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${TEST_CALLER_AUTH_TOKENS.control_plane}`,
        "x-handshake-protocol-version": PROTOCOL_VERSION,
        "x-handshake-request-identity": "request with spaces",
      },
      body: JSON.stringify(fixture.tool),
    });
    expect(unsafeRequestIdentity.status).toBe(400);
    expect(await unsafeRequestIdentity.json()).toMatchObject({ error: { code: "request_identity_invalid" } });

    const rawOriginatingIdentity = await app.request("/v0.2/catalog/tool-capabilities", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${TEST_CALLER_AUTH_TOKENS.control_plane}`,
        "x-handshake-protocol-version": PROTOCOL_VERSION,
        "x-handshake-request-identity": "request-raw-originating-identity",
        "x-handshake-originating-identity": "principal@example.test",
      },
      body: JSON.stringify(fixture.tool),
    });
    expect(rawOriginatingIdentity.status).toBe(400);
    expect(await rawOriginatingIdentity.json()).toMatchObject({ error: { code: "originating_identity_invalid" } });

    expect(store.countRecordsOfType("tool_capability")).toBe(0);
    expect(store.countRecordsOfType("transition_request_context")).toBe(0);
  });

  it("returns typed transition error envelopes for schema failures", async () => {
    const fixture = await createGreenlitContract();
    const app = createApp({ store: fixture.store, callerAuthTokens: TEST_CALLER_AUTH_TOKENS });

    const response = await app.request("/v0.2/gateway-check-attempts", {
      method: "POST",
      headers: jsonHeaders("gateway_custody"),
      body: JSON.stringify({
        actionContractId: fixture.contract.actionContractId,
        greenlightId: fixture.greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
        downstreamMode: "succeed",
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: {
        code: "invalid_request",
        message: "Transition request body failed schema validation.",
        transitionName: "gatewayCheck",
        callerCustodyRole: "gateway_custody",
        retryability: "terminal",
        commitState: "not_started",
        requestIdentity: "test-request-gateway_custody",
        proofRef: null,
        refusalRef: null,
      },
    });
  });

  it("returns ambiguous commit state without turning a committed record into authority", async () => {
    const fixture = makeKernelFixture();
    const store = new FaultInjectingProtocolStore(new InMemoryProtocolStore()).injectAmbiguousProtocolCommitOnce({
      when: (commit) => commit.records.some((record) => record.objectType === "runtime_execution"),
    });
    const app = createApp({ store, callerAuthTokens: TEST_CALLER_AUTH_TOKENS });

    const response = await app.request("/v0.2/runtime-executions", {
      method: "POST",
      headers: jsonHeaders("runtime_evidence"),
      body: JSON.stringify(runtimeExecutionBody(fixture)),
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: {
        code: "ambiguous_commit",
        transitionName: "createRuntimeExecution",
        callerCustodyRole: "runtime_evidence",
        retryability: "ambiguous",
        commitState: "unknown",
        requestIdentity: "test-request-runtime_evidence",
        proofRef: null,
        refusalRef: null,
      },
    });
    expect(store.countRecordsOfType("runtime_execution")).toBe(1);
    expect(store.countRecordsOfType("action_contract")).toBe(0);
    expect(store.countRecordsOfType("greenlight")).toBe(0);
    expect(store.countRecordsOfType("gateway_check_attempt")).toBe(0);
  });

  it("records transition request context digest/reference only on accepted transition events", async () => {
    const fixture = makeKernelFixture();
    const store = new InMemoryProtocolStore();
    const app = createApp({ store, callerAuthTokens: TEST_CALLER_AUTH_TOKENS });
    const requestIdentity = "request-runtime-evidence-1";
    const originatingIdentityRef = "ref:principal_demo";

    const response = await app.request("/v0.2/runtime-executions", {
      method: "POST",
      headers: {
        ...jsonHeaders("runtime_evidence"),
        "x-handshake-request-identity": requestIdentity,
        "x-handshake-originating-identity": originatingIdentityRef,
      },
      body: JSON.stringify({
        tenantId: "tenant_demo",
        organizationId: "org_demo",
        principalIntentRef: "intent:http request context",
        principalId: "principal_demo",
        agentId: "agent_demo",
        runId: "run_http_context",
        runtimeAdapterId: "runtime_codex",
        executionShape: "single_tool_call",
        runtimePosture: "protected_capability",
        executionBlockRef: "code:http-context",
        executionBlockDigest: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        generatedCodeOrSpecRefs: [],
        allowedToolCapabilityIds: [fixture.tool.toolCapabilityId],
        observedToolCallRefs: [],
        observedConsequentialCallCount: 1,
        loopDetected: false,
        retryDetected: false,
        branchDetected: false,
        dynamicToolConstructionDetected: false,
        unobservedRegionRefs: [],
        accessPosture: "isolated",
        uncertaintyMarkers: [],
        refusalReasonCodes: [],
        evidenceRefs: [],
      }),
    });

    expect(response.status).toBe(201);
    expect(response.headers.get("x-handshake-request-identity")).toBe(requestIdentity);

    const contexts = await store.listRecordsByType<TransitionRequestContext>("transition_request_context");
    expect(contexts).toHaveLength(1);
    const context = contexts[0]?.payload;
    expect(context).toMatchObject({
      protocolVersionSeen: PROTOCOL_VERSION,
      requestIdentity,
      callerCustodyRole: "runtime_evidence",
      transitionName: "createRuntimeExecution",
      routePattern: "/v0.2/runtime-executions",
    });
    expect(context?.originatingIdentityDigest).toMatch(/^sha256:/);
    expect(context?.originatingIdentityRef).toBe(originatingIdentityRef);
    expect(JSON.stringify(context)).not.toContain("principal@example.test");

    const events = await store.listRecordsByType<ContractStreamEvent>("contract_stream_event");
    expect(events.map((record) => record.payload.payload.requestContextDigest)).toContain(
      context?.requestContextDigest,
    );
  });

  it("returns redacted generated graph evidence projections without creating protocol records", async () => {
    const { graph, store } = await createGeneratedGraphEvidenceFixture();
    const app = createApp({ store, callerAuthTokens: TEST_CALLER_AUTH_TOKENS });
    const contextCountBefore = store.countRecordsOfType("transition_request_context");

    const response = await app.request(`/v0.2/evidence/generated-execution-graphs/${graph.generatedExecutionGraphId}`, {
      headers: jsonHeaders("control_plane"),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as GeneratedGraphEvidenceProjection & {
      nodes?: unknown;
      edges?: unknown;
    };
    expect(body).toMatchObject({
      graphRef: graph.generatedExecutionGraphId,
      runtimeExecutionRef: graph.runtimeExecutionId,
      executionBlockDigest: graph.executionBlockDigest,
      coverageStatus: graph.coverageStatus,
      catalogDigest: graph.catalogSnapshotDigest,
      gatewayRegistryDigest: graph.gatewayRegistrySnapshotDigest,
      graphDigest: graph.graphDigest,
    });
    expect(body.contractableNodeRefs).toHaveLength(1);
    expect(body.contractableNodeRefs[0]).toMatchObject({
      nodeId: "node_install",
      classification: "candidate_action_eligible",
    });
    expect(body.nodes).toBeUndefined();
    expect(body.edges).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("redactedArgvSummary");
    expect(JSON.stringify(body)).not.toContain("bun add");
    expect(store.countRecordsOfType("transition_request_context")).toBe(contextCountBefore);
  });

  it("hides generated graph evidence projections across hosted tenant boundaries", async () => {
    const { graph, store } = await createGeneratedGraphEvidenceFixture();
    const app = createApp({
      store,
      authMode: "hosted",
      hostedCallerVerifier: staticHostedVerifier(
        hostedIdentity({ tenantId: "tenant_other", custodyRoles: ["control_plane"] }),
      ),
    });

    const response = await app.request(`/v0.2/evidence/generated-execution-graphs/${graph.generatedExecutionGraphId}`, {
      headers: jsonHeaders("control_plane"),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      error: { code: "record_not_found", commitState: "not_applicable" },
    });
    expect(store.countRecordsOfType("transition_request_context")).toBe(0);
  });

  it("SDK sets protocol headers, routes per-role tokens, and preserves fallback token behavior", async () => {
    const calls: Array<{ path: string; headers: Headers }> = [];
    const fetchImpl = async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      calls.push({ path: new URL(String(input)).pathname, headers: new Headers(init?.headers) });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    };
    const client = new HandshakeClient("http://handshake.test", fetchImpl, {
      transitionToken: "fallback-token",
      transitionTokens: { gateway_custody: "gateway-token" },
      requestIdentityFactory: () => "sdk-request-id",
    });

    await client.gatewayCheck({ actionContractId: "act_demo", greenlightId: "grn_demo", observedParameters: {} });
    await client.createReceiptExport({ receiptId: "rcp_demo", requestedByRef: "auditor:test" });

    expect(calls[0]?.headers.get("authorization")).toBe("Bearer gateway-token");
    expect(calls[1]?.headers.get("authorization")).toBe("Bearer fallback-token");
    expect(calls[0]?.headers.get("x-handshake-protocol-version")).toBe(PROTOCOL_VERSION);
    expect(calls[0]?.headers.get("x-handshake-request-identity")).toBe("sdk-request-id");
  });

  it("SDK reads generated graph evidence projections with GET auth and typed errors", async () => {
    const calls: Array<{
      path: string;
      method: string | undefined;
      headers: Headers;
      body: BodyInit | null | undefined;
    }> = [];
    const fetchImpl = async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      calls.push({
        path: new URL(String(input)).pathname,
        method: init?.method,
        headers: new Headers(init?.headers),
        body: init?.body,
      });
      return new Response(JSON.stringify({ graphRef: "geg_demo" }), { status: 200 });
    };
    const client = new HandshakeClient("http://handshake.test", fetchImpl, {
      transitionTokens: { control_plane: "control-token" },
      requestIdentityFactory: () => "sdk-read-request-id",
    });

    await client.getGeneratedGraphEvidenceProjection("geg_demo");

    expect(calls[0]?.path).toBe("/v0.2/evidence/generated-execution-graphs/geg_demo");
    expect(calls[0]?.method).toBe("GET");
    expect(calls[0]?.headers.get("authorization")).toBe("Bearer control-token");
    expect(calls[0]?.headers.get("x-handshake-protocol-version")).toBe(PROTOCOL_VERSION);
    expect(calls[0]?.headers.get("x-handshake-request-identity")).toBe("sdk-read-request-id");
    expect(calls[0]?.headers.get("content-type")).toBeNull();
    expect(calls[0]?.body).toBeUndefined();

    const errorClient = new HandshakeClient(
      "http://handshake.test",
      async () =>
        new Response(
          JSON.stringify({
            error: {
              code: "record_not_found",
              message: "Protocol evidence record was not found.",
              transitionName: "getGeneratedGraphEvidenceProjection",
              callerCustodyRole: "control_plane",
              retryability: "terminal",
              commitState: "not_applicable",
              requestIdentity: null,
              proofRef: null,
              refusalRef: null,
            },
          }),
          { status: 404 },
        ),
    );
    await expect(errorClient.getGeneratedGraphEvidenceProjection("geg_missing")).rejects.toMatchObject({
      name: "HandshakeClientError",
      status: 404,
      code: "record_not_found",
      transitionName: "getGeneratedGraphEvidenceProjection",
    } satisfies Partial<HandshakeClientError>);
  });

  it("SDK throws typed HandshakeClientError for transition error envelopes", async () => {
    const fetchImpl = async () =>
      new Response(
        JSON.stringify({
          error: {
            code: "recovery_terminal_conflict",
            message: "Recovery recommendation already has a terminal status transition.",
            transitionName: "proposeActionContract",
            callerCustodyRole: "control_plane",
            retryability: "recoverable",
            commitState: "committed",
            requestIdentity: "sdk-request-id",
            proofRef: "gap_demo",
            refusalRef: null,
          },
        }),
        { status: 409 },
      );
    const client = new HandshakeClient("http://handshake.test", fetchImpl, {
      transitionToken: "fallback-token",
      requestIdentityFactory: () => "sdk-request-id",
    });

    await expect(
      client.proposeActionContract({
        intentCompilationId: "ic_demo",
        candidateActionId: "cand_demo",
        candidateDigest: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      }),
    ).rejects.toMatchObject({
      name: "HandshakeClientError",
      status: 409,
      code: "recovery_terminal_conflict",
      transitionName: "proposeActionContract",
      retryability: "recoverable",
      commitState: "committed",
      proofRef: "gap_demo",
    } satisfies Partial<HandshakeClientError>);
  });

  it("returns structured gate receipts through HTTP", async () => {
    const fixture = await createGreenlitContract();
    const app = createApp({ store: fixture.store, callerAuthTokens: TEST_CALLER_AUTH_TOKENS });

    const response = await app.request("/v0.2/gateway-check-attempts", {
      method: "POST",
      headers: jsonHeaders("gateway_custody"),
      body: JSON.stringify({
        actionContractId: fixture.contract.actionContractId,
        greenlightId: fixture.greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
      }),
    });

    expect(response.status).toBe(201);
    const body = (await response.json()) as {
      gateAttempt: { gateDecision: string };
      receipt: { finalityStatus: string };
    };
    expect(body.gateAttempt.gateDecision).toBe("passed");
    expect(body.receipt.finalityStatus).toBe("pending");
  });

  it("rejects caller-declared downstream outcomes at the gateway-check route", async () => {
    const fixture = await createGreenlitContract();
    const app = createApp({ store: fixture.store, callerAuthTokens: TEST_CALLER_AUTH_TOKENS });

    const response = await app.request("/v0.2/gateway-check-attempts", {
      method: "POST",
      headers: jsonHeaders("gateway_custody"),
      body: JSON.stringify({
        actionContractId: fixture.contract.actionContractId,
        greenlightId: fixture.greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
        downstreamMode: "succeed",
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: "invalid_request" } });
  });

  it("binds recovery terminal conflict proof gaps into HTTP error envelopes", async () => {
    const state = await createRecoveryTerminalConflictAttempt();
    const app = createApp({ store: state.fixture.store, callerAuthTokens: TEST_CALLER_AUTH_TOKENS });

    const response = await app.request("/v0.2/action-contracts", {
      method: "POST",
      headers: jsonHeaders("control_plane"),
      body: JSON.stringify(state.followUpInput),
    });

    expect(response.status).toBe(409);
    const body = (await response.json()) as { error: { proofRef: string } };
    expect(body).toMatchObject({
      error: {
        code: "recovery_terminal_conflict",
        transitionName: "proposeActionContract",
        callerCustodyRole: "control_plane",
        retryability: "recoverable",
        commitState: "committed",
        requestIdentity: "test-request-control_plane",
        refusalRef: null,
      },
    });
    expect(body.error.proofRef).toMatch(/^gap_/);
    const storedGap = await state.fixture.store.getRecord<ProofGap>("proof_gap", body.error.proofRef);
    expect(storedGap?.payload.reasonCode).toBe("recovery_terminal_conflict");
  });

  it("resolves recovery terminal conflict proof gaps through HTTP", async () => {
    const state = await createRecoveryTerminalConflictState();
    const app = createApp({ store: state.fixture.store, callerAuthTokens: TEST_CALLER_AUTH_TOKENS });

    const response = await app.request("/v0.2/recovery-terminal-conflict-resolutions", {
      method: "POST",
      headers: jsonHeaders("control_plane"),
      body: JSON.stringify({
        proofGapId: state.terminalConflictGap.proofGapId,
        recoveryRecommendationStatusTransitionId: state.winningTransition.recoveryRecommendationStatusTransitionId,
        observedByRef: "test:http-terminal-transition-loader",
      }),
    });

    expect(response.status).toBe(201);
    const body = (await response.json()) as { proofGap: ProofGap };
    expect(body.proofGap.resolvedByRef).toBe(state.winningTransition.recoveryRecommendationStatusTransitionId);
    const storedGap = await state.fixture.store.getRecord<ProofGap>("proof_gap", state.terminalConflictGap.proofGapId);
    expect(storedGap?.payload.resolvedByRef).toBe(state.winningTransition.recoveryRecommendationStatusTransitionId);
  });
});

function expectedSecurityScheme(role: TransitionCallerRole): string {
  switch (role) {
    case "control_plane":
      return "handshakeControlPlaneBearer";
    case "runtime_evidence":
      return "handshakeRuntimeEvidenceBearer";
    case "gateway_custody":
      return "handshakeGatewayCustodyBearer";
    case "review_custody":
      return "handshakeReviewCustodyBearer";
  }
}

function jsonHeaders(role: TransitionCallerRole): Record<string, string> {
  return {
    "content-type": "application/json",
    "x-handshake-protocol-version": PROTOCOL_VERSION,
    "x-handshake-request-identity": `test-request-${role}`,
    authorization: `Bearer ${TEST_CALLER_AUTH_TOKENS[role]}`,
  };
}

async function createRecoveryTerminalConflictAttempt() {
  const base = makeKernelFixture();
  const store = new FaultInjectingProtocolStore(new InMemoryProtocolStore()).injectProtocolCommitResultOnce(
    "recovery_terminal_conflict",
    { when: (commit) => Boolean(commit.recoveryTerminalClaims?.length) },
  );
  const fixture = await createGreenlitContract({ ...base, store, kernel: new HandshakeKernel(store) });
  const gate = await fixture.kernel.gatewayCheck({
    actionContractId: fixture.contract.actionContractId,
    greenlightId: fixture.greenlight.greenlightId,
    observedParameters: { package: "hono", versionRange: "^4.12.19" },
  });
  const sourceProofGapId = (await recordUnknownDownstreamProofGap(fixture, gate)).proofGapId;
  const recommendation = await fixture.kernel.createRecoveryRecommendation({
    sourceReceiptId: gate.receipt.receiptId,
    sourceRefusalOrGapRef: sourceProofGapId,
    recommendedPath: "narrower_action_contract_required",
    allowedNextActionClasses: [fixture.contract.actionClass],
    requiredNewEvidence: ["gateway_finality_evidence"],
    requiresHumanReview: false,
    reasonCode: "downstream_status_unknown",
    reasonSummary: "Gateway did not produce downstream finality evidence.",
  });
  const compilation = await fixture.kernel.compileIntent({
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    principalIntentRef: "intent:http recovery terminal conflict",
    principalId: "principal_demo",
    agentId: "agent_demo",
    runId: "run_demo",
    runtimeAdapterId: "runtime_codex",
    operatingEnvelopeId: fixture.envelope.envelopeId,
    toolCatalogRef: "tool_catalog_demo@v1",
    actionCatalogRef: "action_catalog_demo@v1",
    gatewayRegistryRef: "gateway_registry@v1",
    candidate: makePackageInstallCandidate(fixture, {
      sequenceNumber: fixture.contract.sequenceNumber + 1,
      recoveryRecommendationId: recommendation.recoveryRecommendationId,
      purposeCode: "dependency_add_recovery",
      evidenceRefs: ["gateway_finality_evidence"],
      idempotencyKey: "idem_http_recovery_terminal",
    }),
  });
  const followUpInput = proposalInputForCompilation(compilation);

  return { fixture, followUpInput };
}

async function createRecoveryTerminalConflictState() {
  const state = await createRecoveryTerminalConflictAttempt();

  await expect(state.fixture.kernel.proposeActionContract(state.followUpInput)).rejects.toThrow(
    "already has a terminal status transition",
  );
  const terminalConflictGap = (await state.fixture.store.listRecordsByType<ProofGap>("proof_gap"))
    .map((record) => record.payload)
    .find((proofGap) => proofGap.reasonCode === "recovery_terminal_conflict");
  if (!terminalConflictGap) throw new Error("expected terminal conflict proof gap");

  await state.fixture.kernel.proposeActionContract(state.followUpInput);
  const transitions = await state.fixture.store.listRecordsByType<RecoveryRecommendationStatusTransition>(
    "recovery_recommendation_status_transition",
  );
  const winningTransition = transitions[0]?.payload;
  if (!winningTransition) throw new Error("expected winning terminal transition");
  return { fixture: state.fixture, terminalConflictGap, winningTransition };
}
