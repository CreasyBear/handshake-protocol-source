# Execution First Pass: Customer-Owned Gateway Custody Proof

## Invariant at stake

A protected path is real only when the mutation credential is behind a customer/provider gateway, the exact one-use greenlight is checked immediately before consequence, stale or unsafe custody refuses before mutation, and the surviving evidence is redacted but reconstructable.

Current source already has strong pieces:

- `GatewayCredentialRef` and `CredentialResolutionEvidence` in `src/protocol/areas/credential-custody/*`.
- Probe-backed `ProtectedPathPosture` in `src/protocol/areas/protected-path-posture/*`.
- Policy and gateway re-checks for protected-path posture and gateway credential bindings in `src/protocol/areas/policy-greenlight/transitions.ts` and `src/protocol/areas/gateway-gate/transitions.ts`.
- x402 wallet gateway signing only after `VerifiedGatewayCheck` in `src/adapters/x402-payment/wallet-gateway.ts`.
- auth.md reference gateway recording `CredentialResolutionEvidence` after a passed gate and before downstream service execution in `src/adapters/auth-md/gateway.ts`.

The execution gap is not "add a gateway check." The gap is a source-owned custody proof packet that binds install evidence, credential refs, protected-path posture, custody/bypass probes, policy/gateway evaluation, and redacted projections into one digest-bearing evidence object. Without that packet, x402 signer custody can remain profile metadata plus adapter evidence, which is too easy to overclaim as customer-owned gateway custody.

## Recommended phase sequence

### Phase 0 - Implementation source map verification

Before any code change, the executor must inspect companion files not included in this first-pass source packet but required for a real implementation:

- `src/protocol/kernel.ts`
- `src/protocol/areas/credential-custody/index.ts`
- `src/protocol/areas/credential-custody/types.ts`
- `src/protocol/areas/object-registry/*`
- `src/protocol/public/schemas.ts`
- `src/protocol/public/inputs.ts`
- `src/protocol/evidence-projections/schemas.ts`
- `test/support/fixtures.ts`
- `test/support/auth-md-flow.ts`
- x402/auth.md adapter index/export files

Closeout: confirm exact edit set before touching source. If these files show a different public aggregation pattern than expected, update the plan before implementation.

### Phase 1 - Test-first custody packet failures

Add failing tests before adding implementation.

Primary tests:

- `test/protocol/credential-custody.test.ts`
  - rejects raw credential material in custody proof packet fields;
  - creates a custody proof packet only when it binds a stored `GatewayCredentialRef` and a current `ProtectedPathPosture`;
  - proves the packet digest includes credential ref digest, protected-path posture digest, bypass probe digests, provider-neutral key handle/lease/resolver/attestation refs, drift status, and expiry;
  - refuses stale credential ref, provider drift, resolver failure, unsafe custody, missing packet, digest mismatch, redaction failure, and agent-exposed signer.
- `test/protocol/kernel-policy-gateway.test.ts`
  - policy refuses when a contract requiring gateway custody lacks a valid custody proof packet;
  - policy greenlights only when current posture, credential ref, and packet all agree;
  - gateway refuses if the packet drifts or expires after greenlight but before gateway check;
  - gateway does not consume the greenlight when custody refusal happens before mutation.
- `test/protocol/evidence-projections.test.ts`
  - transaction envelope and contract projection expose custody packet refs/digests/status only;
  - projections omit key handles that look like secret paths, signer material, payment payloads, bearer tokens, provider secret paths, and mutation credentials.

Adapter tests:

- `test/adapters/x402-install-proposal.test.ts`
  - x402 install emits a gateway credential ref intent and custody packet expectation, not a Handshake-held wallet.
  - fixture custody remains explicitly local/reference and cannot become live provider/customer custody.
- `test/adapters/x402-payment-action-proposal.test.ts`
  - x402 candidate binds the signer credential ref and custody proof packet digest.
  - x402 proposal refuses when signer custody is agent-exposed or packet binding is missing.
- `test/adapters/x402-wallet-gateway.test.ts`
  - no signer call when custody packet is missing/stale/drifted/unsafe;
  - signer call still happens only after `VerifiedGatewayCheck`;
  - credential resolution/use evidence is recorded as redacted custody evidence for the exact contract and gate.
