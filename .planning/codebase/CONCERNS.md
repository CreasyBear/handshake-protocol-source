# Codebase Concerns

**Analysis Date:** 2026-05-24

## Tech Debt

**x402 First-Slice Boundary:**
- Issue: The x402 implementation is one local/reference buyer-side `x402_payment.exact` path. It proves exact contract proposal, per-call policy, one-use gateway check, gateway-held payment signature evidence, local/reference 402 challenge evidence, and redacted evidence projection. It does not prove broad x402 compatibility, `upto`, batch settlement, lifecycle hooks, MCP auto-pay, signed offers, signed receipts, seller middleware, facilitator operation, hosted custody, or provider/customer custody.
- Files: `README.md`, `docs/internal/protocol-definition.md`, `docs/internal/protocol-notes.md`, `examples/x402-protected-spend/README.md`, `src/adapters/x402-payment/conformance.ts`, `test/conformance/x402-payment-conformance.test.ts`, `test/architecture/claim-boundary.test.ts`
- Impact: A future adapter, demo, or planning phase can turn a clean local proof surface into an overbroad product claim. That breaks the rule that Handshake protects only installed paths where the gateway owns the mutation credential and checks the exact greenlight before consequence.
- Fix approach: Add new action classes and conformance checks for unsupported x402 surfaces. Do not widen `x402_payment.exact`.

**Spend Window Metadata:**
- Issue: x402 spend control is per-call only. `X402SpendBoundsSchema` carries `maxAtomicAmountPerSession`, `maxAtomicAmountPerDay`, `reviewThresholdAtomicAmount`, and `spendWindowEnforcementStatus: "not_enforced_local_metadata"`, while runtime and adapter enforcement check `maxAtomicAmountPerCall`.
- Files: `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `src/runtime/ingress/index.ts`, `test/adapters/x402-install-proposal.test.ts`, `test/runtime/runtime-ingress.test.ts`, `examples/x402-protected-spend/run.ts`
- Impact: Multiple changed-amount retry dispatches can become separate per-call contracts without aggregate budget reservation. Any session/day/review budget claim is false until a ledger exists.
- Fix approach: Add a spend reservation ledger with tenant/org/principal/agent/action/resource/time-window keys, reservation state, conflict semantics, and recovery evidence before claiming aggregate spend enforcement.

**Signed Retry Evidence Boundary:**
- Issue: The local paid HTTP sandbox can emit official-shaped 402 evidence and record one signed retry after gateway-created signature evidence. That retry has `authorityCreated: false`; it is downstream fixture evidence, not policy, greenlight, gateway check, settlement proof, or signing authority.
- Files: `src/adapters/x402-payment/sandbox-http.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `examples/x402-protected-spend/README.md`, `examples/x402-protected-spend/run.ts`, `test/adapters/x402-wallet-gateway.test.ts`, `test/integration/x402-d1-http.test.ts`
- Impact: The sandbox can be misread as seller middleware, facilitator operation, or payment finality. The correct evidence role is local reconstruction of a post-gate signed retry.
- Fix approach: Keep sandbox outputs under local/reference labels, keep `authorityCreated: false`, and require a live seller/facilitator adapter before exposing settlement or middleware claims.

**Runtime Ingress Family Hardcoding:**
- Issue: `src/runtime/ingress/index.ts` is a 1,014-line cross-family module that hardcodes package install, x402 payment, and auth.md protected API dispatches in one discriminated union and one proposal pipeline.
- Files: `src/runtime/ingress/index.ts`, `src/runtime/LANE.md`, `test/runtime/runtime-ingress.test.ts`
- Impact: Each new protected-action family increases the chance of missed refusal fields, cross-family parameter drift, and accidental authority language in the public `./runtime` subpath.
- Fix approach: Move dispatch-family conversion behind source-owned family adapters or a registry. Preserve the invariant that runtime ingress creates proposal evidence only: no policy decisions, greenlights, gateway checks, mutation attempts, receipts, or authority certificates.

**MCP Proposal Graph Gap:**
- Issue: The MCP x402 proposal bridge records runtime execution, tool-call draft, intent compilation, and action contract, but not generated execution graph evidence. The result reports `generatedExecutionGraphPosture: "not_exposed_by_role_scoped_runtime_surface"`.
- Files: `src/mcp/x402-proposal.ts`, `src/mcp/LANE.md`, `test/mcp/mcp-x402-proposal.test.ts`, `scripts/check-published-entrypoints.mjs`
- Impact: MCP can prove proposal/evidence transport. It cannot prove generated-program graph closure or broad MCP host containment.
- Fix approach: Either add a role-scoped generated-graph evidence path for MCP proposals or keep MCP documented and tested as proposal/evidence only.

