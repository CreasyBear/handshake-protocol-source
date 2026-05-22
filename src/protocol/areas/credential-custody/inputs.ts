import { z } from "zod";
import { DigestSchema } from "../../foundation/schema-core";
import {
  CredentialResolutionEvidenceSchema,
  GatewayCredentialRefSchema,
  CredentialResolutionRedactionStatusSchema,
  CredentialResolutionResultClassSchema,
} from "./schemas";

export const RegisterGatewayCredentialRefInputSchema = z.strictObject({
  tenantId: z.string().min(1),
  organizationId: z.string().min(1),
  gatewayCredentialRefId: z.string().min(1).optional(),
  principalId: z.string().min(1).nullable().default(null),
  gatewayId: z.string().min(1),
  gatewayRegistryEntryId: z.string().min(1),
  protectedSurfaceKind: z.string().min(1),
  actionClasses: z.array(z.string().min(1)).min(1),
  resourceRefs: GatewayCredentialRefSchema.shape.resourceRefs,
  resourceNamespaceRef: z.string().min(1),
  credentialKind: GatewayCredentialRefSchema.shape.credentialKind,
  custodyStatus: GatewayCredentialRefSchema.shape.custodyStatus,
  providerClass: GatewayCredentialRefSchema.shape.providerClass,
  providerRegistryRef: GatewayCredentialRefSchema.shape.providerRegistryRef,
  providerRegistryDigest: DigestSchema.nullable().default(null),
  resolverRef: GatewayCredentialRefSchema.shape.resolverRef,
  resolverVersion: z.string().min(1),
  evidenceExpectationRefs: GatewayCredentialRefSchema.shape.evidenceExpectationRefs,
  issuedAt: z.string().datetime({ offset: true }).optional(),
  expiresAt: z.string().datetime({ offset: true }).nullable().default(null),
});
export type RegisterGatewayCredentialRefInput = z.input<typeof RegisterGatewayCredentialRefInputSchema>;

export const RecordCredentialResolutionEvidenceInputSchema = z.strictObject({
  actionContractId: z.string().min(1),
  greenlightId: z.string().min(1),
  gateAttemptId: z.string().min(1),
  gatewayCredentialRefId: z.string().min(1),
  gatewayCredentialRefDigest: DigestSchema,
  requestDigest: DigestSchema,
  resultClass: CredentialResolutionResultClassSchema,
  resultReasonCode: z.string().min(2),
  redactionStatus: CredentialResolutionRedactionStatusSchema,
  providerRequestRef: CredentialResolutionEvidenceSchema.shape.providerRequestRef,
  providerOperationRef: CredentialResolutionEvidenceSchema.shape.providerOperationRef,
  proofGapId: z.string().min(1).nullable().default(null),
  refusalId: z.string().min(1).nullable().default(null),
  evidenceRefs: CredentialResolutionEvidenceSchema.shape.evidenceRefs,
  recordedAt: z.string().datetime({ offset: true }).optional(),
});
export type RecordCredentialResolutionEvidenceInput = z.input<typeof RecordCredentialResolutionEvidenceInputSchema>;
