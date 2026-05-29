# Evidence Review Gates Audit

## Audit Scope

Focus: evidence, review, and closeout gates for the architectural north-star macro-plan correction.

This audit is bounded. It does not select the macro move, synthesize the final plan, promote final status, or convert protected-action proof gaps into authority. It identifies the evidence and gate structure that must exist before the correction can be treated as more than a thin plan.

## Source Boundary

The audit used the current checkout as source truth and treated `.planning/` as scratch planning evidence, not repo-facing canon.

Primary source boundary:

- Current doctrine and canonical truth: `AGENTS.md`, `docs/internal/decisions.md`, `QUALITY.md`.
- Current macro-map handoff: `.planning/macro-map/MACRO-HANDOFF.md`, `.planning/macro-map/CONCERNS.md`.
- Current macro-plan package: `.planning/macro-plan/*`.
- Prior macro-plan run evidence: `.planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification/*`.
- Current command contract: `package.json` scripts.
- Current claim gate: `test/architecture/claim-boundary.test.ts`.
- Macro-plan skill contract: `gsd-macro-plan` `SKILL.md`, `macro-plan-contract.md`, `output-quality-bar.md`.

The requested run directory did not exist before this audit report was written. That absence is a proof gap for the correction, not a blocker to writing this sidecar report.

## Files Read

- `AGENTS.md`
- `QUALITY.md`
- `package.json`
- `docs/internal/decisions.md`
- `test/architecture/claim-boundary.test.ts`
- `.planning/macro-map/MACRO-HANDOFF.md`
- `.planning/macro-map/CONCERNS.md`
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
- `.planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification/validation.md`
- `.planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification/blocked-checks.md`
- `.planning/macro-plan/runs/20260525T174005-passport-admission-full/audits/evidence.md`
- `/Users/joelchan/.codex/skills/gsd-macro-plan/SKILL.md`
- `/Users/joelchan/.codex/skills/gsd-macro-plan/references/macro-plan-contract.md`
- `/Users/joelchan/.codex/skills/gsd-macro-plan/references/output-quality-bar.md`
- `/Users/joelchan/.codex/memories/MEMORY.md` lines 84-120 for prior x402 macro-plan drift lessons

## Invariant At Stake

The correction must not let planning evidence imitate execution evidence.

A macro-plan can be structurally valid and still be thin. A prior run can have green tests and still be irrelevant after the checkout or plan boundary changes. A review table can exist and still be review theatre if it does not force sidecar disagreement, research evidence, test output, full repo gate, code review, and git checkpoints into the current run.

For this correction, the invariant is:

```text
Architectural north-star claims must be backed by current source evidence,
dated research evidence where external/current claims are made, current
macro-plan validation, current test output, full repo gate output, independent
review pressure, and reconstructable git checkpoints.
```

Anything less is advisory planning, not a Handshake-grade execution handoff.

## Pass Conditions

### Required Evidence Artifacts

The current correction run must have its own evidence files under:

```text
.planning/macro-plan/runs/20260525T110908Z-architectural-north-star/
```

Required run-local files:

| Artifact | Required content | Stop condition if missing |
| --- | --- | --- |
| `input.md` | Exact correction objective, user constraints, run id, report paths, source boundary, and non-goals. | The chair cannot reconstruct why the correction exists. |
| `source-snapshot.md` | `git rev-parse HEAD`, `git status --short --untracked-files=all`, ignored `.planning/` posture, package scripts, canonical docs read, top-level macro-plan file list, and source/test paths touched or explicitly not touched. | Old evidence can be laundered into the current run. |
| `research-evidence.md` | Dated sources, URLs or local source paths, accessed date, extracted facts, disconfirming evidence, inference boundaries, and which macro-plan claim each fact supports. If no external/current claim remains, this file must say so explicitly and state why research is not needed. | Strategy or market claims become unsupported narrative. |
| `blocked-checks.md` | Open P0/P1 blockers, unavailable proof, non-proofs, external rails not verified, host/runtime proof gaps, and old-run evidence that is not transferable. | Proof gaps get smoothed over. |
| `validation.md` | Macro-plan validator command and output, status reconciliation, command matrix output, test output, full repo gate output, and what the validator does not prove. | Structural validation becomes semantic proof. |
| `code-review.md` | Findings-first review of the final diff, file/line references, missing tests, residual risk, and explicit statement if no source/docs/tests changed. | Review is replaced by plan authorship. |
| `git-checkpoints.md` | Checkpoint order, commit hashes, tested source commit, evidence-only commit if any, `git status` before/after, and whether `.planning/` files were force-added. | The chain cannot be reconstructed later. |
| `audits/*.md` | Bounded sidecar reports for slices, runtime, protected-action, and this evidence/review-gates audit, with chair reconciliation in `REVIEW-GATES.md`. | Sidecar pressure is not reconstructable. |