- `test/adapters/auth-md-gateway-pressure.test.ts`
  - preserve auth.md drift/revocation behavior while adding packet binding.

Architecture/claim tests:

- `test/architecture/claim-boundary.test.ts`
  - docs cannot claim provider/customer custody from fixture keys;
  - docs cannot claim Handshake-held wallets, balances, settlement, payment management, or live provider custody.

### Phase 2 - Add the protocol custody proof packet primitive

Recommendation: add a narrow packet object under `src/protocol/areas/credential-custody/`, not a new authority lane.

Do not replace `GatewayCredentialRef`, `CredentialResolutionEvidence`, or `ProtectedPathPosture`. Add a packet that binds them.

Candidate object name:

```text
GatewayCustodyProofPacket
```

Minimum schema shape:

```text
gatewayCustodyProofPacketId
gatewayCustodyProofPacketDigest
gatewayCredentialRefId
gatewayCredentialRefDigest
protectedPathPostureId
protectedPathPostureDigest
bypassProbeIds
bypassProbeDigests
gatewayInstallEvidenceRefs
custodyProviderClass
custodyProviderRef
custodyProviderDigest
keyHandleRef
keyHandleDigest
leaseRef
leaseVersion
leaseExpiresAt
resolverRef
resolverVersion
resolverDigest
attestationRefs
attestationDigests
redactedAuditRefs
custodyStatus
custodyDriftStatus
resolverDriftStatus
redactionStatus
externalVerificationStatus
redactionProfileRef
secretMaterialIncluded: false
issuedAt
expiresAt
```

Field rules:

- `custodyProviderClass`, `custodyProviderRef`, `keyHandleRef`, `leaseRef`, `resolverRef`, `attestationRefs`, and `redactedAuditRefs` are opaque refs, not provider-specific vault/KMS APIs.
- The schema must reject raw credential material and obvious secret paths using the same posture as existing credential custody redaction.
- `externalVerificationStatus` should allow provider-neutral local planning without implying official provider verification. Any named vault/KMS/wallet/provider implementation remains blocked until official source verification.
- `fixture_gateway_held` can support local/reference evidence only; it must not project as live customer/provider custody.

Transition:

```text
recordGatewayCustodyProofPacket(input)
```

Transition checks:

- loads the credential ref by ID;
- loads current protected-path posture by ID or scope;
- verifies tenant/org/gateway/protected surface/action/resource agreement;
- verifies posture is fresh, `gateway_checked`, and probe-backed;
- verifies required bypass probe kinds are present and passed;
- verifies credential custody can satisfy gateway-checked posture;
- canonicalizes packet digest after all loaded refs are known;
- commits packet record and event;
- never retrieves or stores secret material;
- never creates permission, greenlight, mutation proof, wallet custody, settlement, or payment state.

### Phase 3 - Bind the packet into contract, policy, and gateway evaluation

Extend the existing `GatewayCredentialBinding` path instead of creating a parallel policy path.

Candidate binding additions:

```text
custodyProofPacketId
custodyProofPacketDigest
requiredCustodyDriftStatus
requiredResolverDriftStatus
```

Policy/gateway execution changes:

- `evaluateGatewayCredentialBindings()` loads both the credential ref and packet.
- Policy input includes credential ref posture plus packet posture, freshness, drift, redaction status, and packet digest.
- Policy refuses before greenlight for missing packet, digest mismatch, stale packet, packet/ref scope mismatch, unsafe custody status, provider drift, resolver drift, weak posture, failed probes, or redaction failure.
- Gateway re-runs the same evaluation immediately before mutation and refuses without consuming the greenlight when custody drift blocks pre-mutation admission.
- Gateway check artifacts should record packet refs/digests seen, either directly on `GatewayCheckAttempt` if schema ownership supports it or through evidence refs on receipt/projection if the schema change is too wide.

Do not change the Tier 1 authority rule. The packet strengthens evidence required for `gateway_checked` custody. It does not authorize mutation by itself.

### Phase 4 - Make x402 use credential-ref custody proof

