# Decisions

## NPLAN-D001 - One Authority Spine

- Status: accepted
- Decision: Handshake architecture is one protocol authority spine with
  projection/readback vocabulary over it.
- Rationale: Product/protocol peer lanes create ambiguity about where authority
  lives.
- Source: user correction; `.planning/macro-plan/runs/20260525T110908Z-architectural-north-star/input.md`
- Revisit trigger: only if a future source-owned transition changes the
  authority spine.

## NPLAN-D002 - Surfaces Are Implementation Boundaries

- Status: accepted
- Decision: Keep `src/surfaces` and "surface" as implementation vocabulary, but
  canonical docs must say surfaces expose projection/readback only and are not a
  product truth lane.
- Rationale: Removing the folder would cause churn; correcting its meaning
  addresses the real architectural risk.
- Source: `STRUCTURE.md`, `src/surfaces/LANE.md`, `test/architecture/surface-boundary-posture.test.ts`
- Revisit trigger: if package extraction needs a public projection subpath.

## NPLAN-D002A - Projection Surfaces Versus Transition Clients

- Status: accepted
- Decision: Canonical vocabulary must distinguish product projection/readback
  surfaces from role-scoped protocol transition clients.
- Rationale: Some SDK/HTTP clients transport authority-bearing protocol
  transitions, while product projection surfaces must remain non-authority. One
  umbrella term hides that difference.
- Source: `runs/20260525T110908Z-architectural-north-star/audits/product-vocabulary-projection-audit.md`
- Revisit trigger: if the SDK/client taxonomy changes.

## NPLAN-D003 - ProtectedActionEvent As Lifecycle Projection Concept

- Status: accepted
- Decision: Use `ProtectedActionEvent` as a documentation/testing lifecycle
  concept in this run, source-owned through a `src/surfaces` projection map, not
  as a stored protocol object.
- Rationale: The current protocol already has navigation/lifecycle matrices; a
  new primitive would risk duplicating authority state.
- Source: `src/protocol/navigation`, `src/protocol/areas/action-attempt-lifecycle`, `docs/internal/protocol-notes.md`
- Revisit trigger: if source proves the existing lifecycle cannot express a
  required terminal event projection.

## NPLAN-D003A - Runtime Composition Gaps Are Blocking

- Status: accepted
- Decision: Mixed-family same-envelope and x402/auth.md non-composition gates
  are P0 for closeout.
- Rationale: Projection-over-spine fails if one generated block can blur
  multiple authority contexts into a single runtime spine or composite
  credential/payment artifact.
- Source: `runs/20260525T110908Z-architectural-north-star/audits/runtime-protected-action-gates-audit.md`
- Revisit trigger: after focused runtime tests prove the gate.

## NPLAN-D003B - Authority Surface Naming Must Be Replaced

- Status: accepted
- Decision: `sdk.policy` and similar clients should be described as
  role-scoped protocol transition clients, not authority surfaces.
- Rationale: The kernel/policy transition owns authority. SDK clients transport
  a role-scoped call into that transition.
- Source: `runs/20260525T110908Z-architectural-north-star/audits/architecture-case-study-audit.md`
- Revisit trigger: if a future client truly owns an enforceable authority
  transition outside the kernel, which should be treated as a new protocol
  design.

## NPLAN-D004 - Case Studies Become Mechanism Rules

- Status: accepted
- Decision: Stripe, Kubernetes/OPA, Vault, GitHub, AWS IAM, SLSA/Sigstore,
  Vercel, and Cloudflare are used as mechanism references only.
- Rationale: Borrowed analogy can overclaim enforcement. Mechanism rules can be
  tested.
- Source: `.planning/macro-plan/runs/20260525T110908Z-architectural-north-star/research.md`
- Revisit trigger: if a later implementation imports a concrete standard or
  certification.

## NPLAN-D005 - Badge Remains Unsafe Shorthand

- Status: accepted
- Decision: Badge remains forbidden as schema/protocol/export/route authority
  vocabulary. If used in UI later, it must mean a read-only state label derived
  from evidence.
- Rationale: Badge reads as bearer authority under generated-agent behavior.
- Source: `.planning/macro-map/DECISIONS.md`, `docs/internal/service-workflow-story.md`, `src/mcp/LANE.md`
- Revisit trigger: if a UI-only state-label component is designed with explicit
  non-authority copy and tests.
