## Audit Scope

Focus: evidence plan, validation, proof gaps, and closeout commands for the Tier 1 / Tier 2 product-simplification macro-plan run.

Verdict: fail for fresh-agent handoff as-is. The source boundary is strong enough for macro planning, and the macro-map validator passes, but the macro-plan package is not currently validated and cannot be treated as execution-ready evidence. The macro-plan validator fails, and the artifacts disagree about whether the user-owned noun/scope decision is resolved or still blocking.

This audit does not select a macro move, synthesize the final plan, promote final status, or authorize implementation.

## Source Boundary

Authoritative source boundary for this audit:

| Source | Role | Evidence Posture |
| --- | --- | --- |
| `AGENTS.md` user-provided instructions | Doctrine and invariant boundary | Governs this audit |
| `/Users/joelchan/.codex/skills/gsd-macro-plan/SKILL.md` | Macro-plan workflow and success criteria | Required source |
| `/Users/joelchan/.codex/skills/gsd-macro-plan/references/macro-plan-contract.md` | Required artifacts and sections | Required source |
| `/Users/joelchan/.codex/skills/gsd-macro-plan/references/output-quality-bar.md` | Quality bar beyond validator | Required source |
| `/Users/joelchan/.codex/skills/gsd-macro-plan/scripts/validate_macro_plan_output.py` | Structural validator behavior | Required source and executed command |
| `.planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification/input.md` | Run input, success criteria, anti-patterns, initial status | Required source |
| `.planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification/source-snapshot.md` | Run-local source snapshot and non-proofs | Required source |
| `.planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification/blocked-checks.md` | Run-local blocked checks | Additional run source |
| `.planning/macro-map/FACET-MAP.md` | Lens convergence and blocked checks | Required source |
| `.planning/macro-map/CONCERNS.md` | Open P0/P1 concerns | Required source |
| `.planning/codebase/TESTING.md` | Focused and repo verification gates | Required source |
| `README.md` | Current product/kernel orientation and command posture | Required source |
| `docs/internal/decisions.md` | Canon decisions, proof ledger, expansion gate | Required source |
| `docs/internal/protocol-notes.md` | Protocol primitive, evidence rules, proof lanes | Required source |
| `package.json` | Actual package scripts and command contract | Required source |
| `.planning/macro-plan/*.md`, `.planning/macro-plan/TASKS.jsonl` | Current macro-plan package under audit | Additional source needed to audit handoff |

Non-sources: chat memory, future intent, sidecar expectations, and `.planning/` scratch not named above. `.planning/` is evidence for planning posture only; it is not repo-facing canon.

## Files Read

- `/Users/joelchan/.codex/skills/gsd-macro-plan/SKILL.md`
- `/Users/joelchan/.codex/skills/gsd-macro-plan/references/macro-plan-contract.md`
- `/Users/joelchan/.codex/skills/gsd-macro-plan/references/output-quality-bar.md`
- `/Users/joelchan/.codex/skills/gsd-macro-plan/scripts/validate_macro_plan_output.py`
- `.planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification/input.md`
- `.planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification/source-snapshot.md`
- `.planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification/blocked-checks.md`
- `.planning/macro-map/FACET-MAP.md`
- `.planning/macro-map/CONCERNS.md`
- `.planning/codebase/TESTING.md`
- `README.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-notes.md`
- `package.json`
- `.planning/macro-plan/README.md`
- `.planning/macro-plan/MACRO-PLAN.md`
- `.planning/macro-plan/EXECUTION-SLICES.md`
- `.planning/macro-plan/AGENT-HANDOFF.md`
- `.planning/macro-plan/RUNTIME-GATES.md`
- `.planning/macro-plan/PROTECTED-ACTION-GATES.md`
- `.planning/macro-plan/EVIDENCE-PLAN.md`
- `.planning/macro-plan/REVIEW-GATES.md`
- `.planning/macro-plan/RISKS.md`
- `.planning/macro-plan/DECISIONS.md`
- `.planning/macro-plan/TASKS.jsonl`

## Invariant At Stake

Product simplification may hide protocol complexity from users, but it must not hide or weaken authority, gateway, evidence, refusal, proof-gap, isolation, or reconstruction boundaries.

