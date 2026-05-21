# Codebase Structure

**Analysis Date:** 2026-05-21

## Directory Layout

```text
Handshake v0.0.2/
|-- AGENTS.md                 # Doctrine, invariants, and authority language
|-- README.md                 # Current repo orientation and commands
|-- QUALITY.md                # TypeScript quality and naming rules
|-- STRUCTURE.md              # Canonical source/test/docs ownership map
|-- docs/internal/            # Compact canonical internal protocol docs
|-- migrations/               # Canonical D1 protocol storage schema
|-- scripts/                  # Package/check tooling
|-- src/
|   |-- protocol/             # Tier 1 protocol meaning and kernel primitives
|   |-- install/              # Install proposal and adapter-pack contracts
|   |-- runtime/              # Tier 2 runtime proposal/evidence helpers
|   |-- http/                 # Hono/Worker transport, admission, routes, reads
|   |-- sdk/                  # Typed HTTP client
|   |-- adapters/             # Reference gateway and adapter proof lanes
|   |-- conformance/          # Narrow reference conformance checks
|   |-- storage/              # D1, memory, KV, and ProtocolStore mechanics
|   |-- index.ts              # Curated stable root package surface
|   |-- experimental.ts       # Explicit reference gateway fixture exports
|   `-- worker.ts             # Cloudflare Worker entrypoint
|-- test/
|   |-- architecture/         # Repo shape, imports, exports, vocabulary guards
|   |-- protocol/             # Protocol primitive and invariant tests
|   |-- runtime/              # Runtime ingress/proposal helper tests
|   |-- adapters/             # Reference gateway and adapter tests
|   |-- conformance/          # Public conformance surface tests
|   |-- http/                 # HTTP and D1-over-HTTP tests
|   |-- integration/          # End-to-end protected action paths
|   |-- product/              # Product-proof slices over multiple lanes
|   `-- support/              # Test harnesses and fixture builders
|-- .planning/                # Scratch planning and codebase maps
|-- dist/                     # Generated build output
|-- package.json              # Private package exports and command contract
|-- wrangler.toml             # Worker binding and deployment config
`-- bun.lock                  # Bun dependency lockfile
```

## Tiered Directory Boundaries

| Tier | Put code here | Current paths | Structural rule |
| ---- | ------------- | ------------- | --------------- |
| Tier 1 protocol/kernel foundation | Protocol primitives, authority chain, source-owned transition metadata, stores, HTTP diagnostic reads, terminal certificate objects, local proof-profile regression evidence. | `src/protocol/*`, `src/storage/*`, `src/http/routes/evidence-read-route-registry.ts`, `src/http/handlers/evidence-read.ts`, `src/http/handlers/internal-record-read.ts`, `migrations/0001_protocol_kernel.sql`, `test/protocol/*`, `test/product/agent-proof-slice.test.ts` | Keep authority semantics in `src/protocol/areas/*`; keep D1/memory mechanics in `src/storage/*`; evidence reads are diagnostic only and must use projection schemas. |
| Tier 2 app activation | Runtime ingress, public/local proposal helpers, representation contracts, first protected-action walkthrough scaffolding, SDK/CLI/MCP proposal/evidence surfaces with no authority. | `src/runtime/*`, `src/protocol/areas/protected-action-representation/*`, `src/sdk/client.ts`, `src/install/*`, `.planning/tier2/06-policy-agent-management-interface-map.md` | These surfaces may describe, propose, challenge, and project. They must not issue policy decisions, greenlights, gateway checks, receipts, or mutations. |
| Tier 3 hosted operation | Org/project RBAC, policy management, hosted retention/search/alerts/audit/export/read models, managed gateway registry, exposure counters. | Current seams: `src/http/admission/hosted-caller-identity.ts`, `src/http/admission/index.ts`, scoped handlers in `src/http/handlers/*`; planning map in `.planning/tier2/06-policy-agent-management-interface-map.md` | Hosted product objects stay outside `src/protocol/areas/*`. Hosted operation is not gateway enforcement unless the hosted gateway owns credentials. |
| Tier 4 ecosystem/interoperability | External trust roots, cross-org verification, provider/customer gateway custody, conformance/certification/market consumers. | Local primitives: `src/protocol/areas/authority-certificate/*`, `src/conformance/*`; planning maps in `.planning/tier2/07-agentic-economy-clearing-house-research.md` and `.planning/tier2/08-external-adapter-plug-in-architecture.md` | External consumers verify or enrich terminal evidence. Do not add Tier 4 identity, marketplace, reputation, or certification objects to Tier 1 primitives. |

## Directory Purposes

**`src/protocol/`:**

- Purpose: Own protocol meaning, transition invariants, public schema/input aggregation, event records, request context, navigation metadata, store port, and redacted projections.
- Contains: `kernel.ts`, `areas/*`, `foundation/*`, `events/*`, `context/*`, `navigation/*`, `public/*`, `evidence-projections/*`, `store/*`, `LANE.md`.
- Key files: `src/protocol/kernel.ts`, `src/protocol/public/schemas.ts`, `src/protocol/public/inputs.ts`, `src/protocol/navigation/index.ts`, `src/protocol/store/port.ts`, `src/protocol/evidence-projections/projections.ts`.

**`src/protocol/areas/`:**

- Purpose: Own primitive-specific source modules.
- Contains: One folder per primitive, usually with `index.ts`, `types.ts`, `schemas.ts`, `inputs.ts`, and transition/guard/projection files as needed.
- Key files: `src/protocol/areas/action-contract/*`, `src/protocol/areas/policy-greenlight/*`, `src/protocol/areas/gateway-gate/*`, `src/protocol/areas/authority-certificate/*`, `src/protocol/areas/protected-action-representation/*`, `src/protocol/areas/action-attempt-lifecycle/*`.

**`src/protocol/foundation/`:**

- Purpose: Shared protocol foundations that are not business logic buckets.
- Contains: Canonicalization, digest helpers, IDs, base schemas, errors, reason codes, and transition guards.
- Key files: `src/protocol/foundation/canonical.ts`, `src/protocol/foundation/schema-core.ts`, `src/protocol/foundation/errors.ts`, `src/protocol/foundation/reason-codes.ts`.

**`src/protocol/events/`:**

- Purpose: Append-only event chain and protocol record commit helpers.
- Contains: Event schemas, chain descriptor builders, and `ProtocolRecorder`.
- Key files: `src/protocol/events/schemas.ts`, `src/protocol/events/chains.ts`, `src/protocol/events/records.ts`.

**`src/protocol/evidence-projections/`:**

- Purpose: Redacted diagnostic projections derived from existing protocol records.
- Contains: Projection functions and strict output schemas.
- Key files: `src/protocol/evidence-projections/projections.ts`, `src/protocol/evidence-projections/schemas.ts`.

**`src/http/`:**

- Purpose: Own Hono/Worker transport, caller custody, hosted admission seam, request context construction, route metadata, handlers, OpenAPI, error envelopes, and store/kernel resolution.
- Contains: `app.ts`, `app-options.ts`, `admission/*`, `routes/*`, `handlers/*`, `errors/*`, `openapi/*`, `navigation/*`, `store/*`, `LANE.md`.
- Key files: `src/http/app.ts`, `src/http/routes/transition-route-registry.ts`, `src/http/routes/transition-invokers.ts`, `src/http/routes/evidence-read-route-registry.ts`, `src/http/handlers/evidence-read.ts`, `src/http/admission/caller-auth.ts`, `src/http/admission/hosted-caller-identity.ts`.

**`src/runtime/`:**

- Purpose: Own generated-execution proposal helpers and runtime ingress evidence.
- Contains: `ingress/index.ts`, action proposal helpers for package install, repo write, preview deploy, codemode multi-action fixtures, `LANE.md`.
- Key files: `src/runtime/ingress/index.ts`, `src/runtime/package-install/action-proposal.ts`, `src/runtime/repo-write/action-proposal.ts`, `src/runtime/preview-deploy/action-proposal.ts`, `src/runtime/codemode-multi-action/generated-program-runner.ts`.

**`src/install/`:**

- Purpose: Own install proposal and protected-action adapter-pack contracts.
- Contains: Generic install compiler schemas and adapter-pack schema.
- Key files: `src/install/install-proposal/index.ts`, `src/install/protected-action-adapter-pack/index.ts`, `src/install/LANE.md`.

**`src/adapters/`:**

- Purpose: Own reference gateway fixtures, adapter-local install/proposal/conformance code, and protected-path probes.
- Contains: Package-install, repo-write, preview-deploy, x402 payment, and protected-path probe modules.
- Key files: `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, `src/adapters/preview-deploy/gateway.ts`, `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/bypass-probes.ts`, `src/adapters/x402-payment/conformance.ts`.

**`src/storage/`:**

- Purpose: Own store mechanics, D1 persistence, in-memory fixtures, KV cache plumbing, and storage conflict behavior.
- Contains: `store.ts`, `memory/index.ts`, `d1/index.ts`, `d1/statements.ts`, `kv/index.ts`, `LANE.md`.
- Key files: `src/storage/memory/index.ts`, `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `src/storage/store.ts`.

**`src/sdk/`:**

- Purpose: Own typed HTTP client ergonomics.
- Contains: `HandshakeClient`, role-scoped transition token routing, typed success/error parsing, and redacted evidence read methods.
- Key files: `src/sdk/client.ts`, `src/sdk/LANE.md`.

**`src/conformance/`:**

- Purpose: Own narrow reference conformance checks.
- Contains: Public conformance entrypoint and x402 conformance subpath.
- Key files: `src/conformance/index.ts`, `src/conformance/LANE.md`, `src/adapters/x402-payment/conformance.ts`.

**`docs/internal/`:**

- Purpose: Store compact canonical internal docs.
- Contains: Protocol definition, kernel architecture/schema map, layman explanation, protocol notes, and decisions.
- Key files: `docs/internal/decisions.md`, `docs/internal/protocol-definition.md`, `docs/internal/protocol-kernel-architecture.md`, `docs/internal/protocol-layman.md`, `docs/internal/protocol-notes.md`.

**`test/`:**

- Purpose: Mirror source ownership and verify invariants, transport, runtime, adapters, conformance, product proof slices, and fixture support.
- Contains: `architecture`, `protocol`, `runtime`, `adapters`, `conformance`, `http`, `integration`, `product`, `support`.
- Key files: `test/architecture/import-posture.test.ts`, `test/architecture/root-exports.test.ts`, `test/protocol/representation-contract.test.ts`, `test/product/agent-proof-slice.test.ts`.

## Key File Locations

**Entry Points:**

- `src/index.ts`: Curated package root for stable public schemas, inputs, HTTP app/client, navigation, error, certificate, and gateway verification helpers.
- `src/runtime/index.ts`: Runtime ingress subpath for local dispatch-boundary proposal helpers.
- `src/conformance/index.ts`: Conformance subpath for narrow adapter/protocol checks.
- `src/experimental.ts`: Experimental reference gateway subpath.
- `src/worker.ts`: Cloudflare Worker entrypoint.
- `src/http/app.ts`: Hono app construction and route mounting.
- `src/protocol/kernel.ts`: Kernel transition facade.

**Configuration:**

- `package.json`: Private package exports and command contract.
- `tsconfig.json`: TypeScript project config for source/tests.
- `tsconfig.build.json`: Declaration build config.
- `eslint.config.js`: ESLint config.
- `.prettierrc.json`: Prettier config.
- `wrangler.toml`: Worker binding/deployment config.
- `migrations/0001_protocol_kernel.sql`: D1 schema for protocol records and indexes.
- `.github/workflows/check.yml`: CI gate for `npm run check:repo`.

**Core Logic:**

- `src/protocol/areas/catalog-envelope/*`: Tool capability, action type, gateway registry entry, and operating envelope records.
- `src/protocol/areas/runtime-evidence/*`: Runtime execution evidence.
- `src/protocol/areas/generated-execution-graph/*`: Generated-code/spec graph evidence and coverage.
- `src/protocol/areas/tool-call-draft/*`: Generated tool-call input state.
- `src/protocol/areas/intent-compilation/*`: Candidate action boundary, assumptions, uncertainty, and compiler refusal.
- `src/protocol/areas/action-contract/*`: Exact action contract canonicalization.
- `src/protocol/areas/policy-greenlight/*`: Policy decision, idempotency reservation, refusal, and one-use greenlight.
- `src/protocol/areas/gateway-gate/*`: Gateway pre-mutation verification, replay refusal, receipts, and proof gaps.
- `src/protocol/areas/authority-certificate/*`: Terminal signed evidence and offline pinned-key verification.
- `src/protocol/areas/protected-action-representation/*`: Internal Tier 2 representation shapes.
- `src/runtime/ingress/index.ts`: Runtime dispatch block normalization and proposal flow.
- `src/adapters/x402-payment/*`: x402 local proof profile.

**Testing:**

- `test/architecture/import-posture.test.ts`: Enforces lane manifests and import boundaries.
- `test/architecture/root-exports.test.ts`: Enforces curated package exports.
- `test/protocol/authority-certificate.test.ts`: Tests terminal certificate mint/verify.
- `test/protocol/evidence-projections.test.ts`: Tests redacted projection behavior.
- `test/protocol/representation-contract.test.ts`: Tests Metadata/Challenge/Request/EvidenceProjection non-authority.
- `test/runtime/runtime-ingress.test.ts`: Tests runtime ingress behavior.
- `test/adapters/x402-wallet-gateway.test.ts`: Tests x402 gateway fixture.
- `test/product/agent-proof-slice.test.ts`: End-to-end local proof spine over runtime ingress, x402 gateway, redacted evidence, and certificate verification.

## Naming Conventions

**Files:**

- Protocol primitive folders use lowercase kebab names: `src/protocol/areas/action-contract`, `src/protocol/areas/policy-greenlight`.
- Area entrypoints are `index.ts`; local schema/input/type faces are `schemas.ts`, `inputs.ts`, and `types.ts`.
- Transition behavior is named `transitions.ts`; guard behavior is named `guards.ts`; projection behavior is named `projections.ts`.
- Runtime and adapter proposal helpers use `action-proposal.ts`.
- Gateway fixtures use `gateway.ts`; x402 wallet gateway is `src/adapters/x402-payment/wallet-gateway.ts`.
- Lane manifests are `LANE.md` under first-level `src/*` directories.
- Tests use `.test.ts` and live under ownership folders, not loose root files.

**Directories:**

- First-level `src/*` directories are authority lanes: `protocol`, `http`, `runtime`, `adapters`, `storage`, `sdk`, `conformance`, `install`.
- Protocol primitives live under `src/protocol/areas/*`; do not add flat compatibility shims under `src/protocol/`.
- Public schema and input aggregation stays under `src/protocol/public/*`.
- HTTP metadata, dispatch, scopes, and response schemas stay separated under `src/http/routes/*`.
- HTTP admission code stays under `src/http/admission/*`.
- Storage implementations live under `src/storage/d1`, `src/storage/memory`, and `src/storage/kv`.
- Generated build output lives under `dist/` and is not the editing source.

## Where to Add New Code

**New Tier 1 Protocol Primitive:**

- Primary code: `src/protocol/areas/<primitive-name>/`
- Public aggregation: `src/protocol/public/schemas.ts` and/or `src/protocol/public/inputs.ts` only if the primitive is part of the stable public surface.
- Kernel method: `src/protocol/kernel.ts` only when a new transition is part of the kernel facade.
- Navigation: `src/protocol/navigation/index.ts` and `src/protocol/areas/action-attempt-lifecycle/matrix.ts` when a transition changes lifecycle evidence.
- Object registry: `src/protocol/areas/object-registry/index.ts` and `src/protocol/areas/object-registry/schemas.ts` when a durable object type is added.
- Tests: `test/protocol/<primitive>.test.ts`, plus `test/architecture/root-exports.test.ts` and `test/architecture/import-posture.test.ts` updates when exports/import posture change.

**New Tier 1 Evidence Projection:**

- Primary code: `src/protocol/evidence-projections/projections.ts` and `src/protocol/evidence-projections/schemas.ts`.
- HTTP route: `src/http/routes/evidence-read-route-registry.ts`.
- Handler branch: `src/http/handlers/evidence-read.ts`.
- SDK method: `src/sdk/client.ts`.
- Tests: `test/protocol/evidence-projections.test.ts`, `test/http/http.test.ts`, and role/scope tests when read admission changes.

**New Tier 2 Runtime Ingress Family:**

- Primary code: `src/runtime/<action-family>/action-proposal.ts` or extend `src/runtime/ingress/index.ts` when it is a dispatch-block family.
- Adapter-specific compile input: Keep action-family parameter normalization near the runtime or adapter proposal code, not in protocol areas.
- Tests: `test/runtime/<family>-runtime.test.ts`, hostile traces in `test/protocol/generated-execution-graph.test.ts` or `test/product/agent-proof-slice.test.ts`.
- Rule: Emit runtime evidence, graph evidence, drafts, intent compilations, contracts, or refusals only. Do not issue policy, greenlight, gateway check, receipt, or mutation.

**New Tier 2 Representation Surface:**

- Primary code: `src/protocol/areas/protected-action-representation/` if it remains source-owned non-authority representation.
- Public app/API layer: Add under `src/http/routes/*`, `src/http/handlers/*`, and `src/sdk/client.ts` only after mapping to kernel objects is deterministic.
- Tests: `test/protocol/representation-contract.test.ts` and `test/http/http.test.ts`.
- Rule: Keep `authorityCreated: false`, null authority refs, redaction posture, and no mutation command payloads.

**New Protected Action Adapter:**

- Install compiler: `src/adapters/<family>/install-proposal.ts` if adapter setup compiles into records.
- Runtime proposal: `src/runtime/<family>/action-proposal.ts` or `src/adapters/<family>/action-proposal.ts` depending on existing family precedent.
- Gateway runner: `src/adapters/<family>/gateway.ts`.
- Probes/conformance: `src/adapters/<family>/bypass-probes.ts`, `src/adapters/<family>/conformance.ts`, and/or `src/conformance/<family>/`.
- Exports: Experimental exports in `src/experimental.ts`; stable conformance exports in `src/conformance/index.ts` only when intentionally public.
- Tests: `test/adapters/<family>-gateway.test.ts`, `test/conformance/<family>-conformance.test.ts`, `test/integration/<family>-*.test.ts`.
- Rule: Gateway adapter must mutate only after `verifiedGatewayCheckFromResult()`.

**New Tier 3 Hosted Operation Code:**

- Admission seam: `src/http/admission/*`.
- Hosted routes/handlers: `src/http/routes/*` and `src/http/handlers/*` if they are HTTP surfaces around the kernel.
- Read models/search/retention/alerts/audit/export: create a hosted lane outside `src/protocol/areas/*`; do not add org/project RBAC or search documents as protocol primitives.
- Tests: `test/http/*` for admission/scope behavior and dedicated hosted tests under a matching `test/<hosted-lane>/` folder if added.
- Rule: Hosted operation is not gateway enforcement unless it owns credentials and still uses the exact gateway check.

**New Tier 4 Interoperability Code:**

- Certificate verification helpers: `src/protocol/areas/authority-certificate/*` only for generic terminal certificate primitives.
- External provider/customer adapter integration: `src/adapters/<provider-or-family>/*`.
- Conformance/certification checks: `src/conformance/*`.
- Ecosystem consumers: keep read-only consumer adapters outside `src/protocol/areas/*`.
- Tests: `test/conformance/*`, `test/adapters/*`, and certificate verification tests in `test/protocol/authority-certificate.test.ts`.
- Rule: External trust roots, marketplaces, reputation, provider registries, and certification marks consume evidence; they must not mint authority.

**Utilities:**

- Protocol-wide primitives: use `src/protocol/foundation/*` only for canonicalization, schema core, IDs, errors, reason codes, or transition guards.
- HTTP-local helpers: add under `src/http/<owned-subdir>/`.
- Test-only helpers: add under `test/support/`.
- Avoid generic `utils`, `helpers`, `common`, `misc`, `stuff`, `manager`, or `service` path segments unless `STRUCTURE.md` creates a specific exception.

## Special Directories

**`.planning/`:**

- Purpose: Scratch planning, GSD phase files, strategy notes, and generated codebase maps.
- Generated: Mixed.
- Committed: Project-dependent scratch; not repo-facing source truth.
- Rule: Do not promote `.planning/*` labels, paths, or taxonomy into package scripts, CI names, README sections, source paths, tests, or exported symbols.

**`.planning/codebase/`:**

- Purpose: Codebase maps consumed by GSD planning/execution commands.
- Generated: Yes.
- Committed: Yes when project workflow wants planning maps.
- Rule: Mapper agents write only assigned documents such as `.planning/codebase/ARCHITECTURE.md` and `.planning/codebase/STRUCTURE.md`.

**`dist/`:**

- Purpose: TypeScript build output and package dry-run surface.
- Generated: Yes.
- Committed: Present in this checkout.
- Rule: Edit `src/*`, not `dist/*`.

**`node_modules/`:**

- Purpose: Installed dependencies.
- Generated: Yes.
- Committed: No.
- Rule: Do not inspect as source architecture unless debugging dependency behavior.

**`migrations/`:**

- Purpose: Canonical D1 protocol storage schema.
- Generated: No.
- Committed: Yes.
- Rule: Update when `ProtocolStore` durable indexes or D1 persistence requirements change.

**`docs/internal/`:**

- Purpose: Compact canonical internal protocol documentation.
- Generated: No.
- Committed: Yes.
- Rule: Keep compact. Long research, product plans, and planning-stage labels stay out of repo canon.

**`src/*/LANE.md`:**

- Purpose: First-level source-lane ownership contracts.
- Generated: No.
- Committed: Yes.
- Rule: Every first-level `src/*` directory must carry required manifest sections enforced by `test/architecture/import-posture.test.ts`.

**`.cursor/`, `.gstack/`:**

- Purpose: Developer/tool-local assets and reports.
- Generated: Tool-owned.
- Committed: Project-dependent.
- Rule: Do not treat as protocol source or canonical product truth.

---

*Structure analysis: 2026-05-21*
