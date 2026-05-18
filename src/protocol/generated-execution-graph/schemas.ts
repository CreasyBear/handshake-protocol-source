import { z } from "zod";
import {
  DigestSchema,
  IdSchema,
  IsoDateSchema,
  ProtocolBaseSchema,
  ReasonCodeSchema,
  ResourceRefSchema,
} from "../schema-core";

export const GeneratedExecutionCoverageStatusSchema = z.enum([
  "fully_covered_no_unsupported_nodes",
  "nonconsequential_only",
  "contains_refusal",
  "contains_coverage_gap",
  "contains_bypass_risk",
  "unsupported_or_ambiguous",
  "unknown",
]);
export type GeneratedExecutionCoverageStatus = z.infer<typeof GeneratedExecutionCoverageStatusSchema>;

export const GeneratedExecutionNodeKindSchema = z.enum([
  "shell_command",
  "codemode_action",
  "observer_event",
  "hidden_trigger",
  "unknown",
]);
export type GeneratedExecutionNodeKind = z.infer<typeof GeneratedExecutionNodeKindSchema>;

export const GeneratedExecutionNodeClassificationSchema = z.enum([
  "candidate_action_eligible",
  "read_only",
  "nonconsequential",
  "unsupported",
  "ambiguous",
  "bypass_risk",
  "hidden_trigger",
  "observer_only",
]);
export type GeneratedExecutionNodeClassification = z.infer<typeof GeneratedExecutionNodeClassificationSchema>;

export const GraphIssuerAuthoritySchema = z.enum([
  "host_runtime_adapter",
  "kernel_fixture",
  "conformance_fixture",
]);
export type GraphIssuerAuthority = z.infer<typeof GraphIssuerAuthoritySchema>;

export const GraphTruncationStatusSchema = z.enum(["complete", "truncated", "over_limit", "unknown"]);
export type GraphTruncationStatus = z.infer<typeof GraphTruncationStatusSchema>;

export const GraphRedactionStatusSchema = z.enum([
  "redacted",
  "digest_only",
  "secret_refs_only",
  "raw_material_present",
  "unknown",
]);
export type GraphRedactionStatus = z.infer<typeof GraphRedactionStatusSchema>;

export const CommandRiskClassifierPostureSchema = z.enum([
  "absent",
  "advisory_allow",
  "advisory_no_match",
  "deny",
  "warn",
  "fail_open",
  "allowlist",
  "allow_once",
  "bypass_detected",
  "skipped",
  "unknown",
]);
export type CommandRiskClassifierPosture = z.infer<typeof CommandRiskClassifierPostureSchema>;

export const GeneratedExecutionGraphEdgeSchema = z.strictObject({
  fromNodeId: IdSchema,
  toNodeId: IdSchema,
  edgeKind: z.enum(["sequence", "branch", "retry", "callback", "watcher", "unknown"]),
});
export type GeneratedExecutionGraphEdge = z.infer<typeof GeneratedExecutionGraphEdgeSchema>;

export const GeneratedExecutionNodeSchema = z.strictObject({
  nodeId: IdSchema,
  nodeKind: GeneratedExecutionNodeKindSchema,
  classification: GeneratedExecutionNodeClassificationSchema,
  actionClass: z.string().min(1).nullable().default(null),
  toolCapabilityId: IdSchema.nullable().default(null),
  actionTypeId: IdSchema.nullable().default(null),
  gatewayRegistryEntryId: IdSchema.nullable().default(null),
  resourceRef: ResourceRefSchema.nullable().default(null),
  paramsDigest: DigestSchema.nullable().default(null),
  nodeDigest: DigestSchema,
  nodeGatewayBindingDigest: DigestSchema.nullable().default(null),
  sourceSpanDigest: DigestSchema.nullable().default(null),
  redactedArgvSummary: z.array(z.string()).default([]),
  argvDigest: DigestSchema.nullable().default(null),
  argvRedactionStatus: GraphRedactionStatusSchema,
  stdinDigest: DigestSchema.nullable().default(null),
  stdinRedactionStatus: GraphRedactionStatusSchema,
  envAllowlistDigest: DigestSchema.nullable().default(null),
  rawSecretMaterialDetected: z.boolean().default(false),
  commandRiskClassifierRefs: z.array(z.string().min(1)).default([]),
  commandRiskClassifierPosture: CommandRiskClassifierPostureSchema.default("absent"),
  commandRiskRuleRefs: z.array(z.string().min(1)).default([]),
  commandRiskBypassRefs: z.array(z.string().min(1)).default([]),
  unsupportedReasonCodes: z.array(ReasonCodeSchema).default([]),
});
export type GeneratedExecutionNode = z.infer<typeof GeneratedExecutionNodeSchema>;

export const GeneratedExecutionNodeInputSchema = GeneratedExecutionNodeSchema.omit({
  nodeDigest: true,
});
export type GeneratedExecutionNodeInput = z.input<typeof GeneratedExecutionNodeInputSchema>;

export const GeneratedExecutionGraphSchema = ProtocolBaseSchema.extend({
  generatedExecutionGraphId: IdSchema,
  runtimeExecutionId: IdSchema,
  runtimeExecutionDigest: DigestSchema,
  executionBlockDigest: DigestSchema,
  graphIssuerRef: z.string().min(1),
  graphIssuerAuthority: GraphIssuerAuthoritySchema,
  graphIssuedAt: IsoDateSchema,
  graphNonce: z.string().min(8),
  graphInputDigest: DigestSchema,
  graphSchemaVersion: z.string().min(1),
  parserVersion: z.string().min(1),
  supportedGrammarVersion: z.string().min(1),
  coverageValidatorVersion: z.string().min(1),
  graphDigest: DigestSchema,
  coverageStatus: GeneratedExecutionCoverageStatusSchema,
  terminalReasonCodes: z.array(ReasonCodeSchema).default([]),
  entryNodeIds: z.array(IdSchema).default([]),
  edges: z.array(GeneratedExecutionGraphEdgeSchema).default([]),
  nodeCount: z.number().int().nonnegative(),
  edgeCount: z.number().int().nonnegative(),
  maxNodeCount: z.number().int().positive(),
  maxEdgeCount: z.number().int().nonnegative(),
  maxDepth: z.number().int().positive(),
  graphByteSize: z.number().int().nonnegative(),
  maxGraphByteSize: z.number().int().positive(),
  truncationStatus: GraphTruncationStatusSchema,
  catalogSnapshotDigest: DigestSchema,
  gatewayRegistrySnapshotDigest: DigestSchema,
  registryBindingSetDigest: DigestSchema,
  nodes: z.array(GeneratedExecutionNodeSchema).default([]),
});
export type GeneratedExecutionGraph = z.infer<typeof GeneratedExecutionGraphSchema>;
