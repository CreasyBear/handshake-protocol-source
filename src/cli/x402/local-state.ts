import { z } from "zod";
import { X402ProtectedToolReadinessSnapshotSchema } from "../../adapters/x402-payment/protected-tool-readiness";
import { BypassProbeKindSchema, BypassProbeOutcomeSchema } from "../../protocol/areas/bypass-probe";
import { DigestSchema, IsoDateSchema, ReasonCodeSchema } from "../../protocol/foundation/schema-core";

export const CLI_X402_INSTALL_RECORD_SCHEMA_VERSION = "handshake.cli.x402-install.v1" as const;
export const CLI_X402_PROBE_REPORT_SCHEMA_VERSION = "handshake.cli.x402-probe-report.v1" as const;
export const CLI_X402_GATEWAY_READINESS_SCHEMA_VERSION = "handshake.cli.x402-gateway-readiness.v1" as const;
export const CLI_X402_READINESS_REPORT_SCHEMA_VERSION = "handshake.cli.x402-readiness.v1" as const;

export const LocalX402InstallRecordSchema = z.strictObject({
  schemaVersion: z.literal(CLI_X402_INSTALL_RECORD_SCHEMA_VERSION),
  projectId: z.string().min(1),
  recordedAt: IsoDateSchema,
  installProposalRef: z.string().min(1),
  installDigest: DigestSchema,
  installStatus: z.enum(["ready_to_install", "refused"]),
  adapterPackId: z.literal("adapter_pack_x402_payment_exact"),
  actionClass: z.literal("x402_payment.exact"),
  protectedSurfaceKind: z.literal("x402_payment"),
  resourceRef: z.string().min(1),
  endpointDomain: z.string().min(1),
  paymentRequirementsDigest: DigestSchema,
  selectedPaymentRequirementIndex: z.number().int().nonnegative().nullable(),
  selectedPaymentRequirementDigest: DigestSchema.nullable(),
  perCallAmountBound: z.string().regex(/^(?:0|[1-9]\d*)$/),
  spendWindowEnforcementStatus: z.literal("not_enforced_local_metadata"),
  gatewayAuthorityRefDigest: DigestSchema,
  paymentCredentialRefDigest: DigestSchema,
  credentialCustodyStatus: z.enum(["gateway_held", "fixture_gateway_held", "agent_exposed", "unknown"]),
  rawCredentialRefsIncluded: z.literal(false),
  unsupportedX402Surfaces: z.array(z.string().min(1)),
  refusalReasonCodes: z.array(ReasonCodeSchema),
  compiledRecordsIncluded: z.literal(false),
  compiledRecordRefs: z
    .strictObject({
      toolCapabilityRef: z.string().min(1),
      actionTypeRef: z.string().min(1),
      gatewayRegistryEntryRef: z.string().min(1),
      operatingEnvelopeRef: z.string().min(1),
    })
    .nullable(),
  readinessAuthority: z.literal("local_compilation"),
  trustedInstallReadiness: z.literal(false),
  nextReadinessAction: z.literal("register_control_plane_install"),
  controlPlaneRegistrationRequired: z.literal(true),
  controlPlaneRegistrationPerformed: z.literal(false),
  authorityCreated: z.literal(false),
  gatewayCheckPerformed: z.literal(false),
  mutationAttempted: z.literal(false),
});
export type LocalX402InstallRecord = z.infer<typeof LocalX402InstallRecordSchema>;

export const LocalX402ProbeCoverageSchema = z.strictObject({
  probeKind: BypassProbeKindSchema,
  probeOutcome: BypassProbeOutcomeSchema,
  sourceAuthority: z.literal("local_classification"),
  reasonCodes: z.array(ReasonCodeSchema),
  evidenceRefs: z.array(z.string().min(1)),
});
export type LocalX402ProbeCoverage = z.infer<typeof LocalX402ProbeCoverageSchema>;

export const LocalX402ProbeReportSchema = z.strictObject({
  schemaVersion: z.literal(CLI_X402_PROBE_REPORT_SCHEMA_VERSION),
  projectId: z.string().min(1),
  observedAt: IsoDateSchema,
  expiresAt: IsoDateSchema,
  adapterPackId: z.literal("adapter_pack_x402_payment_exact"),
  actionClass: z.literal("x402_payment.exact"),
  protectedSurfaceKind: z.literal("x402_payment"),
  readinessAuthority: z.literal("local_classification"),
  trustedReadiness: z.literal(false),
  passed: z.boolean(),
  reasonCodes: z.array(ReasonCodeSchema),
  probeCoverage: z.array(LocalX402ProbeCoverageSchema),
  postureDigest: DigestSchema,
  authorityCreated: z.literal(false),
  gatewayCheckPerformed: z.literal(false),
  mutationAttempted: z.literal(false),
});
export type LocalX402ProbeReport = z.infer<typeof LocalX402ProbeReportSchema>;

