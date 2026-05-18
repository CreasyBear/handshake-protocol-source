import { digestCanonical } from "./canonical";
import { createId, nowIso } from "./ids";
import { CreateProtectedPathPostureInputSchema, type CreateProtectedPathPostureInput } from "./inputs";
import type { ProtocolRecorder } from "./records";
import {
  PROTOCOL_VERSION,
  ProtectedPathPostureSchema,
  type ActionContract,
  type GatewayRegistryEntry,
  type JsonValue,
  type ProtectedPathPosture,
} from "./schemas";
import type { ProtocolStore, StoredProtocolRecord } from "../storage/store";

export type ProtectedPathPostureEvaluation =
  | { ok: true; posture: StoredProtocolRecord<ProtectedPathPosture> | null }
  | { ok: false; posture: StoredProtocolRecord<ProtectedPathPosture> | null; reasonCode: string; reason: string };

export async function createProtectedPathPosture(
  recorder: ProtocolRecorder,
  inputValue: CreateProtectedPathPostureInput,
): Promise<ProtectedPathPosture> {
  const input = CreateProtectedPathPostureInputSchema.parse(inputValue);
  const createdAt = nowIso();
  const observedAt = input.observedAt ?? createdAt;
  const protectedPathPostureId = createId("ppp");
  const postureScopeKey = protectedPathPostureScopeKey({
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    runtimeAdapterId: input.runtimeAdapterId,
    gatewayId: input.gatewayId,
    actionClass: input.actionClass,
    resourceRef: input.resourceRef,
  });
  const digestMaterial = {
    postureScopeKey,
    runtimeAdapterId: input.runtimeAdapterId,
    gatewayId: input.gatewayId,
    actionClass: input.actionClass,
    resourceRef: input.resourceRef,
    protectedSurfaceKind: input.protectedSurfaceKind,
    postureState: input.postureState,
    credentialCustodyStatus: input.credentialCustodyStatus,
    rawSiblingToolStatus: input.rawSiblingToolStatus,
    sourceAuthority: input.sourceAuthority,
    reasonCodes: input.reasonCodes,
    evidenceRefs: input.evidenceRefs,
    observedAt,
    expiresAt: input.expiresAt,
  } satisfies JsonValue;
  const postureDigest = await digestCanonical(digestMaterial);
  const record = ProtectedPathPostureSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    createdAt,
    protectedPathPostureId,
    postureScopeKey,
    runtimeAdapterId: input.runtimeAdapterId,
    gatewayId: input.gatewayId,
    actionClass: input.actionClass,
    resourceRef: input.resourceRef,
    protectedSurfaceKind: input.protectedSurfaceKind,
    postureState: input.postureState,
    credentialCustodyStatus: input.credentialCustodyStatus,
    rawSiblingToolStatus: input.rawSiblingToolStatus,
    sourceAuthority: input.sourceAuthority,
    reasonCodes: input.reasonCodes,
    evidenceRefs: input.evidenceRefs,
    observedAt,
    expiresAt: input.expiresAt,
    postureDigest,
  });

  await recorder.commitRecordsWithEvents(
    [{ objectType: "protected_path_posture", payload: record }],
    [
      {
        source: record,
        eventType: "protected_path_posture_recorded",
        objectRefs: [record.protectedPathPostureId, record.postureScopeKey, record.postureDigest],
        payload: {
          postureScopeKey: record.postureScopeKey,
          postureState: record.postureState,
          credentialCustodyStatus: record.credentialCustodyStatus,
          rawSiblingToolStatus: record.rawSiblingToolStatus,
        },
      },
    ],
    {
      protectedPathPostureIndexEntries: [
        {
          postureScopeKey: record.postureScopeKey,
          protectedPathPostureId: record.protectedPathPostureId,
          tenantId: record.tenantId,
          organizationId: record.organizationId,
          updatedAt: createdAt,
        },
      ],
    },
  );

  return record;
}

export async function loadCurrentPostureForContract(
  store: ProtocolStore,
  contract: ActionContract,
): Promise<StoredProtocolRecord<ProtectedPathPosture> | null> {
  return store.getCurrentProtectedPathPosture(protectedPathPostureScopeKeyForContract(contract));
}

export function protectedPathPostureScopeKeyForContract(contract: ActionContract): string {
  return protectedPathPostureScopeKey({
    tenantId: contract.tenantId,
    organizationId: contract.organizationId,
    runtimeAdapterId: contract.runtimeAdapterId,
    gatewayId: contract.gatewayId,
    actionClass: contract.actionClass,
    resourceRef: contract.resourceRef,
  });
}

export function protectedPathPostureScopeKey(input: {
  tenantId: string;
  organizationId: string;
  runtimeAdapterId: string;
  gatewayId: string;
  actionClass: string;
  resourceRef: string;
}): string {
  return [
    `tenant:${input.tenantId}`,
    `org:${input.organizationId}`,
    `runtime:${input.runtimeAdapterId}`,
    `gateway:${input.gatewayId}`,
    `action:${input.actionClass}`,
    `resource:${input.resourceRef}`,
  ].join("|");
}

