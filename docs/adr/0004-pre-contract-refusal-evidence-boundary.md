# ADR 0004: Pre-Contract Refusal Evidence Boundary

Status: Implemented locally
Date: 2026-05-18
Owner: Protocol owner
Implementation owner: [`03-plan-eng-review-generated-execution-graph-coverage.md`](../plans/03-plan-eng-review-generated-execution-graph-coverage.md)
Narrows: [`0002-generated-execution-graph-coverage.md`](./0002-generated-execution-graph-coverage.md)
Resolves: `ADR-FU-0002-B`

## Invariant At Stake

Compiler uncertainty is not a proof gap.

Before an exact `ActionContract` exists, Handshake has not admitted a proposed
mutation into the authority path. A missing generated-execution graph, unsafe
graph sibling, unsupported node, ambiguous node, bypass-risk node, truncated
graph, untrusted graph issuer, or unredacted graph payload must refuse
compilation. It must not create a durable `ProofGap` in the existing proof-gap
lifecycle.

Authority still starts only here:

```text
ActionContract
  -> PolicyDecision
  -> one-use Greenlight
  -> GatewayCheckAttempt
```

Anything before that is candidate/refusal evidence, not post-admission evidence.

## Decision

Plan 03 will not emit durable pre-contract `ProofGap` records.

Pre-contract generated-execution coverage failure has two valid refusal shapes.

Missing graph evidence:

```text
RuntimeExecutionRecord
  -> no GeneratedExecutionGraph for this execution block
  -> IntentCompilationRecord(candidateStatus: rejected)
     refusalReasonCodes: ["generated_execution_graph_missing"]
  -> no ActionContract
  -> no PolicyDecision
  -> no Greenlight
  -> no GatewayCheckAttempt
  -> no ProofGap
```

Recorded but unsafe graph evidence:

```text
RuntimeExecutionRecord
  -> GeneratedExecutionGraph(unsafe | unsupported | bypass-risk | truncated)
  -> IntentCompilationRecord(candidateStatus: rejected)
     refusalReasonCodes: ["generated_execution_graph_not_contractable", ...]
  -> no ActionContract
  -> no PolicyDecision
  -> no Greenlight
  -> no GatewayCheckAttempt
  -> no ProofGap
```

The existing `ProofGap` lifecycle is reserved for missing, invalid, or uncertain
evidence after an exact action has entered the authority path:

```text
ActionContract admitted
  -> policy/gate/mutation/receipt/stream/recovery evidence missing or uncertain
  -> ProofGap
```

If a later product need requires durable pre-contract gap records, it must use a
separate ADR and a separate protocol object or explicitly redesigned lifecycle.
It must not overload the current post-contract `ProofGap` object.

## Boundary

The boundary is the existence of an exact `ActionContract`.

Before `ActionContract`:

- valid evidence objects: runtime execution, generated execution graph when one
  exists, intent compilation, rejected candidate, refusal reason codes,
  uncertainty markers, overreach reason codes;
- invalid authority objects: policy decision, greenlight, gateway check,
  mutation attempt, receipt, proof gap.

After `ActionContract`:

- valid proof-gap phases: policy, gate, mutation, receipt, stream, recovery;
- proof gaps may reference the admitted contract and any later gate, mutation,
  receipt, reconciliation, or recovery evidence.

The compiler may say:

```text
"This generated block cannot produce a contract."
```

It may not say:

```text
"This admitted action has a proof gap."
```

because no action has been admitted yet.

## Mechanism

Plan 03 must implement the decision with these protocol rules:

1. `GeneratedExecutionGraph` terminal statuses other than
   `fully_covered_no_unsupported_nodes` make the candidate non-contractable.
2. Missing graph evidence for a generated execution block must produce an
   explicit `generated_execution_graph_missing` refusal reason, not a synthetic
   graph record and not a proof gap.
3. Unsafe graph evidence must produce an explicit graph refusal reason such as
   `generated_execution_graph_not_contractable`, plus specific terminal reason
   codes for unsupported, bypass-risk, truncated, untrusted, or unredacted
   evidence.
4. `compileIntent` records uncertainty, overreach, graph coverage status when a
   graph exists, graph digest when a graph exists, node digest when a node exists,
   and refusal reason codes on the compilation/candidate path.
5. `proposeActionContract` refuses when graph coverage is missing, unsafe,
   stale, or drifted.
6. No transition in Plan 03 creates a `ProofGap` before an `ActionContract`
   exists.
7. The current `ProofGap` schema and helper must not advertise or accept a
   `compilation` phase unless a future ADR redesigns the object.

## Non-Claims

- This ADR does not claim generated graph coverage is implemented.
- This ADR does not add public graph APIs.
- This ADR does not add a pre-contract evidence-read API.
- This ADR does not make runtime execution records, generated graphs, command
  classifiers, review screens, or compiler refusals into authority.
- This ADR does not remove the requirement to record proof gaps after admitted
  action evidence goes missing or uncertain.

## Rejected Alternatives

### Reuse `ProofGap` For Compiler Coverage Gaps

Rejected. The current proof-gap object is anchored to an admitted
`ActionContract` and later lifecycle evidence. Reusing it before contract
proposal would make a compiler refusal look like the system had already admitted
an exact action.

That is evidence theatre.

### Add A `compilation` Phase To The Existing Proof-Gap Lifecycle

Rejected for Plan 03. A `compilation` phase implies a missing proof obligation
inside the same lifecycle as policy, gate, mutation, receipt, stream, and
recovery. The pre-contract compiler path is a different state machine.

### Keep The Question Open

Rejected. Leaving this open lets implementers choose the convenient object while
coding. The safer default is refusal evidence only. A future ADR can widen the
model if the product need becomes concrete.

## Consequences

Good:

- Compiler refusal remains a first-class product outcome.
- The proof-gap lifecycle stays tied to admitted actions.
- Plan 03 has a clear red test: missing or unsafe graph coverage produces zero
  action contracts and zero proof gaps.
- Future public evidence APIs can separate refusal evidence from post-contract
  proof gaps.

Cost:

- Operators cannot query all uncertainty through one `proof_gap` object.
- If pre-contract durable gaps become useful later, Handshake will need a new
  evidence object instead of reusing the current one.

That cost is acceptable. One generic uncertainty object would be easier to query
and easier to misuse.

## Proof Plan

Plan 03 owns implementation proof.

Acceptance evidence:

1. A `shell_exec_block` or `codemode_block` runtime execution with no
   `GeneratedExecutionGraph` cannot produce an `ActionContract`.
2. The same missing-graph path creates no synthetic `GeneratedExecutionGraph` and
   no `ProofGap`.
3. Unsafe graph statuses create rejected compilation/candidate evidence, not
   proof gaps.
4. Missing graph and unsafe graph refusals have distinguishable refusal reason
   codes.
5. `ProofGap` no longer exposes `compilation` as a valid phase in the current
   protocol schema.
6. Receipt, mutation, stream, and recovery proof-gap tests still pass for
   admitted action paths.

Smallest next mechanism: add the Plan 03 red test for "missing generated graph
coverage creates no action contract and no proof gap."
