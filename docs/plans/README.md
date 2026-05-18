# Plans Architecture Spine

Status: Planning index and decision spine
Last reviewed: 2026-05-19
Governing doctrine:

- [`../business/tier-doctrine-decision-memo.md`](../business/tier-doctrine-decision-memo.md)
- [`../specs/00-product-requirements-spine.md`](../specs/00-product-requirements-spine.md)

## Invariant At Stake

Plans must not let local-alpha proof harden into product claims.

Handshake can only move from local alpha toward Tier 2 self-hosted activation and
Tier 3 hosted operation by preserving the same authority path:

```text
ActionContract
  -> PolicyDecision
  -> one-use Greenlight
  -> GatewayCheckAttempt before mutation
```

Everything else is supporting evidence, adoption surface, or hosted operation.
Runtime hooks, generated graphs, caller identity, review renderers, SDKs, CLI
commands, dashboards, receipts, and cloud services must not become authority.

## Role Of This README

This file is the plans index and architecture spine.

It owns:

- the cross-plan sequence;
- the current local-alpha boundary;
- the decisions required to claim the next tier;
- the stop signs that prevent product/theatre drift.

It does not own:

- durable architecture decisions; those belong in `docs/adr/`;
- product doctrine or monetization boundaries; those belong in
  `docs/business/tier-doctrine-decision-memo.md`;
- requirements gates; those belong in `docs/specs/00-product-requirements-spine.md`;
- implementation details; those belong in individual plans.

## Current Plan Map

| Plan | Status | Tier Role | What It Proves | What It Does Not Prove |
|---|---|---|---|---|
| [`01`](./01-plan-eng-review-primitive-fields-state.md) | implemented checkpoint | Tier 1 foundation | Primitive shape, lifecycle, receipts, proof gaps, isolation, reference gateways. | Product activation, hosted operation, provider-side enforcement. |
| [`01a`](./01a-plan-eng-review-protocol-migration.md) | implemented | Tier 1 foundation | Vocabulary reset across protocol objects, routes, SDK, tests, docs. | New authority or product tier movement. |
| [`02`](./02-plan-eng-review-authority-hardening.md) | implemented checkpoint | Tier 1 foundation | Authority hardening: identity/evidence/recovery do not become ambient authority. | Full `AuthorityGrant`, `AgentIdentity`, hosted auth, production provider adapters. |
| [`02b`](./02b-plan-eng-review-module-boundaries.md) | implemented local-alpha checkpoint | Tier 1/local alpha hygiene | Route registry, OpenAPI parity, local caller custody, root export curation. | Hosted org auth or public evidence API. |
| [`02c`](./02c-plan-eng-review-protocol-spec-alignment.md) | implemented local-alpha checkpoint | Tier 1/local alpha lifecycle | Request context, operation lifecycle, claims, reconciliation, proof-gap and adapter conformance. | Hosted caller identity, redacted public evidence, provider-side enforcement. |
| [`02d`](./02d-plan-eng-review-protocol-module-architecture.md) | implemented architecture plan | Tier 1 maintainability | Primitive-owned modules and import posture for future work. | A new product surface. |
| [`05`](./05-plan-eng-review-foundation-kernel.md) | implemented foundation gate | Tier 1 foundation practice | Executable transition matrix, failure simulation, budgets, typed errors, model-based invariants, and skill-use operating practice. | New product surface, hosted operation, provider-side enforcement. |
| [`03`](./03-plan-eng-review-generated-execution-graph-coverage.md) | local hardening implemented; public graph surface cut | Tier 1 -> Tier 2 prerequisite | Generated execution graph coverage before candidate extraction. | Arbitrary shell parsing, runtime plugin distribution, hosted operation, public graph API. |
| [`04`](./04-plan-eng-review-hosted-caller-identity.md) | proposed | Tier 3 prerequisite | Hosted transition caller identity for tenant/org scoped route admission. | Mutation authority, principal delegation, agent identity, SSO/RBAC product. |
| [`adr-follow-ups`](./adr-follow-ups.md) | active register | cross-tier guardrail | Smallest unresolved ADR mechanisms with priority. | Broad roadmap authority. |

