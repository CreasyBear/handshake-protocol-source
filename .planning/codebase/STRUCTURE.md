# Codebase Structure

**Analysis Date:** 2026-05-26

## Directory Layout

```text
Handshake v0.0.2/
|-- src/                         # TypeScript source for protocol kernel, surfaces, adapters, SDK, CLI, MCP, storage
|   |-- protocol/                # Authority state machine, primitives, canonicalization, events, store port
|   |   |-- areas/               # Primitive-owned area modules
|   |   |   `-- negotiation/     # A2A-style imported negotiation evidence only
|   |   |-- foundation/          # Canonicalization, ids, errors, base schemas, reason codes
|   |   |-- events/              # Event schema, digest chains, record commits
|   |   |-- context/             # Transition request context records
|   |   |-- navigation/          # Source-owned transition metadata
|   |   |-- public/              # Public schema/input aggregators
|   |   `-- store/               # Store port and indexing helpers
|   |-- http/                    # Hono/Worker transport, admission, routes, handlers, errors, OpenAPI, store resolution
|   |-- runtime/                 # Generated-execution evidence and proposal helpers
|   |-- adapters/                # Reference adapter profiles, gateway fixtures, protected-path probes
|   |-- adapter-sdk/             # Definition-only public adapter authoring subpath
|   |-- install/                 # Install proposal and protected-action adapter-pack contracts
|   |-- sdk/                     # Low-level HTTP client and role-scoped clients
|   |-- cli/                     # Local operator/evidence command surface
|   |-- mcp/                     # MCP proposal/evidence catalog, resources, x402 proposal bridge, stdio server
|   |-- surfaces/                # Surface boundary manifests, service workflow projections, proof packets
|   |-- storage/                 # D1, memory, and KV/noop store implementations
|   |-- conformance/             # Public conformance checks
|   |-- hosted-admission/        # Public hosted caller identity/admission subpath
|   |-- x402-protected-tool/     # Public protected-tool acceptance/facade/readiness/profile subpath
|   |-- index.ts                 # Curated package root export surface
|   |-- experimental.ts          # Explicit experimental fixture exports
|   `-- worker.ts                # Cloudflare Worker entrypoint
|-- test/                        # Bun tests by architecture, protocol, runtime, HTTP, MCP, SDK, CLI, adapters, product
|-- examples/                    # Runnable demos/readback examples and generated output folders
|-- scripts/                     # Build, package-surface, release, proof, and quality helper scripts
|-- migrations/                  # D1 schema for protocol kernel storage
|-- bin/                         # Thin package executable wrappers
|-- docs/internal/               # Compact canonical decisions, protocol notes, architecture docs, runbooks
|-- dist/                        # Generated package build output
|-- .planning/codebase/          # Scratch codebase intelligence docs
|-- package.json                 # Package metadata, exports, scripts, dependencies
|-- tsconfig.json                # TypeScript project config
|-- tsconfig.build.json          # Declaration emit config
|-- eslint.config.js             # ESLint config
|-- wrangler.toml                # Cloudflare Worker/D1 binding config
|-- server.json                  # MCP Registry metadata for stdio server
|-- README.md                    # Current repo orientation and package usage
|-- QUALITY.md                   # TypeScript quality and naming rules
|-- STRUCTURE.md                 # Canonical source ownership map
`-- AGENTS.md                    # Doctrine, invariants, and repo truth boundaries
```

## Directory Purposes

**`src/protocol/`:**
- Purpose: Source-owned authority semantics for exact contracts, policy decisions, one-use greenlights, gateway checks, receipts, refusals, proof gaps, isolation, recovery, review binding, generated-execution evidence, and transition invariants.
- Contains: `src/protocol/kernel.ts`, `src/protocol/areas/*`, `src/protocol/foundation/*`, `src/protocol/events/*`, `src/protocol/context/*`, `src/protocol/navigation/*`, `src/protocol/public/*`, `src/protocol/store/*`.
- Key files: `src/protocol/kernel.ts`, `src/protocol/areas/index.ts`, `src/protocol/public/schemas.ts`, `src/protocol/public/inputs.ts`, `src/protocol/store/port.ts`, `src/protocol/events/records.ts`.

