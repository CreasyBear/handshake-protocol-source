import { describe, expect, it } from "bun:test";
import { digestCanonical } from "../src/protocol/canonical";
import type { GeneratedExecutionGraph, GeneratedExecutionNodeInput, JsonValue, RuntimeExecutionRecord } from "../src/protocol/schemas";
import {
  futureIso,
  makeKernelFixture,
  makePackageInstallCandidate,
  registerFixtureObjects,
} from "./fixtures";

const ZERO_DIGEST = `sha256:${"0".repeat(64)}`;

describe("generated execution graph coverage boundary", () => {
  it("refuses shell runtime candidates when graph coverage is missing and creates no contract or proof gap", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const runtimeExecution = await createShellRuntimeExecution(fixture);

    const compilation = await fixture.kernel.compileIntent({
      ...compileInput(fixture),
      runtimeExecutionId: runtimeExecution.runtimeExecutionId,
    });

    expect(compilation.candidateAction.candidateStatus).toBe("rejected");
    expect(compilation.candidateAction.refusalReasonCodes).toContain("generated_execution_graph_missing");
    await expect(
      fixture.kernel.proposeActionContract({
        intentCompilationId: compilation.intentCompilationId,
        candidateActionId: compilation.candidateAction.candidateActionId,
        candidateDigest: ZERO_DIGEST,
      }),
    ).rejects.toThrow("Candidate is rejected");
    expect(await fixture.store.listRecordsByType("action_contract")).toHaveLength(0);
    expect(await fixture.store.listRecordsByType("proof_gap")).toHaveLength(0);
  });

  it("records unsupported graph evidence but refuses every candidate from that generated block", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const runtimeExecution = await createShellRuntimeExecution(fixture);
    const graph = await createGeneratedExecutionGraph(fixture, runtimeExecution, [
      unsupportedNode("node_unsupported"),
    ]);

    const compilation = await fixture.kernel.compileIntent({
      ...compileInput(fixture),
      runtimeExecutionId: runtimeExecution.runtimeExecutionId,
      generatedExecutionGraphId: graph.generatedExecutionGraphId,
      generatedExecutionNodeId: "node_unsupported",
    });

    expect(graph.coverageStatus).toBe("unsupported_or_ambiguous");
    expect(compilation.candidateAction.candidateStatus).toBe("rejected");
    expect(compilation.candidateAction.refusalReasonCodes).toContain("generated_execution_graph_not_contractable");
    expect(compilation.candidateAction.refusalReasonCodes).toContain("generated_execution_node_not_contractable");
    expect(await fixture.store.listRecordsByType("action_contract")).toHaveLength(0);
    expect(await fixture.store.listRecordsByType("proof_gap")).toHaveLength(0);
  });

  it("applies whole-block refusal when an eligible node has an unsupported sibling", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const runtimeExecution = await createShellRuntimeExecution(fixture);
    const graph = await createGeneratedExecutionGraph(fixture, runtimeExecution, [
      await eligiblePackageNode(fixture, "node_install"),
      unsupportedNode("node_sibling"),
    ]);

    const compilation = await fixture.kernel.compileIntent({
      ...compileInput(fixture),
      runtimeExecutionId: runtimeExecution.runtimeExecutionId,
      generatedExecutionGraphId: graph.generatedExecutionGraphId,
      generatedExecutionNodeId: "node_install",
    });

    expect(graph.coverageStatus).toBe("unsupported_or_ambiguous");
    expect(compilation.candidateAction.candidateStatus).toBe("rejected");
    expect(compilation.candidateAction.refusalReasonCodes).toContain("generated_execution_graph_not_contractable");
    expect(await fixture.store.listRecordsByType("action_contract")).toHaveLength(0);
  });

  it("lets a fully covered graph node become a candidate while preserving graph digest binding", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const runtimeExecution = await createShellRuntimeExecution(fixture);
    const graph = await createGeneratedExecutionGraph(fixture, runtimeExecution, [
      await eligiblePackageNode(fixture, "node_install"),
      readOnlyNode("node_version_check"),
    ]);

    const compilation = await fixture.kernel.compileIntent({
      ...compileInput(fixture),
      runtimeExecutionId: runtimeExecution.runtimeExecutionId,
      generatedExecutionGraphId: graph.generatedExecutionGraphId,
      generatedExecutionNodeId: "node_install",
    });

    expect(graph.coverageStatus).toBe("fully_covered_no_unsupported_nodes");
    expect(compilation.candidateAction.candidateStatus).toBe("contractable");
    expect(compilation.candidateAction.generatedExecutionGraphDigest).toBe(graph.graphDigest);
    const graphNode = graph.nodes[0];
    expect(graphNode).toBeDefined();
    expect(compilation.candidateAction.generatedExecutionNodeDigest).toBe(graphNode!.nodeDigest);
    const contract = await fixture.kernel.proposeActionContract({
      intentCompilationId: compilation.intentCompilationId,
      candidateActionId: compilation.candidateAction.candidateActionId,
      candidateDigest: requireDigest(compilation.candidateAction.candidateDigest),
    });
    expect(contract.generatedExecutionGraphDigest).toBe(graph.graphDigest);
    expect(contract.generatedExecutionNodeDigest).toBe(graphNode!.nodeDigest);
  });

  it("refuses contract proposal when durable graph evidence drifts after compilation", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const runtimeExecution = await createShellRuntimeExecution(fixture);
    const graph = await createGeneratedExecutionGraph(fixture, runtimeExecution, [
      await eligiblePackageNode(fixture, "node_install"),
    ]);
    const compilation = await fixture.kernel.compileIntent({
      ...compileInput(fixture),
      runtimeExecutionId: runtimeExecution.runtimeExecutionId,
      generatedExecutionGraphId: graph.generatedExecutionGraphId,
      generatedExecutionNodeId: "node_install",
    });
    expect(compilation.candidateAction.candidateStatus).toBe("contractable");

    await overwriteStoredGeneratedExecutionGraph(fixture, {
      ...graph,
      graphDigest: ZERO_DIGEST,
    });

    await expect(
      fixture.kernel.proposeActionContract({
        intentCompilationId: compilation.intentCompilationId,
        candidateActionId: compilation.candidateAction.candidateActionId,
        candidateDigest: requireDigest(compilation.candidateAction.candidateDigest),
      }),
    ).rejects.toThrow("generated_execution_graph");
    expect(await fixture.store.listRecordsByType("action_contract")).toHaveLength(0);
  });

  it("refuses contractable-looking nodes when catalog or gateway registry binding is missing", async () => {
    const bindingCases: Array<{
      name: string;
      nodeId: string;
      mutate: (node: GeneratedExecutionNodeInput) => Promise<GeneratedExecutionNodeInput>;
      expectedReason: string;
    }> = [
      {
        name: "gateway registry entry mismatch",
        nodeId: "node_registry_miss",
        mutate: async (node) => ({
          ...node,
          gatewayRegistryEntryId: "gwreg_missing",
          nodeGatewayBindingDigest: await digestCanonical({ gatewayRegistryEntryId: "gwreg_missing" }),
        }),
        expectedReason: "generated_execution_node_binding_mismatch",
      },
      {
        name: "node gateway binding digest missing",
        nodeId: "node_binding_missing",
        mutate: async (node) => ({ ...node, nodeGatewayBindingDigest: null }),
        expectedReason: "generated_execution_node_gateway_binding_missing",
      },
    ];

    for (const testCase of bindingCases) {
      const fixture = makeKernelFixture();
      await registerFixtureObjects(fixture);
      const runtimeExecution = await createShellRuntimeExecution(fixture);
      const node = await testCase.mutate(await eligiblePackageNode(fixture, testCase.nodeId));
      const graph = await createGeneratedExecutionGraph(fixture, runtimeExecution, [node]);

      const compilation = await fixture.kernel.compileIntent({
        ...compileInput(fixture),
        runtimeExecutionId: runtimeExecution.runtimeExecutionId,
        generatedExecutionGraphId: graph.generatedExecutionGraphId,
        generatedExecutionNodeId: node.nodeId,
      });

      expect(compilation.candidateAction.candidateStatus, testCase.name).toBe("rejected");
      expect(compilation.candidateAction.refusalReasonCodes, testCase.name).toContain(testCase.expectedReason);
      await expect(
        fixture.kernel.proposeActionContract({
          intentCompilationId: compilation.intentCompilationId,
          candidateActionId: compilation.candidateAction.candidateActionId,
          candidateDigest: ZERO_DIGEST,
        }),
      ).rejects.toThrow("Candidate is rejected");
      expect(await fixture.store.listRecordsByType("action_contract")).toHaveLength(0);
    }
  });

  it("refuses graph evidence from a caller that does not match runtime custody scope", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const runtimeExecution = await createShellRuntimeExecution(fixture);

    await expect(
      fixture.kernel.createGeneratedExecutionGraph(
        { ...(await graphInput([readOnlyNode("node_ls")])), runtimeExecutionId: runtimeExecution.runtimeExecutionId },
        {
          ...issuerContext(runtimeExecution),
          runId: "run_other",
        },
      ),
    ).rejects.toThrow("issuer context must match");
    expect(await fixture.store.listRecordsByType("generated_execution_graph")).toHaveLength(0);
  });

  it("treats truncation, raw material, bypass, and fail-open classifier evidence as non-contractable coverage", async () => {
    const cases: Array<{
      name: string;
      node: GeneratedExecutionNodeInput;
      graphOverrides?: Partial<Awaited<ReturnType<typeof graphInput>>>;
      expectedStatus: GeneratedExecutionGraph["coverageStatus"];
      expectedReason: string;
    }> = [
      {
        name: "truncated",
        node: readOnlyNode("node_truncated"),
        graphOverrides: { truncationStatus: "truncated" },
        expectedStatus: "contains_coverage_gap",
        expectedReason: "generated_execution_graph_truncated",
      },
      {
        name: "raw argv",
        node: { ...readOnlyNode("node_raw"), argvRedactionStatus: "raw_material_present" },
        expectedStatus: "contains_refusal",
        expectedReason: "generated_execution_node_raw_argv_material",
      },
      {
        name: "bypass",
        node: { ...readOnlyNode("node_bypass"), commandRiskClassifierPosture: "bypass_detected" },
        expectedStatus: "contains_bypass_risk",
        expectedReason: "generated_execution_command_risk_bypass_detected",
      },
      {
        name: "fail open",
        node: { ...readOnlyNode("node_fail_open"), commandRiskClassifierPosture: "fail_open" },
        expectedStatus: "contains_coverage_gap",
        expectedReason: "generated_execution_command_risk_fail_open",
      },
      {
        name: "observer only",
        node: { ...readOnlyNode("node_observer"), nodeKind: "observer_event", classification: "observer_only" },
        expectedStatus: "contains_coverage_gap",
        expectedReason: "generated_execution_node_observer_only",
      },
      {
        name: "hidden trigger",
        node: { ...readOnlyNode("node_hidden"), nodeKind: "hidden_trigger", classification: "hidden_trigger" },
        expectedStatus: "contains_coverage_gap",
        expectedReason: "generated_execution_node_hidden_trigger",
      },
      {
        name: "unknown node kind",
        node: { ...readOnlyNode("node_unknown"), nodeKind: "unknown" },
        expectedStatus: "contains_coverage_gap",
        expectedReason: "generated_execution_node_kind_unknown",
      },
    ];

    for (const testCase of cases) {
      const fixture = makeKernelFixture();
      await registerFixtureObjects(fixture);
      const runtimeExecution = await createShellRuntimeExecution(fixture);
      const graph = await createGeneratedExecutionGraph(
        fixture,
        runtimeExecution,
        [testCase.node],
        testCase.graphOverrides,
      );

      expect(graph.coverageStatus, testCase.name).toBe(testCase.expectedStatus);
      expect(graph.terminalReasonCodes, testCase.name).toContain(testCase.expectedReason);
      const compilation = await fixture.kernel.compileIntent({
        ...compileInput(fixture),
        runtimeExecutionId: runtimeExecution.runtimeExecutionId,
        generatedExecutionGraphId: graph.generatedExecutionGraphId,
        generatedExecutionNodeId: testCase.node.nodeId,
      });
      expect(compilation.candidateAction.candidateStatus, testCase.name).toBe("rejected");
      expect(compilation.candidateAction.refusalReasonCodes, testCase.name).toContain("generated_execution_graph_not_contractable");
    }
  });
});

