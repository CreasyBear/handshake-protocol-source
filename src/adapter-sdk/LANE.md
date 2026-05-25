# Adapter SDK Lane

## Authority owner

The adapter SDK lane is owned by the public package surface. It describes third-party adapter definitions and install proposal integrity only.

## Current proof claim

The lane proves that an adapter author can publish a structured protected-action adapter definition with explicit non-authority boundaries and source-review readiness evidence. It must not issue policy decisions, greenlights, gateway checks, receipts, or mutations. It does not install, bind, evaluate, check, mutate, export, certify, or operate a protected path.

## Use cases

- Define a protected-action adapter pack for source review.
- Bind an install compiler contract reference to the adapter pack.
- Bind observed-parameter validation and receipt-evidence mapping references to the adapter pack.
- Project definition readiness and install-proposal shape reports.

## Constraints and assumptions

- Runtime ingress binding is definition-only from this subpath.
- Protected-path binding is definition-only from this subpath.
- A ready install proposal must include compiled kernel records.
- A refused install proposal must include refusal reason codes and no compiled kernel records.
- Source-owned runtime, policy, gateway, and receipt machinery remain outside this lane.

## Core components

- `AdapterSdkDefinitionSchema`
- `AdapterSdkAuthorityBoundarySchema`
- `AdapterSdkInstallCompilerContractSchema`
- `AdapterSdkProtectedPathContractSchema`
- `defineProtectedActionAdapterPack`
- `defineAdapterInstallCompiler`
- `projectAdapterSdkDefinitionReport`
- `projectAdapterSdkInstallProposalReport`

## Failure and scale posture

Invalid adapter definitions fail closed at definition time. Install proposal reports expose proof-shape gaps without converting them into authority. The lane scales by keeping adapter definitions declarative and leaving source-owned registries responsible for any future runtime or gateway binding.

## Future package target

This lane is published through `handshake-protocol-kernel/adapter-sdk`.

## Allowed imports

- `src/install/install-proposal`
- `src/install/protected-action-adapter-pack`
- `zod`

## Forbidden imports

- protocol kernel behavior
- policy evaluators
- greenlight transitions
- gateway gate internals
- storage adapters
- reference mutation fixtures
- experimental adapter runners

## Guarding tests

- `test/adapter-sdk/adapter-sdk.test.ts`
- `test/architecture/package-surface.test.ts`
- `test/architecture/root-exports.test.ts`
- `test/architecture/surface-boundary-posture.test.ts`
- `test/architecture/claim-boundary.test.ts`

## Public surface

The public surface is the `./adapter-sdk` package subpath. The package root must not re-export adapter SDK helpers.

## Extraction trigger

Extract only when multiple external adapter packs need independent versioning, conformance fixtures, and published authoring docs.

## Scope boundary

This lane is adapter authoring support, not marketplace certification, provider custody, hosted operation, policy authority, gateway authority, receipt export, settlement, runtime control, or mutation execution.
