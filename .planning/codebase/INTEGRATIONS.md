# External Integrations

**Analysis Date:** 2026-05-23

## Scope

This map covers external APIs, storage, auth, telemetry, deployment, and evidence surfaces for Handshake v0.0.2. It separates committed auth.md protected-call support from the newer dirty auth.md lifecycle/bypass/reconstruction expansion.

`.planning/` is scratch. Do not treat this mapper output as canon without re-validating against `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/decisions.md`, `docs/internal/protocol-notes.md`, `package.json`, source, and tests.

## APIs & External Services

**Reference HTTP API:**
- Hono Worker app - protocol transition routes, evidence reads, health, OpenAPI, and restricted raw-record reads.
  - SDK/Client: `src/http/app.ts`, `src/worker.ts`, `src/http/routes/transition-route-registry.ts`, `src/http/routes/evidence-read-route-registry.ts`, `src/sdk/client.ts`, and `src/sdk/surface-clients/`.
  - Auth: `HANDSHAKE_CONTROL_PLANE_TOKEN`, `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`, `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`, `HANDSHAKE_REVIEW_CUSTODY_TOKEN`.
  - Boundary: local/reference transport seam only; `src/http/admission/hosted-caller-identity.ts` is a hosted-admission seam, not hosted operation proof.

**Role-scoped SDK:**
- RuntimeClient - writes runtime evidence, tool-call drafts, intent compilations, and action-contract proposals.
  - SDK/Client: `src/sdk/surface-clients/runtime-client.ts`.
  - Auth: single `roleCredential` through `src/sdk/surface-clients/transport.ts`.
  - Boundary: no policy, greenlight, gateway check, receipt, mutation, or certificate minting methods.
- EvidenceClient - reads redacted projections and verifies supplied AuthorityCertificates locally.
  - SDK/Client: `src/sdk/surface-clients/evidence-client.ts`.
  - Auth: single `roleCredential` through `src/sdk/surface-clients/transport.ts`.
  - Boundary: verification is local pinned/offline verification, not hosted verifier operation.

**CLI local surfaces:**
- CLI command dispatcher - local schema, init, doctor, evidence, cert verify, support bundle, x402 install/probe/health/conformance commands.
  - SDK/Client: `src/cli/main.ts`, `src/cli/command-manifest.ts`, `src/cli/output.ts`.
  - Auth: no external auth provider; commands read explicit files or local `.handshake/project.json`.
  - Boundary: `src/cli/output.ts` carries non-claims for hosted operation, provider custody, payment settlement finality, aggregate spend-window enforcement, broad x402 compatibility, broad runtime control, marketplace certification, clearing-house readiness, and cross-org AuthorityCertificate trust.
- CLI support bundle - redacted evidence package assembled from caller-supplied projections and local posture records.
  - SDK/Client: `src/cli/support-bundle.ts`.
  - Auth: caller-supplied local JSON.
  - Boundary: omits payment payload material, payment signatures, private keys, role tokens, transition tokens, request-body dumps, gateway credential material, mutation commands, raw records, and receipt exports.

**MCP reference surface:**
- MCP catalog/resources - read-only `handshake://` resources plus one x402 proposal tool.
  - SDK/Client: `src/mcp/catalog.ts`, `src/mcp/resources.ts`, `src/mcp/x402-proposal.ts`, `src/mcp/output.ts`.
  - Auth: reference tool calls role-scoped runtime/evidence clients; no external MCP host custody.
  - Boundary: no policy authority, greenlight, gateway check, mutation, receipt export, credential material, certificate mint, hosted operation, provider custody, cross-org trust, or clearing-house posture.
- MCP transcript demo - source-owned Tier 2 reference transcript for proposal/readback cases.
  - SDK/Client: `src/mcp/reference-transcript.ts`, `src/mcp/reference-transcript-fixtures.ts`, `examples/mcp-reference-transcript/run.ts`.
  - Auth: local fixtures only.
  - Boundary: not a public MCP host quickstart, SDK install client, SDK gateway client, CLI package bin, spend ledger, hosted provider, or external gateway operation claim.

