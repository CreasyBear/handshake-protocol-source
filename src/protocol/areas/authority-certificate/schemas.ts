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
  "credential_resolution_evidence",
  "idempotency_ledger_entry",
  "recovery_recommendation",
  "recovery_recommendation_status_transition",
  "isolation_state",
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
  issuerRef: z.string().min(1).nullable().default(null),
  keyVersion: z.string().min(1).nullable().default(null),
  signerRole: AuthorityCertificateSignerRoleSchema.nullable().default(null),
  algorithm: AuthorityCertificateSignatureAlgorithmSchema,
  publicKeyEd25519: z.string().min(1).nullable().default(null),
  hmacSecret: z.string().min(1).nullable().default(null),
  status: z.enum(["active", "retired", "revoked", "stale", "status_unavailable"]),
  validFrom: IsoDateSchema.nullable().default(null),
  validUntil: IsoDateSchema.nullable().default(null),
});
export type AuthorityCertificateTrustKey = z.infer<typeof AuthorityCertificateTrustKeySchema>;

export const AuthorityCertificateIssuerStatusSchema = z.enum([
  "active",
  "retired",
  "revoked",
  "stale",
  "status_unavailable",
]);
export type AuthorityCertificateIssuerStatus = z.infer<typeof AuthorityCertificateIssuerStatusSchema>;

export const AuthorityCertificateIssuerSchema = z.strictObject({
  issuerRef: z.string().min(1),
  issuerDigest: DigestSchema.nullable().default(null),
  status: AuthorityCertificateIssuerStatusSchema,
  validFrom: IsoDateSchema.nullable().default(null),
  validUntil: IsoDateSchema.nullable().default(null),
  metadataRefs: z.array(z.string().min(1)).default([]),
});
export type AuthorityCertificateIssuer = z.infer<typeof AuthorityCertificateIssuerSchema>;

export const AuthorityCertificateStatusSubjectKindSchema = z.enum(["issuer", "key", "certificate"]);
export type AuthorityCertificateStatusSubjectKind = z.infer<typeof AuthorityCertificateStatusSubjectKindSchema>;

export const AuthorityCertificateStatusRecordSchema = z.strictObject({
  statusRecordId: IdSchema,
  subjectKind: AuthorityCertificateStatusSubjectKindSchema,
  subjectRef: z.string().min(1),
  status: AuthorityCertificateIssuerStatusSchema,
  reasonCode: z.string().min(1),
  observedAt: IsoDateSchema,
  expiresAt: IsoDateSchema.nullable().default(null),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  authorityCreated: z.literal(false).default(false),
});
export type AuthorityCertificateStatusRecord = z.infer<typeof AuthorityCertificateStatusRecordSchema>;

export const AuthorityCertificateTrustMaterialSchema = z.strictObject({
  keys: z.array(AuthorityCertificateTrustKeySchema).default([]),
  issuers: z.array(AuthorityCertificateIssuerSchema).default([]),
  statusRecords: z.array(AuthorityCertificateStatusRecordSchema).default([]),
  verificationTime: IsoDateSchema.nullable().default(null),
  allowDevHmac: z.boolean().default(false),
});
export type AuthorityCertificateTrustMaterialInput = {
  keys?: z.input<typeof AuthorityCertificateTrustKeySchema>[];
  issuers?: z.input<typeof AuthorityCertificateIssuerSchema>[];
  statusRecords?: z.input<typeof AuthorityCertificateStatusRecordSchema>[];
  verificationTime?: string | null;
  allowDevHmac?: boolean;
};
export type AuthorityCertificateTrustMaterial = z.infer<typeof AuthorityCertificateTrustMaterialSchema>;

export const AuthorityCertificateVerificationOutcomeSchema = z.enum(["verified", "refused", "proof_gap"]);
export type AuthorityCertificateVerificationOutcome = z.infer<typeof AuthorityCertificateVerificationOutcomeSchema>;

export const AuthorityCertificateVerificationCheckStatusSchema = z.enum(["passed", "failed", "proof_gap"]);
export type AuthorityCertificateVerificationCheckStatus = z.infer<
  typeof AuthorityCertificateVerificationCheckStatusSchema
>;

