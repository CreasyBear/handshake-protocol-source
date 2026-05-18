# Receiver Integration

Status: Canonical public alpha  
Version: v0.2.0  
Audience: Receiver owners, platform engineering, security engineering, protocol implementers  
Implementation status: Reference receiver gate, verified receiver-gate artifact, package-install and repo-write adapter harnesses, recovery terminal conflict proof gaps, and Hono/D1 end-to-end package-install flow exist in v0.2; production receivers are target integrations  
Canonical owner: Protocol owner  
Last reviewed: 2026-05-18

## Invariant At Stake

The receiver owns the consequence. Therefore the receiver must enforce the exact greenlight before mutation.

If the receiver does not enforce, this is advisory, not Handshake.

## Receiver Contract

A receiver integration must declare:

- receiver ID;
- receiver kind;
- adapter ID and version;
- gate endpoint reference;
- receiver policy contract ID and version;
- receiver policy drift mode and compatible previous policy versions;
- accepted action catalog versions;
- resource namespace;
- canonicalizer version;
- receipt capability status;
- isolation-check capability status.

The kernel refuses contract emission if the receiver registry entry does not prove receipt and isolation-check capability.

## Gate Check

Before mutation, the receiver gate must verify:

- greenlight exists;
- greenlight has not expired;
- greenlight has not been consumed;
- greenlight binds to the same action contract;
- receiver registry entry and version match the pinned contract/greenlight binding;
- receiver ID matches;
- current receiver policy is either the same version or explicitly compatible stricter;
- action class matches;
- resource reference matches;
- observed parameter digest matches;
- contract digest matches;
- current isolation state does not block the action.

Only after this check passes may the receiver attempt downstream mutation.

## Outcomes

The receiver must record one of these outcomes:

- gate passed and mutation attempt submitted;
- gate refused and mutation not attempted;
- proof gap because required evidence is missing or downstream status is unknown.
- receiver operation reconciliation for a pending or unknown same-operation status check.

The receipt must not collapse these outcomes into a generic success message.

Reconciliation must bind to the original mutation attempt and idempotency key. It is a status lookup for the same receiver operation, not a second mutation attempt.

## Reference Package-Install Adapter

`src/adapters/package-install/receiver.ts` is the first concrete receiver adapter seam.

It does not decide policy and does not issue greenlights. It accepts:

- a protocol interface exposing `receiverGate(...)` and `reconcileReceiverOperation(...)`;
- an exact `actionContractId`;
- a one-use `greenlightId`;
- observed package-install parameters;
- a mutation surface that can update a package manifest.

The adapter sequence is deliberately narrow:

```text
receiverGate(actionContractId, greenlightId, observedParameters, pending operation ref)
  -> if gate refused: return without mutating the manifest
  -> if gate passed or records downstream proof gap: derive VerifiedReceiverGateCheck
  -> mutate manifest surface with VerifiedReceiverGateCheck
  -> reconcile the same mutationAttemptId + idempotencyKey
  -> return evidence ref from the manifest mutation
```

The invariant test uses a file-backed manifest surface, not the protocol store, so the no-mutation paths are checked against an external consequence target. Parameter mismatch and greenlight replay both leave the manifest unchanged. The mutation surface accepts a `VerifiedReceiverGateCheck`, not loose contract or greenlight IDs. A proof-gap gate is not a refusal: it means the exact greenlight was consumed and the receiver operation exists, but downstream finality was not yet proven.

The end-to-end reference tests start at a generated package-install tool call, propose an exact contract, evaluate policy, pass the receiver gate, mutate the file-backed manifest, and reconcile the same mutation attempt. The Hono/D1 path uses `HandshakeClient` and proves three outcomes: green path, parameter-mismatch refusal with no mutation, and unknown downstream finality with a resolved `ProofGap`. The adapter never receives raw policy authority; it receives only an action contract ID, one-use greenlight ID, and observed parameters to verify.

## Reference Repo-Write Adapter

`src/adapters/repo-write/receiver.ts` is the second concrete receiver adapter seam.

It uses the same protocol interface as package install, but its consequence surface is a repository file write. The runtime proposes content by digest and byte length; the receiver adapter receives actual content, recomputes those fields, and sends only the digest-bound observed parameters to `receiverGate(...)`.

The Hono/D1 reference test proves:

- matching content digest writes the file only after a verified receiver gate;
- raw file content is not stored in the `ActionContract` parameters;
- changed content is refused as `params_mismatch`;
- the refused path records a gate attempt and receipt but no `MutationAttempt`.

## Drift

Receiver policy version, canonicalizer version, resource namespace, and isolation-check capability are part of the contract boundary. If they drift, policy and gate checks must refuse, quarantine, or record a proof gap instead of smoothing over the mismatch.

The reference gate now records `pinnedReceiverPolicyVersion`, `currentReceiverPolicyVersion`, and `receiverPolicyDriftStatus`. Same version continues. Explicit compatible stricter drift continues and is auditable. Incompatible or unknown policy drift refuses before mutation. Sequence dependencies are enforced at both boundaries: policy refuses a later contract before greenlight when any declared predecessor is missing, refused, or not greenlit; the receiver gate refuses before mutation when any declared predecessor lacks a final passed receipt.

Recovery is not a receiver retry hook. A `RecoveryRecommendation` can reference the source receipt, gate attempt, mutation attempt, or proof gap and recommend narrower future action classes or human review. A follow-up `ActionContract` can link to the recommendation only after matching scope, timing, sequence, action class, and required new evidence. It supersedes the recommendation with a durable status transition and terminal claim, but it cannot call the receiver, cannot reuse the consumed greenlight, and cannot create a mutation attempt. A terminal-claim loser records a recovery-phase `ProofGap`, not a receiver action. Resolving that proof gap requires the observed winning terminal transition and still does not create receiver authority.

Smallest next mechanism: cut a v0.2 protocol-kernel checkpoint, then require an ADR before changing the control object model.
