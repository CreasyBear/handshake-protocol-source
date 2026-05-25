# Technology Stack

**Analysis Date:** 2026-05-25

## Protocol Kernel Shape

**Current package:**
- `handshake-protocol-kernel@0.2.7` in `package.json`.
- MCP package name is `io.github.CreasyBear/handshake-protocol-kernel` in `package.json` and `server.json`.
- Runtime requirement is Node.js `>=20` in `package.json`; the current local shell reports `node --version` as `v25.2.1`.

**Kernel boundary:**
- The source-owned protocol kernel lives under `src/protocol/`. Its transition facade is `src/protocol/kernel.ts`.
- The kernel records exact contracts, policy decisions, one-use greenlights, gateway checks, receipts, refusals, proof gaps, isolation, recovery, review binding, generated-execution evidence, delegated-authority evidence, gateway-credential evidence, and terminal `AuthorityCertificate` evidence.
- Product surfaces live outside protocol meaning: `src/cli/`, `src/mcp/`, `src/sdk/`, `src/runtime/`, `src/adapters/`, `src/x402-protected-tool/`, and `examples/`. These surfaces may expose proposal, readiness, redacted readback, demos, or host activation artifacts, but they must not create authority unless they call the protocol and gateway path.

**Authority sequence:**
- Runtime or generated execution evidence is recorded by `src/protocol/areas/runtime-evidence/`, `src/protocol/areas/generated-execution-graph/`, and `src/protocol/areas/tool-call-draft/`.
- Intent compilation and exact contract proposal live in `src/protocol/areas/intent-compilation/` and `src/protocol/areas/action-contract/`.
- Policy and one-use greenlights live in `src/protocol/areas/policy-greenlight/`.
- Gateway enforcement lives in `src/protocol/areas/gateway-gate/`; mutation-capable reference adapters use `verifiedGatewayCheckFromResult()` from `src/protocol/areas/gateway-gate/`.
- Reconstruction lives in `src/protocol/events/`, `src/protocol/evidence-projections/`, `src/protocol/areas/receipt-export/`, `src/protocol/areas/proof-gap/`, and `src/protocol/areas/authority-certificate/`.

**Passport / admission / service gateway / principal-agent link:**
- There is no standalone `Passport` primitive in tracked source. Do not add one unless it reduces ambiguity more than the current typed records.
- HTTP caller admission is transport custody in `src/http/admission/`; it authenticates transition callers and read entitlements, not protected-action authority.
- The protected-action principal-agent link is `principalId`, `agentId`, and evidence-only `participantIdentityBindings` on `OperatingEnvelopeSchema` in `src/protocol/areas/catalog-envelope/schemas.ts`, then copied into `ActionContractSchema` in `src/protocol/areas/action-contract/schemas.ts`.
- Attempt authority is represented by `DelegatedAuthorityRefSchema` in `src/protocol/areas/delegated-authority/schemas.ts`; it records principal/agent/runtime/envelope/gateway scoped bounds and can be revoked or expired into isolation, but it is not a greenlight.
- Service gateway authority is represented by `GatewayRegistryEntrySchema` in `src/protocol/areas/catalog-envelope/schemas.ts`, `GatewayCredentialRefSchema` and `GatewayCustodyProofPacketSchema` in `src/protocol/areas/credential-custody/schemas.ts`, and the final `gatewayCheck()` transition in `src/protocol/kernel.ts`.

## Languages

**Primary:**
- TypeScript 6.0.3 - All source, tests, examples, protocol schemas, HTTP routes, SDK clients, CLI, MCP server, adapters, and storage implementations under `src/`, `test/`, and `examples/`.

**Secondary:**
- JavaScript ESM - Build and package verification scripts under `scripts/`, including `scripts/build-package-bundles.mjs`, `scripts/check-package-surface.mjs`, `scripts/check-published-entrypoints.mjs`, and `scripts/check-release-proof.mjs`.
- SQL - Cloudflare D1 schema in `migrations/0001_protocol_kernel.sql`.
- Markdown - Canonical repo docs in `README.md`, `AGENTS.md`, `QUALITY.md`, `STRUCTURE.md`, and `docs/internal/*.md`; example docs under `examples/*/README.md`.
- TOML/JSON/YAML - Worker config in `wrangler.toml`, package metadata in `package.json`, MCP Registry metadata in `server.json`, TypeScript config in `tsconfig.json`, formatting/lint config in `.prettierrc.json` and `eslint.config.js`, and CI in `.github/workflows/check.yml`.

