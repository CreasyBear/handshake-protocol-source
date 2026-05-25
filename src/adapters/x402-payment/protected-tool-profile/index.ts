import { z } from "zod";
import { DigestSchema, ReasonCodeSchema } from "../../../protocol/foundation/schema-core";
import {
  prepareProtectedX402ToolDispatch,
  ProtectedX402ToolFacadeInputSchema,
  type ProtectedX402ToolFacadeResult,
  X402_PROTECTED_TOOL_NAME,
} from "../protected-tool-facade";
import {
  X402ProtectedToolReadinessSnapshotSchema,
  x402ProtectedToolReadinessAuthorityBoundary,
  type X402_PROTECTED_TOOL_READINESS_VERSION,
  type X402ProtectedToolReadinessAuthorityBoundary,
  type X402ProtectedToolReadinessSnapshot,
} from "../protected-tool-readiness";

const ProfileRefSchema = z.string().min(1).max(500);
const ProfileIdSchema = z.string().min(1).max(160);
const ProfileSmallListSchema = <T extends z.ZodTypeAny>(schema: T) => z.array(schema).max(32);

export const X402_PROTECTED_TOOL_PROFILE_VERSION = "handshake.adapter.x402-protected-tool-profile.v1" as const;

export const X402ProtectedToolHostFamilySchema = z.enum([
  "codex_local",
  "claude_code_mcp",
  "hermes",
  "openclaw",
  "generic_mcp",
]);
export type X402ProtectedToolHostFamily = z.infer<typeof X402ProtectedToolHostFamilySchema>;

export const X402ProtectedToolHostBypassPostureSchema = z.enum([
  "profile_scoped_only",
  "raw_sibling_paths_named",
  "raw_sibling_paths_not_controlled",
  "host_hooks_advisory_only",
  "host_behavior_unverified",
  "host_wide_containment_not_claimed",
]);
export type X402ProtectedToolHostBypassPosture = z.infer<typeof X402ProtectedToolHostBypassPostureSchema>;

export const X402ProtectedToolGatewayReadinessSnapshotSchema = X402ProtectedToolReadinessSnapshotSchema;
export type X402ProtectedToolGatewayReadinessSnapshot = X402ProtectedToolReadinessSnapshot;

export const ProtectedX402ToolHostProfileInputSchema = z.strictObject({
  schemaVersion: z.literal(X402_PROTECTED_TOOL_PROFILE_VERSION).default(X402_PROTECTED_TOOL_PROFILE_VERSION),
  profileId: ProfileIdSchema,
  hostFamily: X402ProtectedToolHostFamilySchema,
  hostProfileRef: ProfileRefSchema,
  runtimeAdapterRef: ProfileRefSchema,
  toolCatalogDigest: DigestSchema,
  metadataDigest: DigestSchema,
  gatewayReadiness: X402ProtectedToolGatewayReadinessSnapshotSchema,
  facadeInput: ProtectedX402ToolFacadeInputSchema,
  transcriptRef: ProfileRefSchema.nullable().default(null),
  evidenceRefs: ProfileSmallListSchema(ProfileRefSchema).default([]),
});
export type ProtectedX402ToolHostProfileInput = z.input<typeof ProtectedX402ToolHostProfileInputSchema>;

export const X402ProtectedToolHostProfileAuthorityBoundarySchema = z.strictObject({
  createsAuthority: z.literal(false),
  createsPolicyDecision: z.literal(false),
  createsGreenlight: z.literal(false),
  performsGatewayCheck: z.literal(false),
  performsMutation: z.literal(false),
  resolvesCredential: z.literal(false),
  invokesSigner: z.literal(false),
  createsPaymentMaterial: z.literal(false),
  createsPaymentSignature: z.literal(false),
  exportsReceipt: z.literal(false),
  mintsTerminalCertificate: z.literal(false),
  claimsHostWideContainment: z.literal(false),
  claimsSettlement: z.literal(false),
  claimsProviderCustody: z.literal(false),
  claimsHostedOperation: z.literal(false),
  certifiesMarketplace: z.literal(false),
  establishesCrossOrgTrust: z.literal(false),
});
export type X402ProtectedToolHostProfileAuthorityBoundary = z.infer<
  typeof X402ProtectedToolHostProfileAuthorityBoundarySchema
>;

