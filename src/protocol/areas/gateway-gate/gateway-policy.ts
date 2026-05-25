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
  idempotencyLedgerKeyDigest: string,
  isolationStates: IsolationState[],
  now: string,
  gatewayPolicyDriftReasonCode: string | null,
  delegatedAuthorityBindingReasonCode: string | null,
  gatewayCredentialBindingReasonCode: string | null,
  protectedPathReasonCode: string | null,
  sequenceDependencyReasonCode: string | null,
): string | null {
  if (greenlight.actionContractId !== contract.actionContractId) return "contract_mismatch";
  if (greenlight.gatewayRegistryEntryId !== contract.gatewayRegistryEntryId) return "gateway_registry_mismatch";
  if (greenlight.gatewayRegistryDigest !== null && greenlight.gatewayRegistryDigest !== contract.gatewayRegistryDigest)
    return "gateway_registry_digest_mismatch";
  if (greenlight.gatewayRegistryVersion !== contract.gatewayRegistryVersion) return "gateway_registry_version_mismatch";
  if (greenlight.gatewayId !== contract.gatewayId) return "gateway_mismatch";
  if (greenlight.gatewayPolicyVersion !== contract.gatewayPolicyVersion) return "greenlight_policy_mismatch";
  if (
    greenlight.policyVersionRef !== null &&
    greenlight.policyVersionRef !== stringParameter(contract, "policyVersionRef")
  )
    return "greenlight_policy_version_ref_mismatch";
  if (
    greenlight.policyVersionDigest !== null &&
    greenlight.policyVersionDigest !== stringParameter(contract, "policyVersionDigest")
  )
    return "greenlight_policy_version_digest_mismatch";
  if (
    greenlight.gatewayReadinessRef !== null &&
    greenlight.gatewayReadinessRef !== stringParameter(contract, "gatewayReadinessRef")
  )
    return "greenlight_readiness_ref_mismatch";
  if (
    greenlight.gatewayReadinessDigest !== null &&
    greenlight.gatewayReadinessDigest !== stringParameter(contract, "gatewayReadinessDigest")
  )
    return "greenlight_readiness_digest_mismatch";
  if (greenlight.actionClass !== contract.actionClass) return "action_class_mismatch";
  if (greenlight.resourceRef !== contract.resourceRef) return "resource_mismatch";
  if (greenlight.paramsDigest !== observedParamsDigest) return "params_mismatch";
  if (greenlight.contractDigest !== contract.actionContractDigest) return "contract_digest_mismatch";
  if (greenlight.idempotencyKey !== null && greenlight.idempotencyKey !== contract.idempotencyKey)
    return "greenlight_idempotency_key_mismatch";
  if (
    greenlight.idempotencyLedgerKeyDigest !== null &&
    greenlight.idempotencyLedgerKeyDigest !== idempotencyLedgerKeyDigest
  )
    return "greenlight_idempotency_scope_mismatch";
  if (
    !sameSet(
      greenlight.gatewayCredentialRefIds,
      contract.gatewayCredentialRefs.map((ref) => ref.gatewayCredentialRefId),
    )
  )
    return "greenlight_credential_ref_mismatch";
  if (
    !sameSet(
      greenlight.gatewayCredentialRefDigests,
      contract.gatewayCredentialRefs.map((ref) => ref.gatewayCredentialRefDigest),
    )
  )
    return "greenlight_credential_ref_digest_mismatch";
  if (
    !sameSet(
      greenlight.delegatedAuthorityRefIds,
      contract.delegatedAuthorityRefs.map((ref) => ref.delegatedAuthorityRefId),
    )
  )
    return "greenlight_delegated_authority_ref_mismatch";
  if (
    !sameSet(
      greenlight.delegatedAuthorityRefDigests,
      contract.delegatedAuthorityRefs.map((ref) => ref.delegatedAuthorityRefDigest),
    )
  )
    return "greenlight_delegated_authority_ref_digest_mismatch";
  if (greenlight.requiredProtectedPathState !== contract.requiredProtectedPathState)
    return "protected_path_requirement_mismatch";
  if (Date.parse(greenlight.notBefore) > Date.parse(now)) return "greenlight_not_active";
  if (Date.parse(greenlight.expiresAt) <= Date.parse(now)) return "greenlight_expired";
  if (greenlight.consumedAt !== null) return "already_consumed";
  if (gatewayPolicyDriftReasonCode) return gatewayPolicyDriftReasonCode;
  if (delegatedAuthorityBindingReasonCode) return delegatedAuthorityBindingReasonCode;
  if (gatewayCredentialBindingReasonCode) return gatewayCredentialBindingReasonCode;
  if (protectedPathReasonCode) return protectedPathReasonCode;
  const blockingIsolation = isolationStates.find((state) =>
    ["review_only", "quarantined", "halted", "revoked", "state_suspect"].includes(state.state),
  );
  if (blockingIsolation) return `current_isolation_${blockingIsolation.state}`;
  if (sequenceDependencyReasonCode) return sequenceDependencyReasonCode;
  return null;
}

function stringParameter(contract: ActionContract, key: string): string | null {
  const value = contract.parameters[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function sameSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const leftSorted = [...left].sort();
  const rightSorted = [...right].sort();
  return leftSorted.every((value, index) => value === rightSorted[index]);
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
