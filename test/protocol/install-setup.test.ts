import { describe, expect, it } from "bun:test";
import type { InstallProposal } from "../../src/install";
import { PROTOCOL_VERSION, type ContractStreamEvent, type Refusal } from "../../src/protocol/public/schemas";
import { makeKernelFixture, type KernelFixture } from "../support/fixtures";

describe("install setup transition", () => {
  it("atomically registers ready compiled records as non-authority setup evidence", async () => {
    const fixture = makeKernelFixture();
    const proposal = readyInstallProposal(fixture);

    const result = await fixture.kernel.registerInstallProposalCompiledRecords(proposal);

    expect(result).toMatchObject({
      outcome: "compiled_records_registered",
      commitAtomicity: "server_store_commit",
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
      recordRefs: {
        toolCapabilityId: fixture.tool.toolCapabilityId,
        actionTypeId: fixture.actionType.actionTypeId,
        gatewayRegistryEntryId: fixture.gateway.gatewayRegistryEntryId,
        operatingEnvelopeId: fixture.envelope.envelopeId,
      },
    });
    expect(await fixture.store.getRecord("tool_capability", fixture.tool.toolCapabilityId)).not.toBeNull();
    expect(await fixture.store.getRecord("action_type", fixture.actionType.actionTypeId)).not.toBeNull();
    expect(
      await fixture.store.getRecord("gateway_registry_entry", fixture.gateway.gatewayRegistryEntryId),
    ).not.toBeNull();
    expect(await fixture.store.getRecord("operating_envelope", fixture.envelope.envelopeId)).not.toBeNull();
    expect(await fixture.store.listRecordsByType("greenlight")).toHaveLength(0);
    expect(await fixture.store.listRecordsByType("gateway_check_attempt")).toHaveLength(0);
    expect(await fixture.store.listRecordsByType("mutation_attempt")).toHaveLength(0);
    expect(await fixture.store.listRecordsByType("receipt")).toHaveLength(0);

    const events = await fixture.store.listRecordsByType<ContractStreamEvent>("contract_stream_event");
    expect(events.map((record) => record.payload.eventType)).toEqual(["install_setup_recorded"]);
  });

  it("records refused install proposals without catalog writes", async () => {
    const fixture = makeKernelFixture();

    const result = await fixture.kernel.registerInstallProposalCompiledRecords(refusedInstallProposal());

    expect(result).toMatchObject({
      outcome: "install_proposal_refused",
      commitAtomicity: "server_store_commit",
      reasonCodes: ["fixture_install_refused"],
      records: null,
      recordRefs: null,
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    });
    expect(await fixture.store.listRecordsByType("tool_capability")).toHaveLength(0);
    expect(await fixture.store.listRecordsByType("action_type")).toHaveLength(0);
    expect(await fixture.store.listRecordsByType("gateway_registry_entry")).toHaveLength(0);
    expect(await fixture.store.listRecordsByType("operating_envelope")).toHaveLength(0);
    const refusals = await fixture.store.listRecordsByType<Refusal>("refusal");
    expect(refusals).toHaveLength(1);
    expect(refusals[0]?.payload.reasonCode).toBe("fixture_install_refused");
    const events = await fixture.store.listRecordsByType<ContractStreamEvent>("contract_stream_event");
    expect(events.map((record) => record.payload.eventType)).toEqual(["install_setup_refused"]);
  });

  it("rejects same-id different-digest catalog conflicts without partial setup writes", async () => {
    const fixture = makeKernelFixture();
    await fixture.kernel.putCatalogObject({
      objectType: "tool_capability",
      payload: { ...fixture.tool, toolName: "bun add --unsafe-different-record" },
    });

    await expect(
      fixture.kernel.registerInstallProposalCompiledRecords(readyInstallProposal(fixture)),
    ).rejects.toMatchObject({
      code: "bootstrap_record_digest_conflict",
      status: 409,
    });
    expect(await fixture.store.listRecordsByType("tool_capability")).toHaveLength(1);
    expect(await fixture.store.listRecordsByType("action_type")).toHaveLength(0);
    expect(await fixture.store.listRecordsByType("gateway_registry_entry")).toHaveLength(0);
    expect(await fixture.store.listRecordsByType("operating_envelope")).toHaveLength(0);
    expect(await fixture.store.listRecordsByType("contract_stream_event")).toHaveLength(0);
  });
});

function readyInstallProposal(fixture: KernelFixture): InstallProposal {
  return installProposal({
    status: "ready_to_install",
    refusalReasonCodes: [],
    compiledRecords: {
      toolCapability: fixture.tool,
      actionType: fixture.actionType,
      gatewayRegistryEntry: fixture.gateway,
      operatingEnvelope: fixture.envelope,
    },
  });
}

function refusedInstallProposal(): InstallProposal {
  return installProposal({
    status: "refused",
    refusalReasonCodes: ["fixture_install_refused"],
    compiledRecords: null,
  });
}

function installProposal(
  overrides: Pick<InstallProposal, "status" | "refusalReasonCodes" | "compiledRecords">,
): InstallProposal {
  return {
    installProposalId: "install_protocol_package_fixture",
    schemaVersion: PROTOCOL_VERSION,
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt: "2026-05-24T00:00:00.000Z",
    adapterPackId: "adapter_pack_package_install_material",
    adapterPackVersion: "0.1.0",
    actionFamily: "package.install",
    protectedSurfaceKind: "package_manager",
    resourceRef: "npm:hono",
    humanSummary: "Package install setup fixture.",
    policyPackRef: "policy:package-install-material:v1",
    policyPackVersion: "v1",
    bypassProbePlan: [
      {
        probeKind: "raw_sibling_blocking",
        requiredSourceAuthority: "gateway_probe",
        mustPassBeforeGatewayCheckedPosture: true,
      },
    ],
    receiptExpectationRefs: ["receipt:package-install-material"],
    installDigest: `sha256:${"b".repeat(64)}`,
    ...overrides,
  };
}
