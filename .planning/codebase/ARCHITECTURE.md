# Architecture

**Analysis Date:** 2026-05-24

## System Overview

```text
Agent runtime / generated code / operator evidence surfaces
  |  src/runtime/ingress/index.ts
  |  src/sdk/surface-clients/runtime-client.ts
  |  src/mcp/x402-proposal.ts
  |  src/cli/main.ts
  v
HTTP and local transport surfaces
  |  src/http/app.ts
  |  src/http/routes/transition-route-registry.ts
  |  src/http/routes/transition-invokers.ts
  |  src/http/handlers/evidence-read.ts
  v
Protocol kernel authority boundary
  |  src/protocol/kernel.ts
  |  src/protocol/areas/*
  |  src/protocol/events/records.ts
  v
ProtocolStore durable reconstruction truth
  |  src/protocol/store/port.ts
  |  src/storage/d1/index.ts
  |  src/storage/memory/index.ts
  |  migrations/0001_protocol_kernel.sql
  v
Gateway adapter proof lanes
  |  src/adapters/x402-payment/wallet-gateway.ts
  |  src/adapters/auth-md/gateway.ts
  |  src/adapters/package-install/gateway.ts
  |  src/adapters/repo-write/gateway.ts
  |  src/adapters/preview-deploy/gateway.ts
```

Handshake is a TypeScript protocol kernel organized around authority boundaries. Runtime, SDK, CLI, and MCP surfaces can propose or read evidence. The protocol kernel records exact contracts, policy decisions, greenlights, gateway checks, receipts, refusals, proof gaps, and isolation. Gateway adapters are the only mutation-side proof lanes, and mutation-capable adapters must run only after `VerifiedGatewayCheck`.

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Protocol kernel facade | Dispatches typed transition calls into owned protocol areas without taking transport or storage implementation ownership. | `src/protocol/kernel.ts` |
| Protocol areas | Own state-machine primitives such as `ActionContract`, `PolicyDecision`, `Greenlight`, `GatewayCheck`, `Receipt`, `Refusal`, `ProofGap`, and `IsolationState`. | `src/protocol/areas/*` |
| Protocol recorder | Builds canonical stored records, appends stream events, adds transition request context, and converts commit conflicts into protocol errors. | `src/protocol/events/records.ts` |
| Store port | Defines durable records, stream tails, greenlight consumption, idempotency ledger, isolation state, posture, operation claim, and receipt indexes. | `src/protocol/store/port.ts` |
| D1 store | Implements the durable reference store and atomic commits for Worker/D1 operation. | `src/storage/d1/index.ts` |
| Memory store | Implements fixture storage and conflict behavior for tests and local demos. | `src/storage/memory/index.ts` |
| HTTP app | Exposes transition and evidence routes through Hono, caller admission, request context, store resolution, and typed error envelopes. | `src/http/app.ts` |
| HTTP route registry | Maps each route to custody role, scope resolver, request schema, response schema, and transition summary. | `src/http/routes/transition-route-registry.ts` |
| Runtime ingress | Converts observed dispatch blocks into runtime execution, graph evidence, tool-call drafts, intent compilations, action-contract proposals, or refusals. | `src/runtime/ingress/index.ts` |
| SDK role clients | Provide role-scoped runtime proposal and redacted evidence clients without all-role authority transport. | `src/sdk/surface-clients/index.ts` |
| CLI surface | Provides local JSON-output operator/evidence commands; it does not evaluate policy, gateway-check, mutate, or mint certificates. | `src/cli/main.ts` |
| MCP surface | Provides model-facing x402 proposal and read-only evidence resources; it does not hold gateway custody or signer material. | `src/mcp/index.ts` |
| Surface manifest | Defines allowed/forbidden route families, imports, credential shapes, output fields, and non-authority flags for SDK, CLI, and MCP surfaces. | `src/surfaces/boundary-manifest.ts` |
| Install compiler contracts | Define generic install proposal and protected-action adapter-pack contracts. | `src/install/install-proposal/index.ts` |
| Conformance checks | Provide narrow reference conformance probes without certification or provider-side claims. | `src/conformance/index.ts` |
| x402 adapter lane | Owns x402 exact install proposal, official PaymentRequired evidence intake, local/reference sandbox evidence, wallet gateway, bypass probes, and conformance posture. | `src/adapters/x402-payment/*` |

