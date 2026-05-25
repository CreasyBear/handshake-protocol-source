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

const OpenClawActivationRefSchema = z.string().min(1).max(500);
const OpenClawActivationIdSchema = z.string().min(1).max(160);

export const OPENCLAW_X402_PROTECTED_TOOL_ACTIVATION_VERSION =
  "handshake.adapter.x402-protected-tool-openclaw-activation.v1" as const;

const OpenClawX402ProtectedToolActivationAuthorityAuditSchema = z.strictObject({
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

export const OpenClawX402ProtectedToolActivationInputSchema = z.strictObject({
  schemaVersion: z
    .literal(OPENCLAW_X402_PROTECTED_TOOL_ACTIVATION_VERSION)
    .default(OPENCLAW_X402_PROTECTED_TOOL_ACTIVATION_VERSION),
  activationId: OpenClawActivationIdSchema,
  packageIdentifier: OpenClawActivationIdSchema,
  packageVersion: OpenClawActivationIdSchema,
  profileInput: ProtectedX402ToolHostProfileInputSchema.refine(
    (profileInput) => profileInput.hostFamily === "openclaw",
    {
      message: "OpenClaw activation requires an openclaw host profile.",
    },
  ),
  toolPacketConfigTarget: OpenClawActivationRefSchema.default("openclaw.tool-packet.json"),
  toolPacketName: OpenClawActivationIdSchema.default("handshake_x402_protected_tool"),
  command: OpenClawActivationIdSchema.default("npx"),
  args: z.array(OpenClawActivationRefSchema).min(1),
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
  evidenceRefs: z.array(OpenClawActivationRefSchema).default([]),
  proofGapReasonCodes: z.array(OpenClawActivationIdSchema).default([]),
});
export type OpenClawX402ProtectedToolActivationInput = z.input<typeof OpenClawX402ProtectedToolActivationInputSchema>;

export const OpenClawX402ProtectedToolActivationArtifactSchema = z.strictObject({
  schemaVersion: z.literal(OPENCLAW_X402_PROTECTED_TOOL_ACTIVATION_VERSION),
  activationId: OpenClawActivationIdSchema,
  hostFamily: z.literal("openclaw"),
  packageIdentifier: OpenClawActivationIdSchema,
  packageVersion: OpenClawActivationIdSchema,
  toolName: z.literal(X402_PROTECTED_TOOL_NAME),
  toolPacketConfigTarget: OpenClawActivationRefSchema,
  toolPacketName: OpenClawActivationIdSchema,
  command: OpenClawActivationIdSchema,
  args: z.array(OpenClawActivationRefSchema).min(1),
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
  readinessContractVersion: OpenClawActivationIdSchema.nullable(),
  gatewayReadinessRef: OpenClawActivationRefSchema.nullable(),
  gatewayReadinessDigest: DigestSchema.nullable(),
  rawSiblingPosture: z.enum(["named_not_controlled", "unknown"]).nullable(),
  runtimeDispatchPrepared: z.boolean(),
  activationPosture: z.enum(["host_specific_ready", "host_specific_not_ready", "host_specific_proof_gap"]),
  manifest: HostFixtureManifestSchema,
  proofPacket: HostBypassProofPacketSchema,
  harnessReport: HostBypassHarnessReportSchema,
  authorityAudit: OpenClawX402ProtectedToolActivationAuthorityAuditSchema,
  proofGaps: z.array(OpenClawActivationIdSchema),
  evidenceRefs: z.array(OpenClawActivationRefSchema),
  nonClaims: z.array(OpenClawActivationRefSchema),
});
export type OpenClawX402ProtectedToolActivationArtifact = z.infer<
  typeof OpenClawX402ProtectedToolActivationArtifactSchema
>;

export function buildOpenClawX402ProtectedToolActivation(
  inputValue: OpenClawX402ProtectedToolActivationInput,
): OpenClawX402ProtectedToolActivationArtifact {
  const input = OpenClawX402ProtectedToolActivationInputSchema.parse(inputValue);
  const profileResult = buildProtectedX402ToolHostProfile(input.profileInput);
  const manifest = openClawX402ProtectedToolHostFixtureManifest(input);
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
    rawSiblingResults: input.rawSiblingResults ?? defaultOpenClawRawSiblingResults(manifest),
    evidenceRefs: [
      ...input.evidenceRefs,
      `evidence:openclaw-x402-activation:${input.activationId}`,
      ...(profileResult.evidenceRefs ?? []),
    ],
    proofGapReasonCodes: [
      ...input.proofGapReasonCodes,
      ...(profileResult.outcome === "profile_prepared" ? [] : ["host_bypass_proof_gap"]),
    ],
  });
  const harnessReport = projectHostBypassHarnessReport(proofPacket);
  const proofGaps = openClawActivationProofGaps(profileResult.outcome, proofPacket, harnessReport);

  return OpenClawX402ProtectedToolActivationArtifactSchema.parse({
    schemaVersion: OPENCLAW_X402_PROTECTED_TOOL_ACTIVATION_VERSION,
    activationId: input.activationId,
    hostFamily: "openclaw",
    packageIdentifier: input.packageIdentifier,
    packageVersion: input.packageVersion,
    toolName: X402_PROTECTED_TOOL_NAME,
    toolPacketConfigTarget: input.toolPacketConfigTarget,
    toolPacketName: input.toolPacketName,
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
    activationPosture: openClawActivationPosture(proofPacket),
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
      "openclaw_activation_artifact_is_not_authorization",
      "openclaw_activation_artifact_is_not_policy_decision",
      "openclaw_activation_artifact_is_not_gateway_check",
      "openclaw_activation_artifact_is_not_signer_use",
      "openclaw_activation_artifact_is_not_payment_material",
      "openclaw_activation_artifact_is_not_live_host_mutation",
      "openclaw_activation_artifact_is_not_host_wide_containment",
      "openclaw_activation_artifact_is_not_native_host_certification",
    ]),
  });
}

