# Full Agentic Experience Architecture

Status: Canonical public alpha
Version: v0.2.1
Audience: Product, protocol implementers, agent-runtime builders, gateway owners, platform engineering, security engineering, design partners
Implementation status: Product architecture; depends on the v0.2 protocol kernel, completion audit, and reference package-install/repo-write gateway proofs; production gateway integrations remain target work
Canonical owner: Product owner
Extends: [`protocol-kernel.md`](../protocol/protocol-kernel.md), [`protocol-completion-audit-v0.2.md`](../audits/protocol-completion-audit-v0.2.md), [`runtime-integration.md`](../protocol/runtime-integration.md), [`gateway-integration.md`](../protocol/gateway-integration.md)
Last reviewed: 2026-05-17

## Customer And Moment Of Value

Customer: engineering teams adopting coding agents near production-adjacent work.

Moment of value: a coding agent attempts one consequential action, Handshake turns it into an exact action contract, policy greenlights or refuses it, the gateway check enforces before mutation, and the receipt timeline reconstructs what happened, what was refused, and what evidence is missing.

## Invariant At Stake

No consequential autonomous action executes outside declared bounds, and divergent behavior must be haltable, isolatable, and reconstructable.

The full agentic experience exists to make that invariant feel obvious, usable, and valuable to a developer team. If the experience is beautiful but cannot point to exact protocol objects and gateway-side enforcement, it is product theatre.

## Experience Thesis

Agents may propose and orchestrate. Handshake contracts. Gateways enforce. Receipts reconstruct.

The product is not a dashboard around agent activity. The product is the path from vague intent to gateway-checked consequence:

```text
principal intent
  -> generated agent orchestration
  -> issuer/runtime classification
  -> intent compilation record
  -> exact action contract
  -> policy decision
  -> one-use greenlight or refusal/review/halt/quarantine
  -> gateway check before mutation
  -> mutation, refusal, or proof gap
  -> receipt timeline
  -> isolation and recovery
```

The experience should feel as legible as a Vercel preview deploy, as precise as a Stripe API call, as fast as a Cloudflare Worker, as disciplined as a Linear issue state, and as dependency-aware as installing from npm. The difference is that every visual and API surface must bind to gateway-enforced execution authority.

## What The Experience Must Prove

Handshake is successful only if a design partner can watch one run and say:

```text
I would let an agent do this larger action because the gateway refuses anything outside the exact contract, and I can reconstruct the chain afterward.
```

That requires five product proofs:

1. Activation: reach the first gateway-checked receipt quickly.
2. Authority: greenlight is exact, one-use, gateway-bound, and consumed at the gate.
3. Refusal: missing, replayed, mismatched, isolated, drifted, or evidence-unavailable attempts refuse before mutation.
4. Reconstruction: timeline separates policy decision, gateway check, mutation attempt, downstream status, proof gap, reconciliation, and isolation.
5. Expansion: the buyer can name the second action family they would guard next.

## Experience Standards

Every Handshake surface must satisfy these standards:

| Standard | Requirement | Failure sign |
|---|---|---|
| Exact binding | The surface shows or carries `action_contract_id`, canonical digest, gateway ID, action class, resource, parameter digest, and policy/gateway versions where relevant. | A user can approve or execute from a summary that differs from the contract. |
| Gateway primacy | The gateway check is the enforcement boundary before mutation. | The product claims control from a runtime hook, plugin, or log. |
| Refusal is first-class | Refusal has reason codes, recovery hints, and receipt evidence. | Refusal reads like an error or disappears from the main journey. |
| Proof gaps are honest | Missing evidence becomes a `ProofGap`, not a spinner or success state. | The UI smooths uncertainty into generic pending/success copy. |
| Generated code is proposal | Generated scripts, branches, loops, retries, MCP calls, browser actions, and package/cloud/repo/database mutations become contract candidates or refusals. | Generated orchestration can mutate without a candidate contract or bounded batch contract. |
| Isolation is enforceable | Isolation is checked at policy time and gateway-check time. | A stale greenlight can mutate after quarantine. |
| Low-risk work flows | Read-only and non-consequential work should continue without approval spam. | Handshake becomes a review queue for every tool call. |
| Activation before management | First-run experience reaches a real receipt before org/fleet management. | The first screen is a dashboard with no enforceable action. |

