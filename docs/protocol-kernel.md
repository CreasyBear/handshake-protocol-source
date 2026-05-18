# Protocol Kernel

Status: Canonical public alpha
Version: v0.2.1
Audience: Protocol implementers, runtime builders, gateway owners, platform engineering
Implementation status: Backed by TypeScript schemas, Hono routes, and reference storage in this repo
Canonical owner: Protocol owner
Last reviewed: 2026-05-18

## Invariant At Stake

The kernel must prevent callers from jumping from vague intent or generated orchestration directly to mutation.

Authority must pass through the protocol loop:

```text
intent compilation
  -> action contract
  -> policy decision
  -> greenlight or refusal
  -> gateway check attempt
  -> mutation attempt, gateway refusal, or proof gap
  -> receipt
  -> stream event chain
  -> isolation state for future decisions and gates
```

## Core Objects

`ToolCapability` declares what a runtime can call and whether that capability is read-only, consequential, ambiguous, wrapped, or bypass-prone.

`ActionType` declares the narrower set of consequential action classes Handshake knows how to contract.

`GatewayRegistryEntry` binds a gateway ID to an adapter, gateway policy version, drift semantics, resource namespace, gate endpoint, receipt capability, and isolation-check capability.

`OperatingEnvelope` authorizes action attempts inside declared bounds. It is not mutation authority.

`IntentCompilationRecord` records what the compiler saw: principal intent, runtime identity, catalogs, generated code or spec refs, assumptions, uncertainty markers, rejected overreach, and candidate actions.

`ActionContract` is the exact proposed commitment: gateway registry entry/version, gateway policy, action class, resource, parameters, parameter digest, bounds, expected side effects, idempotency key, sequence number, required prior action contract IDs, optional recovery recommendation linkage, and canonical digest.

`PolicyDecision` evaluates the exact contract against the envelope, policy pack, isolation state, and declared sequence dependencies.

`Greenlight` binds one policy decision to one exact contract and one gateway-checked attempt. It has `maxUses: 1`.

`GatewayCheckAttempt` records the gateway-side check before mutation, including pinned vs current gateway policy version and drift status.

`MutationAttempt` records whether the gateway attempted downstream work after the gate passed.

`SurfaceOperationReconciliation` records same-operation status checks after a pending or unknown downstream outcome. It binds to the original mutation attempt and idempotency key; it does not authorize another mutation.

`ProofGap` records missing, invalid, expired, contradictory, or unavailable evidence.

Recovery terminal conflicts are also proof gaps. If a follow-up proposal or explicit expiration loses the `recovery_terminal_claims` race, the kernel emits a `ProofGap` with `gapPhase: recovery`, `reasonCode: recovery_terminal_conflict`, and `finalityImpact: none` instead of pretending the failed proposal never existed.

`RecoveryTerminalConflictResolution` is a transition, not a new authority object. It updates only the unresolved recovery-phase `ProofGap`, sets `resolvedByRef` to the observed winning `RecoveryRecommendationStatusTransition`, and emits `proof_gap_resolved`. It cannot persist the losing proposal, create another terminal claim, or infer gateway authority.

`Receipt` reconstructs the execution chain without pretending that gateway check equals downstream success. It carries `streamOffsets` for the action, run, and gateway-resource partitions it summarizes, plus `receiptDigest` and `auditChainDigest` for tamper-evident export.

`ReceiptExport` is a drop copy of existing receipt evidence. It verifies receipt and audit-chain digests, carries status splits, stream windows, proof-gap refs, evidence refs, retention metadata, and export digest. It does not create greenlights, gates, mutation attempts, or downstream proof.

`RecoveryRecommendation` records a narrowed path after a refusal, proof gap, failed, unknown, or suspect receipt. It verifies receipt digest material, binds to the source refusal or gap, carries required new evidence and review timing, and fixes `mustCreateNewActionContract: true`, `mayReuseGreenlight: false`, and `mayMutateProtectedSurface: false`.

`RecoveryRecommendationStatusTransition` records the explicit close of an open recovery recommendation as `expired` or `superseded`. It carries previous/next status, reason, actor reference, recommendation digest, optional superseding action contract ID, and transition digest. The same commit writes a `recovery_terminal_claims` row so only one terminal transition can win under concurrent follow-up proposals.

`IsolationState` is durable interdict state checked before future policy decisions and gateway checks. It can carry `observedStreamOffsets` so a breaker-triggered isolation records the exact stream partitions, offsets, and tail digests it observed.

`BreakerDecision` records a listener decision over observed stream watermarks and atomically creates the resulting `IsolationState`. The kernel validates each claimed watermark against durable stream events before writing either object.

`ContractStreamEvent` gives the chain replayable event structure.

It is not a log label. It carries `streamId`, `streamScope`, `partitionKey`, `offset`, `previousEventDigest`, and `eventDigest`. Action lifecycle events are emitted into three digest-linked partitions:

- `action:{actionContractId}` reconstructs one exact proposal-to-receipt chain.
- `run:{runId}` reconstructs ordered behavior across contracts from the same generated run.
- `protected_surface_resource:{gatewayId}:{resourceRef}` reconstructs ordering against one gateway-owned resource.

