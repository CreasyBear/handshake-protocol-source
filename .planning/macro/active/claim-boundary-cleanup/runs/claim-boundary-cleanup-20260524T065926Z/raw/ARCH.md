# ARCH First Pass: Claim Boundary Cleanup

## Invariant At Stake

Handshake must not let category language become authority language. The architecture can support protected actions for automated decision making, with x402 as the first wedge, only if repo canon keeps the authority spine stable:

```text
exact action contract
-> policy decision
-> one-use greenlight or refusal
-> gateway check before mutation
-> receipt, refusal, proof gap, or terminal evidence
```

If cleanup turns into broad runtime control, payment management, hosted trust, or a protocol rewrite, it weakens the boundary. If cleanup leaves "engineering agents" as the product boundary, the repo misstates the category and will keep producing wedge-shaped strategy errors.

## Architecture Implications

- This is a claim and guard migration, not a Tier 1 protocol migration. `docs/internal/protocol-definition.md` already defines the core as "protected action control" and should remain the authority rule source.
- Product category language should move from "contracted execution infrastructure for engineering agents" to protected actions for automated decision making. Engineering-agent workflows remain an adoption context and evidence source, not the protocol boundary.
- x402 should be presented as the current first protected-action wedge: one official buyer-side `x402_payment.exact` per-call path. It must not become the protocol definition.
- Existing protocol participant names such as `agentId`, `AgentTransactionEnvelopeProjection`, runtime evidence, and generated-execution graph should not be renamed in this slice. "Agent" remains a participant/evidence role where source objects already use it; it should stop being the top-level category claim.
- Spend-window language should stop implying a ledger is required before a future claim. Aggregate payment-budget management should be named as intentionally out of current remit. `not_enforced_local_metadata` can remain only when a local metadata field is explicitly non-enforcing.
- The cleanup should strengthen `test/architecture/claim-boundary.test.ts` and `test/product/x402-protected-spend-demo-report.test.ts`, not create new authority surfaces.
- `.planning/codebase/*` identifies current runtime/x402/MCP posture drift, but `.planning/` remains scratch. Durable corrections belong in compact canon docs and tests.

## Boundaries That Must Not Move

- `src/protocol/**` remains the only owner of protocol meaning. Do not move product-category text into protocol objects unless the schema truly changes.
- `src/runtime/**` remains proposal/evidence only. It may observe generated decisions and propose candidates; it must not evaluate policy, issue greenlights, gateway-check, receipt, mutate, or sign.
- `src/mcp/**` and `src/cli/**` remain proposal/evidence/operator surfaces only. No mutation, signer, gateway custody, receipt export, hosted operation, or cross-org trust path belongs there.
- `src/adapters/**` remains reference gateway/profile code. Mutation-capable adapters still run only after `VerifiedGatewayCheck`.
- `src/conformance/**` remains reference posture checks, not certification or standards compliance.
- Customer-owned gateway custody remains the future enforcement model. Do not add Handshake-held payment custody, signer custody, balances, settlement, seller middleware, or facilitator operation.
- x402 remains per-call exact authorization only. Do not add aggregate budget management to make old wording true.
- `AuthorityCertificate` remains terminal evidence. Do not claim permission, identity, settlement, marketplace certification, hosted verifier operation, or cross-org trust.

## Likely Source/Test/Doc Paths

### Canonical Docs To Update

