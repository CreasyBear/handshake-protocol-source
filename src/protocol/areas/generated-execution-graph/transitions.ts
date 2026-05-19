import { digestCanonical } from "../../foundation/canonical";
import { HandshakeProtocolError } from "../../foundation/errors";
import { createId, nowIso } from "../../foundation/ids";
import type { ProtocolRecorder } from "../../events/records";
import type { RuntimeExecutionRecord } from "../runtime-evidence";
import type { ProtocolStore } from "../../store/port";
import {
  CreateGeneratedExecutionGraphInputSchema,
  GraphEvidenceIssuerContextSchema,
  type CreateGeneratedExecutionGraphInput,
  type GraphEvidenceIssuerContext,
} from "./types";
import { GeneratedExecutionGraphSchema, type GeneratedExecutionGraph } from "./types";
import { PROTOCOL_VERSION, type JsonValue } from "../../foundation/schema-core";
import { deriveGraphCoverage, type GraphCoverageEvaluation } from "./coverage";

type ParsedGeneratedExecutionGraphInput = ReturnType<typeof CreateGeneratedExecutionGraphInputSchema.parse>;
type ParsedGraphEvidenceIssuerContext = ReturnType<typeof GraphEvidenceIssuerContextSchema.parse>;

type GraphEvidenceContext = {
  input: ParsedGeneratedExecutionGraphInput;
  issuerContext: ParsedGraphEvidenceIssuerContext;
  runtimeExecution: RuntimeExecutionRecord;
};

export async function createGeneratedExecutionGraph(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  inputValue: CreateGeneratedExecutionGraphInput,
  issuerContextValue: GraphEvidenceIssuerContext,
): Promise<GeneratedExecutionGraph> {
  const evidenceContext = await getGraphEvidenceContext(store, recorder, inputValue, issuerContextValue);
  const coverage = await deriveGraphCoverage(evidenceContext.input);
  const graph = await buildGeneratedExecutionGraph(evidenceContext, coverage);
  await commitGeneratedExecutionGraph(recorder, graph);
  return graph;
}

async function getGraphEvidenceContext(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  inputValue: CreateGeneratedExecutionGraphInput,
  issuerContextValue: GraphEvidenceIssuerContext,
): Promise<GraphEvidenceContext> {
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
  return { input, issuerContext, runtimeExecution };
}

async function buildGeneratedExecutionGraph(
  context: GraphEvidenceContext,
  coverage: GraphCoverageEvaluation,
): Promise<GeneratedExecutionGraph> {
  const createdAt = nowIso();
  const graphInputDigest = await buildGraphInputDigest(context);
  const generatedExecutionGraphId = createId("geg");
  const graphDigestMaterial = buildGraphDigestMaterial(context, coverage, graphInputDigest);
  const graphDigest = await digestCanonical(graphDigestMaterial);
  const { input, issuerContext, runtimeExecution } = context;
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
    coverageStatus: coverage.coverageStatus,
    terminalReasonCodes: coverage.terminalReasonCodes,
    entryNodeIds: input.entryNodeIds,
    edges: input.edges,
    nodeCount: coverage.nodes.length,
    edgeCount: input.edges.length,
    maxNodeCount: input.maxNodeCount,
    maxEdgeCount: input.maxEdgeCount,
    maxDepth: input.maxDepth,
    graphByteSize: coverage.graphByteSize,
    maxGraphByteSize: input.maxGraphByteSize,
    truncationStatus: input.truncationStatus,
    catalogSnapshotDigest: input.catalogSnapshotDigest,
    gatewayRegistrySnapshotDigest: input.gatewayRegistrySnapshotDigest,
    registryBindingSetDigest: input.registryBindingSetDigest,
    nodes: coverage.nodes,
  });
  return graph;
}

async function commitGeneratedExecutionGraph(
  recorder: ProtocolRecorder,
  graph: GeneratedExecutionGraph,
): Promise<void> {
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
}

async function buildGraphInputDigest(context: GraphEvidenceContext): Promise<`sha256:${string}`> {
  return digestCanonical({
    input: context.input,
    issuerContext: context.issuerContext,
    runtimeExecutionId: context.runtimeExecution.runtimeExecutionId,
    runtimeExecutionDigest: context.runtimeExecution.runtimeExecutionDigest,
  });
}

function buildGraphDigestMaterial(
  context: GraphEvidenceContext,
  coverage: GraphCoverageEvaluation,
  graphInputDigest: `sha256:${string}`,
): JsonValue {
  const { input, issuerContext, runtimeExecution } = context;
  return {
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
    coverageStatus: coverage.coverageStatus,
    terminalReasonCodes: coverage.terminalReasonCodes,
    entryNodeIds: input.entryNodeIds,
    edges: input.edges,
    nodeCount: coverage.nodes.length,
    edgeCount: input.edges.length,
    maxNodeCount: input.maxNodeCount,
    maxEdgeCount: input.maxEdgeCount,
    maxDepth: input.maxDepth,
    graphByteSize: coverage.graphByteSize,
    maxGraphByteSize: input.maxGraphByteSize,
    truncationStatus: input.truncationStatus,
    catalogSnapshotDigest: input.catalogSnapshotDigest,
    gatewayRegistrySnapshotDigest: input.gatewayRegistrySnapshotDigest,
    registryBindingSetDigest: input.registryBindingSetDigest,
    nodes: coverage.nodes,
  } satisfies JsonValue;
}

function assertIssuerMatchesRuntime(
  runtimeExecution: RuntimeExecutionRecord,
  issuerContext: ParsedGraphEvidenceIssuerContext,
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
