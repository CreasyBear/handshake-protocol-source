import { z } from "zod";
import { A1_VERIFIER_VERSION } from "./primitives/domains.js";

const Hex32Schema = z.string().regex(/^[0-9a-f]{64}$/);

export const DelegationEvidenceRecordSchema = z
  .object({
    schemaId: z.literal("delegation-evidence-record"),
    schemaVersion: z.literal(1),
    a1ChainFingerprint: Hex32Schema,
    certFingerprints: z.array(Hex32Schema),
    chainDepth: z.number().int().nonnegative(),
    principalPkFingerprint: Hex32Schema,
    terminalDelegatePkFingerprint: Hex32Schema,
    a1VerifierVersion: z.string().min(1),
    verifyPath: z.enum(["ts", "sidecar"]),
    verifyOutcome: z.enum(["valid", "invalid"]),
    reasonCodes: z.array(z.string()),
    evidenceBindingDigest: Hex32Schema.nullable(),
    presentedAtUnix: z.number().int().nonnegative(),
    mutationAuthorityCreated: z.literal(false),
    greenlightCreated: z.literal(false),
  })
  .strict();

export type DelegationEvidenceRecord = z.infer<typeof DelegationEvidenceRecordSchema>;

export function buildDelegationEvidenceRecord(input: {
  verifyOutcome: A1VerifyOutcomeForRecord;
  evidenceBindingDigest: string | null;
  presentedAtUnix: number;
}): DelegationEvidenceRecord {
  const base = input.verifyOutcome;
  return DelegationEvidenceRecordSchema.parse({
    schemaId: "delegation-evidence-record",
    schemaVersion: 1,
    a1ChainFingerprint: base.a1ChainFingerprintHex,
    certFingerprints: base.certFingerprintsHex,
    chainDepth: base.chainDepth,
    principalPkFingerprint: base.principalPkFingerprintHex,
    terminalDelegatePkFingerprint: base.terminalDelegatePkFingerprintHex,
    a1VerifierVersion: base.a1VerifierVersion ?? A1_VERIFIER_VERSION,
    verifyPath: base.verifyPath,
    verifyOutcome: base.valid ? "valid" : "invalid",
    reasonCodes: base.reasonCodes,
    evidenceBindingDigest: input.evidenceBindingDigest,
    presentedAtUnix: input.presentedAtUnix,
    mutationAuthorityCreated: false,
    greenlightCreated: false,
  });
}

export type A1VerifyOutcomeForRecord = {
  valid: boolean;
  a1ChainFingerprintHex: string;
  certFingerprintsHex: string[];
  chainDepth: number;
  principalPkFingerprintHex: string;
  terminalDelegatePkFingerprintHex: string;
  a1VerifierVersion: string;
  verifyPath: "ts" | "sidecar";
  reasonCodes: string[];
};
