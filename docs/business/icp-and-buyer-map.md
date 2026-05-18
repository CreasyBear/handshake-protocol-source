# ICP And Buyer Map

Status: Canonical business alpha
Version: v0.2.1
Audience: Founder, GTM, product, design partners
Implementation status: Strategy definition; not yet validated by paid pilots
Canonical owner: Product owner
Last reviewed: 2026-05-18

## Customer And Moment Of Value

Customer: AI-forward engineering teams that want coding agents to take larger production-adjacent actions.

Moment of value: the buyer sees one agent-originated action become an exact contract, get a one-use greenlight or refusal, hit gateway enforcement before mutation, and leave a receipt that reconstructs the run.

## ICP Thesis

Handshake's first ICP is not "companies using AI."

The first ICP is:

```text
Engineering organizations already using coding agents, already feeling the blocked-action ceiling, and able to expose one gateway-owned consequential action for a paid pilot.
```

If they do not want agents to take larger bounded actions, they are not an ICP.

If they only want logs, dashboards, or policy review, they are not an ICP.

If no gateway owner can participate, they are not an ICP for v0.2.

## Primary ICP

| Dimension | Target |
|---|---|
| Company type | Software company, AI-native startup, developer-tool company, infrastructure company, or engineering-heavy SaaS |
| Size | 20-500 employees for founder-led pilots; larger platform teams only when a single gateway/action owner is available |
| Agent maturity | Engineers use Claude Code, Codex, Cursor, OpenClaw, Hermes, internal agents, or MCP-backed tools weekly or daily |
| Blocked action | Preview deploy, protected repo write, package install, CI/release mutation, cloud config, migration, or database operation |
| Buyer pain | Agents are useful, but production-adjacent actions still require babysitting, raw command approvals, or hard blocking |
| Technical fit | One runtime/tool boundary and one gateway boundary are reachable in 2-3 weeks |
| Budget path | Developer productivity, platform engineering, AI tooling, CTO discretionary budget, or security/platform pilot budget |
| Urgency signal | They can name the exact action they would let agents do if gateway enforcement existed |

## Best Beachhead Segment

Start with:

```text
AI-forward engineering orgs with coding-agent usage and blocked preview deploy / CI / package / repo-write workflows.
```

Why:

- the workflow is concrete;
- the buyer understands approval fatigue;
- the gateway can be simulated or integrated without enterprise sprawl;
- the demo is visually legible;
- refusal before mutation is obvious;
- the same proof can later transfer to support, billing, cloud, and embedded vendor use cases.

## Secondary ICPs

### Runtime And MCP Builders

Good when they own plugin hooks, MCP dispatch, generated-code execution, or tool routing.

They are useful design partners because they expose bypass and orchestration risk. They are not automatically economic buyers unless enterprise customers are asking for action authority evidence.

### Agentic SaaS Vendors

Good when enterprise deals are blocked by questions like:

```text
Which agent can do what, on whose behalf, against which gateway, under which bounds, and with what evidence?
```

Do not sell them broad trust language. Sell an embeddable gateway-checked action contract layer after the engineering proof exists.

### Support And Billing Operations

Commercially attractive when they can quantify ticket volume, escalation cost, wrong-action cost, and one bounded mutation class.

Do not build this first unless a committed design partner brings both operations and technical owners.

### Payment-Rail And Paid-Call Builders

Useful as adjacent exploration when agents are already calling paid APIs, x402/MPP services, AgentCash tools, or agent-to-service purchase flows.

Do not make this the first ICP. Handshake may protect the exact paid call path and record payment evidence, but it must not become the buyer's wallet, budget engine, settlement layer, accounting system, fraud system, or personalized financial-preference manager.

## Anti-ICP

Reject or defer:

- teams not using agents for real engineering work;
- teams using agents only for local code edits and drafts;
- buyers who only ask for dashboards or audit exports;
- buyers who do not want agents taking larger bounded actions;
- companies with no reachable gateway owner;
- teams that require broad enterprise admin before one action proof;
- buyers who expect GitHub, OpenAI, Anthropic, Cursor, or internal platform to solve everything inside one runtime;
- compliance-only buyers who cannot name a blocked autonomous action;
- generic security buyers who see gateway enforcement as overkill.
- finance/payment buyers who mainly want wallet management, spend budgeting, settlement, accounting, credit, fraud, or marketplace tooling instead of protected action control.

## Buyer Roles

| Role | Buying function | Cares about | Must hear |
|---|---|---|---|
| Economic buyer: CTO / VP Engineering | Owns budget and risk appetite | More engineering leverage without uncontrolled consequence | "This lets agents do one larger action your team currently blocks." |
| Champion: AI Tooling / DevProd Lead | Drives pilot and internal momentum | Developer throughput, fewer stalled runs, clear adoption | "Start with one guarded action family, not a platform rollout." |
| Technical buyer: Platform / Gateway Owner | Controls gateway integration | Gate semantics, idempotency, drift, isolation, receipts | "The gateway refuses before mutation unless the exact greenlight matches." |
| Security influencer | Reviews risk and evidence | Pre-mutation enforcement, reconstruction, proof gaps | "This is not logs after the fact; proof gaps are explicit." |
| User: Staff Engineer / Agent Power User | Feels approval pain | Less babysitting, fewer raw command decisions, recovery | "Low-risk work continues; guarded consequence becomes contract-bound." |
| Procurement / Finance | Validates purchase | Pilot scope, cost, value, renewal path | "One workflow, fixed pilot, expansion only after activation." |

