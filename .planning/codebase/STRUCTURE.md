# Codebase Structure

**Analysis Date:** 2026-05-22

## Directory Layout

```text
Handshake v0.0.2/
|-- AGENTS.md                         # Doctrine, invariants, authority boundary language
|-- README.md                         # Repo orientation, current proof boundary, commands, source map
|-- QUALITY.md                        # TypeScript quality, naming, import, and claims rules
|-- STRUCTURE.md                      # Canonical source/test/docs ownership map
|-- package.json                      # Private source package contract, scripts, exports, files
|-- bun.lock                          # Bun lockfile
|-- tsconfig.json                     # TypeScript check config
|-- tsconfig.build.json               # Declaration build config
|-- eslint.config.js                  # ESLint config
|-- wrangler.toml                     # Cloudflare Worker, D1, and KV binding config
|-- .github/workflows/check.yml       # CI gate running `npm run check:repo`
|-- docs/internal/                    # Compact canonical internal docs
|-- examples/x402-protected-spend/    # Local x402 protected-spend walkthrough and artifacts
|-- migrations/                       # D1 protocol storage schema
|-- scripts/                          # Package/check helper scripts
|-- src/                              # TypeScript source package
|-- test/                             # Bun tests by ownership lane
|-- dist/                             # Generated declaration build output
|-- node_modules/                     # Installed dependencies
|-- .planning/                        # Scratch planning and mapper outputs
|-- .gstack/                          # Local tool/security report scratch
`-- .cursor/                          # Editor-local config
```

```text
src/
|-- index.ts                          # Curated package root
|-- experimental.ts                   # Explicit experimental gateway exports
|-- worker.ts                         # Cloudflare Worker entrypoint
|-- protocol/
|   |-- LANE.md                       # Protocol lane ownership contract
|   |-- kernel.ts                     # Transition facade
|   |-- public/                       # Public schema/input aggregators
|   |-- foundation/                   # Canonicalization, IDs, errors, reason codes, guards
|   |-- events/                       # Record commit and digest-linked event chains
|   |-- context/                      # Transition request context records
|   |-- navigation/                   # Protocol transition metadata
|   |-- evidence-projections/         # Redacted diagnostic projections
|   |-- store/                        # ProtocolStore port
|   `-- areas/                        # Primitive-owned protocol areas
|-- http/
|   |-- LANE.md                       # HTTP lane ownership contract
|   |-- app.ts                        # Hono app and transition handler
|   |-- app-options.ts                # App options and Worker bindings
|   |-- admission/                    # Caller custody and hosted identity checks
|   |-- routes/                       # Route metadata, invokers, scope, response schemas
|   |-- handlers/                     # Evidence and internal record reads
|   |-- errors/                       # HTTP error envelopes and codes
|   |-- openapi/                      # OpenAPI projection
|   |-- navigation/                   # HTTP route navigation metadata
|   `-- store/                        # Store/kernel resolution for Hono contexts
|-- runtime/
|   |-- LANE.md                       # Runtime lane ownership contract
|   |-- index.ts                      # Runtime package subpath
|   |-- ingress/                      # Runtime dispatch block observer/compiler
|   |-- codemode-multi-action/        # Bounded generated action-list helpers
|   |-- package-install/              # Package install proposal helper
|   |-- preview-deploy/               # Preview deploy proposal helper
|   `-- repo-write/                   # Repo write proposal helper
|-- adapters/
|   |-- LANE.md                       # Adapter lane ownership contract
|   |-- downstream-failure-evidence.ts
|   |-- package-install/              # Package install gateway fixture
|   |-- repo-write/                   # Repo write gateway fixture
|   |-- preview-deploy/               # Preview deploy gateway fixture
|   |-- protected-path-probes/        # Hostile bypass/custody probe runners
|   `-- x402-payment/                 # x402 proof profile and wallet gateway
|-- install/
|   |-- LANE.md                       # Install lane ownership contract
|   |-- index.ts
|   |-- install-proposal/
|   `-- protected-action-adapter-pack/
|-- storage/
|   |-- LANE.md                       # Storage lane ownership contract
|   |-- store.ts                      # Store type re-export face
|   |-- d1/                           # D1 ProtocolStore implementation
|   |-- memory/                       # In-memory ProtocolStore fixture
|   `-- kv/                           # Isolation cache helpers
|-- sdk/
|   |-- LANE.md                       # SDK lane ownership contract
|   |-- client.ts                     # All-route typed HTTP client
|   `-- surface-clients/              # Role-scoped runtime/evidence clients
|-- cli/
|   |-- LANE.md                       # CLI lane ownership contract
|   |-- index.ts                      # CLI source face
|   |-- main.ts                       # Command dispatcher
|   |-- command-manifest.ts           # Active/deferred command contract
|   |-- output.ts                     # CLI JSON envelope
|   |-- aps-report.ts                 # APS evidence renderer
|   |-- certificate.ts                # Local certificate verifier
|   `-- conformance.ts                # x402 conformance command
|-- mcp/
|   |-- LANE.md                       # MCP lane ownership contract
|   |-- index.ts                      # MCP source face
|   |-- catalog.ts                    # MCP tool/resource catalog
|   |-- x402-proposal.ts              # Strict x402 proposal bridge
|   |-- resources.ts                  # Read-only resource mapping
|   |-- output.ts                     # MCP result envelope
|   `-- digest.ts                     # Local MCP digest helper
|-- surfaces/
|   |-- LANE.md                       # Surface lane ownership contract
|   |-- boundary-manifest.ts          # SDK/CLI/MCP boundary table
|   `-- outcome.ts                    # Shared non-authority outcome shapes
`-- conformance/
    |-- LANE.md                       # Conformance lane ownership contract
    `-- index.ts                      # Conformance subpath
