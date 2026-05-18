import { z } from "zod";

export const EvaluatePolicyInputSchema = z.strictObject({
  actionContractId: z.string().min(1),
  envelopeId: z.string().min(1),
  policyEvaluatorVersion: z.string().min(1).default("handshake-policy-0.2"),
  signingSecret: z.string().min(1).optional(),
  reviewDecisionId: z.string().min(1).optional(),
});
export type EvaluatePolicyInput = z.input<typeof EvaluatePolicyInputSchema>;