- `AGENTS.md`: replace category-level "contracted execution infrastructure for engineering agents" and "first wedge is engineering-agent actions" with protected actions for automated decision making; retain engineering-agent examples as current adoption context and generated-execution pressure case.
- `README.md`: update headline, system-design posture, and x402 demo language so the repo reads as a protected-action kernel with x402 as first wedge.
- `docs/internal/decisions.md`: update "Product Kernel", "Current Bought Product", and "Claims Boundary" so the durable decision is category-first, wedge-second.
- `docs/internal/protocol-definition.md`: likely only small wording cleanup. Preserve "protocol kernel for protected action control" and authority rule exactly.
- `docs/internal/protocol-kernel-architecture.md`: update architecture summary/local establishment wording only where it implies engineering agents define the protocol.
- `docs/internal/protocol-layman.md`: restate "agents will do real work through tools" as one common automated-decision actor, not the category limit.
- `docs/internal/protocol-notes.md`: update "Use case: reduce generated engineering-agent execution..." to protected-action attempts from automated decision systems, with generated engineering-agent execution as current pressure case.
- `examples/x402-protected-spend/README.md`: change scope from "generated engineering-agent execution evidence" to automated decision / generated execution evidence, with engineering-agent workflow as the local demo context if needed.
- `examples/self-hosted-activation/README.md`: likely keep non-claims; check for category drift during implementation.

### Tests And Guards To Update

- `test/architecture/claim-boundary.test.ts`: add guard that canon contains protected actions for automated decision making and does not define the product as engineering-agent-only. Also guard against payment management, settlement, seller/facilitator, hosted trust, broad x402 compatibility, broad runtime control, marketplace/certification, and cross-org certificate trust.
- `test/product/x402-protected-spend-demo-report.test.ts`: replace expectation that `missingProofObjects` contains "spend reservation ledger" with wording that marks aggregate payment-budget management out of remit or absent by design. Keep assertions for per-call exact authorization, local/reference sandbox, gateway-held signer, replay refusal, proof gap, and non-claims.
- `test/architecture/import-posture.test.ts`: likely no direct change unless doc cleanup touches lane manifest boundaries. Keep as validation gate.
- `test/architecture/root-exports.test.ts`: likely no direct change. Run to prove claim cleanup did not move public surfaces.

### Source/Demo Paths Likely Touched By Claim Text

- `examples/x402-protected-spend/run.ts`: update report strings such as "Premium context for one generated engineering-agent request", missing proof object label "spend reservation ledger", and final local-evidence disclaimer if needed. Do not alter authority flow.
- `src/runtime/LANE.md`, `src/mcp/LANE.md`, `src/cli/LANE.md`, `src/sdk/LANE.md`, `src/adapters/LANE.md`, `src/conformance/LANE.md`: only update category wording if a lane describes the product boundary. Keep lane-specific authority owner and forbidden imports stable.

## Data And Control Flow To Preserve

```text
automated decision / generated execution evidence
-> runtime or MCP proposal surface
-> intent compilation
-> CandidateAction
-> ActionContract
-> PolicyDecision
-> Greenlight
-> GatewayCheck
-> x402 wallet gateway creates signature evidence after verified gate
-> local/reference signed retry evidence
-> Receipt / Refusal / ProofGap / terminal certificate evidence
```

The first node can be generalized from "engineering agent" to automated decision making. The rest of the flow must not change in this slice.

## Compatibility And Migration Risks

- Category rename risk: a broad text replacement of "agent" would corrupt protocol participant semantics, exported schema names, and tests. The migration must distinguish product-category text from existing participant/evidence object names.
- Demo-contract risk: `examples/x402-protected-spend/run.ts` currently emits buyer-readable report fields consumed by `test/product/x402-protected-spend-demo-report.test.ts`; changing labels without updating assertions will break the product gate.
- Scratch-canon risk: `.planning/codebase/CONCERNS.md` still recommends adding a spend reservation ledger before claiming aggregate spend enforcement. The current run should override that as eliminated scope, but only in the active macro plan; do not promote scratch maps as canon.
- Wedge inversion risk: making x402 the product category would create the same architecture error as engineering-agent-only language. The protocol must remain adapter-pack modular.
- Surface drift risk: updating MCP/CLI/SDK docs for category clarity can accidentally imply those surfaces authorize or protect work. Claim guards must keep non-authority flags explicit.
- External verification risk: no external x402, MCP Registry, npm, JWKS, Cloudflare, or legal/payment claims should be added in this slice. Any such claim must be blocked until separately verified.

