import { Hono, type Context } from "hono";
import type { ZodType } from "zod";
import { HandshakeProtocolError } from "../protocol/foundation/errors";
import { PROTOCOL_VERSION } from "../protocol/public/schemas";
import { InMemoryProtocolStore } from "../storage/memory";
import type { ProtocolStore } from "../protocol/store/port";
import { authorizeTransitionAdmission } from "./admission";
import type { AppOptions, WorkerBindings } from "./app-options";
import { evidenceReadRouteDefinitions } from "./routes/evidence-read-route-registry";
import { handleEvidenceRead } from "./handlers/evidence-read";
import { handleHostedReadiness } from "./handlers/hosted-readiness";
import {
  handleHostedAuthorityCertificateVerify,
  handleVerifierJwks,
  handleVerifierKeySet,
  handleVerifierMetadata,
  handleVerifierStatus,
} from "./handlers/verifier";
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
import { assertMutationRouteManifestParity } from "./mutation-route-manifest";
import { transitionRouteDefinitions, type TransitionRouteDefinition } from "./routes/transition-route-registry";

assertMutationRouteManifestParity();
import { kernelFor, storeFor } from "./store/resolution";
import { hideReferenceScopeMismatch } from "./routes/transition-scope-resolvers";

export type { AppOptions, WorkerBindings } from "./app-options";

const MAX_TRANSITION_REQUEST_BODY_BYTES = 256 * 1024;

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

  app.get("/v0.2/hosted/readiness", (c) => handleHostedReadiness(c, options, fallbackStore));
  app.get("/v0.2/verifier/metadata", (c) => handleVerifierMetadata(c));
  app.get("/v0.2/verifier/key-set", (c) => handleVerifierKeySet(c, options));
  app.get("/v0.2/verifier/jwks.json", (c) => handleVerifierJwks(c, options));
  app.get("/v0.2/verifier/status/:subjectKind/:subjectRef", (c) => handleVerifierStatus(c, options));
  app.post("/v0.2/verifier/authority-certificates/verify", (c) => handleHostedAuthorityCertificateVerify(c, options));

  app.get("/v0.2/records/:objectType/:objectId", async (c) => {
    return handleInternalRecordRead(c, options, fallbackStore);
  });

  return app;
}

async function parseBody<T>(c: Context, schema: ZodType<T>): Promise<T> {
  const contentLength = c.req.header("content-length");
  if (contentLength && Number(contentLength) > MAX_TRANSITION_REQUEST_BODY_BYTES) {
    throwTransitionBodyTooLarge();
  }

  const text = await c.req.text();
  if (new TextEncoder().encode(text).byteLength > MAX_TRANSITION_REQUEST_BODY_BYTES) {
    throwTransitionBodyTooLarge();
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new HandshakeProtocolError("invalid_request", "Transition request body is not valid JSON.", 400, {
      retryability: "terminal",
      commitState: "not_started",
    });
  }
  return schema.parse(json);
}

function throwTransitionBodyTooLarge(): never {
  throw new HandshakeProtocolError(
    "transition_request_body_too_large",
    "Transition request body exceeds the source-owned size limit.",
    413,
    {
      retryability: "terminal",
      commitState: "not_started",
    },
  );
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
