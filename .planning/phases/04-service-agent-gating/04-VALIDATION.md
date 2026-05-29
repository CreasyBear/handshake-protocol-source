---
phase: 04
slug: service-agent-gating
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-28
replanned: 2026-05-28
plans: 12
tasks: 48
product_user_audit: applied-2026-05-28
---

# Phase 04 — Validation Strategy (comprehensive 12-plan delivery)

> Per-phase validation contract for feedback sampling during execution. Maps 48 tasks across plans 01–12 (post product/user audit patch).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | bun test |
| **Config file** | none (bun native) |
| **Phase gate command** | `node scripts/check-service-agent-gating-phase.mjs` (plan 12) |
| **Quick run command** | `bun test test/architecture/dual-enforcement-posture.test.ts` |
| **Full suite command** | `bun test` |
| **Estimated runtime** | ~150 seconds full suite; targeted subsets 5–20s |

---

## Sampling Rate

- **After every task commit:** Run the task `<automated>` verify command from PLAN.md
- **After every wave:** `bun test test/architecture test/http test/adapters test/cli test/conformance test/integration test/product test/sdk test/mcp`
- **Before `/gsd-verify-work`:** `node scripts/check-service-agent-gating-phase.mjs` then full `bun test`
- **Max feedback latency:** 30 seconds (targeted files)

---

## Per-Task Verification Map

### Plan 01 — dual-lane doctrine (S1)