For evidence closeout, the specific invariant is: a fresh agent must be able to reconstruct what is proven, what is only planning posture, what is explicitly blocked, and which commands must pass before implementation. If the plan claims readiness while validation fails or artifacts disagree about blockers, this is not auditable.

## Pass Conditions

Artifact completeness checklist:

| Artifact | Required Evidence Condition | Current Posture |
| --- | --- | --- |
| `README.md` | Scope, source map, sidecar review, status, artifact index | Present, but sidecar path references a different run ID than this assigned audit run |
| `MACRO-PLAN.md` | Exactly one status token, current evidence, non-proofs, verification gates, smallest next mechanism | Present, but validator fails because multiple status tokens appear |
| `EXECUTION-SLICES.md` | Slices with source evidence, stop conditions, proof gates, rollback/abandonment, handoff needs | Present; S0 decision gate conflicts with claimed ready posture |
| `AGENT-HANDOFF.md` | Fresh-agent objective, source boundary, runtime profile, tool contract, checkpoints, stop conditions, proof gaps | Present, but says the macro plan is blocked until noun-set acceptance |
| `RUNTIME-GATES.md` | Per-runtime posture, approval behavior, subagent behavior, continuation, blocked checks | Present; correctly proof-gaps multi-host containment |
| `PROTECTED-ACTION-GATES.md` | Candidate actions, authority boundary, gateway boundary, bypass posture, readback separation, proof gaps | Present; correctly treats admission/handle as non-candidate evidence |
| `EVIDENCE-PLAN.md` | Current evidence, commands, replay/refusal cases, review prompts, fixtures/examples, redaction, runtime artifacts, unavailable evidence | Present; needs stronger exact command plan and current validation result |
| `REVIEW-GATES.md` | CEO, engineering, design, DevEx, agent, runtime, protected-action pass/block gates | Present, but says the plan is blocked and no sidecar auditors ran |
| `RISKS.md` | Each risk has ID, severity, trigger, mitigation, owner, status | Present |
| `DECISIONS.md` | Each decision has ID, status, decision, rationale, source, revisit trigger | Present, but `MPLAN-D001` says blocked macro plan while README/MACRO-PLAN say ready for phase planning |
| `TASKS.jsonl` | Valid JSONL task records with evidence, acceptance, non-goals, proof gate, next mechanism | Present, but `MPLAN-001` is still open and later tasks are blocked |

Validation pass conditions before handoff:

1. `python3 /Users/joelchan/.codex/skills/gsd-macro-plan/scripts/validate_macro_plan_output.py .planning/macro-plan` exits 0.
2. Status posture is consistent across `README.md`, `MACRO-PLAN.md`, `AGENT-HANDOFF.md`, `REVIEW-GATES.md`, `DECISIONS.md`, and `TASKS.jsonl`.
3. The plan either records the user decision as accepted and closes `MPLAN-001`, or keeps implementation blocked and avoids ready phrasing.
4. `EVIDENCE-PLAN.md` records the exact current validator output, not only a future command.
5. `REVIEW-GATES.md` records this and other sidecar audits before any readiness claim.
6. `blocked-checks.md` is updated or reconciled so it no longer says the macro-plan package has not been written or validated after the package exists.
7. Implementation entry is limited to phase planning unless a detailed phase plan names source files, focused tests, proof gaps, and rollback gates.

Implementation-entry conditions:

- Fresh agent may begin detailed phase planning only after macro-plan validation passes and status contradictions are reconciled.
- Fresh agent may begin source implementation only after a detailed phase plan exists for S1-S3 with source-opened target files, exact focused tests, and explicit non-authority acceptance criteria.
- Fresh agent must not implement fixture/demo work until S1-S4 guardrail gates exist or are explicitly blocked with proof gaps.
- Fresh agent must checkpoint with `git status --short` before edits and after each slice. The current checkpoint observed by this audit is clean on branch `main`; no commit was made.

## Failures

1. Structural validator failure.

Current command result:

```bash
python3 /Users/joelchan/.codex/skills/gsd-macro-plan/scripts/validate_macro_plan_output.py .planning/macro-plan
```

Current output:

```text
ERROR: MACRO-PLAN.md must contain exactly one plan status
```

The immediate cause is that `MACRO-PLAN.md` contains more than one recognized status token. It includes `READY_FOR_PHASE_PLANNING` twice and also mentions `NEEDS_USER_DECISION`.

2. Status contradiction across artifacts.

