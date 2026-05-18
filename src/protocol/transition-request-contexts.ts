import { digestCanonical } from "./canonical";
import { createId, nowIso } from "./ids";
import { PROTOCOL_VERSION, type JsonValue } from "./schema-core";
import {
  TransitionRequestContextSchema,
  type TransitionRequestContext,
} from "./transition-request-context-schemas";

export type TransitionRequestContextDraft = {
  protocolVersionSeen: string;
  requestIdentity: string;
  originatingIdentityDigest: `sha256:${string}` | null;
  originatingIdentityRef: string | null;
  callerCustodyRole: TransitionRequestContext["callerCustodyRole"];
  transitionName: string;
  routePattern: string;
  requestDigest: `sha256:${string}`;
  acceptedAt: string;
};

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
