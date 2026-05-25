# Codebase Structure

**Analysis Date:** 2026-05-25

## Directory Layout

```text
Handshake v0.0.2/
├── src/                 # Source-owned protocol, transport, adapters, clients, and surfaces
├── test/                # Unit, product, architecture, smoke, and integration tests
├── examples/            # Runnable demos and generated-output fixtures
├── scripts/             # Quality, packaging, docs, and architecture guard scripts
├── migrations/          # Cloudflare D1 schema for protocol kernel state
├── bin/                 # Package CLI entry shims
├── docs/internal/       # Canonical product, protocol, and decision notes
├── .github/workflows/   # CI gates
├── .planning/codebase/  # GSD scratch codebase maps
├── package.json         # Package scripts, exports, dependencies, and files surface
├── tsconfig.json        # TypeScript project settings
├── wrangler.toml        # Cloudflare Worker/D1 configuration
├── README.md            # Current repo orientation and commands
├── QUALITY.md           # TypeScript and naming quality rules
└── STRUCTURE.md         # Tracked source, docs, and test ownership rules
```

## Directory Purposes

**`src/`:**
- Purpose: Source-owned implementation of the protocol kernel and product surfaces.
- Contains: Protocol areas, HTTP transport, storage adapters, runtime ingress, adapters, SDK role clients, CLI, MCP, surfaces, installation helpers, conformance exports, x402 protected-tool helper.
- Key files: `src/index.ts`, `src/worker.ts`, `src/protocol/kernel.ts`, `src/http/app.ts`

**`src/protocol/`:**
- Purpose: Protocol authority kernel, state-machine areas, store port, navigation, utilities, and evidence projections.
- Contains: `src/protocol/areas/*`, `src/protocol/store/port.ts`, `src/protocol/evidence-projections/*`, `src/protocol/navigation.ts`, `src/protocol/utils/*`
- Key files: `src/protocol/kernel.ts`, `src/protocol/LANE.md`

**`src/protocol/areas/`:**
- Purpose: Source-owned protocol primitives grouped by area.
- Contains: Action contract, catalog envelope, credential custody, delegated authority, gateway gate, policy greenlight, receipts, recovery, isolation, terminal certificate, and related transition modules.
- Key files: `src/protocol/areas/action-contract/schemas.ts`, `src/protocol/areas/policy-greenlight/transitions.ts`, `src/protocol/areas/gateway-gate/transitions.ts`

**`src/http/`:**
- Purpose: HTTP entry, route metadata, admission, handlers, OpenAPI helpers, and HTTP-facing navigation.
- Contains: `src/http/admission`, `src/http/routes`, `src/http/handlers`, `src/http/errors`, `src/http/openapi`, `src/http/store`
- Key files: `src/http/app.ts`, `src/http/admission/index.ts`, `src/http/routes/transition-route-registry.ts`, `src/http/routes/evidence-read-route-registry.ts`

**`src/storage/`:**
- Purpose: Concrete protocol store implementations and Cloudflare storage integration.
- Contains: D1 store, in-memory store, KV helpers, and storage lane docs.
- Key files: `src/storage/d1/index.ts`, `src/storage/memory/index.ts`, `src/storage/store.ts`

**`src/runtime/`:**
- Purpose: Proposal-only runtime ingress for generated execution observations.
- Contains: Ingress handler, family registry, runtime family definitions, posture checks.
- Key files: `src/runtime/ingress/index.ts`, `src/runtime/ingress/registry.ts`, `src/runtime/ingress/families.ts`

**`src/adapters/`:**
- Purpose: Adapter implementations that connect verified gateway checks to real mutation surfaces.
- Contains: x402 payment adapter and package-install adapter.
- Key files: `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/package-install/gateway.ts`

**`src/sdk/`:**
- Purpose: Role-scoped clients and SDK entry points for product consumers.
- Contains: Role clients and SDK lane docs.
- Key files: `src/sdk/role-clients.ts`, `src/sdk/LANE.md`

**`src/cli/`:**
- Purpose: CLI command contracts and command dispatch surfaces.
- Contains: Command manifest, CLI entry implementation, readback commands.
- Key files: `src/cli/command-manifest.ts`, `src/cli/index.ts`, `src/cli/LANE.md`

