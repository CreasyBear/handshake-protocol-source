import { describe, expect, it } from "bun:test";
import { PROTOCOL_VERSION } from "../../src/protocol/public/schemas";
import type {
  CompileIntentInput,
  CreateBypassProbeInput,
  CreateProtectedPathPostureInput,
  CreateRuntimeExecutionInput,
  CreateToolCallDraftInput,
  EvaluatePolicyInput,
  GatewayCheckInput,
  ProposeActionContractInput,
  ReconcileSurfaceOperationInput,
  RecordCredentialResolutionEvidenceInput,
  RecordGatewayCustodyProofPacketInput,
  RegisterDelegatedAuthorityRefInput,
  RegisterGatewayCredentialRefInput,
  TransitionDelegatedAuthorityStatusInput,
  TransitionToolCallDraftInput,
} from "../../src/protocol/public/inputs";
import type { RuntimeIngressProposalInput } from "../../src/runtime";
import {
  ControlPlaneClient,
  type ControlPlaneClientOptions,
  EvidenceClient,
  type EvidenceClientOptions,
  GatewayClient,
  type GatewayClientOptions,
  HandshakeClientError,
  type HandshakeFetch,
  InstallClient,
  type InstallClientOptions,
  PolicyClient,
  type PolicyClientOptions,
  RuntimeClient,
  type RuntimeClientOptions,
} from "handshake-protocol-kernel/sdk/role-clients";
import type { InstallProposal } from "../../src/install";
import { requireInstallProposalGatewayRegistryEntry } from "../../src/install/install-proposal";
import { makeKernelFixture } from "../support/fixtures";

