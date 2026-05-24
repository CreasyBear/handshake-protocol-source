# Risk Perspective: auth.md / x402 Interlock

## Invariant At Stake

auth.md credential provenance and x402 payment challenge evidence are upstream evidence. They are not authority. The interlock violates Handshake if registration success, ID-JAG verification, OAuth scopes, claim completion, `PAYMENT-REQUIRED` metadata, payment payload creation, signed retry observation, review display, or terminal verification can be mistaken for permission, gateway enforcement, settlement, provider custody, or downstream success.

The hard invariant is narrower:

```text
one exact protected action
-> exact policy decision
-> one-use greenlight
-> gateway check before consequence
-> gateway-held credential or signer use after the verified gate
-> receipt, refusal, proof gap, replay refusal, or terminal evidence
```

If either auth.md or x402 evidence skips that chain, the interlock is advisory, not Handshake.

## Primitive

The primitive is not "agent identity plus payment."

The primitive is a dual-custody protected-action packet where two upstream evidence families remain non-authority until they are bound into exact, gateway-checked consequence:

- auth.md supplies discovery, authorization-server metadata, registration, ID-JAG, claim, revocation, scope, audience, and credential lifecycle evidence.
- x402 supplies payment challenge, selected requirement, amount, network, asset, payee, provider posture, request posture, signer-custody, signed retry, replay, and downstream uncertainty evidence.
- Handshake supplies candidate action, canonical action contract, policy, one-use greenlight, gateway check, credential/signer resolution after gate, redacted receipt, refusal, proof gap, and isolation.

The interlock should bind opaque refs and digests, not raw material:

- `GatewayCredentialRef` for auth.md credential custody.
- gateway-held x402 signer ref or signer evidence ref.
- PRM and authorization-server metadata digests.
- selected x402 payment requirement digest.
- exact request parameters and idempotency material.
- current revocation/isolation/protected-path posture.

Nothing in this packet may imply that identity, scope, payment metadata, review, or local terminal verification creates mutation authority.

## Failure Mode

### Credential Theatre

auth.md is dangerous because the reference implementation returns bearer credentials directly and documents agents using those credentials as bearer tokens. In the sample source, anonymous registration returns an API key and claim token, ID-JAG exchange returns an API key or access token, and email verification returns a claim token before credential issuance. That is fine for a reference auth flow. It is fatal if copied into Handshake runtime, MCP, CLI, review, receipt, support, report, or generated execution surfaces.

The specific theatre risk is claiming "agent is registered" as if that means the agent is allowed to spend, call a protected API, or mutate a resource. It does not. Registration only says some upstream credential ceremony occurred.

Kill condition: any raw `credential`, bearer token, API key, access token, claim token, OTP, ID-JAG JWT, logout JWT, provider private key, JWKS resolver secret, or provider secret path appears in runtime evidence, generated graph, MCP output, CLI output, SDK output, review artifact, report, receipt projection, support bundle, or terminal certificate.

### Payment Theatre

x402 is dangerous because the local proof uses official-shaped challenge and signature evidence, but the current claim boundary remains one local/reference buyer-side `exact` per-call path. It is not live provider custody, customer custody, facilitator operation, settlement finality, seller middleware, aggregate spend enforcement, marketplace readiness, or broad x402 compatibility.

The specific theatre risk is treating an x402 `PAYMENT-REQUIRED` challenge, payment payload, payment signature, or signed retry as proof that payment settled or that a provider endorsed the action. A signed retry is downstream fixture observation after gateway-created signature evidence. It is not policy, greenlight, gateway admission, settlement, or service delivery proof.

Kill condition: the plan, packet, docs, examples, or report labels a payment response as settlement, finality, provider custody, payment management, marketplace trust, or broad x402 support before a source-owned mechanism and validation gate exist.

### Review Theatre

Combining auth.md and x402 will tempt a pretty review screen: "Alice's agent is registered and will pay 2500 USDC for premium context." That screen is theatre unless it is structurally bound to the exact `ActionContract`, exact policy decision, exact one-use greenlight, current gateway registry, current credential-ref isolation state, current signer custody posture, and receipt/proof-gap shape.

