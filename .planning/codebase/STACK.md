# Technology Stack

**Analysis Date:** 2026-05-23

## Scope

This map covers the pre-hosted Tier 2 response and telemetry stack for Handshake v0.0.2. Treat `.planning/` as scratch; canonical product and architecture truth comes from `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/decisions.md`, `docs/internal/protocol-notes.md`, `docs/internal/protocol-definition.md`, and `docs/internal/protocol-kernel-architecture.md`.

Evidence notes in this document are grounded in source, tests, demos, scripts, and config files under the repository root. The stack is a local TypeScript protocol kernel plus reference HTTP, SDK, CLI, MCP, adapter, storage, and demo surfaces; it is not a hosted enforcement service.

## Languages

**Primary:**
- TypeScript 6.0.3 - protocol kernel, HTTP routes, SDK clients, runtime ingress, adapters, CLI, MCP reference surfaces, storage implementations, and tests in `src/`, `test/`, and `examples/`; declared in `package.json` and configured by `tsconfig.json`.

**Secondary:**
- JavaScript ESM - package surface validation and generated package checks in `scripts/check-package-surface.mjs`; the package is `"type": "module"` in `package.json`.
- SQL - Cloudflare D1 protocol kernel schema in `migrations/0001_protocol_kernel.sql`.
- Markdown - canonical docs in `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/decisions.md`, `docs/internal/protocol-notes.md`, `docs/internal/protocol-definition.md`, and `docs/internal/protocol-kernel-architecture.md`; demo markdown artifacts in `examples/x402-protected-spend/output/` and `examples/mcp-reference-transcript/output/`.

## Runtime

**Environment:**
- Bun 1.3.9 - package manager, script runner, and test runner; declared by `"packageManager": "bun@1.3.9"` in `package.json` and used by `.github/workflows/check.yml`.
- TypeScript strict runtime assumptions - ES2022 target, ESNext modules, Bundler resolution, DOM/WebWorker/Bun libs, `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes` in `tsconfig.json`.
- Cloudflare Workers runtime - reference HTTP Worker entry at `src/worker.ts`, Hono app at `src/http/app.ts`, and Worker bindings in `wrangler.toml`.
- Web platform APIs - fetch-style HTTP, `Headers`, `URL`, and WebCrypto-style digest/signature operations appear across HTTP, SDK, x402, certificate, and demo code including `src/sdk/surface-clients/transport.ts`, `src/protocol/authority-certificate.ts`, and `examples/x402-protected-spend/run.ts`.

**Package Manager:**
- Bun 1.3.9 - primary install path from `README.md` and `.github/workflows/check.yml`.
- Lockfile: `bun.lock` present.
- npm CLI - required by `scripts/check-package-surface.mjs` for `npm pack --dry-run --json`; `npm` scripts in `package.json` invoke TypeScript, lint, tests, builds, demos, and quality gates.

## Frameworks

