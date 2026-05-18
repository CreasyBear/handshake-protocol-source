# ADR 0003: Protocol Module Ownership

Status: Implemented
Date: 2026-05-18
Owner: Protocol owner
Implementation owner: [`02d-plan-eng-review-protocol-module-architecture.md`](../plans/02d-plan-eng-review-protocol-module-architecture.md)
Supersedes: none
References:

- [`../protocol/protocol-kernel.md`](../protocol/protocol-kernel.md)
- [`../protocol/api-protocol.md`](../protocol/api-protocol.md)
- [`0001-kernel-evidence-boundaries.md`](./0001-kernel-evidence-boundaries.md)
- [`0002-generated-execution-graph-coverage.md`](./0002-generated-execution-graph-coverage.md)

## Invariant At Stake

The kernel must remain the only named authority transition surface, while each
control primitive has one local owner.

If schemas, inputs, guards, events, constructors, storage effects, and tests for
one primitive are split by file type, future transports and adapters will
reassemble authority semantics differently. That creates bypass paths by
architecture drift.

## Decision

Handshake will organize protocol implementation by invariant-owned modules, not
by file type.

Area modules own primitive meaning:

```text
schema and input schema
  -> constructors and canonicalization
  -> guards
  -> transition function
  -> event descriptors
  -> storage effects requested by the transition
  -> module-interface tests
```

The kernel remains a facade over named transitions:

```text
transport adapter
  -> transition surface
  -> HandshakeKernel
  -> area-owned protocol module
  -> ProtocolRecorder / ProtocolStore
```

HTTP, SDK, MCP, CLI, browser, and runtime-host surfaces are adapters. They may
parse transport input, check caller custody, capture request context, invoke one
named transition, map protocol errors, and return results. They must not decide
policy, lifecycle state, proof-gap semantics, review binding, greenlight
consumption, gateway mutation semantics, recovery authority, or protocol object
meaning.

`object-registry` is the allowed aggregator. It may own protocol object type
union, protocol record union, object ID extraction, export posture, raw-read
posture, and schema collection for documentation. It must not own primitive
logic.

Storage adapters implement atomic commit primitives. They must not decide what a
lifecycle state means.

## Non-Claims

- This ADR does not split the package into services, workspaces, or TypeScript
  project references.
- This ADR does not change public HTTP, SDK, OpenAPI, schema, storage, or
  protocol version semantics.
- This ADR does not create provider-side enforcement for preview deploys.
- This ADR does not make transport caller custody into Handshake authority.
- This ADR does not remove the public `schemas.ts` and `inputs.ts`
  compatibility aggregators; it moves ownership behind them.

## Consequences

New source refactors must move primitive ownership, not just files. A valid
extraction moves or centralizes enough behavior that deleting the new module
would force the primitive's rules to reappear across callers.

The first extraction is `operation-lifecycle`, because it crosses active
operation claims, same-operation reconciliation, orphan-finality proof gaps,
claim release, receipts, storage indexes, and isolation effects.

Schemas and inputs remain central until `object-registry` exists. Premature
schema sharding is rejected because it would create drift before aggregation
rules exist.

Import posture becomes acceptance evidence:

- `kernel` may import public area module indexes.
- transports may not import area internals.
- adapters may call protocol interfaces, not storage internals.
- storage may use shared record types and registry metadata, not primitive
  meaning.
- area modules may import another area only through its public index.

## Rejected Alternatives

### Keep The Current File-Type Gravity Wells

Rejected because it makes every new primitive touch shared `schemas`, `inputs`,
`transitions`, `events`, and tests without a single owner for the invariant.

### Big-Bang Protocol Restructure

Rejected because the repo has active protocol lifecycle work and dirty source
state. A behavior-preserving sequence has lower blast radius and better review
evidence.

### Package Or Service Split

Rejected because the current problem is locality, not deployment separation.
Distributed or package-level boundaries would harden seams before the primitive
ownership model is proven.

## Proof Plan

Plan 02d owns implementation sequencing and closeout evidence.

Implemented closeout:

1. ADR 0003 and 02d carry the durable architecture style.
2. `operation-lifecycle` proved behavior-preserving extraction, then deprecated
   root-level protocol shims were removed after imports moved to area indexes.
3. `object-registry` now owns object metadata, object ID extraction, schema
   collection, export posture, raw-read posture, and scope selectors.
4. Protocol behavior moved behind area public indexes for runtime evidence,
   intent compilation, action contract, policy/greenlight, protected path
   posture, gateway gate, review binding, receipt export, recovery,
   isolation/breaker, operation lifecycle, and generic proof gaps.
5. Schema and input definitions now live in area-owned `schemas.ts` and
   `inputs.ts` files. Root `schemas.ts` and `inputs.ts` remain public
   compatibility aggregators only.
6. Area modules use local-only `types.ts` faces. Cross-area dependencies now
   appear at the implementation file that needs them instead of being brokered
   through a convenience type facade.
7. `store-port.ts` owns the protocol-facing storage interface. Storage adapters
   implement that port; protocol modules no longer import `src/storage`, and
   storage adapters no longer import root schema/input compatibility
   aggregators.
8. Import-posture and object-registry tests guard the architecture, including
   transport thinness, area-to-area public-index imports, local-only area type
   faces, protocol internals, storage adapters, reference adapters, and runtime
   wrappers staying off root schema/input compatibility aggregators,
   protocol/store direction, and registry scope.
9. HTTP transition route metadata and kernel invocation live in one transition
   route registry seam. The registry owns transport binding; area modules still
   own primitive meaning.

Smallest next mechanism: keep future protocol work behind area public indexes
and do not reintroduce root-level primitive files, wildcard area type faces, or
protocol-to-storage imports.
