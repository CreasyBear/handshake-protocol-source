# Validation

## Existing Source-Present Checks

These checks exist in the repo today but were not run during this planning-only synthesis:

- `test/architecture/claim-boundary.test.ts` checks public entrypoint separation and several current runtime, MCP, conformance, and x402 non-claims.
- `test/product/x402-protected-spend-demo-report.test.ts` executes `examples/x402-protected-spend/run.ts` and checks local APS report boundaries, redaction, replay refusal, role clients, and non-claims.
- `test/architecture/import-posture.test.ts` and `test/architecture/root-exports.test.ts` guard package/lane import and export posture.

## Planned Guard Additions

### Category Boundary

Proof obligation:

- Canonical docs state protected actions for automated decision making.
- Canonical docs do not define Handshake as engineering-agent-only.
- Engineering-agent references are adoption context, generated-execution threat model, or current local proof context.

Candidate gate:

```bash
npm run test -- test/architecture/claim-boundary.test.ts
```

### x402 Wedge Boundary

Proof obligation:

- x402 is one official buyer-side `x402_payment.exact` per-call protected-action wedge.
- No adapter family defines the protocol.
- `x402_paid_http_call.exact` remains buyer-readable report language only.
- No broad x402 compatibility, `upto`, batch settlement, seller middleware, facilitator operation, or settlement finality claim.

Candidate gates:

```bash
npm run test -- test/architecture/claim-boundary.test.ts test/product/x402-protected-spend-demo-report.test.ts
npm run demo:aps
```

### Aggregate Payment-Budget Non-Remit

Proof obligation:

- Product-scope `spend reservation ledger required before claim` language is removed.
- Aggregate payment-budget management is intentionally out of current remit.
- `not_enforced_local_metadata` appears only as local metadata, not disabled enforcement or a roadmap promise.

Candidate gate:

```bash
npm run test -- test/product/x402-protected-spend-demo-report.test.ts
```

### Surface Non-Authority

Proof obligation:

- Runtime, MCP, CLI, SDK, review, report, and terminal certificate surfaces do not evaluate policy, issue greenlights, check gateways, mutate, export raw receipts, invoke signers, or mint authority.
- Lane manifests do not claim broad runtime, MCP, browser, shell, network, package-manager, cloud, repo, or database protection.

Candidate gates:

```bash
npm run test -- test/architecture/claim-boundary.test.ts
npm run test -- test/architecture/import-posture.test.ts test/architecture/root-exports.test.ts
npm run quality:architecture
```

### Redaction And Support Payload Boundary

Proof obligation:

- Walkthroughs and support language do not request or expose `PaymentPayload`, `PAYMENT-SIGNATURE`, private keys, signer refs, raw store records, role-token maps, gateway credentials, or raw payment material.
- Shareable support/debug artifacts are redacted refs, reason codes, request IDs, local report sections, and local certificate verification results.

Candidate gate:

```bash
npm run quality:claims
```

## Required Closeout Commands

Run focused gates first:

```bash
npm run quality:claims
npm run test -- test/architecture/claim-boundary.test.ts test/product/x402-protected-spend-demo-report.test.ts
```

Run demo gate if `examples/x402-protected-spend/run.ts` changes:

```bash
npm run demo:aps
```

Run architecture/package posture gates if lane manifests or public docs change:

```bash
npm run test -- test/architecture/import-posture.test.ts test/architecture/root-exports.test.ts
npm run quality:architecture
```

Run final formatting and repo gate:

```bash
npm run format:check
npm run check:repo
```

If implementation touches runtime, MCP, or x402 proposal internals despite the cut line, add:

```bash
npm run test -- test/runtime/runtime-ingress.test.ts test/mcp/mcp-x402-proposal.test.ts test/adapters/x402-payment-action-proposal.test.ts
```

That should be exceptional. A need for those tests means the slice may be drifting from claim cleanup into capability work.

## Blocked In This Synthesis

- No tests were run; this chair task was planning-only.
- No external x402, npm, MCP Registry, JWKS, Cloudflare, legal, or payment-regulatory verification was performed.
- Package script definitions were not re-read from `package.json` because the run input provided the command contract and this chair stayed inside the allowed source boundary.
