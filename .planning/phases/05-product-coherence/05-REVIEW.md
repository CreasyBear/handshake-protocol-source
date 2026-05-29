---
phase: 05-product-coherence
reviewed: 2026-05-29T00:00:00Z
depth: deep
files_reviewed: 63
files_reviewed_list:
  - src/adapters/auth-md/gateway.ts
  - src/adapters/auth-md/profiles.ts
  - src/adapters/x402-payment/wallet-gateway.ts
  - src/cli/command-manifest.ts
  - src/cli/evidence/fetch.ts
  - src/cli/evidence/operation-readback-view.ts
  - src/cli/main.ts
  - src/hosted-admission/hosted-admission-config.ts
  - src/hosted-admission/hosted-caller-identity.ts
  - src/hosted-admission/hosted-verifier-adapter.ts
  - src/hosted-admission/index.ts
  - src/hosted-admission/roles.ts
  - src/http/admission/hosted-admission-config.ts
  - src/http/admission/hosted-caller-identity.ts
  - src/http/admission/hosted-verifier-adapter.ts
  - src/http/admission/transition-sequence-matrix.ts
  - src/http/app.ts
  - src/http/errors/codes.ts
  - src/http/handlers/evidence-read.ts
  - src/http/mutation-route-manifest.ts
  - src/http/routes/evidence-read-route-registry.ts
  - src/index.ts
  - src/mcp/reference-transcript-fixtures.ts
  - src/mcp/resources.ts
  - src/protocol/areas/intent-compilation/candidate-decision.ts
  - src/protocol/evidence-projections/index.ts
  - src/protocol/evidence-projections/projections.ts
  - src/protocol/evidence-projections/schemas.ts
  - src/protocol/evidence-projections/store-reader.ts
  - src/sdk/index.ts
  - src/sdk/surface-clients/evidence-client.ts
  - src/surfaces/boundary-manifest.ts
  - src/surfaces/proof-packets/index.ts
  - src/surfaces/proof-packets/per-customer-bypass-scaffold/index.ts
  - src/surfaces/proof-packets/product-completion-contract/index.ts
  - src/surfaces/proof-packets/product-completion.ts
  - test/adapters/x402-wallet-gateway.test.ts
  - test/architecture/agent-origin-graph-required.test.ts
  - test/architecture/canonical-doc-forbidden-copy.test.ts
  - test/architecture/claim-boundary.test.ts
  - test/architecture/cli-command-posture.test.ts
  - test/architecture/cli-non-authority-copy.test.ts
  - test/architecture/custody-matrix-parity.test.ts
  - test/architecture/gateway-invariant-params-mismatch.test.ts
  - test/architecture/gateway-invariant-replay.test.ts
  - test/architecture/gateway-invariant-signer-custody.test.ts
  - test/architecture/hosted-admission-reexport-only.test.ts
  - test/architecture/http-handler-mutation-gating.test.ts
  - test/architecture/http-profile-adapter-conformance.test.ts
  - test/architecture/http-transition-sequence-matrix.test.ts
  - test/architecture/operator-product-completion-contract.test.ts
  - test/architecture/planning-scratch-quarantine.test.ts
  - test/architecture/product-completion-parity.test.ts
  - test/architecture/proof-packets.test.ts
  - test/architecture/root-exports.test.ts
  - test/architecture/x402-gateway-credential-custody.test.ts
  - test/cli/cli-evidence-fetch.test.ts
  - test/cli/cli-evidence.test.ts
  - test/mcp/mcp-resource-redaction.test.ts
  - test/protocol/evidence-projections/readback-spine.test.ts
  - test/sdk/evidence-client-fetch.test.ts
  - test/support/http-protocol-fixtures.ts
  - test/support/operation-readback-fixture.ts
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
verdict: SHIP-WITH-FIXES
---

# Phase 05: Product Coherence — Code Review Report

