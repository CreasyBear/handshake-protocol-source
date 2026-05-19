import { HandshakeProtocolError } from "../../protocol/foundation/errors";
import type { ProtocolObjectType } from "../../protocol/public/schemas";
import type { ProtocolStore } from "../../protocol/store/port";

export type TransitionScope = {
  tenantId: string;
  organizationId: string;
  referenceScopeMissingCode?: string;
};

export type TransitionScopeResolverInput = {
  body: unknown;
  store: () => ProtocolStore;
};

export type TransitionScopeResolver = (
  input: TransitionScopeResolverInput,
) => TransitionScope | Promise<TransitionScope>;

export function directBodyScope({ body }: TransitionScopeResolverInput): TransitionScope {
  const candidate = body as { tenantId?: unknown; organizationId?: unknown };
  if (typeof candidate.tenantId === "string" && typeof candidate.organizationId === "string") {
    return { tenantId: candidate.tenantId, organizationId: candidate.organizationId };
  }
  throw new HandshakeProtocolError(
    "transition_scope_unavailable",
    "Transition request body does not expose a tenant/org scope for hosted admission.",
    400,
    { retryability: "terminal", commitState: "not_started" },
  );
}

export function recordScope(
  objectType: ProtocolObjectType,
  fieldName: string,
  missingCode: string,
): TransitionScopeResolver {
  return async ({ body, store }) => {
    const objectId = (body as Record<string, unknown>)[fieldName];
    if (typeof objectId !== "string" || objectId.length === 0) {
      throw new HandshakeProtocolError(
        "transition_scope_reference_invalid",
        `Transition request body does not contain a valid ${fieldName} scope reference.`,
        400,
        { retryability: "terminal", commitState: "not_started" },
      );
    }
    const record = await store().getRecord(objectType, objectId);
    if (!record) {
      throw referenceScopeNotFound(missingCode);
    }
    return {
      tenantId: record.tenantId,
      organizationId: record.organizationId,
      referenceScopeMissingCode: missingCode,
    };
  };
}

export function hideReferenceScopeMismatch(error: unknown, scope: TransitionScope): never {
  if (
    scope.referenceScopeMissingCode &&
    error instanceof HandshakeProtocolError &&
    error.code === "hosted_caller_scope_forbidden"
  ) {
    throw referenceScopeNotFound(scope.referenceScopeMissingCode);
  }
  throw error;
}

function referenceScopeNotFound(missingCode: string): HandshakeProtocolError {
  return new HandshakeProtocolError(
    missingCode,
    "Referenced protocol record was not found for hosted admission scope resolution.",
    404,
    { retryability: "terminal", commitState: "not_started" },
  );
}
