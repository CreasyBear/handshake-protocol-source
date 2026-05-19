# Technology Stack

**Analysis Date:** 2026-05-19

## Languages

**Primary:**
- TypeScript 6.0.3 - protocol kernel, HTTP transport, SDK, runtime proposal helpers, reference gateways, storage adapters, and tests under `src/` and `test/`. Configured by `tsconfig.json` and `tsconfig.build.json`.

**Secondary:**
- JavaScript ESM - repository tooling in `eslint.config.js` and `scripts/check-package-surface.mjs`.
- SQL - Cloudflare D1 schema in `migrations/0001_protocol_kernel.sql`.
- Markdown - canonical repo documents in `README.md`, `QUALITY.md`, `STRUCTURE.md`, and `docs/internal/*.md`.

## Runtime

**Environment:**
- Bun 1.3.9 - declared in `package.json` as `packageManager` and used by `.github/workflows/check.yml` through `oven-sh/setup-bun@v2`.
- Cloudflare Workers - Worker entrypoint is `src/worker.ts`; local Worker dev runs through `wrangler dev` from `package.json`.
- Web Worker + ES2022 runtime types - configured in `tsconfig.json` with `lib: ["ES2022", "WebWorker"]` and `types: ["@cloudflare/workers-types", "bun-types"]`.

**Package Manager:**
- Bun 1.3.9 - install target in `README.md` and CI.
- Lockfile: present at `bun.lock`.
- Package is private: `package.json` sets `"private": true` and exposes source-package subpaths for root, `./conformance`, and `./experimental`.

## Frameworks

**Core:**
- Hono 4.12.19 - HTTP/Worker app and route dispatch in `src/http/app.ts`.
- Zod 4.4.3 - strict protocol/input/response schemas across `src/protocol/**`, `src/http/routes/**`, and `src/http/openapi/index.ts`.
- Cloudflare Workers runtime types 4.20260517.1 - D1/KV/Worker binding types in `src/http/app-options.ts`, `src/storage/d1/index.ts`, and `src/storage/kv/index.ts`.

**Testing:**
- Bun test - all tests under `test/` import `bun:test`; full command is `npm run test`.
- Architecture/invariant tests - `test/architecture/*`, `test/protocol/*`, `test/http/*`, `test/runtime/*`, `test/adapters/*`, `test/conformance/*`, and `test/integration/*`.

**Build/Dev:**
- TypeScript compiler 6.0.3 - `npm run typecheck`, `npm run check:types`, and declaration-only `npm run build`.
- Wrangler 4.92.0 - Cloudflare Worker dev/deploy binding config through `wrangler.toml`.
- ESLint 10.4.0 + typescript-eslint 8.59.4 - linting for `src` and `test` through `eslint.config.js`.
- Prettier 3.8.3 - formatting commands in `package.json`; no `.prettierrc` file detected.

## Key Dependencies

**Critical:**
- `hono` ^4.12.19 - request routing, error handling, JSON responses, Worker-compatible app construction in `src/http/app.ts`.
- `zod` ^4.4.3 - authoritative runtime schema validation and OpenAPI JSON schema projection in `src/http/openapi/index.ts`.

**Infrastructure:**
- `@cloudflare/workers-types` ^4.20260517.1 - typed `D1Database`, `D1PreparedStatement`, `KVNamespace`, and Worker bindings.
- `wrangler` ^4.92.0 - local Worker execution and Cloudflare binding configuration.
- `typescript` ^6.0.3 - strict type system and declaration output.
- `eslint` ^10.4.0 / `typescript-eslint` ^8.59.4 - import/style guardrail tooling.
- `prettier` ^3.8.3 - repository formatting gate.
- `@types/bun` ^1.3.14 - Bun test/runtime types.

## Configuration

**Environment:**
- Worker bindings live in `wrangler.toml`: `DB` for D1 and `CACHE` for KV.
- HTTP caller custody tokens are optional Worker bindings in `src/http/admission/caller-auth.ts`: `HANDSHAKE_CONTROL_PLANE_TOKEN`, `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`, `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`, and `HANDSHAKE_REVIEW_CUSTODY_TOKEN`.
- App-level injection is supported by `AppOptions` in `src/http/app-options.ts` for an explicit `ProtocolStore`, ephemeral test store, local caller tokens, `authMode`, and hosted caller verifier.
- No `.env` files detected in the repository root scan; do not assume local secrets are stored in repo.

**Build:**
- `package.json`: command contract, dependency versions, private package exports, and packaged file allowlist.
- `tsconfig.json`: strict TypeScript settings, Worker/Bun types, `ESNext` modules, Bundler resolution.
- `tsconfig.build.json`: declaration-only package build into `dist`.
- `eslint.config.js`: TypeScript ESLint recommended config, type-import enforcement, unused-variable policy, and restricted console usage.
- `wrangler.toml`: Worker entrypoint and D1/KV binding names.
- `.github/workflows/check.yml`: CI installs Bun 1.3.9, runs `bun install --frozen-lockfile`, then `npm run check:repo`.
- `scripts/check-package-surface.mjs`: npm dry-run package surface check that excludes `.planning/`, `.agents/`, tests, and non-canonical doc trees.

## Platform Requirements

**Development:**
- Bun 1.3.9 and dependencies from `bun.lock`.
- Node-compatible tooling is used for `npm run` script orchestration and `scripts/check-package-surface.mjs`.
- Full local gate: `npm run check:repo`.
- Focused gates: `npm run quality:architecture`, `npm run quality:storage`, and `npm run quality:claims`.

**Production:**
- Deployment target is a Cloudflare Worker configured by `wrangler.toml`.
- Durable protocol storage expects Cloudflare D1 with schema from `migrations/0001_protocol_kernel.sql`.
- KV is configured as `CACHE` but is cache posture only; `src/storage/kv/index.ts` implements isolation-cache helpers and does not hold authority.
- The repo canon states this checkout is a TypeScript protocol kernel, not a hosted product; production enforcement exists only for installed gateway paths that own mutation credentials and check exact greenlights.

---

*Stack analysis: 2026-05-19*
