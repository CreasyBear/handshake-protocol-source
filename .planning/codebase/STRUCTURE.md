# Codebase Structure

**Analysis Date:** 2026-05-24

## Directory Layout

```text
[project-root]/
|-- AGENTS.md                         # Doctrine, invariants, and authority vocabulary
|-- README.md                         # Current repo orientation, command contract, package surface notes
|-- QUALITY.md                        # TypeScript quality, naming, and verification rules
|-- STRUCTURE.md                      # Canonical ownership map for active source/docs/tests
|-- package.json                      # npm package, exports, bins, scripts, dependencies
|-- server.json                       # MCP Registry metadata for local stdio MCP package
|-- wrangler.toml                     # Cloudflare Worker and D1/KV binding configuration
|-- bin/                              # Thin Node executable wrappers for bundled CLI/MCP bins
|-- docs/internal/                    # Compact canonical internal product and protocol docs
|-- examples/                         # Local proof/demo scripts and generated output folders
|-- migrations/                       # D1 schema for protocol reconstruction storage
|-- scripts/                          # Build, package, and published-entrypoint checks
|-- src/                              # TypeScript protocol kernel and bounded surfaces
|-- test/                             # Bun tests mirroring source ownership lanes
`-- .planning/codebase/               # Scratch codebase map documents written by GSD mapper agents
```

## Directory Purposes

**Root Canon:**
- Purpose: Keep compact repo truth and local command/package contract.
- Contains: `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `package.json`, `server.json`, `wrangler.toml`, `tsconfig.json`, `tsconfig.build.json`, `eslint.config.js`, `bun.lock`
- Key files: `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `package.json`, `server.json`

**`src/protocol/`:**
- Purpose: Own protocol meaning and Tier 1 authority primitives.
- Contains: `src/protocol/kernel.ts`, `src/protocol/areas/*`, `src/protocol/foundation/*`, `src/protocol/events/*`, `src/protocol/context/*`, `src/protocol/navigation/*`, `src/protocol/evidence-projections/*`, `src/protocol/public/*`, `src/protocol/store/*`
- Key files: `src/protocol/kernel.ts`, `src/protocol/LANE.md`, `src/protocol/public/inputs.ts`, `src/protocol/public/schemas.ts`, `src/protocol/store/port.ts`

**`src/protocol/areas/`:**
- Purpose: Own one protocol primitive per folder.
- Contains: `src/protocol/areas/action-contract/*`, `src/protocol/areas/policy-greenlight/*`, `src/protocol/areas/gateway-gate/*`, `src/protocol/areas/receipt-export/*`, `src/protocol/areas/proof-gap/*`, `src/protocol/areas/isolation-breaker/*`, `src/protocol/areas/runtime-evidence/*`, `src/protocol/areas/generated-execution-graph/*`, `src/protocol/areas/tool-call-draft/*`, `src/protocol/areas/intent-compilation/*`, `src/protocol/areas/credential-custody/*`
- Key files: `src/protocol/areas/action-contract/transitions.ts`, `src/protocol/areas/policy-greenlight/transitions.ts`, `src/protocol/areas/gateway-gate/transitions.ts`, `src/protocol/areas/object-registry/index.ts`

**`src/http/`:**
- Purpose: Own Hono/Worker transport, route metadata, caller admission, evidence reads, OpenAPI, errors, and store resolution.
- Contains: `src/http/app.ts`, `src/http/app-options.ts`, `src/http/admission/*`, `src/http/routes/*`, `src/http/handlers/*`, `src/http/errors/*`, `src/http/openapi/*`, `src/http/navigation/*`, `src/http/store/*`
- Key files: `src/http/app.ts`, `src/http/routes/transition-route-registry.ts`, `src/http/routes/transition-invokers.ts`, `src/http/routes/evidence-read-route-registry.ts`, `src/http/store/resolution.ts`

**`src/runtime/`:**
- Purpose: Own generated-execution and observed-dispatch proposal helpers; it does not issue authority.
- Contains: `src/runtime/ingress/index.ts`, `src/runtime/package-install/action-proposal.ts`, `src/runtime/repo-write/action-proposal.ts`, `src/runtime/preview-deploy/action-proposal.ts`, `src/runtime/codemode-multi-action/*`
- Key files: `src/runtime/index.ts`, `src/runtime/LANE.md`, `src/runtime/ingress/index.ts`

**`src/adapters/`:**
- Purpose: Own reference adapter profiles, gateway fixtures, bypass probes, upstream evidence intake, and action-specific install/proposal helpers.
- Contains: `src/adapters/auth-md/*`, `src/adapters/x402-payment/*`, `src/adapters/protected-path-probes/*`, `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, `src/adapters/preview-deploy/gateway.ts`, `src/adapters/downstream-failure-evidence.ts`
- Key files: `src/adapters/LANE.md`, `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/sandbox-http.ts`, `src/adapters/auth-md/gateway.ts`

**`src/install/`:**
- Purpose: Own generic install proposal and protected-action adapter-pack schemas.
- Contains: `src/install/install-proposal/index.ts`, `src/install/protected-action-adapter-pack/index.ts`, `src/install/index.ts`, `src/install/LANE.md`
- Key files: `src/install/install-proposal/index.ts`, `src/install/protected-action-adapter-pack/index.ts`

**`src/storage/`:**
- Purpose: Own protocol storage implementations and cache plumbing.
- Contains: `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `src/storage/memory/index.ts`, `src/storage/kv/index.ts`, `src/storage/store.ts`, `src/storage/LANE.md`
- Key files: `src/storage/d1/index.ts`, `src/storage/memory/index.ts`, `src/storage/kv/index.ts`

**`src/sdk/`:**
- Purpose: Own typed HTTP clients and role-scoped activation clients.
- Contains: `src/sdk/client.ts`, `src/sdk/surface-clients/runtime-client.ts`, `src/sdk/surface-clients/evidence-client.ts`, `src/sdk/surface-clients/transport.ts`, `src/sdk/surface-clients/index.ts`, `src/sdk/LANE.md`
- Key files: `src/sdk/client.ts`, `src/sdk/surface-clients/index.ts`, `src/sdk/surface-clients/runtime-client.ts`, `src/sdk/surface-clients/evidence-client.ts`

**`src/cli/`:**
- Purpose: Own local operator/evidence command manifest, JSON output envelopes, x402 setup/readiness commands, certificate verification wrapper, and APS rendering.
- Contains: `src/cli/main.ts`, `src/cli/index.ts`, `src/cli/command-manifest.ts`, `src/cli/output.ts`, `src/cli/aps-report.ts`, `src/cli/certificate.ts`, `src/cli/projection-evidence.ts`, `src/cli/support-bundle.ts`, `src/cli/local-project/*`, `src/cli/x402/*`
- Key files: `src/cli/main.ts`, `src/cli/command-manifest.ts`, `src/cli/output.ts`, `src/cli/x402/index.ts`

**`src/mcp/`:**
- Purpose: Own model-facing proposal/evidence schemas, read-only resource mapping, reference transcript, and local stdio server.
- Contains: `src/mcp/catalog.ts`, `src/mcp/x402-proposal.ts`, `src/mcp/resources.ts`, `src/mcp/output.ts`, `src/mcp/digest.ts`, `src/mcp/reference-transcript.ts`, `src/mcp/reference-transcript-fixtures.ts`, `src/mcp/stdio/*`, `src/mcp/LANE.md`
- Key files: `src/mcp/index.ts`, `src/mcp/catalog.ts`, `src/mcp/x402-proposal.ts`, `src/mcp/stdio/server.ts`, `src/mcp/stdio/entry.ts`

**`src/surfaces/`:**
- Purpose: Own source-level boundary manifests and shared non-authority outcome schemas for SDK, CLI, MCP, and deferred surfaces.
- Contains: `src/surfaces/boundary-manifest.ts`, `src/surfaces/outcome.ts`, `src/surfaces/LANE.md`
- Key files: `src/surfaces/boundary-manifest.ts`, `src/surfaces/outcome.ts`

**`src/conformance/`:**
- Purpose: Own source-package conformance helpers and intentional adapter-pack posture re-exports.
- Contains: `src/conformance/index.ts`, `src/conformance/LANE.md`
- Key files: `src/conformance/index.ts`

**`bin/`:**
- Purpose: Thin package executable wrappers.
- Contains: `bin/handshake`, `bin/handshake-mcp`
- Key files: `bin/handshake`, `bin/handshake-mcp`

**`examples/`:**
- Purpose: Local reference proof packets and generated evidence reports.
- Contains: `examples/self-hosted-activation/run.ts`, `examples/x402-protected-spend/run.ts`, `examples/mcp-reference-transcript/run.ts`, generated `output/` folders with `.gitignore`
- Key files: `examples/x402-protected-spend/run.ts`, `examples/self-hosted-activation/run.ts`, `examples/mcp-reference-transcript/run.ts`

**`test/`:**
- Purpose: Mirror ownership lanes with Bun tests and architecture gates.
- Contains: `test/architecture/*`, `test/protocol/*`, `test/runtime/*`, `test/http/*`, `test/sdk/*`, `test/cli/*`, `test/mcp/*`, `test/adapters/*`, `test/conformance/*`, `test/integration/*`, `test/product/*`, `test/support/*`
- Key files: `test/architecture/package-surface.test.ts`, `test/architecture/mcp-surface-posture.test.ts`, `test/architecture/cli-command-posture.test.ts`, `test/product/x402-protected-spend-demo-report.test.ts`

**`docs/internal/`:**
- Purpose: Compact canonical internal docs for durable decisions, protocol definition, architecture/schema map, plain-English translation, and protocol notes.
- Contains: `docs/internal/decisions.md`, `docs/internal/protocol-definition.md`, `docs/internal/protocol-kernel-architecture.md`, `docs/internal/protocol-layman.md`, `docs/internal/protocol-notes.md`, `docs/internal/tier-3-strategy/`
- Key files: `docs/internal/decisions.md`, `docs/internal/protocol-kernel-architecture.md`, `docs/internal/protocol-notes.md`

**`migrations/`:**
- Purpose: Own D1 durable protocol schema.
- Contains: `migrations/0001_protocol_kernel.sql`
- Key files: `migrations/0001_protocol_kernel.sql`

**`scripts/`:**
- Purpose: Own build and package-surface verification scripts.
- Contains: `scripts/build-package-bundles.mjs`, `scripts/check-package-surface.mjs`, `scripts/check-published-entrypoints.mjs`
- Key files: `scripts/check-package-surface.mjs`, `scripts/check-published-entrypoints.mjs`

**`.planning/`:**
- Purpose: Scratch planning and mapper artifacts.
- Contains: `.planning/codebase/*`, `.planning/macro/*`, `.planning/phases/*`, `.planning/tier2/*`, `.planning/strategy/*`, `.planning/x402-protocol/*`
- Key files: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`

## Key File Locations

**Entry Points:**
- `src/index.ts`: curated root package export surface.
- `src/experimental.ts`: explicit experimental reference gateway/profile export surface.
- `src/runtime/index.ts`: public `./runtime` package subpath for runtime proposal helpers.
- `src/sdk/surface-clients/index.ts`: public `./sdk/role-clients` package subpath.
- `src/cli/index.ts`: public `./cli` package subpath.
- `src/mcp/index.ts`: public `./mcp` package subpath.
- `src/conformance/index.ts`: public `./conformance` package subpath.
- `src/worker.ts`: Cloudflare Worker `fetch` entrypoint.
- `src/http/app.ts`: Hono app factory used by Worker, tests, SDK examples, and local demos.
- `src/cli/main.ts`: CLI command dispatcher and process entrypoint.
- `src/mcp/stdio/entry.ts`: MCP stdio process entrypoint.
- `bin/handshake`: Node wrapper for bundled CLI artifact.
- `bin/handshake-mcp`: Node wrapper for bundled MCP stdio artifact.

**Configuration:**
- `package.json`: package identity, version `0.2.4`, exports, bins, files, scripts, and dependency contract.
- `server.json`: MCP Registry metadata for `io.github.joelchan/handshake-protocol-kernel`.
- `wrangler.toml`: Worker main file and D1/KV bindings.
- `tsconfig.json`: TypeScript project config.
- `tsconfig.build.json`: declaration build config.
- `eslint.config.js`: lint config.
- `bun.lock`: Bun dependency lockfile.
- `migrations/0001_protocol_kernel.sql`: D1 table/index schema.

**Core Logic:**
- `src/protocol/kernel.ts`: transition facade.
- `src/protocol/events/records.ts`: canonical record and stream event commit helper.
- `src/protocol/store/port.ts`: store interface and commit contracts.
- `src/protocol/areas/action-contract/transitions.ts`: action contract proposal transition.
- `src/protocol/areas/policy-greenlight/transitions.ts`: policy decision and greenlight transition.
- `src/protocol/areas/gateway-gate/transitions.ts`: gateway check transition.
- `src/protocol/areas/intent-compilation/transitions.ts`: candidate construction and compiler refusal transition.
- `src/protocol/areas/generated-execution-graph/transitions.ts`: generated execution graph evidence transition.
- `src/protocol/evidence-projections/projections.ts`: redacted diagnostic evidence projections.
- `src/runtime/ingress/index.ts`: public runtime observed-dispatch proposal flow.
- `src/adapters/x402-payment/sandbox-http.ts`: local/reference paid-HTTP sandbox evidence path.
- `src/adapters/x402-payment/wallet-gateway.ts`: x402 wallet gateway fixture that signs only after verified gateway check.
- `src/surfaces/boundary-manifest.ts`: source-owned non-authority surface constraints.

**Testing:**
- `test/architecture/*`: repo shape, vocabulary, package surface, CLI/MCP posture, import posture, root exports.
- `test/protocol/*`: protocol primitive and state-machine invariants.
- `test/runtime/*`: runtime ingress and generated execution behavior.
- `test/http/*`: HTTP route and D1 behavior.
- `test/sdk/*`: role client behavior.
- `test/cli/*`: CLI command and local evidence behavior.
- `test/mcp/*`: MCP schema, proposal, resource redaction, and stdio process behavior.
- `test/adapters/*`: reference gateway and adapter-pack behavior.
- `test/integration/*`: end-to-end protected action paths.
- `test/product/*`: product proof packets such as x402 protected-spend report.
- `test/support/*`: fixtures and protocol test harnesses.

**Package Surface:**
- `package.json#exports`: root, `./conformance`, `./runtime`, `./sdk/role-clients`, `./cli`, `./mcp`, `./experimental`, and `./package.json`.
- `package.json#bin`: `handshake`, `handshake-mcp`, and package-name bin `handshake-protocol-kernel`.
- `package.json#files`: `bin`, `src`, `dist`, `server.json`, compact root docs, and `docs/internal/*`.
- `scripts/check-package-surface.mjs`: npm dry-run package inclusion/exclusion gate.
- `scripts/check-published-entrypoints.mjs`: bundled CLI and MCP stdio smoke check.
- `test/architecture/package-surface.test.ts`: source-level package shape guard.

## Naming Conventions

**Files:**
- Use protocol nouns for authority objects: `src/protocol/areas/action-contract/types.ts`, `src/protocol/areas/policy-greenlight/types.ts`, `src/protocol/areas/gateway-gate/types.ts`.
- Use `transitions.ts` for protocol write transitions: `src/protocol/areas/gateway-gate/transitions.ts`.
- Use `schemas.ts`, `types.ts`, `inputs.ts`, `guards.ts`, `artifacts.ts`, and `index.ts` within protocol areas when the folder owns those concepts.
- Use `action-proposal.ts` for runtime/adapter proposal helpers: `src/runtime/package-install/action-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`.
- Use `gateway.ts` or action-specific gateway names for mutation fixtures: `src/adapters/package-install/gateway.ts`, `src/adapters/x402-payment/wallet-gateway.ts`.
- Use `LANE.md` at first-level `src/*` ownership boundaries.

**Directories:**
- Use source lanes by ownership: `src/protocol`, `src/http`, `src/runtime`, `src/adapters`, `src/storage`, `src/sdk`, `src/cli`, `src/mcp`, `src/install`, `src/conformance`, `src/surfaces`.
- Use protocol area directories under `src/protocol/areas/<primitive-name>/`.
- Use test lane directories mirroring source lanes under `test/<lane>/`.
- Do not create generic buckets such as `utils`, `helpers`, `common`, `misc`, `stuff`, `manager`, or `service`.

**Exports:**
- First-level multi-file source folders need an `index.ts` public face, as enforced by `STRUCTURE.md` and `test/architecture/naming-posture.test.ts`.
- Root exports remain curated through `src/index.ts`; experimental adapters go through `src/experimental.ts`.
- MCP and CLI are subpath exports through `src/mcp/index.ts` and `src/cli/index.ts`, not root authority exports.

## Where to Add New Code

**New Protocol Primitive:**
- Primary code: `src/protocol/areas/<primitive>/`
- Public aggregation: `src/protocol/public/inputs.ts`, `src/protocol/public/schemas.ts`, and the primitive `index.ts` only when the primitive is intended outside its area.
- Kernel facade: `src/protocol/kernel.ts` only if the primitive becomes a transition.
- Tests: `test/protocol/<primitive>.test.ts` plus architecture import guards in `test/architecture/import-posture.test.ts`.

**New HTTP Transition:**
- Route metadata: `src/http/routes/transition-route-registry.ts`
- Invoker: `src/http/routes/transition-invokers.ts`
- Scope resolver: `src/http/routes/transition-scope-resolvers.ts`
- Response schema: `src/http/routes/transition-response-schemas.ts`
- Handler changes: `src/http/app.ts` only if route wiring pattern changes.
- Tests: `test/http/http.test.ts`, `test/http/d1-http.test.ts`, and architecture route/export guards.

**New Evidence Projection:**
- Projection logic: `src/protocol/evidence-projections/`
- HTTP route: `src/http/routes/evidence-read-route-registry.ts` and `src/http/handlers/evidence-read.ts`
- SDK read: `src/sdk/client.ts` and possibly `src/sdk/surface-clients/evidence-client.ts`
- MCP resource only if model-facing evidence is intentionally exposed: `src/mcp/resources.ts`, `src/mcp/catalog.ts`
- Tests: `test/protocol/evidence-projections.test.ts`, `test/http/http.test.ts`, `test/sdk/role-clients.test.ts`, `test/mcp/mcp-resource-redaction.test.ts`

**New Runtime Proposal Family:**
- Primary code: `src/runtime/<family>/action-proposal.ts` or a guarded branch inside `src/runtime/ingress/index.ts`
- Boundary rule: emit runtime evidence, graph evidence, tool-call drafts, intent compilations, action contracts, or refusals only.
- Tests: `test/runtime/<family>.test.ts` and `test/architecture/claim-boundary.test.ts`.

**New Adapter/Gateway Fixture:**
- Primary code: `src/adapters/<family>/`
- Gateway runner: `src/adapters/<family>/gateway.ts` or specific gateway file such as `src/adapters/x402-payment/wallet-gateway.ts`
- Install/proposal helper: `src/adapters/<family>/install-proposal.ts` or `src/adapters/<family>/action-proposal.ts`
- Bypass probes: `src/adapters/<family>/bypass-probes.ts` when protected-path posture is required.
- Conformance: `src/conformance/index.ts` only for intentional public conformance checks.
- Tests: `test/adapters/<family>*.test.ts`, `test/conformance/<family>*.test.ts`, `test/integration/<family>*.test.ts`.

**New x402 Sandbox/Evidence Work:**
- Primary code: `src/adapters/x402-payment/`
- Local/reference sandbox: `src/adapters/x402-payment/sandbox-http.ts`
- Official upstream evidence: `src/adapters/x402-payment/upstream-evidence.ts`
- Wallet gate/signing fixture: `src/adapters/x402-payment/wallet-gateway.ts`
- Demo proof packet: `examples/x402-protected-spend/run.ts`
- Tests: `test/adapters/x402-payment-action-proposal.test.ts`, `test/adapters/x402-wallet-gateway.test.ts`, `test/product/x402-protected-spend-demo-report.test.ts`

**New CLI Command:**
- Manifest: `src/cli/command-manifest.ts`
- Dispatch: `src/cli/main.ts`
- Output envelope: `src/cli/output.ts`
- Command implementation: `src/cli/<topic>.ts` or `src/cli/<topic>/index.ts`
- Tests: `test/cli/*` and `test/architecture/cli-command-posture.test.ts`
- Boundary rule: keep non-authority flags false and do not import gateway runners, storage internals, all-role clients, signer material, raw records, or protocol kernel internals.

**New MCP Tool or Resource:**
- Catalog: `src/mcp/catalog.ts`
- Tool implementation: `src/mcp/<action>-proposal.ts`
- Resource mapping: `src/mcp/resources.ts`
- Stdio wiring: `src/mcp/stdio/server.ts`
- Tests: `test/mcp/*` and `test/architecture/mcp-surface-posture.test.ts`
- Boundary rule: use `src/sdk/surface-clients` and `src/surfaces`; do not import `src/protocol/kernel.ts`, gateway transitions, adapters, storage, signer surfaces, receipt export, or authority-certificate minting.

**New SDK Role Client:**
- Primary code: `src/sdk/surface-clients/<role>-client.ts`
- Export: `src/sdk/surface-clients/index.ts`
- Transport: `src/sdk/surface-clients/transport.ts`
- Manifest boundary: `src/surfaces/boundary-manifest.ts`
- Tests: `test/sdk/role-clients.test.ts` and `test/architecture/surface-boundary-posture.test.ts`

**New Storage Implementation:**
- Store implementation: `src/storage/<backend>/`
- Store contract: `src/protocol/store/port.ts`
- Schema/migration: `migrations/` for durable SQL-backed state.
- Tests: storage-focused tests under `test/protocol/*`, `test/http/*`, or a new `test/storage/*` lane if introduced.
- Boundary rule: storage stores evidence and indexes; it must not interpret protocol meaning.

**Utilities:**
- Shared protocol helpers: `src/protocol/foundation/`
- Surface-only shared outcome helpers: `src/surfaces/`
- Do not add generic `utils`/`helpers` directories; place helpers in the owning lane.

## Special Directories

**`.planning/`:**
- Purpose: GSD scratch planning, macro, tier, strategy, and codebase-map artifacts.
- Generated: Yes
- Committed: May contain tracked scratch artifacts, but it is not repo truth.
- Boundary: Do not promote `.planning/*` names into source paths, package scripts, CI labels, README claims, or exported symbols.

**`.planning/codebase/`:**
- Purpose: Current mapper output consumed by GSD planning/execution commands.
- Generated: Yes
- Committed: Tracked in this checkout.
- Boundary: Only mapper docs should be edited here during codebase-map runs.

**`dist/`:**
- Purpose: Bundled Node artifacts and generated declaration files required by package checks after `npm run build`.
- Generated: Yes
- Committed: Not tracked in the current source file listing; package dry-run expects generated files after build.
- Boundary: Do not edit generated `dist/*` manually.

**`examples/*/output/`:**
- Purpose: Generated local demo outputs for self-hosted activation, MCP transcript, and x402 protected-spend report.
- Generated: Yes
- Committed: Output folders carry `.gitignore`; generated packet contents should not become canonical source.
- Boundary: Demos prove local/reference evidence, not hosted/provider/cross-org operation.

**`bin/`:**
- Purpose: Package bin wrappers for bundled Node entrypoints.
- Generated: No
- Committed: Yes
- Boundary: Keep wrappers thin; source logic belongs in `src/cli/main.ts` and `src/mcp/stdio/entry.ts`.

**Empty Local Placeholder Directories:**
- Purpose: Empty local directories are visible at `src/adapters/x402-wallet-gateway`, `src/conformance/x402-payment`, `src/runtime/consequence-ingress`, `src/runtime/x402-payment`, `src/sdk/activation`, and `test/install`.
- Generated: No source files present.
- Committed: No tracked files in current source listing.
- Boundary: Do not treat these as active ownership lanes until a file, manifest, and architecture test establish the boundary.

**Forbidden Secret Files:**
- Purpose: `.env`, `.env.*`, credential, key, certificate, and secret files are not part of this architecture map.
- Generated: Not applicable
- Committed: Must not be committed.
- Boundary: Note existence only if present; never read or quote contents.

---

*Structure analysis: 2026-05-24*
