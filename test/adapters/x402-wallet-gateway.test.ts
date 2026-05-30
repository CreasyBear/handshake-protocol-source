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
import { requireInstallProposalGatewayRegistryEntry } from "../../src/install/install-proposal";
import {
  buildX402PaymentAttemptFromRequiredEvidence,
  proposeX402PaymentActionContract,
} from "../../src/adapters/x402-payment/action-proposal";
import { decodeX402PaymentRequiredEvidence } from "../../src/adapters/x402-payment/upstream-evidence";
import {
  createOfficialExactX402SigningSurface,
  runX402WalletGateway,
  type X402PaymentParameters,
  type X402PaymentSignatureCommand,
  type X402PaymentSignatureEvidence,
} from "../../src/adapters/x402-payment/wallet-gateway";
import {
  createLocalX402PaidHttpSandbox,
  createLocalX402SandboxSigningSurface,
} from "../../src/adapters/x402-payment/sandbox-http";
import type { ProofGap } from "../../src/protocol/areas/proof-gap";
import { HandshakeKernel } from "../../src/protocol/kernel";
import { digestCanonical } from "../../src/protocol/foundation/canonical";
import { nowIso } from "../../src/protocol/foundation/ids";
import type { GatewayCredentialRef } from "../../src/protocol/areas/credential-custody";
import type { DelegatedAuthorityRef } from "../../src/protocol/areas/delegated-authority";
import { requiredGatewayCheckedBypassProbeKinds } from "../../src/protocol/public/schemas";
import { InMemoryProtocolStore } from "../../src/storage/memory";
import { futureIso } from "../support/fixtures";
import { localX402PaymentAttemptBindings } from "../support/install-proposal-helpers";

