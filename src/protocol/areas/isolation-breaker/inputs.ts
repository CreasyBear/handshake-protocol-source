import { z } from "zod";
import { BreakerIsolationDecisionSchema, IsolationStateSchema, StreamWatermarkSchema } from "./schemas";

export const CreateIsolationInputSchema = z.strictObject({
  tenantId: z.string().min(1),
  organizationId: z.string().min(1),
  scopeType: IsolationStateSchema.shape.scopeType,
  scopeId: z.string().min(1),
  state: IsolationStateSchema.shape.state,
  reasonCode: z.string().min(2),
  reasonSummary: z.string().min(1),
  sourceDecisionRef: z.string().min(1),
  observedStreamOffsets: z.array(StreamWatermarkSchema).default([]),
  expiresAt: z.string().datetime({ offset: true }).nullable().default(null),
});
export type CreateIsolationInput = z.input<typeof CreateIsolationInputSchema>;

export const CreateBreakerDecisionInputSchema = z.strictObject({
  tenantId: z.string().min(1),
  organizationId: z.string().min(1),
  listenerId: z.string().min(1),
  listenerVersion: z.string().min(1),
  rulePackRef: z.string().min(1),
  rulePackVersion: z.string().min(1),
  observedStreamOffsets: z.array(StreamWatermarkSchema).min(1),
  decision: BreakerIsolationDecisionSchema,
  decisionReasonCode: z.string().min(2),
  decisionReason: z.string().min(1),
  targetScopeType: IsolationStateSchema.shape.scopeType,
  targetScopeId: z.string().min(1),
  agentId: z.string().min(1).nullable().default(null),
  runId: z.string().min(1).nullable().default(null),
  gatewayId: z.string().min(1).nullable().default(null),
  resourceRef: z.string().min(1).nullable().default(null),
  actionClass: z.string().min(1).nullable().default(null),
  matchedBreakerRuleIds: z.array(z.string().min(1)).default([]),
  supportingEventRefs: z.array(z.string().min(1)).default([]),
  missingEventRefs: z.array(z.string().min(1)).default([]),
  proofGapRefs: z.array(z.string().min(1)).default([]),
  decisionExpiresAt: z.string().datetime({ offset: true }).nullable().default(null),
});
export type CreateBreakerDecisionInput = z.input<typeof CreateBreakerDecisionInputSchema>;
