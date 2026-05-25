import { z } from "zod";
import {
  deriveHostBypassProofPacket,
  HostBypassHarnessReportSchema,
  HostBypassProofPacketSchema,
  HostFixtureManifestSchema,
  HostGatewayBindingStatusSchema,
  HostRawSiblingProbeResultSchema,
  projectHostBypassHarnessReport,
  requiredHostHarnessNonClaims,
  type HostBypassHarnessReport,
  type HostBypassProofPacket,
  type HostFixtureManifest,
  type HostRawSiblingProbeResult,
} from "../../protected-path-probes";
import { DigestSchema } from "../../../protocol/foundation/schema-core";
import { buildProtectedX402ToolHostProfile, ProtectedX402ToolHostProfileInputSchema } from "./index";
import { X402_PROTECTED_TOOL_NAME } from "../protected-tool-facade";

const ClaudeCodeActivationRefSchema = z.string().min(1).max(500);
const ClaudeCodeActivationIdSchema = z.string().min(1).max(160);

export const CLAUDE_CODE_X402_PROTECTED_TOOL_ACTIVATION_VERSION =
  "handshake.adapter.x402-protected-tool-claude-code-activation.v1" as const;

const ClaudeCodeX402ProtectedToolActivationAuthorityAuditSchema = z.strictObject({
  authorityCreated: z.literal(false),
  policyDecisionCreated: z.literal(false),
  greenlightCreated: z.literal(false),
  gatewayCheckPerformedByArtifact: z.literal(false),
  mutationAttemptedByArtifact: z.literal(false),
  credentialMaterialIncluded: z.literal(false),
  signerInvokedByArtifact: z.literal(false),
  paymentMaterialCreatedByArtifact: z.literal(false),
  hostWideContainmentClaimed: z.literal(false),
  liveHostMutationClaimed: z.literal(false),
});

export const ClaudeCodeX402ProtectedToolActivationInputSchema = z.strictObject({
  schemaVersion: z
    .literal(CLAUDE_CODE_X402_PROTECTED_TOOL_ACTIVATION_VERSION)
    .default(CLAUDE_CODE_X402_PROTECTED_TOOL_ACTIVATION_VERSION),
  activationId: ClaudeCodeActivationIdSchema,
  packageIdentifier: ClaudeCodeActivationIdSchema,
  packageVersion: ClaudeCodeActivationIdSchema,
  profileInput: ProtectedX402ToolHostProfileInputSchema.refine(
    (profileInput) => profileInput.hostFamily === "claude_code_mcp",
    {
      message: "Claude Code activation requires a claude_code_mcp host profile.",
    },
  ),
  mcpConfigTarget: ClaudeCodeActivationRefSchema.default(".mcp.json"),
  mcpServerName: ClaudeCodeActivationIdSchema.default("handshake_x402"),
  command: ClaudeCodeActivationIdSchema.default("npx"),
  args: z.array(ClaudeCodeActivationRefSchema).min(1),
  observedAt: z.string().datetime({ offset: true }),
  expiresAt: z.string().datetime({ offset: true }),
  configDigest: DigestSchema,
  hostToolDigest: DigestSchema,
  toolListDigest: DigestSchema,
  gatewayBindingStatus: HostGatewayBindingStatusSchema.default("bound"),
  oneUseGreenlightObserved: z.boolean().default(true),
  gatewayCheckObserved: z.boolean().default(true),
  downstreamExecutionRecordedSeparately: z.boolean().default(true),
  rawSiblingResults: z.array(HostRawSiblingProbeResultSchema).optional(),
  evidenceRefs: z.array(ClaudeCodeActivationRefSchema).default([]),
  proofGapReasonCodes: z.array(ClaudeCodeActivationIdSchema).default([]),
});
export type ClaudeCodeX402ProtectedToolActivationInput = z.input<
  typeof ClaudeCodeX402ProtectedToolActivationInputSchema
>;