const digest = `sha256:${"c".repeat(64)}` as const;
const officialSelectedHeadersDigest = `sha256:${"d".repeat(64)}` as const;
const officialSignerAddress = "0x1111111111111111111111111111111111111111" as const;
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
    expect(result.gatewayCheck.gateAttempt.gateDecision).toBe("passed");
    expect(result.gatewayCheck.mutationAttempt).not.toBeNull();
    if (!result.gatewayCheck.mutationAttempt) throw new Error("expected x402 mutation attempt");
    if (!result.gatewayCheck.mutationAttempt.surfaceOperationRef) {
      throw new Error("expected x402 surface operation ref");
    }
    expect(surface.signedCommands()).toHaveLength(1);
    expect(surface.signedCommands()[0]?.verifiedGate).toEqual({
      gatewayCheckStatus: "passed",
      gateAttemptId: result.gatewayCheck.gateAttempt.gateAttemptId,
      mutationAttemptId: result.gatewayCheck.mutationAttempt.mutationAttemptId,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      gatewayId: fixture.contract.gatewayId,
      actionClass: "x402_payment.exact",
      resourceRef: fixture.contract.resourceRef,
      idempotencyKey: fixture.contract.idempotencyKey,
      surfaceOperationRef: result.gatewayCheck.mutationAttempt.surfaceOperationRef,
    });
    expect(surface.signedCommands()[0]?.credentialResolutionEvidence).toMatchObject({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      gateAttemptId: result.gatewayCheck.gateAttempt.gateAttemptId,
      gatewayCredentialRefId: (fixture.contract.parameters as X402PaymentParameters).gatewayCredentialRefId,
      gatewayCredentialRefDigest: (fixture.contract.parameters as X402PaymentParameters).gatewayCredentialRefDigest,
      resultClass: "used_by_gateway",
      credentialMaterialIncluded: false,
    });
    expect(surface.signedCommands()[0]?.credentialUseRef).toBe(
      `gateway-credential-use:x402:${result.gatewayCheck.gateAttempt.gateAttemptId}`,
    );
    expect(result.signatureEvidence).toMatchObject({
      paymentSignatureHeaderName: "PAYMENT-SIGNATURE",
      paymentPayloadShape: "local_fixture_payment_signature",
      credentialMaterialPosture: "local_fixture",
    });
    expect(result.signatureEvidence?.paymentSignatureHeaderRef).toStartWith("credential:x402-local-fixture-signature:");
    expect(result.credentialResolutionEvidence?.credentialResolutionEvidenceId).toBe(
      surface.signedCommands()[0]?.credentialResolutionEvidence.credentialResolutionEvidenceId,
    );
    expect(result.reconciliation?.evidenceRefs).toContain(
      `credential_resolution_evidence:${result.credentialResolutionEvidence?.credentialResolutionEvidenceId}`,
    );
    expect(result.reconciliation?.observedDownstreamStatus).toBe("succeeded");
    expect(await fixture.store.listRecordsByType("credential_resolution_evidence")).toHaveLength(1);
    expect(await fixture.store.listRecordsByType("proof_gap")).toHaveLength(0);
  });

  it("does not invoke the signer when post-gate credential resolution evidence cannot be recorded", async () => {
    const fixture = await greenlitX402Contract();
    const surface = fakeSigningSurface("succeeded");

    const result = await runX402WalletGateway({
      protocol: {
        gatewayCheck: (input) => fixture.kernel.gatewayCheck(input),
        recordCredentialResolutionEvidence: async () => {
          throw new Error("vault resolution unavailable");
        },
        reconcileSurfaceOperation: (input) => fixture.kernel.reconcileSurfaceOperation(input),
      },
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters as X402PaymentParameters,
      surfaceOperationRef: "surface-op:x402-credential-resolution-failure",
    });

    expect(result.outcome).toBe("payment_signature_failed");
    expect(result.gatewayCheck.gateAttempt.gateDecision).toBe("passed");
    expect(result.credentialResolutionEvidence).toBeNull();
    expect(result.signatureEvidence).toBeNull();
    expect(surface.signatureCount()).toBe(0);
    expect(surface.signedCommands()).toEqual([]);
    expect(await fixture.store.listRecordsByType("credential_resolution_evidence")).toHaveLength(0);
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
    expect(result.gatewayCheck.mutationAttempt).toBeNull();
    expect(result.gatewayCheck.receipt.mutationAttemptId).toBeNull();
    expect(surface.signatureCount()).toBe(0);
    expect(surface.signedCommands()).toEqual([]);
    expect(await fixture.store.listRecordsByType("mutation_attempt")).toHaveLength(0);
  });

  it("refuses a consumed x402 greenlight replay before signing or mutation", async () => {
    const fixture = await greenlitX402Contract();
    const surface = fakeSigningSurface("succeeded");
    const input = {
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters as X402PaymentParameters,
    };

    const first = await runX402WalletGateway({
      ...input,
      surfaceOperationRef: "surface-op:x402:first",
    });
    const replay = await runX402WalletGateway({
      ...input,
      surfaceOperationRef: "surface-op:x402:replay",
    });

    expect(first.outcome).toBe("payment_signature_reconciled");
    expect(replay.outcome).toBe("gateway_check_refused");
    expect(replay.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("already_consumed");
    expect(replay.gatewayCheck.receipt.greenlightConsumptionStatus).toBe("replayed");
    expect(replay.gatewayCheck.mutationAttempt).toBeNull();
    expect(surface.signatureCount()).toBe(1);
    expect(surface.signedCommands()).toHaveLength(1);
    expect(await fixture.store.listRecordsByType("mutation_attempt")).toHaveLength(1);
    expect(await fixture.store.listRecordsByType("refusal")).toHaveLength(1);
    expect(await fixture.store.listRecordsByType("receipt")).toHaveLength(2);
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
    expect(result.gatewayCheck.mutationAttempt).not.toBeNull();
    if (!result.gatewayCheck.mutationAttempt) throw new Error("expected x402 proof-gap mutation attempt");
    expect(result.gatewayCheck.receipt.mutationAttemptId).toBe(result.gatewayCheck.mutationAttempt.mutationAttemptId);
    const proofGaps = await fixture.store.listRecordsByType<ProofGap>("proof_gap");
    expect(proofGaps).toHaveLength(1);
    expect(proofGaps[0]?.payload.reasonCode).toBe("orphan_mitigation_required");
  });

  it("creates an official SDK PaymentPayload only after a verified gateway check", async () => {
    const fixture = await greenlitOfficialX402Contract();
    const signer = trackedOfficialSigner();
    const surface = createOfficialExactX402SigningSurface({
      signer: signer.surfaceSigner,
      paymentRequired: officialPaymentRequired,
      selectedPaymentRequirementIndex: fixture.evidence.selectedPaymentRequirementIndex,
      selectedPaymentRequirementDigest: fixture.evidence.selectedPaymentRequirementDigest,
      downstreamPaymentStatus: "unknown",
    });

    const result = await runX402WalletGateway({
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters as X402PaymentParameters,
    });

    expect(result.outcome).toBe("payment_signature_proof_gap");
    expect(signer.signatureCount()).toBe(1);
    expect(result.gatewayCheck.gateAttempt.gateDecision).toBe("passed");
    if (!result.signatureEvidence) throw new Error("expected official payment signature evidence");
    expect(result.signatureEvidence).toMatchObject({
      paymentSignatureHeaderName: "PAYMENT-SIGNATURE",
      paymentPayloadShape: "official_x402_payment_payload_v2",
      credentialMaterialPosture: "gateway_held_redacted",
    });
    expect(result.signatureEvidence.paymentSignatureHeaderRef).toStartWith("credential:x402-payment-signature:");
    expect(result.signatureEvidence.paymentPayloadRef).toStartWith("credential:x402-payment-payload:");
    expect(result.signatureEvidence.paymentPayloadDigest).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(JSON.stringify(result.signatureEvidence)).not.toContain("0x" + "a".repeat(130));
    expect(JSON.stringify(result.signatureEvidence)).not.toContain('paymentSignature":"');
  });

  it("structurally refuses a forged verified gate at the official signer (D-64)", async () => {
    const fixture = await greenlitOfficialX402Contract();
    const signer = trackedOfficialSigner();
    const surface = createOfficialExactX402SigningSurface({
      signer: signer.surfaceSigner,
      paymentRequired: officialPaymentRequired,
      selectedPaymentRequirementIndex: fixture.evidence.selectedPaymentRequirementIndex,
      selectedPaymentRequirementDigest: fixture.evidence.selectedPaymentRequirementDigest,
      downstreamPaymentStatus: "unknown",
    });

    let capturedCommand: X402PaymentSignatureCommand | null = null;
    const capturingSurface = {
      async signPayment(command: X402PaymentSignatureCommand) {
        capturedCommand = command;
        return surface.signPayment(command);
      },
    };

    const result = await runX402WalletGateway({
      protocol: fixture.kernel,
      surface: capturingSurface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters as X402PaymentParameters,
    });
    expect(result.outcome).toBe("payment_signature_proof_gap");
    if (!capturedCommand) throw new Error("expected captured official signing command");
    const validCommand: X402PaymentSignatureCommand = capturedCommand;

    const forgedGate: X402PaymentSignatureCommand = {
      ...validCommand,
      verifiedGate: { ...validCommand.verifiedGate, gateAttemptId: "" },
    };
    await expect(surface.signPayment(forgedGate)).rejects.toThrow();

    const unboundCredential: X402PaymentSignatureCommand = {
      ...validCommand,
      credentialResolutionEvidence: {
        ...validCommand.credentialResolutionEvidence,
        gateAttemptId: "gate_other_9999",
      },
    };
    await expect(surface.signPayment(unboundCredential)).rejects.toThrow();
  });

  it("records a local sandbox 402 challenge and signed retry only after gateway admission", async () => {
    const fixture = await greenlitOfficialX402Contract();
    const sandbox = createLocalX402PaidHttpSandbox({
      source: officialX402SourceBasis,
      paymentRequired: officialPaymentRequired,
      selectedPaymentRequirementIndex: fixture.evidence.selectedPaymentRequirementIndex,
      intendedRequest: {
        method: "GET",
        url: officialPaymentRequired.resource.url,
        requestBodyPosture: "no_body",
        bodyDigest: null,
        selectedHeadersDigest: officialSelectedHeadersDigest,
        providerEnvironmentPosture: "local_reference_sandbox",
        providerEnvironmentRef: "provider-environment:x402-local-reference-sandbox",
      },
      paymentResponseEvidenceRef: "evidence:x402-local-sandbox-payment-response:test",
      providerRequestRef: "provider-request:x402-local-sandbox:test",
      providerOperationRef: "provider-operation:x402-local-sandbox:test",
    });
    const challenge = await sandbox.requestPaymentRequired();
    expect(challenge).toMatchObject({
      outcome: "payment_required",
      status: 402,
      authorityCreated: false,
      providerRequestRef: "provider-request:x402-local-sandbox:test",
      providerOperationRef: "provider-operation:x402-local-sandbox:test",
      evidenceBoundary: {
        boundaryKind: "x402_local_reference_sandbox",
        evidenceProfile: "local_reference_downstream_fixture",
        signedRetryPosture: "not_observed",
        settlementFinalityClaimed: false,
        facilitatorOperationClaimed: false,
        sellerMiddlewareClaimed: false,
        providerCustodyClaimed: false,
      },
    });
    expect(challenge.evidence.authorityCreated).toBe(false);
    expect(sandbox.snapshot()).toMatchObject({ challengeCount: 1, signedRetryCount: 0 });

    const signer = trackedOfficialSigner();
    const surface = createLocalX402SandboxSigningSurface({
      sandbox,
      signer: signer.surfaceSigner,
      paymentRequired: officialPaymentRequired,
      selectedPaymentRequirementIndex: fixture.evidence.selectedPaymentRequirementIndex,
      selectedPaymentRequirementDigest: fixture.evidence.selectedPaymentRequirementDigest,
    });
    const input = {
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters as X402PaymentParameters,
    };

    const first = await runX402WalletGateway({
      ...input,
      surfaceOperationRef: "surface-op:x402-local-sandbox:first",
    });
    const replay = await runX402WalletGateway({
      ...input,
      surfaceOperationRef: "surface-op:x402-local-sandbox:replay",
    });

    expect(first.outcome).toBe("payment_signature_reconciled");
    expect(first.signatureEvidence).toMatchObject({
      downstreamPaymentStatus: "succeeded",
      paymentResponseEvidenceRef: "evidence:x402-local-sandbox-payment-response:test",
      providerRequestRef: "provider-request:x402-local-sandbox:test",
      providerOperationRef: "provider-operation:x402-local-sandbox:test",
    });
    expect(first.signatureEvidence?.additionalEvidenceRefs).toEqual(["evidence:x402-local-sandbox-signed-retry:1"]);
    expect(first.signatureEvidence?.localReferenceSandboxBoundary).toMatchObject({
      boundaryKind: "x402_local_reference_sandbox",
      evidenceProfile: "local_reference_downstream_fixture",
      signedRetryPosture: "post_gateway_check_observation_only",
      authorityCreated: false,
      paymentFinalityClaimed: false,
      settlementFinalityClaimed: false,
      facilitatorOperationClaimed: false,
      sellerMiddlewareClaimed: false,
      providerCustodyClaimed: false,
      liveProviderOperationClaimed: false,
    });
    expect(first.reconciliation?.evidenceRefs).toContain("evidence:x402-local-sandbox-signed-retry:1");
    expect(replay.outcome).toBe("gateway_check_refused");
    expect(replay.signatureEvidence).toBeNull();
    expect(replay.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("already_consumed");
    expect(signer.signatureCount()).toBe(1);
    expect(sandbox.snapshot().signedRetryCount).toBe(1);
  });

  it("refuses local sandbox retry evidence gaps without incrementing signed retry count", async () => {
    const fixture = await greenlitOfficialX402Contract();
    const sandbox = createLocalX402PaidHttpSandbox({
      source: officialX402SourceBasis,
      paymentRequired: officialPaymentRequired,
      selectedPaymentRequirementIndex: fixture.evidence.selectedPaymentRequirementIndex,
      intendedRequest: {
        method: "GET",
        url: officialPaymentRequired.resource.url,
        requestBodyPosture: "no_body",
        bodyDigest: null,
        selectedHeadersDigest: officialSelectedHeadersDigest,
        providerEnvironmentPosture: "local_reference_sandbox",
        providerEnvironmentRef: "provider-environment:x402-local-reference-sandbox",
      },
    });
    const parameters = fixture.contract.parameters as X402PaymentParameters;
    const validSignatureEvidence = await fakeLocalSignatureEvidence(parameters);

    const missing = await sandbox.recordSignedRetry({ parameters, signatureEvidence: null });
    const wrongHeader = await sandbox.recordSignedRetry({
      parameters,
      signatureEvidence: { ...validSignatureEvidence, paymentSignatureHeaderName: "X-PAYMENT-SIGNATURE" as never },
    });
    const nonReference = await sandbox.recordSignedRetry({
      parameters: {
        ...parameters,
        providerEnvironmentPosture: "live",
        providerEnvironmentRef: "provider-environment:x402-live",
      },
      signatureEvidence: validSignatureEvidence,
    });
    const ambiguousBody = await sandbox.recordSignedRetry({
      parameters: { ...parameters, intendedRequestBodyPosture: "unsupported" },
      signatureEvidence: validSignatureEvidence,
    });

    expect([missing, wrongHeader, nonReference, ambiguousBody].map((result) => result.outcome)).toEqual([
      "signed_retry_refused",
      "signed_retry_refused",
      "signed_retry_refused",
      "signed_retry_refused",
    ]);
    expect([missing, wrongHeader, nonReference, ambiguousBody].map((result) => result.retryCount)).toEqual([
      0, 0, 0, 0,
    ]);
    expect([missing, wrongHeader, nonReference, ambiguousBody].map((result) => result.evidenceBoundary)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          evidenceProfile: "local_reference_downstream_fixture",
          signedRetryPosture: "not_observed",
          settlementFinalityClaimed: false,
          facilitatorOperationClaimed: false,
          sellerMiddlewareClaimed: false,
          providerCustodyClaimed: false,
        }),
      ]),
    );
    expect(sandbox.snapshot().signedRetryCount).toBe(0);
  });

  it("binds Payment-Identifier into official gateway evidence and reconciliation refs", async () => {
    const fixture = await greenlitOfficialX402Contract({ paymentIdentifier: officialPaymentIdentifier });
    const signer = trackedOfficialSigner();
    const surface = createOfficialExactX402SigningSurface({
      signer: signer.surfaceSigner,
      paymentRequired: officialPaymentRequired,
      selectedPaymentRequirementIndex: fixture.evidence.selectedPaymentRequirementIndex,
      selectedPaymentRequirementDigest: fixture.evidence.selectedPaymentRequirementDigest,
      paymentIdentifier: officialPaymentIdentifier,
      downstreamPaymentStatus: "unknown",
    });

    const result = await runX402WalletGateway({
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters as X402PaymentParameters,
    });

    const paymentIdentifierDigest = await digestCanonical({
      paymentIdentifier: officialPaymentIdentifier,
      paymentIdentifierExtension: "payment-identifier",
    });
    expect(result.outcome).toBe("payment_signature_proof_gap");
    expect(signer.signatureCount()).toBe(1);
    expect(fixture.contract.parameters).toMatchObject({
      paymentIdentifierPosture: "bound",
      paymentIdentifierDigest,
    });
    expect(fixture.contract.idempotencyKey).toStartWith("x402-payment-id:");
    expect(result.signatureEvidence).toMatchObject({
      paymentIdentifierDigest,
    });
    expect(result.signatureEvidence?.paymentIdentifierRef).toStartWith("payment-identifier:x402:");
    expect(result.reconciliation?.evidenceRefs).toContain(`digest:${paymentIdentifierDigest}`);
  });

  it("does not invoke the official signer when the gateway check refuses", async () => {
    const fixture = await greenlitOfficialX402Contract();
    const signer = trackedOfficialSigner();
    const surface = createOfficialExactX402SigningSurface({
      signer: signer.surfaceSigner,
      paymentRequired: officialPaymentRequired,
      selectedPaymentRequirementIndex: fixture.evidence.selectedPaymentRequirementIndex,
      selectedPaymentRequirementDigest: fixture.evidence.selectedPaymentRequirementDigest,
      downstreamPaymentStatus: "unknown",
    });
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
    expect(signer.signatureCount()).toBe(0);
    expect(result.signatureEvidence).toBeNull();
  });

  it("refuses credential-ref isolation before x402 wallet signing", async () => {
    const fixture = await greenlitOfficialX402Contract();
    const signer = trackedOfficialSigner();
    const credentialBinding = fixture.contract.gatewayCredentialRefs[0];
    if (!credentialBinding) throw new Error("expected x402 wallet credential binding");
    await fixture.kernel.createIsolationState({
      tenantId: fixture.proposal.tenantId,
      organizationId: fixture.proposal.organizationId,
      scopeType: "credential_ref",
      scopeId: credentialBinding.gatewayCredentialRefId,
      state: "quarantined",
      reasonCode: "credential_resolution_isolation_blocked",
      reasonSummary: "x402 wallet signer credential ref is quarantined after custody drift evidence.",
      sourceDecisionRef: "test:x402-wallet-credential-quarantine",
    });
    const surface = createOfficialExactX402SigningSurface({
      signer: signer.surfaceSigner,
      paymentRequired: officialPaymentRequired,
      selectedPaymentRequirementIndex: fixture.evidence.selectedPaymentRequirementIndex,
      selectedPaymentRequirementDigest: fixture.evidence.selectedPaymentRequirementDigest,
      downstreamPaymentStatus: "unknown",
    });

    const result = await runX402WalletGateway({
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters as X402PaymentParameters,
      surfaceOperationRef: "surface-op:x402-official-credential-isolated",
    });

    expect(result.outcome).toBe("gateway_check_refused");
    expect(result.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("current_isolation_quarantined");
    expect(result.gatewayCheck.mutationAttempt).toBeNull();
    expect(result.signatureEvidence).toBeNull();
    expect(signer.signatureCount()).toBe(0);
  });

  it("refuses external sandbox posture before invoking the official signer", async () => {
    const fixture = await greenlitOfficialX402Contract();
    const signer = trackedOfficialSigner();
    const surface = createOfficialExactX402SigningSurface({
      signer: signer.surfaceSigner,
      paymentRequired: officialPaymentRequired,
      selectedPaymentRequirementIndex: fixture.evidence.selectedPaymentRequirementIndex,
      selectedPaymentRequirementDigest: fixture.evidence.selectedPaymentRequirementDigest,
      downstreamPaymentStatus: "unknown",
    });
    const observedParameters = {
      ...(fixture.contract.parameters as X402PaymentParameters),
      providerEnvironmentPosture: "external_sandbox" as const,
      providerEnvironmentRef: "provider-environment:x402-external-sandbox",
    };

    const result = await runX402WalletGateway({
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters,
      surfaceOperationRef: "surface-op:x402-official-external-sandbox",
    });

    expect(result.outcome).toBe("gateway_check_refused");
    expect(signer.signatureCount()).toBe(0);
    expect(result.signatureEvidence).toBeNull();
  });

  it("re-verifies official PaymentRequired details inside the gateway before signing", async () => {
    const fixture = await greenlitOfficialX402Contract();
    const signer = trackedOfficialSigner();
    const driftedPaymentRequired = {
      ...officialPaymentRequired,
      accepts: [
        {
          ...officialPaymentRequired.accepts[0],
          payTo: "0x2222222222222222222222222222222222222222",
        },
      ],
    };
    const surface = createOfficialExactX402SigningSurface({
      signer: signer.surfaceSigner,
      paymentRequired: driftedPaymentRequired,
      selectedPaymentRequirementIndex: fixture.evidence.selectedPaymentRequirementIndex,
      selectedPaymentRequirementDigest: fixture.evidence.selectedPaymentRequirementDigest,
      downstreamPaymentStatus: "unknown",
    });

    const result = await runX402WalletGateway({
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters as X402PaymentParameters,
    });

    expect(result.outcome).toBe("payment_signature_failed");
    expect(result.gatewayCheck.gateAttempt.gateDecision).toBe("passed");
    expect(signer.signatureCount()).toBe(0);
    expect(result.signatureEvidence).toBeNull();
  });

  it("refuses selected requirement index drift before invoking the official signer", async () => {
    const fixture = await greenlitOfficialX402Contract();
    const signer = trackedOfficialSigner();
    const surface = createOfficialExactX402SigningSurface({
      signer: signer.surfaceSigner,
      paymentRequired: officialPaymentRequired,
      selectedPaymentRequirementIndex: fixture.evidence.selectedPaymentRequirementIndex + 1,
      selectedPaymentRequirementDigest: fixture.evidence.selectedPaymentRequirementDigest,
      downstreamPaymentStatus: "unknown",
    });

    const result = await runX402WalletGateway({
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters as X402PaymentParameters,
    });

    expect(result.outcome).toBe("payment_signature_failed");
    expect(result.gatewayCheck.gateAttempt.gateDecision).toBe("passed");
    expect(signer.signatureCount()).toBe(0);
    expect(result.signatureEvidence).toBeNull();
  });

  it("refuses selected requirement digest drift before invoking the official signer", async () => {
    const fixture = await greenlitOfficialX402Contract();
    const signer = trackedOfficialSigner();
    const surface = createOfficialExactX402SigningSurface({
      signer: signer.surfaceSigner,
      paymentRequired: officialPaymentRequired,
      selectedPaymentRequirementIndex: fixture.evidence.selectedPaymentRequirementIndex,
      selectedPaymentRequirementDigest: `sha256:${"f".repeat(64)}`,
      downstreamPaymentStatus: "unknown",
    });

    const result = await runX402WalletGateway({
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters as X402PaymentParameters,
    });

    expect(result.outcome).toBe("payment_signature_failed");
    expect(result.gatewayCheck.gateAttempt.gateDecision).toBe("passed");
    expect(signer.signatureCount()).toBe(0);
    expect(result.signatureEvidence).toBeNull();
  });

  it("refuses an official signer replay before creating another PaymentPayload", async () => {
    const fixture = await greenlitOfficialX402Contract();
    const signer = trackedOfficialSigner();
    const surface = createOfficialExactX402SigningSurface({
      signer: signer.surfaceSigner,
      paymentRequired: officialPaymentRequired,
      selectedPaymentRequirementIndex: fixture.evidence.selectedPaymentRequirementIndex,
      selectedPaymentRequirementDigest: fixture.evidence.selectedPaymentRequirementDigest,
      downstreamPaymentStatus: "unknown",
    });
    const input = {
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters as X402PaymentParameters,
    };

    const first = await runX402WalletGateway({
      ...input,
      surfaceOperationRef: "surface-op:x402-official:first",
    });
    const replay = await runX402WalletGateway({
      ...input,
      surfaceOperationRef: "surface-op:x402-official:replay",
    });

    expect(first.outcome).toBe("payment_signature_proof_gap");
    expect(replay.outcome).toBe("gateway_check_refused");
    expect(replay.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("already_consumed");
    expect(signer.signatureCount()).toBe(1);
    expect(replay.signatureEvidence).toBeNull();
  });
});

