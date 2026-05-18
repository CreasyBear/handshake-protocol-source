# Handshake Protocol Kernel v0.2

Handshake is contracted execution infrastructure for engineering agents.

It turns vague principal intent and agent-generated orchestration into exact, inspectable, policy-evaluated, gateway-checked action contracts before consequential mutation.

## Invariant

```text
No consequential autonomous action executes outside declared bounds,
and divergent behavior must be haltable, isolatable, and reconstructable.
```

## What This Repo Builds

This is the protocol kernel, not the product dashboard.

```text
principal intent
  -> catalog-bound candidate validation
  -> intent compilation record
  -> action contract
  -> policy decision
  -> one-use greenlight or refusal
  -> gateway check attempt
  -> mutation/refusal/proof gap
  -> receipt
```

## Stack

- TypeScript
- Hono for the HTTP protocol surface
- Cloudflare Workers as the reference runtime
- D1 for durable protocol records
- KV as an optional isolation cache
- Zod for runtime schema validation
- Deterministic canonical JSON and HMAC signing helpers for contracts and policy decisions

## Module Boundaries

The protocol kernel is split by control primitive, not product feature:

- `src/protocol/schemas.ts`: durable protocol objects.
- `src/protocol/inputs.ts`: HTTP/SDK command schemas.
- `src/protocol/intent-compilation.ts`: catalog-bound candidate validation and intent-compilation record emission.
- `src/protocol/runtime-executions.ts`: generated execution-block evidence records.
- `src/protocol/protected-path-postures.ts`: protected-path posture records, scope keys, and policy/gate posture evaluation.
- `src/protocol/action-contracts.ts`: exact gateway-bound contract proposal.
- `src/protocol/policy-decisions.ts`: deterministic policy decisions and one-use greenlight issuance.
- `src/protocol/review-artifacts.ts`: rendered review artifact digest-binding records.
- `src/protocol/review-decisions.ts`: exact review binding records.
- `src/protocol/isolation-states.ts`: durable interdict state writes.
- `src/protocol/transitions.ts`: invalid state-edge guards.
- `src/protocol/policy.ts`: deterministic envelope/isolation policy.
- `src/protocol/gateway-check.ts`: gateway drift, finality, and status helpers.
- `src/protocol/gateway-check-attempts.ts`: final gateway-check enforcement before mutation.
- `src/protocol/gateway-check-artifacts.ts`: structured gate attempts, mutation attempts, receipts, and events.
- `src/protocol/surface-operation-reconciliations.ts`: same-mutation downstream reconciliation.
- `src/protocol/proof-gaps.ts`: proof-gap construction and resolution.
- `src/protocol/recovery-recommendations.ts`: narrowed recovery path records after refusal or proof gap.
- `src/protocol/recovery-action-linkage.ts`: evidence-only validation for recovery-linked follow-up contracts.
- `src/protocol/recovery-recommendation-status.ts`: explicit expired/superseded recommendation transitions.
- `src/protocol/recovery-terminal-conflicts.ts`: recovery-phase proof gaps for lost terminal-claim races.
- `src/protocol/recovery-terminal-conflict-resolutions.ts`: proof-gap resolution once a winning terminal transition is observed.
- `src/protocol/content-digests.ts`: deterministic UTF-8 content digests for content-bound gateway contracts.
- `src/protocol/events.ts`: stream partitioning, offsets, and digest chaining.
- `src/protocol/records.ts`: durable record plus stream-event commit helper.
- `src/protocol/kernel.ts`: thin orchestration facade over the primitive modules.
- `src/http/caller-auth.ts`: HTTP transition caller-custody checks.
- `src/sdk/client.ts`: minimal HTTP client for protocol callers and adapters.
- `src/runtime/codemode-multi-action/wrapper.ts`: generated-program wrapper for ordered contract proposals.
- `src/runtime/package-install/tool-wrapper.ts`: reference runtime hook for package-install contract proposal.
- `src/runtime/repo-write/tool-wrapper.ts`: reference runtime hook for content-digest-bound repo-write proposal.
- `src/runtime/preview-deploy/tool-wrapper.ts`: local preview-deploy fixture runtime hook.
- `src/adapters/package-install/gateway.ts`: reference package-install gateway adapter seam.
- `src/adapters/repo-write/gateway.ts`: reference repo-write gateway adapter seam.
- `src/adapters/preview-deploy/gateway.ts`: local preview-deploy fixture gateway adapter seam.

