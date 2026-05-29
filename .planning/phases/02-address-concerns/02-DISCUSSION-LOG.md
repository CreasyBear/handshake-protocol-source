# Phase 02: Address Concerns - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `02-CONTEXT.md`.

**Date:** 2026-05-28
**Phase:** 02-address-concerns
**Areas discussed:** sequencing, manifest enforcement, containment proof, evidence theatre, hosted slice, A2A registration, live x402 gates

---

## Remediation sequencing

| Option | Description | Selected |
|--------|-------------|----------|
| Manifest + arch tests first | Stop new surfaces skipping posture enforcement | ✓ |
| Proof separation second | Schema/labeling/gate parity | ✓ |
| Runtime ingress expansion first | Broaden families before gates | |
| Live x402 first | Clear product-completion pressure early | |
| Hosted projections as lead | Hosted read models before CLI hardening | |

**User's choice:** Advisor-recommended Wave 1 → Wave 2; defer live proof and ingress expansion; hosted as parallel track only.
**Notes:** User: kernel solid, edge debt; preserve wedge-agnostic protocol.

---

## Boundary manifest enforcement

| Option | Description | Selected |
|--------|-------------|----------|
| Hand backfill + automated drift test | Manual posture rows; CI maps exports/CLI to manifest | ✓ |
| Hand-update only per PR | No automated gate | |
| Directory wildcards | Whole-tree sourceRoots | |
| Codegen/annotations manifest | Generated manifest | |

**User's choice:** Backfill six+ known gaps (D-05) + automated coverage test (D-06).

---

## Generated-code containment

| Option | Description | Selected |
|--------|-------------|----------|
| Stay blocked + narrow claims | Honest proof gap | ✓ |
| Codex-first live transcript | Clear gate when ready | ✓ (later, not Wave 1) |
| Expand ingress registry first | More families before transcript | |
| Drop containment gate | Probes only | |

**User's choice:** D-09 blocked through Phase 02; D-10 Codex path when explicitly scoped.

---

## Evidence theatre prevention

| Option | Description | Selected |
|--------|-------------|----------|
| Layered: schemas + labeling + arch gates | Machine-enforced separation | ✓ |
| Split files only | Reviewer ergonomics | (secondary) |
| Proof-packet-only external claims | Ship narrative guard | ✓ |
| Documentation only | Runbook | |

**User's choice:** D-13 layered stack; D-14 projector/script same-patch rule.

---

## Hosted admission next slice

| Option | Description | Selected |
|--------|-------------|----------|
| Redacted projections per audit_read | Evidence Read Boundary aligned | ✓ |
| Tighten raw-read audit + scope | Fail-closed without new authority | ✓ |
| Mandatory scope on all audit_read | Schema retrofit | (deferred D-18) |
| Freeze hosted HTTP | Claim hygiene only | (partial — no new authority routes) |
| Package-only | npm integrators | ✓ (ongoing, not HTTP fix) |

**User's choice:** D-16 + D-17 parallel; defer mandatory scope fields.

---

## A2A + live x402

| Option | Description | Selected |
|--------|-------------|----------|
| Register A2A in manifest now | Arch test coverage | ✓ |
| Keep live x402/product gates blocked | Phase 02 honest posture | ✓ |

**User's choice:** D-20, D-22; Phase 03 owns preview deploy (D-23).

---

## Claude's Discretion

- Manifest surface ID naming and CLI file groupings under operator/evidence/process.
- Order of first `audit_read` projection types.
- Projector file split boundaries.

## Deferred Ideas

- Live x402, host-wide containment, hosted operation, auth.md composite — Phase 03+.
- Runtime family expansion — only with full bundle in a future phase.
