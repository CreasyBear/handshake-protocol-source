# Plan

## Goal

Invariant at stake: a protected action is real only when the mutation credential remains behind a customer/provider gateway boundary, an exact one-use greenlight is checked immediately before consequence, unsafe or drifted custody refuses before mutation, and the surviving evidence is redacted but reconstructable.

Create an implementation plan for customer-owned gateway custody proof as a source-owned mechanism for protected actions for automated decision making. x402 is the first wedge because paid HTTP makes credential custody concrete, but x402 must not define the protocol. Tier 1 protocol meaning stays stable: exact action contract, policy decision, one-use greenlight, gateway check, receipt/refusal/proof gap, and isolation state remain the authority spine.

The 10-star bar is this: a buyer can see that the automated decision system never received the mutation credential, the customer/provider gateway held or resolved the credential, the exact greenlight was checked immediately before mutation, drift/stale/unsafe custody refused before consequence, and the surviving packet is redacted but reconstructable.

## Non-Goals

- No Handshake-held wallets, private keys, bearer tokens, payment credentials, balances, settlement state, or payment-management state.
- No provider/customer custody claim from fixture keys, local sandbox signers, conformance fixtures, or `fixture_gateway_held` posture.
- No live provider custody, named vault/KMS/wallet architecture, JWKS behavior, x402 provider behavior, legal, or payment-regulatory claim until official source verification happens in a later implementation pass.
- No broad x402 compatibility, marketplace, certification, clearing-house readiness, facilitator operation, seller middleware, signed offers, signed receipts, aggregate spend ledgers, or payment settlement.
- No broad runtime, MCP, browser, shell, package-manager, cloud, repo, database, or network control claim.
- No new authority plane. A custody proof packet cannot create permission, mint greenlights, replace policy evaluation, replace the gateway check, or prove downstream business success.
- No raw custody packet read API that exposes secret-bearing provider coordinates, signer material, `PaymentPayload`, `PAYMENT-SIGNATURE`, bearer tokens, mutation credentials, payment payloads, authorization headers, claim tokens, JWTs, PII, or provider secret paths.
- No planning-stage labels from `.planning/` promoted into source paths, package scripts, CI names, exports, or canonical docs.

## Source Boundary

This plan was synthesized from the immutable packet at `.planning/macro/active/customer-owned-gateway-custody-proof/runs/customer-owned-gateway-custody-proof-20260524T071623Z/input.md`, the five raw perspective outputs under the same run, and the macro plan contract.

Allowed source paths named in the packet define the evidence boundary for this planning pass. The plan relies on the raw agents' source-grounded findings, especially around:

- `GatewayCredentialRef`, `CredentialResolutionEvidence`, and credential-custody transitions.
- `ProtectedPathPosture`, source-authority posture, and bypass probe digests.
- policy and gateway transitions that already re-check posture and credential bindings.
- x402 install, wallet-gateway, bypass-probe, and conformance posture.
- auth.md gateway, revocation, bypass, and serialization-redaction learnings.
- evidence projection and claim-boundary tests.

Companion implementation files outside the first-pass packet must be verified before coding, including protocol public aggregation, object registry, kernel facade, projection schemas, fixtures, storage, and migrations. This plan is executable only after that source map is checked.

## Current State

Current source appears to have the authority spine needed for the slice:

- `GatewayCredentialRef` provides an opaque, provider-neutral credential reference and rejects raw credential-looking material.
- `CredentialResolutionEvidence` is post-gate evidence. It binds exact contract, greenlight, gate attempt, credential ref digest, resolver metadata, request digest, redaction status, and result class after a passed gateway check.
- `ProtectedPathPosture` models current runtime/gateway/action/resource posture, including gateway-checked state, credential custody status, raw sibling status, bypass probe refs/digests, source authority, expiry, and posture digest.
- policy evaluation and gateway check both consult current protected-path posture and gateway credential bindings before authority proceeds.
- gateway artifacts distinguish gateway check from mutation attempt and downstream outcome.
- redacted projections already expose contract, transaction, receipt, install-health, idempotency, and credential evidence without raw credential material.
- x402 proves one local/reference buyer-side `x402_payment.exact` path where signing happens after `VerifiedGatewayCheck`.
- auth.md provides the strongest pattern for credential refs, lifecycle drift/revocation, post-gate credential resolution, isolation, and redaction.

