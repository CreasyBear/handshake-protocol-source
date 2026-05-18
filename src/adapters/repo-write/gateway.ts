import { z } from "zod";
import {
  verifiedGatewayCheckFromResult,
  type GatewayCheckResult,
  type VerifiedGatewayCheck,
} from "../../protocol/gateway-check-artifacts";
import { digestUtf8Content, utf8ByteLength } from "../../protocol/content-digests";
import type {
  GatewayCheckInput,
  ReconcileSurfaceOperationInput,
} from "../../protocol/inputs";
import type { SurfaceOperationReconciliationResult } from "../../protocol/surface-operation-reconciliations";
import type { SurfaceOperationReconciliation } from "../../protocol/schemas";

export const RepoWriteParametersSchema = z.strictObject({
  repositoryRef: z.string().min(1),
  filePath: z.string().min(1),
  contentDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  contentByteLength: z.number().int().nonnegative(),
});
export type RepoWriteParameters = z.infer<typeof RepoWriteParametersSchema>;

export type RepoWriteMutationCommand = {
  verifiedGate: VerifiedGatewayCheck;
  repositoryRef: string;
  filePath: string;
  content: string;
  contentDigest: `sha256:${string}`;
  contentByteLength: number;
};

export type RepoWriteMutationEvidence = {
  evidenceRef: string;
  surfaceOperationRef: string;
  repositoryRef: string;
  filePath: string;
  contentDigest: `sha256:${string}`;
  contentByteLength: number;
};

export interface RepoWriteMutationSurface {
  applyRepoWrite(command: RepoWriteMutationCommand): Promise<RepoWriteMutationEvidence>;
}

export type RepoWriteProtocol = {
  gatewayCheck(input: GatewayCheckInput): Promise<GatewayCheckResult>;
  reconcileSurfaceOperation(input: ReconcileSurfaceOperationInput): Promise<SurfaceOperationReconciliationResult>;
};

export type RepoWriteGatewayInput = {
  protocol: RepoWriteProtocol;
  surface: RepoWriteMutationSurface;
  actionContractId: string;
  greenlightId: string;
  repositoryRef: string;
  filePath: string;
  content: string;
  surfaceOperationRef?: string;
};

export type RepoWriteGatewayResult =
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
      mutationEvidence: RepoWriteMutationEvidence;
    }
  | {
      outcome: "mutation_failed";
      gatewayCheck: GatewayCheckResult;
      reconciliation: SurfaceOperationReconciliation;
      mutationEvidence: null;
    };

export async function runRepoWriteGateway(input: RepoWriteGatewayInput): Promise<RepoWriteGatewayResult> {
  const contentDigest = await digestUtf8Content(input.content);
  const contentByteLength = utf8ByteLength(input.content);
  const observedParameters = RepoWriteParametersSchema.parse({
    repositoryRef: input.repositoryRef,
    filePath: input.filePath,
    contentDigest,
    contentByteLength,
  });
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
    const mutationEvidence = await input.surface.applyRepoWrite({
      verifiedGate,
      repositoryRef: input.repositoryRef,
      filePath: input.filePath,
      content: input.content,
      contentDigest,
      contentByteLength,
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
      evidenceRefs: [`evidence:repo-write-failed:${surfaceOperationRef}`],
      resolvedProofGapIds: [],
    });
    return { outcome: "mutation_failed", gatewayCheck, reconciliation, mutationEvidence: null };
  }
}
