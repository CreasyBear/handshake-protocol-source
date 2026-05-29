---
phase: 05-product-coherence
fixed_at: 2026-05-29T00:00:00Z
review_path: .planning/phases/05-product-coherence/05-REVIEW.md
iteration: 1
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 05: Code Review Fix Report

**Fixed at:** 2026-05-29  
**Source review:** `.planning/phases/05-product-coherence/05-REVIEW.md`  
**Iteration:** 1

**Summary:**
- Findings in scope: 2 (HR-01, MR-01 — same hunk)
- Fixed: 2
- Skipped: 0

## Fixed Issues

### HR-01: MCP maps intent-compilation refusals to proof_gap

**Files modified:** `src/protocol/foundation/failure-class/index.ts`, `test/protocol/failure-class-taxonomy.test.ts`  
**Commit:** `e60fc87`  
**Applied fix:** Removed hand-maintained MCP override block; `classifyFailureClassFromReasonCode` resolves registered codes via `failureClassFromReasonCodeMetadata` before unregistered prefix fallbacks. Registry `kind: "refusal"` → `protected_action_refusal`.

### MR-01: mcp_candidate_digest_missing forced to proof_gap

**Files modified:** `src/protocol/foundation/failure-class/index.ts`, `test/protocol/failure-class-taxonomy.test.ts`  
**Commit:** `e60fc87`  
**Applied fix:** Same registry-first path; `transition_error` → `internal`.

---

_Fixed: 2026-05-29_  
_Fixer: Claude (gsd-code-fixer)_  
_Iteration: 1_