The gap is not vocabulary. The gap is that custody proof is scattered across install evidence, credential refs, protected-path posture, bypass probes, policy input, gateway checks, credential resolution evidence, and projections. Without a source-owned packet or equivalent digest spine, customer-owned gateway custody can be overclaimed from fixture posture, adapter metadata, or a review projection.

## Target State

Add a narrow source-owned `GatewayCustodyProofPacket` under the credential-custody authority spine. It is evidence, not authority.

The mechanism is:

```text
gateway install evidence
-> GatewayCredentialRef id/digest
-> protected-path posture id/digest
-> custody/bypass probe packet refs/digests
-> custody proof packet id/digest
-> action contract credential binding
-> policy input and greenlight binding
-> gateway-time revalidation before mutation
-> post-gate CredentialResolutionEvidence
-> redacted custody projection
```

The packet binds existing primitives instead of replacing them. Existing `GatewayCredentialRef`, `CredentialResolutionEvidence`, `ProtectedPathPosture`, policy checks, gateway checks, bypass probes, and projections should be extended to consume or expose the packet where necessary. Do not add a new custody approval, custody greenlight, wallet authorization, hosted trust certificate, or payment-custody object.

The packet posture is provider-neutral and redaction-first. Candidate fields:

- `gatewayCustodyProofPacketId`
- `gatewayCustodyProofPacketDigest`
- `gatewayCredentialRefId`
- `gatewayCredentialRefDigest`
- `protectedPathPostureId`
- `protectedPathPostureDigest`
- `gatewayInstallEvidenceRefs`
- `gatewayInstallEvidenceDigests`
- `bypassProbeIds`
- `bypassProbeDigests`
- `gatewayId`
- `gatewayRegistryEntryId`
- `protectedSurfaceKind`
- `actionClasses`
- `resourceRefs`
- `custodyProviderClass`
- `custodyProviderRegistryRef`
- `custodyProviderRegistryDigest`
- `opaqueKeyHandleRef`
- `opaqueKeyHandleDigest`
- `credentialKind`
- `credentialCustodyStatus`
- `custodyClaimLevel`: `local_fixture | customer_gateway_evidence | provider_gateway_evidence | proof_gap`
- `resolverRef`
- `resolverVersion`
- `resolverDigest`
- `leaseRef`
- `leaseVersion`
- `leaseIssuedAt`
- `leaseExpiresAt`
- `attestationRefs`
- `attestationDigests`
- `redactedAuditRefs`
- `redactedAuditDigest`
- `custodyDriftStatus`: `current | stale | provider_drift | resolver_drift | unsafe_custody | proof_gap`
- `resolverDriftStatus`
- `redactionStatus`
- `externalVerificationStatus`: `not_required | required_before_live_claim | verified_by_official_source`
- `redactionProfileRef`
- `secretMaterialIncluded: false`
- `recordedAt`
- `expiresAt`

The packet must reject raw credentials, raw signer refs, raw vault/KMS/provider secret paths, bearer tokens, `PaymentPayload`, `PAYMENT-SIGNATURE`, private keys, mutation credentials, payment payloads, and access-token-looking values. Projection should expose refs, digests, statuses, and omitted fields only.

## Assumptions

- Tier 1 protocol meaning remains stable and is not redefined by custody proof.
- Customer-owned gateway custody means the customer/provider gateway owns or resolves the mutation credential; Handshake does not hold or manage the credential.
- x402 remains the first protected-action pack, not the protocol definition.
- The packet can be added as an evidence object under credential custody without introducing hosted operation.
- Custody proof is required first for credential-backed protected paths, including x402 signer custody. It should not become a global requirement for every `gateway_checked` path in this slice.
- Fixture/local/reference custody can support regression proof only and must project as `local_fixture`, not customer/provider custody.
- Named provider, vault, KMS, wallet, x402 provider, JWKS, Cloudflare, npm, MCP Registry, legal, or payment-regulatory details require official source verification before implementation.
- Object registry, public schema, projection schema, storage, migration, fixture, and package-export impacts are not fully verified in this planning pass and must be checked before source edits.

