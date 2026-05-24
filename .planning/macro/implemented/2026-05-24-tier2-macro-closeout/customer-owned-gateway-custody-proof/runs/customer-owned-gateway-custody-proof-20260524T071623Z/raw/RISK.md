# RISK First Pass: Customer-Owned Gateway Custody Proof

## Invariant At Stake

A path is protected only when the customer/provider gateway owns the mutation credential, the exact one-use greenlight is checked immediately before consequence, unsafe or drifted custody refuses before mutation, and surviving evidence is redacted but reconstructable. Anything weaker is advisory, not Handshake.

## Current Risk Read

The current source already has useful enforcement primitives: `GatewayCredentialRef`, `CredentialResolutionEvidence`, `ProtectedPathPosture`, required bypass probe coverage, policy-time and gateway-time posture checks, one-use greenlight replay refusal, gateway policy drift refusal, credential-ref isolation, and redacted evidence projections.

The risk is not "can the repo name custody." The risk is that a custody proof packet becomes claim material without becoming a policy and gateway constraint. If the packet is just projection text, install metadata, or adapter evidence not bound into the exact contract, greenlight, gateway check, and receipt chain, it will overstate customer-owned custody.

## Recommended Risk Shape

Extend existing primitives first, and add a distinct custody proof packet only if the existing `GatewayCredentialRef` plus `CredentialResolutionEvidence` shape cannot carry install evidence, provider-neutral resolver/lease/drift fields, and redacted projection requirements without overloading their meaning.

Minimum safe chain:

```text
gateway install evidence
-> gateway credential ref binding
-> protected-path posture with required gateway-owned bypass probes
-> custody proof packet digest
-> action contract and policy input include the packet/ref digest
-> gateway check re-reads packet/ref/posture before mutation
-> credential resolution evidence records post-gate use only
-> redacted custody projection exposes refs/digests/status, never secret material
```

Cut line: do not claim live customer/provider custody until source-owned packet schema, policy/gateway refusals, negative tests, redacted projection tests, and claim guards all exist.

## P0 Risk Register

| Risk | Failure Mode | Mitigation Or Cut Line |
| --- | --- | --- |
| P0: Custody proof becomes receipt/projection theatre | The packet is emitted after the fact or rendered in projections, but policy and gateway do not require it before signer/credential use. | The custody packet/ref digest must be included in contract canonicalization, policy input digest, greenlight binding, gateway check evaluation, and receipt/projection evidence refs. If any of those bindings are not implemented, cut custody claims to "advisory evidence only." |
| P0: Gateway check does not verify current custody immediately before mutation | A greenlight issued against fresh custody is used after credential ref, provider registry, resolver version, lease, or protected-path posture drifts. | Gateway check must re-read current `GatewayCredentialRef`, protected-path posture, isolation state, gateway registry policy version, and custody packet drift status. Missing, stale, unsafe, drifted, or isolated custody refuses with no `MutationAttempt`. |
| P0: Agent-exposed signer path remains reachable | x402 or auth-style adapters have a direct SDK signer, private key env, raw signature header, bearer passthrough, MCP/browser/network sibling, or retry loop available outside the gateway. | Required bypass probe kinds must pass from `gateway_probe` or stronger source authority before `gateway_checked` posture. Raw sibling status `present` or `unknown` must refuse. Synthetic/conformance-only probes must not establish live custody. |
| P0: Redacted custody projection leaks secrets | Projection evidence refs or provider refs expose `PaymentPayload`, `PAYMENT-SIGNATURE`, private key paths, vault secret paths, bearer tokens, auth.md credentials, PII, or payment-sensitive payloads. | Use typed redaction schemas plus denylist/fuzz tests. Prefer allowlisted projection ref prefixes for live providers. `redaction_failed` must become refusal or proof gap, not an emitted projection. |
| P0: Payment custody / regulatory claim drift | The plan accidentally introduces Handshake-held wallets, balances, signer custody, settlement state, payment management, or facilitator/seller operation. | Explicit non-goal in plan and claim guards. x402 remains one buyer-side exact per-call protected action. No Handshake-held payment credential, no spend ledger claim, no settlement/facilitator/customer custody claim without later official-source verification and source-owned implementation. |

## P1 Risk Register