function openClawX402ProtectedToolHostFixtureManifest(
  input: z.infer<typeof OpenClawX402ProtectedToolActivationInputSchema>,
): HostFixtureManifest {
  return HostFixtureManifestSchema.parse({
    manifestKind: "host_fixture_manifest",
    manifestVersion: "v1",
    manifestId: `host_fixture_x402_openclaw_${input.activationId}`,
    host: {
      hostId: "host_openclaw_tool_packet",
      hostKind: "mcp_stdio",
      hostVersionRef: `openclaw-tool-packet:${input.packageIdentifier}@${input.packageVersion}`,
      hostToolDigest: input.hostToolDigest,
    },
    environment: {
      environmentId: "env_openclaw_x402",
      environmentKind: "local_dev",
      environmentRef: "environment:openclaw:x402",
    },
    adapter: {
      adapterId: "adapter_pack_x402_protected_tool_openclaw",
      adapterVersion: input.packageVersion,
    },
    action: {
      actionClass: "x402_payment.exact",
      protectedSurfaceKind: "x402_payment",
      resourceRef: input.profileInput.facadeInput.endpointUrl,
    },
    protectedPath: {
      protectedPathId: "protected_path_openclaw_x402_tool_packet",
      configuredWrapperPath: `${input.toolPacketConfigTarget}#toolPacket.${input.toolPacketName}`,
      resolvedWrapperPath: `${input.toolPacketConfigTarget}#toolPacket.${input.toolPacketName}`,
      wrapperDigest: input.configDigest,
      toolListDigest: input.toolListDigest,
      rawSiblingCandidates: openClawRawSiblingCandidates(input.profileInput.facadeInput.endpointUrl),
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
      redactionPolicyRef: "redaction:openclaw-x402-host-bypass-proof:v1",
      sensitiveValuesIncluded: false,
      preservesEnforcementDistinctions: true,
    },
    nonClaims: [
      ...requiredHostHarnessNonClaims,
      "not_live_openclaw_tool_packet_mutation",
      "not_openclaw_host_wide_containment",
      "not_openclaw_native_host_certification",
      "not_unmanaged_tool_packet_control",
      "not_raw_x402_ecosystem_protection",
    ],
  });
}

function openClawRawSiblingCandidates(
  endpointUrl: string,
): HostFixtureManifest["protectedPath"]["rawSiblingCandidates"] {
  return [
    {
      routeId: "raw_sibling_openclaw_shell_x402_fetch",
      displayName: "OpenClaw can attempt a raw x402 fetch command outside the tool packet",
      invocationKind: "shell_command",
      commandRef: `x402-fetch ${endpointUrl}`,
      expectedOutcome: "refused_or_detected",
    },
    {
      routeId: "raw_sibling_openclaw_tool_packet_direct_payment",
      displayName: "OpenClaw can attempt a direct payment tool beside the protected wrapper",
      invocationKind: "mcp_tool",
      commandRef: `openclaw.tool.invoke x402.directPayment ${endpointUrl}`,
      expectedOutcome: "refused_or_detected",
    },
    {
      routeId: "raw_sibling_openclaw_unmanaged_tool_packet",
      displayName: "OpenClaw can load an unmanaged x402 tool packet beside the protected wrapper",
      invocationKind: "mcp_tool",
      commandRef: "openclaw.tool-packet.json#toolPacket.unmanaged_x402",
      expectedOutcome: "refused_or_detected",
    },
  ];
}

function defaultOpenClawRawSiblingResults(manifest: HostFixtureManifest): HostRawSiblingProbeResult[] {
  return manifest.protectedPath.rawSiblingCandidates.map((candidate, index) => ({
    routeId: candidate.routeId,
    resultKind: index === 0 ? "refused" : "detected",
    probeKind: index === 0 ? "raw_sibling_blocking" : "mcp_direct_call_blocking",
    evidenceRefs: [`evidence:openclaw-x402-activation:${candidate.routeId}`],
    proofGapReasonCodes: [],
  }));
}

function openClawActivationPosture(
  packet: HostBypassProofPacket,
): OpenClawX402ProtectedToolActivationArtifact["activationPosture"] {
  if (packet.postureState === "READY") return "host_specific_ready";
  if (packet.postureState === "PROOF_GAP") return "host_specific_proof_gap";
  return "host_specific_not_ready";
}

function openClawActivationProofGaps(
  profileOutcome: OpenClawX402ProtectedToolActivationArtifact["profileOutcome"],
  proofPacket: HostBypassProofPacket,
  harnessReport: HostBypassHarnessReport,
): string[] {
  return unique([
    ...(profileOutcome === "profile_prepared" ? [] : ["openclaw_profile_not_ready"]),
    ...proofPacket.proofGapReasonCodes,
    ...harnessReport.proofGapReasonCodes,
    "live_user_openclaw_tool_packet_write_not_performed_by_demo",
    "openclaw_host_wide_containment_not_claimed",
    "openclaw_native_host_behavior_not_claimed",
    "openclaw_unmanaged_tool_packet_control_not_claimed",
  ]).sort();
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}
