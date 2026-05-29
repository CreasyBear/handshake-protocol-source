import { describe, expect, it } from "bun:test";
import { makeKernelFixture, makePackageInstallCandidate, registerFixtureObjects } from "../support/fixtures";

// D-66 / 05-RESEARCH-ADJUDICATION #4 (D5): an agent-origin compilation claims a
// generated execution graph/node binding but attaches no runtime-execution
// record. Generated code is not an action contract, so candidate-decision.ts
// must refuse the missing graph even when no `runtimeExecutionId` is attached —
// the runtime-shape branch can never fire in that case, which is the hole this
// pins shut. Enforcement site: deriveCandidateDecision via
// requiresMissingGeneratedExecutionGraphRefusal in
// src/protocol/areas/intent-compilation/candidate-decision.ts.

function agentOriginCompileInput(fixture: ReturnType<typeof makeKernelFixture>) {
  return {
    tenantId: fixture.tool.tenantId,
    organizationId: fixture.tool.organizationId,
    principalIntentRef: "intent:install hono",
    principalId: fixture.envelope.principalId,
    agentId: fixture.envelope.agentId,
    runId: "run_agent_origin",
    runtimeAdapterId: fixture.tool.runtimeAdapterId,
    operatingEnvelopeId: fixture.envelope.envelopeId,
    toolCatalogRef: "tool_catalog_demo@v1",
    actionCatalogRef: "action_catalog_demo@v1",
    gatewayRegistryRef: "gateway_registry@v1",
    generatedCodeOrSpecRefs: ["code:generated-agent-origin"],
    declaredAssumptions: ["package name is explicit"],
    requiredEvidenceRefs: ["evidence:package-lock-diff"],
    candidate: makePackageInstallCandidate(fixture),
  };
}

describe("agent-origin compilations require a generated execution graph (D-66)", () => {
  it("rejects an agent-origin node binding with no runtimeExecutionId and no graph", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);

    const compilation = await fixture.kernel.compileIntent({
      ...agentOriginCompileInput(fixture),
      // agent claims a generated-execution node binding but attaches no runtime
      // execution record and supplies no resolvable graph
      generatedExecutionNodeId: "node_agent_origin",
    });

    expect(compilation.candidateAction.candidateStatus).toBe("rejected");
    expect(compilation.candidateAction.refusalReasonCodes).toContain("generated_execution_graph_missing");
  });

  it("rejects an agent-origin graph reference with no runtimeExecutionId", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);

    const compilation = await fixture.kernel.compileIntent({
      ...agentOriginCompileInput(fixture),
      generatedExecutionGraphId: "graph_unanchored",
    });

    expect(compilation.candidateAction.candidateStatus).toBe("rejected");
    expect(compilation.candidateAction.refusalReasonCodes).toContain("generated_execution_graph_missing");
  });

  it("does not raise generated_execution_graph_missing when no graph/node binding is claimed (boundary)", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);

    // No generatedExecutionGraphId, no generatedExecutionNodeId, no runtime
    // execution — not an agent-origin claim, so the graph requirement is not
    // asserted by this rule (other refusal codes may still apply elsewhere).
    const compilation = await fixture.kernel.compileIntent(agentOriginCompileInput(fixture));

    expect(compilation.candidateAction.refusalReasonCodes).not.toContain("generated_execution_graph_missing");
  });
});
