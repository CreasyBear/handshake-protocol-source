# External Integrations

**Analysis Date:** 2026-05-20
**Current HEAD:** `88e6f16`
**Scope:** Current tracked docs, source, tests, package/config files, plus visible untracked Tier 1 AuthorityCertificate/kernel work in this checkout. `.planning/` is scratch.

## APIs & External Services

**HTTP Protocol API:**
- Hono app - exposes local/Worker HTTP routes for protocol transitions and evidence reads.
  - SDK/Client: `hono` in `src/http/app.ts`; typed client in `src/sdk/client.ts`.
  - Auth: role-scoped bearer tokens from `HANDSHAKE_CONTROL_PLANE_TOKEN`, `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`, `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`, and `HANDSHAKE_REVIEW_CUSTODY_TOKEN`.
  - Routes: transition definitions in `src/http/routes/transition-route-registry.ts`; evidence-read definitions in `src/http/routes/evidence-read-route-registry.ts`.
  - OpenAPI: generated from Zod schemas in `src/http/openapi/index.ts` and served at `/openapi.json` by `src/http/app.ts`.

**Cloudflare Runtime:**
- Cloudflare Workers - reference Worker hosting target for the Hono app.
  - SDK/Client: `wrangler` dev tooling and `@cloudflare/workers-types`.
  - Auth: Worker binding tokens consumed by `src/http/admission/caller-auth.ts`.
  - Config: `wrangler.toml` sets `main = "src/worker.ts"`, D1 binding `DB`, KV binding `CACHE`, and compatibility date `2026-05-17`.

**x402 Payment Proof Profile:**
- x402 payment - local protected-action proof profile and gateway fixture, not a live provider SDK integration.
  - SDK/Client: no external x402 package detected; source-local adapter code lives in `src/adapters/x402-payment/`.
  - Auth: gateway custody is represented by `X402WalletGatewayProfile.signerCustodyStatus`, `signerRef`, and `authorityHolderRef` in `src/adapters/x402-payment/install-proposal.ts`; HTTP custody still uses `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`.
  - Runtime proposal: `src/adapters/x402-payment/action-proposal.ts` builds exact `x402_payment.exact` contracts from endpoint/payee/network/token/amount evidence.
  - Gateway mutation seam: `X402WalletSigningSurface` in `src/adapters/x402-payment/wallet-gateway.ts` signs only after a verified gateway check.
  - Bypass/conformance: hostile probes live in `src/adapters/x402-payment/bypass-probes.ts`; local conformance exports live through `src/conformance/index.ts`.
  - Limits: `README.md`, `docs/internal/decisions.md`, and `docs/internal/protocol-notes.md` state that x402 is local foundation evidence only; no live provider custody, hosted verifier, cross-org trust, or spend-window ledger is established.

**Package Install Proof Profile:**
- Package install - protected package-manager action fixture and runtime proposal path.
  - SDK/Client: no npm registry client package detected; package manager/registry are explicit contract parameters in `src/runtime/package-install/action-proposal.ts`.
  - Auth: gateway custody via HTTP role token and verified gateway check.
  - Gateway mutation seam: `PackageInstallMutationSurface` in `src/adapters/package-install/gateway.ts`.
  - Default registry/package manager posture: `registryRef` defaults to `registry:npmjs` and `packageManager` defaults to `bun` in `src/runtime/package-install/action-proposal.ts`.
  - Limits: package material evidence is caller-supplied fields (`resolvedMaterialDigest`, `resolvedMaterialEvidenceRefs`); docs state no independent external package-material attestation.

**Repository Write / Preview Deploy Fixtures:**
- Repository write - abstract protected mutation surface for writing repo content after a gateway check.
  - SDK/Client: no GitHub/Git provider SDK detected; `RepoWriteMutationSurface` is an interface in `src/adapters/repo-write/gateway.ts`.
  - Auth: gateway custody via HTTP role token and verified gateway check.
- Preview deploy - abstract protected mutation surface for provider preview deploys.
  - SDK/Client: no Vercel/Cloudflare Pages/provider SDK detected; `PreviewDeploySurface` is an interface in `src/adapters/preview-deploy/gateway.ts`.
  - Auth: gateway custody via HTTP role token and verified gateway check.

