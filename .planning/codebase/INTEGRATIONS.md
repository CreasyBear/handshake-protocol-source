# External Integrations

**Analysis Date:** 2026-05-23

## Scope

This audit covers Tier 2 SDK, CLI, MCP, x402, package/repo/preview adapter proof surfaces, evidence/readback workflows, scripts, package exports, and validation commands. It uses `.planning/codebase/CONCERNS.md` as input but keeps `.planning/` non-canonical.

## APIs & External Services

**Cloudflare Runtime:**
- Cloudflare Workers - HTTP runtime target for the protocol kernel.
  - SDK/Client: `wrangler`, `@cloudflare/workers-types`, Hono app from `src/worker.ts` and `src/http/app.ts`.
  - Auth: local role bearer tokens in `src/http/admission/caller-auth.ts`; hosted verifier seam in `src/http/admission/hosted-caller-identity.ts`.
  - Config: `wrangler.toml` declares Worker entrypoint, D1 binding `DB`, and KV binding `CACHE`.
  - Boundary: current repo does not prove hosted operation, tenant provisioning, live verifier/JWKS/revocation, production monitoring, or provider custody; canonical non-claims are in `README.md`, `docs/internal/decisions.md`, and `docs/internal/protocol-notes.md`.

**HTTP Protocol API:**
- Hono transition and evidence routes - local/Worker API for transition writes, gateway custody transitions, and redacted evidence reads.
  - SDK/Client: `HandshakeClient` in `src/sdk/client.ts`; role-scoped `RuntimeClient` and `EvidenceClient` in `src/sdk/surface-clients/`.
  - Auth: `Authorization: Bearer <token>` checked by `src/http/admission/caller-auth.ts` for `control_plane`, `runtime_evidence`, `gateway_custody`, and `review_custody`.
  - Transition routes: `src/http/routes/transition-route-registry.ts` includes catalog registration, credential refs/resolution evidence, runtime evidence, bypass probes, tool-call drafts, action contracts, policy decisions, review records, gateway checks, reconciliation, isolation, receipt export, and recovery routes.
  - Evidence routes: `src/http/routes/evidence-read-route-registry.ts` exposes generated graph, contract, agent transaction envelope, idempotency recovery, receipt timeline, and protected-path install-health projections to `review_custody` or `runtime_evidence`.
  - Raw guarded record route: `src/http/handlers/internal-record-read.ts` requires `control_plane` and refuses `internal_only` object-registry entries from `src/protocol/areas/object-registry/index.ts`.

**SDK Surface:**
- Tier 2 role clients - proposal/readback integration helpers, not authority holders.
  - SDK/Client: `RuntimeClient` in `src/sdk/surface-clients/runtime-client.ts`, `EvidenceClient` in `src/sdk/surface-clients/evidence-client.ts`, and `RoleScopedTransport` in `src/sdk/surface-clients/transport.ts`.
  - Auth: one `roleCredential` per client; runtime proposal uses `runtime_evidence`; evidence readback defaults to `review_custody` and can use scoped `runtime_evidence`.
  - Current proof: `test/sdk/role-clients.test.ts` verifies one bearer token, runtime POST-only proposal methods, evidence GET-only reads, local certificate verification, package subpath import through `handshake-protocol-kernel/sdk/role-clients`, and absence of policy/gateway/receipt/certificate mint methods.
  - Friction: root `src/index.ts` still exports `HandshakeClient`, whose `transitionToken`/`transitionTokens` compatibility path is too ambient for model-facing activation. Activation examples now use the role-client package subpath instead.

