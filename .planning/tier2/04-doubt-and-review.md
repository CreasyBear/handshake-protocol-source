# Tier 2 Doubt And Review

Status: adversarial review scratch, created 2026-05-19.

## Invariant at stake

Tier 2 fails if it demos a successful payment while hiding the fact that the
agent could have signed through a sibling path. A beautiful receipt is worthless
if the wallet authority was also reachable outside the gateway.

## Doubt-driven pass

### Claim 1: "Handshake can protect x402 payments."

Pressure: too broad. Handshake can protect one installed buyer-side wallet
gateway path. It cannot protect arbitrary x402 clients, browser wallets, shell
commands, leaked env vars, or seller/facilitator behavior.

Decision: claim only "this installed protected path is gateway-checked."

### Claim 2: "x402 signed receipts prove success."

Pressure: overclaim. A signed x402 receipt can prove a server claim about
delivery. It does not prove resource correctness, commercial value, legal
fitness, or that downstream systems interpreted the purchase correctly.

Decision: receipts distinguish gateway check evidence, settlement evidence,
server receipt evidence, and resource response evidence.

### Claim 3: "A daily spend limit is enough policy."

Pressure: false. Budget is an operating envelope. It bounds attempts; it does
not authorize a mutation.

Decision: policy may include budget windows, but the greenlight still binds one
exact payment attempt.

### Claim 4: "The facilitator verifies payment, so Handshake does not need a
gateway."

Pressure: wrong boundary. The facilitator verifies x402 payment validity for the
server. It does not decide whether the principal authorized the agent to spend.

Decision: facilitator output is downstream evidence only.

### Claim 5: "Automatic x402 wrappers make the integration easy."

Pressure: yes, and that is why this is dangerous. Automatic wrappers combine
HTTP retry and signing in the same generated-code surface.

Decision: use wrapper behavior as a threat model. The agent-facing surface can
capture a 402 and propose a contract, but only the wallet gateway can sign.

### Claim 6: "We can support `upto` immediately because it has a maximum."

Pressure: maximum spend is not exact consequence. The seller chooses actual
usage after the buyer signs.

Decision: `upto` is a hostile fixture until final amount evidence and retry
idempotency are designed.

## CEO review

### 10-star product lens

The 10-star moment is not a dashboard. It is a local run where an engineer can
see:

```text
agent tried to buy data
seller asked for exact payment
Handshake produced exact contract
policy greenlit/refused exact terms
wallet gateway signed once or refused
receipt shows what was controlled, observed, missing, and outside scope
```

That is the product wedge because it proves the primitive in a domain where
consequence is crisp.

### Approach options

Option A: x402 wrapper plugin.

- Good: easy demo.
- Bad: signer-adjacent agent process; likely advisory.
- Verdict: cut as primary architecture.

Option B: wallet gateway plus proposal surface.

- Good: authority boundary is real; maps cleanly to Tier 1.
- Bad: more integration work; less magical at first.
- Verdict: keep.

Option C: hosted spend dashboard.

- Good: visually sellable.
- Bad: Tier 3 gravity before Tier 2 proof; easy to overclaim.
- Verdict: defer.

### CEO verdict

Keep x402 as the first Tier 2 proof lens, but do not call it agent commerce.
Call it protected spend through an installed wallet gateway.

## Engineering review

### Architecture risks

- Atomicity: greenlight consumption and signature creation must be effectively
  one operation from Handshake's evidence perspective.
- Replay: retries must not create new spend authority.
- Drift: changed `PAYMENT-REQUIRED` after policy evaluation must force gateway
  refusal.
- Custody: the agent process cannot hold signer material.
- Canonicalization: x402 decoded payment requirements must normalize
  deterministically.
- Evidence: `PAYMENT-RESPONSE` absence must produce proof gap, not success.
- Versioning: V1/V2 header drift must be explicit.

### Engineering verdict

The first implementation should use a deterministic fake signer and hostile
fixtures before a real testnet flow. Real money before replay and no-greenlight
tests would be irresponsible.

## Design review

### Information architecture

The first user-facing output should be a receipt/refusal timeline, not a
dashboard. It needs five stable bands:

```text
Attempt
Contract
Policy
Gateway
Evidence
```

Every band needs success, refusal, proof-gap, and bypass-posture states.

### Interaction states

- no payment required: normal response, no contract;
- payment required but unsupported: refusal;
- exact contract proposed: pending policy;
- policy refused: no wallet signature;
- review required: exact contract digest shown;
- gateway refused: no wallet signature;
- gateway signed: one-use greenlight consumed;
- downstream ambiguous: proof gap;
- bypass visible: halt/quarantine.

### Design verdict

Legibility is the design. The product should make it impossible to confuse
"agent saw a paid endpoint" with "wallet authorized payment."

## DevEx review

### Target developer

Platform or infra engineer evaluating agent-paid API access in one repo. They
are willing to run a local gateway but will not give an autonomous agent wallet
keys.

### Magical path

```bash
handshake x402 init
handshake x402 policy check
handshake x402 fetch https://seller.example/api/data
handshake x402 receipt latest
handshake x402 conformance
```

Those command names are placeholders. The required journey is:

1. configure one policy file;
2. start one local wallet gateway;
3. run one protected paid request;
4. inspect one receipt/refusal;
5. run hostile fixtures.

### DevEx risks

- x402 buyer docs teach direct env private keys; Handshake docs must explicitly
  route keys to gateway only.
- Real x402 sellers may not advertise payment identifier or signed receipts.
  The CLI must explain degraded posture without burying it.
- MCP-first may be too indirect for proof. CLI-first may be less agent-native.
  Start CLI for proof, then expose MCP proposal surface.

### DevEx verdict

First proof should optimize for time-to-honest-receipt, not time-to-payment. A
fast unsafe payment demo would teach the wrong integration.

## Brutal verdict

Keep:

- x402 as first Tier 2 protected spend example;
- buyer-side wallet gateway;
- `exact` only;
- payment identifier as real-money requirement;
- signed offers/receipts as evidence;
- local receipt/refusal timeline;
- hostile conformance fixtures.

Cut:

- seller middleware;
- facilitator ambitions;
- hosted dashboard;
- marketplace language;
- "agent commerce" claims;
- direct x402 wrappers inside generated-code runtime;
- `upto` happy path.

Narrow:

- "protect x402" to "protect this installed wallet-gateway path";
- "receipt proves payment" to "receipt reconstructs controlled signature and
  observed x402 evidence";
- "budget policy" to "budget-bound exact greenlights."

## Smallest next mechanism

Build the fake-signing wallet gateway conformance loop before real x402
integration. If it cannot prove no-greenlight, wrong-digest, and replay refusal,
the system is advisory, not Handshake.
