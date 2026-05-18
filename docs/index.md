# Handshake v0.2 Canonical Docs

Status: Canonical public alpha
Version: v0.2.3
Audience: Agent-runtime builders, gateway owners, platform engineering, security engineering
Implementation status: Backed by the v0.2 protocol kernel and reference gateway harness; real gateway integrations are target work
Canonical owner: Product owner
Last reviewed: 2026-05-18

## Invariant

No consequential autonomous action executes outside declared bounds. Every exact action must be gateway-checked, refusal-preserving, reconstructable, and adversarially testable.

## What v0.2 Is

Handshake v0.2 is the restart.

The end goal is a protocol spine for the agentic economy: autonomous agents, runtimes, tools, gateways, and organizations need a common way to turn vague intent into exact, inspectable, gateway-checked execution.

v0.2 does not try to solve the whole economy. It proves the smallest hard loop:

```text
runtime-originated consequential action
  -> intent compilation record
  -> exact action contract
  -> policy decision
  -> one-use greenlight or refusal
  -> gateway check before mutation
  -> receipt or proof gap
  -> reconstructable execution chain
```

If a gateway does not enforce the gate before consequence, the system is advisory, not Handshake.

## Canonical Spine

Read these in order:

1. [Agentic Economy Protocol](./agentic-economy-protocol.md)
2. [Full Agentic Experience Architecture](./full-agentic-experience-architecture.md)
3. [Product And Protocol Diagrams](./product-and-protocol-diagrams.md)
4. [Protocol Kernel](./protocol-kernel.md)
5. [First Contract Walkthrough](./first-contract-walkthrough.md)
6. [CLI And MCP Surface](./cli-mcp-surface.md)
7. [Runtime Integration](./runtime-integration.md)
8. [Gateway Integration](./gateway-integration.md)
9. [Receipt Timeline](./receipt-timeline.md)
10. [Non-Claims And Theatre](./non-claims-and-theatre.md)
11. [Legacy Context Map](./legacy-context-map.md)

Reference material:

- [ADR 0001: Kernel Evidence Boundaries](./adr/0001-kernel-evidence-boundaries.md)
- [ADR 0002: Generated Execution Graph Coverage Boundary](./adr/0002-generated-execution-graph-coverage.md)
- [API Protocol Reference](./api-protocol.md)
- [Protocol Completion Audit v0.2](./protocol-completion-audit-v0.2.md)
- [Planning And Technical Data Store Framework](./planning-technical-data-store.md)
- [Business Spine](./business/index.md)
- Runtime OpenAPI metadata is available from `GET /openapi.json`; all `POST
  /v0.2/*` transition routes require role-specific caller custody tokens.

Plan chain:

- [Protocol Kernel Implementation Plan](./protocol-kernel-v0.2-plan.md)
- [Primitive Fields And State Plan](./plans/01-plan-eng-review-primitive-fields-state.md)
- [Protocol Vocabulary Migration Plan](./plans/01a-plan-eng-review-protocol-migration.md)
- [Authority Hardening Gate](./plans/02-plan-eng-review-authority-hardening.md)
- [Architecture Boundary Freeze](./plans/02b-plan-eng-review-module-boundaries.md)
- [Broker-Grade Protocol Lifecycle Alignment](./plans/02c-plan-eng-review-protocol-spec-alignment.md)
- [Generated Execution Graph Coverage Boundary](./plans/03-plan-eng-review-generated-execution-graph-coverage.md)
- [Archived Agent Requirements Extension](./plans/archive/02-plan-eng-review-agent-requirements.md)

The archived agent-requirements extension is provenance only. Current executable planning order is `01 -> 01a -> 02 -> 02b -> 02c -> 03`.

## Canonical And Provenance Map

Use this map to prevent docs sprawl from becoming product truth.

| Area | Owns | Not Allowed To Own |
|---|---|---|
| `docs/business/` | Product center, tier doctrine, GTM, buyer, monetization, and non-claims. | Implementation plans or new authority semantics. |
| `docs/specs/` | Governing requirements, Product-Build Principles, planning gates, and future `03+` executable specs. | Business positioning or implementation task tracking. |
| `docs/plans/` | Accepted implementation plans and delivery checkpoints. | New product doctrine not already grounded in business docs or specs. |
| top-level protocol docs | Protocol reference, runtime/gateway integration, walkthroughs, diagrams, receipts, and API reference. | Product scope expansion or tier claims that conflict with the spine. |
| `docs/plans/archive/` and legacy context | Provenance, rejected ideas, and historical inputs. | Executable scope or canonical requirements. |
| `QUALITY.md` | Code-quality and protocol-quality bar. | Product tier doctrine or future-plan selection. |

If two docs conflict, use this precedence:

```text
AGENTS.md invariant
  -> docs/specs/00-product-requirements-spine.md for planning gates
  -> docs/business/tier-doctrine-decision-memo.md for tier doctrine
  -> docs/business/canonical-product.md for current bought product
  -> protocol reference docs for object semantics
  -> plans for accepted implementation slices
  -> archives and legacy docs as provenance only
```

Future `03+` plans must start from the requirements spine. Archived or legacy material can supply evidence, but it cannot override the spine's Product-Build Principles, Quality Contract requirement, protected action path gate, bypass posture, or non-claim.

## Legacy Context

The old `/Users/joelchan/Documents/Coding/App-Dev/live/handshake` repo is research input from an earlier attempt. It is not the source of truth for v0.2.

Old terms and frames must be mapped, renamed, rejected, or deferred before entering this repo. The map lives in [Legacy Context Map](./legacy-context-map.md).

## Product Boundary

Handshake v0.2 is not a generic management UI, observability product, human review queue, or runtime permission system.

The product moment is narrower:

An agent runtime attempts a consequential action. Handshake reduces it to an exact action contract. Policy decides. The gateway check checks the exact greenlight before mutation. The receipt timeline reconstructs what happened.

Current kernel checkpoint: ADR 0001 expands the evidence boundary for generated execution blocks, protected-path posture, and review artifacts. Those records can inform policy and audit; they still cannot authorize mutation. Authority remains exact `ActionContract` -> `PolicyDecision` -> one-use `Greenlight` -> `GatewayCheckAttempt`.

Proposed next protocol boundary: ADR 0002 and Plan 03 define generated execution graph coverage, informed by a source-level study of `vercel-labs/json-render`. A shell or codemode block may produce candidates only after the whole generated execution graph is schema-valid, catalog-resolved, gateway-registry-bound, cleanly classified, and digest-bound; unsupported, ambiguous, bypass-prone, hidden-trigger, observer-only, or coverage-gap sibling nodes block contract proposal for the whole block.

Protocol lifecycle alignment: Plan 02c defines the next API/protocol boundary work for protocol-version evidence, request identity evidence, operation observation, orphan mitigation, protected-surface operation claims, and adapter conformance. It exposes transition semantics, not raw storage state: operation claims, raw request context, and debug records are internal unless a later redacted evidence API is designed.

Active next product shipment: establish the Handshake CLI/MCP protected action surface. The CLI sets up, inspects, and validates; the MCP server exposes protected proposal tools to agents; the protocol/control plane remains the authority for contracts, policy, greenlights, and receipts; gateway adapters own mutation credentials. The local preview-deploy fixture proves only local gateway-checked preview evidence. It is not Vercel, Cloudflare, GitHub Deployments, or other provider-side enforcement.
