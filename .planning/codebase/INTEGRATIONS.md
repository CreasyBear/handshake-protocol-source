# External Integrations

**Analysis Date:** 2026-05-25

## Integration Boundary Summary

Handshake currently integrates with external rails as evidence, proposal, transport, storage, and distribution surfaces. Those surfaces do not become authority by existing.

**Current enforcement boundary:**
- `src/protocol/areas/action-contract/` binds one exact proposed protected action.
- `src/protocol/areas/policy-greenlight/` evaluates one exact contract and may issue one-use `Greenlight` evidence.
- `src/protocol/areas/gateway-gate/` verifies exact greenlight binding before mutation.
- Mutation-capable adapter fixtures under `src/adapters/` run only after `VerifiedGatewayCheck`.
- Receipts, refusals, replay refusals, proof gaps, and terminal certificates are terminal evidence, not permission.

**Simplification mapping:**
- "Passport" is not an integration in the current codebase. External identity is carried as evidence-only `participantIdentityBindings` on `OperatingEnvelopeSchema` and `ActionContractSchema` in `src/protocol/areas/catalog-envelope/schemas.ts` and `src/protocol/areas/action-contract/schemas.ts`.
- "Admission" is HTTP transition/read custody in `src/http/admission/`. It gates who can write or read protocol records, not who may mutate a protected surface.
- "Service gateway" is the combination of `GatewayRegistryEntry`, `GatewayCredentialRef`, gateway custody proof, role-scoped `GatewayClient`, and the `gatewayCheck` transition. Source files: `src/protocol/areas/catalog-envelope/schemas.ts`, `src/protocol/areas/credential-custody/schemas.ts`, `src/sdk/surface-clients/gateway-client.ts`, and `src/protocol/areas/gateway-gate/`.
- "Principal-agent link" is protocol evidence on `OperatingEnvelope`, `DelegatedAuthorityRef`, runtime/candidate records, and exact `ActionContract`. It is not reusable auth and does not skip policy or gateway checks.

## APIs & External Services

**Cloudflare Worker Runtime:**
- Cloudflare Workers - Hosts the Hono protocol app.
  - SDK/Client: `wrangler` ^4.92.0 and `@cloudflare/workers-types` ^4.20260517.1 in `package.json`.
  - Implementation: `src/worker.ts`, `src/http/app.ts`, and `src/http/app-options.ts`.
  - Auth: Local bearer role tokens in `src/http/admission/caller-auth.ts`; hosted caller verifier interface in `src/http/admission/hosted-caller-identity.ts`.
  - Config: `wrangler.toml` declares Worker name `handshake-protocol-kernel`, D1 binding `DB`, and KV binding `CACHE`.

**x402 Payment Protocol:**
- x402 exact buyer-side payment rail - First official protected-action wedge is one buyer-side `x402_payment.exact` per-call path.
  - SDK/Client: `@x402/core` 2.12.0, `@x402/evm` 2.12.0, and dev/test `@x402/fetch` 2.12.0 in `package.json`.
  - Implementation: `src/adapters/x402-payment/upstream-evidence.ts`, `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/protected-tool-readiness/`, `src/adapters/x402-payment/protected-tool-facade/`, and `src/x402-protected-tool/index.ts`.
  - Auth: No raw x402 secret env var is read by source. Signing is injected through `ClientEvmSigner` into the gateway-held signing surface in `src/adapters/x402-payment/wallet-gateway.ts`.
  - Authority boundary: `PaymentPayload` and `PAYMENT-SIGNATURE` creation occur only inside the gateway signing surface after `verifiedGatewayCheckFromResult()` returns a `VerifiedGatewayCheck`.
  - Current non-claims: no facilitator operation, seller middleware, settlement finality, broad x402 compatibility, provider custody, live hosted payment management, or aggregate spend-window enforcement.

