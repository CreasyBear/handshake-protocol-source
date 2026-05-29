# Execution Slices

## Inputs

- `.planning/macro-map/*`
- `.planning/macro-plan/runs/20260525T110908Z-architectural-north-star/*`
- canonical docs under repo root and `docs/internal/`
- `src/protocol`, `src/surfaces`, `src/runtime`, `src/sdk`, `src/cli`, `src/mcp`
- architecture, runtime, and product tests

## Outputs

- revised macro-plan package;
- canonical docs and source-owned projection map;
- architecture/runtime/product tests;
- validation, code-review, and git-checkpoint evidence.

## Dependencies

- N1 depends on N0 macro-plan reset.
- N2 depends on canonical projection vocabulary.
- N3 depends on projection map and canonical vocabulary.
- N4 depends on projection vocabulary guards.
- N5 depends on all implementation and focused gates.

## Verification Commands Or Checks

```bash
/Users/joelchan/.codex/skills/gsd-macro-plan/scripts/validate_macro_plan_output.py .planning/macro-plan
npm run quality:claims
npm run quality:architecture
npm run test -- test/architecture/claim-boundary.test.ts test/architecture/workflow-admission-boundary.test.ts
npm run test -- test/runtime/runtime-ingress.test.ts test/runtime/auth-md-candidate-compilation.test.ts test/product/service-workflow-admission.test.ts
npm run check:repo
```

## Rollback Or Abandonment Criteria

- Roll back docs wording if claim-boundary tests show it weakens authority
  boundaries.
- Abandon projection-map implementation if it requires a stored protocol object;
  return to protocol design first.
- Abandon runtime closeout if mixed-family or x402/auth.md tests reveal
  composite authority that cannot be fixed in scope.
- Do not close the goal if full repo gate fails without an explicit user-owned
  narrowed closeout.

## Agent Handoff Needs

Fresh agents must read `AGENT-HANDOFF.md`, `RUNTIME-GATES.md`,
`PROTECTED-ACTION-GATES.md`, sidecar audit reports, and `TASKS.jsonl` before
editing. They must preserve dirty user state and avoid treating `.planning/`
as repo-facing canon.

## Slice N0-00 - Research And Macro-Plan Reset

### ID

N0-00

### Invariant Or Risk

A plan can launder a weak analogy into product architecture. Research must
become mechanism rules, not borrowed authority.

### Objective

Record primary-source case-study research, reset the macro-plan package around
projection-over-one-spine, and preserve proof gaps.

### Source Evidence

- `.planning/macro-map/MACRO-HANDOFF.md`
- `.planning/macro-plan/runs/20260525T110908Z-architectural-north-star/research.md`
- `README.md`
- `STRUCTURE.md`
- `docs/internal/decisions.md`
- `src/surfaces/LANE.md`

### Outputs

- `runs/20260525T110908Z-architectural-north-star/input.md`
- `runs/20260525T110908Z-architectural-north-star/research.md`
- revised `.planning/macro-plan/*`

### Stop Conditions

- Any case study is used to claim Handshake has enforcement not proven in source.
- The plan preserves "product lane vs protocol lane" as a positive target.

### Proof Gates

- Macro-plan validator passes.
- Sidecar audits exist or missing sidecars are recorded.

### Verification

```bash
/Users/joelchan/.codex/skills/gsd-macro-plan/scripts/validate_macro_plan_output.py .planning/macro-plan
```

## Slice N1-01 - Canonical Projection Language

### ID

N1-01

### Invariant Or Risk

Canonical docs currently use `product surface` and `protocol kernel` language
that is valid structurally but can be read as peer lanes of truth.

### Objective

Patch canonical docs to say product vocabulary is projection/readback over the
single protected-action event spine.

### Candidate Paths

- `README.md`
- `STRUCTURE.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-notes.md`
- `docs/internal/protocol-layman.md`
- `docs/internal/service-workflow-story.md`
- `src/surfaces/LANE.md`

### Stop Conditions

- Docs imply product vocabulary can create or reinterpret authority.
- Docs imply service workflow admission is policy/gateway admission.
- Docs imply certificate, receipt, outcome, or support bundle grants future
  authority.

### Proof Gates

- Canon states exactly one authority spine.
- Canon states projection/readback surfaces are implementation boundaries only.
- Canon preserves public npm/MCP/hosted proof gaps.

### Verification

```bash
npm run quality:claims
npm run format:check
```

## Slice N2-01 - ProtectedActionEvent Projection Map

### ID

N2-01

### Invariant Or Risk

Friendly nouns will drift unless they map to one source-owned lifecycle.

### Objective

Define `ProtectedActionEvent` as a documentation/testing lifecycle concept and
source-own the product projection vocabulary through a `src/surfaces` lifecycle
projection map. Map each product noun to lifecycle evidence without adding a
stored protocol object.

