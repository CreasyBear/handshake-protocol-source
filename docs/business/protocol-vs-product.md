# Protocol Vs Product

Status: Canonical business alpha  
Version: v0.2.0  
Audience: Founder, product, protocol implementers, GTM, runtime builders, receiver owners, design partners  
Implementation status: Product architecture; depends on the v0.2 protocol kernel and receiver-gated proof loop  
Canonical owner: Product owner  
Last reviewed: 2026-05-17

## Customer And Moment Of Value

Customer: platform/security teams, engineering leaders, and agent-runtime builders adopting coding agents near consequential engineering work.

Moment of value: they understand that Handshake Protocol is the enforcement language, Handshake Product is the installable adoption surface, and Handshake Cloud is the paid operational layer. Each layer exists because an agent action must be contracted, receiver-gated, and reconstructable before it can be trusted with consequence.

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

Handshake Developer Product
  -> adoption layer

Handshake Cloud
  -> operational and revenue layer
```

The protocol is the foundation. The developer product must never imply more correctness than the protocol and receiver gate provide. The hosted product must never turn receipt storage, dashboards, or audit exports into a substitute for receiver-side enforcement.

## Responsibility Decision Test

Use this test whenever a new idea appears.

| Question | If yes, owner |
|---|---|
| Does it define what must be true for exact action authority, receiver enforcement, replay protection, proof gaps, receipts, or isolation? | Protocol |
| Does it help a developer install, run, understand, debug, or expand one guarded action family? | Developer product |
| Does it help an organization operate, retain, search, export, govern, or expand many guarded action families after activation? | Cloud |
| Does it claim control without removing raw receiver credentials or requiring receiver-gate enforcement? | Reject or redesign |
| Does it create review, dashboard, or audit value before first receiver-gated receipt? | Defer |

The brutal rule:

```text
Protocol = correctness.
Product = adoption.
Cloud = operation.
Receiver gate = enforcement.
Everything else is support.
```

## Protocol / Product / Cloud Split

| Layer | Owns | User | Buyer | Success metric | Failure mode |
|---|---|---|---|---|---|
| Handshake Protocol | Action contracts, policy decisions, one-use greenlights, receiver gates, receipts, refusals, proof gaps, isolation state, canonical transitions | Runtime builders, receiver implementers, infrastructure engineers | Ecosystem adopters, platform architects, embedded vendors | Can this action chain be enforced and reconstructed? | Ambiguous semantics, reusable greenlights, unverifiable receiver checks, hidden proof gaps |
| Handshake Developer Product | SDKs, adapters, docs, local demo, protected MCP/CLI tools, Contract Viewer, Receipt Timeline, first action-family quickstarts | Developers, platform engineers, AI tooling leads | VP Eng, CTO, platform/dev productivity lead | Can a team get to first receiver-gated receipt quickly? | Slow onboarding, abstract messaging, no urgent wedge, review spam |
| Handshake Cloud | Hosted receipt store, policy decisions, org/project setup, retention, audit export, supported integrations, proof-gap workbench, enterprise controls | Platform/security teams, audit stakeholders, operators | CTO, VP Eng, CISO/security leader, enterprise buyer | Can a team operate and expand receiver-gated agent actions? | Dashboard theatre, audit-only product, governance sprawl, claims beyond enforcement |

## What The Protocol Owns

Protocol owns what must be true.

It defines:

- `PrincipalAuthority`;
- `AgentIdentity`;
- `OperatingEnvelope`;
- `ToolCapability`;
- `ActionType`;
- `ReceiverRegistryEntry`;
- `IntentCompilationRecord`;
- `ActionContract`;
- `PolicyDecision`;
- `Greenlight`;
- `ReceiverGateAttempt`;
- `MutationAttempt`;
- `ReceiverOperationReconciliation`;
- `Receipt`;
- `Refusal`;
- `ProofGap`;
- `IsolationState`;
- `ContractStreamEvent`;
- canonicalization;
- replay protection;
- one-use greenlight semantics;
- receiver-gate verification;
- proof-gap semantics;
- receipt reconstruction;
- invalid transitions.

Protocol answers:

```text
What exact action was proposed?
Who is acting?
Under whose operating envelope?
Which receiver owns the consequence?
Which exact contract did policy evaluate?
Was a one-use greenlight issued?
Did the receiver gate check and consume it?
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
- customer onboarding;
- sales narrative;
- generic enterprise governance;
- every possible policy language;
- every receiver integration;
- AI safety marketing;
- claims for receivers that do not enforce the gate.

