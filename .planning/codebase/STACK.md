# Technology Stack

**Analysis Date:** 2026-05-29

## Languages

**Primary:**
- TypeScript (`typescript` `^6.0.3`, `target: ES2022`) — protocol kernel, HTTP Worker app, CLI, MCP, SDK, adapters, surfaces, hosted admission, and tests under `src/` and `test/`.

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
- Zod `^4.4.3` — runtime schemas and parsing across protocol areas, adapters, hosted admission, CLI inputs, and FailureClass taxonomy (`src/protocol/foundation/failure-class/index.ts`).
- `@modelcontextprotocol/server` / `@modelcontextprotocol/client` `^2.0.0-alpha.2` — stdio MCP server (`src/mcp/stdio/server.ts`) and doctor/process-proof client (`src/mcp/stdio/process-proof.ts`).
- `@x402/core` / `@x402/evm` `2.12.0` — x402 v2 payment-required validation and EVM exact-scheme gateway client in `src/adapters/x402-payment/` (including gateway-held custody in `wallet-gateway.ts`).

**Testing:**
- Bun built-in test runner — `npm run test` → `bun test`; no separate Jest/Vitest config.
- Targeted quality scripts — `quality:architecture`, `quality:claims`, `quality:storage` in `package.json#scripts` filter architecture and protocol test subsets.

**Build / Dev:**
- TypeScript `tsc` — declaration emit via `tsconfig.build.json` → `dist/**/*.d.ts`.
- Bun `build` — ESM bundles for package exports and CLI/MCP bins via `scripts/build-package-bundles.mjs`.
- Wrangler `^4.92.0` — Worker dev/deploy tooling.
- ESLint `^10.4.0` + `typescript-eslint` `^8.59.4` — `eslint.config.js`.
- Prettier `^3.8.3` — `.prettierrc.json` (120 print width, semicolons, trailing commas).

## Key Dependencies

**Critical (product wedge):**
- `@x402/core` `2.12.0` — PAYMENT-REQUIRED parsing, HTTP client, payment payload validation (`src/adapters/x402-payment/wallet-gateway.ts`, `src/surfaces/proof-packets/live-x402-requirement.ts`).
- `@x402/evm` `2.12.0` — `ExactEvmScheme` and `ClientEvmSigner` for buyer-side exact payments after gateway check.
- `hono` — protocol transition HTTP API, mutation route manifest parity, and evidence read routes (`src/http/routes/`, `src/http/handlers/`, `src/http/mutation-route-manifest.ts`).
- `zod` — canonical input validation at protocol and product boundaries.

**Infrastructure / platform:**
- `@cloudflare/workers-types` `^4.20260517.1` — Worker/D1/KV typings in `tsconfig.json`.
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
- Do not commit secrets. No `.env` files detected in repo root (operators configure Worker secrets locally).
- Worker role tokens are binding names in `src/http/admission/caller-auth.ts` (`HANDSHAKE_*_TOKEN`), not hardcoded values.
- Local CLI state defaults to `.handshake/project.json` under cwd and optional XDG state under `~/.local/state/handshake` (`src/cli/local-project/index.ts`).

**Build:**
```bash
npm run build          # tsc declarations + bun bundle all entrypoints
npm run dev            # wrangler dev
npm run check:repo     # build + typecheck + lint + format + test + pack:check + git diff --check
```

## Entry Points

**HTTP (Cloudflare Worker):**
- `src/worker.ts` — default export `{ fetch: app.fetch }` from `createApp()`.

**npm package root (`handshake-protocol-kernel`):**
- `src/index.ts` → `dist/index.mjs` — HTTP app factory, protocol public schemas, SDK clients (`ControlPlaneClient`, `GatewayClient`, `PolicyClient`, `EvidenceClient`), navigation metadata, transition error envelopes with FailureClass.

**CLI:**
- `src/cli/main.ts` → `dist/bin/handshake.mjs` — launched via `bin/handshake` (Node shebang).
- Service operator bootstrap: `src/cli/service-operator/bootstrap.ts` (command `service bootstrap` in `src/cli/command-manifest.ts`).