**Core:**
- Hono ^4.12.19 - HTTP route dispatch, route registry mounting, health/openapi endpoints, and Worker fetch app in `src/http/app.ts` and `src/worker.ts`.
- Zod ^4.4.3 - protocol, HTTP, CLI, MCP, SDK, storage, x402, and projection schema validation throughout `src/protocol/`, `src/http/`, `src/cli/`, `src/mcp/`, `src/runtime/`, and `src/adapters/`.
- Cloudflare Workers/D1/KV - reference durable HTTP runtime bindings in `wrangler.toml`, D1 store in `src/storage/d1/index.ts`, D1 SQL schema in `migrations/0001_protocol_kernel.sql`, and KV isolation cache in `src/storage/kv/index.ts`.
- x402 SDK packages 2.12.0 - official exact buyer-side source basis in `@x402/core`, `@x402/evm`, and dev test package `@x402/fetch`; used by `src/adapters/x402-payment/upstream-evidence.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, and x402 conformance tests under `test/conformance/`.

**Testing:**
- Bun test - test runner invoked by `npm run test` in `package.json`; tests live under `test/`.
- TypeScript compiler - `npm run check:types` uses `tsc -p tsconfig.json --noEmit`; `npm run build` uses `tsc -p tsconfig.build.json`.
- ESLint 10.4.0 with typescript-eslint - configured in `eslint.config.js`; invoked by `npm run lint`.
- Prettier 3.8.3 - formatting gate from `npm run format:check`; ignore rules in `.prettierignore`.

**Build/Dev:**
- TypeScript declaration build - `tsconfig.build.json` emits declarations only into `dist/`; package export checks expect `dist/index.d.ts`, `dist/conformance/index.d.ts`, `dist/runtime/index.d.ts`, `dist/sdk/surface-clients/index.d.ts`, and `dist/experimental.d.ts` in `scripts/check-package-surface.mjs`.
- Wrangler ^4.92.0 - local Worker development via `npm run dev`; Cloudflare binding config in `wrangler.toml`.
- npm pack dry-run - `npm run pack:check` runs `node scripts/check-package-surface.mjs`; the script verifies package exports and forbids `.planning/`, tests, agent metadata, and deleted docs from the package tarball.

## Key Dependencies

**Critical:**
- `zod` ^4.4.3 - every transition, projection, adapter, CLI, MCP, and SDK response surface relies on explicit schemas; examples include `src/protocol/evidence-projections/schemas.ts`, `src/http/errors/transition-error-envelope.ts`, `src/cli/output.ts`, and `src/mcp/output.ts`.
- `hono` ^4.12.19 - reference HTTP route surface, admission checks, evidence reads, transition routes, and Worker app in `src/http/app.ts`.
- `@x402/core` 2.12.0 - official x402 payment-required parsing, client construction, and schema validation in `src/adapters/x402-payment/upstream-evidence.ts` and `src/adapters/x402-payment/wallet-gateway.ts`.
- `@x402/evm` 2.12.0 - official `exact` EVM signing surface used by `src/adapters/x402-payment/wallet-gateway.ts`.

**Infrastructure:**
- `@cloudflare/workers-types` ^4.20260517.1 - Worker/D1/KV typing for `src/worker.ts`, `src/http/`, and `src/storage/`.
- `wrangler` ^4.92.0 - Cloudflare local dev and binding runtime from `wrangler.toml`.
- `typescript-eslint` ^8.59.4 and `eslint` ^10.4.0 - source quality gate in `eslint.config.js`.
- `@types/bun` ^1.3.14 - Bun API typings for tests, scripts, and examples.
- `@x402/fetch` 2.12.0 - dev/test dependency for x402 integration and conformance coverage in `test/conformance/` and `test/integration/`.

## Package Surface

**Package identity:**
- `package.json` declares private package `handshake-protocol-kernel` version `0.2.4`; it is not published as a hosted service.

**Exports:**
- `.` -> `src/index.ts` and `dist/index.d.ts`, the core protocol surface.
- `./conformance` -> `src/conformance/index.ts` and `dist/conformance/index.d.ts`, conformance helpers.
- `./runtime` -> `src/runtime/index.ts` and `dist/runtime/index.d.ts`, runtime ingress schemas and proposal helpers.
- `./sdk/role-clients` -> `src/sdk/surface-clients/index.ts` and `dist/sdk/surface-clients/index.d.ts`, the recommended role-scoped SDK surface.
- `./experimental` -> `src/experimental.ts` and `dist/experimental.d.ts`, experimental exports.
- `./package.json` -> metadata only.

**Package exclusions:**
- `scripts/check-package-surface.mjs` rejects `.planning/`, `.agents/`, tests, old docs paths, skills lock files, and scratch metadata from `npm pack --dry-run`.

## Configuration

**Environment:**
- HTTP role custody uses bearer tokens configured through Worker env or app options: `HANDSHAKE_CONTROL_PLANE_TOKEN`, `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`, `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`, and `HANDSHAKE_REVIEW_CUSTODY_TOKEN`; enforcement lives in `src/http/admission/caller-auth.ts`.
- HTTP requests must provide `X-Handshake-Protocol-Version` and `X-Handshake-Request-Identity`; optional `X-Handshake-Originating-Identity` is constrained to a digest or `ref:` pointer by `src/http/admission/request-context.ts`.
- Cloudflare bindings are declared in `wrangler.toml`: D1 binding `DB` and KV binding `CACHE`.
- No `.env*` file was detected by the mapper's repository-root scan; env files must not be read if added later.

**Build:**
- `package.json` - scripts, dependencies, package exports, package manager.
- `tsconfig.json` - strict source and test typechecking.
- `tsconfig.build.json` - declaration-only build to `dist/`.
- `eslint.config.js` - TypeScript linting and console restrictions.
- `.prettierrc.json` - formatting preferences.
- `wrangler.toml` - Worker entry and Cloudflare bindings.
- `.github/workflows/check.yml` - CI gate with Bun install and `npm run check:repo`.
- `migrations/0001_protocol_kernel.sql` - D1 storage schema.

## Commands And Test Gates

**Setup:**
```bash
bun install --frozen-lockfile
```

**Primary quality gate:**
```bash
npm run check:repo
```

`npm run check:repo` runs `check:types`, `lint`, `format:check`, `test`, `pack:check`, and `git diff --check` from `package.json`.

**Focused gates:**
```bash
npm run check:types
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
npm run pack:check
npm run quality:architecture
npm run quality:storage
npm run quality:claims
```

**Demos and response artifacts:**
```bash
npm run demo:aps
npm run demo:mcp-transcript
```

`npm run demo:aps` executes `examples/x402-protected-spend/run.ts` and refreshes `examples/x402-protected-spend/output/latest.json` plus `examples/x402-protected-spend/output/latest.md`. `npm run demo:mcp-transcript` executes `examples/mcp-reference-transcript/run.ts` and refreshes `examples/mcp-reference-transcript/output/latest.json` plus `examples/mcp-reference-transcript/output/latest.md`.

**Local Worker dev:**
```bash
npm run dev
```

`npm run dev` invokes `wrangler dev` against `src/worker.ts` and `wrangler.toml`.

## Response And Telemetry Stack

**SDK role clients:**
- `src/sdk/surface-clients/runtime-client.ts` exposes only runtime evidence creation, tool-call draft transitions, intent compilation, and action-contract proposal calls; it does not expose policy, greenlight, gateway, receipt, or certificate minting.
- `src/sdk/surface-clients/evidence-client.ts` exposes redacted evidence reads and local AuthorityCertificate verification; it does not mint certificates or call protected mutation routes.
- `src/sdk/surface-clients/transport.ts` enforces a single role credential, protocol-version header, request identity header, optional originating identity header, and `TransitionErrorResponseSchema` parsing.
- `test/sdk/role-clients.test.ts` asserts narrow exports, no fallback transition-token maps, GET-only evidence reads, and no runtime authority methods.
- `src/sdk/client.ts` is a low-level route-parity client for tests and internal references; it still exposes role/transition-token driven calls across runtime, control-plane, gateway, and review routes and is not the recommended activation surface.

**CLI response envelopes and support bundles:**
- `src/cli/output.ts` defines `handshake.cli.v1` envelopes with non-authority flags set false for authority creation, greenlights, gateway checks, mutations, raw internal records, credential material, mutation commands, receipt exports, and AuthorityCertificate minting.
- `src/cli/command-manifest.ts` marks every command with `childProcessEnvInheritance: "none"` and command-level non-goals; support bundle commands are explicitly non-mutating and non-authoritative.
- `src/cli/support-bundle.ts` accepts caller-supplied redacted projections and local posture records, records omitted raw materials, and omits `PAYMENT-SIGNATURE`, `PaymentPayload`, private keys, role tokens, request bodies, gateway credential material, mutation commands, raw records, and receipt exports.
- `test/cli/cli-support-bundle.test.ts` validates support bundle redaction and omission behavior.
- `src/cli/local-project/index.ts` writes local `.handshake/project.json` metadata plus external token-reference placeholders and trust bundle refs; it does not create or print credential values.
- `test/cli/cli-local-project.test.ts` checks that local project init and doctor output do not leak secret values and flag unsafe token storage posture.

**MCP reference transcript and resources:**
- `src/mcp/catalog.ts` exposes read-only resource templates and one proposal tool, `handshake.actions.x402_payment.propose`; the catalog denies parallel tool calls and does not expose credentials, raw records, mutation commands, receipt export, or cert minting.
- `src/mcp/x402-proposal.ts` gates x402 proposal shaping on fresh metadata, stable tools list, install readiness, gateway availability, amount bounds, schema validity, and idempotency posture before calling the role-scoped runtime client.
- `src/mcp/resources.ts` routes `handshake://` resource reads to the evidence client or reference metadata/challenge/certificate responses and marks resources read-only.
- `src/mcp/reference-transcript.ts` builds the source-owned transcript with valid proposal, readback, stale metadata, tool-list drift, install-not-ready, gateway-offline, mismatch, replay, raw sibling bypass, and downstream proof-gap cases.
- `test/mcp/mcp-reference-transcript.test.ts` validates non-authority posture and hostile transcript cases.
- `test/mcp/mcp-resource-redaction.test.ts` validates MCP evidence read redaction and reference-only metadata/challenge/certificate resources.