## Decisions

1. Add a custody proof packet, but keep it subordinate to existing primitives.
   - Choice: add `GatewayCustodyProofPacket` as a typed evidence packet under `src/protocol/areas/credential-custody/`.
   - Reason: extending only `GatewayCredentialRef`, `CredentialResolutionEvidence`, `ProtectedPathPosture`, and bypass probes leaves the custody story scattered. A buyer-readable claim needs one digest-bound packet that ties install evidence, credential ref, posture, probes, drift, redaction, and later gate/resolution evidence together.
   - Boundary: the packet does not authorize mutation. Policy and gateway checks remain the enforcement points.

2. Extend existing bindings instead of creating a new authority lane.
   - `GatewayCredentialRef` remains the opaque credential handle.
   - `ProtectedPathPosture` remains current, probe-backed posture.
   - bypass probes remain hostile-path evidence.
   - `CredentialResolutionEvidence` remains post-gate use/resolution evidence.
   - policy and gateway checks must consume packet id/digest and drift state for custody-backed paths.

3. Require custody proof first for credential-backed protected paths.
   - x402 signer custody is the first target.
   - Do not silently require custody proof for all `gateway_checked` paths until the first credential-backed path proves the mechanism.

4. Treat x402 as a proof pack, not payment infrastructure.
   - x402 maps signer custody into generic credential refs and custody proof packets.
   - x402 remains one buyer-side exact paid HTTP action per call.
   - No Handshake-held wallet, balance, settlement, facilitator, seller middleware, aggregate spend, or broad compatibility claim.

5. Import auth.md learnings only as custody/ref lifecycle patterns.
   - Reuse credential-ref binding, lifecycle drift, revocation/isolation, post-gate resolution, and redaction patterns.
   - Do not turn Handshake into an auth provider, OAuth server, identity provider, or generic API gateway.

6. Redacted projection is the adoption artifact.
   - The buyer should read a custody projection that links packet, contract, policy/greenlight, gateway check, credential resolution, mutation/refusal/proof-gap refs, and omitted fields.
   - Raw packet access is not the buyer-facing proof path.

## Phases

### Phase 0 - Source Map Verification

Before implementation, inspect companion files outside the first-pass packet that likely own public aggregation, object registration, storage, fixture, and projection schema wiring. Confirm the exact edit set and update this plan if source ownership differs.

Candidate paths to verify:

- `src/protocol/kernel.ts`
- `src/protocol/areas/credential-custody/index.ts`
- `src/protocol/areas/credential-custody/types.ts`
- `src/protocol/areas/object-registry/*`
- `src/protocol/public/schemas.ts`
- `src/protocol/public/inputs.ts`
- `src/protocol/evidence-projections/schemas.ts`
- `src/storage/d1/*`
- `src/storage/memory/*`
- `test/support/fixtures.ts`
- `test/support/auth-md-flow.ts`
- adapter index/export files

Exit criteria: exact source/test/doc edit map is confirmed before coding.

### Phase 1 - Test-First Custody Packet Failures

Add failing tests before implementation. The first tests should prove:

- custody packet schema rejects raw credential and secret-looking fields.
- custody packet digest changes when credential ref, protected-path posture, bypass probes, resolver version, lease/version, attestation digest, redacted audit digest, drift status, redaction status, or expiry changes.
- policy refuses a credential-backed action that has valid credential ref and protected-path posture but no valid custody packet binding.
- gateway refuses when custody packet/posture/credential ref drifts after greenlight and before mutation.
- projections expose refs/digests/status only and omit secret-bearing material.
- fixtures cannot satisfy customer/provider custody claims.

Exit criteria: focused tests fail for missing source-owned packet behavior, not unrelated fixture setup.

### Phase 2 - Source-Owned Packet Schema And Transition

Add `GatewayCustodyProofPacket` schema/input/transition under credential custody. Implement `recordGatewayCustodyProofPacket(input)` or the local equivalent.

The transition must:

- load the credential ref by id/digest.
- load current protected-path posture by id or exact scope.
- verify tenant/org/gateway/protected surface/action/resource agreement.
- verify posture is fresh, `gateway_checked`, and accepted-source probe-backed.
- verify required bypass probes are present and passed.
- verify credential custody can satisfy gateway-checked posture.
- canonicalize the packet digest after loaded refs are known.
- commit packet record and event through the source-owned object/store pattern.
- never retrieve, store, or project secret material.
- never create permission, greenlight, mutation proof, wallet custody, settlement, or payment state.

Exit criteria: packet schema and transition tests pass with deterministic digest behavior and redaction failure handling.

### Phase 3 - Bind Packet Into Contract, Policy, And Gateway Evaluation

Extend the existing gateway credential binding path with custody packet id/digest and required drift/redaction status fields. Do not create a parallel policy evaluator.

Policy must refuse before greenlight when:

- packet is missing.
- packet digest mismatches the credential ref, posture, or binding.
- packet is stale or expired.
- credential ref is stale, isolated, scope-mismatched, or provider-drifted.
- provider registry digest, resolver version, lease/version, posture digest, or probe digest drifted.
- custody status is unsafe, agent-exposed, fixture-only for customer/provider claim, or proof gap.
- source authority is weak.
- required bypass probes are missing or failed.
- redaction failed.

Gateway check must re-run the same current-state custody checks immediately before mutation and record what it saw. Prefer explicit `custodyProofPacketIdSeen`, `custodyProofPacketDigestSeen`, and `custodyDriftStatusSeen` fields on gateway evidence if schema ownership supports it. If not, prove that posture digest deterministically includes packet digest and drift status.

Exit criteria: policy and gateway negative tests refuse before mutation and do not record downstream success as custody proof.

### Phase 4 - x402 First Wedge Integration

Make x402 use the generic custody primitives.

Implementation direction:

- x402 install proposal derives or references a `GatewayCredentialRef` for signer/payment credential custody.
- x402 action proposal binds the credential ref and custody packet digest on the candidate/contract path.
- wallet gateway continues to require `VerifiedGatewayCheck` before signing.
- wallet gateway records redacted `CredentialResolutionEvidence` after a passed gate and binds it to exact contract, greenlight, gate attempt, credential ref, and custody packet.
- x402 bypass/conformance tests distinguish local fixture custody from customer/provider custody.
- fixture custody projects as `local_fixture` and cannot satisfy live customer/provider custody claim guards.

Exit criteria: x402 cannot call the signer on missing/stale/drifted/unsafe packet, raw sibling posture, replay, params mismatch, or gateway policy drift; x402 still does not introduce payment custody or payment management.

### Phase 5 - auth.md Parity Pattern

Use auth.md as a reference protected API profile for lifecycle and redaction semantics.

Implementation direction:

- bind auth.md credential refs to the same custody packet shape when custody proof is required.
- preserve revocation/lifecycle isolation.
- ensure metadata/provider digest drift blocks policy/gateway checks before credential resolution and downstream service calls.
- keep auth.md identity/claim/revocation evidence as provenance, not auth-provider authority.

Exit criteria: auth.md drift, revocation, token replay, raw bearer passthrough, unsafe retry, and redaction failure still quarantine/refuse before credential use.

### Phase 6 - Redacted Custody Projection

Add a redacted projection that assembles the packet chain for buyers without exposing raw custody material.

Projection fields should include:

- custody proof packet ref/digest.
- credential ref/digest.
- protected-path posture ref/digest.
- action contract ref/digest.
- policy decision/greenlight ref/digest.
- gateway check ref/digest.
- credential resolution evidence refs.
- mutation/refusal/proof-gap/downstream reconciliation refs.
- custody provider class, provider registry digest, opaque key handle digest, resolver version, lease version/freshness, attestation digests, redacted audit digest.
- custody claim level, drift status, redaction status, external verification status, omitted fields, and reason codes.

Projection must omit secret paths, signer material, raw key handles, bearer tokens, `PaymentPayload`, `PAYMENT-SIGNATURE`, mutation credentials, payment payloads, raw authorization headers, claim tokens, JWTs, PII, and provider secret coordinates.

Exit criteria: projection tests prove the packet distinguishes gateway check, credential resolution, mutation/downstream outcome, refusal, and proof gap.

### Phase 7 - Claim Guards And Canonical Docs

