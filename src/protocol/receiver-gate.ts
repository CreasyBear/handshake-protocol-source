import { createId } from "./ids";
import type { ActionContract, GateDecision, Greenlight, IsolationState, ReceiverRegistryEntry } from "./schemas";

export type DownstreamMode = "succeed" | "pending" | "refuse" | "fail" | "unknown";

export type ReceiverPolicyDriftCheck = {
  status: "same_version" | "compatible_stricter" | "incompatible" | "unknown";
  currentReceiverPolicyVersion: string | null;
  reasonCode: string | null;
};

export function gateRefusalReason(
  contract: ActionContract,
  greenlight: Greenlight,
  observedParamsDigest: string,
  isolationStates: IsolationState[],
  now: string,
  receiverPolicyDriftReasonCode: string | null,
  sequenceDependencyReasonCode: string | null,
): string | null {
  if (greenlight.actionContractId !== contract.actionContractId) return "contract_mismatch";
  if (greenlight.receiverRegistryEntryId !== contract.receiverRegistryEntryId) return "receiver_registry_mismatch";
  if (greenlight.receiverRegistryVersion !== contract.receiverRegistryVersion) return "receiver_registry_version_mismatch";
  if (greenlight.receiverId !== contract.receiverId) return "receiver_mismatch";
  if (greenlight.receiverPolicyVersion !== contract.receiverPolicyVersion) return "greenlight_policy_mismatch";
  if (greenlight.actionClass !== contract.actionClass) return "action_class_mismatch";
  if (greenlight.resourceRef !== contract.resourceRef) return "resource_mismatch";
  if (greenlight.paramsDigest !== observedParamsDigest) return "params_mismatch";
  if (greenlight.contractDigest !== contract.actionContractDigest) return "contract_digest_mismatch";
  if (Date.parse(greenlight.notBefore) > Date.parse(now)) return "greenlight_not_active";
  if (Date.parse(greenlight.expiresAt) <= Date.parse(now)) return "greenlight_expired";
  if (greenlight.consumedAt !== null) return "already_consumed";
  if (receiverPolicyDriftReasonCode) return receiverPolicyDriftReasonCode;
  const blockingIsolation = isolationStates.find((state) =>
    ["review_only", "quarantined", "halted", "revoked", "state_suspect"].includes(state.state),
  );
  if (blockingIsolation) return `current_isolation_${blockingIsolation.state}`;
  if (sequenceDependencyReasonCode) return sequenceDependencyReasonCode;
  return null;
}

export function checkReceiverPolicyDrift(
  contract: ActionContract,
  greenlight: Greenlight,
  currentReceiver: ReceiverRegistryEntry | null,
): ReceiverPolicyDriftCheck {
  if (!currentReceiver) {
    return { status: "unknown", currentReceiverPolicyVersion: null, reasonCode: "receiver_policy_unknown" };
  }

  if (
    currentReceiver.receiverId !== contract.receiverId ||
    currentReceiver.receiverKind.length === 0 ||
    currentReceiver.receiverPolicyContractId !== contract.receiverPolicyContractId ||
    currentReceiver.canonicalizerVersion !== contract.canonicalizerVersion ||
    currentReceiver.receiptCapabilityStatus !== "available" ||
    currentReceiver.isolationCheckCapabilityStatus !== "available"
  ) {
    return {
      status: "incompatible",
      currentReceiverPolicyVersion: currentReceiver.receiverPolicyVersion,
      reasonCode: "receiver_policy_drift",
    };
  }

  if (greenlight.receiverPolicyVersion !== contract.receiverPolicyVersion) {
    return {
      status: "incompatible",
      currentReceiverPolicyVersion: currentReceiver.receiverPolicyVersion,
      reasonCode: "greenlight_policy_mismatch",
    };
  }

  if (currentReceiver.receiverPolicyVersion === contract.receiverPolicyVersion) {
    return {
      status: "same_version",
      currentReceiverPolicyVersion: currentReceiver.receiverPolicyVersion,
      reasonCode: null,
    };
  }

  if (
    currentReceiver.receiverPolicyDriftMode === "allow_compatible_stricter" &&
    currentReceiver.compatiblePreviousReceiverPolicyVersions.includes(contract.receiverPolicyVersion)
  ) {
    return {
      status: "compatible_stricter",
      currentReceiverPolicyVersion: currentReceiver.receiverPolicyVersion,
      reasonCode: null,
    };
  }

  return {
    status: "incompatible",
    currentReceiverPolicyVersion: currentReceiver.receiverPolicyVersion,
    reasonCode: "receiver_policy_drift",
  };
}

export function mutationOutcomeFor(mode: DownstreamMode) {
  if (mode === "succeed") return "succeeded";
  if (mode === "pending") return "submitted";
  if (mode === "refuse") return "downstream_refused";
  if (mode === "fail") return "failed";
  return "unknown";
}

export function receiverOperationRefFor(mode: DownstreamMode, providedRef: string | undefined): string | null {
  if (providedRef) return providedRef;
  if (mode === "succeed" || mode === "pending") return createId("rop");
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