**MCP x402 Request-Posture Gap:**
- Issue: The direct x402 adapter and runtime ingress schemas now model `intendedRequestBodyPosture`, `providerEnvironmentPosture`, and `providerEnvironmentRef`, but the model-facing MCP x402 proposal schema carries only `intendedRequestBodyDigest` and no provider-environment posture. MCP proposals therefore cannot express the same refusal boundary as `src/adapters/x402-payment/action-proposal.ts`.
- Files: `src/mcp/x402-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `src/runtime/ingress/index.ts`, `test/mcp/mcp-x402-proposal.test.ts`, `test/adapters/x402-payment-action-proposal.test.ts`
- Impact: MCP remains proposal/evidence only, so this does not create authority. It does create adoption risk: a live or unknown provider environment can be presented through MCP as if it were local/reference context, and digest-bound body semantics can be weaker or fail later at the gateway instead of refusing before contract proposal.
- Fix approach: Add the same request-body and provider-environment posture fields to `McpX402PaymentProposalInputSchema`, bind them into `x402Parameters()` and `deriveMcpX402IdempotencyKey()`, and add MCP tests proving live/unknown and omitted/unsupported postures refuse before contract proposal.

**Adapter Activation Ceremony:**
- Issue: The x402 local path requires install compilation, catalog/envelope registration, bypass probes, protected-path posture, runtime proposal, policy evaluation, gateway execution, evidence projection, and optional terminal certificate minting.
- Files: `examples/x402-protected-spend/run.ts`, `examples/x402-protected-spend/README.md`, `test/product/agent-proof-slice.test.ts`, `test/integration/x402-d1-http.test.ts`, `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/wallet-gateway.ts`
- Impact: Integrators can skip posture/probe setup or push authority into runtime/MCP for convenience.
- Fix approach: Build activation helpers that sequence the existing calls. Do not move signer custody, policy, greenlight, gateway check, or mutation authority into runtime/MCP.

**Publishable Dist Artifact Drift:**
- Issue: The package surface is publishable through bundled Node artifacts in `dist/`, but the current dirty worktree has source changes in the x402 sandbox/adapter path without dirty `dist/` outputs. `npm run pack:check` rebuilds before verification, but the checkout state itself can show source/package claims that are newer than generated package artifacts.
- Files: `package.json`, `scripts/build-package-bundles.mjs`, `scripts/check-package-surface.mjs`, `scripts/check-published-entrypoints.mjs`, `src/adapters/x402-payment/sandbox-http.ts`, `src/adapters/x402-payment/index.ts`, `dist/`
- Impact: Publishing or smoke-testing without the build gate can ship stale CLI/MCP/runtime bundles that omit the current x402 sandbox/evidence surface.
- Fix approach: Treat `npm run pack:check` as mandatory before publish or release claims. Do not rely on checked-in `dist/` contents as current unless `npm run build` has just run and the package-surface scripts pass.

**.planning Scratch Drift:**
- Issue: Canon says `.planning/` is scratch, but `.planning/codebase/CONCERNS.md` and related maps are tracked derived artifacts.
- Files: `.planning/codebase/CONCERNS.md`, `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STACK.md`, `.gitignore`, `AGENTS.md`, `README.md`, `docs/internal/decisions.md`
- Impact: Future agents can reload derived maps as canon and revive stale Tier 2 language.
- Fix approach: Keep `.planning` docs explicitly derived. Promote only source-backed claims into `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, or `docs/internal/*`.

## Known Bugs

**Runtime x402 Posture Fields Are Not Propagated:**
- Symptoms: `RuntimeIngressObservedDispatchSchema` accepts `intendedRequestBodyPosture`, `providerEnvironmentPosture`, and `providerEnvironmentRef` for x402 dispatches, but `x402PaymentAttemptForDispatch()` passes `intendedRequestBodyDigest` and omits those posture fields. `X402PaymentAttemptSchema` then defaults to `no_body` and `local_reference_sandbox`.
- Files: `src/runtime/ingress/index.ts`, `src/adapters/x402-payment/action-proposal.ts`, `test/runtime/runtime-ingress.test.ts`, `test/adapters/x402-payment-action-proposal.test.ts`
- Trigger: Submit a runtime-ingress `wrapped_x402_payment` dispatch with `intendedRequestBodyPosture: "unsupported"` or `providerEnvironmentPosture: "live"`. The direct adapter path refuses that posture; runtime ingress needs explicit propagation and regression coverage.
- Workaround: Use `buildX402PaymentAttemptFromRequiredEvidence()` or the direct adapter proposal path for official x402 evidence until runtime ingress forwards the posture fields and tests the refusal.

