# External Integrations

**Analysis Date:** 2026-05-24

## APIs & External Services

**Cloudflare Runtime:**
- Cloudflare Workers - Configured Worker host shape for the HTTP protocol surface.
  - SDK/Client: `wrangler` 4.92.0 and `@cloudflare/workers-types` 4.20260517.1.
  - Auth: role bearer bindings in `src/http/admission/caller-auth.ts`; D1/KV bindings in `wrangler.toml`.
  - Source: `src/worker.ts`, `src/http/app.ts`, `src/http/store/resolution.ts`, `wrangler.toml`.
  - Claim boundary: configured local/reference Worker shape only; tracked canon does not claim hosted operation.

**x402:**
- x402 Foundation SDKs - Used for official buyer-side exact payment evidence and gateway-held signing in the local protected-spend lane.
  - SDK/Client: `@x402/core`, `@x402/evm`, and `@x402/fetch` at 2.12.0.
  - Auth: no env var; signer custody is represented as gateway-held or fixture gateway-held in `src/adapters/x402-payment/install-proposal.ts` and used after verified gate in `src/adapters/x402-payment/wallet-gateway.ts`.
  - Source: `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/upstream-evidence.ts`, `test/conformance/x402-upstream-exact-fixtures.test.ts`, `examples/x402-protected-spend/README.md`.
  - Claim boundary: local/reference official `exact` buyer-side proof only. No live provider custody, facilitator operation, seller middleware, `upto`, batch settlement, marketplace/certification, or spend-window ledger enforcement.

**Model Context Protocol:**
- MCP TypeScript SDK - Used for a source-owned local stdio proposal/evidence process proof.
  - SDK/Client: `@modelcontextprotocol/client` 2.0.0-alpha.2 and `@modelcontextprotocol/server` 2.0.0-alpha.2.
  - Auth: none in the stdio proof; MCP inputs are schema-validated and bridged to role-scoped runtime/evidence clients.
  - Source: `src/mcp/catalog.ts`, `src/mcp/x402-proposal.ts`, `src/mcp/resources.ts`, `src/mcp/stdio/server.ts`, `src/mcp/stdio/process-proof.ts`.
  - Claim boundary: MCP is proposal/evidence posture only. It does not create policy, greenlights, gateway checks, mutation, receipt export, certificate minting, provider custody, or broad MCP interception.

**HTTP Protocol Surface:**
- Hono Worker API - Local/reference HTTP transition and evidence-read routes.
  - SDK/Client: `hono` 4.12.19; typed clients in `src/sdk/client.ts` and `src/sdk/surface-clients/*`.
  - Auth: bearer role tokens for `control_plane`, `runtime_evidence`, `gateway_custody`, and `review_custody`.
  - Source: `src/http/app.ts`, `src/http/routes/transition-route-registry.ts`, `src/http/routes/evidence-read-route-registry.ts`, `src/sdk/client.ts`, `src/sdk/surface-clients/runtime-client.ts`, `src/sdk/surface-clients/evidence-client.ts`.
  - Claim boundary: transport/admission seam only; it does not prove hosted org auth, provider enforcement, or customer gateway installation.

**auth.md / OAuth Metadata Reference Profile:**
- auth.md protected-resource and authorization-server metadata - Experimental reference adapter profile for protected API calls.
  - SDK/Client: no external provider SDK detected; schemas and evidence normalization are local TypeScript/Zod.
  - Auth: opaque `GatewayCredentialRef` and post-gate `CredentialResolutionEvidence`, not raw credential exposure.
  - Source: `src/adapters/auth-md/profiles.ts`, `src/adapters/auth-md/action-proposal.ts`, `src/adapters/auth-md/gateway.ts`, `src/adapters/auth-md/revocation.ts`, `src/adapters/auth-md/bypass-probes.ts`, `test/integration/auth-md-protected-call.test.ts`.
  - Claim boundary: reference profile only. The repo does not become an auth provider, OAuth server, WorkOS replacement, certification body, generic API gateway, or provider-side enforcement surface.

**Package Registry / Supply Chain Reference Lane:**
- npm-style package registry references - Package-install adapter binds package manager, registry, manifest, lockfile, flags, lifecycle policy, and resolved material evidence before mutation.
  - SDK/Client: no package-manager SDK client; local adapter schemas and fixture surfaces in `src/adapters/package-install/gateway.ts` and `src/runtime/package-install/action-proposal.ts`.
  - Auth: gateway check before mutation; no registry credential integration detected.
  - Claim boundary: local parameter binding/regression fixture only, not external package-material attestation.

## Data Storage

