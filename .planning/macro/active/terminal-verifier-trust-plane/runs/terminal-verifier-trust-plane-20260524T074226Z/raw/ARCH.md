# Architecture Perspective

## Invariant At Stake

`AuthorityCertificate` evidence must be portable without turning into permission. The verifier plane can say this terminal artifact was signed by a recognized evidence signer over this exact envelope and status was acceptable at verification time. It must not say this actor may execute, this identity is trusted, settlement happened, or Handshake certifies the business outcome.

## Core Boundary

Separate the system into three planes:

1. Evidence plane: `AuthorityCertificate` issuance, terminal artifact binding, signature, envelope digest, artifact-kind requirements, gateway admission binding, and terminal binding.
2. Discovery plane: public verifier key set projection, issuer metadata, signer role metadata, key version metadata, and status endpoint discovery.
3. Trust decision plane: local verifier policy over pinned issuers, accepted roles, accepted key versions, required artifact kinds, acceptable status freshness, revocation behavior, and failure mode.

Key discovery must never imply trust. JWKS can publish public keys. Only local verifier policy decides whether a key, issuer, signer role, and certificate status are acceptable.

## Protocol Schema And State

Add protocol-owned models, not route-owned ad hoc shapes:

- `AuthorityCertificate`: existing signed evidence envelope. Keep terminal-only issuance.
- `AuthorityCertificateIssuer`: stable issuer identifier, evidence-plane service name, metadata URL, supported algorithms, current status.
- `AuthorityCertificateSignerRole`: narrow enum or registry-backed type such as `terminal_evidence_signer`, maybe later `status_signer`. Avoid broad names like `trusted_signer`.
- `AuthorityCertificateKeyVersion`: key id, issuer id, signer role, algorithm, public key material reference, activation time, retirement time, status.
- `AuthorityCertificateStatusRecord`: certificate id or digest, issuer id, status, reason code, observed time, effective time, optional expires time, status signer binding.
- `AuthorityCertificateVerificationRequest`: certificate plus requested policy knobs: required artifact kinds, required issuer, accepted signer roles, freshness budget.
- `AuthorityCertificateVerificationResponse`: evidence-safe result: `valid`, `invalid`, `revoked`, `stale`, `status_unavailable`, `untrusted_issuer`, `untrusted_key`, `unsupported_algorithm`, `artifact_requirement_failed`, `binding_failed`.

Do not encode approved, authorized, certified, settled, identity verified, or safe to execute in these names.

## Verifier Key Set Vs JWKS Projection

There are two different artifacts:

- Verifier key set: Handshake-native read model with issuer id, signer role, key version, lifecycle state, algorithm, activation/retirement timestamps, and policy-relevant metadata.
- JWKS projection: standards-compatible public-key representation derived from verifier key set. It exposes public verification material and `kid`/algorithm mapping, but it is not the canonical trust model.

The JWKS endpoint is a public projection, not the source of trust. RFC 7517 gives representation. RFC 7515 gives key identification/signature integrity lessons. RFC 8414-style metadata can advertise `jwks_uri`. None of those documents turn discovery into acceptance.

## Signer Role And Key Version Model

Minimum model:

- `issuerId`
- `keyId`
- `keyVersion`
- `signerRole`
- `algorithm`
- `publicKeyMaterial`
- `status`: `active | retired | revoked`
- `validFrom`
- `retiredAt`
- `revokedAt`
- `rotationReason`

Verification must require both key match and role match. A key valid for status records must not automatically validate terminal evidence. A retired key may verify historical certificates only if the certificate signing time falls inside the acceptable window and local policy allows historical validation.

## Certificate Status And Revocation Semantics

Revocation is evidence-plane invalidation, not OAuth token semantics. RFC 7009 is useful only for transferable security lessons: authenticated revocation, ambiguous public responses where appropriate, replay resistance, and privacy-preserving status behavior.

Recommended status values:

- `good`
- `revoked`
- `superseded`
- `unknown`
- `stale`
- `issuer_unavailable`

