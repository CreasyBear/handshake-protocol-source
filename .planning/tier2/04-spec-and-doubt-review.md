# Spec And Doubt Review

Status: planning scratch, revised 2026-05-19.

## Invariant at stake

The design must be strong enough that a Tier 2 proof can grow into hosted and
provider-integrated Handshake without renaming local demo artifacts into product
truth.

## Spec

### Objective

Design the Tier 2 x402 protected spend proof as the first self-hosted instance
of Handshake Protected Actions.

Success means:

- one coding-agent workflow can propose an exact x402 payment;
- the wallet gateway, not the agent, holds signing authority;
- policy can greenlight/refuse the exact payment;
- the gateway creates `PAYMENT-SIGNATURE` only after exact one-use verification;
- the resulting records are suitable for Tier 3 hosted operation and Tier 4
  provider-gateway integration.

### Commands

No source implementation in this packet. When implementation begins, repo canon
requires:

```bash
npm run check:types
npm run lint
npm run test
git diff --check
```

Full gate:

```bash
npm run check:repo
```

### Future source ownership

Do not implement directly from this scratch packet without a follow-up source
plan.

Expected ownership if implemented:

- `src/runtime/x402-payment`: generated-execution evidence and candidate
  proposal only;
- `src/adapters/x402-wallet-gateway`: reference wallet gateway fixture that
  signs only after verified gateway check;
- `src/conformance/x402-payment`: hostile checks for replay, drift, raw signer
  exposure, and proof gaps;
- `test/runtime`, `test/adapters`, `test/conformance`: focused evidence tests.

### Code style

Use protocol nouns that describe authority:

```ts
recordX402PaymentCandidate(...)
proposeX402PaymentContract(...)
evaluateX402PaymentPolicy(...)
recordWalletGatewayCheck(...)
recordX402PaymentReceipt(...)
```

Avoid names that imply more than mechanism:

```text
safePayment
trustedAgentPayment
approvedSpend
secureX402Fetch
proveSettlement
```

### Testing strategy

The first behavioral proof should use deterministic fake signing before real
funds.

Required hostile checks:

- no greenlight -> no payment signature;
- wrong contract digest -> no payment signature;
- wrong gateway -> no payment signature;
- expired greenlight -> no payment signature;
- replayed greenlight -> no second signature;
- changed `PAYMENT-REQUIRED` -> no payment signature;
- active isolation -> no payment signature;
- raw signer visible to agent -> unsafe posture and refusal/quarantine;
- missing `PAYMENT-RESPONSE` -> proof gap, not success;
- `upto` offered -> refusal until final amount evidence is designed.

### Boundaries

Always:

- preserve exact contract binding;
- keep signer authority out of generated code;
- record refusals and proof gaps as product outcomes;
- design records for Tier 3 retention and Tier 4 attestation.

Ask first:

- adding x402 dependencies;
- adding source paths;
- moving scratch planning into canon;
- running real testnet/mainnet payment flows.

Never:

- give generated code private keys;
- infer authority from x402 seller/facilitator evidence;
- claim hosted operation without deployment/custody/gateway proof;
- claim provider enforcement without provider/customer pre-mutation check.

## Doubt review

This is a degraded in-session adversarial pass, not a fresh-context or
cross-model review. Subagents and external model CLIs were not invoked in this
turn.

### Claim: "Tier 2 x402 creates a path to Tier 3/4."

Issue: only true if Tier 2 records already carry policy version, gateway
identity, custody mode, contract digest, idempotency posture, receipt evidence,
proof gaps, and install posture.

Resolution: revised architecture makes Tier 3/4 continuity a design requirement,
not a follow-up.

### Claim: "User types are addressed."

Issue: generic personas would be theatre. User types must map to authority jobs.

Resolution: user types are defined by protocol responsibility: workflow owner,
protected path owner, policy owner, auditor, provider partner, and x402 seller.

### Claim: "The x402 buyer flow is enough."

Issue: official x402 buyer docs optimize for automatic payment after 402. That
is the exact bypass risk for generated code.

Resolution: the buyer flow is used as threat pressure. Handshake inverts it:
generated code proposes; wallet gateway signs after exact check.

### Claim: "Tier 3 is just hosted UI."

Issue: that repeats the prior misalignment. Hosted operation is not presentation.

Resolution: Tier 3 is policy management, distribution, receipt retention,
search, rollout, audit, and recovery around the same authority chain.

### Claim: "Tier 4 is more integrations."

Issue: more integrations can still be advisory.

Resolution: Tier 4 requires provider/customer gateway enforcement before
mutation or provider-native evidence compatible with the gateway chain.

## Design verdict

Keep:

- x402 buyer-side exact payment as first proof lens;
- wallet gateway as authority holder;
- local versioned policy in Tier 2;
- Tier 3 hosted operation around the same chain;
- Tier 4 provider/customer gateway enforcement as the end state.

Cut:

- local adapter as product center;
- payment-product language;
- seller/facilitator ambitions;
- generic "agent commerce";
- broad "x402 protection" claims.

Redesign:

- records must be migration-ready from the first Tier 2 fixture;
- user types must be responsibility types, not marketing personas;
- receipt structure must serve future retention/search/audit without changing
  evidence meaning.

## Smallest next mechanism

Before source implementation, write the `x402_payment.exact` record contract and
conformance checklist as a Tier 2 -> Tier 3 -> Tier 4 compatibility matrix.
