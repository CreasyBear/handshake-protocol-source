# Protocol Vs Product

Status: Canonical business alpha
Version: v0.2.1
Audience: Founder, product, protocol implementers, GTM, runtime builders, gateway owners, design partners
Implementation status: Product architecture; depends on the v0.2 protocol kernel and gateway-checked proof loop
Canonical owner: Product owner
Last reviewed: 2026-05-18

## Customer And Moment Of Value

Customer: platform/security teams, engineering leaders, and agent-runtime builders adopting coding agents near consequential engineering work.

Moment of value: they understand that Handshake Protocol is the enforcement language, Handshake Product is the installable adoption surface, and Handshake Cloud is the paid operational layer. Each layer exists because an agent action must be contracted, gateway-checked, and reconstructable before it can be trusted with consequence.

## Brutal Answer

Most buyers do not wake up wanting the Handshake protocol.

They wake up wanting this:

```text
Let coding agents perform consequential engineering work without giving them ambient authority.
```

The protocol is how that claim becomes true. The product is how a team installs it, sees it work, trusts it, expands it, and pays for it.

## Layer Model

Handshake must be built as three layers:

```text
Handshake Protocol
  -> correctness layer

Handshake Protected Actions
  -> activation layer

Handshake Cloud
  -> operational and revenue layer
```

The protocol is the foundation. Handshake Protected Actions is the installable adoption and activation product. The hosted product must never turn receipt storage, dashboards, or audit exports into a substitute for gateway-side enforcement.

## Responsibility Decision Test

Use this test whenever a new idea appears.

| Question | If yes, owner |
|---|---|
| Does it define what must be true for exact action authority, gateway enforcement, replay protection, proof gaps, receipts, or isolation? | Protocol |
| Does it help a developer install, run, understand, debug, or expand one guarded action family? | Developer product |
| Does it help an organization operate, retain, search, export, govern, or expand many guarded action families after activation? | Cloud |
| Does it claim control without removing raw gateway credentials or requiring gateway-check enforcement? | Reject or redesign |
| Does it create review, dashboard, or audit value before first gateway-checked receipt? | Defer |

The brutal rule:

```text
Protocol = correctness.
Protected Actions product = activation.
Cloud = operation.
Gateway gate = enforcement.
Everything else is support.
```

## Protocol / Product / Cloud Split

| Layer | Owns | User | Buyer | Success metric | Failure mode |
|---|---|---|---|---|---|
| Handshake Protocol | Action contracts, policy decisions, one-use greenlights, gateway checks, receipts, refusals, proof gaps, isolation state, canonical transitions | Runtime builders, gateway implementers, infrastructure engineers | Ecosystem adopters, platform architects, embedded vendors | Can this action chain be enforced and reconstructed? | Ambiguous semantics, reusable greenlights, unverifiable gateway checks, hidden proof gaps |
| Handshake Protected Actions | SDKs, adapters, docs, local demo, protected MCP/CLI tools, Contract Viewer, Receipt Timeline, first action-family quickstarts | Developers, platform engineers, AI tooling leads | VP Eng, CTO, platform/dev productivity lead | Can a team get to first gateway-checked receipt quickly? | Slow onboarding, abstract messaging, no urgent wedge, review spam |
| Handshake Cloud | Hosted receipt store, policy decisions, org/project setup, retention, audit export, supported integrations, proof-gap workbench, enterprise controls | Platform/security teams, audit stakeholders, operators | CTO, VP Eng, CISO/security leader, enterprise buyer | Can a team operate and expand gateway-checked agent actions? | Dashboard theatre, audit-only product, governance sprawl, claims beyond enforcement |

## What The Protocol Owns

Protocol owns what must be true.

It defines:

- `PrincipalAuthority`;
- `AgentIdentity`;
- `OperatingEnvelope`;
- `ToolCapability`;
- `ActionType`;
- `GatewayRegistryEntry`;
- `IntentCompilationRecord`;
- `ActionContract`;
- `PolicyDecision`;
- `Greenlight`;
- `GatewayCheckAttempt`;
- `MutationAttempt`;
- `SurfaceOperationReconciliation`;
- `Receipt`;
- `Refusal`;
- `ProofGap`;
- `IsolationState`;
- `ContractStreamEvent`;
- canonicalization;
- replay protection;
- one-use greenlight semantics;
- gateway-check verification;
- proof-gap semantics;
- receipt reconstruction;
- invalid transitions.

