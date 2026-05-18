# Go-To-Market And Validation

Status: Canonical business alpha  
Version: v0.2.0  
Audience: Founder, GTM, product, design partners  
Implementation status: Validation plan; not yet backed by paid pilot evidence  
Canonical owner: Product owner  
Last reviewed: 2026-05-17

## Customer And Moment Of Value

Customer: engineering leaders who already use coding agents but still block them at production-adjacent consequence.

Moment of value: the buyer sees a coding agent do useful work, request one guarded action, get receiver-gated, fail on bypass or replay, and leave a receipt that reconstructs what happened.

## Sales Frame

Lead with the blocked-action ceiling:

```text
What are your agents still not allowed to do?
```

Then sell the narrow unlock:

```text
Handshake lets you delegate one larger engineering-agent action by turning it into an exact contract that the receiver enforces before mutation.
```

Do not lead with governance, compliance, smart contracts, circuit breakers, safety, audit, or protocol language.

## First Design-Partner Profile

Recruit 10 conversations across these slots:

1. AI-forward 20-200 person engineering org using Claude Code, Codex, Cursor, OpenClaw, Hermes, or similar tools daily.
2. 100-500 person developer productivity or platform team running coding-agent pilots.
3. Owner of GitHub Actions, preview deploys, release automation, package publishing, or CI policy.
4. Security-minded CTO who wants agents to do more, not merely log more.
5. Staff engineer maintaining an internal agent runtime or MCP tool surface.
6. Runtime builder with plugin hooks, generated-code execution, or MCP dispatch.
7. MCP server builder exposing GitHub, CI, repo, deploy, CRM, or cloud mutation tools.
8. Agentic devtool vendor blocked by enterprise authority and audit questions.
9. Support or billing automation team with one bounded mutation class.
10. CX/support ops leader who can quantify escalation cost and wrong-action cost.

Engineering is the first build. Support/billing is the commercial challenger. Embedded vendors are the later distribution path.

## Paid Pilot Offer

Name:

```text
Handshake Agent Guardrails Pilot
```

Scope:

```text
2-3 weeks
one repo or workflow
one agent runtime surface
one guarded action class
one receiver gate
one receipt packet
```

Deliverables:

- one runtime adapter or fixture for a consequential tool path;
- one `ActionContract` shape for the guarded action;
- one deterministic policy decision path;
- one receiver endpoint that consumes one-use greenlights before mutation;
- one receipt/proof-gap timeline;
- one bypass, replay, mismatch, and isolation refusal demo;
- one written pilot report mapping activation, refusals, proof gaps, and next action family.

Non-deliverables:

- broad dashboard;
- connector marketplace;
- full enterprise admin;
- general browser automation control;
- payment, settlement, or marketplace rails;
- bespoke policy consulting across many systems.

## Pricing Hypothesis

Ask for money early.

```text
Design-partner pilot: $5k-$15k setup for one workflow
Small beta team: $500-$2k/month after activation
Enterprise pilot: $25k-$100k/year when multiple receiver gates, receipt retention, and audit export are required
Support/billing challenger: $10k-$30k pilot if ticket volume and wrong-action cost are quantified
Embedded vendor: SDK/OEM only after active enterprise deals are blocked by authority/audit evidence
```

A free pilot counts only if the buyer provides a real workflow, real receiver, technical owner, and budget-owner introduction.

## Demo Sequence

The best demo is not a dashboard.

Demo:

```text
1. Agent receives a task: fix bug and prepare preview release.
2. Low-risk reads, edits, and tests proceed without approval spam.
3. Agent reaches a guarded preview deploy or protected write.
4. Handshake emits an exact action contract.
5. Policy greenlights or refuses the exact contract.
6. Receiver consumes the one-use greenlight before mutation.
7. Agent attempts production deploy, replay, mismatch, or direct bypass.
8. Receiver refuses before mutation.
9. Receipt timeline reconstructs proposal, policy, gate check, mutation/refusal, proof gaps, and isolation.
```

If the demo does not show receiver refusal before mutation, it does not prove Handshake.

If preview deploy is used before a real preview-deploy receiver adapter exists, present it as the target buyer workflow and use the implemented package-install or repo-write receiver to prove enforcement mechanics. Do not blur narrative target with proven receiver control.

## Discovery Script

Ask:

- Which coding agents are your engineers using today?
- What actions do they still need human approval for?
- What actions are fully blocked?
- Where do raw command approvals break down?
- What was the last agent action that made someone nervous?
- Can you reconstruct a long agent run six months later?
- Which one action would you delegate if the receiver enforced exact bounds?
- Who owns the budget for making agents do more useful work?
- Would this be bought separately from your agent vendor?

Close:

```text
If we guard one real action in one repo and prove receiver refusal plus receipt reconstruction, would you run a paid pilot?
```

## Objection Handling

Agent vendors will build this.

Response: they will build local approvals and logs first. Handshake only matters where cross-runtime, receiver-enforced consequence is required.

We do not let agents near production.

Response: start with preview deploy, protected repo write, package install, or CI mutation. If there is no desire for agents to take larger bounded actions, this is not a buyer.

We already have logs.

Response: logs after mutation are evidence, not enforcement. The pilot proves refusal before mutation.

We need human approval.

Response: human review can be a policy outcome, but it must bind to the exact contract digest the receiver enforces.

This is too much integration.

Response: one runtime, one receiver, one action. If that is too much, the product is too early for that team.

## Validation Metrics

After 15 serious conversations, continue the engineering wedge only if:

- at least 5 engineering/platform prospects score 3 or higher;
- at least 2 score 4 or higher with a named workflow and technical owner;
- at least 1 exposes budget or procurement path;
- receiver-side refusal matters more than logs;
- at least 1 pilot can be scoped to one action family without bespoke sprawl.

Switch attention toward support/billing if:

- support prospects quantify ticket volume, escalation cost, and wrong-action cost;
- they name one bounded mutation class;
- both operations and technical owners engage;
- they react more strongly to autonomous resolution lift than engineering buyers react to agent throughput.

Stop or redesign if:

- buyers only want audit after the fact;
- nobody wants agents to take larger bounded actions;
- receiver enforcement feels like overkill;
- buyers expect runtime vendors to solve the whole problem inside one stack;
- no one will pay for the pilot.

## First Product-Market-Fit Signal

The early PMF signal is not usage of the protocol.

It is a buyer saying:

```text
We would let agents do this action if Handshake enforced the receiver gate and receipt.
```

Strongest signal:

```text
We will pay for one guarded action family now, and we know the second action family we want next.
```

Smallest next product shipment: build the proof packet, use it in 10 buyer calls, and score each call against blocked action, receiver-enforcement value, pilot path, and budget owner.
