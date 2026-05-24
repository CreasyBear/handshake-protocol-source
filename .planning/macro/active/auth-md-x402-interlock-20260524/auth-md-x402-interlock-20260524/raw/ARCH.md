# ARCH Perspective: auth.md/x402 Interlock

## Invariant At Stake

auth.md discovery, registration, claim, revocation, and x402 `PAYMENT-REQUIRED`
challenge evidence are upstream protocol facts, not authority. They matter to
Handshake only when they bind into one exact action contract, one policy
decision, one-use gateway-checked authority, and a receipt, refusal, proof gap,
or terminal evidence object that can be reconstructed without raw credential or
payment material.

The dangerous collapse is this:

```text
registered agent + payment challenge + generated retry code = permission
```

That is false. Registration proves provenance. The x402 challenge proves a
seller-side payment requirement. Neither permits the agent to use a service
credential, sign a payment payload, retry a paid request, or mutate any
protected surface.

## Primitive

The primitive is a gateway-bound protected action that may require multiple
upstream evidence families:

```text
auth.md provenance/custody evidence
+ x402 challenge/signing evidence
+ generated execution evidence
-> exact protected action contract
-> policy decision
-> one-use greenlight
-> gateway check
-> post-gate credential resolution and/or payment signing
-> downstream observation, refusal, proof gap, or receipt
```

auth.md supplies candidate identity, registration, credential lifecycle, scope,
and revocation evidence. x402 supplies challenge, selected requirement, amount,
asset, payee, network, signer, payment payload/signature, and signed-retry
evidence. Handshake supplies the only authority boundary.

## Architecture Verdict

Keep auth.md and x402 as separate adapter packs at the mechanism layer. Build
the interlock as a composite protected-action packet at the evidence/read
layer, not as a fused adapter or new ambient action family.

Concretely:

- `auth_md_registered_credential.v0` remains an auth.md adapter/custody profile.
- `x402_payment.exact` remains the official buyer-side exact per-call protected
  spend action.
- The interlock packet should bind auth.md provenance and credential custody refs
  into the existing x402 protected-spend contract when the same downstream paid
  API call requires both a service credential and x402 payment signature.
- Do not create a new composite authority primitive until a fail-first source
  test proves there is exactly one downstream protected call, one exact contract,
  one one-use greenlight, and one gateway check that controls both credential
  injection and payment signing.

The first useful mechanism is therefore a packet, not a merged subsystem:

```text
auth_md_x402_interlock_packet.v0
  references auth.md discovery/registration/custody/revocation evidence
  references x402 challenge/signature/retry evidence
  references one exact x402_payment.exact contract
  proves gateway-side custody and signing happened only after VerifiedGatewayCheck
```

If a later implementation needs a source action label, use a product/report name
first, not a protocol type. A protocol type such as
`auth_md_x402_paid_api_call.exact.v0` is premature unless the canonicalizer,
policy, gateway, and tests prove it is still one exact mutation attempt and not a
bundle of registration, spend, API call, and review ceremony.

## Primitive Boundary Map

### auth.md discovery

Source shape:

- Protected Resource Metadata points to authorization servers.
- Authorization Server metadata carries `agent_auth`.
- `AUTH.md` prose gives agent-readable instructions.

Handshake boundary:

- Discovery is evidence only.
- PRM metadata digest and AS metadata digest may bind into custody evidence,
  candidate action, contract digest, gateway check, and receipt projection.
- `AUTH.md` prose digest may be recorded as supporting evidence, but it must not
  become machine authority.

Failure posture:

- Missing `agent_auth`, unsupported credential type, stale metadata,
  inconsistent PRM/AS resource values, or audience ambiguity refuses before
  custody activation or becomes a proof gap.

### auth.md registration and claim

Source shape:

- ID-JAG exchange can return `registration_id`, credential type, raw credential,
  expiry, and scopes.
- Verified-email flow returns claim token first, then a credential after OTP
  completion.
- Anonymous flow returns an API key and claim token immediately, then widens the
  same key in place after claim in the reference implementation.

Handshake boundary:

- Registration and claim produce provenance records, not policy decisions.
- Raw credentials may enter only a gateway custody intake boundary.
- Runtime, generated execution, MCP, CLI, SDK readbacks, review artifacts,
  reports, receipts, and support bundles receive only opaque refs, digests,
  scope summaries, expiry posture, and redacted evidence.