- `README.md` and `MACRO-PLAN.md` say `READY_FOR_PHASE_PLANNING`.
- `AGENT-HANDOFF.md` says the macro plan is blocked until the user accepts the surface-first noun set.
- `REVIEW-GATES.md` says this macro plan is blocked because the macro map requires a user-owned noun/scope decision.
- `DECISIONS.md` says the accepted decision is to produce a blocked macro plan rather than an executable plan.
- `TASKS.jsonl` keeps `MPLAN-001` open and later tasks blocked.
- `blocked-checks.md` says the macro-plan package has not yet been written or validated, which is stale relative to the package now under audit.

This is not a cosmetic inconsistency. A fresh agent could either start phase planning from `MACRO-PLAN.md` or stop at `AGENT-HANDOFF.md` and `REVIEW-GATES.md`. That means the handoff is not reconstructable.

3. Evidence plan is command-shaped but not closeout-shaped.

`EVIDENCE-PLAN.md` lists the right categories: current evidence, commands, replay/refusal cases, review prompts, fixtures/examples, readback/redaction checks, runtime proof artifacts, and unavailable evidence. It does not record the current macro-plan validator failure, the stale blocked-checks state, or the cross-artifact status conflict.

4. Review gate state is not reconciled with this sidecar process.

`REVIEW-GATES.md` says no sidecar auditors ran because normal macro planning is blocked. This audit exists and must be summarized by the chair before any status is promoted. This sidecar cannot promote status; it can only report that review evidence is currently incomplete.

5. Handoff says "wait for user decision" while run input says the user explicitly authorized the full macro-plan pass.

This may be resolvable by chair reconciliation, but as written it is a handoff hazard. If the user decision is accepted, the artifacts should record the decision and close or supersede S0. If not accepted, the ready status should be removed.

## Proof Gaps

Evidence gaps:

- No current passing macro-plan validator output.
- No reconciliation record explaining whether the noun/scope decision is accepted, blocked, or superseded.
- No source schema for `ServiceWorkflowAdmission`.
- No source schema for `ServiceWorkflowHandle`.
- No negative tests proving admission/handle cannot create or satisfy `ActionContract`, `PolicyDecision`, `Greenlight`, `GatewayCheckAttempt`, `Receipt`, `AuthorityCertificate`, signer invocation, payment material, or mutation.
- No handle misuse tests for loops, retries, dynamic tool names, stale review surfaces, changed params, raw siblings, browser/network side channels, replay, or idempotency mismatch.
- No implemented readback artifact showing admission, handle, action request, clearance, receipt, refusal, and proof gap as separate states.
- No runtime proof artifacts for Claude Code, Hermes, OpenClaw, generic MCP, browser, A2A, or OpenAPI.
- No native host containment proof.
- No live external rail proof for ERC-8004, auth.md deployment corpus, live x402 provider custody, hosted custody, provider signer lifecycle, Agentic.Market listing, facilitator operation, settlement/finality, or MCP Registry lookup for this run.
- No evidence that public-facing docs or examples preserve `createsAuthority: false` for the proposed nouns because those docs/schemas do not exist yet.

Non-proofs that must stay explicit:

- Macro-map validation is not macro-plan validation.
- Passing the structural macro-plan validator would not prove source implementation, authority safety, runtime containment, or user comprehension.
- Codex-local or package-profile evidence does not prove other host containment.
- Admission/readback evidence does not prove policy, greenlight, gateway check, signer use, mutation, receipt export, or terminal certificate.
- Receipt evidence does not prove downstream business success or payment settlement.
- `.planning/codebase/*` routes implementation attention, but source files and tests must still be opened before edits.

Validator risks:

- The validator catches the current multiple-status failure, but its status scanner also treats negative mentions as status tokens. The chair should avoid writing status constants in explanatory prose inside `MACRO-PLAN.md`.
- The validator is structural. It does not detect cross-file contradictions like blocked handoff plus ready macro status.
- It does not verify that commands were run, that sidecar audits exist, that stale `blocked-checks.md` was reconciled, or that `TASKS.jsonl` statuses align with `MACRO-PLAN.md`.
- It does not prove the content-level quality bar: source-opened implementation paths, real negative tests, runtime proof artifacts, readback redaction, or refusal/replay fixtures.
- It can reject weak filler strings such as "run tests"; current artifacts mostly avoid that, but any repair should keep proof gates exact rather than generic.