**Reviewed:** 2026-05-29  
**Depth:** deep (cross-layer taxonomy, gateway custody, export boundaries, readback spine)  
**Diff scope:** `74ff1f1..aef9478` (`*.ts` under `src/`, `test/`)  
**Branch:** `phase-05-product-coherence` @ `aef9478`  
**Status:** issues_found  
**Verdict:** **SHIP-WITH-FIXES**

## Summary

Phase 05 delivers coherent surface scrubbing, export-boundary hardening, readback spine parity (CLI/SDK/MCP/HTTP), and a **structural** x402 Mechanism A custody lift (`assertGatewayHeldSigningCommand` at both gateway runner and official signing surface). HTTP transition error envelopes, role-scoped SDK clients, and kernel replay guards align with classifier doctrine on the **HTTP transition path**.

The blocking-quality gap is **MCP failure-class taxonomy**: intent-compilation refusals are hard-mapped to `proof_gap`, contradicting the reason-code registry and the phase’s own doctrine (“refusals ≠ missing evidence”). No recurrence of historical **F-01** (raw signing bypass via root exports) or **F-02** (treating the sequence matrix as a per-request gate) was found; both are explicitly guarded in code and architecture tests.

**Tests run (literal):**

```text
bun test test/architecture/{claim-boundary,x402-gateway-credential-custody,http-transition-sequence-matrix,http-handler-mutation-gating,root-exports,product-completion-parity}.test.ts
→ 30 pass, 0 fail

bun test test/protocol/failure-class-taxonomy.test.ts test/http/transition-error-failure-class.test.ts test/sdk/role-clients-failure-class.test.ts test/adapters/x402-wallet-gateway.test.ts
→ 40 pass, 0 fail
```

## Prior finding recurrence

| Id | Topic | Recurs? | Evidence |
|----|--------|---------|----------|
| **F-01** | Raw SDK / root export bypass of gateway-held signing | **No (x402)** | `runX402WalletGateway` / `experimentalRunX402WalletGateway` off root; `assertGatewayHeldSigningCommand` at `wallet-gateway.ts:143-187`, `:301`, `:375`; architecture pins in `gateway-invariant-signer-custody.test.ts`. Root still exports `HandshakeClient` for protocol transitions — intentional integrator path; signing custody remains adapter-gated. |
| **F-02** | HTTP sequence matrix mistaken for per-request enforcement | **No** | `transition-sequence-matrix.ts:4-15` documents drift guard only; per-request ordering enforced by `recordScope` resolvers + kernel guards; `http-transition-sequence-matrix.test.ts` pins construction-time coverage, not request routing. |

## Narrative Findings (AI reviewer)

### HIGH

#### HR-01: MCP maps intent-compilation **refusals** to `proof_gap`

**Status:** **RESOLVED** @ `e60fc87` (2026-05-29)

**File:** `src/protocol/foundation/failure-class/index.ts:132-143`  
**Registry:** `src/protocol/foundation/reason-codes.ts:90` (`kind: "refusal"`)  
**Call site:** `src/mcp/x402-proposal.ts:529-542`, `:16-27`

**Issue:** `classifyFailureClassFromReasonCode` short-circuited before metadata lookup and returned `proof_gap` for `mcp_candidate_not_contractable`, even though the reason code is registered as a **refusal**. When MCP proposal compilation fails with no finer-grained codes, `mcpTaxonomyOutcome` embedded `taxonomy:failureClass/proof_gap` and set MCP `failureClass` accordingly.

**Adversarial agent behavior:** An agent receiving `outcome: "refused"` with `failureClass: proof_gap` on a candidate overreach (e.g. unwrapped consequential tool) will treat the outcome as “gather more evidence / read_evidence” instead of “stop / recraft_request”, potentially looping proposals or escalating proof-gap workflows for a hard policy refusal.

