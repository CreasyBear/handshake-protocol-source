import { describe, expect, it } from "bun:test";
import { readMcpResource, type McpEvidenceResourceClient } from "../../src/mcp/resources";
import type { HandshakeFetch } from "../../src/sdk/client";
import { EvidenceClient, fetchOperationReadbackProjection } from "../../src/sdk/surface-clients/evidence-client";
import { sampleOperationReadbackProjection } from "../support/operation-readback-fixture";

describe("EvidenceClient operation readback fetch (D-55)", () => {
  it("uses the canonical HTTP readback path suffix", async () => {
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
      const client = new EvidenceClient("https://handshake.example", {
        roleCredential: "review-token",
        readRole: "review_custody",
      });
      await fetchOperationReadbackProjection(client, "act_readback_demo");
      expect(calls).toEqual([
        "https://handshake.example/v0.2/evidence/operations/act_readback_demo/readback",
      ]);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("keeps MCP operation readback URI aligned with SDK transport path", async () => {
    const calls: string[] = [];
    const evidenceClient: McpEvidenceResourceClient = {
      async getContractEvidenceProjection() {
        return {};
      },
      async getAgentTransactionEnvelopeProjection() {
        return {};
      },
      async getOperationReadbackProjection(actionContractId: string) {
        calls.push(actionContractId);
        return sampleOperationReadbackProjection({ actionContractRef: actionContractId });
      },
      async getOperationCorrelationIndex(actionContractId: string) {
        calls.push(`correlation:${actionContractId}`);
        return {
          schemaVersion: "handshake.operation-correlation.v0.1",
          actionContractRef: actionContractId,
        };
      },
      async getReceiptTimelineProjection() {
        return {};
      },
      async getIdempotencyRecoveryProjection() {
        return {};
      },
      async getProtectedPathInstallHealthProjection() {
        return {};
      },
    };

    const result = await readMcpResource(
      "handshake://evidence/operations/act_mcp/readback",
      evidenceClient,
    );
    expect(calls).toEqual(["act_mcp"]);
    expect(result.payload).toMatchObject({
      schemaVersion: "handshake.operation-readback.v0.1",
      actionContractRef: "act_mcp",
      latestAuthoritativeStage: "receipt",
    });
  });
});
