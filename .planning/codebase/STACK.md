# Technology Stack

**Analysis Date:** 2026-05-28

## Languages

**Primary:**
- TypeScript (compiler `^6.0.3`, `target: ES2022`) — protocol kernel, HTTP Worker app, CLI, MCP, SDK, adapters, surfaces, and tests under `src/` and `test/`.

**Secondary:**
- JavaScript (ESM) — release/proof orchestration in `scripts/*.mjs` and `scripts/*.js`.
- SQL — durable protocol store schema in `migrations/0001_protocol_kernel.sql`.
- JSON / TOML — package and MCP metadata (`package.json`, `server.json`), Worker bindings (`wrangler.toml`), CI (`.github/workflows/check.yml`).

## Runtime

**Environment:**
- Node.js `>=20` — declared in `package.json#engines`; `bin/handshake` and `bin/handshake-mcp` are thin Node launchers that import bundled ESM from `dist/bin/`.
- Bun `1.3.9` — `packageManager` in `package.json`; default test runner (`bun test`), local demos (`bun run ./examples/...`), and ESM bundle step in `scripts/build-package-bundles.mjs`.
- Cloudflare Workers — production HTTP surface via `src/worker.ts` → `createApp()` from `src/http/app.ts`; local dev via `npm run dev` → `wrangler dev`.
- Cloudflare compatibility date `2026-05-17` — `wrangler.toml`.

**Package Manager:**
- Bun `1.3.9`
- Lockfile: `bun.lock` (present)
- CI install: `bun install --frozen-lockfile` in `.github/workflows/check.yml`

## Frameworks

**Core:**
- Hono `^4.12.19` — HTTP routing, middleware, OpenAPI-backed Worker app in `src/http/`.
- Zod `^4.4.3` — runtime schemas and parsing across protocol areas, adapters, hosted admission, and CLI inputs.
- `@modelcontextprotocol/server` / `@modelcontextprotocol/client` `^2.0.0-alpha.2` — stdio MCP server (`src/mcp/stdio/server.ts`) and doctor/process-proof client (`src/mcp/stdio/process-proof.ts`).
- `@x402/core` / `@x402/evm` `2.12.0` — x402 v2 payment-required validation and EVM exact-scheme gateway client in `src/adapters/x402-payment/` and live proof projections in `src/surfaces/proof-packets/live-x402/`.

**Testing:**
- Bun built-in test runner — `npm run test` → `bun test`; no separate Jest/Vitest config.

**Build / Dev:**
- TypeScript `tsc` — declaration emit via `tsconfig.build.json` → `dist/**/*.d.ts`.
- Bun `build` — ESM bundles for package exports and CLI/MCP bins via `scripts/build-package-bundles.mjs`.
- Wrangler `^4.92.0` — Worker dev/deploy tooling.
- ESLint `^10.4.0` + `typescript-eslint` `^8.59.4` — `eslint.config.js`.
- Prettier `^3.8.3` — `.prettierrc.json` (120 print width, semicolons, trailing commas).

## Key Dependencies

**Critical (product wedge):**
- `@x402/core` `2.12.0` — PAYMENT-REQUIRED parsing, gateway HTTP client, payment payload validation (`src/adapters/x402-payment/wallet-gateway.ts`, `src/surfaces/proof-packets/live-x402/requirement.ts`).
- `@x402/evm` `2.12.0` — `ExactEvmScheme` and `ClientEvmSigner` for buyer-side exact payments after gateway check.
- `hono` — protocol transition HTTP API and evidence read routes (`src/http/routes/`, `src/http/handlers/`).
- `zod` — canonical input validation at protocol and product boundaries.

**Infrastructure / platform:**
- `@cloudflare/workers-types` — Worker/D1/KV typings in `tsconfig.json`.
- `@cfworker/json-schema` `^4.1.1` — direct dependency; also satisfies MCP SDK optional peer for JSON Schema validation.

**Dev-only integration helpers:**
- `@x402/fetch` `2.12.0` (devDependency) — fetch-layer x402 helpers for tests and proof scripts.

## Configuration

**TypeScript:**
- Base: `tsconfig.json` — `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `moduleResolution: Bundler`, `lib: ["ES2022","WebWorker"]`, `types: ["@cloudflare/workers-types","bun-types"]`.
- Build emit: `tsconfig.build.json` — `declaration` only into `dist/` from `src/`.

**Lint / format:**
- `eslint.config.js` — recommended TypeScript rules; `consistent-type-imports`, `no-console` (warn/error only).
- `.prettierrc.json` — repo-wide formatting.

**Worker / storage:**
- `wrangler.toml` — `main = "src/worker.ts"`, D1 binding `DB` → database `handshake_protocol`, KV binding `CACHE`.
- `migrations/0001_protocol_kernel.sql` — canonical D1 tables for protocol records, greenlight consumption, streams, isolation, etc.

**Environment:**
- Do not commit secrets. Worker role tokens are binding names in `src/http/admission/caller-auth.ts` (`HANDSHAKE_*_TOKEN`), not hardcoded values.
- Local CLI state defaults to `.handshake/project.json` under cwd and optional XDG state under `~/.local/state/handshake` (`src/cli/local-project/index.ts`).

**Build:**
```bash
npm run build          # tsc declarations + bun bundle all entrypoints
npm run dev            # wrangler dev
npm run check:repo     # build + typecheck + lint + format + test + pack:check
```

## Platform Requirements

**Development:**
- Node.js `>=20` for installed CLI/MCP binaries.
- Bun `1.3.9` (or compatible) for `bun install`, `bun test`, and bundle build.
- Wrangler CLI for Worker local dev when exercising `src/http/` against D1/KV bindings.

**Production:**
- Cloudflare Workers deployment with D1 (`DB`) for durable protocol state (`src/http/store/resolution.ts` → `D1ProtocolStore` in `src/storage/d1/index.ts`).
- Optional KV (`CACHE`) for isolation snapshot cache (`src/storage/kv/index.ts`); D1 remains source of truth per `migrations/0001_protocol_kernel.sql` header comment.
- npm registry publication of `handshake-protocol-kernel` (package name in `package.json`; MCP name `io.github.CreasyBear/handshake-protocol-kernel` in `server.json`).

**Distribution surfaces (non-authority):**
- npm package exports — curated subpaths in `package.json#exports` (root, `./cli`, `./mcp`, `./hosted-admission`, `./x402-protected-tool`, `./surfaces/*`, etc.).
- MCP Registry metadata — `server.json` declares stdio transport via npm package; discoverability is tracked as proof gap in product docs, not stack-enforced.

---

*Stack analysis: 2026-05-28*
