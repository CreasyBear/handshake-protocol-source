# Users And Tier Pathway

Status: planning scratch, revised 2026-05-19.

## Invariant at stake

User-type design cannot become persona theatre. Each user type must map to a
real authority, evidence, adoption, or recovery job in the protocol chain.

## User types

### 1. Agent workflow owner

Who: engineer or team lead letting a coding agent perform useful work.

Job: get agent productivity without handing the agent mutation authority.

Needs:

- a way for generated work to produce exact candidates;
- fast local feedback when a candidate is refused;
- proof that a successful action used the gateway path;
- no requirement to understand every protocol object on day one.

Tier implication:

- Tier 2 must feel like an installable protected-action loop.
- Tier 3 can centralize policy and receipts for multiple workflows.
- Tier 4 matters when their provider or platform can enforce natively.

### 2. Protected path owner

Who: engineer, platform owner, security owner, or wallet owner who controls the
credential or mutation path.

Job: ensure the agent cannot mutate outside declared bounds.

Needs:

- custody posture: who holds the credential;
- gateway policy version;
- exact contract fields;
- replay and drift refusal;
- isolation after divergence.

Tier implication:

- Tier 2 must keep credential authority outside the agent.
- Tier 3 must manage policy rollout without broadening authority.
- Tier 4 must make provider-side enforcement real, not advisory.

### 3. Policy owner

Who: person or team responsible for deciding which exact actions may proceed.

Job: turn operating limits into machine-checkable decisions.

Needs:

- versioned policy packs;
- deterministic evaluation;
- refusal reasons;
- review hooks tied to exact contract digests;
- budget windows treated as attempt bounds, not permission.

Tier implication:

- Tier 2 uses local versioned policy.
- Tier 3 hosts policy management and distribution.
- Tier 4 requires policy contracts the provider gateway can verify or honor.

### 4. Reviewer or auditor

Who: operator, security reviewer, compliance reviewer, incident responder, or
future maintainer reconstructing what happened.

Job: determine what was controlled, what was observed, and what is unknown.

Needs:

- receipt timeline;
- refusal history;
- proof gaps;
- gateway check evidence;
- downstream finality evidence;
- links between related obligations.

Tier implication:

- Tier 2 must produce local reconstruction truth.
- Tier 3 adds retention, search, audit, and recovery workflows.
- Tier 4 adds provider attestations or native evidence.

### 5. Provider partner

Who: wallet provider, deployment provider, package registry, CI provider, cloud
provider, data API provider, or agent runtime vendor.

Job: make Handshake enforcement native enough that customers do not have to rely
on wrappers or logs.

Needs:

- stable contract and gateway check semantics;
- versioned gateway policy contract;
- conformance expectations;
- evidence exchange format;
- clear non-claim boundaries.

Tier implication:

- Tier 2 should expose the shape providers will later need.
- Tier 3 can operate policy and evidence across orgs.
- Tier 4 is reached only when the provider/customer gateway can block mutation
  before consequence.

### 6. Resource seller in the x402 example

Who: x402 seller, data/API provider, or facilitator-adjacent service.

Job: publish payment requirements and fulfill paid resources.

Needs:

- no dependency on Handshake to sell through x402;
- clear buyer-side evidence requirements;
- optional signed offer/receipt support treated as evidence;
- no assumption that seller approval equals principal consent.

Tier implication:

- Tier 2 buyer-side proof should not require seller cooperation beyond standard
  x402.
- Tier 4 may later support provider-native receipt or offer attestation, but it
  still cannot authorize the buyer's principal.

## Tier ladder

### Tier 1: protocol kernel

User promise:

```text
There is a coherent authority state machine.
```

What exists:

- exact contracts;
- policy decisions;
- one-use greenlights;
- gateway checks;
- receipts/refusals/proof gaps;
- isolation and recovery primitives.

What it cannot claim:

- installed customer path;
- hosted operation;
- provider enforcement.

### Tier 2: self-hosted Protected Actions

User promise:

```text
This installed customer-owned path is gateway-checked.
```

For x402:

```text
The agent can propose a paid request.
The customer-owned wallet gateway creates PAYMENT-SIGNATURE only after exact
greenlight verification.
```

Tier 2 must produce objects that Tier 3 can host later:

- versioned policy pack;
- gateway registry entry;
- protected path posture;
- receipts and proof gaps;
- recovery recommendations;
- conformance results.

### Tier 3: hosted operation

User promise:

```text
Handshake can operate policy, evidence, audit, rollout, and recovery across
installed protected paths.
```

Tier 3 adds:

- hosted policy management;
- policy distribution to gateways;
- gateway enrollment and health;
- receipt retention and search;
- audit workflows;
- recovery workflows;
- rollout controls;
- org-level installation posture.

Tier 3 must not move enforcement away from the gateway. Hosted policy is not a
mutation credential.

### Tier 4: provider-integrated enforcement

User promise:

```text
The protected system's own gateway or provider-certified boundary can enforce
Handshake-compatible checks before mutation.
```

Tier 4 adds:

- provider/customer gateway contract;
- native or certified pre-mutation check;
- provider evidence attestation;
- conformance profile;
- bilateral or ecosystem records when multiple principals coordinate.

Tier 4 is not "more connectors." It is a stronger enforcement location.

## X402 ladder

```text
Tier 2:
  customer-owned wallet gateway signs after local policy greenlight

Tier 3:
  hosted Handshake manages wallet-gateway policy, receipts, rollout, recovery,
  and audit across teams

Tier 4:
  wallet provider, x402 client provider, or payment infrastructure provider
  implements or certifies the gateway check before signing
```

## Design requirements by user type

| User type | Tier 2 proof | Tier 3 growth | Tier 4 endpoint |
| --- | --- | --- | --- |
| Agent workflow owner | agent cannot spend directly | many workflows managed | provider runtime cannot bypass |
| Protected path owner | gateway owns signer | policy rollout and health | native provider enforcement |
| Policy owner | local deterministic policy | hosted policy distribution | provider-verifiable policy contract |
| Reviewer/auditor | local receipt timeline | retained/searchable evidence | provider attestation |
| Provider partner | clear gateway semantics | operational integration | certified enforcement |
| x402 seller | standard x402 compatibility | richer evidence intake | signed offers/receipts as evidence |

## Smallest next mechanism

Design Tier 2 records so every object has a Tier 3 owner and a Tier 4
attestation path before source implementation begins.
