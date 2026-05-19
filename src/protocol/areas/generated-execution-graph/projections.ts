import {
  GeneratedGraphEvidenceProjectionSchema,
  type GeneratedExecutionGraph,
  type GeneratedExecutionNode,
  type GeneratedGraphEvidenceProjection,
  type GraphRedactionStatus,
} from "./types";

export function projectGeneratedGraphEvidence(graph: GeneratedExecutionGraph): GeneratedGraphEvidenceProjection {
  return GeneratedGraphEvidenceProjectionSchema.parse({
    graphRef: graph.generatedExecutionGraphId,
    runtimeExecutionRef: graph.runtimeExecutionId,
    executionBlockDigest: graph.executionBlockDigest,
    coverageStatus: graph.coverageStatus,
    terminalReasonCodes: graph.terminalReasonCodes,
    contractableNodeRefs: graph.nodes.filter(isContractableNode).map(nodeProjectionRef),
    refusedNodeRefs: graph.nodes.filter((node) => !isContractableNode(node)).map(nodeProjectionRef),
    catalogDigest: graph.catalogSnapshotDigest,
    gatewayRegistryDigest: graph.gatewayRegistrySnapshotDigest,
    redactionPosture: aggregateRedactionPosture(graph.nodes),
    graphDigest: graph.graphDigest,
  });
}

function isContractableNode(node: GeneratedExecutionNode): boolean {
  return node.classification === "candidate_action_eligible";
}

function nodeProjectionRef(node: GeneratedExecutionNode) {
  return {
    nodeId: node.nodeId,
    nodeDigest: node.nodeDigest,
    classification: node.classification,
    actionTypeId: node.actionTypeId,
    gatewayRegistryEntryId: node.gatewayRegistryEntryId,
    nodeGatewayBindingDigest: node.nodeGatewayBindingDigest,
    unsupportedReasonCodes: node.unsupportedReasonCodes,
  };
}

function aggregateRedactionPosture(nodes: GeneratedExecutionNode[]): GraphRedactionStatus {
  if (nodes.some((node) => node.rawSecretMaterialDetected)) return "raw_material_present";
  const statuses = nodes.flatMap((node) => [node.argvRedactionStatus, node.stdinRedactionStatus]);
  if (statuses.some((status) => status === "raw_material_present")) return "raw_material_present";
  if (statuses.some((status) => status === "unknown")) return "unknown";
  if (statuses.some((status) => status === "secret_refs_only")) return "secret_refs_only";
  if (statuses.length > 0 && statuses.every((status) => status === "digest_only")) return "digest_only";
  return "redacted";
}
