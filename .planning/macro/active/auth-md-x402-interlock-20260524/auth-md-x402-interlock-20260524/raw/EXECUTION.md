# EXECUTION Perspective

## Invariant At Stake

auth.md registration evidence and x402 payment challenge evidence are not
authority. The interlock is valid only if every consequential use of an
auth.md-issued credential or x402 signer remains:

```text
exact action contract
-> policy decision
-> one-use greenlight or refusal
-> gateway check before consequence
-> receipt, refusal, proof gap, or terminal evidence
```

A combined buyer-facing artifact must not turn registration, OAuth scopes,
ID-JAG claims, `PAYMENT-REQUIRED`, signer availability, MCP proposal output,
CLI output, runtime evidence, or a rendered packet into permission.

## Primitive

The control primitive is a gateway-bound protected action with credential
provenance evidence attached:

- auth.md contributes provenance, lifecycle, and gateway custody evidence:
  discovery metadata, `agent_auth`, ID-JAG verification, registration response,
  redacted credential custody, `GatewayCredentialRef`, revocation, isolation,
  and credential-resolution evidence.
- x402 contributes protected-spend evidence: official-shaped
  `PAYMENT-REQUIRED`, selected exact requirement digest, per-call amount bound,
  gateway-held signer use, redacted payment signature evidence, signed retry
  observation, replay refusal, and proof gaps.
- Handshake contributes authority: exact contract, policy, one-use greenlight,
  gateway check, receipt/refusal/proof-gap, isolation, and redacted
  reconstruction.

## Failure Mode

The dangerous failure is a fake composite:

- auth.md registers an agent, then generated code treats the bearer credential
  as permission to call any paid API.
- x402 emits a challenge, then runtime or MCP treats the challenge as approval
  to pay.
- A packet displays "registered agent + paid call" while the gateway only
  checked one side.
- One greenlight signs multiple retries or authorizes both service credential
  use and payment signer use without an exact composite binding.
- Receipt language collapses registration, credential custody, gateway check,
  signer invocation, signed retry, downstream response, settlement, and service
  success into one success label.

If a single downstream HTTP call consumes both an auth credential and a payment
signature, two loose greenlights are not enough. Either the first implementation
stays packet/read-only, or a later execution path must define one exact
composite action contract that binds both gateway-held refs before one gateway
check.

## Boundary

Authority is enforced only at the Handshake gateway check.

Execution boundary rules:

- auth.md local repo remains read-only external evidence.
- Do not import auth-md runtime code into Handshake.
- Do not make auth.md an official wedge ahead of x402.
- Do not create a new composite action type until the packet proves the
  evidence split and the tests prove no raw credential or signer material leaks.
- Do not let runtime, MCP, CLI, demo reports, review artifacts, or evidence
  projections issue policy decisions, greenlights, gateway checks, mutations,
  receipts, or certificates.

## Mechanism

Smallest next mechanism:

```text
auth_md_x402_interlock_packet.v0
```

This is a redacted local proof packet, not a new authority primitive and not a
new public action type. It links:

- one redacted auth.md registered-credential/custody evidence chain;
- one existing `x402_payment.exact` per-call protected-spend chain;
- the exact digest links between provenance, selected x402 requirement,
  protected path posture, gateway registry, policy version, idempotency key,
  gateway check, receipt/refusal/proof gap, and replay refusal;
- blocked proof objects and non-claims.

The packet must carry explicit false authority flags:

```text
authMdRegistrationCreatedAuthority: false
x402ChallengeCreatedAuthority: false
packetCreatedAuthority: false
runtimeHeldCredential: false
runtimeHeldSigner: false
mcpCreatedAuthority: false
cliCreatedAuthority: false
```

If the packet passes, a later source slice may introduce a local
`paid_authenticated_api_call.exact` proof profile. That later profile must bind
both `GatewayCredentialRef` and x402 signer/payment custody into one exact
contract and one gateway check before the downstream paid authenticated call.

## Adoption

Do not boil the ocean.

The first adoption slice is:

```text
one local service credential provenance profile
one local/reference x402 exact paid endpoint
one gateway-held credential ref
one gateway-held signer surface
one redacted packet
one replay refusal
one proof-gap list
```

No live provider custody, hosted operation, WorkOS endorsement, settlement,
marketplace, certification, aggregate spend ledger, cross-org trust, or generic
agent-auth claim is in scope.

