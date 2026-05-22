# CLI Lane

## Authority owner

Operator-facing local command contract and redacted evidence rendering.

## Current proof claim

The first CLI slice can inspect a local APS report, verify a supplied terminal certificate against pinned trust material, emit the CLI command manifest, and run x402 conformance classification without creating authority.

## Use cases

Let an operator or operator automation inspect local/reference evidence with machine-readable JSON while preserving custody separation from runtime, gateway, and protocol authority.

## Constraints and assumptions

The CLI is not an agent hot path. Runtime proposal belongs to SDK/MCP, gateway checks belong to gateway custody, and policy decisions remain kernel/control-plane authority. First-slice CLI commands are evidence or posture commands only.

## Core components

`command-manifest.ts`, `output.ts`, `aps-report.ts`, `certificate.ts`, `conformance.ts`, and `main.ts`.

## Failure and scale posture

Scale by adding command metadata before behavior. CLI output must fail closed, name non-claims explicitly, and keep proof gaps/refusals visible instead of converting evidence into permission.

## Future package target

`packages/cli`

## Allowed imports

CLI-local helpers, surface boundary metadata, public protocol schemas, local certificate verification, conformance classification, and filesystem reads for explicit user-supplied evidence files.

## Forbidden imports

Storage internals, protocol kernel internals, runtime wrappers, mutation adapters, gateway runners, signer factories, raw record routes, all-role clients, process launchers, and provider credentials.

## Guarding tests

`test/architecture/cli-command-posture.test.ts`, `test/architecture/surface-boundary-posture.test.ts`, `test/cli/cli-evidence.test.ts`, `test/architecture/import-posture.test.ts`, and `test/architecture/root-exports.test.ts`.

## Public surface

No package root export in this slice. Commands are local source entrypoints until package/bin posture is designed.

## Extraction trigger

Extract after command metadata, JSON envelope, redaction posture, evidence wrappers, token storage, and process-boundary tests are all source-owned.

## Scope boundary

The CLI may render local evidence and verify supplied terminal certificates. It must not evaluate policy, mint greenlights, perform gateway checks, start protected mutation processes, export raw receipts, or infer authorization from command success.
