import { z } from "zod";
import { digestCanonical } from "../../protocol/foundation/canonical";
import {
  decodeX402PaymentRequiredEvidence,
  type X402IntendedRequestEvidence,
  type X402OfficialSourceBasis,
  type X402PaymentRequiredEvidence,
} from "./upstream-evidence";
import {
  createOfficialExactX402SigningSurface,
  type X402LocalReferenceSandboxEvidenceBoundary,
  type X402PaymentParameters,
  type X402PaymentSignatureCommand,
  type X402PaymentSignatureEvidence,
  type X402WalletSigningSurface,
} from "./wallet-gateway";

const DigestSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const RequestBodyPostureSchema = z.enum(["no_body", "digest_bound", "omitted", "unsupported"]);
const ProviderEnvironmentPostureSchema = z.literal("local_reference_sandbox");

const LocalSandboxIntendedRequestSchema = z.strictObject({
  method: z.string().min(1),
  url: z.string().url(),
  requestBodyPosture: RequestBodyPostureSchema.default("no_body"),
  bodyDigest: DigestSchema.nullable().default(null),
  selectedHeadersDigest: DigestSchema,
  providerEnvironmentPosture: ProviderEnvironmentPostureSchema.default("local_reference_sandbox"),
  providerEnvironmentRef: z.string().min(1).default("provider-environment:x402-local-reference-sandbox"),
});

export type CreateLocalX402PaidHttpSandboxInput = {
  source: X402OfficialSourceBasis;
  paymentRequired: unknown;
  intendedRequest: z.input<typeof LocalSandboxIntendedRequestSchema>;
  selectedPaymentRequirementIndex: number;
  paymentRequiredEvidenceRef?: string;
  paymentResponseEvidenceRef?: string;
  providerRequestRef?: string;
  providerOperationRef?: string;
};

export type LocalX402PaidHttpSandboxChallenge = {
  outcome: "payment_required";
  status: 402;
  paymentRequiredHeader: string;
  paymentRequiredEvidenceRef: string;
  providerRequestRef: string;
  providerOperationRef: string;
  requestDigest: `sha256:${string}`;
  evidence: X402PaymentRequiredEvidence;
  evidenceBoundary: X402LocalReferenceSandboxEvidenceBoundary;
  authorityCreated: false;
};

export type LocalX402PaidHttpSandboxRetryResult =
  | {
      outcome: "signed_retry_recorded";
      downstreamPaymentStatus: "succeeded";
      paymentResponseEvidenceRef: string;
      providerRequestRef: string;
      providerOperationRef: string;
      signedRetryEvidenceRef: string;
      evidenceBoundary: X402LocalReferenceSandboxEvidenceBoundary;
      retryCount: number;
      authorityCreated: false;
    }
  | {
      outcome: "signed_retry_refused";
      downstreamPaymentStatus: "not_started";
      reasonCode:
        | "x402_local_sandbox_missing_signature_evidence"
        | "x402_local_sandbox_invalid_signature_header"
        | "x402_local_sandbox_non_reference_environment"
        | "x402_local_sandbox_ambiguous_body_posture";
      evidenceBoundary: X402LocalReferenceSandboxEvidenceBoundary;
      retryCount: number;
      authorityCreated: false;
    };

export type LocalX402PaidHttpSandbox = {
  requestPaymentRequired(): Promise<LocalX402PaidHttpSandboxChallenge>;
  recordSignedRetry(input: {
    parameters: X402PaymentParameters;
    signatureEvidence: X402PaymentSignatureEvidence | null;
  }): Promise<LocalX402PaidHttpSandboxRetryResult>;
  snapshot(): {
    challengeCount: number;
    signedRetryCount: number;
    lastRetry: LocalX402PaidHttpSandboxRetryResult | null;
  };
};

export type CreateLocalX402SandboxSigningSurfaceInput = {
  sandbox: LocalX402PaidHttpSandbox;
  signer: Parameters<typeof createOfficialExactX402SigningSurface>[0]["signer"];
  paymentRequired: unknown;
  selectedPaymentRequirementIndex: number;
  selectedPaymentRequirementDigest: `sha256:${string}`;
  paymentIdentifier?: string | null;
};