**Runtime ingress:**
- `src/runtime/ingress/index.ts` supports wrapped, raw sibling, and ambiguous package-install plus x402-payment dispatches; it creates runtime execution evidence, generated graphs, finalized drafts, intent compilations, and action-contract proposals only for clean eligible dispatches.
- `src/runtime/package-install/action-proposal.ts` compiles package install candidate parameters and idempotency keys.
- `src/adapters/x402-payment/action-proposal.ts` compiles x402 exact payment candidates from official evidence, per-call amount bounds, request digests, selected payment requirement digest, SDK package versions, and payment identifier posture.
- `test/runtime/runtime-ingress.test.ts` validates bypass and ambiguity evidence, no authority creation, dynamic/late-bound refusals, loop/retry sequence handling, oversized dispatch-block rejection, and x402 retry/idempotency posture.

**x402 adapter:**
- `src/adapters/x402-payment/install-proposal.ts` defines the official first-wedge adapter pack `adapter_pack_x402_payment_exact`, action family `x402_payment.exact`, protected surface `x402_payment`, required bypass probes, gateway signer custody posture, and non-enforced Tier 1 spend-window metadata.
- `src/adapters/x402-payment/upstream-evidence.ts` parses official x402 V2 payment-required payloads for the `exact` scheme and records refs/digests rather than raw payment material.
- `src/adapters/x402-payment/wallet-gateway.ts` creates `PaymentPayload` and `PAYMENT-SIGNATURE` only after a verified protocol gateway check and records downstream success, failure, or proof gap evidence.
- `src/adapters/x402-payment/conformance.ts` rejects or marks unsupported surfaces including `upto`, batch settlement, lifecycle hooks, MCP auto-pay, signed offers, signed receipts, seller middleware, and facilitator operation.
- `test/conformance/x402-payment-conformance.test.ts`, `test/conformance/x402-upstream-exact-fixtures.test.ts`, and `test/integration/x402-d1-http.test.ts` cover official SDK source basis, D1/HTTP x402 exact flow, signer custody, mismatch/replay refusals, proof gaps, and redaction.