Protocol answers:

```text
What exact action was proposed?
Who is acting?
Under whose operating envelope?
Which gateway owns the consequence?
Which exact contract did policy evaluate?
Was a one-use greenlight issued?
Did the gateway check check and consume it?
Was mutation attempted?
What evidence exists?
What evidence is missing?
Is future consequence isolated?
Can the chain be reconstructed?
```

Protocol does not own:

- dashboard layout;
- pricing;
- hosted billing;
- wallets, balances, budgets, settlement, accounting, credit, fraud, or personalized financial preference management;
- customer onboarding;
- sales narrative;
- generic enterprise governance;
- every possible policy language;
- every gateway integration;
- AI safety marketing;
- claims for gateways that do not enforce the gate.

## What The Product Owns

Product owns adoption and activation.

It defines:

- install path;
- local playground;
- copy-paste quickstart;
- SDK packaging;
- protected MCP/CLI tools;
- runtime wrappers;
- gateway adapters;
- policy templates;
- Contract Viewer;
- Receipt Timeline;
- structured refusal UX;
- proof-gap UX;
- design-partner onboarding;
- first action-family demos;
- security review packet;
- expansion playbook.

Product answers:

```text
How do I install this?
Where do I put it?
What action does it protect first?
Can I see the gateway refuse before mutation?
Can my agent still move fast?
Can I understand a refusal?
Can I show a receipt to security?
Can I expand to a second action family?
```

Product does not own:

- new authority semantics;
- gateway enforcement claims not backed by protocol objects;
- financial management, wallet custody, balances, personalized spend preferences, settlement, accounting, credit, or fraud controls;
- fake universal runtime control;
- dashboard-first activation;
- human review detached from exact contract digest;
- audit exports that imply downstream proof when only proof gaps exist.

## Payment-Rail And Paid-Call Boundary

Payment rails are adjacent adapter terrain, not Handshake's category.

Handshake can treat a paid API call, x402/MPP request, AgentCash fetch, AP2-like mandate, or agent-to-service purchase as a protected action candidate when it creates consequence. The contract may bind provider origin, endpoint, method, schema/source digest, request digest, and payment challenge or terms digest when available. The receipt may record payment proof as evidence.

Handshake does not own the wallet, customer balance, funding flow, spend budget, personalized vendor preference, accounting record, settlement rail, credit decision, fraud model, or financial approval policy. Amounts are not a Handshake-controlled financial policy surface; they are evidence or challenge context only when required to reconstruct the exact paid call.

If the provider or payment rail does not implement a Handshake gateway check, the honest claim is adapter-side protected call control plus evidence capture. It is not provider-side gateway enforcement.

## Open Protocol, Paid Product

The protocol should be open enough to become the language.

Open/free:

- schemas;
- state machine;
- canonicalization;
- greenlight verification;
- gateway check reference implementation;
- receipt/refusal/proof-gap formats;
- local examples;
- one simple gateway adapter;
- invariant tests.

Paid product:

- hosted receipt store and timeline;
- hosted policy decisions;
- org/project setup;
- policy templates;
- retention and export;
- audit search;
- proof-gap workbench;
- supported gateway/runtime integrations;
- SSO/SAML;
- SIEM export;
- advanced isolation workflows;
- enterprise support and security review.

Do not put the protocol behind a paywall. Charge for operating it, expanding it, and making it enterprise-credible.

## Practical Integration Modes

Handshake is not an omniscient observer. It works through protected action paths and gateway-side refusal.

### Hook-Assisted Mode

Best for OpenClaw-style runtimes with reliable `before_tool_call` semantics.

```text
runtime hook observes tool + args
-> Handshake classifies and proposes contract
-> runtime blocks or routes through protected gateway path
-> gateway check enforces before mutation
```

The hook improves UX and early refusal. It is not final enforcement.