export const ClaudeCodeX402ProtectedToolActivationArtifactSchema = z.strictObject({
  schemaVersion: z.literal(CLAUDE_CODE_X402_PROTECTED_TOOL_ACTIVATION_VERSION),
  activationId: ClaudeCodeActivationIdSchema,
  hostFamily: z.literal("claude_code_mcp"),
  packageIdentifier: ClaudeCodeActivationIdSchema,
  packageVersion: ClaudeCodeActivationIdSchema,
  toolName: z.literal(X402_PROTECTED_TOOL_NAME),
  mcpConfigTarget: ClaudeCodeActivationRefSchema,
  mcpServerName: ClaudeCodeActivationIdSchema,
  command: ClaudeCodeActivationIdSchema,
  args: z.array(ClaudeCodeActivationRefSchema).min(1),
  profileOutcome: z.enum(["profile_prepared", "profile_not_ready", "facade_challenge", "profile_invalid"]),
  profileNextAction: z.enum([
    "read_evidence",
    "register_control_plane_install",
    "fix_install",
    "reload_metadata",
    "wait_for_gateway",
    "recraft_request",
    "stop",
  ]),
  facadeOutcome: z
    .enum([
      "dispatch_block_prepared",
      "install_not_ready",
      "gateway_offline",
      "metadata_stale",
      "refused",
      "tool_execution_error",
    ])
    .nullable(),
  readinessContractVersion: ClaudeCodeActivationIdSchema.nullable(),
  gatewayReadinessRef: ClaudeCodeActivationRefSchema.nullable(),
  gatewayReadinessDigest: DigestSchema.nullable(),
  rawSiblingPosture: z.enum(["named_not_controlled", "unknown"]).nullable(),
  runtimeDispatchPrepared: z.boolean(),
  activationPosture: z.enum(["host_specific_ready", "host_specific_not_ready", "host_specific_proof_gap"]),
  manifest: HostFixtureManifestSchema,
  proofPacket: HostBypassProofPacketSchema,
  harnessReport: HostBypassHarnessReportSchema,
  authorityAudit: ClaudeCodeX402ProtectedToolActivationAuthorityAuditSchema,
  proofGaps: z.array(ClaudeCodeActivationIdSchema),
  evidenceRefs: z.array(ClaudeCodeActivationRefSchema),
  nonClaims: z.array(ClaudeCodeActivationRefSchema),
});
export type ClaudeCodeX402ProtectedToolActivationArtifact = z.infer<
  typeof ClaudeCodeX402ProtectedToolActivationArtifactSchema
>;

