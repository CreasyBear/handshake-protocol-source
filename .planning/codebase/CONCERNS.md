# Codebase Concerns

**Analysis Date:** 2026-05-20
**Current HEAD:** `88e6f16`
**Worktree Basis:** current dirty local filesystem after the AuthorityCertificate/kernel work.
**Evidence Rule:** tracked docs, source, migrations, and tests are stronger evidence than `.planning/` scratch.

**Focused verification during refresh:**

```bash
npm run quality:claims
npm run test -- test/protocol/authority-certificate.test.ts test/architecture/import-posture.test.ts test/architecture/root-exports.test.ts test/runtime/runtime-ingress.test.ts test/adapters/x402-bypass-probes.test.ts
```

Result: 48 focused tests passed, 0 failed.

## Boundary Snapshot

**LANDED local foundation:**

- Exact contract -> policy decision -> one-use greenlight -> gateway check -> receipt/refusal/proof-gap is locally implemented and tested in `src/protocol/kernel.ts`, `src/protocol/areas/action-contract/`, `src/protocol/areas/policy-greenlight/`, `src/protocol/areas/gateway-gate/`, `src/protocol/areas/receipt-export/`, `test/protocol/kernel-policy-gateway.test.ts`, and `test/protocol/model-based-invariants.test.ts`.
- `AuthorityCertificate` is a landed local terminal evidence primitive with offline pinned-key verification in `src/protocol/areas/authority-certificate/`, `src/protocol/navigation/index.ts`, `src/protocol/areas/object-registry/index.ts`, `src/index.ts`, and `test/protocol/authority-certificate.test.ts`.
- Local x402 payment foundation covers install proposal, runtime proposal, D1/HTTP durable path, wallet fixture gateway, hostile bypass/custody probes, proof gaps, and replay refusal in `src/adapters/x402-payment/`, `src/runtime/ingress/index.ts`, `test/integration/x402-d1-http.test.ts`, `test/adapters/x402-bypass-probes.test.ts`, and `test/runtime/runtime-ingress.test.ts`.
- D1 and memory stores cover atomic record/event/index behavior for local reconstruction in `src/storage/d1/index.ts`, `src/storage/memory/index.ts`, `migrations/0001_protocol_kernel.sql`, `test/http/d1-http.test.ts`, and `test/protocol/protocol-store-atomicity-contract.test.ts`.
- Claim-boundary tests preserve local-proof wording and export separation in `README.md`, `docs/internal/decisions.md`, `docs/internal/protocol-definition.md`, `docs/internal/protocol-kernel-architecture.md`, `test/architecture/claim-boundary.test.ts`, and `test/architecture/root-exports.test.ts`.

**Not landed as external/provider/hosted/cross-org claims:**

- No live provider or customer gateway custody is proven by `src/adapters/x402-payment/wallet-gateway.ts` or `src/adapters/x402-payment/bypass-probes.ts`; they are local/reference proof paths.
- No hosted org auth, RBAC, retention, search, alerting, or hosted verifier operation is implemented by `src/http/admission/hosted-caller-identity.ts`, `src/http/admission/caller-auth.ts`, or `src/http/handlers/evidence-read.ts`.
- No broad MCP, browser, shell, network, package-manager, filesystem, or arbitrary generated-tool-stream interception is proven by `src/runtime/ingress/index.ts`; the public runtime ingress surface covers local x402 payment and package-install dispatch boundaries.
- No cross-org `AuthorityCertificate` trust, live JWKS, revocation, marketplace certification, or portable hosted verification is implemented by `src/protocol/areas/authority-certificate/verify.ts`.
- No x402 session/day/review spend-window enforcement exists in `src/adapters/x402-payment/install-proposal.ts`; those fields are explicitly metadata.

## Current Local-Foundation Verdict

**No open local-foundation critical gap detected after this pass.**

- Result: `test/architecture/import-posture.test.ts` now derives protocol areas
  from `src/protocol/areas/*`, so `authority-certificate` and future protocol
  areas are covered by the same transport/client, storage, kernel, area-to-area,
  and local `types.ts` face assertions.
