import { z } from "zod";
import { digestCanonical } from "../protocol/foundation/canonical";
import { HandshakeProtocolError } from "../protocol/foundation/errors";
import {
  DigestSchema,
  IdSchema,
  IsoDateSchema,
  JsonValueSchema,
  ParticipantIdentityBindingSchema,
  type JsonValue,
  type ParticipantIdentityBinding,
} from "../protocol/public/schemas";
import type { TransitionRequestCallerEvidence } from "../protocol/context/request-contexts";
import type { TransitionCallerRole } from "./roles";
import { HostedReadRoleSchema, HostedScopeSchema } from "./hosted-admission-config";

export const HostedIdentityProviderKindSchema = z.enum([
  "clerk",
  "oauth_oidc",
  "cloudflare_access",
  "custom_jwt",
  "service_credential",
  "test_fixture",
  "other",
]);
export type HostedIdentityProviderKind = z.infer<typeof HostedIdentityProviderKindSchema>;

export const HostedIdentityEvidenceInputSchema = z.strictObject({
  providerKind: HostedIdentityProviderKindSchema,
  authProviderRef: z.string().min(1).max(500),
  callerIdentityRef: z.string().min(1).max(500).nullable().default(null),
  subjectRef: z.string().min(1).max(500).nullable().default(null),
  subjectDigest: DigestSchema.nullable().default(null),
  tenantId: IdSchema,
  organizationId: IdSchema,
  projectId: IdSchema.nullable().default(null),
  workspaceId: IdSchema.nullable().default(null),
  custodyRoles: z.array(z.enum(["control_plane", "runtime_evidence", "gateway_custody", "review_custody"])).min(1),
  hostedRoles: z.array(HostedReadRoleSchema).default([]),
  hostedScopes: z.array(HostedScopeSchema).default([]),
  sessionRef: z.string().min(1).max(500).nullable().default(null),
  sessionDigest: DigestSchema.nullable().default(null),
  serviceCredentialRef: z.string().min(1).max(500).nullable().default(null),
  serviceCredentialDigest: DigestSchema.nullable().default(null),
  claims: JsonValueSchema.nullable().default(null),
  claimsDigest: DigestSchema.nullable().default(null),
  membershipRefs: z.array(z.string().min(1).max(500)).default([]),
  evidenceRefs: z.array(z.string().min(1).max(500)).default([]),
  issuedAt: IsoDateSchema,
  expiresAt: IsoDateSchema,
  revocationEpochRef: z.string().min(1).max(500),
});
export type HostedIdentityEvidenceInput = z.input<typeof HostedIdentityEvidenceInputSchema>;
export type HostedIdentityEvidence = z.infer<typeof HostedIdentityEvidenceInputSchema>;

export const TransitionCallerIdentitySchema = z
  .strictObject({
    callerIdentityRef: z.string().min(1).max(500),
    callerSubjectDigest: DigestSchema,
    tenantId: IdSchema,
    organizationId: IdSchema,
    projectId: IdSchema.nullable().default(null),
    workspaceId: IdSchema.nullable().default(null),
    custodyRoles: z.array(z.enum(["control_plane", "runtime_evidence", "gateway_custody", "review_custody"])).min(1),
    hostedRoles: z.array(HostedReadRoleSchema).default([]),
    hostedScopes: z.array(HostedScopeSchema).default([]),
    authProviderRef: z.string().min(1).max(500),
    authSessionDigest: DigestSchema.nullable().default(null),
    serviceCredentialDigest: DigestSchema.nullable().default(null),
    issuedAt: IsoDateSchema,
    expiresAt: IsoDateSchema,
    revocationEpochRef: z.string().min(1).max(500),
    claimsDigest: DigestSchema,
  })
  .superRefine((identity, ctx) => {
    const sourceCount = [identity.authSessionDigest, identity.serviceCredentialDigest].filter(Boolean).length;
    if (sourceCount !== 1) {
      ctx.addIssue({
        code: "custom",
        path: ["authSessionDigest"],
        message: "TransitionCallerIdentity must contain exactly one auth source digest.",
      });
    }
  });

export type TransitionCallerIdentity = z.infer<typeof TransitionCallerIdentitySchema>;

export const HostedParticipantIdentityBindingInputSchema = z.strictObject({
  participantRole: z.enum(["principal", "agent"]),
  participantRef: IdSchema,
  verificationEvidenceRef: z.string().min(1).max(500).nullable().default(null),
  bindingEvidenceRef: z.string().min(1).max(500).nullable().default(null),
});
export type HostedParticipantIdentityBindingInput = z.input<typeof HostedParticipantIdentityBindingInputSchema>;

export type HostedCallerVerifierInput = {
  headers: Headers;
  method: string;
  url: string;
  requiredRole: TransitionCallerRole;
  requiredRoles: readonly TransitionCallerRole[];
  routeId: string;
  routePath: string;
  now: string;
};

