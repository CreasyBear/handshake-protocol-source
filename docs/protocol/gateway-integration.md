# Gateway Integration

Status: Canonical public alpha
Version: v0.2.4
Audience: Gateway owners, platform engineering, security engineering, protocol implementers
Implementation status: Reference gateway check, verified gateway-check artifact, package-install and repo-write adapter harnesses, recovery terminal conflict proof gaps, and Hono/D1 end-to-end package-install flow exist in v0.2; production gateways are target integrations
Canonical owner: Protocol owner
Last reviewed: 2026-05-19

## Invariant At Stake

The gateway owns the consequence. Therefore the gateway must enforce the exact greenlight before mutation.

If the gateway does not enforce, this is advisory, not Handshake.

## Gateway Contract

A gateway integration must declare:

- gateway ID;
- gateway kind;
- adapter ID and version;
- gate endpoint reference;
- gateway policy contract ID and version;
- gateway policy drift mode and compatible previous policy versions;
- accepted action catalog versions;
- resource namespace;
- canonicalizer version;
- receipt capability status;
- isolation-check capability status.

The kernel refuses contract emission if the gateway registry entry does not prove receipt and isolation-check capability.

## Gate Check

Before mutation, the gateway check must verify:

- greenlight exists;
- greenlight has not expired;
- greenlight has not been consumed;
- greenlight binds to the same action contract;
- gateway registry entry and version match the pinned contract/greenlight binding;
- gateway ID matches;
- current gateway policy is either the same version or explicitly compatible stricter;
- action class matches;
- resource reference matches;
- observed parameter digest matches;
- contract digest matches;
- current isolation state does not block the action.

Only after this check passes may the gateway attempt downstream mutation.

## Outcomes

The gateway must record one of these outcomes:

- gate passed and mutation attempt submitted;
- gate refused and mutation not attempted;
- proof gap because required evidence is missing or downstream status is unknown.
- surface operation reconciliation for a pending or unknown same-operation status check.

The receipt must not collapse these outcomes into a generic success message.

Reconciliation must bind to the original mutation attempt and idempotency key. It is a status lookup for the same surface operation, not a second mutation attempt or a public operation polling API.

Planned `02c` protocol lifecycle alignment will tighten this boundary with
request-context evidence, protocol-version checks, orphan-mitigation reason
codes, and internal protected-surface operation claims. Those claims are
gateway-side concurrency control state. They must not be exposed as `/claims/*`,
`/operations/*`, or `/last_operation` APIs.

## First Adapter Behind CLI/MCP

Gateway adapters sit behind the Handshake CLI/MCP protected action surface. The first adapter is a `repo_write_gateway` interface with a GitHub App-backed implementation.

The gateway is the credential-owning gateway/app, not GitHub itself, unless GitHub natively verifies a Handshake greenlight before consequence. For the first adapter, the GitHub App-backed `repo_write_gateway` owns the installation token and must check the exact one-use greenlight before using that token.

Target action:

```text
repo.write_file_to_pr
```

Target mutation shape:

```text
create or update generated branch under refs/heads/handshake/*
commit exact content bound by digest and byte length
open pull request to a protected base
record branch, commit, pull request, branch-protection status, or proof gaps separately
```

This first adapter explicitly does not perform direct protected-branch writes. Workflow-file writes are refused by default unless a later gateway policy explicitly grants that scope.

Gateway owner obligations:

- install the GitHub App-backed gateway for selected repositories;
- grant least privilege for contents and pull-request operations;
- keep workflow mutation out of scope by default;
- configure generated branch namespace and allowed base refs;
- recompute observed parameters before gate check;
- mutate only through a passed `VerifiedGatewayCheck`;
- reconcile GitHub operation evidence and create proof gaps for unknown downstream status.

## Reference Package-Install Adapter

`src/adapters/package-install/gateway.ts` is the first concrete gateway adapter seam.

It does not decide policy and does not issue greenlights. It accepts:

