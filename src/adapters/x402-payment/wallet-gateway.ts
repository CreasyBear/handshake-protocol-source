import { z } from "zod";
import { x402Client, x402HTTPClient } from "@x402/core/client";
import {
  isPaymentRequiredV2,
  validatePaymentPayload,
  validatePaymentRequired,
  type PaymentRequiredV2,
  type PaymentRequirementsV2,
} from "@x402/core/schemas";
import type {
  Network as OfficialX402Network,
  PaymentRequired as OfficialPaymentRequired,
  PaymentRequirements as OfficialPaymentRequirements,
} from "@x402/core/types";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import type { ClientEvmSigner } from "@x402/evm";
import { digestX402SelectedPaymentRequirement } from "./upstream-evidence";
import { digestCanonical } from "../../protocol/foundation/canonical";
import { DigestSchema } from "../../protocol/foundation/schema-core";
import {
  verifiedGatewayCheckFromResult,
  type GatewayCheckInput,
  type GatewayCheckResult,
  type VerifiedGatewayCheck,
} from "../../protocol/areas/gateway-gate";
import type {
  ReconcileSurfaceOperationInput,
  SurfaceOperationReconciliation,
  SurfaceOperationReconciliationResult,
} from "../../protocol/areas/operation-lifecycle";

const AtomicAmountSchema = z.string().regex(/^(?:0|[1-9]\d*)$/);
const PaymentIdentifierSchema = z
  .string()
  .min(16)
  .max(128)
  .regex(/^[a-zA-Z0-9_-]+$/);
const X402EvidenceProfileSchema = z.enum(["official_payment_required", "local_digest_profile"]);

export const X402PaymentParametersSchema = z.strictObject({
  endpointUrl: z.string().url(),
  endpointDomain: z.string().min(1),
  intendedHttpMethod: z.string().min(1).nullable().default(null),
  intendedRequestUrl: z.string().url().nullable().default(null),
  intendedRequestBodyDigest: DigestSchema.nullable().default(null),
  selectedHeadersDigest: DigestSchema.nullable().default(null),
  x402Version: z.number().int().positive().nullable().default(null),
  x402Scheme: z.string().min(1).nullable().default(null),
  payee: z.string().min(1),
  payTo: z.string().min(1).nullable().default(null),
  network: z.string().min(1),
  token: z.string().min(1),
  asset: z.string().min(1).nullable().default(null),
  atomicAmount: AtomicAmountSchema,
  x402EvidenceProfile: X402EvidenceProfileSchema.default("local_digest_profile"),
  paymentRequirementsDigest: DigestSchema,
  selectedPaymentRequirementIndex: z.number().int().nonnegative().nullable().default(null),
  selectedPaymentRequirementDigest: DigestSchema.nullable().default(null),
  maxTimeoutSeconds: z.number().positive().nullable().default(null),
  paymentIdentifierPosture: z.enum(["not_advertised", "advertised_absent", "bound"]).default("not_advertised"),
  paymentIdentifierRef: z.string().min(1).nullable().default(null),
  paymentIdentifierDigest: DigestSchema.nullable().default(null),
  facilitatorRef: z.string().min(1).nullable().default(null),
  sdkPackageVersions: z.record(z.string(), z.string().min(1)).default({}),
  extensionKeys: z.array(z.string().min(1)).default([]),
});
export type X402PaymentParameters = z.infer<typeof X402PaymentParametersSchema>;

export type X402PaymentSignatureCommand = {
  verifiedGate: VerifiedGatewayCheck;
  parameters: X402PaymentParameters;
};

export type X402PaymentSignatureEvidence = {
  evidenceRef: string;
  surfaceOperationRef: string;
  paymentSignatureHeaderName: "PAYMENT-SIGNATURE";
  paymentSignatureHeaderRef: string;
  paymentSignatureDigest: `sha256:${string}`;
  paymentPayloadShape: "official_x402_payment_payload_v2" | "local_fixture_payment_signature";
  paymentPayloadRef?: string;
  paymentPayloadDigest?: `sha256:${string}`;
  paymentIdentifierRef?: string;
  paymentIdentifierDigest?: `sha256:${string}`;
  credentialMaterialPosture: "gateway_held_redacted" | "local_fixture";
  downstreamPaymentStatus: "succeeded" | "unknown";
  paymentResponseEvidenceRef: string | null;
  providerRequestRef: string | null;
  providerOperationRef: string | null;
};

