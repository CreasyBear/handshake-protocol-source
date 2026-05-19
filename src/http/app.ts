import { Hono, type Context } from "hono";
import type { ZodType } from "zod";
import { PROTOCOL_VERSION } from "../protocol/public/schemas";
import { InMemoryProtocolStore } from "../storage/memory";
import type { ProtocolStore } from "../protocol/store/port";
import { authorizeTransitionAdmission } from "./admission";
import type { AppOptions, WorkerBindings } from "./app-options";
import { evidenceReadRouteDefinitions } from "./routes/evidence-read-route-registry";
import { handleEvidenceRead } from "./handlers/evidence-read";
import { assertHostedCallerScope } from "./admission/hosted-caller-identity";
import { handleInternalRecordRead } from "./handlers/internal-record-read";
import { openApiDocument } from "./openapi";
import {
  HANDSHAKE_REQUEST_IDENTITY_HEADER,
  transitionRequestContextDraftFor,
  transitionRequestHeaderContextFor,
} from "./admission/request-context";
import { transitionErrorResult, type TransitionErrorContext } from "./errors/transition-error-envelope";
import { transitionInvokers } from "./routes/transition-invokers";
import { transitionRouteDefinitions, type TransitionRouteDefinition } from "./routes/transition-route-registry";
import { kernelFor, storeFor } from "./store/resolution";
import { hideReferenceScopeMismatch } from "./routes/transition-scope-resolvers";

export type { AppOptions, WorkerBindings } from "./app-options";

export function createApp(options: AppOptions = {}) {
  const fallbackStore = options.store ?? (options.allowEphemeralStore ? new InMemoryProtocolStore() : null);
  const app = new Hono<{ Bindings: WorkerBindings }>();

  app.onError((error, c) => {
    const result = transitionErrorResult(error);
    return c.json(result.body, result.status as 400);
  });

  app.get("/health", (c) => c.json({ ok: true, protocol: "handshake", version: PROTOCOL_VERSION }));
  app.get("/openapi.json", (c) => c.json(openApiDocument));

  for (const route of transitionRouteDefinitions) {
    app.post(route.path, (c) => handleTransition(c, options, fallbackStore, route));
  }

  for (const route of evidenceReadRouteDefinitions) {
    app.get(route.honoPath, (c) => handleEvidenceRead(c, options, fallbackStore, route));
  }

  app.get("/v0.2/records/:objectType/:objectId", async (c) => {
    return handleInternalRecordRead(c, options, fallbackStore);
  });

  return app;
}

async function parseBody<T>(c: Context, schema: ZodType<T>): Promise<T> {
  const json = await c.req.json();
  return schema.parse(json);
}

async function handleTransition(
  c: Context<{ Bindings: WorkerBindings }>,
  options: AppOptions,
  fallbackStore: ProtocolStore | null,
  route: TransitionRouteDefinition,
): Promise<Response> {
  const errorContext: TransitionErrorContext = {
    transitionName: route.routeId,
    callerCustodyRole: route.role,
    requestIdentity: null,
  };
  try {
    const admission = await authorizeTransitionAdmission(c, options, route, errorContext);
    if (admission.failure) return admission.failure;
    const headerContext = await transitionRequestHeaderContextFor(c, {
      callerCustodyRole: route.role,
      transitionName: route.routeId,
      routePattern: route.path,
      ...(admission.callerEvidence ? { callerEvidence: admission.callerEvidence } : {}),
    });
    errorContext.requestIdentity = headerContext.requestIdentity;
    const body = await parseBody(c, route.requestSchema);
    if (admission.hostedIdentity) {
      const scope = await route.scopeResolver({
        body,
        store: () => storeFor(c, fallbackStore),
      });
      try {
        assertHostedCallerScope(admission.hostedIdentity, scope);
      } catch (error) {
        hideReferenceScopeMismatch(error, scope);
      }
    }
    const requestContext = await transitionRequestContextDraftFor(headerContext, body);
    const result = await transitionInvokers[route.routeId](kernelFor(c, fallbackStore, requestContext), body);
    c.header("X-Handshake-Request-Identity", requestContext.requestIdentity);
    c.header(HANDSHAKE_REQUEST_IDENTITY_HEADER, requestContext.requestIdentity);
    return c.json(result, 201);
  } catch (error) {
    const result = transitionErrorResult(error, errorContext);
    if (errorContext.requestIdentity) {
      c.header("X-Handshake-Request-Identity", errorContext.requestIdentity);
      c.header(HANDSHAKE_REQUEST_IDENTITY_HEADER, errorContext.requestIdentity);
    }
    return c.json(result.body, result.status as 400);
  }
}