**MCP x402 Proposal Cannot Represent Provider Environment Posture:**
- Symptoms: `McpX402PaymentProposalInputSchema` has no `providerEnvironmentPosture`, `providerEnvironmentRef`, or `intendedRequestBodyPosture` field, while `x402Parameters()` forwards neither value to the resulting action-contract parameters.
- Files: `src/mcp/x402-proposal.ts`, `test/mcp/mcp-x402-proposal.test.ts`, `src/adapters/x402-payment/action-proposal.ts`, `src/adapters/x402-payment/wallet-gateway.ts`
- Trigger: Submit an MCP x402 proposal for a digest-bound request body or a live/unknown provider environment. MCP can propose a contract that the direct adapter path would refuse or bind more explicitly.
- Workaround: Use direct adapter/runtime-client proposal paths for official x402 request posture until MCP schema parity is added. Keep MCP documented as proposal/evidence only.

## Security Considerations

**Signer Custody Is Local/Fixture Evidence:**
- Risk: `createOfficialExactX402SigningSurface()` accepts a `ClientEvmSigner`; local tests prove signer use happens after `VerifiedGatewayCheck`, but the signer object is not provider-grade custody or vault lifecycle proof.
- Files: `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/bypass-probes.ts`, `test/adapters/x402-wallet-gateway.test.ts`, `test/adapters/x402-bypass-probes.test.ts`
- Current mitigation: Install proposals refuse non-gateway-held signer posture; conformance probes check raw private key env, direct SDK signing, paid fetch/axios clients, raw signature header, sibling wrapper, MCP direct payment, token passthrough, wrapper drift, and failure-closed behavior.
- Recommendations: Add real provider/customer gateway custody tests, rotation/revocation tests, and resolver failure tests before any live custody claim.

**Broad Host Interception Is Not Proven:**
- Risk: Runtime ingress and MCP record observed or synthetic bypass-shaped evidence. They do not prove all browser, shell, MCP, package-manager, cloud, network, database, or repo mutation paths are intercepted in a real host.
- Files: `src/runtime/ingress/index.ts`, `src/mcp/x402-proposal.ts`, `src/mcp/stdio/process-proof.ts`, `src/adapters/x402-payment/bypass-probes.ts`, `test/runtime/runtime-ingress.test.ts`, `test/architecture/mcp-surface-posture.test.ts`
- Current mitigation: Raw sibling x402 dispatches refuse before contract proposal; MCP is blocked from policy, gateway, receipt, mutation, signer, and certificate authority surfaces.
- Recommendations: Require host-specific bypass probes and gateway-owned credentials before claiming protection for a runtime, MCP host, browser tool, shell wrapper, package manager, or cloud adapter.

**Request Body And Environment Gates Are Narrow:**
- Risk: x402 request-body and provider-environment checks cover first-slice posture values: `no_body`, `digest_bound`, `omitted`, `unsupported`, `local_reference_sandbox`, `external_sandbox`, `live`, and `unknown`. These are not a general HTTP request canonicalization or live provider verification model.
- Files: `src/adapters/x402-payment/action-proposal.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/sandbox-http.ts`, `test/adapters/x402-payment-action-proposal.test.ts`, `test/adapters/x402-wallet-gateway.test.ts`
- Current mitigation: The direct adapter path refuses unsupported/omitted body posture, missing body digest, no-body/body-digest mismatch, and live/unknown provider environment posture.
- Recommendations: Bind full HTTP method, URL, selected headers, body digest, environment proof, and provider challenge evidence through runtime ingress before live paid HTTP claims.

**Redaction By Pattern:**
- Risk: Evidence projections redact credential-looking refs with allow/deny behavior and regex/string matching. Unknown provider credential formats can evade the current pattern set.
- Files: `src/protocol/evidence-projections/projections.ts`, `src/protocol/evidence-projections/assembly.ts`, `src/http/handlers/evidence-read.ts`, `test/protocol/evidence-projections.test.ts`
- Current mitigation: Generic raw reads hide `internal_only` objects, and tests cover x402 signature/payload refs, `secretref`, token passthrough, facilitator secret refs, and auth.md credential-looking refs.
- Recommendations: Prefer allowlisted projection refs for live providers and add provider-format fuzz tests.