## What The Product Owns

Product owns adoption and activation.

It defines:

- install path;
- local playground;
- copy-paste quickstart;
- SDK packaging;
- protected MCP/CLI tools;
- runtime wrappers;
- receiver adapters;
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
Can I see the receiver refuse before mutation?
Can my agent still move fast?
Can I understand a refusal?
Can I show a receipt to security?
Can I expand to a second action family?
```

Product does not own:

- new authority semantics;
- receiver enforcement claims not backed by protocol objects;
- fake universal runtime control;
- dashboard-first activation;
- human review detached from exact contract digest;
- audit exports that imply downstream proof when only proof gaps exist.

## Open Protocol, Paid Product

The protocol should be open enough to become the language.

Open/free:

- schemas;
- state machine;
- canonicalization;
- greenlight verification;
- receiver gate reference implementation;
- receipt/refusal/proof-gap formats;
- local examples;
- one simple receiver adapter;
- invariant tests.

Paid product:

- hosted receipt store and timeline;
- hosted policy decisions;
- org/project setup;
- policy templates;
- retention and export;
- audit search;
- proof-gap workbench;
- supported receiver/runtime integrations;
- SSO/SAML;
- SIEM export;
- advanced isolation workflows;
- enterprise support and security review.

Do not put the protocol behind a paywall. Charge for operating it, expanding it, and making it enterprise-credible.

## Practical Integration Modes

Handshake is not an omniscient observer. It works through protected action paths and receiver-side refusal.

### Hook-Assisted Mode

Best for OpenClaw-style runtimes with reliable `before_tool_call` semantics.

```text
runtime hook observes tool + args
-> Handshake classifies and proposes contract
-> runtime blocks or routes through protected receiver path
-> receiver gate enforces before mutation
```

The hook improves UX and early refusal. It is not final enforcement.

### Protected Capability Mode

Best for Codex, Claude Code, MCP tools, and CLI-shaped agent workflows.

```text
agent receives protected MCP/CLI tool
agent does not receive raw receiver credentials
protected tool proposes contract
policy greenlights/refuses
receiver adapter owns mutation credential
receiver gate enforces before mutation
```

This is the practical default.

### Codemode Block Mode

Best for Hermes-style generated programs.

```text
generated execution block declares allowed tools/receivers/resources/retry limits
-> every consequential branch becomes a contract candidate
-> each mutation still needs one exact greenlight
-> receiver refuses raw or mismatched calls
```

Generated code may orchestrate. It may not authorize.

### Receiver-Only Enforcement Mode

Useful when runtime evidence is thin.

```text
receiver refuses anything without exact current greenlight
receipt records missing runtime context as proof gap when needed
```

This is not a full experience, but it preserves the invariant.

## Raw Credential Rule

If the agent can mutate the receiver directly, Handshake does not control that action.

Examples:

- agent has raw Vercel deployment token and can call `vercel deploy`;
- agent has GitHub token that can push/release outside protected adapter;
- agent can run package manager with write access outside the package-install receiver;
- agent can call cloud/database API directly with real credentials.

In those cases Handshake may observe or reconstruct only if evidence exists. It cannot claim receiver-gated control.

The product must make this explicit during setup:

```text
Remove raw mutation authority from the agent.
Expose protected Handshake capability.
Let the receiver adapter own mutation credentials.
Require receiver gate before mutation.
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

