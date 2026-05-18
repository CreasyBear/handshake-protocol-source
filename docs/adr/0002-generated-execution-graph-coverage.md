# ADR 0002: Generated Execution Graph Coverage Boundary

Status: Accepted; v0.2.4 kernel slice partially implemented
Date: 2026-05-18
Owner: Protocol owner
Governing implementation plan:
[`03-plan-eng-review-generated-execution-graph-coverage.md`](../plans/03-plan-eng-review-generated-execution-graph-coverage.md)
Narrowed by:
[`0004-pre-contract-refusal-evidence-boundary.md`](./0004-pre-contract-refusal-evidence-boundary.md)

## Invariant At Stake

Generated execution is not authority.

Handshake may record shell blocks, codemode blocks, generated plans, runtime
traces, command-risk classifier output, and review renderings. None of those may
authorize consequence.

A consequential node from generated execution may become an `ActionContract` only
when the whole generated execution graph is:

```text
schema-valid
  -> issued by an authorized graph evidence issuer
  -> bound to the exact RuntimeExecutionRecord and execution block digest
  -> closed-world and non-truncated
  -> catalog-resolved
  -> gateway-registry-bound at graph and node level
  -> redacted enough to store safely
  -> free of unsupported, ambiguous, bypass-risk, fail-open, hidden-trigger,
     observer-only, or coverage-gap sibling nodes
  -> digest-bound into the candidate and eventual ActionContract
```

If one visible node looks contractable but a sibling node is unsupported,
ambiguous, bypass-prone, hidden, truncated, fail-open, or unobserved, the whole
block is not contractable.

Authority still starts only after:

```text
exact ActionContract
  -> PolicyDecision
  -> one-use Greenlight
  -> GatewayCheckAttempt before mutation
```

## Context

Before ADR 0002, the v0.2.3 kernel already recorded `RuntimeExecutionRecord` evidence for
`shell_exec_block` and `codemode_block` execution shapes. That record can say a
runtime executed or generated a block. It does not prove that every consequential
path inside the block was classified or gateway-bound.

Generated code behaves like a program over tools: it can branch, chain, mask
failures, retry, use nested interpreters, inspect state, construct arguments, and
hide consequence in sibling commands. A single clean-looking command cannot rescue
an unsafe generated block.

Source studies inform this decision:

- `vercel-labs/json-render` commit `0bbe6ed`: useful generated output must be
  constrained by schema, catalog, registry, and validator. For Handshake, registry
  binding must terminate at gateway authority, not in-process callbacks.
- `Dicklesworthstone/destructive_command_guard` commit `9a886a8`: command-risk
  classifiers are useful evidence and hostile fixture sources, but hooks, rule
  no-matches, allowlists, allow-once codes, force flags, bypass env vars, and
  fail-open paths are not authority.

## Decision

Add a first-class `GeneratedExecutionGraph` evidence record.

The graph is pre-contract evidence only. It may inform candidate extraction and
refusal. It cannot create policy, greenlights, gateway checks, mutation authority,
receipts, or proof of execution.

Do not add a new `codemode_shell_block` execution shape. Keep existing runtime
vocabulary:

```text
shell_exec_block = shell/terminal execution evidence
codemode_block   = generated code/spec execution evidence
```

The generated graph sits between runtime evidence and intent compilation:

```text
RuntimeExecutionRecord(shell_exec_block | codemode_block)
  -> GeneratedExecutionGraph
  -> IntentCompilationRecord(candidate bound to graph node or compile refusal)
  -> ActionContract only when whole-graph coverage is clean
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

## Accepted Protocol Commitments

`GeneratedExecutionGraph` must carry, at minimum:

- runtime execution binding: `runtimeExecutionId`, execution block digest, tenant,
  organization, principal, agent, run, and runtime adapter scope;
- graph issuer custody: issuer ref, issuer authority, issued-at timestamp, nonce,
  graph input digest, and replay protection;
- schema and validator versions: graph schema, parser, supported grammar, and
  coverage validator versions;
- graph identity: graph digest, coverage status, terminal reason codes, entry
  nodes, edges, node count, edge count, limits, byte size, and truncation status;
- catalog and gateway bindings: catalog snapshot digest, gateway registry snapshot
  digest, graph-level binding-set digest, and node-level gateway binding digest
  for contractable nodes;
- safe evidence posture: source span digests, redacted argv, argv digest,
  argv redaction status, stdin/source refs, secret span refs, env allowlist digest,
  command-risk classifier refs, classifier posture, rule refs, bypass refs, and
  unsupported reason codes.

Raw argv, stdin, environment values, provider payloads, and secret-bearing source
spans must not be persisted as graph evidence.

## Contractability Rules

For a generated execution node to become contractable:

1. The graph must be recorded by an authorized graph evidence issuer for the same
   tenant, organization, runtime adapter, run, runtime execution, and execution
   block digest.
2. The graph nonce and graph input digest must prevent stale evidence replay onto
   a different runtime block.
3. The graph digest must be pinned into the `IntentCompilationRecord`.
4. The candidate must pin the exact `nodeDigest` that produced it.
5. The graph terminal status must be `fully_covered_no_unsupported_nodes`.
6. The node classification must be `candidate_action_eligible`.
7. The node must resolve through pinned action catalog and gateway registry
   snapshots.
8. The node-specific `gatewayRegistryBindingDigest` must prove a concrete
   gateway-backed implementation exists for that action type.
9. Dynamic parameters must resolve before candidate digesting or become coverage
   gaps.
10. Hidden triggers, watchers, callbacks, chained follow-up actions, and
    state-driven side effects must be modeled as graph nodes or the whole block
    refuses.
11. Command-risk classifier output is advisory evidence only. Clean, allow, or
    no-match results cannot satisfy graph coverage, action catalog binding,
    policy, or gateway authority. Deny, warn, allowlist, allow-once, bypass,
    force, fail-open, parse-error, timeout, oversized, unsupported-language, or
    skipped-due-to-budget results force refusal, bypass risk, or coverage gap
    unless the same node maps to an exact gateway-bound action.
12. The graph must be closed-world and non-truncated. Unknown fields, unknown
    nodes, missing edges, orphaned nodes, unmodeled dynamic calls, over-limit
    graphs, and truncated graphs refuse contract proposal.
13. `proposeActionContract` must reload the graph and refuse if the graph digest,
    node digest, coverage status, catalog snapshot, registry snapshot, binding
    set, node binding, classifier posture, issuer scope, redaction posture, or
    runtime execution binding drift.
14. Graph records are append-only evidence. Candidates may reference graph nodes;
    graph nodes must not be mutated later to point back to candidates.

Coverage is block-level, not target-node-level.

## Implementation Status

The v0.2.4 kernel slice implements the first local graph boundary:

- `GeneratedExecutionGraph` is a first-class protocol object owned by
  `src/protocol/generated-execution-graph/`.
- `HandshakeKernel.createGeneratedExecutionGraph(...)` records graph evidence
  through a trusted issuer context, not caller self-certification.
- The object registry, event schema, transition matrix, root exports, and tests
  know about `generated_execution_graph` and
  `generated_execution_graph_recorded`.
- `compileIntent` refuses shell/codemode candidates when graph coverage is
  missing or not `fully_covered_no_unsupported_nodes`.
- `compileIntent` binds contractable candidates to graph ID/digest, node
  ID/digest, coverage status, catalog snapshot digest, gateway registry snapshot
  digest, registry-binding-set digest, and node gateway-binding digest.
- `proposeActionContract` reloads the graph and refuses graph, node, coverage,
  runtime, or node gateway-binding drift before creating an `ActionContract`.
- Missing graph, unsupported graph, unsupported sibling, clean binding, durable
  graph drift, catalog/gateway binding miss, issuer mismatch, truncated graph,
  raw argv material, bypass posture, fail-open classifier evidence,
  observer-only evidence, hidden triggers, and unknown node kinds are covered by
  kernel tests.
- The existing codemode multi-action wrapper records one `RuntimeExecutionRecord`
  and one `GeneratedExecutionGraph` for the generated program, binds every child
  compilation and contract to the graph/node evidence, and refuses the whole
  generated program before minting any `ActionContract` when one sibling
  candidate is refused.

Still open before this ADR is fully implemented:

- public HTTP/SDK/OpenAPI graph surface, if still justified after the kernel
  behavior stabilizes.

## First Slice

The first implementation slice accepts only:

- literal command-list graph evidence for `shell_exec_block`;
- structured action-list graph evidence from the existing codemode multi-action
  wrapper for `codemode_block`.

It does not accept arbitrary shell syntax or arbitrary generated code parsing.

Allowed shell shape:

```text
[
  ["handshake", "repo", "propose_write_to_pr", "--file", "src/a.ts"],
  ["handshake", "contract", "show", "act_123"]
]
```

Allowed codemode shape:

```text
codemode program actions[]
  -> one RuntimeExecutionRecord
  -> one GeneratedExecutionGraph for the whole generated program
  -> one graph node per proposed protected action
