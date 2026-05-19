# Codebase Concerns

**Analysis Date:** 2026-05-19

## Risk Posture

This checkout is a credible Tier 1 protocol-kernel/reference-fixture baseline. The strongest current protections are exact contract binding, one-use greenlight consumption, gateway-side checks, protected-path posture evaluation, proof-gap recording, isolation, and recovery state. The major risks are claim drift and adoption drift: the source proves local protocol behavior and reference gateway fixtures, while strategy docs define Tier 2 self-hosted activation, Tier 3 hosted operation, and Tier 4 ecosystem/provider integration that are not implemented in this repo.

Grounding:
- Kernel/canon: `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/decisions.md`, `docs/internal/protocol-definition.md`, `docs/internal/protocol-kernel-architecture.md`, `docs/internal/protocol-notes.md`.
- Tier doctrine: `.planning/strategy/tiered-product-doctrine.md`, `.planning/strategy/tier-1-closeout.md`, `.planning/strategy/tier-3-strategy-findings.md`.
- Runtime hardening pressure: `.planning/strategy/0.3.0-agent-runtime-source-study.md`, `.planning/strategy/tier-2-meta-requirements.md`.

## Tech Debt

**Durable refusal model is incomplete:**
- Issue: `RefusalSchema` exists and `test/protocol/refusal-format.test.ts` validates the portable format, but `refusal` is not a `ProtocolObjectType`, is not present in `ProtocolRecordSchema`, and is not in `protocolObjectRegistry`. Actual refusals are encoded inside `IntentCompilationRecord.candidateAction.refusalReasonCodes`, `PolicyDecision`, `GatewayCheckAttempt`, and HTTP error envelopes.
- Files: `src/protocol/areas/refusal/schemas.ts`, `src/protocol/areas/object-registry/schemas.ts`, `src/protocol/areas/object-registry/index.ts`, `src/protocol/areas/intent-compilation/schemas.ts`, `src/protocol/areas/gateway-gate/artifacts.ts`, `src/http/errors/transition-error-envelope.ts`, `test/protocol/refusal-format.test.ts`.
- Impact: The docs say refusal is first-class evidence, but the store cannot query a uniform refusal record by phase, object refs, authority-created flag, or mutation-attempted flag. Tier 2 receipt/refusal timelines and Tier 3 refusal/proof-gap queues would need ad hoc joins across several record shapes.
- Fix approach: Either add `refusal` to `ProtocolObjectTypeSchema` with commit helpers/events for compiler, policy, review, gateway, receipt-export, and recovery refusals, or narrow claims to "refusal reason evidence is embedded in transition records."

**Tier 2 activation surface is not present:**
- Issue: Tier 2 requires a self-hostable protected action loop with CLI or MCP proposal surface, local policy file, local receipt store, readable contract output, receipt/refusal/proof-gap timeline, install health, and conformance. The repo contains a private package, HTTP/SDK surfaces, runtime helpers, tests, and reference gateways, but no `bin`, CLI setup, MCP broker, policy-file loader, contract viewer, receipt timeline, or install-health surface.
- Files: `package.json`, `src/sdk/client.ts`, `src/http/app.ts`, `src/runtime/LANE.md`, `src/adapters/LANE.md`, `.planning/strategy/tiered-product-doctrine.md`, `.planning/strategy/tier-2-meta-requirements.md`.
- Impact: A developer cannot reach the Tier 2 golden path from product surfaces alone. They must stitch together tests and fixtures, which weakens activation and makes Tier 3 hosted operation tempting before the local primitive is obvious.
- Fix approach: Build one installable golden path around one protected action: proposal surface, deterministic policy config, gateway-owned mutation authority, local receipt timeline, and hostile conformance cases.