export const x402ProtectedToolHostProfileAuthorityBoundary = X402ProtectedToolHostProfileAuthorityBoundarySchema.parse({
  createsAuthority: false,
  createsPolicyDecision: false,
  createsGreenlight: false,
  performsGatewayCheck: false,
  performsMutation: false,
  resolvesCredential: false,
  invokesSigner: false,
  createsPaymentMaterial: false,
  createsPaymentSignature: false,
  exportsReceipt: false,
  mintsTerminalCertificate: false,
  claimsHostWideContainment: false,
  claimsSettlement: false,
  claimsProviderCustody: false,
  claimsHostedOperation: false,
  certifiesMarketplace: false,
  establishesCrossOrgTrust: false,
});

const HostProfileInstallSurfaceSchema = z.enum([
  "codex_local_profile",
  "claude_code_managed_mcp",
  "hermes_tool_packet",
  "openclaw_tool_packet",
  "generic_mcp_stdio",
]);

const HostProfileTransportSchema = z.enum(["local_profile", "managed_mcp", "tool_packet", "stdio_mcp"]);

export const X402ProtectedToolHostProfileDescriptorSchema = z.strictObject({
  hostFamily: X402ProtectedToolHostFamilySchema,
  installSurface: HostProfileInstallSurfaceSchema,
  transport: HostProfileTransportSchema,
  toolName: z.literal(X402_PROTECTED_TOOL_NAME),
  hostBypassPosture: z.array(X402ProtectedToolHostBypassPostureSchema).min(1),
  rawSiblingPosture: z.enum(["named_not_controlled", "unknown"]),
  hostWideContainmentClaimed: z.literal(false),
  runtimeExclusiveClaimed: z.literal(false),
});
export type X402ProtectedToolHostProfileDescriptor = z.infer<typeof X402ProtectedToolHostProfileDescriptorSchema>;

const X402ProtectedToolHostProfileTranscriptStepSchema = z.strictObject({
  step: z.enum(["host_profile_selected", "gateway_readiness_checked", "facade_preflight"]),
  status: z.enum(["passed", "blocked", "skipped"]),
  reasonCodes: z.array(ReasonCodeSchema),
  evidenceRefs: z.array(ProfileRefSchema),
});
export type X402ProtectedToolHostProfileTranscriptStep = z.infer<
  typeof X402ProtectedToolHostProfileTranscriptStepSchema
>;

export type X402ProtectedToolHostProfileOutcome =
  | "profile_prepared"
  | "profile_not_ready"
  | "facade_challenge"
  | "profile_invalid";

export type X402ProtectedToolHostProfileNextAction =
  | "read_evidence"
  | "register_control_plane_install"
  | "fix_install"
  | "reload_metadata"
  | "wait_for_gateway"
  | "recraft_request"
  | "stop";

export type X402ProtectedToolHostProfileResult = {
  schemaVersion: typeof X402_PROTECTED_TOOL_PROFILE_VERSION;
  profileId: string;
  hostFamily: X402ProtectedToolHostFamily | "unknown";
  hostProfileRef: string | null;
  runtimeAdapterRef: string | null;
  toolName: typeof X402_PROTECTED_TOOL_NAME;
  actionClass: "x402_payment.exact";
  protectedSurfaceKind: "x402_payment";
  outcome: X402ProtectedToolHostProfileOutcome;
  nextAction: X402ProtectedToolHostProfileNextAction;
  profileDescriptor: X402ProtectedToolHostProfileDescriptor | null;
  readinessContractVersion: typeof X402_PROTECTED_TOOL_READINESS_VERSION | null;
  gatewayReadinessRef: string | null;
  gatewayReadinessDigest: string | null;
  readinessProofLevel: X402ProtectedToolGatewayReadinessSnapshot["readinessProofLevel"];
  gatewayCredentialRefDigest: string | null;
  gatewayCredentialCustodyStatus: X402ProtectedToolGatewayReadinessSnapshot["gatewayCredentialCustodyStatus"];
  gatewayCustodyProofPacketRef: string | null;
  gatewayCustodyProofPacketDigest: string | null;
  gatewayCustodyClaimLevel: X402ProtectedToolGatewayReadinessSnapshot["gatewayCustodyClaimLevel"];
  gatewayCustodyExternalVerificationStatus: X402ProtectedToolGatewayReadinessSnapshot["gatewayCustodyExternalVerificationStatus"];
  gatewayCustodyProofExpiresAt: string | null;
  gatewayId: string | null;
  policyVersionRef: string | null;
  rawSiblingPosture: X402ProtectedToolGatewayReadinessSnapshot["rawSiblingPosture"] | null;
  readinessAuthorityBoundary: X402ProtectedToolReadinessAuthorityBoundary;
  facadeInvoked: boolean;
  facadeOutcome: ProtectedX402ToolFacadeResult["outcome"] | null;
  facadeResult: ProtectedX402ToolFacadeResult | null;
  runtimeIngressBlock: ProtectedX402ToolFacadeResult["runtimeIngressBlock"];
  transcriptRef: string | null;
  transcript: X402ProtectedToolHostProfileTranscriptStep[];
  authorityCreated: false;
  greenlightCreated: false;
  gatewayCheckPerformed: false;
  mutationAttempted: false;
  credentialMaterialIncluded: false;
  mutationCommandIncluded: false;
  rawInternalRecordIncluded: false;
  receiptExportCreated: false;
  authorityCertificateMinted: false;
  authorityBoundary: X402ProtectedToolHostProfileAuthorityBoundary;
  reasonCodes: string[];
  challengeRef: string | null;
  evidenceRefs: string[];
  nonClaims: readonly string[];
};