**CLI Surface:**
- Local operator/evidence command contract - local readiness, x402 install/probe posture, redacted projection wrapping, APS report rendering, schema, conformance, and supplied certificate verification.
  - SDK/Client: `src/cli/main.ts`, `src/cli/command-manifest.ts`, `src/cli/output.ts`, `src/cli/local-project/index.ts`, `src/cli/local-project/doctor.ts`, `src/cli/x402/index.ts`, `src/cli/x402/local-state.ts`, `src/cli/projection-evidence.ts`, `src/cli/aps-report.ts`, and `src/cli/certificate.ts`.
  - Auth: no process-wide environment inheritance; `src/cli/command-manifest.ts` requires `childProcessEnvInheritance: "none"` for every command.
  - Filesystem: `init` writes `.handshake/project.json`, external role credential profile refs, and a local trust bundle; it does not create token values. `install.x402-payment` and `probes.x402-payment` can write external local x402 posture refs when `--record-local` is supplied.
  - Current commands: `schema`, `init`, `doctor`, `evidence.aps-report`, `evidence.contract-view`, `evidence.receipt-timeline`, `cert.verify`, `install.x402-payment`, `probes.x402-payment`, `install.health`, and `conformance.x402-payment` in `src/cli/command-manifest.ts`.
  - Boundary: no package `bin`, no process startup, no HTTP transition calls, no policy evaluation, no gateway check, no signer use, no raw records, no live control-plane registration, and no protected mutation.
  - Friction: local x402 probe classification has `trustedReadiness: false`, so `doctor` remains `not_ready` until a trusted gateway/control-plane readiness source exists.

**MCP Surface:**
- Model-facing MCP schema/reference helpers - proposal and evidence transport only, not a process-hosted MCP server.
  - SDK/Client: pure TypeScript helpers in `src/mcp/catalog.ts`, `src/mcp/x402-proposal.ts`, `src/mcp/resources.ts`, `src/mcp/output.ts`, `src/mcp/digest.ts`, and `src/mcp/reference-transcript.ts`.
  - Auth: delegated to supplied `RuntimeClient`-compatible and `EvidenceClient`-compatible objects; MCP source does not import `src/sdk/client.ts` or all-role token maps.
  - Tool scope: `src/mcp/catalog.ts` exposes exactly one proposal tool, `handshake.actions.x402_payment.propose`.
  - Resource scope: read-only templates cover metadata, challenges, redacted contract/envelope/receipt/idempotency/install-health projections, pre-contract install health, and certificate refs.
  - Reference transcript: `examples/mcp-reference-transcript/run.ts` and `test/mcp/mcp-reference-transcript.test.ts` generate and guard the source-owned x402 reference transcript.
  - Boundary: no MCP process launcher, no package export, no policy decision, no greenlight, no gateway check, no signer/payment payload, no receipt export, no raw record, and no authority certificate minting.
  - Friction: MCP proposals do not create generated execution graph evidence; `src/mcp/x402-proposal.ts` returns `generatedExecutionGraphId: null` and `generatedExecutionGraphPosture: "not_exposed_by_role_scoped_runtime_surface"`.

**x402 Payment Proof Profile:**
- x402 official packages - local buyer-side exact protected-spend proof path.
  - SDK/Client: `@x402/core`, `@x402/evm`, and dev-only `@x402/fetch`.
  - Auth: gateway-held signer boundary in `src/adapters/x402-payment/wallet-gateway.ts`; signer material, `PaymentPayload`, and `PAYMENT-SIGNATURE` are not exposed to runtime/SDK/CLI/MCP/model-facing surfaces.
  - Install compiler: `src/adapters/x402-payment/install-proposal.ts` compiles tool capability, action type, gateway registry entry, and operating envelope records for `x402_payment.exact`.
  - Runtime proposal: `src/adapters/x402-payment/action-proposal.ts` and `src/runtime/ingress/index.ts` build exact x402 action-contract candidates from official `PaymentRequired` evidence or wrapped runtime dispatches.
  - Upstream evidence: `src/adapters/x402-payment/upstream-evidence.ts` validates V2 `PaymentRequired` evidence and selected `exact` requirement digests.
  - Gateway: `src/adapters/x402-payment/wallet-gateway.ts` creates official payment payload/signature evidence only after `VerifiedGatewayCheck`.
  - Conformance and probes: `src/adapters/x402-payment/conformance.ts` and `src/adapters/x402-payment/bypass-probes.ts` classify signer custody, raw private key exposure, direct SDK signing, paid fetch/axios, raw signature header, sibling wrappers, MCP direct payment, token passthrough, wrapper drift, and failure-closed posture.
  - Boundary: only one buyer-side `x402_payment.exact` per-call path is supported. `upto`, batch settlement, lifecycle hooks, MCP auto-pay, signed offers, signed receipts, seller middleware, facilitator operation, broad x402 compatibility, provider custody, and aggregate spend-window enforcement are unsupported or metadata-only.

