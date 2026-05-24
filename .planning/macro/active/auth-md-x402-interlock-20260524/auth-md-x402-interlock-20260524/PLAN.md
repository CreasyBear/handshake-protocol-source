# Invariant at Stake

auth.md registration, ID-JAG verification, credential lifecycle signals, and
x402 `PAYMENT-REQUIRED` challenges are upstream evidence. They are not
authority. Handshake remains protected action infrastructure for automated
decision making: one exact protected action must become one canonical contract,
one policy decision, one-use greenlight or refusal, one gateway check before
consequence, and one reconstructable receipt, refusal, proof gap, replay
refusal, or terminal evidence object.

If auth.md credential provenance plus x402 payment challenge can be read as
permission to mutate, pay, retry, sign, or call an authenticated service, the
plan is advisory, not Handshake.

## Goal

Refresh the auth.md/x402 macro path around a narrow interlock:

- x402 remains the first buyer-side `x402_payment.exact` per-call protected
  spend wedge.
- auth.md remains credential provenance, custody, audience, scope, claim,
  revocation, and lifecycle evidence unless and until an exact protected action
  is gateway-checked.
- The two are combined first only as a redacted evidence packet over one exact
  protected action path, not as agent auth, payment infrastructure, settlement,
  certification, marketplace, or cross-org trust.

## Verdict

Sequence, then combine at the packet layer. Cut auth.md as a separate official
proof surface for now. Defer any composite execution action until a fail-first
packet proves the evidence split, redaction boundary, one-use authority, and
gateway ordering.

The target object is:

```text
auth_md_x402_interlock_packet.v0
profile: protected_spend_provenance.v0
```

Smallest next mechanism: add a fail-first packet test that defines this packet
shape over existing auth.md custody evidence and x402 protected-spend evidence,
and proves the packet creates no authority, leaks no raw material, and preserves
post-gate credential/signature ordering.

## Non-Goals

- Do not build an auth provider, OAuth host, ID-JAG issuer, wallet, x402
  facilitator, seller middleware, settlement layer, marketplace, certification
  program, or trust network.
- Do not import code from `/Users/joelchan/Documents/Coding/App-Dev/live/auth-md`.
- Do not expose raw credentials, claim tokens, OTPs, JWTs, bearer values, API
  keys, access tokens, private keys, signer refs, `PaymentPayload`,
  `PAYMENT-SIGNATURE`, provider secrets, vault paths, raw request bodies, or
  full PII in runtime, MCP, CLI, SDK, report, receipt, packet, support, or demo
  surfaces.
- Do not let runtime, MCP, CLI, review, report, hosted readiness, or terminal
  verification mint policy, greenlights, gateway checks, receipts, certificates,
  signatures, credentials, or mutation attempts.

## Source Boundary

This synthesis used the run input and raw STRATEGY, ARCH, EXECUTION, RISK, and
ADOPTION outputs. Tracked repo canon controls product posture. `.planning/`
artifacts remain planning evidence unless promoted and validated. The external
auth.md checkout is read-only evidence.

## Current State

- auth.md is a closed adapter/provenance/custody slice with focused evidence,
  redaction, revocation, bypass, protected-call, and reconstruction gates named
  in prior work.
- x402 is the official narrow buyer-side exact per-call protected-spend wedge.
  It has the cleaner first proof shape because signer use is crisp and must
  happen after gateway verification.
- The interlock is not currently a source-owned packet, CLI command, hosted
  verifier, composite action type, or market claim.

## Target State

A local/reference interlock packet can reconstruct one protected spend attempt
with an auth.md provenance lane:

```text
generated attempt
-> auth.md provenance/custody refs
-> x402 challenge and selected exact requirement
-> exact x402_payment.exact contract
-> policy decision
-> one-use greenlight or refusal
-> gateway check
-> post-gate credential resolution and signer evidence
-> downstream observation, replay refusal, proof gap, or receipt
```

The packet is read/reconstruction evidence. It cannot authorize, sign, resolve
credentials, call a service, export receipts, or certify trust.

## Required Review Structure

### Invariant at stake

Upstream identity and payment evidence must not become authority.

### Primitive