describe("role-scoped SDK clients", () => {
  it("keeps install client scoped to setup-only catalog registration without execution methods", async () => {
    const invalidInstallRoleMap: InstallClientOptions = {
      roleCredential: "install-token",
      // @ts-expect-error install client must not accept role maps.
      transitionTokens: {},
    };
    const invalidInstallFallback: InstallClientOptions = {
      roleCredential: "install-token",
      // @ts-expect-error install client must not accept fallback transport credentials.
      transitionToken: "fallback",
    };
    void invalidInstallRoleMap;
    void invalidInstallFallback;

    const calls: CapturedCall[] = [];
    const installClient = new InstallClient(
      "http://handshake.test",
      {
        roleCredential: "install-token",
        requestIdentityFactory: () => "install-request-id",
        originatingIdentity: "ref:install-demo",
      },
      captureFetch(calls, (_path, body) => installSetupResponse(body)),
    );

    const refused = await installClient.registerInstallProposalCompiledRecords(refusedInstallProposal());

    expect(refused).toMatchObject({
      outcome: "install_proposal_refused",
      reasonCodes: ["fixture_install_refused"],
      records: null,
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    });
    expect(calls.map((call) => call.path)).toEqual(["/v0.2/install-proposals/compiled-records"]);

    const registered = await installClient.registerInstallProposalCompiledRecords(readyInstallProposal());

    expect(calls.map((call) => call.path)).toEqual([
      "/v0.2/install-proposals/compiled-records",
      "/v0.2/install-proposals/compiled-records",
    ]);
    expect(calls.every((call) => call.method === "POST")).toBe(true);
    expect(calls.every((call) => call.headers.get("authorization") === "Bearer install-token")).toBe(true);
    expect(calls[0]?.headers.get("x-handshake-protocol-version")).toBe(PROTOCOL_VERSION);
    expect(calls[0]?.headers.get("x-handshake-request-identity")).toBe("install-request-id");
    expect(calls[0]?.headers.get("x-handshake-originating-identity")).toBe("ref:install-demo");
    expect(registered).toMatchObject({
      outcome: "compiled_records_registered",
      commitAtomicity: "server_store_commit",
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
      records: {
        toolCapability: { toolCapabilityId: "tool_package_install" },
        actionType: { actionTypeId: "atype_package_install" },
        gatewayRegistryEntry: { gatewayRegistryEntryId: "gateway_registry_package" },
        operatingEnvelope: { envelopeId: "env_demo" },
      },
    });

    expect("evaluatePolicy" in installClient).toBe(false);
    expect("gatewayCheck" in installClient).toBe(false);
    expect("createRuntimeExecution" in installClient).toBe(false);
    expect("registerGatewayCredentialRef" in installClient).toBe(false);
    expect("createReceiptExport" in installClient).toBe(false);
    expect("createAuthorityCertificate" in installClient).toBe(false);
    expect("signPayment" in installClient).toBe(false);
    expect("registerToolCapability" in installClient).toBe(false);
    expect("registerActionType" in installClient).toBe(false);
    expect("registerGatewayRegistryEntry" in installClient).toBe(false);
    expect("registerOperatingEnvelope" in installClient).toBe(false);
  });

  it("keeps gateway client scoped to gateway custody transitions without policy or signer methods", async () => {
    const invalidGatewayRoleMap: GatewayClientOptions = {
      roleCredential: "gateway-token",
      // @ts-expect-error gateway client must not accept role maps.
      transitionTokens: {},
    };
    const invalidGatewayFallback: GatewayClientOptions = {
      roleCredential: "gateway-token",
      // @ts-expect-error gateway client must not accept fallback transport credentials.
      transitionToken: "fallback",
    };
    void invalidGatewayRoleMap;
    void invalidGatewayFallback;

    const calls: CapturedCall[] = [];
    const gatewayClient = new GatewayClient(
      "http://handshake.test",
      {
        roleCredential: "gateway-token",
        requestIdentityFactory: () => "gateway-request-id",
        originatingIdentity: "ref:gateway-demo",
      },
      captureFetch(calls),
    );

    await gatewayClient.registerGatewayCredentialRef({} as RegisterGatewayCredentialRefInput);
    await gatewayClient.recordGatewayCustodyProofPacket({} as RecordGatewayCustodyProofPacketInput);
    await gatewayClient.createBypassProbe({} as CreateBypassProbeInput);
    await gatewayClient.createProtectedPathPosture({} as CreateProtectedPathPostureInput);
    await gatewayClient.gatewayCheck({} as GatewayCheckInput);
    await gatewayClient.recordCredentialResolutionEvidence({} as RecordCredentialResolutionEvidenceInput);
    await gatewayClient.reconcileSurfaceOperation({} as ReconcileSurfaceOperationInput);

    expect(calls.map((call) => call.path)).toEqual([
      "/v0.2/gateway-credential-refs",
      "/v0.2/gateway-custody-proof-packets",
      "/v0.2/bypass-probes",
      "/v0.2/protected-path-postures",
      "/v0.2/gateway-check-attempts",
      "/v0.2/credential-resolution-evidence",
      "/v0.2/surface-operation-reconciliations",
    ]);
    expect(calls.every((call) => call.method === "POST")).toBe(true);
    expect(calls.every((call) => call.headers.get("authorization") === "Bearer gateway-token")).toBe(true);
    expect(calls[0]?.headers.get("x-handshake-protocol-version")).toBe(PROTOCOL_VERSION);
    expect(calls[0]?.headers.get("x-handshake-request-identity")).toBe("gateway-request-id");
    expect(calls[0]?.headers.get("x-handshake-originating-identity")).toBe("ref:gateway-demo");

    expect("evaluatePolicy" in gatewayClient).toBe(false);
    expect("createReceiptExport" in gatewayClient).toBe(false);
    expect("createAuthorityCertificate" in gatewayClient).toBe(false);
    expect("registerDelegatedAuthorityRef" in gatewayClient).toBe(false);
    expect("transitionDelegatedAuthorityStatus" in gatewayClient).toBe(false);
    expect("signPayment" in gatewayClient).toBe(false);
  });

  it("keeps control-plane client scoped to delegated authority lifecycle without execution methods", async () => {
    const invalidControlPlaneRoleMap: ControlPlaneClientOptions = {
      roleCredential: "control-token",
      // @ts-expect-error control-plane client must not accept role maps.
      transitionTokens: {},
    };
    const invalidControlPlaneFallback: ControlPlaneClientOptions = {
      roleCredential: "control-token",
      // @ts-expect-error control-plane client must not accept fallback transport credentials.
      transitionToken: "fallback",
    };
    void invalidControlPlaneRoleMap;
    void invalidControlPlaneFallback;

    const calls: CapturedCall[] = [];
    const controlPlaneClient = new ControlPlaneClient(
      "http://handshake.test",
      {
        roleCredential: "control-token",
        requestIdentityFactory: () => "control-request-id",
        originatingIdentity: "ref:control-demo",
      },
      captureFetch(calls),
    );

    await controlPlaneClient.registerDelegatedAuthorityRef({} as RegisterDelegatedAuthorityRefInput);
    await controlPlaneClient.transitionDelegatedAuthorityStatus({} as TransitionDelegatedAuthorityStatusInput);

    expect(calls.map((call) => call.path)).toEqual([
      "/v0.2/delegated-authority-refs",
      "/v0.2/delegated-authority-status-transitions",
    ]);
    expect(calls.every((call) => call.method === "POST")).toBe(true);
    expect(calls.every((call) => call.headers.get("authorization") === "Bearer control-token")).toBe(true);
    expect(calls[0]?.headers.get("x-handshake-protocol-version")).toBe(PROTOCOL_VERSION);
    expect(calls[0]?.headers.get("x-handshake-request-identity")).toBe("control-request-id");
    expect(calls[0]?.headers.get("x-handshake-originating-identity")).toBe("ref:control-demo");

    expect("evaluatePolicy" in controlPlaneClient).toBe(false);
    expect("gatewayCheck" in controlPlaneClient).toBe(false);
    expect("createReceiptExport" in controlPlaneClient).toBe(false);
    expect("createAuthorityCertificate" in controlPlaneClient).toBe(false);
    expect("registerGatewayCredentialRef" in controlPlaneClient).toBe(false);
    expect("proposeActionContract" in controlPlaneClient).toBe(false);
  });

  it("keeps policy client scoped to exact policy decisions without gateway or evidence methods", async () => {
    const invalidPolicyRoleMap: PolicyClientOptions = {
      roleCredential: "policy-token",
      // @ts-expect-error policy client must not accept role maps.
      transitionTokens: {},
    };
    const invalidPolicyFallback: PolicyClientOptions = {
      roleCredential: "policy-token",
      // @ts-expect-error policy client must not accept fallback transport credentials.
      transitionToken: "fallback",
    };
    void invalidPolicyRoleMap;
    void invalidPolicyFallback;

    const calls: CapturedCall[] = [];
    const policyClient = new PolicyClient(
      "http://handshake.test",
      {
        roleCredential: "policy-token",
        requestIdentityFactory: () => "policy-request-id",
        originatingIdentity: "ref:policy-demo",
      },
      captureFetch(calls),
    );

    await policyClient.evaluatePolicy({} as EvaluatePolicyInput);

    expect(calls.map((call) => call.path)).toEqual(["/v0.2/policy-decisions"]);
    expect(calls.every((call) => call.method === "POST")).toBe(true);
    expect(calls.every((call) => call.headers.get("authorization") === "Bearer policy-token")).toBe(true);
    expect(calls[0]?.headers.get("x-handshake-protocol-version")).toBe(PROTOCOL_VERSION);
    expect(calls[0]?.headers.get("x-handshake-request-identity")).toBe("policy-request-id");
    expect(calls[0]?.headers.get("x-handshake-originating-identity")).toBe("ref:policy-demo");

    expect("gatewayCheck" in policyClient).toBe(false);
    expect("registerGatewayCredentialRef" in policyClient).toBe(false);
    expect("recordCredentialResolutionEvidence" in policyClient).toBe(false);
    expect("createReceiptExport" in policyClient).toBe(false);
    expect("createAuthorityCertificate" in policyClient).toBe(false);
    expect("createRuntimeExecution" in policyClient).toBe(false);
    expect("proposeActionContract" in policyClient).toBe(false);
    expect("registerInstallProposalCompiledRecords" in policyClient).toBe(false);
    expect("registerDelegatedAuthorityRef" in policyClient).toBe(false);
    expect("signPayment" in policyClient).toBe(false);
  });

  it("keeps runtime client construction to one runtime credential and no authority methods", async () => {
    // @ts-expect-error runtime client must not accept role maps.
    const invalidRuntimeRoleMap: RuntimeClientOptions = { roleCredential: "runtime-token", transitionTokens: {} };
    const invalidRuntimeFallback: RuntimeClientOptions = {
      roleCredential: "runtime-token",
      // @ts-expect-error runtime client must not accept fallback transport credentials.
      transitionToken: "fallback",
    };
    void invalidRuntimeRoleMap;
    void invalidRuntimeFallback;

    const calls: CapturedCall[] = [];
    const runtimeClient = new RuntimeClient(
      "http://handshake.test",
      {
        roleCredential: "runtime-token",
        requestIdentityFactory: () => "runtime-request-id",
        originatingIdentity: "ref:runtime-demo",
      },
      captureFetch(calls),
    );

    await runtimeClient.createRuntimeExecution({} as CreateRuntimeExecutionInput);
    await runtimeClient.proposeRuntimeIngressActionContracts({} as RuntimeIngressProposalInput);
    await runtimeClient.createToolCallDraft({} as CreateToolCallDraftInput);
    await runtimeClient.transitionToolCallDraft({} as TransitionToolCallDraftInput);
    await runtimeClient.compileIntent({} as CompileIntentInput);
    await runtimeClient.proposeActionContract({} as ProposeActionContractInput);

    expect(calls.map((call) => call.path)).toEqual([
      "/v0.2/runtime-executions",
      "/v0.2/runtime-ingress/action-contracts",
      "/v0.2/tool-call-drafts",
      "/v0.2/tool-call-draft-transitions",
      "/v0.2/intent-compilations",
      "/v0.2/action-contracts",
    ]);
    expect(calls.every((call) => call.method === "POST")).toBe(true);
    expect(calls.every((call) => call.headers.get("authorization") === "Bearer runtime-token")).toBe(true);
    expect(calls[0]?.headers.get("x-handshake-protocol-version")).toBe(PROTOCOL_VERSION);
    expect(calls[0]?.headers.get("x-handshake-request-identity")).toBe("runtime-request-id");
    expect(calls[0]?.headers.get("x-handshake-originating-identity")).toBe("ref:runtime-demo");

    expect("evaluatePolicy" in runtimeClient).toBe(false);
    expect("gatewayCheck" in runtimeClient).toBe(false);
    expect("createReceiptExport" in runtimeClient).toBe(false);
    expect("createAuthorityCertificate" in runtimeClient).toBe(false);
  });

  it("keeps evidence client read-only and verifies supplied certificates without minting", async () => {
    // @ts-expect-error evidence client must not accept role maps.
    const invalidEvidenceRoleMap: EvidenceClientOptions = { roleCredential: "review-token", transitionTokens: {} };
    const invalidEvidenceFallback: EvidenceClientOptions = {
      roleCredential: "review-token",
      // @ts-expect-error evidence client must not accept fallback transport credentials.
      transitionToken: "fallback",
    };
    void invalidEvidenceRoleMap;
    void invalidEvidenceFallback;

    const calls: CapturedCall[] = [];
    const evidenceClient = new EvidenceClient(
      "http://handshake.test",
      {
        roleCredential: "review-token",
        requestIdentityFactory: () => "evidence-request-id",
      },
      captureFetch(calls),
    );

    await evidenceClient.getGeneratedGraphEvidenceProjection("geg_demo");
    await evidenceClient.getContractEvidenceProjection("act_demo");
    await evidenceClient.getAgentTransactionEnvelopeProjection("act_demo");
    await evidenceClient.getIdempotencyRecoveryProjection("act_demo");
    await evidenceClient.getReceiptTimelineProjection("rcp_demo");
    await evidenceClient.getProtectedPathInstallHealthProjection("act_demo");

    expect(calls.map((call) => call.path)).toEqual([
      "/v0.2/evidence/generated-execution-graphs/geg_demo",
      "/v0.2/evidence/contracts/act_demo",
      "/v0.2/evidence/agent-transactions/act_demo",
      "/v0.2/evidence/idempotency-recovery/act_demo",
      "/v0.2/evidence/receipts/rcp_demo/timeline",
      "/v0.2/evidence/protected-path-install-health/act_demo",
    ]);
    expect(calls.every((call) => call.method === "GET")).toBe(true);
    expect(calls.every((call) => call.headers.get("authorization") === "Bearer review-token")).toBe(true);
    expect(calls.every((call) => call.headers.get("content-type") === null)).toBe(true);
    expect(calls.every((call) => call.body === undefined)).toBe(true);

    await expect(
      evidenceClient.verifyAuthorityCertificate({}, { keys: [], allowDevHmac: false }),
    ).resolves.toMatchObject({
      outcome: "refused",
      envelope: null,
      signingInputDigest: null,
    });

    expect("createReceiptExport" in evidenceClient).toBe(false);
    expect("createAuthorityCertificate" in evidenceClient).toBe(false);
    expect("gatewayCheck" in evidenceClient).toBe(false);
    expect("evaluatePolicy" in evidenceClient).toBe(false);
  });

  it("can use runtime evidence custody for scoped evidence readback without changing methods", async () => {
    const calls: CapturedCall[] = [];
    const evidenceClient = new EvidenceClient(
      "http://handshake.test",
      {
        roleCredential: "runtime-token",
        readRole: "runtime_evidence",
        requestIdentityFactory: () => "runtime-read-id",
      },
      captureFetch(calls),
    );

    await evidenceClient.getAgentTransactionEnvelopeProjection("act_demo");

    expect(calls[0]?.path).toBe("/v0.2/evidence/agent-transactions/act_demo");
    expect(calls[0]?.headers.get("authorization")).toBe("Bearer runtime-token");
    expect(calls[0]?.headers.get("x-handshake-request-identity")).toBe("runtime-read-id");
  });

  it("keeps the package role-client surface narrow and non-authority", async () => {
    const roleClients = await import("handshake-protocol-kernel/sdk/role-clients");
    const exportNames = Object.keys(roleClients).sort();

    expect(HandshakeClientError).toBeFunction();
    expect(exportNames).toEqual([
      "ControlPlaneClient",
      "EvidenceClient",
      "GatewayClient",
      "HandshakeClientError",
      "InstallClient",
      "PolicyClient",
      "RuntimeClient",
    ]);
    expect(exportNames).not.toContain("HandshakeClient");
    expect(exportNames.join(" ")).not.toMatch(/ReceiptExport|AuthorityCertificateMint|Signer|PaymentPayload/);
  });
});

