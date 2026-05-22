import { describe, expect, it } from "bun:test";
import { parsePaymentPayload, parsePaymentRequired } from "@x402/core/schemas";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { wrapFetchWithPayment } from "@x402/fetch";
import * as x402Payment from "../../src/adapters/x402-payment";

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

const officialPaymentPayloadShape = {
  x402Version: 2,
  resource: officialPaymentRequired.resource,
  accepted: officialPaymentRequired.accepts[0],
  payload: {
    signature: "0x" + "a".repeat(130),
    authorization: {
      from: "0xClientWallet",
      to: officialPaymentRequired.accepts[0].payTo,
      value: officialPaymentRequired.accepts[0].amount,
      validAfter: "0",
      validBefore: "1779359999",
      nonce: "0x" + "b".repeat(64),
    },
  },
  extensions: {
    "payment-identifier": {
      paymentId: "pay_handshake_exact_fixture",
    },
  },
} as const;

const officialPaymentResponseShape = {
  success: true,
  transaction: "0x" + "c".repeat(64),
  network: officialPaymentRequired.accepts[0].network,
  amount: officialPaymentRequired.accepts[0].amount,
  payer: "0xClientWallet",
  extensions: {
    "payment-identifier": {
      paymentId: "pay_handshake_exact_fixture",
    },
  },
} as const;

type UpstreamEvidenceAdapter = typeof x402Payment & {
  decodeX402PaymentRequiredEvidence?: (input: {
    source: typeof officialX402SourceBasis;
    paymentRequiredHeader: string;
    selectedPaymentRequirementIndex: number;
    intendedRequest: {
      method: string;
      url: string;
      bodyDigest: string | null;
      selectedHeadersDigest: string;
    };
  }) => Promise<{
    evidenceKind: "x402_payment_required";
    authorityCreated: false;
    paymentRequired: typeof officialPaymentRequired;
    selectedPaymentRequirementIndex: number;
    selectedPaymentRequirement: (typeof officialPaymentRequired)["accepts"][number];
    selectedPaymentRequirementDigest: `sha256:${string}`;
    plannedCredentialEvidence: {
      paymentPayloadShape: "gateway_held_payment_payload";
      paymentSignatureHeader: "gateway_held_payment_signature";
      paymentResponseShape: "downstream_settlement_response_or_proof_gap";
    };
  }>;
};

