import { describe, expect, it } from "bun:test";
import { parseMcpResourceUri, readMcpResource, type McpEvidenceResourceClient } from "../../src/mcp/resources";

describe("MCP resource redaction", () => {
  it("routes evidence resource URIs through read-only evidence projections", async () => {
    const calls: string[] = [];
    const evidenceClient = fakeEvidenceClient(calls);

    await readMcpResource("handshake://evidence/contracts/act_demo", evidenceClient);
    await readMcpResource("handshake://evidence/envelopes/act_demo", evidenceClient);
    await readMcpResource("handshake://evidence/receipts/rcp_demo/timeline", evidenceClient);
    await readMcpResource("handshake://evidence/idempotency/act_demo", evidenceClient);
    await readMcpResource("handshake://health/install/act_demo", evidenceClient);
    const preContractHealth = await readMcpResource("handshake://health/install/pre-contract/req_demo", evidenceClient);

    expect(calls).toEqual([
      "contract:act_demo",
      "envelope:act_demo",
      "timeline:rcp_demo",
      "idempotency:act_demo",
      "install:act_demo",
    ]);
    expect(preContractHealth.payload).toMatchObject({
      resourceVersion: "mcp-install-health.pre-contract.v1",
      requestId: "req_demo",
      healthScope: "pre_contract",
      metadataDigest: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
    });
  });

  it("keeps metadata, challenge, and certificate resources reference-only", async () => {
    const evidenceClient = fakeEvidenceClient([]);
    const metadata = await readMcpResource("handshake://metadata/actions/x402_payment.exact", evidenceClient);
    const challenge = await readMcpResource("handshake://challenges/chal_demo", evidenceClient);
    const certificate = await readMcpResource("handshake://certificates/cert_demo", evidenceClient);

    for (const result of [metadata, challenge, certificate]) {
      expect(result).toMatchObject({
        readOnly: true,
        authorityCreated: false,
        greenlightCreated: false,
        gatewayCheckPerformed: false,
        mutationAttempted: false,
        credentialMaterialIncluded: false,
        mutationCommandIncluded: false,
        rawInternalRecordIncluded: false,
        receiptExportCreated: false,
        authorityCertificateMinted: false,
      });
      expect(JSON.stringify(result)).not.toContain("PaymentPayload");
      expect(JSON.stringify(result)).not.toContain("PAYMENT-SIGNATURE");
      expect(JSON.stringify(result)).not.toContain("privateKey");
      expect(JSON.stringify(result)).not.toContain('"rawInternalRecord":');
      expect(JSON.stringify(result)).not.toContain("rawCredentialMaterial");
    }
    expect(metadata.payload).toMatchObject({
      actionClass: "x402_payment.exact",
      proposalTool: "handshake.actions.x402_payment.propose",
      metadataDigest: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      resourceVersion: "mcp-metadata.v1",
    });
  });

  it("parses only the source-owned resource URI families", () => {
    expect(parseMcpResourceUri("handshake://evidence/contracts/act_demo")).toEqual({
      kind: "contract",
      actionContractId: "act_demo",
    });
    expect(parseMcpResourceUri("handshake://health/install/pre-contract/req_demo")).toEqual({
      kind: "installHealthPreContract",
      requestId: "req_demo",
    });
    expect(() => parseMcpResourceUri("handshake://actions/run/act_demo")).toThrow();
    expect(() => parseMcpResourceUri("https://example.test/evidence/contracts/act_demo")).toThrow();
  });
});

function fakeEvidenceClient(calls: string[]): McpEvidenceResourceClient {
  return {
    async getContractEvidenceProjection(actionContractId: string) {
      calls.push(`contract:${actionContractId}`);
      return { projection: "contract", actionContractId };
    },
    async getAgentTransactionEnvelopeProjection(actionContractId: string) {
      calls.push(`envelope:${actionContractId}`);
      return { projection: "envelope", actionContractId };
    },
    async getOperationReadbackProjection(actionContractId: string) {
      calls.push(`readback:${actionContractId}`);
      return { projection: "operation_readback", actionContractId };
    },
    async getOperationCorrelationIndex(actionContractId: string) {
      calls.push(`correlation:${actionContractId}`);
      return { projection: "operation_correlation", actionContractId };
    },
    async getReceiptTimelineProjection(receiptId: string) {
      calls.push(`timeline:${receiptId}`);
      return { projection: "timeline", receiptId };
    },
    async getIdempotencyRecoveryProjection(actionContractId: string) {
      calls.push(`idempotency:${actionContractId}`);
      return { projection: "idempotency", actionContractId };
    },
    async getProtectedPathInstallHealthProjection(actionContractId: string) {
      calls.push(`install:${actionContractId}`);
      return { projection: "install", actionContractId };
    },
  };
}
