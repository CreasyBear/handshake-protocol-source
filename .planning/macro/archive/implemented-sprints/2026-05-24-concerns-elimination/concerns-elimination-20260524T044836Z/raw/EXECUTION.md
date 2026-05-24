# EXECUTION Perspective

## Phase Sequence

Invariant at stake: exact x402 request/body/provider posture must survive runtime and MCP proposal surfaces without creating authority, and local evidence must not be confused with provider enforcement.

1. **Runtime x402 posture propagation and recorded refusal**
   - Source changes:
     - `src/runtime/ingress/index.ts`: forward `intendedRequestBodyPosture`, `providerEnvironmentPosture`, and `providerEnvironmentRef` from `RuntimeIngressObservedDispatchSchema` into the x402 attempt.
     - `src/adapters/x402-payment/action-proposal.ts`: expose a non-authority runtime refusal builder or split compile-input construction so runtime ingress can record a graph/tool-call/intent refusal instead of throwing when x402 posture is unsupported.
     - `src/adapters/x402-payment/action-proposal.ts`: include body posture and provider-environment posture/ref in x402 idempotency material so the contract key is bound to the same semantics as the params digest.
   - Tests:
     - `test/runtime/runtime-ingress.test.ts`: add unsupported body/live provider dispatch cases that produce `one_or_more_dispatches_refused`, include `x402_request_body_posture_unsupported` and `x402_provider_environment_not_sandboxed`, create no action contract, and create no policy/greenlight/gateway/mutation/receipt records.
     - `test/runtime/runtime-ingress.test.ts`: add supported digest-bound/local-reference case proving the resulting contract parameters preserve body posture, body digest, provider posture, and provider ref.
     - `test/adapters/x402-payment-action-proposal.test.ts`: assert x402 idempotency changes when posture/ref changes where the attempt is contractable.

2. **MCP x402 posture parity**
   - Source changes:
     - `src/mcp/x402-proposal.ts`: require explicit `intendedRequestBodyPosture`, `providerEnvironmentPosture`, and nullable `providerEnvironmentRef` in `McpX402PaymentProposalInputSchema`.
     - `src/mcp/x402-proposal.ts`: preflight MCP proposals through the same x402 refusal semantics as the direct adapter path before any runtime-client call.
     - `src/mcp/x402-proposal.ts`: bind the posture fields into `x402Parameters()`, `deriveMcpX402IdempotencyKey()`, tool-call draft parameters, compile-intent candidate parameters, and any execution-block digest material.
     - `scripts/check-published-entrypoints.mjs`: update the reference MCP proposal input so package smoke tests exercise the explicit posture schema.
   - Tests:
     - `test/mcp/mcp-schema-contract.test.ts`: require the new posture fields in `validProposalInput()` and reject omitted posture as invalid input.
     - `test/mcp/mcp-x402-proposal.test.ts`: prove `unsupported`, `omitted`, `live`, `unknown`, and `external_sandbox` postures refuse before runtime calls, with non-authority structured outcomes.
     - `test/mcp/mcp-x402-proposal.test.ts`: prove supported local/digest-bound posture reaches `compileIntent` with matching parameters and a posture-bound idempotency key.
     - `test/mcp/mcp-stdio-process.test.ts` and package smoke path: keep stdio proposal/evidence only.

3. **x402 local sandbox evidence boundary**
   - Source changes:
     - `src/adapters/x402-payment/sandbox-http.ts`: add an explicit local/reference evidence-boundary object to challenge and signed-retry outputs: local fixture scope, `authorityCreated: false`, `sellerMiddlewareOperated: false`, `facilitatorSettlementPerformed: false`, and `settlementFinality: "not_settlement_finality"`.
     - `src/adapters/x402-payment/sandbox-http.ts`: keep signed retry recording gated on gateway-created signature evidence, local-reference provider posture, and non-ambiguous body posture.
     - `src/protocol/evidence-projections/projections.ts`: keep signed retry labels as downstream fixture evidence and forbid facilitator settlement/finality labels for local sandbox refs.
   - Tests:
     - `test/adapters/x402-wallet-gateway.test.ts`: assert sandbox challenge and signed retry carry the evidence-boundary object and never carry settlement, middleware, or authority fields.
     - `test/adapters/x402-wallet-gateway.test.ts`: add refusal cases for missing signature evidence, wrong signature header, non-reference provider posture, and ambiguous body posture with unchanged signed-retry count.
     - `test/protocol/evidence-projections.test.ts`: prove `evidence:x402-local-sandbox-signed-retry:*` projects as downstream local fixture evidence, not facilitator settlement or finality.
     - `test/product/x402-protected-spend-demo-report.test.ts`: pin buyer-readable report language to local/reference signed retry evidence only.

