# A2A Negotiated x402 Room

This local reference room exercises one buyer/seller negotiation over a single buyer-side `x402_payment.exact` protected action.

The accepted agreement and obligation binding are evidence only. The policy greenlight is created only after the exact `ActionContract` is bound to the active agreement obligation, and the payment signer is invoked only after a passed gateway check.

Generate the product readback:

```sh
bun examples/a2a-negotiated-x402-room/generate.ts
```

Expected outputs:

- `latest.json`: full support packet plus product readback.
- `latest.md`: customer/operator readback.
- `agent-handoff.md`: agent-executable handoff with source boundary, stop conditions, eval path, and non-claims.

Evaluation:

- `evaluation.md`: DX, AX, CX, CSO, and product scorecard for this local/reference slice.

This example is local/reference evidence only. It does not claim marketplace operation, legal contract formation, escrow, settlement finality, reputation, cross-org trust, provider custody, reusable authority, or native-host containment.
