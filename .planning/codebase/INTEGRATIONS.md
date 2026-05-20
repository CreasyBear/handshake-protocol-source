# External Integrations

**Analysis Date:** 2026-05-20

## APIs & External Services

**Cloudflare Runtime:**
- Cloudflare Workers - Worker HTTP runtime configured by `wrangler.toml` and entered through `src/worker.ts`.
  - SDK/Client: `wrangler`, `@cloudflare/workers-types`, Hono app from `src/http/app.ts`
  - Auth: Worker token bindings named in `src/http/admission/caller-auth.ts`
  - Boundary: This is deployment/runtime wiring, not proof of hosted org auth or provider-side enforcement.
- Cloudflare D1 - Durable protocol reconstruction store configured as `DB` in `wrangler.toml`.
  - SDK/Client: Worker `D1Database` binding consumed by `src/storage/d1/index.ts`
  - Auth: Cloudflare Worker binding, not an application-level token in repo
  - Boundary: D1 stores protocol evidence and authority state; it does not decide protocol meaning.
- Cloudflare KV - Non-authoritative isolation cache configured as `CACHE` in `wrangler.toml`.
  - SDK/Client: Worker `KVNamespace` binding consumed by `src/storage/kv/index.ts`
  - Auth: Cloudflare Worker binding, not an application-level token in repo
  - Boundary: KV may cache isolation state; D1 remains durable reconstruction truth.

**HTTP Transport:**
- Hono app - Public transition, evidence-read, health, OpenAPI, and internal raw-record routes in `src/http/app.ts`.
  - SDK/Client: `hono`
  - Auth: Role-scoped local bearer tokens or hosted caller verifier seam
  - Boundary: HTTP admission can reject or contextualize requests, but protocol authority and gateway mutation discipline are not decided by Hono.
- OpenAPI projection - Generated in `src/http/openapi/index.ts` from transition route registries and Zod schemas.
  - SDK/Client: `zod` JSON schema projection
  - Auth: OpenAPI marks role bearer schemes from `transitionCallerSecuritySchemeName` in `src/http/admission/caller-auth.ts`
  - Boundary: OpenAPI is route documentation and schema projection, not execution authority.
- Typed SDK client - Fetch-based client in `src/sdk/client.ts` for HTTP transitions and redacted evidence reads.
  - SDK/Client: global `fetch` or injected `HandshakeFetch`
  - Auth: `transitionToken` or role-scoped `transitionTokens`
  - Boundary: The client submits requests and parses responses; it cannot infer authority or mutate protected surfaces.

**Generated Execution And Runtime Evidence:**
- Package install runtime helper - Converts explicit package-install tool calls into intent compilation and action contract proposal inputs in `src/runtime/package-install/action-proposal.ts`.
  - SDK/Client: local protocol facade supplied by caller
  - Auth: none inside helper; caller must route through kernel/HTTP custody
  - Boundary: Emits proposal evidence only; no greenlight, gateway check, receipt, or mutation.
- Repo write runtime helper - Converts explicit repo-write attempts into protocol proposal inputs in `src/runtime/repo-write/action-proposal.ts`.
  - SDK/Client: local protocol facade supplied by caller
  - Auth: none inside helper
  - Boundary: Proposal helper only; direct repo mutation is outside this lane.
- Preview deploy runtime helper - Converts explicit preview deploy attempts into protocol proposal inputs in `src/runtime/preview-deploy/action-proposal.ts`.
  - SDK/Client: local protocol facade supplied by caller
  - Auth: none inside helper
  - Boundary: Proposal helper only; direct deploy provider calls are outside this lane.
- Codemode multi-action runtime helper - Parses constrained generated programs and preflights package install, repo write, and preview deploy actions in `src/runtime/codemode-multi-action/generated-program-runner.ts`.
  - SDK/Client: local protocol facade supplied by caller
  - Auth: none inside helper
  - Boundary: Records runtime/generated-graph/tool-call evidence and proposes contracts; it refuses sibling leakage before earlier actions receive authority.

**Reference Gateway Adapters:**
- Package install reference gateway - `src/adapters/package-install/gateway.ts` checks an exact greenlight before calling caller-supplied `PackageInstallMutationSurface`.
  - SDK/Client: caller-supplied surface interface, not a hardcoded package manager client
  - Auth: `VerifiedGatewayCheck`
  - Boundary: Local reference fixture. It binds observed package manager, registry, manifest, lockfile, install flags, lifecycle-script policy, resolved material digest, and evidence refs, but it does not prove external package-material attestation.
