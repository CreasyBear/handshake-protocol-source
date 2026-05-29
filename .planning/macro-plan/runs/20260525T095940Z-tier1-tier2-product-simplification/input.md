# Tier 1 / Tier 2 Product Simplification Macro-Plan Input

## Invariant At Stake

Product simplification may hide protocol complexity from users, but it must not hide or weaken authority, gateway, evidence, refusal, proof-gap, isolation, or reconstruction boundaries.

Passport, Admission, Badge, Handle, Certificate, review surfaces, and user-facing IDs are evidence and correlation surfaces only unless a source-owned protocol transition proves otherwise.

## User Objective

Boil the lake. Produce a full, execution-ready Tier 1 and Tier 2 Handshake product-simplification macro plan before Tier 3 progression, grounded in `.planning/codebase`, `.planning/macro-map`, and canonical repo docs. Use `gsd-macro-plan` with sidecar reviews, define 10-star success criteria, long-running end conditions, anti-patterns, proof gates, assignable tasks, validation, git checkpoints, and then move into implementation.

## Ten-Star Success Criteria

- Users see a simple product flow, not protocol internals.
- The product never implies that a passport, certificate, review screen, or ID is authority.
- Tier 1 and Tier 2 each have crisp product surfaces, not internal architecture exposed as UX.
- Every surfaced object has explicit `createsAuthority: false` unless it is truly an enforceable gateway-bound authority artifact.
- Passport references are split cleanly: `passportPackageDigest`, `passportPresentationId`, `admissionId`, `serviceWorkflowHandleId`, `serviceWorkflowHandleDigest`.
- Every simplification preserves reconstructable evidence.
- Every action path still has a protected-action boundary and gateway enforcement posture.
- Docs, demos, SDK, CLI, MCP surfaces, and examples converge on the same simplified product model.
- The plan contains full execution slices, not advice.
- Tier 3 is blocked until Tier 1 and Tier 2 product simplification have proof gates satisfied or explicit proof gaps recorded.

## Long-Running End Conditions

The exercise ends only when the macro plan can hand a fresh agent the full Tier 1/Tier 2 simplification program with enough context to execute without chat memory, including source evidence, slices, gates, risks, task records, and validation output.

Implementation begins only after the full macro-plan package is validated and sidecar findings are reconciled.

## Anti-Patterns To Avoid

- "Simple" meaning basic, toy, or under-modeled.
- Hiding authority boundaries behind friendly language.
- Treating passport/admission/workflow IDs as trust, identity, permission, or reusable auth.
- Letting UX summaries drift from exact contracts.
- Turning `.planning/` scratch into repo-facing canon.
- Broadening into Tier 3 before Tier 1/Tier 2 surfaces are sharp.
- Producing a minimal slice and calling it the plan.
- Claiming gateway enforcement where the source only proves advisory posture.
- Letting product polish outrun receipt, refusal, proof-gap, and isolation mechanics.

## Chair Interpretation

The prior macro-map handoff is `NEEDS_USER_DECISION`, not `READY_FOR_MACRO_PLAN`. The user decision to proceed is now explicit, but it does not erase the map blockers. This run must preserve those blockers as proof gates while broadening the plan from the smallest surface slice into the full Tier 1 / Tier 2 simplification program.

## Required Source Boundary

- `.planning/macro-map/MACRO-HANDOFF.md`
- `.planning/macro-map/MACRO-MAP.md`
- `.planning/macro-map/FACET-MAP.md`
- `.planning/macro-map/MECHANISM-MAP.md`
- `.planning/macro-map/EXECUTION-MAP.md`
- `.planning/macro-map/EXPERIENCE-MAP.md`
- `.planning/macro-map/AGENT-RUNTIME-MAP.md`
- `.planning/macro-map/PROTECTED-ACTION-MAP.md`
- `.planning/macro-map/CONCERNS.md`
- `.planning/macro-map/DECISIONS.md`
- `.planning/macro-map/TASKS.jsonl`
- `.planning/macro-map/views/*.md`
- `.planning/codebase/*.md`
- `README.md`
- `QUALITY.md`
- `STRUCTURE.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-notes.md`
- `docs/internal/protocol-definition.md`
- `docs/internal/protocol-kernel-architecture.md`
- `docs/internal/protocol-layman.md`

## Non-Authority ID Model To Preserve

The plan must define the following as correlation/reconstruction fields only:

- `passportPackageDigest`: content-addressed digest of the presented evidence bundle.
- `passportPresentationId`: unique per service intake / presentation event.
- `admissionId`: service-side result after checking the passport.
- `serviceWorkflowHandleId`: carried workflow reference for context.
- `serviceWorkflowHandleDigest`: digest of the carried workflow reference.

All five fields must have `createsAuthority: false`; none may prove identity, trust, spend approval, gateway acceptance, signer permission, mutation permission, receipt export, terminal certification, or reusable auth.

## Initial Plan Status

`READY_FOR_FULL_MACRO_PLAN_WITH_RECONCILED_BLOCKERS`

This is not `READY_FOR_AGENT_EXECUTION` until the plan package, sidecar review, and validator pass.
