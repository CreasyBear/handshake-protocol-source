# Codebase Concerns

**Analysis Date:** 2026-05-21
**Evidence Rule:** tracked canon and source/tests outrank `.planning/` scratch. The named Tier 2 planning files are used only for tier boundaries and future-surface intent.

**Focused verification during refresh:**

```bash
npm run quality:claims
npm run test -- test/product/agent-proof-slice.test.ts test/runtime/runtime-ingress.test.ts test/adapters/x402-bypass-probes.test.ts test/protocol/authority-certificate.test.ts
```

Result: 31 focused tests passed, 0 failed.

## Tier Classification

| Concern | Tier | Verdict | Blocking now? | Primary files |
| --- | --- | --- | --- | --- |
| Review artifact provenance is caller-supplied even though review decisions can later satisfy review-required policy. | Tier 1 protocol/kernel | Narrow | No for the current APS proof; yes before review-surface authority claims. | `src/protocol/areas/review-binding/artifacts.ts`, `src/protocol/areas/review-binding/decisions.ts`, `src/protocol/areas/policy-greenlight/policy.ts` |
| Gateway commit outcomes are authority-sensitive and easy to collapse into generic errors. | Tier 1 protocol/kernel | Keep | No, guarded locally; blocks new gateway outcomes until covered. | `src/protocol/areas/gateway-gate/transitions.ts`, `src/protocol/areas/gateway-gate/artifacts.ts`, `test/protocol/protocol-store-atomicity-contract.test.ts` |
| Lifecycle/status meanings are spread across navigation, lifecycle, receipts, operation reconciliation, and projections. | Tier 1 protocol/kernel | Keep | No, source-owned metadata and tests exist; blocks careless transition additions. | `src/protocol/navigation/index.ts`, `src/protocol/areas/action-attempt-lifecycle/matrix.ts`, `src/protocol/areas/receipt-export/status.ts`, `src/protocol/evidence-projections/projections.ts` |
| Root export and claim boundaries can make local fixtures look production-ready if they drift. | Tier 1 protocol/kernel | Keep | No, guarded by tests. | `src/index.ts`, `src/runtime/index.ts`, `src/experimental.ts`, `src/conformance/index.ts`, `test/architecture/root-exports.test.ts`, `test/architecture/claim-boundary.test.ts` |
| Runtime ingress is bounded/local and ceremony-heavy. | Tier 2 activation/product | Keep | Yes for public runtime/MCP/CLI activation; no for local kernel foundation. | `src/runtime/ingress/index.ts`, `test/runtime/runtime-ingress.test.ts`, `.planning/tier2/06-policy-agent-management-interface-map.md` |
| Public Metadata/Challenge/Request/EvidenceProjection, SDK, CLI, and MCP convenience surfaces are not built. | Tier 2 activation/product | Keep | Yes for first protected-action UX. | `src/protocol/areas/protected-action-representation/`, `src/sdk/client.ts`, `.planning/tier2/06-policy-agent-management-interface-map.md`, `.planning/tier2/08-external-adapter-plug-in-architecture.md` |
| x402 can drift from proof profile into protocol center. | Tier 2 activation/product | Narrow | No for local proof; yes before any adapter-family protocol claim. | `src/adapters/x402-payment/`, `docs/internal/protocol-notes.md`, `test/product/agent-proof-slice.test.ts` |
| Package install is parity/regression, not external supply-chain enforcement. | Tier 2 activation/product | Narrow | No for local parity; yes before supply-chain enforcement claims. | `src/adapters/package-install/gateway.ts`, `src/runtime/package-install/action-proposal.ts`, `test/integration/package-install-end-to-end.test.ts` |
| Hosted operation is only a seam: RBAC, policy lifecycle, retention, search, alerts, audit export, hosted verifier/read model, and exposure counters are missing. | Tier 3 hosted operation | Keep | Yes for hosted product claims. | `src/http/admission/hosted-caller-identity.ts`, `src/http/handlers/evidence-read.ts`, `docs/internal/decisions.md` |
| Evidence reads are redacted projections backed by broad record scans, not hosted audit/search surfaces. | Tier 3 hosted operation | Redesign later | No locally; yes before hosted scale/audit claims. | `src/http/handlers/evidence-read.ts`, `src/protocol/evidence-projections/projections.ts`, `src/storage/d1/index.ts`, `migrations/0001_protocol_kernel.sql` |
| x402 session/day/review spend windows are metadata without a reservation ledger. | Tier 3 hosted operation | Narrow | No for per-call x402 proof; yes before spend-window enforcement. | `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `migrations/0001_protocol_kernel.sql` |
| Production D1 behavior is not provider-smoked for every authority conflict class. | Tier 3 hosted operation | Keep | No locally; yes before hosted operation. | `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `test/http/d1-http.test.ts`, `test/protocol/protocol-store-atomicity-contract.test.ts` |
| Provider/customer gateway custody and independently witnessed bypass probes are unproven. | Tier 4 ecosystem/interoperability | Narrow | Yes before provider/customer custody claims. | `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/bypass-probes.ts`, `src/protocol/areas/protected-path-posture/transitions.ts` |
| AuthorityCertificate is local pinned-key terminal evidence, not cross-org trust, JWKS, revocation, marketplace certification, or hosted verification. | Tier 4 ecosystem/interoperability | Narrow | Yes before portable trust claims. | `src/protocol/areas/authority-certificate/verify.ts`, `src/protocol/areas/authority-certificate/transitions.ts`, `test/protocol/authority-certificate.test.ts` |
| Conformance probes are not certification marks. | Tier 4 ecosystem/interoperability | Cut certification language | Yes before conformance/certification claims. | `src/conformance/index.ts`, `test/conformance/protected-mutation-adapter-conformance.test.ts`, `.planning/tier2/08-external-adapter-plug-in-architecture.md` |