async function createShellRuntimeExecution(fixture: ReturnType<typeof makeKernelFixture>): Promise<RuntimeExecutionRecord> {
  return fixture.kernel.createRuntimeExecution({
    tenantId: fixture.tool.tenantId,
    organizationId: fixture.tool.organizationId,
    principalIntentRef: "intent:install hono",
    principalId: fixture.envelope.principalId,
    agentId: fixture.envelope.agentId,
    runId: "run_demo",
    runtimeAdapterId: fixture.tool.runtimeAdapterId,
    executionShape: "shell_exec_block",
    runtimePosture: "hook_assisted",
    executionBlockRef: "shell:block:install-hono",
    executionBlockDigest: await digestCanonical({ shell: "bun add hono@^4.12.19" }),
    generatedCodeOrSpecRefs: ["code:generated-shell"],
    allowedToolCapabilityIds: [fixture.tool.toolCapabilityId],
    observedToolCallRefs: ["shell:bun-add-hono"],
    observedConsequentialCallCount: 1,
    accessPosture: "filesystem_available",
  });
}

function compileInput(fixture: ReturnType<typeof makeKernelFixture>) {
  return {
    tenantId: fixture.tool.tenantId,
    organizationId: fixture.tool.organizationId,
    principalIntentRef: "intent:install hono",
    principalId: fixture.envelope.principalId,
    agentId: fixture.envelope.agentId,
    runId: "run_demo",
    runtimeAdapterId: fixture.tool.runtimeAdapterId,
    operatingEnvelopeId: fixture.envelope.envelopeId,
    toolCatalogRef: "tool_catalog_demo@v1",
    actionCatalogRef: "action_catalog_demo@v1",
    gatewayRegistryRef: "gateway_registry@v1",
    generatedCodeOrSpecRefs: ["code:generated-shell"],
    declaredAssumptions: ["package name is explicit"],
    requiredEvidenceRefs: ["evidence:package-lock-diff"],
    candidate: makePackageInstallCandidate(fixture),
  };
}

