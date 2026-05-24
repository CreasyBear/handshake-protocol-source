# Execution Perspective

## Invariant At Stake

Terminal certificate evidence may become portable, but it must not become permission, identity, settlement, certification, or downstream success. The verifier can answer only: this terminal evidence is structurally and cryptographically consistent with this pinned verifier trust posture and status record.

## Ordered Slices

### Slice 0 - Claim Guard Before Code

Goal: prevent implementation from smuggling product claims into names, docs, routes, CLI output, or tests.

Candidate paths:

- `docs/internal/decisions.md`
- `docs/internal/protocol-notes.md`
- `README.md`
- `src/**/authority-certificate*`
- `src/**/cert*`
- `test/**/authority-certificate*`
- `scripts/**/quality*claims*`

Execution:

1. Add or update internal wording that says verifier responses are evidence-plane only.
2. Ban language like certified, trusted agent, authorized, approved, settled, cleared, identity verified.
3. Make CLI and hosted verifier response wording use evidence-valid phrasing, not authority phrasing.

Stop if existing product copy treats a valid certificate as authority.

### Slice 1 - Issuer / Signer / Key Version Read Model

Goal: expose trust posture used during verification without changing verification semantics.

Candidate source paths:

- `src/protocol/areas/authority-certificate/schemas.ts`
- `src/protocol/areas/authority-certificate/verify.ts`
- `src/protocol/areas/authority-certificate/key-set.ts`

Candidate tests:

- `test/protocol/authority-certificate.test.ts`
- `test/protocol/authority-certificate-verifier.test.ts`
- `test/protocol/verifier-trust.test.ts`

Implement:

- `VerifierTrustKey`
- `VerifierKeyStatus = active | retired | revoked`
- `VerifierSignerRole`
- `VerifierKeyVersion`
- `VerifierTrustSnapshot`
- deterministic lookup by issuer, key id, algorithm, role, and status.

Validation gates:

- active signing key verifies;
- retired key verifies only when allowed by explicit historical semantics;
- revoked key does not verify once status slice lands;
- unknown key id fails closed;
- role mismatch fails closed.

Trap: `issuer` is local verifier namespace, not legal identity.

### Slice 2 - RFC 7517 JWKS Projection

Goal: publish or expose public verifier keys as a JWK Set projection of local pinned trust material.

Candidate source paths:

- `src/protocol/areas/authority-certificate/key-set.ts`
- `src/protocol/areas/authority-certificate/jwks.ts`
- `src/http/verifier-metadata.ts`

Candidate tests:

- `test/protocol/verifier-key-set.test.ts`
- `test/http/verifier-metadata.test.ts`

Implement:

- `toPublicJwkSet(trustSnapshot)`;
- public members only: `kty`, `kid`, `alg`, `use` or `key_ops` if locally modeled;
- private material exclusion;
- stable ordering by `kid`;
- optional metadata projection with `jwks_uri` following RFC 8414 shape without claiming OAuth/OIDC semantics.

Validation gates:

- serialized JWKS contains no private fields;
- HMAC keys are rejected from production projection;
- unsupported algorithms fail closed;
- duplicate `kid` fails closed;
- active and retired public keys can appear if historical portability requires it;
- revoked keys are either excluded or status-marked only in status plane, not silently trusted.

### Slice 3 - Revocation / Status Record

Goal: add verifier-owned status plane for terminal certificates and signer keys.

Candidate source paths:

- `src/protocol/areas/authority-certificate/status.ts`
- `src/protocol/areas/authority-certificate/verify.ts`
- `src/protocol/store/` only if existing store ownership fits.

Candidate tests:

- `test/protocol/certificate-status.test.ts`
- `test/protocol/authority-certificate-revocation.test.ts`

Implement:

- `CertificateStatusRecord`;
- statuses: `active`, `revoked`, `stale`, `unknown`, `status_unavailable`;
- revocation reason codes as controlled enum;
- status lookup result included in verification response;
- fail-closed behavior for required online status when unavailable;
- local/in-memory status adapter first unless existing durable storage abstraction fits.

Validation gates:

- revoked certificate fails verification;
- stale certificate fails or returns non-valid response based on explicit policy;
- status unavailable fails closed when status is required;
- no RFC 7009 certificate semantics.

### Slice 4 - Verification Response Projection

Goal: create an audit-safe response object separate from internal verifier diagnostics.

Candidate source paths:

- `src/protocol/areas/authority-certificate/verification-response.ts`
- `src/protocol/areas/authority-certificate/verify.ts`
- `src/cli/certificate.ts`
- `src/http/authority-certificate-verifier.ts`