**Package / Repo / Preview Adapter Proof Surfaces:**
- Package install - local runtime ingress family and reference gateway fixture.
  - SDK/Client: `src/runtime/package-install/action-proposal.ts`, `src/runtime/ingress/index.ts`, `src/adapters/package-install/gateway.ts`, `test/runtime/runtime-ingress.test.ts`, `test/adapters/package-install-gateway.test.ts`, and `test/integration/package-install-end-to-end.test.ts`.
  - Proof: package name, version range, package manager, registry ref, workspace/manifest/lockfile refs, install flags, lifecycle-script policy, resolved material digest, and evidence refs are bound before mutation.
  - Boundary: local parameter binding only; no external package-material attestation or live package-registry credential provider is detected.
- Repo write - runtime proposal helper plus experimental reference gateway fixture.
  - SDK/Client: `src/runtime/repo-write/action-proposal.ts`, `src/adapters/repo-write/gateway.ts`, `test/adapters/repo-write-gateway.test.ts`, and `test/integration/repo-write-d1-http.test.ts`.
  - Proof: repository ref, file path, content digest, and byte length are checked before mutation by the reference gateway.
  - Boundary: exported only through `./experimental` as `experimentalRunRepoWriteGateway`; no public runtime ingress export for repo-write exists in `src/runtime/index.ts`.
- Preview deploy - runtime proposal helper plus experimental reference gateway fixture.
  - SDK/Client: `src/runtime/preview-deploy/action-proposal.ts`, `src/adapters/preview-deploy/gateway.ts`, and `test/adapters/preview-deploy-gateway.test.ts`.
  - Proof: provider, project ref, branch ref, commit ref, and preview URL hint are checked before preview creation by the reference gateway.
  - Boundary: exported only through `./experimental` as `experimentalRunPreviewDeployGateway`; no live deploy provider SDK or hosted preview operation is detected.

**Package Registry / Package Manager:**
- npm package dry-run - validates private source package contents.
  - SDK/Client: `scripts/check-package-surface.mjs`.
  - Auth: no `.npmrc` detected in root scan; npm cache is redirected to `/tmp/handshake-npm-cache`.
  - Boundary: `package.json` is `"private": true`; package surface is checked, not published.

## Data Storage

**Databases:**
- Cloudflare D1
  - Connection: Worker binding `DB` in `wrangler.toml` and `src/http/app-options.ts`.
  - Client: `D1ProtocolStore` in `src/storage/d1/index.ts`.
  - Schema: `migrations/0001_protocol_kernel.sql` defines protocol records, stream events, greenlight consumption/issuance, idempotency ledger, recovery terminal claims, protected-path posture, isolation state, surface operation claims, and receipt indexes.
- In-memory protocol store
  - Connection: injected `store` or explicit `allowEphemeralStore` in `src/http/app.ts`.
  - Client: `InMemoryProtocolStore` in `src/storage/memory/index.ts`.
  - Scope: tests, examples, and explicit local usage; `src/http/store/resolution.ts` refuses state endpoints without D1 or injected ephemeral state.

**File Storage:**
- Local filesystem for examples, CLI inputs, local project pointers, external local state refs, package dry-run output, and generated demo artifacts.
  - Paths: `examples/x402-protected-spend/output/`, `examples/mcp-reference-transcript/output/`, `.handshake/project.json`, external state root from `src/cli/local-project/index.ts`, and `/tmp/handshake-npm-cache` from `scripts/check-package-surface.mjs`.

**Caching:**
- Cloudflare KV
  - Connection: Worker binding `CACHE` in `wrangler.toml` and `src/http/app-options.ts`.
  - Client: `KvIsolationCache` in `src/storage/kv/index.ts`.
  - Boundary: KV is cache posture only; D1 remains reconstruction truth in `docs/internal/protocol-notes.md`.
- Noop cache
  - Client: `NoopIsolationCache` in `src/storage/kv/index.ts`.
  - Scope: local/test fallback.

## Authentication & Identity

**Auth Provider:**
- Local bearer-token custody by role.
  - Implementation: `src/http/admission/caller-auth.ts` maps roles to `HANDSHAKE_CONTROL_PLANE_TOKEN`, `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`, `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`, and `HANDSHAKE_REVIEW_CUSTODY_TOKEN`.
  - Client: `src/sdk/client.ts` and `src/sdk/surface-clients/transport.ts` send bearer credentials.
  - Boundary: local role-token auth is not tenant-scoped hosted authorization.
