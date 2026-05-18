# ADR Follow-Up Register

Last reviewed: 2026-05-19

## Invariant At Stake

ADR follow-ups must not become ambient roadmap authority.

An ADR can identify the next mechanism, deferred risk, or open decision, but it
does not authorize broad scope. Each follow-up below names the source ADR, the
owning plan, the boundary it protects, and the smallest next mechanism.

## Priority Model

Priority follows enforcement sequence:

- `P0-local`: blocks the current local alpha implementation sequence.
- `P0-hosted`: does not block local alpha, but blocks hosted or multi-tenant
  claims.
- `P0-public`: does not block local alpha, but blocks public evidence/read API
  claims.
- `P1`: must be resolved inside the owning implementation plan before that plan
  can close.
- `P2`: deferred until the kernel proof exists; do not pull forward unless the
  owning plan explicitly needs it.

## Priority Order

1. Keep Plan 03 public graph routes cut. Local graph drift, catalog/registry
   miss, codemode runtime graph production, and codemode whole-block tests are
   resolved; the remaining blocker is any justified public graph surface.
2. `ADR-FU-0006-A`: after the first Tier 2 protected path exists, prove two
   surfaces for the same logical action bind to the same contract posture.
3. `ADR-FU-0008-A` and `ADR-FU-0009-A`: before self-improvement, replay, setup,
   spend, generated-artifact, or concurrent-action claims, prove those inputs
   stay provenance/protected-resource evidence instead of authority.
4. `ADR-FU-0007-A`: before A2A, remote-agent, hosted continuation, scheduled-job,
   or retry claims, prove resumed or delegated work does not mint authority.
5. `ADR-FU-0002-D`: pick a public helper only after the graph kernel behavior is
   proven.
6. `ADR-FU-0010-A`: defer Tier 4 conformance until Tier 2 and Tier 3 evidence
   exists.

`ADR-FU-0001-A` and `ADR-FU-0001-B` are separate claim blockers: they become P0
only when the work claims hosted multi-tenant deployment or public evidence/read
access. `ADR-FU-0001-A` is now planned by Plan 04, but remains unimplemented.

## Active Follow-Ups

| ID | Priority | Source | Status | Owning plan | Boundary | Smallest next mechanism |
|---|---|---|---|---|---|---|
| ADR-FU-0002-D | P2 | [ADR 0002](../adr/0002-generated-execution-graph-coverage.md) | open DevEx decision | [Plan 03](./03-plan-eng-review-generated-execution-graph-coverage.md) | Public helpers must not expose generated graph evidence as authority. | Choose the first public DevEx surface: SDK helper, CLI diagnostic, or runtime wrapper fixture. |
| ADR-FU-0001-A | P0-hosted | [ADR 0001](../adr/0001-kernel-evidence-boundaries.md), [ADR 0005](../adr/0005-hosted-transition-caller-identity.md) | planned; implementation blocker | [Plan 04](./04-plan-eng-review-hosted-caller-identity.md) | Static transition bearer tokens are local caller custody only, not principal/org authority. | Add the red hosted HTTP test proving a valid local custody token cannot write a hosted transition for an unmatched tenant/org scope, then implement server-derived `TransitionCallerIdentity` with custody-role and tenant/org scope checks before hosted records commit. |
| ADR-FU-0001-B | P0-public | [ADR 0001](../adr/0001-kernel-evidence-boundaries.md), [Plan 02b](./02b-plan-eng-review-module-boundaries.md), [Plan 02c](./02c-plan-eng-review-protocol-spec-alignment.md) | deferred public API blocker | future evidence-read plan | Raw records, request context, claims, and provider payloads are internal control-plane evidence, not a public API. | Design a redacted evidence/read API before exposing record reads outside local/control-plane debug use. |
| ADR-FU-0006-A | P1 | [ADR 0006](../adr/0006-agent-native-surface-binding.md) | open cross-surface blocker | future cross-surface protected-action plan | Same logical protected action must not have different authority paths across UI, HTTP, MCP, A2A, CLI, extensions, generated code, jobs, or agent-tool surfaces. | Add a fixture proving two origins for the same protected action reduce to the same contract digest and policy posture, plus a stale-context refusal case. |
| ADR-FU-0007-A | P0-hosted | [ADR 0007](../adr/0007-remote-delegation-continuation-boundary.md) | open remote/continuation blocker | future remote-delegation and continuation plan | Remote task results, retries, scheduled jobs, and continuations are evidence paths, not fresh authority. | Add a fixture where a completed remote task result can only produce evidence for local compilation and cannot execute until a local contract/policy/greenlight/gateway path succeeds. |
| ADR-FU-0008-A | P1 | [ADR 0008](../adr/0008-persistent-context-replay-boundary.md) | open provenance blocker | future persistent-context and replay/eval plan | Memory, skills, instructions, replay, eval, and simulation evidence must not rewrite delegation, policy, envelope, gateway authority, or production proof class. | Add a fixture where memory suggests broader scope but policy sees only the original envelope, and a replay receipt cannot satisfy production gateway evidence. |
| ADR-FU-0009-A | P1 | [ADR 0009](../adr/0009-protected-resource-custody-boundary.md) | open custody blocker | future resource-custody protected-action plan | Secrets, keys, OAuth grants, browser profiles, budgets, generated artifacts, and concurrency are protected consequences when they enable, spend, or later cause mutation. | Add a fixture where a generated script exists but cannot be promoted or run against a protected surface until contracted, and parallel attempts cannot share one greenlight. |
| ADR-FU-0010-A | P2 | [ADR 0010](../adr/0010-tier-4-conformance-boundary.md) | deferred Tier 4 blocker | future Tier 4 conformance plan | Tier 4 is versioned conformance and certification, not more integrations. | Define the first runtime-conformance and gateway-conformance red tests only after one Tier 2 path and hosted evidence model exist. |