**x402 buyer-side exact path:**
- Official x402 parser and wallet gateway - parses `PAYMENT-REQUIRED`, builds exact payment attempts, creates `PaymentPayload` and `PAYMENT-SIGNATURE` only after verified gateway check, and records downstream evidence/proof gaps.
  - SDK/Client: `@x402/core` and `@x402/evm` in `src/adapters/x402-payment/upstream-evidence.ts` and `src/adapters/x402-payment/wallet-gateway.ts`.
  - Auth: gateway-held signer custody; signer material and raw payment credentials are not exposed to runtime, MCP, CLI, SDK evidence reads, or projections.
  - Boundary: one official buyer-side V2 `exact` path only; `src/adapters/x402-payment/conformance.ts` excludes `upto`, batch settlement, lifecycle hooks, MCP auto-pay, signed offers, signed receipts, seller middleware, facilitator operation, and broad x402 compatibility.

**Reference protected surfaces:**
- Package install gateway - applies package installation only after `VerifiedGatewayCheck`.
  - SDK/Client: `src/adapters/package-install/gateway.ts`.
  - Auth: protocol gateway check, not raw package-manager authority.
- Repo write gateway - computes content digest and applies repo writes only after `VerifiedGatewayCheck`.
  - SDK/Client: `src/adapters/repo-write/gateway.ts`.
  - Auth: protocol gateway check, not ambient filesystem authority.
- Preview deploy gateway - creates preview evidence only after `VerifiedGatewayCheck`.
  - SDK/Client: `src/adapters/preview-deploy/gateway.ts`.
  - Auth: protocol gateway check, not provider deployment-token custody.

**auth.md protected API-call profile:**
- Committed auth.md adapter - OAuth Protected Resource Metadata plus authorization-server `agent_auth` provenance, auth.md supporting document digest, redacted gateway credential intake, exact protected API-call proposals, and a reference gateway fixture.
  - SDK/Client: `src/adapters/auth-md/index.ts`, `src/adapters/auth-md/profiles.ts`, `src/adapters/auth-md/action-proposal.ts`, `src/adapters/auth-md/gateway.ts`, explicit `src/experimental.ts` exports, and tests in `test/adapters/auth-md-adapter.test.ts`, `test/adapters/auth-md-gateway.test.ts`, and `test/runtime/auth-md-candidate-compilation.test.ts`.
  - Auth: accepts credential material only at gateway custody intake, emits redacted registration/identity/claim/revocation evidence, binds `GatewayCredentialRef` inputs into action contracts, resolves credentials only after `VerifiedGatewayCheck`, and records `CredentialResolutionEvidence` after the gate.
  - Boundary: not an auth provider, OAuth server, WorkOS alternative, certification body, provider custody claim, hosted identity system, or generic API gateway.
- Dirty auth.md lifecycle/bypass expansion - user-owned working-tree additions for revocation-to-isolation, hostile bypass probes, auth.md evidence labels in transaction envelopes, and integration/reconstruction tests.
  - Files: `src/adapters/auth-md/revocation.ts`, `src/adapters/auth-md/bypass-probes.ts`, dirty `src/protocol/evidence-projections/projections.ts`, dirty `src/protocol/evidence-projections/schemas.ts`, and untracked tests under `test/adapters/auth-md-*`, `test/integration/auth-md-*`, and `test/protocol/policy-auth-md.test.ts`.
  - Auth: lifecycle evidence can isolate a gateway credential ref for future policy/gateway use; bypass probes classify raw bearer passthrough, direct HTTP, sibling MCP, browser, raw network, token replay, metadata staleness, wrapper drift, unsafe retry loops, and failure-closed posture.
  - Boundary: focused auth.md tests pass, but the expansion is not yet full-gated or committed.

## Data Storage

