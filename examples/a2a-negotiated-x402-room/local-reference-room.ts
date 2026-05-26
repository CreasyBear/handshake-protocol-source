import {
  buildX402DelegatedSpendAuthorityRefInput,
  buildX402WalletGatewayCredentialRefInput,
  compileX402InstallProposal,
  type X402InstallProposal,
  type X402InstallProposalInput,
  x402DelegatedSpendAuthorityBindingFor,
  x402WalletGatewayCredentialBindingFor,
} from "../../src/adapters/x402-payment/install-proposal";
import { proposeX402PaymentActionContract } from "../../src/adapters/x402-payment/action-proposal";
import {
  runX402WalletGateway,
  type X402PaymentParameters,
  type X402PaymentSignatureCommand,
} from "../../src/adapters/x402-payment/wallet-gateway";
import { buildA2ANegotiationSupportPacket } from "../../src/surfaces/a2a-negotiation-support";
import type { ActionContract } from "../../src/protocol/areas/action-contract";
import type { GatewayCredentialRef } from "../../src/protocol/areas/credential-custody";
import type { DelegatedAuthorityRef } from "../../src/protocol/areas/delegated-authority";
import { digestCanonical } from "../../src/protocol/foundation/canonical";
import { nowIso } from "../../src/protocol/foundation/ids";
import { HandshakeKernel } from "../../src/protocol/kernel";
import { requiredGatewayCheckedBypassProbeKinds } from "../../src/protocol/public/schemas";
import { InMemoryProtocolStore } from "../../src/storage/memory";
import {
  agreementBindingForContract,
  futureIso,
  linkedAgreement,
  negotiationDecision,
  negotiationDigest,
  negotiationOffer,
  negotiationSession,
} from "./local-reference-records";

const digest = `sha256:${"c".repeat(64)}` as const;
const selectedPaymentRequirementDigest = `sha256:${"b".repeat(64)}` as const;
const obligationRef = "obligation:x402-exact-call";
const counterpartyRef = "agent:seller";

const x402CredentialRefs = new WeakMap<X402InstallProposal, GatewayCredentialRef>();
const x402AuthorityRefs = new WeakMap<X402InstallProposal, DelegatedAuthorityRef>();

export async function createNegotiatedX402Greenlight() {
  const store = new InMemoryProtocolStore();
  const kernel = new HandshakeKernel(store);
  const proposal = await compileX402InstallProposal(validInstallInput());
  const records = requireCompiledRecords(proposal);
  await kernel.putCatalogObject({ objectType: "tool_capability", payload: records.toolCapability });
  await kernel.putCatalogObject({ objectType: "action_type", payload: records.actionType });
  await kernel.putCatalogObject({ objectType: "gateway_registry_entry", payload: records.gatewayRegistryEntry });
  await kernel.putCatalogObject({ objectType: "operating_envelope", payload: records.operatingEnvelope });
  await registerX402WalletCredentialRef(kernel, proposal, records);
  await registerX402DelegatedAuthorityRef(kernel, proposal, records);

  const runtimeResult = await proposeX402PaymentActionContract(
    kernel,
    x402RuntimeConfig(proposal, records, "run_x402_a2a_negotiation"),
    {
      principalIntentRef: "intent:a2a negotiated paid context",
      generatedCodeOrSpecRef: "code:x402-a2a-fetch-wrapper",
      endpointUrl: proposal.endpointEvidence.endpointUrl,
      payee: proposal.endpointEvidence.payee,
      network: proposal.endpointEvidence.network,
      token: proposal.endpointEvidence.token,
      atomicAmount: "2500",
      paymentRequirementsDigest: proposal.endpointEvidence.paymentRequirementsDigest,
      selectedPaymentRequirementIndex: 0,
      selectedPaymentRequirementDigest,
      paymentRequiredEvidenceRef: "evidence:x402-payment-required:a2a-room",
      clearingEvidenceRefs: { obligationRef, counterpartyRef },
    },
  );
  if (runtimeResult.outcome !== "action_contract_proposed") throw new Error("expected x402 action contract");

  await recordNegotiatedX402Agreement(kernel, proposal, runtimeResult.actionContract);
  await recordGatewayCheckedPosture(kernel, proposal, records);
  const policy = await kernel.evaluatePolicy({
    actionContractId: runtimeResult.actionContract.actionContractId,
    envelopeId: records.operatingEnvelope.envelopeId,
    signingSecret: "test-secret",
  });
  if (!policy.greenlight) throw new Error(`expected x402 greenlight, got ${policy.decision.decisionReasonCode}`);
  const surface = fakeSigningSurface("unknown");
  return {
    store,
    kernel,
    proposal,
    records,
    contract: runtimeResult.actionContract,
    greenlight: policy.greenlight,
    policy,
    surface,
  };
}