## Resolved Follow-Ups

| ID | Source | Resolution | Boundary Preserved |
|---|---|---|---|
| ADR-FU-0002-A | [ADR 0002](../adr/0002-generated-execution-graph-coverage.md), [Plan 03](./03-plan-eng-review-generated-execution-graph-coverage.md) | Resolved by `test/generated-execution-graph.test.ts`: a `shell_exec_block` runtime execution without a `GeneratedExecutionGraph` yields `generated_execution_graph_missing`, creates no `ActionContract`, and creates no `ProofGap`. | Runtime execution evidence is not enough to issue an action contract. |
| ADR-FU-0002-C | [ADR 0002](../adr/0002-generated-execution-graph-coverage.md), [Plan 03](./03-plan-eng-review-generated-execution-graph-coverage.md) | Resolved for the first local fixture set: unsupported sibling, truncated graph, raw argv material, bypass-detected classifier posture, fail-open classifier posture, observer-only evidence, hidden-trigger evidence, and unknown node kind are covered as graph refusal evidence. | Command-risk fixtures remain hostile evidence; classifier output does not become enforcement or authorization. |
| ADR-FU-0003-A | [ADR 0003](../adr/0003-protocol-module-ownership.md), [Plan 02d](./02d-plan-eng-review-protocol-module-architecture.md) | Resolved by Plan 02d closeout: protocol behavior moved behind invariant-owned area modules; `HandshakeKernel` imports area public indexes; `store-port.ts` owns the protocol storage port; root `schemas.ts` and `inputs.ts` are compatibility aggregators only; deprecated root primitive shims were removed; import-posture, object-registry, and root-export tests guard the boundary. | Module ownership is current implementation behavior, not only architecture intent. |
| ADR-FU-0003-B | [ADR 0003](../adr/0003-protocol-module-ownership.md), [Plan 02d](./02d-plan-eng-review-protocol-module-architecture.md) | Resolved by implementing `object-registry` before schema/input sharding. It owns object type metadata, ID extraction, schema collection, export posture, raw-read posture, and scope selectors while tests prevent primitive logic creep. | Schema/input ownership moved to areas without recreating a central primitive gravity well. |
| ADR-FU-0002-B | [ADR 0002](../adr/0002-generated-execution-graph-coverage.md), [ADR 0004](../adr/0004-pre-contract-refusal-evidence-boundary.md) | Resolved by ADR 0004: pre-contract coverage gaps remain graph/compiler refusal evidence in Plan 03. The current `ProofGap` lifecycle starts only after an `ActionContract` exists. | Compiler refusal cannot be confused with post-gateway proof gaps. |

## Non-TODOs

These are not active TODOs from the ADRs:

- Production provider-side preview enforcement. Current preview deploy remains a
  local fixture proof until a production provider gateway owns the mutation
  credential and checks the exact greenlight before consequence.
- Broad package, service, or workspace splitting. ADR 0003 chose modular
  monolith extraction by invariant before package-level boundaries.
- Public polling endpoints for operations, claims, or raw records. These remain
  cut unless a redacted public evidence API is designed.

## Control Rule

Do not add vague TODOs such as "clean up architecture," "improve auth," or
"support generated graphs." Add only follow-ups that name:

1. the source ADR;
2. the owning plan;
3. the authority/evidence boundary;
4. the smallest next mechanism;
5. whether it blocks local alpha, hosted deployment, or public API claims.

Smallest next mechanism: keep public graph APIs cut unless `ADR-FU-0002-D`
selects and proves a helper surface. If the next claim is hosted or multi-tenant,
implement Plan 04's `ADR-FU-0001-A` red test first. After the first Tier 2
protected path exists, implement `ADR-FU-0006-A` before adding more entry
surfaces.