- Follow-on fix: `src/protocol/areas/authority-certificate/signing.ts`,
  `src/protocol/areas/authority-certificate/transitions.ts`, and
  `src/protocol/areas/authority-certificate/verify.ts` now import local schema
  and input contracts through `./types` rather than bypassing the area face.
- Verification:

```bash
npm run test -- test/architecture/import-posture.test.ts test/protocol/authority-certificate.test.ts
```

Result: 27 tests passed, 0 failed.

## Non-Blocking Pressure Points

**Review artifact provenance is still caller-supplied:**

- Status: Future review-surface work, not a local foundation blocker. Review
  binding records exact contract, policy input, artifact, catalog, renderer,
  action-binding, hidden-action, secondary-action, and gateway-policy digests,
  but no source-owned renderer registry computes those digests.
- Files: `src/protocol/areas/review-binding/artifacts.ts`, `src/protocol/areas/review-binding/decisions.ts`, `src/protocol/areas/review-binding/schemas.ts`, `src/protocol/areas/policy-greenlight/policy.ts`, `test/protocol/kernel-policy-gateway.test.ts`
- Impact: Protocol binding is strong, but a caller-controlled renderer can still produce bad or misleading human review artifacts while satisfying caller-provided digest fields.
- Fix approach: Add a source-owned renderer registry/generator that computes artifact, catalog, renderer, and action-binding digests from exact contract inputs.

**Runtime ingress is narrow and ceremony-heavy:**

- Status: Future host-adapter work, not a local foundation blocker. `./runtime`
  exposes `proposeRuntimeIngressActionContracts`, but callers must provide
  normalized dispatch blocks, graph closure, evidence refs, tool-call
  parameters, and action-family config.
- Files: `src/runtime/index.ts`, `src/runtime/ingress/index.ts`, `src/runtime/LANE.md`, `test/runtime/runtime-ingress.test.ts`
- Impact: The authority boundary is correct, but the surface is easy to misuse or avoid. A future wrapper may omit evidence refs, hide unobserved regions, or treat caller-observed traces as complete host custody.
- Fix approach: Add runtime-specific shims one host at a time. Each shim must only normalize observed dispatch evidence and must not call policy, gateway, receipt, mutation, or protected-surface code.

**x402 spend windows are declared but not enforced:**

- Status: Honest metadata, not a local foundation blocker. `maxAtomicAmountPerCall`
  is enforced before compilation, while `maxAtomicAmountPerSession`,
  `maxAtomicAmountPerDay`, and `reviewThresholdAtomicAmount` carry
  `spendWindowEnforcementStatus: "not_enforced_tier1_metadata"`.
