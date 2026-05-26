# Codebase Concerns

**Analysis Date:** 2026-05-26

## Tech Debt

**Authority and proof posture are concentrated in large orchestration files:**
- Issue: Several files carry many authority-boundary responsibilities at once: schema normalization, policy posture, proof projection, readback validation, and reason-code construction.
- Files: `src/mcp/x402-proposal.ts`, `src/runtime/ingress/index.ts`, `src/protocol/areas/policy-greenlight/transitions.ts`, `src/protocol/areas/gateway-gate/transitions.ts`, `src/adapters/x402-payment/protected-tool-profile/index.ts`, `src/surfaces/boundary-manifest.ts`, `src/surfaces/proof-packets/product-completion.ts`, `src/protocol/evidence-projections/projections.ts`
- Impact: Small changes in these modules can accidentally widen authority, weaken refusal semantics, or turn a proof-gap/readback surface into an implied control surface.
- Fix approach: Extract narrow helpers only around already-tested invariants. Keep source-owned tests in `test/protocol/kernel-policy-gateway.test.ts`, `test/runtime/runtime-ingress.test.ts`, `test/adapters/x402-wallet-gateway.test.ts`, and `test/architecture/surface-boundary-posture.test.ts` as the refactor guard.

**Product completion is encoded as proof constants plus scripts:**
- Issue: Launch and product-completion state is represented through source constants and script-read proof packets rather than a single source-owned terminal state machine.
- Files: `src/surfaces/product-launch-gate-resolution.ts`, `src/surfaces/proof-packets/product-completion.ts`, `scripts/check-product-completion.mjs`, `scripts/check-distribution-provenance.mjs`, `scripts/check-live-x402-paid-retry.mjs`, `scripts/check-host-generated-code-containment.mjs`, `test/architecture/product-launch-gate-resolution.test.ts`
- Impact: Product claims can drift when script inputs, generated proof packets, and source constants disagree. The code has guardrails, but the mechanism is still projection-heavy.
- Fix approach: Treat these outputs as evidence/readback only. Do not add new product authority claims without source constants, proof packet validation, and architecture tests in `test/architecture/product-launch-gate-resolution.test.ts`.

**Surface boundary enforcement is partly manual and regex-based:**
- Issue: The package/product boundary is encoded in a hand-maintained manifest and architecture tests that scan source text for imports, forbidden language, and exported surfaces.
- Files: `src/surfaces/boundary-manifest.ts`, `test/architecture/surface-boundary-posture.test.ts`, `test/architecture/claim-boundary.test.ts`, `test/architecture/active-vocabulary.test.ts`, `package.json`
- Impact: Static `from` import scans and vocabulary scans can miss dynamic `import()`, generated export paths, or authority leakage expressed through new terminology.
- Fix approach: Keep the manifest small and explicit. Add an AST-based dependency graph check before allowing new public subpaths, source roots, or generated package artifacts.

**A2A-style negotiation is evidence-only but has no transition layer:**
- Issue: The negotiation area models external protocol evidence, offers, decisions, linked agreements, obligations, and agreement status transitions as schemas and registered objects only.
- Files: `src/protocol/areas/negotiation/LANE.md`, `src/protocol/areas/negotiation/schemas.ts`, `src/protocol/areas/negotiation/inputs.ts`, `src/protocol/areas/negotiation/index.ts`, `src/protocol/events/schemas.ts`, `src/protocol/areas/object-registry/index.ts`, `test/protocol/negotiation-schemas.test.ts`, `test/architecture/negotiation-no-authority-surface.test.ts`
- Impact: The current lane is correctly non-authority, but it does not enforce lifecycle ordering, referential integrity, or readback consistency between a negotiation decision and later protected action evidence.
- Fix approach: Keep `src/protocol/areas/negotiation/` free of policy, gateway, receipt, and authority-certificate imports. Add transition/readback code only if it records evidence and preserves `evidencePosture: "imported_evidence_only"` for A2A references.

