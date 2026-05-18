# Plan 05: Foundation Kernel Operating Practice

Status: proposed foundation gate
Last reviewed: 2026-05-18
Owner: protocol kernel
Governing docs:

- [`README.md`](./README.md)
- [`../specs/00-product-requirements-spine.md`](../specs/00-product-requirements-spine.md)
- [`../business/tier-doctrine-decision-memo.md`](../business/tier-doctrine-decision-memo.md)
- [`../../QUALITY.md`](../../QUALITY.md)

## Invariant At Stake

This repo must become the reference foundation for Handshake's execution-control
kernel, not a pile of features, plans, and proof fixtures.

Every future slice must strengthen or preserve this path:

```text
vague intent / generated code
  -> CandidateAction or explicit refusal
  -> ActionContract
  -> PolicyDecision
  -> one-use Greenlight
  -> GatewayCheckAttempt before mutation
  -> MutationAttempt / refusal / ProofGap
  -> Receipt / reconciliation / recovery
```

If a change cannot say how it preserves that path under retry, race, stale
state, drift, bypass, or missing evidence, it is not foundation work.

## Goal

Make this repo the **Handshake foundation kernel**:

```text
small enough to audit
strict enough to refuse unsafe consequence
complete enough to simulate failure
boring enough to extend without new authority semantics
```

The repo should establish:

1. the canonical protocol object model;
2. the only authority path;
3. the module ownership style;
4. the adapter and transport thinness rules;
5. the failure-simulation harness;
6. the review and skill-use practice for all future work.

## Why This Plan Exists

Plans `01` through `02d` gave the repo a real local-alpha kernel. The next risk
is different: adding Plan `03`, Tier 2 activation, hosted identity, or product
surfaces before the repo has a repeatable operating practice.

The foundation gap is not another feature. It is the lack of cheap,
machine-checkable pressure against:

- missing transition outcomes;
- one-off race tests;
- protocol cost drift;
- generic SDK errors that tell agents the wrong thing;
- skills used as ceremony instead of gates.

## What Already Exists

| Existing Asset | Reuse |
|---|---|
| `HandshakeKernel` | Keep as the named transition facade. |
| area-owned protocol modules | Keep as primitive owners; add foundation tests around them. |
| `ProtocolStore` port | Reuse as the seam for memory, D1, and fault-injecting stores. |
| memory and D1 stores | Reuse as baseline adapters for correctness and atomic commit behavior. |
| `test/import-posture.test.ts` | Extend as architecture guardrail only when ownership rules change. |
| `test/kernel.test.ts` and `test/d1-http.test.ts` | Mine for scenarios, but do not keep adding every failure to giant files. |
| adapter conformance tests | Reuse as the protected-mutation proof pattern. |
| `QUALITY.md` | Owns code practice and module ownership language. |

This plan must not rebuild these surfaces. It should add leverage around them.

## Core Practice

### 1. Foundation Before Surface

No new public surface should land until the foundation can simulate the failure
it introduces.

```text
new transition
  -> transition matrix row first
  -> failure mode in fault-injection harness
  -> invariant/conformance test
  -> public adapter or route
```

### 2. Behavior And Structure Do Not Move Together

Structural work may move ownership, imports, and private helpers. Behavioral
work may add semantics, outcomes, or policy. A single slice should not do both
unless the plan names the invariant test that proves no behavior drift.

### 3. Every Slice Names Its Illegal Claim

Each plan must state the strongest claim it does **not** unlock.

Examples:

```text
local fixture proof != provider-side enforcement
hosted caller identity != principal authority
runtime wrapper != mutation authority
receipt != downstream business success
```

### 4. Failure Is A First-Class Input

Foundation tests should make these states easy to trigger:

- stream offset conflict;
- already-consumed greenlight;
- operation claim conflict;
- stale current posture;
- stale gateway policy;
- missing record;
- delayed current index visibility;
- ambiguous commit result;
- duplicate request identity;
- SDK retry after uncertain commit.

### 5. Budgets Are Part Of Correctness

A transition can be correct and still unfit for hosted operation if it quietly
adds unbounded reads, writes, stream partitions, or emitted records.

Initial budgets should count:

- store reads;
- store writes;
- D1 statements;
- committed protocol records;
- emitted stream events;
- stream partitions touched.

Budgets are pressure signals, not product SLOs.

## Skill Use Practice

Skills are gates, not decorations. Use the smallest skill set that catches the
failure class of the work.

