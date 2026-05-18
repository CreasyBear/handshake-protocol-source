# Tier Doctrine Decision Memo

Status: Strategy decision
Version: v0.2.1
Audience: Founder, product, engineering, GTM, design partners, platform/security buyers
Implementation status: Doctrine only; not an implementation PRD
Canonical owner: Product owner
Last reviewed: 2026-05-18

## Customer And Moment Of Value

Customer: teams letting autonomous decision-making systems act against consequential protected surfaces across engineering, support, billing, commerce, operations, cloud, data, and other machine-initiated workflows.

Moment of value: a generated agent run reaches a consequential action, Handshake turns the action into an exact contract, policy greenlights or refuses it, a gateway check enforces before protected-surface mutation, and the team can reconstruct the chain from receipt, refusal, or proof gap evidence.

## Decision

Handshake's product center is:

```text
Protected Actions for autonomous decision-making.
```

The internal architecture phrase is:

```text
protected action path
```

It is not repo-write, GitHub automation, MCP middleware, a dashboard, or generic agent governance.

Repo-write remains a later adapter or proof fixture. It must not become the product truth. Autonomous systems typically act through codemode, MCP tools, CLI tools, browser tools, shell commands, service APIs, scheduled jobs, workflow engines, and runtime adapters. The product center is the protected action path where autonomous decision-making attempts consequence and must become an exact gateway-bound action contract with a passed gateway check before mutation authority exists.

The first wedge remains preview deploy:

```text
Let autonomous systems create preview deploys without deployment authority.
```

Preview deploy is the clearest first story because it is familiar, visible, consequential-but-bounded, and easy to explain. The first strategic boundary is the MCP/tool dispatcher path. The first proof should be a provider-shaped local preview gateway unless and until a production provider gateway owns the provider mutation credential. The memo must stay honest about what is enforced.

This wedge is not the category. Engineering gives Handshake a concrete first proof, but the tier doctrine must generalize to any consequential autonomous decision that can be reduced to an exact gateway-bound action contract and gateway check.

## Tier Doctrine

### Tier 1: Open Protocol Foundation

Tier 1 is open protocol infrastructure.

Open:

- action contract schema;
- policy decision and refusal semantics;
- one-use greenlight semantics;
- gateway check shape;
- receipt, refusal, and proof-gap formats;
- isolation state model;
- canonicalization and state-machine docs;
- reference implementation;
- conformance fixtures.

Purpose:

```text
Make the primitive inspectable, implementable, and hard to fake.
```

Tier 1 should be open enough that serious teams, runtime builders, and gateway owners can verify the invariant without buying Handshake Cloud.

Tier 1 is not yet a standard. It is a reference protocol draft plus conformance path. Standard language comes only after independent runtime and gateway integrations exist.

### Tier 2: Generous Self-Hosted Protected Action Loop

Tier 2 is the self-hostable adoption layer.

Self-hostable:

- TypeScript SDK;
- CLI setup and inspection;
- MCP/tool proposal surface;
- runtime wrapper patterns;
- local policy evaluator;
- local receipt store;
- local Contract Viewer or readable contract output;
- local Receipt Timeline;
- local Install Health truth states;
- local provider-shaped gateway proof;
- docs, quickstarts, recipes, and conformance checks.

Purpose:

```text
Get a team to first gateway-checked receipt without a sales call.
```

Tier 2 should be generous. Do not paywall the protocol loop. Do not withhold the first protected action path. Do not make customers buy hosted software just to understand whether Handshake is real.

Tier 2 is where trust is earned:

```text
agent proposes
-> exact action contract
-> policy decision
-> one-use gateway-bound greenlight or refusal
-> gateway check before mutation
-> receipt, refusal, or proof gap
```

If Tier 2 cannot make this loop obvious, Handshake does not have activation.

### Tier 3: Hosted Handshake Cloud

Tier 3 is the paid operated layer.

Monetized:

- hosted durable receipt store;
- hosted receipt timeline and audit explorer;
- orgs, projects, roles, and access control;
- policy management and policy versioning;
- retention controls;
- search across principals, agents, runs, contracts, gateways, refusals, and proof gaps;
- hosted Install Health across projects and gateways;
- alerts for evidenced raw bypass, gateway drift, proof gaps, replay attempts, and isolation events;
- managed gateway registry;
- audit exports;
- supported adapters;
- enterprise support and security review material.

Purpose:

```text
Operate protected actions across a team or organization.
```

The business charges for operated evidence, shared governance, retention, search, alerts, audit reconstruction, supported integrations, and enterprise reliability.

The business does not charge for the existence of the primitive.

Hosted policy decisions and greenlight issuance are not stronger authority than self-hosted decisions. Cloud operates the control plane. Enforcement still depends on the gateway checking the exact one-use greenlight before mutation.

### Tier 4: Future Ecosystem Layer