**Runtime ingress caps generated execution blocks at local schema limits:**
- Issue: Runtime ingress accepts at most 32 observed dispatches per block and uses bounded evidence lists, but generated-code programs can branch, loop, retry, and dynamically construct calls beyond a single bounded block.
- Files: `src/runtime/ingress/schemas.ts`, `src/runtime/ingress/index.ts`, `src/runtime/codemode-multi-action/generated-program-runner.ts`, `src/runtime/codemode-multi-action/generated-graph-evidence.ts`, `test/runtime/runtime-ingress.test.ts`
- Impact: Over-limit or truncated execution graphs become proof-gap/refusal evidence. They are not complete host containment proof or full generated-program authority analysis.
- Fix approach: Preserve `truncationStatus`, `unobservedRegionRefs`, and refusal reason codes whenever accepting larger host transcripts or multi-block generated execution evidence.

## Known Bugs

**Current distribution launch gate is blocked:**
- Symptoms: Source-owned launch state records current local metadata as `handshake-protocol-kernel@0.2.8`, while public npm latest evidence is `0.2.7`, missing current exports, and MCP Registry lookup/search is not accepted or discoverable.
- Files: `src/surfaces/product-launch-gate-resolution.ts`, `src/surfaces/proof-packets/product-completion.ts`, `scripts/check-distribution-provenance.mjs`, `test/architecture/product-launch-gate-resolution.test.ts`, `README.md`, `docs/internal/decisions.md`, `package.json`, `server.json`
- Trigger: Any product claim that treats public npm or MCP Registry as current 0.2.8 distribution proof.
- Workaround: Claim only historical 0.2.7 distribution evidence. Keep 0.2.8 publication and MCP Registry discoverability as proof gaps until official readback matches `package.json` and `server.json`.

**Live external x402 proof is blocked by missing funded signer and signed retry evidence:**
- Symptoms: The live provider gate remains `resolved_blocked` with `funded_customer_gateway_signer_missing` and `live_signed_retry_not_exercised`.
- Files: `src/surfaces/product-launch-gate-resolution.ts`, `src/surfaces/proof-packets/product-completion.ts`, `scripts/check-live-x402-paid-retry.mjs`, `test/architecture/product-launch-gate-resolution.test.ts`, `src/adapters/x402-payment/wallet-gateway.ts`
- Trigger: Any claim that the package has completed live external x402 paid execution or customer gateway custody.
- Workaround: Use local/reference x402 proof only. Treat external sandbox/live readiness as custody/readiness evidence until a customer-held funded signer and terminal signed retry proof exist.

**Codex host activation can be misread as host containment:**
- Symptoms: Codex activation records one default raw sibling probe as `detected` and can still yield host-specific activation readiness, while product completion requires raw sibling refusal in a live host containment transcript before the containment gate can pass.
- Files: `src/adapters/x402-payment/protected-tool-profile/codex-activation.ts`, `src/adapters/protected-path-probes/host-fixture.ts`, `src/surfaces/proof-packets/product-completion.ts`, `scripts/check-host-generated-code-containment.mjs`, `test/adapters/x402-protected-tool-codex-activation.test.ts`, `docs/internal/decisions.md`
- Trigger: A consumer treats `host_specific_ready` activation evidence as proof that raw shell, browser, direct MCP, network, package-manager, signer, or sibling SDK paths are blocked.
- Workaround: Keep activation and containment separate. Host containment requires the structured transcript path consumed by `scripts/check-host-generated-code-containment.mjs`.

## Security Considerations

**Hosted raw record reads depend on a configured audit sink in promoted modes:**
- Risk: Raw record read admission requires roles, scopes, purpose, expiry, and raw-read posture, but durable audit persistence is delegated through `hostedRawReadAuditSink`.
- Files: `src/http/handlers/internal-record-read.ts`, `src/http/handlers/raw-read-audit.ts`, `src/http/admission/hosted-admission-config.ts`, `src/http/app-options.ts`, `test/http/http.test.ts`
- Current mitigation: Preview/production hosted raw reads fail closed with `hosted_raw_read_audit_sink_required` when raw reads are gated or allowed and no sink is configured.
- Recommendations: Add a source-owned durable audit sink implementation or D1 audit table before scaling hosted raw reads beyond controlled deployments.

