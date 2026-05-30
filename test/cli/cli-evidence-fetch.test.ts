import { describe, expect, it } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { evidenceFetchCommand } from "../../src/cli/evidence/fetch";
import type { HandshakeFetch } from "../../src/sdk/client";
import { sampleOperationReadbackProjection } from "../support/operation-readback-fixture";

describe("CLI evidence fetch (D-55 live readback parity)", () => {
  it("defaults to HTTP via EvidenceClient when --cwd is omitted", async () => {
    const calls: string[] = [];
    const original = globalThis.fetch;
    const mockFetch: HandshakeFetch = async (input) => {
      calls.push(String(input));
      return new Response(JSON.stringify(sampleOperationReadbackProjection()), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };
    globalThis.fetch = mockFetch as typeof fetch;
    try {
      const output = await evidenceFetchCommand({
        contractId: "act_readback_demo",
        baseUrl: "https://handshake.example",
        roleCredential: "review-token",
      });
      expect(calls.some((url) => url.includes("/v0.2/evidence/operations/act_readback_demo/readback"))).toBe(true);
      expect(output).toMatchObject({
        command: "evidence operation-readback",
        plane: "evidence",
        result: {
          projection: {
            schemaVersion: "handshake.operation-readback.v0.1",
            actionContractRef: "act_readback_demo",
          },
        },
      });
    } finally {
      globalThis.fetch = original;
    }
  });

  it("reads offline projection from --cwd without calling fetch", async () => {
    const cwd = join(tmpdir(), `handshake-evidence-fetch-${Date.now()}`);
    const projection = sampleOperationReadbackProjection({ actionContractRef: "act_offline" });
    const offlineDir = join(cwd, ".handshake", "evidence", "operations");
    await mkdir(offlineDir, { recursive: true });
    await writeFile(join(offlineDir, "act_offline.readback.json"), JSON.stringify(projection));

    let fetchCalled = false;
    const original = globalThis.fetch;
    const blockingFetch: HandshakeFetch = async () => {
      fetchCalled = true;
      return new Response("{}", { status: 500 });
    };
    globalThis.fetch = blockingFetch as typeof fetch;
    try {
      const output = await evidenceFetchCommand({ contractId: "act_offline", cwd });
      expect(fetchCalled).toBe(false);
      expect(output.result).toMatchObject({
        projection: { actionContractRef: "act_offline" },
      });
    } finally {
      globalThis.fetch = original;
    }
  });
});
