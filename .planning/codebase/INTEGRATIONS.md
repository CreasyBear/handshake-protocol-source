# External Integrations

**Analysis Date:** 2026-05-26

## Source Stamp

- Current source stamp: `git rev-parse --short HEAD` returned `4946237`.
- Current checkout is dirty: `git status --short` reports source, test, docs, package, and `.planning/` changes. This map reflects the current working tree.
- Source-owned integration truth is in `package.json`, `README.md`, `server.json`, `wrangler.toml`, `.github/workflows/check.yml`, `src/**`, `test/**`, `scripts/**`, and `docs/internal/**`.
- `.planning/**` remains scratch per `.planning/STATE.md`; use tracked source/docs/tests over older `.planning/codebase/*.md` when facts disagree.

## APIs & External Services

**x402 protected payment evidence:**
- x402 official SDK - Used for the narrow buyer-side `x402_payment.exact` per-call proof path, `PAYMENT-REQUIRED` evidence decoding, exact EVM payment payload creation, and `PAYMENT-SIGNATURE` evidence after a verified gateway check.
  - SDK/Client: `@x402/core` and `@x402/evm` in `src/adapters/x402-payment/upstream-evidence.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, and `src/adapters/x402-payment/sandbox-http.ts`; `@x402/fetch` appears in `test/conformance/x402-upstream-exact-fixtures.test.ts`.
  - Auth: gateway-held signer object (`ClientEvmSigner`) and gateway credential refs are injected through `src/adapters/x402-payment/wallet-gateway.ts`; no source code reads an x402 private key environment variable as a required runtime config.
  - Boundary: local/reference sandbox support lives in `src/adapters/x402-payment/sandbox-http.ts`; `README.md` and `docs/internal/decisions.md` cut broad x402 compatibility, facilitator operation, seller middleware, settlement finality, provider custody, and aggregate spend management from the current claim.

**Model Context Protocol:**
- Local MCP stdio proposal/evidence server - Exposes one protected proposal tool plus read-only metadata, contract, health, and receipt timeline resources.
  - SDK/Client: `@modelcontextprotocol/server` in `src/mcp/stdio/server.ts`; `@modelcontextprotocol/client` in `src/mcp/stdio/process-proof.ts` and `scripts/check-published-entrypoints.mjs`.
  - Auth: `server.json` declares npm/stdio transport and does not carry bearer tokens; MCP proposal does not evaluate policy, create greenlights, perform gateway checks, mutate, or export receipts.
  - Tool surface: `handshake.actions.x402_payment.propose` is declared in `src/mcp/catalog.ts`, validated by `src/mcp/x402-proposal.ts`, implemented by `src/mcp/stdio/server.ts`, and packaged by `server.json`.

**Cloudflare platform:**
- Cloudflare Workers - HTTP deployment target for the Hono app.
  - SDK/Client: Worker entry `src/worker.ts`, Hono app `src/http/app.ts`, binding types from `@cloudflare/workers-types`, config in `wrangler.toml`.
  - Auth: role bearer tokens are read from Worker bindings in `src/http/admission/caller-auth.ts`.
- Cloudflare D1 - Durable protocol record and reconstruction storage.
  - Client: `D1ProtocolStore` in `src/storage/d1/index.ts`.
  - Schema: `migrations/0001_protocol_kernel.sql`.
  - Binding: `DB` in `wrangler.toml` and `src/http/app-options.ts`.
- Cloudflare KV - Optional non-authoritative isolation cache.
  - Client: `KvIsolationCache` in `src/storage/kv/index.ts`.
  - Binding: `CACHE` in `wrangler.toml` and `src/http/app-options.ts`.

**Hosted identity providers:**
- Provider-neutral hosted caller evidence - Supports provider-shaped identity evidence without bundling provider-specific SDKs.
  - SDK/Client: no Clerk, OAuth/OIDC, Cloudflare Access, or custom JWT SDK dependency is declared in `package.json`; adapters implement `HostedVerifierAdapter` in `src/hosted-admission/hosted-verifier-adapter.ts`.
  - Auth: raw provider sessions, service credentials, claims, and membership proof must be consumed by server-side adapters and converted into redacted `TransitionCallerIdentity` evidence in `src/hosted-admission/hosted-caller-identity.ts`.
  - Provider kinds: `clerk`, `oauth_oidc`, `cloudflare_access`, `custom_jwt`, `service_credential`, `test_fixture`, and `other` are schema values in `src/hosted-admission/hosted-caller-identity.ts`.
  - Configuration: deployment mode, verifier strategy, secret names, public var names, read entitlements, raw-read posture, retention posture, export posture, D1, and KV are validated by `src/hosted-admission/hosted-admission-config.ts`.

**auth.md protected API call profile:**
- OAuth protected-resource/authorization-server metadata profile - Used as an adjacent protected API call evidence path, not as current broad auth provider integration.
  - SDK/Client: no external `auth.md` SDK dependency is declared in `package.json`; profile code is in `src/adapters/auth-md/profiles.ts`, proposal code in `src/adapters/auth-md/action-proposal.ts`, gateway execution boundary in `src/adapters/auth-md/gateway.ts`, and interlock packet code in `src/adapters/auth-md-x402-interlock/packet.ts`.
  - Auth: gateway credential refs/digests are modeled in parameters; raw Authorization header material is refused or redacted by `src/adapters/auth-md/action-proposal.ts`, `src/adapters/auth-md/profiles.ts`, and `src/adapters/auth-md/gateway.ts`.

**npm, MCP Registry, and release readback:**
- npm registry - Used for package identity, publication posture, public readback, dist-signature/provenance evidence, and clean installed-artifact smoke checks.
  - SDK/Client: npm CLI and package install calls in `scripts/check-package-surface.mjs`, `scripts/project-release-repository.js`, `scripts/check-release-admin.js`, and `scripts/check-clean-installed-activation.mjs`; public registry HTTP readback in `scripts/check-npm-maintainer-posture.mjs` and `scripts/check-distribution-provenance.mjs`.
  - Auth: package publish credentials are not read by source scripts; remote readback uses public npm registry APIs such as `https://registry.npmjs.org/handshake-protocol-kernel/latest` in `scripts/check-distribution-provenance.mjs`.
