# ARCH First-Pass Plan: Customer-Owned Gateway Custody Proof

## Invariant at stake

A protected path is real only when the mutation credential lives behind a customer or provider gateway, the exact one-use greenlight is checked immediately before consequence, stale or unsafe custody refuses before mutation, and the surviving evidence is redacted but reconstructable.

If this work only adds a report, install label, fixture signer posture, or projection text, this is advisory, not Handshake.

## Architecture implications

The current source already has the authority spine needed for this slice:

- `GatewayCredentialRef` is provider-neutral, opaque, digest-bound, scoped to tenant/org/gateway/action/resource, and rejects raw credential-looking material.
- `CredentialResolutionEvidence` is post-gate evidence only. It binds exact `ActionContract`, `Greenlight`, `GatewayCheckAttempt`, optional `MutationAttempt`, credential ref digest, resolver metadata, request digest, redaction status, and result class.
- `ProtectedPathPosture` is current-state evidence for runtime/gateway/action/resource. It already carries posture state, credential custody status, raw sibling status, bypass probe IDs/digests, source authority, expiry, and a posture digest.
- Policy evaluation and gateway check both re-read current protected-path posture and gateway credential bindings before greenlighting or admitting mutation.
- Gateway check records the contract digest, greenlight digest, params digest, protected-path posture seen, drift status, refusal/proof-gap/admission, and one-use greenlight consumption.
- Evidence projections already expose redacted contract evidence, agent transaction envelopes, credential refs/resolution evidence refs, receipt timelines, idempotency recovery, and protected-path install health.

The missing architecture object is not another permission path. The gap is a source-owned custody proof packet that turns "gateway owns or controls the mutation credential" from a field assertion into digest-bound install evidence that can be:

```text
gateway install evidence
-> credential ref binding
-> protected-path posture
-> custody/bypass probe packet
-> exact contract / policy input / greenlight / gateway check
-> redacted custody projection
```

Without that packet, `GatewayCredentialRef.custodyStatus`, gateway registry custody status, and `ProtectedPathPosture.credentialCustodyStatus` are still too easy to treat as caller-reported posture. The current tests already reject weak posture source authority and fixture-only x402 custody, but there is no first-class custody packet digest tying install evidence, credential ref, posture, probes, resolver version, and redacted audit refs together.

## Extend vs new primitive recommendation

Add a new custody proof packet record inside the existing credential-custody/protected-path authority spine. Do not create a parallel authority primitive.

Recommended shape:

- Add a `GatewayCustodyProofPacket` or `CustomerGatewayCustodyProofPacket` schema and transition under `src/protocol/areas/credential-custody/`.
- Bind that packet into `GatewayCredentialRef` and `ProtectedPathPosture` by ID and digest.
- Include the packet digest in policy input and gateway-time revalidation through the existing protected-path posture and credential-ref checks.
- Extend redacted evidence projections to expose custody proof refs/digests/status, never raw provider paths or signer material.
- Keep `CredentialResolutionEvidence` post-gate. It must not become pre-gate install proof.

Why not only extend existing fields:

- Overloading `GatewayCredentialRef.evidenceExpectationRefs` leaves custody proof as loose refs with no typed drift semantics.
- Overloading `ProtectedPathPosture.evidenceRefs` lets a posture claim look current without proving which gateway install and credential ref it depended on.
- Overloading bypass probes alone proves hostile-path posture, not the customer-owned custody chain from gateway install to credential ref to resolver/version to redacted audit refs.

Why not add a new top-level authority primitive:

- The protocol primitive is still one exact contract, one policy decision, one-use greenlight, gateway check, receipt/refusal/proof gap.
- Custody proof is evidence that a required protected path may be considered gateway-owned. It does not authorize mutation.
- Any new "custody approval", "custody greenlight", "wallet authorization", or "provider trust decision" would create a second permission plane.

Brutal verdict: add a new proof packet record, but keep it subordinate to `GatewayCredentialRef`, `ProtectedPathPosture`, policy evaluation, and gateway check.

## Proposed custody proof packet boundary

The packet should be provider-neutral and redaction-first.

Candidate fields:

- `custodyProofPacketId`
- `custodyProofPacketDigest`
- `gatewayInstallEvidenceRef`
- `gatewayInstallEvidenceDigest`
- `gatewayCredentialRefId`
- `gatewayCredentialRefDigest`
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
- `resolverRef`
- `resolverVersion`
- `leaseRef`
- `leaseVersion`
- `leaseIssuedAt`
- `leaseExpiresAt`
- `attestationRefs`
- `attestationDigests`
- `redactedAuditRefs`
- `redactedAuditDigest`
- `driftStatus`: `current | stale | provider_drift | resolver_drift | unsafe_custody | proof_gap`
- `bypassProbeIds`
- `bypassProbeDigests`
- `redactionProfileRef`
- `secretMaterialIncluded: false`
- `recordedAt`
- `expiresAt`