- Files: `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `test/adapters/x402-install-proposal.test.ts`, `test/adapters/x402-payment-action-proposal.test.ts`, `migrations/0001_protocol_kernel.sql`
- Impact: Current local x402 authority is per-call only. Any session/day/review spend-window claim would be ambient policy theatre.
- Fix approach: Add a replay-safe spend accumulator/reservation ledger keyed by tenant, organization, principal, agent, gateway, resource, and time window before enforcing broader spend bounds.

**AuthorityCertificate visible annotations are signed:**

- Status: Closed for local foundation. `buildAuthorityCertificateSigningInput()`
  now signs the protocol base fields, terminal binding, redacted envelope,
  envelope digest, artifact digest list, verification policy, consumer bindings,
  extensions, and emitted timestamp. It still excludes `signatures[]` and the
  derived `signingInputDigest`.
- Files: `src/protocol/areas/authority-certificate/signing.ts`,
  `src/protocol/areas/authority-certificate/verify.ts`,
  `test/protocol/authority-certificate.test.ts`,
  `docs/internal/protocol-definition.md`
- Impact: Visible certificate annotations can no longer be tampered without
  breaking `verifyAuthorityCertificate()`. They remain annotations, not
  execution authority.

**Lifecycle/status maps can drift across files:**

- Status: Guarded source-owned metadata, not an open local foundation blocker.
  Terminal state meaning is represented in protocol navigation,
  `ActionAttemptLifecycle`, receipt status derivation, operation lifecycle, and
  evidence projections.
- Files: `src/protocol/navigation/index.ts`, `src/protocol/areas/action-attempt-lifecycle/matrix.ts`, `src/protocol/areas/receipt-export/status.ts`, `src/protocol/areas/operation-lifecycle/lifecycle.ts`, `src/protocol/evidence-projections/projections.ts`, `test/protocol/action-attempt-lifecycle.test.ts`, `test/protocol/evidence-projections.test.ts`
- Impact: A new transition or outcome can make one projection overstate authority while another records a proof gap or refusal.
- Fix approach: Keep protocol navigation as source-owned metadata and derive lifecycle/projection assertions from the same transition/outcome table.

**Conformance is probe-based, not certification:**

- Status: Claim boundary is explicit. `checkProtectedMutationAdapterConformance()`
  verifies caller-supplied probe behavior; it does not inspect provider code,
  deployment custody, bypass paths, or runtime host controls.
- Files: `src/conformance/index.ts`, `src/conformance/LANE.md`, `test/conformance/protected-mutation-adapter-conformance.test.ts`, `test/conformance/x402-payment-conformance.test.ts`
- Impact: A passing conformance check proves a narrow supplied probe did not mutate without `VerifiedGatewayCheck`. It does not certify an adapter or provider.
- Fix approach: Keep conformance language narrow and add adapter-family hostile probe suites before broader compatibility or certification claims.

## Known Bugs

**No confirmed local authority-path correctness bug detected:**

- Symptoms: Focused tests passed for AuthorityCertificate mint/verify, runtime ingress refusal boundaries, x402 hostile probes, root export curation, and claim-boundary wording.
- Files: `test/protocol/authority-certificate.test.ts`, `test/runtime/runtime-ingress.test.ts`, `test/adapters/x402-bypass-probes.test.ts`, `test/architecture/root-exports.test.ts`, `test/architecture/claim-boundary.test.ts`
- Trigger: Not applicable.
- Workaround: Not applicable.

**False posture injection remains a trust-boundary bug class:**

- Symptoms: A caller with gateway-custody authority can submit `bypass_probe` and `protected_path_posture` records. The kernel checks scope, freshness, source authority, required probe kinds, and outcomes, but it cannot independently prove the probe actually ran.
- Files: `src/protocol/areas/bypass-probe/transitions.ts`, `src/protocol/areas/protected-path-posture/transitions.ts`, `src/http/routes/transition-route-registry.ts`, `test/adapters/x402-bypass-probes.test.ts`
- Trigger: A compromised or dishonest gateway-custody caller records passing probe evidence without running the hostile checks.
- Workaround: Treat gateway custody as the trust boundary. External/provider claims require independent attestation, monitored probe execution, or provider-side custody proof.

## Security Considerations

**Gateway custody is the real authority holder:**

- Risk: If mutation credentials remain reachable through raw sibling tools, shell paths, browser tools, MCP direct calls, token passthrough, wrapper drift, or generated-code side effects, the generated code escaped the contract boundary.
- Files: `src/protocol/areas/protected-path-posture/transitions.ts`, `src/protocol/areas/bypass-probe/schemas.ts`, `src/adapters/x402-payment/bypass-probes.ts`, `test/adapters/x402-bypass-probes.test.ts`, `test/protocol/action-attempt-lifecycle.test.ts`
- Current mitigation: `gateway_checked` posture requires fresh passing probes for credential custody, raw sibling blocking, MCP direct-call blocking, token passthrough blocking, wrapper drift, and failure-closed behavior.
- Recommendations: Do not claim installed protection until a customer/provider gateway owns the mutation credential and the hostile probes run from the actual deployment boundary.

**Fixture custody can look stronger than it is:**

- Risk: `fixture_gateway_held` can satisfy generic protected-path posture checks, while x402-specific hostile probes deliberately treat fixture wallet custody as non-establishment evidence.
- Files: `src/protocol/areas/protected-path-posture/transitions.ts`, `src/adapters/x402-payment/conformance.ts`, `src/adapters/x402-payment/bypass-probes.ts`, `test/adapters/x402-bypass-probes.test.ts`
- Current mitigation: x402 hostile probes require `gateway_held` for custody and refuse fixture custody as external establishment.
- Recommendations: Keep fixture custody language local. Any provider-facing adapter must use real custody status and external probe evidence.

**HMAC certificate signatures are dev-only but still schema-valid:**

- Risk: `AuthorityCertificateSignatureAlgorithmSchema` accepts `hmac-sha256`, and signing helpers can create HMAC signatures. Production verification rejects HMAC unless `allowDevHmac` is explicitly enabled.
- Files: `src/protocol/areas/authority-certificate/schemas.ts`, `src/protocol/areas/authority-certificate/inputs.ts`, `src/protocol/areas/authority-certificate/signing.ts`, `src/protocol/areas/authority-certificate/verify.ts`, `test/protocol/authority-certificate.test.ts`
- Current mitigation: `verifyAuthorityCertificate()` returns `hmac_not_allowed` by default, and tests cover forged/propose-time HMAC rejection.
- Recommendations: Never treat HMAC certificate material as portable authority. Keep external examples on Ed25519 pinned-key trust only.

**Hosted admission is a seam, not hosted auth:**

- Risk: `caller-auth.ts` supports static bearer-role tokens, and `hosted-caller-identity.ts` defines a verifier seam. Neither implements real org auth, RBAC, revocation infrastructure, retention, search, alerting, or provider/customer custody.
- Files: `src/http/admission/caller-auth.ts`, `src/http/admission/hosted-caller-identity.ts`, `src/http/admission/index.ts`, `test/http/http.test.ts`
- Current mitigation: Hosted mode refuses lane-token-only admission before parsing bodies, checks role/scope/freshness, and stores only digest/ref caller evidence on accepted transitions.
- Recommendations: Add a real hosted verifier, revocation model, tenant authorization policy, and evidence-read authorization before hosted operation claims.

**Package-install proof is parameter binding, not material attestation:**

- Risk: The package gateway binds observed package manager, registry, manifest, lockfile, install flags, lifecycle-script policy, and resolved material fields, but it does not independently verify registry tarballs or package-manager behavior.
- Files: `src/adapters/package-install/gateway.ts`, `src/runtime/package-install/action-proposal.ts`, `test/adapters/package-install-gateway.test.ts`, `test/integration/package-install-end-to-end.test.ts`
- Current mitigation: Gateway-observed parameters must match the contract digest before mutation.
- Recommendations: Add a controlled installer or external material-verification gateway before supply-chain enforcement claims.

**Evidence reads are redacted projections, not audit product surfaces:**

- Risk: Consumers can confuse redacted diagnostic projections with complete hosted audit/search.
- Files: `src/http/handlers/evidence-read.ts`, `src/http/handlers/internal-record-read.ts`, `src/protocol/areas/object-registry/index.ts`, `test/http/http.test.ts`
- Current mitigation: Internal-only records such as `contract_stream_event`, `idempotency_ledger_entry`, `bypass_probe`, and `tool_call_draft` are hidden from generic raw reads.
- Recommendations: Keep raw internal records unavailable over generic HTTP and add reader authorization, retention, and purpose-built projections before hosted audit claims.

## Performance Bottlenecks

**Receipt timeline projection scans broad reconciliation sets:**

- Problem: `handleEvidenceRead()` loads all tenant/org `surface_operation_reconciliation` records for a receipt timeline and filters the target mutation in projection logic.
- Files: `src/http/handlers/evidence-read.ts`, `src/protocol/evidence-projections/projections.ts`, `src/storage/d1/index.ts`, `migrations/0001_protocol_kernel.sql`
- Cause: The store prioritizes append-only authority correctness and a small set of current-state indexes over read-optimized evidence timelines.
- Improvement path: Add a reconciliation-by-mutation index or materialized read model after evidence semantics stabilize.

**Protocol records are JSON payloads behind generic indexes:**

- Problem: D1 reads parse full JSON payloads for records, stream events, isolation state, protected path posture, and evidence projections.
- Files: `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `migrations/0001_protocol_kernel.sql`, `src/protocol/evidence-projections/projections.ts`
- Cause: D1 is used as reconstruction truth, not a query-optimized hosted audit backend.
- Improvement path: Keep D1 as canonical reconstruction storage and add projection tables for hosted search/navigation only after the record semantics are stable.

