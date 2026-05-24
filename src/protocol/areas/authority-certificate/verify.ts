import { digestCanonical } from "../../foundation/canonical";
import type { JsonValue } from "../../foundation/schema-core";
import {
  authorityCertificateSigningInputDigest,
  buildAuthorityCertificateSigningInput,
  verifyAuthorityCertificateSignature,
} from "./signing";
import {
  AuthorityCertificateJwksProjectionSchema,
  AuthorityCertificateSchema,
  AuthorityCertificateTrustMaterialSchema,
  AuthorityCertificateVerificationFailureSchema,
  AuthorityCertificateVerificationResponseSchema,
  AuthorityCertificateVerifierKeySetProjectionSchema,
  type AuthorityCertificate,
  type AuthorityCertificateSignatureEntry,
  type AuthorityCertificateTrustKey,
  type AuthorityCertificateTrustMaterial,
  type AuthorityCertificateTrustMaterialInput,
  type AuthorityCertificateVerificationFailure,
  type AuthorityCertificateVerificationFailureCode,
  type AuthorityCertificateVerificationResponse,
  type AuthorityCertificateVerifierKeySetProjection,
  type AuthorityCertificateJwksProjection,
} from "./types";

export type VerifyAuthorityCertificateResult = AuthorityCertificateVerificationResponse;

export async function verifyAuthorityCertificate(
  certificateValue: unknown,
  trustMaterialValue: AuthorityCertificateTrustMaterialInput,
): Promise<VerifyAuthorityCertificateResult> {
  const certificateParse = AuthorityCertificateSchema.safeParse(certificateValue);
  if (!certificateParse.success) {
    const failures = [
      failure("schema_invalid", `AuthorityCertificate schema invalid: ${certificateParse.error.message}`, null),
    ];
    return verificationResponse({
      certificateId: "schema_invalid",
      failures,
      envelope: null,
      signingInputDigest: null,
    });
  }

  const trustMaterial = AuthorityCertificateTrustMaterialSchema.parse(trustMaterialValue);
  const certificate = certificateParse.data;
  const failures: AuthorityCertificateVerificationFailure[] = [];
  const signingInput = buildAuthorityCertificateSigningInput(certificate);
  const recomputedEnvelopeDigest = await digestCanonical({
    ...(certificate.envelope as unknown as Record<string, JsonValue>),
    envelopeDigest: null,
  });
  const recomputedSigningInputDigest = await authorityCertificateSigningInputDigest(certificate);

  if (recomputedEnvelopeDigest !== certificate.envelopeDigest) {
    failures.push(
      failure(
        "envelope_digest_mismatch",
        "Certificate envelopeDigest does not match the canonical envelope.",
        certificate.authorityCertificateId,
      ),
    );
  }
  if (recomputedSigningInputDigest !== certificate.signingInputDigest) {
    failures.push(
      failure(
        "signing_input_digest_mismatch",
        "Certificate signingInputDigest does not match the canonical signing input.",
        certificate.authorityCertificateId,
      ),
    );
  }

  const validSignerRoles = new Set<string>();
  for (const signature of certificate.signatures) {
    if (signature.signedOver !== recomputedSigningInputDigest) {
      failures.push(
        failure(
          "signature_signed_over_mismatch",
          "Signature signedOver must equal the recomputed signingInputDigest.",
          signature.keyIdentityRef,
        ),
      );
      continue;
    }
    if (!signature.signature.startsWith(`${signature.algorithm}:`)) {
      failures.push(
        failure(
          "signature_algorithm_mismatch",
          "Signature prefix does not match signature algorithm.",
          signature.keyIdentityRef,
        ),
      );
      continue;
    }
    if (signature.algorithm === "hmac-sha256" && !trustMaterial.allowDevHmac) {
      failures.push(
        failure(
          "hmac_not_allowed",
          "HMAC signatures are dev-only and are not accepted by production verification.",
          signature.keyIdentityRef,
        ),
      );
      continue;
    }

    const trustKey = trustKeyForSignature(trustMaterial, signature);
    if (!trustKey) {
      failures.push(
        failure("trust_key_missing", "No pinned trust key matched the signature.", signature.keyIdentityRef),
      );
      continue;
    }
    const trustFailures = trustFailuresForKey(trustMaterial, trustKey, signature, certificate.emittedAt);
    if (trustFailures.length > 0) {
      failures.push(...trustFailures);
      continue;
    }
    const verified = await verifyAuthorityCertificateSignature({
      signingInput,
      signature,
      publicKeyEd25519: trustKey.publicKeyEd25519,
      hmacSecret: trustKey.hmacSecret,
    });
    if (!verified) {
      failures.push(
        failure(
          "signature_invalid",
          "Signature did not verify against pinned trust material.",
          signature.keyIdentityRef,
        ),
      );
      continue;
    }
    validSignerRoles.add(signature.signerRole);
  }

  for (const role of certificate.verificationPolicy.requiredSignerRoles) {
    if (!validSignerRoles.has(role)) {
      failures.push(failure("required_signer_missing", `Missing valid required signer role ${role}.`, role));
    }
  }

  const artifactKinds = new Set(certificate.artifacts.map((artifact) => artifact.kind));
  for (const kind of certificate.verificationPolicy.requiredArtifactKinds) {
    if (!artifactKinds.has(kind)) {
      failures.push(failure("required_artifact_missing", `Missing required artifact kind ${kind}.`, kind));
    }
  }

  failures.push(...terminalBindingFailures(certificate));
  failures.push(...certificateStatusFailures(trustMaterial, certificate));

  return verificationResponse({
    certificateId: certificate.authorityCertificateId,
    failures,
    envelope: certificate.envelope,
    signingInputDigest: recomputedSigningInputDigest,
  });
}

