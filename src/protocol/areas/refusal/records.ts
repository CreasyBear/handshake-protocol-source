import { digestCanonical } from "../../foundation/canonical";
import { PROTOCOL_VERSION, type JsonValue } from "../../foundation/schema-core";
import { RefusalSchema, type Refusal, type RefusalPhase } from "./types";

export type BuildRefusalInput = {
  schemaVersion?: typeof PROTOCOL_VERSION;
  tenantId: string;
  organizationId: string;
  createdAt: string;
  phase: RefusalPhase;
  actionContractId?: string | null;
  policyDecisionId?: string | null;
  greenlightId?: string | null;
  gateAttemptId?: string | null;
  refusedObjectRef?: string | null;
  reasonCode: string;
  reason: string;
  evidenceRefs?: string[];
  refusedAt: string;
};

export async function buildRefusal(input: BuildRefusalInput): Promise<Refusal> {
  const normalized = {
    schemaVersion: input.schemaVersion ?? PROTOCOL_VERSION,
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    createdAt: input.createdAt,
    phase: input.phase,
    actionContractId: input.actionContractId ?? null,
    policyDecisionId: input.policyDecisionId ?? null,
    greenlightId: input.greenlightId ?? null,
    gateAttemptId: input.gateAttemptId ?? null,
    refusedObjectRef: input.refusedObjectRef ?? null,
    reasonCode: input.reasonCode,
    reason: input.reason,
    evidenceRefs: input.evidenceRefs ?? [],
    refusedAt: input.refusedAt,
  } satisfies JsonValue;
  const refusalDigest = await digestCanonical(normalized);
  return RefusalSchema.parse({
    ...normalized,
    refusalId: `ref_${refusalDigest.slice("sha256:".length, "sha256:".length + 48)}`,
    mutationAttempted: false,
    authorityCreated: false,
  });
}

export async function commitRefusal(
  recorder: import("../../events/records").ProtocolRecorder,
  input: BuildRefusalInput,
): Promise<Refusal> {
  const refusal = await buildRefusal(input);
  await recorder.commitRecordsWithEvents(
    [{ objectType: "refusal", payload: refusal }],
    [
      {
        source: refusal,
        eventType: "action_refused",
        objectRefs: [
          refusal.refusalId,
          ...(refusal.refusedObjectRef ? [refusal.refusedObjectRef] : []),
        ],
        payload: { reasonCode: refusal.reasonCode },
      },
    ],
  );
  return refusal;
}

export function protocolObjectRef(objectType: string, objectId: string): string {
  return `${objectType}:${objectId}`;
}
