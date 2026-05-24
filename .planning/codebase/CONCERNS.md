# Codebase Concerns

**Analysis Date:** 2026-05-24

## Tech Debt

**x402 Scope Boundary:**
- Issue: x402 is correctly narrowed to one local/reference buyer-side `x402_payment.exact` path, but that boundary is repeated across docs, examples, tests, runtime ingress, MCP, and adapter code. Any new x402 surface can overclaim broad x402 compatibility, seller middleware, facilitator operation, hosted custody, or aggregate spend enforcement if it does not update every guard.
- Files: `README.md`, `docs/internal/protocol-definition.md`, `docs/internal/protocol-notes.md`, `examples/x402-protected-spend/README.md`, `test/architecture/claim-boundary.test.ts`, `src/adapters/x402-payment/action-proposal.ts`, `src/adapters/x402-payment/upstream-evidence.ts`, `src/adapters/x402-payment/wallet-gateway.ts`
- Impact: Broad claims can make local reference evidence look like provider-side enforcement. That violates the Tier 1 foundation rule: only gateway-owned, exact, one-use mutation attempts are protected.
- Fix approach: Keep x402 expansion behind `x402_payment.exact` conformance and claim-boundary tests. Add new action classes for `upto`, batch settlement, seller middleware, facilitator operation, or signed receipts instead of widening `x402_payment.exact`.

**Spend Window Metadata:**
- Issue: Session/day/review spend windows exist as install metadata, not enforcement. `X402SpendBoundsSchema` records `maxAtomicAmountPerSession`, `maxAtomicAmountPerDay`, `reviewThresholdAtomicAmount`, and `spendWindowEnforcementStatus: "not_enforced_local_metadata"`, while runtime/proposal enforcement checks only per-call `maxAtomicAmountPerCall`.
- Files: `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `src/runtime/ingress/index.ts`, `test/runtime/runtime-ingress.test.ts`, `examples/x402-protected-spend/run.ts`
- Impact: A user or future planner can mistake visible spend-window fields for a ledger. Multiple changed-amount retries can produce separate per-call contracts without aggregate reservation.
- Fix approach: Add a spend reservation ledger before claiming session/day/review enforcement. Until then, keep the current wording: per-call x402 spend only, aggregate windows are metadata.

**Runtime Ingress Centralization:**
- Issue: `src/runtime/ingress/index.ts` is the largest source file and hardcodes package-install, x402, and auth.md dispatch families in one discriminated union, one config type, and one proposal pipeline.
- Files: `src/runtime/ingress/index.ts`, `test/runtime/runtime-ingress.test.ts`, `src/runtime/LANE.md`
- Impact: Each new adapter family increases the chance of cross-family claim drift, missing refusal handling, or accidental authority language in a public `./runtime` subpath.
- Fix approach: Split dispatch-family adapters behind a source-owned registry while preserving the current invariant: runtime ingress emits proposal evidence only and never policy, greenlight, gateway check, receipt, certificate, or mutation authority.

**MCP Proposal Graph Gap:**
- Issue: The MCP x402 proposal bridge creates runtime evidence, tool-call draft, intent compilation, and action contract, but it does not create a generated execution graph; the output explicitly reports `generatedExecutionGraphPosture: "not_exposed_by_role_scoped_runtime_surface"`.
- Files: `src/mcp/x402-proposal.ts`, `src/mcp/reference-transcript.ts`, `src/mcp/stdio/process-proof.ts`, `test/mcp/mcp-x402-proposal.test.ts`, `src/mcp/LANE.md`
- Impact: MCP can demonstrate proposal/evidence transport, but not full generated-code graph closure. Claiming broad MCP or generated-program containment from this proof would be false.
- Fix approach: Either add a role-scoped graph-evidence creation path for MCP-hosted proposals or keep MCP documented as proposal/evidence only.

**Adapter Ceremony:**
- Issue: The local x402 path requires manual install compilation, catalog/envelope registration, hostile probe recording, runtime proposal, policy evaluation, wallet gateway call, evidence readback, and optional certificate minting.
- Files: `examples/x402-protected-spend/run.ts`, `test/product/agent-proof-slice.test.ts`, `test/integration/x402-d1-http.test.ts`, `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/wallet-gateway.ts`
- Impact: Integrators may skip probes or gateway posture because the ceremony is high. The dangerous shortcut is moving authority into the runtime or MCP surface to make adoption feel easier.
- Fix approach: Build a first-party activation recipe or SDK helper that sequences the existing calls, but keep policy, greenlight, gateway check, and signer custody outside runtime/MCP.

**.planning Scratch Drift:**
- Issue: `.planning/` is ignored by `.gitignore`, but several `.planning` files are still tracked, including `.planning/codebase/CONCERNS.md`, `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STACK.md`, `.planning/tier2/03-x402-architecture.md`, and `.planning/tier2/surfaces/10-agent-proof-slice.md`.
- Files: `.gitignore`, `.planning/codebase/CONCERNS.md`, `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STACK.md`, `.planning/tier2/03-x402-architecture.md`, `.planning/tier2/surfaces/10-agent-proof-slice.md`, `AGENTS.md`, `README.md`, `docs/internal/decisions.md`
- Impact: Future agents can load tracked scratch maps as canon and resurrect stale Tier 2 or product claims. Canon says tracked docs under `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, and `docs/internal/*` are authority; `.planning/` is derived scratch.
- Fix approach: Keep `.planning` outputs explicitly derived, never import `.planning` labels into source/package scripts/docs, and use claim-boundary tests before promoting any planning language.