| Work Type | Required Skill Gate | Why |
|---|---|---|
| Product shape, wedge, tier, or doctrine change | `office-hours`, then `play-the-tape-out` | Challenge whether the work should exist before planning it. |
| Durable architecture decision | `play-the-tape-out`, `autoreason`, then ADR | Simulate bad futures and choose the least-bad architecture explicitly. |
| Implementation plan | `plan-eng-review` | Lock architecture, data flow, tests, edge cases, and performance before coding. |
| Authority, gateway, credential, redaction, caller identity, or storage boundary | `quality-contract` plus `security-and-hardening` | Make hard stops explicit before code can smooth over risk. |
| Public HTTP, SDK, OpenAPI, schema, or error contract | `api-and-interface-design` | Keep public interfaces boring, versioned, and hard to misuse. |
| Module ownership, refactor, gravity well, or file sprawl | `improve-codebase-architecture` plus `code-simplification` | Split by invariant owner, not by aesthetic folder shape. |
| Post-implementation cleanup | `code-review-and-quality` | Hunt regressions, missing tests, and accidental semantics. |
| Docs, canon map, or product/protocol truth owner updates | `gsd-docs-update` | Keep docs ownership and promotion ladder current. |
| Staging, committing, branch closeout, or version bump | `git-workflow-and-versioning` | Keep slices reviewable and avoid dirty-worktree damage. |

Default sequence for serious protocol work:

```text
ground in canon
  -> play-the-tape-out
  -> autoreason when there are real competing designs
  -> plan-eng-review
  -> quality-contract / security-and-hardening as needed
  -> implement smallest slice
  -> code-review-and-quality
  -> gsd-docs-update
  -> git-workflow-and-versioning
```

Use fewer skills for trivial code changes. Do not use skills to postpone an
obvious narrow fix.

## Foundation Mechanisms

### M1. Executable Transition Matrix

Create a test-facing matrix that declares, for each transition:

- input schema;
- caller custody role;
- allowed outcomes;
- records written;
- events emitted;
- indexes updated or consumed;
- proof-gap/refusal obligations;
- commit-conflict behavior;
- illegal authority claims.

Acceptance:

- every public transition route maps to one matrix row;
- every kernel transition maps to one matrix row;
- every matrix row has at least one invariant test;
- no transition can add a new outcome without updating the matrix.

### M2. Fault-Injecting Protocol Store

Add `FaultInjectingProtocolStore` under `test/support`.

It wraps a real `ProtocolStore` and can force:

- `stream_conflict`;
- `greenlight_issuance_conflict`;
- `recovery_terminal_conflict`;
- `already_consumed`;
- `operation_claim_conflict`;
- stale current protected-path posture;
- missing reads after writes;
- delayed index visibility.

Acceptance:

- migrate at least five existing bespoke race/conflict tests to the harness;
- both memory-backed and D1-shaped behavior remain covered;
- all injected failures produce refusal, retry, recovery, or proof-gap evidence;
- no injected failure can create mutation authority.

### M3. Transition Budget Recorder

Add an instrumented store wrapper for tests that counts protocol cost per
transition.

Acceptance:

- budgets exist for policy evaluation, gateway check, receipt export,
  reconciliation, and recovery status transitions;
- budget failures print the counted reads, writes, records, events, and
  partitions;
- initial budgets are conservative and documented as pressure signals.

### M4. Typed Transition Error Envelope

Define a public error envelope for HTTP and SDK callers:

```text
code
message
transitionName
callerCustodyRole
retryability
commitState
requestIdentity
proofRef or refusalRef when available
```

Acceptance:

- SDK throws a typed Handshake error instead of a generic `Error`;
- HTTP errors expose no secrets or raw provider payloads;
- retryable, terminal, review-required, proof-gap, and ambiguous-commit cases
  are distinguishable;
- runtime wrappers can use the error contract without interpreting protocol
  internals.

### M5. Model-Based Invariant Tests

After M1 and M2 exist, add a command model that generates valid and invalid
transition sequences and asserts invariants after every step.

Acceptance:

- no mutation without exact contract, greenlight, and gateway check;
- one greenlight is consumed at most once;
- isolation blocks later policy and gate paths;
- proof gaps do not become authority;
- receipts do not imply downstream success without evidence.

## Implementation Sequence

```text
Slice 0: commit this plan and docs links
Slice 1: executable transition matrix
Slice 2: FaultInjectingProtocolStore
Slice 3: transition budget recorder
Slice 4: typed transition error envelope
Slice 5: model-based invariant tests
```

Run after each slice:

```text
bun test test/import-posture.test.ts test/root-exports.test.ts
bun test focused tests for touched mechanism
npm run typecheck -- --pretty false
git diff --check
```

Run before closeout:

```text
bun test
npm run build -- --pretty false
npm run typecheck -- --pretty false
git diff --check
```

## Test Diagram