The packet must reject raw credential material and provider secret paths in the same spirit as `GatewayCredentialRefSchema` and auth.md/x402 projection redaction. For live providers, use opaque handles and digests, not `vault://team/prod/secret`, private key refs, `PAYMENT-SIGNATURE`, `PaymentPayload`, bearer tokens, API keys, raw signer refs, or path-like secret coordinates.

## Data and control flow

### Install and proof recording

```text
adapter install proposal
-> gateway registry entry
-> gateway credential ref
-> custody proof packet
-> bypass probes
-> protected-path posture
```

The install path should compile or record the credential ref and proof packet before any `gateway_checked` posture can be accepted. For x402, this means the wallet/signer boundary becomes a gateway credential ref plus custody proof packet, not only `walletGatewayProfile.signerRef` on the gateway registry entry.

For auth.md, the existing pattern is the model to copy: raw credential intake is adapter-local, registration/revocation evidence is redacted and digest-bound, and the protocol sees an opaque `GatewayCredentialRef`.

### Policy

Policy already includes:

- protected-path posture input;
- gateway credential binding input;
- isolation state;
- sequence dependency state;
- idempotency state.

The plan should extend policy input so custody proof is included through:

- `GatewayCredentialRef` proof packet refs/digests; and/or
- `ProtectedPathPosture` proof packet refs/digests.

Policy must refuse before greenlight when:

- custody proof packet is missing;
- packet digest does not match the credential ref or posture binding;
- packet is stale or expired;
- packet drift status is unsafe;
- packet source authority is weak or fixture-only when a live/customer-owned claim is being made;
- redaction status is failed;
- credential ref is stale, provider-drifted, scope-mismatched, or isolated.

### Gateway check

Gateway check should keep its current role: exact final admission before mutation.

The gateway check should re-read current custody packet state indirectly through current protected-path posture and credential binding, or directly if the implementation adds custody-proof lookup. It must refuse before mutation when the proof packet seen at policy time no longer matches current gateway custody state.

The resulting `GatewayCheckAttempt` should either:

- add `custodyProofPacketIdSeen`, `custodyProofPacketDigestSeen`, and `custodyProofDriftStatusSeen`; or
- keep the gateway record unchanged only if `protectedPathPostureDigestSeen` deterministically includes the custody proof packet digest and tests prove that drift changes the posture digest.

The first option is more auditable. The second is smaller but risks hiding the custody proof inside a posture digest.

### Resolution and mutation

Credential resolution remains after a passed gateway check. The packet proves custody posture before authority; `CredentialResolutionEvidence` proves gateway-side credential resolution/use after authority admission.

For x402:

```text
verified gateway check
-> gateway-held signing surface creates PaymentPayload / PAYMENT-SIGNATURE evidence
-> redacted signature/payload digests recorded as evidence refs
-> downstream sandbox/provider response becomes reconciliation or proof gap
```

Do not add Handshake-held wallets, balances, signer APIs, payment settlement state, facilitator operation, seller middleware, or aggregate spend state.

### Projection

Evidence projection should add a redacted custody projection rather than raw proof packet browsing.

Candidate projection fields:

- `custodyProofPacketRef`
- `custodyProofPacketDigest`
- `gatewayCredentialRef`
- `gatewayCredentialRefDigest`
- `gatewayId`
- `protectedSurfaceKind`
- `actionClasses`
- `resourceRefs`
- `custodyProviderClass`
- `custodyProviderRegistryDigest`
- `opaqueKeyHandleDigest`
- `resolverRef`
- `resolverVersion`
- `leaseVersion`
- `attestationDigests`
- `redactedAuditDigest`
- `driftStatus`
- `expiresAt`
- `redactionProfileRef`
- `omittedFields`

This projection should be available to contract/agent transaction/install-health evidence without exposing secret paths, signer material, payment payloads, bearer tokens, mutation credentials, provider secret URIs, or raw audit payloads.

## Boundaries that must not move

