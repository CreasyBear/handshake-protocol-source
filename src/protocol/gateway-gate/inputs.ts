import { z } from "zod";
import { JsonValueSchema } from "../schema-core";

export const GatewayCheckInputSchema = z.strictObject({
  actionContractId: z.string().min(1),
  greenlightId: z.string().min(1),
  observedParameters: z.record(z.string(), JsonValueSchema),
  surfaceOperationRef: z.string().min(1).optional(),
});
export type GatewayCheckInput = z.input<typeof GatewayCheckInputSchema>;
