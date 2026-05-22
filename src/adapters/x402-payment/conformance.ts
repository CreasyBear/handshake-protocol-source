import { z } from "zod";
import { requiredGatewayCheckedBypassProbeKinds } from "../../protocol/areas/bypass-probe";

export const X402FirstWedgeUnsupportedSurfaceSchema = z.enum([
  "upto",
  "batch-settlement",
  "lifecycle-hooks",
  "mcp-auto-pay",
  "signed-offers",
  "signed-receipts",
  "seller-middleware",
  "facilitator-operation",
]);
export type X402FirstWedgeUnsupportedSurface = z.infer<typeof X402FirstWedgeUnsupportedSurfaceSchema>;

export const X402FirstWedgeSurfaceSchema = z.union([z.literal("exact"), X402FirstWedgeUnsupportedSurfaceSchema]);
export type X402FirstWedgeSurface = z.infer<typeof X402FirstWedgeSurfaceSchema>;

const x402FirstWedgeUnsupportedSurfaceReasonCodes = {
  "batch-settlement": "x402_cut_unsupported_batch_settlement",
  "facilitator-operation": "x402_cut_unsupported_facilitator_operation",
  "lifecycle-hooks": "x402_cut_unsupported_lifecycle_hooks",
  "mcp-auto-pay": "x402_cut_unsupported_mcp_auto_pay",
  "seller-middleware": "x402_cut_unsupported_seller_middleware",
  "signed-offers": "x402_cut_unsupported_signed_offers",
  "signed-receipts": "x402_cut_unsupported_signed_receipts",
  upto: "x402_cut_unsupported_upto",
} as const satisfies Record<X402FirstWedgeUnsupportedSurface, string>;

export type X402FirstWedgeUnsupportedSurfaceReasonCode =
  (typeof x402FirstWedgeUnsupportedSurfaceReasonCodes)[X402FirstWedgeUnsupportedSurface];

export type X402FirstWedgeSurfaceClassification =
  | {
      actionClass: "x402_payment.exact";
      cutLine: null;
      reasonCode: null;
      supported: true;
      surface: "exact";
    }
  | {
      actionClass: null;
      cutLine: "unsupported_first_wedge";
      reasonCode: X402FirstWedgeUnsupportedSurfaceReasonCode;
      supported: false;
      surface: X402FirstWedgeUnsupportedSurface;
    };

export const X402FirstWedgeEvidenceLabelSchema = z.enum([
  "local_gateway_check",
  "payment_payload_created",
  "paid_retry_attempted",
  "payment_response_received",
  "payment_response_missing",
  "facilitator_verify_attempted",
  "facilitator_verify_succeeded",
  "facilitator_verify_failed",
  "facilitator_settle_attempted",
  "settlement_succeeded",
  "settlement_failed",
  "settlement_unknown",
]);
export type X402FirstWedgeEvidenceLabel = z.infer<typeof X402FirstWedgeEvidenceLabelSchema>;

export type X402FirstWedgeEvidenceLabelClassification = {
  authorityCreated: false;
  evidenceRole:
    | "gateway_check"
    | "gateway_held_payment_credential"
    | "paid_retry"
    | "payment_response"
    | "facilitator_verify"
    | "facilitator_settlement";
  firstWedgeOperation: "supported_evidence_only" | "unsupported_facilitator_operation";
  label: X402FirstWedgeEvidenceLabel;
  settlementFinality: "not_settlement_finality" | "settlement_succeeded" | "settlement_failed" | "settlement_unknown";
};