function readyInstallProposal(): InstallProposal {
  const fixture = makeKernelFixture();
  return installProposal({
    status: "ready_to_install",
    refusalReasonCodes: [],
    compiledRecords: {
      toolCapability: fixture.tool,
      actionType: fixture.actionType,
      gatewayRegistryEntry: fixture.gateway,
      operatingEnvelope: fixture.envelope,
    },
  });
}

function refusedInstallProposal(): InstallProposal {
  return installProposal({
    status: "refused",
    refusalReasonCodes: ["fixture_install_refused"],
    compiledRecords: null,
  });
}

function installProposal(
  overrides: Pick<InstallProposal, "status" | "refusalReasonCodes" | "compiledRecords">,
): InstallProposal {
  return {
    installProposalId: "install_sdk_package_fixture",
    schemaVersion: PROTOCOL_VERSION,
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt: "2026-05-24T00:00:00.000Z",
    adapterPackId: "adapter_pack_package_install_material",
    adapterPackVersion: "0.1.0",
    actionFamily: "package.install",
    protectedSurfaceKind: "package_manager",
    resourceRef: "npm:hono",
    humanSummary: "Package install setup fixture.",
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
    installDigest: `sha256:${"a".repeat(64)}`,
    ...overrides,
  };
}

type CapturedCall = {
  path: string;
  method: string | undefined;
  headers: Headers;
  body: BodyInit | null | undefined;
};

