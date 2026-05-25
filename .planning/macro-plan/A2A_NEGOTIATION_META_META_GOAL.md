# A2A Negotiation Meta-Meta Goal

Status: run-control goal
Purpose: drive GSD planning from architecture through implementation,
evaluation, and review/audit for agent-to-agent negotiated protected-action
events in Handshake.

## Invariant At Stake

Agent-to-agent agreement is not authority.

Handshake may record, project, and audit negotiated obligations only if every
consequential obligation still becomes its own normal protected-action chain:

```text
CandidateAction
-> exact ActionContract
-> PolicyDecision / one-use Greenlight or Refusal
-> GatewayCheck before consequence
-> Receipt / Refusal / ReplayRefusal / ProofGap / Isolation
-> optional AuthorityCertificate as terminal evidence only
```

No negotiation session, offer, counteroffer, acceptance, linked agreement,
marketplace listing, transcript, certificate, service admission, MCP proposal,
or rendered review surface may create permission, signer use, mutation
authority, settlement finality, cross-org trust, reputation, dispute resolution,
or reusable authorization.

## Meta-Meta Goal

Use GSD to plan the complete architecture, implementation, evaluation, and
review/audit path for A2A negotiation in Handshake.

The output must let a future implementation agent build the first A2A
negotiation slice without inventing:

- product category or launch claim;
- protocol object shape;
- transition and event lifecycle;
- authority boundary;
- policy hook;
- gateway proof obligation;
- cross-party evidence posture;
- x402 buyer/seller fixture;
- operator/readback surface;
- evaluation matrix;
- review/audit gates;
- stop conditions.

The planning target is not "generic negotiation." The planning target is:

```text
agent A and agent B negotiate one obligation;
the accepted obligation binds to one fresh protected-action contract;
each party clears only its own protected surface;
the terminal evidence can be reconstructed without treating agreement as authority.
```

## Product Frame

Category:

```text
Clearing layer for agent-negotiated protected-action events.
```

Primary product object:

```text
LinkedAgreement
```

Economic object:

```text
Cleared Work Unit
```

First proof fixture:

```text
buyer-agent / seller-agent negotiation over one buyer-side x402_payment.exact
protected action.
```

First user:

```text
agent builder or platform/security owner who wants agents to negotiate paid
work or paid API access without giving either agent ambient spend authority.
```

10-star moment:

```text
The user sees that an accepted A2A offer did not authorize anything by itself;
Handshake bound one accepted obligation to one exact action contract, cleared or
refused it through policy/gateway, and produced receipt/refusal/proof-gap
evidence that both sides can inspect.
```

## Source Boundary

Current source anchors:

- `docs/internal/protocol-kernel-architecture.md` says bilateral ecosystem
  operation may add negotiation and linked agreements, but each party's
  obligation must still become its own normal `ActionContract`, policy decision,
  greenlight, gateway check, and receipt/refusal/proof-gap chain.
- `docs/internal/protocol-layman.md` says the bilateral object is the agreement
  while the enforcement object remains each side's action contract and gateway
  check.
- `src/protocol/foundation/schema-core.ts` already exposes
  `clearingEvidenceRefs.correlationRef`, `obligationRef`, and
  `counterpartyRef`, which are the existing bridge from contracts to
  negotiated obligations.
- `src/protocol/events/schemas.ts` owns durable event vocabulary.
- `src/protocol/areas/object-registry/` owns protocol object export and raw-read
  posture.
- `src/protocol/kernel.ts` owns transition facade shape.
- `src/protocol/areas/policy-greenlight/sequence-dependencies.ts` owns existing
  same-org action sequencing checks.

Planning scratch, prior chat, memory, and market language are not source truth.
They may inform strategy, but implementation claims must be re-grounded in
current source and tests.

## Required GSD Flow

Run this as a GSD planning chain, not as a single chat answer:

```text
gsd-plan-map
-> gsd-macro-plan
-> gsd-plan-phase
-> implementation slices
-> evaluation suite
-> review/audit chain
```

Use `--runtime multi` and `--authority-overlay` because the target involves
multi-agent execution, x402/payment, cross-party evidence, and protected-action
authority.