**MCP stdio:**
- `src/mcp/stdio/entry.ts` → `dist/bin/handshake-mcp.mjs` — launched via `bin/handshake-mcp`.

**Bundled subpath exports** (`scripts/build-package-bundles.mjs`):
- `./conformance`, `./adapter-sdk`, `./runtime`, `./sdk/role-clients`, `./cli`, `./mcp`, `./x402-protected-tool`, `./surfaces/a2a-negotiation-readback`, `./experimental`.

**Canonical modules without current npm subpath bundles:**
- `src/hosted-admission/` — provider-neutral hosted admission contracts (`src/hosted-admission/index.ts`); HTTP shims re-export from `src/http/admission/hosted-*.ts`. Architecture test `test/architecture/manifest-coverage.test.ts` expects `./hosted-admission` in `package.json#exports`, but that subpath is **absent** from current `package.json` (and has no bundle row in `build-package-bundles.mjs`).
- `src/surfaces/service-workflow-admission/` — same export gap for `./surfaces/service-workflow-admission`.

## Phase 04+05 structural additions

**FailureClass taxonomy:**
- `src/protocol/foundation/failure-class/index.ts` — enum classes: `auth`, `hosted_admission`, `protected_action_refusal`, `proof_gap`, `replay_refusal`, `stale_admission`, `internal`.
- Wired into HTTP transition errors via `src/http/errors/transition-error-envelope.ts` (`TransitionFailureClassSchema`, `classifyFailureClassFromProtocolError`).

**Integrator parity (formerly “Tier 1” transitions):**
- Transition IDs: `integratorParityTransitionIds` in `src/protocol/navigation/index.ts` (11 catalog/install/runtime/policy/gateway transitions).
- HTTP/SDK parity tests: `test/architecture/integrator-parity.test.ts`.
- Operator appendix: `docs/internal/integrator-parity-transitions.md`.

**Service operator CLI lane:**
- Renamed from `src/cli/service/` → `src/cli/service-operator/` (`bootstrap.ts`, exported from `src/cli/index.ts`).
- Example recipe: `examples/service-operator-bootstrap/run.ts`.

**HTTP mutation route manifest:**
- Frozen POST transition inventory: `src/http/mutation-route-manifest.ts` (parity with `transitionRouteDefinitions` in `src/http/routes/transition-route-registry.ts`).

**x402 gateway-held custody (D-64):**
- `assertGatewayHeldSigningCommand()` in `src/adapters/x402-payment/wallet-gateway.ts` — enforces `credentialMaterialPosture: "gateway_held_redacted"` with gate-bound credential resolution evidence before signing.

## Platform Requirements

**Development:**
- Node.js `>=20` for installed CLI/MCP binaries.
- Bun `1.3.9` (or compatible) for `bun install`, `bun test`, and bundle build.
- Wrangler CLI for Worker local dev when exercising `src/http/` against D1/KV bindings.

**Production:**
- Cloudflare Workers deployment with D1 (`DB`) for durable protocol state (`src/http/store/resolution.ts` → `D1ProtocolStore` in `src/storage/d1/index.ts`).
- Optional KV (`CACHE`) for isolation snapshot cache (`src/storage/kv/index.ts`); D1 remains source of truth per `migrations/0001_protocol_kernel.sql` header comment.
- npm registry publication of `handshake-protocol-kernel` at version `0.2.7` (package name in `package.json`; MCP name `io.github.CreasyBear/handshake-protocol-kernel` in `server.json`).

**Distribution surfaces (non-authority):**
- npm package exports — curated subpaths in `package.json#exports` (root, `./conformance`, `./adapter-sdk`, `./runtime`, `./sdk/role-clients`, `./cli`, `./mcp`, `./x402-protected-tool`, `./surfaces/a2a-negotiation-readback`, `./experimental`).
- MCP Registry metadata — `server.json` declares stdio transport via npm package; **registry discoverability remains a proof gap** until registry acceptance/lookup is verified (`docs/internal/decisions.md` D-244).

---

*Stack analysis: 2026-05-29*
