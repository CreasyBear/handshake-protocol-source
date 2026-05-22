import { z } from "zod";
import {
  DigestSchema,
  IdSchema,
  IsoDateSchema,
  JsonValueSchema,
  ProtocolBaseSchema,
  ReasonCodeSchema,
  ResourceRefSchema,
} from "../../foundation/schema-core";
import { GatewayCredentialBindingSchema } from "../credential-custody/schemas";

export const ToolCallDraftStateSchema = z.enum(["opened", "streaming", "finalized", "invalid", "abandoned"]);
export type ToolCallDraftState = z.infer<typeof ToolCallDraftStateSchema>;

export const ToolCallDraftSchema = ProtocolBaseSchema.extend({
  toolCallDraftId: IdSchema,
  runtimeExecutionId: IdSchema.nullable().default(null),
  generatedExecutionGraphId: IdSchema.nullable().default(null),
  generatedExecutionNodeId: IdSchema.nullable().default(null),
  toolCapabilityId: IdSchema,
  actionTypeId: IdSchema,
  gatewayRegistryEntryId: IdSchema,
  actionClass: z.string().min(1),
  gatewayId: IdSchema,
  resourceRef: ResourceRefSchema,
  draftState: ToolCallDraftStateSchema,
  parameters: z.record(z.string(), JsonValueSchema),
  nonSecretParamsSummary: z.record(z.string(), JsonValueSchema),
  secretRefs: z.record(z.string(), z.string().min(1)).default({}),
  gatewayCredentialRefs: z.array(GatewayCredentialBindingSchema).default([]),
  paramsDigest: DigestSchema,
  finalizedAt: IsoDateSchema.nullable().default(null),
  expiresAt: IsoDateSchema,
  invalidReasonCodes: z.array(ReasonCodeSchema).default([]),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  draftDigest: DigestSchema,
});
export type ToolCallDraft = z.infer<typeof ToolCallDraftSchema>;
