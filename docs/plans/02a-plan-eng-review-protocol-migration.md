# Plan Eng Review 02a: Direct v0.2 Protocol Vocabulary Migration

Status: Implemented breaking vocabulary reset
Version: v0.2.1
Audience: Protocol implementers, SDK authors, runtime builders, gateway owners, platform engineering
Implementation status: Direct code, route, object type, event, SDK, test, and docs migration in progress
Canonical owner: Protocol owner
Extends: [`01-plan-eng-review-primitive-fields-state.md`](./01-plan-eng-review-primitive-fields-state.md), [`02-plan-eng-review-agent-requirements.md`](./02-plan-eng-review-agent-requirements.md)
Precedes: `03-plan-eng-review-agent`
Last reviewed: 2026-05-18

## Invariant At Stake

A vocabulary migration must not weaken the protocol boundary.

This repo is still pre-production v0.2, so Handshake is allowed to make a breaking vocabulary reset now. The reset must be atomic: schemas, input contracts, route paths, SDK methods, storage object types, event names, stream scopes, tests, fixtures, and active docs must all move together.

The invariant remains:

```text
No consequential autonomous action executes outside declared bounds,
and divergent behavior must be haltable, isolatable, and reconstructable.
```

The new vocabulary must preserve the hard rule:

```text
only a passed gateway check bound to the exact greenlight may precede mutation
```

## Decision

Bring all active protocol vocabulary over now.

No aliases. No compatibility layer. No v0.3 route facade. No old SDK methods. No old object types. No old event names.

`Gateway` and `Protected Surface` are now the v0.2 vocabulary:

```text
Protected Surface = where consequence lands
Gateway = credential-owning enforcement boundary for that surface
Gateway Check = exact pre-mutation authority check
Surface Operation = downstream mutation attempt or finality target
```

Patch metadata moves to `0.2.1` because schema and digest material changed inside the v0.2 line.

## Renamed Protocol Surface

The migration moves the old active names to these new protocol names:

```text
GatewayRegistryEntry
gatewayRegistryEntryId
gatewayRegistryVersion
gatewayRegistryRef

gatewayId
protectedSurfaceKind
gatewayAdapterId
gatewayPolicy*
allowedGateways

GatewayCheckAttempt
GatewayCheckResult
VerifiedGatewayCheck
gatewayCheck(...)
gatewayCheckStatus
gateway_check_attempt
gateway_checked
gateway_refused

SurfaceOperationReconciliation
surfaceOperationRef
observedSurfaceOperationRef
surface_operation_reconciliation
surface_operation_reconciled

protected_surface_resource
mayMutateProtectedSurface
```

The API surface is now:

```text
POST /v0.2/catalog/gateways
POST /v0.2/gateway-check-attempts
POST /v0.2/surface-operation-reconciliations

HandshakeClient.registerGatewayRegistryEntry(...)
HandshakeClient.gatewayCheck(...)
HandshakeClient.reconcileSurfaceOperation(...)
```

The old routes and methods are intentionally gone.

## Migration Diagram

```text
principal intent
  -> intent compilation
  -> action contract with gateway binding
  -> policy decision
  -> one-use greenlight
  -> gateway check before mutation
  -> mutation attempt, gateway refusal, or proof gap
  -> surface operation reconciliation when downstream finality is pending/unknown
  -> receipt over action, run, and protected_surface_resource streams
```

## Data And Digest Rules

No deployed-data migration is required unless real deployed v0.2 data is discovered.

The D1 tables remain generic:

```text
protocol_records
stream_events
greenlight_consumptions
greenlight_issuances
recovery_terminal_claims
```

The breaking changes live in payload JSON, object types, event types, stream scopes, partition keys, route paths, SDK methods, and canonical digest inputs.

Because this is a pre-production reset, the implementation updates fixtures and tests to the new vocabulary instead of bridging old records.

## Not In Scope

- Keeping old pre-reset routes.
- Keeping old pre-reset SDK aliases.
- Supporting mixed pre-reset and gateway payloads.
- Migrating deployed data.
- Splitting `gatewayId` into separate `gatewayId` and `protectedSurfaceId`.
- Changing the authority model.
- Building production GitHub App, MCP, CLI, Cloud, identity, payment, or dashboard behavior.

`gatewayId` remains the direct authority binding used by the pre-reset implementation. `protectedSurfaceKind` and `resourceRef` describe the surface until a later plan proves a separate protected-surface identity is necessary.

## Test Plan

Existing invariant tests must move to the new vocabulary rather than adding compatibility tests:

- happy path still proves contract -> policy -> one-use greenlight -> gateway check -> mutation/refusal/proof gap -> receipt;
- replay, mismatch, isolation, gateway policy drift, sequence dependency, proof-gap, recovery, D1, SDK, OpenAPI, and adapter tests use new names;
- D1 record identity test expects `gateway_registry_entry`, `gateway_check_attempt`, and `surface_operation_reconciliation`;
- stream tests expect `protected_surface_resource` partitioning;
- OpenAPI test confirms only new v0.2 paths are documented.

Verification commands:

```bash
npm run typecheck -- --pretty false
npm run build -- --pretty false
bun test
rg -n "REMOVED_VOCAB_PATTERN" src test migrations docs --glob '!docs/plans/01-plan-eng-review-primitive-fields-state.md' --glob '!docs/plans/02-plan-eng-review-agent-requirements.md'
rg -n "REMOVED_ROUTE_OR_SDK_PATTERN" src test docs
```

Expected result:

- typecheck/build/tests pass;
- active-code/API scans return no matches;
- historical plan docs may preserve old context only if intentionally excluded.

## Brutal Verdict

Keep the direct reset.

Aliases would preserve ambiguity and force the next agent-runtime plan to explain two vocabularies. Since v0.2 is pre-production, the cheaper and more honest move is to rename the protocol surface now and make every test prove the new vocabulary still preserves the same authority boundary.

Smallest next mechanism: finish the direct rename, run the full invariant suite, and use v0.2.1 gateway/surface vocabulary as the input to `03-plan-eng-review-agent`.
