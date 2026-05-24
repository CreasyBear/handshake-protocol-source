# Macro Plan Input: Terminal Verifier Trust Plane

Run id: terminal-verifier-trust-plane-20260524T074226Z
Date: 2026-05-24

## Hard Frame

Handshake is protected actions for automated decision making. Engineering-agent workflows are a current stress case and adoption context, not the product boundary. x402 exact per-call paid HTTP is the first protected-action wedge, not the protocol.

This plan is planning only. Do not edit source, tests, docs outside this planning run, package metadata, or previously staged files. Each perspective worker may write only its assigned raw output file. If a worker cannot comply, it must write a BLOCKED note in its assigned file only.

## Goal

Plan the terminal verifier trust plane that makes terminal `AuthorityCertificate` evidence portable without turning it into permission, identity, settlement, marketplace certification, or clearing-house language.

Mechanism target:

```text
terminal evidence
-> AuthorityCertificate
-> verifier key set
-> revocation/status check
-> verification response
-> audit-safe projection
```

## Current Source Grounding

Canonical posture:

- `.planning/macro/DEFERRED-INTEGRATE-ELIMINATE.md` says terminal verification is critical path item 2, after claim boundary cleanup and customer-owned gateway custody proof.
- `.planning/macro/active/claim-boundary-cleanup/PLAN.md` makes category wording a P0 claim boundary: protected actions for automated decision making, x402 first wedge, engineering agents only adoption context/threat model.
- `.planning/macro/active/customer-owned-gateway-custody-proof/PLAN.md` requires credential custody proof before hosted claims.
- `docs/internal/decisions.md` states `AuthorityCertificate` is local terminal signed evidence only, not greenlight, gateway check, mutation proof, identity, settlement, marketplace status, or hosted trust.
- `docs/internal/protocol-notes.md` says cross-org JWKS, revocation, hosted verify APIs, marketplace certification, and provider custody remain outside the local foundation.

Source anchors:

- `src/protocol/areas/authority-certificate/schemas.ts`
- `src/protocol/areas/authority-certificate/signing.ts`
- `src/protocol/areas/authority-certificate/transitions.ts`
- `src/protocol/areas/authority-certificate/verify.ts`
- `src/cli/certificate.ts`
- `src/surfaces/boundary-manifest.ts`
- `test/protocol/authority-certificate.test.ts`
- `test/cli/cli-evidence.test.ts`
- `test/sdk/role-clients.test.ts`
- `test/mcp/mcp-resource-redaction.test.ts`
- `test/architecture/claim-boundary.test.ts`
- `test/architecture/root-exports.test.ts`
- `test/architecture/import-posture.test.ts`

Current landed behavior:

- `createAuthorityCertificate()` mints terminal evidence only for receipt, durable refusal, proof gap, or replay refusal terminals.
- Certificate signing input excludes signatures/signingInputDigest and includes terminal, envelope, artifacts, verification policy, consumer bindings, extensions, and emittedAt.
- `verifyAuthorityCertificate()` validates schema, envelope digest, signing input digest, signature signed-over binding, algorithm prefix, pinned trust keys, signer roles, required artifact kinds, gateway admission binding, and terminal binding.
- Production verification rejects `hmac-sha256`; HMAC is dev-only behind `allowDevHmac`.
- Trust material is local/pinned: keys have `keyIdentityRef`, optional `signerRole`, algorithm, public key or HMAC secret, and status `active|retired`.
- CLI `cert verify` is evidence-plane only. It verifies supplied certificate material against supplied trust material without minting, mutation, protocol-store access, or raw dumps.

Current gaps to plan:

- No verifier key-set projection or JWKS-compatible public-key surface.
- No issuer/signer role/key version/read model beyond local trust material.
- No revocation or status record for certificates/signers/key material.
- No hosted verifier route.
- No route admission, reader authorization, retention, or redacted response plane for hosted verification.
- No stale-key, revoked-key, unknown-key, wrong-issuer, wrong-envelope, or status-unavailable failure model beyond local `trust_key_missing` and `trust_key_inactive`.
- No public claim guard that "valid certificate" means terminal evidence verified at a time/status boundary, not permission, identity, settlement, certification, or final business success.