- MCP Registry - Used only for distribution discoverability readback.
  - SDK/Client: HTTP fetch/curl readback in `scripts/check-distribution-provenance.mjs`; package metadata in `server.json`.
  - Auth: no MCP Registry credential is read by source code; `README.md` states MCP Registry discoverability remains a proof gap until registry acceptance and lookup are verified.
- GitHub Actions and git remotes - Used for CI and release-admin artifact posture.
  - SDK/Client: CI workflow in `.github/workflows/check.yml`; release/artifact gates in `scripts/check-release-admin.js`, `scripts/check-release-proof.mjs`, `scripts/project-release-repository.js`, and `scripts/build-publish-handoff-packet.mjs`.
  - Auth: GitHub Actions tokens and trusted-publish credentials are external to this checkout; source scripts inspect workflow shape, pinned actions, remote refs, package artifacts, and evidence packets, not secret values.

**Engineering protected-action adapter surfaces:**
- Package install, repo write, and preview deploy adapters - Source-owned reference adapter surfaces for conformance and expansion proof, not provider-specific production integrations.
  - SDK/Client: package-install gateway in `src/adapters/package-install/gateway.ts`, repo-write gateway in `src/adapters/repo-write/gateway.ts`, preview-deploy gateway in `src/adapters/preview-deploy/gateway.ts`, runtime proposals under `src/runtime/**`, and conformance exports in `src/conformance/index.ts`.
  - Auth: each mutation adapter requires `verifiedGatewayCheckFromResult` before invoking the injected downstream surface; downstream provider clients are supplied by host/test harnesses rather than bundled in this package.

## Data Storage

**Databases:**
- Cloudflare D1 / SQLite-compatible protocol store
  - Connection: Worker binding `DB` in `wrangler.toml` and `src/http/app-options.ts`.
  - Client: `D1ProtocolStore` in `src/storage/d1/index.ts`.
  - Schema: `migrations/0001_protocol_kernel.sql` creates `protocol_records`, `protocol_record_action_contract_refs`, `greenlight_consumptions`, `greenlight_issuances`, `idempotency_ledger_current`, `recovery_terminal_claims`, `protected_path_posture_current`, `isolation_state_current`, `protected_surface_operation_claim_current`, `receipt_by_mutation_attempt`, `stream_events`, and indexes.
- In-memory protocol store
  - Connection: explicit injection only, not production durable storage.
  - Client: `InMemoryProtocolStore` in `src/storage/memory/index.ts`.
  - Use: tests, examples, and explicit `allowEphemeralStore` paths in `src/http/app.ts`.