async function createGeneratedExecutionGraph(
  fixture: ReturnType<typeof makeKernelFixture>,
  runtimeExecution: RuntimeExecutionRecord,
  nodes: GeneratedExecutionNodeInput[],
  overrides: Partial<Awaited<ReturnType<typeof graphInput>>> = {},
): Promise<GeneratedExecutionGraph> {
  const input = await graphInput(nodes, overrides);
  return fixture.kernel.createGeneratedExecutionGraph(
    { ...input, runtimeExecutionId: runtimeExecution.runtimeExecutionId },
    issuerContext(runtimeExecution),
  );
}

async function overwriteStoredGeneratedExecutionGraph(
  fixture: ReturnType<typeof makeKernelFixture>,
  graph: GeneratedExecutionGraph,
): Promise<void> {
  const existing = await fixture.store.getRecord<GeneratedExecutionGraph>(
    "generated_execution_graph",
    graph.generatedExecutionGraphId,
  );
  if (!existing) throw new Error("expected stored generated execution graph");
  await fixture.store.putRecord({
    ...existing,
    canonicalDigest: await digestCanonical(graph as JsonValue),
    payload: graph,
  });
}

async function graphInput(
  nodes: GeneratedExecutionNodeInput[],
  overrides: Partial<{
    graphNonce: string;
    truncationStatus: "complete" | "truncated" | "over_limit" | "unknown";
  }> = {},
) {
  return {
    runtimeExecutionId: "placeholder",
    graphNonce: `nonce_${Math.random().toString(16).slice(2).padEnd(8, "0")}`,
    parserVersion: "test-shell-parser-0.1",
    supportedGrammarVersion: "literal-command-list-0.1",
    entryNodeIds: nodes[0] ? [nodes[0].nodeId] : [],
    edges: nodes.length > 1 ? [{ fromNodeId: nodes[0]?.nodeId ?? "node_missing", toNodeId: nodes[1]?.nodeId ?? "node_missing", edgeKind: "sequence" as const }] : [],
    maxNodeCount: 16,
    maxEdgeCount: 32,
    maxDepth: 8,
    maxGraphByteSize: 65536,
    truncationStatus: "complete" as const,
    catalogSnapshotDigest: await digestCanonical({ catalog: "tool_catalog_demo@v1" }),
    gatewayRegistrySnapshotDigest: await digestCanonical({ gatewayRegistry: "gateway_registry@v1" }),
    registryBindingSetDigest: await digestCanonical({ bindings: "test" }),
    nodes,
    ...overrides,
  };
}

