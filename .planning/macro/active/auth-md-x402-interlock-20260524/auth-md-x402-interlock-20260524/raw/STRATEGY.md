# Strategy Perspective

## Invariant at stake

auth.md registration and x402 payment challenge evidence are not authority.
They only matter to Handshake when they are reduced into exact protected-action
contracts, evaluated by policy, checked by a gateway before consequence, and
reconstructable as receipt, refusal, proof gap, replay refusal, isolation, or
terminal evidence.

The strategic risk is letting a clean identity story plus a clean payment story
launder vague trust into action authority. If auth.md says "this agent has a
credential" and x402 says "this endpoint requested payment", neither statement
authorizes generated execution to use a bearer credential, create a payment
payload, invoke a signer, retry, widen scope, or mutate a paid resource.

## Source boundary

This perspective used the run input and the named source packet only. Tracked
repo canon controls product posture. `.planning/` artifacts are planning
evidence, not repo truth. The external local auth.md checkout was treated as
read-only source evidence for registration, claim, credential, audience,
revocation, and implementation hazards. No web claims were used.

## Primitive

The primitive is protected-action packet composition: correlate upstream
credential provenance and upstream payment challenge evidence inside a
buyer-readable packet without creating a new authority source.

That means:

- auth.md evidence can establish credential provenance, custody posture,
  lifecycle signals, audience/resource binding, and revocation risk.
- x402 evidence can establish payment requirement provenance, selected exact
  requirement, signer-custody posture, and signed retry observation.
- Handshake authority still begins only at exact `ActionContract`, policy
  decision, one-use greenlight, and gateway check.
- A combined packet may summarize multiple evidence streams, but it must not
  turn them into one ambient permission.

Call the strategic object a protected-spend provenance packet, not agent auth,
payments infrastructure, marketplace, certification, settlement, or trust mark.

## Strategy verdict

Keep x402 as the official buyer-side `x402_payment.exact` per-call protected
spend wedge.

Do not promote auth.md into a separate official proof surface beside x402 yet.
It is a strong adapter/provenance/custody stressor, but as a market object it
pulls Handshake toward agent auth, OAuth hosting, provider trust lists, WorkOS
adjacency, and credential lifecycle claims the source does not own.

Do keep auth.md as a comparative wedge input and as an interlocked packet annex
after the x402 activation packet is coherent. The buyer-facing packet should
answer:

```text
What credential provenance/custody evidence existed?
What paid action did generated execution propose?
What exact spend contract did policy evaluate?
Where did the gateway check before credential/signature use?
What was recorded as receipt, refusal, replay refusal, proof gap, or isolation?
What remains unproven?
```

This is an interlock at the evidence and product-evaluation layer first. It is
not a fused authority path. A future composite protected action can exist only
for one exact downstream attempt where credential use and payment signing are
preconditions to the same protected call. If they are independent consequences,
they require independent contracts, greenlights, gateway checks, and receipts.

## Failure modes

- auth.md registration success gets treated as permission to call the service.
  This is advisory, not Handshake.
- ID-JAG, trusted issuer membership, OAuth scope, or claim completion widens
  principal authority without a fresh exact action contract. The compiler
  overreached the principal.
- x402 `PAYMENT-REQUIRED` metadata gets treated as permission to pay. This is
  payment theatre.
- A generated program receives both bearer credential material and signer or
  payment material. The generated code escaped the contract boundary.
- One greenlight covers registration, credential use, payment signing, and
  downstream paid retry. This is ambient authority wearing a badge.
- Anonymous auth.md claim upgrades the same API key in place and silently
  expands a previously approved spend or service-call posture.
- Revocation, downstream 401, stale metadata, credential-ref isolation, or
  signer posture drift lands after policy but before gateway execution, and the
  gateway does not re-read it.
- The packet says "authenticated and paid" without separating registration,
  custody, policy, gateway check, credential resolution, signer invocation,
  downstream observation, and proof gap. This is evidence theatre.
- The review surface displays a friendly combined plan that is not bound to the
  exact contract and gateway evidence. This is review theatre.
- Auth.md outreach or x402 packaging becomes provider endorsement,
  certification, marketplace, settlement, cross-org trust, or compliance
  language before source-owned enforcement exists.

## Boundary

Authority is enforced only at the Handshake policy and gateway boundary.

auth.md boundaries:

- PRM, authorization-server metadata, `agent_auth`, ID-JAG verification,
  registration, claim, scope, and revocation are provenance and lifecycle
  evidence.
- Raw credentials may enter only a gateway custody intake boundary.
- Generated execution, runtime ingress, SDK, CLI, MCP, review surfaces,
  receipts, reports, and support output may receive only refs, digests, redacted
  evidence, posture, refusal, or proof gap.
- `CredentialResolutionEvidence` is post-gateway-check evidence only.

x402 boundaries:

- `PAYMENT-REQUIRED` is upstream challenge evidence, not permission.
- Payment payload/signature creation occurs only in the gateway signer path
  after `VerifiedGatewayCheck`.
