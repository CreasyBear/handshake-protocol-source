# Plan

## Goal

Create an executable implementation plan for claim-boundary cleanup before new capability work.

The future implementation must make the eliminated items intentional product boundaries, not pending promises. It must correct the category boundary to protected actions for automated decision making, preserve Tier 1 protocol meaning, and keep x402 as the first official buyer-side exact per-call protected-action wedge.

The invariant at stake: public repo language must not create authority that the gateway does not enforce.

## Non-Goals

- No Tier 1 protocol or schema redesign.
- No new authority, policy, gateway, greenlight, receipt, storage, or x402 signing behavior.
- No aggregate payment-budget management, spend reservation ledger, balances, settlement, seller middleware, facilitator operation, or payment-management product.
- No Handshake-held wallet, signer, provider, or customer custody claim.
- No hosted operation, hosted trust, hosted verifier, live JWKS/revocation, marketplace, certification, clearing-house readiness, or cross-org certificate trust claim.
- No broad runtime, MCP, CLI, browser, shell, network, package-manager, cloud, repo, or database control claim.
- No broad x402 compatibility claim. The current wedge is one official buyer-side `x402_payment.exact` per-call path.
- No public package, MCP Registry, Cloudflare, legal, or payment-regulatory claim unless a later slice explicitly performs external verification.

## Source Boundary

Used inputs:

- `.planning/macro/active/claim-boundary-cleanup/runs/claim-boundary-cleanup-20260524T065926Z/input.md`
- Raw perspective outputs under `.planning/macro/active/claim-boundary-cleanup/runs/claim-boundary-cleanup-20260524T065926Z/raw/`
- `/Users/joelchan/.codex/skills/gsd-macro-plan/references/plan-contract.md`
- The allowed source files named in the input packet where needed to resolve conflicts.

Not used:

- No archived macro runs.
- No external browsing.
- No source files outside the allowed packet.

Source priority for implementation:

1. User correction in the immutable input packet.
2. Current canonical docs and tests.
3. Current `.planning` active run evidence.
4. Derived `.planning/codebase/*` maps as scratch risk context only.

## Current State

The protocol spine is already broader than the stale product language. `docs/internal/protocol-definition.md` defines protected action control: exact action contract, policy decision, one-use greenlight, gateway check before mutation, and receipt/refusal/proof-gap evidence.

The category language is stale in high-authority docs. `AGENTS.md`, `README.md`, and `docs/internal/decisions.md` still define Handshake around engineering agents in places. That makes an adoption context look like the product boundary.

x402 is the strongest current wedge but has claim residue. The repo already presents one official buyer-side exact per-call x402 path with gateway-held signing after `VerifiedGatewayCheck`, replay refusal, local/reference evidence, and non-claims. But `README.md`, `.planning/codebase/CONCERNS.md`, and `test/product/x402-protected-spend-demo-report.test.ts` still preserve "spend reservation ledger" / "metadata until a ledger exists" posture that can read as pending aggregate payment-budget management.

Current guards exist but are not strict enough for the corrected category. `test/architecture/claim-boundary.test.ts` already checks runtime/MCP/conformance/x402 non-authority language and public entrypoint separation. `test/product/x402-protected-spend-demo-report.test.ts` already checks the local APS report boundary, redaction, role clients, replay refusal, and non-claims. These gates must be strengthened; they were not run during this planning-only synthesis.

`.planning/` contains useful drift evidence but is not repo truth. `.planning/macro/DEFERRED-INTEGRATE-ELIMINATE.md` already says per-call x402 exact authorization is immediate posture and aggregate payment-budget management is not the product. `.planning/codebase/CONCERNS.md` still includes a derived spend-ledger fix path; implementation must treat that as stale risk evidence unless intentionally updated as scratch.

## Target State

Canonical repo truth reads as:

```text
Handshake protects consequential actions from automated decision systems by reducing each protected action attempt to an exact, policy-evaluated, gateway-bound action contract before consequence.
```

The hierarchy is explicit:

```text
category: protected actions for automated decision making
primitive: exact contract -> policy -> one-use greenlight -> gateway check -> receipt/refusal/proof gap
first wedge: one buyer-side x402_payment.exact per-call protected action
current adoption context: automated engineering/runtime workflows and generated execution
local proof boundary: local/reference only unless a customer-owned gateway owns the credential and checks the exact greenlight
```

Engineering-agent workflows remain useful as a generated-execution stress case and adoption context. They do not define the category.