The first normal-quality run must not be promoted unless it has durable
architecture, implementation, evaluation, and review artifacts. If subagent or
review-lens execution is unavailable, mark the run `DEGRADED` or
`DEGRADED_UNMAPPED`.

## Required Skill Roles

Use skill roles as production pressure, not ceremony:

| Skill role | Required output | Blocking question |
| --- | --- | --- |
| `handshake-grounding` | source boundary and current non-proofs | Does current source support the claim? |
| `gsd-plan-map` | macro map with authority overlay | Is this the right macro move before implementation? |
| `gsd-macro-plan` | execution-ready macro plan package | Are slices, gates, and handoffs implementable? |
| `api-and-interface-design` | protocol/API/object contracts | Are interfaces hard to misuse and additive? |
| `plan-ceo-review` | market/opening verdict | Does A2A negotiation create market pull or distraction? |
| `plan-eng-review` | architecture and failure-mode review | Can the kernel extension preserve invariants? |
| `plan-devex-review` | first proof and adopter path | Can a builder reach the A2A proof quickly? |
| `plan-design-review` | readback/review surface critique | Can users see agreement vs authority clearly? |
| `plan-agent-review` | multi-agent operability review | Can agents propose without inheriting mutation authority? |
| `security-and-hardening` | cross-party, secret, tenancy, replay review | Do all dangerous paths fail closed? |
| `quality-contract` | acceptance and eval gates | Can bad A2A work fail objective tests? |
| `gsd-code-review` | implementation review | Did code preserve the authority boundary? |
| `gsd-secure-phase` | security review | Are credentials, signers, raw records, and tenancy safe? |
| `gsd-verify-work` | goal-backward completion audit | Does evidence prove the full goal, not a subset? |
| `thermo-nuclear-code-quality-review` | strict claim/maintainability audit | Are claims, names, and exports too broad? |

## Architecture Deliverables

The architecture plan must define all of the following before implementation:

1. new non-authority protocol area:

```text
src/protocol/areas/negotiation/
```

2. additive records:

```text
NegotiationSession
NegotiationOffer
NegotiationDecision
LinkedAgreement
AgreementObligationBinding
AgreementStatusTransition
```

3. additive events:

```text
negotiation_session_opened
negotiation_offer_recorded
negotiation_decision_recorded
linked_agreement_recorded
agreement_obligation_bound
agreement_status_changed
```

4. object-registry posture:

```text
exportPosture: transition_evidence
rawReadPosture: audit_read
```

5. kernel transition methods:

```text
openNegotiationSession
recordNegotiationOffer
recordNegotiationDecision
recordLinkedAgreement
bindAgreementObligation
transitionAgreementStatus
```

6. policy hook:

```text
if clearingEvidenceRefs.obligationRef is present, policy must be able to
require a current LinkedAgreement and a matching AgreementObligationBinding.
```

7. readback projections:

```text
NegotiationTimelineProjection
LinkedAgreementProjection
AgreementObligationProjection
```

8. no-authority proof:

```text
offer acceptance creates no PolicyDecision, Greenlight, GatewayCheck, signer
use, mutation, receipt, receipt export, certificate, settlement, or reusable
authorization.
```

## Implementation Slices

The macro plan must split work into implementation slices with proof gates:

### A2A-001 Source And Schema Foundation

Create negotiation schemas, inputs, object registry entries, and event enum
additions. No policy or gateway behavior yet.

Proof gate: records parse, reject malformed variants, and remain
`transition_evidence` only.

### A2A-002 Transition Lifecycle

Implement session, offer, decision, linked-agreement, obligation-binding, and
agreement-status transitions.

Proof gate: acceptance and linked agreement creation do not create authority or
mutation records.

### A2A-003 Obligation Binding To ActionContract

Bind one accepted obligation to one existing `ActionContract` through
`clearingEvidenceRefs.obligationRef`, `counterpartyRef`, and digest checks.

Proof gate: mismatched contract digest, parameters, party, status, expiry, or
counterparty refuses.

### A2A-004 Policy Integration

Add policy evaluation support for agreement-backed obligations.

