# External Integrations

**Analysis Date:** 2026-05-21

## APIs & External Services

**HTTP Transport:**
- Hono HTTP/Worker API - Exposes protocol transition routes, evidence-read routes, `/health`, `/openapi.json`, and an internal raw-record route from `src/http/app.ts`.
  - SDK/Client: `hono` in `package.json`; typed SDK wrapper in `src/sdk/client.ts`.
  - Auth: role-scoped bearer tokens from `src/http/admission/caller-auth.ts` or injected hosted verifier from `src/http/admission/hosted-caller-identity.ts`.
  - Boundaries: `src/http/LANE.md` states HTTP transport does not decide policy, gateway authority, mutation proof, or hosted operation.

**Cloudflare Platform:**
- Cloudflare Workers - Runtime target for `src/worker.ts`, with Hono's `app.fetch` exported as the Worker handler.
  - SDK/Client: `wrangler` in `package.json`; platform types from `@cloudflare/workers-types`.
  - Auth: Worker bindings for role tokens in `src/http/app-options.ts`; no provider-specific auth SDK is wired.
- Cloudflare D1 - Durable reconstruction source for the reference protocol store.
  - SDK/Client: `D1Database` platform binding consumed by `D1ProtocolStore` in `src/storage/d1/index.ts`.
  - Auth: Cloudflare binding name `DB` from `wrangler.toml`; no database URL or password appears in source.
- Cloudflare KV - Optional isolation-state cache plumbing only.
  - SDK/Client: `KVNamespace` platform binding consumed by `KvIsolationCache` in `src/storage/kv/index.ts`.
  - Auth: Cloudflare binding name `CACHE` from `wrangler.toml`.
  - Boundary: `docs/internal/protocol-notes.md` states KV cannot become authority.