## Boundary Snapshot

**LANDED local foundation:**

- APS proof now exists: x402 runtime ingress composes through policy, gateway, redacted `AgentTransactionEnvelope`, and terminal `AuthorityCertificate` evidence in `test/product/agent-proof-slice.test.ts`.
- `AuthorityCertificate` is landed locally as terminal evidence only, with offline pinned-key verification in `src/protocol/areas/authority-certificate/`, root export through `src/index.ts`, and coverage in `test/protocol/authority-certificate.test.ts`.
- `projectAgentTransactionEnvelope()` is exposed through `src/http/handlers/evidence-read.ts` and derives redacted transaction evidence from contract, policy, greenlight, gate, mutation, receipt, refusal, proof gap, and ledger records.
- x402 is a local proof profile, not the protocol center. `src/adapters/x402-payment/` proves one local payment profile; package install remains a parity/regression lane through `src/adapters/package-install/gateway.ts` and `test/integration/package-install-end-to-end.test.ts`.
- Runtime ingress is bounded/local. `src/runtime/ingress/index.ts` supports local x402 and package-install dispatch boundaries and refuses dynamic, late-bound, raw sibling, and truncated traces in `test/runtime/runtime-ingress.test.ts`.
- Claim-boundary tests keep current docs honest in `test/architecture/claim-boundary.test.ts`.

**Not landed as external/provider/hosted/cross-org claims:**

- No provider/customer gateway custody, live wallet custody, independently witnessed bypass probes, hosted operation, broad MCP/browser/shell/network interception, external package-material attestation, cross-org certificate trust, live JWKS/revocation, hosted verifier, or spend-window ledger is proven by this checkout.
- Tier 2 activation surfaces may guide, propose, and project evidence. They must not inherit Tier 3 hosted or Tier 4 ecosystem claims.

## Tech Debt

**Review artifact provenance:**

- Tier: Tier 1 protocol/kernel.
- Verdict: Narrow.
- Blocking now: No for APS local proof; yes before claiming review surfaces are trustworthy authority inputs.
- Issue: `createReviewArtifact()` records caller-supplied `rendererRef`, `renderedArtifactDigest`, `catalogDigest`, `rendererDigest`, and `actionBindingDigest`. `createReviewDecision()` checks those fields and safe hidden/secondary-action posture, but no source-owned renderer registry computes the review artifact from exact contract input.
- Files: `src/protocol/areas/review-binding/artifacts.ts`, `src/protocol/areas/review-binding/decisions.ts`, `src/protocol/areas/review-binding/schemas.ts`, `src/protocol/areas/policy-greenlight/policy.ts`, `test/protocol/kernel-policy-gateway.test.ts`
- Impact: A caller-controlled renderer can produce misleading human review artifacts while satisfying caller-provided digest fields. That is review theatre if used as an operational review product.
- Fix approach: Add a source-owned renderer/generator registry that computes artifact, catalog, renderer, and action-binding digests from the exact `ActionContract` and policy input.

**Runtime ingress ceremony and narrow host coverage:**