## Architecture Spine

```text
Local alpha foundation
  |
  |  01 / 01a / 02 / 02b / 02c / 02d
  v
Tier 1 protocol foundation
  exact contracts, policy, one-use greenlights, gateway checks,
  receipts, refusals, proof gaps, isolation, conformance fixtures
  |
  |  03: generated execution cannot get partial credit
  v
Intent compiler / runtime evidence boundary
  RuntimeExecutionRecord
    -> GeneratedExecutionGraph
    -> IntentCompilationRecord(candidate or refusal)
    -> ActionContract only when coverage is clean
  |
  |  next Tier 2 plan: choose one protected action path
  v
Tier 2 self-hosted protected action loop
  SDK / CLI / MCP or runtime wrapper
    -> exact contract
    -> local policy
    -> gateway-owned credential
    -> gateway check before mutation
    -> receipt timeline / install health
  |
  |  04 only when claiming hosted or multi-tenant
  v
Tier 3 hosted operation
  hosted policy/greenlight service, durable receipts, retention,
  org access control, search, alerts, audit exports, managed registry
  |
  |  future only after Tier 2 + Tier 3 proof
  v
Tier 4 ecosystem
  independent runtime/gateway conformance, adapter certification,
  provider-side integrations, cross-org receipt verification
```

The architecture moves upward only when the lower row has evidence. Tier 3 does
not make enforcement stronger by being hosted. Enforcement still lives at the
gateway check before mutation.

## Local Alpha Boundary

Local alpha currently has meaningful protocol proof:

- exact action contracts;
- deterministic policy decisions;
- one-use greenlights;
- gateway check attempts;
- memory and D1 stores;
- receipts and receipt exports;
- proof gaps and recovery recommendations;
- isolation state and breaker decisions;
- transition request context;
- operation lifecycle claims and reconciliation;
- package-install, repo-write, and preview-deploy reference gateways;
- module ownership and import-posture guardrails.

Local alpha cannot honestly claim:

- hosted or multi-tenant org auth;
- public redacted evidence/read APIs;
- provider-side preview deploy enforcement;
- arbitrary generated-code or shell coverage;
- raw terminal, browser, network, package-script, MCP-server, or cloud-console
  control;
- dashboard-led governance;
- ecosystem standard or certification status.

If a surface cannot name the gateway that owns the mutation credential and checks
the exact one-use greenlight before consequence, it is advisory, not Handshake
enforcement.

## Decisions Required To Leave Local Alpha

### 1. Generated Execution Boundary

Decision: what generated execution shape is admitted first?

Default: implement Plan 03's first slice:

```text
literal command-list graph evidence for shell_exec_block
structured action-list graph evidence for codemode_block
```

Hard stop: no sibling partial credit. One unsupported, ambiguous, bypass-risk, or
unobserved sibling blocks all contracts from the generated block.

Why this gates Tier 2: Tier 2 cannot claim agent-native protection if generated
programs can hide consequence next to one clean candidate.

### 2. First Tier 2 Protected Action Path

Decision: which protected path becomes the golden self-hosted loop?

Doctrine default: preview deploy.

Acceptable only if the plan names:

```text
agentic execution shape
protected action path
runtime posture
gateway authority holder
mutation credential holder
candidate extraction boundary
contract binding
gateway enforcement check
bypass posture
receipt/refusal/proof-gap evidence
operator value
non-claim
```

Hard stop: repo-write, package-install, preview-deploy, or any other adapter must
not become the product center. The product center is protected action paths for
autonomous decision-making.

### 3. Runtime Entry Surface

Decision: which developer entrypoint proves activation first?

Candidate options:

- MCP/tool dispatcher;
- CLI proposal flow;
- runtime wrapper;
- codemode wrapper;
- gateway-only adapter proof.

Recommendation: choose one entrypoint for the first Tier 2 path. Do not ship a
thin SDK, CLI, MCP server, dashboard, and browser flow that all stop short of one
complete gateway-checked receipt.

Hard stop: runtime auth, hook pass, MCP allowlist, or tool availability is not
mutation authority.

### 4. Gateway Credential Posture

Decision: where is the mutation credential?