**`src/protocol/areas/`:**
- Purpose: Primitive-owned protocol modules split by authority or evidence area.
- Contains: One folder per primitive, commonly `index.ts`, `types.ts`, `schemas.ts`, `inputs.ts`, `transitions.ts`, plus `guards.ts` or support files where needed.
- Key files: `src/protocol/areas/intent-compilation/transitions.ts`, `src/protocol/areas/action-contract/transitions.ts`, `src/protocol/areas/policy-greenlight/transitions.ts`, `src/protocol/areas/gateway-gate/transitions.ts`, `src/protocol/areas/operation-lifecycle/transitions.ts`.

**`src/protocol/areas/negotiation/`:**
- Purpose: A2A-style negotiation evidence imported into the protocol object/event model without protected-action authority.
- Contains: `src/protocol/areas/negotiation/LANE.md`, `src/protocol/areas/negotiation/index.ts`, `src/protocol/areas/negotiation/inputs.ts`, `src/protocol/areas/negotiation/schemas.ts`, `src/protocol/areas/negotiation/types.ts`.
- Key files: `src/protocol/areas/negotiation/schemas.ts`, `test/architecture/negotiation-no-authority-surface.test.ts`, `test/protocol/negotiation-schemas.test.ts`, `test/protocol/negotiation-object-registry.test.ts`, `test/protocol/negotiation-events.test.ts`.
- Rule: Keep this area evidence-only; do not add `transitions.ts`, package-root exports, downstream surface imports, policy imports, gateway imports, receipt-export imports, or authority-certificate imports.

**`src/protocol/foundation/`:**
- Purpose: Shared deterministic protocol helpers and failure types.
- Contains: Canonicalization, content digests, ids, errors, reason codes, transition guards, and schema core helpers.
- Key files: `src/protocol/foundation/canonical.ts`, `src/protocol/foundation/content-digests.ts`, `src/protocol/foundation/errors.ts`, `src/protocol/foundation/ids.ts`, `src/protocol/foundation/reason-codes.ts`, `src/protocol/foundation/schema-core.ts`.

**`src/protocol/events/`:**
- Purpose: Event-chain construction, event schemas, and stored record commit helpers.
- Contains: `src/protocol/events/chains.ts`, `src/protocol/events/records.ts`, `src/protocol/events/schemas.ts`, `src/protocol/events/index.ts`.
- Key files: `src/protocol/events/records.ts`, `src/protocol/events/chains.ts`, `src/protocol/events/schemas.ts`.

**`src/protocol/public/`:**
- Purpose: Public schema/input aggregators for root exports and transport-facing imports.
- Contains: Aggregator-only `src/protocol/public/schemas.ts`, `src/protocol/public/inputs.ts`, `src/protocol/public/transitions.ts`, `src/protocol/public/index.ts`.
- Key files: `src/protocol/public/schemas.ts`, `src/protocol/public/inputs.ts`.
- Rule: Add public exports here only for intentional protocol/public surfaces. Do not add negotiation exports here while A2A negotiation remains evidence-only.

**`src/protocol/store/`:**
- Purpose: Storage port, action-contract indexing helper, and store exports.
- Contains: `src/protocol/store/port.ts`, `src/protocol/store/action-contract-index.ts`, `src/protocol/store/index.ts`.
- Key files: `src/protocol/store/port.ts`.

**`src/http/`:**
- Purpose: Hono/Worker transport for protocol transitions, evidence reads, hosted admission/readiness, verifier endpoints, errors, OpenAPI, and store resolution.
- Contains: `src/http/app.ts`, `src/http/app-options.ts`, `src/http/admission/*`, `src/http/routes/*`, `src/http/handlers/*`, `src/http/errors/*`, `src/http/openapi/*`, `src/http/navigation/*`, `src/http/store/*`.
- Key files: `src/http/app.ts`, `src/http/routes/transition-route-registry.ts`, `src/http/routes/transition-invokers.ts`, `src/http/routes/evidence-read-route-registry.ts`, `src/http/admission/index.ts`.

