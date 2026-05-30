import { describe, expect, it } from "bun:test";
import { PROTOCOL_VERSION } from "../../src/protocol/public/schemas";
import { makeKernelFixture } from "../support/fixtures";

describe("http-profile orphan catalog guard", () => {
  it("refuses install proposals missing gateway registry entry in compiled records", async () => {
    const fixture = makeKernelFixture();
    const result = await fixture.kernel.registerInstallProposalCompiledRecords({
      installProposalId: "install_orphan_gateway",
      schemaVersion: PROTOCOL_VERSION,
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      createdAt: "2026-05-24T00:00:00.000Z",
      adapterPackId: "adapter_pack_orphan",
      adapterPackVersion: "0.1.0",
      actionFamily: "x402_payment",
      protectedSurfaceKind: "http_api",
      resourceRef: "https://api.example/pay",
      humanSummary: "Orphan catalog missing gateway",
      policyPackRef: "policy:demo",
      policyPackVersion: "v1",
      bypassProbePlan: [],
      receiptExpectationRefs: [],
      installDigest: `sha256:${"a".repeat(64)}`,
      status: "ready_to_install",
      refusalReasonCodes: [],
      compiledRecords: {
        toolCapability: fixture.tool,
        actionType: fixture.actionType,
        operatingEnvelope: fixture.envelope,
        gatewayRegistryEntry: null,
      },
    });

    expect(result.outcome).toBe("install_proposal_refused");
    if (result.outcome !== "install_proposal_refused") throw new Error("expected refused install");
    expect(result.reasonCodes).toContain("install_orphan_catalog_missing_gateway");
  });
});