**Project and workspace raw-read hiding relies on optional payload fields:**
- Risk: Hosted record scope checks always compare tenant/org metadata, but project and workspace checks only apply when `projectId` and `workspaceId` exist on the record payload.
- Files: `src/http/handlers/hosted-record-scope.ts`, `src/http/handlers/internal-record-read.ts`, `src/protocol/store/port.ts`, `test/http/http.test.ts`
- Current mitigation: Cross-tenant and cross-organization reads are hidden as not found, and project/workspace reads are hidden when payload fields are present.
- Recommendations: Promote project/workspace scope into `StoredProtocolRecord` metadata or a dedicated index before relying on hosted raw read isolation for multi-project tenants.

**Self-hosted transition custody uses static bearer tokens:**
- Risk: Self-hosted callers are admitted by per-role bearer tokens and constant-time comparison. Token rotation, issuance provenance, and revocation are outside the protocol kernel.
- Files: `src/http/admission/caller-auth.ts`, `src/http/admission/index.ts`, `test/support/d1-http-harness.ts`, `README.md`
- Current mitigation: Hosted mode has a verifier-adapter path, and self-hosted mode is explicit about custody being local configuration.
- Recommendations: Do not treat self-hosted bearer token possession as principal identity. Use hosted verifier evidence or an external gateway-controlled admission layer for promoted deployments.

**Signing and payment material remain narrow but high blast radius:**
- Risk: Wallet payment payload/signature creation and authority-certificate signing handle sensitive signing material. These paths must not leak raw keys, payment payloads, or signatures into package roots, logs, or readback surfaces.
- Files: `src/adapters/x402-payment/wallet-gateway.ts`, `src/protocol/areas/authority-certificate/inputs.ts`, `src/protocol/areas/authority-certificate/signing.ts`, `test/adapters/x402-wallet-gateway.test.ts`, `test/protocol/authority-certificate.test.ts`
- Current mitigation: Payment payload/signature creation occurs after a verified gateway check, and certificate signing is terminal evidence rather than permission.
- Recommendations: Keep these modules out of broad exports. Add redaction tests whenever a new readback, proof packet, CLI command, or MCP resource touches these paths.

**Negotiation records are audit-readable transition evidence:**
- Risk: Negotiation objects, including A2A imported evidence refs and agreement obligation bindings, are registered as `transition_evidence` with `audit_read`. Misusing those records as authorization would turn evidence into permission.
- Files: `src/protocol/areas/negotiation/schemas.ts`, `src/protocol/areas/object-registry/index.ts`, `test/protocol/negotiation-object-registry.test.ts`, `test/protocol/negotiation-schemas.test.ts`, `test/architecture/negotiation-no-authority-surface.test.ts`
- Current mitigation: Schemas reject authority-shaped obligation refs and external protocol evidence postures such as authorization, identity proof, execution proof, settlement, payment, receipt, or certificate.
- Recommendations: Any A2A importer or readback surface must preserve imported-evidence-only language and must never populate greenlight, gateway-check, receipt, signer, or payment fields from negotiation records.

## Performance Bottlenecks

**D1 record listing is unpaginated for common read paths:**
- Problem: D1 store methods list records by type or action contract without cursor pagination and JSON-parse every returned row.
- Files: `src/storage/d1/index.ts`, `src/protocol/store/port.ts`, `migrations/0001_protocol_kernel.sql`, `test/protocol/protocol-store-atomicity-contract.test.ts`
- Cause: The protocol store API is optimized for reconstructable proof tests and small evidence sets.
- Improvement path: Add cursor/limit arguments to list methods before high-volume hosted readback, tenant export, or audit search.

