# Source Study

Status: planning scratch, revised 2026-05-19.

## Invariant at stake

Source evidence must separate what x402 proves from what Handshake proves.
x402 can prove payment-protocol facts. Handshake must prove principal authority
over a generated agent's consequential payment attempt.

## Internal source anchors

### `docs/internal/protocol-definition.md`

Authority exists only when:

- runtime or generated-execution evidence produced the candidate;
- the candidate matched catalog, envelope, and gateway records;
- the candidate was canonicalized into an exact `ActionContract`;
- policy greenlit that exact contract;
- the `Greenlight` is unexpired, unconsumed, and `maxUses: 1`;
- no active `IsolationState` blocks policy or gateway execution;
- the gateway owns or controls the mutation credential;
- the gateway checks the exact greenlight before mutation.

For x402, the mutation credential is wallet signing authority.

### `docs/internal/protocol-kernel-architecture.md`

The kernel already has the required object chain:

```text
ToolCapability
ActionType
GatewayRegistryEntry
OperatingEnvelope
RuntimeExecution
GeneratedExecutionGraph
IntentCompilationRecord
CandidateAction
ActionContract
PolicyDecision
Greenlight
GatewayCheckAttempt
MutationAttempt
Receipt
Refusal
ProofGap
IsolationState
RecoveryRecommendation
```

Tier 2 should map x402 into this chain instead of adding a new protocol core.

### `docs/internal/protocol-layman.md`

The plain-language guide gives the product translation Tier 2 should preserve:

```text
one exact work order
one decision
one-use pass
one gateway check
one receipt, refusal, or proof gap
```

For x402:

```text
one exact payment contract
one decision
one-use greenlight
one wallet gateway check
one receipt, refusal, or proof gap
```

### `docs/internal/decisions.md`

The first bought product is Protected Actions: one workflow, one protected
production-adjacent action class, one gateway check, one policy file, one
receipt timeline.

That implies Tier 2 x402 should design for a buying path, not just a demo path.

## X402 primary-source facts

Primary sources:

- x402 HTTP 402 docs:
  <https://docs.x402.org/core-concepts/http-402>
- x402 buyer quickstart:
  <https://docs.x402.org/getting-started/quickstart-for-buyers>
- x402 facilitator docs:
  <https://docs.x402.org/core-concepts/facilitator>
- x402 V1 to V2 migration guide:
  <https://docs.x402.org/guides/migration-v1-to-v2>
- x402 GitHub repository:
  <https://github.com/x402-foundation/x402>

### Payment flow

x402 V2 uses:

- `PAYMENT-REQUIRED`: server to client, base64 `PaymentRequired`;
- `PAYMENT-SIGNATURE`: client to server, base64 `PaymentPayload`;
- `PAYMENT-RESPONSE`: server to client, base64 settlement response.

The buyer receives a 402, selects accepted payment details, creates and signs a
payment payload, retries the request with `PAYMENT-SIGNATURE`, and receives
resource/settlement evidence through the server response.

Handshake's authority boundary is before `PAYMENT-SIGNATURE` exists.

### Buyer SDK pressure

The buyer quickstart shows private-key-backed signers loaded from environment
variables such as `EVM_PRIVATE_KEY` and clients that automatically retry paid
requests. That is correct x402 ergonomics, but it is the danger case for
Handshake: generated code can make a paid request look like an ordinary HTTP
call.

Tier 2 must invert that path. Generated code may produce a candidate. Only the
customer-owned gateway may create the payment signature.

### Facilitator boundary

The facilitator verifies and settles payments for servers and does not hold
buyer funds. Facilitator responses are downstream evidence. They do not decide
whether the principal authorized the agent to sign.

### Version drift

x402 V2 changed headers and network identifiers. Contracts must pin x402
version and header evidence rather than letting the gateway infer compatibility
at signing time.

## Design conclusion

x402 is a strong Tier 2 proof because the mutation is crisp:

```text
PAYMENT-SIGNATURE created by wallet authority
```

But x402 should not determine the Handshake architecture. The architecture is:

```text
protected action authority chain now
hosted operation around the same chain later
provider gateway attestation around the same chain after that
```

## Smallest next mechanism

Map `PAYMENT-REQUIRED` into `ActionContract.parameters` and make
`PAYMENT-SIGNATURE` creation a `GatewayCheckAttempt` outcome, never a runtime
helper outcome.