export interface X402WalletSigningSurface {
  signPayment(command: X402PaymentSignatureCommand): Promise<X402PaymentSignatureEvidence>;
}

export type CreateOfficialExactX402SigningSurfaceInput = {
  signer: ClientEvmSigner;
  paymentRequired: unknown;
  selectedPaymentRequirementIndex: number;
  selectedPaymentRequirementDigest: `sha256:${string}`;
  paymentIdentifier?: string | null;
  downstreamPaymentStatus?: "succeeded" | "unknown";
  paymentResponseEvidenceRef?: string | null;
  providerRequestRef?: string | null;
  providerOperationRef?: string | null;
};

export type X402WalletGatewayProtocol = {
  gatewayCheck(input: GatewayCheckInput): Promise<GatewayCheckResult>;
  reconcileSurfaceOperation(input: ReconcileSurfaceOperationInput): Promise<SurfaceOperationReconciliationResult>;
};

export type X402WalletGatewayInput = {
  protocol: X402WalletGatewayProtocol;
  surface: X402WalletSigningSurface;
  actionContractId: string;
  greenlightId: string;
  observedParameters: X402PaymentParameters;
  surfaceOperationRef?: string;
};

export type X402WalletGatewayResult =
  | {
      outcome: "gateway_check_refused";
      gatewayCheck: GatewayCheckResult;
      reconciliation: null;
      signatureEvidence: null;
    }
  | {
      outcome: "gateway_check_not_authoritative";
      gatewayCheck: GatewayCheckResult;
      reconciliation: null;
      signatureEvidence: null;
    }
  | {
      outcome: "payment_signature_reconciled";
      gatewayCheck: GatewayCheckResult;
      reconciliation: SurfaceOperationReconciliation;
      signatureEvidence: X402PaymentSignatureEvidence;
    }
  | {
      outcome: "payment_signature_proof_gap";
      gatewayCheck: GatewayCheckResult;
      reconciliation: SurfaceOperationReconciliation;
      signatureEvidence: X402PaymentSignatureEvidence;
    }
  | {
      outcome: "payment_signature_failed";
      gatewayCheck: GatewayCheckResult;
      reconciliation: SurfaceOperationReconciliation;
      signatureEvidence: null;
    };