**Hosted And Provider Claims:**
- Risk: HTTP/Worker admission models caller custody and D1 storage, but not production RBAC, token rotation, JWKS, revocation, retention, provider custody, or hosted verifier operation.
- Files: `src/http/admission/caller-auth.ts`, `src/http/admission/hosted-caller-identity.ts`, `src/http/handlers/evidence-read.ts`, `src/worker.ts`, `wrangler.toml`, `docs/internal/decisions.md`
- Current mitigation: Canonical docs state this is a local protocol kernel, and state-changing routes require configured custody tokens and D1 storage.
- Recommendations: Keep hosted operation and provider-side enforcement out of product claims until real deployment, auth, custody, revocation, retention, and customer/provider gateway checks exist.

## Performance Bottlenecks

**Evidence Projection Assembly:**
- Problem: `assembleAgentTransactionEnvelope()` loads many object types by tenant/org and filters them in memory for one contract.
- Files: `src/protocol/evidence-projections/assembly.ts`, `src/protocol/evidence-projections/projections.ts`, `src/http/handlers/evidence-read.ts`, `src/storage/d1/index.ts`
- Cause: `ProtocolStore` exposes broad `listRecordsByType()` reads, while envelope assembly needs contract-scoped secondary indexes for policy, greenlight, gateway, mutation, receipt, reconciliation, credential resolution, proof gap, refusal, recovery, and isolation records.
- Improvement path: Add contract/action/run scoped store methods and D1 indexes before hosted audit/search claims.

**Receipt Timeline Reads:**
- Problem: Receipt timeline projection loads stream events one offset at a time.
- Files: `src/http/handlers/evidence-read.ts`, `src/storage/d1/index.ts`, `migrations/0001_protocol_kernel.sql`
- Cause: `loadReceiptTimelineEvents()` loops over every receipt stream offset and calls `store.getStreamEvent()` for each.
- Improvement path: Add batched stream-event range reads for long receipt timelines.

## Fragile Areas

**x402 Gateway Failure Detail:**
- Files: `src/adapters/x402-payment/wallet-gateway.ts`, `test/adapters/x402-wallet-gateway.test.ts`
- Why fragile: Signing-surface failures collapse to `payment_signature_failed` with digest-only diagnostics. This protects secrets but blurs selected-requirement drift, SDK failure, signer failure, provider response failure, and sandbox retry refusal.
- Safe modification: Add redacted failure reason codes to reconciliation evidence without exposing signer material, `PaymentPayload`, or `PAYMENT-SIGNATURE`.
- Test coverage: Tests prove no signer call on replay/drift and no raw signature leakage. They do not require distinct redacted failure classes for every official SDK failure mode.

**Facilitator And Settlement Labels:**
- Files: `src/adapters/x402-payment/conformance.ts`, `src/protocol/evidence-projections/projections.ts`, `test/conformance/x402-payment-conformance.test.ts`, `test/protocol/evidence-projections.test.ts`
- Why fragile: Projection labels can mention facilitator verify or settlement-shaped evidence while conformance classifies facilitator operation outside the first wedge.
- Safe modification: Keep facilitator labels explicitly non-authority until a facilitator adapter verifies settlement finality.
- Test coverage: Tests distinguish facilitator verify from settlement finality and classify facilitator settlement as unsupported first-wedge authority.

**Role-Scoped SDK Discipline:**
- Files: `src/sdk/surface-clients/runtime-client.ts`, `src/sdk/surface-clients/evidence-client.ts`, `src/sdk/client.ts`, `test/sdk/role-clients.test.ts`, `test/product/x402-protected-spend-demo-report.test.ts`
- Why fragile: The root `HandshakeClient` remains for route parity and tests, while activation docs teach `RuntimeClient` and `EvidenceClient`. New demos can accidentally use all-role ergonomics and blur custody.
- Safe modification: Keep activation examples on `handshake-protocol-kernel/sdk/role-clients` and keep all-role clients out of product walkthroughs.
- Test coverage: Product report tests assert the x402 demo uses role clients and does not import `HandshakeClient`.

