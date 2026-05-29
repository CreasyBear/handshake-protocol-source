# Phase 04 Code Review

**Reviewer:** gsd-code-reviewer · **Date:** 2026-05-29 · **Range:** 1e801b7..979b99c

## Summary

**Verdict: SHIP-WITH-FIXES**

Phase 04 delivers honest dual-enforcement doctrine, a runnable x402 service-operator bootstrap, adapter-level gateway gating on first-party surfaces, and fail-closed orphan-catalog refusal at the install transition. Nullable `gatewayRegistryEntry` guards refuse or throw — no silent null-skip on the gateway path was found. Tier gates (10/10 operator, 15/15 full) pass.

The main risk is **failureClass taxonomy drift**: several policy-refusal reason codes classify as `proof_gap` (422) instead of `protected_action_refusal` (409), which violates D-17/D-18 and can mislead MCP/SDK integrators on retry semantics. Structural bypass proof for arbitrary integrator HTTP routes remains deferred (D-25).

| Severity | Count |
| --- | --- |
| CRITICAL | 0 |
| HIGH | 4 |
| MEDIUM | 5 |
| LOW | 2 |

---

## CRITICAL

_No CRITICAL findings. Nullable gateway-registry guards fail loud; first-party mutation paths remain adapter-gated._

---

## HIGH

### H-01. Policy-decision refusals misclassified as `proof_gap` — `src/protocol/foundation/failure-class/index.ts:75-76,132-133`

- **Invariant at stake:** D-17/D-18 — clearance refusals must not map to generic forbidden or proof-gap HTTP semantics; `failureClass` must separate auth, admission, refusal, replay, and proof gap.
- **Problem:** For `metadata.kind === "policy_decision"`, codes without `"refusal"` or `"refused"` in the string (e.g. `envelope_not_active`, `action_class_outside_envelope`, `prior_action_not_greenlit`, `contract_expired`) classify as `proof_gap`. These are policy denials from `policy-greenlight/policy.ts`, not missing-evidence gaps. MCP/SDK consumers using `classifyFailureClassFromReasonCodes` will surface 422-style semantics and `read_evidence` retry guidance for hard refusals.
- **Fix:** Treat negative policy-decision codes as `protected_action_refusal` unless explicitly tagged `proof_gap` in reason-code metadata (e.g. add `decisionPolarity: "refusal" | "pass" | "proof_gap"` to reason-code registry, or maintain an explicit refusal set). Add parity tests for `envelope_not_active`, `action_class_outside_envelope`, and `prior_action_not_greenlit`.

### H-02. Over-broad `"proof"` substring match — `src/protocol/foundation/failure-class/index.ts:146`

- **Invariant at stake:** failureClass taxonomy integrity across HTTP + MCP; proof gaps must not be used to soften operational/custody failures.
- **Problem:** `code.includes("proof")` matches custody and transition errors such as `gateway_custody_proof_custody_mismatch` (metadata kind `transition_error`) after the metadata switch falls through. These become `proof_gap` instead of `protected_action_refusal` or `internal`.
- **Fix:** Remove the substring heuristic; rely on `resolveProtocolReasonCodeMetadata` kind/phase, explicit prefix sets, or a dedicated `failureClass` field on reason-code entries. Add regression tests for `gateway_custody_proof_*` codes.

### H-03. D-24 structural enforcement stops at first-party handlers — `test/architecture/http-handler-mutation-gating.test.ts:6-79`

- **Invariant at stake:** D-00/D-24 — ingress/admission alone is advisory; every consequential route on an integrator service must be adapter-wrapped and gateway-checked.
- **Problem:** Mutation gating is proven for `src/http/handlers/**` (read-only allowlist) and three example runners only. An integrator deploying Handshake HTTP routes outside this inventory can still expose unwrapped mutation endpoints. Phase gate passes; arbitrary-service bypass posture is not structurally enforced (honestly deferred as D-25, but the gap is real).
- **Fix:** Phase 05 `service-mutation-route-manifest` + CI gate; until then, golden-path docs should avoid implying full-service structural proof. Consider a conformance scaffold that fails closed when new handler files appear outside the allowlist without manifest entry.

### H-04. SDK loses taxonomy on non-envelope HTTP errors — `src/sdk/surface-clients/transport.ts:73-93`, `src/sdk/client.ts:325-340`