## Run Locally

```bash
bun install
bun test
./node_modules/.bin/tsc --noEmit
```

Wrangler is configured, but in this sandbox it may try to write logs outside the project directory. Use `bun run dev` in a normal local shell.

## Core Routes

All `POST /v0.2/*` transition routes require a bearer token for the custody role
that owns the transition:

| Role | Env binding | Routes |
|---|---|---|
| `control_plane` | `HANDSHAKE_CONTROL_PLANE_TOKEN` | catalog, envelopes, action contracts, policy, isolation, breaker, receipt export, recovery |
| `runtime_evidence` | `HANDSHAKE_RUNTIME_EVIDENCE_TOKEN` | intent compilations, runtime executions |
| `gateway_custody` | `HANDSHAKE_GATEWAY_CUSTODY_TOKEN` | protected-path posture, gateway checks, surface reconciliation |
| `review_custody` | `HANDSHAKE_REVIEW_CUSTODY_TOKEN` | review artifacts, review decisions |

These route checks stop unauthenticated transition writes. They do not replace the
kernel invariant: only exact contract -> policy decision -> one-use greenlight ->
gateway check can authorize mutation.

```text
GET  /health
GET  /openapi.json
POST /v0.2/catalog/tool-capabilities
POST /v0.2/catalog/action-types
POST /v0.2/catalog/gateways
POST /v0.2/envelopes
POST /v0.2/runtime-executions
POST /v0.2/protected-path-postures
POST /v0.2/intent-compilations
POST /v0.2/action-contracts
POST /v0.2/policy-decisions
POST /v0.2/review-artifacts
POST /v0.2/review-decisions
POST /v0.2/gateway-check-attempts
POST /v0.2/surface-operation-reconciliations
POST /v0.2/isolation-states
POST /v0.2/breaker-decisions
POST /v0.2/receipt-exports
POST /v0.2/recovery-recommendations
POST /v0.2/recovery-recommendation-status-transitions
POST /v0.2/recovery-terminal-conflict-resolutions
GET  /v0.2/records/:objectType/:objectId
```

## Reference Flow

```ts
import { HandshakeKernel, InMemoryProtocolStore } from "./src";

const kernel = new HandshakeKernel(new InMemoryProtocolStore());

// 1. Register catalog objects and an operating envelope.
// 2. createRuntimeExecution(...) may record generated execution-block evidence.
// 3. createProtectedPathPosture(...) may record current gateway/path posture.
// 4. compileIntent(...) loads durable catalog/gateway records and records assumptions.
// 5. proposeActionContract(...) loads durable envelope/gateway records and only succeeds for a clean compilation.
// 6. evaluatePolicy(...) returns a greenlight or refusal.
// 7. gatewayCheck(...) consumes the greenlight before mutation.
// 8. receipt/proof-gap records reconstruct what happened.
// 9. createRecoveryRecommendation(...) can recommend a narrowed next contract after refusal or proof gap.
// 10. A later proposeActionContract(...) may link that recommendation, but still has no greenlight.
// 11. resolveRecoveryTerminalConflictProofGap(...) can close a terminal race gap after loading the winning transition.
```

The package-install gateway adapter demonstrates the gateway side of the loop:

```ts
import { runPackageInstallGateway } from "./src";

await runPackageInstallGateway({
  protocol: kernel,
  surface: packageManifestSurface,
  actionContractId,
  greenlightId,
  observedParameters: { package: "hono", versionRange: "^4.12.19" },
});
```

The adapter mutates its manifest surface only after `gatewayCheck(...)` consumes the exact greenlight, passes, and the protocol derives a `VerifiedGatewayCheck`. A proof-gap gate is not a verified mutation artifact; the adapter returns without mutating. Unknown downstream finality is recorded after a passed gate and mutation through surface-operation reconciliation, where the protocol can create a first-class `ProofGap`.

The package-install runtime wrapper demonstrates the runtime side of the loop. It turns a generated package-install tool call into an `IntentCompilationRecord` and, only when catalog/gateway evidence is clean, an exact `ActionContract`. It does not evaluate policy, issue greenlights, call the gateway check, or mutate a package manager.