export const AuthorityCertificateVerificationFailureCodeSchema = z.enum([
  "schema_invalid",
  "envelope_digest_mismatch",
  "signing_input_digest_mismatch",
  "signature_signed_over_mismatch",
  "signature_algorithm_mismatch",
  "hmac_not_allowed",
  "trust_key_missing",
  "trust_key_inactive",
  "trust_issuer_unknown",
  "trust_key_role_mismatch",
  "trust_key_retired",
  "trust_key_revoked",
  "trust_key_stale",
  "trust_status_unavailable",
  "trust_key_window_invalid",
  "trust_certificate_status_revoked",
  "trust_certificate_status_stale",
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

export const AuthorityCertificateVerificationResponseSchema = z.strictObject({
  verificationResponseId: IdSchema,
  outcome: AuthorityCertificateVerificationOutcomeSchema,
  verificationPlane: z.literal("local_pinned_trust_material"),
  authorityCreated: z.literal(false),
  redactionProfileRef: z.literal("authority-certificate-verification:v1-redacted"),
  valid: z.boolean(),
  checks: z.strictObject({
    schema: AuthorityCertificateVerificationCheckStatusSchema,
    cryptographicSignature: AuthorityCertificateVerificationCheckStatusSchema,
    signingInputDigest: AuthorityCertificateVerificationCheckStatusSchema,
    artifactBinding: AuthorityCertificateVerificationCheckStatusSchema,
    terminalBinding: AuthorityCertificateVerificationCheckStatusSchema,
    gatewayAdmissionBinding: AuthorityCertificateVerificationCheckStatusSchema,
    trustMaterial: AuthorityCertificateVerificationCheckStatusSchema,
    status: AuthorityCertificateVerificationCheckStatusSchema,
  }),
  failures: z.array(AuthorityCertificateVerificationFailureSchema),
  envelope: AgentTransactionEnvelopeProjectionSchema.nullable(),
  signingInputDigest: DigestSchema.nullable(),
});
export type AuthorityCertificateVerificationResponse = z.infer<typeof AuthorityCertificateVerificationResponseSchema>;

export const AuthorityCertificateVerificationRequestSchema = z.strictObject({
  certificate: z.unknown(),
  trustMaterial: AuthorityCertificateTrustMaterialSchema,
});
export type AuthorityCertificateVerificationRequest = z.input<typeof AuthorityCertificateVerificationRequestSchema>;

export const AuthorityCertificateVerifierKeyProjectionSchema = z.strictObject({
  keyIdentityRef: z.string().min(1),
  issuerRef: z.string().min(1).nullable(),
  keyVersion: z.string().min(1).nullable(),
  signerRole: AuthorityCertificateSignerRoleSchema.nullable(),
  algorithm: AuthorityCertificateSignatureAlgorithmSchema,
  publicKeyEd25519: z.string().min(1),
  status: AuthorityCertificateIssuerStatusSchema,
  validFrom: IsoDateSchema.nullable(),
  validUntil: IsoDateSchema.nullable(),
  privateMaterialIncluded: z.literal(false),
  authorityCreated: z.literal(false),
});
export type AuthorityCertificateVerifierKeyProjection = z.infer<typeof AuthorityCertificateVerifierKeyProjectionSchema>;

export const AuthorityCertificateVerifierKeySetProjectionSchema = z.strictObject({
  projectionKind: z.literal("authority_certificate_verifier_key_set"),
  trustDecision: z.literal("caller_pinned_trust_material_only"),
  authorityCreated: z.literal(false),
  redactionProfileRef: z.literal("authority-certificate-verifier-key-set:v1-redacted"),
  issuers: z.array(AuthorityCertificateIssuerSchema),
  keys: z.array(AuthorityCertificateVerifierKeyProjectionSchema),
  omittedPrivateKeyCount: z.number().int().nonnegative(),
});
export type AuthorityCertificateVerifierKeySetProjection = z.infer<
  typeof AuthorityCertificateVerifierKeySetProjectionSchema
>;

export const AuthorityCertificateJwkProjectionSchema = z.strictObject({
  kty: z.literal("OKP"),
  crv: z.literal("Ed25519"),
  kid: z.string().min(1),
  alg: z.literal("EdDSA"),
  use: z.literal("sig"),
  key_ops: z.array(z.literal("verify")),
  x: z.string().min(1),
});
export type AuthorityCertificateJwkProjection = z.infer<typeof AuthorityCertificateJwkProjectionSchema>;

export const AuthorityCertificateJwksProjectionSchema = z.strictObject({
  projectionKind: z.literal("authority_certificate_jwks_projection"),
  trustDecision: z.literal("jwks_projection_only"),
  authorityCreated: z.literal(false),
  redactionProfileRef: z.literal("authority-certificate-jwks:v1-public"),
  jwks: z.strictObject({
    keys: z.array(AuthorityCertificateJwkProjectionSchema),
  }),
  omittedPrivateKeyCount: z.number().int().nonnegative(),
});
export type AuthorityCertificateJwksProjection = z.infer<typeof AuthorityCertificateJwksProjectionSchema>;
