import { z } from "zod";
import {
  GatewayCredentialRefSchema,
  type GatewayCredentialRef,
  type RegisterGatewayCredentialRefInput,
} from "../../protocol/areas/credential-custody";
import { canonicalizeHttpProfile } from "../http-profile/canonicalize";
import { digestCanonical } from "../../protocol/foundation/canonical";
import { DigestSchema, IdSchema, IsoDateSchema, type JsonValue } from "../../protocol/foundation/schema-core";

/** Phase 04 plan `04-08` / D-11: shared HTTP transport canonicalization for auth.md exact profile. */
export const AUTH_MD_PROTECTED_API_CALL_EXACT_PROFILE = "auth_md_protected_api_call.exact" as const;

export const AuthMdProtectedApiCallAllowedHttpMethodSchema = z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]);
export type AuthMdProtectedApiCallAllowedHttpMethod = z.infer<typeof AuthMdProtectedApiCallAllowedHttpMethodSchema>;

export const AuthMdProtectedApiCallHeaderAllowlistSchema = z.array(
  z.enum(["accept", "content-type", "authorization", "x-request-id", "x-idempotency-key"]),
);
export type AuthMdProtectedApiCallHeaderAllowlist = z.infer<typeof AuthMdProtectedApiCallHeaderAllowlistSchema>;

export const AuthMdProtectedApiCallExactTransportSchema = z.strictObject({
  targetHttpMethod: AuthMdProtectedApiCallAllowedHttpMethodSchema,
  endpointUrl: z.string().url(),
  pathTemplate: z
    .string()
    .min(1)
    .refine((value) => value.startsWith("/"), { message: "pathTemplate must start with /" }),
  requestBodyDigest: DigestSchema.nullable().default(null),
  selectedHeadersDigest: DigestSchema,
  dynamicEndpointConstructionObserved: z.boolean().default(false),
  dynamicHostConstructionObserved: z.boolean().default(false),
  retryAuthorityReuseDetected: z.boolean().default(false),
});

export function canonicalizeAuthMdProtectedApiCallExactTransport(
  input: z.input<typeof AuthMdProtectedApiCallExactTransportSchema>,
): z.infer<typeof AuthMdProtectedApiCallExactTransportSchema> {
  const parsed = AuthMdProtectedApiCallExactTransportSchema.parse(input);
  const canonical = canonicalizeHttpProfile(parsed);
  return AuthMdProtectedApiCallExactTransportSchema.parse(canonical);
}

export const AUTH_MD_REGISTERED_CREDENTIAL_PROFILE = "auth_md_registered_credential.v0";
export const AUTH_MD_DISCOVERY_REDACTION_PROFILE = "auth-md-discovery:v0-redacted";
export const AUTH_MD_REGISTRATION_REDACTION_PROFILE = "auth-md-registration:v0-redacted";
export const AUTH_MD_IDENTITY_ASSERTION_REDACTION_PROFILE = "auth-md-identity-assertion:v0-redacted";
export const AUTH_MD_CLAIM_REDACTION_PROFILE = "auth-md-claim:v0-redacted";
export const AUTH_MD_REVOCATION_REDACTION_PROFILE = "auth-md-revocation:v0-redacted";

const AuthMdUrlSchema = z.string().url();
const AuthMdSafeStringSchema = z
  .string()
  .min(1)
  .refine((value) => !looksLikeAuthMdCredentialMaterial(value), {
    message: "auth.md adapter evidence must not contain raw credential material",
  });

export const AuthMdCredentialTypeSchema = z.enum(["api_key", "access_token"]);
export type AuthMdCredentialType = z.infer<typeof AuthMdCredentialTypeSchema>;

export const AuthMdAgentAuthIdentityTypeSchema = z.enum(["anonymous", "identity_assertion"]);
export type AuthMdAgentAuthIdentityType = z.infer<typeof AuthMdAgentAuthIdentityTypeSchema>;

export const AuthMdIdentityAssertionTypeSchema = z.enum(["urn:ietf:params:oauth:token-type:id-jag", "verified_email"]);
export type AuthMdIdentityAssertionType = z.infer<typeof AuthMdIdentityAssertionTypeSchema>;

export const AuthMdIdentityFlowSchema = z.enum(["identity_assertion", "anonymous", "user_claimed"]);
export type AuthMdIdentityFlow = z.infer<typeof AuthMdIdentityFlowSchema>;

export const AuthMdClaimStateSchema = z.enum([
  "not_applicable",
  "pre_claim",
  "pending_user_claim",
  "claimed",
  "claim_refused",
  "proof_gap",
]);
export type AuthMdClaimState = z.infer<typeof AuthMdClaimStateSchema>;

export const AuthMdCredentialLifecycleStateSchema = z.enum([
  "active",
  "expired",
  "revoked",
  "quarantined",
  "proof_gap",
]);
export type AuthMdCredentialLifecycleState = z.infer<typeof AuthMdCredentialLifecycleStateSchema>;

export const AuthMdMetadataCachePostureSchema = z.enum(["fresh", "stale", "not_advertised", "unknown"]);
export type AuthMdMetadataCachePosture = z.infer<typeof AuthMdMetadataCachePostureSchema>;

export const AuthMdIdentityAssurancePostureSchema = z.enum([
  "provider_asserted",
  "jwks_verified",
  "cimd_verified",
  "proof_gap",
]);
export type AuthMdIdentityAssurancePosture = z.infer<typeof AuthMdIdentityAssurancePostureSchema>;

export const AuthMdClaimScopeTransitionSchema = z.enum([
  "no_scope_change",
  "rotated_credential_ref",
  "scope_widened_requires_rotation",
  "claim_refused",
  "proof_gap",
]);
export type AuthMdClaimScopeTransition = z.infer<typeof AuthMdClaimScopeTransitionSchema>;

export const AuthMdRevocationEventKindSchema = z.enum([
  "logout_jwt",
  "explicit_revocation",
  "downstream_401",
  "credential_expired",
  "metadata_drift",
  "ambiguous",
]);
export type AuthMdRevocationEventKind = z.infer<typeof AuthMdRevocationEventKindSchema>;