**Package, repo, and preview reference adapters:**
- `src/adapters/package-install/gateway.ts` requires gateway verification before invoking `applyPackageInstall`; it binds package, version, manager, registry, workspace, manifest, lockfile, install flags, lifecycle policy, and resolved material.
- `src/adapters/repo-write/gateway.ts` computes content digest and byte length, performs gateway verification, and only then applies repo writes.
- `src/adapters/preview-deploy/gateway.ts` performs gateway verification before preview creation and records downstream uncertainty as proof gaps.
- `src/adapters/downstream-failure-evidence.ts` redacts or digests provider diagnostics for failure evidence.
- `test/adapters/package-install-gateway.test.ts`, `test/adapters/repo-write-gateway.test.ts`, `test/adapters/preview-deploy-gateway.test.ts`, `test/integration/package-install-end-to-end.test.ts`, and `test/integration/repo-write-d1-http.test.ts` cover no-mutation refusal paths, proof gaps, replay/mismatch posture, and receipt recovery.

**HTTP routes and evidence projections:**
- `src/http/app.ts` hosts health, OpenAPI, state-changing transition routes, redacted evidence reads, and internal raw-record read attempts with body-size and admission checks.
- `src/http/routes/transition-route-registry.ts` registers role-scoped transitions for runtime evidence, control plane, gateway custody, and review custody.
- `src/http/routes/evidence-read-route-registry.ts` exposes redacted evidence projections to `review_custody` and `runtime_evidence`.
- `src/http/handlers/evidence-read.ts` projects generated graphs, contract views, agent transaction envelopes, idempotency recovery, receipt timelines, and protected-path install health.
- `src/http/handlers/internal-record-read.ts` requires control-plane custody and still blocks `internal_only` raw reads.
- `src/http/errors/transition-error-envelope.ts` shapes typed transition errors with transition name, custody role, retryability, commit state, request identity, proof/refusal refs, and validation issues.
- `src/protocol/evidence-projections/projections.ts` redacts contract parameters, secret refs, payment signatures, raw payment payloads, credential-looking refs, raw receipt evidence, and raw internal records.
- `test/http/http.test.ts` and `test/http/d1-http.test.ts` validate auth, fail-closed durable store posture, oversized body handling, raw-read blocks, D1 conflict semantics, receipt timelines, gateway checks, and storage recovery.

