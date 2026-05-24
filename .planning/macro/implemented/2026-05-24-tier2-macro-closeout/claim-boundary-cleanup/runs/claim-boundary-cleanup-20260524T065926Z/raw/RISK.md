# RISK First Pass: Claim Boundary Cleanup

## Invariant At Stake

Claim cleanup must not silently change authority. The slice is safe only if it
narrows product language toward protected actions for automated decision making,
keeps x402 as the first protected-action wedge, preserves per-call exact
authorization, and refuses to create new claims about custody, settlement,
hosted operation, broad runtime control, or payment-budget management.

## Scope Boundary

This is a planning artifact for a future implementation slice. The future slice
should be docs, examples, and claim guards only unless the chair finds a
source-owned guard that must move with the wording. It must not alter Tier 1
protocol semantics, gateway authority, policy evaluation, greenlight behavior,
receipt semantics, storage, x402 signing behavior, or adapter execution.

Source packet evidence used:

- `README.md` still opens with "contracted execution infrastructure for
  engineering agents" and later frames the use case as generated
  engineering-agent execution.
- `AGENTS.md` and `docs/internal/decisions.md` still describe the product
  kernel or first credible domain in engineering-agent terms.
- `docs/internal/protocol-definition.md` gives the safer canonical primitive:
  protected action control, exact action contract, policy decision, one-use
  greenlight, gateway check, and receipt/refusal/proof gap.
- `docs/internal/protocol-kernel-architecture.md` and
  `docs/internal/protocol-notes.md` already separate runtime evidence from
  gateway enforcement and make x402 per-call only.
- `.planning/macro/DEFERRED-INTEGRATE-ELIMINATE.md` explicitly says aggregate
  x402 spend-window enforcement should be eliminated from the near-term remit.
- `.planning/codebase/CONCERNS.md` still contains a derived "Fix approach" that
  adds a spend reservation ledger before claiming aggregate spend enforcement;
  that conflicts with the run input's correction and must be treated as scratch
  risk evidence, not canon.

## P0 Risk Register

### P0.1 Category Boundary Remains Wrong

Risk: If the cleanup leaves the top-level claim as "engineering agents",
Handshake remains scoped to one adoption context instead of the product category:
protected actions for automated decision making. That creates strategy and
architecture drift: future planners may make runtime/agent governance the
product boundary and treat non-engineering protected actions as out-of-scope.

Mitigation: Update canonical product language in `README.md`, `AGENTS.md`,
`docs/internal/decisions.md`, `docs/internal/protocol-notes.md`, and any example
scope text to say protected actions for automated decision making. Keep
engineering agents only as a current adoption context or generated-execution
risk pattern. Preserve the primitive wording from
`docs/internal/protocol-definition.md`.

Cut line: Stop the slice if a task claims Handshake provides generic automated
decision governance, generic agent safety, broad runtime control, or category
coverage beyond installed protected paths.

Validation gate: Claim guard must fail if active canon says "Handshake is
contracted execution infrastructure for engineering agents" as the product
definition. It may allow phrases that explicitly mark engineering agents as a
current adoption context.

### P0.2 x402 Becomes Payment Management

Risk: Current sources contain both correct per-call x402 language and residue
that points toward a "spend reservation ledger" as a missing proof object. If
the cleanup keeps that phrasing, the repo still implies aggregate payment-budget
management is pending rather than intentionally outside the current remit.

Mitigation: Replace "spend reservation ledger required before claim" style
phrasing with "aggregate payment-budget management intentionally out of current
remit". Keep `not_enforced_local_metadata` only where it labels local metadata,
not deferred enforcement. Keep the x402 wedge as one official buyer-side
`x402_payment.exact` per-call path.

Cut line: No task may add a budget ledger, session/day/review enforcement,
spend reporting, balance tracking, settlement state, seller middleware, or
facilitator operation as part of claim cleanup.

Validation gate: `test/architecture/claim-boundary.test.ts` and
`test/product/x402-protected-spend-demo-report.test.ts` should fail on
"spend reservation ledger" in active claim surfaces and should require the
intentional-out-of-remit wording where aggregate spend is discussed.

### P0.3 Docs Create Authority Without Gateway Enforcement

Risk: Claim cleanup can accidentally polish language into "safe", "trusted",
"controlled", or "protected" claims for paths where no customer-owned gateway
owns the mutation credential and checks the exact greenlight before mutation.
That is advisory, not Handshake.

Mitigation: Every broadened product phrase must be paired with the installed
path rule: exact contract, one-use greenlight, customer-owned gateway check
before consequence, receipt/refusal/proof gap, and isolation/bypass evidence
where applicable.

