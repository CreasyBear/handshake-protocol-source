# Handshake Protocol Kernel

Handshake is protected action infrastructure for automated decision making.
The category is protected actions for automated decision making; engineering-agent workflows are an adoption and generated-execution stress context, not the product boundary.

Last canonical audit: 2026-05-24.

This checkout is the TypeScript protocol kernel for protected action control:

```text
vague principal intent
-> runtime execution evidence
-> generated execution graph
-> intent compilation record
-> candidate action
-> exact action contract
-> policy decision
-> one-use greenlight or refusal
-> gateway check before mutation
-> receipt, refusal, or proof gap
-> optional terminal AuthorityCertificate
```

The kernel does not claim hosted operation, provider-side enforcement, broad agent governance, or downstream business success. A path is protected only when the gateway owns the mutation credential and verifies the exact greenlight before mutation.

Current local foundation status: source and tests cover the protected-action kernel chain, derived lifecycle evidence, idempotency ledger, redacted evidence projections including agent transaction envelopes, terminal AuthorityCertificate minting and offline pinned-key verification, package-install supply-chain gate binding, the narrow official x402 exact buyer-side proof path through D1/HTTP durable evidence, a local/reference paid-HTTP sandbox that emits an official-shaped 402 challenge and observes one signed retry only after gateway-created signature evidence, official x402 SDK signer-custody/bypass probes, public runtime ingress for local x402 payment and package-install dispatch boundaries, a source-owned local MCP stdio proposal/evidence process proof, and publishable Node-bundled CLI/MCP entrypoints with MCP Registry metadata. x402 coverage is one official buyer-side `exact` per-call path with local/reference sandbox challenge/retry evidence and gateway-held `PaymentPayload` / `PAYMENT-SIGNATURE` creation after `VerifiedGatewayCheck`; package install remains a regression fixture. No adapter family defines the protocol. This is local kernel foundation, not broad x402 compatibility, not live provider custody, hosted operation, generic MCP/runtime control, external package-material attestation, cross-org AuthorityCertificate trust, live JWKS/revocation, hosted verifier operation, facilitator operation, seller middleware, unsupported x402 schemes, marketplace/certification, or aggregate payment-budget management. Runtime ingress and MCP are observer/compiler/proposal evidence surfaces and current x402 spend enforcement is per-call only; aggregate payment-budget management is intentionally outside the current remit.

## Repo Truth

- `AGENTS.md`: system doctrine and invariant language.
- `QUALITY.md`: TypeScript quality, naming, and verification bar.
- `STRUCTURE.md`: source/test/docs ownership map.
- `docs/internal/decisions.md`: durable product and architecture decisions.
- `docs/internal/protocol-definition.md`: canonical protocol definition and authority rule.
- `docs/internal/protocol-kernel-architecture.md`: protocol kernel architecture and schema map.
- `docs/internal/protocol-layman.md`: plain-English translation of the protocol.
- `docs/internal/protocol-notes.md`: compact protocol notes for implementers.

Files under `.planning/` are scratch. They are not repo truth.

Each first-level `src/*` lane also has a `LANE.md` manifest. Those manifests are local ownership contracts; they do not supersede the canonical documents above.

Operational enforcement surfaces:

- `package.json`: canonical local command contract.
- `.github/workflows/check.yml`: CI gate; it must run `npm run check:repo`.
- `test/architecture/*`: repo-shape, naming, import, vocabulary, and export guards.
- `src/*/LANE.md`: source-lane ownership contracts.

## System Design Posture

This repo treats platform aesthetics as system design clarity:

- use case: convert automated-decision execution, including generated engineering-agent execution, into exact protected-action authority decisions;
- constraints: generated code may branch, retry, overreach, or hide consequence inside tool calls;
- high-level design: runtime evidence -> protocol kernel -> durable store -> HTTP transport -> gateway adapters;
- tradeoff: consistency beats availability for authority-bearing transitions;
- failure posture: refusals, isolation, replay refusal, and proof gaps are product outcomes, not log noise.

## Source Map

```text
src/
  protocol/
    kernel.ts
    public/          public schemas, inputs, and transition guard exports
    foundation/      canonicalization, ids, errors, reason codes, core schemas
    events/          stream events, chains, and record commits
    context/         transition request context records
    navigation/      protocol transition metadata
    evidence-projections/
                     redacted diagnostic projections
    store/           protocol store port
    areas/           owned protocol primitives
  install/           protected-action install proposal compiler
  http/
    app.ts
    app-options.ts
    admission/       caller custody and hosted admission seams
    routes/          route metadata, dispatch, scope, response schemas
    handlers/        evidence and internal read handlers
    errors/          HTTP transition error envelopes and codes
    openapi/         OpenAPI projection
    navigation/      HTTP route navigation metadata
    store/           store and kernel resolution
  runtime/           generated-execution proposal helpers
  adapters/          reference gateway fixtures
  conformance/       reference conformance checks
  storage/           D1, memory, KV, and store plumbing
  sdk/               typed HTTP client
  cli/               local evidence and command-manifest wrappers
  mcp/               model-facing proposal/evidence schema and resource mappings
  surfaces/          non-authority surface boundary manifests and shared outcomes
  index.ts           curated package export surface
  experimental.ts    explicit experimental reference gateway surface
  worker.ts          Cloudflare Worker entrypoint
```

Other repo surfaces:

```text
migrations/          D1 schema for protocol storage
wrangler.toml        Worker binding and deployment config
.github/             CI bound to npm run check:repo
```