- Anonymous in-place widening is unsafe by default. It must rotate into a new
  credential ref, quarantine the pre-claim ref, or refuse/proof-gap wider
  post-claim actions.

Failure posture:

- If generated code sees the bearer credential, the generated code escaped the
  contract boundary.
- If claim completion widens usable authority without isolation/rotation/review,
  cut public support for that flow.

### auth.md custody

Handshake-owned shape:

- `GatewayCredentialRef`
- `GatewayCustodyProofPacket`
- `CredentialResolutionEvidence`

Handshake boundary:

- The credential ref is a handle and digest-bound posture object.
- Credential resolution is post-gate evidence only.
- The protocol API must never expose a `getSecret` surface.
- Custody proof records evidence; it does not prove provider custody, customer
  deployment, or secret lifecycle operation.

Gateway requirement:

- The gateway must re-check credential-ref digest, resolver/version, expiry,
  scope inventory, revocation posture, isolation state, protected-path posture,
  metadata digest, and policy version immediately before credential resolution.

### auth.md revocation and lifecycle

Source shape:

- ID-JAG flow supports provider-driven logout JWT revocation.
- Anonymous and verified-email flows lack the same provider-driven revocation
  model in the local source packet.
- Downstream `401`, expiry, metadata drift, and ambiguous lifecycle evidence are
  real lifecycle signals.

Handshake boundary:

- Revocation is not a receipt for prior business success.
- Revocation, expiry, downstream `401`, metadata drift, claim hazard, or
  ambiguous lifecycle evidence must update credential-ref isolation,
  quarantine, suspect posture, refusal, or proof gap.
- Policy and gateway checks must both re-read current isolation before issuing
  or consuming authority.

Critical rule:

- If revocation lands after greenlight issuance but before gateway execution,
  the gateway must refuse. A stale unconsumed greenlight cannot beat current
  isolation.

### x402 challenge

Source shape:

- The paid HTTP surface emits `PAYMENT-REQUIRED` evidence.
- The selected payment requirement includes amount, network, asset/token, payee,
  and request/payment requirement digest material.

Handshake boundary:

- The 402 challenge is seller-side requirement evidence, not permission.
- Challenge digest, selected requirement digest, request method, target URL,
  body digest, non-auth header digest, amount, token, network, payee, provider
  posture, and freshness bind into the candidate, contract, policy, gateway
  check, and receipt projection.
- Unsupported schemes, unknown provider posture, amount drift, selected
  requirement drift, request drift, or missing challenge evidence refuse before
  signing.

### x402 signing and payment evidence

Handshake-owned shape:

- Gateway-held signer ref or signer custody evidence.
- Post-gate `PaymentPayload` / `PAYMENT-SIGNATURE` creation evidence.
- Signed retry observation.
- Downstream finality or proof-gap evidence.

Handshake boundary:

- The signer is a gateway credential, not runtime/MCP/CLI material.
- `PaymentPayload` and `PAYMENT-SIGNATURE` must be created only after
  `VerifiedGatewayCheck`.
- The signed retry is downstream fixture observation, not policy, greenlight,
  gateway authority, settlement, or payment finality.
- Replay refusal must happen before a second signer invocation.

Failure posture:

- If one greenlight signs more than one payment attempt, this is ambient
  authority wearing a badge.
- If receipt language collapses gateway check, signature creation, signed retry,
  provider response, settlement, and downstream finality, this is evidence
  theatre.

## Composite Packet Boundary

The composite packet should have one protected action spine:

```text
generated paid API call intent
-> x402 challenge evidence
-> auth.md credential provenance/custody refs
-> exact x402_payment.exact contract
-> policy decision
-> one-use greenlight
-> gateway check
-> post-gate service credential resolution
-> post-gate x402 signing
-> one downstream signed retry/API call observation
-> receipt/refusal/proof-gap/replay refusal
```

The packet may contain multiple evidence families, but it cannot contain
multiple authorities.

Required packet sections:

- authority path;
- generated execution refs;
- auth.md discovery/registration/claim/revocation refs;
- credential custody and isolation posture;
- x402 challenge and selected requirement refs;
- exact contract digest;
- policy decision and one-use greenlight refs;
- gateway check result;
- post-gate credential resolution evidence;
- post-gate payment signature evidence;
- downstream signed retry observation;
- receipt, refusal, proof gap, replay refusal, or terminal certificate refs;
- omitted/redacted fields;
- non-claims and blocked checks.

## Schema Boundaries

### auth.md evidence schemas