- `src/protocol/areas/*` owns protocol meaning. Adapters can produce evidence and execute after `VerifiedGatewayCheck`; they must not define custody proof semantics alone.
- `src/runtime`, `src/mcp`, `src/cli`, and SDK role clients remain proposal/evidence/read surfaces. They must not record custody proof, resolve credentials, issue policy decisions, mint greenlights, run gateway checks, export receipts, or mutate.
- Gateway check remains the enforcement boundary before consequence. Custody proof cannot replace the exact contract or one-use greenlight.
- `GatewayCredentialRef` stays opaque and non-secret. No protocol API should retrieve secrets or expose provider secret paths.
- `CredentialResolutionEvidence` stays post-gate. It must not become permission or install proof.
- `ProtectedPathPosture` stays current and probe-backed. A caller-reported or fixture posture cannot satisfy customer-owned custody.
- x402 remains one buyer-side `x402_payment.exact` per-call protected action pack. It must not become payment management, wallet custody, balance tracking, facilitator operation, seller middleware, settlement, or broad x402 compatibility.
- auth.md learnings apply to credential refs, lifecycle isolation, redaction, and revocation evidence. They must not turn Handshake into an auth provider.
- `.planning/` remains scratch. Any durable doctrine belongs in compact canonical docs only after implementation proves it.

## Likely source paths

Protocol:

- `src/protocol/areas/credential-custody/schemas.ts`
- `src/protocol/areas/credential-custody/inputs.ts`
- `src/protocol/areas/credential-custody/transitions.ts`
- `src/protocol/areas/credential-custody/custody-posture.ts`
- `src/protocol/areas/protected-path-posture/schemas.ts`
- `src/protocol/areas/protected-path-posture/inputs.ts`
- `src/protocol/areas/protected-path-posture/transitions.ts`
- `src/protocol/areas/policy-greenlight/transitions.ts`
- `src/protocol/areas/gateway-gate/schemas.ts`
- `src/protocol/areas/gateway-gate/artifacts.ts`
- `src/protocol/areas/gateway-gate/transitions.ts`
- `src/protocol/evidence-projections/projections.ts`
- `src/protocol/evidence-projections/assembly.ts`

Adapter and probe surfaces:

- `src/adapters/x402-payment/install-proposal.ts`
- `src/adapters/x402-payment/wallet-gateway.ts`
- `src/adapters/x402-payment/bypass-probes.ts`
- `src/adapters/x402-payment/conformance.ts`
- `src/adapters/auth-md/profiles.ts`
- `src/adapters/auth-md/gateway.ts`
- `src/adapters/auth-md/revocation.ts`
- `src/adapters/auth-md/bypass-probes.ts`
- `src/adapters/protected-path-probes/index.ts`
- `src/adapters/protected-path-probes/executor.ts`

Likely additional implementation paths to verify before execution:

- `src/protocol/areas/object-registry/*`
- `src/protocol/public/inputs.ts`
- `src/protocol/public/schemas.ts`
- `src/protocol/kernel.ts`
- `src/protocol/store/port.ts`
- `src/storage/d1/*`
- `src/storage/memory/*`
- `src/http/routes/*`
- `src/http/handlers/evidence-read.ts`
- `src/sdk/surface-clients/evidence-client.ts`
- `src/mcp/resources.ts`
- `src/cli/projection-evidence.ts`

Docs:

- `README.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-definition.md`
- `docs/internal/protocol-kernel-architecture.md`
- `docs/internal/protocol-notes.md`
- `.planning/macro/DEFERRED-INTEGRATE-ELIMINATE.md`
- `.planning/macro/active/customer-owned-gateway-custody-proof/PLAN.md` after chair synthesis only

Tests:

- `test/protocol/credential-custody.test.ts`
- `test/protocol/evidence-projections.test.ts`
- `test/protocol/kernel-policy-gateway.test.ts`
- new or extended `test/protocol/customer-owned-gateway-custody-proof.test.ts`
- `test/adapters/x402-wallet-gateway.test.ts`
- `test/adapters/x402-bypass-probes.test.ts`
- `test/adapters/auth-md-gateway-pressure.test.ts`
- `test/adapters/auth-md-serialization-redaction.test.ts`
- `test/conformance/x402-payment-conformance.test.ts`
- `test/architecture/claim-boundary.test.ts`
- `test/architecture/import-posture.test.ts`
- `test/architecture/root-exports.test.ts`

## Compatibility and migration risks