function trustKeyForSignature(
  trustMaterial: AuthorityCertificateTrustMaterial,
  signature: AuthorityCertificateSignatureEntry,
): AuthorityCertificateTrustKey | null {
  return trustMaterial.keys.find((key) => key.keyIdentityRef === signature.keyIdentityRef) ?? null;
}

function trustFailuresForKey(
  trustMaterial: AuthorityCertificateTrustMaterial,
  trustKey: AuthorityCertificateTrustKey,
  signature: AuthorityCertificateSignatureEntry,
  verifiedAt: string,
): AuthorityCertificateVerificationFailure[] {
  const failures: AuthorityCertificateVerificationFailure[] = [];
  if (trustKey.algorithm !== signature.algorithm) {
    failures.push(
      failure(
        "signature_algorithm_mismatch",
        "Pinned trust key algorithm does not match signature.",
        signature.keyIdentityRef,
      ),
    );
  }
  if (trustKey.signerRole !== null && trustKey.signerRole !== signature.signerRole) {
    failures.push(
      failure(
        "trust_key_role_mismatch",
        "Pinned trust key signer role does not match signature role.",
        signature.keyIdentityRef,
      ),
    );
  }
  if (trustKey.issuerRef && !trustMaterial.issuers.some((issuer) => issuer.issuerRef === trustKey.issuerRef)) {
    failures.push(
      failure("trust_issuer_unknown", "Pinned trust key references an unknown issuer.", trustKey.issuerRef),
    );
  }
  const issuer = trustKey.issuerRef
    ? trustMaterial.issuers.find((candidate) => candidate.issuerRef === trustKey.issuerRef)
    : null;
  if (issuer?.status === "status_unavailable") {
    failures.push(failure("trust_status_unavailable", "Issuer status is unavailable.", issuer.issuerRef));
  } else if (issuer && issuer.status !== "active") {
    failures.push(statusFailureFor("issuer", issuer.status, issuer.issuerRef));
  }
  if (trustKey.status === "status_unavailable") {
    failures.push(
      failure("trust_status_unavailable", "Pinned trust key status is unavailable.", signature.keyIdentityRef),
    );
  } else if (trustKey.status !== "active") {
    failures.push(statusFailureFor("key", trustKey.status, signature.keyIdentityRef));
  }
  if (!withinWindow(verifiedAt, trustKey.validFrom, trustKey.validUntil)) {
    failures.push(
      failure("trust_key_window_invalid", "Pinned trust key is outside its validity window.", signature.keyIdentityRef),
    );
  }
  if (issuer && !withinWindow(verifiedAt, issuer.validFrom, issuer.validUntil)) {
    failures.push(
      failure("trust_key_window_invalid", "Pinned trust issuer is outside its validity window.", issuer.issuerRef),
    );
  }
  return failures;
}

function certificateStatusFailures(
  trustMaterial: AuthorityCertificateTrustMaterial,
  certificate: AuthorityCertificate,
): AuthorityCertificateVerificationFailure[] {
  const status = trustMaterial.statusRecords.find(
    (record) => record.subjectKind === "certificate" && record.subjectRef === certificate.authorityCertificateId,
  );
  if (!status) return [];
  if (status.status === "status_unavailable") {
    return [
      failure("trust_status_unavailable", "Certificate status is unavailable.", certificate.authorityCertificateId),
    ];
  }
  if (status.status === "revoked") {
    return [
      failure(
        "trust_certificate_status_revoked",
        "Certificate status record marks the certificate revoked.",
        certificate.authorityCertificateId,
      ),
    ];
  }
  if (status.status === "stale" || status.status === "retired") {
    return [
      failure(
        "trust_certificate_status_stale",
        "Certificate status record is stale or retired.",
        certificate.authorityCertificateId,
      ),
    ];
  }
  return [];
}