export async function runX402WalletGateway(input: X402WalletGatewayInput): Promise<X402WalletGatewayResult> {
  const observedParameters = X402PaymentParametersSchema.parse(input.observedParameters);
  const surfaceOperationRef = input.surfaceOperationRef ?? `surface-op:x402:${input.actionContractId}`;
  const gatewayCheck = await input.protocol.gatewayCheck({
    actionContractId: input.actionContractId,
    greenlightId: input.greenlightId,
    observedParameters,
    surfaceOperationRef,
  });

  const verifiedGate = verifiedGatewayCheckFromResult(gatewayCheck);
  if (!verifiedGate) {
    const outcome =
      gatewayCheck.gateAttempt.gateDecision === "refused" ? "gateway_check_refused" : "gateway_check_not_authoritative";
    return { outcome, gatewayCheck, reconciliation: null, signatureEvidence: null };
  }

  try {
    const signatureEvidence = await input.surface.signPayment({ verifiedGate, parameters: observedParameters });
    const evidenceRefs = [
      signatureEvidence.evidenceRef,
      signatureEvidence.paymentSignatureHeaderRef,
      `digest:${signatureEvidence.paymentSignatureDigest}`,
      signatureEvidence.paymentPayloadRef ?? null,
      signatureEvidence.paymentPayloadDigest ? `digest:${signatureEvidence.paymentPayloadDigest}` : null,
      signatureEvidence.paymentIdentifierRef ?? null,
      signatureEvidence.paymentIdentifierDigest ? `digest:${signatureEvidence.paymentIdentifierDigest}` : null,
      signatureEvidence.paymentResponseEvidenceRef,
    ].filter((value): value is string => value !== null);
    const { reconciliation } = await input.protocol.reconcileSurfaceOperation({
      mutationAttemptId: verifiedGate.mutationAttemptId,
      idempotencyKey: verifiedGate.idempotencyKey,
      observedSurfaceOperationRef: signatureEvidence.surfaceOperationRef,
      observedDownstreamStatus: signatureEvidence.downstreamPaymentStatus,
      downstreamRetryability: signatureEvidence.downstreamPaymentStatus === "succeeded" ? "non_retryable" : "unknown",
      providerRequestRef: signatureEvidence.providerRequestRef,
      providerOperationRef: signatureEvidence.providerOperationRef,
      diagnosticsRedactionPosture: "redacted",
      evidenceRefs,
      resolvedProofGapIds: [],
    });
    const outcome =
      signatureEvidence.downstreamPaymentStatus === "succeeded"
        ? "payment_signature_reconciled"
        : "payment_signature_proof_gap";
    return { outcome, gatewayCheck, reconciliation, signatureEvidence };
  } catch {
    const { reconciliation } = await input.protocol.reconcileSurfaceOperation({
      mutationAttemptId: verifiedGate.mutationAttemptId,
      idempotencyKey: verifiedGate.idempotencyKey,
      observedSurfaceOperationRef: surfaceOperationRef,
      observedDownstreamStatus: "failed",
      downstreamRetryability: "unknown",
      providerRequestRef: null,
      providerOperationRef: surfaceOperationRef,
      redactedDiagnosticsDigest: await digestCanonical({ adapter: "x402-wallet-gateway", surfaceOperationRef }),
      diagnosticsRedactionPosture: "digest_only",
      evidenceRefs: [`evidence:x402-payment-signature-failed:${surfaceOperationRef}`],
      resolvedProofGapIds: [],
    });
    return { outcome: "payment_signature_failed", gatewayCheck, reconciliation, signatureEvidence: null };
  }
}

export function createOfficialExactX402SigningSurface(
  input: CreateOfficialExactX402SigningSurfaceInput,
): X402WalletSigningSurface {
  const paymentRequired = validateOfficialPaymentRequired(input.paymentRequired);
  const paymentIdentifier = input.paymentIdentifier ? PaymentIdentifierSchema.parse(input.paymentIdentifier) : null;
  if (paymentIdentifier && !paymentRequiredAdvertisesPaymentIdentifier(paymentRequired)) {
    throw new Error("Official x402 payment identifier cannot be bound when the server did not advertise support.");
  }
  const paymentRequiredForClient = toOfficialClientPaymentRequired(
    paymentIdentifier ? bindPaymentIdentifier(paymentRequired, paymentIdentifier) : paymentRequired,
  );

  return {
    async signPayment(command: X402PaymentSignatureCommand): Promise<X402PaymentSignatureEvidence> {
      const paymentIdentifierDigest = await verifyPaymentIdentifierBinding({
        parameters: command.parameters,
        paymentIdentifier,
      });
      const selectedRequirement = await verifyOfficialExactSigningInput({
        paymentRequired,
        parameters: command.parameters,
        selectedPaymentRequirementIndex: input.selectedPaymentRequirementIndex,
        selectedPaymentRequirementDigest: input.selectedPaymentRequirementDigest,
      });
      const client = new x402Client((_x402Version, requirements) => {
        const selected = requirements[input.selectedPaymentRequirementIndex];
        if (!selected) {
          throw new Error("Official x402 payment requirements drifted before gateway signing.");
        }
        if (!paymentRequirementMatches(selected, selectedRequirement)) {
          throw new Error("Official x402 selected payment requirement drifted before gateway signing.");
        }
        return selected;
      }).register(command.parameters.network as OfficialX402Network, new ExactEvmScheme(input.signer));
      const httpClient = new x402HTTPClient(client);
      const paymentPayload = await client.createPaymentPayload(paymentRequiredForClient);
      validatePaymentPayload(paymentPayload);
      const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);
      const paymentSignature = paymentHeaders["PAYMENT-SIGNATURE"];
      if (!paymentSignature) {
        throw new Error("Official x402 SDK did not create a PAYMENT-SIGNATURE header for the gateway retry.");
      }
      const paymentPayloadDigest = await digestCanonical(toJsonValue(paymentPayload));
      const paymentSignatureDigest = await digestCanonical({ headerName: "PAYMENT-SIGNATURE", paymentSignature });

      return {
        evidenceRef: `evidence:x402-official-payment-signature:${command.verifiedGate.gateAttemptId}`,
        surfaceOperationRef: command.verifiedGate.surfaceOperationRef,
        paymentSignatureHeaderName: "PAYMENT-SIGNATURE",
        paymentSignatureHeaderRef: `credential:x402-payment-signature:${command.verifiedGate.gateAttemptId}`,
        paymentSignatureDigest,
        paymentPayloadShape: "official_x402_payment_payload_v2",
        paymentPayloadRef: `credential:x402-payment-payload:${command.verifiedGate.gateAttemptId}`,
        paymentPayloadDigest,
        ...(paymentIdentifier
          ? {
              paymentIdentifierRef: `payment-identifier:x402:${command.verifiedGate.gateAttemptId}`,
              paymentIdentifierDigest: requirePaymentIdentifierDigest(paymentIdentifierDigest),
            }
          : {}),
        credentialMaterialPosture: "gateway_held_redacted",
        downstreamPaymentStatus: input.downstreamPaymentStatus ?? "unknown",
        paymentResponseEvidenceRef: input.paymentResponseEvidenceRef ?? null,
        providerRequestRef: input.providerRequestRef ?? `provider-request:x402:${command.verifiedGate.gateAttemptId}`,
        providerOperationRef:
          input.providerOperationRef ?? `provider-operation:x402:${command.verifiedGate.gateAttemptId}`,
      };
    },
  };
}

