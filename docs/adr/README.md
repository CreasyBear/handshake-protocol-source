# Architecture Decision Records

ADRs are decision records, not implementation plans.

For Handshake, an ADR may own:

- the invariant at stake;
- the accepted decision;
- alternatives rejected or deferred;
- authority and evidence boundaries;
- non-claims;
- consequences and reversal cost;
- a handoff to the implementation plan that will prove the decision.

An ADR must not become the home for:

- implementation sequencing;
- source-study transcripts or large comparison tables;
- test matrices;
- module seam maps;
- quality contracts;
- closeout command lists;
- broad future backlog.

Those belong in `docs/plans/`.

## Lifecycle

```text
Proposed -> Accepted -> Implemented -> Superseded
```

Status meanings:

- `Proposed`: the decision is coherent enough to plan against, but no
  implementation claim may be made.
- `Accepted`: the decision is canonical, but implementation may still be
  incomplete.
- `Implemented`: the decision has closeout evidence and may be cited as current
  protocol behavior.
- `Superseded`: the decision is historical context only; the superseding ADR owns
  current behavior.

Do not delete old ADRs. If a boundary changes, write or update the next ADR and
mark the old one as superseded.

## Current ADRs

| ADR | Status | Decision Boundary | Implementation Owner | Current Citation Rule |
|---|---|---|---|---|
| [0001: Kernel Evidence Boundaries](./0001-kernel-evidence-boundaries.md) | Implemented | Runtime execution, protected-path posture, review artifact, caller-custody, and local preview fixture evidence may inform policy/audit but cannot replace exact contract -> policy -> one-use greenlight -> gateway check. | Implemented in v0.2.3. | May be cited as current kernel behavior. |
| [0002: Generated Execution Graph Coverage Boundary](./0002-generated-execution-graph-coverage.md) | Accepted; partially implemented | Generated execution graph evidence can feed candidate extraction only when whole-block coverage is clean, issuer-bound, redacted, catalog/gateway-bound, and digest-bound. The graph is not authority. | v0.2.4 kernel slice implements graph record, compile refusal, graph/node candidate binding, and proposal-time graph reload. [Plan 03](../plans/03-plan-eng-review-generated-execution-graph-coverage.md) remains open for drift, catalog/registry miss, codemode, and public-surface hardening. | May be cited as current kernel behavior only for the implemented v0.2.4 slice. Do not claim arbitrary shell control, public graph API, runtime plugin enforcement, or codemode whole-block completion until Plan 03 closes. |
| [0003: Protocol Module Ownership](./0003-protocol-module-ownership.md) | Implemented | Protocol implementation is organized by invariant-owned modules; transports stay thin, the kernel stays the named transition facade, object registry aggregates only package-wide schema/ID/export/read posture, and storage adapters do not own primitive meaning. | [Plan 02d](../plans/02d-plan-eng-review-protocol-module-architecture.md). | May be cited as current module-ownership behavior and architecture style. Future protocol work must preserve the import-posture and object-registry guards. |
| [0004: Pre-Contract Refusal Evidence Boundary](./0004-pre-contract-refusal-evidence-boundary.md) | Accepted | Pre-contract generated-execution coverage failure is compiler/graph refusal evidence only. The existing `ProofGap` lifecycle starts after an exact `ActionContract` exists. | [Plan 03](../plans/03-plan-eng-review-generated-execution-graph-coverage.md). | May be cited as canonical evidence taxonomy for Plan 03. Do not claim implementation until Plan 03 closes. |
| [0005: Hosted Transition Caller Identity](./0005-hosted-transition-caller-identity.md) | Accepted | Hosted transition routes must derive server-verified caller identity with tenant/org scope and custody roles before records commit. Caller identity is route admission, not mutation authority. | [Plan 04](../plans/04-plan-eng-review-hosted-caller-identity.md). | May be cited as hosted/multi-tenant claim blocker. Do not claim hosted org auth until implementation closes. |
| [0006: Agent-Native Surface Binding](./0006-agent-native-surface-binding.md) | Accepted | UI, HTTP, MCP, A2A, CLI, extension, generated, job, and agent-tool origins are evidence surfaces only; a logical protected action must reduce to one contract boundary before authority exists. | Future cross-surface protected-action plan. | May be cited as blocker for agent-native or multi-surface claims. Do not claim broad runtime support until surface-binding proof exists. |
| [0007: Remote Delegation And Continuation Boundary](./0007-remote-delegation-continuation-boundary.md) | Accepted | Remote tasks, scheduled work, retries, continuations, and resumed jobs preserve or re-bind to the original authority boundary; they do not mint fresh authority. | Future remote-delegation and continuation plan. | May be cited as blocker for A2A, remote-agent, hosted continuation, and long-running workflow claims. |
| [0008: Persistent Context And Replay Boundary](./0008-persistent-context-replay-boundary.md) | Accepted | Memory, skills, instructions, traces, evals, and replay are provenance by default. They cannot silently change policy, delegation, envelope, gateway authority, or production proof class. | Future persistent-context and replay/eval plan. | May be cited as blocker for self-improving-agent, memory-authority, replay-proof, and simulation-proof claims. |
| [0009: Protected Resource Custody Boundary](./0009-protected-resource-custody-boundary.md) | Accepted | Secrets, keys, OAuth grants, browser profiles, budgets, generated artifact promotion, and concurrent/retried attempts are protected action families when they enable, spend, or later cause consequence. | Future resource-custody protected-action plan. | May be cited as blocker for setup-is-not-consequence, generated-artifact, spend, credential, and concurrency claims. |
| [0010: Tier 4 Conformance And Certification Boundary](./0010-tier-4-conformance-boundary.md) | Accepted | Tier 4 requires versioned runtime conformance, gateway conformance, adapter certification, provider-side gateway integration, cross-org receipt verification, and ecosystem governance. More integrations are not Tier 4. | Future Tier 4 conformance plan. | May be cited as blocker for ecosystem, standard, certification, provider-side enforcement, and cross-org verification claims. |