## Known Bugs

**Not detected:**
- Symptoms: No reproducible runtime bug was confirmed during this static mapping pass.
- Files: `src/`, `test/`, `examples/`
- Trigger: Not applicable.
- Workaround: Not applicable.

## Security Considerations

**Signer Custody:**
- Risk: `createOfficialExactX402SigningSurface()` accepts a `ClientEvmSigner`; the local proof depends on install/probe posture proving the signer is gateway-held. The signer object itself is not a provider-grade custody proof.
- Files: `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/bypass-probes.ts`, `test/adapters/x402-wallet-gateway.test.ts`, `test/adapters/x402-bypass-probes.test.ts`
- Current mitigation: Install refusal blocks `agent_exposed`/`unknown` signer custody; hostile probes check raw private key env, official SDK side channels, raw signature header, sibling wrapper, MCP direct payment, token passthrough, wrapper drift, and failure-closed posture.
- Recommendations: Add provider/vault-specific gateway custody tests before any live/provider custody claim. Keep raw signer and `PaymentPayload` out of runtime, MCP, SDK evidence, and demos.

**MCP And Runtime Bypass:**
- Risk: Runtime ingress and MCP can record bypass-shaped evidence, but they cannot prove interception of all sibling MCP, shell, browser, network, cloud, package-manager, or repo mutation paths.
- Files: `src/runtime/ingress/index.ts`, `src/mcp/x402-proposal.ts`, `src/mcp/stdio/server.ts`, `src/mcp/stdio/process-proof.ts`, `test/runtime/runtime-ingress.test.ts`, `test/architecture/mcp-surface-posture.test.ts`
- Current mitigation: Raw sibling dispatches refuse before contract proposal; MCP source is blocked from policy/gateway/receipt/certificate imports; MCP stdio process proof carries non-claims.
- Recommendations: Require host-specific bypass probes before claiming a runtime integration protects a host. Treat MCP as proposal/evidence transport until a gateway owns the mutation credential.

**Hosted And Provider Claims:**
- Risk: The Worker and HTTP surface have local bearer-token admission and optional hosted verifier seams, but not production RBAC, hosted org auth, token rotation, JWKS, revocation, retention, or provider custody.
- Files: `src/http/admission/caller-auth.ts`, `src/http/admission/hosted-caller-identity.ts`, `src/http/admission/index.ts`, `src/worker.ts`, `wrangler.toml`, `docs/internal/decisions.md`
- Current mitigation: State-changing routes fail closed without configured tokens or durable D1 storage, and hosted mode requires a server-side verifier.
- Recommendations: Keep hosted operation language out of docs until a real verifier, credential custody model, revocation story, and customer/provider gateway check are installed and tested.

**Redaction By Pattern:**
- Risk: Evidence projections filter raw credential-looking refs with regex/string patterns. Unknown provider credential shapes may pass through if they do not match the denylist.
- Files: `src/protocol/evidence-projections/projections.ts`, `test/protocol/evidence-projections.test.ts`, `src/http/handlers/internal-record-read.ts`, `src/protocol/areas/object-registry/schemas.ts`
- Current mitigation: Raw protocol records marked `internal_only` are hidden by generic record reads; tests cover raw x402 payment signature, payload, `secretref`, token passthrough, facilitator secret, and auth.md credential-looking refs.
- Recommendations: Add provider-format fuzz tests and prefer allowlisted projection refs over broad credential denylist matching for live providers.

## Performance Bottlenecks

**Evidence Projection Assembly:**
- Problem: `assembleAgentTransactionEnvelope()` loads many record types by tenant/org and filters in memory for one contract.
- Files: `src/protocol/evidence-projections/assembly.ts`, `src/http/handlers/evidence-read.ts`, `src/storage/d1/index.ts`
- Cause: The `ProtocolStore` port exposes broad `listRecordsByType()` reads but not contract-scoped secondary indexes for all projection objects.
- Improvement path: Add contract-scoped D1 indexes or store methods for envelope assembly before hosted audit/search claims.