function validateOfficialPaymentRequired(value: unknown): PaymentRequiredV2 {
  const paymentRequired = validatePaymentRequired(value);
  if (!isPaymentRequiredV2(paymentRequired)) {
    throw new Error("Official x402 gateway signing only supports V2 PaymentRequired evidence in the first wedge.");
  }
  return paymentRequired;
}

async function verifyPaymentIdentifierBinding(input: {
  parameters: X402PaymentParameters;
  paymentIdentifier: string | null;
}): Promise<`sha256:${string}` | null> {
  const { parameters, paymentIdentifier } = input;
  if (!paymentIdentifier) {
    if (parameters.paymentIdentifierPosture === "bound") {
      throw new Error("Official x402 gateway signing refused missing bound payment identifier material.");
    }
    return null;
  }
  const paymentIdentifierDigest = await digestCanonical({
    paymentIdentifier,
    paymentIdentifierExtension: "payment-identifier",
  });
  if (parameters.paymentIdentifierPosture !== "bound") {
    throw new Error("Official x402 gateway signing refused unbound payment identifier posture.");
  }
  if (parameters.paymentIdentifierDigest !== paymentIdentifierDigest) {
    throw new Error("Official x402 gateway signing refused payment identifier digest drift.");
  }
  return paymentIdentifierDigest;
}

function toOfficialClientPaymentRequired(paymentRequired: PaymentRequiredV2): OfficialPaymentRequired {
  return toJsonValue(paymentRequired) as OfficialPaymentRequired;
}

function bindPaymentIdentifier(paymentRequired: PaymentRequiredV2, paymentIdentifier: string): PaymentRequiredV2 {
  const clone = toJsonValue(paymentRequired) as PaymentRequiredV2;
  const existing = clone.extensions?.["payment-identifier"];
  clone.extensions = {
    ...(clone.extensions ?? {}),
    "payment-identifier": {
      ...(isPlainObject(existing) ? existing : {}),
      paymentId: paymentIdentifier,
    },
  };
  return clone;
}

function paymentRequiredAdvertisesPaymentIdentifier(paymentRequired: PaymentRequiredV2): boolean {
  return Object.hasOwn(paymentRequired.extensions ?? {}, "payment-identifier");
}

function requirePaymentIdentifierDigest(paymentIdentifierDigest: `sha256:${string}` | null): `sha256:${string}` {
  if (!paymentIdentifierDigest) throw new Error("Expected payment identifier digest for bound payment identifier.");
  return paymentIdentifierDigest;
}

