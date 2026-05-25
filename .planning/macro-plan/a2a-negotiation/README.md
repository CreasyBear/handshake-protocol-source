# A2A Negotiation Macro Plan Package

Run: `20260526T000830Z-a2a-negotiation-end2end`
Status: `READY_FOR_PHASE_PLANNING`

## Scope

This package plans the architecture, implementation slices, evaluation suite,
and review/audit gates for agent-to-agent negotiated protected-action events in
Handshake.

It is derived from:

- `.planning/macro-plan/A2A_NEGOTIATION_META_META_GOAL.md`
- `runs/20260526T000830Z-a2a-negotiation-end2end/input.md`
- current source anchors listed in the run `source-snapshot.md`
- inline CEO, engineering, design, DevEx, and agent reviews

## Macro Move

Add a non-authority negotiation layer where agents can record offers,
decisions, linked agreements, and obligation bindings, while every
consequential obligation still clears through the normal protected-action
lifecycle.

## Artifact Index

- `MACRO-PLAN.md`: chair-owned plan, decisions, status, and proof boundaries.
- `ARCHITECTURE.md`: protocol/object/event/policy/readback architecture.
- `EXECUTION-SLICES.md`: ordered implementation slices and proof gates.
- `EVALUATION.md`: failing/passing eval suite and command targets.
- `REVIEW-AUDIT.md`: review, audit, claim, and promotion gates.
- `AGENT-HANDOFF.md`: fresh-agent execution context for detailed phase planning.
- `TASKS.jsonl`: assignable next mechanisms.
- `runs/20260526T000830Z-a2a-negotiation-end2end/`: source snapshot, raw lens
  reviews, normalized findings, chair synthesis, validation.

## Status Meaning

`READY_FOR_PHASE_PLANNING` means a detailed `A2A-001` phase plan can be written.
It does not mean protocol code is implemented, tested, exported, or launchable.

This package is not `READY_FOR_AGENT_EXECUTION` because no source implementation
or detailed phase plan has been verified yet.
