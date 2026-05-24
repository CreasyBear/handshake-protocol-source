# Risks: Terminal Verifier Trust Plane

## R1: Validity Meaning Drift

Risk: users and APIs collapse certificate verifies into approved, paid, trusted, or settled.

Mitigation: claim guard, API naming constraints, structured response, docs wording, negative wording tests.

## R2: JWKS As Fake Authority

Risk: consumers treat key discovery as trust.

Mitigation: native verifier key-set model; JWKS projection docs; no certificate-supplied `jwks_uri`; explicit issuer/key/status checks.

## R3: Hosted Verification Leaks Sensitive Evidence

Risk: hosted response exposes raw receipts, gateway credentials, principal-private context, policy internals, or secrets.

Mitigation: allowlisted response projection, redaction tests, raw-leak golden negatives.

## R4: Status Ambiguity Becomes Success

Risk: status outage or unknown status gets treated as valid.

Mitigation: status unavailable maps to `proof_gap`; stale/revoked/unknown fail closed.

## R5: Algorithm Or Key Confusion

Risk: malformed JWK, duplicate key IDs, algorithm prefix confusion, or retired key drift lets the wrong signer pass.

Mitigation: deterministic parsing, duplicate rejection, protected key identifiers, algorithm allowlist, key version status checks.

## R6: Hosted Route Becomes Mutation Channel

Risk: verify/status endpoints mutate state or become audit side effects.

Mitigation: route contract says non-mutating; tests assert no write calls; observability must not alter certificate/status meaning.

## R7: x402 Overclaims

Risk: x402 evidence profile implies paid, settled, delivered, or business-success proof.

Mitigation: profile language limited to exact protected-action evidence and terminal certificate verification.
