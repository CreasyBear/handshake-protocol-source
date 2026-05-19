import type { Context } from "hono";
import { digestCanonical } from "../../protocol/foundation/canonical";
import { HandshakeProtocolError } from "../../protocol/foundation/errors";
import { DigestSchema, PROTOCOL_VERSION, type JsonValue } from "../../protocol/public/schemas";
import {
  acceptedAtNow,
  emptyTransitionRequestCallerEvidence,
  type TransitionRequestCallerEvidence,
  type TransitionRequestContextDraft,
} from "../../protocol/context/request-contexts";
import type { TransitionCallerRole } from "./caller-auth";

export const HANDSHAKE_PROTOCOL_VERSION_HEADER = "x-handshake-protocol-version";
export const HANDSHAKE_REQUEST_IDENTITY_HEADER = "x-handshake-request-identity";
export const HANDSHAKE_ORIGINATING_IDENTITY_HEADER = "x-handshake-originating-identity";

const MAX_REQUEST_IDENTITY_LENGTH = 200;
const MAX_ORIGINATING_IDENTITY_LENGTH = 500;
const REQUEST_IDENTITY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const ORIGINATING_IDENTITY_REF_PATTERN = /^ref:[A-Za-z0-9][A-Za-z0-9._:/-]*$/;

export type TransitionRequestHeaderContext = Omit<TransitionRequestContextDraft, "requestDigest"> & {
  method: "POST";
};

export async function transitionRequestHeaderContextFor(
  c: Context,
  input: {
    callerCustodyRole: TransitionCallerRole;
    callerEvidence?: TransitionRequestCallerEvidence;
    transitionName: string;
    routePattern: string;
  },
): Promise<TransitionRequestHeaderContext> {
  const protocolVersionSeen = normalizedHeader(c, HANDSHAKE_PROTOCOL_VERSION_HEADER);
  if (!protocolVersionSeen) {
    throw new HandshakeProtocolError(
      "protocol_version_required",
      "Transition requests must include X-Handshake-Protocol-Version.",
      400,
    );
  }
  if (protocolVersionSeen !== PROTOCOL_VERSION) {
    throw new HandshakeProtocolError(
      "protocol_version_unsupported",
      `Protocol version ${protocolVersionSeen} is not supported by this kernel.`,
      412,
    );
  }

  const requestIdentity = normalizedHeader(c, HANDSHAKE_REQUEST_IDENTITY_HEADER);
  if (!requestIdentity) {
    throw new HandshakeProtocolError(
      "request_identity_required",
      "Transition requests must include X-Handshake-Request-Identity.",
      400,
    );
  }
  if (requestIdentity.length > MAX_REQUEST_IDENTITY_LENGTH) {
    throw new HandshakeProtocolError("request_identity_invalid", "X-Handshake-Request-Identity is too long.", 400);
  }
  if (!REQUEST_IDENTITY_PATTERN.test(requestIdentity)) {
    throw new HandshakeProtocolError(
      "request_identity_invalid",
      "X-Handshake-Request-Identity must be an opaque request token.",
      400,
    );
  }

  const originatingIdentity = normalizedHeader(c, HANDSHAKE_ORIGINATING_IDENTITY_HEADER);
  const parsedOriginatingIdentity = await parseOriginatingIdentityHeader(originatingIdentity);

  return {
    method: "POST",
    protocolVersionSeen,
    requestIdentity,
    originatingIdentityDigest: parsedOriginatingIdentity.originatingIdentityDigest,
    originatingIdentityRef: parsedOriginatingIdentity.originatingIdentityRef,
    callerCustodyRole: input.callerCustodyRole,
    ...(input.callerEvidence ?? emptyTransitionRequestCallerEvidence()),
    transitionName: input.transitionName,
    routePattern: input.routePattern,
    acceptedAt: acceptedAtNow(),
  };
}

export async function transitionRequestContextDraftFor(
  headerContext: TransitionRequestHeaderContext,
  parsedBody: unknown,
): Promise<TransitionRequestContextDraft> {
  return {
    protocolVersionSeen: headerContext.protocolVersionSeen,
    requestIdentity: headerContext.requestIdentity,
    originatingIdentityDigest: headerContext.originatingIdentityDigest,
    originatingIdentityRef: headerContext.originatingIdentityRef,
    callerCustodyRole: headerContext.callerCustodyRole,
    callerIdentityRef: headerContext.callerIdentityRef,
    callerSubjectDigest: headerContext.callerSubjectDigest,
    callerTenantId: headerContext.callerTenantId,
    callerOrganizationId: headerContext.callerOrganizationId,
    callerIdentityClaimsDigest: headerContext.callerIdentityClaimsDigest,
    authProviderRef: headerContext.authProviderRef,
    authSessionDigest: headerContext.authSessionDigest,
    serviceCredentialDigest: headerContext.serviceCredentialDigest,
    revocationEpochRef: headerContext.revocationEpochRef,
    callerIdentityIssuedAt: headerContext.callerIdentityIssuedAt,
    callerIdentityExpiresAt: headerContext.callerIdentityExpiresAt,
    transitionName: headerContext.transitionName,
    routePattern: headerContext.routePattern,
    acceptedAt: headerContext.acceptedAt,
    requestDigest: await digestCanonical({
      method: headerContext.method,
      routePattern: headerContext.routePattern,
      transitionName: headerContext.transitionName,
      body: parsedBody as JsonValue,
    } satisfies JsonValue),
  };
}

function normalizedHeader(c: Context, name: string): string | null {
  const value = c.req.header(name)?.trim();
  return value ? value : null;
}

async function parseOriginatingIdentityHeader(originatingIdentity: string | null): Promise<{
  originatingIdentityDigest: `sha256:${string}` | null;
  originatingIdentityRef: string | null;
}> {
  if (!originatingIdentity) {
    return { originatingIdentityDigest: null, originatingIdentityRef: null };
  }
  if (originatingIdentity.length > MAX_ORIGINATING_IDENTITY_LENGTH) {
    throw new HandshakeProtocolError(
      "originating_identity_invalid",
      "X-Handshake-Originating-Identity is too long.",
      400,
    );
  }
  if (DigestSchema.safeParse(originatingIdentity).success) {
    return { originatingIdentityDigest: originatingIdentity as `sha256:${string}`, originatingIdentityRef: null };
  }
  if (ORIGINATING_IDENTITY_REF_PATTERN.test(originatingIdentity)) {
    return {
      originatingIdentityDigest: await digestCanonical({
        originatingIdentityRef: originatingIdentity,
      } satisfies JsonValue),
      originatingIdentityRef: originatingIdentity,
    };
  }
  throw new HandshakeProtocolError(
    "originating_identity_invalid",
    "X-Handshake-Originating-Identity must be a sha256 digest or opaque ref.",
    400,
  );
}
