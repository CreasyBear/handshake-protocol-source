import type { ActionType, GatewayRegistryEntry, OperatingEnvelope, ToolCapability } from "../catalog-envelope";
import { HandshakeProtocolError } from "../../foundation/errors";
import type { GeneratedExecutionGraph, GeneratedExecutionNode } from "../generated-execution-graph";
import type { RuntimeExecutionRecord } from "../runtime-evidence";
import type { ToolCallDraft } from "../tool-call-draft";
import type { CandidateActionStatus, CompileIntentInputSchema, JsonValue } from "./types";

type ParsedCompileIntentInput = ReturnType<typeof CompileIntentInputSchema.parse>;

export type IntentCompilationDecisionContext = {
  input: ParsedCompileIntentInput;
  createdAt: string;
  paramsDigest: `sha256:${string}`;
  tool: ToolCapability | null;
  actionType: ActionType | null;
  gateway: GatewayRegistryEntry | null;
  envelope: OperatingEnvelope | null;
  runtimeExecution: RuntimeExecutionRecord | null;
  generatedExecutionGraph: GeneratedExecutionGraph | null;
  toolCallDraft: ToolCallDraft | null;
};

export type CandidateDecision = {
  uncertaintyMarkers: string[];
  overreachReasonCodes: string[];
  refusalReasonCodes: string[];
  candidateStatus: CandidateActionStatus;
  generatedExecutionNode: GeneratedExecutionNode | null;
};

export function deriveCandidateDecision(context: IntentCompilationDecisionContext): CandidateDecision {
  const uncertaintyMarkers = deriveUncertaintyMarkers(context);
  const overreachReasonCodes = [
    ...deriveRuntimeExecutionReasonCodes(context),
    ...deriveToolCallDraftReasonCodes(context),
    ...deriveCatalogAndEnvelopeReasonCodes(context),
  ];
  if (requiresMissingGeneratedExecutionGraphRefusal(context)) {
    overreachReasonCodes.push("generated_execution_graph_missing");
  }
  const generatedExecutionCoverage = context.generatedExecutionGraph
    ? deriveGeneratedExecutionCoverage({
        input: context.input,
        runtimeExecution: context.runtimeExecution,
        generatedExecutionGraph: context.generatedExecutionGraph,
        paramsDigest: context.paramsDigest,
      })
    : { node: null, reasonCodes: [] };
  overreachReasonCodes.push(...generatedExecutionCoverage.reasonCodes);
  const refusalReasonCodes = [...uncertaintyMarkers, ...overreachReasonCodes];
  return {
    uncertaintyMarkers,
    overreachReasonCodes,
    refusalReasonCodes,
    candidateStatus: refusalReasonCodes.length === 0 ? "contractable" : "rejected",
    generatedExecutionNode: generatedExecutionCoverage.node,
  };
}

function deriveUncertaintyMarkers(context: IntentCompilationDecisionContext): string[] {
  const { input, tool, actionType, gateway, envelope, runtimeExecution, generatedExecutionGraph, toolCallDraft } =
    context;
  const markers: string[] = [];
  if (!tool) markers.push("unknown_tool_capability");
  if (!actionType) markers.push("unknown_action_type");
  if (!gateway) markers.push("unknown_gateway_registry_entry");
  if (!envelope) markers.push("unknown_operating_envelope");
  if (input.runtimeExecutionId && !runtimeExecution) markers.push("unknown_runtime_execution");
  if (input.generatedExecutionGraphId && !generatedExecutionGraph) markers.push("unknown_generated_execution_graph");
  if (input.toolCallDraftId && !toolCallDraft) markers.push("unknown_tool_call_draft");
  return markers;
}

function deriveRuntimeExecutionReasonCodes(context: IntentCompilationDecisionContext): string[] {
  const { input, runtimeExecution } = context;
  if (!runtimeExecution) return [];
  const runtimeOverreachCodes: string[] = [];
  if (
    runtimeExecution.tenantId !== input.tenantId ||
    runtimeExecution.organizationId !== input.organizationId ||
    runtimeExecution.principalIntentRef !== input.principalIntentRef ||
    runtimeExecution.principalId !== input.principalId ||
    runtimeExecution.agentId !== input.agentId ||
    runtimeExecution.runId !== input.runId ||
    runtimeExecution.runtimeAdapterId !== input.runtimeAdapterId
  ) {
    runtimeOverreachCodes.push("runtime_execution_scope_mismatch");
  }
  if (runtimeExecution.dynamicToolConstructionDetected) {
    runtimeOverreachCodes.push("runtime_dynamic_tool_construction_detected");
  }
  if (runtimeExecution.unobservedRegionRefs.length > 0) {
    runtimeOverreachCodes.push("runtime_unobserved_regions_present");
  }
  runtimeOverreachCodes.push(...runtimeExecution.refusalReasonCodes.map((code) => `runtime_${code}`));
  return runtimeOverreachCodes;
}

