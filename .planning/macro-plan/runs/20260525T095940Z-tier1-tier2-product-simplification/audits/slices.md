## Audit Scope

Verdict: fail closed for implementation until the macro plan contains a full long-running Tier 1/Tier 2 program, not a widened version of the earlier minimal slice.

Focus: execution slices and full-program sequencing for Tier 1/Tier 2 product simplification before Tier 3 progression. This audit does not select the macro move, does not synthesize the final plan, and does not promote final status. It pressure-tests what the future chair-owned macro plan must contain before implementation begins.

The user has explicitly rejected a minimal slice and asked to boil the lake before Tier 3. That changes the required planning breadth, but it does not erase the source blockers: non-authority product nouns, generated-agent handle misuse, host-profile overclaiming, naming drift, external rail proof gaps, and validation absence remain blocking gates.

## Source Boundary

Authoritative source boundary:

- Canonical repo truth: `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/decisions.md`, `docs/internal/protocol-notes.md`.
- Macro-plan contract truth: `gsd-macro-plan/SKILL.md`, `macro-plan-contract.md`, `output-quality-bar.md`.
- Current run truth: `.planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification/input.md`, `source-snapshot.md`, `blocked-checks.md`.
- Derived planning evidence: `.planning/macro-map/*` and `.planning/codebase/*` files read below. These can guide planning, but tracked source, canonical docs, and tests win if facts disagree.
- Memory context was used only to avoid repeating prior drift mistakes: Tier 3 stays outside the kernel package, x402 remains narrow local/reference buyer-side proof, and prior green tests cannot be trusted after worktree drift.

Boundary caveat: the input requires the future macro plan to read a larger source boundary than this sidecar was asked to read, including `FACET-MAP.md`, `EXPERIENCE-MAP.md`, `AGENT-RUNTIME-MAP.md`, `PROTECTED-ACTION-MAP.md`, `DECISIONS.md`, `TASKS.jsonl`, `views/*.md`, strategic run files, and protocol definition/architecture/layman docs. A future plan that does not reconcile that full boundary is not implementation-ready.

## Files Read

- `/Users/joelchan/.codex/skills/gsd-macro-plan/SKILL.md`
- `/Users/joelchan/.codex/skills/gsd-macro-plan/references/macro-plan-contract.md`
- `/Users/joelchan/.codex/skills/gsd-macro-plan/references/output-quality-bar.md`
- `/Users/joelchan/.codex/memories/MEMORY.md`
- `.planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification/input.md`
- `.planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification/source-snapshot.md`
- `.planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification/blocked-checks.md`
- `.planning/macro-map/MACRO-HANDOFF.md`
- `.planning/macro-map/MACRO-MAP.md`
- `.planning/macro-map/EXECUTION-MAP.md`
- `.planning/macro-map/MECHANISM-MAP.md`
- `.planning/macro-map/CONCERNS.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/TESTING.md`
- `README.md`
- `QUALITY.md`
- `STRUCTURE.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-notes.md`

## Invariant At Stake

Product simplification can make Handshake legible, but it must not launder standing evidence, review language, workflow handles, or friendly IDs into authority.

The invariant is:

```text
Passport / Admission / Badge / Handle are evidence and context only.
Fresh exact protected-action clearance is the only path to authority.
```

Any macro plan that lets a passport, admission, badge, handle, certificate, review surface, CLI command, MCP resource, SDK type, demo output, or product ID satisfy policy, produce a greenlight, perform a gateway check, invoke a signer, create payment material, mutate, export a receipt, or mint terminal authority evidence violates the product kernel.

## Pass Conditions

The future macro plan passes this slices audit only if it contains all of the following:

