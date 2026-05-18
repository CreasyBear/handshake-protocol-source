import { z, type ZodType } from "zod";
import {
  CompileIntentInputSchema,
  CreateBreakerDecisionInputSchema,
  CreateProtectedPathPostureInputSchema,
  CreateRecoveryRecommendationInputSchema,
  CreateReceiptExportInputSchema,
  CreateReviewArtifactInputSchema,
  CreateReviewDecisionInputSchema,
  CreateRuntimeExecutionInputSchema,
  CreateIsolationInputSchema,
  EvaluatePolicyInputSchema,
  ProposeActionContractInputSchema,
  ReconcileSurfaceOperationInputSchema,
  ResolveRecoveryTerminalConflictInputSchema,
  GatewayCheckInputSchema,
  TransitionRecoveryRecommendationStatusInputSchema,
} from "../protocol/inputs";
import { transitionCallerSecuritySchemeName, type TransitionCallerRole } from "./caller-auth";
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
  ProtectedPathPostureSchema,
  ProofGapSchema,
  RecoveryRecommendationSchema,
  RecoveryRecommendationStatusTransitionSchema,
  ReceiptSchema,
  ReceiptExportSchema,
  GatewayCheckAttemptSchema,
  GatewayRegistryEntrySchema,
  ReviewArtifactRecordSchema,
  SurfaceOperationReconciliationSchema,
  ReviewDecisionSchema,
  RuntimeExecutionRecordSchema,
  ToolCapabilitySchema,
  PROTOCOL_VERSION,
} from "../protocol/schemas";