Use adapter-owned evidence records, not new kernel authority:

- `AuthMdDiscoveryEvidence`: PRM URL, PRM digest, AS metadata URL, AS metadata
  digest, `agent_auth` digest, supported identity/credential/assertion types,
  supported events, cache posture, source refs.
- `AuthMdRegistrationEvidence`: registration id, flow type, credential type,
  scopes, expiry, claim posture, issuer, subject, audience, `jti` digest,
  provider registry digest, raw-response digest, redaction status.
- `AuthMdClaimEvidence`: claim flow type, claim status, pre/post scope posture,
  claim token digest only, OTP challenge posture only, rotation/quarantine
  result.
- `AuthMdRevocationEvidence`: event type, issuer, subject, audience, logout JWT
  digest, revocation source, downstream `401` evidence ref, expiry ref,
  ambiguity/proof-gap posture.

Never store raw credential, raw JWT assertion, claim token, OTP, bearer value,
API key, access token, provider session token, full PII by default, raw request
body, private key, or revocation callback secret in these records.

### x402 evidence schemas

Use adapter-owned evidence records:

- `X402ChallengeEvidence`: 402 response metadata, payment requirements digest,
  selected requirement digest, amount, asset/token, network, payee, endpoint,
  request digest, provider posture, freshness.
- `X402SignerCustodyEvidence`: gateway signer ref, resolver/version digest,
  signer custody holder, provider environment, bypass probe refs, redaction
  posture.
- `X402PaymentSignatureEvidence`: verified gate id, command digest, payload
  digest, signature digest, signer ref digest, created-at, redaction status.
- `X402SignedRetryEvidence`: retry request digest, observed status, downstream
  response digest, finality posture, proof-gap refs.

Never expose raw `PaymentPayload`, raw `PAYMENT-SIGNATURE`, private key, wallet
secret, provider secret, vault path, bearer token, or raw signer ref through
proposal/read/report surfaces.

### composite packet schema

The packet schema should reference, not inline, sensitive subrecords:

```text
packet_id
packet_version
action_contract_id
contract_digest
policy_decision_id
greenlight_id
gateway_check_id
auth_md_evidence_refs[]
auth_md_credential_ref_digests[]
x402_challenge_ref
x402_signer_ref_digest
x402_signature_evidence_ref
credential_resolution_evidence_refs[]
signed_retry_evidence_ref
receipt_or_refusal_or_proof_gap_refs[]
redaction_manifest_digest
non_claims[]
blocked_checks[]
```

The packet is a read/reconstruction artifact. It must not mint policy,
greenlights, gateway checks, receipts, certificates, signatures, credentials, or
payment attempts.

## State Boundaries

Use explicit state transitions, not summary flags:

- discovery: `observed`, `stale`, `unsupported`, `ambiguous`, `proof_gap`;
- registration: `registered`, `claim_pending`, `claimed`, `expired`,
  `revoked`, `ambiguous`;
- credential ref: `active`, `suspect`, `isolated`, `quarantined`, `revoked`,
  `expired`;
- x402 challenge: `observed`, `selected`, `stale`, `drifted`, `unsupported`;
- signer ref: `active`, `suspect`, `isolated`, `unavailable`, `proof_gap`;
- greenlight: `issued`, `consumed`, `expired`, `replay_refused`,
  `blocked_by_isolation`;
- downstream observation: `attempted`, `succeeded_observed`,
  `failed_observed`, `unknown_finality`, `proof_gap`.

Do not encode "registered_and_paid" as a single state. That hides whether the
gateway checked, which credential was resolved, which signer was used, whether
the retry happened, and what downstream finality is still unknown.

## Gateway Boundary

The cleanest first implementation uses one gateway-owned execution boundary for
the paid API call:

```text
VerifiedGatewayCheck
-> resolve auth.md service credential
-> create x402 payment payload/signature
-> issue one downstream signed paid API request
-> record credential resolution, signature evidence, retry observation, result
```

If auth.md credential custody and x402 signer custody live in different
gateways, the interlock is blocked until there is a gateway coordination record
that preserves one exact contract, one policy decision, one-use consumption, and
failure-closed behavior across both custody holders. Two independent gateways
using two independent greenlights for one downstream call is not acceptable for
the first proof.

Gateway must refuse when any of these drift:

- contract digest;
- params digest;
- selected x402 requirement digest;
- auth.md PRM/AS metadata digest;
- credential ref digest;
- signer ref digest;
- policy version;
- gateway registry digest;
- protected-path posture;
- idempotency key;
- generated execution graph refs;
- isolation snapshot;
- credential expiry/revocation;
- amount/network/asset/payee/request body/header posture.

## Read Surface Boundary

Runtime, MCP, CLI, SDK, hosted verifier/readiness routes, reports, review
surfaces, and packet readbacks are proposal/evidence/read surfaces.

They may show:

- evidence refs;
- digests;
- redacted summaries;
- omitted-field manifests;
- non-authority flags;
- failure boundary labels;
- next safe action;
- proof-gap labels.

They must not show:

- raw auth.md credential material;
- claim tokens;
- OTPs;
- raw ID-JAG or logout JWT values;
- bearer values;
- API keys;
- access tokens;
- private keys;
- signer refs that can invoke signing;
- raw `PaymentPayload`;
- raw `PAYMENT-SIGNATURE`;
- provider/vault secret paths;
- full PII by default;
- raw request bodies unless explicitly classified and redacted.

Review UI is permitted only if it renders the exact contract and packet refs
that policy and gateway used. If the UI displays a summary not structurally
bound to the contract, this is review theatre.

## Digest Material

Minimum digest material for the interlock:

- principal intent ref;
- runtime identity and generated execution graph refs;
- action catalog version;
- gateway registry version;
- operating envelope id/version;
- auth.md PRM URL and canonical digest;
- auth.md AS metadata URL and canonical digest;
- `agent_auth` canonical digest;
- optional `AUTH.md` prose digest as supporting evidence only;
- auth.md registration id and flow type;
- ID-JAG issuer, subject, audience, `jti` digest, expiry, assertion type, and
  provider registry digest;
- credential type, scope inventory digest, expiry, credential ref digest,
  resolver version, custody proof digest, redaction manifest digest;
- revocation/lifecycle evidence digest and current isolation state ref;
- x402 402 challenge digest;
- selected requirement digest;
- amount, asset/token, network, payee, endpoint, method, path, query digest,
  body digest, non-auth header digest;
- request/provider/environment posture;
- x402 signer ref digest and signer custody proof digest;
- idempotency key and duplicate-authority scope;
- policy input digest and policy version;
- greenlight id and one-use consumption key;
- gateway check id and verified gate digest;
- post-gate credential resolution evidence digest;
- post-gate payment signature command/payload/signature digests;
- signed retry observation digest;
- downstream finality or proof-gap digest.

Model interpretation cannot repair digest mismatches at execution time. Mismatch
means refusal, isolation, or proof gap.

## Redaction Rules

Redaction is deny by default.

Allow in projections:

- opaque refs;
- `sha256:` digests;
- coarse flow labels;
- scope names when not tenant-sensitive;
- expiry timestamps;
- issuer/subject/audience only when already non-secret and necessary for audit;
- amount, asset, network, payee, and endpoint summary when redacted by policy;
- proof-gap labels and omitted-field names.

Block everywhere except gateway-internal custody/signing execution:

- auth.md bearer credentials;
- API keys;
- access tokens;
- claim tokens;
- OTPs;
- raw JWT assertions;
- logout JWT body;
- provider session tokens;
- x402 raw payment payload;
- x402 raw signature header;
- private keys;
- wallet secrets;
- vault paths;
- raw request body;
- full PII by default.

Redaction failures are P0 stop conditions. They are not documentation defects.

## Isolation And Proof-Gap Posture

Isolation must be checked twice:

1. before policy emits a greenlight;
2. immediately before gateway consumes a greenlight and resolves/signs.

Trigger isolation or quarantine for:

- auth.md revocation/logout JWT;
- downstream `401` on credential use;
- credential expiry;
- metadata drift;
- unsupported claim upgrade;
- anonymous in-place scope widening without rotation/quarantine;
- raw bearer or payment material detected in generated execution;
- sibling raw HTTP/MCP/browser/network path;
- direct signer access;
- signer custody drift;
- gateway registry drift;
- stale challenge;
- replay attempt;
- contradictory downstream evidence.

Record proof gaps for:

- missing or ambiguous revocation evidence;
- unknown downstream payment finality;
- missing signed retry observation;
- unavailable provider JWKS/trust evidence;
- unproven live custody;
- unproven hosted operation;
- unsupported x402 scheme/provider posture;
- uninstrumented raw sibling path.

Do not smooth proof gaps into success labels.

## Failure Mode

