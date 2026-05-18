# API Protocol Reference

Status: Canonical public alpha reference
Version: v0.2.1
Audience: Protocol implementers, SDK authors, runtime and gateway integrators
Implementation status: Backed by current `/v0.2/*` routes, `GET /openapi.json`, SDK calls, and D1-backed adapter tests, including recovery terminal conflict proof gaps
Canonical owner: Protocol owner
Last reviewed: 2026-05-18

## Authority Boundary

The API does not let callers jump from intent to mutation. Every consequential action must pass through this sequence:

```text
intent compilation
  -> action contract
  -> policy decision
  -> greenlight
  -> gateway check
  -> mutation/refusal/proof gap
  -> receipt
```

Forbidden direct edges:

```text
intent -> greenlight
contract -> mutation
greenlight -> execution proof
receipt -> business success
proof gap -> success
```

## Route Semantics

| Route | Authority meaning |
|---|---|
| `POST /v0.2/intent-compilations` | Records what the compiler believed, rejected, and could not prove after loading durable tool/action/gateway records. |
| `POST /v0.2/action-contracts` | Emits an exact gateway-bound contract only from a clean compilation and durable envelope/gateway records. |
| `POST /v0.2/policy-decisions` | Evaluates the exact contract against envelope, isolation state, and declared sequence dependencies. |
| `POST /v0.2/review-decisions` | Records review against exact contract digest and policy input digest. |
| `POST /v0.2/gateway-check-attempts` | Final enforcement check before mutation. |
| `POST /v0.2/surface-operation-reconciliations` | Reconciles the same mutation attempt by idempotency key; unknown downstream finality creates a proof gap instead of success. |
| `POST /v0.2/isolation-states` | Writes durable interdict state checked by policy and gate, optionally bound to observed stream offset watermarks. |
| `POST /v0.2/breaker-decisions` | Records a breaker listener decision, validates observed stream watermarks, and atomically creates the resulting isolation state. |
| `POST /v0.2/receipt-exports` | Packages an existing receipt as a tamper-evident drop copy without creating execution proof. |
| `POST /v0.2/recovery-recommendations` | Records a narrowed recovery path from refusal or proof-gap evidence without reusing a greenlight or mutating a gateway. |
| `POST /v0.2/recovery-recommendation-status-transitions` | Moves an open recovery recommendation to expired or superseded with durable transition evidence; losing terminal-claim races record recovery-phase proof gaps. |
| `POST /v0.2/recovery-terminal-conflict-resolutions` | Resolves a recovery terminal conflict proof gap only after loading the winning terminal transition. |

## Caller-Supplied Objects Are Not Authority

The compiler request may name candidate tool/action/gateway IDs, but the kernel loads the corresponding protocol records from storage. A caller cannot make a consequential tool acceptable by posting a fake `ToolCapability` inline, and cannot make a gateway enforceable by posting a fake gateway policy inline.

```text
candidate IDs from request
  -> durable ToolCapability / ActionType / GatewayRegistryEntry lookup
  -> uncertainty marker if missing
  -> no action contract while uncertainty or overreach exists
```

## Canonical Contract Binding

An `ActionContract` carries both raw parameters for gateway execution and a non-secret parameter summary for review. The contract digest is computed over the exact gateway-bound binding, not over review prose.

```text
gatewayId
gatewayRegistryEntryId
gatewayRegistryVersion
gatewayPolicyVersion
actionClass
resourceRef
paramsDigest
bounds
idempotencyKey
recoveryRecommendationId
recoverySourceReceiptId
recoveryRecommendationDigest
canonicalizerVersion
  -> actionContractDigest
  -> optional contractSignature
```

`recoveryRecommendationId` is evidence linkage only. When present, the kernel loads the durable `RecoveryRecommendation` and refuses proposal unless the recommendation is open, unexpired, inside retry timing, same principal/agent/run/gateway/resource scope, later in sequence than the source contract, names the proposed action class, and has all required new evidence in `evidenceRefs`. The resulting `ActionContract` still needs normal policy evaluation, greenlight issuance, gateway-check check, and receipt.

## Receipt Semantics