**Preview deploy product proof is split across paths:**
- Issue: Tier doctrine names preview deploy as the first wedge, and `src/runtime/preview-deploy/action-proposal.ts` plus `src/adapters/preview-deploy/gateway.ts` prove a standalone local fixture. The codemode multi-action runner only accepts `package.install` and `repo.write`.
- Files: `.planning/strategy/tiered-product-doctrine.md`, `src/runtime/preview-deploy/action-proposal.ts`, `src/adapters/preview-deploy/gateway.ts`, `src/runtime/codemode-multi-action/generated-program-runner.ts`, `test/adapters/preview-deploy-gateway.test.ts`, `test/runtime/codemode-multi-action-runtime.test.ts`.
- Impact: The generated-program proof lane does not exercise the declared first wedge. This keeps "preview deploy" buyer language and "codemode multi-action" implementation proof slightly divergent.
- Fix approach: Add `preview_deploy.create` to the generated-program/action-group path or explicitly define the first preview-deploy path as MCP/tool-dispatcher-only and keep codemode as secondary proof.

**Raw-read posture is metadata, not enforcement:**
- Issue: `protocolObjectRegistry` classifies objects as `control_plane_read`, `audit_read`, or `internal_only`, but `handleInternalRecordRead` accepts any `ProtocolObjectType` and returns the raw record to any caller with `control_plane` bearer custody.
- Files: `src/protocol/areas/object-registry/index.ts`, `src/http/handlers/internal-record-read.ts`, `src/http/app.ts`, `test/http/http.test.ts`.
- Impact: This is acceptable as an internal diagnostic seam, but it is unsafe to promote to Tier 3 audit/search without enforcing redaction, tenant scope, and raw-read posture. `contract_stream_event` and `transition_request_context` are marked internal but are retrievable through the internal route.
- Fix approach: Enforce `rawReadPosture` in handlers, add scoped audit projections, and keep raw internal reads behind explicit local/admin-only admission.

**Idempotency is recorded but not a duplicate-authority ledger:**
- Issue: A greenlight is one-use per `greenlightId`, and active protected-surface operation claims block concurrent operations by gateway/action/resource. There is no store index that prevents a second action contract with the same idempotency key, resource, and params from receiving a new greenlight after the first operation reaches terminal state.
- Files: `src/protocol/areas/policy-greenlight/guards.ts`, `src/protocol/areas/operation-lifecycle/claims.ts`, `src/protocol/store/port.ts`, `migrations/0001_protocol_kernel.sql`, `test/protocol/kernel-operation-lifecycle.test.ts`.
- Impact: One-use greenlight replay is protected, but retry/idempotency semantics across newly minted contracts are not fully enforced by the protocol store. A real Tier 2 gateway must not treat this as complete double-mutation protection.
- Fix approach: Add an idempotency/operation ledger keyed by tenant, org, gateway, action class, resource, params digest, and idempotency key, with explicit retry/reuse/refusal semantics.

## Known Bugs

**D1 and memory stores disagree on `putRecordIfAbsentOrSame` result semantics:**
- Symptoms: `InMemoryProtocolStore.putRecordIfAbsentOrSame` returns `inserted` for a new record. `D1ProtocolStore.putRecordIfAbsentOrSame` uses `INSERT OR IGNORE`, then reads the record and returns `unchanged` whenever the digest matches, including the inserted case.
- Files: `src/storage/memory/index.ts`, `src/storage/d1/index.ts`, `src/protocol/store/port.ts`, `src/protocol/events/records.ts`.
- Trigger: Call `putRecordIfAbsentOrSame` against an empty D1 store with a valid record.
- Workaround: Current callers treat non-conflict as success, so the mismatch does not break the observed transition path.
- Fix approach: Return `inserted` from D1 when the insert actually changes the table, or remove `inserted` from the interface if callers must not depend on it.

