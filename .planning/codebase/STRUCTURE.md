# Codebase Structure

**Analysis Date:** 2026-05-19

## Directory Layout

```text
[project-root]/
├── AGENTS.md                  # Handshake doctrine, invariants, and authority language
├── README.md                  # Current repo orientation, source map, and command contract
├── QUALITY.md                 # TypeScript quality, naming, and verification rules
├── STRUCTURE.md               # Canonical source/test/docs ownership map
├── package.json               # Private package boundary, exports, scripts, dependencies
├── tsconfig.json              # Strict TypeScript config for source and tests
├── tsconfig.build.json        # Declaration-only package build config
├── eslint.config.js           # ESLint rules for source and tests
├── wrangler.toml              # Cloudflare Worker, D1, and KV binding config
├── src/
│   ├── protocol/              # Protocol meaning, transitions, schemas, events, store port
│   ├── http/                  # Hono/Worker transport, admission, routes, errors, OpenAPI
│   ├── runtime/               # Generated-execution proposal helpers
│   ├── adapters/              # Reference gateway mutation fixtures
│   ├── storage/               # D1, memory, KV, and store plumbing
│   ├── sdk/                   # Typed HTTP client
│   ├── conformance/           # Reference conformance probes
│   ├── index.ts               # Curated package root
│   ├── experimental.ts        # Explicit experimental gateway surface
│   └── worker.ts              # Cloudflare Worker entrypoint
├── test/
│   ├── architecture/          # Repo shape, imports, naming, exports, vocabulary
│   ├── protocol/              # Protocol primitive and state-machine invariants
│   ├── http/                  # Transport, admission, SDK, and D1-over-HTTP behavior
│   ├── runtime/               # Runtime proposal helper behavior
│   ├── adapters/              # Reference gateway fixture behavior
│   ├── conformance/           # Conformance probe behavior
│   ├── integration/           # End-to-end protected action paths
│   └── support/               # Test fixtures, surfaces, harnesses, fault injection
├── migrations/
│   └── 0001_protocol_kernel.sql # Canonical D1 protocol storage schema
├── docs/
│   └── internal/              # Compact internal protocol canon and decisions
├── scripts/
│   └── check-package-surface.mjs # Package dry-run allow/deny surface check
├── .github/
│   └── workflows/check.yml    # CI gate bound to npm run check:repo
├── .planning/
│   └── codebase/              # Generated GSD mapper documents; scratch, not repo truth
├── dist/                      # Generated declaration build output
├── node_modules/              # Local dependency install output
└── bun.lock                   # Bun lockfile
```

## Directory Purposes

**`src/protocol`:**
- Purpose: Own all protocol meaning and authority semantics.
- Contains: `kernel.ts`, `areas/*`, `foundation/*`, `events/*`, `context/*`, `navigation/*`, `public/*`, `store/*`, `LANE.md`.
- Key files: `src/protocol/kernel.ts`, `src/protocol/store/port.ts`, `src/protocol/navigation/index.ts`, `src/protocol/public/schemas.ts`, `src/protocol/public/inputs.ts`.

**`src/protocol/areas`:**
- Purpose: House owned primitive modules.
- Contains: One directory per protocol primitive: `action-contract`, `catalog-envelope`, `gateway-gate`, `generated-execution-graph`, `intent-compilation`, `isolation-breaker`, `object-registry`, `operation-lifecycle`, `policy-greenlight`, `proof-gap`, `protected-path-posture`, `receipt-export`, `recovery`, `refusal`, `review-binding`, `runtime-evidence`.
- Key files: Each multi-file area uses `index.ts`, `schemas.ts`, `inputs.ts`, `types.ts`, and transition/guard files as needed.

**`src/protocol/foundation`:**
- Purpose: Shared deterministic protocol primitives.
- Contains: Canonicalization, content digests, IDs, errors, reason codes, base schema core, transition guard helpers.
- Key files: `src/protocol/foundation/canonical.ts`, `src/protocol/foundation/content-digests.ts`, `src/protocol/foundation/errors.ts`, `src/protocol/foundation/ids.ts`, `src/protocol/foundation/schema-core.ts`, `src/protocol/foundation/transition-guards.ts`.

**`src/protocol/events`:**
- Purpose: Record and chain transition evidence.
- Contains: Event schemas, event chain builder, protocol recorder.
- Key files: `src/protocol/events/chains.ts`, `src/protocol/events/records.ts`, `src/protocol/events/schemas.ts`.