export function buildClaudeCodeX402ProtectedToolActivation(
  inputValue: ClaudeCodeX402ProtectedToolActivationInput,
): ClaudeCodeX402ProtectedToolActivationArtifact {
  const input = ClaudeCodeX402ProtectedToolActivationInputSchema.parse(inputValue);
  const profileResult = buildProtectedX402ToolHostProfile(input.profileInput);
  const manifest = claudeCodeX402ProtectedToolHostFixtureManifest(input);
  const proofPacket = deriveHostBypassProofPacket({
    manifest,
    observedAt: input.observedAt,
    observedResolvedWrapperPath: manifest.protectedPath.resolvedWrapperPath,
    observedWrapperDigest: input.configDigest,
    observedHostToolDigest: input.hostToolDigest,
    gatewayBindingStatus: profileResult.outcome === "profile_prepared" ? input.gatewayBindingStatus : "proof_gap",
    oneUseGreenlightObserved: input.oneUseGreenlightObserved,
    gatewayCheckObserved: input.gatewayCheckObserved,
    downstreamExecutionRecordedSeparately: input.downstreamExecutionRecordedSeparately,
    rawSiblingResults: input.rawSiblingResults ?? defaultClaudeCodeRawSiblingResults(manifest),
    evidenceRefs: [
      ...input.evidenceRefs,
      `evidence:claude-code-x402-activation:${input.activationId}`,
      ...(profileResult.evidenceRefs ?? []),
    ],
    proofGapReasonCodes: [
      ...input.proofGapReasonCodes,
      ...(profileResult.outcome === "profile_prepared" ? [] : ["host_bypass_proof_gap"]),
    ],
  });
  const harnessReport = projectHostBypassHarnessReport(proofPacket);
  const proofGaps = claudeCodeActivationProofGaps(profileResult.outcome, proofPacket, harnessReport);

  return ClaudeCodeX402ProtectedToolActivationArtifactSchema.parse({
    schemaVersion: CLAUDE_CODE_X402_PROTECTED_TOOL_ACTIVATION_VERSION,
    activationId: input.activationId,
    hostFamily: "claude_code_mcp",
    packageIdentifier: input.packageIdentifier,
    packageVersion: input.packageVersion,
    toolName: X402_PROTECTED_TOOL_NAME,
    mcpConfigTarget: input.mcpConfigTarget,
    mcpServerName: input.mcpServerName,
    command: input.command,
    args: input.args,
    profileOutcome: profileResult.outcome,
    profileNextAction: profileResult.nextAction,
    facadeOutcome: profileResult.facadeOutcome,
    readinessContractVersion: profileResult.readinessContractVersion,
    gatewayReadinessRef: profileResult.gatewayReadinessRef,
    gatewayReadinessDigest: profileResult.gatewayReadinessDigest,
    rawSiblingPosture: profileResult.rawSiblingPosture,
    runtimeDispatchPrepared: profileResult.runtimeIngressBlock !== null,
    activationPosture: claudeCodeActivationPosture(proofPacket),
    manifest,
    proofPacket,
    harnessReport,
    authorityAudit: {
      authorityCreated: false,
      policyDecisionCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformedByArtifact: false,
      mutationAttemptedByArtifact: false,
      credentialMaterialIncluded: false,
      signerInvokedByArtifact: false,
      paymentMaterialCreatedByArtifact: false,
      hostWideContainmentClaimed: false,
      liveHostMutationClaimed: false,
    },
    proofGaps,
    evidenceRefs: unique([...(profileResult.evidenceRefs ?? []), ...proofPacket.evidenceRefs]),
    nonClaims: unique([
      ...proofPacket.nonClaims,
      "claude_code_activation_artifact_is_not_authorization",
      "claude_code_activation_artifact_is_not_policy_decision",
      "claude_code_activation_artifact_is_not_gateway_check",
      "claude_code_activation_artifact_is_not_signer_use",
      "claude_code_activation_artifact_is_not_payment_material",
      "claude_code_activation_artifact_is_not_live_host_mutation",
      "claude_code_activation_artifact_is_not_host_wide_containment",
    ]),
  });
}

function claudeCodeX402ProtectedToolHostFixtureManifest(
  input: z.infer<typeof ClaudeCodeX402ProtectedToolActivationInputSchema>,
): HostFixtureManifest {
  return HostFixtureManifestSchema.parse({
    manifestKind: "host_fixture_manifest",
    manifestVersion: "v1",
    manifestId: `host_fixture_x402_claude_code_${input.activationId}`,
    host: {
      hostId: "host_claude_code_managed_mcp",
      hostKind: "mcp_stdio",
      hostVersionRef: `claude-code-managed-mcp:${input.packageIdentifier}@${input.packageVersion}`,
      hostToolDigest: input.hostToolDigest,
    },
    environment: {
      environmentId: "env_claude_code_x402",
      environmentKind: "local_dev",
      environmentRef: "environment:claude-code:x402",
    },
    adapter: {
      adapterId: "adapter_pack_x402_protected_tool_claude_code",
      adapterVersion: input.packageVersion,
    },
    action: {
      actionClass: "x402_payment.exact",
      protectedSurfaceKind: "x402_payment",
      resourceRef: input.profileInput.facadeInput.endpointUrl,
    },
    protectedPath: {
      protectedPathId: "protected_path_claude_code_x402_managed_mcp",
      configuredWrapperPath: `${input.mcpConfigTarget}#mcpServers.${input.mcpServerName}`,
      resolvedWrapperPath: `${input.mcpConfigTarget}#mcpServers.${input.mcpServerName}`,
      wrapperDigest: input.configDigest,
      toolListDigest: input.toolListDigest,
      rawSiblingCandidates: claudeCodeRawSiblingCandidates(input.profileInput.facadeInput.endpointUrl),
    },
    registry: {
      gatewayRegistryEntryId: input.profileInput.facadeInput.gatewayRegistryEntryId,
      gatewayId: input.profileInput.facadeInput.gatewayId,
      gatewayRegistryDigest: input.profileInput.facadeInput.gatewayRegistryDigest,
    },
    policy: {
      policyRef: input.profileInput.facadeInput.policyVersionRef,
      policyDigest: input.profileInput.facadeInput.policyVersionDigest,
    },
    freshness: {
      observedAt: input.observedAt,
      expiresAt: input.expiresAt,
      maxAgeMs: 300000,
    },
    expectedPosture: "gateway_checked",
    redaction: {
      redactionPolicyRef: "redaction:claude-code-x402-host-bypass-proof:v1",
      sensitiveValuesIncluded: false,
      preservesEnforcementDistinctions: true,
    },
    nonClaims: [
      ...requiredHostHarnessNonClaims,
      "not_live_claude_code_config_mutation",
      "not_claude_code_host_wide_containment",
      "not_unmanaged_mcp_server_control",
      "not_raw_x402_ecosystem_protection",
    ],
  });
}