## Active Handoff

ADR 0002 is the active proposed generated-graph coverage ADR. ADR 0003 is the
implemented architecture-style ADR. ADR 0004 is the accepted evidence taxonomy
ADR that narrows ADR 0002 for pre-contract coverage failures. ADR 0005 is the
accepted hosted caller-identity boundary and blocks hosted or multi-tenant
claims until implemented.

ADR 0006 through ADR 0010 turn the external agentic-repo research into durable
claim boundaries:

- ADR 0006 blocks agent-native or multi-surface claims until all origin surfaces
  bind to the same contract posture.
- ADR 0007 blocks remote-agent, A2A, retry, scheduled-job, and continuation
  claims until resumed work preserves or re-binds authority.
- ADR 0008 blocks memory, self-improvement, replay, eval, and simulation claims
  from becoming authority or production proof.
- ADR 0009 blocks setup, credential, spend, generated-artifact, and concurrency
  surfaces from being treated as harmless implementation detail.
- ADR 0010 blocks Tier 4 language until conformance, certification, provider
  enforcement, cross-org verification, and governance have evidence.

Active ADR follow-ups are tracked in
[`../plans/adr-follow-ups.md`](../plans/adr-follow-ups.md). That register is the
only place for cross-ADR TODO aggregation; individual ADRs should keep only the
decision, non-claims, and smallest next mechanism.

Plan 03 owns:

- source-study detail from `vercel-labs/json-render` and
  `Dicklesworthstone/destructive_command_guard`;
- module seams;
- TDD sequencing;
- hostile fixtures;
- quality contract;
- closeout commands.

ADR 0002 owns only the decision, non-claims, accepted protocol commitments, and
the "smallest next mechanism."

ADR 0004 owns only the pre-contract refusal-versus-proof-gap boundary. It does
not own graph schema details, parser shape, hostile fixtures, or implementation
sequencing.

ADR 0005 owns only transition caller identity for hosted route admission. It does
not own principal delegation, agent identity, SSO administration, or mutation
authority. Plan 04 owns the source-pattern findings and implementation proof for
that hosted admission seam.

ADR 0006 through ADR 0010 own macro decision boundaries only. Their source-study
detail lives in
[`../reference/agentic-repo-source-study-2026-05-19.md`](../reference/agentic-repo-source-study-2026-05-19.md);
their implementation proof belongs to future plans listed in
[`../plans/adr-follow-ups.md`](../plans/adr-follow-ups.md).

Plan 02d owns:

- play-the-tape residue for the module ownership refactor;
- first operation-lifecycle extraction;
- import posture checks;
- sequencing for object registry and transition surface follow-up work.

ADR 0003 owns only the durable module ownership decision, non-claims, and
architecture constraints.

## Control Rule

If a future edit makes an ADR longer because it adds implementation detail, first
move that material into the governing plan and keep the ADR as the canonical
decision and non-claim record.

Before adding a new ADR, answer:

1. What invariant is at stake?
2. What decision would be expensive to reverse?
3. Which existing ADR or plan does it supersede, narrow, or unblock?
4. Which implementation plan owns proof?
5. What exact non-claim prevents authority laundering?