## Practical Integration Reality

Handshake is not an omniscient observer over every shell, browser, network, MCP, or generated-code path. It works when a consequential action is forced through a protected action path or when the gateway refuses raw calls that lack an exact current greenlight.

The product must say this plainly:

```text
Remove raw mutation authority from the agent.
Expose protected Handshake capability.
Let the gateway adapter own mutation credentials.
Require gateway check before mutation.
```

Integration modes:

| Mode | Product value | Enforcement boundary |
|---|---|---|
| Hook-assisted runtime | Better classification and refusal UX inside runtimes with before-tool-call hooks | Gateway gate, not the hook |
| Protected MCP/CLI capability | Default install path for Codex, Claude Code, MCP, and CLI-shaped workflows | Gateway adapter owning credentials plus gateway check |
| Codemode block | Generated programs declare tools, gateways, retry limits, branches, and evidence expectations | Each consequential branch still needs an exact contract and gate |
| Gateway-only enforcement | Minimal mode for thin runtimes or hostile environments | Gateway refuses anything without exact greenlight; missing runtime evidence becomes proof gap |

Raw credential rule: if the agent can mutate the gateway directly, Handshake does not control that action. The honest product state is bypass evidence or proof gap when visible, not gateway-checked control.

## Actor Map

| Actor | Job in the experience | Must never be treated as |
|---|---|---|
| Principal | Expresses vague intent and delegates an operating envelope. | Exact mutation authority. |
| Agent | Proposes, plans, generates code, and orchestrates tools. | Authority source. |
| Issuer runtime | Observes protected or declared tool attempts, classifies capability, records compilation evidence, and blocks local dispatch when required. | Gateway enforcement boundary or omniscient observer. |
| Handshake kernel | Canonicalizes contracts, evaluates policy, issues refusals/greenlights, records stream events, receipts, proof gaps, and isolation. | Gateway business logic. |
| Policy | Decides against exact contracts, envelopes, gateway policy, and current isolation. | Execution proof. |
| Gateway | Owns consequence and enforces exact greenlight before mutation. | Passive log sink. |
| Operator/security reviewer | Reviews exact contracts, receipts, proof gaps, and isolation. | Summary approver detached from contract digest. |
| Buyer/champion | Chooses the first guarded action family and expansion path. | Generic governance buyer. |

## Canonical Journey

### 1. Principal Gives Vague Intent

User-visible moment:

```text
Fix the checkout bug and prepare a preview release.
```

Mechanism:

- `PrincipalAuthority` and `OperatingEnvelope` define who may attempt what.
- The envelope authorizes attempts, not mutations.

Experience rule: show the operating envelope as context, not permission.

### 2. Agent Generates Orchestration

User-visible moment:

```text
Agent reads files, edits code, runs tests, and eventually wants a preview deploy.
```

Mechanism:

- Runtime exposes `ToolCapability` catalog.
- Generated code/spec refs are recorded in `IntentCompilationRecord`.
- Generated execution block bounds may frame allowed tools, gateways, retry limits, expiry, evidence, and stop conditions.

Experience rule: low-risk work should flow; consequential paths must become candidates.

### 3. Runtime Classifies The Attempt

User-visible moment:

```text
preview_deploy is recognized as guarded consequence.
```

Mechanism:

- Runtime adapter classifies action as `read_only`, `ambiguous`, `consequential`, or `unwrapped_bypass`.
- `ActionType` and `GatewayRegistryEntry` must be pinned before a contract can exist.

Experience rule: ambiguous or unwrapped bypass paths must stop with structured refusal, not fake precision.

### 4. Candidate Is Recorded And Validated

User-visible moment:

```text
Handshake shows what the agent is trying to do and what uncertainty remains.
```

Mechanism:

- The agent or runtime drafts a candidate action from generated orchestration.
- `IntentCompilationRecord` records candidate actions, assumptions, overreach, uncertainty markers, generated code/spec references, catalog versions, and gateway policy versions.

Experience rule: candidate validation may happen only inside catalogs. It cannot mint authority or prove the principal understood every implication.

### 5. Contract Viewer Shows The Exact Action

User-visible moment:

```text
Action: preview_deploy
Gateway: vercel-preview
Resource: repo/web-checkout
Params digest: sha256:...
Bounds: preview only, one attempt, expires in 10 minutes
```