function claudeCodeRawSiblingCandidates(
  endpointUrl: string,
): HostFixtureManifest["protectedPath"]["rawSiblingCandidates"] {
  return [
    {
      routeId: "raw_sibling_claude_code_shell_x402_fetch",
      displayName: "Claude Code can attempt a raw x402 fetch command outside managed MCP",
      invocationKind: "shell_command",
      commandRef: `x402-fetch ${endpointUrl}`,
      expectedOutcome: "refused_or_detected",
    },
    {
      routeId: "raw_sibling_claude_code_managed_mcp_direct_payment",
      displayName: "Claude Code can attempt a direct managed MCP payment tool",
      invocationKind: "mcp_tool",
      commandRef: `claude-code.mcp.invoke x402.directPayment ${endpointUrl}`,
      expectedOutcome: "refused_or_detected",
    },
    {
      routeId: "raw_sibling_claude_code_unmanaged_mcp_server",
      displayName: "Claude Code can load an unmanaged MCP server beside the protected wrapper",
      invocationKind: "mcp_tool",
      commandRef: ".mcp.json#mcpServers.unmanaged_x402",
      expectedOutcome: "refused_or_detected",
    },
  ];
}

function defaultClaudeCodeRawSiblingResults(manifest: HostFixtureManifest): HostRawSiblingProbeResult[] {
  return manifest.protectedPath.rawSiblingCandidates.map((candidate, index) => ({
    routeId: candidate.routeId,
    resultKind: index === 0 ? "refused" : "detected",
    probeKind: index === 0 ? "raw_sibling_blocking" : "mcp_direct_call_blocking",
    evidenceRefs: [`evidence:claude-code-x402-activation:${candidate.routeId}`],
    proofGapReasonCodes: [],
  }));
}

function claudeCodeActivationPosture(
  packet: HostBypassProofPacket,
): ClaudeCodeX402ProtectedToolActivationArtifact["activationPosture"] {
  if (packet.postureState === "READY") return "host_specific_ready";
  if (packet.postureState === "PROOF_GAP") return "host_specific_proof_gap";
  return "host_specific_not_ready";
}

function claudeCodeActivationProofGaps(
  profileOutcome: ClaudeCodeX402ProtectedToolActivationArtifact["profileOutcome"],
  proofPacket: HostBypassProofPacket,
  harnessReport: HostBypassHarnessReport,
): string[] {
  return unique([
    ...(profileOutcome === "profile_prepared" ? [] : ["claude_code_profile_not_ready"]),
    ...proofPacket.proofGapReasonCodes,
    ...harnessReport.proofGapReasonCodes,
    "live_user_claude_code_config_write_not_performed_by_demo",
    "claude_code_host_wide_containment_not_claimed",
    "claude_code_unmanaged_mcp_server_control_not_claimed",
  ]).sort();
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}