Allowed product states:

| State | Honest Claim |
|---|---|
| fixture credential | local fixture proof |
| customer-owned gateway adapter credential | self-hosted gateway-checked protected path |
| hosted control plane plus customer/provider gateway | hosted operation; gateway still enforces |
| provider-side certified gateway credential | provider-side gateway enforcement |

Hard stop: if the agent still has raw sibling credentials for the same protected
surface, the path is bypass-risk unless those credentials are removed, blocked,
or explicitly labeled advisory.

### 5. Evidence Surface

Decision: what does the user see after the run?

Tier 2 needs at least one readable reconstruction surface:

- exact contract output;
- receipt timeline;
- install health truth state;
- refusal/proof-gap explanation.

Hard stop: receipt evidence must distinguish gateway check, mutation attempt,
downstream finality, reconciliation, proof gap, and recovery. Otherwise this is
evidence theatre.

### 6. Hosted Caller Identity

Decision: when can a hosted route write records for an org?

Plan 04 gates this. Hosted routes need server-derived
`TransitionCallerIdentity` before body-scoped transition records commit.

Hard stop: static transition bearer tokens are local custody only. They are not
hosted org auth, principal authority, agent authority, or mutation authority.

### 7. Public Evidence API

Decision: what evidence can be read outside local/control-plane debug use?

No public evidence/read API exists until a redacted evidence plan defines:

- allowed object projections;
- tenant/org authorization;
- raw payload redaction;
- identity/token redaction;
- provider payload redaction;
- receipt/proof-gap/export boundaries.

Hard stop: raw protocol records are control-plane evidence, not public API.

### 8. Principal And Agent Authority

Decision: when do `AuthorityGrant` and `AgentIdentity` become real protocol
inputs?

Not before the generated-execution and first protected-path loop are working.

`AuthorityGrant` should model principal/org delegation snapshots.
`AgentIdentity` should model runtime/agent proof. Neither may replace the exact
action contract, policy decision, one-use greenlight, or gateway check.

Hard stop: "agent identity" must not become the product category or a mutation
permission shortcut.

## Autoreason Distillation

Autoreason result:

- A, the previous version, was correct but too table-heavy. It made every
  decision feel equally urgent.
- B, the adversarial version, is chain-first: each decision has a plain meaning,
  a predecessor, and an unlock.
- AB wins: keep the architecture spine, but read the future work as decision
  chains, not as a flat register.

A decision is not a topic. A decision means:

- we choose one authority boundary;
- we name what proof must already exist;
- we name what product claim it unlocks;
- we name what claim remains illegal.

If a decision cannot fill those four fields, it is still a concern, not a
decision.

## Decision Chains

Read each chain left to right. Do not start downstream implementation unless the
upstream decision has evidence.

```text
Tier 2 self-hosted activation

D0 evidence floor
  -> D1 generated execution boundary
  -> D2 first protected action path
  -> D3 gateway credential posture
  -> D4 runtime entry surface
  -> D5 install health and bypass truth
  -> D6 first receipt evidence
  -> D7 distribution and update channel

Tier 3 hosted operation

Tier 2 chain complete
  -> H1 hosted caller identity
  -> H2 redacted evidence API
  -> H3 hosted org/project/policy model
  -> H4 managed gateway registry

Authority model

Tier 2 protected path working
  -> A1 principal delegation snapshot
  -> A2 agent/runtime identity assertion

Tier 4 ecosystem

Tier 2 + Tier 3 evidence
  -> E1 runtime conformance
  -> E2 gateway conformance
  -> E3 adapter certification
  -> E4 provider-side gateway integration
  -> E5 cross-org receipt verification
  -> E6 ecosystem governance and versioning

Adjacent action families

Tier 2 protected path working
  -> P1 payment and transaction adapters

Cross-surface operation

D4 runtime entry surface
  -> S1 surface fan-out binding
  -> S2 untrusted app-surface callability
  -> S3 context/app-state snapshot binding

Remote delegation and continuations

H1 hosted caller identity
  -> R1 remote agent task lifecycle
  -> R2 capability discovery redaction
  -> R3 async continuation and cancellation

Persistence, replay, and resource custody

D6 first receipt evidence
  -> M1 memory/skill/instruction provenance
  -> V1 replay/eval/simulation boundary

D3 gateway credential posture
  -> K1 secret onboarding and key minting
  -> B1 budget/quota/resource consequence
  -> G1 generated artifact promotion
  -> C1 concurrency and serialization semantics
```