describe("upstream x402 exact fixture parity", () => {
  it("pins the official upstream source and first-slice package basis", () => {
    expect(officialX402SourceBasis.repository).toBe("https://github.com/x402-foundation/x402");
    expect(officialX402SourceBasis.packages).toEqual({
      "@x402/core": "2.12.0",
      "@x402/evm": "2.12.0",
      "@x402/fetch": "2.12.0",
    });
    expect(officialX402SourceBasis.firstSlice).toMatchObject({
      role: "buyer",
      scheme: "exact",
      network: "eip155:84532",
    });
    expect(officialX402SourceBasis.firstSlice.unsupportedFirstSliceSurfaces).toEqual([
      "upto",
      "batch-settlement",
      "lifecycle-hooks",
      "mcp-auto-pay",
      "signed-offers",
      "signed-receipts",
      "seller-middleware",
      "facilitator-operation",
    ]);
  });

  it("smokes the installed official TypeScript SDK surface for the first slice", () => {
    expect(typeof parsePaymentRequired).toBe("function");
    expect(typeof parsePaymentPayload).toBe("function");
    expect(typeof ExactEvmScheme).toBe("function");
    expect(typeof wrapFetchWithPayment).toBe("function");

    const paymentRequiredResult = parsePaymentRequired(officialPaymentRequired);
    const paymentPayloadResult = parsePaymentPayload(officialPaymentPayloadShape);

    expect(paymentRequiredResult.success).toBe(true);
    expect(paymentPayloadResult.success).toBe(true);
  });

  it("decodes V2 PAYMENT-REQUIRED into proposal evidence before any Handshake authority exists", async () => {
    const adapter = x402Payment as UpstreamEvidenceAdapter;

    expect(typeof adapter.decodeX402PaymentRequiredEvidence).toBe("function");

    const evidence = await adapter.decodeX402PaymentRequiredEvidence!({
      source: officialX402SourceBasis,
      paymentRequiredHeader: base64Json(officialPaymentRequired),
      selectedPaymentRequirementIndex: 0,
      intendedRequest: {
        method: "GET",
        url: officialPaymentRequired.resource.url,
        bodyDigest: null,
        selectedHeadersDigest: `sha256:${"d".repeat(64)}`,
      },
    });

    expect(evidence).toMatchObject({
      evidenceKind: "x402_payment_required",
      authorityCreated: false,
      paymentRequired: officialPaymentRequired,
      selectedPaymentRequirementIndex: 0,
      selectedPaymentRequirement: officialPaymentRequired.accepts[0],
      plannedCredentialEvidence: {
        paymentPayloadShape: "gateway_held_payment_payload",
        paymentSignatureHeader: "gateway_held_payment_signature",
        paymentResponseShape: "downstream_settlement_response_or_proof_gap",
      },
    });
    const evidenceJson = JSON.stringify(evidence);
    expect(evidenceJson).not.toContain("policyDecisionRef");
    expect(evidenceJson).not.toContain("greenlight");
    expect(evidenceJson).not.toContain("gatewayCheck");
    expect(evidenceJson).not.toContain("mutationAttempt");
    expect(evidenceJson).not.toContain("receiptRef");
    expect(evidenceJson).not.toContain("certificate");
    expect(evidenceJson).not.toContain(officialPaymentPayloadShape.payload.signature);
    expect(evidenceJson).not.toContain("PAYMENT-SIGNATURE");
  });

  it("selects the requested upstream exact requirement instead of the first exact match", async () => {
    const adapter = x402Payment as UpstreamEvidenceAdapter;
    const paymentRequired = {
      ...officialPaymentRequired,
      accepts: [
        officialPaymentRequired.accepts[0],
        {
          ...officialPaymentRequired.accepts[0],
          amount: "5000",
          payTo: "0x1111111111111111111111111111111111111111",
        },
      ],
    } as const;

    const evidence = await adapter.decodeX402PaymentRequiredEvidence!({
      source: officialX402SourceBasis,
      paymentRequiredHeader: base64Json(paymentRequired),
      selectedPaymentRequirementIndex: 1,
      intendedRequest: {
        method: "GET",
        url: officialPaymentRequired.resource.url,
        bodyDigest: null,
        selectedHeadersDigest: `sha256:${"d".repeat(64)}`,
      },
    });

    expect(evidence.selectedPaymentRequirementIndex).toBe(1);
    expect(evidence.selectedPaymentRequirement).toMatchObject({
      amount: "5000",
      payTo: "0x1111111111111111111111111111111111111111",
    });
  });

  it("refuses official PAYMENT-REQUIRED evidence without an explicit selected index", async () => {
    const adapter = x402Payment as UpstreamEvidenceAdapter;

    await expect(
      adapter.decodeX402PaymentRequiredEvidence!({
        source: officialX402SourceBasis,
        paymentRequiredHeader: base64Json(officialPaymentRequired),
        intendedRequest: {
          method: "GET",
          url: officialPaymentRequired.resource.url,
          bodyDigest: null,
          selectedHeadersDigest: `sha256:${"d".repeat(64)}`,
        },
      } as Parameters<NonNullable<UpstreamEvidenceAdapter["decodeX402PaymentRequiredEvidence"]>>[0]),
    ).rejects.toThrow(/selectedPaymentRequirementIndex/);
  });

  it("refuses a selected upstream requirement outside the exact first wedge", async () => {
    const adapter = x402Payment as UpstreamEvidenceAdapter;
    const paymentRequired = {
      ...officialPaymentRequired,
      accepts: [
        officialPaymentRequired.accepts[0],
        {
          ...officialPaymentRequired.accepts[0],
          scheme: "upto",
        },
      ],
    } as const;

    await expect(
      adapter.decodeX402PaymentRequiredEvidence!({
        source: officialX402SourceBasis,
        paymentRequiredHeader: base64Json(paymentRequired),
        selectedPaymentRequirementIndex: 1,
        intendedRequest: {
          method: "GET",
          url: officialPaymentRequired.resource.url,
          bodyDigest: null,
          selectedHeadersDigest: `sha256:${"d".repeat(64)}`,
        },
      }),
    ).rejects.toThrow(/exact/);
  });

  it("binds identical upstream requirements at different indexes to distinct selected digests", async () => {
    const adapter = x402Payment as UpstreamEvidenceAdapter;
    const paymentRequired = {
      ...officialPaymentRequired,
      accepts: [officialPaymentRequired.accepts[0], officialPaymentRequired.accepts[0]],
    } as const;
    const intendedRequest = {
      method: "GET",
      url: officialPaymentRequired.resource.url,
      bodyDigest: null,
      selectedHeadersDigest: `sha256:${"d".repeat(64)}`,
    };

    const first = await adapter.decodeX402PaymentRequiredEvidence!({
      source: officialX402SourceBasis,
      paymentRequiredHeader: base64Json(paymentRequired),
      selectedPaymentRequirementIndex: 0,
      intendedRequest,
    });
    const second = await adapter.decodeX402PaymentRequiredEvidence!({
      source: officialX402SourceBasis,
      paymentRequiredHeader: base64Json(paymentRequired),
      selectedPaymentRequirementIndex: 1,
      intendedRequest,
    });

    expect(first.selectedPaymentRequirement).toEqual(second.selectedPaymentRequirement);
    expect(first.selectedPaymentRequirementDigest).not.toBe(second.selectedPaymentRequirementDigest);
  });

  it("treats payment credential and response fixtures as planned private/downstream evidence, not local parity proof", () => {
    expect(officialPaymentPayloadShape.payload).toHaveProperty("signature");
    expect(officialPaymentPayloadShape.accepted).toMatchObject({
      scheme: "exact",
      amount: "2500",
      payTo: "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
    });
    expect(officialPaymentResponseShape).toMatchObject({
      success: true,
      network: "eip155:84532",
      amount: "2500",
    });
  });

  it("rejects local proof-profile fields as insufficient upstream PaymentRequired evidence", () => {
    const localProofProfileOnly = {
      endpointUrl: officialPaymentRequired.resource.url,
      payee: officialPaymentRequired.accepts[0].payTo,
      network: "base-sepolia",
      token: "USDC",
      atomicAmount: "2500",
      paymentRequirementsDigest: `sha256:${"e".repeat(64)}`,
      facilitatorRef: "facilitator:local",
    };

    expect(isOfficialPaymentRequired(localProofProfileOnly)).toBe(false);
  });

  it("classifies unsupported upstream surfaces without coercing them into x402_payment.exact", () => {
    const expectedReasons = {
      "batch-settlement": "x402_cut_unsupported_batch_settlement",
      "facilitator-operation": "x402_cut_unsupported_facilitator_operation",
      "lifecycle-hooks": "x402_cut_unsupported_lifecycle_hooks",
      "mcp-auto-pay": "x402_cut_unsupported_mcp_auto_pay",
      "seller-middleware": "x402_cut_unsupported_seller_middleware",
      "signed-offers": "x402_cut_unsupported_signed_offers",
      "signed-receipts": "x402_cut_unsupported_signed_receipts",
      upto: "x402_cut_unsupported_upto",
    } as const;

    for (const surface of officialX402SourceBasis.firstSlice.unsupportedFirstSliceSurfaces) {
      const classification = x402Payment.classifyX402FirstWedgeSurface(surface);

      expect(classification.supported).toBe(false);
      expect(classification.actionClass).toBeNull();
      expect(classification.cutLine).toBe("unsupported_first_wedge");
      expect(classification.reasonCode).toBe(expectedReasons[surface]);
      expect(JSON.stringify(classification)).not.toContain("x402_payment.exact");
    }
  });
});

function base64Json(value: unknown): string {
  return btoa(JSON.stringify(value));
}

function isOfficialPaymentRequired(value: unknown): value is typeof officialPaymentRequired {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.x402Version === 2 &&
    typeof candidate.resource === "object" &&
    Array.isArray(candidate.accepts) &&
    candidate.accepts.every(isOfficialPaymentRequirement)
  );
}

function isOfficialPaymentRequirement(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.scheme === "string" &&
    typeof candidate.network === "string" &&
    typeof candidate.asset === "string" &&
    typeof candidate.amount === "string" &&
    typeof candidate.payTo === "string" &&
    typeof candidate.maxTimeoutSeconds === "number"
  );
}
