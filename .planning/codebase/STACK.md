# Technology Stack

**Analysis Date:** 2026-05-26

## Source Stamp

- Current source stamp: `git rev-parse --short HEAD` returned `4946237`.
- Current checkout is dirty: `git status --short` reports source, test, docs, package, and `.planning/` changes. This map reflects the current working tree, not only the committed tree.
- Source truth for stack claims is `package.json`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `server.json`, `wrangler.toml`, `.github/workflows/check.yml`, `src/**`, `test/**`, `scripts/**`, and `docs/internal/**`.
- `.planning/**` is scratch coordination per `.planning/STATE.md`; do not treat older `.planning/codebase/*.md` as canonical when source files disagree.

## Languages

**Primary:**
- TypeScript 6.0.3 - Strict ESM source, tests, examples, and declaration output. Core source lives under `src/**/*.ts`, tests under `test/**/*.test.ts`, demos under `examples/**/run.ts`, and declaration emit is configured by `tsconfig.build.json`.

**Secondary:**
- JavaScript - Node-side release, package, build, and posture scripts live in `scripts/*.mjs` and `scripts/*.js`; executable package stubs live in `bin/handshake` and `bin/handshake-mcp`.
- SQL - Cloudflare D1/SQLite-compatible durable storage schema lives in `migrations/0001_protocol_kernel.sql`.
- Markdown - Repo-facing source docs live in `README.md`, `QUALITY.md`, `STRUCTURE.md`, `AGENTS.md`, and `docs/internal/*.md`.
- JSON/TOML/YAML - Package and runtime metadata live in `package.json`, `server.json`, `tsconfig.json`, `tsconfig.build.json`, `.prettierrc.json`, `wrangler.toml`, and `.github/workflows/check.yml`.

## Runtime

**Environment:**
- Node.js `>=20` - Declared in `package.json#engines`; package binaries `bin/handshake` and `bin/handshake-mcp` are Node executable stubs importing built ESM entrypoints from `dist/bin/*.mjs`.
- Bun 1.3.9 - Declared in `package.json#packageManager`, present in `bun.lock`, used by `package.json#scripts.test`, `scripts/build-package-bundles.mjs`, and CI in `.github/workflows/check.yml`.
- Cloudflare Workers - HTTP runtime target configured by `wrangler.toml`; Worker entrypoint is `src/worker.ts`; bindings are typed in `src/http/app-options.ts`.
- ES modules - `package.json` sets `"type": "module"` and package exports point to `dist/**/*.mjs`.

**Package Manager:**
- Bun 1.3.9 - Source package manager and lockfile owner. CI runs `bun install --frozen-lockfile` in `.github/workflows/check.yml`.
- npm CLI - Used as script runner in `package.json#scripts` and by package/release scripts such as `scripts/check-release-admin.js`, `scripts/check-package-surface.mjs`, and `scripts/check-npm-maintainer-posture.mjs`.
- Lockfile: present as `bun.lock`.
- Not detected at root: `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`.

## Frameworks

**Core:**
- Hono `^4.12.19` - HTTP router/app framework in `src/http/app.ts`, exported through `src/index.ts`, and served by `src/worker.ts`.
- Zod `^4.4.3` - Runtime schema layer across protocol, HTTP, adapters, CLI, MCP, SDK, hosted admission, and product-surface code. Representative paths: `src/protocol/foundation/schema-core.ts`, `src/protocol/public/schemas.ts`, `src/http/routes/transition-response-schemas.ts`, `src/mcp/x402-proposal.ts`, and `src/hosted-admission/hosted-admission-config.ts`.
- Cloudflare Workers APIs - D1 and KV binding types come from `@cloudflare/workers-types`; source uses them in `src/http/app-options.ts`, `src/http/store/resolution.ts`, `src/storage/d1/index.ts`, and `src/storage/kv/index.ts`.
- x402 SDK `2.12.0` - Official buyer-side exact payment evidence and signing helpers use `@x402/core` and `@x402/evm` in `src/adapters/x402-payment/upstream-evidence.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, and `src/adapters/x402-payment/sandbox-http.ts`.
- Model Context Protocol SDK `^2.0.0-alpha.2` - Local stdio proposal/evidence server uses `@modelcontextprotocol/server` in `src/mcp/stdio/server.ts`; process and published-entrypoint checks use `@modelcontextprotocol/client` in `src/mcp/stdio/process-proof.ts` and `scripts/check-published-entrypoints.mjs`.

**Testing:**
- Bun test - `package.json#scripts.test` runs `bun test`; test files under `test/**` import `describe`, `it`, and `expect` from `bun:test`.
- Bun SQLite - D1 HTTP harness tests use `bun:sqlite` in `test/support/d1-http-harness.ts`.
- Architecture/product/integration gates - `package.json` defines `quality:architecture`, `quality:claims`, and `quality:storage`, backed by `test/architecture/**`, `test/product/**`, `test/integration/**`, `test/protocol/**`, and `test/storage/**`.

