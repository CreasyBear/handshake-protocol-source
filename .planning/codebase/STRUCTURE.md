# Codebase Structure

**Analysis Date:** 2026-05-29

## Directory Layout

```text
handshake-protocol-kernel/
├── AGENTS.md                 # Product invariants and doctrine
├── README.md                 # Repo orientation and commands
├── QUALITY.md                # TypeScript quality rules
├── STRUCTURE.md              # Canonical ownership map (repo root)
├── package.json              # Exports, bins, scripts (v0.2.7)
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
│   ├── protocol/             # Kernel and areas (authority)
│   ├── http/                 # Hono app, mutation manifest, routes
│   ├── runtime/              # Ingress and proposal helpers
│   ├── adapters/             # Reference gateway fixtures
│   ├── adapter-sdk/          # Adapter authoring contracts
│   ├── conformance/          # Reference conformance probes
│   ├── storage/              # ProtocolStore implementations
│   ├── hosted-admission/     # Hosted caller evidence contracts
│   ├── sdk/                  # HTTP client and role clients
│   ├── cli/                  # Command manifest and handlers
│   │   └── service-operator/ # Service-operator bootstrap (Phase 05)
│   ├── mcp/                  # MCP catalog, resources, stdio
│   ├── surfaces/             # Product readbacks and proof packets
│   ├── x402-protected-tool/  # Packaged x402 facade export
│   └── install/              # Install proposal compiler helpers
├── test/                     # Mirrors src ownership (no loose root tests)
├── docs/internal/            # Compact canonical docs + integrator parity
├── examples/                 # Reference rooms and workflows
└── scripts/                  # Release and proof-packet builders
```

## Directory Purposes

**`src/protocol/`:**
- Purpose: Authority state machine, schemas, transitions, store port, navigation metadata, failure taxonomy
- Contains: `kernel.ts`, `areas/*`, `foundation/*` (including `failure-class/`), `events/*`, `public/*`, `evidence-projections/*`, `navigation/*`
- Key files: `src/protocol/kernel.ts`, `src/protocol/navigation/index.ts`, `src/protocol/store/port.ts`, `src/protocol/foundation/failure-class/index.ts`
- Lane doc: `src/protocol/LANE.md` — must not import HTTP, SDK, adapters, storage impls, surfaces

**`src/http/`:**
- Purpose: Transport only — routes, admission, read-only handlers, OpenAPI, dual-enforcement guards
- Contains: `app.ts`, `mutation-route-manifest.ts`, `routes/`, `handlers/`, `admission/` (including `transition-sequence-matrix.ts`), `errors/`, `openapi/`
- Key files: `src/http/app.ts`, `src/http/mutation-route-manifest.ts`, `src/http/routes/transition-route-registry.ts`, `src/http/routes/transition-invokers.ts`
- Lane doc: `src/http/LANE.md` — handlers are read-only; no protocol meaning

**`src/runtime/`:**
- Purpose: Observer/compiler lane for generated execution and ingress dispatch
- Contains: `ingress/`, `codemode-multi-action/`, per-family folders (`x402-payment/` via adapters, `package-install/`, etc.)
- Key files: `src/runtime/ingress/index.ts`, `src/runtime/ingress/families.ts`
- Lane doc: `src/runtime/LANE.md` — no policy, greenlight, gateway check, or mutation

**`src/adapters/`:**
- Purpose: Reference gateways and activation profiles; mutation after verified gate; gateway-held custody
- Contains: `x402-payment/` (`wallet-gateway.ts`), `x402-wallet-gateway/`, `package-install/`, `repo-write/`, `auth-md/`, `http-profile/`, etc.
- Key files: `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/protected-tool-facade/index.ts`
- Lane doc: `src/adapters/LANE.md` — mutation only after `VerifiedGatewayCheck`

**`src/storage/`:**
- Purpose: Persist protocol records and stream commits
- Contains: `memory/`, `d1/`, `kv/`, `store.ts` re-exports
- Key files: `src/storage/d1/index.ts`, `src/storage/memory/index.ts`
- Lane doc: `src/storage/LANE.md`

**`src/sdk/`:**
- Purpose: Typed HTTP ergonomics; integrator-parity role clients; failure-class remediation
- Contains: `client.ts`, `surface-clients/`, `transport-url.ts`, `repair.ts`
- Key files: `src/sdk/client.ts`, `src/sdk/surface-clients/index.ts`, `src/sdk/repair.ts`
- Lane doc: `src/sdk/LANE.md`