**Runtime ingress graph ingestion is block-oriented:**

- Problem: `RuntimeIngressDispatchBlockSchema` expects a bounded block with complete dispatches, graph nonce, truncation status, and observed dispatch details.
- Files: `src/runtime/ingress/index.ts`, `src/protocol/areas/generated-execution-graph/inputs.ts`, `test/runtime/runtime-ingress.test.ts`
- Cause: Current proof targets local bounded dispatches, not continuous browser/shell/MCP streams.
- Improvement path: Add streaming chunk semantics with refusal/quarantine for ambiguous tails before claiming large real generated-program ingestion.

## Fragile Areas

**D1 atomicity depends on batch rollback and error classification:**

- Files: `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `migrations/0001_protocol_kernel.sql`, `test/support/d1-http-harness.ts`, `test/protocol/protocol-store-atomicity-contract.test.ts`
- Why fragile: Authority-bearing commits depend on atomic records, stream events, greenlight issuance, idempotency reservations, greenlight consumption, operation claims, receipt indexes, and current-state indexes.
- Safe modification: Keep every authority-affecting write inside the store commit boundary and preserve explicit conflict classes.
- Test coverage: Memory and local D1 harness stores satisfy the atomicity contract. Production Cloudflare D1 behavior still needs provider-backed smoke coverage before hosted claims.

**Gateway commit outcomes are easy to collapse incorrectly:**

- Files: `src/protocol/areas/gateway-gate/transitions.ts`, `src/protocol/areas/gateway-gate/artifacts.ts`, `src/protocol/areas/gateway-gate/replay-refusal/index.ts`, `test/protocol/protocol-store-atomicity-contract.test.ts`
- Why fragile: `already_consumed`, `operation_claim_conflict`, `receipt_index_conflict`, `stream_conflict`, gateway refusal, replay refusal, and downstream proof gap have different authority consequences.
- Safe modification: Add every new gateway failure mode through `commitGatewayCheckPlan()` and assert no partial mutation, receipt, index, or event survives failed commits.
- Test coverage: Replay and atomicity tests exist, but every new gateway outcome needs explicit projection and receipt assertions.

**AuthorityCertificate is terminal evidence only:**

- Files: `src/protocol/areas/authority-certificate/transitions.ts`, `src/protocol/areas/authority-certificate/verify.ts`, `src/protocol/navigation/index.ts`, `test/protocol/authority-certificate.test.ts`
- Why fragile: Certificate wording can easily drift into execution authority, identity, settlement, marketplace, or hosted trust claims.
- Safe modification: Keep `createAuthorityCertificate` kernel-only, terminal-only, and excluded from HTTP transition navigation unless a hosted verifier API is built as evidence export only.
- Test coverage: Tests reject non-terminal minting, wrong keys, tampering, missing gateway signer, replay mismatch, and production HMAC trust.

**Root export curation is a safety boundary:**

- Files: `src/index.ts`, `src/runtime/index.ts`, `src/experimental.ts`, `src/conformance/index.ts`, `package.json`, `test/architecture/root-exports.test.ts`, `test/architecture/claim-boundary.test.ts`
- Why fragile: Moving runtime ingress, reference gateways, conformance probes, or experimental adapters onto the root surface can make local fixtures look production-ready.
- Safe modification: Keep mutation gateways under `./experimental`, conformance under `./conformance`, runtime observer/compiler helpers under `./runtime`, and stable schema/client/app/navigation exports at root.
- Test coverage: Root export and claim-boundary tests enforce current separation.

**Architecture guard lists are manually maintained:**

- Files: `test/architecture/import-posture.test.ts`, `test/architecture/naming-posture.test.ts`, `src/protocol/areas/`, `src/protocol/public/schemas.ts`, `src/protocol/public/inputs.ts`
- Why fragile: New areas and adapter rails can land without being added to hardcoded architecture lists, as shown by the current `authority-certificate` omission in `protocolAreas`.
- Safe modification: Prefer filesystem-derived area inventories and tests that fail when a real source area is missing from a guard list.
- Test coverage: Existing tests pass but do not catch the new certificate-area omission.

## Scaling Limits

**x402 session/day limits have no capacity model:**

- Current capacity: Per-call x402 amount refusal only.
- Limit: Session/day/review threshold fields cannot enforce repeated calls, portfolio exposure, or review routing.
- Files: `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `migrations/0001_protocol_kernel.sql`
- Scaling path: Add spend-window reservation and reconciliation records before promoting spend windows from metadata to policy authority.

