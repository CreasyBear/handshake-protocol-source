import { z } from "zod";
import type { RuntimeIngressDispatchBlock } from "../../../runtime/ingress";
import {
  X402_PROTECTED_TOOL_READINESS_VERSION,
  X402ProtectedToolReadinessAuthorityBoundarySchema,
  X402ProtectedToolReadinessRawSiblingPostureSchema,
  x402ProtectedToolReadinessAuthorityBoundary,
  type X402ProtectedToolReadinessAuthorityBoundary,
} from "../protected-tool-readiness";

const DigestSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const AtomicAmountSchema = z
  .string()
  .max(78)
  .regex(/^(?:0|[1-9]\d*)$/);
const FacadeIdSchema = z.string().min(1).max(160);
const FacadeRefSchema = z.string().min(1).max(500);
const FacadeUrlSchema = z.string().url().max(2_048);
const FacadeSmallListSchema = <T extends z.ZodTypeAny>(schema: T) => z.array(schema).max(32);

export const X402_PROTECTED_TOOL_FACADE_VERSION = "handshake.runtime.x402-protected-tool-facade.v1" as const;
export const X402_PROTECTED_TOOL_NAME = "handshake.actions.x402_payment.propose" as const;

const X402ProviderEnvironmentPostureSchema = z.enum(["local_reference_sandbox", "external_sandbox", "live", "unknown"]);

const X402RequestBodyPostureSchema = z.enum(["no_body", "digest_bound", "omitted", "unsupported"]);

const GatewayCustodyProofClaimLevelSchema = z.enum([
  "local_fixture",
  "customer_gateway_evidence",
  "provider_gateway_evidence",
  "proof_gap",
]);

const GatewayCustodyExternalVerificationStatusSchema = z.enum([
  "not_required",
  "required_before_live_claim",
  "verified_by_official_source",
]);