**Fix applied:** Removed hand-maintained MCP override block; `classifyFailureClassFromReasonCode` now resolves registered codes via `failureClassFromReasonCodeMetadata` (registry `kind: "refusal"` → `protected_action_refusal`) before unregistered prefix fallbacks. Parity test `maps every registry refusal kind to protected_action_refusal (never proof_gap)` in `test/protocol/failure-class-taxonomy.test.ts`.

---

### MEDIUM

#### MR-01: `mcp_candidate_digest_missing` forced to `proof_gap` (should be `internal`)

**Status:** **RESOLVED** @ `e60fc87` (same hunk as HR-01)

**File:** `src/protocol/foundation/failure-class/index.ts:132-143`  
**Registry:** `src/protocol/foundation/reason-codes.ts:104` (`kind: "transition_error"`)

**Issue:** Same early return mapped a transition/digest integrity error to `proof_gap`. HTTP classifiers would surface `internal` for this code shape.

**Adversarial behavior:** Agents conflate digest integrity failures with evidentiary gaps, wasting readback/evidence cycles on a non-recoverable proposal bug.

**Fix applied:** Registry-first classification; `transition_error` kind → `internal` via `failureClassFromReasonCodeMetadata`. Covered by `classifies MCP candidate digest integrity errors as internal` in `test/protocol/failure-class-taxonomy.test.ts`.

---

#### MR-02: SDK HTTP-status fallback collapses `409` subtypes

**Status:** **Deferred (non-blocking)** — accepted for Phase 05 close-out

**File:** `src/protocol/foundation/failure-class/index.ts:55-61`  
**Consumers:** `src/sdk/surface-clients/transport.ts:76-87`, `src/sdk/client.ts:328-339`

**Issue:** When the error body is empty or non-JSON, `failureClassFromHttpStatus(409)` always yields `protected_action_refusal`, losing `replay_refusal` and `stale_admission` distinctions that structured envelopes preserve (`transition-error-failure-class.test.ts`).

**Adversarial behavior:** Upstream proxy strips JSON → agent retries a consumed greenlight or stale hosted identity as a generic refusal, causing duplicate gateway attempts or wrong repair playbook (`explainHandshakeError` / `sdk/repair.ts`).

**Minimal fix:** Document as accepted degradation **or** add optional `x-handshake-failure-class` header on HTTP errors for status-only fallbacks; at minimum extend `role-clients-failure-class.test.ts` with a comment/assertion that replay vs refusal collapse is intentional.

---

#### MR-03: auth.md gateway lacks structural credential-resolution binding at execute boundary

**Status:** **Deferred (non-blocking)** — accepted for Phase 05 close-out

**File:** `src/adapters/auth-md/gateway.ts:251-265` (cf. `src/adapters/x402-payment/wallet-gateway.ts:143-187`, `:301`, `:375`)

**Issue:** D-64 Mechanism A is fully structural for x402 (`assertGatewayHeldSigningCommand`). auth.md checks profile conformance and records resolution evidence but does **not** assert gate-bound, redacted, `used_by_gateway` evidence immediately before `executeProtectedApiCall`. A custom `AuthMdProtectedApiCallSurface` could ignore `command.credentialResolutionEvidence` and use caller-held material.

**Adversarial behavior:** Integrator implements surface that reads env var tokens while still passing gateway check — protocol records resolution evidence but mutation uses raw credentials, undermining “gateway-held custody” narrative for the second adapter family.

**Minimal fix:** Extract shared `assertGatewayHeldExecutionCommand` (gate + resolution evidence bindings) and call from auth.md gateway before I/O; add architecture test analogous to `x402-gateway-credential-custody.test.ts`.

---

#### MR-04: x402 gateway swallows custody/signing errors into generic failed outcome

**Status:** **Deferred (non-blocking)** — accepted for Phase 05 close-out

**File:** `src/adapters/x402-payment/wallet-gateway.ts:332-357`

