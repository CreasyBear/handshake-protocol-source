# Plan Eng Review 02c: Broker-Grade Protocol Lifecycle Alignment

Status: Draft integration plan
Version: v0.2.3 protocol-spec alignment review
Audience: Protocol implementers, SDK authors, runtime builders, gateway owners, platform engineering, security engineering
Implementation status: Planning only; no code changes in this document
Canonical owner: Protocol owner
Follows: [`02b-plan-eng-review-module-boundaries.md`](./02b-plan-eng-review-module-boundaries.md)
References: [`../api-protocol.md`](../api-protocol.md), [`../specs/00-product-requirements-spine.md`](../specs/00-product-requirements-spine.md), [`../adr/0001-kernel-evidence-boundaries.md`](../adr/0001-kernel-evidence-boundaries.md), [Open Service Broker API spec](https://github.com/cloudfoundry/servicebroker/blob/master/spec.md)
Coordinates with: [`03-plan-eng-review-generated-execution-graph-coverage.md`](./03-plan-eng-review-generated-execution-graph-coverage.md)
Blocks: gateway-backed mutation integration in `03+` until the `02b` boundary checklist and this plan's protocol lifecycle checklist are implemented or explicitly deferred
Last reviewed: 2026-05-18

## Invariant At Stake

Handshake cannot claim gateway-grade execution control if the protocol loses the shape of an in-flight operation.

The current kernel is strong on the core authority path:

```text
exact ActionContract
  -> PolicyDecision
  -> one-use Greenlight
  -> GatewayCheckAttempt before mutation
  -> Receipt, refusal, or ProofGap
```

The remaining spec gap is lifecycle discipline around that path:

```text
transition request identity
  -> protocol version seen
  -> protected-surface operation claim
  -> mutation attempt submitted
  -> operation observation
  -> final receipt, pending state, proof gap, recovery, or isolation
```

If a gateway starts consequence, times out, returns ambiguous state, or races another attempt on the same protected resource, Handshake must not flatten that into "unknown" prose. It must preserve the operation lifecycle as protocol state.

## Decision

Adopt the useful protocol discipline from the Open Service Broker API without importing its marketplace product shape.

Keep:

- explicit protocol-version handling at the transition boundary;
- request identity and originating identity as audit/correlation evidence, not authority;
- named concurrency refusal for overlapping mutations on the same protected surface;
- asynchronous operation state as a first-class lifecycle concern;
- orphan mitigation when the caller cannot know whether downstream consequence occurred;
- conformance tests that define adapter obligations.

Cut:

- service offerings, service plans, service instances, and service bindings;
- Cloud Foundry compatibility claims;
- platform-to-broker trust assumptions;
- opaque provider metadata as authority;
- any claim that Handshake is a service marketplace or deployment broker.

Handshake's equivalent is narrower:

```text
generated execution attempts a protected action
  -> Handshake contracts the exact action
  -> gateway enforces one-use authority
  -> operation lifecycle remains reconstructable until finality or proof gap
```

## Step 0: Scope Challenge

### What Already Solves The Sub-Problems

| Sub-problem | Existing mechanism | Reuse verdict |
|---|---|---|
| Exact authority | `ActionContract`, `PolicyDecision`, `Greenlight`, `GatewayCheckAttempt` | Reuse; do not add service-broker-style authority objects. |
| One-use execution authority | `greenlight_consumptions` and gateway-check transition guard | Reuse; keep single-attempt semantics. |
| Pending or unknown downstream state | `MutationAttempt`, `SurfaceOperationReconciliation`, `ProofGap`, `Receipt.finalityStatus` | Reuse; strengthen into an operation lifecycle contract. |
| Same-operation reconciliation | `ReconcileSurfaceOperationInput` binds `mutationAttemptId`, `idempotencyKey`, and optional `surfaceOperationRef` | Reuse; do not let reconciliation become retry authority. |
| Recovery after refusal/gap | `RecoveryRecommendation`, terminal status transition, recovery terminal claim | Reuse; orphan mitigation may recommend cleanup only through fresh contracts. |
| Caller custody | `src/http/caller-auth.ts` and role-specific transition tokens | Reuse for local alpha; add request identity/version evidence on top. |
| Current posture | `ProtectedPathPosture` current index | Reuse; posture informs policy/gateway, not authority. |
| Gateway adapter proof | package-install, repo-write, local preview-deploy fixtures | Reuse as conformance targets. |

### Minimum Set To Bring The Protocol Up To Spec

This plan should implement five narrow protocol adjustments:

1. Add transition request context.
   - Require `X-Handshake-Protocol-Version` on HTTP transition requests.
   - Accept `X-Handshake-Request-Identity` as a non-empty correlation value and echo it in HTTP responses.
   - Accept optional `X-Handshake-Originating-Identity` only as an opaque audit ref or digest.
   - Record a canonical request-context digest on transition-created stream events or records.
   - Refuse unsupported versions before any transition commits records.

2. Promote operation lifecycle semantics.
   - Treat `SurfaceOperationReconciliation` as the Handshake equivalent of operation observation, not as generic cleanup.
   - Add docs/API wording and tests that define allowed states: `pending`, `succeeded`, `refused`, `failed`, `unknown`.
   - Preserve `pending` as non-final; preserve `unknown` as a proof gap; never turn either into execution success.

3. Add orphan mitigation as a protocol outcome.
   - Define when Handshake must emit `proof_gap.reasonCode = orphan_mitigation_required`.
   - Define recovery recommendation paths for cleanup or verification as fresh contracts only.
   - Do not let orphan mitigation reuse the original greenlight.

4. Add protected-surface operation claims.
   - Add an atomic current-operation index for D1 and memory stores keyed by tenant, organization, gateway, action class, resource, and operation intent.
   - A pending active operation on the same protected surface causes a named refusal before a second mutation attempt is committed.
   - Release or terminally mark the claim only through final reconciliation, proof gap isolation, or explicit recovery terminal transition.

5. Add gateway adapter conformance tests.
   - Every protected mutation adapter must prove it can refuse mismatched parameters, preserve idempotency, expose or synthesize a stable `surfaceOperationRef`, report pending/final/unknown operation state, and avoid mutating on failed gateway checks.
   - The conformance suite applies first to package install, repo write, and local preview deploy fixtures.

### Complexity Check

The wrong implementation is a new "broker" subsystem.

The right implementation is smaller:

```text
HTTP request context guard
operation-lifecycle semantics on existing records
atomic active-operation claim
orphan proof-gap/recovery rules
adapter conformance tests
```

Do not add `ServiceInstance`, `ServiceBinding`, `ServicePlan`, `Catalog`, or marketplace registration objects. Handshake already has tool/action/gateway catalogs; the product unit is protected action consequence, not service provisioning.

## Source Model: What To Learn From OSB

The Open Service Broker spec is useful because it acts like a real protocol under hostile lifecycle conditions. It names:

- a required API version header;
- optional originating identity and request identity headers for audit/correlation;
- explicit asynchronous operation state and polling;
- `ConcurrencyError` for resource mutations that cannot safely overlap;
- orphan mitigation when the platform cannot know whether a resource was created;
- conformance pressure via stable status codes, error codes, and request/response shapes.

Handshake should copy the discipline, not the domain.

| OSB concept | Handshake equivalent | Decision |
|---|---|---|
| API version header | `X-Handshake-Protocol-Version` | Add and enforce on HTTP transition routes. |
| Request identity | `X-Handshake-Request-Identity` | Add as correlation evidence and response echo. |
| Originating identity | principal/runtime/caller evidence refs | Accept as audit evidence only; not authority. |
| Async operation and `last_operation` | `MutationAttempt` + `SurfaceOperationReconciliation` | Reuse; document as operation observation. |
| `ConcurrencyError` | `protected_surface_operation_in_progress` refusal | Add atomic current-operation claim. |
| Orphan mitigation | `ProofGap` + `RecoveryRecommendation` + fresh cleanup contract | Add explicit reason codes and tests. |
| Catalog | `ToolCapability`, `ActionType`, `GatewayRegistryEntry` | Reuse; no service marketplace objects. |
| Service instances/bindings | none | Cut; wrong product shape. |

## Architecture Review

### Issue 1: Transition Requests Are Not Yet Protocol-Versioned

`PROTOCOL_VERSION` exists in schemas and OpenAPI, but HTTP transition requests do not currently require a protocol-version header. A generated runtime or SDK can therefore call a transition route without stating which protocol contract it believes it is using.

Decision:

```text
POST /v0.2/*
  -> caller custody check
  -> X-Handshake-Protocol-Version check
  -> request identity capture
  -> body parse
  -> kernel transition
```

Refusal behavior:

- missing version: `400 protocol_version_required`;
- unsupported version: `412 protocol_version_unsupported`;
- body parse failure after version acceptance: normal validation error;
- no protocol records committed on version refusal.

The header is not authority. It is compatibility evidence and a guard against silent client/server drift.

### Issue 2: Request Identity Is Currently Outside The Receipt Chain

Caller custody says which transition lane entered the system. It does not preserve the request identity that lets a gateway owner correlate runtime logs, adapter logs, HTTP responses, and protocol records.

Decision:

Add a `TransitionRequestContext` value with:

```text
protocolVersionSeen
requestIdentity
originatingIdentityDigest | null
callerCustodyRole
transitionName
routePattern | sdk_method
requestDigest
acceptedAt
```

The context must be reduced to a canonical digest and carried on transition-created stream events or the primary record created by the transition. The raw originating identity should not be stored unless a later privacy review defines retention.

Failure scenario: six months later, a gateway owner has a provider operation ID and a runtime request ID, but the receipt chain cannot connect them to the exact action contract. That is not auditable.

### Issue 3: Reconciliation Is Close To `last_operation`, But The Contract Is Too Implicit

`SurfaceOperationReconciliation` already binds to the same mutation attempt and idempotency key. That is the right primitive. What is missing is a documented lifecycle contract that says which actors may observe, which states are terminal, and what each state means for future authority.

Decision:

Define operation observation rules:

| Observed downstream status | Meaning | Authority consequence |
|---|---|---|
| `pending` | Gateway or downstream provider accepted work but finality is not known. | No success claim; protected-surface operation claim remains active. |
| `succeeded` | Gateway has acceptable finality evidence. | Claim becomes terminal success; receipt export may show finality. |
| `refused` | Downstream provider refused after gateway submission. | Claim becomes terminal refused; recovery may be recommended. |
| `failed` | Downstream provider reports failed operation. | Claim becomes suspect; recovery or isolation may follow. |
| `unknown` | Finality cannot be observed. | `ProofGap`; do not release unsafe scope without recovery/isolation decision. |

Do not rename the object yet. Rename churn is not the value. Update docs, OpenAPI descriptions, SDK method docs, and tests so consumers understand it as operation observation.

### Issue 4: Orphan Mitigation Exists As A Pattern, Not A Named Outcome

The current kernel can record `downstream_status_unknown` proof gaps and recovery recommendations. That is directionally right, but too generic for lost-response lifecycle failures.

Decision:

Add explicit orphan mitigation reason codes:

```text
orphan_mitigation_required
orphan_cleanup_recommended
orphan_verification_required
orphan_cleanup_unknown
```

Rules:

- If a gateway check passed and a mutation attempt may have reached a downstream protected surface, but the response timed out or finality is unknowable, emit `ProofGap` with orphan mitigation required.
- If cleanup is possible, recovery may recommend a cleanup action class, but the cleanup must be a new `ActionContract` with its own policy decision, greenlight, gateway check, receipt, and proof gaps.
- If cleanup authority is unavailable, isolate the resource or run until the proof gap is resolved.

Brutal boundary: orphan mitigation is not retry. It is controlled cleanup or verification under fresh authority.

### Issue 5: There Is No Atomic Active-Operation Claim

Handshake prevents greenlight reuse. It does not yet prevent two different greenlights from racing the same protected resource if both contracts are individually valid.

That is not a theoretical gap. Generated code will loop, retry, branch, and dispatch sibling candidates. Two exact contracts can still collide on the same protected surface.

Decision:

Add a `protected_surface_operation_claims` index:

```text
claimKey = tenantId
  + organizationId
  + gatewayId
  + protectedSurfaceKind
  + actionClass
  + resourceRef

claim state:
  active
  terminal_succeeded
  terminal_refused
  terminal_failed
  terminal_unknown
  isolated
```

Gateway check sequence:

```text
load contract + greenlight + current gateway + isolation + posture
  -> verify exact authority
  -> atomically claim protected surface operation
  -> commit gateway check + mutation attempt + receipt + claim
  -> adapter mutates only with VerifiedGatewayCheck
```

If the claim already has an active pending operation, gateway check refuses with:

```text
protected_surface_operation_in_progress
```

This is the Handshake version of OSB's named concurrency refusal. It is not optional if we expect generated programs to issue overlapping work.

### Issue 6: Adapter Tests Are Fixture Tests, Not A Conformance Suite

Current fixture tests prove specific adapters. They do not yet define what every future gateway adapter must prove before it is considered Handshake-compatible.

Decision:

Create a reusable adapter conformance suite:

```text
gateway adapter conformance
  -> refuses before mutation on contract/params/greenlight mismatch
  -> never mutates without VerifiedGatewayCheck
  -> produces stable surfaceOperationRef
  -> preserves idempotencyKey
  -> reports pending, succeeded, failed/refused, and unknown finality
  -> records proof gap for unknown finality
  -> refuses same protected surface while active operation claim exists
```

Run this suite against:

- package install gateway fixture;
- repo write gateway fixture;
- local preview-deploy gateway fixture.

## Proposed Object And API Changes

### Public Interface Contract

This plan exposes protocol semantics and transition behavior. It does not expose raw storage state.

Public alpha surface:

- HTTP headers on transition routes:
  - `X-Handshake-Protocol-Version`;
  - `X-Handshake-Request-Identity`;
  - optional `X-Handshake-Originating-Identity` as digest/ref evidence only.
- Transition endpoints already part of the lifecycle API:
  - action proposal, policy evaluation, review artifact/decision, greenlight, gateway check, reconciliation, recovery, receipt export, runtime execution evidence, and protected-path posture evidence.
- SDK helpers that set the required headers and route to the correct caller-custody token.
- OpenAPI metadata for transition endpoints, request headers, status codes, refusal codes, and response schemas.
- Receipt, proof-gap, refusal, and exported evidence fields that are intentionally part of reconstruction.

Internal-only implementation surface:

- `TransitionRequestContext` as a raw in-process object.
- `protected_surface_operation_claims` tables, indexes, claim keys, and commit helpers.
- raw originating identity payloads.
- caller-custody token configuration.
- stream-tail conflict mechanics.
- raw protocol-record debug reads unless they remain control-plane only and outside public OpenAPI.
- adapter-local provider status payloads unless redacted into receipt/proof-gap evidence.

Compatibility boundary:

```text
public API contract = transition inputs, transition outputs, documented headers,
refusal codes, receipt/proof-gap evidence, and redacted exports.

not public API = storage tables, current indexes, raw event internals,
debug record reads, adapter implementation details, and raw identity payloads.
```

Do not add `/last_operation`, `/operations/:id`, `/claims/:key`, or `/records/*`
as public API to imitate Open Service Broker. Operation observation stays a
transition: it can reconcile a known `mutationAttemptId` and idempotency key; it
cannot become an unauthenticated polling surface or mutation authority.

### New Or Strengthened Fields

| Area | Proposed change | Notes |
|---|---|---|
| HTTP transition boundary | `X-Handshake-Protocol-Version` required on `POST /v0.2/*` | SDK sets by default. |
| HTTP transition boundary | `X-Handshake-Request-Identity` accepted and echoed | Missing may be generated by SDK for local in-process clients; HTTP callers should provide it. |
| HTTP transition boundary | optional `X-Handshake-Originating-Identity` | Store digest/ref only. Not principal authority. |
| Stream events or transition records | `requestContextDigest` | Lets receipts reconstruct request lineage without storing raw identity. |
| `ProofGap.reasonCode` | orphan mitigation reason codes | Specific lifecycle failure, not generic unknown. |
| Store | `protected_surface_operation_claims` | Atomic active-operation index for D1 and memory stores. |
| Gateway check result | operation-claim reason code | Refusal before mutation if same surface is already active. |
| OpenAPI/SDK docs | operation observation semantics | Preserve current `reconcileSurfaceOperation` method name unless implementation proves rename is worth it. |

### Non-Claims

- This does not make Handshake Open Service Broker compatible.
- This does not make Handshake a service marketplace.
- This does not prove provider-side enforcement.
- This does not make request identity authority.
- This does not allow cleanup/retry under an old greenlight.
- This does not make reconciliation a mutation endpoint.
- This does not expose operation claims, raw request context, or debug records as public API.

## State Machine

```text
no_operation
  -> gateway_check_refused
  -> no_operation

no_operation
  -> gateway_check_passed
  -> operation_active

operation_active
  -> reconcile pending
  -> operation_active

operation_active
  -> reconcile succeeded
  -> terminal_succeeded

operation_active
  -> reconcile refused
  -> terminal_refused

operation_active
  -> reconcile failed
  -> terminal_failed_or_suspect

operation_active
  -> reconcile unknown
  -> proof_gap_orphan_mitigation_required
  -> recovery_recommended | isolation_state_changed | proof_gap_resolved
```

Concurrency branch:

```text
operation_active for protected surface
  -> second gateway_check for same claimKey
  -> gateway_check_refused(protected_surface_operation_in_progress)
  -> no second MutationAttempt
```

## Execution Plan

### Phase 0: Finish `02b` Boundary Gate And Reconcile With `03`

Hard stop: do not implement this plan until `02b`'s boundary checklist is either merged or deliberately folded into the same branch.

This plan does not replace `03-plan-eng-review-generated-execution-graph-coverage.md`. The two plans govern different failure modes:

```text
02c: once a gateway-backed mutation is attempted, preserve operation lifecycle,
     concurrency, version, request identity, orphan mitigation, and conformance.

03: before a contract exists, prove generated execution graph coverage so
    unsupported sibling nodes cannot hide consequence.
```

They can be implemented in either order if `03` remains pre-mutation graph evidence only. They must be integrated before `03+` claims a protected end-to-end adapter path.

Required before or with this plan:

- `GET /v0.2/records/:objectType/:objectId` is control-plane only or removed.
- Root exports are classified or snapshotted.
- Route custody completeness test exists.
- Per-role SDK transition token tests exist.

### Phase 1: Transition Request Context

Implementation targets:

- HTTP middleware for version/request identity parsing.
- SDK defaults for `X-Handshake-Protocol-Version` and request identity.
- OpenAPI security/header documentation.
- Transition event or record context digest.

Tests:

- missing protocol version refuses before records commit;
- unsupported protocol version refuses with `412`;
- request identity echoes in response;
- request context digest appears in resulting event/record;
- role token and version checks compose in the right order.

### Phase 2: Operation Lifecycle Contract

Implementation targets:

- Docs/OpenAPI wording for `SurfaceOperationReconciliation` as operation observation.
- Explicit mapping from downstream state to finality, proof gap, and operation claim state.
- Tests for pending, succeeded, refused, failed, and unknown branches.

Tests:

- pending does not export final success;
- succeeded can mark finality;
- failed/refused remain suspect where appropriate;
- unknown creates proof gap;
- reconciliation cannot create a second mutation attempt.

### Phase 3: Orphan Mitigation

Implementation targets:

- Add orphan-specific proof-gap reason codes.
- Add recovery recommendation validation for cleanup/verification paths.
- Add docs explaining lost-response and timeout behavior.

Tests:

- timeout/ambiguous downstream response records orphan mitigation proof gap;
- cleanup recommendation cannot mutate without fresh contract/greenlight/gateway check;
- old greenlight replay during cleanup refuses;
- unresolved orphan proof gap prevents unsafe future greenlight or gateway check for the same scope when configured.

### Phase 4: Protected-Surface Operation Claims

Implementation targets:

- Add memory and D1 atomic claim support.
- Claim during gateway check commit before adapter mutation.
- Terminally update claim through reconciliation or isolation/recovery handling.
- Add gateway refusal reason `protected_surface_operation_in_progress`.

Tests:

- first gateway check claims surface and creates one mutation attempt;
- second active same-surface gateway check refuses before mutation;
- same idempotency/operation reconciliation is allowed;
- unrelated resource/action/gateway scopes do not conflict;
- claim commit races resolve atomically in D1 and memory stores.

### Phase 5: Adapter Conformance

Implementation targets:

- Shared conformance test helper for gateway adapters.
- Apply to package install, repo write, and preview deploy fixtures.
- Add protocol docs for adapter readiness.

Tests:

- every adapter proves pre-mutation refusal;
- every adapter preserves idempotency and `surfaceOperationRef`;
- every adapter handles unknown finality through proof gap;
- every adapter refuses active same-surface operation.

## Test Matrix

```text
CODE PATHS
[+] TransitionRequestContext
  |-- [GAP] missing protocol version refuses before commit
  |-- [GAP] unsupported protocol version refuses with 412
  |-- [GAP] request identity echoed and digested
  |-- [GAP] originating identity stored only as digest/ref
  `-- [GAP] SDK defaults match HTTP/OpenAPI

[+] Operation lifecycle
  |-- [GAP] pending remains non-final
  |-- [GAP] succeeded becomes final only with acceptable evidence
  |-- [GAP] refused/failed stay reconstructable and recoverable
  |-- [GAP] unknown creates proof gap
  `-- [GAP] reconciliation cannot mutate or retry

[+] Orphan mitigation
  |-- [GAP] lost response after possible mutation records orphan proof gap
  |-- [GAP] cleanup requires fresh ActionContract -> PolicyDecision -> Greenlight -> GatewayCheckAttempt
  |-- [GAP] old greenlight replay refuses
  `-- [GAP] unresolved orphan gap can block future unsafe same-surface work

[+] Protected-surface operation claim
  |-- [GAP] first active operation claims resource atomically
  |-- [GAP] second same-surface mutation refuses before mutation
  |-- [GAP] D1 race produces exactly one active claim
  |-- [GAP] memory race produces exactly one active claim
  `-- [GAP] terminal reconciliation updates claim state

[+] Adapter conformance
  |-- [GAP] package-install fixture passes conformance
  |-- [GAP] repo-write fixture passes conformance
  |-- [GAP] preview-deploy fixture passes conformance
  `-- [GAP] conformance blocks adapter that mutates without VerifiedGatewayCheck
```

Coverage target: 100% of new authority, lifecycle, orphan, and concurrency branches.

Required commands for implementation closeout:

```bash
bun test
npm run typecheck -- --pretty false
npm run build -- --pretty false
git diff --check
rg -n -i "Open Service Broker compatible|Cloud Foundry compatible|service marketplace|provider-side enforcement|provider enforcement|request identity.*authority|originating identity.*authority|reconciliation.*authority|retry.*old greenlight" README.md docs src test
rg -n -i "orphan mitigation.*reuse.*greenlight|cleanup.*reuse.*greenlight|last operation.*mutation authority|operation observation.*mutation authority" README.md docs src test
```

For docs-only changes to this plan:

```bash
git diff --check
rg -n -i "Open Service Broker compatible|Cloud Foundry compatible|service marketplace|provider-side enforcement|provider enforcement" docs/plans/02c-plan-eng-review-protocol-spec-alignment.md
```

Expected docs-only scan result: hits only in explicit non-claims or cut-scope sections.

## Failure Modes

| Failure mode | How it breaks | Required defense |
|---|---|---|
| Silent protocol drift | Old SDK calls new transition shape and records misleading evidence. | Required version header, SDK defaults, unsupported-version refusal. |
| Request cannot be correlated | Gateway owner cannot connect provider logs to receipt chain. | Request identity echo and context digest. |
| Runtime identity becomes authority | Caller/request headers get treated as permission. | Docs/tests state identity is audit evidence only. |
| Pending operation is treated as success | Receipt implies downstream finality before provider confirms. | Pending remains non-final and cannot satisfy sequence dependency requiring final success. |
| Lost response hides created resource | Timeout after provider create leaves orphaned consequence. | Orphan mitigation proof gap and recovery path. |
| Cleanup reuses old greenlight | Old authority mutates again under recovery pressure. | Fresh contract/greenlight/gateway check required. |
| Generated code races same resource | Two valid contracts mutate one protected surface concurrently. | Atomic active-operation claim and named refusal. |
| Adapter passes happy path only | New gateways cannot prove refusal/idempotency/finality behavior. | Shared conformance suite. |
| OSB analogy widens product | Team builds marketplace objects instead of execution control. | Non-claims and "cut" list above. |

## Quality Contract

| Lens | Applies? | Target | Hard Stops | Evidence Required | Closeout |
|---|---:|---:|---|---|---|
| Product / CEO | yes | hard gate | Plan implies service marketplace, provider enforcement, or OSB compatibility | Non-claims scan and docs review | planned |
| Engineering | yes | hard gate | Operation lifecycle state is ambiguous or duplicated | State machine, store claims, transition guards | planned |
| Security / CSO | yes | hard gate | Request identity or originating identity becomes authority | Header tests, docs, refusal tests | planned |
| DevEx | yes | 8/10 | SDK/OpenAPI/HTTP headers disagree | SDK and OpenAPI tests | planned |
| Architecture | yes | 8/10 | New objects duplicate existing reconciliation/proof-gap semantics | Reuse map and module review | planned |
| Domain Invariant | yes | hard gate | Retry/cleanup/concurrency can mutate without fresh exact authority | Invariant tests and adapter conformance | planned |

## GSTACK Review Report

Status: DONE_WITH_CONCERNS

### Architecture Verdict

Keep the OSB lifecycle discipline. Cut the OSB product shape.

The plan is strong if it stays centered on operation lifecycle, orphan mitigation, request context, version negotiation, concurrency claims, and conformance. It becomes weak if it invents service-instance objects or starts treating Handshake as a broker marketplace.

### Engineering Risks

1. Active-operation claims can deadlock resources if terminal update rules are vague.
   - Required fix: every claim state must have a documented release, isolation, or recovery path.

2. Request-context capture can become PII retention.
   - Required fix: store originating identity digest/ref by default; raw identity storage needs separate policy.

3. Operation observation can accidentally become retry authority.
   - Required fix: reconciliation must remain read/observe/resolve only and must never create `MutationAttempt`.

4. Concurrency refusal can be too coarse and block safe unrelated work.
   - Required fix: claim key must include gateway, protected surface kind, action class, and resource; action-class compatibility can be refined later.

5. Version-header enforcement can break local in-process tests.
   - Required fix: SDK sets defaults; direct kernel calls remain versionless internal calls unless a separate in-process transition context is designed.

### Recommendation

Implement this as a narrow `v0.2.4` alpha schema/protocol change after `02b`.

Do not fold this into the CLI/MCP plan as incidental cleanup. It is protocol infrastructure, and it deserves its own invariant tests before more surfaces depend on it.

## Smallest Next Mechanism

Implement `TransitionRequestContext` first:

```text
caller custody
  -> protocol version check
  -> request identity capture
  -> request context digest
  -> existing transition
```

That gives the next branch a measurable spec-alignment surface without touching gateway mutation yet.