x402 is the critical adapter because current install/profile code carries signer posture in `X402WalletGatewayProfile` and gateway registry metadata, while the candidate contract currently uses `secretRefs: {}` and does not bind a generic `GatewayCredentialRef`.

Implementation direction:

- `src/adapters/x402-payment/install-proposal.ts`
  - derive a provider-neutral gateway credential ref for the wallet signer/payment credential;
  - keep signer refs opaque and redacted;
  - mark fixture custody as fixture/local only;
  - add packet expectation refs to install output and human summary without claiming live provider custody;
  - preserve per-call x402 exact scope and no aggregate payment-budget management.
- `src/adapters/x402-payment/action-proposal.ts`
  - add credential ref and custody packet binding to the candidate `gatewayCredentialRefs`;
  - include packet digest in candidate/contract digest path through the existing binding;
  - refuse if x402 attempt cannot bind a valid packet for the installed gateway.
- `src/adapters/x402-payment/wallet-gateway.ts`
  - continue calling `gatewayCheck()` before signer invocation;
  - after `VerifiedGatewayCheck`, record redacted credential resolution/use evidence for the signer credential ref and custody packet;
  - do not call the official signer when packet/ref/posture/gateway check refuses;
  - do not expose `PaymentPayload`, `PAYMENT-SIGNATURE`, private keys, payment credentials, or provider secret paths in packet, resolution evidence, reconciliation evidence, or projections.
- `src/adapters/x402-payment/bypass-probes.ts` and `src/adapters/x402-payment/conformance.ts`
  - keep hostile probe posture as packet inputs;
  - distinguish `gateway_held` from `fixture_gateway_held`;
  - require external verification before any named live provider custody implementation.

x402 must remain the first wedge, not the protocol definition. The implementation must not add balances, settlement state, payment management, facilitator operation, seller middleware, or Handshake-held wallet concepts.

### Phase 5 - Apply auth.md learnings without turning Handshake into auth

auth.md already has the right execution posture:

- gateway check first;
- no downstream execution if gate/ref/metadata/scope drift refuses;
- `CredentialResolutionEvidence` after passed gate;
- revocation/lifecycle evidence maps to credential-ref isolation;
- redaction assertions block bearer material.

Implementation direction:

- bind auth.md protected API call candidates to the same custody proof packet shape;
- keep auth.md discovery, registration, claim, identity, and revocation as provenance/evidence only;
- packet drift or revocation-driven isolation must block both policy and gateway checks;
- do not introduce auth provider, OAuth server, WorkOS alternative, or generic API gateway claims.

### Phase 6 - Redacted custody projections

Add a buyer-readable custody projection without exposing secret-bearing material.

Candidate projection fields:

```text
custodyProofPacketRef
custodyProofPacketDigest
gatewayCredentialRef
gatewayCredentialRefDigest
protectedPathPostureRef
protectedPathPostureDigest
custodyProviderClass
custodyProviderRef
keyHandleDigest
leaseVersion
leaseFreshness
resolverVersion
custodyDriftStatus
resolverDriftStatus
redactedAuditRefs
attestationRefs
externalVerificationStatus
secretMaterialIncluded: false
redactionProfileRef
omittedFields
```

Candidate source paths:

- `src/protocol/evidence-projections/projections.ts`
- `src/protocol/evidence-projections/assembly.ts`
- `src/protocol/evidence-projections/schemas.ts` (not read in this first pass; implementation must verify)

Projection tests must assert absence of:

- secret paths;
- signer material;
- raw private keys;
- `PaymentPayload`;
- `PAYMENT-SIGNATURE`;
- bearer tokens;
- mutation credentials;
- provider-specific secret locator strings.

### Phase 7 - Canon and claim guards

Docs should change only after source/tests define the packet.

Candidate docs:

- `README.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-definition.md`
- `docs/internal/protocol-kernel-architecture.md`
- `docs/internal/protocol-notes.md`
- `docs/internal/protocol-layman.md`
- `.planning/macro/DEFERRED-INTEGRATE-ELIMINATE.md` only as scratch alignment

Required wording:

- protected path is installed only when a gateway owns or controls the mutation credential, custody packet evidence is current, the exact greenlight is checked before mutation, and drift/unsafe custody refuses;
- fixture custody is local/reference only;
- x402 uses the custody proof as one protected-action pack and does not define the protocol;
- Handshake does not hold wallets, payment credentials, balances, settlement state, payment management, provider custody, or auth-provider custody;
- named vault/KMS/provider custody implementations require official source verification before implementation.

