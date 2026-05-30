# Integrations Lane

External-protocol adapters that produce **non-authority evidence** for Handshake.
The first occupant is `a1-evidence`: a self-contained TypeScript verifier for
cryptographic multi-hop delegation chains (design lineage: MIT-licensed A1, see
`THIRD_PARTY_NOTICES`). It verifies provenance and emits a receipt-shaped record;
it never issues a greenlight, gateway check, or clearance.

## Authority owner

No authority lives here. This lane verifies third-party delegation artifacts and
returns evidence. Handshake's policy, greenlight, and gateway lanes remain the sole
mutation authority; nothing in this lane can authorize a mutation.

## Current proof claim

`verifySignedChain` proves that a presented Ed25519/BLAKE3 delegation chain is
internally consistent (linkage, signatures, intent membership, expiry) under the
`handshake-delegation-1.0.0-zip215` verifier. A valid outcome is delegation
provenance evidence only; it does not imply a contract, greenlight, or gateway
acceptance.

## Use cases

Let an intent compiler attach verified delegation provenance to a `CandidateAction`
as a reference, and let receipt export record delegation evidence separately from
enforcement and downstream outcome. Supports reconstruction of who delegated what to
whom, bound to an exact action contract via the evidence binding digest.

## Constraints and assumptions

Verification is offline and stateless over caller-supplied bytes. A valid result
assumes the caller trusts the root principal key out-of-band; it does not prove key
custody, revocation freshness, provider-side enforcement, or that the principal
understood the delegated scope. The chain composition is Handshake-owned and
self-defined — see the `self_defined_composition` proof gap; primitive correctness
is anchored on external Ed25519 (RFC 8032) and BLAKE3 known-answer vectors.

## Core components

`verify-chain.ts` (verifier), `wire-types.ts` / `wire-normalize.ts` / `hex.ts`
(wire decode), `reason-codes.ts` (failure mapping to Handshake reason codes),
`types.ts` (outcomes and proof-gap constants), `delegation-evidence-record.ts`
(receipt-shaped record), and `primitives/` (domain separators, BLAKE3 cert/chain
digests, verify-outcome digest, contract-bound evidence binding digest).

## Failure and scale posture

All failures are structured refusals with a `delegation_evidence_invalid:*` reason
code; missing ground truth is recorded as an explicit proof gap, never smoothed
over. The verifier re-checks every upstream certificate, so borrowed or grafted
certs (parent-swap) are refused. Scale by adding narrow verifiers per credential
format rather than broadening any single verifier's trust.

## Future package target

`packages/delegation-evidence`

## Allowed imports

`@noble/curves`, `@noble/hashes`, `zod`, protocol public schema-core types, and
lane-local modules.

## Forbidden imports

Protocol kernel authority modules, policy-greenlight / gateway-gate / receipt-export
transitions, authority-certificate signing, storage adapters, HTTP and SDK
transports, and any credential minting or authorization issuance.

## Guarding tests

`test/architecture/a1-evidence-invariants.test.ts`,
`test/architecture/a1-forbidden-copy.test.ts`,
`test/architecture/a1-integration-kill-enforcement.test.ts`,
`test/architecture/a1-integration-phase-gate.test.ts`,
`test/architecture/import-posture.test.ts`, and the conformance suites under
`test/integrations/a1-evidence/`.

## Public surface

`verifySignedChain` and its outcome types, the delegation-evidence record schema,
the evidence binding digest, the verify-outcome digest, and the verifier version
constant.

## Extraction trigger

Extract once a second credential format adapter lands beside `a1-evidence`, or once
an external runtime consumes the verifier without repo-local test helpers.

## Scope boundary

This lane verifies presented delegation artifacts and returns evidence. It must not
issue authority, mint or present credentials as permission, enforce mutations, or
claim provider-side acceptance.
