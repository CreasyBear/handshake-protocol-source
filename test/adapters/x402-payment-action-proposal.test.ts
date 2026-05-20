import { describe, expect, it } from "bun:test";
import {
  compileX402InstallProposal,
  type X402InstallProposal,
  type X402InstallProposalInput,
} from "../../src/adapters/x402-payment/install-proposal";
import { proposeX402PaymentActionContract } from "../../src/adapters/x402-payment/action-proposal";
import { HandshakeKernel } from "../../src/protocol/kernel";
import { nowIso } from "../../src/protocol/foundation/ids";
import { InMemoryProtocolStore } from "../../src/storage/memory";
import { futureIso } from "../support/fixtures";

const digest = `sha256:${"b".repeat(64)}` as const;

describe("x402 payment runtime proposal", () => {
  it("turns observed x402 payment terms into an exact action contract without issuing authority", async () => {
    const { kernel, store, proposal } = await installedX402Kernel();
    const records = requireCompiledRecords(proposal);

    const result = await proposeX402PaymentActionContract(kernel, runtimeConfig(proposal, records), {
      principalIntentRef: "intent:fetch paid context",
      generatedCodeOrSpecRef: "code:x402-fetch-wrapper",
      endpointUrl: proposal.endpointEvidence.endpointUrl,
      payee: proposal.endpointEvidence.payee,
      network: proposal.endpointEvidence.network,
      token: proposal.endpointEvidence.token,
      atomicAmount: "2500",
      paymentRequirementsDigest: proposal.endpointEvidence.paymentRequirementsDigest,
      paymentRequiredEvidenceRef: "evidence:x402-payment-required",
    });

    expect(result.outcome).toBe("action_contract_proposed");
    if (result.outcome !== "action_contract_proposed") throw new Error("expected action contract");
    expect(result.actionContract.actionClass).toBe("x402_payment.exact");
    expect(result.actionContract.gatewayId).toBe("gateway_x402_wallet");
    expect(result.actionContract.resourceRef).toBe(proposal.resourceRef);
    expect(result.actionContract.parameters).toMatchObject({
      endpointDomain: "api.example.com",
      payee: "0xpayee",
      token: "USDC",
      atomicAmount: "2500",
    });
    expect(result.actionContract.bounds).toMatchObject({
      maxAtomicAmountPerCall: "2500",
    });
    expect(JSON.stringify(result.actionContract.bounds)).not.toContain("maxAtomicAmountPerSession");
    expect(JSON.stringify(result.actionContract.bounds)).not.toContain("maxAtomicAmountPerDay");
    expect(JSON.stringify(result.actionContract.bounds)).not.toContain("reviewThresholdAtomicAmount");
    expect(await store.listRecordsByType("greenlight")).toHaveLength(0);
  });

  it("refuses an x402 payment attempt above the installed per-call bound before compilation", async () => {
    const { kernel, store, proposal } = await installedX402Kernel();
    const records = requireCompiledRecords(proposal);

    const result = await proposeX402PaymentActionContract(kernel, runtimeConfig(proposal, records), {
      principalIntentRef: "intent:fetch paid context",
      generatedCodeOrSpecRef: "code:x402-fetch-wrapper",
      endpointUrl: proposal.endpointEvidence.endpointUrl,
      payee: proposal.endpointEvidence.payee,
      network: proposal.endpointEvidence.network,
      token: proposal.endpointEvidence.token,
      atomicAmount: "2501",
      paymentRequirementsDigest: proposal.endpointEvidence.paymentRequirementsDigest,
      paymentRequiredEvidenceRef: "evidence:x402-payment-required",
    });

    expect(result).toEqual({
      outcome: "payment_attempt_refused",
      intentCompilation: null,
      actionContract: null,
      refusalReasonCodes: ["x402_amount_exceeds_call_bound"],
    });
    expect(await store.listRecordsByType("intent_compilation")).toHaveLength(0);
    expect(await store.listRecordsByType("action_contract")).toHaveLength(0);
    expect(await store.listRecordsByType("greenlight")).toHaveLength(0);
    expect(await store.listRecordsByType("gateway_check_attempt")).toHaveLength(0);
    expect(await store.listRecordsByType("mutation_attempt")).toHaveLength(0);
    expect(await store.listRecordsByType("receipt")).toHaveLength(0);
  });
});

