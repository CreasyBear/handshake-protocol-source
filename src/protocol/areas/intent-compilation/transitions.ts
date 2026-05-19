import { digestCanonical } from "../../foundation/canonical";
import type { ActionType, GatewayRegistryEntry, OperatingEnvelope, ToolCapability } from "../catalog-envelope";
import type { GeneratedExecutionGraph } from "../generated-execution-graph";
import { createId, nowIso } from "../../foundation/ids";
import { CompileIntentInputSchema, type CompileIntentInput } from "./types";
import type { ProtocolRecorder } from "../../events/records";
import type { RuntimeExecutionRecord } from "../runtime-evidence";
import {
  CandidateActionSchema,
  IntentCompilationRecordSchema,
  PROTOCOL_VERSION,
  type CandidateAction,
  type IntentCompilationRecord,
  type JsonValue,
} from "./types";
import type { ProtocolStore, StoredProtocolRecord } from "../../store/port";
import { deriveCandidateDecision, type CandidateDecision } from "./candidate-decision";

type ParsedCompileIntentInput = ReturnType<typeof CompileIntentInputSchema.parse>;

type IntentCompilationContext = {
  input: ParsedCompileIntentInput;
  createdAt: string;
  paramsDigest: `sha256:${string}`;
  toolRecord: StoredProtocolRecord<ToolCapability> | null;
  actionTypeRecord: StoredProtocolRecord<ActionType> | null;
  gatewayRecord: StoredProtocolRecord<GatewayRegistryEntry> | null;
  envelopeRecord: StoredProtocolRecord<OperatingEnvelope> | null;
  runtimeExecutionRecord: StoredProtocolRecord<RuntimeExecutionRecord> | null;
  generatedExecutionGraphRecord: StoredProtocolRecord<GeneratedExecutionGraph> | null;
  tool: ToolCapability | null;
  actionType: ActionType | null;
  gateway: GatewayRegistryEntry | null;
  envelope: OperatingEnvelope | null;
  runtimeExecution: RuntimeExecutionRecord | null;
  generatedExecutionGraph: GeneratedExecutionGraph | null;
};

export async function compileIntent(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  inputValue: CompileIntentInput,
): Promise<IntentCompilationRecord> {
  const input = CompileIntentInputSchema.parse(inputValue);
  const context = await getIntentCompilationContext(store, input);
  const decision = deriveCandidateDecision(context);
  const candidateAction = await buildCandidateAction(context, decision);
  const record = buildIntentCompilationRecord(context, decision, candidateAction);
  await commitIntentCompilation(recorder, context, record);
  return record;
}

async function getIntentCompilationContext(
  store: ProtocolStore,
  input: ParsedCompileIntentInput,
): Promise<IntentCompilationContext> {
  const createdAt = nowIso();
  const [
    toolRecord,
    actionTypeRecord,
    gatewayRecord,
    envelopeRecord,
    runtimeExecutionRecord,
    generatedExecutionGraphRecord,
  ] = await Promise.all([
    store.getRecord<ToolCapability>("tool_capability", input.candidate.toolCapabilityId),
    store.getRecord<ActionType>("action_type", input.candidate.actionTypeId),
    store.getRecord<GatewayRegistryEntry>("gateway_registry_entry", input.candidate.gatewayRegistryEntryId),
    store.getRecord<OperatingEnvelope>("operating_envelope", input.operatingEnvelopeId),
    input.runtimeExecutionId
      ? store.getRecord<RuntimeExecutionRecord>("runtime_execution", input.runtimeExecutionId)
      : Promise.resolve(null),
    input.generatedExecutionGraphId
      ? store.getRecord<GeneratedExecutionGraph>("generated_execution_graph", input.generatedExecutionGraphId)
      : Promise.resolve(null),
  ]);

  const tool = toolRecord?.payload ?? null;
  const actionType = actionTypeRecord?.payload ?? null;
  const gateway = gatewayRecord?.payload ?? null;
  const envelope = envelopeRecord?.payload ?? null;
  const runtimeExecution = runtimeExecutionRecord?.payload ?? null;
  const generatedExecutionGraph = generatedExecutionGraphRecord?.payload ?? null;
  const paramsDigest = await digestCanonical({
    parameters: input.candidate.parameters,
    secretRefs: input.candidate.secretRefs,
  });
  return {
    input,
    createdAt,
    paramsDigest,
    toolRecord,
    actionTypeRecord,
    gatewayRecord,
    envelopeRecord,
    runtimeExecutionRecord,
    generatedExecutionGraphRecord,
    tool,
    actionType,
    gateway,
    envelope,
    runtimeExecution,
    generatedExecutionGraph,
  };
}

