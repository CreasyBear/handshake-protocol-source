# Phase 05 — Keel Integrity Audit

> **Purpose (coherence invariant #6):** every claimed invariant has a *confirmed
> structural enforcement site* or an *honest proof-gap label*. No advisory claim
> is allowed where a structural site exists. Each row carries a `file:line`
> citation (D-70) and a D-63 enforcement label drawn from:
> `structural` · `architecture-test` · `runtime-test` · `advisory` · `proof-gap`.

- **Phase:** 05-product-coherence
- **Closes:** D1 (custody), D3 (test promotion), D4 (sequence matrix), D5 (agent-origin graph)
- **Lands after:** 05-13 (custody must precede promotion — D-65)
- **Citations verified against tree at:** `feat(05-14)` matrix/promotion commit `f7fd1d6`

Enforcement-label legend:

| Label | Meaning |
|-------|---------|
| `structural` | The type system / kernel transition guard makes the violation unrepresentable or refused before consequence. |
| `architecture-test` | A `test/architecture/` guard pins the invariant; regression fails CI even if the structural site is reachable. |
| `runtime-test` | Behaviour pinned by a non-architecture test (adapter/protocol/integration). |
| `advisory` | Documentation / audit artifact only — no executable guard. |
| `proof-gap` | The invariant is *not* fully structurally enforced; the gap is recorded honestly rather than smoothed over. |

---

## Table A — AGENTS.md core invariants (10)

| # | Invariant | Enforcement site (`file:line`) | Label | Pinning test |
|---|-----------|--------------------------------|-------|--------------|
| 1 | An operating envelope authorizes *attempts*, not mutations. | `src/protocol/areas/action-attempt-lifecycle/matrix.ts:157-162` — `registerOperatingEnvelope:recorded` / `:idempotent` / `:conflict` lifecycle entries register bounds evidence, never mutation authority. | structural | `test/architecture/claim-boundary.test.ts` |
| 2 | Vague intent is not an operating envelope. | `src/protocol/areas/intent-compilation/candidate-decision.ts:67` — `deriveUncertaintyMarkers` pushes `unknown_operating_envelope` when no envelope is bound; `deriveCatalogAndEnvelopeReasonCodes` → `deriveEnvelopeReasonCodes` (`:165-185`) refuses actor/action/gateway/resource mismatch, revocation, or expiry on a bound envelope. | structural | `test/protocol/kernel-compilation-contract.test.ts` |
| 3 | Generated code is not an action contract. | `src/protocol/areas/intent-compilation/candidate-decision.ts:207-210` — `isAgentOriginCompilation` forces a generated-execution-graph ref even with no `runtimeExecution` (D-66 adjudication #4); `src/protocol/areas/action-attempt-lifecycle/matrix.ts:209` — unsafe generated-graph evidence terminates as refusal/proof gap *before* contract. | structural | `test/architecture/agent-origin-graph-required.test.ts` |
| 4 | A rendered plan is not permission. | `src/protocol/evidence-projections/schemas.ts:389` — `authorityCreatedByReadback: z.literal(false)` on readback projections. | structural | `test/protocol/evidence-projections/readback-spine.test.ts` |
| 5 | An action contract is a proposed commitment, not execution authority. | `src/protocol/areas/gateway-gate/transitions.ts:87-103` — `gatewayCheck` derives a constraint evaluation + commit plan from contract + greenlight + policy records before any commit. | structural | `test/architecture/http-handler-mutation-gating.test.ts` |
| 6 | A greenlight authorizes only one exact gateway-checked mutation attempt. | `src/protocol/areas/gateway-gate/transitions.ts:74,84` — `idempotencyLedgerEntry` + `GreenlightConsumption` single-use binding; `src/protocol/areas/gateway-gate/replay-refusal/index.ts:25` — `commitReplayRefusal` refuses the consumed replay with `already_consumed`. | structural | `test/architecture/gateway-invariant-replay.test.ts` (05-14 D3 promotion) |
| 7 | The gateway check is the enforcement point before consequence. | `src/adapters/auth-md/gateway.ts:191` — `verifiedGatewayCheckFromResult(gatewayCheck)` gate before provider I/O; `src/adapters/x402-payment/wallet-gateway.ts:143` — `assertGatewayHeldSigningCommand` refuses signing without a passed `VerifiedGatewayCheck` (custody landed 05-13). | structural | `test/adapters/auth-md-gateway.test.ts`, `test/architecture/x402-gateway-credential-custody.test.ts`, `test/architecture/gateway-invariant-signer-custody.test.ts` |
| 8 | Receipt evidence must distinguish gateway check from downstream execution. | `src/protocol/areas/action-attempt-lifecycle/matrix.ts:116` — "missing downstream response records proof gap instead of downstream success". | structural | `test/protocol/evidence-projections/readback-spine.test.ts` |
| 9 | Isolation state must be checked before future greenlights and gateway checks. | `src/protocol/areas/gateway-gate/transitions.ts:143-144` — `store.listIsolationStates([...isolationScopeRefsForContract(contract), ...])` evaluated inside the gate. | structural | `test/architecture/gateway-invariant-replay.test.ts`, `test/protocol/kernel-conflict-isolation.test.ts` |
| 10 | Missing evidence must be recorded as a proof gap, not smoothed over. | `src/protocol/areas/recovery/terminal/terminal-conflicts.ts:27-29,62` — `buildRecoveryTerminalConflictProofGap` + commit with `reasonCode: "recovery_terminal_conflict"`. | structural | `test/architecture/claim-boundary.test.ts` |

---

## Table B — Phase 05 coherence invariants (7)

| # | Coherence invariant | Evidence (`file:line` / plan) | Label | Verdict |
|---|---------------------|-------------------------------|-------|---------|
| 1 | Exact, policy-evaluated, gateway-checked contract before any consequential mutation. | `src/protocol/areas/gateway-gate/transitions.ts:87-103` (commit plan gated on records). | structural | PASS |
| 2 | One greenlight = one exact mutation attempt. | `src/protocol/areas/gateway-gate/transitions.ts:74,84` + `replay-refusal/index.ts:25`. | structural + architecture-test | PASS |
| 3 | The gateway check is the enforcement point. | `src/adapters/x402-payment/wallet-gateway.ts:143` (signer custody); `src/adapters/auth-md/gateway.ts:191` (provider-I/O gate). | structural | PASS (post-05-13) |
| 4 | Receipts separate gateway check from downstream execution. | `src/protocol/areas/action-attempt-lifecycle/matrix.ts:116`. | structural | PASS |
| 5 | Every persona uses the same live-fetch evidence spine (CLI/SDK/MCP). | `src/sdk/surface-clients/evidence-client.ts` (`getOperationReadbackProjection`); `src/cli/evidence/fetch.ts`; `src/mcp/resources.ts`. | architecture-test | PASS — pinned by `test/cli/cli-evidence-fetch.test.ts`, `test/sdk/evidence-client-fetch.test.ts` (05-06) |
| 6 | Every claimed invariant has a confirmed structural site (no advisory where structural exists). | This artifact (Table A) + `test/architecture/gateway-invariant-signer-custody.test.ts:1` (promotion gated on 05-13 structure per D-65). | advisory + architecture-test | PASS |
| 7 | Narrative aligns with the category claim (no passport / authority / payment / approval headline drift). | `test/architecture/canonical-doc-forbidden-copy.test.ts:1`; `test/architecture/claim-boundary.test.ts:144` — `/certificate is terminal evidence, not permission/i` over RAW canonical sources (regression fixed 05-10). | architecture-test | PASS |

---

## D2 custody — before / after (adjudication R3 narrative)

| Window | State of "the gateway check is the enforcement point" at the x402 signer | Label |
|--------|--------------------------------------------------------------------------|-------|
| Pre-05-13 | The signer accepted a `VerifiedGatewayCheck`-shaped command but custody was **label-only** — a raw caller-supplied `gatewayCredentialRefId` could reach `signPayment`. The invariant was an **advisory** claim with no structural refusal. | proof-gap (historical) |
| Post-05-13 | `src/adapters/x402-payment/wallet-gateway.ts:143` `assertGatewayHeldSigningCommand` structurally refuses unless the command carries a passed gate **and** gateway-resolved, redacted credential-resolution evidence bound to the same `gateAttemptId`. Promotion test `test/architecture/gateway-invariant-signer-custody.test.ts` cannot pass on a pre-05-13 tree. | structural |

This is the single before/after that motivated D-65's "promote only after the
structural site exists" rule: the architecture test was **deliberately withheld**
until 05-13 landed, so the suite never advertised a guard that the code could not
yet honour.

---

## Honest proof gaps (coherence invariant #10 applied to the audit itself)

1. **HTTP transition sequence matrix is an ordering/drift guard, not a second
   policy engine.** `src/http/admission/transition-sequence-matrix.ts` documents
   the canonical prerequisite producer per route and fails app construction on
   matrix/registry drift (coverage + integrity + acyclicity), but it does **not**
   independently re-reject an out-of-order request at the app layer — per-request
   rejection of a transition whose prerequisite record is missing is enforced
   *elsewhere*, structurally, by the route registry's `recordScope` resolvers and
   the kernel transition guards (e.g. `gatewayCheck` requires a proposed
   contract). Labelling the matrix itself as a per-request enforcement point would
   be doc theatre; it is honestly an **architecture-test + drift guard** layered
   over the existing structural enforcement.
   - Site: `src/http/admission/transition-sequence-matrix.ts:1`; guard wired at
     `src/http/app.ts` (`assertTransitionSequenceMatrixCoverage()`).
   - Pinned by: `test/architecture/http-transition-sequence-matrix.test.ts`.

2. **Plan citation correction (D-70 honesty):** the 05-14 plan cited the auth-md
   gate at `src/adapters/auth-md/gateway.ts:131-132`; the actual gate call is at
   `src/adapters/auth-md/gateway.ts:191` (`verifiedGatewayCheckFromResult`). The
   invariant holds; the line reference is corrected here rather than copied
   forward unchecked.

---

## Automated suite backing this audit

- `bun test test/architecture/agent-origin-graph-required.test.ts`
- `bun test test/architecture/http-transition-sequence-matrix.test.ts`
- `bun test test/architecture/gateway-invariant-replay.test.ts test/architecture/gateway-invariant-params-mismatch.test.ts test/architecture/gateway-invariant-signer-custody.test.ts`
- `bun test test/architecture/x402-gateway-credential-custody.test.ts` (05-13 custody)
- `bun test test/architecture/claim-boundary.test.ts test/architecture/canonical-doc-forbidden-copy.test.ts` (narrative / category claim)
