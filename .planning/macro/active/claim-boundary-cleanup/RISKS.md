# Risks

## P0

### R1 - Category Boundary Remains Wrong

Risk: Canon still defines Handshake as engineering-agent infrastructure. Future plans then treat one adoption context as the whole category.

Mitigation: Add a positive category guard and rewrite canon to protected actions for automated decision making. Allow engineering-agent language only as adoption context, generated-execution stress case, or local proof context.

Validation: `test/architecture/claim-boundary.test.ts` fails on engineering-agent-only product definitions.

### R2 - x402 Becomes Payment Management

Risk: Spend-ledger wording implies aggregate budget management is pending rather than out of remit.

Mitigation: Replace product-scope ledger-required phrasing with aggregate payment-budget management intentionally out of current remit. Keep x402 per-call exact only.

Validation: Product report test rejects `spend reservation ledger` as a current missing proof promise and requires explicit non-remit posture where aggregate spend is discussed.

### R3 - Docs Create Authority Without Gateway Enforcement

Risk: Broadened "protected" language claims control where no gateway owns the mutation credential and checks the exact greenlight.

Mitigation: Bind every protected claim to exact contract, one-use greenlight, gateway check before consequence, and receipt/refusal/proof-gap evidence.

Validation: Claim guards scan named canon and lane manifests for hosted, custody, broad runtime, and certification overclaims.

### R4 - Guard Coverage Is Cosmetic

Risk: Tests pin a few phrases but miss high-risk claim surfaces, or become brittle exact-copy tests that discourage accurate wording.

Mitigation: Use a named surface map with grouped semantic assertions and forbidden overclaim patterns. Keep exact strings only for contract terms such as `x402_payment.exact`, `not_enforced_local_metadata`, `VerifiedGatewayCheck`, and "proposal/evidence only".

Validation: Focused tests fail on known stale category and spend-ledger language before cleanup.

## P1

### R5 - x402 Defines The Protocol

Risk: Correcting engineering-agent drift overcorrects into payment-protocol positioning.

Mitigation: Keep the hierarchy visible: category, primitive, first wedge, adoption context, local proof boundary. Preserve "No adapter family defines the protocol."

Validation: Claim guard requires first-wedge wording and rejects broad x402 compatibility.

### R6 - Customer-Owned Gateway Custody Gets Cut Too Far

Risk: Removing custody overclaims also removes the future enforcement model.

Mitigation: Use three states: local/reference fixture now, customer-owned gateway custody future enforcement model, Handshake-held custody out of remit.

Validation: Docs keep current non-claim and future boundary in separate language.

### R7 - Local Sandbox Evidence Reads As Seller/Facilitator/Settlement

Risk: Local 402 challenge and signed retry evidence get mistaken for seller middleware, facilitator operation, or settlement finality.

Mitigation: Keep local/reference downstream fixture labels and post-gateway observation wording. Maintain report booleans for settlement/facilitator/seller/provider custody false.

Validation: `test/product/x402-protected-spend-demo-report.test.ts` continues asserting local sandbox non-claims.

### R8 - Runtime/MCP/CLI Surfaces Launder Authority

Risk: Automated-decision language makes proposal/evidence/read surfaces sound like control planes.

Mitigation: Lane manifests must say these surfaces do not evaluate policy, issue greenlights, perform gateway checks, mutate, export receipts, invoke signers, or mint certificates.

Validation: Claim-boundary, import-posture, and root-export tests stay green.

### R9 - Redaction And Support Language Overclaims Privacy Or Audit Readiness

Risk: Support/debug docs imply hosted audit, privacy, compliance, retention, or provider secret lifecycle proof.

Mitigation: Add support payload allowlist and forbidden payment/credential field list if first-use docs are touched.

Validation: Claim guards reject raw credential/payment material in public walkthroughs and report output.

## P2

### R10 - `.planning` Scratch Becomes Canon Again

Risk: Future agents load stale derived maps and override cleaned canon.

Mitigation: This plan and support files classify `.planning` as scratch; future implementation may clean active scratch but must not reference it from repo-facing surfaces.

Validation: No README, source, tests, scripts, exports, or CI names refer to `.planning` as product truth.

### R11 - Buyer-Readable Report Label Becomes Action Class

Risk: `x402_paid_http_call.exact` is mistaken for gateway-bound authority.

Mitigation: Keep it explicitly buyer-readable and non-authority. The protected action remains `x402_payment.exact`.

Validation: Product report or claim-boundary test asserts the distinction.

### R12 - Rollback Is Not Mechanical

Risk: A claim cleanup touches behavior, exports, or migrations and becomes hard to reverse.

Mitigation: Limit diff to docs, examples, report strings, claim tests, and active scratch. Stop if behavior must change.

Validation: Closeout diff contains no protocol/gateway/storage/export behavior change unless separately justified by a new plan.