**Databases:**
- Cloudflare D1
  - Connection: Worker binding `DB` in `wrangler.toml`; typed as `D1Database` in `src/http/app-options.ts`.
  - Client: `D1ProtocolStore` in `src/storage/d1/index.ts` with statements in `src/storage/d1/statements.ts`.
  - Schema: `migrations/0001_protocol_kernel.sql`.
  - Role: durable reconstruction source for reference protocol records, stream events, greenlight consumption, idempotency ledger, protected-path posture, isolation state, receipt lookup, and operation claims.

**File Storage:**
- Local filesystem for demo artifacts and CLI project posture.
  - Demo outputs: `examples/x402-protected-spend/output/latest.md`, `examples/x402-protected-spend/output/latest.json`, `examples/self-hosted-activation/output/latest.md`, `examples/self-hosted-activation/output/latest.json`, `examples/mcp-reference-transcript/output/latest.md`, and `examples/mcp-reference-transcript/output/latest.json`.
  - CLI local project state: `.handshake/project.json` and external local posture refs described in `src/cli/command-manifest.ts`.

**Caching:**
- Cloudflare KV
  - Binding: `CACHE` in `wrangler.toml`; typed as `KVNamespace` in `src/http/app-options.ts`.
  - Client: `KvIsolationCache` in `src/storage/kv/index.ts`.
  - Claim boundary: KV is cache posture only; `docs/internal/protocol-notes.md` says it cannot become authority.
- In-memory store
  - Client: `InMemoryProtocolStore` in `src/storage/memory/index.ts`.
  - Claim boundary: fixture/test store and invariant oracle, not production durability.

## Authentication & Identity

**Auth Provider:**
- Custom role bearer tokens
  - Implementation: `authorizeTransitionCaller()` and `authorizeTransitionCallerForAny()` in `src/http/admission/caller-auth.ts`.
  - Required bindings: `HANDSHAKE_CONTROL_PLANE_TOKEN`, `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`, `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`, `HANDSHAKE_REVIEW_CUSTODY_TOKEN`.
  - Client usage: `src/sdk/client.ts` and `src/sdk/surface-clients/transport.ts` attach bearer credentials per role.

**Hosted Identity Seam:**
- Provider-agnostic hosted caller verification
  - Implementation: `HostedCallerVerifier` and `TransitionCallerIdentitySchema` in `src/http/admission/hosted-caller-identity.ts`.
  - Claim boundary: seam only. No Clerk, WorkOS, OIDC provider, live RBAC, revocation service, or hosted identity provider integration is detected.

**Gateway Credential Custody:**
- Provider-neutral credential references
  - Implementation: `src/protocol/areas/credential-custody/*`, auth.md gateway usage in `src/adapters/auth-md/gateway.ts`, and x402 signer posture in `src/adapters/x402-payment/install-proposal.ts`.
  - Claim boundary: opaque refs/digests and post-gate redacted evidence only. No provider secret retrieval API or live vault SDK is present.

## Monitoring & Observability

**Error Tracking:**
- None detected. No Sentry, Datadog, OpenTelemetry, Honeycomb, Logflare, or similar dependency appears in `package.json` or source imports.

**Logs:**
- Console logging is restricted by `eslint.config.js` to `console.warn` and `console.error`.
- Operational evidence is modeled as protocol records, refusals, proof gaps, projections, and receipts under `src/protocol/areas/*` and `src/protocol/evidence-projections/*`, not as external log aggregation.

## CI/CD & Deployment

**Hosting:**
- Configured target: Cloudflare Worker with D1/KV bindings in `wrangler.toml`.
- Source entrypoint: `src/worker.ts`.
- Claim boundary: no deploy script or production environment config proves hosted operation; `npm run dev` is local Wrangler development.

**CI Pipeline:**
- GitHub Actions
  - Workflow: `.github/workflows/check.yml`.
  - Runtime setup: `oven-sh/setup-bun@v2` with Bun 1.3.9.
  - Gate: `bun install --frozen-lockfile` then `npm run check:repo`.

**Repo Command Gates:**
- Full gate: `npm run check:repo` in `package.json`.
- Gate expansion: `npm run check:types`, `npm run lint`, `npm run format:check`, `npm run test`, `npm run pack:check`, and `git diff --check`.
- Focused gates: `npm run quality:architecture`, `npm run quality:storage`, and `npm run quality:claims`.
- Package surface gate: `scripts/check-package-surface.mjs` runs `npm pack --dry-run --json` and rejects `.planning/`, `.agents/`, tests, deleted doc trees, and workspace metadata from the package surface.
- Published entrypoint gate: `scripts/check-published-entrypoints.mjs` verifies `package.json#mcpName`, `server.json`, CLI/MCP bins, Node bundles, `node bin/handshake schema`, and `node bin/handshake-mcp` through the official MCP client SDK.