export function createLocalX402PaidHttpSandbox(input: CreateLocalX402PaidHttpSandboxInput): LocalX402PaidHttpSandbox {
  const intendedRequest = LocalSandboxIntendedRequestSchema.parse(input.intendedRequest);
  const normalizedIntendedRequest: X402IntendedRequestEvidence = {
    ...intendedRequest,
    bodyDigest: intendedRequest.bodyDigest as `sha256:${string}` | null,
    selectedHeadersDigest: intendedRequest.selectedHeadersDigest as `sha256:${string}`,
  };
  assertRequestBodyPosture(intendedRequest);
  const paymentRequiredHeader = base64Json(input.paymentRequired);
  const providerRequestRef = input.providerRequestRef ?? "provider-request:x402-local-sandbox";
  const providerOperationRef = input.providerOperationRef ?? "provider-operation:x402-local-sandbox";
  const paymentResponseEvidenceRef = input.paymentResponseEvidenceRef ?? "evidence:x402-local-sandbox-payment-response";
  let challengeCount = 0;
  let signedRetryCount = 0;
  let lastRetry: LocalX402PaidHttpSandboxRetryResult | null = null;

  return {
    async requestPaymentRequired(): Promise<LocalX402PaidHttpSandboxChallenge> {
      challengeCount += 1;
      const evidence = await decodeX402PaymentRequiredEvidence({
        source: input.source,
        paymentRequiredHeader,
        intendedRequest: normalizedIntendedRequest,
        selectedPaymentRequirementIndex: input.selectedPaymentRequirementIndex,
      });
      const requestDigest = await digestCanonical({
        method: intendedRequest.method,
        url: intendedRequest.url,
        requestBodyPosture: intendedRequest.requestBodyPosture,
        bodyDigest: intendedRequest.bodyDigest,
        selectedHeadersDigest: intendedRequest.selectedHeadersDigest,
        providerEnvironmentPosture: intendedRequest.providerEnvironmentPosture,
        providerEnvironmentRef: intendedRequest.providerEnvironmentRef,
      });
      return {
        outcome: "payment_required",
        status: 402,
        paymentRequiredHeader,
        paymentRequiredEvidenceRef:
          input.paymentRequiredEvidenceRef ??
          `evidence:x402-local-sandbox-payment-required:${digestSuffix(requestDigest)}`,
        providerRequestRef,
        providerOperationRef,
        requestDigest,
        evidence,
        evidenceBoundary: localReferenceSandboxEvidenceBoundary(false),
        authorityCreated: false,
      };
    },
    async recordSignedRetry(input): Promise<LocalX402PaidHttpSandboxRetryResult> {
      if (!input.signatureEvidence) {
        lastRetry = refusedRetry("x402_local_sandbox_missing_signature_evidence", signedRetryCount);
        return lastRetry;
      }
      if (input.signatureEvidence.paymentSignatureHeaderName !== "PAYMENT-SIGNATURE") {
        lastRetry = refusedRetry("x402_local_sandbox_invalid_signature_header", signedRetryCount);
        return lastRetry;
      }
      if (input.parameters.providerEnvironmentPosture !== "local_reference_sandbox") {
        lastRetry = refusedRetry("x402_local_sandbox_non_reference_environment", signedRetryCount);
        return lastRetry;
      }
      if (["omitted", "unsupported"].includes(input.parameters.intendedRequestBodyPosture)) {
        lastRetry = refusedRetry("x402_local_sandbox_ambiguous_body_posture", signedRetryCount);
        return lastRetry;
      }
      signedRetryCount += 1;
      lastRetry = {
        outcome: "signed_retry_recorded",
        downstreamPaymentStatus: "succeeded",
        paymentResponseEvidenceRef,
        providerRequestRef,
        providerOperationRef,
        signedRetryEvidenceRef: `evidence:x402-local-sandbox-signed-retry:${signedRetryCount}`,
        evidenceBoundary: localReferenceSandboxEvidenceBoundary(true),
        retryCount: signedRetryCount,
        authorityCreated: false,
      };
      return lastRetry;
    },
    snapshot() {
      return { challengeCount, signedRetryCount, lastRetry };
    },
  };
}

