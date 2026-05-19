# X402 Source Study

Status: source-grounding scratch, created 2026-05-19.

## Invariant at stake

The wallet signature is the protected mutation authority. Any architecture that
lets generated code reach a signer directly has already lost the Handshake
boundary.

## Primary sources checked

- x402 HTTP 402 docs:
  <https://docs.x402.org/core-concepts/http-402>
- x402 buyer quickstart:
  <https://docs.x402.org/getting-started/quickstart-for-buyers>
- x402 facilitator docs:
  <https://docs.x402.org/core-concepts/facilitator>
- x402 wallet docs:
  <https://docs.x402.org/core-concepts/wallet>
- x402 exact scheme docs:
  <https://docs.x402.org/schemes/exact>
- x402 upto scheme docs:
  <https://docs.x402.org/schemes/upto>
- x402 payment-identifier extension:
  <https://docs.x402.org/extensions/payment-identifier>
- x402 signed offers and receipts:
  <https://docs.x402.org/extensions/offer-receipt>
- x402 V1 to V2 migration guide:
  <https://docs.x402.org/guides/migration-v1-to-v2>
- x402 GitHub repository:
  <https://github.com/x402-foundation/x402>
- External security pressure, not protocol canon:
  <https://arxiv.org/abs/2605.11781>

## Facts that matter to Handshake

### HTTP flow

x402 uses HTTP `402 Payment Required` to let a resource server advertise payment
requirements for a resource. In V2, the relevant headers are:

- `PAYMENT-REQUIRED`: server to client, base64 `PaymentRequired`;
- `PAYMENT-SIGNATURE`: client to server, base64 `PaymentPayload`;
- `PAYMENT-RESPONSE`: server to client, base64 settlement response.

The current interaction shape is:

```text
client requests resource
server returns 402 + PAYMENT-REQUIRED
client selects accepted payment details
client builds and signs PaymentPayload
client retries request with PAYMENT-SIGNATURE
server verifies locally or through facilitator /verify
server fulfills or refuses
server settles locally or through facilitator /settle
server returns resource and PAYMENT-RESPONSE when settlement is observed
```

Handshake's control point is between `PAYMENT-REQUIRED` and
`PAYMENT-SIGNATURE`. Before that point there is no spend. After that point the
wallet has authorized payment.

### Buyer SDK convenience is the escape hatch

The buyer quickstart creates signers from environment private keys such as
`EVM_PRIVATE_KEY` and `SVM_PRIVATE_KEY`, registers payment schemes, and wraps
`fetch`, Axios, Go HTTP clients, and Python clients so payment handling happens
automatically after a `402`.

That is good x402 ergonomics and bad Handshake authority posture if the generated
agent can use the wrapper or private key directly.

Tier 2 must not wrap a signer into the agent's HTTP client. It should provide a
proposal surface that can discover a paid resource and capture a 402 offer, then
route signature authority to a wallet gateway.

### Exact starts with fixed consequence

The `exact` scheme is fixed-price: the seller advertises one amount, the buyer
signs for that amount, and settlement is for that request. This is the first
credible Tier 2 example because the final amount is known before the response is
generated.

Tier 2 should begin with `exact`, not `upto`.

### Upto hides downstream amount choice

The `upto` scheme lets the buyer authorize a maximum and lets the seller settle
for actual usage at or below that maximum. That is useful later, but it adds a
seller-side final amount decision after the buyer signs.

For Handshake this means `upto` requires stronger evidence around the final
settlement amount, usage computation, retry idempotency, and downstream proof
gaps. It should be a hostile fixture before it is a supported happy path.

### Facilitator is downstream, not authority

The facilitator verifies payment payloads and settles payments on behalf of
servers. It does not hold buyer funds, and it does not decide whether the
principal authorized the agent to spend.

Handshake should not become an x402 facilitator. It should treat facilitator
verification and settlement responses as downstream evidence.

### Payment identifier is retry evidence

The payment-identifier extension gives x402 an idempotency mechanism: servers can
deduplicate retries with the same payment ID. It is optional.

Tier 2 policy should require payment identifier support for real-money examples
unless the design explicitly records a degraded retry posture or proof gap.

### Signed offers and receipts are evidence

The offer/receipt extension lets servers sign offers on `402` responses and
receipts on successful responses. These artifacts can help with audit and dispute
evidence.

They are not Handshake authority. A signed seller offer proves seller terms, not
principal consent. A signed seller receipt proves an observed service-delivery
claim, not business value or correctness of the purchased result.

### Header version drift matters

x402 V1 used `X-PAYMENT` and `X-PAYMENT-RESPONSE`. V2 uses
`PAYMENT-SIGNATURE` and `PAYMENT-RESPONSE`, and CAIP-2 network identifiers such
as `eip155:84532`.

Tier 2 must pin an x402 protocol version in the contract evidence. Mixed V1/V2
support is a proof-gap or compatibility feature, not something the wallet
gateway should infer loosely at signing time.

## Design consequences

- Protected action: one exact x402 payment signing attempt.
- Protected surface: buyer wallet signer held by a wallet gateway.
- Proposal surface: can make the initial unpaid HTTP request and parse
  `PAYMENT-REQUIRED`; cannot sign.
- Gateway surface: signs exactly one matching `PaymentPayload` after verifying
  exact contract digest, greenlight digest, gateway identity, protected surface,
  idempotency posture, expiry, and isolation state.
- Receipt surface: must distinguish 402 offer evidence, policy decision,
  wallet-gateway signature evidence, x402 response evidence, settlement evidence,
  signed offer/receipt evidence, and proof gaps.

## Open source risks

The external x402 security preprint is not protocol canon, but its threat themes
line up with Handshake's own required doubts: authorization binding, replay
protection, context binding, and web-layer handling. Tier 2 should treat those
as first-class hostile fixtures rather than as later hardening.

## Smallest next mechanism

Specify `X402PaymentContract` as an `ActionContract` parameter schema and
`WalletGatewayCheck` as the only component allowed to create
`PAYMENT-SIGNATURE`.