- **Invariant at stake:** D-17 — public failure surface must expose typed `failureClass` on all protected-action error paths.
- **Problem:** When the HTTP body is empty, malformed, or not `TransitionErrorResponseSchema`, both transports synthesize `code: "http_error"` with `failureClass` from `failureClassForProtocolError(...)` → typically `internal`. A proxy or middleware returning HTML/empty 403/409 strips refusal/replay/proof-gap classification from `HandshakeClientError` and `explainHandshakeError`.
- **Fix:** Preserve HTTP status in a dedicated field; map status bands (401→auth, 409→refusal/replay, 422→proof_gap) when envelope parse fails. Record `proof_gap` when classification is indeterminate rather than defaulting to `internal`. Add SDK tests for malformed-body 409/422 responses.

---

## MEDIUM

### M-01. Dual-enforcement “structural” test is doc-grep only — `test/architecture/dual-enforcement-posture.test.ts:20-58`

- **Invariant at stake:** D-00 — do not conflate admission with enforcement; structural claims need runtime evidence.
- **Problem:** The test validates prose patterns in markdown, not that an integrator HTTP service cannot mutate without `run*Gateway`. This is appropriate as a doctrine guard but can be mistaken for runtime bypass proof.
- **Fix:** Rename or annotate test intent (`doctrine-prose`); pair with D-25 manifest gate for runtime claims. Keep doc test; do not cite it as structural enforcement evidence.

### M-02. Recovery reason-code path ignores refusal polarity — `src/protocol/foundation/failure-class/index.ts:134-135` vs `79-80`

- **Invariant at stake:** Receipt honesty — recovery conflicts with `proofRef` are proof gaps; without proofRef they are refusals.
- **Problem:** `classifyFailureClassFromReasonCode` always returns `proof_gap` for `metadata.kind === "recovery"`, while `classifyFailureClassFromProtocolError` branches on `error.metadata.proofRef`. MCP reason-code-only paths can misclassify recovery refusals.
- **Fix:** Align reason-code classifier with protocol-error branch (check associated proofRef when available, or tag recovery codes with expected failureClass in reason-code metadata).

### M-03. Auth.md gateway preflight throws generic `Error` — `src/adapters/auth-md/gateway.ts:253-260`

- **Invariant at stake:** Gateway check is the enforcement boundary; unsafe observed parameters must produce structured refusal/proof-gap evidence, not uncaught exceptions.
- **Problem:** `assertNoGatewayUnsafeObservedParameters` throws `new Error(...)` instead of returning a typed gateway refusal result. Callers may not record refusal/proof-gap receipts or attach `failureClass`.
- **Fix:** Return the same structured refusal shape used by other adapters (e.g. x402 wallet gateway early return with reason codes) or throw `HandshakeProtocolError` with appropriate metadata refs.

### M-04. `requireInstallProposalGatewayRegistryEntry` throws plain `Error` — `src/install/install-proposal/index.ts:35-41`

- **Invariant at stake:** Nullable registry handling must fail loud with typed, reconstructable outcomes.
- **Problem:** CLI compile paths (`src/cli/x402/index.ts:323-325`) call this helper; an uncaught throw surfaces as generic 500/internal rather than `install_orphan_catalog_missing_gateway` refusal. Kernel transition path correctly refuses at `install-setup/transitions.ts:37-41`.
- **Fix:** Throw `HandshakeProtocolError("install_orphan_catalog_missing_gateway", ..., 422)` or return null and let caller refuse with typed reason codes. Add CLI test for orphan compiled records.

### M-05. Unknown protocol errors default to `internal` — `src/protocol/foundation/failure-class/index.ts:88-91`

- **Invariant at stake:** Missing evidence must be recorded as proof gap, not smoothed over; unknown clearance failures must not look like server misconfiguration.
- **Problem:** HandshakeProtocolError without metadata, reason-code metadata, or 5xx status becomes `failureClass: "internal"`. New refusal codes added without metadata registration silently degrade to internal until metadata is updated.
- **Fix:** Default unknown 4xx to `protected_action_refusal` (or `proof_gap` when `proofRef` present); reserve `internal` for 5xx and explicit misconfiguration codes. Fail CI when new reason codes lack metadata.

---

## LOW