**MCP Local Stdio:**
- Model Context Protocol - Local proposal/evidence server for model-facing x402 protected action candidates.
  - SDK/Client: `@modelcontextprotocol/server` and `@modelcontextprotocol/client` 2.0.0-alpha.2 in `package.json`.
  - Server: `src/mcp/stdio/server.ts` and `src/mcp/stdio/entry.ts`.
  - Registry metadata: `server.json`.
  - Tool: `handshake.actions.x402_payment.propose` in `src/mcp/catalog.ts`.
  - Resources: `handshake://metadata/*`, `handshake://challenges/*`, `handshake://evidence/*`, `handshake://health/*`, and `handshake://certificates/*` in `src/mcp/resources.ts`.
  - Auth: MCP is not an enforcement auth boundary. It bridges to runtime proposal and redacted evidence only.

**npm And MCP Registry Distribution:**
- npm package registry - Distribution target for `handshake-protocol-kernel@0.2.7`.
  - Package metadata: `package.json`.
  - Package allowlist: `package.json#files`.
  - Package checks: `scripts/check-package-surface.mjs`, `scripts/check-published-entrypoints.mjs`, `scripts/check-clean-installed-activation.mjs`, and `scripts/check-release-proof.mjs`.
  - Auth: npm publish credentials are external to the repo. `.npmrc` was not read.
  - Boundary: Publication is distribution evidence only. It does not create protocol authority.
- MCP Registry - Discoverability metadata for the local stdio MCP package.
  - Config: `server.json` uses schema `https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json`.
  - Package: npm/stdio entry points to `handshake-protocol-kernel` version `0.2.7`.
  - Boundary: Registry acceptance and lookup are distribution facts only.

**auth.md / OAuth Metadata Profiles:**
- auth.md profile lane - Models credential discovery, registration provenance, lifecycle evidence, protected API-call contracts, and auth.md/x402 interlock packets.
  - SDK/Client: No external provider SDK detected.
  - Implementation: `src/adapters/auth-md/profiles.ts`, `src/adapters/auth-md/action-proposal.ts`, `src/adapters/auth-md/gateway.ts`, `src/adapters/auth-md/revocation.ts`, `src/adapters/auth-md/bypass-probes.ts`, and `src/adapters/auth-md-x402-interlock/packet.ts`.
  - Auth: Issued credential material is represented only as gateway custody evidence and `GatewayCredentialRef` inputs; raw credential material is rejected/redacted by auth.md schemas.
  - Boundary: auth.md metadata and credential issuance are provenance. They are not protected-action authority, an OAuth server, an identity provider, a service gateway, or a WorkOS-style managed auth product.

**Agent Host Profiles:**
- Host activation artifacts - Bind x402 protected-tool readiness to host-specific tool/profile descriptors.
  - Codex local: `src/adapters/x402-payment/protected-tool-profile/codex-activation.ts`.
  - Claude Code managed MCP: `src/adapters/x402-payment/protected-tool-profile/claude-code-activation.ts`.
  - Hermes tool packet: `src/adapters/x402-payment/protected-tool-profile/hermes-activation.ts`.
  - OpenClaw tool packet: `src/adapters/x402-payment/protected-tool-profile/openclaw-activation.ts`.
  - Generic MCP stdio: `src/adapters/x402-payment/protected-tool-profile/generic-mcp-activation.ts`.
  - Public subpath: `src/x402-protected-tool/index.ts`.
  - Boundary: Host profiles can prepare activation/readiness artifacts and raw sibling posture evidence. They do not mutate host config by default, certify native hosts, contain host-wide bypass, invoke signers, or perform gateway checks.

**HTTP Client Surfaces:**
- Handshake HTTP SDK - Typed client for protocol transition and evidence routes.
  - Low-level client: `src/sdk/client.ts`.
  - Role-scoped clients: `src/sdk/surface-clients/`.
  - Auth: Bearer role credentials are supplied through `HandshakeClientOptions` in `src/sdk/client.ts` or one role credential in `src/sdk/surface-clients/transport.ts`.
  - Boundary: SDK clients send requests and parse responses. They do not infer authority from evidence reads or command success.

