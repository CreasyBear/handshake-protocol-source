# Canonical Product

Status: Canonical business alpha
Version: v0.2.1
Audience: Founder, product, engineering, GTM, design partners
Implementation status: Product direction; depends on the v0.2 protocol kernel completion audit and current package-install/repo-write gateway proofs
Canonical owner: Product owner
Last reviewed: 2026-05-18

## Customer And Moment Of Value

Customer: platform engineering, developer productivity, AI tooling, and security-minded engineering leaders adopting coding agents.

Moment of value: an agent reaches a production-adjacent action and cannot mutate the gateway unless the exact action contract receives a one-use greenlight and the gateway check consumes it before mutation.

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

Handshake sells protected action control:

```text
exact action contract
-> exact policy decision
-> one-use gateway-bound greenlight
-> gateway check before mutation
-> receipt, refusal, or proof gap
```

## First Bought Product

The first bought product is:

```text
Handshake Protected Actions
```

Definition:

```text
An integration kit and receipt experience that lets a coding-agent workflow execute one protected production-adjacent action through gateway-checked action contracts.
```

The first pilot is not "install Handshake everywhere." It is:

```text
one repo
one agent runtime
one consequential action class
one gateway check
one policy file
one receipt timeline
```

## First Wedge

Start with engineering-agent actions because they are the fastest credible proof:

- the founder can build and demo the workflow without enterprise access;
- runtime/tool boundaries are visible;
- gateway refusal can be proven first in reference tests and then in an installed credential-owning gateway;
- engineering buyers already understand command approval fatigue;
- the same proof later explains support, billing, cloud, and agentic SaaS use cases.

Best first product surfaces and action families:

1. Handshake CLI/MCP protected action surface;
2. protected repo-write-to-PR through a GitHub App-backed gateway adapter;
3. preview deploy;
4. package install;
5. CI or release mutation;
6. fixture account/customer update for a support/billing challenger demo.

The first action family must show refusal before mutation for missing, replayed, mismatched, isolated, and gateway-policy-drifted greenlights.

## Product Surfaces

Allowed now:

- protocol kernel;
- Handshake CLI for setup, inspection, receipts, install health, and conformance;
- runtime adapter for one consequential action path;
- gateway check SDK or harness;
- protected MCP/CLI capability for one guarded action family;
- GitHub App-backed `repo_write_gateway` for protected repo-write-to-PR;
- Contract Viewer for one exact `ActionContract`;
- Receipt Timeline for one action chain;
- structured refusal and recovery messages;
- proof-gap display;
- conformance runner for black-box validation of the installed path.

Allowed later, after gateway-checked activation exists:

- policy pack editor;
- gateway registry console;
- isolation and kill-switch console;
- proof-gap workbench;
- review queue bound to exact contract digests;
- exposure ledger for cumulative risk;
- audit export packet;
- multi-runtime adapter SDK;
- embedded SDK for agentic SaaS vendors.
- protected paid-call or payment-rail adapters as adjacent future gateway/call adapters, only after the engineering wedge proves gateway-checked activation.

Rejected until proven:

- broad fleet dashboard;
- generic agent governance product;
- compliance portal;
- marketplace;
- payment rails, wallets, settlement, accounting, credit, fraud, budget management, or personalized spend-preference tooling;
- runtime-plugin-only enforcement;
- audit log after mutation;
- human approval inbox that does not bind to exact contract digest.

## Financial Boundary

AgentCash, x402, MPP, AP2, ACP, and other payment-rail systems are useful category pressure and possible future adapter surfaces. They are not the product center.

Handshake may protect a paid call as a consequential action by binding the provider, endpoint, method, schema/source digest, request digest, and payment challenge or terms digest when available. It may record payment proof as receipt evidence.

Handshake does not manage wallets, balances, personalized financial preferences, budgets, settlement, accounting, credit, fraud, or financial approval policy. Spend amounts are not a Handshake-owned policy domain. Payment terms are contract and evidence context only when needed to prevent contract drift or reconstruct a paid call.

If a provider or payment rail does not implement a Handshake gateway check, Handshake can claim protected adapter-side call control and evidence capture. It cannot claim provider-side gateway enforcement.

## Positioning Ladder

Use lower levels until the buyer has felt the problem.

Level 1:

```text
Gateway-checked preview deploys and protected engineering actions for coding agents.
```

Level 2:

```text
Gateway-checked action contracts for engineering agents.
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

Handshake helps engineering teams let coding agents perform larger production-adjacent tasks by turning consequential tool/code/API execution into exact action contracts, one-use gateway-checked greenlights, refusals, receipts, and proof gaps.

## Claims We Must Not Make Yet

- Handshake is universal agent governance.
- Handshake makes agents safe.
- Runtime plugin installation is enough.
- Receipts prove downstream business success.
- Handshake controls all browser or shell actions.
- Handshake controls a gateway while the agent still has raw mutation credentials.
- Handshake is an agent marketplace.
- Handshake is payment, wallet, budget, settlement, accounting, credit, fraud, or financial-management infrastructure.
- Handshake replaces identity, secrets, CI, or cloud policy.

## Expansion Path

Sequence:

```text
engineering-agent proof
-> paid design partner on one gateway-checked action
-> second engineering action family
-> second runtime or second gateway
-> support/billing challenger validation
-> embedded SDK for agentic SaaS vendors
-> broader bounded-actuation category
```

Move to the next step only when the previous step proves that gateway enforcement mattered to the buyer.

Active next product shipment: a design-partner pilot for Handshake Protected Actions through the CLI/MCP protected action surface, using GitHub App-backed protected repo-write-to-PR as the first gateway adapter proof. The pilot must show one coding-agent workflow reaching a real credential-owning gateway check, refusing bypass/replay/mismatch before GitHub mutation, and rendering the Contract Viewer plus Receipt Timeline. Current package-install and repo-write proofs remain protocol/conformance evidence; do not substitute them for the installed gateway pilot.