Replay/refusal cases that must remain in the plan and later fixtures:

- consumed greenlight replay refuses before signer reuse;
- idempotency mismatch requires a new exact contract;
- stale metadata requires reload;
- changed observed parameters require recraft;
- raw sibling route requires stop, isolation, or proof gap;
- credential-ref or authority-ref isolation blocks policy/gateway;
- proof gap does not grant retry permission;
- handle presented as policy/gateway/signer/mutation input refuses;
- dynamic tool construction or late-bound endpoint/amount refuses or requires a new exact action contract.

Readback/redaction gaps to close before implementation claims:

- Admission readback must expose refs, digests, claim status, expiry, proof-gap reason, and non-authority flags only.
- It must not expose raw credentials, tokens, payment payloads, payment signatures, private keys, provider secrets, raw authorization headers, or signer material.
- Receipt readback must remain separate from admission readback.
- Runtime evidence, gateway-check evidence, mutation-attempt evidence, downstream observation, replay refusal, proof gap, and certificate must be separate in readback.

## Required Changes

1. Reconcile status before any handoff.

Choose one evidence posture and make every artifact agree:

- If the user decision is accepted: close or supersede `MPLAN-001`, update `AGENT-HANDOFF.md`, `REVIEW-GATES.md`, `DECISIONS.md`, and `blocked-checks.md`, and keep `READY_FOR_PHASE_PLANNING` only once in `MACRO-PLAN.md`.
- If the decision remains blocked: remove ready phrasing from `README.md` and `MACRO-PLAN.md`, keep tasks blocked, and set the plan posture to blocked without laundering it into phase planning.

2. Fix structural validation.

`MACRO-PLAN.md` must contain exactly one macro-plan status token. Avoid mentioning other status constants in prose. Then rerun:

```bash
python3 /Users/joelchan/.codex/skills/gsd-macro-plan/scripts/validate_macro_plan_output.py .planning/macro-plan
```

3. Update evidence closeout.

`EVIDENCE-PLAN.md` should record:

- macro-map validator result;
- macro-plan validator result;
- current git branch and status;
- whether sidecar audits exist and where;
- exact commands that must pass before phase planning versus implementation;
- explicit skipped commands and why;
- stale or unavailable evidence.

4. Reconcile run-local `blocked-checks.md`.

It currently says the package has not yet been written or validated. That statement is stale now that the package exists and macro-plan validation has been attempted. It should be updated by the chair, not this sidecar.

5. Make review prompts operational.

Review prompts should become pass/block questions tied to artifacts and commands:

- CEO: does the plan avoid a standalone Passport identity/trust/certification claim?
- Engineering: do source paths stay outside protocol authority and carry hard non-authority flags?
- Design/DevEx: can users distinguish admission, action request, clearance, receipt, refusal, and proof gap?
- Agent/runtime: can generated code misuse the handle in loops, retries, branches, dynamic tools, stale review, raw siblings, or browser/network side channels?
- Protected-action: can any field create or satisfy policy, greenlight, gateway check, signer use, mutation, receipt, or certificate?

6. Add an exact verification command plan.

Minimum planning closeout:

```bash
python3 /Users/joelchan/.codex/skills/gsd-plan-map/scripts/validate_plan_map_output.py .planning/macro-map
python3 /Users/joelchan/.codex/skills/gsd-macro-plan/scripts/validate_macro_plan_output.py .planning/macro-plan
git status --short
```

Minimum first implementation-slice closeout after S1-S3 source changes:

```bash
npm run quality:claims
npm run quality:architecture
npm run format:check
git diff --check
```

Protocol/readback implementation closeout when admission/handle schemas or projections exist:

```bash
npm run test -- test/architecture/surface-boundary-posture.test.ts test/architecture/claim-boundary.test.ts test/architecture/naming-posture.test.ts
npm run test -- test/protocol/evidence-projections.test.ts test/protocol/representation-contract.test.ts test/runtime/runtime-ingress.test.ts
npm run quality:claims
npm run quality:architecture
```

Protected-action fixture closeout when x402/auth.md stitch work begins:

```bash
npm run test -- test/adapters/x402-wallet-gateway.test.ts test/integration/x402-d1-http.test.ts test/integration/auth-md-protected-call.test.ts test/integration/auth-md-receipt-reconstruction.test.ts
npm run test -- test/conformance/protected-mutation-adapter-conformance.test.ts
npm run check:repo
```