function deriveToolCallDraftReasonCodes(context: IntentCompilationDecisionContext): string[] {
  const { input, createdAt, paramsDigest, toolCallDraft } = context;
  const draftReasonCodes: string[] = [];
  if ((input.generatedExecutionGraphId || input.generatedExecutionNodeId) && !input.toolCallDraftId) {
    draftReasonCodes.push("tool_call_draft_missing");
  }
  if (!toolCallDraft) return draftReasonCodes;
  if (toolCallDraft.draftState !== "finalized") draftReasonCodes.push("tool_call_draft_not_finalized");
  if (Date.parse(toolCallDraft.expiresAt) <= Date.parse(createdAt)) draftReasonCodes.push("tool_call_draft_stale");
  if (
    toolCallDraft.tenantId !== input.tenantId ||
    toolCallDraft.organizationId !== input.organizationId ||
    toolCallDraft.runtimeExecutionId !== input.runtimeExecutionId ||
    toolCallDraft.generatedExecutionGraphId !== input.generatedExecutionGraphId ||
    toolCallDraft.generatedExecutionNodeId !== input.generatedExecutionNodeId ||
    toolCallDraft.toolCapabilityId !== input.candidate.toolCapabilityId ||
    toolCallDraft.actionTypeId !== input.candidate.actionTypeId ||
    toolCallDraft.gatewayRegistryEntryId !== input.candidate.gatewayRegistryEntryId ||
    toolCallDraft.actionClass !== input.candidate.actionClass ||
    toolCallDraft.gatewayId !== input.candidate.gatewayId ||
    toolCallDraft.resourceRef !== input.candidate.resourceRef
  ) {
    draftReasonCodes.push("tool_call_draft_binding_mismatch");
  }
  if (toolCallDraft.paramsDigest !== paramsDigest) draftReasonCodes.push("tool_call_draft_params_digest_mismatch");
  return draftReasonCodes;
}

function deriveCatalogAndEnvelopeReasonCodes(context: IntentCompilationDecisionContext): string[] {
  const { input, createdAt, tool, actionType, gateway, envelope } = context;
  const catalogOverreachCodes: string[] = [];
  if (tool?.readWriteClassification === "consequential" && tool.wrapperStatus !== "wrapped") {
    catalogOverreachCodes.push("unwrapped_consequential_tool");
  }
  if (tool) {
    assertSecretSafeCandidateInput(
      tool,
      input.candidate.parameters,
      input.candidate.nonSecretParamsSummary,
      input.candidate.secretRefs,
    );
  }
  if (tool && tool.runtimeAdapterId !== input.runtimeAdapterId) {
    catalogOverreachCodes.push("tool_runtime_adapter_mismatch");
  }
  if (actionType && actionType.actionClass !== input.candidate.actionClass) {
    catalogOverreachCodes.push("action_class_mismatch");
  }
  if (gateway && gateway.gatewayId !== input.candidate.gatewayId) {
    catalogOverreachCodes.push("gateway_mismatch");
  }
  if (gateway && actionType && gateway.protectedSurfaceKind !== actionType.protectedSurfaceKind) {
    catalogOverreachCodes.push("protected_surface_kind_mismatch");
  }
  if (gateway && actionType && !gateway.acceptedActionCatalogVersions.includes(actionType.actionCatalogVersion)) {
    catalogOverreachCodes.push("action_catalog_version_not_accepted");
  }
  if (envelope) {
    catalogOverreachCodes.push(...deriveEnvelopeReasonCodes(input, envelope, createdAt));
  }
  if (durableRecordScopeMismatch(context)) {
    catalogOverreachCodes.push("durable_record_scope_mismatch");
  }
  return catalogOverreachCodes;
}

function deriveEnvelopeReasonCodes(
  input: ParsedCompileIntentInput,
  envelope: OperatingEnvelope,
  createdAt: string,
): string[] {
  const envelopeOverreachCodes: string[] = [];
  if (envelope.principalId !== input.principalId || envelope.agentId !== input.agentId) {
    envelopeOverreachCodes.push("envelope_actor_mismatch");
  }
  if (!envelope.allowedActionClasses.includes(input.candidate.actionClass)) {
    envelopeOverreachCodes.push("envelope_action_class_not_allowed");
  }
  if (!envelope.allowedGateways.includes(input.candidate.gatewayId)) {
    envelopeOverreachCodes.push("envelope_gateway_not_allowed");
  }
  if (!envelope.allowedResources.includes(input.candidate.resourceRef)) {
    envelopeOverreachCodes.push("envelope_resource_not_allowed");
  }
  if (envelope.revokedAt !== null) envelopeOverreachCodes.push("envelope_revoked");
  if (Date.parse(envelope.expiresAt) <= Date.parse(createdAt)) envelopeOverreachCodes.push("envelope_expired");
  return envelopeOverreachCodes;
}

