# Codebase Concerns

**Analysis Date:** 2026-05-20

## Review Scope

This concerns map treats tracked canon, source, migrations, and tests as truth.
Planning files under `.planning/` are pressure context only, not repo-facing
taxonomy or claim authority.

**Canon and source anchors:**
- `AGENTS.md`
- `README.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-definition.md`
- `docs/internal/protocol-kernel-architecture.md`
- `docs/internal/protocol-notes.md`
- `src/protocol/kernel.ts`
- `src/protocol/areas/*`
- `src/http/*`
- `src/adapters/*`
- `src/runtime/*`
- `src/storage/*`
- `test/**/*`
- `migrations/0001_protocol_kernel.sql`

**Planning pressure read:**
- `.planning/tier2/06-policy-agent-management-interface-map.md`
- `.planning/tier2/07-agentic-economy-clearing-house-research.md`
- `.planning/tier2/08-external-adapter-plug-in-architecture.md`
- `.planning/tier2/09-tier1-kernel-establishment-delta.md`

## Foundation Status

**Local kernel foundation:**
- Issue: No local-foundation blocker is detected in the current source/test map.
- Files: `README.md`, `docs/internal/decisions.md`, `docs/internal/protocol-definition.md`, `docs/internal/protocol-kernel-architecture.md`, `src/protocol/kernel.ts`, `test/protocol/model-based-invariants.test.ts`, `test/protocol/transition-matrix.test.ts`, `test/protocol/action-attempt-lifecycle.test.ts`, `test/protocol/protocol-store-atomicity-contract.test.ts`
- Impact: The repo can accurately claim local protocol-kernel foundation for exact contract, policy decision, one-use greenlight, gateway check, receipt/refusal/proof-gap, derived lifecycle evidence, idempotency ledger, redacted projections, package-install local binding, and local x402 D1/HTTP fixture proof.
- Fix approach: Keep the claim local. Do not promote local fixtures, hosted seams, or planning docs into provider/runtime enforcement language.

**Boundary exclusions:**
- Issue: The repo explicitly does not prove live provider custody, hosted org auth/RBAC/search, external package material attestation, public runtime/MCP/CLI/browser interception, or portable verifier trust.
- Files: `README.md`, `docs/internal/decisions.md`, `docs/internal/protocol-definition.md`, `src/experimental.ts`, `src/conformance/index.ts`, `src/http/admission/hosted-caller-identity.ts`
- Impact: Any product, README, package, or planning artifact that implies those surfaces are currently enforced overclaims the code.
- Fix approach: Preserve the local-foundation wording and require new source/tests before expanding the claim.

## Blockers

**Public runtime/tool-stream interception claim:**
- Issue: Runtime evidence and codemode flows are source-owned fixtures, not a live adapter that intercepts MCP calls, browser tools, shell commands, network calls, package managers, filesystem writes, or dynamically constructed tool dispatch from a real agent runtime.
- Files: `src/runtime/codemode-multi-action/generated-program-runner.ts`, `src/runtime/codemode-multi-action/generated-graph-evidence.ts`, `src/protocol/areas/generated-execution-graph/coverage.ts`, `src/protocol/areas/tool-call-draft/`, `test/runtime/codemode-multi-action-runtime.test.ts`, `test/protocol/generated-execution-graph.test.ts`, `test/protocol/representation-contract.test.ts`
- Impact: This blocks public claims that Handshake currently detects arbitrary consequential candidates from live generated programs. The generated code has not been forced through a real runtime dispatch boundary.
- Fix approach: Build a runtime ingress adapter that observes actual tool dispatch, emits `RuntimeExecution`, `GeneratedExecutionGraph`, and finalized `ToolCallDraft` records, and proves raw sibling mutation paths terminate as refusal or proof gap.

