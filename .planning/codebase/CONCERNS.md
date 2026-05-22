# Codebase Concerns

**Analysis Date:** 2026-05-22

## Tech Debt

**Product claim boundary is narrower than the available product vocabulary:**
- Issue: The source proves a local protocol kernel, D1/HTTP reference path, runtime ingress evidence for installed lanes, and one buyer-side x402 `exact` per-call gateway path. It does not prove hosted operation, provider-side enforcement, broad agent governance, generic runtime/MCP interception, live package-material attestation, aggregate spend-window enforcement, cross-org certificate trust, seller middleware, facilitator operation, or broad x402 scheme support.
- Files: `README.md`, `AGENTS.md`, `docs/internal/decisions.md`, `docs/internal/protocol-definition.md`, `docs/internal/protocol-kernel-architecture.md`, `docs/internal/protocol-notes.md`, `examples/x402-protected-spend/README.md`
- Impact: Public docs, roadmap items, examples, or package surfaces can overclaim beyond the exact contract -> policy -> one-use greenlight -> gateway check -> receipt/refusal/proof-gap chain that the source enforces.
- Fix approach: Keep claims tied to installed paths and explicit non-claims. Any new claim must add source-owned enforcement, invariant tests, package-surface posture tests, and docs updates in the canonical files above.

**Root SDK client exposes an all-role transition token fallback:**
- Issue: `HandshakeClient` accepts `transitionToken` and uses it as a fallback for every role when `transitionTokens?.[role]` is missing. That is convenient for local demos, but dangerous if passed into runtime or model-facing code.
- Files: `src/sdk/client.ts`, `src/sdk/surface-clients/runtime-client.ts`, `src/sdk/surface-clients/evidence-client.ts`, `src/sdk/LANE.md`, `test/sdk/role-clients.test.ts`
- Impact: A caller can accidentally hand ambient transition authority to code that should only have runtime-observer or evidence-reader capability.
- Fix approach: Prefer role-scoped clients for model/runtime-facing integrations. Keep the fallback out of public examples and consider deprecating it once all first-party callers use `transitionTokens` or role-scoped clients.

**MCP is source-owned but intentionally not a package authority surface:**
- Issue: The MCP lane has a source-owned catalog and strict x402 proposal schema, but it is not exported from `package.json` and it does not start a server process, evaluate policy, greenlight, gate, sign, pay, mint authority, or write receipts.
- Files: `src/mcp/LANE.md`, `src/mcp/index.ts`, `src/mcp/x402-proposal.ts`, `package.json`, `test/architecture/mcp-surface-posture.test.ts`, `test/architecture/root-exports.test.ts`, `test/mcp/mcp-schema-contract.test.ts`
- Impact: Treating MCP as an installed authority surface would turn a proposal helper into an enforcement claim. This is advisory until an actual gateway-bound MCP host exists.
- Fix approach: Keep MCP off root exports and package subpath exports until there is a process boundary, credential posture, exact gateway binding, and receipt path for any mutation-capable tool.

**Runtime ingress evidence is not universal host interception:**
- Issue: Runtime ingress can normalize and refuse known dispatch families, but the canonical docs explicitly limit it to installed lanes. It cannot prove every raw sibling tool path in the host was intercepted.
- Files: `src/runtime/ingress/index.ts`, `src/runtime/LANE.md`, `docs/internal/protocol-notes.md`, `docs/internal/protocol-kernel-architecture.md`, `test/runtime/runtime-ingress.test.ts`, `test/architecture/surface-boundary-posture.test.ts`
- Impact: Claims that Handshake controls arbitrary browser, shell, MCP, package-manager, cloud, or network actions are false unless those paths are wrapped and gateway-bound.
- Fix approach: For each runtime adapter, define the tool catalog, action catalog, raw/sibling bypass posture, protected mutation path, and evidence outcome before claiming control.