**`src/cli/`:**
- Purpose: Local operator commands, evidence views, service-operator bootstrap, x402 install/doctor/simulate
- Contains: `main.ts`, `command-manifest.ts`, `service-operator/`, grouped subfolders (`x402/`, `evidence/`, `host/`, etc.)
- Key files: `src/cli/main.ts`, `src/cli/command-manifest.ts`, `src/cli/service-operator/bootstrap.ts`
- Lane doc: `src/cli/LANE.md` — evidence/posture only; command id `service.bootstrap` (aliases: `service bootstrap`)

**`src/mcp/`:**
- Purpose: MCP tools/resources; stdio process in `mcp/stdio/`; FailureClass on tool outcomes
- Key files: `src/mcp/stdio/server.ts`, `src/mcp/catalog.ts`, `src/mcp/x402-proposal.ts`, `src/mcp/output.ts`
- Lane doc: `src/mcp/LANE.md`

**`src/surfaces/`:**
- Purpose: Non-authority manifests, service workflow projections, A2A readback, proof packets, product-completion gates
- Key files: `src/surfaces/boundary-manifest.ts`, `src/surfaces/proof-packets/index.ts`, `src/surfaces/proof-packets/product-completion.ts`
- Lane doc: `src/surfaces/LANE.md`

**`src/hosted-admission/`:**
- Purpose: Provider-neutral hosted caller identity and verifier adapter shapes
- Key files: `src/hosted-admission/hosted-caller-identity.ts`, `src/hosted-admission/hosted-verifier-adapter.ts`
- Exported via `./hosted-admission` package subpath only
- Lane doc: `src/hosted-admission/LANE.md`

**`src/x402-protected-tool/`:**
- Purpose: Stable npm subpath for x402 protected-tool facade and host activation descriptors
- Re-exports from `src/adapters/x402-payment/` and `src/surfaces/`
- Lane doc: `src/x402-protected-tool/LANE.md`

**`test/`:**
- Purpose: Guard architecture, protocol invariants, integration E2E, product readbacks, dual-enforcement
- Layout: One subdirectory per concern; no `test/*.test.ts` at root
- Key architecture tests: `test/architecture/http-handler-mutation-gating.test.ts`, `test/architecture/dual-enforcement-posture.test.ts`, `test/architecture/integrator-parity.test.ts`, `test/architecture/import-posture.test.ts`

## Key File Locations

**Entry Points:**
- `src/index.ts`: Public package surface (app factory, SDK, schemas, verifier helpers)
- `src/worker.ts`: Deployed Worker → `createApp()`
- `src/cli/main.ts`: `runCliCommand()` dispatch
- `src/mcp/stdio/server.ts`: `createHandshakeMcpStdioServer()`
- `bin/handshake`, `bin/handshake-mcp`: Thin Node launchers

**Configuration:**
- `package.json`: Version 0.2.7, exports, engine, test scripts
- `wrangler.toml`: Worker name, D1/KV bindings
- `migrations/`: D1 tables for protocol storage
- `server.json`: MCP registry discoverability metadata (proof gap until verified)

**Core Logic:**
- `src/protocol/kernel.ts`: All transition methods
- `src/protocol/areas/gateway-gate/transitions.ts`: Gateway enforcement transition
- `src/protocol/areas/policy-greenlight/transitions.ts`: Policy / greenlight
- `src/protocol/areas/intent-compilation/candidate-decision.ts`: CandidateAction derivation
- `src/protocol/areas/action-contract/transitions.ts`: Contract proposal
- `src/protocol/foundation/failure-class/index.ts`: Cross-surface failure taxonomy
- `src/http/mutation-route-manifest.ts`: Frozen POST inventory + parity guard
- `src/http/admission/transition-sequence-matrix.ts`: Prerequisite route matrix
- `src/http/routes/transition-invokers.ts`: HTTP → kernel wiring
- `src/adapters/x402-payment/wallet-gateway.ts`: Gateway-held signing custody (D-64)

**Testing:**
- `test/protocol/`: Kernel and area unit tests
- `test/http/`: Route and admission tests
- `test/integration/`: D1/HTTP E2E (e.g. `x402-d1-http.test.ts`)
- `test/architecture/`: Import posture, CLI manifest, dual-enforcement, integrator parity, mutation gating
- `test/adapters/`: Gateway fixture and activation tests (including `x402-wallet-gateway.test.ts`)
- `test/product/`: A2A readback and hosted consumer scenarios
- `test/sdk/role-clients-walkthrough.test.ts`: Integrator parity client composition