```

```text
test/
|-- architecture/                     # Repo shape, imports, root exports, surface, naming, claims
|-- protocol/                         # Primitive and state-machine invariants
|-- http/                             # Hono, D1, and route behavior
|-- runtime/                          # Runtime ingress and codemode proposal behavior
|-- mcp/                              # MCP schema/resource/proposal posture
|-- cli/                              # CLI evidence behavior
|-- sdk/                              # Role-scoped client behavior
|-- adapters/                         # Reference gateway fixtures
|-- conformance/                      # Conformance checks and x402 posture
|-- integration/                      # End-to-end D1/HTTP protected action paths
|-- product/                          # Local proof-slice reports
`-- support/                          # Fixtures and harnesses
```

## Directory Purposes

**Root Canon:**
- Purpose: Keep repo truth compact and source-backed.
- Contains: `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/decisions.md`, `docs/internal/protocol-definition.md`, `docs/internal/protocol-kernel-architecture.md`, `docs/internal/protocol-layman.md`, `docs/internal/protocol-notes.md`.
- Key files: `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`.

**`src/protocol`:**
- Purpose: Protocol meaning, transition facade, schemas, canonicalization, events, context, navigation, store port, and primitive-owned areas.
- Contains: `kernel.ts`, `public/`, `foundation/`, `events/`, `context/`, `navigation/`, `evidence-projections/`, `store/`, `areas/`.
- Key files: `src/protocol/kernel.ts`, `src/protocol/public/schemas.ts`, `src/protocol/public/inputs.ts`, `src/protocol/navigation/index.ts`, `src/protocol/store/port.ts`.

**`src/protocol/areas`:**
- Purpose: Owned protocol primitives and transition behavior.
- Contains: `catalog-envelope`, `credential-custody`, `runtime-evidence`, `generated-execution-graph`, `tool-call-draft`, `intent-compilation`, `action-contract`, `policy-greenlight`, `gateway-gate`, `receipt-export`, `refusal`, `proof-gap`, `recovery`, `review-binding`, `isolation-breaker`, `operation-lifecycle`, `object-registry`, and related primitive folders.
- Key files: `src/protocol/areas/index.ts`, `src/protocol/areas/action-contract/transitions.ts`, `src/protocol/areas/policy-greenlight/transitions.ts`, `src/protocol/areas/gateway-gate/transitions.ts`, `src/protocol/areas/object-registry/index.ts`.

