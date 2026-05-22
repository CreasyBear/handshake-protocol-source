import { z } from "zod";
import {
  DigestSchema,
  IdSchema,
  IsoDateSchema,
  ProtocolBaseSchema,
  ReasonCodeSchema,
  ResourceRefSchema,
} from "../../foundation/schema-core";

export const StreamWatermarkSchema = z
  .strictObject({
    streamId: IdSchema,
    partitionKey: z.string().min(1),
    observedOffsetStart: z.number().int().nonnegative(),
    observedOffsetEnd: z.number().int().nonnegative(),
    observedEventDigest: DigestSchema.nullable(),
  })
  .refine((watermark) => watermark.observedOffsetStart <= watermark.observedOffsetEnd, {
    message: "observedOffsetEnd must be greater than or equal to observedOffsetStart",
    path: ["observedOffsetEnd"],
  });
export type StreamWatermark = z.infer<typeof StreamWatermarkSchema>;

export const BreakerIsolationDecisionSchema = z.enum([
  "review_only",
  "rate_limited",
  "quarantined",
  "halted",
  "revoked",
  "state_suspect",
]);
export type BreakerIsolationDecision = z.infer<typeof BreakerIsolationDecisionSchema>;

export const BreakerDecisionSchema = ProtocolBaseSchema.extend({
  breakerDecisionId: IdSchema,
  listenerId: IdSchema,
  listenerVersion: z.string().min(1),
  rulePackRef: z.string().min(1),
  rulePackVersion: z.string().min(1),
  observedStreamOffsets: z.array(StreamWatermarkSchema).min(1),
  observedWindowDigest: DigestSchema,
  decision: BreakerIsolationDecisionSchema,
  decisionReasonCode: ReasonCodeSchema,
  decisionReason: z.string().min(1).max(1000),
  targetScopeType: z.enum([
    "tenant",
    "organization",
    "agent",
    "run",
    "envelope",
    "action_class",
    "gateway",
    "credential_ref",
    "resource",
  ]),
  targetScopeId: IdSchema,
  createdIsolationStateId: IdSchema,
  agentId: IdSchema.nullable(),
  runId: IdSchema.nullable(),
  gatewayId: IdSchema.nullable(),
  resourceRef: ResourceRefSchema.nullable(),
  actionClass: z.string().min(1).nullable(),
  sequenceRiskScore: z.number().min(0).max(1),
  matchedBreakerRuleIds: z.array(z.string().min(1)).default([]),
  supportingEventRefs: z.array(IdSchema).default([]),
  missingEventRefs: z.array(z.string().min(1)).default([]),
  proofGapRefs: z.array(IdSchema).default([]),
  decisionEffectiveAt: IsoDateSchema,
  decisionExpiresAt: IsoDateSchema.nullable(),
  watermarkAtDecision: IsoDateSchema,
});
export type BreakerDecision = z.infer<typeof BreakerDecisionSchema>;

export const IsolationStateSchema = ProtocolBaseSchema.extend({
  isolationStateId: IdSchema,
  scopeType: z.enum([
    "tenant",
    "organization",
    "agent",
    "run",
    "envelope",
    "action_class",
    "gateway",
    "credential_ref",
    "resource",
  ]),
  scopeId: IdSchema,
  state: z.enum(["active", "review_only", "rate_limited", "quarantined", "halted", "revoked", "state_suspect"]),
  reasonCode: ReasonCodeSchema,
  reasonSummary: z.string().min(1).max(1000),
  sourceDecisionRef: z.string().min(1),
  effectiveAt: IsoDateSchema,
  expiresAt: IsoDateSchema.nullable(),
  clearedAt: IsoDateSchema.nullable(),
  observedStreamOffsets: z.array(StreamWatermarkSchema).default([]),
  version: z.number().int().nonnegative(),
});
export type IsolationState = z.infer<typeof IsolationStateSchema>;