const AuthMdAnonymousMetadataWireSchema = z.strictObject({
  credential_types_supported: z.array(AuthMdCredentialTypeSchema).min(1),
});

const AuthMdIdentityAssertionMetadataWireSchema = z.strictObject({
  assertion_types_supported: z.array(AuthMdIdentityAssertionTypeSchema).min(1),
  credential_types_supported: z.array(AuthMdCredentialTypeSchema).min(1),
});

export const AuthMdAgentAuthMetadataWireSchema = z
  .strictObject({
    skill: z.string().min(1).optional(),
    register_uri: AuthMdUrlSchema,
    claim_uri: AuthMdUrlSchema.optional(),
    revocation_uri: AuthMdUrlSchema.optional(),
    identity_types_supported: z.array(AuthMdAgentAuthIdentityTypeSchema).min(1),
    anonymous: AuthMdAnonymousMetadataWireSchema.optional(),
    identity_assertion: AuthMdIdentityAssertionMetadataWireSchema.optional(),
    events_supported: z.array(z.string().min(1)).default([]),
  })
  .superRefine((metadata, ctx) => {
    if (metadata.identity_types_supported.includes("anonymous") && !metadata.anonymous) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["anonymous"],
        message: "auth.md agent_auth advertised anonymous without anonymous metadata",
      });
    }
    if (metadata.identity_types_supported.includes("identity_assertion") && !metadata.identity_assertion) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["identity_assertion"],
        message: "auth.md agent_auth advertised identity_assertion without identity_assertion metadata",
      });
    }
  });
export type AuthMdAgentAuthMetadataWire = z.input<typeof AuthMdAgentAuthMetadataWireSchema>;

export const AuthMdProtectedResourceMetadataWireSchema = z.strictObject({
  resource: AuthMdUrlSchema,
  resource_name: z.string().min(1).optional(),
  resource_logo_uri: AuthMdUrlSchema.optional(),
  authorization_servers: z.array(AuthMdUrlSchema).min(1),
  scopes_supported: z.array(z.string().min(1)).default([]),
  bearer_methods_supported: z.array(z.string().min(1)).default([]),
});
export type AuthMdProtectedResourceMetadataWire = z.input<typeof AuthMdProtectedResourceMetadataWireSchema>;

export const AuthMdAuthorizationServerMetadataWireSchema = z.strictObject({
  issuer: AuthMdUrlSchema.optional(),
  resource: AuthMdUrlSchema.optional(),
  authorization_servers: z.array(AuthMdUrlSchema).default([]),
  scopes_supported: z.array(z.string().min(1)).default([]),
  bearer_methods_supported: z.array(z.string().min(1)).default([]),
  jwks_uri: AuthMdUrlSchema.optional(),
  authorization_endpoint: AuthMdUrlSchema.optional(),
  token_endpoint: AuthMdUrlSchema.optional(),
  claims_supported: z.array(z.string().min(1)).default([]),
  agent_auth: AuthMdAgentAuthMetadataWireSchema,
});
export type AuthMdAuthorizationServerMetadataWire = z.input<typeof AuthMdAuthorizationServerMetadataWireSchema>;

export const AuthMdAgentAuthMetadataSchema = z.strictObject({
  skill: AuthMdSafeStringSchema.nullable(),
  registerUri: AuthMdUrlSchema,
  claimUri: AuthMdUrlSchema.nullable(),
  revocationUri: AuthMdUrlSchema.nullable(),
  identityTypes: z.array(AuthMdAgentAuthIdentityTypeSchema),
  credentialTypes: z.array(AuthMdCredentialTypeSchema),
  anonymousCredentialTypes: z.array(AuthMdCredentialTypeSchema),
  identityAssertionCredentialTypes: z.array(AuthMdCredentialTypeSchema),
  identityAssertionTypes: z.array(AuthMdIdentityAssertionTypeSchema),
  eventsSupported: z.array(AuthMdSafeStringSchema),
});
export type AuthMdAgentAuthMetadata = z.infer<typeof AuthMdAgentAuthMetadataSchema>;

export const AuthMdProtectedResourceMetadataSchema = z.strictObject({
  resource: AuthMdUrlSchema,
  resourceName: AuthMdSafeStringSchema.nullable(),
  resourceLogoUri: AuthMdUrlSchema.nullable(),
  authorizationServers: z.array(AuthMdUrlSchema),
  scopesSupported: z.array(AuthMdSafeStringSchema),
  bearerMethodsSupported: z.array(AuthMdSafeStringSchema),
});
export type AuthMdProtectedResourceMetadata = z.infer<typeof AuthMdProtectedResourceMetadataSchema>;

export const AuthMdAuthorizationServerMetadataSchema = z.strictObject({
  issuer: AuthMdUrlSchema.nullable(),
  resource: AuthMdUrlSchema.nullable(),
  authorizationServers: z.array(AuthMdUrlSchema),
  scopesSupported: z.array(AuthMdSafeStringSchema),
  bearerMethodsSupported: z.array(AuthMdSafeStringSchema),
  jwksUri: AuthMdUrlSchema.nullable(),
  authorizationEndpoint: AuthMdUrlSchema.nullable(),
  tokenEndpoint: AuthMdUrlSchema.nullable(),
  claimsSupported: z.array(AuthMdSafeStringSchema),
  agentAuth: AuthMdAgentAuthMetadataSchema,
});
export type AuthMdAuthorizationServerMetadata = z.infer<typeof AuthMdAuthorizationServerMetadataSchema>;

