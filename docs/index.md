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

1. [Agentic Economy Protocol](./product/agentic-economy-protocol.md)
2. [Full Agentic Experience Architecture](./product/full-agentic-experience-architecture.md)
3. [Agent-Native Surface Binding](./product/agent-native-surface-binding.md)
4. [Product And Protocol Diagrams](./product/product-and-protocol-diagrams.md)
5. [Protocol Kernel](./protocol/protocol-kernel.md)
6. [First Contract Walkthrough](./protocol/first-contract-walkthrough.md)
7. [CLI And MCP Surface](./product/cli-mcp-surface.md)
8. [Runtime Integration](./protocol/runtime-integration.md)
9. [Gateway Integration](./protocol/gateway-integration.md)
10. [Receipt Timeline](./protocol/receipt-timeline.md)
11. [Non-Claims And Theatre](./product/non-claims-and-theatre.md)
12. [Legacy Context Map](./reference/legacy-context-map.md)

Reference material:

- [ADR Control Register](./adr/README.md)
- [Codebase Quality Standards](../QUALITY.md)
- [ADR 0001: Kernel Evidence Boundaries](./adr/0001-kernel-evidence-boundaries.md)
- [ADR 0002: Generated Execution Graph Coverage Boundary](./adr/0002-generated-execution-graph-coverage.md)
- [ADR 0003: Protocol Module Ownership](./adr/0003-protocol-module-ownership.md)
- [API Protocol Reference](./protocol/api-protocol.md)
- [Protocol Completion Audit v0.2](./audits/protocol-completion-audit-v0.2.md)
- [Planning And Technical Data Store Framework](./reference/planning-technical-data-store.md)
- [Business Spine](./business/index.md)
- Runtime OpenAPI metadata is available from `GET /openapi.json`; all `POST
  /v0.2/*` transition routes require role-specific caller custody tokens.

Plan chain:

- [Plans Architecture Spine](./plans/README.md)
- [Protocol Kernel Implementation Plan](./plans/archive/protocol-kernel-v0.2-plan.md)
- [Primitive Fields And State Plan](./plans/01-plan-eng-review-primitive-fields-state.md)
- [Protocol Vocabulary Migration Plan](./plans/01a-plan-eng-review-protocol-migration.md)
- [Authority Hardening Gate](./plans/02-plan-eng-review-authority-hardening.md)
- [Architecture Boundary Freeze](./plans/02b-plan-eng-review-module-boundaries.md)
- [Broker-Grade Protocol Lifecycle Alignment](./plans/02c-plan-eng-review-protocol-spec-alignment.md)
- [Protocol Module Architecture Style](./plans/02d-plan-eng-review-protocol-module-architecture.md)
- [Foundation Kernel Operating Practice](./plans/05-plan-eng-review-foundation-kernel.md)
- [Generated Execution Graph Coverage Boundary](./plans/03-plan-eng-review-generated-execution-graph-coverage.md)
- [Hosted Transition Caller Identity](./plans/04-plan-eng-review-hosted-caller-identity.md)
- [Archived Agent Requirements Extension](./plans/archive/02-plan-eng-review-agent-requirements.md)

The archived agent-requirements extension is provenance only. Current executable
planning order is `01 -> 01a -> 02 -> 02b -> 02c -> 02d -> 05 -> 03`, then the first
Tier 2 protected-path plan. Plan `04` gates hosted or multi-tenant claims; it is
not required for local Tier 2 proof unless the work claims hosted operation.

## Canonical And Provenance Map

Use this map to prevent docs sprawl from becoming product truth.

| Area | Owns | Not Allowed To Own |
|---|---|---|
| `docs/business/` | Product center, tier doctrine, GTM, buyer, monetization, and non-claims. | Implementation plans or new authority semantics. |
| `docs/specs/` | Governing requirements, Product-Build Principles, planning gates, and future `03+` executable specs. | Business positioning or implementation task tracking. |
| `docs/plans/` | Accepted implementation plans, delivery checkpoints, and the cross-plan architecture spine. | New product doctrine not already grounded in business docs or specs. |
| `docs/protocol/` | Protocol reference, runtime/gateway integration, walkthroughs, receipts, and API reference. | Product scope expansion or tier claims that conflict with the spine. |
| `docs/product/` | Product architecture, product surfaces, non-claims, and product/protocol diagrams. | Protocol object semantics, implementation sequencing, or tier doctrine. |
| `docs/audits/` | Point-in-time verification reports and completion audits. | Active implementation scope or current product truth. |
| `docs/reference/` | Context maps and supporting reference material. | Executable scope, product truth, or protocol authority semantics. |
| `docs/plans/archive/` and legacy context | Provenance, rejected ideas, and historical inputs. | Executable scope or canonical requirements. |
| `QUALITY.md` | Code-quality and protocol-quality bar. | Product tier doctrine or future-plan selection. |

