# External Integrations

**Analysis Date:** 2026-05-24

## Closeout Remap: 2026-05-24 External Boundary State

Remapped at commit `b3635c5`.

Current external-posture facts:

- x402 remains one buyer-side `exact` per-call proof wedge. Local/reference
  challenge and signed-retry evidence is post-gate fixture evidence only.
- npm and MCP Registry are publication/discoverability surfaces. Source now
  separates `ready_to_publish`, `actually_published`, and
  `registry_discoverable` through `PackageReleaseProof`; actual npm publish and
  MCP Registry discoverability are not claimed by local source gates.
- Hosted verifier/admission code is local foundation and configured-readiness
  posture. It does not prove production hosted readiness, remote JWKS trust
  fetching, cross-org trust, live revocation authority, or hosted mutation
  authority.
- D1 remains the structured durable store path; KV remains non-authoritative
  cache/posture unless a future source change promotes it with explicit
  consistency and audit limits.

## APIs & External Services

**Cloudflare Worker Runtime:**
- Cloudflare Workers - Hosts the protocol HTTP app from `src/worker.ts` and `src/http/app.ts`.
  - SDK/Client: `wrangler` ^4.92.0 and `@cloudflare/workers-types` ^4.20260517.1 from `package.json`.
  - Auth: Transition bearer token bindings in `src/http/admission/caller-auth.ts`: `HANDSHAKE_CONTROL_PLANE_TOKEN`, `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`, `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`, and `HANDSHAKE_REVIEW_CUSTODY_TOKEN`.
  - Config: `wrangler.toml` declares Worker name `handshake-protocol-kernel`, main `src/worker.ts`, D1 binding `DB`, and KV binding `CACHE`.

**x402 Payment Protocol:**
- x402 official buyer-side exact SDK - Used for the local/reference `x402_payment.exact` protected-spend proof path.
  - SDK/Client: `@x402/core` 2.12.0, `@x402/evm` 2.12.0, and `@x402/fetch` 2.12.0 in `package.json`.
  - Implementation: `src/adapters/x402-payment/upstream-evidence.ts`, `src/adapters/x402-payment/action-proposal.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, and `src/adapters/x402-payment/sandbox-http.ts`.
  - Auth: No x402 secret env var is read by the source. Signing is injected through `ClientEvmSigner` in `src/adapters/x402-payment/wallet-gateway.ts` and must remain gateway-held; generated runtime/MCP/CLI surfaces must not receive raw signer, PaymentPayload, or `PAYMENT-SIGNATURE` material.
  - Current scope: one local/reference buyer-side `exact` per-call path. Unsupported surfaces remain outside the first wedge: facilitator operation, seller middleware, `upto`, batch settlement, MCP auto-pay, signed offers, signed receipts, and spend-window ledger enforcement.

**MCP Local Stdio:**
- Model Context Protocol - Local stdio proposal/evidence server for x402 candidate inspection.
  - SDK/Client: `@modelcontextprotocol/server` and `@modelcontextprotocol/client` 2.0.0-alpha.2 in `package.json`.
  - Server: `src/mcp/stdio/server.ts` and `src/mcp/stdio/entry.ts`.
  - Registry metadata: `server.json` and `package.json#mcpName`.
  - Tool surface: `src/mcp/catalog.ts` exposes `handshake.actions.x402_payment.propose`.
  - Auth: Not an enforcement auth boundary. MCP can propose action contracts through a runtime client and read redacted evidence resources; it does not create policy decisions, greenlights, gateway checks, mutations, receipt exports, authority certificates, hosted operation, or provider custody.

**npm / MCP Registry Publication:**
- npm package registry - Package is shaped for publication as `handshake-protocol-kernel` version `0.2.4`.
  - SDK/Client: npm CLI via `scripts/check-package-surface.mjs`; Node runtime via `scripts/check-published-entrypoints.mjs`.
  - Auth: Registry authentication is external to the repo. No `.npmrc` contents are read or documented.
  - Checks: `scripts/check-package-surface.mjs` runs `npm pack --dry-run --json`; `scripts/check-published-entrypoints.mjs` checks bin execution and MCP stdio behavior.
- MCP Registry - Source-owned server metadata only.
  - Config: `server.json` uses schema `https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json` and npm/stdio package metadata.
  - Auth: MCP Registry namespace authentication is external and not present in source.

**auth.md / OAuth Metadata Profiles:**
- auth.md registered credential/profile modeling - Represents protected-resource metadata, authorization-server metadata, gateway credential refs, credential lifecycle evidence, and protected API call action contracts.
  - SDK/Client: No provider SDK detected; schemas and reference gateway live in `src/adapters/auth-md/profiles.ts`, `src/adapters/auth-md/action-proposal.ts`, `src/adapters/auth-md/gateway.ts`, and `src/adapters/auth-md/revocation.ts`.
  - Auth: Gateway credential refs and digests are modeled in `src/protocol/areas/credential-custody/**`; raw credential material is rejected/redacted by `src/adapters/auth-md/profiles.ts`.
  - Boundary: auth.md adapter code is an action/evidence/gateway fixture surface, not a managed identity-provider integration.