- Hosted caller verifier seam.
  - Implementation: `HostedCallerVerifier` and `TransitionCallerIdentity` in `src/http/admission/hosted-caller-identity.ts`.
  - Provider: Not detected; no Clerk, OIDC, JWT, JWKS, or provider SDK is imported.
- Participant identity bindings.
  - Implementation: `OperatingEnvelope` participant bindings in `src/protocol/areas/catalog-envelope/schemas.ts`.
  - Boundary: evidence-only links to opaque principal/agent refs; they do not replace gateway checks.

## Monitoring & Observability

**Error Tracking:**
- None detected.

**Logs:**
- No external log service detected.
- `eslint.config.js` blocks `console` except `console.warn` and `console.error`.
- HTTP errors are structured transition envelopes through `src/http/errors/transition-error-envelope.ts`.
- Audit/readback observability is represented by protocol records, stream events, redacted evidence projections, receipt timelines, refusals, proof gaps, idempotency recovery projections, protected-path health projections, and local `AuthorityCertificate` verification in `src/protocol/**`, `src/http/handlers/evidence-read.ts`, and `src/protocol/evidence-projections/projections.ts`.

## Evidence And Readback Workflows

**HTTP/SDK readback:**
- `EvidenceClient` in `src/sdk/surface-clients/evidence-client.ts` reads generated graph evidence, contract evidence, agent transaction envelopes, idempotency recovery, receipt timelines, and protected-path install health through `src/http/routes/evidence-read-route-registry.ts`.
- `src/http/handlers/evidence-read.ts` builds projections through `src/protocol/evidence-projections/projections.ts` and generated graph projections in `src/protocol/areas/generated-execution-graph/projections.ts`.
- Friction: `src/http/handlers/evidence-read.ts` uses broad `listRecordsByType` scans for policy, greenlight, gateway, mutation, receipt, reconciliation, certificate, refusal, and proof-gap records. This is acceptable for local proof but not high-volume hosted audit readback.

**CLI readback:**
- `src/cli/projection-evidence.ts` wraps caller-supplied redacted contract, receipt timeline, and install health projections without raw dumps.
- `src/cli/aps-report.ts` renders local x402 APS reports from `examples/x402-protected-spend/output/latest.json`.
- `src/cli/certificate.ts` verifies supplied terminal certificates against supplied trust material without reading protocol state or minting certificates.
- Friction: CLI readback is local file based. It now includes a file-backed redacted `support.bundle`, but it does not fetch from HTTP, publish a package binary, or prove live gateway/provider posture.

**MCP readback:**
- `src/mcp/resources.ts` routes evidence resources through an `EvidenceClient`-compatible interface and wraps every resource in non-authority flags.
- `src/mcp/reference-transcript.ts` pairs MCP cases with existing CLI readback IDs from `src/cli/command-manifest.ts`.
- Friction: metadata, challenge, certificate, and pre-contract install-health resources are source/reference payloads. Source-backed prior-evidence readback after MCP replay/idempotency outcomes remains a gap recorded in `.planning/codebase/CONCERNS.md`.

## CI/CD & Deployment

**Hosting:**
- Cloudflare Workers target through `src/worker.ts` and `wrangler.toml`.
- D1 and KV bindings are declared in `wrangler.toml`.
- Hosted production operation is not established by this repo.

**CI Pipeline:**
- GitHub Actions in `.github/workflows/check.yml`.
- CI installs Bun 1.3.9, runs `bun install --frozen-lockfile`, then runs `npm run check:repo`.
- `npm run check:repo` chains `check:types`, `lint`, `format:check`, `test`, `pack:check`, and `git diff --check`.

## Environment Configuration