A protected-action evidence packet that binds auth.md provenance/custody and
x402 challenge/signing evidence to one exact gateway-checked action path.

### Failure mode

Generated code, CLI, MCP, or review output treats registration, claim, OAuth
scope, payment challenge, signer availability, or packet rendering as permission
to use credentials, pay, retry, or mutate.

### Boundary

Authority is enforced only at policy plus gateway check. The gateway must own or
mediate both credential resolution and signer invocation before consequence.

### Mechanism

Opaque refs, canonical digests, one-use greenlight consumption, current
isolation checks, post-gate evidence, redaction manifest, replay refusal, and
explicit proof gaps.

### Adoption

Run x402 first. Inspect one protected-spend packet. Add auth.md as a redacted
provenance lane. Score protected spend, credential custody, and composite paid
service call only after evidence exists.

### Audit

Reconstruct discovery, registration, custody, challenge, contract, policy,
greenlight, gateway check, credential resolution, signer invocation, downstream
observation, refusal, proof gap, replay, and non-claims without raw secrets.

### Brutal verdict

Keep the interlock. Narrow it to packet/read evidence now. Cut auth.md as an
official standalone wedge. Defer composite execution.

## Assumptions

- Existing auth.md tests still represent the closed custody/provenance slice.
- Existing x402 tests still represent the official per-call protected-spend
  wedge.
- First implementation can use local/reference fixtures if the packet labels
  their trust boundary and non-claims.
- A future composite action is allowed only if one exact contract and gateway
  check binds both custody refs, or if multiple contracts are explicitly
  sequence-bound without reusable authority.

## Decisions

- Sequence x402 first because it has the cleanest per-call signer boundary.
- Keep auth.md as credential provenance/custody/lifecycle input, not authority.
- Combine auth.md and x402 only in a redacted packet profile first.
- Cut standalone auth.md market wedge language from this macro path.
- Defer `paid_authenticated_api_call.exact.v0` or any equivalent composite
  execution profile until packet tests pass.
- Run comparative wedge scoring after packet evidence exists, not before.

## Phases

### Phase 0: Claim Freeze

Lock non-claims, forbidden surfaces, authority flags, and packet failure
expectations before implementation. The output is a fail-first product test and
claim-boundary check.

### Phase 1: Preserve Baselines

Re-run or preserve focused auth.md and x402 gates. Do not alter either adapter
to chase the interlock until both baselines still prove redaction, gateway
ordering, replay refusal, bypass posture, and receipt separation.

### Phase 2: Packet Schema And Builder

Implement `auth_md_x402_interlock_packet.v0` as a local/reference
read/reconstruction packet. Prefer example/report code first; promote shared
helpers only if tests require source-owned reuse.

Required frames:

- `packetSummary`
- `generatedAttempt`
- `authMdProvenance`
- `authMdCredentialCustody`
- `x402ChallengeEvidence`
- `x402ProtectedSpend`
- `contractView`
- `authorityTimeline`
- `gatewayBoundary`
- `redactionReport`
- `proofGaps`
- `replayRefusal`
- `nonClaims`
- `blockedChecks`

### Phase 3: Host Surface Guarding

Ensure runtime, MCP, CLI, SDK, report, demo, and verification surfaces remain
proposal/evidence/read surfaces. They may show refs, digests, redacted
summaries, omitted fields, and proof gaps. They must not hold or print raw
credential, signer, payment, or mutation material.

### Phase 4: Hostile Interlock Harness

Add tests for raw material leakage, stale metadata, audience drift, revocation,
claim widening, signer drift, changed payment requirements, replay, direct
HTTP/MCP/browser bypass, and receipt overclaim. Unknown containment is a proof
gap, not prevention.

### Phase 5: Deferred Composite Evaluation

Only after the packet and hostile harness pass, evaluate a local composite
execution profile for one downstream paid authenticated API call. If approved,
it must bind auth.md `GatewayCredentialRef`, x402 signer custody, exact request,
amount, payee, network, idempotency, policy, registry, protected path, and
isolation into one exact contract and gateway check.

## Task Graph

See `TASKS.jsonl`.

## Validation Gates

