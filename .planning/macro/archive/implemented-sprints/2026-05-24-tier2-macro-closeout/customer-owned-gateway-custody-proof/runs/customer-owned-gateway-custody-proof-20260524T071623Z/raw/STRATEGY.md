# STRATEGY: Customer-Owned Gateway Custody Proof

## Invariant at stake

A protected path is real only when the mutation credential stays behind the gateway boundary, the exact one-use greenlight is checked immediately before consequence, unsafe drift refuses before mutation, and the surviving evidence can reconstruct that chain without exposing credential material.

If the source cannot show that chain as one digest-bound custody story, any customer-owned gateway claim is theatre.

## Findings

1. The strategic goal is not "better x402." The goal is a reusable custody proof for protected actions for automated decision making. x402 is the first wedge because paid HTTP makes credential custody concrete, but x402 must remain a proof profile, not the protocol definition.

2. The existing kernel already has most control pieces:
   - `GatewayCredentialRef` stores opaque gateway-side credential custody metadata without raw material.
   - `CredentialResolutionEvidence` is recorded only after a passed `GatewayCheckAttempt`.
   - `ProtectedPathPosture` requires current `gateway_checked` state, gateway/host source authority, raw sibling status, and required bypass probe coverage.
   - policy and gateway transitions both re-check protected-path posture and credential ref bindings.
   - evidence projections expose redacted transaction, contract, receipt, install-health, and credential refs.

3. The gap is not enforcement vocabulary. The gap is a source-owned custody proof packet or equivalent projection spine that binds install evidence, credential ref, protected-path posture, bypass probes, exact contract, greenlight, gateway check, and redacted custody evidence into one reconstructable object. Today the ingredients exist but the buyer-readable custody claim is assembled from scattered records.

4. x402 currently proves "sign only after `VerifiedGatewayCheck`" but does not yet prove customer-owned gateway custody. The x402 install path has `walletGatewayProfile.signerRef` and `signerCustodyStatus`, and the gateway creates payment signature evidence after the gate. It does not yet bind x402 signer custody through `GatewayCredentialRef` on the action contract or record x402 signer use as `CredentialResolutionEvidence`.

5. Fixture/local custody must stay visibly below customer-owned custody. `fixture_gateway_held` can support local regression proof. It must not satisfy a public "customer-owned gateway custody established" claim. The proof packet/projection needs an explicit claim level so local fixture keys cannot launder into provider/customer custody.

6. auth.md gives the correct pattern: opaque credential refs, lifecycle drift/revocation mapped into isolation or quarantine, post-gate credential-resolution evidence, and redacted projections split by evidence type. Reuse that pattern. Do not turn Handshake into an auth provider, OAuth server, wallet provider, vault provider, or payment custodian.

7. The 10-star product shape is a custody receipt a buyer can read:
   - the automated decision system proposed an exact action;
   - the agent/runtime never received signer or mutation credential material;
   - the customer/provider gateway held or resolved the credential;
   - stale, drifted, missing, unsafe, raw sibling, or redaction-failed custody refused before consequence;
   - the gateway checked the exact greenlight immediately before signer use;
   - the resulting evidence is redacted but reconstructable by digest refs.

## Recommended macro shape

### 0. Claim boundary lock

Start by freezing the claim:

```text
customer-owned gateway custody proof = source-owned evidence that a protected path's mutation credential is held or resolved by the gateway boundary and used only after an exact gateway check.
```

This slice must not claim:

- Handshake-held wallet custody;
- payment balances, settlement, or payment management;
- live provider custody;
- broad x402 compatibility;
- hosted operation;
- provider-specific vault/KMS correctness.

Closeout should include claim guards before product docs or demos can say "customer-owned custody" from fixture keys.

### 1. Add a narrow custody proof packet, not a new authority path

Recommended primitive: add a `GatewayCustodyProofPacket` or similarly named protocol object as evidence, not authority.

Its job is to bind existing primitives, not replace them:

```text
gateway install evidence digest
-> GatewayCredentialRef id/digest
-> provider registry ref/digest
-> resolver ref/version
-> lease/version or custody generation
-> attestation refs / redacted audit refs
-> protected path posture id/digest
-> bypass probe ids/digests
-> drift status
-> custody proof digest
```

It must not contain:

- signer material;
- `PaymentPayload`;
- `PAYMENT-SIGNATURE`;
- bearer tokens;
- provider secret paths;
- raw vault/KMS addresses;
- payment settlement or balance state.

