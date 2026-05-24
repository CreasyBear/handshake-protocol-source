import { z } from "zod";
import { requiredGatewayCheckedBypassProbeKinds, type BypassProbeKind } from "../../protocol/areas/bypass-probe";
import { digestCanonical } from "../../protocol/foundation/canonical";
import {
  DigestSchema,
  IdSchema,
  IsoDateSchema,
  PROTOCOL_VERSION,
  type JsonValue,
} from "../../protocol/foundation/schema-core";
import {
  InstallProposalCompiledKernelRecordsSchema,
  InstallProposalSchema,
  type InstallProposalCompiledKernelRecords,
} from "../../install/install-proposal";
import { ProtectedActionAdapterPackSchema } from "../../install/protected-action-adapter-pack";

const AtomicAmountSchema = z.string().regex(/^(?:0|[1-9]\d*)$/);

const X402InstallRefusalReason = {
  amountExceedsCallBound: "x402_amount_exceeds_call_bound",
  domainNotAllowed: "x402_domain_not_allowed",
  networkNotAllowed: "x402_network_not_allowed",
  payeeNotAllowed: "x402_payee_not_allowed",
  tokenNotAllowed: "x402_token_not_allowed",
  walletNetworkNotSupported: "x402_wallet_network_not_supported",
  walletSignerNotGatewayHeld: "x402_wallet_signer_not_gateway_held",
  walletTokenNotSupported: "x402_wallet_token_not_supported",
  wildcardBoundsRefused: "x402_wildcard_bounds_refused",
} as const;

export const x402PaymentExactAdapterPack = ProtectedActionAdapterPackSchema.parse({
  adapterPackId: "adapter_pack_x402_payment_exact",
  adapterPackVersion: "v1",
  actionFamily: "x402_payment.exact",
  protectedSurfaceKind: "x402_payment",
  parameterSchemaRef: "schema:x402-payment-exact-parameters:v1",
  endpointEvidenceSchemaRef: "schema:x402-payment-required-evidence:v1",
  installCompilerRef: "compiler:x402-payment-exact-install-proposal:v1",
  policyRulePackRef: "policy:x402-payment-exact:v1",
  gatewayObservedParameterValidatorRef: "validator:x402-wallet-gateway-observed-parameters:v1",
  receiptEvidenceMapperRef: "receipt-mapper:x402-wallet-gateway:v1",
  bypassProbeKinds: requiredGatewayCheckedBypassProbeKinds satisfies BypassProbeKind[],
  hostileFixtureRefs: [
    "fixture:x402:raw-private-key-env",
    "fixture:x402:sibling-buyer-wrapper",
    "fixture:x402:changed-payment-requirements",
    "fixture:x402:missing-payment-response",
    "fixture:x402:lifecycle-or-deploy-hook-side-effect",
  ],
});

export const X402EndpointEvidenceSchema = z.strictObject({
  endpointUrl: z.string().url(),
  payee: z.string().min(1),
  network: z.string().min(1),
  token: z.string().min(1),
  maxAtomicAmount: AtomicAmountSchema,
  paymentRequirementsDigest: DigestSchema,
  facilitatorRef: z.string().min(1).nullable().default(null),
  evidenceRefs: z.array(z.string().min(1)).default([]),
});
export type X402EndpointEvidence = z.infer<typeof X402EndpointEvidenceSchema>;

export const X402WalletGatewayProfileSchema = z.strictObject({
  walletGatewayId: IdSchema,
  gatewayId: IdSchema,
  gatewayAdapterId: IdSchema.default("adapter_x402_wallet_gateway"),
  gatewayAdapterVersion: z.string().min(1).default("v1"),
  signerCustodyStatus: z.enum(["gateway_held", "fixture_gateway_held", "agent_exposed", "unknown"]),
  signerRef: z.string().min(1),
  authorityHolderRef: z.string().min(1),
  supportedNetworks: z.array(z.string().min(1)),
  supportedTokens: z.array(z.string().min(1)),
});
export type X402WalletGatewayProfile = z.infer<typeof X402WalletGatewayProfileSchema>;