**Memory store is a reference implementation:**

- Current capacity: Local tests and fixture flows.
- Limit: `src/storage/memory/index.ts` stages maps and clones state for atomic commit simulation; it is not multi-agent durable storage.
- Files: `src/storage/memory/index.ts`, `test/protocol/protocol-store-atomicity-contract.test.ts`
- Scaling path: Keep memory storage test-only and route long-running execution evidence through D1 or another durable store.

**AuthorityCertificate verification is offline pinned-key only:**

- Current capacity: Local certificate minting and `verifyAuthorityCertificate()` with supplied trust material.
- Limit: No live key discovery, revocation status, certificate transparency, hosted verify API, tenant trust policy, or cross-org verifier agreement.
- Files: `src/protocol/areas/authority-certificate/verify.ts`, `src/protocol/areas/authority-certificate/schemas.ts`, `test/protocol/authority-certificate.test.ts`, `docs/internal/decisions.md`
- Scaling path: Add explicit trust registry, JWKS/revocation semantics, and verifier API as evidence verification only, not execution authority.

**Runtime ingress cannot represent arbitrary generated programs yet:**

- Current capacity: Local x402 payment and package-install dispatch boundaries with explicit loop/retry/dynamic/raw-sibling/truncation handling.
- Limit: Broad MCP/browser/shell/network/package-manager streams need streaming graph ingestion, host-level interception, and fail-closed adapters.
- Files: `src/runtime/ingress/index.ts`, `src/protocol/areas/generated-execution-graph/`, `src/protocol/areas/tool-call-draft/`, `test/runtime/runtime-ingress.test.ts`, `test/protocol/generated-execution-graph.test.ts`
- Scaling path: Add one host integration at a time and require hostile traces for raw sibling bypass, dynamic tool construction, late-bound params, graph truncation, replay, and stale drafts.