**Required env vars / bindings:**
- `DB` - Cloudflare D1 binding in `wrangler.toml` and `src/http/app-options.ts`.
- `CACHE` - Cloudflare KV binding in `wrangler.toml` and `src/http/app-options.ts`.
- `HANDSHAKE_CONTROL_PLANE_TOKEN` - control-plane transition bearer token in `src/http/admission/caller-auth.ts`.
- `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN` - runtime-evidence transition bearer token in `src/http/admission/caller-auth.ts`.
- `HANDSHAKE_GATEWAY_CUSTODY_TOKEN` - gateway-custody transition bearer token in `src/http/admission/caller-auth.ts`.
- `HANDSHAKE_REVIEW_CUSTODY_TOKEN` - review-custody transition bearer token in `src/http/admission/caller-auth.ts`.

**Secrets location:**
- No `.env`, `.env.*`, `*.env`, `.npmrc`, `credentials.*`, or `secrets.*` files were detected in the root-level scan.
- Runtime secrets are represented as Worker bindings, bearer token bindings, opaque gateway credential refs, redacted credential resolution evidence, external CLI role credential refs, and gateway-held signer refs.
- Raw credential material is rejected/redacted by `src/protocol/areas/credential-custody/schemas.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, CLI posture tests in `test/cli/*`, and MCP posture tests in `test/mcp/*`.

## Webhooks & Callbacks

**Incoming:**
- Transition writes under `/v0.2/*` from `src/http/routes/transition-route-registry.ts`.
- Evidence reads under `/v0.2/evidence/*` from `src/http/routes/evidence-read-route-registry.ts`.
- Health and OpenAPI routes `/health` and `/openapi.json` in `src/http/app.ts`.
- Guarded raw record route `/v0.2/records/:objectType/:objectId` in `src/http/app.ts` and `src/http/handlers/internal-record-read.ts`.
- No third-party webhook receiver detected.

**Outgoing:**
- Official x402 payment payload and `PAYMENT-SIGNATURE` creation after verified gateway check in `src/adapters/x402-payment/wallet-gateway.ts`.
- SDK HTTP calls to configured Handshake base URLs in `src/sdk/client.ts` and `src/sdk/surface-clients/transport.ts`.
- npm dry-run command in `scripts/check-package-surface.mjs`.
- Local demo artifact writes in `examples/x402-protected-spend/run.ts` and `examples/mcp-reference-transcript/run.ts`.
- No outgoing webhook sender, hosted facilitator client, live seller middleware client, hosted verifier API, JWKS/revocation client, external error tracker, live cloud-provider mutation SDK, live deploy provider SDK, database provider SDK, or package registry attestation client detected.

## Current Friction / Debt Affecting Experience

**Developer experience:**
- `RuntimeClient` and `EvidenceClient` are the safer Tier 2 shape, but `package.json` does not export an SDK subpath and `src/index.ts` still exports only `HandshakeClient`; examples must avoid teaching all-role/fallback token usage.
- `package.json` has no CLI `bin`, no `./cli` export, and no `./mcp` export; Tier 2 usage is local source/test/demo driven.
- `scripts/check-package-surface.mjs` is part of `npm run pack:check`; use the exact script name `pack:check`, not an invented `check:pack`.

**Operator experience:**
- `doctor` can show safe local posture problems, but x402 local probe reports remain untrusted (`trustedReadiness: false`) and therefore keep readiness `not_ready` until a trusted gateway/control-plane projection exists.
- CLI install/probe commands write external local records when asked, but they do not register hosted install records or start gateway/MCP processes.

**Agent/model experience:**
- MCP can propose one exact x402 action contract and read redacted evidence, but it cannot prove host-level sibling tool interception, process custody, generated execution graph coverage, or live catalog freshness beyond source-owned metadata digests and reference transcript cases.
- Runtime ingress refuses raw/ambiguous x402 and package-install dispatches, but broad browser/shell/network/cloud/MCP/tool interception is not implemented.

**Audit/readback experience:**
- Evidence projections are redacted and source-owned, but high-volume readback needs indexed/paginated storage access before hosted audit/search claims.
- MCP replay/idempotency outcomes are structured, but source-backed prior-evidence readback through MCP resources after replay remains incomplete.

**x402 experience:**
- The x402 proof is narrow and useful: buyer-side `exact`, per-call amount bound, gateway-held signing after `VerifiedGatewayCheck`, redacted evidence, replay refusal, and proof-gap posture.
- Spend session/day/review windows are metadata until a spend ledger exists; seller middleware, facilitator operation, `upto`, batch settlement, and broad compatibility remain unsupported.

---

*Integration audit: 2026-05-23*