**`src/protocol/public`:**
- Purpose: Public schema and input aggregation only.
- Contains: `schemas.ts`, `inputs.ts`, `transitions.ts`, `index.ts`.
- Key files: `src/protocol/public/schemas.ts`, `src/protocol/public/inputs.ts`.

**`src/protocol/foundation`:**
- Purpose: Shared protocol foundation with no transport/storage implementation dependency.
- Contains: canonicalization, content digests, IDs, errors, schema core, reason codes, transition guards.
- Key files: `src/protocol/foundation/canonical.ts`, `src/protocol/foundation/reason-codes.ts`, `src/protocol/foundation/errors.ts`.

**`src/protocol/events`:**
- Purpose: Canonical record building and digest-linked stream event chains.
- Contains: event schemas, record commits, digest chain builder.
- Key files: `src/protocol/events/records.ts`, `src/protocol/events/chains.ts`, `src/protocol/events/schemas.ts`.

**`src/protocol/evidence-projections`:**
- Purpose: Redacted read projections over stored protocol evidence.
- Contains: projection schemas and projection builders.
- Key files: `src/protocol/evidence-projections/projections.ts`, `src/protocol/evidence-projections/schemas.ts`.

**`src/http`:**
- Purpose: Hono/Worker transport, caller admission, route metadata, handlers, OpenAPI, error mapping, and store/kernel resolution.
- Contains: `app.ts`, `admission/`, `routes/`, `handlers/`, `errors/`, `openapi/`, `navigation/`, `store/`.
- Key files: `src/http/app.ts`, `src/http/routes/transition-route-registry.ts`, `src/http/routes/transition-invokers.ts`, `src/http/handlers/evidence-read.ts`, `src/http/handlers/internal-record-read.ts`.

**`src/runtime`:**
- Purpose: Generated-execution proposal evidence and action-contract proposal helpers.
- Contains: runtime ingress, package install proposal helper, repo write proposal helper, preview deploy proposal helper, codemode multi-action helpers.
- Key files: `src/runtime/ingress/index.ts`, `src/runtime/codemode-multi-action/generated-program-runner.ts`, `src/runtime/package-install/action-proposal.ts`, `src/runtime/index.ts`.

**`src/adapters`:**
- Purpose: Reference gateway fixtures and adapter proof profiles.
- Contains: package-install, repo-write, preview-deploy gateways, x402 payment proof profile, protected-path probe runners, downstream failure evidence.
- Key files: `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `src/adapters/x402-payment/bypass-probes.ts`, `src/adapters/package-install/gateway.ts`.

**`src/install`:**
- Purpose: Generic protected-action installation proposal contracts.
- Contains: install proposal shape and protected action adapter-pack shape.
- Key files: `src/install/install-proposal/index.ts`, `src/install/protected-action-adapter-pack/index.ts`.

**`src/storage`:**
- Purpose: Protocol store implementations and non-authority cache helpers.
- Contains: D1 store, SQL statement builders, memory store, KV/noop isolation cache, store type re-export face.
- Key files: `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `src/storage/memory/index.ts`, `src/storage/kv/index.ts`, `src/storage/store.ts`.

**`src/sdk`:**
- Purpose: Typed HTTP client ergonomics over public transition/evidence routes.
- Contains: all-route client and role-scoped surface clients.
- Key files: `src/sdk/client.ts`, `src/sdk/surface-clients/runtime-client.ts`, `src/sdk/surface-clients/evidence-client.ts`, `src/sdk/surface-clients/transport.ts`.

**`src/cli`:**
- Purpose: Local operator/evidence command contract.
- Contains: schema command, APS report renderer, certificate verifier, x402 conformance command, output envelope.
- Key files: `src/cli/command-manifest.ts`, `src/cli/main.ts`, `src/cli/output.ts`, `src/cli/certificate.ts`, `src/cli/aps-report.ts`.

**`src/mcp`:**
- Purpose: Model-facing proposal and evidence source modules.
- Contains: MCP catalog, x402 proposal input/bridge, read-only resource mapping, output envelope, digest helper.
- Key files: `src/mcp/catalog.ts`, `src/mcp/x402-proposal.ts`, `src/mcp/resources.ts`, `src/mcp/index.ts`.