**Spend-window policy is metadata, not enforcement:**
- Issue: x402 install proposals store session/day/review spend limits, but `spendWindowEnforcementStatus` is `not_enforced_tier1_metadata`; runtime x402 checks enforce per-call atomic amount only.
- Files: `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `docs/internal/decisions.md`, `README.md`, `examples/x402-protected-spend/README.md`, `test/integration/x402-d1-http.test.ts`
- Impact: A product claim about session budgets, daily budgets, review-window budgets, or aggregate spend control would exceed source-owned enforcement.
- Fix approach: Add a spend reservation ledger with atomic reserve/commit/release transitions before claiming aggregate budget enforcement.

**Generic adapter conformance is too small for provider-grade certification:**
- Issue: The conformance probe only checks that a fixture does not mutate without a verified gateway check. It does not exercise real provider auth, lifecycle hooks, retry behavior, delayed side effects, network side channels, package-manager behavior, or browser/client-side bypass.
- Files: `src/conformance/index.ts`, `src/adapters/x402-payment/bypass-probes.ts`, `test/conformance/protected-mutation-adapter-conformance.test.ts`, `test/adapters/x402-bypass-probes.test.ts`
- Impact: Passing conformance proves a narrow fixture posture, not that an external adapter is safe to certify.
- Fix approach: Keep "certification" language out of public claims until conformance includes provider-specific hostile probes and gateway-owned credential custody checks.

## Known Bugs

**MCP x402 proposal uses caller-supplied idempotency keys:**
- Symptoms: The MCP x402 proposal path accepts `idempotencyKey` directly from the tool caller and places it into the candidate action contract. The idempotency ledger treats a changed idempotency key as a different attempt even when the protected resource and payment parameters are the same.
- Files: `src/mcp/x402-proposal.ts`, `src/protocol/areas/idempotency-ledger/entries.ts`, `test/mcp/mcp-x402-proposal.test.ts`, `test/mcp/mcp-schema-contract.test.ts`
- Trigger: A model or tool caller proposes the same x402 payment twice with a different `idempotencyKey`.
- Workaround: Do not expose MCP x402 proposal as an authority path. Treat it as a proposal-only surface until idempotency is derived from stable payment/request material or validated against a server-owned key derivation rule.

**Gateway and storage conflict classification depends on SQLite/D1 error text:**
- Symptoms: Storage conflict helpers inspect `error.message` strings to detect stream conflicts, duplicate terminal recovery outcomes, and pointer/constraint failures.
- Files: `src/storage/d1/index.ts`, `test/http/d1-http.test.ts`, `test/protocol/protocol-store-atomicity-contract.test.ts`, `migrations/0001_protocol_kernel.sql`
- Trigger: D1 or SQLite changes constraint error wording, table names, or driver message formats.
- Workaround: Keep D1 conflict tests in the required gate and prefer structured error codes or explicit preflight reads where the storage driver supports them.

**Certificate creation is kernel-level but not an HTTP authority route:**
- Symptoms: Authority certificate creation exists in the protocol kernel, while HTTP route registration exposes certificate verification/read-style paths but not a create route.
- Files: `src/protocol/kernel.ts`, `src/protocol/areas/authority-certificate/inputs.ts`, `src/protocol/areas/authority-certificate/verify.ts`, `src/http/routes/transition-route-registry.ts`, `src/http/app.ts`, `src/cli/certificate.ts`
- Trigger: Product copy or examples imply hosted certificate minting through the HTTP surface.
- Workaround: Keep certificate creation described as local/kernel-level unless an HTTP route with signer custody, tenant scope, and hosted verifier checks is added.

## Security Considerations

**Local caller auth is role-token auth, not tenant-scoped authorization:**
- Risk: In local mode, bearer tokens map to coarse roles. Tenant and organization scope checks apply when `hostedIdentity` exists, but local token auth does not bind every request to tenant/org scope.
- Files: `src/http/admission/caller-auth.ts`, `src/http/admission/hosted-caller-identity.ts`, `src/http/admission/index.ts`, `src/http/app.ts`, `src/http/handlers/internal-record-read.ts`, `test/http/http.test.ts`
- Current mitigation: Hosted identity verifier schemas include tenant/org, custody, scope, and freshness fields. Local docs keep the path framed as local foundation.
- Recommendations: Do not use local role-token mode for hosted or multi-tenant claims. Keep hosted mode mandatory for tenant/org-scoped deployments and add tests that prove local tokens cannot be mistaken for hosted identity.

**Internal raw record reads can expose audit-readable custody evidence to control-plane callers:**
- Risk: `control_plane` callers can read raw records unless an object registry entry is `internal_only`. Credential reference and credential resolution evidence objects are `audit_read`, so local control-plane tokens can retrieve diagnostic custody evidence.
- Files: `src/http/handlers/internal-record-read.ts`, `src/protocol/areas/object-registry/index.ts`, `src/protocol/areas/credential-custody/schemas.ts`, `test/http/http.test.ts`, `test/protocol/object-registry.test.ts`
- Current mitigation: Credential schemas reject obvious raw secret patterns and evidence uses references/digests rather than provider payloads.
- Recommendations: Treat raw record read as diagnostic, not operator-facing. For hosted use, require scoped hosted identity and review whether custody evidence should become redacted projection-only rather than raw-record readable.

**Credential redaction is heuristic and typed, not provider-grade secret lifecycle:**
- Risk: `CredentialSafeStringSchema` rejects obvious secret-like strings, but provider-specific credential formats, nested payloads, encoded secrets, and future x402/provider signatures can bypass simple pattern checks.
- Files: `src/protocol/areas/credential-custody/schemas.ts`, `src/protocol/areas/credential-custody/transitions.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `docs/internal/protocol-notes.md`, `test/protocol/credential-custody.test.ts`
- Current mitigation: The official x402 wallet gateway keeps raw `PaymentPayload` and `PAYMENT-SIGNATURE` creation inside the gateway-held signing surface and stores refs/digests.
- Recommendations: Add provider-specific fuzz tests, encoded secret tests, and gateway custody fixtures before claiming provider-grade secret lifecycle or vault-backed custody.