The review artifact must not approve a summary. It must render exact contract facts and uncertainty:

- which auth.md metadata digest and audience were used;
- which credential ref, never credential value, is bound;
- which x402 requirement digest, amount, asset, network, payee, and request posture are bound;
- which policy version and gateway registry digest are current;
- which revocation, claim, metadata, signer, and bypass postures are unresolved;
- what will be refused or proof-gapped.

Kill condition: any review UI, markdown packet, or command output lets a user approve a summary while the underlying contract can differ, refresh, drift, or be generated later.

### Evidence Theatre

The combined packet can easily collapse evidence classes into one reassuring receipt. That destroys auditability.

The receipt must keep these distinct:

- auth.md discovery evidence;
- authorization-server `agent_auth` metadata evidence;
- ID-JAG verification evidence;
- registration response evidence;
- claim ceremony evidence;
- revocation or lifecycle evidence;
- credential custody proof packet;
- credential resolution evidence after gateway check;
- x402 challenge evidence;
- selected payment requirement digest;
- policy decision;
- one-use greenlight;
- gateway check;
- signer invocation evidence after gate;
- signed retry observation;
- mutation attempt;
- downstream payment/service uncertainty;
- refusal;
- replay refusal;
- proof gap;
- terminal certificate.

Kill condition: receipt language says or implies "success" when it only has gateway admission plus downstream unknown, signed retry observation, registration success, claim completion, local verification, or provider-shaped metadata.

### Raw Bearer And Signature Leakage

The interlock creates a two-secret blast radius: auth bearer material and x402 signer/payment material. A single generated execution path that can see both can become a payment-capable API client outside Handshake.

Hard redaction rule:

- auth credential material enters only the gateway custody intake boundary and becomes an opaque credential ref.
- x402 signer and signature creation remain only in the gateway path after `VerifiedGatewayCheck`.
- `PaymentPayload`, `PAYMENT-SIGNATURE`, private key, raw signer ref, bearer token, API key, access token, claim token, OTP, ID-JAG JWT, and logout JWT never enter generated execution, runtime proposal, MCP, CLI, SDK readback, reports, review, receipts, support, logs, or terminal certificate artifacts except as redacted post-gate evidence refs/digests where explicitly safe.

Kill condition: a developer-facing "activation" shortcut requires generated code, MCP, CLI, or runtime to hold either the auth credential or x402 signer material.

### Revocation And Claim Hazards

auth.md lifecycle is not clean enough to treat as stable authority. The local auth.md source shows multiple hazards that must become Handshake refusal, quarantine, isolation, or proof gap:

- anonymous pre-claim API keys can be usable immediately;
- anonymous claim upgrades the same key in place to wider scopes;
- email verification returns claim tokens and later credentials;
- ID-JAG access tokens expire and require re-registration;
- anonymous and email flows have no agent-facing revoke endpoint in the reference documentation;
- provider-driven revocation arrives as logout JWT and is observed only through service behavior or later API failure;
- downstream `401` on a previously working credential is lifecycle evidence, not a Handshake receipt.

The in-place anonymous scope upgrade is a direct privilege-continuity hazard. Anyone who captured the pre-claim bearer value keeps the post-claim widened authority in the sample behavior. Handshake must default to rotate-on-claim, quarantine pre-claim refs, or refuse wider post-claim actions until explicit policy says otherwise.

Kill condition: post-claim wider scopes can authorize a protected action using the same credential ref without rotate/quarantine/review/proof-gap behavior and policy plus gateway re-checks.

### Audience Drift

The auth.md evidence has a known audience mismatch risk: the docs instruct ID-JAG audience binding to the protected resource, while the sample verifier checks against service base URL. Handshake cannot smooth this over. Audience binding is provenance only, and mismatches must be refusal or proof gap before custody activation and before contract proposal.