function issuerContext(runtimeExecution: RuntimeExecutionRecord) {
  return {
    tenantId: runtimeExecution.tenantId,
    organizationId: runtimeExecution.organizationId,
    principalIntentRef: runtimeExecution.principalIntentRef,
    principalId: runtimeExecution.principalId,
    agentId: runtimeExecution.agentId,
    runId: runtimeExecution.runId,
    runtimeAdapterId: runtimeExecution.runtimeAdapterId,
    graphIssuerRef: "runtime-adapter:test-shell",
    graphIssuerAuthority: "kernel_fixture" as const,
    graphIssuedAt: runtimeExecution.createdAt,
  };
}

async function eligiblePackageNode(
  fixture: ReturnType<typeof makeKernelFixture>,
  nodeId: string,
): Promise<GeneratedExecutionNodeInput> {
  const candidate = makePackageInstallCandidate(fixture);
  const paramsDigest = await digestCanonical({
    parameters: candidate.parameters,
    secretRefs: candidate.secretRefs ?? {},
  } as JsonValue);
  return {
    ...readOnlyNode(nodeId),
    classification: "candidate_action_eligible",
    actionClass: candidate.actionClass,
    toolCapabilityId: candidate.toolCapabilityId,
    actionTypeId: candidate.actionTypeId,
    gatewayRegistryEntryId: candidate.gatewayRegistryEntryId,
    resourceRef: candidate.resourceRef,
    paramsDigest,
    nodeGatewayBindingDigest: await digestCanonical({
      actionClass: candidate.actionClass,
      toolCapabilityId: candidate.toolCapabilityId,
      actionTypeId: candidate.actionTypeId,
      gatewayRegistryEntryId: candidate.gatewayRegistryEntryId,
      resourceRef: candidate.resourceRef,
      paramsDigest,
    }),
  };
}

function readOnlyNode(nodeId: string): GeneratedExecutionNodeInput {
  return {
    nodeId,
    nodeKind: "shell_command",
    classification: "read_only",
    argvRedactionStatus: "redacted",
    stdinRedactionStatus: "digest_only",
    redactedArgvSummary: ["bun", "--version"],
    rawSecretMaterialDetected: false,
    commandRiskClassifierPosture: "advisory_no_match",
  };
}

function unsupportedNode(nodeId: string): GeneratedExecutionNodeInput {
  return {
    ...readOnlyNode(nodeId),
    classification: "unsupported",
    unsupportedReasonCodes: ["generated_execution_shell_compound_unsupported"],
  };
}

function requireDigest(digest: string | null): string {
  if (!digest) throw new Error("missing candidate digest");
  return digest;
}