- Tier: Tier 2 activation/product.
- Verdict: Keep, but do not overclaim.
- Blocking now: Yes for first protected-action UX and public runtime/MCP/CLI activation.
- Issue: `proposeRuntimeIngressActionContracts()` expects normalized dispatch blocks, graph closure, evidence refs, tool-call parameters, and action-family config. It is a local adapter helper, not a live host interception layer.
- Files: `src/runtime/ingress/index.ts`, `src/runtime/index.ts`, `src/runtime/LANE.md`, `test/runtime/runtime-ingress.test.ts`, `.planning/tier2/06-policy-agent-management-interface-map.md`
- Impact: The authority boundary is correct, but the surface is easy to avoid or misuse. Future wrappers can accidentally treat caller-observed traces as complete host custody.
- Fix approach: Build one runtime shim at a time. Each shim may normalize observed evidence only; it must not call policy, gateway, receipt, mutation, or protected-surface code.

**Public activation surfaces are missing:**

- Tier: Tier 2 activation/product.
- Verdict: Keep.
- Blocking now: Yes for the first protected-action UX.
- Issue: Internal representation contracts exist, but public `ProtectedActionMetadata`, `ProtectedActionChallenge`, `ProtectedActionRequest`, `EvidenceProjection`, SDK/CLI/MCP proposal, and evidence conveniences are not source-complete.
- Files: `src/protocol/areas/protected-action-representation/`, `src/sdk/client.ts`, `.planning/tier2/06-policy-agent-management-interface-map.md`, `.planning/tier2/08-external-adapter-plug-in-architecture.md`, `test/protocol/representation-contract.test.ts`
- Impact: A serious implementer can assemble the chain from source/tests, but a first protected action still lacks a clean activation path.
- Fix approach: Expose representation surfaces as guidance/proposal/evidence only, then add SDK or MCP wrappers that compile to existing runtime evidence and candidate paths.

**x402 spend windows are declared but not enforced:**