Top-level macro-plan artifacts must also be current for this correction:

- `.planning/macro-plan/EVIDENCE-PLAN.md` must point to the current run artifacts, not only the previous `095940Z` run.
- `.planning/macro-plan/REVIEW-GATES.md` must add current-run research, validation, repo gate, code review, and git checkpoint gates.
- `.planning/macro-plan/RISKS.md` must add P0/P1 risks for thin-plan laundering, stale research, missing code review, missing full repo gate, and ignored `.planning/` artifacts.
- `.planning/macro-plan/TASKS.jsonl` must include assignable current-run tasks with `status: "open"` until each proof file and gate output exists.

### Review Gates And Sidecar Pressure Needed

`REVIEW-GATES.md` must not only say sidecars exist. It must force pressure into the plan.

Minimum required current-run gates:

| Gate | Must include | Blocks promotion when |
| --- | --- | --- |
| Research Gate | Source table, date checked, claim supported, disconfirming facts, inference boundary. | External/current claims have no dated source evidence. |
| Macro-Plan Validation Gate | Validator command, observed output, artifact list, and semantic non-proof warning. | Validator was not run after final plan edits. |
| Source Boundary Gate | Canonical files, scratch files, stale/ignored artifacts, and source/test paths touched. | Current run inherits old run evidence without source snapshot. |
| Sidecar Reconciliation Gate | Each sidecar report, finding, chair disposition, artifact updated, residual blocker. | Sidecar findings are summarized but not converted into gates, risks, or tasks. |
| Code Review Gate | Findings-first review of final diff with file/line references or explicit no-source-change statement. | No independent final-diff review exists. |
| Focused Test Gate | Exact commands and outputs for affected claims. | Only generic "run tests" language exists. |
| Full Repo Gate | `npm run check:repo` output after final source/docs/tests changes. | Full gate not run or failed. |
| Git Checkpoint Gate | Commit hashes, force-add posture for `.planning/`, clean/known status, tested source commit. | Evidence cannot be tied to a committed state. |
| Protected-Action Non-Authority Gate | Explicit statement that research, review, plan, and checkpoint evidence do not create authority. | Any planning artifact is used as gateway, policy, signer, receipt, or hosted-operation proof. |

Sidecar reports must be current-run reports. Prior `095940Z` and `174005` reports are patterns and historical evidence only; they do not satisfy this correction run.

### Repo-Gate Command Matrix

The correction closeout must record exact commands, timing, and observed output in `validation.md`.

| Gate | Command | Required when | Evidence owner |
| --- | --- | --- | --- |
| Macro-plan structure | `python3 /Users/joelchan/.codex/skills/gsd-macro-plan/scripts/validate_macro_plan_output.py .planning/macro-plan` | After final macro-plan edits. | `validation.md` |
| Claim boundary | `npm run quality:claims` | Any docs, claims, product language, README, or canonical text changes. | `validation.md` |
| Claim-boundary focused test | `npm run test -- test/architecture/claim-boundary.test.ts` | Any north-star/category/market/authority wording change. | `validation.md` |
| Architecture boundary | `npm run quality:architecture` | Any source, export, CLI, MCP, SDK, adapter, runtime, or surface posture change. | `validation.md` |
| TypeScript | `npm run check:types` | Any TypeScript source/test change. | `validation.md` |
| Runtime/generated-execution | `npm run test -- test/runtime/runtime-ingress.test.ts` | Any runtime, generated-agent, proposal, loop/retry, or stale-parameter claim. | `validation.md` |
| Product/example | `npm run test -- test/product/service-workflow-admission.test.ts` | Any service workflow/example/readback claim. | `validation.md` |
| x402 protected-action | `npm run test -- test/adapters/x402-wallet-gateway.test.ts test/integration/x402-d1-http.test.ts` | Any x402/auth.md fixture, gateway, signer, payment material, or proof-gap claim. | `validation.md` |
| Demo output | `npm run demo:service-workflow-admission` and/or affected demo script | Any regenerated example packet. | `validation.md` plus generated artifact references |
| Formatting | `npm run format:check` | Any source/docs/test/example tracked change. | `validation.md` |
| Diff hygiene | `git diff --check` | Before every checkpoint. | `validation.md` |
| Full repo gate | `npm run check:repo` | Before closeout and before any final implementation claim. | `validation.md` |
| Git state | `git status --short --untracked-files=all` plus ignored `.planning/` check if planning artifacts are committed. | Before and after checkpoints. | `git-checkpoints.md` |

