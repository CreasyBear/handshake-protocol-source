import { describe, expect, it } from "bun:test";
import {
  compileX402InstallProposal,
  x402PaymentExactAdapterPack,
  type X402InstallProposalInput,
} from "../../src/adapters/x402-payment/install-proposal";
import { nowIso } from "../../src/protocol/foundation/ids";
import { futureIso } from "../support/fixtures";

const digest = `sha256:${"a".repeat(64)}` as const;

describe("x402 install proposal compiler", () => {
  it("compiles wallet gateway and spend bounds into installable kernel records", async () => {
    const proposal = await compileX402InstallProposal(validInstallInput());

    expect(proposal.status).toBe("ready_to_install");
    expect(proposal.actionFamily).toBe("x402_payment.exact");
    expect(proposal.adapterPackId).toBe(x402PaymentExactAdapterPack.adapterPackId);
    expect(proposal.humanSummary).toContain("agent will not receive signing authority");
    expect(proposal.humanSummary).toContain("session/day/review windows are metadata");
    expect(proposal.spendBounds.spendWindowEnforcementStatus).toBe("not_enforced_tier1_metadata");
    expect(proposal.compiledRecords?.actionType.actionClass).toBe("x402_payment.exact");
    expect(proposal.compiledRecords?.gatewayRegistryEntry.credentialCustodyStatus).toBe("fixture_gateway_held");
    expect(proposal.compiledRecords?.gatewayRegistryEntry.enforcementMode).toBe("reference_fixture");
    expect(proposal.compiledRecords?.operatingEnvelope.requiredProtectedPathState).toBe("gateway_checked");
    expect(proposal.compiledRecords?.operatingEnvelope.allowedResources).toEqual([proposal.resourceRef]);
    expect(JSON.stringify(proposal.compiledRecords)).not.toContain("maxAtomicAmountPerSession");
    expect(JSON.stringify(proposal.compiledRecords)).not.toContain("maxAtomicAmountPerDay");
    expect(JSON.stringify(proposal.compiledRecords)).not.toContain("reviewThresholdAtomicAmount");
    const probeKinds = proposal.bypassProbePlan.map((probe) => probe.probeKind);
    expect(probeKinds).toHaveLength(6);
    expect(probeKinds).toContain("credential_custody");
    expect(probeKinds).toContain("failure_closed");
    expect(probeKinds).toContain("mcp_direct_call_blocking");
    expect(probeKinds).toContain("raw_sibling_blocking");
    expect(probeKinds).toContain("token_passthrough_blocking");
    expect(probeKinds).toContain("wrapper_drift");
  });

  it("refuses install proposals that would expose signer authority to the agent", async () => {
    const proposal = await compileX402InstallProposal(
      validInstallInput({
        walletGatewayProfile: { signerCustodyStatus: "agent_exposed" },
      }),
    );

    expect(proposal.status).toBe("refused");
    expect(proposal.compiledRecords).toBeNull();
    expect(proposal.refusalReasonCodes).toContain("x402_wallet_signer_not_gateway_held");
  });

  it("refuses broad wildcard payment bounds instead of installing ambient signer scope", async () => {
    const proposal = await compileX402InstallProposal(
      validInstallInput({
        spendBounds: { allowedDomains: ["*"], allowedPayees: ["*"] },
      }),
    );

    expect(proposal.status).toBe("refused");
    expect(proposal.compiledRecords).toBeNull();
    expect(proposal.refusalReasonCodes).toContain("x402_wildcard_bounds_refused");
  });

  it("refuses endpoint terms outside the selected per-call spend bound", async () => {
    const proposal = await compileX402InstallProposal(
      validInstallInput({
        endpointEvidence: { maxAtomicAmount: "2501" },
      }),
    );

    expect(proposal.status).toBe("refused");
    expect(proposal.refusalReasonCodes).toContain("x402_amount_exceeds_call_bound");
  });
});

function validInstallInput(
  overrides: {
    endpointEvidence?: Partial<X402InstallProposalInput["endpointEvidence"]>;
    walletGatewayProfile?: Partial<X402InstallProposalInput["walletGatewayProfile"]>;
    spendBounds?: Partial<X402InstallProposalInput["spendBounds"]>;
  } = {},
): X402InstallProposalInput {
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
      ...overrides.endpointEvidence,
    },
    walletGatewayProfile: {
      walletGatewayId: "wallet_gateway_local",
      gatewayId: "gateway_x402_wallet",
      signerCustodyStatus: "fixture_gateway_held",
      signerRef: "secretref:local-fake-signer",
      authorityHolderRef: "gateway-authority:x402-wallet",
      supportedNetworks: ["base-sepolia"],
      supportedTokens: ["USDC"],
      ...overrides.walletGatewayProfile,
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
      ...overrides.spendBounds,
    },
  };
}
