import { z } from "zod";
import {
  HandshakeAmbiguousCommitError,
  HandshakeProtocolError,
  type TransitionCommitState,
  type TransitionErrorRetryability,
} from "../../protocol/foundation/errors";
import { problemTypeUriForCode } from "../../protocol/foundation/reason-code-remediation/index";
import {
  classifyFailureClassFromProtocolError,
  FailureClassSchema,
  type FailureClass,
} from "../../protocol/foundation/failure-class";
import { resolveProtocolReasonCodeMetadata } from "../../protocol/foundation/reason-codes";
import { JsonValueSchema } from "../../protocol/public/schemas";
import type { TransitionCallerRole } from "../admission/caller-auth";
import { httpTransitionErrorCodes } from "./codes";

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

export const TransitionFailureClassSchema = FailureClassSchema;

export const TransitionFailurePhaseSchema = z.enum(["admission", "transition", "readback"]).nullable();

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
  failureClass: TransitionFailureClassSchema,
  failurePhase: TransitionFailurePhaseSchema,
  problemType: z.string().url().nullable(),
  issues: z.array(JsonValueSchema).optional(),
});

export const TransitionErrorResponseSchema = z.strictObject({
  error: TransitionErrorEnvelopeSchema,
});

export type TransitionFailureClass = FailureClass;
export type TransitionFailurePhase = z.infer<typeof TransitionFailurePhaseSchema>;
export type TransitionErrorEnvelope = z.infer<typeof TransitionErrorEnvelopeSchema>;
export type TransitionErrorResponseBody = z.infer<typeof TransitionErrorResponseSchema>;

export type TransitionErrorContext = {
  transitionName?: string | null;
  callerCustodyRole?: TransitionCallerRole | null;
  requestIdentity?: string | null;
  failurePhase?: TransitionFailurePhase;
};

export type TransitionErrorResult = {
  body: TransitionErrorResponseBody;
  status: number;
};

export function transitionErrorResult(error: unknown, context: TransitionErrorContext = {}): TransitionErrorResult {
  const classification = classifyTransitionError(error, context);
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
      failureClass: classification.failureClass,
      failurePhase: classification.failurePhase,
      problemType: classification.problemType,
      ...(classification.issues ? { issues: classification.issues } : {}),
    },
  });
  return { body, status: classification.status };
}

export function transitionErrorBody(error: unknown, context: TransitionErrorContext = {}): TransitionErrorResponseBody {
  return transitionErrorResult(error, context).body;
}

export function httpStatusForFailureClass(
  failureClass: TransitionFailureClass,
  preferredStatus?: number,
): number {
  const preferred =
    preferredStatus && preferredStatus >= 400 && preferredStatus < 600 ? preferredStatus : undefined;

  switch (failureClass) {
    case "auth":
      if (preferred === 401 || preferred === 403 || preferred === 503) return preferred;
      return 401;
    case "hosted_admission":
      if (preferred === 401 || preferred === 403 || preferred === 412 || preferred === 503) return preferred;
      return 403;
    case "stale_admission":
    case "protected_action_refusal":
    case "replay_refusal":
      return 409;
    case "proof_gap":
      return 422;
    case "internal":
      return preferred ?? 500;
  }
}

function isStaleHostedAdmissionCode(code: string): boolean {
  return code === "hosted_caller_identity_stale";
}

export function failureClassForProtocolError(error: HandshakeProtocolError): TransitionFailureClass {
  const httpAdmission = httpTransitionErrorCodes.find((entry) => entry.code === error.code);
  if (httpAdmission) {
    if (httpAdmission.phase === "auth") return "auth";
    if (httpAdmission.phase === "hosted_admission") {
      return isStaleHostedAdmissionCode(error.code) ? "stale_admission" : "hosted_admission";
    }
    // Ingress/request-shaping HTTP codes (400/404/413, etc.) are not clearance refusals.
    // Keep failureClass internal so httpStatusForFailureClass honors error.status.
    return "internal";
  }
  return classifyFailureClassFromProtocolError(error);
}

export function failurePhaseForError(
  code: string,
  context: TransitionErrorContext,
): TransitionFailurePhase {
  if (context.failurePhase) return context.failurePhase;
  const httpAdmission = httpTransitionErrorCodes.find((entry) => entry.code === code);
  if (httpAdmission?.phase === "auth" || httpAdmission?.phase === "hosted_admission") {
    return "admission";
  }
  if (code.startsWith("caller_auth_") || code.startsWith("hosted_")) return "admission";
  if (code.includes("readiness") || code.includes("read_entitlement")) return "readback";
  const metadata = resolveProtocolReasonCodeMetadata(code);
  if (metadata?.phase === "catalog") return "readback";
  return "transition";
}

type ClassifiedTransitionError = {
  code: string;
  message: string;
  status: number;
  retryability: TransitionErrorRetryability;
  commitState: TransitionCommitState;
  proofRef: string | null;
  refusalRef: string | null;
  failureClass: TransitionFailureClass;
  failurePhase: TransitionFailurePhase;
  problemType: string | null;
  issues?: Array<z.infer<typeof JsonValueSchema>>;
};

function classifyTransitionError(error: unknown, context: TransitionErrorContext): ClassifiedTransitionError {
  if (error instanceof z.ZodError) {
    return {
      code: "invalid_request",
      message: "Transition request body failed schema validation.",
      status: 400,
      retryability: "terminal",
      commitState: "not_started",
      proofRef: null,
      refusalRef: null,
      failureClass: "internal",
      failurePhase: failurePhaseForError("invalid_request", context),
      problemType: problemTypeUriForCode("invalid_request"),
      issues: error.issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: issue.path.map(String),
      })),
    };
  }

  if (error instanceof HandshakeProtocolError) {
    const failureClass = failureClassForProtocolError(error);
    const failurePhase = failurePhaseForError(error.code, context);
    return {
      code: error.code,
      message: error.message,
      status: httpStatusForFailureClass(failureClass, error.status),
      retryability: error.metadata.retryability ?? retryabilityForProtocolError(error),
      commitState: error.metadata.commitState ?? commitStateForProtocolError(error),
      proofRef: error.metadata.proofRef ?? null,
      refusalRef: error.metadata.refusalRef ?? null,
      failureClass,
      failurePhase,
      problemType: problemTypeUriForCode(error.code),
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
    failureClass: "internal",
    failurePhase: "transition",
    problemType: null,
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
