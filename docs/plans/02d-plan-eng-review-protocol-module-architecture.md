# Plan Eng Review 02d: Protocol Module Architecture Style

Status: Implemented architecture plan
Version: v0.2.3 architecture refactor review
Audience: Protocol implementers, SDK authors, runtime builders, gateway owners, platform engineering, security engineering
Implementation status: Full protocol module ownership migration implemented as a behavior-preserving refactor; ADR 0003 owns the architecture decision
Canonical owner: Protocol owner
Follows: [`02b-plan-eng-review-module-boundaries.md`](./02b-plan-eng-review-module-boundaries.md), [`02c-plan-eng-review-protocol-spec-alignment.md`](./02c-plan-eng-review-protocol-spec-alignment.md)
References: [`../protocol/protocol-kernel.md`](../protocol/protocol-kernel.md), [`../protocol/api-protocol.md`](../protocol/api-protocol.md), [`../adr/0001-kernel-evidence-boundaries.md`](../adr/0001-kernel-evidence-boundaries.md), [`../adr/0002-generated-execution-graph-coverage.md`](../adr/0002-generated-execution-graph-coverage.md), [`../adr/0003-protocol-module-ownership.md`](../adr/0003-protocol-module-ownership.md)
Coordinates with: [`03-plan-eng-review-generated-execution-graph-coverage.md`](./03-plan-eng-review-generated-execution-graph-coverage.md)
Blocks: no active block; this plan is the acceptance evidence for ADR 0003, and future generated-execution work must preserve its module ownership rules
Last reviewed: 2026-05-18

## Invariant At Stake

The protocol kernel must remain the only authority transition surface, but each
control primitive must have one local owner.

If schema lives in one gravity well, guards in another, events in another, and
storage side effects in a fourth, nobody owns the invariant. The next adapter,
HTTP route, MCP tool, CLI command, or generated-runtime wrapper will eventually
reassemble the primitive slightly differently.

Target invariant:

```text
HTTP / SDK / MCP / CLI / runtime host
  -> thin transport adapter
  -> transition surface
  -> HandshakeKernel facade
  -> area-owned protocol module
  -> ProtocolRecorder / ProtocolStore
```

Authority still follows the kernel loop:

```text
exact ActionContract
  -> PolicyDecision
  -> one-use Greenlight
  -> GatewayCheckAttempt before mutation
  -> Receipt, refusal, or ProofGap
```

This refactor must not create a second kernel, a second storage model, or a
transport-specific shortcut around the transition loop.

## Decision

Adopt an area-owned protocol module architecture.

Each area owns one control primitive or state machine end to end:

```text
schema
input schema
constructors / canonicalization
guards
transition function
event descriptors
storage effects requested by the transition
tests at the module interface
```

Transport surfaces stay thin:

```text
parse transport
check caller custody
capture request/version/correlation evidence
invoke one named kernel transition
map protocol error to transport error
return transition result
```

Transport surfaces must not own:

- policy decisions;
- lifecycle state;
- storage indexes;
- greenlight consumption;
- proof-gap semantics;
- review binding;
- gateway mutation semantics;
- recovery authority;
- protocol object meaning.

The protocol stays a modular monolith. Do not split into packages, services, or
distributed processes. The value is locality inside the current repo, not
deployment separation.

## Architecture Style

### Rule 1: Split By Invariant, Not File Type

Do not organize the protocol as:

```text
schemas.ts
inputs.ts
guards.ts
events.ts
transitions.ts
```

That shape creates gravity wells. It makes a new primitive require edits across
many unrelated files and forces maintainers to reconstruct the invariant from
imports.

Preferred shape:

```text
src/protocol/
  kernel.ts

  catalog-envelope/
    schemas.ts
    inputs.ts
    transitions.ts
    guards.ts

  runtime-evidence/
    schemas.ts
    inputs.ts
    transitions.ts
    guards.ts

  intent-compilation/
    schemas.ts
    inputs.ts
    transitions.ts
    guards.ts

  action-contract/
    schemas.ts
    inputs.ts
    transitions.ts
    canonicalize.ts
    guards.ts

  policy-greenlight/
    schemas.ts
    inputs.ts
    transitions.ts
    policy-input.ts
    guards.ts

  gateway-gate/
    schemas.ts
    inputs.ts
    transitions.ts
    artifacts.ts
    guards.ts

  operation-lifecycle/
    schemas.ts
    inputs.ts
    transitions.ts
    lifecycle.ts
    claims.ts
    proof-gaps.ts

  review-binding/
    schemas.ts
    inputs.ts
    transitions.ts
    guards.ts

  receipt-export/
    schemas.ts
    inputs.ts
    transitions.ts
    digests.ts

  recovery-isolation/
    schemas.ts
    inputs.ts
    transitions.ts
    guards.ts

  object-registry/
    index.ts
```

The exact names may change during implementation, but the ownership rule should
not.

First extraction constraint: do not split central schema/input ownership until
`object-registry` exists. `operation-lifecycle` may own behavior first while
continuing to import record schemas and input schemas from the existing central
files.

### Rule 2: Keep One Aggregator, Not One Gravity Well

`object-registry` is the necessary exception. It aggregates area-owned schemas
into package-wide concerns:

- protocol object type union;
- protocol record discriminated union;
- object ID extraction;
- root export posture;
- raw record-read posture;
- OpenAPI schema collection when needed.

It must not contain primitive logic.

Deletion test:

```text
If object-registry is deleted:
  object union, id extraction, and export posture break in one place.

If operation-lifecycle is deleted:
  claim state, finality, orphan proof gaps, release rules, and isolation effects
  should not reappear across gateway-gate, reconciliation, storage, and tests.
```

### Rule 3: The Kernel Names Transitions; Areas Own Meaning

`HandshakeKernel` should be a narrow facade:

```text
createRuntimeExecution(input)
  -> runtimeEvidence.recordExecution(...)

compileIntent(input)
  -> intentCompilation.compile(...)

proposeActionContract(input)
  -> actionContract.propose(...)

evaluatePolicy(input)
  -> policyGreenlight.evaluate(...)

gatewayCheck(input)
  -> gatewayGate.check(...)

reconcileSurfaceOperation(input)
  -> operationLifecycle.reconcile(...)
```

The kernel may enforce that callers use named transitions. It should not absorb
gateway-specific policy, runtime plugin logic, caller-auth plumbing, OpenAPI
metadata, SDK convenience behavior, or product UI state.

### Rule 4: Storage Adapters Implement Atomic Primitives, Not Policy

D1 and memory storage can expose atomic commit primitives:

```text
commit protocol records and events
consume greenlight once
claim protected surface operation once
update current posture pointer
resolve terminal recovery claim once
```

They must not decide whether a lifecycle state means success, suspect, unknown,
or isolation. That meaning belongs to area-owned protocol modules.

### Rule 5: Adapters Are Specific And Boring

HTTP, SDK, MCP, CLI, and runtime hosts are adapters, not authority surfaces.

Reference adapters for package install, repo write, and preview deploy can remain
specific. The reusable part is the conformance ritual:

```text
gateway check
  -> verified gate or refusal
  -> no mutation without verified gate
  -> mutation attempt evidence
  -> same-operation reconciliation
  -> receipt, finality, or proof gap
```

Do not hide provider-specific mutation semantics inside the generic kernel.

## Step 0: Scope Challenge

Historical note: this section records the pre-implementation scope gate that
kept the first pass behavior-preserving. The current accepted state is in
`Implementation Closeout` below.

### What Already Exists

| Sub-problem | Existing mechanism | Reuse verdict |
|---|---|---|
| Kernel transition facade | `src/protocol/kernel.ts` | Reuse; keep as the sole public in-process protocol facade. |
| Transport transition metadata | `src/http/transition-route-registry.ts` plus OpenAPI generation | Reuse; deepen only after primitive ownership is clearer. |
| Transition request context | `src/http/transition-request-context.ts`, `src/protocol/transition-request-contexts.ts` | Reuse; keep transport evidence outside primitive meaning. |
| Durable recording | `ProtocolRecorder.commitRecordsWithEvents` | Reuse; area modules should request records/events through it. |
| Atomic storage | D1/memory `commitProtocolRecords` and `commitGatewayCheck` | Reuse; avoid adding storage models during the first extraction. |
| Operation lifecycle seed | `operation-lifecycle.ts`, operation claims, reconciliation, gateway check logic | Reuse; this is the first extraction target. |
| Root export curation | `src/index.ts` and `test/root-exports.test.ts` | Reuse; object registry can later own the source of truth. |
| Adapter reference flows | package-install, repo-write, preview-deploy adapters | Reuse; extract conformance later, not first. |

