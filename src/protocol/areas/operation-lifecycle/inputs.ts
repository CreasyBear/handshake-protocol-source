import { z } from "zod";

export const ReconcileSurfaceOperationInputSchema = z.strictObject({
  mutationAttemptId: z.string().min(1),
  idempotencyKey: z.string().min(1),
  observedDownstreamStatus: z.enum(["pending", "succeeded", "refused", "failed", "unknown"]),
  observedSurfaceOperationRef: z.string().min(1).nullable().default(null),
  evidenceRefs: z.array(z.string()).default([]),
  resolvedProofGapIds: z.array(z.string().min(1)).default([]),
  orphanIsolationRequested: z.boolean().default(false),
});
export type ReconcileSurfaceOperationInput = z.input<typeof ReconcileSurfaceOperationInputSchema>;
