import { z } from "zod";
import {
  DigestSchema,
  IdSchema,
  IsoDateSchema,
  ProtocolBaseSchema,
  ResourceRefSchema,
} from "../../foundation/schema-core";

export const RequiredProtectedPathStateSchema = z.enum(["not_required", "gateway_checked"]);
export type RequiredProtectedPathState = z.infer<typeof RequiredProtectedPathStateSchema>;

export const CredentialCustodyStatusSchema = z.enum([
  "gateway_held",
  "fixture_gateway_held",
  "gateway_resolved_from_vault",
  "provider_gateway_held",
  "unknown",
  "unsafe_agent_visible",
  "unsafe_runtime_visible",
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

export const ParticipantIdentityRoleSchema = z.enum(["principal", "agent"]);
export type ParticipantIdentityRole = z.infer<typeof ParticipantIdentityRoleSchema>;

export const ParticipantIdentityBindingSchema = z
  .strictObject({
    participantRole: ParticipantIdentityRoleSchema,
    participantRef: IdSchema,
    identityProviderRef: ResourceRefSchema,
    subjectRef: ResourceRefSchema.nullable().default(null),
    subjectDigest: DigestSchema.nullable().default(null),
    claimsDigest: DigestSchema.nullable().default(null),
    verificationEvidenceRef: ResourceRefSchema,
    bindingEvidenceRef: ResourceRefSchema.nullable().default(null),
    issuedAt: IsoDateSchema.nullable().default(null),
    expiresAt: IsoDateSchema.nullable().default(null),
    authorityPosture: z.literal("evidence_only").default("evidence_only"),
  })
  .superRefine((binding, ctx) => {
    if (!binding.subjectRef && !binding.subjectDigest) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["subjectRef"],
        message: "Participant identity bindings require either subjectRef or subjectDigest.",
      });
    }
  });
export type ParticipantIdentityBinding = z.infer<typeof ParticipantIdentityBindingSchema>;

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
  participantIdentityBindings: z.array(ParticipantIdentityBindingSchema).default([]),
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
}).superRefine((envelope, ctx) => {
  for (const [index, binding] of envelope.participantIdentityBindings.entries()) {
    const expectedParticipantRef = binding.participantRole === "principal" ? envelope.principalId : envelope.agentId;
    if (binding.participantRef !== expectedParticipantRef) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["participantIdentityBindings", index, "participantRef"],
        message: `${binding.participantRole} identity binding must match the envelope participant ref.`,
      });
    }
  }
});
export type OperatingEnvelope = z.infer<typeof OperatingEnvelopeSchema>;