- A full source reconciliation phase that snapshots canonical docs, macro-map artifacts, codebase maps, blocked checks, missing artifacts, stale artifacts, and proof gaps before source edits.
- Execution slices with objective, source evidence, inputs, outputs, owner, dependencies, stop conditions, proof gates, verification commands, rollback or abandonment criteria, and agent handoff needs.
- A long-running sequence for Tier 1 and Tier 2, not only `docs/internal/service-workflow-story.md` plus a schema stub.
- Explicit P0/P1 preservation from `.planning/macro-map/CONCERNS.md` as implementation blockers unless accepted and bounded by the chair/user.
- A field-level matrix for `ServiceWorkflowAdmission` and `ServiceWorkflowHandle` proving every field is evidence, bounds, posture, refusal, proof gap, or correlation only.
- Negative tests proving handles cannot satisfy `ActionContract`, `PolicyDecision`, `Greenlight`, `GatewayCheckAttempt`, `Receipt`, `AuthorityCertificate`, signer invocation, payment material creation, or mutation.
- Generated-execution stress coverage for loops, retries, branches, dynamic tool construction, stale review surfaces, raw sibling paths, and agents passing handles as permission.
- Product surface convergence across docs, SDK, CLI, MCP, demos, examples, package exports, readback projections, and architecture tests without broadening authority.
- Protected-action gates for each touched action family, especially x402, that preserve exact candidate action, credential holder, gateway authority holder, raw sibling bypass posture, refusal/readback/proof-gap separation, and one-use greenlight semantics.
- Stop conditions that halt before Tier 3 if Tier 1/Tier 2 simplification lacks source-owned schema, negative tests, validation, sidecar reconciliation, and full repo gates.
- Rollback or abandonment criteria for authority drift, raw material leakage, protocol primitive creep, multi-host containment overclaim, external rail overclaim, or fixture/demo-first sequencing.
- An `AGENT-HANDOFF.md` sufficient for a fresh agent to resume without chat memory, including instruction sources, ignored context, tool contract, checkpoints, stop conditions, proof gaps, and next agent step.
- `TASKS.jsonl` lines that are assignable mechanisms with acceptance checks, not advice.
- Validation evidence from the macro-plan validator before any claim of execution readiness.

## Failures

Current blockers that the future macro plan must not smooth over:

- P0: Passport, Admission, Badge, and `ServiceWorkflowHandle` can become ambient authority if they carry or imply policy, greenlight, gateway, signer, receipt, certificate, credential, payment, or mutation material.
- P0: Generated agents may pass a handle into tools as permission, especially inside loops, retries, dynamic tool calls, stale review flows, or branch-dependent execution.
- P1: Multi-host evidence is not native containment. Codex-local evidence is stronger than Claude Code, Hermes, OpenClaw, generic MCP, browser, A2A, or OpenAPI, and none can be generalized.
- P1: Passport/Admission/Badge names can leak into protocol areas, package exports, runtime dispatch, gateway paths, CLI/MCP commands, or demos.
- P1: Developer docs can become metaphor-only unless they include exact fields, forbidden interpretations, failure states, proof gates, and source-owned tests.
- P1: Free passport verification can blur into paid clearance unless the economic unit remains protected-event terminalization.
- The run's `blocked-checks.md` says no field-level acceptance matrix exists for `ServiceWorkflowAdmission` / `ServiceWorkflowHandle`.
- No negative test currently proves a handle cannot create or satisfy authority-bearing records or signer/payment/mutation behavior.
- No implemented schema or rendered readback artifact proves users see admission, handle, action request, clearance, receipt, refusal, and proof gap as separate states.
- No live external rail proof exists for x402 provider/facilitator behavior, auth.md deployment corpus, ERC-8004 standing, MCP Registry lookup, Agentic.Market listing, hosted custody, provider signer lifecycle, or settlement/finality.
- The macro-plan package has not yet been written or validated.

Missing slices if the chair only follows the old minimal path:

- Source-boundary reconciliation and stale-artifact classification slice.
- Product noun authority-boundary slice for Passport, Admission, Badge, Handle, Certificate, review surfaces, and IDs.
- Source-owned surface schema/projection slice for `ServiceWorkflowAdmission` and `ServiceWorkflowHandle`.
- Non-authority flag and negative-test slice.
- Naming/package/export guard slice.
- Runtime/generated-execution misuse slice.
- Protected-action field-level matrix slice.
- Evidence/readback/redaction slice.
- x402 current-wedge non-regression slice.
- Docs/SDK/CLI/MCP/demo/example convergence slice.
- Quality, package, and full-repo gate slice.
- Tier 3 stop-wall and handoff slice.
- Rollback, abandonment, and git-checkpoint slice.
- Fresh-agent handoff and continuation slice.

## Proof Gaps

- No full macro-plan package exists yet for this run, so there is no current `EXECUTION-SLICES.md`, `AGENT-HANDOFF.md`, `RUNTIME-GATES.md`, `PROTECTED-ACTION-GATES.md`, `EVIDENCE-PLAN.md`, `REVIEW-GATES.md`, `RISKS.md`, `DECISIONS.md`, or `TASKS.jsonl` to audit.
- No evidence shows the future plan has read the full source boundary required by the run input.
- No evidence shows the future plan has reconciled sidecar audits before chair synthesis.
- No evidence shows the future plan has stop conditions specific enough to halt implementation when a product noun becomes authority-bearing.
- No evidence shows rollback/abandonment criteria are attached to each slice rather than placed in a generic risk section.
- No evidence shows a fresh agent can execute the full long-running program without chat memory.
- No evidence shows Tier 3 remains blocked until Tier 1/Tier 2 proof gates pass or proof gaps are explicitly recorded.

