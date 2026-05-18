import { Hono, type Context } from "hono";
import { z, type ZodType } from "zod";
import {
  ActionTypeSchema,
  OperatingEnvelopeSchema,
  ReceiverRegistryEntrySchema,
  ToolCapabilitySchema,
  type ProtocolObjectType,
} from "../protocol/schemas";
import {
  CompileIntentInputSchema,
  CreateBreakerDecisionInputSchema,
  CreateReviewDecisionInputSchema,
  CreateIsolationInputSchema,
  CreateRecoveryRecommendationInputSchema,
  CreateReceiptExportInputSchema,
  EvaluatePolicyInputSchema,
  ProposeActionContractInputSchema,
  ReconcileReceiverOperationInputSchema,
  ResolveRecoveryTerminalConflictInputSchema,
  ReceiverGateInputSchema,
  TransitionRecoveryRecommendationStatusInputSchema,
} from "../protocol/inputs";
import { HandshakeProtocolError } from "../protocol/errors";
import { HandshakeKernel } from "../protocol/kernel";
import { D1ProtocolStore } from "../storage/d1";
import { InMemoryProtocolStore } from "../storage/memory";
import type { ProtocolStore } from "../storage/store";
import { openApiDocument } from "./openapi";

export type WorkerBindings = {
  DB?: D1Database;
  CACHE?: KVNamespace;
};

type AppOptions = {
  store?: ProtocolStore;
};

export function createApp(options: AppOptions = {}) {
  const fallbackStore = options.store ?? new InMemoryProtocolStore();
  const app = new Hono<{ Bindings: WorkerBindings }>();

  app.onError((error, c) => {
    if (error instanceof HandshakeProtocolError) {
      return c.json({ error: { code: error.code, message: error.message } }, error.status as 400);
    }
    if (error instanceof z.ZodError) {
      return c.json({ error: { code: "invalid_request", issues: error.issues } }, 400);
    }
    return c.json({ error: { code: "internal_error", message: "Unexpected protocol error." } }, 500);
  });

  app.get("/health", (c) => c.json({ ok: true, protocol: "handshake", version: "0.2.0" }));
  app.get("/openapi.json", (c) => c.json(openApiDocument));

  app.post("/v0.2/catalog/tool-capabilities", async (c) => {
    const body = await parseBody(c, ToolCapabilitySchema);
    await kernelFor(c, fallbackStore).putCatalogObject({ objectType: "tool_capability", payload: body });
    return c.json(body, 201);
  });

  app.post("/v0.2/catalog/action-types", async (c) => {
    const body = await parseBody(c, ActionTypeSchema);
    await kernelFor(c, fallbackStore).putCatalogObject({ objectType: "action_type", payload: body });
    return c.json(body, 201);
  });

  app.post("/v0.2/catalog/receivers", async (c) => {
    const body = await parseBody(c, ReceiverRegistryEntrySchema);
    await kernelFor(c, fallbackStore).putCatalogObject({ objectType: "receiver_registry_entry", payload: body });
    return c.json(body, 201);
  });

  app.post("/v0.2/envelopes", async (c) => {
    const body = await parseBody(c, OperatingEnvelopeSchema);
    await kernelFor(c, fallbackStore).putCatalogObject({ objectType: "operating_envelope", payload: body });
    return c.json(body, 201);
  });

  app.post("/v0.2/intent-compilations", async (c) => {
    const body = await parseBody(c, CompileIntentInputSchema);
    const result = await kernelFor(c, fallbackStore).compileIntent(body);
    return c.json(result, 201);
  });

  app.post("/v0.2/action-contracts", async (c) => {
    const body = await parseBody(c, ProposeActionContractInputSchema);
    const result = await kernelFor(c, fallbackStore).proposeActionContract(body);
    return c.json(result, 201);
  });

  app.post("/v0.2/policy-decisions", async (c) => {
    const body = await parseBody(c, EvaluatePolicyInputSchema);
    const result = await kernelFor(c, fallbackStore).evaluatePolicy(body);
    return c.json(result, 201);
  });

  app.post("/v0.2/review-decisions", async (c) => {
    const body = await parseBody(c, CreateReviewDecisionInputSchema);
    const result = await kernelFor(c, fallbackStore).createReviewDecision(body);
    return c.json(result, 201);
  });

  app.post("/v0.2/receiver-gate-attempts", async (c) => {
    const body = await parseBody(c, ReceiverGateInputSchema);
    const result = await kernelFor(c, fallbackStore).receiverGate(body);
    return c.json(result, 201);
  });

  app.post("/v0.2/receiver-operation-reconciliations", async (c) => {
    const body = await parseBody(c, ReconcileReceiverOperationInputSchema);
    const result = await kernelFor(c, fallbackStore).reconcileReceiverOperation(body);
    return c.json(result, 201);
  });

  app.post("/v0.2/isolation-states", async (c) => {
    const body = await parseBody(c, CreateIsolationInputSchema);
    const result = await kernelFor(c, fallbackStore).createIsolationState(body);
    return c.json(result, 201);
  });

  app.post("/v0.2/breaker-decisions", async (c) => {
    const body = await parseBody(c, CreateBreakerDecisionInputSchema);
    const result = await kernelFor(c, fallbackStore).createBreakerDecision(body);
    return c.json(result, 201);
  });

  app.post("/v0.2/receipt-exports", async (c) => {
    const body = await parseBody(c, CreateReceiptExportInputSchema);
    const result = await kernelFor(c, fallbackStore).createReceiptExport(body);
    return c.json(result, 201);
  });

  app.post("/v0.2/recovery-recommendations", async (c) => {
    const body = await parseBody(c, CreateRecoveryRecommendationInputSchema);
    const result = await kernelFor(c, fallbackStore).createRecoveryRecommendation(body);
    return c.json(result, 201);
  });

  app.post("/v0.2/recovery-recommendation-status-transitions", async (c) => {
    const body = await parseBody(c, TransitionRecoveryRecommendationStatusInputSchema);
    const result = await kernelFor(c, fallbackStore).transitionRecoveryRecommendationStatus(body);
    return c.json(result, 201);
  });

  app.post("/v0.2/recovery-terminal-conflict-resolutions", async (c) => {
    const body = await parseBody(c, ResolveRecoveryTerminalConflictInputSchema);
    const result = await kernelFor(c, fallbackStore).resolveRecoveryTerminalConflictProofGap(body);
    return c.json(result, 201);
  });

  app.get("/v0.2/records/:objectType/:objectId", async (c) => {
    const objectType = c.req.param("objectType") as ProtocolObjectType;
    const objectId = c.req.param("objectId");
    const record = await storeFor(c, fallbackStore).getRecord(objectType, objectId);
    if (!record) return c.json({ error: { code: "record_not_found" } }, 404);
    return c.json(record);
  });

  return app;
}

async function parseBody<T>(c: Context, schema: ZodType<T>): Promise<T> {
  const json = await c.req.json();
  return schema.parse(json);
}

function kernelFor(c: Context<{ Bindings: WorkerBindings }>, fallbackStore: ProtocolStore): HandshakeKernel {
  return new HandshakeKernel(storeFor(c, fallbackStore));
}

function storeFor(c: Context<{ Bindings: WorkerBindings }>, fallbackStore: ProtocolStore): ProtocolStore {
  if (c.env?.DB) return new D1ProtocolStore(c.env.DB);
  return fallbackStore;
}
