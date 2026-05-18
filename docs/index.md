# Handshake v0.2 Canonical Docs

Status: Canonical public alpha  
Version: v0.2.0  
Audience: Agent-runtime builders, receiver owners, platform engineering, security engineering  
Implementation status: Backed by the v0.2 protocol kernel and reference receiver harness; real receiver integrations are target work  
Canonical owner: Product owner  
Last reviewed: 2026-05-17

## Invariant

No consequential autonomous action executes outside declared bounds. Every exact action must be receiver-gated, refusal-preserving, reconstructable, and adversarially testable.

## What v0.2 Is

Handshake v0.2 is the restart.

The end goal is a protocol spine for the agentic economy: autonomous agents, runtimes, tools, receivers, and organizations need a common way to turn vague intent into exact, inspectable, receiver-gated execution.

v0.2 does not try to solve the whole economy. It proves the smallest hard loop:

```text
runtime-originated consequential action
  -> intent compilation record
  -> exact action contract
  -> policy decision
  -> one-use greenlight or refusal
  -> receiver gate before mutation
  -> receipt or proof gap
  -> reconstructable execution chain
```

If a receiver does not enforce the gate before consequence, the system is advisory, not Handshake.

## Canonical Spine

Read these in order:

1. [Agentic Economy Protocol](./agentic-economy-protocol.md)
2. [Full Agentic Experience Architecture](./full-agentic-experience-architecture.md)
3. [Product And Protocol Diagrams](./product-and-protocol-diagrams.md)
4. [Protocol Kernel](./protocol-kernel.md)
5. [First Contract Walkthrough](./first-contract-walkthrough.md)
6. [Runtime Integration](./runtime-integration.md)
7. [Receiver Integration](./receiver-integration.md)
8. [Receipt Timeline](./receipt-timeline.md)
9. [Non-Claims And Theatre](./non-claims-and-theatre.md)
10. [Legacy Context Map](./legacy-context-map.md)

Reference material:

- [API Protocol Reference](./api-protocol.md)
- [Protocol Completion Audit v0.2](./protocol-completion-audit-v0.2.md)
- [Planning And Technical Data Store Framework](./planning-technical-data-store.md)
- [Business Spine](./business/index.md)
- Runtime OpenAPI metadata is available from `GET /openapi.json`.

Historical planning inputs:

- [Protocol Kernel Implementation Plan](./protocol-kernel-v0.2-plan.md)
- [Primitive Fields And State Plan](./plans/01-plan-eng-review-primitive-fields-state.md)
- [Agent Requirements Plan-Eng Review Extension](./plans/02-plan-eng-review-agent-requirements.md)

These planning inputs are not live implementation status. When they conflict with `Protocol Kernel`, `API Protocol Reference`, or `Protocol Completion Audit v0.2`, the current canonical docs win.

## Legacy Context

The old `/Users/joelchan/Documents/Coding/App-Dev/live/handshake` repo is research input from an earlier attempt. It is not the source of truth for v0.2.

Old terms and frames must be mapped, renamed, rejected, or deferred before entering this repo. The map lives in [Legacy Context Map](./legacy-context-map.md).

## Product Boundary

Handshake v0.2 is not a generic management UI, observability product, human review queue, or runtime permission system.

The product moment is narrower:

An agent runtime attempts a consequential action. Handshake reduces it to an exact action contract. Policy decides. The receiver gate checks the exact greenlight before mutation. The receipt timeline reconstructs what happened.

Active next product shipment: package the proven v0.2 loop into one design-partner proof packet: one command or fixture run, one contract view, one receiver-gated mutation/refusal, one receipt timeline, and one buyer scorecard.