Mechanism:

- `ActionContract` binds gateway, resource, parameter digest, side effects, bounds, idempotency key, canonicalizer version, and canonical digest.

Experience rule: rendered text must be subordinate to the digest. A review surface that is not digest-bound is review theatre.

### 6. Policy Decides

User-visible moment:

```text
Greenlit, refused, review required, halted, or quarantined.
```

Mechanism:

- `PolicyDecision` evaluates the exact contract against the envelope, policy pack, gateway policy, and current `IsolationState`.
- Greenlight is created only for a greenlight decision.

Experience rule: refusal is a valid product outcome. It should say what narrowed action may be tried next.

### 7. Gateway Check Enforces

User-visible moment:

```text
Gateway checks the greenlight before mutation.
```

Mechanism:

- `GatewayCheckAttempt` verifies greenlight existence, freshness, one-use state, contract digest, gateway ID, action class, resource reference, parameter digest, gateway policy drift, idempotency, isolation, and receipt/outbox capability.
- Greenlight consumption must be atomic with gate evidence.

Experience rule: if the gateway does not refuse before mutation, the integration is advisory, not Handshake.

### 8. Mutation, Refusal, Or Proof Gap Records

User-visible moment:

```text
Preview deployed, gateway refused, or evidence missing.
```

Mechanism:

- `MutationAttempt` records attempted downstream work only after the gate passes.
- Gateway refusal records why no mutation occurred.
- `ProofGap` records missing, invalid, unavailable, expired, or contradictory evidence.

Experience rule: downstream pending is not success. Unknown is not success. Missing evidence is not failure; it is a proof gap.

### 9. Receipt Timeline Reconstructs

User-visible moment:

```text
The run shows intent, contract, decision, greenlight, gateway check, mutation/refusal, proof gaps, reconciliation, and isolation.
```

Mechanism:

- `Receipt` binds the chain.
- `ContractStreamEvent` provides ordered, digest-chained replay.
- Reconciliation checks status for the same surface operation; it does not create new authority.

Experience rule: the timeline must show phase boundaries, not a single success badge.

### 10. Isolation And Recovery Shape The Next Action

User-visible moment:

```text
Agent is blocked from deploy actions after scope creep, or receives a narrowed recovery path.
```

Mechanism:

- `IsolationState` interdicts future policy decisions and gateway checks.
- Recovery proposes narrowed future contracts or human review, never retroactive permission.

Experience rule: recovery should help the agent continue within narrowed bounds without revealing bypass instructions.

## Canonical Product Surfaces

### Agent-Facing Surface

Purpose: teach the agent how to request contracted execution and recover from refusal.

Allowed:

- action-contract request grammar;
- structured refusal reason codes;
- allowed next-action hints;
- evidence requirements;
- stop conditions after proof gap or isolation.

Forbidden:

- giving the agent reusable authority;
- exposing bypass mechanics;
- treating model-generated plans as permission.

### Runtime Adapter Surface

Purpose: detect and classify consequential attempts where generated orchestration touches tools.

Allowed:

- `ToolCapability` catalog;
- before-tool-call classification;
- deterministic argument digesting;
- generated execution block bounds;
- issuer evidence contribution;
- fail-closed dispatch for consequential ambiguity.

Forbidden:

- plugin-only enforcement claims;
- unwrapped consequential tools;
- local approval as gateway execution proof.

### Contract Viewer

Purpose: make the exact `ActionContract` legible.

Required:

- gateway ID and policy version;
- action class;
- resource reference;
- parameter digest and non-secret summary;
- side effects and bounds;
- idempotency key;
- expiry;
- canonical digest;
- uncertainty and overreach state.

Forbidden:

- approving a summary detached from the contract digest.

### Gateway Check SDK

Purpose: make gateway enforcement easy to install correctly.

Required:

- exact greenlight verification;
- one-use consumption ledger;
- idempotency handling;
- current isolation check;
- gateway policy drift semantics;
- transactional receipt/outbox behavior;
- refusal reason codes.

Forbidden:

- verify-only compatibility path that permits mutation without exact contract binding.

### Receipt Timeline

Purpose: reconstruct the action chain without laundering uncertainty.

Required:

- intent compilation evidence recorded;
- action proposed;
- policy decision;
- greenlight or refusal;
- gateway check attempt;
- greenlight consumption;
- mutation attempt or gateway refusal;
- downstream status;
- proof gap;
- reconciliation;
- isolation event.

