# Risks

## P0

| ID | Risk | Failure Mode | Mitigation | Gate |
| --- | --- | --- | --- | --- |
| P0-R1 | Runtime x402 posture defaulting | Runtime observes unsupported/live posture but omits it before `X402PaymentAttemptSchema`, which defaults into contractable local posture. | Forward posture fields, bind idempotency, and refuse pre-contract. | `npm run test -- test/runtime/runtime-ingress.test.ts test/adapters/x402-payment-action-proposal.test.ts` |
| P0-R2 | MCP posture gap | MCP can submit/propose a weaker x402 candidate than the direct adapter would accept. | Add strict posture schema, pre-contract refusal, parameter/idempotency binding, and MCP smoke updates. | `npm run test -- test/mcp/mcp-schema-contract.test.ts test/mcp/mcp-x402-proposal.test.ts test/architecture/mcp-surface-posture.test.ts` |
| P0-R3 | Sandbox evidence overread | Local signed retry appears to prove seller middleware, facilitator settlement, payment finality, provider custody, or authority. | Add typed local/reference evidence boundary and projection/demo claim guards. | `npm run test -- test/adapters/x402-wallet-gateway.test.ts test/product/x402-protected-spend-demo-report.test.ts test/architecture/claim-boundary.test.ts` |
| P0-R4 | Signer custody leakage | Runtime/MCP/CLI/package output exposes signer material or implies provider/customer custody. | Forbidden imports/exports, redaction tests, fixture-vs-live custody labels. | `npm run test -- test/architecture/import-posture.test.ts test/adapters/x402-wallet-gateway.test.ts test/protocol/evidence-projections.test.ts` |
| P0-R5 | Authority moves into proposal surfaces | Runtime/MCP/CLI creates policy, greenlight, gateway, mutation, receipt, receipt export, signer, or certificate evidence. | Lane architecture tests and explicit non-authority flags. | `npm run quality:architecture` |

## P1

| ID | Risk | Failure Mode | Mitigation | Gate |
| --- | --- | --- | --- | --- |
| P1-R1 | Registry refactor preserves bug | Family adapter abstraction repeats posture dropping across a cleaner boundary. | Refactor only after Phase 1 tests pass; add dispatch-kind coverage and parity tests. | `npm run test -- test/runtime/runtime-ingress.test.ts test/runtime/auth-md-candidate-compilation.test.ts test/runtime/package-install-runtime.test.ts` |
| P1-R2 | Spend metadata becomes fake budget enforcement | Session/day/review fields are read as enforced aggregate controls. | Keep `not_enforced_local_metadata` visible and fail broad claims until ledger exists. | `npm run test -- test/adapters/x402-install-proposal.test.ts test/architecture/claim-boundary.test.ts` |
| P1-R3 | Redaction misses provider credential formats | Pattern-based redaction misses raw provider/vault/signer material. | Move toward typed allowlists and add provider-format fuzz fixtures. | `npm run test -- test/protocol/evidence-projections.test.ts` |
| P1-R4 | D1/projection scale gets overclaimed | Tenant/org scans and per-offset reads are mistaken for hosted evidence readiness. | Add scoped reads/range reads before hosted audit/search claims. | `npm run quality:storage` |
| P1-R5 | Package drift | Source schema changes but `dist`, bin smoke, or package metadata lag. | Make `pack:check` and published-entrypoint smoke mandatory closeout. | `npm run pack:check` |
| P1-R6 | Future x402 surfaces sneak into first wedge | Unsupported variants are accepted as extensions of `x402_payment.exact`. | Conformance classifications and hostile upstream fixtures. | `npm run test -- test/conformance/x402-payment-conformance.test.ts test/conformance/x402-upstream-exact-fixtures.test.ts` |

## P2

| ID | Risk | Failure Mode | Mitigation | Gate |
| --- | --- | --- | --- | --- |
| P2-R1 | `.planning` scratch becomes canon | Future agents revive stale plan claims from tracked planning maps. | Guard package/docs/scripts/exports against `.planning` authority. | `npm run quality:claims` and `npm run pack:check` |
| P2-R2 | False closeout | Concern marked done without source mechanism, regression test, and gate. | Closure rule: source diff plus focused test plus architecture/claim/package gate. | `npm run check:repo` |
| P2-R3 | Buyer-readable proof label becomes action-class claim | `x402_paid_http_call.exact` is treated as gateway-bound authority. | Keep label report-only until action catalog, compiler, policy, and gateway support it. | `npm run test -- test/product/x402-protected-spend-demo-report.test.ts test/architecture/claim-boundary.test.ts` |
| P2-R4 | Gateway failure evidence too coarse | Redacted diagnostics hide useful failure categories for operations. | Add redacted reason classes only after no-leakage tests. | `npm run test -- test/adapters/x402-wallet-gateway.test.ts test/protocol/evidence-projections.test.ts` |

## Residual Risk

Live provider custody, hosted verifier operation, host-wide interception, seller/facilitator settlement, aggregate spend enforcement, and public registry publication remain unvalidated because the mechanisms do not exist in the current source. The correct mitigation is explicit cut-line evidence, not partial claims.