Update canonical docs only after source/tests prove the packet. Keep docs compact and source-owned.

Candidate docs:

- `README.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-definition.md`
- `docs/internal/protocol-kernel-architecture.md`
- `docs/internal/protocol-layman.md`
- `docs/internal/protocol-notes.md`

Claim guards must fail if docs/examples imply:

- live provider/customer custody from fixture keys.
- Handshake-held wallet, payment credential, balance, settlement, payment management, seller/facilitator, marketplace, certification, or clearing-house operation.
- x402 as the protocol instead of the first protected-action pack.
- hosted trust or broad runtime/MCP/browser/shell interception.
- provider-specific vault/KMS/wallet correctness without official source verification.

Exit criteria: claim-boundary and architecture tests pass before public/docs language changes are considered complete.

### Phase 8 - Closeout

Close only when focused protocol, adapter, projection, redaction, architecture, claim, and full repo gates pass. Planned evidence must be separated from existing evidence throughout closeout.

## Task Graph

```text
custody-000
  -> custody-010
    -> custody-020
      -> custody-030
        -> custody-040
          -> custody-050
          -> custody-060
          -> custody-070
            -> custody-080
              -> custody-090
```

- `custody-000`: verify source map and exact edit ownership.
- `custody-010`: add failing protocol, gateway, projection, and claim tests.
- `custody-020`: add packet schema/input/canonicalization.
- `custody-030`: add packet record transition and source-owned persistence/event wiring.
- `custody-040`: bind packet into contract/policy/gateway checks.
- `custody-050`: integrate x402 signer custody with generic credential ref and packet.
- `custody-060`: apply auth.md parity for lifecycle/isolation/redaction.
- `custody-070`: add redacted custody projection.
- `custody-080`: update canonical docs and claim guards after source/tests.
- `custody-090`: run closeout gates and record evidence.

Do not start adapter implementation before packet schema and binding semantics are stable. Otherwise x402 and auth.md will grow adapter-specific custody stories and the protocol primitive will rot.

## Risks And Mitigations

- P0: packet theatre. A packet emitted only as projection text is advisory, not Handshake. Mitigation: policy and gateway must require packet id/digest for custody-backed paths.
- P0: stale custody admitted after greenlight. Mitigation: gateway re-reads current credential ref, posture, packet, isolation, resolver/lease/provider registry status, and policy drift immediately before mutation.
- P0: agent-exposed signer path remains reachable. Mitigation: required bypass probes and raw sibling posture must fail closed before `gateway_checked` posture can satisfy policy.
- P0: redacted projection leaks secrets. Mitigation: allowlisted projection fields, denylist/fuzz tests, and `redaction_failed` refusal/proof gap instead of best-effort serialization.
- P0: payment custody/regulatory drift. Mitigation: explicit non-goals plus claim guards.
- P1: packet overfits x402. Mitigation: provider-neutral fields only; x402 maps into the generic packet.
- P1: fixture laundering. Mitigation: `custodyClaimLevel` and claim guards distinguish `local_fixture` from customer/provider evidence.
- P1: provider registry or resolver drift is weakly detected. Mitigation: require digests/versions/lease fields for custody-backed paths; absent digest becomes proof gap or unsafe posture.
- P1: runtime/MCP proposal surfaces imply enforcement. Mitigation: runtime/MCP/CLI/SDK remain proposal/evidence/read surfaces only.
- P2: operational ceremony blocks adoption. Mitigation: activation helpers may sequence source-owned transitions later, but cannot move authority out of policy/gateway.
- P2: storage/projection blast radius hidden. Mitigation: Phase 0 source map verification before source edits.

## Validation Gates

Focused future gates:

```bash
npm run test -- test/protocol/credential-custody.test.ts test/protocol/kernel-policy-gateway.test.ts
npm run test -- test/protocol/evidence-projections.test.ts
npm run test -- test/adapters/x402-wallet-gateway.test.ts test/adapters/x402-bypass-probes.test.ts
npm run test -- test/conformance/x402-payment-conformance.test.ts
npm run test -- test/adapters/auth-md-gateway-pressure.test.ts test/adapters/auth-md-serialization-redaction.test.ts
npm run test -- test/architecture/claim-boundary.test.ts test/architecture/import-posture.test.ts test/architecture/root-exports.test.ts
npm run quality:claims
npm run quality:architecture
npm run format:check
npm run check:repo
```

