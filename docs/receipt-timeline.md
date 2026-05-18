# Receipt Timeline

Status: Canonical public alpha  
Version: v0.2.0  
Audience: Developers, platform engineering, security engineering, auditors  
Implementation status: Product surface definition; underlying receipt objects exist in the v0.2 kernel  
Canonical owner: Product owner  
Last reviewed: 2026-05-17

## Invariant At Stake

The product surface must show exact protocol state without laundering it into a vague success story.

v0.2 defines only two surfaces: Contract Viewer and Receipt Timeline.

## Contract Viewer

The Contract Viewer makes one `ActionContract` understandable without hiding its binding.

It must show:

- principal and agent references;
- runtime and compilation references;
- receiver ID and receiver policy version;
- receiver registry entry/version and receiver policy drift status;
- action class;
- resource reference;
- parameter digest;
- non-secret parameter summary;
- expected side effects;
- bounds;
- idempotency key;
- expiry;
- canonical digest;
- uncertainty and overreach status from compilation.

It must not let the viewer approve a summary that differs from the contract digest.

## Receipt Timeline

The Receipt Timeline reconstructs one action chain:

```text
intent compilation evidence recorded
  -> action proposed
  -> policy decision recorded
  -> greenlight issued or refusal recorded
  -> receiver gate checked
  -> mutation attempted or refused
  -> proof gap recorded if evidence is missing
  -> receipt emitted
  -> receiver operation reconciled if downstream was pending or unknown
  -> isolation changed if divergence requires it
```

It must show each phase as protocol evidence, not as marketing copy.

## Interaction State Coverage

The Contract Viewer and Receipt Timeline must specify user-visible states before implementation. Empty states and uncertainty are part of the product, not edge cases.

| Surface | Loading | Empty | Error | Success | Partial / uncertain |
|---|---|---|---|---|---|
| Contract Viewer | Shows candidate is being canonicalized and names the runtime/receiver context when known | Shows no consequential action has been proposed yet and offers a demo fixture, not a dashboard | Shows schema, catalog, receiver, or canonicalization reason code with the failing field when non-secret | Shows exact contract, digest, bounds, receiver, side effects, idempotency, and expiry | Shows uncertainty or overreach markers and blocks any review action not bound to the exact digest |
| Receipt Timeline | Shows which evidence phase is pending and the last durable event offset | Shows no receipt exists for the selected action and links back to the contract or fixture run | Shows durable refusal, proof-gap, or reconstruction failure reason without collapsing them together | Shows proposal, policy, greenlight, receiver gate, mutation/refusal, finality, and receipt as separate evidence | Shows proof gap, downstream pending, reconciliation pending, isolation state, or missing runtime evidence as first-class rows |
| Refusal Detail | Shows policy or gate decision is being loaded | Shows no refusal exists because no decision was made | Shows malformed decision/refusal evidence as a protocol defect | Shows reason code, refusing actor, blocked mutation, and narrowed recovery path | Shows when refusal is recoverable by proposing a narrower future contract |
| Proof-Gap Detail | Shows evidence lookup in progress | Shows no gap exists for the action | Shows missing or contradictory evidence source without pretending finality | Shows gap resolved by reconciliation against the same receiver operation | Shows unresolved evidence requirement, owner, expiry, and whether isolation currently blocks future action |

## Required Distinctions

The timeline must distinguish:

- policy decision from greenlight;
- greenlight from receiver check;
- receiver check from downstream execution;
- pinned receiver policy from current receiver policy;
- mutation attempt from downstream success;
- reconciliation from new mutation authority;
- receipt from finality;
- proof gap from failure;
- refusal from error.

## Not In v0.2

Do not define org management, policy editing, fleet views, marketplace, incident workflows, or broad audit search as v0.2 product surfaces.

Those may become useful later. Right now, they would outrun activation.

Smallest next product shipment: render one receipt timeline from one reference receiver run.