x402 remains one protected-action pack. It proves the spine; it does not define the protocol, broad payment management, settlement, seller/facilitator operation, provider/customer custody, marketplace/certification, or broad x402 compatibility.

Aggregate payment-budget management is explicitly out of current remit. `not_enforced_local_metadata` may remain only when attached to local metadata and surrounded by wording that denies enforcement and budget-management claims.

Claim guards fail if canon, examples, generated reports, or lane manifests imply broader authority than the source enforces.

## Assumptions

- The user correction is authoritative: Handshake is protected actions for automated decision making, not just engineering agents.
- Tier 1 protocol/kernel meaning is stable and must not be changed by this cleanup.
- x402 exact per-call protected action remains the first wedge unless future source evidence proves a narrower sequence is required.
- Existing current x402 proof is local/reference evidence, not live provider/customer custody or hosted operation.
- `.planning/` is scratch; active planning outputs may guide work but must not become repo-facing source paths, scripts, package names, or canonical docs.
- External standards, package publication, registry, legal, payment-regulatory, Cloudflare, JWKS, and live x402 compatibility claims are out of scope for this slice.

## Decisions

- Adopt "protected actions for automated decision making" as the category phrase for this cleanup.
- Keep engineering-agent language only where it is adoption context, generated-execution threat model, or a current local proof context.
- Treat x402 as the first official buyer-side exact per-call protected-action wedge.
- Keep `x402_payment.exact` as the protected action class. Keep `x402_paid_http_call.exact` as buyer-readable report language only unless a future source change adds a matching action catalog, compiler, policy, and gateway class.
- Replace product-scope "spend reservation ledger required before claim" language with "aggregate payment-budget management intentionally out of current remit."
- Keep customer-owned gateway custody as the future enforcement model, while stating that local x402 proof does not prove provider/customer custody today.
- Use source-owned claim guards over a small named surface set. Avoid broad random regex scans, god tests, pass-through abstractions, and spaghetti conditional exceptions.

## Phases

### Phase 0 - Claim Inventory And Phrase Table

Build a small implementation inventory before edits.

Classify each relevant phrase in `AGENTS.md`, `README.md`, `docs/internal/*`, x402 examples, the APS report generator, lane manifests, and active planning scratch as one of:

- category claim;
- first wedge claim;
- current adoption context;
- local/reference evidence only;
- explicit non-claim or cut line;
- stale scratch evidence.

Closeout evidence: an implementation note or PR description table. Do not add a new repo-facing canon file for the inventory.

### Phase 1 - Test-First Claim Guards

Strengthen guards before rewriting docs.

Update `test/architecture/claim-boundary.test.ts` with a named surface map and grouped assertions:

- category boundary assertions for canonical docs;
- x402 wedge assertions;
- payment-management non-claim assertions;
- runtime/MCP/CLI/SDK/lane non-authority assertions;
- custody, hosted, marketplace/certification, clearing-house, and cross-org trust non-claims.

Update `test/product/x402-protected-spend-demo-report.test.ts` so the APS report no longer requires `spend reservation ledger` as a missing proof object. It should require aggregate payment-budget management to be absent from current authority or explicitly listed as out of current remit.

Maintainability rule: use named surfaces and grouped helpers inside the test, or split into focused architecture tests if the file becomes a god file. Do not add repo-wide grep sprawl with opaque exceptions.

Closeout evidence: focused tests initially fail on stale wording, then pass after phases 2-4.

### Phase 2 - Canonical Category Rewrite

Patch canonical docs after guards define the failure.

Candidate paths:

- `AGENTS.md`
- `README.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-definition.md`
- `docs/internal/protocol-kernel-architecture.md`
- `docs/internal/protocol-layman.md`
- `docs/internal/protocol-notes.md`

Required changes:

- top-level category becomes protected actions for automated decision making;
- engineering-agent language moves to adoption context or generated-execution threat model;
- first wedge language becomes x402 exact per-call protected action;
- Tier 1 protocol object meanings remain unchanged;
- "No adapter family defines the protocol" remains visible;
- receipts, terminal certificates, and reports do not become permission, identity, settlement, certification, hosted trust, or downstream business success.

Closeout evidence: category guard passes without protocol behavior changes.

### Phase 3 - x402 Report And Walkthrough Cleanup

Patch the first wedge without broadening it.

Candidate paths:

- `examples/x402-protected-spend/README.md`
- `examples/x402-protected-spend/run.ts`
- `examples/self-hosted-activation/README.md`
- `test/product/x402-protected-spend-demo-report.test.ts`

