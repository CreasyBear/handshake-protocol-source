import { digestCanonical } from "../canonical";
import { HandshakeProtocolError } from "../errors";
import { createId, nowIso } from "../ids";
import type { ProtocolRecorder } from "../records";
import type { RuntimeExecutionRecord } from "../runtime-evidence";
import type { ProtocolStore } from "../store-port";
import {
  CreateGeneratedExecutionGraphInputSchema,
  GraphEvidenceIssuerContextSchema,
  type CreateGeneratedExecutionGraphInput,
  type GraphEvidenceIssuerContext,
} from "./types";
import {
  GeneratedExecutionGraphSchema,
  GeneratedExecutionNodeSchema,
  type CommandRiskClassifierPosture,
  type GeneratedExecutionCoverageStatus,
  type GeneratedExecutionGraph,
  type GeneratedExecutionNode,
  type GeneratedExecutionNodeClassification,
  type GraphRedactionStatus,
  type GraphTruncationStatus,
} from "./types";
import { PROTOCOL_VERSION, type JsonValue } from "../schema-core";

export async function createGeneratedExecutionGraph(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  inputValue: CreateGeneratedExecutionGraphInput,
  issuerContextValue: GraphEvidenceIssuerContext,
): Promise<GeneratedExecutionGraph> {
  const input = CreateGeneratedExecutionGraphInputSchema.parse(inputValue);
  const issuerContext = GraphEvidenceIssuerContextSchema.parse(issuerContextValue);
  const runtimeExecutionRecord = await recorder.requiredRecord<RuntimeExecutionRecord>(
    "runtime_execution",
    input.runtimeExecutionId,
    "runtime_execution_missing",
  );
  const runtimeExecution = runtimeExecutionRecord.payload;
  assertIssuerMatchesRuntime(runtimeExecution, issuerContext);
  await assertNonceUnused(store, runtimeExecution, input.graphNonce);

  const createdAt = nowIso();
  const { nodes, terminalReasonCodes, coverageStatus, graphByteSize } = await buildGraphCoverage(input);
  const graphInputDigest = await digestCanonical({
    input,
    issuerContext,
    runtimeExecutionId: runtimeExecution.runtimeExecutionId,
    runtimeExecutionDigest: runtimeExecution.runtimeExecutionDigest,
  });
  const generatedExecutionGraphId = createId("geg");
  const graphDigestMaterial = {
    tenantId: runtimeExecution.tenantId,
    organizationId: runtimeExecution.organizationId,
    runtimeExecutionId: runtimeExecution.runtimeExecutionId,
    runtimeExecutionDigest: runtimeExecution.runtimeExecutionDigest,
    executionBlockDigest: runtimeExecution.executionBlockDigest,
    graphIssuerRef: issuerContext.graphIssuerRef,
    graphIssuerAuthority: issuerContext.graphIssuerAuthority,
    graphIssuedAt: issuerContext.graphIssuedAt,
    graphNonce: input.graphNonce,
    graphInputDigest,
    graphSchemaVersion: input.graphSchemaVersion,
    parserVersion: input.parserVersion,
    supportedGrammarVersion: input.supportedGrammarVersion,
    coverageValidatorVersion: input.coverageValidatorVersion,
    coverageStatus,
    terminalReasonCodes,
    entryNodeIds: input.entryNodeIds,
    edges: input.edges,
    nodeCount: nodes.length,
    edgeCount: input.edges.length,
    maxNodeCount: input.maxNodeCount,
    maxEdgeCount: input.maxEdgeCount,
    maxDepth: input.maxDepth,
    graphByteSize,
    maxGraphByteSize: input.maxGraphByteSize,
    truncationStatus: input.truncationStatus,
    catalogSnapshotDigest: input.catalogSnapshotDigest,
    gatewayRegistrySnapshotDigest: input.gatewayRegistrySnapshotDigest,
    registryBindingSetDigest: input.registryBindingSetDigest,
    nodes,
  } satisfies JsonValue;
  const graphDigest = await digestCanonical(graphDigestMaterial);
  const graph = GeneratedExecutionGraphSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: runtimeExecution.tenantId,
    organizationId: runtimeExecution.organizationId,
    createdAt,
    generatedExecutionGraphId,
    runtimeExecutionId: runtimeExecution.runtimeExecutionId,
    runtimeExecutionDigest: runtimeExecution.runtimeExecutionDigest,
    executionBlockDigest: runtimeExecution.executionBlockDigest,
    graphIssuerRef: issuerContext.graphIssuerRef,
    graphIssuerAuthority: issuerContext.graphIssuerAuthority,
    graphIssuedAt: issuerContext.graphIssuedAt,
    graphNonce: input.graphNonce,
    graphInputDigest,
    graphSchemaVersion: input.graphSchemaVersion,
    parserVersion: input.parserVersion,
    supportedGrammarVersion: input.supportedGrammarVersion,
    coverageValidatorVersion: input.coverageValidatorVersion,
    graphDigest,
    coverageStatus,
    terminalReasonCodes,
    entryNodeIds: input.entryNodeIds,
    edges: input.edges,
    nodeCount: nodes.length,
    edgeCount: input.edges.length,
    maxNodeCount: input.maxNodeCount,
    maxEdgeCount: input.maxEdgeCount,
    maxDepth: input.maxDepth,
    graphByteSize,
    maxGraphByteSize: input.maxGraphByteSize,
    truncationStatus: input.truncationStatus,
    catalogSnapshotDigest: input.catalogSnapshotDigest,
    gatewayRegistrySnapshotDigest: input.gatewayRegistrySnapshotDigest,
    registryBindingSetDigest: input.registryBindingSetDigest,
    nodes,
  });

  await recorder.commitRecordsWithEvents(
    [{ objectType: "generated_execution_graph", payload: graph }],
    [
      {
        source: graph,
        eventType: "generated_execution_graph_recorded",
        objectRefs: [
          graph.generatedExecutionGraphId,
          graph.graphDigest,
          graph.runtimeExecutionId,
          graph.runtimeExecutionDigest,
        ],
        payload: {
          runtimeExecutionId: graph.runtimeExecutionId,
          coverageStatus: graph.coverageStatus,
          terminalReasonCodes: graph.terminalReasonCodes,
          nodeCount: graph.nodeCount,
          edgeCount: graph.edgeCount,
        },
      },
    ],
  );
  return graph;
}

