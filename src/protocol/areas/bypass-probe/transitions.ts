import { digestCanonical } from "../../foundation/canonical";
import { createId, nowIso } from "../../foundation/ids";
import type { EventDescriptor } from "../../events/chains";
import type { ProtocolRecorder } from "../../events/records";
import type { ProtocolRecord } from "../object-registry";
import { protectedPathPostureScopeKey } from "../protected-path-posture";
import {
  BypassProbeSchema,
  CreateBypassProbeInputSchema,
  PROTOCOL_VERSION,
  type BypassProbe,
  type CreateBypassProbeInput,
  type JsonValue,
} from "./types";

type ParsedCreateBypassProbeInput = ReturnType<typeof CreateBypassProbeInputSchema.parse>;

type BypassProbeContext = {
  input: ParsedCreateBypassProbeInput;
  createdAt: string;
  observedAt: string;
  postureScopeKey: string;
  bypassProbeId: string;
};

export async function createBypassProbe(
  recorder: ProtocolRecorder,
  inputValue: CreateBypassProbeInput,
): Promise<BypassProbe> {
  const input = CreateBypassProbeInputSchema.parse(inputValue);
  const context = buildBypassProbeContext(input);
  const probe = await buildBypassProbe(context);
  await recorder.commitRecordsWithEvents(bypassProbeRecords(probe), bypassProbeEvents(probe));
  return probe;
}

function buildBypassProbeContext(input: ParsedCreateBypassProbeInput): BypassProbeContext {
  const createdAt = nowIso();
  const observedAt = input.observedAt ?? createdAt;
  return {
    input,
    createdAt,
    observedAt,
    bypassProbeId: createId("probe"),
    postureScopeKey: protectedPathPostureScopeKey({
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      runtimeAdapterId: input.runtimeAdapterId,
      gatewayId: input.gatewayId,
      actionClass: input.actionClass,
      resourceRef: input.resourceRef,
    }),
  };
}

async function buildBypassProbe(context: BypassProbeContext): Promise<BypassProbe> {
  const { input, createdAt, observedAt, postureScopeKey, bypassProbeId } = context;
  const probeDigest = await digestCanonical(bypassProbeDigestMaterial(context));
  return BypassProbeSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    createdAt,
    bypassProbeId,
    postureScopeKey,
    runtimeAdapterId: input.runtimeAdapterId,
    gatewayId: input.gatewayId,
    actionClass: input.actionClass,
    resourceRef: input.resourceRef,
    protectedSurfaceKind: input.protectedSurfaceKind,
    probeKind: input.probeKind,
    probeOutcome: input.probeOutcome,
    sourceAuthority: input.sourceAuthority,
    reasonCodes: input.reasonCodes,
    evidenceRefs: input.evidenceRefs,
    observedAt,
    expiresAt: input.expiresAt,
    probeDigest,
  });
}

function bypassProbeDigestMaterial(context: BypassProbeContext): JsonValue {
  const { input, observedAt, postureScopeKey } = context;
  return {
    postureScopeKey,
    runtimeAdapterId: input.runtimeAdapterId,
    gatewayId: input.gatewayId,
    actionClass: input.actionClass,
    resourceRef: input.resourceRef,
    protectedSurfaceKind: input.protectedSurfaceKind,
    probeKind: input.probeKind,
    probeOutcome: input.probeOutcome,
    sourceAuthority: input.sourceAuthority,
    reasonCodes: input.reasonCodes,
    evidenceRefs: input.evidenceRefs,
    observedAt,
    expiresAt: input.expiresAt,
  } satisfies JsonValue;
}

function bypassProbeRecords(probe: BypassProbe): ProtocolRecord[] {
  return [{ objectType: "bypass_probe", payload: probe }];
}

function bypassProbeEvents(probe: BypassProbe): EventDescriptor[] {
  return [
    {
      source: probe,
      eventType: "bypass_probe_recorded",
      objectRefs: [probe.bypassProbeId, probe.postureScopeKey, probe.probeDigest],
      payload: {
        postureScopeKey: probe.postureScopeKey,
        probeKind: probe.probeKind,
        probeOutcome: probe.probeOutcome,
        sourceAuthority: probe.sourceAuthority,
      },
    },
  ];
}