- Tier: Tier 3 hosted operation.
- Verdict: Narrow.
- Blocking now: No for per-call x402 proof; yes before spend-window claims.
- Issue: `maxAtomicAmountPerCall` is enforced before compilation, while `maxAtomicAmountPerSession`, `maxAtomicAmountPerDay`, and `reviewThresholdAtomicAmount` carry `spendWindowEnforcementStatus: "not_enforced_tier1_metadata"`.
- Files: `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `test/adapters/x402-install-proposal.test.ts`, `test/adapters/x402-payment-action-proposal.test.ts`, `migrations/0001_protocol_kernel.sql`
- Impact: Current x402 authority is per-call only. Any session/day/review spend-window claim would be ambient policy theatre.
- Fix approach: Add a replay-safe spend accumulator/reservation ledger keyed by tenant, organization, principal, agent, gateway, resource, and time window before enforcing broader spend bounds.

**x402 proof profile can pull the protocol off-center:**

- Tier: Tier 2 activation/product.
- Verdict: Narrow.
- Blocking now: No for local proof; yes before public framing.
- Issue: x402 has the strongest concrete proof profile, but canon says no adapter family defines the protocol.
- Files: `src/adapters/x402-payment/`, `test/product/agent-proof-slice.test.ts`, `docs/internal/protocol-definition.md`, `docs/internal/protocol-notes.md`, `.planning/tier2/07-agentic-economy-clearing-house-research.md`
- Impact: Product language can accidentally make x402 the protocol center instead of one proof profile that consumes generic `ActionContract`, `Greenlight`, `GatewayCheck`, receipt/proof-gap, and `AuthorityCertificate` primitives.
- Fix approach: Keep x402 examples explicitly profile-scoped. Treat package install as parity/regression and require any new adapter to consume the same kernel chain.

## Known Bugs

**No confirmed local authority-path correctness bug detected:**

- Tier: Tier 1 protocol/kernel.
- Verdict: Keep current guard posture.
- Blocking now: No.
- Symptoms: Focused checks passed for claim boundaries, APS proof, runtime ingress refusal boundaries, x402 hostile probes, and AuthorityCertificate terminal verification.
- Files: `test/architecture/claim-boundary.test.ts`, `test/product/agent-proof-slice.test.ts`, `test/runtime/runtime-ingress.test.ts`, `test/adapters/x402-bypass-probes.test.ts`, `test/protocol/authority-certificate.test.ts`
- Trigger: Not applicable.
- Workaround: Not applicable.

**False posture injection remains a trust-boundary bug class:**

- Tier: Tier 4 ecosystem/interoperability.
- Verdict: Narrow.
- Blocking now: Yes before provider/customer custody claims.
- Symptoms: A gateway-custody caller can submit bypass probe and protected-path posture records. The kernel checks scope, freshness, source authority, required probe kinds, and pass/fail outcomes, but it cannot independently prove the probe actually ran.
- Files: `src/protocol/areas/bypass-probe/transitions.ts`, `src/protocol/areas/protected-path-posture/transitions.ts`, `src/adapters/x402-payment/bypass-probes.ts`, `test/adapters/x402-bypass-probes.test.ts`
- Trigger: A compromised or dishonest gateway-custody boundary records passing probe evidence without executing hostile checks.
- Workaround: Treat gateway custody as the trust boundary. External/provider claims require independent attestation, monitored probe execution, or provider-side custody proof.

## Security Considerations

**Gateway custody is the real authority holder:**

- Tier: Tier 4 ecosystem/interoperability.
- Verdict: Narrow.
- Blocking now: Yes before provider/customer custody claims.
- Risk: If mutation credentials remain reachable through raw sibling tools, shell paths, browser tools, MCP direct calls, token passthrough, wrapper drift, or generated-code side effects, the generated code escaped the contract boundary.
- Files: `src/protocol/areas/protected-path-posture/transitions.ts`, `src/protocol/areas/bypass-probe/schemas.ts`, `src/adapters/x402-payment/bypass-probes.ts`, `test/adapters/x402-bypass-probes.test.ts`, `test/runtime/runtime-ingress.test.ts`
- Current mitigation: `gateway_checked` posture requires fresh passing probes for credential custody, raw sibling blocking, MCP direct-call blocking, token passthrough blocking, wrapper drift, and failure-closed behavior.
- Recommendations: Do not claim installed protection until a customer/provider gateway owns the mutation credential and the hostile probes run from the actual deployment boundary.

**Hosted admission is a seam, not hosted auth:**

- Tier: Tier 3 hosted operation.
- Verdict: Keep as a seam.
- Blocking now: Yes before hosted operation claims.
- Risk: `caller-auth.ts` supports role-scoped static bearer tokens, and `hosted-caller-identity.ts` defines a verifier seam. Neither implements real org auth, RBAC, policy lifecycle, retention, search, alerts, audit export, or hosted verifier operation.
- Files: `src/http/admission/caller-auth.ts`, `src/http/admission/hosted-caller-identity.ts`, `src/http/admission/index.ts`, `test/http/http.test.ts`
- Current mitigation: Hosted mode refuses lane-token-only admission, checks role/scope/freshness, rejects revoked identities from the configured verifier, and stores only digest/ref caller evidence.
- Recommendations: Add a real hosted verifier, revocation model, tenant authorization policy, evidence-read authorization, retention, and audit export before hosted operation claims.

**AuthorityCertificate trust is local pinned-key evidence only:**

- Tier: Tier 4 ecosystem/interoperability.
- Verdict: Narrow.
- Blocking now: Yes before cross-org trust, hosted verify, or marketplace/certification claims.
- Risk: `AuthorityCertificate` can be overread as identity, settlement, execution authority, or portable cross-org trust.
- Files: `src/protocol/areas/authority-certificate/transitions.ts`, `src/protocol/areas/authority-certificate/verify.ts`, `src/protocol/areas/authority-certificate/schemas.ts`, `test/protocol/authority-certificate.test.ts`, `docs/internal/decisions.md`
- Current mitigation: `createAuthorityCertificate()` is terminal-only. `verifyAuthorityCertificate()` verifies canonical `signingInput`, rejects production HMAC unless `allowDevHmac` is enabled, and works without the protocol store using pinned trust material.
- Recommendations: Keep certificate examples on Ed25519 pinned trust. Add explicit trust registry, JWKS/revocation, key rotation, and hosted verify semantics only as evidence verification, not execution authority.

**Evidence reads are redacted projections, not audit product surfaces:**

- Tier: Tier 3 hosted operation.
- Verdict: Redesign later for hosted read models.
- Blocking now: Yes before hosted audit/search claims.
- Risk: Consumers can confuse redacted diagnostic projections with complete hosted audit/search.
- Files: `src/http/handlers/evidence-read.ts`, `src/http/handlers/internal-record-read.ts`, `src/protocol/areas/object-registry/index.ts`, `test/http/http.test.ts`
- Current mitigation: Internal-only objects such as `contract_stream_event`, `idempotency_ledger_entry`, `bypass_probe`, and `tool_call_draft` are hidden from generic raw reads.
- Recommendations: Keep raw internal records unavailable over generic HTTP and add reader authorization, retention, search, alerts, and purpose-built projections before hosted audit claims.

**Package-install proof is parameter binding, not material attestation:**

- Tier: Tier 2 activation/product.
- Verdict: Narrow.
- Blocking now: No for parity/regression; yes before supply-chain enforcement claims.
- Risk: The package gateway binds observed package manager, registry, manifest, lockfile, install flags, lifecycle-script policy, and resolved material fields, but it does not independently verify registry tarballs or package-manager behavior.
- Files: `src/adapters/package-install/gateway.ts`, `src/runtime/package-install/action-proposal.ts`, `test/adapters/package-install-gateway.test.ts`, `test/integration/package-install-end-to-end.test.ts`
- Current mitigation: Gateway-observed parameters must match the exact contract digest before mutation.
- Recommendations: Add a controlled installer or external material-verification gateway before supply-chain enforcement claims.

## Performance Bottlenecks

**Receipt and transaction projections scan broad tenant/org record sets:**

- Tier: Tier 3 hosted operation.
- Verdict: Redesign later.
- Blocking now: No locally; yes before hosted evidence scale.
- Problem: `handleEvidenceRead()` loads tenant/org-wide policy, greenlight, gateway, mutation, receipt, refusal, proof-gap, and reconciliation sets, then filters in projection logic.
- Files: `src/http/handlers/evidence-read.ts`, `src/protocol/evidence-projections/projections.ts`, `src/storage/d1/index.ts`, `migrations/0001_protocol_kernel.sql`
- Cause: The store prioritizes append-only reconstruction truth and current-state indexes over read-optimized hosted evidence views.
- Improvement path: Add materialized read models or targeted indexes such as reconciliation-by-mutation and contract-linked evidence projections after semantics stabilize.

**Protocol records are JSON payloads behind generic indexes:**

- Tier: Tier 3 hosted operation.
- Verdict: Keep for kernel, redesign for hosted search.
- Blocking now: No locally.
- Problem: D1 reads parse full JSON payloads for records, stream events, isolation state, protected path posture, and evidence projections.
- Files: `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `migrations/0001_protocol_kernel.sql`, `src/protocol/evidence-projections/projections.ts`
- Cause: D1 is reconstruction truth, not a query-optimized hosted audit backend.
- Improvement path: Keep D1 as canonical reconstruction storage and add projection tables for hosted search/navigation only after record semantics are stable.