Verification must fail closed for live trust decisions when status is unavailable or stale. For audit-only reconstruction, it may return a redacted `status_unavailable` result with enough metadata to explain the gap.

Status records should be append-only and separately signed or gateway-recorded. Do not silently mutate certificate validity in place.

## Hosted Verifier Route Boundaries

Allowed:

- accept certificate verification input;
- fetch/project local issuer key material;
- check pinned trust material;
- check revocation/status;
- return audit-safe verification result;
- optionally emit receipt/proof-gap for verification-attempt observability if later scoped.

Forbidden:

- mint new authority;
- authorize mutation;
- settle payment;
- certify identity;
- imply principal approval;
- infer business success;
- accept arbitrary remote JWKS as trusted without local policy;
- expose full terminal receipts when caller is not entitled to them.

Suggested routes:

- `GET /.well-known/handshake-authority-certificate`
- `GET /authority-certificates/jwks.json`
- `POST /authority-certificates/verify`
- `GET /authority-certificates/status/:certificateDigest`

## Redaction And Audit-Safe Projection

Default response should include:

- verification result;
- issuer id;
- key id / key version;
- signer role;
- artifact kinds observed;
- envelope digest;
- terminal evidence kind;
- status result;
- status checked at;
- failure reason code;
- redacted proof-gap markers.

Default response should exclude:

- secrets;
- full receipt payloads;
- raw gateway credentials;
- principal private context;
- settlement internals;
- downstream execution details not signed into the certificate;
- unrelated terminal artifacts.

If full evidence is needed, require a separate entitlement path. Hosted verification must not become a receipt exfiltration endpoint.

## CLI, SDK, And MCP Integration Points

CLI:

- `cert verify` remains non-mutating.
- Add flags for `--issuer`, `--jwks-uri`, `--trust-policy`, `--required-artifact-kind`, `--status-url`, `--allow-stale=false`.
- Output must say certificate evidence valid, not authorized.

SDK:

- provide `verifyAuthorityCertificate`;
- provide `loadVerifierKeySet`;
- provide `projectVerifierKeySetToJwks`;
- provide `checkAuthorityCertificateStatus`;
- keep policy explicit: no default remote trust.

MCP:

- expose read-only tools only: `handshake.certificate.verify`, `handshake.certificate.status`, `handshake.issuer.metadata`, `handshake.issuer.jwks`;
- tool descriptions must state non-mutating evidence verification;
- do not expose certificate verification as approval or gateway admission.

## Source Ownership

Recommended ownership should stay near existing source areas, not generic helper buckets:

- `src/protocol/areas/authority-certificate/` for canonical schema and verifier extensions;
- `src/protocol/areas/authority-certificate/status.ts` for status and revocation schema;
- `src/protocol/areas/authority-certificate/key-set.ts` for Handshake-native key set model and JWKS projection;
- `src/http/...` for metadata and verifier route adapters when hosted is promoted;
- `src/cli/certificate.ts` for CLI surface;
- SDK/evidence clients for non-mutating helpers.

Keep RFC-specific projection code at the boundary. Do not let JWKS types invade internal trust semantics.

## Import Posture

Accept standards libraries for JWK/JWKS parsing only if boring, maintained, and testable. Do not import a general auth framework that smuggles OAuth, identity-provider, token-introspection, or permission semantics into the model.

Internal verification policy should remain Handshake-owned. External specs give wire formats, not authority semantics.

## Validation Gates

- A valid certificate cannot authorize a new gateway mutation.
- Verification fails when signer role is wrong even if signature is valid.
- Verification fails when a key is discovered through JWKS but not pinned by local trust policy.
- Retired key verifies only historical certificates inside allowed policy window.
- Revoked certificate returns revoked, not invalid generic.
- Status unavailable is distinct from bad signature.
- Hosted verifier never returns full private receipt fields by default.
- CLI/SDK/MCP copy never says permission, approval, identity, settlement, or certified.

## Smallest Next Mechanism

Define `VerifierKeySet`, `AuthorityCertificateStatusRecord`, and `AuthorityCertificateVerificationResponse` as protocol-owned types. Make JWKS a projection from that model rather than the trust model itself.
