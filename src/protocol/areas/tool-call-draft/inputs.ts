import { z } from "zod";
import { JsonValueSchema } from "../../foundation/schema-core";

export const CreateToolCallDraftInputSchema = z.strictObject({
  tenantId: z.string().min(1),
  organizationId: z.string().min(1),
  runtimeExecutionId: z.string().min(1).nullable().default(null),
  generatedExecutionGraphId: z.string().min(1).nullable().default(null),
  generatedExecutionNodeId: z.string().min(1).nullable().default(null),
  toolCapabilityId: z.string().min(1),
  actionTypeId: z.string().min(1),
  gatewayRegistryEntryId: z.string().min(1),
  actionClass: z.string().min(1),
  gatewayId: z.string().min(1),
  resourceRef: z.string().min(1),
  draftState: z.literal("opened").default("opened"),
  parameters: z.record(z.string(), JsonValueSchema).default({}),
  nonSecretParamsSummary: z.record(z.string(), JsonValueSchema).default({}),
  secretRefs: z.record(z.string(), z.string().min(1)).default({}),
  expiresAt: z.string().datetime({ offset: true }),
  invalidReasonCodes: z.array(z.string().min(2)).default([]),
  evidenceRefs: z.array(z.string().min(1)).default([]),
});
export type CreateToolCallDraftInput = z.input<typeof CreateToolCallDraftInputSchema>;

export const TransitionToolCallDraftInputSchema = z.strictObject({
  toolCallDraftId: z.string().min(1),
  nextDraftState: z.enum(["streaming", "finalized", "invalid", "abandoned"]),
  parameters: z.record(z.string(), JsonValueSchema).optional(),
  nonSecretParamsSummary: z.record(z.string(), JsonValueSchema).optional(),
  secretRefs: z.record(z.string(), z.string().min(1)).optional(),
  finalizedAt: z.string().datetime({ offset: true }).nullable().optional(),
  expiresAt: z.string().datetime({ offset: true }).optional(),
  invalidReasonCodes: z.array(z.string().min(2)).optional(),
  evidenceRefs: z.array(z.string().min(1)).optional(),
});
export type TransitionToolCallDraftInput = z.input<typeof TransitionToolCallDraftInputSchema>;
