# Phase 04 — Product / user perspective audit (GSD advisor synthesis)

**Status:** ✅ **Applied** to all `04-0N-PLAN.md`, `04-PLANS-INDEX.md`, and `04-DELIVERY-ARCHITECTURE.md` on 2026-05-28.

**Date:** 2026-05-28  
**Scope:** Comprehensive 12-plan delivery (`04-01` … `04-12`)  
**Method:** Five parallel `gsd-advisor-researcher` gray-area passes (dual-spine UX, doc sprawl, integrator overload, failure fragmentation, bypass/wave delay)  
**Audience:** Service operator (“gate agents on my API”), host operator, agent/automation loop — not protocol researchers

**Invariant at stake:** Operators must not believe agents are gated when only admission or host doctor ran. Product debt that reads like completeness but does not shorten TTHW is enforcement theatre.

---

## Executive verdict

The 12-plan engineering slice is **correct for custody and Clerk-for-agents truth**. The **product/user debt** is mostly **navigation, sequencing, and mandatory reading** — not missing subsystems.

| Verdict | Area |
|---------|------|
| **Keep (code + tests)** | Dual enforcement, atomic install (03), failureClass (05→06), Tier-1 parity (07), http-profile (08), handler mutation gating (11 minimal), phase gate (12) |
| **Reframe (docs + index)** | Two equal “Start Here” spines → one journey with step-3 custody fork; hub in existing index + workflow story, not 4+ new doc filenames |
| **Demote (operator mandatory)** | `handshake quickstart agent-spine` as convenience, not second required spine; proof-gap stubs as one paragraph, not runnable-shaped packages |
| **Defer or slim (maintainer-only)** | Plan 11 manifest + registry sync before operator E2E; bilateral runbook *files* until CLI/doctor output is stable |
| **Do not cut** | Plan 05→06 mechanical parity; plan 11 handler-walk test; runnable x402 service bootstrap |

**Brutal summary:** A payments-API operator should reach a gated route in **waves 1–3** (~plans 01–06), not after wave 7. Today’s index and plan deliverables imply they must survive integrator platform and bypass CI first — that is frustration debt, not safety.

---

## Persona: what “done” feels like

### Service operator (primary buyer)

**Success in &lt; 30 minutes:**

1. `developer-experience-index.md` → one **service-operator** section (not host/MCP rows first).
2. Plain flow: verify caller → admission → clearance (x402) → readback.
3. Run `demo:service-workflow-admission` or `handshake service bootstrap`.
4. One **failure table** (`failureClass` × safe retry × forbidden actions) for HTTP errors they see.

**Must not read first:** Tier-1 transition matrix, http-profile module, proof-gap stub READMEs, kernel architecture map, bypass manifest, ecosystem-strategy essays, `.planning/` scratch.

### Host operator (secondary, same phase)

**Success:** doctor → x402 quickstart → simulate (already in index).  
**Frustration to eliminate:** A second top-level “mandatory spine” that re-chains the same three commands under a new name.

### Agent / automation (user of failures)

**Success:** Same `failureClass` semantics whether the loop hit HTTP, MCP, or SDK — one golden-path matrix, not three cheat sheets.  
**Danger:** 403 on clearance → credential retry loops (OAuth BCP failure mode).

---

## Consolidated recommendations (apply before `/gsd-execute-phase`)

### 1. Unified operator journey (plans 02 + 04 + index)

| Current | Change |
|---------|--------|
| Dual runnable spines both labeled “required” / parallel Start Here | **One** `operator-journey` narrative (new section in golden path or workflow story): steps 1–2 shared (what Handshake is, dual enforcement), **step 3 fork** — “I operate the API” vs “I operate the agent host” |
| Plan 04 mandatory `quickstart agent-spine` | **Recommended** convenience command; discrete `host doctor` / `quickstart x402` / `simulate` remain canonical in index |
| `operator-product-completion-contract` requires agent-spine | Require **host branch runnable** (doctor + x402 quickstart), not necessarily the bundled sequencer |

**Keep under the hood:** `service bootstrap`, `agent-spine` CLI, both demos — custody split stays real (D-21/D-22).

### 2. Documentation debt elimination (plans 01, 02, 07, 10)

| Planned new file | Recommendation |
|------------------|----------------|
| `service-operator-golden-path.md` | **Primary TTHW content** — OK as one file **or** major section in `service-workflow-story.md` + index anchors; not both plus 3 siblings |
| `integrator-tier-1-transitions.md` | **Appendix only** — one link from golden path “Advanced”; never in Start Here |
| `service-operator-runbook.md` / `host-operator-runbook.md` | **Defer file creation** to post-execute (plan 10): ship matrix + doctor behavior first; prose runbooks when CLI output is stable |
| Plan 01 `protocol-definition` / `ecosystem-strategy` dual-lane expansion | **Cut** — record vocabulary in `decisions.md` / `protocol-notes.md`; tests carry doctrine |
| Bulk `protocol-layman.md` rewrite | **Cut unless** user-facing terms change — link from index |

**Hub rule:** Extend `developer-experience-index.md` + `service-workflow-story.md`; avoid 8 parallel internal doc entry points.

### 3. Integrator platform vs operator TTHW (plans 07–09)

| Plan | Operator-visible? | Recommendation |
|------|-------------------|----------------|
| 07 Tier-1 | No (first session) | **Execute** navigation tags + parity tests; **hide** doc behind “Advanced” |
| 08 http-profile | No | **Execute** for plan 11 + auth.md composition; not golden-path reading |
| 09 proof-gap stubs | **Harmful** if shaped like quickstarts | **Eliminate standalone stub packages**; replace with golden-path **proof-gap list** (auth.md, package-install, registry) + arch test that they stay `runnable: false` |