export function buildProtectedX402ToolHostProfile(inputValue: unknown): X402ProtectedToolHostProfileResult {
  const parsed = ProtectedX402ToolHostProfileInputSchema.safeParse(inputValue);
  if (!parsed.success) return invalidProfileResult();

  const input = parsed.data;
  const descriptor = descriptorForHost(input.hostFamily);
  const readinessReasonCodes = readinessReasonCodesFor(input.gatewayReadiness);
  if (readinessReasonCodes.length > 0) {
    return baseProfileResult({
      input,
      descriptor,
      outcome: "profile_not_ready",
      nextAction:
        input.gatewayReadiness.requiredNextMechanism === "register_control_plane_install"
          ? "register_control_plane_install"
          : "fix_install",
      reasonCodes: readinessReasonCodes,
      facadeInvoked: false,
      facadeResult: null,
      transcript: [
        transcriptStep("host_profile_selected", "passed", [], input.evidenceRefs),
        transcriptStep(
          "gateway_readiness_checked",
          "blocked",
          readinessReasonCodes,
          input.gatewayReadiness.evidenceRefs,
        ),
        transcriptStep("facade_preflight", "skipped", readinessReasonCodes, []),
      ],
    });
  }

  const readinessBindingReasonCodes = readinessBindingReasonCodesFor(input.gatewayReadiness, input.facadeInput);
  if (readinessBindingReasonCodes.length > 0) {
    return baseProfileResult({
      input,
      descriptor,
      outcome: "profile_not_ready",
      nextAction: "fix_install",
      reasonCodes: readinessBindingReasonCodes,
      facadeInvoked: false,
      facadeResult: null,
      transcript: [
        transcriptStep("host_profile_selected", "passed", [], input.evidenceRefs),
        transcriptStep(
          "gateway_readiness_checked",
          "blocked",
          readinessBindingReasonCodes,
          input.gatewayReadiness.evidenceRefs,
        ),
        transcriptStep("facade_preflight", "skipped", readinessBindingReasonCodes, []),
      ],
    });
  }

  const facadeResult = prepareProtectedX402ToolDispatch(input.facadeInput);
  const outcome = facadeResult.outcome === "dispatch_block_prepared" ? "profile_prepared" : "facade_challenge";
  return baseProfileResult({
    input,
    descriptor,
    outcome,
    nextAction: facadeResult.nextAction,
    reasonCodes: facadeResult.reasonCodes,
    facadeInvoked: true,
    facadeResult,
    transcript: [
      transcriptStep("host_profile_selected", "passed", [], input.evidenceRefs),
      transcriptStep("gateway_readiness_checked", "passed", [], input.gatewayReadiness.evidenceRefs),
      transcriptStep(
        "facade_preflight",
        facadeResult.outcome === "dispatch_block_prepared" ? "passed" : "blocked",
        facadeResult.reasonCodes,
        facadeResult.evidenceRefs,
      ),
    ],
  });
}

