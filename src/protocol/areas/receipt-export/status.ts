import type { Receipt } from "./types";

export function deriveGatewayAdmissionStatus(
  input: Pick<Receipt, "gatewayCheckStatus" | "greenlightConsumptionStatus">,
): Receipt["gatewayAdmissionStatus"] {
  if (input.greenlightConsumptionStatus === "replayed") return "replayed";
  if (input.gatewayCheckStatus === "passed") return "admitted";
  if (input.gatewayCheckStatus === "refused") return "refused";
  if (input.gatewayCheckStatus === "proof_gap") return "proof_gap";
  return "not_requested";
}

export function deriveDownstreamOutcomeStatus(
  input: Pick<Receipt, "downstreamExecutionStatus">,
): Receipt["downstreamOutcomeStatus"] {
  return input.downstreamExecutionStatus;
}