`package.json` defines `check:repo` as build, typecheck, lint, formatting, tests, package checks, and `git diff --check`. Passing focused tests is not a substitute for the full gate.

### What Must Be Committed And In What Checkpoints

This sidecar does not commit. The final correction work must use explicit checkpoints:

1. Planning/evidence checkpoint: current macro-plan artifacts, current run evidence files, and sidecar audits. Because `.planning/` is ignored by `.gitignore`, these files must be force-added deliberately if the user wants them committed. Do not let `git status` looking clean imply planning evidence is tracked.
2. Source/docs/tests checkpoint, if implementation changes exist: only the smallest source/docs/tests changes required by the correction, with focused test output recorded before commit.
3. Closeout checkpoint: `validation.md`, `code-review.md`, and `git-checkpoints.md` updated with final command output and reviewed state. If this is an evidence-only commit after `npm run check:repo`, it must record the exact source commit that the full repo gate tested.

The checkpoint record must distinguish:

- source commit tested by `npm run check:repo`;
- evidence-only commit containing run-local proof files;
- any untracked or ignored planning artifacts intentionally left out.

### P0/P1 Risks And Stop Conditions

| Severity | Risk | Stop condition |
| --- | --- | --- |
| P0 | Thin-plan laundering. | Current run lacks `research-evidence.md`, `validation.md`, `code-review.md`, or `git-checkpoints.md`. |
| P0 | Stale evidence inheritance. | Prior `095940Z` validation or tests are used as current-run closeout proof. |
| P0 | Review theatre. | `REVIEW-GATES.md` summarizes sidecars without chair disposition, artifact updates, blocker status, and residual proof gaps. |
| P0 | Repo-gate theatre. | Focused tests pass but `npm run check:repo` is absent, failed, or run before final source/docs/tests changes. |
| P0 | Git checkpoint gap. | `.planning/` evidence is ignored and no force-add/omission decision is recorded. |
| P0 | Protected-action overclaim. | Research, plan validation, demo output, or code review is treated as policy, gateway, signer, payment, receipt, hosted operation, or provider custody proof. |
| P1 | Research claim drift. | Current market/ecosystem claims lack dated sources and disconfirming evidence. |
| P1 | Structural validator overclaim. | Macro-plan validator output is recorded without saying it proves structure only. |
| P1 | Code review missing line-level findings. | Final review has summary language but no file/line references or explicit no-source-change statement. |
| P1 | TASKS drift. | `TASKS.jsonl` marks tasks complete before their evidence files and commands exist. |
| P1 | Command matrix drift. | `validation.md` names commands that no longer match `package.json` scripts. |

## Failures

- The requested current run directory did not exist before this audit report was created.
- The current top-level macro-plan package structurally validates, but it is tied to the older Tier 1/Tier 2 simplification package and prior `095940Z` evidence. That is not current-run proof for the architectural north-star correction.
- Existing `EVIDENCE-PLAN.md` and `TASKS.jsonl` describe completed work from the prior run. They cannot be reused as current correction closeout without a current source snapshot, current validation, and current review reconciliation.
- Existing `REVIEW-GATES.md` does not contain a current-run research gate, code review gate, full repo closeout gate, or git checkpoint gate.
- Existing `RISKS.md` does not explicitly track thin-plan laundering, stale research, old-run evidence inheritance, missing code review, missing full repo gate, or ignored `.planning/` checkpoint gaps.
- `.planning/` is ignored by `.gitignore` and `.prettierignore`. Normal `git status --short` can look clean while the entire evidence package is untracked and uncommitted.

