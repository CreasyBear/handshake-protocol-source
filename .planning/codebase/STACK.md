# Technology Stack

**Analysis Date:** 2026-05-24

## Languages

**Primary:**
- TypeScript 6.0.3 - Protocol kernel, HTTP app, runtime proposal helpers, adapter fixtures, storage, SDK, CLI, MCP, tests, and demos under `src/`, `test/`, and `examples/`; configured by `tsconfig.json` and `tsconfig.build.json`.

**Secondary:**
- JavaScript ESM - Package build/check scripts in `scripts/build-package-bundles.mjs`, `scripts/check-package-surface.mjs`, and `scripts/check-published-entrypoints.mjs`; thin Node bin wrappers in `bin/handshake` and `bin/handshake-mcp`.
- SQL - Cloudflare D1 protocol storage schema in `migrations/0001_protocol_kernel.sql`.
- Markdown - Canonical repo docs in `README.md`, `QUALITY.md`, `STRUCTURE.md`, `AGENTS.md`, and `docs/internal/*.md`; example walkthrough docs in `examples/x402-protected-spend/README.md`, `examples/self-hosted-activation/README.md`, and `examples/mcp-reference-transcript/README.md`.

## Runtime

**Environment:**
- Bun 1.3.9 - Required by `package.json#engines`, `package.json#packageManager`, and `.github/workflows/check.yml`; used for local install, tests, and `bun build` package bundles.
- Node.js >=20 - Required by `package.json#engines`; packaged CLI/MCP bins in `bin/handshake` and `bin/handshake-mcp` import bundled Node ESM from `dist/bin/*.mjs`. Local observed runtime: `node --version` reported `v25.2.1`.
- Cloudflare Workers - Worker entrypoint is `src/worker.ts`; bindings are configured in `wrangler.toml`.

**Package Manager:**
- Bun 1.3.9 - Lockfile: `bun.lock` present.
- npm 11.7.0 observed locally - Used as the script runner in `package.json#scripts`; `scripts/check-package-surface.mjs` runs `npm pack --dry-run --json`.
- Lockfile: present (`bun.lock`).

## Frameworks

**Core:**
- Hono ^4.12.19 - HTTP/Worker router in `src/http/app.ts`.
- Cloudflare Workers + Wrangler ^4.92.0 - Worker development/deployment config in `wrangler.toml`; Worker binding types in `src/http/app-options.ts`.
- Zod ^4.4.3 - Runtime validation and schema definitions across `src/protocol/**`, `src/http/**`, `src/runtime/**`, `src/adapters/**`, `src/cli/**`, and `src/mcp/**`.
- MCP TypeScript SDK 2.0.0-alpha.2 - Local stdio MCP server/client process proof in `src/mcp/stdio/server.ts`, `src/mcp/stdio/process-proof.ts`, and `scripts/check-published-entrypoints.mjs`.
- x402 SDK 2.12.0 - Official buyer-side exact proof path through `@x402/core`, `@x402/evm`, and `@x402/fetch`; implementation lives in `src/adapters/x402-payment/**` and `examples/x402-protected-spend/run.ts`.

**Testing:**
- Bun test - Test runner for all `test/**/*.test.ts`; configured through `package.json#scripts.test`.
- TypeScript compiler - Static checking via `npm run check:types` and `npm run typecheck`.

**Build/Dev:**
- TypeScript declarations - `npm run build:types` runs `tsc -p tsconfig.build.json`.
- Bun bundler - `scripts/build-package-bundles.mjs` builds Node-targeted ESM bundles for package imports and bins.
- ESLint 10.4.0 + typescript-eslint 8.59.4 - Lint rules in `eslint.config.js`.
- Prettier 3.8.3 - Formatting in `.prettierrc.json`.
- Wrangler - `npm run dev` runs `wrangler dev` for the Worker app.

## Key Dependencies

**Critical:**
- `zod` ^4.4.3 - Validates protocol objects, HTTP inputs/outputs, MCP tool inputs, CLI outputs, and adapter evidence; example files include `src/protocol/public/schemas.ts`, `src/mcp/x402-proposal.ts`, and `src/cli/output.ts`.
- `hono` ^4.12.19 - Hosts `/health`, `/openapi.json`, protocol transition routes, evidence routes, and internal record reads in `src/http/app.ts`.
- `@modelcontextprotocol/server` 2.0.0-alpha.2 - Builds the local stdio MCP proposal/evidence server in `src/mcp/stdio/server.ts`.
- `@modelcontextprotocol/client` 2.0.0-alpha.2 - Smoke-tests the packaged MCP bin in `scripts/check-published-entrypoints.mjs` and local process proof helpers in `src/mcp/stdio/process-proof.ts`.
- `@x402/core` 2.12.0 - Parses and validates official x402 PaymentRequired and PaymentPayload data in `src/adapters/x402-payment/upstream-evidence.ts` and `src/adapters/x402-payment/wallet-gateway.ts`.
- `@x402/evm` 2.12.0 - Provides `ExactEvmScheme` and signer types for gateway-held signing in `src/adapters/x402-payment/wallet-gateway.ts`.
- `@x402/fetch` 2.12.0 - Dev/test dependency used by x402 upstream fixture parity tests in `test/conformance/x402-upstream-exact-fixtures.test.ts`.
- `@cloudflare/workers-types` ^4.20260517.1 - Supplies Worker, D1, and KV TypeScript bindings used by `src/http/app-options.ts`, `src/storage/d1/index.ts`, and `src/storage/kv/index.ts`.

