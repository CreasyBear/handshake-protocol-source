# Code Review

## Invariant At Stake

Product vocabulary must remain projection/readback over the single protocol
authority spine. Passport, Admission, Handle, Clearance, Outcome, Certificate,
and badge-like language must not become identity, permission, reusable auth,
receipt substitutes, or gateway shortcuts.

## Reviewed Diff

- Canonical docs: `README.md`, `STRUCTURE.md`,
  `docs/internal/decisions.md`, `docs/internal/protocol-notes.md`,
  `docs/internal/service-workflow-story.md`, `src/surfaces/LANE.md`.
- Source: `src/surfaces/service-workflow-lifecycle-projections/index.ts`,
  `src/surfaces/boundary-manifest.ts`, `src/runtime/ingress/index.ts`,
  `src/surfaces/index.ts`.
- Tests: `test/architecture/service-workflow-lifecycle-projection.test.ts`,
  `test/architecture/claim-boundary.test.ts`,
  `test/architecture/surface-boundary-posture.test.ts`,
  `test/runtime/runtime-ingress.test.ts`.

## Findings

No blocking review findings remain.

Resolved sidecar findings:

- Product/protocol dual-lane language is replaced with
  projection/readback-over-spine language in canonical docs.
- `sdk.policy` is no longer named `policy_authority`; it is now
  `policy_transition_transport`, a role-scoped transition client posture.
- Service workflow product nouns are source-owned in a projection map instead
  of a new protocol primitive.
- Passport/admission/handle IDs are explicit non-authority correlation and
  reconstruction fields.
- Badge is forbidden as a service workflow authority noun.
- Mixed-family runtime ingress now fails before runtime evidence when configs
  do not share tenant, org, principal, agent, run, runtime adapter, operating
  envelope, and gateway registry.
- x402 plus auth.md composition with separate envelopes refuses before runtime
  evidence or action contracts, preserving separate exact contracts or refusal.

## Residual Risks

- This is not a UI completion slice.
- Hosted/Tier 3 remains blocked.
- Live provider custody, settlement, marketplace trust, retention/search, and
  native host containment remain proof gaps.
- `authorityPosture` remains an existing field name in some product acceptance
  matrices; this review only removed the unsafe positive `policy_authority`
  posture from the surface boundary manifest.
