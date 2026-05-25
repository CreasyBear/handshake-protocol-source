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

const CodexActivationRefSchema = z.string().min(1).max(500);
const CodexActivationIdSchema = z.string().min(1).max(160);

export const CODEX_X402_PROTECTED_TOOL_ACTIVATION_VERSION =
  "handshake.adapter.x402-protected-tool-codex-activation.v1" as const;
export const CODEX_X402_PROTECTED_TOOL_RUNTIME_TRANSCRIPT_VERSION =
  "handshake.adapter.x402-protected-tool-codex-runtime-transcript.v1" as const;

const CodexX402ProtectedToolActivationAuthorityAuditSchema = z.strictObject({
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

export const CodexX402ProtectedToolActivationInputSchema = z.strictObject({
  schemaVersion: z
    .literal(CODEX_X402_PROTECTED_TOOL_ACTIVATION_VERSION)
    .default(CODEX_X402_PROTECTED_TOOL_ACTIVATION_VERSION),
  activationId: CodexActivationIdSchema,
  packageIdentifier: CodexActivationIdSchema,
  packageVersion: CodexActivationIdSchema,
  profileInput: ProtectedX402ToolHostProfileInputSchema,
  codexConfigTarget: CodexActivationRefSchema.default("~/.codex/config.toml"),
  mcpServerName: CodexActivationIdSchema.default("handshake_x402"),
  command: CodexActivationIdSchema.default("npx"),
  args: z.array(CodexActivationRefSchema).min(1),
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
  evidenceRefs: z.array(CodexActivationRefSchema).default([]),
  proofGapReasonCodes: z.array(CodexActivationIdSchema).default([]),
});
export type CodexX402ProtectedToolActivationInput = z.input<typeof CodexX402ProtectedToolActivationInputSchema>;

export const CodexX402ProtectedToolActivationArtifactSchema = z.strictObject({
  schemaVersion: z.literal(CODEX_X402_PROTECTED_TOOL_ACTIVATION_VERSION),
  activationId: CodexActivationIdSchema,
  hostFamily: z.literal("codex_local"),
  packageIdentifier: CodexActivationIdSchema,
  packageVersion: CodexActivationIdSchema,
  toolName: z.literal(X402_PROTECTED_TOOL_NAME),
  codexConfigTarget: CodexActivationRefSchema,
  mcpServerName: CodexActivationIdSchema,
  command: CodexActivationIdSchema,
  args: z.array(CodexActivationRefSchema).min(1),
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
  readinessContractVersion: CodexActivationIdSchema.nullable(),
  gatewayReadinessRef: CodexActivationRefSchema.nullable(),
  gatewayReadinessDigest: DigestSchema.nullable(),
  rawSiblingPosture: z.enum(["named_not_controlled", "unknown"]).nullable(),
  runtimeDispatchPrepared: z.boolean(),
  activationPosture: z.enum(["host_specific_ready", "host_specific_not_ready", "host_specific_proof_gap"]),
  manifest: HostFixtureManifestSchema,
  proofPacket: HostBypassProofPacketSchema,
  harnessReport: HostBypassHarnessReportSchema,
  authorityAudit: CodexX402ProtectedToolActivationAuthorityAuditSchema,
  proofGaps: z.array(CodexActivationIdSchema),
  evidenceRefs: z.array(CodexActivationRefSchema),
  nonClaims: z.array(CodexActivationRefSchema),
});
export type CodexX402ProtectedToolActivationArtifact = z.infer<typeof CodexX402ProtectedToolActivationArtifactSchema>;

const CodexX402ProtectedToolRuntimeTranscriptAuthorityAuditSchema = z.strictObject({
  authorityCreated: z.literal(false),
  policyDecisionCreated: z.literal(false),
  greenlightCreated: z.literal(false),
  gatewayCheckPerformedByTranscript: z.literal(false),
  mutationAttemptedByTranscript: z.literal(false),
  credentialMaterialIncluded: z.literal(false),
  signerInvokedByTranscript: z.literal(false),
  paymentMaterialCreatedByTranscript: z.literal(false),
  receiptExportCreatedByTranscript: z.literal(false),
  terminalCertificateMintedByTranscript: z.literal(false),
  liveHostMutationClaimed: z.literal(false),
  hostWideContainmentClaimed: z.literal(false),
});

const CodexRuntimeTranscriptReadbackCommandSchema = z.enum([
  "handshake evidence contract-view",
  "handshake evidence receipt-timeline",
  "handshake support bundle",
]);

export const CodexX402ProtectedToolRuntimeTranscriptInputSchema = z.strictObject({
  transcriptId: CodexActivationIdSchema,
  activationArtifact: CodexX402ProtectedToolActivationArtifactSchema,
  observedAt: z.string().datetime({ offset: true }),
  selectionPosture: z
    .enum(["local_default_pending_user_confirmation", "user_selected", "blocked_user_decision"])
    .default("local_default_pending_user_confirmation"),
  unselectedHostFamilies: z
    .array(z.enum(["claude_code_mcp", "hermes", "openclaw", "generic_mcp"]))
    .default(["claude_code_mcp", "hermes", "openclaw", "generic_mcp"]),
  evidenceRefs: z.array(CodexActivationRefSchema).default([]),
});
export type CodexX402ProtectedToolRuntimeTranscriptInput = z.input<
  typeof CodexX402ProtectedToolRuntimeTranscriptInputSchema
>;

export const CodexX402ProtectedToolRuntimeTranscriptSchema = z.strictObject({
  schemaVersion: z.literal(CODEX_X402_PROTECTED_TOOL_RUNTIME_TRANSCRIPT_VERSION),
  transcriptId: CodexActivationIdSchema,
  selectedHostFamily: z.literal("codex_local"),
  selectionPosture: z.enum(["local_default_pending_user_confirmation", "user_selected", "blocked_user_decision"]),
  observedAt: z.string().datetime({ offset: true }),
  activationId: CodexActivationIdSchema,
  toolName: z.literal(X402_PROTECTED_TOOL_NAME),
  codexConfigTarget: CodexActivationRefSchema,
  mcpServerName: CodexActivationIdSchema,
  command: CodexActivationIdSchema,
  args: z.array(CodexActivationRefSchema).min(1),
  proposalCompatibility: z.strictObject({
    proposalToolVisible: z.literal(true),
    proposalOnly: z.literal(true),
    profileOutcome: z.enum(["profile_prepared", "profile_not_ready", "facade_challenge", "profile_invalid"]),
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
    runtimeDispatchPrepared: z.boolean(),
    policyDecisionCreated: z.literal(false),
    greenlightCreated: z.literal(false),
    gatewayCheckPerformed: z.literal(false),
  }),
  readbackCompatibility: z.strictObject({
    redactedReadbackOnly: z.literal(true),
    commands: z.array(CodexRuntimeTranscriptReadbackCommandSchema).min(1),
    supportBundleIsPermission: z.literal(false),
    receiptExportCreated: z.literal(false),
    terminalCertificateMinted: z.literal(false),
  }),
  rawSiblingPosture: z.strictObject({
    postureState: HostBypassProofPacketSchema.shape.postureState,
    rawSiblingAttempts: z.array(HostRawSiblingProbeResultSchema),
    hostWideContainmentClaimed: z.literal(false),
  }),
  unselectedHostPosture: z.array(
    z.strictObject({
      hostFamily: z.enum(["claude_code_mcp", "hermes", "openclaw", "generic_mcp"]),
      posture: z.literal("parity_artifact_only"),
      proofGaps: z.array(CodexActivationIdSchema),
    }),
  ),
  authorityAudit: CodexX402ProtectedToolRuntimeTranscriptAuthorityAuditSchema,
  proofGaps: z.array(CodexActivationIdSchema),
  evidenceRefs: z.array(CodexActivationRefSchema),
  nonClaims: z.array(CodexActivationRefSchema),
});
export type CodexX402ProtectedToolRuntimeTranscript = z.infer<typeof CodexX402ProtectedToolRuntimeTranscriptSchema>;

export function buildCodexX402ProtectedToolActivation(
  inputValue: CodexX402ProtectedToolActivationInput,
): CodexX402ProtectedToolActivationArtifact {
  const input = CodexX402ProtectedToolActivationInputSchema.parse(inputValue);
  const profileResult = buildProtectedX402ToolHostProfile(input.profileInput);
  const manifest = codexX402ProtectedToolHostFixtureManifest(input);
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
    rawSiblingResults: input.rawSiblingResults ?? defaultCodexRawSiblingResults(manifest),
    evidenceRefs: [
      ...input.evidenceRefs,
      `evidence:codex-x402-activation:${input.activationId}`,
      ...(profileResult.evidenceRefs ?? []),
    ],
    proofGapReasonCodes: [
      ...input.proofGapReasonCodes,
      ...(profileResult.outcome === "profile_prepared" ? [] : ["host_bypass_proof_gap"]),
    ],
  });
  const harnessReport = projectHostBypassHarnessReport(proofPacket);
  const proofGaps = codexActivationProofGaps(profileResult.outcome, proofPacket, harnessReport);

  return CodexX402ProtectedToolActivationArtifactSchema.parse({
    schemaVersion: CODEX_X402_PROTECTED_TOOL_ACTIVATION_VERSION,
    activationId: input.activationId,
    hostFamily: "codex_local",
    packageIdentifier: input.packageIdentifier,
    packageVersion: input.packageVersion,
    toolName: X402_PROTECTED_TOOL_NAME,
    codexConfigTarget: input.codexConfigTarget,
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
    activationPosture: codexActivationPosture(proofPacket),
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
      "codex_activation_artifact_is_not_authorization",
      "codex_activation_artifact_is_not_policy_decision",
      "codex_activation_artifact_is_not_gateway_check",
      "codex_activation_artifact_is_not_signer_use",
      "codex_activation_artifact_is_not_payment_material",
      "codex_activation_artifact_is_not_live_host_mutation",
      "codex_activation_artifact_is_not_host_wide_containment",
    ]),
  });
}

