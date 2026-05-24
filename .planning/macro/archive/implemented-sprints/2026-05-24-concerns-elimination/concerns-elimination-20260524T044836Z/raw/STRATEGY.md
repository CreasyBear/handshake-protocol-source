# STRATEGY

## Invariant At Stake

Runtime and MCP proposal surfaces must not make weaker x402 contracts than the direct adapter path, and the local buyer-side `x402_payment.exact` proof must not get broadened into ledger, custody, hosted, facilitator, seller, host-interception, or registry-publication claims.

## Recommended Macro Shape

1. Close the proposal correctness defects first.
   - Fix runtime x402 posture propagation before any broader cleanup. `src/runtime/ingress/index.ts` already accepts `intendedRequestBodyPosture`, `providerEnvironmentPosture`, and `providerEnvironmentRef`; the builder must pass them into `X402PaymentAttempt` so direct adapter refusals survive runtime ingress.
   - Add runtime tests proving unsupported/omitted request-body posture, missing digest for digest-bound bodies, no-body/body-digest mismatch, and live/unknown/external provider posture refuse before action-contract proposal, with zero policy, greenlight, gateway, mutation, receipt, or certificate records.

2. Bring MCP to parity while keeping it proposal/evidence only.
   - Add the same body and provider-environment posture fields to `McpX402PaymentProposalInputSchema`.
   - Bind those fields into MCP x402 parameters and idempotency material.
   - Refuse live/unknown/unsupported posture before runtime-client calls where possible; otherwise prove the runtime/direct adapter path refuses before contract proposal.
   - Preserve `generatedExecutionGraphPosture: "not_exposed_by_role_scoped_runtime_surface"` and all non-authority flags.

3. Harden the local x402 sandbox evidence boundary.
   - Treat `src/adapters/x402-payment/sandbox-http.ts` as local/reference fixture evidence only.
   - Keep challenge and signed retry outputs explicitly `authorityCreated: false`.
   - Make signed retry evidence impossible to read as seller middleware, facilitator settlement, provider custody, or payment finality.
   - Keep official SDK `PaymentPayload` and `PAYMENT-SIGNATURE` creation behind `VerifiedGatewayCheck` in the wallet gateway.

4. Convert first-wedge cut lines into source-owned guards.
   - Keep `x402_payment.exact` as one buyer-side, per-call, local/reference path.
   - Unsupported x402 surfaces stay classified through conformance code and tests: `upto`, batch settlement, lifecycle hooks, MCP auto-pay, signed offers, signed receipts, seller middleware, and facilitator operation.
   - Keep `x402_paid_http_call.exact` buyer-readable only until the action catalog, compiler, policy, and gateway expose it as a real action class.
   - Spend-window session/day/review fields remain metadata. Do not build a partial ledger in this macro.

5. Only then reduce runtime ingress family hardcoding.
   - Introduce a source-owned proposal-family adapter or registry boundary for runtime ingress.
   - The registry may normalize dispatch families into candidate proposal inputs; it must not issue policy decisions, greenlights, gateway checks, receipts, mutations, or authority certificates.
   - This phase should prevent future family additions from silently dropping refusal-critical fields.

6. Close evidence, package, and planning drift with gates.
   - Evidence projection work should add real redaction and scale mechanisms only where needed: contract-scoped store reads, D1 indexes/range reads, and provider-format redaction fuzzing. Do not claim hosted audit/search from projection cleanup.
   - Package drift closes through `pack:check`, package-surface checks, and published-entrypoint smoke tests after source changes.
   - `.planning` drift closes through architecture gates that keep `.planning` scratch out of package files, public scripts, canonical docs, exported names, and claim/vocabulary authority.

## What To Cut

- Cut aggregate spend ledger implementation from this macro. Keep spend windows unclaimable metadata until a dedicated reservation ledger phase defines tenant/org/principal/agent/action/resource/time-window keys, reservation state, conflicts, recovery, and receipts.
- Cut live provider/customer custody. Local signer proof and fixture gateway custody do not prove provider vault custody, customer wallet custody, rotation, revocation, or resolver failure semantics.
- Cut seller middleware, facilitator operation, settlement finality, signed offers, signed receipts, `upto`, and batch settlement.
- Cut host-wide interception claims for MCP, browser, shell, package manager, cloud API, network, repo, database, and sibling tools.
- Cut hosted verifier, JWKS/revocation, cross-org trust, marketplace, certification, and clearing-house claims.
- Cut npm/MCP Registry publication claims. Source can prove package shape; owner-held registry credentials and real publication are outside this repo.
- Cut any plan step that moves policy, greenlight, gateway check, mutation, signer custody, receipt export, or certificate minting into CLI, MCP, or runtime ingress.