function statusFailureFor(
  subject: "issuer" | "key",
  status: Exclude<AuthorityCertificateTrustKey["status"], "active" | "status_unavailable">,
  ref: string,
): AuthorityCertificateVerificationFailure {
  if (status === "retired") return failure("trust_key_retired", `Pinned trust ${subject} is retired.`, ref);
  if (status === "revoked") return failure("trust_key_revoked", `Pinned trust ${subject} is revoked.`, ref);
  return failure("trust_key_stale", `Pinned trust ${subject} is stale.`, ref);
}

function withinWindow(now: string, validFrom: string | null, validUntil: string | null): boolean {
  const nowMs = Date.parse(now);
  if (validFrom && Date.parse(validFrom) > nowMs) return false;
  if (validUntil && Date.parse(validUntil) <= nowMs) return false;
  return true;
}

function terminalBindingFailures(certificate: AuthorityCertificate): AuthorityCertificateVerificationFailure[] {
  const failures: AuthorityCertificateVerificationFailure[] = [];
  const { terminal, envelope, artifacts } = certificate;
  if (terminal.actionContractId !== envelope.actionContractRef) {
    failures.push(
      failure(
        "terminal_binding_mismatch",
        "Terminal action contract does not match envelope action contract.",
        terminal.actionContractId,
      ),
    );
  }
  if (terminal.policyDecisionId !== envelope.policyDecisionRef) {
    failures.push(
      failure(
        "terminal_binding_mismatch",
        "Terminal policy decision does not match envelope policy decision.",
        terminal.policyDecisionId,
      ),
    );
  }
  if (terminal.greenlightId !== envelope.greenlightRef) {
    failures.push(
      failure(
        "terminal_binding_mismatch",
        "Terminal greenlight does not match envelope greenlight.",
        terminal.greenlightId,
      ),
    );
  }
  if (terminal.gatewayId !== envelope.gatewayId) {
    failures.push(
      failure("terminal_binding_mismatch", "Terminal gateway does not match envelope gateway.", terminal.gatewayId),
    );
  }
  if (terminal.terminalKind === "receipt" && terminal.terminalObjectRef !== `receipt:${envelope.receiptRef}`) {
    failures.push(
      failure(
        "terminal_binding_mismatch",
        "Receipt terminal ref does not match envelope receipt.",
        terminal.terminalObjectRef,
      ),
    );
  }
  if (
    terminal.terminalKind === "replay_refusal" &&
    (terminal.terminalObjectRef !== `receipt:${envelope.receiptRef}` ||
      envelope.greenlightConsumptionStatus !== "replayed")
  ) {
    failures.push(
      failure(
        "terminal_binding_mismatch",
        "Replay refusal terminal must bind a replayed receipt.",
        terminal.terminalObjectRef,
      ),
    );
  }
  if (
    terminal.terminalKind === "durable_refusal" &&
    !envelope.refusalRefs.some((ref) => terminal.terminalObjectRef === `refusal:${ref}`)
  ) {
    failures.push(
      failure(
        "terminal_binding_mismatch",
        "Durable refusal terminal ref does not match envelope refusal.",
        terminal.terminalObjectRef,
      ),
    );
  }
  if (
    terminal.terminalKind === "proof_gap" &&
    !envelope.proofGapRefs.some((ref) => terminal.terminalObjectRef === `proof_gap:${ref}`)
  ) {
    failures.push(
      failure(
        "terminal_binding_mismatch",
        "Proof-gap terminal ref does not match envelope proof gap.",
        terminal.terminalObjectRef,
      ),
    );
  }
  if (certificate.verificationPolicy.gatewayAdmissionRequired && !envelope.gateAttemptRef) {
    failures.push(
      failure(
        "gateway_admission_binding_missing",
        "Gateway admission policy requires a gate attempt in the envelope.",
        terminal.terminalObjectRef,
      ),
    );
  }
  if (!artifacts.some((artifact) => artifact.objectRef === terminal.terminalObjectRef)) {
    failures.push(
      failure(
        "required_artifact_missing",
        "Terminal object is not present in certificate artifacts.",
        terminal.terminalObjectRef,
      ),
    );
  }
  return failures;
}

function failure(
  code: AuthorityCertificateVerificationFailureCode,
  message: string,
  ref: string | null,
): AuthorityCertificateVerificationFailure {
  return AuthorityCertificateVerificationFailureSchema.parse({ code, message, ref });
}

