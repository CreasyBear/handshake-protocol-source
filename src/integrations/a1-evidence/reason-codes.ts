export type A1HandshakeReasonCode =
  | "delegation_evidence_invalid:invalid_signature"
  | "delegation_evidence_invalid:expired"
  | "delegation_evidence_invalid:scope_mismatch"
  | "delegation_evidence_invalid:identity_mismatch"
  | "delegation_evidence_invalid:depth_exceeded"
  | "delegation_evidence_invalid:malformed";

export type A1StructuralFailure =
  | "empty_chain"
  | "root_mismatch"
  | "broken_linkage"
  | "unsupported_version"
  | "not_yet_valid"
  | "expired"
  | "temporal_violation"
  | "max_depth_exceeded"
  | "nonce_replay"
  | "scope_escalation"
  | "unauthorized_leaf"
  | "invalid_signature"
  | "scope_violation"
  | "invalid_subscope_proof"
  | "malformed";

export function mapStructuralFailure(failure: A1StructuralFailure): A1HandshakeReasonCode {
  switch (failure) {
    case "invalid_signature":
      return "delegation_evidence_invalid:invalid_signature";
    case "expired":
    case "not_yet_valid":
    case "temporal_violation":
      return "delegation_evidence_invalid:expired";
    case "scope_violation":
    case "scope_escalation":
    case "invalid_subscope_proof":
      return "delegation_evidence_invalid:scope_mismatch";
    case "unauthorized_leaf":
    case "broken_linkage":
    case "root_mismatch":
      return "delegation_evidence_invalid:identity_mismatch";
    case "max_depth_exceeded":
      return "delegation_evidence_invalid:depth_exceeded";
    default:
      return "delegation_evidence_invalid:malformed";
  }
}
