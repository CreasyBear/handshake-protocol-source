import { z } from "zod";
import { IdSchema, IsoDateSchema, ProtocolBaseSchema, ReasonCodeSchema } from "../../foundation/schema-core";

export const ProofGapSchema = ProtocolBaseSchema.extend({
  proofGapId: IdSchema,
  gapPhase: z.enum(["compilation", "policy", "gate", "mutation", "receipt", "stream", "recovery"]),
  expectedEvidenceType: z.string().min(1),
  missingOrInvalidEvidenceRef: z.string().min(1),
  affectedObjectRefs: z.array(z.string().min(1)),
  gateAttemptId: IdSchema.nullable(),
  mutationAttemptId: IdSchema.nullable(),
  receiptId: IdSchema.nullable(),
  reasonCode: ReasonCodeSchema,
  finalityImpact: z.enum(["none", "suspect", "unknown", "invalid"]),
  recoveryRequirement: z.string().min(1),
  resolvedAt: IsoDateSchema.nullable(),
  resolvedByRef: z.string().min(1).nullable(),
});
export type ProofGap = z.infer<typeof ProofGapSchema>;