**Runtime Ingress:**
- Runtime dispatch observer - source-local runtime ingress for package-install and x402 dispatch blocks.
  - SDK/Client: `./runtime` package subpath exports `proposeRuntimeIngressActionContracts` from `src/runtime/index.ts`.
  - Auth: runtime evidence role when using HTTP/SDK transitions.
  - Scope: `src/runtime/ingress/index.ts` records runtime execution, generated execution graph, tool-call drafts, compilation, and contracts/refusals. It does not issue policy decisions, greenlights, gateway checks, receipts, or mutations.

## Data Storage

**Databases:**
- Cloudflare D1
  - Connection: Worker binding `DB` in `wrangler.toml` and `WorkerBindings` in `src/http/app-options.ts`.
  - Client: `D1ProtocolStore` in `src/storage/d1/index.ts` implements `ProtocolStore` from `src/protocol/store/port.ts`.
  - Schema: `migrations/0001_protocol_kernel.sql` creates `protocol_records`, `stream_events`, `greenlight_consumptions`, `greenlight_issuances`, `idempotency_ledger_current`, `recovery_terminal_claims`, `protected_path_posture_current`, `isolation_state_current`, `protected_surface_operation_claim_current`, and `receipt_by_mutation_attempt`.
  - Test harness: `test/support/d1-http-harness.ts` uses `bun:sqlite` to emulate D1 for HTTP/D1 integration tests.
- In-memory store
  - Connection: none; constructed directly as `InMemoryProtocolStore` in `src/storage/memory/index.ts`.
  - Client: used for tests and explicit ephemeral app configuration through `createApp({ allowEphemeralStore: true })` or injected `AppOptions.store`.

**File Storage:**
- No production file storage integration detected.
- Local filesystem appears in tests and tooling only, such as `test/support/d1-http-harness.ts`, `test/support/repo-write-surface.ts`, and `scripts/check-package-surface.mjs`.

**Caching:**
- Cloudflare KV
  - Connection: Worker binding `CACHE` in `wrangler.toml` and `WorkerBindings` in `src/http/app-options.ts`.
  - Client: `KvIsolationCache` in `src/storage/kv/index.ts`.
  - Authority posture: `docs/internal/protocol-notes.md` states KV is cache posture only and cannot become authority; D1 is durable reconstruction truth.
- Noop cache
  - `NoopIsolationCache` in `src/storage/kv/index.ts` provides a non-authoritative fallback cache seam.

## Authentication & Identity

**Auth Provider:**
- Local bearer-token admission
  - Implementation: `authorizeTransitionCaller` and `authorizeTransitionCallerForAny` in `src/http/admission/caller-auth.ts`.
  - Custody roles: `control_plane`, `runtime_evidence`, `gateway_custody`, and `review_custody`.
  - Token source: Worker bindings or injected `AppOptions.callerAuthTokens`.
  - Security scheme projection: `transitionCallerSecuritySchemeName` in `src/http/admission/caller-auth.ts`; OpenAPI security schemes in `src/http/openapi/index.ts`.
- Hosted caller verifier seam
  - Implementation: `HostedCallerVerifier`, `TransitionCallerIdentitySchema`, and scope/freshness checks in `src/http/admission/hosted-caller-identity.ts`.
  - Configuration: `createApp({ authMode: "hosted", hostedCallerVerifier })` via `src/http/app-options.ts`.
  - Provider status: no concrete hosted auth provider integration detected; this is an interface seam.
- Request identity headers
  - Implementation: `src/http/admission/request-context.ts`.
  - SDK usage: `src/sdk/client.ts` sends protocol version, request identity, optional originating identity, and bearer tokens.

## Monitoring & Observability

**Error Tracking:**
- None detected. No Sentry, Datadog, Honeycomb, OpenTelemetry, or similar dependency appears in `package.json` or source imports.

**Logs:**
- Structured HTTP error envelopes are the primary observable failure surface via `src/http/errors/transition-error-envelope.ts` and `HandshakeClientError` in `src/sdk/client.ts`.
- Evidence reads expose redacted diagnostic projections through `src/http/routes/evidence-read-route-registry.ts` and `src/protocol/evidence-projections/`.
- Console logging is not an observability strategy; `eslint.config.js` bans `console` except `warn` and `error`.

## CI/CD & Deployment

**Hosting:**
- Cloudflare Workers is the configured runtime target through `wrangler.toml` and `src/worker.ts`.
- No production deployment workflow is detected in `.github/workflows/check.yml`; local dev command is `npm run dev` -> `wrangler dev`.

**CI Pipeline:**
- GitHub Actions
  - Config: `.github/workflows/check.yml`.
  - Runner: `ubuntu-latest`.
  - Setup: `oven-sh/setup-bun@v2` with Bun `1.3.9`.
  - Gate: `bun install --frozen-lockfile` then `npm run check:repo`.