```

The current codemode partial-success behavior must change: if one generated
program node is refused, unsupported, bypass-risk, or unobserved, no sibling node
from that same generated program may produce an `ActionContract`.

The first slice refuses shell constructs that require interpretation beyond the
literal list, including pipes, redirects, variable expansion, command
substitution, globs, aliases, shell functions, heredocs, background jobs, traps,
nested interpreters, package scripts, `curl | sh`, and failure masking such as
`|| true` or missing `pipefail`.

Optional command-risk classifier evidence may attach to graph nodes. It does not
widen the accepted grammar.

## Alternatives Considered

### Treat `RuntimeExecutionRecord` As Sufficient

Rejected. A runtime execution record can say a block existed; it cannot prove
closed-world sibling coverage, node-level gateway binding, parser limits, hidden
trigger coverage, redaction posture, or classifier fail-open posture.

### Add A `codemode_shell_block` Execution Shape

Rejected. The problem is not a missing runtime shape. The problem is whether
generated execution evidence can be decomposed into classified, digest-bound,
gateway-bound nodes before candidate extraction.

### Use A Destructive Command Guard As Enforcement

Rejected. A command guard can classify risk and produce useful refusal evidence.
It can also fail open, be allowlisted, be bypassed, miss a pattern, or speak a
runtime-specific hook protocol. It is observer evidence, not Handshake authority.

### Emit Pre-Contract `ProofGap` Records

Rejected for Plan 03 by ADR 0004.

```text
coverage gap before contract -> graph/compiler refusal evidence, no ActionContract, no ProofGap
proof gap after admitted contract -> existing ProofGap lifecycle
```

A future ADR may add a separate pre-contract evidence lifecycle, but it must not
overload the existing post-contract `ProofGap` object.

## Consequences

Good:

- Generated shell/codemode blocks cannot launder one clean candidate while hiding
  unsafe siblings.
- Review and audit can reconstruct which generated node produced a candidate.
- Command-risk classifier evidence is useful without becoming a parallel authority
  surface.
- Gateway checks remain the only pre-mutation enforcement point.

Cost:

- Runtime execution evidence now needs a graph-bound companion object before
  generated blocks can feed candidate extraction.
- Intent compilation, candidate, and action-contract records need graph and node
  digest bindings.
- Graph recording needs issuer custody, replay protection, redaction validation,
  graph limits, classifier posture, and strict topology validation.
- HTTP/SDK/OpenAPI support must remain a later slice until kernel behavior and
  refusal tests are stable.

## Non-Claims

- This does not parse arbitrary POSIX shell.
- This does not make Hermes, Codex, Claude Code, MCP, browser tools, or any
  runtime safe by itself.
- This does not control raw shell execution while raw mutation credentials remain
  available to the agent.
- This does not treat a graph parser, shell parser, command hook, classifier,
  allowlist, allow-once code, confidence score, or scan result as enforcement.
- This does not prove downstream execution success.
- This does not make `nonconsequential` equivalent to safe data handling or
  non-exfiltration.
- This does not permit raw command arguments, stdin, environment values, provider
  payloads, or secret-bearing source spans to be stored as graph evidence.

## Plan Handoff

This ADR owns the architectural decision and non-claims.

Plan 03 owns implementation sequencing, module seams, source-study detail,
quality contract, test matrix, hostile fixtures, and closeout commands.

No public HTTP, SDK, CLI, or OpenAPI surface should be added for generated
execution graphs before the Plan 03 kernel tests for missing graph, unsafe
siblings, registry miss, hidden triggers, truncation, issuer mismatch, redaction
failure, and classifier advisory posture pass.

## Smallest Next Mechanism

Write the first red test proving:

```text
shell_exec_block runtime evidence without generated graph coverage cannot produce
an ActionContract.
```
