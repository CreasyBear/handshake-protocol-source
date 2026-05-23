# Technology Stack

**Analysis Date:** 2026-05-23

## Source Boundary

**Canonical repo truth:**
- `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/decisions.md`, and `docs/internal/protocol-notes.md` are the governing stack and claim boundary inputs for this map.
- `.planning/` is scratch. Use `.planning/codebase/STACK.md` as mapper output only; do not promote `.planning/` paths, tier labels, or historical plan names into package exports, source paths, scripts, CI, or canonical docs.
- `package.json`, `.github/workflows/check.yml`, `wrangler.toml`, `migrations/0001_protocol_kernel.sql`, and `scripts/check-package-surface.mjs` are operational enforcement surfaces.

**Committed source state:**
- The committed package is a private TypeScript protocol kernel with explicit root, runtime, conformance, role-SDK, and experimental subpath exports in `package.json`.
- The committed telemetry hardening is source-backed by redacted evidence projections in `src/protocol/evidence-projections/schemas.ts`, projection assembly in `src/protocol/evidence-projections/projections.ts`, transaction-envelope assembly in `src/protocol/evidence-projections/assembly.ts`, CLI non-authority envelopes in `src/cli/output.ts`, support-bundle redaction in `src/cli/support-bundle.ts`, MCP non-authority outcomes in `src/mcp/output.ts`, and surface boundary flags in `src/surfaces/boundary-manifest.ts`.
- Tests proving the telemetry boundary include `test/protocol/evidence-projections.test.ts`, `test/http/http.test.ts`, `test/cli/cli-support-bundle.test.ts`, `test/mcp/mcp-resource-redaction.test.ts`, and `test/product/agent-proof-slice.test.ts`.

**Visible dirty working-tree state:**
- `git status --short` shows user-owned dirty files: `STRUCTURE.md`, `docs/internal/protocol-notes.md`, `src/adapters/LANE.md`, `src/experimental.ts`, `test/architecture/root-exports.test.ts`, untracked `src/adapters/auth-md/`, and untracked `test/adapters/auth-md-adapter.test.ts`.
- The dirty auth.md adapter is not committed source. Its visible state adds untracked `src/adapters/auth-md/index.ts`, `src/adapters/auth-md/profiles.ts`, `src/adapters/auth-md/action-proposal.ts`, and `test/adapters/auth-md-adapter.test.ts`, plus tracked edits that export it through `src/experimental.ts` and document it in `src/adapters/LANE.md`, `STRUCTURE.md`, `docs/internal/protocol-notes.md`, and `test/architecture/root-exports.test.ts`.
- The dirty auth.md adapter treats OAuth Protected Resource Metadata `agent_auth` and auth.md prose as provenance, creates redacted `GatewayCredentialRef` intake inputs, proposes `auth_md_protected_api_call.exact` contracts, and refuses raw authorization headers, dynamic endpoints, read-only methods, wrong origins, and unsafe custody in `src/adapters/auth-md/action-proposal.ts`.
- Keep the committed stack and visible auth.md adapter state separate until those source and test files are intentionally committed.

## Languages

**Primary:**
- TypeScript 6.0.3 - protocol kernel, HTTP app, SDK, runtime ingress, adapters, CLI, MCP reference surfaces, storage, tests, and demos under `src/`, `test/`, and `examples/`.

**Secondary:**
- JavaScript ESM - package surface validation in `scripts/check-package-surface.mjs`; the package is `"type": "module"` in `package.json`.
- SQL - Cloudflare D1 schema in `migrations/0001_protocol_kernel.sql`.
- Markdown - canonical docs in repo root and `docs/internal/`; generated demo reports in `examples/x402-protected-spend/output/` and `examples/mcp-reference-transcript/output/`.

## Runtime

