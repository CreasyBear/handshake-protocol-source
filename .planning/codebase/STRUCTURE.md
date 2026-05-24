# Codebase Structure

**Analysis Date:** 2026-05-24

## Directory Layout

```text
[project-root]/
├── AGENTS.md                    # Doctrine, invariants, planning rules, response posture.
├── README.md                    # Current repo orientation, source map, commands, local/reference claim boundary.
├── QUALITY.md                   # TypeScript quality, naming, and Tier 1 gate rules.
├── STRUCTURE.md                 # Tracked source/test/docs ownership map.
├── package.json                 # Publishable package exports, command contract, bins, and MCP name.
├── server.json                  # MCP Registry metadata for the local stdio proposal/evidence server.
├── bin/                         # Thin Node wrappers for bundled CLI and MCP entrypoints.
├── bun.lock                     # Bun dependency lockfile.
├── tsconfig.json                # TypeScript source typecheck config.
├── tsconfig.build.json          # Declaration build config.
├── eslint.config.js             # ESLint config.
├── wrangler.toml                # Cloudflare Worker/D1/KV binding configuration.
├── migrations/
│   └── 0001_protocol_kernel.sql # D1 protocol record, stream, greenlight, ledger, isolation, receipt indexes.
├── docs/
│   └── internal/                # Compact tracked protocol canon and durable implementation decisions.
├── examples/
│   ├── self-hosted-activation/  # Local activation packet proof.
│   ├── x402-protected-spend/    # Local x402 protected-spend report.
│   └── mcp-reference-transcript/# Local MCP proposal/evidence transcript.
├── scripts/
│   ├── build-package-bundles.mjs# Node ESM bundle build for public imports and bins.
│   ├── check-package-surface.mjs# Pack-surface guard.
│   └── check-published-entrypoints.mjs # Node CLI/MCP bin smoke gate.
├── src/
│   ├── protocol/                # Protocol meaning and transition authority.
│   ├── http/                    # Hono/Worker transport, admission, routes, evidence reads.
│   ├── runtime/                 # Generated-execution proposal helpers; not authority.
│   ├── mcp/                     # Model-facing proposal/evidence surface; not authority.
│   ├── adapters/                # Reference gateway fixtures and adapter profiles.
│   ├── install/                 # Protected-action install proposal compiler contracts.
│   ├── storage/                 # D1, memory, KV, and store mechanics.
│   ├── sdk/                     # Typed HTTP clients and role-scoped runtime/evidence clients.
│   ├── cli/                     # Local evidence and command-manifest wrappers.
│   ├── conformance/             # Reference posture checks.
│   ├── surfaces/                # Non-authority surface boundary manifest.
│   ├── index.ts                 # Curated package root export.
│   ├── experimental.ts          # Explicit reference adapter surface.
│   └── worker.ts                # Cloudflare Worker entrypoint.
├── test/
│   ├── architecture/            # Repo shape, import, claim, package, CLI/MCP/surface guards.
│   ├── protocol/                # Primitive and state-machine invariants.
│   ├── runtime/                 # Runtime ingress and codemode proposal behavior.
│   ├── mcp/                     # MCP proposal/resource/process contracts.
│   ├── adapters/                # Reference gateway fixtures.
│   ├── integration/             # End-to-end protected action paths.
│   ├── conformance/             # Adapter/conformance checks.
│   ├── http/                    # Hono/D1 transport behavior.
│   ├── sdk/                     # SDK role clients.
│   ├── cli/                     # CLI local evidence/readback behavior.
│   ├── product/                 # Self-hosted activation/product proof slices.
│   └── support/                 # Test fixtures and harnesses.
├── dist/                        # Generated declaration/build output; not source authority.
├── .github/workflows/check.yml  # CI gate bound to `npm run check:repo`.
└── .planning/                   # Scratch planning/mapper output; not repo truth.
```

## Directory Purposes

**Root Canon Files:**
- Purpose: Define active repo truth and operating rules.
- Contains: `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/*`.
- Key files: `docs/internal/decisions.md`, `docs/internal/protocol-definition.md`, `docs/internal/protocol-kernel-architecture.md`, `docs/internal/protocol-notes.md`.
- Guidance: Use tracked canon for claims. Use `.planning/` only as derived scratch.