## Naming Conventions

**Files:**
- Area modules: `transitions.ts`, `schemas.ts`, `inputs.ts`, `guards.ts`, `index.ts` under `src/protocol/areas/<area>/`
- HTTP: `*-route-registry.ts`, `transition-invokers.ts`, `*-scope-resolvers.ts`, `mutation-route-manifest.ts` under `src/http/`
- Tests: `*.test.ts` colocated under `test/<lane>/` matching `src/<lane>/`
- Lane docs: `LANE.md` at first-level `src/*` folders (authority owner, allowed/forbidden imports)

**Directories:**
- Protocol primitives: `src/protocol/areas/<snake-case-area>/`
- Adapters by proof profile: `src/adapters/<profile-name>/`
- CLI by command group: `src/cli/<group>/` (e.g. `x402/`, `service-operator/`, `host/`)
- Surfaces by product readback: `src/surfaces/<surface-name>/`

**Types and IDs:**
- Digest fields: `sha256:<hex>` (see gateway and contract code)
- Version literals: `handshake.<domain>.<artifact>.v1` style constants per module
- Action class wedge: `x402_payment.exact` in contracts and integration fixtures
- FailureClass evidence refs (MCP): `taxonomy:failureClass/<class>` via `mcpFailureClassEvidenceRef`

## Where to Add New Code

**New protocol transition or record type:**
- Schemas/inputs: `src/protocol/areas/<new-area>/` (or extend existing area)
- Transition implementation: `src/protocol/areas/<area>/transitions.ts`
- Register on kernel: `src/protocol/kernel.ts`
- Navigation metadata (+ integrator-parity tag if applicable): `src/protocol/navigation/index.ts`
- Public aggregation: `src/protocol/public/schemas.ts` and `inputs.ts`
- Failure classification: extend `src/protocol/foundation/reason-codes.ts` if new reason codes
- HTTP route: `src/http/routes/transition-route-registry.ts` + invoker in `transition-invokers.ts`
- Mutation manifest row: `src/http/mutation-route-manifest.ts` (`routeFamilyById` + `requiresAdapterGatewayCheck: true`)
- Sequence matrix entry: `src/http/admission/transition-sequence-matrix.ts`
- Tests: `test/protocol/<area>.test.ts`, update `test/protocol/transition-matrix.test.ts` if applicable

**New HTTP evidence read route:**
- Handler logic: `src/http/handlers/evidence-read.ts` or dedicated handler (must stay on read-only allowlist)
- Registry: `src/http/routes/evidence-read-route-registry.ts`
- Projection source: `src/protocol/evidence-projections/`
- Tests: `test/http/`, update `test/architecture/http-handler-mutation-gating.test.ts` allowlist if new handler file

**New runtime ingress family (generated execution):**
- Family config schema: `src/runtime/ingress/families.ts` and `schemas.ts`
- Adapter proposal config: `src/adapters/<family>/action-proposal.ts`
- Wire in `RuntimeIngressConfigSchema` in `src/runtime/ingress/index.ts`
- Tests: `test/runtime/` and integration under `test/integration/`

**New reference gateway / adapter proof profile:**
- Implementation: `src/adapters/<profile>/`
- Export `run*Gateway` runner; keep mutation behind post-`gatewayCheck` helpers
- Do not import from `src/protocol/areas` transitions into HTTP handlers
- Conformance (optional): `src/conformance/<profile>/`
- Tests: `test/adapters/`, `test/integration/`
- If example runner mutates: add to `mutationExampleRunners` in `test/architecture/http-handler-mutation-gating.test.ts`
- Experimental export only if intentional: `src/experimental.ts`

**New CLI command:**
- Handler: `src/cli/<group>/<command>.ts`
- Manifest entry: `src/cli/command-manifest.ts`
- Dispatch branch: `src/cli/main.ts`
- Tests: `test/cli/cli-*.test.ts`, `test/architecture/cli-command-posture.test.ts`

**New service-operator command:**
- Place under `src/cli/service-operator/` (not legacy host-only naming for service API lane)
- Follow `service.bootstrap` pattern in `src/cli/command-manifest.ts`
- Reference: `docs/internal/service-operator-runbook.md`, `docs/internal/golden-paths/service-operator-golden-path.md`

**New MCP tool or resource:**
- Tool/resource definition: `src/mcp/catalog.ts`, `src/mcp/resources.ts`
- FailureClass wiring: `src/mcp/output.ts` via `classifyFailureClassFromReasonCodes`
- Stdio registration: `src/mcp/stdio/server.ts`
- Tests: `test/mcp/`

