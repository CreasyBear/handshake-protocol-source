# ADR 0002: Generated Execution Graph Coverage Boundary

Status: Proposed
Date: 2026-05-18
Owner: Protocol owner

## Invariant At Stake

Generated execution is not authority.

Handshake may record a shell block, codemode block, generated plan, or runtime trace,
but no consequential node from that block may become an `ActionContract` unless the
whole generated execution graph has been classified, coverage-checked, and
digest-bound.

If one visible node is contractable but a sibling node is unsupported, ambiguous,
or bypass-prone, the block is not contractable.

## Context

Hermes-style execution shows the problem:

```text
bash -lc '
set -e
printf DATE=; date +%F
gbrain stats | head -120
gbrain list | grep -Ei "hermes|gbrain|codex|agent|skills|handshake" | head -120 || true
'
```

This is not one tool call in the product sense. It is a generated program over
tools, shell semantics, process exit behavior, pipes, filters, environment, and
possible sibling mutation paths.

The current kernel already has:

- `RuntimeExecutionRecord` for generated execution evidence;
- `IntentCompilationRecord` for one candidate action;
- `ActionContract` for exact proposed commitment;
- `PolicyDecision`, one-use `Greenlight`, `GatewayCheckAttempt`, `Receipt`, and
  `ProofGap` for the enforcement and reconstruction path;
- `codemode_block` and `shell_exec_block` as existing runtime execution shapes.

The current kernel does not yet have:

- a durable graph of generated execution nodes;
- node-level classification;
- block-level coverage status;
- graph digest and node digest binding into candidates and contracts;
- a guard that refuses contract proposal when a sibling node is unsupported,
  ambiguous, refused, or bypass-prone.

## json-render Source Study