function baseProfileResult(input: {
  input: z.infer<typeof ProtectedX402ToolHostProfileInputSchema>;
  descriptor: X402ProtectedToolHostProfileDescriptor;
  outcome: Exclude<X402ProtectedToolHostProfileOutcome, "profile_invalid">;
  nextAction: X402ProtectedToolHostProfileNextAction;
  reasonCodes: string[];
  facadeInvoked: boolean;
  facadeResult: ProtectedX402ToolFacadeResult | null;
  transcript: X402ProtectedToolHostProfileTranscriptStep[];
}): X402ProtectedToolHostProfileResult {
  const reasonCodes = unique(input.reasonCodes);
  const evidenceRefs = unique([
    ...input.input.evidenceRefs,
    ...input.input.gatewayReadiness.evidenceRefs,
    ...(input.facadeResult?.evidenceRefs ?? []),
  ]);
  return {
    schemaVersion: X402_PROTECTED_TOOL_PROFILE_VERSION,
    profileId: input.input.profileId,
    hostFamily: input.input.hostFamily,
    hostProfileRef: input.input.hostProfileRef,
    runtimeAdapterRef: input.input.runtimeAdapterRef,
    toolName: X402_PROTECTED_TOOL_NAME,
    actionClass: "x402_payment.exact",
    protectedSurfaceKind: "x402_payment",
    outcome: input.outcome,
    nextAction: input.nextAction,
    profileDescriptor: input.descriptor,
    readinessContractVersion: input.input.gatewayReadiness.schemaVersion,
    gatewayReadinessRef: input.input.gatewayReadiness.gatewayReadinessRef,
    gatewayReadinessDigest: input.input.gatewayReadiness.gatewayReadinessDigest,
    readinessProofLevel: input.input.gatewayReadiness.readinessProofLevel,
    gatewayCredentialRefDigest: input.input.gatewayReadiness.gatewayCredentialRefDigest,
    gatewayCredentialCustodyStatus: input.input.gatewayReadiness.gatewayCredentialCustodyStatus,
    gatewayCustodyProofPacketRef: input.input.gatewayReadiness.gatewayCustodyProofPacketRef,
    gatewayCustodyProofPacketDigest: input.input.gatewayReadiness.gatewayCustodyProofPacketDigest,
    gatewayCustodyClaimLevel: input.input.gatewayReadiness.gatewayCustodyClaimLevel,
    gatewayCustodyExternalVerificationStatus: input.input.gatewayReadiness.gatewayCustodyExternalVerificationStatus,
    gatewayCustodyProofExpiresAt: input.input.gatewayReadiness.gatewayCustodyProofExpiresAt,
    gatewayId: input.input.gatewayReadiness.gatewayId,
    policyVersionRef: input.input.gatewayReadiness.policyVersionRef,
    rawSiblingPosture: input.input.gatewayReadiness.rawSiblingPosture,
    readinessAuthorityBoundary: input.input.gatewayReadiness.authorityBoundary,
    facadeInvoked: input.facadeInvoked,
    facadeOutcome: input.facadeResult?.outcome ?? null,
    facadeResult: input.facadeResult,
    runtimeIngressBlock: input.facadeResult?.runtimeIngressBlock ?? null,
    transcriptRef: input.input.transcriptRef,
    transcript: input.transcript,
    authorityCreated: false,
    greenlightCreated: false,
    gatewayCheckPerformed: false,
    mutationAttempted: false,
    credentialMaterialIncluded: false,
    mutationCommandIncluded: false,
    rawInternalRecordIncluded: false,
    receiptExportCreated: false,
    authorityCertificateMinted: false,
    authorityBoundary: x402ProtectedToolHostProfileAuthorityBoundary,
    reasonCodes,
    challengeRef:
      input.outcome === "profile_prepared"
        ? null
        : `handshake://challenges/x402-protected-tool-profile/${encodeURIComponent(input.input.profileId)}`,
    evidenceRefs,
    nonClaims: x402ProtectedToolHostProfileNonClaims,
  };
}

