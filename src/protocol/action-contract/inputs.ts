import { z } from "zod";
import { DigestSchema } from "../schema-core";

export const ProposeActionContractInputSchema = z.strictObject({
  intentCompilationId: z.string().min(1),
  candidateActionId: z.string().min(1),
  candidateDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  signingSecret: z.string().min(1).optional(),
});
export type ProposeActionContractInput = z.input<typeof ProposeActionContractInputSchema>;