**Live provider/customer gateway enforcement claim:**
- Issue: Gateway enforcement is locally proven through reference adapters and x402 wallet fixtures. It is not proven through a production provider gateway or customer-installed credential boundary.
- Files: `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, `src/adapters/preview-deploy/gateway.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/bypass-probes.ts`, `test/integration/x402-d1-http.test.ts`, `test/adapters/x402-bypass-probes.test.ts`, `test/conformance/protected-mutation-adapter-conformance.test.ts`
- Impact: This blocks provider-side enforcement, live wallet custody, and production protected-surface claims. Local x402 D1/HTTP proof remains valid as a reference path only.
- Fix approach: Keep gateway adapters behind `src/experimental.ts` until a real provider/customer gateway runs the same exact-greenlight, posture, replay, custody, and proof-gap tests outside the local fixture harness.

**Hosted operation claim:**
- Issue: HTTP admission has bearer-token roles and a hosted caller identity seam, but no hosted org auth, policy management, RBAC, retention, search, alerting, audit export, or credential custody operation.
- Files: `src/http/admission/caller-auth.ts`, `src/http/admission/hosted-caller-identity.ts`, `src/http/routes/transition-route-registry.ts`, `src/http/handlers/evidence-read.ts`, `test/http/http.test.ts`, `test/http/d1-http.test.ts`
- Impact: This blocks claims that the repo is an operated control plane. The HTTP surface is a transport/reference seam, not a hosted product boundary.
- Fix approach: Add hosted identity verification, authorization models, retention/read policies, and custody tests before calling any route surface hosted enforcement.

## Deferred Risks

**Protected-action representation is non-authority scaffolding:**
- Issue: Metadata, Challenge, Request, and EvidenceProjection contracts exist as internal representation shapes, but no public MCP/CLI/SDK workflow makes them an ergonomic activation surface.
- Files: `src/protocol/areas/protected-action-representation/`, `test/protocol/representation-contract.test.ts`, `.planning/tier2/06-policy-agent-management-interface-map.md`
- Impact: The representation layer can guide future product work, but it must not be treated as admission or authority.
- Fix approach: Build public representation surfaces only after tests prove they cannot mint greenlights, mutate, or hide raw records.

**External adapter plug-in architecture is not a general SDK contract:**
- Issue: x402, package install, repo write, and preview deploy establish reference shapes, while adapter-pack distribution, manifests, hostile probe gates, marketplace/certification language, and external conformance remain planning-level.
- Files: `src/install/`, `src/adapters/x402-payment/install-proposal.ts`, `src/conformance/index.ts`, `src/experimental.ts`, `test/architecture/root-exports.test.ts`, `.planning/tier2/08-external-adapter-plug-in-architecture.md`
- Impact: Adapter extensibility is directionally sound but not yet a public plug-in platform.
- Fix approach: Keep plug-in and certification claims out of canon until adapter manifests, probe requirements, package boundaries, and root exports are source-enforced.

**Clearing-house envelope remains read-only evidence:**
- Issue: `clearingEvidenceRefs` and `AgentTransactionEnvelopeProjection` carry correlation, obligation, counterparty, refusal, proof-gap, ledger, recovery, and isolation references without creating new authority.
- Files: `src/protocol/foundation/schema-core.ts`, `src/protocol/areas/intent-compilation/schemas.ts`, `src/protocol/areas/action-contract/schemas.ts`, `src/protocol/evidence-projections/projections.ts`, `test/protocol/evidence-projections.test.ts`, `.planning/tier2/07-agentic-economy-clearing-house-research.md`
- Impact: Clearing language is safe only as evidence projection. It is not settlement, counterparty novation, marketplace operation, or portable verifier trust.
- Fix approach: Keep envelope projections read-only until external verifiers, dispute/recovery rules, and settlement/finality evidence have their own policy model.

## Tech Debt

**x402 spend-bound schema exposes unenforced counters:**
- Issue: `maxAtomicAmountPerCall` is enforced before compilation, but `maxAtomicAmountPerSession`, `maxAtomicAmountPerDay`, and `reviewThresholdAtomicAmount` have no accumulator, reservation, policy read path, or review routing.
- Files: `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `test/adapters/x402-install-proposal.test.ts`, `test/adapters/x402-payment-action-proposal.test.ts`
- Impact: The schema can look more authority-bearing than the implementation. Only per-call spend is enforced in the local x402 path.
- Fix approach: Either mark session/day/review fields as declared non-authority metadata or add a replay-safe spend counter table and policy evaluator path.

