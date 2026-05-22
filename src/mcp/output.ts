import { z } from "zod";
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
  content: z.array(
    z.strictObject({
      type: z.literal("text"),
      text: z.string(),
    }),
  ),
  isError: z.boolean().default(false),
});

export type McpToolResult = z.infer<typeof McpToolResultSchema>;

export function mcpToolResult(structuredContent: SurfaceOutcome, isError = false): McpToolResult {
  return McpToolResultSchema.parse({
    structuredContent,
    isError,
    content: [{ type: "text", text: JSON.stringify(structuredContent) }],
  });
}

export function mcpNonContractOutcome(
  input: SurfaceOutcomeBaseInput,
  isError = input.outcome !== "tools_list_changed",
) {
  return mcpToolResult(surfaceOutcomeBase(input), isError);
}

export function mcpActionContractProposedOutcome(
  input: Omit<z.input<typeof ActionContractProposedOutcomeSchema>, "schemaVersion">,
): SurfaceOutcome {
  return ActionContractProposedOutcomeSchema.parse({
    schemaVersion: MCP_SCHEMA_VERSION,
    ...input,
  });
}
