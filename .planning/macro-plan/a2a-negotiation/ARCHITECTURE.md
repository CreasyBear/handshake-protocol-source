# A2A Negotiation Architecture Contract

Status: planned

## Invariant

Negotiation records coordinate obligations. They never issue authority.

## New Protocol Area

```text
src/protocol/areas/negotiation/
  schemas.ts
  inputs.ts
  transitions.ts
  guards.ts
  artifacts.ts
  index.ts
```

## Record Contracts

### NegotiationSession

Purpose: bounded context for a negotiation between agents or services.

Required fields:

- `negotiationSessionId`
- `principalId`
- `initiatingAgentId`
- `partyRefs`
- `allowedActionTypeIds`
- `allowedResourceRefs`
- `sessionDigest`
- `transcriptEvidenceRefs`
- `expiresAt`
- `status`
- non-authority flags

Non-authority: opening a session creates no agreement and no protected-action
authority.

### NegotiationOffer

Purpose: records offered terms and proposed obligations.

Required fields:

- `negotiationOfferId`
- `negotiationSessionId`
- `offeredByPartyRef`
- `respondsToOfferId`
- `termsDigest`
- `redactedTermsSummary`
- `proposedObligations`
- `offerDigest`
- `expiresAt`

Non-authority: an offer is evidence only.

### NegotiationDecision

Purpose: records accept, reject, counter, or withdraw decisions over one offer.

Required fields:

- `negotiationDecisionId`
- `negotiationSessionId`
- `negotiationOfferId`
- `decidedByPartyRef`
- `decision`
- `decisionDigest`
- `attestationRef`

Non-authority: acceptance creates no policy decision, greenlight, gateway check,
signer use, mutation, receipt, export, certificate, or reusable authorization.

### LinkedAgreement

Purpose: terminal agreement evidence for one accepted offer.

Required fields:

- `linkedAgreementId`
- `negotiationSessionId`
- `acceptedOfferId`
- `acceptedDecisionId`
- `acceptedTermsDigest`
- `partyRefs`
- `obligationRefs`
- `agreementDigest`
- `status`
- `expiresAt`

Non-authority: a linked agreement cannot be used as a bearer token.

### AgreementObligationBinding

Purpose: binds one negotiated obligation to one exact `ActionContract`.

Required fields:

- `agreementObligationBindingId`
- `linkedAgreementId`
- `obligationRef`
- `responsiblePartyRef`
- `counterpartyRef`
- `actionContractId`
- `actionContractDigest`
- `expectedParamsDigest`
- `bindingDigest`
- `bindingStatus`

Invariant: one binding points to one contract. One contract can clear at most
one gateway-checked mutation attempt through existing greenlight rules.

### AgreementStatusTransition

Purpose: records status changes such as active, withdrawn, expired, disputed,
superseded, or resolved.

Required fields:

- `agreementStatusTransitionId`
- `linkedAgreementId`
- `fromStatus`
- `toStatus`
- `reasonCode`
- `transitionDigest`
- `supersededByAgreementId`
- `effectiveAt`

## Event Additions

Add to `ContractStreamEventSchema`:

```text
negotiation_session_opened
negotiation_offer_recorded
negotiation_decision_recorded
linked_agreement_recorded
agreement_obligation_bound
agreement_status_changed
```

Partitioning: use organization stream with `negotiation:<id>` and
`agreement:<id>` partition keys first. Do not add a new stream scope until a
query requirement proves it.

## Object Registry

All negotiation records:

```text
exportPosture: "transition_evidence"
rawReadPosture: "audit_read"
```

Do not expose raw transcript text, raw terms, secrets, payment payloads, signer
material, or hidden counterparty metadata through raw reads.

## Kernel Facade

Add methods:

```text
openNegotiationSession(input)
recordNegotiationOffer(input)
recordNegotiationDecision(input)
recordLinkedAgreement(input)
bindAgreementObligation(input)
transitionAgreementStatus(input)
```

Each transition must commit records with events through the existing recorder
and conflict semantics.

## Policy Hook

When `ActionContract.clearingEvidenceRefs.obligationRef` is present, policy can
require:

- `LinkedAgreement` exists;
- agreement status is active;
- agreement is not expired;
- obligation exists in the accepted terms;
- `AgreementObligationBinding` matches the action contract;
- responsible party and counterparty match;
- contract digest and params digest match expected values;
- required evidence refs are present;
- no active isolation blocks the party, agreement, resource, gateway, or
  credential ref.

Policy refusal reason codes should be specific:

- `agreement_missing`
- `agreement_not_active`
- `agreement_expired`
- `agreement_disputed`
- `agreement_withdrawn`
- `agreement_superseded`
- `obligation_missing`
- `obligation_binding_missing`
- `obligation_binding_digest_mismatch`
- `obligation_contract_digest_mismatch`
- `obligation_params_mismatch`
- `obligation_party_mismatch`
- `obligation_counterparty_mismatch`

## Readback Projections

Add redacted projections:

```text
NegotiationTimelineProjection
LinkedAgreementProjection
AgreementObligationProjection
```

Required readback axes:

- negotiation status;
- agreement status;
- obligation binding status;
- action contract status;
- policy status;
- gateway status;
- downstream outcome status;
- proof gaps;
- non-claims.

## Cross-Org Boundary

The first implementation is same-tenant/org local/reference unless a separate
trust model is admitted.

Cross-org trust, remote JWKS, portable acceptance, settlement, and marketplace
certification remain proof gaps.
