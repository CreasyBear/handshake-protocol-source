import { z, type ZodType } from "zod";
import {
  CompileIntentInputSchema,
  CreateBreakerDecisionInputSchema,
  CreateRecoveryRecommendationInputSchema,
  CreateReceiptExportInputSchema,
  CreateReviewDecisionInputSchema,
  CreateIsolationInputSchema,
  EvaluatePolicyInputSchema,
  ProposeActionContractInputSchema,
  ReconcileReceiverOperationInputSchema,
  ResolveRecoveryTerminalConflictInputSchema,
  ReceiverGateInputSchema,
  TransitionRecoveryRecommendationStatusInputSchema,
} from "../protocol/inputs";
import {
  ActionContractSchema,
  ActionTypeSchema,
  BreakerDecisionSchema,
  GreenlightSchema,
  IntentCompilationRecordSchema,
  IsolationStateSchema,
  JsonValueSchema,
  MutationAttemptSchema,
  OperatingEnvelopeSchema,
  PolicyDecisionSchema,
  ProofGapSchema,
  RecoveryRecommendationSchema,
  RecoveryRecommendationStatusTransitionSchema,
  ReceiptSchema,
  ReceiptExportSchema,
  ReceiverGateAttemptSchema,
  ReceiverRegistryEntrySchema,
  ReceiverOperationReconciliationSchema,
  ReviewDecisionSchema,
  ToolCapabilitySchema,
} from "../protocol/schemas";

const HealthResponseSchema = z.strictObject({
  ok: z.boolean(),
  protocol: z.literal("handshake"),
  version: z.literal("0.2.0"),
});

const ErrorResponseSchema = z.strictObject({
  error: z.strictObject({
    code: z.string(),
    message: z.string().optional(),
    issues: z.array(JsonValueSchema).optional(),
  }),
});

