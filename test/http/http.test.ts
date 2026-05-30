import { describe, expect, it } from "bun:test";
import { createApp } from "../../src/http/app";
import type { CallerAuthTokens, TransitionCallerRole } from "../../src/http/admission/caller-auth";
import { evidenceReadRouteDefinitions } from "../../src/http/routes/evidence-read-route-registry";
import { HandshakeProtocolError } from "../../src/protocol/foundation/errors";
import { transitionInvokers, transitionRouteDefinitions } from "../../src/http/routes/transition-route-registry";
import { HandshakeKernel } from "../../src/protocol/kernel";
import {
  type ContractEvidenceProjection,
  type GeneratedGraphEvidenceProjection,
  type IdempotencyRecoveryProjection,
  type ProtectedPathInstallHealthProjection,
  PROTOCOL_VERSION,
  type ContractStreamEvent,
  type ProofGap,
  type RecoveryRecommendationStatusTransition,
  type ReceiptTimelineProjection,
  type TransitionRequestContext,
} from "../../src/protocol/public/schemas";
import { HandshakeClient } from "../../src/sdk/client";
import type { HandshakeClientError } from "../../src/sdk/client";
import { InstallClient, RuntimeClient } from "../../src/sdk/surface-clients";
import { InMemoryProtocolStore } from "../../src/storage/memory";
import type {
  AuthorityCertificateSignerInput,
  AuthorityCertificateTrustMaterialInput,
} from "../../src/protocol/areas/authority-certificate";
import {
  createGreenlitContract,
  futureIso,
  makeKernelFixture,
  makePackageInstallCandidate,
  proposalInputForCompilation,
  registerFixtureObjects,
  recordSafeBypassProbes,
  recordUnknownDownstreamProofGap,
} from "../support/fixtures";
import { FaultInjectingProtocolStore } from "../support/fault-injecting-protocol-store";
import { createD1HttpHarness } from "../support/d1-http-harness";
import {
  DIGEST_B,
  DIGEST_C,
  createGeneratedGraphEvidenceFixture,
  hostedAdmissionConfig,
  headerHostedVerifier,
  hostedIdentity,
  runtimeExecutionBody,
  staticHostedVerifier,
} from "../support/http-protocol-fixtures";
import { packageInstallRuntimeConfig } from "../support/package-install-flow";

