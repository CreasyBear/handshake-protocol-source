# Macro Plan Package

Run: `20260525T110908Z-architectural-north-star`
Status: `READY_FOR_AGENT_EXECUTION`

## Invariant

Product vocabulary is projection/readback over one protected-action authority
spine. It is not a second lane of truth.

## Package

- `MACRO-PLAN.md` - chair-owned north-star plan and status.
- `EXECUTION-SLICES.md` - ordered implementation and verification slices.
- `TASKS.jsonl` - assignable next mechanisms.
- `AGENT-HANDOFF.md` - fresh-agent context.
- `RUNTIME-GATES.md` - generated-agent and host-runtime checks.
- `PROTECTED-ACTION-GATES.md` - authority, gateway, signer, and evidence gates.
- `EVIDENCE-PLAN.md` - proof collection and command matrix.
- `REVIEW-GATES.md` - sidecar and closeout review rules.
- `RISKS.md` - P0/P1 risks and proof gaps.
- `DECISIONS.md` - run decisions.

## Current Run Evidence

- `runs/20260525T110908Z-architectural-north-star/input.md`
- `runs/20260525T110908Z-architectural-north-star/research.md`
- `runs/20260525T110908Z-architectural-north-star/source-snapshot.md`
- `runs/20260525T110908Z-architectural-north-star/blocked-checks.md`
- `runs/20260525T110908Z-architectural-north-star/audits/*`
- `runs/20260525T110908Z-architectural-north-star/validation.md`

## Smallest Next Mechanism

Install canonical projection-over-spine language and a claim-boundary guard that
fails if product/protocol peer-lane language returns.
