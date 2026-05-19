# Structure

This repo is a TypeScript protocol kernel. The tree should be navigable by authority boundary.

Last structural audit: 2026-05-19.

## Ownership Rules

| Path                  | Owns                                                                                                                 | Must Not Own                                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `src/protocol/`       | Protocol primitives, state transitions, canonicalization, events, store port, navigation, public schemas and inputs. | HTTP transport, storage implementations, runtime wrappers, gateway fixtures, client ergonomics, hosted operation. |
| `src/http/`           | Hono/Worker app, admission, route metadata, handlers, OpenAPI, HTTP errors, store resolution.                        | Protocol meaning, policy interpretation, mutation authority.                                                      |
| `src/runtime/`        | Generated-execution evidence and action proposal helpers.                                                            | Policy decisions, greenlights, gateway checks, receipts, mutation attempts.                                       |
| `src/adapters/`       | Reference gateway fixtures that mutate only after a verified gateway check.                                          | Storage internals, runtime authority, provider-side claims.                                                       |
| `src/conformance/`    | Reference checks for protocol and gateway posture.                                                                   | Hosted operation, standards claims, provider certification, mutation attempts.                                    |
| `src/storage/`        | Atomic record commits, stream offsets, D1, memory fixtures, KV cache plumbing.                                       | Protocol meaning, route handling, SDK behavior.                                                                   |
| `src/sdk/`            | Typed client calls and response parsing.                                                                             | Authority inference, mutation, storage, runtime wrappers.                                                         |
| `src/index.ts`        | Curated package export surface.                                                                                      | Internal kernel/store objects or compatibility shims.                                                             |
| `src/experimental.ts` | Explicit reference gateway fixture exports.                                                                          | Stable public API claims or provider enforcement claims.                                                          |
| `src/worker.ts`       | Cloudflare Worker entrypoint wiring.                                                                                 | Protocol meaning, route behavior, or deployment policy.                                                           |
| `migrations/`         | Canonical D1 schema for protocol storage.                                                                            | Runtime behavior or product documentation.                                                                        |
| `wrangler.toml`       | Worker binding and deployment configuration.                                                                         | Product claims or protocol semantics.                                                                             |

## Current Tree

```text
src/
  protocol/
    kernel.ts
    public/
    foundation/
    events/
    context/
    navigation/
    store/
    areas/
  http/
    app.ts
    app-options.ts
    admission/
    routes/
    handlers/
    errors/
    openapi/
    navigation/
    store/
  runtime/
    package-install/
    repo-write/
    preview-deploy/
    codemode-multi-action/
  adapters/
    package-install/
    repo-write/
    preview-deploy/
  conformance/
  storage/
    d1/
    memory/
    kv/
    store.ts
  sdk/
    client.ts
  index.ts
  experimental.ts
  worker.ts
wrangler.toml
migrations/
```

## Test Tree

```text
test/
  architecture/
  protocol/
  http/
  runtime/
  adapters/
  integration/
  support/
```

Root `test/` must not contain loose `.test.ts` files.

## Folder Rules

- Split folders by ownership, not generic buckets.
- A source folder with more than three TypeScript files needs an `index.ts` public face.
- A source folder must not exceed seven loose TypeScript files, excluding `index.ts`.
- Area modules stay under `src/protocol/areas/*`.
- Public schema and input aggregation stays under `src/protocol/public`.
- File moves must preserve root export curation.

## Source Lane Manifests

Every first-level source lane must declare:

```text
Authority owner
Current proof claim
Use cases
Constraints and assumptions
Core components
Failure and scale posture
Future package target
Allowed imports
Forbidden imports
Guarding tests
Public surface
Extraction trigger
Scope boundary
```

These manifests are guardrails for extraction and review. They are not product claims. They follow the same discipline as a system design review: name the use case, constraints, assumptions, component boundary, bottlenecks, and failure behavior before treating a folder as platform surface.

## Current Rename Posture

- Protocol primitive folders live under `src/protocol/areas/*`.
- Public protocol aggregators live under `src/protocol/public/*`.
- Foundation helpers live under `src/protocol/foundation/*`.
- HTTP route metadata, invokers, response schemas, and scope resolvers live under `src/http/routes/*`.
- HTTP caller admission and request context construction live under `src/http/admission/*`.
- Runtime proposal helpers use `action-proposal.ts`; the generated-program runner uses `generated-program-runner.ts`.
- Storage implementations live under `src/storage/d1`, `src/storage/memory`, and `src/storage/kv`.
- Conformance checks live under `src/conformance` and are exported only through the `./conformance` package subpath.

## Docs

Keep docs internal and compact:

```text
README.md
AGENTS.md
QUALITY.md
STRUCTURE.md
docs/internal/decisions.md
docs/internal/protocol-definition.md
docs/internal/protocol-kernel-architecture.md
docs/internal/protocol-layman.md
docs/internal/protocol-notes.md
```

Long planning reports, source studies, and historical prompts belong outside the active repo tree or under `docs/internal/archive` only when there is a reason to retain provenance.

Root prompt files and marketing context files are not canonical in this checkout. They should live outside the repo unless explicitly reintroduced as archived, non-canonical provenance.

Repo-local `.agents` skill bundles and `skills-lock.json` are also scratch. They may exist on a developer machine, but they are not part of the protocol kernel and must not be tracked in active repo canon.