- Repo write reference gateway - `src/adapters/repo-write/gateway.ts` checks an exact greenlight before calling caller-supplied `RepoWriteMutationSurface`.
  - SDK/Client: caller-supplied surface interface, not a hardcoded GitHub/Git client
  - Auth: `VerifiedGatewayCheck`
  - Boundary: Local reference fixture. It binds repository ref, file path, content digest, and content byte length.
- Preview deploy reference gateway - `src/adapters/preview-deploy/gateway.ts` checks an exact greenlight before calling caller-supplied `PreviewDeploySurface`.
  - SDK/Client: caller-supplied surface interface, not a hardcoded Vercel/Cloudflare Pages client
  - Auth: `VerifiedGatewayCheck`
  - Boundary: Local reference fixture. It does not prove provider-side deploy custody.
- x402 payment reference gateway - `src/adapters/x402-payment/wallet-gateway.ts` checks an exact greenlight before calling caller-supplied `X402WalletSigningSurface`.
  - SDK/Client: caller-supplied signing surface, not a live wallet/provider SDK
  - Auth: `VerifiedGatewayCheck`
  - Boundary: Local/reference payment signing path. It records proof gaps when downstream payment status is unknown and does not prove live provider custody.

**Install And Adapter-Pack Contracts:**
- Generic install proposal compiler contracts - `src/install/install-proposal/index.ts` define `InstallProposal`, `InstallProposalCompiledKernelRecords`, and bypass probe plans.
  - SDK/Client: Zod schemas
  - Auth: none; install proposals compile catalog/gateway/envelope records, not policy decisions or greenlights
- Protected action adapter-pack metadata - `src/install/protected-action-adapter-pack/index.ts` defines adapter-pack shape for action family, parameter schema, endpoint evidence, gateway validator, receipt mapper, probe kinds, and hostile fixtures.
  - SDK/Client: Zod schemas
  - Auth: none
- x402 exact payment adapter pack - `src/adapters/x402-payment/install-proposal.ts` compiles x402 endpoint evidence, wallet gateway profile, and spend bounds into kernel records or refusal reasons.
  - SDK/Client: local install compiler and Zod schemas
  - Auth: none; produced records still require policy/gateway transitions

**Conformance:**
- Protected mutation adapter conformance - `src/conformance/index.ts` checks that a caller-supplied adapter probe does not mutate without a verified gate.
  - SDK/Client: local probe interface
  - Auth: none; conformance is a check, not authority
  - Boundary: Passing means the provided probe did not mutate during that check; it is not standards certification.
- x402 install conformance - `src/adapters/x402-payment/conformance.ts` checks local posture for signer custody, raw private-key env absence, sibling wrapper blocking, MCP direct payment blocking, token passthrough blocking, wrapper drift absence, and failure-closed behavior.
  - SDK/Client: local posture object
  - Auth: none
  - Boundary: Local posture check only; it does not prove live wallet custody.
- Bypass probe executors - `src/adapters/protected-path-probes/executor.ts` and `src/adapters/x402-payment/bypass-probes.ts` record local bypass/custody/drift/failure-closed probe evidence.
  - SDK/Client: caller-supplied probe surfaces
  - Auth: probe records are gateway custody evidence, not greenlights

**Package And Build Ecosystem:**
- npm registry dry-run - `scripts/check-package-surface.mjs` runs `npm pack --dry-run --json` to verify package contents.
  - SDK/Client: local `npm` command through `node:child_process`
  - Auth: not applicable
  - Boundary: Packaging check only; no package publish command is configured.
- Bun package registry - `bun.lock` resolves npm packages for Bun install.
  - SDK/Client: `bun install --frozen-lockfile`
  - Auth: not detected in repo; `.npmrc` not detected by the scan
- GitHub Actions - `.github/workflows/check.yml` runs the repository gate on push and pull request.
  - SDK/Client: GitHub Actions hosted runner with `oven-sh/setup-bun@v2`
  - Auth: GitHub Actions runtime credentials are platform-managed and not configured in repo files

## Data Storage

**Databases:**
- Cloudflare D1
  - Connection: Worker binding `DB` in `wrangler.toml`
  - Client: `D1ProtocolStore` in `src/storage/d1/index.ts`
  - Schema: `migrations/0001_protocol_kernel.sql`
  - Stores: protocol records, stream events, greenlight consumptions, greenlight issuances, idempotency ledger current state, recovery terminal claims, protected path posture current state, isolation state current state, protected surface operation claims, and receipt lookup by mutation attempt.
  - Boundary: D1 is durable reconstruction truth for the reference implementation.
