# Plan: Terminal Verifier Trust Plane

## Goal

Invariant at stake: `AuthorityCertificate` must remain terminal evidence for protected automated actions, not permission, identity, settlement, certification, or downstream success.

Build a Terminal Verifier Trust Plane that lets external receivers, auditors, SDKs, CLI users, MCP tools, and hosted verifier clients answer one narrow question:

Does this `AuthorityCertificate` verify against pinned or published verifier trust material, current issuer/key/status records, and the exact terminal artifact binding it claims?

The first protected-action wedge is x402 exact per-call paid HTTP, but the trust plane must stay protocol-owned and evidence-plane first. x402 is the adoption stress case, not the root protocol.

## Non-Goals

- Do not make `AuthorityCertificate` an approval, authorization, payment receipt, settlement proof, actor identity, compliance badge, certificate authority artifact, or proof that the principal understood the action.
- Do not make JWKS discovery a trust decision.
- Do not fetch certificate-supplied `jwks_uri` values.
- Do not expose raw receipts, gateway credentials, secrets, principal-private context, policy internals, or mutable audit state through hosted verification.
- Do not build a clearing house, settlement network, or general CA.
- Do not make hosted verification mutate certificate, receipt, issuer, key, or status state.
- Do not expose boolean-only `isValid()` APIs.

## Source Boundary

Canonical and candidate source areas:

- `src/protocol/areas/authority-certificate/`
- `src/cli/certificate.ts`
- `src/http`
- existing authority-certificate protocol tests
- new verifier/key/status/http/cli tests near existing test ownership

Planning source hierarchy:

1. This run input and official constraints.
2. Tracked repo canon: `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/decisions.md`, `docs/internal/protocol-notes.md`.
3. Current source and tests.
4. `.planning/` as scratch only.

External standards are constraint sources, not inherited product semantics:

- RFC 7517: JWK/JWK Set are key representations; protect non-public key material.
- RFC 7515: JWS signing, validation, and protected key identifiers inform trust-binding checks.
- RFC 8414: `jwks_uri` can point to a JWK Set document; OAuth semantics are not inherited.
- RFC 7009: borrow endpoint security and ambiguity lessons only; OAuth token revocation is not certificate revocation.

## Current State

Implemented source state:

- `createAuthorityCertificate()` mints terminal evidence for only `receipt`, `durable_refusal`, `proof_gap`, and `replay_refusal`.
- `verifyAuthorityCertificate()` checks schema, envelope digest, signing input digest, signed-over binding, algorithm prefix, pinned trust keys, signer roles, required artifact kinds, gateway admission binding, and terminal binding.
- Production rejects HMAC.
- Trust material is local and pinned with active/retired keys.
- CLI `cert verify` is evidence-plane only and non-mutating.

Known gaps:

- No verifier key-set/JWKS projection.
- No issuer/signer role/key version read model.
- No certificate status/revocation record model.
- No hosted verification route.
- No redacted hosted verification response.
- No explicit stale/revoked/status-unavailable failure model.
- No claim guard that prevents "valid" from meaning approved, paid, settled, trusted, certified, authorized, or compliant.

## Target State

Terminal verifier clients can submit or inspect an `AuthorityCertificate` and receive a structured non-mutating verification response that separates:

- schema validity;
- cryptographic validity;
- signing input digest match;
- signed-over artifact binding;
- trusted issuer/key presence;
- signer role allowability;
- key version status and time window;
- required artifact kind match;
- gateway admission binding;
- terminal artifact binding;
- status/revocation result;
- replay refusal or proof-gap evidence;
- redacted audit projection;
- failure reasons.

Hosted routes expose:

- verifier metadata;
- verifier key-set projection;
- JWKS projection;
- certificate status lookup;
- hosted certificate verification.

The verifier key set is the native model. JWKS is only a projection for interoperability.

All public and SDK language says `verified`, `refused`, or `proof_gap`, never `authorized`, `approved`, `paid`, `settled`, `certified`, `trusted`, `compliant`, or bare `valid`.

## Assumptions