export function createLocalX402SandboxSigningSurface(
  input: CreateLocalX402SandboxSigningSurfaceInput,
): X402WalletSigningSurface {
  const officialSurface = createOfficialExactX402SigningSurface({
    signer: input.signer,
    paymentRequired: input.paymentRequired,
    selectedPaymentRequirementIndex: input.selectedPaymentRequirementIndex,
    selectedPaymentRequirementDigest: input.selectedPaymentRequirementDigest,
    paymentIdentifier: input.paymentIdentifier ?? null,
    downstreamPaymentStatus: "unknown",
  });

  return {
    async signPayment(command: X402PaymentSignatureCommand): Promise<X402PaymentSignatureEvidence> {
      const signatureEvidence = await officialSurface.signPayment(command);
      const signedRetry = await input.sandbox.recordSignedRetry({
        parameters: command.parameters,
        signatureEvidence,
      });
      if (signedRetry.outcome !== "signed_retry_recorded") {
        throw new Error(`Local x402 sandbox refused signed retry: ${signedRetry.reasonCode}`);
      }
      return {
        ...signatureEvidence,
        downstreamPaymentStatus: signedRetry.downstreamPaymentStatus,
        paymentResponseEvidenceRef: signedRetry.paymentResponseEvidenceRef,
        providerRequestRef: signedRetry.providerRequestRef,
        providerOperationRef: signedRetry.providerOperationRef,
        additionalEvidenceRefs: [signedRetry.signedRetryEvidenceRef],
        localReferenceSandboxBoundary: signedRetry.evidenceBoundary,
      };
    },
  };
}

function assertRequestBodyPosture(intendedRequest: z.infer<typeof LocalSandboxIntendedRequestSchema>): void {
  if (intendedRequest.requestBodyPosture === "digest_bound" && intendedRequest.bodyDigest === null) {
    throw new Error("Local x402 sandbox request body posture requires bodyDigest.");
  }
  if (intendedRequest.requestBodyPosture === "no_body" && intendedRequest.bodyDigest !== null) {
    throw new Error("Local x402 sandbox no-body posture cannot carry bodyDigest.");
  }
  if (["omitted", "unsupported"].includes(intendedRequest.requestBodyPosture)) {
    throw new Error("Local x402 sandbox refuses ambiguous request body posture.");
  }
}

function refusedRetry(
  reasonCode: Extract<LocalX402PaidHttpSandboxRetryResult, { outcome: "signed_retry_refused" }>["reasonCode"],
  retryCount: number,
): LocalX402PaidHttpSandboxRetryResult {
  return {
    outcome: "signed_retry_refused",
    downstreamPaymentStatus: "not_started",
    reasonCode,
    evidenceBoundary: localReferenceSandboxEvidenceBoundary(false),
    retryCount,
    authorityCreated: false,
  };
}

function localReferenceSandboxEvidenceBoundary(
  signedRetryObserved: boolean,
): X402LocalReferenceSandboxEvidenceBoundary {
  return {
    boundaryKind: "x402_local_reference_sandbox",
    evidenceProfile: "local_reference_downstream_fixture",
    providerEnvironmentPosture: "local_reference_sandbox",
    fixtureScope: "local_reference_only",
    signedRetryPosture: signedRetryObserved ? "post_gateway_check_observation_only" : "not_observed",
    authorityCreated: false,
    paymentFinalityClaimed: false,
    settlementFinalityClaimed: false,
    facilitatorOperationClaimed: false,
    sellerMiddlewareClaimed: false,
    providerCustodyClaimed: false,
    liveProviderOperationClaimed: false,
  };
}

function digestSuffix(digest: `sha256:${string}`): string {
  return digest.slice("sha256:".length, "sha256:".length + 16);
}

function base64Json(value: unknown): string {
  return btoa(JSON.stringify(value));
}
