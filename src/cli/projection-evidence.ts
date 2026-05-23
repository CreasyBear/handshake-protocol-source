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
    result: projection,
  });
}

export function evidenceReceiptTimelineCommand(value: unknown) {
  const projection = ReceiptTimelineProjectionSchema.parse(value);
  return cliOutput({
    command: "evidence receipt-timeline",
    plane: "evidence",
    custodyRole: "review_custody",
    result: projection,
  });
}

export function installHealthProjectionCommand(value: unknown) {
  const projection = ProtectedPathInstallHealthProjectionSchema.parse(value);
  return cliOutput({
    command: "install health",
    plane: "evidence",
    custodyRole: "review_custody",
    result: projection,
  });
}
