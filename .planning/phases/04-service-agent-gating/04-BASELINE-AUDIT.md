# Phase 04 — Baseline audit against `1e801b7`

**Generated:** 2026-05-29  
**Baseline:** `1e801b7` (merge-base with `main` at `ab382f7`; eight unpushed `main` commits through `d4a5513`…`ab382f7` are ancestors)  
**Branch:** `phase-04-service-agent-gating` (also contains Phase 02 A2A negotiation commits after merge-base)  
**Plans audited:** 12 (`04-01-PLAN.md` … `04-12-PLAN.md`)  
**Tasks audited:** 48

## Executive summary

| Status | Count | Share |
|--------|------:|------:|
| **already-done** | 0 | 0% |
| **partially-done** | 5 | 10% |
| **not-started** | 43 | 90% |
| **needs-revision** | 0 | 0% |
| **obsolete** | 0 | 0% |

- **Plans flagged for revision:** 2 (04-01, 04-02 — integrate existing baseline artifacts; do not redo from scratch)
- **Plans ready for execution as-is:** 10 (04-03 through 04-12 — plan text still valid; dependencies unchanged)
- **Estimated remaining execution work:** ~95% of original 48 tasks (5 tasks need gap-closure only; 43 full build)

### Baseline product surface already landed (from `main` lineage)

These commits predate Phase 04 plan execution but materially overlap plan intent:

| Commit | Delivers (partial overlap) |
|--------|---------------------------|
| `61c17e2` | `service-workflow-admission` surface, initial `service-workflow-story.md`, `workflow-admission-boundary.test.ts` |
| `a1cd5e5` | Doc convergence in `decisions.md`, `protocol-notes.md`, `protocol-layman.md` |
| `025888f` | Surface LANE alignment (CLI/MCP/SDK), posture tests |
| `56f3cbd` | `examples/service-workflow-admission/`, `demo:service-workflow-admission`, product test |
| `539947d` / `0125173` | Misuse gates, protected-action fixture in demo |
| `ab382f7` | Hosted Admission Lock in `decisions.md` / `protocol-notes.md`, `claim-boundary` hosted-admission-lock matrix |

**Not landed at baseline:** golden-path docs, failureClass HTTP taxonomy, bootstrap CLI, http-profile module, tier-1 integrator platform, phase gate script, handler mutation walk, or any plan-specific architecture tests beyond workflow-admission boundary.

---

## Per-plan audit

### 04-01-PLAN: S1 dual-lane doctrine

**Baseline status of files_modified:**

| File | Exists? | Source | Matches plan task? |
|------|---------|--------|-------------------|
| `docs/internal/service-workflow-story.md` | YES | `61c17e2`, extended in branch | Partial — Passport/admission/handle story + non-authority flags; **no** Agent lane D-05 mapping table |
| `docs/internal/protocol-layman.md` | YES | pre-existing + `a1cd5e5` | Partial — Service Workflow Surface section; **no** shortened agent chain with schema-native names |
| `docs/internal/decisions.md` | YES | many commits incl. `ab382f7` | Partial — Hosted Admission Lock (`decisions.md:233-257`); **no** Clerk-for-agents / `run*Gateway` chain |
| `docs/internal/protocol-notes.md` | YES | `a1cd5e5`, `ab382f7` | Partial — hosted admission notes; **no** dual-enforcement cross-ref paragraph per T2 |
| `test/architecture/dual-enforcement-posture.test.ts` | NO | — | Not started |
| `test/architecture/claim-boundary.test.ts` | YES | `ab382f7` + prior | Partial — hosted-admission-lock matrix (`claim-boundary.test.ts:203-228`); **no** D-00 dual-enforcement / canonical-path additive tests from T3–T4 |

**Task-by-task:**