**`src/mcp/`:**
- Purpose: MCP server surface for product integration.
- Contains: Server descriptors, route/tool wiring, MCP package surface.
- Key files: `src/mcp/server.ts`, `src/mcp/server.json`, `src/mcp/LANE.md`

**`src/surfaces/`:**
- Purpose: Non-authority review/readback surface models.
- Contains: Review renderer models and surface posture helpers.
- Key files: `src/surfaces/LANE.md`

**`src/install/`:**
- Purpose: Installation, registry, and package setup helpers.
- Contains: Install-related package and server metadata helpers.
- Key files: `src/install/LANE.md`

**`src/adapter-sdk/`:**
- Purpose: Public adapter SDK definitions that support third-party adapter packs without giving them protocol authority.
- Contains: Definition-only adapter pack contracts and helpers.
- Key files: `src/adapter-sdk/index.ts`, `src/adapter-sdk/LANE.md`

**`src/conformance/`:**
- Purpose: Conformance package surface for protocol/adapters compatibility checks.
- Contains: Conformance exports and fixtures.
- Key files: `src/conformance/index.ts`, `src/conformance/LANE.md`

**`src/x402-protected-tool/`:**
- Purpose: Narrow package surface for x402 protected-tool helpers.
- Contains: Tool helper exports and lane documentation.
- Key files: `src/x402-protected-tool/index.ts`, `src/x402-protected-tool/LANE.md`

**`test/`:**
- Purpose: Verification suite for protocol invariants, architecture boundaries, product claims, examples, and integrations.
- Contains: `test/architecture`, `test/product`, `test/smoke`, `test/integration`, plus focused protocol and package tests.
- Key files: `test/architecture/import-posture.test.ts`, `test/architecture/package-surface.test.ts`, `test/architecture/surface-boundary-posture.test.ts`

**`examples/`:**
- Purpose: Runnable demonstrations with checked source and ignored generated output.
- Contains: Example READMEs, `run.mjs` scripts, TypeScript helpers, and `output/.gitignore` files.
- Key files: `examples/x402-full-chain/run.mjs`, `examples/external-adapter-sdk/run.mjs`, `examples/x402-protected-tool/README.md`

**`scripts/`:**
- Purpose: Repository quality, architecture, claims, package, docs, and example-output gates.
- Contains: Node scripts invoked from `package.json`.
- Key files: `scripts/check-architecture-docs.mjs`, `scripts/check-claims.mjs`, `scripts/check-package-surface.mjs`, `scripts/check-example-outputs.mjs`

**`docs/internal/`:**
- Purpose: Tracked canonical product and architecture decisions.
- Contains: Decision log, protocol notes, protocol definition, protocol kernel architecture, and focused internal docs.
- Key files: `docs/internal/decisions.md`, `docs/internal/protocol-notes.md`, `docs/internal/protocol-definition.md`, `docs/internal/protocol-kernel-architecture.md`

