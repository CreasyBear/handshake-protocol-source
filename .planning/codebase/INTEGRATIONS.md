# External Integrations

**Analysis Date:** 2026-05-23

## Scope

This map covers integrations that emit or shape responses, evidence, telemetry, custody posture, and redaction in the pre-hosted Tier 2 Handshake v0.0.2 repository. It uses canonical repo truth from `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/decisions.md`, `docs/internal/protocol-notes.md`, `docs/internal/protocol-definition.md`, and `docs/internal/protocol-kernel-architecture.md`, then validates against live source and tests.

The repository integrates with external systems only as reference/local surfaces. It does not claim hosted operation, provider-operated custody, broad runtime interception, broad x402 compatibility, marketplace clearing, cross-org certificate trust, or production monitoring.

## APIs & External Services

**Reference HTTP API:**
- Hono Worker app - role-scoped transition routes, evidence read routes, health, OpenAPI, and raw-record read denial posture.
  - SDK/Client: `hono` in `src/http/app.ts`; Worker entry in `src/worker.ts`; low-level client in `src/sdk/client.ts`; role-scoped SDK in `src/sdk/surface-clients/`.
  - Auth: `HANDSHAKE_CONTROL_PLANE_TOKEN`, `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN`, `HANDSHAKE_GATEWAY_CUSTODY_TOKEN`, and `HANDSHAKE_REVIEW_CUSTODY_TOKEN` enforced by `src/http/admission/caller-auth.ts`.
  - Evidence note: `test/http/http.test.ts` verifies auth before parsing, wrong custody rejection, durable-store fail-closed behavior, internal raw-read blocking, and state-changing route posture.

**Role-scoped SDK clients:**
- Runtime evidence client - emits runtime execution, generated tool-call draft, draft transition, intent compilation, and action-contract proposal requests.
  - SDK/Client: `RuntimeClient` in `src/sdk/surface-clients/runtime-client.ts`.
  - Auth: one role credential through `src/sdk/surface-clients/transport.ts`.
  - Evidence note: `test/sdk/role-clients.test.ts` verifies the runtime client does not expose greenlight, gateway, receipt, or certificate minting methods.
- Evidence client - reads redacted projections and verifies supplied AuthorityCertificates locally.
  - SDK/Client: `EvidenceClient` in `src/sdk/surface-clients/evidence-client.ts`.
  - Auth: one role credential through `src/sdk/surface-clients/transport.ts`.
  - Evidence note: `test/sdk/role-clients.test.ts` verifies GET-only evidence read posture and narrow exports from `src/sdk/surface-clients/index.ts`.

**CLI local surfaces:**
- CLI command envelope - local JSON commands for schema, init, doctor, evidence projection reads, certificate verification, support bundle generation, x402 install/probes/health/conformance.
  - SDK/Client: CLI dispatcher in `src/cli/main.ts`; command metadata in `src/cli/command-manifest.ts`; output envelope in `src/cli/output.ts`.
  - Auth: no hosted auth; local input files and external token refs only.
  - Evidence note: `src/cli/output.ts` sets all authority, mutation, raw-record, credential-material, receipt-export, and cert-mint flags false.
- CLI support bundle - accepts already-redacted projections and local posture records, then emits bounded support telemetry.
  - SDK/Client: `src/cli/support-bundle.ts`.
  - Auth: no hosted auth; caller supplies JSON input.
  - Evidence note: `test/cli/cli-support-bundle.test.ts` verifies omission of payment payloads, payment signatures, role tokens, private keys, raw request bodies, gateway credential material, raw records, mutation commands, and receipt exports.
- Local project setup and doctor - creates `.handshake/project.json` plus external state-root refs, not secrets.
  - SDK/Client: `src/cli/local-project/index.ts`.
  - Auth: role token reference paths only.
  - Evidence note: `test/cli/cli-local-project.test.ts` verifies token values are not created or printed and unsafe token storage is flagged.

**MCP reference surface:**
- MCP catalog and resources - reference resource templates plus one x402 proposal tool.
  - SDK/Client: `src/mcp/catalog.ts`, `src/mcp/resources.ts`, `src/mcp/x402-proposal.ts`, `src/mcp/output.ts`.
  - Auth: no external MCP host custody; the reference proposal tool uses role-scoped runtime/evidence clients.
  - Evidence note: `test/mcp/mcp-resource-redaction.test.ts` verifies read-only resources and redaction for evidence, metadata, challenge, and certificate resources.
