# Design Review: A2A Negotiation

Status: PASS_FOR_READBACK_SPEC

## Invariant At Stake

The interface must make agreement and authority visually distinct. If users see
"accepted" and infer "authorized," the design is review theatre.

## Primary User Moment

The user opens an A2A event and needs to answer:

```text
What did the agents agree to, which obligations became exact contracts, what
cleared, what refused, and what remains a proof gap?
```

## Information Hierarchy

1. Terminal posture:
   - cleared;
   - refused;
   - proof gap;
   - isolated;
   - pending contract;
   - pending gateway.
2. Agreement posture:
   - offer;
   - counter;
   - accepted;
   - withdrawn;
   - expired;
   - disputed;
   - superseded.
3. Obligation bindings:
   - obligation ID;
   - responsible party;
   - counterparty;
   - action contract ref;
   - digest match posture;
   - policy posture;
   - gateway posture.
4. Evidence timeline:
   - negotiation events;
   - action lifecycle;
   - terminal receipt/refusal/proof gap.
5. Non-claims:
   - acceptance is not permission;
   - receipt is not settlement;
   - certificate is terminal evidence only.

## Required Screens Or Projections

- A2A negotiation timeline.
- Linked agreement detail.
- Obligation binding table.
- Protected action evidence drawer.
- Redacted support packet preview.
- Failure-state readback for mismatch, expiry, dispute, replay, and proof gap.

## P0/P1 Findings

P0: Do not render "Accepted" as a success state unless the protected-action
outcome is separately visible.

P0: Do not combine agreement status and gateway status into one badge.

P1: Every obligation row needs exact refs. Hover-only evidence is not enough.

P1: Empty states must explain whether no contract exists, no policy decision
exists, no gateway check exists, or readback is redacted.

## Design Recommendation

Use a two-column operational detail:

```text
left: negotiation and obligation structure
right: protected-action lifecycle and terminal evidence
```

The top banner should answer:

```text
Agreement accepted. Authority not created until each obligation clears.
```

The first x402 fixture should show "accepted offer" and "payment action
cleared/refused" as separate rows.
