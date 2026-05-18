import { z } from "zod";
import { DigestSchema, IdSchema, IsoDateSchema, ProtocolBaseSchema, ReasonCodeSchema, ResourceRefSchema } from "../schema-core";
import { ProtectedPathStateSchema } from "../protected-path-posture/schemas";

export const GateDecisionSchema = z.enum(["passed", "refused", "proof_gap"]);
export type GateDecision = z.infer<typeof GateDecisionSchema>;

export const GatewayCheckAttemptSchema = ProtocolBaseSchema.extend({
  gateAttemptId: IdSchema,
  gatewayId: IdSchema,
  gatewayPolicyContractId: IdSchema,
  gatewayPolicyVersion: z.string().min(1),
  pinnedGatewayPolicyVersion: z.string().min(1),
  currentGatewayPolicyVersion: z.string().min(1).nullable(),
  gatewayPolicyDriftStatus: z.enum(["same_version", "compatible_stricter", "incompatible", "unknown"]),
  actionContractId: IdSchema,
  greenlightId: IdSchema,
  contractDigestSeen: DigestSchema,
  greenlightDigestSeen: DigestSchema,
  paramsDigestSeen: DigestSchema,
  idempotencyKeySeen: IdSchema,
  isolationSnapshotRef: z.string().min(1),
  protectedPathPostureIdSeen: IdSchema.nullable(),
  protectedPathPostureDigestSeen: DigestSchema.nullable(),
  protectedPathPostureStateSeen: ProtectedPathStateSchema.nullable(),
  gateDecision: GateDecisionSchema,
  gateDecisionReasonCode: ReasonCodeSchema,
  consumedGreenlight: z.boolean(),
  mutationAttemptId: IdSchema.nullable(),
});
export type GatewayCheckAttempt = z.infer<typeof GatewayCheckAttemptSchema>;

export const MutationAttemptSchema = ProtocolBaseSchema.extend({
  mutationAttemptId: IdSchema,
  gateAttemptId: IdSchema,
  actionContractId: IdSchema,
  greenlightId: IdSchema,
  gatewayId: IdSchema,
  actionClass: z.string().min(1),
  resourceRef: ResourceRefSchema,
  idempotencyKey: IdSchema,
  outcome: z.enum(["not_attempted", "submitted", "succeeded", "downstream_refused", "failed", "unknown"]),
  outcomeReasonCode: ReasonCodeSchema,
  surfaceOperationRef: z.string().min(1).nullable(),
  startedAt: IsoDateSchema,
  finishedAt: IsoDateSchema.nullable(),
});
export type MutationAttempt = z.infer<typeof MutationAttemptSchema>;
