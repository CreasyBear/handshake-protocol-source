import type { Context } from "hono";
import { HandshakeProtocolError } from "../../protocol/foundation/errors";
import type { TransitionRequestCallerEvidence } from "../../protocol/context/request-contexts";
import { authorizeTransitionCaller, authorizeTransitionCallerForAny, type TransitionCallerRole } from "./caller-auth";
import type { AppOptions, WorkerBindings } from "../app-options";
import type { EvidenceReadRouteDefinition } from "../routes/evidence-read-route-registry";
import {
  assertHostedRawEvidenceEntitlement,
  assertHostedReadinessEntitlement,
  assertHostedRedactedEvidenceEntitlement,
  assertHostedTransitionRolesConfigured,
  requireHostedAdmissionConfig,
  type HostedAdmissionConfig,
} from "./hosted-admission-config";
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
    const config = requireHostedAdmissionConfig(options.hostedAdmissionConfig);
    assertHostedTransitionRolesConfigured(config, [route.role]);
    return authorizeHosted(c, options.hostedCallerVerifier, route.routeId, route.path, [route.role], config, {
      kind: "transition",
    });
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
    const config = requireHostedAdmissionConfig(options.hostedAdmissionConfig);
    return authorizeHosted(c, options.hostedCallerVerifier, route.routeId, route.honoPath, route.roles, config, {
      kind: "redacted_evidence_read",
    });
  }
  return {
    failure: authorizeTransitionCallerForAny(c, options.callerAuthTokens, route.roles, context),
    hostedIdentity: null,
    callerEvidence: undefined,
  };
}

export async function authorizeHostedRawRecordReadAdmission(
  c: Context<{ Bindings: WorkerBindings }>,
  options: AppOptions,
): Promise<AdmissionResult> {
  const config = requireHostedAdmissionConfig(options.hostedAdmissionConfig);
  return authorizeHosted(
    c,
    options.hostedCallerVerifier,
    "readProtocolRecord",
    "/v0.2/records/:objectType/:objectId",
    ["review_custody"],
    config,
    { kind: "raw_evidence_read" },
  );
}

export async function authorizeHostedReadinessAdmission(
  c: Context<{ Bindings: WorkerBindings }>,
  options: AppOptions,
): Promise<AdmissionResult> {
  const config = requireHostedAdmissionConfig(options.hostedAdmissionConfig);
  return authorizeHosted(
    c,
    options.hostedCallerVerifier,
    "getHostedReadiness",
    "/v0.2/hosted/readiness",
    ["review_custody"],
    config,
    { kind: "readiness_read" },
  );
}

type HostedAdmissionKind = "transition" | "redacted_evidence_read" | "raw_evidence_read" | "readiness_read";

async function authorizeHosted(
  c: Context<{ Bindings: WorkerBindings }>,
  verifier: HostedCallerVerifier | undefined,
  routeId: string,
  routePath: string,
  requiredRoles: readonly TransitionCallerRole[],
  config: HostedAdmissionConfig,
  purpose: { kind: HostedAdmissionKind },
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
  assertHostedCallerFresh(identity, now, config.maxIdentityAgeSeconds);
  switch (purpose.kind) {
    case "transition":
      if (requiredRoles.length === 1) {
        assertHostedCallerRole(identity, requiredRole);
      } else {
        assertHostedCallerAnyRole(identity, requiredRoles);
      }
      break;
    case "redacted_evidence_read":
      assertHostedRedactedEvidenceEntitlement(identity, config);
      break;
    case "raw_evidence_read":
      assertHostedRawEvidenceEntitlement(identity, config, c.req.raw.headers, now);
      break;
    case "readiness_read":
      assertHostedReadinessEntitlement(identity, config);
      break;
  }
  return {
    failure: null,
    hostedIdentity: identity,
    callerEvidence: await transitionCallerEvidenceFromIdentity(identity),
  };
}
