import { describe, expect, it } from "bun:test";
import {
  assertX402PaymentInstallConformance,
  checkX402PaymentInstallConformance,
  classifyX402FirstWedgeEvidenceLabel,
  classifyX402FirstWedgeSurface,
} from "../../src/conformance";

const unsupportedFirstWedgeCases = [
  ["upto", "x402_cut_unsupported_upto"],
  ["batch-settlement", "x402_cut_unsupported_batch_settlement"],
  ["lifecycle-hooks", "x402_cut_unsupported_lifecycle_hooks"],
  ["mcp-auto-pay", "x402_cut_unsupported_mcp_auto_pay"],
  ["signed-offers", "x402_cut_unsupported_signed_offers"],
  ["signed-receipts", "x402_cut_unsupported_signed_receipts"],
  ["seller-middleware", "x402_cut_unsupported_seller_middleware"],
  ["facilitator-operation", "x402_cut_unsupported_facilitator_operation"],
  ["settlement-finality", "x402_cut_unsupported_settlement_finality"],
] as const;

describe("x402 payment install conformance", () => {
  it("passes only when signer custody and bypass probes close the raw x402 path", () => {
    const result = checkX402PaymentInstallConformance({
      signerCustodyStatus: "fixture_gateway_held",
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
    });

    expect(result.passed).toBe(true);
    expect(result.reasonCodes).toEqual([]);
  });

  it("fails when official signer side channels remain reachable", () => {
    const result = checkX402PaymentInstallConformance({
      signerCustodyStatus: "agent_exposed",
      rawPrivateKeyEnvStatus: "present",
      directCoreClientSigningStatus: "present",
      paidFetchClientStatus: "present",
      paidAxiosClientStatus: "absent",
      rawPaymentSignatureHeaderStatus: "present",
      siblingX402WrapperStatus: "present",
      mcpDirectPaymentStatus: "blocked",
      tokenPassthroughStatus: "blocked",
      wrapperDriftStatus: "absent",
      failureClosedStatus: "passed",
    });

    expect(result.passed).toBe(false);
    expect(result.reasonCodes).toEqual([
      "x402_direct_core_signing_not_blocked",
      "x402_paid_fetch_client_not_blocked",
      "x402_raw_payment_signature_header_not_blocked",
      "x402_raw_private_key_env_not_absent",
      "x402_sibling_wrapper_not_blocked",
      "x402_signer_not_gateway_held",
    ]);
  });

  it("throws assertion errors with the failing conformance reasons", () => {
    expect(() =>
      assertX402PaymentInstallConformance({
        signerCustodyStatus: "fixture_gateway_held",
        rawPrivateKeyEnvStatus: "absent",
        directCoreClientSigningStatus: "blocked",
        paidFetchClientStatus: "blocked",
        paidAxiosClientStatus: "absent",
        rawPaymentSignatureHeaderStatus: "blocked",
        siblingX402WrapperStatus: "blocked",
        mcpDirectPaymentStatus: "present",
        tokenPassthroughStatus: "unknown",
        wrapperDriftStatus: "present",
        failureClosedStatus: "failed",
      }),
    ).toThrow("x402 payment install conformance failed");
  });
});

describe("x402 first-wedge surface classification", () => {
  it("keeps the first wedge scoped to exact payment attempts", () => {
    expect(classifyX402FirstWedgeSurface("exact")).toEqual({
      actionClass: "x402_payment.exact",
      cutLine: null,
      reasonCode: null,
      supported: true,
      surface: "exact",
    });
  });

  it.each(unsupportedFirstWedgeCases)(
    "classifies %s as an unsupported first-wedge cut line",
    (surface, expectedReasonCode) => {
      const result = classifyX402FirstWedgeSurface(surface);

      expect(result).toEqual({
        actionClass: null,
        cutLine: "unsupported_first_wedge",
        reasonCode: expectedReasonCode,
        supported: false,
        surface,
      });
      expect(result.actionClass).not.toBe("x402_payment.exact");
    },
  );
});

describe("x402 first-wedge evidence taxonomy", () => {
  it("distinguishes gateway, credential, reconciliation, and response evidence without creating authority", () => {
    expect(classifyX402FirstWedgeEvidenceLabel("local_gateway_check")).toMatchObject({
      authorityCreated: false,
      evidenceRole: "gateway_check",
      firstWedgeOperation: "supported_evidence_only",
      settlementFinality: "not_settlement_finality",
    });
    expect(classifyX402FirstWedgeEvidenceLabel("payment_payload_created")).toMatchObject({
      authorityCreated: false,
      evidenceRole: "gateway_held_payment_credential",
      settlementFinality: "not_settlement_finality",
    });
    expect(classifyX402FirstWedgeEvidenceLabel("downstream_reconciliation_recorded")).toMatchObject({
      authorityCreated: false,
      evidenceRole: "downstream_reconciliation",
      settlementFinality: "not_settlement_finality",
    });
    expect(classifyX402FirstWedgeEvidenceLabel("payment_response_received")).toMatchObject({
      authorityCreated: false,
      evidenceRole: "payment_response",
      settlementFinality: "settlement_unknown",
    });
    expect(classifyX402FirstWedgeEvidenceLabel("local_reference_downstream_fixture")).toMatchObject({
      authorityCreated: false,
      evidenceRole: "local_reference_fixture",
      firstWedgeOperation: "supported_evidence_only",
      settlementFinality: "not_settlement_finality",
    });
  });

  it("keeps facilitator verify evidence from masquerading as settlement finality", () => {
    for (const label of [
      "facilitator_verify_attempted",
      "facilitator_verify_succeeded",
      "facilitator_verify_failed",
    ] as const) {
      expect(classifyX402FirstWedgeEvidenceLabel(label)).toMatchObject({
        authorityCreated: false,
        evidenceRole: "facilitator_verify",
        firstWedgeOperation: "supported_evidence_only",
        settlementFinality: "not_settlement_finality",
      });
    }
  });

  it("keeps facilitator settlement labels outside first-wedge operation authority", () => {
    for (const label of [
      "facilitator_settle_attempted",
      "settlement_succeeded",
      "settlement_failed",
      "settlement_unknown",
    ] as const) {
      expect(classifyX402FirstWedgeEvidenceLabel(label)).toMatchObject({
        authorityCreated: false,
        evidenceRole: "facilitator_settlement",
        firstWedgeOperation: "unsupported_facilitator_operation",
      });
    }
  });
});