**Runtime ingress graph ingestion is block-oriented:**

- Tier: Tier 2 activation/product.
- Verdict: Keep for first proof, redesign before broad host claims.
- Blocking now: Yes for broad runtime ingestion claims.
- Problem: `RuntimeIngressDispatchBlockSchema` expects a bounded block with complete dispatches, graph nonce, truncation status, and observed dispatch details.
- Files: `src/runtime/ingress/index.ts`, `src/protocol/areas/generated-execution-graph/inputs.ts`, `test/runtime/runtime-ingress.test.ts`
- Cause: Current proof targets bounded local dispatches, not continuous browser/shell/MCP streams.
- Improvement path: Add streaming chunk semantics with refusal/quarantine for ambiguous tails before claiming large generated-program ingestion.

## Fragile Areas

**Gateway commit outcomes:**

- Tier: Tier 1 protocol/kernel.
- Verdict: Keep.
- Blocking now: No, but every new outcome needs tests.
- Files: `src/protocol/areas/gateway-gate/transitions.ts`, `src/protocol/areas/gateway-gate/artifacts.ts`, `src/protocol/areas/gateway-gate/replay-refusal/index.ts`, `test/protocol/protocol-store-atomicity-contract.test.ts`
- Why fragile: `already_consumed`, `operation_claim_conflict`, `receipt_index_conflict`, `stream_append_conflict`, gateway refusal, replay refusal, and downstream proof gap have different authority consequences.
- Safe modification: Add every new gateway failure mode through `commitGatewayCheckPlan()` and assert no partial mutation, receipt, index, or event survives failed commits.
- Test coverage: Replay and atomicity tests exist; every new gateway outcome needs projection and receipt assertions.

**D1 atomicity and conflict classification:**