**Authority certificate signing material is a dangerous local primitive if surfaced incorrectly:**
- Risk: Certificate creation accepts signer material such as PKCS8 private keys or dev HMAC secrets. Verification rejects dev HMAC unless explicitly allowed, but an HTTP or MCP minting route would create a custody problem.
- Files: `src/protocol/areas/authority-certificate/inputs.ts`, `src/protocol/areas/authority-certificate/transitions.ts`, `src/protocol/areas/authority-certificate/verify.ts`, `src/protocol/kernel.ts`, `test/protocol/authority-certificate.test.ts`
- Current mitigation: The public HTTP surface does not expose certificate creation and CLI only verifies supplied terminal certificates.
- Recommendations: Keep certificate minting out of model-facing and HTTP-facing surfaces until signer custody has a gateway-owned key store and scoped issuance policy.

**Package exports intentionally hide mutation-capable experimental surfaces:**
- Risk: `src/experimental.ts` exports reference gateway fixtures, including x402 wallet-gateway helpers, while `package.json` does not expose mutation-capable MCP/CLI subpaths. Incorrect package export changes could make internal authority helpers public.
- Files: `package.json`, `src/experimental.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `test/architecture/root-exports.test.ts`, `test/architecture/import-posture.test.ts`, `scripts/check-package-surface.mjs`
- Current mitigation: Architecture tests require curated root exports and prevent MCP from becoming a package export.
- Recommendations: Treat package export changes as authority-surface changes. Run `npm run quality:architecture` and `npm run check:pack` after any package metadata edit.

## Performance Bottlenecks

**Evidence projections use tenant-wide scans and per-event reads:**
- Problem: Receipt timelines and action envelopes list all records by object type in tenant/org scope, then filter in memory by action contract. Stream event loading loops over offsets and calls `getStreamEvent` one event at a time.
- Files: `src/http/handlers/evidence-read.ts`, `src/storage/d1/index.ts`, `src/protocol/evidence-projections/projections.ts`, `migrations/0001_protocol_kernel.sql`, `test/http/http.test.ts`
- Cause: Storage exposes broad `listRecordsByType` and offset readers rather than action-contract, receipt, and stream-range indexes.
- Improvement path: Add paginated/indexed readers keyed by `tenantId`, `organizationId`, `actionContractId`, `receiptId`, and stream offset range before using evidence projections for high-volume tenants.

**Runtime graph and JSON parsing can consume work before refusal:**
- Problem: HTTP parsing accepts JSON bodies without a source-owned request-size cap. Runtime dispatch blocks and generated execution graph inputs allow unbounded array lengths and string lengths at schema parse time.
- Files: `src/http/app.ts`, `src/runtime/ingress/index.ts`, `src/protocol/areas/generated-execution-graph/inputs.ts`, `src/protocol/areas/generated-execution-graph/coverage.ts`, `src/protocol/foundation/canonical.ts`, `src/protocol/foundation/schema-core.ts`
- Cause: Limits are applied as protocol coverage/refusal metadata after parsing and digesting, not consistently as ingress parser caps.
- Improvement path: Add request-size limits, schema `.max(...)` limits for dispatch arrays and graph arrays, and early refusal tests for oversized runtime evidence.

**Canonicalization recursively stringifies arbitrary JSON-shaped protocol data:**
- Problem: Canonicalization sorts and serializes nested JSON values. Deep or wide caller-provided metadata can increase CPU and memory before a protocol refusal is emitted.
- Files: `src/protocol/foundation/canonical.ts`, `src/protocol/foundation/schema-core.ts`, `src/runtime/ingress/index.ts`, `src/protocol/areas/generated-execution-graph/coverage.ts`, `test/protocol/canonical.test.ts`
- Cause: Recursive `JsonValueSchema` and canonical byte-size checks do not enforce uniform depth and width limits at every external boundary.
- Improvement path: Introduce shared bounded JSON schemas for external caller metadata and verify depth/width rejection before canonicalization.

## Fragile Areas

**Large protocol and runtime files concentrate unrelated invariants:**
- Files: `src/runtime/ingress/index.ts`, `src/protocol/areas/action-attempt-lifecycle/matrix.ts`, `src/protocol/evidence-projections/projections.ts`, `src/mcp/x402-proposal.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `src/surfaces/boundary-manifest.ts`, `src/protocol/areas/credential-custody/transitions.ts`
- Why fragile: These files combine schema normalization, refusal logic, evidence shaping, digesting, and policy boundary semantics. Small edits can change source-owned product claims.
- Safe modification: Treat each edit as an invariant change. Add or update architecture posture tests and protocol invariant tests in the same patch.
- Test coverage: Coverage exists, but it is distributed across `test/runtime`, `test/protocol`, `test/http`, `test/mcp`, `test/adapters`, and `test/architecture`; missing one suite can miss claim drift.

