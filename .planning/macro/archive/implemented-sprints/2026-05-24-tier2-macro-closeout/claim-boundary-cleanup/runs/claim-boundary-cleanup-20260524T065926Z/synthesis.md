# Chair Synthesis

## Invariant At Stake

Claim cleanup must not silently create authority. The repo must say protected actions for automated decision making, preserve exact contract -> policy -> one-use greenlight -> gateway check -> receipt/refusal/proof gap, and keep x402 as the first buyer-side exact per-call protected-action wedge.

## Inputs Read

- Immutable input packet for `claim-boundary-cleanup-20260524T065926Z`.
- Raw perspective outputs: Strategy, Architecture, Execution, Risk, Adoption.
- Macro plan contract.
- Selected allowed source files to verify current claim/test surfaces.
- Lightweight memory lookup for prior repo-specific x402/Tier discipline.

No archive macro runs, sibling normalized outputs, or external sources were read.

## Synthesis

The perspectives converged on one sequence:

1. Inventory claims and produce a phrase table.
2. Add or strengthen failing claim guards.
3. Rewrite canonical category language.
4. Clean x402 report and walkthrough wording.
5. Align lane manifests only where they drift.
6. Clean active scratch drift.
7. Run focused claim gates and full repo gate.

The plan is test-led because prose cleanup alone would be reversible. The durable mechanism is a small, named claim-boundary guard surface covering canonical docs, x402 examples/report output, and lane manifests.

## Conflicts Resolved

### Engineering Agents

Decision: engineering agents are not the product category. They remain as adoption context, generated-execution threat model, and current local proof context.

Reason: the protocol primitive already supports protected action control, and the user correction is explicit.

### x402

Decision: x402 is the first official buyer-side exact per-call protected-action wedge, not the protocol definition.

Reason: the source packet proves the x402 path as the strongest current wedge, but broad payment, compatibility, settlement, seller/facilitator, hosted, and marketplace claims are out of scope.

### Spend Reservation Ledger

Decision: product-scope spend-ledger-required language should be replaced with aggregate payment-budget management intentionally out of current remit.

Reason: treating the ledger as missing proof makes payment-budget management look like a pending promise. The current claim is exact per-call authorization only.

### `.planning` Evidence

Decision: active `.planning` files can be cleaned as scratch drift but must not become canon.

Reason: README and decisions docs define `.planning/` as scratch. Durable claims must land in canonical docs and tests.

### Claim Guards

Decision: strengthen existing guard surfaces rather than build a new broad vocabulary subsystem.

Reason: the slice should avoid god files, regex sprawl, pass-through abstractions, and capability expansion. A fixed surface map with grouped assertions is enough for this cleanup.

## Architecture And Control Flow Preserved

```text
automated decision / generated execution evidence
-> runtime or MCP proposal/evidence surface
-> intent compilation
-> CandidateAction
-> ActionContract
-> PolicyDecision
-> one-use Greenlight
-> GatewayCheck before mutation
-> x402 wallet gateway signer use after VerifiedGatewayCheck
-> Receipt / Refusal / ProofGap / terminal local evidence
```

Only the first node is generalized from engineering-agent-only language to automated decision making. The authority path remains unchanged.

## Blocked Checks

- No tests were run; this chair task was planning-only.
- No `npm run quality:claims`, focused tests, demo, or `check:repo` gate was executed.
- No external x402, npm, MCP Registry, JWKS, Cloudflare, legal, or payment-regulatory verification was performed.
- No source implementation files outside the allowed packet were opened.

## Output Files Written

- `.planning/macro/active/claim-boundary-cleanup/PLAN.md`
- `.planning/macro/active/claim-boundary-cleanup/CONTEXT.md`
- `.planning/macro/active/claim-boundary-cleanup/ASSUMPTIONS.md`
- `.planning/macro/active/claim-boundary-cleanup/DECISIONS.md`
- `.planning/macro/active/claim-boundary-cleanup/RISKS.md`
- `.planning/macro/active/claim-boundary-cleanup/VALIDATION.md`
- `.planning/macro/active/claim-boundary-cleanup/TASKS.jsonl`
- `.planning/macro/active/claim-boundary-cleanup/runs/claim-boundary-cleanup-20260524T065926Z/synthesis.md`
