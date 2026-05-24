# Validation

## Closure Rule

A concern is not closed unless it has:

- a source-owned mechanism;
- a focused regression test or conformance test;
- a claim, architecture, storage, package, or full-repo gate that would catch future drift;
- no expansion of Tier 1 primitive meaning;
- no authority moved into runtime, MCP, CLI, demos, or review output.

## Phase Gates

### Phase 1: Runtime Posture

```bash
npm run test -- test/runtime/runtime-ingress.test.ts test/adapters/x402-payment-action-proposal.test.ts
npm run check:types
```

Proof obligations:

- Runtime forwards `intendedRequestBodyPosture`, `intendedRequestBodyDigest`, `providerEnvironmentPosture`, and `providerEnvironmentRef`.
- Unsupported/omitted body and external/live/unknown provider posture refuse before action-contract proposal.
- Accepted local-reference/digest-bound posture appears in candidate parameters and idempotency material.
- Refused cases create no policy decision, greenlight, gateway check, mutation attempt, receipt, receipt export, or authority certificate.

### Phase 2: MCP Posture

```bash
npm run test -- test/mcp/mcp-schema-contract.test.ts test/mcp/mcp-x402-proposal.test.ts test/mcp/mcp-reference-transcript.test.ts test/mcp/mcp-stdio-process.test.ts test/architecture/mcp-surface-posture.test.ts
npm run check:types
```

Proof obligations:

- MCP schema requires explicit request-body and provider-environment posture.
- MCP refuses or schema-fails omitted, unsupported, external, live, and unknown posture before runtime-client proposal.
- Accepted MCP proposals bind posture fields into parameters, non-secret summary, tool-call draft, compile-intent input, and idempotency digest.
- MCP outputs remain non-authority and leak no `PaymentPayload`, `PAYMENT-SIGNATURE`, signer, credential, receipt export, gateway, mutation, or certificate material.

### Phase 3: Sandbox Boundary

```bash
npm run test -- test/adapters/x402-wallet-gateway.test.ts test/integration/x402-d1-http.test.ts test/protocol/evidence-projections.test.ts test/product/x402-protected-spend-demo-report.test.ts
npm run demo:aps
```

Proof obligations:

- Challenge and signed-retry evidence carry local/reference fixture scope and `authorityCreated: false`.
- Signed retry is post-gate downstream observation only.
- Missing signature evidence, wrong signature header, non-reference provider posture, ambiguous body posture, and replay do not create another signed retry.
- Projections and demo output do not claim settlement finality, facilitator operation, seller middleware, provider custody, or authority.

### Phase 4: Runtime Registry

```bash
npm run test -- test/runtime/runtime-ingress.test.ts test/runtime/auth-md-candidate-compilation.test.ts test/runtime/package-install-runtime.test.ts test/protocol/generated-execution-graph.test.ts
npm run quality:architecture
```

Proof obligations:

- Every dispatch kind has exactly one family adapter.
- Missing config fails closed.
- Existing package install, auth.md, and x402 runtime outputs remain behaviorally equivalent except for the intended posture fix.
- Registry code cannot import or issue authority-bearing transitions.

### Phase 5: Future-Surface Guards

```bash
npm run test -- test/conformance/x402-payment-conformance.test.ts test/conformance/x402-upstream-exact-fixtures.test.ts test/adapters/x402-install-proposal.test.ts test/adapters/x402-bypass-probes.test.ts test/architecture/claim-boundary.test.ts
npm run quality:claims
```

Proof obligations:

- Unsupported x402 surfaces stay explicit future cuts.
- Spend session/day/review controls remain `not_enforced_local_metadata`.
- Fixture custody and scoped bypass evidence cannot be serialized as live custody or host-wide interception.
- README/docs/examples fail claims if they imply hosted, provider, broad host, aggregate spend, seller/facilitator, or settlement proof.

### Phase 6: Projection Scale And Redaction

```bash
npm run test -- test/protocol/evidence-projections.test.ts test/http/d1-http.test.ts test/protocol/protocol-store-atomicity-contract.test.ts
npm run quality:storage
```

Proof obligations:

- Contract/action/run-scoped store reads and range reads preserve memory/D1 parity.
- Projection assembly does not rely on broad scans when making scale claims.
- Provider-format fuzz cases do not project raw signer refs, `PaymentPayload`, `PAYMENT-SIGNATURE`, bearer tokens, vault paths, secret refs, facilitator secrets, or auth.md credential material.

