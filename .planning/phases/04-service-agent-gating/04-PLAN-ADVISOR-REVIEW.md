# Phase 04 — Plan advisor review (full lens)

**Date:** 2026-05-28  
**Calibration:** `full_maturity`  
**Lens:** Six parallel `gsd-advisor-researcher` passes against `04-01`–`04-06` vs phase goal in `04-CONTEXT.md`

**Superseded:** User rejected MVP framing. Replaced by **12-plan comprehensive delivery** — see `04-DELIVERY-ARCHITECTURE.md`, `04-PLANS-INDEX.md`, plans `04-01`–`04-12`.

## Verdict (historical — pre-replan)

**Your concern was right for the original 6-plan slice.** That slice was a **strong MVP integrator-enablement slice**, not a **shippable “clone any service and gate agents” product**. That is **consistent with locked constraints** (kernel frozen, x402-only runnable, D-25 deferral) but **under-delivers the marketing phrase “any service”** unless you add **2–3 targeted plan augmentations** before execute.

| Dimension | Plans deliver? | MVP risk |
|-----------|----------------|----------|
| Clerk-for-agents framing + anti-middleware theatre | Yes (01 + arch tests) | Low |
| Public failure taxonomy (agent retries) | Mostly (02); gap on MCP/SDK parity | Medium |
| Tier-1 integrator surface | Yes (03) | Low |
| HTTP extensibility foundation | Yes (04 schema + stubs) | Low if positioned as transport layer only |
| Custody split | Yes (05 docs) | Low for phase scope |
| Structural bypass proof | **Floor only** (06 manifest) | **High** — inventory ≠ enforcement |
| **Executable service onboarding** | **No** | **High** — D-08 doc-only |
| **Service-side runnable spine** | **No** (x402 agent-side only) | **High** — Clerk “route handler” gap |

## Recommended augmentations (before `/gsd-execute-phase`)

Priority order — smallest mechanism that closes the largest honesty gap:

### 1. Plan 07 (or expand 01 + 03): **InstallClient bootstrap** — closes D-08 executability

- One x402-only script/recipe: `compileX402InstallProposal` → `InstallClient.registerInstallProposalCompiledRecords`
- Linked from `service-operator-golden-path.md` as the **service operator** copy-paste step (not host MCP)
- **Advisor consensus:** (A) alone teaches vocabulary; **(A)+(B)** is lowest-regret

### 2. Plan 07 (or expand 01): **Service-side admission demo canon** — closes Clerk route-handler gap

- Canonize existing `npm run demo:service-workflow-admission` in golden path + devex index
- Optional thin `examples/service-operator-golden-path/` wrapper if README drift is bad
- **Not** A2A room as template (wrong abstraction)
- **Advisor consensus:** x402 quickstart + docs = **middleware side only** without this

### 3. Expand 06: **D-24 floor + structural walk** — not manifest-only theatre

- Keep manifest schema (A)
- **Add:** conformance/architecture test walking `src/http/handlers` (or registry) for unwrapped mutation posture (D)
- **Defer:** full `pack:check` inventory for all services (D-25)

### 4. Expand 02: **MCP failure parity** — agent-complete failure surface

- Add task: MCP stdio / x402 proposal errors align with `failureClass` retry semantics (C)
- Optional: SDK `HandshakeClientError` carries `failureClass` (B) if SDK is same release train

### 5. Plan 03: **Mandatory** `quickstart agent-spine` (not optional) — if agent host is co-equal persona

- Only if you want stronger agent TTHW in same phase; does **not** fix service-operator gap alone

## What to keep as intentionally MVP (do not expand without new phase)

- Second runnable golden path (auth.md, package install live)
- Generic HTTP-only gateway claiming full REST coverage
- Manifest wired to every customer production route table (operator-specific)
- Full RFC 9457 dual `application/problem+json` mode
- Turning blocked proof gates green

## Phase goal reframing (honest)

| Claim | Honest after current 6 plans | Honest after augmentations 1–4 |
|-------|------------------------------|--------------------------------|
| “Integrators won’t mistake admission for protection” | Yes | Yes |
| “Agents get safer HTTP failure semantics” | Mostly | Yes |
| “Any service can gate agents” (operator TTHW) | **Narrative + patterns** | **Narrative + one runnable service bootstrap + one admission demo** |
| “Bypass impossible without adapters” | **Scaffold + examples** | **Scaffold + handler walk** |

## Per-plan advisor notes

| Plan | Adequate for locked decisions? | MVP slice? | Suggested action |
|------|-------------------------------|------------|------------------|
| 01 | D-01–D-06 yes; D-07–D-09 prose only | Yes for onboarding | Add bootstrap link or plan 07 |
| 02 | D-17–D-20 HTTP yes | Partial for agents | Add MCP parity task |
| 03 | D-15–D-16 yes | No if sequencer optional | Make sequencer mandatory OR accept doc-only Tier-1 |
| 04 | D-10–D-11–D-14 yes | No if sold as “any REST” | Keep; position as transport + stubs |
| 05 | D-21–D-23 yes | No | Execute as written |
| 06 | D-24 floor; D-25 defer OK | **Yes for bypass depth** | Add handler-walk test |

## Split alternative (if “any service” is non-negotiable this milestone)

**04a** — current six plans (docs, taxonomy, tier-1, profile, custody, manifest floor)  
**04b** — runnable service reference: InstallClient bootstrap + admission demo + handler conformance walk + optional manifest↔registry dogfood

Only choose split if you will **commit to 04b** before claiming operator product complete.

---

*Synthesized from advisor runs: phase granularity, plan 01 onboarding, plan 06 bypass, runnable spine, HTTP profile, plan 02 failures.*