**Databases:**
- Cloudflare D1 - reference durable reconstruction store.
  - Connection: `DB` binding in `wrangler.toml`.
  - Client: `src/storage/d1/index.ts` and `src/storage/d1/statements.ts`.
  - Schema: `migrations/0001_protocol_kernel.sql`.
  - Stores: protocol records, stream events, greenlight consumptions/issuances, idempotency ledger pointers, recovery terminal claims, protected-path posture, isolation state, protected-surface operation claims, and receipt indexes.

**In-memory store:**
- InMemoryProtocolStore - test/demo store with D1-like conflict posture.
  - Connection: in-process maps only.
  - Client: `src/storage/memory/index.ts`.
  - Boundary: not durable production storage.

**File Storage:**
- Package declarations - generated under `dist/` by `npm run build`.
- Demo reports - generated under `examples/x402-protected-spend/output/` and `examples/mcp-reference-transcript/output/`.
- Local CLI project state - `.handshake/project.json` and external token-reference/trust-bundle refs from `src/cli/local-project/index.ts`.
- Support bundles - caller-supplied redacted projection bundles through `src/cli/support-bundle.ts`.

**Caching:**
- Cloudflare KV - optional isolation-state snapshot cache.
  - Connection: `CACHE` binding in `wrangler.toml`.
  - Client: `src/storage/kv/index.ts`.
  - Boundary: cache-only posture; KV cannot become durable authority or greenlight truth.

## Authentication & Identity

**Auth Provider:**
- Custom bearer-token role custody.
  - Implementation: `src/http/admission/caller-auth.ts`, `src/http/admission/index.ts`, `src/http/routes/transition-route-registry.ts`, and `src/http/routes/evidence-read-route-registry.ts`.
  - Roles: `control_plane`, `runtime_evidence`, `gateway_custody`, `review_custody`.
  - Required headers: `X-Handshake-Protocol-Version` and `X-Handshake-Request-Identity` from `src/http/admission/request-context.ts`.
  - Optional identity evidence: `X-Handshake-Originating-Identity` as sha256 digest or `ref:`.

**Hosted caller identity seam:**
- Hosted caller verification can be injected but is not an implemented hosted auth product.
  - Implementation: `src/http/admission/hosted-caller-identity.ts`.
  - Boundary: no hosted org auth, RBAC, retention, search, hosted verifier operation, or provider enforcement claim.

**Credential custody:**
- Gateway credential refs are opaque records, not secret retrieval APIs.
  - Implementation: `src/protocol/areas/credential-custody/`, `src/http/routes/transition-route-registry.ts`, and projections in `src/protocol/evidence-projections/projections.ts`.
  - Boundary: post-gate credential resolution evidence cannot retrieve secrets, issue authority, or turn provider resolution failure into downstream success.

## Monitoring & Observability

**Error Tracking:**
- None detected as an external service.
- Typed HTTP errors are returned by `src/http/errors/transition-error-envelope.ts` with transition name, custody role, retryability, commit state, request identity, proof/refusal refs, and validation issues.

**Logs:**
- No external log sink is configured in `package.json`, `wrangler.toml`, or source.
- Observability is evidence-first, not log-first.

**Committed telemetry hardening:**
- Redacted contract view - `ContractEvidenceProjectionSchema` and `projectContractEvidence()` in `src/protocol/evidence-projections/schemas.ts` and `src/protocol/evidence-projections/projections.ts`.
- Agent transaction envelope - `AgentTransactionEnvelopeProjectionSchema`, `projectAgentTransactionEnvelope()`, and `assembleAgentTransactionEnvelope()` in `src/protocol/evidence-projections/`.
- Receipt timeline - `ReceiptTimelineProjectionSchema` and `projectReceiptTimeline()` in `src/protocol/evidence-projections/`.
- Idempotency recovery - `IdempotencyRecoveryProjectionSchema` in `src/protocol/evidence-projections/schemas.ts`.
- Protected-path install health - `ProtectedPathInstallHealthProjectionSchema` in `src/protocol/evidence-projections/schemas.ts`.
- CLI envelope and support bundle - `src/cli/output.ts` and `src/cli/support-bundle.ts`.
- MCP structured outcome and resources - `src/mcp/output.ts`, `src/mcp/catalog.ts`, and `src/mcp/resources.ts`.
- Surface route/custody boundary manifest - `src/surfaces/boundary-manifest.ts`.

