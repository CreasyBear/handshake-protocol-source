import { z } from "zod";
import { AgentTransactionEnvelopeProjectionSchema } from "../../evidence-projections/schemas";
import {
  DigestSchema,
  IdSchema,
  IsoDateSchema,
  JsonValueSchema,
  ProtocolBaseSchema,
  ResourceRefSchema,
  SignatureSchema,
} from "../../foundation/schema-core";

export const AuthorityCertificateVersionSchema = z.literal("1.0.0");
export type AuthorityCertificateVersion = z.infer<typeof AuthorityCertificateVersionSchema>;

export const AuthorityCertificateTerminalKindSchema = z.enum([
  "receipt",
  "durable_refusal",
  "proof_gap",
  "replay_refusal",
]);
export type AuthorityCertificateTerminalKind = z.infer<typeof AuthorityCertificateTerminalKindSchema>;

export const AuthorityCertificateArtifactKindSchema = z.enum([
  "action_contract",
  "policy_decision",
  "greenlight",
  "gateway_check_attempt",
  "mutation_attempt",
  "refusal",
  "proof_gap",
  "receipt",
  "receipt_export",
  "surface_operation_reconciliation",
]);
export type AuthorityCertificateArtifactKind = z.infer<typeof AuthorityCertificateArtifactKindSchema>;

export const AuthorityCertificateArtifactSchema = z.strictObject({
  kind: AuthorityCertificateArtifactKindSchema,
  objectRef: z.string().min(1),
  digest: DigestSchema,
});
export type AuthorityCertificateArtifact = z.infer<typeof AuthorityCertificateArtifactSchema>;

export const AuthorityCertificateSignerRoleSchema = z.enum(["operator_policy", "gateway"]);
export type AuthorityCertificateSignerRole = z.infer<typeof AuthorityCertificateSignerRoleSchema>;

export const AuthorityCertificateSignatureAlgorithmSchema = z.enum(["ed25519", "hmac-sha256"]);
export type AuthorityCertificateSignatureAlgorithm = z.infer<typeof AuthorityCertificateSignatureAlgorithmSchema>;

export const AuthorityCertificateSignatureEntrySchema = z.strictObject({
  signerRole: AuthorityCertificateSignerRoleSchema,
  keyIdentityRef: z.string().min(1),
  algorithm: AuthorityCertificateSignatureAlgorithmSchema,
  signedOver: DigestSchema,
  signature: SignatureSchema,
});
export type AuthorityCertificateSignatureEntry = z.infer<typeof AuthorityCertificateSignatureEntrySchema>;

export const AuthorityCertificateVerificationPolicySchema = z.strictObject({
  verificationPolicyId: z.string().min(1),
  terminalKind: AuthorityCertificateTerminalKindSchema,
  actionClass: z.string().min(1),
  gatewayAdmissionRequired: z.boolean(),
  requiredSignerRoles: z.array(AuthorityCertificateSignerRoleSchema).min(1),
  requiredArtifactKinds: z.array(AuthorityCertificateArtifactKindSchema).default([]),
});
export type AuthorityCertificateVerificationPolicy = z.infer<typeof AuthorityCertificateVerificationPolicySchema>;

export const AuthorityCertificateTerminalSchema = z.strictObject({
  terminalKind: AuthorityCertificateTerminalKindSchema,
  terminalObjectRef: z.string().min(1),
  actionContractId: IdSchema,
  policyDecisionId: IdSchema.nullable(),
  greenlightId: IdSchema.nullable(),
  gatewayId: IdSchema.nullable(),
});
export type AuthorityCertificateTerminal = z.infer<typeof AuthorityCertificateTerminalSchema>;

export const AuthorityCertificateConsumerBindingSchema = z.strictObject({
  bindingKind: z.string().min(1),
  bindingRef: ResourceRefSchema,
  digest: DigestSchema.nullable().default(null),
});
export type AuthorityCertificateConsumerBinding = z.infer<typeof AuthorityCertificateConsumerBindingSchema>;

export const AuthorityCertificateSchema = ProtocolBaseSchema.extend({
  authorityCertificateId: IdSchema,
  authorityCertificateVersion: AuthorityCertificateVersionSchema,
  canonicalizerVersion: z.string().min(1),
  terminalizedAt: IsoDateSchema,
  terminal: AuthorityCertificateTerminalSchema,
  envelope: AgentTransactionEnvelopeProjectionSchema,
  envelopeDigest: DigestSchema,
  artifacts: z.array(AuthorityCertificateArtifactSchema).min(1),
  verificationPolicy: AuthorityCertificateVerificationPolicySchema,
  signatures: z.array(AuthorityCertificateSignatureEntrySchema).min(1),
  consumerBindings: z.array(AuthorityCertificateConsumerBindingSchema).default([]),
  extensions: z.record(z.string(), JsonValueSchema).default({}),
  emittedAt: IsoDateSchema,
  signingInputDigest: DigestSchema,
});
export type AuthorityCertificate = z.infer<typeof AuthorityCertificateSchema>;

export const AuthorityCertificateTrustKeySchema = z.strictObject({
  keyIdentityRef: z.string().min(1),
  signerRole: AuthorityCertificateSignerRoleSchema.nullable().default(null),
  algorithm: AuthorityCertificateSignatureAlgorithmSchema,
  publicKeyEd25519: z.string().min(1).nullable().default(null),
  hmacSecret: z.string().min(1).nullable().default(null),
  status: z.enum(["active", "retired"]),
});
export type AuthorityCertificateTrustKey = z.infer<typeof AuthorityCertificateTrustKeySchema>;

export const AuthorityCertificateTrustMaterialSchema = z.strictObject({
  keys: z.array(AuthorityCertificateTrustKeySchema).default([]),
  allowDevHmac: z.boolean().default(false),
});
export type AuthorityCertificateTrustMaterial = z.infer<typeof AuthorityCertificateTrustMaterialSchema>;

export const AuthorityCertificateVerificationFailureCodeSchema = z.enum([
  "schema_invalid",
  "envelope_digest_mismatch",
  "signing_input_digest_mismatch",
  "signature_signed_over_mismatch",
  "signature_algorithm_mismatch",
  "hmac_not_allowed",
  "trust_key_missing",
  "trust_key_inactive",
  "signature_invalid",
  "required_signer_missing",
  "required_artifact_missing",
  "gateway_admission_binding_missing",
  "terminal_binding_mismatch",
]);
export type AuthorityCertificateVerificationFailureCode = z.infer<
  typeof AuthorityCertificateVerificationFailureCodeSchema
>;

export const AuthorityCertificateVerificationFailureSchema = z.strictObject({
  code: AuthorityCertificateVerificationFailureCodeSchema,
  message: z.string().min(1),
  ref: z.string().min(1).nullable().default(null),
});
export type AuthorityCertificateVerificationFailure = z.infer<typeof AuthorityCertificateVerificationFailureSchema>;