### Minimum Set That Achieves The Goal

The minimum useful refactor is not moving every file.

Minimum slice:

```text
1. Document this architecture style.
2. Extract one high-risk area module: operation-lifecycle.
3. Add tests proving no behavior changes across kernel, HTTP, D1, and adapters.
4. Leave source-compatible re-exports from old paths until the next slice.
```

This proves the style without creating a large merge conflict across the current
02c work.

### Complexity Check

The full desired architecture touches more than eight files and more than two
areas. That is a smell if attempted as one PR.

Historical recommendation:

```text
Do not refactor all protocol areas at once.
Do extract operation-lifecycle first.
Then extract object-registry.
Then extract transition-surface if drift remains.
Then migrate remaining areas only when touching them for real behavior.
```

This is a lake, not an ocean, only if done as a sequence of small behavior-preserving
slices.

### Search Check

- [Layer 1] Hono already has bearer-auth middleware, but Handshake needs
  role-specific transition custody and request-context capture before body
  parsing. Keep the custom thin caller-custody adapter rather than hiding
  transition roles inside generic middleware. Source: <https://hono.dev/docs/middleware/builtin/bearer-auth>.
- [Layer 1] TypeScript project references can split very large projects into
  smaller pieces, but this repo does not yet need package or build graph
  separation. Use folders and import posture first. Source:
  <https://www.typescriptlang.org/docs/handbook/project-references>.
- [Layer 3] Fowler's monolith-first warning applies: early service/package
  separation makes refactoring harder before the right seams are known. Keep a
  modular monolith and extract by invariant. Source:
  <https://martinfowler.com/bliki/MonolithFirst.html>.

No eureka: the standard modular-monolith instinct is correct here. The important
Handshake-specific twist is that the module seam is the control primitive, not a
feature, route, or product surface.

### TODO Cross-Reference

No `TODOS.md` exists. This plan should not create one yet. If accepted, future
TODOs should be attached to specific deferred slices, not vague "clean up
architecture" work.

### Completeness Check

The complete version is not a full repo rewrite. The complete version is:

```text
architecture style documented
one extraction proves the style
all authority invariants stay green
old import paths remain compatible until intentionally removed
```

Shortcut to reject: moving files into folders without moving ownership. That
only creates a prettier gravity well.

## Autoreason Result

- A: Keep the original `02d` plan because it already identifies the right
  modular-monolith direction and first extraction target.
- B: Challenge it by making the style canonical before source moves, delaying
  schema sharding until object registry exists, and adding import-posture checks.
- AB: Keep A's narrow extraction sequence, but adopt B's ADR-first and
  acceptance-test hardening.
- Winner: AB.
- Why: it preserves the kernel architecture, reduces future drift, and avoids a
  big-bang protocol rewrite.
- Stop/iterate: stop; further refinement would expand implementation scope
  without improving the next mechanism.

## Play-The-Tape Review

Historical note: this tape explains why ADR-first, operation-lifecycle-first,
registry-before-schema-sharding, and import-posture checks became the migration
rules. It is retained as provenance; `Implementation Closeout` is the current
state.

### Question Compiler

- Raw ask: make `02d` an implementation-ready architecture gate for protocol module ownership.
- Artifact under review: architecture plan, ADR handoff, source refactor sequence, import posture, and tests.
- Short-term gain: reduce protocol gravity wells before generated-execution graph work adds more objects.
- Future pain risk: anchoring a new folder tree that still splits invariants, or creating a second kernel/object registry god object.
- Primary tape mode: Architecture
- Secondary tape modes: Attack, Debt.
- Compiled question: This plan gets better protocol locality, but risks anchoring authority semantics to a prettier folder tree, a god registry, or transport-specific shortcuts. If it succeeds, what becomes hard to change independently?
- Non-question: this review must not redesign policy, gateway enforcement, public API semantics, provider preview enforcement, or ADR 0002 graph coverage.