| # | Title | Status | Evidence | Gap |
|---|-------|--------|----------|-----|
| 1 | Agent lane vocabulary in service-workflow-story | **partially-done** | `service-workflow-story.md:27-53` non-authority flags; `service-workflow-story.md:67-84` protected-action boundary mentions gateway check | Missing parallel **Agent lane** section and D-05 table (Standing Bounds → `OperatingEnvelope`, etc.); `protocol-layman.md` lacks matching shortened chain |
| 2 | Clerk-for-agents dual enforcement in decisions + protocol-notes | **partially-done** | `decisions.md:233-257` Hosted Admission Lock; `claim-boundary.test.ts:203-228` hosted admission lock claims | Missing Clerk-for-agents request chain with `run*Gateway`; `grep run*Gateway docs/internal/decisions.md` → 0 matches |
| 3 | dual-enforcement-posture architecture test | **not-started** | File absent | Create test + extend claim-boundary per D-00 / D-00b |
| 4 | Canonical state path integrity check | **not-started** | `claim-boundary.test.ts` has projection/hosted tests but not T4 assertions | Add protocol-definition canonical path + agent-lane-additive-only tests |

**Plan summary:** 0 / 2 partial / 2 not-started / 0 / 0  
**Recommendation:** **revise** — planner should add “extend existing docs” notes so executor does not replace Passport/admission story or Hosted Admission Lock.  
**Justification:** Foundational service-workflow docs exist; plan tasks are additive gap-closure, not greenfield.

---

### 04-02-PLAN: S2 golden path product

**Baseline status of files_modified:**

| File | Exists? | Source | Matches plan task? |
|------|---------|--------|-------------------|
| `docs/internal/service-operator-golden-path.md` | NO | — | Not started |
| `docs/internal/developer-experience-index.md` | NO | — | Not started (also listed in CONTEXT canonical refs but missing repo-wide) |
| `examples/service-operator-golden-path/*` | NO | — | Not started |
| `package.json` | YES | `56f3cbd` | Partial — `demo:service-workflow-admission` present; no golden-path wrapper scripts |

**Task-by-task:**

| # | Title | Status | Evidence | Gap |
|---|-------|--------|----------|-----|
| 1 | Author service-operator-golden-path.md | **not-started** | File missing | Full doc: unified journey, Step 3 fork, D-09 contrast, proof-gap prose, failure table placeholder |
| 2 | Update developer-experience-index | **not-started** | File missing | Create single Start Here → golden path |
| 3 | Canonize demo:service-workflow-admission | **partially-done** | `package.json:95`; `test/product/service-workflow-admission.test.ts:14-76` proves demo output + non-authority boundary | Missing documentation in golden path + devex index (target docs do not exist) |
| 4 | Optional golden-path example wrapper | **not-started** | `examples/service-operator-golden-path/` absent | Create thin wrapper per plan |

**Plan summary:** 0 / 1 / 3 / 0 / 0  
**Recommendation:** **revise** — note T3 demo is runnable and tested; T1/T2 are net-new files, not updates.  
**Justification:** Executor should link to existing demo test fixtures rather than re-validating demo mechanics from zero.

---

### 04-03-PLAN: S3 atomic install bootstrap

**Baseline status:** All `files_modified` absent except `src/cli/command-manifest.ts`, `src/cli/index.ts`, `test/http/http.test.ts` (exist but without plan deliverables).

**Task-by-task:**

| # | Title | Status | Evidence | Gap |
|---|-------|--------|----------|-----|
| 1 | service-operator-bootstrap example | **not-started** | No `examples/service-operator-bootstrap/` | Full recipe |
| 2 | handshake service bootstrap CLI | **not-started** | No `src/cli/service/bootstrap.ts`; manifest has `doctor` only | CLI + manifest entry |
| 3 | Product + HTTP install path tests | **not-started** | `http.test.ts:403-459` happy-path install exists; no `service-operator-bootstrap.test.ts`; no orphan-catalog refusal | New tests + orphan assertions |
| 4 | Golden path copy-paste integration | **not-started** | Golden path doc missing | Blocked on 04-02 T1 |
| 5 | Idempotency smoke | **not-started** | — | — |

**Plan summary:** 0 / 0 / 5 / 0 / 0  
**Recommendation:** **proceed-as-is** (after 04-02 T1)  
**Justification:** No conflicting baseline implementation; x402 install-proposal adapter is the integration anchor per plan context.

---

### 04-04-PLAN: S4 agent-spine (recommended)

**Baseline status:** `src/cli/quickstart/agent-spine.ts`, tests, and `host-golden-paths-and-trace-guidance.md` all **absent**. (`host-golden-paths…` is referenced in CONTEXT canonical refs but not in repo.)

**Task-by-task:**

