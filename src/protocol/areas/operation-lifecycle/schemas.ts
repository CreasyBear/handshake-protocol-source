import { z } from "zod";
import {
  DigestSchema,
  IdSchema,
  IsoDateSchema,
  ProtocolBaseSchema,
  ReasonCodeSchema,
  ResourceRefSchema,
} from "../../foundation/schema-core";
import { MutationAttemptSchema } from "../gateway-gate/schemas";

export const ProtectedSurfaceOperationClaimStateSchema = z.enum([
  "active",
  "terminal_succeeded",
  "terminal_refused",
  "terminal_failed",
  "terminal_unknown",
  "isolated",
]);
export type ProtectedSurfaceOperationClaimState = z.infer<typeof ProtectedSurfaceOperationClaimStateSchema>;

export const DownstreamRetryabilitySchema = z.enum(["retryable", "non_retryable", "unknown"]);
export type DownstreamRetryability = z.infer<typeof DownstreamRetryabilitySchema>;
export const DownstreamDiagnosticsRedactionPostureSchema = z.enum(["redacted", "digest_only", "none", "unknown"]);
export type DownstreamDiagnosticsRedactionPosture = z.infer<typeof DownstreamDiagnosticsRedactionPostureSchema>;

export const ProtectedSurfaceOperationClaimSchema = ProtocolBaseSchema.extend({
  protectedSurfaceOperationClaimId: IdSchema,
  claimKeyDigest: DigestSchema,
  gatewayId: IdSchema,
  protectedSurfaceKind: z.string().min(1),
  actionClass: z.string().min(1),
  resourceRef: ResourceRefSchema,
  actionContractId: IdSchema,
  greenlightId: IdSchema,
  gateAttemptId: IdSchema,
  mutationAttemptId: IdSchema.nullable(),
  claimState: ProtectedSurfaceOperationClaimStateSchema,
  claimedAt: IsoDateSchema,
  terminalAt: IsoDateSchema.nullable(),
  terminalReasonCode: ReasonCodeSchema.nullable(),
  releasedByRef: z.string().min(1).nullable(),
  claimDigest: DigestSchema,
});
export type ProtectedSurfaceOperationClaim = z.infer<typeof ProtectedSurfaceOperationClaimSchema>;

export const SurfaceOperationReconciliationSchema = ProtocolBaseSchema.extend({
  reconciliationId: IdSchema,
  mutationAttemptId: IdSchema,
  gateAttemptId: IdSchema,
  actionContractId: IdSchema,
  greenlightId: IdSchema,
  gatewayId: IdSchema,
  idempotencyKey: IdSchema,
  surfaceOperationRef: z.string().min(1).nullable(),
  previousMutationOutcome: MutationAttemptSchema.shape.outcome,
  observedDownstreamStatus: z.enum(["pending", "succeeded", "refused", "failed", "unknown"]),
  downstreamRetryability: DownstreamRetryabilitySchema.default("unknown"),
  providerRequestRef: z.string().min(1).nullable().default(null),
  providerOperationRef: z.string().min(1).nullable().default(null),
  redactedDiagnosticsDigest: DigestSchema.nullable().default(null),
  traceRef: z.string().min(1).nullable().default(null),
  spanRef: z.string().min(1).nullable().default(null),
  diagnosticsRedactionPosture: DownstreamDiagnosticsRedactionPostureSchema.default("unknown"),
  observedAt: IsoDateSchema,
  evidenceRefs: z.array(z.string()).default([]),
  resolvedProofGapIds: z.array(IdSchema).default([]),
  reconciliationStatus: z.enum(["pending", "resolved", "still_unknown", "failed"]),
  finalityStatus: z.enum(["final", "pending", "suspect", "unknown"]),
});
export type SurfaceOperationReconciliation = z.infer<typeof SurfaceOperationReconciliationSchema>;