```text
Transition route / kernel method
  |
  v
Executable transition matrix
  |-- route parity test
  |-- outcome coverage test
  |-- record/event/index obligation test
  |
  v
FaultInjectingProtocolStore
  |-- commit conflict
  |-- replay
  |-- stale current index
  |-- missing read
  |
  v
Kernel transition under stress
  |-- refusal
  |-- proof gap
  |-- retry-safe rebuild
  |-- no mutation authority
  |
  v
Budget recorder
  |-- reads/writes/statements
  |-- records/events/partitions
  |
  v
Typed HTTP/SDK error
  |-- retryable
  |-- terminal
  |-- proof/refusal linked
  |-- no secret leakage
```

## Failure Modes

| Failure Mode | Expected Handling |
|---|---|
| Matrix drifts from kernel routes | Completeness test fails. |
| Fault harness becomes fake protocol logic | Import-posture and conformance tests keep it under `test/support` only. |
| Budget tests become brittle | Budgets are pressure signals with explicit update rationale in plan closeout. |
| SDK retries ambiguous commit and double-mints authority | Typed error includes commit state; kernel idempotency and one-use greenlight tests still rule. |
| Model-based tests generate meaningless sequences | Seed scenarios from matrix rows and existing fixtures before adding random breadth. |

## Slice Closeout Evidence

### Slice 1: Executable Transition Matrix

Status: implemented 2026-05-18.

Evidence:

- Added `test/support/transition-matrix.ts` as a test-facing matrix for every
  public transition route, caller custody role, kernel method, record/event
  effect, index effect, conflict behavior, refusal/proof obligation, illegal
  authority claim, and invariant-test obligation.
- Added `test/transition-matrix.test.ts` so route registry, invoker map, and
  public kernel methods fail when the matrix drifts.
- Kept the matrix under `test/support` so it pressures implementation without
  becoming a second protocol owner.

Verification:

```text
bun test test/transition-matrix.test.ts test/import-posture.test.ts test/root-exports.test.ts
npm run typecheck -- --pretty false
```

Remaining foundation gap:

- The matrix now makes transition drift visible, but conflict behavior is still
  mostly asserted by bespoke tests. Slice 2 must add the
  `FaultInjectingProtocolStore` so commit, replay, stale-index, and uncertain
  read failures can be reused across transitions.

### Slice 2: Fault-Injecting Protocol Store

Status: implemented 2026-05-18.

Evidence:

- Added `test/support/fault-injecting-protocol-store.ts` as a test-only wrapper
  around a real `ProtocolStore`.
- The wrapper can inject protocol stream conflicts, gateway stream conflicts,
  greenlight replay conflicts, operation-claim conflicts, recovery terminal
  conflicts, missing record/list reads, delayed current-posture visibility,
  stale current posture, stale gateway-policy reads, and explicit ambiguous
  applied-commit errors.
- Migrated bespoke conflict stores in `test/kernel.test.ts` and `test/http.test.ts`
  to the reusable harness for stream conflicts, greenlight issuance race,
  replay, operation-claim conflict, recovery terminal conflict, posture
  visibility, stale posture, and gateway policy drift.
- Kept the harness under `test/support` and made it delegate to the wrapped store
  so it does not become a second protocol owner.

Verification:

```text
bun test test/fault-injecting-protocol-store.test.ts test/kernel.test.ts test/http.test.ts
npm run typecheck -- --pretty false
```

Remaining foundation gap:

- Fault injection now makes unsafe storage/read outcomes reusable, but the repo
  still lacks transition cost budgets. Slice 3 must add budget recording without
  turning budgets into production SLO claims.

### Slice 3: Transition Budget Recorder

Status: implemented 2026-05-18.

Evidence:

- Added `test/support/transition-budget-recorder.ts` as a test-only
  `ProtocolStore` wrapper that records read calls, write calls, committed
  records, emitted events, touched stream partitions, record writes by type,
  event writes by type, and method counts.
- Added `test/transition-budget-recorder.test.ts` with conservative budgets for
  `evaluatePolicy`, `gatewayCheck`, `createReceiptExport`,
  `reconcileSurfaceOperation`, and
  `transitionRecoveryRecommendationStatus`.
- Budget failures print the violated dimensions plus a JSON snapshot containing
  reads, writes, committed records, emitted events, stream partitions, per-record
  writes, per-event writes, and method counts.
- Initial budgets explicitly reflect current event fan-out across action, run,
  and protected-surface partitions. They are pressure signals for drift, not
  hosted SLOs or product performance claims.

Verification:

```text
bun test test/transition-budget-recorder.test.ts test/import-posture.test.ts test/root-exports.test.ts
npm run typecheck -- --pretty false
```

Remaining foundation gap:

- The repo now exposes transition cost drift, but HTTP/SDK callers still receive
  generic errors in several failure classes. Slice 4 must add the typed
  transition error envelope without changing mutation authority semantics.