## Proof Gaps

- No current-run `research-evidence.md` exists.
- No current-run `source-snapshot.md` exists.
- No current-run `validation.md` exists.
- No current-run `blocked-checks.md` exists.
- No current-run `code-review.md` exists.
- No current-run `git-checkpoints.md` exists.
- No current-run sidecar set, except this report, existed at the requested path before this audit.
- No current-run proof ties macro-plan status to current tests, current full repo gate, and current commit hashes.

## Required Changes

1. Create the missing current-run evidence files listed under Required Evidence Artifacts.
2. Update `EVIDENCE-PLAN.md` so the architectural north-star correction points to `20260525T110908Z-architectural-north-star` evidence, not only the older simplification run.
3. Update `REVIEW-GATES.md` with research, validation, code review, full repo, git checkpoint, and current sidecar reconciliation gates.
4. Update `RISKS.md` with P0/P1 risks for thin-plan laundering, stale evidence, research drift, review theatre, repo-gate theatre, code-review absence, and ignored `.planning/` artifacts.
5. Update `TASKS.jsonl` with current correction tasks. Required tasks must cover research evidence, source snapshot, macro-plan correction, validator run, sidecar reconciliation, focused tests, full repo gate, code review, and git checkpoints. Do not mark them complete until their evidence artifacts exist.
6. Record validation output after the final macro-plan edit, not before.
7. Run and record the full repo gate after final source/docs/tests changes if any implementation work happens.
8. Write a findings-first code review after the final diff. If the correction changes only planning artifacts, the review must say that explicitly and review the plan/evidence diff instead.
9. Record git checkpoints with commit hashes or explicitly state why no commit was made. If planning artifacts are expected in git, use a deliberate force-add decision because `.planning/` is ignored.

## Status Recommendation

Recommendation: `BLOCKED_FOR_EVIDENCE_AND_REVIEW_GATES` until the current run owns its research evidence, validation, sidecar reconciliation, tests, full repo gate, code review, and git checkpoint record.

Do not promote the correction from older run evidence. Do not treat macro-plan validator success as semantic proof. Do not use a clean `git status` as proof that `.planning/` evidence is committed.

Brutal verdict: without the required current-run evidence files and closeout gates, this becomes another thin plan with better headings. The smallest next mechanism is `source-snapshot.md` plus `research-evidence.md`; everything else should hang off that current-run boundary.

## Commands Or Tools Used

- Read macro-plan skill contract:
  - `sed -n '1,240p' /Users/joelchan/.codex/skills/gsd-macro-plan/SKILL.md`
  - `sed -n '1,220p' /Users/joelchan/.codex/skills/gsd-macro-plan/references/output-quality-bar.md`
  - `sed -n '1,220p' /Users/joelchan/.codex/skills/gsd-macro-plan/references/macro-plan-contract.md`
- Discovered planning files:
  - `rg --files .planning/macro-plan .planning/macro-map`
  - `find .planning/macro-plan/runs/20260525T110908Z-architectural-north-star -maxdepth 3 -type f`
- Read required and adjacent sources with `sed`.
- Checked current validation:
  - `python3 /Users/joelchan/.codex/skills/gsd-macro-plan/scripts/validate_macro_plan_output.py .planning/macro-plan`
- Checked git state:
  - `git status --short`
  - `git status --short --untracked-files=all`
  - `git check-ignore -v .planning/macro-plan/MACRO-PLAN.md .planning/macro-plan/runs/20260525T110908Z-architectural-north-star/audits/evidence-review-gates-audit.md`
- Checked ignore posture:
  - `rg -n "(^|/)\\.planning|planning" .gitignore .prettierignore .eslintignore`
- Memory quick pass:
  - `rg -n "architectural north-star|macro-plan|x402|review gates|evidence" /Users/joelchan/.codex/memories/MEMORY.md`
  - `nl -ba /Users/joelchan/.codex/memories/MEMORY.md | sed -n '84,124p'`
- Wrote this report only:
  - `.planning/macro-plan/runs/20260525T110908Z-architectural-north-star/audits/evidence-review-gates-audit.md`