Forbidden:

- success state that hides proof gaps or downstream uncertainty.

### Operator Surface

Purpose: help platform/security teams inspect and intervene.

Allowed after first receipt activation:

- isolation console writing durable `IsolationState`;
- proof-gap workbench;
- gateway registry console;
- policy pack editor;
- review queue bound to exact contract digests;
- audit export packet.

Forbidden before activation:

- fleet dashboard;
- broad governance portal;
- compliance theatre;
- generic incident workflow.

## API And SDK Shape

The developer product should ship as copy-pasteable primitives:

| Surface | First version |
|---|---|
| Kernel API | Create compilation, contract, policy decision, gateway check attempt, reconciliation, isolation, receipt lookup. |
| Runtime SDK | Classify tool calls, emit compilation record, block/refuse ambiguity, pass greenlight reference to gateway-bound tool path. |
| Gateway SDK | Verify exact greenlight, consume once, record refusal/mutation/proof gap, append stream event. |
| Conformance runner | Validate the golden path, refusal path, replay path, mismatch path, proof-gap path, and isolation race path against public protocol and gateway interfaces. |
| Receipt renderer | Render one action chain from protocol objects. |
| Test harness | Assert forbidden transitions and gateway refusal before mutation. |

SDKs are product surfaces. Bad SDK defaults become product debt. The default should be fail-closed for consequential ambiguity and refusal before mutation when receipt capability is unavailable.

## Module And Seam Map

Use these as product architecture seams. A seam is real only when behavior can change behind the interface without rewriting callers.

| Module | Interface | First adapter or implementation | Depth test |
|---|---|---|---|
| Protocol kernel | Durable protocol commands for compilation, contract, policy, gate, receipt, proof gap, isolation, and reconciliation | In-process kernel and Hono/D1 HTTP surface | Callers get enforcement state transitions without knowing storage internals |
| Runtime adapter | Classify protected tool attempts, record compilation evidence, and return structured refusal or contract reference | Package-install and repo-write wrappers | Generated orchestration cannot reach policy or gateway-check authority through this seam |
| CLI/MCP surface | CLI setup/inspection/conformance plus MCP protected proposal tools exposed to agents instead of raw gateway tools | `handshake mcp start`, generic contract/receipt tools, and `handshake.repo.propose_write_to_pr` as first action shortcut | Callers get one reusable Handshake surface while gateway credentials and gate mechanics stay behind adapters |
| Gateway adapter | Verify exact greenlight, consume once, mutate only through verified gate artifact, reconcile downstream finality | GitHub App-backed `repo_write_gateway` plus current package-install and repo-write reference gateways | Gateway owners integrate one gate interface instead of duplicating policy logic |
| Receipt renderer | Render contract and receipt evidence without inventing state | Contract Viewer and Receipt Timeline | Product UI reads protocol objects rather than maintaining parallel truth |
| Policy pack | Versioned policy input for exact contracts | One action-family policy file | Policy can change for future decisions without retroactively authorizing old greenlights |

Do not create product features that bypass these seams. If a surface cannot name its protocol module, interface, adapter, and gateway dependency, it is product theatre.

## Developer Activation Contract

The first developer experience must be a protected-action proof, not a dashboard tour.

Target activation:

```text
T+0:00  install Handshake CLI/MCP plus one gateway adapter, or run a clearly labeled local reference demo
T+1:00  agent proposes one guarded action through the protected capability
T+2:00  exact contract and policy decision appear
T+3:00  gateway check passes or refuses before mutation
T+4:00  receipt timeline reconstructs the chain
T+5:00  replay or parameter mismatch refuses before mutation
```

The exact CLI or MCP tool name can change, but the output contract cannot. The first installed run must print or render:

- action contract ID and canonical digest;
- policy decision and greenlight/refusal;
- gateway check attempt outcome;
- mutation attempt, gateway refusal, or proof gap;
- receipt timeline URL or local render path;
- one recovery hint for refusal.

If the first developer journey cannot reach a gateway-checked receipt in one terminal session, the product is too abstract.

## Runtime Obligations

An issuer runtime must:

- publish a capability catalog;
- classify tools and generated execution paths;
- pin action and gateway catalog versions before contract issuance;
- record generated code/spec references without raw secrets;
- produce deterministic parameter digests;
- refuse ambiguous or unwrapped consequential paths;
- represent loops, retries, branches, MCP writes, browser actions, package installs, repo writes, cloud mutations, database actions, and scheduled jobs as contract candidates or bounded batch contracts;
- return structured recovery information to the agent.

## Gateway Obligations

A gateway must:

- publish accepted contract shape and gateway policy version;
- expose a gate endpoint;
- define resource namespace and parameter canonicalization;
- define drift behavior;
- check current isolation;
- consume one-use greenlights atomically;
- maintain idempotency and replay rules;
- record receipt/proof-gap evidence;
- refuse before mutation when any gate check fails.

## First Applications

These are ordered by protocol risk, not by sales headline.

The business wedge can be "preview deploys without deployment authority" because buyers understand it quickly. The technical proof may use protected repo write or package install first because the current code already proves gateway-checked mutation, replay refusal, parameter mismatch refusal, proof gaps, and receipt reconstruction.

Do not demo preview deploy as controlled until a preview-deploy gateway adapter consumes exact greenlights before deployment. Until then, preview deploy is a sales narrative and target integration, not a proven gateway.

### Application 1: CLI/MCP Protected Action Surface

Why first: it is the reusable product surface. The CLI handles setup, inspection, and conformance; the MCP server exposes protected proposal tools; gateway adapters own mutation credentials and enforce exact greenlights before consequence.

First action-family shortcut:

```text
handshake.repo.propose_write_to_pr
```

First adapter-backed gateway path:

```text
Handshake CLI/MCP
  -> Handshake control plane
  -> GitHub App-backed repo_write_gateway
  -> generated branch
  -> exact commit
  -> pull request
```

Proof required:

- CLI/MCP can propose protected action candidates without gateway mutation credentials;
- raw GitHub write credentials are absent from the guarded agent path or the UI shows `rawBypassPossible`;
- MCP tools propose only, and cannot issue greenlights or call the gateway check;
- exact action contract binds repo, base ref, generated branch namespace, path, expected old blob, content digest, byte length, gateway policy, and idempotency;
- policy greenlights or refuses;
- GitHub App-backed gateway refuses missing/replayed/mismatched/isolated/drifted greenlights before using its installation token;
- receipt timeline separates gateway check, branch/ref operation, commit, pull request, branch-protection state, and proof gaps.

### Application 2: Hermes / Codemode Portability

Why second: it stresses generated programs over tools.

Proof required:

- generated execution block bounds are recorded;
- loops cannot reuse a greenlight;
- retries reconcile only the same mutation attempt and idempotency key;
- branches emit separate candidates;
- raw terminal/network/filesystem/browser bypass is refused at gateway when possible and recorded as bypass evidence when observable.

### Application 3: Preview Deploy

Why third: it is the first buyer-legible engineering action.

Proof required:

- preview deploy greenlight cannot become production deploy;
- branch/resource mismatch refuses;
- stale greenlight refuses;
- downstream pending becomes receipt plus proof gap or reconciliation, not success.

### Application 4: Protected Repo Write

Why next: it makes file/resource bounds visible.

Proof required:

- path namespace is canonicalized;
- generated code cannot broaden from allowed path to arbitrary repo write;
- receipt distinguishes proposed diff, gateway check, and actual write.

### Application 5: Package Install / CI Mutation

Why next: it tests supply-chain and workflow side effects.

Proof required:

- package/action side effects are explicit;
- install or CI mutation binds to exact resource and parameter digest;
- retries and lockfile drift produce refusal, review, or proof gap.

## Demo Paths

The product demo must include more than the happy path.

| Demo path | What it proves |
|---|---|
| Golden path | One exact action can be contracted, greenlit, gateway-checked, executed, and receipted. |
| Policy refusal | Refusal is understandable and recoverable before gateway mutation. |
| Gateway refusal | Missing, replayed, mismatched, isolated, or drifted greenlights refuse before mutation. |
| Bypass attempt | Direct gateway call without greenlight fails at the gateway. |
| Proof gap | Missing downstream evidence is represented honestly. |
| Isolation race | Isolation after greenlight but before gate blocks mutation. |
| Receipt reconstruction | The chain can be replayed from stream events and protocol objects. |

