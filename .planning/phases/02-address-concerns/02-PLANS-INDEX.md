# Phase 02 — Executable plans

**Status:** Planned (research skipped; premortem adjustments 2026-05-28)  
**Context:** [02-CONTEXT.md](./02-CONTEXT.md)  
**Research:** [02-RESEARCH.md](./02-RESEARCH.md) (skipped; CONTEXT + CONCERNS)

**Premortem adjustments:** Plan 02 mandatory negative drift proof; Plan 04 human-string clearance grep; Plan 05 priority `audit_read` types (`refusal`, `receipt`, `greenlight`); Plan 06 ROADMAP alignment note; Plan 01 existingSurfaceFiles scorecard in SUMMARY. Close CONCERNS manifest row in Plan 02 SUMMARY when drift gate lands.

## Wave graph

```text
Wave 1: 02-01 (manifest backfill) → 02-02 (drift gate)
Wave 2: 02-03 (schemas + closeout parity) → 02-04 (MCP/CLI/A2A labeling)
Wave 3: 02-05 (hosted scope/audit/redaction) — parallel after 02-01
Wave 4: 02-06 (blocked gates honesty) — after 02-03
```

## Plans

| Plan | File | Depends on | Decisions |
|------|------|------------|-----------|
| 01 | [02-01-PLAN.md](./02-01-PLAN.md) | — | D-05, D-07, D-08, D-20 |
| 02 | [02-02-PLAN.md](./02-02-PLAN.md) | 01 | D-06, D-08 |
| 03 | [02-03-PLAN.md](./02-03-PLAN.md) | 02 | D-02, D-13, D-14, D-22 |
| 04 | [02-04-PLAN.md](./02-04-PLAN.md) | 03 | D-02, D-13, D-20, D-21 |
| 05 | [02-05-PLAN.md](./02-05-PLAN.md) | 01 | D-03, D-04, D-16, D-17, D-18, D-19 |
| 06 | [02-06-PLAN.md](./02-06-PLAN.md) | 03 | D-09–D-12, D-15, D-22 |

## Kernel invariants (all plans)

- **D-00 / D-00b / D-00c:** No protocol transition or greenlight semantic changes; no wedge logic in `src/protocol/`; preserve modular exports.

## Deferred (not in these plans)

- Live x402 paid retry execution (D-03, Phase 03)
- Host-wide containment proof (D-10 optional transcript only)
- Runtime ingress family expansion (D-11)
- Mandatory audit_read tenancy fields (D-18)
- Preview deploy wedge (D-23)

## Execute

```bash
/gsd-execute-phase 02-address-concerns
```

Recommended order: `01 → 02 → 03 → 04` and `05` after `01`; `06` after `03`.
