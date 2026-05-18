# Spec: Agent-Native Product Requirements Spine

Status: Draft requirements spine
Version: v0.2.1
Audience: Founder, product, protocol implementers, runtime builders, gateway owners, design partners
Implementation status: Specification only; use this to decide future `03+` plans
Canonical owner: Product owner
Doctrine source: [`../business/tier-doctrine-decision-memo.md`](../business/tier-doctrine-decision-memo.md)
Historical agent requirement source: [`../plans/archive/02-plan-eng-review-agent-requirements.md`](../plans/archive/02-plan-eng-review-agent-requirements.md)
Last reviewed: 2026-05-18

## Invariant At Stake

Product requirements must start from agentic execution, not from human personas, dashboards, or surface checklists.

Handshake exists because autonomous systems compile vague intent into tool calls, generated scripts, MCP operations, browser actions, scheduled jobs, cloud/API mutations, package operations, repo writes, deploys, and gateway-to-gateway workflows. A product plan that starts with "which human job?" can still produce reasonable SaaS work while failing to model the dangerous thing: generated execution crossing a mutation boundary.

The governing product invariant is:

```text
No consequential autonomous action executes outside declared bounds,
and divergent behavior must be haltable, isolatable, and reconstructable.
```

The governing product question is:

```text
What generated execution shape attempts consequence, and how does Handshake
turn it into an exact gateway-bound action contract before mutation?
```

Human operators, buyers, reviewers, and auditors still matter. They are adoption and operation contexts. They are not the first unit of product requirements.

## Autoreason Verdict

The previous spine was useful but over-anchored on a conventional product frame:

- actor job;
- surface job;
- primitive job;
- acceptance test;
- non-claim.

That frame prevents business sprawl, but it can under-specify generated-code behavior. The adversarial revision wins: make the first-class requirement an **agentic execution job**. Keep tiers, surfaces, primitives, and operator value as supporting constraints.

Decision:

```text
Future plans must begin with the agentic execution shape and protected action path.
Human/operator value is required, but secondary.
```

## Objective

Define the execution jobs, protected surfaces, primitives, tier requirements, planning gates, and acceptance tests that connect the long-term doctrine to implementation plans without drifting into human-SaaS planning theatre.

The long-term doctrine remains:

```text
Protected Actions for autonomous decision-making.
```

Success means every future `03+` plan can answer:

```text
Which agentic execution shape?
Which protected action path?
Which runtime posture?
Which gateway owns mutation authority?
Which candidate extraction and contract binding?
Which bypass posture?
Which refusal, proof-gap, and recovery behavior?
Which tier and non-claim?
```

If a plan starts with a dashboard, role, or public route before it identifies the generated execution shape, it is not ready.

## Research Color

This section is non-canonical research input. The local doctrine and protocol documents remain the source of truth.