**Review artifact provenance is caller-supplied:**
- Issue: Review artifacts bind exact contract and policy input digests, but renderer, catalog, and action-binding digests are supplied by the caller. There is no source-owned renderer registry or artifact generator.
- Files: `src/protocol/areas/review-binding/artifacts.ts`, `src/protocol/areas/review-binding/decisions.ts`, `src/protocol/areas/review-binding/schemas.ts`, `test/protocol/kernel-policy-gateway.test.ts`
- Impact: Protocol binding is strong, but product review surfaces remain unaudited until renderer provenance is source-owned. A weak renderer can still produce bad human comprehension while satisfying digest fields supplied by its own caller.
- Fix approach: Add a renderer registry/generator that computes artifact, catalog, renderer, and action-binding digests from source-owned inputs.

**Lifecycle, receipt, and projection status models can drift:**
- Issue: Terminal meanings appear in `protocolNavigation`, `ActionAttemptLifecycle`, receipt status derivation, and evidence projections.
- Files: `src/protocol/navigation/index.ts`, `src/protocol/areas/action-attempt-lifecycle/matrix.ts`, `src/protocol/areas/receipt-export/status.ts`, `src/protocol/evidence-projections/projections.ts`, `test/protocol/action-attempt-lifecycle.test.ts`, `test/protocol/evidence-projections.test.ts`
- Impact: Multiple maps make status drift easy when new transitions or outcomes are added.
- Fix approach: Keep one source-owned terminal status map and derive receipt/projection/lifecycle assertions from it.

**Conformance probes are caller-supplied and narrow:**
- Issue: `checkProtectedMutationAdapterConformance` checks whether a supplied probe mutates without `VerifiedGatewayCheck`; it does not inspect the adapter implementation, credential custody, provider behavior, or bypass surfaces.
- Files: `src/conformance/index.ts`, `src/conformance/LANE.md`, `test/conformance/protected-mutation-adapter-conformance.test.ts`, `test/conformance/x402-payment-conformance.test.ts`
- Impact: Passing conformance proves one supplied probe did not mutate. It is not adapter certification.
- Fix approach: Keep conformance language narrow and add probe suites per adapter family instead of broad pass/fail certification.

## Known Bugs

**No confirmed local-foundation correctness bug detected:**
- Symptoms: Current source/tests preserve the local authority path from exact contract to policy, greenlight, gateway check, receipt/refusal/proof-gap, lifecycle, idempotency, and D1/memory atomicity.
- Files: `test/protocol/model-based-invariants.test.ts`, `test/protocol/kernel-policy-gateway.test.ts`, `test/protocol/kernel-idempotency-ledger.test.ts`, `test/protocol/protocol-store-atomicity-contract.test.ts`, `test/integration/x402-d1-http.test.ts`
- Trigger: Not applicable.
- Workaround: Not applicable.

**False posture injection remains a trust-boundary bug class:**
- Symptoms: A caller admitted as `gateway_custody` can submit `gateway_probe` records; the protocol checks scope, freshness, required probe kinds, source authority, and outcomes, but it cannot independently prove the probe actually ran.
- Files: `src/protocol/areas/bypass-probe/transitions.ts`, `src/protocol/areas/protected-path-posture/transitions.ts`, `src/http/routes/transition-route-registry.ts`, `src/sdk/client.ts`, `test/adapters/x402-bypass-probes.test.ts`
- Trigger: A compromised or dishonest gateway-custody caller records passing hostile probes without running them.
- Workaround: Treat gateway custody as the trust boundary. Hosted/provider claims require independent attestation or monitored probe execution.

## Security Considerations

**Gateway custody is the authority holder, not the runtime:**
- Risk: If mutation credentials remain available to raw sibling tools, shell paths, browser tools, MCP direct calls, token passthrough, or generated-code side effects, the generated code escaped the contract boundary.
- Files: `AGENTS.md`, `src/protocol/areas/protected-path-posture/transitions.ts`, `src/adapters/x402-payment/bypass-probes.ts`, `test/adapters/x402-bypass-probes.test.ts`, `test/protocol/action-attempt-lifecycle.test.ts`
- Current mitigation: `gateway_checked` posture requires fresh passing probes for credential custody, raw sibling blocking, MCP direct-call blocking, token passthrough blocking, wrapper drift, and failure-closed behavior.
- Recommendations: Require provider/customer gateway proof before any live enforcement claim.

