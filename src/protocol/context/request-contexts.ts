import { digestCanonical } from "../foundation/canonical";
import { createId, nowIso } from "../foundation/ids";
import { PROTOCOL_VERSION, type JsonValue } from "../foundation/schema-core";
import { TransitionRequestContextSchema, type TransitionRequestContext } from "./request-context-schemas";

export type TransitionRequestCallerEvidence = Pick<
  TransitionRequestContext,
  | "callerIdentityRef"
  | "callerSubjectDigest"
  | "callerTenantId"
  | "callerOrganizationId"
  | "callerIdentityClaimsDigest"
  | "authProviderRef"
  | "authSessionDigest"
  | "serviceCredentialDigest"
  | "revocationEpochRef"
  | "callerIdentityIssuedAt"
  | "callerIdentityExpiresAt"
>;

export type TransitionRequestContextDraft = {
  protocolVersionSeen: string;
  requestIdentity: string;
  originatingIdentityDigest: `sha256:${string}` | null;
  originatingIdentityRef: string | null;
  callerCustodyRole: TransitionRequestContext["callerCustodyRole"];
  callerIdentityRef: TransitionRequestCallerEvidence["callerIdentityRef"];
  callerSubjectDigest: TransitionRequestCallerEvidence["callerSubjectDigest"];
  callerTenantId: TransitionRequestCallerEvidence["callerTenantId"];
  callerOrganizationId: TransitionRequestCallerEvidence["callerOrganizationId"];
  callerIdentityClaimsDigest: TransitionRequestCallerEvidence["callerIdentityClaimsDigest"];
  authProviderRef: TransitionRequestCallerEvidence["authProviderRef"];
  authSessionDigest: TransitionRequestCallerEvidence["authSessionDigest"];
  serviceCredentialDigest: TransitionRequestCallerEvidence["serviceCredentialDigest"];
  revocationEpochRef: TransitionRequestCallerEvidence["revocationEpochRef"];
  callerIdentityIssuedAt: TransitionRequestCallerEvidence["callerIdentityIssuedAt"];
  callerIdentityExpiresAt: TransitionRequestCallerEvidence["callerIdentityExpiresAt"];
  transitionName: string;
  routePattern: string;
  requestDigest: `sha256:${string}`;
  acceptedAt: string;
};

export function emptyTransitionRequestCallerEvidence(): TransitionRequestCallerEvidence {
  return {
    callerIdentityRef: null,
    callerSubjectDigest: null,
    callerTenantId: null,
    callerOrganizationId: null,
    callerIdentityClaimsDigest: null,
    authProviderRef: null,
    authSessionDigest: null,
    serviceCredentialDigest: null,
    revocationEpochRef: null,
    callerIdentityIssuedAt: null,
    callerIdentityExpiresAt: null,
  };
}

export async function buildTransitionRequestContext(
  draft: TransitionRequestContextDraft,
  scope: { tenantId: string; organizationId: string },
): Promise<TransitionRequestContext> {
  const seed = {
    schemaVersion: PROTOCOL_VERSION,
    tenantId: scope.tenantId,
    organizationId: scope.organizationId,
    createdAt: draft.acceptedAt,
    transitionRequestContextId: createId("trc"),
    ...draft,
    requestContextDigest: null,
  };
  const requestContextDigest = await digestCanonical(seed satisfies JsonValue);
  return TransitionRequestContextSchema.parse({ ...seed, requestContextDigest });
}

export function acceptedAtNow(): string {
  return nowIso();
}