export function buildCodexX402ProtectedToolRuntimeTranscript(
  inputValue: CodexX402ProtectedToolRuntimeTranscriptInput,
): CodexX402ProtectedToolRuntimeTranscript {
  const input = CodexX402ProtectedToolRuntimeTranscriptInputSchema.parse(inputValue);
  const activation = input.activationArtifact;

  return CodexX402ProtectedToolRuntimeTranscriptSchema.parse({
    schemaVersion: CODEX_X402_PROTECTED_TOOL_RUNTIME_TRANSCRIPT_VERSION,
    transcriptId: input.transcriptId,
    selectedHostFamily: "codex_local",
    selectionPosture: input.selectionPosture,
    observedAt: input.observedAt,
    activationId: activation.activationId,
    toolName: activation.toolName,
    codexConfigTarget: activation.codexConfigTarget,
    mcpServerName: activation.mcpServerName,
    command: activation.command,
    args: activation.args,
    proposalCompatibility: {
      proposalToolVisible: true,
      proposalOnly: true,
      profileOutcome: activation.profileOutcome,
      facadeOutcome: activation.facadeOutcome,
      runtimeDispatchPrepared: activation.runtimeDispatchPrepared,
      policyDecisionCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
    },
    readbackCompatibility: {
      redactedReadbackOnly: true,
      commands: ["handshake evidence contract-view", "handshake evidence receipt-timeline", "handshake support bundle"],
      supportBundleIsPermission: false,
      receiptExportCreated: false,
      terminalCertificateMinted: false,
    },
    rawSiblingPosture: {
      postureState: activation.proofPacket.postureState,
      rawSiblingAttempts: activation.harnessReport.rawSiblingAttempts,
      hostWideContainmentClaimed: false,
    },
    unselectedHostPosture: input.unselectedHostFamilies.map((hostFamily) => ({
      hostFamily,
      posture: "parity_artifact_only",
      proofGaps: [`${hostFamily}_live_runtime_transcript_not_selected`],
    })),
    authorityAudit: {
      authorityCreated: false,
      policyDecisionCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformedByTranscript: false,
      mutationAttemptedByTranscript: false,
      credentialMaterialIncluded: false,
      signerInvokedByTranscript: false,
      paymentMaterialCreatedByTranscript: false,
      receiptExportCreatedByTranscript: false,
      terminalCertificateMintedByTranscript: false,
      liveHostMutationClaimed: false,
      hostWideContainmentClaimed: false,
    },
    proofGaps: unique([
      ...activation.proofGaps,
      ...(input.selectionPosture === "user_selected" ? [] : ["user_final_runtime_selection_not_recorded"]),
      ...input.unselectedHostFamilies.map((hostFamily) => `${hostFamily}_live_runtime_transcript_not_selected`),
    ]).sort(),
    evidenceRefs: unique([
      ...input.evidenceRefs,
      ...activation.evidenceRefs,
      `evidence:codex-x402-runtime-transcript:${input.transcriptId}`,
    ]),
    nonClaims: unique([
      ...activation.nonClaims,
      "codex_runtime_transcript_is_not_authorization",
      "codex_runtime_transcript_is_not_gateway_check",
      "codex_runtime_transcript_is_not_live_host_mutation",
      "codex_runtime_transcript_is_not_host_wide_containment",
      "unselected_hosts_remain_parity_artifacts",
    ]),
  });
}