- Adding required fields directly to `GatewayCredentialRef` or `ProtectedPathPosture` will break existing fixtures and stored records. Prefer additive nullable/default fields first, then tighten required status only for action contracts that require `gateway_checked` and custody proof.
- If custody proof affects `paramsDigest`, `policyInputDigest`, `postureDigest`, or contract digest, existing tests that assert exact duplicate/refusal behavior may need fixture updates. That is acceptable only if the digest change reflects real authority input.
- Existing x402 install proposals store signer posture on `walletGatewayProfile` and gateway registry metadata. Migrating x402 to protocol-level credential refs may require install compiler output changes beyond the allowed source packet.
- Current projection redaction is pattern-based with known gaps for unknown provider formats. Live provider custody claims need allowlisted projection fields and provider-format fuzz tests before they are credible.
- `CredentialResolutionEvidence` requires an existing passed gateway check. If implementation tries to use it for install custody, it will invert the state machine.
- Store/object registry/public aggregation paths were not in the allowed packet. A new protocol object type will likely require updates there before tests compile.
- D1 migration/index requirements are unknown from this packet. If custody proof needs first-class lookup by credential ref, gateway, tenant/org, or contract, storage indexes may be needed.
- Existing `sourceAuthorityCanSatisfyGatewayChecked` accepts `gateway_probe` and `hosted_monitor`. A custody proof packet must not backdoor `conformance_fixture` or `operator_attestation` into live customer-owned custody.
- x402 fixture tests currently distinguish `fixture_gateway_held` from real gateway-held posture. Preserve that distinction or claim guards will regress.

## Architecture validation gates

Protocol/schema gates:

- Custody proof packet schema rejects raw private keys, bearer tokens, API keys, `PaymentPayload`, `PAYMENT-SIGNATURE`, raw signer refs, secret URIs, and provider secret paths.
- Custody proof packet digest changes when gateway install evidence, credential ref digest, resolver version, lease/version, attestation digest, redacted audit digest, or drift status changes.
- `GatewayCredentialRef` binds to the custody proof packet by ID/digest or refuses when a required proof packet is missing.
- `ProtectedPathPosture` digest includes custody proof packet ID/digest and all required bypass probe digests.
- Policy refuses missing custody packet, stale packet, provider drift, resolver drift, unsafe custody status, weak source authority, and redaction failure before greenlight.
- Gateway check refuses when custody proof or protected-path posture drifts after greenlight and before mutation.

Adapter gates:

- x402 install refuses `agent_exposed` signer custody and fixture-only posture for customer-owned custody claims.
- x402 gateway never calls the signer on params mismatch, replay, stale custody proof, missing custody proof, unsafe custody proof, provider drift, or raw sibling posture.
- x402 official SDK PaymentPayload / `PAYMENT-SIGNATURE` evidence remains post-gate, redacted, and local/reference unless official provider/customer custody verification is added later.
- auth.md gateway continues to record credential resolution after passed gate only and quarantines credential refs on revocation/lifecycle drift.

Projection/redaction gates:

- Contract/evidence projections expose custody proof refs and digests, not raw proof payloads or secret coordinates.
- Agent transaction envelope distinguishes gateway check evidence, custody proof evidence, credential resolution evidence, mutation evidence, downstream reconciliation, refusal, and proof gap.
- Redaction failure produces refusal or proof gap; it never serializes raw custody material.

Architecture/claim gates:

- Claim guards reject live provider/customer custody claims from fixture keys.
- Claim guards keep x402 as per-call exact protected action, not payment management or provider custody.
- Import posture keeps custody proof protocol meaning out of adapters, runtime, MCP, CLI, SDK, and projections.
- Root exports do not expose secret resolution, signer, wallet, or raw custody internals.

Closeout command candidates:

- `npm run test -- test/protocol/credential-custody.test.ts test/protocol/kernel-policy-gateway.test.ts test/protocol/evidence-projections.test.ts`
- `npm run test -- test/adapters/x402-wallet-gateway.test.ts test/adapters/x402-bypass-probes.test.ts test/adapters/auth-md-gateway-pressure.test.ts test/adapters/auth-md-serialization-redaction.test.ts`
- `npm run test -- test/conformance/x402-payment-conformance.test.ts`
- `npm run test -- test/architecture/claim-boundary.test.ts test/architecture/import-posture.test.ts test/architecture/root-exports.test.ts`
- `npm run quality:claims`
- `npm run quality:architecture`
- `npm run check:repo`

## Assumptions

- Tier 1 protocol meaning remains stable: exact contract, policy decision, one-use greenlight, gateway check, receipt/refusal/proof gap.
- Customer-owned gateway custody is the enforcement model. Handshake does not hold wallets, signer credentials, balances, settlement state, or payment credentials.
- x402 is the first proof pack, not the protocol definition.
- Provider-neutral schema planning can proceed from repo source. Named vault/KMS/wallet/provider behavior requires official source verification before implementation.
- A custody proof packet can be added without requiring hosted operation.
- Existing object registry/store/public aggregation can accept a new object type, but this was not verified because those files were outside the packet.

