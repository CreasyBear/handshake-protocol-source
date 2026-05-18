import { HandshakeProtocolError } from "../errors";
import type { ActionContract } from "../action-contract";
import { createId, nowIso } from "../ids";
import type { SurfaceOperationReconciliation } from "../operation-lifecycle";
import type { ProtocolRecorder } from "../records";
import {
  PROTOCOL_VERSION,
  ProofGapSchema,
  type ProofGap,
} from "./types";

export function buildProofGap(
  contract: ActionContract,
  gapPhase: "compilation" | "policy" | "gate" | "mutation" | "receipt" | "stream" | "recovery",
  expectedEvidenceType: string,
  reasonCode: string,
  refs: { gateAttemptId: string | null; mutationAttemptId: string | null; receiptId: string | null },
): ProofGap {
  return ProofGapSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: contract.tenantId,
    organizationId: contract.organizationId,
    createdAt: nowIso(),
    proofGapId: createId("gap"),
    gapPhase,
    expectedEvidenceType,
    missingOrInvalidEvidenceRef: expectedEvidenceType,
    affectedObjectRefs: [contract.actionContractId, ...Object.values(refs).filter((value): value is string => value !== null)],
    gateAttemptId: refs.gateAttemptId,
    mutationAttemptId: refs.mutationAttemptId,
    receiptId: refs.receiptId,
    reasonCode,
    finalityImpact: "unknown",
    recoveryRequirement: "Reconcile downstream surface operation before treating receipt as final.",
    resolvedAt: null,
    resolvedByRef: null,
  });
}

export async function resolveProofGaps(
  recorder: ProtocolRecorder,
  proofGapIds: string[],
  reconciliation: SurfaceOperationReconciliation,
  now: string,
): Promise<ProofGap[]> {
  const resolved: ProofGap[] = [];
  for (const proofGapId of proofGapIds) {
    const proofGapRecord = await recorder.requiredRecord<ProofGap>("proof_gap", proofGapId, "proof_gap_missing");
    if (proofGapRecord.payload.mutationAttemptId !== reconciliation.mutationAttemptId) {
      throw new HandshakeProtocolError(
        "invalid_transition_proof_gap_mismatch",
        "Reconciliation may resolve only proof gaps tied to the same mutation attempt.",
        409,
      );
    }
    resolved.push(
      ProofGapSchema.parse({
        ...proofGapRecord.payload,
        resolvedAt: now,
        resolvedByRef: reconciliation.reconciliationId,
      }),
    );
  }
  return resolved;
}
