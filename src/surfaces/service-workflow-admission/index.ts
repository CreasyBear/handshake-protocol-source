import { z } from "zod";

const sha256DigestSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/);

export const serviceWorkflowAdmissionSchemaVersion = "handshake.service-workflow-admission.v0.1" as const;
export const principalAgentLinkSchemaVersion = "handshake.principal-agent-link.v0.1" as const;

export const serviceWorkflowClaimStatuses = ["accepted", "refused", "stale", "proof_gap", "quarantined"] as const;

export type ServiceWorkflowClaimStatus = (typeof serviceWorkflowClaimStatuses)[number];

export const serviceWorkflowNextActionRequirements = [
  "fresh_action_contract_required",
  "reload_evidence_required",
  "replace_evidence_required",
  "keep_blocked",
  "stop_and_isolate",
] as const;

export type ServiceWorkflowNextActionRequirement = (typeof serviceWorkflowNextActionRequirements)[number];

export const ServiceWorkflowAuthorityBoundarySchema = z.strictObject({
  createsAuthority: z.literal(false),
  createsPolicyDecision: z.literal(false),
  createsGreenlight: z.literal(false),
  performsGatewayCheck: z.literal(false),
  permitsMutation: z.literal(false),
  exportsReceipt: z.literal(false),
  mintsTerminalCertificate: z.literal(false),
  containsCredentialMaterial: z.literal(false),
  containsPaymentMaterial: z.literal(false),
  widensOperatingEnvelope: z.literal(false),
  isReusableAuth: z.literal(false),
  isGatewayBinding: z.literal(false),
  freshActionContractRequired: z.literal(true),
});

export type ServiceWorkflowAuthorityBoundary = z.infer<typeof ServiceWorkflowAuthorityBoundarySchema>;

export const serviceWorkflowAuthorityBoundary = {
  createsAuthority: false,
  createsPolicyDecision: false,
  createsGreenlight: false,
  performsGatewayCheck: false,
  permitsMutation: false,
  exportsReceipt: false,
  mintsTerminalCertificate: false,
  containsCredentialMaterial: false,
  containsPaymentMaterial: false,
  widensOperatingEnvelope: false,
  isReusableAuth: false,
  isGatewayBinding: false,
  freshActionContractRequired: true,
} as const satisfies ServiceWorkflowAuthorityBoundary;

export const ServiceWorkflowContextRefsSchema = z.strictObject({
  passportPackageDigest: sha256DigestSchema,
  passportPresentationId: z.string().min(1),
  admissionId: z.string().min(1),
  serviceWorkflowHandleId: z.string().min(1),
  serviceWorkflowHandleDigest: sha256DigestSchema,
});

export type ServiceWorkflowContextRefs = z.infer<typeof ServiceWorkflowContextRefsSchema>;

export const PrincipalAgentLinkSchema = z.strictObject({
  schemaVersion: z.literal(principalAgentLinkSchemaVersion),
  principalAgentLinkId: z.string().min(1),
  principalAgentLinkDigest: sha256DigestSchema,
  tenantId: z.string().min(1),
  organizationId: z.string().min(1),
  projectId: z.string().min(1).nullable(),
  workspaceId: z.string().min(1).nullable(),
  principalId: z.string().min(1),
  agentId: z.string().min(1),
  principalSubjectDigest: sha256DigestSchema,
  agentSubjectDigest: sha256DigestSchema,
  authProviderRef: z.string().min(1),
  linkEvidenceRefs: z.array(z.string().min(1)),
  scopeRefs: z.array(z.string().min(1)),
  issuedAt: z.string().datetime({ offset: true }),
  expiresAt: z.string().datetime({ offset: true }).nullable(),
  revokedAt: z.string().datetime({ offset: true }).nullable(),
  authorityBoundary: ServiceWorkflowAuthorityBoundarySchema,
  createsAuthority: z.literal(false),
  createsPolicyDecision: z.literal(false),
  createsGreenlight: z.literal(false),
  performsGatewayCheck: z.literal(false),
  permitsMutation: z.literal(false),
  exportsReceipt: z.literal(false),
  mintsTerminalCertificate: z.literal(false),
  containsCredentialMaterial: z.literal(false),
  containsPaymentMaterial: z.literal(false),
  widensOperatingEnvelope: z.literal(false),
  isReusableAuth: z.literal(false),
  isGatewayBinding: z.literal(false),
  freshActionContractRequired: z.literal(true),
  allowedUse: z.literal("scoped_evidence_for_envelope_setup_and_readback_only"),
});

export type PrincipalAgentLink = z.infer<typeof PrincipalAgentLinkSchema>;