The dependency that matters most: Tier 4 is not "more integrations." Tier 4 is
independent parties proving the same authority boundary without Handshake staff
hand-holding each path.

## External Research Delta

Recent agentic-app patterns add missing macro decisions. The source study lives
in
[`../reference/agentic-repo-source-study-2026-05-19.md`](../reference/agentic-repo-source-study-2026-05-19.md).
It used Digg AI GitHub stars plus representative repo/docs reading across
Agent-Native, Raindrop Workshop, Hermes Agent, mem0, Browser Use, LangGraph, and
PrimeIntellect autonomous speedrunning.

- Agent-native apps make one action callable from UI, agent chat, HTTP, MCP,
  A2A, and CLI. Surface fan-out is now the default, not an edge case.
- Agent-native apps let UI state, navigation state, extensions, shared
  workspaces, and remote agents participate in action flow.
- Agent repos are normalizing generated executable artifacts: Python model
  files, training variants, launcher scripts, external API calls, and local
  replay/eval loops.
- Memory and self-improvement systems store agent-generated facts, skills, and
  preferences as durable future context.

The missing decisions below are not new product centers. They are places where
authority can leak if Handshake only thinks in single-runtime tool calls.

## ADR-Backed Decision Owners

The macro decisions are now split between planning chains and ADR claim
boundaries. This README owns ordering. ADRs own the durable non-claims.

| Decision Cluster | Chain IDs | ADR Owner | What It Blocks Until Proven |
|---|---|---|---|
| Generated execution coverage and pre-contract refusal | D1 | [ADR 0002](../adr/0002-generated-execution-graph-coverage.md), [ADR 0004](../adr/0004-pre-contract-refusal-evidence-boundary.md) | Candidate extraction from generated code/spec evidence. |
| Hosted caller identity | H1 | [ADR 0005](../adr/0005-hosted-transition-caller-identity.md) | Hosted or multi-tenant route-admission claims. |
| Agent-native surface binding | S1 / S2 / S3 | [ADR 0006](../adr/0006-agent-native-surface-binding.md) | Agent-native, multi-surface, extension, and broad runtime-support claims. |
| Remote delegation and continuations | R1 / R2 / R3 | [ADR 0007](../adr/0007-remote-delegation-continuation-boundary.md) | A2A, remote-agent, retry, scheduled-job, and long-running hosted-workflow claims. |
| Persistent context and replay | M1 / V1 | [ADR 0008](../adr/0008-persistent-context-replay-boundary.md) | Memory-authority, self-improving-agent, replay-proof, eval-proof, and simulation-proof claims. |
| Protected resource custody | K1 / B1 / G1 / C1 | [ADR 0009](../adr/0009-protected-resource-custody-boundary.md) | Credential, spend, generated-artifact, and concurrency surfaces being treated as setup trivia. |
| Tier 4 conformance | E1 / E2 / E3 / E4 / E5 / E6 | [ADR 0010](../adr/0010-tier-4-conformance-boundary.md) | Ecosystem, standard, certification, provider-side enforcement, and cross-org verification claims. |

If a future plan touches one of these clusters, it must cite the ADR owner in
its planning gate and name the exact red test that protects the boundary.

## Decision Meanings

### Tier 2 Self-Hosted Activation