4. **Runtime ingress family adapter registry**
   - Source changes:
     - `src/runtime/ingress/index.ts`: extract family-specific conversion behind a source-owned runtime ingress family registry while preserving the public `proposeRuntimeIngressActionContracts()` API.
     - Candidate registry shape: `family`, `dispatchKind` coverage, `requiresConfig`, `buildCompileIntentInput`, `preflightRefusalReasonCodes`, `signingSecret`, `supportedGrammarVersion`, and `rawBypassReasonCodes`.
     - Keep runtime ingress proposal-only: registry adapters must not import policy, greenlight, gateway, receipt, storage implementation, or mutation code.
   - Tests:
     - `test/runtime/runtime-ingress.test.ts`: existing package/x402/auth.md cases must pass through the registry unchanged.
     - Add a registry coverage test under `test/runtime/` proving every dispatch kind has exactly one family adapter, missing family config fails closed, and mixed-family blocks retain `runtime-dispatch-mixed-0.1`.
     - `test/architecture/import-posture.test.ts`: guard the registry against forbidden authority imports.

5. **x402 future-surface, spend, custody, and host-bypass guards**
   - Source changes:
     - `src/adapters/x402-payment/conformance.ts`: keep unsupported x402 surfaces as source-owned cut lines and add explicit future-cut classifications for aggregate spend ledger, provider/customer custody, host-wide interception, facilitator/seller middleware, hosted verifier, and registry publication where they are not already represented.
     - `src/adapters/x402-payment/install-proposal.ts`: keep session/day/review controls under `spendWindowEnforcementStatus: "not_enforced_local_metadata"` and prevent them from entering action-contract bounds until a reservation ledger exists.
     - `src/adapters/x402-payment/bypass-probes.ts`: keep fixture gateway custody distinct from real gateway custody; host-bypass probes remain scoped evidence, not host-wide interception.
   - Tests:
     - `test/conformance/x402-payment-conformance.test.ts`: pin every unsupported/future surface to a refusal/cut-line reason code.
     - `test/adapters/x402-install-proposal.test.ts`: assert spend-window metadata never appears in contract bounds and cannot be claimed as enforced.
     - `test/adapters/x402-bypass-probes.test.ts`: distinguish fixture custody from live provider/customer custody and host-scoped bypass evidence from broad host interception.
     - `test/architecture/claim-boundary.test.ts`: keep README/MCP/runtime/doc claims inside exact buyer-side local/reference proof.

6. **Evidence projection scale and redaction mechanisms**
   - Source changes:
     - `src/protocol/store/port.ts`: add contract-scoped evidence lookup methods and batched stream-event range reads.
     - `src/storage/d1/index.ts` and `migrations/0001_protocol_kernel.sql`: add the D1 indexes/tables needed for contract/action/run scoped projection assembly and receipt timeline range reads.
     - `src/protocol/evidence-projections/assembly.ts`: replace broad tenant/org scans with contract-scoped store methods.
     - `src/protocol/evidence-projections/projections.ts`: replace regex-only credential hiding with an allowlisted projection-ref policy plus deny patterns for known credential classes.
   - Tests:
     - `test/protocol/evidence-projections.test.ts`: add provider-format redaction fuzz cases for token, bearer, vault, infisical, raw signature, payment payload, facilitator secret, and auth.md credential refs.
     - `test/http/d1-http.test.ts`: add D1 fixtures proving projection assembly uses scoped indexes and timeline range reads under high unrelated record volume.
     - `test/protocol/protocol-store-atomicity-contract.test.ts`: pin memory/D1 parity for new store methods and conflict behavior.

7. **Publish/package and `.planning` scratch drift gates**
   - Source changes:
     - `scripts/check-package-surface.mjs`: keep `.planning`, tests, local metadata, and generated scratch out of publish dry-run artifacts.
     - `scripts/check-published-entrypoints.mjs`: keep CLI/MCP smoke outputs non-authority and synchronized with the new MCP posture schema.
     - Architecture tests: add an active guard that `.planning` paths cannot appear in package exports, package files, package scripts, CI names, README command sections, or canonical docs except as scratch-boundary language.
   - Tests:
     - `test/architecture/package-surface.test.ts`: pin packable files and `check:repo` -> `pack:check`.
     - `test/architecture/active-vocabulary.test.ts` and `test/architecture/claim-boundary.test.ts`: reject source/package/README claims that promote `.planning` maps to canon.
     - `npm run pack:check`: mandatory before any publish-ready or registry-ready claim.

## Task Graph

```text
T1 runtime-failing-tests
  -> T2 runtime-x402-preflight-refusal-builder
  -> T3 runtime-forward-posture-fields
  -> T4 runtime-idempotency-posture-binding
  -> T5 runtime-focused-gate

T6 mcp-schema-failing-tests
  depends on T2
  -> T7 mcp-explicit-posture-schema
  -> T8 mcp-preflight-refusal-and-binding
  -> T9 mcp-stdio-and-package-smoke-update

T10 sandbox-boundary-tests
  -> T11 sandbox-boundary-source-object
  -> T12 projection-signed-retry-label-guard
  -> T13 product-demo-boundary-gate

T14 runtime-registry-tests
  depends on T5
  -> T15 runtime-family-registry-refactor
  -> T16 runtime-registry-architecture-gate

T17 x402-cutline-tests
  -> T18 conformance-future-surface-cutlines
  -> T19 spend-metadata-and-custody-guards

T20 projection-scale-redaction-tests
  -> T21 store-port-scoped-methods
  -> T22 d1-index-and-range-read-implementation
  -> T23 projection-assembly-refactor
  -> T24 redaction-policy-hardening

T25 package-planning-drift-tests
  depends on T7
  -> T26 package-smoke-and-planning-guard-updates
```

