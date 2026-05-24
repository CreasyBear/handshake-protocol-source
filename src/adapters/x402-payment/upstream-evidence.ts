import { isPaymentRequiredV2, validatePaymentRequired, type PaymentRequiredV2 } from "@x402/core/schemas";
import { digestCanonical } from "../../protocol/foundation/canonical";
import type { JsonValue } from "../../protocol/foundation/schema-core";

export type X402OfficialSourceBasis = {
  repository: string;
  docs: Record<string, string>;
  packages: Record<string, string>;
  firstSlice: {
    role: "buyer";
    scheme: "exact";
    network: string;
    sdkSurface: readonly string[];
    unsupportedFirstSliceSurfaces: readonly string[];
  };
};

export type X402IntendedRequestEvidence = {
  method: string;
  url: string;
  requestBodyPosture?: "no_body" | "digest_bound" | "omitted" | "unsupported";
  bodyDigest: `sha256:${string}` | null;
  selectedHeadersDigest: `sha256:${string}`;
  providerEnvironmentPosture?: "local_reference_sandbox" | "external_sandbox" | "live" | "unknown";
  providerEnvironmentRef?: string | null;
};

export type X402PaymentRequiredEvidence = {
  evidenceKind: "x402_payment_required";
  authorityCreated: false;
  source: X402OfficialSourceBasis;
  intendedRequest: X402IntendedRequestEvidence;
  paymentRequired: PaymentRequiredV2;
  selectedPaymentRequirementIndex: number;
  selectedPaymentRequirement: PaymentRequiredV2["accepts"][number];
  selectedPaymentRequirementDigest: `sha256:${string}`;
  plannedCredentialEvidence: {
    paymentPayloadShape: "gateway_held_payment_payload";
    paymentSignatureHeader: "gateway_held_payment_signature";
    paymentResponseShape: "downstream_settlement_response_or_proof_gap";
  };
};

export type DecodeX402PaymentRequiredEvidenceInput = {
  source: X402OfficialSourceBasis;
  paymentRequiredHeader: string;
  intendedRequest: X402IntendedRequestEvidence;
  selectedPaymentRequirementIndex: number;
};

export async function decodeX402PaymentRequiredEvidence(
  input: DecodeX402PaymentRequiredEvidenceInput,
): Promise<X402PaymentRequiredEvidence> {
  const paymentRequired = validatePaymentRequired(decodeBase64Json(input.paymentRequiredHeader));
  if (!isPaymentRequiredV2(paymentRequired)) {
    throw new Error("Only x402 V2 PAYMENT-REQUIRED evidence is supported for the first upstream exact wedge.");
  }

  const selectedPaymentRequirementIndex = requireSelectedPaymentRequirementIndex(input.selectedPaymentRequirementIndex);
  const selectedRequirement = paymentRequired.accepts[selectedPaymentRequirementIndex];
  if (!selectedRequirement) {
    throw new Error("Selected x402 payment requirement index is outside the PAYMENT-REQUIRED accepts array.");
  }
  if (selectedRequirement.scheme !== "exact") {
    throw new Error("The first upstream x402 wedge requires the selected payment requirement to use exact.");
  }

  return {
    evidenceKind: "x402_payment_required",
    authorityCreated: false,
    source: input.source,
    intendedRequest: input.intendedRequest,
    paymentRequired,
    selectedPaymentRequirementIndex,
    selectedPaymentRequirement: selectedRequirement,
    selectedPaymentRequirementDigest: await digestX402SelectedPaymentRequirement({
      paymentRequired,
      selectedPaymentRequirementIndex,
      selectedPaymentRequirement: selectedRequirement,
    }),
    plannedCredentialEvidence: {
      paymentPayloadShape: "gateway_held_payment_payload",
      paymentSignatureHeader: "gateway_held_payment_signature",
      paymentResponseShape: "downstream_settlement_response_or_proof_gap",
    },
  };
}

export async function digestX402SelectedPaymentRequirement(input: {
  paymentRequired: PaymentRequiredV2;
  selectedPaymentRequirementIndex: number;
  selectedPaymentRequirement: PaymentRequiredV2["accepts"][number];
}): Promise<`sha256:${string}`> {
  return digestCanonical(
    toJsonValue({
      paymentRequired: input.paymentRequired,
      selectedPaymentRequirementIndex: input.selectedPaymentRequirementIndex,
      selectedPaymentRequirement: input.selectedPaymentRequirement,
    }),
  );
}

function requireSelectedPaymentRequirementIndex(value: number): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("Official x402 PAYMENT-REQUIRED evidence requires a non-negative selectedPaymentRequirementIndex.");
  }
  return value;
}

function toJsonValue(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

function decodeBase64Json(value: string): unknown {
  try {
    return JSON.parse(atob(value)) as unknown;
  } catch {
    throw new Error("PAYMENT-REQUIRED header must be Base64-encoded JSON.");
  }
}

export function isX402PaymentRequiredEvidenceAuthorityBearing(evidence: X402PaymentRequiredEvidence): boolean {
  return evidence.authorityCreated;
}