**File Storage:**
- Local filesystem only for CLI state, demos, package projection, and release evidence.
  - CLI project state: `.handshake/project.json` is read/written by `src/cli/local-project/index.ts` and declared by `src/cli/command-manifest.ts`.
  - Demo outputs: `examples/self-hosted-activation/output/`, `examples/x402-protected-spend/output/`, `examples/service-workflow-admission/output/`, `examples/external-adapter-sdk/output/`, `examples/mcp-reference-transcript/output/`, and `examples/x402-protected-tool-profiles/output/`.
  - Package/artifact projection: temporary filesystem work in `scripts/project-release-repository.js`, `scripts/check-release-admin.js`, `scripts/check-clean-installed-activation.mjs`, `scripts/build-product-closeout-bundle.mjs`, and `scripts/build-publish-handoff-packet.mjs`.

**Caching:**
- Cloudflare KV optional cache
  - Connection: Worker binding `CACHE` in `wrangler.toml`.
  - Client: `KvIsolationCache` in `src/storage/kv/index.ts`.
  - Authority: non-authoritative cache only; D1 remains the durable reconstruction store per `migrations/0001_protocol_kernel.sql` and `src/http/handlers/hosted-readiness.ts`.
- Not detected: Redis, Memcached, browser storage, external object storage, or external queue service.

## Authentication & Identity

**Auth Provider:**
- Local HTTP bearer-token custody
  - Implementation: `src/http/admission/caller-auth.ts` maps transition roles to `HANDSHAKE_CONTROL_PLANE_TOKEN`, `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`, `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`, and `HANDSHAKE_REVIEW_CUSTODY_TOKEN`.
  - Use: `src/http/admission/index.ts` gates transition routes and evidence reads before invoking protocol transitions.
- Hosted caller verifier adapter
  - Implementation: `createHostedCallerVerifierFromAdapter` in `src/hosted-admission/hosted-verifier-adapter.ts` accepts server-side provider adapters and emits redacted hosted identity evidence through `src/hosted-admission/hosted-caller-identity.ts`.
  - Providers: `clerk`, `oauth_oidc`, `cloudflare_access`, `custom_jwt`, `service_credential`, `test_fixture`, and `other` are schema-supported provider kinds; no provider SDK is bundled in `package.json`.
- Authority certificate verifier
  - Implementation: local pinned trust material is projected and verified by `src/http/handlers/verifier.ts` and `src/protocol/areas/authority-certificate/**`.
  - Boundary: `/v0.2/verifier/metadata` in `src/http/handlers/verifier.ts` reports `remoteTrustFetchAllowed: false`; JWKS/key-set routes project local trust material from `AppOptions.authorityCertificateTrustMaterial`.

## Monitoring & Observability

**Error Tracking:**
- None detected. `package.json` does not declare Sentry, OpenTelemetry, Datadog, Honeycomb, or similar observability packages.

**Logs:**
- HTTP errors return structured protocol envelopes through `src/http/errors/transition-error-envelope.ts` and the `app.onError` handler in `src/http/app.ts`.
- CLI and release scripts write process output/errors through Node/Bun process APIs in files such as `src/cli/main.ts`, `scripts/check-release-admin.js`, and `scripts/check-package-surface.mjs`.
- ESLint permits only `console.warn` and `console.error` in `eslint.config.js`; no centralized logger framework is configured.
- Evidence, refusal, proof-gap, receipt, idempotency, isolation, and audit records are protocol records in `src/protocol/store/port.ts`, `src/storage/d1/index.ts`, and `src/storage/memory/index.ts`, not a generic tracing backend.

## CI/CD & Deployment

**Hosting:**
- npm package distribution for `handshake-protocol-kernel@0.2.8` is declared in `package.json` and `server.json`; `README.md` states public npm `0.2.7` is historical provenance only until current `0.2.8` publication/readback passes.
- Local MCP stdio package surface is declared in `server.json`, implemented by `src/mcp/stdio/server.ts`, and exposed by `bin/handshake-mcp`.
- Cloudflare Worker HTTP app is configured by `wrangler.toml` and `src/worker.ts`; no production deploy workflow beyond CI was detected in `.github/workflows/check.yml`.

**CI Pipeline:**
- GitHub Actions workflow `.github/workflows/check.yml`
  - Trigger: `push` and `pull_request`.
  - Permissions: `contents: read`.
  - Toolchain: pinned `actions/checkout`, pinned `oven-sh/setup-bun`, Bun 1.3.9.
  - Gate: `bun install --frozen-lockfile` followed by `npm run check:repo`.
