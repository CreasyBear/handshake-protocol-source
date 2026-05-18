import { z } from "zod";
import { IdSchema, IsoDateSchema, ProtocolBaseSchema, ResourceRefSchema } from "../schema-core";

export const RequiredProtectedPathStateSchema = z.enum(["not_required", "gateway_checked"]);
export type RequiredProtectedPathState = z.infer<typeof RequiredProtectedPathStateSchema>;

export const CredentialCustodyStatusSchema = z.enum([
  "gateway_held",
  "fixture_gateway_held",
  "agent_has_raw_credential",
  "shared_or_unknown",
  "no_mutation_credential",
]);
export type CredentialCustodyStatus = z.infer<typeof CredentialCustodyStatusSchema>;

export const GatewayEnforcementModeSchema = z.enum([
  "reference_fixture",
  "customer_gateway_adapter",
  "provider_gateway",
  "hosted_control_plane_only",
  "unknown",
]);
export type GatewayEnforcementMode = z.infer<typeof GatewayEnforcementModeSchema>;

export const ToolCapabilitySchema = ProtocolBaseSchema.extend({
  toolCapabilityId: IdSchema,
  toolCatalogId: IdSchema,
  toolCatalogVersion: z.string().min(1),
  runtimeAdapterId: IdSchema,
  toolName: z.string().min(1),
  toolNamespace: z.string().min(1),
  capabilityClass: z.enum(["read", "write", "network", "filesystem", "deploy", "package", "database", "unknown"]),
  readWriteClassification: z.enum(["read_only", "consequential", "ambiguous"]),
  consequentialityDefault: z.enum(["non_consequential", "consequential", "requires_classification"]),
  wrapperStatus: z.enum(["wrapped", "unwrapped", "unknown"]),
  rawBypassPossible: z.boolean(),
  inputSchemaRef: z.string().min(1),
  outputSchemaRef: z.string().min(1),
  secretBearingFields: z.array(z.string()).default([]),
  supersededAt: IsoDateSchema.nullable(),
});
export type ToolCapability = z.infer<typeof ToolCapabilitySchema>;

export const ActionTypeSchema = ProtocolBaseSchema.extend({
  actionTypeId: IdSchema,
  actionCatalogId: IdSchema,
  actionCatalogVersion: z.string().min(1),
  actionClass: z.string().min(1),
  protectedSurfaceKind: z.string().min(1),
  requiredContractFields: z.array(z.string().min(1)),
  canonicalParameterSchemaRef: z.string().min(1),
  resourceRefSchemaRef: z.string().min(1),
  requiredEvidenceTypes: z.array(z.string()).default([]),
  allowedBoundsSchemaRef: z.string().min(1),
  defaultReceiptRequirement: z.enum(["none", "gate", "mutation", "downstream_finality"]),
  defaultIdempotencyRequirement: z.enum(["required", "optional", "forbidden"]),
  supersededAt: IsoDateSchema.nullable(),
});
export type ActionType = z.infer<typeof ActionTypeSchema>;

export const GatewayRegistryEntrySchema = ProtocolBaseSchema.extend({
  gatewayRegistryEntryId: IdSchema,
  gatewayRegistryVersion: z.string().min(1),
  gatewayId: IdSchema,
  protectedSurfaceKind: z.string().min(1),
  gatewayAdapterId: IdSchema,
  gatewayAdapterVersion: z.string().min(1),
  gateEndpointRef: z.string().min(1),
  gatewayPolicyContractId: IdSchema,
  gatewayPolicyVersion: z.string().min(1),
  gatewayPolicyDriftMode: z.enum(["refuse_on_drift", "allow_compatible_stricter"]),
  compatiblePreviousGatewayPolicyVersions: z.array(z.string().min(1)).default([]),
  acceptedActionCatalogVersions: z.array(z.string().min(1)),
  resourceNamespaceRef: z.string().min(1),
  canonicalizerVersion: z.string().min(1),
  receiptCapabilityStatus: z.enum(["available", "unavailable", "unknown"]),
  isolationCheckCapabilityStatus: z.enum(["available", "unavailable", "unknown"]),
  credentialCustodyStatus: CredentialCustodyStatusSchema,
  enforcementMode: GatewayEnforcementModeSchema,
  mutationCredentialHolderRef: z.string().min(1),
  gatewayAuthorityHolderRef: z.string().min(1),
  supersededAt: IsoDateSchema.nullable(),
});
export type GatewayRegistryEntry = z.infer<typeof GatewayRegistryEntrySchema>;

export const OperatingEnvelopeSchema = ProtocolBaseSchema.extend({
  envelopeId: IdSchema,
  principalId: IdSchema,
  agentId: IdSchema,
  objectiveRef: z.string().min(1),
  allowedActionClasses: z.array(z.string().min(1)),
  allowedGateways: z.array(IdSchema),
  allowedResources: z.array(ResourceRefSchema),
  requiredProtectedPathState: RequiredProtectedPathStateSchema.default("not_required"),
  evidenceRequirements: z.array(z.string()).default([]),
  policyPackRef: z.string().min(1),
  policyPackVersion: z.string().min(1),
  issuedAt: IsoDateSchema,
  expiresAt: IsoDateSchema,
  revokedAt: IsoDateSchema.nullable(),
});
export type OperatingEnvelope = z.infer<typeof OperatingEnvelopeSchema>;