The combined path creates failure modes that neither adapter shows alone:

- The compiler overreaches the principal by treating "use this service" as both
  identity registration and spend permission.
- auth.md scopes and x402 amount bounds are treated as sufficient authority
  without a Handshake policy decision.
- A service credential is resolved before payment signing fails, leaking bearer
  authority into a partial attempt.
- A payment signature is created before auth credential revocation is re-read.
- Anonymous in-place scope widening turns a formerly low-risk paid call into a
  wider post-claim paid call with the same captured key.
- Two adapter packs each pass local tests, but their combined packet cannot
  reconstruct which gateway performed which post-gate operation.
- A signed retry succeeds locally, and the receipt falsely implies provider
  settlement, business success, or revocation-safe ongoing access.

## Boundary

Authority is enforced only at the gateway check before consequence. For the
interlock, consequence includes both:

- resolving/injecting the auth.md-backed service credential;
- creating the x402 payment payload/signature and issuing the paid retry.

Everything before that is proposal, provenance, custody evidence, challenge
evidence, policy input, or review. Everything after that is mutation observation,
receipt, refusal, replay refusal, lifecycle evidence, or proof gap.

## Mechanism

Smallest mechanism worth building after x402 sandbox:

1. Define `auth_md_x402_interlock_packet.v0` as a read/reconstruction artifact
   around one existing `x402_payment.exact` contract.
2. Extend or specify the x402 protected-spend packet to carry auth.md
   provenance refs, credential ref digests, current isolation refs, and
   post-gate credential resolution refs.
3. Add a local fixture where the downstream paid API call requires both an
   auth.md service credential and an x402 signature.
4. Prove the gateway refuses unless one verified gate covers the exact request,
   auth credential ref, signer ref, challenge digest, and idempotency key.
5. Prove post-gate ordering: `VerifiedGatewayCheck` first, credential
   resolution second, payment signing third, one downstream retry fourth.
6. Emit a redacted packet that reconstructs the chain and names blocked
   provider/live/settlement/trust checks.

Do not build:

- a generic API proxy;
- a new auth provider;
- a payment facilitator;
- a settlement ledger;
- a marketplace/certification mark;
- a broad MCP/browser/shell/network containment claim;
- a hosted trust plane for this packet before local foundation proof closes.

## Adoption

The adoption path should not ask a team to install "agent auth plus payments."
That is too broad and invites theatre.

The first adoption story is one protected paid API call:

```text
one runtime
one service credential provenance profile
one buyer-side x402 exact challenge
one gateway-held service credential ref
one gateway-held signer ref
one exact contract
one policy file
one receipt packet
```

The developer-facing packet should answer:

- what service credential provenance was used;
- what payment challenge was selected;
- what exact call the agent attempted;
- who held credential and signer custody;
- where the gateway checked;
- what was signed/resolved after the gate;
- what happened downstream;
- what remains unproven.

## Audit

After success, the durable evidence must reconstruct:

- auth.md PRM and AS metadata digests;
- registration/claim/revocation evidence refs;
- credential custody proof packet;
- credential ref digest and current isolation state;
- x402 challenge and selected requirement digest;
- exact action contract digest;
- policy decision and greenlight refs;
- gateway check result and one-use consumption;
- credential resolution evidence after gate;
- payment signature evidence after gate;
- signed retry observation;
- receipt timeline;
- proof gaps and non-claims;
- replay refusal if the same greenlight is reused.

After refusal, it must reconstruct the failed boundary and safe next action.
After proof gap, it must name the missing evidence and prevent success language.

## Validation Gates

Focused source gates for a future implementation:

```bash
npm run test -- test/adapters/auth-md-gateway.test.ts test/adapters/auth-md-revocation.test.ts test/adapters/auth-md-bypass-probes.test.ts
npm run test -- test/adapters/x402-wallet-gateway.test.ts test/adapters/x402-bypass-probes.test.ts test/integration/x402-d1-http.test.ts
npm run test -- test/runtime/runtime-ingress.test.ts test/runtime/auth-md-candidate-compilation.test.ts
npm run test -- test/protocol/credential-custody.test.ts test/protocol/evidence-projections.test.ts test/protocol/isolation.test.ts
npm run test -- test/integration/auth-md-protected-call.test.ts test/integration/auth-md-receipt-reconstruction.test.ts
npm run test -- test/product/x402-protected-spend-demo-report.test.ts
npm run quality:architecture
npm run quality:claims
npm run quality:storage
npm run check:repo
```

