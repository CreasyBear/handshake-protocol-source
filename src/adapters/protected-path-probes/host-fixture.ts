import { z } from "zod";
import {
  BypassProbeKindSchema,
  DigestSchema,
  IdSchema,
  IsoDateSchema,
  ResourceRefSchema,
} from "../../protocol/public/schemas";

export const HostHarnessPostureStateSchema = z.enum([
  "READY",
  "ADVISORY_ONLY",
  "WRAPPER_MISSING",
  "WRAPPER_DRIFTED",
  "GATEWAY_UNBOUND",
  "RAW_SIBLING_MUTATION_POSSIBLE",
  "STALE_PROBE",
  "HOST_TOOL_DIGEST_CHANGED",
  "PROOF_GAP",
]);
export type HostHarnessPostureState = z.infer<typeof HostHarnessPostureStateSchema>;

export const HostRawSiblingResultKindSchema = z.enum([
  "refused",
  "detected",
  "proof_gap",
  "stop_condition",
  "mutation_possible",
]);
export type HostRawSiblingResultKind = z.infer<typeof HostRawSiblingResultKindSchema>;

export const HostGatewayBindingStatusSchema = z.enum(["bound", "unbound", "advisory_only", "proof_gap"]);
export type HostGatewayBindingStatus = z.infer<typeof HostGatewayBindingStatusSchema>;

export const HostWrapperIntegrityStatusSchema = z.enum(["matched", "missing", "drifted"]);
export type HostWrapperIntegrityStatus = z.infer<typeof HostWrapperIntegrityStatusSchema>;

export const requiredHostHarnessNonClaims = [
  "not_host_wide_containment",
  "not_package_manager_ecosystem_protection",
  "not_cli_mcp_browser_shell_network_protection",
  "not_package_safety",
  "not_x402_ecosystem_coverage",
  "not_report_enforcement",
] as const;

const NonEmptyStringSchema = z.string().min(1);

export const HostRawSiblingCandidateSchema = z.strictObject({
  routeId: IdSchema,
  displayName: NonEmptyStringSchema,
  invocationKind: z.enum(["package_manager_binary", "shell_command", "mcp_tool", "browser_tool", "network_call"]),
  commandRef: NonEmptyStringSchema,
  expectedOutcome: z.literal("refused_or_detected"),
});
export type HostRawSiblingCandidate = z.infer<typeof HostRawSiblingCandidateSchema>;

export const HostFixtureManifestSchema = z
  .strictObject({
    manifestKind: z.literal("host_fixture_manifest"),
    manifestVersion: z.literal("v1"),
    manifestId: IdSchema,
    host: z.strictObject({
      hostId: IdSchema,
      hostKind: z.enum(["local_package_manager", "local_cli", "mcp_stdio", "browser", "cloud_worker"]),
      hostVersionRef: NonEmptyStringSchema,
      hostToolDigest: DigestSchema,
    }),
    environment: z.strictObject({
      environmentId: IdSchema,
      environmentKind: z.enum(["local_dev", "test", "ci", "preview", "production"]),
      environmentRef: NonEmptyStringSchema,
    }),
    adapter: z.strictObject({
      adapterId: IdSchema,
      adapterVersion: NonEmptyStringSchema,
    }),
    action: z.strictObject({
      actionClass: NonEmptyStringSchema,
      protectedSurfaceKind: NonEmptyStringSchema,
      resourceRef: ResourceRefSchema,
    }),
    protectedPath: z.strictObject({
      protectedPathId: IdSchema,
      configuredWrapperPath: NonEmptyStringSchema,
      resolvedWrapperPath: NonEmptyStringSchema,
      wrapperDigest: DigestSchema,
      toolListDigest: DigestSchema,
      rawSiblingCandidates: z.array(HostRawSiblingCandidateSchema).min(1),
    }),
    registry: z.strictObject({
      gatewayRegistryEntryId: IdSchema,
      gatewayId: IdSchema,
      gatewayRegistryDigest: DigestSchema,
    }),
    policy: z.strictObject({
      policyRef: NonEmptyStringSchema,
      policyDigest: DigestSchema,
    }),
    freshness: z.strictObject({
      observedAt: IsoDateSchema,
      expiresAt: IsoDateSchema,
      maxAgeMs: z.number().int().positive(),
    }),
    expectedPosture: z.literal("gateway_checked"),
    redaction: z.strictObject({
      redactionPolicyRef: NonEmptyStringSchema,
      sensitiveValuesIncluded: z.literal(false),
      preservesEnforcementDistinctions: z.literal(true),
    }),
    nonClaims: z.array(NonEmptyStringSchema),
  })
  .superRefine((manifest, context) => {
    for (const nonClaim of requiredHostHarnessNonClaims) {
      if (!manifest.nonClaims.includes(nonClaim)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nonClaims"],
          message: `Host fixture manifest must include ${nonClaim}.`,
        });
      }
    }
  });
