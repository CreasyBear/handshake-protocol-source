# MCP x402 Reference Transcript

Status: source-owned self-hosted reference transcript
Scope: model-facing MCP proposal and evidence transport for the buyer-side `x402_payment.exact` path

## Invariant At Stake

MCP can help the model propose exact work and read evidence. It cannot create policy authority, greenlights, gateway checks, mutations, receipt exports, credential material, certificate mints, hosted operation, provider custody, cross-org trust, or clearing-house posture.

## Run

From the repo root:

```bash
npm run demo:mcp-transcript
```

The harness writes:

```text
examples/mcp-reference-transcript/output/latest.json
examples/mcp-reference-transcript/output/latest.md
```

## What It Shows

The transcript is generated from source-owned MCP behavior:

- `mcpCatalogSnapshot()`
- `readMcpResource()`
- `proposeMcpX402Payment()`
- shared MCP structured outcomes
- existing CLI readback command IDs

It covers:

- metadata read;
- valid proposal;
- evidence readback;
- stale metadata;
- tools-list change;
- install not ready;
- gateway offline;
- amount mismatch;
- parameter drift;
- replay refusal;
- raw sibling-shaped input;
- proof gap and downstream uncertainty.

## What It Does Not Show

- No public MCP host quickstart.
- No SDK install client.
- No SDK gateway client.
- No CLI public package bin.
- No support bundle behavior.
- No spend ledger.
- No hosted operation.
- No provider custody.
- No external gateway operation claim.
- No broad x402 compatibility.
