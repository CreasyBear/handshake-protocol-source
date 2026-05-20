import { z } from "zod";
import { digestCanonical } from "../../protocol/foundation/canonical";
import { HandshakeProtocolError } from "../../protocol/foundation/errors";
import { DigestSchema, IdSchema, IsoDateSchema, type JsonValue } from "../../protocol/public/schemas";
import type { TransitionRequestCallerEvidence } from "../../protocol/context/request-contexts";
import type { TransitionCallerRole } from "./caller-auth";

export const TransitionCallerIdentitySchema = z
  .strictObject({
    callerIdentityRef: z.string().min(1).max(500),
    callerSubjectDigest: DigestSchema,
    tenantId: IdSchema,
    organizationId: IdSchema,
    custodyRoles: z.array(z.enum(["control_plane", "runtime_evidence", "gateway_custody", "review_custody"])).min(1),
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
};

export function parseHostedCallerIdentity(value: unknown): TransitionCallerIdentity {
  const parsed = TransitionCallerIdentitySchema.safeParse(value);
  if (!parsed.success) {
    throw new HandshakeProtocolError(
      "hosted_caller_identity_invalid",
      "Hosted caller identity did not satisfy the transition admission schema.",
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

export function assertHostedCallerFresh(identity: TransitionCallerIdentity, now: string): void {
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
}

export function assertHostedCallerScope(identity: TransitionCallerIdentity, scope: TransitionScope): void {
  if (identity.tenantId !== scope.tenantId || identity.organizationId !== scope.organizationId) {
    throw new HandshakeProtocolError(
      "hosted_caller_scope_forbidden",
      "Hosted caller identity cannot write transition records for the requested tenant/org scope.",
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
    custodyRoles: identity.custodyRoles,
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
