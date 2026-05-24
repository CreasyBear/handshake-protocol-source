# Strategy Perspective

## Invariant At Stake

Portable terminal evidence must not become portable permission. An `AuthorityCertificate` can prove that Handshake recorded terminal evidence for an exact action contract under a pinned verifier trust set. It must not imply identity, settlement, compliance, certification, business success, or authority to mutate anything.

## Strategy Posture

Handshake should position this work as an evidence portability layer for protected automated actions, starting with x402 exact per-call paid HTTP. The wedge is not "x402 support." The wedge is that paid HTTP calls are consequential, frequent, atomic, externally observable, and naturally require proof that an exact call was greenlit or refused before consequence.

The verifier trust plane should make terminal evidence portable across systems without expanding Handshake's role. Handshake issues and verifies evidence. It does not become a payment processor, identity provider, certificate authority, compliance auditor, or clearing house.

## Category Boundaries

Keep:

- `AuthorityCertificate` as signed terminal evidence.
- Verifier key sets as public trust material.
- Revocation/status as evidence freshness and trust-state checks.
- Verification response as an audit-safe projection.
- x402 as the first protected-action surface.

Cut:

- certificate means approved;
- certificate means paid;
- certificate means the principal authorized all downstream effects;
- certificate means the actor is trusted;
- certificate means settlement succeeded;
- certificate means compliance;
- certificate authority language unless Handshake intentionally accepts CA expectations, liability, lifecycle, audits, and revocation semantics.

Preferred language:

- terminal evidence certificate;
- evidence verifier;
- verifier key set;
- certificate status;
- audit-safe verification response;
- protected action evidence.

Avoid:

- trust network;
- identity layer;
- payment certification;
- settlement proof;
- authorization certificate;
- approved certificate;
- clearing house.

## x402-First Wedge Implications

x402 is strategically useful because it forces exactness:

- one paid HTTP request;
- one gateway admission;
- one terminal outcome;
- one receipt/refusal/proof gap;
- one certificate;
- one verifier response.

That maps cleanly onto Handshake's core primitive.

x402 is also dangerous because the market will try to pull Handshake into protocol claims: payment validity, payer identity, merchant trust, settlement finality, and dispute resolution. Reject that pull. Handshake's job is to prove whether the automated actor had a gateway-bound terminal evidence record for the exact protected call. Payment protocol semantics remain outside the product boundary.

The product claim should be:

> For x402-protected automated calls, Handshake makes the terminal evidence portable: what exact action was proposed, what terminal evidence exists, which verifier key signed it, whether the certificate is currently verifiable, and what must remain unknown.

## Adoption Sequence

1. Local verifier model: add issuer/signer role/key-version read models over existing pinned trust material. No hosted route yet. Prove the trust vocabulary without network product surface.
2. Public key-set projection: expose RFC 7517-shaped JWK Set projection for active and retired verifier public keys. Protect non-public material. Include key ids and signer roles without turning this into identity.
3. Status and revocation records: add certificate status records: `active`, `revoked`, `stale`, `unknown`, `status_unavailable`. Treat unavailable status as a verification failure unless explicitly configured otherwise.
4. Verification response plane: return redacted, audit-safe verification responses with certificate digest, terminal evidence kind, issuer, signer role, key id/version, status, checked-at, artifact checks, gateway binding, terminal binding, and explicit non-claims.
5. Hosted verifier route: add a read-only route that verifies submitted certificates against projected key set and status store. It must be non-mutating and must not mint authority.
6. x402 integration profile: define the minimal verification profile an x402 receiver or auditor needs: exact paid-call contract digest, terminal evidence kind, gateway admission binding, certificate status, and proof-gap handling.

## Cut Lines

- Do not build settlement proof.
- Do not build principal identity assertions.
- Do not build merchant reputation.
- Do not build generalized credentials.
- Do not build org-wide trust federation.
- Do not allow verification response consumers to treat `valid` as safe to execute.
- Do not use RFC 7009 semantics directly. Borrow only the security lesson: revocation/status endpoints require careful authentication, denial-of-service posture, and status ambiguity handling.
- Do not expose raw receipts if the verifier response can answer the audit question with redaction.

## Assumptions

- x402 paid HTTP calls remain atomic enough to model as one protected action attempt.
- The current certificate signing model already binds terminal evidence to envelope digest, signing input digest, signer role, gateway admission, and terminal artifact kind.
- Local pinned trust material is acceptable for the next phase but not sufficient for external verifier adoption.
- External consumers need portable evidence, not raw internal receipt stores.
- Revocation/status is about trust in certificate evidence, not undoing the underlying action.

## Dependencies

- Stable certificate schema and digest canonicalization.
- Public-key signing path suitable for production.
- Key id and key version model.
- Signer role model.
- Issuer model.
- Status store with revocation reason and checked-at timestamps.
- Audit-safe redaction policy.
- Claim guard copy and tests preventing overstatement.
- x402 action-contract profile defining required fields and evidence expectations.

## Risks

- `valid: true` becomes authorization theatre if the response does not say what validity means.
- Hosted verifier becomes a de facto trust authority if product language drifts.
- Revocation gets misread as payment cancellation.
- x402 positioning gets mistaken for protocol infrastructure rather than protected-action enforcement.
- Status-unavailable handling becomes a soft pass under adoption pressure.
- Key rotation breaks old audits if retired keys are not verifiable with clear status.
- Redaction strips too much, making the response useless for reconstruction.
- Redaction strips too little, leaking principal, action, or business-sensitive data.

## Validation Gates

- A certificate with a valid signature but revoked status must fail verification.
- A certificate signed by a retired-but-allowed key must verify only according to explicit policy.
- A certificate with unknown key id must fail.
- A certificate with valid signature but missing required terminal artifact kind must fail.
- A certificate with valid receipt evidence but no gateway admission binding must fail.
- A certificate with proof-gap terminal evidence must verify as a proof gap, not as success.
- Hosted verifier must be read-only and non-mutating.
- Verification response must include explicit non-claims.
- Claim guard must reject valid certificate means approved/paid/authorized/settled/certified.
- x402 profile must prove one protected paid-call attempt, not generalized payment legitimacy.

## 10-Star Bar

A 10-star version makes an external x402 receiver or auditor comfortable asking one narrow question:

> Does this submitted terminal evidence certificate verify against Handshake's published verifier keys and current status policy, and what exact protected-action evidence does it prove or fail to prove?

The answer is deterministic, redacted, reconstructable, and boring. It includes enough evidence to audit the exact protected action attempt. It refuses to imply authority. It survives key rotation. It handles revocation and stale status explicitly. It treats proof gaps as first-class outcomes. It makes overclaiming hard in code, docs, and API shape.

## Smallest Next Mechanism

Build the verifier read model and response contract first: issuer, signer role, key id/version, active/retired status, certificate status, verification result, terminal evidence projection, and explicit non-claims. Then expose the same model through a JWKS projection and only after that through a hosted verifier route.
