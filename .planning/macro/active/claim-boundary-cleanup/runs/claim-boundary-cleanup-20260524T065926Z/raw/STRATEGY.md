# STRATEGY First Pass: Claim Boundary Cleanup

## Invariant at stake

Handshake must not let a first wedge, adoption context, demo report, or missing proof object become a product claim. The current strategic invariant is: Handshake is protected actions for automated decision making; x402 exact per-call authorization is the first wedge; engineering agents are one adoption context.

## Findings

- The source packet still contains legacy category language. `AGENTS.md`, `README.md`, `docs/internal/decisions.md`, and `docs/internal/protocol-notes.md` describe Handshake as contracted execution infrastructure for engineering agents or generated engineering-agent execution. That is too narrow after the user correction.
- The protocol primitive is already broader than engineering agents. `docs/internal/protocol-definition.md` defines a protocol kernel for protected action control and describes exact `ActionContract`, `PolicyDecision`, one-use `Greenlight`, pre-mutation `GatewayCheck`, and terminal `Receipt` / `Refusal` / `ProofGap` evidence. That is the stable Tier 1 anchor.
- x402 is already the best first wedge in the current source packet. `README.md`, `examples/x402-protected-spend/README.md`, and `test/product/x402-protected-spend-demo-report.test.ts` show one buyer-side `x402_payment.exact` per-call path with gateway-held signing after verified gate, replay refusal, redacted evidence, and local/reference non-claims.
- The strategic risk is not that x402 is too narrow. The risk is that x402 becomes the protocol definition, payment management, settlement, broad x402 compatibility, or a clearing-house claim.
- Existing claim guards are meaningful but incomplete for the corrected category. `test/architecture/claim-boundary.test.ts` guards public entrypoint boundaries, local runtime ingress language, MCP proposal/evidence posture, and several x402 non-claims. It does not yet force the category rewrite away from engineering-agent-only language.
- The "spend reservation ledger" phrase is strategically wrong if treated as a missing requirement before product truth. Aggregate payment-budget management should be marked intentionally out of current remit. Per-call x402 exact authorization must remain in scope.
- `not_enforced_local_metadata` appears in the x402 demo source as spend-window status. That can stay only if the surrounding report treats session/day/review spend windows as local metadata and not as a deferred enforcement promise.
- Package install, repo write, and preview deploy are useful protocol regression/reference lanes, not wedge replacements for this cleanup. Treating package install as the first wedge would reintroduce the old engineering-agent category bias.

## Recommended macro shape

1. Re-anchor category language.
   - Rewrite canonical product statements from "engineering agents" to "protected actions for automated decision making" where they define Handshake.
   - Keep engineering agents as a current adoption context, generated-execution stress case, or local proof lane.
   - Do not change Tier 1 protocol object meaning.

2. Re-state x402 as first protected-action pack.
   - Preserve `x402_payment.exact` as one official buyer-side per-call path.
   - Keep package install as regression/parity, not first wedge.
   - Preserve "No adapter family defines the protocol."

3. Convert eliminated items into explicit non-goals.
   - Replace "spend reservation ledger required before claim" posture with "aggregate payment-budget management intentionally out of current remit."
   - Keep settlement, seller middleware, facilitator operation, broad x402 compatibility, payment custody, clearing-house readiness, marketplace/certification, hosted trust, and broad runtime control as cut lines.

4. Strengthen claim guards.
   - Extend `test/architecture/claim-boundary.test.ts` and `test/product/x402-protected-spend-demo-report.test.ts` so the corrected category and x402 non-claims fail if they drift.
   - Add explicit forbidden patterns for engineering-agent-only category language in canonical product definitions while allowing bounded adoption-context references.

5. Close with source-owned verification only.
   - Required future gates: `npm run quality:claims`, targeted claim-boundary and x402 report tests, and then broader repo gate if the implementation touches canonical docs or demo output.
   - No external verification is needed unless the implementation adds new x402, payment-regulatory, JWKS, MCP Registry, npm, Cloudflare, or legal claims.

## What to cut

- Cut engineering agents as the product category.
- Cut "agent auth", "generic agent governance", "runtime control", "hosted observability", and "dashboard over logs" framing.
- Cut any implication that x402 exact per-call proof means aggregate payment-budget management.
- Cut `spend reservation ledger` as a required missing proof object for the current wedge; replace it with an intentional out-of-remit boundary.
- Cut payment management, settlement finality, Handshake-held wallets, seller middleware, facilitator operation, signed-offer flows, batch settlement, `upto` authorization, and clearing-house readiness.
- Cut broad x402 compatibility. The current wedge is official buyer-side `exact` only.
- Cut hosted operation, live provider/customer custody, cross-org certificate trust, live JWKS/revocation, marketplace certification, and provider custody claims from this slice.
- Cut broad MCP/CLI/browser/shell/network/package-manager protection claims. MCP and CLI remain proposal/evidence surfaces.
- Cut any plan that adds capability before the claim boundary is cleaned.

## What must be decided before execution

