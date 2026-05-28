import { z } from "zod";
import {
  classifyFailureClassFromReasonCodes,
  FailureClassSchema,
  type FailureClass,
} from "../protocol/foundation/failure-class";
import {
  ActionContractProposedOutcomeSchema,
  SurfaceOutcomeSchema,
  surfaceOutcomeBase,
  surfaceOutcomeSchemaVersion,
  type SurfaceOutcome,
  type SurfaceOutcomeBaseInput,
} from "../surfaces/outcome";

export const MCP_SCHEMA_VERSION = surfaceOutcomeSchemaVersion;

export const McpStructuredContentSchema = SurfaceOutcomeSchema;

export const McpToolResultSchema = z.strictObject({
  structuredContent: McpStructuredContentSchema,
  failureClass: FailureClassSchema.nullable().optional(),
  content: z.array(
    z.strictObject({
      type: z.literal("text"),
      text: z.string(),
    }),
  ),
  isError: z.boolean().default(false),
});

export type McpToolResult = z.infer<typeof McpToolResultSchema>;

export function mcpToolResult(
  structuredContent: SurfaceOutcome,
  isError = false,
  failureClass?: FailureClass | null,
): McpToolResult {
  return McpToolResultSchema.parse({
    structuredContent,
    ...(failureClass !== undefined ? { failureClass } : {}),
    isError,
    content: [{ type: "text", text: JSON.stringify(structuredContent) }],
  });
}

export function mcpNonContractOutcome(
  input: SurfaceOutcomeBaseInput,
  isError = input.outcome !== "tools_list_changed",
) {
  const reasonCodes = input.reasonCodes ?? [];
  const failureClass = classifyFailureClassFromReasonCodes(reasonCodes);
  return mcpToolResult(surfaceOutcomeBase(input), isError, failureClass);
}

export function mcpActionContractProposedOutcome(
  input: Omit<z.input<typeof ActionContractProposedOutcomeSchema>, "schemaVersion">,
): SurfaceOutcome {
  return ActionContractProposedOutcomeSchema.parse({
    schemaVersion: MCP_SCHEMA_VERSION,
    ...input,
  });
}