- In-memory store
  - Connection: none
  - Client: `InMemoryProtocolStore` in `src/storage/memory/index.ts`
  - Purpose: Tests, fixtures, and explicitly allowed ephemeral local app stores.
  - Boundary: It is not a production durability claim.
- Bun SQLite D1 harness
  - Connection: local `bun:sqlite` in `test/support/d1-http-harness.ts`
  - Client: local `LocalD1Database` test harness
  - Purpose: D1-shaped HTTP tests and integration tests.
  - Boundary: Test harness only.

**File Storage:**
- No external file storage service detected.
- Reference repo write tests use filesystem fixtures under `test/support/repo-write-surface.ts`; reference package manifest tests use filesystem fixtures under `test/support/package-manifest-surface.ts`.

**Caching:**
- Cloudflare KV
  - Connection: Worker binding `CACHE` in `wrangler.toml`
  - Client: `KvIsolationCache` in `src/storage/kv/index.ts`
  - Purpose: Cache isolation snapshots by `tenantId`, `organizationId`, `scopeType`, and `scopeId`.
  - Boundary: Cache only; it cannot become policy authority, durable evidence, or greenlight state.
- Noop cache
  - Client: `NoopIsolationCache` in `src/storage/kv/index.ts`
  - Purpose: Local fallback where KV cache is not used.

## Authentication & Identity

**Auth Provider:**
- Local role bearer custody
  - Implementation: `authorizeTransitionCaller` in `src/http/admission/caller-auth.ts`
  - Roles: `control_plane`, `runtime_evidence`, `gateway_custody`, `review_custody`
  - Env vars: `HANDSHAKE_CONTROL_PLANE_TOKEN`, `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`, `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`, `HANDSHAKE_REVIEW_CUSTODY_TOKEN`
  - Boundary: Local bearer tokens are fixture/deployment custody, not hosted org auth.
- Hosted caller verifier seam
  - Implementation: `HostedCallerVerifier` and `TransitionCallerIdentitySchema` in `src/http/admission/hosted-caller-identity.ts`
  - Admission: `authorizeHosted` in `src/http/admission/index.ts`
  - Boundary: Provider-agnostic verifier interface only. No concrete hosted identity provider is configured in the repo.

**Request Identity:**
- Required transition headers are defined in `src/http/admission/request-context.ts`: `X-Handshake-Protocol-Version`, `X-Handshake-Request-Identity`, and optional `X-Handshake-Originating-Identity`.
- The SDK sets these headers in `src/sdk/client.ts`; request identity defaults to `crypto.randomUUID()`.
- Originating identity is accepted only as a `sha256:` digest or opaque `ref:` value by `src/http/admission/request-context.ts`.

## Monitoring & Observability

**Error Tracking:**
- No external error tracking service detected.

**Logs:**
- No logging framework detected.
- ESLint in `eslint.config.js` forbids `console` except `console.warn` and `console.error`.
- HTTP errors are structured as transition error envelopes in `src/http/errors/transition-error-envelope.ts`.

**Protocol Evidence:**
- Redacted diagnostic evidence reads are implemented in `src/http/handlers/evidence-read.ts` and registered by `src/http/routes/evidence-read-route-registry.ts`.
- Evidence projections include generated graph evidence, action contract views, idempotency recovery, receipt timelines, and protected path install health.
- Internal raw records are guarded by object registry raw-read posture through `src/http/handlers/internal-record-read.ts`.
- Boundary: Evidence reads are diagnostic; they do not create authority or prove downstream business success.

## CI/CD & Deployment

**Hosting:**
- Configured host target: Cloudflare Workers through `wrangler.toml`.
- Worker entrypoint: `src/worker.ts`.
- Development command: `npm run dev` executes `wrangler dev`.

**CI Pipeline:**
- GitHub Actions workflow: `.github/workflows/check.yml`.
- Trigger: `push` and `pull_request`.
- Runner: `ubuntu-latest`.
- Steps: `actions/checkout@v4`, `oven-sh/setup-bun@v2` with Bun `1.3.9`, `bun install --frozen-lockfile`, and `npm run check:repo`.

**Release/Publishing:**
- No publish command detected.
- `package.json` is `private: true`.
- `npm run pack:check` validates the dry-run package surface and generated declarations without publishing.

## Environment Configuration