function assertIssuerMatchesRuntime(
  runtimeExecution: RuntimeExecutionRecord,
  issuerContext: ReturnType<typeof GraphEvidenceIssuerContextSchema.parse>,
): void {
  const mismatches = [
    ["tenantId", runtimeExecution.tenantId, issuerContext.tenantId],
    ["organizationId", runtimeExecution.organizationId, issuerContext.organizationId],
    ["principalIntentRef", runtimeExecution.principalIntentRef, issuerContext.principalIntentRef],
    ["principalId", runtimeExecution.principalId, issuerContext.principalId],
    ["agentId", runtimeExecution.agentId, issuerContext.agentId],
    ["runId", runtimeExecution.runId, issuerContext.runId],
    ["runtimeAdapterId", runtimeExecution.runtimeAdapterId, issuerContext.runtimeAdapterId],
  ].filter(([, runtimeValue, issuerValue]) => runtimeValue !== issuerValue);
  if (mismatches.length > 0) {
    throw new HandshakeProtocolError(
      "generated_execution_graph_issuer_scope_mismatch",
      "Generated execution graph issuer context must match the runtime execution scope.",
      409,
    );
  }
}

async function assertNonceUnused(
  store: ProtocolStore,
  runtimeExecution: RuntimeExecutionRecord,
  graphNonce: string,
): Promise<void> {
  const graphs = await store.listRecordsByType<GeneratedExecutionGraph>("generated_execution_graph", {
    tenantId: runtimeExecution.tenantId,
    organizationId: runtimeExecution.organizationId,
  });
  const reused = graphs.some(
    (record) =>
      record.payload.runtimeExecutionId === runtimeExecution.runtimeExecutionId &&
      record.payload.graphNonce === graphNonce,
  );
  if (reused) {
    throw new HandshakeProtocolError(
      "generated_execution_graph_nonce_replay",
      "Generated execution graph nonce was already used for this runtime execution.",
      409,
    );
  }
}