- Existing certificate creation and verification functions are stable enough to extend without redesigning terminal certificate semantics.
- Local pinned verification remains the root trust posture; hosted verification is a projection and convenience surface.
- Status records can be represented as append-only or immutable read records even if their storage implementation is initially in-memory or file-backed.
- x402 evidence profile can wait until verifier primitives exist.
- Production HMAC rejection remains mandatory.
- Status unavailable must fail closed as `proof_gap`, not silently degrade to verified.

## Decisions

1. Separate planes:
   - evidence plane: `AuthorityCertificate` and terminal artifact verification;
   - discovery plane: metadata, verifier key set, JWKS projection;
   - trust decision plane: pinned/local or caller-owned acceptance of issuer/key/status records.
2. Add protocol-owned models:
   - `AuthorityCertificateIssuer`;
   - `AuthorityCertificateKeyVersion`;
   - `AuthorityCertificateStatusRecord`;
   - `AuthorityCertificateVerificationRequest`;
   - `AuthorityCertificateVerificationResponse`.
3. Treat JWKS as projection:
   - native verifier key-set model owns issuer, role, algorithm, key version, status, and time window;
   - JWKS only emits public key material and integrity-protected identifiers compatible with RFC 7517 and RFC 7515 expectations.
4. Hosted verifier is audit-safe:
   - deterministic parse;
   - request size limits;
   - rate limits where route infrastructure supports them;
   - no arbitrary remote key fetching;
   - no mutation;
   - redacted response only.
5. Verification response is structured:
   - no boolean-only API;
   - explicit failure reasons;
   - explicit stale, revoked, unknown, and status-unavailable outcomes.
6. x402 arrives after verifier trust plane:
   - first prove `AuthorityCertificate` portability;
   - then define exact per-call paid HTTP evidence profile.

## Phases

### Phase 0: Claim Guard And Vocabulary Fence

Add product and code claim guards that make terminal evidence semantics mechanically hard to blur. Ban or flag certificate language that implies approval, authorization, paid status, settlement, actor trust, certification, compliance, or downstream success.

Exit when `quality:claims` fails on forbidden verifier/certificate claims and current approved wording says terminal evidence only.

### Phase 1: Trust Read Model

Introduce issuer, key version, role, algorithm, status, and validity-window read models near authority-certificate protocol ownership. Keep them deterministic and local-first. Require verification to distinguish unknown issuer, unknown key, role mismatch, retired key, revoked key, stale key, and algorithm mismatch.

Exit when pinned local verification can consume the new read model without changing current terminal artifact semantics.

### Phase 2: Verifier Key Set And JWKS Projection

Create native verifier key-set projection first, then a JWKS projection from it. Public JWKS must include only public material and protected identifiers; it must not carry private key material or imply trust.

Exit when malformed JWK, duplicate keys, algorithm confusion, unknown key, retired key, and role mismatch negative tests fail closed.

### Phase 3: Status And Revocation Records

Add status records for certificate/key/issuer verification posture. Model active, retired, revoked, stale, unknown, and status-unavailable distinctly. Status unavailable returns `proof_gap` and prevents verified outcome.

Exit when revoked/stale/status-outage tests fail closed and responses preserve ambiguity instead of smoothing it.

### Phase 4: Verification Request And Response Projection

Define `AuthorityCertificateVerificationRequest` and `AuthorityCertificateVerificationResponse`. Response must separate crypto validity, trusted signer, role/key status, artifact match, gateway binding, terminal binding, status/revocation, and redacted audit projection.

Exit when CLI and protocol tests prove no boolean-only `isValid()` style surface is introduced.

### Phase 5: Hosted Verifier Routes

Add non-mutating hosted routes for metadata, key-set/JWKS, status, and verify. Hosted verification must not fetch arbitrary `jwks_uri`, must reject oversized payloads, must redact sensitive material, and must never mutate receipt/status/certificate state.

Exit when hosted route tests cover payload size, malformed input, redaction, no raw leak, unknown issuer, revoked key, status outage, and deterministic refusal/proof-gap responses.

### Phase 6: CLI / SDK / MCP Parity

Update CLI evidence-plane output to match structured verification results. SDK/MCP-facing surfaces should expose the same categories without a boolean-only shortcut. Keep all surfaces non-mutating.

Exit when CLI parity tests confirm local and hosted-style response projections preserve the same semantic boundaries.

