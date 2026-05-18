# First Contract Walkthrough

Status: Canonical public alpha  
Version: v0.2.0  
Audience: Developers, runtime builders, receiver owners, platform engineering  
Implementation status: Uses the v0.2 reference receiver harness; real preview deploy receiver remains target work  
Canonical owner: Product owner  
Last reviewed: 2026-05-17

## Moment Of Value

A runtime-originated action attempts consequence. Handshake turns it into an exact contract, policy greenlights or refuses it, the receiver gate checks before mutation, and a receipt reconstructs the result.

The product story can be preview deploy. The runnable v0.2 harness is the reference receiver. Do not confuse those.

## Scenario

Principal intent:

```text
Deploy a preview for this branch.
```

Runtime-originated action:

```text
agent runtime wants to call deploy.preview for branch feature/checkout-fix
```

The runtime plugin is the front door. It identifies a consequential action candidate. It does not grant mutation authority.

## Step 1: Catalog The Boundary

Register durable objects for:

- a `ToolCapability` for the runtime tool, marked consequential and wrapped;
- an `ActionType` for `preview_deploy`;
- a `ReceiverRegistryEntry` for the reference receiver gate;
- an `OperatingEnvelope` allowing the principal, agent, receiver, action class, and resource.

These records make the compiler catalog-bound. A caller cannot invent authority inline by posting a fake receiver or fake tool classification.

## Step 2: Compile Intent

Call:

```text
POST /v0.2/intent-compilations
```

The output is an `IntentCompilationRecord`.

Contract emission is allowed only if the compilation has no uncertainty markers and no overreach reason codes. If the compiler cannot prove the tool, action type, or receiver binding, it must stop before contract issuance.

## Step 3: Propose The Exact Contract

Call:

```text
POST /v0.2/action-contracts
```

The output is an `ActionContract`.

The contract binds:

- receiver ID;
- receiver registry entry and version;
- receiver policy version;
- action class;
- resource reference;
- exact parameter digest;
- non-secret parameter summary;
- expected side effects;
- idempotency key;
- canonical digest.

The rendered contract view may make this readable. The digest and receiver binding are what matter.

## Step 4: Evaluate Policy

Call:

```text
POST /v0.2/policy-decisions
```

The output is a `PolicyDecision` and, only on a greenlight decision, a `Greenlight`.

Policy decides against the exact contract, operating envelope, and current isolation state. A greenlight authorizes one receiver-gated attempt. It does not prove execution.

Refusal is a valid product outcome. A refusal should record the exact contract and reason code so the agent or operator can recover without guessing.

## Step 5: Receiver Gate Before Mutation

Call:

```text
POST /v0.2/receiver-gate-attempts
```

The receiver gate compares what it sees against the exact greenlight:

- contract ID and contract digest;
- receiver registry entry and version;
- receiver ID;
- pinned receiver policy version against current receiver policy drift semantics;
- action class;
- resource reference;
- parameter digest;
- greenlight freshness;
- greenlight consumption state;
- current isolation state.

If the check fails, no mutation attempt is recorded.

If the check passes, the greenlight is consumed and the receiver records the mutation attempt outcome.

## Step 6: Receipt Or Proof Gap

The gate response returns:

- `gateAttempt`;
- `mutationAttempt`;
- `receipt`;
- optional `proofGap`.

The receipt must distinguish:

- policy decision status;
- receiver gate status;
- greenlight consumption status;
- mutation attempt status;
- downstream execution status;
- proof gap IDs;
- finality status.

A downstream pending status is not success. A downstream unknown is not success; it is a proof gap. The receiver may later reconcile the same operation by `mutationAttemptId`, idempotency key, and receiver operation reference. Reconciliation must not create a second mutation attempt.

Active next product shipment: make this walkthrough runnable end-to-end with one fixture payload set backed by the implemented package-install or repo-write receiver proof.