Strategic reason to add a packet: extending only `GatewayCredentialRef`, `ProtectedPathPosture`, and `CredentialResolutionEvidence` leaves the proof scattered. A buyer-facing custody claim needs one digest-bound packet that can be projected and tested as an artifact.

Boundary: this packet is evidence. It creates no permission, no greenlight, no gateway check, no mutation proof, no downstream success, and no provider custody claim by itself.

### 2. Bind x402 to the generic custody primitives

x402 should become the first use of the custody proof without becoming payment management.

Minimum strategic path:

1. x402 install proposal registers or references a `GatewayCredentialRef` for the signer boundary.
2. x402 runtime/action proposal includes that credential ref binding in the `CandidateAction` and resulting `ActionContract`.
3. x402 policy/gateway checks inherit the existing credential-ref and protected-path refusal behavior.
4. x402 wallet gateway records post-gate signer use as `CredentialResolutionEvidence` before or alongside payment-signature reconciliation.
5. x402 redacted projection surfaces the custody proof packet and credential-resolution refs without exposing signature payloads.

This keeps x402 as:

```text
one buyer-side exact paid HTTP action
-> one gateway-held signer boundary
-> one policy decision
-> one gateway check
-> one redacted signer-use proof or proof gap
```

It must not add:

- Handshake-held wallets;
- account balances;
- spend-window ledgers;
- facilitator operation;
- seller middleware;
- settlement finality;
- provider custody claims from local fixtures.

### 3. Make protected-path posture consume custody packet evidence

The current protected-path posture already requires current gateway probes and raw sibling blocking. The plan should decide whether customer-owned custody proof is:

- required only for adapter packs that declare a gateway credential binding; or
- required for every `requiredProtectedPathState: "gateway_checked"` path.

Strategy recommendation: require it first only for credential-backed paths, including x402 signer custody. Do not silently change Tier 1 meaning for every protected action. After x402 proves the mechanism, promote the requirement to other custody-backed adapter packs.

### 4. Add a redacted custody projection

The product proof should be a projection, not raw record access.

Recommended projection shape:

```text
custodyProofRef
custodyProofDigest
claimLevel: local_fixture | customer_gateway_evidence | provider_gateway_evidence | proof_gap
gatewayCredentialRef
gatewayCredentialRefDigest
protectedPathPostureRef
protectedPathPostureDigest
bypassProbeCoverage
credentialResolutionEvidenceRefs
gatewayCheckRef
greenlightRef
actionContractRef
driftStatus
redactionStatus
omittedFields
proofGapRefs
refusalReasonCodes
```

The projection should answer the buyer question directly: "Did the automated system ever receive the mutation credential?" The safe answer is not prose. It is the absence of exposed material plus evidence that signer use happened only after a verified gate.

### 5. Preserve source-owned negative proof

The plan must make the negative tests the product, not an afterthought. The first execution slice should fail closed on:

- agent-exposed signer;
- missing custody packet;
- stale credential ref;
- provider registry drift;
- resolver version drift;
- resolver failure;
- unsafe custody status;
- protected-path posture stale or not gateway checked;
- required bypass probe missing or failed;
- raw sibling signer/payment path present;
- redaction failure;
- replayed greenlight;
- fixture custody trying to claim customer-owned/provider custody.

## What to cut

- Cut Handshake-held wallets, signing keys, payment credentials, balances, settlement, facilitator state, or spend management.
- Cut provider-specific vault/KMS architecture from this macro plan unless every named provider detail is marked "requires official source verification before implementation."
- Cut any public claim that local `fixture_gateway_held` proves customer-owned or provider custody.
- Cut a "custody dashboard" unless it is a redacted projection over exact records. A UI without digest binding is review theatre.
- Cut generic "secure custody" language. Use exact custody statuses, refs, digests, drift status, and refusal codes.
- Cut a new payment abstraction. The reusable thing is protected-action custody proof, not x402 payment infrastructure.
- Cut broad x402 compatibility. Keep `x402_payment.exact` as the first buyer-side per-call path.
- Cut aggregate spend windows. Session/day/review bounds remain metadata until a ledger exists.

## What must be decided before execution

1. Primitive name and object type: choose whether the evidence object is `GatewayCustodyProofPacket`, `CredentialCustodyProofPacket`, or a narrowly named projection-only packet. Do not let the name imply authority.