| ID | Decision Means | Depends On | Unlocks / Still Cannot Claim |
|---|---|---|---|
| D0 | The current local-alpha proof is still a valid floor to build on. | `02b` / `02c` / `02d` closeout and ADR follow-ups still match code. | Unlocks Plan 03 work. Still cannot claim product activation. |
| D1 | Generated code/spec evidence is either completely covered or refused before any candidate becomes a contract. | D0. | Unlocks candidate extraction from generated programs. Still cannot claim a protected mutation path. |
| D2 | One mutation family becomes the first golden protected path. Default: preview deploy unless a better path is explicitly chosen. | D1. | Unlocks the first Tier 2 protected-path plan. Still cannot claim general agent safety. |
| D3 | The mutation credential lives with a gateway, or raw sibling access is blocked/proof-gapped/advisory. | D2. | Unlocks real enforcement. If the agent still has raw credentials, this is advisory, not Handshake. |
| D4 | One developer entry surface carries the golden path end to end. | D2 and D3. | Unlocks activation UX. Still cannot claim broad runtime support. |
| D5 | Install Health reports the truth: protected, bypass-risk, advisory, unknown, blocked, or proof-gapped. | D3 and D4. | Unlocks honest installation status. Still cannot claim safety from a green badge. |
| D6 | The first receipt reconstructs proposal, policy, gateway check, mutation attempt, downstream uncertainty, proof gap, and recovery. | D2 through D5. | Unlocks operator value. Still cannot claim downstream business success. |
| D7 | The chosen path has repeatable install, update, and conformance checks. | D6. | Unlocks self-hosted activation. Still cannot claim ecosystem certification. |

### Tier 3 Hosted Operation

| ID | Decision Means | Depends On | Unlocks / Still Cannot Claim |
|---|---|---|---|
| H1 | Hosted routes derive caller identity from the request boundary before records commit. | D6/D7 when hosted claims begin. | Unlocks tenant-scoped route admission. Still cannot claim principal, agent, reviewer, gateway, or mutation authority. |
| H2 | Evidence read APIs expose redacted projections, not raw protocol records. | H1. | Unlocks external evidence reading. Still cannot expose raw payloads, tokens, provider data, or tenant material. |
| H3 | Hosted org/project/policy state becomes durable and auditable. | H1 and H2. | Unlocks hosted operation. Still cannot claim stronger enforcement unless gateways check greenlights. |
| H4 | Hosted registry manages gateway discovery and binding metadata. | H3. | Unlocks managed gateway operations. Still cannot authorize mutation from registry entries. |

### Authority Model

| ID | Decision Means | Depends On | Unlocks / Still Cannot Claim |
|---|---|---|---|
| A1 | `AuthorityGrant` models the principal/org delegation snapshot. | D6 and, for hosted use, H1. | Unlocks principal authority as policy context. Still cannot replace the action contract or gateway check. |
| A2 | `AgentIdentity` models runtime/agent proof. | D1 and A1. | Unlocks agent/runtime identity as policy and gateway input. Still cannot become permission or product center. |

### Tier 4 Ecosystem

| ID | Decision Means | Depends On | Unlocks / Still Cannot Claim |
|---|---|---|---|
| E1 | Runtimes prove they emit candidates, refusals, evidence, and uncertainty in the expected form. | D7 and H3. | Unlocks runtime conformance marks. Still cannot claim enforcement by runtime wrapper. |
| E2 | Gateways prove refusal-before-mutation for missing, replayed, mismatched, stale, isolated, and drifted greenlights. | D3 and D6. | Unlocks gateway conformance basis. Still cannot certify adapters. |
| E3 | Adapters get versioned tests, evidence, and revocation. | E1 and E2. | Unlocks adapter certification. Still cannot claim provider-side enforcement. |
| E4 | Providers or certified gateways own mutation credentials and check exact greenlights before consequence. | E2 and E3. | Unlocks provider-side enforcement claims. Still cannot claim cross-org audit. |
| E5 | Receipts can be verified across org boundaries without leaking raw evidence. | H2 and E4. | Unlocks cross-party audit. Still cannot claim ecosystem standard. |
| E6 | Schemas, conformance suites, versions, revocation, and evidence rules become governed. | E1 through E5. | Unlocks Tier 4 ecosystem language. Still cannot imply wallet, settlement, fraud, or marketplace infrastructure. |

### Adjacent Action Families

| ID | Decision Means | Depends On | Unlocks / Still Cannot Claim |
|---|---|---|---|
| P1 | Payment and transaction actions are treated as another protected action family, not as the product center. | A working non-payment Tier 2 path. | Unlocks payment-family research. Still cannot claim Handshake is wallet, settlement, accounting, fraud, or marketplace infrastructure. |

