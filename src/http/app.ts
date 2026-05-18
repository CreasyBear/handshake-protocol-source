import { Hono, type Context } from "hono";
import type { ZodType } from "zod";
import {
  PROTOCOL_VERSION,
  ProtocolObjectTypeSchema,
} from "../protocol/schemas";
import { HandshakeProtocolError } from "../protocol/errors";
import { HandshakeKernel } from "../protocol/kernel";
import type { TransitionRequestContextDraft } from "../protocol/transition-request-contexts";
import { D1ProtocolStore } from "../storage/d1";
import { InMemoryProtocolStore } from "../storage/memory";
import type { ProtocolStore } from "../protocol/store-port";
import {
  authorizeTransitionCaller,
  type CallerAuthTokens,
  type CallerAuthWorkerBindings,
  type TransitionCallerRole,
} from "./caller-auth";
import { openApiDocument } from "./openapi";
import {
  HANDSHAKE_REQUEST_IDENTITY_HEADER,
  transitionRequestContextDraftFor,
  transitionRequestHeaderContextFor,
} from "./transition-request-context";
import { transitionErrorResult, type TransitionErrorContext } from "./transition-error-envelope";
import { transitionInvokers } from "./transition-invokers";
import { transitionRouteDefinitions, type TransitionRouteDefinition } from "./transition-route-registry";

export type WorkerBindings = CallerAuthWorkerBindings & {
  DB?: D1Database;
  CACHE?: KVNamespace;
};

type AppOptions = {
  store?: ProtocolStore;
  allowEphemeralStore?: boolean;
  callerAuthTokens?: CallerAuthTokens;
};

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
    app.post(route.path, (c) => handleTransition(c, options.callerAuthTokens, fallbackStore, route));
  }

  app.get("/v0.2/records/:objectType/:objectId", async (c) => {
    const errorContext: TransitionErrorContext = {
      transitionName: "readProtocolRecord",
      callerCustodyRole: "control_plane",
      requestIdentity: null,
    };
    const authFailure = authorize(c, options.callerAuthTokens, "control_plane", errorContext);
    if (authFailure) return authFailure;
    const objectTypeResult = ProtocolObjectTypeSchema.safeParse(c.req.param("objectType"));
    if (!objectTypeResult.success) {
      const result = transitionErrorResult(
        new HandshakeProtocolError(
          "invalid_protocol_object_type",
          "Record read objectType is not a protocol object type.",
          400,
          { retryability: "terminal", commitState: "not_started" },
        ),
        errorContext,
      );
      return c.json(result.body, result.status as 400);
    }
    const objectType = objectTypeResult.data;
    const objectId = c.req.param("objectId");
    const record = await storeFor(c, fallbackStore).getRecord(objectType, objectId);
    if (!record) {
      const result = transitionErrorResult(
        new HandshakeProtocolError(
          "record_not_found",
          "Protocol record was not found.",
          404,
          { retryability: "terminal", commitState: "not_applicable" },
        ),
        errorContext,
      );
      return c.json(result.body, result.status as 404);
    }
    return c.json(record);
  });

  return app;
}

async function parseBody<T>(c: Context, schema: ZodType<T>): Promise<T> {
  const json = await c.req.json();
  return schema.parse(json);
}

async function handleTransition(
  c: Context<{ Bindings: WorkerBindings }>,
  configuredTokens: CallerAuthTokens | undefined,
  fallbackStore: ProtocolStore | null,
  route: TransitionRouteDefinition,
): Promise<Response> {
  const errorContext: TransitionErrorContext = {
    transitionName: route.routeId,
    callerCustodyRole: route.role,
    requestIdentity: null,
  };
  const authFailure = authorize(c, configuredTokens, route.role, errorContext);
  if (authFailure) return authFailure;
  try {
    const headerContext = await transitionRequestHeaderContextFor(c, {
      callerCustodyRole: route.role,
      transitionName: route.routeId,
      routePattern: route.path,
    });
    errorContext.requestIdentity = headerContext.requestIdentity;
    const body = await parseBody(c, route.requestSchema);
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

function authorize(
  c: Context<{ Bindings: WorkerBindings }>,
  configuredTokens: CallerAuthTokens | undefined,
  role: TransitionCallerRole,
  context: TransitionErrorContext,
): Response | null {
  return authorizeTransitionCaller(c, configuredTokens, role, context);
}

function kernelFor(
  c: Context<{ Bindings: WorkerBindings }>,
  fallbackStore: ProtocolStore | null,
  requestContext?: TransitionRequestContextDraft,
): HandshakeKernel {
  return new HandshakeKernel(storeFor(c, fallbackStore), requestContext);
}

function storeFor(c: Context<{ Bindings: WorkerBindings }>, fallbackStore: ProtocolStore | null): ProtocolStore {
  if (c.env?.DB) return new D1ProtocolStore(c.env.DB);
  if (fallbackStore) return fallbackStore;
  throw new HandshakeProtocolError(
    "durable_store_unavailable",
    "Protocol state endpoints require a durable D1 store or an explicitly injected ephemeral test store.",
    503,
  );
}
