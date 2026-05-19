import { z } from "zod";
import {
  HandshakeAmbiguousCommitError,
  HandshakeProtocolError,
  type TransitionCommitState,
  type TransitionErrorRetryability,
} from "../../protocol/foundation/errors";
import { JsonValueSchema } from "../../protocol/public/schemas";
import type { TransitionCallerRole } from "../admission/caller-auth";

export const TransitionErrorRetryabilitySchema = z.enum([
  "retryable",
  "terminal",
  "recoverable",
  "review_required",
  "ambiguous",
]);

export const TransitionCommitStateSchema = z.enum([
  "not_started",
  "not_committed",
  "committed",
  "unknown",
  "not_applicable",
]);

export const TransitionErrorEnvelopeSchema = z.strictObject({
  code: z.string(),
  message: z.string(),
  transitionName: z.string().nullable(),
  callerCustodyRole: z.enum(["control_plane", "runtime_evidence", "gateway_custody", "review_custody"]).nullable(),
  retryability: TransitionErrorRetryabilitySchema,
  commitState: TransitionCommitStateSchema,
  requestIdentity: z.string().nullable(),
  proofRef: z.string().nullable(),
  refusalRef: z.string().nullable(),
  issues: z.array(JsonValueSchema).optional(),
});

export const TransitionErrorResponseSchema = z.strictObject({
  error: TransitionErrorEnvelopeSchema,
});

export type TransitionErrorEnvelope = z.infer<typeof TransitionErrorEnvelopeSchema>;
export type TransitionErrorResponseBody = z.infer<typeof TransitionErrorResponseSchema>;

export type TransitionErrorContext = {
  transitionName?: string | null;
  callerCustodyRole?: TransitionCallerRole | null;
  requestIdentity?: string | null;
};

export type TransitionErrorResult = {
  body: TransitionErrorResponseBody;
  status: number;
};

export function transitionErrorResult(error: unknown, context: TransitionErrorContext = {}): TransitionErrorResult {
  const classification = classifyTransitionError(error);
  const body = TransitionErrorResponseSchema.parse({
    error: {
      code: classification.code,
      message: classification.message,
      transitionName: context.transitionName ?? null,
      callerCustodyRole: context.callerCustodyRole ?? null,
      retryability: classification.retryability,
      commitState: classification.commitState,
      requestIdentity: context.requestIdentity ?? null,
      proofRef: classification.proofRef,
      refusalRef: classification.refusalRef,
      ...(classification.issues ? { issues: classification.issues } : {}),
    },
  });
  return { body, status: classification.status };
}

export function transitionErrorBody(error: unknown, context: TransitionErrorContext = {}): TransitionErrorResponseBody {
  return transitionErrorResult(error, context).body;
}

type ClassifiedTransitionError = {
  code: string;
  message: string;
  status: number;
  retryability: TransitionErrorRetryability;
  commitState: TransitionCommitState;
  proofRef: string | null;
  refusalRef: string | null;
  issues?: Array<z.infer<typeof JsonValueSchema>>;
};

function classifyTransitionError(error: unknown): ClassifiedTransitionError {
  if (error instanceof z.ZodError) {
    return {
      code: "invalid_request",
      message: "Transition request body failed schema validation.",
      status: 400,
      retryability: "terminal",
      commitState: "not_started",
      proofRef: null,
      refusalRef: null,
      issues: error.issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: issue.path.map(String),
      })),
    };
  }

  if (error instanceof HandshakeProtocolError) {
    return {
      code: error.code,
      message: error.message,
      status: error.status,
      retryability: error.metadata.retryability ?? retryabilityForProtocolError(error),
      commitState: error.metadata.commitState ?? commitStateForProtocolError(error),
      proofRef: error.metadata.proofRef ?? null,
      refusalRef: error.metadata.refusalRef ?? null,
    };
  }

  return {
    code: "internal_error",
    message: "Unexpected protocol error.",
    status: 500,
    retryability: "retryable",
    commitState: "unknown",
    proofRef: null,
    refusalRef: null,
  };
}

function retryabilityForProtocolError(error: HandshakeProtocolError): TransitionErrorRetryability {
  if (error instanceof HandshakeAmbiguousCommitError) return "ambiguous";
  if (error.code === "stream_append_conflict") return "retryable";
  if (error.code === "recovery_terminal_conflict") return "recoverable";
  if (error.code.includes("review_required")) return "review_required";
  if (error.status >= 500) return "retryable";
  return "terminal";
}

function commitStateForProtocolError(error: HandshakeProtocolError): TransitionCommitState {
  if (error instanceof HandshakeAmbiguousCommitError) return "unknown";
  if (error.code === "stream_append_conflict") return "not_committed";
  if (error.metadata.proofRef || error.metadata.refusalRef) return "committed";
  if (error.code === "recovery_terminal_conflict") return "unknown";
  if (
    error.code === "protocol_version_required" ||
    error.code === "protocol_version_unsupported" ||
    error.code === "request_identity_required" ||
    error.code === "request_identity_invalid" ||
    error.code === "originating_identity_invalid"
  ) {
    return "not_started";
  }
  if (error.status >= 500) return "unknown";
  return "not_committed";
}
