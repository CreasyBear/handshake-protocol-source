import { createId } from "./ids";
import type { ActionContract, GateDecision, Greenlight, IsolationState, GatewayRegistryEntry } from "./schemas";

export type DownstreamMode = "succeed" | "pending" | "refuse" | "fail" | "unknown";

export type GatewayPolicyDriftCheck = {
  status: "same_version" | "compatible_stricter" | "incompatible" | "unknown";
  currentGatewayPolicyVersion: string | null;
  reasonCode: string | null;
};

export function gateRefusalReason(
  contract: ActionContract,
  greenlight: Greenlight,
  observedParamsDigest: string,
  isolationStates: IsolationState[],
  now: string,
  gatewayPolicyDriftReasonCode: string | null,
  sequenceDependencyReasonCode: string | null,
): string | null {
  if (greenlight.actionContractId !== contract.actionContractId) return "contract_mismatch";
  if (greenlight.gatewayRegistryEntryId !== contract.gatewayRegistryEntryId) return "gateway_registry_mismatch";
  if (greenlight.gatewayRegistryVersion !== contract.gatewayRegistryVersion) return "gateway_registry_version_mismatch";
  if (greenlight.gatewayId !== contract.gatewayId) return "gateway_mismatch";
  if (greenlight.gatewayPolicyVersion !== contract.gatewayPolicyVersion) return "greenlight_policy_mismatch";
  if (greenlight.actionClass !== contract.actionClass) return "action_class_mismatch";
  if (greenlight.resourceRef !== contract.resourceRef) return "resource_mismatch";
  if (greenlight.paramsDigest !== observedParamsDigest) return "params_mismatch";
  if (greenlight.contractDigest !== contract.actionContractDigest) return "contract_digest_mismatch";
  if (Date.parse(greenlight.notBefore) > Date.parse(now)) return "greenlight_not_active";
  if (Date.parse(greenlight.expiresAt) <= Date.parse(now)) return "greenlight_expired";
  if (greenlight.consumedAt !== null) return "already_consumed";
  if (gatewayPolicyDriftReasonCode) return gatewayPolicyDriftReasonCode;
  const blockingIsolation = isolationStates.find((state) =>
    ["review_only", "quarantined", "halted", "revoked", "state_suspect"].includes(state.state),
  );
  if (blockingIsolation) return `current_isolation_${blockingIsolation.state}`;
  if (sequenceDependencyReasonCode) return sequenceDependencyReasonCode;
  return null;
}

export function checkGatewayPolicyDrift(
  contract: ActionContract,
  greenlight: Greenlight,
  currentGateway: GatewayRegistryEntry | null,
): GatewayPolicyDriftCheck {
  if (!currentGateway) {
    return { status: "unknown", currentGatewayPolicyVersion: null, reasonCode: "gateway_policy_unknown" };
  }

  if (
    currentGateway.gatewayId !== contract.gatewayId ||
    currentGateway.protectedSurfaceKind.length === 0 ||
    currentGateway.gatewayPolicyContractId !== contract.gatewayPolicyContractId ||
    currentGateway.canonicalizerVersion !== contract.canonicalizerVersion ||
    currentGateway.receiptCapabilityStatus !== "available" ||
    currentGateway.isolationCheckCapabilityStatus !== "available"
  ) {
    return {
      status: "incompatible",
      currentGatewayPolicyVersion: currentGateway.gatewayPolicyVersion,
      reasonCode: "gateway_policy_drift",
    };
  }

  if (greenlight.gatewayPolicyVersion !== contract.gatewayPolicyVersion) {
    return {
      status: "incompatible",
      currentGatewayPolicyVersion: currentGateway.gatewayPolicyVersion,
      reasonCode: "greenlight_policy_mismatch",
    };
  }

  if (currentGateway.gatewayPolicyVersion === contract.gatewayPolicyVersion) {
    return {
      status: "same_version",
      currentGatewayPolicyVersion: currentGateway.gatewayPolicyVersion,
      reasonCode: null,
    };
  }

  if (
    currentGateway.gatewayPolicyDriftMode === "allow_compatible_stricter" &&
    currentGateway.compatiblePreviousGatewayPolicyVersions.includes(contract.gatewayPolicyVersion)
  ) {
    return {
      status: "compatible_stricter",
      currentGatewayPolicyVersion: currentGateway.gatewayPolicyVersion,
      reasonCode: null,
    };
  }

  return {
    status: "incompatible",
    currentGatewayPolicyVersion: currentGateway.gatewayPolicyVersion,
    reasonCode: "gateway_policy_drift",
  };
}

export function mutationOutcomeFor(mode: DownstreamMode) {
  if (mode === "succeed") return "succeeded";
  if (mode === "pending") return "submitted";
  if (mode === "refuse") return "downstream_refused";
  if (mode === "fail") return "failed";
  return "unknown";
}

export function surfaceOperationRefFor(mode: DownstreamMode, providedRef: string | undefined): string | null {
  if (providedRef) return providedRef;
  if (mode === "succeed" || mode === "pending") return createId("sop");
  return null;
}

export function downstreamStatusFor(mode: DownstreamMode, gateDecision: GateDecision) {
  if (gateDecision === "refused") return "not_started";
  if (mode === "succeed") return "succeeded";
  if (mode === "pending") return "pending";
  if (mode === "refuse") return "refused";
  if (mode === "fail") return "failed";
  return "unknown";
}

export function receiptFinalityFor(mode: DownstreamMode, gateDecision: GateDecision, hasProofGap: boolean) {
  if (hasProofGap || gateDecision === "proof_gap") return "unknown";
  if (gateDecision === "refused") return "suspect";
  if (mode === "succeed") return "final";
  if (mode === "pending") return "pending";
  if (mode === "unknown") return "unknown";
  return "suspect";
}

export function reconciliationStatusFor(status: "pending" | "succeeded" | "refused" | "failed" | "unknown") {
  if (status === "succeeded" || status === "refused") return "resolved";
  if (status === "failed") return "failed";
  if (status === "pending") return "pending";
  return "still_unknown";
}

export function reconciliationFinalityFor(status: "pending" | "succeeded" | "refused" | "failed" | "unknown") {
  if (status === "succeeded") return "final";
  if (status === "pending") return "pending";
  if (status === "unknown") return "unknown";
  return "suspect";
}