export const ProtectedX402ToolFacadeInputSchema = z.strictObject({
  schemaVersion: z.literal(X402_PROTECTED_TOOL_FACADE_VERSION).default(X402_PROTECTED_TOOL_FACADE_VERSION),
  requestId: FacadeIdSchema,
  principalId: FacadeIdSchema,
  agentId: FacadeIdSchema,
  principalIntentRef: FacadeRefSchema,
  generatedCodeOrSpecRef: FacadeRefSchema,
  runtimeAdapterRef: FacadeRefSchema,
  runId: FacadeIdSchema,
  dispatchBoundaryRef: FacadeRefSchema,
  dispatchRef: FacadeRefSchema,
  operatingEnvelopeId: FacadeIdSchema,
  toolCapabilityId: FacadeIdSchema,
  actionTypeId: FacadeIdSchema,
  gatewayRegistryEntryId: FacadeIdSchema,
  gatewayId: FacadeIdSchema,
  policyOwnerRef: FacadeRefSchema,
  evidenceConsumerRef: FacadeRefSchema,
  contractExpiresAt: z.string().datetime({ offset: true }),
  idempotencyKey: FacadeRefSchema,
  metadataDigest: DigestSchema,
  toolCatalogDigest: DigestSchema,
  actionCatalogDigest: DigestSchema,
  gatewayRegistryDigest: DigestSchema,
  metadataFreshness: z.enum(["fresh", "stale", "unknown"]).default("fresh"),
  policyFreshness: z.enum(["fresh", "stale", "unknown"]).default("fresh"),
  installReadiness: z
    .enum(["trusted_gateway_ready", "local_posture_evidence_present", "not_ready", "unknown"])
    .default("unknown"),
  gatewayPosture: z.enum(["online", "offline", "unknown"]).default("unknown"),
  readinessContractVersion: z
    .literal(X402_PROTECTED_TOOL_READINESS_VERSION)
    .default(X402_PROTECTED_TOOL_READINESS_VERSION),
  readinessProofLevel: z
    .enum(["none", "local_compilation", "local_classification", "control_plane_registration"])
    .default("none"),
  gatewayReadinessRef: FacadeRefSchema,
  gatewayReadinessDigest: DigestSchema,
  readinessExpiresAt: z.string().datetime({ offset: true }),
  installDigest: DigestSchema,
  probePostureDigest: DigestSchema,
  gatewayRegistrationRef: FacadeRefSchema,
  gatewayCredentialRefDigest: DigestSchema,
  gatewayCredentialCustodyStatus: z.enum(["gateway_held", "fixture_gateway_held", "agent_exposed", "unknown"]),
  gatewayCustodyProofPacketRef: FacadeRefSchema,
  gatewayCustodyProofPacketDigest: DigestSchema,
  gatewayCustodyClaimLevel: GatewayCustodyProofClaimLevelSchema,
  gatewayCustodyExternalVerificationStatus: GatewayCustodyExternalVerificationStatusSchema,
  gatewayCustodyProofExpiresAt: z.string().datetime({ offset: true }),
  rawSiblingPosture: X402ProtectedToolReadinessRawSiblingPostureSchema.default("unknown"),
  rawSiblingProofRefs: FacadeSmallListSchema(FacadeRefSchema).default([]),
  readinessAuthorityBoundary: X402ProtectedToolReadinessAuthorityBoundarySchema.default(
    x402ProtectedToolReadinessAuthorityBoundary,
  ),
  policyVersionRef: FacadeRefSchema,
  policyVersionDigest: DigestSchema,
  rawCredentialRefsIncluded: z.literal(false).default(false),
  endpointUrl: FacadeUrlSchema,
  payee: FacadeRefSchema,
  payTo: FacadeRefSchema,
  network: FacadeIdSchema,
  token: FacadeIdSchema,
  asset: FacadeIdSchema,
  atomicAmount: AtomicAmountSchema,
  x402EvidenceProfile: z.literal("official_payment_required"),
  paymentRequirementsDigest: DigestSchema,
  paymentRequiredEvidenceRef: FacadeRefSchema,
  facilitatorRef: FacadeRefSchema.nullable().default(null),
  intendedHttpMethod: FacadeIdSchema,
  intendedRequestUrl: FacadeUrlSchema,
  intendedRequestBodyPosture: X402RequestBodyPostureSchema,
  intendedRequestBodyDigest: DigestSchema.nullable(),
  selectedHeadersDigest: DigestSchema,
  providerEnvironmentPosture: X402ProviderEnvironmentPostureSchema,
  providerEnvironmentRef: FacadeRefSchema.nullable(),
  x402Version: z.number().int().positive(),
  x402Scheme: z.literal("exact"),
  maxTimeoutSeconds: z.number().positive(),
  selectedPaymentRequirementIndex: z.number().int().nonnegative(),
  selectedPaymentRequirementDigest: DigestSchema,
  sdkPackageVersions: z
    .record(FacadeIdSchema, FacadeIdSchema)
    .refine((value) => Object.keys(value).length > 0, {
      message: "official x402 facade input requires SDK package version evidence",
    })
    .refine((value) => Object.keys(value).length <= 16, {
      message: "official x402 facade input must keep SDK package version evidence bounded",
    }),
  extensionKeys: FacadeSmallListSchema(FacadeIdSchema).default([]),
  sequenceNumber: z.number().int().positive().default(1),
  loopDetected: z.boolean().default(false),
  retryDetected: z.boolean().default(false),
  branchDetected: z.boolean().default(false),
  correlationRef: FacadeRefSchema.nullable().default(null),
  evidenceRefs: FacadeSmallListSchema(FacadeRefSchema).default([]),
});
export type ProtectedX402ToolFacadeInput = z.input<typeof ProtectedX402ToolFacadeInputSchema>;
type ParsedProtectedX402ToolFacadeInput = z.infer<typeof ProtectedX402ToolFacadeInputSchema>;

type ProtectedX402ToolFacadeOutcome =
  | "dispatch_block_prepared"
  | "install_not_ready"
  | "gateway_offline"
  | "metadata_stale"
  | "refused"
  | "tool_execution_error";

type ProtectedX402ToolFacadeNextAction =
  | "read_evidence"
  | "reload_metadata"
  | "fix_install"
  | "wait_for_gateway"
  | "recraft_request"
  | "stop";

