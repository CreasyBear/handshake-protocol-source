# CEO Review: A2A Negotiation

Status: PASS_FOR_PHASE_PLANNING
Mode: selective expansion with hard authority boundary

## Invariant At Stake

Handshake wins if it becomes the clearing layer for agent-negotiated work. It
loses if it becomes another marketplace or negotiation chatbot with proof
language attached.

## Verdict

Yes, pursue A2A negotiation, but only as negotiated-obligation clearing.

The commercial object is not "conversation between agents." The commercial
object is a cleared work unit: accepted terms tied to exact protected-action
contracts and terminal evidence.

## Market Thesis

Agents will increasingly:

- buy paid API calls;
- subcontract tasks;
- bid for work;
- deliver work claims;
- request evaluations;
- route payments;
- hand off protected actions across services.

The market gap is not that agents cannot talk. They can. The gap is that
businesses cannot safely accept automated negotiated obligations without proof
that consequence was cleared inside bounds.

## Scope Decision

Keep:

- `LinkedAgreement` as non-authority evidence.
- `AgreementObligationBinding` as the bridge to exact `ActionContract`s.
- first fixture: buyer-agent/seller-agent over `x402_payment.exact`.
- cleared work unit as economic language.

Cut:

- marketplace ownership;
- escrow/settlement;
- legal contract formation;
- generic A2A identity;
- reputation;
- cross-org trust;
- broad dispute resolution.

## P0/P1 Findings

P0: If agreement acceptance creates permission, the product becomes ambient
authority wearing a badge.

P0: If Handshake claims A2A negotiation before the x402 fixture clears through
gateway evidence, the launch claim outruns enforcement.

P1: If the first product surface leads with negotiation UI instead of terminal
evidence, users will misunderstand what Handshake controls.

## Recommendation

Proceed to architecture and phase planning with this product sentence:

```text
Handshake lets services accept, refuse, and reconstruct agent-negotiated
protected-action obligations.
```

Do not promote to implementation until engineering proves exact obligation
binding, policy refusal, replay refusal, and redacted readback.