**`.planning/codebase/`:**
- Purpose: GSD scratch codebase maps for planner/executor agents.
- Contains: Generated architecture, structure, stack, testing, convention, concern, and integration maps.
- Key files: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`

## Key File Locations

**Entry Points:**
- `src/worker.ts`: Cloudflare Worker fetch entry that delegates to the HTTP app.
- `src/http/app.ts`: Hono app factory and transport entry for transition/read routes.
- `src/index.ts`: Curated public root package exports.
- `src/experimental.ts`: Explicit experimental exports and reference fixtures.
- `bin/handshake.js`: Package CLI entry shim.

**Configuration:**
- `package.json`: Scripts, package exports, package files, dependency list.
- `tsconfig.json`: TypeScript compiler settings.
- `vitest.config.ts`: Test runner configuration.
- `wrangler.toml`: Cloudflare Worker and D1 binding configuration.
- `.github/workflows/check.yml`: CI quality gate.

**Core Logic:**
- `src/protocol/kernel.ts`: Protocol transition facade.
- `src/protocol/store/port.ts`: Store interface between protocol and persistence.
- `src/protocol/areas/action-contract/*`: Exact action contract records and transitions.
- `src/protocol/areas/policy-greenlight/*`: Policy decision and one-use greenlight records.
- `src/protocol/areas/gateway-gate/*`: Gateway enforcement transition and verified gateway artifacts.
- `src/protocol/areas/delegated-authority/*`: Principal-agent-runtime delegated authority references and status.
- `src/protocol/areas/credential-custody/*`: Gateway credential references and custody proof packets.
- `src/runtime/ingress/*`: Proposal-only runtime observation compiler.
- `src/adapters/x402-payment/wallet-gateway.ts`: Official x402 buyer-side signing gateway after verification.
- `src/adapters/package-install/gateway.ts`: Package-install gateway execution after verification.

**Read Models and Projections:**
- `src/protocol/evidence-projections/projections.ts`: Redacted contract/timeline/readback projection helpers.
- `src/protocol/evidence-projections/assembly.ts`: Transaction envelope assembly from protocol records.
- `src/http/routes/evidence-read-route-registry.ts`: Evidence read route contracts, scopes, and role requirements.
- `src/http/handlers/evidence-read.ts`: Evidence projection HTTP handler.
- `src/http/handlers/internal-record-read.ts`: Raw/internal record read guardrails.

**Admission and Routing:**
- `src/http/admission/index.ts`: Transition, evidence-read, hosted verifier, and raw/readiness admission checks.
- `src/http/routes/transition-route-registry.ts`: Transition route metadata and custody roles.
- `src/http/routes/transition-invokers.ts`: Route ID to kernel method mapping.

**Persistence:**
- `src/storage/memory/index.ts`: In-memory store with conflict/idempotency semantics.
- `src/storage/d1/index.ts`: D1-backed store implementation.
- `src/storage/store.ts`: Store construction from environment.
- `migrations/0001_protocol_kernel.sql`: Durable D1 schema.

**Testing:**
- `test/architecture/import-posture.test.ts`: Lane, import, authority, projection, storage, and signer boundary checks.
- `test/architecture/root-exports.test.ts`: Public root export restrictions.
- `test/architecture/package-surface.test.ts`: Packed package file and export restrictions.
- `test/architecture/surface-boundary-posture.test.ts`: Surface authority posture checks.
- `test/product/*`: Product behavior and example-output expectations.

## Naming Conventions

**Files:**
- Protocol areas use lowercase kebab-case directories with explicit implementation files: `src/protocol/areas/gateway-gate/transitions.ts`, `src/protocol/areas/action-contract/schemas.ts`.
- Each first-level source lane has a `LANE.md` file: `src/protocol/LANE.md`, `src/http/LANE.md`, `src/runtime/LANE.md`.
- Tests use `*.test.ts` and live under a semantic test directory: `test/architecture/import-posture.test.ts`, `test/product/x402-demo-output.test.ts`.
- Example runners use `run.mjs`: `examples/external-adapter-sdk/run.mjs`, `examples/x402-full-chain/run.mjs`.
- Scripts use descriptive kebab-case `.mjs` names: `scripts/check-package-surface.mjs`.

**Directories:**
- Protocol source directories are domain names, not stage labels: `src/protocol/areas/policy-greenlight`, `src/protocol/areas/gateway-gate`.
- Transport directories are responsibility names: `src/http/admission`, `src/http/routes`, `src/http/handlers`.
- Adapter directories name protected-action families: `src/adapters/x402-payment`, `src/adapters/package-install`.
- Test directories name verification class: `test/architecture`, `test/product`, `test/smoke`, `test/integration`.

**Symbols:**
- Public experimental exports must be named with `experimental*` or `Experimental*` from `src/experimental.ts`.
- Authority-bearing symbols should keep exact domain names such as `ActionContract`, `PolicyDecision`, `Greenlight`, `GatewayCheckAttempt`, `VerifiedGatewayCheck`, `DelegatedAuthorityRef`, and `GatewayCredentialRef`.
- Do not introduce broad names such as `Passport`, `Session`, `Approval`, or `Auth` as authority records unless they map to an existing exact protocol primitive.

## Where to Add New Code

**New Protocol Primitive:**
- Primary code: `src/protocol/areas/<primitive>/`
- Required files: `schemas.ts`, `inputs.ts` when needed, `transitions.ts`, `index.ts`, and focused helper modules.
- Kernel wiring: `src/protocol/kernel.ts`
- Store impact: `src/protocol/store/port.ts`, `src/storage/memory/index.ts`, `src/storage/d1/index.ts`, `migrations/0001_protocol_kernel.sql` if durable state changes.
- Tests: focused protocol tests plus `test/architecture/import-posture.test.ts` updates when import posture changes.

**New Gateway-Enforced Action Family:**
- Primary code: existing or new protocol records under `src/protocol/areas/*`; gateway logic under `src/adapters/<family>/gateway.ts`.
- Runtime proposal support: `src/runtime/ingress/families.ts`, `src/runtime/ingress/registry.ts`, `src/runtime/ingress/index.ts` if the family can be detected from runtime observations.
- HTTP route support: `src/http/routes/transition-route-registry.ts`, `src/http/routes/transition-invokers.ts` if a new transition is needed.
- Tests: adapter tests, protocol gateway tests, product demo tests, and architecture boundary tests.

**New Projection or Read Model:**
- Primary code: `src/protocol/evidence-projections/`
- HTTP route: `src/http/routes/evidence-read-route-registry.ts`
- Handler: `src/http/handlers/evidence-read.ts` or `src/http/handlers/internal-record-read.ts`
- Tests: projection tests and `test/architecture/import-posture.test.ts` to keep read models out of authority imports.

**Passport/Admission/Service Gateway Simplification:**
- Passport readback should be added as a projection over `ParticipantIdentityBinding`, `OperatingEnvelope`, `ActionContract`, `DelegatedAuthorityRef`, `GatewayRegistryEntry`, and `GatewayCredentialRef`.
- Admission changes belong in `src/http/admission/index.ts` and route metadata under `src/http/routes/*`; they must not create greenlights or mutation authority.
- Service gateway language should map to `src/protocol/areas/catalog-envelope/schemas.ts`, `src/protocol/areas/credential-custody/*`, `src/protocol/areas/gateway-gate/*`, and adapter gateway files before adding new protocol state.
- Principal-agent link changes belong in `src/protocol/areas/catalog-envelope/schemas.ts`, `src/protocol/areas/action-contract/schemas.ts`, and `src/protocol/areas/delegated-authority/schemas.ts`.

**New CLI Command:**
- Primary code: `src/cli/`
- Command contract: `src/cli/command-manifest.ts`
- Tests: CLI/product tests plus architecture checks if command claims authority.

**New MCP Tool:**
- Primary code: `src/mcp/`
- Public package/server metadata: `src/mcp/server.json`, `package.json` exports if needed.
- Tests: MCP/package-surface tests and claim-boundary tests.

**New SDK Client Capability:**
- Primary code: `src/sdk/role-clients.ts`
- Package export: `package.json` subpath export if public.
- Tests: SDK tests plus `test/architecture/root-exports.test.ts` and `test/architecture/package-surface.test.ts` when exports change.

**New Example:**
- Primary code: `examples/<name>/`
- Output posture: generated outputs under `examples/<name>/output/` with only `.gitignore` tracked unless product tests require fixtures.
- Tests: `test/product/*` and `scripts/check-example-outputs.mjs` updates when generated output contracts matter.

**Utilities:**
- Protocol-only utilities: `src/protocol/utils/`
- HTTP-only utilities: `src/http/`
- Script-only utilities: `scripts/`
- Do not place shared authority logic in examples, CLI, MCP, SDK, or surfaces.

## Special Directories

**`dist/`:**
- Purpose: Build output published by package scripts.
- Generated: Yes
- Committed: No

**`examples/*/output/`:**
- Purpose: Generated demo packets such as JSON/Markdown readbacks.
- Generated: Yes
- Committed: Only `.gitignore` files are tracked unless a test deliberately adds a stable fixture.

**`.planning/`:**
- Purpose: GSD scratch plans and codebase maps.
- Generated: Yes
- Committed: Some codebase maps may be tracked, but they are not canonical product truth.

**`docs/internal/`:**
- Purpose: Durable product, protocol, and architecture canon.
- Generated: No
- Committed: Yes

**`migrations/`:**
- Purpose: Durable D1 schema for protocol storage.
- Generated: No
- Committed: Yes

**`.github/workflows/`:**
- Purpose: Repository CI quality gates.
- Generated: No
- Committed: Yes

**`.gstack/`, `.strategy/`, `.cursor/`:**
- Purpose: Local agent/tooling metadata if present.
- Generated: Yes
- Committed: No current tracked files detected.

---

*Structure analysis: 2026-05-25*