## Required Changes

Required full-program phases:

1. Source reconciliation and blocker preservation: classify canonical docs, scratch planning inputs, run-local files, missing full-boundary inputs, existing proof lanes, non-proofs, and open P0/P1 concerns.
2. Product boundary contract: define the noun set and forbidden interpretations so Passport/Admission/Badge/Handle remain evidence/context only.
3. Surface schema and readback design: specify `ServiceWorkflowAdmission` and `ServiceWorkflowHandle` as regenerated projection/readback objects with hard non-authority flags and no durable protocol authority state.
4. Architecture and claim-boundary tests: add naming, import, package, root-export, surface-posture, and claim tests before publicizing any simplified noun.
5. Runtime and generated-execution stress: prove handles fail as permission across runtime ingress, MCP, browser/A2A/OpenAPI posture, loops, retries, branches, stale reviews, and raw sibling bypass probes.
6. Protected-action matrix: map every field and transition from admission to fresh action request, exact contract, policy/refusal, one-use greenlight, gateway check, receipt/refusal/proof gap, replay refusal, and certificate.
7. Product surface convergence: align docs, SDK, CLI, MCP, demos, examples, package exports, and readback language without creating new authority or claiming hosted operation.
8. x402 and adjacent-lane non-regression: keep the first wedge as one buyer-side `x402_payment.exact` per-call protected action and preserve signer material behind `VerifiedGatewayCheck`.
9. Evidence and redaction: prove raw credentials, tokens, payment payloads, payment signatures, private keys, raw provider secrets, and raw internal records cannot leak through product surfaces.
10. Validation and handoff: run macro-plan validation, preserve sidecar findings, define git checkpoints, produce fresh-agent handoff, and only then enter implementation planning.
11. Tier 3 admission wall: explicitly block Tier 3/hosted progression until all Tier 1/Tier 2 source gates pass or named proof gaps are accepted as non-authority.

Gates that block implementation:

- Macro-plan package not written and validator not run.
- Sidecar audits not reconciled by the chair.
- Any P0 concern remains open without a concrete test-backed mechanism.
- Missing field-level protected-action matrix.
- Missing negative tests for handle-as-permission and noun-to-authority drift.
- Missing runtime stress coverage for generated code behavior.
- Missing source-owned placement decision for the schema/projection.
- Missing rollback/abandonment criteria per slice.
- Missing full-source-boundary readback.
- Any claim of native host containment, external provider custody, settlement/finality, marketplace/certification, hosted operation, or Tier 3 readiness from current local/profile evidence.

What cannot be delegated:

- Final sequencing of the full program.
- Final status recommendation.
- Authority boundary claims.
- Acceptance of P0/P1 risk.
- Decision that a product noun is safe to expose in source or package surfaces.
- Decision to admit a new protocol primitive.
- Decision to unblock Tier 3.
- Determination that a proof gap is acceptable product posture.
- Reconciliation of sidecar conflicts.

Sidecars can report pressure findings. The chair must own the final sequence and cannot outsource authority claims.

Smallest next mechanism:

Write `EXECUTION-SLICES.md` first, not source code. The first slice must be source-boundary reconciliation with a table of canonical sources, scratch sources, missing inputs, P0/P1 blockers, pass gates, stop conditions, rollback/abandonment criteria, and handoff needs. The second slice must be the non-authority product-noun contract plus negative-test plan. No implementation slice should precede those two.

## Status Recommendation

Recommendation to chair: keep implementation blocked until the full macro-plan package exists, validates, and reconciles this slices audit with the other sidecar reports.

Do not mark the future plan ready for agent execution from a minimal docs/schema/test path. The user asked for a full program; the only acceptable handoff is a long-running, source-backed Tier 1/Tier 2 sequence with proof gates, stop conditions, rollback/abandonment criteria, and fresh-agent handoff.

Do not let Tier 3 move forward from product-language simplification alone. Without non-authority flags, negative tests, runtime misuse coverage, protected-action matrix, and evidence/readback separation, the simplification becomes review theatre and ambient authority risk.

## Commands Or Tools Used

- Used `gsd-macro-plan` skill instructions and references.
- `rg -n "Tier 3|Tier 1|Tier 2|macro-plan|x402|product simplification|20260525|Handshake v0\\.0\\.2" /Users/joelchan/.codex/memories/MEMORY.md`
- `wc -l` on required source files.
- `sed -n` on required source files and current run files.
- `find .planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification -maxdepth 1 -type f -print`
- `ls -la .planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification/audits`
- `mkdir -p .planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification/audits`
- `apply_patch` to add this report only.
