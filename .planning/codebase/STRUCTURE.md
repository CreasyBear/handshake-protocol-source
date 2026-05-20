# Codebase Structure

**Analysis Date:** 2026-05-20

## Directory Layout

```text
[project-root]/
├── AGENTS.md                         # Product doctrine, invariants, and response posture
├── README.md                         # Current package orientation, install/use commands, and quality gates
├── QUALITY.md                        # TypeScript, naming, and quality rules
├── STRUCTURE.md                      # Canonical source/test/docs ownership map
├── package.json                      # Package exports, scripts, dependencies, Bun package manager
├── tsconfig.json                     # TypeScript compiler settings
├── eslint.config.js                  # ESLint flat config
├── wrangler.toml                     # Cloudflare Worker/D1/KV configuration
├── migrations/                       # D1 schema for protocol store atomicity
├── src/
│   ├── index.ts                      # Curated root package API
│   ├── experimental.ts               # Explicit experimental/reference adapter API
│   ├── worker.ts                     # Cloudflare Worker entry
│   ├── protocol/                     # Protocol kernel, transition areas, records, navigation, public schemas
│   ├── http/                         # Hosted HTTP app, route metadata, admission, evidence reads
│   ├── storage/                      # Memory, D1, and KV storage implementations
│   ├── runtime/                      # Runtime proposal helpers and generated program evidence helpers
│   ├── adapters/                     # Reference and experimental gateway fixtures/probes
│   ├── install/                      # Install proposal and protected action adapter pack types
│   ├── conformance/                  # Narrow conformance/proof helper surface
│   └── sdk/                          # Client SDK types and helpers
├── test/
│   ├── architecture/                 # Import, export, naming, and public surface posture tests
│   ├── protocol/                     # Protocol transition and invariant tests
│   ├── http/                         # HTTP route/admission/evidence tests
│   ├── storage/                      # Store parity and atomicity tests
│   ├── runtime/                      # Runtime helper tests
│   ├── adapters/                     # Reference adapter tests
│   ├── install/                      # Install proposal tests
│   └── sdk/                          # SDK tests
├── docs/
│   ├── internal/                     # Canonical protocol notes, definitions, architecture, decisions
│   ├── protocol/                     # Public-facing protocol walkthrough and integration docs
│   └── examples/                     # Example/reference documentation
├── examples/                         # Runnable/reference example code
└── .planning/                        # Scratch planning workspace, not repo-facing canon
```

## Directory Purposes

**Repository Canon:**
- Purpose: Define current product doctrine, package posture, source ownership, quality gates, and durable decisions.
- Contains: `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/decisions.md`, `docs/internal/protocol-definition.md`, `docs/internal/protocol-kernel-architecture.md`, `docs/internal/protocol-notes.md`.
- Key files: `AGENTS.md`, `README.md`, `STRUCTURE.md`, `docs/internal/protocol-kernel-architecture.md`.

**`src/protocol/`:**
- Purpose: Own the protocol kernel, transition areas, canonical record creation, store port, navigation map, public inputs/schemas, and evidence projections.
- Contains: `kernel.ts`, `store/port.ts`, `events/records.ts`, `navigation/index.ts`, `public/*`, `evidence-projections/*`, and `areas/*`.
- Key files: `src/protocol/kernel.ts`, `src/protocol/store/port.ts`, `src/protocol/events/records.ts`, `src/protocol/navigation/index.ts`, `src/protocol/areas/object-registry/index.ts`.

**`src/protocol/areas/`:**
- Purpose: Own protocol primitives by bounded area. Add protocol behavior here, not in HTTP, storage, runtime helpers, or adapters.
- Contains: `intent-compilation`, `action-contract`, `policy-greenlight`, `gateway-gate`, `operation-lifecycle`, `protected-path-posture`, `idempotency-ledger`, `isolation`, `object-registry`, `action-attempt-lifecycle`, and supporting protocol areas.
- Key files: `src/protocol/areas/intent-compilation/transitions.ts`, `src/protocol/areas/action-contract/transitions.ts`, `src/protocol/areas/policy-greenlight/transitions.ts`, `src/protocol/areas/gateway-gate/transitions.ts`, `src/protocol/areas/operation-lifecycle/transitions.ts`.

**`src/protocol/public/`:**
- Purpose: Provide public input parsers, schemas, and transition wrappers while hiding internal stored record shapes.
- Contains: `inputs.ts`, `schemas.ts`, `transitions.ts`.
- Key files: `src/protocol/public/inputs.ts`, `src/protocol/public/schemas.ts`, `src/protocol/public/transitions.ts`.