| Task ID | Plan | Wave | Requirement | Threat Ref | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | D-05, D-06, D-01–D-04 | T-04-01-01 | architecture | `bun test test/architecture/claim-boundary.test.ts` | ✅ extend | ⬜ pending |
| 04-01-02 | 01 | 1 | D-00, D-12 | T-04-01-02 | doc+grep | `grep -v '^#' docs/internal/protocol-definition.md \| grep -c 'run\*Gateway'` | — | ⬜ pending |
| 04-01-03 | 01 | 1 | D-00, D-00b | T-04-01-03 | architecture | `bun test test/architecture/dual-enforcement-posture.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-04 | 01 | 1 | D-06 | T-04-01-01 | architecture | `bun test test/architecture/claim-boundary.test.ts` | ✅ extend | ⬜ pending |

### Plan 02 — service-operator golden path (S2)

| Task ID | Plan | Wave | Requirement | Threat Ref | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------|-------------------|-------------|--------|
| 04-02-01 | 02 | 1 | D-05, D-13 | T-04-02-01 | doc+grep | `test -f docs/internal/service-operator-golden-path.md && grep -q 'Step 3' docs/internal/service-operator-golden-path.md && grep -q 'Branch A' docs/internal/service-operator-golden-path.md` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | D-13, D-22 | — | doc+grep | `grep -v '^#' docs/internal/developer-experience-index.md \| grep -c 'service-operator-golden-path'` | ✅ extend | ⬜ pending |
| 04-02-03 | 02 | 1 | D-13 | T-04-02-02 | integration | `npm run demo:service-workflow-admission` | ✅ | ⬜ pending |
| 04-02-04 | 02 | 1 | D-07, D-13 | T-04-02-01 | example | `bun run examples/service-operator-golden-path/run.ts` | ❌ W0 | ⬜ pending |

### Plan 03 — atomic install bootstrap (S3)

| Task ID | Plan | Wave | Requirement | Threat Ref | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------|-------------------|-------------|--------|
| 04-03-01 | 03 | 2 | D-07, D-08 | T-04-03-02 | product | `bun test test/product/service-operator-bootstrap.test.ts` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 2 | D-08, D-13 | T-04-03-01 | product | `bun test test/product/service-operator-bootstrap.test.ts` | ❌ W0 | ⬜ pending |
| 04-03-03 | 03 | 2 | D-08 | T-04-03-02 | http+product | `bun test test/product/service-operator-bootstrap.test.ts test/http/http.test.ts` | ✅ extend | ⬜ pending |
| 04-03-04 | 03 | 2 | D-08, D-13 | — | doc+grep | `grep -v '^#' docs/internal/service-operator-golden-path.md \| grep -c 'service bootstrap'` | ❌ W0 | ⬜ pending |
| 04-03-05 | 03 | 2 | D-08 | T-04-03-02 | product | `bun test test/product/service-operator-bootstrap.test.ts` | ❌ W0 | ⬜ pending |

### Plan 04 — agent-host spine (S4)

| Task ID | Plan | Wave | Requirement | Threat Ref | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------|-------------------|-------------|--------|
| 04-04-01 | 04 | 2 | D-16, D-13 | T-04-04-01 | cli | `bun test test/cli/cli-agent-spine-sequencer.test.ts` | ❌ W0 | ⬜ pending |
| 04-04-02 | 04 | 2 | D-16 | T-04-04-01 | architecture | `bun test test/architecture/cli-command-posture.test.ts` | ✅ | ⬜ pending |
| 04-04-03 | 04 | 2 | D-16 | T-04-04-02 | cli | `bun test test/cli/cli-agent-spine-sequencer.test.ts` | ❌ W0 | ⬜ pending |
| 04-04-04 | 04 | 2 | D-22, D-23 | T-04-04-03 | doc+grep | `grep -v '^#' docs/internal/host-golden-paths-and-trace-guidance.md \| grep -c 'host doctor'` | ✅ extend | ⬜ pending |

### Plan 05 — failure taxonomy HTTP (S5)

| Task ID | Plan | Wave | Requirement | Threat Ref | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------|-------------------|-------------|--------|
| 04-05-01 | 05 | 3 | D-17, D-19 | T-04-05-01 | http | `bun test test/http/transition-error-failure-class.test.ts` | ❌ W0 | ⬜ pending |
| 04-05-02 | 05 | 3 | D-18 | T-04-05-01 | http | `bun test test/http/transition-error-failure-class.test.ts` | ❌ W0 | ⬜ pending |
| 04-05-03 | 05 | 3 | D-17, D-18, D-20 | T-04-05-03 | http | `bun test test/http/transition-error-failure-class.test.ts` | ❌ W0 | ⬜ pending |
| 04-05-04 | 05 | 3 | D-19 | — | openapi | `bun test test/http/openapi-contract.test.ts` | ✅ | ⬜ pending |
| 04-05-05 | 05 | 3 | D-17, D-18 | — | doc+grep | `grep -v '^#' docs/internal/service-operator-golden-path.md \| grep -c 'failureClass'` | ❌ W0 | ⬜ pending |

### Plan 06 — failure taxonomy multi-surface (S6)

| Task ID | Plan | Wave | Requirement | Threat Ref | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------|-------------------|-------------|--------|
| 04-06-01 | 06 | 4 | D-17 | — | http | `bun test test/http/transition-error-failure-class.test.ts` | ❌ W0 | ⬜ pending |
| 04-06-02 | 06 | 4 | D-17, D-18 | T-04-06-02 | sdk | `bun test test/sdk/role-clients-failure-class.test.ts` | ❌ W0 | ⬜ pending |
| 04-06-03 | 06 | 4 | D-17, D-20 | T-04-06-03 | sdk | `bun test test/sdk/role-clients-failure-class.test.ts` | ❌ W0 | ⬜ pending |
| 04-06-04 | 06 | 4 | D-17, D-19 | T-04-06-01 | mcp | `bun test test/mcp/mcp-failure-class-parity.test.ts test/mcp/mcp-x402-proposal.test.ts` | ❌ W0 | ⬜ pending |

### Plan 07 — tier-1 integrator platform (S7)

| Task ID | Plan | Wave | Requirement | Threat Ref | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------|-------------------|-------------|--------|
| 04-07-01 | 07 | 4 | D-15 | T-04-07-02 | architecture | `bun test test/architecture/integrator-tier-1-parity.test.ts` | ❌ W0 | ⬜ pending |
| 04-07-02 | 07 | 4 | D-15, D-07, D-08 | — | doc+grep | `grep -v '^#' docs/internal/integrator-tier-1-transitions.md \| grep -c 'first 30 minutes'` | ❌ W0 | ⬜ pending |
| 04-07-03 | 07 | 4 | D-15 | T-04-07-02 | architecture | `bun test test/architecture/integrator-tier-1-parity.test.ts` | ❌ W0 | ⬜ pending |
| 04-07-04 | 07 | 4 | D-16 | T-04-07-01 | sdk | `bun test test/sdk/role-clients-walkthrough.test.ts` | ❌ W0 | ⬜ pending |

### Plan 08 — HTTP profile adapter platform (S8)

| Task ID | Plan | Wave | Requirement | Threat Ref | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------|-------------------|-------------|--------|
| 04-08-01 | 08 | 5 | D-10, D-11 | T-04-08-02 | adapter | `bun test test/adapters/http-profile-canonicalization.test.ts` | ❌ W0 | ⬜ pending |
| 04-08-02 | 08 | 5 | D-11 | — | adapter | `bun test test/adapters/http-profile-canonicalization.test.ts test/adapters/x402-bypass-probes.test.ts` | ✅ | ⬜ pending |
| 04-08-03 | 08 | 5 | D-10, D-12 | T-04-08-01 | adapter | `bun test test/adapters/http-profile-canonicalization.test.ts` | ❌ W0 | ⬜ pending |
| 04-08-04 | 08 | 5 | D-08, D-10 | T-04-08-03 | adapter | `bun test test/adapters/http-profile-orphan-catalog.test.ts` | ❌ W0 | ⬜ pending |
| 04-08-05 | 08 | 5 | D-10 | T-04-08-02 | adapter | `bun test test/adapters/http-profile-canonicalization.test.ts` | ❌ W0 | ⬜ pending |

### Plan 09 — proof-gap honesty (S9)

| Task ID | Plan | Wave | Requirement | Threat Ref | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------|-------------------|-------------|--------|
| 04-09-01 | 09 | 6 | D-14, D-13 | T-04-09-01 | doc+grep | `grep -q 'Proof-gap' docs/internal/service-operator-golden-path.md && ! test -d examples/auth-md-protected-api-stub` | ❌ W0 | ⬜ pending |
| 04-09-02 | 09 | 6 | D-14, D-13 | T-04-09-01 | architecture | `bun test test/architecture/proof-gap-honesty.test.ts` | ❌ W0 | ⬜ pending |
| 04-09-03 | 09 | 6 | D-00, D-12 | T-04-09-02 | doc+grep | `grep -v '^#' examples/external-adapter-sdk/README.md \| grep -c 'run\*Gateway'` | ✅ extend | ⬜ pending |
| 04-09-04 | 09 | 6 | D-14 | — | doc+grep | `grep -v '^#' docs/internal/integrator-tier-1-transitions.md \| grep -c 'runnable'` | ❌ W0 | ⬜ pending |

### Plan 10 — custody bilateral operations (S10)

| Task ID | Plan | Wave | Requirement | Threat Ref | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------|-------------------|-------------|--------|
| 04-10-01 | 10 | 6 | D-21 | T-04-10-02 | architecture | `bun test test/architecture/custody-matrix-parity.test.ts` | ❌ W0 | ⬜ pending |
| 04-10-02 | 10 | 6 | D-22 | — | doc+grep | `grep -v '^#' docs/internal/service-operator-golden-path.md \| grep -c 'Bilateral' && ! test -f docs/internal/service-operator-runbook.md` | ❌ W0 | ⬜ pending |
| 04-10-03 | 10 | 6 | D-23 | T-04-10-01 | cli | `bun test test/cli/cli-mcp-doctor.test.ts` | ✅ | ⬜ pending |
| 04-10-04 | 10 | 6 | D-21, D-22 | T-04-10-02 | architecture | `bun test test/architecture/custody-matrix-parity.test.ts` | ❌ W0 | ⬜ pending |

### Plan 11 — bypass enforcement minimal (S11)

| Task ID | Plan | Wave | Requirement | Threat Ref | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------|-------------------|-------------|--------|
| 04-11-01 | 11 | 7 | D-24 | T-04-11-01 | architecture | `bun test test/architecture/http-handler-mutation-gating.test.ts` | ❌ W0 | ⬜ pending |

### Plan 12 — operator E2E verification (S12)

| Task ID | Plan | Wave | Requirement | Threat Ref | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------|-------------------|-------------|--------|
| 04-12-01 | 12 | 8 | D-13, D-08 | T-04-12-02 | integration | `bun test test/integration/service-operator-golden-path.test.ts` | ❌ W0 | ⬜ pending |
| 04-12-02 | 12 | 8 | D-24, D-25 | T-04-12-01 | architecture | `bun test test/architecture/operator-product-completion-contract.test.ts` | ❌ W0 | ⬜ pending |
| 04-12-03 | 12 | 8 | D-00, D-24 | T-04-12-01 | script | `node scripts/check-service-agent-gating-phase.mjs --tier operator` | ❌ W0 | ⬜ pending |
| 04-12-04 | 12 | 8 | D-00–D-25 | T-04-12-03 | doc+grep | `grep -v '^#' .planning/phases/04-service-agent-gating/04-VERIFICATION.md \| grep -c 'operator tier'` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements (new test files — create during first owning task)

> Post product/user audit (2026-05-28): stub example dirs, standalone runbooks, manifest module, and conformance expansion are **not** Wave 0 for phase 04 — see [04-PLANS-INDEX.md](./04-PLANS-INDEX.md) deferred table.

- [ ] `test/architecture/dual-enforcement-posture.test.ts`
- [ ] `test/architecture/integrator-tier-1-parity.test.ts`
- [ ] `test/http/transition-error-failure-class.test.ts`
- [ ] `test/sdk/role-clients-failure-class.test.ts`
- [ ] `test/sdk/role-clients-walkthrough.test.ts`
- [ ] `test/mcp/mcp-failure-class-parity.test.ts`
- [ ] `test/adapters/http-profile-canonicalization.test.ts`
- [ ] `test/adapters/http-profile-orphan-catalog.test.ts`
- [ ] `test/architecture/proof-gap-honesty.test.ts`
- [ ] `test/architecture/custody-matrix-parity.test.ts`
- [ ] `test/architecture/http-handler-mutation-gating.test.ts`
- [ ] `test/product/service-operator-bootstrap.test.ts`
- [ ] `test/cli/cli-agent-spine-sequencer.test.ts`
- [ ] `test/integration/service-operator-golden-path.test.ts`
- [ ] `test/architecture/operator-product-completion-contract.test.ts`
- [ ] `scripts/check-service-agent-gating-phase.mjs`
- [ ] `docs/internal/service-operator-golden-path.md`
- [ ] `docs/internal/integrator-tier-1-transitions.md`
- [ ] `src/adapters/http-profile/` (module)
- [ ] `src/protocol/foundation/failure-class.ts`
- [ ] `src/cli/service/bootstrap.ts`
- [ ] `src/cli/quickstart/agent-spine.ts`
- [ ] `examples/service-operator-bootstrap/`
- [ ] `examples/service-operator-golden-path/`

**Deferred to phase 05 (not Wave 0 here):** `service-mutation-route-manifest`, `http-profile-adapter-conformance`, maintainer completion contract expansion.

**Eliminated (audit):** `proof-gap-recipe-stub.test.ts`, stub example dirs, standalone `service-operator-runbook.md` / `host-operator-runbook.md`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Operator golden path readability | D-05, D-13 | Doc sell-test | Read `service-operator-golden-path.md` for Clerk analogy and complete product chain |
| Bilateral setup operator walkthrough | D-22 | Human sequencing validation | Follow bilateral sections in golden path + host golden path (standalone runbooks post-execute) |

---

## Validation Sign-Off

- [x] All 48 tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING test references
- [x] No watch-mode flags
- [x] Feedback latency < 30s (targeted bun test)
- [x] `nyquist_compliant: true`
- [x] Comprehensive 12-plan delivery (not MVP slice)

**Approval:** approved 2026-05-28 (comprehensive replan)
