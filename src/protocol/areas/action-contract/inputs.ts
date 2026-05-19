import { z } from "zod";
import { DigestSchema } from "../../foundation/schema-core";

export const ProposeActionContractInputSchema = z.strictObject({
  intentCompilationId: z.string().min(1),
  candidateActionId: z.string().min(1),
  candidateDigest: DigestSchema,
  signingSecret: z.string().min(1).optional(),
});
export type ProposeActionContractInput = z.input<typeof ProposeActionContractInputSchema>;