**Memory store scans are fixture-grade:**
- Problem: The in-memory store uses maps, arrays, structured cloning, and local scans for indexes that D1 stores in tables.
- Files: `src/storage/memory/index.ts`, `src/protocol/store/port.ts`, `test/protocol/model-based-invariants.test.ts`, `test/protocol/protocol-store-atomicity-contract.test.ts`
- Cause: The memory store is a deterministic test/reference implementation, not a production index.
- Improvement path: Keep production hosted paths on D1-compatible storage. Do not use `createInMemoryProtocolStore` as a scalability signal.

**Repository quality gates are broad and script-heavy:**
- Problem: The main gate builds, typechecks, lints, formats, tests, packs, and checks diffs; product-proof scripts then require built `dist` artifacts and optional external readbacks.
- Files: `package.json`, `scripts/check-product-completion.mjs`, `scripts/check-distribution-provenance.mjs`, `scripts/check-package-surface.mjs`, `scripts/build-package-bundles.mjs`
- Cause: Product truth is intentionally source-owned and evidence-heavy, so local verification pays full repo cost.
- Improvement path: Keep `npm run check:repo` as the closeout bar, but add focused preflight scripts for mapper/planner tasks that do not need package build or live distribution proof.

**Large tests slow targeted review:**
- Problem: Several tests exceed 800 lines and bundle many cases into single files.
- Files: `test/architecture/proof-packets.test.ts`, `test/http/http.test.ts`, `test/http/d1-http.test.ts`, `test/runtime/runtime-ingress.test.ts`, `test/adapters/x402-wallet-gateway.test.ts`, `test/protocol/kernel-policy-gateway.test.ts`, `test/integration/x402-d1-http.test.ts`
- Cause: Invariant coverage is centralized around broad protocol stories.
- Improvement path: Split new cases by invariant boundary, not by feature label. Keep high-level regression tests, but add smaller files for new authority, hosted, negotiation, or x402 payment concerns.

## Fragile Areas

**D1 conflict classification depends on provider error text:**
- Files: `src/storage/d1/index.ts`, `test/protocol/protocol-store-atomicity-contract.test.ts`, `test/integration/x402-d1-http.test.ts`
- Why fragile: Atomicity and idempotency paths classify some conflicts from D1 error messages and constraint behavior. Provider wording or driver behavior can change.
- Safe modification: Add tests against the exact D1 adapter behavior before changing schema constraints, unique indexes, or conflict handling.
- Test coverage: `test/protocol/protocol-store-atomicity-contract.test.ts` covers the store contract, but remote/provider drift still needs integration proof.

**Boundary checks can miss non-static import paths:**
- Files: `src/surfaces/boundary-manifest.ts`, `test/architecture/surface-boundary-posture.test.ts`, `test/architecture/root-exports.test.ts`, `test/architecture/package-surface.test.ts`
- Why fragile: Current architecture tests primarily inspect static source text and package export metadata.
- Safe modification: When adding a subpath export, generated bundle, or runtime adapter, update `src/surfaces/boundary-manifest.ts`, `package.json`, and package-surface tests in the same change.
- Test coverage: Static tests are strong for known roots and forbidden fragments, but dynamic imports and generated artifacts need additional build-output checks.

**A2A negotiation records can be overread by downstream consumers:**
- Files: `src/protocol/areas/negotiation/LANE.md`, `src/protocol/areas/negotiation/schemas.ts`, `src/protocol/events/schemas.ts`, `test/protocol/negotiation-events.test.ts`, `test/architecture/negotiation-no-authority-surface.test.ts`
- Why fragile: Terms such as offer, decision, agreement, obligation, and status transition look authority-shaped to product consumers even though the lane is evidence-only.
- Safe modification: Keep event names `*_recorded`, keep object registry export posture as `transition_evidence`, and reject authority-shaped fields at schema boundaries.
- Test coverage: Tests cover non-authority surface posture and schema rejection. They do not prove imported A2A object refs correspond to retrievable source evidence.