function invalidProfileResult(): X402ProtectedToolHostProfileResult {
  return {
    schemaVersion: X402_PROTECTED_TOOL_PROFILE_VERSION,
    profileId: "invalid",
    hostFamily: "unknown",
    hostProfileRef: null,
    runtimeAdapterRef: null,
    toolName: X402_PROTECTED_TOOL_NAME,
    actionClass: "x402_payment.exact",
    protectedSurfaceKind: "x402_payment",
    outcome: "profile_invalid",
    nextAction: "recraft_request",
    profileDescriptor: null,
    readinessContractVersion: null,
    gatewayReadinessRef: null,
    gatewayReadinessDigest: null,
    readinessProofLevel: "none",
    gatewayCredentialRefDigest: null,
    gatewayCredentialCustodyStatus: "missing",
    gatewayCustodyProofPacketRef: null,
    gatewayCustodyProofPacketDigest: null,
    gatewayCustodyClaimLevel: "proof_gap",
    gatewayCustodyExternalVerificationStatus: "required_before_live_claim",
    gatewayCustodyProofExpiresAt: null,
    gatewayId: null,
    policyVersionRef: null,
    rawSiblingPosture: null,
    readinessAuthorityBoundary: x402ProtectedToolReadinessAuthorityBoundary,
    facadeInvoked: false,
    facadeOutcome: null,
    facadeResult: null,
    runtimeIngressBlock: null,
    transcriptRef: null,
    transcript: [],
    authorityCreated: false,
    greenlightCreated: false,
    gatewayCheckPerformed: false,
    mutationAttempted: false,
    credentialMaterialIncluded: false,
    mutationCommandIncluded: false,
    rawInternalRecordIncluded: false,
    receiptExportCreated: false,
    authorityCertificateMinted: false,
    authorityBoundary: x402ProtectedToolHostProfileAuthorityBoundary,
    reasonCodes: ["protected_x402_input_schema_invalid"],
    challengeRef: "handshake://challenges/x402-protected-tool-profile/invalid",
    evidenceRefs: [],
    nonClaims: x402ProtectedToolHostProfileNonClaims,
  };
}

function readinessReasonCodesFor(readiness: X402ProtectedToolGatewayReadinessSnapshot): string[] {
  const reasonCodes = [...readiness.proofGapReasonCodes];
  if (readiness.readinessStatus !== "trusted_gateway_ready" || !readiness.trustedReadiness) {
    reasonCodes.push("protected_x402_install_not_ready");
  }
  if (readiness.readinessProofLevel !== "control_plane_registration") {
    reasonCodes.push("protected_x402_trusted_readiness_missing");
  }
  if (readiness.requiredNextMechanism !== "ready_for_runtime_facade") {
    reasonCodes.push("protected_x402_install_not_ready");
  }
  if (
    readiness.gatewayReadinessRef === null ||
    readiness.gatewayReadinessDigest === null ||
    readiness.readinessExpiresAt === null ||
    readiness.installDigest === null ||
    readiness.probePostureDigest === null ||
    readiness.paymentRequirementsDigest === null ||
    readiness.selectedPaymentRequirementDigest === null ||
    readiness.gatewayId === null ||
    readiness.gatewayRegistrationRef === null ||
    readiness.gatewayCredentialRefDigest === null ||
    readiness.gatewayCustodyProofPacketRef === null ||
    readiness.gatewayCustodyProofPacketDigest === null ||
    readiness.gatewayCustodyProofExpiresAt === null ||
    readiness.policyVersionRef === null ||
    readiness.policyVersionDigest === null ||
    readiness.gatewayRegistryEntryRef === null ||
    readiness.operatingEnvelopeRef === null
  ) {
    reasonCodes.push("protected_x402_install_not_ready");
  }
  if (
    readiness.gatewayCredentialCustodyStatus === "agent_exposed" ||
    readiness.gatewayCredentialCustodyStatus === "unknown" ||
    (readiness.trustedReadiness &&
      !["gateway_held", "fixture_gateway_held"].includes(readiness.gatewayCredentialCustodyStatus))
  ) {
    reasonCodes.push("protected_x402_credential_custody_unsafe");
  }
  reasonCodes.push(...custodyProofReasonCodesForReadiness(readiness));
  if (readiness.gatewayPosture === "offline" || (readiness.trustedReadiness && readiness.gatewayPosture !== "online")) {
    reasonCodes.push("protected_x402_gateway_offline");
  }
  return unique(reasonCodes).sort();
}

