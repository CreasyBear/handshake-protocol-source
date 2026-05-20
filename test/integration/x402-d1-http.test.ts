import { describe, expect, it } from "bun:test";
import {
  compileX402InstallProposal,
  type X402InstallProposal,
  type X402InstallProposalInput,
} from "../../src/adapters/x402-payment/install-proposal";
import { proposeX402PaymentActionContract } from "../../src/adapters/x402-payment/action-proposal";
import { runX402WalletGateway, type X402PaymentParameters } from "../../src/adapters/x402-payment/wallet-gateway";
import { x402PaymentHostileBypassProbeExecutors } from "../../src/adapters/x402-payment/bypass-probes";
import { runBypassProbeExecutors } from "../../src/adapters/protected-path-probes";
import { digestCanonical } from "../../src/protocol/foundation/canonical";
import { nowIso } from "../../src/protocol/foundation/ids";
import { HandshakeClient } from "../../src/sdk/client";
import { createD1HttpHarness, D1_HARNESS_CALLER_AUTH_TOKENS, type D1HttpHarness } from "../support/d1-http-harness";
import { futureIso } from "../support/fixtures";

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
      expect(gatewayResult.signatureEvidence?.paymentSignature).toStartWith("PAYMENT-SIGNATURE:fake:");
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
        "surface_operation_reconciled",
        "protected_surface_operation_released",
      ]);
      expect(events.map((event) => event.offset)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      for (let index = 1; index < events.length; index += 1) {
        expect(events[index]?.previous_event_digest).toBe(events[index - 1]?.event_digest);
      }

      expect(await recordCount(harness, "mutation_attempt")).toBe(1);
      expect(await recordCount(harness, "surface_operation_reconciliation")).toBe(1);
      expect(await recordCount(harness, "proof_gap")).toBe(0);
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
  await client.registerGatewayRegistryEntry(records.gatewayRegistryEntry);
  await client.registerOperatingEnvelope(records.operatingEnvelope);
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
      gatewayId: records.gatewayRegistryEntry.gatewayId,
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
    gatewayId: records.gatewayRegistryEntry.gatewayId,
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

function requireCompiledRecords(proposal: X402InstallProposal): NonNullable<X402InstallProposal["compiledRecords"]> {
  if (!proposal.compiledRecords) throw new Error("expected installable x402 proposal");
  return proposal.compiledRecords;
}

function runtimeConfig(proposal: X402InstallProposal, records: NonNullable<X402InstallProposal["compiledRecords"]>) {
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