const ED25519_ALGORITHM = { name: "Ed25519" } as Algorithm;

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
    expect(graphEvidencePath?.get?.security).toEqual([
      { handshakeReviewCustodyBearer: [] },
      { handshakeRuntimeEvidenceBearer: [] },
    ]);
    expect(openapiDocument.paths["/v0.2/records/{objectType}/{objectId}"]).toBeUndefined();
  });

  it("serves hosted verifier projections and verification without mutating protocol state", async () => {
    const store = new InMemoryProtocolStore();
    const app = createApp({
      store,
      authorityCertificateTrustMaterial: {
        keys: [
          {
            keyIdentityRef: "fixture:ed25519:verifier",
            issuerRef: "issuer:fixture",
            signerRole: "gateway",
            algorithm: "ed25519",
            publicKeyEd25519: "public-ed25519-material",
            hmacSecret: null,
            status: "active",
          },
          {
            keyIdentityRef: "fixture:hmac:dev",
            signerRole: null,
            algorithm: "hmac-sha256",
            publicKeyEd25519: null,
            hmacSecret: "must-not-project",
            status: "active",
          },
        ],
        issuers: [
          {
            issuerRef: "issuer:fixture",
            issuerDigest: DIGEST_B,
            status: "active",
            metadataRefs: ["evidence:issuer-fixture"],
          },
        ],
        statusRecords: [
          {
            statusRecordId: "acsr_fixture_key",
            subjectKind: "key",
            subjectRef: "fixture:ed25519:verifier",
            status: "active",
            reasonCode: "fixture_key_active",
            observedAt: "2026-05-24T00:00:00.000Z",
            evidenceRefs: ["evidence:key-status"],
          },
        ],
      },
    });

    const metadata = await app.request("/v0.2/verifier/metadata");
    expect(metadata.status).toBe(200);
    expect(await metadata.json()).toMatchObject({
      authorityCreated: false,
      hostedMutationAuthority: false,
      remoteTrustFetchAllowed: false,
      verificationPlane: "local_pinned_trust_material",
    });

    const keySet = await app.request("/v0.2/verifier/key-set");
    expect(keySet.status).toBe(200);
    const keySetBody = await keySet.text();
    expect(keySetBody).toContain("fixture:ed25519:verifier");
    expect(keySetBody).not.toContain("must-not-project");
    expect(JSON.parse(keySetBody)).toMatchObject({
      trustDecision: "caller_pinned_trust_material_only",
      authorityCreated: false,
      omittedPrivateKeyCount: 1,
    });

    const jwks = await app.request("/v0.2/verifier/jwks.json");
    expect(jwks.status).toBe(200);
    const jwksBody = await jwks.text();
    expect(jwksBody).toContain('"kty":"OKP"');
    expect(jwksBody).not.toContain("hmacSecret");
    expect(jwksBody).not.toContain("must-not-project");

    const status = await app.request("/v0.2/verifier/status/key/fixture:ed25519:verifier");
    expect(status.status).toBe(200);
    expect(await status.json()).toMatchObject({
      authorityCreated: false,
      statusRecord: { subjectRef: "fixture:ed25519:verifier", status: "active" },
    });

    const verify = await app.request("/v0.2/verifier/authority-certificates/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ certificate: { not: "an authority certificate" } }),
    });
    expect(verify.status).toBe(200);
    expect(await verify.json()).toMatchObject({
      outcome: "refused",
      authorityCreated: false,
      failures: [{ code: "schema_invalid" }],
    });
    expect(await store.listRecordsByType("authority_certificate")).toHaveLength(0);
    expect(await store.listRecordsByType("contract_stream_event")).toHaveLength(0);
  });

  it("hardens hosted verifier failure cases without accepting caller trust or mutating state", async () => {
    const { certificate, signers } = await hostedAuthorityCertificateFixture();
    const store = new InMemoryProtocolStore();
    const app = createApp({ store, authorityCertificateTrustMaterial: hostedTrustMaterial(signers) });

    const verified = await app.request("/v0.2/verifier/authority-certificates/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ certificate }),
    });
    expect(verified.status).toBe(200);
    const verifiedBody = await verified.json();
    expect(verifiedBody).toMatchObject({
      outcome: "verified",
      authorityCreated: false,
      envelope: { actionClass: "package.install" },
    });
    expect(verifiedBody).not.toHaveProperty("valid");

    const callerTrust = await app.request("/v0.2/verifier/authority-certificates/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ certificate, trustMaterial: { keys: [] } }),
    });
    expect(callerTrust.status).toBe(400);
    expect(await callerTrust.json()).toMatchObject({
      error: { code: "invalid_request", commitState: "not_started" },
    });

    const malformed = await app.request("/v0.2/verifier/authority-certificates/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });
    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toMatchObject({
      error: { code: "invalid_request", commitState: "not_started" },
    });

    const oversized = await app.request("/v0.2/verifier/authority-certificates/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ certificate: "x".repeat(257 * 1024) }),
    });
    expect(oversized.status).toBe(413);
    expect(await oversized.json()).toMatchObject({
      error: { code: "transition_request_body_too_large", commitState: "not_started" },
    });

    const missingStatus = await app.request("/v0.2/verifier/status/key/fixture:ed25519:missing");
    expect(missingStatus.status).toBe(200);
    expect(await missingStatus.json()).toMatchObject({
      authorityCreated: false,
      statusRecord: null,
      statusOutcome: "status_unavailable",
      proofGapReasonCode: "trust_status_unavailable",
    });

    const unknownIssuer = await createApp({
      authorityCertificateTrustMaterial: hostedTrustMaterial(signers, { issuerRef: "issuer:missing" }, false),
    }).request("/v0.2/verifier/authority-certificates/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ certificate }),
    });
    const unknownIssuerBody = (await unknownIssuer.json()) as HostedVerifierResponseBody;
    expect(unknownIssuerBody.outcome).toBe("refused");
    expect(unknownIssuerBody.failures.map((failure: { code: string }) => failure.code)).toContain(
      "trust_issuer_unknown",
    );

    const revoked = await createApp({
      authorityCertificateTrustMaterial: hostedTrustMaterial(signers, { status: "revoked" }),
    }).request("/v0.2/verifier/authority-certificates/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ certificate }),
    });
    const revokedBody = (await revoked.json()) as HostedVerifierResponseBody;
    expect(revokedBody.outcome).toBe("refused");
    expect(revokedBody.failures.map((failure: { code: string }) => failure.code)).toContain("trust_key_revoked");

    const statusOutage = await createApp({
      authorityCertificateTrustMaterial: hostedTrustMaterial(signers, { status: "status_unavailable" }),
    }).request("/v0.2/verifier/authority-certificates/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ certificate }),
    });
    const statusOutageBody = (await statusOutage.json()) as HostedVerifierResponseBody;
    expect(statusOutageBody).toMatchObject({
      outcome: "proof_gap",
      checks: { status: "proof_gap" },
    });
    expect(statusOutageBody.failures.map((failure: { code: string }) => failure.code)).toContain(
      "trust_status_unavailable",
    );

    expect(await store.listRecordsByType("authority_certificate")).toHaveLength(0);
    expect(await store.listRecordsByType("contract_stream_event")).toHaveLength(0);
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
      expect(openapiDocument.paths[route.openApiPath]?.get?.security).toEqual(
        route.roles.map((role) => ({ [expectedSecurityScheme(role)]: [] })),
      );
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

  it("proposes runtime ingress action contracts through the role-scoped HTTP surface without authority", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const app = createApp({ store: fixture.store, callerAuthTokens: TEST_CALLER_AUTH_TOKENS });
    const fetchImpl = async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      const url = new URL(String(input), "http://handshake.test");
      return app.request(`${url.pathname}${url.search}`, init);
    };
    const runtimeClient = new RuntimeClient(
      "http://handshake.test",
      {
        roleCredential: TEST_CALLER_AUTH_TOKENS.runtime_evidence,
        requestIdentityFactory: () => "runtime-ingress-http-request",
      },
      fetchImpl,
    );

    const result = await runtimeClient.proposeRuntimeIngressActionContracts({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      config: { packageInstall: packageInstallRuntimeConfig(fixture) },
      dispatchBlock: {
        principalIntentRef: "intent:http-runtime-ingress-install-hono",
        generatedCodeOrSpecRef: "runtime:http-dispatch-block-supported",
        dispatchBoundaryRef: "dispatch-boundary:http-runtime-tool-dispatch",
        dispatches: [
          {
            dispatchKind: "wrapped_package_install",
            dispatchRef: "dispatch:http-package-install:1",
            package: "hono",
            versionRange: "^4.12.19",
          },
        ],
      },
    });

    expect(result.outcome).toBe("action_contracts_proposed");
    expect(result.responsePosture).toMatchObject({
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
      receiptExportCreated: false,
      authorityCertificateMinted: false,
      nextAction: "read_evidence",
    });
    expect(result.generatedExecutionGraph!.coverageStatus).toBe("fully_covered_no_unsupported_nodes");
    const proposal = result.proposals[0];
    if (!proposal || proposal.outcome !== "action_contract_proposed") throw new Error("expected contract proposal");
    expect(proposal.actionContract.resourceRef).toBe("npm:hono");
    expect(await fixture.store.listRecordsByType("runtime_execution")).toHaveLength(1);
    expect(await fixture.store.listRecordsByType("generated_execution_graph")).toHaveLength(1);
    expect(await fixture.store.listRecordsByType("tool_call_draft")).toHaveLength(1);
    expect(await fixture.store.listRecordsByType("intent_compilation")).toHaveLength(1);
    expect(await fixture.store.listRecordsByType("action_contract")).toHaveLength(1);
    expect(await fixture.store.listRecordsByType("policy_decision")).toHaveLength(0);
    expect(await fixture.store.listRecordsByType("greenlight")).toHaveLength(0);
    expect(await fixture.store.listRecordsByType("gateway_check_attempt")).toHaveLength(0);
    expect(await fixture.store.listRecordsByType("mutation_attempt")).toHaveLength(0);
    expect(await fixture.store.listRecordsByType("receipt")).toHaveLength(0);
    expect(await fixture.store.listRecordsByType("authority_certificate")).toHaveLength(0);
  });

  it("registers install proposal compiled records through one control-plane HTTP transition", async () => {
    const fixture = makeKernelFixture();
    const app = createApp({ store: fixture.store, callerAuthTokens: TEST_CALLER_AUTH_TOKENS });
    const fetchImpl = async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      const url = new URL(String(input), "http://handshake.test");
      return app.request(`${url.pathname}${url.search}`, init);
    };
    const installClient = new InstallClient(
      "http://handshake.test",
      {
        roleCredential: TEST_CALLER_AUTH_TOKENS.control_plane,
        requestIdentityFactory: () => "install-http-request",
      },
      fetchImpl,
    );

    const result = await installClient.registerInstallProposalCompiledRecords({
      installProposalId: "install_http_package_fixture",
      schemaVersion: PROTOCOL_VERSION,
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      createdAt: "2026-05-24T00:00:00.000Z",
      adapterPackId: "adapter_pack_package_install_material",
      adapterPackVersion: "0.1.0",
      actionFamily: "package.install",
      protectedSurfaceKind: "package_manager",
      resourceRef: "npm:hono",
      status: "ready_to_install",
      humanSummary: "Package install setup fixture.",
      refusalReasonCodes: [],
      compiledRecords: {
        toolCapability: fixture.tool,
        actionType: fixture.actionType,
        gatewayRegistryEntry: fixture.gateway,
        operatingEnvelope: fixture.envelope,
      },
      policyPackRef: "policy:package-install-material:v1",
      policyPackVersion: "v1",
      bypassProbePlan: [
        {
          probeKind: "raw_sibling_blocking",
          requiredSourceAuthority: "gateway_probe",
          mustPassBeforeGatewayCheckedPosture: true,
        },
      ],
      receiptExpectationRefs: ["receipt:package-install-material"],
      installDigest: `sha256:${"c".repeat(64)}`,
    });

    expect(result).toMatchObject({
      outcome: "compiled_records_registered",
      commitAtomicity: "server_store_commit",
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    });
    expect(await fixture.store.getRecord("tool_capability", fixture.tool.toolCapabilityId)).not.toBeNull();
    expect(await fixture.store.listRecordsByType<ContractStreamEvent>("contract_stream_event")).toHaveLength(1);
    expect(await fixture.store.listRecordsByType("greenlight")).toHaveLength(0);
    expect(await fixture.store.listRecordsByType("gateway_check_attempt")).toHaveLength(0);
    expect(await fixture.store.listRecordsByType("mutation_attempt")).toHaveLength(0);
  });

  it("registers x402 compiled records atomically and refuses orphan catalog payloads", async () => {
    const fixture = makeKernelFixture();
    const app = createApp({ store: fixture.store, callerAuthTokens: TEST_CALLER_AUTH_TOKENS });
    const fetchImpl = async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      const url = new URL(String(input), "http://handshake.test");
      return app.request(`${url.pathname}${url.search}`, init);
    };
    const installClient = new InstallClient(
      "http://handshake.test",
      {
        roleCredential: TEST_CALLER_AUTH_TOKENS.control_plane,
        requestIdentityFactory: () => "install-x402-http-fixture",
      },
      fetchImpl,
    );
    const { compileX402InstallProposal } = await import("../../src/adapters/x402-payment/install-proposal");
    const { defaultX402BootstrapInstallInput, installProposalFromX402 } =
      await import("../../src/cli/service-operator/bootstrap");
    const proposal = await compileX402InstallProposal(defaultX402BootstrapInstallInput());
    const registered = await installClient.registerInstallProposalCompiledRecords(installProposalFromX402(proposal));
    expect(registered.outcome).toBe("compiled_records_registered");
    expect(await fixture.store.listRecordsByType("operating_envelope")).toHaveLength(1);

    const refused = await installClient.registerInstallProposalCompiledRecords({
      ...installProposalFromX402(proposal),
      status: "refused",
      compiledRecords: null,
      refusalReasonCodes: ["x402_wallet_signer_not_gateway_held"],
    });
    expect(refused.outcome).toBe("install_proposal_refused");
    expect(await fixture.store.listRecordsByType("tool_capability")).toHaveLength(1);
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

  it("rejects oversized transition bodies before schema parsing or record commits", async () => {
    const store = new InMemoryProtocolStore();
    const app = createApp({
      store,
      callerAuthTokens: TEST_CALLER_AUTH_TOKENS,
    });

    const response = await app.request("/v0.2/runtime-executions", {
      method: "POST",
      headers: jsonHeaders("runtime_evidence"),
      body: JSON.stringify({ oversized: "x".repeat(300_000) }),
    });

    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({
      error: {
        code: "transition_request_body_too_large",
        transitionName: "createRuntimeExecution",
        callerCustodyRole: "runtime_evidence",
        commitState: "not_started",
        requestIdentity: "test-request-runtime_evidence",
      },
    });
    expect(store.countRecordsOfType("runtime_execution")).toBe(0);
    expect(store.countRecordsOfType("transition_request_context")).toBe(0);
  });

  it("keeps action contract proposal on runtime-evidence custody", async () => {
    const app = createApp({
      store: new InMemoryProtocolStore(),
      callerAuthTokens: TEST_CALLER_AUTH_TOKENS,
    });

    const controlPlane = await app.request("/v0.2/action-contracts", {
      method: "POST",
      headers: jsonHeaders("control_plane"),
      body: JSON.stringify({ invalid: true }),
    });
    expect(controlPlane.status).toBe(403);
    expect(await controlPlane.json()).toMatchObject({
      error: {
        code: "caller_auth_forbidden",
        transitionName: "proposeActionContract",
        callerCustodyRole: "runtime_evidence",
        commitState: "not_started",
      },
    });

    const runtimeEvidence = await app.request("/v0.2/action-contracts", {
      method: "POST",
      headers: jsonHeaders("runtime_evidence"),
      body: JSON.stringify({ invalid: true }),
    });
    expect(runtimeEvidence.status).toBe(400);
    expect(await runtimeEvidence.json()).toMatchObject({
      error: {
        code: "invalid_request",
        transitionName: "proposeActionContract",
        callerCustodyRole: "runtime_evidence",
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

  it("blocks raw HTTP reads for internal-only protocol objects", async () => {
    const fixture = await createGreenlitContract();
    const [bypassProbeId] = await recordSafeBypassProbes(fixture);
    if (!bypassProbeId) throw new Error("expected bypass probe record");
    const toolCallDraft = await fixture.kernel.createToolCallDraft({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      runtimeExecutionId: null,
      generatedExecutionGraphId: null,
      generatedExecutionNodeId: null,
      toolCapabilityId: fixture.tool.toolCapabilityId,
      actionTypeId: fixture.actionType.actionTypeId,
      gatewayRegistryEntryId: fixture.gateway.gatewayRegistryEntryId,
      actionClass: "package.install",
      gatewayId: fixture.gateway.gatewayId,
      resourceRef: "npm:hono",
      parameters: { package: "hono", versionRange: "^4.12.19" },
      nonSecretParamsSummary: { package: "hono", versionRange: "^4.12.19" },
      expiresAt: futureIso(),
      evidenceRefs: ["evidence:tool-call-draft"],
    });
    const app = createApp({
      store: fixture.store,
      callerAuthTokens: TEST_CALLER_AUTH_TOKENS,
    });
    const streamEvents = await fixture.store.listRecordsByType<ContractStreamEvent>("contract_stream_event");
    const internalEventId = streamEvents[0]?.objectId;
    if (!internalEventId) throw new Error("expected internal stream event record");
    const ledgerRecords = await fixture.store.listRecordsByType("idempotency_ledger_entry");
    const ledgerId = ledgerRecords[0]?.objectId;
    if (!ledgerId) throw new Error("expected idempotency ledger record");

    const publicRecord = await app.request(`/v0.2/records/action_contract/${fixture.contract.actionContractId}`, {
      headers: jsonHeaders("control_plane"),
    });
    expect(publicRecord.status).toBe(200);

    for (const [objectType, objectId] of [
      ["contract_stream_event", internalEventId],
      ["idempotency_ledger_entry", ledgerId],
      ["bypass_probe", bypassProbeId],
      ["tool_call_draft", toolCallDraft.toolCallDraftId],
    ] as const) {
      const internalRecord = await app.request(`/v0.2/records/${objectType}/${objectId}`, {
        headers: jsonHeaders("control_plane"),
      });
      expect(internalRecord.status).toBe(404);
      expect(await internalRecord.json()).toMatchObject({
        error: { code: "record_not_found" },
      });
    }
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
      error: { code: "hosted_admission_config_not_configured", commitState: "not_started" },
    });
    expect(store.countRecordsOfType("runtime_execution")).toBe(0);
    expect(store.countRecordsOfType("transition_request_context")).toBe(0);
  });

  it("hosted mode refuses missing server verifier after deployment config before parsing request bodies", async () => {
    const store = new InMemoryProtocolStore();
    const app = createApp({
      store,
      authMode: "hosted",
      hostedAdmissionConfig: hostedAdmissionConfig(),
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
      hostedAdmissionConfig: hostedAdmissionConfig(),
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
      hostedAdmissionConfig: hostedAdmissionConfig(),
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
      hostedAdmissionConfig: hostedAdmissionConfig(),
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
      hostedAdmissionConfig: hostedAdmissionConfig(),
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

  it("hosted mode rejects stale caller identity using configured freshness before body parsing", async () => {
    const store = new InMemoryProtocolStore();
    const app = createApp({
      store,
      authMode: "hosted",
      hostedAdmissionConfig: hostedAdmissionConfig({ maxIdentityAgeSeconds: 30 }),
      hostedCallerVerifier: staticHostedVerifier(
        hostedIdentity({
          custodyRoles: ["runtime_evidence"],
          issuedAt: new Date(Date.now() - 60_000).toISOString(),
          expiresAt: futureIso(),
        }),
      ),
    });

    const response = await app.request("/v0.2/runtime-executions", {
      method: "POST",
      headers: jsonHeaders("runtime_evidence"),
      body: JSON.stringify({ invalid: true }),
    });

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: {
        code: "hosted_caller_identity_stale",
        commitState: "not_started",
        failureClass: "stale_admission",
        failurePhase: "admission",
      },
    });
    expect(store.countRecordsOfType("runtime_execution")).toBe(0);
    expect(store.countRecordsOfType("transition_request_context")).toBe(0);
  });

  it("hosted mode rejects transition roles excluded by deployment config before body parsing", async () => {
    const store = new InMemoryProtocolStore();
    const app = createApp({
      store,
      authMode: "hosted",
      hostedAdmissionConfig: hostedAdmissionConfig({
        rolePolicy: { admittedTransitionRoles: ["control_plane"] },
      }),
      hostedCallerVerifier: staticHostedVerifier(hostedIdentity({ custodyRoles: ["runtime_evidence"] })),
    });

    const response = await app.request("/v0.2/runtime-executions", {
      method: "POST",
      headers: jsonHeaders("runtime_evidence"),
      body: JSON.stringify({ invalid: true }),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: { code: "hosted_transition_role_not_admitted", commitState: "not_started" },
    });
    expect(store.countRecordsOfType("runtime_execution")).toBe(0);
    expect(store.countRecordsOfType("transition_request_context")).toBe(0);
  });

  it("hosted mode propagates revoked caller refusal with zero records", async () => {
    const store = new InMemoryProtocolStore();
    const app = createApp({
      store,
      authMode: "hosted",
      hostedAdmissionConfig: hostedAdmissionConfig(),
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
      hostedAdmissionConfig: hostedAdmissionConfig(),
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
      hostedAdmissionConfig: hostedAdmissionConfig(),
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
      headers: jsonHeaders("review_custody"),
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

  it("returns redacted contract, receipt timeline, and install-health projections", async () => {
    const fixture = makeKernelFixture();
    fixture.envelope.requiredProtectedPathState = "gateway_checked";
    const bypassProbeIds = await recordSafeBypassProbes(fixture);
    const posture = await fixture.kernel.createProtectedPathPosture({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      runtimeAdapterId: "runtime_codex",
      gatewayId: fixture.gateway.gatewayId,
      actionClass: "package.install",
      resourceRef: "npm:hono",
      protectedSurfaceKind: "package_manager",
      postureState: "gateway_checked",
      credentialCustodyStatus: "gateway_held",
      rawSiblingToolStatus: "blocked",
      sourceAuthority: "gateway_probe",
      reasonCodes: ["bypass_probe_passed"],
      evidenceRefs: ["evidence:protected-path-posture"],
      bypassProbeIds,
      expiresAt: futureIso(),
    });
    const greenlit = await createGreenlitContract(fixture);
    const gate = await greenlit.kernel.gatewayCheck({
      actionContractId: greenlit.contract.actionContractId,
      greenlightId: greenlit.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
      surfaceOperationRef: "npm-install:operation:demo",
    });
    const app = createApp({ store: fixture.store, callerAuthTokens: TEST_CALLER_AUTH_TOKENS });
    const contextCountBefore = fixture.store.countRecordsOfType("transition_request_context");

    const contractResponse = await app.request(`/v0.2/evidence/contracts/${greenlit.contract.actionContractId}`, {
      headers: jsonHeaders("review_custody"),
    });
    expect(contractResponse.status).toBe(200);
    const contractView = (await contractResponse.json()) as ContractEvidenceProjection & {
      parameters?: unknown;
      secretRefs?: unknown;
      contractSignature?: unknown;
    };
    expect(contractView).toMatchObject({
      actionContractRef: greenlit.contract.actionContractId,
      contractDigest: greenlit.contract.actionContractDigest,
      paramsDigest: greenlit.contract.paramsDigest,
      signaturePosture: "local_hmac",
      redactionProfileRef: "contract-view:v0.2-redacted",
    });
    expect(contractView.parameters).toBeUndefined();
    expect(contractView.secretRefs).toBeUndefined();
    expect(contractView.contractSignature).toBeUndefined();

    const idempotencyRecoveryResponse = await app.request(
      `/v0.2/evidence/idempotency-recovery/${greenlit.contract.actionContractId}`,
      { headers: jsonHeaders("review_custody") },
    );
    expect(idempotencyRecoveryResponse.status).toBe(200);
    const idempotencyRecovery = (await idempotencyRecoveryResponse.json()) as IdempotencyRecoveryProjection & {
      parameters?: unknown;
      secretRefs?: unknown;
    };
    expect(idempotencyRecovery).toMatchObject({
      actionContractRef: greenlit.contract.actionContractId,
      idempotencyKey: greenlit.contract.idempotencyKey,
      paramsDigest: greenlit.contract.paramsDigest,
      currentLedgerState: "mutation_started",
      paramsDigestMatch: true,
      greenlightRef: greenlit.greenlight.greenlightId,
      gateAttemptRef: gate.gateAttempt.gateAttemptId,
      mutationAttemptRef: gate.mutationAttempt?.mutationAttemptId,
      receiptRef: gate.receipt.receiptId,
      recoveryDisposition: "same_params_duplicate_refused",
      reasonCodes: ["idempotency_duplicate_authority"],
      redactionProfileRef: "idempotency-recovery:v0.2-redacted",
    });
    expect(idempotencyRecovery.parameters).toBeUndefined();
    expect(idempotencyRecovery.secretRefs).toBeUndefined();

    const timelineResponse = await app.request(`/v0.2/evidence/receipts/${gate.receipt.receiptId}/timeline`, {
      headers: jsonHeaders("runtime_evidence"),
    });
    expect(timelineResponse.status).toBe(200);
    const timeline = (await timelineResponse.json()) as ReceiptTimelineProjection & {
      payload?: unknown;
      evidenceRefs?: unknown;
    };
    expect(timeline).toMatchObject({
      receiptRef: gate.receipt.receiptId,
      actionContractRef: greenlit.contract.actionContractId,
      gatewayCheckStatus: "passed",
      mutationAttemptStatus: "submitted",
      redactionProfileRef: "receipt-timeline:v0.2-redacted",
      missingEventCount: 0,
    });
    expect(timeline.events.map((event) => event.eventType)).toContain("gateway_checked");
    expect(timeline.events.map((event) => event.eventType)).toContain("receipt_emitted");
    expect(timeline.payload).toBeUndefined();
    expect(timeline.evidenceRefs).toBeUndefined();

    const installHealthResponse = await app.request(
      `/v0.2/evidence/protected-path-install-health/${greenlit.contract.actionContractId}`,
      { headers: jsonHeaders("runtime_evidence") },
    );
    expect(installHealthResponse.status).toBe(200);
    const installHealth = (await installHealthResponse.json()) as ProtectedPathInstallHealthProjection & {
      evidenceRefs?: unknown;
    };
    expect(installHealth).toMatchObject({
      actionContractRef: greenlit.contract.actionContractId,
      currentPostureRef: posture.protectedPathPostureId,
      currentPostureDigest: posture.postureDigest,
      installHealthStatus: "satisfies_gateway_checked",
      redactionProfileRef: "protected-path-install-health:v0.2-redacted",
    });
    expect(installHealth.bypassProbeCoverage).toHaveLength(bypassProbeIds.length);
    expect(installHealth.evidenceRefs).toBeUndefined();
    expect(JSON.stringify(installHealth)).not.toContain("evidence:probe");
    const controlPlaneRead = await app.request(`/v0.2/evidence/contracts/${greenlit.contract.actionContractId}`, {
      headers: jsonHeaders("control_plane"),
    });
    expect(controlPlaneRead.status).toBe(403);
    const gatewayRead = await app.request(`/v0.2/evidence/contracts/${greenlit.contract.actionContractId}`, {
      headers: jsonHeaders("gateway_custody"),
    });
    expect(gatewayRead.status).toBe(403);
    expect(fixture.store.countRecordsOfType("transition_request_context")).toBe(contextCountBefore);
  });

  it("hides generated graph evidence projections across hosted tenant boundaries", async () => {
    const { graph, store } = await createGeneratedGraphEvidenceFixture();
    const app = createApp({
      store,
      authMode: "hosted",
      hostedAdmissionConfig: hostedAdmissionConfig(),
      hostedCallerVerifier: staticHostedVerifier(
        hostedIdentity({ tenantId: "tenant_other", custodyRoles: ["review_custody"] }),
      ),
    });

    const response = await app.request(`/v0.2/evidence/generated-execution-graphs/${graph.generatedExecutionGraphId}`, {
      headers: jsonHeaders("review_custody"),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      error: { code: "record_not_found", commitState: "not_applicable" },
    });
    expect(store.countRecordsOfType("transition_request_context")).toBe(0);
  });

  it("hosted evidence reads require read role and scope instead of transition custody", async () => {
    const { graph, store } = await createGeneratedGraphEvidenceFixture();
    const missingEntitlementApp = createApp({
      store,
      authMode: "hosted",
      hostedAdmissionConfig: hostedAdmissionConfig(),
      hostedCallerVerifier: staticHostedVerifier(
        hostedIdentity({
          custodyRoles: ["review_custody"],
          hostedRoles: [],
          hostedScopes: [],
        }),
      ),
    });
    const forbidden = await missingEntitlementApp.request(
      `/v0.2/evidence/generated-execution-graphs/${graph.generatedExecutionGraphId}`,
      { headers: jsonHeaders("review_custody") },
    );
    expect(forbidden.status).toBe(403);
    expect(await forbidden.json()).toMatchObject({
      error: { code: "hosted_read_entitlement_forbidden", commitState: "not_started" },
    });

    const readEntitledApp = createApp({
      store,
      authMode: "hosted",
      hostedAdmissionConfig: hostedAdmissionConfig(),
      hostedCallerVerifier: staticHostedVerifier(
        hostedIdentity({
          custodyRoles: ["control_plane"],
          hostedRoles: ["viewer"],
          hostedScopes: ["evidence:redacted:read"],
        }),
      ),
    });
    const allowed = await readEntitledApp.request(
      `/v0.2/evidence/generated-execution-graphs/${graph.generatedExecutionGraphId}`,
      { headers: jsonHeaders("control_plane") },
    );

    expect(allowed.status).toBe(200);
    expect(await allowed.json()).toMatchObject({
      graphRef: graph.generatedExecutionGraphId,
      graphDigest: graph.graphDigest,
      redactionPosture: "redacted",
    });
    expect(store.countRecordsOfType("transition_request_context")).toBe(0);
  });

  it("hosted raw record reads obey raw-read posture, purpose bounds, and tenant hiding", async () => {
    const { graph, store } = await createGeneratedGraphEvidenceFixture();
    const rawReader = hostedIdentity({
      custodyRoles: ["review_custody"],
      hostedRoles: ["rawEvidenceReader"],
      hostedScopes: ["evidence:raw:request", "evidence:raw:read"],
    });
    const unavailableApp = createApp({
      store,
      authMode: "hosted",
      hostedAdmissionConfig: hostedAdmissionConfig({ rawReadPosture: "unavailable" }),
      hostedCallerVerifier: staticHostedVerifier(rawReader),
    });
    const unavailable = await unavailableApp.request(
      `/v0.2/records/generated_execution_graph/${graph.generatedExecutionGraphId}`,
      { headers: jsonHeaders("review_custody") },
    );
    expect(unavailable.status).toBe(403);
    expect(await unavailable.json()).toMatchObject({
      error: { code: "hosted_raw_read_unavailable", commitState: "not_started" },
    });

    const gatedApp = createApp({
      store,
      authMode: "hosted",
      hostedAdmissionConfig: hostedAdmissionConfig({ rawReadPosture: "gated" }),
      hostedCallerVerifier: staticHostedVerifier(rawReader),
    });
    const missingPurpose = await gatedApp.request(
      `/v0.2/records/generated_execution_graph/${graph.generatedExecutionGraphId}`,
      { headers: jsonHeaders("review_custody") },
    );
    expect(missingPurpose.status).toBe(403);
    expect(await missingPurpose.json()).toMatchObject({
      error: { code: "hosted_raw_read_purpose_required", commitState: "not_started" },
    });

    const allowed = await gatedApp.request(
      `/v0.2/records/generated_execution_graph/${graph.generatedExecutionGraphId}`,
      {
        headers: {
          ...jsonHeaders("review_custody"),
          "x-handshake-raw-read-purpose": "break-glass evidence reconstruction",
          "x-handshake-raw-read-expires-at": new Date(Date.now() + 60_000).toISOString(),
        },
      },
    );
    expect(allowed.status).toBe(200);
    expect(await allowed.json()).toMatchObject({
      objectType: "generated_execution_graph",
      objectId: graph.generatedExecutionGraphId,
    });

    const crossTenantApp = createApp({
      store,
      authMode: "hosted",
      hostedAdmissionConfig: hostedAdmissionConfig({ rawReadPosture: "gated" }),
      hostedCallerVerifier: staticHostedVerifier(hostedIdentity({ ...rawReader, tenantId: "tenant_other" })),
    });
    const crossTenant = await crossTenantApp.request(
      `/v0.2/records/generated_execution_graph/${graph.generatedExecutionGraphId}`,
      {
        headers: {
          ...jsonHeaders("review_custody"),
          "x-handshake-raw-read-purpose": "break-glass evidence reconstruction",
          "x-handshake-raw-read-expires-at": new Date(Date.now() + 60_000).toISOString(),
        },
      },
    );
    expect(crossTenant.status).toBe(404);
    expect(await crossTenant.json()).toMatchObject({
      error: { code: "record_not_found", commitState: "not_applicable" },
    });
  });

  it("reports hosted readiness without leaking secret values or claiming mutation authority", async () => {
    const store = new InMemoryProtocolStore();
    const localApp = createApp({ store, callerAuthTokens: TEST_CALLER_AUTH_TOKENS });
    const missingConfig = await localApp.request("/v0.2/hosted/readiness", {
      headers: jsonHeaders("control_plane"),
    });
    expect(missingConfig.status).toBe(200);
    expect(await missingConfig.json()).toMatchObject({
      configured: false,
      readinessState: "missing",
      hostedMutationAuthorityCreated: false,
      paymentManagementCreated: false,
      settlementAuthorityCreated: false,
      providerCustodyCreated: false,
    });

    const hostedApp = createApp({
      store,
      authMode: "hosted",
      hostedAdmissionConfig: hostedAdmissionConfig(),
      hostedCallerVerifier: staticHostedVerifier(
        hostedIdentity({
          custodyRoles: ["review_custody"],
          hostedRoles: ["operator"],
          hostedScopes: ["hosted:readiness:read"],
        }),
      ),
    });
    const ready = await hostedApp.request(
      "/v0.2/hosted/readiness",
      { headers: jsonHeaders("review_custody") },
      {
        HANDSHAKE_HOSTED_TEST_SECRET: "must-not-leak",
        HANDSHAKE_HOSTED_MODE: "test",
      },
    );
    expect(ready.status).toBe(200);
    const readinessText = await ready.text();
    expect(readinessText).not.toContain("must-not-leak");
    expect(JSON.parse(readinessText)).toMatchObject({
      configured: true,
      deploymentMode: "test",
      readinessState: "configured_but_unverified",
      authorityClass: "hosted_admission_and_redacted_evidence_read_only",
      hostedMutationAuthorityCreated: false,
      storage: {
        d1: {
          bindingName: "DB",
          present: false,
          authority: "structured_evidence",
          environmentPosture: "local_or_injected",
          schema: { checked: false, status: "not_checked" },
        },
        kv: { bindingName: "CACHE", present: false, authority: "non_authoritative_cache" },
      },
      secrets: [{ name: "HANDSHAKE_HOSTED_TEST_SECRET", present: true }],
      publicVars: [{ name: "HANDSHAKE_HOSTED_MODE", present: true }],
      rawReadPosture: "unavailable",
      unsupportedCapabilities: expect.arrayContaining([
        "hosted_mutation_authority_not_provided",
        "payment_management_not_provided",
        "injected_store_not_production_d1_proof",
      ]),
    });
  });

  it("reports D1 schema posture in hosted readiness without promoting local D1 to production proof", async () => {
    const harness = await createD1HttpHarness();
    try {
      const app = createApp({
        authMode: "hosted",
        hostedAdmissionConfig: hostedAdmissionConfig({
          storage: {
            d1: { bindingName: "DB", required: true, authority: "structured_evidence" },
            kv: { bindingName: "CACHE", required: false, authority: "non_authoritative_cache" },
          },
        }),
        hostedCallerVerifier: staticHostedVerifier(
          hostedIdentity({
            custodyRoles: ["review_custody"],
            hostedRoles: ["operator"],
            hostedScopes: ["hosted:readiness:read"],
          }),
        ),
      });
      const response = await app.request(
        "/v0.2/hosted/readiness",
        { headers: jsonHeaders("review_custody") },
        { DB: harness.db },
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        configured: true,
        deploymentMode: "test",
        readinessState: "read_only",
        storage: {
          d1: {
            present: true,
            authority: "structured_evidence",
            environmentPosture: "local_or_injected",
            schema: {
              checked: true,
              status: "present",
              missingTableRefs: [],
            },
          },
          kv: { present: false, authority: "non_authoritative_cache" },
        },
        unsupportedCapabilities: expect.arrayContaining(["hosted_mutation_authority_not_provided"]),
      });
    } finally {
      await harness.dispose();
    }
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

  it("SDK reads evidence projections with GET auth and typed errors", async () => {
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
      transitionTokens: {
        review_custody: "review-token",
        runtime_evidence: "runtime-token",
      },
      requestIdentityFactory: () => "sdk-read-request-id",
    });

    await client.getGeneratedGraphEvidenceProjection("geg_demo");
    await client.getContractEvidenceProjection("act_demo");
    await client.getAgentTransactionEnvelopeProjection("act_demo", "runtime_evidence");
    await client.getIdempotencyRecoveryProjection("act_demo");
    await client.getReceiptTimelineProjection("rcp_demo", "runtime_evidence");
    await client.getProtectedPathInstallHealthProjection("act_demo", "runtime_evidence");

    expect(calls[0]?.path).toBe("/v0.2/evidence/generated-execution-graphs/geg_demo");
    expect(calls[0]?.method).toBe("GET");
    expect(calls[0]?.headers.get("authorization")).toBe("Bearer review-token");
    expect(calls[2]?.headers.get("authorization")).toBe("Bearer runtime-token");
    expect(calls[4]?.headers.get("authorization")).toBe("Bearer runtime-token");
    expect(calls[0]?.headers.get("x-handshake-protocol-version")).toBe(PROTOCOL_VERSION);
    expect(calls[0]?.headers.get("x-handshake-request-identity")).toBe("sdk-read-request-id");
    expect(calls[0]?.headers.get("content-type")).toBeNull();
    expect(calls[0]?.body).toBeUndefined();
    expect(calls.map((call) => call.path)).toEqual([
      "/v0.2/evidence/generated-execution-graphs/geg_demo",
      "/v0.2/evidence/contracts/act_demo",
      "/v0.2/evidence/agent-transactions/act_demo",
      "/v0.2/evidence/idempotency-recovery/act_demo",
      "/v0.2/evidence/receipts/rcp_demo/timeline",
      "/v0.2/evidence/protected-path-install-health/act_demo",
    ]);

    const errorClient = new HandshakeClient(
      "http://handshake.test",
      async () =>
        new Response(
          JSON.stringify({
            error: {
              code: "record_not_found",
              message: "Protocol evidence record was not found.",
              transitionName: "getGeneratedGraphEvidenceProjection",
              callerCustodyRole: "review_custody",
              retryability: "terminal",
              commitState: "not_applicable",
              requestIdentity: null,
              proofRef: null,
              refusalRef: null,
              failureClass: "internal",
              failurePhase: "readback",
              problemType: null,
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
            callerCustodyRole: "runtime_evidence",
            retryability: "recoverable",
            commitState: "committed",
            requestIdentity: "sdk-request-id",
            proofRef: "gap_demo",
            refusalRef: null,
            failureClass: "protected_action_refusal",
            failurePhase: "transition",
            problemType: null,
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
      headers: jsonHeaders("runtime_evidence"),
      body: JSON.stringify(state.followUpInput),
    });

    expect(response.status).toBe(422);
    const body = (await response.json()) as { error: { proofRef: string } };
    expect(body).toMatchObject({
      error: {
        code: "recovery_terminal_conflict",
        transitionName: "proposeActionContract",
        callerCustodyRole: "runtime_evidence",
        retryability: "recoverable",
        commitState: "committed",
        requestIdentity: "test-request-runtime_evidence",
        refusalRef: null,
        failureClass: "proof_gap",
        failurePhase: "transition",
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

type HttpFixtureEd25519Signer = {
  signerRole: "operator_policy" | "gateway";
  keyIdentityRef: string;
  privateKeyPkcs8: string;
  publicKeyEd25519: string;
};

type HostedVerifierResponseBody = {
  outcome: string;
  checks?: Record<string, string>;
  failures: Array<{ code: string }>;
};

type HostedTrustKeyInput = NonNullable<AuthorityCertificateTrustMaterialInput["keys"]>[number];

async function hostedAuthorityCertificateFixture() {
  const fixture = await createGreenlitContract();
  const gate = await fixture.kernel.gatewayCheck({
    actionContractId: fixture.contract.actionContractId,
    greenlightId: fixture.greenlight.greenlightId,
    observedParameters: { package: "hono", versionRange: "^4.12.19" },
  });
  const signers = await httpFixtureEd25519Signers();
  const certificate = await fixture.kernel.createAuthorityCertificate({
    terminalObjectRef: `receipt:${gate.receipt.receiptId}`,
    signers: signerInputs(signers),
  });
  return { certificate, signers };
}

async function httpFixtureEd25519Signers(): Promise<HttpFixtureEd25519Signer[]> {
  return Promise.all([
    httpFixtureEd25519Signer("operator_policy", "fixture:ed25519:operator-policy"),
    httpFixtureEd25519Signer("gateway", "fixture:ed25519:gateway"),
  ]);
}

async function httpFixtureEd25519Signer(
  signerRole: HttpFixtureEd25519Signer["signerRole"],
  keyIdentityRef: string,
): Promise<HttpFixtureEd25519Signer> {
  const keyPair = (await crypto.subtle.generateKey(ED25519_ALGORITHM, true, ["sign", "verify"])) as CryptoKeyPair;
  const privateKeyPkcs8 = bytesToBase64Url(new Uint8Array(await crypto.subtle.exportKey("pkcs8", keyPair.privateKey)));
  const publicKeyEd25519 = bytesToBase64Url(new Uint8Array(await crypto.subtle.exportKey("raw", keyPair.publicKey)));
  return { signerRole, keyIdentityRef, privateKeyPkcs8, publicKeyEd25519 };
}

function signerInputs(signers: HttpFixtureEd25519Signer[]): AuthorityCertificateSignerInput[] {
  return signers.map((signer) => ({
    signerRole: signer.signerRole,
    keyIdentityRef: signer.keyIdentityRef,
    algorithm: "ed25519" as const,
    privateKeyPkcs8: signer.privateKeyPkcs8,
  }));
}

function hostedTrustMaterial(
  signers: HttpFixtureEd25519Signer[],
  keyOverrides: Partial<HostedTrustKeyInput> = {},
  includeIssuer = true,
): AuthorityCertificateTrustMaterialInput {
  const issuerRef = keyOverrides.issuerRef ?? "issuer:fixture";
  return {
    keys: signers.map((signer) => ({
      keyIdentityRef: signer.keyIdentityRef,
      issuerRef,
      signerRole: signer.signerRole,
      algorithm: "ed25519" as const,
      publicKeyEd25519: signer.publicKeyEd25519,
      hmacSecret: null,
      status: "active" as const,
      ...keyOverrides,
    })),
    issuers: includeIssuer
      ? [
          {
            issuerRef,
            issuerDigest: DIGEST_B,
            status: "active" as const,
            metadataRefs: ["evidence:issuer-fixture"],
          },
        ]
      : [],
    statusRecords: [],
    allowDevHmac: false,
  };
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
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
