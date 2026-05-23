# Protocol Lane

## Authority owner

Protocol authority semantics: action contracts, policy decisions, one-use greenlights, gateway checks, receipts, proof gaps, isolation, recovery, review binding, generated-execution evidence boundaries, and transition invariants.

## Current proof claim

Protocol foundation. This lane proves local protocol behavior and invariant ownership; it does not prove hosted operation, provider-side enforcement, package extraction, or self-hosted activation.

## Use cases

Compile generated execution evidence into candidate actions, bind exact action contracts, evaluate policy, issue one-use greenlights, verify gateway checks, record receipts/refusals/proof gaps, and reconstruct the action chain.

## Constraints and assumptions

Generated code may overreach, retry, branch, or hide consequence. Runtime evidence is not authority. Storage commits may conflict. Gateway enforcement must happen after policy and before mutation.

## Core components

`kernel.ts`, `areas/*`, `foundation/*`, `events/*`, `context/*`, `navigation/*`, `store/*`, and `public/*`.

## Failure and scale posture

Prefer consistency over availability for authority-bearing transitions. Conflicts become refusals, bounded retries, isolation, or proof gaps. Scale comes from extracting stable protocol areas without weakening exact binding.

## Future package target

`packages/protocol`

## Allowed imports

Protocol area modules, local protocol indexes, schema/core helpers, canonicalization helpers, protocol error types, and protocol store interfaces.

## Forbidden imports

Hono or Worker transport, SDK/client code, runtime wrappers, reference gateways, storage implementations, product surfaces, app code, and package/workspace glue.

## Guarding tests

`test/architecture/import-posture.test.ts`, `test/architecture/root-exports.test.ts`, `test/protocol/kernel-*.test.ts`, `test/protocol/generated-execution-graph.test.ts`, `test/protocol/evidence-projections.test.ts`, `test/protocol/policy-auth-md.test.ts`, `test/integration/auth-md-receipt-reconstruction.test.ts`, `test/protocol/transition-matrix.test.ts`, and `test/protocol/model-based-invariants.test.ts`.

## Public surface

Root protocol schemas, inputs, kernel transitions, public protocol area indexes, gateway verification helpers, and protocol error types exported through the curated package root.

## Extraction trigger

Extract only after this manifest is stable, root exports are intentionally curated, import-posture guards pass, at least two real consumers need the boundary, and extraction changes no protocol semantics or proof claims.

## Scope boundary

This lane defines protocol meaning. It must not own transport custody, storage mechanics, runtime authority, client ergonomics, hosted operation, provider enforcement, or mutation credentials.