export type HostedCallerVerifier = {
  verify(input: HostedCallerVerifierInput): Promise<TransitionCallerIdentity>;
};

export type TransitionScope = {
  tenantId: string;
  organizationId: string;
  projectId?: string | null;
  workspaceId?: string | null;
};

export async function transitionCallerIdentityFromHostedEvidence(
  value: HostedIdentityEvidenceInput,
): Promise<TransitionCallerIdentity> {
  const evidence = HostedIdentityEvidenceInputSchema.parse(value);
  const callerSubjectDigest =
    evidence.subjectDigest ??
    (evidence.subjectRef
      ? await digestCanonical({
          providerKind: evidence.providerKind,
          authProviderRef: evidence.authProviderRef,
          subjectRef: evidence.subjectRef,
        })
      : null);
  if (!callerSubjectDigest) {
    throw new HandshakeProtocolError(
      "hosted_caller_identity_invalid",
      "Hosted identity evidence requires either a subject digest or a subject ref that can be digested.",
      403,
      { retryability: "terminal", commitState: "not_started" },
    );
  }

  const authSessionDigest =
    evidence.sessionDigest ??
    (evidence.sessionRef
      ? await digestCanonical({
          providerKind: evidence.providerKind,
          authProviderRef: evidence.authProviderRef,
          sessionRef: evidence.sessionRef,
        })
      : null);
  const serviceCredentialDigest =
    evidence.serviceCredentialDigest ??
    (evidence.serviceCredentialRef
      ? await digestCanonical({
          providerKind: evidence.providerKind,
          authProviderRef: evidence.authProviderRef,
          serviceCredentialRef: evidence.serviceCredentialRef,
        })
      : null);
  const claimsDigest =
    evidence.claimsDigest ??
    (await digestCanonical({
      providerKind: evidence.providerKind,
      authProviderRef: evidence.authProviderRef,
      subjectDigest: callerSubjectDigest,
      tenantId: evidence.tenantId,
      organizationId: evidence.organizationId,
      projectId: evidence.projectId,
      workspaceId: evidence.workspaceId,
      custodyRoles: evidence.custodyRoles,
      hostedRoles: evidence.hostedRoles,
      hostedScopes: evidence.hostedScopes,
      membershipRefs: evidence.membershipRefs,
      evidenceRefs: evidence.evidenceRefs,
      claims: evidence.claims,
    } satisfies JsonValue));
  const callerIdentityRef =
    evidence.callerIdentityRef ??
    `hosted-identity:${evidence.providerKind}:${(
      await digestCanonical({
        authProviderRef: evidence.authProviderRef,
        subjectDigest: callerSubjectDigest,
        tenantId: evidence.tenantId,
        organizationId: evidence.organizationId,
        projectId: evidence.projectId,
        workspaceId: evidence.workspaceId,
      })
    ).slice("sha256:".length, "sha256:".length + 16)}`;

  return parseHostedCallerIdentity({
    callerIdentityRef,
    callerSubjectDigest,
    tenantId: evidence.tenantId,
    organizationId: evidence.organizationId,
    projectId: evidence.projectId,
    workspaceId: evidence.workspaceId,
    custodyRoles: evidence.custodyRoles,
    hostedRoles: evidence.hostedRoles,
    hostedScopes: evidence.hostedScopes,
    authProviderRef: evidence.authProviderRef,
    authSessionDigest,
    serviceCredentialDigest,
    issuedAt: evidence.issuedAt,
    expiresAt: evidence.expiresAt,
    revocationEpochRef: evidence.revocationEpochRef,
    claimsDigest,
  });
}

export function participantIdentityBindingFromHostedCallerIdentity(
  identityValue: TransitionCallerIdentity,
  inputValue: HostedParticipantIdentityBindingInput,
): ParticipantIdentityBinding {
  const identity = TransitionCallerIdentitySchema.parse(identityValue);
  const input = HostedParticipantIdentityBindingInputSchema.parse(inputValue);
  return ParticipantIdentityBindingSchema.parse({
    participantRole: input.participantRole,
    participantRef: input.participantRef,
    identityProviderRef: identity.authProviderRef,
    subjectRef: null,
    subjectDigest: identity.callerSubjectDigest,
    claimsDigest: identity.claimsDigest,
    verificationEvidenceRef: input.verificationEvidenceRef ?? identity.callerIdentityRef,
    bindingEvidenceRef: input.bindingEvidenceRef,
    issuedAt: identity.issuedAt,
    expiresAt: identity.expiresAt,
    authorityPosture: "evidence_only",
  });
}