If a demo cannot show refusal before mutation, it is not a Handshake demo.

## Inspiration Patterns

Use these as product inspiration, not claims:

- Vercel preview deploys: the correct workflow feels instant and visual.
- Stripe API: docs, examples, errors, versioning, and SDKs are the product.
- Cloudflare Workers: powerful primitives exposed through simple install and deploy paths.
- Linear: state transitions are opinionated, fast, and legible.
- npm: install and first run should be obvious.
- GitHub branch checks: users understand blocked merge states because the gate is visible.
- Kubernetes admission control: internal model for pre-mutation enforcement.
- HFT pre-trade controls and drop copy: internal model for exposure, kill switch, and receipt evidence.

## Patterns To Keep

- One action family before platform breadth.
- Gateway gate before any management UI.
- Receipt timeline before audit explorer.
- Refusal messages as product UX.
- Proof gaps as visible states.
- SDK defaults that fail closed.
- Copy-pasteable walkthroughs.
- Design-partner pilots scoped to one runtime, one gateway, one action.

## Anti-Patterns To Cut

- Dashboard before activation.
- Runtime plugin described as enforcement.
- Human approval of a summary detached from contract digest.
- Reusable greenlights.
- Receipt that collapses gateway check and downstream success.
- Proof gap hidden inside prose.
- Browser or shell control claim without gateway enforcement.
- Agent identity marketed as mutation authority.
- Generic agent governance positioning.
- Agentic-economy language before the buyer has felt the first action family.
- Connector marketplace before gateway refusal is undeniable.

## Acceptance Criteria

The full agentic experience architecture is accepted when:

- it names the customer and moment of value;
- it maps the journey from principal intent to receipt, proof gap, isolation, and recovery;
- every product surface maps to protocol objects from `01`;
- every agent/runtime obligation maps to requirements from `02` or archived agent-requirements input when explicitly cited;
- the gateway check is the only enforcement boundary for gateway-owned consequence;
- generated code, loops, retries, branches, MCP writes, browser actions, scheduled jobs, package installs, repo writes, cloud mutations, and database operations are addressed;
- Contract Viewer and Receipt Timeline are defined as activation surfaces, not dashboard features;
- SDK/API surfaces have fail-closed defaults;
- CLI/MCP protected action surface is first, GitHub App-backed repo-write-to-PR is the first gateway adapter proof, Hermes/codemode portability is second, and preview deploy/package install/CI mutation are named expansion applications;
- demo paths include happy path, refusal, bypass, proof gap, isolation race, and reconstruction;
- patterns and anti-patterns are explicit enough to reject weak product ideas.

## Kill Criteria

Cut or redesign any surface if:

- it can be used without an exact `ActionContract`;
- it grants mutation authority outside a one-use gateway-bound greenlight;
- it relies on runtime hooks as the final enforcement boundary;
- it makes generated code look authorized without per-action contracts or bounded batch contracts;
- it cannot represent gateway refusal before mutation;
- it hides proof gaps;
- it cannot reconstruct the chain from durable objects and ordered stream events;
- it requires broad admin/fleet management before the first receipt;
- it sells governance, audit, or marketplace value before bounded execution value;
- it slows agents without allowing them to complete a larger bounded action.

## Experience Metrics

Measure:

- time to first gateway-checked receipt;
- number of steps to install one gateway check;
- refusal reason clarity;
- percentage of consequential attempts classified without ambiguity;
- percentage of refusals that lead to a narrowed next action;
- proof-gap rate by gateway/action family;
- gateway refusal before mutation coverage;
- second action family named by the buyer;
- design-partner willingness to pay for the pilot.

Do not over-optimize:

- dashboard usage;
- page views;
- number of integrations;
- volume of logs stored;
- broad policy count.

## Smallest Next Product Shipment

Ship one design-partner CLI/MCP activation slice:

```text
Handshake CLI
  -> handshake mcp start
  -> protected proposal tool
  -> one policy file
  -> first gateway adapter: GitHub App-backed repo_write_gateway
  -> Contract Viewer
  -> Receipt Timeline
  -> Install Health
  -> conformance checks
  -> five-minute pilot script
  -> buyer scorecard
```

The activation packet is complete only when a missing, replayed, mismatched, isolated, or gateway-policy-drifted greenlight refuses before mutation and the receipt timeline reconstructs the chain.