**CI Service:**
- GitHub Actions - Runs the repository quality gate.
  - Config: `.github/workflows/check.yml`.
  - Auth: Not detected in source.
  - Commands: `bun install --frozen-lockfile`, then `npm run check:repo`.

## Data Storage

**Databases:**
- Cloudflare D1 - Durable reconstruction source for the reference implementation.
  - Connection: Worker binding `DB` in `wrangler.toml` and `src/http/app-options.ts`.
  - Client: `D1ProtocolStore` in `src/storage/d1/index.ts`.
  - Schema: `migrations/0001_protocol_kernel.sql`.
  - Stores: `protocol_records`, `protocol_record_action_contract_refs`, `stream_events`, `greenlight_consumptions`, `greenlight_issuances`, `idempotency_ledger_current`, `recovery_terminal_claims`, `protected_path_posture_current`, `isolation_state_current`, `protected_surface_operation_claim_current`, and `receipt_by_mutation_attempt`.
- In-memory store - Test/demo fixture and invariant oracle.
  - Client: `InMemoryProtocolStore` in `src/storage/memory/index.ts`.
  - Usage: Injected through `AppOptions.store` or `allowEphemeralStore` in `src/http/app.ts`.

**File Storage:**
- Local CLI project state: `.handshake/project.json` generated/read by `src/cli/local-project/index.ts`.
- External local CLI refs: `XDG_STATE_HOME` or `~/.local/state/handshake` paths used by `src/cli/local-project/index.ts`.
- Demo outputs: `examples/self-hosted-activation/output/`, `examples/x402-protected-spend/output/`, `examples/external-adapter-sdk/output/`, `examples/x402-protected-tool-profiles/output/`, and `examples/mcp-reference-transcript/output/`.
- Package output: `dist/` generated by `npm run build`.

**Caching:**
- Cloudflare KV - Non-authoritative isolation cache posture only.
  - Connection: Worker binding `CACHE` in `wrangler.toml` and `src/http/app-options.ts`.
  - Client: `KvIsolationCache` in `src/storage/kv/index.ts`.
  - Boundary: KV must not become protocol authority or durable reconstruction truth.

## Authentication & Identity

**Auth Provider:**
- Custom local bearer-token admission.
  - Implementation: `src/http/admission/caller-auth.ts`.
  - Roles: `control_plane`, `runtime_evidence`, `gateway_custody`, and `review_custody`.
  - Env vars: `HANDSHAKE_CONTROL_PLANE_TOKEN`, `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`, `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`, and `HANDSHAKE_REVIEW_CUSTODY_TOKEN`.
- Pluggable hosted caller verifier.
  - Interface: `HostedCallerVerifier` in `src/http/admission/hosted-caller-identity.ts`.
  - Config schema: `src/http/admission/hosted-admission-config.ts`.
  - Supported strategy labels: `local_test_verifier`, `cloudflare_access_jwt`, `pinned_jwks`, and `custom_server_verifier`.
  - Provider implementation: Not detected. These are local schema/interface hooks, not a managed identity integration.

**Principal-Agent Link:**
- `OperatingEnvelopeSchema` in `src/protocol/areas/catalog-envelope/schemas.ts` binds `principalId`, `agentId`, optional evidence-only `participantIdentityBindings`, allowed action classes, allowed gateways, allowed resources, policy pack, issued time, expiry, and revocation time.
- `ParticipantIdentityBindingSchema` can carry external identity provider refs, subject refs/digests, claims digests, and verification evidence refs. Its `authorityPosture` is fixed to `evidence_only`.
- `ActionContractSchema` in `src/protocol/areas/action-contract/schemas.ts` copies `principalId`, `agentId`, participant identity bindings, gateway registry binding, credential custody posture, gateway authority holder, delegated authority refs, and exact params digest into the proposed commitment.
- `DelegatedAuthorityRefSchema` in `src/protocol/areas/delegated-authority/schemas.ts` records bounded attempt authority for spend, mutation, or API calls. It includes `mutationAuthorityCreated: false` and `greenlightCreated: false`.