function fakeSigningSurface(downstreamPaymentStatus: "succeeded" | "unknown") {
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
        evidenceRef: `evidence:x402-payment-signature:${command.verifiedGate.gateAttemptId}`,
        surfaceOperationRef: command.verifiedGate.surfaceOperationRef,
        paymentSignatureHeaderName: "PAYMENT-SIGNATURE" as const,
        paymentSignatureHeaderRef: `credential:x402-local-fixture-signature:${command.verifiedGate.gateAttemptId}`,
        paymentSignatureDigest,
        paymentPayloadShape: "local_fixture_payment_signature" as const,
        credentialMaterialPosture: "local_fixture" as const,
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

async function fakeLocalSignatureEvidence(parameters: X402PaymentParameters): Promise<X402PaymentSignatureEvidence> {
  const paymentSignature = `PAYMENT-SIGNATURE:fake:sandbox-refusal:${parameters.paymentRequirementsDigest.slice(
    "sha256:".length,
    "sha256:".length + 16,
  )}`;
  return {
    evidenceRef: "evidence:x402-payment-signature:sandbox-refusal",
    surfaceOperationRef: "surface-op:x402-sandbox-refusal",
    paymentSignatureHeaderName: "PAYMENT-SIGNATURE",
    paymentSignatureHeaderRef: "credential:x402-local-fixture-signature:sandbox-refusal",
    paymentSignatureDigest: await digestCanonical({ paymentSignature }),
    paymentPayloadShape: "local_fixture_payment_signature",
    credentialMaterialPosture: "local_fixture",
    downstreamPaymentStatus: "succeeded",
    paymentResponseEvidenceRef: "evidence:x402-payment-response:sandbox-refusal",
    providerRequestRef: "provider-request:x402:sandbox-refusal",
    providerOperationRef: "provider-operation:x402:sandbox-refusal",
  };
}

function trackedOfficialSigner() {
  let signatures = 0;
  return {
    signatureCount: () => signatures,
    surfaceSigner: {
      address: officialSignerAddress,
      async signTypedData() {
        signatures += 1;
        return `0x${"a".repeat(130)}` as const;
      },
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
  await kernel.putCatalogObject({
    objectType: "gateway_registry_entry",
    payload: requireInstallProposalGatewayRegistryEntry(records.gatewayRegistryEntry),
  });
  await kernel.putCatalogObject({ objectType: "operating_envelope", payload: records.operatingEnvelope });
  await registerX402WalletCredentialRef(kernel, proposal, records);
  await registerX402DelegatedAuthorityRef(kernel, proposal, records);
  const runtimeResult = await proposeX402PaymentActionContract(
    kernel,
    x402RuntimeConfig(proposal, records, "run_x402_demo"),
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
      ...localX402PaymentAttemptBindings(),
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

async function greenlitOfficialX402Contract(options: { paymentIdentifier?: string | null } = {}) {
  const evidence = await decodeX402PaymentRequiredEvidence({
    source: officialX402SourceBasis,
    paymentRequiredHeader: base64Json(officialPaymentRequired),
    selectedPaymentRequirementIndex: 0,
    intendedRequest: {
      method: "GET",
      url: officialPaymentRequired.resource.url,
      bodyDigest: null,
      selectedHeadersDigest: officialSelectedHeadersDigest,
    },
  });
  const store = new InMemoryProtocolStore();
  const kernel = new HandshakeKernel(store);
  const proposal = await compileX402InstallProposal(officialInstallInput(evidence.selectedPaymentRequirementDigest));
  const records = requireCompiledRecords(proposal);
  await kernel.putCatalogObject({ objectType: "tool_capability", payload: records.toolCapability });
  await kernel.putCatalogObject({ objectType: "action_type", payload: records.actionType });
  await kernel.putCatalogObject({
    objectType: "gateway_registry_entry",
    payload: requireInstallProposalGatewayRegistryEntry(records.gatewayRegistryEntry),
  });
  await kernel.putCatalogObject({ objectType: "operating_envelope", payload: records.operatingEnvelope });
  await registerX402WalletCredentialRef(kernel, proposal, records);
  await registerX402DelegatedAuthorityRef(kernel, proposal, records);
  const runtimeResult = await proposeX402PaymentActionContract(
    kernel,
    x402RuntimeConfig(proposal, records, "run_x402_official"),
    await buildX402PaymentAttemptFromRequiredEvidence({
      evidence,
      principalIntentRef: "intent:fetch paid context",
      generatedCodeOrSpecRef: "code:official-x402-fetch-wrapper",
      paymentIdentifier: options.paymentIdentifier ?? null,
    }),
  );
  if (runtimeResult.outcome !== "action_contract_proposed") throw new Error("expected official action contract");
  await recordGatewayCheckedPosture(kernel, proposal, records);
  const { decision, greenlight } = await kernel.evaluatePolicy({
    actionContractId: runtimeResult.actionContract.actionContractId,
    envelopeId: records.operatingEnvelope.envelopeId,
    signingSecret: "test-secret",
  });
  if (!greenlight) throw new Error(`expected official greenlight, got ${decision.decisionReasonCode}`);
  return { store, kernel, proposal, records, evidence, contract: runtimeResult.actionContract, greenlight };
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
      gatewayId: requireInstallProposalGatewayRegistryEntry(records.gatewayRegistryEntry).gatewayId,
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
    gatewayId: requireInstallProposalGatewayRegistryEntry(records.gatewayRegistryEntry).gatewayId,
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
  if (!proposal.compiledRecords) throw new Error("expected installable proposal");
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
    gatewayRegistryRef: `gateway_registry@${requireInstallProposalGatewayRegistryEntry(records.gatewayRegistryEntry).gatewayRegistryVersion}`,
    gatewayReadinessRef: "handshake://local/x402/gateway-readiness.json",
    gatewayReadinessDigest: digest,
    policyVersionRef: `${proposal.policyPackRef}@${proposal.policyPackVersion}`,
    policyVersionDigest: digest,
    toolCapabilityId: records.toolCapability.toolCapabilityId,
    actionTypeId: records.actionType.actionTypeId,
    gatewayRegistryEntryId: requireInstallProposalGatewayRegistryEntry(records.gatewayRegistryEntry)
      .gatewayRegistryEntryId,
    gatewayId: requireInstallProposalGatewayRegistryEntry(records.gatewayRegistryEntry).gatewayId,
    gatewayCredentialBinding: x402WalletGatewayCredentialBindingFor(credentialRef),
    delegatedAuthorityBinding: x402DelegatedSpendAuthorityBindingFor(authorityRef),
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
