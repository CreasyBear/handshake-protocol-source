# MCP Lane

## Authority owner

The MCP lane is owned by surface code. It may expose model-facing proposal and evidence transport only. The protocol kernel, policy evaluator, gateway custody process, and terminal authority certificate code remain the authority owners.

## Current proof claim

This lane defines a source-owned MCP catalog, strict `x402_payment.exact` proposal schema, structured non-authority outcomes, and read-only evidence resource mapping. It does not start an MCP process, evaluate policy, create greenlights, perform gateway checks, sign payments, execute mutations, export receipts, read raw records, or mint authority certificates.

## Use cases

- Let a model-facing MCP host discover Handshake proposal and evidence shapes.
- Let the host submit one exact buyer-side `x402_payment.exact` proposal candidate.
- Let the host receive structured refusal, not-ready, stale-metadata, or proposal outcomes.
- Let the host read redacted evidence projections through explicit resources.
- Treat certificate resources as local terminal evidence references only; MCP does not mint, verify hosted trust, publish revocation state, or create cross-org certificate trust.

## Constraints and assumptions

- The model-facing process receives runtime/evidence custody only.
- Gateway custody, control-plane install, signer material, mutation execution, and terminal certificate minting live outside MCP.
- Generated execution graph creation remains kernel-only in this checkout; MCP records that posture instead of creating a new HTTP authority path.
- The first public proposal tool is `handshake.actions.x402_payment.propose`.

## Core components

- `catalog.ts`: MCP tool and resource registry.
- `output.ts`: MCP result wrapper over the shared surface outcome contract.
- `resources.ts`: read-only resource URI parsing and evidence-client routing.
- `x402-proposal.ts`: strict x402 proposal input schema and runtime-client bridge.
- `digest.ts`: local deterministic digest helper for metadata and proposal evidence binding.

## Failure and scale posture

Unknown fields, authority-shaped fields, stale metadata, not-ready install posture, gateway-offline posture, excessive amount bounds, and protocol/tool errors fail into structured outcomes. The lane does not claim sibling MCP, terminal, browser, cloud, package-manager, repo, or network paths are protected unless source-owned evidence exists.

## Future package target

Potential future package subpath: `handshake-protocol-kernel/mcp`. This is deferred until a public MCP client target, process model, and install posture are deliberately selected.

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
- `test/architecture/mcp-surface-posture.test.ts`
- `test/architecture/surface-boundary-posture.test.ts`

## Public surface

No package-root export in this slice. Source modules are internal until package posture is explicitly decided.

## Extraction trigger

Extract only after the catalog, proposal schema, resource mapping, process custody, and at least one real MCP host transcript are stable under the architecture and claim gates.

## Scope boundary

MCP can propose and display evidence. It cannot authorize, approve, pay, execute, recover, retry, export, certify, install, supervise processes, or hold mutation credentials.
