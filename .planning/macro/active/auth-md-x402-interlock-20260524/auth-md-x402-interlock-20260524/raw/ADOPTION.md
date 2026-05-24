# Adoption Perspective: auth.md / x402 Interlock

## Invariant at stake

auth.md registration and x402 payment challenges are upstream evidence, not
authority. A developer's first successful run must prove that generated
execution produced one exact protected action, policy evaluated that exact
contract, the gateway checked one-use authority before consequence, and the
result can be reconstructed as receipt, refusal, proof gap, replay refusal, or
terminal evidence.

If adoption teaches "agent auth plus payments," the product drifts into the
wrong category. The buyer should understand Handshake as protected action
infrastructure for automated decision making: auth.md can explain where a
credential came from; x402 can explain why spend was requested; neither can
authorize consequence without Handshake.

## Primitive

The first-use object should be a **Protected Action Evidence Packet**.

Do not make the first-use object an auth provider setup, an OAuth registration
flow, a wallet checkout, a payment dashboard, or an agent-auth quickstart. The
developer should run one local/reference protected call and receive one packet
that answers:

- what generated execution tried to do;
- which auth.md provenance and credential-custody evidence was present;
- which x402 `PAYMENT-REQUIRED` challenge and selected exact requirement were
  observed;
- which exact action contract was proposed;
- what policy decided;
- where the gateway checked the one-use greenlight;
- whether credential resolution or payment signing happened only after the gate;
- what downstream outcome, refusal, replay refusal, or proof gap remains.

Adoption verdict: sequence the mechanism, combine the packet. x402 remains the
first runnable protected-spend proof. auth.md should enter the same packet as a
redacted provenance/custody lane before it becomes a separate first-use
quickstart. A future composite protected action is allowed only when one exact
contract can bind both the service credential ref and the payment signer ref, or
when two exact contracts have an explicit dependency and neither greenlight is
reusable.

## Buyer and developer narrative

The buyer is not buying "agent auth" and is not buying "payments
infrastructure." The buyer is buying the ability to let automated workflows
attempt protected actions without handing generated code raw authority.

The developer story:

```text
An automated workflow tries to call a protected paid endpoint.
The endpoint advertises authentication provenance through auth.md metadata.
The endpoint also returns an x402 exact payment challenge.
Handshake turns the generated attempt into an exact contract.
Policy either refuses it or issues one one-use greenlight.
The gateway checks that exact greenlight before using any credential or signer.
The packet shows the chain and names what remains unproven.
```

The first successful emotional outcome should be: "I can see the exact action
that was allowed, where the authority boundary was enforced, and what did not
happen." The first failure should also feel useful: "Handshake refused before
the credential or signer could be used, and the packet tells me why."

## Failure mode

The adoption path breaks if it optimizes for a friendly demo instead of a hard
boundary.

Primary adoption failures:

- The developer thinks auth.md registration means the agent is authorized to
  mutate.
- The developer thinks an x402 challenge means payment is permitted.
- The generated runtime receives a bearer credential, claim token, payment
  payload, payment signature, private key, signer ref, or vault path.
- The CLI or MCP surface emits policy, greenlight, gateway, signer, mutation,
  receipt, or certificate authority.
- The packet says "success" when it only has downstream unknown evidence.
- The first-use guide hides proof gaps because they make the path look less
  clean.
- The interlock is sold as trust, identity, payment management, settlement,
  marketplace, certification, or provider custody.

This is review theatre if the packet renders a friendly summary that is not
bound to exact contract, policy, gateway, credential-resolution, signer, and
terminal records.

This is credential theatre if auth.md credentials leave gateway custody or
OAuth scopes are treated as action permission.

This is payment theatre if x402 challenge metadata, payment payload creation,
or signed retry observation is treated as settlement or spend-window
enforcement.

This is evidence theatre if the packet cannot distinguish registration,
challenge, policy decision, gateway check, credential resolution, signer
invocation, downstream observation, and proof gap.

## Boundary

Authority is enforced at the Handshake gateway check, not at auth.md discovery,
ID-JAG verification, registration, claim completion, x402 challenge parsing,
runtime proposal, MCP proposal, CLI setup, packet rendering, or terminal
certificate verification.

The developer-facing boundary must be stated this bluntly:

- auth.md lane: provenance and credential custody evidence only.
- x402 lane: challenge and exact per-call spend evidence only.
- runtime/MCP lane: proposal evidence only.
- policy lane: decision over the exact contract.
- gateway lane: final pre-consequence enforcement.
- receipt lane: reconstruction, not downstream business success.

The gateway must own or mediate both consequential materials:

- auth.md-issued service credentials become opaque `GatewayCredentialRef`
  records, never runtime-held bearer values.
- x402 signer access remains gateway-held and creates payment payload/signature
  evidence only after `VerifiedGatewayCheck`.

## Mechanism

### First-use object shape

The packet should have these frames:

1. `packet_summary`: run id, local/reference posture, action family, terminal
   state, verification state, and explicit non-claims.
2. `generated_attempt`: principal intent ref, generated code/spec ref, tool-call
   draft ref, runtime graph digest, and whether unsupported branches/retries
   were refused.
3. `auth_md_provenance`: PRM digest, authorization-server metadata digest,
   `agent_auth` digest, ID-JAG issuer/subject/audience/jti digest, registration
   id, credential type, scope inventory, expiry, claim posture, and revocation
   posture.
4. `x402_challenge`: `PAYMENT-REQUIRED` evidence ref, selected requirement
   digest, network, token/asset, payee, max atomic amount per call, request
   material digest, and unsupported x402 surfaces.
5. `contract_view`: action type, protected surface, method/path/body/query/header
   digests, credential ref digest, signer/gateway ref digest, idempotency key,
   policy version, gateway registry digest, and exact bounds.
6. `authority_timeline`: runtime proposal, intent compilation, action contract,
   policy decision, one-use greenlight, gateway check, consumption/replay
   posture, and refusal/proof-gap records.
7. `gateway_custody`: post-gate credential resolution evidence and post-gate
   payment signing evidence as refs/digests only.
8. `downstream_observation`: signed retry or protected API-call observation,
   downstream status if known, and separate finality/proof-gap language.
9. `redaction_report`: omitted fields, forbidden fields, output surfaces checked,
   and secret-material absence.
10. `blocked_checks`: live custody, settlement, hosted trust, aggregate spend,
    external publication, WorkOS/auth.md attestation, and broad runtime
    containment gaps.

The packet should be readable first and exact second. The happy path can show
short labels, but every label must link to exact record ids, digests, and
verification posture.

### What the developer should run

Current source-backed baseline:

```bash
bun install --frozen-lockfile
npm run check:repo
npm run demo:aps
```

Current x402 packet inspection:

```text
examples/x402-protected-spend/output/latest.md
examples/x402-protected-spend/output/latest.json
```

Required interlock demo shape, not current capability until implemented:

```bash
npm run demo:protected-action-packet
node bin/handshake verify-protected-action-packet examples/protected-action-packet/output/latest.json
```

Do not document the planned commands as real until source, tests, and package
surface checks exist. If the first interlock slice is smaller, extend
`npm run demo:aps` with an auth.md provenance sidecar rather than introducing
another command too early.

### What the developer should inspect

The first inspection checklist should be short:

- Did `authorityCreatedBeforePolicy` remain zero?
- Did runtime/MCP/CLI outputs keep authority flags false?
- Is the action contract exact enough to identify one call and one amount?
- Are auth.md credential material and x402 payment/signature material absent
  from runtime, MCP, CLI, SDK, packet, support, and receipt outputs?
- Did gateway check happen before credential resolution or payment signing?
- Was the greenlight consumed once?
- Did replay refuse before credential or signer reuse?
- Are proof gaps named instead of hidden?
- Are non-claims printed in the packet?

### What the developer should refuse

The guide and CLI should tell a developer to stop when any of these appear:

- raw `Authorization` bearer value in generated code, runtime evidence, MCP
  input, CLI output, packet JSON, logs, or support bundle;
- raw auth.md `credential`, `claim_token`, OTP, JWT, logout JWT, private key,
  payment payload, payment signature, signer ref, vault path, or provider secret;
- x402 amount, payee, network, token, selected requirement, body digest, or
  endpoint differs between proposal and gateway check;
- auth.md PRM, AS metadata, audience, issuer, subject, scope, credential ref, or
  revocation posture differs between proposal and gateway check;
- anonymous in-place scope widening is used for a wider protected action without
  rotation, quarantine, review, or proof gap;
