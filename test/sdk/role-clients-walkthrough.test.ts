import { describe, expect, it } from "bun:test";
import type { InstallProposal } from "../../src/install";
import { PROTOCOL_VERSION } from "../../src/protocol/public/schemas";
import {
  ControlPlaneClient,
  GatewayClient,
  InstallClient,
  PolicyClient,
  RuntimeClient,
  type HandshakeFetch,
} from "../../src/sdk/surface-clients";
import { futureIso, makeKernelFixture, makePackageInstallCandidate } from "../support/fixtures";

describe("integrator parity SDK role-clients walkthrough", () => {
  it("composes integrator parity clients with distinct roles and no bundled execute", async () => {
    const fixture = makeKernelFixture();
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
      tenantId: fixture.envelope.tenantId,
      organizationId: fixture.envelope.organizationId,
      principalId: fixture.envelope.principalId,
      agentId: fixture.envelope.agentId,
      runtimeAdapterId: fixture.tool.runtimeAdapterId,
      operatingEnvelopeId: fixture.envelope.envelopeId,
      gatewayId: fixture.gateway.gatewayId,
      gatewayRegistryEntryId: fixture.gateway.gatewayRegistryEntryId,
      protectedSurfaceKind: fixture.actionType.protectedSurfaceKind,
      actionClasses: [fixture.actionType.actionClass],
      resourceRefs: [fixture.envelope.allowedResources[0] ?? "*"],
      authorityKind: "spend",
      grantStatus: "active",
      policyPackRef: fixture.envelope.policyPackRef,
      policyPackVersion: fixture.envelope.policyPackVersion,
      amountParameterName: "atomicAmount",
      maxAtomicAmountPerAction: "1000",
      evidenceExpectationRefs: [],
      expiresAt: futureIso(),
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
      runtimeAdapterId: "runtime_codex",
      operatingEnvelopeId: fixture.envelope.envelopeId,
      toolCatalogRef: "tool_catalog_demo@v1",
      actionCatalogRef: "action_catalog_demo@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      candidate: makePackageInstallCandidate(fixture),
    });

    const policy = new PolicyClient("http://handshake.test", { roleCredential: "control-token" }, fetchImpl);
    await policy.evaluatePolicy({
      actionContractId: "contract_demo",
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });

    const gateway = new GatewayClient("http://handshake.test", { roleCredential: "gateway-token" }, fetchImpl);
    await gateway.gatewayCheck({
      actionContractId: "contract_demo",
      greenlightId: "greenlight_demo",
      observedParameters: { package: "hono" },
    });
    await gateway.gatewayCheck({
      actionContractId: "contract_demo",
      greenlightId: "greenlight_demo_retry",
      observedParameters: { package: "hono" },
      surfaceOperationRef: "surface-op:retry",
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

function minimalInstallProposal(): InstallProposal {
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