| # | Title | Status | Evidence | Gap |
|---|-------|--------|----------|-----|
| 1 | Implement quickstart agent-spine sequencer | **not-started** | — | — |
| 2 | Register recommended CLI command | **not-started** | `command-manifest.ts` has `doctor`; no `quickstart.agent-spine` | — |
| 3 | Anti-theatre sequencer tests | **not-started** | — | — |
| 4 | Bilateral cross-links in host golden path doc | **not-started** | Host golden path file missing entirely | Create doc + cross-links |

**Plan summary:** 0 / 0 / 4 / 0 / 0  
**Recommendation:** **proceed-as-is**  
**Justification:** Plan already lists host golden path as `files_modified`; executor creates missing canonical doc.

---

### 04-05-PLAN: S5 failure taxonomy HTTP

**Baseline status:** `transition-error-envelope.ts` exists but schema ends at line 38 with **no** `failureClass`, `failurePhase`, or `problemType` fields.

**Task-by-task:**

| # | Title | Status | Evidence | Gap |
|---|-------|--------|----------|-----|
| 1 | Extend TransitionErrorEnvelope schema | **not-started** | `transition-error-envelope.ts:27-38` — no failureClass | Full D-17/D-19 extension |
| 2 | HTTP status discipline mapping | **not-started** | `classifyTransitionError` uses legacy status logic | D-18 mapping |
| 3 | HTTP failure class test suite | **not-started** | No `transition-error-failure-class.test.ts` | — |
| 4 | OpenAPI documentation | **not-started** | OpenAPI lacks failureClass fields | — |
| 5 | Operator-visible failure table | **not-started** | Golden path missing | Blocked on 04-02 T1 |

**Plan summary:** 0 / 0 / 5 / 0 / 0  
**Recommendation:** **proceed-as-is**  
**Justification:** Clean extension point; no baseline drift.

---

### 04-06-PLAN: S6 failure parity (SDK/MCP)

**Task-by-task:**

| # | Title | Status | Evidence | Gap |
|---|-------|--------|----------|-----|
| 1 | Shared failureClass classifier module | **not-started** | No `src/protocol/foundation/failure-class.ts` | — |
| 2 | SDK HandshakeClientError + transport parsing | **not-started** | `src/sdk/client.ts` has no failureClass fields | Depends on 04-05 |
| 3 | Role-scoped client failure tests | **not-started** | Only `role-clients.test.ts` exists (unrelated) | — |
| 4 | MCP failureClass parity | **not-started** | No `mcp-failure-class-parity.test.ts` | Depends on 04-05 |

**Plan summary:** 0 / 0 / 4 / 0 / 0  
**Recommendation:** **proceed-as-is**

---

### 04-07-PLAN: S7 tier-1 integrator platform

**Task-by-task:**

| # | Title | Status | Evidence | Gap |
|---|-------|--------|----------|-----|
| 1 | integratorTier1 navigation metadata | **not-started** | `grep integratorTier1 src/protocol/navigation/index.ts` → 0 | Metadata-only tags |
| 2 | integrator-tier-1-transitions.md | **not-started** | File absent | — |
| 3 | integrator-tier-1-parity architecture test | **not-started** | File absent | — |
| 4 | SDK role-clients walkthrough test | **not-started** | File absent | — |

**Plan summary:** 0 / 0 / 4 / 0 / 0  
**Recommendation:** **proceed-as-is**

---

### 04-08-PLAN: S8 HTTP profile adapter platform

**Task-by-task:**

| # | Title | Status | Evidence | Gap |
|---|-------|--------|----------|-----|
| 1 | http-profile module extraction | **not-started** | No `src/adapters/http-profile/` | auth-md inlines HTTP fields in `action-proposal.ts:19-46` |
| 2 | Refactor auth-md to compose http-profile | **not-started** | Inline schema, no http-profile import | — |
| 3 | generic-gateway-skeleton definition_only probe | **not-started** | — | — |
| 4 | Orphan catalog compile failure test | **not-started** | No `http-profile-orphan-catalog.test.ts` | — |
| 5 | HTTP profile canonicalization test matrix | **not-started** | No `http-profile-canonicalization.test.ts` | — |

**Plan summary:** 0 / 0 / 5 / 0 / 0  
**Recommendation:** **proceed-as-is**

---

