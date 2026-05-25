# Decisions

## DEC-001

- ID: DEC-001
- Status: Accepted
- Decision: Proceed from the decision-gated macro map into a full Tier 1/Tier 2 macro plan.
- Rationale: The user explicitly authorized the full plan and implementation sequence after reviewing the goal.
- Source: User instruction and `.planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification/input.md`.
- Revisit Trigger: If sidecar review finds an authority violation that cannot be converted into a concrete gate.

## DEC-002

- ID: DEC-002
- Status: Accepted
- Decision: Keep Passport as a docs/story input noun only.
- Rationale: Passport helps users understand presented standing evidence but is too authority-shaped for protocol or API authority.
- Source: `.planning/macro-map/MACRO-MAP.md`, `views/DESIGN.md`, `views/AUTHORITY.md`.
- Revisit Trigger: If user comprehension evidence shows Passport consistently implies identity or permission even with cut lines.

## DEC-003

- ID: DEC-003
- Status: Accepted
- Decision: Use `ServiceWorkflowAdmission` as the source/API surface output.
- Rationale: It is narrower than standalone Admission and makes the service-side mapping explicit.
- Source: `.planning/macro-map/MECHANISM-MAP.md`, `views/ENG.md`, `.planning/codebase/CONCERNS.md`.
- Revisit Trigger: If implementation reveals a clearer non-authority noun with stronger tests.

## DEC-004

- ID: DEC-004
- Status: Accepted
- Decision: Use `ServiceWorkflowHandle` as the carried workflow context object.
- Rationale: It is less authority-loaded than Badge and can carry context/digest refs with explicit false authority flags.
- Source: `views/DESIGN.md`, `views/DEVEX.md`, `views/AGENT.md`, `views/RUNTIME.md`.
- Revisit Trigger: If developers still treat handle as reusable permission in tests or review.

## DEC-005

- ID: DEC-005
- Status: Accepted
- Decision: Keep Badge as optional narrative shorthand only.
- Rationale: Badge is memorable but reads like bearer auth. It must not become schema, route, export, or protocol object.
- Source: `.planning/macro-map/FACET-MAP.md`, `views/CEO.md`, `views/DESIGN.md`.
- Revisit Trigger: If product copy requires removing Badge entirely to preserve the boundary.

## DEC-006

- ID: DEC-006
- Status: Accepted
- Decision: Split passport/admission/workflow IDs into five non-authority refs.
- Rationale: Correlation and reconstruction need stable refs, but no ref may create authority.
- Source: User-provided invariant and current macro-plan input.
- Revisit Trigger: If source implementation requires additional digests for canonicalization or redaction.

## DEC-007

- ID: DEC-007
- Status: Accepted
- Decision: First implementation home is docs plus `src/surfaces`, not `src/protocol/areas`.
- Rationale: No new enforceable transition exists; current protocol primitives already represent evidence, attempt bounds, exact contracts, policy, gateway, and readback.
- Source: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`, `STRUCTURE.md`.
- Revisit Trigger: Only if a future source design identifies a distinct terminal or state-transition event.

## DEC-008

- ID: DEC-008
- Status: Accepted
- Decision: Tier 2 examples and runtime convergence wait for Tier 1 schema and boundary tests.
- Rationale: Demo-first would overclaim the product story before authority boundaries are source-enforced.
- Source: `.planning/macro-map/EXECUTION-MAP.md`, `.planning/macro-map/PROTECTED-ACTION-MAP.md`.
- Revisit Trigger: If a non-source prototype is requested separately and clearly marked throwaway.

## DEC-009

- ID: DEC-009
- Status: Accepted
- Decision: Tier 3 remains blocked until Tier 1/Tier 2 proof gates pass or proof gaps are explicit.
- Rationale: Hosted operation must consume proven local/source-owned surfaces, not expand the kernel or package surface prematurely.
- Source: `docs/internal/decisions.md`, macro-plan objective, prior Tier 3 boundary guidance.
- Revisit Trigger: If the user starts a separate hosted workspace with explicit Tier 3 scope.

## DEC-010

- ID: DEC-010
- Status: Rejected
- Decision: Do not make Passport a protocol primitive.
- Rationale: It would duplicate evidence and authority-adjacent records without adding a gateway-enforced transition.
- Source: `.planning/codebase/CONCERNS.md`, `.planning/macro-map/MECHANISM-MAP.md`.
- Revisit Trigger: A future protocol decision proves a distinct enforceable state.

## DEC-011

- ID: DEC-011
- Status: Rejected
- Decision: Do not sell passport validation as the bought authority unit.
- Rationale: The economic unit remains protected-event terminalization and reconstructable evidence.
- Source: `views/CEO.md`, `docs/internal/decisions.md`.
- Revisit Trigger: Paid pilot evidence proves a separate validation product without weakening authority claims.

## DEC-012

- ID: DEC-012
- Status: Deferred
- Decision: Defer live x402/auth.md composite service gateway demo.
- Rationale: The surface and non-authority tests must land before composite external rails.
- Source: `.planning/macro-map/PROTECTED-ACTION-MAP.md`, `.planning/codebase/INTEGRATIONS.md`.
- Revisit Trigger: T2-04 starts after Tier 1 and early Tier 2 gates pass.
