# Technology Stack

**Analysis Date:** 2026-05-20

## Languages

**Primary:**
- TypeScript 6.0.3 - Protocol kernel, HTTP transport, Worker entrypoint, storage adapters, runtime proposal helpers, SDK client, reference adapters, and conformance checks under `src/`; compiler configuration is in `tsconfig.json` and `tsconfig.build.json`.

**Secondary:**
- JavaScript ESM - Repository tooling scripts such as `scripts/check-package-surface.mjs` and config files such as `eslint.config.js`.
- SQL - Cloudflare D1 schema migration in `migrations/0001_protocol_kernel.sql`.
- Markdown - Canonical internal repo guidance in `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, and `docs/internal/*.md`.
- YAML - GitHub Actions CI in `.github/workflows/check.yml`.
- TOML - Cloudflare Worker bindings and deployment configuration in `wrangler.toml`.

## Runtime

**Environment:**
- Bun 1.3.9 - Package manager, test runner, and local command runtime declared by `packageManager` in `package.json` and used by `.github/workflows/check.yml`.
- Cloudflare Workers - Worker runtime target configured by `wrangler.toml`; `src/worker.ts` exports `createApp().fetch` as the Worker fetch handler.
- Web Worker APIs - TypeScript libs include `WebWorker` in `tsconfig.json`; Worker bindings use `D1Database` and `KVNamespace` types from `@cloudflare/workers-types`.
- Node.js - Used only for local tooling scripts and test support imports such as `node:child_process` in `scripts/check-package-surface.mjs` and `node:fs/promises` in test fixtures. Node is not the production runtime target.

**Package Manager:**
- Bun 1.3.9 - Required by `package.json` and installed in CI through `oven-sh/setup-bun@v2` in `.github/workflows/check.yml`.
- Lockfile: present as `bun.lock`.
- npm is used only as a local packaging verifier through `npm run pack:check` and `npm pack --dry-run --json` inside `scripts/check-package-surface.mjs`.

## Frameworks

**Core:**
- Hono 4.12.19 - HTTP routing and Worker-compatible app surface in `src/http/app.ts`.
- Zod 4.4.3 - Strict protocol, HTTP, install, runtime, adapter, OpenAPI, and conformance schemas across `src/protocol`, `src/http`, `src/install`, `src/runtime`, `src/adapters`, and `src/conformance`.
- Cloudflare Workers/D1/KV - Worker binding target in `wrangler.toml`, durable D1 store in `src/storage/d1/index.ts`, and non-authoritative KV isolation cache in `src/storage/kv/index.ts`.

**Testing:**
- Bun test 1.3.9 - Test runner for `test/**/*.test.ts`, invoked by `npm run test`.
- Bun SQLite - Local D1 test harness in `test/support/d1-http-harness.ts` uses `bun:sqlite` to emulate D1 behavior for HTTP/D1 tests.

**Build/Dev:**
- TypeScript 6.0.3 - `npm run check:types` runs `tsc --noEmit --pretty false`; `npm run build` emits declarations only through `tsconfig.build.json`.
- ESLint 10.4.0 plus `typescript-eslint` 8.59.4 - Linting for `src/**/*.ts` and `test/**/*.ts` in `eslint.config.js`.
- Prettier 3.8.3 - Formatting configured in `.prettierrc.json`.
- Wrangler 4.92.0 - Local Worker dev and deployment binding runner through `npm run dev` and `wrangler.toml`.
- GitHub Actions - CI gate in `.github/workflows/check.yml` runs `bun install --frozen-lockfile` and `npm run check:repo`.

## Key Dependencies

**Critical:**
- `hono` 4.12.19 - Required for the Worker HTTP transition surface in `src/http/app.ts`.
- `zod` 4.4.3 - Required for protocol object validation, route request/response schemas, OpenAPI JSON schema projection, install proposal contracts, runtime proposal inputs, adapter observed parameter schemas, and conformance posture schemas.

**Infrastructure:**
- `@cloudflare/workers-types` 4.20260517.1 - Provides Worker, D1, and KV binding types used by `src/http/app-options.ts`, `src/storage/d1/index.ts`, and `src/storage/kv/index.ts`.
- `wrangler` 4.92.0 - Runs the Worker locally and binds `DB`/`CACHE` from `wrangler.toml`.
- `@types/bun` 1.3.14 - Provides Bun test and Bun runtime types for `test/**/*.ts`.
- `eslint` 10.4.0 and `typescript-eslint` 8.59.4 - Enforce type-imports, unused-variable, and console posture in `eslint.config.js`.
- `prettier` 3.8.3 - Enforces formatting across the repo through `npm run format:check`.

## Configuration

**Environment:**
- Worker bindings are declared in `wrangler.toml`: `DB` is the Cloudflare D1 binding and `CACHE` is the Cloudflare KV binding.
- Role-scoped local bearer token binding names are defined in `src/http/admission/caller-auth.ts`: `HANDSHAKE_CONTROL_PLANE_TOKEN`, `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`, `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`, and `HANDSHAKE_REVIEW_CUSTODY_TOKEN`.
- `AppOptions` in `src/http/app-options.ts` supports injected `store`, `allowEphemeralStore`, `callerAuthTokens`, `authMode`, and `hostedCallerVerifier`.
- No `.env*` files were detected by the scan. Do not add secrets to repo-facing docs; configure tokens through Worker bindings or explicit local test options.

**Build:**
- `tsconfig.json` targets `ES2022`, uses `moduleResolution: "Bundler"`, includes `src`, `test`, and `worker-configuration.d.ts`, and enables `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`.
- `tsconfig.build.json` emits declaration files only to `dist` with `rootDir: "src"`.
- `eslint.config.js` ignores `dist/**`, `coverage/**`, `node_modules/**`, and `docs/internal/archive/**`.
- `.prettierrc.json` sets `printWidth: 120`, semicolons, double quotes, and trailing commas.
- `.github/workflows/check.yml` is the CI command source and must run `npm run check:repo`.
- `scripts/check-package-surface.mjs` validates package dry-run output and forbids `.planning/`, `.agents/`, `skills-lock.json`, tests, and deleted doc trees from the package artifact.

## Package Boundaries

**Package Identity:**
- `package.json` declares `handshake-protocol-kernel` version `0.2.4`.
- `private: true` is present in `package.json`; this checkout is a private source package boundary, not a published package.
- `type: "module"` is present in `package.json`; source and tooling use ESM imports.

**Exported Surfaces:**
- Root export `.` maps to `src/index.ts` and `dist/index.d.ts`. It exposes HTTP app creation, request headers, transition error envelope types, caller custody helpers, hosted caller verifier types, HTTP/protocol navigation metadata, protocol public inputs/schemas, gateway verification helpers, and the SDK client.
- `./conformance` maps to `src/conformance/index.ts` and `dist/conformance/index.d.ts`. It exposes protected mutation adapter conformance checks and x402 install conformance posture checks.
- `./experimental` maps to `src/experimental.ts` and `dist/experimental.d.ts`. It exposes explicit experimental reference gateway runners and probe executors.
- `./package.json` is exported for package metadata.

**Package Files:**
- The package file list in `package.json` includes `src`, `dist`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, and compact internal canon under `docs/internal/`.
- The package surface check in `scripts/check-package-surface.mjs` requires `src/index.ts`, `src/conformance/index.ts`, `src/experimental.ts`, and generated declaration files in `dist/`.

## Command Contract

**Primary Commands:**
```bash
bun install --frozen-lockfile  # Install dependencies from bun.lock
npm run check:repo             # Full local and CI gate
npm run check:types            # CI-stable TypeScript check
npm run typecheck              # Interactive TypeScript alias
npm run lint                   # ESLint over src and test
npm run format:check           # Prettier check
npm run test                   # Bun test suite
npm run build                  # Declaration-only build
npm run pack:check             # Build plus package dry-run surface check
npm run dev                    # Wrangler Worker dev
```

**Focused Quality Commands:**
```bash
npm run quality:architecture   # Import, naming, package, root export, and conformance posture checks
npm run quality:claims         # Active vocabulary guard
npm run quality:storage        # D1, kernel, transition, invariant, evidence, and store atomicity checks
```

## Source Package Boundaries

**Protocol Kernel:**
- `src/protocol/` owns protocol meaning, public schemas/inputs, foundation helpers, events, request context, navigation, store port, and primitive areas.
- `src/protocol/kernel.ts` exposes `HandshakeKernel` transition methods over the protocol areas.
- `src/protocol/store/port.ts` defines the durable store interface and commit result contracts.

**HTTP Transport:**
- `src/http/app.ts` builds the Hono app, transition routes, evidence read routes, health route, OpenAPI route, and internal raw-record route.
- `src/http/routes/transition-route-registry.ts` maps transition routes to caller custody roles, request schemas, response schemas, and scope resolvers.
- `src/http/routes/evidence-read-route-registry.ts` maps redacted evidence reads to control-plane custody.
- `src/http/admission/*` owns local bearer admission and hosted caller verifier seams.
- `src/http/store/resolution.ts` resolves `D1ProtocolStore` from `c.env.DB` or an explicitly injected ephemeral store.

**Storage:**
- `src/storage/d1/index.ts` implements `ProtocolStore` over Cloudflare D1.
- `src/storage/d1/statements.ts` owns SQL statement assembly for atomic protocol commits and gateway-check commits.
- `src/storage/memory/index.ts` implements an in-memory store for tests and local fixtures.
- `src/storage/kv/index.ts` implements `NoopIsolationCache` and `KvIsolationCache`; KV is cache posture only and cannot create authority.
- `migrations/0001_protocol_kernel.sql` defines D1 tables for protocol records, greenlight consumptions, greenlight issuances, idempotency ledger state, recovery terminal claims, protected path posture, isolation state, protected surface operation claims, receipt lookup, and stream events.

**Runtime Proposal Helpers:**
- `src/runtime/package-install/action-proposal.ts` converts explicit package install tool calls into intent compilation inputs and action contract proposals.
- `src/runtime/repo-write/action-proposal.ts` converts explicit repo write attempts into intent compilation inputs and action contract proposals.
- `src/runtime/preview-deploy/action-proposal.ts` converts explicit preview deploy attempts into intent compilation inputs and action contract proposals.
- `src/runtime/codemode-multi-action/generated-program-runner.ts` parses generated multi-action programs and preflights all sibling actions before proposing contracts.
- `src/runtime/codemode-multi-action/generated-graph-evidence.ts` builds runtime execution and generated execution graph evidence for generated-program flows.

**Install Compiler:**
- `src/install/install-proposal/index.ts` defines generic install proposal contracts and compiled kernel record bundles.
- `src/install/protected-action-adapter-pack/index.ts` defines adapter-pack metadata required for protected action installation.

**Reference Adapters:**
- `src/adapters/package-install/gateway.ts` runs package install mutation surfaces only after `verifiedGatewayCheckFromResult`.
- `src/adapters/repo-write/gateway.ts` runs repo write mutation surfaces only after `verifiedGatewayCheckFromResult` and observed content digest/byte length binding.
- `src/adapters/preview-deploy/gateway.ts` runs preview deploy mutation surfaces only after `verifiedGatewayCheckFromResult`.
- `src/adapters/x402-payment/*` owns local x402 install proposal, action proposal, wallet gateway, hostile bypass probes, and conformance posture checks.
- `src/adapters/protected-path-probes/*` owns local bypass probe executor fixtures.

**Conformance:**
- `src/conformance/index.ts` exposes protected mutation adapter probes and x402 install conformance checks through the `./conformance` package subpath.

**SDK:**
- `src/sdk/client.ts` is a typed `fetch` client for public HTTP transition routes and redacted evidence reads. It routes role-scoped bearer tokens and parses structured transition error envelopes.

## Platform Requirements

**Development:**
- Bun `1.3.9` is required by `package.json`, `README.md`, and `.github/workflows/check.yml`.
- Local checks require TypeScript, ESLint, Prettier, Bun tests, and `git diff --check` through `npm run check:repo`.
- Worker development requires Wrangler and local D1/KV bindings from `wrangler.toml`; `npm run dev` runs `wrangler dev`.

**Production:**
- Configured deployment target is Cloudflare Workers through `wrangler.toml`.
- Durable protocol state requires a D1 binding named `DB`; if neither `DB` nor an injected store exists, `src/http/store/resolution.ts` fails protocol state endpoints with `durable_store_unavailable`.
- KV binding `CACHE` is configured in `wrangler.toml`, but current authority-bearing transitions use D1 as durable reconstruction truth.
- Hosted operation, provider-side enforcement, live payment custody, public runtime/MCP ingestion, external package-material attestation, and portable cross-org verifier trust are not established by this stack.

---

*Stack analysis: 2026-05-20*