- Tier: Tier 3 hosted operation.
- Verdict: Keep local contract, add provider smoke before hosted claims.
- Blocking now: No locally; yes before hosted operation.
- Files: `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `migrations/0001_protocol_kernel.sql`, `test/support/d1-http-harness.ts`, `test/protocol/protocol-store-atomicity-contract.test.ts`
- Why fragile: Authority-bearing commits depend on atomic records, stream events, greenlight issuance, idempotency reservations, greenlight consumption, operation claims, receipt indexes, and current-state indexes.
- Safe modification: Keep every authority-affecting write inside the store commit boundary and preserve explicit conflict classes.
- Test coverage: Memory and local D1 harness stores satisfy the atomicity contract. Production Cloudflare D1 behavior still needs provider-backed smoke coverage before hosted claims.

**AuthorityCertificate terminal boundary:**

- Tier: Tier 1 protocol/kernel locally; Tier 4 when framed as portable trust.
- Verdict: Keep local terminal-only boundary; narrow external claims.
- Blocking now: No locally.
- Files: `src/protocol/areas/authority-certificate/transitions.ts`, `src/protocol/areas/authority-certificate/verify.ts`, `src/protocol/navigation/index.ts`, `test/protocol/authority-certificate.test.ts`
- Why fragile: Certificate wording can drift into execution authority, identity, settlement, marketplace, certification, or hosted trust claims.
- Safe modification: Keep `createAuthorityCertificate` terminal-only and evidence-only. Do not add policy, greenlight, gateway check, or mutation authority to certificate APIs.
- Test coverage: Tests reject non-terminal minting, wrong keys, tampering, missing gateway signer, replay mismatch, and production HMAC trust.

**Root export curation:**

- Tier: Tier 1 protocol/kernel.
- Verdict: Keep.
- Blocking now: No.
- Files: `src/index.ts`, `src/runtime/index.ts`, `src/experimental.ts`, `src/conformance/index.ts`, `package.json`, `test/architecture/root-exports.test.ts`, `test/architecture/claim-boundary.test.ts`
- Why fragile: Moving runtime ingress, reference gateways, conformance probes, or experimental adapters onto the root surface can make local fixtures look production-ready.
- Safe modification: Keep mutation gateways under `./experimental`, conformance under `./conformance`, runtime observer/compiler helpers under `./runtime`, and stable schema/client/app/navigation exports at root.
- Test coverage: Root export and claim-boundary tests enforce current separation.

**Lifecycle/status map drift:**

- Tier: Tier 1 protocol/kernel.
- Verdict: Keep.
- Blocking now: No.
- Files: `src/protocol/navigation/index.ts`, `src/protocol/areas/action-attempt-lifecycle/matrix.ts`, `src/protocol/areas/receipt-export/status.ts`, `src/protocol/areas/operation-lifecycle/lifecycle.ts`, `src/protocol/evidence-projections/projections.ts`, `test/protocol/action-attempt-lifecycle.test.ts`, `test/protocol/evidence-projections.test.ts`
- Why fragile: A new transition or outcome can make one projection overstate authority while another records refusal or proof gap.
- Safe modification: Keep protocol navigation and lifecycle matrix source-owned, then derive projection assertions from transition/outcome semantics.
- Test coverage: Current lifecycle/projection tests exist, but new terminal states need explicit receipt and projection coverage.

## Scaling Limits

**Tier 3 hosted operation has no product-scale read model:**

- Tier: Tier 3 hosted operation.
- Verdict: Keep kernel storage, redesign hosted read side.
- Blocking now: Yes for hosted evidence product.
- Current capacity: Local HTTP/D1 evidence reads and redacted projections.
- Limit: No org/project RBAC, retention, search, alerts, audit export, hosted verifier/read model, or exposure counters.
- Files: `src/http/admission/hosted-caller-identity.ts`, `src/http/handlers/evidence-read.ts`, `src/storage/d1/index.ts`, `docs/internal/decisions.md`
- Scaling path: Add hosted admission policy, reader authorization, retention rules, query indexes, alerting, and audit export without changing Tier 1 authority objects.

**x402 spend windows have no capacity model:**

- Tier: Tier 3 hosted operation.
- Verdict: Narrow.
- Blocking now: Yes before spend-window claims.
- Current capacity: Per-call x402 amount refusal only.
- Limit: Session/day/review threshold fields cannot enforce repeated calls, portfolio exposure, or review routing.
- Files: `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `migrations/0001_protocol_kernel.sql`
- Scaling path: Add spend-window reservation and reconciliation records before promoting spend windows from metadata to policy authority.

**Runtime ingress cannot represent arbitrary generated programs yet:**

