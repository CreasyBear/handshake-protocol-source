import { z } from "zod";
import {
  verifiedReceiverGateCheckFromResult,
  type ReceiverGateResult,
  type VerifiedReceiverGateCheck,
} from "../../protocol/receiver-gate-artifacts";
import type {
  ProofGap,
  ReceiverOperationReconciliation,
} from "../../protocol/schemas";
import type {
  ReceiverGateInput,
  ReconcileReceiverOperationInput,
} from "../../protocol/inputs";

export const PackageInstallParametersSchema = z.strictObject({
  package: z.string().min(1),
  versionRange: z.string().min(1),
});
export type PackageInstallParameters = z.infer<typeof PackageInstallParametersSchema>;

export type PackageInstallMutationCommand = {
  verifiedGate: VerifiedReceiverGateCheck;
  packageName: string;
  versionRange: string;
};

export type PackageInstallMutationEvidence = {
  evidenceRef: string;
  receiverOperationRef: string;
  packageName: string;
  versionRange: string;
};

export interface PackageInstallMutationSurface {
  applyPackageInstall(command: PackageInstallMutationCommand): Promise<PackageInstallMutationEvidence>;
}

export type PackageInstallProtocol = {
  receiverGate(input: ReceiverGateInput): Promise<ReceiverGateResult>;
  reconcileReceiverOperation(input: ReconcileReceiverOperationInput): Promise<{
    reconciliation: ReceiverOperationReconciliation;
    resolvedProofGaps: ProofGap[];
  }>;
};

export type PackageInstallReceiverInput = {
  protocol: PackageInstallProtocol;
  surface: PackageInstallMutationSurface;
  actionContractId: string;
  greenlightId: string;
  observedParameters: PackageInstallParameters;
  receiverOperationRef?: string;
  downstreamMode?: "pending" | "unknown";
};

export type PackageInstallReceiverResult =
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
      mutationEvidence: PackageInstallMutationEvidence;
    }
  | {
      outcome: "mutation_failed";
      receiverGate: ReceiverGateResult;
      reconciliation: ReceiverOperationReconciliation;
      mutationEvidence: null;
    };

export async function runPackageInstallReceiver(
  input: PackageInstallReceiverInput,
): Promise<PackageInstallReceiverResult> {
  const observedParameters = PackageInstallParametersSchema.parse(input.observedParameters);
  const receiverOperationRef = input.receiverOperationRef ?? `receiver-op:${input.actionContractId}`;
  const downstreamMode = input.downstreamMode ?? "pending";
  const receiverGate = await input.protocol.receiverGate({
    actionContractId: input.actionContractId,
    greenlightId: input.greenlightId,
    observedParameters,
    downstreamMode,
    receiverOperationRef,
  });

  const verifiedGate = verifiedReceiverGateCheckFromResult(receiverGate);
  if (!verifiedGate) {
    return { outcome: "receiver_gate_refused", receiverGate, reconciliation: null, mutationEvidence: null };
  }

  try {
    const mutationEvidence = await input.surface.applyPackageInstall({
      verifiedGate,
      packageName: observedParameters.package,
      versionRange: observedParameters.versionRange,
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
      evidenceRefs: [`evidence:package-install-failed:${receiverOperationRef}`],
      resolvedProofGapIds: verifiedGate.proofGapId ? [verifiedGate.proofGapId] : [],
    });
    return { outcome: "mutation_failed", receiverGate, reconciliation, mutationEvidence: null };
  }
}
