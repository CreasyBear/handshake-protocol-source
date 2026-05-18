import { digestCanonical } from "../canonical";
import type { ActionContract } from "../action-contract";
import type { MutationAttempt } from "../gateway-gate";
import { createId } from "../ids";
import type { Greenlight } from "../policy-greenlight";
import {
  PROTOCOL_VERSION,
  ProtectedSurfaceOperationClaimSchema,
  type ProtectedSurfaceOperationClaim,
  type ProtectedSurfaceOperationClaimState,
} from "./types";

export type ProtectedSurfaceOperationClaimKey = {
  tenantId: string;
  organizationId: string;
  gatewayId: string;
  protectedSurfaceKind: string;
  actionClass: string;
  resourceRef: string;
};

export function protectedSurfaceOperationClaimKey(contract: ActionContract): ProtectedSurfaceOperationClaimKey {
  return {
    tenantId: contract.tenantId,
    organizationId: contract.organizationId,
    gatewayId: contract.gatewayId,
    protectedSurfaceKind: contract.protectedSurfaceKind,
    actionClass: contract.actionClass,
    resourceRef: contract.resourceRef,
  };
}

export async function protectedSurfaceOperationClaimKeyDigest(
  key: ProtectedSurfaceOperationClaimKey,
): Promise<`sha256:${string}`> {
  return digestCanonical(key);
}

export async function buildActiveProtectedSurfaceOperationClaim(input: {
  contract: ActionContract;
  greenlight: Greenlight;
  gateAttemptId: string;
  mutationAttempt: MutationAttempt;
  now: string;
}): Promise<ProtectedSurfaceOperationClaim> {
  return buildProtectedSurfaceOperationClaim({
    contract: input.contract,
    greenlight: input.greenlight,
    gateAttemptId: input.gateAttemptId,
    mutationAttemptId: input.mutationAttempt.mutationAttemptId,
    claimState: "active",
    claimedAt: input.now,
    terminalAt: null,
    terminalReasonCode: null,
    releasedByRef: null,
  });
}

export async function buildTerminalProtectedSurfaceOperationClaim(
  activeClaim: ProtectedSurfaceOperationClaim,
  input: {
    claimState: ProtectedSurfaceOperationClaimState;
    terminalAt: string;
    terminalReasonCode: string;
    releasedByRef: string;
  },
): Promise<ProtectedSurfaceOperationClaim> {
  const claim = {
    ...activeClaim,
    claimState: input.claimState,
    terminalAt: input.terminalAt,
    terminalReasonCode: input.terminalReasonCode,
    releasedByRef: input.releasedByRef,
    claimDigest: null,
  };
  const claimDigest = await digestCanonical(claim);
  return ProtectedSurfaceOperationClaimSchema.parse({ ...claim, claimDigest });
}

async function buildProtectedSurfaceOperationClaim(input: {
  contract: ActionContract;
  greenlight: Greenlight;
  gateAttemptId: string;
  mutationAttemptId: string | null;
  claimState: ProtectedSurfaceOperationClaimState;
  claimedAt: string;
  terminalAt: string | null;
  terminalReasonCode: string | null;
  releasedByRef: string | null;
}): Promise<ProtectedSurfaceOperationClaim> {
  const claimKeyDigest = await protectedSurfaceOperationClaimKeyDigest(
    protectedSurfaceOperationClaimKey(input.contract),
  );
  const seed = {
    schemaVersion: PROTOCOL_VERSION,
    tenantId: input.contract.tenantId,
    organizationId: input.contract.organizationId,
    createdAt: input.claimedAt,
    protectedSurfaceOperationClaimId: createId("opc"),
    claimKeyDigest,
    gatewayId: input.contract.gatewayId,
    protectedSurfaceKind: input.contract.protectedSurfaceKind,
    actionClass: input.contract.actionClass,
    resourceRef: input.contract.resourceRef,
    actionContractId: input.contract.actionContractId,
    greenlightId: input.greenlight.greenlightId,
    gateAttemptId: input.gateAttemptId,
    mutationAttemptId: input.mutationAttemptId,
    claimState: input.claimState,
    claimedAt: input.claimedAt,
    terminalAt: input.terminalAt,
    terminalReasonCode: input.terminalReasonCode,
    releasedByRef: input.releasedByRef,
    claimDigest: null,
  };
  const claimDigest = await digestCanonical(seed);
  return ProtectedSurfaceOperationClaimSchema.parse({ ...seed, claimDigest });
}
