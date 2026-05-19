# Protocol Notes

Last protocol audit: 2026-05-19.

For the canonical definition, see `docs/internal/protocol-definition.md`. For the architecture and schema map, see `docs/internal/protocol-kernel-architecture.md`. For the plain-English translation, see `docs/internal/protocol-layman.md`. This file keeps implementation-facing protocol notes compact.

## Primitive

Every consequential mutation attempt must be reduced to an exact, inspectable, policy-evaluated, gateway-bound action contract before consequence.

## Required Separation

- Vague intent is not an operating envelope.
- Generated code is not an action contract.
- Tool availability is not tool authorization.
- A rendered review screen is not permission.
- A greenlight is not execution proof.
- A receipt is not downstream business success.
- Runtime evidence is not gateway enforcement.

## State Path

```text
runtime execution evidence
-> generated execution graph
-> intent compilation record
-> candidate action
-> action contract
-> policy decision
-> greenlight or refusal
-> gateway check attempt
-> mutation attempt, refusal, receipt, or proof gap
```

## System Design Posture

Use case: reduce generated engineering-agent execution into exact protected-action authority decisions.

Constraints and assumptions:

- agents may branch, retry, loop, call sibling tools, or generate stale review surfaces;
- gateway checks are the final pre-mutation enforcement point;
- receipt evidence reconstructs protocol events, not downstream business success;
- storage may report conflicts or ambiguous commits, so transitions must be replay-safe;
- installed protected paths are narrow until a real gateway owns mutation credentials.

Core components:

- protocol kernel facade;
- protocol areas for contracts, policy, gateway gate, lifecycle, recovery, and evidence;
- append-only event/record store port;
- HTTP transport/admission surface;
- runtime proposal helpers;
- reference gateway adapters;
- D1 and memory stores.

Failure and scale posture:

- back pressure is expressed as refusal, isolation, replay refusal, or proof gap rather than hidden retries;
- consistency is preferred over availability for authority-bearing transitions;
- D1 is durable reconstruction truth in the reference implementation;
- KV is cache posture only and cannot become authority;
- future extraction must preserve exact contract binding, one-use greenlights, and gateway-side enforcement.

## Evidence Rules

Receipts must distinguish:

- proposal evidence;
- policy decision evidence;
- gateway check evidence;
- mutation attempt evidence;
- downstream finality evidence;
- proof gaps.

Missing or ambiguous evidence is recorded explicitly as a `ProofGap`.

## Implementation Map

- `src/protocol/foundation`: canonicalization, ids, errors, reason codes, core schemas, transition guards.
- `src/protocol/public`: public schema and input aggregators.
- `src/protocol/events`: stream event schemas, digest chains, record commits.
- `src/protocol/context`: transition request context schemas and records.
- `src/protocol/navigation`: protocol transition metadata.
- `src/protocol/store`: store port.
- `src/protocol/areas`: owned primitives such as action contracts, policy/greenlight, gateway gate, proof gaps, recovery, review binding, runtime evidence, and object registry.

Protocol areas may depend on foundation/events/context/store and other area public indexes. They must not import HTTP, storage implementations, runtime wrappers, SDK code, or adapter fixtures.

## Protocol Areas

- `catalog-envelope`: declared tool, action, gateway, and envelope records; catalog presence is not authorization.
- `runtime-evidence`: generated execution evidence; evidence can propose but cannot authorize.
- `generated-execution-graph`: normalized generated-code/spec evidence and action candidates.
- `intent-compilation`: candidate action boundary, assumptions, dependencies, uncertainty, and refusal inputs.
- `action-contract`: exact proposed commitment before authority.
- `policy-greenlight`: decision and one-use greenlight issuance.
- `gateway-gate`: final pre-mutation verification of exact greenlight binding.
- `operation-lifecycle`: reconciliation of protected-surface outcomes without pretending downstream certainty.
- `refusal`: portable refusal evidence format; it does not create authority or mutation proof.
- `review-binding`: review artifacts and decisions bound to exact contract and policy records.
- `protected-path-posture`: installed, bypass, and drift posture for a protected path.
- `isolation-breaker`: persistent halt or isolation state checked before future decisions and gates.
- `proof-gap`: explicit missing, expired, contradictory, or unavailable evidence.
- `recovery`: follow-up recommendations and terminal conflict handling.
- `receipt-export`: reconstructable export of the chain, not proof of business success.
- `object-registry`: protocol object metadata, ID selectors, export posture, and raw-read posture.

## Current Proof Lanes

- Package install, repo write, and preview deploy are reference gateway fixtures.
- Protected mutation adapter conformance lives under the `./conformance` package subpath.
- Codemode multi-action and package-install runtime paths prove generated-execution proposal behavior.
- D1 and memory stores prove reconstruction and atomicity mechanics for the reference implementation.

These are proof lanes, not provider-side enforcement claims.

## Naming Rules

Keep protocol object names exact: `ActionContract`, `PolicyDecision`, `Greenlight`, `GatewayCheck`, `Receipt`, `Refusal`, `ProofGap`, and `IsolationState`.

Avoid names that imply authority without mechanism. A function may observe, derive, propose, record, consume, or reconcile. It must not imply safety, trust, proof, or security that the gateway has not enforced.