## Pattern Overview

**Overall:** Boundary-layered protocol kernel with append-only evidence records, strict schema transitions, and proposal/evidence surfaces around a single authority core.

**Key Characteristics:**
- Use `src/protocol/areas/*` for authority-bearing primitive meaning; do not place protocol semantics in `src/http`, `src/runtime`, `src/sdk`, `src/cli`, `src/mcp`, or `src/adapters`.
- Use `ProtocolStore` from `src/protocol/store/port.ts` as the reconstruction boundary; D1 and memory are implementations under `src/storage/*`.
- Use `src/surfaces/boundary-manifest.ts` to keep SDK, CLI, and MCP as non-authority product surfaces.
- Use `src/adapters/*` for reference mutation fixtures and upstream evidence normalization only; no adapter family defines the protocol.
- Use `package.json` explicit exports and `server.json` MCP metadata as package surface contracts, not as authority claims.

## Layers

**Protocol Kernel:**
- Purpose: Own exact transition semantics, canonicalization, state-machine rules, proof gaps, refusals, one-use greenlights, gateway checks, and reconstruction objects.
- Location: `src/protocol/`
- Contains: `src/protocol/kernel.ts`, `src/protocol/areas/*`, `src/protocol/foundation/*`, `src/protocol/events/*`, `src/protocol/context/*`, `src/protocol/navigation/*`, `src/protocol/evidence-projections/*`, `src/protocol/public/*`, `src/protocol/store/*`
- Depends on: local protocol area indexes, foundation helpers, event recorder, and store port.
- Used by: `src/http/*`, `src/runtime/*`, `src/adapters/*`, `src/sdk/*`, tests, and examples.

**HTTP Transport:**
- Purpose: Expose protocol transitions and evidence reads over Hono/Worker routes while preserving custody and request context.
- Location: `src/http/`
- Contains: `src/http/app.ts`, `src/http/admission/*`, `src/http/routes/*`, `src/http/handlers/*`, `src/http/errors/*`, `src/http/openapi/*`, `src/http/store/*`
- Depends on: `src/protocol/kernel.ts`, `src/protocol/public/*`, `src/protocol/store/port.ts`, `src/storage/d1/index.ts`
- Used by: `src/worker.ts`, SDK clients, examples, HTTP tests, and D1 integration tests.