**Buyer-Readable x402 Proof-Object Label:**
- Files: `examples/x402-protected-spend/README.md`, `examples/x402-protected-spend/run.ts`, `src/adapters/x402-payment/action-proposal.ts`, `test/product/x402-protected-spend-demo-report.test.ts`
- Why fragile: The report labels the buyer-readable proof object as `x402_paid_http_call.exact`, while the actual action class remains `x402_payment.exact`. That label is useful product language, but it is not an action catalog entry or gateway-bound authority type.
- Safe modification: Keep `x402_paid_http_call.exact` confined to buyer-readable report fields until the action catalog, runtime compiler, policy, and gateway all expose a matching action class.
- Test coverage: Product report tests check local non-claims and action evidence. They do not yet guard the proof-object label as non-authority language.

**D1 Conflict Classification:**
- Files: `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `test/http/d1-http.test.ts`, `test/protocol/protocol-store-atomicity-contract.test.ts`
- Why fragile: D1 conflict handling maps database errors by message fragments and constraint/table names.
- Safe modification: Keep D1 atomicity tests close to schema/index changes and add fixtures for every unique-index conflict path.
- Test coverage: D1 HTTP and store atomicity tests cover current paths; Cloudflare/D1 error-message drift remains residual risk.

## Scaling Limits

**Runtime Dispatch Block:**
- Current capacity: `RuntimeIngressDispatchLimit` is 32 dispatches and generated graph byte size is capped at 65,536 bytes.
- Limit: Large generated programs, nested dynamic calls, and unobserved regions refuse before contract proposal.
- Scaling path: Add chunked graph evidence and continuation-safe dispatch windows before claiming long-running generated-program coverage.

**Local MCP Stdio Proof:**
- Current capacity: MCP is a local stdio proposal/evidence process proof with one public x402 proposal tool.
- Limit: It does not prove hosted MCP availability, sibling MCP interception, remote host auth, gateway custody, signer custody, mutation execution, receipt export, or certificate minting.
- Scaling path: Keep the local stdio process proof as a transcript. Add real host transcripts, process supervision, and host-specific bypass tests separately.

**D1 Reconstruction Queries:**
- Current capacity: D1 is durable reconstruction truth for the reference implementation.
- Limit: Projection assembly uses broad tenant/org scans and per-offset receipt reads that do not scale to hosted evidence volumes.
- Scaling path: Add contract-scoped indexes, range reads, pagination, and retention policy before hosted audit/search claims.

## Dependencies at Risk

**`@x402/*`:**
- Risk: The current proof depends on official x402 SDK shapes from `@x402/core`, `@x402/evm`, and `@x402/fetch` and fixture package evidence.
- Impact: Upstream schema, `PaymentRequired`, signer, or header encoding changes can invalidate `decodeX402PaymentRequiredEvidence()` and `createOfficialExactX402SigningSurface()`.
- Migration plan: Treat `test/conformance/x402-upstream-exact-fixtures.test.ts`, `test/adapters/x402-wallet-gateway.test.ts`, and `test/integration/x402-d1-http.test.ts` as update gates before changing x402 package versions.

**`@modelcontextprotocol/*` SDKs:**
- Risk: The local MCP stdio proof depends on official MCP SDK client/server behavior.
- Impact: Tool schemas, resource mapping, annotations, or stdio process behavior can drift under `src/mcp/stdio/*`.
- Migration plan: Re-run `test/mcp/mcp-stdio-process.test.ts`, `test/mcp/mcp-reference-transcript.test.ts`, and `test/architecture/mcp-surface-posture.test.ts` on SDK upgrades.

## Missing Critical Features

**Aggregate x402 Spend Ledger:**
- Problem: Session/day/review spend windows are metadata.
- Blocks: Aggregate spend enforcement, budget reservation, review threshold enforcement, spend-window recovery, and per-principal spend reporting.

**Live Provider/Customer Custody:**
- Problem: x402 signer custody is local/reference or fixture-backed, and provider-specific custody lifecycle is absent.
- Blocks: Live provider custody, customer wallet custody, hosted gateway custody, facilitator operation, seller middleware, and external x402 payment claims.

**Broad Runtime And Host Interception:**
- Problem: Runtime/MCP bypass posture is observed or synthetic. There is no broad interception across MCP, browser, shell, package manager, network, cloud APIs, database tools, or repo writes.
- Blocks: Generic MCP/runtime control, broad browser/shell/network/package protection, and host-wide generated-code containment claims.

**Facilitator/Seller Middleware Adapter:**
- Problem: Facilitator verify/settlement labels are reconstruction evidence and unsupported first-wedge surfaces.
- Blocks: Payment settlement finality, seller middleware, facilitator operation, and clearing-house readiness.

**Hosted Trust And Verification:**
- Problem: `AuthorityCertificate` verification is local pinned-key trust. Hosted verifier, JWKS, revocation, and cross-org trust are absent.
- Blocks: Cross-org certificate trust, marketplace/certification, hosted verifier operation, and clearing-house claims.

**Public npm and MCP Registry Publication:**
- Problem: Source has npm package metadata, Node CLI/MCP bins, `server.json`, and pack-smoke gates, but actual npm publication and MCP Registry namespace publication require owner-held credentials outside the repo.
- Blocks: Claims that `handshake-protocol-kernel` is publicly installable from npm, discoverable in the MCP Registry, endorsed by a registry, or operating as hosted infrastructure.

## Test Coverage Gaps

**Runtime x402 Posture Propagation:**
- What's not tested: Runtime-ingress x402 dispatches with `intendedRequestBodyPosture: "unsupported"` or `providerEnvironmentPosture: "live"` refusing before contract proposal.
- Files: `src/runtime/ingress/index.ts`, `test/runtime/runtime-ingress.test.ts`, `src/adapters/x402-payment/action-proposal.ts`
- Risk: Runtime ingress can default away request-body/environment posture and propose a contract that the direct adapter path would refuse.
- Priority: High

**MCP x402 Posture Parity:**
- What's not tested: MCP x402 proposals carrying request-body posture, provider-environment posture, local/reference sandbox refs, and refusal behavior for live/unknown provider environments.
- Files: `src/mcp/x402-proposal.ts`, `test/mcp/mcp-x402-proposal.test.ts`, `test/architecture/mcp-surface-posture.test.ts`
- Risk: MCP proposal/evidence output can drift from direct adapter semantics and teach a weaker x402 binding surface.
- Priority: High

**x402 Future-Schema Fuzzing:**
- What's not tested: Adversarial `PaymentRequired` variants across unknown extensions, multiple accepts entries, future x402 versions, malformed-but-parseable assets, non-exact schemes, and provider-specific optional fields.
- Files: `src/adapters/x402-payment/upstream-evidence.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `test/conformance/x402-upstream-exact-fixtures.test.ts`
- Risk: A future x402 shape can be accepted while carrying unmodeled side effects or unsupported settlement assumptions.
- Priority: High

**Live Custody Integration:**
- What's not tested: Real provider/vault signer custody, rotation, revocation, resolver failure, custody drift, and provider-specific redaction behavior under gateway code.
- Files: `src/adapters/x402-payment/wallet-gateway.ts`, `src/protocol/areas/credential-custody/`, `test/protocol/credential-custody.test.ts`, `test/adapters/x402-bypass-probes.test.ts`
- Risk: Local signer proof gets mistaken for provider/customer custody.
- Priority: High

**Host Bypass Probes:**
- What's not tested: Real browser, shell, package-manager, cloud API, network, repo, and sibling MCP bypass probes for x402 outside synthetic `X402PaymentConformancePosture`.
- Files: `src/adapters/x402-payment/bypass-probes.ts`, `src/adapters/x402-payment/conformance.ts`, `src/runtime/ingress/index.ts`, `src/mcp/stdio/process-proof.ts`, `test/runtime/runtime-ingress.test.ts`, `test/adapters/x402-bypass-probes.test.ts`
- Risk: The system can detect bypass-shaped evidence but cannot prove a host blocks raw paths.
- Priority: High

**Projection Scale:**
- What's not tested: D1 projection assembly under high tenant/org record volume and long receipt timelines.
- Files: `src/protocol/evidence-projections/assembly.ts`, `src/http/handlers/evidence-read.ts`, `src/storage/d1/index.ts`
- Risk: Hosted evidence reads become slow or memory-heavy before product claims catch up.
- Priority: Medium

**Planning Drift Guard:**
- What's not tested: `.planning` files are not scanned by active vocabulary and claim-boundary tests even when tracked.
- Files: `.planning/codebase/CONCERNS.md`, `.planning/tier2/03-x402-architecture.md`, `test/architecture/active-vocabulary.test.ts`, `test/architecture/claim-boundary.test.ts`, `.gitignore`
- Risk: Scratch docs can contradict canon and be reloaded by future planning agents.
- Priority: Medium

---

*Concerns audit: 2026-05-24*