function verificationResponse(input: {
  certificateId: string;
  failures: AuthorityCertificateVerificationFailure[];
  envelope: AuthorityCertificate["envelope"] | null;
  signingInputDigest: `sha256:${string}` | null;
}): VerifyAuthorityCertificateResult {
  const outcome = verificationOutcome(input.failures);
  return AuthorityCertificateVerificationResponseSchema.parse({
    verificationResponseId: `acvr_${input.certificateId}`,
    outcome,
    verificationPlane: "local_pinned_trust_material",
    authorityCreated: false,
    redactionProfileRef: "authority-certificate-verification:v1-redacted",
    checks: verificationChecks(input.failures),
    failures: input.failures,
    envelope: input.envelope,
    signingInputDigest: input.signingInputDigest,
  });
}

function verificationOutcome(
  failures: AuthorityCertificateVerificationFailure[],
): "verified" | "refused" | "proof_gap" {
  if (failures.length === 0) return "verified";
  return failures.some((candidate) => candidate.code === "trust_status_unavailable") ? "proof_gap" : "refused";
}

function verificationChecks(
  failures: AuthorityCertificateVerificationFailure[],
): VerifyAuthorityCertificateResult["checks"] {
  return {
    schema: checkStatus(failures, ["schema_invalid"]),
    cryptographicSignature: checkStatus(failures, [
      "signature_algorithm_mismatch",
      "hmac_not_allowed",
      "signature_invalid",
      "signature_signed_over_mismatch",
    ]),
    signingInputDigest: checkStatus(failures, ["signing_input_digest_mismatch", "envelope_digest_mismatch"]),
    artifactBinding: checkStatus(failures, ["required_artifact_missing"]),
    terminalBinding: checkStatus(failures, ["terminal_binding_mismatch"]),
    gatewayAdmissionBinding: checkStatus(failures, ["gateway_admission_binding_missing"]),
    trustMaterial: checkStatus(failures, [
      "trust_key_missing",
      "trust_key_inactive",
      "trust_issuer_unknown",
      "trust_key_role_mismatch",
      "trust_key_retired",
      "trust_key_revoked",
      "trust_key_stale",
      "trust_key_window_invalid",
    ]),
    status: checkStatus(failures, [
      "trust_status_unavailable",
      "trust_certificate_status_revoked",
      "trust_certificate_status_stale",
    ]),
  };
}

function checkStatus(
  failures: AuthorityCertificateVerificationFailure[],
  codes: AuthorityCertificateVerificationFailureCode[],
): "passed" | "failed" | "proof_gap" {
  const matching = failures.filter((candidate) => codes.includes(candidate.code));
  if (matching.length === 0) return "passed";
  return matching.some((candidate) => candidate.code === "trust_status_unavailable") ? "proof_gap" : "failed";
}

export function projectAuthorityCertificateVerifierKeySet(
  trustMaterialValue: AuthorityCertificateTrustMaterialInput,
): AuthorityCertificateVerifierKeySetProjection {
  const trustMaterial = AuthorityCertificateTrustMaterialSchema.parse(trustMaterialValue);
  const publicKeys = trustMaterial.keys.filter((key) => key.algorithm === "ed25519" && key.publicKeyEd25519 !== null);
  return AuthorityCertificateVerifierKeySetProjectionSchema.parse({
    projectionKind: "authority_certificate_verifier_key_set",
    trustDecision: "caller_pinned_trust_material_only",
    authorityCreated: false,
    redactionProfileRef: "authority-certificate-verifier-key-set:v1-redacted",
    issuers: trustMaterial.issuers,
    keys: publicKeys.map((key) => ({
      keyIdentityRef: key.keyIdentityRef,
      issuerRef: key.issuerRef,
      keyVersion: key.keyVersion,
      signerRole: key.signerRole,
      algorithm: key.algorithm,
      publicKeyEd25519: key.publicKeyEd25519,
      status: key.status,
      validFrom: key.validFrom,
      validUntil: key.validUntil,
      privateMaterialIncluded: false,
      authorityCreated: false,
    })),
    omittedPrivateKeyCount: trustMaterial.keys.length - publicKeys.length,
  });
}

export function projectAuthorityCertificateJwks(
  trustMaterialValue: AuthorityCertificateTrustMaterialInput,
): AuthorityCertificateJwksProjection {
  const keySet = projectAuthorityCertificateVerifierKeySet(trustMaterialValue);
  return AuthorityCertificateJwksProjectionSchema.parse({
    projectionKind: "authority_certificate_jwks_projection",
    trustDecision: "jwks_projection_only",
    authorityCreated: false,
    redactionProfileRef: "authority-certificate-jwks:v1-public",
    jwks: {
      keys: keySet.keys.map((key) => ({
        kty: "OKP",
        crv: "Ed25519",
        kid: key.keyIdentityRef,
        alg: "EdDSA",
        use: "sig",
        key_ops: ["verify"],
        x: key.publicKeyEd25519,
      })),
    },
    omittedPrivateKeyCount: keySet.omittedPrivateKeyCount,
  });
}