**`src/runtime/`:**
- Purpose: Generated-execution observations, candidate extraction inputs, wrapper-produced graph evidence, refusals, uncertainty markers, and proposal helpers.
- Contains: `src/runtime/ingress/*`, `src/runtime/package-install/*`, `src/runtime/repo-write/*`, `src/runtime/preview-deploy/*`, `src/runtime/x402-payment/*`, `src/runtime/auth-md`-adjacent dispatch support through adapter family builders, and `src/runtime/codemode-multi-action/*`.
- Key files: `src/runtime/ingress/index.ts`, `src/runtime/ingress/schemas.ts`, `src/runtime/ingress/registry.ts`, `src/runtime/ingress/families.ts`, `src/runtime/package-install/action-proposal.ts`, `src/runtime/codemode-multi-action/generated-program-runner.ts`.

**`src/adapters/`:**
- Purpose: Reference adapter profiles, upstream evidence intake, protected-path probes, gateway fixtures, and post-gate mutation discipline.
- Contains: `src/adapters/x402-payment/*`, `src/adapters/package-install/*`, `src/adapters/repo-write/*`, `src/adapters/preview-deploy/*`, `src/adapters/auth-md/*`, `src/adapters/auth-md-x402-interlock/*`, `src/adapters/protected-path-probes/*`.
- Key files: `src/adapters/x402-payment/action-proposal.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/protected-tool-facade/index.ts`, `src/adapters/x402-payment/protected-tool-readiness/index.ts`, `src/adapters/package-install/gateway.ts`, `src/adapters/auth-md/gateway.ts`.

**`src/adapter-sdk/`:**
- Purpose: Public definition-only adapter authoring surface.
- Contains: `src/adapter-sdk/index.ts`, `src/adapter-sdk/LANE.md`.
- Key files: `src/adapter-sdk/index.ts`.

**`src/install/`:**
- Purpose: Install proposal contracts and protected-action adapter-pack definition contracts used by adapter SDK and x402 install proposal compilation.
- Contains: `src/install/install-proposal/*`, `src/install/protected-action-adapter-pack/*`, `src/install/index.ts`, `src/install/LANE.md`.
- Key files: `src/install/install-proposal/index.ts`, `src/install/protected-action-adapter-pack/index.ts`.

**`src/sdk/`:**
- Purpose: Low-level and role-scoped HTTP clients over public transition and diagnostic evidence routes.
- Contains: `src/sdk/client.ts`, `src/sdk/surface-clients/*`, `src/sdk/transport-url.ts`, `src/sdk/activation/*`, `src/sdk/LANE.md`.
- Key files: `src/sdk/client.ts`, `src/sdk/surface-clients/runtime-client.ts`, `src/sdk/surface-clients/policy-client.ts`, `src/sdk/surface-clients/gateway-client.ts`, `src/sdk/surface-clients/evidence-client.ts`, `src/sdk/surface-clients/transport.ts`.

**`src/cli/`:**
- Purpose: Local command manifest, JSON output envelope, evidence rendering, local project setup/readiness, x402 install/probe/readiness commands, support bundles, and certificate verification.
- Contains: `src/cli/main.ts`, `src/cli/index.ts`, `src/cli/command-manifest.ts`, `src/cli/output.ts`, `src/cli/x402/*`, `src/cli/local-project/*`, `src/cli/demo/*`.
- Key files: `src/cli/main.ts`, `src/cli/command-manifest.ts`, `src/cli/x402/index.ts`, `src/cli/projection-evidence.ts`.

**`src/mcp/`:**
- Purpose: MCP proposal/evidence catalog, strict x402 proposal schema, read-only resource mapping, reference transcript builder, and local stdio process harness.
- Contains: `src/mcp/catalog.ts`, `src/mcp/output.ts`, `src/mcp/resources.ts`, `src/mcp/x402-proposal.ts`, `src/mcp/stdio/*`, `src/mcp/reference-transcript.ts`, `src/mcp/reference-transcript-fixtures.ts`.
- Key files: `src/mcp/x402-proposal.ts`, `src/mcp/resources.ts`, `src/mcp/stdio/server.ts`.

