import { z } from "zod";
import { DigestSchema, ReasonCodeSchema } from "../../../protocol/foundation/schema-core";

const ReadinessIdSchema = z.string().min(1).max(160);
const ReadinessRefSchema = z.string().min(1).max(500);
const ReadinessSmallListSchema = <T extends z.ZodTypeAny>(schema: T) => z.array(schema).max(32);

export const X402_PROTECTED_TOOL_READINESS_VERSION = "handshake.adapter.x402-protected-tool-readiness.v1" as const;

export const X402ProtectedToolReadinessRawSiblingPostureSchema = z.enum(["named_not_controlled", "unknown"]);
export type X402ProtectedToolReadinessRawSiblingPosture = z.infer<
  typeof X402ProtectedToolReadinessRawSiblingPostureSchema
>;

export const X402ProtectedToolReadinessAuthorityBoundarySchema = z.strictObject({
  readinessScope: z.literal("pre_contract"),
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
  claimsHostedOperation: z.literal(false),
  claimsProviderCustody: z.literal(false),
  claimsSettlement: z.literal(false),
  claimsHostWideContainment: z.literal(false),
  certifiesMarketplace: z.literal(false),
});
export type X402ProtectedToolReadinessAuthorityBoundary = z.infer<
  typeof X402ProtectedToolReadinessAuthorityBoundarySchema
>;

export const x402ProtectedToolReadinessAuthorityBoundary = X402ProtectedToolReadinessAuthorityBoundarySchema.parse({
  readinessScope: "pre_contract",
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
  claimsHostedOperation: false,
  claimsProviderCustody: false,
  claimsSettlement: false,
  claimsHostWideContainment: false,
  certifiesMarketplace: false,
});

export const X402ProtectedToolReadinessSnapshotSchema = z.strictObject({
  schemaVersion: z.literal(X402_PROTECTED_TOOL_READINESS_VERSION).default(X402_PROTECTED_TOOL_READINESS_VERSION),
  readinessStatus: z.enum(["not_ready", "local_posture_evidence_present", "trusted_gateway_ready"]),
  readinessScope: z.literal("pre_contract").default("pre_contract"),
  readinessProofLevel: z
    .enum(["none", "local_compilation", "local_classification", "control_plane_registration"])
    .default("none"),
  trustedReadiness: z.boolean(),
  requiredNextMechanism: z.enum([
    "initialize_project",
    "compile_install",
    "record_probe_report",
    "register_control_plane_install",
    "ready_for_runtime_facade",
  ]),
  gatewayReadinessRef: ReadinessRefSchema.nullable(),
  gatewayReadinessDigest: DigestSchema.nullable().default(null),
  readinessExpiresAt: z.string().datetime({ offset: true }).nullable().default(null),
  installDigest: DigestSchema.nullable().default(null),
  probePostureDigest: DigestSchema.nullable().default(null),
  paymentRequirementsDigest: DigestSchema.nullable().default(null),
  selectedPaymentRequirementDigest: DigestSchema.nullable().default(null),
  gatewayId: ReadinessIdSchema.nullable(),
  gatewayRegistrationRef: ReadinessRefSchema.nullable().default(null),
  gatewayCredentialRefDigest: DigestSchema.nullable().default(null),
  gatewayCredentialCustodyStatus: z
    .enum(["gateway_held", "fixture_gateway_held", "agent_exposed", "unknown", "missing"])
    .default("missing"),
  gatewayCustodyProofPacketRef: ReadinessRefSchema.nullable().default(null),
  gatewayCustodyProofPacketDigest: DigestSchema.nullable().default(null),
  gatewayCustodyClaimLevel: z
    .enum(["local_fixture", "customer_gateway_evidence", "provider_gateway_evidence", "proof_gap"])
    .default("proof_gap"),
  gatewayCustodyExternalVerificationStatus: z
    .enum(["not_required", "required_before_live_claim", "verified_by_official_source"])
    .default("required_before_live_claim"),
  gatewayCustodyProofExpiresAt: z.string().datetime({ offset: true }).nullable().default(null),
  gatewayPosture: z.enum(["online", "offline", "unknown"]).default("unknown"),
  policyVersionRef: ReadinessRefSchema.nullable(),
  policyVersionDigest: DigestSchema.nullable().default(null),
  gatewayRegistryEntryRef: ReadinessRefSchema.nullable().default(null),
  operatingEnvelopeRef: ReadinessRefSchema.nullable().default(null),
  rawCredentialRefsIncluded: z.literal(false).default(false),
  rawSiblingPosture: X402ProtectedToolReadinessRawSiblingPostureSchema.default("unknown"),
  rawSiblingProofRefs: ReadinessSmallListSchema(ReadinessRefSchema).default([]),
  authorityBoundary: X402ProtectedToolReadinessAuthorityBoundarySchema.default(
    x402ProtectedToolReadinessAuthorityBoundary,
  ),
  proofGapReasonCodes: z.array(ReasonCodeSchema).default([]),
  evidenceRefs: ReadinessSmallListSchema(ReadinessRefSchema).default([]),
});
export type X402ProtectedToolReadinessSnapshot = z.infer<typeof X402ProtectedToolReadinessSnapshotSchema>;
