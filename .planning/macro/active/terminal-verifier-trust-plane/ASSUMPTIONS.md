# Assumptions: Terminal Verifier Trust Plane

## Product Assumptions

- The externally useful question is evidence portability for protected automated actions, not payment settlement or generalized identity.
- x402 is the first wedge because exact per-call paid HTTP is concrete and auditable.
- Engineering-agent workflows remain an adoption/stress context, not the product boundary.

## Architecture Assumptions

- Existing certificate verification can be extended with a read model instead of replaced.
- `AuthorityCertificate` remains terminal evidence and should not acquire permission semantics.
- Issuer/key/status data can begin as local deterministic protocol records before durable service storage exists.
- A native verifier key-set model is required before JWKS projection.
- Hosted verifier responses can be redacted through an explicit allowlist.

## Security Assumptions

- Unknown issuer, unknown key, unauthorized role, revoked key, stale key, malformed key material, algorithm mismatch, and status unavailable must fail closed.
- Status unavailable is a `proof_gap`, not a reason to treat old evidence as verified.
- Hosted verification must not fetch arbitrary remote trust material.
- Public key discovery does not prove trust.

## Execution Assumptions

- Candidate implementation paths stay near authority-certificate protocol, CLI certificate handling, HTTP routes, and existing tests.
- Existing quality gates remain authoritative.
- The plan should not introduce source paths, package names, or CI labels from `.planning/` scratch terms.
- If exact test commands differ, implementers should use repo-native focused equivalents and record the substitution.

## User-Owned Open Questions

- Which hosted route naming convention should become canonical?
- Should initial status records live entirely in protocol fixtures/local config, or behind an HTTP-backed read provider?
- Which x402 receiver/auditor integration should be the first external proof target?
