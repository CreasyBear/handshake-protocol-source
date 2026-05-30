import type { z } from "zod";
import { DelegationEvidenceRecordSchema } from "../../../integrations/a1-evidence/delegation-evidence-record.js";
import { IdSchema, ProtocolBaseSchema } from "../../foundation/schema-core";

export const StoredDelegationEvidenceRecordSchema = ProtocolBaseSchema.extend({
  delegationEvidenceRecordId: IdSchema,
  evidenceRecord: DelegationEvidenceRecordSchema,
});
export type StoredDelegationEvidenceRecord = z.infer<typeof StoredDelegationEvidenceRecordSchema>;