export async function runNegotiatedX402Room() {
  const fixture = await createNegotiatedX402Greenlight();
  const gatewayResult = await runX402WalletGateway({
    protocol: fixture.kernel,
    surface: fixture.surface,
    actionContractId: fixture.contract.actionContractId,
    greenlightId: fixture.greenlight.greenlightId,
    observedParameters: fixture.contract.parameters as X402PaymentParameters,
    surfaceOperationRef: "surface-op:x402-a2a:first",
  });
  const replay = await runX402WalletGateway({
    protocol: fixture.kernel,
    surface: fixture.surface,
    actionContractId: fixture.contract.actionContractId,
    greenlightId: fixture.greenlight.greenlightId,
    observedParameters: fixture.contract.parameters as X402PaymentParameters,
    surfaceOperationRef: "surface-op:x402-a2a:replay",
  });
  const supportPacket = await buildA2ANegotiationSupportPacket(fixture.store, fixture.contract.actionContractId);
  return { ...fixture, gatewayResult, replay, supportPacket };
}

export function changedAmountParameters(parameters: X402PaymentParameters): X402PaymentParameters {
  return { ...parameters, atomicAmount: "2501" };
}

export function changedEndpointParameters(parameters: X402PaymentParameters): X402PaymentParameters {
  return {
    ...parameters,
    endpointUrl: "https://api.example.com/mcp/other-premium-context",
    intendedRequestUrl: "https://api.example.com/mcp/other-premium-context",
  };
}

export function changedSelectedPaymentRequirementParameters(parameters: X402PaymentParameters): X402PaymentParameters {
  return {
    ...parameters,
    selectedPaymentRequirementDigest: `sha256:${"d".repeat(64)}`,
  };
}

export function fakeSigningSurface(downstreamPaymentStatus: "succeeded" | "unknown") {
  let signatures = 0;
  const commands: X402PaymentSignatureCommand[] = [];
  return {
    signatureCount: () => signatures,
    signedCommands: () => commands,
    async signPayment(command: X402PaymentSignatureCommand) {
      signatures += 1;
      commands.push(command);
      const paymentSignature = `PAYMENT-SIGNATURE:fake:${command.verifiedGate.gateAttemptId}:${command.parameters.paymentRequirementsDigest.slice(
        "sha256:".length,
        "sha256:".length + 16,
      )}`;
      const paymentSignatureDigest = await digestCanonical({ paymentSignature });
      return {
        evidenceRef: `evidence:x402-a2a-payment-signature:${command.verifiedGate.gateAttemptId}`,
        surfaceOperationRef: command.verifiedGate.surfaceOperationRef,
        paymentSignatureHeaderName: "PAYMENT-SIGNATURE" as const,
        paymentSignatureHeaderRef: `credential:x402-a2a-local-fixture-signature:${command.verifiedGate.gateAttemptId}`,
        paymentSignatureDigest,
        paymentPayloadShape: "local_fixture_payment_signature" as const,
        credentialMaterialPosture: "local_fixture" as const,
        downstreamPaymentStatus,
        paymentResponseEvidenceRef:
          downstreamPaymentStatus === "succeeded"
            ? `evidence:x402-a2a-payment-response:${command.verifiedGate.gateAttemptId}`
            : null,
        providerRequestRef: `provider-request:x402-a2a:${command.verifiedGate.gateAttemptId}`,
        providerOperationRef: `provider-operation:x402-a2a:${command.verifiedGate.gateAttemptId}`,
      };
    },
  };
}