**Issue:** Bare `catch` maps `assertGatewayHeldSigningCommand` throws and signing failures alike to `payment_signature_failed` with digest-only diagnostics — no distinct reason code or refusal class in the adapter result.

**Adversarial behavior:** Operator/automation cannot distinguish custody violation from downstream signing failure; may retry signing path instead of fixing gate/evidence binding.

**Minimal fix:** Branch on custody error message prefix (`x402 gateway-held custody refused signing`) to return a refused-shaped outcome or attach structured `reasonCode` before reconciliation.

---

### LOW

#### LR-01: Operation readback default status over-fallback to `policy_refused`

**File:** `src/protocol/evidence-projections/projections.ts:865-887`

**Issue:** After explicit branches, unmatched envelope states fall through to `"policy_refused"`. Early lifecycle projections with incomplete policy/gateway fields may read as policy refusal rather than a neutral/pending status.

**Adversarial behavior:** Support tooling mis-prioritizes “recraft_request” for contracts still progressing through compilation.

**Minimal fix:** Add explicit branch for “no policy decision yet” or default to a non-refusal pending status; extend `readback-spine.test.ts`.

---

#### LR-02: Sequence matrix omits `evaluatePolicy` as documented prerequisite of `gatewayCheck`

**File:** `src/http/admission/transition-sequence-matrix.ts:44-49`

**Issue:** Matrix lists `gatewayCheck → [proposeActionContract]` only. Greenlight creation flows through `evaluatePolicy`; matrix is documentation-only (not F-02), but operator docs may under-specify the policy step.

**Minimal fix:** Add comment or secondary prerequisite note that greenlight records imply `evaluatePolicy` (kernel enforces via greenlight load in `gateway-gate/transitions.ts:115-125`).

---

#### LR-03: `failureClassFromHttpStatus(418)` → `proof_gap` for unknown 4xx

**File:** `src/protocol/foundation/failure-class/index.ts:60` (pinned in `failure-class-taxonomy.test.ts:73`)

**Issue:** Any unknown client error status in 4xx band becomes `proof_gap` in SDK fallback — acceptable for resilience but can mislabel future 4xx refusal codes until registry updated.

**Minimal fix:** None required for ship; consider defaulting unknown 4xx to `protected_action_refusal` per `classifyFailureClassFromProtocolError` line 122 parity.

---

## What passed (no finding)

- **x402 Mechanism A (D-64):** Structural, not label-only — gate + redacted `used_by_gateway` resolution evidence required before `signPayment`; enforced in runner and official surface.
- **One greenlight / replay:** Architecture promotion in `gateway-invariant-replay.test.ts`; adapter replay test in x402 wallet suite.
- **HTTP handler lane:** Read-only handlers; mutation manifest parity; no direct mutation in `src/http/handlers/*`.
- **Claim-boundary / export hygiene:** Root curated exports; gateway runners and adapter packs off root; MCP off root; CLI avoids `HandshakeClient`.
- **HTTP/MCP/SDK taxonomy (transition path):** Policy refusals map to `protected_action_refusal` + 409; proof gaps to 422; replay to `replay_refusal`; ingress codes stay `internal` with explicit HTTP status (`transition-error-failure-class.test.ts`).
- **Candidate envelope refusals (D-66):** `candidate-decision.ts:195-207` closes agent-origin graph hole without misusing `proof_gap`.
- **Hosted admission:** Re-export-only HTTP shims; readiness readback does not masquerade as clearance.

## Recommended ship gate

**HR-01** and **MR-01** resolved @ `e60fc87`. **MR-02**, **MR-03**, **MR-04** deferred as non-blocking parity hardening (recorded in `CONCERNS.md`). Phase 05 classifier doctrine is complete across HTTP/MCP/SDK for refusal vs proof_gap separation.

---

_Reviewed: 2026-05-29_  
_Reviewer: Claude (gsd-code-reviewer)_  
_Depth: deep_