**Surface boundary manifest is central source-owned doctrine:**
- Files: `src/surfaces/boundary-manifest.ts`, `src/surfaces/LANE.md`, `test/architecture/surface-boundary-posture.test.ts`, `test/architecture/root-exports.test.ts`, `test/architecture/claim-boundary.test.ts`
- Why fragile: The manifest defines active/deferred surfaces, forbidden route families, forbidden imports, forbidden credential shapes, and allowed claim labels. It is both source guardrail and product-claim evidence.
- Safe modification: Any new surface must add a manifest entry, lane doc, package export decision, root-export test, claim-boundary test, and README/docs wording.
- Test coverage: Tests catch many forbidden route/import/export shapes, but they do not prove live runtime host interception or provider custody.

**HTTP route registry is an authority boundary:**
- Files: `src/http/routes/transition-route-registry.ts`, `src/http/app.ts`, `src/http/admission/index.ts`, `src/http/handlers/internal-record-read.ts`, `test/http/http.test.ts`, `test/http/d1-http.test.ts`, `test/architecture/import-posture.test.ts`
- Why fragile: Adding a route can silently turn a local kernel transition into a remote authority surface.
- Safe modification: For any new route, specify caller role, hosted identity scope, object registry posture, receipt/proof-gap behavior, and whether the route is diagnostic or authority-bearing.
- Test coverage: Route registry tests exist, but new route families need product-claim tests and import-posture tests.