For the interlock, this risk compounds: the x402 paid request target, auth.md PRM resource, authorization-server metadata resource, ID-JAG audience, credential ref audience, and action contract target must not silently diverge.

Kill condition: an unrelated, stale, ambiguous, or changed auth audience can still bind to an x402 paid request or protected API call.

### Replay And Retry Hazards

The combined path introduces replay in both halves:

- ID-JAG `jti` replay;
- logout JWT `jti` replay;
- claim token reuse;
- OTP refresh/invalidation;
- credential token replay;
- stale credential ref reuse;
- x402 payment challenge reuse;
- x402 signed retry reuse;
- one greenlight reused for multiple signer invocations;
- generated retry loops with changed parameters;
- retry after downstream uncertainty.

Handshake's rule must be brutal: retries are new proposed attempts unless the exact existing operation is idempotently recovered through source-owned recovery semantics. A one-use greenlight cannot be stretched over multiple signatures, multiple service calls, or a claim-upgraded credential.

Kill condition: one greenlight can trigger more than one auth credential resolution, signer invocation, signed retry, downstream mutation attempt, or scope-widened action.

### Stale Metadata And Gateway Drift

Both auth.md and x402 are metadata-heavy. Stale discovery or challenge metadata can launder authority:

- stale PRM;
- stale authorization-server metadata;
- changed `agent_auth` register/claim/revocation URIs;
- changed supported scopes or credential types;
- changed provider trust/JWKS posture;
- stale x402 challenge;
- changed payment requirement amount, payee, asset, network, or selected index;
- changed request method/path/body/header posture;
- changed gateway registry or policy version;
- changed credential-ref isolation state.

The interlock must not use metadata freshness as an advisory warning. Stale or mismatched metadata must refuse before policy or gateway, or record a proof gap when current state cannot be determined.

Kill condition: stale metadata can still produce `action_contract_proposed`, `greenlight_issued`, or a passed gateway check without explicit current-digest matching.

### Bypass Paths

The combined packet must name what it prevents, detects, and does not know.

Bypass candidates:

- raw bearer passed directly to an HTTP client;
- direct API call outside the auth.md gateway;
- raw `Authorization` header constructed in generated code;
- direct x402 signer or wallet call;
- direct `PaymentPayload` construction;
- direct MCP payment tool or sibling MCP server;
- browser-side fetch with bearer or payment headers;
- shell/network/package/client code that bypasses runtime ingress;
- generated dynamic tool names or late-bound action families;
- generated retry loop after review became stale;
- support/debug bundle leaking enough material to replay outside Handshake.

This must not become host-wide containment theatre. Current source only proves named local/reference paths and named bypass probes. Anything outside installed protected paths is a proof gap or detected bypass posture, not prevention.

Kill condition: the plan claims broad MCP/browser/shell/network/runtime containment from a local auth.md/x402 proof.

### Settlement, Custody, And Market Positioning Drift

The most likely product-risk failure is a market claim jump:

```text
registered agent + protected spend demo -> trusted agent commerce
```

That shortcut is false. It confuses protocol merit with market merit and custody posture with provider operation.

Forbidden market claims until separately proven:

- Handshake is agent auth.
- Handshake is payment infrastructure.
- Handshake is an x402 provider, facilitator, wallet, seller middleware, or settlement layer.
- Handshake has WorkOS/auth.md endorsement or provider status.
- Handshake proves provider/customer custody.
- Handshake creates cross-org trust.
- Handshake certifies agents, tools, services, packages, or marketplaces.
- Handshake enforces aggregate budgets or spend windows.
- Handshake proves downstream service delivery.

The market-safe stance is narrower: auth.md can provide credential provenance and lifecycle evidence; x402 can provide a clean per-call protected-spend proof; Handshake controls whether the exact consequential attempt is allowed to reach gateway-held credential/signer use.

## Boundary

Authority is enforced only at the Handshake gateway check immediately before consequence.

For the interlock, there are two gateway-held mutation materials:

1. the auth.md credential, represented outside the gateway only as `GatewayCredentialRef`;
2. the x402 signer/payment capability, represented outside the gateway only as redacted signer/payment evidence refs and digests.

Everything else is proposal, metadata, provenance, review, or evidence:

- auth.md PRM and authorization-server metadata are discovery evidence;
- ID-JAG verification is identity assertion evidence;
- claim completion is lifecycle evidence;
- OAuth scopes are coarse credential facts;
- x402 challenge is payment requirement evidence;
- MCP/CLI/runtime outputs are proposal/evidence/read surfaces;
- hosted verifier/readiness surfaces are non-mutating read surfaces;
- terminal certificate is post-outcome evidence;
- local demo output is local/reference proof, not external operation.

If the gateway does not own and check the mutation credential or signer before consequence, this is advisory, not Handshake.

## Mechanism

Minimum safe interlock mechanism:

1. Keep auth.md and x402 as separate evidence lanes until the exact composite contract shape is proven.
2. Define one interlock candidate type only after both lanes supply opaque refs and current digests:
   - auth PRM digest;
   - auth AS metadata digest;
   - auth credential ref digest;
   - auth audience binding;
   - auth revocation/isolation snapshot;
   - x402 challenge digest;
   - selected payment requirement digest;
   - amount, asset, network, payee;
   - request method, target, body/query/header digests;
   - signer custody posture;
   - idempotency key;
   - policy version;
   - gateway registry digest.
3. Canonicalize the exact proposed action before policy. The compiler may emit candidates and refusals only.
4. Policy must re-read isolation, revocation, metadata freshness, gateway posture, credential-ref digest, signer posture, amount bounds, and idempotency before greenlight.
5. Gateway must verify exact greenlight binding, current isolation, current protected-path posture, current credential-ref posture, current signer posture, observed parameters, and one-use consumption before resolving credential or signer.
6. Credential resolution and signer invocation must be post-gate evidence only.
7. Receipt projection must distinguish auth custody, payment signature, gateway check, signed retry, downstream finality, refusal, replay refusal, and proof gap.
8. Bypass probes must label posture as prevented, detected, or unknown. Unknown is a proof gap.

The smallest mechanism to build is not a composite market packet. It is an interlock threat-model and validation harness that proves raw material never leaves gateway custody, stale/different metadata refuses, and one greenlight cannot drive both repeated credential resolution and repeated signing.

## Adoption

Do not ask an engineering org to adopt "auth.md plus x402" as a broad platform. That boils the ocean and invites overclaiming.

Adoption-safe sequence:

1. Keep x402 as the official buyer-side `exact` per-call protected-spend wedge.
2. Keep auth.md as closed adapter/provenance/custody evidence until its own protected API call remains stable under revocation, claim, audience, and bypass gates.
3. Run comparative wedge scoring before market positioning:
   - protected spend;
   - auth.md protected API call;
   - composite protected commerce action.
4. Only combine after the source can show a concrete operator can install one protected path, run one generated action, see one exact contract, verify one gateway check, inspect one redacted packet, and understand exactly what remains unproven.

The buyer-facing packet should be called local/reference protected-action evidence, not trust, certification, marketplace, settlement, provider custody, or agent identity.

## Audit

Audit evidence required after an interlock attempt:

- original principal intent reference and generated execution refs;
- runtime/tool graph refs with raw sibling refusal or bypass posture;
- auth.md PRM and authorization-server metadata digests;
- auth.md registration/claim/revocation evidence refs;
- ID-JAG assertion evidence digest and audience binding;
- credential custody proof packet;
- current credential-ref isolation and lifecycle posture;
- x402 challenge and selected requirement digest;
- request, payment, and idempotency canonical digests;
- policy input digest and decision;
- one-use greenlight id and consumption state;
- gateway check attempt and result;
- post-gate credential resolution evidence;
- post-gate signer invocation evidence;
- signed retry observation, if any;
- mutation attempt or explicit non-attempt;
- downstream status or proof gap;
- replay refusal evidence;
- terminal certificate only after terminal outcome;
- redaction/omission manifest proving no raw secret/payment/bearer material leaked.