**Required env vars / bindings:**
- `DB` - Cloudflare D1 binding in `wrangler.toml`; required for durable Worker protocol state unless an explicit ephemeral test store is injected.
- `CACHE` - Cloudflare KV binding in `wrangler.toml`; optional/non-authoritative cache wiring.
- `HANDSHAKE_CONTROL_PLANE_TOKEN` - Local bearer custody for control-plane transition routes.
- `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN` - Local bearer custody for runtime evidence transition routes.
- `HANDSHAKE_GATEWAY_CUSTODY_TOKEN` - Local bearer custody for gateway custody transition routes.
- `HANDSHAKE_REVIEW_CUSTODY_TOKEN` - Local bearer custody for review custody transition routes.

**Secrets location:**
- Expected secret location is Cloudflare Worker binding configuration or explicit local `AppOptions.callerAuthTokens` for tests and local harnesses.
- No `.env*`, `.npmrc`, credential, or secret files were detected by the scan.
- Do not commit bearer token values, wallet keys, cloud credentials, or registry tokens.

## Webhooks & Callbacks

**Incoming:**
- Health route: `GET /health` in `src/http/app.ts`.
- OpenAPI route: `GET /openapi.json` in `src/http/app.ts`.
- Catalog/control-plane routes:
  - `POST /v0.2/catalog/tool-capabilities`
  - `POST /v0.2/catalog/action-types`
  - `POST /v0.2/catalog/gateways`
  - `POST /v0.2/envelopes`
- Runtime evidence routes:
  - `POST /v0.2/intent-compilations`
  - `POST /v0.2/runtime-executions`
  - `POST /v0.2/tool-call-drafts`
  - `POST /v0.2/tool-call-draft-transitions`
- Gateway custody routes:
  - `POST /v0.2/bypass-probes`
  - `POST /v0.2/protected-path-postures`
  - `POST /v0.2/gateway-check-attempts`
  - `POST /v0.2/surface-operation-reconciliations`
- Control/recovery routes:
  - `POST /v0.2/action-contracts`
  - `POST /v0.2/policy-decisions`
  - `POST /v0.2/isolation-states`
  - `POST /v0.2/breaker-decisions`
  - `POST /v0.2/receipt-exports`
  - `POST /v0.2/recovery-recommendations`
  - `POST /v0.2/recovery-recommendation-status-transitions`
  - `POST /v0.2/recovery-terminal-conflict-resolutions`
- Review custody routes:
  - `POST /v0.2/review-artifacts`
  - `POST /v0.2/review-decisions`
- Redacted evidence read routes:
  - `GET /v0.2/evidence/generated-execution-graphs/:generatedExecutionGraphId`
  - `GET /v0.2/evidence/contracts/:actionContractId`
  - `GET /v0.2/evidence/idempotency-recovery/:actionContractId`
  - `GET /v0.2/evidence/receipts/:receiptId/timeline`
  - `GET /v0.2/evidence/protected-path-install-health/:actionContractId`
- Internal raw record route:
  - `GET /v0.2/records/:objectType/:objectId`
  - Boundary: `src/http/handlers/internal-record-read.ts` enforces object registry raw-read posture; internal-only records are not generic HTTP read surfaces.

**Outgoing:**
- No hardcoded external HTTP API clients detected in `src/`.
- Reference gateway adapters call caller-supplied mutation surfaces:
  - `PackageInstallMutationSurface` in `src/adapters/package-install/gateway.ts`
  - `RepoWriteMutationSurface` in `src/adapters/repo-write/gateway.ts`
  - `PreviewDeploySurface` in `src/adapters/preview-deploy/gateway.ts`
  - `X402WalletSigningSurface` in `src/adapters/x402-payment/wallet-gateway.ts`
- Outgoing package, repository, deploy, or wallet/provider calls are deliberately outside the kernel and must be owned by installed gateways or test fixtures.

## Local vs External Boundary

**Local Kernel Foundation:**
- `src/protocol/`, `src/storage/`, `src/http/`, `src/runtime/`, `src/adapters/`, `src/install/`, `src/conformance/`, and `src/sdk/` establish local source/test proof of the protected-action kernel chain.
- Tests under `test/http`, `test/integration`, `test/runtime`, `test/adapters`, `test/conformance`, and `test/protocol` exercise local D1/HTTP flows, runtime proposals, adapter gateways, conformance probes, and protocol invariants.

**External Claims Not Established:**
- No live hosted org auth provider is configured.
- No live Cloudflare deployment or production D1/KV instance is proven by repo files alone.
- No direct public MCP/runtime/browser interception surface is implemented.
- No external package-manager material attestation client is implemented.
- No live wallet custody or payment provider integration is implemented.
- No provider-side deploy enforcement client is implemented.
- No generic GitHub/Git provider mutation client is implemented.

---

*Integration audit: 2026-05-20*
