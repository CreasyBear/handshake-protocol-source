# Agent Handoff

## Objective

Implement the architectural north-star correction: Handshake has one protocol
authority spine, and product vocabulary is projection/readback over that spine.
The goal is not another thin plan. It includes research, macro planning,
implementation, evaluation, sidecar review, full repo gates, and commits.

## Source Boundary

Canon lives in tracked repo docs/source/tests, not `.planning/`. The active
planning package for this run is
`.planning/macro-plan/runs/20260525T110908Z-architectural-north-star/` and is
evidence for this execution only. Prior macro-plan runs are historical context,
not current closeout proof.

## Runtime Profile

Primary runtime is Codex in a workspace-write checkout with restricted network.
Use `rg` for discovery and `apply_patch` for edits. Multi-host posture remains
evidence-only; do not claim native containment for Codex, Claude Code, Hermes,
OpenClaw, MCP, browser, A2A, OpenAPI, auth.md, or x402.

## Instruction Sources

- `AGENTS.md` for doctrine and invariants.
- `QUALITY.md` and `STRUCTURE.md` for repo boundaries.
- `src/*/LANE.md` for lane-local ownership.
- `.planning/macro-plan/*` for execution plan and gates.

## Context Bundle

The live problem is not whether `src/surfaces` can exist. It can. The problem is
whether product vocabulary is described as a peer truth lane. Correct model:
projection/readback surfaces and role-scoped transition clients both sit under
one protocol authority spine.

## Ignored Context

Do not use older macro-plan validation or prior green tests as current-run
closeout evidence. Do not use `.planning/` labels in repo-facing source or
package exports.

## Tool Contract

Allowed: read/patch docs, source, tests, planning artifacts; run focused and
full repo gates; use sidecars for bounded audit only. Forbidden: protected
mutations outside user-authorized commands, broad network claims without
primary sources, and any authority claim not backed by source.

## Protected-Action Boundary

Projection context stops before authority. Every protected action still requires
`CandidateAction / ActionContract -> PolicyDecision -> one-use Greenlight or
Refusal -> GatewayCheck -> Receipt / Refusal / ReplayRefusal / ProofGap /
AuthorityCertificate`.

## Read First

1. `AGENTS.md`
2. `README.md`
3. `QUALITY.md`
4. `STRUCTURE.md`
5. `docs/internal/decisions.md`
6. `docs/internal/protocol-notes.md`
7. `docs/internal/service-workflow-story.md`
8. `.planning/macro-plan/MACRO-PLAN.md`
9. `.planning/macro-plan/EXECUTION-SLICES.md`
10. `.planning/macro-plan/RUNTIME-GATES.md`
11. `.planning/macro-plan/PROTECTED-ACTION-GATES.md`
12. `.planning/macro-plan/TASKS.jsonl`

`.planning/` remains scratch. Do not turn planning labels into repo-facing
source or package surfaces.

## North-Star Model

```text
Projection/readback vocabulary
  Passport / Admission / Handle / Clearance / Outcome / Certificate
    over
One protected-action event spine
  CandidateAction / ActionContract
  -> PolicyDecision
  -> one-use Greenlight or Refusal
  -> GatewayCheck
  -> Receipt / Refusal / ReplayRefusal / ProofGap / AuthorityCertificate
```

## Active Implementation Scope

Allowed:

- patch canonical docs to replace dual-lane mental model with projection over
  one authority spine;
- add or update architecture tests for projection-only language;
- update `src/surfaces/LANE.md` to clarify that surfaces are implementation
  boundaries for projection/readback, not behavior owners;
- run focused gates and full repo gates;
- commit coherent checkpoints.

Forbidden:

- add protocol primitives for Passport, Admission, Handle, Outcome, Badge, or
  `ProtectedActionEvent`;
- widen root exports, CLI/MCP authority, SDK role powers, gateway adapters, or
  hosted claims;
- treat receipts, certificates, support bundles, review screens, passports, or
  workflow handles as future permission;
- claim hosted operation, provider custody, settlement/finality, marketplace
  certification, cross-org trust, aggregate spend enforcement, host containment,
  hosted org auth, or retention/search.

## Subagent Topology

At most five sidecars:

- architecture/case-study mechanisms;
- vocabulary/projection language;
- protected-action lifecycle mapping;
- runtime/protected-action gates;
- evidence/review/closeout.

Sidecars may write audit reports only. The chair owns final sequencing, status,
authority claims, and commits.

## Evaluation Path

```bash
/Users/joelchan/.codex/skills/gsd-macro-plan/scripts/validate_macro_plan_output.py .planning/macro-plan
npm run quality:claims
npm run quality:architecture
npm run test -- test/architecture/claim-boundary.test.ts test/architecture/workflow-admission-boundary.test.ts
npm run test -- test/runtime/runtime-ingress.test.ts test/product/service-workflow-admission.test.ts
npm run check:repo
git status --short --branch
```

## Stop Conditions

Stop if:

- product vocabulary becomes a peer authority lane;
- `ServiceWorkflowHandle` can satisfy policy, gateway, signer, mutation,
  receipt, or certificate requirements;
- a case-study analogy is used as proof of Handshake capability;
- Tier 3/hosted pressure expands the kernel/package surface;
- full repo gate fails and no explicitly justified narrowed closeout exists.

## Proof Gaps

- No live provider custody, x402 settlement/finality, facilitator operation, or
  seller middleware is proven.
- No hosted operation, hosted org auth, retention/search, marketplace trust, or
  cross-org trust is proven.
- No native host containment is proven.
- No finished UI product experience is proven by this architecture correction.

## Non-Claims

This handoff does not authorize Tier 3, hosted operation, provider custody,
settlement, marketplace trust, cross-org trust, aggregate spend enforcement,
host containment, or product UX completion.

## Current Next Step

Patch canonical docs and `test/architecture/claim-boundary.test.ts` so the repo
requires projection-over-spine language and forbids product/protocol peer-lane
truth claims.

## Next Agent Step

Implement NPLAN-002 and NPLAN-003 first: canonical projection vocabulary plus
`src/surfaces/service-workflow-lifecycle-projections.ts` and its architecture
test. Do not begin hosted/Tier 3 work.