**Readiness names can be stronger than the authority they represent:**
- Files: `src/adapters/x402-payment/protected-tool-readiness/index.ts`, `src/adapters/x402-payment/protected-tool-facade/index.ts`, `src/x402-protected-tool/index.ts`, `test/adapters/x402-hosted-custody-readiness.test.ts`, `test/runtime/x402-protected-tool-facade.test.ts`
- Why fragile: `external_custody_ready`, `host_specific_ready`, and package-readiness outputs are easy to confuse with execution authority.
- Safe modification: Preserve authority-boundary fields and non-claims whenever exposing readiness objects through CLI, MCP, docs, or package subpaths.
- Test coverage: Existing tests assert readiness is pre-contract evidence, but external consumers can still overclaim if examples or docs drop the boundary language.

**Proof scripts depend on built package artifacts:**
- Files: `scripts/check-product-completion.mjs`, `scripts/check-package-surface.mjs`, `scripts/check-published-entrypoints.mjs`, `scripts/build-package-bundles.mjs`, `package.json`
- Why fragile: Scripts that inspect `dist/` can report stale package shape if source changes without a fresh build.
- Safe modification: Run `npm run build` or the full `npm run check:repo` before treating package-surface or product-completion output as current.
- Test coverage: Package-surface scripts and architecture tests guard the expected shape, but stale local `dist/` state is still an operator hazard.

## Scaling Limits

**Per-call x402 spend is bounded; aggregate spend is not enforced:**
- Current capacity: The first wedge enforces one exact `x402_payment.exact` per-call protected action with amount, selected payment requirement, gateway credential, delegated authority, and one-use greenlight bindings.
- Limit: There is no source-owned aggregate spend window, budget ledger, merchant risk policy, or multi-call allowance policy in the kernel.
- Scaling path: Add aggregate spend as a separate protected action or policy ledger. Do not reuse one greenlight across calls.
- Files: `src/protocol/areas/policy-greenlight/transitions.ts`, `src/protocol/areas/gateway-gate/gateway-policy.ts`, `src/adapters/x402-payment/action-proposal.ts`, `test/protocol/kernel-policy-gateway.test.ts`

**Hosted operation is read/admission posture, not hosted mutation authority:**
- Current capacity: Hosted readiness reports admission and redacted/raw evidence read posture, D1/KV presence, verifier strategy, and unsupported capabilities.
- Limit: Hosted mode does not create provider custody, settlement authority, payment management, or hosted mutation authority.
- Scaling path: Introduce explicit hosted mutation contracts and gateway-held custody proof before adding hosted execution claims.
- Files: `src/http/handlers/hosted-readiness.ts`, `src/http/admission/hosted-admission-config.ts`, `src/hosted-admission/hosted-verifier-adapter.ts`, `test/http/http.test.ts`, `README.md`

**Generated execution evidence is bounded by observed dispatch capture:**
- Current capacity: Runtime ingress handles bounded dispatch blocks, candidate/refusal classification, generated graph evidence, and reason codes.
- Limit: Unobserved code regions, dynamic tool construction, raw sibling routes, and over-limit blocks remain proof gaps or refusals, not complete generated-program containment.
- Scaling path: Add host-native dispatch interception and transcript ingestion before claiming broad codemode protection.
- Files: `src/runtime/ingress/schemas.ts`, `src/runtime/ingress/index.ts`, `src/runtime/codemode-multi-action/generated-program-runner.ts`, `src/runtime/codemode-multi-action/generated-graph-evidence.ts`, `test/runtime/runtime-ingress.test.ts`

**Negotiation evidence has no durable cross-object lifecycle index:**
- Current capacity: Negotiation objects are registered and events can record sessions, offers, decisions, linked agreements, obligations, and status transitions.
- Limit: The kernel does not enforce status transition ordering, obligation satisfaction, A2A object availability, or agreement-to-action trace closure.
- Scaling path: Add evidence-only transitions and indexes before building A2A importers, readbacks, or reconciliation tools.
- Files: `src/protocol/areas/negotiation/schemas.ts`, `src/protocol/events/schemas.ts`, `src/protocol/areas/object-registry/index.ts`, `migrations/0001_protocol_kernel.sql`, `test/protocol/negotiation-events.test.ts`

