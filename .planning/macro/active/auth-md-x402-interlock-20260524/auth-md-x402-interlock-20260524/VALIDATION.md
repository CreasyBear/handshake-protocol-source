# Validation

## Gate 0: Packet Contract Fails First

Purpose: define `auth_md_x402_interlock_packet.v0` before implementation.

Required proof:

- Packet creation creates no policy decision, greenlight, gateway check,
  mutation, receipt export, terminal certificate, credential resolution, signer
  invocation, payment payload, or payment signature.
- Authority flags are false for auth.md registration, x402 challenge, runtime,
  MCP, CLI, and packet rendering.
- Packet includes non-claims, blocked checks, proof gaps, replay posture, and
  redaction manifest.

Suggested check:

```bash
npm run test -- test/product/auth-md-x402-interlock-packet.test.ts
```

Blocked until the test file and packet fixture exist.

## Gate 1: Focused auth.md Baseline

Required proof:

- Discovery, ID-JAG verification, registration, claim, scope, and revocation
  create no authority by themselves.
- Credential material is gateway-custody only.
- `CredentialResolutionEvidence` is post-gateway-check evidence only.
- Revocation, expiry, downstream `401`, claim hazard, and isolation block
  policy and gateway.

Suggested check:

```bash
npm run test -- test/adapters/auth-md-serialization-redaction.test.ts test/adapters/auth-md-gateway.test.ts test/adapters/auth-md-revocation.test.ts test/adapters/auth-md-bypass-probes.test.ts test/runtime/auth-md-candidate-compilation.test.ts test/integration/auth-md-protected-call.test.ts test/integration/auth-md-receipt-reconstruction.test.ts test/protocol/credential-custody.test.ts test/protocol/evidence-projections.test.ts
```

## Gate 2: Focused x402 Baseline

Required proof:

- `PAYMENT-REQUIRED` is proposal evidence only.
- Amount and payment requirement are exact per-call bounds.
- Signer invocation count is zero before `VerifiedGatewayCheck`.
- Replay refusal happens before signer reuse.
- Payment payload/signature/private key/signer material are absent from read
  surfaces.

Suggested check:

```bash
npm run test -- test/adapters/x402-payment-action-proposal.test.ts test/adapters/x402-wallet-gateway.test.ts test/adapters/x402-bypass-probes.test.ts test/runtime/runtime-ingress.test.ts test/integration/x402-d1-http.test.ts test/product/x402-protected-spend-demo-report.test.ts
```

## Gate 3: Conformance And MCP Boundary

Required proof:

- MCP remains proposal/evidence/read only.
- Reference transcripts do not emit authority or raw material.
- x402 conformance remains local/reference exact per-call, not broad provider
  support.

Suggested check:

```bash
npm run test -- test/conformance/x402-upstream-exact-fixtures.test.ts test/conformance/x402-payment-conformance.test.ts test/conformance/protected-mutation-adapter-conformance.test.ts test/mcp/mcp-x402-proposal.test.ts test/mcp/mcp-reference-transcript.test.ts test/mcp/mcp-stdio-process.test.ts
```

## Gate 4: Metadata, Audience, And Drift

Required proof:

- PRM resource, AS metadata resource, ID-JAG audience, credential-ref audience,
  x402 endpoint/request target, and contract target match by deterministic
  canonical rule or refuse/proof-gap.
- Stale auth metadata, stale x402 challenge, changed selected requirement,
  changed payee/network/asset/amount, changed method/path/body/header, and
  gateway registry drift refuse before policy or gateway.

Suggested check:

```bash
npm run test -- test/runtime/auth-md-candidate-compilation.test.ts test/adapters/auth-md-gateway.test.ts test/adapters/x402-payment-action-proposal.test.ts test/adapters/x402-wallet-gateway.test.ts
```

## Gate 5: Revocation, Isolation, Replay

Required proof:

- logout JWT, revocation, expiry, downstream `401`, anonymous claim upgrade,
  signer drift, credential-ref drift, and ambiguous lifecycle evidence update
  isolation, quarantine, refusal, or proof-gap posture.
- Policy and gateway re-read current posture.
- Unconsumed greenlights cannot pass after isolation or revocation.
- One greenlight cannot resolve credentials or invoke signing twice.

Suggested check:

```bash
npm run test -- test/adapters/auth-md-revocation.test.ts test/protocol/isolation.test.ts test/integration/auth-md-protected-call.test.ts test/integration/auth-md-receipt-reconstruction.test.ts test/adapters/x402-wallet-gateway.test.ts test/integration/x402-d1-http.test.ts test/runtime/runtime-ingress.test.ts
```

## Gate 6: Redaction Across Read Surfaces

Required proof:

- Serialized runtime, MCP, CLI, SDK, review, report, receipt, support, packet,
  demo, and terminal outputs exclude raw credential, claim, OTP, bearer, JWT,
  private key, signer ref, `PaymentPayload`, `PAYMENT-SIGNATURE`, provider
  secret, vault path, raw request body, and full PII by default.

Suggested check:

```bash
npm run test -- test/adapters/auth-md-serialization-redaction.test.ts test/adapters/x402-wallet-gateway.test.ts test/mcp/mcp-resource-redaction.test.ts test/mcp/mcp-stdio-process.test.ts test/protocol/evidence-projections.test.ts
```

## Gate 7: Bypass Posture

Required proof:

- Raw bearer passthrough, direct HTTP, direct MCP payment, browser fetch, raw
  sibling tool, direct signer use, token replay, stale metadata use, wrapper
  drift, and failure-open posture are refused, detected, or proof-gapped with
  exact labels.
- No output claims prevention where only detection or unknown posture exists.

Suggested check:

```bash
npm run test -- test/adapters/auth-md-bypass-probes.test.ts test/adapters/x402-bypass-probes.test.ts test/runtime/runtime-ingress.test.ts test/architecture/surface-boundary-posture.test.ts
```

## Gate 8: Claim And Architecture Boundary

Required proof:

- Docs, packets, demos, reports, CLI output, MCP output, package metadata, and
  final synthesis do not claim agent auth, OAuth hosting, WorkOS endorsement,
  x402 provider/facilitator/seller operation, settlement, provider custody,
  customer custody, marketplace/certification, cross-org trust, broad runtime
  containment, aggregate spend enforcement, or downstream business success.

Suggested check:

```bash
npm run quality:claims
npm run quality:architecture
npm run quality:storage
npm run format:check
npm run check:repo
```

## Demo Gate

Current source-owned demo remains:

```bash
npm run demo:aps
```

Do not document a new interlock demo or verification command as current
capability until source-owned code exists.

## End Conditions

This macro path is ready to close only when:

- the packet test exists and passes;
- focused auth.md and x402 gates pass;
- redaction, replay, isolation, bypass, claim, and architecture gates pass;
- packet output names non-claims and blocked checks;
- no final artifact treats upstream evidence, review, CLI, MCP, or packet
  rendering as authority.

## Blocked Checks

- Live WorkOS/auth.md verification, endorsement, provider custody, production
  service operation, and live revocation distribution.
- Live x402 settlement, facilitator operation, seller middleware, provider
  custody, broad compatibility, and aggregate spend control.
- Customer gateway/vault custody, rotation, leases, and provider-specific
  secret verification.
- Hosted verifier, remote JWKS trust, cross-org trust, compliance audit,
  marketplace, certification, package publication, and MCP registry acceptance.
- Broad runtime/browser/shell/network/package-manager containment.
- Composite paid authenticated execution profile.