export const AuthMdDiscoveryEvidenceSchema = z.strictObject({
  evidenceKind: z.literal("auth_md_discovery"),
  profile: z.literal(AUTH_MD_REGISTERED_CREDENTIAL_PROFILE),
  authorityCreated: z.literal(false),
  metadataSourceOfTruth: z.literal("oauth_protected_resource_metadata_chain"),
  agentAuthSourceOfTruth: z.literal("oauth_authorization_server_metadata"),
  protectedResourceMetadata: AuthMdProtectedResourceMetadataSchema,
  protectedResourceMetadataDigest: DigestSchema,
  protectedResourceMetadataSourceRef: AuthMdSafeStringSchema.nullable(),
  authorizationServerMetadata: AuthMdAuthorizationServerMetadataSchema,
  authorizationServerMetadataDigest: DigestSchema,
  authorizationServerMetadataSourceRef: AuthMdSafeStringSchema.nullable(),
  cachePosture: AuthMdMetadataCachePostureSchema,
  cacheObservedAt: IsoDateSchema.nullable(),
  cacheMaxAgeSeconds: z.number().int().nonnegative().nullable(),
  authMdDocumentDigest: DigestSchema.nullable(),
  discoveredAt: IsoDateSchema,
  redactionProfileRef: z.literal(AUTH_MD_DISCOVERY_REDACTION_PROFILE),
  credentialMaterialIncluded: z.literal(false),
});
export type AuthMdDiscoveryEvidence = z.infer<typeof AuthMdDiscoveryEvidenceSchema>;

export const BuildAuthMdDiscoveryEvidenceInputSchema = z.strictObject({
  protectedResourceMetadata: AuthMdProtectedResourceMetadataWireSchema,
  protectedResourceMetadataSourceRef: z.string().min(1).nullable().default(null),
  authorizationServerMetadata: AuthMdAuthorizationServerMetadataWireSchema,
  authorizationServerMetadataSourceRef: z.string().min(1).nullable().default(null),
  cachePosture: AuthMdMetadataCachePostureSchema.default("unknown"),
  cacheObservedAt: IsoDateSchema.nullable().default(null),
  cacheMaxAgeSeconds: z.number().int().nonnegative().nullable().default(null),
  authMdDocumentDigest: DigestSchema.nullable().default(null),
  discoveredAt: IsoDateSchema,
});
export type BuildAuthMdDiscoveryEvidenceInput = z.input<typeof BuildAuthMdDiscoveryEvidenceInputSchema>;

export const AuthMdRegistrationEvidenceSchema = z.strictObject({
  evidenceKind: z.literal("auth_md_registration"),
  profile: z.literal(AUTH_MD_REGISTERED_CREDENTIAL_PROFILE),
  authorityCreated: z.literal(false),
  registrationId: AuthMdSafeStringSchema,
  protectedResourceMetadataDigest: DigestSchema,
  authorizationServerMetadataDigest: DigestSchema,
  protectedResource: AuthMdUrlSchema,
  authorizationServer: AuthMdUrlSchema,
  identityFlow: AuthMdIdentityFlowSchema,
  credentialType: AuthMdCredentialTypeSchema,
  scopes: z.array(AuthMdSafeStringSchema),
  credentialLifecycleState: AuthMdCredentialLifecycleStateSchema,
  claimState: AuthMdClaimStateSchema,
  idJagIssuer: AuthMdSafeStringSchema.nullable(),
  idJagSubjectDigest: DigestSchema.nullable(),
  idJagAudience: AuthMdUrlSchema.nullable(),
  idJagJtiDigest: DigestSchema.nullable(),
  idJagAssurancePosture: AuthMdIdentityAssurancePostureSchema.nullable(),
  idJagJwksOrCimdRef: AuthMdSafeStringSchema.nullable(),
  providerRegistryDigest: DigestSchema,
  issuedAt: IsoDateSchema,
  expiresAt: IsoDateSchema.nullable(),
  registeredAt: IsoDateSchema,
  redactionProfileRef: z.literal(AUTH_MD_REGISTRATION_REDACTION_PROFILE),
  credentialMaterialIncluded: z.literal(false),
  credentialMaterialPosture: z.literal("gateway_custody_intake_only"),
  registrationEvidenceDigest: DigestSchema,
});
export type AuthMdRegistrationEvidence = z.infer<typeof AuthMdRegistrationEvidenceSchema>;

export const AuthMdIdentityAssertionEvidenceSchema = z.strictObject({
  evidenceKind: z.literal("auth_md_identity_assertion"),
  profile: z.literal(AUTH_MD_REGISTERED_CREDENTIAL_PROFILE),
  authorityCreated: z.literal(false),
  protectedResource: AuthMdUrlSchema,
  authorizationServer: AuthMdUrlSchema.nullable(),
  issuer: AuthMdSafeStringSchema,
  subjectDigest: DigestSchema,
  audience: AuthMdUrlSchema,
  jtiDigest: DigestSchema,
  verifiedEmailDigest: DigestSchema.nullable(),
  jwksOrCimdRef: AuthMdSafeStringSchema.nullable(),
  assurancePosture: AuthMdIdentityAssurancePostureSchema,
  identityAssertionJwtDigest: DigestSchema.nullable(),
  issuedAt: IsoDateSchema,
  expiresAt: IsoDateSchema,
  redactionProfileRef: z.literal(AUTH_MD_IDENTITY_ASSERTION_REDACTION_PROFILE),
  rawJwtIncluded: z.literal(false),
  piiIncluded: z.literal(false),
  identityAssertionEvidenceDigest: DigestSchema,
});
export type AuthMdIdentityAssertionEvidence = z.infer<typeof AuthMdIdentityAssertionEvidenceSchema>;

export const BuildAuthMdIdentityAssertionEvidenceInputSchema = z.strictObject({
  protectedResource: AuthMdUrlSchema,
  authorizationServer: AuthMdUrlSchema.nullable().default(null),
  issuer: z.string().min(1),
  subject: z.string().min(1),
  audience: AuthMdUrlSchema,
  jti: z.string().min(1),
  verifiedEmail: z.string().email().nullable().default(null),
  jwksOrCimdRef: z.string().min(1).nullable().default(null),
  assurancePosture: AuthMdIdentityAssurancePostureSchema.default("provider_asserted"),
  identityAssertionJwt: z.string().min(1).nullable().default(null),
  issuedAt: IsoDateSchema,
  expiresAt: IsoDateSchema,
});
export type BuildAuthMdIdentityAssertionEvidenceInput = z.input<typeof BuildAuthMdIdentityAssertionEvidenceInputSchema>;