**`src/protocol/evidence-projections/`:**
- Purpose: Build redacted read-only evidence and review projections from committed protocol records.
- Contains: Projection builders and schemas.
- Key files: `src/protocol/evidence-projections/projections.ts`, `src/protocol/evidence-projections/schemas.ts`.

**`src/http/`:**
- Purpose: Host protocol transitions over HTTP without owning primitive semantics.
- Contains: Hono app creation, route definitions, transition invokers, admission, request context, evidence reads, internal raw record reads, OpenAPI helpers, and store resolution.
- Key files: `src/http/app.ts`, `src/http/routes/transition-route-registry.ts`, `src/http/routes/transition-invokers.ts`, `src/http/admission/index.ts`, `src/http/store/resolution.ts`.

**`src/storage/`:**
- Purpose: Implement `ProtocolStore` and support isolation caching.
- Contains: `memory/index.ts`, `d1/index.ts`, `d1/statements.ts`, `kv/index.ts`.
- Key files: `src/storage/memory/index.ts`, `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `src/storage/kv/index.ts`.

**`migrations/`:**
- Purpose: Own durable D1 schema for protocol records, authority indexes, event streams, current posture/state, and receipt indexes.
- Contains: SQL migration files.
- Key files: `migrations/0001_protocol_kernel.sql`.

**`src/runtime/`:**
- Purpose: Convert concrete runtime scenarios and generated program evidence into protocol proposals.
- Contains: Package install, repo write, preview deploy, and codemode multi-action helper lanes.
- Key files: `src/runtime/package-install/action-proposal.ts`, `src/runtime/repo-write/action-proposal.ts`, `src/runtime/preview-deploy/action-proposal.ts`, `src/runtime/codemode-multi-action/generated-program-runner.ts`, `src/runtime/codemode-multi-action/generated-graph-evidence.ts`.

**`src/adapters/`:**
- Purpose: Demonstrate reference gateway check-and-mutate patterns and protected-path probes. Keep provider/native enforcement claims out of this lane unless source-backed by a real provider gateway.
- Contains: Package install, repo write, preview deploy, protected-path probes, and x402 payment adapter fixtures.
- Key files: `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, `src/adapters/preview-deploy/gateway.ts`, `src/adapters/protected-path-probes/executor.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`.

**`src/install/`:**
- Purpose: Compile install-time declarations for protected action adapter packs, gateway manifests, and policy envelopes.
- Contains: Install proposal and protected action adapter pack code.
- Key files: `src/install/install-proposal/index.ts`, `src/install/protected-action-adapter-pack/index.ts`.

**`src/conformance/`:**
- Purpose: Expose narrow conformance/proof helper types. Do not use this directory to imply certification.
- Contains: `index.ts`.
- Key files: `src/conformance/index.ts`.

**`src/sdk/`:**
- Purpose: Provide SDK-facing client helpers and package-facing types separate from protocol internals.
- Contains: SDK lane files and `LANE.md`.
- Key files: `src/sdk/LANE.md`.

**`docs/internal/`:**
- Purpose: Maintain compact canonical protocol architecture, protocol definition, durable decisions, and notes.
- Contains: `decisions.md`, `protocol-definition.md`, `protocol-kernel-architecture.md`, `protocol-notes.md`, `protocol-layman.md`.
- Key files: `docs/internal/decisions.md`, `docs/internal/protocol-definition.md`, `docs/internal/protocol-kernel-architecture.md`, `docs/internal/protocol-notes.md`.

**`docs/protocol/`:**
- Purpose: Provide public protocol walkthroughs and integration guidance.
- Contains: First-contract walkthrough, runtime integration, gateway integration, and related docs.
- Key files: `docs/protocol/first-contract-walkthrough.md`, `docs/protocol/runtime-integration.md`, `docs/protocol/gateway-integration.md`.

**`test/architecture/`:**
- Purpose: Enforce source ownership, lane boundaries, package exports, naming posture, and public/private representation constraints.
- Contains: Architecture and hygiene tests.
- Key files: `test/architecture/import-posture.test.ts`, `test/architecture/root-exports.test.ts`, `test/architecture/package-surface.test.ts`, `test/architecture/naming-posture.test.ts`, `test/architecture/active-vocabulary.test.ts`.

