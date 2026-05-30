import {
  computeA1VerifyOutcomeDigest,
  computeEvidenceBindingDigest,
} from "../../../integrations/a1-evidence/primitives/binding-digest.js";
import { parseHex32, toHexLower } from "../../../integrations/a1-evidence/hex.js";
import type { ActionContract } from "../action-contract";
import type { IntentCompilationRecord } from "../intent-compilation";
import { delegationEvidenceEvidenceRefUri } from "../intent-compilation";
import type { StoredDelegationEvidenceRecord } from "../delegation-evidence-record";
import { z } from "zod";
import { DigestSchema } from "../../foundation/schema-core";

export const ReceiptDelegationProvenanceSchema = z.strictObject({
  a1ChainFingerprint: DigestSchema,
  chainDepth: z.number().int().nonnegative(),
  principalPkFingerprint: DigestSchema,
  terminalDelegatePkFingerprint: DigestSchema,
  verifyOutcome: z.enum(["valid", "invalid"]),
  reasonCodes: z.array(z.string()),
  evidenceBindingDigest: DigestSchema,
  a1VerifierVersion: z.string().min(1),
  mutationAuthorityCreated: z.literal(false),
  greenlightCreated: z.literal(false),
});
export type ReceiptDelegationProvenance = z.infer<typeof ReceiptDelegationProvenanceSchema>;

function fingerprintDigest(hex: string): `sha256:${string}` {
  const normalized = hex.startsWith("sha256:") ? hex.slice("sha256:".length) : hex;
  return `sha256:${normalized}` as `sha256:${string}`;
}

function digestToBytes(digest: string, field: string): Uint8Array {
  const hex = digest.startsWith("sha256:") ? digest.slice("sha256:".length) : digest;
  return parseHex32(hex, field);
}

export async function resolveReceiptDelegationProvenance(input: {
  contract: ActionContract;
  intentCompilation: IntentCompilationRecord;
  storedRecord: StoredDelegationEvidenceRecord | null;
}): Promise<{ provenance: ReceiptDelegationProvenance; evidenceRefs: string[] } | null> {
  const ref = input.intentCompilation.candidateAction.delegationEvidenceRef;
  if (!ref) return null;

  const record = input.storedRecord?.evidenceRecord ?? null;
  if (!record) return null;

  const candidateDigestBytes = digestToBytes(
    input.intentCompilation.candidateAction.candidateDigest ?? input.contract.candidateDigest,
    "candidateDigest",
  );
  const actionContractDigestBytes = digestToBytes(input.contract.actionContractDigest, "actionContractDigest");
  const a1ChainFingerprintBytes = digestToBytes(record.a1ChainFingerprint, "a1ChainFingerprint");
  const principalPkBytes = digestToBytes(record.principalPkFingerprint, "principalPkFingerprint");
  const terminalPkBytes = digestToBytes(record.terminalDelegatePkFingerprint, "terminalDelegatePkFingerprint");
  const paramsDigestBytes = digestToBytes(input.contract.paramsDigest, "paramsDigest");
  const verifiedScopeRoot = new Uint8Array(32);
  const verifyOutcomeDigest = computeA1VerifyOutcomeDigest({
    valid: record.verifyOutcome === "valid",
    reasonCodes: record.reasonCodes,
    chainDepth: record.chainDepth,
    principalPkFingerprint: principalPkBytes,
    terminalPkFingerprint: terminalPkBytes,
    verifiedScopeRoot,
    verifiedAtUnix: record.presentedAtUnix,
  });
  const evidenceBindingDigestBytes = computeEvidenceBindingDigest({
    a1ChainFingerprint: a1ChainFingerprintBytes,
    a1VerifierVersion: record.a1VerifierVersion,
    a1VerifyOutcomeDigest: verifyOutcomeDigest,
    candidateDigest: candidateDigestBytes,
    actionContractDigest: actionContractDigestBytes,
    actionTypeId: input.contract.actionTypeId,
    paramsDigest: paramsDigestBytes,
    principalId: input.contract.principalId,
    agentId: input.contract.agentId,
    presentedAtUnix: record.presentedAtUnix,
  });
  const evidenceBindingDigest = `sha256:${toHexLower(evidenceBindingDigestBytes)}` as const;

  const provenance = ReceiptDelegationProvenanceSchema.parse({
    a1ChainFingerprint: ref.a1ChainFingerprint,
    chainDepth: record.chainDepth,
    principalPkFingerprint: fingerprintDigest(record.principalPkFingerprint),
    terminalDelegatePkFingerprint: fingerprintDigest(record.terminalDelegatePkFingerprint),
    verifyOutcome: record.verifyOutcome,
    reasonCodes: record.reasonCodes,
    evidenceBindingDigest,
    a1VerifierVersion: record.a1VerifierVersion,
    mutationAuthorityCreated: false,
    greenlightCreated: false,
  });

  return {
    provenance,
    evidenceRefs: [delegationEvidenceEvidenceRefUri(evidenceBindingDigest)],
  };
}
