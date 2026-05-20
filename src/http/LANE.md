# HTTP Lane

## Authority owner

Hono/Worker transition transport: caller custody checks, hosted route admission, request context construction, route metadata, OpenAPI projection, response mapping, and internal diagnostic reads.

## Current proof claim

Reference transport proof for local and D1-shaped protocol routes. Hosted caller identity is a provider-agnostic route-admission seam only.

## Use cases

Expose protocol transitions and read-only diagnostic evidence, including redacted agent transaction envelopes, over HTTP while preserving custody checks, request context, route metadata, typed errors, and OpenAPI projection.

## Constraints and assumptions

HTTP callers are not authority by default. Hosted admission can reject or contextualize requests, but policy meaning, gateway authority, and mutation proof remain protocol concerns.

## Core components

`app.ts`, `app-options.ts`, `admission/*`, `routes/*`, `handlers/*`, `errors/*`, `openapi/*`, `navigation/*`, and `store/*`.

## Failure and scale posture

Fail closed before body parsing for missing or wrong custody. Keep route metadata separate from dispatch and schemas so the surface can scale without merging transport, policy, and response concerns.

## Future package target

`packages/http-hono`

## Allowed imports

Protocol kernel facade, protocol schemas and inputs through public faces, protocol store interface, storage adapter construction for Hono contexts, caller-custody helpers, and HTTP-local route metadata/handlers.

## Forbidden imports

Protocol area internals, reference gateway implementations, runtime wrappers as authority, product surfaces, and any provider-specific hosted identity product.

## Guarding tests

`test/architecture/import-posture.test.ts`, `test/http/http.test.ts`, `test/http/d1-http.test.ts`, `test/architecture/root-exports.test.ts`, and `test/architecture/active-vocabulary.test.ts`.

## Public surface

`createApp`, `AppOptions`, `WorkerBindings`, role-scoped bearer custody helpers, hosted caller verifier types, OpenAPI document, and public transition/evidence routes.

## Extraction trigger

Extract only after route/admission/evidence/read ownership stays stable, root exports remain curated, HTTP has a named quality command or quality group, and extraction does not broaden public API claims.

## Scope boundary

This lane invokes one protocol transition or read handler per route. It must not decide policy, lifecycle, gateway, review, proof-gap, recovery, object meaning, or mutation authority.
