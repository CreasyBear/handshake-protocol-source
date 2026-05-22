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
    result: {
      verificationValid: verification.valid,
      signingInputDigest: verification.signingInputDigest,
      actionClass: verification.envelope?.actionClass ?? null,
      receiptRef: verification.envelope?.receiptRef ?? null,
      failureCodes: verification.failures.map((failure) => failure.code),
      failureRefs: verification.failures.map((failure) => failure.ref),
    },
  });
}
