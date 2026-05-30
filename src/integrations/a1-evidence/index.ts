export { A1_VERIFIER_VERSION } from "./primitives/domains.js";
export { computeEvidenceBindingDigest, computeA1VerifyOutcomeDigest } from "./primitives/binding-digest.js";
export type { EvidenceBindingDigestInput } from "./primitives/binding-digest.js";
export { buildDelegationEvidenceRecord, DelegationEvidenceRecordSchema } from "./delegation-evidence-record.js";
export type { DelegationEvidenceRecord, A1VerifyOutcomeForRecord } from "./delegation-evidence-record.js";
export { verifySignedChain } from "./verify-chain.js";
export type { VerifySignedChainInput } from "./verify-chain.js";
export type { A1VerifyOutcome, A1VerifyValid, A1VerifyInvalid, A1VerifyPath } from "./types.js";
export type { A1HandshakeReasonCode } from "./reason-codes.js";
export {
  SELF_DEFINED_COMPOSITION_PROOF_GAP,
  VECTOR_GROUNDTRUTH_UNAVAILABLE_PROOF_GAP,
  VECTOR_MISMATCH_PROOF_GAP,
} from "./types.js";
