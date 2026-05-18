import { z } from "zod";
import { DigestSchema } from "../schema-core";
import { RuntimeAccessPostureSchema, RuntimeExecutionShapeSchema, RuntimePostureSchema } from "./schemas";

export const CreateRuntimeExecutionInputSchema = z.strictObject({
  tenantId: z.string().min(1),
  organizationId: z.string().min(1),
  principalIntentRef: z.string().min(1),
  principalId: z.string().min(1),
  agentId: z.string().min(1),
  runId: z.string().min(1),
  runtimeAdapterId: z.string().min(1),
  executionShape: RuntimeExecutionShapeSchema,
  runtimePosture: RuntimePostureSchema,
  executionBlockRef: z.string().min(1),
  executionBlockDigest: DigestSchema,
  generatedCodeOrSpecRefs: z.array(z.string().min(1)).default([]),
  allowedToolCapabilityIds: z.array(z.string().min(1)).default([]),
  observedToolCallRefs: z.array(z.string().min(1)).default([]),
  observedConsequentialCallCount: z.number().int().nonnegative().default(0),
  loopDetected: z.boolean().default(false),
  retryDetected: z.boolean().default(false),
  branchDetected: z.boolean().default(false),
  dynamicToolConstructionDetected: z.boolean().default(false),
  unobservedRegionRefs: z.array(z.string().min(1)).default([]),
  accessPosture: RuntimeAccessPostureSchema,
  uncertaintyMarkers: z.array(z.string().min(1)).default([]),
  refusalReasonCodes: z.array(z.string().min(2)).default([]),
  evidenceRefs: z.array(z.string().min(1)).default([]),
});
export type CreateRuntimeExecutionInput = z.input<typeof CreateRuntimeExecutionInputSchema>;
