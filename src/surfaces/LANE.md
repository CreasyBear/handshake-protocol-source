# Surfaces Lane

## Authority owner

Shared boundary manifests for SDK, CLI, MCP, and other non-kernel product surfaces.

## Current proof claim

This lane records source-owned surface posture only. It does not create protocol authority, route behavior, SDK behavior, CLI behavior, MCP behavior, or gateway enforcement.

## Use cases

Give architecture tests one canonical contract for surface ids, custody roles, allowed route families, forbidden route families, forbidden imports, forbidden credential shapes, required non-authority flags, and claim-boundary labels.

## Constraints and assumptions

Surface manifests are guardrails for implementation and review. The protocol kernel, HTTP admission, gateway adapters, and store remain the sources of behavior and durable evidence.

## Core components

`boundary-manifest.ts` defines the shared surface boundary table consumed by architecture tests.

## Failure and scale posture

If a surface needs a new authority exception, the manifest must change first and architecture tests must make the new boundary explicit. Silent per-surface exceptions are treated as structural drift.

## Future package target

Internal source package only until surface contracts are stable enough for a deliberate public subpath decision.

## Allowed imports

Surface-owned manifests, literal protocol route-family names, and test-consumable boundary data.

## Forbidden imports

Protocol primitive internals, storage implementations, HTTP app internals, runtime wrappers, reference gateways, mutation credentials, signer factories, provider SDKs, and experimental gateway fixtures.

## Guarding tests

`test/architecture/surface-boundary-posture.test.ts`, `test/architecture/import-posture.test.ts`, and `test/architecture/root-exports.test.ts`.

## Public surface

No root package export. Surface manifests are source-owned internal contracts until a public subpath is explicitly designed.

## Extraction trigger

Extract only after SDK, CLI, and MCP implementations consume the manifest without adding hidden authority exceptions or public export churn.

## Scope boundary

This lane defines what product surfaces may import, expose, and claim. It must not evaluate policy, issue greenlights, perform gateway checks, mutate protected surfaces, mint certificates, export receipts, or read raw protocol records.
