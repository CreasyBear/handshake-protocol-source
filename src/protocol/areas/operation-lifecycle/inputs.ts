import { z } from "zod";

export const ReconcileSurfaceOperationInputSchema = z.strictObject({
  mutationAttemptId: z.string().min(1),
  idempotencyKey: z.string().min(1),
  observedDownstreamStatus: z.enum(["pending", "succeeded", "refused", "failed", "unknown"]),
  downstreamRetryability: z.enum(["retryable", "non_retryable", "unknown"]).default("unknown"),
  observedSurfaceOperationRef: z.string().min(1).nullable().default(null),
  providerRequestRef: z.string().min(1).nullable().default(null),
  providerOperationRef: z.string().min(1).nullable().default(null),
  redactedDiagnosticsDigest: z
    .string()
    .regex(/^sha256:[a-f0-9]{64}$/)
    .nullable()
    .default(null),
  traceRef: z.string().min(1).nullable().default(null),
  spanRef: z.string().min(1).nullable().default(null),
  diagnosticsRedactionPosture: z.enum(["redacted", "digest_only", "none", "unknown"]).default("unknown"),
  evidenceRefs: z.array(z.string()).default([]),
  resolvedProofGapIds: z.array(z.string().min(1)).default([]),
  orphanIsolationRequested: z.boolean().default(false),
});
export type ReconcileSurfaceOperationInput = z.input<typeof ReconcileSurfaceOperationInputSchema>;