2. Requirement scope: decide whether custody proof packet is required for all `gateway_checked` protected paths or only for paths with `GatewayCredentialRef` bindings. Strategy recommendation: credential-backed paths first.

3. Fixture semantics: decide the exact claim level for `fixture_gateway_held`. Strategy recommendation: fixture can pass local regression posture but must project `claimLevel: "local_fixture"` and fail any customer/provider custody claim guard.

4. x402 migration shape: decide whether `X402WalletGatewayProfile.signerRef` remains as adapter-local install metadata or becomes a `GatewayCredentialRef`-backed field. Strategy recommendation: preserve adapter metadata if useful, but the action contract must carry a generic `GatewayCredentialRef` binding before customer-owned custody proof can be claimed.

5. Post-gate signer evidence: decide whether x402 wallet gateway must record `CredentialResolutionEvidence` before the payment signature evidence or after the signature is created. Strategy recommendation: record a redacted credential-use evidence object after a passed gate and before projecting the downstream reconciliation as custody proof.

6. Projection surface: decide whether custody projection is part of the existing agent transaction envelope or a separate `projectGatewayCustodyProof` read. Strategy recommendation: create a separate projection and link it from the transaction envelope to avoid making every transaction projection custody-heavy.

7. External verification boundary: decide which future provider/vault/wallet details require official docs. For this macro, every named provider implementation detail is blocked until official source verification.

## Six-month regret scenario

Six months from now, the failure mode is not "we did not support enough x402 providers." The failure mode is that Handshake shipped a clean demo where the agent did not see a signer, then called that customer-owned custody while the actual source only proved a local fixture signer behind a reference adapter.

That regret creates three wounds:

1. Customers treat Handshake as a payment custodian or wallet manager when it is neither.
2. Future adapter teams copy x402-specific signer fields instead of generic custody refs, making every protected action pack invent its own credential story.
3. Receipts cannot prove whether a mutation credential was gateway-held, provider-held, fixture-held, stale, drifted, or simply redacted away.

The antidote is a narrow proof packet with explicit claim levels and negative tests that make fixture custody unable to masquerade as customer-owned custody.

## Smallest strategically valid first move

The smallest valid first move is not a provider integration. It is a source-owned x402 custody proof skeleton:

```text
GatewayCredentialRef-bound x402 signer
-> custody proof packet digest
-> x402 ActionContract includes credential binding
-> policy refuses missing/stale/unsafe/drifted custody
-> gateway refuses drift before signing
-> x402 gateway records redacted CredentialResolutionEvidence after VerifiedGatewayCheck
-> custody projection shows local_fixture vs customer_gateway_evidence explicitly
```

This first move is strategically valid because it proves the reusable Handshake primitive without broadening x402, holding money, or pretending provider custody is done.

## Assumptions

- The current Tier 1 protocol spine remains stable: exact contract, policy decision, one-use greenlight, gateway check, receipt/refusal/proof gap.
- x402 remains the first wedge and does not define the protocol.
- `.planning/` is scratch; tracked canon and source/tests control implementation truth.
- Customer-owned gateway custody means the customer/provider gateway owns or controls the mutation credential, not Handshake.
- Provider-neutral schema planning can proceed from repo source; named provider/vault/KMS details require later official source verification.
- The current local x402 signing path is useful as a proof harness, but it does not establish live provider/customer custody.

## Dependencies

- Claim-boundary cleanup must remain in force so new docs/tests cannot reintroduce payment-management or provider-custody claims.
- Existing `GatewayCredentialRef`, `CredentialResolutionEvidence`, `ProtectedPathPosture`, bypass probe, policy, and gateway transitions are the implementation base.
- x402 install/action/gateway paths must accept generic credential bindings rather than keeping signer custody as adapter-local metadata only.
- Evidence projections must either add a custody projection or link to one from the agent transaction envelope.
- Claim-boundary tests must be extended before public/demo wording changes.
- Official provider/vault/wallet documentation is a future dependency only if execution chooses a named provider implementation.

## Risks

1. Proof packet theatre: a new packet that only repeats claims without binding exact refs/digests is worse than no packet.

2. Tier 1 drift: making custody proof globally required for all `gateway_checked` paths in one slice can change protocol meaning. Keep the first requirement scoped to credential-backed paths.

3. x402 capture: payment-specific fields can leak into generic protocol objects. Keep payment payload and signature evidence adapter-owned and redacted.

4. Fixture laundering: local fixture custody can accidentally become customer-owned custody language. Add claim-level fields and guards.

