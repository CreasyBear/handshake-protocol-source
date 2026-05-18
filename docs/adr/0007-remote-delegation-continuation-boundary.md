# ADR 0007: Remote Delegation And Continuation Boundary

Status: Accepted
Date: 2026-05-19
Owner: Product and protocol owner
Implementation owner: future remote-delegation and continuation plan
Depends on: [`0005-hosted-transition-caller-identity.md`](./0005-hosted-transition-caller-identity.md), [`0006-agent-native-surface-binding.md`](./0006-agent-native-surface-binding.md)
Informed by: [`../reference/agentic-repo-source-study-2026-05-19.md`](../reference/agentic-repo-source-study-2026-05-19.md)
Blocks: A2A, remote-agent, scheduled-job, retry, continuation, and long-running hosted workflow claims

## Invariant At Stake

Remote work and resumed work are not fresh authority.

Agent ecosystems are normalizing A2A task handoff, remote agent calls, durable
workflow checkpoints, scheduled jobs, retries, self-fired continuations, hosted
browser sessions, and crash recovery. Those are useful execution shapes. They
also create a dangerous authority gap: a later process can continue a vague
intent after the original caller, context, envelope, or greenlight has expired.

## Decision

Handshake will treat remote delegation and async continuation as evidence paths
that must preserve or re-bind to the original authority boundary.

A remote task result, resumed job, retry, checkpoint, or replayed continuation
may inform compilation. It may not authorize mutation.

The authority path remains:

```text
ActionContract
  -> PolicyDecision
  -> one-use Greenlight
  -> GatewayCheckAttempt
```

Remote or resumed work must either:

- bind back to a still-valid operating envelope and exact contract boundary; or
- refuse before contract proposal; or
- create post-contract proof-gap/isolation evidence if the action had already
  entered the authority path and later evidence is missing.

## Primitive

Future implementation plans must define evidence records equivalent to:

```text
RemoteDelegationRecord
  remoteTaskId
  remoteCallerIdentityRef
  remoteAgentIdentityRef
  remoteRuntimeIdentityRef
  sourceSurfaceBindingRef
  requestedCapabilityDigest
  taskState
  cancellationState
  resultDigest
  resultEvidenceClass
  capabilityDiscoveryDigest
  redactionPosture
  createdAt
  updatedAt
```

```text
ContinuationRecord
  continuationId
  sourceRunRef
  sourceSurfaceBindingRef
  sourceOperatingEnvelopeRef
  sourceActionContractRef?
  reason
  retryAttempt
  scheduledFor
  expiresAt
  isolationStateRef
  resumeContextDigest
  continuationPolicyVersion
```

The exact storage choice belongs to implementation plans. The semantics do not.

## Boundary Rules

1. Remote caller identity must be derived from a verified request boundary or
   signed service credential. Metadata supplied by a remote agent is audit
   material, not caller identity.
2. Remote task states must distinguish submitted, working, input-required,
   completed, failed, canceled, expired, and unknown.
3. A remote result is evidence only until Handshake compiles and contracts the
   local protected action.
4. Capability discovery must redact tenant, org, user, integration, secret, and
   protected-resource fingerprints unless a future public evidence ADR allows a
   projection.
5. Scheduled jobs, retries, crash recovery, and queued continuations must carry
   the original caller, envelope, context, isolation, and expiry evidence.
6. A consumed greenlight cannot be reused by a retry or continuation.
7. Gateway checks must re-check current isolation and policy drift even when a
   continuation began from a previously valid decision.

## Non-Claims

- This ADR does not implement A2A.
- This ADR does not choose a remote-agent protocol.
- This ADR does not make remote agent identity into principal authority.
- This ADR does not let remote task completion authorize mutation.
- This ADR does not make durable workflow checkpoints equivalent to receipts.
- This ADR does not allow retries to mint fresh greenlights without policy.

## Rejected Alternatives

### Trust Remote Task Completion

Rejected. A remote agent saying "completed" proves only that the remote system
reported a state. It does not prove local principal authority, policy approval,
gateway acceptance, or downstream mutation proof.

### Let Continuations Reconstruct Missing Authority From Context

Rejected. Reconstructing authority from old state lets retry infrastructure
overreach the principal. Continuations must carry the authority refs they need or
refuse.

### Publish Capability Inventory As A Discovery Card

Rejected for protected capabilities. Discovery cards can leak which providers,
resources, tenants, or integrations are guarded. Public discovery needs a
redaction plan before use.

## Proof Plan

The future plan must prove:

1. A remote completed task cannot produce an `ActionContract` without local
   surface binding and policy input.
2. A canceled or expired remote task cannot continue into a protected mutation.
3. A retry cannot reuse a consumed greenlight.
4. A continuation refuses when the source envelope is expired or isolation has
   changed.
5. Public capability discovery redacts protected inventory by default.

Smallest next mechanism: add a remote-task fixture that returns a plausible
result but produces only evidence until locally bound to a new candidate.
