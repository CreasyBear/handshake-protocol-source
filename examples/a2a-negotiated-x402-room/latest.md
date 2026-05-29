# A2A Negotiated Protected Action Readback

A negotiated agreement was linked to one exact protected action; authority came only from policy and gateway checks.

## Verified

- Agreement evidence linked_agreement_demo is recorded with status active.
- Obligation binding agreement_obligation_binding_demo pins the exact action contract digest.
- Policy created one-use greenlight grn_00000000-0000-4000-8000-000000000020.
- Gateway check gat_00000000-0000-4000-8000-00000000004a is recorded before mutation evidence.

## Unknown

- Downstream business finality is unknown.
- Proof gaps remain: gap_00000000-0000-4000-8000-000000000040.
- Payment signature material is redacted from the readback.

## Next Actions

- Resolve or preserve proof gaps before claiming success.
- Do not retry payment with the same greenlight.

## Non-Claims

- marketplace operation (marketplace_operation)
- legal contract formation (legal_contract_formation)
- escrow (escrow)
- settlement finality (settlement_finality)
- reputation (reputation)
- cross-org trust (cross_org_trust)
- provider custody (provider_custody)
- reusable authority (reusable_authority)
- native host containment (native_host_containment)