### 04-09-PLAN: S9 proof-gap honesty

**Task-by-task:**

| # | Title | Status | Evidence | Gap |
|---|-------|--------|----------|-----|
| 1 | Verify/extend golden-path proof-gap list | **not-started** | Golden path absent; no `Proof-gap` section in repo docs | Depends on 04-02 |
| 2 | proof-gap-honesty architecture test | **not-started** | File absent | — |
| 3 | external-adapter-sdk dual-enforcement checklist | **partially-done** | `examples/external-adapter-sdk/README.md:29-32` definition-only boundaries | Missing checklist with `run*Gateway`, catalog triplet, D-12 PEP glue |
| 4 | Tier-1 doc proof-gap runnable flags | **not-started** | `integrator-tier-1-transitions.md` absent | Depends on 04-07 |

**Plan summary:** 0 / 1 / 3 / 0 / 0  
**Recommendation:** **proceed-as-is**

---

### 04-10-PLAN: S10 custody & bilateral operations

**Task-by-task:**

| # | Title | Status | Evidence | Gap |
|---|-------|--------|----------|-----|
| 1 | Production acceptance matrix configured-by columns | **partially-done** | `decisions.md:182-200` Production Proof Ledger table exists | Missing `configuredBy: service_operator \| host_operator \| shared` column per D-21 |
| 2 | Bilateral setup sections in golden paths | **not-started** | Golden path + host golden path files missing | — |
| 3 | Doctor attestation framing in CLI/MCP | **not-started** | `grep attestationEvidence src/cli/host/doctor.ts` → 0 | Copy/field framing only |
| 4 | custody-matrix-parity architecture test | **not-started** | File absent | — |

**Plan summary:** 0 / 1 / 3 / 0 / 0  
**Recommendation:** **proceed-as-is**

---

### 04-11-PLAN: S11 bypass enforcement (minimal)

**Task-by-task:**

| # | Title | Status | Evidence | Gap |
|---|-------|--------|----------|-----|
| 1 | http-handler-mutation-gating architecture test | **not-started** | File absent; `workflow-admission-boundary.test.ts` covers surface boundary, not HTTP handler adapter walk | Create handler walk per D-24 |

**Plan summary:** 0 / 0 / 1 / 0 / 0  
**Recommendation:** **proceed-as-is**

---

### 04-12-PLAN: S12 E2E verification

**Task-by-task:**

| # | Title | Status | Evidence | Gap |
|---|-------|--------|----------|-----|
| 1 | service-operator-golden-path integration test | **not-started** | File absent | — |
| 2 | Two-tier product completion contracts | **not-started** | Operator/maintainer contract tests absent | — |
| 3 | check-service-agent-gating-phase.mjs | **not-started** | Script absent; no npm `check:service-agent-gating-phase` | — |
| 4 | Author 04-VERIFICATION.md | **not-started** | File absent | — |

**Plan summary:** 0 / 0 / 4 / 0 / 0  
**Recommendation:** **proceed-as-is**

---

## Updated wave graph

Wave graph **unchanged** from `04-PLANS-INDEX.md`. Baseline partial work does not satisfy wave outputs; dependencies remain valid.

```text
Wave 1:  04-01 ∥ 04-02          (both have partial baseline — execute gap-closure, not rewrite)
Wave 2:  04-03 ∥ 04-04          (depends on 01, 02)
Wave 3:  04-05
Wave 4:  04-06 ∥ 04-07          (06 after 05; 07 after 03)
Wave 5:  04-08                  (after 05)
Wave 6:  04-09 ∥ 04-10          (09 after 08; 10 after 02, 04)
Wave 7:  04-11                  (after 03, 07, 08)
Wave 8:  04-12                  (after 01–11)
```

**Execution note:** Wave 1 should treat 04-01 and 04-02 as **extend-in-place** given baseline docs and demo; do not revert `service-workflow-story.md` Passport narrative or `ab382f7` Hosted Admission Lock.

---

## Tasks the executor can skip

| Plan | Task | Why skip | File evidence |
|------|------|----------|---------------|
| — | — | **None** under strict acceptance criteria | No task meets full `<done>` criteria at baseline |

**Near-skip (executor should narrow scope, not skip):**