**Receipt Timeline Reads:**
- Problem: Receipt timeline reads fetch each stream offset individually.
- Files: `src/http/handlers/evidence-read.ts`, `src/storage/d1/index.ts`, `migrations/0001_protocol_kernel.sql`
- Cause: `loadReceiptTimelineEvents()` loops over offsets and calls `getStreamEvent()` per event.
- Improvement path: Add batched stream-event range reads once receipts contain long event spans.

## Fragile Areas

**x402 Gateway Failure Detail:**
- Files: `src/adapters/x402-payment/wallet-gateway.ts`, `test/adapters/x402-wallet-gateway.test.ts`
- Why fragile: A signer/input drift inside the signing surface is caught and mapped to `payment_signature_failed` with generic digest-only diagnostics. That protects secrets but can hide the difference between selected requirement drift, SDK failure, signer failure, and provider response failure.
- Safe modification: Add redacted reason codes to reconciliation evidence without exposing signer material or raw payloads.
- Test coverage: Current tests verify no signer call on drift/replay and no raw signature leakage; they do not require distinct redacted failure classes for all official SDK failure modes.

**Settlement Labels:**
- Files: `src/protocol/evidence-projections/projections.ts`, `src/adapters/x402-payment/conformance.ts`, `test/conformance/x402-payment-conformance.test.ts`, `test/protocol/evidence-projections.test.ts`
- Why fragile: Projection labels can include `settlement_succeeded` when an evidence ref string contains that label, while conformance classifies facilitator settlement as unsupported first-wedge operation. A reader can overinterpret labels as finality.
- Safe modification: Keep settlement labels explicitly non-authority, or require provider/facilitator adapter verification before emitting success labels.
- Test coverage: Tests prove facilitator verify is not settlement finality and facilitator settlement labels are unsupported authority; they do not prove a live settlement verifier.

**Role-Scoped SDK Surfaces:**
- Files: `src/sdk/surface-clients/runtime-client.ts`, `src/sdk/surface-clients/evidence-client.ts`, `src/sdk/client.ts`, `test/sdk/role-clients.test.ts`, `test/product/x402-protected-spend-demo-report.test.ts`
- Why fragile: The root `HandshakeClient` still exists for route parity and tests while activation docs teach `RuntimeClient`/`EvidenceClient`. New examples can accidentally use all-role client ergonomics and blur custody.
- Safe modification: Keep activation examples on `handshake-protocol-kernel/sdk/role-clients` and block all-role/fallback-token patterns in product demos.
- Test coverage: Product report tests currently assert the x402 demo uses role clients and does not import `HandshakeClient`.