- Focused auth.md gate: redaction, gateway, revocation, bypass, candidate
  compilation, protected call, receipt reconstruction, credential custody, and
  evidence projections.
- Focused x402 gate: action proposal, wallet gateway, bypass probes, runtime
  ingress, D1/http integration, protected-spend report, conformance, MCP
  proposal, and stdio/reference transcript.
- Packet gate: fail-first `auth-md-x402-interlock-packet` test proves packet
  schema, false authority flags, redaction, digest binding, replay posture,
  non-claims, and proof gaps.
- Architecture and claim gates: `npm run quality:claims`,
  `npm run quality:architecture`, `npm run quality:storage`,
  `npm run format:check`, and `npm run check:repo`.
- Demo gate: `npm run demo:aps` remains the current source-owned demo until an
  interlock demo exists.

## Anti-Patterns

- "Handshake for agent auth."
- "Handshake for x402 payments."
- "Registered agent means authorized action."
- "x402 challenge means payment approved."
- "One greenlight covers registration, credential use, payment, and retry."
- "Packet verified means business action succeeded."
- "Signed retry means settlement finality."
- "Review summary means exact contract approval."
- "Local fixture custody means production custody."
- "Conformance means certification, provider approval, marketplace readiness,
  or cross-org trust."
- "MCP proposal means tool authorization."
- "Terminal certificate creates authority."
- "Public docs cite `.planning/` as product truth."

## Blocked Checks

- Live auth.md provider custody, production auth.md service operation, WorkOS
  endorsement, and live revocation authority.
- Live x402 provider custody, settlement/finality, facilitator operation,
  seller middleware, unsupported schemes, and aggregate spend enforcement.
- Customer gateway/vault custody, rotation, lease, and provider-specific secret
  verification.
- Hosted verifier distribution, remote JWKS trust, cross-org trust,
  compliance-grade audit, marketplace, certification, and package/MCP registry
  publication.
- Broad runtime/browser/shell/network/package-manager containment outside named
  protected paths and probes.
- Interlock packet verification command until source-owned command code exists.
- Composite paid authenticated execution until packet and hostile harness pass.

## Non-Claims

Handshake does not claim agent-auth provider status, OAuth hosting, WorkOS or
auth.md endorsement, x402 provider/facilitator/wallet/seller operation, payment
settlement, provider custody, customer custody, aggregate spend windows,
marketplace trust, certification, cross-org trust, hosted production readiness,
package safety, broad MCP/browser/shell containment, or downstream service
success.

## Cut Lines

Cut or redesign if:

- auth.md or x402 upstream evidence creates authority.
- raw credential, claim, JWT, bearer, signer, payment, provider secret, vault,
  raw body, or full PII material appears outside gateway-internal or explicitly
  redacted post-gate evidence.
- one greenlight resolves credentials, invokes signing, retries, or calls a
  service more than once.
- revocation, expiry, downstream `401`, claim widening, stale metadata,
  audience mismatch, gateway drift, signer drift, or isolation fails to block
  policy and gateway.
- review output is not structurally bound to exact contract, policy, gateway,
  and receipt records.
- receipt language cannot distinguish gateway check, credential resolution,
  signer invocation, signed retry, downstream finality, refusal, replay refusal,
  and proof gap.
- runtime, MCP, CLI, SDK, demo, hosted verifier, or report code gains gateway,
  signer, credential, mutation, receipt-export, or certificate-minting
  authority.

## Rollback / Stop Conditions

Stop the macro path at the first failed P0 redaction, gateway-ordering, replay,
or non-authority gate. Preserve the failure as refusal, quarantine, proof gap,
or blocked check. Do not patch docs to make the demo sound cleaner.

End this plan only when the packet exists, packet tests pass, focused auth.md
and x402 gates pass, claim/architecture gates pass, and the final packet states
its non-claims and blocked checks without overreach.

## Smallest Next Action

Create the fail-first packet test for `auth_md_x402_interlock_packet.v0`
(`protected_spend_provenance.v0`) using fixture evidence refs from auth.md and
x402. The first passing implementation must prove the packet is read-only,
authority flags remain false, gateway ordering is explicit, replay is refused,
raw material is absent, proof gaps are preserved, and blocked checks are named.
