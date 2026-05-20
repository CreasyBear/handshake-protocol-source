import type { BypassProbe, BypassProbeKind, BypassProbeOutcome } from "../../protocol/public/schemas";
import type { CreateBypassProbeInput } from "../../protocol/public/inputs";
import { requiredGatewayCheckedBypassProbeKinds } from "../../protocol/public/schemas";

export type BypassProbeExecutionScope = {
  tenantId: string;
  organizationId: string;
  runtimeAdapterId: string;
  gatewayId: string;
  actionClass: string;
  resourceRef: string;
  protectedSurfaceKind: string;
  expiresAt: string;
};

export type BypassProbeExecutionResult = Omit<
  CreateBypassProbeInput,
  | "tenantId"
  | "organizationId"
  | "runtimeAdapterId"
  | "gatewayId"
  | "actionClass"
  | "resourceRef"
  | "protectedSurfaceKind"
  | "probeKind"
  | "expiresAt"
>;

export type BypassProbeExecutor = {
  probeKind: BypassProbeKind;
  execute(scope: BypassProbeExecutionScope): Promise<BypassProbeExecutionResult>;
};

export type BypassProbeExecutionProtocol = {
  createBypassProbe(input: CreateBypassProbeInput): Promise<BypassProbe>;
};

export type FixtureBypassProbePosture = Partial<Record<BypassProbeKind, BypassProbeOutcome>>;

export async function runBypassProbeExecutors(
  protocol: BypassProbeExecutionProtocol,
  scope: BypassProbeExecutionScope,
  executors: readonly BypassProbeExecutor[],
): Promise<BypassProbe[]> {
  const probes: BypassProbe[] = [];
  for (const executor of executors) {
    const result = await executor.execute(scope);
    probes.push(
      await protocol.createBypassProbe({
        ...scope,
        ...result,
        probeKind: executor.probeKind,
      }),
    );
  }
  return probes;
}

export function fixtureGatewayCheckedBypassProbeExecutors(
  posture: FixtureBypassProbePosture = {},
): BypassProbeExecutor[] {
  return requiredGatewayCheckedBypassProbeKinds.map((probeKind) => ({
    probeKind,
    async execute() {
      const probeOutcome = posture[probeKind] ?? "passed";
      return {
        probeOutcome,
        sourceAuthority: "conformance_fixture" as const,
        reasonCodes: [probeOutcome === "passed" ? "bypass_probe_passed" : "protected_path_probe_failed"],
        evidenceRefs: [`evidence:probe-executor:${probeKind}:${probeOutcome}`],
      };
    },
  }));
}