## Audit

The packet audit trail must reconstruct, without raw secrets:

- auth.md discovery source and authorization-server metadata digests;
- `agent_auth` fields used and unsupported fields refused;
- ID-JAG issuer, subject, audience, `jti`, expiry, and verified-claim posture
  as redacted provenance;
- registration id, credential type, scope inventory, expiry, lifecycle posture,
  and `GatewayCredentialRef` digest;
- proof that discovery, registration, scopes, and revocation events created no
  policy decision, greenlight, gateway check, mutation attempt, receipt, or
  certificate by themselves;
- x402 challenge evidence, selected requirement digest, amount, payee, network,
  token, request digest, provider posture, and per-call bound;
- x402 policy decision, one-use greenlight, gateway check, signer-after-gate
  evidence, signed retry observation, downstream uncertainty, receipt/refusal,
  proof gap, and replay refusal;
- all omitted raw fields: auth credential, claim token, OTP, raw JWT, bearer
  value, API key, access token, private key, signer ref, `PaymentPayload`,
  `PAYMENT-SIGNATURE`, provider secret, raw request body, and full PII.

## Brutal Verdict

Sequence, then combine at the packet layer.

Keep x402 as the official buyer-side `x402_payment.exact` per-call protected
spend wedge. Keep auth.md as a closed adapter/provenance/custody slice and a
comparative wedge input. Build the interlock as a redacted local packet first.
Do not create a composite execution action until the packet proves the evidence
split and the gateway can bind both custody refs in one exact contract.

## Integration Order

1. Lock claims and fail-first packet expectations.
2. Re-run or preserve the auth.md focused evidence/custody tests so the current
   auth.md adapter remains closed and redacted.
3. Re-run or preserve the x402 focused protected-spend tests and `demo:aps` so
   the official wedge stays exact, per-call, and signer-after-gate.
4. Add the interlock packet as a product/report surface over redacted evidence,
   not a protocol area and not a gateway.
5. Add hostile packet tests for raw credential leakage, payment payload leakage,
   authority flag drift, registration-as-authority, challenge-as-authority,
   replay, parameter drift, metadata drift, and downstream uncertainty.
6. Only after the packet passes, decide whether a local composite execution
   profile is justified.
7. Only after a composite profile passes, rerun comparative wedge scoring:
   protected spend vs auth.md protected API call vs composite protected commerce
   action.

## Implementation Slices

### Slice 0: Claim Freeze And Test Scaffold

Purpose: prevent the refresh from creating product theatre.

Future file targets:

- `test/product/auth-md-x402-interlock-packet.test.ts`
- `test/architecture/claim-boundary.test.ts`
- `test/architecture/surface-boundary-posture.test.ts`

Assertions:

- The packet states local/reference scope and non-claims.
- Packet creation creates no policy decision, greenlight, gateway check,
  mutation attempt, receipt export, or certificate authority.
- The packet cannot contain raw auth credential material or x402 payment/signing
  material.

### Slice 1: Auth.md Evidence Baseline

Purpose: ensure the registration/custody slice remains evidence only.

Source targets:

- `src/adapters/auth-md/profiles.ts`
- `src/adapters/auth-md/action-proposal.ts`
- `src/adapters/auth-md/gateway.ts`
- `src/adapters/auth-md/revocation.ts`
- `src/protocol/areas/credential-custody/`
- `src/protocol/evidence-projections/`
- `test/support/auth-md-flow.ts`

Test targets:

- `test/adapters/auth-md-serialization-redaction.test.ts`
- `test/adapters/auth-md-gateway.test.ts`
- `test/adapters/auth-md-revocation.test.ts`
- `test/adapters/auth-md-bypass-probes.test.ts`
- `test/runtime/auth-md-candidate-compilation.test.ts`
- `test/integration/auth-md-protected-call.test.ts`
- `test/integration/auth-md-receipt-reconstruction.test.ts`
- `test/protocol/credential-custody.test.ts`
- `test/protocol/evidence-projections.test.ts`

Required behavior:

- PRM and authorization-server metadata are digest-bound.
- `auth.md` prose is supporting evidence only.
- ID-JAG audience/resource mismatch refuses or proof-gaps deterministically.
- Discovery, ID-JAG verification, registration, scopes, claim completion, and
  revocation create no authority records by themselves.