- MCP transcript demo - source-owned transcript for valid and hostile x402 proposal/readback cases.
  - SDK/Client: `src/mcp/reference-transcript.ts`, `src/mcp/reference-transcript-fixtures.ts`, and `examples/mcp-reference-transcript/run.ts`.
  - Auth: local fixture clients only.
  - Evidence note: `test/mcp/mcp-reference-transcript.test.ts` validates stale metadata, changed tools list, install-not-ready, gateway-offline, amount mismatch, params mismatch, replay refusal, raw sibling bypass, and proof-gap cases.

**Runtime ingress adapters:**
- Runtime dispatch ingestion - converts wrapped package install and x402 payment dispatches into evidence and candidate action contracts; records raw sibling and ambiguous dispatches as bypass/ambiguity evidence.
  - SDK/Client: `src/runtime/ingress/index.ts`, `src/runtime/package-install/action-proposal.ts`, and `src/adapters/x402-payment/action-proposal.ts`.
  - Auth: in-process protocol store and runtime identity inputs, not provider credentials.
  - Evidence note: `test/runtime/runtime-ingress.test.ts` verifies no authority creation, gateway check, mutation, receipt, or certificate in runtime ingress.

**x402 buyer-side exact path:**
- Official x402 V2 `exact` parser and wallet gateway - parses upstream payment requirements, proposes exact payment contracts, gates signer use behind protocol gateway checks, and records downstream result/proof-gap evidence.
  - SDK/Client: `@x402/core` and `@x402/evm` used by `src/adapters/x402-payment/upstream-evidence.ts` and `src/adapters/x402-payment/wallet-gateway.ts`.
  - Auth: gateway-held signer custody only; raw private keys and request-side signatures are not exposed through evidence projections.
  - Evidence note: `test/conformance/x402-upstream-exact-fixtures.test.ts`, `test/conformance/x402-payment-conformance.test.ts`, and `test/integration/x402-d1-http.test.ts` validate official source basis, signer custody, parameter drift refusals, replay refusal, proof gaps, and redaction.

**Package, repo, and preview reference protected surfaces:**
- Package install gateway - validates supply-chain parameters and calls package installer only after verified gateway check.
  - SDK/Client: `src/adapters/package-install/gateway.ts`.
  - Auth: protocol gateway result, not raw package manager authority.
  - Evidence note: `test/adapters/package-install-gateway.test.ts` and `test/integration/package-install-end-to-end.test.ts` cover no-mutation refusal/proof-gap paths.
- Repo write gateway - computes content digest and calls repo writer only after verified gateway check.
  - SDK/Client: `src/adapters/repo-write/gateway.ts`.
  - Auth: protocol gateway result, not ambient filesystem authority.
  - Evidence note: `test/adapters/repo-write-gateway.test.ts` and `test/integration/repo-write-d1-http.test.ts` cover mismatch, replay, no-mutation, and receipt recovery posture.
- Preview deploy gateway - calls provider preview creation only after verified gateway check.
  - SDK/Client: `src/adapters/preview-deploy/gateway.ts`.
  - Auth: protocol gateway result, not provider deployment token custody.
  - Evidence note: `test/adapters/preview-deploy-gateway.test.ts` covers downstream proof gaps and non-authoritative gates.

## Data Storage

**Databases:**
- Cloudflare D1 - reference durable reconstruction store for protocol records, stream events, greenlight issuance/consumption, idempotency ledger, recovery terminal claims, protected path posture, isolation state, protected surface operation claims, and receipt indexes.
  - Connection: Worker binding `DB` in `wrangler.toml`.
  - Client: `src/storage/d1/index.ts` with SQL statement helpers in `src/storage/d1/statements.ts`.
  - Evidence note: `migrations/0001_protocol_kernel.sql` defines the schema; `test/http/d1-http.test.ts` verifies D1 commit semantics, receipt timelines, idempotency conflicts, greenlight consumption, operation claims, and storage recovery.

**In-memory store:**
- Memory protocol store - test and demo fixture with the same conflict posture as D1 for records, streams, greenlights, idempotency, recovery, isolation, posture, operation claims, and receipts.
  - Connection: in-process maps, no external service.
  - Client: `src/storage/memory/index.ts`.
  - Evidence note: `examples/x402-protected-spend/run.ts` uses the memory store for the local APS demo; tests under `test/` use memory for invariant coverage.

