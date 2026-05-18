# Canonical Product

Status: Canonical business alpha  
Version: v0.2.0  
Audience: Founder, product, engineering, GTM, design partners  
Implementation status: Product direction; depends on the v0.2 protocol kernel completion audit and current package-install/repo-write receiver proofs
Canonical owner: Product owner  
Last reviewed: 2026-05-17

## Customer And Moment Of Value

Customer: platform engineering, developer productivity, AI tooling, and security-minded engineering leaders adopting coding agents.

Moment of value: an agent reaches a production-adjacent action and cannot mutate the receiver unless the exact action contract receives a one-use greenlight and the receiver gate consumes it before mutation.

## Product Thesis

Agents are becoming useful enough to do real engineering work, but teams still block them at the point of consequence:

- preview deploys;
- package installs;
- CI and release changes;
- repo writes with downstream consequence;
- cloud configuration changes;
- database or migration actions;
- long-running generated-code tasks.

Raw command approvals are not a control boundary. Runtime logs are not authority. A dashboard after mutation is not enough.

Handshake sells bounded execution:

```text
exact action contract
-> exact policy decision
-> one-use receiver-bound greenlight
-> receiver gate before mutation
-> receipt, refusal, or proof gap
```

## First Bought Product

The first bought product is:

```text
Handshake Agent Guardrails
```

Definition:

```text
An integration kit and receipt experience that lets a coding-agent workflow execute one guarded production-adjacent action through receiver-gated action contracts.
```

The first pilot is not "install Handshake everywhere." It is:

```text
one repo
one agent runtime
one consequential action class
one receiver gate
one policy file
one receipt timeline
```

## First Wedge

Start with engineering-agent actions because they are the fastest credible proof:

- the founder can build and demo the workflow without enterprise access;
- runtime/tool boundaries are visible;
- receiver refusal can be proven in a harness;
- engineering buyers already understand command approval fatigue;
- the same proof later explains support, billing, cloud, and agentic SaaS use cases.

Best first action families:

1. preview deploy;
2. protected repo write;
3. package install;
4. CI or release mutation;
5. fixture account/customer update for a support/billing challenger demo.

The first action family must show refusal before mutation for missing, replayed, mismatched, isolated, and receiver-policy-drifted greenlights.

## Product Surfaces

Allowed now:

- protocol kernel;
- runtime adapter for one consequential action path;
- receiver gate SDK or harness;
- Contract Viewer for one exact `ActionContract`;
- Receipt Timeline for one action chain;
- structured refusal and recovery messages;
- proof-gap display;
- fixture runner for design-partner demos.

Allowed later, after receiver-gated activation exists:

- policy pack editor;
- receiver registry console;
- isolation and kill-switch console;
- proof-gap workbench;
- review queue bound to exact contract digests;
- exposure ledger for cumulative risk;
- audit export packet;
- multi-runtime adapter SDK;
- embedded SDK for agentic SaaS vendors.

Rejected until proven:

- broad fleet dashboard;
- generic agent governance product;
- compliance portal;
- marketplace;
- payment or settlement rails;
- runtime-plugin-only enforcement;
- audit log after mutation;
- human approval inbox that does not bind to exact contract digest.

## Positioning Ladder

Use lower levels until the buyer has felt the problem.

Level 1:

```text
Receiver-gated preview deploys and protected engineering actions for coding agents.
```

Level 2:

```text
Receiver-gated action contracts for engineering agents.
```

Level 3:

```text
Contracted execution for autonomous engineering work.
```

Level 4:

```text
Bounded actuation infrastructure for the agentic economy.
```

Do not lead a first buyer conversation with Level 4.

## Sales Claim We Can Defend

Handshake helps engineering teams let coding agents perform larger production-adjacent tasks by turning consequential tool/code/API execution into exact action contracts, one-use receiver-gated greenlights, refusals, receipts, and proof gaps.

## Claims We Must Not Make Yet

- Handshake is universal agent governance.
- Handshake makes agents safe.
- Runtime plugin installation is enough.
- Receipts prove downstream business success.
- Handshake controls all browser or shell actions.
- Handshake controls a receiver while the agent still has raw mutation credentials.
- Handshake is an agent marketplace.
- Handshake is payment or settlement infrastructure.
- Handshake replaces identity, secrets, CI, or cloud policy.

## Expansion Path

Sequence:

```text
engineering-agent proof
-> paid design partner on one receiver-gated action
-> second engineering action family
-> second runtime or second receiver
-> support/billing challenger validation
-> embedded SDK for agentic SaaS vendors
-> broader bounded-actuation category
```

Move to the next step only when the previous step proves that receiver enforcement mattered to the buyer.

Active next product shipment: a design-partner proof where one coding-agent action reaches a real receiver gate, refuses bypass/replay/mismatch, and renders the receipt timeline. Use the implemented package-install or repo-write proof until a production preview-deploy receiver exists.