**x402 official signing path is narrow and easy to overgeneralize:**
- Files: `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/upstream-evidence.ts`, `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `test/integration/x402-d1-http.test.ts`, `test/adapters/x402-bypass-probes.test.ts`
- Why fragile: The official path is buyer-side `exact`, V2 PaymentRequired, gateway-held signing after `VerifiedGatewayCheck`, and digest/ref evidence only. Unsupported schemes, `upto`, batch settlement, seller middleware, facilitator custody, and aggregate budgets are non-claims.
- Safe modification: Reject unsupported x402 variants explicitly and record proof gaps rather than adding partial support through permissive parsing.
- Test coverage: Local hostile probes exist, but no live facilitator/seller/provider custody tests exist.

**`.planning/` is scratch but may look canonical to agents:**
- Files: `.planning/codebase/CONCERNS.md`, `AGENTS.md`, `STRUCTURE.md`, `docs/internal/decisions.md`, `docs/internal/protocol-notes.md`
- Why fragile: Mapper output is useful context, but repository doctrine says `.planning/` must not become repo-facing source paths, scripts, CI names, exported symbols, or canonical docs.
- Safe modification: Use `.planning/` only to inform next work. Promote durable decisions into tracked canonical docs only after source/tests support them.
- Test coverage: `scripts/check-package-surface.mjs` blocks `.planning/` from package output, but it cannot stop agents from copying scratch claims into public copy.

## Scaling Limits

**Receipt store reads scale poorly with action volume:**
- Current capacity: Suitable for local and small D1-backed reference flows where record counts remain low.
- Limit: Tenant-wide `listRecordsByType` projections degrade as policy decisions, greenlights, gate attempts, receipts, proof gaps, and reconciliations accumulate.
- Scaling path: Add query-level indexes and paginated projection APIs before positioning receipt reconstruction for high-volume hosted tenants.

**Spend control is per-call only:**
- Current capacity: One x402 `exact` payment call can be bounded by `maxAtomicAmountPerCall` and exact gateway binding.
- Limit: Session, day, review-window, and org-level budgets are recorded as metadata, not enforced reservations.
- Scaling path: Implement a spend ledger with atomic reservation, commit, rollback, and reconciliation records keyed by tenant/org/principal/wallet/action class.

**Runtime ingress catalog coverage is limited to known dispatch families:**
- Current capacity: x402 payment dispatch and package install dispatch families have source-owned normalization and refusal behavior.
- Limit: Browser-side tools, shell commands, network calls, cloud APIs, generic MCP tools, repository writes, and deploy systems are not automatically covered.
- Scaling path: Add one protected action family at a time with tool catalog, action catalog, gateway registry, raw bypass posture, and conformance probes.

**Local D1/HTTP foundation is not hosted control-plane operation:**
- Current capacity: Local D1/HTTP reference kernel with hosted identity verifier types and placeholder Worker config.
- Limit: Live tenant provisioning, key rotation, JWKS/revocation, hosted verifier operation, provider custody, and operational monitoring are not implemented as a hosted product.
- Scaling path: Treat hosted operation as a separate foundation phase with custody, identity, tenant isolation, migration, and observability tests.

## Dependencies at Risk

**x402 package APIs and header formats:**
- Risk: The official wallet gateway and upstream evidence parser depend on `@x402/core`, `@x402/evm`, `@x402/fetch`, exact V2 PaymentRequired shape, and `PAYMENT-SIGNATURE` handling.
- Impact: Upstream package or spec drift can break exact binding, selected-requirement digesting, or official payment payload creation.
- Migration plan: Keep unsupported versions refusing closed. Add compatibility fixtures for every supported x402 version/scheme before broadening support.

**Cloudflare Worker and D1 runtime behavior:**
- Risk: D1 storage semantics, SQLite conflict messages, Worker request behavior, and `wrangler.toml` bindings are part of the reference path.
- Impact: Storage conflict detection, stream uniqueness, route behavior, and local-to-Worker parity can drift.
- Migration plan: Add D1 integration checks for conflict classes, route auth, and receipt reconstruction whenever Worker/D1 dependencies change.

**Bun runtime and TypeScript package surface:**
- Risk: Scripts and gates assume Bun-based test/build behavior while package checks also use Node scripts.
- Impact: Runtime differences can hide type/export/package-surface issues across `bun test`, `tsc`, and npm pack output.
- Migration plan: Keep `npm run check:repo`, `npm run quality:architecture`, and `npm run check:pack` as required package-surface gates.

## Missing Critical Features

**Hosted authority control plane:**
- Problem: Source includes hosted identity verifier types, but not a complete hosted deployment with live tenant provisioning, key rotation, hosted verifier, revocation, custody, and operational monitoring.
- Blocks: Claims about hosted Handshake operation, managed enforcement, or cross-organization production trust.
- Files: `src/http/admission/hosted-caller-identity.ts`, `src/worker.ts`, `wrangler.toml`, `README.md`, `docs/internal/decisions.md`

**Provider-grade credential custody:**
- Problem: Credential custody uses refs/digests and redaction heuristics, but not a live vault/key-management lifecycle.
- Blocks: Claims about provider-owned wallet custody, hosted signer custody, automatic secret lifecycle, and production certificate minting.
- Files: `src/protocol/areas/credential-custody/schemas.ts`, `src/protocol/areas/credential-custody/transitions.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `src/protocol/areas/authority-certificate/inputs.ts`

**Broad runtime and tool interception:**
- Problem: Runtime ingress is an evidence/compilation lane, not a universal wrapper around host tool execution.
- Blocks: Claims that Handshake governs arbitrary agent tool calls, browser tools, shell commands, network calls, MCP operations, repo writes, package manager calls, cloud APIs, or deploy systems.
- Files: `src/runtime/ingress/index.ts`, `src/runtime/LANE.md`, `docs/internal/protocol-notes.md`, `src/surfaces/boundary-manifest.ts`