## Dependencies

- Claim-boundary cleanup must land first or in parallel only if this plan keeps its non-claim language intact.
- The implementation needs a source-owned object-type route for custody proof packet records.
- Policy and gateway checks depend on current store lookup for credential refs, protected-path posture, isolation, and potentially custody proof packet records.
- x402 adapter changes depend on the install compiler being able to emit or sequence gateway credential refs and custody proof packets.
- Redacted projections depend on schema additions in evidence projection types not included in this packet.
- Provider-specific custody implementation depends on later official documentation/source verification for any named vault, KMS, wallet provider, x402 provider, JWKS, Cloudflare, or regulatory claim.

## Risks

- The proof packet becomes a decorative certificate. Mitigation: policy and gateway refuse when the packet is missing, stale, drifted, unsafe, or not bound to the exact credential ref/posture.
- The packet duplicates `GatewayCredentialRef` without adding enforcement. Mitigation: keep the credential ref as the opaque handle and make the packet prove install/custody/drift state for that handle.
- x402 signer fixture gets relabeled as customer-owned custody. Mitigation: claim guards and x402 bypass tests must distinguish `fixture_gateway_held` from customer/provider custody.
- Provider secret paths leak through "opaque" fields. Mitigation: safe-string schema, allowlisted projection fields, serialized redaction tests, and redaction-failure refusal/proof gap.
- Gateway check only records protected-path posture digest, hiding custody proof drift. Mitigation: either add custody proof seen fields to `GatewayCheckAttempt` or test that posture digest changes deterministically include proof packet drift.
- Runtime/MCP/CLI adoption pressure moves custody setup into model-facing surfaces. Mitigation: keep runtime/MCP/CLI as proposal/evidence/read only and enforce with import/surface tests.
- New schema required fields break older local demos before migration. Mitigation: additive fields first, then enforce only when `requiredProtectedPathState` is `gateway_checked` for custody-requiring action classes.
- External provider docs are inferred instead of verified. Mitigation: mark all named provider details as blocked until official verification.

## Cut lines

Cut from this slice:

- Handshake-held wallet, signer, token, bearer credential, payment credential, balance, settlement, or payment-management state.
- Aggregate x402 session/day/review spend enforcement.
- Facilitator operation, seller middleware, settlement finality, or broad x402 compatibility.
- Hosted operation, production RBAC, tenant audit/search, live JWKS, revocation service, marketplace, certification, or clearing-house claims.
- Broad MCP/browser/shell/network/package-manager interception.
- Provider-specific vault/KMS/wallet architecture before official source verification.
- Any runtime, MCP, CLI, SDK, or review-renderer authority path.
- Raw proof packet read APIs that expose internal custody payloads.

Split if the implementation needs:

- D1 migration and hosted evidence indexing beyond local proof storage.
- New provider SDK integration.
- New public package exports.
- A provider-specific gateway adapter.
- Hosted admission or verifier trust plane work.

## Blocked checks

- Did not read sibling raw outputs, normalized outputs, or the final `PLAN.md` for this run by instruction.
- Did not read files outside the immutable packet's allowed source list.
- Did not inspect `src/protocol/areas/object-registry/*`, `src/protocol/public/*`, `src/protocol/kernel.ts`, `src/protocol/store/port.ts`, `src/storage/*`, `src/http/*`, `package.json`, or migrations because they were not in the allowed packet. Those paths must be verified before implementation.
- Did not inspect `src/protocol/areas/action-contract/*` directly because it was not in the allowed packet. Contract binding recommendations are inferred from canonical docs, projection code, and policy/gateway transition use.
- Did not inspect projection schema definitions because only projection assembly/logic files were allowed. Projection field additions must verify schema owners before execution.
- Did not run tests. This was a planning-only first pass constrained to reading the packet and allowed source files.
- Did not browse official provider, vault, KMS, wallet, x402, Cloudflare, JWKS, npm, MCP Registry, legal, or payment-regulatory sources. Any named provider custody implementation must be officially verified later.

## Smallest next mechanism to build

Define the custody proof packet schema under `src/protocol/areas/credential-custody/`, add one failing protocol test that refuses policy greenlight when `requiredProtectedPathState: "gateway_checked"` has a credential ref and posture but no custody proof packet digest, then bind that digest into protected-path posture before touching x402.
