import { z } from "zod";
import { BypassProbeKindSchema, BypassProbeOutcomeSchema } from "../../protocol/areas/bypass-probe";
import { DigestSchema, IsoDateSchema, ReasonCodeSchema } from "../../protocol/foundation/schema-core";

export const CLI_X402_INSTALL_RECORD_SCHEMA_VERSION = "handshake.cli.x402-install.v1" as const;
export const CLI_X402_PROBE_REPORT_SCHEMA_VERSION = "handshake.cli.x402-probe-report.v1" as const;

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
  spendWindowEnforcementStatus: z.literal("not_enforced_tier1_metadata"),
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