const errorResponse = jsonResponse("Protocol error", ErrorResponseSchema);

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Handshake Protocol Kernel",
    version: "0.2.0",
    description:
      "Contracted execution protocol for reducing agent-generated actions to exact policy-evaluated receiver-gated contracts.",
  },
  paths: {
    "/health": {
      get: { summary: "Health check", responses: { "200": jsonResponse("Worker is alive", HealthResponseSchema) } },
    },
    "/v0.2/catalog/tool-capabilities": {
      post: {
        summary: "Register a durable runtime tool capability",
        requestBody: jsonRequest(ToolCapabilitySchema),
        responses: { "201": jsonResponse("Tool capability", ToolCapabilitySchema), "400": errorResponse },
      },
    },
    "/v0.2/catalog/action-types": {
      post: {
        summary: "Register a durable consequential action type",
        requestBody: jsonRequest(ActionTypeSchema),
        responses: { "201": jsonResponse("Action type", ActionTypeSchema), "400": errorResponse },
      },
    },
    "/v0.2/catalog/receivers": {
      post: {
        summary: "Register a durable receiver gate binding",
        requestBody: jsonRequest(ReceiverRegistryEntrySchema),
        responses: { "201": jsonResponse("Receiver registry entry", ReceiverRegistryEntrySchema), "400": errorResponse },
      },
    },
    "/v0.2/envelopes": {
      post: {
        summary: "Register an operating envelope that authorizes attempts, not mutation",
        requestBody: jsonRequest(OperatingEnvelopeSchema),
        responses: { "201": jsonResponse("Operating envelope", OperatingEnvelopeSchema), "400": errorResponse },
      },
    },
    "/v0.2/intent-compilations": {
      post: {
        summary: "Record catalog-bound compilation from vague intent to candidate action",
        requestBody: jsonRequest(CompileIntentInputSchema),
        responses: { "201": jsonResponse("Intent compilation record", IntentCompilationRecordSchema), "400": errorResponse },
      },
    },
    "/v0.2/action-contracts": {
      post: {
        summary: "Propose exact action contract from a clean compilation record",
        requestBody: jsonRequest(ProposeActionContractInputSchema),
        responses: { "201": jsonResponse("Action contract", ActionContractSchema), "400": errorResponse },
      },
    },
    "/v0.2/policy-decisions": {
      post: {
        summary: "Evaluate an exact action contract against envelope and isolation state",
        requestBody: jsonRequest(EvaluatePolicyInputSchema),
        responses: {
          "201": jsonResponse(
            "Policy decision and optional one-use greenlight",
            z.strictObject({ decision: PolicyDecisionSchema, greenlight: GreenlightSchema.nullable() }),
          ),
          "400": errorResponse,
          "404": errorResponse,
        },
      },
    },
    "/v0.2/review-decisions": {
      post: {
        summary: "Record a review decision bound to an exact contract and policy input",
        requestBody: jsonRequest(CreateReviewDecisionInputSchema),
        responses: { "201": jsonResponse("Review decision", ReviewDecisionSchema), "400": errorResponse, "404": errorResponse },
      },
    },
    "/v0.2/receiver-gate-attempts": {
      post: {
        summary: "Receiver-side gate check before mutation",
        requestBody: jsonRequest(ReceiverGateInputSchema),
        responses: {
          "201": jsonResponse(
            "Gate attempt, mutation outcome, receipt, and optional proof gap",
            z.strictObject({
              gateAttempt: ReceiverGateAttemptSchema,
              mutationAttempt: MutationAttemptSchema.nullable(),
              receipt: ReceiptSchema,
              proofGap: ProofGapSchema.nullable(),
            }),
          ),
          "400": errorResponse,
          "404": errorResponse,
        },
      },
    },
    "/v0.2/receiver-operation-reconciliations": {
      post: {
        summary: "Reconcile pending or unknown downstream status for the same receiver operation",
        requestBody: jsonRequest(ReconcileReceiverOperationInputSchema),
        responses: {
          "201": jsonResponse(
            "Receiver operation reconciliation and resolved proof gaps",
            z.strictObject({
              reconciliation: ReceiverOperationReconciliationSchema,
              resolvedProofGaps: z.array(ProofGapSchema),
            }),
          ),
          "400": errorResponse,
          "404": errorResponse,
        },
      },
    },
    "/v0.2/isolation-states": {
      post: {
        summary: "Write durable isolation state checked by policy and gate",
        requestBody: jsonRequest(CreateIsolationInputSchema),
        responses: { "201": jsonResponse("Isolation state", IsolationStateSchema), "400": errorResponse },
      },
    },
    "/v0.2/breaker-decisions": {
      post: {
        summary: "Record a breaker decision and atomically create its isolation state",
        requestBody: jsonRequest(CreateBreakerDecisionInputSchema),
        responses: {
          "201": jsonResponse(
            "Breaker decision and resulting isolation state",
            z.strictObject({ breakerDecision: BreakerDecisionSchema, isolationState: IsolationStateSchema }),
          ),
          "400": errorResponse,
        },
      },
    },
    "/v0.2/receipt-exports": {
      post: {
        summary: "Export a tamper-evident receipt drop copy without creating execution proof",
        requestBody: jsonRequest(CreateReceiptExportInputSchema),
        responses: { "201": jsonResponse("Receipt export", ReceiptExportSchema), "400": errorResponse, "404": errorResponse },
      },
    },
    "/v0.2/recovery-recommendations": {
      post: {
        summary: "Recommend a recovery path from refusal or proof-gap evidence without authorizing mutation",
        requestBody: jsonRequest(CreateRecoveryRecommendationInputSchema),
        responses: {
          "201": jsonResponse("Recovery recommendation", RecoveryRecommendationSchema),
          "400": errorResponse,
          "404": errorResponse,
        },
      },
    },
    "/v0.2/recovery-recommendation-status-transitions": {
      post: {
        summary: "Record an explicit expired or superseded status transition for a recovery recommendation",
        requestBody: jsonRequest(TransitionRecoveryRecommendationStatusInputSchema),
        responses: {
          "201": jsonResponse(
            "Recovery recommendation status change",
            z.strictObject({
              recoveryRecommendation: RecoveryRecommendationSchema,
              statusTransition: RecoveryRecommendationStatusTransitionSchema,
            }),
          ),
          "400": errorResponse,
          "404": errorResponse,
        },
      },
    },
    "/v0.2/recovery-terminal-conflict-resolutions": {
      post: {
        summary: "Resolve a recovery terminal conflict proof gap against the winning terminal transition",
        requestBody: jsonRequest(ResolveRecoveryTerminalConflictInputSchema),
        responses: {
          "201": jsonResponse(
            "Resolved recovery terminal conflict proof gap",
            z.strictObject({
              proofGap: ProofGapSchema,
              statusTransition: RecoveryRecommendationStatusTransitionSchema,
              recoveryRecommendation: RecoveryRecommendationSchema,
            }),
          ),
          "400": errorResponse,
          "404": errorResponse,
        },
      },
    },
  },
};

function jsonRequest(schema: ZodType) {
  return {
    required: true,
    content: {
      "application/json": {
        schema: schemaToJson(schema),
      },
    },
  };
}

function jsonResponse(description: string, schema: ZodType) {
  return {
    description,
    content: {
      "application/json": {
        schema: schemaToJson(schema),
      },
    },
  };
}

function schemaToJson(schema: ZodType) {
  return z.toJSONSchema(schema, { target: "draft-2020-12", unrepresentable: "any", reused: "ref" });
}