**Bearer-token route admission is not hosted auth:**
- Risk: Static role tokens protect local/reference route access but do not provide org RBAC, revocation, tenant policy, audit retention, or service-account lifecycle.
- Files: `src/http/admission/caller-auth.ts`, `src/http/admission/hosted-caller-identity.ts`, `src/http/admission/index.ts`, `test/http/http.test.ts`
- Current mitigation: Routes require explicit custody roles, hosted mode refuses lane-token-only admission before body parsing, and hosted identity schemas bind tenant/org scope.
- Recommendations: Add real hosted verifier integration, revocation checks, and authorization policy before hosted claims.

**Package-install supply-chain proof is parameter binding, not material attestation:**
- Risk: The package gateway binds observed package manager, registry, manifest, lockfile, flags, lifecycle policy, and resolved material fields before mutation, but it does not independently verify registry tarballs or package-manager execution behavior.
- Files: `src/adapters/package-install/gateway.ts`, `src/runtime/package-install/action-proposal.ts`, `test/adapters/package-install-gateway.test.ts`, `test/integration/package-install-end-to-end.test.ts`
- Current mitigation: Observed parameters are gate-checked by digest and drift refuses before mutation.
- Recommendations: Add a controlled installer or external material-verification gateway before claiming supply-chain enforcement.

**Raw record reads are intentionally restricted but evidence reads are projections:**
- Risk: Consumers can mistake redacted projections for full audit/search product surfaces.
- Files: `src/http/handlers/internal-record-read.ts`, `src/http/handlers/evidence-read.ts`, `src/protocol/areas/object-registry/index.ts`, `test/http/http.test.ts`
- Current mitigation: Internal-only object types are hidden from generic raw reads, and evidence routes return purpose-built projections.
- Recommendations: Keep raw internal records unavailable over generic HTTP reads and add reader authorization before hosted evidence navigation.

## Performance Bottlenecks

**Receipt timeline projection scans broad reconciliation sets:**
- Problem: `handleEvidenceRead` loads all tenant/org `surface_operation_reconciliation` records and filters the target mutation in projection code.
- Files: `src/http/handlers/evidence-read.ts`, `src/protocol/evidence-projections/projections.ts`, `src/storage/d1/index.ts`, `migrations/0001_protocol_kernel.sql`
- Cause: The store prioritizes append-only correctness and authority indexes over read-optimized evidence timelines.
- Improvement path: Add a reconciliation-by-mutation index or materialized read model after evidence semantics stabilize.

**Protocol records store JSON payloads behind generic indexes:**
- Problem: D1 reads parse full JSON payloads for object records, stream events, isolation states, postures, and projections.
- Files: `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `migrations/0001_protocol_kernel.sql`, `src/protocol/evidence-projections/projections.ts`
- Cause: The durable store is a reconstruction log and object store, not a query-optimized hosted audit backend.
- Improvement path: Keep D1 as canonical reconstruction truth and add separate projection tables for hosted search/navigation.

## Fragile Areas

**D1 atomicity depends on `db.batch` and constraint classification:**
- Files: `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `test/support/d1-http-harness.ts`, `test/protocol/protocol-store-atomicity-contract.test.ts`, `migrations/0001_protocol_kernel.sql`
- Why fragile: Authority-bearing commits depend on D1 batch rollback plus constraint errors for greenlight issuance, idempotency reservation, greenlight consumption, operation claims, receipt indexes, and stream offsets.
- Safe modification: Keep greenlight issuance, idempotency reservation, consumption, receipt indexes, operation claims, records, and stream events inside one store commit.
- Test coverage: Memory and local D1 harness stores satisfy the atomicity contract. Production D1 behavior still needs provider-backed smoke coverage before hosted claims.