### Crystal Ball Setup

- Depth: Deep
- Success criteria: ADR 0003 exists, `02d` is decision-complete, first source slice preserves behavior, import posture is checked, and Plan 03 cannot route around module ownership.
- Source material: protocol kernel docs, API protocol docs, ADR 0001, ADR 0002, current `02d`, current protocol source shape, and local operation lifecycle tests.
- Council roles: Product / CEO, Engineering, Security / CSO, Architecture, DevEx, Future Maintainer, Domain Invariant.
- Uncertainty axes: partial adoption, schema churn, generated-code pressure, dirty adapter integrations, docs drift, import drift, and object-registry scope creep.

### If This Succeeds, We Own

- Product/repo shape: a modular-monolith protocol kernel where area modules own primitive behavior and transports stay adapters.
- New product claims: none; this is an internal architecture style, not a new public capability.
- New API/protocol surface: none in Slice 0 or Slice 1.
- New docs source of truth: ADR 0003 owns durable architecture style; this plan owns implementation sequencing.
- New long-term maintenance burden: every future area extraction must prove it moved primitive ownership, not just files.

### Monte Carlo Futures

| Future | Assumptions | Likelihood | Success-State Residue | Tail Risk |
|---|---|---:|---|---|
| Base success | ADR lands, operation lifecycle is extracted, tests stay green. | medium | Good locality for one area, but schema ownership still needs a follow-up slice. | Future readers may think the migration is complete. |
| Dirty integration | A future MCP/CLI adapter imports a protocol helper directly. | medium | Thin-adapter rule exists in docs but not enough code pressure. | Transport-specific authority shortcut. |
| Partial adoption | Operation lifecycle moves, other areas stay file-type organized. | high | Mixed architecture is understandable only if compatibility shims and ownership notes stay explicit. | New areas copy the old gravity well. |
| Scale pressure | More protected surfaces and adapters arrive before object registry. | medium | Schema/input churn increases in central files. | Object registry becomes overdue and migration-bound. |
| Generated-code pressure | Plan 03 adds graph objects and node states. | medium | ADR 0003 blocks file-type sharding, but graph work could create its own mini-kernel. | Generated code escaped the contract boundary by architecture drift. |
| Docs drift | Future contributors read `02d` but not ADR 0003. | medium | Plan and ADR duplicate style rules. | Competing source of truth unless citation rules are explicit. |
| Incident recovery | A later finality bug needs audit reconstruction. | low | Operation lifecycle owner makes behavior easier to inspect. | If tests bless plumbing instead of invariant, the bug is hard to localize. |

### Council Passes

| Role | Strongest Residue Callout | What It Would Cut Or Narrow | Hard Stop? |
|---|---|---|---:|
| Product / CEO | Do not turn architecture cleanup into a product claim. | Cut any public-surface language from Slice 0. | no |
| Engineering | File moves without ownership tests will freeze the wrong abstraction. | Narrow first source move to operation lifecycle only. | no |
| Security / CSO | Transport imports into area internals are future bypass seams. | Add import-posture checks as acceptance evidence. | yes |
| Architecture | Object registry can become the next god object. | Limit registry to schema/ID/export/read aggregation only. | no |
| DevEx | Mixed old/new import paths can confuse contributors. | Keep compatibility re-exports and name temporary status. | no |
| Future Maintainer | Plan-only style will be ignored under delivery pressure. | Promote the style to ADR 0003 before source moves. | no |
| Domain Invariant | No module may bypass exact contract -> policy -> greenlight -> gate. | Keep kernel facade and gateway-gate authority intact. | yes |

### Mode Artifact

| Tape Mode | Artifact | Future Pain Exposed | Required Adjustment |
|---|---|---|---|
| Architecture | Coupling and interface pressure map | Area modules, object registry, transition surface, storage commits, and transports can become competing owners. | Make ADR 0003 canonical, extract only operation lifecycle first, and keep object registry narrow. |
| Attack | Attack and bypass map | Thin-adapter rule without tests lets future MCP/CLI/HTTP paths reach area internals. | Add import-posture tests or scans before closeout. |
| Debt | Pain ledger with triggers | Compatibility shims and central schema files become long-lived debt. | Name object-registry as the trigger before schema sharding and keep shim removal explicit. |