export type HostFixtureManifest = z.infer<typeof HostFixtureManifestSchema>;

export const HostRawSiblingProbeResultSchema = z.strictObject({
  routeId: IdSchema,
  resultKind: HostRawSiblingResultKindSchema,
  probeKind: BypassProbeKindSchema,
  evidenceRefs: z.array(NonEmptyStringSchema),
  proofGapReasonCodes: z.array(NonEmptyStringSchema).default([]),
});
export type HostRawSiblingProbeResult = z.infer<typeof HostRawSiblingProbeResultSchema>;

export const HostBypassProofPacketInputSchema = z.strictObject({
  manifest: HostFixtureManifestSchema,
  observedAt: IsoDateSchema,
  observedResolvedWrapperPath: NonEmptyStringSchema.nullable(),
  observedWrapperDigest: DigestSchema.nullable(),
  observedHostToolDigest: DigestSchema.nullable(),
  gatewayBindingStatus: HostGatewayBindingStatusSchema,
  oneUseGreenlightObserved: z.boolean(),
  gatewayCheckObserved: z.boolean(),
  downstreamExecutionRecordedSeparately: z.boolean(),
  rawSiblingResults: z.array(HostRawSiblingProbeResultSchema).min(1),
  evidenceRefs: z.array(NonEmptyStringSchema),
  proofGapReasonCodes: z.array(NonEmptyStringSchema).default([]),
});
export type HostBypassProofPacketInput = z.infer<typeof HostBypassProofPacketInputSchema>;

export const HostBypassProofPacketSchema = z.strictObject({
  packetKind: z.literal("host_specific_bypass_proof_packet"),
  packetVersion: z.literal("v1"),
  manifestId: IdSchema,
  host: HostFixtureManifestSchema.shape.host,
  environment: HostFixtureManifestSchema.shape.environment,
  adapter: HostFixtureManifestSchema.shape.adapter,
  action: HostFixtureManifestSchema.shape.action,
  protectedPath: HostFixtureManifestSchema.shape.protectedPath,
  registry: HostFixtureManifestSchema.shape.registry,
  policy: HostFixtureManifestSchema.shape.policy,
  wrapperIntegrity: z.strictObject({
    status: HostWrapperIntegrityStatusSchema,
    configuredWrapperPath: NonEmptyStringSchema,
    expectedResolvedWrapperPath: NonEmptyStringSchema,
    observedResolvedWrapperPath: NonEmptyStringSchema.nullable(),
    expectedWrapperDigest: DigestSchema,
    observedWrapperDigest: DigestSchema.nullable(),
  }),
  freshness: z.strictObject({
    status: z.enum(["fresh", "stale", "proof_gap"]),
    observedAt: IsoDateSchema,
    expiresAt: IsoDateSchema,
    toolListDigest: DigestSchema,
    observedHostToolDigest: DigestSchema.nullable(),
  }),
  gatewayBinding: z.strictObject({
    status: HostGatewayBindingStatusSchema,
    gatewayCheckObserved: z.boolean(),
    oneUseGreenlightObserved: z.boolean(),
    downstreamExecutionRecordedSeparately: z.boolean(),
  }),
  rawSiblingResults: z.array(HostRawSiblingProbeResultSchema),
  postureState: HostHarnessPostureStateSchema,
  evidenceRefs: z.array(NonEmptyStringSchema),
  proofGapReasonCodes: z.array(NonEmptyStringSchema),
  redaction: HostFixtureManifestSchema.shape.redaction,
  nonClaims: z.array(NonEmptyStringSchema),
});
export type HostBypassProofPacket = z.infer<typeof HostBypassProofPacketSchema>;

