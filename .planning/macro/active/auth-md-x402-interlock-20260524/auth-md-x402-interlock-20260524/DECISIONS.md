# Decisions

## Accepted

### D1: Sequence x402 First

x402 remains the official buyer-side `x402_payment.exact` per-call protected
spend wedge. It has the crispest signer-after-gateway boundary and should stay
the first runnable proof path.

### D2: Keep auth.md As Evidence

auth.md remains credential provenance, custody, claim, revocation, scope,
audience, and lifecycle input. Registration, ID-JAG verification, OAuth scope,
claim completion, and revocation do not create authority.

### D3: Combine At Packet Layer

The first interlock is `auth_md_x402_interlock_packet.v0` with profile
`protected_spend_provenance.v0`. The packet correlates refs, digests,
authority timeline, redactions, proof gaps, non-claims, and blocked checks. It
does not authorize consequence.

### D4: Make Failure First

The first implementation task is a fail-first packet test that proves false
authority flags, redaction, digest binding, gateway ordering, replay refusal,
and non-claims before any demo or docs promotion.

## Rejected

### R1: Standalone auth.md Official Wedge Now

Rejected. It pulls Handshake toward agent auth, OAuth hosting, provider trust,
WorkOS adjacency, and credential lifecycle claims before exact protected action
authority is proven.

### R2: Fused auth.md/x402 Adapter

Rejected. A fused adapter hides separate evidence families and risks ambient
permission. Keep mechanism lanes separate; correlate them in packet evidence.

### R3: Combined Market Claim

Rejected. "Registered agent pays for API access" is attractive but too easy to
overread as trust, identity, payment management, settlement, or provider
custody.

### R4: Review UI First

Rejected. A review UI before exact contract/packet binding is review theatre.
The first surface should be local/reference packet evidence and tests.

## Deferred

### F1: Composite Execution Profile

Defer `paid_authenticated_api_call.exact.v0` or equivalent until the packet and
hostile harness pass. If built, it must bind auth.md credential ref, x402 signer
custody, exact request, amount, payee, network, idempotency, policy, registry,
protected path, and isolation into one exact gateway-checked action.

### F2: Packet Verification Command

Defer `verify-protected-action-packet` or similar CLI until source-owned packet
records exist. Until then, verification is tests, `demo:aps`, claim gates, and
manual packet inspection.

### F3: Comparative Wedge Scoring

Defer market scoring until evidence exists for protected spend, credential
custody, and the interlocked packet. Do not infer first market from proof-surface
cleanliness alone.

## User-Owned Decisions

- Whether to promote any packet result into tracked canon after implementation.
- Whether to open external auth.md or x402 ecosystem conversations after local
  packet, redaction evidence, bypass posture, and non-claims exist.
- Whether to pursue a composite execution profile after packet gates pass.