### Cross-Surface Operation

| ID | Decision Means | Depends On | Unlocks / Still Cannot Claim |
|---|---|---|---|
| S1 | One logical action exposed through UI, agent tool, HTTP, MCP, A2A, and CLI must still reduce to the same exact contract boundary. | D4. | Unlocks multi-surface adoption. Still cannot let "same action" mean same authority across all callers. |
| S2 | Untrusted app surfaces such as extensions, generated review UI, iframe tools, or embedded widgets need explicit callability rules. | S1. | Unlocks app-surface integration. Still cannot let a rendered or embedded surface spend the viewer's authority by default. |
| S3 | UI context, navigation state, selected text, screen snapshots, and app state can inform compilation but must be snapshotted and bound. | S1. | Unlocks context-aware agents. Still cannot let stale UI state launder vague intent into precise authority. |

### Remote Delegation And Continuations

| ID | Decision Means | Depends On | Unlocks / Still Cannot Claim |
|---|---|---|---|
| R1 | Remote agent calls need task identity, caller identity, lifecycle state, cancelability, and result binding before they affect protected paths. | H1 and S1. | Unlocks A2A-style delegation. Still cannot treat a remote agent reply as authority. |
| R2 | Public capability discovery must redact tenant, org, user, and integration fingerprints. | R1. | Unlocks agent cards or capability discovery. Still cannot expose protected capability inventory as public metadata. |
| R3 | Async continuations, retries, self-fired jobs, scheduled jobs, and crash recovery must preserve the original contract boundary. | R1. | Unlocks long-running delegated work. Still cannot let retry infrastructure mint fresh authority. |

### Persistence, Replay, And Resource Custody

| ID | Decision Means | Depends On | Unlocks / Still Cannot Claim |
|---|---|---|---|
| M1 | Memory, skills, learned preferences, and agent-generated facts are future context with provenance, not policy or authority. | D6 and A1/A2 when present. | Unlocks self-improving agents. Still cannot let memory rewrite delegation or protected-path policy silently. |
| V1 | Trace replay, eval loops, local debuggers, and simulation runs must be labeled non-production unless they pass through a protected gateway. | D6. | Unlocks replay/eval evidence. Still cannot let replay receipts imply real protected-surface enforcement. |
| K1 | Secret onboarding, API-key minting, token rotation, OAuth connection, and vault grants are protected actions. | D3. | Unlocks credential setup. Still cannot let an agent "just connect the API" outside a contract. |
| B1 | Budget, quota, GPU time, paid API calls, rate limits, and external generation spend are protected consequences even when no domain object mutates. | D3. | Unlocks cost-aware protected paths. Still cannot treat cost as mere telemetry. |
| G1 | Generated artifacts that later drive execution, datasets, launches, PRs, or provider calls need custody and promotion rules. | D1 and D6. | Unlocks generated-artifact workflows. Still cannot let a generated file become authority because it exists in the repo. |
| C1 | Parallel tool calls, same-turn mutations, retries, and concurrent branches need serialization and idempotency semantics. | D3 and D6. | Unlocks multi-action agents. Still cannot reuse one greenlight across competing or repeated mutations. |

## Veto Rules

Any C-suite lens can block a decision with one of these questions:

- CEO / Product: does this claim more than the enforcement path proves?
- CTO / Architecture: does this bind to the exact contract/policy/greenlight/gateway path, or only to a wrapper?
- CSO / CISO: can generated code, raw credentials, sibling tools, replay, stale policy, or isolation drift mutate anyway?
- DevEx: can a serious team reach and understand one receipt without reading every doc?
- GTM: can this be explained without overstating hosted, provider-side, or ecosystem enforcement?
- Ops: does this create support, hosting, or certification promises before evidence exists?

If a veto question fails, the answer is not "document the risk." The answer is
narrow the claim, change the mechanism, or defer the decision.

## Adversarial Review Result

This pass applied the plan-eng-review lens plus C-suite, security, architecture,
and agent-native pressure tests.