type ProtectedX402ToolFacadeProductBinding = {
  principalId: string;
  agentId: string;
  runtimeAdapterRef: string;
  operatingEnvelopeId: string;
  toolCapabilityId: string;
  actionTypeId: string;
  gatewayRegistryEntryId: string;
  gatewayId: string;
  readinessContractVersion: typeof X402_PROTECTED_TOOL_READINESS_VERSION;
  gatewayReadinessRef: string;
  gatewayReadinessDigest: string;
  readinessProofLevel: "none" | "local_compilation" | "local_classification" | "control_plane_registration";
  readinessExpiresAt: string;
  installDigest: string;
  probePostureDigest: string;
  gatewayRegistrationRef: string;
  gatewayCredentialRefDigest: string;
  gatewayCredentialCustodyStatus: string;
  gatewayCustodyProofPacketRef: string;
  gatewayCustodyProofPacketDigest: string;
  gatewayCustodyClaimLevel: string;
  gatewayCustodyExternalVerificationStatus: string;
  gatewayCustodyProofExpiresAt: string;
  rawSiblingPosture: z.infer<typeof X402ProtectedToolReadinessRawSiblingPostureSchema>;
  readinessAuthorityBoundary: X402ProtectedToolReadinessAuthorityBoundary;
  policyOwnerRef: string;
  policyVersionRef: string;
  policyVersionDigest: string;
  evidenceConsumerRef: string;
  contractExpiresAt: string;
  metadataDigest: string;
  toolCatalogDigest: string;
  actionCatalogDigest: string;
  gatewayRegistryDigest: string;
  policyFreshness: "fresh" | "stale" | "unknown";
};

type ProtectedX402ToolFacadeBase = {
  schemaVersion: typeof X402_PROTECTED_TOOL_FACADE_VERSION;
  toolName: typeof X402_PROTECTED_TOOL_NAME;
  actionClass: "x402_payment.exact";
  protectedSurfaceKind: "x402_payment";
  productBinding: ProtectedX402ToolFacadeProductBinding | null;
  idempotencyKey: string | null;
  outcome: ProtectedX402ToolFacadeOutcome;
  authorityCreated: false;
  greenlightCreated: false;
  gatewayCheckPerformed: false;
  mutationAttempted: false;
  credentialMaterialIncluded: false;
  mutationCommandIncluded: false;
  rawInternalRecordIncluded: false;
  receiptExportCreated: false;
  authorityCertificateMinted: false;
  reasonCodes: string[];
  nextAction: ProtectedX402ToolFacadeNextAction;
  evidenceRefs: string[];
  challengeRef: string | null;
  correlationRef: string | null;
  runtimeIngressBlock: RuntimeIngressDispatchBlock | null;
  nonClaims: readonly string[];
};

export type ProtectedX402ToolFacadeResult =
  | (ProtectedX402ToolFacadeBase & {
      outcome: "dispatch_block_prepared";
      nextAction: "read_evidence";
      runtimeIngressBlock: RuntimeIngressDispatchBlock;
    })
  | (ProtectedX402ToolFacadeBase & {
      outcome: Exclude<ProtectedX402ToolFacadeOutcome, "dispatch_block_prepared">;
      runtimeIngressBlock: null;
    });

export function prepareProtectedX402ToolDispatch(inputValue: unknown): ProtectedX402ToolFacadeResult {
  const parsed = ProtectedX402ToolFacadeInputSchema.safeParse(inputValue);
  if (!parsed.success) {
    return facadeChallenge({
      outcome: "tool_execution_error",
      reasonCodes: ["protected_x402_input_schema_invalid"],
      nextAction: "recraft_request",
      requestId: "invalid",
      evidenceRefs: [],
      correlationRef: null,
    });
  }
  const input = parsed.data;
  const preflightReasonCodes = preflightReasonCodesForInput(input);
  if (preflightReasonCodes.length > 0) return preflightChallenge(input, preflightReasonCodes);

  return {
    ...facadeBase({
      outcome: "dispatch_block_prepared",
      reasonCodes: [],
      nextAction: "read_evidence",
      input,
    }),
    runtimeIngressBlock: runtimeIngressBlockForInput(input),
  };
}