**HTTP Client Surfaces:**
- Handshake protocol HTTP client - Typed local/remote client for protocol transition and evidence routes.
  - SDK/Client: `src/sdk/client.ts`, `src/sdk/surface-clients/runtime-client.ts`, `src/sdk/surface-clients/evidence-client.ts`, and `src/sdk/surface-clients/transport.ts`.
  - Auth: Bearer role credentials supplied through `HandshakeClientOptions.transitionToken`, `HandshakeClientOptions.transitionTokens`, or role-scoped `roleCredential`; header construction is in `src/sdk/client.ts` and `src/sdk/surface-clients/transport.ts`.
  - Boundary: Runtime and evidence clients submit/read records; gateway enforcement still occurs only through gateway custody routes and adapter gateway checks.

**CI Service:**
- GitHub Actions - Runs the repository quality gate.
  - Config: `.github/workflows/check.yml`.
  - Auth: Not detected in source.
  - Commands: `bun install --frozen-lockfile` then `npm run check:repo`.

## Data Storage

**Databases:**
- Cloudflare D1 - Durable reconstruction source for protocol records, stream events, greenlight consumptions, idempotency ledger current state, isolation state, protected path posture, protected surface operation claims, and receipt indexes.
  - Connection: Worker binding `DB` in `wrangler.toml` and `src/http/app-options.ts`.
  - Client: `D1ProtocolStore` in `src/storage/d1/index.ts` and SQL builders in `src/storage/d1/statements.ts`.
  - Schema: `migrations/0001_protocol_kernel.sql`.
- In-memory store - Test/demo fixture and invariant oracle.
  - Connection: Constructor injection or `allowEphemeralStore` in `src/http/app.ts`.
  - Client: `InMemoryProtocolStore` in `src/storage/memory/index.ts`.

**File Storage:**
- Local example outputs - `examples/x402-protected-spend/output/latest.json`, `examples/x402-protected-spend/output/latest.md`, `examples/self-hosted-activation/output/*`, and `examples/mcp-reference-transcript/output/*`.
- Local CLI project state - `.handshake/project.json` plus external state refs under `XDG_STATE_HOME` or `~/.local/state/handshake` from `src/cli/local-project/index.ts`.
- Package artifacts - `dist/**` bundles/declarations generated by `npm run build`.

**Caching:**
- Cloudflare KV - Isolation cache posture only, not authority or durable truth.
  - Connection: Worker binding `CACHE` in `wrangler.toml` and `src/http/app-options.ts`.
  - Client: `KvIsolationCache` and `NoopIsolationCache` in `src/storage/kv/index.ts`.

## Authentication & Identity

**Auth Provider:**
- Local bearer-token admission - Custom role-bound transition admission.
  - Implementation: `src/http/admission/caller-auth.ts`.
  - Roles: `control_plane`, `runtime_evidence`, `gateway_custody`, and `review_custody`.
  - Env vars: `HANDSHAKE_CONTROL_PLANE_TOKEN`, `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`, `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`, and `HANDSHAKE_REVIEW_CUSTODY_TOKEN`.
- Hosted caller verifier - Pluggable server-side verifier interface.
  - Implementation: `HostedCallerVerifier` and `TransitionCallerIdentitySchema` in `src/http/admission/hosted-caller-identity.ts`.
  - Config: `AppOptions.authMode: "hosted"` and `AppOptions.hostedCallerVerifier` in `src/http/app-options.ts`.
  - Provider: Not detected; the repo defines the interface and evidence shape only.
- Role-scoped SDK credentials - Client-supplied bearer role credentials.
  - Implementation: `src/sdk/surface-clients/transport.ts`.
  - Boundary: SDK credentials authenticate transition/evidence calls; they do not convert runtime proposals into authority without policy and gateway checks.

## Monitoring & Observability

**Error Tracking:**
- None detected. No Sentry, Datadog, OpenTelemetry, Honeycomb, or similar dependency appears in `package.json`.

**Logs:**
- No external log service detected.
- HTTP errors are structured as transition error envelopes in `src/http/errors/transition-error-envelope.ts`.
- Protocol observability is modeled as durable evidence records, redacted projections, receipts, refusals, proof gaps, and AuthorityCertificate verification under `src/protocol/**` and `src/protocol/evidence-projections/**`.
- ESLint permits `console.warn` and `console.error` only, configured in `eslint.config.js`.