- `CredentialResolutionEvidence` appears only after a passed gateway check.
- Anonymous same-token scope widening is blocked, quarantined, reviewed, or
  proof-gapped before any wider protected action.

### Slice 2: x402 Exact Spend Baseline

Purpose: keep the official wedge intact before interlock work.

Source targets:

- `src/adapters/x402-payment/action-proposal.ts`
- `src/adapters/x402-payment/upstream-evidence.ts`
- `src/adapters/x402-payment/wallet-gateway.ts`
- `src/adapters/x402-payment/sandbox-http.ts`
- `src/runtime/ingress/index.ts`
- `src/mcp/x402-proposal.ts`
- `examples/x402-protected-spend/run.ts`

Test targets:

- `test/conformance/x402-upstream-exact-fixtures.test.ts`
- `test/conformance/x402-payment-conformance.test.ts`
- `test/adapters/x402-install-proposal.test.ts`
- `test/adapters/x402-payment-action-proposal.test.ts`
- `test/adapters/x402-wallet-gateway.test.ts`
- `test/adapters/x402-bypass-probes.test.ts`
- `test/runtime/runtime-ingress.test.ts`
- `test/mcp/mcp-x402-proposal.test.ts`
- `test/mcp/mcp-reference-transcript.test.ts`
- `test/mcp/mcp-stdio-process.test.ts`
- `test/integration/x402-d1-http.test.ts`
- `test/product/x402-protected-spend-demo-report.test.ts`

Required behavior:

- `PAYMENT-REQUIRED` is proposal evidence only.
- Runtime and MCP outputs keep authority flags false.
- Amount bounds are per-call only.
- Signer invocation count is zero before `VerifiedGatewayCheck`.
- Replay refusal happens before signer reuse.
- `PaymentPayload`, `PAYMENT-SIGNATURE`, private key, signer ref, bearer token,
  provider secret, and raw auth credential material are absent from read
  surfaces.

### Slice 3: Interlock Packet Builder

Purpose: combine auth.md provenance and x402 spend evidence without creating
authority.

Future source targets:

- `examples/auth-md-x402-interlock/run.ts`
- `examples/auth-md-x402-interlock/README.md`
- `examples/auth-md-x402-interlock/output/latest.md`
- `examples/auth-md-x402-interlock/output/latest.json`
- `src/surfaces/boundary-manifest.ts`

Prefer an example/report builder first. Move reusable code into `src/surfaces/`
only if tests prove the packet needs source-owned helpers shared outside the
example. Do not put packet logic in `src/protocol/areas/*`.

Required packet frames:

- `authMdProvenance`
- `authMdCredentialCustody`
- `x402ChallengeEvidence`
- `x402ProtectedSpend`
- `authorityTimeline`
- `gatewayBoundary`
- `redactedFields`
- `proofGaps`
- `replayRefusal`
- `nonClaims`
- `comparativeWedgeNotes`

### Slice 4: Runtime And Surface Guarding

Purpose: prevent the interlock from becoming a new runtime/MCP authority path.

Source targets:

- `src/runtime/ingress/index.ts`
- `src/mcp/catalog.ts`
- `src/mcp/x402-proposal.ts`
- `src/cli/output.ts`
- `src/surfaces/boundary-manifest.ts`

Required behavior:

- Runtime may propose or refuse; it does not resolve auth credentials, invoke
  x402 signers, or assemble authority.
- MCP remains x402 proposal/evidence only unless a separately reviewed MCP
  packet read resource is added.
- CLI may read or verify local packets; it must not become a gateway runner.
- Any packet verification command is local trust/readback only, not cross-org
  trust and not permission.

### Slice 5: Deferred Composite Execution Profile

Purpose: only if the packet proves the split, test whether a real composite
action is warranted.

Future profile candidate:

```text
paid_authenticated_api_call.exact.v0
```

This profile is deferred. It requires one exact contract binding:

- auth.md `GatewayCredentialRef` digest;
- x402 signer/payment custody posture;
- PRM and authorization-server metadata digests;
- selected x402 requirement digest;
- method, host, path, query/body digest, non-auth header digest;
- amount, asset, network, payee;
- policy version, gateway registry digest, protected-path posture,
  idempotency key, sequence dependencies, and isolation snapshot.

Exit condition:

- One gateway check verifies both custody refs before the downstream paid
  authenticated call. If two separate greenlights are used, they must be
  sequence-bound and neither credential may be usable outside the final gateway.

