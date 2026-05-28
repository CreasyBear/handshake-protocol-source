# Codebase Structure

**Analysis Date:** 2026-05-28

## Directory Layout

```text
handshake-protocol-kernel/
├── AGENTS.md                 # Product invariants and doctrine
├── README.md                 # Repo orientation and commands
├── QUALITY.md                # TypeScript quality rules
├── STRUCTURE.md              # Canonical ownership map (repo root)
├── package.json              # Exports, bins, scripts
├── bin/
│   ├── handshake             # CLI entry wrapper
│   └── handshake-mcp         # MCP stdio entry wrapper
├── migrations/               # Canonical D1 schema
├── wrangler.toml             # Worker bindings
├── server.json               # MCP Registry metadata
├── src/
│   ├── index.ts              # Curated package exports
│   ├── experimental.ts       # Reference adapter exports
│   ├── worker.ts             # Cloudflare Worker entry
│   ├── protocol/             # Kernel and areas
│   ├── http/                 # Hono app and routes
│   ├── runtime/              # Ingress and proposal helpers
│   ├── adapters/             # Reference gateway fixtures
│   ├── adapter-sdk/          # Adapter authoring contracts
│   ├── conformance/          # Reference conformance probes
│   ├── storage/              # ProtocolStore implementations
│   ├── hosted-admission/     # Hosted caller evidence contracts
│   ├── sdk/                  # HTTP client and role clients
│   ├── cli/                  # Command manifest and handlers
│   ├── mcp/                  # MCP catalog, resources, stdio
│   ├── surfaces/             # Product readbacks and proof packets
│   ├── x402-protected-tool/  # Packaged x402 facade export
│   └── install/              # Install proposal compiler helpers
├── test/                     # Mirrors src ownership (no loose root tests)
├── docs/internal/            # Compact canonical docs
├── examples/                 # Reference rooms and workflows
└── scripts/                  # Release and proof-packet builders
```

## Directory Purposes

**`src/protocol/`:**
- Purpose: Authority state machine, schemas, transitions, store port, navigation metadata
- Contains: `kernel.ts`, `areas/*`, `foundation/*`, `events/*`, `public/*`, `evidence-projections/*`
- Key files: `src/protocol/kernel.ts`, `src/protocol/navigation/index.ts`, `src/protocol/store/port.ts`

**`src/http/`:**
- Purpose: Transport only — routes, admission, handlers, OpenAPI
- Contains: `app.ts`, `routes/`, `handlers/`, `admission/`, `errors/`, `openapi/`
- Key files: `src/http/app.ts`, `src/http/routes/transition-route-registry.ts`, `src/http/routes/transition-invokers.ts`

**`src/runtime/`:**
- Purpose: Observer/compiler lane for generated execution and ingress dispatch
- Contains: `ingress/`, per-family folders (`x402-payment/`, `package-install/`, etc.)
- Key files: `src/runtime/ingress/index.ts`

**`src/adapters/`:**
- Purpose: Reference gateways and activation profiles; mutation after verified gate
- Contains: `x402-payment/`, `x402-wallet-gateway/`, `package-install/`, `repo-write/`, `auth-md/`, etc.
- Key files: `src/adapters/x402-payment/protected-tool-facade/index.ts`

**`src/storage/`:**
- Purpose: Persist protocol records and stream commits
- Contains: `memory/`, `d1/`, `kv/`, `store.ts` re-exports
- Key files: `src/storage/d1/index.ts`, `src/storage/memory/index.ts`

**`src/sdk/`:**
- Purpose: Typed HTTP ergonomics; no authority inference
- Contains: `client.ts`, `surface-clients/`, `transport-url.ts`, `repair.ts`
- Key files: `src/sdk/client.ts`, `src/sdk/surface-clients/index.ts`

**`src/cli/`:**
- Purpose: Local operator commands, evidence views, x402 install/doctor/simulate
- Contains: `main.ts`, `command-manifest.ts`, grouped subfolders (`x402/`, `evidence/`, `host/`, etc.)
- Key files: `src/cli/main.ts`, `src/cli/command-manifest.ts`

**`src/mcp/`:**
- Purpose: MCP tools/resources; stdio process in `mcp/stdio/`
- Key files: `src/mcp/stdio/server.ts`, `src/mcp/catalog.ts`, `src/mcp/x402-proposal.ts`

