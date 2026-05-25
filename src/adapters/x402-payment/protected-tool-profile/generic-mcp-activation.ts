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

const GenericMcpActivationRefSchema = z.string().min(1).max(500);
const GenericMcpActivationIdSchema = z.string().min(1).max(160);

export const GENERIC_MCP_X402_PROTECTED_TOOL_ACTIVATION_VERSION =
  "handshake.adapter.x402-protected-tool-generic-mcp-activation.v1" as const;

const GenericMcpX402ProtectedToolActivationAuthorityAuditSchema = z.strictObject({
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

export const GenericMcpX402ProtectedToolActivationInputSchema = z.strictObject({
  schemaVersion: z
    .literal(GENERIC_MCP_X402_PROTECTED_TOOL_ACTIVATION_VERSION)
    .default(GENERIC_MCP_X402_PROTECTED_TOOL_ACTIVATION_VERSION),
  activationId: GenericMcpActivationIdSchema,
  packageIdentifier: GenericMcpActivationIdSchema,
  packageVersion: GenericMcpActivationIdSchema,
  profileInput: ProtectedX402ToolHostProfileInputSchema.refine(
    (profileInput) => profileInput.hostFamily === "generic_mcp",
    {
      message: "Generic MCP activation requires a generic_mcp host profile.",
    },
  ),
  mcpConfigTarget: GenericMcpActivationRefSchema.default("mcp.json"),
  mcpServerName: GenericMcpActivationIdSchema.default("handshake_x402"),
  command: GenericMcpActivationIdSchema.default("npx"),
  args: z.array(GenericMcpActivationRefSchema).min(1),
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
  evidenceRefs: z.array(GenericMcpActivationRefSchema).default([]),
  proofGapReasonCodes: z.array(GenericMcpActivationIdSchema).default([]),
});
export type GenericMcpX402ProtectedToolActivationInput = z.input<
  typeof GenericMcpX402ProtectedToolActivationInputSchema
>;

export const GenericMcpX402ProtectedToolActivationArtifactSchema = z.strictObject({
  schemaVersion: z.literal(GENERIC_MCP_X402_PROTECTED_TOOL_ACTIVATION_VERSION),
  activationId: GenericMcpActivationIdSchema,
  hostFamily: z.literal("generic_mcp"),
  packageIdentifier: GenericMcpActivationIdSchema,
  packageVersion: GenericMcpActivationIdSchema,
  toolName: z.literal(X402_PROTECTED_TOOL_NAME),
  mcpConfigTarget: GenericMcpActivationRefSchema,
  mcpServerName: GenericMcpActivationIdSchema,
  command: GenericMcpActivationIdSchema,
  args: z.array(GenericMcpActivationRefSchema).min(1),
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
  readinessContractVersion: GenericMcpActivationIdSchema.nullable(),
  gatewayReadinessRef: GenericMcpActivationRefSchema.nullable(),
  gatewayReadinessDigest: DigestSchema.nullable(),
  rawSiblingPosture: z.enum(["named_not_controlled", "unknown"]).nullable(),
  runtimeDispatchPrepared: z.boolean(),
  activationPosture: z.enum(["host_specific_ready", "host_specific_not_ready", "host_specific_proof_gap"]),
  manifest: HostFixtureManifestSchema,
  proofPacket: HostBypassProofPacketSchema,
  harnessReport: HostBypassHarnessReportSchema,
  authorityAudit: GenericMcpX402ProtectedToolActivationAuthorityAuditSchema,
  proofGaps: z.array(GenericMcpActivationIdSchema),
  evidenceRefs: z.array(GenericMcpActivationRefSchema),
  nonClaims: z.array(GenericMcpActivationRefSchema),
});
export type GenericMcpX402ProtectedToolActivationArtifact = z.infer<
  typeof GenericMcpX402ProtectedToolActivationArtifactSchema
>;

export function buildGenericMcpX402ProtectedToolActivation(
  inputValue: GenericMcpX402ProtectedToolActivationInput,
): GenericMcpX402ProtectedToolActivationArtifact {
  const input = GenericMcpX402ProtectedToolActivationInputSchema.parse(inputValue);
  const profileResult = buildProtectedX402ToolHostProfile(input.profileInput);
  const manifest = genericMcpX402ProtectedToolHostFixtureManifest(input);
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
    rawSiblingResults: input.rawSiblingResults ?? defaultGenericMcpRawSiblingResults(manifest),
    evidenceRefs: [
      ...input.evidenceRefs,
      `evidence:generic-mcp-x402-activation:${input.activationId}`,
      ...(profileResult.evidenceRefs ?? []),
    ],
    proofGapReasonCodes: [
      ...input.proofGapReasonCodes,
      ...(profileResult.outcome === "profile_prepared" ? [] : ["host_bypass_proof_gap"]),
    ],
  });
  const harnessReport = projectHostBypassHarnessReport(proofPacket);
  const proofGaps = genericMcpActivationProofGaps(profileResult.outcome, proofPacket, harnessReport);

  return GenericMcpX402ProtectedToolActivationArtifactSchema.parse({
    schemaVersion: GENERIC_MCP_X402_PROTECTED_TOOL_ACTIVATION_VERSION,
    activationId: input.activationId,
    hostFamily: "generic_mcp",
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
    activationPosture: genericMcpActivationPosture(proofPacket),
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
      "generic_mcp_activation_artifact_is_not_authorization",
      "generic_mcp_activation_artifact_is_not_policy_decision",
      "generic_mcp_activation_artifact_is_not_gateway_check",
      "generic_mcp_activation_artifact_is_not_signer_use",
      "generic_mcp_activation_artifact_is_not_payment_material",
      "generic_mcp_activation_artifact_is_not_live_host_mutation",
      "generic_mcp_activation_artifact_is_not_host_wide_containment",
      "generic_mcp_activation_artifact_is_not_native_host_certification",
    ]),
  });
}

