# Decisions

Last canonical audit: 2026-05-19.

## Canonical Source Set

This checkout keeps a small internal canonical set:

```text
AGENTS.md
README.md
QUALITY.md
STRUCTURE.md
docs/internal/decisions.md
docs/internal/protocol-definition.md
docs/internal/protocol-kernel-architecture.md
docs/internal/protocol-layman.md
docs/internal/protocol-notes.md
```

`.planning/` is scratch. Long plans, source studies, public-facing product docs, and historical prompts are not active repo truth.

Operational enforcement surfaces are also authoritative for behavior:

- `package.json` defines the local command contract.
- `.github/workflows/check.yml` defines the CI gate.
- `test/architecture/*` enforces repo shape, naming posture, import posture, vocabulary, and root export curation.
- `src/*/LANE.md` defines lane-local ownership boundaries.
- `wrangler.toml` defines Worker binding configuration.
- `migrations/` defines the canonical D1 schema.

Files under `.agents/skills` are tool assets. They are not product truth.

## Product Kernel

Handshake is contracted execution infrastructure for engineering agents.

The current kernel centers on protected action control:

```text
exact action contract
-> exact policy decision
-> one-use gateway-bound greenlight
-> gateway check before mutation
-> receipt, refusal, or proof gap
```

The first credible wedge remains engineering-agent actions: preview deploys, package installs, CI/release changes, repository writes with downstream consequence, cloud configuration mutations, and database/data-plane operations.

## Current Bought Product

The first bought product is Handshake Protected Actions: an integration kit and receipt experience that lets one coding-agent workflow execute one protected production-adjacent action through gateway-checked action contracts.

The first pilot shape is intentionally small:

```text
one repo
one agent runtime
one consequential action class
one gateway check
one policy file
one receipt timeline
```

## Claims Boundary

Handshake can claim protected control only for installed paths where the gateway owns the mutation credential and checks the exact one-use greenlight before mutation.

Handshake must not claim:

- universal agent governance;
- generic agent safety;
- provider-side enforcement without a provider or customer gateway check;
- downstream business success from a receipt;
- control over raw sibling tools, browser paths, shell paths, or credentials outside the installed gateway.

## Repo Boundary

This checkout is an internal TypeScript protocol kernel. It should not carry long public-facing product reports, product-owner prompts, marketing docs, GTM notes, buyer/persona material, or planning taxonomy. Durable decisions are kept here only when they protect implementation boundaries.

## Documentation Canon

Accepted: the active repo canon is compact and internal.

Former ADR, plan, product, protocol, business, reference, audit, and spec subtrees are no longer active repo truth. Durable decisions move into this file only when they protect implementation boundaries. Protocol definition lives in `docs/internal/protocol-definition.md`. Kernel architecture and schema mapping live in `docs/internal/protocol-kernel-architecture.md`. Plain-English translation lives in `docs/internal/protocol-layman.md`. Compact implementation notes live in `docs/internal/protocol-notes.md`. Planning, marketing, source studies, and historical prompts belong outside the active repo tree.

## Structural Decision

The active source tree is organized by authority boundary:

- `src/protocol` owns protocol meaning, public schema/input aggregation, foundation helpers, event records, request context, store port, transition navigation, and primitive-owned areas.
- `src/http` owns Hono/Worker transport, admission, route metadata, handlers, OpenAPI, errors, navigation, and store/kernel resolution.
- `src/runtime` owns generated-execution proposal helpers only.
- `src/adapters` owns reference gateway fixtures that mutate only after `VerifiedGatewayCheck`.
- `src/conformance` owns source-package conformance checks that prove narrow reference invariants without claiming standards compliance.
- `src/storage` owns D1, memory, KV, and store mechanics.
- `src/sdk` owns typed HTTP client ergonomics.

Tests mirror ownership under `test/architecture`, `test/protocol`, `test/http`, `test/runtime`, `test/adapters`, `test/integration`, and `test/support`.

## System Design Aesthetic Decision

Accepted: beautiful code in this repo means system design is visible in the tree before a reader opens implementation details.

Every source lane must state its use cases, constraints and assumptions, core components, and failure/scale posture. A folder is platform-ready only when its boundary answers:

- what uses this lane;
- what inputs, outputs, and authority constraints bind it;
- which components form the high-level design;
- what bottlenecks, consistency boundaries, replay paths, cache boundaries, or failure states it owns;
- what it refuses to own.

This keeps aesthetics tied to operability. A clean path that hides tradeoffs, failure behavior, or authority ownership is not beautiful enough for Handshake.

## Source Ownership Cut

Accepted: protocol behavior is owned by `src/protocol/areas/*`, with foundation, events, context, navigation, store, and public aggregation separated from area internals. First-level source lanes carry `LANE.md` manifests so ownership is visible before opening implementation files.

Rejected: flat protocol files, compatibility shims, and generic helper buckets. HTTP, SDK, runtime, storage, and adapters must import protocol behavior through curated public indexes rather than area internals.

## Hosted Admission Boundary

Accepted: HTTP admission, caller custody, OpenAPI projection, and route-scope resolution are protocol transport seams. They may model deployment-mode custody and caller roles, but they do not prove hosted operation, production org auth, provider enforcement, or customer gateway installation.

A hosted claim requires a real deployment boundary, credential custody model, customer or provider gateway check, and receipts that distinguish gateway check evidence from downstream execution evidence.

## Tooling Decision

The repo uses TypeScript, ESLint, Prettier, Bun tests, and `git diff --check` as the full local gate:

```bash
npm run check:repo
```

## Package Boundary Decision

Accepted: this checkout declares a private source-package boundary with explicit root, conformance, and experimental subpath exports.

The package remains `"private": true`; removing that guard, adding a license, and publishing are release decisions outside structural cleanup. The current package check builds declarations and runs an npm dry-run to verify the package surface includes source, generated types, and compact canon while excluding tests, planning scratch, and deleted documentation trees.

CI must run the same command through `.github/workflows/check.yml`.

## Naming Decision

Source names must describe owned protocol concepts, not buckets. The repo bans source path segments such as `utils`, `helpers`, `common`, `misc`, `stuff`, `manager`, and `service` unless `STRUCTURE.md` explicitly creates an exception.

Internal planning-stage labels must not appear in repo-facing scripts, CI names, README sections, source paths, tests, or exported symbols.