## Runtime

**Environment:**
- Node.js `>=20` - Required by `package.json#engines`; Node ESM bundles are executed by `bin/handshake` and `bin/handshake-mcp`.
- Bun `1.3.9` - Declared in `package.json#packageManager`, present in `bun.lock`, used by `.github/workflows/check.yml`, used for tests and bundling.
- Cloudflare Workers - Worker entrypoint is `src/worker.ts`; `wrangler.toml` points `main` to that file.

**Package Manager:**
- Bun `1.3.9` - Primary install/test package manager.
- npm `11.7.0` observed locally - Used by `package.json#scripts` and package checks such as `npm pack --dry-run --json`.
- Lockfile: `bun.lock` present.

## Frameworks

**Core:**
- `hono` ^4.12.19 - HTTP/Worker app and route dispatch in `src/http/app.ts`.
- Cloudflare Workers + Wrangler ^4.92.0 - Deployment/runtime target configured by `wrangler.toml`; Worker/D1/KV types supplied by `@cloudflare/workers-types`.
- `zod` ^4.4.3 - Runtime validation and schema backbone across `src/protocol/**`, `src/http/**`, `src/runtime/**`, `src/adapters/**`, `src/cli/**`, `src/mcp/**`, and `src/x402-protected-tool/**`.
- MCP TypeScript SDK 2.0.0-alpha.2 - Local stdio MCP server/client proof in `src/mcp/stdio/server.ts`, `src/mcp/stdio/process-proof.ts`, and `scripts/check-published-entrypoints.mjs`.
- x402 SDK 2.12.0 - Official buyer-side exact payment evidence/signing path in `src/adapters/x402-payment/upstream-evidence.ts`, `src/adapters/x402-payment/action-proposal.ts`, and `src/adapters/x402-payment/wallet-gateway.ts`.

**Testing:**
- Bun test - Test runner via `package.json#scripts.test`.
- TypeScript compiler - Type gate via `npm run check:types` and `npm run typecheck`.
- Architecture and claim tests - Focused repo-boundary tests under `test/architecture/`.

**Build/Dev:**
- TypeScript declarations - `npm run build:types` runs `tsc -p tsconfig.build.json`.
- Bun bundler - `scripts/build-package-bundles.mjs` bundles package entrypoints and bins into `dist/`.
- ESLint 10.4.0 + `typescript-eslint` 8.59.4 - Linting configured by `eslint.config.js`.
- Prettier 3.8.3 - Formatting configured by `.prettierrc.json`.
- Wrangler - `npm run dev` runs `wrangler dev`.

## Key Dependencies

**Critical:**
- `zod` ^4.4.3 - Defines strict protocol, adapter, MCP, CLI, hosted admission, and evidence schemas.
- `hono` ^4.12.19 - Owns HTTP routing for `/health`, `/openapi.json`, transition routes, evidence routes, hosted readiness, verifier routes, and internal record reads in `src/http/app.ts`.
- `@x402/core` 2.12.0 - Validates `PaymentRequired` and `PaymentPayload` evidence in `src/adapters/x402-payment/upstream-evidence.ts` and `src/adapters/x402-payment/wallet-gateway.ts`.
- `@x402/evm` 2.12.0 - Provides `ExactEvmScheme` and `ClientEvmSigner` for gateway-held exact EVM signing in `src/adapters/x402-payment/wallet-gateway.ts`.
- `@modelcontextprotocol/server` 2.0.0-alpha.2 - Builds `handshake-mcp` local stdio server in `src/mcp/stdio/server.ts`.
- `@modelcontextprotocol/client` 2.0.0-alpha.2 - Verifies the local MCP process in `src/mcp/stdio/process-proof.ts` and `scripts/check-published-entrypoints.mjs`.

