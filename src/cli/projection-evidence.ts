import {
  ContractEvidenceProjectionSchema,
  ProtectedPathInstallHealthProjectionSchema,
  ReceiptTimelineProjectionSchema,
} from "../protocol/evidence-projections/schemas";
import { cliOutput } from "./output";

export function evidenceContractViewCommand(value: unknown) {
  const projection = ContractEvidenceProjectionSchema.parse(value);
  return cliOutput({
    command: "evidence contract-view",
    plane: "evidence",
    custodyRole: "review_custody",
    nextAction: "read_evidence",
    redactionProfileRef: projection.redactionProfileRef,
    evidenceRefs: projection.evidenceRefs,
    result: projection,
  });
}

export function evidenceReceiptTimelineCommand(value: unknown) {
  const projection = ReceiptTimelineProjectionSchema.parse(value);
  return cliOutput({
    command: "evidence receipt-timeline",
    plane: "evidence",
    custodyRole: "review_custody",
    nextAction: "read_evidence",
    redactionProfileRef: projection.redactionProfileRef,
    proofGapRefs: projection.proofGapRefs,
    result: projection,
  });
}

export function installHealthProjectionCommand(value: unknown) {
  const projection = ProtectedPathInstallHealthProjectionSchema.parse(value);
  return cliOutput({
    command: "install health",
    plane: "evidence",
    custodyRole: "review_custody",
    reasonCodes: projection.reasonCodes,
    nextAction: projection.installHealthStatus === "satisfies_gateway_checked" ? "read_result" : "fix_install",
    retryability:
      projection.installHealthStatus === "satisfies_gateway_checked" ? "not_retryable" : "retryable_after_fix",
    redactionProfileRef: projection.redactionProfileRef,
    evidenceRefs: [projection.currentPostureRef].filter((ref): ref is string => ref !== null),
    result: projection,
  });
}