Cloudflare Agentic Inbox is a useful agent-first example: the application organizes around durable agent state, explicit email tools, inbound email triggers, MCP access, and agent-visible tool calls. It also exposes the gap Handshake exists to close: the README states that any user passing the shared Cloudflare Access policy can operate on any mailbox through `/mcp` by passing `mailboxId`, with no per-mailbox authorization. See [cloudflare/agentic-inbox](https://github.com/cloudflare/agentic-inbox).

Cloudflare's MCP Code Mode is the sharper signal. Their Cloudflare API MCP server exposes thousands of API endpoints through `search` and `execute`, where the model writes generated JavaScript against a typed API surface. That means the product unit is often not a single tool call. It is generated code that can select, branch, and invoke many consequential operations. See [Cloudflare MCP servers](https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/).

Claude Code hooks show a real local control point: `PreToolUse` can block before a tool call runs, while `PostToolUse` is too late for prevention. But hooks also show why runtime control is not enough: some hook failures are non-blocking, async hooks cannot block, and command hooks run with the user's permissions. See [Claude Code hooks](https://code.claude.com/docs/en/hooks).

MCP itself gives a useful catalog and transport shape, but capability declaration is not authority. MCP hosts, clients, and servers negotiate capabilities and tools; Handshake must still bind consequential attempts to exact contracts and gateway checks. See [MCP architecture](https://modelcontextprotocol.io/specification/2025-06-18/architecture).

Product implication:

```text
Handshake must support hooks, MCP, CLI, codemode, and gateway-only paths,
but must not let any of them masquerade as mutation authority.
```

## Assumptions

- The current v0.2.1 protocol kernel is the foundation, not the product by itself.
- `01`, `01a`, and `02` remain supporting architecture and risk-control documents.
- `archive/02-plan-eng-review-agent-requirements.md` is historical input, not an executable phase.
- The tier doctrine is the top-level product direction.
- `03` must be chosen as one agentic execution shape plus one protected action path.
- Tier 2 activation is the next strategic milestone because it proves the open/self-hosted loop before hosted monetization.
- Preview deploy remains the likely first wedge, but this spine does not permit preview deploy to become the category.

## Product-Build Principles

These principles govern how Handshake product work is planned. They are build-time constraints, not visual design guidance. If a future plan violates them, the plan is not ready for implementation.

| Principle | What It Forbids | Planning Gate Effect |
|---|---|---|
| Generated execution shape first | Starting from dashboards, personas, routes, or review screens before naming the action attempt. | The plan must name the agentic execution shape before product surfaces. |
| One complete protected action path beats many weak surfaces | Spreading effort across CLI, MCP, UI, Cloud, and docs without one enforceable mutation path. | Scope must reduce to one protected action path unless each additional surface directly supports it. |
| Gateway check is the enforcement boundary | Treating hooks, MCP auth, review UI, identity, skills, dashboards, or receipts as mutation authority. | The plan must name the gateway authority holder and what is checked before credential use. |
| Runtime evidence is not authority | Selling hook-assisted, prompt-guided, or wrapper-observed flows as protected if the gateway cannot refuse. | Runtime posture must be labeled separately from gateway enforcement. |
| Refusal is product behavior | Optimizing only for green paths, demos, or success receipts. | Refusal, proof-gap, recovery, isolation, and install-health behavior must be planned when the path can diverge. |
| Tier claims follow evidence | Claiming hosted, provider-side, ecosystem, or standard status before the lower-tier proof exists. | Every plan must name doctrine tier and the honest product state it can claim after delivery. |
| Adapter proof is not product truth | Letting repo-write, package install, preview deploy, or any first adapter become the category. | The product claim must stay centered on protected action paths for autonomous decision-making. |
| Quality contracts precede implementation | Invoking CEO, DevEx, design, engineering, CSO, or architecture review only after sunk cost. | A Quality Contract is required before implementation and reconciled at closeout. |
| Docs must declare their role | Letting reference notes, archived plans, or business memos compete with executable specs. | Plans must cite canonical inputs and mark provenance inputs as non-authoritative. |

Hard stop:

```text
If a plan cannot name the agentic execution shape, protected action path,
gateway authority holder, bypass posture, non-claim, and acceptance evidence,
it is product theatre, not a Handshake implementation plan.
```

## Commands

Use these commands when changing this spec or plans that claim to implement it:

```bash
npm run typecheck -- --pretty false
npm run build -- --pretty false
bun test
git diff --check
rg -n "Receiver|receiver_|receiver-gate|receiver gate|receiver_resource|registerReceiver|receiverGate|reconcileReceiver" README.md QUALITY.md Agent-Founder.md docs src test package.json migrations
rg -n "trustedAgent|skipVerification|best effort receipt|approval only|advisory only|ambient authority|dashboard-first|audit-only" docs src test
```

For docs-only changes, `git diff --check` plus targeted `rg` scans are sufficient unless code behavior is claimed.

## Project Structure

```text
docs/business/
  tier-doctrine-decision-memo.md      long-term doctrine and monetization tiers
  canonical-product.md                current product direction
  protocol-vs-product.md              protocol/product/cloud split

docs/specs/
  00-product-requirements-spine.md    this governing agent-native requirements spine
  future specs                        concrete execution jobs and acceptance criteria

docs/plans/
  01-plan-eng-review-...              primitive/state reference
  01a-plan-eng-review-...             vocabulary migration checkpoint
  02-plan-eng-review-...              authority hardening gate
  archive/02-plan-eng-review-...      historical agent-runtime requirement notes
  future 03+ plans                    implementation plans derived from specs
```

Specs define what must be true and why. Plans define how. Code implements only accepted plan slices.

## Requirement Entry Style

Use this style for future requirements. Start from execution, not from the human persona.

```markdown
### Execution Job: MCP Tool Attempts Preview Deploy

Tier: Tier 2 self-hosted loop
Execution shape: single MCP protected capability call
Runtime posture: protected capability
Protected surface: preview deploy gateway
Mutation authority holder: provider-shaped gateway adapter
Primitives: ToolCapability, CandidateAction, ActionContract, PolicyDecision, Greenlight, GatewayCheckAttempt, Receipt, ProofGap

Agent behavior:
The agent attempts to create a preview deployment through a declared MCP/CLI tool.

Handshake obligation:
The tool call becomes an exact CandidateAction and ActionContract before any provider credential is used.

Gateway obligation:
The gateway refuses missing, replayed, mismatched, stale, isolated, or policy-drifted greenlights before mutation.

Bypass posture:
Raw provider deploy credentials are absent from the agent environment, or the path is marked advisory/bypass-risk.

Operator value:
A team can see whether the path was gateway-checked and reconstruct the run.

Acceptance:
- Candidate digest binds to the final contract digest.
- Policy greenlights or refuses the exact contract.
- Gateway check passes before mutation or refuses before mutation.
- Receipt/proof-gap evidence reconstructs proposal, decision, gateway check, and outcome.

Non-claim:
This does not control provider deploy paths that bypass the installed gateway.
```

Prefer short, falsifiable requirements over abstract product language.

## Execution-First Product Model

```text
vague principal intent
  -> generated agent plan, code, MCP call, shell command, browser action, or scheduled job
  -> runtime/tool capability observation
  -> classification: read_only | ambiguous | consequential | unwrapped_bypass
  -> CandidateAction or compilation refusal
  -> ActionContract proposal
  -> PolicyDecision: greenlight | refusal | review | halt | quarantine
  -> one-use gateway-bound Greenlight or refusal
  -> GatewayCheckAttempt before credential use
  -> MutationAttempt, gateway refusal, or ProofGap
  -> Receipt and stream reconstruction
  -> IsolationState checked before future policy and gateway paths
```

Forbidden product shortcuts:

```text
human approval of summary -> permission
runtime hook pass -> gateway authority
MCP auth -> mutation authority
agent identity -> mutation authority
generated code -> action contract
execution block bounds -> mutation authority
receipt -> downstream business success
Cloud dashboard -> enforcement
```

## Agentic Execution Jobs

These are the primary jobs. Future plans must pick at least one.

| Execution job | Agent behavior | Handshake obligation | Refusal/proof required | Non-claim |
|---|---|---|---|---|
| Single protected capability call | Agent calls one declared MCP/CLI/tool capability. | Classify capability and emit exact candidate or refusal. | Unknown, ambiguous, mismatched, or unwrapped calls fail closed. | Tool availability is not authorization. |
| Generated MCP/tool chain | Agent calls multiple tools in sequence. | Preserve sequence and emit separate candidates for each consequential step. | Later mutations refuse if predecessor evidence is missing, refused, or not final. | A workflow plan is not a batch greenlight. |
| Codemode block | Agent writes code against a typed API/tool surface. | Record execution block bounds and extract each consequential branch as a candidate. | Dynamic tool/API construction refuses unless resolved to pinned catalog entries. | Generated code is not an action contract. |
| Retry loop | Agent retries after timeout, refusal, or partial outcome. | Distinguish same-operation reconciliation from fresh mutation authority. | Old greenlight cannot authorize a new mutation. | Retry intent is not permission. |
| Browser-side action | Agent can click or submit forms outside server-observed tools. | Mark bypass-prone unless gateway check is observable and enforceable. | Missing observable gateway evidence becomes ProofGap or bypass evidence. | Browser automation is not automatically protected. |
| Scheduled/background job | Agent or runtime wakes later and acts. | Bind run identity, freshness, expiry, and allowed action classes. | Stale run or changed policy refuses before mutation. | A past envelope does not authorize future mutation. |
| Raw shell/cloud/package command | Agent proposes terminal command with side effects. | Normalize to a capability/action candidate when possible; otherwise refuse or record bypass risk. | Production/destructive paths refuse unless contracted and gateway-owned. | A shell hook is not gateway enforcement. |
| Gateway-only path | Runtime provides weak or no issuer visibility. | Preserve invariant by requiring gateway to refuse without current exact greenlight. | Missing greenlight refuses before credential use. | Lack of runtime visibility cannot be sold as controlled orchestration. |
| Review-rendered plan | Agent or UI shows a plan to a human. | Bind render artifact to exact contract digests and uncertainty markers. | Summary/contract mismatch blocks review authority. | Review UI is not permission. |
| Recovery after refusal/proof gap | Agent proposes narrower follow-up. | Link recovery to a fresh candidate and new evidence. | Recovery recommendation cannot be reused or treated as authority. | Recovery is not continuation of old greenlight. |

## Runtime Posture Ladder

Runtime posture is not authority. It defines how much issuer-side evidence Handshake can collect before the gateway check.

| Runtime posture | Useful control | Required label | Must still be true |
|---|---|---|---|
| Prompt guidance | Influences model behavior. | guidance_only | Gateway refuses without exact greenlight. |
| Hook-assisted | Can block local dispatch before tool execution. | issuer_control | Hook evidence contributes to compilation; gateway still enforces. |
| Protected capability | Agent sees only protected tools for a guarded action family. | protected_capability | Raw sibling credentials must be absent or marked bypass-risk. |
| Codemode block | Generated code runs inside declared bounds. | bounded_generation | Each consequential branch still needs a candidate/contract. |
| Gateway-only | Runtime may be opaque or hostile. | gateway_enforced_only | Gateway refuses all missing/mismatched/replayed/stale attempts. |
| Hosted operation | Cloud issues policy/greenlight and stores evidence. | hosted_control_plane | Gateway still holds/enforces mutation credential. |

## Protected Surface Jobs

Surfaces are secondary to execution jobs. A surface earns scope only when it advances a protected action path.

| Surface | Tier | Execution job served | Authority boundary | Evidence produced | Success criteria | Failure mode |
|---|---|---|---|---|---|---|
| Protocol kernel | Tier 1 | All execution jobs. | State transitions and gateway check semantics. | Records, streams, receipts, proof gaps. | Invariant tests pass for replay, mismatch, isolation, proof gap. | Correct-looking protocol that still allows ambient authority. |
| TypeScript SDK | Tier 1/2 | Protected capability, gateway adapter, Cloud client. | None; SDK is a client. | Typed requests/responses and structured errors. | Exposes only approved interfaces; preserves refusal semantics. | SDK method implies authority without gateway enforcement. |
| CLI | Tier 2 | Setup, inspection, local proposal, install health. | None unless invoking local gateway fixture. | Config checks, contract/receipt output, install health. | First receipt reachable without sales call. | CLI becomes a demo harness that never maps to production shape. |
| MCP/tool dispatcher | Tier 2 | Single capability call, tool chain, protected capability. | Can block local dispatch, but gateway still enforces consequence. | Candidate actions, runtime evidence, bypass posture. | Consequential calls become exact candidates or refusals. | MCP middleware is mistaken for protected-surface enforcement. |
| Runtime wrapper | Tier 2 | Hook-assisted, codemode, scheduled, browser, shell paths. | Runtime can assist, not authorize. | Generated code/spec refs, facade evidence, uncertainty markers. | Ambiguous/unwrapped calls fail closed or become proof gaps. | Generated code escapes the contract boundary. |
| Gateway adapter | Tier 2/3 | All protected mutation paths. | Gateway check before credential use. | Gateway check attempt, mutation/refusal/proof gap. | Missing/replayed/mismatched/stale attempts refuse before mutation. | Adapter mutates based on local trust or caller-declared success. |
| Contract Viewer | Tier 2/3 | Review-rendered plan. | None; display only. | Render artifact digest and review context. | UI binds to exact contract digest. | Review theatre: summary differs from contract. |
| Receipt Timeline | Tier 2/3 | Reconstruction after mutation, refusal, gap, or isolation. | None; evidence only. | Stream offsets, receipts, gaps, export packets. | Distinguishes gateway check, mutation attempt, downstream finality. | Evidence theatre: logs imply success not proven. |
| Install Health | Tier 2/3 | Bypass posture and raw credential posture. | None; posture only. | Raw bypass risk, missing gateway, credential posture. | Marks advisory paths as advisory. | Green badge without gateway enforcement. |
| Conformance runner | Tier 1/2/4 | Runtime/gateway invariant proof. | None; test evidence only. | Conformance result and failure report. | Black-box refusal-before-mutation tests pass. | Fixture runner replaces production gateway shape. |
| Cloud control plane | Tier 3 | Hosted operation across paths. | Cloud can issue policy decisions/greenlights; gateway still enforces. | Hosted receipts, search, retention, alerts, audit exports. | Teams can operate multiple protected paths reliably. | Dashboard-first governance without enforcement. |
| Ecosystem/conformance marks | Tier 4 | Independent runtime/gateway compatibility. | Certified gateway still enforces. | Signed conformance evidence. | Mark maps to exact test suite and adapter version. | Logo becomes trust theatre. |

## Primitive Jobs

Primitives are valuable only when they support execution control, gateway enforcement, or reconstruction.

| Primitive | Execution role | Who relies on it | Must never claim |
|---|---|---|---|
| `ToolCapability` | Names callable capability and bypass risk. | Runtime integrator, compiler, policy. | Tool availability is authorization. |
| `ActionType` | Defines consequential action shape Handshake can contract. | Compiler, gateway owner, policy. | Model-invented action classes are valid. |
| `GatewayRegistryEntry` | Binds gateway, adapter, surface kind, policy version, resource namespace. | Gateway owner, policy, gateway check. | Registry entry alone authorizes mutation. |
| `CandidateAction` | Binds exact compiled candidate before contract proposal. | Compiler, contract proposal, reviewer. | Candidate is execution authority. |
| `IntentCompilationRecord` | Records assumptions, uncertainty, rejected overreach, generated evidence. | Runtime integrator, auditor, policy. | Clean prose equals exact contract. |
| `ActionContract` | Represents proposed consequential commitment. | Policy, reviewer, gateway check. | Proposal is permission. |
| `PolicyDecision` | Decides greenlight/refusal/review/halt/quarantine against exact contract. | Gateway check, auditor, operator. | Policy success proves mutation occurred. |
| `Greenlight` | Provides one-use gateway-bound execution authority input. | Gateway check. | Reusable or transferable authority. |
| `GatewayCheckAttempt` | Enforces exact binding before consequence. | Gateway owner, auditor, product claim. | Post-hoc logging is enforcement. |
| `MutationAttempt` | Records submitted/refused/failed/unknown consequence attempt. | Receipt timeline, recovery, audit. | Downstream business success. |
| `SurfaceOperationReconciliation` | Reconciles same downstream operation without new mutation authority. | Gateway owner, auditor. | Retrying mutation under old greenlight. |
| `Receipt` | Reconstructs what happened and what evidence exists. | Operator, auditor, agent recovery loop. | Proof of anything not evidenced. |
| `ProofGap` | Preserves missing/uncertain evidence as first-class state. | Security, recovery, operator. | A footnote that can be ignored. |
| `IsolationState` | Blocks future policy/gateway paths after divergence. | Policy, gateway, operator. | Runtime-only stop signal. |
| `RecoveryRecommendation` | Suggests narrowed future path after refusal/gap. | Agent loop, operator, policy. | Reuse of old greenlight. |

## Tier Requirements

### Tier 1: Open Protocol Foundation

Activation job: let serious implementers inspect and reproduce the primitive.

Required proof:

- exact action contracts;
- one-use greenlight semantics;
- gateway check before mutation;
- refusal/proof-gap/receipt semantics;
- isolation state semantics;
- conformance fixtures and invariant tests.

Product surfaces:

- schemas;
- reference implementation;
- conformance fixtures;
- protocol docs.

Prohibited shortcut:

```text
Calling the reference implementation a standard before independent runtime and gateway integrations exist.
```

### Tier 2: Self-Hosted Protected Action Loop

Activation job: get a team to its first gateway-checked receipt without a sales call.

Required proof:

- one concrete agentic execution shape is supported end to end;
- one protected action path proposes exact candidates;
- one gateway owns the mutation credential for that protected path;
- raw credential/bypass posture is explicit;
- unsafe cases refuse before mutation;
- local receipt timeline reconstructs the run;
- install health states whether the path is enforcing, advisory, or bypass-risk.

Product surfaces:

- SDK;
- CLI;
- MCP/tool dispatcher;
- local policy loop;
- local receipt store;
- gateway adapter;
- Contract Viewer or readable exact contract output;
- Receipt Timeline;
- Install Health;
- conformance runner.

Prohibited shortcut:

```text
Local fixture success presented as production provider enforcement.
```

### Tier 3: Hosted Handshake Cloud

Activation job: operate protected actions across a team or organization.

Required proof:

- hosted durable receipts;
- retention and audit export;
- org/project access control;
- search across principals, agents, runs, contracts, gateways, proof gaps, refusals, bypass evidence, and isolation;
- alerts for bypass, drift, replay, proof gap, and isolation events;
- managed registry and supported adapters.

Product surfaces:

- hosted policy/greenlight service;
- receipt store;
- audit explorer;
- proof-gap workbench;
- Install Health monitoring;
- alerts;
- enterprise security packet.

Monetization boundary:

```text
Charge for operated evidence, governance, retention, search, alerts, support, and reliability.
Do not charge for the existence of the primitive.
```

Prohibited shortcut:

```text
Dashboard or audit export that implies enforcement without gateway checks.
```

### Tier 4: Future Ecosystem

Activation job: make protected action control a network property after activation and hosted operation are real.

Required proof:

- independent runtime conformance;
- independent gateway conformance;
- signed adapter certification evidence;
- cross-org receipt verification;
- clear non-claims for non-integrated providers.

Product surfaces:

- conformance marks;
- adapter certification;
- embedded runtime partnerships;
- future payment-rail protected action adapters.

Prohibited shortcut:

```text
Marketplace, ecosystem, or payment-rail claims before first-party protected paths work.
```

## Planning Gate For Future `03+` Work

Every future plan must fill this table before implementation:

| Gate | Answer |
|---|---|
| Doctrine tier | Tier 1 / Tier 2 / Tier 3 / Tier 4 |
| Protected action path | Which exact path from generated attempt to gateway check? |
| Agentic execution shape | Single tool call / MCP chain / codemode block / retry loop / browser action / scheduled job / shell command / gateway-only |
| Runtime posture | Prompt guidance / hook-assisted / protected capability / codemode block / gateway-only / hosted operation |
| Protected surface | Which deploy/package/repo/CI/cloud/data/support/billing surface can mutate? |
| Mutation authority holder | Which gateway/adapter/provider owns the credential? |
| Gateway authority holder | Which gateway, adapter, or provider owns the final pre-mutation enforcement decision? |
| Candidate extraction | What becomes CandidateAction, and what refuses before ActionContract? |
| Contract binding | Which digests, catalog versions, params, resource refs, and policy versions bind? |
| Gateway enforcement | What does the gateway check before credential use? |
| Bypass posture | Which raw/sibling paths are removed, blocked, detected, unknown, or proof-gapped? |
| Refusal and recovery | What structured refusal or fresh narrowed proposal can the agent receive? |
| Evidence | What receipt/refusal/proof gap/bypass evidence remains? |
| Operator value | What can a team understand, configure, or audit because this exists? |
| Acceptance test | What test proves the execution job, not just the object? |
| Non-claim | What must the product not imply? |
| Unlock | What next tier/surface/execution shape becomes possible? |
| Quality Contract | Which Product/CEO, Engineering, Security/CSO, DevEx, Design, Architecture, and Domain Invariant gates apply before implementation? |

If the table starts with a human persona and cannot answer the execution-shape rows, the plan is not ready. If the Quality Contract is missing, the plan is not ready. Missing quality evidence is a planning failure, not closeout cleanup.

### Quality Contract Requirement

Every future plan must declare the applicable quality lenses before implementation:

```text
Product / CEO
Engineering
Security / CSO
DevEx
Design
Architecture
Domain Invariant
```

Each applicable lens must include a target, hard stops, evidence required, and closeout status. Do not average lens scores. A hard-stop failure blocks delivery even when other scores are high.

## Candidate `03` Directions

These are candidate specs, not implementation approval.

### Direction: Protected MCP/CLI Preview Deploy

Execution shape: single protected MCP/CLI capability call.

Why it fits: it matches the tier doctrine's preview deploy wedge while proving the first protected action path.

Acceptance:

- raw provider deploy credentials are absent from the agent context or marked bypass-risk;
- the MCP/CLI call emits CandidateAction and ActionContract with digest binding;
- local policy greenlights or refuses the exact contract;
- provider-shaped gateway consumes one-use greenlight before mutation;
- receipt/proof-gap reconstructs proposal, policy, gateway check, and outcome.

### Direction: Hook-Assisted Shell Guard As Issuer Evidence

Execution shape: shell command proposed through a runtime hook.

Why it fits: it models the market pain shown by production-database hook patterns without pretending hooks are Handshake enforcement.

Acceptance:

- hook payload normalizes to a RuntimeFacadeCall or IntentCompilationRecord evidence ref;
- destructive production command refuses or becomes bypass evidence before ActionContract;
- no claim of gateway enforcement unless a credential-owning gateway checks greenlight before mutation.

### Direction: Codemode Multi-Action Extraction

Execution shape: generated program containing multiple consequential candidates.

Why it fits: Cloudflare-style Code Mode makes generated code over typed APIs a real agent pattern.

Acceptance:

- generated block bounds are recorded as compilation context;
- every consequential branch emits a separate CandidateAction or refusal;
- no greenlight is reused across multiple mutations;
- sequence dependencies refuse when predecessor evidence is missing.

### Direction: Install Health Truth For One Protected Path

Execution shape: any protected path with possible raw sibling authority.

Why it fits: teams need to know whether Handshake is enforcing, advisory, or blind.

Acceptance:

- installed path reports `gateway_checked` only when the gateway owns mutation credentials;
- raw sibling credentials report `bypass_risk`;
- missing gateway reports `advisory`;
- no UI/docs copy claims control beyond the evidenced path.

## Testing Strategy

Testing must follow the execution job, not just the object.

For runtime and candidate extraction:

- capability classification tests for read-only, ambiguous, consequential, and unwrapped bypass;
- deterministic params digest tests;
- generated code/spec ref redaction tests;
- dynamic tool-name construction refusal tests;
- retry and sequence dependency tests.

For protocol work:

- unit tests for invalid transitions;
- digest/canonicalization tests;
- D1/Hono/SDK integration tests;
- replay/mismatch/isolation/proof-gap tests;
- vocabulary and authority scan tests where practical.

For gateway work:

- refusal-before-mutation tests for missing, replayed, mismatched, stale, isolated, and gateway-policy-drifted greenlights;
- one-use consumption tests;
- idempotency and same-operation reconciliation tests;
- caller-declared outcome rejection tests;
- current isolation re-check immediately before credential use.

For product surfaces:

- end-to-end proof of the execution job;
- install health truth-state tests;
- receipt reconstruction tests;
- review artifact digest-binding tests;
- no-claim checks in docs and UI copy.

For Cloud:

- retention/export/search tests;
- multi-tenant access checks;
- alert generation tests for bypass, replay, drift, proof gap, and isolation;
- hosted operation tests that do not claim enforcement without gateway checks.

## Boundaries

Always:

- map every plan to an agentic execution shape, protected action path, runtime posture, gateway enforcement point, bypass posture, tier, acceptance test, and non-claim;
- preserve gateway check as the enforcement boundary;
- treat proof gaps and bypass evidence as first-class;
- distinguish product activation from protocol correctness and hosted operation;
- prefer one complete protected path over many weak surfaces.

Ask first:

- adding public routes;
- changing schema/digest material;
- adding a new top-level product surface;
- adding a new gateway family;
- moving anything from Tier 2 self-hosted to Tier 3 hosted-only;
- claiming provider-side enforcement;
- treating a hook, MCP server, identity object, skill, or runtime adapter as stronger than issuer evidence.

Never:

- anchor a plan only on human personas or dashboards;
- treat runtime guidance, MCP auth, hooks, review screens, dashboards, receipts, identity, or skills as mutation authority;
- claim control while raw mutation credentials remain available to the agent for the same protected surface;
- sell payment rails, wallets, budgets, settlement, accounting, credit, fraud, or marketplace behavior as Handshake-owned scope;
- implement a plan that cannot pass the planning gate table above.

## Success Criteria

This spec is useful only if it changes planning behavior.

Done means:

- future `03+` plans reference this spec;
- every implementation task maps to an agentic execution shape and protected action path;
- `02` hardening work is selected because it unlocks an execution-control job, not because an object exists;
- product docs can explain what is open, self-hosted, hosted, and future ecosystem;
- surfaces do not multiply unless they improve execution control, gateway enforcement, recovery, or reconstruction;
- sprawl becomes visible early enough to stop.

## Open Questions

- Is `02` Phase 0/1 complete enough for `03`, or must the protected MCP/CLI preview-deploy plan include those tasks as hard blockers before agent-runtime work?
- Should the hook-assisted shell guard be a conformance fixture, a docs example, or a later runtime adapter?
- Which raw credential posture can the first Tier 2 quickstart actually prove without lying?
- What customer evidence is needed before broadening from engineering-agent protected actions to support, billing, commerce, or data-plane surfaces?
- What is the smallest Cloud operation story that follows naturally after a self-hosted gateway-checked receipt loop?

## Current Recommendation

Do not write `03` as "agent integration" or as a human workflow plan.

Write `03` as:

```text
one agentic execution shape
+ one protected action path
+ one gateway-owned mutation credential
+ one receipt/proof-gap reconstruction loop
```

The most coherent first `03` is a protected MCP/CLI preview-deploy path after `02` Phase 0 and Phase 1 are complete. If that hardening is not complete, `03` must list it as a blocker before any agent-runtime work.

Smallest next mechanism: complete `02` Phase 0/1, then write the `03` spec by filling the planning gate for protected MCP/CLI preview deploy.