**Environment:**
- Bun 1.3.9 - primary package manager, script runner, and test runner; declared by `package.json` and installed in `.github/workflows/check.yml`.
- TypeScript strict mode - `tsconfig.json` uses ES2022 target, ESNext modules, Bundler resolution, WebWorker and Bun types, `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`.
- Cloudflare Workers - reference HTTP runtime through `src/worker.ts`, `src/http/app.ts`, and `wrangler.toml`.
- Node/npm - `npm run` is the command wrapper, and `scripts/check-package-surface.mjs` uses `node` plus `npm pack --dry-run --json`.

**Package Manager:**
- Bun 1.3.9.
- Lockfile: `bun.lock` present.

## Frameworks

**Core:**
- Hono ^4.12.19 - route mounting, health, OpenAPI, transition endpoints, evidence reads, and Worker app wiring in `src/http/app.ts`.
- Zod ^4.4.3 - schema validation across protocol areas, HTTP errors/routes, CLI outputs, MCP resources, SDK boundaries, runtime ingress, and adapters.
- Cloudflare D1/KV - durable protocol store and isolation cache bindings via `wrangler.toml`, `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, and `src/storage/kv/index.ts`.
- x402 SDK 2.12.0 - official buyer-side exact path through `@x402/core` and `@x402/evm` in `src/adapters/x402-payment/upstream-evidence.ts` and `src/adapters/x402-payment/wallet-gateway.ts`.

**Testing:**
- Bun test - invoked by `npm run test`; tests live under `test/`.
- TypeScript compiler - `npm run check:types` and `npm run build`.
- ESLint 10.4.0 with `typescript-eslint` - configured by `eslint.config.js`.
- Prettier 3.8.3 - configured by `.prettierrc.json`.

**Build/Dev:**
- `tsc -p tsconfig.build.json` - declaration-only build to `dist/`.
- Wrangler ^4.92.0 - local Worker development through `npm run dev`.
- npm pack dry-run - `npm run pack:check` verifies source package contents through `scripts/check-package-surface.mjs`.

## Key Dependencies

**Critical:**
- `zod` ^4.4.3 - protocol and surface schemas; examples include `src/protocol/public/schemas.ts`, `src/protocol/evidence-projections/schemas.ts`, `src/http/errors/transition-error-envelope.ts`, and `src/mcp/x402-proposal.ts`.
- `hono` ^4.12.19 - reference HTTP API in `src/http/app.ts`.
- `@x402/core` 2.12.0 - official x402 payment-required parsing and payment-payload creation in `src/adapters/x402-payment/upstream-evidence.ts` and `src/adapters/x402-payment/wallet-gateway.ts`.
- `@x402/evm` 2.12.0 - exact EVM signing surface in `src/adapters/x402-payment/wallet-gateway.ts`.

**Infrastructure:**
- `@cloudflare/workers-types` ^4.20260517.1 - D1, KV, and Worker typings for `src/http/`, `src/storage/`, and `src/worker.ts`.
- `wrangler` ^4.92.0 - local Worker runtime and Cloudflare binding development.
- `@x402/fetch` 2.12.0 - dev/test coverage for official x402 fixtures in `test/conformance/x402-upstream-exact-fixtures.test.ts`.
- `@types/bun` ^1.3.14 - Bun test and script typings.
- `eslint`, `typescript-eslint`, `prettier`, and `typescript` - local and CI quality gate.

## Package Surface

**Committed exports in `package.json`:**
- `.` -> `src/index.ts` and `dist/index.d.ts`; curated protocol, HTTP app, schema/input, SDK, and verification surface.
- `./runtime` -> `src/runtime/index.ts` and `dist/runtime/index.d.ts`; runtime ingress proposal helpers only.
- `./sdk/role-clients` -> `src/sdk/surface-clients/index.ts` and `dist/sdk/surface-clients/index.d.ts`; runtime and evidence role clients.
- `./conformance` -> `src/conformance/index.ts` and `dist/conformance/index.d.ts`; reference conformance helpers.
- `./experimental` -> `src/experimental.ts` and `dist/experimental.d.ts`; committed reference gateway fixture exports. The dirty working tree additionally adds auth.md exports here.

**Package guard:**
- `scripts/check-package-surface.mjs` requires source, generated declarations, README, quality/structure docs, and compact `docs/internal/*` canon; it rejects `.planning/`, `.agents/`, tests, deleted docs trees, `.DS_Store`, and `skills-lock.json`.

## Configuration

**Environment:**
- Role custody tokens are optional app options or Worker env bindings: `HANDSHAKE_CONTROL_PLANE_TOKEN`, `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`, `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`, and `HANDSHAKE_REVIEW_CUSTODY_TOKEN` in `src/http/admission/caller-auth.ts`.
- HTTP transition requests require `X-Handshake-Protocol-Version` and `X-Handshake-Request-Identity`; `X-Handshake-Originating-Identity` is optional and constrained to a sha256 digest or `ref:` by `src/http/admission/request-context.ts`.
- Cloudflare bindings are `DB` and `CACHE` in `wrangler.toml`.
- Repository-root `.env*` scan found no `.env` files. If added later, env files must be noted by existence only and not read.

**Build:**
- `package.json` - dependencies, package manager, scripts, exports, and package files.
- `tsconfig.json` - strict source/test typecheck.
- `tsconfig.build.json` - declaration-only package build.
- `eslint.config.js` - TypeScript lint rules, type-only imports, unused-var policy, and `no-console` restrictions.
- `.prettierrc.json` - print width 120, semicolons, double quotes, trailing commas.
- `wrangler.toml` - Worker name, entrypoint, compatibility date, D1 binding, KV binding.
- `.github/workflows/check.yml` - GitHub Actions gate.
- `migrations/0001_protocol_kernel.sql` - D1 schema.

## Commands

**Setup:**
```bash
bun install --frozen-lockfile
```

**Primary gate:**
```bash
npm run check:repo
```

`npm run check:repo` runs `npm run check:types`, `npm run lint`, `npm run format:check`, `npm run test`, `npm run pack:check`, and `git diff --check`.

**Focused gates:**
```bash
npm run quality:architecture
npm run quality:storage
npm run quality:claims
```

**Demos:**
```bash
npm run demo:aps
npm run demo:mcp-transcript
```

`npm run demo:aps` refreshes `examples/x402-protected-spend/output/latest.json` and `examples/x402-protected-spend/output/latest.md`. `npm run demo:mcp-transcript` refreshes `examples/mcp-reference-transcript/output/latest.json` and `examples/mcp-reference-transcript/output/latest.md`.

## Platform Requirements

**Development:**
- Bun 1.3.9 and `bun.lock`.
- npm CLI for `npm run` and pack dry-run checks.
- Node runtime for `scripts/check-package-surface.mjs`.
- Optional Wrangler for local Worker development.

**Production:**
- No hosted production deployment is claimed.
- Reference Worker deployment requires Cloudflare Workers compatibility date `2026-05-17`, D1 `DB`, KV `CACHE`, and external role custody tokens.
- D1 is the reference durable reconstruction store; `src/storage/memory/index.ts` is a test/demo store and `src/storage/kv/index.ts` is cache-only isolation posture.

## Pre-Hosted Limitations

- Current Tier 2-facing surfaces are local/reference and pre-hosted: role SDKs in `src/sdk/surface-clients/`, CLI envelopes in `src/cli/`, MCP reference transcript in `src/mcp/`, and the x402 protected-spend demo in `examples/x402-protected-spend/`.
- Runtime ingress in `src/runtime/ingress/index.ts` is observer/compiler evidence. It does not issue policy decisions, greenlights, gateway checks, receipts, certificates, or mutations.
- x402 support is one official buyer-side V2 `exact` path. `src/adapters/x402-payment/conformance.ts` marks `upto`, batch settlement, lifecycle hooks, MCP auto-pay, signed offers, signed receipts, seller middleware, and facilitator operation unsupported.
- Spend windows in `src/adapters/x402-payment/install-proposal.ts` are metadata until a ledger exists.
- `AuthorityCertificate` verification is local pinned/offline evidence, not hosted verifier operation, live JWKS/revocation, cross-org trust, provider custody, marketplace certification, or clearing-house readiness.

---

*Stack analysis: 2026-05-23*
