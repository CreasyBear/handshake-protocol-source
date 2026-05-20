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

`client.ts`, typed client options, role token routing, transition methods, error parsing, and diagnostic evidence reads.

## Failure and scale posture

Scale by mirroring stable HTTP routes without creating a second protocol model. Client failures remain typed request/response failures and must not be interpreted as execution proof.

## Future package target

`packages/client`

## Allowed imports

Public protocol schemas and inputs, HTTP role/custody types, transition error envelope types, and SDK-local client helpers.

## Forbidden imports

Protocol primitive internals, storage implementations, Hono app internals, runtime wrappers, reference gateways, mutation credentials, and provider-specific hosted auth.

## Guarding tests

`test/http/http.test.ts`, `test/architecture/root-exports.test.ts`, and `test/architecture/import-posture.test.ts`.

## Public surface

`HandshakeClient`, `HandshakeClientError`, client options, fetch adapter types, transition methods, and redacted diagnostic evidence projection reads.

## Extraction trigger

Extract only after the HTTP route surface is stable, SDK exports are curated, client tests cover role-specific headers and typed errors, and extraction does not create a separate authority model.

## Scope boundary

This lane sends requests and parses responses. It must not infer authority from responses, issue greenlights, perform gateway checks, mutate protected surfaces, or treat evidence reads as execution proof.
