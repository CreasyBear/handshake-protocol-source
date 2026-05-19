import { digestCanonical } from "../foundation/canonical";
import type { ActionContract } from "../areas/action-contract";
import { ContractStreamEventSchema, type ContractStreamEvent } from "./schemas";
import { createId, nowIso } from "../foundation/ids";
import type { ReceiptStreamReference } from "../areas/receipt-export";
import { PROTOCOL_VERSION, type JsonValue } from "../foundation/schema-core";
import type { ProtocolStore } from "../store/port";

export type ActionLifecycleStreamRefs = {
  actionContractId: string;
  runId: string;
  gatewayId: string;
  resourceRef: string;
};

export type EventDescriptor = {
  source: { tenantId: string; organizationId: string; createdAt: string };
  eventType: ContractStreamEvent["eventType"];
  objectRefs: string[];
  payload: Record<string, JsonValue>;
  streamRefs?: ActionLifecycleStreamRefs;
};

export async function buildEventChain(
  store: ProtocolStore,
  descriptors: EventDescriptor[],
): Promise<ContractStreamEvent[]> {
  const tails = new Map<string, { offset: number; digest: string | null }>();
  const events: ContractStreamEvent[] = [];
  for (const descriptor of descriptors) {
    for (const binding of streamBindings(descriptor)) {
      const tailKey = `${binding.streamId}:${binding.partitionKey}`;
      let tail = tails.get(tailKey);
      if (!tail) {
        const storedTail = await store.getStreamTail(binding.streamId, binding.partitionKey);
        tail = storedTail
          ? { offset: storedTail.offset, digest: storedTail.eventDigest }
          : { offset: -1, digest: null };
      }
      const event = await buildEventAt(
        descriptor.source,
        descriptor.eventType,
        descriptor.objectRefs,
        descriptor.payload,
        binding.streamId,
        binding.streamScope,
        binding.partitionKey,
        tail.offset + 1,
        tail.digest,
      );
      events.push(event);
      tails.set(tailKey, { offset: event.offset, digest: event.eventDigest });
    }
  }
  return events;
}

export function actionLifecycleStreamRefs(
  contract: Pick<ActionContract, "actionContractId" | "runId" | "gatewayId" | "resourceRef">,
): ActionLifecycleStreamRefs {
  return {
    actionContractId: contract.actionContractId,
    runId: contract.runId,
    gatewayId: contract.gatewayId,
    resourceRef: contract.resourceRef,
  };
}

export function receiptStreamReferencesForEvents(events: ContractStreamEvent[]): ReceiptStreamReference[] {
  const references = new Map<string, ReceiptStreamReference>();
  for (const event of events) {
    const key = `${event.streamId}:${event.partitionKey}`;
    const existing = references.get(key);
    if (!existing || event.offset > existing.offsetEnd) {
      references.set(key, {
        streamId: event.streamId,
        streamScope: event.streamScope,
        partitionKey: event.partitionKey,
        offsetStart: existing?.offsetStart ?? 0,
        offsetEnd: event.offset,
        terminalEventDigest: event.eventDigest,
      });
    }
  }
  return [...references.values()];
}

type StreamBinding = {
  streamId: string;
  streamScope: ContractStreamEvent["streamScope"];
  partitionKey: string;
};

function streamBindings(descriptor: EventDescriptor): StreamBinding[] {
  const streamId = organizationStreamId(descriptor.source);
  const bindings: StreamBinding[] = [
    {
      streamId,
      streamScope: "organization",
      partitionKey: streamPartitionKey(descriptor.eventType, descriptor.objectRefs, descriptor.streamRefs),
    },
  ];

  if (descriptor.streamRefs) {
    bindings.push(
      {
        streamId,
        streamScope: "run",
        partitionKey: `run:${descriptor.streamRefs.runId}`,
      },
      {
        streamId,
        streamScope: "protected_surface_resource",
        partitionKey: `protected_surface_resource:${descriptor.streamRefs.gatewayId}:${descriptor.streamRefs.resourceRef}`,
      },
    );
  }

  return dedupeBindings(bindings);
}

function organizationStreamId(source: { tenantId: string; organizationId: string }): string {
  return `stream_${source.tenantId}_${source.organizationId}`;
}

function streamPartitionKey(
  eventType: ContractStreamEvent["eventType"],
  objectRefs: string[],
  streamRefs?: ActionLifecycleStreamRefs,
): string {
  if (streamRefs) return `action:${streamRefs.actionContractId}`;
  const actionRef = objectRefs.find((ref) => ref.startsWith("act_"));
  if (actionRef) return `action:${actionRef}`;
  if (eventType === "isolation_changed" && objectRefs[1] && objectRefs[2]) {
    return `isolation:${objectRefs[1]}:${objectRefs[2]}`;
  }
  if (eventType === "isolation_changed") return `isolation:${objectRefs[1] ?? objectRefs[0] ?? "unknown"}`;
  if (eventType === "intent_compiled") return `intent:${objectRefs[0] ?? "unknown"}`;
  return `object:${objectRefs[0] ?? "unknown"}`;
}

function dedupeBindings(bindings: StreamBinding[]): StreamBinding[] {
  const seen = new Set<string>();
  const deduped: StreamBinding[] = [];
  for (const binding of bindings) {
    const key = `${binding.streamId}:${binding.partitionKey}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(binding);
  }
  return deduped;
}

async function buildEventAt(
  source: { tenantId: string; organizationId: string; createdAt: string },
  eventType: ContractStreamEvent["eventType"],
  objectRefs: string[],
  payload: Record<string, JsonValue>,
  streamId: string,
  streamScope: ContractStreamEvent["streamScope"],
  partitionKey: string,
  offset: number,
  previousEventDigest: string | null,
): Promise<ContractStreamEvent> {
  const eventTime = nowIso();
  const eventSeed = {
    streamId,
    streamScope,
    partitionKey,
    offset,
    eventType,
    eventTime,
    objectRefs,
    previousEventDigest,
    payload,
  };
  return ContractStreamEventSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: source.tenantId,
    organizationId: source.organizationId,
    createdAt: eventTime,
    streamEventId: createId("evt"),
    streamId,
    streamScope,
    offset,
    partitionKey,
    eventType,
    eventTime,
    producerRef: "handshake-kernel",
    objectRefs,
    previousEventDigest,
    eventDigest: await digestCanonical(eventSeed),
    payload,
  });
}