Source studied: [`vercel-labs/json-render`](https://github.com/vercel-labs/json-render)
at commit `0bbe6ed`.

The architecture lesson is stronger than the metaphor. `json-render` separates:

- schema: the shape the model is allowed to emit;
- catalog: the named components/actions the model may reference;
- registry: the runtime implementation that can render or handle those names;
- validator: the structural check that rejects malformed generated specs;
- renderer/action provider: the place where generated spec becomes runtime
  behavior.

Handshake should carry that pattern into action control, but with a harder rule:
rendering a spec is not authority. For Handshake, registry binding must terminate
at a gateway check, not at an in-process callback.

| json-render Pattern | Handshake Analogue | ADR Rule |
|---|---|---|
| `defineSchema(...)` | `GeneratedExecutionGraph` schema | Generated execution must validate against a strict protocol schema before candidate extraction. |
| `defineCatalog(...)` | tool catalog plus action catalog | Model-invented action names are not contractable. Nodes must resolve to pinned catalog entries. |
| `defineRegistry(...)` / renderer registry | gateway registry | Catalog membership is insufficient; a contractable node must resolve to a gateway-backed registry entry. |
| flat `root` plus `elements` map | graph root plus node map | Missing roots, missing children, orphaned nodes, or ambiguous graph topology refuse the whole block. |
| JSONL patch `SpecStream` | streamed/intermediate generated graph evidence | Partial streams are evidence only. Only the final validated graph can feed candidate extraction. |
| `on`, `watch`, `onSuccess`, `onError` action chains | secondary/generated consequence paths | Hidden triggers, watcher-driven actions, and chained follow-up actions must be represented as graph nodes or block contract proposal. |
| action observers/devtools event stores | audit evidence | Observers may record dispatch/settle events, but they cannot satisfy graph coverage or gateway authority. |
| strict JSON schema mode | strict graph schema mode | Unknown fields and prompt-only structure are not enough for authority-critical records. |

Important negative lesson: json-render permits useful UI patterns such as watchers,
dynamic state references, action chains, confirmation dialogs, devtools, and MCP app
tool results. Those are acceptable for generative UI. In Handshake, the same shapes
are attack surface if they can hide consequence outside the exact action contract.

## Decision

Do not add a new `codemode_shell_block` execution shape.

Use the existing vocabulary:

```text
shell_exec_block  = shell/terminal execution evidence
codemode_block    = generated code/spec execution evidence
```

Add a first-class `GeneratedExecutionGraph` evidence record for generated execution
blocks whose internal nodes affect candidate extraction.

The graph is evidence only. It cannot create policy, greenlights, gateway checks,
mutation authority, receipts, or proof of execution.

```text
RuntimeExecutionRecord(shell_exec_block)
  -> GeneratedExecutionGraph
  -> IntentCompilationRecord(candidate bound to graph node)
  -> ActionContract only when graph coverage is clean
  -> PolicyDecision
  -> one-use Greenlight
  -> GatewayCheckAttempt
```

Only this graph terminal status may allow contract proposal:

```text
fully_covered_no_unsupported_nodes
```

All other terminal statuses block contract proposal for the whole generated block:

```text
nonconsequential_only
contains_refusal
contains_coverage_gap
contains_bypass_risk
unsupported_or_ambiguous
unknown
```

`nonconsequential_only` is not an error, but it emits no `ActionContract`.

## Graph Shape

Minimum record fields:

```text
GeneratedExecutionGraph
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

Minimum node fields:

```text
GeneratedExecutionNode
  nodeId
  nodeDigest
  parentNodeId
  sequenceIndex
  nodeKind
  sourceSpanRef
  literalArgv
  resolvedExecutableRef
  cwdDigest
  envAllowlistDigest
  stdinSourceRef
  classification
  toolCapabilityId?
  actionTypeId?
  gatewayRegistryEntryId?
  gatewayRegistryBindingDigest?
  resolvedParameterDigest?
  dynamicParameterRefs[]
  evidenceRefs[]
  unsupportedReasonCodes[]
```

Initial node classifications:

```text
read_only
nonconsequential
candidate_action_eligible
compilation_refused
ambiguous
unsupported
bypass_risk
coverage_gap
```

## Binding Rules

For a generated shell execution candidate to become contractable:

1. The `RuntimeExecutionRecord` must be in the same tenant, organization,
   principal, agent, run, and runtime adapter scope as the compilation.
2. The generated graph must point to that exact runtime execution and execution
   block digest.
3. The graph digest must be pinned into the `IntentCompilationRecord`.
4. The candidate must pin the exact `nodeDigest` that produced it.
5. The graph terminal status must be `fully_covered_no_unsupported_nodes`.
6. The node classification must be `candidate_action_eligible`.
7. The node must resolve through the action catalog and gateway registry snapshots
   pinned by the graph.
8. The node-specific gateway registry binding digest must prove a concrete
   gateway-backed implementation exists for that action type.
9. Dynamic parameters must be resolved before candidate digesting or explicitly
   marked as an unsupported coverage gap.
10. Hidden triggers such as watchers, callbacks, chained follow-up actions, or
   state-driven side effects must be modeled as graph nodes. If the compiler cannot
   model them, the whole block refuses.
11. The graph must be closed-world and non-truncated. Unknown fields, unknown
   nodes, missing edges, orphaned nodes, unmodeled dynamic calls, or over-limit
   truncation refuse contract proposal.
12. Candidate records may point to graph nodes, but graph nodes must not be
   mutated after recording to point back to candidates. The graph is append-only
   evidence, not a mutable index.
13. `proposeActionContract` must reload the graph and refuse if the graph digest,
   node digest, coverage status, catalog snapshot, registry snapshot, registry
   binding, or runtime execution binding drift.
14. The resulting `ActionContract` must pin the runtime execution, graph, node,
   catalog snapshot, gateway registry snapshot, and node-specific gateway binding
   digests.

Coverage is block-level, not target-node-level. A clean target node does not rescue
an unsafe sibling node.

## First Slice

The first implementation slice supports only literal command lists.

Allowed:

```text
[
  ["handshake", "repo", "propose_write_to_pr", "--file", "src/a.ts"],
  ["handshake", "contract", "show", "act_123"]
]
```

Disallowed in the first slice:

- pipes;
- redirects;
- variable expansion;
- command substitution;
- glob expansion;
- aliases;
- shell functions;
- heredocs;
- background jobs;
- traps;
- nested interpreters such as `bash -c`, `node -e`, `python -c`;
- package scripts such as `npm run`, `bun run`, `pnpm run`, `make`;
- network fetch and execute patterns such as `curl | sh`;
- failure masking such as `|| true`, `!`, `set +e`, or missing `pipefail`.

A raw Hermes `bash -lc` string with those constructs is valid runtime evidence, but
it is not contractable in this slice. It should record `unsupported_or_ambiguous`
coverage and emit no contract.

## Proof Gaps And Coverage Gaps

This ADR does not introduce pre-contract `ProofGap` emission as a lifecycle path.

The graph may record a `coverage_gap` when required classification evidence is
missing. That blocks contract proposal. Later ADRs may decide whether some
pre-contract coverage gaps should also emit durable `ProofGap` records.

Until then:

```text
coverage gap before contract -> graph refusal evidence, no ActionContract
proof gap after gate/mutation/recovery -> existing ProofGap lifecycle
```

This avoids pretending a post-contract proof-gap helper can already represent
pre-contract compiler uncertainty.

## Code Quality Review

Review stance: pre-implementation quality gate for the protocol shape implied by
this ADR.

Outcome: keep the ADR, but narrow the implementation contract before code starts.

| Axis | Finding | Required Adjustment | Status |
|---|---|---|---|
| Correctness | `fully_covered_no_unsupported_nodes` is unsafe unless the graph is closed-world. | Refuse unknown fields, missing roots, missing edges, orphaned nodes, unmodeled dynamic calls, and truncated graphs. | accepted |
| Readability | The prior registry binding field was too vague; it could mean the whole registry or one node's executable binding. | Use `registryBindingSetDigest` for the graph and `gatewayRegistryBindingDigest` for each contractable node. | accepted |
| Architecture | A graph node with a later candidate back-reference would make immutable evidence drift after candidate extraction. | Candidates point to graph nodes; graph nodes do not mutate back to candidates. | accepted |
| Security | Devtools, observers, rendered review screens, and action callbacks are evidence or UI, not enforcement. | Hidden triggers become graph nodes or refusals; observer-only evidence never satisfies coverage. | accepted |
| Performance / Ops | Generated blocks can be huge under loops, retries, or generated code expansion. | Store `nodeCount`, `edgeCount`, and `truncationStatus`; over-limit graphs cannot report clean coverage. | accepted |
| Test Quality | A green-path graph test would bless the wrong abstraction if negative cases lag. | Test missing graph, unsupported graph, registry miss, observer-only evidence, truncation, hidden triggers, mixed siblings, and drift before widening. | accepted |

Hard stops for implementation:

- graph evidence becomes mutable after recording;
- contract proposal trusts caller-supplied coverage without reloading the graph;
- a top-level registry digest substitutes for a node-specific gateway binding;
- an observer, devtool event, review render, or confirmation dialog counts as
  authority;
- an over-limit graph is allowed to report clean coverage.

## Play-The-Tape Review

### Question Compiler

- Raw ask: strengthen ADR 0002 after studying json-render and before TDD work.
- Artifact under review: this ADR and the generated execution graph boundary it
  introduces.
- Short-term gain: a concrete bridge from generated shell/codemode evidence to
  safe candidate extraction.
- Future pain risk: graph evidence, review rendering, or runtime observation
  becomes a second authority surface that competes with gateway checks.
- Primary tape mode: Full Council
- Secondary tape modes: Architecture, Attack, Design, Debt, Strategy.
- Compiled question: If this ADR gets a concrete graph coverage boundary but risks anchoring schema, renderer, observer, and registry evidence as if they were authority, what residue do we own across schemas, gateways, tests, docs, review surfaces, and runtime adoption?
- Non-question: whether Handshake should parse arbitrary shell. It should not in
  this slice.

### Crystal Ball Setup

- Depth: Deep
- Success criteria: the first implementation slice refuses unsafe generated
  blocks before `ActionContract`, and every clean candidate pins graph, node,
  catalog, gateway registry, and node-specific gateway binding digests.
- Source material: this ADR, Plan 03, `QUALITY.md`,
  `docs/specs/00-product-requirements-spine.md`, and
  `vercel-labs/json-render` commit `0bbe6ed`.
- Council roles: Product / CEO, Engineering, Security / CSO, Architecture,
  DevEx, Design, Domain Invariant, Future Maintainer. This was role-simulated
  locally; no external council was invoked.
- Uncertainty axes: runtime diversity, partial adoption, generated-code behavior,
  registry drift, graph size, review UI pressure, docs drift, incident recovery.

### If This Succeeds, We Own

- Product/repo shape: a `GeneratedExecutionGraph` protocol object, graph
  validation module, graph coverage guards, candidate/contract graph bindings,
  and refusal tests.
- New product claims: Handshake can refuse contract proposal from generated
  blocks whose whole graph is not cleanly classified and gateway-bound.
- New API/protocol surface: `recordGeneratedExecutionGraph(...)` or equivalent
  future SDK/HTTP surface after kernel tests pass.
- New docs source of truth: this ADR owns the boundary; Plan 03 owns the first
  implementation slice.
- New long-term maintenance burden: grammar versions, coverage validator
  versions, catalog snapshot compatibility, gateway binding digests, graph size
  limits, and refusal-code stability.

### Monte Carlo Futures

| Future | Assumptions | Likelihood | Success-State Residue | Tail Risk |
|---|---|---:|---|---|
| Base success | Kernel slice lands as written. | medium | A new protocol object and validator must stay canonical. | Tests bless plumbing instead of authority boundary. |
| Dirty integration | A runtime emits partial graph evidence. | high | Advisory runtime posture remains live beside protected paths. | Generated code escaped the contract boundary. |
| Partial adoption | Some tools are wrapped and raw shell credentials remain. | high | Product must keep bypass posture explicit. | Users infer shell/codemode control that does not exist. |
| Generated-code pressure | Agents branch, retry, chain actions, or construct calls dynamically. | high | Unsupported nodes and hidden triggers become common refusals. | Compiler overreaches the principal by contracting only visible nodes. |
| Review UI pressure | A json-render-style business-function UI is added later. | medium | UI must render exact contracts and graph digests. | This is review theatre. |
| Scale pressure | Generated blocks produce large graphs. | medium | Bounds and truncation become part of protocol behavior. | Truncated graph reports clean coverage. |
| Incident recovery | An org reconstructs a run months later. | medium | Reason codes, source spans, and digests must be stable enough to audit. | This is not auditable. |

### Council Passes

| Role | Strongest Residue Callout | What It Would Cut Or Narrow | Hard Stop? |
|---|---|---|---:|
| Product / CEO | The claim can drift from "contract proposal refusal" to "safe codemode." | Keep shell/codemode non-claims prominent. | yes |
| Engineering | Registry binding can be misread as graph-global instead of node-specific. | Split graph binding-set digest from node gateway binding digest. | yes |
| Security / CSO | Observers, devtools, and review renderers can look like enforcement. | Keep observer-only evidence out of coverage satisfaction. | yes |
| Architecture | Mutable reverse links from graph to candidate would corrupt digest semantics. | Make graph append-only; candidates reference graph nodes. | yes |
| DevEx | Runtime integrators will hit refusals before they understand the protocol. | Require problem/cause/fix refusal messages. | no |
| Design | A future review UI can summarize a plan that differs from the contract. | Review screens must render exact contract and digest binding. | yes |
| Domain Invariant | The gateway check must remain the only pre-mutation enforcement boundary. | Cut any parser-as-enforcement language. | yes |
| Future Maintainer | Shell grammar pressure will expand forever. | Keep first slice literal and version every parser/validator. | no |

### Mode Artifact

| Tape Mode | Artifact | Future Pain Exposed | Required Adjustment |
|---|---|---|---|
| Architecture | Coupling map | Graph, candidate, contract, catalog, and gateway registry can become one tangled object. | Keep graph evidence append-only; bind through digests at candidate/contract stages. |
| Attack | Bypass map | Raw shell, hidden callbacks, watchers, and dynamic tool construction remain credible escape paths. | Treat unmodeled consequence as refusal or bypass-risk coverage. |
| Design | Review state map | Rendered review can make vague intent look exact. | Future review renderer must render exact `ActionContract` plus graph/node digests. |
| Debt | Pain ledger | Parser and validator versions become sticky protocol state. | Version parser and coverage validator; keep first grammar deliberately small. |
| Strategy | Claim map | The market may hear "safe generated code" instead of "gateway-bound contract proposal." | Preserve non-claims around shell, codemode, runtime hooks, and downstream execution. |

### Convergent Residue

| Residue | Seen In Futures | Seen By Roles | Severity | Reversibility | Evidence | Decision |
|---|---:|---:|---|---|---|---|
| Graph evidence mistaken for authority | 6/7 | 7/8 | high | expensive | Runtime evidence and graph are pre-contract only. | narrow |
| Registry binding under-specified | 4/7 | 4/8 | high | contained | A top-level digest cannot prove node-specific gateway binding. | narrow |
| Hidden triggers outside the graph | 3/7 | 5/8 | high | contained | json-render `watch` and action chains show the pattern. | narrow |
| Partial adoption bypass | 3/7 | 4/8 | high | migration-bound | Raw credentials and sibling tools may remain live. | narrow |
| Refusal DevEx burden | 4/7 | 3/8 | medium | easy | Integrators will hit refusals first. | narrow |
| Parser grammar accretion | 3/7 | 3/8 | medium | expensive | Shell/codemode support pressure will grow. | defer |

### Maintainer Traps

- Trap: expanding from literal command lists into "almost POSIX shell."
  Why this exists after success: every refused integration will ask for one more
  construct.
  Future cleanup trigger: any second grammar slice needs its own ADR and negative
  test set.
- Trap: adding HTTP/SDK routes before the kernel guard is stable.
  Why this exists after success: integrators will ask for a public surface early.
  Future cleanup trigger: no public route before T1-T9 pass.
- Trap: review renderer copied from json-render without contract binding.
  Why this exists after success: business-function UI is attractive.
  Future cleanup trigger: renderer work starts only after exact contract/digest
  render requirements exist.

### Authority And Claim Risks

- Claim that may exceed enforcement: Handshake controls arbitrary shell or
  codemode execution.
- Boundary that future readers may misunderstand: graph coverage is evidence for
  candidate extraction, not permission and not gateway acceptance.
- Non-claim to preserve: this does not control raw mutation credentials, unwrapped
  sibling tools, browser-side actions, or downstream business success.

### Residue-Reducing Adjustments

| Adjustment | Residue Reduced | Mechanism | Owner Or Trigger | Status |
|---|---|---|---|---|
| Split graph binding-set digest from node gateway binding digest. | Ambiguous registry authority. | `registryBindingSetDigest` plus `gatewayRegistryBindingDigest`. | ADR 0002. | accepted |
| Make graphs append-only evidence. | Digest drift and mutable reverse links. | Candidate references graph node; graph does not store candidate ID. | Kernel implementation. | accepted |
| Add graph bounds and truncation refusal. | Scale and partial-observation gaps. | `nodeCount`, `edgeCount`, `truncationStatus`, T9. | Kernel implementation. | accepted |
| Require closed-world validation. | Unknown nodes and hidden triggers. | Strict validator for topology, unknown fields, dynamic calls, and hidden triggers. | Kernel implementation. | accepted |
| Keep review UI out of slice 1. | Review theatre. | Non-scope plus future exact-contract renderer requirement. | First review-renderer plan. | accepted |

### Chairman Synthesis

Decision: narrow.

Reason: ADR 0002 is directionally right, but it must be stricter than
json-render because it governs consequential action, not UI generation. The graph
boundary is useful only as pre-contract refusal evidence. Authority still starts
at exact `ActionContract`, policy decision, one-use `Greenlight`, and gateway
check.

Smallest next mechanism: write the first red test proving a `shell_exec_block`
with no `GeneratedExecutionGraph` cannot produce an `ActionContract`, then add the
registry-miss and truncation refusals before the green graph path.

## Consequences

Good:

- Generated shell/program blocks can no longer launder one clean candidate while
  hiding unsafe siblings.
- Review and audit can reconstruct which node produced a candidate.
- Gateway checks remain the only mutation enforcement point.
- The first slice is small enough to test with red-green-refactor.

Cost:

- `RuntimeExecutionRecord` remains aggregate evidence and now needs a graph-bound
  companion object for generated blocks.
- `IntentCompilationRecord`, `CandidateAction`, and `ActionContract` need graph
  and node digest bindings.
- Gateway registry binding needs both graph-level and node-level digest material.
- Graph validation now needs explicit topology, bounds, truncation, and hidden
  trigger checks before any green path.
- HTTP/SDK/OpenAPI support should be a second slice after kernel behavior is green.

## Non-Claims

- This does not parse arbitrary POSIX shell.
- This does not make Hermes, Codex, Claude Code, MCP, or any runtime safe by itself.
- This does not control raw shell execution while raw mutation credentials remain
  available to the agent.
- This does not treat a graph parser as an enforcement boundary.
- This does not prove downstream execution success.
- This does not make `nonconsequential` equivalent to safe data handling or
  non-exfiltration.

## Quality Contract

| Lens | Applies? | Target | Hard Stops | Evidence Required | Closeout |
|---|---:|---:|---|---|---|
| Product / CEO | yes | hard gate | Claims shell/codemode control without gateway-owned enforcement. | Non-claims and spine mapping. | planned |
| Engineering | yes | hard gate | Contracts can emit from shell blocks with missing/unsafe sibling coverage. | Kernel invariant tests. | planned |
| Security / CSO | yes | hard gate | Coverage gaps, bypass risk, or unsupported syntax count as contractable coverage. | Refusal-before-contract tests. | planned |
| DevEx | yes | 8/10 | Runtime integrators must understand the whole protocol before first refusal. | Simple helper outcomes and structured errors. | planned |
| Design | no | n/a | No UI surface in this slice. | Marked not applicable. | planned |
| Architecture | yes | 8/10 | Graph object duplicates authority semantics or bypasses lifecycle guards. | ADR, module map, transition guard. | planned |
| Domain Invariant | yes | hard gate | Generated code becomes permission, or a graph parser becomes enforcement. | Digest-bound candidate/contract tests. | planned |

## Smallest Next Mechanism

Start with one TDD tracer bullet:

```text
shell_exec_block runtime evidence without generated graph coverage cannot produce
an ActionContract.
```