**Infrastructure:**
- `@cloudflare/workers-types` ^4.20260517.1 - Worker, D1, and KV TypeScript bindings used by `src/http/app-options.ts`, `src/storage/d1/index.ts`, and `src/storage/kv/index.ts`.
- `wrangler` ^4.92.0 - Cloudflare Worker local development and deployment CLI.
- `typescript` ^6.0.3 - Strict source checking with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` in `tsconfig.json`.
- `eslint` ^10.4.0 and `typescript-eslint` ^8.59.4 - Type import, unused variable, and console discipline in `eslint.config.js`.
- `prettier` ^3.8.3 - Formatting for source, docs, and generated example outputs.
- `@x402/fetch` 2.12.0 - Dev/test fixture dependency used by `test/conformance/x402-upstream-exact-fixtures.test.ts`.
- `@types/bun` ^1.3.14 - Bun type support for tests, scripts, and examples.
- `@cfworker/json-schema` ^4.1.1 - Listed in `package.json`; no active source import detected under `src/`, `test/`, `scripts/`, or `examples/`.

## Configuration

**Environment:**
- Worker D1 binding `DB` and KV binding `CACHE` are declared in `wrangler.toml`.
- Local bearer transition admission reads `HANDSHAKE_CONTROL_PLANE_TOKEN`, `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`, `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`, and `HANDSHAKE_REVIEW_CUSTODY_TOKEN` in `src/http/admission/caller-auth.ts`.
- Hosted admission is configured through `AppOptions.authMode`, `AppOptions.hostedAdmissionConfig`, and `AppOptions.hostedCallerVerifier` in `src/http/app-options.ts`; provider strategy values are schema-only in `src/http/admission/hosted-admission-config.ts`.
- CLI local project state uses `.handshake/project.json` and external local state refs managed by `src/cli/local-project/index.ts`.
- `.env`, `.env.local`, `.env.*.local`, `.dev.vars`, `*.pem`, and `*.key` are ignored by `.gitignore`. No `.env*` file contents were read.

**Build:**
- `tsconfig.json` targets `ES2022`, uses `module: ESNext`, `moduleResolution: Bundler`, `lib: ["ES2022", "WebWorker"]`, strict checking, Worker/Bun types, and `outDir: dist`.
- `tsconfig.build.json` emits declarations only from `src/` into `dist/`.
- `scripts/build-package-bundles.mjs` bundles package entrypoints: `src/index.ts`, `src/conformance/index.ts`, `src/adapter-sdk/index.ts`, `src/surfaces/index.ts`, `src/runtime/index.ts`, `src/sdk/surface-clients/index.ts`, `src/cli/index.ts`, `src/mcp/index.ts`, `src/x402-protected-tool/index.ts`, `src/experimental.ts`, `src/cli/main.ts`, and `src/mcp/stdio/entry.ts`.
- `eslint.config.js` ignores `dist/**`, `coverage/**`, `node_modules/**`, and `docs/internal/archive/**`; it enforces consistent type imports, unused-var cleanup, and no `console` except `warn` and `error`.
- `.prettierrc.json` sets `printWidth: 120`, semicolons, double quotes, and trailing commas.

## Package Surface

**npm package:**
- Package name/version: `handshake-protocol-kernel` `0.2.7` in `package.json`.
- License: Apache-2.0 in `package.json`, with package files `LICENSE` and `NOTICE`.
- Published allowlist is `bin`, `dist`, `server.json`, `README.md`, `CHANGELOG.md`, `LICENSE`, and `NOTICE` in `package.json#files`.
- `scripts/check-package-surface.mjs` rejects packaged `.planning/`, `.agents/`, `skills-lock.json`, `src/`, `test/`, `scripts/`, `examples/`, `migrations/`, `docs/internal/`, old docs trees, root canon files such as `AGENTS.md`, `QUALITY.md`, `STRUCTURE.md`, and `bun.lock`.

**Exports:**
- `.` -> root protocol/HTTP/SDK curated API from `src/index.ts`.
- `./conformance` -> reference conformance checks from `src/conformance/index.ts`.
- `./adapter-sdk` -> definition-only adapter pack surface from `src/adapter-sdk/index.ts`.
- `./runtime` -> proposal-only runtime ingress surface from `src/runtime/index.ts`.
- `./sdk/role-clients` -> role-scoped clients from `src/sdk/surface-clients/index.ts`.
- `./cli` -> CLI helper surface from `src/cli/index.ts`.
- `./mcp` -> MCP catalog/resource/proposal surface from `src/mcp/index.ts`.
- `./x402-protected-tool` -> normal-agent-tool facade, readiness, host profile, and activation artifacts from `src/x402-protected-tool/index.ts`.
- `./experimental` -> explicit reference adapter exports from `src/experimental.ts`.

**Bins:**
- `handshake` -> `bin/handshake` -> `dist/bin/handshake.mjs`; local operator/evidence CLI.
- `handshake-mcp` -> `bin/handshake-mcp` -> `dist/bin/handshake-mcp.mjs`; local stdio MCP proposal/evidence server.
- `handshake-protocol-kernel` -> `bin/handshake-mcp`; package-name execution alias for MCP hosts.

## Protocol Product Surfaces

**CLI:**
- Command manifest lives in `src/cli/command-manifest.ts`.
- Active commands include `schema`, `init`, `doctor`, `evidence aps-report`, `evidence contract-view`, `evidence receipt-timeline`, `cert verify`, `support bundle`, `install x402-payment`, `probes x402-payment`, `register x402-gateway-readiness`, `install health`, and `conformance x402-payment`.
- CLI output is evidence/readiness only. It does not evaluate policy, issue greenlights, perform gateway checks, use signers, mutate protected surfaces, export receipts as authority, or mint terminal certificates.

**MCP:**
- MCP catalog lives in `src/mcp/catalog.ts`.
- The only proposal tool is `handshake.actions.x402_payment.propose`.
- Read-only resources use `handshake://metadata/*`, `handshake://challenges/*`, `handshake://evidence/*`, `handshake://health/*`, and `handshake://certificates/*` in `src/mcp/resources.ts`.
- MCP proposal handling in `src/mcp/x402-proposal.ts` can create runtime evidence, tool-call drafts, intent compilations, and proposed action contracts through a runtime client. It does not evaluate policy, greenlight, gateway-check, mutate, export receipts, mint certificates, or carry credential material.

**SDK:**
- Low-level `HandshakeClient` lives in `src/sdk/client.ts`.
- Role-scoped activation clients live under `src/sdk/surface-clients/`: `InstallClient`, `RuntimeClient`, `ControlPlaneClient`, `PolicyClient`, `GatewayClient`, and `EvidenceClient`.
- Use role-scoped clients for activation code because each class carries one custody role. Avoid teaching new activation paths with the multi-role `HandshakeClient` token map unless the test specifically needs route parity.

## Platform Requirements

**Development:**
- Install dependencies with `bun install --frozen-lockfile`; `.github/workflows/check.yml` uses that command.
- Main repo gate is `npm run check:repo`, which runs `npm run check:types`, `npm run lint`, `npm run format:check`, `npm run test`, `npm run pack:check`, and `git diff --check`.
- Focused gates are `npm run quality:architecture`, `npm run quality:claims`, and `npm run quality:storage`.
- Demo generation commands are `npm run demo:self-hosted`, `npm run demo:aps`, `npm run demo:adapter-sdk`, `npm run demo:x402-tool-profiles`, and `npm run demo:mcp-transcript`.

**Production:**
- HTTP service target is Cloudflare Workers through `src/worker.ts` and `wrangler.toml`.
- Durable reconstruction store is Cloudflare D1 through `src/storage/d1/index.ts` and `migrations/0001_protocol_kernel.sql`.
- KV is cache posture only through `src/storage/kv/index.ts`; it is not durable protocol truth.
- Public package consumers use Node ESM bundles under `dist/` and executable wrappers under `bin/`.
- Public npm availability, MCP Registry metadata, host profiles, and install health do not create authority. The gateway check remains the final enforcement point before consequence.

---

*Stack analysis: 2026-05-25*
