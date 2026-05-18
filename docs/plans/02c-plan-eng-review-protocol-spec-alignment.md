# Plan Eng Review 02c: Broker-Grade Protocol Lifecycle Alignment

Status: Implemented integration checkpoint
Version: v0.2.4 protocol-spec alignment checkpoint
Audience: Protocol implementers, SDK authors, runtime builders, gateway owners, platform engineering, security engineering
Implementation status: Integrated for local alpha; request context, lifecycle matrix, protected-surface claims, orphan proof gaps, explicit orphan isolation request, receipt lookup by mutation attempt, and adapter no-mutation conformance are covered. ADR 0005 hosted caller identity and redacted public evidence APIs remain deferred.
Canonical owner: Protocol owner
Follows: [`02b-plan-eng-review-module-boundaries.md`](./02b-plan-eng-review-module-boundaries.md)
References: [`../protocol/api-protocol.md`](../protocol/api-protocol.md), [`../specs/00-product-requirements-spine.md`](../specs/00-product-requirements-spine.md), [`../adr/0001-kernel-evidence-boundaries.md`](../adr/0001-kernel-evidence-boundaries.md), [`../adr/0005-hosted-transition-caller-identity.md`](../adr/0005-hosted-transition-caller-identity.md), [Open Service Broker API spec](https://github.com/cloudfoundry/servicebroker/blob/master/spec.md)
Coordinates with: [`03-plan-eng-review-generated-execution-graph-coverage.md`](./03-plan-eng-review-generated-execution-graph-coverage.md)
Blocks: no longer blocks local adapter-backed `03` work; hosted/public claims remain blocked on ADR 0005 hosted caller identity, redacted evidence APIs, and provider-side enforcement decisions
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

Implementation sequence is not optional:

```text
02b boundary hardening
  -> 02c-A transition request context
  -> 02c-B operation lifecycle, claims, orphan handling, adapter conformance
  -> 03 adapter-backed generated execution claims
```

Do not keep "either order" wording. `03` may use existing evidence work for
planning, but adapter-backed claims wait for these boundary and lifecycle gates.

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
  - Record a dedicated `transition_request_context` protocol record and carry its digest/reference on accepted transition-created stream events.
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
  - Add a `ProtectedSurfaceOperationClaim` protocol record and atomic current-claim index for D1 and memory stores keyed by canonical `claimKeyDigest`.
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

They must be implemented in this order for adapter-backed claims:

```text
02b -> 02c-A -> 02c-B -> 03 adapter-backed claims
```

`03` planning may continue as a read-only/generated-execution analysis artifact,
but protected end-to-end adapter claims wait for `02c-B`.

Required before or with this plan:

- `GET /v0.2/records/:objectType/:objectId` is control-plane only or removed.
- Root exports are classified or snapshotted.
- Route custody completeness test exists.
- Per-role SDK transition token tests exist.

### Phase 1: `02c-A` Transition Request Context

Implementation targets:

- HTTP boundary parsing for `X-Handshake-Protocol-Version`,
  `X-Handshake-Request-Identity`, and optional originating identity digest/ref.
- A dedicated `transition_request_context` protocol record.
- SDK defaults for protocol version and injectable UUID request identity.
- OpenAPI security/header documentation.
- Request context commits only with accepted transitions. Missing/unsupported
  version or invalid body commits no protocol records.
- Accepted HTTP transitions echo `X-Handshake-Request-Identity`.

Tests:

- missing protocol version refuses before records commit;
- unsupported protocol version refuses with `412`;
- request identity echoes in response;
- request context digest appears in resulting event/record;
- role token and version checks compose in the right order.

### Phase 2: `02c-B` Operation Lifecycle Contract

Implementation targets:

- Docs/OpenAPI wording for `SurfaceOperationReconciliation` as operation observation.
- A typed lifecycle matrix mapping downstream status, reconciliation status,
  finality, claim state, receipt status, and proof-gap behavior.
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

### Phase 4: `02c-B` Protected-Surface Operation Claims

Implementation targets:

- Add `ProtectedSurfaceOperationClaim` as both a protocol record and atomic
  current-claim index.
- Use canonical `claimKeyDigest` as the unique/indexed key.
- Claim during gateway check commit before adapter mutation.
- Release claims only through explicit reconciliation, orphan proof-gap isolation
  or recovery handling, or authorized terminal transition. No TTL auto-release.
- Add gateway refusal reason `protected_surface_operation_in_progress`.
- Add indexed receipt lookup by `mutationAttemptId`; stop scanning all receipts
  during reconciliation.

Tests:

- first gateway check claims surface and creates one mutation attempt;
- second active same-surface gateway check refuses before mutation;
- same idempotency/operation reconciliation is allowed;
- unrelated resource/action/gateway scopes do not conflict;
- claim commit races resolve atomically in D1 and memory stores.

### Phase 5: `02c-B` Adapter Conformance

Implementation targets:

- Minimal `ProtectedMutationAdapter` conformance test contract.
- Apply to package install, repo write, and preview deploy fixtures.
- Add protocol docs for adapter readiness.
- Do not build a full adapter framework in this slice.

Tests:

- every adapter proves pre-mutation refusal;
- every adapter preserves idempotency and `surfaceOperationRef`;
- every adapter handles unknown finality through proof gap;
- every adapter refuses active same-surface operation.

## Test Matrix

```text
CODE PATHS
[+] TransitionRequestContext
  |-- [DONE] missing protocol version refuses before commit
  |-- [DONE] unsupported protocol version refuses with 412
  |-- [DONE] request identity echoed and request context digested
  |-- [DONE] originating identity accepts only digest/ref and rejects raw identity
  `-- [DONE] SDK defaults match HTTP/OpenAPI

[+] Operation lifecycle
  |-- [DONE] pending remains non-final
  |-- [DONE] succeeded becomes final only with acceptable evidence
  |-- [DONE] refused/failed stay reconstructable and recoverable
  |-- [DONE] unknown creates proof gap
  `-- [DONE] reconciliation cannot mutate or retry

[+] Orphan mitigation
  |-- [DONE] lost response after possible mutation records orphan proof gap
  |-- [DONE] cleanup requires fresh ActionContract -> PolicyDecision -> Greenlight -> GatewayCheckAttempt
  |-- [DONE] old greenlight replay refuses
  |-- [DONE] unresolved orphan gap can block future unsafe same-surface work
  `-- [DONE] scoped isolation requires explicit orphanIsolationRequested, not evidenceRefs

[+] Protected-surface operation claim
  |-- [DONE] first active operation claims resource atomically
  |-- [DONE] second same-surface mutation refuses before mutation
  |-- [DONE] D1 race produces exactly one active claim
  |-- [PARTIAL] memory store covers same-surface refusal; add concurrent race fixture before hosted claims
  `-- [DONE] terminal reconciliation updates claim state

[+] Adapter conformance
  |-- [DONE] package-install fixture passes no-mutation conformance
  |-- [DONE] repo-write fixture passes no-mutation conformance
  |-- [DONE] preview-deploy fixture passes no-mutation conformance
  `-- [DONE] conformance blocks adapter that mutates without VerifiedGatewayCheck
```

Coverage target: 100% of new authority, lifecycle, orphan, and concurrency branches.

Required commands for implementation closeout:

```bash
bun test
bun run typecheck -- --pretty false
bun run build -- --pretty false
bun audit --audit-level high
git diff --check
rg -n -i "Open Service Broker compatible|Cloud Foundry compatible|service marketplace|provider-side enforcement|provider enforcement|request identity.*authority|originating identity.*authority|reconciliation.*authority|retry.*old greenlight" README.md docs src test
rg -n -i "orphan mitigation.*reuse.*greenlight|cleanup.*reuse.*greenlight|last operation.*mutation authority|operation observation.*mutation authority" README.md docs src test
```

For docs-only changes to this plan:

```bash
git diff --check
python3 /Users/joelchan/.codex/skills/quality-contract/scripts/check_quality_contract.py docs/plans/02c-plan-eng-review-protocol-spec-alignment.md
rg -n -i "Open Service Broker compatible|Cloud Foundry compatible|service marketplace|provider-side enforcement|provider enforcement" docs/plans/02c-plan-eng-review-protocol-spec-alignment.md
```

Expected docs-only scan result: hits only in explicit non-claims, cut-scope sections,
quality hard stops, or scan-command examples.

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

## Paranoid Boundary Review

Assume generated execution code is adversarial, impatient, and good at making
unsafe behavior look like ordinary lifecycle ambiguity. `02c` is not ready until
each of these attacks has an explicit refusal, proof gap, isolation path, or
redacted evidence path.

| Attack | What breaks if accepted | Required defense |
|---|---|---|
| Runtime fabricates `X-Handshake-Originating-Identity` as an admin or platform actor. | Request metadata launders authority into the receipt chain. | Store digest/ref only; never derive principal authority, caller custody, or policy subject from the header. |
| SDK sends a supported protocol-version header with an old or malformed body. | Version evidence masks schema drift. | Version check is necessary but not sufficient; body schema validation still blocks commit. |
| Agent retries after a timeout with a new request identity and same protected surface. | Lost-response orphan becomes duplicate mutation. | Active operation claim refuses same-surface mutation until reconciliation, isolation, or proof-gap recovery resolves it. |
| Cleanup path tries to call the gateway adapter with the original greenlight. | Recovery pressure turns one-use authority into ambient authority. | Cleanup and verification are new action contracts with fresh policy, greenlight, gateway check, and receipt. |
| Adapter returns `surfaceOperationRef` for a different resource or action class. | Receipt reconstructs the wrong protected consequence. | Conformance requires contract/resource/action binding checks before finality evidence is accepted. |
| Adapter reports `pending` or HTTP `202` as success. | Receipt claims downstream finality that does not exist. | Pending remains non-final; sequence dependencies requiring final success cannot advance. |
| Provider finality cannot be observed after a gateway-passed mutation attempt. | Unknown consequence gets smoothed into success or harmless failure. | Emit orphan proof gap; hold or isolate unsafe scope until recovery or reconciliation gives acceptable evidence. |
| Public API pressure adds `/operations/:id`, `/claims/:key`, or raw record reads. | Internal lifecycle state becomes a polling or authority surface. | Refuse as public API; expose only transition outputs, refusal codes, redacted receipts, proof gaps, and exports. |
| Operation claim commit races across D1 or memory stores. | Two exact but conflicting greenlights mutate the same protected resource. | Atomic claim write is part of gateway-check commit; exactly one winner, all losers get named refusal. |
| Sibling or raw tool mutates the same surface outside the gateway wrapper. | The generated code escaped the contract boundary. | Record bypass posture/proof gap and isolate affected scope; do not pretend the receipt proves downstream control. |
| Stream event contains raw provider payload, token material, or full originating identity. | Audit evidence becomes a secret leak. | Redaction and digesting happen before commit; public errors and exports never include raw sensitive material. |
| Conformance fixture only proves the happy path. | New adapters can be branded Handshake-compatible while bypassing the invariant. | Adapter conformance must include mismatch, replay, pending, unknown, active-claim, and no-mutation-on-refusal tests. |

Brutal acceptance gate: if any one of these cases ends in "log it and continue",
"best effort", "adapter responsibility", or "operator can inspect later", the
implementation is advisory, not Handshake.

## Security And Hardening Contract

This plan changes protocol and API boundary behavior. Treat every HTTP header,
request body, SDK default, gateway observation, provider payload, adapter return
value, and originating identity value as hostile until it is validated, reduced
into canonical evidence, and passed through the existing authority path.

Hard requirements:

- Boundary validation: every transition input remains schema-validated before it can influence protocol state. Header values must be parsed, normalized, length-bounded, and rejected before any record commit when invalid.
- Auth and authorization: caller custody is required before mutation-adjacent transition bodies can affect state. Request identity and originating identity are audit evidence only; they cannot substitute for principal authority, caller custody, policy, or gateway checks.
- Storage exposure: `TransitionRequestContext`, `protected_surface_operation_claims`, raw protocol records, stream tails, caller-custody token config, and adapter-local provider payloads are internal-only unless deliberately redacted into receipt, refusal, proof-gap, or export evidence.
- D1 and memory safety: operation-claim writes must be parameterized and committed atomically with the related gateway-check or reconciliation records/events. Race losers become named refusals or proof gaps, never partial state.
- Error hygiene: public errors use stable refusal or reason codes and must not reveal bearer tokens, raw originating identities, raw provider responses, stack traces, claim keys, or secret-bearing request material.
- Cleanup and orphan mitigation: cleanup, verification, and recovery actions are fresh action contracts. Old greenlights cannot authorize cleanup, retry, or orphan mitigation.
- Dependency and release gate: before release, run `bun audit --audit-level high` or record an explicit skipped reason. Reachable critical or high dependency findings block release until fixed, patched, replaced, or accepted with owner and review date.

Out of scope for this plan: new password/session flows, CORS changes, file uploads, payment data, or new PII retention. If implementation adds any of those, reopen the Security / CSO lens before coding.

## Quality Contract

| Lens | Applies? | Target | Hard Stops | Evidence Required | Closeout |
|---|---:|---:|---|---|---|
| Product / CEO | yes | hard gate | Plan implies service marketplace, provider enforcement, OSB compatibility, public polling surface, "best effort" lifecycle control, or broader lifecycle claim than the gateway can prove. | Non-claims scan, docs review, public-interface boundary review, paranoid boundary review retained, scope/cut list retained. | implemented for local alpha |
| Engineering | yes | hard gate | Operation lifecycle state is ambiguous or duplicated; operation-claim release path is undefined; critical lifecycle or paranoid-boundary branch lacks deterministic tests. | State machine, store claims, transition guards, D1/memory race tests, paranoid-boundary fixture matrix, full command suite. | implemented; memory concurrent race fixture remains hosted-claim follow-up |
| Security / CSO | yes | hard gate | Caller/request/originating identity becomes authority; raw records, provider payloads, tokens, claim keys, or raw identity values leak through public API; cleanup/retry bypasses fresh contract and gateway authority; adapter output is trusted without binding checks; reachable high/critical dependency finding is unaddressed for release. | Threat notes in this plan, header/auth boundary tests, refusal tests, redaction/export tests, adapter binding tests, D1 parameterization/atomicity review, `bun audit --audit-level high` or documented skip. | implemented for local alpha; ADR 0005 hosted caller identity/redaction deferred |
| DevEx | yes | 8/10 | SDK/OpenAPI/HTTP headers disagree; breaking transition behavior lacks migration notes; public docs teach internal records, operation claims, or debug reads as API. | SDK/OpenAPI/header tests, route/schema/docs consistency scan, migration note, error/refusal code examples. | implemented |
| Design | conditional | hard gate | Any review, receipt, recovery, or evidence-viewing surface lets a human approve or interpret a summary that is not bound to the exact contract, policy input, gateway check, or proof-gap evidence. | If UI/review/export surface is touched: state matrix, stale/error/empty states, exact digest-binding evidence, rendered artifact tests. Otherwise record no UI scope in closeout. | not applicable; no UI surface |
| Architecture | yes | 8/10 | New objects duplicate reconciliation/proof-gap semantics; operation claims become caller-managed public state; authority, policy, evidence, or cleanup rules are duplicated across adapters. | Reuse map, module map, deletion-test note for operation-claim helpers, adapter conformance at the interface. | implemented |
| Domain Invariant | yes | hard gate | Retry, cleanup, concurrency, reconciliation, or orphan mitigation can mutate without exact ActionContract -> PolicyDecision -> one-use Greenlight -> GatewayCheckAttempt; pending/unknown finality is smoothed into success; missing evidence is not recorded as a proof gap. | Invariant tests, adapter conformance, receipt/refusal/proof-gap examples, raw/sibling bypass posture scan. | implemented |

### Quality Decisions

- Design lens is conditional because this plan does not add UI. It reopens immediately if review artifact rendering, receipt export presentation, recovery UX, or evidence-viewing surfaces change.
- Security / CSO is a hard gate because `02c` introduces request identity, protocol-version headers, operation claims, orphan mitigation, and provider lifecycle observation. These are all authority-laundering or evidence-leakage risks if handled loosely.
- The paranoid boundary review is part of closeout evidence, not commentary. Each attack needs an implemented refusal, proof gap, isolation path, or redacted evidence path before `02c` can be considered integrated.
- `bun audit --audit-level high` is release-bound evidence, not docs-only evidence. A skipped audit needs an owner, reason, and revisit trigger.

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

Keep this as a narrow `v0.2.4` alpha schema/protocol layer after `02b`.

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
