# Adapters Lane

## Authority owner

Reference adapter proof lanes for protected mutations, upstream evidence intake,
and gateway-bound credential use. Mutation-capable adapters run only after a
`VerifiedGatewayCheck`.

## Current proof claim

Reference gateway fixtures and adapter-pack proofs for package install, repo write, preview deploy, external payment signing behavior, and auth.md credential-registration/protected-call profiles. The auth.md lane now includes a protected API-call gateway fixture that records redacted credential-resolution evidence only after a verified gate. These are proof lanes, not production provider integrations or standards certification claims.

## Use cases

Demonstrate mutation-side enforcement for protected package installs, repository writes, preview deploys, payment signatures, and auth.md-backed protected service calls after the protocol derives a verified gateway check. Auth.md adapter helpers demonstrate upstream two-hop PRM/authorization-server registration provenance, gateway credential custody intake, exact protected service-call proposal, post-gate credential-resolution evidence, replay refusal, downstream proof gaps, and redaction failure handling without treating registration as authority.

## Constraints and assumptions

Adapters that hold consequence must re-check observed parameters against exact contracts and must not mutate on proof gaps, mismatches, replay, or missing verified gates. Upstream adapter profiles may normalize evidence, create proposal inputs, or prepare gateway credential refs, but they must not issue policy decisions, greenlights, gateway checks, receipts, or mutation proof.

## Core components

`auth-md/profiles.ts`, `auth-md/action-proposal.ts`, `auth-md/gateway.ts`, `package-install/gateway.ts`, `repo-write/gateway.ts`, `preview-deploy/gateway.ts`, `x402-payment/install-proposal.ts`, `x402-payment/action-proposal.ts`, `x402-payment/wallet-gateway.ts`, `x402-payment/conformance.ts`, and adapter conformance tests.

## Failure and scale posture

Scale by adding one protected action fixture or upstream profile at a time with conformance tests. Failure is non-mutation plus recorded refusal/proof-gap evidence, not compensating cleanup after an unsafe mutation.

## Future package target

`packages/reference-gateways`

## Allowed imports

Public protocol gateway verification helpers, protocol schemas/inputs through public faces, adapter-local parameter schemas, filesystem or fixture mutation helpers, and test fixture support.

## Forbidden imports

Storage internals, protocol primitive internals, Hono route handlers, SDK/client code as authority, runtime wrappers as authority, provider credentials outside fixture scope, and mutation before `VerifiedGatewayCheck`.

## Guarding tests

`test/architecture/import-posture.test.ts`, `test/conformance/protected-mutation-adapter-conformance.test.ts`, `test/adapters/auth-md-adapter.test.ts`, `test/adapters/auth-md-gateway.test.ts`, `test/adapters/package-install-gateway.test.ts`, `test/adapters/repo-write-gateway.test.ts`, `test/adapters/preview-deploy-gateway.test.ts`, `test/adapters/x402-wallet-gateway.test.ts`, and `test/integration/repo-write-d1-http.test.ts`.

## Public surface

Experimental reference gateway runners, upstream adapter profile helpers, parameter schemas, mutation command/evidence types, and adapter conformance fixtures.

## Extraction trigger

Extract or rename only after source-lane manifests are guarded, the adapter-lane naming decision is accepted, and at least one installed protected action path needs the package boundary.

## Scope boundary

This lane proves gateway-side mutation discipline and upstream adapter profile boundaries for fixtures. It must not imply generic adapters, hosted operation, provider-side enforcement, auth provider status, certification, or mutation authority without a verified gateway check.