### Slice 4: Typed Transition Error Envelope

Status: implemented 2026-05-19.

Evidence:

- Added `src/http/transition-error-envelope.ts` as the public HTTP/SDK error
  contract with `code`, `message`, `transitionName`, `callerCustodyRole`,
  `retryability`, `commitState`, `requestIdentity`, `proofRef`, and
  `refusalRef`.
- Updated HTTP auth, request validation, OpenAPI error responses, and transition
  route handling to return typed envelopes without exposing stack traces, raw
  request bodies, provider payloads, or bearer-token material.
- Updated the SDK to throw `HandshakeClientError` with typed retryability,
  commit state, custody role, request identity, and proof/refusal references
  instead of a generic `Error`.
- Added `HandshakeAmbiguousCommitError` and reused it from the
  `FaultInjectingProtocolStore` so ambiguous applied commits are visible to HTTP
  and SDK callers without implying success or retry authority.
- Bound recovery terminal conflict proof-gap ids into protocol error metadata so
  HTTP callers can inspect the exact proof gap when a recoverable conflict
  creates evidence.

Verification:

```text
bun test test/http.test.ts test/fault-injecting-protocol-store.test.ts test/import-posture.test.ts test/root-exports.test.ts
npm run typecheck -- --pretty false
```

Remaining foundation gap:

- The repo now gives callers typed failure states, but the foundation still
  relies on hand-authored scenario tests. Slice 5 must add model-based invariant
  tests seeded from the executable transition matrix so invalid transition
  sequences cannot mint mutation authority.

### Slice 5: Model-Based Invariant Tests

Status: implemented 2026-05-19.

Evidence:

- Added `test/model-based-invariants.test.ts` with a deterministic command
  model seeded from the transition matrix route vocabulary.
- The model executes valid and invalid transition sequences and re-reads the
  store after every command.
- Covered sequences include rejected compilation before catalog registration,
  runtime evidence without authority, missing contract/policy/gateway attempts,
  the canonical contract -> policy -> greenlight -> gate chain, greenlight
  replay, unknown downstream finality proof-gap recovery evidence, isolation
  before policy, isolation after greenlight, and receipt export.
- The invariant check fails if a mutation exists without an ActionContract,
  PolicyDecision, Greenlight, and passed GatewayCheckAttempt; if one greenlight
  maps to multiple mutation attempts; if refused receipts imply mutation; if
  non-final receipts imply downstream success; or if proof-gap/recovery/export
  evidence creates retry authority.

Verification:

```text
bun test test/model-based-invariants.test.ts
npm run typecheck -- --pretty false
```

Remaining foundation gap:

- Plan 05 foundation gates are now implemented. The next work item in the
  active repo goal is Plan 03 generated-execution graph coverage, using the
  transition matrix, fault harness, budget recorder, typed errors, and
  model-based invariant test as foundation gates.

## NOT In Scope

- new product UI, CLI, MCP server, or dashboard;
- new provider integration;
- hosted org auth implementation;
- public redacted evidence API;
- distributed queues, caching, sharding, or service decomposition;
- changing protocol version or wire shape unless the typed error envelope
  explicitly requires it.

## Quality Contract

| Lens | Applies? | Target | Hard Stops | Evidence Required | Closeout |
|---|---:|---:|---|---|---|
| Product / CEO | yes | Foundation only | Plan implies Tier 2, hosted, or provider-side enforcement. | Non-claims in plan and docs. | closed |
| Engineering | yes | hard gate | Matrix or fault harness misses a committed transition. | Completeness tests and focused fault-injection tests. | closed |
| Security / CSO | yes | hard gate | Failure simulation can produce mutation authority. | Fault-injection refusal/proof-gap tests. | closed |
| DevEx | yes | 8/10 | SDK errors remain generic or unactionable. | Typed error tests. | slice 4 closed |
| Design | no | n/a | No UI or review surface changes in this plan. | n/a | not applicable |
| Architecture | yes | 8/10 | Harness becomes another protocol owner. | Import posture, module ownership docs, and `test/support` containment. | closed |
| Domain Invariant | yes | hard gate | Any path bypasses contract -> policy -> greenlight -> gate. | Model-based invariants and no-mutation fault tests. | closed |

## Completion Summary Template

```text
Step 0: Scope Challenge - foundation-only, no product surface
Architecture Review: transition matrix + fault harness accepted
Code Quality Review: no new primitive owner outside protocol areas
Test Review: matrix, fault, budget, typed error, model tests covered
Performance Review: transition budgets established
NOT in scope: written
What already exists: reused
Failure modes: no critical silent gaps
Lake Score: complete foundation harness over one-off tests
```
