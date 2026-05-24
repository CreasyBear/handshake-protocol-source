# Synthesis

## Chair Verdict

Sequence, then combine at the packet layer. Cut auth.md as a separate official
proof surface for now. Keep x402 as the first buyer-side `x402_payment.exact`
per-call protected-spend wedge. Keep auth.md as credential provenance, custody,
audience, scope, claim, revocation, and lifecycle evidence until an exact
protected action is policy-evaluated and gateway-checked.

The interlock is worth building only as:

```text
auth_md_x402_interlock_packet.v0
profile: protected_spend_provenance.v0
```

This packet is read/reconstruction evidence, not authority.

## Raw Lens Convergence

- Strategy: x402 is the clearer first wedge; auth.md strengthens the packet as
  credential provenance/custody context but should not become agent-auth market
  language.
- Architecture: keep separate adapter mechanisms; build a composite packet over
  evidence refs; defer a composite action type until one exact downstream call
  and gateway check are proven.
- Execution: build the packet first; preserve auth.md and x402 baselines; add
  hostile tests before any new profile.
- Risk: credential theatre, payment theatre, review theatre, and evidence
  theatre are the dominant failure modes.
- Adoption: first-use should be one protected action packet, not an auth setup,
  wallet checkout, hosted verifier, or trust story.

## Resolved Tensions

### Packet Name

Use `auth_md_x402_interlock_packet.v0` as the artifact name and
`protected_spend_provenance.v0` as its product profile. This preserves the
specific source lanes without turning the profile into an auth/payment category.

### Smallest Next Mechanism

The smallest next mechanism is not a demo, docs page, CLI command, or composite
gateway. It is a fail-first packet test that defines the artifact and proves:

- packet creation creates no policy, greenlight, gateway check, mutation,
  receipt export, terminal certificate, credential resolution, signer
  invocation, payment payload, or payment signature;
- false authority flags remain false;
- auth.md and x402 evidence are digest-linked to the exact contract path;
- credential resolution and signer invocation are post-gate evidence;
- replay is refused before reuse;
- raw credential and payment material is absent;
- blocked checks and non-claims are printed.

### Composite Action

Defer `paid_authenticated_api_call.exact.v0` or equivalent. A composite action
is only defensible after the packet and hostile harness prove that both
gateway-held custody boundaries can be bound into one exact action spine or
into sequence-bound contracts that cannot be reused.

## Non-Claims To Preserve

No artifact may claim agent auth, OAuth hosting, auth.md provider status,
WorkOS endorsement, x402 provider/facilitator/wallet/seller operation,
settlement, payment finality, provider custody, customer custody, aggregate
spend enforcement, marketplace, certification, cross-org trust, hosted
production readiness, package safety, broad MCP/browser/shell containment, or
downstream business success.

## End Condition

The macro refresh is executable when `PLAN.md`, support docs, and
`TASKS.jsonl` point to one path: fail-first packet contract, baseline
preservation, packet builder, surface guarding, hostile harness, then deferred
wedge scoring and composite evaluation.
