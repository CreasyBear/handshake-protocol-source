# Conformance Lane

## Authority owner

Reference conformance checks for protocol behavior. This lane verifies adapter posture; it does not issue authority.

## Current proof claim

Source-package conformance surface for protected mutation adapters. It proves no mutation without a `VerifiedGatewayCheck` in reference probes only.

## Use cases

Let runtime builders and gateway owners run small protocol conformance checks without depending on repo-local test helper functions.

## Constraints and assumptions

Conformance probes are supplied by the caller. A passing result means the probe did not mutate without a verified gate; it does not prove provider-side enforcement, credential custody, hosted operation, or complete adapter correctness.

## Core components

`index.ts`.

## Failure and scale posture

Conformance failures must be explicit structured results or thrown assertion errors. Scale by adding narrow probes for one invariant at a time instead of broad certification claims.

## Future package target

`packages/conformance`

## Allowed imports

Protocol public types and conformance-local helpers.

## Forbidden imports

Storage implementations, Hono transport, SDK internals, runtime wrappers as authority, provider credentials, and mutation attempts outside caller-supplied probes.

## Guarding tests

`test/architecture/import-posture.test.ts`, `test/architecture/package-surface.test.ts`, and `test/conformance/protected-mutation-adapter-conformance.test.ts`.

## Public surface

Protected mutation adapter probe types, structured conformance check results, and assertion helper.

## Extraction trigger

Extract after at least one external gateway or runtime integration consumes the conformance surface without test-local imports.

## Scope boundary

This lane verifies reference invariants. It must not imply standards compliance, provider-side gateway certification, hosted operation, or complete adapter security.