| Risk | Failure Mode | Mitigation Or Cut Line |
| --- | --- | --- |
| P1: Custody proof overfits x402 | Schema names payment payloads, wallet providers, or x402-specific surfaces and pollutes protocol meaning. | Keep provider-neutral fields: custody provider class, key/credential handle ref, lease/version, resolver ref/version, provider registry ref/digest, attestation refs, redacted audit refs, drift status, redaction profile. x402 maps into the packet as an adapter profile only. |
| P1: Fixture custody is mistaken for customer-owned custody | Local fixture keys and `fixture_gateway_held` posture pass tests and docs later imply provider/customer custody. | Claim guards must distinguish `fixture_gateway_held` from customer/provider gateway custody. Projection should expose fixture/reference posture as local evidence only. Live-custody language stays blocked until non-fixture provider/customer gateway evidence exists. |
| P1: Provider registry digest comparison is too permissive | Current binding only refuses digest mismatch when both binding and stored ref have non-null digests; a null digest path can allow weak drift detection. | For custody proof packets, require digest presence when provider registry or resolver posture matters. If digest is absent, status must be `proof_gap` or `unsafe`, not `gateway_checked`. |
| P1: Lease/version semantics are underspecified | A custody ref has `issuedAt`/`expiresAt`, but no explicit provider lease, resolver lease, rotation epoch, or attestation freshness semantics. | Packet should carry `custodyLeaseRef`, `custodyLeaseVersion`, `resolverVersion`, `attestationRefs`, `observedAt`, `expiresAt`, and `driftStatus`. Stale/unknown lease refuses before greenlight and gateway check. |
| P1: Resolver failure becomes downstream uncertainty | Gateway cannot resolve a credential, but the system records a proof gap after a mutation attempt or treats failure as pending downstream status. | Resolver failure must happen before protected mutation. It should produce gateway refusal or credential-resolution refusal evidence with `mutationAttempted: false`, unless there is explicit evidence the mutation already started. |
| P1: Auth.md lifecycle learning is imported as identity-provider scope | Revocation, claim, JWT, or metadata evidence turns Handshake into an auth provider or OAuth server. | Import only the custody/ref lifecycle pattern: credential-ref isolation, metadata/provider digest drift, redacted revocation evidence, and future policy/gateway blocking. Cut identity-provider claims. |
| P1: Projection redaction remains pattern-only | Unknown provider credential formats bypass regex redaction. | Add provider-format fuzz tests and allowlist projected custody fields. Unknown provider refs should project as opaque digest/status, not raw URI/path, until provider docs are verified. |
| P1: Review artifact laundering | A review surface displays "gateway owned" while the underlying contract/custody packet has weaker or stale status. | Review renderer must bind to exact contract digest, policy input digest, custody proof digest, and rendered uncertainty digest. Missing binding is review theatre. |
| P1: Runtime/MCP proposal surfaces imply enforcement | MCP/runtime proposals include custody metadata and users infer mutation protection, even though those surfaces cannot gate signer use. | Runtime/MCP can propose and read evidence only. They must not create custody proof packets, policy decisions, greenlights, gateway checks, receipts, or credential resolution evidence. |

## P2 Risk Register

| Risk | Failure Mode | Mitigation Or Cut Line |
| --- | --- | --- |
| P2: New primitive creates duplicate custody state | A new packet duplicates `GatewayCredentialRef`, `CredentialResolutionEvidence`, and `ProtectedPathPosture` without clear ownership. | Decide ownership up front. Either extend existing records or define a packet that references them by digest and owns only install/custody proof aggregation. No parallel secret or permission model. |
| P2: Plan expands into hosted/provider architecture | Custody proof planning drifts into Cloudflare, KMS, wallet provider, JWKS, registry, legal, or payment-regulatory implementation details. | Mark all named provider/KMS/wallet/legal/payment details as requiring official-source verification before implementation. Provider-neutral schema can proceed now. |
| P2: Operational ceremony blocks adoption | Integrators must manually sequence install evidence, credential ref, probes, posture, policy, gateway, credential resolution, and projections. | Future implementation can add activation helpers, but helpers must only sequence existing source-owned transitions. They must not move authority into runtime/MCP/SDK convenience layers. |
| P2: Evidence assembly scale is ignored | Projection assembly and receipt timelines can become broad tenant/org scans under hosted volume. | Keep this slice local/kernel. Hosted audit/search claims require scoped indexes, pagination, and retention policy in a later plan. |
| P2: `.planning` scratch becomes canon | Active planning language gets promoted into README/tests/exports without source validation. | Chair plan should treat `.planning` as scratch and name canonical source/test/doc paths for each implementation task. No planning-stage labels in source, scripts, package exports, or CI names. |

## Validation Gates

Implementation must be blocked until these gates exist and pass:

- Schema/canonicalization: custody proof packet or extended custody records have deterministic digest tests, reject raw credential material, require provider-neutral lease/version/drift fields, and preserve Tier 1 protocol meaning.
- Policy gate: missing packet/ref, stale packet/ref, unsafe custody status, provider registry drift, resolver/version drift, weak source authority, missing probe coverage, failed probe, raw sibling present, and active credential-ref isolation all refuse before greenlight.
- Gateway gate: the same stale/drift/unsafe/missing cases refuse at gateway time after a greenlight and produce no mutation attempt or signer call.
- Adapter negative tests: x402 agent-exposed signer, raw private key env, direct official SDK signing, paid fetch/axios, raw payment signature header, sibling x402 wrapper, MCP direct payment, token passthrough, wrapper drift, failure-open posture, and live/unknown provider posture fail closed.
- Auth.md regression tests: revocation, metadata drift, downstream 401, stale credential ref, scope drift, raw bearer passthrough, direct HTTP/browser/network/MCP path, token replay, unsafe retry loop, and redaction failure quarantine/refuse before credential use.
- Projection tests: redacted custody projection includes refs/digests/status/reason codes and omits secret paths, signer material, `PaymentPayload`, `PAYMENT-SIGNATURE`, bearer tokens, raw provider credentials, payment payloads, and PII.
- Claim guards: docs/examples/tests fail if fixture keys imply customer/provider custody, if x402 becomes payment management, if Handshake-held wallets/balances/settlement appear, or if provider-specific custody is claimed without official-source verification.
- Closeout gates: focused protocol/adapter/projection/claim tests first, then `npm run quality:claims`, `npm run quality:architecture`, `npm run format:check`, and `npm run check:repo`.