- Package surface gate
  - Config: `scripts/check-package-surface.mjs`.
  - Command: `npm run pack:check` from `package.json`.
  - Purpose: declaration build plus dry-run package contents guard.

## Environment Configuration

**Required env vars:**
- `HANDSHAKE_CONTROL_PLANE_TOKEN` - required for control-plane transition routes in local bearer-token mode.
- `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN` - required for runtime-evidence transition routes and evidence reads in local bearer-token mode.
- `HANDSHAKE_GATEWAY_CUSTODY_TOKEN` - required for gateway-custody transition routes in local bearer-token mode.
- `HANDSHAKE_REVIEW_CUSTODY_TOKEN` - required for review-custody transition routes and evidence reads in local bearer-token mode.
- `DB` - Cloudflare D1 binding required for durable HTTP endpoints when no explicit `AppOptions.store` fallback is provided.
- `CACHE` - optional Cloudflare KV binding for isolation cache posture; not durable authority.

**Secrets location:**
- Runtime secrets should be Cloudflare Worker bindings/secrets or injected `AppOptions.callerAuthTokens`; no checked-in secret file was read or found.
- No repo-root `.env` or `.dev.vars` file is present during this scan. `.gitignore` excludes `.dev.vars`.
- Test-only tokens appear in `test/support/d1-http-harness.ts` and are fixture values for local tests, not production secrets.
- AuthorityCertificate signing inputs accept HMAC dev secrets and Ed25519 key material through typed inputs in `src/protocol/areas/authority-certificate/inputs.ts` and signing helpers in `src/protocol/areas/authority-certificate/signing.ts`; source docs state HMAC is dev-only and production verification requires pinned trust material.

## Webhooks & Callbacks

**Incoming:**
- `/health` - health check from `src/http/app.ts`.
- `/openapi.json` - OpenAPI projection from `src/http/openapi/index.ts`.
- `/v0.2/catalog/tool-capabilities` - register durable tool capability.
- `/v0.2/catalog/action-types` - register durable action type.
- `/v0.2/catalog/gateways` - register gateway binding.
- `/v0.2/envelopes` - register operating envelope.
- `/v0.2/runtime-executions` - record runtime execution evidence.
- `/v0.2/bypass-probes` - record bypass probe evidence.
- `/v0.2/tool-call-drafts` and `/v0.2/tool-call-draft-transitions` - record generated tool-call input state.
- `/v0.2/intent-compilations` - compile intent to candidate/refusal evidence.
- `/v0.2/action-contracts` - propose exact action contract.
- `/v0.2/policy-decisions` - evaluate policy and optionally issue one-use greenlight.
- `/v0.2/review-artifacts` and `/v0.2/review-decisions` - record exact-bound review evidence.
- `/v0.2/gateway-check-attempts` - gateway-side pre-mutation check.
- `/v0.2/surface-operation-reconciliations` - downstream operation observation without retry authority.
- `/v0.2/isolation-states` and `/v0.2/breaker-decisions` - durable isolation posture.
- `/v0.2/receipt-exports`, `/v0.2/recovery-recommendations`, `/v0.2/recovery-recommendation-status-transitions`, and `/v0.2/recovery-terminal-conflict-resolutions` - evidence export and recovery transitions.
- Evidence reads under `/v0.2/evidence/...` are defined in `src/http/routes/evidence-read-route-registry.ts`.
- Raw internal record reads under `/v0.2/records/:objectType/:objectId` are handled by `src/http/handlers/internal-record-read.ts` and constrained by object registry read posture.

**Outgoing:**
- No direct outgoing webhooks detected.
- `HandshakeClient` in `src/sdk/client.ts` performs outgoing HTTP requests to a configured Handshake base URL.
- Adapter mutation surfaces are caller-provided interfaces rather than provider SDK calls:
  - `X402WalletSigningSurface` in `src/adapters/x402-payment/wallet-gateway.ts`.
  - `PackageInstallMutationSurface` in `src/adapters/package-install/gateway.ts`.
  - `RepoWriteMutationSurface` in `src/adapters/repo-write/gateway.ts`.
  - `PreviewDeploySurface` in `src/adapters/preview-deploy/gateway.ts`.
- The source does not directly call external payment, package registry, Git hosting, preview deploy, telemetry, or auth provider APIs.

---

*Integration audit: 2026-05-20*
