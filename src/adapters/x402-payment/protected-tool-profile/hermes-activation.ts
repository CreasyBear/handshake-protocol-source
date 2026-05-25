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

const HermesActivationRefSchema = z.string().min(1).max(500);
const HermesActivationIdSchema = z.string().min(1).max(160);

export const HERMES_X402_PROTECTED_TOOL_ACTIVATION_VERSION =
  "handshake.adapter.x402-protected-tool-hermes-activation.v1" as const;

const HermesX402ProtectedToolActivationAuthorityAuditSchema = z.strictObject({
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

export const HermesX402ProtectedToolActivationInputSchema = z.strictObject({
  schemaVersion: z
    .literal(HERMES_X402_PROTECTED_TOOL_ACTIVATION_VERSION)
    .default(HERMES_X402_PROTECTED_TOOL_ACTIVATION_VERSION),
  activationId: HermesActivationIdSchema,
  packageIdentifier: HermesActivationIdSchema,
  packageVersion: HermesActivationIdSchema,
  profileInput: ProtectedX402ToolHostProfileInputSchema.refine((profileInput) => profileInput.hostFamily === "hermes", {
    message: "Hermes activation requires a hermes host profile.",
  }),
  toolPacketConfigTarget: HermesActivationRefSchema.default("hermes.tool-packet.json"),
  toolPacketName: HermesActivationIdSchema.default("handshake_x402_protected_tool"),
  command: HermesActivationIdSchema.default("npx"),
  args: z.array(HermesActivationRefSchema).min(1),
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
  evidenceRefs: z.array(HermesActivationRefSchema).default([]),
  proofGapReasonCodes: z.array(HermesActivationIdSchema).default([]),
});
export type HermesX402ProtectedToolActivationInput = z.input<typeof HermesX402ProtectedToolActivationInputSchema>;

export const HermesX402ProtectedToolActivationArtifactSchema = z.strictObject({
  schemaVersion: z.literal(HERMES_X402_PROTECTED_TOOL_ACTIVATION_VERSION),
  activationId: HermesActivationIdSchema,
  hostFamily: z.literal("hermes"),
  packageIdentifier: HermesActivationIdSchema,
  packageVersion: HermesActivationIdSchema,
  toolName: z.literal(X402_PROTECTED_TOOL_NAME),
  toolPacketConfigTarget: HermesActivationRefSchema,
  toolPacketName: HermesActivationIdSchema,
  command: HermesActivationIdSchema,
  args: z.array(HermesActivationRefSchema).min(1),
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
  readinessContractVersion: HermesActivationIdSchema.nullable(),
  gatewayReadinessRef: HermesActivationRefSchema.nullable(),
  gatewayReadinessDigest: DigestSchema.nullable(),
  rawSiblingPosture: z.enum(["named_not_controlled", "unknown"]).nullable(),
  runtimeDispatchPrepared: z.boolean(),
  activationPosture: z.enum(["host_specific_ready", "host_specific_not_ready", "host_specific_proof_gap"]),
  manifest: HostFixtureManifestSchema,
  proofPacket: HostBypassProofPacketSchema,
  harnessReport: HostBypassHarnessReportSchema,
  authorityAudit: HermesX402ProtectedToolActivationAuthorityAuditSchema,
  proofGaps: z.array(HermesActivationIdSchema),
  evidenceRefs: z.array(HermesActivationRefSchema),
  nonClaims: z.array(HermesActivationRefSchema),
});
export type HermesX402ProtectedToolActivationArtifact = z.infer<typeof HermesX402ProtectedToolActivationArtifactSchema>;

export function buildHermesX402ProtectedToolActivation(
  inputValue: HermesX402ProtectedToolActivationInput,
): HermesX402ProtectedToolActivationArtifact {
  const input = HermesX402ProtectedToolActivationInputSchema.parse(inputValue);
  const profileResult = buildProtectedX402ToolHostProfile(input.profileInput);
  const manifest = hermesX402ProtectedToolHostFixtureManifest(input);
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
    rawSiblingResults: input.rawSiblingResults ?? defaultHermesRawSiblingResults(manifest),
    evidenceRefs: [
      ...input.evidenceRefs,
      `evidence:hermes-x402-activation:${input.activationId}`,
      ...(profileResult.evidenceRefs ?? []),
    ],
    proofGapReasonCodes: [
      ...input.proofGapReasonCodes,
      ...(profileResult.outcome === "profile_prepared" ? [] : ["host_bypass_proof_gap"]),
    ],
  });
  const harnessReport = projectHostBypassHarnessReport(proofPacket);
  const proofGaps = hermesActivationProofGaps(profileResult.outcome, proofPacket, harnessReport);

  return HermesX402ProtectedToolActivationArtifactSchema.parse({
    schemaVersion: HERMES_X402_PROTECTED_TOOL_ACTIVATION_VERSION,
    activationId: input.activationId,
    hostFamily: "hermes",
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
    activationPosture: hermesActivationPosture(proofPacket),
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
      "hermes_activation_artifact_is_not_authorization",
      "hermes_activation_artifact_is_not_policy_decision",
      "hermes_activation_artifact_is_not_gateway_check",
      "hermes_activation_artifact_is_not_signer_use",
      "hermes_activation_artifact_is_not_payment_material",
      "hermes_activation_artifact_is_not_live_host_mutation",
      "hermes_activation_artifact_is_not_host_wide_containment",
      "hermes_activation_artifact_is_not_native_host_certification",
    ]),
  });
}