export function evaluateRequiredProtectedPathPosture(input: {
  contract: ActionContract;
  gateway: Pick<GatewayRegistryEntry, "credentialCustodyStatus" | "enforcementMode">;
  posture: StoredProtocolRecord<ProtectedPathPosture> | null;
  now: string;
}): ProtectedPathPostureEvaluation {
  const { contract, gateway, posture, now } = input;
  if (contract.requiredProtectedPathState === "not_required") return { ok: true, posture };
  if (!gatewayCanSatisfyGatewayChecked(gateway)) {
    return {
      ok: false,
      posture,
      reasonCode: "gateway_registry_not_enforcing",
      reason: "Gateway registry metadata cannot satisfy required gateway_checked posture.",
    };
  }
  if (!posture) {
    return {
      ok: false,
      posture,
      reasonCode: "protected_path_posture_missing",
      reason: "Required protected path posture is missing for this runtime, gateway, action, and resource.",
    };
  }
  const current = posture.payload;
  if (current.tenantId !== contract.tenantId || current.organizationId !== contract.organizationId) {
    return {
      ok: false,
      posture,
      reasonCode: "protected_path_posture_scope_mismatch",
      reason: "Current protected path posture scope does not match the action contract.",
    };
  }
  if (
    current.gatewayId !== contract.gatewayId ||
    current.actionClass !== contract.actionClass ||
    current.protectedSurfaceKind !== contract.protectedSurfaceKind ||
    current.resourceRef !== contract.resourceRef
  ) {
    return {
      ok: false,
      posture,
      reasonCode: "protected_path_posture_binding_mismatch",
      reason: "Current protected path posture does not bind to the same gateway, protected surface, action class, and resource.",
    };
  }
  if (Date.parse(current.expiresAt) <= Date.parse(now)) {
    return {
      ok: false,
      posture,
      reasonCode: "protected_path_posture_stale",
      reason: "Current protected path posture is stale.",
    };
  }
  if (current.postureState !== "gateway_checked") {
    return {
      ok: false,
      posture,
      reasonCode: "protected_path_posture_not_gateway_checked",
      reason: "Current protected path posture is not gateway_checked.",
    };
  }
  if (!sourceAuthorityCanSatisfyGatewayChecked(current.sourceAuthority)) {
    return {
      ok: false,
      posture,
      reasonCode: "protected_path_source_authority_weak",
      reason: "Current protected path posture source authority cannot satisfy required gateway_checked posture.",
    };
  }
  if (!credentialCustodyCanSatisfyGatewayChecked(current.credentialCustodyStatus)) {
    return {
      ok: false,
      posture,
      reasonCode: "protected_path_credential_custody_unsafe",
      reason: "Current protected path posture says mutation credentials are not held by the gateway boundary.",
    };
  }
  if (!["absent", "blocked"].includes(current.rawSiblingToolStatus)) {
    return {
      ok: false,
      posture,
      reasonCode: "protected_path_raw_sibling_tool_present",
      reason: "Current protected path posture leaves a raw sibling mutation tool present or unknown.",
    };
  }
  return { ok: true, posture };
}

export function protectedPathPolicyInput(posture: StoredProtocolRecord<ProtectedPathPosture> | null, now: string): JsonValue {
  if (!posture) return { protectedPathPostureId: null, protectedPathPostureDigest: null, postureState: null, freshness: "missing" };
  const freshness = Date.parse(posture.payload.expiresAt) > Date.parse(now) ? "fresh" : "stale";
  return {
    protectedPathPostureId: posture.payload.protectedPathPostureId,
    protectedPathPostureDigest: posture.payload.postureDigest,
    postureState: posture.payload.postureState,
    freshness,
  };
}

function gatewayCanSatisfyGatewayChecked(
  gateway: Pick<GatewayRegistryEntry, "credentialCustodyStatus" | "enforcementMode">,
): boolean {
  return (
    credentialCustodyCanSatisfyGatewayChecked(gateway.credentialCustodyStatus) &&
    ["reference_fixture", "customer_gateway_adapter", "provider_gateway"].includes(gateway.enforcementMode)
  );
}

function credentialCustodyCanSatisfyGatewayChecked(credentialCustodyStatus: GatewayRegistryEntry["credentialCustodyStatus"]): boolean {
  return credentialCustodyStatus === "gateway_held" || credentialCustodyStatus === "fixture_gateway_held";
}

function sourceAuthorityCanSatisfyGatewayChecked(sourceAuthority: ProtectedPathPosture["sourceAuthority"]): boolean {
  return ["gateway_probe", "conformance_fixture", "hosted_monitor"].includes(sourceAuthority);
}