A receipt is not downstream business success. It carries distinct statuses:

```text
policyDecisionStatus
gatewayCheckStatus
greenlightConsumptionStatus
mutationAttemptStatus
downstreamExecutionStatus
proofGapIds
finalityStatus
```

If downstream status is pending, finality is `pending`, not success. If downstream status is unknown, the kernel emits a `ProofGap` and marks finality as `unknown`.

Receipts also carry `streamOffsets` for the replayable partitions they summarize:

```text
streamId
streamScope
partitionKey
offsetStart
offsetEnd
terminalEventDigest
```

This lets an exported receipt point back to exact action, run, and gateway-resource event windows instead of asking auditors to infer the chain from prose.

The kernel also computes:

```text
receiptDigest
auditChainDigest
```

`receiptDigest` binds the receipt body after stream references are attached. `auditChainDigest` binds the receipt digest to terminal stream digests, proof gaps, and finality. These digests make exported receipts tamper-evident; they still do not turn a receipt into downstream business success.

## Receipt Export

Receipt export is evidence packaging only. The request names an existing receipt and export metadata:

```text
receiptId
exportFormat
redactionProfileRef
requestedByRef
evidenceRetentionUntil
```

The kernel refuses export when the receipt has missing stream windows or stale digest material. A successful `ReceiptExport` copies the receipt's split statuses, proof-gap refs, evidence refs, stream offsets, `receiptDigest`, and `auditChainDigest`, then adds an `exportDigest`. It does not consume a greenlight, does not call a gateway check, and does not create a mutation attempt.

## Recovery Recommendation

Recovery is not retry authority. The request names an existing receipt and a refusal or proof-gap reference:

```text
sourceReceiptId
sourceRefusalOrGapRef
recommendedPath
allowedNextActionClasses
requiredNewEvidence
requiresHumanReview
reasonCode
reasonSummary
```

The source receipt must be refused, proof-gapped, failed, unknown, or suspect. The kernel rejects final successful receipts, stale receipt digests, source refs that do not belong to the receipt, and future-mutation paths that do not name an allowed next action class.

A successful `RecoveryRecommendation` copies the source receipt digest, audit-chain digest, stream offsets, proof-gap refs, missing evidence refs, principal/agent/run/gateway/resource binding, and derived recovery flags. Its authority fields are fixed:

```text
mustCreateNewActionContract = true
mayReuseGreenlight = false
mayMutateProtectedSurface = false
```

Any later consequential action still needs a fresh `ActionContract`, policy decision, one-use greenlight, gateway check, and receipt.

A follow-up proposal can link to recovery evidence with:

```text
recoveryRecommendationId
```

That link copies `recoverySourceReceiptId` and `recoveryRecommendationDigest` into the new `ActionContract`. It does not copy the old greenlight, does not satisfy policy by itself, and does not bypass the gateway check.

When a linked follow-up `ActionContract` is proposed, the same lifecycle commit records a `RecoveryRecommendationStatusTransition` from `open` to `superseded` and writes a `recovery_terminal_claims` row keyed by the recommendation ID. That terminal claim is the race-safe guard: a second concurrent follow-up or expiration loses before any new protocol records persist.

Explicit expiration uses:

```text
recoveryRecommendationId
nextStatus = expired
reasonCode
reasonSummary
changedByRef
```

The kernel refuses expiration before `recoveryExpiresAt`. Superseding requires a linked follow-up action contract. Status transition records carry `previousStatus`, `nextStatus`, `recommendationDigest`, `changedByRef`, optional `supersededByActionContractId`, and `transitionDigest`.

If the terminal claim already exists, the kernel returns `recovery_terminal_conflict`, records no follow-up `ActionContract` or status transition, and emits a recovery-phase `ProofGap` on the source action stream:

```text
gapPhase = recovery
expectedEvidenceType = single_recovery_terminal_claim
reasonCode = recovery_terminal_conflict
finalityImpact = none
receiptId = sourceReceiptId
```

Resolution is a separate evidence transition, not a retry. The request binds the unresolved recovery-phase proof gap to the winning terminal transition:

```text
proofGapId
recoveryRecommendationStatusTransitionId
observedByRef
```

The kernel rejects resolution unless the `ProofGap` is unresolved, has `gapPhase = recovery`, has `reasonCode = recovery_terminal_conflict`, names the same `recovery_terminal_claim:<recommendationId>`, and matches the transition's source receipt/action evidence. It then updates only the `ProofGap`:

```text
resolvedByRef = recoveryRecommendationStatusTransitionId
eventType = proof_gap_resolved
```

It does not persist the losing follow-up action contract or expiration transition, does not create a second terminal claim, and does not create gateway authority.

## Gateway Operation Reconciliation

Reconciliation is not retry authority. It may inspect the gateway-side operation that was already attempted, but it must not create a second mutation attempt.

The reconciliation request must bind to:

```text
mutationAttemptId
idempotencyKey
observedSurfaceOperationRef
observedDownstreamStatus
evidenceRefs
resolvedProofGapIds
```

The kernel rejects reconciliation if the idempotency key does not match the original mutation attempt, if the surface operation ref conflicts, or if the mutation was already final. Proof gap resolution preserves the original `ProofGap` and writes `resolvedAt` / `resolvedByRef` against the reconciliation object.

## Review Binding

A review decision is not authority by itself. Policy may honor it only when it binds to the current exact contract and policy input:

```text
reviewArtifactRef
reviewRenderSchemaVersion
reviewerPrincipalId
actionContractDigest
policyInputDigest
gatewayPolicyVersion
decisionExpiresAt
  -> ReviewDecision
  -> policy may convert review_required to greenlight
```

If isolation state, gateway policy, or contract digest changes after review, the policy input digest no longer matches and the review is refused.

## Lifecycle Commit Boundary

Lifecycle records and their stream events commit together:

```text
intent compilation + intent_compiled
action contract + action_proposed
policy decision + policy_decision_recorded + action_refused/review_required/action_greenlit
review decision + review_decision_recorded
isolation state + isolation_changed
```

If the stream offset is stale, the store returns `stream_conflict`, the kernel rebuilds the event chain from the fresh tail, and the record is not committed without its event evidence.

## Transition Enforcement

The API surface is not just route order. The kernel rejects invalid state edges:

```text
direct greenlight write -> invalid_transition_direct_protocol_write
policy evaluation with a different envelope -> invalid_transition_envelope_mismatch
second greenlight for one action contract -> invalid_transition_greenlight_already_issued
review for a non-review policy decision -> review_not_required
gateway check from a non-greenlight policy decision -> invalid_transition_policy_not_greenlight
```

A retry that needs new authority must create a new action contract. Reusing the same contract to mint another greenlight is ambient authority wearing a badge.

## Sequence Dependencies

Generated programs may propose multiple consequential contracts, but order is not inferred from array position or runtime trace. A later contract must explicitly carry:

```text
sequenceNumber
requiredPriorActionContractIds
```

Policy loads each required predecessor from durable protocol records. A contract that would otherwise be greenlit is refused when a declared predecessor is missing, was refused, or has not produced a durable greenlight:

```text
prior_action_missing
prior_action_refused
prior_action_not_greenlit
```

The policy input digest includes the observed sequence dependency state. A review or greenlight cannot rely on stale hidden ordering assumptions from the generated program.

The gateway check then re-checks the same dependency list against receipt evidence. A later contract is refused before mutation when a required predecessor has no final passed receipt:

```text
prior_action_not_receipted
prior_action_gate_refused
prior_action_not_final
```

A prior greenlight is not enough. Greenlight is authority to attempt, not proof that the prior gateway-owned consequence happened.

## Gateway Policy Drift

The contract and greenlight pin the gateway registry entry/version and gateway policy version accepted at proposal and policy time. The gate reloads the current durable gateway registry entry before mutation.

Drift semantics are explicit:

```text
same_version -> continue
compatible_stricter -> continue and record drift on GatewayCheckAttempt
incompatible -> gateway_policy_drift refusal before mutation
unknown -> gateway_policy_unknown refusal before mutation
```

A current gateway may declare `allow_compatible_stricter` only with explicit `compatiblePreviousGatewayPolicyVersions`. Otherwise version drift fails closed.