- Tier: Tier 2 activation/product.
- Verdict: Keep local scope.
- Blocking now: Yes for generic MCP/runtime control claims.
- Current capacity: Local x402 payment and package-install dispatch boundaries with explicit loop/retry/dynamic/raw-sibling/truncation handling.
- Limit: Broad MCP/browser/shell/network/package-manager streams need streaming graph ingestion, host-level interception, and fail-closed adapters.
- Files: `src/runtime/ingress/index.ts`, `src/protocol/areas/generated-execution-graph/`, `src/protocol/areas/tool-call-draft/`, `test/runtime/runtime-ingress.test.ts`, `test/protocol/generated-execution-graph.test.ts`
- Scaling path: Add one host integration at a time and require hostile traces for raw sibling bypass, dynamic tool construction, late-bound params, graph truncation, replay, and stale drafts.

**AuthorityCertificate verification is offline pinned-key only:**

- Tier: Tier 4 ecosystem/interoperability.
- Verdict: Narrow.
- Blocking now: Yes before cross-org verification.
- Current capacity: Local certificate minting and `verifyAuthorityCertificate()` with supplied trust material.
- Limit: No live key discovery, revocation status, certificate transparency, hosted verify API, tenant trust policy, or cross-org verifier agreement.
- Files: `src/protocol/areas/authority-certificate/verify.ts`, `src/protocol/areas/authority-certificate/schemas.ts`, `test/protocol/authority-certificate.test.ts`, `docs/internal/decisions.md`
- Scaling path: Add explicit trust registry, JWKS/revocation semantics, verifier API, and consumer trust policy as evidence verification only.

## Dependencies at Risk

**Cloudflare D1 behavior:**

- Tier: Tier 3 hosted operation.
- Verdict: Keep local contract, add provider smoke.
- Blocking now: Yes before hosted operation.
- Risk: Batch atomicity, uniqueness constraints, and error strings underpin local durable authority commits.
- Impact: Divergent production D1 behavior can misclassify conflicts or produce ambiguous authority writes.
- Files: `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `migrations/0001_protocol_kernel.sql`, `test/support/d1-http-harness.ts`, `test/protocol/protocol-store-atomicity-contract.test.ts`
- Migration plan: Add Cloudflare-backed smoke tests for each conflict class before hosted operation claims.

**WebCrypto Ed25519 support:**

- Tier: Tier 4 ecosystem/interoperability.
- Verdict: Keep Ed25519, forbid production HMAC trust.
- Blocking now: No locally.
- Risk: `signAuthorityCertificateSigningInput()` and `verifyAuthorityCertificateSignature()` use `crypto.subtle` Ed25519 import/sign/verify behavior.
- Impact: Runtime compatibility drift can break certificate verification or push consumers toward dev HMAC paths.
- Files: `src/protocol/areas/authority-certificate/signing.ts`, `src/protocol/areas/authority-certificate/verify.ts`, `test/protocol/authority-certificate.test.ts`
- Migration plan: Keep compatibility tests in target runtimes and keep HMAC disabled for production verification.

**Experimental adapter exports:**

- Tier: Tier 2 activation/product.
- Verdict: Keep experimental label.
- Blocking now: No.
- Risk: Reference gateways and fixture probe executors are exposed through `./experimental`.
- Impact: Early consumers can confuse local proof fixtures with provider/customer enforcement.
- Files: `src/experimental.ts`, `src/adapters/package-install/gateway.ts`, `src/adapters/preview-deploy/gateway.ts`, `src/adapters/repo-write/gateway.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `test/architecture/root-exports.test.ts`
- Migration plan: Keep experimental naming until external custody, bypass posture, and provider/customer gateway proof are source-tested.

## Missing Critical Features

**Tier 2 first protected-action UX:**

- Tier: Tier 2 activation/product.
- Verdict: Keep.
- Blocking now: Yes for activation.
- Problem: No public first protected-action loop combines runtime ingress, Metadata/Challenge/Request, evidence projection, SDK/CLI/MCP ergonomics, and refusal/proof-gap feedback.
- Blocks: First-time developer activation and agent-runtime integration claims.
- Files: `src/runtime/ingress/index.ts`, `src/protocol/areas/protected-action-representation/`, `src/sdk/client.ts`, `.planning/tier2/06-policy-agent-management-interface-map.md`

**Tier 3 hosted evidence operation:**

- Tier: Tier 3 hosted operation.
- Verdict: Keep separate from Tier 1.
- Blocking now: Yes for hosted product.
- Problem: No real hosted identity provider, org/project RBAC, policy lifecycle, retention/search/alerts/audit export, hosted verifier/read model, or exposure counters.
- Blocks: Hosted operation and hosted audit-product claims.
- Files: `src/http/admission/hosted-caller-identity.ts`, `src/http/admission/index.ts`, `src/http/handlers/evidence-read.ts`, `docs/internal/decisions.md`

