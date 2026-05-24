# Validation

## Proof Obligations

- Customer/provider gateway custody is evidenced by source-owned packet refs/digests, not prose.
- The packet is required by policy and gateway checks for custody-backed protected paths.
- Exact contract, policy decision, greenlight, gateway check, credential resolution, mutation/refusal/proof-gap, and downstream reconciliation remain distinct.
- Redaction failure refuses or records proof gap; it never serializes raw custody material.
- Fixture custody cannot satisfy provider/customer custody claims.
- Provider-specific custody details are blocked until official source verification.

## Focused Tests

### Protocol

- `test/protocol/credential-custody.test.ts`
  - packet schema rejects raw private keys, bearer tokens, `PaymentPayload`, `PAYMENT-SIGNATURE`, provider secret paths, raw signer refs, mutation credentials, payment payloads, and access-token-looking fields.
  - packet digest changes with credential ref digest, protected-path posture digest, bypass probe digests, provider registry digest, resolver version, lease/version, attestation digest, redacted audit digest, drift status, redaction status, and expiry.
  - packet cannot bind mismatched tenant/org/gateway/action/resource scope.
  - fixture custody projects as `local_fixture` and cannot satisfy customer/provider claim level.

- `test/protocol/kernel-policy-gateway.test.ts`
  - policy refuses missing packet, digest mismatch, stale packet, stale credential ref, provider drift, resolver drift, unsafe custody, weak source authority, failed probe, raw sibling present, active isolation, and redaction failure.
  - gateway refuses the same conditions after greenlight and before mutation.
  - replay cannot reuse a greenlight for another credential resolution or mutation.
  - gateway evidence records packet refs/digests seen or proves posture digest includes packet digest and drift state.

- `test/protocol/evidence-projections.test.ts`
  - custody projection includes refs/digests/status/reason codes only.
  - projection distinguishes gateway check, credential resolution, mutation attempt, downstream reconciliation, refusal, and proof gap.
  - projection omits secret paths, signer material, raw key handles, `PaymentPayload`, `PAYMENT-SIGNATURE`, bearer tokens, payment payloads, mutation credentials, authorization headers, claim tokens, JWTs, PII, and provider secret coordinates.

### x402

- `test/adapters/x402-wallet-gateway.test.ts`
  - signer call count is zero on missing/stale/drifted/unsafe packet, raw sibling posture, replay, params mismatch, policy drift, or failed gateway check.
  - signer use occurs only after `VerifiedGatewayCheck`.
  - redacted credential resolution evidence is recorded after a passed gate and bound to exact contract, greenlight, gateway check, credential ref, and packet.

- `test/adapters/x402-bypass-probes.test.ts`
  - direct signer SDK, raw payment signature header, paid fetch/axios, MCP direct payment, token passthrough, wrapper drift, and failure-open posture fail closed.

- `test/conformance/x402-payment-conformance.test.ts`
  - x402 remains one buyer-side exact protected action per call.
  - no balance, settlement, facilitator, seller middleware, broad compatibility, or payment-management claim is introduced.

Add `test/adapters/x402-install-proposal.test.ts` and `test/adapters/x402-payment-action-proposal.test.ts` if existing test ownership cannot cover install/proposal binding.

### auth.md

- `test/adapters/auth-md-gateway-pressure.test.ts`
  - revocation, metadata drift, stale credential ref, scope drift, resolver failure, raw bearer passthrough, token replay, direct HTTP/browser/network/MCP path, and unsafe retry refuse before downstream service call.

- `test/adapters/auth-md-serialization-redaction.test.ts`
  - auth-derived custody evidence never exposes bearer material, claims, tokens, raw credentials, or secret paths.

### Architecture And Claims

- `test/architecture/claim-boundary.test.ts`
  - provider/customer custody claims fail when sourced from fixture keys.
  - Handshake-held wallet/payment credential/balance/settlement/payment-management language fails.
  - x402-as-protocol, broad compatibility, seller/facilitator, marketplace, certification, clearing-house, hosted trust, and broad runtime-control claims fail.

- `test/architecture/import-posture.test.ts`
  - runtime/MCP/CLI/SDK/projection surfaces cannot import or issue policy, greenlight, gateway check, receipt, credential resolution, signer, wallet, or raw custody internals.

- `test/architecture/root-exports.test.ts`
  - root exports do not expose secret resolution, signer, wallet, raw custody internals, or provider-specific secret coordinates.

## Closeout Commands

Focused:

```bash
npm run test -- test/protocol/credential-custody.test.ts test/protocol/kernel-policy-gateway.test.ts
npm run test -- test/protocol/evidence-projections.test.ts
npm run test -- test/adapters/x402-wallet-gateway.test.ts test/adapters/x402-bypass-probes.test.ts
npm run test -- test/conformance/x402-payment-conformance.test.ts
npm run test -- test/adapters/auth-md-gateway-pressure.test.ts test/adapters/auth-md-serialization-redaction.test.ts
npm run test -- test/architecture/claim-boundary.test.ts test/architecture/import-posture.test.ts test/architecture/root-exports.test.ts
npm run quality:claims
npm run quality:architecture
```

Full:

```bash
npm run check:types
npm run lint
npm run format:check
npm run test
npm run pack:check
git diff --check
npm run check:repo
```

## End Criteria

- Packet schema, canonicalization, transition, policy binding, gateway binding, x402 integration, auth.md parity, and projection tests pass.
- x402 signer cannot execute unless a valid packet/ref/posture/greenlight/gateway check chain exists.
- Credential resolution evidence is post-gate only.
- Redacted projection is reconstructable by digest and contains no secret-bearing material.
- Claim guards prevent overclaiming fixture custody, provider custody, payment custody, hosted trust, broad x402 compatibility, marketplace/certification, clearing-house readiness, or broad runtime control.
- Provider-specific details remain marked as requiring official source verification unless that verification has been performed in a later pass.