Cut line: Stop if a claim says Handshake protects a path without naming the
gateway enforcement boundary or if it treats runtime, MCP, CLI, SDK, review,
catalog, certificate, or receipt surfaces as authority.

Validation gate: Claim tests must scan canonical docs and lane manifests for
hosted operation, provider custody, broad MCP/runtime/browser/shell/network
control, marketplace/certification, clearing-house readiness, and certificate
trust language unless paired with explicit non-claims.

### P0.4 Claim Guards Are Too Narrow

Risk: Existing `claim-boundary.test.ts` pins important README, x402 walkthrough,
runtime, adapter, conformance, and MCP language, but the source packet shows
category-risk language in `AGENTS.md`, `docs/internal/decisions.md`,
`docs/internal/protocol-notes.md`, and `examples/x402-protected-spend/run.ts`.
A prose cleanup without expanded guards will drift back.

Mitigation: Expand guard coverage to active canon and generated report source:
`AGENTS.md`, `README.md`, `docs/internal/decisions.md`,
`docs/internal/protocol-definition.md`,
`docs/internal/protocol-kernel-architecture.md`,
`docs/internal/protocol-layman.md`, `docs/internal/protocol-notes.md`,
`examples/x402-protected-spend/README.md`,
`examples/x402-protected-spend/run.ts`, `examples/self-hosted-activation/README.md`,
and the lane manifests that carry public posture claims.

Cut line: Do not close the future implementation slice if changed wording is
not guarded by tests. Unguarded prose cleanup is reversible but not durable.

Validation gate: `npm run quality:claims` plus the focused claim/product test
slice must fail on the old category boundary, payment-management implication,
and broad x402/runtime/hosted/custody claims.

## P1 Risk Register

### P1.1 x402 First Wedge Turns Into Protocol Definition

Risk: The user correction says x402 is the first wedge, not the protocol. If
the plan overcorrects from "engineering agents" into "x402 protected spend",
Handshake becomes a payment protocol instead of a protected-action authority
spine.

Mitigation: Say the protocol category is protected actions for automated
decision making. Say x402 is the first protected-action pack because it exercises
exact per-call authorization, gateway signer custody, replay refusal, redacted
evidence, and proof gaps. Keep "No adapter family defines the protocol."

Cut line: Stop if `x402_payment.exact` is described as the general action model,
the protocol definition, broad x402 compatibility, or a settlement/payment
product.

Validation gate: Claim tests should require "No adapter family defines the
protocol" or equivalent language near first-wedge status.

### P1.2 Customer-Owned Gateway Custody Gets Cut Too Far

Risk: Removing provider/customer custody claims can accidentally remove the
future enforcement model. The source needs to say customer-owned gateway custody
is the intended enforcement posture without claiming it is already proven.

Mitigation: Use three states consistently: local/reference gateway fixture is
proven now; customer-owned gateway custody is future required enforcement model;
Handshake-held payment custody is out of remit.

Cut line: Do not claim provider/customer custody is landed. Do not remove
customer-owned gateway custody from the future enforcement architecture.