**D1 Conflict Classification:**
- Files: `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `test/http/d1-http.test.ts`, `test/protocol/protocol-store-atomicity-contract.test.ts`
- Why fragile: D1 conflict handling maps database errors by message fragments such as table name plus `UNIQUE`/`constraint`.
- Safe modification: Keep D1 atomicity tests close to every schema/index change and add targeted fixtures for all unique-index conflict paths.
- Test coverage: There is D1 HTTP and protocol-store atomicity coverage; future Cloudflare/D1 error message drift remains a residual risk.

## Scaling Limits

**Runtime Dispatch Block:**
- Current capacity: `RuntimeIngressDispatchLimit` is 32 dispatches; generated graph byte size is capped at 65,536 bytes.
- Limit: Large generated programs, nested dynamic calls, or unobserved regions refuse before contract proposal.
- Scaling path: Add chunked graph evidence and continuation-safe dispatch windows before claiming long-running generated-program coverage.

**Local MCP Stdio Proof:**
- Current capacity: The MCP process proof is a local stdio reference harness with an 8,000 ms default timeout.
- Limit: It proves process shape and proposal/evidence behavior, not production MCP hosting, sibling MCP interception, remote auth, or hosted availability.
- Scaling path: Keep the stdio proof as a reference transcript; add host-specific MCP integration and bypass tests separately.

**D1 Reconstruction Queries:**
- Current capacity: D1 is durable reconstruction truth for the reference implementation.
- Limit: Projection assembly uses broad tenant/org scans and per-offset reads that will not scale to hosted audit volumes.
- Scaling path: Add contract/action/run scoped indexes and paginated evidence projections before hosted retention/search claims.

## Dependencies at Risk

**`@x402/*`:**
- Risk: The first wedge pins official SDK/package evidence around `@x402/core`, `@x402/evm`, and `@x402/fetch` at `2.12.0`. Upstream schema or signer API changes can invalidate fixture parity.
- Impact: `decodeX402PaymentRequiredEvidence()` and `createOfficialExactX402SigningSurface()` can silently lag the real x402 exact buyer flow.
- Migration plan: Treat `test/conformance/x402-upstream-exact-fixtures.test.ts` as the update gate and refresh official evidence fixtures before changing package versions.

**`@modelcontextprotocol/*` Alpha SDKs:**
- Risk: The MCP process proof records `releasePosture: "alpha_v2_sdk"` and depends on `@modelcontextprotocol/client` / `@modelcontextprotocol/server` alpha packages.
- Impact: MCP stdio behavior, schemas, or annotations may drift under the reference transcript.
- Migration plan: Pin transcript fixtures to SDK version and re-run `test/mcp/mcp-stdio-process.test.ts`, `test/mcp/mcp-reference-transcript.test.ts`, and `test/architecture/mcp-surface-posture.test.ts` on upgrade.

## Missing Critical Features

**Aggregate x402 Spend Ledger:**
- Problem: Session/day/review spend windows are metadata.
- Blocks: Any claim of aggregate spend enforcement, budget reservation, review threshold enforcement, or spend-window recovery.

**Provider/Customer Signer Custody:**
- Problem: Current x402 signer custody is local/reference or fixture-backed.
- Blocks: Live provider custody, customer wallet custody, hosted gateway custody, and external x402 payment claims.

**Host-Specific Runtime Bypass Proof:**
- Problem: Runtime/MCP bypass posture is recorded from observed/synthetic surfaces, not from every real host mutation channel.
- Blocks: Broad MCP/browser/shell/network/package-manager/cloud/repo protection claims.

**External Publication Credentials And Namespace:**
- Problem: Source now has publishable npm and MCP Registry metadata, but npm publish and MCP Registry publish require owner-held credentials and namespace authentication outside the repo.
- Blocks: Claiming the package is actually published, installable from public npm, discoverable in the MCP Registry, or endorsed by a registry/marketplace.
- Safe path: Treat `npm run pack:check` as source publish-readiness only. Actual publication should run `npm publish` and `mcp-publisher publish` under owner credentials, then verify public npm and registry API lookups.

**Facilitator And Settlement Adapter:**
- Problem: Facilitator verify/settlement are evidence labels and unsupported first-wedge surfaces, not a gateway-owned settlement-finality adapter.
- Blocks: Payment settlement finality, facilitator operation, seller middleware, and clearing-house readiness claims.

**Hosted Trust And Verification:**
- Problem: AuthorityCertificate verification is local pinned-key trust; hosted verifier, JWKS, revocation, and cross-org trust are absent.
- Blocks: Cross-org certificate trust, marketplace/certification, hosted verifier operation, and clearing-house claims.

## Test Coverage Gaps

**x402 Fuzz And Future-Schema Drift:**
- What's not tested: Adversarial `PaymentRequired` shapes across unknown extensions, malformed-but-parseable assets, multiple networks, future x402 versions, and provider-specific optional fields.
- Files: `src/adapters/x402-payment/upstream-evidence.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `test/conformance/x402-upstream-exact-fixtures.test.ts`
- Risk: A future x402 schema could be accepted as `exact` while carrying unmodeled side effects or unsupported settlement assumptions.
- Priority: High

**Live Custody Integration:**
- What's not tested: Real vault/provider signer custody lifecycle, revocation, rotation, resolver failure, and custody drift under live gateway code.
- Files: `src/adapters/x402-payment/wallet-gateway.ts`, `src/protocol/areas/credential-custody/`, `test/protocol/credential-custody.test.ts`, `test/adapters/x402-bypass-probes.test.ts`
- Risk: Local signer proof gets mistaken for provider custody.
- Priority: High

**Host Bypass Probes:**
- What's not tested: Real browser, shell, package-manager, cloud API, network, and sibling MCP bypass probes for x402 outside synthetic `X402PaymentConformancePosture`.
- Files: `src/adapters/x402-payment/bypass-probes.ts`, `src/runtime/ingress/index.ts`, `src/mcp/stdio/process-proof.ts`, `test/runtime/runtime-ingress.test.ts`, `test/adapters/x402-bypass-probes.test.ts`
- Risk: The system detects bypass-shaped evidence but cannot prove the host blocks raw paths.
- Priority: High

**Planning Drift Guard:**
- What's not tested: `.planning` files are not scanned by active vocabulary/claim-boundary tests even though some `.planning` files are tracked.
- Files: `.planning/codebase/CONCERNS.md`, `.planning/tier2/03-x402-architecture.md`, `test/architecture/active-vocabulary.test.ts`, `test/architecture/claim-boundary.test.ts`, `.gitignore`
- Risk: Scratch docs can contradict tracked canon and be reloaded by future planning agents.
- Priority: Medium

**Projection Scale:**
- What's not tested: D1 projection assembly under high tenant/org record volume and long receipt timelines.
- Files: `src/protocol/evidence-projections/assembly.ts`, `src/http/handlers/evidence-read.ts`, `src/storage/d1/index.ts`
- Risk: Hosted evidence reads can become slow or memory-heavy before product claims catch up.
- Priority: Medium

---

*Concerns audit: 2026-05-24*
