# External Integrations

**Analysis Date:** 2026-05-19

## APIs & External Services

**Cloudflare Runtime:**
- Cloudflare Workers - hosts the Hono app exported by `src/worker.ts`.
  - SDK/Client: `wrangler` for local Worker dev; Worker runtime types from `@cloudflare/workers-types`.
  - Auth: role-scoped bearer tokens from Worker bindings in `src/http/admission/caller-auth.ts`.
- Cloudflare D1 - durable protocol reconstruction store used by `src/storage/d1/index.ts`.
  - SDK/Client: Worker `D1Database` binding, configured as `DB` in `wrangler.toml`.
  - Auth: Cloudflare binding custody, not application-level credentials in source.
- Cloudflare KV - non-authoritative isolation snapshot cache in `src/storage/kv/index.ts`.
  - SDK/Client: Worker `KVNamespace` binding, configured as `CACHE` in `wrangler.toml`.
  - Auth: Cloudflare binding custody, not application-level credentials in source.

**HTTP Protocol Surface:**
- Handshake v0.2 JSON API - Hono routes declared in `src/http/routes/transition-route-registry.ts` and `src/http/routes/evidence-read-route-registry.ts`.
  - SDK/Client: `HandshakeClient` in `src/sdk/client.ts` uses caller-provided `fetch` or global `fetch`.
  - Auth: bearer tokens by custody role: `control_plane`, `runtime_evidence`, `gateway_custody`, and `review_custody`.
- OpenAPI projection - served from `/openapi.json` by `src/http/app.ts`, generated in `src/http/openapi/index.ts`.
  - SDK/Client: generated from Zod schemas through `z.toJSONSchema`.
  - Auth: OpenAPI security schemes mirror the role-scoped bearer custody model.

**Reference Protected-Action Fixtures:**
- Package install gateway fixture - `src/adapters/package-install/gateway.ts`.
  - SDK/Client: caller-supplied `PackageInstallMutationSurface`; no npm registry SDK is imported.
  - Auth: `VerifiedGatewayCheck` from protocol result, not package-manager credentials in this repo.
- Repository write gateway fixture - `src/adapters/repo-write/gateway.ts`.
  - SDK/Client: caller-supplied `RepoWriteMutationSurface`; no GitHub/GitLab SDK is imported.
  - Auth: `VerifiedGatewayCheck` from protocol result, not repository credentials in this repo.
- Preview deploy gateway fixture - `src/adapters/preview-deploy/gateway.ts`.
  - SDK/Client: caller-supplied `PreviewDeploySurface`; no Vercel/Netlify/Cloudflare Pages SDK is imported.
  - Auth: `VerifiedGatewayCheck` from protocol result, not deployment-provider credentials in this repo.

## Data Storage

**Databases:**
- Cloudflare D1
  - Connection: Worker binding `DB` in `wrangler.toml`.
  - Client: `D1ProtocolStore` in `src/storage/d1/index.ts`.
  - Schema: `migrations/0001_protocol_kernel.sql`.
  - Tables: `protocol_records`, `stream_events`, `greenlight_consumptions`, `greenlight_issuances`, `recovery_terminal_claims`, `protected_path_posture_current`, `protected_surface_operation_claim_current`, and `receipt_by_mutation_attempt`.
- In-memory fixture store
  - Connection: constructor injection through `AppOptions.store` or `allowEphemeralStore` in `src/http/app.ts`.
  - Client: `InMemoryProtocolStore` in `src/storage/memory/index.ts`.
  - Use: test fixtures and local explicit ephemeral mode only.

**File Storage:**
- Local filesystem only in tests and caller-supplied fixture surfaces; no object storage provider integration is imported.

**Caching:**
- Cloudflare KV
  - Connection: Worker binding `CACHE` in `wrangler.toml`.
  - Client: `KvIsolationCache` in `src/storage/kv/index.ts`.
  - Boundary: cache posture only; durable authority and reconstruction stay in D1 per `docs/internal/protocol-notes.md` and `migrations/0001_protocol_kernel.sql`.

## Authentication & Identity

**Auth Provider:**
- Local bearer custody
  - Implementation: `authorizeTransitionCaller` in `src/http/admission/caller-auth.ts` compares bearer tokens against explicit role token bindings/options.
  - Tokens: `HANDSHAKE_CONTROL_PLANE_TOKEN`, `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`, `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`, and `HANDSHAKE_REVIEW_CUSTODY_TOKEN`.
- Hosted caller verifier seam
  - Implementation: `HostedCallerVerifier` interface in `src/http/admission/hosted-caller-identity.ts`, invoked by `authorizeHosted` in `src/http/admission/index.ts` when `AppOptions.authMode` is `"hosted"`.
  - Provider: Not detected; the repo defines the verifier contract but no concrete Auth0/Clerk/OAuth/JWT provider adapter.

## Monitoring & Observability

**Error Tracking:**
- None detected. No Sentry, Datadog, Honeycomb, OpenTelemetry, or similar package is declared in `package.json`.

**Logs:**
- Console logging is not an observability strategy here. `eslint.config.js` forbids `console` except `warn` and `error`.
- Protocol reconstruction evidence is recorded through `ProtocolStore` records/events in `src/protocol/store/port.ts`, `src/storage/d1/index.ts`, and `src/storage/memory/index.ts`.
- HTTP errors return structured transition envelopes through `src/http/errors/transition-error-envelope.ts`.

## CI/CD & Deployment

**Hosting:**
- Cloudflare Workers target through `wrangler.toml`.
- Worker entrypoint: `src/worker.ts`.
- Local dev command: `npm run dev` runs `wrangler dev`.

**CI Pipeline:**
- GitHub Actions in `.github/workflows/check.yml`.
- CI installs Bun 1.3.9, runs `bun install --frozen-lockfile`, then runs `npm run check:repo`.

## Environment Configuration

**Required env vars:**
- For protected HTTP routes in local bearer mode:
  - `HANDSHAKE_CONTROL_PLANE_TOKEN`
  - `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`
  - `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`
  - `HANDSHAKE_REVIEW_CUSTODY_TOKEN`
- For Worker storage bindings:
  - `DB` D1 binding from `wrangler.toml`
  - `CACHE` KV binding from `wrangler.toml`
- For hosted mode:
  - No concrete env var detected; `hostedCallerVerifier` is injected through `AppOptions` in `src/http/app-options.ts`.

**Secrets location:**
- Cloudflare Worker bindings or caller-provided `AppOptions`, never checked-in values.
- No `.env` files detected in the repository root scan.
- Tests use literal fixture strings such as `test-secret` and local bearer tokens; these are not production secrets.

## Webhooks & Callbacks

**Incoming:**
- None detected as webhook endpoints.
- Incoming HTTP routes are protocol transition routes under `/v0.2/*`, health at `/health`, OpenAPI at `/openapi.json`, generated-graph evidence reads under `/v0.2/evidence/*`, and internal record reads under `/v0.2/records/:objectType/:objectId`.

**Outgoing:**
- None detected as fixed outbound webhooks.
- `HandshakeClient` in `src/sdk/client.ts` sends outbound HTTP requests to a caller-supplied base URL with `fetch`.
- Reference gateway adapters call caller-supplied mutation surfaces after `VerifiedGatewayCheck`; provider-specific outbound APIs are intentionally not implemented in this repo.

---

*Integration audit: 2026-05-19*