**Build/Dev:**
- TypeScript compiler `^6.0.3` - `npm run build:types` runs `tsc -p tsconfig.build.json`; `npm run check:types` runs `tsc --noEmit --pretty false`.
- Bun bundler - `scripts/build-package-bundles.mjs` runs `bun build --target=node --format=esm` for package subpaths and CLI/MCP binaries.
- Wrangler `^4.92.0` - `package.json#scripts.dev` runs `wrangler dev`; `wrangler.toml` points to `src/worker.ts` and declares D1/KV bindings.
- ESLint `^10.4.0` plus `typescript-eslint ^8.59.4` - Configured by `eslint.config.js` for `src/**/*.ts` and `test/**/*.ts`.
- Prettier `^3.8.3` - Configured by `.prettierrc.json`; `package.json#scripts.format:check` checks the repo.
- GitHub Actions - `.github/workflows/check.yml` runs Bun install and `npm run check:repo` on `push` and `pull_request`.

## Key Dependencies

**Critical:**
- `zod` `^4.4.3` - Defines source-owned protocol, adapter, HTTP, MCP, CLI, SDK, and hosted admission schemas in `src/protocol/**`, `src/adapters/**`, `src/http/**`, `src/mcp/**`, `src/cli/**`, `src/sdk/**`, and `src/hosted-admission/**`.
- `hono` `^4.12.19` - Owns HTTP routing, middleware, errors, request parsing, and response handling in `src/http/app.ts` and `src/http/handlers/**`.
- `@x402/core` `2.12.0` - Validates x402 `PaymentRequired` / `PaymentPayload` shapes and creates official x402 clients in `src/adapters/x402-payment/upstream-evidence.ts` and `src/adapters/x402-payment/wallet-gateway.ts`.
- `@x402/evm` `2.12.0` - Provides `ExactEvmScheme` and `ClientEvmSigner` for gateway-held exact payment signing in `src/adapters/x402-payment/wallet-gateway.ts`.
- `@modelcontextprotocol/server` `^2.0.0-alpha.2` - Implements local MCP stdio resources and the `handshake.actions.x402_payment.propose` tool in `src/mcp/stdio/server.ts`.
- `@modelcontextprotocol/client` `^2.0.0-alpha.2` - Used for MCP stdio process proof and package entrypoint smoke checks in `src/mcp/stdio/process-proof.ts` and `scripts/check-published-entrypoints.mjs`.

**Infrastructure:**
- `@cloudflare/workers-types` `^4.20260517.1` - Provides Cloudflare Worker, D1, and KV types used by `src/http/app-options.ts`, `src/storage/d1/index.ts`, and `src/storage/kv/index.ts`.
- `@types/bun` `^1.3.14` - Supports Bun globals/APIs used by tests and examples such as `examples/service-workflow-admission/run.ts`, `examples/x402-protected-spend/run.ts`, and `test/support/d1-http-harness.ts`.
- `@x402/fetch` `2.12.0` - Dev dependency used for upstream x402 fixture parity in `test/conformance/x402-upstream-exact-fixtures.test.ts`.
- `@cfworker/json-schema` `^4.1.1` - Declared in `package.json`; no direct import was detected under `src/`, `test/`, `examples/`, or `scripts/` during this remap.
- `typescript`, `eslint`, `typescript-eslint`, `prettier`, and `wrangler` - Source quality, type checking, formatting, package bundling, and Cloudflare Worker tooling in `package.json`, `tsconfig.json`, `eslint.config.js`, `.prettierrc.json`, and `wrangler.toml`.

## Configuration