**`src/protocol/context`:**
- Purpose: Bind transition request context into protocol records and event payloads.
- Contains: Request context schemas and builders.
- Key files: `src/protocol/context/request-contexts.ts`, `src/protocol/context/request-context-schemas.ts`.

**`src/protocol/public`:**
- Purpose: Aggregate public protocol schemas and transition inputs.
- Contains: Aggregator-only `schemas.ts` and `inputs.ts`.
- Key files: `src/protocol/public/schemas.ts`, `src/protocol/public/inputs.ts`.

**`src/protocol/store`:**
- Purpose: Define storage port and atomic commit contracts.
- Contains: `ProtocolStore`, stored record shapes, commit result types, greenlight consumption, indexes, stream tail types.
- Key files: `src/protocol/store/port.ts`, `src/protocol/store/index.ts`.

**`src/http`:**
- Purpose: Own Hono/Worker transport, caller custody, route metadata, route dispatch, OpenAPI projection, evidence reads, HTTP errors, and store/kernel resolution.
- Contains: `admission/*`, `routes/*`, `handlers/*`, `errors/*`, `openapi/*`, `navigation/*`, `store/*`, `app.ts`, `app-options.ts`, `LANE.md`.
- Key files: `src/http/app.ts`, `src/http/routes/transition-route-registry.ts`, `src/http/routes/transition-invokers.ts`, `src/http/admission/caller-auth.ts`, `src/http/admission/hosted-caller-identity.ts`.

**`src/runtime`:**
- Purpose: Convert generated execution into protocol evidence and action contract proposal calls.
- Contains: Action proposal helpers for package install, repo write, preview deploy, and codemode multi-action graphs.
- Key files: `src/runtime/package-install/action-proposal.ts`, `src/runtime/repo-write/action-proposal.ts`, `src/runtime/preview-deploy/action-proposal.ts`, `src/runtime/codemode-multi-action/generated-program-runner.ts`, `src/runtime/codemode-multi-action/generated-graph-evidence.ts`.

