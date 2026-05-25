# Chair Synthesis: A2A Negotiation Macro Plan

Run: `20260526T000830Z-a2a-negotiation-end2end`
Status: `READY_FOR_PHASE_PLANNING`

## Convergence

All five review lenses converge on the same macro move:

```text
Add negotiated-obligation evidence and binding records, not negotiation
authority.
```

The first proof must be a buyer-agent/seller-agent
`x402_payment.exact` fixture. The agreement is a coordination/readback object.
The enforcement object remains the action contract and gateway check.

## Accepted Decisions

1. Add a new `negotiation` protocol area.
2. Add `LinkedAgreement` and `AgreementObligationBinding` as transition
   evidence only.
3. Use existing `clearingEvidenceRefs.obligationRef` and `counterpartyRef` to
   connect action contracts to negotiated obligations.
4. Keep first proof local/reference, not hosted/cross-org.
5. Require policy refusal for expired, withdrawn, disputed, superseded, stale,
   or mismatched agreement state.
6. Defer cross-org trust, marketplace, escrow, reputation, settlement,
   provider custody, and legal contract formation.

## P0 Gates

- agreement acceptance cannot create authority;
- one agreement cannot authorize multiple mutations;
- one party cannot authorize another party's gateway;
- policy must check agreement state before greenlight;
- gateway must still verify one-use greenlight before payment/signer material;
- readback must separate agreement status, policy status, gateway status, and
  downstream finality;
- raw terms, secrets, signer material, and payment material must not leak in
  readback or support packets.

## Plan Status

`READY_FOR_PHASE_PLANNING`

Reason: this package contains source boundary, lens reviews, architecture
contract, execution slices, evaluation suite, audit gates, task list, and agent
handoff. It is not `READY_FOR_AGENT_EXECUTION` because implementation phase
plans and source edits have not yet been created or verified.