Tier 4 is future ecosystem infrastructure. It is not a current product promise.

Possible later:

- runtime conformance marks;
- gateway conformance marks;
- third-party adapter certification;
- cross-org receipt verification;
- gateway marketplace after strong first-party gateways;
- embedded runtime partnerships;
- AgentCash, x402, AP2, ACP, and other payment-rail adapters as adjacent protected action families.

Purpose:

```text
Make gateway-checked action control a network property after the first wedge works.
```

Do not sell Tier 4 before Tier 2 activation and Tier 3 operated value are real. Network language before installed gateway-checked receipts is platform cosplay.

## Monetization Boundary

Open and self-hostable:

- protocol schemas;
- canonicalization;
- conformance fixtures;
- local SDK;
- local policy loop;
- local receipt loop;
- local provider-shaped gateway proof;
- docs;
- first protected action quickstart.

Paid and hosted:

- operated policy decisions;
- hosted equivalents of self-hostable greenlight issuance;
- durable receipt retention;
- org governance;
- audit search;
- proof-gap workbench;
- install-health monitoring across projects;
- alerts;
- managed gateway registry;
- supported adapters;
- exports and enterprise review material.

The product should make self-hosting possible and the hosted path easier. The paid option wins by convenience, reliability, operation, collaboration, retention, and audit readiness, not by withholding the core loop.

## Developer Activation Contract

Tier 2 needs one golden path. The surfaces can expand later, but the first self-hosted loop must be understandable as one run:

```text
handshake init
-> wrap one MCP/tool dispatcher action
-> propose preview_deploy.create contract
-> canonicalize exact contract
-> local policy greenlight or refusal
-> local provider-shaped gateway consumes one-use greenlight
-> gateway performs local preview surface operation or refuses before mutation
-> receipt records proposal, decision, gateway check, surface operation reconciliation, and proof gap if any
-> Receipt Timeline reconstructs the chain
```

This is an activation contract, not an implementation PRD. It defines the product proof Tier 2 must eventually make obvious.

## Tier Enforcement Claims

| Tier / state | Action path / protected surface | Who holds mutation credential | Where gateway check runs | What can be blocked before consequence | What cannot be observed or enforced | Evidence produced | Honest product state |
|---|---|---|---|---|---|---|---|
| Tier 1: protocol reference | Protocol APIs, schemas, conformance fixtures | Nobody by default | Reference gateway only | Invalid transitions, replay semantics, contract mismatch in reference paths | Real protected-surface mutation; raw credentials; provider-side behavior | Conformance result, reference receipt/proof gap | Protocol proof |
| Tier 2: local fixture proof | Local SDK/CLI/MCP path and fixture protected surface | Fixture or local harness | Local reference gateway | Missing, replayed, mismatched, or refused greenlights in fixture path | Production protected-surface mutation; provider-side enforcement | Local receipt, refusal, proof gap | Local proof |
| Tier 2: self-hosted gateway-checked path | MCP/tool wrapper plus installed gateway | Customer-owned gateway adapter | Customer self-hosted gateway | Exact protected action before the customer-owned gateway mutates the protected surface | Unwrapped sibling tools; raw credentials outside the gateway; unknown browser/shell paths | Receipt timeline, gateway check attempt, mutation/refusal/proof gap | Gateway-checked for that protected path |
| Tier 3: hosted Handshake operation | Hosted policy, greenlight issuance, receipt store, search, alerts, registry | Gateway still holds mutation credential | Gateway; Cloud may operate control-plane services | Policy refusal, replay refusal when gateway checks hosted greenlight, visibility into evidenced drift/gaps | Mutation paths that bypass installed gateways; unevidenced raw bypass; downstream success beyond evidence | Hosted receipts, alerts, audit exports, proof-gap workbench | Hosted operation, not enforcement by itself |
| Tier 4: provider-integrated gateway | Provider or certified third-party gateway integration | Provider or certified gateway owner | Provider-side or certified gateway | Provider protected-surface mutation when gateway checks exact greenlight before mutation | Providers without integration; payment/settlement/business success outside evidence | Provider-side receipt evidence or proof gap | Provider-side gateway enforcement |

If a product surface cannot identify its row in this table, it is not ready for canonical product claims.

## Ecosystem Map

```text
Runtimes and agents
  Codex, Claude Code, OpenClaw, Hermes, LangChain, MCP clients, browser/tool systems
        |
        v
Protected action path
  MCP/tool dispatcher, CLI proposal tools, runtime wrappers, codemode extraction
        |
        v
Protocol foundation
  IntentCompilationRecord, ActionContract, PolicyDecision, Greenlight,
  GatewayCheckAttempt, Receipt, Refusal, ProofGap, IsolationState
        |
        v
Gateways
  deploy, package, CI, release, cloud, database, repo, support, billing, paid-call adapters
        |
        v
Evidence surfaces
  Contract Viewer, Receipt Timeline, Install Health, audit export
        |
        v
Hosted operation
  orgs, policy versions, retention, search, alerts, managed registry, enterprise support
        |
        v
Future ecosystem
  conformance marks, adapter certification, runtime partnerships, gateway network
```

