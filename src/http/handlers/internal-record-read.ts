import type { Context } from "hono";
import { HandshakeProtocolError } from "../../protocol/foundation/errors";
import { ProtocolObjectTypeSchema } from "../../protocol/public/schemas";
import type { ProtocolStore } from "../../protocol/store/port";
import { authorizeTransitionCaller } from "../admission/caller-auth";
import type { AppOptions, WorkerBindings } from "../app-options";
import { storeFor } from "../store/resolution";
import { transitionErrorResult, type TransitionErrorContext } from "../errors/transition-error-envelope";

export async function handleInternalRecordRead(
  c: Context<{ Bindings: WorkerBindings }>,
  options: AppOptions,
  fallbackStore: ProtocolStore | null,
): Promise<Response> {
  const errorContext: TransitionErrorContext = {
    transitionName: "readProtocolRecord",
    callerCustodyRole: "control_plane",
    requestIdentity: null,
  };
  const authFailure = authorizeTransitionCaller(c, options.callerAuthTokens, "control_plane", errorContext);
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
  const objectId = c.req.param("objectId");
  if (!objectId) return recordNotFound(c, errorContext);
  const record = await storeFor(c, fallbackStore).getRecord(objectTypeResult.data, objectId);
  if (!record) {
    return recordNotFound(c, errorContext);
  }
  return c.json(record);
}

function recordNotFound(c: Context, context: TransitionErrorContext): Response {
  const result = transitionErrorResult(
    new HandshakeProtocolError("record_not_found", "Protocol record was not found.", 404, {
      retryability: "terminal",
      commitState: "not_applicable",
    }),
    context,
  );
  return c.json(result.body, result.status as 404);
}
