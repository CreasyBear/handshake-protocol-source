# SDK Lane

## Authority owner

Typed client invocation over public Handshake HTTP transition and diagnostic evidence routes.

## Current proof claim

Client ergonomics for invoking the reference HTTP surface. The SDK does not prove hosted operation, policy authority, gateway authority, or execution proof.

## Use cases

Let callers invoke public transition routes, route role-scoped tokens, parse typed success/error responses, and read redacted diagnostic evidence projections.

## Constraints and assumptions

The client is outside the authority boundary. It may submit evidence or requests, but server-side protocol and gateway checks decide whether consequence can proceed.

## Core components

`client.ts`, `surface-clients/`, typed client options, role-scoped transport, transition methods, error parsing, and diagnostic evidence reads.

## Failure and scale posture

Scale by mirroring stable HTTP routes without creating a second protocol model. Client failures remain typed request/response failures and must not be interpreted as execution proof.

## Future package target

`packages/client`

## Allowed imports

Public protocol schemas and inputs, HTTP role/custody types, transition error envelope types, and SDK-local client helpers.

## Forbidden imports

Protocol primitive internals, storage implementations, Hono app internals, runtime wrappers, reference gateways, mutation credentials, and provider-specific hosted auth.

## Guarding tests

`test/http/http.test.ts`, `test/sdk/role-clients.test.ts`, `test/architecture/surface-boundary-posture.test.ts`, `test/architecture/root-exports.test.ts`, and `test/architecture/import-posture.test.ts`.

## Public surface

Root exports remain `HandshakeClient`, `HandshakeClientError`, client options, fetch adapter types, transition methods, and redacted diagnostic evidence projection reads. Role-scoped surface clients are internal until their public package boundary is explicitly designed.

## Extraction trigger

Extract only after the HTTP route surface is stable, SDK exports are curated, client tests cover role-specific headers and typed errors, and extraction does not create a separate authority model.

## Scope boundary

This lane sends requests and parses responses. It must not infer authority from responses, issue greenlights, perform gateway checks, mutate protected surfaces, or treat evidence reads as execution proof.

## Role-client adoption closeout

First-slice activation code should use `RuntimeClient` and `EvidenceClient` from
`src/sdk/surface-clients`, not the low-level `HandshakeClient` token-map
transport. `HandshakeClient` remains useful for protocol tests and internal
HTTP route parity, but it teaches the wrong shape for agent-facing activation
because it can carry multiple role tokens.

`RuntimeClient` may create runtime execution evidence, tool-call drafts, intent
compilations, and action-contract proposals through `runtime_evidence` custody.
Those methods produce proposal records only. They do not evaluate policy,
greenlight, gateway-check, mutate, export receipts, mint certificates, recover,
install, isolate, or sign.

`EvidenceClient` may read redacted projections and verify a supplied terminal
`AuthorityCertificate` against explicit pinned local trust material. It does
not mint certificates, export receipts, read raw internal records, or collapse
gateway admission, downstream finality, replay, and proof gaps into a single
success boolean.

Challenge and support posture:

- return structured protocol errors or surface outcomes; do not retry protected
  work automatically from the SDK;
- send support only redacted evidence refs, projection payloads, request
  identities, reason codes, and local trust verification results;
- never request or include `PaymentPayload`, `PAYMENT-SIGNATURE`, private keys,
  signer refs, raw store records, role-token maps, or gateway credentials;
- keep `InstallClient` and `GatewayClient` as deferred contracts until the user
  explicitly expands this package surface beyond runtime/evidence.