const HealthResponseSchema = z.strictObject({
  ok: z.boolean(),
  protocol: z.literal("handshake"),
  version: z.literal(PROTOCOL_VERSION),
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
    version: PROTOCOL_VERSION,
    description:
      "Contracted execution protocol for reducing agent-generated actions to exact policy-evaluated gateway-checked contracts.",
  },
  components: {
    securitySchemes: {
      handshakeControlPlaneBearer: bearerSecurityScheme("Control-plane transition token"),
      handshakeRuntimeEvidenceBearer: bearerSecurityScheme("Runtime evidence transition token"),
      handshakeGatewayCustodyBearer: bearerSecurityScheme("Gateway custody transition token"),
      handshakeReviewCustodyBearer: bearerSecurityScheme("Review custody transition token"),
    },
  },
  paths: {
    "/health": {
      get: { summary: "Health check", responses: { "200": jsonResponse("Worker is alive", HealthResponseSchema) } },
    },
    "/v0.2/catalog/tool-capabilities": {
      post: {
        summary: "Register a durable runtime tool capability",
        security: transitionSecurity("control_plane"),
        requestBody: jsonRequest(ToolCapabilitySchema),
        responses: { "201": jsonResponse("Tool capability", ToolCapabilitySchema), "400": errorResponse },
      },
    },
    "/v0.2/catalog/action-types": {
      post: {
        summary: "Register a durable consequential action type",
        security: transitionSecurity("control_plane"),
        requestBody: jsonRequest(ActionTypeSchema),
        responses: { "201": jsonResponse("Action type", ActionTypeSchema), "400": errorResponse },
      },
    },
    "/v0.2/catalog/gateways": {
      post: {
        summary: "Register a durable gateway check binding",
        security: transitionSecurity("control_plane"),
        requestBody: jsonRequest(GatewayRegistryEntrySchema),
        responses: { "201": jsonResponse("Gateway registry entry", GatewayRegistryEntrySchema), "400": errorResponse },
      },
    },
    "/v0.2/envelopes": {
      post: {
        summary: "Register an operating envelope that authorizes attempts, not mutation",
        security: transitionSecurity("control_plane"),
        requestBody: jsonRequest(OperatingEnvelopeSchema),
        responses: { "201": jsonResponse("Operating envelope", OperatingEnvelopeSchema), "400": errorResponse },
      },
    },
    "/v0.2/intent-compilations": {
      post: {
        summary: "Record catalog-bound compilation from vague intent to candidate action",
        security: transitionSecurity("runtime_evidence"),
        requestBody: jsonRequest(CompileIntentInputSchema),
        responses: { "201": jsonResponse("Intent compilation record", IntentCompilationRecordSchema), "400": errorResponse },
      },
    },
    "/v0.2/runtime-executions": {
      post: {
        summary: "Record generated execution-block evidence without minting authority",
        security: transitionSecurity("runtime_evidence"),
        requestBody: jsonRequest(CreateRuntimeExecutionInputSchema),
        responses: { "201": jsonResponse("Runtime execution record", RuntimeExecutionRecordSchema), "400": errorResponse },
      },
    },
    "/v0.2/protected-path-postures": {
      post: {
        summary: "Record current protected-path posture and atomically update the current pointer",
        security: transitionSecurity("gateway_custody"),
        requestBody: jsonRequest(CreateProtectedPathPostureInputSchema),
        responses: { "201": jsonResponse("Protected path posture", ProtectedPathPostureSchema), "400": errorResponse },
      },
    },
    "/v0.2/action-contracts": {
      post: {
        summary: "Propose exact action contract from a clean compilation record",
        security: transitionSecurity("control_plane"),
        requestBody: jsonRequest(ProposeActionContractInputSchema),
        responses: { "201": jsonResponse("Action contract", ActionContractSchema), "400": errorResponse },
      },
    },
    "/v0.2/policy-decisions": {
      post: {
        summary: "Evaluate an exact action contract against envelope and isolation state",
        security: transitionSecurity("control_plane"),
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
    "/v0.2/review-artifacts": {
      post: {
        summary: "Record a rendered review artifact bound to exact contract and policy input digests",
        security: transitionSecurity("review_custody"),
        requestBody: jsonRequest(CreateReviewArtifactInputSchema),
        responses: {
          "201": jsonResponse("Review artifact record", ReviewArtifactRecordSchema),
          "400": errorResponse,
          "404": errorResponse,
        },
      },
    },
    "/v0.2/review-decisions": {
      post: {
        summary: "Record a review decision bound to an exact contract and policy input",
        security: transitionSecurity("review_custody"),
        requestBody: jsonRequest(CreateReviewDecisionInputSchema),
        responses: { "201": jsonResponse("Review decision", ReviewDecisionSchema), "400": errorResponse, "404": errorResponse },
      },
    },
    "/v0.2/gateway-check-attempts": {
      post: {
        summary: "Gateway-side check before mutation",
        security: transitionSecurity("gateway_custody"),
        requestBody: jsonRequest(GatewayCheckInputSchema),
        responses: {
          "201": jsonResponse(
            "Gateway check attempt, mutation outcome, receipt, and optional proof gap",
            z.strictObject({
              gateAttempt: GatewayCheckAttemptSchema,
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
    "/v0.2/surface-operation-reconciliations": {
      post: {
        summary: "Reconcile pending or unknown downstream status for the same surface operation",
        security: transitionSecurity("gateway_custody"),
        requestBody: jsonRequest(ReconcileSurfaceOperationInputSchema),
        responses: {
          "201": jsonResponse(
            "Surface operation reconciliation and proof-gap changes",
            z.strictObject({
              reconciliation: SurfaceOperationReconciliationSchema,
              resolvedProofGaps: z.array(ProofGapSchema),
              createdProofGap: ProofGapSchema.nullable(),
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
        security: transitionSecurity("control_plane"),
        requestBody: jsonRequest(CreateIsolationInputSchema),
        responses: { "201": jsonResponse("Isolation state", IsolationStateSchema), "400": errorResponse },
      },
    },
    "/v0.2/breaker-decisions": {
      post: {
        summary: "Record a breaker decision and atomically create its isolation state",
        security: transitionSecurity("control_plane"),
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
        security: transitionSecurity("control_plane"),
        requestBody: jsonRequest(CreateReceiptExportInputSchema),
        responses: { "201": jsonResponse("Receipt export", ReceiptExportSchema), "400": errorResponse, "404": errorResponse },
      },
    },
    "/v0.2/recovery-recommendations": {
      post: {
        summary: "Recommend a recovery path from refusal or proof-gap evidence without authorizing mutation",
        security: transitionSecurity("control_plane"),
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
        security: transitionSecurity("control_plane"),
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
        security: transitionSecurity("control_plane"),
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

function transitionSecurity(role: TransitionCallerRole) {
  return [{ [transitionCallerSecuritySchemeName(role)]: [] }];
}

function bearerSecurityScheme(description: string) {
  return {
    type: "http",
    scheme: "bearer",
    description,
  };
}

function schemaToJson(schema: ZodType) {
  return z.toJSONSchema(schema, { target: "draft-2020-12", unrepresentable: "any", reused: "ref" });
}
