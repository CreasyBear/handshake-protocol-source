# Technology Stack

**Analysis Date:** 2026-05-23

## Scope

This refresh is scoped to the Tier 2 surface audit: SDK, CLI, MCP, x402 protected-spend proof surfaces, package/repo/preview adapter fixtures, evidence/readback workflows, package exports, scripts, and validation commands. Canonical repo truth remains `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/decisions.md`, and `docs/internal/protocol-notes.md`; `.planning/` stays scratch context.

## Languages

**Primary:**
- TypeScript 6.0.3 declared in `package.json` - all SDK, CLI, MCP, runtime ingress, adapter, HTTP, protocol, and test code under `src/` and `test/`; strict compiler settings live in `tsconfig.json`.

**Secondary:**
- SQL - Cloudflare D1 protocol schema in `migrations/0001_protocol_kernel.sql`.
- JavaScript ESM - package dry-run guard in `scripts/check-package-surface.mjs`.
- Markdown - canonical docs in `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, and `docs/internal/*`; Tier 2 reference walkthrough docs in `examples/x402-protected-spend/README.md` and `examples/mcp-reference-transcript/README.md`.

## Runtime

**Environment:**
- Bun 1.3.9 - `package.json` declares `packageManager: "bun@1.3.9"`; `.github/workflows/check.yml` installs Bun 1.3.9 and runs `bun install --frozen-lockfile`.
- Cloudflare Workers - Worker entrypoint is `src/worker.ts`; `wrangler.toml` declares `main = "src/worker.ts"`, `compatibility_date = "2026-05-17"`, D1 binding `DB`, and KV binding `CACHE`.
- Web Worker APIs - `tsconfig.json` includes `ES2022` and `WebWorker`; HTTP and SDK code uses `fetch`, `Request`, `Response`, `Headers`, `crypto.randomUUID`, D1, and KV types.

**Package Manager:**
- Bun 1.3.9 - install and tests use Bun; `bun.lock` is present.
- npm - package surface check runs `npm pack --dry-run --json` through `scripts/check-package-surface.mjs`.
- Lockfile: present at `bun.lock`.
- Node version pin: Not detected; no `.nvmrc`, `.node-version`, or `.tool-versions` file is present.

## Frameworks

**Core:**
- Hono `^4.12.19` - Worker-compatible HTTP app in `src/http/app.ts`; transition routes come from `src/http/routes/transition-route-registry.ts`; evidence reads come from `src/http/routes/evidence-read-route-registry.ts`.
- Zod `^4.4.3` - boundary schemas for protocol, HTTP, SDK, CLI, MCP, runtime ingress, adapters, and evidence projections across `src/protocol/**`, `src/http/**`, `src/sdk/**`, `src/cli/**`, `src/mcp/**`, `src/runtime/**`, and `src/adapters/**`.
- TypeScript ESM package boundary - `package.json` uses `"type": "module"` and source-backed exports for `.`, `./conformance`, `./runtime`, `./experimental`, and `./package.json`.

**Testing:**
- Bun test - `package.json` script `test` runs `bun test`; Tier 2 coverage is concentrated in `test/sdk/role-clients.test.ts`, `test/cli/*`, `test/mcp/*`, `test/runtime/runtime-ingress.test.ts`, `test/adapters/*`, `test/integration/x402-d1-http.test.ts`, and `test/product/x402-protected-spend-demo-report.test.ts`.
- `bun:sqlite` - local D1 HTTP harness support is used by `test/support/d1-http-harness.ts`.

**Build/Dev:**
- TypeScript compiler - `npm run check:types` runs `tsc --noEmit --pretty false`; `npm run build` emits declarations from `src` through `tsconfig.build.json`.
- Wrangler `^4.92.0` - `npm run dev` runs `wrangler dev`; local D1/KV binding names are in `wrangler.toml`.
- ESLint 10.4.0 with `typescript-eslint` 8.59.4 - `eslint.config.js` enforces type imports, unused variable policy, and console restrictions for `src/**/*.ts` and `test/**/*.ts`.
- Prettier 3.8.3 - `.prettierrc.json` sets `printWidth: 120`, semicolons, double quotes, and trailing commas.
- npm package dry-run - `scripts/check-package-surface.mjs` rejects `.planning/`, `.agents/`, tests, deleted docs trees, and other non-package paths from the package surface.

## Key Dependencies

**Critical:**
- `@x402/core` 2.12.0 - official x402 V2 `PaymentRequired` validation, payment payload validation, and HTTP client/signature header creation in `src/adapters/x402-payment/upstream-evidence.ts` and `src/adapters/x402-payment/wallet-gateway.ts`.
- `@x402/evm` 2.12.0 - official exact EVM signing scheme used only inside gateway-held signing surface code in `src/adapters/x402-payment/wallet-gateway.ts`.
- `@x402/fetch` 2.12.0 - dev-only official upstream parity fixture in `test/conformance/x402-upstream-exact-fixtures.test.ts` and package-version evidence in x402 proof paths.
- `zod` `^4.4.3` - strict schema enforcement for MCP tool inputs/resources, CLI envelopes, role-scoped SDK responses, runtime ingress dispatches, x402 install/action proposals, and HTTP transition/evidence routes.
- `hono` `^4.12.19` - HTTP transport for the local/Worker protocol API in `src/http/app.ts`.

**Infrastructure:**
- `@cloudflare/workers-types` `^4.20260517.1` - D1, KV, and Worker binding types in `src/http/app-options.ts`, `src/storage/d1/index.ts`, and `src/storage/kv/index.ts`.
- `wrangler` `^4.92.0` - local Worker dev surface through `wrangler.toml`.
- `typescript` `^6.0.3`, `eslint` `^10.4.0`, `typescript-eslint` `^8.59.4`, and `prettier` `^3.8.3` - local quality gates in `package.json`.
- `@types/bun` `^1.3.14` - Bun test and runtime typings for `test/**`.

## Tier 2 Surface Posture

**Boundary manifest:**
- `src/surfaces/boundary-manifest.ts` is the source-owned Tier 2 authority matrix. Active surfaces are `sdk.runtime`, `sdk.evidence`, `cli.operator`, `cli.evidence`, and `mcp.runtime`; deferred surfaces are `sdk.install`, `sdk.gateway`, and `cli.process`.
- Every model/operator surface requires non-authority flags including `authorityCreated: false`, `greenlightCreated: false`, `gatewayCheckPerformed: false`, `mutationAttempted: false`, `rawInternalRecordIncluded: false`, `receiptExportCreated: false`, and `authorityCertificateMinted: false` in `src/surfaces/boundary-manifest.ts`.
- `test/architecture/surface-boundary-posture.test.ts`, `test/architecture/cli-command-posture.test.ts`, and `test/architecture/mcp-surface-posture.test.ts` guard forbidden route families, role-token maps, signer material, raw records, mutation commands, and package/root export drift.

**SDK:**
- `src/sdk/client.ts` remains the low-level HTTP route mirror and root export from `src/index.ts`. It still supports `transitionToken` and `transitionTokens` for local harness/compatibility use; do not use it as the model-facing Tier 2 activation client.
- `src/sdk/surface-clients/runtime-client.ts` is the active role-scoped runtime proposal client. It uses one `runtime_evidence` credential and can call only `/v0.2/runtime-executions`, `/v0.2/tool-call-drafts`, `/v0.2/tool-call-draft-transitions`, `/v0.2/intent-compilations`, and `/v0.2/action-contracts`.
- `src/sdk/surface-clients/evidence-client.ts` is the active role-scoped evidence client. It uses `review_custody` by default, can use scoped `runtime_evidence` readback, reads only redacted evidence projections, and locally verifies a supplied `AuthorityCertificate` without minting certificates.
- `test/sdk/role-clients.test.ts` proves role clients reject token maps/fallback tokens at type level, send one bearer credential, expose no policy/gateway/receipt/certificate mint methods, and keep evidence reads GET-only.
- Friction: role-scoped clients are internal source modules under `src/sdk/surface-clients/` and are not package exports in `package.json`; root export still teaches `HandshakeClient`, which can carry multiple role tokens.

**CLI:**
- `src/cli/command-manifest.ts` declares active commands `schema`, `init`, `doctor`, `evidence.aps-report`, `evidence.contract-view`, `evidence.receipt-timeline`, `cert.verify`, `install.x402-payment`, `probes.x402-payment`, `install.health`, and `conformance.x402-payment`.
- `src/cli/main.ts` is a local source entrypoint. `package.json` has no `bin` field, and `test/architecture/package-surface.test.ts` keeps package exports limited to `.`, `./conformance`, `./runtime`, `./sdk/role-clients`, `./experimental`, and `./package.json`.
- `src/cli/output.ts` wraps command output in `handshake.cli.v1` with explicit non-claims and non-authority flags.
- `src/cli/local-project/index.ts` writes `.handshake/project.json` plus external state refs. It creates role credential placeholder refs, not token values, and `doctor` fails closed on missing, unsafe, symlinked, in-workspace, or stale credential/probe posture.
- `src/cli/x402/index.ts` compiles local x402 install posture and caller-supplied probe classification. It does not register hosted control-plane install records, run a gateway, hold credentials, invoke signers, or mutate protected surfaces.
- Friction: `init`, `install.x402-payment`, and `probes.x402-payment` are not `agentSafe`; `doctor` remains `not_ready` when local probes have `trustedReadiness: false`, even if local classification passes.

**MCP:**
- `src/mcp/catalog.ts` exposes one proposal tool, `handshake.actions.x402_payment.propose`, and read-only resource templates for metadata, challenges, redacted evidence, idempotency/replay evidence, install health, pre-contract install health, and certificate refs.
- `src/mcp/x402-proposal.ts` accepts one strict buyer-side `x402_payment.exact` proposal shape. It refuses unknown/authority-shaped fields, stale metadata, changed tool lists, not-ready install posture, offline/unknown gateway posture, excessive amount bounds, replay, and idempotency mismatch as structured non-authority outcomes.
- `src/mcp/resources.ts` routes contract, envelope, receipt timeline, idempotency, and action-contract-keyed install health through an `EvidenceClient`-compatible interface; metadata, challenge, pre-contract install health, and certificate refs are source/reference payloads, not durable authority evidence.
- `src/mcp/reference-transcript.ts` and `examples/mcp-reference-transcript/run.ts` generate a source-owned reference transcript through `npm run demo:mcp-transcript` covering metadata read, valid proposal, evidence readback, stale metadata, tools list change, install not ready, gateway offline, amount mismatch, parameter mismatch, replay refusal, raw sibling-shaped input, and proof gap.
- Friction: there is no process-hosted MCP server, no package subpath export, no live host credential posture, and `proposeMcpX402Payment()` records `generatedExecutionGraphId: null` with posture `not_exposed_by_role_scoped_runtime_surface`.

**Runtime and adapter proof surfaces:**
- `src/runtime/index.ts` exports only runtime ingress: `RuntimeIngressDispatchBlockSchema`, `RuntimeIngressObservedDispatchSchema`, `proposeRuntimeIngressActionContracts`, and `runtimeIngressDispatchNodeId`.
- `src/runtime/ingress/index.ts` normalizes wrapped/raw/ambiguous package-install and x402 dispatches, creates runtime execution evidence, generated execution graph evidence, tool-call drafts, intent compilations, and action-contract proposals or refusals. It does not issue policy decisions, greenlights, gateway checks, receipts, mutations, or certificates.
- `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, `src/adapters/preview-deploy/gateway.ts`, and `src/adapters/x402-payment/wallet-gateway.ts` are reference gateway fixtures that mutate/sign only after `verifiedGatewayCheckFromResult()` returns a `VerifiedGatewayCheck`.
- `src/experimental.ts` exposes reference gateway runners under explicit experimental names; root exports do not expose those runners.
- Friction: runtime ingress currently covers local x402 payment and package-install dispatch families; repo-write and preview-deploy have runtime proposal helpers and experimental gateway fixtures, but they are not public runtime ingress families.

## Configuration

**Environment:**
- Cloudflare bindings are declared in `wrangler.toml`: D1 `DB` and KV `CACHE`.
- Worker binding types are in `src/http/app-options.ts`: `DB?: D1Database`, `CACHE?: KVNamespace`, plus local bearer token bindings from `src/http/admission/caller-auth.ts`.
- Transition bearer token bindings are `HANDSHAKE_CONTROL_PLANE_TOKEN`, `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`, `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`, and `HANDSHAKE_REVIEW_CUSTODY_TOKEN` in `src/http/admission/caller-auth.ts`.
- `.env` / `.env.*` / `.npmrc` / credential files: Not detected in the root-level scan. Do not read or commit secret values.

**Build:**
- `package.json` defines the local command contract, private package boundary, package exports, demos, and focused quality commands.
- `tsconfig.json` targets ES2022, uses `moduleResolution: "Bundler"`, enables `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`, and includes `src`, `test`, and `worker-configuration.d.ts`.
- `tsconfig.build.json` emits declarations only from `src` into `dist`.
- `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `.github/workflows/check.yml`, and `scripts/check-package-surface.mjs` define lint, format, ignored generated paths, CI gates, and package-surface checks.

## Package Exports

**Current exports in `package.json`:**
- `.` -> `src/index.ts` / `dist/index.d.ts` for the curated root HTTP/protocol/schema/low-level client surface.
- `./conformance` -> `src/conformance/index.ts` / `dist/conformance/index.d.ts` for adapter conformance and x402 first-wedge classification.
- `./runtime` -> `src/runtime/index.ts` / `dist/runtime/index.d.ts` for observer/compiler runtime ingress only.
- `./experimental` -> `src/experimental.ts` / `dist/experimental.d.ts` for reference gateway fixtures and experimental schemas.
- `./package.json` -> package metadata.

**Not exported:**
- `./sdk/role-clients` is the first package-level Tier 2 activation surface for role-scoped runtime/evidence clients. There is still no `./cli` export, no `./mcp` export, and no `bin` entry. `test/architecture/root-exports.test.ts`, `test/architecture/package-surface.test.ts`, and `scripts/check-package-surface.mjs` guard that posture.

## Validation Commands

**Full gate:**
```bash
npm run check:repo
```

**Focused gates:**
```bash
npm run quality:architecture
npm run quality:claims
npm run quality:storage
```

**Tier 2 and proof-surface slices:**
```bash
npm run test -- test/sdk/role-clients.test.ts test/cli/cli-evidence.test.ts test/cli/cli-local-project.test.ts test/cli/cli-x402-install-probes.test.ts
npm run test -- test/mcp/mcp-schema-contract.test.ts test/mcp/mcp-x402-proposal.test.ts test/mcp/mcp-resource-redaction.test.ts test/mcp/mcp-reference-transcript.test.ts
npm run test -- test/runtime/runtime-ingress.test.ts test/adapters/x402-wallet-gateway.test.ts test/integration/x402-d1-http.test.ts
npm run demo:aps
npm run demo:mcp-transcript
```

## Platform Requirements

**Development:**
- Install with `bun install --frozen-lockfile`.
- Run `npm run check:repo` before treating Tier 2 maps as current.
- Use `npm run demo:aps` for the local buyer-readable x402 APS report in `examples/x402-protected-spend/output/latest.md` and `examples/x402-protected-spend/output/latest.json`.
- Use `npm run demo:mcp-transcript` for the source-owned MCP reference transcript in `examples/mcp-reference-transcript/output/latest.md` and `examples/mcp-reference-transcript/output/latest.json`.

**Production:**
- Deployment target is Cloudflare Workers with D1 as durable reconstruction storage and KV as cache posture only; source anchors are `src/worker.ts`, `src/http/app.ts`, `src/storage/d1/index.ts`, `src/storage/kv/index.ts`, `migrations/0001_protocol_kernel.sql`, and `wrangler.toml`.
- Package publication is not configured; `package.json` is `"private": true`.
- The current repository proves a local protocol kernel, local Tier 2 role/proposal/evidence surfaces, and reference gateway fixtures. It does not prove hosted operation, broad MCP/runtime interception, provider-grade custody, seller/facilitator x402 operation, aggregate spend-window enforcement, cross-org AuthorityCertificate trust, or downstream business success.

---

*Stack analysis: 2026-05-23*