**Storage:**
- Purpose: Persist records, event streams, current pointers, one-use consumption, idempotency reservations, isolation states, operation claims, and receipt indexes.
- Location: `src/storage/`
- Contains: `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `src/storage/memory/index.ts`, `src/storage/kv/index.ts`, `src/storage/store.ts`
- Depends on: `src/protocol/store/port.ts` and protocol object/event types.
- Used by: `src/http/store/resolution.ts`, examples, and tests.

**Runtime Proposal:**
- Purpose: Record generated execution evidence and propose contract candidates without issuing policy decisions, greenlights, gateway checks, receipts, or mutations.
- Location: `src/runtime/`
- Contains: `src/runtime/ingress/index.ts`, `src/runtime/package-install/action-proposal.ts`, `src/runtime/repo-write/action-proposal.ts`, `src/runtime/preview-deploy/action-proposal.ts`, `src/runtime/codemode-multi-action/*`
- Depends on: protocol public/area types and action-specific proposal helpers.
- Used by: `src/mcp/x402-proposal.ts`, examples, and runtime tests.

**Adapter Proof Lanes:**
- Purpose: Prove mutation-side discipline, upstream evidence intake, bypass posture, and adapter-pack boundaries for specific protected action families.
- Location: `src/adapters/`
- Contains: `src/adapters/auth-md/*`, `src/adapters/x402-payment/*`, `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, `src/adapters/preview-deploy/gateway.ts`, `src/adapters/protected-path-probes/*`
- Depends on: public gateway verification helpers and protocol schemas.
- Used by: `src/experimental.ts`, conformance tests, adapter tests, integration tests, and local demos.

**SDK, CLI, MCP, and Surfaces:**
- Purpose: Provide package-facing clients, command wrappers, model-facing proposal/evidence transport, and source-owned non-authority surface manifests.
- Location: `src/sdk/`, `src/cli/`, `src/mcp/`, `src/surfaces/`
- Contains: `src/sdk/client.ts`, `src/sdk/surface-clients/*`, `src/cli/*`, `src/mcp/*`, `src/surfaces/boundary-manifest.ts`, `src/surfaces/outcome.ts`
- Depends on: HTTP role/custody types, public protocol schemas, role-scoped transport, and surface manifests.
- Used by: package exports in `package.json`, bins in `bin/`, MCP metadata in `server.json`, examples, and architecture tests.

**Install and Conformance:**
- Purpose: Compile protected-action adapter packs into installable kernel records and expose narrow source-package conformance checks.
- Location: `src/install/`, `src/conformance/`
- Contains: `src/install/install-proposal/index.ts`, `src/install/protected-action-adapter-pack/index.ts`, `src/conformance/index.ts`
- Depends on: protocol schemas, adapter conformance functions, and install-lane schemas.
- Used by: `src/adapters/x402-payment/install-proposal.ts`, CLI x402 commands, conformance tests, and package exports.

## Data Flow

### Primary Request Path

1. A runtime or MCP surface records generated execution evidence and proposal inputs through `RuntimeClient` or direct runtime ingress (`src/sdk/surface-clients/runtime-client.ts:26`, `src/runtime/ingress/index.ts:333`, `src/mcp/x402-proposal.ts:323`).
2. Runtime proposal code records a `RuntimeExecution`, optional `GeneratedExecutionGraph`, and finalized `ToolCallDraft` before compilation (`src/runtime/ingress/index.ts:339`, `src/runtime/ingress/index.ts:342`, `src/runtime/ingress/index.ts:359`, `src/mcp/x402-proposal.ts:347`).
3. The protocol kernel compiles the candidate through `compileIntent`; rejected candidates become refusal evidence and contractable candidates carry exact digests (`src/protocol/kernel.ts:132`, `src/protocol/areas/intent-compilation/transitions.ts:43`, `src/protocol/areas/intent-compilation/transitions.ts:226`).
4. The protocol kernel proposes an exact `ActionContract` from a clean candidate and re-checks pinned catalog, gateway, envelope, runtime, graph, and credential bindings (`src/protocol/kernel.ts:136`, `src/protocol/areas/action-contract/transitions.ts:52`, `src/protocol/areas/action-contract/transitions.ts:131`).
5. The control-plane path evaluates policy, checks isolation, sequence dependencies, protected-path posture, credential bindings, and idempotency before emitting a one-use greenlight or refusal (`src/protocol/kernel.ts:154`, `src/protocol/areas/policy-greenlight/transitions.ts:98`, `src/protocol/areas/policy-greenlight/transitions.ts:161`, `src/protocol/areas/policy-greenlight/transitions.ts:117`).
6. The gateway adapter invokes `gatewayCheck` immediately before consequence; the gate verifies exact greenlight binding, params digest, gateway policy drift, isolation, protected-path posture, credential bindings, sequence dependencies, and consumption state (`src/protocol/kernel.ts:158`, `src/protocol/areas/gateway-gate/transitions.ts:85`, `src/protocol/areas/gateway-gate/transitions.ts:126`).
7. Mutation-side adapter behavior occurs only after `verifiedGatewayCheckFromResult` returns a verified gate; x402 signing happens inside `runX402WalletGateway` after verification and then reconciles downstream status (`src/adapters/x402-payment/wallet-gateway.ts:160`, `src/adapters/x402-payment/wallet-gateway.ts:170`, `src/adapters/x402-payment/wallet-gateway.ts:177`, `src/adapters/x402-payment/wallet-gateway.ts:190`).
8. Records and stream events commit through `ProtocolRecorder` and `ProtocolStore`; D1 commits use batched statements and memory commits stage maps before swapping state (`src/protocol/events/records.ts:76`, `src/storage/d1/index.ts:230`, `src/storage/d1/index.ts:251`, `src/storage/memory/index.ts:153`, `src/storage/memory/index.ts:222`).
9. Evidence reads project redacted contract, graph, transaction-envelope, idempotency, receipt timeline, and install-health views without issuing authority (`src/http/handlers/evidence-read.ts:29`, `src/http/routes/evidence-read-route-registry.ts:38`, `src/protocol/evidence-projections/index.ts`).

### HTTP Transition Flow

1. `createApp` registers health, OpenAPI, transition, evidence, and raw-record diagnostic routes (`src/http/app.ts:29`, `src/http/app.ts:38`, `src/http/app.ts:41`, `src/http/app.ts:45`, `src/http/app.ts:49`).
2. Each transition route declares custody role, schema, scope resolver, and response schema in `transitionRouteDefinitions` (`src/http/routes/transition-route-registry.ts:70`).
3. `handleTransition` authorizes caller custody, builds request context, parses body with a 256 KB cap, resolves store/kernel, and invokes one transition (`src/http/app.ts:91`, `src/http/app.ts:103`, `src/http/app.ts:112`, `src/http/app.ts:124`, `src/http/app.ts:125`).
4. Raw record reads are control-plane diagnostic only and respect `rawReadPosture`, returning not found for `internal_only` objects (`src/http/handlers/internal-record-read.ts:11`, `src/http/handlers/internal-record-read.ts:38`).

### MCP Proposal/Evidence Flow

1. The package bin `handshake-mcp` starts `src/mcp/stdio/entry.ts`, which calls `startHandshakeMcpStdioServer` (`bin/handshake-mcp`, `src/mcp/stdio/entry.ts:1`).
2. The MCP stdio server registers read-only resources and one proposal tool named `handshake.actions.x402_payment.propose` (`src/mcp/stdio/server.ts:35`, `src/mcp/stdio/server.ts:43`, `src/mcp/stdio/server.ts:66`, `src/mcp/catalog.ts:5`).
3. `proposeMcpX402Payment` checks input schema, freshness, install posture, gateway posture, and amount bounds before bridging to runtime proposal methods (`src/mcp/x402-proposal.ts:106`, `src/mcp/x402-proposal.ts:123`, `src/mcp/x402-proposal.ts:151`, `src/mcp/x402-proposal.ts:179`, `src/mcp/x402-proposal.ts:207`).
4. Successful MCP proposal output explicitly carries `authorityCreated: false`, `greenlightCreated: false`, `gatewayCheckPerformed: false`, and `mutationAttempted: false` (`src/mcp/x402-proposal.ts:469`, `src/mcp/output.ts:28`, `src/surfaces/outcome.ts`).

### x402 Sandbox/Evidence Flow

1. x402 official PaymentRequired evidence is decoded and classified as non-authority upstream evidence (`src/adapters/x402-payment/upstream-evidence.ts:51`, `src/adapters/x402-payment/upstream-evidence.ts:68`, `src/adapters/x402-payment/upstream-evidence.ts:122`).
2. The local paid-HTTP sandbox emits an official-shaped 402 challenge and records no authority (`src/adapters/x402-payment/sandbox-http.ts:99`, `src/adapters/x402-payment/sandbox-http.ts:116`, `src/adapters/x402-payment/sandbox-http.ts:133`).
3. The sandbox records one signed retry only when gateway-created signature evidence exists and the provider environment is local reference sandbox (`src/adapters/x402-payment/sandbox-http.ts:147`, `src/adapters/x402-payment/sandbox-http.ts:156`, `src/adapters/x402-payment/sandbox-http.ts:164`).
4. The x402 demo path uses role-scoped SDK clients, local Hono app, memory store, runtime proposal, policy, gateway signing, redacted evidence projection, terminal certificate, and replay refusal (`examples/x402-protected-spend/run.ts:103`, `examples/x402-protected-spend/run.ts:140`, `examples/x402-protected-spend/run.ts:152`, `examples/x402-protected-spend/run.ts:168`, `examples/x402-protected-spend/run.ts:181`, `examples/x402-protected-spend/run.ts:193`).

**State Management:**
- Durable protocol state is owned by `ProtocolStore` (`src/protocol/store/port.ts:145`).
- HTTP resolves a D1 store from Worker binding `DB` or an explicitly injected fallback store (`src/http/store/resolution.ts:17`).
- D1 tables in `migrations/0001_protocol_kernel.sql` hold records, stream events, greenlight consumptions, greenlight issuances, idempotency current entries, recovery terminal claims, protected-path posture, isolation state, operation claims, and receipt indexes.
- Memory state uses in-process maps for tests and examples (`src/storage/memory/index.ts:27`).
- CLI and MCP outputs are structured non-authority envelopes, not state owners (`src/cli/output.ts:32`, `src/mcp/resources.ts:5`).

## Key Abstractions

**HandshakeKernel:**
- Purpose: Single in-process facade for protocol transitions.
- Examples: `src/protocol/kernel.ts`, `src/http/store/resolution.ts`
- Pattern: thin transition delegator over protocol area modules.

**ProtocolStore:**
- Purpose: Durable record/event/index port for reconstruction and conflict semantics.
- Examples: `src/protocol/store/port.ts`, `src/storage/d1/index.ts`, `src/storage/memory/index.ts`
- Pattern: storage adapter interface with explicit commit result enums.

**ProtocolRecord and ContractStreamEvent:**
- Purpose: Append-only evidence objects and digest-chained lifecycle events.
- Examples: `src/protocol/areas/object-registry/schemas.ts`, `src/protocol/events/schemas.ts`, `src/protocol/events/records.ts`
- Pattern: canonical digest records plus stream offsets.

**ActionContract:**
- Purpose: Exact proposed commitment compiled from a candidate action.
- Examples: `src/protocol/areas/action-contract/types.ts`, `src/protocol/areas/action-contract/transitions.ts`
- Pattern: deterministic contract record bound to candidate, envelope, gateway, action type, tool capability, parameters, generated execution evidence, credential refs, bounds, and idempotency.

**PolicyDecision and Greenlight:**
- Purpose: Machine decision and one-use gateway-bound authority object.
- Examples: `src/protocol/areas/policy-greenlight/types.ts`, `src/protocol/areas/policy-greenlight/transitions.ts`
- Pattern: policy input digest plus greenlight issuance claim and idempotency reservation.

**GatewayCheckAttempt and VerifiedGatewayCheck:**
- Purpose: Final pre-mutation enforcement check and verified adapter handoff.
- Examples: `src/protocol/areas/gateway-gate/transitions.ts`, `src/protocol/areas/gateway-gate/index.ts`, `src/adapters/x402-payment/wallet-gateway.ts`
- Pattern: gateway-side exact binding verification before any mutation-side behavior.

**SurfaceBoundaryManifest:**
- Purpose: Source-owned posture table for SDK, CLI, MCP, and deferred surfaces.
- Examples: `src/surfaces/boundary-manifest.ts`, `test/architecture/surface-boundary-posture.test.ts`
- Pattern: architecture-test-consumed contract for non-authority outputs, imports, route families, and credential shapes.

**RuntimeIngressDispatchBlock:**
- Purpose: Normalized runtime observation over wrapped, raw sibling, and ambiguous dispatches.
- Examples: `src/runtime/ingress/index.ts`, `test/runtime/runtime-ingress.test.ts`
- Pattern: discriminated union that can propose clean action contracts or refuse bypass/ambiguous dispatches.

**InstallProposal and ProtectedActionAdapterPack:**
- Purpose: Product-facing setup contracts that compile protected action paths into tool/action/gateway/envelope records.
- Examples: `src/install/install-proposal/index.ts`, `src/install/protected-action-adapter-pack/index.ts`, `src/adapters/x402-payment/install-proposal.ts`
- Pattern: installable records or refusal reasons; setup is not permission.

## Entry Points

**Package Root:**
- Location: `src/index.ts`
- Triggers: package root import from `handshake-protocol-kernel`.
- Responsibilities: export curated protocol, HTTP, authority-certificate verify, gateway verification helper, and low-level `HandshakeClient` surface without exporting MCP/CLI proposal internals.

**Experimental Reference Surface:**
- Location: `src/experimental.ts`
- Triggers: explicit `handshake-protocol-kernel/experimental` subpath.
- Responsibilities: export reference adapter profiles and gateway fixtures with `experimental*` names.

**Cloudflare Worker:**
- Location: `src/worker.ts`
- Triggers: Worker fetch handler via `wrangler.toml`.
- Responsibilities: instantiate Hono app and delegate `fetch` to HTTP layer.

**HTTP App:**
- Location: `src/http/app.ts`
- Triggers: Worker, tests, examples, SDK fetch adapters.
- Responsibilities: route registration, caller admission, request context, body parsing, store/kernel resolution, transition invocation, evidence reads, OpenAPI, typed errors.

**Runtime Package Subpath:**
- Location: `src/runtime/index.ts`
- Triggers: `handshake-protocol-kernel/runtime`.
- Responsibilities: expose runtime ingress schema and proposal helper; no policy, greenlight, gateway check, receipt, or mutation.

**Role-Scoped SDK Subpath:**
- Location: `src/sdk/surface-clients/index.ts`
- Triggers: `handshake-protocol-kernel/sdk/role-clients`.
- Responsibilities: expose `RuntimeClient` and `EvidenceClient` only.

**CLI Bin:**
- Location: `bin/handshake`, `src/cli/main.ts`
- Triggers: `handshake schema`, `handshake evidence *`, `handshake cert verify`, `handshake install x402-payment`, `handshake probes x402-payment`, `handshake conformance x402-payment`.
- Responsibilities: local manifest/readiness/evidence/conformance/certificate verification output with non-authority flags.

**MCP Bin:**
- Location: `bin/handshake-mcp`, `src/mcp/stdio/entry.ts`, `src/mcp/stdio/server.ts`, `server.json`
- Triggers: `handshake-mcp` or package-name bin `handshake-protocol-kernel`.
- Responsibilities: local stdio MCP proposal/evidence server for x402 exact proposal and read-only evidence resources.

**Conformance Subpath:**
- Location: `src/conformance/index.ts`
- Triggers: `handshake-protocol-kernel/conformance`.
- Responsibilities: protected mutation adapter probe checks and x402 first-wedge conformance classifiers.

**Local Demos:**
- Location: `examples/self-hosted-activation/run.ts`, `examples/x402-protected-spend/run.ts`, `examples/mcp-reference-transcript/run.ts`
- Triggers: `npm run demo:self-hosted`, `npm run demo:aps`, `npm run demo:mcp-transcript`.
- Responsibilities: generate local evidence packets and proof reports without hosted/provider/cross-org claims.

## Architectural Constraints

- **Tier boundary:** Tier 1 kernel authority lives in `src/protocol/*` and gateway enforcement in `src/protocol/areas/gateway-gate/*`; Tier 2 surfaces under `src/cli/*`, `src/mcp/*`, `src/sdk/surface-clients/*`, and `src/surfaces/*` must not reopen policy, greenlight, gateway, receipt, mutation, credential-custody, or certificate-minting authority.
- **CLI/MCP posture:** CLI and MCP are proposal/evidence surfaces. `src/cli/command-manifest.ts`, `src/mcp/catalog.ts`, `src/mcp/resources.ts`, and `src/surfaces/boundary-manifest.ts` must preserve non-authority flags and forbidden route/import boundaries.
- **Threading:** Runtime is single JavaScript event loop; atomicity is provided by protocol/store commit semantics, D1 batch behavior, and in-memory staged map swaps, not threads.
- **Global state:** Source modules use constants and schemas. Runtime authority state must be passed through `ProtocolStore`. `examples/x402-protected-spend/run.ts` uses module-level local demo objects and is not reusable authority infrastructure.
- **Circular imports:** No circular dependency was identified during this source survey. Import direction is guarded by `test/architecture/import-posture.test.ts` and lane manifests such as `src/protocol/LANE.md`, `src/http/LANE.md`, and `src/mcp/LANE.md`.
- **Package surface:** `package.json` exports root, `./runtime`, `./sdk/role-clients`, `./cli`, `./mcp`, `./conformance`, `./experimental`, and `./package.json`; public Node imports resolve to bundled `dist/*` files and Bun local development resolves to `src/*` through the `bun` condition.
- **MCP registry surface:** `server.json` and `package.json#mcpName` describe local stdio MCP proposal/evidence server metadata only.
- **Credential material:** Protocol records may carry refs and digests. Raw signer, payment payload, `PAYMENT-SIGNATURE`, private key, and provider secret material must stay out of runtime, CLI, MCP, and evidence projections.

## Anti-Patterns

### Surface As Gate

**What happens:** CLI, MCP, SDK, HTTP evidence reads, or review artifacts are treated as authorization or enforcement.
**Why it's wrong:** `src/cli/*`, `src/mcp/*`, `src/sdk/surface-clients/*`, and `src/http/handlers/evidence-read.ts` are proposal/evidence/read surfaces. They do not own policy, one-use greenlight issuance, gateway checks, or mutation.
**Do this instead:** Route authority through `src/protocol/areas/policy-greenlight/*` and `src/protocol/areas/gateway-gate/*`; keep surface limits explicit in `src/surfaces/boundary-manifest.ts`.

### Runtime As Authority

**What happens:** A runtime ingress helper emits a greenlight, gateway check, receipt, or mutation command.
**Why it's wrong:** Runtime evidence is caller-observed evidence. It can refuse unsafe or bypass-shaped traces, but it cannot prove gateway enforcement.
**Do this instead:** Keep runtime outputs to runtime evidence, graph evidence, tool-call drafts, intent compilations, action contracts, and refusals in `src/runtime/ingress/index.ts`.

### Adapter Mutation Before Gate

**What happens:** An adapter signs, deploys, writes, installs, or calls a protected service before validating `VerifiedGatewayCheck`.
**Why it's wrong:** That lets generated code escape the contract boundary and collapses policy/gate evidence.
**Do this instead:** Follow `src/adapters/x402-payment/wallet-gateway.ts`: call `gatewayCheck`, require `verifiedGatewayCheckFromResult`, then perform mutation-side behavior and reconciliation.

### Planning Scratch As Canon

**What happens:** Files under `.planning/` become product truth, repo-facing names, package scripts, CI labels, source paths, or public docs.
**Why it's wrong:** `.planning/` is explicitly scratch; canonical truth lives in `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, and `docs/internal/*`.
**Do this instead:** Promote durable repo truth into `docs/internal/decisions.md`, `docs/internal/protocol-definition.md`, `docs/internal/protocol-kernel-architecture.md`, or `docs/internal/protocol-notes.md`.

### x402 Spend Window Overclaim

**What happens:** x402 session/day/review spend windows are described as enforced.
**Why it's wrong:** Current x402 spend enforcement is per-call only; window fields are metadata until a ledger exists.
**Do this instead:** Keep per-call enforcement in `src/adapters/x402-payment/action-proposal.ts` and `src/adapters/x402-payment/wallet-gateway.ts`; represent aggregate spend limits as missing proof objects in `examples/x402-protected-spend/run.ts`.

## Error Handling

**Strategy:** Use typed protocol errors, durable refusals/proof gaps, explicit conflict results, and structured non-authority surface outputs.

**Patterns:**
- Throw `HandshakeProtocolError` with code, status, retryability, commit state, proof refs, or refusal refs for protocol and HTTP transition errors (`src/protocol/foundation/errors.ts`, `src/http/errors/transition-error-envelope.ts`).
- Store denials as explicit `Refusal` objects, not logs (`src/protocol/areas/refusal/*`, `src/protocol/areas/intent-compilation/transitions.ts:226`).
- Store missing, ambiguous, expired, unavailable, or contradictory evidence as `ProofGap` objects (`src/protocol/areas/proof-gap/*`).
- Convert D1/memory commit conflicts into explicit results and replay refusals (`src/storage/d1/index.ts`, `src/storage/memory/index.ts`, `src/protocol/areas/gateway-gate/replay-refusal/index.ts`).
- Return CLI and MCP envelopes that keep authority flags false and name next action/retryability (`src/cli/output.ts`, `src/mcp/output.ts`, `src/surfaces/outcome.ts`).

## Cross-Cutting Concerns

**Logging:** No central logging framework is present. Source surfaces return structured JSON evidence and errors through `src/http/errors/*`, `src/cli/output.ts`, and `src/mcp/output.ts`.

**Validation:** Use Zod strict schemas at every boundary, including protocol public inputs/schemas, HTTP route schemas, runtime ingress schemas, CLI command inputs, MCP inputs/resources, install proposals, and x402 adapter evidence (`src/protocol/public/*`, `src/http/routes/*`, `src/runtime/ingress/index.ts`, `src/cli/*`, `src/mcp/*`, `src/adapters/x402-payment/*`).

**Authentication:** HTTP transition and evidence reads use role-scoped bearer custody for `control_plane`, `runtime_evidence`, `gateway_custody`, and `review_custody` (`src/http/admission/caller-auth.ts`). This is deployment-mode caller custody, not production org auth or provider enforcement.

**Redaction:** Evidence projections, CLI output, MCP resources, and x402 gateway evidence must expose refs/digests rather than raw credential material (`src/protocol/evidence-projections/*`, `src/cli/output.ts`, `src/mcp/resources.ts`, `src/adapters/x402-payment/wallet-gateway.ts`).

**Package Surface:** `package.json`, `server.json`, `scripts/check-package-surface.mjs`, `scripts/check-published-entrypoints.mjs`, and `test/architecture/package-surface.test.ts` define and verify publishable package entrypoints, bundled Node bins, MCP registry metadata, and excluded scratch/test paths.

**Visible Dirty State:** Current worktree state includes dirty x402 sandbox/evidence work under `src/adapters/x402-payment/action-proposal.ts`, `src/adapters/x402-payment/index.ts`, `src/adapters/x402-payment/upstream-evidence.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, untracked `src/adapters/x402-payment/sandbox-http.ts`, `src/runtime/ingress/index.ts`, `examples/x402-protected-spend/*`, and x402 tests. Treat these files as current architecture state for this map.

---

*Architecture analysis: 2026-05-24*