function hermesX402ProtectedToolHostFixtureManifest(
  input: z.infer<typeof HermesX402ProtectedToolActivationInputSchema>,
): HostFixtureManifest {
  return HostFixtureManifestSchema.parse({
    manifestKind: "host_fixture_manifest",
    manifestVersion: "v1",
    manifestId: `host_fixture_x402_hermes_${input.activationId}`,
    host: {
      hostId: "host_hermes_tool_packet",
      hostKind: "mcp_stdio",
      hostVersionRef: `hermes-tool-packet:${input.packageIdentifier}@${input.packageVersion}`,
      hostToolDigest: input.hostToolDigest,
    },
    environment: {
      environmentId: "env_hermes_x402",
      environmentKind: "local_dev",
      environmentRef: "environment:hermes:x402",
    },
    adapter: {
      adapterId: "adapter_pack_x402_protected_tool_hermes",
      adapterVersion: input.packageVersion,
    },
    action: {
      actionClass: "x402_payment.exact",
      protectedSurfaceKind: "x402_payment",
      resourceRef: input.profileInput.facadeInput.endpointUrl,
    },
    protectedPath: {
      protectedPathId: "protected_path_hermes_x402_tool_packet",
      configuredWrapperPath: `${input.toolPacketConfigTarget}#toolPacket.${input.toolPacketName}`,
      resolvedWrapperPath: `${input.toolPacketConfigTarget}#toolPacket.${input.toolPacketName}`,
      wrapperDigest: input.configDigest,
      toolListDigest: input.toolListDigest,
      rawSiblingCandidates: hermesRawSiblingCandidates(input.profileInput.facadeInput.endpointUrl),
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
      redactionPolicyRef: "redaction:hermes-x402-host-bypass-proof:v1",
      sensitiveValuesIncluded: false,
      preservesEnforcementDistinctions: true,
    },
    nonClaims: [
      ...requiredHostHarnessNonClaims,
      "not_live_hermes_tool_packet_mutation",
      "not_hermes_host_wide_containment",
      "not_hermes_native_host_certification",
      "not_unmanaged_tool_packet_control",
      "not_raw_x402_ecosystem_protection",
    ],
  });
}

function hermesRawSiblingCandidates(endpointUrl: string): HostFixtureManifest["protectedPath"]["rawSiblingCandidates"] {
  return [
    {
      routeId: "raw_sibling_hermes_shell_x402_fetch",
      displayName: "Hermes can attempt a raw x402 fetch command outside the tool packet",
      invocationKind: "shell_command",
      commandRef: `x402-fetch ${endpointUrl}`,
      expectedOutcome: "refused_or_detected",
    },
    {
      routeId: "raw_sibling_hermes_tool_packet_direct_payment",
      displayName: "Hermes can attempt a direct payment tool beside the protected wrapper",
      invocationKind: "mcp_tool",
      commandRef: `hermes.tool.invoke x402.directPayment ${endpointUrl}`,
      expectedOutcome: "refused_or_detected",
    },
    {
      routeId: "raw_sibling_hermes_unmanaged_tool_packet",
      displayName: "Hermes can load an unmanaged x402 tool packet beside the protected wrapper",
      invocationKind: "mcp_tool",
      commandRef: "hermes.tool-packet.json#toolPacket.unmanaged_x402",
      expectedOutcome: "refused_or_detected",
    },
  ];
}

function defaultHermesRawSiblingResults(manifest: HostFixtureManifest): HostRawSiblingProbeResult[] {
  return manifest.protectedPath.rawSiblingCandidates.map((candidate, index) => ({
    routeId: candidate.routeId,
    resultKind: index === 0 ? "refused" : "detected",
    probeKind: index === 0 ? "raw_sibling_blocking" : "mcp_direct_call_blocking",
    evidenceRefs: [`evidence:hermes-x402-activation:${candidate.routeId}`],
    proofGapReasonCodes: [],
  }));
}

function hermesActivationPosture(
  packet: HostBypassProofPacket,
): HermesX402ProtectedToolActivationArtifact["activationPosture"] {
  if (packet.postureState === "READY") return "host_specific_ready";
  if (packet.postureState === "PROOF_GAP") return "host_specific_proof_gap";
  return "host_specific_not_ready";
}

function hermesActivationProofGaps(
  profileOutcome: HermesX402ProtectedToolActivationArtifact["profileOutcome"],
  proofPacket: HostBypassProofPacket,
  harnessReport: HostBypassHarnessReport,
): string[] {
  return unique([
    ...(profileOutcome === "profile_prepared" ? [] : ["hermes_profile_not_ready"]),
    ...proofPacket.proofGapReasonCodes,
    ...harnessReport.proofGapReasonCodes,
    "live_user_hermes_tool_packet_write_not_performed_by_demo",
    "hermes_host_wide_containment_not_claimed",
    "hermes_native_host_behavior_not_claimed",
    "hermes_unmanaged_tool_packet_control_not_claimed",
  ]).sort();
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}
