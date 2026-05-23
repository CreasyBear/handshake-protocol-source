# Codebase Structure

**Analysis Date:** 2026-05-23

## Directory Layout

```text
Handshake v0.0.2/
|-- AGENTS.md                          # Doctrine, invariants, authority boundary language
|-- README.md                          # Repo orientation, command contract, proof boundary, source map
|-- QUALITY.md                         # TypeScript quality, naming, import, and claims rules
|-- STRUCTURE.md                       # Canonical source/test/docs ownership map
|-- package.json                       # Private package contract, scripts, exports, files
|-- bun.lock                           # Bun lockfile
|-- tsconfig.json                      # TypeScript check config
|-- tsconfig.build.json                # Declaration build config
|-- eslint.config.js                   # ESLint config
|-- wrangler.toml                      # Worker, D1, and KV binding config
|-- .github/workflows/check.yml        # CI gate running `npm run check:repo`
|-- docs/internal/                     # Compact canonical internal docs
|-- examples/x402-protected-spend/     # Local x402 APS proof artifact generator
|-- examples/mcp-reference-transcript/ # Source-owned MCP transcript artifact generator
|-- migrations/                        # D1 protocol storage schema
|-- scripts/                           # Package surface check script
|-- src/                               # TypeScript source package
|-- test/                              # Bun tests by ownership lane
|-- dist/                              # Generated declaration build output
|-- node_modules/                      # Installed dependencies
|-- .planning/                         # Scratch planning and mapper outputs
|-- .gstack/                           # Local tool scratch
`-- .cursor/                           # Editor-local config
```

```text
src/
|-- index.ts                           # Curated root package exports
|-- experimental.ts                    # Explicit experimental adapter fixture exports
|-- worker.ts                          # Cloudflare Worker fetch entrypoint
|-- protocol/                          # Protocol meaning, response objects, events, store port
|-- http/                              # Hono/Worker transport, envelopes, routes, evidence reads
|-- runtime/                           # Generated-execution proposal helpers and ingress subpath
|-- adapters/                          # Reference gateway fixtures, x402 proof profile, visible dirty auth.md work
|-- install/                           # Generic protected-action install proposal contracts
|-- storage/                           # D1, memory, KV, and store implementation plumbing
|-- sdk/                               # Low-level HTTP client and role-scoped Tier 2 clients
|-- cli/                               # Local operator/evidence command surfaces
|-- mcp/                               # Model-facing proposal/resource source modules
|-- surfaces/                          # Shared non-authority surface manifests and outcomes
`-- conformance/                       # Reference conformance checks
```

