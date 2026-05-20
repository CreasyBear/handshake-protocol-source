import { PROTOCOL_VERSION } from "../../foundation/schema-core";
import type { ActionType, GatewayRegistryEntry, OperatingEnvelope, ToolCapability } from "../catalog-envelope";
import type { ProtectedPathPosture } from "../protected-path-posture";
import type { Refusal } from "../refusal";
import {
  ProtectedActionChallengeSchema,
  ProtectedActionMetadataSchema,
  type ProtectedActionChallenge,
  type ProtectedActionMetadata,
} from "./types";

export function projectProtectedActionMetadata(input: {
  tool: ToolCapability;
  actionType: ActionType;
  gateway: GatewayRegistryEntry;
  envelope: OperatingEnvelope;
  protectedPathPosture?: ProtectedPathPosture | null;
  metadataId?: string;
  createdAt?: string;
}): ProtectedActionMetadata {
  return ProtectedActionMetadataSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: input.envelope.tenantId,
    organizationId: input.envelope.organizationId,
    createdAt: input.createdAt ?? input.envelope.createdAt,
    metadataId: input.metadataId ?? `metadata_${input.actionType.actionTypeId}_${input.gateway.gatewayRegistryEntryId}`,
    toolCapabilityId: input.tool.toolCapabilityId,
    actionTypeId: input.actionType.actionTypeId,
    gatewayRegistryEntryId: input.gateway.gatewayRegistryEntryId,
    operatingEnvelopeId: input.envelope.envelopeId,
    runtimeAdapterId: input.tool.runtimeAdapterId,
    actionClass: input.actionType.actionClass,
    protectedSurfaceKind: input.actionType.protectedSurfaceKind,
    gatewayId: input.gateway.gatewayId,
    gatewayPolicyVersion: input.gateway.gatewayPolicyVersion,
    gatewayEnforcementMode: input.gateway.enforcementMode,
    requiredProtectedPathState: input.envelope.requiredProtectedPathState,
    currentProtectedPathState: input.protectedPathPosture?.postureState ?? null,
    protectedPathPostureRef: input.protectedPathPosture?.protectedPathPostureId ?? null,
    resourceNamespaceRef: input.gateway.resourceNamespaceRef,
    allowedResources: input.envelope.allowedResources,
    requiredContractFields: input.actionType.requiredContractFields,
    canonicalParameterSchemaRef: input.actionType.canonicalParameterSchemaRef,
    allowedBoundsSchemaRef: input.actionType.allowedBoundsSchemaRef,
    inputSchemaRef: input.tool.inputSchemaRef,
    outputSchemaRef: input.tool.outputSchemaRef,
    requiredEvidenceTypes: input.actionType.requiredEvidenceTypes,
    evidenceRequirements: input.envelope.evidenceRequirements,
    requestSchemaRef: `schema:protected-action-request:${input.actionType.actionClass}`,
    authorityCreated: false,
    greenlightRef: null,
    gatewayCheckRef: null,
    mutationAttemptRef: null,
  });
}

export function projectProtectedActionChallengeFromRefusal(input: {
  refusal: Refusal;
  challengeId?: string;
  retryability?: ProtectedActionChallenge["retryability"];
  commitState?: ProtectedActionChallenge["commitState"];
  nextStepKind?: ProtectedActionChallenge["nextStepKind"];
}): ProtectedActionChallenge {
  const { refusal } = input;
  return ProtectedActionChallengeSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: refusal.tenantId,
    organizationId: refusal.organizationId,
    createdAt: refusal.createdAt,
    challengeId: input.challengeId ?? `challenge_${refusal.refusalId}`,
    phase: refusal.phase,
    actionContractRef: refusal.actionContractId,
    refusedObjectRef: refusal.refusedObjectRef,
    proofGapRef: null,
    reasonCode: refusal.reasonCode,
    retryability: input.retryability ?? "terminal",
    commitState: input.commitState ?? "committed",
    mutationAttempted: false,
    rawInternalRecordIncluded: false,
    evidenceRefs: refusal.evidenceRefs,
    nextStepKind: input.nextStepKind ?? "read_evidence",
    authorityCreated: false,
    greenlightRef: null,
    gatewayCheckRef: null,
    mutationAttemptRef: null,
  });
}