export const X402SpendBoundsSchema = z.strictObject({
  principalId: IdSchema,
  agentId: IdSchema,
  runtimeAdapterId: IdSchema,
  objectiveRef: z.string().min(1),
  allowedDomains: z.array(z.string().min(1)),
  allowedPayees: z.array(z.string().min(1)),
  allowedNetworks: z.array(z.string().min(1)),
  allowedTokens: z.array(z.string().min(1)),
  maxAtomicAmountPerCall: AtomicAmountSchema,
  maxAtomicAmountPerSession: AtomicAmountSchema,
  maxAtomicAmountPerDay: AtomicAmountSchema,
  reviewThresholdAtomicAmount: AtomicAmountSchema,
  spendWindowEnforcementStatus: z.literal("not_enforced_local_metadata").default("not_enforced_local_metadata"),
  issuedAt: IsoDateSchema,
  expiresAt: IsoDateSchema,
});
export type X402SpendBounds = z.infer<typeof X402SpendBoundsSchema>;

export const X402InstallProposalInputSchema = z.strictObject({
  tenantId: IdSchema,
  organizationId: IdSchema,
  createdAt: IsoDateSchema,
  toolCatalogId: IdSchema.default("tool_catalog_x402"),
  toolCatalogVersion: z.string().min(1).default("v1"),
  actionCatalogId: IdSchema.default("action_catalog_x402"),
  actionCatalogVersion: z.string().min(1).default("v1"),
  gatewayRegistryVersion: z.string().min(1).default("v1"),
  endpointEvidence: X402EndpointEvidenceSchema,
  walletGatewayProfile: X402WalletGatewayProfileSchema,
  spendBounds: X402SpendBoundsSchema,
});
export type X402InstallProposalInput = z.input<typeof X402InstallProposalInputSchema>;

export const X402InstallProposalSchema = InstallProposalSchema.extend({
  actionFamily: z.literal("x402_payment.exact"),
  protectedSurfaceKind: z.literal("x402_payment"),
  endpointDomain: z.string().min(1),
  endpointEvidence: X402EndpointEvidenceSchema,
  walletGatewayProfile: X402WalletGatewayProfileSchema,
  spendBounds: X402SpendBoundsSchema,
});
export type X402InstallProposal = z.infer<typeof X402InstallProposalSchema>;

export async function compileX402InstallProposal(inputValue: X402InstallProposalInput): Promise<X402InstallProposal> {
  const input = X402InstallProposalInputSchema.parse(inputValue);
  const endpointDomain = domainFromUrl(input.endpointEvidence.endpointUrl);
  const resourceRef = x402PaymentResourceRef({
    endpointUrl: input.endpointEvidence.endpointUrl,
    network: input.endpointEvidence.network,
    payee: input.endpointEvidence.payee,
  });
  const installDigest = await digestCanonical({
    adapterPackId: x402PaymentExactAdapterPack.adapterPackId,
    endpointEvidence: input.endpointEvidence,
    walletGatewayProfile: input.walletGatewayProfile,
    spendBounds: input.spendBounds,
  } satisfies JsonValue);
  const suffix = installDigest.slice("sha256:".length, "sha256:".length + 20);
  const refusalReasonCodes = refusalReasons(input, endpointDomain);
  const common = {
    installProposalId: `install_x402_${suffix}`,
    schemaVersion: PROTOCOL_VERSION,
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    createdAt: input.createdAt,
    adapterPackId: x402PaymentExactAdapterPack.adapterPackId,
    adapterPackVersion: x402PaymentExactAdapterPack.adapterPackVersion,
    actionFamily: "x402_payment.exact" as const,
    protectedSurfaceKind: "x402_payment" as const,
    endpointDomain,
    resourceRef,
    humanSummary: buildHumanSummary(input, endpointDomain),
    endpointEvidence: input.endpointEvidence,
    walletGatewayProfile: input.walletGatewayProfile,
    spendBounds: input.spendBounds,
    policyPackRef: `policy:x402-payment-exact:${suffix}`,
    policyPackVersion: "v1",
    bypassProbePlan: requiredGatewayCheckedBypassProbeKinds.map((probeKind) => ({
      probeKind,
      requiredSourceAuthority: probeKind === "credential_custody" ? "gateway_probe" : "runtime_probe",
      mustPassBeforeGatewayCheckedPosture: true,
    })),
    receiptExpectationRefs: [
      "evidence:x402-payment-required",
      "evidence:x402-payment-signature",
      "evidence:x402-payment-response-or-proof-gap",
    ],
    installDigest,
  };

  if (refusalReasonCodes.length > 0) {
    return X402InstallProposalSchema.parse({
      ...common,
      status: "refused",
      refusalReasonCodes,
      compiledRecords: null,
    });
  }

  return X402InstallProposalSchema.parse({
    ...common,
    status: "ready_to_install",
    refusalReasonCodes: [],
    compiledRecords: buildCompiledKernelRecords(input, endpointDomain, resourceRef, suffix),
  });
}

