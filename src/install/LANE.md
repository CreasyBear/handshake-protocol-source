# Install Lane

## Authority owner

Product-facing installation compiler contracts for protected action paths. This lane defines the generic proposal shape an adapter pack can compile into kernel records.

## Current proof claim

Generic install proposal and protected-action adapter-pack contracts exist. Specific payment or provider packs live under adapter/plugin lanes, not protocol areas.

## Use cases

Let adapter packs present an install proposal that can be reviewed and installed as catalog, gateway, envelope, policy-pack, probe-plan, and receipt-expectation records.

## Constraints and assumptions

Endpoint discovery is input, not authority. Adapter registry presence is input, not permission. The compiler may produce installable records or refusal reasons; it must not issue policy decisions, greenlights, gateway checks, receipts, signatures, or downstream success claims.

## Core components

`install-proposal/index.ts` and `protected-action-adapter-pack/index.ts`.

## Failure and scale posture

Failure is a refused install proposal with reason codes. Scale by adding one adapter-compiled protected path at a time, with hostile fixtures owned by the adapter pack rather than the protocol kernel.

## Future package target

`packages/install-compiler`

## Allowed imports

Protocol schema types, canonicalization helpers, adapter-pack definitions, and install-lane schemas.

## Forbidden imports

Storage internals, Hono transport handlers, SDK/client code as authority, runtime mutation helpers, gateway runners, policy evaluation, greenlight issuance, payment signing, or provider credentials.

## Guarding tests

`test/architecture/import-posture.test.ts` and adapter-pack install tests such as `test/adapters/x402-install-proposal.test.ts`.

## Public surface

Internal source package install compiler contracts for `InstallProposal` and `ProtectedActionAdapterPack`.

## Extraction trigger

Extract only after an adapter-pack protected path proves proposal, policy, gateway check, receipt, refusal, and proof-gap behavior without broadening the protocol kernel.

## Scope boundary

This lane hides configuration assembly behind an install proposal. It must not hide authority, claim hosted operation, claim provider enforcement, certify providers, or turn an adapter rail into protocol truth.