## Dependencies at Risk

**Cloudflare D1 behavior:**

- Risk: Batch atomicity, uniqueness constraints, and error strings underpin local durable authority commits.
- Impact: Divergent production D1 behavior can misclassify conflicts or produce ambiguous authority writes.
- Files: `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `migrations/0001_protocol_kernel.sql`, `test/support/d1-http-harness.ts`, `test/protocol/protocol-store-atomicity-contract.test.ts`
- Migration plan: Add Cloudflare-backed smoke tests for each conflict class before hosted operation claims.

**WebCrypto Ed25519 support:**

- Risk: `signAuthorityCertificateSigningInput()` and `verifyAuthorityCertificateSignature()` use `crypto.subtle` Ed25519 import/sign/verify behavior.
- Impact: Runtime compatibility drift can break certificate verification or push consumers toward dev HMAC paths.
- Files: `src/protocol/areas/authority-certificate/signing.ts`, `test/protocol/authority-certificate.test.ts`
- Migration plan: Keep compatibility tests in the target runtime and keep HMAC disabled for production verification.

**Bun and package surface tooling:**

- Risk: The command contract depends on Bun `1.3.9`, TypeScript, ESLint, Prettier, npm dry-run package checks, and CI running `npm run check:repo`.
- Impact: Toolchain drift can break type, test, package-surface, or architecture gates.
- Files: `package.json`, `README.md`, `.github/workflows/check.yml`, `scripts/check-package-surface.mjs`, `test/architecture/package-surface.test.ts`
- Migration plan: Keep `packageManager` pinned and preserve `npm run check:repo` as the local and CI gate.

**Experimental adapter exports:**

- Risk: Reference gateways and fixture probe executors are exposed through `./experimental`.
- Impact: Early consumers can confuse local proof fixtures with provider/customer enforcement.
- Files: `src/experimental.ts`, `src/adapters/package-install/gateway.ts`, `src/adapters/preview-deploy/gateway.ts`, `src/adapters/repo-write/gateway.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `test/architecture/root-exports.test.ts`
- Migration plan: Keep experimental naming until external custody, bypass posture, and provider/customer gateway proof are source-tested.

