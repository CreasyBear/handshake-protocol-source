import { z } from "zod";
import {
  verifiedReceiverGateCheckFromResult,
  type ReceiverGateResult,
  type VerifiedReceiverGateCheck,
} from "../../protocol/receiver-gate-artifacts";
import { digestUtf8Content, utf8ByteLength } from "../../protocol/content-digests";
import type {
  ReceiverGateInput,
  ReconcileReceiverOperationInput,
} from "../../protocol/inputs";
import type {
  ProofGap,
  ReceiverOperationReconciliation,
} from "../../protocol/schemas";

export const RepoWriteParametersSchema = z.strictObject({
  repositoryRef: z.string().min(1),
  filePath: z.string().min(1),
  contentDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  contentByteLength: z.number().int().nonnegative(),
});
export type RepoWriteParameters = z.infer<typeof RepoWriteParametersSchema>;

export type RepoWriteMutationCommand = {
  verifiedGate: VerifiedReceiverGateCheck;
  repositoryRef: string;
  filePath: string;
  content: string;
  contentDigest: `sha256:${string}`;
  contentByteLength: number;
};

export type RepoWriteMutationEvidence = {
  evidenceRef: string;
  receiverOperationRef: string;
  repositoryRef: string;
  filePath: string;
  contentDigest: `sha256:${string}`;
  contentByteLength: number;
};

export interface RepoWriteMutationSurface {
  applyRepoWrite(command: RepoWriteMutationCommand): Promise<RepoWriteMutationEvidence>;
}

export type RepoWriteProtocol = {
  receiverGate(input: ReceiverGateInput): Promise<ReceiverGateResult>;
  reconcileReceiverOperation(input: ReconcileReceiverOperationInput): Promise<{
    reconciliation: ReceiverOperationReconciliation;
    resolvedProofGaps: ProofGap[];
  }>;
};

export type RepoWriteReceiverInput = {
  protocol: RepoWriteProtocol;
  surface: RepoWriteMutationSurface;
  actionContractId: string;
  greenlightId: string;
  repositoryRef: string;
  filePath: string;
  content: string;
  receiverOperationRef?: string;
  downstreamMode?: "pending" | "unknown";
};

export type RepoWriteReceiverResult =
  | {
      outcome: "receiver_gate_refused";
      receiverGate: ReceiverGateResult;
      reconciliation: null;
      mutationEvidence: null;
    }
  | {
      outcome: "mutation_reconciled";
      receiverGate: ReceiverGateResult;
      reconciliation: ReceiverOperationReconciliation;
      mutationEvidence: RepoWriteMutationEvidence;
    }
  | {
      outcome: "mutation_failed";
      receiverGate: ReceiverGateResult;
      reconciliation: ReceiverOperationReconciliation;
      mutationEvidence: null;
    };

export async function runRepoWriteReceiver(input: RepoWriteReceiverInput): Promise<RepoWriteReceiverResult> {
  const contentDigest = await digestUtf8Content(input.content);
  const contentByteLength = utf8ByteLength(input.content);
  const observedParameters = RepoWriteParametersSchema.parse({
    repositoryRef: input.repositoryRef,
    filePath: input.filePath,
    contentDigest,
    contentByteLength,
  });
  const receiverOperationRef = input.receiverOperationRef ?? `receiver-op:${input.actionContractId}`;
  const receiverGate = await input.protocol.receiverGate({
    actionContractId: input.actionContractId,
    greenlightId: input.greenlightId,
    observedParameters,
    downstreamMode: input.downstreamMode ?? "pending",
    receiverOperationRef,
  });

  const verifiedGate = verifiedReceiverGateCheckFromResult(receiverGate);
  if (!verifiedGate) {
    return { outcome: "receiver_gate_refused", receiverGate, reconciliation: null, mutationEvidence: null };
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
    const { reconciliation } = await input.protocol.reconcileReceiverOperation({
      mutationAttemptId: verifiedGate.mutationAttemptId,
      idempotencyKey: verifiedGate.idempotencyKey,
      observedReceiverOperationRef: mutationEvidence.receiverOperationRef,
      observedDownstreamStatus: "succeeded",
      evidenceRefs: [mutationEvidence.evidenceRef],
      resolvedProofGapIds: verifiedGate.proofGapId ? [verifiedGate.proofGapId] : [],
    });
    return { outcome: "mutation_reconciled", receiverGate, reconciliation, mutationEvidence };
  } catch {
    const { reconciliation } = await input.protocol.reconcileReceiverOperation({
      mutationAttemptId: verifiedGate.mutationAttemptId,
      idempotencyKey: verifiedGate.idempotencyKey,
      observedReceiverOperationRef: receiverOperationRef,
      observedDownstreamStatus: "failed",
      evidenceRefs: [`evidence:repo-write-failed:${receiverOperationRef}`],
      resolvedProofGapIds: verifiedGate.proofGapId ? [verifiedGate.proofGapId] : [],
    });
    return { outcome: "mutation_failed", receiverGate, reconciliation, mutationEvidence: null };
  }
}