async function buildCandidateAction(
  context: IntentCompilationContext,
  decision: CandidateDecision,
): Promise<CandidateAction> {
  const { input, paramsDigest, toolRecord, actionTypeRecord, gatewayRecord, envelopeRecord } = context;
  const { tool, actionType, gateway, runtimeExecution, generatedExecutionGraph } = context;
  const { generatedExecutionNode } = decision;
  const candidateActionId = createId("cand");
  const candidateBase = {
    candidateActionId,
    candidateStatus: decision.candidateStatus,
    candidateDigest: null,
    refusalReasonCodes: decision.refusalReasonCodes,
    toolCapabilityId: input.candidate.toolCapabilityId,
    toolCapabilityDigest: toolRecord?.canonicalDigest ?? null,
    toolCatalogVersion: tool?.toolCatalogVersion ?? null,
    actionTypeId: input.candidate.actionTypeId,
    actionTypeDigest: actionTypeRecord?.canonicalDigest ?? null,
    actionCatalogVersion: actionType?.actionCatalogVersion ?? null,
    gatewayRegistryEntryId: input.candidate.gatewayRegistryEntryId,
    gatewayRegistryDigest: gatewayRecord?.canonicalDigest ?? null,
    gatewayRegistryVersion: gateway?.gatewayRegistryVersion ?? null,
    operatingEnvelopeId: input.operatingEnvelopeId,
    operatingEnvelopeDigest: envelopeRecord?.canonicalDigest ?? null,
    actionClass: input.candidate.actionClass,
    gatewayId: input.candidate.gatewayId,
    resourceRef: input.candidate.resourceRef,
    sequenceNumber: input.candidate.sequenceNumber,
    requiredPriorActionContractIds: input.candidate.requiredPriorActionContractIds,
    recoveryRecommendationId: input.candidate.recoveryRecommendationId,
    parameters: input.candidate.parameters,
    paramsDigest,
    nonSecretParamsSummary: input.candidate.nonSecretParamsSummary,
    secretRefs: input.candidate.secretRefs,
    purposeCode: input.candidate.purposeCode,
    expectedSideEffectCodes: input.candidate.expectedSideEffectCodes,
    evidenceRefs: input.candidate.evidenceRefs,
    bounds: input.candidate.bounds,
    idempotencyKey: input.candidate.idempotencyKey,
    rollbackHint: input.candidate.rollbackHint,
    expiresAt: input.candidate.expiresAt,
    generatedCodeOrSpecRefs: input.generatedCodeOrSpecRefs,
    runtimeExecutionId: runtimeExecution?.runtimeExecutionId ?? null,
    runtimeExecutionDigest: runtimeExecution?.runtimeExecutionDigest ?? null,
    generatedExecutionGraphId: generatedExecutionGraph?.generatedExecutionGraphId ?? null,
    generatedExecutionGraphDigest: generatedExecutionGraph?.graphDigest ?? null,
    generatedExecutionCoverageStatus: generatedExecutionGraph?.coverageStatus ?? null,
    generatedExecutionNodeId: generatedExecutionNode?.nodeId ?? null,
    generatedExecutionNodeDigest: generatedExecutionNode?.nodeDigest ?? null,
    generatedExecutionCatalogSnapshotDigest: generatedExecutionGraph?.catalogSnapshotDigest ?? null,
    generatedExecutionGatewayRegistrySnapshotDigest: generatedExecutionGraph?.gatewayRegistrySnapshotDigest ?? null,
    generatedExecutionRegistryBindingSetDigest: generatedExecutionGraph?.registryBindingSetDigest ?? null,
    generatedExecutionNodeGatewayBindingDigest: generatedExecutionNode?.nodeGatewayBindingDigest ?? null,
  } satisfies CandidateAction;
  const candidateDigest =
    decision.candidateStatus === "contractable"
      ? await digestCanonical(candidateDigestMaterial(input, candidateBase))
      : null;
  return CandidateActionSchema.parse({ ...candidateBase, candidateDigest });
}

function buildIntentCompilationRecord(
  context: IntentCompilationContext,
  decision: CandidateDecision,
  candidateAction: CandidateAction,
): IntentCompilationRecord {
  const { input, createdAt, runtimeExecution } = context;
  return IntentCompilationRecordSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    createdAt,
    intentCompilationId: createId("icr"),
    principalIntentRef: input.principalIntentRef,
    principalId: input.principalId,
    agentId: input.agentId,
    runId: input.runId,
    runtimeAdapterId: input.runtimeAdapterId,
    operatingEnvelopeId: input.operatingEnvelopeId,
    toolCatalogRef: input.toolCatalogRef,
    actionCatalogRef: input.actionCatalogRef,
    gatewayRegistryRef: input.gatewayRegistryRef,
    runtimeExecutionId: runtimeExecution?.runtimeExecutionId ?? null,
    runtimeExecutionDigest: runtimeExecution?.runtimeExecutionDigest ?? null,
    generatedCodeOrSpecRefs: input.generatedCodeOrSpecRefs,
    declaredAssumptions: input.declaredAssumptions,
    uncertaintyMarkers: decision.uncertaintyMarkers,
    candidateAction,
    candidateActionContractRefs: [],
    rejectedCandidateRefs: decision.candidateStatus === "rejected" ? [candidateAction.candidateActionId] : [],
    overreachReasonCodes: decision.overreachReasonCodes,
    requiredEvidenceRefs: input.requiredEvidenceRefs,
    compilerVersion: input.compilerVersion,
  });
}

async function commitIntentCompilation(
  recorder: ProtocolRecorder,
  context: IntentCompilationContext,
  record: IntentCompilationRecord,
): Promise<void> {
  await recorder.commitRecordsWithEvents(
    [{ objectType: "intent_compilation", payload: record }],
    [
      {
        source: record,
        eventType: "intent_compiled",
        objectRefs: context.runtimeExecution
          ? [
              record.intentCompilationId,
              context.runtimeExecution.runtimeExecutionId,
              context.runtimeExecution.runtimeExecutionDigest,
            ]
          : [record.intentCompilationId],
        payload: {
          uncertaintyMarkers: record.uncertaintyMarkers,
          overreachReasonCodes: record.overreachReasonCodes,
        },
      },
    ],
  );
}

function candidateDigestMaterial(input: ParsedCompileIntentInput, candidate: CandidateAction): JsonValue {
  return {
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    principalIntentRef: input.principalIntentRef,
    principalId: input.principalId,
    agentId: input.agentId,
    runId: input.runId,
    runtimeAdapterId: input.runtimeAdapterId,
    compilerVersion: input.compilerVersion,
    runtimeExecutionId: input.runtimeExecutionId,
    runtimeExecutionDigest: candidate.runtimeExecutionDigest,
    candidateAction: { ...candidate, candidateDigest: null },
  };
}