Candidate tests:

- `test/protocol/authority-certificate-verification-response.test.ts`
- `test/cli/cli-evidence.test.ts`

Implement response fields:

- `result: valid | invalid | revoked | stale | status_unavailable`
- `artifactKind`
- `envelopeDigest`
- `terminalEvidenceBinding`
- `gatewayAdmissionBinding`
- `issuer`
- `kid`
- `signerRole`
- `keyVersion`
- `statusCheckedAt`
- `verificationCheckedAt`
- `failureReasons[]`
- `auditWarnings[]`

Validation gates:

- response never exposes private key material;
- response never says permission, authorization, settlement, or certification;
- response distinguishes gateway admission binding from downstream execution evidence;
- missing evidence is a proof gap, not successful verification.

### Slice 5 - Hosted Verifier Route

Goal: non-mutating hosted verifier endpoint that accepts a certificate and returns the audit-safe projection.

Candidate source paths:

- `src/http/authority-certificate-verifier.ts`
- `src/http/routes/authority-certificate.ts`
- `src/http/server.ts`
- `src/http/verifier-metadata.ts`

Candidate tests:

- `test/http/authority-certificate-verifier.test.ts`
- `test/integration/authority-certificate-verifier-route.test.ts`

Implement:

- `GET /.well-known/handshake-verifier`;
- `GET /verifier/jwks.json`;
- `POST /verifier/authority-certificates/verify`;
- request size limits;
- schema validation;
- no mutation, minting, admission, or policy greenlight creation.

Validation gates:

- malformed certificate returns invalid projection, not crash;
- oversized request rejected;
- route cannot create or update status records;
- unavailable status store produces explicit `status_unavailable`;
- hosted response matches protocol verifier response.

### Slice 6 - CLI Parity

Goal: CLI and hosted verifier share the same verifier core and response projection.

Candidate paths:

- `src/cli/certificate.ts`
- `src/cli/index.ts`
- `src/protocol/areas/authority-certificate/verify.ts`

Candidate tests:

- `test/cli/cli-evidence.test.ts`
- `test/integration/cert-verify-smoke.test.ts`

Validation gates:

- CLI rejects HMAC production certificates;
- CLI valid output does not imply authority;
- CLI and hosted route produce equivalent projection for same certificate/trust/status fixture.

### Slice 7 - Claim / Architecture Quality Gate

Goal: make forbidden semantics hard to regress.

Candidate paths:

- `scripts/check-claims*.mjs`
- `test/architecture/claim-boundary.test.ts`
- `docs/internal/protocol-notes.md`

Validation:

- guard forbidden strings near verifier/certificate routes;
- fixture tests prove response wording;
- docs state terminal verifier trust plane is evidence portability only.

## Dependency Graph

```text
Slice 0 Claim Guard
  -> Slice 1 Trust Read Model
      -> Slice 2 JWKS Projection
      -> Slice 3 Status Record
          -> Slice 4 Verification Response Projection
              -> Slice 5 Hosted Verifier Route
              -> Slice 6 CLI Parity
                  -> Slice 7 Quality Gate
```

Parallelizable after Slice 1:

- JWKS projection and status record can proceed independently.
- Hosted route and CLI parity can proceed in parallel after Slice 4.
- Claim guard can start immediately and continue through all slices.
- Tests for fixtures can be prepared in parallel once response schema is fixed.

## Closeout Commands

```bash
npm run test -- test/protocol/authority-certificate.test.ts
npm run test -- test/protocol/authority-certificate-verifier.test.ts test/protocol/verifier-key-set.test.ts test/protocol/certificate-status.test.ts
npm run test -- test/http/authority-certificate-verifier.test.ts test/cli/cli-evidence.test.ts
npm run quality:claims
npm run quality:architecture
npm run format:check
npm run check:repo
```

## Rollback / Stop Conditions

Stop implementation if:

- verifier response implies authorization, identity, settlement, or certification;
- JWKS projection exposes private or symmetric key material;
- revocation/status check silently degrades to valid;
- route creates greenlights, admissions, receipts, or mutations;
- certificate validity is treated as downstream business success;
- one verifier key can satisfy multiple roles without explicit role binding;
- unknown key, unknown issuer, unknown status, or unsupported algorithm passes open.

## Smallest Next Mechanism

Add the verifier trust read model and public JWKS projection tests first: pinned key input, deterministic public JWK Set output, no private/HMAC material, stable key id/role/version metadata, and no change to existing `AuthorityCertificate` verification semantics.