## Seller Definition

The first seller is the founder.

This is not yet an SDR-led motion. It is a founder-led technical discovery sale where the seller must diagnose:

- what agents are currently allowed to do;
- what they are blocked from doing;
- what the buyer would delegate if exact gateway enforcement existed;
- who owns the gateway;
- whether refusal before mutation matters more than audit after mutation;
- whether a paid pilot can be scoped to one action family.

The seller must be able to say no.

If the buyer cannot name a blocked action, cannot provide a gateway owner, or only wants logs, the seller should disqualify.

## Sales Motion

Motion:

```text
founder-led design-partner sale
-> paid pilot
-> second action family expansion
-> team or enterprise plan
```

Default pilot:

```text
2-3 weeks
$5k-$15k
one runtime surface
one gateway check
one guarded action family
one receipt timeline
```

Sales stages:

1. Discovery: identify blocked action and buyer urgency.
2. Technical scoping: confirm runtime and gateway owner.
3. Demo: show action contract, gateway consume, refusal, proof gap, receipt.
4. Pilot proposal: one action family, fixed scope, explicit non-deliverables.
5. Pilot execution: prove activation, refusal, receipt, and reconstruction.
6. Expansion decision: second action family, second gateway, or stop.

## Qualification Scorecard

Score each opportunity from 0-5.

| Criterion | 0 | 3 | 5 |
|---|---|---|---|
| Agent usage | No real agent use | Agents used by individuals | Agents used regularly in team workflows |
| Blocked action | None named | Vague production concern | Specific action family named |
| Gateway owner | Unknown | Possible but not engaged | Engaged and willing to integrate |
| Enforcement value | Wants logs | Interested in prevention | Requires gateway refusal before mutation |
| Budget path | None | Possible platform/security budget | Named budget owner or paid pilot path |
| Pilot scope | Broad and vague | One workflow possible | One runtime, one gateway, one action committed |
| Expansion signal | None | Maybe more actions later | Names second action family now |

Continue only if total score is 24+ out of 35 and gateway owner score is at least 3.

## Discovery Questions

Ask these before showing the product:

- Which coding agents are your engineers using today?
- What actions are agents allowed to take without human interruption?
- What actions still require human review?
- What actions are fully blocked?
- What was the last time an agent action made someone nervous?
- Where do raw command approvals break down?
- Which gateway owns the blocked action?
- If Handshake enforced the gateway check, what one action would you delegate first?
- Would gateway refusal before mutation change your willingness to allow that action?
- Who owns the budget for increasing agent autonomy or developer productivity?

## Buying Triggers

Strong triggers:

- team is rolling out coding agents beyond early adopters;
- security/platform is reviewing agent tool access;
- agents are hitting CI, deploy, package, repo, cloud, or database boundaries;
- a senior engineer is babysitting long runs;
- raw command approvals are being rubber-stamped;
- an incident or near miss exposed weak reconstruction;
- an agentic SaaS vendor is blocked by enterprise authority questions.
- a paid-call or payment-rail team can name one exact agent-call path and accepts that Handshake protects contracts/evidence rather than managing spend.

Weak triggers:

- "AI governance" exploration;
- generic audit requirement;
- curiosity about agent safety;
- no active agent workflows;
- no blocked consequential action.

## Seller Talk Track

Open:

```text
What are your agents still not allowed to do?
```

If they name an action:

```text
What would have to be true for that action to run without a human babysitting every command?
```

Position:

```text
Handshake turns that one action into an exact contract, decides against policy, gives a one-use gateway-bound greenlight or refusal, and makes the gateway check before mutation.
```

Close:

```text
If we prove this on one gateway-checked action in your workflow, would you pay for a pilot and name the second action family you want next?
```

## Disqualification Rules

Disqualify when:

- the buyer cannot name a blocked action;
- the gateway owner is unavailable;
- the desired outcome is only a dashboard or audit export;
- they want broad policy consulting before one proof;
- they see gateway enforcement as unnecessary;
- they cannot imagine paying separately from the agent vendor;
- the pilot would require more than one runtime, one gateway, and one action family.

## First Seller Assets To Build

1. One-page pilot brief.
2. Five-minute demo script.
3. Buyer scorecard.
4. Objection handling sheet.
5. Receipt timeline sample.
6. Technical scoping checklist for runtime and gateway owners.

Active next product shipment: create the one-page Handshake CLI/MCP pilot brief and use this scorecard on the first 10 design-partner conversations. The brief must identify the runtime/tool owner, first gateway adapter owner, GitHub App/gateway owner for the repo-write proof, raw credential removal posture, allowed repo/ref/path bounds, receipt evidence, and budget owner.
