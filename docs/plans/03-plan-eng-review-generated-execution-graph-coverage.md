# Plan 03: Generated Execution Graph Coverage Boundary

Status: Proposed implementation plan
Date: 2026-05-18
Owner: Protocol owner
References:

- [`../specs/00-product-requirements-spine.md`](../specs/00-product-requirements-spine.md)
- [`../adr/0001-kernel-evidence-boundaries.md`](../adr/0001-kernel-evidence-boundaries.md)
- [`../adr/0002-generated-execution-graph-coverage.md`](../adr/0002-generated-execution-graph-coverage.md)
- [`../runtime-integration.md`](../runtime-integration.md)
- [`vercel-labs/json-render`](https://github.com/vercel-labs/json-render) source
  study at commit `0bbe6ed`

## Invariant At Stake

Generated programs must not get partial credit.

If an agent emits a shell block, codemode block, or generated tool program, the
system must not let one clean-looking candidate become an `ActionContract` while
unsupported, ambiguous, or bypass-prone sibling nodes remain inside the same
generated execution block.

## Summary

Implement ADR 0002 in a TDD-first kernel slice.

This plan adds a durable generated execution graph coverage boundary between
`RuntimeExecutionRecord` and `IntentCompilationRecord`. It is intentionally not a
full shell parser. The first slice supports literal command-list graph evidence and
refuses contract proposal for unsupported shell strings, mixed coverage, bypass
risk, or missing graph coverage.

## json-render Architecture Lessons To Carry Forward

`json-render` is not the product model. It is the architecture proof that generated
output can be useful only when constrained by schema, catalog, registry, and
structural validation.

For Handshake, the adapted control stack is:

```text
json-render: schema -> catalog -> registry -> renderer/action handler
Handshake:   graph schema -> action catalog -> gateway registry -> gateway check
```

The source-level lessons that affect this plan:

| Lesson From json-render | Handshake Implementation Rule |
|---|---|
| Specs validate against a schema derived from a catalog. | Graph records must validate against a schema and pinned catalog snapshot before candidate extraction. |
| Component/action names come from a catalog. | Generated nodes must resolve to known tool capability and action type identifiers. |
| Runtime behavior comes from a registry, not from the generated JSON alone. | Contractable nodes must resolve to gateway registry entries and registry binding digests. |
| Streaming JSONL patches progressively build a spec. | Streamed/intermediate execution graph patches are evidence only; final graph validation gates candidates. |
| `on`, `watch`, and action chains can fire secondary actions. | Hidden triggers, callbacks, retries, watchers, and chained actions must become graph nodes or force refusal. |
| Devtools/action observers record dispatch and settle events. | Observers are audit evidence only; they cannot satisfy gateway authority or graph coverage. |
| Strict structured-output schemas have gaps for dynamic records. | Prompt-only structure is not enough for authority-critical records; unknown graph fields refuse. |

If a future review UI renders the contract, it must render the exact
`ActionContract` and graph/node digests that policy and gateway check use. A
json-render-style screen that summarizes the plan but is not structurally bound to
the contract is review theatre.

## Planning Gate

| Gate | Answer |
|---|---|
| Doctrine tier | Tier 1 protocol foundation, unlocking Tier 2 runtime integration truth. |
| Protected action path | Generated execution block -> graph coverage -> candidate -> action contract -> policy -> greenlight -> gateway check. |
| Agentic execution shape | `shell_exec_block` first; later codemode blocks may reuse the graph model. |
| Runtime posture | `bounded_generation` or `hook_assisted` evidence only. |
| Protected surface | None directly in slice 1; contractable nodes may point at existing package install or repo write action types. |
| Mutation authority holder | Existing gateway adapter for the action class, never the graph parser or runtime. |
| Gateway authority holder | Existing `GatewayRegistryEntry.gatewayAuthorityHolderRef`. |
| Candidate extraction | A candidate can exist only for a graph node classified `candidate_action_eligible` inside a fully covered block. |
| Contract binding | Runtime execution digest, graph digest, node digest, catalog digest, gateway registry digest, params digest, and envelope digest. |
| Gateway enforcement | Unchanged: exact one-use greenlight checked before mutation. |
| Bypass posture | Raw shell remains advisory unless credentials are absent or gateway-owned. Unsupported/bypass nodes block contracts. |
| Refusal and recovery | Structured compile refusal, no action contract. Recovery is a fresh future candidate, not reuse. |
| Evidence | Runtime execution record, generated execution graph, intent compilation refusal or candidate, action contract when clean. |
| Operator value | Teams can see why a generated block was refused before consequence. |
| Acceptance test | A shell block with one eligible node and one unsupported sibling emits no action contract. |
| Non-claim | This does not parse arbitrary shell or control raw terminal execution. |
| Unlock | Safe next work on Hermes/codemode wrappers and protected CLI/MCP proposal surfaces. |
| Quality Contract | See below. |

## What Already Exists

| Existing Piece | Reuse |
|---|---|
| `RuntimeExecutionRecord` | Keep as aggregate execution evidence and graph parent. |
| `IntentCompilationRecord` | Extend as the candidate evidence object that pins graph coverage. |
| `CandidateAction` | Extend to carry graph/node binding for generated execution. |
| `ActionContract` | Extend to carry graph/node binding after proposal. |
| `guardActionProposal` | Add graph coverage guard rather than creating a separate proposal path. |
| `codemode-multi-action` wrapper | Keep as structured generated-program proof, but do not treat it as graph coverage. |
| Package install and repo write fixtures | Use as known action classes for contractable node tests. |
| Generic `protocol_records` storage | Reuse for the new graph object; no table migration required beyond schema/object-type support. |

## Not In Scope

- Full POSIX shell parsing. First slice only accepts literal command-list graph evidence.
- Pipes, redirects, expansion, package scripts, nested interpreters, or dataflow taint.
- Runtime plugin distribution for Hermes, Codex, Claude Code, or MCP.
- HTTP, SDK, and OpenAPI exposure in slice 1.
- Pre-contract durable `ProofGap` lifecycle.
- UI review renderer changes.
- SpecStream-like progressive graph rendering or UI streaming.
- Hosted Cloud operation.

## Architecture

```text
generated shell/program block
  |
  v
RuntimeExecutionRecord
  executionShape: shell_exec_block
  executionBlockDigest: sha256:...
  |
  v
GeneratedExecutionGraph
  graphDigest: sha256:...
  registryBindingSetDigest: sha256:...
  coverageStatus: fully_covered_no_unsupported_nodes
  entryNodeIds: [1]
  nodes:
    [1] candidate_action_eligible -> package.install -> binding sha256:...
    [2] read_only
  |
  v
IntentCompilationRecord
  candidateAction.generatedExecutionGraphDigest
  candidateAction.generatedExecutionNodeDigest
  |
  v
ActionContract
  pins runtimeExecutionDigest
  pins graphDigest
  pins nodeDigest
  pins catalogSnapshotDigest
  pins gatewayRegistrySnapshotDigest
  pins registryBindingSetDigest
  pins nodeGatewayBindingDigest
```

Failure path:

```text
RuntimeExecutionRecord(shell_exec_block)
  -> GeneratedExecutionGraph(unsupported_or_ambiguous)
  -> IntentCompilationRecord(candidateStatus: rejected)
  -> no ActionContract
```

Mixed sibling failure path:

```text
node 1: candidate_action_eligible
node 2: unsupported

coverageStatus: unsupported_or_ambiguous
result: whole block refuses; node 1 cannot produce a contract
```

## Module Boundaries

| Module | Responsibility | Must Not Do |
|---|---|---|
| `src/protocol/schemas.ts` | Define graph, node, coverage, and binding schemas. | Decide policy or parse shell semantics. |
| `src/protocol/inputs.ts` | Accept graph recording input and candidate graph refs. | Accept raw script as proof of safety. |
| `src/protocol/generated-execution-graphs.ts` | Create graph evidence records and digest material. | Emit contracts, policy, greenlights, or receipts. |
| `src/protocol/generated-execution-validation.ts` | Validate graph structure, roots, children, hidden triggers, registry binding, and coverage status. | Treat prompt instructions as schema. |
| `src/protocol/intent-compilation.ts` | Reject candidates when graph coverage is missing or unsafe. | Treat graph evidence as permission. |
| `src/protocol/action-contracts.ts` | Re-check pinned graph/node digests before proposal. | Trust caller-supplied coverage without loading graph. |
| `src/protocol/transitions.ts` | Centralize coverage guard behavior. | Add runtime-specific parser logic. |
| `src/runtime/*` | Supply graph evidence from runtime wrappers later. | Hold gateway authority or mutate protected surfaces. |

## Data Model

Add `GeneratedExecutionGraph` as a lifecycle-owned protocol object.

Minimum fields:

```text
generatedExecutionGraphId
runtimeExecutionId
executionBlockDigest
graphSchemaVersion
parserVersion
supportedGrammarVersion
coverageValidatorVersion
graphDigest
coverageStatus
terminalReasonCodes
entryNodeIds[]
edges[]
nodeCount
edgeCount
truncationStatus
catalogSnapshotDigest
gatewayRegistrySnapshotDigest
registryBindingSetDigest
nodes[]
```

Candidate/action binding fields:

```text
generatedExecutionGraphId
generatedExecutionGraphDigest
generatedExecutionNodeDigest
generatedExecutionCoverageStatus
generatedExecutionCatalogSnapshotDigest
generatedExecutionGatewayRegistrySnapshotDigest
generatedExecutionRegistryBindingSetDigest
generatedExecutionNodeGatewayBindingDigest
```

Do not let callers directly insert graph records through catalog registration.
Use a transition method so the graph digest and event are lifecycle-owned.

## DevEx Plan

Primary developer:

```text
Runtime/gateway integrator adding Handshake to an agent execution environment.
```

Their first useful experience should be:

```text
1. record a shell execution block
2. record graph coverage
3. try to propose a candidate
4. receive either an exact contract or a structured refusal reason
```

The refusal message should explain:

```text
problem: graph coverage is not clean
cause: unsupported syntax, bypass risk, missing graph, or unsafe sibling node
fix: emit literal command-list graph evidence or route through a protected capability
```

Do not make integrators learn all protocol internals before their first refusal.
Expose helper fixtures in tests before adding public SDK helpers.

Mirror the useful json-render mental model without copying its authority model:

```text
defineActionCatalog(...)        -> declared consequential action types
defineGatewayRegistry(...)      -> gateway-backed implementation bindings
recordGeneratedExecutionGraph() -> generated block coverage evidence
proposeActionContract()         -> exact candidate only after clean coverage
```

Do not expose an observer/devtools API as the first integration surface. That would
teach the wrong boundary.

## TDD Rules

Use vertical slices. One red test, minimal implementation, then the next red test.

Tests should exercise public kernel/client behavior, not private parser functions.

Do not write all graph tests first. The graph shape should harden as each behavior
forces it.

## Test Diagram

```text
T1: shell runtime without graph
  RuntimeExecutionRecord(shell_exec_block)
    -> compileIntent(candidate)
    -> candidate rejected OR proposal refused
    -> action_contract count stays 0

T2: graph unsupported
  RuntimeExecutionRecord(shell_exec_block)
    -> GeneratedExecutionGraph(unsupported_or_ambiguous)
    -> compileIntent(candidate)
    -> rejected: generated_execution_graph_not_contractable

T3: graph fully covered
  RuntimeExecutionRecord(shell_exec_block)
    -> GeneratedExecutionGraph(fully_covered_no_unsupported_nodes)
    -> compileIntent(candidate for node digest)
    -> proposeActionContract
    -> ActionContract pins graph + node digest

T4: mixed sibling
  node 1 eligible, node 2 unsupported
    -> coverageStatus unsupported_or_ambiguous
    -> no ActionContract for node 1

T5: graph drift
  candidate pins graph digest A
    -> durable graph digest B loaded at proposal
    -> proposal refuses before ActionContract

T6: catalog or registry miss
  node says package.install
    -> action catalog or gateway registry snapshot lacks binding
    -> proposal refuses before ActionContract

T7: hidden trigger
  generated spec contains watch/onSuccess/callback-like secondary action
    -> compiler cannot model it as a node
    -> coverageStatus contains_coverage_gap OR contains_bypass_risk
    -> no ActionContract

T8: observer evidence is insufficient
  action observer/devtools event records dispatch
    -> no clean graph and no gateway registry binding
    -> no ActionContract

T9: truncated graph
  generated block exceeds node or edge bound
    -> truncationStatus truncated
    -> coverageStatus contains_coverage_gap
    -> no ActionContract
```

## Implementation Slices

### Slice 0: ADR And Plan

- Add ADR 0002.
- Add this plan.
- Update docs index pointers.
- Run docs verification.

### Slice 1: Kernel Graph Lifecycle

Files:

- `src/protocol/schemas.ts`
- `src/protocol/inputs.ts`
- `src/protocol/generated-execution-graphs.ts`
- `src/protocol/kernel.ts`
- `src/protocol/transitions.ts`
- `src/storage/store.ts`
- `test/kernel.test.ts`

Tasks:

- Add graph and node schemas.
- Add `recordGeneratedExecutionGraph(...)`.
- Add protocol record type and object id mapping.
- Add stream event type `generated_execution_graph_recorded`.
- Add strict graph validator for root/node topology, unknown fields, and registry
  binding requirements.
- Add graph bounds so over-limit or truncated graphs cannot report clean coverage.
- Add graph coverage guard for `shell_exec_block`.
- Add red-green tests T1, T2, T6, T8, and T9 first.

### Slice 2: Candidate And Contract Binding

Files:

- `src/protocol/schemas.ts`
- `src/protocol/inputs.ts`
- `src/protocol/intent-compilation.ts`
- `src/protocol/action-contracts.ts`
- `test/kernel.test.ts`

Tasks:

- Add graph/node binding fields to candidate and contract.
- Bind graph digest into candidate digest material.
- Bind graph, node, catalog snapshot, gateway registry snapshot,
  registry-binding-set, and node-specific gateway binding digests into action
  contract digest material.
- Re-load graph at proposal and refuse drift.
- Add red-green tests T3, T4, T5, and T7.

### Slice 3: D1/Hono/SDK Surface

Only after Slice 1 and Slice 2 are green:

- add HTTP route;
- add SDK method;
- update OpenAPI;
- add D1/Hono tests;
- update docs.

This is deliberately out of slice 1 so the kernel contract hardens first.

## Failure Modes

| Failure Mode | Expected Behavior | Test |
|---|---|---|
| Shell block has no graph | Candidate cannot become contract. | T1 |
| Graph has unsupported node | Whole block refuses before contract. | T2 |
| Eligible node has unsupported sibling | Whole block refuses before contract. | T4 |
| Node action missing catalog or registry binding | Proposal refuses before contract. | T6 |
| Hidden trigger or secondary action not modeled | Whole block refuses before contract. | T7 |
| Observer/devtools event exists without clean graph | Candidate cannot become contract. | T8 |
| Graph is over limit or truncated | Whole block refuses before contract. | T9 |
| Caller lies about graph digest | Proposal refuses before contract. | T5 |
| Graph parser calls itself enforcement | Docs and code non-claims reject this. | targeted scan |
| Raw shell still has credentials | Product state remains advisory/bypass-risk. | later install-health test |
| Literal command graph is clean | Contract pins graph and node digests. | T3 |

Critical gap if missed:

```text
A contract can be proposed from one node in a generated block while another node
is unsupported, ambiguous, bypass-prone, or unobserved.
```

## Quality Contract

| Lens | Applies? | Target | Hard Stops | Evidence Required | Closeout |
|---|---:|---:|---|---|---|
| Product / CEO | yes | hard gate | Plan claims arbitrary shell/codemode control. | ADR non-claims and spine gate. | planned |
| Engineering | yes | hard gate | Contract proposal skips graph coverage for shell blocks. | T1-T9 pass. | planned |
| Security / CSO | yes | hard gate | Unsupported/bypass/proof-gap-like coverage counts as safe. | Refusal tests and scans. | planned |
| DevEx | yes | 8/10 | Refusal lacks problem/cause/fix. | Structured refusal codes and docs text. | planned |
| Design | no | n/a | No UI surface. | Not applicable. | planned |
| Architecture | yes | 8/10 | Graph object duplicates authority or creates parallel proposal path. | Module boundary table and guard reuse. | planned |
| Domain Invariant | yes | hard gate | Generated execution becomes permission. | Candidate/contract digest binding tests. | planned |

## Test Plan

Red-green commands during implementation:

```bash
bun test test/kernel.test.ts
bun test
npm run typecheck -- --pretty false
git diff --check
```

Docs and theatre scans:

```bash
rg -n "advisory only|approval only|dashboard-first|audit-only|runtime permission|safe agents" docs src test
rg -n "codemode_shell_block" docs src test
rg -n "GeneratedExecutionGraph|fully_covered_no_unsupported_nodes|generated execution graph|node digest" docs src test
rg -n "review theatre|evidence theatre|registryBindingSetDigest|observer.*authority|devtools.*authority" docs src test
```

No typecheck/build claim should be made until code implementation starts.

## Acceptance

- ADR 0002 exists and owns the generated graph coverage decision.
- The kernel refuses shell execution candidates without clean graph coverage.
- Contracts pin runtime execution, graph, and node digests.
- Contracts pin catalog, gateway registry, registry-binding-set, and node-specific
  gateway binding digests.
- Mixed coverage blocks refuse as a whole.
- Hidden triggers and observer-only evidence cannot satisfy graph coverage.
- Truncated graphs cannot report clean coverage.
- Existing package-install, repo-write, preview-deploy, and codemode tests still pass.
- Public docs do not claim arbitrary shell control.

## Open Questions

- Should `codemode_block` require graph coverage in the same implementation or in
  a later ADR-backed slice?
- Should pre-contract coverage gaps eventually emit durable `ProofGap` records, or
  remain graph refusal evidence?
- Should literal command-list graph evidence be accepted only from protected
  runtime wrappers, or can tests construct it directly through the kernel?
- Which helper should become the first public DevEx surface: SDK helper,
  CLI diagnostic, or runtime wrapper fixture?

## Smallest Next Mechanism

Start the first TDD tracer bullet:

```text
RED: a shell_exec_block runtime execution with no GeneratedExecutionGraph cannot
produce an ActionContract.
```