- receiver modeling is more complex.

Recommended sequence:

```text
preview deploy for aha
-> package install refusal for security value
-> CI/release mutation for enterprise urgency
```

## Adoption Ladder

| Stage | Product promise | Evidence required |
|---|---|---|
| Local proof | Developer understands the primitive. | Local demo reaches contract, receiver gate, refusal, receipt. |
| One real receiver | Platform engineer believes it can fit their environment. | Receiver adapter refuses missing/replayed/mismatched greenlights before mutation. |
| One team workflow | Team delegates more work to agents. | Agent uses protected action path in a recurring workflow. |
| Security buy-in | Security sees better evidence than chat logs. | Receipt timeline and proof gaps reconstruct the chain. |
| Expansion | Buyer treats this as infrastructure. | Second action family or second receiver is requested. |

## Layer-Specific Metrics

Protocol metrics:

- forbidden transitions rejected;
- replay rejection coverage;
- receiver gate refusal coverage;
- receipt/proof-gap completeness;
- stream reconstruction success.

Developer product metrics:

- time to first receiver-gated receipt;
- steps to wrap one receiver;
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
- whether it can affect receiver mutation;
- what receiver gate behavior it depends on;
- what it must not imply;
- its activation role.

Examples:

| Product surface | Protocol foundation | Must not imply |
|---|---|---|
| Contract Viewer | Reads `ActionContract`, `IntentCompilationRecord`, `PolicyDecision` | Human summary approval is authority. |
| Receipt Timeline | Reads `Receipt`, `ProofGap`, `ContractStreamEvent`, `ReceiverGateAttempt`, `MutationAttempt` | Receipt equals downstream success. |
| Runtime Wrapper | Writes `IntentCompilationRecord`, proposes `ActionContract` | Runtime hook is enforcement. |
| Receiver Adapter | Writes `ReceiverGateAttempt`, `MutationAttempt`, `Receipt`, `ProofGap` | Verify-only check can mutate. |
| Policy Editor | Writes versioned policy packs used by future `PolicyDecision`s | Policy edits retroactively authorize old greenlights. |
| Receiver Registry Console | Writes `ReceiverRegistryEntry` | Receiver is enforced before a real gate exists. |
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
Handshake binds the exact proposed agent action to a one-use receiver-gated mutation attempt and records the evidence.
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
- policy editor before first receiver-gated receipt;
- connector marketplace before receiver refusal is undeniable;
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

Agents can propose consequential actions, but every mutation is turned into an exact action contract, evaluated by policy, checked by the receiver before execution, and recorded as a receipt, refusal, or proof gap.

So the agent can move fast, but it never gets ambient authority.
```

Show the demo. Do not start with the protocol unless the buyer asks how it works.

## Active Next Product Shipment

Create one proof packet:

```text
Title:
Let coding agents deploy previews without deployment authority.

Demo:
1. Agent receives vague task.
2. Agent proposes preview deploy.
3. Handshake creates exact action contract.
4. Policy greenlights preview only.
5. Receiver gate checks exact greenlight.
6. Deploy happens or refuses.
7. Receipt timeline reconstructs everything.

Second demo:
Agent tries unsafe package install.
Handshake refuses before repo mutation.
```

If the preview-deploy receiver is not implemented yet, label the preview flow as the buyer narrative and run the enforcement proof with the implemented package-install or repo-write receiver. Do not imply preview-deploy control until a preview receiver consumes exact greenlights before deployment.

Then ask 10 platform/security/AI enablement buyers:

```text
Would you install this for one coding-agent workflow?
Which workflow?
What receiver would you need first?
Who would approve this internally?
What would make you pay for hosted receipts, audit export, and supported adapters?
```

The canonical product only expands after buyers name the second receiver-gated action family.