export const LocalX402GatewayReadinessRecordSchema = z.strictObject({
  schemaVersion: z.literal(CLI_X402_GATEWAY_READINESS_SCHEMA_VERSION),
  projectId: z.string().min(1),
  recordedAt: IsoDateSchema,
  expiresAt: IsoDateSchema,
  readinessScope: z.literal("pre_contract"),
  adapterPackId: z.literal("adapter_pack_x402_payment_exact"),
  actionClass: z.literal("x402_payment.exact"),
  protectedSurfaceKind: z.literal("x402_payment"),
  readinessAuthority: z.literal("control_plane_registration"),
  trustedReadiness: z.literal(true),
  installProposalRef: z.string().min(1),
  installDigest: DigestSchema,
  probeReportRef: z.string().min(1),
  probePostureDigest: DigestSchema,
  paymentRequirementsDigest: DigestSchema,
  selectedPaymentRequirementDigest: DigestSchema,
  protectedToolReadiness: X402ProtectedToolReadinessSnapshotSchema,
  gatewayId: z.string().min(1),
  gatewayRegistrationRef: z.string().min(1).max(500),
  gatewayCredentialRefDigest: DigestSchema,
  gatewayCredentialCustodyStatus: z.enum(["gateway_held", "fixture_gateway_held"]),
  gatewayCustodyProofPacketRef: z.string().min(1).max(500),
  gatewayCustodyProofPacketDigest: DigestSchema,
  gatewayCustodyClaimLevel: z.enum(["local_fixture", "customer_gateway_evidence", "provider_gateway_evidence"]),
  gatewayCustodyExternalVerificationStatus: z.enum([
    "not_required",
    "required_before_live_claim",
    "verified_by_official_source",
  ]),
  gatewayCustodyProofExpiresAt: IsoDateSchema,
  gatewayPosture: z.literal("online"),
  policyVersionRef: z.string().min(1).max(500),
  policyVersionDigest: DigestSchema,
  gatewayRegistryEntryRef: z.string().min(1),
  operatingEnvelopeRef: z.string().min(1),
  evidenceRefs: z.array(z.string().min(1).max(500)).max(32),
  rawCredentialRefsIncluded: z.literal(false),
  controlPlaneRegistrationPerformed: z.literal(true),
  authorityCreated: z.literal(false),
  greenlightCreated: z.literal(false),
  gatewayCheckPerformed: z.literal(false),
  mutationAttempted: z.literal(false),
});
export type LocalX402GatewayReadinessRecord = z.infer<typeof LocalX402GatewayReadinessRecordSchema>;

export const LocalX402ReadinessReportSchema = z.strictObject({
  schemaVersion: z.literal(CLI_X402_READINESS_REPORT_SCHEMA_VERSION),
  readinessScope: z.literal("pre_contract"),
  actionClass: z.literal("x402_payment.exact"),
  protectedSurfaceKind: z.literal("x402_payment"),
  readinessAuthority: z.literal("local_cli"),
  readinessStatus: z.enum(["not_ready", "local_posture_evidence_present", "trusted_gateway_ready"]),
  proofLevel: z.enum(["none", "local_compilation", "local_classification", "control_plane_registration"]),
  trustedReadiness: z.boolean(),
  requiredNextMechanism: z.enum([
    "initialize_project",
    "compile_install",
    "record_probe_report",
    "register_control_plane_install",
    "ready_for_runtime_facade",
  ]),
  gatewayReadinessRef: z.string().min(1).nullable(),
  gatewayId: z.string().min(1).nullable(),
  gatewayCustodyProofPacketRef: z.string().min(1).nullable(),
  policyVersionRef: z.string().min(1).max(500).nullable(),
  protectedToolReadiness: X402ProtectedToolReadinessSnapshotSchema.nullable(),
  checks: z.strictObject({
    projectConfig: z.enum(["present", "missing"]),
    installCompilation: z.enum(["ready_to_install", "refused", "missing"]),
    controlPlaneRegistration: z.enum(["registered", "required_not_performed", "missing"]),
    signerCustody: z.enum(["gateway_held", "fixture_gateway_held", "agent_exposed", "unknown", "missing"]),
    custodyProof: z.enum(["registered", "missing", "unverified", "stale"]),
    gatewayPosture: z.enum([
      "registered_online",
      "local_classification_passed",
      "local_classification_failed",
      "stale",
      "unknown",
    ]),
    policyVersion: z.enum(["registered", "local_metadata_only", "unknown"]),
    probeFreshness: z.enum(["fresh", "stale", "missing"]),
  }),
  proofGapPostures: z.array(
    z.enum([
      "project_config_missing",
      "install_missing",
      "install_refused",
      "probe_missing",
      "probe_failed",
      "probe_stale",
      "control_plane_registration_missing",
      "trusted_gateway_posture_invalid",
      "trusted_gateway_posture_missing",
      "trusted_gateway_posture_stale",
      "custody_proof_missing",
      "custody_proof_unverified",
      "custody_proof_stale",
    ]),
  ),
  proofGapReasonCodes: z.array(ReasonCodeSchema),
  nonClaims: z.array(z.string().min(1)),
  authorityCreated: z.literal(false),
  gatewayCheckPerformed: z.literal(false),
  mutationAttempted: z.literal(false),
});
export type LocalX402ReadinessReport = z.infer<typeof LocalX402ReadinessReportSchema>;