async function verifyOfficialExactSigningInput(input: {
  paymentRequired: PaymentRequiredV2;
  parameters: X402PaymentParameters;
  selectedPaymentRequirementIndex: number;
  selectedPaymentRequirementDigest: `sha256:${string}`;
}): Promise<PaymentRequirementsV2> {
  const { paymentRequired, parameters, selectedPaymentRequirementIndex, selectedPaymentRequirementDigest } = input;
  if (parameters.x402EvidenceProfile !== "official_payment_required") {
    throw new Error("Official x402 gateway signing refused non-official payment evidence.");
  }
  if (parameters.x402Version !== paymentRequired.x402Version) {
    throw new Error("Official x402 gateway signing refused x402 version drift.");
  }
  if (parameters.x402Scheme !== "exact") {
    throw new Error("Official x402 gateway signing refused a non-exact payment scheme.");
  }
  if (parameters.endpointUrl !== paymentRequired.resource.url) {
    throw new Error("Official x402 gateway signing refused endpoint drift.");
  }
  if (parameters.intendedRequestUrl && parameters.intendedRequestUrl !== paymentRequired.resource.url) {
    throw new Error("Official x402 gateway signing refused intended request drift.");
  }
  if (parameters.selectedPaymentRequirementDigest !== selectedPaymentRequirementDigest) {
    throw new Error("Official x402 gateway signing refused selected requirement digest drift.");
  }
  if (parameters.selectedPaymentRequirementIndex !== selectedPaymentRequirementIndex) {
    throw new Error("Official x402 gateway signing refused selected requirement index drift.");
  }
  const selectedRequirement = paymentRequired.accepts[selectedPaymentRequirementIndex];
  if (!selectedRequirement) {
    throw new Error("Official x402 gateway signing refused missing selected payment requirement.");
  }
  if (selectedRequirement.scheme !== "exact") {
    throw new Error("Official x402 gateway signing refused a non-exact selected payment requirement.");
  }
  const expectedSelectedPaymentRequirementDigest = await digestX402SelectedPaymentRequirement({
    paymentRequired,
    selectedPaymentRequirementIndex,
    selectedPaymentRequirement: selectedRequirement,
  });
  if (selectedPaymentRequirementDigest !== expectedSelectedPaymentRequirementDigest) {
    throw new Error("Official x402 gateway signing refused selected payment requirement digest mismatch.");
  }
  const expectedPaymentRequirementsDigest = await digestCanonical({
    paymentRequired: toJsonValue(paymentRequired),
    selectedPaymentRequirementIndex,
    selectedPaymentRequirementDigest,
  });
  if (parameters.paymentRequirementsDigest !== expectedPaymentRequirementsDigest) {
    throw new Error("Official x402 gateway signing refused PaymentRequired digest drift.");
  }
  if (!paymentRequirementMatchesObservedParameters(selectedRequirement, parameters)) {
    throw new Error("Official x402 gateway signing refused observed payment requirement drift.");
  }
  return selectedRequirement;
}

function paymentRequirementMatchesObservedParameters(
  requirement: PaymentRequirementsV2,
  parameters: X402PaymentParameters,
): boolean {
  return (
    requirement.scheme === "exact" &&
    requirement.scheme === parameters.x402Scheme &&
    requirement.network === parameters.network &&
    requirement.asset === parameters.asset &&
    requirement.asset === parameters.token &&
    requirement.amount === parameters.atomicAmount &&
    requirement.payTo === parameters.payTo &&
    requirement.payTo === parameters.payee &&
    requirement.maxTimeoutSeconds === parameters.maxTimeoutSeconds
  );
}

function paymentRequirementMatches(
  left: PaymentRequirementsV2 | OfficialPaymentRequirements,
  right: PaymentRequirementsV2,
): boolean {
  return (
    left.scheme === right.scheme &&
    left.network === right.network &&
    left.asset === right.asset &&
    left.amount === right.amount &&
    left.payTo === right.payTo &&
    left.maxTimeoutSeconds === right.maxTimeoutSeconds
  );
}

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