**Package Publication Metadata:**
- npm package
  - Identifier: `handshake-protocol-kernel`.
  - Current external registry check: `npm view handshake-protocol-kernel version` returned `E404 Not Found` on 2026-05-24 after network escalation, so the name was not occupied in the public npm registry at verification time.
  - Claim boundary: source is package-ready; actual npm publish requires owner authentication.
- MCP Registry metadata
  - Server name: `io.github.joelchan/handshake-protocol-kernel`.
  - Source: `server.json` and `package.json#mcpName`.
  - Package transport: npm + stdio.
  - Claim boundary: source metadata is ready; actual MCP Registry publish requires namespace authentication and package availability in public npm.

## Environment Configuration

**Required env vars / bindings:**
- `DB` - Cloudflare D1 binding in `wrangler.toml`; required for durable HTTP protocol state unless an explicit ephemeral test store is injected.
- `CACHE` - Cloudflare KV binding in `wrangler.toml`; optional cache posture for isolation state.
- `HANDSHAKE_CONTROL_PLANE_TOKEN` - Control-plane transition custody token in `src/http/admission/caller-auth.ts`.
- `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN` - Runtime evidence transition custody token in `src/http/admission/caller-auth.ts`.
- `HANDSHAKE_GATEWAY_CUSTODY_TOKEN` - Gateway custody transition token in `src/http/admission/caller-auth.ts`.
- `HANDSHAKE_REVIEW_CUSTODY_TOKEN` - Review/evidence-read custody token in `src/http/admission/caller-auth.ts`.
- `XDG_STATE_HOME` - Optional local CLI state base in `src/cli/local-project/index.ts`; defaults to the user's local state directory when unset.

**Secrets location:**
- No `.env*` files were detected at repo root.
- Secrets are expected as Cloudflare Worker bindings or externally supplied role credentials. The repo deliberately exposes refs/digests rather than raw credential material in credential custody and evidence projections.

## Webhooks & Callbacks

**Incoming:**
- Hono HTTP routes under `/v0.2/*` are generated from route registries in `src/http/routes/transition-route-registry.ts` and `src/http/routes/evidence-read-route-registry.ts`.
- Health and OpenAPI routes are exposed by `src/http/app.ts` at `/health` and `/openapi.json`.
- MCP stdio is local process transport in `src/mcp/stdio/server.ts`; it is not an incoming hosted HTTP webhook.

**Outgoing:**
- x402 official SDK payment signing is performed by a gateway-held signing surface after verified gate in `src/adapters/x402-payment/wallet-gateway.ts`; downstream payment response/facilitator evidence remains reference evidence or proof-gap posture.
- Adapter mutation surfaces are injected interfaces: `PackageInstallMutationSurface` in `src/adapters/package-install/gateway.ts`, `RepoWriteMutationSurface` in `src/adapters/repo-write/gateway.ts`, `PreviewDeploySurface` in `src/adapters/preview-deploy/gateway.ts`, `X402WalletSigningSurface` in `src/adapters/x402-payment/wallet-gateway.ts`, and `AuthMdProtectedApiCallSurface` in `src/adapters/auth-md/gateway.ts`.
- No live third-party webhook callback receiver, facilitator callback, payment settlement callback, deploy provider callback, package-registry callback, or external monitoring callback is detected.

## Local/Reference Versus Hosted Claims

**Local/reference claims currently supported by source and tests:**
- D1/HTTP durable evidence path for the protocol kernel via `src/storage/d1/index.ts`, `src/http/app.ts`, and `test/http/d1-http.test.ts`.
- Local x402 protected-spend proof through runtime proposal, policy, gateway check, signer fixture, redacted evidence, replay refusal, and proof-gap posture via `examples/x402-protected-spend/run.ts` and `test/integration/x402-d1-http.test.ts`.
- Local MCP stdio process proof through official MCP SDKs via `src/mcp/stdio/process-proof.ts` and `test/mcp/mcp-stdio-process.test.ts`.
- Reference gateway fixtures for package install, repo write, preview deploy, x402 wallet signing, and auth.md protected API calls under `src/adapters/*`.

**Hosted/provider claims explicitly not supported by this checkout:**
- Hosted Handshake control plane operation.
- Provider-side x402 custody or facilitator operation.
- Broad x402 compatibility beyond the exact buyer-side first wedge.
- Live vault-provider credential lifecycle.
- Broad MCP, browser, shell, network, package-manager, or generated-tool-stream interception.
- Cross-org `AuthorityCertificate` trust, live JWKS, hosted verification, marketplace, certification, or conformance marks.
- Spend-window ledger enforcement beyond current per-call x402 bounds.

---

*Integration audit: 2026-05-24*