### Candidate Paths

- `docs/internal/protocol-notes.md`
- `docs/internal/service-workflow-story.md`
- `docs/internal/decisions.md`
- `src/surfaces/service-workflow-lifecycle-projections.ts`
- `src/surfaces/index.ts`
- `test/architecture/claim-boundary.test.ts`
- `test/architecture/service-workflow-lifecycle-projection.test.ts`

### Stop Conditions

- Implementation adds a new protocol primitive without a separate transition
  proposal.
- `ProtectedActionEvent` becomes a package export, store record, or gateway
  input in this slice.

### Proof Gates

- Projection map names source authority stage for each noun.
- Projection map names forbidden authority interpretation for each noun.
- Tests require the mapping in canonical docs.
- Tests validate lifecycle keys against `actionAttemptLifecycleEntry()`.

### Verification

```bash
npm run test -- test/architecture/claim-boundary.test.ts
```

## Slice N3-01 - Dual-Lane Drift Guards

### ID

N3-01

### Invariant Or Risk

The phrase "product surface" can silently expand into a second lane of truth.

### Objective

Add claim-boundary tests that forbid product/protocol peer-lane language and
require projection-over-spine language.

### Candidate Paths

- `test/architecture/claim-boundary.test.ts`
- `test/architecture/workflow-admission-boundary.test.ts`

### Stop Conditions

- The tests are prose-only while source can still imply authority.
- The tests forbid legitimate implementation folder names such as
  `src/surfaces` instead of forbidding peer truth claims.

### Proof Gates

- Tests require `projection/readback` language.
- Tests forbid "product lane", "protocol lane", "separate product truth", and
  product vocabulary as authority.
- Existing workflow admission non-authority tests still pass.

### Verification

```bash
npm run test -- test/architecture/claim-boundary.test.ts test/architecture/workflow-admission-boundary.test.ts
npm run quality:architecture
```

## Slice N4-01 - Runtime And Protected-Action Regression

### ID

N4-01

### Invariant Or Risk

Generated agents will treat simpler vocabulary as permission unless runtime and
protected-action gates stay fresh.

### Objective

Confirm or add regressions proving service workflow context only prepares
proposal context; each protected action still requires fresh exact clearance.
Add the sidecar-identified P0 gates for mixed-family same-envelope runtime
evidence and x402/auth.md non-composition.

### Candidate Paths

- `test/runtime/runtime-ingress.test.ts`
- `test/runtime/auth-md-candidate-compilation.test.ts`
- `test/product/service-workflow-admission.test.ts`
- `examples/service-workflow-admission/`
- `.planning/macro-plan/RUNTIME-GATES.md`
- `.planning/macro-plan/PROTECTED-ACTION-GATES.md`

### Stop Conditions

- A handle can be reused for loops/retries without a fresh action contract.
- Mixed-family runtime dispatch evidence can combine mismatched tenant,
  organization, principal, agent, run, runtime adapter, operating envelope,
  gateway registry, or authority-holder context into one runtime spine.
- x402/auth.md generated composition creates a composite authority artifact.
- x402/auth.md fixture output suggests composite authority.
- Payment/signature/credential material leaks into admission or handle records.

### Proof Gates

- Existing misuse tests pass.
- Mixed-family dispatch families must share one generated execution envelope or
  refuse before runtime evidence is projected as one spine.
- x402 and auth.md composition must become separate candidates or refusal, never
  a single composite authority contract.
- Any new projection fields have explicit non-authority semantics.

### Verification

```bash
npm run test -- test/runtime/runtime-ingress.test.ts test/product/service-workflow-admission.test.ts
```

## Slice N5-01 - Review, Evaluation, And Commit Closeout

### ID

N5-01

### Invariant Or Risk

The branch can look clean while preserving a weak conceptual split. Review must
verify the goal, not just tests.

### Objective

Run sidecar review, macro validation, focused gates, full repo gate, record
evidence/proof gaps, and commit coherent checkpoints.

### Candidate Paths

- `.planning/macro-plan/runs/20260525T110908Z-architectural-north-star/validation.md`
- `.planning/macro-plan/REVIEW-GATES.md`
- `.planning/macro-plan/EVIDENCE-PLAN.md`
- git commit history

### Stop Conditions

- Sidecars identify a P0/P1 that cannot be resolved or recorded as a proof gap.
- `npm run check:repo` fails and no narrowed equivalent is justified.
- Working tree contains unrelated or unstaged goal changes at closeout.

### Proof Gates

- `npm run check:repo` passes.
- Macro-plan validator passes.
- Sidecar findings are resolved or recorded.
- Git status is clean after final commit.

### Verification

```bash
npm run check:repo
git status --short --branch
```