Specific truth owners:

| Truth | Owner |
|---|---|
| Current bought product and active next shipment | [`docs/business/canonical-product.md`](./business/canonical-product.md) |
| Tier doctrine, monetization boundary, and long-term claim limits | [`docs/business/tier-doctrine-decision-memo.md`](./business/tier-doctrine-decision-memo.md) |
| Future-plan intake gates for `03+` work | [`docs/specs/00-product-requirements-spine.md`](./specs/00-product-requirements-spine.md) |
| ADR status, citation rules, and decision ownership | [`docs/adr/README.md`](./adr/README.md) |
| Executable implementation sequencing and tier decision spine | [`docs/plans/README.md`](./plans/README.md) |
| Repo-wide module ownership and code quality pattern | [`QUALITY.md`](../QUALITY.md) |

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

### Promotion Ladder

New product or protocol material enters the repo through this ladder:

```text
provenance note or source study
  -> candidate spec when it names an execution shape and protected action path
  -> accepted plan when it passes the requirements spine planning gate
  -> ADR only when it changes a durable architecture decision
  -> canonical business/product docs only when it changes product truth, tier
     doctrine, monetization boundary, or active shipment
```

Plans may reveal doctrine pressure, but they must not silently create doctrine.
When a plan needs a new product claim, write that as an explicit doctrine or
canonical-product change first.

### Deletion Test

Before adding or expanding a doc, ask what unique truth would disappear if the doc
were deleted.

- If no unique truth disappears, link to the owning doc instead of restating it.
- If the doc owns a unique truth, name that truth in its front matter or first
  section.
- If a supporting doc repeats the active shipment, tier doctrine, or planning
  gate, replace the duplicate with a pointer to the owner.
- If an archived or provenance doc is useful, keep it clearly marked as
  provenance only.

## Legacy Context

The old `/Users/joelchan/Documents/Coding/App-Dev/live/handshake` repo is research input from an earlier attempt. It is not the source of truth for v0.2.

Old terms and frames must be mapped, renamed, rejected, or deferred before entering this repo. The map lives in [Legacy Context Map](./reference/legacy-context-map.md).

## Product Boundary

Handshake v0.2 is not a generic management UI, observability product, human review queue, or runtime permission system.

The product moment is narrower:

An agent runtime attempts a consequential action. Handshake reduces it to an exact action contract. Policy decides. The gateway check checks the exact greenlight before mutation. The receipt timeline reconstructs what happened.

Current kernel checkpoint: ADR 0001 expands the evidence boundary for generated execution blocks, protected-path posture, and review artifacts. Those records can inform policy and audit; they still cannot authorize mutation. Authority remains exact `ActionContract` -> `PolicyDecision` -> one-use `Greenlight` -> `GatewayCheckAttempt`.

Proposed next protocol boundary: ADR 0002 owns the generated execution graph coverage decision and non-claims; Plan 03 owns implementation sequencing, source-study detail, hostile fixtures, quality gates, and tests. A shell or codemode block may produce candidates only after the whole generated execution graph is schema-valid, authorized-issuer-bound, catalog-resolved, gateway-registry-bound, redacted, cleanly classified, and digest-bound; unsupported, ambiguous, bypass-prone, hidden-trigger, observer-only, guard-fail-open, guard-bypass, or coverage-gap sibling nodes block contract proposal for the whole block.

Protocol lifecycle alignment: Plan 02c defines the next API/protocol boundary work for protocol-version evidence, request identity evidence, operation observation, orphan mitigation, protected-surface operation claims, and adapter conformance. It exposes transition semantics, not raw storage state: operation claims, raw request context, and debug records are internal unless a later redacted evidence API is designed.

Active next product shipment is owned by
[`docs/business/canonical-product.md`](./business/canonical-product.md). This
index may summarize navigation and non-claims, but it must not become the source
of truth for current shipment scope.