**Do not move 07–09 to phase 05** unless you also defer plan 11 — plan 11 depends on 07+08.

### 4. One failure story (plans 05 + 06 + 02)

| Current | Change |
|---------|--------|
| 05 = HTTP, 06 = SDK/MCP (two learning surfaces) | **05 delivers operator-visible matrix** in golden path + devex index |
| 06 | **Implementation-only** parity proof — same `failure-class.ts`, tests prove rows match |
| New `handshake failures explain` CLI | **Defer** — extend `explainHandshakeError` / `nextHandshakeCommand` to consume `failureClass` first (plan 06) |
| Defer MCP/SDK parity | **Reject** — agent spine + MCP loops need parity in same phase |

### 5. Wave order / maintainer debt (plans 11 + 12)

| Current | Change |
|---------|--------|
| Full plan 11 (manifest, sync, conformance, pack slice) before plan 12 E2E | **Minimal 11:** `http-handler-mutation-gating.test.ts` (handler walk) **before** 12; **defer** manifest + registry sync + conformance skeleton to post-operator gate or phase 05 |
| Plan 12 waits for all 11 tasks | **Split contract:** `operator-product-completion` after 01–06 + 03 + 10 matrix; `maintainer-completion` adds 11 full + 12 |

**Optional:** Social “phase 04 operator shipped” after wave 3–4; maintainer lane completes waves 5–8.

### 6. Mandatory agent-spine (plan 04)

| Issue | Fix |
|-------|-----|
| Duplicates P0 commands already in gold-standard devex | Demote to **recommended**; document as “runs doctor → x402 → simulate in order” |
| Service operator sees second required spine | Journey fork makes host branch explicit; service path never mentions agent-spine in first 30 minutes |

---

## First 30 minutes — canonical path (target state)

```text
README / npm install
  → developer-experience-index (Service operator section)
  → service-operator golden path (or workflow story + section)
  → demo:service-workflow-admission  OR  handshake service bootstrap
  → skim failureClass table (HTTP only)
  → (optional) Advanced → integrator-tier-1 appendix
```

**Host branch (only if they operate MCP/host):** same index → fork step 3 → `host doctor` → `quickstart x402` → `simulate` (or optional `quickstart agent-spine`).

---

## Plan-by-plan edit checklist

| Plan | User-facing change |
|------|-------------------|
| **01** | Drop ecosystem/protocol-definition prose expansion; keep arch tests |
| **02** | Add unified journey + step-3 fork; service-first index; failure matrix stub for plan 05; D-09 contrast without new doc sprawl |
| **03** | Unchanged runnable core; link only from golden path |
| **04** | agent-spine **recommended**; anti-theatre tests stay; no second Start Here |
| **05** | Add golden-path failure table deliverable |
| **06** | Label “parity only”; wire repair helpers to `failureClass` |
| **07** | Tier-1 doc = appendix link; tags/tests unchanged |
| **08–09** | Execute code; 09 stubs → prose proof-gap list + tests, no fake quickstart dirs |
| **10** | Matrix + doctor in phase; runbook **files** post-execute |
| **11** | Handler-walk required before 12; manifest/sync optional/deferred |
| **12** | Two-tier gate: operator completion vs full phase completion |

---

## What not to eliminate (user frustration ≠ safety)

- Dual enforcement tests and claim boundaries (plan 01)
- Runnable service bootstrap + install HTTP tests (plan 03)
- failureClass on HTTP + SDK + MCP (plans 05–06)
- Tier-1 parity tests (plan 07) — integrators need this; operators do not read it day one
- http-profile + auth.md refactor (plan 08) — prevents wrong-family copy-paste
- Handler mutation gating test (plan 11 minimal)
- Honest blocked proof gates (live x402 paid retry, registry, host containment) — **do not** greenwash

---

## Frustration scorecard (before vs after edits)

| Dimension | Before (12-plan as written) | After recommended edits |
|-----------|----------------------------|-------------------------|
| “Where do I start?” | 2+ equal spines | 1 journey, step-3 fork |
| Docs to open | 8+ internal files | 2 hubs + 1 golden path + appendix |
| Time to first gated route | After wave 7–8 narrative | Waves 1–3 runnable |
| Failure learning | 3 transports implied | 1 table + repair helpers |
| Host operator | Mandatory new sequencer | Same commands, optional bundle |
| Proof-gap stubs | Look like broken quickstarts | Explicit non-runnable list |

---

## Next steps

1. ~~Patch plans~~ **Done.**
2. Re-run `gsd-plan-checker` on patched plans (D-09 still in plan 02; handler walk satisfies D-24 for operator tier).
3. `/gsd-execute-phase 04-service-agent-gating` — Wave 1: **01 ∥ 02**; optional operator checkpoint after wave 6.

---

## Advisor agent references (internal)

| Gray area | Agent ID |
|-----------|----------|
| Dual-spine UX | `fed27db6-b35f-4acd-ad0d-96ed1049a49d` |
| Doc sprawl | `d138ec5f-7780-49ed-8949-e21dc2a849e7` |
| Integrator overload | `54e3c8eb-d4b1-4b46-bfcf-c7a1d8a36fbc` |
| Failure fragmentation | `69ede836-fe17-4646-82ab-8f0d08719067` |
| Bypass / waves | `509bccfb-a5a4-4dc3-be1d-9b88593efbf2` |