**`src/protocol/`:**
- Purpose: Own protocol meaning: action contracts, policy decisions, one-use greenlights, gateway checks, receipts, refusals, proof gaps, isolation, recovery, review binding, generated-execution evidence boundaries, canonicalization, events, and store port.
- Contains: `kernel.ts`, `areas/*`, `foundation/*`, `events/*`, `context/*`, `navigation/*`, `public/*`, `evidence-projections/*`, `store/*`.
- Key files: `src/protocol/kernel.ts`, `src/protocol/areas/action-contract/transitions.ts`, `src/protocol/areas/policy-greenlight/transitions.ts`, `src/protocol/areas/gateway-gate/transitions.ts`, `src/protocol/store/port.ts`.
- Guidance: Add protocol primitives under `src/protocol/areas/<primitive>/` with `schemas.ts`, `inputs.ts`, `types.ts`, `transitions.ts`, and `index.ts`. Do not import HTTP, SDK, runtime wrappers, storage implementations, or adapter fixtures.

**`src/protocol/areas/`:**
- Purpose: Own individual protocol primitives and state transitions.
- Contains: `action-contract`, `authority-certificate`, `bypass-probe`, `catalog-envelope`, `credential-custody`, `gateway-gate`, `generated-execution-graph`, `idempotency-ledger`, `intent-compilation`, `isolation-breaker`, `operation-lifecycle`, `policy-greenlight`, `proof-gap`, `protected-path-posture`, `receipt-export`, `recovery`, `refusal`, `review-binding`, `runtime-evidence`, `tool-call-draft`, and object/representation/lifecycle support areas.
- Key files: `src/protocol/areas/object-registry/index.ts`, `src/protocol/areas/credential-custody/transitions.ts`, `src/protocol/areas/gateway-gate/artifacts.ts`.
- Guidance: Area internals may import other areas through public indexes only. Schema/type faces stay local unless deliberately aggregated through `src/protocol/public/*`.

**`src/protocol/foundation/`:**
- Purpose: Own base protocol mechanics.
- Contains: canonicalization, content digests, IDs, errors, reason codes, base schemas, transition guards.
- Key files: `src/protocol/foundation/canonical.ts`, `src/protocol/foundation/content-digests.ts`, `src/protocol/foundation/errors.ts`, `src/protocol/foundation/reason-codes.ts`.
- Guidance: Put deterministic, protocol-wide helpers here only when they are not an area-owned behavior.

**`src/protocol/events/`:**
- Purpose: Own ordered stream event schemas, digest chains, and record commits.
- Contains: `chains.ts`, `records.ts`, `schemas.ts`.
- Key files: `src/protocol/events/chains.ts`, `src/protocol/events/records.ts`.
- Guidance: Use events for reconstruction evidence, not logging as authority.

**`src/protocol/evidence-projections/`:**
- Purpose: Own redacted diagnostic projections.
- Contains: projection assembly, schemas, projection builders.
- Key files: `src/protocol/evidence-projections/assembly.ts`, `src/protocol/evidence-projections/projections.ts`.
- Guidance: Add audit/search/user-facing evidence as purpose-built redacted projections, not generic raw record reads.

**`src/protocol/public/`:**
- Purpose: Public schema/input aggregation only.
- Contains: `schemas.ts`, `inputs.ts`, `transitions.ts`.
- Key files: `src/protocol/public/schemas.ts`, `src/protocol/public/inputs.ts`.
- Guidance: Keep as `export * from ...` aggregators. Do not add behavior.

**`src/http/`:**
- Purpose: Own Hono/Worker transport, route metadata, admission, request context, errors, OpenAPI, evidence read handlers, and store/kernel resolution.
- Contains: `app.ts`, `app-options.ts`, `admission/*`, `routes/*`, `handlers/*`, `errors/*`, `openapi/*`, `navigation/*`, `store/*`.
- Key files: `src/http/app.ts`, `src/http/routes/transition-route-registry.ts`, `src/http/routes/transition-invokers.ts`, `src/http/admission/index.ts`, `src/http/store/resolution.ts`.
- Guidance: Add transition routes by updating `src/http/routes/transition-route-registry.ts`, `src/http/routes/transition-invokers.ts`, response schemas when needed, and route tests under `test/http/`. Do not put protocol meaning in HTTP.

**`src/runtime/`:**
- Purpose: Own generated-execution proposal helpers and runtime ingress. Runtime is observer/compiler evidence, not authority.
- Contains: `ingress/index.ts`, `package-install/action-proposal.ts`, `repo-write/action-proposal.ts`, `preview-deploy/action-proposal.ts`, `codemode-multi-action/*`.
- Key files: `src/runtime/ingress/index.ts`, `src/runtime/codemode-multi-action/generated-program-runner.ts`, `src/runtime/index.ts`.
- Guidance: Add runtime families only when they emit the same protocol evidence shape and return explicit non-authority posture. Do not issue policy decisions, greenlights, gateway checks, receipts, or mutation attempts.