**`src/surfaces`:**
- Purpose: Source-owned boundary manifests and shared non-authority outcome shapes for product surfaces.
- Contains: surface boundary table and shared surface outcome contract.
- Key files: `src/surfaces/boundary-manifest.ts`, `src/surfaces/outcome.ts`.

**`src/conformance`:**
- Purpose: Reference conformance checks for adapter posture without authority or certification claims.
- Contains: protected mutation adapter checks and re-exported x402 conformance helpers.
- Key files: `src/conformance/index.ts`.

**`examples/x402-protected-spend`:**
- Purpose: Local official exact x402 protected-spend walkthrough.
- Contains: README, runnable demo, generated output directory.
- Key files: `examples/x402-protected-spend/README.md`, `examples/x402-protected-spend/run.ts`, `examples/x402-protected-spend/output/.gitignore`.

**`test`:**
- Purpose: Bun tests grouped by ownership and behavior boundary.
- Contains: architecture, protocol, HTTP, runtime, MCP, CLI, SDK, adapters, conformance, integration, product, support.
- Key files: `test/architecture/import-posture.test.ts`, `test/architecture/surface-boundary-posture.test.ts`, `test/protocol/kernel-policy-gateway.test.ts`, `test/runtime/runtime-ingress.test.ts`, `test/integration/x402-d1-http.test.ts`.