### Phase 7: Package And Closeout

```bash
npm run demo:mcp-transcript
npm run quality:claims
npm run quality:architecture
npm run pack:check
npm run check:repo
```

Proof obligations:

- Package smoke uses the final MCP posture schema.
- `dist` and bin behavior match source after build.
- `.planning/`, tests, workspace junk, raw credentials, and scratch docs are excluded from package artifacts.
- Full repo check passes on the intended closeout worktree.

## Commands Not Sufficient Alone

- `npm run test` without focused posture cases does not prove runtime/MCP x402 parity.
- `npm run demo:aps` does not prove settlement, provider custody, hosted operation, or host interception.
- `npm run pack:check` does not prove publication.
- `npm run quality:claims` does not close a source concern without source tests.

## Blocked / Future Checks

- Live provider/customer custody checks are blocked until provider/vault custody code exists.
- Aggregate spend ledger checks are blocked until reservation ledger code exists.
- Hosted verifier, JWKS, revocation, and cross-org trust checks are blocked until hosted verifier code exists.
- Host-wide interception checks are blocked until a concrete host harness exists.
- Seller/facilitator/settlement checks are blocked until those adapters exist.
- Actual npm/MCP Registry publication checks are blocked on owner-held external credentials.

## Closeout Result: 2026-05-24

Executed end-to-end against `macro-001` through `macro-019`.

Closed source-owned concerns:

- Runtime x402 posture is explicit in proposal input, candidate parameters, refusal evidence, and idempotency material.
- MCP x402 posture is explicit in schema, reference transcript, idempotency material, and package-entrypoint smoke input.
- Local/reference x402 sandbox retry evidence is labeled downstream fixture evidence only, with no authority, custody, settlement, seller, or facilitator claim.
- Runtime ingress family coverage is behind a proposal-only registry and guarded against authority imports.
- Unsupported x402 surfaces remain explicit future cuts, including settlement finality.
- Evidence projection assembly now uses contract-scoped reads plus store range reads instead of broad tenant/org scans.
- Memory and D1 stores preserve scoped-read and range-read parity, with D1 action-contract side refs and indexes.
- Projection redaction covers raw signer refs, `PaymentPayload`, `PAYMENT-SIGNATURE`, bearer tokens, vault/Infisical/1Password paths, secret refs, facilitator secrets, and auth.md credential-looking refs.
- Package and architecture gates exclude `.planning/`, tests, workspace junk, raw credential material, `PaymentPayload`, and `PAYMENT-SIGNATURE` from published surfaces.

Closeout commands run:

```bash
npm run test -- test/runtime/runtime-ingress.test.ts test/adapters/x402-payment-action-proposal.test.ts
npm run test -- test/mcp/mcp-schema-contract.test.ts test/mcp/mcp-x402-proposal.test.ts test/architecture/mcp-surface-posture.test.ts test/mcp/mcp-reference-transcript.test.ts test/mcp/mcp-stdio-process.test.ts
npm run test -- test/adapters/x402-wallet-gateway.test.ts test/integration/x402-d1-http.test.ts test/protocol/evidence-projections.test.ts test/product/x402-protected-spend-demo-report.test.ts test/architecture/claim-boundary.test.ts
npm run test -- test/runtime/runtime-ingress.test.ts test/runtime/auth-md-candidate-compilation.test.ts test/runtime/package-install-runtime.test.ts test/protocol/generated-execution-graph.test.ts test/architecture/import-posture.test.ts
npm run test -- test/conformance/x402-payment-conformance.test.ts test/conformance/x402-upstream-exact-fixtures.test.ts test/adapters/x402-install-proposal.test.ts test/adapters/x402-bypass-probes.test.ts test/architecture/claim-boundary.test.ts
npm run test -- test/protocol/evidence-projections.test.ts test/http/d1-http.test.ts test/protocol/protocol-store-atomicity-contract.test.ts
npm run demo:aps
npm run demo:mcp-transcript
npm run quality:storage
npm run quality:claims
npm run quality:architecture
npm run pack:check
npm run check:repo
```

Final closeout gate:

- `npm run check:repo` passed with `471 pass, 0 fail`, package build/surface smoke green, and `git diff --check` green.

Still future, not claimed:

- live provider/customer custody;
- aggregate spend-window enforcement;
- hosted verifier/JWKS/revocation/cross-org trust;
- host-wide interception;
- seller middleware, facilitator operation, settlement finality;
- actual npm or MCP Registry publication.