**Adapter failure evidence erases provider error detail:**
- Symptoms: Reference gateways catch all mutation-surface errors and record generic failed evidence refs such as `evidence:package-install-failed:*`, `evidence:repo-write-failed:*`, or `evidence:preview-deploy-failed:*`.
- Files: `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, `src/adapters/preview-deploy/gateway.ts`.
- Trigger: A mutation surface throws after `VerifiedGatewayCheck`.
- Workaround: The adapters still reconcile a failed downstream status and do not hide the failure as success.
- Fix approach: Use typed downstream errors that preserve retryability, provider operation refs, redacted diagnostics, and evidence refs without leaking secrets.

## Security Considerations

**Protected-path posture is caller-reported, not probed:**
- Risk: `createProtectedPathPosture` records `postureState`, `credentialCustodyStatus`, `rawSiblingToolStatus`, and `sourceAuthority` from input. The evaluator rejects weak posture, but the repo does not implement gateway credential custody probes, raw credential scans, sibling CLI/API checks, MCP direct-call checks, or wrapper installation checks.
- Files: `src/protocol/areas/protected-path-posture/inputs.ts`, `src/protocol/areas/protected-path-posture/transitions.ts`, `src/protocol/areas/protected-path-posture/schemas.ts`, `.planning/strategy/0.3.0-agent-runtime-source-study.md`, `.planning/strategy/tier-2-meta-requirements.md`.
- Current mitigation: Policy and gateway evaluation require fresh `gateway_checked` posture from acceptable source authorities and reject present/unknown raw sibling tools.
- Recommendations: Add posture probe modules and hostile tests for raw credential reachability, direct MCP calls, shell/browser sibling paths, gateway policy drift, and wrapper installation.

**Hosted admission is a seam, not org auth:**
- Risk: Local mode uses role-scoped bearer tokens. Hosted mode delegates to an injected `HostedCallerVerifier`, validates role/freshness/scope, and records identity evidence, but this repo does not implement orgs, projects, roles, revocation lookup, tenant policy administration, or audit-reader authorization.
- Files: `src/http/admission/caller-auth.ts`, `src/http/admission/hosted-caller-identity.ts`, `src/http/admission/index.ts`, `src/http/routes/transition-scope-resolvers.ts`, `docs/internal/decisions.md`.
- Current mitigation: Missing local tokens fail closed, hosted mode requires a verifier, and transition scope mismatch is hidden as not found for record-scoped routes.
- Recommendations: Keep this as transport custody until Tier 3 adds real org RBAC, revocation, reader roles, tenant-scoped audit projections, and token/key rotation.

**Signatures are optional and not a portable verification model:**
- Risk: `ActionContract.contractSignature` and `PolicyDecision.decisionSignature` are optional HMACs. Gateway checks rely on stored digests and records; they do not verify signatures from an external trust root.
- Files: `src/protocol/areas/action-contract/contract-record.ts`, `src/protocol/areas/action-contract/schemas.ts`, `src/protocol/areas/policy-greenlight/policy-record/index.ts`, `src/protocol/areas/policy-greenlight/schemas.ts`, `src/protocol/foundation/canonical.ts`.
- Current mitigation: Canonical digests bind records inside the store, and HMAC support exists for local signing.
- Recommendations: Treat HMACs as local integrity helpers only. Tier 4 cross-org receipt verification needs explicit key identity, signature verification, rotation, revocation, and verifier policy.

**Reference package install contracts under-specify production package consequence:**
- Risk: `package.install` fixtures bind package name and version range, but production package installs also depend on package manager, registry, resolved tarball integrity, transitive dependency graph, lifecycle scripts, lockfile behavior, workspace scope, and install flags.
- Files: `src/runtime/package-install/action-proposal.ts`, `src/adapters/package-install/gateway.ts`, `test/runtime/package-install-runtime.test.ts`, `test/adapters/package-install-gateway.test.ts`.
- Current mitigation: The lane explicitly calls this a reference fixture, not provider-side enforcement.
- Recommendations: Do not promote `package.install` beyond fixture status until the exact contract binds package manager, registry, lockfile diff, transitive/install-script posture, and workspace mutation bounds.

## Performance Bottlenecks

**D1 storage is optimized for record reconstruction, not Tier 3 search:**
- Problem: `protocol_records` stores typed payloads as JSON, and `listRecordsByType` returns all rows for an object type/scope. Tier 3 needs search across principals, agents, runs, contracts, gateways, refusals, proof gaps, receipts, drift, and isolation.
- Files: `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `migrations/0001_protocol_kernel.sql`, `.planning/strategy/tiered-product-doctrine.md`, `.planning/strategy/tier-3-strategy-findings.md`.
- Cause: The reference schema has indexes for object type, stream partitions, greenlight consumption, current posture, current operation claims, and receipt-by-mutation. It does not materialize hosted query dimensions or pagination indexes.
- Improvement path: Add read models/materialized indexes for Tier 3 query axes and explicit pagination APIs before building hosted receipt/search/alert surfaces.