- Runtime, MCP, CLI, demo output, and packet reads are proposal/evidence
  surfaces, not signer, policy, greenlight, gateway, receipt-export, settlement,
  or authority-certificate authority.
- Per-call exact spend is the current scope. Aggregate spend budgets,
  settlement finality, seller middleware, facilitator operation, and broad x402
  compatibility remain outside the current claim.

Packet boundary:

- The packet may correlate evidence across auth.md and x402.
- The packet may not authorize a mutation.
- The packet may not hide that auth.md and x402 are upstream evidence families
  while Handshake is the authority boundary.

## Mechanism

Build the interlock as a redacted packet profile, not a new market claim.

Minimum packet fields:

- `packetProfile`: `protected_spend_provenance.v0`.
- `category`: protected action infrastructure for automated decision making.
- `protectedActionRef`: the exact `x402_payment.exact` contract or future
  explicitly named composite action contract.
- `authMdEvidence`: PRM digest, authorization-server metadata digest,
  `agent_auth` digest, registration flow, ID-JAG/claim evidence refs,
  audience/resource posture, scope inventory, revocation posture, and omitted
  raw fields.
- `credentialCustody`: opaque `GatewayCredentialRef`, custody holder,
  resolver/version, credential-ref digest, expiry/isolation posture, and
  redacted custody proof packet ref.
- `x402Evidence`: challenge evidence ref, selected requirement digest, amount,
  network, asset, payee, intended request digest/posture, provider posture, and
  unsupported-surface posture.
- `authorityPath`: candidate, contract, policy decision, greenlight,
  gateway-check attempt, verified gate, idempotency/replay status, isolation
  snapshot, and protected-path posture.
- `postGateUse`: credential resolution evidence and payment signature evidence,
  each recorded only after the verified gateway check.
- `outcome`: receipt, refusal, replay refusal, proof gap, quarantine,
  downstream uncertainty, or terminal certificate evidence.
- `nonClaims`: no auth provider, OAuth server, payment processor, settlement,
  facilitator, marketplace, certification, production custody, hosted operation,
  WorkOS endorsement, cross-org trust, or aggregate budget enforcement.

Mechanism rules:

1. Composition is evidence-level until one exact composite action type exists.
2. A packet cannot collapse multiple protected mutations under one greenlight.
3. Policy and gateway both re-read credential-ref isolation, signer posture,
   metadata freshness, gateway registry digest, policy version, idempotency, and
   protected-path posture.
4. Gateway resolves credentials and invokes signers only after a verified gate.
5. Receipts and projections separate discovery, registration, claim, custody,
   payment challenge, policy, greenlight, gateway check, credential resolution,
   signature creation, downstream observation, refusal, revocation, proof gap,
   and terminal evidence.
6. Any raw credential, claim token, OTP, JWT, API key, bearer value, private
   key, payment payload, payment signature, signer ref, vault path, provider
   secret, full PII by default, or raw request body in generated/runtime/CLI/MCP
   surfaces is a stop condition.

## Adoption

The buyer-facing adoption path should not ask an engineering org to buy "agent
auth" or "x402 payments". It should ask them to run one protected-action packet
and inspect whether generated execution was kept away from mutation credentials
and signer authority.

Recommended sequence for adoption narrative:

1. Install/run the existing local x402 protected-spend activation path.
2. Inspect one exact paid-call packet: challenge, proposal, contract, policy,
   gateway admission, post-gate signing, signed retry observation, replay
   refusal, proof gaps, and non-claims.
3. Add the auth.md annex only as credential-provenance/custody context for the
   same protected-action story.
4. Compare protected spend, credential custody, and composite paid service call
   as market wedges after evidence exists.

Market posture:

- Protocol merit: high for both. x402 has the crisp signer boundary; auth.md
  has the crisp credential-custody and lifecycle hazard.
- Market merit: x402 is easier to explain as protected spend. auth.md alone is
  easier to misread as identity infrastructure and may have weaker budget
  urgency unless tied to a consequential protected action.
- Distribution merit: x402 has a concrete developer activation surface; auth.md
  has useful ecosystem adjacency but outreach before proof risks endorsement
  theatre.
- Adoption merit: x402-first is smaller. auth.md-first requires explaining
  registration, provider trust, claim ceremony, custody, revocation, and
  protected service action before value is visible.
- Expansion merit: the interlocked packet is stronger than either story alone
  because it generalizes to "automated systems use credentials and payment
  signers, but consequence still requires exact gateway authority."

## Audit

After an interlocked run, the packet must let a reviewer reconstruct:

- the upstream auth.md metadata and registration facts used as provenance;
- the credential material that was intentionally omitted and where the opaque
  credential ref entered gateway custody;
- the lifecycle posture: expiry, revocation, downstream 401, metadata drift,
  claim state, isolation, quarantine, or proof gap;
- the x402 challenge and selected exact requirement used as payment evidence;
- the exact contract digest, policy decision, greenlight, gateway-check attempt,
  verified gate, consumption/replay state, and idempotency posture;
