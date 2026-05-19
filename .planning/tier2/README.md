# Tier 2 Canon-Aligned X402 Design Packet

Status: planning scratch, revised 2026-05-19.

This packet replaces the first draft. The earlier draft was too centered on a
local x402 adapter shape. That was misaligned. Tier 2 has to be the first
bought-product proof of Handshake Protected Actions, with x402 used as one crisp
example of consequential authority.

Files under `.planning/` are scratch. They are not active repo canon.

## Invariant at stake

Tier 2 must prove the same authority chain that future hosted and
provider-integrated Handshake must preserve:

```text
generated execution evidence
-> exact action contract
-> policy decision
-> one-use gateway-bound greenlight
-> gateway check before mutation
-> receipt, refusal, proof gap, isolation, or recovery evidence
```

If Tier 2 only proves a local wrapper, it does not create a credible path to
Tier 3 or Tier 4.

## Packet

- `00-canon-alignment.md`: what `/docs/internal` requires and what the revised
  design must not violate.
- `01-source-study.md`: repo canon plus current x402 facts from primary sources.
- `02-users-and-tier-pathway.md`: user types and the Tier 2 -> Tier 3 -> Tier 4
  ladder.
- `03-x402-architecture.md`: x402 transaction architecture mapped to the kernel.
- `04-spec-and-doubt-review.md`: spec, adversarial review, and next mechanism.

## Design decision

Tier 2 should be:

```text
Handshake Protected Actions, self-hosted mode:
one coding-agent workflow
one protected x402 spend
one customer-owned wallet gateway
one versioned policy
one reconstructable receipt/refusal/proof-gap chain
```

Tier 3 should not replace this loop. It should host operations around it:
policy management, distribution, retention, search, rollout, audit, and recovery.

Tier 4 should not mean "more integrations." It should mean a provider or
customer gateway boundary that can actually block mutation and emit compatible
evidence.

## Smallest next mechanism

Define the Tier 2 x402 proof as a migration-ready protected action family:

```text
x402_payment.exact
ActionContract parameters pinned to x402 V2 evidence
GatewayRegistryEntry for a customer-owned wallet gateway
Greenlight with maxUses: 1
GatewayCheckAttempt that creates PAYMENT-SIGNATURE only after exact verification
Receipt that can later be retained, searched, and reconciled by hosted operation
```