Required changes:

- scope the walkthrough to one buyer-side `x402_payment.exact` per-call protected action;
- label `x402_paid_http_call.exact` as buyer-readable report language only;
- replace product-scope spend-ledger wording with aggregate payment-budget management out of current remit;
- keep `not_enforced_local_metadata` only as local metadata;
- preserve signer invocation only after `VerifiedGatewayCheck`;
- preserve replay refusal before signer reuse;
- preserve local/reference downstream fixture wording;
- add or preserve support/debug payload redaction boundaries for payment-sensitive material.

Closeout evidence: `npm run demo:aps` regenerates report output and the product report test passes.

### Phase 4 - Lane And Surface Boundary Alignment

Patch only lane wording that reintroduces stale category or authority drift.

Candidate paths:

- `src/runtime/LANE.md`
- `src/mcp/LANE.md`
- `src/cli/LANE.md`
- `src/sdk/LANE.md`
- `src/adapters/LANE.md`
- `src/conformance/LANE.md`

Required posture:

- runtime proposes and records evidence only;
- MCP proposes and displays evidence only;
- CLI reads/renders local evidence only;
- SDK role clients stay role-scoped for walkthroughs;
- adapters are protected-action packs and mutate only after verified gateway checks;
- conformance is reference posture, not certification or standards compliance.

Closeout evidence: import posture, root exports, and claim-boundary tests stay green.

### Phase 5 - Active Scratch Register Cleanup

Patch active planning scratch only where it would mislead future agents.

Candidate paths:

- `.planning/macro/DEFERRED-INTEGRATE-ELIMINATE.md`
- `.planning/codebase/CONCERNS.md` only if the executor decides tracked scratch drift must be corrected in the same slice.

Required posture:

- category uses protected actions for automated decision making;
- x402 exact per-call remains the first wedge;
- aggregate payment-budget management is intentionally out of current remit;
- old spend-ledger fix advice is stale derived evidence unless rewritten.

Closeout evidence: active scratch no longer contradicts canonical docs. Do not reference `.planning` from repo-facing source, package scripts, CI, README sections, or exported symbols.

### Phase 6 - Validation And Closeout

Run focused gates first, then full repo gate last.

Required closeout ordering:

1. `npm run quality:claims`
2. `npm run test -- test/architecture/claim-boundary.test.ts test/product/x402-protected-spend-demo-report.test.ts`
3. `npm run demo:aps` if `examples/x402-protected-spend/run.ts` changed
4. `npm run test -- test/architecture/import-posture.test.ts test/architecture/root-exports.test.ts` if lane/package surfaces changed
5. `npm run quality:architecture`
6. `npm run format:check`
7. `npm run check:repo`

Closeout evidence: command output plus a diff summary proving no protocol behavior changed.

## Task Graph

```text
macro-001 claim inventory
  -> macro-002 architecture claim guards
  -> macro-003 x402 report claim guards

macro-002 architecture claim guards
  -> macro-004 canonical category rewrite
  -> macro-006 lane boundary alignment

macro-003 x402 report claim guards
  -> macro-005 x402 report and walkthrough cleanup

macro-004 canonical category rewrite
  -> macro-007 active scratch cleanup
  -> macro-008 focused claim validation

macro-005 x402 report and walkthrough cleanup
  -> macro-008 focused claim validation
  -> macro-009 APS demo validation

macro-006 lane boundary alignment
  -> macro-010 architecture posture validation

macro-007 active scratch cleanup
  -> macro-008 focused claim validation

macro-008 focused claim validation
macro-009 APS demo validation
macro-010 architecture posture validation
  -> macro-011 full repo closeout
```

Critical path:

```text
inventory -> guard old failures -> canon rewrite -> x402 report cleanup -> active scratch cleanup -> focused gates -> check:repo
```

Parallelizable after inventory:

- architecture claim guards and x402 report claim guards;
- canonical docs and lane manifest wording once phrase table is stable;
- x402 report cleanup independently of lane wording;
- active scratch cleanup after canonical phrasing is settled.

## Risks And Mitigations

