# Context

## Target

Create a source-grounded macro plan for customer-owned gateway custody proof, the critical-path item that proves a protected action path is real because the mutation credential lives behind a customer/provider gateway that enforces the exact greenlight before consequence.

The intended mechanism is:

```text
gateway install evidence
-> credential ref binding
-> protected-path posture
-> custody/bypass probe packet
-> gateway check binds exact contract
-> redacted custody projection
```

## Source Packet

Read inputs:

- `.planning/macro/active/customer-owned-gateway-custody-proof/runs/customer-owned-gateway-custody-proof-20260524T071623Z/input.md`
- raw perspective outputs under `.planning/macro/active/customer-owned-gateway-custody-proof/runs/customer-owned-gateway-custody-proof-20260524T071623Z/raw/`
- `/Users/joelchan/.codex/skills/gsd-macro-plan/references/plan-contract.md`

The raw outputs independently converged on the same core decision: add a source-owned custody proof packet, but keep it subordinate to existing credential ref, protected-path posture, bypass probe, policy, gateway check, credential resolution, and projection primitives.

## Current State Summary

Existing source, as summarized by the raw agents, already has:

- opaque gateway credential references.
- post-gate credential resolution evidence.
- current protected-path posture with probe coverage and source authority.
- policy-time and gateway-time posture/credential binding checks.
- one-use greenlight and gateway check semantics.
- x402 local/reference signing after `VerifiedGatewayCheck`.
- auth.md lifecycle, revocation, redaction, and post-gate credential resolution patterns.
- redacted projection infrastructure and claim-boundary tests.

Missing:

- one typed, source-owned, digest-bound custody packet tying install evidence, credential ref, posture, bypass probes, drift status, redaction status, and claim level.
- policy/gateway refusal rules that require that packet for credential-backed protected paths.
- redacted custody projection that a buyer can inspect without raw record reads or secret exposure.
- claim guards preventing fixture custody from becoming provider/customer custody language.

## Relevant Canon

- Handshake is protected actions for automated decision making, not just engineering agents.
- x402 is the first wedge, not the protocol.
- customer-owned gateway custody is the enforcement model.
- Tier 1 protocol meaning remains exact contract, policy decision, one-use greenlight, gateway check, receipt/refusal/proof gap, and isolation.
- `.planning/` is scratch. Durable claims must be source/test/canonical-doc backed before becoming repo-facing truth.

## Implementation Source Boundary To Verify Later

The plan cannot be executed until implementation verifies companion ownership for:

- protocol public schemas and inputs.
- object registry and source-owned object type wiring.
- kernel facade and public exports.
- evidence projection schemas.
- store/memory/D1 persistence and migrations.
- test fixtures and adapter export surfaces.

Provider-specific vault/KMS/wallet/x402 provider details remain blocked until official source verification.