**`src/surfaces/`:**
- Purpose: Non-authority manifests, service workflow projections, A2A readback, proof packets
- Key files: `src/surfaces/boundary-manifest.ts`, `src/surfaces/proof-packets/index.ts`

**`src/hosted-admission/`:**
- Purpose: Provider-neutral hosted caller identity and verifier adapter shapes
- Exported only via `./hosted-admission` package subpath

**`src/x402-protected-tool/`:**
- Purpose: Stable npm subpath for x402 protected-tool facade and host activation descriptors
- Re-exports from `src/adapters/x402-payment/` and `src/surfaces/`

**`test/`:**
- Purpose: Guard architecture, protocol invariants, integration E2E, product readbacks
- Layout: One subdirectory per concern; no `test/*.test.ts` at root

## Key File Locations

**Entry Points:**
- `src/index.ts`: Public package surface (app factory, SDK, schemas, verifier helpers)
- `src/worker.ts`: Deployed Worker → `createApp()`
- `src/cli/main.ts`: `runCliCommand()` dispatch
- `src/mcp/stdio/server.ts`: `createHandshakeMcpStdioServer()`
- `bin/handshake`, `bin/handshake-mcp`: Thin Node launchers

**Configuration:**
- `package.json`: Version, exports, engine, test scripts
- `wrangler.toml`: Worker name, D1/KV bindings
- `migrations/`: D1 tables for protocol storage
- `server.json`: MCP registry discoverability metadata (proof gap until verified)

**Core Logic:**
- `src/protocol/kernel.ts`: All transition methods
- `src/protocol/areas/gateway-gate/transitions.ts`: Gateway enforcement transition
- `src/protocol/areas/policy-greenlight/transitions.ts`: Policy / greenlight
- `src/protocol/areas/action-contract/transitions.ts`: Contract proposal
- `src/http/routes/transition-invokers.ts`: HTTP → kernel wiring

**Testing:**
- `test/protocol/`: Kernel and area unit tests
- `test/http/`: Route and admission tests
- `test/integration/`: D1/HTTP E2E (e.g. `x402-d1-http.test.ts`)
- `test/architecture/`: Import posture, CLI manifest, package surface, lane rules
- `test/adapters/`: Gateway fixture and activation tests
- `test/product/`: A2A readback and hosted consumer scenarios

## Naming Conventions

**Files:**
- Area modules: `transitions.ts`, `schemas.ts`, `inputs.ts`, `guards.ts`, `index.ts` under `src/protocol/areas/<area>/`
- HTTP: `*-route-registry.ts`, `transition-invokers.ts`, `*-scope-resolvers.ts` under `src/http/routes/`
- Tests: `*.test.ts` colocated under `test/<lane>/` matching `src/<lane>/`
- Lane docs: `LANE.md` at first-level `src/*` folders (authority owner, allowed/forbidden imports)

**Directories:**
- Protocol primitives: `src/protocol/areas/<snake-case-area>/`
- Adapters by proof profile: `src/adapters/<profile-name>/`
- CLI by command group: `src/cli/<group>/` (e.g. `x402/`, `mcp/`, `host/`)
- Surfaces by product readback: `src/surfaces/<surface-name>/`

**Types and IDs:**
- Digest fields: `sha256:<hex>` (see gateway and contract code)
- Version literals: `handshake.<domain>.<artifact>.v1` style constants per module
- Action class wedge: `x402_payment.exact` in contracts and integration fixtures

## Where to Add New Code

**New protocol transition or record type:**
- Schemas/inputs: `src/protocol/areas/<new-area>/` (or extend existing area)
- Transition implementation: `src/protocol/areas/<area>/transitions.ts`
- Register on kernel: `src/protocol/kernel.ts`
- Navigation metadata: `src/protocol/navigation/index.ts`
- Public aggregation: `src/protocol/public/schemas.ts` and `inputs.ts`
- HTTP route: `src/http/routes/transition-route-registry.ts` + invoker in `transition-invokers.ts`
- Tests: `test/protocol/<area>.test.ts`, update `test/protocol/transition-matrix.test.ts` if applicable

**New HTTP evidence read route:**
- Handler logic: `src/http/handlers/evidence-read.ts` or dedicated handler
- Registry: `src/http/routes/evidence-read-route-registry.ts`
- Projection source: `src/protocol/evidence-projections/`
- Tests: `test/http/`