export const HostBypassHarnessReportSchema = z.strictObject({
  reportKind: z.literal("host_bypass_harness_report"),
  manifestId: IdSchema,
  postureState: HostHarnessPostureStateSchema,
  protectedPath: z.strictObject({
    protectedPathId: IdSchema,
    configuredWrapperPath: NonEmptyStringSchema,
    resolvedWrapperPath: NonEmptyStringSchema,
    toolListDigest: DigestSchema,
  }),
  wrapperIntegrityStatus: HostWrapperIntegrityStatusSchema,
  gatewayBindingStatus: HostGatewayBindingStatusSchema,
  probeFreshnessStatus: z.enum(["fresh", "stale", "proof_gap"]),
  rawSiblingAttempts: z.array(HostRawSiblingProbeResultSchema),
  evidenceRefs: z.array(NonEmptyStringSchema),
  proofGapReasonCodes: z.array(NonEmptyStringSchema),
  authority: z.strictObject({
    reportAuthority: z.literal(false),
    cliAuthority: z.literal(false),
    mcpAuthority: z.literal(false),
    hostWideAuthority: z.literal(false),
  }),
  nonClaims: z.array(NonEmptyStringSchema),
});
export type HostBypassHarnessReport = z.infer<typeof HostBypassHarnessReportSchema>;

export function deriveHostBypassProofPacket(inputValue: HostBypassProofPacketInput): HostBypassProofPacket {
  const input = HostBypassProofPacketInputSchema.parse(inputValue);
  const wrapperIntegrityStatus = deriveWrapperIntegrityStatus(input);
  const freshnessStatus = deriveFreshnessStatus(input);
  const proofGapReasonCodes = [...input.proofGapReasonCodes];
  appendDerivedReasonCodes(proofGapReasonCodes, input, wrapperIntegrityStatus, freshnessStatus);
  const postureState = deriveHostHarnessPostureState(
    input,
    wrapperIntegrityStatus,
    freshnessStatus,
    proofGapReasonCodes,
  );

  return HostBypassProofPacketSchema.parse({
    packetKind: "host_specific_bypass_proof_packet",
    packetVersion: "v1",
    manifestId: input.manifest.manifestId,
    host: input.manifest.host,
    environment: input.manifest.environment,
    adapter: input.manifest.adapter,
    action: input.manifest.action,
    protectedPath: input.manifest.protectedPath,
    registry: input.manifest.registry,
    policy: input.manifest.policy,
    wrapperIntegrity: {
      status: wrapperIntegrityStatus,
      configuredWrapperPath: input.manifest.protectedPath.configuredWrapperPath,
      expectedResolvedWrapperPath: input.manifest.protectedPath.resolvedWrapperPath,
      observedResolvedWrapperPath: input.observedResolvedWrapperPath,
      expectedWrapperDigest: input.manifest.protectedPath.wrapperDigest,
      observedWrapperDigest: input.observedWrapperDigest,
    },
    freshness: {
      status: freshnessStatus,
      observedAt: input.observedAt,
      expiresAt: input.manifest.freshness.expiresAt,
      toolListDigest: input.manifest.protectedPath.toolListDigest,
      observedHostToolDigest: input.observedHostToolDigest,
    },
    gatewayBinding: {
      status: input.gatewayBindingStatus,
      gatewayCheckObserved: input.gatewayCheckObserved,
      oneUseGreenlightObserved: input.oneUseGreenlightObserved,
      downstreamExecutionRecordedSeparately: input.downstreamExecutionRecordedSeparately,
    },
    rawSiblingResults: input.rawSiblingResults,
    postureState,
    evidenceRefs: input.evidenceRefs,
    proofGapReasonCodes: [...new Set(proofGapReasonCodes)].sort(),
    redaction: input.manifest.redaction,
    nonClaims: input.manifest.nonClaims,
  });
}

export function projectHostBypassHarnessReport(packetValue: HostBypassProofPacket): HostBypassHarnessReport {
  const packet = HostBypassProofPacketSchema.parse(packetValue);
  return HostBypassHarnessReportSchema.parse({
    reportKind: "host_bypass_harness_report",
    manifestId: packet.manifestId,
    postureState: packet.postureState,
    protectedPath: {
      protectedPathId: packet.protectedPath.protectedPathId,
      configuredWrapperPath: packet.protectedPath.configuredWrapperPath,
      resolvedWrapperPath: packet.protectedPath.resolvedWrapperPath,
      toolListDigest: packet.protectedPath.toolListDigest,
    },
    wrapperIntegrityStatus: packet.wrapperIntegrity.status,
    gatewayBindingStatus: packet.gatewayBinding.status,
    probeFreshnessStatus: packet.freshness.status,
    rawSiblingAttempts: packet.rawSiblingResults,
    evidenceRefs: packet.evidenceRefs,
    proofGapReasonCodes: packet.proofGapReasonCodes,
    authority: {
      reportAuthority: false,
      cliAuthority: false,
      mcpAuthority: false,
      hostWideAuthority: false,
    },
    nonClaims: packet.nonClaims,
  });
}