const x402FirstWedgeEvidenceLabelClassifications = {
  facilitator_settle_attempted: evidenceLabel("facilitator_settle_attempted", "facilitator_settlement", {
    firstWedgeOperation: "unsupported_facilitator_operation",
    settlementFinality: "settlement_unknown",
  }),
  facilitator_verify_attempted: evidenceLabel("facilitator_verify_attempted", "facilitator_verify"),
  facilitator_verify_failed: evidenceLabel("facilitator_verify_failed", "facilitator_verify"),
  facilitator_verify_succeeded: evidenceLabel("facilitator_verify_succeeded", "facilitator_verify"),
  local_gateway_check: evidenceLabel("local_gateway_check", "gateway_check"),
  paid_retry_attempted: evidenceLabel("paid_retry_attempted", "paid_retry"),
  payment_payload_created: evidenceLabel("payment_payload_created", "gateway_held_payment_credential"),
  payment_response_missing: evidenceLabel("payment_response_missing", "payment_response", {
    settlementFinality: "settlement_unknown",
  }),
  payment_response_received: evidenceLabel("payment_response_received", "payment_response", {
    settlementFinality: "settlement_unknown",
  }),
  settlement_failed: evidenceLabel("settlement_failed", "facilitator_settlement", {
    firstWedgeOperation: "unsupported_facilitator_operation",
    settlementFinality: "settlement_failed",
  }),
  settlement_succeeded: evidenceLabel("settlement_succeeded", "facilitator_settlement", {
    firstWedgeOperation: "unsupported_facilitator_operation",
    settlementFinality: "settlement_succeeded",
  }),
  settlement_unknown: evidenceLabel("settlement_unknown", "facilitator_settlement", {
    firstWedgeOperation: "unsupported_facilitator_operation",
    settlementFinality: "settlement_unknown",
  }),
} as const satisfies Record<X402FirstWedgeEvidenceLabel, X402FirstWedgeEvidenceLabelClassification>;

const X402PaymentConformanceReason = {
  directCoreSigningNotBlocked: "x402_direct_core_signing_not_blocked",
  failureClosedProbeFailed: "x402_failure_closed_probe_failed",
  mcpDirectPaymentNotBlocked: "x402_mcp_direct_payment_not_blocked",
  paidAxiosClientNotBlocked: "x402_paid_axios_client_not_blocked",
  paidFetchClientNotBlocked: "x402_paid_fetch_client_not_blocked",
  rawPaymentSignatureHeaderNotBlocked: "x402_raw_payment_signature_header_not_blocked",
  rawPrivateKeyEnvNotAbsent: "x402_raw_private_key_env_not_absent",
  siblingWrapperNotBlocked: "x402_sibling_wrapper_not_blocked",
  signerNotGatewayHeld: "x402_signer_not_gateway_held",
  tokenPassthroughNotBlocked: "x402_token_passthrough_not_blocked",
  wrapperDriftPresent: "x402_wrapper_drift_present",
} as const;

export function classifyX402FirstWedgeSurface(surfaceValue: unknown): X402FirstWedgeSurfaceClassification {
  const surface = X402FirstWedgeSurfaceSchema.parse(surfaceValue);
  if (surface === "exact") {
    return {
      actionClass: "x402_payment.exact",
      cutLine: null,
      reasonCode: null,
      supported: true,
      surface,
    };
  }
  return {
    actionClass: null,
    cutLine: "unsupported_first_wedge",
    reasonCode: x402FirstWedgeUnsupportedSurfaceReasonCodes[surface],
    supported: false,
    surface,
  };
}

export function classifyX402FirstWedgeEvidenceLabel(labelValue: unknown): X402FirstWedgeEvidenceLabelClassification {
  const label = X402FirstWedgeEvidenceLabelSchema.parse(labelValue);
  return { ...x402FirstWedgeEvidenceLabelClassifications[label] };
}

export const X402PaymentConformancePostureSchema = z.strictObject({
  signerCustodyStatus: z.enum(["gateway_held", "fixture_gateway_held", "agent_exposed", "unknown"]),
  rawPrivateKeyEnvStatus: z.enum(["absent", "present", "unknown"]),
  directCoreClientSigningStatus: z.enum(["blocked", "absent", "present", "unknown"]),
  paidFetchClientStatus: z.enum(["blocked", "absent", "present", "unknown"]),
  paidAxiosClientStatus: z.enum(["blocked", "absent", "present", "unknown"]),
  rawPaymentSignatureHeaderStatus: z.enum(["blocked", "absent", "present", "unknown"]),
  siblingX402WrapperStatus: z.enum(["blocked", "absent", "present", "unknown"]),
  mcpDirectPaymentStatus: z.enum(["blocked", "absent", "present", "unknown"]),
  tokenPassthroughStatus: z.enum(["blocked", "absent", "present", "unknown"]),
  wrapperDriftStatus: z.enum(["absent", "present", "unknown"]),
  failureClosedStatus: z.enum(["passed", "failed", "unknown"]),
});
export type X402PaymentConformancePosture = z.infer<typeof X402PaymentConformancePostureSchema>;

