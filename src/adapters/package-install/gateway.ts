import { z } from "zod";
import {
  verifiedGatewayCheckFromResult,
  type GatewayCheckResult,
  type VerifiedGatewayCheck,
} from "../../protocol/gateway-check-artifacts";
import type {
  GatewayCheckInput,
  ReconcileSurfaceOperationInput,
} from "../../protocol/inputs";
import type { SurfaceOperationReconciliationResult } from "../../protocol/surface-operation-reconciliations";
import type { SurfaceOperationReconciliation } from "../../protocol/schemas";

export const PackageInstallParametersSchema = z.strictObject({
  package: z.string().min(1),
  versionRange: z.string().min(1),
});
export type PackageInstallParameters = z.infer<typeof PackageInstallParametersSchema>;

export type PackageInstallMutationCommand = {
  verifiedGate: VerifiedGatewayCheck;
  packageName: string;
  versionRange: string;
};

export type PackageInstallMutationEvidence = {
  evidenceRef: string;
  surfaceOperationRef: string;
  packageName: string;
  versionRange: string;
};

export interface PackageInstallMutationSurface {
  applyPackageInstall(command: PackageInstallMutationCommand): Promise<PackageInstallMutationEvidence>;
}

export type PackageInstallProtocol = {
  gatewayCheck(input: GatewayCheckInput): Promise<GatewayCheckResult>;
  reconcileSurfaceOperation(input: ReconcileSurfaceOperationInput): Promise<SurfaceOperationReconciliationResult>;
};

export type PackageInstallGatewayInput = {
  protocol: PackageInstallProtocol;
  surface: PackageInstallMutationSurface;
  actionContractId: string;
  greenlightId: string;
  observedParameters: PackageInstallParameters;
  surfaceOperationRef?: string;
};

export type PackageInstallGatewayResult =
  | {
      outcome: "gateway_check_refused";
      gatewayCheck: GatewayCheckResult;
      reconciliation: null;
      mutationEvidence: null;
    }
  | {
      outcome: "gateway_check_not_authoritative";
      gatewayCheck: GatewayCheckResult;
      reconciliation: null;
      mutationEvidence: null;
    }
  | {
      outcome: "mutation_reconciled";
      gatewayCheck: GatewayCheckResult;
      reconciliation: SurfaceOperationReconciliation;
      mutationEvidence: PackageInstallMutationEvidence;
    }
  | {
      outcome: "mutation_failed";
      gatewayCheck: GatewayCheckResult;
      reconciliation: SurfaceOperationReconciliation;
      mutationEvidence: null;
    };

export async function runPackageInstallGateway(
  input: PackageInstallGatewayInput,
): Promise<PackageInstallGatewayResult> {
  const observedParameters = PackageInstallParametersSchema.parse(input.observedParameters);
  const surfaceOperationRef = input.surfaceOperationRef ?? `surface-op:${input.actionContractId}`;
  const gatewayCheck = await input.protocol.gatewayCheck({
    actionContractId: input.actionContractId,
    greenlightId: input.greenlightId,
    observedParameters,
    downstreamMode: "pending",
    surfaceOperationRef,
  });

  const verifiedGate = verifiedGatewayCheckFromResult(gatewayCheck);
  if (!verifiedGate) {
    const outcome =
      gatewayCheck.gateAttempt.gateDecision === "refused" ? "gateway_check_refused" : "gateway_check_not_authoritative";
    return { outcome, gatewayCheck, reconciliation: null, mutationEvidence: null };
  }

  try {
    const mutationEvidence = await input.surface.applyPackageInstall({
      verifiedGate,
      packageName: observedParameters.package,
      versionRange: observedParameters.versionRange,
    });
    const { reconciliation } = await input.protocol.reconcileSurfaceOperation({
      mutationAttemptId: verifiedGate.mutationAttemptId,
      idempotencyKey: verifiedGate.idempotencyKey,
      observedSurfaceOperationRef: mutationEvidence.surfaceOperationRef,
      observedDownstreamStatus: "succeeded",
      evidenceRefs: [mutationEvidence.evidenceRef],
      resolvedProofGapIds: [],
    });
    return { outcome: "mutation_reconciled", gatewayCheck, reconciliation, mutationEvidence };
  } catch {
    const { reconciliation } = await input.protocol.reconcileSurfaceOperation({
      mutationAttemptId: verifiedGate.mutationAttemptId,
      idempotencyKey: verifiedGate.idempotencyKey,
      observedSurfaceOperationRef: surfaceOperationRef,
      observedDownstreamStatus: "failed",
      evidenceRefs: [`evidence:package-install-failed:${surfaceOperationRef}`],
      resolvedProofGapIds: [],
    });
    return { outcome: "mutation_failed", gatewayCheck, reconciliation, mutationEvidence: null };
  }
}
