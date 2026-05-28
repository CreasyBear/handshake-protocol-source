---
phase: 04-service-agent-gating
status: passed
verified_at: 2026-05-29
---

# Phase 04 verification — service-operator dual-enforcement gating

Two-tier sign-off: **operator tier** (TTHW / service-operator ship) and **full tier**
(maintainer completeness). Manifest-based mutation inventory remains deferred to Phase 05.

## Operator tier success

Service operators can:

1. Follow [service-operator-golden-path.md](../../docs/internal/service-operator-golden-path.md) with Step 3 fork, Branch A bootstrap, proof-gap honesty, and failureClass table.
2. Run `handshake service bootstrap` (or `examples/service-operator-bootstrap/run.ts`) with idempotent compiled-records registration.
3. Read bilateral setup order in golden paths without standalone runbook files.
4. Use doctor attestation output (host + MCP) as binding digest evidence only — not authority.
5. Rely on handler mutation gating architecture test for first-party HTTP read-only posture and adapter-gated example runners.

Mechanical sign-off:

```bash
node scripts/check-service-agent-gating-phase.mjs --tier operator
# or: npm run check:service-agent-gating-phase
```

## Maintainer tier success (additive)

Everything in operator tier, plus:

- Integrator Tier-1 transition parity and walkthrough tests
- HTTP profile canonicalization and orphan-catalog refusal tests
- SDK/MCP failureClass parity
- Maintainer product completion contract (manifest still absent)

Mechanical sign-off:

```bash
node scripts/check-service-agent-gating-phase.mjs --tier full
# or: npm run check:service-agent-gating-phase:full
```

## Subsystem checklist (S1–S12 → plans 01–12)

| Subsystem | Plan | Operator tier | Full tier |
| --- | --- | --- | --- |
| Dual-lane doctrine | 01 | required | required |
| Golden path docs | 02 | required | required |
| Service bootstrap | 03 | required | required |
| Agent-spine CLI | 04 | optional convenience | required test if present |
| Failure taxonomy HTTP | 05 | required | required |
| SDK/MCP failureClass | 06 | required | required |
| Integrator Tier-1 | 07 | appendix exists | parity tests |
| HTTP profile platform | 08 | module exists | full adapter tests |
| Proof-gap honesty | 09 | required | required |
| Custody & bilateral ops | 10 | required | required |
| Handler mutation gating | 11 | required | required |
| Operator E2E gate | 12 | required | required |

## Explicit non-goals (phase 04)

- Kernel protocol changes or second runnable clearance path beyond buyer-side `x402_payment.exact`
- Stub example directories for auth.md or package-install proof-gap families
- Mandatory `handshake quickstart agent-spine` for operator sign-off
- `service-operator-runbook.md` / `host-operator-runbook.md` standalone files
- `service-mutation-route-manifest` module or registry sync script (Phase 05)
- Fake green gates for blocked proof surfaces (hosted operation, registry discoverability, marketplace trust)

## Deferred to Phase 05

- Full mutation route manifest and `check-product-completion` inventory slice
- Standalone operator runbook extraction from golden path sections
- Complete [host-golden-paths-and-trace-guidance.md](../../docs/internal/host-golden-paths-and-trace-guidance.md) expansion beyond phase-04 stub pointer

## Product user audit

Applied patches from `04-PRODUCT-USER-AUDIT.md` (2026-05-28): no proof-gap stub packages,
bilateral sections in golden paths, two-tier phase gate, agent-spine optional on operator tier.