## User-Owned Decisions

No user-owned decision is required to start the concern-elimination macro.

Future decisions that remain deliberately outside this macro:

- Whether to fund a real aggregate spend reservation ledger.
- Which provider custody target should become the first live custody adapter.
- Which host/runtime deserves real bypass-interception proof first.
- Whether and when to publish to npm or the MCP Registry with owner credentials.

## Six-Month Regret Scenario

The bad outcome is a clean-looking x402 demo that quietly taught the market the wrong product: runtime or MCP accepted live/unknown provider posture, defaulted it into local sandbox semantics, and emitted action-contract proposals that the direct adapter would have refused. A pilot then retries multiple changed-amount payments under metadata-only session/day limits, reads local signed retry evidence as settlement, and assumes MCP/runtime protected the host. Six months later the receipt trail is internally consistent but strategically useless because it proves proposal ceremony, not gateway-enforced custody, ledger control, settlement, or host interception.

The second regret is over-abstracting runtime ingress before fixing dropped fields. A family registry that preserves the same posture loss just makes the bug easier to repeat across auth.md, package install, repo write, and future adapters.

## Smallest Strategically Valid First Move

Patch `x402PaymentAttemptForDispatch()` in `src/runtime/ingress/index.ts` to forward:

- `intendedRequestBodyPosture`
- `intendedRequestBodyDigest`
- `providerEnvironmentPosture`
- `providerEnvironmentRef`

Then add focused regression tests in `test/runtime/runtime-ingress.test.ts` proving a wrapped x402 dispatch with unsupported request-body posture or live/unknown provider posture refuses before action-contract proposal and creates no authority-bearing records.

That first move is strategically valid because it closes an actual proposal-boundary defect while preserving the Tier 1 kernel and keeping runtime proposal-only.

## Validation Gates

- Runtime posture propagation:
  - `npm run test -- test/runtime/runtime-ingress.test.ts test/adapters/x402-payment-action-proposal.test.ts`
  - Gate must prove runtime x402 parity with direct adapter refusal semantics.

- MCP posture parity:
  - `npm run test -- test/mcp/mcp-x402-proposal.test.ts test/architecture/mcp-surface-posture.test.ts`
  - Gate must prove MCP remains proposal/evidence only and cannot create policy, greenlight, gateway check, mutation, receipt export, signer custody, or authority certificate evidence.

- x402 sandbox and first-wedge cut lines:
  - `npm run test -- test/adapters/x402-wallet-gateway.test.ts test/integration/x402-d1-http.test.ts test/product/x402-protected-spend-demo-report.test.ts`
  - `npm run test -- test/conformance/x402-upstream-exact-fixtures.test.ts test/conformance/x402-payment-conformance.test.ts`
  - Gate must preserve local/reference labels, `authorityCreated: false`, post-gate signing, unsupported-surface classification, replay refusal, and no settlement/facilitator/seller/custody claims.

- Evidence projection and storage hardening:
  - `npm run test -- test/protocol/evidence-projections.test.ts test/http/d1-http.test.ts test/protocol/protocol-store-atomicity-contract.test.ts`
  - Gate must prove redaction and reconstruction behavior without hosted audit/search claims.

- Claim, architecture, package, and full repo:
  - `npm run quality:claims`
  - `npm run quality:architecture`
  - `npm run demo:aps`
  - `npm run pack:check`
  - `npm run check:repo`
  - Gate must fail on claim broadening, source/package drift, stale package entrypoints, and dirty whitespace.

## Blocked Checks

- Did not read sibling raw outputs, normalized outputs, or `.planning/macro/PLAN.md` by instruction.
- Did not run validation commands; this STRATEGY pass is a raw first-pass planning artifact, not an implementation pass.
- Did not inspect files outside the input packet's allowed source set.