## Gateway Check Commit Boundary

The gateway check is the final enforcement point. Its durable write set is committed together:

```text
optional greenlight consumption
  + updated greenlight record
  + gateway check attempt
  + mutation attempt or proof gap
  + receipt
  + stream events
```

On D1 this maps to `batch()`, which Cloudflare documents as transactional: a failed statement rolls back the sequence. A replay race produces a recorded refusal receipt and no mutation attempt.

If another writer wins the same stream partition offset, the store returns `stream_conflict`. The kernel rebuilds the gateway-check event chain from the fresh stream tail and retries the atomic commit. Mutation is not attempted under an event chain whose `previousEventDigest` no longer matches the durable tail.

## Contract Stream Ordering

Every stream event has:

```text
streamId
streamScope
partitionKey
offset
previousEventDigest
eventDigest
```

Action lifecycle events are emitted to replayable partitions:

```text
action:{actionContractId}
run:{runId}
protected_surface_resource:{gatewayId}:{resourceRef}
```

Each partition has independent offsets and digest chaining. The action partition must replay in order:

```text
action_proposed
  -> policy_decision_recorded
  -> action_greenlit or action_refused/review_required
  -> gateway_checked
  -> mutation_attempted or proof_gap_recorded
  -> receipt_emitted
```

The digest for each event includes its stream scope, partition, offset, previous digest, object refs, event type, event time, and payload. A broken `previousEventDigest` link means the reconstruction chain is suspect.

Stream append conflict is not silently ignored. The reference kernel retries against the new tail; if it cannot commit a contiguous chain after bounded retries, it fails closed with `stream_append_conflict`.

## Isolation Watermarks

Isolation is not just a flag. A breaker-triggered `IsolationState` may carry:

```text
streamId
partitionKey
observedOffsetStart
observedOffsetEnd
observedEventDigest
```

Those watermarks say which replayable stream window the breaker observed before writing the interdict. `POST /v0.2/breaker-decisions` refuses missing or mismatched tail digests before it records the `BreakerDecision` or `IsolationState`.

```text
durable stream event at observedOffsetEnd missing -> breaker_watermark_event_missing
observedEventDigest missing -> breaker_watermark_digest_missing
observedEventDigest mismatch -> breaker_watermark_digest_mismatch
```

Policy and gateway checks still enforce the resulting isolation state; the watermark exists for reconstruction and later breaker auditing.

## Durable HTTP Integration Check

The reference test harness applies the D1 migration, routes requests through the Hono `/v0.2/*` surface, and uses the D1 store adapter for protocol records, greenlight consumption, and stream events. The integration proves the public API can drive:

```text
catalog registration
  -> intent compilation
  -> action contract
  -> policy greenlight
  -> pending gateway check mutation
  -> surface operation reconciliation
```

The assertions are protocol assertions, not route smoke tests: one mutation attempt, one reconciliation record, contiguous action/run/gateway-resource stream offsets, and unbroken previous-event digest chains.

The reference suite also runs the package-install runtime wrapper and gateway adapter through `HandshakeClient` against the same Hono/D1 surface. The green path mutates only after a passed verified gateway check and reconciles the same mutation attempt. The parameter-mismatch path records a gateway-check refusal and receipt, leaves the file-backed manifest unchanged, and creates no `MutationAttempt`. The unknown-finality path passes the gate first, mutates through `VerifiedGatewayCheck`, records `surface_operation_reconciled`, and then records a reconciliation-created `proof_gap_recorded` event for missing downstream finality evidence.

A second Hono/D1 adapter path covers repository file writes. It proves a runtime can contract a repo mutation by content digest and byte length, not raw content, and that the gateway refuses a changed-content attempt before creating a `MutationAttempt`.

The codemode multi-action wrapper covers generated programs that propose multiple consequential actions in order. It records one `IntentCompilationRecord` per candidate and one `ActionContract` per clean candidate, but no `PolicyDecision`, `Greenlight`, `GatewayCheckAttempt`, or `MutationAttempt`. Ordered proposal is not ordered execution authority.