## Architecture Validation Gates

- `npm run quality:claims`
- `npm run quality:architecture`
- `npm run test -- test/architecture/claim-boundary.test.ts test/product/x402-protected-spend-demo-report.test.ts`
- `npm run test -- test/architecture/import-posture.test.ts test/architecture/root-exports.test.ts`
- `npm run format:check`
- Final implementation closeout should run `npm run check:repo` if the slice touches docs, tests, or demo report generation.

## Assumptions

- The user correction is authoritative for this plan: protected actions for automated decision making is the category; engineering agents are an adoption context.
- Tier 1 protocol objects and source authority boundaries are stable and should not be renamed in this slice.
- x402 remains the first wedge because the current source packet proves the strongest local/reference path there.
- Aggregate x402 payment-budget management is eliminated from current remit, not deferred as a required future ledger for the current wedge.
- The macro plan will be implemented later; this first pass must not change source beyond this assigned raw output.

## Dependencies

- Canon docs must be updated before claim guards can be made strict without producing confusing failures.
- Demo report string changes in `examples/x402-protected-spend/run.ts` and assertion changes in `test/product/x402-protected-spend-demo-report.test.ts` should land together.
- Claim-boundary guards should drive the cleanup so future docs cannot reintroduce engineering-agent-only category language or payment-management claims.
- Architecture and root export tests provide regression proof that the cleanup did not move authority across package/lane boundaries.

## Risks

- Over-generalization: "automated decision making" can become generic agent governance if not tied back to protected actions, exact contracts, and gateway checks.
- Under-correction: leaving README/AGENTS/decisions as engineering-agent-first will keep future plans scoped to the wrong market and adoption model.
- Payment-regulatory drift: replacing "spend reservation ledger" poorly can still imply Handshake manages budgets, wallets, or settlement. Use "aggregate payment-budget management intentionally out of current remit" where applicable.
- x402 monopoly drift: x402 proof language can overfit the protocol to payments. Keep "adapter/action pack" and "one protected action pack at a time" discipline visible.
- Evidence theatre: buyer-readable report labels like `x402_paid_http_call.exact` must stay report labels, not action-catalog or gateway-bound authority types unless future source implements them.

## Cut Lines

- Do not implement a spend ledger, wallet custody, settlement, facilitator, seller middleware, or hosted verifier in this slice.
- Do not rename exported protocol schemas or root package surfaces to remove "agent" terminology.
- Do not add new public package exports, package scripts, CI names, or source folders.
- Do not modify `src/protocol/**` behavior unless a test proves a claim guard cannot be expressed without a source-owned predicate.
- Do not use `.planning/` files as active repo truth beyond this macro-planning run.
- Do not browse or add external standards claims for x402, MCP Registry, npm, JWKS, Cloudflare, or legal/payment posture.

## Blocked Checks

- Could not verify actual current test results because this first-pass role is planning-only and must not run implementation gates.
- Could not inspect unlisted implementation files such as `src/adapters/x402-payment/action-proposal.ts`, `src/adapters/x402-payment/install-proposal.ts`, `src/runtime/ingress/index.ts`, `src/mcp/x402-proposal.ts`, `src/surfaces/boundary-manifest.ts`, or `package.json`; path recommendations come from the allowed source packet and codebase maps.
- Could not confirm whether `not_enforced_local_metadata` appears outside the allowed packet; implementation should search the full repo during the execution slice.
- Could not confirm generated example outputs under `examples/*/output/`; implementation should regenerate affected demos before final claim gates if report text changes.

## Smallest Next Mechanism To Build

Strengthen `test/architecture/claim-boundary.test.ts` first so the repo fails when canonical docs define Handshake as engineering-agent-only or imply aggregate payment-budget management, then update canon/docs/demo strings until that guard passes without touching Tier 1 behavior.