## Dependencies at Risk

**MCP packages are alpha:**
- Risk: `@modelcontextprotocol/client` and `@modelcontextprotocol/server` are pinned to `^2.0.0-alpha.2`.
- Impact: SDK surface drift can break MCP proposal/evidence server behavior, package smoke tests, or external discovery scripts.
- Migration plan: Keep MCP usage behind `src/mcp/` and package smoke tests in `scripts/check-package-surface.mjs`; do not let MCP behavior become authority.
- Files: `package.json`, `src/mcp/x402-proposal.ts`, `src/mcp/server.ts`, `scripts/check-package-surface.mjs`

**x402 SDK behavior is authority-adjacent:**
- Risk: `@x402/core` and `@x402/fetch` at `2.12.0` define payment payload/signature construction behavior for the buyer-side exact action.
- Impact: SDK drift can change payment material shape, header expectations, or official payment-required parsing.
- Migration plan: Keep SDK calls inside wallet/readiness adapter modules and rerun `test/adapters/x402-wallet-gateway.test.ts`, `test/adapters/x402-payment-action-proposal.test.ts`, and `test/integration/x402-d1-http.test.ts` for upgrades.
- Files: `package.json`, `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/action-proposal.ts`, `src/adapters/x402-payment/protected-tool-readiness/index.ts`

**Cloudflare D1/KV behavior is part of reconstruction reliability:**
- Risk: Hosted storage uses D1 for structured evidence and KV as a non-authoritative cache.
- Impact: D1 constraint semantics, error messages, or KV expiration behavior can affect atomicity, isolation cache freshness, and readback reliability.
- Migration plan: Treat `src/storage/d1/index.ts` as the production storage contract and keep KV limited to cache posture.
- Files: `package.json`, `src/storage/d1/index.ts`, `src/storage/kv/index.ts`, `migrations/0001_protocol_kernel.sql`, `test/http/d1-http.test.ts`

**Bun test and Node runtime surfaces both matter:**
- Risk: Tests run under Bun while package scripts, bins, and consumer smoke paths run as Node ESM bundles.
- Impact: A path can pass Bun tests and still fail after bundling or under installed-package Node execution.
- Migration plan: Keep package-surface and installed-artifact checks in the closeout gate when changing exports, bins, MCP server entrypoints, or build output.
- Files: `package.json`, `scripts/build-package-bundles.mjs`, `scripts/check-package-surface.mjs`, `scripts/check-published-entrypoints.mjs`, `test/product/hosted-package-consumer.test.ts`

## Missing Critical Features

**Current 0.2.8 public publication and MCP Registry discoverability:**
- Problem: Source metadata targets `handshake-protocol-kernel@0.2.8`, but source-owned launch state keeps current publication and MCP Registry acceptance as blockers.
- Blocks: Current-surface distribution claim, MCP discovery claim, and product-completion closeout.
- Files: `package.json`, `server.json`, `src/surfaces/product-launch-gate-resolution.ts`, `scripts/check-distribution-provenance.mjs`, `README.md`, `docs/internal/decisions.md`

**Customer-held live x402 execution proof:**
- Problem: The repo has local/reference and readiness proof paths, but lacks funded customer gateway signer proof and live signed retry evidence.
- Blocks: Live external provider x402 proof and customer gateway custody claim.
- Files: `src/surfaces/product-launch-gate-resolution.ts`, `scripts/check-live-x402-paid-retry.mjs`, `src/adapters/x402-payment/wallet-gateway.ts`, `test/adapters/x402-hosted-custody-readiness.test.ts`

