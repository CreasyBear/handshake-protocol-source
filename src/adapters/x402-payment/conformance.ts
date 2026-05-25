import { z } from "zod";
import { requiredGatewayCheckedBypassProbeKinds } from "../../protocol/areas/bypass-probe";
import type { AuthorityCertificateVerificationResponse } from "../../protocol/areas/authority-certificate";

export const x402FirstWedgeUnsupportedSurfaces = [
  "upto",
  "batch-settlement",
  "lifecycle-hooks",
  "mcp-auto-pay",
  "signed-offers",
  "signed-receipts",
  "seller-middleware",
  "facilitator-operation",
  "settlement-finality",
] as const;

export const X402FirstWedgeUnsupportedSurfaceSchema = z.enum(x402FirstWedgeUnsupportedSurfaces);
export type X402FirstWedgeUnsupportedSurface = z.infer<typeof X402FirstWedgeUnsupportedSurfaceSchema>;

export const X402FirstWedgeSurfaceSchema = z.union([z.literal("exact"), X402FirstWedgeUnsupportedSurfaceSchema]);
export type X402FirstWedgeSurface = z.infer<typeof X402FirstWedgeSurfaceSchema>;

const x402FirstWedgeUnsupportedSurfaceReasonCodes = {
  "batch-settlement": "x402_cut_unsupported_batch_settlement",
  "facilitator-operation": "x402_cut_unsupported_facilitator_operation",
  "lifecycle-hooks": "x402_cut_unsupported_lifecycle_hooks",
  "mcp-auto-pay": "x402_cut_unsupported_mcp_auto_pay",
  "seller-middleware": "x402_cut_unsupported_seller_middleware",
  "settlement-finality": "x402_cut_unsupported_settlement_finality",
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
  "gateway_credential_resolution",
  "gateway_signer_invocation",
  "payment_payload_created",
  "downstream_reconciliation_recorded",
  "payment_response_received",
  "payment_response_missing",
  "local_reference_downstream_fixture",
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
    | "gateway_credential_resolution"
    | "gateway_signer_invocation"
    | "gateway_held_payment_credential"
    | "downstream_reconciliation"
    | "payment_response"
    | "local_reference_fixture"
    | "facilitator_verify"
    | "facilitator_settlement";
  firstWedgeOperation: "supported_evidence_only" | "unsupported_facilitator_operation";
  label: X402FirstWedgeEvidenceLabel;
  settlementFinality: "not_settlement_finality" | "settlement_succeeded" | "settlement_failed" | "settlement_unknown";
};

export const X402AuthorityCertificateEvidenceProfileSchema = z.strictObject({
  profileKind: z.literal("authority_certificate_x402_exact_evidence_profile"),
  authorityCreated: z.literal(false),
  verificationOutcome: z.enum(["verified", "refused", "proof_gap"]),
  evidenceProfile: z.enum(["x402_exact_per_call", "unsupported_action_class", "unverified_certificate", "proof_gap"]),
  actionClass: z.string().min(1).nullable(),
  actionContractRef: z.string().min(1).nullable(),
  gatewayAdmissionStatus: z.enum(["not_requested", "admitted", "refused", "proof_gap", "replayed"]).nullable(),
  downstreamOutcomeStatus: z.enum(["not_started", "pending", "succeeded", "refused", "failed", "unknown"]).nullable(),
  exactPerCallProtectedAction: z.boolean(),
  gatewayCheckEvidenceRef: z.string().min(1).nullable(),
  receiptRef: z.string().min(1).nullable(),
  proofGapRefs: z.array(z.string().min(1)),
  refusalRefs: z.array(z.string().min(1)),
  evidenceRefs: z.array(z.string().min(1)),
  provesPaymentSuccess: z.literal(false),
  provesSettlementFinality: z.literal(false),
  provesFacilitatorOperation: z.literal(false),
  provesProviderCustody: z.literal(false),
  managesPayment: z.literal(false),
  nonClaims: z.array(z.string().min(1)),
});
export type X402AuthorityCertificateEvidenceProfile = z.infer<typeof X402AuthorityCertificateEvidenceProfileSchema>;

