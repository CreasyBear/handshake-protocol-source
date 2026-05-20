import { z } from "zod";
import { downstreamFailureEvidence } from "../downstream-failure-evidence";
import {
  verifiedGatewayCheckFromResult,
  type GatewayCheckInput,
  type GatewayCheckResult,
  type VerifiedGatewayCheck,
} from "../../protocol/areas/gateway-gate";
import type {
  ReconcileSurfaceOperationInput,
  SurfaceOperationReconciliation,
  SurfaceOperationReconciliationResult,
} from "../../protocol/areas/operation-lifecycle";

export const PackageInstallParametersSchema = z.strictObject({
  package: z.string().min(1),
  versionRange: z.string().min(1),
  packageManager: z.string().min(1),
  registryRef: z.string().min(1),
  workspaceRef: z.string().min(1).nullable(),
  manifestRef: z.string().min(1).nullable(),
  lockfileRef: z.string().min(1).nullable(),
  installFlags: z.array(z.string().min(1)),
  lifecycleScriptPolicy: z.enum(["blocked", "allowed", "unknown"]),
  resolvedMaterialDigest: z
    .string()
    .regex(/^sha256:[a-f0-9]{64}$/)
    .nullable(),
  resolvedMaterialEvidenceRefs: z.array(z.string().min(1)),
});
export type PackageInstallParameters = z.infer<typeof PackageInstallParametersSchema>;

export type PackageInstallMutationCommand = {
  verifiedGate: VerifiedGatewayCheck;
  parameters: PackageInstallParameters;
  packageName: string;
  versionRange: string;
  packageManager: string;
  registryRef: string;
  workspaceRef: string | null;
  manifestRef: string | null;
  lockfileRef: string | null;
  installFlags: string[];
  lifecycleScriptPolicy: "blocked" | "allowed" | "unknown";
  resolvedMaterialDigest: PackageInstallParameters["resolvedMaterialDigest"];
  resolvedMaterialEvidenceRefs: string[];
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
      parameters: observedParameters,
      packageName: observedParameters.package,
      versionRange: observedParameters.versionRange,
      packageManager: observedParameters.packageManager,
      registryRef: observedParameters.registryRef,
      workspaceRef: observedParameters.workspaceRef,
      manifestRef: observedParameters.manifestRef,
      lockfileRef: observedParameters.lockfileRef,
      installFlags: observedParameters.installFlags,
      lifecycleScriptPolicy: observedParameters.lifecycleScriptPolicy,
      resolvedMaterialDigest: observedParameters.resolvedMaterialDigest,
      resolvedMaterialEvidenceRefs: observedParameters.resolvedMaterialEvidenceRefs,
    });
    const { reconciliation } = await input.protocol.reconcileSurfaceOperation({
      mutationAttemptId: verifiedGate.mutationAttemptId,
      idempotencyKey: verifiedGate.idempotencyKey,
      observedSurfaceOperationRef: mutationEvidence.surfaceOperationRef,
      observedDownstreamStatus: "succeeded",
      downstreamRetryability: "non_retryable",
      providerOperationRef: mutationEvidence.surfaceOperationRef,
      diagnosticsRedactionPosture: "redacted",
      evidenceRefs: [mutationEvidence.evidenceRef],
      resolvedProofGapIds: [],
    });
    return { outcome: "mutation_reconciled", gatewayCheck, reconciliation, mutationEvidence };
  } catch (error) {
    const failureEvidence = await downstreamFailureEvidence({
      adapterId: "package-install",
      surfaceOperationRef,
      error,
      evidenceRef: `evidence:package-install-failed:${surfaceOperationRef}`,
    });
    const { reconciliation } = await input.protocol.reconcileSurfaceOperation({
      mutationAttemptId: verifiedGate.mutationAttemptId,
      idempotencyKey: verifiedGate.idempotencyKey,
      observedSurfaceOperationRef: surfaceOperationRef,
      observedDownstreamStatus: "failed",
      ...failureEvidence,
      resolvedProofGapIds: [],
    });
    return { outcome: "mutation_failed", gatewayCheck, reconciliation, mutationEvidence: null };
  }
}