export function x402PaymentResourceRef(input: { network: string; payee: string; endpointUrl: string }): string {
  return `x402:${input.network}:${input.payee}:${input.endpointUrl}`;
}

function buildCompiledKernelRecords(
  input: z.infer<typeof X402InstallProposalInputSchema>,
  endpointDomain: string,
  resourceRef: string,
  suffix: string,
): InstallProposalCompiledKernelRecords {
  const gateway = input.walletGatewayProfile;
  const bounds = input.spendBounds;
  const base = {
    schemaVersion: PROTOCOL_VERSION,
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    createdAt: input.createdAt,
  };
  return InstallProposalCompiledKernelRecordsSchema.parse({
    toolCapability: {
      ...base,
      toolCapabilityId: `tool_x402_payment_${suffix}`,
      toolCatalogId: input.toolCatalogId,
      toolCatalogVersion: input.toolCatalogVersion,
      runtimeAdapterId: bounds.runtimeAdapterId,
      toolName: "x402 protected fetch",
      toolNamespace: "x402",
      capabilityClass: "network",
      readWriteClassification: "consequential",
      consequentialityDefault: "consequential",
      wrapperStatus: "wrapped",
      rawBypassPossible: true,
      inputSchemaRef: x402PaymentExactAdapterPack.parameterSchemaRef,
      outputSchemaRef: "schema:x402-payment-exact-output:v1",
      secretBearingFields: [],
      supersededAt: null,
    },
    actionType: {
      ...base,
      actionTypeId: `atype_x402_payment_${suffix}`,
      actionCatalogId: input.actionCatalogId,
      actionCatalogVersion: input.actionCatalogVersion,
      actionClass: "x402_payment.exact",
      protectedSurfaceKind: "x402_payment",
      requiredContractFields: ["gatewayId", "resourceRef", "paramsDigest", "idempotencyKey"],
      canonicalParameterSchemaRef: x402PaymentExactAdapterPack.parameterSchemaRef,
      resourceRefSchemaRef: "schema:x402-payment-resource-ref:v1",
      requiredEvidenceTypes: ["x402_payment_required", "x402_payment_signature"],
      allowedBoundsSchemaRef: "schema:x402-payment-bounds:v1",
      defaultReceiptRequirement: "downstream_finality",
      defaultIdempotencyRequirement: "required",
      supersededAt: null,
    },
    gatewayRegistryEntry: {
      ...base,
      gatewayRegistryEntryId: `gateway_registry_x402_${suffix}`,
      gatewayRegistryVersion: input.gatewayRegistryVersion,
      gatewayId: gateway.gatewayId,
      protectedSurfaceKind: "x402_payment",
      gatewayAdapterId: gateway.gatewayAdapterId,
      gatewayAdapterVersion: gateway.gatewayAdapterVersion,
      gateEndpointRef: `internal:x402-wallet-gateway:${gateway.walletGatewayId}`,
      gatewayPolicyContractId: `gateway_policy_x402_${suffix}`,
      gatewayPolicyVersion: "v1",
      gatewayPolicyDriftMode: "refuse_on_drift",
      compatiblePreviousGatewayPolicyVersions: [],
      acceptedActionCatalogVersions: [input.actionCatalogVersion],
      resourceNamespaceRef: `x402:${endpointDomain}`,
      canonicalizerVersion: "handshake-jcs-lite-0.2",
      receiptCapabilityStatus: "available",
      isolationCheckCapabilityStatus: "available",
      credentialCustodyStatus: gateway.signerCustodyStatus,
      enforcementMode:
        gateway.signerCustodyStatus === "fixture_gateway_held" ? "reference_fixture" : "customer_gateway_adapter",
      mutationCredentialHolderRef: gateway.signerRef,
      gatewayAuthorityHolderRef: gateway.authorityHolderRef,
      supersededAt: null,
    },
    operatingEnvelope: {
      ...base,
      envelopeId: `env_x402_payment_${suffix}`,
      principalId: bounds.principalId,
      agentId: bounds.agentId,
      participantIdentityBindings: [],
      objectiveRef: bounds.objectiveRef,
      allowedActionClasses: ["x402_payment.exact"],
      allowedGateways: [gateway.gatewayId],
      allowedResources: [resourceRef],
      requiredProtectedPathState: "gateway_checked",
      evidenceRequirements: ["x402_payment_required", "x402_payment_signature"],
      policyPackRef: `policy:x402-payment-exact:${suffix}`,
      policyPackVersion: "v1",
      issuedAt: bounds.issuedAt,
      expiresAt: bounds.expiresAt,
      revokedAt: null,
    },
  });
}