**MCP/CLI mutation tools:**
- Problem: CLI and MCP surfaces are read/proposal/conformance surfaces only. They do not perform authority-bearing mutation.
- Blocks: Claims that MCP clients or CLI commands can currently execute protected mutations through Handshake.
- Files: `src/cli/LANE.md`, `src/cli/index.ts`, `src/mcp/LANE.md`, `src/mcp/catalog.ts`, `src/mcp/x402-proposal.ts`, `test/architecture/cli-command-posture.test.ts`, `test/architecture/mcp-surface-posture.test.ts`

**x402 seller/facilitator/aggregate support:**
- Problem: The source-owned x402 path is buyer-side `exact` signing after gateway verification.
- Blocks: Claims about seller middleware, facilitator custody, `upto`, batch settlement, aggregate spend windows, or broad x402 compatibility.
- Files: `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/upstream-evidence.ts`, `src/adapters/x402-payment/install-proposal.ts`, `README.md`, `examples/x402-protected-spend/README.md`

## Test Coverage Gaps

**MCP idempotency drift:**
- What's not tested: Duplicate x402 proposals for the same payment/request material with changed caller-supplied `idempotencyKey`.
- Files: `src/mcp/x402-proposal.ts`, `src/protocol/areas/idempotency-ledger/entries.ts`, `test/mcp/mcp-x402-proposal.test.ts`
- Risk: A model-facing MCP caller can create fresh proposed contracts for the same underlying spend by varying the idempotency key.
- Priority: High

**Oversized runtime and HTTP payloads:**
- What's not tested: Early rejection of large JSON bodies, deeply nested metadata, very large dispatch arrays, and huge generated execution graphs before canonicalization/digesting.
- Files: `src/http/app.ts`, `src/runtime/ingress/index.ts`, `src/protocol/areas/generated-execution-graph/inputs.ts`, `src/protocol/foundation/canonical.ts`, `test/runtime/runtime-ingress.test.ts`, `test/http/http.test.ts`
- Risk: Malicious or accidental large inputs can consume CPU and memory before a protocol refusal is produced.
- Priority: High

**Provider-specific credential fuzzing:**
- What's not tested: Encoded secrets, unfamiliar provider key formats, nested wallet payloads, certificate material variants, and future x402 signature formats against `CredentialSafeStringSchema`.
- Files: `src/protocol/areas/credential-custody/schemas.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `src/protocol/areas/authority-certificate/inputs.ts`, `test/protocol/credential-custody.test.ts`
- Risk: Custody evidence can accidentally store secret-bearing strings that pass heuristic redaction.
- Priority: High

**Hosted authorization scope boundaries:**
- What's not tested: Full hosted-vs-local tenant/org isolation across every transition route and evidence route under realistic hosted identity claims.
- Files: `src/http/admission/index.ts`, `src/http/app.ts`, `src/http/handlers/evidence-read.ts`, `src/http/handlers/internal-record-read.ts`, `test/http/http.test.ts`, `test/http/d1-http.test.ts`
- Risk: A route can appear tenant-scoped in hosted mode while remaining globally readable or writable under local token assumptions.
- Priority: Medium

**Evidence projection pagination and scale:**
- What's not tested: Large receipt stores, high stream offsets, paginated action timelines, and action-contract-indexed reads.
- Files: `src/http/handlers/evidence-read.ts`, `src/storage/d1/index.ts`, `src/protocol/evidence-projections/projections.ts`, `test/http/http.test.ts`
- Risk: Reconstruction paths can become slow or memory-heavy exactly when audit volume matters.
- Priority: Medium

**Live x402 provider/facilitator behavior:**
- What's not tested: Live provider PaymentRequired variations, facilitator responses, seller middleware, network failures, replay behavior, delayed settlement, and unsupported scheme drift.
- Files: `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/upstream-evidence.ts`, `test/integration/x402-d1-http.test.ts`, `test/adapters/x402-bypass-probes.test.ts`
- Risk: Local exact-path proof can be mistaken for production x402 compatibility.
- Priority: Medium

**Spend-window ledger enforcement:**
- What's not tested: Atomic reservation, commit, release, retry, concurrent spend attempts, daily/session/review-window depletion, and proof-gap reconciliation for aggregate budgets.
- Files: `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `test/integration/x402-d1-http.test.ts`
- Risk: Aggregate spend claims can emerge before the ledger exists.
- Priority: High

---

*Concerns audit: 2026-05-22*