```text
test/
  architecture/      repo shape, naming, exports, vocabulary
  protocol/          primitive and state-machine invariants
  conformance/       reference conformance checks
  http/              transport and D1-over-HTTP behavior
  runtime/           generated-execution proposal helpers
  mcp/               model-facing proposal/evidence surface contracts
  adapters/          reference gateway fixtures
  integration/       end-to-end protected action paths
  support/           test fixtures and harnesses
```

## Commands

Prerequisites: Bun `1.3.9` for local development/tests and Node.js for the packaged CLI/MCP entrypoints.

First run:

```bash
bun install --frozen-lockfile
npm run check:repo
```

Self-hosted activation packet:

```bash
npm run demo:self-hosted
```

This writes the local activation packet to:

```text
examples/self-hosted-activation/output/latest.md
examples/self-hosted-activation/output/latest.json
```

Inspect the packet for the x402 exact proposal path, policy decision, gateway
check, replay refusal, proof-gap posture, CLI evidence readbacks, local terminal
certificate verification, MCP reference transcript, and real local MCP stdio
process proof. This is a self-hosted local packet only: not hosted operation,
not provider/customer custody, not broad MCP/browser/shell/network/package
manager protection, not aggregate payment-budget management, not WorkOS/auth.md
attestation, not cross-org certificate trust, and not a clearing-house claim.

Component x402 protected-action walkthrough:

```bash
npm run demo:aps
```

This writes the buyer-readable local x402 protected-spend report to:

```text
examples/x402-protected-spend/output/latest.md
examples/x402-protected-spend/output/latest.json
```

Inspect the report for the local 402 challenge, exact runtime proposal, action
contract, policy decision, gateway check, post-gate signed retry evidence,
replay refusal, proof-gap posture, redacted evidence refs, and local terminal
certificate verification. This is local/reference evidence only: not hosted
operation, not broad x402 compatibility, not provider custody, not aggregate
payment-budget management, not cross-org trust, and not a clearing-house claim.

Role-scoped SDK activation imports:

```ts
import { EvidenceClient, RuntimeClient } from "handshake-protocol-kernel/sdk/role-clients";
```

Use this subpath for runtime proposal and redacted evidence readback. It is not
an install client, gateway client, signer surface, policy evaluator, receipt
exporter, or certificate minter. The package root still exposes the lower-level
`HandshakeClient` for route parity and tests, but first-slice activation should
not teach all-role or fallback-token usage.

Packaged CLI and MCP entrypoints:

```bash
npm run build
node bin/handshake schema
node bin/handshake-mcp
```

After package installation, the human/operator CLI command is `handshake`.
The local stdio MCP server command is `handshake-mcp`; the package-name bin
`handshake-protocol-kernel` also points to the MCP server so MCP registry
package installs have a server-shaped default executable. Both entrypoints run
from bundled Node artifacts under `dist/`; they are not source-only Bun
shortcuts.

MCP Registry publication metadata:

```text
server.json
package.json#mcpName
```

`server.json` describes one npm/stdio MCP package named
`io.github.joelchan/handshake-protocol-kernel` and must stay synchronized with
`package.json#mcpName`, `name`, and `version`. Registry publication still
requires npm authentication and MCP Registry namespace authentication. The MCP
server remains proposal/evidence only: not policy, not greenlight, not gateway
check, not mutation, not receipt export, not authority-certificate minting, not
hosted operation, and not provider custody.

Model-facing MCP reference transcript:

```bash
npm run demo:mcp-transcript
```

This writes the source-owned MCP proposal/evidence transcript to:

```text
examples/mcp-reference-transcript/output/latest.md
examples/mcp-reference-transcript/output/latest.json
```

Inspect the transcript for metadata read, valid proposal, evidence readback,
stale metadata, tools-list change, install-not-ready, gateway-offline,
amount/params mismatch, replay refusal, raw sibling-shaped input, and proof-gap
cases. The self-hosted packet also starts the local stdio MCP process and exercises it
through the official MCP client SDK. MCP remains proposal/evidence posture only:
not policy, not greenlight, not gateway check, not mutation, not hosted
operation, and not provider custody.

| Command                       | Purpose                                                                             |
| ----------------------------- | ----------------------------------------------------------------------------------- |
| `npm run check:repo`          | Full local and CI gate: types, lint, format, Bun tests, pack check, whitespace diff |
| `npm run demo:self-hosted`    | Self-hosted activation packet                                                       |
| `npm run demo:aps`            | Local x402 protected-spend authority proof report                                   |
| `npm run demo:mcp-transcript` | Source-owned MCP x402 proposal/evidence transcript                                  |
| `npm run check:types`         | CI-stable no-pretty TypeScript gate                                                 |
| `npm run typecheck`           | Interactive TypeScript alias                                                        |
| `npm run lint`                | ESLint over `src` and `test` with zero warnings                                     |
| `npm run format:check`        | Prettier check                                                                      |
| `npm run test`                | All Bun tests                                                                       |
| `npm run build`               | Declaration build plus Node bundles for public imports and CLI/MCP bins             |
| `npm run pack:check`          | Dry-run package, package surface, and published entrypoint smoke check              |
| `npm run dev`                 | Wrangler Worker dev after local D1/KV bindings are configured                       |

Focused gates:

```bash
npm run quality:architecture
npm run quality:storage
npm run quality:claims
```

CI runs `npm run check:repo` from `.github/workflows/check.yml`.

## Working Rule

Do not broaden claims when moving files. Renames are allowed when they improve ownership clarity, but they must preserve protocol behavior, root export curation, and existing invariant tests.