**Isolation-state lookup uses JSON extraction:**
- Problem: D1 isolation lookup filters `protocol_records.payload_json` with `json_extract` on `scopeType`, `scopeId`, and `clearedAt`.
- Files: `src/storage/d1/index.ts`, `migrations/0001_protocol_kernel.sql`, `src/protocol/areas/object-registry/index.ts`.
- Cause: Isolation fields are stored only inside JSON payloads, not in a dedicated indexed table.
- Improvement path: Add an `isolation_state_current` index table keyed by tenant, org, scope type, scope id, state, expiry, and cleared status.

**In-memory store is fixture-only and O(n) for core reads:**
- Problem: `InMemoryProtocolStore` scans maps/arrays for `listRecordsByType`, `getStreamTail`, `getStreamEvent`, and `listIsolationStates`.
- Files: `src/storage/memory/index.ts`, `src/storage/LANE.md`.
- Cause: It is an invariant oracle/test fixture, not a production store.
- Improvement path: Keep memory store fixture-only. Do not use it as evidence for production throughput or hosted operation.

## Fragile Areas

**Generated execution evidence is an action-list fixture, not real runtime ingress:**
- Files: `src/runtime/codemode-multi-action/generated-program-runner.ts`, `src/runtime/codemode-multi-action/generated-graph-evidence.ts`, `src/protocol/areas/generated-execution-graph/coverage.ts`, `.planning/strategy/0.3.0-agent-runtime-source-study.md`.
- Why fragile: `buildRuntimeExecutionInput` hardcodes loop/retry/branch/dynamic-tool flags to false, and `CodemodeMultiActionProgramSchema` accepts a simple array of known action objects. Real runtimes stream partial arguments, loop, branch, retry, pause/resume, invoke hosted tools, attach MCP servers, and use browser/shell surfaces.
- Safe modification: Add runtime ingress events, tool-call draft/finalization records, action groups, and MCP broker posture before treating generated execution evidence as production runtime coverage.
- Test coverage: Current tests cover graph refusal and simple sibling refusal in `test/protocol/generated-execution-graph.test.ts` and `test/runtime/codemode-multi-action-runtime.test.ts`, not streamed tool input or real runtime event ingestion.

**Conformance is too narrow for adapter certification:**
- Files: `src/conformance/index.ts`, `src/conformance/LANE.md`, `test/conformance/protected-mutation-adapter-conformance.test.ts`.
- Why fragile: The public conformance helper only checks that a caller-supplied probe does not mutate without a `VerifiedGatewayCheck`. It does not verify parameter binding, credential custody, gateway policy drift handling, provider finality evidence, raw sibling bypass, replay behavior, or idempotency semantics.
- Safe modification: Add one conformance probe per invariant and keep the language as "reference conformance" until external gateways consume it.
- Test coverage: Current conformance tests are local fixture tests, not independent runtime or provider integration evidence.

**Recovery and operation lifecycle are cross-cutting and stateful:**
- Files: `src/protocol/areas/recovery/recommendations.ts`, `src/protocol/areas/recovery/status.ts`, `src/protocol/areas/recovery/terminal/terminal-conflict-resolutions.ts`, `src/protocol/areas/operation-lifecycle/transitions.ts`, `test/protocol/kernel-receipt-recovery.test.ts`, `test/http/d1-http.test.ts`.
- Why fragile: Recovery recommendations, terminal status transitions, proof-gap resolution, operation claims, isolation creation, receipt mutation, and stream events are coordinated across several protocol areas.
- Safe modification: Change recovery only through focused invariant tests plus D1/HTTP slices. Preserve terminal-claim conflict behavior and proof-gap reconstruction.
- Test coverage: Strong local coverage exists, but the D1 and HTTP test files are large (`test/http/d1-http.test.ts`, `test/http/http.test.ts`) and mix many workflows, making targeted future edits harder.