- Release/package gates are local/scripted:
  - `package.json#scripts.pack:check` runs package surface, published entrypoint, clean installed activation, release proof, host-generated-code containment, live x402 paid retry posture, auth.md+x402 admission packet posture, product completion, and npm maintainer posture checks.
  - `scripts/check-release-admin.js` runs clean-source, clean-clone, lockfile install, full repo gate, artifact projection, artifact boundary, smoke imports, smoke CLI, and optional remote readback.

## Environment Configuration

**Required env vars:**
- `HANDSHAKE_CONTROL_PLANE_TOKEN` - Local HTTP control-plane transition bearer token in `src/http/admission/caller-auth.ts`.
- `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN` - Local HTTP runtime-evidence transition bearer token in `src/http/admission/caller-auth.ts`.
- `HANDSHAKE_GATEWAY_CUSTODY_TOKEN` - Local HTTP gateway-custody transition bearer token in `src/http/admission/caller-auth.ts`.
- `HANDSHAKE_REVIEW_CUSTODY_TOKEN` - Local HTTP review-custody/evidence-read bearer token in `src/http/admission/caller-auth.ts`.
- `DB` - Cloudflare D1 Worker binding in `wrangler.toml` and `src/http/app-options.ts`.
- `CACHE` - Optional Cloudflare KV Worker binding in `wrangler.toml` and `src/http/app-options.ts`.
- Hosted mode secrets/public vars - Names are supplied by `HostedAdmissionConfig.secretNames` and `HostedAdmissionConfig.publicVarNames` in `src/hosted-admission/hosted-admission-config.ts`; source does not hardcode production provider secret names.

**Secrets location:**
- Cloudflare Worker bindings/secrets or explicit `AppOptions` injection are the source-supported locations for HTTP tokens, hosted verifier config, trust material, D1, and KV in `src/http/app-options.ts`.
- Local CLI state avoids token values according to `src/cli/command-manifest.ts` and writes external local posture refs through `src/cli/x402/local-state.ts`.
- No root `.env*` file was detected. `.gitignore` excludes `.dev.vars`, `.env`, `.env.local`, and `.env.*.local`; if present, list only and never quote contents.

## Webhooks & Callbacks

**Incoming:**
- No provider webhook route was detected in `src/http/app.ts`, `src/http/routes/transition-route-registry.ts`, or `src/http/routes/evidence-read-route-registry.ts`.
- HTTP transition and evidence-read routes are registered from `src/http/routes/transition-route-registry.ts` and `src/http/routes/evidence-read-route-registry.ts`.
- Additional readback/verifier routes live in `src/http/app.ts`: `/health`, `/openapi.json`, `/v0.2/hosted/readiness`, `/v0.2/verifier/metadata`, `/v0.2/verifier/key-set`, `/v0.2/verifier/jwks.json`, `/v0.2/verifier/status/:subjectKind/:subjectRef`, `/v0.2/verifier/authority-certificates/verify`, and `/v0.2/records/:objectType/:objectId`.
- Hosted verifier schemas include `provider_webhook_verified` as an evidence posture in `src/hosted-admission/hosted-verifier-adapter.ts`, but source does not implement an incoming provider webhook endpoint.

**Outgoing:**
- Role-scoped SDK clients use `fetch` against configured Handshake base URLs in `src/sdk/surface-clients/transport.ts`; the lower-level `HandshakeClient` uses `fetch` in `src/sdk/client.ts`.
- x402 gateway signing calls an injected `X402WalletSigningSurface` only after `VerifiedGatewayCheck` in `src/adapters/x402-payment/wallet-gateway.ts`; local downstream fixture behavior is in `src/adapters/x402-payment/sandbox-http.ts`.
- auth.md protected API calls execute through an injected `AuthMdProtectedApiCallSurface` only after `VerifiedGatewayCheck` in `src/adapters/auth-md/gateway.ts`; no concrete outbound provider client is bundled.
- Package install, preview deploy, and repo write adapters call injected downstream surfaces only after `VerifiedGatewayCheck` in `src/adapters/package-install/gateway.ts`, `src/adapters/preview-deploy/gateway.ts`, and `src/adapters/repo-write/gateway.ts`.
- Release/readback scripts call public npm registry APIs, MCP Registry APIs, curl fallback, npm CLI, and optional remote git readback in `scripts/check-npm-maintainer-posture.mjs`, `scripts/check-distribution-provenance.mjs`, and `scripts/check-release-admin.js`.

---

*Integration audit: 2026-05-26*