## Task graph

| Task | Owner lane | Depends on | Candidate paths | Closeout evidence |
| --- | --- | --- | --- | --- |
| T0 source map verification | Executor | input packet | kernel, object registry, public aggregators, projection schemas, fixtures | confirmed exact edit map |
| T1 failing protocol tests | Protocol tests | T0 | `test/protocol/credential-custody.test.ts`, `test/protocol/kernel-policy-gateway.test.ts` | focused tests fail for missing packet |
| T2 packet schema/input | Protocol | T1 | `src/protocol/areas/credential-custody/schemas.ts`, `inputs.ts` | schema rejects secret material and unsafe field shape |
| T3 packet transition/registry | Protocol | T2 | `src/protocol/areas/credential-custody/transitions.ts`, companion public/kernel/object-registry files | packet record/event commits and binds ref/posture/probes |
| T4 policy/gateway binding | Protocol | T3 | `credential-custody/transitions.ts`, `policy-greenlight/transitions.ts`, `gateway-gate/transitions.ts`, `gateway-gate/artifacts.ts` | policy/gateway refuse missing/stale/drifted/unsafe packet |
| T5 x402 install/proposal/gateway | Adapter | T4 | `src/adapters/x402-payment/install-proposal.ts`, `action-proposal.ts`, `wallet-gateway.ts`, `bypass-probes.ts`, `conformance.ts` | no signer call without valid packet; no wallet/payment-management claim |
| T6 auth.md parity | Adapter | T4 | `src/adapters/auth-md/gateway.ts`, `profiles.ts`, `revocation.ts`, `bypass-probes.ts` | packet drift/revocation blocks credential resolution and downstream call |
| T7 projections | Protocol projections | T4 | `src/protocol/evidence-projections/projections.ts`, `assembly.ts`, schemas companion | redacted custody projection includes refs/digests/status only |
| T8 docs and claim guards | Docs/architecture tests | T5, T7 | canonical docs, `test/architecture/claim-boundary.test.ts` | fixture/live custody and payment-management claims fail if reintroduced |
| T9 closeout gates | Executor | T1-T8 | package scripts | focused gates and `npm run check:repo` pass |

## Dependency map

```text
T0
  -> T1
    -> T2
      -> T3
        -> T4
          -> T5
          -> T6
          -> T7
            -> T8
              -> T9
```

Hard dependency: x402/auth.md adapter work should not begin until the packet schema and binding semantics are stable. Otherwise each adapter will invent its own custody proof shape and the protocol will lose the customer-owned gateway custody primitive.

## Critical path

```text
failing protocol tests
-> packet schema/input
-> packet transition and digest
-> extend GatewayCredentialBinding evaluation
-> x402 binds signer credential ref and packet
-> gateway refuses stale/drifted/unsafe packet before signer
-> projection redacts custody evidence
-> claim guards prevent fixture/live custody overclaim
-> focused tests and check:repo
```

The riskiest segment is `GatewayCredentialBinding` extension. It sits in candidate/contract digest, policy input, and gateway evaluation. If it is added as optional metadata instead of required evidence for gateway-custody actions, the packet becomes advisory.

## What can run in parallel

After T2 field names are stable:

- Protocol projection tests and architecture claim guards can be drafted in parallel.
- x402 and auth.md adapter test cases can be drafted in parallel, as long as they use the same packet binding shape.
- Docs wording can be prepared in parallel but should not land before source/tests prove packet behavior.
- Redaction fuzz cases can be added in parallel with adapter integration.

Do not parallelize by giving x402 a local custody shape and auth.md a separate shape. That creates two adapter-specific evidence stories and no protocol primitive.

## First executable step

Implementation turn first step:

```text
Inspect required companion files from Phase 0, then add the first failing tests in
test/protocol/credential-custody.test.ts for:
1. GatewayCustodyProofPacket schema redaction.
2. Packet digest binding to GatewayCredentialRef + ProtectedPathPosture + bypass probe digests.
3. Policy refusal when an otherwise valid contract lacks the packet binding.
```