- a protocol interface exposing `gatewayCheck(...)` and `reconcileSurfaceOperation(...)`;
- an exact `actionContractId`;
- a one-use `greenlightId`;
- observed package-install parameters;
- a mutation surface that can update a package manifest.

The adapter sequence is deliberately narrow:

```text
gatewayCheck(actionContractId, greenlightId, observedParameters, pending operation ref)
  -> if gate refused: return without mutating the manifest
  -> if gate records a proof gap: return without mutating the manifest
  -> if gate passed: derive VerifiedGatewayCheck
  -> mutate manifest surface with VerifiedGatewayCheck
  -> reconcile the same mutationAttemptId + idempotencyKey
  -> return evidence ref from the manifest mutation
```

The invariant test uses a file-backed manifest surface, not the protocol store, so the no-mutation paths are checked against an external consequence target. Parameter mismatch, greenlight replay, and proof-gap gates leave the manifest unchanged. The mutation surface accepts a passed-only `VerifiedGatewayCheck`, not loose contract or greenlight IDs. Unknown downstream finality is recorded after a passed gate and mutation through reconciliation-created proof-gap evidence.

The end-to-end reference tests start at a generated package-install tool call, propose an exact contract, evaluate policy, pass the gateway check, mutate the file-backed manifest, and reconcile the same mutation attempt. The Hono/D1 path uses `HandshakeClient` and proves three outcomes: green path, parameter-mismatch refusal with no mutation, and unknown downstream finality recorded as a post-mutation `ProofGap`. The adapter never receives raw policy authority; it receives only an action contract ID, one-use greenlight ID, and observed parameters to verify.

## Reference Repo-Write Adapter

`src/adapters/repo-write/gateway.ts` is the second concrete gateway adapter seam.

It uses the same protocol interface as package install, but its consequence surface is a repository file write. The runtime proposes content by digest and byte length; the gateway adapter receives actual content, recomputes those fields, and sends only the digest-bound observed parameters to `gatewayCheck(...)`.

The Hono/D1 reference test proves:

- matching content digest writes the file only after a verified gateway check;
- raw file content is not stored in the `ActionContract` parameters;
- changed content is refused as `params_mismatch`;
- the refused path records a gate attempt and receipt but no `MutationAttempt`.

## Drift

Gateway policy version, canonicalizer version, resource namespace, and isolation-check capability are part of the contract boundary. If they drift, policy and gate checks must refuse, quarantine, or record a proof gap instead of smoothing over the mismatch.

The reference gate now records `pinnedGatewayPolicyVersion`, `currentGatewayPolicyVersion`, and `gatewayPolicyDriftStatus`. Same version continues. Explicit compatible stricter drift continues and is auditable. Incompatible or unknown policy drift refuses before mutation. Sequence dependencies are enforced at both boundaries: policy refuses a later contract before greenlight when any declared predecessor is missing, refused, or not greenlit; the gateway check refuses before mutation when any declared predecessor lacks a final passed receipt.

Recovery is not a gateway retry hook. A `RecoveryRecommendation` can reference the source receipt, gate attempt, mutation attempt, or proof gap and recommend narrower future action classes or human review. A follow-up `ActionContract` can link to the recommendation only after matching scope, timing, sequence, action class, and required new evidence. It supersedes the recommendation with a durable status transition and terminal claim, but it cannot call the gateway, cannot reuse the consumed greenlight, and cannot create a mutation attempt. A terminal-claim loser records a recovery-phase `ProofGap`, not a gateway action. Resolving that proof gap requires the observed winning terminal transition and still does not create gateway authority.

Active next mechanism: specify the GitHub App-backed `repo_write_gateway` gateway adapter as the first adapter behind the Handshake CLI/MCP surface. The existing package-install and repo-write adapters remain reference proofs for pass, mismatch refusal, replay refusal, proof gap, and same-operation reconciliation; a fixture runner may validate them as conformance evidence but must not become the production gateway shape.