export const AuthMdClaimEvidenceSchema = z.strictObject({
  evidenceKind: z.literal("auth_md_claim"),
  profile: z.literal(AUTH_MD_REGISTERED_CREDENTIAL_PROFILE),
  authorityCreated: z.literal(false),
  registrationId: AuthMdSafeStringSchema,
  protectedResource: AuthMdUrlSchema,
  claimState: AuthMdClaimStateSchema,
  scopeTransition: AuthMdClaimScopeTransitionSchema,
  preClaimCredentialRefId: IdSchema.nullable(),
  preClaimCredentialRefDigest: DigestSchema.nullable(),
  postClaimCredentialRefId: IdSchema.nullable(),
  postClaimCredentialRefDigest: DigestSchema.nullable(),
  claimTokenDigest: DigestSchema.nullable(),
  claimedSubjectDigest: DigestSchema.nullable(),
  verifiedEmailDigest: DigestSchema.nullable(),
  rotateOnClaimRequired: z.boolean(),
  evidenceRefs: z.array(AuthMdSafeStringSchema),
  claimedAt: IsoDateSchema,
  redactionProfileRef: z.literal(AUTH_MD_CLAIM_REDACTION_PROFILE),
  secretMaterialIncluded: z.literal(false),
  piiIncluded: z.literal(false),
  claimEvidenceDigest: DigestSchema,
});
export type AuthMdClaimEvidence = z.infer<typeof AuthMdClaimEvidenceSchema>;

export const BuildAuthMdClaimEvidenceInputSchema = z.strictObject({
  registrationId: z.string().min(1),
  protectedResource: AuthMdUrlSchema,
  claimState: AuthMdClaimStateSchema,
  scopeTransition: AuthMdClaimScopeTransitionSchema,
  preClaimCredentialRefId: IdSchema.nullable().default(null),
  preClaimCredentialRefDigest: DigestSchema.nullable().default(null),
  postClaimCredentialRefId: IdSchema.nullable().default(null),
  postClaimCredentialRefDigest: DigestSchema.nullable().default(null),
  claimToken: z.string().min(1).nullable().default(null),
  claimedSubject: z.string().min(1).nullable().default(null),
  verifiedEmail: z.string().email().nullable().default(null),
  rotateOnClaimRequired: z.boolean().default(true),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  claimedAt: IsoDateSchema,
});
export type BuildAuthMdClaimEvidenceInput = z.input<typeof BuildAuthMdClaimEvidenceInputSchema>;

export const AuthMdRevocationEvidenceSchema = z.strictObject({
  evidenceKind: z.literal("auth_md_revocation"),
  profile: z.literal(AUTH_MD_REGISTERED_CREDENTIAL_PROFILE),
  authorityCreated: z.literal(false),
  registrationId: AuthMdSafeStringSchema,
  protectedResource: AuthMdUrlSchema,
  gatewayCredentialRefId: IdSchema,
  gatewayCredentialRefDigest: DigestSchema,
  revocationEventKind: AuthMdRevocationEventKindSchema,
  revocationReasonCode: AuthMdSafeStringSchema,
  providerEventDigest: DigestSchema.nullable(),
  logoutJwtDigest: DigestSchema.nullable(),
  downstreamStatusDigest: DigestSchema.nullable(),
  isolationRecommended: z.literal(true),
  futurePolicyAndGatewayUseAllowed: z.literal(false),
  evidenceRefs: z.array(AuthMdSafeStringSchema),
  observedAt: IsoDateSchema,
  redactionProfileRef: z.literal(AUTH_MD_REVOCATION_REDACTION_PROFILE),
  secretMaterialIncluded: z.literal(false),
  piiIncluded: z.literal(false),
  revocationEvidenceDigest: DigestSchema,
});
export type AuthMdRevocationEvidence = z.infer<typeof AuthMdRevocationEvidenceSchema>;

export const BuildAuthMdRevocationEvidenceInputSchema = z.strictObject({
  registrationId: z.string().min(1),
  protectedResource: AuthMdUrlSchema,
  gatewayCredentialRefId: IdSchema,
  gatewayCredentialRefDigest: DigestSchema,
  revocationEventKind: AuthMdRevocationEventKindSchema,
  revocationReasonCode: z.string().min(1),
  providerEvent: z.unknown().nullable().default(null),
  logoutJwt: z.string().min(1).nullable().default(null),
  downstreamStatus: z.unknown().nullable().default(null),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  observedAt: IsoDateSchema,
});
export type BuildAuthMdRevocationEvidenceInput = z.input<typeof BuildAuthMdRevocationEvidenceInputSchema>;

export const BuildAuthMdGatewayCredentialIntakeInputSchema = z.strictObject({
  tenantId: IdSchema,
  organizationId: IdSchema,
  principalId: IdSchema.nullable().default(null),
  gatewayId: IdSchema,
  gatewayRegistryEntryId: IdSchema,
  registrationId: z.string().min(1),
  protectedResourceMetadataDigest: DigestSchema,
  authorizationServerMetadataDigest: DigestSchema,
  protectedResource: AuthMdUrlSchema,
  authorizationServer: AuthMdUrlSchema,
  identityFlow: AuthMdIdentityFlowSchema,
  credentialType: AuthMdCredentialTypeSchema,
  scopes: z.array(z.string().min(1)).min(1),
  credentialMaterial: z.string().min(1),
  credentialLifecycleState: AuthMdCredentialLifecycleStateSchema.default("active"),
  claimState: AuthMdClaimStateSchema.default("not_applicable"),
  idJagIssuer: z.string().min(1).nullable().default(null),
  idJagSubject: z.string().min(1).nullable().default(null),
  idJagAudience: AuthMdUrlSchema.nullable().default(null),
  idJagJti: z.string().min(1).nullable().default(null),
  idJagAssurancePosture: AuthMdIdentityAssurancePostureSchema.nullable().default(null),
  idJagJwksOrCimdRef: z.string().min(1).nullable().default(null),
  issuedAt: IsoDateSchema,
  expiresAt: IsoDateSchema.nullable().default(null),
  registeredAt: IsoDateSchema,
  gatewayCredentialRefId: IdSchema.optional(),
  protectedSurfaceKind: z.string().min(1).default("auth_md_api"),
  actionClasses: z.array(z.string().min(1)).min(1).default(["auth_md_protected_api_call.exact"]),
  resourceNamespaceRef: z.string().min(1).optional(),
  custodyStatus: GatewayCredentialRefSchema.shape.custodyStatus.default("gateway_held"),
  resolverRef: z.string().min(1).default("resolver:auth-md-gateway-custody"),
  resolverVersion: z.string().min(1).default("v0"),
});
export type BuildAuthMdGatewayCredentialIntakeInput = z.input<typeof BuildAuthMdGatewayCredentialIntakeInputSchema>;