async function buildGraphCoverage(input: ReturnType<typeof CreateGeneratedExecutionGraphInputSchema.parse>): Promise<{
  nodes: GeneratedExecutionNode[];
  terminalReasonCodes: string[];
  coverageStatus: GeneratedExecutionCoverageStatus;
  graphByteSize: number;
}> {
  const terminalReasonCodes: string[] = [];
  const nodeIds = new Set<string>();
  for (const node of input.nodes) {
    if (nodeIds.has(node.nodeId)) {
      throw new HandshakeProtocolError(
        "generated_execution_graph_duplicate_node_id",
        "Generated execution graph node ids must be unique.",
        422,
      );
    }
    nodeIds.add(node.nodeId);
  }
  for (const nodeId of input.entryNodeIds) assertKnownNode(nodeIds, nodeId, "entryNodeIds");
  for (const edge of input.edges) {
    assertKnownNode(nodeIds, edge.fromNodeId, "edge.fromNodeId");
    assertKnownNode(nodeIds, edge.toNodeId, "edge.toNodeId");
  }

  const nodes = await Promise.all(
    input.nodes.map(async (node) =>
      GeneratedExecutionNodeSchema.parse({
        ...node,
        nodeDigest: await digestCanonical(node as JsonValue),
      }),
    ),
  );
  const graphByteSize = new TextEncoder().encode(JSON.stringify({ ...input, nodes })).byteLength;
  const observedDepth = graphDepth(input.entryNodeIds, input.edges);
  if (input.nodes.length === 0) terminalReasonCodes.push("generated_execution_graph_empty");
  if (input.entryNodeIds.length === 0) terminalReasonCodes.push("generated_execution_graph_missing_entry_node");
  if (observedDepth.cycleDetected) terminalReasonCodes.push("generated_execution_graph_cycle_detected");
  if (input.nodes.length > input.maxNodeCount) terminalReasonCodes.push("generated_execution_graph_node_limit_exceeded");
  if (input.edges.length > input.maxEdgeCount) terminalReasonCodes.push("generated_execution_graph_edge_limit_exceeded");
  if (observedDepth.depth > input.maxDepth) terminalReasonCodes.push("generated_execution_graph_depth_limit_exceeded");
  if (graphByteSize > input.maxGraphByteSize) terminalReasonCodes.push("generated_execution_graph_byte_limit_exceeded");
  if (input.truncationStatus !== "complete") terminalReasonCodes.push(truncationReason(input.truncationStatus));

  for (const node of nodes) terminalReasonCodes.push(...reasonCodesForNode(node));
  return {
    nodes,
    terminalReasonCodes: [...new Set(terminalReasonCodes)],
    coverageStatus: coverageStatusForGraph(nodes, terminalReasonCodes),
    graphByteSize,
  };
}

function assertKnownNode(nodeIds: Set<string>, nodeId: string, field: string): void {
  if (nodeIds.has(nodeId)) return;
  throw new HandshakeProtocolError(
    "generated_execution_graph_unknown_node_ref",
    `Generated execution graph ${field} references an unknown node id.`,
    422,
  );
}

function reasonCodesForNode(node: GeneratedExecutionNode): string[] {
  const reasonCodes = [...node.unsupportedReasonCodes];
  if (node.nodeKind === "unknown") reasonCodes.push("generated_execution_node_kind_unknown");
  if (node.rawSecretMaterialDetected) reasonCodes.push("generated_execution_node_raw_secret_material");
  if (node.argvRedactionStatus === "raw_material_present") reasonCodes.push("generated_execution_node_raw_argv_material");
  if (node.stdinRedactionStatus === "raw_material_present") reasonCodes.push("generated_execution_node_raw_stdin_material");
  reasonCodes.push(...classificationReasonCodes(node.classification));
  reasonCodes.push(...commandRiskReasonCodes(node.commandRiskClassifierPosture));
  return reasonCodes;
}