### Coupling And Interface Pressure Map

| Surface | Owns | Must Not Know | Current Coupling | Interface Needed | Deletion Test | Adjustment |
|---|---|---|---|---|---|---|
| `operation-lifecycle` | claim state, finality, orphan proof-gap creation, reconciliation side effects | transport, SDK, gateway credential policy | Spread across lifecycle, claim, reconciliation, proof-gap, storage, and tests | public area index | deleting it should force lifecycle meaning to reappear across gateway/reconciliation/storage | Extract first without schema sharding. |
| `object-registry` | object type union, ID selector, export/read posture | primitive guards or lifecycle meaning | central `schemas.ts` and `store.getObjectId` | registry entries | deleting it should break aggregation only | Implement second, before schema shards. |
| `transition-surface` | path, custody, schema, response, handler metadata | primitive guards or storage effects | route registry, app switch, SDK, OpenAPI | transition descriptor | deleting it should break transport binding only | Deepen after primitive owner exists. |
| transports | request parse, custody, context, protocol error mapping | policy/lifecycle/proof-gap/gateway semantics | Hono and SDK know transition routes | thin adapter contract | deleting a transport should not delete primitive behavior | Add import-posture checks. |
| storage adapters | atomic commit primitives | meaning of lifecycle states | D1/memory expose several indexes | typed commit primitives | deleting storage impl should not delete protocol meaning | Keep semantics in area modules. |

### Convergent Residue

| Residue | Seen In Futures | Seen By Roles | Severity | Reversibility | Evidence | Decision |
|---|---:|---:|---|---|---|---|
| Plan-only style is too weak | 3/7 | 2/7 | high | expensive | Future maintainer and docs drift futures | redesign |
| Schema sharding before registry creates drift | 4/7 | 3/7 | high | expensive | Object union and ID extraction remain central | narrow |
| `operation-lifecycle` can become a new mega-module | 3/7 | 3/7 | medium | contained | First slice crosses many behaviors | narrow |
| Object registry can become a god object | 3/7 | 2/7 | medium | contained | Registry aggregates package-wide concerns | narrow |
| Thin-adapter rule without tests is advisory | 4/7 | 4/7 | high | expensive | Transport import posture currently unguarded | redesign |

### Maintainer Traps

- Trap: future contributors cargo-cult folder shape without moving primitive ownership.
- Why this exists after success: the first extraction left schema ownership and compatibility shims for follow-up cleanup.
- Future cleanup trigger: object-registry lands and a second area extraction proves the pattern.

### Authority And Claim Risks

- Claim that may exceed enforcement: "Handshake now has modular protocol architecture" if only operation lifecycle is extracted.
- Boundary that future readers may misunderstand: transport caller custody is still entrypoint custody, not Handshake authority.
- Non-claim to preserve: ADR 0003 changes code ownership style only; it creates no public enforcement capability.

### Residue-Reducing Adjustments

| Adjustment | Residue Reduced | Mechanism | Owner Or Trigger | Status |
|---|---|---|---|---|
| Add ADR 0003 before source moves | Plan-only style ignored | ADR status and citation rule | Protocol owner | accepted |
| Keep schemas/inputs central until object registry | Schema sharding drift | Slice 1 constraint | 02d Slice 1 | accepted |
| Add import-posture check | Transport bypass drift | Test or scan closeout | 02d Slice 1 | accepted |
| Limit object registry to aggregation | Registry god object | ADR non-claim and plan sequence | 02d Slice 2 | accepted |
| Extract operation lifecycle only first | Big-bang blast radius | Behavior-preserving module index and shims | 02d Slice 1 | accepted |

### Chairman Synthesis

Decision: narrow.

Reason: keep the area-owned module direction, but make ADR 0003 canonical before
source moves and constrain the first source slice to behavior-preserving
operation lifecycle extraction.