function durableRecordScopeMismatch(context: IntentCompilationDecisionContext): boolean {
  const { input, tool, actionType, gateway, envelope } = context;
  return [tool, actionType, gateway, envelope].some(
    (record) => record && (record.tenantId !== input.tenantId || record.organizationId !== input.organizationId),
  );
}

function requiresMissingGeneratedExecutionGraphRefusal(context: IntentCompilationDecisionContext): boolean {
  return Boolean(
    context.runtimeExecution &&
    requiresGeneratedExecutionGraph(context.runtimeExecution.executionShape) &&
    !context.generatedExecutionGraph,
  );
}

function assertSecretSafeCandidateInput(
  tool: ToolCapability,
  parameters: Record<string, JsonValue>,
  nonSecretParamsSummary: Record<string, JsonValue>,
  secretRefs: Record<string, string>,
): void {
  const secretBearingFields = new Set(tool.secretBearingFields);
  for (const field of secretBearingFields) {
    if (Object.hasOwn(parameters, field) || Object.hasOwn(nonSecretParamsSummary, field)) {
      throw new HandshakeProtocolError(
        "secret_bearing_param_in_non_secret_params",
        `Secret-bearing parameter ${field} must be represented as a secretRef, not stored parameter material.`,
        422,
      );
    }
  }
  for (const field of Object.keys(secretRefs)) {
    if (!secretBearingFields.has(field)) {
      throw new HandshakeProtocolError(
        "undeclared_secret_ref",
        `Secret ref ${field} is not declared by the tool capability secretBearingFields.`,
        422,
      );
    }
  }
}

function requiresGeneratedExecutionGraph(executionShape: RuntimeExecutionRecord["executionShape"]): boolean {
  return (
    executionShape === "shell_exec_block" ||
    executionShape === "codemode_block" ||
    executionShape === "tool_dispatch_chain" ||
    executionShape === "generated_mcp_tool_chain"
  );
}

function deriveGeneratedExecutionCoverage(args: {
  input: ParsedCompileIntentInput;
  runtimeExecution: RuntimeExecutionRecord | null;
  generatedExecutionGraph: GeneratedExecutionGraph;
  paramsDigest: `sha256:${string}`;
}): { node: GeneratedExecutionNode | null; reasonCodes: string[] } {
  const { input, runtimeExecution, generatedExecutionGraph, paramsDigest } = args;
  const graphOverreachCodes: string[] = [];
  if (!runtimeExecution) {
    graphOverreachCodes.push("generated_execution_graph_without_runtime_execution");
    return { node: null, reasonCodes: graphOverreachCodes };
  }
  if (
    generatedExecutionGraph.tenantId !== input.tenantId ||
    generatedExecutionGraph.organizationId !== input.organizationId
  ) {
    graphOverreachCodes.push("generated_execution_graph_scope_mismatch");
  }
  if (
    generatedExecutionGraph.runtimeExecutionId !== runtimeExecution.runtimeExecutionId ||
    generatedExecutionGraph.runtimeExecutionDigest !== runtimeExecution.runtimeExecutionDigest ||
    generatedExecutionGraph.executionBlockDigest !== runtimeExecution.executionBlockDigest
  ) {
    graphOverreachCodes.push("generated_execution_graph_runtime_mismatch");
  }
  if (generatedExecutionGraph.coverageStatus !== "fully_covered_no_unsupported_nodes") {
    graphOverreachCodes.push("generated_execution_graph_not_contractable");
  }

  const requestedNodeId = input.generatedExecutionNodeId;
  if (!requestedNodeId) {
    graphOverreachCodes.push("generated_execution_node_missing");
    return { node: null, reasonCodes: graphOverreachCodes };
  }
  const node = generatedExecutionGraph.nodes.find((candidate) => candidate.nodeId === requestedNodeId) ?? null;
  if (!node) {
    graphOverreachCodes.push("generated_execution_node_missing");
    return { node: null, reasonCodes: graphOverreachCodes };
  }
  if (node.classification !== "candidate_action_eligible") {
    graphOverreachCodes.push("generated_execution_node_not_contractable");
  }
  if (!node.nodeGatewayBindingDigest) {
    graphOverreachCodes.push("generated_execution_node_gateway_binding_missing");
  }
  if (
    node.actionClass !== input.candidate.actionClass ||
    node.toolCapabilityId !== input.candidate.toolCapabilityId ||
    node.actionTypeId !== input.candidate.actionTypeId ||
    node.gatewayRegistryEntryId !== input.candidate.gatewayRegistryEntryId ||
    node.resourceRef !== input.candidate.resourceRef ||
    node.paramsDigest !== paramsDigest
  ) {
    graphOverreachCodes.push("generated_execution_node_binding_mismatch");
  }
  return { node, reasonCodes: graphOverreachCodes };
}