## Future Scope, Not Local-Foundation Blockers

These are still necessary for the full clearing-house business, but they are not
open blockers for the local foundation claim. Treat them as future mechanism
tracks until source, custody, and tests exist.

**Provider/customer gateway installation:**

- Problem: No real provider or customer gateway owns mutation credentials and runs hostile bypass probes outside local fixtures.
- Blocks: Provider enforcement, live wallet custody, production protected actions, and external adapter establishment.
- Files: `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/bypass-probes.ts`, `src/adapters/x402-payment/conformance.ts`, `test/adapters/x402-bypass-probes.test.ts`, `test/integration/x402-d1-http.test.ts`

**Hosted verifier and evidence operation:**

- Problem: HTTP transport has admission seams and redacted projections, but no real hosted identity provider, org RBAC, reader authorization, retention, search, alerting, or audit export.
- Blocks: Hosted control-plane and hosted audit-product claims.
- Files: `src/http/admission/hosted-caller-identity.ts`, `src/http/admission/index.ts`, `src/http/handlers/evidence-read.ts`, `src/sdk/client.ts`, `test/http/http.test.ts`

**Cross-org AuthorityCertificate trust:**

- Problem: Certificate verification is local/offline with caller-supplied pinned trust material only.
- Blocks: Cross-org verifier trust, live JWKS, revocation, marketplace certification, hosted verification, and portable business evidence claims.
- Files: `src/protocol/areas/authority-certificate/verify.ts`, `src/protocol/areas/authority-certificate/schemas.ts`, `docs/internal/decisions.md`, `test/protocol/authority-certificate.test.ts`

**Source-owned review renderer:**

- Problem: The protocol can bind review artifacts and decisions, but no renderer implementation creates human review artifacts from exact contracts and computes source-owned digests.
- Blocks: Claims that rendered reviews are trustworthy operational surfaces.
- Files: `src/protocol/areas/review-binding/`, `src/protocol/areas/policy-greenlight/policy.ts`, `test/protocol/kernel-policy-gateway.test.ts`

**x402 spend ledger:**