function codexX402ProtectedToolHostFixtureManifest(
  input: z.infer<typeof CodexX402ProtectedToolActivationInputSchema>,
): HostFixtureManifest {
  return HostFixtureManifestSchema.parse({
    manifestKind: "host_fixture_manifest",
    manifestVersion: "v1",
    manifestId: `host_fixture_x402_codex_${input.activationId}`,
    host: {
      hostId: "host_codex_local",
      hostKind: "local_cli",
      hostVersionRef: `codex-local:${input.packageIdentifier}@${input.packageVersion}`,
      hostToolDigest: input.hostToolDigest,
    },
    environment: {
      environmentId: "env_codex_local_x402",
      environmentKind: "local_dev",
      environmentRef: "environment:codex-local:x402",
    },
    adapter: {
      adapterId: "adapter_pack_x402_protected_tool_codex",
      adapterVersion: input.packageVersion,
    },
    action: {
      actionClass: "x402_payment.exact",
      protectedSurfaceKind: "x402_payment",
      resourceRef: input.profileInput.facadeInput.endpointUrl,
    },
    protectedPath: {
      protectedPathId: "protected_path_codex_x402_local",
      configuredWrapperPath: `${input.codexConfigTarget}#mcp_servers.${input.mcpServerName}`,
      resolvedWrapperPath: `${input.codexConfigTarget}#mcp_servers.${input.mcpServerName}`,
      wrapperDigest: input.configDigest,
      toolListDigest: input.toolListDigest,
      rawSiblingCandidates: codexRawSiblingCandidates(input.profileInput.facadeInput.endpointUrl),
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
      redactionPolicyRef: "redaction:codex-x402-host-bypass-proof:v1",
      sensitiveValuesIncluded: false,
      preservesEnforcementDistinctions: true,
    },
    nonClaims: [
      ...requiredHostHarnessNonClaims,
      "not_live_codex_config_mutation",
      "not_codex_host_wide_containment",
      "not_raw_x402_ecosystem_protection",
    ],
  });
}