| Plan | Task | Narrow to |
|------|------|-----------|
| 04-02 | T3 | Document + link existing demo; re-run `npm run demo:service-workflow-admission` for verify — do not rebuild demo |
| 04-01 | T1–T2 | Additive sections only — preserve `service-workflow-story.md:1-116` and Hosted Admission Lock |

---

## Revision queue (handoff to gsd-planner)

| Plan | Task | Revision needed | Suggested fix |
|------|------|-----------------|---------------|
| 04-01 | T1, T2 | Integrate baseline | Add plan preamble: extend existing service-workflow docs; do not replace Passport flow; Clerk subsection is **additive** to Hosted Admission Lock |
| 04-02 | T1, T2, T3 | Integrate baseline | T3 verify step = doc + link work; reference existing `service-workflow-admission.test.ts` as acceptance anchor |
| — | — | CONTEXT canonical gap | `04-CONTEXT.md` lists `host-golden-paths-and-trace-guidance.md` and `developer-experience-index.md` as canonical but both are missing — plans 02/04/10 already create them; no plan rewrite required unless orchestrator wants CONTEXT updated |

No task-level **needs-revision** for wrong file paths or deleted-code references at this baseline.

---

## Coverage check vs 04-CONTEXT.md goals

| Goal / decision cluster | Covered by (plan tasks) | Baseline status |
|-------------------------|-------------------------|-----------------|
| D-00 dual enforcement (admission + gateway) | 04-01 T2–T3, 04-11 T1 | **Uncovered** — no dual-enforcement tests or Clerk chain |
| D-00b x402 proof wedge | 04-01 T3, 04-02 T1, 04-09 | **Partial** — demo + story mention x402 clearance; no golden-path prose |
| D-01–D-06 agent vocabulary / dual-lane docs | 04-01 T1, T4 | **Partial** — non-authority flags in story; no Agent lane mapping table |
| D-07–D-09 progressive onboarding | 04-02 T1, 04-03, 04-07 | **Uncovered** |
| D-08 atomic install | 04-03 | **Uncovered** |
| D-10–D-12 HTTP profile / hybrid adapters | 04-08 | **Uncovered** — auth-md inline only |
| D-13 runnable spine | 04-02, 04-03, 04-12 | **Partial** — admission demo only |
| D-14 proof-gap stubs (prose only) | 04-02 T1, 04-09 | **Uncovered** at doc level |
| D-15–D-16 Tier-1 integrator + sequencer | 04-07, 04-04 | **Uncovered** |
| D-17–D-20 failure taxonomy | 04-05, 04-06 | **Uncovered** |
| D-21–D-23 custody split | 04-10 | **Partial** — production proof ledger without configuredBy |
| D-24 bypass enforcement | 04-11 | **Uncovered** — workflow boundary test ≠ handler walk |
| D-25 launch gates deferred | 04-11, 04-12 | **Aligned** — manifest not present (correct deferral) |

**New baseline context not in original plans:** Phase 02 A2A negotiation surfaces on branch (`b2f277a`…`e710924`) — out of Phase 04 scope per CONTEXT; no new plan tasks required.

---

## Final recommendation

- [x] **Phase 04 plans need revision before execution:** YES (light revision — 04-01 and 04-02 integration notes only; not a full replan)
- [x] **If YES: dispatch gsd-planner to revise plans:** `04-01-PLAN.md`, `04-02-PLAN.md` (add baseline-integration preamble per Revision queue)
- [ ] **If NO: proceed directly to wave 1 execution**

**Suggested execution start (after light 04-01/04-02 plan patch):**

```text
Wave 1: 04-01 (gap-closure on existing docs) ∥ 04-02 (create golden path + devex index; narrow T3 to doc/link)
```

Operator checkpoint remains unavailable until waves 1–6 + plan 11 complete.

---

## Open questions for orchestrator

1. **`host-golden-paths-and-trace-guidance.md`** is listed in `04-CONTEXT.md` canonical refs but does not exist at `1e801b7`. Should Wave 2 plan 04 create it from scratch, or should a prior doc be restored from another branch before execution?
2. **`developer-experience-index.md`** is similarly missing but referenced as canonical. Confirm plan 02 T2 is the authoritative creation path (recommended: yes).

---

*Audit method: read-only inspection of all 48 plan tasks against HEAD file contents and git ancestry; no code modified.*
