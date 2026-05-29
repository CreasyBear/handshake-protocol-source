---
phase: 04-service-agent-gating
verified: 2026-05-29T12:00:00Z
status: passed
score: 13/13
overrides_applied: 0
note: >-
  Frontmatter reconciled by orchestrator after the post-verification regression
  cleanup + guard-fix passes (final code HEAD c7bba7e; re-verified tsc 0,
  bun test 794 pass / 3 fail, tier gates 10/10 + 15/15). The original verifier
  frontmatter (passed-with-gaps, 35 failures, 91 tsc errors) predated cleanup
  and is preserved in the body's "Independent Verifier Findings" section as the
  pre-cleanup snapshot. See "Regression cleanup" + "Revised status" below and
  04-REGRESSION-TRUTH.md for empirical ground truth.
gaps:
  - truth: "MCP Registry discoverability verified"
    status: partial
    reason: "Documented external proof gap in AGENTS.md; not faked green. Closable only on registry acceptance + lookup verification (not a Phase 04 regression)."
    missing:
      - "Registry acceptance and lookup verification when channel is live"
  - truth: "Every consequential route adapter-wrapped (full inventory)"
    status: partial
    reason: "D-25 manifest honestly deferred to Phase 05; D-24 structural gating limited to handler allowlist + adapter-gated example runners (not a Phase 04 regression)."
    missing:
      - "service-mutation-route-manifest module and inventory gate"
  - truth: "Whole-repo manifest coverage (every export mapped)"
    status: partial
    reason: "Pre-existing at baseline 1e801b7 (failed before Phase 04). ./hosted-admission + ./surfaces/service-workflow-admission export mapping. Not a Phase 04 regression; carried to Phase 05."
    missing:
      - "Map ./hosted-admission and ./surfaces/service-workflow-admission to manifest surfaces"
deferred:
  - truth: "Service mutation route manifest enforcement"
    addressed_in: "Phase 05"
    evidence: "04-CONTEXT.md D-25; http-handler-mutation-gating.test.ts comment lines 6-8"
  - truth: "Whole-repo manifest export coverage"
    addressed_in: "Phase 05"
    evidence: "Pre-existing baseline gap; 04-REGRESSION-TRUTH.md section C"
health_reverified:
  tsc_errors: 0
  bun_test: "794 pass / 3 fail (2 environmental gitignored-file fragility, 1 pre-existing manifest-coverage)"
  tier_operator: "10/10"
  tier_full: "15/15"
  baseline_comparison: "baseline-or-better (baseline 1e801b7: 3 tsc errors, 22 test failures)"
human_verification: []
---

# Phase 04 verification — service-operator dual-enforcement gating

## Executor verification (preserved)

Two-tier sign-off: **operator tier** (TTHW / service-operator ship) and **full tier**
(maintainer completeness). Manifest-based mutation inventory remains deferred to Phase 05.

### Operator tier success

Service operators can:

1. Follow [service-operator-golden-path.md](../../docs/internal/service-operator-golden-path.md) with Step 3 fork, Branch A bootstrap, proof-gap honesty, and failureClass table.
2. Run `handshake service bootstrap` (or `examples/service-operator-bootstrap/run.ts`) with idempotent compiled-records registration.
3. Read bilateral setup order in golden paths without standalone runbook files.
4. Use doctor attestation output (host + MCP) as binding digest evidence only — not authority.
5. Rely on handler mutation gating architecture test for first-party HTTP read-only posture and adapter-gated example runners.

Mechanical sign-off:

```bash
node scripts/check-service-agent-gating-phase.mjs --tier operator
# or: npm run check:service-agent-gating-phase
```

### Maintainer tier success (additive)

Everything in operator tier, plus:

- Integrator Tier-1 transition parity and walkthrough tests
- HTTP profile canonicalization and orphan-catalog refusal tests
- SDK/MCP failureClass parity
- Maintainer product completion contract (manifest still absent)

Mechanical sign-off:

```bash
node scripts/check-service-agent-gating-phase.mjs --tier full
# or: npm run check:service-agent-gating-phase:full
```

### Subsystem checklist (S1–S12 → plans 01–12)

| Subsystem | Plan | Operator tier | Full tier |
| --- | --- | --- | --- |
| Dual-lane doctrine | 01 | required | required |
| Golden path docs | 02 | required | required |
| Service bootstrap | 03 | required | required |
| Agent-spine CLI | 04 | optional convenience | required test if present |
| Failure taxonomy HTTP | 05 | required | required |
| SDK/MCP failureClass | 06 | required | required |
| Integrator Tier-1 | 07 | appendix exists | parity tests |
| HTTP profile platform | 08 | module exists | full adapter tests |
| Proof-gap honesty | 09 | required | required |
| Custody & bilateral ops | 10 | required | required |
| Handler mutation gating | 11 | required | required |
| Operator E2E gate | 12 | required | required |

