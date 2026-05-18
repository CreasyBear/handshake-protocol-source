import { digestCanonical } from "../canonical";
import type { ActionType, GatewayRegistryEntry, OperatingEnvelope, ToolCapability } from "../catalog-envelope";
import { HandshakeProtocolError } from "../errors";
import { createId, nowIso } from "../ids";
import { CompileIntentInputSchema, type CompileIntentInput } from "./types";
import type { ProtocolRecorder } from "../records";
import type { RuntimeExecutionRecord } from "../runtime-evidence";
import {
  CandidateActionSchema,
  IntentCompilationRecordSchema,
  PROTOCOL_VERSION,
  type CandidateAction,
  type IntentCompilationRecord,
  type JsonValue,
} from "./types";
import type { ProtocolStore } from "../store-port";

export async function compileIntent(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  inputValue: CompileIntentInput,
): Promise<IntentCompilationRecord> {
  const input = CompileIntentInputSchema.parse(inputValue);
  const createdAt = nowIso();
  const uncertaintyMarkers: string[] = [];
  const overreachReasonCodes: string[] = [];

  const [toolRecord, actionTypeRecord, gatewayRecord, envelopeRecord, runtimeExecutionRecord] = await Promise.all([
    store.getRecord<ToolCapability>("tool_capability", input.candidate.toolCapabilityId),
    store.getRecord<ActionType>("action_type", input.candidate.actionTypeId),
    store.getRecord<GatewayRegistryEntry>("gateway_registry_entry", input.candidate.gatewayRegistryEntryId),
    store.getRecord<OperatingEnvelope>("operating_envelope", input.operatingEnvelopeId),
    input.runtimeExecutionId
      ? store.getRecord<RuntimeExecutionRecord>("runtime_execution", input.runtimeExecutionId)
      : Promise.resolve(null),
  ]);

  const tool = toolRecord?.payload ?? null;
  const actionType = actionTypeRecord?.payload ?? null;
  const gateway = gatewayRecord?.payload ?? null;
  const envelope = envelopeRecord?.payload ?? null;
  const runtimeExecution = runtimeExecutionRecord?.payload ?? null;

  if (!tool) uncertaintyMarkers.push("unknown_tool_capability");
  if (!actionType) uncertaintyMarkers.push("unknown_action_type");
  if (!gateway) uncertaintyMarkers.push("unknown_gateway_registry_entry");
  if (!envelope) uncertaintyMarkers.push("unknown_operating_envelope");
  if (input.runtimeExecutionId && !runtimeExecution) uncertaintyMarkers.push("unknown_runtime_execution");
  if (runtimeExecution) {
    if (
      runtimeExecution.tenantId !== input.tenantId ||
      runtimeExecution.organizationId !== input.organizationId ||
      runtimeExecution.principalIntentRef !== input.principalIntentRef ||
      runtimeExecution.principalId !== input.principalId ||
      runtimeExecution.agentId !== input.agentId ||
      runtimeExecution.runId !== input.runId ||
      runtimeExecution.runtimeAdapterId !== input.runtimeAdapterId
    ) {
      overreachReasonCodes.push("runtime_execution_scope_mismatch");
    }
    if (runtimeExecution.dynamicToolConstructionDetected) {
      overreachReasonCodes.push("runtime_dynamic_tool_construction_detected");
    }
    if (runtimeExecution.unobservedRegionRefs.length > 0) {
      overreachReasonCodes.push("runtime_unobserved_regions_present");
    }
    if (runtimeExecution.refusalReasonCodes.length > 0) {
      overreachReasonCodes.push(...runtimeExecution.refusalReasonCodes.map((code) => `runtime_${code}`));
    }
  }
  if (tool?.readWriteClassification === "consequential" && tool.wrapperStatus !== "wrapped") {
    overreachReasonCodes.push("unwrapped_consequential_tool");
  }
  if (tool) assertSecretSafeCandidateInput(tool, input.candidate.parameters, input.candidate.nonSecretParamsSummary, input.candidate.secretRefs);
  if (tool && tool.runtimeAdapterId !== input.runtimeAdapterId) {
    overreachReasonCodes.push("tool_runtime_adapter_mismatch");
  }
  if (actionType && actionType.actionClass !== input.candidate.actionClass) {
    overreachReasonCodes.push("action_class_mismatch");
  }
  if (gateway && gateway.gatewayId !== input.candidate.gatewayId) {
    overreachReasonCodes.push("gateway_mismatch");
  }
  if (gateway && actionType && gateway.protectedSurfaceKind !== actionType.protectedSurfaceKind) {
    overreachReasonCodes.push("protected_surface_kind_mismatch");
  }
  if (gateway && actionType && !gateway.acceptedActionCatalogVersions.includes(actionType.actionCatalogVersion)) {
    overreachReasonCodes.push("action_catalog_version_not_accepted");
  }
  if (envelope) {
    if (envelope.principalId !== input.principalId || envelope.agentId !== input.agentId) {
      overreachReasonCodes.push("envelope_actor_mismatch");
    }
    if (!envelope.allowedActionClasses.includes(input.candidate.actionClass)) {
      overreachReasonCodes.push("envelope_action_class_not_allowed");
    }
    if (!envelope.allowedGateways.includes(input.candidate.gatewayId)) {
      overreachReasonCodes.push("envelope_gateway_not_allowed");
    }
    if (!envelope.allowedResources.includes(input.candidate.resourceRef)) {
      overreachReasonCodes.push("envelope_resource_not_allowed");
    }
    if (envelope.revokedAt !== null) overreachReasonCodes.push("envelope_revoked");
    if (Date.parse(envelope.expiresAt) <= Date.parse(createdAt)) overreachReasonCodes.push("envelope_expired");
  }
  if (
    [tool, actionType, gateway, envelope].some(
      (record) =>
        record &&
        (record.tenantId !== input.tenantId || record.organizationId !== input.organizationId),
    )
  ) {
    overreachReasonCodes.push("durable_record_scope_mismatch");
  }

  const refusalReasonCodes = [...uncertaintyMarkers, ...overreachReasonCodes];
  const candidateStatus = refusalReasonCodes.length === 0 ? "contractable" : "rejected";
  const candidateActionId = createId("cand");
  const paramsDigest = await digestCanonical({
    parameters: input.candidate.parameters,
    secretRefs: input.candidate.secretRefs,
  });
  const candidateBase = {
    candidateActionId,
    candidateStatus,
    candidateDigest: null,
    refusalReasonCodes,
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
  } satisfies CandidateAction;
  const candidateDigest =
    candidateStatus === "contractable"
      ? await digestCanonical(candidateDigestMaterial(input, candidateBase))
      : null;
  const candidateAction = CandidateActionSchema.parse({ ...candidateBase, candidateDigest });

  const record = IntentCompilationRecordSchema.parse({
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
    uncertaintyMarkers,
    candidateAction,
    candidateActionContractRefs: [],
    rejectedCandidateRefs: candidateStatus === "rejected" ? [candidateAction.candidateActionId] : [],
    overreachReasonCodes,
    requiredEvidenceRefs: input.requiredEvidenceRefs,
    compilerVersion: input.compilerVersion,
  });

  await recorder.commitRecordsWithEvents(
    [{ objectType: "intent_compilation", payload: record }],
    [
      {
        source: record,
        eventType: "intent_compiled",
        objectRefs: runtimeExecution
          ? [record.intentCompilationId, runtimeExecution.runtimeExecutionId, runtimeExecution.runtimeExecutionDigest]
          : [record.intentCompilationId],
        payload: { uncertaintyMarkers, overreachReasonCodes },
      },
    ],
  );
  return record;
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

function candidateDigestMaterial(input: ReturnType<typeof CompileIntentInputSchema.parse>, candidate: CandidateAction): JsonValue {
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
