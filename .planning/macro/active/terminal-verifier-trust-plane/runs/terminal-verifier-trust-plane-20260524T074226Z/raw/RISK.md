# Risk And Security Perspective

## Invariant At Stake

A terminal `AuthorityCertificate` is portable evidence, not permission. Verification must never imply authority, identity, settlement, compliance certification, clearing-house status, or downstream business success.

## Risk Posture

- Stale key: fail closed unless the certificate proves it was signed during an accepted key validity window and status data is available for that window.
- Revoked key: refuse verification with a precise reason such as `revoked_signing_key` or `revoked_issuer_keyset`, not generic invalidity.
- Status outage: return `proof_gap` or `status_unavailable`; never return `valid`.
- Unknown issuer, tenant, role, or key version: refuse, not warn.
- Raw evidence exposure: never return full terminal evidence from hosted verification; return audit-safe projections only.
- Hosted verifier abuse: rate-limit, size-limit, require deterministic parsing, reject recursive fetches, and never fetch arbitrary `jwks_uri` supplied by a certificate.
- Replay/tamper: certificate verification must bind envelope digest, signing input digest, artifact kind, terminal event id, gateway admission id, and issuer key version.
- OAuth/JWKS confusion: use JWK/JWKS only as key representation. Do not import OAuth authorization, token revocation, introspection, identity provider, or bearer-token language.
- x402 overfitting: x402 is the first protected-action wedge, not verifier ontology. Keep action kind, gateway binding, and evidence projection generic.
- Claim drift: guard all docs/CLI/API strings so valid certificate means only signature, binding, status, and projection checks passed.

## Required Security Mechanisms

### Issuer / Verifier Read Model

- `issuer_id`
- `tenant_scope`
- `signer_role`
- `key_id`
- `key_version`
- `key_status: active | retired | revoked`
- `valid_from`
- `valid_until`
- `revoked_at`
- `revocation_reason`
- `allowed_artifact_kinds`

### Verifier Key Set Projection

- Publish public verification keys as RFC 7517 JWK Set.
- Protect non-public key material by never placing it in projections, logs, fixtures, or snapshots.
- Treat `kid` as selector metadata, not proof of trust.
- Bind accepted keys to local/pinned issuer trust configuration.

### Status / Revocation Check

- Local status record first.
- Optional hosted status endpoint later.
- No OAuth revocation semantics. RFC 7009 contributes only security lessons: authenticated status changes, non-leaky responses, replay resistance, and clear client behavior.
- Verification must distinguish `revoked`, `unknown`, `retired_outside_window`, and `status_unavailable`.

### Hosted Verification Response

Response states:

- `verified`
- `refused`
- `proof_gap`

Never return authorized, approved, paid, settled, certified, trusted, or compliant.

Include only redacted projection:

- certificate id;
- issuer id;
- key version;
- artifact kinds;
- terminal evidence kind;
- gateway binding presence;
- status result;
- refusal/proof-gap reason.

### Admission / Terminal Binding

Verification remains invalid unless the certificate binds both exact gateway admission evidence and exact terminal evidence artifact. A certificate without gateway binding is evidence-plane residue, not Handshake evidence.

## Validation Gates

- Golden tests for active, retired-valid-window, retired-outside-window, revoked, unknown key, wrong role, wrong tenant, wrong artifact kind.
- Hosted verifier tests for oversized payloads, malformed JWK, bad key id, duplicate keys, algorithm confusion, and arbitrary `jwks_uri` injection.
- Claim-guard tests banning permission/identity/settlement/certification language in CLI, API responses, docs, and examples.
- Redaction tests proving raw terminal evidence and non-public key material never appear in hosted responses.
- Status-outage tests proving verifier returns proof gap/status unavailable, not verified.
- Replay tests proving reused certificate material cannot validate against a different terminal artifact, gateway admission, tenant, or artifact kind.
- x402 regression tests proving x402 examples do not leak into generic verifier schemas.

## Antipatterns To Cut

- Valid certificate means the action was allowed.
- JWKS means OAuth trust.
- Revocation endpoint means OAuth token revocation.
- Hosted verifier is a source of authority.
- Retired key is always invalid.
- Status unavailable but signature valid, so pass.
- Return raw evidence so integrators can inspect it.
- Use x402 names in core verifier schema.
- Trust any `jwks_uri` referenced by the certificate.
- One verifier response doubles as audit receipt and business success proof.

## Brutal Verdict

Keep the terminal verifier trust plane, but narrow it hard: it verifies evidence binding and key/status posture only. Anything broader is trust confusion. The dangerous failure is not bad cryptography; it is letting a portable evidence artifact become ambient authority wearing certificate language.

## Smallest Next Mechanism

Build a local issuer/key-status read model plus verifier result enum `verified | refused | proof_gap`, with stale/revoked/status-unavailable tests before any hosted route.