export type AuthMdGatewayCredentialIntake = {
  registrationEvidence: AuthMdRegistrationEvidence;
  credentialRefInput: RegisterGatewayCredentialRefInput;
};

export async function buildAuthMdDiscoveryEvidence(
  inputValue: BuildAuthMdDiscoveryEvidenceInput,
): Promise<AuthMdDiscoveryEvidence> {
  const input = BuildAuthMdDiscoveryEvidenceInputSchema.parse(inputValue);
  const protectedResourceMetadata = normalizeProtectedResourceMetadata(input.protectedResourceMetadata);
  const authorizationServerMetadata = normalizeAuthorizationServerMetadata(input.authorizationServerMetadata);
  assertAuthMdDiscoveryChainMatches(protectedResourceMetadata, authorizationServerMetadata);
  const protectedResourceMetadataDigest = await digestCanonical(protectedResourceMetadata as unknown as JsonValue);
  const authorizationServerMetadataDigest = await digestCanonical(authorizationServerMetadata as unknown as JsonValue);
  return AuthMdDiscoveryEvidenceSchema.parse({
    evidenceKind: "auth_md_discovery",
    profile: AUTH_MD_REGISTERED_CREDENTIAL_PROFILE,
    authorityCreated: false,
    metadataSourceOfTruth: "oauth_protected_resource_metadata_chain",
    agentAuthSourceOfTruth: "oauth_authorization_server_metadata",
    protectedResourceMetadata,
    protectedResourceMetadataDigest,
    protectedResourceMetadataSourceRef: input.protectedResourceMetadataSourceRef,
    authorizationServerMetadata,
    authorizationServerMetadataDigest,
    authorizationServerMetadataSourceRef: input.authorizationServerMetadataSourceRef,
    cachePosture: input.cachePosture,
    cacheObservedAt: input.cacheObservedAt,
    cacheMaxAgeSeconds: input.cacheMaxAgeSeconds,
    authMdDocumentDigest: input.authMdDocumentDigest,
    discoveredAt: input.discoveredAt,
    redactionProfileRef: AUTH_MD_DISCOVERY_REDACTION_PROFILE,
    credentialMaterialIncluded: false,
  });
}

export async function buildAuthMdGatewayCredentialIntake(
  inputValue: BuildAuthMdGatewayCredentialIntakeInput,
): Promise<AuthMdGatewayCredentialIntake> {
  const input = BuildAuthMdGatewayCredentialIntakeInputSchema.parse(inputValue);
  if (input.idJagAudience) {
    assertAuthMdAudienceMatchesProtectedResource(
      input.idJagAudience,
      input.protectedResource,
      input.authorizationServer,
    );
  }
  assertNoLeakedAuthMdCredentialMaterial(nonSecretIntakeMaterial(input));
  const providerRegistryDigest = await digestCanonical(providerRegistryDigestMaterial(input));
  const idJagSubjectDigest = input.idJagSubject ? await digestCanonical({ idJagSubject: input.idJagSubject }) : null;
  const idJagJtiDigest = input.idJagJti ? await digestCanonical({ idJagJti: input.idJagJti }) : null;
  const registrationEvidenceSeed = {
    evidenceKind: "auth_md_registration" as const,
    profile: AUTH_MD_REGISTERED_CREDENTIAL_PROFILE,
    authorityCreated: false as const,
    registrationId: input.registrationId,
    protectedResourceMetadataDigest: input.protectedResourceMetadataDigest,
    authorizationServerMetadataDigest: input.authorizationServerMetadataDigest,
    protectedResource: input.protectedResource,
    authorizationServer: input.authorizationServer,
    identityFlow: input.identityFlow,
    credentialType: input.credentialType,
    scopes: sortedUnique(input.scopes),
    credentialLifecycleState: input.credentialLifecycleState,
    claimState: input.claimState,
    idJagIssuer: input.idJagIssuer,
    idJagSubjectDigest,
    idJagAudience: input.idJagAudience,
    idJagJtiDigest,
    idJagAssurancePosture: input.idJagAssurancePosture,
    idJagJwksOrCimdRef: input.idJagJwksOrCimdRef,
    providerRegistryDigest,
    issuedAt: input.issuedAt,
    expiresAt: input.expiresAt,
    registeredAt: input.registeredAt,
    redactionProfileRef: AUTH_MD_REGISTRATION_REDACTION_PROFILE,
    credentialMaterialIncluded: false as const,
    credentialMaterialPosture: "gateway_custody_intake_only" as const,
  };
  const registrationEvidenceDigest = await digestCanonical(registrationEvidenceSeed);
  const registrationEvidence = AuthMdRegistrationEvidenceSchema.parse({
    ...registrationEvidenceSeed,
    registrationEvidenceDigest,
  });

  const credentialRefInput: RegisterGatewayCredentialRefInput = {
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    ...(input.gatewayCredentialRefId ? { gatewayCredentialRefId: input.gatewayCredentialRefId } : {}),
    principalId: input.principalId,
    gatewayId: input.gatewayId,
    gatewayRegistryEntryId: input.gatewayRegistryEntryId,
    protectedSurfaceKind: input.protectedSurfaceKind,
    actionClasses: input.actionClasses,
    resourceRefs: [authMdProtectedResourceRef(input.protectedResource)],
    resourceNamespaceRef: input.resourceNamespaceRef ?? authMdResourceNamespaceRef(input.protectedResource),
    credentialKind: `auth_md_${input.credentialType}`,
    custodyStatus: input.custodyStatus,
    providerClass: "auth_md",
    providerRegistryRef: authMdProviderRegistryRef(input.protectedResource, input.registrationId),
    providerRegistryDigest,
    resolverRef: input.resolverRef,
    resolverVersion: input.resolverVersion,
    evidenceExpectationRefs: [
      authMdEvidenceRef("discovery", input.protectedResourceMetadataDigest),
      authMdEvidenceRef("authorization-server", input.authorizationServerMetadataDigest),
      authMdEvidenceRef("registration", registrationEvidence.registrationEvidenceDigest),
    ],
    issuedAt: input.issuedAt,
    expiresAt: input.expiresAt,
  };

  return { registrationEvidence, credentialRefInput };
}

