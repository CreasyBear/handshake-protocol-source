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
} from "../../src/adapters/x402-payment/wallet-gateway";
import { x402PaymentHostileBypassProbeExecutors } from "../../src/adapters/x402-payment/bypass-probes";
import { runBypassProbeExecutors } from "../../src/adapters/protected-path-probes";
import { digestCanonical } from "../../src/protocol/foundation/canonical";
import { nowIso } from "../../src/protocol/foundation/ids";
import type { GatewayCredentialRef } from "../../src/protocol/areas/credential-custody";
import type { DelegatedAuthorityRef } from "../../src/protocol/areas/delegated-authority";
import { HandshakeClient } from "../../src/sdk/client";
import { createD1HttpHarness, D1_HARNESS_CALLER_AUTH_TOKENS, type D1HttpHarness } from "../support/d1-http-harness";
import { futureIso } from "../support/fixtures";
import { localX402PaymentAttemptBindings } from "../support/install-proposal-helpers";

type StreamEventRow = {
  offset: number;
  event_type: string;
  previous_event_digest: string | null;
  event_digest: string;
};
type CountRow = {
  count: number;
};

const digest = `sha256:${"d".repeat(64)}` as const;
const x402AuthorityRefs = new WeakMap<X402InstallProposal, DelegatedAuthorityRef>();
const officialSelectedHeadersDigest = `sha256:${"a".repeat(64)}` as const;
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