**`.planning`:**
- Purpose: Scratch planning and mapper output.
- Contains: planning artifacts and `.planning/codebase/*`.
- Key files: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`.
- Canonical: No. Do not import paths, scripts, CI names, or product claims from `.planning/` into source-facing canon.

## Key File Locations

**Entry Points:**
- `src/index.ts`: Curated root package export.
- `src/runtime/index.ts`: Runtime observer/compiler package subpath.
- `src/conformance/index.ts`: Conformance package subpath.
- `src/experimental.ts`: Experimental reference gateway package subpath.
- `src/worker.ts`: Cloudflare Worker entrypoint.
- `src/http/app.ts`: Hono app entrypoint.
- `src/cli/main.ts`: CLI command dispatcher.
- `src/mcp/index.ts`: MCP source face.
- `examples/x402-protected-spend/run.ts`: Local protected-spend demo.

**Configuration:**
- `package.json`: Package metadata, exports, scripts, dependencies, packable files.
- `tsconfig.json`: TypeScript check configuration.
- `tsconfig.build.json`: Declaration build configuration.
- `eslint.config.js`: ESLint configuration.
- `wrangler.toml`: Worker, D1, and KV binding configuration.
- `.github/workflows/check.yml`: CI gate.
- `migrations/0001_protocol_kernel.sql`: D1 schema.

**Core Logic:**
- `src/protocol/kernel.ts`: Transition facade.
- `src/protocol/areas/intent-compilation/transitions.ts`: Intent-to-candidate transition.
- `src/protocol/areas/action-contract/transitions.ts`: Candidate-to-contract transition.
- `src/protocol/areas/policy-greenlight/transitions.ts`: Policy and greenlight transition.
- `src/protocol/areas/gateway-gate/transitions.ts`: Gateway check, receipt, proof-gap, replay refusal transition.
- `src/protocol/areas/credential-custody/transitions.ts`: Gateway credential refs and post-gate credential resolution evidence.
- `src/protocol/events/records.ts`: Protocol record and event commit helper.
- `src/protocol/store/port.ts`: Store port and atomic commit contract.
- `src/protocol/evidence-projections/projections.ts`: Redacted evidence projections.

**x402 Protected Spend:**
- `src/adapters/x402-payment/install-proposal.ts`: x402 exact install proposal compiler.
- `src/adapters/x402-payment/action-proposal.ts`: x402 payment attempt to compile-intent input helper.
- `src/adapters/x402-payment/upstream-evidence.ts`: official `PAYMENT-REQUIRED` evidence decoder.
- `src/adapters/x402-payment/wallet-gateway.ts`: gateway-held signing surface and wallet gateway.
- `src/adapters/x402-payment/bypass-probes.ts`: hostile bypass/custody probe executors.
- `src/adapters/x402-payment/conformance.ts`: x402 first-wedge conformance classification.
- `examples/x402-protected-spend/README.md`: walkthrough and proof/non-claim boundary.
- `test/integration/x402-d1-http.test.ts`: D1/HTTP x402 path.

**Product Surfaces:**
- `src/surfaces/boundary-manifest.ts`: SDK/CLI/MCP source-owned boundary table.
- `src/sdk/client.ts`: All-route typed HTTP client.
- `src/sdk/surface-clients/runtime-client.ts`: Runtime proposal role-scoped client.
- `src/sdk/surface-clients/evidence-client.ts`: Evidence role-scoped client plus offline certificate verify.
- `src/cli/command-manifest.ts`: Active CLI command contract.
- `src/mcp/catalog.ts`: MCP catalog.
- `src/mcp/x402-proposal.ts`: MCP x402 proposal bridge.
- `src/mcp/resources.ts`: MCP resource projection mapping.

**Testing:**
- `test/architecture/import-posture.test.ts`: Import posture and lane manifest enforcement.
- `test/architecture/root-exports.test.ts`: Public export curation.
- `test/architecture/surface-boundary-posture.test.ts`: SDK/CLI/MCP surface boundaries.
- `test/architecture/cli-command-posture.test.ts`: CLI non-authority posture.
- `test/architecture/mcp-surface-posture.test.ts`: MCP non-authority posture.
- `test/architecture/claim-boundary.test.ts`: Current claim boundary checks.
- `test/protocol/*`: Primitive and state-machine invariants.
- `test/support/*`: Fixtures, harnesses, and proof flows.

## Naming Conventions

**Files:**
- Use owned protocol nouns for source paths: `src/protocol/areas/action-contract/transitions.ts`, `src/protocol/areas/gateway-gate/guards.ts`.
- Use `schemas.ts`, `inputs.ts`, `types.ts`, `guards.ts`, `transitions.ts`, and `index.ts` inside protocol areas.
- Use `action-proposal.ts` for runtime/adapter proposal helpers: `src/runtime/package-install/action-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`.
- Use `gateway.ts` for reference gateway fixtures: `src/adapters/package-install/gateway.ts`.
- Use `*-client.ts` for SDK role clients: `src/sdk/surface-clients/runtime-client.ts`.
- Do not create source paths with generic bucket segments such as `utils`, `helpers`, `common`, `misc`, `stuff`, `manager`, or `service`; this is enforced by `test/architecture/naming-posture.test.ts`.

**Directories:**
- First-level source directories are lanes by authority boundary: `src/protocol`, `src/http`, `src/runtime`, `src/adapters`, `src/install`, `src/storage`, `src/sdk`, `src/cli`, `src/mcp`, `src/surfaces`, `src/conformance`.
- Protocol primitive folders live only under `src/protocol/areas/*`.
- HTTP route structure belongs under `src/http/routes/*`, not in `src/protocol`.
- Product-surface boundary metadata belongs under `src/surfaces/*`.
- Test directories mirror ownership under `test/architecture`, `test/protocol`, `test/http`, `test/runtime`, `test/mcp`, `test/cli`, `test/sdk`, `test/adapters`, `test/conformance`, `test/integration`, `test/product`, and `test/support`.

**Exports:**
- Root exports live in `src/index.ts` and must remain curated.
- Runtime helpers export from `src/runtime/index.ts`.
- Conformance checks export from `src/conformance/index.ts`.
- Experimental reference gateways export from `src/experimental.ts` with `experimental*` / `Experimental*` names.
- Area internals should export through their local `index.ts`; public schemas and inputs aggregate through `src/protocol/public/schemas.ts` and `src/protocol/public/inputs.ts`.

## Where to Add New Code

**New Protocol Primitive:**
- Primary code: `src/protocol/areas/<primitive>/`
- Public area face: `src/protocol/areas/<primitive>/index.ts`
- Schemas: `src/protocol/areas/<primitive>/schemas.ts`
- Inputs: `src/protocol/areas/<primitive>/inputs.ts`
- Transition behavior: `src/protocol/areas/<primitive>/transitions.ts`
- Kernel method: `src/protocol/kernel.ts`
- Navigation metadata: `src/protocol/navigation/index.ts`
- Public aggregators: `src/protocol/public/schemas.ts`, `src/protocol/public/inputs.ts`
- Tests: `test/protocol/<primitive>.test.ts`, plus `test/architecture/import-posture.test.ts` updates if the boundary changes.

**New HTTP Transition:**
- Route metadata: `src/http/routes/transition-route-registry.ts`
- Invoker: `src/http/routes/transition-invokers.ts`
- Response schema: `src/http/routes/transition-response-schemas.ts`
- Scope resolver if needed: `src/http/routes/transition-scope-resolvers.ts`
- Kernel transition: `src/protocol/kernel.ts`
- Tests: `test/http/http.test.ts`, `test/http/d1-http.test.ts`, and relevant `test/protocol/*`.

**New Redacted Evidence Projection:**
- Projection schema: `src/protocol/evidence-projections/schemas.ts`
- Projection builder: `src/protocol/evidence-projections/projections.ts`
- HTTP route: `src/http/routes/evidence-read-route-registry.ts`
- HTTP handler: `src/http/handlers/evidence-read.ts`
- SDK read: `src/sdk/client.ts` or `src/sdk/surface-clients/evidence-client.ts`
- MCP resource mapping if model-facing: `src/mcp/resources.ts`
- Tests: `test/protocol/evidence-projections.test.ts`, `test/http/http.test.ts`, `test/mcp/mcp-resource-redaction.test.ts` if MCP-facing.

**New Runtime Proposal Path:**
- Primary code: `src/runtime/<action-family>/action-proposal.ts` or `src/runtime/ingress/index.ts` when it extends normalized dispatch ingress.
- Must emit: runtime evidence, optional generated graph evidence, tool-call draft, intent compilation, action contract, or refusal.
- Must not emit: policy decision, greenlight, gateway check, mutation attempt, receipt, receipt export, authority certificate.
- Tests: `test/runtime/*`, `test/architecture/claim-boundary.test.ts`, and `test/architecture/import-posture.test.ts`.

**New Gateway Fixture Or Adapter Proof Profile:**
- Primary code: `src/adapters/<action-family>/`
- Gateway runner: `src/adapters/<action-family>/gateway.ts`
- Install/proposal helpers: `src/adapters/<action-family>/install-proposal.ts`, `src/adapters/<action-family>/action-proposal.ts`
- Conformance/probes if needed: `src/adapters/<action-family>/conformance.ts`, `src/adapters/<action-family>/bypass-probes.ts`
- Experimental export: `src/experimental.ts`
- Tests: `test/adapters/<action-family>.test.ts`, `test/conformance/*`, `test/integration/*`.

**New x402 Work:**
- Keep exact buyer-side per-call protected spend under `src/adapters/x402-payment/*`.
- Add upstream evidence parsing to `src/adapters/x402-payment/upstream-evidence.ts`.
- Add gateway-held signing behavior to `src/adapters/x402-payment/wallet-gateway.ts`.
- Add conformance cut-line changes to `src/adapters/x402-payment/conformance.ts`.
- Add demo changes to `examples/x402-protected-spend/*`.
- Do not move x402-specific behavior into `src/protocol/areas/*` unless it becomes provider-neutral protocol meaning.

**New SDK Surface:**
- All-route client changes: `src/sdk/client.ts`
- Role-scoped client changes: `src/sdk/surface-clients/*`
- Surface manifest update: `src/surfaces/boundary-manifest.ts`
- Tests: `test/sdk/*`, `test/architecture/surface-boundary-posture.test.ts`, `test/architecture/root-exports.test.ts`.

**New CLI Command:**
- Command metadata first: `src/cli/command-manifest.ts`
- Dispatch: `src/cli/main.ts`
- Output envelope: `src/cli/output.ts`
- Command implementation: `src/cli/<command>.ts`
- Tests: `test/cli/*`, `test/architecture/cli-command-posture.test.ts`, `test/architecture/surface-boundary-posture.test.ts`.
- Do not add mutation, process startup, gateway-check, policy, receipt-export, raw-record, or signer commands to the current active CLI slice.

**New MCP Tool Or Resource:**
- Catalog entry: `src/mcp/catalog.ts`
- Tool implementation: `src/mcp/<tool>.ts`
- Resource mapping: `src/mcp/resources.ts`
- Shared output: `src/mcp/output.ts`
- Surface manifest update: `src/surfaces/boundary-manifest.ts`
- Tests: `test/mcp/*`, `test/architecture/mcp-surface-posture.test.ts`, `test/architecture/surface-boundary-posture.test.ts`.
- Do not import `src/sdk/client.ts`, `src/protocol/kernel.ts`, `src/adapters/*`, `src/storage/*`, or authority transition internals into `src/mcp/*`.

**New Storage Implementation:**
- Store implementation: `src/storage/<backend>/`
- Keep behavior against `src/protocol/store/port.ts`.
- Do not import protocol primitive transition modules into storage.
- Tests: `test/protocol/protocol-store-atomicity-contract.test.ts`, `test/http/d1-http.test.ts`, backend-specific tests.

**New Test Fixture Or Harness:**
- Shared fixtures: `test/support/*`
- Protocol primitive tests: `test/protocol/*`
- HTTP route tests: `test/http/*`
- Runtime tests: `test/runtime/*`
- Adapter tests: `test/adapters/*`
- Product proof tests: `test/product/*`
- Do not place loose `.test.ts` files directly under `test/`.

**Documentation Updates:**
- Canonical docs: `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/*`
- Internal compact decisions: `docs/internal/decisions.md`
- Protocol definition changes: `docs/internal/protocol-definition.md`
- Architecture/schema changes: `docs/internal/protocol-kernel-architecture.md`
- Implementation notes: `docs/internal/protocol-notes.md`
- Scratch planning: `.planning/*`
- Do not promote `.planning/*` content into source-facing names, scripts, CI, package exports, or canonical docs without re-checking source.

## Special Directories

**`dist/`:**
- Purpose: Generated declaration build output.
- Generated: Yes.
- Committed: Present in working tree; package surface uses `dist` for types.

**`node_modules/`:**
- Purpose: Installed dependencies.
- Generated: Yes.
- Committed: No.

**`.planning/`:**
- Purpose: Scratch planning, mapper output, and project context.
- Generated: Mixed.
- Committed: Context-dependent.
- Canonical: No. Treat `.planning/` as scratch, not repo truth.

**`.planning/codebase/`:**
- Purpose: Mapper-generated codebase reference docs for GSD workflows.
- Generated: Yes.
- Committed: Context-dependent.
- Files owned by this mapping focus: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`.

**`.gstack/`:**
- Purpose: Local tool/security report scratch.
- Generated: Yes.
- Committed: No unless explicitly intended.

**`.cursor/`:**
- Purpose: Editor-local configuration.
- Generated: Local/editor-managed.
- Committed: Context-dependent.

**`examples/x402-protected-spend/output/`:**
- Purpose: Generated local demo artifacts.
- Generated: Yes.
- Committed: Output ignored except `.gitignore`.

**`migrations/`:**
- Purpose: Canonical D1 schema for reference protocol storage.
- Generated: No.
- Committed: Yes.

**`.github/workflows/`:**
- Purpose: CI workflow definitions.
- Generated: No.
- Committed: Yes.

**Empty Current Directories:**
- Purpose: Reserved or stale local placeholders with no TypeScript files.
- Paths: `src/runtime/x402-payment`, `src/runtime/consequence-ingress`, `src/adapters/x402-wallet-gateway`, `src/sdk/activation`, `src/conformance/x402-payment`.
- Guidance: Do not add code here unless `STRUCTURE.md`, lane manifests, and architecture tests are updated to make ownership explicit. Prefer existing active lanes such as `src/runtime/ingress`, `src/adapters/x402-payment`, `src/sdk/surface-clients`, and `src/conformance/index.ts`.

---

*Structure analysis: 2026-05-22*
