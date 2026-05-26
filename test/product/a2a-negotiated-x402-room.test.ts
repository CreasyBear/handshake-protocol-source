import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  projectA2ANegotiationProductReadback,
  renderA2ANegotiationAgentHandoff,
  renderA2ANegotiationCustomerReadback,
} from "../../src/surfaces/a2a-negotiation-readback";
import { runX402WalletGateway, type X402PaymentParameters } from "../../src/adapters/x402-payment/wallet-gateway";
import {
  changedAmountParameters,
  changedEndpointParameters,
  changedSelectedPaymentRequirementParameters,
  createNegotiatedX402Greenlight,
  runNegotiatedX402Room,
} from "../../examples/a2a-negotiated-x402-room/local-reference-room";
import { buildA2ANegotiatedX402RoomOutput } from "../../examples/a2a-negotiated-x402-room/generate";

describe("A2A negotiated x402 room", () => {
  it("runs the full room without treating agreement acceptance as authority", async () => {
    const room = await runNegotiatedX402Room();

    expect(room.policy.decision.decision).toBe("greenlight");
    expect(room.gatewayResult.outcome).toBe("payment_signature_proof_gap");
    expect(room.gatewayResult.gatewayCheck.gateAttempt.gateDecision).toBe("passed");
    expect(room.gatewayResult.gatewayCheck.mutationAttempt).not.toBeNull();
    expect(room.surface.signatureCount()).toBe(1);
    expect(room.surface.signedCommands()[0]?.verifiedGate).toMatchObject({
      actionContractId: room.contract.actionContractId,
      greenlightId: room.greenlight.greenlightId,
      actionClass: "x402_payment.exact",
    });
    expect(room.replay.outcome).toBe("gateway_check_refused");
    expect(room.replay.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("already_consumed");
    expect(room.surface.signatureCount()).toBe(1);

    expect(room.supportPacket.agreement).toMatchObject({
      linkedAgreementId: "linked_agreement_demo",
      agreementStatus: "active",
      obligationRef: "obligation:x402-exact-call",
      counterpartyRef: "agent:seller",
    });
    expect(room.supportPacket.obligationBinding).toMatchObject({
      actionContractDigest: room.contract.actionContractDigest,
      paramsDigest: room.contract.paramsDigest,
      counterpartyRef: "agent:seller",
    });
    expect(room.supportPacket.lifecycle).toMatchObject({
      assemblyStatus: "assembled",
      assemblyReasonCode: null,
      policyDecision: "greenlight",
      greenlightId: room.greenlight.greenlightId,
      downstreamFinalityStatus: "unknown",
    });
    expect(room.supportPacket.lifecycle.gatewayCheckAttemptId).toBeString();
    expect(room.supportPacket.lifecycle.mutationAttemptId).toBeString();
    expect(room.supportPacket.lifecycle.receiptId).toBeString();
    expect(room.supportPacket.lifecycle.proofGapIds.length).toBeGreaterThanOrEqual(1);
    expect(room.supportPacket.authorityBoundary).toEqual({
      agreementAcceptanceCreatedAuthority: false,
      obligationBindingCreatedAuthority: false,
      policyMayCreateOneUseGreenlight: true,
      gatewayCheckRemainsFinalEnforcementPoint: true,
      downstreamSuccessClaimedByAgreement: false,
    });
    expect(room.supportPacket.redaction).toEqual({
      rawTranscriptIncluded: false,
      rawOfferTermsIncluded: false,
      paymentPayloadIncluded: false,
      paymentSignatureIncluded: false,
      credentialMaterialIncluded: false,
    });
    const supportJson = JSON.stringify(room.supportPacket);
    expect(supportJson).not.toContain("PAYMENT-SIGNATURE");
    expect(supportJson).not.toContain("credential:x402-a2a-local-fixture-signature");
    expect(supportJson).not.toContain("paymentPayloadDigest");
  });

  it("projects DX, AX, and CX readback without creating authority claims", async () => {
    const room = await runNegotiatedX402Room();
    const readback = projectA2ANegotiationProductReadback(room.supportPacket);
    const customerMarkdown = renderA2ANegotiationCustomerReadback(readback);
    const agentHandoff = renderA2ANegotiationAgentHandoff(readback);

    expect(readback.status).toBe("gateway_checked_downstream_unknown");
    expect(readback.developerExperience).toMatchObject({
      targetTimeToHelloWorldMinutes: 5,
      runCommand: "bun examples/a2a-negotiated-x402-room/generate.ts",
      expectedOutputFiles: ["latest.json", "latest.md", "agent-handoff.md"],
    });
    expect(readback.agentExperience.stopConditions).toContain("Stop on readback assembly failure.");
    expect(readback.customerExperience.nextActions).toContain(
      "Resolve or preserve proof gaps before claiming success.",
    );
    expect(readback.authorityBoundary).toMatchObject({
      agreementAcceptanceCreatedAuthority: false,
      obligationBindingCreatedAuthority: false,
      gatewayCheckRemainsFinalEnforcementPoint: true,
    });
    for (const forbidden of ["PAYMENT-SIGNATURE", "paymentPayloadDigest", "credentialMaterialIncluded: true"]) {
      expect(customerMarkdown).not.toContain(forbidden);
      expect(agentHandoff).not.toContain(forbidden);
    }
    expect(agentHandoff).toContain("## Stop Conditions");
    expect(agentHandoff).toContain("native_host_containment");
    expect(customerMarkdown).toContain("Downstream business finality is unknown.");
  });

  it("refuses changed amount, endpoint, and selected payment requirement at the gateway before signer use", async () => {
    const amountFixture = await createNegotiatedX402Greenlight();
    const amountResult = await runX402WalletGateway({
      protocol: amountFixture.kernel,
      surface: amountFixture.surface,
      actionContractId: amountFixture.contract.actionContractId,
      greenlightId: amountFixture.greenlight.greenlightId,
      observedParameters: changedAmountParameters(amountFixture.contract.parameters as X402PaymentParameters),
      surfaceOperationRef: "surface-op:x402-a2a:changed-amount",
    });

    expect(amountResult.outcome).toBe("gateway_check_refused");
    expect(amountResult.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("params_mismatch");
    expect(amountFixture.surface.signatureCount()).toBe(0);

    const endpointFixture = await createNegotiatedX402Greenlight();
    const endpointResult = await runX402WalletGateway({
      protocol: endpointFixture.kernel,
      surface: endpointFixture.surface,
      actionContractId: endpointFixture.contract.actionContractId,
      greenlightId: endpointFixture.greenlight.greenlightId,
      observedParameters: changedEndpointParameters(endpointFixture.contract.parameters as X402PaymentParameters),
      surfaceOperationRef: "surface-op:x402-a2a:changed-endpoint",
    });

    expect(endpointResult.outcome).toBe("gateway_check_refused");
    expect(endpointResult.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("params_mismatch");
    expect(endpointFixture.surface.signatureCount()).toBe(0);

    const selectedRequirementFixture = await createNegotiatedX402Greenlight();
    const selectedRequirementResult = await runX402WalletGateway({
      protocol: selectedRequirementFixture.kernel,
      surface: selectedRequirementFixture.surface,
      actionContractId: selectedRequirementFixture.contract.actionContractId,
      greenlightId: selectedRequirementFixture.greenlight.greenlightId,
      observedParameters: changedSelectedPaymentRequirementParameters(
        selectedRequirementFixture.contract.parameters as X402PaymentParameters,
      ),
      surfaceOperationRef: "surface-op:x402-a2a:changed-selected-requirement",
    });

    expect(selectedRequirementResult.outcome).toBe("gateway_check_refused");
    expect(selectedRequirementResult.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("params_mismatch");
    expect(selectedRequirementFixture.surface.signatureCount()).toBe(0);
  });

  it("ships JSON and Markdown fixture outputs without product overclaims", () => {
    const json = JSON.parse(
      readFileSync(join(import.meta.dir, "../../examples/a2a-negotiated-x402-room/latest.json"), "utf8"),
    ) as { fixtureKind: string; authorityBoundary: Record<string, unknown>; productReadback: Record<string, unknown> };
    const markdown = readFileSync(join(import.meta.dir, "../../examples/a2a-negotiated-x402-room/latest.md"), "utf8");
    const agentHandoff = readFileSync(
      join(import.meta.dir, "../../examples/a2a-negotiated-x402-room/agent-handoff.md"),
      "utf8",
    );
    const evaluation = readFileSync(
      join(import.meta.dir, "../../examples/a2a-negotiated-x402-room/evaluation.md"),
      "utf8",
    );

    expect(json.fixtureKind).toBe("a2a_negotiated_x402_room");
    expect(json.productReadback).toMatchObject({
      readbackKind: "a2a_negotiation_product_readback",
      status: "gateway_checked_downstream_unknown",
    });
    expect(json.authorityBoundary).toMatchObject({
      acceptedAgreementCreatedGreenlight: false,
      gatewayCheckRemainsFinalEnforcementPoint: true,
    });
    for (const forbidden of [
      "marketplace operation",
      "legal contract formation",
      "escrow",
      "settlement finality",
      "reputation",
      "cross-org trust",
      "provider custody",
      "reusable authority",
      "native_host_containment",
    ]) {
      expect(markdown).toContain(forbidden);
      expect(agentHandoff).toContain(forbidden);
      expect(evaluation).toContain(forbidden);
    }
    expect(evaluation).toMatch(/\|\s*DX\s*\|\s*9\.1\/10\s*\|/);
    expect(evaluation).toMatch(/\|\s*AX\s*\|\s*9\.2\/10\s*\|/);
    expect(evaluation).toMatch(/\|\s*CX\s*\|\s*9\.1\/10\s*\|/);
    expect(evaluation).toContain("This slice is a product-grade readback and handoff path");
  });

  it("keeps the developer onboarding output deterministic", async () => {
    const first = await buildA2ANegotiatedX402RoomOutput();
    const second = await buildA2ANegotiatedX402RoomOutput();

    expect(second).toEqual(first);
    expect(first.generatedAt).toBe("2026-05-26T00:00:00.000Z");
    expect(first.contract.actionContractId).toBe("act_00000000-0000-4000-8000-000000000008");
  });
});