**Review binding records evidence, not a renderer contract:**
- Files: `src/protocol/areas/review-binding/artifacts.ts`, `src/protocol/areas/review-binding/decisions.ts`, `src/protocol/areas/review-binding/schemas.ts`, `test/protocol/kernel-policy-gateway.test.ts`.
- Why fragile: Review artifacts bind digests correctly, but this repo does not implement the json-render-style renderer, component catalog, UI artifact storage, or reviewer authentication semantics.
- Safe modification: Treat review binding as protocol evidence only. Build renderer/catalog guarantees separately and bind rendered artifacts to stored contract/policy digests.
- Test coverage: Tests prove digest binding and review-approved greenlight behavior, not UI correctness or human review custody.

## Tier 2 / Tier 3 / Tier 4 Architecture Risks

**Tier 2 risk - self-hosted proof can be faked by fixtures:**
- Issue: Tier 2 requires agent cannot hold mutation authority, exact contract before authority, local deterministic policy, gateway-owned credential, receipt timeline, bypass posture, and hostile conformance. The current proof lanes are reference fixtures and tests.
- Files: `.planning/strategy/tiered-product-doctrine.md`, `.planning/strategy/tier-2-meta-requirements.md`, `src/runtime/LANE.md`, `src/adapters/LANE.md`, `src/conformance/LANE.md`.
- Impact: A fixture receipt is not a self-hosted protected path. The product must not claim Tier 2 until a real gateway-owned credential or mutation authority exists outside the agent runtime.
- Fix approach: Pick one protected action class and prove the credential cannot be reached through generated code, shell, browser, MCP sibling tool, SDK wrapper, or environment variables.

**Tier 3 risk - Cloud can become hosted receipt search:**
- Issue: Tier 3 strategy requires operated protection posture: protected surface map, protected action plans, simulation, gateway drift monitor, proof-gap queue, remediation queue, conformance library, search, alerts, retention, and org governance. The source has protocol routes, direct record reads, generated graph projection, and receipt export.
- Files: `.planning/strategy/tier-3-strategy-findings.md`, `src/http/routes/transition-route-registry.ts`, `src/http/handlers/internal-record-read.ts`, `src/http/handlers/evidence-read.ts`, `src/sdk/client.ts`.
- Impact: Hosted receipts without surface maps, drift detection, simulation, remediation, and install health are useful but not Tier 3 Handshake. That would be hosted evidence, not operated protection posture.
- Fix approach: Define `ProtectedActionPlan` as the Tier 3 spine and derive read models from existing protocol records before adding dashboard surfaces.

**Tier 3 risk - builder and consumer interfaces are not separated:**
- Issue: Strategy requires separating builder surfaces that define protected surfaces/policies/gateways from consumer/action surfaces that propose candidates, request decisions, and consume greenlights. Current HTTP route roles split custody only into `control_plane`, `runtime_evidence`, `gateway_custody`, and `review_custody`.
- Files: `.planning/strategy/tier-3-strategy-findings.md`, `src/http/admission/caller-auth.ts`, `src/http/routes/transition-route-registry.ts`, `src/http/admission/hosted-caller-identity.ts`.
- Impact: If a future hosted caller can register gateways/policies and consume authority through the same operational interface, it becomes ambient authority wearing a badge.
- Fix approach: Add distinct builder/admin and consumer/action admission models before Tier 3 hosted configuration surfaces.

**Tier 4 risk - ecosystem/certification language has no independent evidence:**
- Issue: Tier 4 includes runtime conformance marks, gateway conformance marks, third-party adapter certification, cross-org receipt verification, provider enforcement attestations, and portable receipt standards. The repo has a source-package conformance helper and optional local HMACs only.
- Files: `.planning/strategy/tiered-product-doctrine.md`, `src/conformance/index.ts`, `src/conformance/LANE.md`, `src/protocol/foundation/canonical.ts`, `docs/internal/decisions.md`.
- Impact: Any ecosystem or certification claim from this source tree would overstate the evidence. There are no independent runtime or gateway integrations in this checkout.
- Fix approach: Keep Tier 4 as future-only until at least one external runtime and one external gateway consume conformance suites and produce independently verifiable receipts.

## Scaling Limits