function preflightReasonCodesForInput(input: ParsedProtectedX402ToolFacadeInput): string[] {
  const reasonCodes: string[] = [];
  if (input.metadataFreshness !== "fresh") reasonCodes.push("protected_x402_metadata_stale");
  if (input.policyFreshness !== "fresh") reasonCodes.push("protected_x402_policy_stale");
  if (input.installReadiness !== "trusted_gateway_ready") reasonCodes.push("protected_x402_install_not_ready");
  if (input.readinessProofLevel !== "control_plane_registration") {
    reasonCodes.push("protected_x402_trusted_readiness_missing");
  }
  if (Date.parse(input.readinessExpiresAt) < Date.parse(input.contractExpiresAt)) {
    reasonCodes.push("protected_x402_readiness_proof_stale");
  }
  if (input.gatewayPosture === "offline") reasonCodes.push("protected_x402_gateway_offline");
  if (input.gatewayPosture === "unknown") reasonCodes.push("protected_x402_gateway_posture_unknown");
  if (!["gateway_held", "fixture_gateway_held"].includes(input.gatewayCredentialCustodyStatus)) {
    reasonCodes.push("protected_x402_credential_custody_unsafe");
  }
  reasonCodes.push(...custodyProofReasonCodesForInput(input));
  if (input.intendedRequestBodyPosture === "digest_bound" && input.intendedRequestBodyDigest === null) {
    reasonCodes.push("x402_request_body_digest_missing");
  }
  if (["omitted", "unsupported"].includes(input.intendedRequestBodyPosture)) {
    reasonCodes.push("x402_request_body_posture_unsupported");
  }
  if (input.intendedRequestBodyPosture === "no_body" && input.intendedRequestBodyDigest !== null) {
    reasonCodes.push("x402_request_body_posture_mismatch");
  }
  if (input.providerEnvironmentPosture !== "local_reference_sandbox") {
    reasonCodes.push("x402_provider_environment_not_sandboxed");
  }
  return [...new Set(reasonCodes)].sort();
}

function custodyProofReasonCodesForInput(input: ParsedProtectedX402ToolFacadeInput): string[] {
  const reasonCodes: string[] = [];
  if (input.gatewayCustodyClaimLevel === "proof_gap") {
    reasonCodes.push("protected_x402_custody_proof_missing");
  }
  if (
    input.gatewayCredentialCustodyStatus === "gateway_held" &&
    (input.gatewayCustodyClaimLevel === "local_fixture" ||
      input.gatewayCustodyExternalVerificationStatus !== "verified_by_official_source")
  ) {
    reasonCodes.push("protected_x402_custody_proof_unverified");
  }
  if (
    input.gatewayCredentialCustodyStatus === "fixture_gateway_held" &&
    (input.gatewayCustodyClaimLevel !== "local_fixture" ||
      input.gatewayCustodyExternalVerificationStatus !== "not_required")
  ) {
    reasonCodes.push("protected_x402_custody_proof_unverified");
  }
  if (Date.parse(input.gatewayCustodyProofExpiresAt) < Date.parse(input.contractExpiresAt)) {
    reasonCodes.push("protected_x402_custody_proof_stale");
  }
  return reasonCodes;
}

function preflightChallenge(
  input: ParsedProtectedX402ToolFacadeInput,
  reasonCodes: string[],
): ProtectedX402ToolFacadeResult {
  if (reasonCodes.includes("protected_x402_metadata_stale") || reasonCodes.includes("protected_x402_policy_stale")) {
    return facadeChallenge({ outcome: "metadata_stale", reasonCodes, nextAction: "reload_metadata", input });
  }
  if (
    reasonCodes.includes("protected_x402_install_not_ready") ||
    reasonCodes.includes("protected_x402_trusted_readiness_missing") ||
    reasonCodes.includes("protected_x402_readiness_proof_stale") ||
    reasonCodes.includes("protected_x402_credential_custody_unsafe") ||
    reasonCodes.includes("protected_x402_custody_proof_missing") ||
    reasonCodes.includes("protected_x402_custody_proof_unverified") ||
    reasonCodes.includes("protected_x402_custody_proof_stale")
  ) {
    return facadeChallenge({ outcome: "install_not_ready", reasonCodes, nextAction: "fix_install", input });
  }
  if (reasonCodes.includes("protected_x402_gateway_offline")) {
    return facadeChallenge({ outcome: "gateway_offline", reasonCodes, nextAction: "wait_for_gateway", input });
  }
  if (reasonCodes.includes("protected_x402_gateway_posture_unknown")) {
    return facadeChallenge({ outcome: "tool_execution_error", reasonCodes, nextAction: "stop", input });
  }
  return facadeChallenge({ outcome: "refused", reasonCodes, nextAction: "recraft_request", input });
}

