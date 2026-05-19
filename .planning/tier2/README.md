# Tier 2 X402 System Design Packet

Status: planning scratch, created 2026-05-19.

This directory is intentionally under `.planning/`. It is not active repo canon.
It is a design packet for deciding what Tier 2 should become before any source
implementation begins.

## Invariant at stake

Tier 2 must prove that a generated agent payment attempt cannot become wallet
authority merely because an x402 buyer library can automatically retry a request
with a signed payment payload.

## Goal

Move from Tier 2 concept to feasibility/basic design for a self-hosted protected
action loop built on the Tier 1 protocol kernel, using one x402 transaction as
the first proof lens.

The design must answer:

- what exact protected action is being controlled;
- what generated execution shape produces the candidate;
- which gateway owns the mutation authority;
- what policy can greenlight or refuse;
- how the gateway checks the exact one-use greenlight before mutation;
- what receipt, refusal, proof-gap, or bypass evidence survives.

## Packet

- `01-x402-source-study.md`: primary-source x402 facts, current constraints,
  and threat pressure.
- `02-system-design.md`: proposed Tier 2 architecture, flows, components, data
  contracts, and non-claims.
- `03-spec.md`: spec-driven implementation target for the first feasible build.
- `04-doubt-and-review.md`: doubt-driven review plus CEO, engineering, design,
  and DevEx pressure tests.

## Repo anchors

Current Tier 1 canon says:

- `docs/internal/protocol-definition.md`: authority exists only after an exact
  `ActionContract`, exact policy greenlight, one-use unconsumed `Greenlight`,
  no blocking isolation, and a gateway check before mutation.
- `docs/internal/protocol-kernel-architecture.md`: the gateway is the
  enforcement point; the store is durable reconstruction truth; runtime evidence
  and review artifacts are not authority.
- `STRUCTURE.md`: `src/runtime` may propose, `src/adapters` may hold reference
  gateway fixtures, and `src/conformance` proves posture without creating
  authority.

## Smallest next mechanism

Define the x402 protected action family as:

```text
agent attempts paid request
-> x402 402 offer is captured
-> X402PaymentContract is canonicalized
-> policy greenlights/refuses exact terms
-> WalletGatewayCheck verifies one-use greenlight
-> wallet signs once or refuses
-> receipt/refusal/proof gap is reconstructable
```
