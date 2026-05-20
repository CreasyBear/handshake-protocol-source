import { describe, expect, it } from "bun:test";
import {
  compileX402InstallProposal,
  type X402InstallProposal,
  type X402InstallProposalInput,
} from "../../src/adapters/x402-payment/install-proposal";
import { proposeX402PaymentActionContract } from "../../src/adapters/x402-payment/action-proposal";
import { runX402WalletGateway, type X402PaymentParameters } from "../../src/adapters/x402-payment/wallet-gateway";
import type { ProofGap } from "../../src/protocol/areas/proof-gap";
import { HandshakeKernel } from "../../src/protocol/kernel";
import { digestCanonical } from "../../src/protocol/foundation/canonical";
import { nowIso } from "../../src/protocol/foundation/ids";
import { requiredGatewayCheckedBypassProbeKinds } from "../../src/protocol/public/schemas";
import { InMemoryProtocolStore } from "../../src/storage/memory";
import { futureIso } from "../support/fixtures";

const digest = `sha256:${"c".repeat(64)}` as const;

describe("x402 wallet gateway adapter", () => {
  it("creates a fake payment signature only after a verified gateway check", async () => {
    const fixture = await greenlitX402Contract();
    const surface = fakeSigningSurface("succeeded");

    const result = await runX402WalletGateway({
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters as X402PaymentParameters,
    });

    expect(result.outcome).toBe("payment_signature_reconciled");
    expect(surface.signatureCount()).toBe(1);
    expect(result.signatureEvidence?.paymentSignature).toStartWith("PAYMENT-SIGNATURE:fake:");
    expect(result.reconciliation?.observedDownstreamStatus).toBe("succeeded");
    expect(await fixture.store.listRecordsByType("proof_gap")).toHaveLength(0);
  });

  it("refuses changed observed parameters before signing", async () => {
    const fixture = await greenlitX402Contract();
    const surface = fakeSigningSurface("succeeded");
    const observedParameters = {
      ...(fixture.contract.parameters as X402PaymentParameters),
      atomicAmount: "2501",
    };

    const result = await runX402WalletGateway({
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters,
    });

    expect(result.outcome).toBe("gateway_check_refused");
    expect(result.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("params_mismatch");
    expect(surface.signatureCount()).toBe(0);
  });

  it("records a proof gap when the downstream x402 payment response is missing", async () => {
    const fixture = await greenlitX402Contract();
    const surface = fakeSigningSurface("unknown");

    const result = await runX402WalletGateway({
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters as X402PaymentParameters,
    });

    expect(result.outcome).toBe("payment_signature_proof_gap");
    expect(result.reconciliation?.observedDownstreamStatus).toBe("unknown");
    expect(result.reconciliation?.finalityStatus).toBe("unknown");
    const proofGaps = await fixture.store.listRecordsByType<ProofGap>("proof_gap");
    expect(proofGaps).toHaveLength(1);
    expect(proofGaps[0]?.payload.reasonCode).toBe("orphan_mitigation_required");
  });
});

function fakeSigningSurface(downstreamPaymentStatus: "succeeded" | "unknown") {
  let signatures = 0;
  return {
    signatureCount: () => signatures,
    async signPayment(command: {
      verifiedGate: { gateAttemptId: string; surfaceOperationRef: string };
      parameters: X402PaymentParameters;
    }) {
      signatures += 1;
      const paymentSignature = `PAYMENT-SIGNATURE:fake:${command.verifiedGate.gateAttemptId}:${command.parameters.paymentRequirementsDigest.slice(
        "sha256:".length,
        "sha256:".length + 16,
      )}`;
      const paymentSignatureDigest = await digestCanonical({ paymentSignature });
      return {
        evidenceRef: `evidence:x402-payment-signature:${command.verifiedGate.gateAttemptId}`,
        surfaceOperationRef: command.verifiedGate.surfaceOperationRef,
        paymentSignature,
        paymentSignatureDigest,
        downstreamPaymentStatus,
        paymentResponseEvidenceRef:
          downstreamPaymentStatus === "succeeded"
            ? `evidence:x402-payment-response:${command.verifiedGate.gateAttemptId}`
            : null,
        providerRequestRef: `provider-request:x402:${command.verifiedGate.gateAttemptId}`,
        providerOperationRef: `provider-operation:x402:${command.verifiedGate.gateAttemptId}`,
      };
    },
  };
}

async function greenlitX402Contract() {
  const store = new InMemoryProtocolStore();
  const kernel = new HandshakeKernel(store);
  const proposal = await compileX402InstallProposal(validInstallInput());
  const records = requireCompiledRecords(proposal);
  await kernel.putCatalogObject({ objectType: "tool_capability", payload: records.toolCapability });
  await kernel.putCatalogObject({ objectType: "action_type", payload: records.actionType });
  await kernel.putCatalogObject({ objectType: "gateway_registry_entry", payload: records.gatewayRegistryEntry });
  await kernel.putCatalogObject({ objectType: "operating_envelope", payload: records.operatingEnvelope });
  const runtimeResult = await proposeX402PaymentActionContract(
    kernel,
    {
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
    },
    {
      principalIntentRef: "intent:fetch paid context",
      generatedCodeOrSpecRef: "code:x402-fetch-wrapper",
      endpointUrl: proposal.endpointEvidence.endpointUrl,
      payee: proposal.endpointEvidence.payee,
      network: proposal.endpointEvidence.network,
      token: proposal.endpointEvidence.token,
      atomicAmount: "2500",
      paymentRequirementsDigest: proposal.endpointEvidence.paymentRequirementsDigest,
      paymentRequiredEvidenceRef: "evidence:x402-payment-required",
    },
  );
  if (runtimeResult.outcome !== "action_contract_proposed") throw new Error("expected action contract");
  await recordGatewayCheckedPosture(kernel, proposal, records);
  const { decision, greenlight } = await kernel.evaluatePolicy({
    actionContractId: runtimeResult.actionContract.actionContractId,
    envelopeId: records.operatingEnvelope.envelopeId,
    signingSecret: "test-secret",
  });
  if (!greenlight) throw new Error(`expected greenlight, got ${decision.decisionReasonCode}`);
  return { store, kernel, proposal, records, contract: runtimeResult.actionContract, greenlight };
}

async function recordGatewayCheckedPosture(
  kernel: HandshakeKernel,
  proposal: X402InstallProposal,
  records: NonNullable<X402InstallProposal["compiledRecords"]>,
) {
  const bypassProbeIds: string[] = [];
  for (const probeKind of requiredGatewayCheckedBypassProbeKinds) {
    const probe = await kernel.createBypassProbe({
      tenantId: proposal.tenantId,
      organizationId: proposal.organizationId,
      runtimeAdapterId: records.toolCapability.runtimeAdapterId,
      gatewayId: records.gatewayRegistryEntry.gatewayId,
      actionClass: "x402_payment.exact",
      resourceRef: proposal.resourceRef,
      protectedSurfaceKind: "x402_payment",
      probeKind,
      probeOutcome: "passed",
      sourceAuthority: "gateway_probe",
      reasonCodes: ["x402_probe_passed"],
      evidenceRefs: [`evidence:x402-probe:${probeKind}`],
      expiresAt: futureIso(),
    });
    bypassProbeIds.push(probe.bypassProbeId);
  }
  await kernel.createProtectedPathPosture({
    tenantId: proposal.tenantId,
    organizationId: proposal.organizationId,
    runtimeAdapterId: records.toolCapability.runtimeAdapterId,
    gatewayId: records.gatewayRegistryEntry.gatewayId,
    actionClass: "x402_payment.exact",
    resourceRef: proposal.resourceRef,
    protectedSurfaceKind: "x402_payment",
    postureState: "gateway_checked",
    credentialCustodyStatus: "fixture_gateway_held",
    rawSiblingToolStatus: "blocked",
    sourceAuthority: "gateway_probe",
    reasonCodes: ["x402_gateway_checked"],
    evidenceRefs: ["evidence:x402-probes"],
    bypassProbeIds,
    expiresAt: futureIso(),
  });
}

function requireCompiledRecords(proposal: X402InstallProposal): NonNullable<X402InstallProposal["compiledRecords"]> {
  if (!proposal.compiledRecords) throw new Error("expected installable proposal");
  return proposal.compiledRecords;
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