**Infrastructure:**
- `typescript` ^6.0.3 - Strict ES2022 source checking with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` in `tsconfig.json`.
- `eslint` ^10.4.0 and `typescript-eslint` ^8.59.4 - Import/type hygiene and no-console rules in `eslint.config.js`.
- `prettier` ^3.8.3 - Formatting rules in `.prettierrc.json`.
- `@cfworker/json-schema` ^4.1.1 - Listed in `package.json#dependencies`; no current imports detected under `src/`, `test/`, `examples/`, or `scripts/`.
- `@types/bun` ^1.3.14 - Bun globals/types for tests and examples.

## Configuration

**Environment:**
- Worker bindings are declared in `wrangler.toml`: D1 binding `DB` and KV binding `CACHE`.
- HTTP transition bearer tokens are read from Worker bindings or injected options: `HANDSHAKE_CONTROL_PLANE_TOKEN`, `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`, `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`, and `HANDSHAKE_REVIEW_CUSTODY_TOKEN` in `src/http/admission/caller-auth.ts`.
- Local CLI state uses `.handshake/project.json` in the target working directory and `XDG_STATE_HOME` or `~/.local/state/handshake` for external state refs in `src/cli/local-project/index.ts`.
- `.env` files: Not detected by `find . -maxdepth 3 -name '.env*' -type f`; do not add secrets to repo docs or examples.

**Build:**
- TypeScript config: `tsconfig.json` uses `target: ES2022`, `module: ESNext`, `moduleResolution: Bundler`, `lib: ES2022` and `WebWorker`, strict mode, and Worker/Bun types.
- Declaration build config: `tsconfig.build.json` emits declarations only from `src/` into `dist/`.
- Bundle config: `scripts/build-package-bundles.mjs` bundles `src/index.ts`, `src/conformance/index.ts`, `src/runtime/index.ts`, `src/sdk/surface-clients/index.ts`, `src/cli/index.ts`, `src/mcp/index.ts`, `src/experimental.ts`, `src/cli/main.ts`, and `src/mcp/stdio/entry.ts`.
- Lint config: `eslint.config.js` ignores `dist/**`, `coverage/**`, `node_modules/**`, and `docs/internal/archive/**`; it enforces type imports, unused-var cleanup, and no `console` except `warn`/`error`.
- Format config: `.prettierrc.json` sets `printWidth: 120`, semicolons, double quotes, and trailing commas.

## Package Surface

**npm package:**
- Name/version: `handshake-protocol-kernel` `0.2.4` in `package.json`.
- Package is publishable-shaped, not private; `package.json#private` is absent and `scripts/check-published-entrypoints.mjs` asserts it is not `true`.
- Published files are constrained by `package.json#files` to `bin`, `src`, `dist`, `server.json`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, and compact `docs/internal/*.md`.
- `scripts/check-package-surface.mjs` rejects packaged `.planning/`, `.agents/`, `skills-lock.json`, `test/`, old docs trees, and `.DS_Store`.

**Exports:**
- Root API: `.` -> `src/index.ts` for Bun and `dist/index.mjs`/`dist/index.d.ts` for Node/package consumers.
- Conformance API: `./conformance` -> `src/conformance/index.ts`.
- Runtime proposal API: `./runtime` -> `src/runtime/index.ts`.
- Role-scoped SDK API: `./sdk/role-clients` -> `src/sdk/surface-clients/index.ts`.
- CLI library API: `./cli` -> `src/cli/index.ts`.
- MCP library API: `./mcp` -> `src/mcp/index.ts`.
- Explicit experimental adapter API: `./experimental` -> `src/experimental.ts`.

**Bins:**
- `handshake` -> `bin/handshake` -> `dist/bin/handshake.mjs`; local evidence/operator CLI only.
- `handshake-mcp` -> `bin/handshake-mcp` -> `dist/bin/handshake-mcp.mjs`; local stdio MCP proposal/evidence server only.
- `handshake-protocol-kernel` -> `bin/handshake-mcp`; package-name default executable for MCP registry installs.

