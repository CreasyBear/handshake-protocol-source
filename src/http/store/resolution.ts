import type { Context } from "hono";
import { HandshakeProtocolError } from "../../protocol/foundation/errors";
import { HandshakeKernel } from "../../protocol/kernel";
import type { ProtocolStore } from "../../protocol/store/port";
import type { TransitionRequestContextDraft } from "../../protocol/context/request-contexts";
import { D1ProtocolStore } from "../../storage/d1";
import type { WorkerBindings } from "../app-options";

export function kernelFor(
  c: Context<{ Bindings: WorkerBindings }>,
  fallbackStore: ProtocolStore | null,
  requestContext?: TransitionRequestContextDraft,
): HandshakeKernel {
  return new HandshakeKernel(storeFor(c, fallbackStore), requestContext);
}

export function storeFor(c: Context<{ Bindings: WorkerBindings }>, fallbackStore: ProtocolStore | null): ProtocolStore {
  if (c.env?.DB) return new D1ProtocolStore(c.env.DB);
  if (fallbackStore) return fallbackStore;
  throw new HandshakeProtocolError(
    "durable_store_unavailable",
    "Protocol state endpoints require a durable D1 store or an explicitly injected ephemeral test store.",
    503,
  );
}
