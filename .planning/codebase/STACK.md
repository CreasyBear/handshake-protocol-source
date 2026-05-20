# Technology Stack

**Analysis Date:** 2026-05-20
**Current HEAD:** `88e6f16`
**Scope:** Current tracked docs, source, tests, package/config files, plus visible untracked Tier 1 AuthorityCertificate/kernel work in this checkout. `.planning/` is scratch.

## Languages

**Primary:**
- TypeScript, targeting ES2022 - all protocol, HTTP, runtime, adapter, storage, SDK, and test code under `src/` and `test/`.
- TypeScript uses strict compiler settings from `tsconfig.json`: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `moduleResolution: "Bundler"`, and `lib: ["ES2022", "WebWorker"]`.

**Secondary:**
- SQL - Cloudflare D1 schema in `migrations/0001_protocol_kernel.sql`.
- JavaScript ESM - local tooling and config in `eslint.config.js` and `scripts/check-package-surface.mjs`.
- TOML - Cloudflare Worker/D1/KV config in `wrangler.toml`.
- YAML - GitHub Actions CI config in `.github/workflows/check.yml`.
- Markdown - canonical repo docs in `README.md`, `AGENTS.md`, `QUALITY.md`, `STRUCTURE.md`, and `docs/internal/*.md`.

## Runtime

**Environment:**
- Bun `1.3.9` - declared in `package.json` via `"packageManager": "bun@1.3.9"` and installed in CI through `.github/workflows/check.yml`.
- Cloudflare Workers runtime - Worker entrypoint is `src/worker.ts`, which exports `createApp().fetch`; Worker compatibility date is `2026-05-17` in `wrangler.toml`.
- Web Worker APIs - TypeScript includes `WebWorker` and source uses Web Crypto globals such as `crypto.subtle`, `TextEncoder`, `btoa`, and `atob` in `src/protocol/foundation/canonical.ts` and `src/protocol/areas/authority-certificate/signing.ts`.
- Node APIs are development/test tooling only - examples include `node:child_process` in `scripts/check-package-surface.mjs`, filesystem/path helpers in `test/support/d1-http-harness.ts`, and test fixtures in `test/adapters/preview-deploy-gateway.test.ts`.

**Package Manager:**
- Bun `1.3.9`.
- Lockfile: present as `bun.lock`.
- `npm run` is used as the command runner in `package.json`, but the dependency lock is Bun-owned and CI installs with `bun install --frozen-lockfile` in `.github/workflows/check.yml`.

## Frameworks

**Core:**
- Hono `^4.12.19` - HTTP app/router in `src/http/app.ts`; Worker fetch entrypoint in `src/worker.ts`.
- Zod `^4.4.3` - strict protocol, HTTP, runtime ingress, adapter, evidence, and OpenAPI schemas across `src/protocol/**`, `src/http/**`, `src/runtime/**`, `src/adapters/**`, and `src/install/**`.
- Cloudflare Workers/D1/KV - deployment and binding posture in `wrangler.toml`; `D1Database` store in `src/storage/d1/index.ts`; `KVNamespace` cache seam in `src/storage/kv/index.ts`; `WorkerBindings` in `src/http/app-options.ts`.

**Testing:**
- Bun test - `package.json` runs `bun test`; tests import from `bun:test` under `test/**/*.test.ts`.
- Bun SQLite - local D1 test harness in `test/support/d1-http-harness.ts` uses `bun:sqlite` to emulate D1 behavior for HTTP/D1 integration tests.

**Build/Dev:**
- TypeScript `^6.0.3` - typecheck via `tsc --noEmit`; declaration build via `tsc -p tsconfig.build.json`.
- Wrangler `^4.92.0` - local Worker dev via `npm run dev` -> `wrangler dev`.
- ESLint `^10.4.0` with `typescript-eslint` `^8.59.4` - lint rules in `eslint.config.js` over `src/**/*.ts` and `test/**/*.ts`.
- Prettier `^3.8.3` - formatting settings in `.prettierrc.json`.
- npm pack dry-run - package surface gate in `scripts/check-package-surface.mjs`.

## Key Dependencies

