import type { Context } from "hono";
import { transitionErrorResult, type TransitionErrorContext } from "../errors/transition-error-envelope";
import { HandshakeProtocolError } from "../../protocol/foundation/errors";

export type TransitionCallerRole = "control_plane" | "runtime_evidence" | "gateway_custody" | "review_custody";

export type CallerAuthTokens = Partial<Record<TransitionCallerRole, string>>;

export type CallerAuthWorkerBindings = {
  HANDSHAKE_CONTROL_PLANE_TOKEN?: string;
  HANDSHAKE_RUNTIME_EVIDENCE_TOKEN?: string;
  HANDSHAKE_GATEWAY_CUSTODY_TOKEN?: string;
  HANDSHAKE_REVIEW_CUSTODY_TOKEN?: string;
};

const tokenBindingByRole = {
  control_plane: "HANDSHAKE_CONTROL_PLANE_TOKEN",
  runtime_evidence: "HANDSHAKE_RUNTIME_EVIDENCE_TOKEN",
  gateway_custody: "HANDSHAKE_GATEWAY_CUSTODY_TOKEN",
  review_custody: "HANDSHAKE_REVIEW_CUSTODY_TOKEN",
} as const satisfies Record<TransitionCallerRole, keyof CallerAuthWorkerBindings>;

export function authorizeTransitionCaller(
  c: Context<{ Bindings: CallerAuthWorkerBindings }>,
  configuredTokens: CallerAuthTokens | undefined,
  role: TransitionCallerRole,
  context: TransitionErrorContext = {},
): Response | null {
  const expectedToken = configuredTokenForRole(c.env, configuredTokens, role);
  if (!expectedToken) {
    return errorResponse(
      c,
      new HandshakeProtocolError(
        "caller_auth_not_configured",
        `${role} transition routes require an explicit bearer token binding.`,
        503,
        { retryability: "terminal", commitState: "not_started" },
      ),
      context,
    );
  }

  const providedToken = parseBearerToken(c.req.header("authorization"));
  if (!providedToken) {
    c.header("WWW-Authenticate", 'Bearer realm="handshake"');
    return errorResponse(
      c,
      new HandshakeProtocolError("caller_auth_required", `${role} transition routes require a bearer token.`, 401, {
        retryability: "terminal",
        commitState: "not_started",
      }),
      context,
    );
  }

  if (!constantTimeTokenEquals(providedToken, expectedToken)) {
    return errorResponse(
      c,
      new HandshakeProtocolError(
        "caller_auth_forbidden",
        `Bearer token does not satisfy ${role} transition custody.`,
        403,
        { retryability: "terminal", commitState: "not_started" },
      ),
      context,
    );
  }

  return null;
}

export function transitionCallerSecuritySchemeName(role: TransitionCallerRole): string {
  switch (role) {
    case "control_plane":
      return "handshakeControlPlaneBearer";
    case "runtime_evidence":
      return "handshakeRuntimeEvidenceBearer";
    case "gateway_custody":
      return "handshakeGatewayCustodyBearer";
    case "review_custody":
      return "handshakeReviewCustodyBearer";
  }
}

function configuredTokenForRole(
  env: CallerAuthWorkerBindings | undefined,
  configuredTokens: CallerAuthTokens | undefined,
  role: TransitionCallerRole,
): string | null {
  const envToken = env?.[tokenBindingByRole[role]];
  return normalizeToken(envToken) ?? normalizeToken(configuredTokens?.[role]);
}

function parseBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token, extra] = header.trim().split(/\s+/);
  if (extra || scheme?.toLowerCase() !== "bearer") return null;
  return normalizeToken(token);
}

function normalizeToken(token: string | undefined): string | null {
  const normalized = token?.trim();
  return normalized ? normalized : null;
}

function constantTimeTokenEquals(providedToken: string, expectedToken: string): boolean {
  let diff = providedToken.length ^ expectedToken.length;
  const maxLength = Math.max(providedToken.length, expectedToken.length);
  for (let index = 0; index < maxLength; index += 1) {
    diff |= (providedToken.charCodeAt(index) || 0) ^ (expectedToken.charCodeAt(index) || 0);
  }
  return diff === 0;
}

function errorResponse(
  c: Context<{ Bindings: CallerAuthWorkerBindings }>,
  error: HandshakeProtocolError,
  context: TransitionErrorContext,
): Response {
  const result = transitionErrorResult(error, context);
  return c.json(result.body, result.status as 400);
}