**Hosted operation has no retention, search, alert, or read-model layer:**
- Current capacity: Direct record reads by object ID, generated graph evidence projection, receipt export, D1 record/event storage.
- Limit: Tier 3 needs durable operated evidence across teams, projects, policies, gateways, refusals, proof gaps, isolation events, and drift.
- Files: `src/http/handlers/internal-record-read.ts`, `src/http/handlers/evidence-read.ts`, `src/storage/d1/index.ts`, `migrations/0001_protocol_kernel.sql`, `.planning/strategy/tiered-product-doctrine.md`.
- Scaling path: Add tenant-scoped read models, retention policy, audit-reader roles, search indexes, alert events, and proof-gap/drift queues.

**Runtime pluralism is represented in docs, not source adapters:**
- Current capacity: Runtime helpers for package install, repo write, preview deploy, and codemode action lists.
- Limit: No adapters ingest Vercel AI SDK, OpenAI Agents SDK, LangGraph/LangSmith, Cloudflare Agents, MCP servers, browser tools, shell commands, or durable workflow resumes.
- Files: `src/runtime/*`, `.planning/strategy/0.3.0-agent-runtime-source-study.md`, `README.md`.
- Scaling path: Add `RuntimeIngressEvent`, `ToolCallDraft`, MCP broker schemas, and one real runtime fixture before expanding protected action families.

**Provider-side enforcement is absent:**
- Current capacity: Reference gateway fixtures for package install, repo write, and preview deploy.
- Limit: No Vercel, Cloudflare, GitHub, npm, cloud, CI, database, or provider-side gateway owns a production mutation credential in this repo.
- Files: `src/adapters/*/gateway.ts`, `src/adapters/LANE.md`, `.planning/strategy/tier-1-closeout.md`, `.planning/strategy/tiered-product-doctrine.md`.
- Scaling path: Keep claims at local/reference proof until a production provider or customer gateway owns the credential and checks the exact greenlight before mutation.

## Dependencies at Risk

**Private package boundary is intentional but blocks public protocol assumptions:**
- Risk: `package.json` is `"private": true`; package export checks validate source-package shape, not public distribution, semver, license, or external support posture.
- Impact: Tier 1 can be a private protocol kernel, but public protocol/package claims require a release-boundary decision.
- Files: `package.json`, `scripts/check-package-surface.mjs`, `docs/internal/decisions.md`, `.planning/strategy/tier-1-closeout.md`.
- Migration plan: Open the release-boundary decision only when publishing, license, support policy, and external package compatibility are intentionally owned.

**Cloudflare D1/Worker shape is a reference deployment, not product hosting proof:**
- Risk: `wrangler.toml` configures D1/KV bindings, and `src/worker.ts` wires `createApp()`, but docs explicitly avoid hosted-operation claims.
- Impact: A deployed Worker would still need real token bindings, DB migration, hosted verifier, tenant RBAC, retention, incident posture, and gateway installation.
- Files: `wrangler.toml`, `src/worker.ts`, `src/http/store/resolution.ts`, `docs/internal/decisions.md`.
- Migration plan: Treat Cloudflare as reference transport/storage until Tier 3 hosted control-plane requirements are implemented.

**KV isolation cache is unused by current authority path:**
- Risk: `KvIsolationCache` exists but no current source path reads it for policy or gateway decisions.
- Impact: Future maintainers could mistake KV for authority-bearing isolation state. Docs say KV is cache only.
- Files: `src/storage/kv/index.ts`, `src/storage/LANE.md`, `docs/internal/protocol-notes.md`.
- Migration plan: Keep D1/store as authority. If KV is wired in later, add tests proving cache misses/stale entries cannot broaden authority.

## Missing Critical Features

**Runtime ingress and finalization barrier:**
- Problem: No `RuntimeIngressEvent`, `ToolCallDraft`, input-finalization barrier, action group model, or durable resume handling exists in source.
- Blocks: Real agent runtimes with streamed tool arguments, loops, retries, branches, nested agents, approvals, browser tools, shell, MCP, or hosted provider tools.
- Files: `.planning/strategy/0.3.0-agent-runtime-source-study.md`, `src/runtime/codemode-multi-action/generated-program-runner.ts`, `src/protocol/areas/runtime-evidence/*`, `src/protocol/areas/generated-execution-graph/*`.

