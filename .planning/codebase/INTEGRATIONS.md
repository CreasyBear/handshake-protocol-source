# External Integrations

**Analysis Date:** 2026-05-22

## APIs & External Services

**Cloudflare Runtime:**
- Cloudflare Workers - HTTP runtime for the protocol kernel.
  - SDK/Client: `wrangler`, `@cloudflare/workers-types`, Hono app exported from `src/worker.ts` and `src/http/app.ts`.
  - Auth: role-scoped bearer token bindings in `src/http/admission/caller-auth.ts`.
  - Config: `wrangler.toml` declares `main`, `compatibility_date`, D1 binding `DB`, and KV binding `CACHE`.

**x402 Payment Proof Profile:**
- x402 official packages - used for the local buyer-side exact payment proof path.
  - SDK/Client: `@x402/core`, `@x402/evm`, and dev-only parity coverage through `@x402/fetch`.
  - Auth: gateway-held signer boundary modeled through `src/adapters/x402-payment/wallet-gateway.ts`; raw signer material is not exposed through protocol records.
  - Scope: `src/adapters/x402-payment/upstream-evidence.ts`, `src/adapters/x402-payment/action-proposal.ts`, `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/conformance.ts`, `examples/x402-protected-spend/run.ts`, and `test/integration/x402-d1-http.test.ts`.
  - Boundary: only `x402_payment.exact` per-call buyer-side proof is supported; `src/adapters/x402-payment/conformance.ts` classifies `upto`, batch settlement, lifecycle hooks, MCP auto-pay, signed offers, signed receipts, seller middleware, and facilitator operation as unsupported first-wedge surfaces.

**HTTP Protocol API:**
- Hono HTTP routes - local/Worker API for transition writes and redacted evidence reads.
  - SDK/Client: `HandshakeClient` in `src/sdk/client.ts`, role-scoped `RuntimeClient` in `src/sdk/surface-clients/runtime-client.ts`, and `EvidenceClient` in `src/sdk/surface-clients/evidence-client.ts`.
  - Auth: `Authorization: Bearer <token>` checked by `src/http/admission/caller-auth.ts`.
  - OpenAPI: `src/http/openapi/index.ts` emits `/openapi.json` from route schemas.

**MCP Surface:**
- Model-facing MCP catalog and proposal/resource helpers - source-owned schema surface, not a process-hosted MCP server.
  - SDK/Client: pure TypeScript exports from `src/mcp/index.ts`, `src/mcp/catalog.ts`, `src/mcp/resources.ts`, and `src/mcp/x402-proposal.ts`.
  - Auth: delegated to supplied `RuntimeClient` and `EvidenceClient` role credentials in `src/mcp/x402-proposal.ts` and `src/mcp/resources.ts`.
  - Boundary: `mcpCatalogSnapshot()` declares no authority created, no gateway check performed, no greenlight created, no mutation attempted, no credential material included, and no raw internal record included.

**CLI Surface:**
- Local command wrappers for schema, APS evidence, certificate verification, and x402 conformance.
  - SDK/Client: `src/cli/main.ts`, `src/cli/command-manifest.ts`, `src/cli/aps-report.ts`, `src/cli/certificate.ts`, and `src/cli/conformance.ts`.
  - Auth: no process-wide environment inheritance; `src/cli/command-manifest.ts` declares `childProcessEnvInheritance: "none"` for all commands.
  - Boundary: CLI commands cannot evaluate policy, perform gateway checks, mutate protected surfaces, hold credentials, expose raw records, or start processes according to `src/cli/command-manifest.ts`.

**Package Registry / Package Manager:**
- npm package dry-run - package surface check uses `npm pack --dry-run --json`.
  - SDK/Client: `scripts/check-package-surface.mjs`.
  - Auth: no `.npmrc` detected; script writes npm cache to `/tmp/handshake-npm-cache`.
- Package-install protected-action fixture - package manager and registry are bound as observed parameters, not external attestation.
  - SDK/Client: `src/adapters/package-install/gateway.ts`, `src/runtime/package-install/action-proposal.ts`, `test/adapters/package-install-gateway.test.ts`, and `test/integration/package-install-end-to-end.test.ts`.
  - Auth: gateway fixture owns mutation path; no package registry credential provider is detected.

## Data Storage

**Databases:**
- Cloudflare D1
  - Connection: Worker binding `DB` in `wrangler.toml` and `src/http/app-options.ts`.
  - Client: `D1ProtocolStore` in `src/storage/d1/index.ts`.
  - Schema: `migrations/0001_protocol_kernel.sql` defines `protocol_records`, `greenlight_consumptions`, `greenlight_issuances`, `idempotency_ledger_current`, `recovery_terminal_claims`, `protected_path_posture_current`, `isolation_state_current`, `protected_surface_operation_claim_current`, `receipt_by_mutation_attempt`, and `stream_events`.
- In-memory protocol store
  - Connection: injected fallback store or `allowEphemeralStore` in `src/http/app.ts`.
  - Client: `InMemoryProtocolStore` in `src/storage/memory/index.ts`.
  - Scope: tests, examples, and explicitly ephemeral local usage; `src/http/store/resolution.ts` refuses state endpoints without D1 or an injected ephemeral store.

**File Storage:**
- Local filesystem only for examples, CLI inputs, test fixtures, package dry-run, and generated demo output.
  - Paths: `examples/x402-protected-spend/run.ts`, `examples/x402-protected-spend/output/.gitignore`, `src/cli/command-manifest.ts`, `test/cli/cli-evidence.test.ts`, `test/support/repo-write-surface.ts`, and `scripts/check-package-surface.mjs`.

