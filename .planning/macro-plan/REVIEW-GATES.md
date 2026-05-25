# Review Gates

## Invariant At Stake

The chair owns final authority claims. Sidecars can pressure-test, but they
cannot promote a plan to ready or declare implementation complete.

## Gate Summary

The review system must reject three failure classes:

- architectural drift back into dual product/protocol authority lanes;
- product vocabulary that becomes identity, permission, reusable auth, receipt
  substitute, or gateway shortcut;
- evidence that proves planning effort but not source-owned mechanism.

The plan can be promoted only when every gate below either passes with current
evidence or records a named proof gap that does not undermine the next slice.

## Sidecar Review

At most five sidecars:

| Report | Scope |
| --- | --- |
| `architecture-case-study-audit.md` | Mechanism quality and case-study misuse |
| `product-vocabulary-projection-audit.md` | Product vocabulary and dual-lane language |
| `protected-action-lifecycle-audit.md` | Lifecycle/projection mapping |
| `runtime-protected-action-gates-audit.md` | Runtime misuse and protected-action gates |
| `evidence-review-gates-audit.md` | Evidence, validation, review, and commit closeout |

The chair has accepted the sidecar reports as pressure inputs, not authority.
Resolved findings must appear in docs/source/tests. Unresolved findings remain
explicit proof gaps in `RISKS.md`, `blocked-checks.md`, or validation closeout.

## CEO Gate

Question: does this make the product smaller, harder, sharper, and easier to
adopt without broadening the wedge?

Pass condition: the correction makes Handshake legible as protected-action
infrastructure for one cleared event lifecycle. It must not sell dashboards,
identity, agent trust, hosted clearing, marketplace certification, generic
observability, or approval theatre as the product.

## Engineering Gate

Question: can the mechanism be enforced and tested from source?

Pass condition: there is one protocol authority spine, source-owned projection
mapping, focused tests for non-authority product nouns, and no widened package
exports, protocol primitives, gateway adapters, CLI/MCP authority, or hosted
claims. Any `sdk.policy`-like role client must be named as transition transport
under custody, not as a product authority surface.

## Design Gate

Question: does simplification hide protocol complexity without lying about
authority?

Pass condition: Passport, Admission, Handle, Clearance, Outcome, and
Certificate can make the workflow understandable while their copy and schemas
explicitly say they do not create authority. Badge-like language is cut unless
it is a read-only state label derived from evidence.

## DevEx Gate

Question: can a builder integrate the narrow wedge without learning the entire
protocol internals?

Pass condition: docs and demos teach proposal, evidence, readback, refusal, and
proof gap as product-facing concepts, while directing protected mutation through
the existing kernel/gateway state machine. No setup path asks a developer to
invent authority semantics.

## Agent Gate

Question: can a fresh agent resume without chat memory and without turning
planning into canon?

Pass condition: `AGENT-HANDOFF.md`, `TASKS.jsonl`, and run-local evidence are
sufficient to start the next mechanism. `.planning/` remains derived evidence;
repo-facing truth lands only in canon docs, source, tests, and examples.

## Runtime Gate

Question: does generated execution remain bounded under loops, retries,
branches, sibling calls, stale handles, and dynamic tool pressure?

Pass condition: runtime/protected-action tests prove same-envelope composition
or refusal, x402/auth.md non-composition, replay refusal, stale context
refusal, and proof-gap readback. Runtime handles may carry proposal context but
cannot authorize mutation.

## Protected-Action Gate

Question: is there still exactly one enforceable authority boundary?

Pass condition: every consequential action reaches a fresh exact contract,
policy decision, one-use greenlight/refusal, gateway check, and terminal
receipt/refusal/proof gap/certificate posture. No product noun can skip,
cache, reuse, or summarize that boundary into authority.

## Chair Review Checklist

- Does the plan preserve one authority spine?
- Are product nouns projections/readbacks only?
- Do docs avoid product/protocol peer-lane claims?
- Do tests fail if peer-lane language returns?
- Does any source change widen package exports, protocol primitives, CLI/MCP
  authority, SDK role powers, gateway adapters, or hosted claims?
- Are official case studies translated into mechanisms with URLs?
- Are residual proof gaps explicit?

## Code Review Gate

Before final closeout, inspect the diff for:

- overbroad docs rewrites;
- repo-facing planning labels;
- new authority-shaped nouns;
- accidental package export churn;
- claim-boundary tests that merely bless prose without guarding source risk.

## Promotion Rule

`READY_FOR_AGENT_EXECUTION` means a bounded agent can execute the next slice. It
does not mean hosted/Tier 3 can start and does not mean the architecture is
complete until implementation and full gates pass.
