import { z } from "zod";
import { requiredGatewayCheckedBypassProbeKinds } from "../../protocol/areas/bypass-probe";

const X402PaymentConformanceReason = {
  failureClosedProbeFailed: "x402_failure_closed_probe_failed",
  mcpDirectPaymentNotBlocked: "x402_mcp_direct_payment_not_blocked",
  rawPrivateKeyEnvNotAbsent: "x402_raw_private_key_env_not_absent",
  siblingWrapperNotBlocked: "x402_sibling_wrapper_not_blocked",
  signerNotGatewayHeld: "x402_signer_not_gateway_held",
  tokenPassthroughNotBlocked: "x402_token_passthrough_not_blocked",
  wrapperDriftPresent: "x402_wrapper_drift_present",
} as const;

export const X402PaymentConformancePostureSchema = z.strictObject({
  signerCustodyStatus: z.enum(["gateway_held", "fixture_gateway_held", "agent_exposed", "unknown"]),
  rawPrivateKeyEnvStatus: z.enum(["absent", "present", "unknown"]),
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
