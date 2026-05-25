import { describe, expect, it } from "bun:test";
import {
  buildX402DelegatedSpendAuthorityRefInput,
  buildX402WalletGatewayCredentialRefInput,
  compileX402InstallProposal,
  type X402InstallProposal,
  type X402InstallProposalInput,
  x402DelegatedSpendAuthorityBindingFor,
  x402WalletGatewayCredentialBindingFor,
} from "../../src/adapters/x402-payment/install-proposal";
import {
  buildX402PaymentAttemptFromRequiredEvidence,
  proposeX402PaymentActionContract,
} from "../../src/adapters/x402-payment/action-proposal";
import { decodeX402PaymentRequiredEvidence } from "../../src/adapters/x402-payment/upstream-evidence";
import { digestCanonical } from "../../src/protocol/foundation/canonical";
import { HandshakeKernel } from "../../src/protocol/kernel";
import { nowIso } from "../../src/protocol/foundation/ids";
import { requiredGatewayCheckedBypassProbeKinds } from "../../src/protocol/public/schemas";
import type { GatewayCredentialRef } from "../../src/protocol/areas/credential-custody";
import type { DelegatedAuthorityRef } from "../../src/protocol/areas/delegated-authority";
import { InMemoryProtocolStore } from "../../src/storage/memory";
import { futureIso } from "../support/fixtures";

const digest = `sha256:${"b".repeat(64)}` as const;
const officialSelectedHeadersDigest = `sha256:${"d".repeat(64)}` as const;
const officialChangedHeadersDigest = `sha256:${"e".repeat(64)}` as const;
const officialPaymentIdentifier = "pay_handshake_exact_fixture_0001";

const officialX402SourceBasis = {
  repository: "https://github.com/x402-foundation/x402",
  docs: {
    http402: "https://docs.x402.org/core-concepts/http-402",
    exact: "https://docs.x402.org/schemes/exact",
    clientServer: "https://docs.x402.org/core-concepts/client-server",
    facilitator: "https://docs.x402.org/core-concepts/facilitator",
  },
  packages: {
    "@x402/core": "2.12.0",
    "@x402/evm": "2.12.0",
    "@x402/fetch": "2.12.0",
  },
  firstSlice: {
    role: "buyer",
    scheme: "exact",
    network: "eip155:84532",
    sdkSurface: ["@x402/core/types", "@x402/core/schemas", "@x402/evm/exact/client", "@x402/fetch"],
    unsupportedFirstSliceSurfaces: [
      "upto",
      "batch-settlement",
      "lifecycle-hooks",
      "mcp-auto-pay",
      "signed-offers",
      "signed-receipts",
      "seller-middleware",
      "facilitator-operation",
      "settlement-finality",
    ],
  },
} as const;

const officialPaymentRequired = {
  x402Version: 2,
  resource: {
    url: "https://api.example.com/mcp/premium-context",
    description: "Premium context for one generated engineering-agent request",
    mimeType: "application/json",
  },
  accepts: [
    {
      scheme: "exact",
      network: "eip155:84532",
      asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      amount: "2500",
      payTo: "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
      maxTimeoutSeconds: 60,
      extra: {
        assetTransferMethod: "eip3009",
        name: "USDC",
        version: "2",
      },
    },
  ],
  extensions: {
    "payment-identifier": {
      required: false,
    },
  },
} as const;