- the post-gate credential resolution and post-gate payment signature evidence;
- the downstream response or downstream uncertainty;
- every refusal/proof-gap/non-claim needed to prevent overread.

Validation gates to preserve or plan:

```bash
npm run demo:aps
npm run test -- test/product/x402-protected-spend-demo-report.test.ts
npm run test -- test/adapters/x402-payment-action-proposal.test.ts test/adapters/x402-wallet-gateway.test.ts test/runtime/runtime-ingress.test.ts
npm run test -- test/conformance/x402-payment-conformance.test.ts test/conformance/x402-upstream-exact-fixtures.test.ts test/adapters/x402-bypass-probes.test.ts
npm run test -- test/adapters/auth-md-gateway.test.ts test/adapters/auth-md-revocation.test.ts test/adapters/auth-md-bypass-probes.test.ts test/adapters/auth-md-serialization-redaction.test.ts
npm run test -- test/integration/auth-md-protected-call.test.ts test/integration/auth-md-receipt-reconstruction.test.ts
npm run quality:claims
npm run quality:architecture
npm run check:repo
```

For a future packet implementation, add explicit tests that prove:

- auth.md evidence alone creates no policy decision, greenlight, gateway check,
  mutation attempt, receipt, signer evidence, or certificate authority;
- x402 challenge evidence alone creates no payment signature or downstream paid
  retry;
- the combined packet creates no additional authority beyond the exact
  contract/gateway path;
- revocation, credential-ref isolation, signer drift, metadata drift, parameter
  drift, replay, and unsupported surface fail before credential/signature use;
- serialized packet output excludes raw auth.md and x402 sensitive material.

## Sequencing

1. Finish the x402 protected-spend activation packet first. It is the official
   narrow wedge and already has the clean signer-after-gateway proof shape.
2. Keep auth.md closed as an adapter/provenance/custody slice. Do not reopen it
   as a separate official market wedge unless a new exact protected action and
   buyer problem require it.
3. Define the protected-spend provenance packet schema as a redacted correlation
   object over existing evidence refs.
4. Add interlock tests that prove the packet is not an authority source.
5. Only then evaluate a future composite action, such as one exact downstream
   paid API call that requires both auth.md credential resolution and x402
   signer invocation after the same verified gateway boundary. Independent
   service mutation and payment mutation paths still require independent
   contracts and greenlights.
6. Run comparative wedge scoring before any first-market claim:
   protected spend vs credential custody vs composite paid service call.
7. Outreach to auth.md or x402 ecosystem actors only after a concrete packet,
   demo, conformance notes, redaction evidence, bypass posture, and non-claims
   exist. Ask for feedback, not attestation.

## Anti-patterns

- "Handshake for agent auth."
- "Handshake for x402 payments."
- "Auth.md proves the agent is allowed to spend."
- "x402 proves the service call was authorized."
- "One approval covers registration, credential use, payment, and retry."
- "The packet is verified, therefore the business action succeeded."
- "The review screen summarizes the plan, therefore the contract is approved."
- "Conformance means certified, provider-approved, marketplace-ready, or
  cross-org trusted."
- "Local/reference signer or credential custody means production custody."
- "WorkOS/auth.md support means WorkOS endorsement."
- "Payment signature evidence means settlement finality."
- "Spend-window metadata means aggregate budget enforcement."
- "MCP proposal means tool authorization."
- "Gateway custody proof means secret-management product."
- "Import the auth.md sample runtime to get the flow working quickly."

## Blocked checks

- Live WorkOS/auth.md provider custody, production auth.md service operation,
  WorkOS endorsement, and live revocation authority are blocked.
- Live x402 provider custody, settlement/finality, facilitator operation,
  seller middleware, unsupported x402 schemes, and aggregate spend enforcement
  are blocked.
- Customer gateway/vault custody, rotation, lease, and provider-specific
  credential verification are blocked until customer gateway code and external
  evidence exist.
- Cross-org trust, hosted verifier distribution, remote JWKS trust, compliance
  audit, marketplace, certification, and conformance marks are blocked.
- Broad runtime/browser/shell/network/package-manager containment remains
  blocked outside the specific host harnesses already proven.
- A packet verification command for the interlock is blocked until a
  source-owned command or demo exists.
- This strategy pass did not run implementation tests; it produced only the raw
  strategy output for macro synthesis.

## Brutal verdict

Keep the interlock. Cut auth.md as a separate official proof surface for now.
Use auth.md as the credential-provenance and custody annex that makes the x402
buyer-facing packet more honest, not as a new product category.

Narrow the public posture to: Handshake can show, for one protected automated
action, what upstream credential/payment evidence existed, what exact contract
was evaluated, where the gateway enforced before credential/signature use, and
what receipt/refusal/proof gap survived reconstruction.

The smallest next mechanism to build is a redacted
`protected_spend_provenance.v0` packet schema over existing auth.md and x402
evidence refs, with tests proving the packet cannot create policy, greenlight,
gateway check, credential resolution, signer invocation, mutation, receipt
export, or terminal authority by itself.
