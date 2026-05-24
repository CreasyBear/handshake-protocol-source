import { AuthorityCertificateTrustMaterialSchema } from "../protocol/public/schemas";
import { verifyAuthorityCertificate } from "../protocol/areas/authority-certificate/verify";
import { cliOutput } from "./output";

export async function verifyCertificateCommand(input: { certificate: unknown; trustMaterial: unknown }) {
  const trustMaterial = AuthorityCertificateTrustMaterialSchema.parse(input.trustMaterial);
  const verification = await verifyAuthorityCertificate(input.certificate, trustMaterial);
  return cliOutput({
    command: "cert verify",
    plane: "evidence",
    custodyRole: "review_custody",
    ok: verification.valid,
    reasonCodes: verification.failures.map((failure) => failure.code),
    nextAction: verification.valid ? "read_evidence" : "fix_arguments",
    retryability: verification.valid ? "not_retryable" : "retryable_after_fix",
    redactionProfileRef: "authority-certificate-verification:v1-redacted",
    evidenceRefs: [
      verification.envelope?.actionContractRef ? `action_contract:${verification.envelope.actionContractRef}` : null,
      verification.envelope?.receiptRef ? `receipt:${verification.envelope.receiptRef}` : null,
    ].filter((ref): ref is string => ref !== null),
    proofGapRefs: verification.envelope?.proofGapRefs ?? [],
    refusalRefs: verification.envelope?.refusalRefs ?? [],
    result: {
      verificationValid: verification.valid,
      verificationOutcome: verification.outcome,
      signingInputDigest: verification.signingInputDigest,
      actionClass: verification.envelope?.actionClass ?? null,
      receiptRef: verification.envelope?.receiptRef ?? null,
      checks: verification.checks,
      failureCodes: verification.failures.map((failure) => failure.code),
      failureRefs: verification.failures.map((failure) => failure.ref),
    },
  });
}