### L-01. Schema validation errors use `failureClass: internal` with HTTP 400 — `src/http/errors/transition-error-envelope.ts:171-187`

- **Invariant at stake:** D-18 HTTP status discipline.
- **Problem:** `invalid_request` returns 400 with `failureClass: "internal"`, which is semantically odd for client malformed input (not server internal error).
- **Fix:** Introduce `failureClass: "auth"` or a dedicated client-error class, or document 400+internal as intentional for malformed transition bodies.

### L-02. Generic HTTP profile skeleton is honestly non-mutating — `src/adapters/http-profile/generic-gateway-skeleton.ts:13-23`

- **Invariant at stake:** Do not claim structural enforcement where only transport validation exists.
- **Problem:** Low risk — skeleton returns `definition_only` + `generic_http_profile_live_mutation_forbidden`. Integrators could still wire it as a live gateway without reading posture.
- **Fix:** Export type branding or runtime guard that rejects mutation attempts at call sites; keep tests asserting proof-gap code.

---

## Enforcement-doctrine checklist

| Lens | Verdict | Evidence |
| --- | --- | --- |
| 1. Enforcement vs advisory | **PASS (scoped)** | Golden path + bootstrap explicitly non-authority (`src/cli/service-operator/bootstrap.ts:179-184,207-210`); HTTP handlers read-only (`http-handler-mutation-gating.test.ts`); example runners require `run*Gateway`. Admission alone not claimed as enforcement. |
| 2. One-use greenlight | **PASS (wedge)** | `consumeGreenlight` returns `already_consumed`; MCP maps replay codes (`src/mcp/x402-proposal.ts:302-316`); agent-spine forbids greenlight reuse claims (`test/cli/cli-agent-spine-sequencer.test.ts:23-25`). Not exhaustively re-audited across all adapters. |
| 3. Gateway bypass | **PARTIAL** | First-party HTTP + 3 example runners gated; runtime ingress refuses unsafe dispatch shapes (`src/runtime/ingress/families.ts:304-318`). No inventory for arbitrary integrator routes (D-25 deferred). |
| 4. failureClass taxonomy integrity | **FAIL (fixable)** | HTTP envelope path solid for tested codes (`transition-error-failure-class.test.ts`); MCP parity tests cover subset (`mcp-failure-class-parity.test.ts`). Policy-decision misclassification (H-01, H-02). |
| 5. Receipt honesty | **PASS (adapter spine)** | Bootstrap/install transitions set `gatewayCheckPerformed: false`, `mutationAttempted: false` (`install-setup/transitions.ts:16-26`). x402 CLI digests credential refs, not raw secrets (`src/cli/x402/index.ts:310-317`). |
| 6. Nullable gateway-registry handling | **PASS** | Refuses at transition (`install-setup/transitions.ts:37-41`); throws in catalog record builder (`115-120`); orphan test passes (`http-profile-orphan-catalog.test.ts:35-37`). No silent null-skip found. |
| 7. Naming-doctrine renames | **PASS** | No `Tier-1`, `integratorTier1`, `src/cli/service/`, or `service/bootstrap` in repo-facing surfaces (grep clean). `integratorParity` in `src/protocol/navigation/index.ts`. |
| 8. SQL/secret/eval surfaces | **PASS (scoped)** | Bootstrap uses `secretref:` fixture refs (`bootstrap.ts:79`); WorkerBindings tokens in-memory only (`216-222`); output JSON excludes tokens (`examples/service-operator-bootstrap/run.ts:19-43`). No eval/new SQL surfaces in diff. |

---

## Out of scope / deferred to Phase 05

- Full service mutation route manifest and registry sync (`04-CONTEXT.md` D-25; `http-handler-mutation-gating.test.ts:6-8`).
- MCP Registry discoverability proof (documented proof gap in AGENTS.md).
- Manifest coverage export mapping (`manifest-coverage.test.ts` — pre-existing at baseline).
- Standalone service/host operator runbook extraction.
- Exhaustive failureClass parity for all policy-decision and custody reason codes (recommended Phase 05 hardening alongside H-01/H-02 fixes).

---

_Reviewed: 2026-05-29T12:00:00Z_  
_Reviewer: gsd-code-reviewer (adversarial, standard depth)_  
_Files reviewed: 72 under `src/`, `test/`, `scripts/`, `examples/` in range 1e801b7..979b99c_