**New SDK surface client:**
- Client module: `src/sdk/surface-clients/<role>.ts`
- Export: `src/sdk/surface-clients/index.ts`
- Boundary row: `src/surfaces/boundary-manifest.ts`
- Integrator parity table (if operator TTHW): `docs/internal/integrator-parity-transitions.md`
- Tests: `test/sdk/`, `test/architecture/integrator-parity.test.ts` if parity transition

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
- FailureClass: ensure `hosted_admission` / `stale_admission` classification in `src/protocol/foundation/failure-class/index.ts`
- Tests: `test/http/hosted-identity-evidence.test.ts` (or adjacent)

## Special Directories

**`.planning/`:**
- Purpose: GSD scratch (codebase maps, phase plans) — gitignored but force-addable for agent artifacts
- Generated: By planning agents
- Committed: Optional; not canonical over repo `STRUCTURE.md` / `docs/internal/` / tests

**`docs/internal/`:**
- Purpose: Compact protocol and product decisions, operator runbooks, integrator parity
- Key: `docs/internal/decisions.md`, `docs/internal/integrator-parity-transitions.md`, `docs/internal/service-operator-runbook.md`, `docs/internal/host-operator-runbook.md`
- Committed: Yes — canonical with source and CI

**`examples/`:**
- Purpose: Reference rooms (e.g. `examples/service-operator-bootstrap/`), x402 spend, external-adapter-sdk
- Committed: Yes — not imported by kernel at runtime; mutation runners guarded by architecture tests

**`scripts/`:**
- Purpose: Release proof, publish handoff, product-completion checks (`scripts/check-product-completion.mjs`)
- Committed: Yes — invoked from `package.json` scripts

**`dist/`:**
- Purpose: Built ESM output for npm
- Generated: Yes (`npm run build`)
- Committed: No (publish artifact)

## Test Placement Rules

- Mirror `src/` lane under `test/<lane>/`
- Architecture invariants: `test/architecture/` (import posture, exports, CLI manifest, dual-enforcement, mutation gating, integrator parity)
- End-to-end with D1: `test/integration/`
- Never add loose `test/foo.test.ts` at repository root

## Dual-Enforcement Maintenance Checklist

When adding service API surface area (Phase 04–05 carry-forward):

1. Add POST transition to `src/http/routes/transition-route-registry.ts` + invoker
2. Mirror row in `src/http/mutation-route-manifest.ts` with `requiresAdapterGatewayCheck: true`
3. Add prerequisite entry to `src/http/admission/transition-sequence-matrix.ts`
4. Keep handlers read-only; mutation stays in adapters after `run*Gateway`
5. Update `docs/internal/service-operator-runbook.md` if operator-facing
6. Run `test/architecture/http-handler-mutation-gating.test.ts` and `test/architecture/dual-enforcement-posture.test.ts`

## Package Subpath Guidance

When exposing new public API, add an `exports` entry in `package.json` and a built file under `dist/`. Curate `src/index.ts` only for core kernel/HTTP/SDK surface. Keep adapter fixtures on `./experimental` or dedicated subpaths — not the default import. Integrator-parity clients export via `./sdk/role-clients`.

## Folder Discipline (from repo `STRUCTURE.md`)

- More than three TypeScript files in a folder → add `index.ts` public face
- No more than seven loose `.ts` files per folder (excluding `index.ts`)
- New protocol areas live under `src/protocol/areas/*`, not loose files under `src/protocol/`
- Each first-level `src/*` lane should maintain `LANE.md` with authority owner and forbidden imports
- Kernel must not depend on surfaces; surfaces create no authority — dependency flows inward toward `src/protocol/`

## LANE.md Boundary Convention

Fifteen lane docs under `src/*/LANE.md` (and `src/protocol/areas/negotiation/LANE.md`) define:

| Field | Purpose |
|-------|---------|
| Authority owner | What this lane may decide or enforce |
| Current proof claim | Honest scope of what the lane proves |
| Allowed imports | Upstream dependencies permitted |
| Forbidden imports | Lanes that would create authority leakage |
| Guarding tests | Architecture tests that enforce the boundary |
| Public surface | What npm subpaths or bins expose |

Authority enforcement for protected mutation always terminates at `src/protocol/areas/gateway-gate/transitions.ts`; adapters execute only after that transition passes.

---

*Structure analysis: 2026-05-29*