export async function buildAuthMdIdentityAssertionEvidence(
  inputValue: BuildAuthMdIdentityAssertionEvidenceInput,
): Promise<AuthMdIdentityAssertionEvidence> {
  const input = BuildAuthMdIdentityAssertionEvidenceInputSchema.parse(inputValue);
  assertAuthMdAudienceMatchesProtectedResource(input.audience, input.protectedResource, input.authorizationServer);
  assertNoLeakedAuthMdCredentialMaterial(nonSecretIdentityAssertionMaterial(input));
  const subjectDigest = await digestCanonical({ idJagSubject: input.subject });
  const jtiDigest = await digestCanonical({ idJagJti: input.jti });
  const verifiedEmailDigest = input.verifiedEmail
    ? await digestCanonical({ verifiedEmail: input.verifiedEmail })
    : null;
  const identityAssertionJwtDigest = input.identityAssertionJwt
    ? await digestCanonical({ identityAssertionJwt: input.identityAssertionJwt })
    : null;
  const evidenceSeed = {
    evidenceKind: "auth_md_identity_assertion" as const,
    profile: AUTH_MD_REGISTERED_CREDENTIAL_PROFILE,
    authorityCreated: false as const,
    protectedResource: input.protectedResource,
    authorizationServer: input.authorizationServer,
    issuer: input.issuer,
    subjectDigest,
    audience: input.audience,
    jtiDigest,
    verifiedEmailDigest,
    jwksOrCimdRef: input.jwksOrCimdRef,
    assurancePosture: input.assurancePosture,
    identityAssertionJwtDigest,
    issuedAt: input.issuedAt,
    expiresAt: input.expiresAt,
    redactionProfileRef: AUTH_MD_IDENTITY_ASSERTION_REDACTION_PROFILE,
    rawJwtIncluded: false as const,
    piiIncluded: false as const,
  };
  const identityAssertionEvidenceDigest = await digestCanonical(evidenceSeed);
  return AuthMdIdentityAssertionEvidenceSchema.parse({ ...evidenceSeed, identityAssertionEvidenceDigest });
}

export async function buildAuthMdClaimEvidence(
  inputValue: BuildAuthMdClaimEvidenceInput,
): Promise<AuthMdClaimEvidence> {
  const input = BuildAuthMdClaimEvidenceInputSchema.parse(inputValue);
  assertNoLeakedAuthMdCredentialMaterial(nonSecretClaimMaterial(input));
  const claimTokenDigest = input.claimToken ? await digestCanonical({ claimToken: input.claimToken }) : null;
  const claimedSubjectDigest = input.claimedSubject
    ? await digestCanonical({ claimedSubject: input.claimedSubject })
    : null;
  const verifiedEmailDigest = input.verifiedEmail
    ? await digestCanonical({ verifiedEmail: input.verifiedEmail })
    : null;
  const evidenceSeed = {
    evidenceKind: "auth_md_claim" as const,
    profile: AUTH_MD_REGISTERED_CREDENTIAL_PROFILE,
    authorityCreated: false as const,
    registrationId: input.registrationId,
    protectedResource: input.protectedResource,
    claimState: input.claimState,
    scopeTransition: input.scopeTransition,
    preClaimCredentialRefId: input.preClaimCredentialRefId,
    preClaimCredentialRefDigest: input.preClaimCredentialRefDigest,
    postClaimCredentialRefId: input.postClaimCredentialRefId,
    postClaimCredentialRefDigest: input.postClaimCredentialRefDigest,
    claimTokenDigest,
    claimedSubjectDigest,
    verifiedEmailDigest,
    rotateOnClaimRequired: input.rotateOnClaimRequired,
    evidenceRefs: input.evidenceRefs,
    claimedAt: input.claimedAt,
    redactionProfileRef: AUTH_MD_CLAIM_REDACTION_PROFILE,
    secretMaterialIncluded: false as const,
    piiIncluded: false as const,
  };
  const claimEvidenceDigest = await digestCanonical(evidenceSeed);
  return AuthMdClaimEvidenceSchema.parse({ ...evidenceSeed, claimEvidenceDigest });
}