function runtimeIngressBlockForInput(input: ParsedProtectedX402ToolFacadeInput): RuntimeIngressDispatchBlock {
  return {
    principalIntentRef: input.principalIntentRef,
    generatedCodeOrSpecRef: input.generatedCodeOrSpecRef,
    dispatchBoundaryRef: input.dispatchBoundaryRef,
    evidenceRefs: unique([
      input.paymentRequiredEvidenceRef,
      input.gatewayReadinessRef,
      input.gatewayRegistrationRef,
      input.gatewayCustodyProofPacketRef,
      input.policyVersionRef,
      ...input.rawSiblingProofRefs,
      ...input.evidenceRefs,
    ]),
    dispatches: [
      {
        dispatchKind: "wrapped_x402_payment",
        dispatchRef: input.dispatchRef,
        generatedCodeOrSpecRef: input.generatedCodeOrSpecRef,
        evidenceRefs: input.evidenceRefs,
        endpointUrl: input.endpointUrl,
        payee: input.payee,
        network: input.network,
        token: input.token,
        atomicAmount: input.atomicAmount,
        x402EvidenceProfile: input.x402EvidenceProfile,
        paymentRequirementsDigest: input.paymentRequirementsDigest,
        paymentRequiredEvidenceRef: input.paymentRequiredEvidenceRef,
        facilitatorRef: input.facilitatorRef,
        intendedHttpMethod: input.intendedHttpMethod,
        intendedRequestUrl: input.intendedRequestUrl,
        intendedRequestBodyPosture: input.intendedRequestBodyPosture,
        intendedRequestBodyDigest: input.intendedRequestBodyDigest,
        selectedHeadersDigest: input.selectedHeadersDigest,
        providerEnvironmentPosture: input.providerEnvironmentPosture,
        providerEnvironmentRef: input.providerEnvironmentRef,
        x402Version: input.x402Version,
        x402Scheme: input.x402Scheme,
        asset: input.asset,
        payTo: input.payTo,
        maxTimeoutSeconds: input.maxTimeoutSeconds,
        selectedPaymentRequirementIndex: input.selectedPaymentRequirementIndex,
        selectedPaymentRequirementDigest: input.selectedPaymentRequirementDigest,
        sdkPackageVersions: input.sdkPackageVersions,
        extensionKeys: input.extensionKeys,
        ...(input.loopDetected ? { loopIteration: input.sequenceNumber } : {}),
        ...(input.retryDetected ? { retryOfDispatchRef: input.dispatchRef } : {}),
        ...(input.branchDetected ? { branchRef: `${input.dispatchRef}:branch` } : {}),
      },
    ],
  };
}

function facadeBase<
  TOutcome extends ProtectedX402ToolFacadeOutcome,
  TNextAction extends ProtectedX402ToolFacadeNextAction,
>(input: {
  outcome: TOutcome;
  reasonCodes: string[];
  nextAction: TNextAction;
  input: ParsedProtectedX402ToolFacadeInput;
}): ProtectedX402ToolFacadeBase & { outcome: TOutcome; nextAction: TNextAction } {
  return {
    schemaVersion: X402_PROTECTED_TOOL_FACADE_VERSION,
    toolName: X402_PROTECTED_TOOL_NAME,
    actionClass: "x402_payment.exact",
    protectedSurfaceKind: "x402_payment",
    productBinding: {
      principalId: input.input.principalId,
      agentId: input.input.agentId,
      runtimeAdapterRef: input.input.runtimeAdapterRef,
      operatingEnvelopeId: input.input.operatingEnvelopeId,
      toolCapabilityId: input.input.toolCapabilityId,
      actionTypeId: input.input.actionTypeId,
      gatewayRegistryEntryId: input.input.gatewayRegistryEntryId,
      gatewayId: input.input.gatewayId,
      readinessContractVersion: input.input.readinessContractVersion,
      gatewayReadinessRef: input.input.gatewayReadinessRef,
      gatewayReadinessDigest: input.input.gatewayReadinessDigest,
      readinessProofLevel: input.input.readinessProofLevel,
      readinessExpiresAt: input.input.readinessExpiresAt,
      installDigest: input.input.installDigest,
      probePostureDigest: input.input.probePostureDigest,
      gatewayRegistrationRef: input.input.gatewayRegistrationRef,
      gatewayCredentialRefDigest: input.input.gatewayCredentialRefDigest,
      gatewayCredentialCustodyStatus: input.input.gatewayCredentialCustodyStatus,
      gatewayCustodyProofPacketRef: input.input.gatewayCustodyProofPacketRef,
      gatewayCustodyProofPacketDigest: input.input.gatewayCustodyProofPacketDigest,
      gatewayCustodyClaimLevel: input.input.gatewayCustodyClaimLevel,
      gatewayCustodyExternalVerificationStatus: input.input.gatewayCustodyExternalVerificationStatus,
      gatewayCustodyProofExpiresAt: input.input.gatewayCustodyProofExpiresAt,
      rawSiblingPosture: input.input.rawSiblingPosture,
      readinessAuthorityBoundary: input.input.readinessAuthorityBoundary,
      policyOwnerRef: input.input.policyOwnerRef,
      policyVersionRef: input.input.policyVersionRef,
      policyVersionDigest: input.input.policyVersionDigest,
      evidenceConsumerRef: input.input.evidenceConsumerRef,
      contractExpiresAt: input.input.contractExpiresAt,
      metadataDigest: input.input.metadataDigest,
      toolCatalogDigest: input.input.toolCatalogDigest,
      actionCatalogDigest: input.input.actionCatalogDigest,
      gatewayRegistryDigest: input.input.gatewayRegistryDigest,
      policyFreshness: input.input.policyFreshness,
    },
    idempotencyKey: input.input.idempotencyKey,
    outcome: input.outcome,
    authorityCreated: false,
    greenlightCreated: false,
    gatewayCheckPerformed: false,
    mutationAttempted: false,
    credentialMaterialIncluded: false,
    mutationCommandIncluded: false,
    rawInternalRecordIncluded: false,
    receiptExportCreated: false,
    authorityCertificateMinted: false,
    reasonCodes: input.reasonCodes,
    nextAction: input.nextAction,
    evidenceRefs: unique([
      input.input.paymentRequiredEvidenceRef,
      input.input.gatewayReadinessRef,
      input.input.gatewayRegistrationRef,
      input.input.gatewayCustodyProofPacketRef,
      input.input.policyVersionRef,
      ...input.input.rawSiblingProofRefs,
      ...input.input.evidenceRefs,
    ]),
    challengeRef:
      input.outcome === "dispatch_block_prepared"
        ? null
        : `handshake://challenges/x402-protected-tool/${encodeURIComponent(input.input.requestId)}`,
    correlationRef: input.input.correlationRef,
    runtimeIngressBlock: null,
    nonClaims: protectedX402FacadeNonClaims,
  };
}