**Source-owned hosted raw-read audit storage:**
- Problem: Hosted raw-read auditing is represented by an application-provided sink, not a protocol-owned durable table in the migration.
- Blocks: Strong hosted raw-read reconstruction guarantees without deployment-specific audit wiring.
- Files: `src/http/handlers/raw-read-audit.ts`, `src/http/handlers/internal-record-read.ts`, `src/http/app-options.ts`, `migrations/0001_protocol_kernel.sql`

**A2A negotiation importer/readback lane:**
- Problem: Negotiation schemas support A2A-style imported evidence refs, but there is no importer, retriever, status transition API, or readback projection that proves the external evidence exists and stays non-authority.
- Blocks: Safe A2A negotiation evidence use in downstream protected-action context.
- Files: `src/protocol/areas/negotiation/schemas.ts`, `src/protocol/areas/negotiation/LANE.md`, `test/protocol/negotiation-schemas.test.ts`, `test/architecture/negotiation-no-authority-surface.test.ts`

**Host-native generated-code containment:**
- Problem: Current containment proof is transcript/readback based and explicitly refuses host-wide containment claims.
- Blocks: Claims that Handshake controls arbitrary raw shell, browser, direct MCP, network, package-manager, signer, or sibling SDK routes in a host.
- Files: `scripts/check-host-generated-code-containment.mjs`, `scripts/build-host-generated-code-containment-transcript.mjs`, `src/surfaces/proof-packets/product-completion.ts`, `docs/internal/decisions.md`

## Test Coverage Gaps

**Negotiation lifecycle and A2A object availability:**
- What's not tested: Status transition ordering, linked agreement lifecycle closure, obligation satisfaction, duplicate/refused transition behavior, and retrievable external A2A object refs.
- Files: `src/protocol/areas/negotiation/schemas.ts`, `src/protocol/events/schemas.ts`, `test/protocol/negotiation-schemas.test.ts`, `test/protocol/negotiation-events.test.ts`
- Risk: Downstream readbacks can present a coherent-looking negotiation chain whose external evidence is missing, stale, or not linked to later protected action evidence.
- Priority: High

**Dynamic import and generated bundle boundary leakage:**
- What's not tested: AST-level dynamic imports, generated bundle dependency graphs, and package artifact imports beyond explicit package-surface scripts.
- Files: `src/surfaces/boundary-manifest.ts`, `test/architecture/surface-boundary-posture.test.ts`, `scripts/build-package-bundles.mjs`, `scripts/check-package-surface.mjs`
- Risk: A public surface can acquire hidden authority-adjacent imports without being caught by string-based source scans.
- Priority: High

**Remote D1/provider drift under contention:**
- What's not tested: Live remote D1 constraint wording, provider-specific retry behavior under high contention, and migration drift outside the local harness.
- Files: `src/storage/d1/index.ts`, `migrations/0001_protocol_kernel.sql`, `test/http/d1-http.test.ts`, `test/integration/x402-d1-http.test.ts`
- Risk: One-use greenlight consumption, idempotency, and receipt indexing can degrade if provider conflict behavior differs from local test assumptions.
- Priority: Medium

**Hosted raw-read audit persistence implementations:**
- What's not tested: A production-grade durable audit sink implementation, audit retention/export policy, and raw-read audit search/readback.
- Files: `src/http/handlers/raw-read-audit.ts`, `src/http/handlers/internal-record-read.ts`, `src/http/app-options.ts`, `test/http/http.test.ts`
- Risk: Hosted deployments can satisfy fail-closed sink wiring while still producing audit records that are hard to reconstruct or export.
- Priority: Medium

**Live host containment evidence:**
- What's not tested: A real host adapter transcript proving dispatch interception, raw sibling refusal, dynamic-tool refusal, and truncated-graph refusal for the named host.
- Files: `scripts/check-host-generated-code-containment.mjs`, `scripts/build-host-generated-code-containment-transcript.mjs`, `src/surfaces/proof-packets/product-completion.ts`, `test/adapters/x402-protected-tool-codex-activation.test.ts`
- Risk: Local activation/readiness evidence can be mistaken for containment without live host transcript proof.
- Priority: High

---

*Concerns audit: 2026-05-26*