**Caching:**
- Cloudflare KV
  - Connection: Worker binding `CACHE` in `wrangler.toml` and `src/http/app-options.ts`.
  - Client: `KvIsolationCache` in `src/storage/kv/index.ts`.
  - Boundary: KV caches isolation state only; `migrations/0001_protocol_kernel.sql` and `docs/internal/protocol-notes.md` keep D1 as durable reconstruction truth.
- Noop cache
  - Client: `NoopIsolationCache` in `src/storage/kv/index.ts`.
  - Scope: local/test fallback.

## Authentication & Identity

**Auth Provider:**
- Local bearer-token custody by transition role.
  - Implementation: `src/http/admission/caller-auth.ts` maps roles to `HANDSHAKE_CONTROL_PLANE_TOKEN`, `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`, `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`, and `HANDSHAKE_REVIEW_CUSTODY_TOKEN`.
  - Roles: `control_plane`, `runtime_evidence`, `gateway_custody`, and `review_custody`.
  - Client: `src/sdk/client.ts` and `src/sdk/surface-clients/transport.ts` send role credentials as bearer tokens.
- Hosted caller verifier seam.
  - Implementation: `HostedCallerVerifier` and `TransitionCallerIdentitySchema` in `src/http/admission/hosted-caller-identity.ts`.
  - Provider: Not detected; the schema models `authProviderRef`, session/service credential digests, revocation epoch, tenant/org scope, and custody roles without importing Clerk, OIDC, JWT, JWKS, or other provider SDKs.
- Participant identity bindings.
  - Implementation: `OperatingEnvelope` participant identity bindings in `src/protocol/areas/catalog-envelope/schemas.ts` and documented in `docs/internal/protocol-definition.md`.
  - Boundary: evidence-only links to opaque principal/agent refs; they do not mint authority or replace gateway checks.

## Monitoring & Observability

**Error Tracking:**
- None detected.

**Logs:**
- No structured log service detected.
- ESLint blocks `console` except `console.warn` and `console.error` in `eslint.config.js`.
- Errors are returned as structured transition envelopes through `src/http/errors/transition-error-envelope.ts`.
- Evidence and reconstruction observability is modeled through protocol records, stream events, evidence projections, receipts, refusals, proof gaps, and AuthorityCertificate verification in `src/protocol/**`, `src/http/handlers/evidence-read.ts`, `src/protocol/evidence-projections/projections.ts`, and `src/protocol/areas/authority-certificate/verify.ts`.

## CI/CD & Deployment

**Hosting:**
- Cloudflare Workers target through `src/worker.ts` and `wrangler.toml`.
- D1 and KV bindings are configured in `wrangler.toml`.
- Hosted production operation is not established by this repo; canonical boundaries are documented in `README.md`, `docs/internal/decisions.md`, and `docs/internal/protocol-definition.md`.

**CI Pipeline:**
- GitHub Actions in `.github/workflows/check.yml`.
- CI installs Bun 1.3.9, runs `bun install --frozen-lockfile`, then runs `npm run check:repo`.
- Full gate in `package.json` includes typecheck, lint, format check, Bun tests, package surface check, and `git diff --check`.

## Environment Configuration

**Required env vars:**
- `DB` - Cloudflare D1 binding in `wrangler.toml` and `src/http/app-options.ts`.
- `CACHE` - Cloudflare KV binding in `wrangler.toml` and `src/http/app-options.ts`.
- `HANDSHAKE_CONTROL_PLANE_TOKEN` - control-plane transition bearer token in `src/http/admission/caller-auth.ts`.
- `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN` - runtime-evidence transition bearer token in `src/http/admission/caller-auth.ts`.
- `HANDSHAKE_GATEWAY_CUSTODY_TOKEN` - gateway-custody transition bearer token in `src/http/admission/caller-auth.ts`.
- `HANDSHAKE_REVIEW_CUSTODY_TOKEN` - review-custody transition bearer token in `src/http/admission/caller-auth.ts`.

**Secrets location:**
- No `.env`, `.npmrc`, `credentials.*`, `secrets.*`, or secret directory detected in the root-level scan.
- Secrets are represented as Worker bindings, bearer token bindings, opaque `GatewayCredentialRef` records, redacted `CredentialResolutionEvidence`, and gateway-held signer refs.
- Raw credential material is explicitly rejected or redacted by `src/protocol/areas/credential-custody/schemas.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, and x402 tests such as `test/conformance/x402-upstream-exact-fixtures.test.ts`.

## Webhooks & Callbacks

**Incoming:**
- HTTP transition routes under `/v0.2/*` in `src/http/routes/transition-route-registry.ts`.
- Evidence read routes under `/v0.2/evidence/*` in `src/http/routes/evidence-read-route-registry.ts`.
- Health and OpenAPI routes `/health` and `/openapi.json` in `src/http/app.ts`.
- Generic raw guarded record route `/v0.2/records/:objectType/:objectId` in `src/http/app.ts` and `src/http/handlers/internal-record-read.ts`.
- No third-party webhook receivers detected.

**Outgoing:**
- x402 official SDK payment payload and `PAYMENT-SIGNATURE` creation after verified gateway check in `src/adapters/x402-payment/wallet-gateway.ts`.
- SDK HTTP calls to configured Handshake base URLs in `src/sdk/client.ts` and `src/sdk/surface-clients/transport.ts`.
- npm dry-run command in `scripts/check-package-surface.mjs`.
- No outgoing webhook sender, hosted facilitator client, hosted verifier API, live JWKS/revocation client, external error tracker, cloud provider mutation SDK, database provider SDK, or package registry attestation client detected.

---

*Integration audit: 2026-05-22*