- Problem: No session/day/review accumulator, reservation, or policy read path exists.
- Blocks: Spend-window enforcement beyond per-call max.
- Files: `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `migrations/0001_protocol_kernel.sql`

**Broad runtime host adapters:**

- Problem: Runtime ingress covers local x402 payment and package-install dispatch boundaries only.
- Blocks: Broad MCP, browser, shell, network, filesystem, package-manager, CI, cloud, and generated-tool-stream enforcement claims.
- Files: `src/runtime/ingress/index.ts`, `src/protocol/areas/generated-execution-graph/`, `src/protocol/areas/tool-call-draft/`, `test/runtime/runtime-ingress.test.ts`

**External package-material attestation:**

- Problem: Package install binds observed parameters but does not verify package registry material, lockfile integrity, package-manager execution, or lifecycle scripts outside the local gateway fixture.
- Blocks: Supply-chain enforcement claims.
- Files: `src/adapters/package-install/gateway.ts`, `src/runtime/package-install/action-proposal.ts`, `test/adapters/package-install-gateway.test.ts`, `test/integration/package-install-end-to-end.test.ts`

## Test Coverage Gaps

These are external-establishment coverage tracks. They are required before the
corresponding external claim, but they are not open defects in the local
foundation.

**AuthorityCertificate architecture guard coverage: covered**

- What's tested: `test/architecture/import-posture.test.ts` derives protocol
  areas from `src/protocol/areas/*`, so `authority-certificate` is covered by
  import, kernel, public-index, and local types-face assertions.
- Files: `test/architecture/import-posture.test.ts`, `src/protocol/areas/authority-certificate/`
- Risk: Future guard drift now requires either a filesystem-level blind spot or
  intentional test weakening.
- Priority: Closed

**Provider-backed x402 custody:**

- What's not tested: External wallet/provider/customer gateway custody proving credential isolation, direct-call blocking, token passthrough blocking, wrapper drift absence, and failure-closed behavior.
- Files: `src/adapters/x402-payment/bypass-probes.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `test/adapters/x402-bypass-probes.test.ts`, `test/integration/x402-d1-http.test.ts`
- Risk: Local hostile probes are mistaken for provider custody.
- Priority: Future-high before provider/customer custody claims

**Real runtime hostile trace ingestion:**

- What's not tested: Live generated programs using MCP, browser, shell, package-manager, network, filesystem, CI, cloud, or database tools with dynamic tool construction and raw sibling bypass attempts.
- Files: `src/runtime/ingress/index.ts`, `src/runtime/codemode-multi-action/generated-program-runner.ts`, `src/protocol/areas/generated-execution-graph/coverage.ts`, `test/runtime/runtime-ingress.test.ts`, `test/runtime/codemode-multi-action-runtime.test.ts`
- Risk: Caller-observed fixture evidence can pass while live runtime behavior escapes the contract boundary.
- Priority: Future-high before broad runtime control claims

**Cross-org certificate verification:**

- What's not tested: JWKS retrieval, revocation, key rotation, tenant trust policies, verifier service behavior, and consumer-binding trust semantics.
- Files: `src/protocol/areas/authority-certificate/verify.ts`, `src/protocol/areas/authority-certificate/schemas.ts`, `test/protocol/authority-certificate.test.ts`
- Risk: Local offline verification is overread as portable cross-org trust.
- Priority: Future-high before cross-org certificate trust claims

**Spend-window enforcement:**

- What's not tested: Session/day/review threshold accumulation because no accumulator exists.
- Files: `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `migrations/0001_protocol_kernel.sql`
- Risk: Declared spend fields look enforceable while only per-call refusal is active.
- Priority: Future-medium before spend-window enforcement claims

**Source-owned review rendering:**

- What's not tested: Renderer registry provenance and digest computation from source-owned review artifact generation.
- Files: `src/protocol/areas/review-binding/artifacts.ts`, `src/protocol/areas/review-binding/decisions.ts`, `test/protocol/kernel-policy-gateway.test.ts`
- Risk: Review theatre can satisfy protocol binding fields if the renderer itself is caller-controlled.
- Priority: Future-medium before rendered-review trust claims

**Production D1 commit behavior:**

- What's not tested: Cloudflare-backed D1 batch rollback and error classification for each authority-bearing conflict class.
- Files: `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `test/support/d1-http-harness.ts`, `test/protocol/protocol-store-atomicity-contract.test.ts`
- Risk: Local D1 harness parity hides provider-specific ambiguity during greenlight, gateway, stream, receipt, or idempotency commits.
- Priority: Future-medium before hosted operation claims

---

*Concerns audit: 2026-05-20*