**Gateway commit outcomes are status-rich and easy to collapse incorrectly:**
- Files: `src/protocol/areas/gateway-gate/transitions.ts`, `src/protocol/areas/gateway-gate/artifacts.ts`, `src/protocol/areas/gateway-gate/replay-refusal/index.ts`, `test/protocol/protocol-store-atomicity-contract.test.ts`
- Why fragile: `already_consumed`, `operation_claim_conflict`, `receipt_index_conflict`, `stream_conflict`, proof gap, and refusal each have different authority consequences.
- Safe modification: Add every new gateway failure mode through `commitGatewayCheckPlan` and assert no partial mutation/receipt/index event survives failed commits.
- Test coverage: Atomicity and replay tests exist, but every new gateway outcome needs explicit consumer/projection tests.

**Root export curation is part of the safety boundary:**
- Files: `src/index.ts`, `src/experimental.ts`, `src/conformance/index.ts`, `test/architecture/root-exports.test.ts`, `package.json`
- Why fragile: Moving experimental gateways or conformance probes onto the root export surface can make reference fixtures look production-ready.
- Safe modification: Keep mutation gateways under `./experimental` and conformance under `./conformance`; root exports stay schema/client/app/navigation oriented.
- Test coverage: `test/architecture/root-exports.test.ts` enforces the current export boundary.

## Scaling Limits

**x402 session/day limits have no capacity model:**
- Current capacity: Per-call x402 amount refusal only.
- Limit: Session/day/review thresholds cannot enforce volume, repeated calls, or portfolio exposure.
- Files: `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `migrations/0001_protocol_kernel.sql`
- Scaling path: Add spend accumulator state keyed by tenant/org/principal/agent/gateway/resource/time window with replay-safe reservation semantics.

**Memory store is a reference adapter:**
- Current capacity: Local tests and fixture exercises.
- Limit: `src/storage/memory/index.ts` stages maps and clones state for atomic commit simulation; it is not long-running multi-agent storage.
- Files: `src/storage/memory/index.ts`, `test/protocol/protocol-store-atomicity-contract.test.ts`
- Scaling path: Keep memory storage test-only and route long-running execution evidence through D1 or another durable store.

**Generated execution graphs are bounded but not streaming-scale infrastructure:**
- Current capacity: Graph inputs have node, edge, depth, and byte limits.
- Limit: Large real generated programs, browser automation traces, and MCP streams require chunking and backpressure beyond current fixture-shaped graph inputs.
- Files: `src/protocol/areas/generated-execution-graph/inputs.ts`, `src/protocol/areas/generated-execution-graph/coverage.ts`, `test/protocol/generated-execution-graph.test.ts`
- Scaling path: Add streaming ingestion and partial graph closure semantics that refuse or quarantine ambiguous tails instead of silently truncating authority evidence.

## Dependencies at Risk

**Cloudflare D1 behavior:**
- Risk: D1 batch atomicity, uniqueness constraints, and error shapes underpin the local durable authority model.
- Impact: Divergent production behavior can misclassify conflicts or produce proof gaps during gateway commits.
- Files: `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `test/support/d1-http-harness.ts`, `migrations/0001_protocol_kernel.sql`
- Migration plan: Add Cloudflare-backed smoke tests for commit conflict classes before hosted operation claims.

**Bun and package surface tooling:**
- Risk: The command contract depends on Bun `1.3.9`, TypeScript, ESLint, Prettier, npm dry-run pack checks, and CI running `npm run check:repo`.
- Impact: Toolchain drift can break type, test, package-surface, or architecture gates.
- Files: `package.json`, `README.md`, `.github/workflows/check.yml`, `test/architecture/package-surface.test.ts`, `test/architecture/root-exports.test.ts`
- Migration plan: Keep `packageManager` pinned and keep `npm run check:repo` as the single local/CI gate.

**Experimental adapter exports:**
- Risk: `experimentalRunX402WalletGateway`, package install, repo write, preview deploy, and fixture probe executors are available through `./experimental`.
- Impact: Early consumers can confuse reference gateway fixtures with production provider enforcement.
- Files: `src/experimental.ts`, `src/adapters/*`, `test/architecture/root-exports.test.ts`
- Migration plan: Keep experimental naming until external gateway custody and bypass posture are proven.

