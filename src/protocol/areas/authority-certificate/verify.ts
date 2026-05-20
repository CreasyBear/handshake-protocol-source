import { digestCanonical } from "../../foundation/canonical";
import type { JsonValue } from "../../foundation/schema-core";
import {
  authorityCertificateSigningInputDigest,
  buildAuthorityCertificateSigningInput,
  verifyAuthorityCertificateSignature,
} from "./signing";
import {
  AuthorityCertificateSchema,
  AuthorityCertificateTrustMaterialSchema,
  AuthorityCertificateVerificationFailureSchema,
  type AuthorityCertificate,
  type AuthorityCertificateSignatureEntry,
  type AuthorityCertificateTrustKey,
  type AuthorityCertificateTrustMaterial,
  type AuthorityCertificateVerificationFailure,
  type AuthorityCertificateVerificationFailureCode,
} from "./types";

export type VerifyAuthorityCertificateResult = {
  valid: boolean;
  failures: AuthorityCertificateVerificationFailure[];
  envelope: AuthorityCertificate["envelope"] | null;
  signingInputDigest: `sha256:${string}` | null;
};

export async function verifyAuthorityCertificate(
  certificateValue: unknown,
  trustMaterialValue: AuthorityCertificateTrustMaterial,
): Promise<VerifyAuthorityCertificateResult> {
  const certificateParse = AuthorityCertificateSchema.safeParse(certificateValue);
  if (!certificateParse.success) {
    return {
      valid: false,
      failures: [
        failure("schema_invalid", `AuthorityCertificate schema invalid: ${certificateParse.error.message}`, null),
      ],
      envelope: null,
      signingInputDigest: null,
    };
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

    const trustKey = trustKeyForSignature(trustMaterial.keys, signature);
    if (!trustKey) {
      failures.push(
        failure("trust_key_missing", "No pinned trust key matched the signature.", signature.keyIdentityRef),
      );
      continue;
    }
    if (trustKey.status !== "active") {
      failures.push(failure("trust_key_inactive", "Pinned trust key is not active.", signature.keyIdentityRef));
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

  return {
    valid: failures.length === 0,
    failures,
    envelope: certificate.envelope,
    signingInputDigest: recomputedSigningInputDigest,
  };
}

function trustKeyForSignature(
  keys: AuthorityCertificateTrustKey[],
  signature: AuthorityCertificateSignatureEntry,
): AuthorityCertificateTrustKey | null {
  return (
    keys.find(
      (key) =>
        key.keyIdentityRef === signature.keyIdentityRef &&
        key.algorithm === signature.algorithm &&
        (key.signerRole === null || key.signerRole === signature.signerRole),
    ) ?? null
  );
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
