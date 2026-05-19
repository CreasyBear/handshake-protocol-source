import { z } from "zod";
import { DigestSchema, IdSchema, ProtocolBaseSchema, ReasonCodeSchema } from "../../foundation/schema-core";

export const RuntimeExecutionShapeSchema = z.enum([
  "single_tool_call",
  "generated_mcp_tool_chain",
  "codemode_block",
  "shell_exec_block",
  "browser_action",
  "scheduled_job",
  "gateway_only",
  "unknown",
]);
export type RuntimeExecutionShape = z.infer<typeof RuntimeExecutionShapeSchema>;

export const RuntimePostureSchema = z.enum([
  "prompt_guidance",
  "hook_assisted",
  "protected_capability",
  "bounded_generation",
  "gateway_enforced_only",
  "hosted_control_plane",
  "unknown",
]);
export type RuntimePosture = z.infer<typeof RuntimePostureSchema>;

export const RuntimeAccessPostureSchema = z.enum([
  "isolated",
  "controlled_outbound",
  "filesystem_available",
  "network_available",
  "secrets_available",
  "unknown",
]);
export type RuntimeAccessPosture = z.infer<typeof RuntimeAccessPostureSchema>;

export const RuntimeExecutionRecordSchema = ProtocolBaseSchema.extend({
  runtimeExecutionId: IdSchema,
  principalIntentRef: z.string().min(1),
  principalId: IdSchema,
  agentId: IdSchema,
  runId: IdSchema,
  runtimeAdapterId: IdSchema,
  executionShape: RuntimeExecutionShapeSchema,
  runtimePosture: RuntimePostureSchema,
  executionBlockRef: z.string().min(1),
  executionBlockDigest: DigestSchema,
  generatedCodeOrSpecRefs: z.array(z.string()).default([]),
  allowedToolCapabilityIds: z.array(IdSchema).default([]),
  observedToolCallRefs: z.array(z.string().min(1)).default([]),
  observedConsequentialCallCount: z.number().int().nonnegative(),
  loopDetected: z.boolean(),
  retryDetected: z.boolean(),
  branchDetected: z.boolean(),
  dynamicToolConstructionDetected: z.boolean(),
  unobservedRegionRefs: z.array(z.string().min(1)).default([]),
  accessPosture: RuntimeAccessPostureSchema,
  uncertaintyMarkers: z.array(z.string().min(1)).default([]),
  refusalReasonCodes: z.array(ReasonCodeSchema).default([]),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  runtimeExecutionDigest: DigestSchema,
});
export type RuntimeExecutionRecord = z.infer<typeof RuntimeExecutionRecordSchema>;