### Protected Capability Mode

Best for Codex, Claude Code, MCP tools, and CLI-shaped agent workflows.

```text
agent receives protected MCP/CLI tool
agent does not receive raw gateway credentials
protected tool proposes contract
policy greenlights/refuses
gateway adapter owns mutation credential
gateway check enforces before mutation
```

This is the practical default.

### Codemode Block Mode

Best for Hermes-style generated programs.

```text
generated execution block declares allowed tools/gateways/resources/retry limits
-> every consequential branch becomes a contract candidate
-> each mutation still needs one exact greenlight
-> gateway refuses raw or mismatched calls
```

Generated code may orchestrate. It may not authorize.

### Gateway-Only Enforcement Mode

Useful when runtime evidence is thin.

```text
gateway refuses anything without exact current greenlight
receipt records missing runtime context as proof gap when needed
```

This is not a full experience, but it preserves the invariant.

### Payment-Rail Adapter Mode

Future adjacent mode for AgentCash/x402/MPP/AP2/ACP-style systems.

```text
agent attempts paid service call
-> protected adapter proposes exact paid-call contract
-> policy evaluates provider, endpoint, schema/request digest, and available payment challenge context
-> adapter executes only after one-use greenlight
-> receipt records response evidence, payment proof, and any proof gap
```

This mode protects the call path. It does not make Handshake a wallet, payment processor, marketplace, budget engine, or finance system.

## Raw Credential Rule

If the agent can mutate the gateway directly, Handshake does not control that action.

Examples:

- agent has raw Vercel deployment token and can call `vercel deploy`;
- agent has GitHub token that can push/release outside protected adapter;
- agent can run package manager with write access outside the package-install gateway;
- agent can call cloud/database API directly with real credentials.

In those cases Handshake may observe or reconstruct only if evidence exists. It cannot claim gateway-checked control.

The product must make this explicit during setup:

```text
Remove raw mutation authority from the agent.
Expose protected Handshake capability.
Let the gateway adapter own mutation credentials.
Require gateway check before mutation.
```

## First Sellable Wedges

Do not sell all agent actions first.

### Wedge 1: Preview Deploys

Pitch:

```text
Let coding agents deploy previews without deployment authority.
```

Why:

- visible;
- bounded;
- familiar;
- good Vercel-level demo.

Risk:

- may not be scary enough for budget.

### Wedge 2: Package Install Refusal

Pitch:

```text
Stop coding agents from installing risky or policy-violating packages before they mutate your repo.
```

Why:

- concrete;
- consequential;
- refusal is the value moment;
- supply-chain risk is easy to understand.

Risk:

- requires meaningful policy or it becomes superficial.

### Wedge 3: CI / Release Changes

Pitch:

```text
Stop agents from silently changing CI, release workflows, or deployment gates.
```

Why:

- high leverage;
- security/platform buyer cares;
- enterprise urgency is clearer.

Risk:

- gateway modeling is more complex.

Recommended sequence:

```text
preview deploy for aha
-> package install refusal for security value
-> CI/release mutation for enterprise urgency
```

## Adoption Ladder

| Stage | Product promise | Evidence required |
|---|---|---|
| Local proof | Developer understands the primitive. | Local demo reaches contract, gateway check, refusal, receipt. |
| One real gateway | Platform engineer believes it can fit their environment. | Gateway adapter refuses missing/replayed/mismatched greenlights before mutation. |
| One team workflow | Team delegates more work to agents. | Agent uses protected action path in a recurring workflow. |
| Security buy-in | Security sees better evidence than chat logs. | Receipt timeline and proof gaps reconstruct the chain. |
| Expansion | Buyer treats this as infrastructure. | Second action family or second gateway is requested. |

## Layer-Specific Metrics

Protocol metrics:

- forbidden transitions rejected;
- replay rejection coverage;
- gateway check refusal coverage;
- receipt/proof-gap completeness;
- stream reconstruction success.

Developer product metrics:

- time to first gateway-checked receipt;
- steps to wrap one gateway;
- percentage of refusals with clear recovery;
- first demo comprehension;
- second action family named by design partner.

