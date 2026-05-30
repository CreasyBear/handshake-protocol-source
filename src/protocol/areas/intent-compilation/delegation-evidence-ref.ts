import { z } from "zod";
import { DigestSchema, IdSchema } from "../../foundation/schema-core";

/**
 * Digest-only reference to verified A1 delegation evidence.
 * Distinct from `DelegatedAuthorityRef` in `src/protocol/areas/delegated-authority/`
 * (store-backed operating-envelope grants).
 */
export const DelegationEvidenceRefSchema = z
  .object({
    delegationEvidenceRefId: IdSchema,
    evidenceBindingDigest: DigestSchema,
    a1ChainFingerprint: DigestSchema,
    storeRef: z
      .string()
      .min(1)
      .refine((value) => !/signedChain|certs|signature|delegator_pk|delegate_pk/i.test(value), {
        message: "storeRef must not embed raw A1 wire payloads",
      }),
    verifyOutcome: z.enum(["valid", "invalid"]),
    a1VerifierVersion: z.string().min(1),
  })
  .strict();

export type DelegationEvidenceRef = z.infer<typeof DelegationEvidenceRefSchema>;

export function delegationEvidenceEvidenceRefUri(evidenceBindingDigest: string): string {
  const hex = evidenceBindingDigest.replace(/^0x/i, "").toLowerCase();
  return `evidence:delegation-binding:${hex}`;
}