Smallest next mechanism: create ADR 0003, then extract operation lifecycle behind
a public area index with compatibility re-exports and import-posture evidence.

## Architecture Review

### Issue 1: A Big-Bang Split Would Break The Kernel At The Worst Time

Current work already has pending 02c changes across schema, storage, HTTP, SDK,
tests, and docs. Moving every primitive area at once would obscure behavior
changes and make regression review weak.

Recommendation: extract `operation-lifecycle` first, because it already crosses
gateway check, reconciliation, proof gaps, operation claims, receipts, storage
indexes, and isolation.

```text
current:
  gateway-check-attempts.ts
  surface-operation-reconciliations.ts
  operation-lifecycle.ts
  protected-surface-operation-claims.ts
  proof-gaps.ts
  storage/store.ts
  tests/kernel.test.ts

target first slice:
  operation-lifecycle/
    lifecycle.ts
    claims.ts
    transitions.ts
    index.ts
```

Keep old public imports working through temporary re-exports where needed.

### Issue 2: Object Registry Must Be Designed Before Schema Shards Proliferate

If each area owns schemas without a registry, the discriminated union, ID
extraction, exports, raw-read posture, and OpenAPI wiring will drift.

Recommendation: create an `object-registry` design in the plan, but implement it
as the second extraction, after operation-lifecycle proves the local module
shape.

```text
area schema exports
  -> object-registry
       objectType
       schema
       id selector
       public export posture
       raw-read posture
  -> ProtocolRecord union
```

### Issue 3: Transition Surface Should Remain A Transport-Kernel Adapter

The transition route registry is already useful for HTTP/OpenAPI parity. The
risk is turning it into the new god object.

Recommendation: transition-surface should own transport-facing transition
metadata and handler binding, but not primitive meaning. It should point to
kernel methods or area transition descriptors; it should not duplicate guards.

```text
transition-surface owns:
  path
  custody role
  request schema
  response schema
  handler binding
  OpenAPI metadata

area module owns:
  what the transition means
  what records/events it creates
  what guards refuse it
```

## Code Quality Review

### Issue 4: File Movement Alone Will Not Improve Locality

Renaming `schemas.ts` into many schema files without moving constructors, guards,
events, and tests would make imports noisier without improving ownership.

Recommendation: every extraction must move at least one full primitive loop:

```text
schema -> input -> guard -> constructor -> transition -> events -> tests
```

If a proposed move does not improve that chain, do not do it.

### Issue 5: Cross-Area Imports Need A Rule Before The First Move

Without import rules, area modules will immediately reach into each other's
internals and recreate the current gravity wells in folder form.

Recommendation:

```text
allowed:
  area -> another area's public index
  area -> object-registry public aggregation
  kernel -> area public transition function
  transport -> transition-surface only

forbidden:
  transport -> area internals
  adapter -> storage internals
  area -> another area's private helpers
  storage -> protocol meaning
```

Enforce initially with review and targeted `rg` scans, not a new lint system in
the first slice.

## Test Review

### Test Diagram

```text
Refactor slice: operation-lifecycle

HTTP gateway route
  -> transition surface
  -> kernel.gatewayCheck
  -> gateway-gate transition
  -> operation-lifecycle claims active operation
  -> records gate/mutation/receipt/events

HTTP reconciliation route
  -> transition surface
  -> kernel.reconcileSurfaceOperation
  -> operation-lifecycle reconciles same mutation
       pending   -> claim remains active, finality pending
       succeeded -> claim terminal success, claim released
       refused   -> claim terminal refused, claim released
       failed    -> claim terminal failed, claim released or suspect per rule
       unknown   -> proof gap, isolation when required, claim remains blocking
  -> records reconciliation/proof-gap/isolation/events

Reference adapter
  -> protocol.gatewayCheck
  -> verified gate or no mutation
  -> provider-shaped surface mutation
  -> protocol.reconcileSurfaceOperation
```

### Required Tests