Authority flows down to the gateway check before mutation. Evidence flows back up through receipts, refusals, proof gaps, surface operation reconciliation, and audit reconstruction.

## Non-Claims

Handshake must not claim:

- runtime wrapper installation alone controls gateway-owned consequence;
- MCP auth is mutation authority;
- a dashboard is the product;
- an audit log after mutation is enough;
- a rendered plan is permission;
- a human approval of a summary is an exact greenlight;
- a local proof is third-party provider enforcement;
- a fixture runner proves production gateway enforcement;
- Handshake controls a protected surface while the agent still has raw mutation credentials for that surface;
- Handshake observes every terminal, browser, network, shell, package script, MCP server, or generated-code path;
- Handshake is payment infrastructure, wallet infrastructure, settlement, accounting, credit, fraud, or marketplace infrastructure.

If a gateway does not enforce the exact one-use greenlight before mutation, the honest product state is:

```text
advisory, not Handshake enforcement.
```

If a local preview proof creates a local artifact after a gateway check, the honest claim is:

```text
local gateway-checked preview proof.
```

It is not Vercel, Cloudflare, or other provider-side enforcement until a production provider gateway owns the provider mutation credential and checks the exact greenlight before mutation.

## Decision Log

| Decision | Rationale |
|---|---|
| Product center is Protected Actions for autonomous decision-making | Agents and autonomous systems act through generated orchestration; Handshake must own the consequence boundary, not a single adapter. |
| Repo-write is not the product wedge | Repo-write is useful proof terrain, but over-anchors the product on GitHub automation. |
| Preview deploy is the first wedge, not the category | It is visible, familiar, bounded, and easy to explain. |
| MCP/tool dispatcher is the first strategic boundary | It is the most realistic first place to intercept structured agent action without pretending to parse arbitrary generated code. |
| First proof is provider-shaped local preview gateway | It proves the gateway-checked loop without claiming third-party provider enforcement before a production provider gateway exists. |
| Tier 2 is generous and self-hostable | Developer trust requires first receipt without sales or hosted dependency. |
| Tier 3 monetizes hosted operation | Teams pay for reliable operation, retention, search, governance, alerts, support, and audit reconstruction. |
| Tier 4 is future only | Ecosystem/network claims are not credible until activation and hosted operation work. |
| Payment rails are adjacent adapters | Paid calls can be protected action families, but Handshake is not a wallet, payment rail, budget engine, or marketplace. |

## Exploration Check

This doctrine carries forward the r1-r10 exploration conclusions:

- r1: agents are moving from text to consequence; start with one gateway-checked consequential action, not broad governance.
- r2: protocol is the foundation, gateway check is enforcement, Cloud before installed proof is audit software.
- r3: v0.1 had correct instincts around gateway setup, MCP, refusal, receipts, and install posture, but too many nouns became product centers.
- r4: runtime, protocol, gateway, MCP, Cloud, buyer, and auditor roles must stay separate.
- r5: self-hosted activation plus gateway enforcement should precede Cloud expansion.
- r6: buyers pay when protected actions unlock more consequential autonomous work inside bounded authority; engineering is the first proof, not the market limit.
- r7: the product must survive attacks that it is just auth, logging, MCP middleware, GitHub automation, or payment cosplay.
- r8: Handshake Protected Actions is the right product center; GitHub/repo-write is one adapter, not the product.
- r9: Cloudflare is the product discipline model: open primitive, clear boundaries, many surfaces, hosted operation, no vague trust claims.
- r10: AgentCash/x402/payment rails are future gateway/action adapters only when the enforcement boundary is honest.

## What This Memo Is Not

This memo is not:

- an implementation PRD;
- an adapter plan;
- a schema migration plan;
- a pricing page;
- a dashboard spec;
- a full rewrite of existing canonical docs.

It is a tier doctrine decision. Future implementation plans should reference it before changing product docs, SDK surfaces, adapter priorities, hosted Cloud scope, or public positioning.

Product-build principles live in [`../specs/00-product-requirements-spine.md`](../specs/00-product-requirements-spine.md). Do not duplicate those planning rules here. This memo defines tier doctrine and monetization boundaries; the requirements spine defines how plans prove they are ready to build.

## Smallest Next Doctrine Step

Write the canonical product docs and product surfaces so every Handshake tier answers:

```text
What is open?
What is self-hostable?
What is hosted and paid?
What enforcement boundary exists?
What evidence remains?
What must we not claim yet?
```

Do not build new implementation from this memo until the canonical product story is updated and reviewed against gateway-checked enforcement claims.