Required assertions:

- auth.md discovery/registration/claim/revocation alone creates zero policy,
  greenlight, gateway, mutation, receipt, or certificate authority.
- x402 challenge alone creates zero policy, greenlight, gateway, mutation,
  signer invocation, receipt, or certificate authority.
- runtime/MCP/CLI/SDK/read surfaces carry refs/digests and non-authority flags
  only.
- the composite packet cannot be emitted as success before a verified gateway
  check and post-gate evidence refs exist.
- the gateway does not resolve the auth.md credential or sign the x402 payment
  before `VerifiedGatewayCheck`.
- replay attempts do not resolve or sign again.
- revocation/isolation between greenlight and gateway blocks the gate.
- serialized outputs exclude raw auth.md and x402 sensitive material.
- proof packets distinguish gateway check, credential resolution, payment
  signing, downstream retry, downstream finality, and proof gaps.

## Anti-Patterns

### Adapter Pack Fusion

What happens: auth.md and x402 are merged into one adapter with one happy-path
state.

Why it fails: registration lifecycle and payment signing have different custody,
revocation, replay, and evidence semantics.

Verdict: cut. Keep separate adapter packs and compose refs into one packet.

### Registration As Payment Permission

What happens: ID-JAG, auth.md registration, or OAuth scopes authorize payment or
paid API use.

Why it fails: provenance is not authority.

Verdict: cut.

### Challenge As Authorization

What happens: a valid 402 challenge is treated as permission to sign.

Why it fails: a payment requirement is not a Handshake greenlight.

Verdict: cut.

### Two Greenlights For One Downstream Call

What happens: one greenlight resolves the service credential and another signs
payment for the same retry.

Why it fails: reconstruction and replay safety split across authorities.

Verdict: redesign. First proof needs one exact gate or a proven atomic gateway
coordination record.

### Credential Then Payment Partial Execution

What happens: gateway resolves/injects the auth credential before payment
signing is known to be allowed.

Why it fails: partial consequence can leak service authority.

Verdict: redesign with one gate and explicit post-gate operation ordering.

### Receipt Success Collapse

What happens: the packet says "paid authenticated call succeeded" without
separating gateway check, credential resolution, signature creation, signed
retry, provider response, and finality.

Why it fails: this is evidence theatre.

Verdict: cut language and split evidence sections.

### Read Surface Leak

What happens: reports, MCP, CLI, SDK, review, or receipt projections include raw
bearer credentials, ID-JAGs, claim tokens, OTPs, payment payloads, or payment
signatures.

Why it fails: generated/read surfaces become custody surfaces.

Verdict: P0 stop.

### Anonymous Upgrade Without Rotation

What happens: anonymous pre-claim API key widens in place and is then used in a
paid protected action.

Why it fails: a captured low-scope key inherits wider authority.

Verdict: require rotation, quarantine, review, or proof gap before public
support.

## Blocked Checks

- No implementation tests were run in this ARCH chair.
- Live auth.md provider custody is blocked; the local auth-md source is a
  reference implementation with in-memory authority state and no automated test
  suite in the source packet.
- Live x402 provider/customer custody is blocked until real customer/provider
  gateway custody, signer lifecycle, resolver failure, and redaction proof exist.
- Settlement and payment finality checks are blocked until downstream finality
  adapters exist.
- Aggregate spend-window checks are blocked until a reservation ledger exists.
- Hosted operation, remote JWKS trust, live revocation distribution, and
  cross-org trust checks are blocked until hosted infrastructure and trust
  material distribution exist.
- Broad runtime, MCP, browser, shell, network, and raw sibling containment checks
  are blocked until concrete host harnesses exist for those paths.
- Marketplace, certification, clearing-house, WorkOS endorsement, provider
  approval, and MCP Registry/publication checks are blocked on external
  criteria and owner-held credentials.

## Brutal Verdict

Keep the interlock, but narrow it.

Do not build "auth.md plus x402" as a broad product surface. Build one composite
packet around one exact paid API call where auth.md contributes redacted
provenance and service credential custody refs, x402 contributes challenge and
post-gate signature evidence, and Handshake contributes the only authority
spine.

Smallest next mechanism: define `auth_md_x402_interlock_packet.v0` as a
redacted reconstruction packet for one existing `x402_payment.exact` action, and
add the fail-first gateway test proving credential resolution and payment
signing both occur only after the same exact `VerifiedGatewayCheck`.
