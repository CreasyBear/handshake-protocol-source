# Plan 03: Generated Execution Graph Coverage Boundary

Status: Proposed implementation plan
Date: 2026-05-18
Owner: Protocol owner
References:

- [`../specs/00-product-requirements-spine.md`](../specs/00-product-requirements-spine.md)
- [`../adr/0001-kernel-evidence-boundaries.md`](../adr/0001-kernel-evidence-boundaries.md)
- [`../adr/0002-generated-execution-graph-coverage.md`](../adr/0002-generated-execution-graph-coverage.md)
- [`../adr/0004-pre-contract-refusal-evidence-boundary.md`](../adr/0004-pre-contract-refusal-evidence-boundary.md)
- [`../protocol/runtime-integration.md`](../protocol/runtime-integration.md)
- [`vercel-labs/json-render`](https://github.com/vercel-labs/json-render) source
  study at commit `0bbe6ed`
- [`Dicklesworthstone/destructive_command_guard`](https://github.com/Dicklesworthstone/destructive_command_guard)
  source study at commit `9a886a8`

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
full shell parser. The first slice supports literal command-list graph evidence
for shell execution and structured action-list graph evidence for the existing
codemode multi-action wrapper. It refuses contract proposal for unsupported shell
strings, mixed coverage, bypass risk, stale or self-asserted graph evidence, or
missing graph coverage.

Because this changes protocol record shapes and contractability rules, the
implementation is an alpha-breaking schema change and must bump the protocol and
package version from `0.2.3` to `0.2.4` with schemas, docs, fixtures, OpenAPI, and
tests updated together.

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

## destructive_command_guard Lessons To Carry Forward

`destructive_command_guard` is the right nearby source to study because it treats
agent shell commands as hostile strings, not friendly traces. It also shows why a
hook guard is insufficient as Handshake authority.

Lessons to carry forward:

| Lesson From destructive_command_guard | Handshake Implementation Rule |
|---|---|
| It normalizes command strings, strips wrappers, checks compounds, scans heredocs/inline scripts, and keeps a bypass-attempt corpus. | Use its corpus shape as hostile fixture inspiration for unsupported graph nodes and bypass-risk tests. |
| It emits rule IDs, pack IDs, severity, confidence, remediation, allow-once codes, and protocol-specific hook outputs. | Store command-risk classifier evidence as structured evidence refs with rule/bypass/fail-open posture. |
| It supports allowlists, allow-once, `--force`, agent profiles, `DCG_BYPASS`, and graduated responses. | Any bypass or downgrade posture must prevent clean graph coverage unless the same node maps to an exact gateway-bound action. |
| It is explicitly fail-open for deadlines, parse errors, oversized input, unsupported languages, and hook problems. | Fail-open classifier evidence becomes `contains_coverage_gap` or `contains_bypass_risk`; it cannot become `fully_covered_no_unsupported_nodes`. |
| Its Codex/Hermes/Grok paths differ by stdout/stderr/exit-code contract. | Runtime adapters must preserve the protocol output shape that made a refusal stick; failed-hook symptoms are evidence gaps. |

The critical non-copy: a dcg `allow` or no-match result means "this classifier did
not block under this config." It does not mean "the action is authorized."

## Planning Gate

| Gate | Answer |
|---|---|
| Doctrine tier | Tier 1 protocol foundation, unlocking Tier 2 runtime integration truth. |
| Protected action path | Generated execution block -> graph coverage -> candidate -> action contract -> policy -> greenlight -> gateway check. |
| Agentic execution shape | `shell_exec_block` and `codemode_block` generated programs both require graph coverage before contract proposal. |
| Runtime posture | `bounded_generation` or `hook_assisted` evidence only. |
| Protected surface | None directly in slice 1; contractable nodes may point at existing package install or repo write action types. |
| Mutation authority holder | Existing gateway adapter for the action class, never the graph parser or runtime. |
| Gateway authority holder | Existing `GatewayRegistryEntry.gatewayAuthorityHolderRef`. |
| Candidate extraction | A candidate can exist only for a graph node classified `candidate_action_eligible` inside a fully covered block. |
| Contract binding | Runtime execution digest, graph digest, node digest, catalog digest, gateway registry digest, registry-binding-set digest, node gateway binding digest, params digest, and envelope digest. |
| Gateway enforcement | Unchanged: exact one-use greenlight checked before mutation. |
| Bypass posture | Raw shell and destructive-command guards remain advisory unless credentials are absent or gateway-owned. Unsupported, guard-fail-open, allowlist, allow-once, force, env-bypass, and bypass-risk nodes block clean coverage. |
| Refusal and recovery | Structured compile refusal, no action contract. Recovery is a fresh future candidate, not reuse. |
| Evidence | Runtime execution record, generated execution graph, intent compilation refusal or candidate, action contract when clean. |
| Operator value | Teams can see why a generated block was refused before consequence. |
| Acceptance test | A shell or codemode block with one eligible node and one unsupported sibling emits no action contract. |
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
| `codemode-multi-action` wrapper | Upgrade as the first structured codemode graph producer. Current partial-success behavior is expected to change: one refused sibling blocks all contracts from that generated block. |
| Package install and repo write fixtures | Use as known action classes for contractable node tests. |
| Generic `protocol_records` storage | Reuse for the new graph object; no table migration required beyond schema/object-type support. |

## Not In Scope

- Full POSIX shell parsing. First slice only accepts literal command-list graph evidence.
- Pipes, redirects, expansion, package scripts, nested interpreters, or dataflow taint.
- Runtime plugin distribution for Hermes, Codex, Claude Code, or MCP.
- HTTP, SDK, and OpenAPI exposure in slice 1.
- New public graph API. Slice 1 may add kernel/runtime-wrapper methods only.
- Pre-contract durable `ProofGap` lifecycle.
- UI review renderer changes.
- SpecStream-like progressive graph rendering or UI streaming.
- Hosted Cloud operation.

## Architecture

```text
generated shell/codemode program block
  |
  v
RuntimeExecutionRecord
  executionShape: shell_exec_block | codemode_block
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

## Module Seams

| Module | Responsibility | Must Not Do |
|---|---|---|
| `src/protocol/generated-execution-graph/` | Own graph schemas, input schemas, graph recording, issuer context, redaction checks, command-risk classifier posture, topology validation, graph limits, digest material, coverage status, and contractability result. | Emit contracts, policy, greenlights, receipts, parser-specific shell semantics, or shallow helpers that callers must compose correctly. |
| `src/protocol/schemas.ts` | Compatibility export for graph, node, coverage, and binding schemas. | Decide policy or parse shell semantics. |
| `src/protocol/inputs.ts` | Compatibility export for graph recording input and candidate graph refs. | Accept raw script as proof of safety. |
| `src/protocol/intent-compilation/` | Reject candidates when graph coverage is missing or unsafe. | Treat graph evidence as permission. |
| `src/protocol/action-contract/` | Re-check pinned graph/node digests before proposal. | Trust caller-supplied coverage without loading graph. |
| `src/protocol/transitions.ts` | Centralize coverage guard behavior. | Add runtime-specific parser logic. |
| `src/runtime/*` | Supply graph evidence from runtime wrappers later. | Hold gateway authority or mutate protected surfaces. |

Deletion test: if `src/protocol/generated-execution-graph/` is deleted,
issuer checks, redaction posture, command-risk classifier posture, graph limits,
topology validation, and contractability rules should not reappear across callers.
If they do, the module is too shallow and the seam is wrong.

Do not introduce `generated-execution-coverage.ts` or
`generated-execution-validation.ts` in the first slice unless the single graph
module becomes unreviewable. The current codebase favors one transition module per
protocol object. Split later only when duplication or file size proves it.

## Data Model

Add `GeneratedExecutionGraph` as a lifecycle-owned protocol object.

Minimum fields:

```text
generatedExecutionGraphId
runtimeExecutionId
executionBlockDigest
graphIssuerRef
graphIssuerAuthority
graphIssuedAt
graphNonce
graphInputDigest
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
maxNodeCount
maxEdgeCount
maxDepth
graphByteSize
maxGraphByteSize
truncationStatus
catalogSnapshotDigest
gatewayRegistrySnapshotDigest
registryBindingSetDigest
nodes[]
```

Minimum node classifier fields:

```text
commandRiskClassifierRefs[]
commandRiskClassifierPosture
commandRiskRuleRefs[]
commandRiskBypassRefs[]
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

Graph issuer custody is not a request-body field.

The transition must receive a trusted `GraphEvidenceIssuerContext` from the host,
kernel caller, or future HTTP caller-custody layer:

```text
graphIssuerRef
graphIssuerAuthority
callerCustodyRole
tenantId
organizationId
runtimeAdapterId
runId
issuedAt
```

The graph payload may describe observed source refs, but it cannot self-assert
issuer authority. A missing issuer context, wrong runtime adapter, wrong run,
wrong tenant/org, stale nonce, or input digest mismatch refuses before the graph
record commits.

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
cause: unsupported syntax, bypass risk, missing graph, unsafe sibling node,
unauthorized graph issuer, graph limit exceeded, incomplete redaction,
classifier failed open, classifier bypass posture, or classifier evidence is
advisory-only
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
    -> proof_gap count stays 0

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

T10: graph issuer mismatch
  graph evidence issuer does not match runtime adapter/run/tenant authority
    -> graph recording refuses OR coverageStatus contains_refusal
    -> no ActionContract

T11: secret-bearing argv/source material
  graph node contains raw token-like argv, stdin, env, or source span material
    -> coverageStatus contains_refusal
    -> no ActionContract

T12: destructive command guard evidence is advisory
  classifier result is allow/no-match
    -> cannot make a missing/unsafe graph contractable
  classifier result is deny/warn/fail-open/allowlist/allow-once/bypass
    -> coverageStatus contains_refusal OR contains_coverage_gap OR contains_bypass_risk
    -> no ActionContract unless the node also maps to exact gateway-bound action

T13: codemode whole-block partial credit is forbidden
  codemode program actions:
    node 1 package.install eligible
    node 2 repo.write unwrapped or unsupported
  existing behavior would propose node 1 and refuse node 2
    -> new behavior: coverageStatus contains_refusal OR contains_bypass_risk
    -> no ActionContract for either node
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
- `src/protocol/generated-execution-graph/`
- `src/protocol/kernel.ts`
- `src/protocol/object-registry/`
- `test/generated-execution-graph.test.ts`

Tasks:

- Bump protocol/package version to `0.2.4`.
- Add graph and node schemas.
- Add `createGeneratedExecutionGraph(input, issuerContext)`.
- Add protocol record type and object id mapping.
- Add stream event type `generated_execution_graph_recorded`.
- Add graph issuer custody, same-scope binding, nonce, and replay checks.
- Add redaction validation for argv, source spans, stdin, and environment
  posture.
- Add command-risk classifier evidence fields and advisory-only posture handling.
- Add strict graph validator for root/node topology, unknown fields, and registry
  binding requirements.
- Add graph bounds so over-limit or truncated graphs cannot report clean coverage.
- Add graph coverage guard for `shell_exec_block` and `codemode_block`.
- Add red-green tests T1, T2, T6, T8, T9, T10, T11, and T12 first.

### Slice 2: Candidate And Contract Binding

Files:

- `src/protocol/schemas.ts`
- `src/protocol/inputs.ts`
- `src/protocol/intent-compilation/`
- `src/protocol/action-contract/`
- `src/runtime/codemode-multi-action/wrapper.ts`
- `src/runtime/package-install/tool-wrapper.ts`
- `src/runtime/repo-write/tool-wrapper.ts`
- `test/kernel.test.ts`
- `test/codemode-multi-action-runtime.test.ts`

Tasks:

- Add graph/node binding fields to candidate and contract.
- Bind graph digest into candidate digest material.
- Bind graph, node, catalog snapshot, gateway registry snapshot,
  registry-binding-set, and node-specific gateway binding digests into action
  contract digest material.
- Re-load graph at proposal and refuse drift.
- Update the codemode wrapper to create one runtime execution and one graph for
  the whole generated program, then pass graph/node bindings into child
  compilations.
- Add red-green tests T3, T4, T5, T7, and T13.

Implemented in the first v0.2.4 slice:

- Candidate and contract schemas now carry graph/node binding fields.
- `compileIntent` refuses `shell_exec_block` and `codemode_block` candidates
  without clean graph coverage and exact node binding.
- `proposeActionContract` reloads the graph and refuses coverage, runtime,
  node digest, and node gateway-binding drift.
- T1, T2, T3, T4, T7, T8, T9, T10, T11, and T12 are covered in
  `test/generated-execution-graph.test.ts`.
- The local preview-deploy fixture now records a clean codemode graph node before
  proposing its preview contract, so it does not bypass the new boundary.

Still open before Plan 03 closes:

- T5 explicit durable graph drift fixture.
- T6 catalog or gateway registry miss at node binding.
- T13 codemode multi-action whole-block partial-credit refusal.
- Runtime wrapper graph production beyond the local preview fixture and any
  public HTTP/SDK/OpenAPI surface.

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
| Shell block has no graph | Candidate cannot become contract and no proof gap is created. | T1 |
| Graph has unsupported node | Whole block refuses before contract. | T2 |
| Eligible node has unsupported sibling | Whole block refuses before contract. | T4 |
| Node action missing catalog or registry binding | Proposal refuses before contract. | T6 |
| Hidden trigger or secondary action not modeled | Whole block refuses before contract. | T7 |
| Observer/devtools event exists without clean graph | Candidate cannot become contract. | T8 |
| Graph is over limit or truncated | Whole block refuses before contract. | T9 |
| Graph issuer is unauthorized or wrong-scope | Graph refuses or cannot become contract. | T10 |
| Graph contains unredacted secret-bearing material | Whole block refuses before contract. | T11 |
| Destructive-command guard says allow/no-match | Classifier result cannot make graph coverage clean. | T12 |
| Destructive-command guard fails open, is bypassed, or is allowlisted | Whole block records coverage gap, bypass risk, or refusal. | T12 |
| Codemode generated program has one refused sibling | Whole block refuses; no partial action contract is proposed. | T13 |
| Caller lies about graph digest | Proposal refuses before contract. | T5 |
| Graph parser calls itself enforcement | Docs and code non-claims reject this. | targeted scan |
| Raw shell still has credentials | Product state remains advisory/bypass-risk. | later install-health test |
| Literal command graph is clean | Contract pins graph and node digests. | T3 |

Critical gap if missed:

```text
A contract can be proposed from one node in a generated block while another node
is unsupported, ambiguous, bypass-prone, or unobserved.
```

## Performance And Abuse Bounds

Graph evidence is untrusted input. Apply cheap limits before expensive canonical
digesting or deep validation:

```text
raw request bytes
  -> maxGraphByteSize pre-check
  -> schema parse
  -> node/edge/depth limits
  -> redaction posture check
  -> digest
  -> commit
```

Hard requirements:

- `maxGraphByteSize`, `maxNodeCount`, `maxEdgeCount`, and `maxDepth` are protocol
  fields and validator constants.
- Over-limit graphs cannot produce `fully_covered_no_unsupported_nodes`.
- Redaction validation must not rely on expensive broad regex scans over unbounded
  source material. First slice should prefer explicit redacted fields and reject
  raw argv/stdin/env/source material for consequential nodes.
- D1 writes remain a single `batch()` commit through `ProtocolRecorder`; no read
  after write is required inside the same graph-recording transition.

## Quality Contract

| Lens | Applies? | Target | Hard Stops | Evidence Required | Closeout |
|---|---:|---:|---|---|---|
| Product / CEO | yes | 8/10 | Plan claims arbitrary shell/codemode control or omits bypass/non-goals. | Product claim, non-claims, spine mapping, scope/risk note. | planned |
| Engineering | yes | hard gate | Contract proposal skips graph coverage; state/data flow ambiguous; critical refusal path untested; codemode partial success remains possible. | Data-flow diagram, T1-T13 focused tests, full verification commands. | planned |
| Security / CSO | yes | hard gate | Raw secrets enter graph records; caller self-asserts graph authority; protected mutation bypasses policy/gateway; guard fail-open/bypass is accepted as clean coverage; observer evidence counts as enforcement. | Threat notes, graph issuer checks, redaction tests, classifier posture tests, boundary/refusal tests. | planned |
| DevEx | conditional | 8/10 | Refusal lacks problem/cause/fix; future SDK/HTTP examples require custom wrapper logic for core behavior. | Structured refusal samples, fixture helper examples, docs/schema consistency check. | planned |
| Design | no | n/a | No UI or review renderer in this slice; any future review UI not bound to exact contract is a hard stop. | Not applicable now; future state matrix if UI enters scope. | planned |
| Architecture | yes | 8/10 | Shallow graph coverage module; callers must compose issuer, redaction, graph limits, and contractability rules; evidence rules duplicated across callers. | Module seam map, deletion-test note, interface responsibility statement, interface-level tests. | planned |
| Domain Invariant | yes | hard gate | Generated execution becomes permission; graph parser becomes enforcement; one graph authorizes unsafe siblings; missing evidence smoothed over. | Candidate/action-contract binding tests, gateway non-authority checks, refusal/gap/bypass posture. | planned |

## Test Plan

Red-green commands during implementation:

```bash
bun test test/kernel.test.ts
bun test test/codemode-multi-action-runtime.test.ts
bun test
npm run typecheck -- --pretty false
npm run build -- --pretty false
git diff --check
```

Docs and theatre scans:

```bash
rg -n "advisory only|approval only|dashboard-first|audit-only|runtime permission|safe agents" docs src test
rg -n "codemode_shell_block" docs src test
rg -n "GeneratedExecutionGraph|fully_covered_no_unsupported_nodes|generated execution graph|node digest" docs src test
rg -n "destructive_command_guard|commandRiskClassifier|fail-open|allow-once|DCG_BYPASS" docs src test
rg -n "review theatre|evidence theatre|registryBindingSetDigest|observer.*authority|devtools.*authority" docs src test
```

No typecheck/build claim should be made until code implementation starts.

## Acceptance

- ADR 0002 exists and owns the generated graph coverage decision.
- Protocol/package version is bumped to `0.2.4` with schema literal, docs, and
  fixtures aligned.
- The kernel refuses shell and codemode execution candidates without clean graph
  coverage.
- Contracts pin runtime execution, graph, and node digests.
- Contracts pin catalog, gateway registry, registry-binding-set, and node-specific
  gateway binding digests.
- Mixed coverage blocks refuse as a whole.
- Hidden triggers and observer-only evidence cannot satisfy graph coverage.
- Truncated graphs cannot report clean coverage.
- Unauthorized graph issuers and unredacted secret-bearing graph material cannot
  satisfy graph coverage.
- Destructive-command guard allow/no-match, fail-open, bypass, allowlist, and
  allow-once evidence cannot satisfy graph coverage or gateway authority.
- Existing package-install, repo-write, and preview-deploy tests still pass.
- Existing codemode tests are updated: no partial action-contract success is
  allowed when the generated program has a refused, unsupported, or bypass-risk
  sibling node.
- Public docs do not claim arbitrary shell control.

## Open Questions

- Which `destructive_command_guard` corpus categories should be copied as
  hostile fixtures for unsupported/bypass-risk graph coverage?
- Which helper should become the first public DevEx surface: SDK helper,
  CLI diagnostic, or runtime wrapper fixture?

Resolved by ADR 0004: pre-contract generated-execution coverage failure remains
graph/compiler refusal evidence in Plan 03. It must create no durable `ProofGap`
unless a future ADR adds a separate pre-contract evidence lifecycle.

## Smallest Next Mechanism

Continue the graph hardening sequence:

```text
RED: a generated execution graph pinned by a candidate drifts or loses node
gateway binding before proposal, and proposeActionContract refuses before
ActionContract creation.
```

## GSTACK REVIEW REPORT

Status: DONE_WITH_CONCERNS
Review: plan-eng-review
Date: 2026-05-18
Commit reviewed: `2458ea3`
Mode: FULL_REVIEW

Scope decision: ADR 0002 must cover both literal shell blocks and the existing codemode multi-action wrapper in the first implementation slice. A shell-only implementation would leave Handshake's most important generated-code path able to produce partial contracts from an unproven execution block.

### Step 0: Scope Challenge

What already exists:

- `RuntimeExecutionRecord` already records block-level runtime evidence and digest binding.
- `CandidateAction` and `ActionContract` already have runtime execution id/digest fields.
- `codemode-multi-action` already creates multiple protected action attempts from one generated program.
- The store is generic over protocol object type, so graph evidence does not require a new D1 table in slice 1.

Minimum necessary changes:

- Add one generated-graph transition module first, not three shallow graph modules.
- Require trusted issuer context for graph evidence instead of accepting caller self-assertion.
- Add graph refs to candidate and contract canonicalization.
- Block contract creation for consequential shell/codemode blocks unless every node in the block has clean coverage.
- Change codemode partial-success behavior so one refused, unsupported, bypass-risk, or unobserved sibling blocks all sibling contracts from the same generated program.

Complexity check:

- The original root-level module split was premature. Slice 1 now uses
  `src/protocol/generated-execution-graph/` as an area-owned protocol module and
  splits only inside that area if validation, coverage, and recording become
  hard to review in one file.
- Scope became broader in one place for safety: codemode is included because excluding it would preserve the exact bypass ADR 0002 is meant to close.

### Architecture Findings

1. Codemode partial success contradicted the ADR.

Current tests allow one package-install contract to proceed while a sibling repo-write candidate from the same codemode block is refused as unwrapped. That is not graph coverage; it is partial authority leakage from one generated program. The plan now makes this a hard blocker and adds T13.

2. Graph issuer custody needed to be explicit.

Generated graph evidence cannot be trusted because a caller says it is trusted. The plan now introduces `GraphEvidenceIssuerContext` as host/kernel/future HTTP custody context. Request-body self-certification is disallowed.

3. The version bump was missing.

ADR 0002 changes persisted protocol records, candidate canonicalization, contract canonicalization, fixtures, docs, SDK/OpenAPI surfaces, and tests. The implementation must bump protocol/package version from `0.2.3` to `0.2.4`.

4. Shell-only graph coverage was too weak.

The review narrowed arbitrary parsing, but expanded first-slice runtime coverage to include structured codemode action-list graphs because the repo already has a multi-action generated-program fixture.

### Code Quality Findings

- Keep graph behavior cohesive until the abstraction earns a split.
- Reuse existing runtime execution, intent compilation, action contract, recorder, memory store, and D1 patterns.
- Do not duplicate candidate classification in runtime wrappers; wrappers should emit graph/node bindings and let existing compilation/canonicalization own authority semantics.
- Enforce cheap byte/node/edge/depth limits before expensive canonicalization and digest work.

### Test Review

The test matrix now covers:

- T1-T6 for graph record creation, digest, issuer custody, and refusal boundaries.
- T7-T10 for candidate and action-contract binding, whole-block coverage, and shell block refusal.
- T11-T12 for receipt export and migration/storage behavior.
- T13 for codemode generated-program partial-credit refusal.

Critical test adjustment: existing codemode tests must be changed, not merely preserved. A generated program with an unsupported or unwrapped consequential sibling must not produce any sibling action contract.

### Performance Review

The plan now includes abuse bounds before expensive graph processing:

- raw byte limit for source/spec references and observed output samples;
- maximum node, edge, and nesting/depth limits;
- no raw argv/stdin/env/source payload persistence in graph records;
- one D1 atomic batch for graph record, event, and referenced protocol updates where possible.

### NOT In Scope

- No arbitrary shell parsing.
- No complete generated-code AST interpreter.
- No provider deploy adapter.
- No UI graph viewer.
- No public graph-write API in slice 1.
- No universal runtime instrumentation claim.
- No graph evidence treated as permission, gateway acceptance, mutation proof, or downstream success.

### Failure Modes Closed In The Plan

- Shell command with no graph producing a contract: blocked by pre-contract guard.
- Codemode generated block with one refused sibling producing another contract: blocked by whole-block coverage rule.
- Caller-forged graph evidence: blocked by issuer custody context.
- Safe-looking graph with hidden raw payloads: blocked by redaction and raw material limits.
- Stale or mismatched graph refs: blocked by candidate/contract digest binding tests.

### Completion Summary

- Step 0 Scope Challenge: complete.
- Architecture Review: 4 blocking issues found and folded into the plan.
- Code Quality Review: 4 implementation constraints added.
- Test Review: test diagram expanded to T13.
- Performance Review: abuse bounds added.
- NOT in scope: explicit.
- What already exists: explicit.
- TODO review: no external TODOs proposed; review findings were applied directly to this plan.
- Residual risk: implementation must prove the new whole-block rule across shell and codemode paths before ADR 0002 can be considered closed.
