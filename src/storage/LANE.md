# Storage Lane

## Authority owner

Protocol store mechanics: atomic record commits, stream offsets, digest chains, indexes, conflict outcomes, D1 persistence, memory fixture behavior, and isolation cache plumbing.

## Current proof claim

Reference storage proof. D1 is a durable reconstruction source for the reference implementation; memory is a test fixture and invariant oracle.

## Use cases

Persist protocol records, stream events, current posture pointers, one-use greenlight claims, recovery terminal claims, and cacheable isolation snapshots.

## Constraints and assumptions

Storage sees protocol objects as durable evidence, not business meaning. Atomic commits can conflict. KV may cache only non-authoritative snapshots. D1 is the reference durable truth.

## Core components

`store.ts`, `d1/index.ts`, `d1/statements.ts`, `memory/index.ts`, and `kv/index.ts`.

## Failure and scale posture

Prefer atomic consistency for authority-bearing records. Conflict outcomes must be explicit and replayable. Storage scaling cannot introduce hidden policy interpretation or cache authority.

## Future package target

`packages/store-memory` and `packages/store-d1`

## Allowed imports

Protocol store interfaces, protocol object metadata, event schemas, canonical digest helpers, protocol error types, D1 types, and storage-private SQL statement builders.

## Forbidden imports

Protocol primitive transition modules, policy/lifecycle/recovery meaning, Hono route handlers, SDK/client code, runtime wrappers, reference gateways, product surfaces, and hosted receipt product code.

## Guarding tests

`test/architecture/import-posture.test.ts`, `test/http/d1-http.test.ts`, `test/protocol/kernel-*.test.ts`, `test/protocol/transition-budget-recorder.test.ts`, and `test/protocol/fault-injecting-protocol-store.test.ts`.

## Public surface

`ProtocolStore` implementations, fixture stores, D1 store construction, KV/noop isolation cache helpers, and storage conflict result types.

## Extraction trigger

Extract only after store manifests and import posture are stable, storage has named quality commands, old/new import paths are mapped, and extraction preserves atomicity and current claim language.

## Scope boundary

This lane stores protocol evidence and atomic state. It must not decide what policy, lifecycle, review, recovery, proof-gap, or gateway states mean, and it must not imply hosted durability or production RPO/RTO.