## Dependency Map

- Phase 1 blocks Phase 2 because MCP parity should reuse the same x402 posture refusal semantics rather than inventing a second refusal table.
- Phase 1 blocks Phase 4 because extracting the runtime registry before fixing x402 posture can preserve the bug behind cleaner structure.
- Phase 2 blocks package smoke updates because `scripts/check-published-entrypoints.mjs` must use the final MCP schema.
- Phase 3 can run after Phase 1 starts; it shares x402 posture vocabulary but does not depend on the MCP bridge.
- Phase 5 can run in parallel with Phase 3 once the direct/runtime posture semantics are stable.
- Phase 6 is independent of runtime/MCP behavior except for evidence labels; start after Phase 3 if signed-retry projection labels change.
- Phase 7 depends on Phase 2 for MCP smoke inputs and should close last so package gates reflect the final public surface.

## Critical Path

```text
T1 -> T2 -> T3 -> T4 -> T5 -> T6 -> T7 -> T8 -> T9 -> T25 -> T26 -> full validation
```

This is the critical path because runtime posture propagation is the known high-priority defect, MCP parity must not fork the semantics, and package/public smoke gates must reflect the final MCP input contract.

## Parallelizable Work

- Sandbox boundary work (`T10`-`T13`) can proceed while MCP parity is implemented, as long as it keeps the same posture enum values.
- x402 cut-line/conformance work (`T17`-`T19`) can proceed after the direct adapter refusal table is settled.
- Evidence projection scale/redaction work (`T20`-`T24`) can proceed independently, with one coordination point on signed-retry evidence labels from Phase 3.
- Package/planning drift tests (`T25`) can be drafted early, but the package smoke implementation (`T26`) must wait for MCP schema finalization.

## First Executable Step

Add a failing regression test to `test/runtime/runtime-ingress.test.ts`:

- Create a `wrapped_x402_payment` dispatch with `intendedRequestBodyPosture: "unsupported"`, `providerEnvironmentPosture: "live"`, and `providerEnvironmentRef: "provider-environment:x402-live"`.
- Expect `proposeRuntimeIngressActionContracts()` to return `one_or_more_dispatches_refused`.
- Expect response and proposal reason codes to include `x402_request_body_posture_unsupported` and `x402_provider_environment_not_sandboxed`.
- Expect zero `action_contract`, `policy_decision`, `greenlight`, `gateway_check_attempt`, `mutation_attempt`, and `receipt` records.
- Expect runtime and generated graph evidence to be recorded, with the x402 dispatch node classified non-contractable instead of throwing.

Only after that test fails for the right reason, patch `src/runtime/ingress/index.ts` and `src/adapters/x402-payment/action-proposal.ts`.

## Validation Gates

Focused gates after Phase 1:

```bash
npm run test -- test/runtime/runtime-ingress.test.ts test/adapters/x402-payment-action-proposal.test.ts
npm run check:types
```

Focused gates after Phase 2:

```bash
npm run test -- test/mcp/mcp-schema-contract.test.ts test/mcp/mcp-x402-proposal.test.ts test/mcp/mcp-reference-transcript.test.ts test/mcp/mcp-stdio-process.test.ts
npm run check:types
```

Focused gates after Phase 3 and Phase 5:

```bash
npm run test -- test/adapters/x402-wallet-gateway.test.ts test/conformance/x402-payment-conformance.test.ts test/conformance/x402-upstream-exact-fixtures.test.ts test/product/x402-protected-spend-demo-report.test.ts
npm run quality:claims
```

Focused gates after Phase 4:

```bash
npm run test -- test/runtime/runtime-ingress.test.ts
npm run quality:architecture
```

Focused gates after Phase 6:

```bash
npm run test -- test/protocol/evidence-projections.test.ts test/http/d1-http.test.ts test/protocol/protocol-store-atomicity-contract.test.ts
npm run quality:storage
```

Final gates:

```bash
npm run demo:aps
npm run quality:claims
npm run quality:architecture
npm run pack:check
npm run check:repo
```

## Blocked Checks

- No user-owned product decision blocks execution; the current concern packet already cuts ledger, live custody, host-wide interception, hosted verifier, facilitator/seller middleware, and registry publication from this macro plan.
- External publication checks remain blocked on owner-held npm/MCP Registry credentials, so validation must stop at `npm run pack:check` and source-owned package smoke tests.
- Live provider/customer custody tests remain blocked until a real provider/vault custody integration is introduced; current work can only add fixture-vs-live cut-line tests.
- Broad host interception checks remain blocked until a specific host adapter/browser/shell/package-manager/cloud integration is in scope; current work can only preserve runtime/MCP bypass evidence as scoped, non-host-wide evidence.
