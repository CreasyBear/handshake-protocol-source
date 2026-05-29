# A2A Negotiation Evaluation Suite

Status: planned

## Evaluation Goal

Bad A2A work must fail objective tests before it can become source truth.

## Unit And Schema Evals

- `NegotiationSession` rejects empty parties, unsupported action types, expired
  sessions, and missing evidence refs.
- `NegotiationOffer` rejects missing terms digest and obligation refs.
- `NegotiationDecision` rejects acceptance by a non-party.
- `LinkedAgreement` rejects accepted terms digest mismatch.
- `AgreementObligationBinding` rejects missing action contract digest.
- `AgreementStatusTransition` rejects invalid status transitions.

## Transition Evals

- opening session emits `negotiation_session_opened`;
- recording offer emits `negotiation_offer_recorded`;
- recording acceptance emits `negotiation_decision_recorded`;
- linked agreement emits `linked_agreement_recorded`;
- binding emits `agreement_obligation_bound`;
- status transition emits `agreement_status_changed`;
- acceptance creates no `policy_decision`, `greenlight`,
  `gateway_check_attempt`, `mutation_attempt`, `receipt`,
  `receipt_export`, or `authority_certificate`.

## Policy Evals

- active exact agreement allows normal policy evaluation to continue;
- missing agreement refuses `agreement_missing`;
- expired agreement refuses `agreement_expired`;
- withdrawn agreement refuses `agreement_withdrawn`;
- disputed agreement refuses `agreement_disputed`;
- superseded agreement refuses `agreement_superseded`;
- missing obligation refuses `obligation_missing`;
- missing binding refuses `obligation_binding_missing`;
- digest mismatch refuses `obligation_contract_digest_mismatch`;
- params mismatch refuses `obligation_params_mismatch`;
- party mismatch refuses `obligation_party_mismatch`;
- counterparty mismatch refuses `obligation_counterparty_mismatch`;
- active isolation still refuses.

## Gateway And x402 Evals

- changed x402 amount refuses;
- changed target URL refuses;
- changed selected payment requirement refuses;
- replayed greenlight refuses;
- payment material appears only after verified gateway check;
- downstream finality unknown records proof gap;
- raw sibling payment path is refused, detected, or recorded as proof gap.

## Readback Evals

- readback shows negotiation status separately from policy status;
- readback shows gateway status separately from downstream outcome;
- support packet redacts raw terms, secrets, signer material, payment payload,
  and payment signature;
- terminal certificate is shown as evidence only;
- proof gaps survive export/readback;
- six-month reconstruction can follow exact refs.

## Product Evals

- first fixture output includes JSON and Markdown;
- output names non-claims;
- output shows accepted offer created no authority;
- output shows bound obligation and exact action contract;
- output shows receipt/refusal/proof gap with reason codes;
- output does not claim settlement, marketplace, legal contract, reputation,
  cross-org trust, or provider custody.

## Suggested Commands

Final command names are deferred to phase planning, but expected gates are:

```bash
npm run test -- test/protocol/a2a-negotiation.test.ts
npm run test -- test/product/a2a-negotiated-x402.test.ts
npm run quality:claims
npm run quality:architecture
npm run check:repo
```

If broad repo gates fail from unrelated dirty work, the closeout must report the
exact blocker and preserve the focused A2A evidence.
