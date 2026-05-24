# x402 Protected Spend Local Walkthrough

Status: local/reference official exact walkthrough
Scope: one official buyer-side `x402_payment.exact` protected spend attempt from generated engineering-agent execution evidence
Report proof object: `x402_paid_http_call.exact` as a buyer-readable label; source code still uses `x402_payment.exact`.

## Invariant At Stake

The agent may propose a paid request. It must not receive signer authority, gateway authority, receipt authority, or certificate authority.

This walkthrough exercises the local proof path:

```text
generated wrapped_x402_payment dispatch
-> local/reference 402 PAYMENT-REQUIRED challenge evidence
-> runtime ingress proposal evidence
-> ActionContract
-> PolicyDecision and one-use Greenlight
-> x402 wallet gateway check
-> gateway-held official SDK signing surface after verified gate
-> local signed retry evidence
-> receipt, replay refusal, or proof gap projection
-> optional terminal AuthorityCertificate evidence
```

## What This Proves

- A generated x402 dispatch can reach an exact `ActionContract`.
- A local/reference paid HTTP sandbox can emit official-shaped `PAYMENT-REQUIRED` evidence and observe one signed retry only after gateway-created signature evidence exists.
- Runtime ingress creates no policy decision, greenlight, gateway check, mutation attempt, receipt, or certificate.
- The official x402 signer and `PaymentPayload` creation stay outside the agent/runtime and run only after a verified gateway check.
- Parameter mismatch and consumed-greenlight replay refuse before signer use.
- Redacted projections expose signer invocation refs/digests and `PAYMENT-RESPONSE` evidence without raw credential material.
- Downstream uncertainty becomes a proof gap, not fake finality.
- Package install still passes through the same authority spine as a parity/regression lane.

## What This Does Not Prove

- No hosted operation.
- No provider custody.
- No aggregate x402 spend windows.
- No broad x402 compatibility.
- No facilitator operation, seller middleware, `upto`, or batch settlement support.
- No external customer gateway installation.
- No cross-org `AuthorityCertificate` trust.
- No marketplace, certification, or conformance mark.
- No broad MCP, CLI, browser, shell, or network control.

## Run The Local Proof

From the repo root:

```bash
npm run demo:aps
```

The demo writes inspectable local artifacts:

```text
examples/x402-protected-spend/output/latest.md
examples/x402-protected-spend/output/latest.json
```

It prints and writes named phases:

1. `1_runtime_proposal`
2. `2_policy_greenlight`
3. `3_gateway_admission_and_signature`
4. `4_sandbox_paid_retry`
5. `5_redacted_evidence_envelope`
6. `6_terminal_certificate`
7. `7_replay_refusal`

The report also includes `0_sandbox_payment_required_challenge` before authority exists.

For the assertion-backed proof suite:

```bash
npm run test -- test/product/agent-proof-slice.test.ts test/adapters/x402-wallet-gateway.test.ts test/integration/x402-d1-http.test.ts
```

Expected measurement:

```text
20 pass
0 fail
```

Those tests cover:

| Measurement              | Evidence                                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First contract           | `test/product/agent-proof-slice.test.ts` observes `wrapped_x402_payment` and gets `action_contract_proposed` before any policy/gateway/receipt/certificate records exist. |
| First receipt projection | The same product slice reads `getAgentTransactionEnvelopeProjection()` after gateway admission and verifies redaction.                                                    |
| Replay refusal           | `test/adapters/x402-wallet-gateway.test.ts` and `test/integration/x402-d1-http.test.ts` prove a consumed greenlight refuses before another signer call or mutation.       |
| Official SDK parity      | D1 and wallet-gateway tests create official SDK `PaymentPayload` evidence only after gateway admission, then expose redacted refs/digests.                                |
| Local sandbox retry      | Wallet-gateway tests prove the local paid HTTP sandbox records one signed retry only after gateway signature evidence exists.                                             |
| Proof gap projection     | Product and D1 tests prove missing downstream payment response evidence records a proof gap.                                                                              |
| Signer custody           | Wallet-gateway tests assert `signPayment()` receives a `VerifiedGatewayCheck`, not raw agent authority.                                                                   |
| Package parity           | Product slice passes `package.install` through the same projection spine with no package-material attestation claim.                                                      |

## Integration Shape

Use source-owned APIs and helpers. Do not write raw protocol records.

1. Compile the exact x402 install proposal with `compileX402InstallProposal()`.
2. Register the compiled tool, action type, gateway registry entry, and operating envelope through the kernel or HTTP client.
3. Record gateway-owned hostile probes and protected-path posture.
4. Submit generated execution evidence with one `wrapped_x402_payment` dispatch through `proposeRuntimeIngressActionContracts()`.
5. Treat the resulting `ActionContract` as proposal evidence only.
6. Evaluate policy separately.
7. Run the local/reference wallet gateway with `runX402WalletGateway()`.
8. Record the local/reference sandbox signed retry as downstream fixture evidence only.
9. Read the redacted transaction envelope projection.
10. Optionally mint an `AuthorityCertificate` only after receipt, durable refusal, proof gap, or replay refusal exists.

## Signer Custody

The local/reference wallet gateway is the mutation credential holder. The generated code, runtime ingress, metadata, challenges, evidence projections, SDK reads, and review surfaces must not receive the signer, raw payment signature authority, official SDK signer client, raw `PaymentPayload`, or gateway custody route.

The only accepted signer path in this walkthrough is:

```text
verified gateway check
-> VerifiedGatewayCheck
-> gateway-held official SDK signing surface
```

If generated code can call a raw x402 wrapper, direct MCP payment route, raw signer, or sibling payment tool, the generated code escaped the contract boundary.

## Structured Challenge Path

Before contract authority exists, use public representation schemas for safe recovery:

- `ProtectedActionRequestSchema` carries proposal input only.
- `ProtectedActionChallengeSchema` carries refusal/proof-gap/replay guidance.
- `ProtectedActionEvidenceProjectionSchema` carries redacted reconstruction refs only.

These objects must not carry policy decisions, approvals, greenlights, gateway checks, mutation commands, receipt assertions, certificate mint requests, credential material, payment signatures, or signer refs.

Run the representation guard:

```bash
npm run test -- test/protocol/representation-contract.test.ts
```

## Cut Lines

- Do not turn x402 into the protocol.
- Do not describe session/day/review spend bounds as enforced until a ledger exists.
- Do not classify `upto` as `x402_payment.exact`; it needs max authorization plus actual-settlement evidence.
- Do not classify batch settlement as `x402_payment.exact`; it needs channel, voucher, claim, and refund state.
- Do not include lifecycle hooks, MCP auto-pay, signed offers, signed receipts, seller middleware, or facilitator operation in this first wedge.
- Do not treat facilitator verify evidence as settlement finality; verify/settle labels are reconstruction evidence only.
- Do not describe `AuthorityCertificate` as permission, identity, settlement, provider custody, certification, or trust mark.
- Do not introduce MCP or CLI mutation tools for this path.
- Do not require a review UI unless source-owned renderer provenance exists.
