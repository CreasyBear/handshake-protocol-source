import { createId } from "../../foundation/ids";
import type { ActionContract } from "../action-contract";
import type { GatewayRegistryEntry } from "../catalog-envelope";
import type { IsolationState } from "../isolation-breaker";
import type { Greenlight } from "../policy-greenlight";
import type { GateDecision } from "./types";
export { reconciliationFinalityFor, reconciliationStatusFor } from "../operation-lifecycle";

export type DownstreamMode = "pending";

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
  protectedPathReasonCode: string | null,
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
  if (greenlight.requiredProtectedPathState !== contract.requiredProtectedPathState)
    return "protected_path_requirement_mismatch";
  if (Date.parse(greenlight.notBefore) > Date.parse(now)) return "greenlight_not_active";
  if (Date.parse(greenlight.expiresAt) <= Date.parse(now)) return "greenlight_expired";
  if (greenlight.consumedAt !== null) return "already_consumed";
  if (gatewayPolicyDriftReasonCode) return gatewayPolicyDriftReasonCode;
  if (protectedPathReasonCode) return protectedPathReasonCode;
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
    currentGateway.protectedSurfaceKind !== contract.protectedSurfaceKind ||
    currentGateway.gatewayPolicyContractId !== contract.gatewayPolicyContractId ||
    currentGateway.canonicalizerVersion !== contract.canonicalizerVersion ||
    currentGateway.receiptCapabilityStatus !== "available" ||
    currentGateway.isolationCheckCapabilityStatus !== "available" ||
    currentGateway.credentialCustodyStatus !== contract.credentialCustodyStatus ||
    currentGateway.enforcementMode !== contract.enforcementMode ||
    currentGateway.mutationCredentialHolderRef !== contract.mutationCredentialHolderRef ||
    currentGateway.gatewayAuthorityHolderRef !== contract.gatewayAuthorityHolderRef
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

export function mutationOutcomeFor() {
  return "submitted";
}

export function surfaceOperationRefFor(providedRef: string | undefined): string | null {
  if (providedRef) return providedRef;
  return createId("sop");
}

export function downstreamStatusFor(gateDecision: GateDecision) {
  if (gateDecision === "refused") return "not_started";
  return "pending";
}

export function receiptFinalityFor(gateDecision: GateDecision, hasProofGap: boolean) {
  if (hasProofGap || gateDecision === "proof_gap") return "unknown";
  if (gateDecision === "refused") return "suspect";
  return "pending";
}
