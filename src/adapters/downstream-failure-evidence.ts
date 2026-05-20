import { digestCanonical } from "../protocol/foundation/canonical";
import type { ReconcileSurfaceOperationInput } from "../protocol/areas/operation-lifecycle";
import type {
  DownstreamDiagnosticsRedactionPosture,
  DownstreamRetryability,
} from "../protocol/areas/operation-lifecycle/schemas";

type DownstreamFailureEvidence = Pick<
  ReconcileSurfaceOperationInput,
  | "downstreamRetryability"
  | "providerRequestRef"
  | "providerOperationRef"
  | "redactedDiagnosticsDigest"
  | "traceRef"
  | "spanRef"
  | "diagnosticsRedactionPosture"
  | "evidenceRefs"
>;

export async function downstreamFailureEvidence(input: {
  adapterId: string;
  surfaceOperationRef: string;
  error: unknown;
  evidenceRef: string;
}): Promise<DownstreamFailureEvidence> {
  const signal = failureSignal(input.error);
  const downstreamRetryability = signal.downstreamRetryability ?? "unknown";
  const providerRequestRef = signal.providerRequestRef ?? null;
  const providerOperationRef = signal.providerOperationRef ?? input.surfaceOperationRef;
  const traceRef = signal.traceRef ?? null;
  const spanRef = signal.spanRef ?? null;
  const diagnosticsRedactionPosture = signal.diagnosticsRedactionPosture ?? "digest_only";
  const redactedDiagnosticsDigest =
    signal.redactedDiagnosticsDigest ??
    (await digestCanonical({
      adapter: input.adapterId,
      surfaceOperationRef: input.surfaceOperationRef,
      errorName: signal.errorName ?? null,
      errorCode: signal.errorCode ?? null,
      downstreamRetryability,
      providerRequestRef,
      providerOperationRef,
      traceRef,
      spanRef,
    }));
  return {
    downstreamRetryability,
    providerRequestRef,
    providerOperationRef,
    redactedDiagnosticsDigest,
    traceRef,
    spanRef,
    diagnosticsRedactionPosture,
    evidenceRefs: [input.evidenceRef, ...signal.evidenceRefs],
  };
}

function failureSignal(error: unknown): {
  downstreamRetryability: DownstreamRetryability | undefined;
  providerRequestRef: string | null | undefined;
  providerOperationRef: string | null | undefined;
  redactedDiagnosticsDigest: `sha256:${string}` | null | undefined;
  traceRef: string | null | undefined;
  spanRef: string | null | undefined;
  diagnosticsRedactionPosture: DownstreamDiagnosticsRedactionPosture | undefined;
  evidenceRefs: string[];
  errorName: string | null;
  errorCode: string | null;
} {
  const record = isRecord(error) ? error : {};
  return {
    downstreamRetryability: enumValue(record.downstreamRetryability, ["retryable", "non_retryable", "unknown"]),
    providerRequestRef: nullableString(record.providerRequestRef),
    providerOperationRef: nullableString(record.providerOperationRef),
    redactedDiagnosticsDigest: digestValue(record.redactedDiagnosticsDigest),
    traceRef: nullableString(record.traceRef),
    spanRef: nullableString(record.spanRef),
    diagnosticsRedactionPosture: enumValue(record.diagnosticsRedactionPosture, [
      "redacted",
      "digest_only",
      "none",
      "unknown",
    ]),
    evidenceRefs: stringArray(record.evidenceRefs),
    errorName: (error instanceof Error ? error.name : nullableString(record.name)) ?? null,
    errorCode: nullableString(record.code) ?? null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function nullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value === "string" && value.length > 0) return value;
  return undefined;
}

function digestValue(value: unknown): `sha256:${string}` | null | undefined {
  if (value === null) return null;
  if (typeof value === "string" && /^sha256:[a-f0-9]{64}$/.test(value)) return value as `sha256:${string}`;
  return undefined;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : undefined;
}