**Telemetry tests:**
- `test/protocol/evidence-projections.test.ts` verifies clearing refs are non-authority, transaction envelopes separate refusal/admission/replay/proof-gap, and raw x402 credential evidence is redacted.
- `test/http/http.test.ts` verifies evidence projection reads, raw-read denial, and custody enforcement.
- `test/product/agent-proof-slice.test.ts` verifies redacted agent transaction envelopes and x402 gateway evidence.
- `test/cli/cli-support-bundle.test.ts` verifies support-bundle omission of raw material.
- `test/mcp/mcp-schema-contract.test.ts` and `test/mcp/mcp-resource-redaction.test.ts` verify MCP non-authority and read-only posture.

## CI/CD & Deployment

**Hosting:**
- Cloudflare Worker reference deployment config exists in `wrangler.toml` and `src/worker.ts`.
- No hosted production operation is claimed.

**CI Pipeline:**
- GitHub Actions in `.github/workflows/check.yml`.
- CI installs Bun 1.3.9, runs `bun install --frozen-lockfile`, then runs `npm run check:repo`.

**Package publication:**
- Package is `"private": true` in `package.json`.
- `npm run pack:check` runs declaration build plus `scripts/check-package-surface.mjs`.
- Package surface excludes `.planning/`, `.agents/`, tests, old docs trees, and scratch metadata.

## Environment Configuration

**Required env vars for reference HTTP auth:**
- `HANDSHAKE_CONTROL_PLANE_TOKEN`
- `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`
- `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`
- `HANDSHAKE_REVIEW_CUSTODY_TOKEN`

**Worker bindings:**
- `DB` - Cloudflare D1 binding in `wrangler.toml`.
- `CACHE` - Cloudflare KV binding in `wrangler.toml`.

**Secrets location:**
- No repository-root `.env*` files were detected.
- Role token values must be external to source; CLI project state stores refs, not token values, in `src/cli/local-project/index.ts`.
- x402 signer material is represented as gateway-held custody/evidence refs; raw signer material is not projected by `src/protocol/evidence-projections/projections.ts`.
- auth.md intake accepts raw credential material only as input to build redacted gateway custody refs; adapter/gateway/projection tests assert that raw bearer credentials, claim tokens, JWTs, email PII, and provider secrets are not serialized.

## Webhooks & Callbacks

**Incoming:**
- No webhook receiver is implemented.
- `src/http/app.ts` exposes protocol transition and evidence endpoints only.

**Outgoing:**
- No webhook sender is implemented.
- Reference adapters accept injected downstream surfaces in `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, and `src/adapters/preview-deploy/gateway.ts`.
- x402 gateway signing in `src/adapters/x402-payment/wallet-gateway.ts` uses official x402 SDK code only after verified gateway check and records provider request/operation refs as evidence.

## Non-Claims

- No hosted verifier/provider custody/clearing-house claim exists in committed source.
- No facilitator operation, seller middleware, settlement finality, aggregate spend ledger, or broad x402 compatibility is claimed.
- No broad MCP, CLI, browser, shell, network, package-manager, or generated-tool-stream interception is claimed.
- No production wallet custody, live vault provider, live JWKS/revocation, cross-org AuthorityCertificate trust, marketplace certification, or provider-side enforcement is claimed.
- Tier 2-facing surfaces are pre-hosted local/reference activation surfaces until a real deployment boundary, customer/provider gateway check, credential custody model, and audited receipt retention/search surface exist in source.

---

*Integration audit: 2026-05-23*
