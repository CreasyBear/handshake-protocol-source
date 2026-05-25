# A2A Negotiation Macro Plan

Status: `READY_FOR_PHASE_PLANNING`
Run: `20260526T000830Z-a2a-negotiation-end2end`

## Invariant At Stake

Agent-to-agent agreement is not authority.

Handshake may coordinate negotiated obligations only if every consequential
obligation is reduced to a fresh exact protected-action contract and then
cleared or refused through policy and gateway enforcement.

## Product Claim Under Plan

Allowed future claim after implementation and gates:

```text
Handshake records, binds, clears, refuses, and reconstructs agent-negotiated
protected-action obligations.
```

Forbidden current claim:

```text
Handshake supports A2A negotiation today.
```

Forbidden future overclaims:

- marketplace operation;
- escrow;
- legal contract formation;
- settlement finality;
- reputation;
- dispute resolution;
- provider/customer custody;
- cross-org trust;
- generic A2A protocol support.

## Selected Macro Move

Create a non-authority `negotiation` protocol area:

```text
NegotiationSession
-> NegotiationOffer
-> NegotiationDecision
-> LinkedAgreement
-> AgreementObligationBinding
-> AgreementStatusTransition
```

Then bind each accepted obligation to:

```text
ActionContract.clearingEvidenceRefs.obligationRef
ActionContract.clearingEvidenceRefs.counterpartyRef
```

The binding feeds policy checks. It does not create authority.

## First Proof

Buyer-agent/seller-agent negotiation over one buyer-side
`x402_payment.exact` protected action.

The proof must show:

1. accepted offer creates no policy decision, greenlight, gateway check, signer
   use, mutation, receipt, or certificate;
2. accepted obligation binds to one exact `ActionContract`;
3. policy can refuse mismatch, expiry, withdrawal, dispute, supersession, stale
   evidence, changed params, and replay;
4. gateway still owns final enforcement before payment material;
5. receipt/readback separates agreement acceptance from downstream payment
   finality.

## Review Chain

Inline lens sequence completed:

```text
plan-ceo-review
-> plan-eng-review
-> plan-design-review
-> plan-devex-review
-> plan-agent-review
-> chair synthesis
-> validation audit
```

Review outputs:

- `runs/20260526T000830Z-a2a-negotiation-end2end/raw/CEO.md`
- `runs/20260526T000830Z-a2a-negotiation-end2end/raw/ENGINEERING.md`
- `runs/20260526T000830Z-a2a-negotiation-end2end/raw/DESIGN.md`
- `runs/20260526T000830Z-a2a-negotiation-end2end/raw/DEVEX.md`
- `runs/20260526T000830Z-a2a-negotiation-end2end/raw/AGENT.md`

## Key Decisions

1. Use existing `clearingEvidenceRefs` as the contract bridge.
2. Add new records as `transition_evidence`, not `receipt_evidence` or
   authority.
3. Keep public/root exports closed until package-surface tests admit them.
4. Keep first fixture local/reference and x402 buyer-side.
5. Do not solve cross-org trust in the first slice.
6. Treat marketplace and settlement language as explicit non-goals.
7. Make readback show agreement status, policy status, gateway status, and
   downstream outcome as separate axes.

## Blockers Before Implementation

- A2A-001 phase plan must name exact source files and tests.
- Package export posture must be decided before public API exposure.
- Policy hook shape must be reviewed against existing policy transitions.
- Readback projection must prove redaction before support/export paths.
- Cross-org trust must remain a proof gap unless explicitly admitted later.

## Final Status

`READY_FOR_PHASE_PLANNING`

The next valid step is a detailed phase plan for `A2A-001 Source And Schema
Foundation`.
