# Chair Synthesis

## Invariant At Stake

No x402 proposal surface may create a cleaner contract than the protected path actually observed, and no evidence surface may imply authority, custody, settlement, hosted operation, broad interception, or aggregate spend enforcement that the gateway does not enforce.

## Synthesis

The five perspectives converged on the same sequence. The immediate implementation work is not a registry refactor, package cleanup, or docs correction. The first defect is runtime posture loss: the runtime schema accepts `intendedRequestBodyPosture`, `providerEnvironmentPosture`, and `providerEnvironmentRef`, but `x402PaymentAttemptForDispatch()` drops them before the direct adapter boundary. That can turn unsupported or live posture into default local-reference posture. This is compiler overreach by omission.

The second defect is MCP posture parity. MCP is proposal/evidence only, but its model-facing x402 proposal schema currently cannot express the same body/provider boundary as the direct adapter. MCP must either bind explicit posture into a proposed contract or refuse before proposal. It must not solve parity by importing adapter execution, wallet, signer, storage, policy, gateway, receipt, all-role SDK, or certificate authority code.

The third defect is evidence interpretation. The local x402 sandbox is useful because it shows a post-gate signed retry can be observed in a local/reference fixture. It is dangerous if the resulting evidence reads like seller middleware, facilitator operation, settlement finality, provider custody, or authority. The fix is a typed local/reference evidence boundary plus projection/demo tests, not friendlier copy.

Only after those nearest defects are covered should runtime ingress be extracted behind a family registry. The registry is a hardening step to prevent future field loss; if done first, it can preserve the current bug in a cleaner shape.

The rest of the concern set is not implementation-by-half. Spend ledger, provider/customer custody, hosted verifier, host-wide interception, seller/facilitator operation, settlement, and public registry publication are explicit cuts. This macro should add source-owned guards that keep those surfaces unclaimable, not partial substitutes.

## Chosen Phase Order

1. Runtime x402 posture propagation and pre-contract refusal.
2. MCP x402 posture parity while staying proposal/evidence only.
3. Local sandbox evidence boundary.
4. Runtime ingress family registry/refactor hardening.
5. x402 future-surface, spend metadata, custody, and host-bypass guards.
6. Evidence projection scale and redaction mechanisms.
7. Package, `.planning`, demo, and closeout gates.

## Reconciled Differences

- Some raw outputs mention no `intent_compilation` record on posture refusal, while others allow a refused compile-intent record. The synthesis requires no action contract or authority-bearing records. If the existing protocol path records a refused intent compilation, it must be explicitly non-authority and reconstructable.
- Some raw outputs suggest backwards-compatible MCP normalization. The synthesis chooses strict explicit posture fields. If compatibility is later required, omitted posture must still fail closed as schema invalid or structured pre-contract refusal.
- Evidence projection scale is included after x402 boundary phases, but it remains a mechanism for local reconstruction and future readiness. It does not authorize hosted audit/search claims.

## Outputs Written

- `.planning/macro/PLAN.md`
- `.planning/macro/CONTEXT.md`
- `.planning/macro/ASSUMPTIONS.md`
- `.planning/macro/DECISIONS.md`
- `.planning/macro/RISKS.md`
- `.planning/macro/VALIDATION.md`
- `.planning/macro/TASKS.jsonl`
- `.planning/macro/runs/concerns-elimination-20260524T044836Z/synthesis.md`

## Blocked Checks

- No implementation validation commands were run; this chair task writes planning artifacts only.
- Live provider/customer custody remains blocked by absent provider/vault custody mechanism.
- Aggregate spend enforcement remains blocked by absent reservation ledger.
- Hosted verifier/JWKS/revocation/cross-org trust remains blocked by absent hosted verifier mechanism.
- Broad host/browser/shell/package/cloud/repo/MCP interception remains blocked by absent host-specific harnesses.
- Seller middleware, facilitator operation, settlement finality, signed offers, signed receipts, `upto`, and batch settlement remain blocked by absent action classes, policy, gateway, and receipt support.
- Actual npm/MCP Registry publication remains blocked by owner-held external credentials.

## Smallest Next Mechanism

Add the failing runtime x402 posture regression in `test/runtime/runtime-ingress.test.ts`, then patch `x402PaymentAttemptForDispatch()` to forward posture fields and update x402 idempotency material.