| Lens | Attack | Decision Response | Verdict |
|---|---|---|---|
| CEO / Product | The plan could turn "agent-native" into a broad platform claim before one protected action path works. | ADR 0006 narrows agent-native to surface binding, and the recommended sequence keeps one Tier 2 golden path ahead of broad consumers. | Keep, but do not sell broad agent-native support yet. |
| CTO / Architecture | Multiple entry surfaces can fork authority semantics even when they call the same underlying action. | S1/S2/S3 plus ADR 0006 require a shared contract posture and context snapshot binding. | Keep, with a two-origin same-digest red test before adding consumers. |
| CSO / CISO | Secrets, browser profiles, API keys, budgets, and generated artifacts can mutate consequences without looking like product actions. | ADR 0009 promotes custody/spend/artifact/concurrency to protected action families. | Keep, and treat "setup" as consequence when it enables future mutation. |
| Agent-Native | Shared app state, A2A, MCP, extensions, and UI actions make surface origin inseparable from authority binding. | ADR 0006 and ADR 0007 separate origin evidence from authority, and block remote replies from becoming permission. | Keep, but require surface and remote task records before claims. |
| Security Architecture | Replay, eval, durable memory, and self-improving skills can silently rewrite future scope or masquerade as proof. | ADR 0008 makes memory provenance-only by default and makes replay non-production unless gateway evidence is production-class. | Keep; never let replay receipts satisfy production enforcement. |
| Tier Doctrine | Tier 4 could be mistaken for "more integrations" or a certification badge without revocation. | ADR 0010 defines conformance, provider-side gateway evidence, cross-org verification, and revocation as separate gates. | Keep; Tier 4 remains deferred until Tier 2 and Tier 3 evidence exist. |

The brutal verdict: the plan spine is now useful, but it is still only a map.
The first proof remains a small Tier 2 protected path; the new ADRs mostly stop
future scope from laundering itself into the product before that path exists.

## Decision Packet

When any ID above becomes a plan or ADR, write the packet first:

```text
Decision:
Depends on:
Unlocks:
Still cannot claim:
ADR owner:
Authority boundary:
Credential posture:
Red tests:
Evidence to advance:
```

If `Authority boundary`, `Credential posture`, `Red tests`, or `Still cannot
claim` is vague, it is not ready.

## Recommended Forward Sequence

```text
0. Close local-alpha architecture hygiene
   - proves D0
   - keep 02b / 02c / 02d closeout evidence current
   - keep ADR follow-ups precise

1. Maintain Plan 05 foundation practice
   - executable transition matrix
   - fault-injecting ProtocolStore
   - transition cost budgets
   - typed transition error envelope
   - model-based invariant tests

2. Keep Plan 03 public graph surface cut
   - decides D1
   - landed: missing graph, unsupported graph, unsupported sibling, clean graph
     binding, issuer mismatch, truncation, raw material, bypass, fail-open
     classifier, observer-only, hidden-trigger, unknown-node coverage, graph
     drift, catalog/registry miss, codemode runtime graph production, and
     codemode whole-block partial-credit refusal
   - next: only choose a public helper through `ADR-FU-0002-D`; otherwise keep
     graph write/read APIs internal

3. Write the first Tier 2 protected-path plan
   - decides D2 / D3 / D4 together
   - default: protected MCP/CLI preview deploy
   - must fill the product-requirements planning gate
   - must include gateway credential posture and install-health truth state

4. Build one self-hosted golden path
   - proves D3 / D4 / D6
   - exact contract output
   - local policy decision
   - one-use greenlight
   - gateway-owned credential check before mutation
   - receipt/refusal/proof-gap reconstruction

5. Add self-hosted activation surfaces only after the path works
   - decides D5 / D7
   - SDK ergonomics
   - CLI quickstart
   - MCP/tool dispatcher
   - receipt timeline
   - install health
   - conformance fixtures

6. Decide cross-surface operation before adding more consumers
   - decides S1 / S2 / S3
   - governed by ADR 0006
   - bind UI, agent tool, HTTP, MCP, A2A, and CLI calls to contract posture
   - define extension/review-surface callability and context snapshot binding

7. Decide persistence, replay, and resource custody before self-improvement
   - decides M1 / V1 / K1 / B1 / G1 / C1
   - governed by ADR 0008 and ADR 0009
   - memory and skills remain context, not policy
   - replay and eval remain non-production unless gateway-checked
   - secrets, budgets, generated artifacts, and concurrency become protected

8. Implement Plan 04 only when hosted claims begin
   - decides H1
   - server-derived caller identity
   - tenant/org route admission
   - zero records on rejected hosted requests

9. Design public evidence/read API only when needed
   - decides H2
   - redacted projections
   - tenant/org checks
   - no raw protocol record exposure

10. Decide remote delegation and continuations before A2A-style claims
   - decides R1 / R2 / R3
   - governed by ADR 0007
   - task lifecycle, cancellation, retry, and continuation preserve original authority
   - capability discovery redacts tenant, org, user, and integration fingerprints

11. Move to Tier 3 hosted operation
   - decides H3 / H4
   - durable hosted receipt store
   - org/project access control
   - policy versioning
   - retention/search/alerts/audit export
   - managed registry

12. Defer Tier 4 ecosystem
   - defers E1 through E6 until Tier 2 and Tier 3 have evidence
   - governed by ADR 0010
   - conformance marks
   - adapter certification
   - provider-side gateway integrations
   - cross-org receipt verification
```

