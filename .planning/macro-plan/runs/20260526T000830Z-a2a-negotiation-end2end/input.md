# A2A Negotiation End-to-End Macro Plan Input

Run: `20260526T000830Z-a2a-negotiation-end2end`
Source goal: `.planning/macro-plan/A2A_NEGOTIATION_META_META_GOAL.md`
Runtime posture: `multi`
Authority overlay: required
Planner posture: inline lens chain

## User Objective

Run the A2A Negotiation Meta-Meta Goal macro plan end to end:

```text
full planceo review
-> plan-eng review
-> plan-design review
-> plan-devex review
-> plan-agent review
-> execution plan
-> review/audit
-> evaluation
-> commit
```

## Target Macro Move

Plan agent-to-agent negotiated protected-action events in Handshake.

The move is not generic negotiation. It is the smallest protocol/product layer
where two agents can negotiate an obligation, but accepted terms create no
authority until the obligation binds to a fresh protected-action contract and
clears the normal gateway-enforced lifecycle.

## First Fixture

```text
buyer-agent / seller-agent negotiation over one buyer-side x402_payment.exact
protected action
```

## Required Invariant

Agent-to-agent agreement is not authority.

Each consequential negotiated obligation must still clear through:

```text
CandidateAction
-> exact ActionContract
-> PolicyDecision / one-use Greenlight or Refusal
-> GatewayCheck before consequence
-> Receipt / Refusal / ReplayRefusal / ProofGap / Isolation
```

## Source Boundary

Canonical source anchors are listed in `source-snapshot.md`.

This run may use memory and prior strategy only as context. Claims must be
grounded in current source files and the local planning artifact.

## Review Lenses

- CEO: market/opening verdict and scope discipline.
- Engineering: protocol architecture, state transitions, policy hook, tests.
- Design: readback workflow and agreement-vs-authority legibility.
- DevEx: first proof path and builder ergonomics.
- Agent: multi-agent runtime suitability and protected-action posture.

## Promotion Rule

This run can become `READY_FOR_PHASE_PLANNING` if it creates architecture,
execution slices, evals, review/audit gates, tasks, and a fresh-agent handoff.

It must not claim `READY_FOR_AGENT_EXECUTION` unless implementation-ready phase
plans, source edits, tests, and independent verification are present.