function custodyProofReasonCodesForReadiness(readiness: X402ProtectedToolGatewayReadinessSnapshot): string[] {
  const reasonCodes: string[] = [];
  if (
    readiness.gatewayCustodyProofPacketRef === null ||
    readiness.gatewayCustodyProofPacketDigest === null ||
    readiness.gatewayCustodyProofExpiresAt === null ||
    readiness.gatewayCustodyClaimLevel === "proof_gap"
  ) {
    reasonCodes.push("protected_x402_custody_proof_missing");
  }
  if (
    readiness.gatewayCredentialCustodyStatus === "gateway_held" &&
    (readiness.gatewayCustodyClaimLevel === "local_fixture" ||
      readiness.gatewayCustodyExternalVerificationStatus !== "verified_by_official_source")
  ) {
    reasonCodes.push("protected_x402_custody_proof_unverified");
  }
  if (
    readiness.gatewayCredentialCustodyStatus === "fixture_gateway_held" &&
    (readiness.gatewayCustodyClaimLevel !== "local_fixture" ||
      readiness.gatewayCustodyExternalVerificationStatus !== "not_required")
  ) {
    reasonCodes.push("protected_x402_custody_proof_unverified");
  }
  if (
    readiness.gatewayCustodyProofExpiresAt !== null &&
    readiness.readinessExpiresAt !== null &&
    Date.parse(readiness.gatewayCustodyProofExpiresAt) < Date.parse(readiness.readinessExpiresAt)
  ) {
    reasonCodes.push("protected_x402_custody_proof_stale");
  }
  return reasonCodes;
}

function readinessBindingReasonCodesFor(
  readiness: X402ProtectedToolGatewayReadinessSnapshot,
  facadeInput: z.infer<typeof ProtectedX402ToolFacadeInputSchema>,
): string[] {
  const expectedPairs: Array<[unknown, unknown]> = [
    [readiness.schemaVersion, facadeInput.readinessContractVersion],
    [readiness.gatewayReadinessRef, facadeInput.gatewayReadinessRef],
    [readiness.gatewayReadinessDigest, facadeInput.gatewayReadinessDigest],
    [readiness.readinessProofLevel, facadeInput.readinessProofLevel],
    [readiness.readinessExpiresAt, facadeInput.readinessExpiresAt],
    [readiness.installDigest, facadeInput.installDigest],
    [readiness.probePostureDigest, facadeInput.probePostureDigest],
    [readiness.paymentRequirementsDigest, facadeInput.paymentRequirementsDigest],
    [readiness.selectedPaymentRequirementDigest, facadeInput.selectedPaymentRequirementDigest],
    [readiness.gatewayId, facadeInput.gatewayId],
    [readiness.gatewayRegistrationRef, facadeInput.gatewayRegistrationRef],
    [readiness.gatewayCredentialRefDigest, facadeInput.gatewayCredentialRefDigest],
    [readiness.gatewayCredentialCustodyStatus, facadeInput.gatewayCredentialCustodyStatus],
    [readiness.gatewayCustodyProofPacketRef, facadeInput.gatewayCustodyProofPacketRef],
    [readiness.gatewayCustodyProofPacketDigest, facadeInput.gatewayCustodyProofPacketDigest],
    [readiness.gatewayCustodyClaimLevel, facadeInput.gatewayCustodyClaimLevel],
    [readiness.gatewayCustodyExternalVerificationStatus, facadeInput.gatewayCustodyExternalVerificationStatus],
    [readiness.gatewayCustodyProofExpiresAt, facadeInput.gatewayCustodyProofExpiresAt],
    [readiness.gatewayPosture, facadeInput.gatewayPosture],
    [readiness.policyVersionRef, facadeInput.policyVersionRef],
    [readiness.policyVersionDigest, facadeInput.policyVersionDigest],
    [readiness.gatewayRegistryEntryRef, facadeInput.gatewayRegistryEntryId],
    [readiness.operatingEnvelopeRef, facadeInput.operatingEnvelopeId],
    [readiness.rawCredentialRefsIncluded, facadeInput.rawCredentialRefsIncluded],
    [readiness.rawSiblingPosture, facadeInput.rawSiblingPosture],
  ];
  const arrayPairs: Array<[unknown[], unknown[]]> = [[readiness.rawSiblingProofRefs, facadeInput.rawSiblingProofRefs]];
  const authorityBoundaryMismatch =
    JSON.stringify(readiness.authorityBoundary) !== JSON.stringify(facadeInput.readinessAuthorityBoundary);
  const arrayMismatch = arrayPairs.some(([expected, actual]) => JSON.stringify(expected) !== JSON.stringify(actual));
  return expectedPairs.some(([expected, actual]) => expected !== actual) || arrayMismatch || authorityBoundaryMismatch
    ? ["protected_x402_readiness_binding_mismatch"]
    : [];
}

