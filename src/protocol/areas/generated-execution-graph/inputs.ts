import { z } from "zod";
import { DigestSchema } from "../../foundation/schema-core";
import {
  GeneratedExecutionGraphEdgeSchema,
  GeneratedExecutionNodeInputSchema,
  GraphIssuerAuthoritySchema,
  GraphTruncationStatusSchema,
} from "./schemas";

export const GraphEvidenceIssuerContextSchema = z.strictObject({
  tenantId: z.string().min(1),
  organizationId: z.string().min(1),
  principalIntentRef: z.string().min(1),
  principalId: z.string().min(1),
  agentId: z.string().min(1),
  runId: z.string().min(1),
  runtimeAdapterId: z.string().min(1),
  graphIssuerRef: z.string().min(1),
  graphIssuerAuthority: GraphIssuerAuthoritySchema,
  graphIssuedAt: z.string().datetime({ offset: true }),
});
export type GraphEvidenceIssuerContext = z.input<typeof GraphEvidenceIssuerContextSchema>;

export const CreateGeneratedExecutionGraphInputSchema = z.strictObject({
  runtimeExecutionId: z.string().min(1),
  graphNonce: z.string().min(8),
  graphSchemaVersion: z.string().min(1).default("generated-execution-graph-0.2.4"),
  parserVersion: z.string().min(1),
  supportedGrammarVersion: z.string().min(1),
  coverageValidatorVersion: z.string().min(1).default("handshake-generated-coverage-0.2.4"),
  entryNodeIds: z.array(z.string().min(1)).default([]),
  edges: z.array(GeneratedExecutionGraphEdgeSchema).default([]),
  maxNodeCount: z.number().int().positive().default(64),
  maxEdgeCount: z.number().int().nonnegative().default(128),
  maxDepth: z.number().int().positive().default(16),
  maxGraphByteSize: z.number().int().positive().default(65536),
  truncationStatus: GraphTruncationStatusSchema.default("complete"),
  catalogSnapshotDigest: DigestSchema,
  gatewayRegistrySnapshotDigest: DigestSchema,
  registryBindingSetDigest: DigestSchema,
  nodes: z.array(GeneratedExecutionNodeInputSchema).default([]),
});
export type CreateGeneratedExecutionGraphInput = z.input<typeof CreateGeneratedExecutionGraphInputSchema>;
