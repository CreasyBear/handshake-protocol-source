# Codebase Structure

**Analysis Date:** 2026-05-20
**Current HEAD:** `88e6f16`
**Evidence Source:** current working tree source, tests, and tracked canon. `.planning/` is scratch.

## Directory Layout

```text
[project-root]/
|-- AGENTS.md                 # Doctrine, invariants, and authority-boundary rules
|-- README.md                 # Current repo orientation, source map, and commands
|-- QUALITY.md                # TypeScript quality, naming, and verification bar
|-- STRUCTURE.md              # Source/test/docs ownership map
|-- package.json              # Private source package, exports, scripts, Bun version
|-- bun.lock                  # Bun dependency lockfile
|-- wrangler.toml             # Cloudflare Worker/D1/KV binding config
|-- migrations/
|   `-- 0001_protocol_kernel.sql
|-- docs/
|   `-- internal/             # Compact canonical docs
|-- scripts/
|   `-- check-package-surface.mjs
|-- src/
|   |-- protocol/             # Protocol primitives, kernel, records, navigation, store port
|   |-- http/                 # Hono/Worker transport, admission, routes, handlers, OpenAPI
|   |-- runtime/              # Generated-execution and runtime-ingress proposal helpers
|   |-- adapters/             # Reference gateway fixtures and x402 proof profile
|   |-- install/              # Generic protected-action install proposal contracts
|   |-- conformance/          # Narrow conformance checks
|   |-- storage/              # D1, memory, KV, store plumbing
|   |-- sdk/                  # Typed HTTP client
|   |-- index.ts              # Curated stable package root
|   |-- experimental.ts       # Explicit experimental gateway surface
|   `-- worker.ts             # Cloudflare Worker entrypoint
|-- test/
|   |-- architecture/         # Import, export, naming, claim, and package-boundary guards
|   |-- protocol/             # Primitive and state-machine invariant tests
|   |-- runtime/              # Runtime ingress and generated execution tests
|   |-- adapters/             # Reference gateway fixture tests
|   |-- conformance/          # Conformance surface tests
|   |-- http/                 # HTTP and D1-over-HTTP tests
|   |-- integration/          # End-to-end protected action paths
|   |-- install/              # Install compiler tests when present
|   `-- support/              # Fixtures and harnesses
|-- dist/                     # Generated declarations/build output
|-- .github/
|   `-- workflows/check.yml   # CI bound to `npm run check:repo`
`-- .planning/                # Scratch planning artifacts, not repo truth
```

## Directory Purposes

**`src/protocol/`:**
- Purpose: Own protocol meaning, transitions, object schemas, event evidence, navigation metadata, public schema/input aggregation, and store port.
- Contains: `kernel.ts`, `areas/*`, `foundation/*`, `events/*`, `context/*`, `navigation/*`, `evidence-projections/*`, `public/*`, `store/*`, `LANE.md`.
- Key files: `src/protocol/kernel.ts`, `src/protocol/public/schemas.ts`, `src/protocol/public/inputs.ts`, `src/protocol/areas/object-registry/index.ts`, `src/protocol/store/port.ts`.

**`src/protocol/areas/`:**
- Purpose: Area-owned protocol primitives and state transitions.
- Contains: `action-contract`, `action-attempt-lifecycle`, `authority-certificate`, `bypass-probe`, `catalog-envelope`, `gateway-gate`, `generated-execution-graph`, `idempotency-ledger`, `intent-compilation`, `isolation-breaker`, `object-registry`, `operation-lifecycle`, `policy-greenlight`, `proof-gap`, `protected-action-representation`, `protected-path-posture`, `receipt-export`, `recovery`, `refusal`, `review-binding`, `runtime-evidence`, `tool-call-draft`.
- Key files: `src/protocol/areas/index.ts`, `src/protocol/areas/authority-certificate/index.ts`, `src/protocol/areas/gateway-gate/transitions.ts`, `src/protocol/areas/policy-greenlight/transitions.ts`.

**`src/protocol/areas/authority-certificate/`:**
- Purpose: Terminal signed evidence and offline pinned-key verification.
- Contains: `schemas.ts`, `inputs.ts`, `signing.ts`, `verify.ts`, `transitions.ts`, `types.ts`, `index.ts`.
- Key files: `src/protocol/areas/authority-certificate/transitions.ts`, `src/protocol/areas/authority-certificate/verify.ts`, `test/protocol/authority-certificate.test.ts`.

**`src/protocol/areas/object-registry/`:**
- Purpose: Source-owned protocol object metadata.
- Contains: protocol object type schema, discriminated record schema, registry entries, ID selectors, export posture, raw-read posture, isolation scope helpers.
- Key files: `src/protocol/areas/object-registry/index.ts`, `src/protocol/areas/object-registry/schemas.ts`, `test/protocol/object-registry.test.ts`.

**`src/protocol/public/`:**
- Purpose: Public schema/input/transition aggregation.
- Contains: `schemas.ts`, `inputs.ts`, `transitions.ts`, `index.ts`.
- Key files: `src/protocol/public/schemas.ts`, `src/protocol/public/inputs.ts`.

**`src/http/`:**
- Purpose: Hono/Worker transport, caller custody, hosted admission seam, route metadata, dispatch, evidence reads, OpenAPI, errors, and store resolution.
- Contains: `app.ts`, `app-options.ts`, `admission/*`, `routes/*`, `handlers/*`, `errors/*`, `openapi/*`, `navigation/*`, `store/*`, `LANE.md`.
- Key files: `src/http/app.ts`, `src/http/routes/transition-route-registry.ts`, `src/http/routes/transition-invokers.ts`, `src/http/handlers/evidence-read.ts`, `src/http/handlers/internal-record-read.ts`.

**`src/runtime/`:**
- Purpose: Generated-execution observer/compiler proposal helpers.
- Contains: `ingress/index.ts`, `package-install/action-proposal.ts`, `preview-deploy/action-proposal.ts`, `repo-write/action-proposal.ts`, `codemode-multi-action/*`, `index.ts`, `LANE.md`.
- Key files: `src/runtime/ingress/index.ts`, `src/runtime/index.ts`, `test/runtime/runtime-ingress.test.ts`.

**`src/adapters/`:**
- Purpose: Reference gateway fixtures and adapter proof profiles.
- Contains: `package-install/gateway.ts`, `repo-write/gateway.ts`, `preview-deploy/gateway.ts`, `x402-payment/*`, `protected-path-probes/*`, `downstream-failure-evidence.ts`, `LANE.md`.
- Key files: `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/protected-path-probes/index.ts`.

**`src/install/`:**
- Purpose: Generic install proposal and protected-action adapter-pack contracts.
- Contains: `install-proposal/index.ts`, `protected-action-adapter-pack/index.ts`, `index.ts`, `LANE.md`.
- Key files: `src/install/install-proposal/index.ts`, `src/install/protected-action-adapter-pack/index.ts`.

**`src/conformance/`:**
- Purpose: Narrow checks for adapter posture and reference invariants.
- Contains: `index.ts`, `x402-payment/*` through adapter re-export, `LANE.md`.
- Key files: `src/conformance/index.ts`, `src/adapters/x402-payment/conformance.ts`.

**`src/storage/`:**
- Purpose: Store mechanics for records, stream events, current indexes, D1, memory, and KV.
- Contains: `d1/index.ts`, `d1/statements.ts`, `memory/index.ts`, `kv/index.ts`, `store.ts`, `LANE.md`.
- Key files: `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `src/storage/memory/index.ts`.

**`src/sdk/`:**
- Purpose: Typed client calls over public HTTP routes.
- Contains: `client.ts`, `LANE.md`.
- Key files: `src/sdk/client.ts`.

**`test/architecture/`:**
- Purpose: Enforce repo shape, import posture, package boundary, public exports, vocabulary, and claim boundaries.
- Contains: `import-posture.test.ts`, `root-exports.test.ts`, `package-surface.test.ts`, `claim-boundary.test.ts`, `naming-posture.test.ts`, `active-vocabulary.test.ts`.
- Key files: `test/architecture/claim-boundary.test.ts`, `test/architecture/root-exports.test.ts`, `test/architecture/import-posture.test.ts`.

**`migrations/`:**
- Purpose: Canonical D1 schema for reference durable protocol storage.
- Contains: `0001_protocol_kernel.sql`.
- Key files: `migrations/0001_protocol_kernel.sql`.

**`docs/internal/`:**
- Purpose: Compact canonical protocol and architecture documentation.
- Contains: `decisions.md`, `protocol-definition.md`, `protocol-kernel-architecture.md`, `protocol-layman.md`, `protocol-notes.md`.
- Key files: `docs/internal/protocol-definition.md`, `docs/internal/protocol-kernel-architecture.md`.

**`.planning/`:**
- Purpose: Scratch planning, codebase maps, and strategy notes.
- Contains: planner artifacts and generated maps.
- Key files: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`.

## Key File Locations

**Entry Points:**
- `src/index.ts`: Stable root package exports.
- `src/runtime/index.ts`: Runtime observer/compiler subpath.
- `src/conformance/index.ts`: Conformance subpath.
- `src/experimental.ts`: Experimental reference gateway subpath.
- `src/worker.ts`: Cloudflare Worker entrypoint.
- `src/http/app.ts`: Hono app and HTTP route registration.

**Configuration:**
- `package.json`: Package exports, scripts, private flag, dependency surface.
- `tsconfig.json`: TypeScript project config.
- `tsconfig.build.json`: Declaration build config.
- `eslint.config.js`: ESLint config.
- `.prettierrc.json`: Prettier config.
- `wrangler.toml`: Worker and binding config.
- `.github/workflows/check.yml`: CI command contract.

**Core Logic:**
- `src/protocol/kernel.ts`: Protocol transition facade.
- `src/protocol/areas/action-contract/transitions.ts`: Action contract proposal.
- `src/protocol/areas/intent-compilation/transitions.ts`: Candidate compilation and refusal boundary.
- `src/protocol/areas/policy-greenlight/transitions.ts`: Policy, idempotency, and greenlight issuance.
- `src/protocol/areas/gateway-gate/transitions.ts`: Gateway check and receipt/proof-gap commit.
- `src/protocol/areas/authority-certificate/transitions.ts`: AuthorityCertificate minting.
- `src/protocol/areas/authority-certificate/verify.ts`: Offline AuthorityCertificate verification.
- `src/protocol/areas/object-registry/index.ts`: Object metadata registry.
- `src/runtime/ingress/index.ts`: Runtime dispatch proposal path.
- `src/adapters/x402-payment/wallet-gateway.ts`: x402 wallet gateway fixture.

**HTTP And Storage:**
- `src/http/routes/transition-route-registry.ts`: Public transition route metadata.
- `src/http/routes/transition-invokers.ts`: HTTP route to kernel method dispatch.
- `src/http/admission/caller-auth.ts`: Role-scoped bearer custody.
- `src/http/admission/hosted-caller-identity.ts`: Hosted identity admission seam.
- `src/http/handlers/evidence-read.ts`: Redacted projection reads.
- `src/http/handlers/internal-record-read.ts`: Raw record reads with object-registry posture checks.
- `src/http/store/resolution.ts`: D1 or injected store resolution.
- `src/protocol/store/port.ts`: Store interface and atomic commit contracts.
- `src/storage/d1/index.ts`: D1 store implementation.
- `src/storage/memory/index.ts`: In-memory store implementation.
- `migrations/0001_protocol_kernel.sql`: D1 schema.

**Testing:**
- `test/protocol/authority-certificate.test.ts`: AuthorityCertificate mint/verify/tamper/refusal/proof-gap/replay tests.
- `test/runtime/runtime-ingress.test.ts`: Runtime ingress proposal/refusal and x402/package-install dispatch tests.
- `test/protocol/object-registry.test.ts`: Object registry coverage and posture tests.
- `test/architecture/claim-boundary.test.ts`: Public surface and local-claim boundary guard.
- `test/architecture/root-exports.test.ts`: Root/runtime/conformance/experimental export curation.
- `test/http/d1-http.test.ts`: D1 HTTP behavior.
- `test/integration/x402-d1-http.test.ts`: x402 D1/HTTP protected path.

## Naming Conventions

**Files:**
- Use owned protocol nouns: `action-contract`, `policy-greenlight`, `gateway-gate`, `authority-certificate`, `object-registry`.
- Area folders use kebab-case under `src/protocol/areas/*`.
- Multi-file source folders provide an `index.ts` public face.
- Avoid generic path segments such as `utils`, `helpers`, `common`, `misc`, `stuff`, `manager`, and `service`.
- Reference gateway files live under adapter-specific folders, for example `src/adapters/x402-payment/wallet-gateway.ts`.

**Directories:**
- Split by authority boundary, not by generic layer buckets.
- First-level `src/*` directories carry `LANE.md`.
- Protocol primitives go under `src/protocol/areas/<primitive>/`.
- Public protocol aggregators go under `src/protocol/public/`.
- HTTP route metadata and dispatch go under `src/http/routes/`.
- Storage implementations go under `src/storage/d1`, `src/storage/memory`, and `src/storage/kv`.

**Tests:**
- Place architecture guards under `test/architecture/`.
- Place protocol primitive tests under `test/protocol/`.
- Place runtime proposal tests under `test/runtime/`.
- Place adapter fixture tests under `test/adapters/`.
- Place D1/HTTP and protected action cross-lane tests under `test/http/` or `test/integration/`.

## Where to Add New Code

**New Protocol Primitive:**
- Primary code: `src/protocol/areas/<primitive>/`
- Required files: `schemas.ts`, `inputs.ts` when external input exists, `types.ts`, `transitions.ts` when it writes records, `index.ts`
- Registry: update `src/protocol/areas/object-registry/schemas.ts` and `src/protocol/areas/object-registry/index.ts`
- Public schemas/inputs: update `src/protocol/public/schemas.ts` and `src/protocol/public/inputs.ts` only as aggregators
- Kernel transition: update `src/protocol/kernel.ts` and `src/protocol/navigation/index.ts`
- Tests: `test/protocol/<primitive>.test.ts`, plus `test/protocol/object-registry.test.ts` and `test/protocol/protocol-navigation.test.ts` as needed

**New Kernel Transition Exposed Over HTTP:**
- Protocol transition: `src/protocol/areas/<primitive>/transitions.ts`
- Kernel facade: `src/protocol/kernel.ts`
- Route metadata: `src/http/routes/transition-route-registry.ts`
- Invoker: `src/http/routes/transition-invokers.ts`
- Response schema: `src/http/routes/transition-response-schemas.ts` when response is not the raw record schema
- Navigation: `src/protocol/navigation/index.ts` and `src/http/navigation/index.ts`
- Tests: `test/http/http.test.ts`, `test/protocol/protocol-navigation.test.ts`, and relevant protocol test

**New Kernel-Only Evidence Transition:**
- Primary code: `src/protocol/areas/<primitive>/`
- Kernel and navigation: `src/protocol/kernel.ts`, `src/protocol/navigation/index.ts`
- Do not add HTTP route unless the transition is intentionally transport-exposed.
- Tests: `test/protocol/protocol-navigation.test.ts` should prove HTTP omission when it remains kernel-only, as it does for generated graphs and AuthorityCertificate.

**New Runtime Dispatch Family:**
- Runtime ingress branch: `src/runtime/ingress/index.ts`
- Family proposal builder: `src/runtime/<family>/action-proposal.ts` if runtime-owned, or `src/adapters/<family>/action-proposal.ts` if adapter-owned
- Public runtime export: update `src/runtime/index.ts` only if the family remains observer/compiler evidence
- Tests: `test/runtime/runtime-ingress.test.ts` and a focused `test/runtime/<family>-runtime.test.ts`
- Guardrail: do not export policy, greenlight, gateway, mutation, receipt, or certificate creation from `src/runtime/index.ts`

**New Reference Gateway Adapter:**
- Primary code: `src/adapters/<action-family>/`
- Gateway runner: `src/adapters/<action-family>/gateway.ts` or equivalent action-specific gateway file
- Install proposal: `src/adapters/<action-family>/install-proposal.ts` if the path has install-time catalog/envelope records
- Runtime proposal helper: `src/adapters/<action-family>/action-proposal.ts` when action-specific evidence compiles into candidates
- Experimental exports: `src/experimental.ts`
- Conformance: `src/adapters/<action-family>/conformance.ts` and optionally `src/conformance/index.ts`
- Tests: `test/adapters/<action-family>.test.ts`, `test/conformance/<action-family>-conformance.test.ts`, and integration tests when HTTP/D1 is involved

**New Install Compiler Shape:**
- Generic contract: `src/install/install-proposal/index.ts`
- Adapter-pack schema: `src/install/protected-action-adapter-pack/index.ts`
- Adapter-specific compiler: `src/adapters/<action-family>/install-proposal.ts`
- Tests: `test/adapters/<action-family>-install-proposal.test.ts` or `test/install/<feature>.test.ts`

**New Redacted Evidence Projection:**
- Projection schema/logic: `src/protocol/evidence-projections/schemas.ts` and `src/protocol/evidence-projections/projections.ts`
- HTTP route metadata: `src/http/routes/evidence-read-route-registry.ts`
- Handler branch: `src/http/handlers/evidence-read.ts`
- SDK method: `src/sdk/client.ts` if public client ergonomics are needed
- Tests: `test/protocol/evidence-projections.test.ts`, `test/http/http.test.ts`

**New Storage Index:**
- Store port type/method: `src/protocol/store/port.ts`
- Memory implementation: `src/storage/memory/index.ts`
- D1 implementation: `src/storage/d1/index.ts`
- SQL statements: `src/storage/d1/statements.ts`
- Migration: `migrations/0001_protocol_kernel.sql` or a new migration file if schema migration policy changes
- Tests: `test/protocol/protocol-store-atomicity-contract.test.ts`, `test/http/d1-http.test.ts`, focused protocol tests

**New Public Root Export:**
- Add export only in `src/index.ts`.
- Update `test/architecture/root-exports.test.ts`.
- Do not export stores, `HandshakeKernel`, `ProtocolRecorder`, or reference gateways from the root.
- Keep experimental gateway exports in `src/experimental.ts`, runtime observer exports in `src/runtime/index.ts`, and conformance exports in `src/conformance/index.ts`.

## Special Directories

**`.planning/`:**
- Purpose: Scratch planning artifacts and generated maps.
- Generated: Yes.
- Committed: Project-dependent; not repo truth.

**`dist/`:**
- Purpose: Generated TypeScript declarations/build output for package dry-run checks.
- Generated: Yes.
- Committed: Present in current checkout.

**`node_modules/`:**
- Purpose: Installed dependencies.
- Generated: Yes.
- Committed: No.

**`.gstack/`:**
- Purpose: Local tool/runtime artifacts.
- Generated: Yes.
- Committed: No active repo truth; present as untracked local state.

**`docs/internal/`:**
- Purpose: Compact canonical internal docs.
- Generated: No.
- Committed: Yes.

**`migrations/`:**
- Purpose: D1 durable storage schema.
- Generated: No.
- Committed: Yes.

**`src/*/LANE.md`:**
- Purpose: Source-lane ownership manifest with allowed imports, forbidden imports, proof claim, public surface, and extraction trigger.
- Generated: No.
- Committed: Yes.

---

*Structure analysis: 2026-05-20*