Validation gate: Canonical docs must include both a current non-claim
("not provider/customer custody") and a future boundary ("customer-owned gateway
custody before live custody claims").

### P1.3 Local Sandbox Evidence Gets Read As Seller Or Facilitator Operation

Risk: The x402 walkthrough and report include local/reference 402 challenge and
signed retry evidence. A buyer can misread that as seller middleware,
facilitator operation, settlement finality, or live provider operation.

Mitigation: Keep the sandbox labeled as local/reference downstream fixture
evidence. Keep `authorityCreated: false` before policy. Keep signed retry as
post-gateway observation, not authority or settlement.

Cut line: No claim may say seller middleware, facilitator operation, settlement
finality, payment finality, live provider operation, or merchant fulfillment
unless a future adapter and external verification exist.

Validation gate: Product report tests should continue checking
`settlementFinalityClaimed: false`, `facilitatorOperationClaimed: false`,
`sellerMiddlewareClaimed: false`, `providerCustodyClaimed: false`, and local
sandbox posture.

### P1.4 Runtime/MCP/CLI Surfaces Launder Authority

Risk: Changing category language toward automated decision making can make MCP,
CLI, runtime, SDK, or review surfaces sound like generalized control planes. The
allowed sources repeatedly state these are proposal/evidence/read surfaces only.

Mitigation: Keep each surface's role explicit: runtime proposes, MCP proposes
and displays evidence, CLI renders local evidence, SDK sends requests and parses
responses. None evaluates policy, creates greenlights, performs gateway checks,
mutates, exports raw receipts, mints authority certificates, or holds signer
material.

Cut line: No new public route, package subpath, CLI command, MCP tool, or SDK
client should be planned for this slice. Any such work is capability expansion,
not claim cleanup.

Validation gate: Existing import/root export/surface posture tests should remain
green, and claim guards should fail if these surfaces are described as
authority, execution, custody, or broad host protection.

### P1.5 Redaction And Privacy Claims Overreach

Risk: Docs can imply privacy-grade redaction or hosted audit readiness while the
source only proves redacted local projections and known pattern coverage. The
codebase concerns note that unknown provider credential formats need fuzzing
before live provider claims.

Mitigation: Say redacted evidence projections are local/source-owned and
diagnostic. Avoid privacy, compliance, audit-search, retention, hosted reader
authorization, or provider secret lifecycle claims.

Cut line: Stop if the plan claims SOC/compliance readiness, hosted audit search,
production privacy posture, retention policy, or provider-grade secret lifecycle
proof.

Validation gate: Claim tests should forbid raw credential terms in examples and
ensure redacted evidence is not described as hosted compliance evidence.

### P1.6 External x402 Facts Drift

Risk: The example source names x402 docs and package versions. This planning
slice is not supposed to browse. If the future implementation changes x402
compatibility, legal/payment-regulatory language, package version claims, or
facilitator semantics without external verification, it can create false claims.

Mitigation: Treat external x402 references as existing source basis only. Do not
change external compatibility claims or regulatory/payment language except to
narrow them. Require external verification for any positive new external claim.

Cut line: No new npm, MCP Registry, JWKS, Cloudflare, x402 compatibility,
payment-regulatory, settlement, facilitator, or custody claim in this slice.

Validation gate: Chair plan should mark external verification as blocked/out of
scope unless a later implementation explicitly requests it.

## P2 Risk Register

### P2.1 Tests Overfit Exact Prose

Risk: Current claim tests rely on exact phrases. Strengthening guards only with
more literal strings can make future truthful wording changes painful and can
encourage cargo-cult phrasing.

Mitigation: Use a mix of required semantic phrases and forbidden regex patterns.
Pin high-risk exact phrases only where they are contractual, such as
`not_enforced_local_metadata`, `x402_payment.exact`, `maxUses: 1`, and
"proposal/evidence only".

Cut line: Do not make tests require every sentence of product copy.

Validation gate: Tests should fail on old overclaims and forbidden broadened
claims while allowing equivalent narrower wording.

### P2.2 `.planning/` Scratch Becomes Canon Again

Risk: The input packet intentionally reads `.planning` files, but repo canon says
`.planning/` is scratch. Derived maps include stale or conflicting improvement
paths. Future agents may reload those maps and override cleaned canon.

Mitigation: The chair plan should explicitly classify `.planning` inputs as run
evidence and risk context, not source of repo truth. Any durable claim must land
in canonical docs and tests.

Cut line: Do not promote `.planning/codebase/*` wording into repo-facing docs
without revalidating against active source and tests.

Validation gate: Support docs should record this assumption, and future
implementation should not reference `.planning` paths from README, source, tests,
scripts, package exports, or CI names.

### P2.3 Example Report Label Remains Ambiguous

Risk: `x402_paid_http_call.exact` is a buyer-readable report proof-object label,
while the actual action class is `x402_payment.exact`. Without guard language,
readers can treat the label as an action catalog type or gateway authority class.

Mitigation: Keep the label explicitly buyer-readable and non-authority until an
action catalog, compiler, policy, and gateway expose that exact action class.

Cut line: Do not add `x402_paid_http_call.exact` as source action class or
public protocol type in this slice.

Validation gate: Product report or claim-boundary tests should assert the label
is non-authority language and the protected action remains `x402_payment.exact`.

### P2.4 Rollback Is Easy But Not Named

Risk: Claim cleanup is mostly reversible docs/tests work, but without explicit
stop conditions a future implementation can keep pushing after tests reveal
category conflicts.

Mitigation: Make rollback mechanical: revert docs/examples/test guard changes
from the slice; no migrations, package API changes, data rewrites, or generated
dist dependency should be necessary.

Cut line: If the future slice needs a migration, route change, storage change,
new package export, or gateway behavior change to make the claims true, stop and
open a separate capability plan.

Validation gate: Closeout diff should contain only canonical docs, examples,
claim tests, and possibly source-owned guard scripts. No protocol behavior diff.

## Validation Gates

Required future closeout gates:

1. `npm run quality:claims`
2. `npm run test -- test/architecture/claim-boundary.test.ts test/product/x402-protected-spend-demo-report.test.ts`
3. `npm run quality:architecture`
4. `npm run format:check`
5. `npm run check:repo`

Additional focused checks the chair should consider:

- A grep-style guard that fails on product-definition uses of "engineering
  agents" outside explicit adoption-context language.
- A guard that fails on "spend reservation ledger" in active claim surfaces.
- A guard that fails on "x402 compatible", "payment management", "settlement",
  "seller middleware", "facilitator operation", "hosted trust",
  "cross-org certificate trust", "marketplace", "certification",
  "clearing-house", and broad MCP/runtime/browser/shell/network/package-manager
  control claims unless explicitly listed as non-claims.
- Regenerate or execute the APS report path only if the implementation changes
  `examples/x402-protected-spend/run.ts`; then verify the report still has local
  non-claims and no raw credential material.

## Rollback And Stop Conditions

Rollback plan:

- Revert the docs/example/test changes from the claim cleanup slice.
- Do not run migrations.
- Do not change package exports or public APIs.
- Do not change x402 gateway behavior, signer custody, policy, greenlight,
  receipt, storage, or adapter semantics.

Stop conditions:

- Any task requires changing Tier 1 protocol meaning.
- Any task adds aggregate spend enforcement, budget reservation, payment
  management, settlement, balances, seller/facilitator operation, or hosted
  payment custody.
- Any task changes gateway, policy, greenlight, receipt, storage, or x402 signing
  behavior to make wording true.
- Any task claims broad runtime/MCP/CLI/browser/shell/network/package-manager
  protection without a host-specific bypass harness.
- Any task requires external legal/payment-regulatory/x402/JWKS/npm/MCP Registry
  claims without external verification.
- Any claim change is not backed by a source-owned guard.

## Assumptions

- The input packet correction is authoritative for this run: Handshake is
  protected actions for automated decision making; engineering agents are an
  adoption context; x402 is the first wedge.
- Tier 1 protocol/kernel semantics are stable and must not be changed by this
  plan.
- x402 remains exact per-call buyer-side authorization only in the current
  wedge.
- `not_enforced_local_metadata` may remain only as local metadata and must not
  imply planned budget enforcement.
- Customer-owned gateway custody remains the future enforcement model, but it is
  not currently proven by the local x402 walkthrough.
- `.planning/` files are scratch coordination. They can reveal drift, but they
  do not override canonical docs and tests.

## Dependencies

- Canonical docs: `AGENTS.md`, `README.md`, `docs/internal/decisions.md`,
  `docs/internal/protocol-definition.md`,
  `docs/internal/protocol-kernel-architecture.md`,
  `docs/internal/protocol-layman.md`, `docs/internal/protocol-notes.md`.
- Claim tests: `test/architecture/claim-boundary.test.ts`,
  `test/product/x402-protected-spend-demo-report.test.ts`, and any existing
  active-vocabulary guard if the chair includes it.
- Lane manifests: `src/runtime/LANE.md`, `src/mcp/LANE.md`, `src/cli/LANE.md`,
  `src/sdk/LANE.md`, `src/adapters/LANE.md`, `src/conformance/LANE.md`.
- Example claim surfaces: `examples/x402-protected-spend/README.md`,
  `examples/x402-protected-spend/run.ts`,
  `examples/self-hosted-activation/README.md`.
- Existing command contract: `npm run quality:claims`, focused Bun tests,
  `npm run quality:architecture`, `npm run format:check`, and
  `npm run check:repo`.

## Antipatterns To Reject

- Clean proof surface -> first market.
- x402 wedge -> x402 defines Handshake.
- Engineering-agent adoption context -> product category.
- Local/reference fixture -> provider/customer custody.
- Per-call authorization -> aggregate payment-budget management.
- Signed retry evidence -> settlement finality.
- Terminal certificate -> permission, identity, certification, or cross-org
  trust.
- MCP/CLI/runtime/SDK proposal or evidence surface -> authority surface.
- Receipt -> downstream business success.
- Claim cleanup -> behavior change.
- `.planning` register -> canonical source truth.

## Blocked Checks

- Did not run tests; first-pass planner was asked to read and plan only.
- Did not browse external x402, npm, MCP Registry, JWKS, Cloudflare, or
  legal/payment-regulatory sources; the input packet said not to browse by
  default and this slice should not make new external claims.
- Did not read source files outside the immutable input packet and the allowed
  file list named inside it.
- Did not inspect sibling raw outputs, normalized outputs, or the final plan for
  this run.