**Protected Action Proof Profiles:**
- x402 payment exact proof profile - Local adapter-pack and runtime/gateway proof lane for `x402_payment.exact`, not a live x402 provider integration.
  - SDK/Client: no external x402 package; local code lives in `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, and `src/runtime/ingress/index.ts`.
  - Auth: gateway-held signer reference is modeled as metadata such as `signerRef` and `authorityHolderRef` in `src/adapters/x402-payment/install-proposal.ts`; actual signing is supplied by an injected `X402WalletSigningSurface` in `src/adapters/x402-payment/wallet-gateway.ts`.
  - Proof status: `README.md`, `docs/internal/protocol-definition.md`, and `docs/internal/protocol-kernel-architecture.md` say x402 is a local proof profile. `test/integration/x402-d1-http.test.ts` and `test/product/agent-proof-slice.test.ts` prove local D1/HTTP/gateway behavior, replay refusal, proof-gap recording, and redacted transaction envelope reads.
  - Limits: per-call spend is enforced; session/day/review windows are metadata until a ledger exists, as shown by `X402SpendBoundsSchema` in `src/adapters/x402-payment/install-proposal.ts`.
- Package install proof profile - Local reference fixture for `package.install`, not an external npm execution integration.
  - SDK/Client: no package-manager SDK; runtime proposal code is in `src/runtime/package-install/action-proposal.ts`, gateway fixture code is in `src/adapters/package-install/gateway.ts`, and tests use fixture surfaces in `test/support/package-install-flow.ts`.
  - Auth: one-use `VerifiedGatewayCheck` from `src/protocol/areas/gateway-gate` is required before fixture mutation.
  - Proof status: `test/integration/package-install-end-to-end.test.ts` proves generated orchestration -> contract -> policy -> greenlight -> gateway check -> fixture manifest mutation. `test/product/agent-proof-slice.test.ts` proves package install uses the same redacted agent transaction envelope shape.
  - Limits: `docs/internal/protocol-notes.md` says package install binds observed parameters locally and does not prove external package-material attestation.
- Repo write and preview deploy reference gateways - Local experimental gateway fixtures under `src/adapters/repo-write/gateway.ts` and `src/adapters/preview-deploy/gateway.ts`.
  - SDK/Client: no GitHub, Vercel, or cloud provider SDK dependency is present in `package.json`.
  - Auth: same `VerifiedGatewayCheck` pattern exposed through `src/experimental.ts`.

**Package Registry / Publishing:**
- npm package surface check - Local dry-run packaging only.
  - SDK/Client: `npm pack --dry-run --json` executed by `scripts/check-package-surface.mjs`.
  - Auth: none; this repo remains `"private": true` in `package.json` and does not publish.
  - Boundary: package files are constrained by `package.json` and `scripts/check-package-surface.mjs`; `.planning/`, `.agents/`, tests, and historical docs are excluded.

**CI Service:**
- GitHub Actions - Runs the repo gate on push and pull request.
  - SDK/Client: `.github/workflows/check.yml` uses `actions/checkout@v4` and `oven-sh/setup-bun@v2`.
  - Auth: default GitHub Actions checkout; no repo secrets are referenced in workflow source.

## Data Storage

**Databases:**
- Cloudflare D1 reference store.
  - Connection: Worker binding `DB` in `wrangler.toml` and `src/http/app-options.ts`.
  - Client: `D1ProtocolStore` in `src/storage/d1/index.ts` with SQL statement builders in `src/storage/d1/statements.ts`.
  - Schema: `migrations/0001_protocol_kernel.sql` defines `protocol_records`, `stream_events`, `greenlight_consumptions`, `greenlight_issuances`, `idempotency_ledger_current`, `recovery_terminal_claims`, `protected_path_posture_current`, `isolation_state_current`, `protected_surface_operation_claim_current`, and `receipt_by_mutation_attempt`.
  - Test harness: `test/support/d1-http-harness.ts` executes the migration against `bun:sqlite` for local D1-shaped integration tests.
- In-memory protocol store.
  - Connection: none; local fixture store in `src/storage/memory/index.ts`.
  - Client: `InMemoryProtocolStore` used by tests and optionally by `createApp({ allowEphemeralStore: true })` in `src/http/app.ts`.
  - Boundary: memory is a test fixture and invariant oracle, not durable production storage, per `src/storage/LANE.md`.

**File Storage:**
- Local filesystem fixture surfaces only.
  - Package manifest fixture helpers live in `test/support/package-install-flow.ts` and `test/support/package-manifest-surface.ts`.
  - Repo write fixture helpers live in `test/support/repo-write-surface.ts`.
  - Preview deploy tests use temporary files in `test/adapters/preview-deploy-gateway.test.ts`.
  - No production file storage integration is detected.

**Caching:**
- Cloudflare KV isolation cache.
  - Connection: Worker binding `CACHE` in `wrangler.toml` and `src/http/app-options.ts`.
  - Client: `KvIsolationCache` in `src/storage/kv/index.ts`.
  - Boundary: cache keys are `isolation:${tenantId}:${organizationId}:${scopeType}:${scopeId}`; D1 remains durable reconstruction truth.
- Noop isolation cache.
  - Connection: none; `NoopIsolationCache` in `src/storage/kv/index.ts`.

## Authentication & Identity

**Auth Provider:**
- Local bearer-token custody by role.
  - Implementation: `authorizeTransitionCaller` and `authorizeTransitionCallerForAny` in `src/http/admission/caller-auth.ts`.
  - Roles: `control_plane`, `runtime_evidence`, `gateway_custody`, and `review_custody`.
  - Env bindings: `HANDSHAKE_CONTROL_PLANE_TOKEN`, `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`, `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`, and `HANDSHAKE_REVIEW_CUSTODY_TOKEN`.
  - Client support: `HandshakeClient` sends role-specific bearer tokens from `transitionTokens` in `src/sdk/client.ts`.
- Hosted caller verifier seam.
  - Implementation: `HostedCallerVerifier` interface and `TransitionCallerIdentitySchema` in `src/http/admission/hosted-caller-identity.ts`; admission wiring in `src/http/admission/index.ts`.
  - Auth: injected verifier object, not a built-in SaaS provider.
  - Scope checks: hosted identity tenant/org scope is checked before transition dispatch in `src/http/app.ts`.
  - Boundary: `docs/internal/decisions.md` says hosted admission is a transport seam and does not prove hosted operation, production org auth, provider enforcement, or customer gateway installation.

## Monitoring & Observability

**Error Tracking:**
- None detected.
  - No Sentry, OpenTelemetry, Datadog, Honeycomb, or logging SDK dependency appears in `package.json`.
  - HTTP errors are mapped to typed transition envelopes by `src/http/errors/transition-error-envelope.ts` and `src/http/app.ts`.

**Logs:**
- Structured protocol evidence rather than log-based authority.
  - Durable records and event chains are written through `src/protocol/events/`, `src/protocol/store/port.ts`, `src/storage/d1/index.ts`, and `migrations/0001_protocol_kernel.sql`.
  - Redacted diagnostic projections are implemented in `src/protocol/evidence-projections/` and served by `src/http/handlers/evidence-read.ts`.
  - Evidence-read routes include generated graph, contract, agent transaction envelope, idempotency recovery, receipt timeline, and protected-path install health in `src/http/routes/evidence-read-route-registry.ts`.
  - ESLint allows only `console.warn` and `console.error` in `eslint.config.js`; source behavior should not rely on console logging for auditability.

## CI/CD & Deployment

**Hosting:**
- Cloudflare Workers target.
  - Entry: `src/worker.ts`.
  - Binding config: `wrangler.toml`.
  - Local dev command: `npm run dev` runs `wrangler dev` from `package.json`.
  - Production caveat: canon in `README.md`, `docs/internal/protocol-definition.md`, and `docs/internal/protocol-kernel-architecture.md` does not claim hosted operation or live provider custody.

**CI Pipeline:**
- GitHub Actions.
  - Workflow: `.github/workflows/check.yml`.
  - Steps: checkout, `oven-sh/setup-bun@v2` with Bun 1.3.9, `bun install --frozen-lockfile`, and `npm run check:repo`.
  - Full gate: `package.json` runs typecheck, lint, format check, Bun tests, package surface check, and `git diff --check`.

## Environment Configuration

**Required env vars:**
- `HANDSHAKE_CONTROL_PLANE_TOKEN` - Required for local control-plane transition custody in `src/http/admission/caller-auth.ts`.
- `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN` - Required for local runtime-evidence transition custody and evidence reads in `src/http/admission/caller-auth.ts`.
- `HANDSHAKE_GATEWAY_CUSTODY_TOKEN` - Required for local gateway-custody transitions in `src/http/admission/caller-auth.ts`.
- `HANDSHAKE_REVIEW_CUSTODY_TOKEN` - Required for local review-custody transitions and evidence reads in `src/http/admission/caller-auth.ts`.

**Required platform bindings:**
- `DB` - D1 binding required for durable protocol state endpoints in `src/http/store/resolution.ts` and configured in `wrangler.toml`.
- `CACHE` - KV binding configured in `wrangler.toml`; used only if isolation cache plumbing is wired with `KvIsolationCache` from `src/storage/kv/index.ts`.

**Optional runtime configuration:**
- `AppOptions.store` - Injected `ProtocolStore` for tests or custom hosting in `src/http/app-options.ts`.
- `AppOptions.allowEphemeralStore` - Allows in-memory fallback for test/dev cases in `src/http/app.ts`.
- `AppOptions.callerAuthTokens` - In-process token injection alternative to Worker env bindings in `src/http/app-options.ts`.
- `AppOptions.authMode` and `AppOptions.hostedCallerVerifier` - Hosted admission seam in `src/http/admission/index.ts`.

**Secrets location:**
- Cloudflare Worker bindings or injected `AppOptions` values.
- No `.env*` file was detected. Do not store role tokens, signer material, or provider credentials in repo files.
- x402 signer references such as `secretref:x402-wallet-gateway` are fixture metadata in tests like `test/product/agent-proof-slice.test.ts`, not real secrets.

## Webhooks & Callbacks

**Incoming:**
- Public transition routes under `/v0.2/*`, declared in `src/http/routes/transition-route-registry.ts` and dispatched by `src/http/app.ts`.
- Public diagnostic evidence routes under `/v0.2/evidence/*`, declared in `src/http/routes/evidence-read-route-registry.ts` and handled by `src/http/handlers/evidence-read.ts`.
- Internal raw-record route `/v0.2/records/:objectType/:objectId` handled by `src/http/handlers/internal-record-read.ts`; raw reads are constrained by object export posture.
- Health and OpenAPI endpoints `/health` and `/openapi.json` in `src/http/app.ts`.

**Outgoing:**
- None detected as first-class webhooks.
- x402 wallet signing is an injected local surface via `X402WalletSigningSurface.signPayment()` in `src/adapters/x402-payment/wallet-gateway.ts`; source does not call a live x402 network SDK.
- Package install, repo write, and preview deploy mutations are injected reference surfaces under `src/adapters/*` and `test/support/*`; source does not call npm, GitHub, Vercel, or cloud provider APIs directly.
- `HandshakeClient` in `src/sdk/client.ts` performs outbound HTTP requests only to the caller-provided Handshake base URL.

---

*Integration audit: 2026-05-21*
