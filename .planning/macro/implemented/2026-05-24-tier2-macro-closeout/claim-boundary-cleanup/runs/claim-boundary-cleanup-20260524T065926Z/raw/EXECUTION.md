# EXECUTION First Pass: Claim Boundary Cleanup

## Invariant at stake

The implementation plan must prevent broad product language from becoming fake authority. Handshake should read as protected actions for automated decision making, proven first through one x402 exact per-call protected action wedge, without changing Tier 1 protocol meaning or implying payment management, hosted operation, provider custody, settlement, broad runtime control, or engineering agents as the category boundary.

## Execution posture

- Planning only. No implementation was performed in this pass.
- Source boundary honored: this pass used the immutable input packet and the allowed source files named there.
- `.planning/` is derived scratch. It can guide the cleanup plan, but durable repo truth must land in `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, and `docs/internal/*`.
- Tier 1 protocol/kernel meaning should remain stable. The work is claim, documentation, report, and guard cleanup unless a failing claim guard requires a narrow source-output adjustment.

## Recommended phase sequence

### Phase 0: Claim inventory and exact target language

Purpose: create the edit map before touching source.

Tasks:

- Inventory current category claims across `AGENTS.md`, `README.md`, `docs/internal/decisions.md`, `docs/internal/protocol-definition.md`, `docs/internal/protocol-kernel-architecture.md`, `docs/internal/protocol-layman.md`, `docs/internal/protocol-notes.md`, `examples/x402-protected-spend/README.md`, `examples/x402-protected-spend/run.ts`, `examples/self-hosted-activation/README.md`, and lane manifests.
- Classify each claim as one of:
  - category claim: protected actions for automated decision making;
  - first wedge claim: x402 exact per-call protected action;
  - current adoption context: engineering-agent workflows/generated execution;
  - local/reference evidence only;
  - explicit non-claim/cut line.
- Identify every "engineering agents" phrase that currently defines the product rather than describing an adoption context.
- Identify every "spend reservation ledger" or ledger-required-before-claim phrase and decide whether it is:
  - authority idempotency ledger language that remains valid;
  - aggregate payment-budget management language that should be cut as intentionally out of current remit;
  - local metadata language that may keep `not_enforced_local_metadata`.

Owner: implementation lead.

Closeout evidence: claim inventory in the implementation PR description or support note, not a new repo-facing canon file.

### Phase 1: Test-first claim guards

Purpose: make overclaim failures mechanical before rewriting docs.

Tasks:

- Strengthen `test/architecture/claim-boundary.test.ts` to require:
  - category wording does not define Handshake as engineering-agent-only;
  - canonical docs state protected actions for automated decision making;
  - engineering-agent/generated-execution wording is adoption context or runtime evidence context;
  - x402 is the first wedge/action pack, not the protocol definition;
  - current x402 enforcement is exact per-call only;
  - aggregate payment-budget management is intentionally out of current remit;
  - docs/examples do not imply payment management, settlement, seller middleware, facilitator operation, hosted trust, provider custody, marketplace/certification, broad runtime control, broad x402 compatibility, or cross-org certificate trust.
- Strengthen `test/product/x402-protected-spend-demo-report.test.ts` to require:
  - the buyer-readable report no longer lists "spend reservation ledger" as a missing proof object required before an aggregate spend claim;
  - aggregate payment-budget management appears as a non-claim or out-of-remit boundary;
  - `not_enforced_local_metadata` is only represented as local metadata, not a deferred promise;
  - `x402_paid_http_call.exact` stays a buyer-readable label and not an action catalog authority type;
  - x402 report language names automated decision/protected action context without erasing generated execution evidence.
- If the implementation inventory confirms active vocabulary tests scan these surfaces, update `test/architecture/active-vocabulary.test.ts` as a follow-up candidate. This file was not opened in this first-pass source boundary.

Owner: test owner.

Dependency: Phase 0 inventory.

Closeout evidence: initial failing focused test slice, then green after source/doc cleanup.

### Phase 2: Canonical category rewrite

Purpose: align durable repo truth to the user correction without expanding authority.

Tasks:

- Update `AGENTS.md` category doctrine:
  - from "contracted execution infrastructure for engineering agents";
  - to protected actions for automated decision making;
  - keep generated engineering-agent execution as the current adoption context and threat model.
- Update `README.md` first screen and system design posture:
  - describe this checkout as a TypeScript protocol kernel for protected action control;
  - state x402 exact per-call protected action as the current first wedge;
  - remove engineering-agent phrasing where it defines category;
  - keep runtime/generated execution language where it describes evidence inputs.
- Update `docs/internal/decisions.md`:
  - Product Kernel: category becomes protected actions for automated decision making;
  - first credible wedge becomes x402 exact per-call protected actions;
  - "engineering-agent actions" becomes adoption context / current workflow context;
  - first bought product remains narrow only if framed as one automated decision workflow around one protected action, not category.
- Update `docs/internal/protocol-definition.md`, `docs/internal/protocol-kernel-architecture.md`, `docs/internal/protocol-layman.md`, and `docs/internal/protocol-notes.md` only where needed:
  - preserve the primitive and authority rule;
  - avoid changing protocol object semantics;
  - shift use-case phrasing from "generated engineering-agent execution" to "automated decision/runtime generated execution" where it is category-defining;
  - keep examples that are explicitly generated execution or coding-agent adoption examples.

Owner: docs/canon owner.

Dependencies: Phase 1 claim guard draft.

Closeout evidence: claim-boundary tests prove the category language cannot regress.

### Phase 3: x402 protected-action report cleanup

Purpose: keep the first wedge strong while cutting payment-management implication.

Tasks:

- Update `examples/x402-protected-spend/README.md`:
  - scope becomes one official buyer-side `x402_payment.exact` protected action attempt from automated/generated execution evidence;
  - retain "generated engineering-agent" only as one demo context if needed;
  - keep cut lines for no provider custody, no aggregate x402 spend windows, no facilitator/seller/settlement, no broad x402 compatibility.
- Update `examples/x402-protected-spend/run.ts` report fields:
  - replace `missingProofObjects` entry `spend reservation ledger` with an out-of-remit/non-claim object such as `aggregate payment-budget management`;
  - make `requiredBeforeClaim` stop implying a planned ledger is required for current claim cleanup;
  - keep `spendWindowEnforcementStatus: "not_enforced_local_metadata"` only where it describes local metadata;
  - keep idempotency wording as authority idempotency only, not payment settlement.
- Update `examples/self-hosted-activation/README.md` if needed:
  - self-hosted packet remains local reference evidence;
  - no hosted operation, provider/customer custody, cross-org trust, aggregate spend-window enforcement, clearing-house readiness, or broad host protection.

Owner: example/product proof owner.

Dependencies: Phase 1 product report assertions.

Closeout evidence: `test/product/x402-protected-spend-demo-report.test.ts` and `npm run demo:aps` pass.

### Phase 4: Lane and surface boundary alignment

Purpose: keep package/lane manifests from reintroducing the old category or surface authority.

Tasks:

- Update `src/runtime/LANE.md`:
  - runtime proposal evidence supports automated/generated execution; it does not define the category or issue authority.
- Update `src/mcp/LANE.md`, `src/cli/LANE.md`, and `src/sdk/LANE.md` only if current wording implies broad runtime/MCP/CLI control or category ownership.
- Update `src/adapters/LANE.md`:
  - adapter proof lanes are protected-action packs;
  - x402 is the first wedge/action pack;
  - no adapter family defines the protocol.
- Update `src/conformance/LANE.md`:
  - conformance verifies narrow adapter/protected-action posture, not certification or provider enforcement.

Owner: source-boundary owner.

Dependencies: Phase 2 and Phase 3 wording decisions.

Closeout evidence: `test/architecture/import-posture.test.ts`, `test/architecture/root-exports.test.ts`, and `test/architecture/claim-boundary.test.ts` pass.

### Phase 5: Scratch planning register cleanup

Purpose: stop active planning scratch from teaching future agents the wrong boundary.

Tasks:

- Update `.planning/macro/DEFERRED-INTEGRATE-ELIMINATE.md`:
  - vision/category becomes protected actions for automated decision making;
  - x402 exact per-call protected action remains first wedge;
  - engineering-agent workflows become adoption context, not category;
  - Step 0 cleanup says aggregate payment-budget management is intentionally outside current remit, not a missing spend ledger promise.
- Treat `.planning/codebase/CONCERNS.md` as derived scratch. If implementation touches it, revise the "Spend Window Metadata" fix approach from "add a spend reservation ledger before claiming aggregate spend" to "do not claim aggregate payment-budget management in the current remit; keep local metadata only." Do not promote this scratch text to canon.

Owner: planning hygiene owner.

Dependencies: Phase 2 canonical wording.

Closeout evidence: active macro scratch no longer contradicts canon.

### Phase 6: Validation and closeout

Purpose: prove the cleanup did not alter authority behavior or package posture.

Tasks:

- Run focused claim gates first.
- Run architecture/import/export gates if lane manifests, exports, or package-facing wording changed.
- Run demo/report gate after example report changes.
- Run full repo gate before declaring the slice executable/closed.
- Record any blocked checks with exact command and reason.

Owner: implementation lead.

Dependencies: Phases 1-5.

Closeout evidence: command outputs and no source behavior changes beyond claim/report surfaces unless explicitly justified by test failure.

## Task graph

```text
T0 claim_inventory
  -> T1 architecture_claim_guard
  -> T2 product_report_claim_guard

T1 architecture_claim_guard
  -> T3 canonical_category_rewrite
  -> T5 lane_manifest_alignment

T2 product_report_claim_guard
  -> T4 x402_report_cleanup

T3 canonical_category_rewrite
  -> T6 scratch_register_cleanup
  -> T8 validation_quality_claims

T4 x402_report_cleanup
  -> T8 validation_quality_claims
  -> T9 validation_demo_aps

T5 lane_manifest_alignment
  -> T7 import_export_validation

T6 scratch_register_cleanup
  -> T8 validation_quality_claims

T7 import_export_validation
  -> T10 full_repo_gate

T8 validation_quality_claims
  -> T10 full_repo_gate

T9 validation_demo_aps
  -> T10 full_repo_gate
```

Task IDs:

- T0: build claim inventory and target phrase table.
- T1: strengthen `test/architecture/claim-boundary.test.ts`.
- T2: strengthen `test/product/x402-protected-spend-demo-report.test.ts`.
- T3: rewrite canonical docs.
- T4: rewrite x402 report/example language and report fields.
- T5: align lane manifests.
- T6: align active scratch register.
- T7: run import/export architecture validation.
- T8: run focused claim validation.
- T9: run APS demo/report validation.
- T10: run full repo validation.

## Dependency map

| Work item | Depends on | Blocks |
| --- | --- | --- |
| Claim inventory | none | all rewrite tasks |
| Architecture claim guard | claim inventory | canonical docs, lane manifests, scratch cleanup |
| Product report claim guard | claim inventory | x402 report cleanup |
| Canonical category rewrite | architecture guard | scratch cleanup, quality claims |
| x402 report cleanup | product report guard | demo/report validation |
| Lane manifest alignment | architecture guard and canonical phrasing | import/export validation |
| Scratch register cleanup | canonical category rewrite | final closeout |
| Focused validation | docs/examples/tests complete | full repo gate |
| Full repo gate | focused gates green | execution readiness |

## Critical path

```text
claim inventory
-> claim-boundary tests fail for old category/spend wording
-> canonical docs rewrite
-> x402 report cleanup
-> active scratch register cleanup
-> focused claim/product gates
-> full repo gate
```

The critical path is claim-test-led because this slice is primarily about preventing future overclaims. Editing docs first without a failing guard risks reintroducing the same ambiguity.

## What can run in parallel

After T0:

- T1 and T2 can run in parallel.

After T1:

- T3 canonical docs and T5 lane manifests can run in parallel if they share a phrase table.

After T2:

- T4 x402 report cleanup can run independently of canonical doc edits.

After T3:

- T6 scratch register cleanup can run in parallel with T4/T5 as long as it mirrors canonical wording and does not invent new claims.

Validation can be staged in parallel only after relevant files settle:

- `test/architecture/claim-boundary.test.ts` and `test/product/x402-protected-spend-demo-report.test.ts` can run as focused slices.
- Import/export checks can run separately if lane/package surfaces change.
- `npm run check:repo` should remain last.

## First executable step

Add failing claim guards before source rewrites:

```bash
npm run test -- test/architecture/claim-boundary.test.ts test/product/x402-protected-spend-demo-report.test.ts
```

Expected initial failure targets:

- Canonical docs still define Handshake as engineering-agent infrastructure in places.
- Product/demo report still treats `spend reservation ledger` as a missing proof object rather than treating aggregate payment-budget management as intentionally out of remit.

## Source/test/doc candidate paths

### Canonical docs

- `AGENTS.md`
- `README.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-definition.md`
- `docs/internal/protocol-kernel-architecture.md`
- `docs/internal/protocol-layman.md`
- `docs/internal/protocol-notes.md`

### Examples and reports

- `examples/x402-protected-spend/README.md`
- `examples/x402-protected-spend/run.ts`
- `examples/self-hosted-activation/README.md`

### Architecture/product tests

- `test/architecture/claim-boundary.test.ts`
- `test/product/x402-protected-spend-demo-report.test.ts`
- `test/architecture/import-posture.test.ts`
- `test/architecture/root-exports.test.ts`
- `test/architecture/active-vocabulary.test.ts` as a candidate if implementation inventory confirms it scans the relevant terms. It was not opened in this first-pass source boundary.

### Lane manifests

- `src/runtime/LANE.md`
- `src/mcp/LANE.md`
- `src/cli/LANE.md`
- `src/sdk/LANE.md`
- `src/adapters/LANE.md`
- `src/conformance/LANE.md`

### Source candidates only if claim guards require output adjustment

These were named by allowed codebase maps but not opened directly in this first pass:

- `src/adapters/x402-payment/install-proposal.ts`
- `src/adapters/x402-payment/action-proposal.ts`
- `src/runtime/ingress/index.ts`
- `src/mcp/x402-proposal.ts`
- `src/surfaces/boundary-manifest.ts`

Use these only for narrow metadata/output posture fixes. Do not change protocol semantics or add aggregate spend enforcement in this slice.

### Planning scratch

- `.planning/macro/DEFERRED-INTEGRATE-ELIMINATE.md`
- `.planning/codebase/CONCERNS.md` only if the implementation owner decides tracked scratch drift must be corrected. Do not treat it as canon.

## Validation gates

Focused gates:

```bash
npm run quality:claims
npm run test -- test/architecture/claim-boundary.test.ts test/product/x402-protected-spend-demo-report.test.ts
npm run demo:aps
```

Architecture/package posture gates:

```bash
npm run test -- test/architecture/import-posture.test.ts test/architecture/root-exports.test.ts
npm run quality:architecture
```

Closeout gates:

```bash
npm run format:check
npm run check:repo
```

If a source-output adjustment touches runtime/MCP/x402 proposal posture, add:

```bash
npm run test -- test/runtime/runtime-ingress.test.ts test/mcp/mcp-x402-proposal.test.ts test/adapters/x402-payment-action-proposal.test.ts
```

## Cut lines

- Do not change Tier 1 protocol object semantics, authority rule, gateway check semantics, greenlight consumption, idempotency behavior, or receipt/proof-gap semantics.
- Do not implement a spend reservation ledger.
- Do not describe aggregate payment-budget management as a pending near-term promise.
- Do not weaken the x402 exact per-call wedge.
- Do not make x402 the protocol definition.
- Do not make engineering agents the product category boundary.
- Do not add seller middleware, facilitator operation, settlement finality, balances, wallet custody, or payment-management claims.
- Do not add hosted operation, hosted dashboard claims, hosted verifier claims, JWKS/revocation claims, customer/provider custody claims, or cross-org trust claims.
- Do not add broad MCP/CLI/browser/shell/network/package-manager/runtime control claims.
- Do not expose CLI/MCP/runtime policy, greenlight, gateway, mutation, receipt-export, signer, or certificate-minting authority.
- Do not create new package exports, scripts, source directories, or public surfaces for this slice unless a claim guard proves the existing surface is misleading.
- Do not edit sibling raw outputs, normalized outputs, or final `PLAN.md` under this run.

## Assumptions

- The user correction is authoritative: Handshake category is protected actions for automated decision making.
- x402 exact per-call protected action is the first wedge for current implementation/product proof.
- Engineering-agent workflows remain important adoption context and threat model, but not the product boundary.
- Current Tier 1 protocol primitives already support the corrected category; the cleanup should not require schema or state-machine changes.
- `not_enforced_local_metadata` can remain when attached to local metadata and explicitly denied as enforcement.
- The current APS report can change wording/report fields without changing the protected action execution path.
- Validation command names are taken from allowed repo docs and codebase testing maps; package script definitions were not independently opened in this first pass.

## Risks

- Category over-broadening risk: "automated decision making" can sound like generic governance. Mitigation: always bind the category to protected actions and gateway-enforced consequence.
- Wedge collapse risk: making x402 the first wedge can accidentally make x402 the protocol. Mitigation: keep "adapter/action pack" language and repeat "No adapter family defines the protocol."
- Payment-management drift: ledger wording can make aggregate budgets look like an unfinished feature. Mitigation: move aggregate payment-budget management to explicit out-of-remit/non-claim language.
- Local metadata ambiguity: `not_enforced_local_metadata` can look like disabled enforcement. Mitigation: tests must require it to appear only as metadata and never as claim support.
- Test overfitting risk: exact string assertions can pass while nearby text overclaims. Mitigation: pair required phrases with forbidden regexes and scan all relevant docs/examples/lanes.
- Scratch drift risk: `.planning/codebase/CONCERNS.md` still says "add spend reservation ledger" as a fix approach. Mitigation: either update tracked scratch or record it as stale derived evidence in the final plan.
- Product proof drift: `x402_paid_http_call.exact` buyer-readable label can be mistaken for action catalog authority. Mitigation: product test must keep it explicitly non-authority until source action catalog, compiler, policy, and gateway expose it.
- Hidden implementation creep: touching `run.ts` may tempt changing x402 behavior. Mitigation: product report edits should not change gateway signing, policy, replay, receipt, or proof-gap behavior.

## Blocked checks

- Tests were not run in this first-pass planning role.
- External verification was not performed. The input says not to browse by default, and this slice should not add npm, MCP Registry, JWKS, Cloudflare, x402, legal, or payment-regulatory claims.
- Source files outside the allowed first-pass packet were not opened, including implementation internals named by codebase maps. Candidate source paths above need implementation-time verification before edits.
- Sibling raw outputs, normalized outputs, and the final `PLAN.md` for this run were not read.
