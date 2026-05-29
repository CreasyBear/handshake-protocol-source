import { Buffer } from "node:buffer";
import { isPaymentRequiredV2, validatePaymentRequired } from "@x402/core/schemas";
import { gap, nonAuthorityBoundary, PROOF_PACKET_VERSION, stableDigest, type ProofGap } from "./shared";

export type LiveX402RequirementReadbackInput = {
  readonly generatedAt: string;
  readonly commandRefs: readonly string[];
  readonly request: {
    readonly method: string;
    readonly url: string;
    readonly responseStatus: number;
    readonly providerEnvironmentPosture: "live";
    readonly headersEvidenceRef: string;
  };
  readonly paymentRequiredHeader: string;
  readonly selectedPaymentRequirementIndex: number;
  readonly customerGatewayCustody: {
    readonly present: boolean;
    readonly proofRef: string | null;
    readonly digest: `sha256:${string}` | null;
  };
};

export type LiveX402RequirementReadback = ReturnType<typeof projectLiveX402RequirementReadback>;

export function projectLiveX402RequirementReadback(input: LiveX402RequirementReadbackInput) {
  const paymentRequired = validatePaymentRequired(
    JSON.parse(Buffer.from(input.paymentRequiredHeader, "base64").toString("utf8")),
  );
  if (!isPaymentRequiredV2(paymentRequired)) {
    throw new Error("Only x402 v2 PAYMENT-REQUIRED evidence is supported.");
  }
  const selectedPaymentRequirement = paymentRequired.accepts[input.selectedPaymentRequirementIndex];
  if (!selectedPaymentRequirement) throw new Error("Selected x402 payment requirement index is outside accepts.");
  if (selectedPaymentRequirement.scheme !== "exact") {
    throw new Error("The live x402 first wedge only admits exact requirements.");
  }
  const status =
    input.request.responseStatus === 402 && input.customerGatewayCustody.present
      ? ("ready_for_gateway_signed_retry" as const)
      : ("blocked" as const);
  const selectedPaymentRequirementDigest = stableDigest({
    paymentRequired,
    selectedPaymentRequirementIndex: input.selectedPaymentRequirementIndex,
    selectedPaymentRequirement,
  });

  return {
    proofKind: "live_x402_requirement_readback" as const,
    proofVersion: PROOF_PACKET_VERSION,
    generatedAt: input.generatedAt,
    status,
    scope:
      "Live x402 Payment Required challenge readback for one buyer-side exact protected action. This is not payment execution.",
    request: input.request,
    paymentRequired: {
      x402Version: paymentRequired.x402Version,
      resource: paymentRequired.resource,
      acceptsCount: paymentRequired.accepts.length,
      selectedPaymentRequirementIndex: input.selectedPaymentRequirementIndex,
      selectedPaymentRequirement,
      selectedPaymentRequirementDigest,
    },
    customerGatewayCustody: input.customerGatewayCustody,
    commandRefs: input.commandRefs,
    evidenceRefs: [
      input.request.headersEvidenceRef,
      `selected-payment-requirement:${selectedPaymentRequirementDigest}`,
    ],
    authorityBoundary: {
      ...nonAuthorityBoundary,
      resolvesCredential: false as const,
      invokesSigner: false as const,
      createsPaymentPayload: false as const,
      provesCustomerGatewayCustody: input.customerGatewayCustody.present,
      provesLivePaidExecution: false as const,
      provesSettlementFinality: false as const,
      provesProviderCustody: false as const,
      certifiesMarketplace: false as const,
    },
    proofGaps: liveX402ProofGaps({
      responseStatus: input.request.responseStatus,
      custodyPresent: input.customerGatewayCustody.present,
    }),
    nextMechanism: input.customerGatewayCustody.present
      ? "Create one exact x402 action contract from the selected requirement and run a post-VerifiedGatewayCheck signed retry."
      : "Attach a funded customer-gateway custody packet before any live signed retry can be attempted.",
  };
}

function liveX402ProofGaps(input: { readonly responseStatus: number; readonly custodyPresent: boolean }): ProofGap[] {
  const gaps: ProofGap[] = [];
  if (input.responseStatus !== 402) {
    gaps.push(
      gap(
        "live_x402_payment_required_not_observed",
        "The live endpoint did not return HTTP 402 in the captured response.",
      ),
    );
  }
  if (!input.custodyPresent) {
    gaps.push(
      gap(
        "customer_gateway_custody_packet_absent",
        "A live 402 challenge does not prove customer-gateway-held signer custody.",
      ),
    );
  }
  gaps.push(gap("live_paid_retry_not_performed", "No post-VerifiedGatewayCheck live x402 signed retry was performed."));
  gaps.push(
    gap(
      "settlement_finality_not_proven",
      "A challenge readback does not prove settlement finality or downstream business success.",
    ),
  );
  return gaps;
}