**File Storage:**
- Demo outputs - generated JSON and Markdown artifacts in `examples/x402-protected-spend/output/` and `examples/mcp-reference-transcript/output/`.
- CLI local project metadata - `.handshake/project.json` under the workspace, plus external token-ref and trust-bundle paths generated by `src/cli/local-project/index.ts`.
- Package output - declaration files under `dist/` generated by `npm run build`.
- Support bundles - JSON output produced by `src/cli/support-bundle.ts` from caller-supplied redacted inputs.

**Caching:**
- Cloudflare KV - optional isolation-state snapshot cache only.
  - Connection: Worker binding `CACHE` in `wrangler.toml`.
  - Client: `src/storage/kv/index.ts`.
  - Evidence note: KV does not issue authority, does not store greenlight truth, and cannot replace D1 reconstruction state.

## Authentication & Identity

**Auth Provider:**
- Custom role-token admission - HTTP route custody is enforced by bearer tokens and route custody roles.
  - Implementation: `src/http/admission/caller-auth.ts`, `src/http/routes/transition-route-registry.ts`, and `src/http/routes/evidence-read-route-registry.ts`.
  - Required headers: `X-Handshake-Protocol-Version` and `X-Handshake-Request-Identity` in `src/http/admission/request-context.ts`.
  - Optional headers: `X-Handshake-Originating-Identity` constrained to a digest or `ref:` in `src/http/admission/request-context.ts`.
  - Evidence note: `test/http/http.test.ts` verifies missing/wrong custody is refused before committing state.

**SDK credential posture:**
- Role-scoped SDK clients accept one `roleCredential`, not a fallback map of authority-bearing tokens.
  - Implementation: `src/sdk/surface-clients/transport.ts`.
  - Evidence note: `test/sdk/role-clients.test.ts` checks that role clients reject role maps and do not expose fallback transition tokens.

**Hosted identity seam:**
- Hosted caller identity exists as an admission seam but does not prove hosted operation.
  - Implementation: `src/http/admission/hosted-caller-identity.ts` and route checks in `src/http/handlers/evidence-read.ts`.
  - Evidence note: canonical non-claims in `README.md`, `docs/internal/decisions.md`, and `docs/internal/protocol-definition.md` keep hosted provider operation deferred.

## Monitoring & Observability

**Error Tracking:**
- None detected as an external service.
- Typed route errors are returned through `src/http/errors/transition-error-envelope.ts` with transition name, custody role, retryability, commit state, request identity, proof/refusal refs, and validation issues.

**Logs:**
- No external log sink is configured in `package.json`, `wrangler.toml`, or `src/http/`.
- Repository observability is evidence-first: protocol records, stream events, receipt timelines, idempotency recovery projections, agent transaction envelopes, CLI envelopes, MCP transcript outputs, and demo artifacts.

**Telemetry artifacts:**
- HTTP transition responses and errors - route handlers in `src/http/handlers/` and error envelope in `src/http/errors/transition-error-envelope.ts`.
- Redacted evidence projections - schemas and projectors in `src/protocol/evidence-projections/schemas.ts` and `src/protocol/evidence-projections/projections.ts`.
- Agent transaction envelope - redacted end-to-end reconstruction artifact from `src/protocol/evidence-projections/projections.ts`.
- Receipt timeline - redacted stream/receipt reconstruction from `src/protocol/evidence-projections/projections.ts`.
- CLI envelope - `handshake.cli.v1` from `src/cli/output.ts`.
- CLI support bundle - `handshake.cli.support-bundle.v1` from `src/cli/support-bundle.ts`.
- MCP surface outcome - `src/mcp/output.ts` and reference transcript in `src/mcp/reference-transcript.ts`.
- APS demo report - `examples/x402-protected-spend/output/latest.json` and `examples/x402-protected-spend/output/latest.md`.
- MCP transcript report - `examples/mcp-reference-transcript/output/latest.json` and `examples/mcp-reference-transcript/output/latest.md`.

## Data And Evidence Flow

**Primary runtime-to-evidence flow:**
1. Runtime dispatch evidence is ingested by `src/runtime/ingress/index.ts`.
2. Tool-call drafts are finalized and linked to generated execution graphs by `src/runtime/ingress/index.ts`.
3. Candidate action contracts are compiled through `src/runtime/package-install/action-proposal.ts` or `src/adapters/x402-payment/action-proposal.ts`.
4. HTTP transition routes persist records through `src/http/routes/transition-route-registry.ts`, `src/http/handlers/`, and `src/http/store/resolution.ts`.
5. D1 or memory store commits records, streams, idempotency posture, greenlight consumption, isolation pointers, and receipt indexes through `src/storage/d1/index.ts` or `src/storage/memory/index.ts`.
6. Evidence readers project redacted contract views, agent transaction envelopes, idempotency recovery, receipt timelines, generated graphs, and install health through `src/http/handlers/evidence-read.ts` and `src/protocol/evidence-projections/projections.ts`.
7. SDK, CLI, MCP, and demos consume projections through `src/sdk/surface-clients/evidence-client.ts`, `src/cli/projection-evidence.ts`, `src/mcp/resources.ts`, and `examples/`.