Only after those tests fail for the expected reason should source implementation begin.

## Source/test/doc candidate paths

Protocol source candidates:

- `src/protocol/areas/credential-custody/schemas.ts`
- `src/protocol/areas/credential-custody/inputs.ts`
- `src/protocol/areas/credential-custody/custody-posture.ts`
- `src/protocol/areas/credential-custody/transitions.ts`
- `src/protocol/areas/protected-path-posture/schemas.ts`
- `src/protocol/areas/protected-path-posture/inputs.ts`
- `src/protocol/areas/protected-path-posture/transitions.ts`
- `src/protocol/areas/policy-greenlight/transitions.ts`
- `src/protocol/areas/gateway-gate/schemas.ts`
- `src/protocol/areas/gateway-gate/inputs.ts`
- `src/protocol/areas/gateway-gate/artifacts.ts`
- `src/protocol/areas/gateway-gate/transitions.ts`
- `src/protocol/evidence-projections/projections.ts`
- `src/protocol/evidence-projections/assembly.ts`

Likely implementation companion paths not read in this first pass:

- `src/protocol/kernel.ts`
- `src/protocol/areas/credential-custody/index.ts`
- `src/protocol/areas/credential-custody/types.ts`
- `src/protocol/areas/object-registry/*`
- `src/protocol/public/schemas.ts`
- `src/protocol/public/inputs.ts`
- `src/protocol/evidence-projections/schemas.ts`
- `src/storage/d1/*` and migrations if the new object needs durable indexed storage
- `test/support/fixtures.ts`
- `test/support/auth-md-flow.ts`

Adapter source candidates:

- `src/adapters/x402-payment/install-proposal.ts`
- `src/adapters/x402-payment/action-proposal.ts`
- `src/adapters/x402-payment/wallet-gateway.ts`
- `src/adapters/x402-payment/bypass-probes.ts`
- `src/adapters/x402-payment/conformance.ts`
- `src/adapters/auth-md/profiles.ts`
- `src/adapters/auth-md/gateway.ts`
- `src/adapters/auth-md/revocation.ts`
- `src/adapters/auth-md/bypass-probes.ts`
- `src/adapters/protected-path-probes/index.ts`
- `src/adapters/protected-path-probes/executor.ts`

Test candidates:

- `test/protocol/credential-custody.test.ts`
- `test/protocol/evidence-projections.test.ts`
- `test/protocol/kernel-policy-gateway.test.ts`
- `test/adapters/x402-install-proposal.test.ts`
- `test/adapters/x402-payment-action-proposal.test.ts`
- `test/adapters/x402-wallet-gateway.test.ts`
- `test/adapters/x402-bypass-probes.test.ts`
- `test/conformance/x402-payment-conformance.test.ts`
- `test/adapters/auth-md-gateway-pressure.test.ts`
- `test/adapters/auth-md-serialization-redaction.test.ts`
- `test/architecture/claim-boundary.test.ts`
- `test/architecture/import-posture.test.ts`
- `test/architecture/root-exports.test.ts`

Doc candidates:

- `README.md`
- `QUALITY.md`
- `STRUCTURE.md` only if source ownership changes
- `docs/internal/decisions.md`
- `docs/internal/protocol-definition.md`
- `docs/internal/protocol-kernel-architecture.md`
- `docs/internal/protocol-layman.md`
- `docs/internal/protocol-notes.md`
- `.planning/macro/DEFERRED-INTEGRATE-ELIMINATE.md` only as scratch alignment

## Validation gates

Focused gates:

```bash
npm run test -- test/protocol/credential-custody.test.ts test/protocol/kernel-policy-gateway.test.ts
npm run test -- test/protocol/evidence-projections.test.ts
npm run test -- test/adapters/x402-install-proposal.test.ts test/adapters/x402-payment-action-proposal.test.ts test/adapters/x402-wallet-gateway.test.ts test/adapters/x402-bypass-probes.test.ts
npm run test -- test/conformance/x402-payment-conformance.test.ts
npm run test -- test/adapters/auth-md-gateway-pressure.test.ts test/adapters/auth-md-serialization-redaction.test.ts
npm run quality:claims
npm run quality:architecture
```