**Environment:**
- HTTP role custody uses explicit bearer token bindings named `HANDSHAKE_CONTROL_PLANE_TOKEN`, `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`, `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`, and `HANDSHAKE_REVIEW_CUSTODY_TOKEN` in `src/http/admission/caller-auth.ts`.
- Cloudflare durable protocol storage uses D1 binding `DB`, declared in `wrangler.toml` and consumed by `src/http/store/resolution.ts` and `src/storage/d1/index.ts`.
- Cloudflare optional cache uses KV binding `CACHE`, declared in `wrangler.toml` and consumed by `src/storage/kv/index.ts` and `src/http/handlers/hosted-readiness.ts`.
- Hosted admission configuration is injected via `AppOptions.hostedAdmissionConfig` in `src/http/app-options.ts` and validated by `src/hosted-admission/hosted-admission-config.ts`; production provider secret names are declared by config, not hardcoded.
- Hosted identity adapters implement `HostedVerifierAdapter` in `src/hosted-admission/hosted-verifier-adapter.ts`; no Clerk, OAuth/OIDC, or Cloudflare Access SDK dependency is bundled in `package.json`.
- CLI local state uses `.handshake/project.json` and falls back to `XDG_STATE_HOME` or `~/.local/state/handshake` in `src/cli/local-project/index.ts`.
- No root `.env*` file was detected. `.gitignore` excludes `.dev.vars`, `.env`, `.env.local`, and `.env.*.local`; if present, these files must be listed only and never read.

**Build:**
- Package identity, subpath exports, binaries, files allowlist, scripts, dependency versions, and MCP package identity live in `package.json`.
- Source/test TypeScript options live in `tsconfig.json`; declaration-only build options live in `tsconfig.build.json`.
- Bundle entrypoint mapping lives in `scripts/build-package-bundles.mjs`.
- Cloudflare Worker development/deployment config lives in `wrangler.toml`; Worker entry delegates to the Hono app in `src/worker.ts`.
- MCP Registry/package metadata lives in `server.json`.
- CI config lives in `.github/workflows/check.yml`.

## Platform Requirements

**Development:**
- Install dependencies with Bun using `bun.lock`; CI uses `bun install --frozen-lockfile` in `.github/workflows/check.yml`.
- Run all tests with `npm run test` or `bun test` from `package.json`.
- Run the full repo gate with `npm run check:repo` from `package.json`; it builds, typechecks, lints, format-checks, runs tests, verifies package surface, checks release/package posture, and runs `git diff --check`.
- Run the HTTP Worker locally with `npm run dev` (`wrangler dev`) when exercising `src/worker.ts` and `src/http/app.ts`.
- Use `npm run demo:x402-tool-profiles`, `npm run demo:aps`, `npm run demo:self-hosted`, `npm run demo:adapter-sdk`, and `npm run demo:service-workflow-admission` from `package.json` for source-owned demo outputs under `examples/**/output/`.

**Production:**
- Package version in the current dirty checkout is `handshake-protocol-kernel@0.2.8` in `package.json` and `server.json`.
- `README.md` states public npm `0.2.7` is historical provenance only; current local `0.2.8` still needs publish/readback proof before claiming current-surface npm publication.
- Published package files are limited by `package.json#files` to `bin`, `dist`, `server.json`, `README.md`, `CHANGELOG.md`, `LICENSE`, and `NOTICE`; `scripts/check-package-surface.mjs` and `scripts/check-published-entrypoints.mjs` enforce this boundary.
- Local MCP distribution is stdio-based through `bin/handshake-mcp`, `dist/bin/handshake-mcp.mjs`, `src/mcp/stdio/server.ts`, and `server.json`; MCP is proposal/evidence only.
- HTTP deployment target is Cloudflare Workers with D1 as durable protocol record storage and KV as non-authoritative cache, configured by `wrangler.toml`, `src/http/store/resolution.ts`, `src/storage/d1/index.ts`, and `src/storage/kv/index.ts`.
- Release administration is script-gated and non-authoritative: `scripts/check-release-admin.js`, `scripts/check-release-proof.mjs`, `scripts/check-npm-maintainer-posture.mjs`, and `scripts/check-distribution-provenance.mjs` verify package/artifact/readback posture without creating policy decisions, greenlights, gateway checks, or protected mutations.

---

*Stack analysis: 2026-05-26*
