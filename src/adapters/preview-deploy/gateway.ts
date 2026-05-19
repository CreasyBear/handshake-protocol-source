import { z } from "zod";
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

export const PreviewDeployParametersSchema = z.strictObject({
  provider: z.string().min(1),
  projectRef: z.string().min(1),
  branchRef: z.string().min(1),
  commitRef: z.string().min(1),
  previewUrlHint: z.string().min(1).nullable(),
});
export type PreviewDeployParameters = z.infer<typeof PreviewDeployParametersSchema>;

export type PreviewDeployCommand = {
  verifiedGate: VerifiedGatewayCheck;
  provider: string;
  projectRef: string;
  branchRef: string;
  commitRef: string;
  previewUrlHint: string | null;
};

export type PreviewDeployEvidence = {
  evidenceRef: string;
  surfaceOperationRef: string;
  previewUrl: string;
  provider: string;
  projectRef: string;
  branchRef: string;
  commitRef: string;
};

export interface PreviewDeploySurface {
  createPreviewDeploy(command: PreviewDeployCommand): Promise<PreviewDeployEvidence>;
}

export type PreviewDeployProtocol = {
  gatewayCheck(input: GatewayCheckInput): Promise<GatewayCheckResult>;
  reconcileSurfaceOperation(input: ReconcileSurfaceOperationInput): Promise<SurfaceOperationReconciliationResult>;
};

export type PreviewDeployGatewayInput = {
  protocol: PreviewDeployProtocol;
  surface: PreviewDeploySurface;
  actionContractId: string;
  greenlightId: string;
  observedParameters: PreviewDeployParameters;
  surfaceOperationRef?: string;
};

export type PreviewDeployGatewayResult =
  | {
      outcome: "gateway_check_refused";
      gatewayCheck: GatewayCheckResult;
      reconciliation: null;
      previewEvidence: null;
    }
  | {
      outcome: "gateway_check_not_authoritative";
      gatewayCheck: GatewayCheckResult;
      reconciliation: null;
      previewEvidence: null;
    }
  | {
      outcome: "preview_created";
      gatewayCheck: GatewayCheckResult;
      reconciliation: SurfaceOperationReconciliation;
      previewEvidence: PreviewDeployEvidence;
    }
  | {
      outcome: "preview_failed";
      gatewayCheck: GatewayCheckResult;
      reconciliation: SurfaceOperationReconciliation;
      previewEvidence: null;
    };

export async function runPreviewDeployGateway(input: PreviewDeployGatewayInput): Promise<PreviewDeployGatewayResult> {
  const observedParameters = PreviewDeployParametersSchema.parse(input.observedParameters);
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
    return { outcome, gatewayCheck, reconciliation: null, previewEvidence: null };
  }

  try {
    const previewEvidence = await input.surface.createPreviewDeploy({
      verifiedGate,
      provider: observedParameters.provider,
      projectRef: observedParameters.projectRef,
      branchRef: observedParameters.branchRef,
      commitRef: observedParameters.commitRef,
      previewUrlHint: observedParameters.previewUrlHint,
    });
    const { reconciliation } = await input.protocol.reconcileSurfaceOperation({
      mutationAttemptId: verifiedGate.mutationAttemptId,
      idempotencyKey: verifiedGate.idempotencyKey,
      observedSurfaceOperationRef: previewEvidence.surfaceOperationRef,
      observedDownstreamStatus: "succeeded",
      evidenceRefs: [previewEvidence.evidenceRef],
      resolvedProofGapIds: [],
    });
    return { outcome: "preview_created", gatewayCheck, reconciliation, previewEvidence };
  } catch {
    const { reconciliation } = await input.protocol.reconcileSurfaceOperation({
      mutationAttemptId: verifiedGate.mutationAttemptId,
      idempotencyKey: verifiedGate.idempotencyKey,
      observedSurfaceOperationRef: surfaceOperationRef,
      observedDownstreamStatus: "failed",
      evidenceRefs: [`evidence:preview-deploy-failed:${surfaceOperationRef}`],
      resolvedProofGapIds: [],
    });
    return { outcome: "preview_failed", gatewayCheck, reconciliation, previewEvidence: null };
  }
}