`test/package-install-end-to-end.test.ts` connects the runtime wrapper, deterministic policy, and gateway adapter against a file-backed manifest. It proves the generated tool call leaves the manifest untouched until the exact contract receives a one-use greenlight and the gateway check passes, then reconciles the same mutation attempt by idempotency key.

`test/d1-http.test.ts` proves the same package-install runtime and gateway adapters work through `HandshakeClient` against the Hono/D1 protocol surface. It covers the green path, a gateway parameter mismatch refusal where the manifest remains unchanged and D1 records no `MutationAttempt`, an unknown-finality path where passed-gate mutation is followed by reconciliation-created `ProofGap` evidence, a recovery-linked follow-up `ActionContract` that records narrowed evidence without creating another mutation or greenlight, and a terminal-claim race that records a recovery-phase `ProofGap`.

`test/repo-write-d1-http.test.ts` proves the same protocol primitives against a second consequence shape: repository file writes. The runtime contract binds repository, file path, content digest, and byte length without putting raw file content in the `ActionContract`; the gateway recomputes the digest from actual content before the gate and refuses if generated content changed after proposal.

`test/codemode-multi-action-runtime.test.ts` proves a generated-program wrapper can emit ordered package-install and repo-write `ActionContract` proposals through Hono/D1 without receiving policy, greenlight, gateway-check, or mutation authority. Later contracts carry `requiredPriorActionContractIds`; policy refuses them until each declared predecessor has a durable greenlight, and the gateway check refuses them until each predecessor has a final passed receipt. A refused candidate records an `IntentCompilationRecord` with refusal reasons while already proposed contracts remain non-authoritative until policy and gateway checks run separately.

`test/preview-deploy-gateway.test.ts` proves the local `preview_deploy.create` fixture path. It records runtime execution evidence, requires fresh `gateway_checked` protected-path posture, creates a local preview artifact only after the exact greenlight is consumed by the gateway check, refuses parameter mismatches before mutation, and records unknown downstream finality as a proof gap. This is local fixture proof only, not provider-side enforcement.

## Failure Modes Are First-Class

The kernel explicitly records:

- missing durable tool/action/gateway records as compilation uncertainty;
- generated execution-block evidence without policy, greenlight, gate, or mutation authority;
- dynamic tool construction and unobserved runtime regions as compilation overreach/refusal evidence;
- current protected-path posture as policy and gate input, not as a gateway check substitute;
- weak protected-path posture source authority as refusal evidence, not gateway-checked proof;
- compilation uncertainty and overreach markers;
- explicit transition guards for direct writes, envelope mismatch, duplicate greenlights, review binding, and gate authority;
- gateway registry mismatches before contract emission;
- pinned gateway registry and policy versions on contracts and greenlights;
- gateway policy drift refusals at the gate unless the current gateway explicitly declares the older policy compatible and stricter;
- sequence dependency refusals when a later contract names a prior contract that is missing, refused, not greenlit, not receipted, gate-refused, or not final;
- canonical action contract digests and optional contract signatures;
- review artifacts bound to exact contract, policy input, uncertainty, and artifact digests;
- review decisions bound to review artifact ID/digest plus exact contract and policy input digest;
- policy refusals, review requirements, halts, and quarantines;
- atomic record-plus-stream commits for intent compilation, action proposal, policy, review, isolation, and gateway-check lifecycle writes;
- gateway check refusals before mutation;
- protected-path posture drift refusals before mutation;
- surface-operation reconciliation for pending or unknown downstream status without creating a second mutation attempt;
- one-use greenlight replay attempts;
- transactional gateway-check commits for greenlight consumption, gate attempts, mutation/proof-gap, receipts, and stream events;
- gateway-check stream offset conflicts as bounded retries against a fresh event tail;
- lifecycle-owned breaker decisions that validate observed stream offset watermarks before atomically creating isolation state;
- isolation changes after greenlight but before mutation;
- downstream unknown status as a `ProofGap`;
- recovery recommendations from refusals or proof gaps that require a new action contract for any future mutation and cannot reuse a greenlight;
- recovery-linked action contracts that must match recommendation scope, timing, allowed action class, later sequence number, and required new evidence before proposal;
- recovery recommendation status transitions that close open recommendations as expired or superseded with durable transition evidence;
- recovery terminal conflicts as recovery-phase `ProofGap` records when a concurrent follow-up or expiry loses the terminal claim race;
- recovery terminal conflict resolution that binds the unresolved `ProofGap` to the winning `RecoveryRecommendationStatusTransition` without creating another action contract, greenlight, gate, or mutation;
- receipts that distinguish policy, gate, mutation, downstream finality, proof gaps, and the exact action/run/resource stream windows they summarize.

