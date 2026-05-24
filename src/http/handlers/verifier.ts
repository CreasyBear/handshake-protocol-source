import type { Context } from "hono";
import { z } from "zod";
import {
  AuthorityCertificateStatusSubjectKindSchema,
  AuthorityCertificateVerificationRequestSchema,
  projectAuthorityCertificateJwks,
  projectAuthorityCertificateVerifierKeySet,
  verifyAuthorityCertificate,
} from "../../protocol/areas/authority-certificate";
import { HandshakeProtocolError } from "../../protocol/foundation/errors";
import { PROTOCOL_VERSION } from "../../protocol/public/schemas";
import type { AppOptions, WorkerBindings } from "../app-options";
import { transitionErrorResult } from "../errors/transition-error-envelope";

const MAX_VERIFIER_REQUEST_BODY_BYTES = 256 * 1024;

export async function handleVerifierMetadata(c: Context): Promise<Response> {
  return c.json({
    protocol: "handshake",
    schemaVersion: PROTOCOL_VERSION,
    verificationPlane: "local_pinned_trust_material",
    authorityCreated: false,
    hostedMutationAuthority: false,
    remoteTrustFetchAllowed: false,
    supportedOutcomes: ["verified", "refused", "proof_gap"],
    redactionProfileRef: "authority-certificate-verifier-metadata:v1-public",
  });
}

export async function handleVerifierKeySet(
  c: Context<{ Bindings: WorkerBindings }>,
  options: AppOptions,
): Promise<Response> {
  return c.json(projectAuthorityCertificateVerifierKeySet(options.authorityCertificateTrustMaterial ?? {}));
}

export async function handleVerifierJwks(
  c: Context<{ Bindings: WorkerBindings }>,
  options: AppOptions,
): Promise<Response> {
  return c.json(projectAuthorityCertificateJwks(options.authorityCertificateTrustMaterial ?? {}));
}

export async function handleVerifierStatus(
  c: Context<{ Bindings: WorkerBindings }>,
  options: AppOptions,
): Promise<Response> {
  const subjectKind = AuthorityCertificateStatusSubjectKindSchema.parse(c.req.param("subjectKind"));
  const subjectRef = z.string().min(1).parse(c.req.param("subjectRef"));
  const keySet = projectAuthorityCertificateVerifierKeySet(options.authorityCertificateTrustMaterial ?? {});
  const trustMaterial = options.authorityCertificateTrustMaterial ?? {};
  const statusRecord =
    trustMaterial.statusRecords?.find(
      (record) => record.subjectKind === subjectKind && record.subjectRef === subjectRef,
    ) ?? null;
  return c.json({
    statusLookupRef: `${subjectKind}:${subjectRef}`,
    authorityCreated: false,
    statusRecord,
    statusOutcome: statusRecord ? statusRecord.status : "status_unavailable",
    proofGapReasonCode: statusRecord ? null : "trust_status_unavailable",
    issuerRefs: keySet.issuers.map((issuer) => issuer.issuerRef),
    redactionProfileRef: "authority-certificate-status:v1-redacted",
  });
}

export async function handleHostedAuthorityCertificateVerify(
  c: Context<{ Bindings: WorkerBindings }>,
  options: AppOptions,
): Promise<Response> {
  try {
    const body = await parseVerifierBody(c);
    const request = AuthorityCertificateVerificationRequestSchema.parse({
      certificate: body.certificate,
      trustMaterial: options.authorityCertificateTrustMaterial ?? {},
    });
    return c.json(await verifyAuthorityCertificate(request.certificate, request.trustMaterial));
  } catch (error) {
    const result = transitionErrorResult(error);
    return c.json(result.body, result.status as 400);
  }
}

async function parseVerifierBody(c: Context): Promise<{ certificate: unknown }> {
  const contentLength = c.req.header("content-length");
  if (contentLength && Number(contentLength) > MAX_VERIFIER_REQUEST_BODY_BYTES) {
    throwVerifierBodyTooLarge();
  }
  const text = await c.req.text();
  if (new TextEncoder().encode(text).byteLength > MAX_VERIFIER_REQUEST_BODY_BYTES) {
    throwVerifierBodyTooLarge();
  }
  try {
    return z.strictObject({ certificate: z.unknown() }).parse(JSON.parse(text));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new HandshakeProtocolError("invalid_request", "Verifier request body is not valid JSON.", 400, {
        retryability: "terminal",
        commitState: "not_started",
      });
    }
    throw error;
  }
}

function throwVerifierBodyTooLarge(): never {
  throw new HandshakeProtocolError(
    "transition_request_body_too_large",
    "Verifier request body exceeds the source-owned size limit.",
    413,
    {
      retryability: "terminal",
      commitState: "not_started",
    },
  );
}