function genericMcpX402ProtectedToolHostFixtureManifest(
  input: z.infer<typeof GenericMcpX402ProtectedToolActivationInputSchema>,
): HostFixtureManifest {
  return HostFixtureManifestSchema.parse({
    manifestKind: "host_fixture_manifest",
    manifestVersion: "v1",
    manifestId: `host_fixture_x402_generic_mcp_${input.activationId}`,
    host: {
      hostId: "host_generic_mcp_stdio",
      hostKind: "mcp_stdio",
      hostVersionRef: `generic-mcp-stdio:${input.packageIdentifier}@${input.packageVersion}`,
      hostToolDigest: input.hostToolDigest,
    },
    environment: {
      environmentId: "env_generic_mcp_x402",
      environmentKind: "local_dev",
      environmentRef: "environment:generic-mcp:x402",
    },
    adapter: {
      adapterId: "adapter_pack_x402_protected_tool_generic_mcp",
      adapterVersion: input.packageVersion,
    },
    action: {
      actionClass: "x402_payment.exact",
      protectedSurfaceKind: "x402_payment",
      resourceRef: input.profileInput.facadeInput.endpointUrl,
    },
    protectedPath: {
      protectedPathId: "protected_path_generic_mcp_x402_stdio",
      configuredWrapperPath: `${input.mcpConfigTarget}#mcpServers.${input.mcpServerName}`,
      resolvedWrapperPath: `${input.mcpConfigTarget}#mcpServers.${input.mcpServerName}`,
      wrapperDigest: input.configDigest,
      toolListDigest: input.toolListDigest,
      rawSiblingCandidates: genericMcpRawSiblingCandidates(input.profileInput.facadeInput.endpointUrl),
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
      redactionPolicyRef: "redaction:generic-mcp-x402-host-bypass-proof:v1",
      sensitiveValuesIncluded: false,
      preservesEnforcementDistinctions: true,
    },
    nonClaims: [
      ...requiredHostHarnessNonClaims,
      "not_live_generic_mcp_config_mutation",
      "not_generic_mcp_host_wide_containment",
      "not_generic_mcp_native_host_certification",
      "not_unmanaged_mcp_server_control",
      "not_raw_x402_ecosystem_protection",
    ],
  });
}

function genericMcpRawSiblingCandidates(
  endpointUrl: string,
): HostFixtureManifest["protectedPath"]["rawSiblingCandidates"] {
  return [
    {
      routeId: "raw_sibling_generic_mcp_shell_x402_fetch",
      displayName: "Generic MCP host can attempt a raw x402 fetch command outside stdio MCP",
      invocationKind: "shell_command",
      commandRef: `x402-fetch ${endpointUrl}`,
      expectedOutcome: "refused_or_detected",
    },
    {
      routeId: "raw_sibling_generic_mcp_direct_payment",
      displayName: "Generic MCP host can attempt a direct payment tool beside the protected wrapper",
      invocationKind: "mcp_tool",
      commandRef: `mcp.invoke x402.directPayment ${endpointUrl}`,
      expectedOutcome: "refused_or_detected",
    },
    {
      routeId: "raw_sibling_generic_mcp_unmanaged_server",
      displayName: "Generic MCP host can load an unmanaged MCP server beside the protected wrapper",
      invocationKind: "mcp_tool",
      commandRef: "mcp.json#mcpServers.unmanaged_x402",
      expectedOutcome: "refused_or_detected",
    },
  ];
}

function defaultGenericMcpRawSiblingResults(manifest: HostFixtureManifest): HostRawSiblingProbeResult[] {
  return manifest.protectedPath.rawSiblingCandidates.map((candidate, index) => ({
    routeId: candidate.routeId,
    resultKind: index === 0 ? "refused" : "detected",
    probeKind: index === 0 ? "raw_sibling_blocking" : "mcp_direct_call_blocking",
    evidenceRefs: [`evidence:generic-mcp-x402-activation:${candidate.routeId}`],
    proofGapReasonCodes: [],
  }));
}

function genericMcpActivationPosture(
  packet: HostBypassProofPacket,
): GenericMcpX402ProtectedToolActivationArtifact["activationPosture"] {
  if (packet.postureState === "READY") return "host_specific_ready";
  if (packet.postureState === "PROOF_GAP") return "host_specific_proof_gap";
  return "host_specific_not_ready";
}

function genericMcpActivationProofGaps(
  profileOutcome: GenericMcpX402ProtectedToolActivationArtifact["profileOutcome"],
  proofPacket: HostBypassProofPacket,
  harnessReport: HostBypassHarnessReport,
): string[] {
  return unique([
    ...(profileOutcome === "profile_prepared" ? [] : ["generic_mcp_profile_not_ready"]),
    ...proofPacket.proofGapReasonCodes,
    ...harnessReport.proofGapReasonCodes,
    "live_user_generic_mcp_config_write_not_performed_by_demo",
    "generic_mcp_host_wide_containment_not_claimed",
    "generic_mcp_native_host_behavior_not_claimed",
    "generic_mcp_unmanaged_server_control_not_claimed",
  ]).sort();
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}