async function recordNegotiatedX402Agreement(
  kernel: HandshakeKernel,
  proposal: X402InstallProposal,
  contract: ActionContract,
) {
  await kernel.recordNegotiationSession(
    negotiationSession({
      negotiationSessionDigest: negotiationDigest,
      subjectResourceRef: proposal.resourceRef,
      clearingEvidenceRefs: { correlationRef: "a2a:task:x402-negotiation" },
    }),
  );
  await kernel.recordNegotiationOffer(
    negotiationOffer({
      offerObjectRefs: ["object:x402-offer:v1"],
      offerContentRefs: ["content:x402-offer:v1"],
      clearingEvidenceRefs: { obligationRef },
    }),
  );
  await kernel.recordNegotiationDecision(negotiationDecision());
  await kernel.recordLinkedAgreement(
    linkedAgreement({
      agreementObjectRefs: ["object:x402-agreement:v1"],
      agreementContentRefs: ["content:x402-agreement:v1"],
      clearingEvidenceRefs: { obligationRef, counterpartyRef },
      counterpartyRef,
    }),
  );
  await kernel.recordAgreementObligationBinding(
    agreementBindingForContract(contract, {
      obligationRef,
      counterpartyRef,
      resourceRef: contract.resourceRef,
    }),
  );
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

async function registerX402WalletCredentialRef(
  kernel: HandshakeKernel,
  proposal: X402InstallProposal,
  records: NonNullable<X402InstallProposal["compiledRecords"]>,
): Promise<GatewayCredentialRef> {
  const credentialRef = await kernel.registerGatewayCredentialRef(
    await buildX402WalletGatewayCredentialRefInput(proposal, records),
  );
  x402CredentialRefs.set(proposal, credentialRef);
  return credentialRef;
}

async function registerX402DelegatedAuthorityRef(
  kernel: HandshakeKernel,
  proposal: X402InstallProposal,
  records: NonNullable<X402InstallProposal["compiledRecords"]>,
): Promise<DelegatedAuthorityRef> {
  const authorityRef = await kernel.registerDelegatedAuthorityRef(
    await buildX402DelegatedSpendAuthorityRefInput(proposal, records),
  );
  x402AuthorityRefs.set(proposal, authorityRef);
  return authorityRef;
}

function requireCompiledRecords(proposal: X402InstallProposal): NonNullable<X402InstallProposal["compiledRecords"]> {
  if (!proposal.compiledRecords) throw new Error("expected installable x402 proposal");
  return proposal.compiledRecords;
}

function x402RuntimeConfig(
  proposal: X402InstallProposal,
  records: NonNullable<X402InstallProposal["compiledRecords"]>,
  runId: string,
) {
  const credentialRef = x402CredentialRefs.get(proposal);
  if (!credentialRef) throw new Error("expected registered x402 wallet credential ref");
  const authorityRef = x402AuthorityRefs.get(proposal);
  if (!authorityRef) throw new Error("expected registered x402 delegated authority ref");
  return {
    tenantId: proposal.tenantId,
    organizationId: proposal.organizationId,
    principalId: records.operatingEnvelope.principalId,
    agentId: records.operatingEnvelope.agentId,
    runId,
    runtimeAdapterId: records.toolCapability.runtimeAdapterId,
    operatingEnvelopeId: records.operatingEnvelope.envelopeId,
    toolCatalogRef: `${records.toolCapability.toolCatalogId}@${records.toolCapability.toolCatalogVersion}`,
    actionCatalogRef: `${records.actionType.actionCatalogId}@${records.actionType.actionCatalogVersion}`,
    gatewayRegistryRef: `gateway_registry@${records.gatewayRegistryEntry.gatewayRegistryVersion}`,
    gatewayReadinessRef: "handshake://local/x402/a2a-gateway-readiness.json",
    gatewayReadinessDigest: digest,
    policyVersionRef: `${proposal.policyPackRef}@${proposal.policyPackVersion}`,
    policyVersionDigest: digest,
    toolCapabilityId: records.toolCapability.toolCapabilityId,
    actionTypeId: records.actionType.actionTypeId,
    gatewayRegistryEntryId: records.gatewayRegistryEntry.gatewayRegistryEntryId,
    gatewayId: records.gatewayRegistryEntry.gatewayId,
    gatewayCredentialBinding: x402WalletGatewayCredentialBindingFor(credentialRef),
    delegatedAuthorityBinding: x402DelegatedSpendAuthorityBindingFor(authorityRef),
    maxAtomicAmountPerCall: proposal.spendBounds.maxAtomicAmountPerCall,
    contractExpiresAt: futureIso(),
    signingSecret: "test-secret",
  };
}

function validInstallInput(): X402InstallProposalInput {
  const issuedAt = nowIso();
  return {
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt: issuedAt,
    endpointEvidence: {
      endpointUrl: "https://api.example.com/mcp/premium-context",
      payee: "0xpayee",
      network: "base-sepolia",
      token: "USDC",
      maxAtomicAmount: "2500",
      paymentRequirementsDigest: digest,
      facilitatorRef: "facilitator:local",
      evidenceRefs: ["evidence:x402-payment-required:a2a-room"],
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
      objectiveRef: "intent:a2a negotiated paid context",
      allowedDomains: ["api.example.com"],
      allowedPayees: ["0xpayee"],
      allowedNetworks: ["base-sepolia"],
      allowedTokens: ["USDC"],
      maxAtomicAmountPerCall: "2500",
      maxAtomicAmountPerSession: "10000",
      maxAtomicAmountPerDay: "20000",
      reviewThresholdAtomicAmount: "5000",
      issuedAt,
      expiresAt: futureIso(),
    },
  };
}