## Missing Critical Features

**Live runtime ingress adapter:**
- Problem: No live MCP, CLI, browser, shell, package-manager, network, or generated-tool-stream adapter feeds candidate attempts into the kernel.
- Blocks: Public runtime-control claims.
- Files: `src/runtime/codemode-multi-action/generated-program-runner.ts`, `src/protocol/areas/generated-execution-graph/`, `src/protocol/areas/tool-call-draft/`, `.planning/tier2/06-policy-agent-management-interface-map.md`, `.planning/tier2/08-external-adapter-plug-in-architecture.md`

**Provider/customer gateway installation:**
- Problem: No real provider or customer gateway owns mutation credentials and runs hostile bypass probes outside local fixtures.
- Blocks: Provider enforcement and production protected-action claims.
- Files: `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/bypass-probes.ts`, `test/integration/x402-d1-http.test.ts`, `test/adapters/x402-bypass-probes.test.ts`

**Hosted evidence operation:**
- Problem: There is no hosted reader authorization, retention policy, search, alerting, audit export, or operational dashboard.
- Blocks: Hosted control-plane and audit-product claims.
- Files: `src/http/handlers/evidence-read.ts`, `src/http/admission/hosted-caller-identity.ts`, `src/sdk/client.ts`, `.planning/tier2/06-policy-agent-management-interface-map.md`

**Source-owned review renderer:**
- Problem: Review binding exists at protocol level, but no renderer implementation creates human review artifacts from exact contracts and computes source-owned renderer/action-binding digests.
- Blocks: Product claims that rendered reviews are trustworthy operational surfaces.
- Files: `src/protocol/areas/review-binding/`, `test/protocol/kernel-policy-gateway.test.ts`, `.planning/tier2/06-policy-agent-management-interface-map.md`

**External package-material attestation:**
- Problem: Package install binds observed parameters locally but does not independently verify package manager behavior, lockfiles, registry material, or lifecycle scripts.
- Blocks: Supply-chain enforcement claims.
- Files: `src/adapters/package-install/gateway.ts`, `src/runtime/package-install/action-proposal.ts`, `test/adapters/package-install-gateway.test.ts`

## Test Coverage Gaps

**Live runtime hostile trace ingestion:**
- What's not tested: A real generated program using live MCP/browser/shell/package/network tools with dynamic tool construction and raw sibling bypass attempts.
- Files: `src/runtime/codemode-multi-action/generated-program-runner.ts`, `src/protocol/areas/generated-execution-graph/coverage.ts`, `test/runtime/codemode-multi-action-runtime.test.ts`, `test/protocol/generated-execution-graph.test.ts`
- Risk: Fixture graph evidence can pass while live runtime behavior escapes the contract boundary.
- Priority: High

**Provider-backed gateway custody:**
- What's not tested: External wallet/provider/customer gateway custody proving credential isolation, direct-call blocking, token passthrough blocking, wrapper drift absence, and failure-closed behavior.
- Files: `src/adapters/x402-payment/bypass-probes.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `test/adapters/x402-bypass-probes.test.ts`, `test/integration/x402-d1-http.test.ts`
- Risk: Local hostile probes are mistaken for provider custody.
- Priority: High

**Spend-window enforcement:**
- What's not tested: Session/day/review threshold accumulation because no accumulator exists.
- Files: `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `migrations/0001_protocol_kernel.sql`
- Risk: Declared spend fields look enforceable while only per-call refusal is active.
- Priority: Medium

**Hosted authorization and evidence reads:**
- What's not tested: Real hosted identity provider behavior, revocation, org RBAC, audit export retention, and multi-tenant evidence search.
- Files: `src/http/admission/hosted-caller-identity.ts`, `src/http/admission/index.ts`, `src/http/handlers/evidence-read.ts`, `test/http/http.test.ts`
- Risk: HTTP seams are mistaken for hosted operation.
- Priority: Medium

---

*Concerns audit: 2026-05-20*