export type X402PaymentConformanceResult = {
  adapterPackId: "adapter_pack_x402_payment_exact";
  passed: boolean;
  requiredProbeKinds: typeof requiredGatewayCheckedBypassProbeKinds;
  reasonCodes: string[];
};

export function checkX402PaymentInstallConformance(
  postureValue: X402PaymentConformancePosture,
): X402PaymentConformanceResult {
  const posture = X402PaymentConformancePostureSchema.parse(postureValue);
  const reasonCodes: string[] = [];
  if (!["gateway_held", "fixture_gateway_held"].includes(posture.signerCustodyStatus)) {
    reasonCodes.push(X402PaymentConformanceReason.signerNotGatewayHeld);
  }
  if (posture.rawPrivateKeyEnvStatus !== "absent") {
    reasonCodes.push(X402PaymentConformanceReason.rawPrivateKeyEnvNotAbsent);
  }
  if (!["blocked", "absent"].includes(posture.directCoreClientSigningStatus)) {
    reasonCodes.push(X402PaymentConformanceReason.directCoreSigningNotBlocked);
  }
  if (!["blocked", "absent"].includes(posture.paidFetchClientStatus)) {
    reasonCodes.push(X402PaymentConformanceReason.paidFetchClientNotBlocked);
  }
  if (!["blocked", "absent"].includes(posture.paidAxiosClientStatus)) {
    reasonCodes.push(X402PaymentConformanceReason.paidAxiosClientNotBlocked);
  }
  if (!["blocked", "absent"].includes(posture.rawPaymentSignatureHeaderStatus)) {
    reasonCodes.push(X402PaymentConformanceReason.rawPaymentSignatureHeaderNotBlocked);
  }
  if (!["blocked", "absent"].includes(posture.siblingX402WrapperStatus)) {
    reasonCodes.push(X402PaymentConformanceReason.siblingWrapperNotBlocked);
  }
  if (!["blocked", "absent"].includes(posture.mcpDirectPaymentStatus)) {
    reasonCodes.push(X402PaymentConformanceReason.mcpDirectPaymentNotBlocked);
  }
  if (!["blocked", "absent"].includes(posture.tokenPassthroughStatus)) {
    reasonCodes.push(X402PaymentConformanceReason.tokenPassthroughNotBlocked);
  }
  if (posture.wrapperDriftStatus !== "absent") reasonCodes.push(X402PaymentConformanceReason.wrapperDriftPresent);
  if (posture.failureClosedStatus !== "passed") {
    reasonCodes.push(X402PaymentConformanceReason.failureClosedProbeFailed);
  }
  return {
    adapterPackId: "adapter_pack_x402_payment_exact",
    passed: reasonCodes.length === 0,
    requiredProbeKinds: requiredGatewayCheckedBypassProbeKinds,
    reasonCodes: reasonCodes.sort(),
  };
}

export function assertX402PaymentInstallConformance(
  posture: X402PaymentConformancePosture,
): X402PaymentConformanceResult {
  const result = checkX402PaymentInstallConformance(posture);
  if (!result.passed) {
    throw new Error(`x402 payment install conformance failed: ${result.reasonCodes.join(", ")}`);
  }
  return result;
}

function evidenceLabel(
  label: X402FirstWedgeEvidenceLabel,
  evidenceRole: X402FirstWedgeEvidenceLabelClassification["evidenceRole"],
  options: {
    firstWedgeOperation?: X402FirstWedgeEvidenceLabelClassification["firstWedgeOperation"];
    settlementFinality?: X402FirstWedgeEvidenceLabelClassification["settlementFinality"];
  } = {},
): X402FirstWedgeEvidenceLabelClassification {
  return {
    authorityCreated: false,
    evidenceRole,
    firstWedgeOperation: options.firstWedgeOperation ?? "supported_evidence_only",
    label,
    settlementFinality: options.settlementFinality ?? "not_settlement_finality",
  };
}