export const ServiceWorkflowClaimResultSchema = z.strictObject({
  claimRef: z.string().min(1),
  claimDigest: sha256DigestSchema.nullable(),
  status: z.enum(serviceWorkflowClaimStatuses),
  reasonCodes: z.array(z.string().min(2)),
  evidenceRefs: z.array(z.string().min(1)),
  proofGapRefs: z.array(z.string().min(1)),
});

export type ServiceWorkflowClaimResult = z.infer<typeof ServiceWorkflowClaimResultSchema>;

export const ServiceWorkflowRuntimePostureSchema = z.strictObject({
  runtimeRef: z.string().min(1),
  hostProfileEvidenceRef: z.string().min(1).nullable(),
  rawSiblingBypassPostureRef: z.string().min(1).nullable(),
  nativeContainmentClaimed: z.literal(false),
  proofGapRefs: z.array(z.string().min(1)),
});

export type ServiceWorkflowRuntimePosture = z.infer<typeof ServiceWorkflowRuntimePostureSchema>;

export const ServiceWorkflowHandleSchema = z.strictObject({
  schemaVersion: z.literal(serviceWorkflowAdmissionSchemaVersion),
  passportPackageDigest: sha256DigestSchema,
  passportPresentationId: z.string().min(1),
  admissionId: z.string().min(1),
  serviceWorkflowHandleId: z.string().min(1),
  serviceWorkflowHandleDigest: sha256DigestSchema,
  issuedAt: z.string().datetime({ offset: true }),
  expiresAt: z.string().datetime({ offset: true }).nullable(),
  workflowBoundsDigest: sha256DigestSchema,
  sourceAdmissionDigest: sha256DigestSchema,
  runtimePostureDigest: sha256DigestSchema.nullable(),
  authorityBoundary: ServiceWorkflowAuthorityBoundarySchema,
  nextProtectedActionRequirement: z.literal("fresh_action_contract_required"),
  allowedUse: z.literal("correlation_and_readback_context_only"),
});

export type ServiceWorkflowHandle = z.infer<typeof ServiceWorkflowHandleSchema>;

export const ServiceWorkflowAdmissionSchema = z.strictObject({
  schemaVersion: z.literal(serviceWorkflowAdmissionSchemaVersion),
  passportPackageDigest: sha256DigestSchema,
  passportPresentationId: z.string().min(1),
  admissionId: z.string().min(1),
  admissionDigest: sha256DigestSchema,
  serviceRef: z.string().min(1),
  presentedAt: z.string().datetime({ offset: true }),
  evaluatedAt: z.string().datetime({ offset: true }),
  claimResults: z.array(ServiceWorkflowClaimResultSchema),
  runtimePosture: z.array(ServiceWorkflowRuntimePostureSchema),
  serviceWorkflowHandle: ServiceWorkflowHandleSchema,
  authorityBoundary: ServiceWorkflowAuthorityBoundarySchema,
  nextActionRequirement: z.enum(serviceWorkflowNextActionRequirements),
  clearanceBoundary: z.literal("fresh_action_contract_required_for_each_protected_action"),
  readbackBoundary: z.literal("admission_readback_is_not_receipt_evidence"),
});

export type ServiceWorkflowAdmission = z.infer<typeof ServiceWorkflowAdmissionSchema>;

export function serviceWorkflowNonAuthorityBoundary(): ServiceWorkflowAuthorityBoundary {
  return ServiceWorkflowAuthorityBoundarySchema.parse(serviceWorkflowAuthorityBoundary);
}

export function serviceWorkflowContextRefFromHandle(handle: ServiceWorkflowHandle): ServiceWorkflowContextRefs {
  return ServiceWorkflowContextRefsSchema.parse({
    passportPackageDigest: handle.passportPackageDigest,
    passportPresentationId: handle.passportPresentationId,
    admissionId: handle.admissionId,
    serviceWorkflowHandleId: handle.serviceWorkflowHandleId,
    serviceWorkflowHandleDigest: handle.serviceWorkflowHandleDigest,
  });
}

export function serviceWorkflowContextEvidenceRefs(contextRefs: ServiceWorkflowContextRefs): string[] {
  const parsed = ServiceWorkflowContextRefsSchema.parse(contextRefs);
  return [
    `service-workflow-context:passport-package:${parsed.passportPackageDigest}`,
    `service-workflow-context:presentation:${parsed.passportPresentationId}`,
    `service-workflow-context:admission:${parsed.admissionId}`,
    `service-workflow-context:handle:${parsed.serviceWorkflowHandleId}`,
    `service-workflow-context:handle-digest:${parsed.serviceWorkflowHandleDigest}`,
  ];
}

export function serviceWorkflowContextCorrelationRef(contextRefs: ServiceWorkflowContextRefs): string {
  return `service-workflow-context:${ServiceWorkflowContextRefsSchema.parse(contextRefs).serviceWorkflowHandleId}`;
}