### Explicit non-goals (phase 04)

- Kernel protocol changes or second runnable clearance path beyond buyer-side `x402_payment.exact`
- Stub example directories for auth.md or package-install proof-gap families
- Mandatory `handshake quickstart agent-spine` for operator sign-off
- `service-operator-runbook.md` / `host-operator-runbook.md` standalone files
- `service-mutation-route-manifest` module or registry sync script (Phase 05)
- Fake green gates for blocked proof surfaces (hosted operation, registry discoverability, marketplace trust)

### Deferred to Phase 05

- Full mutation route manifest and `check-product-completion` inventory slice
- Standalone operator runbook extraction from golden path sections
- Complete [host-golden-paths-and-trace-guidance.md](../../docs/internal/host-golden-paths-and-trace-guidance.md) expansion beyond phase-04 stub pointer

### Product user audit

Applied patches from `04-PRODUCT-USER-AUDIT.md` (2026-05-28): no proof-gap stub packages,
bilateral sections in golden paths, two-tier phase gate, agent-spine optional on operator tier.

**Executor frontmatter claim:** `status: passed` — independent audit finds gate contract met but repo-wide proof gaps remain (see below).

---

## Independent Verifier Findings

**Verified:** 2026-05-29  
**Branch:** phase-04-service-agent-gating @ 3db4730 (+ verifier fix pending commit)  
**Verifier:** gsd-verifier (goal-backward, adversarial)

### Phase goal (04-CONTEXT.md)

Deliver a complete agent-first operator product for any-service agent gating — doctrine, runnable spine, atomic install, failure taxonomy, Tier-1 integrator platform, HTTP adapter platform, custody runbooks, and **structural bypass enforcement** — without weakening the kernel. x402 remains the only runnable clearance wedge.

### Goal-decomposition checklist

| ID | Deliverable / invariant / D-decision | Status | Evidence |
| --- | --- | --- | --- |
| G0 | Phase goal: agent-first operator product spine | **verified** | 15/15 phase gate; golden path + bootstrap integration tests |
| D-00 | Dual enforcement: admission + gateway; ingress-only advisory | **verified** | `service-operator-golden-path.md:20-31`; `dual-enforcement-posture.test.ts` |
| D-00b | x402 proof wedge, not payment-only product | **verified** | `dual-enforcement-posture.test.ts:60-72`; `proof-gap-honesty.test.ts` |
| D-01–D-06 | Vision→protocol mapping + dual-lane docs | **verified** | `claim-boundary.test.ts`; service-workflow story patterns in gate docs |
| D-07–D-08 | Progressive catalog triplet + atomic install; orphan refused | **verified** | `service-operator-bootstrap.test.ts`; `http-profile-orphan-catalog.test.ts:35-36` |
| D-09 | Full day-one envelope reserved (not default) | **verified** | Golden path progressive onboarding prose; bootstrap CLI scope |
| D-10–D-12 | HTTP profile hybrid; auth.md prototype; PEP optional | **verified** | `src/adapters/http-profile/`; `http-profile-canonicalization.test.ts` |
| D-13 | One runnable spine (x402 reference) | **verified** | `service-operator-golden-path.test.ts`; proof-gap honesty forbids second runnable paths |
| D-14 | Proof-gap stubs non-runnable | **verified** | `proof-gap-honesty.test.ts` forbids stub example dirs |
| D-15 | Tier-1 integrator transition parity | **verified** | `integrator-tier-1-parity.test.ts` (full tier) |
| D-16 | Recipe sequencer non-authority | **verified** | `cli-agent-spine-sequencer.test.ts:16-35` |
| D-17–D-20 | failureClass taxonomy + HTTP status discipline | **verified** | `failure-class.ts:51-55`; `transition-error-envelope.ts:102-124`; gate classifier tests |
| D-21–D-23 | Custody matrix + bilateral order + doctor attestation | **verified** | `custody-matrix-parity.test.ts` |
| D-24 | Structural bypass enforcement (not docs-only) | **partial** | Handler allowlist + example runners + conformance; no route manifest |
| D-25 | Launch bypass packets deferred | **verified (honest deferral)** | Explicit in CONTEXT + gate script comments |

### Dual-enforcement structural finding (central claim)

**Verdict: STRUCTURAL at the adapter enforcement boundary; PARTIAL at full-service route inventory.**

Handshake enforcement for protected mutation is **not** admission-only. The structural chain is:

1. **HTTP kernel surface is read-only** — all handlers under `src/http/handlers/` are allowlisted read/evidence routes; direct mutation patterns are forbidden (`http-handler-mutation-gating.test.ts:48-68`).

2. **Example service mutation paths require `run*Gateway` before downstream effect** — `examples/x402-protected-spend/run.ts`, `examples/package-install-end-to-end/run.ts`, `examples/auth-md-protected-call/run.ts` must import/call `run*Gateway` (`http-handler-mutation-gating.test.ts:71-79`).

3. **Adapter gateway functions gate before mutation** — e.g. `runX402WalletGateway` calls `protocol.gatewayCheck` and returns without signing/mutating when `verifiedGatewayCheckFromResult` fails (`src/adapters/x402-payment/wallet-gateway.ts:198-213`); same pattern in repo-write, package-install, preview-deploy, auth-md gateways.

4. **Conformance contract rejects adapters that mutate without VerifiedGatewayCheck** — `checkProtectedMutationAdapterConformance` fails unsafe probes (`test/conformance/protected-mutation-adapter-conformance.test.ts:39-47`).

**What is NOT yet structural:** inventory of every consequential HTTP route on an arbitrary integrator service (D-25 manifest deferred). Dual-enforcement posture test (`dual-enforcement-posture.test.ts`) validates **doctrine prose**, not runtime bypass of an unwrapped route. That gap is honestly deferred, not hidden.

**Not advisory:** admission middleware alone cannot authorize mutation because first-party HTTP handlers do not mutate, and runnable demos route through adapter gateway checks.

### Independent command results

**Operator tier gate** — PASS (10/10):

```text
node scripts/check-service-agent-gating-phase.mjs --tier operator
All 10 checks passed for tier operator.
```

**Full tier gate** — PASS (15/15):

```text
node scripts/check-service-agent-gating-phase.mjs --tier full
All 15 checks passed for tier full.
```

**Full test suite** — NOT GREEN:

```text
bun test  →  745 pass, 35 fail, 780 tests (HEAD @ 3db4730)
baseline 1e801b7  →  704 pass, 18 fail, 722 tests
```

**TypeScript** — NOT CLEAN:

```text
npx tsc --noEmit  →  91 errors (HEAD)
baseline 1e801b7  →  3 errors
```

Primary ripple: `gatewayRegistryEntry: null` in orphan-catalog compiled records vs non-null types in fixtures (`test/sdk/role-clients.test.ts`, `test/support/x402-negotiation-fixture.ts`).

### http.test.ts D-18 — pre-existing vs introduced

| Case | Baseline `1e801b7` | HEAD before verifier fix | Assessment |
| --- | --- | --- | --- |
| Stale hosted identity | Expected 412 | Updated to 409 + `failureClass: stale_admission` (`http.test.ts:896-902`) | **Phase 04 intentional D-18 alignment** — passes |
| Recovery terminal conflict + proofRef | Expected 409; **passed** | Classifier returns 422 (`failure-class.ts:53-55`, `transition-error-envelope.ts:120-121`); integration still expected 409 | **Phase 04 introduced** — contradicts gate unit test |

`04-DEVIATIONS.md` claim of "pre-existing" is **overstated** for recovery terminal conflict. Expired-identity case was resolved in phase; recovery conflict was classifier change without integration test update.

**Verifier fix (iteration 1):** updated `http.test.ts` recovery conflict case to expect **422** + `failureClass: proof_gap` + `failurePhase: transition` (aligns with `transition-error-failure-class.test.ts:75-84`). Not committed per verifier no-commit rule for planning artifacts; test fix staged in working tree.

### Coherence invariant spot-check

| AGENTS.md / 04 invariant | Spot-check | Verdict |
| --- | --- | --- |
| No advisory-claimed-as-structural | Docs + tests state admission alone is advisory; enforcement at `run*Gateway` | **honest** |
| Greenlight is one-use | Gateway replay tests in x402 wallet gateway + MCP parity replay_refusal | **enforced in wedge tests** (not re-audited exhaustively) |
| Receipt distinguishes gateway check from downstream | `runX402WalletGateway` separates `gatewayCheck` outcome from `signatureEvidence` / reconciliation paths | **enforced in adapter spine** |
| Proof gaps recorded honestly | `proof-gap-honesty.test.ts`; MCP registry not faked; manifest deferred | **enforced** |

### Executor claim cross-check

| Executor claim | Independent result |
| --- | --- |
| 48/48 tasks, tier gates green | **Confirmed** — 10/10 operator, 15/15 full independently |
| `status: passed` in executor frontmatter | **Overstated** — phase gate passed; full suite + tsc + manifest/MCP gaps remain |
| http.test.ts deferral pre-existing | **Partially false** — recovery conflict is phase-introduced |

