import { describe, expect, it } from "bun:test";
import { makeKernelFixture, makePackageInstallCandidate, registerFixtureObjects } from "../support/fixtures";

describe("kernel cross-scope authority matrix", () => {
  it.each([
    ["tool_capability", (fixture: ReturnType<typeof makeKernelFixture>) => ({ tool: foreignScope(fixture.tool) })],
    [
      "action_type",
      (fixture: ReturnType<typeof makeKernelFixture>) => ({ actionType: foreignScope(fixture.actionType) }),
    ],
    [
      "gateway_registry_entry",
      (fixture: ReturnType<typeof makeKernelFixture>) => ({ gateway: foreignScope(fixture.gateway) }),
    ],
    [
      "operating_envelope",
      (fixture: ReturnType<typeof makeKernelFixture>) => ({ envelope: foreignScope(fixture.envelope) }),
    ],
  ] as const)(
    "refuses compilation when %s is installed under a different tenant/org",
    async (_objectType, mutateFixture) => {
      const fixture = makeKernelFixture();
      await registerFixtureObjects({ ...fixture, ...mutateFixture(fixture) });

      const compilation = await fixture.kernel.compileIntent({
        tenantId: "tenant_demo",
        organizationId: "org_demo",
        principalIntentRef: "intent:cross-scope package install",
        principalId: "principal_demo",
        agentId: "agent_demo",
        runId: "run_demo",
        runtimeAdapterId: "runtime_codex",
        operatingEnvelopeId: fixture.envelope.envelopeId,
        toolCatalogRef: "tool_catalog_demo@v1",
        actionCatalogRef: "action_catalog_demo@v1",
        gatewayRegistryRef: "gateway_registry@v1",
        candidate: makePackageInstallCandidate(fixture, {
          idempotencyKey: `idem_cross_scope_${_objectType}`,
        }),
      });

      expect(compilation.candidateAction.candidateStatus).toBe("rejected");
      expect(compilation.overreachReasonCodes).toContain("durable_record_scope_mismatch");
      await expect(
        fixture.kernel.proposeActionContract({
          intentCompilationId: compilation.intentCompilationId,
          candidateActionId: compilation.candidateAction.candidateActionId,
          candidateDigest: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          signingSecret: "test-secret",
        }),
      ).rejects.toThrow("Candidate is rejected");
    },
  );
});

function foreignScope<T extends { tenantId: string; organizationId: string }>(value: T): T {
  return { ...value, tenantId: "tenant_foreign", organizationId: "org_foreign" };
}
