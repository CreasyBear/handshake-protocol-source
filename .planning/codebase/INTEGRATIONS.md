# External Integrations

**Analysis Date:** 2026-05-28

## APIs & External Services

**x402 payment (first product wedge):**
- Protocol: x402 v2 with `exact` scheme only for the live wedge (`src/surfaces/proof-packets/live-x402/requirement.ts`, `src/adapters/x402-payment/wallet-gateway.ts`).
- SDK: `@x402/core` (schemas, HTTP client), `@x402/evm` (EVM exact client signer hook).
- Usage: parse 402 PAYMENT-REQUIRED, bind selected requirement to action contract, run gateway check before signer invocation; live readback proofs in `src/surfaces/proof-packets/live-x402/` and gate scripts `scripts/check-live-x402-paid-retry.mjs`, `scripts/check-live-x402-proof.mjs`.
- Auth: customer gateway custody is evidence-only in proofs; live credentials are never persisted by Handshake surfaces (see README x402 ladder).

**Model Context Protocol (local product surface):**
- Registry metadata: `server.json` (schema `https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json`).
- Transport: stdio via npm package `handshake-protocol-kernel` / bins `handshake-mcp`, `handshake-protocol-kernel`.
- Implementation: `src/mcp/stdio/server.ts`, entry `src/mcp/stdio/entry.ts` → bundled `dist/bin/handshake-mcp.mjs`.
- Tool surface: `handshake.actions.x402_payment.propose` and read-only resources (`src/mcp/catalog.ts`, `src/mcp/resources.ts`).
- Client proof: `handshake mcp doctor --stdio` uses `@modelcontextprotocol/client` (`src/mcp/stdio/process-proof.ts`).
- Auth: no hosted MCP authority; proposal/evidence only per `README.md` and `AGENTS.md` doctrine.

**Hosted identity (adapter contract, not bundled IdP SDK):**
- Provider kinds accepted by verifier adapters: `clerk`, `oauth_oidc`, `cloudflare_access`, `custom_jwt`, `service_credential`, `test_fixture`, `other` (`src/hosted-admission/hosted-caller-identity.ts`).
- Integration pattern: implement `HostedVerifierAdapter` in `src/hosted-admission/hosted-verifier-adapter.ts`; consume via `createHostedCallerVerifierFromAdapter` exported from `handshake-protocol-kernel/hosted-admission`.
- HTTP wiring: `authMode: "hosted"` on `createApp()` options (`src/http/app-options.ts`); hosted readiness handler `src/http/handlers/hosted-readiness.ts`.
- Auth: redacted caller identity evidence only; provider sessions, raw claims persistence, and org/workspace IDs do not authorize protected actions (`README.md`, `src/hosted-admission/LANE.md`).

**auth.md protected API call (adjacent adapter profile):**
- Profile: `auth_md_protected_api_call.exact.v0` in `src/adapters/auth-md/action-proposal.ts`.
- Usage: OAuth/authorization-server metadata and gateway credential refs as provenance for protected HTTP API calls; interlock with x402 in `src/adapters/auth-md-x402-interlock/`.
- Auth: registration and OAuth scopes are provenance only; Handshake policy + gateway check still required.

**Engineering-agent host runtimes (activation/readiness evidence, not enforcement):**
- Host profiles and activation transcripts for Codex, Claude Code, Hermes, OpenClaw, generic MCP — `src/adapters/x402-payment/protected-tool-profile/`, proof packets `src/surfaces/proof-packets/codex-host-activation.ts`, scripts `scripts/check-codex-host-activation.mjs`, `scripts/install-codex-host-activation.mjs`.
- CLI: `handshake host doctor --host <profile>` (`src/cli/host/doctor.ts`).
- Integration: documents wrapper targets and raw sibling bypass posture; does not read or mutate live host config.

## Data Storage

**Databases:**
- Cloudflare D1 (SQLite at edge)
  - Binding: `DB` in `wrangler.toml`
  - Client: `D1ProtocolStore` in `src/storage/d1/index.ts`
  - Schema: `migrations/0001_protocol_kernel.sql`
  - Resolution: `src/http/store/resolution.ts` requires D1 or injected ephemeral store for stateful HTTP routes.

**Ephemeral / test storage:**
- `InMemoryProtocolStore` in `src/storage/memory/` — tests and `allowEphemeralStore` app option (`src/http/app.ts`).

**Caching:**
- Cloudflare KV namespace `CACHE` — isolation state snapshot cache via `KvIsolationCache` in `src/storage/kv/index.ts`; optional; D1 remains authoritative for commits.

**Local filesystem (CLI operator state, not protocol authority):**
- Project marker: `.handshake/project.json` (`src/cli/local-project/index.ts`).
- State dir: `$XDG_STATE_HOME/handshake` or `~/.local/state/handshake` for local x402 readiness/install artifacts.
- Demo outputs: `examples/*/output/`, quickstart dossiers written by `handshake quickstart x402` / `handshake demo x402`.

## Authentication & Identity

**Worker transition custody (local/hosted HTTP):**
- Role-scoped bearer tokens bound to Worker secrets or `CallerAuthTokens` in app options (`src/http/admission/caller-auth.ts`):
  - `HANDSHAKE_CONTROL_PLANE_TOKEN`
  - `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`
  - `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`
  - `HANDSHAKE_REVIEW_CUSTODY_TOKEN`
