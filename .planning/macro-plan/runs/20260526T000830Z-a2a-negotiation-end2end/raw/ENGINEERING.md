# Engineering Review: A2A Negotiation

Status: PASS_WITH_P0_GATES

## Invariant At Stake

The protocol extension must be additive and non-authority. Negotiation records
may coordinate obligations, but only `ActionContract`, policy, greenlight,
gateway, and receipt/refusal/proof-gap transitions control consequence.

## Architecture Verdict

Add a new protocol area:

```text
src/protocol/areas/negotiation/
```

Do not mutate `ActionContract` into a negotiation object. Use
`clearingEvidenceRefs.obligationRef` and `counterpartyRef` to connect the
contract to negotiated evidence.

## Required Schemas

- `NegotiationSession`
- `NegotiationOffer`
- `NegotiationDecision`
- `LinkedAgreement`
- `AgreementObligationBinding`
- `AgreementStatusTransition`

Every schema must include tenant/org scope, digest fields, status fields,
expiry where relevant, evidence refs, non-secret summaries, and explicit
authority flags or non-authority posture.

## Required Events

- `negotiation_session_opened`
- `negotiation_offer_recorded`
- `negotiation_decision_recorded`
- `linked_agreement_recorded`
- `agreement_obligation_bound`
- `agreement_status_changed`

## Required Transition Guards

- one accepted offer per linked agreement;
- accepted offer digest must match linked agreement accepted terms digest;
- obligation binding must match action contract digest;
- responsible party must match principal/agent or accepted participant binding;
- counterparty must match `clearingEvidenceRefs.counterpartyRef`;
- expired, withdrawn, disputed, revoked, or superseded agreement cannot back a
  greenlight;
- binding cannot broaden amount, resource, method, endpoint, credential,
  gateway, or action type beyond accepted terms;
- agreement status changes must be monotonic or explicitly superseding.

## P0/P1 Findings

P0: Cross-org dependencies cannot reuse current same-org sequence dependency
logic. Treat cross-org trust as proof gap until a separate trust model exists.

P0: A single agreement must not authorize multiple mutations. Each obligation
binding must reference one exact contract, and each greenlight remains one-use.

P0: Policy must refuse stale or mismatched agreement state before greenlight.

P1: Object-registry posture must be `transition_evidence` and `audit_read`.
Raw transcript text and secret terms should not be raw-readable.

P1: Event projections must reconstruct the chain without reading internal-only
stream events directly.

## Required Tests

- schema parse/refuse tests;
- transition lifecycle tests;
- no-authority acceptance test;
- obligation binding digest mismatch tests;
- policy refusal tests for expired/withdrawn/disputed/superseded agreements;
- x402 changed parameter and replay refusal tests;
- evidence projection redaction tests;
- root export and package surface tests.

## Engineering Recommendation

Implement in seven slices:

1. schemas and object registry;
2. transition lifecycle;
3. obligation binding;
4. policy hook;
5. x402 fixture;
6. readback projections;
7. audits and claim gates.

Do not add package root exports until package-surface tests define the intended
public boundary.