**Gateway-bound mutation flow:**
1. Policy and greenlight records are created by control-plane transitions in `src/http/routes/transition-route-registry.ts`.
2. Gateway custody transitions resolve credential refs and perform gateway checks through `src/http/routes/transition-route-registry.ts`.
3. Reference adapters call protocol `gatewayCheck` before mutation in `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, `src/adapters/preview-deploy/gateway.ts`, and `src/adapters/x402-payment/wallet-gateway.ts`.
4. Only verified gateway checks trigger downstream mutation or payment signing; refusal, replay, mismatch, or uncertainty produces refusal or proof-gap evidence.
5. Downstream results are reconciled into receipts, failures, or proof gaps through adapter-specific code and `src/adapters/downstream-failure-evidence.ts`.

**MCP proposal/readback flow:**
1. MCP metadata/resource reads are served by `src/mcp/resources.ts` and reference fixtures in `src/mcp/reference-transcript-fixtures.ts`.
2. MCP proposal input is validated by `src/mcp/x402-proposal.ts`.
3. Freshness, tools-list digest, install readiness, gateway status, amount bounds, schema, and idempotency are checked before runtime proposal calls.
4. Runtime role client methods emit runtime evidence and action-contract proposals; the MCP tool still returns non-authority flags through `src/mcp/output.ts`.
5. Readback resources expose only redacted evidence projections through `src/sdk/surface-clients/evidence-client.ts`.

## Custody Posture

**Gateway credential refs:**
- Gateway credential refs are opaque evidence references, not secret values.
  - Implementation: credential-resolution and gateway routes in `src/http/routes/transition-route-registry.ts`; redacted projection fields in `src/protocol/evidence-projections/projections.ts`.

**x402 signer custody:**
- x402 signing is gateway-held and happens only after verified gateway check.
  - Implementation: `src/adapters/x402-payment/wallet-gateway.ts`.
  - Evidence note: `test/integration/x402-d1-http.test.ts` verifies no signer invocation on mismatch/replay and no raw signer/secret leakage in projections.

**CLI custody:**
- CLI local init creates refs, not credential values.
  - Implementation: `src/cli/local-project/index.ts`.
  - Evidence note: `test/cli/cli-local-project.test.ts` validates `credentialValuesCreatedByCli: false` and no secret output.

**SDK custody:**
- Role-scoped SDK uses exactly one role credential and avoids transition-token fallback maps.
  - Implementation: `src/sdk/surface-clients/transport.ts`.
  - Evidence note: `test/sdk/role-clients.test.ts` validates the exported SDK surface.

## Redaction Posture

**Projection redaction:**
- Contract projections omit raw `parameters`, `secretRefs`, and contract signatures.
  - Implementation: `projectContractEvidence` in `src/protocol/evidence-projections/projections.ts`.
- Agent transaction envelopes filter private keys, API keys, tokens, passwords, secrets, vault/Infisical paths, `PAYMENT-SIGNATURE`, `PaymentPayload`, raw payment signatures, token passthrough, and facilitator secrets.
  - Implementation: `projectAgentTransactionEnvelope` in `src/protocol/evidence-projections/projections.ts`.
- Receipt timelines expose redacted stream and event metadata, not raw receipt evidence.
  - Implementation: `projectReceiptTimeline` in `src/protocol/evidence-projections/projections.ts`.

**HTTP raw-read posture:**
- Internal raw-record reads require control-plane custody and still return 404 for `internal_only` object types.
  - Implementation: `src/http/handlers/internal-record-read.ts`.
  - Evidence note: `test/http/http.test.ts` validates raw-record route denial and OpenAPI omission.

**CLI redaction:**
- CLI support bundle omits raw material and records omission labels.
  - Implementation: `src/cli/support-bundle.ts`.
  - Evidence note: `test/cli/cli-support-bundle.test.ts` validates omitted raw materials and absence of private tokens/signatures.

**MCP redaction:**
- MCP resources are read-only and non-authoritative; reference metadata/challenge/certificate resources do not expose raw payment or credential material.
  - Implementation: `src/mcp/resources.ts` and `src/mcp/catalog.ts`.
  - Evidence note: `test/mcp/mcp-resource-redaction.test.ts` validates redaction and reference-only posture.

## CI/CD & Deployment

**Hosting:**
- Cloudflare Worker reference deployment is configured but not claimed as hosted production.
  - Platform: `wrangler.toml`, `src/worker.ts`, and `src/http/app.ts`.
  - Bindings: D1 `DB` and KV `CACHE`.

**CI Pipeline:**
- GitHub Actions runs the repository quality gate with Bun 1.3.9.
  - Service: `.github/workflows/check.yml`.
  - Commands: `bun install --frozen-lockfile` followed by `npm run check:repo`.

**Package publication:**
- Package surface is checked locally through `scripts/check-package-surface.mjs`.
  - Command: `npm run pack:check`.
  - Evidence note: package dry-run rejects scratch and test artifacts, including `.planning/`.

## Environment Configuration

**Required env vars for reference HTTP auth:**
- `HANDSHAKE_CONTROL_PLANE_TOKEN` - control-plane route custody in `src/http/admission/caller-auth.ts`.
- `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN` - runtime evidence route custody in `src/http/admission/caller-auth.ts`.
- `HANDSHAKE_GATEWAY_CUSTODY_TOKEN` - gateway custody route authorization in `src/http/admission/caller-auth.ts`.
- `HANDSHAKE_REVIEW_CUSTODY_TOKEN` - review/evidence read custody in `src/http/admission/caller-auth.ts`.

**Worker bindings:**
- `DB` - Cloudflare D1 binding declared in `wrangler.toml` and consumed by `src/http/store/resolution.ts`.
- `CACHE` - Cloudflare KV binding declared in `wrangler.toml` and consumed by `src/storage/kv/index.ts`.

**Secrets location:**
- No repository `.env*` file was detected by the mapper's repository-root scan.
- CLI local project setup stores role token refs outside the workspace state root and does not create values; implementation lives in `src/cli/local-project/index.ts`.
- Gateway credential refs and credential resolution evidence are records/refs, not raw material; redaction posture lives in `src/protocol/evidence-projections/projections.ts`.

## Webhooks & Callbacks

**Incoming:**
- No webhook receiver is implemented.
- HTTP routes in `src/http/app.ts` are protocol transition and evidence endpoints, not external provider webhooks.

**Outgoing:**
- No webhook sender is implemented.
- Reference adapters accept injected downstream surfaces in `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, and `src/adapters/preview-deploy/gateway.ts`.
- The x402 wallet gateway in `src/adapters/x402-payment/wallet-gateway.ts` performs official x402 client/signing behavior only after verified protocol gateway check and records downstream response/proof-gap evidence.