## D1 Schema

The first migration creates:

- `protocol_records` as the durable object store;
- `greenlight_issuances` as the one-greenlight-per-action-contract claim ledger;
- `greenlight_consumptions` as the one-use gateway-check consumption ledger;
- `recovery_terminal_claims` as the one-terminal-status ledger for recovery recommendations;
- `protected_path_posture_current` as the atomic current-posture pointer keyed by protected path scope;
- `stream_events` as the reconstruction feed.

KV is intentionally not authority. It may cache isolation snapshots, but D1 remains durable truth.

Lifecycle writes use D1 `batch()` so protocol records and their stream events commit as one sequence. Greenlight policy writes additionally claim the action contract in `greenlight_issuances` before the greenlight record is committed. Gateway-gate writes include greenlight consumption and the resulting gate/mutation/proof-gap/receipt records. If issuance or consumption loses a race, the kernel refuses the duplicate authority path without attempting mutation.

Stream events are chained per partition. Action lifecycle events emit into `action:{actionContractId}`, `run:{runId}`, and `protected_surface_resource:{gatewayId}:{resourceRef}` partitions. Each partition starts at offset `0`, and each event carries the previous event digest. This makes proposal, policy, greenlight, gate, mutation/proof-gap, receipt, recovery recommendation, and recovery status transition replayable for one action, one generated run, or one protected-surface resource. Receipts carry `streamOffsets` for those partitions, including terminal event digests, plus `receiptDigest` and `auditChainDigest`, so exported receipt evidence can find the exact event windows it summarizes and detect tampering. `ReceiptExport` verifies that digest material and packages a drop copy without creating execution proof. `RecoveryRecommendation` also verifies receipt digest material before it records a narrowed path, but it has `mustCreateNewActionContract: true`, `mayReuseGreenlight: false`, and `mayMutateProtectedSurface: false`. A later `ActionContract` may carry `recoveryRecommendationId`, `recoverySourceReceiptId`, and `recoveryRecommendationDigest`; those fields bind evidence only and do not create policy or gateway authority. A linked proposal supersedes the recommendation in the same lifecycle commit through a `RecoveryRecommendationStatusTransition`, and `recovery_terminal_claims` rejects any concurrent second terminal transition. When a terminal claim loses a race, the kernel records a recovery-phase `ProofGap` on the source action stream and still returns `recovery_terminal_conflict`. Once the winning terminal transition is observed, the kernel may resolve only that proof gap by setting `resolvedByRef` to the terminal transition and emitting `proof_gap_resolved`; it does not retroactively persist the losing proposal. `IsolationState` can record `observedStreamOffsets` so a breaker-triggered quarantine is bound to the exact stream window it observed. If a gateway-check commit loses an offset race, the kernel rebuilds the event chain from the fresh tail before retrying the atomic commit.

The test suite includes a D1-compatible Hono integration path that applies the migration, drives the public `/v0.2/*` routes through pending mutation reconciliation, and asserts contiguous stream offsets, digest predecessor links, one mutation attempt, and one reconciliation record. The package-install adapter path uses the same Hono/D1 surface through `HandshakeClient`, including a durable gateway refusal that records a gate attempt and receipt without creating a mutation attempt, an unknown-finality proof gap created by surface-operation reconciliation after passed-gate mutation, a recovery-linked follow-up proposal that records no second mutation or greenlight, an explicit expired recovery status transition, and a terminal-claim race that records a recovery-phase proof gap. The repo-write adapter path proves the gateway-check seam is not package-manager-specific by enforcing content digest binding before writing a file.

The compact completion audit is in `docs/protocol-completion-audit-v0.2.md`. It maps the plan obligations to current modules, routes, D1 evidence, runtime wrappers, gateway adapters, and invariant tests.
