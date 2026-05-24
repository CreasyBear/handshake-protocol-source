# Technology Stack

**Analysis Date:** 2026-05-24

## Languages

**Primary:**
- TypeScript 6.0.3 - Protocol kernel, HTTP worker, runtime ingress, adapters, SDK, CLI, MCP surface, examples, and tests under `src/`, `test/`, and `examples/`; configured in `tsconfig.json` and `tsconfig.build.json`.

**Secondary:**
- JavaScript ESM - Tooling scripts and config in `eslint.config.js` and `scripts/check-package-surface.mjs`.
- SQL - Cloudflare D1 schema in `migrations/0001_protocol_kernel.sql`.
- Markdown - Canonical tracked repo docs in `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, and `docs/internal/*.md`; `.planning/` files are derived scratch only.

## Runtime

**Environment:**
- Bun 1.3.9 - Required local runtime and package manager; pinned in `package.json` via `"packageManager": "bun@1.3.9"` and used by `.github/workflows/check.yml`.
- Node.js - Used by npm script orchestration, Node ESM scripts such as `scripts/check-package-surface.mjs` and `scripts/check-published-entrypoints.mjs`, and the bundled CLI/MCP package bins.
- Cloudflare Workers - Worker entrypoint is `src/worker.ts`; local/dev deployment config is `wrangler.toml`; HTTP app wiring lives in `src/http/app.ts`.

**Package Manager:**
- Bun 1.3.9 - Primary install/test runtime.
- npm 11.7.0 observed locally - Used as script runner in `package.json` commands such as `npm run check:repo`.
- Lockfile: present as `bun.lock`.

## Frameworks

**Core:**
- Hono 4.12.19 - Worker HTTP router in `src/http/app.ts`.
- Zod 4.4.3 - Runtime validation and schema contracts across `src/protocol/public`, `src/protocol/areas`, `src/runtime/ingress/index.ts`, `src/adapters/*`, and `src/mcp/x402-proposal.ts`.
- Cloudflare Workers Types 4.20260517.1 - D1/KV/Worker typings configured in `tsconfig.json`.
- Cloudflare D1 - Durable reference protocol store via `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, and `migrations/0001_protocol_kernel.sql`.
- Cloudflare KV - Non-authoritative isolation cache posture in `src/storage/kv/index.ts`.

**Testing:**
- Bun test - Test runner invoked by `npm run test`; tests live under `test/`.
- TypeScript compiler - Type gate via `npm run check:types` and declaration build via `npm run build`.
- Architecture/product claim tests - Guard repo shape and claim boundaries under `test/architecture/*`, including MCP and adapter posture tests.

**Build/Dev:**
- Wrangler 4.92.0 - Worker dev command via `npm run dev`; config in `wrangler.toml`.
- ESLint 10.4.0 with `typescript-eslint` 8.59.4 - Linting configured in `eslint.config.js`.
- Prettier 3.8.3 - Formatting gate via `npm run format:check`.
- npm pack dry-run - Package surface gate in `scripts/check-package-surface.mjs`, invoked by `npm run pack:check`.
- Bun build bundling - `scripts/build-package-bundles.mjs` uses `bun build --target=node --format=esm` to emit Node-runnable public import bundles and CLI/MCP bin bundles under `dist/`.

## Key Dependencies

**Critical:**
- `@x402/core` 2.12.0 - Official x402 client/schema surface used in `src/adapters/x402-payment/wallet-gateway.ts` and parity tests under `test/conformance/x402-upstream-exact-fixtures.test.ts`.
- `@x402/evm` 2.12.0 - Official exact EVM signer scheme used by `createOfficialExactX402SigningSurface()` in `src/adapters/x402-payment/wallet-gateway.ts`.
- `@x402/fetch` 2.12.0 - Dev/parity dependency for upstream x402 fixtures in `test/conformance/x402-upstream-exact-fixtures.test.ts`.
- `@modelcontextprotocol/client` 2.0.0-alpha.2 - Official MCP client SDK used by local stdio process proof in `src/mcp/stdio/process-proof.ts`.
- `@modelcontextprotocol/server` 2.0.0-alpha.2 - Official MCP server SDK used by local stdio server in `src/mcp/stdio/server.ts`.
- `hono` 4.12.19 - HTTP route dispatch and Worker app composition in `src/http/app.ts`.
- `zod` 4.4.3 - Protocol, runtime, adapter, MCP, HTTP, and SDK boundary validation.

**Infrastructure:**
- `@cfworker/json-schema` 4.1.1 - JSON Schema peer used for MCP tool/resource schemas in `src/mcp/catalog.ts`.
- `wrangler` 4.92.0 - Cloudflare Worker/D1/KV local dev tooling.
- `@cloudflare/workers-types` 4.20260517.1 - Worker, D1, and KV type definitions.
- `typescript` 6.0.3 - Strict type checking and declaration emit.
- `eslint` 10.4.0, `typescript-eslint` 8.59.4, `prettier` 3.8.3 - Repo quality gates.

## Configuration

**Environment:**
- No `.env*` files were detected at repo root.
- Worker bindings are declared in `wrangler.toml`: `DB` for D1 and `CACHE` for KV.
- HTTP caller custody uses explicit bearer token bindings in `src/http/admission/caller-auth.ts`: `HANDSHAKE_CONTROL_PLANE_TOKEN`, `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`, `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`, and `HANDSHAKE_REVIEW_CUSTODY_TOKEN`.
- Hosted caller identity is a provider-agnostic seam in `src/http/admission/hosted-caller-identity.ts`; this repo does not prove hosted auth provider operation.

**Build:**
- `package.json` is the canonical local command contract.
- `tsconfig.json` targets ES2022/WebWorker with strict TypeScript, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`.
- `tsconfig.build.json` emits declarations into `dist/`; `scripts/build-package-bundles.mjs` emits Node ESM bundles into the same package directory.
- `eslint.config.js` enforces TypeScript recommended rules, type-only imports, no unused values, and `no-console` except `warn`/`error`.
- `wrangler.toml` defines local Worker, D1, and KV binding names.
- `.github/workflows/check.yml` installs Bun 1.3.9 and runs `npm run check:repo`.

## Platform Requirements

**Development:**
- Run `bun install --frozen-lockfile` before local checks.
- Use `npm run check:repo` as the full local/CI gate; it runs types, lint, format check, Bun tests, package surface check, and whitespace diff.
- Focused gates exist for architecture, storage, and claim checks: `npm run quality:architecture`, `npm run quality:storage`, and `npm run quality:claims`.
- D1-backed HTTP development requires local Worker bindings from `wrangler.toml`; without D1, `src/http/store/resolution.ts` requires an explicitly injected ephemeral test store.

**Production:**
- The configured runtime shape is Cloudflare Worker + D1 + KV, but tracked canon in `README.md`, `docs/internal/decisions.md`, and `docs/internal/protocol-definition.md` says hosted operation, provider custody, live vault operation, live JWKS/revocation, and broad runtime/MCP interception are not proven by this checkout.
- Package publishing is source-ready but not externally executed: `package.json` is publishable, exposes Node-bundled public import paths, defines `handshake` and `handshake-mcp` bins, and includes MCP Registry metadata through `server.json` plus `mcpName`. Actual npm/MCP Registry publication still requires owner credentials and namespace authentication.

## Protected-Action Technology Posture

**x402 Protected-Spend Lane:**
- Source files: `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/bypass-probes.ts`, and `examples/x402-protected-spend/run.ts`.
- Proven scope: one local/reference buyer-side `x402_payment.exact` per-call path where official SDK `PaymentPayload` and `PAYMENT-SIGNATURE` creation happen after a `VerifiedGatewayCheck`.
- Non-claims: no broad x402 compatibility, live provider custody, facilitator operation, seller middleware, aggregate spend-window ledger enforcement, marketplace/certification, or cross-org trust.

**MCP Proposal Surface:**
- Source files: `src/mcp/catalog.ts`, `src/mcp/x402-proposal.ts`, `src/mcp/resources.ts`, `src/mcp/stdio/server.ts`, and `src/mcp/stdio/process-proof.ts`.
- Proven scope: source-owned local stdio proposal/evidence transport for one x402 proposal tool and read-only evidence resources.
- Non-claims: MCP does not evaluate policy, create greenlights, perform gateway checks, sign payments, mutate, export receipts, mint certificates, or protect broad sibling MCP/browser/shell/network paths.

**Runtime Ingress:**
- Source files: `src/runtime/ingress/index.ts`, `src/runtime/index.ts`, and `src/runtime/LANE.md`.
- Proven scope: generated-execution proposal evidence for local x402 payment, package install, and experimental auth.md protected API dispatch families.
- Non-claims: runtime ingress emits evidence, tool-call drafts, compilations, action contracts, and refusals; it does not issue policy decisions, greenlights, gateway checks, receipts, or mutations.

**Adapter Boundaries:**
- Source files: `src/adapters/LANE.md`, `src/experimental.ts`, `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, `src/adapters/preview-deploy/gateway.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, and `src/adapters/auth-md/gateway.ts`.
- Adapters are reference proof lanes and experimental exports; mutation-capable adapter runners must consume a `VerifiedGatewayCheck` before touching the protected surface.

---

*Stack analysis: 2026-05-24*