Proof gate: expired, withdrawn, disputed, superseded, or mismatched agreements
produce policy refusal, not best-effort continuation.

### A2A-005 x402 Buyer/Seller Fixture

Prove one buyer-agent/seller-agent negotiation over
`x402_payment.exact`.

Proof gate: payment material remains behind `VerifiedGatewayCheck`; downstream
finality remains receipt/proof-gap evidence, not settlement.

### A2A-006 Evidence Readback And Support Packet

Add redacted negotiation/agreement readback and receipt timeline linkage.

Proof gate: readback distinguishes accepted terms, bound obligations, action
contracts, policy, gateway, receipt/refusal/proof-gap, and non-claims.

### A2A-007 Evaluation And Review Closeout

Run product, protocol, security, agent, and claim audits.

Proof gate: all P0/P1 findings are fixed, blocked, cut, or explicitly marked
accepted-risk before promotion.

## Evaluation Suite

The evaluation plan must include failing and passing cases:

- offer acceptance does not create authority;
- accepted offer without obligation binding is not executable;
- obligation binding requires exact accepted terms digest;
- obligation binding requires exact action contract digest;
- party mismatch refuses;
- counterparty mismatch refuses;
- expired agreement refuses;
- withdrawn agreement refuses;
- disputed agreement refuses or proof-gaps according to policy;
- superseded offer cannot be accepted;
- stale transcript evidence refuses or proof-gaps;
- replayed greenlight still refuses;
- changed x402 parameters refuse;
- raw sibling payment path is detected/refused or recorded as proof gap;
- downstream x402 finality unknown records proof gap, not success;
- terminal certificate is evidence only;
- cross-org trust remains proof gap unless a separate trust model is proven;
- readback redacts raw terms, secrets, payment material, and signer material;
- receipt timeline can reconstruct agreement -> obligation -> contract ->
  policy -> gateway -> terminal outcome.

## Review And Audit Gates

No implementation may be called complete until these reviews exist:

1. CEO review: A2A negotiation opens market access without dragging Handshake
   into owning the marketplace.
2. Engineering review: protocol extension is additive, typed, replay-safe, and
   isolated from authority overclaim.
3. Security review: cross-party evidence, tenancy, secrets, signers, raw reads,
   replay, stale terms, and disputed status fail closed.
4. DevEx review: builder can run the first A2A x402 proof without learning the
   whole protocol.
5. Design review: UI/readback makes "agreement is not authority" visible.
6. Agent review: multi-agent runtime can propose and negotiate without raw
   mutation tools.
7. Claim audit: docs and examples do not claim marketplace, settlement,
   legal-contract, reputation, escrow, cross-org trust, provider custody, or
   generic A2A support.
8. Verification audit: tests and generated outputs prove every acceptance gate.

## Hard Stop Conditions

Stop and report `BLOCKED` if:

- the plan treats acceptance as permission;
- the plan lets one agreement authorize multiple mutations;
- the plan lets one party authorize the other party's gateway;
- the plan requires raw signer or payment material outside the gateway;
- the plan depends on cross-org trust before a trust model exists;
- the plan claims settlement, legal contract formation, reputation, dispute
  resolution, escrow, marketplace certification, or provider custody;
- the plan cannot bind accepted terms to exact `ActionContract` digests;
- policy cannot refuse stale, expired, withdrawn, disputed, or mismatched
  agreement state;
- readback cannot reconstruct the chain six months later;
- implementation requires broad root exports before package-surface gates;
- full review/audit gates are missing.

## Success Definition

This meta-meta goal is satisfied when GSD outputs a durable plan package that
contains:

- source boundary;
- macro map;
- execution-ready macro plan;
- architecture contract;
- implementation slice plan;
- evaluation suite;
- review/audit matrix;
- fresh-agent handoff;
- concrete tasks;
- explicit proof gaps and non-claims;
- status that honestly reflects whether the work is ready for phase planning,
  agent execution, or blocked.

## Smallest Next Mechanism

Create the GSD macro-map input packet for:

```text
A2A negotiated protected-action events in Handshake
```

with runtime `multi`, authority overlay enabled, and first fixture
`buyer-agent / seller-agent x402_payment.exact`.
