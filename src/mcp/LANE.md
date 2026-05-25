# MCP Lane

## Authority owner

The MCP lane is owned by surface code. It may expose model-facing proposal and evidence transport only. The protocol kernel, policy evaluator, gateway custody process, and terminal authority certificate code remain the authority owners.

## Current proof claim

This lane defines a source-owned MCP catalog, strict `x402_payment.exact` proposal schema, trusted runtime-side readiness/policy binding for contract formation, structured non-authority outcomes, read-only evidence resource mapping, and a local stdio process harness exercised through the official MCP TypeScript SDK. It does not evaluate policy, create greenlights, perform gateway checks, sign payments, execute mutations, export receipts, read raw records, or mint authority certificates.

## Use cases

- Let a model-facing MCP host discover Handshake proposal and evidence shapes.
- Let the host submit one exact buyer-side `x402_payment.exact` proposal candidate.
- Let the host receive structured refusal, not-ready, stale-metadata, or proposal outcomes.
- Let the host read redacted evidence projections through explicit resources.
- Let the local self-hosted packet prove the source-owned MCP stdio process can list tools, read resources, and call the proposal tool without creating authority.
- Treat certificate resources as local terminal evidence references only; MCP does not mint, verify hosted trust, publish revocation state, or create cross-org certificate trust.

## Constraints and assumptions

- The model-facing process receives runtime/evidence custody only.
- The model-facing input cannot supply readiness or policy-version digests; those bindings must come from the trusted runtime-side options before an action contract can be proposed.
- Gateway custody, control-plane install, signer material, mutation execution, and terminal certificate minting live outside MCP.
- Generated execution graph creation remains kernel-only in this checkout; MCP records that posture instead of creating a new HTTP authority path.
- The first public proposal tool is `handshake.actions.x402_payment.propose`.

## Core components

- `catalog.ts`: MCP tool and resource registry.
- `output.ts`: MCP result wrapper over the shared surface outcome contract.
- `resources.ts`: read-only resource URI parsing and evidence-client routing.
- `x402-proposal.ts`: strict x402 proposal input schema and runtime-client bridge.
- `stdio/server.ts`: internal source-owned MCP stdio server harness.
- `stdio/entry.ts`: local process entrypoint for the self-hosted proof packet.
- `stdio/process-proof.ts`: official MCP client-SDK proof harness for the local process.
- `digest.ts`: local deterministic digest helper for metadata and proposal evidence binding.

## Failure and scale posture

Unknown fields, authority-shaped fields, stale metadata, not-ready install posture, gateway-offline posture, excessive amount bounds, and protocol/tool errors fail into structured outcomes. The lane does not claim sibling MCP, terminal, browser, cloud, package-manager, repo, or network paths are protected unless source-owned evidence exists.

## Future package target

The first public package target is the existing `handshake-protocol-kernel` npm package with explicit `./mcp` subpath and `handshake-mcp` stdio bin. Extraction to a dedicated package remains deferred until a real external host transcript and hosted/process supervision boundary exist.

## Allowed imports

- `src/sdk/surface-clients`
- `src/surfaces`
- `zod`
- local `src/mcp/*` modules

## Forbidden imports

- Protocol kernel internals
- Policy transitions
- Gateway transitions or fixtures
- Wallet gateway or payment signing surfaces
- Storage adapters or raw stores
- Receipt export transitions
- Authority certificate signing or minting transitions
- All-role SDK client surfaces

## Guarding tests

- `test/mcp/mcp-schema-contract.test.ts`
- `test/mcp/mcp-x402-proposal.test.ts`
- `test/mcp/mcp-resource-redaction.test.ts`
- `test/mcp/mcp-stdio-process.test.ts`
- `test/architecture/mcp-surface-posture.test.ts`
- `test/architecture/surface-boundary-posture.test.ts`

## Public surface

Package subpath `handshake-protocol-kernel/mcp` exposes the catalog, schemas, read-only resource mapping, reference transcript builder, and proposal bridge. Package bin `handshake-mcp` starts the local stdio MCP server. Neither surface is package-root authority, gateway custody, signer custody, hosted operation, receipt export, certificate minting, mutation execution, or broad MCP protection.

## Extraction trigger

Extract only after the catalog, proposal schema, resource mapping, process custody, and at least one real external MCP host transcript are stable under the architecture and claim gates.

## Scope boundary

MCP can propose and display evidence. It cannot authorize, approve, pay, execute, recover, retry, export, certify, install, supervise processes, or hold mutation credentials.