Cloud metrics:

- receipt retention usage;
- proof-gap workbench resolution;
- policy template adoption;
- audit export requests;
- expansion from one action family to two.

Do not optimize first for dashboard visits, log volume, broad connector count, or generic policy count.

## Foundation Rule For Product Surfaces

Every product surface must declare:

- which protocol objects it reads;
- which protocol objects it writes;
- whether it can affect gateway mutation;
- what gateway check behavior it depends on;
- what it must not imply;
- its activation role.

Examples:

| Product surface | Protocol foundation | Must not imply |
|---|---|---|
| Contract Viewer | Reads `ActionContract`, `IntentCompilationRecord`, `PolicyDecision` | Human summary approval is authority. |
| Receipt Timeline | Reads `Receipt`, `ProofGap`, `ContractStreamEvent`, `GatewayCheckAttempt`, `MutationAttempt` | Receipt equals downstream success. |
| Runtime Wrapper | Writes `IntentCompilationRecord`, proposes `ActionContract` | Runtime hook is enforcement. |
| Gateway Adapter | Writes `GatewayCheckAttempt`, `MutationAttempt`, `Receipt`, `ProofGap` | Verify-only check can mutate. |
| Policy Editor | Writes versioned policy packs used by future `PolicyDecision`s | Policy edits retroactively authorize old greenlights. |
| Gateway Registry Console | Writes `GatewayRegistryEntry` | Gateway is enforced before a real gate exists. |
| Audit Export | Exports evidence objects | Audit export replaces pre-mutation enforcement. |

If a surface cannot name its protocol foundation, it does not belong in the canonical product.

## Competitive Category Boundaries

Handshake is not:

- identity/auth;
- generic policy engine;
- audit logs;
- AI prompt guardrails;
- human approval workflow;
- observability;
- SIEM;
- API gateway alone.

Handshake's distinction:

```text
Policy says whether an action should be allowed.
Auth says who or what something is.
Audit logs say what happened.
Handshake binds the exact proposed agent action to a one-use gateway-checked mutation attempt and records the evidence.
```

## Anti-Patterns

Cut:

- selling protocol before pain;
- hiding the protocol behind a paywall;
- claiming universal runtime enforcement;
- runtime-plugin-only enforcement;
- dashboard-first product;
- audit-only product;
- broad governance pitch;
- reusable greenlights;
- receipts that hide proof gaps;
- policy editor before first gateway-checked receipt;
- connector marketplace before gateway refusal is undeniable;
- any setup where the agent keeps raw mutation credentials and Handshake claims control.

## First Sales Narrative

Use this narrative:

```text
Coding agents are crossing the line from suggesting code to performing engineering work.

That means they need access to tools: repos, deploys, CI, package managers, databases, cloud APIs.

Most teams have two bad options:
1. give agents broad tool access and hope logs are enough;
2. block agents from useful work.

Handshake gives a third path.

Agents can propose consequential actions, but every mutation is turned into an exact action contract, evaluated by policy, checked by the gateway before execution, and recorded as a receipt, refusal, or proof gap.

So the agent can move fast, but it never gets ambient authority.
```

Show the demo. Do not start with the protocol unless the buyer asks how it works.

## Active Shipment Pointer

Active shipment scope is owned by
[`canonical-product.md`](./canonical-product.md). This document owns the
Protocol / Protected Actions / Cloud split, not the current adapter proof.

When the canonical product doc names a first protected action path, this document
should explain which layer owns each part of the path:

```text
Protocol = exact contracts, policy decisions, one-use greenlights, gateway checks,
receipts, refusals, proof gaps, and isolation.

Protected Actions product = install, protected tools, contract/receipt surfaces,
gateway adapter posture, and first receipt activation.

Cloud = hosted operation, retention, search, alerts, audit export, and supported
integrations after activation.
```

Then ask 10 platform/security/AI enablement buyers:

```text
Would you install this for one coding-agent workflow?
Which workflow?
What gateway would you need first?
Who would approve this internally?
What would make you pay for hosted receipts, audit export, and supported adapters?
```

The canonical product only expands after buyers name the second gateway-checked action family.