**Critical:**
- `zod` `^4.4.3` - protocol authority objects and HTTP request/response contracts are schema-first. Key schema owners include `src/protocol/public/schemas.ts`, `src/protocol/public/inputs.ts`, `src/protocol/areas/authority-certificate/schemas.ts`, `src/runtime/ingress/index.ts`, and `src/adapters/x402-payment/install-proposal.ts`.
- `hono` `^4.12.19` - request routing, error handling, and Worker-compatible app surface in `src/http/app.ts`.

**Infrastructure:**
- `@cloudflare/workers-types` `^4.20260517.1` - D1, KV, and Worker binding types used by `src/http/app-options.ts`, `src/storage/d1/index.ts`, and `src/storage/kv/index.ts`.
- `@types/bun` `^1.3.14` - Bun test/runtime types for `test/**/*.test.ts` and `test/support/d1-http-harness.ts`.
- `typescript` `^6.0.3` - strict source and declaration build.
- `eslint` `^10.4.0` and `typescript-eslint` `^8.59.4` - zero-warning lint posture from `package.json`.
- `prettier` `^3.8.3` - repository format gate.
- `wrangler` `^4.92.0` - Cloudflare local dev/deploy tool configured by `wrangler.toml`.

## Configuration

**Environment:**
- Worker bindings are declared in `wrangler.toml`: D1 binding `DB` and KV binding `CACHE`.
- HTTP app accepts injected store/auth configuration through `AppOptions` in `src/http/app-options.ts`: `store`, `allowEphemeralStore`, `callerAuthTokens`, `authMode`, and `hostedCallerVerifier`.
- Local bearer-token admission expects role-specific token bindings in `src/http/admission/caller-auth.ts`: `HANDSHAKE_CONTROL_PLANE_TOKEN`, `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`, `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`, and `HANDSHAKE_REVIEW_CUSTODY_TOKEN`.
- Hosted admission is interface-based, not provider-bound: `HostedCallerVerifier` and `TransitionCallerIdentity` live in `src/http/admission/hosted-caller-identity.ts`.
- No `.env` or `.dev.vars` file is present at repo root during this scan. `.gitignore` excludes `.dev.vars`, `.planning/`, `.agents/`, `node_modules/`, `dist/`, and `.wrangler/`.

**Build:**
- `tsconfig.json` is the source/test typecheck config.
- `tsconfig.build.json` emits declarations only from `src/` to `dist/`.
- `package.json` exports curated source subpaths for local source usage and generated declaration paths for package output:
  - `.` -> `src/index.ts` and `dist/index.d.ts`
  - `./conformance` -> `src/conformance/index.ts`
  - `./runtime` -> `src/runtime/index.ts`
  - `./experimental` -> `src/experimental.ts`
- `scripts/check-package-surface.mjs` verifies `npm pack --dry-run --json` includes required docs and declaration outputs while excluding `.planning/`, `.agents/`, tests, archive docs, and historical planning/product doc paths.
- `wrangler.toml` defines Worker `main = "src/worker.ts"` for local dev/deploy.

## Platform Requirements

**Development:**
- Bun `1.3.9` is required; use `bun install --frozen-lockfile`.
- The full local/CI gate is `npm run check:repo`, which runs `check:types`, lint, Prettier check, Bun tests, package surface check, and `git diff --check`.
- Focused gates in `package.json`:
  - `npm run quality:architecture`
  - `npm run quality:claims`
  - `npm run quality:storage`
- Cloudflare local dev requires configured D1/KV bindings or injected test stores. Without `DB` or an injected fallback store, `src/http/store/resolution.ts` returns `durable_store_unavailable`.

**Production:**
- Deployment target is Cloudflare Workers with D1 as durable reconstruction store and KV as cache posture only.
- D1 schema is rooted at `migrations/0001_protocol_kernel.sql`.
- The current repo is a TypeScript protocol kernel, not a complete hosted product. `README.md` and `docs/internal/decisions.md` explicitly limit current claims: no live provider custody, no hosted org auth/RBAC/search, no cross-org AuthorityCertificate trust, no JWKS/revocation, no broad MCP/browser/shell/network interception, and no spend-window ledger enforcement.

---

*Stack analysis: 2026-05-20*
