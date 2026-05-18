import { describe, expect, it } from "bun:test";
import { HandshakeAmbiguousCommitError } from "../src/protocol/errors";
import { ProtocolRecorder } from "../src/protocol/records";
import { InMemoryProtocolStore } from "../src/storage/memory";
import { FaultInjectingProtocolStore } from "./support/fault-injecting-protocol-store";
import { makeKernelFixture } from "./fixtures";

describe("FaultInjectingProtocolStore", () => {
  it("simulates missing record and list reads without changing durable state", async () => {
    const fixture = makeKernelFixture();
    const store = new FaultInjectingProtocolStore(fixture.store);
    const recorder = new ProtocolRecorder(store);
    const record = await recorder.buildRecord({ objectType: "tool_capability", payload: fixture.tool });
    await store.putRecord(record);

    store.hideRecordOnce("tool_capability", fixture.tool.toolCapabilityId);
    expect(await store.getRecord("tool_capability", fixture.tool.toolCapabilityId)).toBeNull();
    expect(await store.getRecord("tool_capability", fixture.tool.toolCapabilityId)).not.toBeNull();

    store.hideListRecordsByTypeOnce("tool_capability");
    expect(await store.listRecordsByType("tool_capability")).toEqual([]);
    expect(await store.listRecordsByType("tool_capability")).toHaveLength(1);
  });

  it("can report ambiguous applied commits for retry-safety tests", async () => {
    const protocolStore = new FaultInjectingProtocolStore(new InMemoryProtocolStore()).injectAmbiguousProtocolCommitOnce();
    await expect(protocolStore.commitProtocolRecords({ records: [], events: [] })).rejects.toMatchObject({
      code: "ambiguous_commit",
      metadata: { retryability: "ambiguous", commitState: "unknown" },
    } satisfies Partial<HandshakeAmbiguousCommitError>);

    const gatewayStore = new FaultInjectingProtocolStore(new InMemoryProtocolStore()).injectAmbiguousGatewayCommitOnce();
    await expect(
      gatewayStore.commitGatewayCheck({ consumption: null, records: [], events: [] }),
    ).rejects.toMatchObject({
      code: "ambiguous_commit",
      metadata: { retryability: "ambiguous", commitState: "unknown" },
    } satisfies Partial<HandshakeAmbiguousCommitError>);
  });
});