- P0: Category boundary remains engineering-agent-only. Mitigation: positive category guard plus bounded-context allowance for engineering-agent examples.
- P0: x402 becomes payment management. Mitigation: explicit non-remit language and product report guard that rejects spend-ledger-as-promise wording.
- P0: Docs create authority without gateway enforcement. Mitigation: every protected claim must bind to exact contract, one-use greenlight, customer-owned gateway check before consequence, and receipt/refusal/proof-gap evidence.
- P0: Claim guards are too narrow or brittle. Mitigation: named source surfaces, grouped high-risk boundaries, required positive language plus forbidden overclaims; avoid whole-repo regex sprawl.
- P1: x402 becomes protocol definition. Mitigation: keep adapter/action-pack discipline and "No adapter family defines the protocol."
- P1: Customer-owned gateway custody gets erased while removing custody overclaims. Mitigation: use three states: local/reference fixture now, customer-owned gateway custody future enforcement model, Handshake-held custody out of remit.
- P1: Local sandbox evidence reads as seller/facilitator/settlement operation. Mitigation: report and tests keep local downstream fixture evidence separate from authority and downstream success.
- P1: Runtime/MCP/CLI surfaces launder authority. Mitigation: lane wording and import/export tests keep them proposal/evidence/read-only.
- P2: `.planning` scratch becomes canon again. Mitigation: support docs and plan state that scratch is coordination evidence only.
- P2: `x402_paid_http_call.exact` reads as an action catalog class. Mitigation: report test labels it buyer-readable only.

## Validation Gates

Existing source-present guards, not re-run during synthesis:

- `test/architecture/claim-boundary.test.ts` currently checks public entrypoint separation and several runtime/MCP/x402 non-claims.
- `test/product/x402-protected-spend-demo-report.test.ts` currently executes the demo report and checks local/reference x402 authority boundaries, role clients, replay refusal, and redaction.

Planned strengthened gates:

- Category gate: canonical docs must state protected actions for automated decision making and must not define Handshake as engineering-agent-only.
- Adoption-context gate: engineering-agent references must be explicitly adoption context, generated-execution stress case, or current local proof context.
- x402 wedge gate: x402 is one official buyer-side exact per-call protected-action pack, not the protocol definition or broad x402 compatibility.
- Payment non-remit gate: aggregate payment-budget management is intentionally outside current remit; no spend ledger is required to make current per-call x402 claim honest.
- Local metadata gate: `not_enforced_local_metadata` appears only as local metadata and never as disabled enforcement.
- Surface authority gate: runtime, MCP, CLI, SDK, review, reports, and terminal certificates cannot create policy, greenlights, gateway checks, mutation authority, receipt export, signer authority, or certification trust.
- Redaction gate: docs and report do not ask users to share `PaymentPayload`, `PAYMENT-SIGNATURE`, private keys, signer refs, raw store records, role-token maps, gateway credentials, or raw payment material.
- Full closeout gate: `npm run check:repo` after focused gates.

Performance and scale posture:

- This slice should not affect runtime performance because it is docs, examples, and tests only.
- Claim guard scans should use a fixed, named set of high-authority files, not unbounded repo traversal.
- Demo regeneration is acceptable as a product proof gate; it must remain deterministic and local.

## Cut Lines

Stop or split into a separate capability plan if implementation requires:

- protocol schema or state-machine changes;
- gateway, policy, greenlight, storage, receipt, x402 signing, or terminal certificate behavior changes;
- aggregate spend enforcement, spend windows, balance tracking, settlement, seller/facilitator roles, or payment management;
- new hosted routes, verifier operation, JWKS/revocation, org auth, retention, or audit search;
- package publication, registry publication, Cloudflare deployment, legal/payment/regulatory claims, or external x402 compatibility claims;
- new public exports, package scripts, source directories, MCP tools, CLI mutation commands, or SDK authority clients;
- broad runtime/MCP/browser/shell/network/package-manager protection claims without host-specific bypass harnesses.

## Rollback / Stop Conditions

Rollback should be mechanical: revert the docs, example, report, and test guard changes from the implementation slice. No migrations, package export changes, source behavior changes, or generated distribution dependency should be necessary.

Stop immediately if:

- a claim can be made true only by changing Tier 1 protocol meaning;
- a test failure suggests implementing a spend ledger instead of narrowing the claim;
- a local/reference fixture is being described as live provider/customer custody;
- a report or terminal certificate is treated as permission, identity, settlement, certification, or hosted trust;
- any positive external claim is added without explicit verification;
- broad runtime/MCP/CLI/browser/shell/network/package-manager control language appears outside an explicit non-claim.

## Smallest Next Action

Add the failing claim-boundary guard first: update `test/architecture/claim-boundary.test.ts` so canonical docs fail when they define Handshake as engineering-agent-only and fail when aggregate payment-budget management is treated as a pending spend-ledger promise instead of intentionally out of current remit.