- an unwrapped HTTP/MCP/browser/network route can call the protected endpoint
  with the credential or signer;
- a packet calls downstream unknown status "success";
- a CLI/MCP/review surface issues policy, greenlight, gateway, mutation,
  receipt, or certificate authority.

### What the developer should verify

The verification command, once built, should check:

- local packet schema and digest chain;
- exact contract binding to policy input and greenlight;
- one-use greenlight consumption and replay refusal;
- gateway check before credential resolution and signer invocation;
- selected x402 requirement digest and request material binding;
- auth.md metadata, credential ref, lifecycle, and isolation binding;
- redaction across packet, CLI, MCP, SDK, receipt, support, and report surfaces;
- terminal certificate verification with local pinned trust material only;
- explicit proof gaps for hosted trust, live custody, settlement, and aggregate
  spend.

Verification must print a local-trust boundary. It must not imply cross-org
trust, WorkOS/auth.md endorsement, provider custody, live wallet custody,
settlement, or compliance-grade audit.

## Adoption

### Onboarding path

Use a three-step path:

1. **Run one local proof.** Developer runs the current x402 protected-spend demo
   and sees the authority path before learning auth.md details.
2. **Inspect one packet.** Developer opens the packet and identifies the
   generated attempt, exact contract, policy decision, gateway check, post-gate
   signer evidence, replay refusal, proof gaps, and non-claims.
3. **Add provenance lane.** Developer adds auth.md discovery/registration
   evidence to the packet as redacted provenance and `GatewayCredentialRef`
   custody, without changing the authority boundary.

The first public quickstart should not ask the developer to run the external
auth.md reference app, mint real ID-JAGs, run a wallet, publish an MCP server, or
configure hosted operation. Those are later integration tracks. The first local
interlock can use fixtures if the packet labels them as local/reference evidence.

### Docs requirements

Minimum docs before adoption language is promoted:

- `README` quickstart section with current commands only.
- Packet anatomy page with each frame tied to records/digests.
- Failure catalog with boundary names, reason codes, safe next action, and
  non-retry warnings.
- Interlock note: auth.md provenance and x402 challenge are inputs to the
  Handshake chain, not authority.
- Redaction note naming forbidden materials.
- Unsupported surfaces note for anonymous scope widening, live provider custody,
  aggregate spend, settlement, hosted trust, broad x402, and broad runtime
  containment.
- Demo README that says local/reference, not hosted/provider/customer custody.

Avoid prose that starts from agents, identity, payments, wallets, checkout,
trusted providers, or compliance. Start from a protected action attempt.

### CLI requirements

CLI commands should remain evidence/read/verification surfaces:

- setup/init commands may create local manifests, policy files, gateway registry
  entries, and example packets;
- evidence commands may read redacted packet frames;
- probe/conformance commands may report unsupported or bypass posture;
- verify commands may verify local packet binding and local terminal evidence.

CLI commands must not:

- accept or print raw auth.md credentials, claim tokens, JWTs, payment payloads,
  payment signatures, private keys, signer refs, vault paths, or provider secrets;
- create policy decisions, greenlights, gateway checks, mutations, receipt
  exports, or certificate authority;
- use mutation-shaped command names for proposal/evidence operations;
- collapse refusal and proof gap into generic error text.

### Demo requirements

The demo should show failure as deliberately as success:

- happy path: local challenge, proposal, contract, policy, gateway admission,
  post-gate credential/signature evidence, downstream observation, packet, local
  verification, replay refusal;
- refusal path: amount/scope/params mismatch refuses before gateway use;
- bypass path: raw credential/signer/direct MCP/direct HTTP path is refused,
  detected, or proof-gapped with named posture;
- lifecycle path: revocation, expiry, stale metadata, or downstream 401 isolates
  the credential ref and blocks future policy/gateway use;
- proof-gap path: missing downstream finality becomes a packet frame, not
  success copy.

Do not add a review UI as the first adoption surface. If a review surface later
exists, it must render exact contract and policy/gateway evidence, not a summary
of intent.

## Failure copy

Failure copy should name the boundary that refused and the unsafe next action.

Use copy like:

- `Refused before contract: the generated call used an unwrapped credential or signer path. Handshake did not create a greenlight or call the gateway.`
- `Refused by policy: the requested x402 amount exceeds the per-call bound. No payment payload or signature was created.`
- `Refused by gateway: request parameters changed after the greenlight. The one-use authority was not accepted and the signer was not invoked.`
- `Quarantined: auth.md credential lifecycle evidence changed before execution. Future policy and gateway checks for this credential ref are blocked until reviewed.`
- `Proof gap: the local signed retry was observed, but downstream finality is unavailable. Treat this as unresolved, not success.`
- `Replay refused: this greenlight was already consumed. Create a new protected action attempt through policy instead of retrying with the same authority.`

Avoid copy like:

- `Agent verified`
- `Payment approved`
- `Trusted identity`
- `Wallet authorized`
- `Credential accepted`
- `Spend window enforced`
- `Provider custody verified`
- `Transaction settled`
- `Authenticated agent can now call the API`

Those phrases imply authority or finality that the current mechanism does not
prove.

## Audit

After a local interlock run, the packet must leave enough evidence for a third
party in the same checkout to reconstruct:

- the generated execution path and whether it was contractable;
- exact auth.md provenance inputs and redacted credential custody posture;
- exact x402 challenge, selected requirement, and per-call bounds;
- exact contract digest and policy input digest;
- one-use greenlight issuance and consumption;
- gateway check attempt and verified handoff;
- post-gate credential resolution and/or signer invocation refs;
- downstream observation and any proof gap;
- replay refusal;
- redaction report and omitted forbidden material;
- local terminal verification result and local-trust limit.

If any of those cannot be reconstructed, the packet should say so as a proof
gap. It should not smooth missing evidence into a successful demo.

## Anti-patterns

- Agent-auth-first onboarding.
- Payments-company or wallet-checkout framing.
- Treating auth.md `agent_auth`, ID-JAG, trusted issuer, OAuth scope, claim
  completion, or revocation event as permission to mutate.
- Treating x402 `PAYMENT-REQUIRED`, selected requirement, payment payload,
  payment signature, or signed retry as settlement or aggregate spend control.
- Teaching generated code to hold service credentials, claim tokens, OTPs,
  payment payloads, signatures, signer refs, private keys, vault paths, or
  provider secrets.
- Treating CLI, MCP, SDK, docs, review UI, demo output, support bundle, hosted
  readiness, or certificate verification as an authority surface.
- Generic API gateway before one exact protected call survives.
- One greenlight authorizing both a credential-backed service call and repeated
  payment retries.
- Anonymous in-place scope widening without rotation, quarantine, review, or
  proof gap.
- Conformance language that sounds like certification, marketplace approval, or
  WorkOS/auth.md attestation.
- Public docs that cite `.planning/` artifacts as product truth.

## Blocked checks

- Live WorkOS/auth.md provider verification is blocked until owner-approved
  external verification is explicitly requested.
- WorkOS/auth.md endorsement, attestation, ecosystem listing, or co-marketing is
  blocked until a profile, demo, conformance report, redaction evidence, and
  non-claims packet exist.
- Live x402 provider/customer custody is blocked until gateway-held signer or
  customer-gateway custody code exists beyond local/reference fixtures.
- Settlement/finality checks are blocked until downstream finality adapters and
  evidence taxonomy exist.
- Aggregate spend enforcement is blocked until a spend reservation ledger exists.
- Hosted verifier, remote JWKS trust, revocation distribution, and cross-org
  trust checks are blocked until hosted trust infrastructure exists.
- Broad MCP/browser/shell/network/package-manager/runtime containment checks are
  blocked until each host path has a named bypass harness and freshness model.
- Package publication and MCP Registry discoverability checks are blocked on
  owner-held external credentials and registry acceptance.
- A packet verification command is blocked until a source-owned command exists;
  until then, verification is `npm run demo:aps`, focused x402 tests, claim and
  architecture gates, and manual packet inspection.

## Brutal verdict

Keep the interlock, but narrow it. The adoption artifact should be one protected
action packet with two evidence lanes: auth.md provenance/custody and x402 exact
per-call spend. Do not sell or teach it as agent auth, payments, settlement,
trust, or marketplace infrastructure.

Smallest next mechanism: extend the x402 protected-spend packet contract with a
redacted auth.md provenance/custody lane and failure copy, then add one local
verification gate that proves the packet binds auth.md credential refs and x402
signer evidence without exposing raw authority.
