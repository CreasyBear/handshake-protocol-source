import { describe, expect, it } from "bun:test";
import { PROTOCOL_VERSION } from "../../src/protocol/public/schemas";
import {
  ControlPlaneClient,
  GatewayClient,
  InstallClient,
  PolicyClient,
  RuntimeClient,
  type HandshakeFetch,
} from "../../src/sdk/surface-clients";

describe("Tier-1 SDK role-clients walkthrough", () => {
  it("composes Tier-1 clients with distinct roles and no bundled execute", async () => {
    const calls: Array<{ path: string; authorization: string | null }> = [];
    const fetchImpl: HandshakeFetch = async (_input, init) => {
      const path = new URL(String(_input)).pathname;
      const headers = new Headers(init?.headers);
      calls.push({ path, authorization: headers.get("authorization") });
      return new Response(JSON.stringify({ ok: true, outcome: "compiled_records_registered" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    const install = new InstallClient("http://handshake.test", { roleCredential: "install-token" }, fetchImpl);
    await install.registerInstallProposalCompiledRecords(minimalInstallProposal());

    const controlPlane = new ControlPlaneClient(
      "http://handshake.test",
      { roleCredential: "control-token" },
      fetchImpl,
    );
    await controlPlane.registerDelegatedAuthorityRef({
      delegatedAuthorityRefId: "delegated_demo",
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalId: "principal_demo",
      agentId: "agent_demo",
      authorityKind: "spend",
      policyPackRef: "policy:demo",
      policyPackVersion: "v1",
      maxAtomicAmountPerCall: "1000",
      delegatedAuthorityRefDigest: `sha256:${"a".repeat(64)}`,
      status: "active",
      evidenceExpectationRefs: [],
    });

    const runtime = new RuntimeClient(
      "http://handshake.test",
      { roleCredential: "runtime-token" },
      fetchImpl,
    );
    await runtime.compileIntent({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:demo",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_demo",
      operatingEnvelopeId: "env_demo",
      toolCatalogRef: "tool_catalog@v1",
      actionCatalogRef: "action_catalog@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      generatedCodeOrSpecRefs: ["code:demo"],
      declaredAssumptions: [],
      requiredEvidenceRefs: [],
      candidate: {
        candidateActionId: "candidate_demo",
        toolCapabilityId: "tool_demo",
        actionTypeId: "action_demo",
        gatewayRegistryEntryId: "gateway_demo",
        protectedSurfaceKind: "http_api",
        resourceRef: "https://api.example/resource",
        humanSummary: "demo",
        paramsDigest: `sha256:${"b".repeat(64)}`,
        candidateDigest: `sha256:${"c".repeat(64)}`,
        sequencingDependencies: [],
        rollbackExpectations: [],
        evidenceExpectations: [],
        uncertaintyMarkers: [],
      },
    });

    const policy = new PolicyClient(
      "http://handshake.test",
      { roleCredential: "control-token", role: "runtime_evidence" },
      fetchImpl,
    );
    await policy.evaluatePolicy({
      actionContractId: "contract_demo",
      policyPackRef: "policy:demo",
      policyPackVersion: "v1",
      evaluationDigest: `sha256:${"d".repeat(64)}`,
    });

    const gateway = new GatewayClient(
      "http://handshake.test",
      { roleCredential: "gateway-token", role: "gateway_custody" },
      fetchImpl,
    );
    await gateway.gatewayCheck({
      actionContractId: "contract_demo",
      gatewayRegistryEntryId: "gateway_demo",
      gatewayCheckDigest: `sha256:${"e".repeat(64)}`,
      idempotencyKey: "idem_first",
    });
    await gateway.gatewayCheck({
      actionContractId: "contract_demo",
      gatewayRegistryEntryId: "gateway_demo",
      gatewayCheckDigest: `sha256:${"f".repeat(64)}`,
      idempotencyKey: "idem_retry",
    });

    const roles = new Set(calls.map((call) => call.authorization));
    expect(roles.size).toBeGreaterThan(1);
    expect(calls.some((call) => call.path.includes("/install-proposals/"))).toBe(true);
    expect(calls.some((call) => call.path.includes("/policy-decisions"))).toBe(true);
    expect(calls.some((call) => call.path.includes("/gateway-check-attempts"))).toBe(true);
    const idempotencyCalls = calls.filter((call) => call.path.includes("/gateway-check-attempts"));
    expect(idempotencyCalls.length).toBe(2);
  });
});

function minimalInstallProposal() {
  return {
    installProposalId: "install_walkthrough",
    schemaVersion: PROTOCOL_VERSION,
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt: "2026-05-24T00:00:00.000Z",
    adapterPackId: "adapter_pack_x402",
    adapterPackVersion: "0.1.0",
    actionFamily: "x402_payment",
    protectedSurfaceKind: "http_api",
    resourceRef: "https://api.example/pay",
    humanSummary: "Walkthrough install",
    policyPackRef: "policy:demo",
    policyPackVersion: "v1",
    bypassProbePlan: [],
    receiptExpectationRefs: [],
    installDigest: `sha256:${"0".repeat(64)}`,
    status: "ready_to_install" as const,
    refusalReasonCodes: [] as string[],
    compiledRecords: null,
  };
}