**MCP Registry Metadata:**
- `server.json` names `io.github.joelchan/handshake-protocol-kernel` and one npm/stdio package `handshake-protocol-kernel` version `0.2.4`.
- `package.json#mcpName` must match `server.json#name`; `scripts/check-published-entrypoints.mjs` asserts this.

## CLI/MCP Boundary

**CLI:**
- `src/cli/command-manifest.ts` defines active commands: `schema`, `init`, `doctor`, `evidence aps-report`, `evidence contract-view`, `evidence receipt-timeline`, `cert verify`, `support bundle`, `install x402-payment`, `probes x402-payment`, `install health`, and `conformance x402-payment`.
- `src/cli/output.ts` hard-codes `authorityCreated: false`, `greenlightCreated: false`, `gatewayCheckPerformed: false`, `mutationAttempted: false`, `credentialMaterialIncluded: false`, `receiptExportCreated: false`, and `authorityCertificateMinted: false` for CLI envelopes.
- CLI commands are local operator/evidence surfaces. They do not evaluate policy, issue greenlights, perform gateway checks, run protected mutations, hold credential custody, or expose raw records.

**MCP:**
- `src/mcp/catalog.ts` exposes one proposal tool: `handshake.actions.x402_payment.propose`.
- `src/mcp/catalog.ts` exposes read-only resource templates under `handshake://metadata/*`, `handshake://challenges/*`, `handshake://evidence/*`, `handshake://health/*`, and `handshake://certificates/*`.
- `src/mcp/x402-proposal.ts` can create runtime execution evidence, tool-call drafts, intent compilations, and proposed action contracts through a role-scoped runtime client.
- `src/mcp/x402-proposal.ts` and `src/mcp/catalog.ts` keep MCP outputs non-authority: no policy decision, no greenlight, no gateway check, no mutation, no receipt export, no certificate mint, and no credential material.

## Current Dirty Worktree State

**Visible modified/untracked files treated as current state:**
- x402 sandbox/evidence implementation: `src/adapters/x402-payment/action-proposal.ts`, `src/adapters/x402-payment/index.ts`, `src/adapters/x402-payment/upstream-evidence.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, and untracked `src/adapters/x402-payment/sandbox-http.ts`.
- x402 runtime and reason-code integration: `src/runtime/ingress/index.ts` and `src/protocol/foundation/reason-codes.ts`.
- x402 demo and tests: `examples/x402-protected-spend/README.md`, `examples/x402-protected-spend/run.ts`, `test/adapters/x402-payment-action-proposal.test.ts`, `test/adapters/x402-wallet-gateway.test.ts`, and `test/product/x402-protected-spend-demo-report.test.ts`.
- Canonical docs also have current edits: `README.md`, `docs/internal/decisions.md`, and `docs/internal/protocol-notes.md`.
- Existing `.planning/codebase/*.md` files are modified; only `.planning/codebase/STACK.md` and `.planning/codebase/INTEGRATIONS.md` are assigned for this mapper write.

**x402 posture in current source:**
- The active proof slice is buyer-side `x402_payment.exact` with official x402 PaymentRequired evidence, local/reference paid-HTTP sandbox challenge/retry evidence, and gateway-held PaymentPayload / `PAYMENT-SIGNATURE` creation after a verified gateway check.
- `src/adapters/x402-payment/sandbox-http.ts` provides a local/reference 402 challenge and records one signed retry only after signature evidence exists.
- `src/adapters/x402-payment/wallet-gateway.ts` rejects non-sandbox/live unknown provider posture and ambiguous request body posture before official gateway signing.
- Spend windows beyond per-call bounds are metadata only; no spend-window ledger is present in `src/protocol/areas/` or `migrations/0001_protocol_kernel.sql`.

## Platform Requirements

**Development:**
- Install with `bun install --frozen-lockfile` as documented in `README.md` and enforced by `.github/workflows/check.yml`.
- Main gate: `npm run check:repo`, which runs types, lint, format check, Bun tests, package checks, and `git diff --check`.
- Focused gates: `npm run quality:architecture`, `npm run quality:storage`, and `npm run quality:claims` in `package.json`.

**Production:**
- HTTP service target is Cloudflare Workers through `src/worker.ts` and `wrangler.toml`.
- Durable protocol reconstruction target is Cloudflare D1 through `src/storage/d1/index.ts` and `migrations/0001_protocol_kernel.sql`.
- KV is cache posture only through `src/storage/kv/index.ts`; it is not authority or durable reconstruction truth.
- npm/MCP package consumers use Node ESM bundles under `dist/` and bin wrappers under `bin/`.

---

*Stack analysis: 2026-05-24*