**`src/surfaces/`:**
- Purpose: Shared non-authority product/readback boundary manifests, service workflow projection contracts, launch/activation/release proof records, and proof-packet projectors.
- Contains: `src/surfaces/boundary-manifest.ts`, `src/surfaces/service-workflow-admission/*`, `src/surfaces/service-workflow-lifecycle-projections/*`, `src/surfaces/proof-packets/*`, `src/surfaces/release-proof.ts`, `src/surfaces/product-launch-gate-resolution.ts`, `src/surfaces/x402-protected-tool-acceptance.ts`.
- Key files: `src/surfaces/boundary-manifest.ts`, `src/surfaces/service-workflow-admission/index.ts`, `src/surfaces/proof-packets/index.ts`.

**`src/storage/`:**
- Purpose: Protocol store mechanics and implementations.
- Contains: `src/storage/d1/*`, `src/storage/memory/*`, `src/storage/kv/*`, `src/storage/store.ts`, `src/storage/LANE.md`.
- Key files: `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `src/storage/memory/index.ts`, `src/storage/kv/index.ts`.

**`src/conformance/`:**
- Purpose: Public conformance checks for protected mutation adapters and x402 upstream fixture posture.
- Contains: `src/conformance/index.ts`, `src/conformance/x402-payment/*`, `src/conformance/LANE.md`.
- Key files: `src/conformance/index.ts`, `src/conformance/x402-payment/*`.

**`src/hosted-admission/`:**
- Purpose: Public package subpath for provider-neutral hosted identity evidence, hosted caller verification, hosted admission config, and hosted verifier adapter helpers.
- Contains: `src/hosted-admission/index.ts`, `src/hosted-admission/hosted-admission-config.ts`, `src/hosted-admission/hosted-caller-identity.ts`, `src/hosted-admission/hosted-verifier-adapter.ts`, `src/hosted-admission/roles.ts`, `src/hosted-admission/LANE.md`.
- Key files: `src/hosted-admission/index.ts`, `src/hosted-admission/hosted-verifier-adapter.ts`.

**`src/x402-protected-tool/`:**
- Purpose: Public package subpath for the first x402 protected-tool facade/profile/readiness distribution surface.
- Contains: `src/x402-protected-tool/index.ts`, `src/x402-protected-tool/LANE.md`.
- Key files: `src/x402-protected-tool/index.ts`, `src/adapters/x402-payment/protected-tool-facade/index.ts`, `src/adapters/x402-payment/protected-tool-readiness/index.ts`, `src/adapters/x402-payment/protected-tool-profile/index.ts`.

**`test/`:**
- Purpose: Bun test suite by architecture, protocol, runtime, HTTP, MCP, SDK, CLI, adapters, product, storage, integration, conformance, and support fixtures.
- Contains: `test/architecture/*`, `test/protocol/*`, `test/runtime/*`, `test/http/*`, `test/mcp/*`, `test/sdk/*`, `test/cli/*`, `test/adapters/*`, `test/product/*`, `test/integration/*`, `test/conformance/*`, `test/support/*`.
- Key files: `test/architecture/import-posture.test.ts`, `test/architecture/root-exports.test.ts`, `test/architecture/surface-boundary-posture.test.ts`, `test/architecture/negotiation-no-authority-surface.test.ts`, `test/protocol/negotiation-schemas.test.ts`.

## Key File Locations

**Entry Points:**
- `src/index.ts`: Package root export curation.
- `src/worker.ts`: Cloudflare Worker fetch entrypoint.
- `src/http/app.ts`: Hono app factory and route registration.
- `src/cli/main.ts`: CLI command dispatch.
- `src/mcp/stdio/entry.ts`: MCP stdio process entrypoint.
- `bin/handshake`: CLI executable wrapper.
- `bin/handshake-mcp`: MCP executable wrapper.

**Configuration:**
- `package.json`: Package exports, bins, scripts, dependency versions, and release/package-surface contract.
- `tsconfig.json`: TypeScript project config.
- `tsconfig.build.json`: Declaration/build config.
- `eslint.config.js`: ESLint config.
- `.prettierrc.json`: Prettier config.
- `wrangler.toml`: Worker and D1 binding config.
- `server.json`: MCP Registry metadata.
- `.github/workflows/check.yml`: CI gate.

**Core Logic:**
- `src/protocol/kernel.ts`: Protocol transition facade.
- `src/protocol/areas/object-registry/schemas.ts`: Protocol object discriminated union and object-type registry.
- `src/protocol/events/records.ts`: Canonical record and event commit helper.
- `src/protocol/store/port.ts`: Atomic persistence contract.
- `src/runtime/ingress/index.ts`: Composite runtime evidence to action-contract proposal path.
- `src/protocol/areas/negotiation/schemas.ts`: A2A-style negotiation evidence-only schemas.

**Protocol Authority Areas:**
- `src/protocol/areas/intent-compilation/transitions.ts`: Vague intent/generated evidence to candidate action or refusal.
- `src/protocol/areas/action-contract/transitions.ts`: Candidate to exact action contract.
- `src/protocol/areas/policy-greenlight/transitions.ts`: Policy decision, review/refusal/proof-gap, one-use greenlight, idempotency reservation.
- `src/protocol/areas/gateway-gate/transitions.ts`: Pre-mutation greenlight verification, mutation attempt, receipt/refusal/proof-gap.
- `src/protocol/areas/operation-lifecycle/transitions.ts`: Downstream protected-surface reconciliation.
- `src/protocol/areas/isolation-breaker/index.ts`: Isolation state and breaker decisions.
- `src/protocol/areas/authority-certificate/index.ts`: Terminal certificate signing and verification helpers.

**Product/Readback Surfaces:**
- `src/surfaces/boundary-manifest.ts`: Surface boundary contract.
- `src/surfaces/service-workflow-admission/index.ts`: Admission/handle/principal-agent-link/context-ref projection contracts.
- `src/hosted-admission/index.ts`: Hosted identity evidence helper public subpath.
- `src/sdk/surface-clients/*`: Role-scoped transition clients.
- `src/mcp/x402-proposal.ts`: MCP proposal bridge.
- `src/cli/command-manifest.ts`: CLI command surface metadata.
- `src/adapter-sdk/index.ts`: Definition-only adapter SDK subpath.
- `src/x402-protected-tool/index.ts`: Protected-tool public subpath.

**Storage:**
- `src/storage/d1/index.ts`: D1 `ProtocolStore` implementation.
- `src/storage/d1/statements.ts`: D1 SQL statement builders.
- `src/storage/memory/index.ts`: Memory `ProtocolStore` implementation.
- `src/storage/kv/index.ts`: KV/noop isolation cache plumbing.
- `migrations/0001_protocol_kernel.sql`: D1 schema.

**Testing:**
- `test/architecture/import-posture.test.ts`: Lane import constraints.
- `test/architecture/package-surface.test.ts`: Package export/subpath shape.
- `test/architecture/root-exports.test.ts`: Root export curation.
- `test/architecture/surface-boundary-posture.test.ts`: Surface manifest enforcement.
- `test/architecture/negotiation-no-authority-surface.test.ts`: Negotiation evidence-only boundary.
- `test/protocol/kernel-policy-gateway.test.ts`: Kernel policy/gateway path.
- `test/runtime/runtime-ingress.test.ts`: Runtime ingress proposal behavior.
- `test/http/http.test.ts`: HTTP route behavior.
- `test/mcp/mcp-x402-proposal.test.ts`: MCP x402 proposal behavior.

## Naming Conventions

**Files:**
- Protocol area files use stable role names: `schemas.ts`, `inputs.ts`, `types.ts`, `transitions.ts`, `guards.ts`, `index.ts` under `src/protocol/areas/<area>/`.
- Runtime proposal helpers use `action-proposal.ts`, as in `src/runtime/package-install/action-proposal.ts` and adapter-family helpers such as `src/adapters/x402-payment/action-proposal.ts`.
- Lane ownership files are named `LANE.md` at first-level source lanes and selected subareas, such as `src/protocol/LANE.md` and `src/protocol/areas/negotiation/LANE.md`.
- Tests use `<subject>.test.ts` and live under category directories such as `test/protocol/`, `test/runtime/`, `test/architecture/`, and `test/adapters/`.

**Directories:**
- First-level `src/` directories are ownership lanes, not generic technical buckets.
- Protocol primitives live under `src/protocol/areas/<primitive>/`.
- Product/readback contracts live under explicit surfaces such as `src/surfaces/service-workflow-admission/`, `src/mcp/`, `src/cli/`, `src/sdk/surface-clients/`, and `src/x402-protected-tool/`.
- Storage implementations live under `src/storage/<adapter>/`.

## Where to Add New Code

**New Protocol Authority Primitive:**
- Primary code: `src/protocol/areas/<primitive>/`
- Required local files: `src/protocol/areas/<primitive>/schemas.ts`, `src/protocol/areas/<primitive>/inputs.ts`, `src/protocol/areas/<primitive>/types.ts`, `src/protocol/areas/<primitive>/index.ts`
- Add transitions only when the primitive creates protocol state authority: `src/protocol/areas/<primitive>/transitions.ts`
- Add to: `src/protocol/areas/index.ts`, `src/protocol/public/schemas.ts`, `src/protocol/public/inputs.ts`, `src/protocol/areas/object-registry/schemas.ts`, `src/protocol/events/schemas.ts`, `src/protocol/navigation/index.ts`, `src/protocol/kernel.ts`
- Tests: `test/protocol/<primitive>.test.ts`, relevant `test/architecture/import-posture.test.ts`, `test/architecture/root-exports.test.ts`

**New Evidence-Only Protocol Area:**
- Primary code: `src/protocol/areas/<evidence-area>/`
- Follow the A2A negotiation pattern in `src/protocol/areas/negotiation/`.
- Add schemas and input aliases: `src/protocol/areas/<evidence-area>/schemas.ts`, `src/protocol/areas/<evidence-area>/inputs.ts`, `src/protocol/areas/<evidence-area>/index.ts`
- Add object/event vocabulary only when records must be durable: `src/protocol/areas/object-registry/schemas.ts`, `src/protocol/events/schemas.ts`
- Do not add: `transitions.ts`, package-root exports, downstream surface imports, policy/gateway/receipt/certificate imports.
- Tests: `test/protocol/<evidence-area>-schemas.test.ts`, `test/protocol/<evidence-area>-object-registry.test.ts`, `test/architecture/<evidence-area>-no-authority-surface.test.ts`

**New Runtime Dispatch Family:**
- Registry: `src/runtime/ingress/registry.ts`
- Input schema: `src/runtime/ingress/schemas.ts`
- Family mapping: `src/runtime/ingress/families.ts`
- Proposal builder: `src/runtime/<family>/action-proposal.ts` or `src/adapters/<family>/action-proposal.ts`
- Tests: `test/runtime/runtime-ingress.test.ts`, `test/runtime/<family>-runtime.test.ts`, protocol candidate/graph tests as needed.

**New Gateway Adapter:**
- Implementation: `src/adapters/<family>/gateway.ts`
- Proposal/evidence helpers: `src/adapters/<family>/action-proposal.ts` or `src/runtime/<family>/action-proposal.ts`
- Bypass/probe support: `src/adapters/<family>/bypass-probes.ts` or `src/adapters/protected-path-probes/*`
- Public experimental export only when explicitly intended: `src/experimental.ts`
- Tests: `test/adapters/<family>-gateway.test.ts`, `test/conformance/protected-mutation-adapter-conformance.test.ts`, integration tests under `test/integration/` when storage/HTTP is involved.

**New HTTP Transition Route:**
- Route metadata: `src/http/routes/transition-route-registry.ts`
- Invoker: `src/http/routes/transition-invokers.ts`
- Response schema: `src/http/routes/transition-response-schemas.ts`
- Scope resolver if needed: `src/http/routes/transition-scope-resolvers.ts`
- Navigation projection: `src/http/navigation/index.ts`
- Kernel method: `src/protocol/kernel.ts`
- Tests: `test/http/http.test.ts`, `test/http/d1-http.test.ts`, architecture route/nav tests as needed.

**New Product/Readback Surface:**
- Boundary first: `src/surfaces/boundary-manifest.ts`
- Implementation lane: choose explicit lane such as `src/cli/`, `src/mcp/`, `src/sdk/surface-clients/`, `src/hosted-admission/`, `src/surfaces/<surface>/`, or `src/x402-protected-tool/`
- Package export only when intended: `package.json`, `src/index.ts` only if root export is allowed.
- Tests: `test/architecture/surface-boundary-posture.test.ts`, `test/architecture/package-surface.test.ts`, `test/architecture/root-exports.test.ts`, plus surface-specific tests.

**New Service Workflow Projection:**
- Primary code: `src/surfaces/service-workflow-admission/index.ts` or a sibling under `src/surfaces/`
- Preserve: projection/readback only, `freshActionContractRequired: true`, no gateway/policy/payment/receipt authority.
- Tests: `test/architecture/workflow-admission-boundary.test.ts`, `test/product/service-workflow-admission.test.ts`

**New SDK Role Client:**
- Implementation: `src/sdk/surface-clients/<role>-client.ts`
- Transport: `src/sdk/surface-clients/transport.ts`
- Export: `src/sdk/surface-clients/index.ts`
- Boundary update: `src/surfaces/boundary-manifest.ts`
- Tests: `test/sdk/role-clients.test.ts`, `test/architecture/surface-boundary-posture.test.ts`, `test/architecture/package-surface.test.ts`

**New CLI Command:**
- Metadata first: `src/cli/command-manifest.ts`
- Dispatcher: `src/cli/main.ts`
- Output envelope: `src/cli/output.ts`
- Command implementation: `src/cli/<topic>.ts` or `src/cli/<topic>/index.ts`
- Tests: `test/architecture/cli-command-posture.test.ts`, `test/cli/<topic>.test.ts`

**New MCP Tool Or Resource:**
- Catalog: `src/mcp/catalog.ts`
- Tool implementation: `src/mcp/<tool>.ts`
- Resource mapping: `src/mcp/resources.ts`
- Stdio registration: `src/mcp/stdio/server.ts`
- Tests: `test/mcp/mcp-schema-contract.test.ts`, `test/mcp/mcp-resource-redaction.test.ts`, `test/mcp/<tool>.test.ts`, `test/architecture/mcp-surface-posture.test.ts`

**New Storage Behavior:**
- Port first: `src/protocol/store/port.ts`
- Memory implementation: `src/storage/memory/index.ts`
- D1 implementation: `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `migrations/0001_protocol_kernel.sql`
- Tests: `test/protocol/protocol-store-atomicity-contract.test.ts`, `test/http/d1-http.test.ts`, `test/protocol/fault-injecting-protocol-store.test.ts`

## Special Directories

**`dist/`:**
- Purpose: Generated package build output.
- Generated: Yes.
- Committed: Present in this checkout; do not treat as source authority when mapping behavior.

**`examples/*/output/`:**
- Purpose: Generated demo/readback outputs.
- Generated: Yes.
- Committed: Output folders include `.gitignore`; generated outputs are runtime artifacts.

**`.planning/`:**
- Purpose: GSD scratch planning, macro plans, codebase maps, archived planning artifacts.
- Generated: Yes.
- Committed: Present, but not canonical product/protocol truth.
- Rule: Only `.planning/codebase/ARCHITECTURE.md` and `.planning/codebase/STRUCTURE.md` are in scope for this mapper run.

**`docs/internal/`:**
- Purpose: Compact canonical internal docs, decisions, protocol architecture, release runbook, and service workflow story.
- Generated: No.
- Committed: Yes.
- Rule: Do not promote `.planning/` language into these docs without explicit source-backed doc work.

**`migrations/`:**
- Purpose: D1 schema for reference durable protocol storage.
- Generated: No.
- Committed: Yes.

**`bin/`:**
- Purpose: Thin package executable wrappers for bundled CLI and MCP entrypoints.
- Generated: No.
- Committed: Yes.

---

*Structure analysis: 2026-05-26*