**`.planning/`:**
- Purpose: Scratch planning workspace for GSD and local analysis.
- Contains: Planning docs and generated mapper outputs.
- Key files: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`.

## Key File Locations

**Entry Points:**
- `src/index.ts`: Curated stable package API.
- `src/experimental.ts`: Experimental/reference adapter API.
- `src/worker.ts`: Cloudflare Worker entry point.
- `src/http/app.ts`: Hosted HTTP app creation and transition request handling.
- `src/protocol/kernel.ts`: In-process protocol transition facade.

**Configuration:**
- `package.json`: Scripts, dependencies, package manager, and export map.
- `tsconfig.json`: Strict TypeScript compiler configuration.
- `eslint.config.js`: ESLint flat config and repo-specific rule posture.
- `.prettierrc.json`: Formatting defaults.
- `.editorconfig`: Cross-editor whitespace rules.
- `wrangler.toml`: Cloudflare Worker, D1, and KV bindings.
- `.github/workflows/check.yml`: CI quality command sequence.

**Core Logic:**
- `src/protocol/store/port.ts`: Store atomicity and conflict contract.
- `src/protocol/events/records.ts`: Record/event creation and commit path.
- `src/protocol/navigation/index.ts`: Transition catalog and lifecycle source of truth.
- `src/protocol/areas/intent-compilation/transitions.ts`: Candidate action and refusal creation.
- `src/protocol/areas/action-contract/transitions.ts`: Contract proposal transition.
- `src/protocol/areas/action-contract/contract-record.ts`: Deterministic contract record construction.
- `src/protocol/areas/policy-greenlight/transitions.ts`: Policy decision transition.
- `src/protocol/areas/gateway-gate/transitions.ts`: Gateway check transition.
- `src/protocol/areas/gateway-gate/artifacts.ts`: `VerifiedGatewayCheck` artifact helper.
- `src/protocol/areas/operation-lifecycle/transitions.ts`: Receipt/refusal/proof-gap/downstream uncertainty reconciliation.
- `src/protocol/areas/protected-path-posture/transitions.ts`: Bypass and protected path posture records.
- `src/protocol/areas/idempotency-ledger/entries.ts`: Idempotency and replay-control entries.
- `src/protocol/areas/object-registry/index.ts`: Object schema, ID, export posture, and raw-read posture registry.

**Storage:**
- `src/storage/memory/index.ts`: In-memory `ProtocolStore` implementation.
- `src/storage/d1/index.ts`: D1 `ProtocolStore` implementation.
- `src/storage/d1/statements.ts`: D1 query/statement helpers.
- `src/storage/kv/index.ts`: Isolation cache implementation.
- `migrations/0001_protocol_kernel.sql`: Durable D1 schema.

**HTTP:**
- `src/http/routes/transition-route-registry.ts`: HTTP route metadata and request/response schemas.
- `src/http/routes/transition-invokers.ts`: Route-to-transition invoker map.
- `src/http/admission/index.ts`: Request admission.
- `src/http/admission/request-context.ts`: Transition request context.
- `src/http/handlers/evidence-read.ts`: Evidence projection read endpoint.
- `src/http/handlers/internal-record-read.ts`: Raw record read with internal-only refusal behavior.
- `src/http/store/resolution.ts`: D1/fallback store selection.

**Runtime and Adapters:**
- `src/runtime/codemode-multi-action/generated-program-runner.ts`: Generated program evidence and sibling action proposal flow.
- `src/runtime/codemode-multi-action/generated-graph-evidence.ts`: Generated graph evidence helpers.
- `src/adapters/package-install/gateway.ts`: Package install reference gateway.
- `src/adapters/repo-write/gateway.ts`: Repo write reference gateway.
- `src/adapters/preview-deploy/gateway.ts`: Preview deploy reference gateway.
- `src/adapters/x402-payment/wallet-gateway.ts`: x402 wallet reference gateway.
- `src/adapters/x402-payment/bypass-probes.ts`: x402 bypass posture probes.
- `src/adapters/protected-path-probes/executor.ts`: Protected-path probe executor.

**Representation and Evidence:**
- `src/protocol/evidence-projections/projections.ts`: Projection builders.
- `src/protocol/evidence-projections/schemas.ts`: Projection schemas.
- `src/protocol/areas/action-attempt-lifecycle/*`: Derived lifecycle view from protocol navigation.
- `src/protocol/areas/object-registry/index.ts`: Read/export posture for protocol objects.

**Testing:**
- `test/architecture/import-posture.test.ts`: Lane and import-boundary tests.
- `test/architecture/root-exports.test.ts`: Curated root export tests.
- `test/architecture/package-surface.test.ts`: Package export surface tests.
- `test/architecture/naming-posture.test.ts`: Naming posture and forbidden taxonomy tests.
- `test/architecture/active-vocabulary.test.ts`: Active vocabulary tests.
- `test/protocol/*`: Protocol behavior and invariant tests.
- `test/storage/*`: Store parity and atomicity tests.
- `test/http/*`: HTTP route and admission tests.
- `test/runtime/*`: Runtime helper tests.
- `test/adapters/*`: Reference adapter tests.

## Naming Conventions

**Files:**
- Use domain-specific names that expose ownership: `src/protocol/areas/gateway-gate/transitions.ts`, `src/http/routes/transition-route-registry.ts`, `src/adapters/x402-payment/wallet-gateway.ts`.
- Use `index.ts` for lane-level public aggregation only when the directory owns a clear API boundary, such as `src/conformance/index.ts` and `src/install/install-proposal/index.ts`.
- Keep transition behavior in `transitions.ts` inside protocol areas.
- Keep protocol record builders in specific files such as `src/protocol/areas/action-contract/contract-record.ts`.
- Avoid generic bucket names such as `utils`, `helpers`, `common`, `shared`, `misc`, or `lib`; `test/architecture/naming-posture.test.ts` enforces this posture.

**Directories:**
- Use lane names with `LANE.md` ownership files for major source lanes: `src/protocol/`, `src/http/`, `src/runtime/`, `src/adapters/`, `src/install/`, `src/conformance/`, `src/storage/`, `src/sdk/`.
- Use protocol area names for primitive ownership: `intent-compilation`, `action-contract`, `policy-greenlight`, `gateway-gate`, `operation-lifecycle`, `protected-path-posture`.
- Use adapter names for reference fixture domains: `package-install`, `repo-write`, `preview-deploy`, `x402-payment`.
- Empty placeholder directories such as `src/runtime/x402-payment`, `src/runtime/consequence-ingress`, `src/adapters/x402-wallet-gateway`, and `src/conformance/x402-payment` are not active ownership locations. Prefer active files and lane manifests unless a phase explicitly fills or removes them.

## Where to Add New Code

**New Protocol Primitive:**
- Primary code: `src/protocol/areas/<primitive-name>/`
- Transition entry: `src/protocol/areas/<primitive-name>/transitions.ts`
- Public exposure: `src/protocol/public/inputs.ts`, `src/protocol/public/schemas.ts`, `src/protocol/public/transitions.ts` only when the primitive is intended for external callers.
- Navigation metadata: `src/protocol/navigation/index.ts`
- Object metadata: `src/protocol/areas/object-registry/index.ts`
- Tests: `test/protocol/<primitive-name>.test.ts` plus boundary tests in `test/architecture/import-posture.test.ts` when ownership changes.

**New Transition on an Existing Primitive:**
- Primary code: Existing `src/protocol/areas/<area>/transitions.ts`.
- Kernel facade: `src/protocol/kernel.ts`.
- HTTP route: `src/http/routes/transition-route-registry.ts` and `src/http/routes/transition-invokers.ts` only if hosted HTTP needs it.
- Public schemas: `src/protocol/public/schemas.ts` and `src/protocol/public/inputs.ts`.
- Tests: `test/protocol/*`, `test/http/*` if routed, and `test/architecture/import-posture.test.ts` if import posture changes.

**New Store-Backed Authority or Evidence Index:**
- Contract first: `src/protocol/store/port.ts`.
- Durable schema: `migrations/0001_protocol_kernel.sql` or a new migration under `migrations/`.
- D1 implementation: `src/storage/d1/index.ts`, with SQL helpers in `src/storage/d1/statements.ts`.
- Memory implementation: `src/storage/memory/index.ts`.
- Tests: `test/storage/*` for D1/memory parity and protocol tests for conflict behavior.
- Do not implement authority indexes in `src/storage/kv/index.ts`; KV is an isolation cache only.

**New Evidence Projection or Review View:**
- Projection builder: `src/protocol/evidence-projections/projections.ts`.
- Projection schema: `src/protocol/evidence-projections/schemas.ts`.
- Object/read posture: `src/protocol/areas/object-registry/index.ts`.
- HTTP read endpoint: `src/http/handlers/evidence-read.ts` only when hosted read access is needed.
- Tests: `test/protocol/*` or `test/http/*`, plus architecture tests if public/raw posture changes.

**New Runtime Proposal Helper:**
- Primary code: `src/runtime/<domain>/`.
- Proposal flow: call `HandshakeKernel` transitions up to candidate/contract/policy proposal as needed.
- Authority boundary: do not mutate protected surfaces from `src/runtime/*`.
- Tests: `test/runtime/<domain>.test.ts`.

**New Reference Gateway Adapter:**
- Primary code: `src/adapters/<domain>/`.
- Required pattern: call `gatewayCheck`, require `VerifiedGatewayCheck` from `src/protocol/areas/gateway-gate/artifacts.ts`, then mutate, then call operation lifecycle reconciliation.
- Experimental exposure: `src/experimental.ts`, not `src/index.ts`, unless the adapter becomes part of the curated stable API.
- Tests: `test/adapters/<domain>.test.ts` and conformance helpers when applicable.
- Documentation: Name it as a reference or experimental adapter unless provider-native gateway enforcement exists.

**New Install-Time Adapter Metadata:**
- Primary code: `src/install/install-proposal/index.ts` or `src/install/protected-action-adapter-pack/index.ts`.
- Domain-specific compile logic: `src/adapters/<domain>/install-proposal.ts`.
- Tests: `test/install/*` or adapter-specific tests.

**New Conformance Check:**
- Primary code: `src/conformance/index.ts` or a clearly named submodule under `src/conformance/` if the surface grows.
- Scope: narrow posture/evidence helper, not certification language.
- Tests: `test/conformance/*` or adapter-specific conformance tests.

**New HTTP Route:**
- Metadata and schemas: `src/http/routes/transition-route-registry.ts`.
- Invocation: `src/http/routes/transition-invokers.ts`.
- Admission/context use: `src/http/app.ts`, `src/http/admission/index.ts`, `src/http/admission/request-context.ts`.
- Tests: `test/http/*`.
- Do not move protocol transition semantics into `src/http/*`.

**New SDK Surface:**
- Implementation: `src/sdk/`.
- Package exposure: `src/index.ts` only for stable root API; `src/experimental.ts` for experimental surfaces.
- Tests: `test/sdk/*`, `test/architecture/root-exports.test.ts`, `test/architecture/package-surface.test.ts`.

**Documentation Updates:**
- Product invariant or repo posture: `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`.
- Durable architecture/product decisions: `docs/internal/decisions.md`.
- Protocol architecture or definition: `docs/internal/protocol-kernel-architecture.md`, `docs/internal/protocol-definition.md`, `docs/internal/protocol-notes.md`.
- Public adoption walkthrough: `docs/protocol/*`.
- Scratch planning or mapper output: `.planning/*`.

## Special Directories

**`.planning/`:**
- Purpose: Scratch planning workspace and generated codebase maps.
- Generated: Partially.
- Committed: May be committed when orchestrator chooses, but it is not repo-facing canon.
- Constraint: Do not let `.planning/*` stage labels, taxonomy, or long-form reports leak into source paths, package scripts, CI names, README sections, exported symbols, or canonical docs.

**`dist/`:**
- Purpose: Build output from `tsup`.
- Generated: Yes.
- Committed: No.
- Constraint: Do not edit by hand.

**`node_modules/`:**
- Purpose: Bun/npm dependency install directory.
- Generated: Yes.
- Committed: No.
- Constraint: Do not inspect for source ownership or edit directly.

**`migrations/`:**
- Purpose: Durable D1 schema for protocol store behavior.
- Generated: No.
- Committed: Yes.
- Constraint: Treat schema changes as authority/evidence changes; update D1, memory store parity, and storage tests together.

**`docs/internal/`:**
- Purpose: Canonical compact product/protocol architecture and decision record.
- Generated: No.
- Committed: Yes.
- Constraint: Keep current-state language tight and source-backed. Do not move scratch planning labels here.

**`examples/`:**
- Purpose: Reference usage and runnable examples.
- Generated: No.
- Committed: Yes.
- Constraint: Examples must not imply enforcement that source does not provide.

**`src/*/LANE.md`:**
- Purpose: Lane ownership manifests for source directories.
- Generated: No.
- Committed: Yes.
- Constraint: Update when source ownership changes; `test/architecture/import-posture.test.ts` expects lane posture to stay coherent.

**Empty Placeholder Directories:**
- Purpose: None unless a phase explicitly fills or removes them.
- Generated: No.
- Committed: Directory entries are not meaningful without files.
- Examples: `src/runtime/x402-payment`, `src/runtime/consequence-ingress`, `src/adapters/x402-wallet-gateway`, `src/conformance/x402-payment`.
- Constraint: Do not infer active architecture from empty placeholders.

---

*Structure analysis: 2026-05-20*