Full repo closeout before any claim that implementation is integrated:

```bash
npm run check:repo
git status --short
```

Git checkpoint advice:

- Do not commit from the audit sidecar.
- Before implementation starts, the chair or implementing agent should record `git status --short` and `git branch --show-current`.
- Create a checkpoint after macro-plan reconciliation and before source edits.
- After each slice, use `git status --short`, `git diff --stat`, and the slice-specific tests before proceeding.
- Do not mix macro-plan artifact repairs with source implementation in the same checkpoint.

## Status Recommendation

Do not promote final status from this sidecar.

Evidence recommendation: block fresh-agent handoff until the macro-plan validator passes and the status contradictions are reconciled. After that, the package may be suitable for detailed phase planning, not source implementation. Source implementation should remain blocked until a detailed phase plan for the first slice names exact source paths, focused tests, proof gaps, rollback criteria, and non-authority acceptance conditions.

Smallest next mechanism: reconcile the plan-status evidence by updating the macro-plan package so `MACRO-PLAN.md` has exactly one status token and every handoff/review/task artifact agrees on whether S0 is closed or still blocking, then rerun the macro-plan validator and record the result in `EVIDENCE-PLAN.md`.

## Commands Or Tools Used

Commands and tools used for this audit:

```bash
rg -n "Tier 3 doctrine|x402 sandbox|tier1|Tier 1|macro-plan|protected-action|evidence|proof gap" /Users/joelchan/.codex/memories/MEMORY.md
sed -n '84,121p' /Users/joelchan/.codex/memories/MEMORY.md
sed -n '221,232p' /Users/joelchan/.codex/memories/MEMORY.md
sed -n '1,240p' /Users/joelchan/.codex/skills/gsd-macro-plan/SKILL.md
sed -n '1,260p' /Users/joelchan/.codex/skills/gsd-macro-plan/references/macro-plan-contract.md
sed -n '1,260p' /Users/joelchan/.codex/skills/gsd-macro-plan/references/output-quality-bar.md
sed -n '1,520p' /Users/joelchan/.codex/skills/gsd-macro-plan/scripts/validate_macro_plan_output.py
sed -n '1,260p' .planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification/input.md
sed -n '1,320p' .planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification/source-snapshot.md
sed -n '1,240p' .planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification/blocked-checks.md
sed -n '1,340p' .planning/macro-map/FACET-MAP.md
sed -n '1,320p' .planning/macro-map/CONCERNS.md
sed -n '1,340p' .planning/codebase/TESTING.md
sed -n '1,360p' README.md
sed -n '1,360p' docs/internal/decisions.md
sed -n '1,720p' docs/internal/protocol-notes.md
sed -n '1,260p' package.json
rg --files .planning/macro-plan .planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification
sed -n '1,420p' .planning/macro-plan/EXECUTION-SLICES.md
sed -n '1,360p' .planning/macro-plan/RUNTIME-GATES.md
sed -n '1,360p' .planning/macro-plan/PROTECTED-ACTION-GATES.md
sed -n '1,320p' .planning/macro-plan/RISKS.md
sed -n '1,260p' .planning/macro-plan/DECISIONS.md
sed -n '1,260p' .planning/macro-plan/README.md
sed -n '1,260p' .planning/macro-plan/TASKS.jsonl
python3 /Users/joelchan/.codex/skills/gsd-macro-plan/scripts/validate_macro_plan_output.py .planning/macro-plan
python3 /Users/joelchan/.codex/skills/gsd-plan-map/scripts/validate_plan_map_output.py .planning/macro-map
git status --short
git branch --show-current
rg -n "READY_FOR|NEEDS_|BLOCKED|CUT|DEGRADED" .planning/macro-plan/MACRO-PLAN.md .planning/macro-plan/README.md .planning/macro-plan/AGENT-HANDOFF.md .planning/macro-plan/REVIEW-GATES.md .planning/macro-plan/TASKS.jsonl .planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification/blocked-checks.md
```

Observed command results:

- Macro-map validator: `Plan map output is valid.`
- Macro-plan validator: `ERROR: MACRO-PLAN.md must contain exactly one plan status`
- Git branch: `main`
- Git status before report write: clean

Only this file was written by this sidecar audit.
