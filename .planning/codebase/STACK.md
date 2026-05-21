# Technology Stack

**Analysis Date:** 2026-05-21

## Languages

**Primary:**
- TypeScript 6.0.3 - Source, tests, protocol schemas, HTTP transport, storage adapters, SDK, runtime ingress, and reference gateway fixtures under `src/` and `test/`. The compiler is configured in `tsconfig.json` and `tsconfig.build.json`.

**Secondary:**
- JavaScript ESM - Tooling/config scripts in `eslint.config.js` and `scripts/check-package-surface.mjs`; package metadata in `package.json` uses ESM via `"type": "module"`.
- SQL - Cloudflare D1 schema in `migrations/0001_protocol_kernel.sql`.
- TOML - Cloudflare Worker binding configuration in `wrangler.toml`.
- Markdown - Compact canonical repo docs in `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, and `docs/internal/*.md`.

## Runtime

**Environment:**
- Bun 1.3.9 - Required local runtime and test runner, declared in `package.json` and `README.md`.
- Cloudflare Workers - Deployment/runtime target for `src/worker.ts`; Worker bindings are typed in `src/http/app-options.ts` and configured in `wrangler.toml`.
- Web Worker + ES2022 TypeScript target - `tsconfig.json` sets `"lib": ["ES2022", "WebWorker"]`, `"target": "ES2022"`, and `"moduleResolution": "Bundler"`.

**Package Manager:**
- Bun 1.3.9 - Declared by `"packageManager": "bun@1.3.9"` in `package.json`.
- Lockfile: present as `bun.lock`.
- `npm run` is used as the script runner in `package.json`, `.github/workflows/check.yml`, and `README.md`; dependency installation is still `bun install --frozen-lockfile`.

## Frameworks

**Core:**
- Hono ^4.12.19 - HTTP/Worker app and route dispatch in `src/http/app.ts`, with the Worker entry in `src/worker.ts`.
- Zod ^4.4.3 - Strict runtime schemas across protocol, HTTP, runtime ingress, install proposals, adapters, and error envelopes, including `src/protocol/foundation/schema-core.ts`, `src/protocol/public/schemas.ts`, `src/runtime/ingress/index.ts`, and `src/http/errors/transition-error-envelope.ts`.
- Cloudflare Workers, D1, and KV types - Platform bindings are represented by `D1Database` and `KVNamespace` in `src/http/app-options.ts`, `src/storage/d1/index.ts`, and `src/storage/kv/index.ts`.

**Testing:**
- Bun test - Test runner imported from `bun:test` across `test/**/*.test.ts`; the all-test command is `npm run test` in `package.json`.
- Bun SQLite harness - Local D1-like integration tests use `bun:sqlite` in `test/support/d1-http-harness.ts` to execute `migrations/0001_protocol_kernel.sql`.
- Architecture and claim guards - Repo-shape, vocabulary, root export, package-surface, and import-posture tests live under `test/architecture/`.

**Build/Dev:**
- TypeScript compiler - `npm run typecheck`, `npm run check:types`, and `npm run build` use `tsc` with `tsconfig.json` and `tsconfig.build.json`.
- ESLint 10.4.0 with typescript-eslint 8.59.4 - Configured in `eslint.config.js`; runs over `src` and `test`.
- Prettier 3.8.3 - Configured in `.prettierrc.json`; `npm run format:check` is part of the full gate.
- Wrangler 4.92.0 - Local Worker development through `npm run dev` and binding config in `wrangler.toml`.
- npm pack dry-run - `scripts/check-package-surface.mjs` builds declarations and runs `npm pack --dry-run --json` to verify the private source-package surface.

## Key Dependencies

**Critical:**
- `hono` ^4.12.19 - Owns HTTP request routing and Worker-compatible app handling in `src/http/app.ts`.
- `zod` ^4.4.3 - Owns schema validation for protocol objects, transition inputs, HTTP responses, runtime ingress dispatches, install proposals, and adapter parameters throughout `src/protocol/`, `src/http/`, `src/runtime/`, `src/install/`, and `src/adapters/`.
- `typescript` ^6.0.3 - Strict typechecking with `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes` in `tsconfig.json`.
- `wrangler` ^4.92.0 - Cloudflare Worker local development and deployment tooling for `wrangler.toml`.

**Infrastructure:**
- `@cloudflare/workers-types` ^4.20260517.1 - Provides `D1Database`, `KVNamespace`, and Worker platform types used by `src/http/app-options.ts`, `src/storage/d1/index.ts`, and `src/storage/kv/index.ts`.
- `@types/bun` ^1.3.14 - Bun type support for tests and runtime helpers; included through `tsconfig.json`.
- `eslint` ^10.4.0 and `typescript-eslint` ^8.59.4 - Static lint gate in `eslint.config.js`.
- `prettier` ^3.8.3 - Formatting gate in `.prettierrc.json`.
- Node built-ins - Used only for tooling and tests, such as `node:child_process` in `scripts/check-package-surface.mjs`, `node:fs/promises` in `test/support/d1-http-harness.ts`, and fixture file helpers in `test/support/*`.

## Configuration

**Environment:**
- Worker bindings are declared in `wrangler.toml`: D1 binding `DB` and KV binding `CACHE`.
- Runtime binding types are declared in `src/http/app-options.ts`: `DB?: D1Database`, `CACHE?: KVNamespace`, and role-scoped caller tokens.
- Local auth mode uses explicit bearer tokens named in `src/http/admission/caller-auth.ts`: `HANDSHAKE_CONTROL_PLANE_TOKEN`, `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`, `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`, and `HANDSHAKE_REVIEW_CUSTODY_TOKEN`.
- Hosted auth mode is an injected verifier interface, not a built-in provider, via `HostedCallerVerifier` in `src/http/admission/hosted-caller-identity.ts` and `authMode: "hosted"` in `src/http/app-options.ts`.
- No `.env*` file was detected during this scan. Do not add secret-bearing env files to repo canon.

**Build:**
- `package.json` defines the command contract and package exports: root `.`, `./conformance`, `./runtime`, `./experimental`, and `./package.json`.
- `tsconfig.json` typechecks `src`, `test`, and `worker-configuration.d.ts`; `tsconfig.build.json` emits declarations only from `src` to `dist`.
- `eslint.config.js` enforces type imports, no unused variables, and no console except `warn`/`error`.
- `.prettierrc.json` sets `printWidth: 120`, semicolons, double quotes, and trailing commas.
- `wrangler.toml` sets `main = "src/worker.ts"` and `compatibility_date = "2026-05-17"`.
- `migrations/0001_protocol_kernel.sql` is the canonical D1 schema for protocol records, greenlight consumption/issuance, idempotency ledgers, posture/current-state indexes, receipt indexes, and stream events.
- `.github/workflows/check.yml` runs `bun install --frozen-lockfile` followed by `npm run check:repo`.

## Platform Requirements

**Development:**
- Install Bun 1.3.9 and run `bun install --frozen-lockfile`, then `npm run check:repo`, as documented in `README.md`.
- The full local gate in `package.json` is `npm run check:types && npm run lint && npm run format:check && npm run test && npm run pack:check && git diff --check`.
- Local D1/HTTP integration tests use an in-memory SQLite-backed D1 harness in `test/support/d1-http-harness.ts`; they do not require a live Cloudflare D1 instance.
- Reference gateway tests use local fixture surfaces for package install, repo write, preview deploy, and x402 payment under `test/support/` and `test/adapters/`.

**Production:**
- Deployment target is Cloudflare Worker through `src/worker.ts` and `wrangler.toml`.
- Durable protocol storage requires Cloudflare D1 binding `DB`; without `DB`, `src/http/store/resolution.ts` refuses protocol state endpoints unless an explicit ephemeral test store is injected.
- KV binding `CACHE` is configured but current source exposes only isolation-cache plumbing in `src/storage/kv/index.ts`; KV is cache posture only, not authority.
- The repo is a private TypeScript protocol kernel. `README.md`, `docs/internal/protocol-definition.md`, and `docs/internal/protocol-kernel-architecture.md` explicitly do not claim hosted operation, live provider custody, broad runtime interception, external package-material attestation, or generic provider-side enforcement.

---

*Stack analysis: 2026-05-21*