**`src/adapters`:**
- Purpose: Provide reference gateway fixtures that mutate only after `VerifiedGatewayCheck`.
- Contains: Gateway runners for package install, repo write, and preview deploy.
- Key files: `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, `src/adapters/preview-deploy/gateway.ts`.

**`src/storage`:**
- Purpose: Implement `ProtocolStore` and storage-side plumbing.
- Contains: `d1/*`, `memory/*`, `kv/*`, `store.ts`, `LANE.md`.
- Key files: `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `src/storage/memory/index.ts`, `src/storage/kv/index.ts`, `src/storage/store.ts`.

**`src/sdk`:**
- Purpose: Provide typed client calls over the public HTTP transition and diagnostic evidence routes.
- Contains: `HandshakeClient`, error type, options, fetch adapter types.
- Key files: `src/sdk/client.ts`, `src/sdk/LANE.md`.

**`src/conformance`:**
- Purpose: Provide narrow reference conformance checks without claiming certification.
- Contains: Protected mutation adapter probe types and assertion helpers.
- Key files: `src/conformance/index.ts`, `src/conformance/LANE.md`.

**`test`:**
- Purpose: Mirror source ownership and protect invariant behavior.
- Contains: Architecture, protocol, HTTP, runtime, adapter, integration, conformance, and support tests.
- Key files: `test/architecture/import-posture.test.ts`, `test/protocol/model-based-invariants.test.ts`, `test/protocol/kernel-policy-gateway.test.ts`, `test/integration/package-install-end-to-end.test.ts`.

**`docs/internal`:**
- Purpose: Compact internal canon for protocol definition, kernel architecture, plain-English explanation, notes, and durable decisions.
- Contains: `decisions.md`, `protocol-definition.md`, `protocol-kernel-architecture.md`, `protocol-layman.md`, `protocol-notes.md`.
- Key files: `docs/internal/protocol-definition.md`, `docs/internal/protocol-kernel-architecture.md`.

**`migrations`:**
- Purpose: Canonical D1 schema for durable protocol storage.
- Contains: `0001_protocol_kernel.sql`.
- Key files: `migrations/0001_protocol_kernel.sql`.

**`.planning/codebase`:**
- Purpose: Generated GSD codebase maps for planner/executor context.
- Contains: `STACK.md`, `INTEGRATIONS.md`, `ARCHITECTURE.md`, `STRUCTURE.md`.
- Key files: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`.

## Key File Locations

**Entry Points:**
- `src/index.ts`: Curated stable package root exports.
- `src/experimental.ts`: Experimental reference gateway fixture exports.
- `src/conformance/index.ts`: Conformance package subpath exports.
- `src/worker.ts`: Cloudflare Worker `fetch` entrypoint.
- `src/http/app.ts`: Hono app factory and route registration.
- `src/sdk/client.ts`: Typed HTTP client entrypoint.
- `src/protocol/kernel.ts`: Embedded protocol transition facade.

**Configuration:**
- `package.json`: Private package, subpath exports, scripts, dependencies, package files.
- `tsconfig.json`: Strict TypeScript config for `src`, `test`, and Worker types.
- `tsconfig.build.json`: Declaration-only build from `src` to `dist`.
- `eslint.config.js`: Type import, no unused vars, and console rules.
- `wrangler.toml`: Worker main file and Cloudflare D1/KV bindings.
- `.github/workflows/check.yml`: CI checkout, Bun setup, install, and `npm run check:repo`.
- `scripts/check-package-surface.mjs`: Dry-run package allowlist/denylist.

**Core Logic:**
- `src/protocol/kernel.ts`: Transition facade.
- `src/protocol/areas/intent-compilation/transitions.ts`: Catalog/envelope/gateway/runtime/graph lookup and candidate derivation.
- `src/protocol/areas/action-contract/transitions.ts`: Candidate proposal validation and contract commit.
- `src/protocol/areas/action-contract/contract-record.ts`: Exact contract binding and digest/signature construction.
- `src/protocol/areas/policy-greenlight/transitions.ts`: Policy evaluation, sequence dependency, isolation, protected-path posture, greenlight issuance.
- `src/protocol/areas/gateway-gate/transitions.ts`: Gateway authority check, replay refusal, operation claim, and receipt commit.
- `src/protocol/areas/operation-lifecycle/transitions.ts`: Downstream finality reconciliation, proof gaps, operation claim release, orphan isolation.
- `src/protocol/areas/recovery/recommendations.ts`: Recovery recommendation creation without reusing greenlights.
- `src/protocol/events/records.ts`: Canonical stored record construction and commit orchestration.
- `src/protocol/events/chains.ts`: Stream event partitioning, offsets, and digest chaining.

**Storage:**
- `src/protocol/store/port.ts`: Store interface and commit result contracts.
- `src/storage/memory/index.ts`: In-memory store used as test fixture and invariant oracle.
- `src/storage/d1/index.ts`: Cloudflare D1-backed `ProtocolStore`.
- `src/storage/d1/statements.ts`: D1 insert/update/delete statement assembly.
- `src/storage/kv/index.ts`: Isolation cache interface, no-op cache, and KV cache implementation.
- `migrations/0001_protocol_kernel.sql`: D1 tables and indexes.

**HTTP And SDK:**
- `src/http/routes/transition-route-registry.ts`: HTTP transition registry.
- `src/http/routes/transition-invokers.ts`: Route-to-kernel dispatch map.
- `src/http/routes/transition-response-schemas.ts`: HTTP response schema composition.
- `src/http/routes/transition-scope-resolvers.ts`: Tenant/org scope resolution for hosted admission.
- `src/http/admission/index.ts`: Local or hosted admission dispatch.
- `src/http/admission/request-context.ts`: Required protocol/request/originating identity headers and request digest.
- `src/http/errors/transition-error-envelope.ts`: HTTP error envelope classification.
- `src/http/openapi/index.ts`: OpenAPI 3.1 projection.
- `src/sdk/client.ts`: Client methods and typed error parsing.

**Runtime And Gateway Fixtures:**
- `src/runtime/package-install/action-proposal.ts`: Package install compile/propose helper.
- `src/runtime/repo-write/action-proposal.ts`: Repo write compile/propose helper and content digesting.
- `src/runtime/preview-deploy/action-proposal.ts`: Preview deploy compile/propose helper.
- `src/runtime/codemode-multi-action/generated-program-runner.ts`: Multi-action preflight, sequencing, and proposal runner.
- `src/runtime/codemode-multi-action/generated-graph-evidence.ts`: Runtime execution and generated graph evidence builder.
- `src/adapters/package-install/gateway.ts`: Package install verified-gate mutation fixture.
- `src/adapters/repo-write/gateway.ts`: Repo write verified-gate mutation fixture.
- `src/adapters/preview-deploy/gateway.ts`: Preview deploy verified-gate mutation fixture.

**Testing:**
- `test/architecture/import-posture.test.ts`: Lane manifest and import-boundary guard.
- `test/architecture/naming-posture.test.ts`: Naming, folder, canonical surface, CI command, and stale label guard.
- `test/architecture/root-exports.test.ts`: Public root, experimental, and conformance export guard.
- `test/architecture/package-surface.test.ts`: Package boundary and packable file guard.
- `test/protocol/transition-matrix.test.ts`: Protocol navigation, route, invoker, method, record, event, authority, and evidence matrix guard.
- `test/protocol/model-based-invariants.test.ts`: Model scenarios for mutation count, replay, recovery, isolation, receipt export.
- `test/protocol/kernel-policy-gateway.test.ts`: Policy, posture, greenlight, gateway, replay, stream chain invariants.
- `test/http/http.test.ts`: HTTP route and SDK behavior.
- `test/http/d1-http.test.ts`: D1-backed HTTP behavior.
- `test/integration/package-install-end-to-end.test.ts`: Runtime -> contract -> policy -> gateway -> reconciliation flow.
- `test/integration/repo-write-d1-http.test.ts`: Repo write flow through D1-backed HTTP.

**Canonical Docs:**
- `AGENTS.md`: Doctrine and invariant language.
- `README.md`: Source map, commands, and working rule.
- `QUALITY.md`: Quality bar and naming rules.
- `STRUCTURE.md`: Source/test/docs ownership rules.
- `docs/internal/decisions.md`: Durable product and architecture decisions.
- `docs/internal/protocol-definition.md`: Canonical protocol definition and authority rule.
- `docs/internal/protocol-kernel-architecture.md`: Kernel architecture and schema map.
- `docs/internal/protocol-layman.md`: Plain-English translation.
- `docs/internal/protocol-notes.md`: Implementation-facing notes.

## Naming Conventions

**Files:**
- Use kebab-case for multi-word concept files and folders: `action-contract`, `policy-greenlight`, `generated-execution-graph`, `protected-path-posture`.
- Use `index.ts` as the public face for multi-file source folders.
- Use `schemas.ts` for Zod object schemas and inferred protocol types.
- Use `inputs.ts` for transition input schemas.
- Use `types.ts` as an area-local aggregator that re-exports foundation schema core, schemas, and inputs.
- Use `transitions.ts` for transition functions that build and commit records/events.
- Use `guards.ts` for transition guard logic.
- Use `gateway.ts` for reference gateway fixture runners.
- Use `action-proposal.ts` for runtime proposal helpers.
- Use `LANE.md` for first-level source lane ownership manifests.

**Directories:**
- Split by authority boundary and owned concept, not by generic utility bucket.
- Keep protocol primitives under `src/protocol/areas/<primitive-name>`.
- Keep public protocol aggregators under `src/protocol/public`.
- Keep HTTP route metadata, invokers, response schemas, and scope resolvers under `src/http/routes`.
- Keep HTTP caller custody and request context under `src/http/admission`.
- Keep storage implementations under `src/storage/d1`, `src/storage/memory`, and `src/storage/kv`.
- Keep runtime helpers grouped by protected action or generated execution shape under `src/runtime/<action-or-runtime>`.
- Keep tests in ownership mirrors under `test/<lane>`.

**Source Shape Rules:**
- A source folder with more than three TypeScript files needs `index.ts`.
- A source folder should not exceed seven loose TypeScript files excluding `index.ts`.
- Root `test/` must not contain loose `.test.ts` files.
- First-level source lanes need `LANE.md` or `README.md` with the required manifest fields.
- Avoid source path segments `utils`, `helpers`, `common`, `misc`, `stuff`, `manager`, and `service`.

## Where to Add New Code

**New Protocol Primitive:**
- Primary code: `src/protocol/areas/<primitive-name>/`
- Required public face: `src/protocol/areas/<primitive-name>/index.ts`
- Schemas: `src/protocol/areas/<primitive-name>/schemas.ts`
- Inputs: `src/protocol/areas/<primitive-name>/inputs.ts`
- Local type face: `src/protocol/areas/<primitive-name>/types.ts`
- Transition behavior: `src/protocol/areas/<primitive-name>/transitions.ts`
- Guards: `src/protocol/areas/<primitive-name>/guards.ts`
- Public aggregation: `src/protocol/public/schemas.ts`, `src/protocol/public/inputs.ts`
- Object metadata: `src/protocol/areas/object-registry/index.ts`, `src/protocol/areas/object-registry/schemas.ts`
- Navigation: `src/protocol/navigation/index.ts`
- Kernel method: `src/protocol/kernel.ts`
- Tests: `test/protocol/*`, `test/architecture/import-posture.test.ts`, `test/protocol/transition-matrix.test.ts`

**New HTTP Transition:**
- Route metadata: `src/http/routes/transition-route-registry.ts`
- Dispatcher: `src/http/routes/transition-invokers.ts`
- Response schema: `src/http/routes/transition-response-schemas.ts`
- Scope resolver if needed: `src/http/routes/transition-scope-resolvers.ts`
- OpenAPI updates: usually automatic through registry schema usage in `src/http/openapi/index.ts`
- SDK method: `src/sdk/client.ts`
- Tests: `test/http/http.test.ts`, `test/protocol/transition-matrix.test.ts`

**New Evidence Read Route:**
- Route metadata: `src/http/routes/evidence-read-route-registry.ts`
- Handler logic: `src/http/handlers/evidence-read.ts`
- Navigation: `src/http/navigation/index.ts`
- SDK method: `src/sdk/client.ts`
- Tests: `test/http/http.test.ts`

**New Runtime Proposal Helper:**
- Implementation: `src/runtime/<action-or-runtime>/action-proposal.ts`
- Generated graph helper if needed: `src/runtime/<runtime-shape>/generated-graph-evidence.ts`
- Tests: `test/runtime/*`
- Keep authority out: call `compileIntent` and `proposeActionContract`; do not evaluate policy, issue greenlights, gateway check, receipt, or mutate.

**New Reference Gateway Fixture:**
- Implementation: `src/adapters/<action-class>/gateway.ts`
- Experimental export: `src/experimental.ts`
- Conformance usage: `test/conformance/protected-mutation-adapter-conformance.test.ts`
- Tests: `test/adapters/*`, `test/integration/*`
- Required pattern: call `protocol.gatewayCheck`, derive `VerifiedGatewayCheck`, mutate only after verified gate, then call `protocol.reconcileSurfaceOperation`.

**New Storage Behavior:**
- Port contract: `src/protocol/store/port.ts`
- Memory implementation: `src/storage/memory/index.ts`
- D1 behavior: `src/storage/d1/index.ts`
- D1 statement assembly: `src/storage/d1/statements.ts`
- Schema migration: `migrations/0001_protocol_kernel.sql` or a new sequential migration if schema changes are additive.
- Tests: `test/protocol/*`, `test/http/d1-http.test.ts`, `test/support/fault-injecting-protocol-store.ts`

**New SDK Method:**
- Implementation: `src/sdk/client.ts`
- Source of truth: existing HTTP route path and role in `src/http/routes/transition-route-registry.ts` or `src/http/routes/evidence-read-route-registry.ts`
- Tests: `test/http/http.test.ts`
- Rule: The SDK sends requests and parses responses; it must not infer authority or mutate protected surfaces.

**New Conformance Probe:**
- Implementation: `src/conformance/index.ts`
- Tests: `test/conformance/*`
- Export surface: `package.json` `./conformance` subpath and `test/architecture/root-exports.test.ts`

**New Architecture Guard:**
- Implementation: `test/architecture/<guard-name>.test.ts`
- Command group: add to `package.json` `quality:architecture` when it protects repo shape.
- Keep root test files out of `test/`.

**New Canonical Documentation:**
- Durable product/architecture decision: `docs/internal/decisions.md`
- Protocol definition change: `docs/internal/protocol-definition.md`
- Schema/architecture map change: `docs/internal/protocol-kernel-architecture.md`
- Implementation note: `docs/internal/protocol-notes.md`
- Do not add public product, GTM, planning taxonomy, or historical prompt docs to active repo canon.

## Special Directories

**`src/*/LANE.md`:**
- Purpose: Lane-local ownership contract.
- Generated: No.
- Committed: Yes.

**`docs/internal`:**
- Purpose: Compact canonical docs for active repo truth.
- Generated: No.
- Committed: Yes.

**`.planning`:**
- Purpose: GSD scratch planning and generated codebase maps.
- Generated: Yes.
- Committed: Scratch status depends on workflow; not active repo truth.

**`dist`:**
- Purpose: Declaration build output for package surface checks.
- Generated: Yes, by `npm run build`.
- Committed: Present in the checkout and included by `package.json` `files`.

**`migrations`:**
- Purpose: D1 storage schema ownership.
- Generated: No.
- Committed: Yes.

**`.github/workflows`:**
- Purpose: CI gate definition.
- Generated: No.
- Committed: Yes.

**`node_modules`:**
- Purpose: Local dependency installation output.
- Generated: Yes.
- Committed: No.

**`test/support`:**
- Purpose: Fixtures, fake protected surfaces, D1 harnesses, and fault-injecting store used by tests.
- Generated: No.
- Committed: Yes.

---

*Structure analysis: 2026-05-19*