**`src/mcp/`:**
- Purpose: Own model-facing proposal/evidence catalog, schemas, resource mapping, and local stdio process proof.
- Contains: `catalog.ts`, `output.ts`, `resources.ts`, `x402-proposal.ts`, `digest.ts`, `stdio/*`, `reference-transcript.ts`, `reference-transcript-fixtures.ts`.
- Key files: `src/mcp/catalog.ts`, `src/mcp/x402-proposal.ts`, `src/mcp/resources.ts`, `src/mcp/stdio/server.ts`.
- Guidance: MCP can propose and read redacted evidence. It must not import protocol kernel internals, gateway transitions, adapters, storage, signer material, or all-role SDK clients.

**`src/adapters/`:**
- Purpose: Own reference adapter profiles, bypass probes, and gateway fixtures that mutate only after `VerifiedGatewayCheck`.
- Contains: `auth-md/*`, `x402-payment/*`, `package-install/gateway.ts`, `repo-write/gateway.ts`, `preview-deploy/gateway.ts`, `protected-path-probes/*`, `downstream-failure-evidence.ts`.
- Key files: `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/auth-md/gateway.ts`, `src/adapters/auth-md/action-proposal.ts`.
- Guidance: Put signer/payment/credential-use code only in gateway-owned adapter files. Keep official x402 signer imports inside `src/adapters/x402-payment/wallet-gateway.ts`. Adapter barrels must not expose raw signer factories unless explicitly guarded.

**`src/install/`:**
- Purpose: Own generic install proposal and protected-action adapter-pack contracts.
- Contains: `install-proposal/index.ts`, `protected-action-adapter-pack/index.ts`.
- Key files: `src/install/install-proposal/index.ts`, `src/install/protected-action-adapter-pack/index.ts`.
- Guidance: Install proposals compile protected paths into kernel records. They do not create policy decisions, greenlights, gateway checks, receipts, signatures, or downstream success claims.