async function installedX402Kernel(): Promise<{
  kernel: HandshakeKernel;
  store: InMemoryProtocolStore;
  proposal: X402InstallProposal;
}> {
  const store = new InMemoryProtocolStore();
  const kernel = new HandshakeKernel(store);
  const proposal = await compileX402InstallProposal(validInstallInput());
  const records = requireCompiledRecords(proposal);
  await kernel.putCatalogObject({ objectType: "tool_capability", payload: records.toolCapability });
  await kernel.putCatalogObject({ objectType: "action_type", payload: records.actionType });
  await kernel.putCatalogObject({ objectType: "gateway_registry_entry", payload: records.gatewayRegistryEntry });
  await kernel.putCatalogObject({ objectType: "operating_envelope", payload: records.operatingEnvelope });
  return { kernel, store, proposal };
}

function requireCompiledRecords(proposal: X402InstallProposal): NonNullable<X402InstallProposal["compiledRecords"]> {
  if (!proposal.compiledRecords) throw new Error("expected installable proposal");
  return proposal.compiledRecords;
}

function runtimeConfig(proposal: X402InstallProposal, records: NonNullable<X402InstallProposal["compiledRecords"]>) {
  return {
    tenantId: proposal.tenantId,
    organizationId: proposal.organizationId,
    principalId: records.operatingEnvelope.principalId,
    agentId: records.operatingEnvelope.agentId,
    runId: "run_x402_demo",
    runtimeAdapterId: records.toolCapability.runtimeAdapterId,
    operatingEnvelopeId: records.operatingEnvelope.envelopeId,
    toolCatalogRef: `${records.toolCapability.toolCatalogId}@${records.toolCapability.toolCatalogVersion}`,
    actionCatalogRef: `${records.actionType.actionCatalogId}@${records.actionType.actionCatalogVersion}`,
    gatewayRegistryRef: `gateway_registry@${records.gatewayRegistryEntry.gatewayRegistryVersion}`,
    toolCapabilityId: records.toolCapability.toolCapabilityId,
    actionTypeId: records.actionType.actionTypeId,
    gatewayRegistryEntryId: records.gatewayRegistryEntry.gatewayRegistryEntryId,
    gatewayId: records.gatewayRegistryEntry.gatewayId,
    maxAtomicAmountPerCall: proposal.spendBounds.maxAtomicAmountPerCall,
    contractExpiresAt: futureIso(),
    signingSecret: "test-secret",
  };
}

function validInstallInput(): X402InstallProposalInput {
  const createdAt = nowIso();
  return {
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt,
    endpointEvidence: {
      endpointUrl: "https://api.example.com/mcp/premium-context",
      payee: "0xpayee",
      network: "base-sepolia",
      token: "USDC",
      maxAtomicAmount: "2500",
      paymentRequirementsDigest: digest,
      facilitatorRef: "facilitator:local",
      evidenceRefs: ["evidence:x402-payment-required"],
    },
    walletGatewayProfile: {
      walletGatewayId: "wallet_gateway_local",
      gatewayId: "gateway_x402_wallet",
      signerCustodyStatus: "fixture_gateway_held",
      signerRef: "secretref:local-fake-signer",
      authorityHolderRef: "gateway-authority:x402-wallet",
      supportedNetworks: ["base-sepolia"],
      supportedTokens: ["USDC"],
    },
    spendBounds: {
      principalId: "principal_demo",
      agentId: "agent_demo",
      runtimeAdapterId: "runtime_codex",
      objectiveRef: "intent:fetch paid context",
      allowedDomains: ["api.example.com"],
      allowedPayees: ["0xpayee"],
      allowedNetworks: ["base-sepolia"],
      allowedTokens: ["USDC"],
      maxAtomicAmountPerCall: "2500",
      maxAtomicAmountPerSession: "10000",
      maxAtomicAmountPerDay: "20000",
      reviewThresholdAtomicAmount: "5000",
      issuedAt: createdAt,
      expiresAt: futureIso(),
    },
  };
}