### Fix iterations

| # | Change | Commit |
| --- | --- | --- |
| 1 | Align `http.test.ts` recovery terminal conflict expectations with D-18 classifier (422 + proof_gap) | **not committed** (verifier policy: no commit) |

### Final independent status

**`passed-with-gaps`**

Phase 04 achieves the operator/maintainer tier contract: dual-enforcement doctrine, runnable x402 bootstrap, failureClass taxonomy, Tier-1 parity, HTTP profile scaffolding, custody matrix, and adapter-level structural gating — all confirmed by independently re-run gates.

Remaining gaps are documented honestly: MCP registry proof gap, deferred mutation-route manifest, 35 full-suite failures (+17 vs baseline), 91 TypeScript errors (+88 vs baseline), and doc-grep-only dual-enforcement posture for arbitrary services.

### Open questions for orchestrator

1. Should Phase 05 treat `tsc --noEmit` cleanliness as a hard gate, or remain bun-test-only?
2. Should the recovery-conflict http.test fix be committed as `fix(04-verify): align recovery conflict HTTP status with D-18` before merge?
3. Full-suite 35 failures include many repo-naming-posture and x402 integration tests — triage which are phase regressions vs intentional posture tightening.

---

## Regression cleanup (orchestrator-adjudicated, post-verification)

The verifier's open questions #1 and #3 were resolved by establishing empirical
ground truth: the full `bun test` suite was run at baseline `1e801b7` in an
isolated worktree and set-diffed against HEAD. See `04-REGRESSION-TRUTH.md`.

**Finding:** the executor + first fixer mislabeled phase-introduced failures as
"pre-existing." Baseline had **22** failures; Phase 04 *fixed 19* but
*introduced 14*. Of the 17 remaining after the first tsc-fix pass, only 3 were
genuinely pre-existing; 12 were phase-introduced and fixable; 2 were
environmental (local gitignored `.DS_Store` / `.agents` absent in clean checkout).

**Resolution (two Composer fix passes):**

| Pass | Cleared | Commits |
| --- | --- | --- |
| tsc + test contracts | 91→0 tsc errors; 35→17 failures | `2a46970 920e38a 86e0758 401a866 3840c25 6b06c6a` + D-18 `06c6214` |
| naming + MCP + CLI evidence | 17→3 failures (all 12 phase-introduced cleared) | `2acddf1 bafc2ee a85f93b 738a34c 42b1fb3` |

Notable doctrine fixes: renamed banned `src/cli/service` bucket → `service-operator`;
moved `failure-class.ts` into a subdir to clear the foundation loose-file threshold;
**renamed the D-15 "Tier 1" integrator concept → "integrator parity"** to honor the
AGENTS.md ban on planning-stage labels in repo-facing surfaces (behavioral contract
preserved; surface label only); realigned MCP reference transcript + import roots +
CLI evidence surface to the Phase 04 failureClass taxonomy. No `as any`, no
test-weakening, no D-decision violations.

### Corrected final health (independently re-verified at `42b1fb3`)

| Metric | Baseline `1e801b7` | Final `42b1fb3` | Verdict |
| --- | --- | --- | --- |
| `npx tsc --noEmit` | 3 errors | **0 errors** | better |
| `bun test` | 22 fail | **3 fail** | much better |
| Tier operator | — | **10/10 PASS** | green |
| Tier full | — | **15/15 PASS** | green |

The 3 residual failures are NOT phase regressions:
- `repo naming posture > keeps workspace metadata junk` — local `.DS_Store` (absent in clean CI checkout).
- `repo naming posture > keeps deleted scratch documents` — local `.agents/` + `skills-lock.json` gstack install (gitignored; absent in clean CI checkout).
- `manifest coverage > maps each product surface export …` — **pre-existing** (failed at baseline); deferred to Phase 05 (`./hosted-admission`, `./surfaces/service-workflow-admission` export mapping).

In a clean CI checkout the first two do not exist, leaving the single pre-existing
manifest-coverage gap — honestly carried into Phase 05.

### Revised status

**`passed`** for the Phase 04 goal and health bar (baseline-or-better on tsc and
tests; both tier gates green). One pre-existing manifest-coverage gap and the
MCP-Registry proof gap remain documented and deferred to Phase 05 — neither is a
Phase 04 regression.

---

_Verified: 2026-05-29_  
_Verifier: gsd-verifier (independent goal-backward audit)_  
_Regression truth + cleanup adjudication: orchestrator, 2026-05-29_