Add new focused test files only if existing ownership cannot carry the cases, for example:

- `test/protocol/customer-owned-gateway-custody-proof.test.ts`
- `test/adapters/x402-install-proposal.test.ts`
- `test/adapters/x402-payment-action-proposal.test.ts`

Required behavioral evidence:

- missing custody packet refuses before greenlight for custody-backed paths.
- stale packet/ref/posture refuses before greenlight and at gateway time.
- packet drift after greenlight refuses before mutation and records no downstream success.
- agent-exposed signer refuses during install/proposal/posture/policy/gateway paths.
- raw sibling signer/payment path prevents `gateway_checked` posture from satisfying policy.
- gateway check sees the exact packet/ref/posture digest expected by policy.
- credential resolution evidence is recorded only after a passed gateway check.
- replay cannot reuse a greenlight for another credential resolution or mutation.
- redacted projection omits secret material and distinguishes gateway check, credential resolution, mutation/downstream outcome, refusal, and proof gap.
- fixture custody cannot project or document as live customer/provider custody.

## Cut Lines

Cut from this slice:

- Handshake-held payment custody, signer custody, balances, settlement, or payment management.
- provider-specific vault/KMS/wallet implementations before official source verification.
- live provider/customer custody claim from fixture keys.
- broad x402 compatibility, facilitator operation, seller middleware, marketplace, certification, clearing-house readiness, or settlement finality.
- aggregate x402 spend-window enforcement until a real ledger exists.
- broad runtime/MCP/browser/shell/network/package-manager/database/cloud interception.
- all-role SDK, CLI, MCP, or runtime mutation commands.
- raw custody record reads as buyer proof.
- dashboard/review UX unless it renders exact packet refs and cannot authorize anything.

Antipatterns:

- `custodyProof: true` without packet digest and policy/gateway enforcement.
- wallet gateway profile metadata treated as customer-owned custody proof.
- rendered review screen that says "gateway owned" without exact packet/contract/greenlight/gateway binding. This is review theatre.
- receipt that cannot distinguish gateway check from credential resolution and downstream result. This is evidence theatre.
- recording signer use before gateway check.
- one greenlight per workflow. This is ambient authority wearing a badge.
- fixture custody described as provider/customer custody.
- regex-only redaction for live provider custody.
- docs claiming live custody before packet, negative tests, and redacted projections exist.

## Rollback / Stop Conditions

Stop implementation if:

- packet id/digest is not consumed by both policy and gateway checks for custody-backed paths.
- gateway cannot refuse before signer/credential use.
- implementation requires one greenlight to authorize multiple credential resolutions or mutations.
- fixture/local signer custody is the only evidence behind a customer/provider custody claim.
- redaction tests find raw signer, token, payment payload, secret path, bearer credential, mutation credential, or PII in projections.
- provider-specific vault/KMS/wallet behavior is required but official docs have not been verified.
- runtime/MCP/SDK convenience code starts issuing policy decisions, greenlights, gateway checks, receipts, mutation attempts, or credential-resolution records.
- aggregate spend, settlement, facilitator, seller middleware, balance, or payment-management language appears.
- public aggregation, object registry, storage, or projection schema ownership is unclear after Phase 0.

Rollback should quarantine or remove the new packet/projection/claim surface while preserving existing `GatewayCredentialRef`, `CredentialResolutionEvidence`, `ProtectedPathPosture`, policy, gateway, and projection behavior. Partial schema without enforcement must be labeled advisory or removed. Do not leave a decorative packet in source.

## Smallest Next Action

Inspect Phase 0 companion files, then add the first failing tests in `test/protocol/credential-custody.test.ts` and `test/protocol/kernel-policy-gateway.test.ts` for:

1. `GatewayCustodyProofPacket` schema redaction and deterministic digest binding.
2. packet binding to `GatewayCredentialRef`, `ProtectedPathPosture`, and bypass probe digests.
3. policy refusal when an otherwise valid custody-backed action lacks the packet binding.

Do not touch x402 until those failures prove the protocol shape.