**Credential Custody:**
- `GatewayCredentialRefSchema` in `src/protocol/areas/credential-custody/schemas.ts` records opaque provider-neutral credential refs and explicitly sets `secretMaterialIncluded: false`.
- `GatewayCustodyProofPacketSchema` records redacted custody/posture evidence and explicitly sets `authorityCreated: false`.
- `CredentialResolutionEvidenceSchema` records post-gate gateway credential use evidence and explicitly sets `credentialMaterialIncluded: false`.

## Protocol Rails

**x402 protected spend:**
- Install proposal: `src/adapters/x402-payment/install-proposal.ts` compiles `x402_payment.exact` setup records, gateway registry entries, operating envelopes, credential refs, delegated spend refs, spend bounds, and bypass probe plans.
- Runtime proposal: `src/adapters/x402-payment/action-proposal.ts` builds x402 payment attempts, validates per-call bounds, binds payment requirement digests, and proposes contracts through runtime/protocol APIs.
- Gateway signing: `src/adapters/x402-payment/wallet-gateway.ts` runs `gatewayCheck`, records credential resolution evidence, signs through an injected gateway signing surface, reconciles downstream payment status, and returns proof gaps when downstream finality is unknown.
- Protected tool facade: `src/adapters/x402-payment/protected-tool-facade/index.ts` prepares proposal-only runtime dispatch blocks after readiness and metadata preflight; it emits no authority.
- Host profile readiness: `src/adapters/x402-payment/protected-tool-readiness/index.ts` and `src/adapters/x402-payment/protected-tool-profile/index.ts` bind pre-contract readiness, custody proof, raw sibling posture, and host profile descriptors.

**auth.md protected API call:**
- Discovery/profile evidence: `src/adapters/auth-md/profiles.ts`.
- Runtime proposal: `src/adapters/auth-md/action-proposal.ts`.
- Gateway execution fixture: `src/adapters/auth-md/gateway.ts`.
- Lifecycle/revocation evidence: `src/adapters/auth-md/revocation.ts`.
- Composite admission/proof packet with x402: `src/adapters/auth-md-x402-interlock/packet.ts`.
- Boundary: auth.md stays provenance and gateway-custody evidence until a protected API call clears through exact contract, policy, one-use greenlight, gateway check, and post-gate credential resolution.

**Package install / repo write / preview deploy proof contexts:**
- Package install reference adapter: `src/adapters/package-install/`.
- Repo write reference gateway: `src/adapters/repo-write/gateway.ts`.
- Preview deploy reference gateway: `src/adapters/preview-deploy/gateway.ts`.
- Runtime helpers: `src/runtime/package-install/action-proposal.ts`, `src/runtime/repo-write/action-proposal.ts`, and `src/runtime/preview-deploy/action-proposal.ts`.
- Boundary: These are proof contexts and adapter fixtures unless a source admission packet names generated execution shape, protected path, gateway authority holder, credential holder, candidate/refusal boundary, bypass posture, evidence path, proof-gap model, recovery/isolation path, non-claims, and gates.

## Monitoring & Observability

**Error Tracking:**
- None detected. No Sentry, Datadog, OpenTelemetry, Honeycomb, or similar dependency appears in `package.json`.

**Logs:**
- No external log service detected.
- HTTP failures return structured transition error envelopes from `src/http/errors/transition-error-envelope.ts`.
- Protocol observability is durable evidence: records, stream events, receipts, refusals, proof gaps, redacted projections, terminal certificates, and support bundles.
- ESLint allows only `console.warn` and `console.error` in `eslint.config.js`.

## CI/CD & Deployment

**Hosting:**
- Cloudflare Workers target via `wrangler.toml` and `src/worker.ts`.
- D1 binding `DB` is required for durable HTTP protocol endpoints unless an explicit injected test store is supplied.
- Hosted operation is not proven by this repo alone. `src/http/admission/hosted-admission-config.ts` models hosted readiness/admission posture, not provider custody or hosted mutation authority.