5. Redaction failure: unknown provider credential formats can bypass pattern-based redaction. Prefer allowlisted projection fields and fuzz redaction with credential-looking refs.

6. Adoption drag: requiring every integrator to hand-assemble install evidence, credential ref, probes, posture, contract, policy, gate, and projection is too much ceremony. The macro should plan activation helpers later, but not move authority into runtime or MCP.

7. Provider drift blind spot: without lease/version and resolver-version binding, a stale proof packet can keep passing after gateway credential rotation.

8. Gateway bypass optimism: runtime/MCP evidence can observe bypass-shaped calls, but cannot prove all host paths are blocked. The proof should be honest about installed protected paths only.

## Validation gates

Planning should require future execution to close with focused gates before full repo gates:

1. Protocol schema/canonicalization tests for the custody proof packet:
   - digest changes when credential ref, provider registry digest, resolver version, lease/version, posture digest, probe digest, or drift status changes;
   - raw credential-looking fields are rejected or excluded.

2. Policy/gateway negative tests:
   - missing custody packet refuses;
   - stale credential ref refuses;
   - provider registry drift refuses;
   - resolver drift/refusal refuses;
   - unsafe custody status refuses;
   - protected-path posture stale or not gateway checked refuses;
   - raw sibling path present refuses;
   - replay refuses before signer reuse.

3. x402 adapter tests:
   - x402 install compiles a signer `GatewayCredentialRef` binding;
   - x402 action contract carries credential ref binding;
   - signer use occurs only after `VerifiedGatewayCheck`;
   - x402 gateway records redacted `CredentialResolutionEvidence`;
   - fixture custody projects as local fixture, not customer/provider custody.

4. Projection/redaction tests:
   - custody projection omits signer material, `PaymentPayload`, `PAYMENT-SIGNATURE`, bearer tokens, provider secret paths, and mutation credentials;
   - projection distinguishes gateway check, credential resolution, downstream reconciliation, and proof gap.

5. Claim guards:
   - canonical docs and demo outputs cannot claim live provider/customer custody from fixture keys;
   - x402 wording stays per-call exact buyer-side protected action;
   - no Handshake-held wallet/payment-custody/payment-management language appears.

6. Closeout command candidates for the future implementation:
   - `npm run quality:claims`
   - `npm run test -- test/protocol/credential-custody.test.ts test/protocol/evidence-projections.test.ts test/protocol/kernel-policy-gateway.test.ts`
   - `npm run test -- test/adapters/x402-wallet-gateway.test.ts test/adapters/x402-bypass-probes.test.ts test/conformance/x402-payment-conformance.test.ts`
   - `npm run test -- test/architecture/claim-boundary.test.ts test/architecture/import-posture.test.ts test/architecture/root-exports.test.ts`
   - `npm run format:check`
   - `npm run check:repo`

## Cut lines

- No mutation credential may cross into runtime, MCP, CLI, SDK, or model-facing surfaces.
- No greenlight may authorize more than one exact gateway-checked mutation attempt.
- No custody proof packet may create permission.
- No receipt or projection may claim downstream payment success without downstream evidence.
- No fixture key may satisfy customer/provider custody claims.
- No provider/vault/KMS claim may ship without official source verification and provider-specific negative tests.
- No broad x402 compatibility, facilitator operation, settlement finality, seller middleware, or spend-window enforcement in this slice.
- No raw record route or generic projection may expose credential material or secret-bearing refs.

## Antipatterns

- "Custody status: safe" without credential ref digest, resolver version, lease/version, posture digest, probe digest, and drift status.
- Adding a wallet provider abstraction before the generic custody proof works.
- Treating `signerRef` strings as proof of custody.
- Recording signer use before the gateway check.
- Recording signer use after the gateway check but failing to bind it to the exact contract, greenlight, and gate attempt.
- Hiding redaction failure as success.
- Letting x402 provider-environment fields default away live/unknown posture.
- Using dashboard copy to imply protection where the gateway cannot block mutation.
- Using MCP proposal evidence as if it proves host-wide bypass prevention.

## Blocked checks

- Did not browse or verify official provider, vault, KMS, wallet, x402 provider, legal, or payment-regulatory details. The input packet said not to browse by default; any named provider architecture remains blocked on official source verification before implementation.
- Did not read sibling raw outputs, normalized outputs, or the final plan for this run.
- Did not run tests because this is a planning-only first-pass artifact.
- Did not inspect source files outside the immutable input packet and allowed source boundary.