## Planning Gate For The Next Plan

Every new plan must answer this table before implementation:

| Gate | Required Answer |
|---|---|
| Doctrine tier | Tier 1 / Tier 2 / Tier 3 / Tier 4 |
| Product state after delivery | protocol proof / local proof / self-hosted gateway-checked path / hosted operation / provider-side enforcement |
| Agentic execution shape | single tool call / MCP chain / codemode block / retry loop / browser action / scheduled job / shell command / gateway-only |
| Protected action path | exact path from generated attempt to gateway check |
| Runtime posture | guidance only / hook-assisted / protected capability / bounded generation / gateway-only / hosted control plane |
| Mutation credential holder | fixture / customer gateway / hosted gateway / provider gateway |
| Gateway authority holder | who checks the exact greenlight before credential use |
| Candidate boundary | what becomes `CandidateAction`, and what refuses before `ActionContract` |
| Contract binding | digests, params, catalog snapshots, registry snapshots, policy versions, resource refs |
| Bypass posture | removed / blocked / detected / unknown / proof-gapped / advisory |
| Evidence after action | receipt / refusal / proof gap / reconciliation / isolation / export |
| Operator value | what the team can inspect, configure, verify, or recover |
| Non-claim | the strongest claim this plan must not imply |
| Quality contract | Product, Engineering, Security, DevEx, Design, Architecture, Domain Invariant |

If a plan cannot fill this table, it is not ready.

## Stop Signs

Use these as review failures:

- generated code becomes an action contract;
- runtime evidence becomes authority;
- MCP auth becomes mutation authority;
- caller identity becomes principal, agent, reviewer, or mutation authority;
- a rendered plan becomes permission;
- a review screen is not bound to exact contract digests;
- one greenlight authorizes multiple mutations;
- a gateway adapter mutates without `GatewayCheckAttempt`;
- a receipt implies downstream success not evidenced;
- local fixture proof is described as provider-side enforcement;
- hosted control plane is described as enforcement without gateway checks;
- raw records are exposed as public API;
- dashboard work starts before one gateway-checked protected path is obvious;
- one logical action has different authority binding across UI, HTTP, MCP, A2A,
  CLI, or agent tool surfaces;
- an extension, generated review UI, iframe, or embedded widget spends viewer
  authority without explicit callability rules;
- memory, learned skills, or agent-generated facts rewrite policy or delegation
  without a versioned authority decision;
- replay, eval, or simulation receipts are presented as production enforcement;
- secret onboarding, key minting, token rotation, budget spend, or generated
  artifact promotion happens outside a contract;
- retry, scheduled job, continuation, or remote task infrastructure mints fresh
  authority after the original attempt.

Smallest next mechanism: keep public graph APIs cut unless ADR-FU-0002-D proves a
helper surface, then choose the first Tier 2 protected-path plan using the
planning gate above.