function codexRawSiblingCandidates(endpointUrl: string): HostFixtureManifest["protectedPath"]["rawSiblingCandidates"] {
  return [
    {
      routeId: "raw_sibling_codex_shell_x402_fetch",
      displayName: "Codex shell can attempt a raw x402 fetch command",
      invocationKind: "shell_command",
      commandRef: `x402-fetch ${endpointUrl}`,
      expectedOutcome: "refused_or_detected",
    },
    {
      routeId: "raw_sibling_codex_mcp_direct_payment",
      displayName: "Codex can attempt a direct MCP payment tool",
      invocationKind: "mcp_tool",
      commandRef: `mcp.invoke x402.directPayment ${endpointUrl}`,
      expectedOutcome: "refused_or_detected",
    },
    {
      routeId: "raw_sibling_codex_env_private_key",
      displayName: "Codex can attempt signer access through environment material",
      invocationKind: "shell_command",
      commandRef: "env HANDSHAKE_X402_PRIVATE_KEY=<redacted> x402-fetch",
      expectedOutcome: "refused_or_detected",
    },
  ];
}

function defaultCodexRawSiblingResults(manifest: HostFixtureManifest): HostRawSiblingProbeResult[] {
  return manifest.protectedPath.rawSiblingCandidates.map((candidate, index) => ({
    routeId: candidate.routeId,
    resultKind: index === 1 ? "detected" : "refused",
    probeKind: index === 1 ? "mcp_direct_call_blocking" : "raw_sibling_blocking",
    evidenceRefs: [`evidence:codex-x402-activation:${candidate.routeId}`],
    proofGapReasonCodes: [],
  }));
}

function codexActivationPosture(
  packet: HostBypassProofPacket,
): CodexX402ProtectedToolActivationArtifact["activationPosture"] {
  if (packet.postureState === "READY") return "host_specific_ready";
  if (packet.postureState === "PROOF_GAP") return "host_specific_proof_gap";
  return "host_specific_not_ready";
}

function codexActivationProofGaps(
  profileOutcome: CodexX402ProtectedToolActivationArtifact["profileOutcome"],
  proofPacket: HostBypassProofPacket,
  harnessReport: HostBypassHarnessReport,
): string[] {
  return unique([
    ...(profileOutcome === "profile_prepared" ? [] : ["codex_profile_not_ready"]),
    ...proofPacket.proofGapReasonCodes,
    ...harnessReport.proofGapReasonCodes,
    "live_user_codex_config_write_not_performed_by_demo",
    "codex_host_wide_containment_not_claimed",
  ]).sort();
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}
