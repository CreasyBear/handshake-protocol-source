# Phase 04 — Service agent gating (comprehensive delivery)

**Status:** Ready to execute (product/user audit + wave dependency fix 2026-05-28)  
**Context:** [04-CONTEXT.md](./04-CONTEXT.md)  
**Delivery architecture:** [04-DELIVERY-ARCHITECTURE.md](./04-DELIVERY-ARCHITECTURE.md)  
**Product/user audit:** [04-PRODUCT-USER-AUDIT.md](./04-PRODUCT-USER-AUDIT.md) (applied to all plans)  
**Research:** [04-RESEARCH.md](./04-RESEARCH.md)  
**Patterns:** [PATTERNS.md](./PATTERNS.md)  
**Validation:** [04-VALIDATION.md](./04-VALIDATION.md)  
**Verification (post-execute):** [04-VERIFICATION.md](./04-VERIFICATION.md) (created in plan 12)

> **Comprehensive delivery — not MVP.** Twelve plans deliver full operator product with **two-tier sign-off**: operator TTHW (waves 1–6 + handler walk) vs full maintainer completeness (deferred manifest lane).

**Invariant:** Admission identifies callers; only adapter-wrapped `VerifiedGatewayCheck` before mutation is Handshake. Ingress-only posture is advisory (D-00). Kernel transition semantics stay frozen (Phase 03 lock).

**Clerk-for-agents framing:**

```text
Request
  → http/admission (middleware: identity + transition scope)
  → kernel transitions (compile, propose, policy, gatewayCheck evidence)
  → service app handler (route handler: adapter.run*Gateway before mutation)
  → downstream effect
```

## Operator journey (single Start Here)

```text
developer-experience-index → service-operator-golden-path.md
  Steps 1–2: what Handshake is + dual enforcement
  Step 3 fork:
    Branch A (service API) → demo / service bootstrap → failure table
    Branch B (agent host)  → host doctor → quickstart x402 → simulate
                           (optional: quickstart agent-spine)
  Advanced (not first 30 min) → integrator-tier-1-transitions.md
```

## Wave graph

```text
Wave 1:  01 dual-lane doctrine, 02 unified golden path product
Wave 2:  03 atomic install bootstrap, 04 agent-spine (recommended) — parallel
Wave 3:  05 failure taxonomy HTTP + operator failure table
Wave 4:  06 parity-only multi-surface, 07 tier-1 integrator platform (appendix doc) — parallel; 06 after 05; 07 after 03
Wave 5:  08 HTTP profile adapter platform — after 05
Wave 6:  09 proof-gap prose + honesty test, 10 custody (matrix + bilateral sections) — parallel; 09 after 08; 10 after 02, 04
Wave 7:  11 handler mutation gating only (manifest deferred)
Wave 8:  12 two-tier E2E verification — after all
```

**Operator sign-off available after Wave 6** (`check-service-agent-gating-phase.mjs --tier operator`).

## Plans (12)