## Validation Gates

Focused auth.md gate:

```bash
npm run test -- test/adapters/auth-md-serialization-redaction.test.ts test/adapters/auth-md-gateway.test.ts test/adapters/auth-md-revocation.test.ts test/adapters/auth-md-bypass-probes.test.ts test/runtime/auth-md-candidate-compilation.test.ts test/integration/auth-md-protected-call.test.ts test/integration/auth-md-receipt-reconstruction.test.ts test/protocol/credential-custody.test.ts test/protocol/evidence-projections.test.ts
```

Focused x402 gate:

```bash
npm run test -- test/adapters/x402-payment-action-proposal.test.ts test/adapters/x402-wallet-gateway.test.ts test/adapters/x402-bypass-probes.test.ts test/runtime/runtime-ingress.test.ts test/integration/x402-d1-http.test.ts test/product/x402-protected-spend-demo-report.test.ts
```

Conformance and MCP gate:

```bash
npm run test -- test/conformance/x402-upstream-exact-fixtures.test.ts test/conformance/x402-payment-conformance.test.ts test/conformance/protected-mutation-adapter-conformance.test.ts test/mcp/mcp-x402-proposal.test.ts test/mcp/mcp-reference-transcript.test.ts test/mcp/mcp-stdio-process.test.ts
```

Packet gate:

```bash
npm run test -- test/product/auth-md-x402-interlock-packet.test.ts
```

Demo and repo gates:

```bash
npm run demo:aps
npm run quality:claims
npm run quality:architecture
npm run quality:storage
npm run format:check
npm run check:repo
```

## Stop Conditions

Stop and redesign if any of these become true:

- auth.md registration, ID-JAG verification, OAuth scopes, claim completion, or
  revocation creates mutation authority.
- `PAYMENT-REQUIRED`, x402 challenge parsing, signer availability, MCP proposal,
  CLI output, or packet rendering creates payment authority.
- Raw auth credential, claim token, OTP, raw JWT, bearer value, API key, access
  token, private key, signer ref, `PaymentPayload`, `PAYMENT-SIGNATURE`,
  provider secret, raw request body, or full PII appears in runtime, MCP, CLI,
  SDK, packet, receipt, support bundle, log, or demo output.
- One greenlight authorizes multiple paid/authenticated attempts.
- A packet says "paid authenticated action" but only one credential boundary
  was gateway-checked.
- Runtime, MCP, CLI, or examples import signer/credential resolver code or call
  a mutation surface directly.
- The implementation imports code from `/Users/joelchan/Documents/Coding/App-Dev/live/auth-md`.
- Audience/resource mismatch is repaired by model interpretation at execution
  time instead of deterministic canonicalization.
- Receipt language cannot distinguish gateway check, credential resolution,
  signer invocation, signed retry, downstream response, settlement/finality,
  refusal, and proof gap.
- The first adoption path requires live provider custody, WorkOS endorsement,
  hosted operation, settlement, cross-org trust, marketplace/certification, or
  aggregate spend enforcement.

## Blocked Checks

- Live auth.md provider/service verification is blocked because the auth-md repo
  is read-only external evidence for this run.
- Live x402 settlement, facilitator, seller middleware, and provider custody
  checks are blocked because the current wedge is local/reference buyer-side
  `exact` per-call only.
- Aggregate spend enforcement checks are blocked until a reservation ledger
  exists.
- Hosted verifier, remote JWKS trust, revocation distribution, and cross-org
  trust checks are blocked until hosted trust infrastructure exists.
- Composite paid authenticated execution checks are blocked until
  `auth_md_x402_interlock_packet.v0` passes and a new exact profile is approved.
- `verify-protected-spend` or packet verification command checks are blocked
  unless a source-owned command is implemented.

## Smallest Next Mechanism

Build the packet test first:

```text
Given a redacted auth.md registered-credential/custody evidence chain
and a completed local x402_payment.exact protected-spend chain,
when Handshake emits auth_md_x402_interlock_packet.v0,
then the packet links both chains by digest,
states that auth.md and x402 upstream evidence created no authority,
shows signer and credential use only after gateway checks,
records receipt/refusal/proof-gap/replay posture separately,
lists blocked proof objects and non-claims,
and leaks no raw auth credential, JWT, claim token, OTP, signer material,
PaymentPayload, PAYMENT-SIGNATURE, provider secret, raw request body, or full PII.
```