```text
test/
|-- architecture/                      # Import, export, package, surface, CLI, MCP, claims, naming gates
|-- protocol/                          # Primitive schemas, transitions, records, reason codes, invariants
|-- http/                              # Hono, route, D1, evidence read behavior
|-- runtime/                           # Runtime ingress and codemode proposal behavior
|-- sdk/                               # Role-scoped client behavior
|-- cli/                               # CLI evidence, local project, support bundle, x402 posture
|-- mcp/                               # MCP schema, resource, proposal, transcript behavior
|-- adapters/                          # Reference gateway fixtures and x402 adapter behavior
|-- conformance/                       # Adapter conformance and x402 first-wedge posture
|-- integration/                       # End-to-end D1/HTTP protected action paths
|-- product/                           # Local proof report and transcript-facing product checks
`-- support/                           # Fixtures and harnesses
```

## Current Git-State Boundary

**Committed architecture:**
- Tier 1 kernel authority lives in `src/protocol/*`, HTTP transition transport in `src/http/*`, durable store mechanics in `src/storage/*`, and gateway-side reference mutation fixtures in committed adapter families such as `src/adapters/package-install/*`, `src/adapters/repo-write/*`, `src/adapters/preview-deploy/*`, and `src/adapters/x402-payment/*`.
- Tier 2 surfaces live in `src/runtime/*`, `src/sdk/surface-clients/*`, `src/cli/*`, `src/mcp/*`, and `src/surfaces/*`. They propose, render, read redacted evidence, or report readiness; they do not authorize, gateway-check, mutate, settle, clear, certify, or prove provider custody.
- Committed transition-budget telemetry hardening lives in `test/support/transition-budget-recorder.ts` and `test/protocol/transition-budget-recorder.test.ts`.

**Visible dirty auth.md adapter state:**
- Tracked dirty docs/export/test changes mention auth.md in `STRUCTURE.md`, `docs/internal/protocol-notes.md`, `src/adapters/LANE.md`, `src/experimental.ts`, and `test/architecture/root-exports.test.ts`.
- Untracked implementation/test files exist under `src/adapters/auth-md/index.ts`, `src/adapters/auth-md/profiles.ts`, `src/adapters/auth-md/action-proposal.ts`, and `test/adapters/auth-md-adapter.test.ts`.
- Treat auth.md as observed working-tree adapter work only. It is not committed architecture, not Tier 1 kernel, not a stable package surface, and not a hosted/auth-provider/provider-custody/generic-API-gateway claim.

## Directory Purposes

**Root Canon:**
- Purpose: Keep repo truth compact and source-backed.
- Contains: `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/decisions.md`, `docs/internal/protocol-definition.md`, `docs/internal/protocol-kernel-architecture.md`, `docs/internal/protocol-layman.md`, `docs/internal/protocol-notes.md`.
- Key files: `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`.

**`docs/internal`:**
- Purpose: Durable product/protocol/architecture decisions.
- Contains: `decisions.md`, `protocol-definition.md`, `protocol-kernel-architecture.md`, `protocol-layman.md`, `protocol-notes.md`.
- Key files: `docs/internal/protocol-definition.md`, `docs/internal/protocol-kernel-architecture.md`.

**`src/protocol`:**
- Purpose: Protocol meaning, response object ownership, canonicalization, reason codes, transition facade, events, context, navigation, store port, evidence projections, and primitive areas.
- Contains: `kernel.ts`, `public/`, `foundation/`, `events/`, `context/`, `navigation/`, `evidence-projections/`, `store/`, `areas/`.
- Key files: `src/protocol/kernel.ts`, `src/protocol/public/schemas.ts`, `src/protocol/public/inputs.ts`, `src/protocol/foundation/reason-codes.ts`, `src/protocol/store/port.ts`.

**`src/protocol/areas`:**
- Purpose: Owned protocol primitives and state transitions.
- Contains: `catalog-envelope`, `credential-custody`, `runtime-evidence`, `generated-execution-graph`, `tool-call-draft`, `intent-compilation`, `action-contract`, `policy-greenlight`, `gateway-gate`, `receipt-export`, `refusal`, `proof-gap`, `recovery`, `review-binding`, `isolation-breaker`, `operation-lifecycle`, `protected-path-posture`, `object-registry`, `authority-certificate`, and related areas.
- Key files: `src/protocol/areas/action-contract/transitions.ts`, `src/protocol/areas/policy-greenlight/transitions.ts`, `src/protocol/areas/gateway-gate/transitions.ts`, `src/protocol/areas/object-registry/index.ts`.

**`src/protocol/public`:**
- Purpose: Public schema/input aggregation for HTTP, SDK, examples, and root exports.
- Contains: `schemas.ts`, `inputs.ts`, `transitions.ts`, `index.ts`.
- Key files: `src/protocol/public/schemas.ts`, `src/protocol/public/inputs.ts`.

**`src/protocol/foundation`:**
- Purpose: Shared protocol foundation with no transport or storage implementation dependency.
- Contains: canonicalization, content digests, IDs, errors, schema core, reason codes, transition guards.
- Key files: `src/protocol/foundation/canonical.ts`, `src/protocol/foundation/content-digests.ts`, `src/protocol/foundation/errors.ts`, `src/protocol/foundation/reason-codes.ts`, `src/protocol/foundation/schema-core.ts`.

**`src/protocol/evidence-projections`:**
- Purpose: Redacted telemetry response schemas and projection builders.
- Contains: projection schemas and builders for contract view, agent transaction envelope, idempotency recovery, receipt timeline, and protected-path install health.
- Key files: `src/protocol/evidence-projections/schemas.ts`, `src/protocol/evidence-projections/projections.ts`.

**`src/protocol/events`:**
- Purpose: Canonical record building, request context attachment, and digest-linked stream events.
- Contains: `records.ts`, `chains.ts`, `schemas.ts`, `index.ts`.
- Key files: `src/protocol/events/records.ts`, `src/protocol/events/chains.ts`.

**`src/http`:**
- Purpose: Hono/Worker transport, route admission, response schemas, error envelopes, OpenAPI, evidence reads, raw record guard, and store/kernel resolution.
- Contains: `app.ts`, `app-options.ts`, `admission/`, `routes/`, `handlers/`, `errors/`, `openapi/`, `navigation/`, `store/`.
- Key files: `src/http/app.ts`, `src/http/routes/transition-route-registry.ts`, `src/http/routes/transition-response-schemas.ts`, `src/http/errors/transition-error-envelope.ts`, `src/http/handlers/evidence-read.ts`, `src/http/handlers/internal-record-read.ts`.

**`src/runtime`:**
- Purpose: Generated-execution proposal evidence and action-contract proposal helpers.
- Contains: `index.ts`, `ingress/`, `codemode-multi-action/`, `package-install/`, `preview-deploy/`, `repo-write/`.
- Key files: `src/runtime/index.ts`, `src/runtime/ingress/index.ts`, `src/runtime/codemode-multi-action/generated-program-runner.ts`, `src/runtime/package-install/action-proposal.ts`.

**`src/adapters`:**
- Purpose: Reference gateway fixtures and adapter proof profiles.
- Contains: committed package-install, repo-write, preview-deploy, protected-path probes, x402 payment proof profile, downstream failure evidence; visible dirty auth.md adapter files are working-tree state only.
- Key files: `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, `src/adapters/preview-deploy/gateway.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `src/adapters/x402-payment/upstream-evidence.ts`, `src/adapters/x402-payment/conformance.ts`, `src/adapters/x402-payment/bypass-probes.ts`.

**`src/install`:**
- Purpose: Generic protected-action install proposal and adapter-pack contracts.
- Contains: `install-proposal/`, `protected-action-adapter-pack/`, `index.ts`.
- Key files: `src/install/install-proposal/index.ts`, `src/install/protected-action-adapter-pack/index.ts`.

**`src/storage`:**
- Purpose: Protocol store implementations and non-authority cache helpers.
- Contains: `d1/`, `memory/`, `kv/`, `store.ts`.
- Key files: `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `src/storage/memory/index.ts`, `src/storage/kv/index.ts`, `src/storage/store.ts`.

**`src/sdk`:**
- Purpose: Typed HTTP client ergonomics and role-scoped Tier 2 activation clients.
- Contains: `client.ts`, `surface-clients/`.
- Key files: `src/sdk/client.ts`, `src/sdk/surface-clients/runtime-client.ts`, `src/sdk/surface-clients/evidence-client.ts`, `src/sdk/surface-clients/transport.ts`, `src/sdk/surface-clients/index.ts`.

**`src/cli`:**
- Purpose: Local operator/evidence command contract, output envelope, local project readiness, x402 local posture, support bundle, and certificate verification.
- Contains: `command-manifest.ts`, `main.ts`, `output.ts`, `aps-report.ts`, `certificate.ts`, `projection-evidence.ts`, `support-bundle.ts`, `local-project/`, `x402/`.
- Key files: `src/cli/command-manifest.ts`, `src/cli/output.ts`, `src/cli/support-bundle.ts`, `src/cli/local-project/index.ts`, `src/cli/x402/index.ts`.

**`src/mcp`:**
- Purpose: Model-facing x402 proposal and evidence source modules.
- Contains: `catalog.ts`, `resources.ts`, `x402-proposal.ts`, `output.ts`, `digest.ts`, `reference-transcript.ts`, `reference-transcript-fixtures.ts`, `index.ts`.
- Key files: `src/mcp/catalog.ts`, `src/mcp/resources.ts`, `src/mcp/x402-proposal.ts`, `src/mcp/output.ts`, `src/mcp/reference-transcript.ts`.

**`src/surfaces`:**
- Purpose: Shared boundary manifests and non-authority outcome shapes for SDK, CLI, MCP, and deferred surfaces.
- Contains: `boundary-manifest.ts`, `outcome.ts`, `LANE.md`.
- Key files: `src/surfaces/boundary-manifest.ts`, `src/surfaces/outcome.ts`.

**`src/conformance`:**
- Purpose: Reference conformance checks without standards certification or authority.
- Contains: `index.ts`, `LANE.md`.
- Key files: `src/conformance/index.ts`.

**`examples/x402-protected-spend`:**
- Purpose: Local APS proof report for one official buyer-side `x402_payment.exact` path.
- Contains: `run.ts`, `README.md`, `output/latest.json`, `output/latest.md`.
- Key files: `examples/x402-protected-spend/run.ts`, `examples/x402-protected-spend/README.md`.

**`examples/mcp-reference-transcript`:**
- Purpose: Source-owned MCP transcript artifact generator.
- Contains: `run.ts`, `README.md`, `output/latest.json`, `output/latest.md`.
- Key files: `examples/mcp-reference-transcript/run.ts`, `src/mcp/reference-transcript.ts`.

## Key File Locations

**Entry Points:**
- `src/index.ts`: Curated package root exports.
- `src/runtime/index.ts`: `./runtime` package subpath for runtime ingress.
- `src/sdk/surface-clients/index.ts`: `./sdk/role-clients` package subpath for `RuntimeClient` and `EvidenceClient`.
- `src/conformance/index.ts`: `./conformance` package subpath.
- `src/experimental.ts`: `./experimental` reference adapter fixture subpath.
- `src/http/app.ts`: Hono app creation and route registration.
- `src/worker.ts`: Worker fetch entrypoint.
- `src/cli/main.ts`: Source CLI dispatcher.
- `src/mcp/index.ts`: MCP source-module exports, not a package subpath.
- `examples/x402-protected-spend/run.ts`: APS proof artifact generator.
- `examples/mcp-reference-transcript/run.ts`: MCP transcript artifact generator.

**Configuration:**
- `package.json`: Package exports, scripts, files, dependencies.
- `wrangler.toml`: Worker, D1, KV binding configuration.
- `migrations/0001_protocol_kernel.sql`: D1 schema for protocol records and authority indexes.
- `.github/workflows/check.yml`: CI gate.
- `tsconfig.json`, `tsconfig.build.json`, `eslint.config.js`: TypeScript/lint/build configuration.

**Response Contracts:**
- `src/protocol/public/schemas.ts`: Public protocol object schemas.
- `src/protocol/public/inputs.ts`: Public transition input schemas.
- `src/protocol/foundation/reason-codes.ts`: Protocol reason-code registry.
- `src/http/routes/transition-response-schemas.ts`: HTTP success response schemas for composite transitions.
- `src/http/errors/transition-error-envelope.ts`: HTTP/SDK failure envelope.
- `src/protocol/evidence-projections/schemas.ts`: Redacted telemetry projection schemas.
- `src/surfaces/outcome.ts`: Shared non-authority surface outcome schema.
- `src/cli/output.ts`: CLI output envelope.
- `src/mcp/output.ts`: MCP tool result envelope.

**Runtime And Evidence Flow:**
- `src/runtime/ingress/index.ts`: Observed dispatch block parsing and proposal/refusal evidence.
- `src/mcp/x402-proposal.ts`: MCP proposal-to-runtime bridge.
- `src/mcp/resources.ts`: MCP evidence resource reads.
- `src/sdk/surface-clients/runtime-client.ts`: Runtime proposal route client.
- `src/sdk/surface-clients/evidence-client.ts`: Evidence projection route client.
- `src/http/handlers/evidence-read.ts`: HTTP projection handler.
- `src/protocol/evidence-projections/projections.ts`: Projection builders.

**Gateway And Adapter Flow:**
- `src/protocol/areas/gateway-gate/transitions.ts`: Gateway check transition behavior.
- `src/protocol/areas/gateway-gate/guards.ts`: Verified gateway check helpers.
- `src/adapters/x402-payment/wallet-gateway.ts`: Official x402 signing after verified gate.
- `src/adapters/x402-payment/install-proposal.ts`: x402 install compiler.
- `src/adapters/x402-payment/action-proposal.ts`: x402 exact action proposal builder.
- `src/adapters/x402-payment/upstream-evidence.ts`: Official PAYMENT-REQUIRED evidence decoding.
- `src/adapters/x402-payment/conformance.ts`: x402 cut-line and conformance classifications.
- `src/adapters/x402-payment/bypass-probes.ts`: Hostile x402 bypass probe executors.

**Storage Evidence:**
- `src/protocol/store/port.ts`: Store port and atomic commit contracts.
- `src/protocol/events/records.ts`: Stored protocol record building and transition request context attachment.
- `src/storage/d1/index.ts`: D1 store implementation.
- `src/storage/d1/statements.ts`: SQL statement construction.
- `src/storage/memory/index.ts`: In-memory store fixture.
- `migrations/0001_protocol_kernel.sql`: Durable reconstruction schema.

**Testing:**
- `test/architecture/root-exports.test.ts`: Root, runtime, role-client, conformance, experimental export guards.
- `test/architecture/package-surface.test.ts`: Package exports/files/scripts guard.
- `test/architecture/import-posture.test.ts`: Lane import posture and route metadata separation.
- `test/architecture/surface-boundary-posture.test.ts`: SDK/CLI/MCP/deferred surface boundary manifest guard.
- `test/architecture/cli-command-posture.test.ts`: CLI command/output non-authority guard.
- `test/architecture/mcp-surface-posture.test.ts`: MCP source/non-export/non-authority guard.
- `test/architecture/claim-boundary.test.ts`: Local proof and non-claim language guard.
- `test/protocol/reason-code-registry.test.ts`: Reason-code registry guard.
- `test/runtime/runtime-ingress.test.ts`: Runtime ingress contract/refusal/no-authority guard.
- `test/sdk/role-clients.test.ts`: Role-scoped client guard.
- `test/support/transition-budget-recorder.ts`: Committed telemetry harness that counts transition reads, writes, committed records, events, stream partitions, and store calls.
- `test/protocol/transition-budget-recorder.test.ts`: Committed budget guard for policy, gateway, receipt export, reconciliation, and recovery status transitions.
- `test/cli/cli-support-bundle.test.ts`: Support bundle redaction/non-authority guard.
- `test/mcp/mcp-reference-transcript.test.ts`: MCP transcript harness guard.
- `test/adapters/x402-wallet-gateway.test.ts`: x402 gateway signer custody and replay guard.
- `test/integration/x402-d1-http.test.ts`: x402 D1/HTTP establishment path guard.
- `test/product/x402-protected-spend-demo-report.test.ts`: APS proof report and role-client usage guard.

## Naming Conventions

**Files:**
- Use boring owned protocol nouns: `transition-response-schemas.ts`, `transition-error-envelope.ts`, `reason-codes.ts`, `support-bundle.ts`, `reference-transcript.ts`.
- Use lane-local `index.ts` public faces for multi-file directories.
- Avoid generic buckets such as `utils`, `helpers`, `common`, `misc`, `manager`, or `service`.

**Directories:**
- Use authority-boundary lanes under `src/`: `protocol`, `http`, `runtime`, `adapters`, `storage`, `sdk`, `cli`, `mcp`, `surfaces`, `install`, `conformance`.
- Use primitive-owned areas under `src/protocol/areas/*`.
- Use owned surface subdirectories such as `src/cli/local-project`, `src/cli/x402`, and `src/sdk/surface-clients`.

**Protocol Objects:**
- Keep object names exact: `ActionContract`, `PolicyDecision`, `Greenlight`, `GatewayCheck`, `Receipt`, `Refusal`, `ProofGap`, `IsolationState`.
- Keep response/telemetry names explicit: `TransitionErrorEnvelope`, `SurfaceOutcome`, `CliOutputEnvelope`, `ContractEvidenceProjection`, `AgentTransactionEnvelopeProjection`, `ReceiptTimelineProjection`.

## Where To Add New Code

**New Protocol Object Or Response Schema:**
- Primary code: `src/protocol/areas/<primitive>/schemas.ts`, `src/protocol/areas/<primitive>/inputs.ts`, `src/protocol/areas/<primitive>/transitions.ts`.
- Public aggregation: `src/protocol/public/schemas.ts`, `src/protocol/public/inputs.ts`.
- Tests: `test/protocol/<primitive>.test.ts`, `test/architecture/root-exports.test.ts` if exported.
- Evidence note: Add object-registry metadata in `src/protocol/areas/object-registry/*` when durable record/read/export posture changes.

**New Reason Code:**
- Primary code: `src/protocol/foundation/reason-codes.ts`.
- Schema use: `src/protocol/foundation/schema-core.ts` if the code affects public reason-code schema posture.
- Tests: `test/protocol/reason-code-registry.test.ts` and any transition test that emits the code.

**New HTTP Transition Or Success Response:**
- Route metadata: `src/http/routes/transition-route-registry.ts`.
- Response schema: `src/http/routes/transition-response-schemas.ts` for composite bodies.
- Invoker: `src/http/routes/transition-invokers.ts`.
- Scope: `src/http/routes/transition-scope-resolvers.ts`.
- Tests: `test/http/http.test.ts`, `test/http/d1-http.test.ts`, `test/architecture/import-posture.test.ts`.
- Guardrail: Keep metadata, invokers, and response schemas separated.

**New HTTP Error Envelope Field:**
- Primary code: `src/http/errors/transition-error-envelope.ts`.
- SDK parsing: `src/sdk/client.ts`, `src/sdk/surface-clients/transport.ts`.
- Tests: `test/http/http.test.ts`, `test/sdk/role-clients.test.ts` if role clients surface it.

**New Redacted Evidence Projection:**
- Projection schema: `src/protocol/evidence-projections/schemas.ts`.
- Projection builder: `src/protocol/evidence-projections/projections.ts`.
- HTTP route: `src/http/routes/evidence-read-route-registry.ts`.
- HTTP handler: `src/http/handlers/evidence-read.ts`.
- SDK read: `src/sdk/client.ts` and, if Tier 2 evidence-safe, `src/sdk/surface-clients/evidence-client.ts`.
- MCP resource: `src/mcp/catalog.ts` and `src/mcp/resources.ts` only if model-facing readback is required.
- CLI wrapper: `src/cli/projection-evidence.ts` or `src/cli/support-bundle.ts` only if operator evidence readback is required.
- Tests: `test/protocol/evidence-projections.test.ts`, `test/http/http.test.ts`, `test/sdk/role-clients.test.ts`, `test/mcp/mcp-resource-redaction.test.ts`, `test/cli/cli-evidence.test.ts`.

**New SDK Role-Scoped Method:**
- Runtime proposal method: `src/sdk/surface-clients/runtime-client.ts`.
- Evidence read method: `src/sdk/surface-clients/evidence-client.ts`.
- Transport changes: `src/sdk/surface-clients/transport.ts`.
- Export changes: `src/sdk/surface-clients/index.ts`, `package.json`, `test/architecture/package-surface.test.ts`.
- Tests: `test/sdk/role-clients.test.ts`, `test/architecture/root-exports.test.ts`, `test/architecture/surface-boundary-posture.test.ts`.
- Guardrail: Do not add policy, gateway, receipt export, install, certificate mint, signer, raw record, or all-role token behavior to role clients.

**New CLI Command:**
- Manifest: `src/cli/command-manifest.ts`.
- Output envelope: `src/cli/output.ts`.
- Dispatcher: `src/cli/main.ts`.
- Command implementation: `src/cli/<owned-area>.ts` or an existing owned subdirectory such as `src/cli/local-project/*` or `src/cli/x402/*`.
- Surface manifest: `src/surfaces/boundary-manifest.ts`.
- Tests: `test/architecture/cli-command-posture.test.ts`, `test/architecture/surface-boundary-posture.test.ts`, plus `test/cli/<feature>.test.ts`.
- Guardrail: Do not create mutation-shaped command names, child process launchers, gateway checks, policy evaluation, receipt exports, raw records, or credential material.

**New MCP Tool Or Resource:**
- Catalog: `src/mcp/catalog.ts`.
- Tool proposal bridge: `src/mcp/<action>-proposal.ts`.
- Resource read: `src/mcp/resources.ts`.
- Output: `src/mcp/output.ts`, `src/surfaces/outcome.ts`.
- Transcript harness: `src/mcp/reference-transcript.ts`, `src/mcp/reference-transcript-fixtures.ts`, `examples/mcp-reference-transcript/run.ts`.
- Surface manifest: `src/surfaces/boundary-manifest.ts`.
- Tests: `test/mcp/*`, `test/architecture/mcp-surface-posture.test.ts`, `test/architecture/surface-boundary-posture.test.ts`.
- Guardrail: Do not add an MCP process, package export, gateway check, payment signing, receipt export, certificate mint, raw record read, or all-role client import without a deliberate boundary change.

**New Runtime Ingress Family:**
- Ingress schema and orchestration: `src/runtime/ingress/index.ts`.
- Family proposal helper: `src/runtime/<family>/action-proposal.ts` or adapter-owned helper when the action family is adapter-specific.
- Runtime subpath export: `src/runtime/index.ts` only for observer/compiler helpers.
- Tests: `test/runtime/runtime-ingress.test.ts`, family-specific `test/runtime/<family>.test.ts`, `test/architecture/claim-boundary.test.ts`.
- Guardrail: Runtime may create runtime evidence, graph evidence, tool-call drafts, intent compilations, action contracts, and refusals only.

**New Adapter Fixture Or x402 Extension:**
- Reference gateway: `src/adapters/<family>/gateway.ts`.
- x402 exact proof profile: `src/adapters/x402-payment/*`.
- Conformance: `src/conformance/index.ts` or adapter-local `src/adapters/<family>/conformance.ts`.
- Experimental export: `src/experimental.ts` only for explicitly experimental fixtures.
- Tests: `test/adapters/<family>.test.ts`, `test/conformance/<family>.test.ts`, `test/architecture/import-posture.test.ts`, `test/architecture/root-exports.test.ts`.
- Guardrail: Mutation must happen only after `VerifiedGatewayCheck`; adapters must not import storage internals or use SDK/runtime as authority.

**New auth.md Adapter Work:**
- Current working-tree files: `src/adapters/auth-md/index.ts`, `src/adapters/auth-md/profiles.ts`, `src/adapters/auth-md/action-proposal.ts`, `test/adapters/auth-md-adapter.test.ts`.
- Tracked dirty export/doc guards: `src/experimental.ts`, `src/adapters/LANE.md`, `STRUCTURE.md`, `docs/internal/protocol-notes.md`, `test/architecture/root-exports.test.ts`.
- Placement: keep auth.md under `src/adapters/auth-md/` as an experimental/reference adapter profile until committed and guarded.
- Guardrail: It may normalize Protected Resource Metadata, prepare opaque `GatewayCredentialRef` intake, and propose exact service-call contracts. It must not issue policy, greenlight, gateway check, receipt, credential material, hosted identity, auth-provider, OAuth-server, certification, provider-custody, or generic API-gateway claims.

**New Storage Evidence Or Index:**
- Store contract: `src/protocol/store/port.ts`.
- D1 implementation: `src/storage/d1/index.ts`.
- SQL statements: `src/storage/d1/statements.ts`.
- D1 schema: `migrations/0001_protocol_kernel.sql`.
- Memory fixture: `src/storage/memory/index.ts`.
- Tests: `test/protocol/protocol-store-atomicity-contract.test.ts`, `test/http/d1-http.test.ts`, `test/protocol/fault-injecting-protocol-store.test.ts`.
- Guardrail: Storage stores evidence and atomic indexes; it must not interpret protocol meaning.

**New Demo Or Report Artifact:**
- APS-style x402 report: `examples/x402-protected-spend/run.ts`, `examples/x402-protected-spend/README.md`.
- MCP transcript report: `examples/mcp-reference-transcript/run.ts`, `examples/mcp-reference-transcript/README.md`.
- Tests: `test/product/x402-protected-spend-demo-report.test.ts`, `test/mcp/mcp-reference-transcript.test.ts`.
- Guardrail: Demo outputs must state local/reference posture and non-claims, and generated output under `examples/*/output/` is artifact evidence, not source authority.

**New Architecture Guard:**
- Import/export/package posture: `test/architecture/import-posture.test.ts`, `test/architecture/root-exports.test.ts`, `test/architecture/package-surface.test.ts`.
- Surface posture: `test/architecture/surface-boundary-posture.test.ts`, `test/architecture/cli-command-posture.test.ts`, `test/architecture/mcp-surface-posture.test.ts`.
- Claims/naming/vocabulary: `test/architecture/claim-boundary.test.ts`, `test/architecture/active-vocabulary.test.ts`, `test/architecture/naming-posture.test.ts`.
- Guardrail: Add guard tests before expanding source-facing authority surfaces.

**New Transition-Budget Telemetry Guard:**
- Harness: `test/support/transition-budget-recorder.ts`.
- Tests: `test/protocol/transition-budget-recorder.test.ts`.
- Use for: guarding read/write/record/event/partition fan-out of authority-bearing transitions.
- Guardrail: This is local test telemetry for architecture drift, not hosted observability, provider operation, clearing-house monitoring, or execution authority.

## Active Tier 2 Surface Ownership

**Shared surface boundary:**
- Source: `src/surfaces/boundary-manifest.ts`.
- Active ids: `sdk.runtime`, `sdk.evidence`, `cli.operator`, `cli.evidence`, `mcp.runtime`.
- Deferred ids: `sdk.install`, `sdk.gateway`, `cli.process`.
- Tests: `test/architecture/surface-boundary-posture.test.ts`.

**Protocol and telemetry surfaces:**
- Protocol objects: `src/protocol/public/schemas.ts`, `src/protocol/areas/*/schemas.ts`.
- Reason codes: `src/protocol/foundation/reason-codes.ts`.
- Evidence projections: `src/protocol/evidence-projections/*`.
- Tests: `test/protocol/*`, `test/architecture/root-exports.test.ts`.

**HTTP response surfaces:**
- Transition routes: `src/http/routes/transition-route-registry.ts`.
- Success responses: `src/http/routes/transition-response-schemas.ts`.
- Error envelope: `src/http/errors/transition-error-envelope.ts`.
- Evidence reads: `src/http/routes/evidence-read-route-registry.ts`, `src/http/handlers/evidence-read.ts`.
- Raw record guard: `src/http/handlers/internal-record-read.ts`.
- Tests: `test/http/*`, `test/architecture/import-posture.test.ts`.

**SDK surfaces:**
- Low-level compatibility client: `src/sdk/client.ts`.
- Role-scoped activation clients: `src/sdk/surface-clients/*`.
- Package subpath: `package.json` entry `./sdk/role-clients`.
- Tests: `test/sdk/role-clients.test.ts`, `test/architecture/root-exports.test.ts`, `test/architecture/package-surface.test.ts`.

**CLI surfaces:**
- Command manifest: `src/cli/command-manifest.ts`.
- Output envelope: `src/cli/output.ts`.
- Support bundle: `src/cli/support-bundle.ts`.
- Local project posture: `src/cli/local-project/*`.
- Local x402 posture: `src/cli/x402/*`.
- Tests: `test/cli/*`, `test/architecture/cli-command-posture.test.ts`.

**MCP surfaces:**
- Catalog: `src/mcp/catalog.ts`.
- Resource reads: `src/mcp/resources.ts`.
- x402 proposal: `src/mcp/x402-proposal.ts`.
- Transcript: `src/mcp/reference-transcript.ts`, `src/mcp/reference-transcript-fixtures.ts`.
- Tests: `test/mcp/*`, `test/architecture/mcp-surface-posture.test.ts`.

**Runtime ingress surfaces:**
- Public subpath: `src/runtime/index.ts`.
- Ingress implementation: `src/runtime/ingress/index.ts`.
- Tests: `test/runtime/runtime-ingress.test.ts`, `test/architecture/claim-boundary.test.ts`.

**Adapter and x402 surfaces:**
- Reference gateways: `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, `src/adapters/preview-deploy/gateway.ts`.
- x402 proof profile: `src/adapters/x402-payment/*`.
- Visible dirty auth.md profile: `src/adapters/auth-md/*` and `test/adapters/auth-md-adapter.test.ts`, not committed architecture.
- Conformance subpath: `src/conformance/index.ts`.
- Experimental subpath: `src/experimental.ts`.
- Tests: `test/adapters/*`, `test/conformance/*`, `test/integration/x402-d1-http.test.ts`.

**Committed telemetry guards:**
- Store wrapper: `test/support/transition-budget-recorder.ts`.
- Budget tests: `test/protocol/transition-budget-recorder.test.ts`.
- Purpose: local transition-cost and evidence fan-out drift detection.
- Boundary: test-only architecture telemetry, not runtime monitoring or authority.

## Special Directories

**`.planning/`:**
- Purpose: Scratch planning and mapper outputs.
- Generated: Yes.
- Committed: Context-dependent scratch; not repo truth.
- Boundary: Do not use `.planning/*` as source path, package export, script name, CI label, or canonical docs source.

**`examples/*/output/`:**
- Purpose: Generated demo artifacts.
- Generated: Yes.
- Committed: Output placeholders and latest artifacts may exist, but source behavior lives in `examples/*/run.ts` and `src/*`.
- Boundary: Output artifacts are evidence snapshots, not protocol authority.

**`dist/`:**
- Purpose: Generated TypeScript declaration build output.
- Generated: Yes.
- Committed: Package check artifact depending on local workflow.
- Boundary: Do not edit by hand.

**`node_modules/`:**
- Purpose: Installed dependencies.
- Generated: Yes.
- Committed: No.
- Boundary: Do not inspect as source truth unless debugging dependency behavior.

**`migrations/`:**
- Purpose: Canonical D1 schema for protocol storage.
- Generated: No.
- Committed: Yes.
- Boundary: Storage schema only; no product claims or runtime behavior.

**`.github/`:**
- Purpose: CI workflow.
- Generated: No.
- Committed: Yes.
- Boundary: Must run `npm run check:repo`.

---

*Structure analysis: 2026-05-23*