Candidate focused test paths:

- `test/protocol/credential-custody.test.ts`
- `test/protocol/evidence-projections.test.ts`
- `test/protocol/kernel-policy-gateway.test.ts`
- `test/adapters/x402-wallet-gateway.test.ts`
- `test/adapters/x402-bypass-probes.test.ts`
- `test/adapters/auth-md-gateway-pressure.test.ts`
- `test/adapters/auth-md-serialization-redaction.test.ts`
- `test/conformance/x402-payment-conformance.test.ts`
- `test/architecture/claim-boundary.test.ts`
- `test/architecture/import-posture.test.ts`
- `test/architecture/root-exports.test.ts`

## Rollback And Stop Conditions

Stop the implementation slice if:

- custody proof is not consumed by both policy and gateway checks;
- the gateway cannot refuse before signer/credential use;
- one greenlight can be reused for multiple custody resolutions or mutations;
- fixture/local signer custody is the only evidence behind a customer/provider custody claim;
- redaction tests find any raw signer, token, payment payload, secret path, bearer credential, or PII in projections;
- provider-specific vault/KMS/wallet behavior is needed but official docs have not been verified;
- runtime/MCP/SDK convenience code starts issuing policy, greenlight, gateway, receipt, mutation, or credential-resolution records;
- aggregate spend, settlement, facilitator, seller middleware, balance, or payment-management language appears in the slice.

Rollback should remove or quarantine the new custody packet/projection/claim surface and keep existing `GatewayCredentialRef`, `CredentialResolutionEvidence`, `ProtectedPathPosture`, policy, gateway, and projection behavior unchanged. If partial schema lands without enforcement, it must be marked advisory or removed.

## Assumptions

- Customer-owned gateway custody remains the enforcement model.
- Handshake does not hold wallets, payment credentials, balances, settlement state, or payment-management authority.
- x402 remains the first wedge but does not define protocol primitives.
- Tier 1 protocol meaning remains stable: exact contract, policy decision, one-use greenlight, gateway check, receipt/refusal/proof gap, isolation.
- Existing credential custody and protected-path posture primitives are reusable unless implementation proves a source-level schema conflict.
- Provider-neutral custody schema planning can proceed without browsing; named provider/KMS/wallet/legal/payment details cannot.

## Dependencies

- Current `GatewayCredentialRef` and `CredentialResolutionEvidence` schemas and transition checks.
- Current protected-path posture evaluator, required bypass probe kinds, and source-authority rules.
- Current policy and gateway checks that evaluate protected-path posture, credential refs, idempotency, isolation, gateway policy drift, params digest, and sequence dependencies.
- x402 install proposal, wallet gateway, hostile bypass probes, and conformance posture.
- auth.md credential intake, lifecycle isolation, protected API gateway, bypass probes, and serialization redaction patterns.
- Evidence projection assembly and redaction behavior for contract views, agent transaction envelopes, receipt timelines, idempotency recovery, and protected-path health.

## Antipatterns

- "Custody proof" as a receipt label without pre-mutation enforcement.
- A rendered review screen that says "customer gateway holds credential" without binding to the exact custody proof digest.
- A provider-specific field named `vaultPath`, `secretPath`, `walletPrivateKey`, `PaymentPayload`, or `PAYMENT-SIGNATURE` in protocol records or projections.
- `fixture_gateway_held` presented as customer/provider custody.
- A helper that gives runtime/MCP/SDK code access to signer, credential resolver, gateway check, or credential-resolution writes.
- Treating spend session/day/review bounds as enforced before a ledger exists.
- Collapsing credential resolution failure into downstream unknown after mutation.
- Regex-only redaction for live provider custody.

## Blocked Checks

- No external official-provider, vault/KMS, wallet, x402, JWKS, legal, or payment-regulatory verification was performed; the input packet explicitly said not to browse by default.
- I did not read source files outside the immutable packet's allowed source boundary. In particular, exact `ActionContract` schema internals, action-proposal internals, HTTP handlers, D1 storage, runtime ingress, MCP proposal code, and product example generators were not read unless included indirectly in allowed tests/docs.
- I did not run tests; this is a planning-only first-pass risk artifact.
- I did not read sibling raw outputs, normalized outputs, or the final run `PLAN.md`.
