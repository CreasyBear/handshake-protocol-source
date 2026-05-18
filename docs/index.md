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
3. [Protocol Kernel](./protocol-kernel.md)
4. [First Contract Walkthrough](./first-contract-walkthrough.md)
5. [Runtime Integration](./runtime-integration.md)
6. [Receiver Integration](./receiver-integration.md)
7. [Receipt Timeline](./receipt-timeline.md)
8. [Non-Claims And Theatre](./non-claims-and-theatre.md)
9. [Legacy Context Map](./legacy-context-map.md)

Reference material:

- [API Protocol Reference](./api-protocol.md)
- [Protocol Completion Audit v0.2](./protocol-completion-audit-v0.2.md)
- [Protocol Kernel Implementation Plan](./protocol-kernel-v0.2-plan.md)
- [Agent Requirements Plan-Eng Review Extension](./plans/02-plan-eng-review-agent-requirements.md)
- [Business Spine](./business/index.md)
- Runtime OpenAPI metadata is available from `GET /openapi.json`.

## Legacy Context

The old `/Users/joelchan/Documents/Coding/App-Dev/live/handshake` repo is research input from an earlier attempt. It is not the source of truth for v0.2.

Old terms and frames must be mapped, renamed, rejected, or deferred before entering this repo. The map lives in [Legacy Context Map](./legacy-context-map.md).

## Product Boundary

Handshake v0.2 is not a generic management UI, observability product, human review queue, or runtime permission system.

The product moment is narrower:

An agent runtime attempts a consequential action. Handshake reduces it to an exact action contract. Policy decides. The receiver gate checks the exact greenlight before mutation. The receipt timeline reconstructs what happened.

Smallest next product shipment: make that loop obvious, runnable, and hard to misread.
