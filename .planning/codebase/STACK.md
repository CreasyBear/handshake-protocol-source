# Technology Stack

**Analysis Date:** 2026-05-22

## Languages

**Primary:**
- TypeScript 6.0.3 - all protocol, HTTP, storage, SDK, CLI, MCP, runtime, adapter, and test code under `src/` and `test/`; strict compiler settings live in `tsconfig.json`.

**Secondary:**
- SQL - Cloudflare D1 schema in `migrations/0001_protocol_kernel.sql`.
- JavaScript ESM - package surface verification script in `scripts/check-package-surface.mjs`.
- Markdown - canonical internal documentation in `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, and `docs/internal/*`.

## Runtime

**Environment:**
- Bun 1.3.9 - declared by `package.json` `packageManager`; tests run with `bun test`, dependency installation uses `bun install --frozen-lockfile`, and CI installs Bun through `.github/workflows/check.yml`.
- Cloudflare Workers - Worker entrypoint is `src/worker.ts`; `wrangler.toml` sets `main = "src/worker.ts"` and `compatibility_date = "2026-05-17"`.
- Web standard runtime APIs - HTTP code uses `fetch`, `Request`, `Response`, `Headers`, `crypto.randomUUID`, D1, and KV types through `tsconfig.json` libraries and `@cloudflare/workers-types`.

**Package Manager:**
- Bun 1.3.9 - `package.json` declares `packageManager: "bun@1.3.9"`.
- Lockfile: present at `bun.lock`.
- Node version pin: Not detected; no `.nvmrc`, `.node-version`, or `.tool-versions` file is present.

## Frameworks

**Core:**
- Hono 4.12.19 - HTTP/Worker router in `src/http/app.ts`; routes are generated from `src/http/routes/transition-route-registry.ts` and `src/http/routes/evidence-read-route-registry.ts`.
- Zod 4.4.3 - protocol, HTTP, CLI, MCP, runtime, adapter, and storage boundary schemas across `src/protocol/**`, `src/http/**`, `src/cli/**`, `src/mcp/**`, `src/runtime/**`, and `src/adapters/**`.
- TypeScript ESM package boundary - `package.json` uses `"type": "module"` and source-backed exports for `.`, `./conformance`, `./runtime`, and `./experimental`.

**Testing:**
- Bun test - `package.json` script `test` runs `bun test`; tests are organized under `test/architecture`, `test/protocol`, `test/http`, `test/runtime`, `test/mcp`, `test/adapters`, `test/conformance`, `test/integration`, `test/product`, `test/sdk`, and `test/cli`.
- `bun:sqlite` - local D1 HTTP harness support in `test/support/d1-http-harness.ts`.

**Build/Dev:**
- TypeScript compiler - `npm run typecheck` and `npm run check:types` use `tsc --noEmit`; `npm run build` uses `tsc -p tsconfig.build.json` to emit declarations into `dist/`.
- Wrangler 4.92.0 - `npm run dev` runs `wrangler dev`; bindings are declared in `wrangler.toml`.
- ESLint 10.4.0 with `typescript-eslint` 8.59.4 - `eslint.config.js` enforces type import consistency, unused variable policy, and console restrictions for `src/**/*.ts` and `test/**/*.ts`.
- Prettier 3.8.3 - `.prettierrc.json` sets `printWidth: 120`, semicolons, double quotes, and trailing commas.
- npm package dry run - `scripts/check-package-surface.mjs` runs `npm pack --dry-run --json` and rejects `.planning/`, `.agents/`, tests, deleted documentation trees, and other non-package files.

## Key Dependencies

**Critical:**
- `zod` 4.4.3 - strict schema validation for protocol records, transition inputs, HTTP responses, OpenAPI JSON schema generation, MCP structured content, CLI output, and adapter boundaries.
- `hono` 4.12.19 - Worker-compatible HTTP surface for transition writes, evidence reads, health, raw guarded records, and OpenAPI output.
- `@x402/core` 2.12.0 - official x402 client and schema validation used by the local x402 wallet gateway and upstream evidence decoding in `src/adapters/x402-payment/wallet-gateway.ts` and `src/adapters/x402-payment/upstream-evidence.ts`.
- `@x402/evm` 2.12.0 - official exact EVM signing scheme used by `src/adapters/x402-payment/wallet-gateway.ts`.
- `@x402/fetch` 2.12.0 - dev-only upstream parity fixture in `test/conformance/x402-upstream-exact-fixtures.test.ts`.

**Infrastructure:**
- `@cloudflare/workers-types` 4.20260517.1 - D1, KV, and Worker binding types used by `src/http/app-options.ts`, `src/storage/d1/index.ts`, and `src/storage/kv/index.ts`.
- `wrangler` 4.92.0 - Cloudflare Worker local development and deployment configuration through `wrangler.toml`.
- `typescript` 6.0.3 - strict typechecking and declaration generation.
- `eslint` 10.4.0, `typescript-eslint` 8.59.4, and `prettier` 3.8.3 - repository quality gates through `package.json` scripts.
- `@types/bun` 1.3.14 - Bun test and runtime typings for `test/**`.

## Configuration

**Environment:**
- Cloudflare bindings are declared in `wrangler.toml`: `DB` for D1 and `CACHE` for KV.
- Worker binding types live in `src/http/app-options.ts`: `DB?: D1Database`, `CACHE?: KVNamespace`, plus bearer token bindings from `src/http/admission/caller-auth.ts`.
- Transition bearer token bindings are `HANDSHAKE_CONTROL_PLANE_TOKEN`, `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`, `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`, and `HANDSHAKE_REVIEW_CUSTODY_TOKEN` in `src/http/admission/caller-auth.ts`.
- `.env` files: Not detected in the repo root scan; environment values must not be committed.

**Build:**
- `package.json` defines the command contract and package exports.
- `tsconfig.json` targets ES2022, uses `moduleResolution: "Bundler"`, enables `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`, and includes `src` and `test`.
- `tsconfig.build.json` emits declarations only from `src` into `dist`.
- `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, and `.github/workflows/check.yml` define lint, format, ignored generated paths, and CI gates.
- `wrangler.toml` defines Worker entrypoint, Cloudflare compatibility date, D1 binding, and KV binding.

## Platform Requirements

**Development:**
- Install dependencies with `bun install --frozen-lockfile`; this is the command in `README.md` and `.github/workflows/check.yml`.
- Run full local gate with `npm run check:repo`; it chains `check:types`, `lint`, `format:check`, `test`, `pack:check`, and `git diff --check` from `package.json`.
- Run focused gates with `npm run quality:architecture`, `npm run quality:storage`, and `npm run quality:claims` from `package.json`.
- `npm run dev` requires local Cloudflare D1/KV binding setup through `wrangler.toml`; `src/http/store/resolution.ts` refuses protocol state endpoints without D1 or an explicitly injected ephemeral test store.

**Production:**
- Deployment target is Cloudflare Workers with D1 as durable reconstruction storage and KV as cache posture only; source anchors are `src/worker.ts`, `src/http/app.ts`, `src/storage/d1/index.ts`, `src/storage/kv/index.ts`, `migrations/0001_protocol_kernel.sql`, and `wrangler.toml`.
- Package publication is not configured; `package.json` is `"private": true` and `scripts/check-package-surface.mjs` verifies a private source package surface.
- The repository proves a local protocol kernel and reference gateway fixtures. Canonical docs in `README.md`, `docs/internal/decisions.md`, `docs/internal/protocol-definition.md`, and `docs/internal/protocol-kernel-architecture.md` explicitly do not claim hosted operation, live provider custody, broad MCP/runtime interception, or downstream business success.

---

*Stack analysis: 2026-05-22*
