# Phase 04 — Regression Ground Truth (orchestrator-adjudicated)

**Method:** Ran the full `bun test` suite at baseline `1e801b7` in an isolated
git worktree and set-diffed against current HEAD `06c6214`. This is empirical
ground truth, not the executor's or first-fixer's self-report.

## Headline

- Baseline `1e801b7`: **22 test failures**, 3 tsc errors.
- After Phase 04 + first regression-fix pass (`6b06c6a`): **17 test failures**, **0 tsc errors**.
- Phase 04 **fixed 19** baseline failures but **introduced 14 new** ones.
- Net count (22→17) masked a near-complete turnover of *which* tests fail.

The first fixer labeled all 17 "pre-existing baseline debt." That is **false**.
Only **3** are pre-existing. **12 are phase-introduced and fixable**. 2 are
environmental test-fragility (local gitignored files).

## Classification (authoritative)

### A. Phase-introduced + FIXABLE (12) — MUST clear before ship

| # | Failing test | Root cause (evidence) | Fix direction |
|---|---|---|---|
| 1 | `repo naming posture > keeps source paths named by owned concepts instead of buckets` | Phase 04 created `src/cli/service/` — `service` is a banned bucket segment in `naming-posture.test.ts` (`bannedSourcePathSegments`). | Rename dir `src/cli/service/` → `src/cli/service-operator/` (segment `service-operator` is NOT banned). Update all imports, manifest sourceRoots, boundary allowlists, tests. Only file inside is `bootstrap.ts`. |
| 2 | `repo naming posture > keeps source directories below the loose-file threshold` | Phase 04 added `failure-class.ts` → `src/protocol/foundation/` now has 8 loose `.ts` files (limit 7). | Move `failure-class.ts` → `src/protocol/foundation/failure-class/index.ts` (dir import `foundation/failure-class` still resolves). Restores loose count to 7. Update relative imports if needed. |
| 3 | `repo naming posture > keeps internal planning-stage labels out of repo-facing surfaces` | Phase 04 D-15 "Tier-1 integrator" work leaked the banned stage label `Tier 1` into `src/protocol/navigation/index.ts` and `test/architecture/integrator-tier-1-parity.test.ts`. AGENTS.md doctrine forbids planning-stage labels (Tier N) in repo-facing surfaces. | **LOCKED RENAME (orchestrator decision):** rename the integrator "Tier 1" concept to a doctrine-compliant label that contains no `tier`. Use **`integrator parity`** / symbol `integratorParity` (was `integratorTier1`). Rename the test file `integrator-tier-1-parity.test.ts` → `integrator-parity.test.ts`. Preserve D-15 BEHAVIORAL intent (which integrators get parity + the parity checks); only the surface label changes. If the D-15 plan text locks the literal string "Tier 1" as a required exported symbol, STOP and write `04-FIX-HALT.md`. |
| 4 | `repo naming posture > keeps references to deleted documentation trees out of repo-facing surfaces` | `src/protocol/foundation/reason-code-remediation/index.ts` (new in Phase 04) references a deleted docs tree matching `docs/(adr\|audits\|business\|plans\|product\|protocol\|reference\|specs)` or `00-product-requirements-spine`. | Remove/repoint the stale docs reference to a canonical path (`docs/internal/...`) or drop it. |
| 5–9 | `MCP x402 reference transcript > …` (5 cases) | Phase 04 plan 04-06 (MCP failureClass parity) changed MCP behavior/output; the source-owned reference transcript + its CLI-readback pairing drifted. | Regenerate/realign the reference transcript fixtures (`src/mcp/reference-transcript*.ts`) to current MCP behavior. Ensure every row pairs with an existing CLI readback command. Do NOT expand MCP authority — transcript is evidence only. |
| 10–11 | `CLI evidence surface > exposes only active non-mutating command metadata …` and `> returns structured non-authority usage errors …` | Phase 04 added CLI commands (service-operator bootstrap, agent-spine, etc.) not registered in the evidence-surface allowlist / metadata. | Register new commands in the CLI command manifest / evidence surface so metadata + non-authority usage errors are exposed. Keep them non-mutating / non-authority. |
| 12 | `surface boundary posture > enforces allowed internal import roots for existing surface implementation roots` | `src/mcp/output.ts` and `src/mcp/x402-proposal.ts` import `../protocol/foundation/failure-class` — outside `mcp.runtime`'s allowed import roots. (0 such imports at baseline; 1 each now.) | Either (a) add `protocol/foundation/failure-class` to mcp.runtime allowed roots in the boundary manifest if doctrine permits, or (b) re-export failureClass through a root mcp is already allowed to import. Prefer the path that keeps the manifest honest. Coordinate with fix #2 (failure-class becomes a dir). |

### B. Environmental test-fragility (2) — NOT Phase 04's fault, do NOT chase

These fail in ANY working-dir run (including baseline-in-working-dir) because of
local gitignored files absent from a clean checkout. They are pre-existing test
design fragility, deferred to Phase 05 keel audit — NOT this fix pass.

| Failing test | Why environmental |
|---|---|
| `repo naming posture > keeps workspace metadata junk out of active repo surfaces` | Local `.DS_Store` files (macOS). Removed root+test ones as hygiene; they regenerate. |
| `repo naming posture > keeps deleted scratch documents out of the active tree` | `.agents/` + `skills-lock.json` are the local gstack skills install (gitignored). Not a tracked tree artifact. |

### C. Genuinely pre-existing (3) — out of scope (failed at baseline too)

- `CLI self-hosted activation readbacks > reads self-hosted packet artifacts as evidence without becoming an authority surface`
- `Self-hosted activation packet > emits one install-and-prove packet with APS, CLI, and MCP process evidence`
- `manifest coverage > maps each product surface export to a manifest surface with matching sourceRoots`

## Target after corrective pass

- tsc: keep **0** (or ≤3).
- bun test: **≤ 5 failures** (the 2 environmental + 3 pre-existing = 5 acceptable ceiling; ideally lower if environmental ones are quieted).
- Tier gates: operator 10/10 + full 15/15 must stay green.
- No `as any` / type-weakening. No naming-posture test weakening to force a pass.
