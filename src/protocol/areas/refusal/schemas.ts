import { z } from "zod";
import { IdSchema, IsoDateSchema, ProtocolBaseSchema, ReasonCodeSchema } from "../../foundation/schema-core";

export const RefusalPhaseSchema = z.enum([
  "compilation",
  "policy",
  "gateway",
  "receipt_export",
  "recovery",
  "review",
  "transition",
]);
export type RefusalPhase = z.infer<typeof RefusalPhaseSchema>;

export const RefusalSchema = ProtocolBaseSchema.extend({
  refusalId: IdSchema,
  phase: RefusalPhaseSchema,
  actionContractId: IdSchema.nullable(),
  policyDecisionId: IdSchema.nullable(),
  greenlightId: IdSchema.nullable(),
  gateAttemptId: IdSchema.nullable(),
  refusedObjectRef: z.string().min(1).nullable(),
  reasonCode: ReasonCodeSchema,
  reason: z.string().min(1).max(1000),
  mutationAttempted: z.literal(false),
  authorityCreated: z.literal(false),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  refusedAt: IsoDateSchema,
});
export type Refusal = z.infer<typeof RefusalSchema>;
