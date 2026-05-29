---
phase: 04-service-agent-gating
fixed_at: 2026-05-29T09:20:00Z
review_path: .planning/phases/04-service-agent-gating/04-REVIEW.md
iteration: 1
findings_in_scope: 9
fixed: 9
skipped: 0
status: all_fixed
---

# Phase 04: Code Review Fix Report

**Fixed at:** 2026-05-29
**Source review:** `.planning/phases/04-service-agent-gating/04-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 9 (4 HIGH + 5 MEDIUM; H-03 doc-only; L-01/L-02 out of scope)
- Fixed: 9
- Skipped: 0

## Fixed Issues

### H-01: Policy-decision refusals misclassified as proof_gap

**Files modified:** `src/protocol/foundation/failure-class/index.ts`, `src/protocol/foundation/reason-codes.ts`
**Commit:** `62757b6`, `c7bba7e`
**Applied fix:** `failureClassFromReasonCodeMetadata` branches on `decisionPolarity` for `policy_decision`; negative policy codes tagged `decisionPolarity: "refusal"` in the reason-code registry. Parity tests in `test/protocol/failure-class-taxonomy.test.ts`.

### H-02: Over-broad "proof" substring match

**Files modified:** `src/protocol/foundation/failure-class/index.ts`
**Commit:** `62757b6`
**Applied fix:** Removed `code.includes("proof")` heuristic; classification uses metadata kind/phase and explicit registry fields. Custody `gateway_custody_proof_*` codes regress to `internal`, not `proof_gap`.

### H-04: SDK loses taxonomy on non-envelope HTTP errors

**Files modified:** `src/sdk/surface-clients/transport.ts`, `src/sdk/client.ts`, `src/surfaces/boundary-manifest.ts`
**Commit:** `8674616`, `c7bba7e`
**Applied fix:** `failureClassFromHttpStatus` when envelope parse fails; SDK tests for empty/malformed 401/409/422 bodies. Surface manifest allows `protocol/foundation/failure-class` for sdk.* transport roots.

### M-01: Dual-enforcement test doc-grep only

**Files modified:** `test/architecture/dual-enforcement-posture.test.ts`
**Commit:** `abde73b`
**Applied fix:** Top-of-file and `describe()` label clarify doctrine-prose guard, not runtime bypass proof.

### M-02: Recovery reason-code path ignores refusal polarity

**Files modified:** `src/protocol/foundation/failure-class/index.ts`
**Commit:** `62757b6`
**Applied fix:** `failureClassFromReasonCodeMetadata` recovery branch uses `options.proofRef` like protocol-error path.

### M-03: Auth.md gateway preflight throws generic Error

**Files modified:** `src/adapters/auth-md/gateway.ts`
**Commit:** `dfd6531`
**Applied fix:** Unsafe observed parameters return structured `gateway_check_refused` with reason codes instead of `new Error()`.

### M-04: requireInstallProposalGatewayRegistryEntry throws plain Error

**Files modified:** `src/install/install-proposal/index.ts`
**Commit:** `50721dd`
**Applied fix:** Throws `HandshakeProtocolError("install_orphan_catalog_missing_gateway", …, 422)`. Test in `test/install/install-proposal-gateway-registry.test.ts`.

### M-05: Unknown protocol errors default to internal

**Files modified:** `src/protocol/foundation/failure-class/index.ts`, `src/http/errors/transition-error-envelope.ts`
**Commit:** `62757b6`, `c7bba7e`
**Applied fix:** Unknown 4xx → `protected_action_refusal` (or `proof_gap` with `proofRef`); registered HTTP shaping codes stay `internal` with preserved 400/404/413 status.

### Regression fix (Hono HTTP status collapse)

**Files modified:** `src/http/errors/transition-error-envelope.ts`, `src/protocol/foundation/failure-class/index.ts`, `test/http/transition-error-failure-class.test.ts`
**Commit:** `c7bba7e`
**Applied fix:** `failureClassForProtocolError` treats non-admission HTTP registry codes as `internal` so M-05 defaults do not map `invalid_request`/`record_not_found` to 409.

## Skipped Issues

None — all in-scope findings were fixed.

## Out of scope (verified)

- **H-03:** No golden-path doc claims that arbitrary integrator services are structurally gate-enforced; no edits required.
- **L-01, L-02:** Not touched.

---

_Fixed: 2026-05-29_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
