import type { A1HandshakeReasonCode } from "./reason-codes.js";

export type A1VerifyPath = "ts" | "sidecar";

export type A1VerifyValid = {
  valid: true;
  chainFingerprint: Uint8Array;
  certFingerprints: Uint8Array[];
  chainDepth: number;
  principalPk: Uint8Array;
  terminalDelegatePk: Uint8Array;
  verifiedScopeRoot: Uint8Array;
  verifiedAtUnix: number;
  a1VerifierVersion: string;
  verifyPath: A1VerifyPath;
};

export type A1VerifyInvalid = {
  valid: false;
  reasonCode: A1HandshakeReasonCode;
  reasonCodes: A1HandshakeReasonCode[];
  a1VerifierVersion: string;
  verifyPath: A1VerifyPath;
};

export type A1VerifyOutcome = A1VerifyValid | A1VerifyInvalid;

/** D-72 proof gap when committed vectors disagree with TS verifier under zip215:true. */
export const VECTOR_MISMATCH_PROOF_GAP = "delegation_evidence_verify:vector_mismatch" as const;
export const VECTOR_GROUNDTRUTH_UNAVAILABLE_PROOF_GAP =
  "delegation_evidence_verify:vector_groundtruth_unavailable" as const;

/**
 * Chain composition (domains, cert layout, merkle/subscope rules) is Handshake-owned and
 * self-defined; external KATs anchor only BLAKE3 and Ed25519 primitives.
 */
export const SELF_DEFINED_COMPOSITION_PROOF_GAP = "delegation_evidence_verify:self_defined_composition" as const;