function classificationReasonCodes(classification: GeneratedExecutionNodeClassification): string[] {
  switch (classification) {
    case "candidate_action_eligible":
    case "read_only":
    case "nonconsequential":
      return [];
    case "bypass_risk":
      return ["generated_execution_node_bypass_risk"];
    case "hidden_trigger":
      return ["generated_execution_node_hidden_trigger"];
    case "observer_only":
      return ["generated_execution_node_observer_only"];
    case "unsupported":
      return ["generated_execution_node_unsupported"];
    case "ambiguous":
      return ["generated_execution_node_ambiguous"];
  }
}

function commandRiskReasonCodes(posture: CommandRiskClassifierPosture): string[] {
  switch (posture) {
    case "absent":
    case "advisory_allow":
    case "advisory_no_match":
      return [];
    case "deny":
      return ["generated_execution_command_risk_denied"];
    case "warn":
      return ["generated_execution_command_risk_warned"];
    case "allowlist":
      return ["generated_execution_command_risk_allowlist"];
    case "allow_once":
      return ["generated_execution_command_risk_allow_once"];
    case "bypass_detected":
      return ["generated_execution_command_risk_bypass_detected"];
    case "fail_open":
      return ["generated_execution_command_risk_fail_open"];
    case "skipped":
      return ["generated_execution_command_risk_skipped"];
    case "unknown":
      return ["generated_execution_command_risk_unknown"];
  }
}

function coverageStatusForGraph(
  nodes: GeneratedExecutionNode[],
  terminalReasonCodes: string[],
): GeneratedExecutionCoverageStatus {
  const reasonText = terminalReasonCodes.join(" ");
  if (reasonText.includes("bypass")) return "contains_bypass_risk";
  if (
    reasonText.includes("raw_secret") ||
    reasonText.includes("raw_argv") ||
    reasonText.includes("raw_stdin") ||
    reasonText.includes("denied") ||
    reasonText.includes("warned") ||
    reasonText.includes("allowlist") ||
    reasonText.includes("allow_once")
  ) {
    return "contains_refusal";
  }
  if (reasonText.includes("unsupported") || reasonText.includes("ambiguous")) {
    return "unsupported_or_ambiguous";
  }
  if (
    terminalReasonCodes.length > 0 ||
    nodes.some((node) => node.classification === "hidden_trigger" || node.classification === "observer_only")
  ) {
    return "contains_coverage_gap";
  }
  if (nodes.length > 0 && nodes.every((node) => node.classification === "read_only" || node.classification === "nonconsequential")) {
    return "nonconsequential_only";
  }
  if (
    nodes.length > 0 &&
    nodes.some((node) => node.classification === "candidate_action_eligible") &&
    nodes.every((node) =>
      ["candidate_action_eligible", "read_only", "nonconsequential"].includes(node.classification),
    )
  ) {
    return "fully_covered_no_unsupported_nodes";
  }
  return "unknown";
}

function truncationReason(truncationStatus: GraphTruncationStatus): string {
  switch (truncationStatus) {
    case "complete":
      return "generated_execution_graph_complete";
    case "truncated":
      return "generated_execution_graph_truncated";
    case "over_limit":
      return "generated_execution_graph_over_limit";
    case "unknown":
      return "generated_execution_graph_truncation_unknown";
  }
}

function graphDepth(
  entryNodeIds: string[],
  edges: { fromNodeId: string; toNodeId: string }[],
): { depth: number; cycleDetected: boolean } {
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    adjacency.set(edge.fromNodeId, [...(adjacency.get(edge.fromNodeId) ?? []), edge.toNodeId]);
  }
  let maxDepth = entryNodeIds.length > 0 ? 1 : 0;
  let cycleDetected = false;
  const visit = (nodeId: string, depth: number, path: Set<string>) => {
    maxDepth = Math.max(maxDepth, depth);
    if (path.has(nodeId)) {
      cycleDetected = true;
      return;
    }
    const nextPath = new Set(path);
    nextPath.add(nodeId);
    for (const nextNodeId of adjacency.get(nodeId) ?? []) visit(nextNodeId, depth + 1, nextPath);
  };
  for (const nodeId of entryNodeIds) visit(nodeId, 1, new Set());
  return { depth: maxDepth, cycleDetected };
}
