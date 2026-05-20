import type { ActionContract } from "../action-contract";

export function protectedPathPostureScopeKeyForContract(contract: ActionContract): string {
  return protectedPathPostureScopeKey({
    tenantId: contract.tenantId,
    organizationId: contract.organizationId,
    runtimeAdapterId: contract.runtimeAdapterId,
    gatewayId: contract.gatewayId,
    actionClass: contract.actionClass,
    resourceRef: contract.resourceRef,
  });
}

export function protectedPathPostureScopeKey(input: {
  tenantId: string;
  organizationId: string;
  runtimeAdapterId: string;
  gatewayId: string;
  actionClass: string;
  resourceRef: string;
}): string {
  return [
    `tenant:${input.tenantId}`,
    `org:${input.organizationId}`,
    `runtime:${input.runtimeAdapterId}`,
    `gateway:${input.gatewayId}`,
    `action:${input.actionClass}`,
    `resource:${input.resourceRef}`,
  ].join("|");
}