**MCP broker posture:**
- Problem: No MCP tool-list ingestion, tool schema digesting, consequential/read-only classification, tool hiding/wrapping, raw-call refusal, or schema drift detection exists in source.
- Blocks: The first strategic MCP/tool-dispatcher boundary named by tier doctrine.
- Files: `.planning/strategy/tiered-product-doctrine.md`, `.planning/strategy/0.3.0-agent-runtime-source-study.md`, `src/runtime/LANE.md`.

**ProtectedActionPlan Tier 3 spine:**
- Problem: No object or read model combines principal intent, runtime evidence, generated graph, candidate, contract, constraints, policy decision, review, greenlight, gateway check, mutation attempt, receipt/proof-gap state, remediation, and conformance links.
- Blocks: Hosted Protected Decision Ops.
- Files: `.planning/strategy/tier-3-strategy-findings.md`, `src/protocol/navigation/index.ts`, `src/http/routes/transition-route-registry.ts`.

**Receipt timeline / contract viewer / install health:**
- Problem: The protocol emits records and stream events, but there is no local human-readable reconstruction surface for Tier 2 activation.
- Blocks: Developer activation without reading tests or raw records.
- Files: `.planning/strategy/tiered-product-doctrine.md`, `src/protocol/events/*`, `src/protocol/areas/receipt-export/*`, `src/sdk/client.ts`.

## Test Coverage Gaps

**Bypass posture probes are not tested because they do not exist:**
- What's not tested: Raw credential reachability, shell/browser sibling mutation, direct MCP bypass, provider-hosted tool bypass, wrapper installation drift, and gateway credential custody probes.
- Files: `src/protocol/areas/protected-path-posture/*`, `.planning/strategy/0.3.0-agent-runtime-source-study.md`, `.planning/strategy/tier-2-meta-requirements.md`.
- Risk: A protected path can look installed because a posture record says so.
- Priority: High.

**Duplicate idempotency across new contracts is not tested as a hard refusal:**
- What's not tested: Two separate action contracts with the same idempotency key/resource/params receiving separate greenlights after terminal reconciliation.
- Files: `src/protocol/areas/policy-greenlight/guards.ts`, `src/protocol/areas/operation-lifecycle/claims.ts`, `test/protocol/kernel-operation-lifecycle.test.ts`, `migrations/0001_protocol_kernel.sql`.
- Risk: One-use greenlight protection is mistaken for end-to-end idempotent mutation protection.
- Priority: High for Tier 2.

**Hosted raw-read/RBAC boundaries are not tested as product authorization:**
- What's not tested: Tenant-scoped audit reader roles, redacted read models, `rawReadPosture` enforcement, revocation checks, and control-plane/internal-only read separation.
- Files: `src/http/handlers/internal-record-read.ts`, `src/protocol/areas/object-registry/index.ts`, `src/http/admission/*`, `test/http/http.test.ts`.
- Risk: Tier 3 audit surfaces expose internal protocol evidence or cross-tenant records.
- Priority: High before hosted operation.

**Real runtime adapters are not tested:**
- What's not tested: Vercel/OpenAI/LangGraph/Cloudflare/MCP streamed tool inputs, approvals, durable resume, hosted tools, browser/computer actions, or shell execution.
- Files: `src/runtime/*`, `.planning/strategy/0.3.0-agent-runtime-source-study.md`, `test/runtime/*`.
- Risk: Generated execution graph coverage works on curated action lists but misses real runtime bypass behavior.
- Priority: High for 0.3 runtime-ingress work.

**External gateway/provider conformance is absent:**
- What's not tested: A production provider or customer gateway owning mutation credentials and consuming exact greenlights before mutation.
- Files: `src/conformance/index.ts`, `test/conformance/protected-mutation-adapter-conformance.test.ts`, `src/adapters/*/gateway.ts`.
- Risk: Reference fixture conformance is mistaken for provider-side enforcement or certification.
- Priority: Medium until external integrations begin, then High.

---

*Concerns audit: 2026-05-19*