**Tier 4 external trust and custody:**

- Tier: Tier 4 ecosystem/interoperability.
- Verdict: Keep as future ecosystem layer.
- Blocking now: Yes before ecosystem claims.
- Problem: No provider/customer custody proof, external trust roots, cross-org AuthorityCertificate verification, certification/conformance marks, or market-consumer contracts.
- Blocks: Ecosystem, marketplace, clearing-house portability, and certification claims.
- Files: `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/bypass-probes.ts`, `src/conformance/index.ts`, `src/protocol/areas/authority-certificate/verify.ts`, `.planning/tier2/07-agentic-economy-clearing-house-research.md`, `.planning/tier2/08-external-adapter-plug-in-architecture.md`

## Test Coverage Gaps

**Source-owned review rendering:**

- Tier: Tier 1 protocol/kernel.
- Verdict: Narrow.
- Blocking now: Yes before review-surface authority claims.
- What's not tested: Renderer registry provenance and digest computation from source-owned review artifact generation.
- Files: `src/protocol/areas/review-binding/artifacts.ts`, `src/protocol/areas/review-binding/decisions.ts`, `test/protocol/kernel-policy-gateway.test.ts`
- Risk: Review theatre can satisfy protocol binding fields if the renderer itself is caller-controlled.
- Priority: High before review-mediated greenlights.

**Provider-backed x402 custody:**

- Tier: Tier 4 ecosystem/interoperability.
- Verdict: Narrow.
- Blocking now: Yes before provider/customer custody claims.
- What's not tested: External wallet/provider/customer gateway custody proving credential isolation, direct-call blocking, token passthrough blocking, wrapper drift absence, and failure-closed behavior.
- Files: `src/adapters/x402-payment/bypass-probes.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `test/adapters/x402-bypass-probes.test.ts`, `test/integration/x402-d1-http.test.ts`
- Risk: Local hostile probes are mistaken for provider custody.
- Priority: High before provider/customer custody claims.

**Real runtime hostile trace ingestion:**

- Tier: Tier 2 activation/product.
- Verdict: Keep local scope until covered.
- Blocking now: Yes before broad runtime control claims.
- What's not tested: Live generated programs using MCP, browser, shell, package-manager, network, filesystem, CI, cloud, or database tools with dynamic tool construction and raw sibling bypass attempts.
- Files: `src/runtime/ingress/index.ts`, `src/runtime/codemode-multi-action/generated-program-runner.ts`, `src/protocol/areas/generated-execution-graph/coverage.ts`, `test/runtime/runtime-ingress.test.ts`, `test/runtime/codemode-multi-action-runtime.test.ts`
- Risk: Caller-observed fixture evidence can pass while live runtime behavior escapes the contract boundary.
- Priority: High before broad runtime control claims.

**Cross-org certificate verification:**

- Tier: Tier 4 ecosystem/interoperability.
- Verdict: Narrow.
- Blocking now: Yes before portable trust claims.
- What's not tested: JWKS retrieval, revocation, key rotation, tenant trust policies, verifier service behavior, and consumer-binding trust semantics.
- Files: `src/protocol/areas/authority-certificate/verify.ts`, `src/protocol/areas/authority-certificate/schemas.ts`, `test/protocol/authority-certificate.test.ts`
- Risk: Local offline verification is overread as portable cross-org trust.
- Priority: High before cross-org certificate trust claims.

**Spend-window enforcement:**

- Tier: Tier 3 hosted operation.
- Verdict: Narrow.
- Blocking now: Yes before spend-window enforcement.
- What's not tested: Session/day/review threshold accumulation because no accumulator exists.
- Files: `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `migrations/0001_protocol_kernel.sql`
- Risk: Declared spend fields look enforceable while only per-call refusal is active.
- Priority: Medium before spend-window enforcement claims.

**Production D1 commit behavior:**

- Tier: Tier 3 hosted operation.
- Verdict: Keep local contract, add provider smoke.
- Blocking now: Yes before hosted operation.
- What's not tested: Cloudflare-backed D1 batch rollback and error classification for each authority-bearing conflict class.
- Files: `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `test/support/d1-http-harness.ts`, `test/protocol/protocol-store-atomicity-contract.test.ts`
- Risk: Local D1 harness parity hides provider-specific ambiguity during greenlight, gateway, stream, receipt, or idempotency commits.
- Priority: Medium before hosted operation claims.

---

*Concerns audit: 2026-05-21*