function facadeChallenge(input: {
  outcome: Exclude<ProtectedX402ToolFacadeOutcome, "dispatch_block_prepared">;
  reasonCodes: string[];
  nextAction: Exclude<ProtectedX402ToolFacadeNextAction, "read_evidence">;
  input?: ParsedProtectedX402ToolFacadeInput;
  requestId?: string;
  evidenceRefs?: string[];
  correlationRef?: string | null;
}): ProtectedX402ToolFacadeResult {
  if (input.input) {
    return {
      ...facadeBase({
        outcome: input.outcome,
        reasonCodes: input.reasonCodes,
        nextAction: input.nextAction,
        input: input.input,
      }),
      runtimeIngressBlock: null,
    };
  }
  const requestId = input.requestId ?? "invalid";
  return {
    schemaVersion: X402_PROTECTED_TOOL_FACADE_VERSION,
    toolName: X402_PROTECTED_TOOL_NAME,
    actionClass: "x402_payment.exact",
    protectedSurfaceKind: "x402_payment",
    productBinding: null,
    idempotencyKey: null,
    outcome: input.outcome,
    authorityCreated: false,
    greenlightCreated: false,
    gatewayCheckPerformed: false,
    mutationAttempted: false,
    credentialMaterialIncluded: false,
    mutationCommandIncluded: false,
    rawInternalRecordIncluded: false,
    receiptExportCreated: false,
    authorityCertificateMinted: false,
    reasonCodes: input.reasonCodes,
    nextAction: input.nextAction,
    evidenceRefs: input.evidenceRefs ?? [],
    challengeRef: `handshake://challenges/x402-protected-tool/${encodeURIComponent(requestId)}`,
    correlationRef: input.correlationRef ?? null,
    runtimeIngressBlock: null,
    nonClaims: protectedX402FacadeNonClaims,
  };
}

const protectedX402FacadeNonClaims = [
  "tool facade visibility is not authorization",
  "protected-tool readiness is pre-contract gateway posture, not permission",
  "raw sibling posture is bypass evidence, not host-wide containment",
  "custody proof packet visibility is not signer access",
  "runtime dispatch preparation is not policy evaluation",
  "runtime dispatch preparation is not a greenlight",
  "runtime dispatch preparation is not a gateway check",
  "runtime dispatch preparation is not signer use",
  "runtime dispatch preparation is not payment settlement",
  "aggregate spend-window enforcement remains unsupported",
] as const;

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