## Deferred Hosted Items And Explicit Non-Claims

- Hosted provider operation is deferred; `README.md`, `docs/internal/decisions.md`, `docs/internal/protocol-notes.md`, and `docs/internal/protocol-definition.md` define local/reference kernel posture.
- Broad MCP, CLI, browser, shell, and network interception is not implemented; CLI and MCP surfaces in `src/cli/` and `src/mcp/` are bounded evidence/proposal/reference surfaces.
- Broad x402 compatibility is not claimed; only official V2 `exact` buyer-side proof path is supported by `src/adapters/x402-payment/`.
- Seller middleware, facilitator operation, batch settlement, lifecycle hooks, signed offers, signed receipts, MCP auto-pay, and `upto` schemes are unsupported in `src/adapters/x402-payment/conformance.ts`.
- Aggregate spend-window enforcement is metadata only; session/day/review thresholds in `src/adapters/x402-payment/install-proposal.ts` are labeled `not_enforced_tier1_metadata`.
- External package-material attestation is not claimed; package install binding lives in `src/adapters/package-install/gateway.ts` and runtime proposal code in `src/runtime/package-install/action-proposal.ts`.
- Live JWKS, revocation, cross-org AuthorityCertificate trust, and hosted verifier operation are not claimed; certificate verification is local/offline through `src/protocol/authority-certificate.ts` and `src/cli/certificate.ts`.
- KV cache cannot replace D1 authority; `src/storage/kv/index.ts` stores isolation snapshots while `src/storage/d1/index.ts` and `migrations/0001_protocol_kernel.sql` hold reference durable reconstruction state.

---

*Integration audit: 2026-05-23*