- Exact canonical category phrase: use the user's phrase, "protected actions for automated decision making," unless the chair records a stronger source-backed wording.
- Whether `AGENTS.md` doctrine is in scope for the implementation slice. Strategically it should be, because it currently defines the old category.
- Allowed references to engineering agents: they should remain only as adoption context, generated-execution stress case, or current local proof context.
- Whether the demo report should remove `spend reservation ledger` entirely from `missingProofObjects` or move it to an explicit `outOfRemit` / `nonClaims` field. The strategic preference is explicit out-of-remit, not hidden deletion.
- Whether "APS" remains a buyer-readable label for the x402 report. If kept, it must resolve to x402 exact protected spend and not imply a broader payment product.

## Six-month regret scenario

Six months from now, the damaging failure is that the repo reads cleaner but still sells the wrong thing. Buyers see "engineering agents" and treat Handshake as a coding-agent niche. x402 readers see `spend reservation ledger` and assume payment-budget management is on the roadmap. Internal builders then implement hosted dashboards, verifier routes, or package-manager lanes to satisfy implied claims instead of hardening one customer-owned gateway path. The protocol survives in code but the product category drifts into advisory governance and payment theatre.

## Smallest strategically valid first move

Patch the canonical claim boundary, not the product surface: update the canonical docs and claim tests so the source must say "protected actions for automated decision making," must say x402 exact per-call authorization is the first wedge, and must fail if it implies aggregate spend management, hosted trust, broad runtime control, or engineering-agent-only category scope.

## Assumptions

- Tier 1 protocol meaning is stable and must not be redefined in this macro plan.
- x402 remains the first wedge unless an execution planner finds a source-level blocker.
- The implementation slice is allowed to edit the listed canonical docs, examples, and tests.
- `.planning/` remains scratch; only promoted plan outputs under the active macro directory are durable for this run.
- Existing x402 local/reference proof is sufficient for claim cleanup; external x402 verification is not part of this slice.

## Dependencies

- Canonical docs: `AGENTS.md`, `README.md`, `docs/internal/decisions.md`, `docs/internal/protocol-definition.md`, `docs/internal/protocol-kernel-architecture.md`, `docs/internal/protocol-layman.md`, `docs/internal/protocol-notes.md`.
- Claim guard tests: `test/architecture/claim-boundary.test.ts`, `test/product/x402-protected-spend-demo-report.test.ts`.
- Demo source/report wording: `examples/x402-protected-spend/README.md`, `examples/x402-protected-spend/run.ts`, `examples/self-hosted-activation/README.md`.
- Lane manifests that preserve non-authority posture: `src/runtime/LANE.md`, `src/mcp/LANE.md`, `src/cli/LANE.md`, `src/sdk/LANE.md`, `src/adapters/LANE.md`, `src/conformance/LANE.md`.
- Closeout commands named by the input: `npm run quality:claims` and targeted claim/x402 tests.

## Risks

- Overcorrection risk: replacing every "engineering agent" phrase would erase the useful current adoption context and generated-code threat model.
- Wedge collapse risk: making x402 the category would turn Handshake into payment infrastructure.
- Scope creep risk: adding hosted, custody, verifier, marketplace, or registry work would violate the claim-cleanup purpose.
- Test theatre risk: banning words without requiring positive category language could produce sterile docs that still fail to explain the product.
- Demo-report drift risk: `missingProofObjects` can imply "pending promise" even when the intended boundary is "not our remit."
- Adoption confusion risk: if engineering-agent examples disappear entirely, the first buyer path loses the concrete stress case that explains why protected actions are needed.

## Validation gates

- Positive category gate: canonical product definitions contain protected actions for automated decision making or equivalent chair-approved wording.
- Bounded adoption-context gate: engineering agents appear only as adoption context, generated-execution stress case, or current proof lane, not as the product boundary.
- x402 wedge gate: docs/examples keep one official buyer-side `x402_payment.exact` per-call path as first wedge and reject broad x402 compatibility.
- Non-goal gate: docs/examples/tests reject payment management, aggregate spend enforcement, settlement, seller/facilitator operation, Handshake-held custody, marketplace/certification, clearing-house readiness, hosted trust, and broad runtime control.
- Metadata gate: `not_enforced_local_metadata` remains only where clearly local metadata, not a deferred enforcement claim.
- Authority spine gate: exact contract, policy decision, one-use greenlight, gateway check, receipt/refusal/proof gap, and terminal evidence distinctions stay unchanged.
- Closeout gate: future executor runs `npm run quality:claims` and `npm run test -- test/architecture/claim-boundary.test.ts test/product/x402-protected-spend-demo-report.test.ts`.

## Cut lines

- No new protocol primitives.
- No new hosted surfaces.
- No new payment, settlement, seller, facilitator, or ledger implementation.
- No new MCP/CLI mutation capability.
- No package publication, registry publication, JWKS, revocation, or Cloudflare deployment work.
- No external legal/payment-regulatory claims.
- No new adapter pack beyond preserving x402 exact and existing regression/reference lanes.
- No claim that local/reference proof equals live provider/customer custody.

## Blocked checks

- Did not run tests or commands; this first-pass role is planning-only and wrote only the assigned raw strategy artifact.
- Did not browse or externally verify x402, npm, MCP Registry, JWKS, Cloudflare, or payment/legal claims; external verification is out of scope unless future execution adds such claims.
- Did not inspect sibling raw outputs, normalized outputs, or the final `PLAN.md`.
- Did not read source files outside the immutable packet's allowed source list.