**Storage:**
- `src/storage/d1/index.ts` implements durable protocol commits, gateway commits, greenlight issuance/consumption, idempotency ledger, isolation pointers, protected-path posture, receipt indexes, and stream events over D1.
- `migrations/0001_protocol_kernel.sql` declares D1 tables for records, stream events, greenlight consumption/issuance, idempotency, recovery terminal claims, protected-path posture, isolation state, protected-surface operation claims, and receipt indexes.
- `src/storage/memory/index.ts` mirrors protocol-store semantics in memory for tests and demos with explicit conflict classifications.
- `src/storage/kv/index.ts` stores only isolation-state snapshots in KV and cannot become the authority source.
- `src/http/store/resolution.ts` chooses D1 when `DB` exists, otherwise an injected/fallback store, otherwise fail-closed `durable_store_unavailable` for state-changing endpoints.

## Generated Artifacts

**Build artifacts:**
- `dist/` declarations are generated by `npm run build`; `scripts/check-package-surface.mjs` expects declaration outputs for each exported package surface and rejects scratch/internal test artifacts from the package.

**Demo artifacts:**
- `examples/x402-protected-spend/output/latest.json` and `examples/x402-protected-spend/output/latest.md` are generated by `examples/x402-protected-spend/run.ts`; the demo uses the role-scoped SDK surface and local reference store, not hosted custody.
- `examples/mcp-reference-transcript/output/latest.json` and `examples/mcp-reference-transcript/output/latest.md` are generated by `examples/mcp-reference-transcript/run.ts`; the transcript is a source-owned reference harness, not an external MCP host transcript.

**Local CLI artifacts:**
- `.handshake/project.json` can be generated by `src/cli/local-project/index.ts` for local project metadata.
- Role token placeholder refs and trust bundle refs are generated under an external state root by `src/cli/local-project/index.ts`; token values are not created or printed by the CLI.

## Platform Requirements

**Development:**
- Bun 1.3.9 with lockfile install: `bun install --frozen-lockfile`.
- npm CLI available for `npm run` scripts and `npm pack --dry-run` in `scripts/check-package-surface.mjs`.
- TypeScript, ESLint, Prettier, Bun test, and package surface gates from `package.json`.
- Optional Wrangler local dev for `src/worker.ts`.

**Production:**
- No hosted production deployment is claimed by this repository.
- Reference Worker deployment requires Cloudflare Worker compatibility date `2026-05-17`, D1 binding `DB`, KV binding `CACHE`, and role custody tokens configured outside source as declared in `wrangler.toml` and `src/http/admission/caller-auth.ts`.
- D1 is the durable reconstruction store for the reference HTTP runtime; memory storage is a fixture/demo implementation, and KV is cache-only posture for isolation snapshots.

## Pre-Hosted Limitations And Non-Claims

- Hosted operation is not implemented or claimed; `README.md`, `docs/internal/decisions.md`, `docs/internal/protocol-notes.md`, and `docs/internal/protocol-definition.md` define the repository as a local/reference protocol kernel.
- Runtime ingress is observer/compiler evidence only; `src/runtime/ingress/index.ts` emits candidates/refusals/bypass evidence but does not issue greenlights, gateway checks, mutations, receipts, or certificates.
- The CLI is a local evidence, posture, verification, and support-bundle surface; `src/cli/output.ts`, `src/cli/command-manifest.ts`, and `src/cli/support-bundle.ts` record non-authority flags and raw-material omissions.
- MCP is a reference transcript and resource/tool surface; `src/mcp/catalog.ts`, `src/mcp/resources.ts`, and `src/mcp/reference-transcript.ts` do not provide hosted MCP custody, policy, gateway, mutation, receipt export, or certificate minting.
- x402 support is the narrow official V2 `exact` buyer-side proof path; `src/adapters/x402-payment/conformance.ts` marks seller middleware, facilitator operation, batch settlement, lifecycle hooks, auto-pay, signed offers, signed receipts, and `upto` semantics unsupported.
- Aggregate spend-window enforcement is not implemented as authority; `src/adapters/x402-payment/install-proposal.ts` labels session/day/review thresholds as `not_enforced_tier1_metadata`.
- Package-install supply-chain evidence binds declared parameters and resolved material digests; `docs/internal/protocol-notes.md` and `src/adapters/package-install/gateway.ts` do not claim external package-material attestation.
- AuthorityCertificate verification is local and pinned/offline; `src/protocol/authority-certificate.ts`, `src/cli/certificate.ts`, and `test/product/x402-protected-spend-demo-report.test.ts` do not claim live JWKS, revocation, hosted verifier operation, or cross-org trust.
- KV cannot become durable authority; `src/storage/kv/index.ts` only caches isolation-state snapshots while `src/storage/d1/index.ts` and `migrations/0001_protocol_kernel.sql` hold reference reconstruction state.

---

*Stack analysis: 2026-05-23*