Lifecycle stream appends are conflict-aware. Intent compilation, action proposal, policy decisions, greenlights, review decisions, isolation state, and gateway-check records commit with their stream events. If the D1 write detects that another event already claimed the planned offset, the kernel rebuilds the event chain from the new tail and retries the atomic commit. A protocol object may not persist as authoritative evidence without its stream event.

The reference implementation keeps primitive logic in separate modules: durable object schemas, request input schemas, intent compilation, action contract proposal, policy decisions, review decisions, isolation state writes, transition guards, gateway-check enforcement, surface-operation reconciliation, proof gaps, durable recording, and stream event construction are independent of the Hono routes and storage adapters. `HandshakeKernel` is a façade over these modules and the `ProtocolStore` interface; it should not absorb gateway-specific policy, runtime plugin logic, or product UI state.

The package-install reference flow now exercises this separation end to end: a runtime wrapper may compile and propose, policy may greenlight, and a gateway adapter may mutate only after the gateway check consumes the exact greenlight, passes, and yields a `VerifiedGatewayCheck`. The tests assert the external manifest is unchanged before the gate and that proof-gap gates do not create adapter mutation authority. The Hono/D1 path proves the same chain through `HandshakeClient`, including a parameter-mismatch gateway refusal with no mutation attempt and an unknown-finality proof gap created by post-mutation reconciliation.

The recovery recommendation path exercises the post-failure boundary. A proof-gap receipt can produce a `RecoveryRecommendation` on the same action/run/resource stream, but a final successful receipt cannot. A later `ActionContract` can link to that recommendation only when it matches scope, sequence, allowed action class, timing, and required new evidence. The linked proposal supersedes the recommendation in the same lifecycle commit. If a stale competing follow-up loses the terminal claim race, the kernel records a recovery-phase proof gap; once the winning transition is observed, that gap can be resolved without retroactively persisting the loser. The recommendation creates no greenlight, no gateway check attempt, and no mutation attempt.

The repo-write reference flow exercises the same primitive against a different consequence shape. It binds repository file content by digest and byte length, omits raw content from the `ActionContract`, recomputes the digest at the gateway adapter, and refuses mutation when actual content diverges from the contract.

The codemode multi-action reference flow exercises generated orchestration. It emits ordered package-install and repo-write contract proposals through the same Hono/D1 protocol surface, records candidate refusals as compiler evidence, binds later contracts to prior contract IDs, and proves the runtime wrapper receives no policy, greenlight, gateway-check, or mutation authority. Policy refuses a later contract while any required predecessor is missing, refused, or not greenlit. The gateway check refuses a later contract while any required predecessor lacks a final passed receipt.

## Transition Guards

The reference kernel exports an explicit transition table in `src/protocol/transitions.ts`.

| Transition | Guard |
|---|---|
| external configuration -> durable catalog/envelope | Only catalog objects and operating envelopes may be written directly. |
| principal intent -> intent compilation | Compilation records uncertainty; it does not mint authority. |
| clean intent compilation -> action proposed | Compilation, envelope, gateway, principal, agent, run, tenant, and organization bindings must match. |
| action proposed -> policy decision | Policy may evaluate only the envelope pinned by the action contract, and a greenlight candidate must satisfy declared prior contract dependencies. |
| policy decision -> greenlight | One action contract may receive only one greenlight. A retry needs a new narrowed contract. |
| review required -> review decision | Review may bind only to the exact policy decision that required review. |
| greenlight -> gateway check | Gate authority must come from a greenlight policy decision. Binding mismatches and unsatisfied sequence dependencies become gateway refusals before mutation. |
| pending/unknown mutation -> surface operation reconciliation | Reconciliation must bind to the same mutation attempt and idempotency key. |
| refusal/proof-gap receipt -> recovery recommendation | Recovery may recommend a narrowed future contract or review path only. It cannot reuse a greenlight or mutate gateway state. |
| recovery recommendation -> action proposed | Follow-up proposal must validate recommendation scope, freshness, allowed action class, required evidence, and later sequence number. It inherits no greenlight. |
| open recovery recommendation -> status changed | Status may move to expired or superseded only with a durable `RecoveryRecommendationStatusTransition` and one terminal claim. |

Invalid edges fail closed before authority expands.

## Forbidden Shortcuts

These edges are invalid:

```text
intent -> greenlight
contract -> mutation
runtime plugin decision -> mutation authority
greenlight -> downstream success
receipt -> downstream success
proof gap -> success
review screen -> authority
reconciliation -> new mutation authority
recovery recommendation -> mutation authority
```

If generated code can call an unwrapped consequential tool, the generated code escaped the contract boundary.

If the gateway does not check the greenlight before mutation, this is advisory, not Handshake.

If one greenlight can authorize more than one mutation attempt, this is ambient authority wearing a badge.

If the receipt cannot distinguish gateway check from downstream execution, this is evidence theatre.

## Determinism

Contracts must be canonicalized deterministically. Policy must evaluate the canonical contract, current isolation state, and declared sequence dependencies. Gateway gates must compare the exact contract digest, gateway registry entry, gateway policy drift status, gateway ID, action class, resource, parameter digest, freshness window, isolation snapshot, greenlight consumption state, and prior final receipt state.

The model may compile intent. It may propose. It may render. None of that is authority.

Protocol next mechanism: cut a v0.2 protocol-kernel checkpoint, then require an ADR before changing the control object model. This is separate from the CLI/MCP product-surface shipment and its first gateway adapter.