describe("x402 Hono/D1 wallet gateway establishment path", () => {
  it("creates x402 payment signature evidence only after D1-backed policy and gateway admission", async () => {
    const harness = await createD1HttpHarness();
    try {
      const { actionContract, client, greenlight } = await createX402Contract(harness);
      const surface = fakeSigningSurface("succeeded");

      expect(actionContract.parameters).toMatchObject({
        endpointDomain: "api.example.com",
        payee: "0xpayee",
        network: "base-sepolia",
        token: "USDC",
        atomicAmount: "2500",
      });
      expect(JSON.stringify(actionContract.parameters)).not.toContain("secretref");

      const gatewayResult = await runX402WalletGateway({
        protocol: client,
        surface,
        actionContractId: actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: actionContract.parameters as X402PaymentParameters,
        surfaceOperationRef: "surface-op:d1-http-x402-payment",
      });

      expect(gatewayResult.outcome).toBe("payment_signature_reconciled");
      expect(gatewayResult.gatewayCheck.gateAttempt.gateDecision).toBe("passed");
      expect(gatewayResult.signatureEvidence).toMatchObject({
        paymentSignatureHeaderName: "PAYMENT-SIGNATURE",
        paymentPayloadShape: "local_fixture_payment_signature",
        credentialMaterialPosture: "local_fixture",
      });
      expect(gatewayResult.signatureEvidence?.paymentSignatureHeaderRef).toStartWith(
        "credential:x402-local-fixture-signature:",
      );
      expect(gatewayResult.reconciliation?.observedDownstreamStatus).toBe("succeeded");
      expect(gatewayResult.reconciliation?.finalityStatus).toBe("final");
      expect(surface.signatureCount()).toBe(1);

      const events = await actionEvents(harness, actionContract.actionContractId);
      expect(events.map((event) => event.event_type)).toEqual([
        "action_proposed",
        "policy_decision_recorded",
        "action_greenlit",
        "idempotency_ledger_recorded",
        "gateway_checked",
        "mutation_attempted",
        "protected_surface_operation_claimed",
        "receipt_emitted",
        "credential_resolution_recorded",
        "surface_operation_reconciled",
        "protected_surface_operation_released",
      ]);
      expect(events.map((event) => event.offset)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      for (let index = 1; index < events.length; index += 1) {
        expect(events[index]?.previous_event_digest).toBe(events[index - 1]?.event_digest);
      }

      expect(await recordCount(harness, "mutation_attempt")).toBe(1);
      expect(await recordCount(harness, "credential_resolution_evidence")).toBe(1);
      expect(await recordCount(harness, "surface_operation_reconciliation")).toBe(1);
      expect(await recordCount(harness, "proof_gap")).toBe(0);
    } finally {
      await harness.dispose();
    }
  });

  it("records official exact PaymentPayload evidence through D1/HTTP without leaking signer material", async () => {
    const harness = await createD1HttpHarness();
    try {
      const { actionContract, client, evidence, greenlight } = await createOfficialX402Contract(harness, {
        paymentIdentifier: officialPaymentIdentifier,
      });
      const signer = trackedOfficialSigner();
      const surface = createOfficialExactX402SigningSurface({
        signer: signer.surfaceSigner,
        paymentRequired: officialPaymentRequired,
        selectedPaymentRequirementIndex: evidence.selectedPaymentRequirementIndex,
        selectedPaymentRequirementDigest: evidence.selectedPaymentRequirementDigest,
        paymentIdentifier: officialPaymentIdentifier,
        downstreamPaymentStatus: "succeeded",
        paymentResponseEvidenceRef: "evidence:x402-payment-response:official-d1",
        providerRequestRef: "provider-request:x402:official-d1",
        providerOperationRef: "provider-operation:x402:official-d1",
      });

      expect(actionContract.parameters).toMatchObject({
        intendedHttpMethod: "GET",
        intendedRequestUrl: officialPaymentRequired.resource.url,
        selectedHeadersDigest: officialSelectedHeadersDigest,
        x402Version: 2,
        x402Scheme: "exact",
        asset: officialPaymentRequired.accepts[0].asset,
        payTo: officialPaymentRequired.accepts[0].payTo,
        selectedPaymentRequirementDigest: evidence.selectedPaymentRequirementDigest,
        paymentIdentifierPosture: "bound",
      });

      const gatewayResult = await runX402WalletGateway({
        protocol: client,
        surface,
        actionContractId: actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: actionContract.parameters as X402PaymentParameters,
        surfaceOperationRef: "surface-op:d1-http-x402-official",
      });

      expect(gatewayResult.outcome).toBe("payment_signature_reconciled");
      expect(gatewayResult.gatewayCheck.gateAttempt.gateDecision).toBe("passed");
      expect(signer.signatureCount()).toBe(1);
      expect(gatewayResult.signatureEvidence).toMatchObject({
        paymentSignatureHeaderName: "PAYMENT-SIGNATURE",
        paymentPayloadShape: "official_x402_payment_payload_v2",
        credentialMaterialPosture: "gateway_held_redacted",
        paymentResponseEvidenceRef: "evidence:x402-payment-response:official-d1",
      });
      expect(gatewayResult.signatureEvidence?.paymentPayloadRef).toStartWith("credential:x402-payment-payload:");
      expect(gatewayResult.signatureEvidence?.paymentSignatureHeaderRef).toStartWith(
        "credential:x402-payment-signature:",
      );
      const paymentIdentifierDigest = (actionContract.parameters as X402PaymentParameters).paymentIdentifierDigest as
        | `sha256:${string}`
        | null;
      if (!paymentIdentifierDigest) throw new Error("expected bound payment identifier digest");
      expect(gatewayResult.signatureEvidence?.paymentIdentifierDigest).toBe(paymentIdentifierDigest);
      expect(gatewayResult.reconciliation?.evidenceRefs).toContain("evidence:x402-payment-response:official-d1");
      expect(gatewayResult.reconciliation?.providerRequestRef).toBe("provider-request:x402:official-d1");
      expect(gatewayResult.reconciliation?.providerOperationRef).toBe("provider-operation:x402:official-d1");
      expect(JSON.stringify(gatewayResult)).not.toContain("secretref");
      expect(JSON.stringify(gatewayResult)).not.toContain(`0x${"a".repeat(130)}`);
      if (!gatewayResult.signatureEvidence) throw new Error("expected official signature evidence");
      const paymentPayloadRef = gatewayResult.signatureEvidence.paymentPayloadRef;
      const paymentPayloadDigest = gatewayResult.signatureEvidence.paymentPayloadDigest;
      if (!paymentPayloadRef || !paymentPayloadDigest) throw new Error("expected official payment payload evidence");

      const envelope = await client.getAgentTransactionEnvelopeProjection(
        actionContract.actionContractId,
        "runtime_evidence",
      );
      expect(envelope.surfaceOperationRef).toBe("surface-op:d1-http-x402-official");
      expect(envelope.surfaceOperationReconciliationRef).toBe(gatewayResult.reconciliation?.reconciliationId);
      expect(envelope.surfaceOperationEvidenceLabels).toEqual([
        "local_gateway_check",
        "gateway_credential_resolution",
        "gateway_signer_invocation",
        "payment_payload_created",
        "downstream_reconciliation_recorded",
        "payment_response_received",
      ]);
      expect(envelope.credentialResolutionEvidenceRefs).toContain(
        `credential_resolution_evidence:${gatewayResult.credentialResolutionEvidence?.credentialResolutionEvidenceId}`,
      );
      expect(envelope.signerInvocationEvidenceRefs).toContain(
        gatewayResult.signatureEvidence.paymentSignatureHeaderRef,
      );
      expect(envelope.surfaceOperationEvidenceLabels).not.toContain("paid_retry_attempted");
      expect(envelope.surfaceOperationEvidenceRefs).toContain(gatewayResult.signatureEvidence.evidenceRef);
      expect(envelope.surfaceOperationEvidenceRefs).toContain(
        gatewayResult.signatureEvidence.paymentSignatureHeaderRef,
      );
      expect(envelope.surfaceOperationEvidenceRefs).toContain(
        `digest:${gatewayResult.signatureEvidence.paymentSignatureDigest}`,
      );
      expect(envelope.surfaceOperationEvidenceRefs).toContain(paymentPayloadRef);
      expect(envelope.surfaceOperationEvidenceRefs).toContain(`digest:${paymentPayloadDigest}`);
      expect(envelope.surfaceOperationEvidenceRefs).toContain("evidence:x402-payment-response:official-d1");
      expect(envelope.gatewayCredentialEvidenceRefs).toContain(
        gatewayResult.signatureEvidence.paymentSignatureHeaderRef,
      );
      expect(envelope.gatewayCredentialEvidenceRefs).toContain(paymentPayloadRef);
      expect(envelope.downstreamEvidenceRefs).toEqual(["evidence:x402-payment-response:official-d1"]);
      expect(envelope.providerRequestRef).toBe("provider-request:x402:official-d1");
      expect(envelope.providerOperationRef).toBe("provider-operation:x402:official-d1");
      expect(envelope.downstreamRetryability).toBe("non_retryable");
      expect(envelope.reconciliationFinalityStatus).toBe("final");
      const envelopeJson = JSON.stringify(envelope);
      expect(envelopeJson).not.toContain("secretref");
      expect(envelopeJson).not.toContain(officialSignerAddress);
      expect(envelopeJson).not.toContain(`0x${"a".repeat(130)}`);
      expect(envelopeJson).not.toContain("PaymentPayload");
      expect(envelopeJson).not.toContain("PAYMENT-SIGNATURE:");

      const receiptTimeline = await client.getReceiptTimelineProjection(
        gatewayResult.gatewayCheck.receipt.receiptId,
        "runtime_evidence",
      );
      expect(receiptTimeline.failureEvidence?.providerRequestRef).toBe("provider-request:x402:official-d1");
      expect(receiptTimeline.failureEvidence?.providerOperationRef).toBe("provider-operation:x402:official-d1");
      expect(JSON.stringify(receiptTimeline)).not.toContain(`0x${"a".repeat(130)}`);

      const events = await actionEvents(harness, actionContract.actionContractId);
      expect(events.map((event) => event.event_type)).toEqual([
        "action_proposed",
        "policy_decision_recorded",
        "action_greenlit",
        "idempotency_ledger_recorded",
        "gateway_checked",
        "mutation_attempted",
        "protected_surface_operation_claimed",
        "receipt_emitted",
        "credential_resolution_recorded",
        "surface_operation_reconciled",
        "protected_surface_operation_released",
      ]);
      expect(await recordCount(harness, "mutation_attempt")).toBe(1);
      expect(await recordCount(harness, "credential_resolution_evidence")).toBe(1);
      expect(await recordCount(harness, "surface_operation_reconciliation")).toBe(1);
      expect(await recordCount(harness, "proof_gap")).toBe(0);
    } finally {
      await harness.dispose();
    }
  });

  it("refuses official exact parameter drift before invoking the signer through D1/HTTP", async () => {
    const harness = await createD1HttpHarness();
    try {
      const { actionContract, client, evidence, greenlight } = await createOfficialX402Contract(harness);
      const signer = trackedOfficialSigner();
      const surface = createOfficialExactX402SigningSurface({
        signer: signer.surfaceSigner,
        paymentRequired: officialPaymentRequired,
        selectedPaymentRequirementIndex: evidence.selectedPaymentRequirementIndex,
        selectedPaymentRequirementDigest: evidence.selectedPaymentRequirementDigest,
        downstreamPaymentStatus: "succeeded",
      });

      const gatewayResult = await runX402WalletGateway({
        protocol: client,
        surface,
        actionContractId: actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: {
          ...(actionContract.parameters as X402PaymentParameters),
          atomicAmount: "2501",
        },
        surfaceOperationRef: "surface-op:d1-http-x402-official-mismatch",
      });

      expect(gatewayResult.outcome).toBe("gateway_check_refused");
      expect(gatewayResult.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("params_mismatch");
      expect(gatewayResult.signatureEvidence).toBeNull();
      expect(signer.signatureCount()).toBe(0);
      expect(await recordCount(harness, "mutation_attempt")).toBe(0);
      expect(await recordCount(harness, "gateway_check_attempt")).toBe(1);
      expect(await recordCount(harness, "refusal")).toBe(1);
    } finally {
      await harness.dispose();
    }
  });

  it("refuses official exact replay before creating another PaymentPayload through D1/HTTP", async () => {
    const harness = await createD1HttpHarness();
    try {
      const { actionContract, client, evidence, greenlight } = await createOfficialX402Contract(harness);
      const signer = trackedOfficialSigner();
      const surface = createOfficialExactX402SigningSurface({
        signer: signer.surfaceSigner,
        paymentRequired: officialPaymentRequired,
        selectedPaymentRequirementIndex: evidence.selectedPaymentRequirementIndex,
        selectedPaymentRequirementDigest: evidence.selectedPaymentRequirementDigest,
        downstreamPaymentStatus: "unknown",
      });
      const input = {
        protocol: client,
        surface,
        actionContractId: actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: actionContract.parameters as X402PaymentParameters,
      };

      const first = await runX402WalletGateway({
        ...input,
        surfaceOperationRef: "surface-op:d1-http-x402-official-first",
      });
      const replay = await runX402WalletGateway({
        ...input,
        surfaceOperationRef: "surface-op:d1-http-x402-official-replay",
      });

      expect(first.outcome).toBe("payment_signature_proof_gap");
      expect(replay.outcome).toBe("gateway_check_refused");
      expect(replay.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("already_consumed");
      expect(replay.signatureEvidence).toBeNull();
      expect(signer.signatureCount()).toBe(1);
      expect(await recordCount(harness, "mutation_attempt")).toBe(1);
      expect(await recordCount(harness, "proof_gap")).toBe(1);
      expect(await recordCount(harness, "refusal")).toBe(1);
      expect(await recordCount(harness, "receipt")).toBe(2);
    } finally {
      await harness.dispose();
    }
  });

  it("refuses changed observed payment parameters before wallet signing", async () => {
    const harness = await createD1HttpHarness();
    try {
      const { actionContract, client, greenlight } = await createX402Contract(harness);
      const surface = fakeSigningSurface("succeeded");
      const observedParameters = {
        ...(actionContract.parameters as X402PaymentParameters),
        atomicAmount: "2501",
      };

      const gatewayResult = await runX402WalletGateway({
        protocol: client,
        surface,
        actionContractId: actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters,
        surfaceOperationRef: "surface-op:d1-http-x402-mismatch",
      });

      expect(gatewayResult.outcome).toBe("gateway_check_refused");
      expect(gatewayResult.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("params_mismatch");
      expect(gatewayResult.gatewayCheck.receipt.downstreamExecutionStatus).toBe("not_started");
      expect(surface.signatureCount()).toBe(0);
      expect(await recordCount(harness, "mutation_attempt")).toBe(0);
      expect(await recordCount(harness, "gateway_check_attempt")).toBe(1);
      expect(await recordCount(harness, "refusal")).toBe(1);
      expect(await recordCount(harness, "receipt")).toBe(1);
    } finally {
      await harness.dispose();
    }
  });

  it("persists a proof gap when x402 downstream response evidence is missing", async () => {
    const harness = await createD1HttpHarness();
    try {
      const { actionContract, client, greenlight } = await createX402Contract(harness);
      const surface = fakeSigningSurface("unknown");

      const gatewayResult = await runX402WalletGateway({
        protocol: client,
        surface,
        actionContractId: actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: actionContract.parameters as X402PaymentParameters,
        surfaceOperationRef: "surface-op:d1-http-x402-proof-gap",
      });

      expect(gatewayResult.outcome).toBe("payment_signature_proof_gap");
      expect(gatewayResult.reconciliation?.observedDownstreamStatus).toBe("unknown");
      expect(gatewayResult.reconciliation?.finalityStatus).toBe("unknown");
      expect(surface.signatureCount()).toBe(1);
      expect(await recordCount(harness, "mutation_attempt")).toBe(1);
      expect(await recordCount(harness, "surface_operation_reconciliation")).toBe(1);
      expect(await recordCount(harness, "proof_gap")).toBe(1);
    } finally {
      await harness.dispose();
    }
  });

  it("persists replay refusal instead of reusing a consumed x402 greenlight", async () => {
    const harness = await createD1HttpHarness();
    try {
      const { actionContract, client, greenlight } = await createX402Contract(harness);
      const surface = fakeSigningSurface("succeeded");
      const input = {
        protocol: client,
        surface,
        actionContractId: actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: actionContract.parameters as X402PaymentParameters,
      };

      const first = await runX402WalletGateway({
        ...input,
        surfaceOperationRef: "surface-op:d1-http-x402-first",
      });
      const replay = await runX402WalletGateway({
        ...input,
        surfaceOperationRef: "surface-op:d1-http-x402-replay",
      });

      expect(first.outcome).toBe("payment_signature_reconciled");
      expect(replay.outcome).toBe("gateway_check_refused");
      expect(replay.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("already_consumed");
      expect(replay.gatewayCheck.receipt.greenlightConsumptionStatus).toBe("replayed");
      expect(surface.signatureCount()).toBe(1);
      expect(await recordCount(harness, "mutation_attempt")).toBe(1);
      expect(await recordCount(harness, "refusal")).toBe(1);
      expect(await recordCount(harness, "receipt")).toBe(2);
    } finally {
      await harness.dispose();
    }
  });
});

async function createX402Contract(harness: D1HttpHarness) {
  const client = new HandshakeClient("http://handshake.test", harness.fetch, {
    transitionTokens: D1_HARNESS_CALLER_AUTH_TOKENS,
  });
  const proposal = await compileX402InstallProposal(validInstallInput());
  const records = requireCompiledRecords(proposal);
  await client.registerToolCapability(records.toolCapability);
  await client.registerActionType(records.actionType);
  await client.registerGatewayRegistryEntry(requireInstallProposalGatewayRegistryEntry(records.gatewayRegistryEntry));
  await client.registerOperatingEnvelope(records.operatingEnvelope);
  await registerX402WalletCredentialRef(client, proposal, records);
  await registerX402DelegatedAuthorityRef(client, proposal, records);
  await recordGatewayCheckedPosture(client, proposal, records);

  const runtimeResult = await proposeX402PaymentActionContract(client, runtimeConfig(proposal, records), {
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
  });
  if (runtimeResult.outcome !== "action_contract_proposed") throw new Error("expected x402 action contract proposal");

  const policy = await client.evaluatePolicy({
    actionContractId: runtimeResult.actionContract.actionContractId,
    envelopeId: records.operatingEnvelope.envelopeId,
    signingSecret: "test-secret",
  });
  if (!policy.greenlight) throw new Error(`expected x402 greenlight, got ${policy.decision.decisionReasonCode}`);
  return { actionContract: runtimeResult.actionContract, client, greenlight: policy.greenlight, proposal, records };
}

async function createOfficialX402Contract(harness: D1HttpHarness, options: { paymentIdentifier?: string | null } = {}) {
  const client = new HandshakeClient("http://handshake.test", harness.fetch, {
    transitionTokens: D1_HARNESS_CALLER_AUTH_TOKENS,
  });
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
  const proposal = await compileX402InstallProposal(officialInstallInput(evidence.selectedPaymentRequirementDigest));
  const records = requireCompiledRecords(proposal);
  await client.registerToolCapability(records.toolCapability);
  await client.registerActionType(records.actionType);
  await client.registerGatewayRegistryEntry(requireInstallProposalGatewayRegistryEntry(records.gatewayRegistryEntry));
  await client.registerOperatingEnvelope(records.operatingEnvelope);
  await registerX402WalletCredentialRef(client, proposal, records);
  await registerX402DelegatedAuthorityRef(client, proposal, records);
  await recordGatewayCheckedPosture(client, proposal, records);

  const runtimeResult = await proposeX402PaymentActionContract(
    client,
    runtimeConfig(proposal, records),
    await buildX402PaymentAttemptFromRequiredEvidence({
      evidence,
      principalIntentRef: "intent:fetch paid context",
      generatedCodeOrSpecRef: "code:official-x402-fetch-wrapper",
      paymentIdentifier: options.paymentIdentifier ?? null,
    }),
  );
  if (runtimeResult.outcome !== "action_contract_proposed") {
    throw new Error("expected official x402 action contract proposal");
  }

  const policy = await client.evaluatePolicy({
    actionContractId: runtimeResult.actionContract.actionContractId,
    envelopeId: records.operatingEnvelope.envelopeId,
    signingSecret: "test-secret",
  });
  if (!policy.greenlight)
    throw new Error(`expected official x402 greenlight, got ${policy.decision.decisionReasonCode}`);
  return {
    actionContract: runtimeResult.actionContract,
    client,
    evidence,
    greenlight: policy.greenlight,
    proposal,
    records,
  };
}

async function recordGatewayCheckedPosture(
  client: HandshakeClient,
  proposal: X402InstallProposal,
  records: NonNullable<X402InstallProposal["compiledRecords"]>,
): Promise<void> {
  const probes = await runBypassProbeExecutors(
    client,
    {
      tenantId: proposal.tenantId,
      organizationId: proposal.organizationId,
      runtimeAdapterId: records.toolCapability.runtimeAdapterId,
      gatewayId: requireInstallProposalGatewayRegistryEntry(records.gatewayRegistryEntry).gatewayId,
      actionClass: "x402_payment.exact",
      resourceRef: proposal.resourceRef,
      protectedSurfaceKind: "x402_payment",
      expiresAt: futureIso(),
    },
    x402PaymentHostileBypassProbeExecutors({
      async readConformancePosture() {
        return {
          signerCustodyStatus: "gateway_held",
          rawPrivateKeyEnvStatus: "absent",
          directCoreClientSigningStatus: "blocked",
          paidFetchClientStatus: "blocked",
          paidAxiosClientStatus: "absent",
          rawPaymentSignatureHeaderStatus: "blocked",
          siblingX402WrapperStatus: "blocked",
          mcpDirectPaymentStatus: "blocked",
          tokenPassthroughStatus: "blocked",
          wrapperDriftStatus: "absent",
          failureClosedStatus: "passed",
        };
      },
    }),
  );
  await client.createProtectedPathPosture({
    tenantId: proposal.tenantId,
    organizationId: proposal.organizationId,
    runtimeAdapterId: records.toolCapability.runtimeAdapterId,
    gatewayId: requireInstallProposalGatewayRegistryEntry(records.gatewayRegistryEntry).gatewayId,
    actionClass: "x402_payment.exact",
    resourceRef: proposal.resourceRef,
    protectedSurfaceKind: "x402_payment",
    postureState: "gateway_checked",
    credentialCustodyStatus: "gateway_held",
    rawSiblingToolStatus: "blocked",
    sourceAuthority: "gateway_probe",
    reasonCodes: ["bypass_probe_passed"],
    evidenceRefs: ["evidence:x402-hostile-probes"],
    bypassProbeIds: probes.map((probe) => probe.bypassProbeId),
    expiresAt: futureIso(),
  });
}

async function registerX402WalletCredentialRef(
  client: HandshakeClient,
  proposal: X402InstallProposal,
  records: NonNullable<X402InstallProposal["compiledRecords"]>,
): Promise<GatewayCredentialRef> {
  const credentialRef = await client.registerGatewayCredentialRef(
    await buildX402WalletGatewayCredentialRefInput(proposal, records),
  );
  x402CredentialRefs.set(proposal, credentialRef);
  return credentialRef;
}

async function registerX402DelegatedAuthorityRef(
  client: HandshakeClient,
  proposal: X402InstallProposal,
  records: NonNullable<X402InstallProposal["compiledRecords"]>,
): Promise<DelegatedAuthorityRef> {
  const authorityRef = await client.registerDelegatedAuthorityRef(
    await buildX402DelegatedSpendAuthorityRefInput(proposal, records),
  );
  x402AuthorityRefs.set(proposal, authorityRef);
  return authorityRef;
}

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

function requireCompiledRecords(proposal: X402InstallProposal): NonNullable<X402InstallProposal["compiledRecords"]> {
  if (!proposal.compiledRecords) throw new Error("expected installable x402 proposal");
  return proposal.compiledRecords;
}

function runtimeConfig(proposal: X402InstallProposal, records: NonNullable<X402InstallProposal["compiledRecords"]>) {
  const credentialRef = x402CredentialRefs.get(proposal);
  if (!credentialRef) throw new Error("expected registered x402 wallet credential ref");
  const authorityRef = x402AuthorityRefs.get(proposal);
  if (!authorityRef) throw new Error("expected registered x402 delegated authority ref");
  return {
    tenantId: proposal.tenantId,
    organizationId: proposal.organizationId,
    principalId: records.operatingEnvelope.principalId,
    agentId: records.operatingEnvelope.agentId,
    runId: "run_x402_d1_http",
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
      signerCustodyStatus: "gateway_held",
      signerRef: "secretref:x402-wallet-gateway",
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
      signerCustodyStatus: "gateway_held",
      signerRef: "secretref:x402-wallet-gateway",
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

async function actionEvents(harness: D1HttpHarness, actionContractId: string): Promise<StreamEventRow[]> {
  return harness.query<StreamEventRow>(
    `SELECT "offset" AS offset, event_type, previous_event_digest, event_digest
     FROM stream_events
     WHERE partition_key = ?
     ORDER BY "offset"`,
    `action:${actionContractId}`,
  );
}

async function recordCount(harness: D1HttpHarness, objectType: string): Promise<number> {
  const rows = await harness.query<CountRow>(
    "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
    objectType,
  );
  return rows[0]?.count ?? 0;
}

function base64Json(value: unknown): string {
  return btoa(JSON.stringify(value));
}