**CI Pipeline:**
- GitHub Actions in `.github/workflows/check.yml`.
- CI uses pinned `actions/checkout` and `oven-sh/setup-bun`, installs Bun `1.3.9`, runs `bun install --frozen-lockfile`, then `npm run check:repo`.

**Package Gate:**
- `npm run pack:check` in `package.json` runs `npm run build`, `scripts/check-package-surface.mjs`, `scripts/check-published-entrypoints.mjs`, `scripts/check-clean-installed-activation.mjs`, and `scripts/check-release-proof.mjs`.
- Package checks verify package allowlist, exports, bins, local CLI schema output, MCP stdio process behavior, role-client subpath, x402 protected-tool subpath, and installed-artifact smoke.

## Environment Configuration

**Required env vars:**
- Local bearer admission:
  - `HANDSHAKE_CONTROL_PLANE_TOKEN`
  - `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`
  - `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`
  - `HANDSHAKE_REVIEW_CUSTODY_TOKEN`
- Cloudflare bindings:
  - `DB`
  - `CACHE`
- Optional local state:
  - `XDG_STATE_HOME`

**Secrets location:**
- Secrets are not stored in the repo.
- `.gitignore` excludes `.dev.vars`, `.env`, `.env.local`, `.env.*.local`, `*.pem`, and `*.key`.
- Cloudflare secrets should live in platform bindings.
- npm/MCP Registry credentials are external to this checkout.
- x402 signer material must be held behind the gateway signing surface, not in runtime, MCP, CLI, docs, examples, or protocol records.

## Webhooks & Callbacks

**Incoming:**
- No webhook endpoints detected.
- Protocol transition routes are registered in `src/http/routes/transition-route-registry.ts`.
- Redacted evidence read routes are registered in `src/http/routes/evidence-read-route-registry.ts`.
- Additional HTTP endpoints in `src/http/app.ts`: `/health`, `/openapi.json`, `/v0.2/hosted/readiness`, `/v0.2/verifier/metadata`, `/v0.2/verifier/key-set`, `/v0.2/verifier/jwks.json`, `/v0.2/verifier/status/:subjectKind/:subjectRef`, `/v0.2/verifier/authority-certificates/verify`, and `/v0.2/records/:objectType/:objectId`.
- MCP incoming requests are stdio tool/resource calls handled by `src/mcp/stdio/server.ts`.

**Outgoing:**
- SDK clients call a configured Handshake base URL through `fetch` in `src/sdk/client.ts` and `src/sdk/surface-clients/transport.ts`.
- Reference adapters call injected surfaces rather than hard-coded provider APIs:
  - `src/adapters/x402-payment/wallet-gateway.ts` calls an injected `X402WalletSigningSurface`.
  - `src/adapters/auth-md/gateway.ts` calls an injected `AuthMdProtectedApiCallSurface`.
  - `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, and `src/adapters/preview-deploy/gateway.ts` use caller-supplied mutation surfaces.
- No production webhook/callback delivery integration detected.

## Distribution Surfaces

**npm package:**
- Public package shape is `handshake-protocol-kernel` with executable bins and subpath exports in `package.json`.
- `scripts/check-package-surface.mjs` keeps private source, tests, planning scratch, scripts, examples, migrations, and internal docs out of the package artifact.

**MCP Registry:**
- `server.json` advertises one npm/stdio package entry for the MCP server.
- MCP Registry discoverability is separate from npm publication and does not create authority.

**Examples:**
- `examples/self-hosted-activation/run.ts` emits local self-hosted activation evidence.
- `examples/x402-protected-spend/run.ts` emits local/reference protected-spend evidence.
- `examples/external-adapter-sdk/run.ts` emits definition-only adapter SDK readback.
- `examples/x402-protected-tool-profiles/run.ts` emits protected tool host profile artifacts.
- `examples/mcp-reference-transcript/run.ts` emits local MCP transcript evidence.
- Example outputs are product/readback samples, not production storage or authority.

---

*Integration audit: 2026-05-25*
