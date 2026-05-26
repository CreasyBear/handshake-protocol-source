# A2A Negotiated x402 Room Fixture

This fixture exercises one buyer/seller negotiation over a single buyer-side `x402_payment.exact` protected action.

The accepted agreement and obligation binding are evidence only. The policy greenlight is created only after the exact `ActionContract` is bound to the active agreement obligation, and the payment signer is invoked only after a passed gateway check.

Generate the readback fixture:

```sh
bun examples/a2a-negotiated-x402-room/generate.ts
```
