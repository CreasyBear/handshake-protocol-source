# Adapters Lane

## Authority owner

Reference gateway proof lanes for protected mutations that run only after a `VerifiedGatewayCheck`.

## Current proof claim

Reference gateway fixtures and adapter-pack proofs for package install, repo write, preview deploy, and external payment signing behavior. These are proof lanes, not production provider integrations.

## Use cases

Demonstrate mutation-side enforcement for protected package installs, repository writes, preview deploys, and payment signatures after the protocol derives a verified gateway check.

## Constraints and assumptions

Adapters are consequence holders. They must re-check observed parameters against exact contracts and must not mutate on proof gaps, mismatches, replay, or missing verified gates.

## Core components

`package-install/gateway.ts`, `repo-write/gateway.ts`, `preview-deploy/gateway.ts`, `x402-payment/install-proposal.ts`, `x402-payment/action-proposal.ts`, `x402-payment/wallet-gateway.ts`, `x402-payment/conformance.ts`, and adapter conformance tests.

## Failure and scale posture

Scale by adding one protected action fixture at a time with conformance tests. Failure is non-mutation plus recorded refusal/proof-gap evidence, not compensating cleanup after an unsafe mutation.

## Future package target

`packages/reference-gateways`

## Allowed imports

Public protocol gateway verification helpers, protocol schemas/inputs through public faces, adapter-local parameter schemas, filesystem or fixture mutation helpers, and test fixture support.

## Forbidden imports

Storage internals, protocol primitive internals, Hono route handlers, SDK/client code as authority, runtime wrappers as authority, provider credentials outside fixture scope, and mutation before `VerifiedGatewayCheck`.

## Guarding tests

`test/architecture/import-posture.test.ts`, `test/conformance/protected-mutation-adapter-conformance.test.ts`, `test/adapters/package-install-gateway.test.ts`, `test/adapters/repo-write-gateway.test.ts`, `test/adapters/preview-deploy-gateway.test.ts`, `test/adapters/x402-wallet-gateway.test.ts`, and `test/integration/repo-write-d1-http.test.ts`.

## Public surface

Experimental reference gateway runners, parameter schemas, mutation command/evidence types, and adapter conformance fixtures.

## Extraction trigger

Extract or rename only after source-lane manifests are guarded, the adapter-lane naming decision is accepted, and at least one installed protected action path needs the package boundary.

## Scope boundary

This lane proves gateway-side mutation discipline for fixtures. It must not imply generic adapters, hosted operation, provider-side enforcement, certification, or mutation authority without a verified gateway check.
