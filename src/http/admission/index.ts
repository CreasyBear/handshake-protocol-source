import type { Context } from "hono";
import { HandshakeProtocolError } from "../../protocol/foundation/errors";
import type { TransitionRequestCallerEvidence } from "../../protocol/context/request-contexts";
import { authorizeTransitionCaller, authorizeTransitionCallerForAny, type TransitionCallerRole } from "./caller-auth";
import type { AppOptions, WorkerBindings } from "../app-options";
import type { EvidenceReadRouteDefinition } from "../routes/evidence-read-route-registry";
import {
  assertHostedCallerFresh,
  assertHostedCallerAnyRole,
  assertHostedCallerRole,
  parseHostedCallerIdentity,
  transitionCallerEvidenceFromIdentity,
  type HostedCallerVerifier,
  type TransitionCallerIdentity,
} from "./hosted-caller-identity";
import type { TransitionErrorContext } from "../errors/transition-error-envelope";
import type { TransitionRouteDefinition } from "../routes/transition-route-registry";

export type AdmissionResult = {
  failure: Response | null;
  hostedIdentity: TransitionCallerIdentity | null;
  callerEvidence: TransitionRequestCallerEvidence | undefined;
};

export async function authorizeTransitionAdmission(
  c: Context<{ Bindings: WorkerBindings }>,
  options: AppOptions,
  route: TransitionRouteDefinition,
  context: TransitionErrorContext,
): Promise<AdmissionResult> {
  if (options.authMode === "hosted") {
    return authorizeHosted(c, options.hostedCallerVerifier, route.routeId, route.path, [route.role]);
  }
  return {
    failure: authorizeTransitionCaller(c, options.callerAuthTokens, route.role, context),
    hostedIdentity: null,
    callerEvidence: undefined,
  };
}

export async function authorizeEvidenceReadAdmission(
  c: Context<{ Bindings: WorkerBindings }>,
  options: AppOptions,
  route: EvidenceReadRouteDefinition,
  context: TransitionErrorContext,
): Promise<AdmissionResult> {
  if (options.authMode === "hosted") {
    return authorizeHosted(c, options.hostedCallerVerifier, route.routeId, route.honoPath, route.roles);
  }
  return {
    failure: authorizeTransitionCallerForAny(c, options.callerAuthTokens, route.roles, context),
    hostedIdentity: null,
    callerEvidence: undefined,
  };
}

async function authorizeHosted(
  c: Context<{ Bindings: WorkerBindings }>,
  verifier: HostedCallerVerifier | undefined,
  routeId: string,
  routePath: string,
  requiredRoles: readonly TransitionCallerRole[],
): Promise<AdmissionResult> {
  if (!verifier) {
    throw new HandshakeProtocolError(
      "hosted_caller_verifier_not_configured",
      "Hosted transition admission requires a server-side caller verifier.",
      503,
      { retryability: "terminal", commitState: "not_started" },
    );
  }
  const now = new Date().toISOString();
  const requiredRole = requiredRoles[0] ?? "control_plane";
  const identity = parseHostedCallerIdentity(
    await verifier.verify({
      headers: c.req.raw.headers,
      method: c.req.raw.method,
      url: c.req.raw.url,
      requiredRole,
      routeId,
      routePath,
      now,
      requiredRoles,
    }),
  );
  assertHostedCallerFresh(identity, now);
  if (requiredRoles.length === 1) {
    assertHostedCallerRole(identity, requiredRole);
  } else {
    assertHostedCallerAnyRole(identity, requiredRoles);
  }
  return {
    failure: null,
    hostedIdentity: identity,
    callerEvidence: await transitionCallerEvidenceFromIdentity(identity),
  };
}
