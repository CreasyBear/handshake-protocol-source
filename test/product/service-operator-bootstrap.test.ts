import { describe, expect, it } from "bun:test";
import { compileX402InstallProposal } from "../../src/adapters/x402-payment/install-proposal";
import {
  defaultX402BootstrapInstallInput,
  runServiceBootstrap,
  serviceBootstrapCommand,
} from "../../src/cli/service/bootstrap";
import { InMemoryProtocolStore } from "../../src/storage/memory";

describe("service operator bootstrap", () => {
  it("registers the full D-08 atomic bundle on the happy path", async () => {
    const result = await runServiceBootstrap({
      installInput: defaultX402BootstrapInstallInput(),
    });

    expect(result).toMatchObject({
      outcome: "compiled_records_registered",
      actionFamily: "x402_payment.exact",
      authorityBoundary: {
        authorityCreated: false,
        greenlightCreated: false,
        gatewayCheckPerformed: false,
        mutationAttempted: false,
      },
    });
    expect(result.recordRefs).toMatchObject({
      toolCapabilityId: expect.any(String),
      actionTypeId: expect.any(String),
      gatewayRegistryEntryId: expect.any(String),
      operatingEnvelopeId: expect.any(String),
    });
    expect(result.policyPackRef).toMatch(/^policy:x402-payment-exact:/);
    expect(result.policyPackVersion).toBe("v1");
    expect(result.reasonCodes).toEqual([]);
  });

  it("refuses install when wallet signer is not gateway-held and writes no catalog", async () => {
    const installInput = defaultX402BootstrapInstallInput({
      walletGatewayProfile: {
        signerCustodyStatus: "agent_exposed",
      },
    });
    const store = new InMemoryProtocolStore();
    const result = await runServiceBootstrap({ installInput, store });

    expect(result.outcome).toBe("install_proposal_refused");
    expect(result.reasonCodes).toContain("x402_wallet_signer_not_gateway_held");
    expect(result.recordRefs).toBeNull();
    expect(await store.listRecordsByType("tool_capability")).toHaveLength(0);
    expect(await store.listRecordsByType("gateway_registry_entry")).toHaveLength(0);
  });

  it("exposes service bootstrap CLI with non-authority envelope", async () => {
    const output = await serviceBootstrapCommand({});
    expect(output).toMatchObject({
      command: "service bootstrap",
      plane: "operator",
      ok: true,
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
      result: {
        outcome: "compiled_records_registered",
        actionFamily: "x402_payment.exact",
      },
    });
  });

  it("refuses non-x402 action families at the CLI boundary", async () => {
    const output = await runServiceBootstrap({
      installInput: {
        actionFamily: "package.install",
        installInput: defaultX402BootstrapInstallInput(),
      },
    });
    expect(output).toMatchObject({
      outcome: "install_proposal_refused",
      reasonCodes: ["service_bootstrap_x402_only"],
      recordRefs: null,
    });
  });

  it("compiled proposal includes policy pack and operating envelope records", async () => {
    const proposal = await compileX402InstallProposal(defaultX402BootstrapInstallInput());
    expect(proposal.status).toBe("ready_to_install");
    expect(proposal.compiledRecords).not.toBeNull();
    expect(proposal.compiledRecords?.operatingEnvelope.envelopeId).toBeTruthy();
    expect(proposal.policyPackRef).toMatch(/^policy:x402-payment-exact:/);
  });

  it("re-runs cleanly without duplicate gateway registry entries", async () => {
    const store = new InMemoryProtocolStore();
    const installInput = defaultX402BootstrapInstallInput();
    const first = await runServiceBootstrap({ installInput, store });
    const second = await runServiceBootstrap({ installInput, store });

    expect(first.outcome).toBe("compiled_records_registered");
    expect(second.outcome).toBe("compiled_records_registered");
    expect(await store.listRecordsByType("gateway_registry_entry")).toHaveLength(1);
    expect(await store.listRecordsByType("operating_envelope")).toHaveLength(1);
  });

});