**`src/storage/`:**
- Purpose: Own atomic record/store mechanics and cache plumbing.
- Contains: `d1/*`, `memory/*`, `kv/*`, `store.ts`.
- Key files: `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `src/storage/memory/index.ts`, `src/storage/kv/index.ts`.
- Guidance: Storage sees protocol objects as durable evidence. It must not decide protocol meaning, policy, lifecycle, recovery, proof-gap, or gateway state semantics.

**`src/sdk/`:**
- Purpose: Own typed HTTP client ergonomics and role-scoped runtime/evidence clients.
- Contains: `client.ts`, `surface-clients/*`.
- Key files: `src/sdk/client.ts`, `src/sdk/surface-clients/runtime-client.ts`, `src/sdk/surface-clients/evidence-client.ts`, `src/sdk/surface-clients/transport.ts`.
- Guidance: Add role-scoped clients under `src/sdk/surface-clients/` and update `src/surfaces/boundary-manifest.ts`. Do not add all-role token maps to activation paths.

**`src/cli/`:**
- Purpose: Own local command manifest, redacted evidence rendering, local project config, support bundle, x402 local install/probe helpers, and certificate verification wrapper.
- Contains: `command-manifest.ts`, `main.ts`, `output.ts`, `aps-report.ts`, `certificate.ts`, `projection-evidence.ts`, `support-bundle.ts`, `local-project/*`, `x402/*`.
- Key files: `src/cli/command-manifest.ts`, `src/cli/certificate.ts`, `src/cli/x402/index.ts`.
- Guidance: CLI commands are evidence/setup/readiness commands. Do not add mutation-shaped command names, gateway runners, process startup, raw record export, policy evaluation, gateway checks, or signer factories.

**`src/conformance/`:**
- Purpose: Own source-package conformance checks without standards certification claims.
- Contains: `index.ts`.
- Key files: `src/conformance/index.ts`.
- Guidance: Add narrow invariant probes one at a time. Do not imply provider-side gateway certification.

**`src/surfaces/`:**
- Purpose: Own internal boundary manifests for non-kernel product surfaces.
- Contains: `boundary-manifest.ts`, `outcome.ts`.
- Key files: `src/surfaces/boundary-manifest.ts`.
- Guidance: Surface ids must declare custody role, authority posture, source roots, route families, forbidden imports, forbidden credential/output shapes, non-authority flags, and claim-boundary labels before implementation expands.

**`test/`:**
- Purpose: Mirror ownership and enforce protocol/state/architecture claims.
- Contains: architecture, protocol, runtime, MCP, adapters, integration, conformance, HTTP, SDK, CLI, product, support tests.
- Key files: `test/architecture/import-posture.test.ts`, `test/architecture/root-exports.test.ts`, `test/architecture/surface-boundary-posture.test.ts`, `test/protocol/model-based-invariants.test.ts`, `test/integration/x402-d1-http.test.ts`.
- Guidance: Place tests beside ownership lanes, not in root `test/*.test.ts`.

**`examples/`:**
- Purpose: Produce local/reference evidence packets for self-hosted activation, x402 protected-spend, and MCP reference transcript.
- Contains: `examples/self-hosted-activation/*`, `examples/x402-protected-spend/*`, `examples/mcp-reference-transcript/*`.
- Key files: `examples/self-hosted-activation/run.ts`, `examples/x402-protected-spend/run.ts`, `examples/mcp-reference-transcript/run.ts`.
- Guidance: Examples must preserve local/reference labels and not claim hosted/provider operation.

**`migrations/`:**
- Purpose: Own canonical D1 schema for protocol storage.
- Contains: `migrations/0001_protocol_kernel.sql`.
- Key files: `migrations/0001_protocol_kernel.sql`.
- Guidance: Add schema changes that preserve durable reconstruction, greenlight consumption, idempotency, isolation, operation-claim, receipt, and stream-event invariants.

**`dist/`:**
- Purpose: Generated declaration and Node ESM bundle output used by package surface checks.
- Contains: generated declaration files mirroring `src/` plus bundled public import and bin artifacts.
- Key files: `bin/handshake`, `bin/handshake-mcp`, `dist/index.d.ts`, `dist/index.mjs`, `dist/bin/handshake.mjs`, `dist/bin/handshake-mcp.mjs`.
- Guidance: Do not edit by hand. Regenerate through `npm run build`.

**`.planning/`:**
- Purpose: Scratch planning, mapper outputs, macro plans, phase plans, strategy notes.
- Contains: `.planning/codebase/*` plus planning subtrees.
- Key files: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`.
- Guidance: Do not promote `.planning/` paths, labels, stage names, or scratch claims into source, README, scripts, CI, exported symbols, or canonical docs unless explicitly validated and promoted.

## Key File Locations

**Entry Points:**
- `src/index.ts`: Curated stable root package export.
- `src/experimental.ts`: Explicit experimental/reference adapter export surface.
- `src/runtime/index.ts`: Runtime proposal subpath export.
- `src/sdk/surface-clients/index.ts`: Role-scoped SDK activation clients.
- `src/conformance/index.ts`: Conformance subpath export.
- `src/worker.ts`: Cloudflare Worker entrypoint.
- `src/http/app.ts`: Hono app factory.
- `src/cli/main.ts`: CLI entrypoint.
- `src/mcp/stdio/entry.ts`: Local MCP stdio process entrypoint.

**Configuration:**
- `package.json`: Package exports, command contract, CLI/MCP bins, and MCP registry name.
- `server.json`: MCP Registry metadata for npm/stdio package publication.
- `bin/`: Thin Node wrappers that import bundled `dist/bin/*` artifacts.
- `tsconfig.json`: TypeScript source typecheck.
- `tsconfig.build.json`: Declaration build.
- `eslint.config.js`: ESLint.
- `.prettierrc.json`: Prettier.
- `.prettierignore`: Excludes `dist`, `.planning`, generated output, and tool folders from Prettier.
- `wrangler.toml`: Worker bindings.
- `.github/workflows/check.yml`: CI gate.

**Canonical Docs:**
- `AGENTS.md`: Doctrine and invariant language.
- `README.md`: Source map, commands, local/reference claims.
- `QUALITY.md`: Quality, naming, and gates.
- `STRUCTURE.md`: Source/test/docs ownership.
- `docs/internal/decisions.md`: Durable decisions.
- `docs/internal/protocol-definition.md`: Canonical protocol definition.
- `docs/internal/protocol-kernel-architecture.md`: Kernel architecture and schema map.
- `docs/internal/protocol-layman.md`: Plain-English protocol translation.
- `docs/internal/protocol-notes.md`: Compact implementation notes.

**Core Protocol Logic:**
- `src/protocol/kernel.ts`: Transition facade.
- `src/protocol/areas/catalog-envelope/*`: Tool/action/gateway/envelope declarations.
- `src/protocol/areas/runtime-evidence/*`: Runtime execution evidence.
- `src/protocol/areas/generated-execution-graph/*`: Generated-code/spec graph evidence.
- `src/protocol/areas/tool-call-draft/*`: Generated tool-call state.
- `src/protocol/areas/intent-compilation/*`: Candidate/refusal boundary.
- `src/protocol/areas/action-contract/*`: Exact contract canonicalization.
- `src/protocol/areas/policy-greenlight/*`: Policy decisions, one-use greenlights, idempotency, review integration.
- `src/protocol/areas/gateway-gate/*`: Gateway checks, replay refusal, receipt/proof-gap artifacts.
- `src/protocol/areas/credential-custody/*`: Gateway credential refs and post-gate credential resolution evidence.
- `src/protocol/areas/operation-lifecycle/*`: Downstream reconciliation.
- `src/protocol/areas/receipt-export/*`: Receipt and receipt export.
- `src/protocol/areas/refusal/*`: Refusal evidence.
- `src/protocol/areas/proof-gap/*`: Proof-gap records.
- `src/protocol/areas/isolation-breaker/*`: Isolation and breaker state.
- `src/protocol/areas/recovery/*`: Recovery recommendations and terminal conflict handling.
- `src/protocol/areas/authority-certificate/*`: Terminal signed evidence and offline verification.

**Transport And Evidence Reads:**
- `src/http/routes/transition-route-registry.ts`: Route metadata, roles, scope resolvers, schemas.
- `src/http/routes/transition-invokers.ts`: Route-to-kernel dispatch.
- `src/http/handlers/evidence-read.ts`: Redacted evidence projections.
- `src/http/handlers/internal-record-read.ts`: Generic raw read guarded by object-registry posture.
- `src/http/admission/*`: Role-scoped token and hosted caller admission seams.
- `src/http/store/resolution.ts`: D1/fallback store resolution and `HandshakeKernel` construction.

**Runtime/MCP Non-Authority Surfaces:**
- `src/runtime/ingress/index.ts`: Runtime dispatch block schema and proposal orchestration.
- `src/runtime/codemode-multi-action/generated-program-runner.ts`: Codemode multi-action proposal runner.
- `src/mcp/catalog.ts`: MCP tools/resources catalog.
- `src/mcp/x402-proposal.ts`: Strict MCP x402 proposal bridge.
- `src/mcp/resources.ts`: Read-only evidence resource mapping.
- `src/surfaces/boundary-manifest.ts`: Non-authority surface contracts.

**x402 Adapter Boundary:**
- `src/adapters/x402-payment/install-proposal.ts`: x402 adapter pack and install records.
- `src/adapters/x402-payment/action-proposal.ts`: x402 runtime/action-contract proposal builder.
- `src/adapters/x402-payment/wallet-gateway.ts`: Verified-gate wallet gateway and official signer/payment payload boundary.
- `src/adapters/x402-payment/bypass-probes.ts`: Hostile bypass/custody probes.
- `src/adapters/x402-payment/conformance.ts`: x402 conformance checks.
- `src/adapters/x402-payment/index.ts`: Adapter barrel that intentionally omits the official signer factory.

**Auth.md Adapter Boundary:**
- `src/adapters/auth-md/profiles.ts`: Redacted discovery/registration/identity/claim/revocation evidence shapes.
- `src/adapters/auth-md/action-proposal.ts`: Exact protected API-call proposal builder.
- `src/adapters/auth-md/gateway.ts`: Gateway-check, credential-resolution, protected-call, reconciliation path.
- `src/adapters/auth-md/revocation.ts`: Credential lifecycle isolation mapping.
- `src/adapters/auth-md/bypass-probes.ts`: Hostile bypass probes.

**Storage And Reconstruction:**
- `src/protocol/store/port.ts`: Store interface and atomic commit contracts.
- `src/storage/d1/index.ts`: D1 `ProtocolStore` implementation.
- `src/storage/d1/statements.ts`: D1 SQL statement assembly.
- `src/storage/memory/index.ts`: In-memory test/reference store.
- `src/storage/kv/index.ts`: KV cache helpers.
- `migrations/0001_protocol_kernel.sql`: D1 durable schema.

**Testing:**
- `test/architecture/import-posture.test.ts`: Layer and import rules.
- `test/architecture/root-exports.test.ts`: Curated exports.
- `test/architecture/package-surface.test.ts`: Package publish posture, files, exports, bins, and MCP registry metadata.
- `test/architecture/surface-boundary-posture.test.ts`: SDK/CLI/MCP non-authority boundaries.
- `test/architecture/mcp-surface-posture.test.ts`: MCP authority/import/credential posture.
- `test/architecture/cli-command-posture.test.ts`: CLI command posture.
- `test/architecture/claim-boundary.test.ts`: Claim boundary.
- `test/protocol/*`: Protocol invariants and state machines.
- `test/runtime/*`: Runtime ingress/codemode proposal behavior.
- `test/mcp/*`: MCP catalog/resource/proposal/process behavior.
- `test/adapters/*`: Gateway fixtures.
- `test/integration/*`: End-to-end protected action paths.
- `test/conformance/*`: Adapter/conformance checks.

## Naming Conventions

**Files:**
- Use owned protocol nouns and lane nouns: `action-contract`, `gateway-gate`, `credential-custody`, `generated-execution-graph`, `protected-path-posture`.
- Use `schemas.ts`, `inputs.ts`, `types.ts`, `transitions.ts`, `guards.ts`, `index.ts` inside protocol areas.
- Use `action-proposal.ts` for runtime/adapter proposal helpers, for example `src/adapters/x402-payment/action-proposal.ts`.
- Use `gateway.ts` or `wallet-gateway.ts` for reference gateway fixtures, for example `src/adapters/auth-md/gateway.ts` and `src/adapters/x402-payment/wallet-gateway.ts`.
- Use `LANE.md` at first-level `src/*` directories to declare ownership and extraction posture.

**Directories:**
- Split by authority boundary, not generic buckets.
- Put primitive behavior under `src/protocol/areas/<primitive>/`.
- Put transport under `src/http/`, client under `src/sdk/`, runtime proposal under `src/runtime/`, model-facing proposal/evidence under `src/mcp/`, and reference fixtures under `src/adapters/`.
- Avoid banned bucket names such as `utils`, `helpers`, `common`, `misc`, `stuff`, `manager`, and `service` unless `STRUCTURE.md` explicitly creates an exception.

**Exports:**
- Root exports stay curated in `src/index.ts`.
- Reference gateway fixtures stay behind `src/experimental.ts`.
- Runtime ingress stays behind `src/runtime/index.ts` and the `./runtime` package subpath.
- Role-scoped activation clients stay behind `src/sdk/surface-clients/index.ts` and `./sdk/role-clients`.
- Conformance stays behind `src/conformance/index.ts` and `./conformance`.
- Do not export `HandshakeKernel`, stores, MCP internals, surface manifests, signer factories, or gateway runners from the package root unless root export tests are deliberately changed.

**Protocol Object Names:**
- Preserve exact object nouns: `ActionContract`, `PolicyDecision`, `Greenlight`, `GatewayCheck`, `Receipt`, `Refusal`, `ProofGap`, `IsolationState`.
- Durable write functions should use explicit verbs such as `record*`, `persist*`, `commit*`, `consume*`, `mark*`, `activate*`.
- Read/derivation functions should use `get*`, `list*`, `derive*`, `build*`, `format*`, `resolve*`.
- Avoid overclaiming names such as `ensureSafe*`, `guarantee*`, `proveExecution*`, `trustedAgent*`, and `secureApproval*`.

## Where to Add New Code

**New Protocol Primitive:**
- Primary code: `src/protocol/areas/<primitive>/`
- Required files: `schemas.ts`, `inputs.ts`, `types.ts`, `transitions.ts`, `index.ts`
- Registry updates: `src/protocol/areas/object-registry/index.ts`, `src/protocol/areas/object-registry/schemas.ts`
- Public aggregation: `src/protocol/public/schemas.ts`, `src/protocol/public/inputs.ts` only when it is intentionally public.
- Navigation: `src/protocol/navigation/index.ts` when the transition becomes a protocol transition.
- Tests: `test/protocol/<primitive>.test.ts` plus architecture guard updates if import/export posture changes.

**New HTTP Transition:**
- Primary code: `src/http/routes/transition-route-registry.ts`, `src/http/routes/transition-invokers.ts`
- Response schema: `src/http/routes/transition-response-schemas.ts`
- Scope resolver: `src/http/routes/transition-scope-resolvers.ts` if direct body or record scope is insufficient.
- Handler changes: Prefer route invoker to kernel transition. Add handler only for special read/projection behavior.
- Tests: `test/http/http.test.ts`, `test/http/d1-http.test.ts`, and architecture import posture tests.

**New Redacted Evidence Projection:**
- Primary code: `src/protocol/evidence-projections/projections.ts`, `src/protocol/evidence-projections/schemas.ts`, `src/protocol/evidence-projections/assembly.ts`
- HTTP route: `src/http/routes/evidence-read-route-registry.ts`, `src/http/handlers/evidence-read.ts`
- SDK readback: `src/sdk/client.ts` or `src/sdk/surface-clients/evidence-client.ts`
- MCP resource: `src/mcp/resources.ts` only if model-facing readback is explicitly safe.
- Tests: `test/protocol/evidence-projections.test.ts`, `test/http/http.test.ts`, `test/mcp/mcp-resource-redaction.test.ts` when MCP-exposed.

**New Runtime Dispatch Family:**
- Primary code: `src/runtime/ingress/index.ts` for dispatch schema/orchestration.
- Family proposal helper: `src/runtime/<family>/action-proposal.ts` or adapter-owned `src/adapters/<family>/action-proposal.ts`.
- Guardrail: Return non-authority posture and refuse raw sibling, dynamic, late-bound, ambiguous, oversized, and unsupported shapes.
- Tests: `test/runtime/runtime-ingress.test.ts` or a family-specific file under `test/runtime/`.

**New MCP Tool Or Resource:**
- Primary code: `src/mcp/catalog.ts`, `src/mcp/output.ts`, `src/mcp/resources.ts`, and a tool-specific module under `src/mcp/`.
- Boundary update: `src/surfaces/boundary-manifest.ts` if route families, import roots, credential bans, or output fields change.
- Tests: `test/mcp/*`, `test/architecture/mcp-surface-posture.test.ts`, `test/architecture/surface-boundary-posture.test.ts`.
- Constraint: MCP may propose and display redacted evidence only. It must not gateway-check, mutate, sign, mint, export receipts, or hold credentials.

**New Reference Gateway Adapter:**
- Primary code: `src/adapters/<adapter>/gateway.ts`.
- Proposal code: `src/adapters/<adapter>/action-proposal.ts` or `src/runtime/<family>/action-proposal.ts`, depending on ownership.
- Bypass/custody probes: `src/adapters/<adapter>/bypass-probes.ts`.
- Experimental export: `src/experimental.ts`, not `src/index.ts`.
- Tests: `test/adapters/<adapter>.test.ts`, `test/integration/<adapter>.test.ts`, `test/conformance/*`, architecture import posture tests.
- Constraint: Mutate only after `verifiedGatewayCheckFromResult()` returns a `VerifiedGatewayCheck`.

**New x402 Capability:**
- Primary code: `src/adapters/x402-payment/`.
- Signer/payment-payload code: `src/adapters/x402-payment/wallet-gateway.ts` only.
- Install/config records: `src/adapters/x402-payment/install-proposal.ts`.
- Proposal records: `src/adapters/x402-payment/action-proposal.ts`.
- Tests: `test/adapters/x402-wallet-gateway.test.ts`, `test/integration/x402-d1-http.test.ts`, `test/conformance/x402-payment-conformance.test.ts`.
- Constraint: Keep claims to local/reference buyer-side `exact` unless a real provider/customer gateway owns the mutation credential and a ledger/enforcement surface is implemented.

**New Auth.md Credential-Custody Capability:**
- Primary code: `src/adapters/auth-md/`.
- Credential/evidence profiles: `src/adapters/auth-md/profiles.ts`.
- Proposal builder: `src/adapters/auth-md/action-proposal.ts`.
- Gateway path: `src/adapters/auth-md/gateway.ts`.
- Lifecycle/isolation: `src/adapters/auth-md/revocation.ts`.
- Tests: `test/adapters/auth-md-*.test.ts`, `test/integration/auth-md-*.test.ts`, `test/runtime/auth-md-candidate-compilation.test.ts`.
- Constraint: Auth.md discovery/registration/identity evidence is provenance only. Credential resolution evidence is post-gate only.

**New Store Implementation:**
- Primary code: `src/storage/<store>/`.
- Interface: Implement `ProtocolStore` from `src/protocol/store/port.ts`.
- Tests: `test/protocol/protocol-store-atomicity-contract.test.ts`, `test/protocol/fault-injecting-protocol-store.test.ts`, store-specific tests.
- Constraint: Storage may preserve atomic state and records. It must not interpret policy/gateway/recovery meaning.

**New SDK Client Surface:**
- Primary code: `src/sdk/surface-clients/` for role-scoped activation clients; `src/sdk/client.ts` only for full route parity.
- Boundary update: `src/surfaces/boundary-manifest.ts`.
- Package export: `package.json` only if a deliberate subpath is needed.
- Tests: `test/sdk/role-clients.test.ts`, `test/architecture/surface-boundary-posture.test.ts`, `test/architecture/root-exports.test.ts`.
- Constraint: Do not introduce fallback all-role token flows into agent-facing activation clients.

**New CLI Command:**
- Primary code: `src/cli/command-manifest.ts`, then a command module under `src/cli/`.
- Tests: `test/architecture/cli-command-posture.test.ts`, `test/cli/*`.
- Constraint: Commands must be evidence/setup/readiness/local-verify only unless the CLI authority model is redesigned.

**Utilities:**
- Protocol-wide deterministic helpers: `src/protocol/foundation/`.
- Lane-local helpers: keep inside the owning lane, for example `src/adapters/downstream-failure-evidence.ts`.
- Shared non-authority product surface helpers: `src/surfaces/`.
- Do not create generic `utils`, `helpers`, or `common` directories.

## Special Directories

**`.planning/`:**
- Purpose: Scratch planning and derived mapper output.
- Generated: Yes.
- Committed: Project-dependent, but not canonical repo truth.
- Rule: Do not read sibling mapper outputs while generating a scoped mapper file. Do not promote scratch labels into source, scripts, CI, README, package exports, or tracked canon without explicit validation.

**`dist/`:**
- Purpose: Generated declarations and Node ESM bundles used by package checks.
- Generated: Yes.
- Committed: Present in this checkout.
- Rule: Do not hand edit; regenerate with `npm run build`.

**`examples/*/output/`:**
- Purpose: Local generated evidence packets.
- Generated: Yes.
- Committed: Output ignored except `.gitignore` placeholders.
- Rule: Generated reports are local/reference evidence. Keep non-claims visible.

**`node_modules/`:**
- Purpose: Installed dependencies.
- Generated: Yes.
- Committed: No.
- Rule: Do not inspect or edit unless debugging dependency resolution.

**`.gstack/`:**
- Purpose: Local tool/security reports.
- Generated: Yes.
- Committed: Not active repo canon.
- Rule: Do not promote local tool state into protocol docs or source.

**`.github/`:**
- Purpose: CI workflow ownership.
- Generated: No.
- Committed: Yes.
- Rule: CI must remain bound to `npm run check:repo`.

**Empty Deferred Source Folders:**
- Purpose: `src/runtime/consequence-ingress/`, `src/sdk/activation/`, `test/install/`, and `docs/internal/tier-3-strategy/` exist as empty/deferred directories in the current tree.
- Generated: No.
- Committed: Depends on git tracking of non-empty contents; empty directories are not tracked by git.
- Rule: Do not treat empty directories as implemented surfaces.

## Tier 1 Foundation Guardrails

**Architecture Gate:**
- Command: `npm run quality:architecture`
- Covers: `test/architecture/import-posture.test.ts`, `test/architecture/naming-posture.test.ts`, `test/architecture/package-surface.test.ts`, `test/architecture/root-exports.test.ts`, `test/architecture/surface-boundary-posture.test.ts`, `test/architecture/cli-command-posture.test.ts`, `test/architecture/mcp-surface-posture.test.ts`, `test/conformance/protected-mutation-adapter-conformance.test.ts`.

**Claim Gate:**
- Command: `npm run quality:claims`
- Covers: `test/architecture/active-vocabulary.test.ts`, `test/architecture/claim-boundary.test.ts`.

**Storage/Protocol Gate:**
- Command: `npm run quality:storage`
- Covers: `test/http/d1-http.test.ts`, `test/protocol/kernel-*.test.ts`, `test/protocol/transition-matrix.test.ts`, `test/protocol/model-based-invariants.test.ts`, `test/protocol/action-attempt-lifecycle.test.ts`, `test/protocol/evidence-projections.test.ts`, `test/protocol/protocol-store-atomicity-contract.test.ts`, `test/protocol/authority-certificate.test.ts`.

**Full Gate:**
- Command: `npm run check:repo`
- Covers: TypeScript, lint, Prettier, Bun tests, package surface build/check, and whitespace diff.

## Local/Reference vs Hosted/Provider Claims

- Use `local`, `reference`, `fixture`, `source-owned`, `self-hosted local packet`, or `D1/HTTP reference path` for current proof surfaces in `examples/*`, `src/adapters/*`, `src/mcp/*`, `src/runtime/*`, and `src/storage/*`.
- Do not claim hosted operation from `src/http`, `src/worker.ts`, `wrangler.toml`, or `D1ProtocolStore`.
- Do not claim provider custody from `GatewayCredentialRef`, x402 wallet fixture, auth.md profile evidence, or MCP/SDK/CLI surfaces.
- Do not claim broad MCP/browser/shell/network interception from `src/mcp` or `src/runtime`.
- Do not claim cross-org trust from `AuthorityCertificate`; local offline pinned-key verification lives under `src/protocol/areas/authority-certificate/*`.
- Do not claim x402 spend-window enforcement from metadata fields in `src/adapters/x402-payment/install-proposal.ts`; session/day/review windows require a ledger.

---

*Structure analysis: 2026-05-24*