const x402FirstWedgeEvidenceLabelClassifications = {
  facilitator_settle_attempted: evidenceLabel("facilitator_settle_attempted", "facilitator_settlement", {
    firstWedgeOperation: "unsupported_facilitator_operation",
    settlementFinality: "settlement_unknown",
  }),
  facilitator_verify_attempted: evidenceLabel("facilitator_verify_attempted", "facilitator_verify"),
  facilitator_verify_failed: evidenceLabel("facilitator_verify_failed", "facilitator_verify"),
  facilitator_verify_succeeded: evidenceLabel("facilitator_verify_succeeded", "facilitator_verify"),
  local_gateway_check: evidenceLabel("local_gateway_check", "gateway_check"),
  gateway_credential_resolution: evidenceLabel("gateway_credential_resolution", "gateway_credential_resolution"),
  gateway_signer_invocation: evidenceLabel("gateway_signer_invocation", "gateway_signer_invocation"),
  local_reference_downstream_fixture: evidenceLabel("local_reference_downstream_fixture", "local_reference_fixture"),
  downstream_reconciliation_recorded: evidenceLabel("downstream_reconciliation_recorded", "downstream_reconciliation"),
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
  browserSidePaymentNotBlocked: "x402_browser_side_payment_not_blocked",
  directCoreSigningNotBlocked: "x402_direct_core_signing_not_blocked",
  directX402ClientNotBlocked: "x402_direct_x402_client_not_blocked",
  failureClosedProbeFailed: "x402_failure_closed_probe_failed",
  mcpDirectPaymentNotBlocked: "x402_mcp_direct_payment_not_blocked",
  packageScriptPaymentNotBlocked: "x402_package_script_payment_not_blocked",
  paidAxiosClientNotBlocked: "x402_paid_axios_client_not_blocked",
  paidFetchClientNotBlocked: "x402_paid_fetch_client_not_blocked",
  rawNetworkPaymentNotBlocked: "x402_raw_network_payment_not_blocked",
  rawPaymentSignatureHeaderNotBlocked: "x402_raw_payment_signature_header_not_blocked",
  rawPaymentSignatureInjectionNotBlocked: "x402_raw_payment_signature_injection_not_blocked",
  rawPrivateKeyEnvNotAbsent: "x402_raw_private_key_env_not_absent",
  siblingWrapperNotBlocked: "x402_sibling_wrapper_not_blocked",
  signerNotGatewayHeld: "x402_signer_not_gateway_held",
  tokenPassthroughNotBlocked: "x402_token_passthrough_not_blocked",
  unmanagedMcpServerNotBlocked: "x402_unmanaged_mcp_server_not_blocked",
  unmanagedToolPacketNotBlocked: "x402_unmanaged_tool_packet_not_blocked",
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

export function projectX402AuthorityCertificateEvidenceProfile(
  verification: AuthorityCertificateVerificationResponse,
): X402AuthorityCertificateEvidenceProfile {
  const envelope = verification.envelope;
  const isX402Exact = envelope?.actionClass === "x402_payment.exact";
  const evidenceProfile = x402CertificateEvidenceProfileFor(verification.outcome, isX402Exact);
  return X402AuthorityCertificateEvidenceProfileSchema.parse({
    profileKind: "authority_certificate_x402_exact_evidence_profile",
    authorityCreated: false,
    verificationOutcome: verification.outcome,
    evidenceProfile,
    actionClass: envelope?.actionClass ?? null,
    actionContractRef: envelope?.actionContractRef ?? null,
    gatewayAdmissionStatus: envelope?.gatewayAdmissionStatus ?? null,
    downstreamOutcomeStatus: envelope?.downstreamOutcomeStatus ?? null,
    exactPerCallProtectedAction: isX402Exact && verification.outcome === "verified",
    gatewayCheckEvidenceRef: envelope?.gateAttemptRef ? `gateway_check_attempt:${envelope.gateAttemptRef}` : null,
    receiptRef: envelope?.receiptRef ?? null,
    proofGapRefs: envelope?.proofGapRefs ?? [],
    refusalRefs: envelope?.refusalRefs ?? [],
    evidenceRefs: envelope
      ? uniqueStrings([
          ...envelope.evidenceRefs,
          ...envelope.surfaceOperationEvidenceRefs,
          ...envelope.downstreamEvidenceRefs,
          ...envelope.gatewayCredentialEvidenceRefs,
          ...envelope.credentialResolutionEvidenceRefs,
        ])
      : [],
    provesPaymentSuccess: false,
    provesSettlementFinality: false,
    provesFacilitatorOperation: false,
    provesProviderCustody: false,
    managesPayment: false,
    nonClaims: [
      "not payment success",
      "not settlement finality",
      "not facilitator operation",
      "not provider custody",
      "not payment management",
      "not broad x402 compatibility",
    ],
  });
}

export const X402PaymentConformancePostureSchema = z.strictObject({
  signerCustodyStatus: z.enum(["gateway_held", "fixture_gateway_held", "agent_exposed", "unknown"]),
  rawPrivateKeyEnvStatus: z.enum(["absent", "present", "unknown"]),
  directCoreClientSigningStatus: z.enum(["blocked", "absent", "present", "unknown"]),
  directX402ClientStatus: z.enum(["blocked", "absent", "present", "unknown"]).default("absent"),
  paidFetchClientStatus: z.enum(["blocked", "absent", "present", "unknown"]),
  paidAxiosClientStatus: z.enum(["blocked", "absent", "present", "unknown"]),
  packageScriptPaymentStatus: z.enum(["blocked", "absent", "present", "unknown"]).default("absent"),
  browserSidePaymentStatus: z.enum(["blocked", "absent", "present", "unknown"]).default("absent"),
  rawNetworkPaymentStatus: z.enum(["blocked", "absent", "present", "unknown"]).default("absent"),
  rawPaymentSignatureHeaderStatus: z.enum(["blocked", "absent", "present", "unknown"]),
  rawPaymentSignatureInjectionStatus: z.enum(["blocked", "absent", "present", "unknown"]).default("absent"),
  siblingX402WrapperStatus: z.enum(["blocked", "absent", "present", "unknown"]),
  mcpDirectPaymentStatus: z.enum(["blocked", "absent", "present", "unknown"]),
  unmanagedMcpServerStatus: z.enum(["blocked", "absent", "present", "unknown"]).default("absent"),
  unmanagedToolPacketStatus: z.enum(["blocked", "absent", "present", "unknown"]).default("absent"),
  tokenPassthroughStatus: z.enum(["blocked", "absent", "present", "unknown"]),
  wrapperDriftStatus: z.enum(["absent", "present", "unknown"]),
  failureClosedStatus: z.enum(["passed", "failed", "unknown"]),
});
export type X402PaymentConformancePosture = z.input<typeof X402PaymentConformancePostureSchema>;

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
  if (!["blocked", "absent"].includes(posture.directX402ClientStatus)) {
    reasonCodes.push(X402PaymentConformanceReason.directX402ClientNotBlocked);
  }
  if (!["blocked", "absent"].includes(posture.paidFetchClientStatus)) {
    reasonCodes.push(X402PaymentConformanceReason.paidFetchClientNotBlocked);
  }
  if (!["blocked", "absent"].includes(posture.paidAxiosClientStatus)) {
    reasonCodes.push(X402PaymentConformanceReason.paidAxiosClientNotBlocked);
  }
  if (!["blocked", "absent"].includes(posture.packageScriptPaymentStatus)) {
    reasonCodes.push(X402PaymentConformanceReason.packageScriptPaymentNotBlocked);
  }
  if (!["blocked", "absent"].includes(posture.browserSidePaymentStatus)) {
    reasonCodes.push(X402PaymentConformanceReason.browserSidePaymentNotBlocked);
  }
  if (!["blocked", "absent"].includes(posture.rawNetworkPaymentStatus)) {
    reasonCodes.push(X402PaymentConformanceReason.rawNetworkPaymentNotBlocked);
  }
  if (!["blocked", "absent"].includes(posture.rawPaymentSignatureHeaderStatus)) {
    reasonCodes.push(X402PaymentConformanceReason.rawPaymentSignatureHeaderNotBlocked);
  }
  if (!["blocked", "absent"].includes(posture.rawPaymentSignatureInjectionStatus)) {
    reasonCodes.push(X402PaymentConformanceReason.rawPaymentSignatureInjectionNotBlocked);
  }
  if (!["blocked", "absent"].includes(posture.siblingX402WrapperStatus)) {
    reasonCodes.push(X402PaymentConformanceReason.siblingWrapperNotBlocked);
  }
  if (!["blocked", "absent"].includes(posture.mcpDirectPaymentStatus)) {
    reasonCodes.push(X402PaymentConformanceReason.mcpDirectPaymentNotBlocked);
  }
  if (!["blocked", "absent"].includes(posture.unmanagedMcpServerStatus)) {
    reasonCodes.push(X402PaymentConformanceReason.unmanagedMcpServerNotBlocked);
  }
  if (!["blocked", "absent"].includes(posture.unmanagedToolPacketStatus)) {
    reasonCodes.push(X402PaymentConformanceReason.unmanagedToolPacketNotBlocked);
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

function x402CertificateEvidenceProfileFor(
  outcome: AuthorityCertificateVerificationResponse["outcome"],
  isX402Exact: boolean,
): X402AuthorityCertificateEvidenceProfile["evidenceProfile"] {
  if (outcome === "proof_gap") return "proof_gap";
  if (outcome !== "verified") return "unverified_certificate";
  return isX402Exact ? "x402_exact_per_call" : "unsupported_action_class";
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}