## CI/CD & Deployment

**Hosting:**
- Cloudflare Workers is configured by `wrangler.toml`.
- The repo does not prove hosted operation. `README.md` explicitly frames the current state as local kernel foundation and local/reference x402 proof paths.

**CI Pipeline:**
- GitHub Actions in `.github/workflows/check.yml`.
- CI installs Bun `1.3.9`, runs `bun install --frozen-lockfile`, then `npm run check:repo`.

**Package Release Gate:**
- `npm run pack:check` in `package.json` runs `npm run build`, `scripts/check-package-surface.mjs`, and `scripts/check-published-entrypoints.mjs`.
- `scripts/check-published-entrypoints.mjs` asserts:
  - `package.json#mcpName` matches `server.json#name`;
  - `server.json` version/package metadata matches `package.json`;
  - `bin/handshake` and `bin/handshake-mcp` are Node executables;
  - CLI `schema` output creates no authority, greenlight, gateway check, mutation, raw internal records, or credential material;
  - MCP lists only `handshake.actions.x402_payment.propose` and returns non-authority proposal output.

## Environment Configuration

**Required env vars:**
- Worker transition auth, when using local bearer admission:
  - `HANDSHAKE_CONTROL_PLANE_TOKEN`
  - `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`
  - `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`
  - `HANDSHAKE_REVIEW_CUSTODY_TOKEN`
- Worker resource bindings:
  - `DB` for Cloudflare D1
  - `CACHE` for Cloudflare KV cache posture
- Optional local CLI state:
  - `XDG_STATE_HOME` controls the base for external Handshake local state refs in `src/cli/local-project/index.ts`.

**Secrets location:**
- Not stored in repo.
- `.env` files are not detected in the top three directory levels.
- Cloudflare Worker secrets should live in platform bindings; local callers can inject tokens through `AppOptions.callerAuthTokens` in `src/http/app-options.ts` or SDK options in `src/sdk/client.ts` and `src/sdk/surface-clients/transport.ts`.
- npm and MCP Registry credentials are external to this checkout; no registry secret file is read or documented.

## Webhooks & Callbacks

**Incoming:**
- No webhook endpoints detected.
- Incoming HTTP routes are protocol transition/evidence endpoints registered through `src/http/routes/transition-route-registry.ts` and `src/http/routes/evidence-read-route-registry.ts`, plus `/health`, `/openapi.json`, and `/v0.2/records/:objectType/:objectId` in `src/http/app.ts`.
- MCP incoming calls are stdio tool/resource requests handled by `src/mcp/stdio/server.ts`, not webhook callbacks.

**Outgoing:**
- No production webhook/callback integration detected.
- `src/sdk/client.ts` and role-scoped clients use `fetch` to a configured Handshake base URL.
- Reference gateway adapters call injected surfaces:
  - package install surface in `src/adapters/package-install/gateway.ts`;
  - repo-write surface in `src/adapters/repo-write/gateway.ts`;
  - preview deploy surface in `src/adapters/preview-deploy/gateway.ts`;
  - auth.md protected API call surface in `src/adapters/auth-md/gateway.ts`;
  - x402 signing surface in `src/adapters/x402-payment/wallet-gateway.ts`.
- The current x402 demo uses a local/reference sandbox in `src/adapters/x402-payment/sandbox-http.ts` and `examples/x402-protected-spend/run.ts`; this is local evidence only, not facilitator operation or live provider custody.

## Current Integration Boundary Notes

**CLI/MCP:**
- `src/cli/output.ts` and `src/mcp/catalog.ts` mark CLI/MCP surfaces as non-authority. They can expose command manifests, local install/probe posture, redacted evidence, certificate verification, MCP metadata, and x402 action-contract proposal output.
- CLI/MCP are not policy evaluators, greenlight issuers, gateway checks, mutation paths, receipt exporters, authority-certificate minters, credential custody holders, or hosted enforcement gates.

**x402:**
- Current source and dirty worktree state include local/reference x402 paid-HTTP sandbox evidence in `src/adapters/x402-payment/sandbox-http.ts`, official x402 gateway signing in `src/adapters/x402-payment/wallet-gateway.ts`, runtime proposal binding in `src/adapters/x402-payment/action-proposal.ts`, and the buyer-readable APS demo in `examples/x402-protected-spend/run.ts`.
- Per-call x402 amount bounds are enforced before proposal/signing. Session/day/review spend windows are not backed by a ledger in `migrations/0001_protocol_kernel.sql` or `src/protocol/areas/**`.

**Storage:**
- D1 is durable reconstruction truth for the reference implementation.
- KV is cache posture only and must not be treated as authority.
- Local example output files are evidence artifacts for demos/tests, not production storage.

---

*Integration audit: 2026-05-24*
