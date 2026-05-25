# A2A Negotiation Execution Slices

Status: planned

## A2A-001 Source And Schema Foundation

Objective: create the non-authority schema foundation.

Write scope:

- `src/protocol/areas/negotiation/`
- `src/protocol/areas/object-registry/schemas.ts`
- `src/protocol/areas/object-registry/index.ts`
- `src/protocol/events/schemas.ts`
- focused schema tests

Proof gates:

- negotiation records parse and reject malformed variants;
- object registry entries are `transition_evidence` and `audit_read`;
- no policy, greenlight, gateway, mutation, receipt, or certificate records are
  created;
- package root exports remain unchanged unless tests admit the surface.

Stop conditions:

- any schema field implies bearer authorization;
- raw transcript text becomes raw-readable;
- event names imply execution or settlement.

## A2A-002 Transition Lifecycle

Objective: implement session, offer, decision, linked agreement, obligation
binding, and status transitions.

Write scope:

- `src/protocol/areas/negotiation/transitions.ts`
- `src/protocol/areas/negotiation/guards.ts`
- `src/protocol/kernel.ts`
- transition route/SDK surfaces only if explicitly admitted
- focused transition tests

Proof gates:

- acceptance creates no authority records;
- linked agreement creation creates no authority records;
- status transitions are monotonic or explicitly superseding;
- duplicate acceptance and stale counteroffer paths refuse.

Stop conditions:

- acceptance directly calls policy or gateway;
- one linked agreement can bind multiple mutations without per-obligation
  contracts;
- one party can authorize another party's gateway.

## A2A-003 Obligation Binding To ActionContract

Objective: bind one accepted obligation to one exact action contract.

Write scope:

- `src/protocol/areas/negotiation/`
- `src/protocol/areas/action-contract/` only if binding validation requires it
- tests for digest, party, counterparty, params, expiry, and status mismatch

Proof gates:

- `clearingEvidenceRefs.obligationRef` must match the binding;
- `counterpartyRef` must match the accepted counterparty;
- `actionContractDigest` and `paramsDigest` must match;
- mismatches refuse before policy greenlight.

Stop conditions:

- binding can mutate contract parameters;
- binding can be reused across different contracts;
- stale or withdrawn agreement can bind a fresh contract.

## A2A-004 Policy Integration

Objective: make policy aware of agreement-backed obligations.

Write scope:

- `src/protocol/areas/policy-greenlight/`
- reason-code registry
- policy tests

Proof gates:

- expired, withdrawn, disputed, superseded, missing, stale, or mismatched
  agreement state produces policy refusal;
- active agreement with exact binding can proceed to normal greenlight rules;
- isolation still blocks policy and gateway.

Stop conditions:

- policy treats agreement as sufficient permission;
- refusal reason is generic or unauditable;
- gateway path can proceed without policy checking agreement state.

## A2A-005 x402 Buyer/Seller Fixture

Objective: prove first A2A negotiated protected-spend path.

Write scope:

- `examples/a2a-negotiated-x402/`
- product tests
- x402 adapter tests only as needed

Proof gates:

- buyer/seller accepted offer creates no authority;
- accepted obligation binds to `x402_payment.exact`;
- changed amount or endpoint refuses;
- replay refuses;
- signer/payment material appears only after `VerifiedGatewayCheck`;
- downstream finality unknown is proof gap, not success.

Stop conditions:

- fixture claims broad x402 compatibility;
- fixture claims hosted/provider/customer custody;
- fixture uses raw sibling payment path as success.

## A2A-006 Evidence Readback And Support Packet

Objective: make the chain inspectable without leaking raw terms or secrets.

Write scope:

- evidence projections;
- CLI/evidence readback only if admitted;
- example output `latest.json` and `latest.md`;
- product tests.

Proof gates:

- readback reconstructs agreement -> obligation -> contract -> policy ->
  gateway -> receipt/refusal/proof-gap;
- readback distinguishes agreement status from authority status;
- raw terms, secrets, signer material, payment payload, and payment signature
  are redacted or absent.

Stop conditions:

- support packet implies permission, recovery, or settlement;
- readback merges gateway check and downstream finality.

## A2A-007 Review, Evaluation, And Closeout

Objective: prove the implementation and claims.

Required gates:

- `npm run quality:claims`;
- `npm run quality:architecture`;
- focused protocol tests;
- focused product tests;
- package-surface tests;
- generated example outputs;
- final code review;
- security review;
- goal-backward verification.

Promotion:

- `READY_FOR_AGENT_EXECUTION` only after phase plans, source implementation,
  tests, generated outputs, and reviews pass.