function refusalReasons(input: z.infer<typeof X402InstallProposalInputSchema>, endpointDomain: string): string[] {
  const reasons: string[] = [];
  const { endpointEvidence, walletGatewayProfile, spendBounds } = input;
  if (!["gateway_held", "fixture_gateway_held"].includes(walletGatewayProfile.signerCustodyStatus)) {
    reasons.push(X402InstallRefusalReason.walletSignerNotGatewayHeld);
  }
  if (containsWildcard(spendBounds.allowedDomains) || containsWildcard(spendBounds.allowedPayees)) {
    reasons.push(X402InstallRefusalReason.wildcardBoundsRefused);
  }
  if (!spendBounds.allowedDomains.includes(endpointDomain)) reasons.push(X402InstallRefusalReason.domainNotAllowed);
  if (!spendBounds.allowedPayees.includes(endpointEvidence.payee))
    reasons.push(X402InstallRefusalReason.payeeNotAllowed);
  if (!spendBounds.allowedNetworks.includes(endpointEvidence.network)) {
    reasons.push(X402InstallRefusalReason.networkNotAllowed);
  }
  if (!spendBounds.allowedTokens.includes(endpointEvidence.token))
    reasons.push(X402InstallRefusalReason.tokenNotAllowed);
  if (!walletGatewayProfile.supportedNetworks.includes(endpointEvidence.network)) {
    reasons.push(X402InstallRefusalReason.walletNetworkNotSupported);
  }
  if (!walletGatewayProfile.supportedTokens.includes(endpointEvidence.token)) {
    reasons.push(X402InstallRefusalReason.walletTokenNotSupported);
  }
  if (compareAtomic(endpointEvidence.maxAtomicAmount, spendBounds.maxAtomicAmountPerCall) > 0) {
    reasons.push(X402InstallRefusalReason.amountExceedsCallBound);
  }
  return [...new Set(reasons)].sort();
}

function buildHumanSummary(input: z.infer<typeof X402InstallProposalInputSchema>, endpointDomain: string): string {
  const { endpointEvidence, walletGatewayProfile, spendBounds } = input;
  return [
    `This agent/runtime may propose x402 payments to ${endpointDomain} for payee ${endpointEvidence.payee}.`,
    `Payments must use ${endpointEvidence.token} on ${endpointEvidence.network} through wallet gateway ${walletGatewayProfile.gatewayId}.`,
    `The enforced per-call bound is ${spendBounds.maxAtomicAmountPerCall} atomic units, session/day/review windows are metadata, and the agent will not receive signing authority.`,
  ].join(" ");
}

function domainFromUrl(value: string): string {
  return new URL(value).hostname;
}

function containsWildcard(values: string[]): boolean {
  return values.some((value) => value === "*" || value.includes("*"));
}

function compareAtomic(left: string, right: string): number {
  const leftValue = BigInt(left);
  const rightValue = BigInt(right);
  return leftValue === rightValue ? 0 : leftValue > rightValue ? 1 : -1;
}