function deriveWrapperIntegrityStatus(input: HostBypassProofPacketInput): HostWrapperIntegrityStatus {
  if (!input.observedResolvedWrapperPath || !input.observedWrapperDigest) return "missing";
  if (
    input.observedResolvedWrapperPath !== input.manifest.protectedPath.resolvedWrapperPath ||
    input.observedWrapperDigest !== input.manifest.protectedPath.wrapperDigest
  ) {
    return "drifted";
  }
  return "matched";
}

function deriveFreshnessStatus(input: HostBypassProofPacketInput): HostBypassProofPacket["freshness"]["status"] {
  if (!input.observedHostToolDigest) return "proof_gap";
  if (input.observedHostToolDigest !== input.manifest.host.hostToolDigest) return "stale";
  if (Date.parse(input.observedAt) > Date.parse(input.manifest.freshness.expiresAt)) return "stale";
  return "fresh";
}

function appendDerivedReasonCodes(
  reasonCodes: string[],
  input: HostBypassProofPacketInput,
  wrapperIntegrityStatus: HostWrapperIntegrityStatus,
  freshnessStatus: HostBypassProofPacket["freshness"]["status"],
): void {
  if (wrapperIntegrityStatus === "missing") reasonCodes.push("host_wrapper_missing");
  if (wrapperIntegrityStatus === "drifted") reasonCodes.push("host_wrapper_drifted");
  if (freshnessStatus === "stale") reasonCodes.push("host_fixture_manifest_stale");
  if (freshnessStatus === "proof_gap") reasonCodes.push("host_bypass_proof_gap");
  if (input.observedHostToolDigest && input.observedHostToolDigest !== input.manifest.host.hostToolDigest) {
    reasonCodes.push("host_tool_digest_changed");
  }
  if (input.gatewayBindingStatus === "unbound") reasonCodes.push("host_gateway_unbound");
  if (input.gatewayBindingStatus === "advisory_only") reasonCodes.push("host_probe_advisory_only");
  if (input.gatewayBindingStatus === "proof_gap") reasonCodes.push("host_bypass_proof_gap");
  if (!input.gatewayCheckObserved || !input.oneUseGreenlightObserved || !input.downstreamExecutionRecordedSeparately) {
    reasonCodes.push("host_probe_advisory_only");
  }
  for (const result of input.rawSiblingResults) {
    if (result.resultKind === "mutation_possible" || result.resultKind === "stop_condition") {
      reasonCodes.push("host_raw_sibling_mutation_possible");
    }
    if (result.resultKind === "proof_gap" || result.proofGapReasonCodes.length > 0) {
      reasonCodes.push("host_bypass_proof_gap", ...result.proofGapReasonCodes);
    }
  }
}

function deriveHostHarnessPostureState(
  input: HostBypassProofPacketInput,
  wrapperIntegrityStatus: HostWrapperIntegrityStatus,
  freshnessStatus: HostBypassProofPacket["freshness"]["status"],
  proofGapReasonCodes: readonly string[],
): HostHarnessPostureState {
  if (wrapperIntegrityStatus === "missing") return "WRAPPER_MISSING";
  if (wrapperIntegrityStatus === "drifted") return "WRAPPER_DRIFTED";
  if (input.observedHostToolDigest && input.observedHostToolDigest !== input.manifest.host.hostToolDigest) {
    return "HOST_TOOL_DIGEST_CHANGED";
  }
  if (freshnessStatus === "stale") return "STALE_PROBE";
  if (input.gatewayBindingStatus === "unbound") return "GATEWAY_UNBOUND";
  if (
    input.rawSiblingResults.some(
      (result) => result.resultKind === "mutation_possible" || result.resultKind === "stop_condition",
    )
  ) {
    return "RAW_SIBLING_MUTATION_POSSIBLE";
  }
  if (input.gatewayBindingStatus === "proof_gap" || freshnessStatus === "proof_gap") return "PROOF_GAP";
  if (input.rawSiblingResults.some((result) => result.resultKind === "proof_gap")) return "PROOF_GAP";
  if (input.gatewayBindingStatus === "advisory_only") return "ADVISORY_ONLY";
  if (!input.gatewayCheckObserved || !input.oneUseGreenlightObserved || !input.downstreamExecutionRecordedSeparately) {
    return "ADVISORY_ONLY";
  }
  if (proofGapReasonCodes.length > 0) return "PROOF_GAP";
  return "READY";
}