### Phase 7: x402 Evidence Profile

Define the x402 exact per-call paid HTTP evidence profile on top of the verifier trust plane. The profile states what exact protected-action evidence an `AuthorityCertificate` proves or fails to prove for a single paid HTTP call.

Exit when an external x402 receiver/auditor can ask whether a certificate verifies against published verifier keys/current status and what exact evidence it proves, without treating it as settlement or payment success.

## Task Graph

```text
T0 claim guard
  -> T1 trust read model
    -> T2 key-set projection
      -> T3 JWKS projection
    -> T4 status records
      -> T5 verification response
        -> T6 hosted metadata/status routes
        -> T7 hosted verify route
        -> T8 CLI parity
          -> T9 x402 evidence profile
T10 quality gates depends on all implementation tasks
```

## Risks And Mitigations

- Risk: "valid certificate" becomes market shorthand for approved/paid/trusted.
  Mitigation: claim guard, API naming discipline, structured result categories, no boolean-only API.
- Risk: JWKS discovery is mistaken for trust.
  Mitigation: native key-set model owns trust posture; JWKS docs and tests call it projection only; verifier never fetches certificate-supplied trust.
- Risk: hosted verification leaks raw evidence.
  Mitigation: redaction allowlist, negative raw-leak tests, no raw receipt/gateway credential/principal-private fields in response.
- Risk: status outage silently verifies stale evidence.
  Mitigation: status unavailable maps to `proof_gap` and fail-closed verification.
- Risk: role/key/version drift creates ambient authority.
  Mitigation: signed-over key identifiers, issuer/key/role/algorithm/status/time-window checks, retired/revoked handling.
- Risk: x402 profile broadens into settlement or payment attestation.
  Mitigation: profile limited to exact per-call protected-action evidence and terminal certificate verification.

## Validation Gates

Required closeout commands:

```bash
npm run quality:claims
npm run quality:architecture
npm run format:check
npm run check:repo
```

Required focused checks:

```bash
npm test -- authority-certificate
npm test -- verifier
npm test -- certificate
npm test -- http
npm test -- cli
```

If exact script names differ, use the repo's existing equivalent focused test selectors and record the substitution.

Required test coverage:

- schema-invalid certificate;
- malformed JWK;
- duplicate keys;
- algorithm confusion;
- unknown issuer;
- unknown key version;
- unauthorized signer role;
- retired key;
- revoked key;
- stale key;
- status unavailable;
- missing required artifact kind;
- gateway admission mismatch;
- terminal binding mismatch;
- tenant or issuer mismatch;
- oversized hosted verify payload;
- hosted route raw leak attempt;
- arbitrary `jwks_uri` rejection;
- replay refusal terminal evidence;
- proof gap terminal evidence;
- x402 evidence profile does not imply paid/settled/success.

## Cut Lines

Cut before implementation if the plan requires:

- hosted verifier mutation;
- remote trust fetching from certificate-supplied URLs;
- public exposure of raw receipts or gateway credentials;
- certificate semantics beyond terminal evidence;
- boolean-only validity API;
- x402 settlement/payment-success claims;
- OAuth revocation semantics as certificate revocation semantics.

Cut scope for first implementation if needed:

- defer x402 profile until verifier routes and response model are stable;
- defer full SDK/MCP wrappers until CLI parity is proven;
- ship native verifier key-set before JWKS;
- ship local status records before hosted status route;
- ship hosted verify after redaction tests exist.

## Rollback / Stop Conditions

Stop and redesign if:

- any verifier path can return verified while status is revoked, stale, unknown, or unavailable;
- hosted verification mutates state;
- a response leaks raw receipt, gateway credential, secret, or principal-private context;
- JWKS projection becomes the authority source;
- public wording says certificate means approved, authorized, paid, settled, trusted, certified, compliant, or successful;
- one key or greenlight can validate multiple unbound terminal artifacts;
- gateway admission and terminal artifact evidence cannot be distinguished in response output.

Rollback by disabling hosted routes and preserving local pinned verification if route safety or redaction fails.

## Smallest Next Action

Implement the claim guard and vocabulary fence for `AuthorityCertificate` validity semantics, then add the protocol-owned trust read model behind existing local verification.
