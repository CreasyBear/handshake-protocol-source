# A2A Negotiation Implementation Eval Review

Status: `PRODUCTION_READY_FOR_BOUNDED_LOCAL_REFERENCE_ROOM`
Score: `96/100`
Date: `2026-05-26`

## Invariant At Stake

Agent-to-agent agreement is evidence and policy input. It is not authority.

The implementation is acceptable only if accepted negotiation evidence cannot
mint a policy decision, greenlight, gateway check, mutation attempt, receipt, or
certificate, and every consequential x402 payment remains bound to one exact
ActionContract plus one-use gateway enforcement.

## Evaluation Verdict

The bounded room is implemented end to end:

```text
NegotiationSession
-> NegotiationOffer
-> NegotiationDecision
-> LinkedAgreement
-> AgreementObligationBinding
-> ActionContract
-> PolicyDecision / Greenlight or Refusal / ProofGap
-> GatewayCheck
-> x402 signer invocation only after verified gate
-> Receipt / ProofGap / ReplayRefusal
-> Support packet readback
```

## Coverage Matrix

| Dimension | Result | Evidence |
| --- | --- | --- |
| Schema strictness | Covered | `test/protocol/negotiation-schemas.test.ts` |
| Object registry posture | Covered | `test/protocol/negotiation-object-registry.test.ts` |
| Recorded-only events | Covered | `test/protocol/negotiation-events.test.ts` |
| Negotiation transitions | Covered | `test/protocol/negotiation-transitions.test.ts` |
| Agreement creates no authority | Covered | `test/protocol/negotiation-transitions.test.ts`, `test/product/a2a-negotiated-x402-room.test.ts` |
| Obligation-to-contract exact binding | Covered | `src/protocol/areas/negotiation/transitions.ts`, `test/protocol/negotiation-policy.test.ts` |
| Policy refusal and proof-gap gates | Covered | `src/protocol/areas/negotiation/policy.ts`, `test/protocol/negotiation-policy.test.ts` |
| Scope drift rejection | Covered | `src/protocol/areas/negotiation/transitions.ts`, `src/protocol/areas/negotiation/policy.ts`, `test/protocol/negotiation-transitions.test.ts` |
| Session and offer expiry | Covered | `src/protocol/areas/negotiation/transitions.ts`, `src/protocol/areas/negotiation/policy.ts`, `test/protocol/negotiation-transitions.test.ts`, `test/protocol/negotiation-policy.test.ts` |
| Single-use obligation authority | Covered | Agreement-backed greenlights use an obligation-scoped idempotency ledger key; `test/protocol/negotiation-transitions.test.ts`, `test/protocol/negotiation-policy.test.ts` |
| Gateway remains final enforcement | Covered | `test/product/a2a-negotiated-x402-room.test.ts` |
| x402 signer material appears only post-gate | Covered | `test/product/a2a-negotiated-x402-room.test.ts` |
| Replay refusal | Covered | `test/product/a2a-negotiated-x402-room.test.ts` |
| Readback/support packet redaction | Covered | `src/surfaces/a2a-negotiation-support/index.ts`, `test/product/a2a-negotiated-x402-room.test.ts` |
| Generated fixture output | Covered | `examples/a2a-negotiated-x402-room/latest.json`, `examples/a2a-negotiated-x402-room/latest.md` |
| External A2A trust / legal contract / settlement | Explicit non-goal | Macro plan forbids these claims; source keeps refs imported evidence only |

## Gates Run

- `bun test test/protocol/negotiation-schemas.test.ts test/protocol/negotiation-object-registry.test.ts test/protocol/negotiation-events.test.ts test/architecture/negotiation-no-authority-surface.test.ts test/protocol/negotiation-transitions.test.ts test/protocol/negotiation-policy.test.ts test/product/a2a-negotiated-x402-room.test.ts`
- `bun examples/a2a-negotiated-x402-room/generate.ts`
- `npm run check:types`
- `npm run lint`
- `npm run quality:claims`
- `npm run quality:architecture`
- `npm run test`
- `npm run format:check`
- `npm run check:repo` after sidecar-review blocker fixes: 804 tests, 0 failures

## Sidecar Review Findings Closed

- Cross-scope negotiation evidence is refused before binding or policy.
- Expired negotiation sessions and offers are refused at transition time and
  policy time.
- One linked agreement obligation cannot be rebound to multiple action
  contracts, and agreement-backed greenlights reserve an obligation-scoped
  idempotency ledger key.
- `x402_payment.exact` policy now applies by action class, not by optional
  parameter presence.
- The support packet reports lifecycle assembly status instead of silently
  collapsing errors into null lifecycle state.
- The A2A room now tests selected payment requirement drift and ships both JSON
  and Markdown fixture output.

## Residual Risks

- The room is local/reference. It does not prove cross-org trust, identity
  verification, marketplace operation, escrow, legal contract formation,
  settlement finality, reputation, provider custody, or hosted production
  custody.
- Negotiation transitions are kernel-only. No CLI, HTTP, MCP, SDK, or root
  package surface is admitted for negotiation yet.
- The support packet is a readback projection over existing records. It is not a
  review renderer and does not create authority.
- The single-use obligation ledger is proven through the existing policy
  idempotency reservation path, not a new marketplace/settlement ledger.

## Verdict

Keep.

This is a valid Tier 3 heat-up slice because it binds A2A negotiation evidence
into the existing protected-action spine without weakening the authority model.
The product claim must stay narrow:

```text
Handshake records, binds, clears, refuses, and reconstructs one local/reference
agent-negotiated protected-action obligation.
```

The next mechanism is an admitted transport surface for recording negotiation
evidence, still without exposing greenlight or gateway authority.