**New runtime ingress family (generated execution):**
- Family config schema: `src/runtime/ingress/families.ts` and `schemas.ts`
- Adapter proposal config: `src/adapters/<family>/action-proposal.ts`
- Wire in `RuntimeIngressConfigSchema` in `src/runtime/ingress/index.ts`
- Tests: `test/runtime/` and integration under `test/integration/`

**New reference gateway / adapter proof profile:**
- Implementation: `src/adapters/<profile>/`
- Keep mutation behind post-`gatewayCheck` helpers; do not import from `src/protocol/areas` transitions into HTTP
- Conformance (optional): `src/conformance/<profile>/`
- Tests: `test/adapters/`, `test/integration/`
- Experimental export only if intentional: `src/experimental.ts`

**New CLI command:**
- Handler: `src/cli/<group>/<command>.ts`
- Manifest entry: `src/cli/command-manifest.ts`
- Dispatch branch: `src/cli/main.ts`
- Tests: `test/cli/cli-*.test.ts`, `test/architecture/cli-command-posture.test.ts`

**New MCP tool or resource:**
- Tool/resource definition: `src/mcp/catalog.ts`, `src/mcp/resources.ts`
- Stdio registration: `src/mcp/stdio/server.ts`
- Tests: `test/mcp/`

**New SDK surface client:**
- Client module: `src/sdk/surface-clients/<role>.ts`
- Export: `src/sdk/surface-clients/index.ts`
- Boundary row: `src/surfaces/boundary-manifest.ts`
- Tests: `test/sdk/`

**New product readback / proof packet:**
- Projection assembler: `src/surfaces/<name>/`
- Must not call kernel transitions that create greenlights or gateway checks
- Tests: `test/product/` or `test/architecture/proof-packets.test.ts`

**New storage backend or index:**
- Implement `ProtocolStore` in `src/storage/<backend>/`
- Resolve in `src/http/store/resolution.ts`
- Schema migration in `migrations/` if D1
- Tests: `test/storage/`

**New hosted admission field:**
- Types/adapters: `src/hosted-admission/`
- HTTP admission wiring: `src/http/admission/hosted-verifier-adapter.ts`, `hosted-caller-identity.ts`
- Tests: `test/http/hosted-identity-evidence.test.ts` (or adjacent)

## Special Directories

**`.planning/`:**
- Purpose: GSD scratch (codebase maps, macro plans)
- Generated: By planning agents
- Committed: Often yes, but not canonical over `STRUCTURE.md` / `docs/internal/` / tests

**`docs/internal/`:**
- Purpose: Compact protocol and product decisions
- Key: `docs/internal/decisions.md`, `docs/internal/protocol-kernel-architecture.md`
- Committed: Yes — canonical with source and CI

**`examples/`:**
- Purpose: Reference rooms (e.g. `examples/a2a-negotiated-x402-room/`), service workflow demos
- Committed: Yes — not imported by kernel at runtime

**`scripts/`:**
- Purpose: Release proof, publish handoff, architecture check helpers
- Committed: Yes — invoked from `package.json` scripts

**`dist/`:**
- Purpose: Built ESM output for npm
- Generated: Yes (`npm run build`)
- Committed: No (publish artifact)

## Test Placement Rules

- Mirror `src/` lane under `test/<lane>/`
- Architecture invariants: `test/architecture/` (import posture, exports, CLI manifest, proof packets)
- End-to-end with D1: `test/integration/`
- Never add loose `test/foo.test.ts` at repository root

## Package Subpath Guidance

When exposing new public API, add an `exports` entry in `package.json` and a built file under `dist/`. Curate `src/index.ts` only for core kernel/HTTP/SDK surface. Keep adapter fixtures on `./experimental` or dedicated subpaths — not the default import.

## Folder Discipline (from `STRUCTURE.md`)

- More than three TypeScript files in a folder → add `index.ts` public face
- No more than seven loose `.ts` files per folder (excluding `index.ts`)
- New protocol areas live under `src/protocol/areas/*`, not loose files under `src/protocol/`
- Each first-level `src/*` lane should maintain `LANE.md` with authority owner and forbidden imports

---

*Structure analysis: 2026-05-28*