## Official Source Constraints

Use these only as planning constraints; do not invent compatibility claims without implementation and tests:

- RFC 7517 defines JWK/JWK Set as JSON representations of cryptographic keys and key sets. It explicitly requires protection for non-public key material.
- RFC 7515 defines JWS signing/validation concepts, key identification, and integrity-protected header considerations.
- RFC 8414 defines `jwks_uri` as metadata for a URL pointing to a JWK Set document.
- RFC 7009 is OAuth token revocation, not a certificate revocation standard. Its transferable lesson is security posture: revocation/status endpoints need trustworthy discovery, HTTPS/authentication, and careful failure handling.

Open question for the plan: whether Handshake should implement a JWKS-compatible public-key projection now or a Handshake-native verifier key-set first, with JWKS compatibility as a later adapter. The answer must preserve modularity and not make OAuth/JWT semantics part of the protocol unless explicitly implemented.

## Required Perspectives

Produce five independent raw perspectives before chair synthesis:

1. Strategy: trust-plane product posture, category boundaries, x402-first-wedge implications, adoption sequence.
2. Architecture: protocol schema/state/route/read-model design, key set/status/revocation, redaction, integration points.
3. Execution: ordered implementation slices, file-level candidates, tests, gates, dependency graph.
4. Risk/Security: threat model, stale key and revocation failure modes, hosted route abuse, response leakage, claim drift.
5. Adoption/DevEx: CLI/SDK/MCP/hosted verifier usage shape, customer integration without boiling the ocean, error affordances.

## Chair Synthesis Requirements

Create:

- `PLAN.md`
- `CONTEXT.md`
- `ASSUMPTIONS.md`
- `DECISIONS.md`
- `RISKS.md`
- `VALIDATION.md`
- `TASKS.jsonl`
- `runs/terminal-verifier-trust-plane-20260524T074226Z/synthesis.md`

The plan must include:

- Summary
- Source Grounding
- Non-Goals
- Recommended Architecture
- Phased Implementation
- Validation Gates
- Success Criteria
- End Criteria
- 10-Star Product Bar
- Antipatterns
- Open Questions
- Smallest Next Mechanism

## Must-Haves

- Keep `AuthorityCertificate` as terminal evidence, not permission, identity, settlement, certification, or downstream success.
- Separate key discovery from trust decision. A key being visible in a key set is not enough; signer role, issuer/tenant scope, key version, status, revocation, and certificate terminal binding must be evaluated.
- Treat status/revocation failure explicitly. Decide fail-closed vs proof-gap behavior for unavailable status checks.
- Never expose private keys, symmetric keys, HMAC secrets, signing material, raw protocol records, raw custody material, `PaymentPayload`, `PAYMENT-SIGNATURE`, bearer tokens, or mutation credentials.
- Preserve local/offline verification. Hosted verifier is additive, not a replacement for offline pinned verification.
- Keep CLI/MCP/SDK evidence surfaces non-mutating unless a later implementation explicitly promotes a mutation surface through policy/gateway checks.
- Respect the sequence: custody proof first, terminal verifier trust plane second, hosted evidence/admission after both are stable.

## Antipatterns To Reject

- Certificate equals approval, identity, settlement, marketplace certification, clearing-house readiness, or downstream success.
- JWKS equals trust.
- Revocation endpoint copied from OAuth semantics without Handshake-specific certificate/status semantics.
- Hosted verification route that returns raw certificate envelopes, raw records, secrets, or operational internals.
- Trust plane that only works if every actor is honest.
- Verifier route that reads or mutates protocol state while claiming to be offline/portable verification.
- CLI/MCP/SDK surfaces that mint certificates or issue authority.
- x402-specific signer fields leaking into generic certificate trust semantics.

## Closeout Expectations

Planning closeout is successful when every required output exists, `TASKS.jsonl` parses, required plan sections exist, source working tree remains untouched, and the plan states validation commands for eventual implementation.
