# Canon Alignment

Status: planning scratch, revised 2026-05-19.

## Invariant at stake

Tier 2 must extend the protocol kernel without changing the primitive. It must
not smuggle hosted claims, provider claims, or broad x402 payment claims into a
self-hosted proof.

## Canon facts from `/docs/internal`

### Product kernel

`docs/internal/decisions.md` defines the current product kernel as:

```text
exact action contract
-> exact policy decision
-> one-use gateway-bound greenlight
-> gateway check before mutation
-> receipt, refusal, or proof gap
```

It also defines the first bought product as Handshake Protected Actions: an
integration kit and receipt experience for one coding-agent workflow executing
one protected production-adjacent action through gateway-checked action
contracts.

### Hosted boundary

`docs/internal/decisions.md` says HTTP admission and caller custody may model
deployment-mode custody and caller roles, but they do not prove hosted
operation, production org auth, provider enforcement, or customer gateway
installation.

A hosted claim requires:

- a real deployment boundary;
- a credential custody model;
- a customer or provider gateway check;
- receipts that distinguish gateway check evidence from downstream execution
  evidence.

### Extension boundary

`docs/internal/protocol-kernel-architecture.md` defines the forward extension
path:

- self-hosted operation adds installable protected-action loops around the
  kernel;
- hosted operation adds policy management, receipt retention, search, rollout,
  audit, and recovery operations around the same kernel;
- bilateral ecosystem operation may add negotiation and linked agreements, but
  every obligation still becomes its own action contract, policy decision,
  greenlight, gateway check, and receipt/refusal/proof-gap chain.

### Gateway policy lifecycle

The same architecture doc says self-hosted installs can use local versioned
gateway policy, and hosted operation can distribute hosted versioned policy to
gateways. Enforcement remains at the gateway in both cases.

### Evidence boundary

`docs/internal/protocol-notes.md` requires receipts to distinguish:

- proposal evidence;
- policy decision evidence;
- gateway check evidence;
- mutation attempt evidence;
- downstream finality evidence;
- proof gaps.

Missing or ambiguous evidence is `ProofGap`, not success.

## Correction to the first draft

The first draft over-indexed on local product parts. That is not enough.

The corrected design starts from a tier ladder:

```text
Tier 1: protocol kernel proves the authority state machine
Tier 2: self-hosted Protected Actions proves one installed customer-owned path
Tier 3: hosted operation manages policy, retention, audit, rollout, and recovery
Tier 4: provider/customer gateway integrations make enforcement native at the
        protected system boundary
```

The x402 example is useful only because wallet signing gives a clean mutation
boundary. It is not the product category.

## Design constraints

Tier 2 must preserve these constraints:

- The agent may propose. It cannot authorize.
- The customer-owned gateway holds or controls signing authority.
- Policy is versioned before action time.
- The contract pins x402 evidence and gateway policy version.
- The greenlight is exact, one-use, gateway-bound, and expires.
- The gateway checks pinned and current policy, contract digest, params digest,
  idempotency, isolation, and protected path posture before signing.
- The receipt can later move into Tier 3 retention/search without changing its
  evidentiary meaning.
- Tier 4 provider work must make the gateway check native or provider-certified;
  it cannot be a later observer.

## Non-claims

Tier 2 must not claim:

- hosted operation;
- provider-side enforcement;
- generic x402 payment control;
- universal agent governance;
- wallet custody product;
- settlement finality;
- downstream business success;
- control over raw sibling tools or credentials outside the installed path.

## Smallest next mechanism

Define a migration-ready `x402_payment.exact` protected action family whose
records are already suitable for future hosted policy distribution and
provider-gateway attestation.
