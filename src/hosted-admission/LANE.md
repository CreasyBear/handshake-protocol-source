# Hosted Admission Lane

## Authority owner

Provider-neutral hosted caller evidence helpers and public package exports for
hosted admission integration.

## Current proof claim

This lane exposes redacted hosted caller, participant binding, verifier-adapter,
and hosted admission configuration contracts. It does not create protocol
authority, policy decisions, greenlights, gateway checks, payment material,
mutations, receipts, or terminal certificates.

## Use cases

Let a hosted workspace consume a narrow package subpath for Clerk, OAuth/OIDC,
service credential, or future provider verifier adapters without importing HTTP
internals or the broad package root.

## Constraints and assumptions

Provider SDKs, raw session tokens, private claims, service credentials, and
billing identifiers stay outside this package surface. Provider adapters verify
raw material server-side and return adapter-verified claims that this lane
normalizes into digest/ref evidence only.

## Core components

`index.ts` is a curated public face over hosted caller identity normalization,
provider verifier adapter claims, hosted admission config, and readiness
schemas.

## Failure and scale posture

If this lane exposes a policy client, gateway client, signer, payment payload,
raw record reader, mutation runner, or receipt export, hosted convenience has
escaped the evidence boundary.

## Future package target

Keep this as the only public hosted-admission package subpath unless a separate
package-surface decision proves a narrower follow-on export.

## Allowed imports

Hosted HTTP admission schemas and provider-neutral hosted verifier helpers.

## Forbidden imports

Protocol kernel internals, storage implementations, SDK role clients, runtime
ingress, MCP tools, gateway adapters, signer factories, provider SDKs,
credential resolvers, mutation runners, receipt export helpers, and raw record
handlers.

## Guarding tests

`test/architecture/root-exports.test.ts`, `test/architecture/package-surface.test.ts`,
`scripts/check-package-surface.mjs`, and `scripts/check-published-entrypoints.mjs`.

## Public surface

`handshake-protocol-kernel/hosted-admission` is a non-authority hosted
integration surface. The package root must not export these hosted admission
helpers.

## Extraction trigger

Extract only if a hosted workspace needs a smaller provider-specific adapter
package. Do not extract to add provider SDK lock-in.

## Scope boundary

This lane helps a service produce and validate redacted identity evidence before
kernel transitions. It must not approve spend, widen an operating envelope,
perform policy evaluation, issue greenlights, verify gateway checks, invoke
signers, manage payment, mutate, or claim hosted operation.