- Roles map in `src/hosted-admission/roles.ts`; admission orchestration in `src/http/admission/`.

**Hosted caller verification:**
- Custom adapter implements `verify()` returning redacted claims; fails closed on non-current membership (`src/hosted-admission/hosted-verifier-adapter.ts`).
- Supported verification postures: `provider_sdk_verified`, `provider_jwks_verified`, `provider_webhook_verified`, `service_credential_verified`, `fixture_verified`, `custom_verified`.

**Request context headers (non-auth):**
- `x-handshake-protocol-version`, `x-handshake-request-identity`, `x-handshake-originating-identity` (`src/http/admission/request-context.ts`).

**Authority certificate verifier (hosted read path):**
- JWKS/metadata/status handlers in `src/http/handlers/verifier.ts` for terminal certificate verification material supplied via `AppOptions`.

## Monitoring & Observability

**Error Tracking:**
- Not detected (no Sentry/Datadog/etc. dependencies in `package.json`).

**Logs:**
- Worker/CLI: structured JSON error envelopes via `transitionErrorResult` (`src/http/errors/transition-error-envelope.ts`); CLI commands generally JSON-first (`src/cli/output.ts`).
- ESLint restricts `console` to warn/error in `src/` and `test/`.

**Proof / release telemetry (repo-local, not SaaS):**
- Proof packets under `src/surfaces/proof-packets/` (distribution, product completion, live x402, host activation, npm maintainer posture).
- Gate scripts write or assert JSON proof artifacts (`scripts/check-product-completion.mjs`, `scripts/build-publish-handoff-packet.mjs`).

## CI/CD & Deployment

**Hosting:**
- Cloudflare Workers for HTTP protocol kernel API (`wrangler.toml`, `src/worker.ts`).
- npm registry for installable package `handshake-protocol-kernel` (CLI, SDK, MCP stdio server).

**CI Pipeline:**
- GitHub Actions workflow `.github/workflows/check.yml` on push/PR.
- Steps: checkout → `oven-sh/setup-bun@v2` (1.3.9) → `bun install --frozen-lockfile` → `npm run check:repo`.
- `check:repo` chains build, typecheck, lint, prettier check, full test suite, and `pack:check` release surface proofs.

**Release / distribution checks (Node scripts, not CI-only):**
- `scripts/check-published-entrypoints.mjs`, `scripts/check-package-surface.mjs`, `scripts/check-release-proof.mjs`, `scripts/check-npm-maintainer-posture.mjs`, `scripts/check-clean-installed-activation.mjs`, `scripts/build-publish-handoff-packet.mjs`.

## Environment Configuration

**Worker bindings (configure in Cloudflare dashboard / Wrangler secrets, not in repo):**
- `DB` — D1 database binding (required for durable hosted routes).
- `CACHE` — KV namespace (optional isolation cache).
- `HANDSHAKE_CONTROL_PLANE_TOKEN`, `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`, `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`, `HANDSHAKE_REVIEW_CUSTODY_TOKEN` — transition route custody.
- Hosted-mode secrets referenced in tests as patterns only (e.g. `HANDSHAKE_HOSTED_TEST_SECRET` in `test/http/http.test.ts`); treat as operator-supplied, never commit values.

**Local / CLI (operator machine):**
- Project cwd and `.handshake/` tree for install/probe/readiness JSON consumed by x402 CLI commands.
- `XDG_STATE_HOME` overrides local state root for Handshake CLI artifacts.
- Live x402 proof scripts accept `--input-file` evidence paths (`scripts/check-live-x402-paid-retry.mjs`); missing file → blocked proof status.

**Package / MCP metadata (committed, non-secret):**
- `package.json` version and `server.json` version must stay aligned for MCP Registry publication checks (`scripts/check-release-proof.mjs`).

**Secrets location:**
- Cloudflare Worker secrets and local operator credential material stay outside the repo; `.env` may exist locally but must not be read or quoted in docs/commits.

## Webhooks & Callbacks

**Incoming:**
- HTTP transition and evidence-read routes on Worker app (`src/http/routes/transition-route-registry.ts`, `src/http/routes/evidence-read-route-registry.ts`).
- OpenAPI document served from `src/http/openapi` (referenced in `src/http/app.ts`).
- No generic public webhook receiver detected beyond protocol HTTP API.

**Outgoing:**
- x402 gateway HTTP retries via `@x402/core` client after verified gateway check (`src/adapters/x402-payment/wallet-gateway.ts`).
- MCP stdio subprocess spawn for local doctor/proof flows only.
- npm registry readback commands in release scripts (`npm view`, maintainer posture) — operator/CI invoked, not runtime hot path.

## Integration Boundaries (prescriptive)

When adding a new external integration:

1. Place protocol meaning in `src/protocol/`; wire transport in `src/http/` or `src/adapters/`.
2. Do not let provider SDKs, MCP tools, or CLI commands issue greenlights, gateway checks, or mutations.
3. Record proof gaps explicitly in `src/surfaces/proof-packets/` rather than implying production operation.
4. For identity, extend `HostedIdentityProviderKind` and adapter verification postures in `src/hosted-admission/` instead of importing authority into product surfaces.
5. For payments, keep the wedge on `x402_payment.exact` until a second action family passes the expansion gates in `STRUCTURE.md` and `docs/internal/decisions.md`.

---

*Integration audit: 2026-05-28*