Full closeout:

```bash
npm run check:types
npm run lint
npm run format:check
npm run test
npm run pack:check
git diff --check
npm run check:repo
```

Required behavioral evidence:

- Missing custody packet refuses before greenlight.
- Stale custody packet refuses before greenlight and before gateway mutation.
- Packet drift after greenlight refuses at gateway and does not call signer/downstream surface.
- Agent-exposed signer refuses during install/proposal/posture/policy path.
- Raw sibling bypass posture fails protected path posture and prevents greenlight.
- Credential resolution evidence is recorded only after a passed gateway check.
- Redacted projections never expose signer material, payment payloads, bearer tokens, mutation credentials, or provider secret paths.
- Fixture custody cannot project as live provider/customer custody.

## Cut lines

Keep out of this implementation slice:

- Handshake-held wallets or payment credentials.
- Balance tracking, settlement, payment management, facilitator operation, seller middleware, spend-window ledger enforcement, or aggregate payment budgets.
- Live provider/customer custody claims from fixture keys.
- Provider-specific vault/KMS architecture unless official source verification is performed in a later implementation pass.
- Hosted operation, hosted verifier, live JWKS/revocation, cross-org trust, marketplace, certification, or clearing-house claims.
- Broad MCP/browser/shell/network/package-manager interception claims.
- New dashboard/review UX unless it renders exact packet refs and cannot authorize anything.
- A second adapter-specific custody proof shape.

## Assumptions

- The implementation may add a new credential-custody protocol object without changing Tier 1 authority semantics.
- Existing `GatewayCredentialRef` remains the opaque credential reference; the packet binds install/posture/probe evidence around it.
- Existing policy and gateway evaluation should remain the enforcement points.
- x402 must migrate from signer-profile metadata toward generic credential-ref/packet binding for custody claims.
- auth.md remains a reference protected API call profile and should inform lifecycle/isolation/redaction patterns only.
- `.planning/` is scratch and should not become source/package/public API naming.

## Risks

- Optional packet risk: if packet binding is optional on candidates, x402 can keep running on signer metadata while docs claim custody proof. This is advisory, not Handshake.
- Digest drift risk: if packet digest is not included in candidate/contract/policy/gateway inputs, a stale packet can be swapped after review.
- Gateway consumption risk: if custody refusal consumes the greenlight, safe retry/recovery semantics get muddied. Pre-mutation custody refusal should not become mutation evidence.
- Fixture overclaim risk: `fixture_gateway_held` can pass local tests but must not support live provider/customer custody language.
- Redaction pattern risk: current redaction relies partly on pattern detection. Unknown provider refs can evade it. Prefer allowlisted projection fields and digest-only provider material.
- x402 scope creep risk: custody proof can invite wallet/payment-management fields. Keep the packet provider-neutral and action-bound.
- Migration blast radius: public schemas, object registry, kernel facade, storage, and projections may all need updates. Do not hide those changes inside adapter-only work.

## Antipatterns

- Adding `custodyProof: true` to install output without a protocol object and digest.
- Treating wallet gateway profile metadata as customer-owned custody proof.
- Recording credential resolution evidence before a passed gateway check.
- Letting x402 call the signer after a failed packet/ref/posture check.
- Storing provider secret paths, raw signer refs, payment payloads, bearer tokens, or private keys in packet fields.
- Creating x402-specific custody proof that auth.md cannot reuse.
- Calling fixture custody "provider custody" or "customer custody."
- Using docs to claim live custody before source-owned packet, negative tests, and redacted projections exist.
- Browsing or adding named provider architecture during implementation without official source verification.

## Blocked checks

- Did not read sibling raw outputs, normalized outputs, or final `PLAN.md` for this run.
- Did not browse or verify any named vault/KMS/wallet/x402/provider documentation; any provider-specific custody implementation remains blocked on official source verification.
- Did not inspect companion implementation files outside the input packet, including kernel facade, object registry, public aggregators, projection schemas, storage migrations, and fixture helpers.
- Did not run tests because this is a planning-only first pass and source was not modified.
- Did not verify whether D1 storage needs a migration/index for the new packet object; implementation must check object registry/store behavior before coding.
