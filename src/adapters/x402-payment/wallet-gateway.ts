import { z } from "zod";
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

export const X402PaymentParametersSchema = z.strictObject({
  endpointUrl: z.string().url(),
  endpointDomain: z.string().min(1),
  payee: z.string().min(1),
  network: z.string().min(1),
  token: z.string().min(1),
  atomicAmount: AtomicAmountSchema,
  paymentRequirementsDigest: DigestSchema,
  facilitatorRef: z.string().min(1).nullable().default(null),
});
export type X402PaymentParameters = z.infer<typeof X402PaymentParametersSchema>;

export type X402PaymentSignatureCommand = {
  verifiedGate: VerifiedGatewayCheck;
  parameters: X402PaymentParameters;
};

export type X402PaymentSignatureEvidence = {
  evidenceRef: string;
  surfaceOperationRef: string;
  paymentSignature: string;
  paymentSignatureDigest: `sha256:${string}`;
  downstreamPaymentStatus: "succeeded" | "unknown";
  paymentResponseEvidenceRef: string | null;
  providerRequestRef: string | null;
  providerOperationRef: string | null;
};

export interface X402WalletSigningSurface {
  signPayment(command: X402PaymentSignatureCommand): Promise<X402PaymentSignatureEvidence>;
}

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
      `digest:${signatureEvidence.paymentSignatureDigest}`,
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