export function parseHostedCallerIdentity(value: unknown): TransitionCallerIdentity {
  const parsed = TransitionCallerIdentitySchema.safeParse(value);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message;
    throw new HandshakeProtocolError(
      "hosted_caller_identity_invalid",
      firstIssue ?? "Hosted caller identity did not satisfy the transition admission schema.",
      403,
      { retryability: "terminal", commitState: "not_started" },
    );
  }
  return parsed.data;
}

export function assertHostedCallerRole(identity: TransitionCallerIdentity, requiredRole: TransitionCallerRole): void {
  if (!identity.custodyRoles.includes(requiredRole)) {
    throw new HandshakeProtocolError(
      "hosted_caller_role_forbidden",
      `Hosted caller identity does not satisfy ${requiredRole} transition custody.`,
      403,
      { retryability: "terminal", commitState: "not_started" },
    );
  }
}

export function assertHostedCallerAnyRole(
  identity: TransitionCallerIdentity,
  requiredRoles: readonly TransitionCallerRole[],
): void {
  if (!requiredRoles.some((role) => identity.custodyRoles.includes(role))) {
    throw new HandshakeProtocolError(
      "hosted_caller_role_forbidden",
      `Hosted caller identity does not satisfy ${requiredRoles.join(" or ")} transition custody.`,
      403,
      { retryability: "terminal", commitState: "not_started" },
    );
  }
}

export function assertHostedCallerFresh(
  identity: TransitionCallerIdentity,
  now: string,
  maxIdentityAgeSeconds?: number,
): void {
  const issuedAt = Date.parse(identity.issuedAt);
  const expiresAt = Date.parse(identity.expiresAt);
  const nowMs = Date.parse(now);
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || !Number.isFinite(nowMs)) {
    throw new HandshakeProtocolError(
      "hosted_caller_identity_invalid",
      "Hosted caller identity timestamps are not parseable.",
      403,
      { retryability: "terminal", commitState: "not_started" },
    );
  }
  if (issuedAt > nowMs || expiresAt <= nowMs) {
    throw new HandshakeProtocolError(
      "hosted_caller_identity_expired",
      "Hosted caller identity is not valid at the transition admission time.",
      412,
      { retryability: "terminal", commitState: "not_started" },
    );
  }
  if (maxIdentityAgeSeconds !== undefined && nowMs - issuedAt > maxIdentityAgeSeconds * 1000) {
    throw new HandshakeProtocolError(
      "hosted_caller_identity_stale",
      "Hosted caller identity is older than the configured freshness window.",
      412,
      { retryability: "terminal", commitState: "not_started" },
    );
  }
}

export function assertHostedCallerScope(identity: TransitionCallerIdentity, scope: TransitionScope): void {
  if (
    identity.tenantId !== scope.tenantId ||
    identity.organizationId !== scope.organizationId ||
    (scope.projectId !== undefined && identity.projectId !== scope.projectId) ||
    (scope.workspaceId !== undefined && identity.workspaceId !== scope.workspaceId)
  ) {
    throw new HandshakeProtocolError(
      "hosted_caller_scope_forbidden",
      "Hosted caller identity cannot write transition records for the requested tenant/org/project/workspace scope.",
      403,
      { retryability: "terminal", commitState: "not_started" },
    );
  }
}

export async function transitionCallerEvidenceFromIdentity(
  identity: TransitionCallerIdentity,
): Promise<TransitionRequestCallerEvidence> {
  const callerIdentityClaimsDigest = await digestCanonical({
    callerIdentityRef: identity.callerIdentityRef,
    callerSubjectDigest: identity.callerSubjectDigest,
    tenantId: identity.tenantId,
    organizationId: identity.organizationId,
    projectId: identity.projectId,
    workspaceId: identity.workspaceId,
    custodyRoles: identity.custodyRoles,
    hostedRoles: identity.hostedRoles,
    hostedScopes: identity.hostedScopes,
    authProviderRef: identity.authProviderRef,
    authSessionDigest: identity.authSessionDigest,
    serviceCredentialDigest: identity.serviceCredentialDigest,
    issuedAt: identity.issuedAt,
    expiresAt: identity.expiresAt,
    revocationEpochRef: identity.revocationEpochRef,
    claimsDigest: identity.claimsDigest,
  } satisfies JsonValue);

  return {
    callerIdentityRef: identity.callerIdentityRef,
    callerSubjectDigest: identity.callerSubjectDigest,
    callerTenantId: identity.tenantId,
    callerOrganizationId: identity.organizationId,
    callerIdentityClaimsDigest,
    authProviderRef: identity.authProviderRef,
    authSessionDigest: identity.authSessionDigest,
    serviceCredentialDigest: identity.serviceCredentialDigest,
    revocationEpochRef: identity.revocationEpochRef,
    callerIdentityIssuedAt: identity.issuedAt,
    callerIdentityExpiresAt: identity.expiresAt,
  };
}
