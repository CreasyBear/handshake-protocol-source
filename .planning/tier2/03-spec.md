# Tier 2 X402 Protected Spend Spec

Status: draft spec, created 2026-05-19.

## Invariant at stake

An operating envelope may bound spend attempts, but it must not authorize spend.
Each x402 payment still needs one exact contract, one policy decision, one
gateway-bound greenlight, and one wallet gateway check before signature.

## Product slice

Name: Tier 2 self-hosted x402 protected spend loop.

User: an engineer letting a coding agent call one paid API endpoint without
giving the agent a wallet key.

Outcome: a local run produces either a receipt proving one wallet-gateway-checked
payment signature or a refusal/proof gap explaining why no signature happened or
why downstream evidence is incomplete.

## In scope

- One self-hosted repo-local example.
- One buyer-side x402 protected request.
- x402 V2 headers.
- `exact` scheme only.
- One local wallet gateway.
- One local policy file.
- One local receipt store.
- One readable receipt/refusal timeline.
- Hostile conformance fixtures for gateway enforcement, replay, idempotency, and
  raw signer exposure.

## Out of scope

- Hosted Handshake Cloud.
- x402 seller middleware.
- Facilitator implementation.
- Production wallet custody.
- Marketplace, procurement, fraud, tax, or accounting.
- `upto` support except hostile fixtures.
- Browser wallet flows.
- Universal raw network egress prevention.

## Proposed source shape

This is a future implementation sketch. It is not a command to edit source yet.

```text
src/runtime/x402-payment/
  LANE.md
  protected-x402-fetch.ts
  x402-offer-intake.ts
  x402-candidate-proposal.ts
  index.ts

src/adapters/x402-wallet-gateway/
  LANE.md
  wallet-gateway-check.ts
  payment-signature-attempt.ts
  x402-response-evidence.ts
  index.ts

src/conformance/x402-payment/
  LANE.md
  x402-protected-spend-probes.ts
  x402-bypass-posture-probes.ts
  index.ts

test/runtime/x402-payment/
test/adapters/x402-wallet-gateway/
test/conformance/x402-payment/
```

Authority ownership:

- `src/runtime/x402-payment`: proposal only; no signer imports; no mutation.
- `src/adapters/x402-wallet-gateway`: signer boundary; mutation only after
  verified gateway check.
- `src/conformance/x402-payment`: hostile probes; no mutation attempts.

## Public surface sketch

```ts
type ProtectedX402FetchInput = {
  intentRef: string;
  runtimeExecutionRef: string;
  method: "GET" | "POST";
  url: string;
  headers?: Record<string, string>;
  bodyDigest?: string;
  operatingEnvelopeId: string;
};

type X402PaymentPolicy = {
  x402Version: 2;
  scheme: "exact";
  allowedNetworks: string[];
  allowedAssets: string[];
  allowedPayTo: string[];
  allowedHosts: string[];
  maxAmountAtomic: string;
  requirePaymentIdentifier: boolean;
  allowedFacilitators: string[];
};

type WalletGatewaySignInput = {
  actionContractId: string;
  greenlightId: string;
  observedPaymentRequiredDigest: string;
  currentProtectedPathPostureId: string;
};
```

The concrete implementation should use existing Tier 1 public input schemas
where possible. These names are design anchors, not final exports.

## Functional requirements

### FR1. Capture unpaid request evidence

Given an agent attempts `protectedX402Fetch`, the runtime surface records the
request method, URL, header digest, body digest, runtime identity, and generated
execution evidence.

It must not include wallet signer material or call x402 payment wrappers that
can sign.

### FR2. Decode and canonicalize `PAYMENT-REQUIRED`

Given a `402` response, the intake layer decodes the x402 V2 payment
requirements, records raw and decoded digests, selects one `exact` accepted
payment detail, and emits a candidate action.

If the header is missing, malformed, V1-only, unsupported, ambiguous, or not
`exact`, the system records refusal or proof gap before wallet authority exists.

### FR3. Evaluate local policy deterministically

Given an `X402PaymentContract`, local policy evaluates exact fields without LLM
interpretation.

It must return one of:

- greenlight;
- refusal;
- review required;
- halt;
- quarantine.

### FR4. Bind greenlight to one gateway and one contract

Given policy greenlights the contract, the greenlight binds contract digest,
params digest, gateway ID, protected surface, action type, policy snapshot,
expiration, idempotency posture, and isolation snapshot.

`maxUses` must be `1`.

### FR5. Sign only inside wallet gateway

Given a wallet gateway receives a sign request, it verifies exact binding before
creating `PAYMENT-SIGNATURE`.

If any binding mismatches, it records refusal and does not sign.

### FR6. Consume greenlight atomically

The gateway check and greenlight consumption must be atomic from Handshake's
perspective. Replays must fail before signing.

### FR7. Record downstream evidence honestly

After a signed retry, the gateway records response status,
`PAYMENT-RESPONSE`, facilitator settlement evidence where visible, signed
receipt evidence where present, and proof gaps where evidence is missing.

### FR8. Surface bypass posture

The run records whether the agent environment could reach obvious raw signer
paths such as `EVM_PRIVATE_KEY`, `SVM_PRIVATE_KEY`, managed wallet API tokens,
raw x402 wrappers, browser wallets, or shell/network paths.

Visibility is not universal enforcement. The product state must say exactly what
was protected, unknown, blocked, or outside the installed path.

## Non-functional requirements

- Deterministic canonicalization.
- No signer material in runtime proposal process.
- Append-only evidence.
- Clear refusal reasons.
- Replay resistance.
- Idempotency posture for retries.
- Local-only activation.
- No hosted dependency for first proof.
- TypeScript strictness and repo naming posture if implementation begins.

## Conformance fixtures

Required fixtures:

- no greenlight: no signature;
- expired greenlight: no signature;
- replayed greenlight: no second signature;
- wrong gateway: no signature;
- wrong protected surface: no signature;
- wrong contract digest: no signature;
- changed `PAYMENT-REQUIRED`: no signature;
- payment identifier absent: refusal or degraded proof posture;
- `upto` offered: refusal for first build;
- signed offer present: evidence only, not authority;
- signed receipt missing: proof gap, not success;
- facilitator response unavailable: proof gap;
- raw `EVM_PRIVATE_KEY` visible to agent: halt/quarantine;
- raw `wrapFetchWithPayment` signer path reachable: unsafe bypass posture.

## Acceptance criteria

The first build is acceptable only when a local test can show:

```text
agent can discover a paid resource
agent can propose an exact x402 payment contract
policy can greenlight or refuse exact terms
wallet gateway signs only after exact one-use greenlight
receipt distinguishes gateway check, signature attempt, downstream response,
proof gaps, and bypass posture
replay and mismatch fixtures fail before signature
```

## Open decisions

- Use a deterministic fake signer for all hostile fixtures, then add a real
  testnet signer only after replay and no-greenlight fixtures are stable.
- Decide CLI first vs MCP tool first. CLI is better for proof; MCP is better for
  agent adoption.
- Decide whether payment identifier absence is hard refusal or allowed only in a
  fixture-labeled degraded mode.
- Decide how much raw signer detection is credible locally without pretending to
  control all shell, browser, and network paths.

## Smallest next mechanism

Implement only a deterministic local wallet gateway fixture first. It should
produce a fake `PAYMENT-SIGNATURE` digest after a verified gateway check and
prove all refusal/replay paths before touching real x402 funds.