function descriptorForHost(hostFamily: X402ProtectedToolHostFamily): X402ProtectedToolHostProfileDescriptor {
  const shared = {
    toolName: X402_PROTECTED_TOOL_NAME,
    hostWideContainmentClaimed: false,
    runtimeExclusiveClaimed: false,
  } as const;
  if (hostFamily === "codex_local") {
    return X402ProtectedToolHostProfileDescriptorSchema.parse({
      ...shared,
      hostFamily,
      installSurface: "codex_local_profile",
      transport: "local_profile",
      hostBypassPosture: [
        "profile_scoped_only",
        "raw_sibling_paths_named",
        "raw_sibling_paths_not_controlled",
        "host_wide_containment_not_claimed",
      ],
      rawSiblingPosture: "named_not_controlled",
    });
  }
  if (hostFamily === "claude_code_mcp") {
    return X402ProtectedToolHostProfileDescriptorSchema.parse({
      ...shared,
      hostFamily,
      installSurface: "claude_code_managed_mcp",
      transport: "managed_mcp",
      hostBypassPosture: [
        "profile_scoped_only",
        "raw_sibling_paths_named",
        "raw_sibling_paths_not_controlled",
        "host_hooks_advisory_only",
        "host_wide_containment_not_claimed",
      ],
      rawSiblingPosture: "named_not_controlled",
    });
  }
  if (hostFamily === "hermes") {
    return X402ProtectedToolHostProfileDescriptorSchema.parse({
      ...shared,
      hostFamily,
      installSurface: "hermes_tool_packet",
      transport: "tool_packet",
      hostBypassPosture: ["profile_scoped_only", "host_behavior_unverified", "host_wide_containment_not_claimed"],
      rawSiblingPosture: "unknown",
    });
  }
  if (hostFamily === "openclaw") {
    return X402ProtectedToolHostProfileDescriptorSchema.parse({
      ...shared,
      hostFamily,
      installSurface: "openclaw_tool_packet",
      transport: "tool_packet",
      hostBypassPosture: ["profile_scoped_only", "host_behavior_unverified", "host_wide_containment_not_claimed"],
      rawSiblingPosture: "unknown",
    });
  }
  return X402ProtectedToolHostProfileDescriptorSchema.parse({
    ...shared,
    hostFamily,
    installSurface: "generic_mcp_stdio",
    transport: "stdio_mcp",
    hostBypassPosture: [
      "profile_scoped_only",
      "raw_sibling_paths_not_controlled",
      "host_behavior_unverified",
      "host_wide_containment_not_claimed",
    ],
    rawSiblingPosture: "unknown",
  });
}

function transcriptStep(
  step: X402ProtectedToolHostProfileTranscriptStep["step"],
  status: X402ProtectedToolHostProfileTranscriptStep["status"],
  reasonCodes: string[],
  evidenceRefs: string[],
): X402ProtectedToolHostProfileTranscriptStep {
  return X402ProtectedToolHostProfileTranscriptStepSchema.parse({
    step,
    status,
    reasonCodes: unique(reasonCodes),
    evidenceRefs: unique(evidenceRefs),
  });
}

const x402ProtectedToolHostProfileNonClaims = [
  "host profile installation is not authorization",
  "host profile installation is not host-wide containment",
  "protected-tool readiness is pre-contract posture, not permission",
  "raw sibling posture is bypass evidence, not host-wide containment",
  "runtime tool visibility is not a policy decision",
  "runtime tool visibility is not a greenlight",
  "runtime tool visibility is not a gateway check",
  "runtime tool visibility is not signer use",
  "runtime tool visibility is not payment settlement",
  "raw sibling host paths remain outside this profile unless separately probed",
  "host hooks are bypass evidence only unless the gateway owns the mutation credential",
] as const;

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