Audit cannot depend on raw credentials or raw payment signatures. Reconstruction must work from refs, digests, redacted projections, and source-owned records.

## Kill Conditions

- Raw auth credential, claim token, OTP, ID-JAG JWT, logout JWT, API key, bearer token, `PaymentPayload`, `PAYMENT-SIGNATURE`, private key, raw signer ref, provider secret, or vault path appears outside a gateway-held or explicitly redacted post-gate evidence boundary.
- Registration, ID-JAG verification, claim completion, OAuth scope, x402 challenge, signed retry, review decision, or terminal certificate creates or implies policy, greenlight, gateway check, mutation, settlement, or downstream success.
- One greenlight authorizes multiple credential resolutions, signer invocations, signed retries, service calls, or changed-parameter retries.
- Revocation, expiry, downstream `401`, logout JWT, anonymous claim upgrade, stale metadata, audience mismatch, gateway drift, signer drift, or credential-ref isolation does not block future policy and gateway checks.
- Anonymous claim can widen the same credential ref for protected actions without rotate-on-claim, quarantine, explicit review, or proof-gap policy.
- Stale PRM, stale AS metadata, stale x402 challenge, stale selected requirement, or changed request posture can still reach contract proposal, greenlight, or gateway pass.
- Review renders a human-readable summary without binding to exact contract/policy/gateway/receipt records.
- Receipt collapses gateway check, signer invocation, signed retry, provider response, settlement, downstream finality, and proof gap into one success label.
- Runtime, MCP, CLI, SDK, hosted verifier, report, or demo code gains signer, credential resolution, policy, greenlight, gateway, mutation, receipt-export, or certificate-minting authority.
- The plan claims WorkOS endorsement, auth-provider status, x402 provider/facilitator/seller operation, live provider/customer custody, marketplace/certification, cross-org trust, hosted production readiness, settlement, aggregate spend enforcement, or broad runtime containment.

## Validation Gates

### Gate 1: Secret And Payment Material Redaction

Required proof:

- Serialized runtime, MCP, CLI, SDK, review, report, receipt, support, and terminal outputs exclude auth credentials, claim tokens, OTPs, bearer values, ID-JAG/logout JWT raw values, private keys, signer refs, `PaymentPayload`, `PAYMENT-SIGNATURE`, provider secrets, vault paths, and raw request bodies by default.
- Gateway-only evidence may expose redacted refs/digests after a verified gate.

Suggested checks:

```bash
npm run test -- test/adapters/auth-md-serialization-redaction.test.ts test/adapters/x402-wallet-gateway.test.ts test/mcp/mcp-resource-redaction.test.ts test/mcp/mcp-stdio-process.test.ts test/protocol/evidence-projections.test.ts
```

### Gate 2: Non-Authority Evidence Boundary

Required proof:

- auth.md discovery, ID-JAG verification, registration, claim completion, revocation, x402 challenge intake, MCP proposal, CLI evidence read, hosted verifier output, and terminal certificate verification create no policy, greenlight, gateway check, mutation attempt, settlement, or downstream success.

Suggested checks:

```bash
npm run test -- test/runtime/runtime-ingress.test.ts test/mcp/mcp-x402-proposal.test.ts test/protocol/authority-certificate.test.ts test/http/http.test.ts
npm run quality:claims
```

### Gate 3: Metadata Freshness And Audience Binding

Required proof:

- PRM resource, authorization-server metadata resource, ID-JAG audience, credential-ref audience, x402 endpoint/request target, and contract target must either match by explicit canonical rule or refuse/proof-gap.
- Stale auth metadata, stale x402 challenge, changed selected requirement, changed payee/network/asset/amount, changed method/path/body/header, and changed gateway registry digest refuse before policy or gateway.

Suggested checks:

```bash
npm run test -- test/runtime/auth-md-candidate-compilation.test.ts test/adapters/auth-md-gateway.test.ts test/adapters/x402-payment-action-proposal.test.ts test/adapters/x402-wallet-gateway.test.ts
```

### Gate 4: Revocation, Claim, And Isolation

Required proof:

- logout JWT, explicit revocation, expiry, downstream `401`, anonymous claim upgrade, credential-ref drift, and ambiguous lifecycle evidence update isolation/quarantine/proof-gap posture.
- Both policy and gateway re-read that posture before greenlight and before mutation.
- Unconsumed greenlights cannot pass after revocation or isolation lands.

Suggested checks:

```bash
npm run test -- test/adapters/auth-md-revocation.test.ts test/protocol/isolation.test.ts test/integration/auth-md-protected-call.test.ts test/integration/auth-md-receipt-reconstruction.test.ts
```

### Gate 5: One-Use Replay And Retry Control

Required proof:

- one greenlight cannot resolve credentials or invoke signing twice;
- replay refuses before downstream call or signer use;
- generated retry loops with changed parameters refuse or create a new contract through policy;
- downstream uncertainty becomes proof gap/recovery, not silent retry.

Suggested checks:

```bash
npm run test -- test/adapters/x402-wallet-gateway.test.ts test/integration/x402-d1-http.test.ts test/runtime/runtime-ingress.test.ts test/mcp/mcp-reference-transcript.test.ts
```

### Gate 6: Bypass Posture

Required proof:

- raw bearer passthrough, direct HTTP, direct MCP payment, browser-side fetch, raw sibling tool, direct signer use, token replay, stale metadata use, wrapper drift, and failure-open posture are refused, detected, or proof-gapped with exact labels.
- No output claims prevention where only detection or unknown posture exists.

Suggested checks:

```bash
npm run test -- test/adapters/auth-md-bypass-probes.test.ts test/adapters/x402-bypass-probes.test.ts test/runtime/runtime-ingress.test.ts test/architecture/surface-boundary-posture.test.ts
```

### Gate 7: Receipt Separation

Required proof:

- receipt/readback separates gateway check, credential resolution, signer invocation, signed retry, downstream response, downstream finality, refusal, replay refusal, and proof gap;
- terminal certificate verifies terminal evidence only and does not create trust, identity, payment finality, or mutation authority.

Suggested checks:

```bash
npm run test -- test/protocol/evidence-projections.test.ts test/product/x402-protected-spend-demo-report.test.ts test/integration/auth-md-receipt-reconstruction.test.ts test/protocol/authority-certificate.test.ts
```

### Gate 8: Claim And Market Boundary

Required proof:

- docs, packets, demos, reports, CLI output, MCP output, and package metadata do not claim agent auth, OAuth hosting, WorkOS endorsement, x402 infrastructure, settlement, provider custody, customer custody, marketplace/certification, cross-org trust, broad runtime containment, aggregate spend enforcement, or downstream business success.

Suggested checks:

```bash
npm run quality:claims
npm run quality:architecture
npm run pack:check
npm run check:repo
```

## Brutal Verdict

Sequence, do not combine yet.

auth.md should remain adapter/provenance/custody evidence. x402 should remain the official buyer-side `exact` per-call protected-spend wedge. The interlock is worth designing as a hostile validation packet, not as a combined market claim.

The composite "registered agent pays for protected API access" story is attractive and dangerous. It creates credential theatre, payment theatre, review theatre, and evidence theatre unless the system proves two independent gateway-held custody boundaries, one exact contract, one-use replay control, lifecycle isolation, redaction, metadata freshness, and receipt separation together.

Smallest next mechanism: define and test an interlock threat harness that feeds auth.md credential-ref evidence plus x402 challenge evidence into one exact candidate, then proves refusal on raw material leakage, stale metadata, audience drift, revocation/claim hazards, signer drift, changed payment requirements, raw sibling bypass, replay, and receipt overclaim. Only after that harness passes should the macro plan consider an integrated protected-action packet.