| Flow | Required coverage |
|---|---|
| Kernel in-memory | Existing `kernel.test.ts` lifecycle cases still pass after extraction. |
| D1 atomicity | Existing D1 tests still prove current claim and receipt indexes commit atomically. |
| HTTP route parity | Existing HTTP tests still prove transition route custody and request context. |
| Adapter no-mutation | Package install, repo write, and preview deploy still refuse mutation without verified gate. |
| Import posture | New architecture test or `rg` scan proves transports do not import area internals. |
| Object registry readiness | New snapshot or unit test proves protocol object registration is complete after extraction. |

### Test Plan Artifact For QA

No UI pages are affected. QA should treat this as protocol regression testing:

```text
Critical path 1: gateway check passes but receipt remains pending until reconciliation.
Critical path 2: second mutation on same protected surface refuses while active claim exists.
Critical path 3: unknown downstream finality records proof gap and does not claim success.
Critical path 4: reference adapters do not mutate when gateway check is refused or proof-gap.
Critical path 5: HTTP/OpenAPI/SDK behavior is unchanged after module extraction.
```

## Performance Review

This refactor should be behavior-preserving. It should not add new database
round trips, new stream partitions, new schema validation passes on hot gateway
paths, or runtime graph parsing.

Performance risk is mostly accidental:

- duplicate record loads after moving helpers;
- repeated digest computation during gateway check;
- widening D1 commit batches with redundant records;
- test-only registry scans accidentally entering runtime paths.

Recommendation: after the first extraction, compare gateway check and
reconciliation call paths before/after with code review and targeted tests. Do
not add benchmarking unless the implementation changes query count or digest
count.

## Failure Modes

| Failure mode | Test? | Handling? | User-visible result |
|---|---|---|---|
| Area extraction drops a guard and reconciliation accepts wrong idempotency key | Existing kernel test should cover | Protocol error | Clear refusal |
| Active operation claim release rule changes by accident | Needs focused regression test | Commit/index logic should refuse conflict | Clear second-mutation refusal |
| Unknown downstream state releases claim too early | Needs focused regression test | Lifecycle matrix should keep blocking | Clear proof gap/isolation |
| Transport imports area internals and bypasses kernel | Needs import posture test or scan | Review gate only at first | Silent architecture regression if untested |
| Object schema omitted from registry after sharding | Needs registry completeness test | Parse/read failure | Clear test failure before release |
| D1 and memory stores diverge on claim index behavior | Existing D1 plus memory tests should cover | Store commit result | Clear protocol refusal or test failure |

Critical gap if not added: import posture coverage. Without it, a future MCP or
CLI adapter could reach around the kernel while tests remain green.

## NOT In Scope

- No behavior changes to policy, greenlight, gateway check, or recovery semantics.
- No package split, workspace split, or TypeScript project-reference migration.
- No new public API, SDK method, MCP tool, CLI command, or OpenAPI route.
- No provider-side preview deploy enforcement claim.
- No new ADR beyond ADR 0003 for this slice.
- No cleanup of unrelated dirty worktree state.
- No full generated execution graph implementation from Plan 03.

## Implementation Sequence

### Slice 0: ADR And Architecture Documentation

1. Land ADR 0003 before source moves.
2. Land this plan with the play-the-tape review.
2. Update docs index plan chain.
3. Keep protocol docs as semantic references; ADR 0003 owns implementation style.

### Slice 1: Operation Lifecycle Extraction

1. Create `src/protocol/operation-lifecycle/`.
2. Move lifecycle matrix, operation claim construction, reconciliation transition,
   and operation-specific proof-gap creation behind one public module index.
3. Keep schemas and input schemas in the central files until object registry
   exists.
4. Leave compatibility re-exports from old files.
5. Do not change behavior.
6. Run focused lifecycle, kernel, D1, HTTP, adapter, import-posture, typecheck,
   build, and diff checks.

### Slice 2: Object Registry Extraction

1. Introduce registry entries for each protocol object.
2. Move object type union and ID extraction to registry aggregation.
3. Move schema/input definitions into area-owned files while keeping stable
   root compatibility aggregation.
4. Add registry completeness tests.

### Slice 3: Transition Surface Deepening

1. Bind transition metadata to kernel handler mapping from one source.
2. Keep primitive meaning in area modules.
3. Add route/OpenAPI/SDK parity tests.

### Slice 4: Full Area Migration

Move remaining protocol behavior behind public area indexes while preserving old
import paths as one-line compatibility shims:

- `runtime-evidence`;
- `intent-compilation`;
- `action-contract`;
- `policy-greenlight`;
- `protected-path-posture`;
- `gateway-gate`;
- `review-binding`;
- `receipt-export`;
- `recovery`;
- `isolation-breaker`;
- generic `proof-gap`.

Area modules use local `schemas.ts` and `inputs.ts` faces. The central schema
and input files remain compatibility aggregation for public imports and OpenAPI
wire stability.

## Open Decisions

### Accepted Decision 1: Where To Make The Style Canonical

ADR 0003 owns the durable module ownership rule. This plan owns implementation
sequencing and closeout evidence.

### Accepted Decision 2: First Extraction Target

Operation lifecycle is first. Object registry follows before schema sharding.
Transition surface deepening waits until primitive ownership is stable.

## Completion Summary

- Step 0: Scope Challenge — initial scope reduced to ADR 0003 plus one
  extraction slice; later expanded to full protocol-folder migration after
  operation-lifecycle proved the pattern.
- Architecture Review: 3 issues found.
- Code Quality Review: 2 issues found.
- Play-The-Tape Review: completed; decision is narrow.
- Test Review: diagram produced, 1 critical gap identified if import posture is untested.
- Performance Review: 0 blocking issues; avoid accidental duplicate loads/digests.
- NOT in scope: written.

## Implementation Closeout

Closeout state:

- `object-registry` owns protocol object metadata, object ID extraction, schema
  collection, export posture, raw-read posture, and contract/greenlight scope
  selectors.
- `storage/store.ts` keeps compatibility re-exports for object ID and scope
  helpers, but storage adapters no longer define protocol object meaning.
- `HandshakeKernel` imports area public indexes plus shared protocol core.
- Protocol area modules import other areas through public indexes only.
- Protocol area modules import `ProtocolStore` and related commit/read types
  through `src/protocol/store-port.ts`, not through the storage adapter package.
- Transport and SDK surfaces remain thin adapters over transition routes and
  public protocol types.
- `transition-route-registry.ts` now owns route path, caller-custody role,
  request schema, response schema, and kernel invoker parity in one transport
  transition seam. `app.ts` no longer carries a second switch over transition
  names.
- Deprecated root-level primitive shims were removed after internal imports
  moved to area public indexes.
- Area-local `types.ts` faces are local-only and expose the owning area's
  schema/input contracts plus shared core primitives. They no longer broker
  cross-area types.
- Root `schemas.ts` and `inputs.ts` are compatibility aggregators only. They no
  longer own primitive definitions, and protocol internals, storage adapters,
  reference adapters, and runtime wrappers no longer import through them.
- Import-posture tests now reject protocol-to-storage imports, wildcard area
  type faces, cross-area type brokering, protocol-internal root schema/input
  imports, storage/reference-adapter/runtime root compatibility imports,
  object-registry primitive logic creep, storage primitive-module imports,
  transport area-internal imports, and deprecated root primitive shims.
- HTTP tests now require every transition route to have exactly one invoker and
  matching OpenAPI security metadata.
- This refactor creates no new protocol version, route, SDK method, OpenAPI
  behavior, storage migration, or provider-side enforcement claim.
- What already exists: written.
- TODOs.md updates: none proposed yet; defer until plan acceptance.
- Failure modes: 1 critical gap flagged.
- Lake Score: 4/5 recommendations choose the complete option while avoiding a big-bang ocean.

## Remaining Gaps

- Root schema/input compatibility aggregators are still public. Removing or
  narrowing those exports is a separate deprecation decision, not part of this
  behavior-preserving refactor.
- `transition-route-registry.ts` remains the transport metadata seam for HTTP
  and OpenAPI. It is acceptable while thin, but it should not accumulate
  primitive meaning.
- Some area implementations are still dense. Future simplification should
  extract private helpers inside the owning area before adding more public
  files.

## Smallest Next Mechanism

Use the explicit area `types.ts` faces and `store-port.ts` as the next hard
quality gate. Future work must fail review if it reintroduces root primitive
files, wildcard area type faces, protocol imports from storage adapters, or
transport imports into area internals.