export async function buildAuthMdRevocationEvidence(
  inputValue: BuildAuthMdRevocationEvidenceInput,
): Promise<AuthMdRevocationEvidence> {
  const input = BuildAuthMdRevocationEvidenceInputSchema.parse(inputValue);
  assertNoLeakedAuthMdCredentialMaterial(nonSecretRevocationMaterial(input));
  const providerEventDigest = input.providerEvent ? await digestCanonical(toJsonValue(input.providerEvent)) : null;
  const logoutJwtDigest = input.logoutJwt ? await digestCanonical({ logoutJwt: input.logoutJwt }) : null;
  const downstreamStatusDigest = input.downstreamStatus
    ? await digestCanonical(toJsonValue(input.downstreamStatus))
    : null;
  const evidenceSeed = {
    evidenceKind: "auth_md_revocation" as const,
    profile: AUTH_MD_REGISTERED_CREDENTIAL_PROFILE,
    authorityCreated: false as const,
    registrationId: input.registrationId,
    protectedResource: input.protectedResource,
    gatewayCredentialRefId: input.gatewayCredentialRefId,
    gatewayCredentialRefDigest: input.gatewayCredentialRefDigest,
    revocationEventKind: input.revocationEventKind,
    revocationReasonCode: input.revocationReasonCode,
    providerEventDigest,
    logoutJwtDigest,
    downstreamStatusDigest,
    isolationRecommended: true as const,
    futurePolicyAndGatewayUseAllowed: false as const,
    evidenceRefs: input.evidenceRefs,
    observedAt: input.observedAt,
    redactionProfileRef: AUTH_MD_REVOCATION_REDACTION_PROFILE,
    secretMaterialIncluded: false as const,
    piiIncluded: false as const,
  };
  const revocationEvidenceDigest = await digestCanonical(evidenceSeed);
  return AuthMdRevocationEvidenceSchema.parse({ ...evidenceSeed, revocationEvidenceDigest });
}

export function authMdGatewayCredentialBindingFor(
  credentialRef: GatewayCredentialRef,
  credentialUseName = "auth_md_service_credential",
) {
  return {
    credentialUseName,
    gatewayCredentialRefId: credentialRef.gatewayCredentialRefId,
    gatewayCredentialRefDigest: credentialRef.gatewayCredentialRefDigest,
    providerRegistryRef: credentialRef.providerRegistryRef,
    providerRegistryDigest: credentialRef.providerRegistryDigest,
    requiredCredentialCustodyStatus: credentialRef.custodyStatus,
    evidenceExpectationRefs: credentialRef.evidenceExpectationRefs,
  };
}

export function normalizeProtectedResourceMetadata(
  value: AuthMdProtectedResourceMetadataWire,
): AuthMdProtectedResourceMetadata {
  const metadata = AuthMdProtectedResourceMetadataWireSchema.parse(value);
  return AuthMdProtectedResourceMetadataSchema.parse({
    resource: metadata.resource,
    resourceName: metadata.resource_name ?? null,
    resourceLogoUri: metadata.resource_logo_uri ?? null,
    authorizationServers: sortedUnique(metadata.authorization_servers),
    scopesSupported: sortedUnique(metadata.scopes_supported),
    bearerMethodsSupported: sortedUnique(metadata.bearer_methods_supported),
  });
}

export function normalizeAuthorizationServerMetadata(
  value: AuthMdAuthorizationServerMetadataWire,
): AuthMdAuthorizationServerMetadata {
  const metadata = AuthMdAuthorizationServerMetadataWireSchema.parse(value);
  const agentAuth = normalizeAgentAuthMetadata(metadata.agent_auth);
  return AuthMdAuthorizationServerMetadataSchema.parse({
    issuer: metadata.issuer ?? null,
    resource: metadata.resource ?? null,
    authorizationServers: sortedUnique(metadata.authorization_servers),
    scopesSupported: sortedUnique(metadata.scopes_supported),
    bearerMethodsSupported: sortedUnique(metadata.bearer_methods_supported),
    jwksUri: metadata.jwks_uri ?? null,
    authorizationEndpoint: metadata.authorization_endpoint ?? null,
    tokenEndpoint: metadata.token_endpoint ?? null,
    claimsSupported: sortedUnique(metadata.claims_supported),
    agentAuth,
  });
}

export function normalizeAgentAuthMetadata(value: AuthMdAgentAuthMetadataWire): AuthMdAgentAuthMetadata {
  const metadata = AuthMdAgentAuthMetadataWireSchema.parse(value);
  const anonymousCredentialTypes = sortedUnique(metadata.anonymous?.credential_types_supported ?? []);
  const identityAssertionCredentialTypes = sortedUnique(metadata.identity_assertion?.credential_types_supported ?? []);
  return AuthMdAgentAuthMetadataSchema.parse({
    skill: metadata.skill ?? null,
    registerUri: metadata.register_uri,
    claimUri: metadata.claim_uri ?? null,
    revocationUri: metadata.revocation_uri ?? null,
    identityTypes: sortedUnique(metadata.identity_types_supported),
    credentialTypes: sortedUnique([...anonymousCredentialTypes, ...identityAssertionCredentialTypes]),
    anonymousCredentialTypes,
    identityAssertionCredentialTypes,
    identityAssertionTypes: sortedUnique(metadata.identity_assertion?.assertion_types_supported ?? []),
    eventsSupported: sortedUnique(metadata.events_supported),
  });
}

export function assertNoLeakedAuthMdCredentialMaterial(value: unknown): void {
  const leakPath = findCredentialMaterialPath(value);
  if (leakPath) {
    throw new Error(`auth.md adapter evidence must not contain raw credential material at ${leakPath}`);
  }
}

export function assertAuthMdDiscoveryChainMatches(
  protectedResourceMetadata: AuthMdProtectedResourceMetadata,
  authorizationServerMetadata: AuthMdAuthorizationServerMetadata,
): void {
  if (
    authorizationServerMetadata.resource &&
    canonicalAuthMdResourceUrl(authorizationServerMetadata.resource) !==
      canonicalAuthMdResourceUrl(protectedResourceMetadata.resource)
  ) {
    throw new Error("auth.md authorization-server metadata resource does not match protected resource metadata");
  }

  const advertisedAuthorizationServerOrigins = new Set(
    protectedResourceMetadata.authorizationServers.map((url) => new URL(url).origin),
  );
  const authServerRestatementOrigins = authorizationServerMetadata.authorizationServers.map(
    (url) => new URL(url).origin,
  );
  if (
    authServerRestatementOrigins.length > 0 &&
    !authServerRestatementOrigins.some((origin) => advertisedAuthorizationServerOrigins.has(origin))
  ) {
    throw new Error("auth.md authorization-server metadata is not advertised by protected resource metadata");
  }

  for (const endpoint of [
    authorizationServerMetadata.agentAuth.registerUri,
    authorizationServerMetadata.agentAuth.claimUri,
    authorizationServerMetadata.agentAuth.revocationUri,
  ]) {
    if (endpoint && !advertisedAuthorizationServerOrigins.has(new URL(endpoint).origin)) {
      throw new Error("auth.md agent_auth endpoint origin is not advertised by protected resource metadata");
    }
  }
}