const x402CredentialRefs = new WeakMap<X402InstallProposal, GatewayCredentialRef>();
const x402AuthorityRefs = new WeakMap<X402InstallProposal, DelegatedAuthorityRef>();

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
      x402EvidenceProfile: "local_digest_profile",
      payee: "0xpayee",
      token: "USDC",
      atomicAmount: "2500",
      gatewayReadinessRef: "handshake://local/x402/gateway-readiness.json",
      gatewayReadinessDigest: digest,
      policyVersionRef: expect.stringMatching(/^policy:x402-payment-exact:/),
      policyVersionDigest: digest,
    });
    expect(result.actionContract.bounds).toMatchObject({
      maxAtomicAmountPerCall: "2500",
      gatewayReadinessDigest: digest,
      policyVersionDigest: digest,
    });
    expect(result.actionContract.gatewayCredentialRefs).toEqual([
      x402WalletGatewayCredentialBindingFor(requireX402CredentialRef(proposal)),
    ]);
    expect(result.actionContract.delegatedAuthorityRefs).toEqual([
      x402DelegatedSpendAuthorityBindingFor(requireX402AuthorityRef(proposal)),
    ]);
    expect(result.actionContract.delegatedAuthorityRefs[0]?.authorityUseName).toBe("x402_delegated_spend");
    expect(result.actionContract.gatewayCredentialRefs[0]?.credentialUseName).toBe("x402_wallet_signer");
    expect(result.actionContract.evidenceRefs).toEqual(
      expect.arrayContaining(requireX402CredentialRef(proposal).evidenceExpectationRefs),
    );
    expect(JSON.stringify(result.actionContract.bounds)).not.toContain("maxAtomicAmountPerSession");
    expect(JSON.stringify(result.actionContract.bounds)).not.toContain("maxAtomicAmountPerDay");
    expect(JSON.stringify(result.actionContract.bounds)).not.toContain("reviewThresholdAtomicAmount");
    expect(await store.listRecordsByType("greenlight")).toHaveLength(0);
  });

  it("refuses stale x402 signer credential refs before policy or gateway authority", async () => {
    const { kernel, store, proposal } = await installedX402Kernel();
    const records = requireCompiledRecords(proposal);
    const staleCredentialRef = await kernel.registerGatewayCredentialRef({
      ...(await buildX402WalletGatewayCredentialRefInput(proposal, records)),
      gatewayCredentialRefId: "gcr_x402_wallet_stale",
      expiresAt: "1970-01-01T00:00:00.000Z",
    });
    x402CredentialRefs.set(proposal, staleCredentialRef);

    await expect(
      proposeX402PaymentActionContract(kernel, runtimeConfig(proposal, records), {
        principalIntentRef: "intent:fetch paid context with stale signer custody",
        generatedCodeOrSpecRef: "code:x402-fetch-wrapper",
        endpointUrl: proposal.endpointEvidence.endpointUrl,
        payee: proposal.endpointEvidence.payee,
        network: proposal.endpointEvidence.network,
        token: proposal.endpointEvidence.token,
        atomicAmount: "2500",
        paymentRequirementsDigest: proposal.endpointEvidence.paymentRequirementsDigest,
        paymentRequiredEvidenceRef: "evidence:x402-payment-required",
      }),
    ).rejects.toThrow("Gateway credential ref is stale.");
    expect(await store.listRecordsByType("policy_decision")).toHaveLength(0);
    expect(await store.listRecordsByType("gateway_check_attempt")).toHaveLength(0);
    expect(await store.listRecordsByType("mutation_attempt")).toHaveLength(0);
  });

  it("binds non-identifier idempotency to x402 provider posture material", async () => {
    const { kernel, proposal } = await installedX402Kernel();
    const records = requireCompiledRecords(proposal);
    const baseAttempt = {
      principalIntentRef: "intent:fetch paid context",
      generatedCodeOrSpecRef: "code:x402-fetch-wrapper",
      endpointUrl: proposal.endpointEvidence.endpointUrl,
      payee: proposal.endpointEvidence.payee,
      network: proposal.endpointEvidence.network,
      token: proposal.endpointEvidence.token,
      atomicAmount: "2500",
      paymentRequirementsDigest: proposal.endpointEvidence.paymentRequirementsDigest,
      paymentRequiredEvidenceRef: "evidence:x402-payment-required",
      providerEnvironmentPosture: "local_reference_sandbox" as const,
    };

    const first = await proposeX402PaymentActionContract(kernel, runtimeConfig(proposal, records), baseAttempt);
    const changedProviderRef = await proposeX402PaymentActionContract(kernel, runtimeConfig(proposal, records), {
      ...baseAttempt,
      providerEnvironmentRef: "provider-environment:x402-local-reference-sandbox",
    });

    expect(first.outcome).toBe("action_contract_proposed");
    expect(changedProviderRef.outcome).toBe("action_contract_proposed");
    if (first.outcome !== "action_contract_proposed") throw new Error("expected first contract");
    if (changedProviderRef.outcome !== "action_contract_proposed") throw new Error("expected changed contract");
    expect(first.actionContract.parameters.providerEnvironmentRef).toBeNull();
    expect(changedProviderRef.actionContract.parameters.providerEnvironmentRef).toBe(
      "provider-environment:x402-local-reference-sandbox",
    );
    expect(first.actionContract.idempotencyKey).toStartWith("x402-payment:");
    expect(changedProviderRef.actionContract.idempotencyKey).toStartWith("x402-payment:");
    expect(changedProviderRef.actionContract.idempotencyKey).not.toBe(first.actionContract.idempotencyKey);
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

  it("derives an exact contract from upstream PaymentRequired evidence and intended request binding", async () => {
    const first = await proposeOfficialExactContract(officialSelectedHeadersDigest);
    const changedHeaders = await proposeOfficialExactContract(officialChangedHeadersDigest);

    expect(first.result.outcome).toBe("action_contract_proposed");
    expect(changedHeaders.result.outcome).toBe("action_contract_proposed");
    if (first.result.outcome !== "action_contract_proposed") throw new Error("expected upstream contract");
    if (changedHeaders.result.outcome !== "action_contract_proposed") throw new Error("expected changed contract");

    expect(first.result.actionContract.parameters).toMatchObject({
      endpointUrl: officialPaymentRequired.resource.url,
      endpointDomain: "api.example.com",
      intendedHttpMethod: "GET",
      intendedRequestUrl: officialPaymentRequired.resource.url,
      intendedRequestBodyPosture: "no_body",
      intendedRequestBodyDigest: null,
      selectedHeadersDigest: officialSelectedHeadersDigest,
      providerEnvironmentPosture: "local_reference_sandbox",
      providerEnvironmentRef: null,
      x402Version: 2,
      x402Scheme: "exact",
      network: "eip155:84532",
      token: officialPaymentRequired.accepts[0].asset,
      asset: officialPaymentRequired.accepts[0].asset,
      payee: officialPaymentRequired.accepts[0].payTo,
      payTo: officialPaymentRequired.accepts[0].payTo,
      atomicAmount: "2500",
      x402EvidenceProfile: "official_payment_required",
      maxTimeoutSeconds: 60,
      selectedPaymentRequirementIndex: 0,
      paymentIdentifierPosture: "advertised_absent",
      paymentIdentifierRef: null,
      paymentIdentifierDigest: null,
      sdkPackageVersions: {
        "@x402/core": "2.12.0",
        "@x402/evm": "2.12.0",
        "@x402/fetch": "2.12.0",
      },
      extensionKeys: ["payment-identifier"],
    });
    expect(first.result.actionContract.parameters.selectedPaymentRequirementDigest).toBe(
      first.evidence.selectedPaymentRequirementDigest,
    );
    expect(first.result.actionContract.parameters.selectedPaymentRequirementIndex).toBe(
      first.evidence.selectedPaymentRequirementIndex,
    );
    expect(first.result.actionContract.secretRefs).toEqual({});
    expect(first.result.actionContract.expectedSideEffectCodes).toEqual(["x402_payment_signature_created"]);
    expect(first.result.actionContract.paramsDigest).not.toBe(changedHeaders.result.actionContract.paramsDigest);
    expect(await first.store.listRecordsByType("greenlight")).toHaveLength(0);
    expect(await first.store.listRecordsByType("gateway_check_attempt")).toHaveLength(0);
    expect(await first.store.listRecordsByType("mutation_attempt")).toHaveLength(0);
    expect(await first.store.listRecordsByType("receipt")).toHaveLength(0);
  });

  it("links upstream Payment-Identifier to Handshake idempotency without replacing one-use greenlights", async () => {
    const selectedEvidence = await officialPaymentRequiredEvidence(officialSelectedHeadersDigest);
    const changedEvidence = await officialPaymentRequiredEvidence(officialChangedHeadersDigest);
    const { kernel, proposal } = await installedOfficialX402Kernel(selectedEvidence.selectedPaymentRequirementDigest);
    const records = requireCompiledRecords(proposal);

    const first = await proposeX402PaymentActionContract(
      kernel,
      runtimeConfig(proposal, records),
      await buildX402PaymentAttemptFromRequiredEvidence({
        evidence: selectedEvidence,
        principalIntentRef: "intent:fetch paid context",
        generatedCodeOrSpecRef: "code:official-x402-fetch-wrapper",
        paymentIdentifier: officialPaymentIdentifier,
      }),
    );
    const changed = await proposeX402PaymentActionContract(
      kernel,
      runtimeConfig(proposal, records),
      await buildX402PaymentAttemptFromRequiredEvidence({
        evidence: changedEvidence,
        principalIntentRef: "intent:fetch paid context",
        generatedCodeOrSpecRef: "code:official-x402-fetch-wrapper",
        paymentIdentifier: officialPaymentIdentifier,
      }),
    );

    expect(first.outcome).toBe("action_contract_proposed");
    expect(changed.outcome).toBe("action_contract_proposed");
    if (first.outcome !== "action_contract_proposed") throw new Error("expected first contract");
    if (changed.outcome !== "action_contract_proposed") throw new Error("expected changed contract");

    const paymentIdentifierDigest = await digestCanonical({
      paymentIdentifier: officialPaymentIdentifier,
      paymentIdentifierExtension: "payment-identifier",
    });
    expect(first.actionContract.parameters).toMatchObject({
      paymentIdentifierPosture: "bound",
      paymentIdentifierDigest,
    });
    expect(first.actionContract.idempotencyKey).toStartWith("x402-payment-id:");
    expect(changed.actionContract.idempotencyKey).toBe(first.actionContract.idempotencyKey);
    expect(changed.actionContract.paramsDigest).not.toBe(first.actionContract.paramsDigest);

    await recordGatewayCheckedPosture(kernel, proposal, records);
    const firstPolicy = await kernel.evaluatePolicy({
      actionContractId: first.actionContract.actionContractId,
      envelopeId: records.operatingEnvelope.envelopeId,
      signingSecret: "test-secret",
    });
    const changedPolicy = await kernel.evaluatePolicy({
      actionContractId: changed.actionContract.actionContractId,
      envelopeId: records.operatingEnvelope.envelopeId,
      signingSecret: "test-secret",
    });

    expect(firstPolicy.decision.decision).toBe("greenlight");
    expect(firstPolicy.greenlight).not.toBeNull();
    expect(changedPolicy.decision.decision).toBe("refuse");
    expect(changedPolicy.decision.decisionReasonCode).toBe("idempotency_key_params_mismatch");
    expect(changedPolicy.greenlight).toBeNull();
  });

  it("refuses official-profile attempts when upstream evidence binding is incomplete", async () => {
    const { kernel, store, proposal } = await installedX402Kernel();
    const records = requireCompiledRecords(proposal);

    const result = await proposeX402PaymentActionContract(kernel, runtimeConfig(proposal, records), {
      principalIntentRef: "intent:fetch paid context",
      generatedCodeOrSpecRef: "code:official-shaped-x402-fetch-wrapper",
      endpointUrl: proposal.endpointEvidence.endpointUrl,
      payee: proposal.endpointEvidence.payee,
      network: proposal.endpointEvidence.network,
      token: proposal.endpointEvidence.token,
      atomicAmount: "2500",
      x402EvidenceProfile: "official_payment_required",
      paymentRequirementsDigest: proposal.endpointEvidence.paymentRequirementsDigest,
      paymentRequiredEvidenceRef: "evidence:x402-payment-required",
      intendedHttpMethod: "GET",
      intendedRequestUrl: proposal.endpointEvidence.endpointUrl,
      selectedHeadersDigest: officialSelectedHeadersDigest,
      x402Version: 2,
      x402Scheme: "exact",
      asset: proposal.endpointEvidence.token,
      payTo: proposal.endpointEvidence.payee,
      maxTimeoutSeconds: 60,
      sdkPackageVersions: officialX402SourceBasis.packages,
    });

    expect(result).toEqual({
      outcome: "payment_attempt_refused",
      intentCompilation: null,
      actionContract: null,
      refusalReasonCodes: ["x402_official_payment_required_evidence_incomplete"],
    });
    expect(await store.listRecordsByType("intent_compilation")).toHaveLength(0);
    expect(await store.listRecordsByType("action_contract")).toHaveLength(0);
    expect(await store.listRecordsByType("greenlight")).toHaveLength(0);
  });

  it("refuses ambiguous request-body and live-environment posture before compilation", async () => {
    const evidence = await officialPaymentRequiredEvidence(officialSelectedHeadersDigest, {
      requestBodyPosture: "unsupported",
      providerEnvironmentPosture: "live",
      providerEnvironmentRef: "provider-environment:x402-live",
    });
    const { kernel, store, proposal } = await installedOfficialX402Kernel(evidence.selectedPaymentRequirementDigest);
    const records = requireCompiledRecords(proposal);

    const result = await proposeX402PaymentActionContract(
      kernel,
      runtimeConfig(proposal, records),
      await buildX402PaymentAttemptFromRequiredEvidence({
        evidence,
        principalIntentRef: "intent:fetch paid context",
        generatedCodeOrSpecRef: "code:official-x402-live-wrapper",
      }),
    );

    expect(result).toEqual({
      outcome: "payment_attempt_refused",
      intentCompilation: null,
      actionContract: null,
      refusalReasonCodes: ["x402_provider_environment_not_sandboxed", "x402_request_body_posture_unsupported"],
    });
    expect(await store.listRecordsByType("intent_compilation")).toHaveLength(0);
    expect(await store.listRecordsByType("action_contract")).toHaveLength(0);
    expect(await store.listRecordsByType("greenlight")).toHaveLength(0);
    expect(await store.listRecordsByType("gateway_check_attempt")).toHaveLength(0);
  });

  it("refuses external sandbox posture until the x402 path has a local/reference firewall", async () => {
    const evidence = await officialPaymentRequiredEvidence(officialSelectedHeadersDigest, {
      providerEnvironmentPosture: "external_sandbox",
      providerEnvironmentRef: "provider-environment:x402-external-sandbox",
    });
    const { kernel, store, proposal } = await installedOfficialX402Kernel(evidence.selectedPaymentRequirementDigest);
    const records = requireCompiledRecords(proposal);

    const result = await proposeX402PaymentActionContract(
      kernel,
      runtimeConfig(proposal, records),
      await buildX402PaymentAttemptFromRequiredEvidence({
        evidence,
        principalIntentRef: "intent:fetch paid context from external sandbox",
        generatedCodeOrSpecRef: "code:official-x402-external-sandbox-wrapper",
      }),
    );

    expect(result).toEqual({
      outcome: "payment_attempt_refused",
      intentCompilation: null,
      actionContract: null,
      refusalReasonCodes: ["x402_provider_environment_not_sandboxed"],
    });
    expect(await store.listRecordsByType("intent_compilation")).toHaveLength(0);
    expect(await store.listRecordsByType("action_contract")).toHaveLength(0);
    expect(await store.listRecordsByType("greenlight")).toHaveLength(0);
    expect(await store.listRecordsByType("gateway_check_attempt")).toHaveLength(0);
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
  await registerX402WalletCredentialRef(kernel, proposal, records);
  await registerX402DelegatedAuthorityRef(kernel, proposal, records);
  return { kernel, store, proposal };
}

function requireCompiledRecords(proposal: X402InstallProposal): NonNullable<X402InstallProposal["compiledRecords"]> {
  if (!proposal.compiledRecords) throw new Error("expected installable proposal");
  return proposal.compiledRecords;
}

function runtimeConfig(proposal: X402InstallProposal, records: NonNullable<X402InstallProposal["compiledRecords"]>) {
  const credentialRef = x402CredentialRefs.get(proposal);
  if (!credentialRef) throw new Error("expected registered x402 wallet credential ref");
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
    gatewayReadinessRef: "handshake://local/x402/gateway-readiness.json",
    gatewayReadinessDigest: digest,
    policyVersionRef: `${proposal.policyPackRef}@${proposal.policyPackVersion}`,
    policyVersionDigest: digest,
    toolCapabilityId: records.toolCapability.toolCapabilityId,
    actionTypeId: records.actionType.actionTypeId,
    gatewayRegistryEntryId: records.gatewayRegistryEntry.gatewayRegistryEntryId,
    gatewayId: records.gatewayRegistryEntry.gatewayId,
    gatewayCredentialBinding: x402WalletGatewayCredentialBindingFor(credentialRef),
    delegatedAuthorityBinding: x402DelegatedSpendAuthorityBindingFor(requireX402AuthorityRef(proposal)),
    maxAtomicAmountPerCall: proposal.spendBounds.maxAtomicAmountPerCall,
    contractExpiresAt: futureIso(),
    signingSecret: "test-secret",
  };
}

function requireX402CredentialRef(proposal: X402InstallProposal): GatewayCredentialRef {
  const credentialRef = x402CredentialRefs.get(proposal);
  if (!credentialRef) throw new Error("expected registered x402 wallet credential ref");
  return credentialRef;
}

function requireX402AuthorityRef(proposal: X402InstallProposal): DelegatedAuthorityRef {
  const authorityRef = x402AuthorityRefs.get(proposal);
  if (!authorityRef) throw new Error("expected registered x402 delegated authority ref");
  return authorityRef;
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

async function proposeOfficialExactContract(selectedHeadersDigest: `sha256:${string}`) {
  const evidence = await officialPaymentRequiredEvidence(selectedHeadersDigest);
  const { kernel, store, proposal } = await installedOfficialX402Kernel(evidence.selectedPaymentRequirementDigest);
  const records = requireCompiledRecords(proposal);
  const result = await proposeX402PaymentActionContract(
    kernel,
    runtimeConfig(proposal, records),
    await buildX402PaymentAttemptFromRequiredEvidence({
      evidence,
      principalIntentRef: "intent:fetch paid context",
      generatedCodeOrSpecRef: "code:official-x402-fetch-wrapper",
    }),
  );
  return { evidence, result, store };
}

async function officialPaymentRequiredEvidence(
  selectedHeadersDigest: `sha256:${string}`,
  overrides: Partial<{
    requestBodyPosture: "no_body" | "digest_bound" | "omitted" | "unsupported";
    bodyDigest: `sha256:${string}` | null;
    providerEnvironmentPosture: "local_reference_sandbox" | "external_sandbox" | "live" | "unknown";
    providerEnvironmentRef: string | null;
  }> = {},
) {
  return decodeX402PaymentRequiredEvidence({
    source: officialX402SourceBasis,
    paymentRequiredHeader: base64Json(officialPaymentRequired),
    selectedPaymentRequirementIndex: 0,
    intendedRequest: {
      method: "GET",
      url: officialPaymentRequired.resource.url,
      requestBodyPosture: overrides.requestBodyPosture ?? "no_body",
      bodyDigest: overrides.bodyDigest ?? null,
      selectedHeadersDigest,
      providerEnvironmentPosture: overrides.providerEnvironmentPosture ?? "local_reference_sandbox",
      providerEnvironmentRef: overrides.providerEnvironmentRef ?? null,
    },
  });
}

async function installedOfficialX402Kernel(paymentRequirementsDigest: `sha256:${string}`): Promise<{
  kernel: HandshakeKernel;
  store: InMemoryProtocolStore;
  proposal: X402InstallProposal;
}> {
  const store = new InMemoryProtocolStore();
  const kernel = new HandshakeKernel(store);
  const proposal = await compileX402InstallProposal(officialInstallInput(paymentRequirementsDigest));
  const records = requireCompiledRecords(proposal);
  await kernel.putCatalogObject({ objectType: "tool_capability", payload: records.toolCapability });
  await kernel.putCatalogObject({ objectType: "action_type", payload: records.actionType });
  await kernel.putCatalogObject({ objectType: "gateway_registry_entry", payload: records.gatewayRegistryEntry });
  await kernel.putCatalogObject({ objectType: "operating_envelope", payload: records.operatingEnvelope });
  await registerX402WalletCredentialRef(kernel, proposal, records);
  await registerX402DelegatedAuthorityRef(kernel, proposal, records);
  return { kernel, store, proposal };
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

function officialInstallInput(paymentRequirementsDigest: `sha256:${string}`): X402InstallProposalInput {
  const createdAt = nowIso();
  return {
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt,
    endpointEvidence: {
      endpointUrl: officialPaymentRequired.resource.url,
      payee: officialPaymentRequired.accepts[0].payTo,
      network: officialPaymentRequired.accepts[0].network,
      token: officialPaymentRequired.accepts[0].asset,
      maxAtomicAmount: officialPaymentRequired.accepts[0].amount,
      paymentRequirementsDigest,
      facilitatorRef: "facilitator:local",
      evidenceRefs: ["evidence:x402-payment-required"],
    },
    walletGatewayProfile: {
      walletGatewayId: "wallet_gateway_local",
      gatewayId: "gateway_x402_wallet",
      signerCustodyStatus: "fixture_gateway_held",
      signerRef: "secretref:local-fake-signer",
      authorityHolderRef: "gateway-authority:x402-wallet",
      supportedNetworks: [officialPaymentRequired.accepts[0].network],
      supportedTokens: [officialPaymentRequired.accepts[0].asset],
    },
    spendBounds: {
      principalId: "principal_demo",
      agentId: "agent_demo",
      runtimeAdapterId: "runtime_codex",
      objectiveRef: "intent:fetch paid context",
      allowedDomains: ["api.example.com"],
      allowedPayees: [officialPaymentRequired.accepts[0].payTo],
      allowedNetworks: [officialPaymentRequired.accepts[0].network],
      allowedTokens: [officialPaymentRequired.accepts[0].asset],
      maxAtomicAmountPerCall: officialPaymentRequired.accepts[0].amount,
      maxAtomicAmountPerSession: "10000",
      maxAtomicAmountPerDay: "20000",
      reviewThresholdAtomicAmount: officialPaymentRequired.accepts[0].amount,
      issuedAt: createdAt,
      expiresAt: futureIso(),
    },
  };
}

function base64Json(value: unknown): string {
  return btoa(JSON.stringify(value));
}