| Plan | File | Subsystem | Wave | Depends on | Tasks | Objective |
|------|------|-----------|------|------------|-------|-----------|
| 01 | [04-01-PLAN.md](./04-01-PLAN.md) | S1 dual-lane doctrine | 1 | — | 4 | **executed** — Agent lane in workflow story; dual-enforcement in decisions/notes + arch tests |
| 02 | [04-02-PLAN.md](./04-02-PLAN.md) | S2 golden path product | 1 | — | 4 | **executed** — Unified journey + step-3 fork; service-first index |
| 03 | [04-03-PLAN.md](./04-03-PLAN.md) | S3 atomic install | 2 | 01, 02 | 5 | **executed** — service bootstrap example + CLI + HTTP tests |
| 04 | [04-04-PLAN.md](./04-04-PLAN.md) | S4 agent-spine | 2 | 01, 02 | 4 | **executed** — recommended quickstart agent-spine + anti-theatre tests |
| 05 | [04-05-PLAN.md](./04-05-PLAN.md) | S5 failure HTTP | 3 | — | 5 | **executed** — failureClass envelope + golden-path failure table |
| 06 | [04-06-PLAN.md](./04-06-PLAN.md) | S6 failure parity | 4 | 05 | 4 | **executed** — shared failureClass; SDK/MCP parity + repair helpers |
| 07 | [04-07-PLAN.md](./04-07-PLAN.md) | S7 tier-1 integrator | 4 | 03 | 4 | **executed** — integratorTier1 navigation + appendix + parity tests |
| 08 | [04-08-PLAN.md](./04-08-PLAN.md) | S8 HTTP platform | 5 | 05 | 5 | **executed** — http-profile module; auth.md compose; orphan guard |
| 09 | [04-09-PLAN.md](./04-09-PLAN.md) | S9 proof-gap honesty | 6 | 08 | 4 | **executed** — proof-gap prose + honesty test; no stub dirs |
| 10 | [04-10-PLAN.md](./04-10-PLAN.md) | S10 custody | 6 | 02, 04 | 4 | **executed** — configuredBy matrix + bilateral sections + doctor attestation |
| 11 | [04-11-PLAN.md](./04-11-PLAN.md) | S11 bypass (minimal) | 7 | 03, 07, 08 | 1 | **executed** — http-handler-mutation-gating test; manifest deferred |
| 12 | [04-12-PLAN.md](./04-12-PLAN.md) | S12 E2E verification | 8 | 01–11 | 4 | **executed** — tiered gate script; integration + completion contracts |

**Total:** 48 tasks across 12 plans, 8 waves.

## Two-tier phase gates

| Tier | When | Command | Meaning |
|------|------|---------|---------|
| **Operator** | After wave 6 (+ plan 11 handler test) | `node scripts/check-service-agent-gating-phase.mjs --tier operator` | Service operator TTHW shippable |
| **Full** | After wave 8 | `node scripts/check-service-agent-gating-phase.mjs --tier full` | Complete engineering slice; manifest still deferred to phase 05 |

## Deferred (maintainer lane — not blocking operator TTHW)

| Item | Was in | Now |
|------|--------|-----|
| `service-mutation-route-manifest` + registry sync | Plan 11 | Phase 05 / post-operator |
| `http-profile-adapter-conformance` expansion | Plan 11 | Phase 05 |
| `check-product-completion` dual-enforcement inventory slice | Plan 11 | Phase 05 |
| `service-operator-runbook.md`, `host-operator-runbook.md` | Plan 10 | Post-execute extract from golden paths |
| `examples/auth-md-protected-api-stub/`, `package-install-protected-action-stub/` | Plan 09 | **Eliminated** — prose proof-gap list only |
| `handshake failures explain` CLI | Discussed in 05/06 | **Eliminated** — `explainHandshakeError` + failureClass |
| `protocol-definition` / `ecosystem-strategy` dual-lane expansion | Plan 01 | **Eliminated** — decisions.md + protocol-notes |

## Decision coverage (D-00..D-25)

Unchanged — see prior index; D-24 satisfied in phase 04 by handler walk; full manifest D-24 deferred with explicit phase 05 pointer in plan 11/12.

## Kernel invariants (all plans)

- **No protocol kernel transition semantic changes** — navigation metadata, HTTP envelope, surfaces, docs, tests only.
- **No schema export renames** — product vocabulary in docs; API names unchanged.
- **One runnable clearance wedge** — x402 only; auth.md and package install remain proof-gap prose.
- **Do not fake blocked proof gates green** — live x402 paid retry, host containment, registry discoverability.
- **Dual enforcement** — admission + gateway on every consequential route; external PEP is glue only.
- **D-25:** Per-customer product-completion bypass packets deferred; first-party dogfood + scaffold only.

## Execute

```bash
/gsd-execute-phase 04-service-agent-gating
```

Recommended wave order: **01, 02** → **03 ∥ 04** → **05** → **06 ∥ 07** → **08** → **09 ∥ 10** → **11** → **12**.

Operator checkpoint (optional mid-phase):

```bash
node scripts/check-service-agent-gating-phase.mjs --tier operator
```

Full phase gate (after plan 12):

```bash
node scripts/check-service-agent-gating-phase.mjs --tier full
```