export function assertAuthMdAudienceMatchesProtectedResource(
  audience: string,
  protectedResource: string,
  authorizationServer?: string | null,
): void {
  const allowedAudiences = new Set([
    canonicalAuthMdResourceUrl(protectedResource),
    ...(authorizationServer ? [canonicalAuthMdResourceUrl(authorizationServer)] : []),
  ]);
  if (!allowedAudiences.has(canonicalAuthMdResourceUrl(audience))) {
    throw new Error("auth.md audience/resource mismatch refused before credential custody activation");
  }
}

export function authMdProtectedResourceRef(protectedResource: string): string {
  const url = new URL(protectedResource);
  return `auth-md:${url.origin}${url.pathname}`;
}

export function authMdResourceNamespaceRef(protectedResource: string): string {
  return `auth-md:${new URL(protectedResource).origin}`;
}

export function authMdProviderRegistryRef(protectedResource: string, registrationId: string): string {
  return `auth-md:${new URL(protectedResource).origin}:registration:${registrationId}`;
}

export function authMdEvidenceRef(
  kind: "discovery" | "authorization-server" | "identity-assertion" | "registration" | "claim" | "revocation",
  digest: string,
) {
  return `evidence:auth-md-${kind}:${digest.slice("sha256:".length, "sha256:".length + 16)}`;
}

function nonSecretIntakeMaterial(input: z.infer<typeof BuildAuthMdGatewayCredentialIntakeInputSchema>): unknown {
  const { credentialMaterial: _credentialMaterial, idJagSubject: _idJagSubject, idJagJti: _idJagJti, ...safe } = input;
  return safe;
}

function nonSecretIdentityAssertionMaterial(
  input: z.infer<typeof BuildAuthMdIdentityAssertionEvidenceInputSchema>,
): unknown {
  const {
    subject: _subject,
    jti: _jti,
    verifiedEmail: _verifiedEmail,
    identityAssertionJwt: _identityAssertionJwt,
    ...safe
  } = input;
  return safe;
}

function nonSecretClaimMaterial(input: z.infer<typeof BuildAuthMdClaimEvidenceInputSchema>): unknown {
  const { claimToken: _claimToken, claimedSubject: _claimedSubject, verifiedEmail: _verifiedEmail, ...safe } = input;
  return safe;
}

function nonSecretRevocationMaterial(input: z.infer<typeof BuildAuthMdRevocationEvidenceInputSchema>): unknown {
  const { logoutJwt: _logoutJwt, providerEvent: _providerEvent, downstreamStatus: _downstreamStatus, ...safe } = input;
  return safe;
}

function providerRegistryDigestMaterial(
  input: z.infer<typeof BuildAuthMdGatewayCredentialIntakeInputSchema>,
): JsonValue {
  return {
    profile: AUTH_MD_REGISTERED_CREDENTIAL_PROFILE,
    protectedResourceMetadataDigest: input.protectedResourceMetadataDigest,
    authorizationServerMetadataDigest: input.authorizationServerMetadataDigest,
    protectedResource: input.protectedResource,
    authorizationServer: input.authorizationServer,
    registrationId: input.registrationId,
    identityFlow: input.identityFlow,
    credentialType: input.credentialType,
    scopes: sortedUnique(input.scopes),
    credentialLifecycleState: input.credentialLifecycleState,
    claimState: input.claimState,
    idJagIssuer: input.idJagIssuer,
    idJagAudience: input.idJagAudience,
    idJagAssurancePosture: input.idJagAssurancePosture,
    idJagJwksOrCimdRef: input.idJagJwksOrCimdRef,
    issuedAt: input.issuedAt,
    expiresAt: input.expiresAt,
  };
}

function canonicalAuthMdResourceUrl(value: string): string {
  const url = new URL(value);
  const pathname = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");
  return `${url.origin}${pathname}`;
}

function toJsonValue(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

function sortedUnique<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort();
}

function findCredentialMaterialPath(value: unknown, path = "$"): string | null {
  if (typeof value === "string") return looksLikeAuthMdCredentialMaterial(value) ? path : null;
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const found = findCredentialMaterialPath(item, `${path}[${index}]`);
      if (found) return found;
    }
    return null;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      const found = findCredentialMaterialPath(item, `${path}.${key}`);
      if (found) return found;
    }
  }
  return null;
}

function looksLikeAuthMdCredentialMaterial(value: string): boolean {
  return credentialMaterialVariants(value).some((variant) =>
    [
      /BEGIN\s+(?:RSA\s+|EC\s+|OPENSSH\s+)?PRIVATE KEY/i,
      /\bBearer\s+[A-Za-z0-9._~+/-]+=*/i,
      /\b(?:api[_-]?key|access[_-]?token|claim[_-]?token|refresh[_-]?token|client[_-]?secret|password)\s*[:=]\s*\S+/i,
      /\bsecret\s*[:=]\s*\S+/i,
      /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,
    ].some((pattern) => pattern.test(variant)),
  );
}

function credentialMaterialVariants(value: string): string[] {
  const variants = new Set<string>([value]);
  try {
    variants.add(decodeURIComponent(value));
  } catch {
    // Keep the original value only when percent decoding is malformed.
  }

  for (const token of value.match(/[A-Za-z0-9+/_=-]{16,}/g) ?? []) {
    const decoded = decodeBase64Like(token);
    if (decoded) variants.add(decoded);
  }

  return [...variants];
}

function decodeBase64Like(token: string): string | null {
  const normalized = token.replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) return null;
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  try {
    const decoded = atob(`${normalized}${"=".repeat(paddingLength)}`);
    return /^[\x09\x0a\x0d\x20-\x7e]+$/.test(decoded) ? decoded : null;
  } catch {
    return null;
  }
}