function captureFetch(calls: CapturedCall[], responseFor?: (path: string, body: unknown) => unknown): HandshakeFetch {
  return async (input, init) => {
    const path = new URL(String(input)).pathname;
    const parsedBody = typeof init?.body === "string" ? JSON.parse(init.body) : { ok: true };
    const responseBody = responseFor?.(path, parsedBody) ?? parsedBody;
    calls.push({
      path,
      method: init?.method,
      headers: new Headers(init?.headers),
      body: init?.body,
    });
    return new Response(JSON.stringify(responseBody), { status: 200 });
  };
}

function installSetupResponse(body: unknown): unknown {
  const proposal = body as InstallProposal;
  const boundary = {
    authorityCreated: false,
    authorityCertificateMinted: false,
    credentialMaterialIncluded: false,
    gatewayCheckPerformed: false,
    greenlightCreated: false,
    mutationAttempted: false,
    mutationCommandIncluded: false,
    rawInternalRecordIncluded: false,
    receiptExportCreated: false,
  };
  const base = {
    ...boundary,
    commitAtomicity: "server_store_commit",
    installProposalId: proposal.installProposalId,
    installDigest: proposal.installDigest,
    adapterPackId: proposal.adapterPackId,
    adapterPackVersion: proposal.adapterPackVersion,
    actionFamily: proposal.actionFamily,
    protectedSurfaceKind: proposal.protectedSurfaceKind,
  };
  if (proposal.status !== "ready_to_install" || proposal.compiledRecords === null) {
    return {
      ...base,
      outcome: "install_proposal_refused",
      reasonCodes: proposal.refusalReasonCodes,
      records: null,
      recordRefs: null,
      refusal: { reasonCode: proposal.refusalReasonCodes[0] ?? "install_proposal_refused" },
    };
  }
  return {
    ...base,
    outcome: "compiled_records_registered",
    records: proposal.compiledRecords,
    recordRefs: {
      toolCapabilityId: proposal.compiledRecords.toolCapability.toolCapabilityId,
      actionTypeId: proposal.compiledRecords.actionType.actionTypeId,
      gatewayRegistryEntryId: requireInstallProposalGatewayRegistryEntry(proposal.compiledRecords.gatewayRegistryEntry)
        .gatewayRegistryEntryId,
      operatingEnvelopeId: proposal.compiledRecords.operatingEnvelope.envelopeId,
    },
    refusal: null,
  };
}
