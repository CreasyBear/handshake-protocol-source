# Decisions: Terminal Verifier Trust Plane

## D1: AuthorityCertificate Semantics Stay Narrow

`AuthorityCertificate` proves terminal evidence binding only. It does not prove approval, authorization, payment, settlement, trust, certification, compliance, or success.

## D2: Verification Result Must Be Structured

No boolean-only `isValid()` surface. Verification result must separate crypto validity, trusted signer, key status, role status, artifact match, gateway binding, terminal binding, status/revocation, and audit projection.

## D3: Native Verifier Key Set Precedes JWKS

The protocol-owned verifier key set is the authority-bearing read model. JWKS is an interoperability projection of public key material only.

## D4: Discovery Is Not Trust

Metadata and `jwks_uri` help locate public key material. They do not establish issuer trust, role authorization, status acceptance, or certificate validity.

## D5: Hosted Verifier Is Non-Mutating

Hosted verification may parse, validate, redact, and report. It must not mutate certificate state, status records, receipt stores, gateway records, or audit state.

## D6: Fail Closed On Status Ambiguity

Revoked, stale, unknown, and status-unavailable states cannot produce verified. Status unavailable should produce `proof_gap` with explicit failure reason.

## D7: x402 Is Profile, Not Root Protocol

x402 exact per-call paid HTTP is the first evidence profile built on top of the trust plane. It must not redefine `AuthorityCertificate` semantics.
