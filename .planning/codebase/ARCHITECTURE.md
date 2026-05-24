<!-- refreshed: 2026-05-24 -->
# Architecture

**Analysis Date:** 2026-05-24

## System Overview

```text
Tracked canon and lane contracts
`AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/*`, `src/*/LANE.md`
        |
        v
Non-authority proposal/evidence surfaces
`src/runtime`, `src/mcp`, `src/sdk`, `src/cli`, `src/surfaces`
        |
        v
HTTP / Worker transport
`src/http/app.ts`, `src/http/routes/*`, `src/http/admission/*`, `src/worker.ts`
        |
        v
Protocol kernel and protocol-owned transitions
`src/protocol/kernel.ts`, `src/protocol/areas/*`, `src/protocol/foundation/*`
        |
        +-------------------------+
        |                         |
        v                         v
Durable reconstruction store      Gateway-held protected mutation fixtures
`src/protocol/store/port.ts`      `src/adapters/*/gateway.ts`
`src/storage/d1/index.ts`         `src/adapters/x402-payment/wallet-gateway.ts`
`migrations/0001_protocol_kernel.sql`
        |                         |
        v                         v
Receipts, refusals, proof gaps    Protected surface operation evidence
`src/protocol/areas/receipt-export`
`src/protocol/areas/refusal`
`src/protocol/areas/proof-gap`
`src/protocol/evidence-projections`
```

The repo is a TypeScript protocol kernel for protected action control. It is not a hosted product, not broad runtime interception, and not provider custody. A path is protected only when a gateway owns or controls the mutation credential, checks the exact one-use greenlight before mutation, and records gateway/receipt/proof-gap evidence.

`.planning/` is derived scratch. Architecture claims in this file are grounded in tracked canon and current source, especially `README.md`, `STRUCTURE.md`, `QUALITY.md`, `docs/internal/decisions.md`, `docs/internal/protocol-definition.md`, `docs/internal/protocol-kernel-architecture.md`, and `docs/internal/protocol-notes.md`.

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Canonical doctrine | Defines Handshake invariants, claim boundaries, and source priority. | `AGENTS.md`, `README.md`, `docs/internal/decisions.md` |
| Protocol kernel facade | Exposes the transition surface and delegates to protocol-owned areas. | `src/protocol/kernel.ts` |
| Protocol areas | Own primitive schemas, inputs, transitions, guards, evidence, refusal, proof-gap, recovery, and receipt behavior. | `src/protocol/areas/*` |
| Protocol foundation | Owns canonicalization, IDs, content digests, reason codes, errors, core schemas, and transition guards. | `src/protocol/foundation/*` |
| Protocol navigation | Owns transition metadata and source-owned route/navigation truth below HTTP. | `src/protocol/navigation/index.ts` |
| Public protocol aggregation | Re-exports schemas and inputs without behavior. | `src/protocol/public/schemas.ts`, `src/protocol/public/inputs.ts` |
| Event/record recorder | Builds canonical records and ordered stream events for reconstruction. | `src/protocol/events/records.ts`, `src/protocol/events/chains.ts` |
| Store port | Defines atomic commit, greenlight consumption, idempotency, isolation, posture, receipt, and stream interfaces. | `src/protocol/store/port.ts` |
| D1 store | Implements durable reconstruction and indexed authority-state commits for the Worker/D1 reference path. | `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `migrations/0001_protocol_kernel.sql` |
| Memory store | Implements fixture/invariant oracle behavior for tests and local examples. | `src/storage/memory/index.ts` |
| HTTP transport | Owns Hono app wiring, route admission, body parsing, route dispatch, request context, OpenAPI, and evidence reads. | `src/http/app.ts`, `src/http/routes/*`, `src/http/admission/*`, `src/http/handlers/*` |
| SDK clients | Send typed HTTP requests and read redacted evidence; role clients remain non-authority runtime/evidence surfaces. | `src/sdk/client.ts`, `src/sdk/surface-clients/*` |
| Runtime ingress | Turns observed generated execution dispatches into runtime evidence, graph evidence, tool-call drafts, compilations, contracts, or refusals. | `src/runtime/ingress/index.ts`, `src/runtime/codemode-multi-action/*` |
| MCP surface | Exposes model-facing proposal and evidence resources with explicit non-authority flags and a local stdio server. | `src/mcp/catalog.ts`, `src/mcp/x402-proposal.ts`, `src/mcp/resources.ts`, `src/mcp/stdio/server.ts`, `bin/handshake-mcp` |
| Surface boundary manifest | Defines allowed/forbidden route families, imports, credential shapes, output fields, and non-authority flags for SDK/CLI/MCP surfaces. | `src/surfaces/boundary-manifest.ts` |
| Install compiler | Defines adapter-pack install proposal records; endpoint discovery and adapter registry presence are inputs, not permission. | `src/install/install-proposal/index.ts`, `src/install/protected-action-adapter-pack/index.ts` |
| Reference adapters | Demonstrate gateway-side mutation discipline after `VerifiedGatewayCheck`; they are proof lanes, not provider enforcement claims. | `src/adapters/*` |
| x402 wallet gateway | Holds the official x402 signer/payment payload creation inside the gateway adapter after a verified gate. | `src/adapters/x402-payment/wallet-gateway.ts` |
| Auth.md adapter | Demonstrates gateway credential refs, post-gate credential resolution evidence, downstream proof gaps, lifecycle isolation, and redaction. | `src/adapters/auth-md/*` |
| Conformance checks | Verify narrow adapter and protocol posture without standards certification claims. | `src/conformance/index.ts`, `test/conformance/*` |
| Architecture guardrails | Enforce import posture, root export curation, surface boundaries, claims vocabulary, CLI/MCP posture, and package surface. | `test/architecture/*` |
| Package publication surface | Builds Node bundles, exposes CLI/MCP bins, and declares MCP Registry metadata without changing authority semantics. | `package.json`, `bin/*`, `server.json`, `scripts/build-package-bundles.mjs`, `scripts/check-published-entrypoints.mjs` |

## Pattern Overview

**Overall:** authority-bound protocol kernel with ports/adapters around non-authority surfaces and gateway-held mutation fixtures.

**Key Characteristics:**
- Protocol meaning lives under `src/protocol/`; HTTP, SDK, runtime, MCP, CLI, storage, and adapters must not redefine policy, proof, or mutation authority.
- Runtime and MCP may propose and expose evidence, but they return explicit `authorityCreated: false`, `greenlightCreated: false`, `gatewayCheckPerformed: false`, and `mutationAttempted: false` posture in `src/runtime/ingress/index.ts`, `src/mcp/output.ts`, and `src/mcp/resources.ts`.
- `Greenlight` is one-use and gateway-bound; `GatewayCheckAttempt` is the pre-mutation enforcement point in `src/protocol/areas/gateway-gate/transitions.ts`.
- `GatewayCredentialRef` and `CredentialResolutionEvidence` are provider-neutral, redacted records in `src/protocol/areas/credential-custody/*`; credential resolution evidence is recorded only after a passed gateway check.
- Receipts, refusals, proof gaps, recovery, isolation, and stream events are first-class records in `src/protocol/areas/*` and `src/protocol/events/*`.
- D1 and memory stores implement `ProtocolStore`; D1 is the reference durable reconstruction source, while KV is cache posture only.
- Reference adapter families (`package-install`, `repo-write`, `preview-deploy`, `x402-payment`, `auth-md`) prove local/reference behavior and do not define the protocol.

## Layers

**Canon And Guardrail Layer:**
- Purpose: Preserve the doctrine, source priority, local/reference claim boundary, and Tier 1 foundation rules.
- Location: `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/*`, `src/*/LANE.md`, `test/architecture/*`.
- Contains: Handshake invariants, canonical source list, ownership tables, lane manifests, package publish-surface checks, import-posture tests, claim-boundary tests.
- Depends on: Current source and package scripts in `package.json`.
- Used by: All future implementation, docs refresh, mappers, quality gates.

**Protocol Layer:**
- Purpose: Own exact action-contract authority semantics and state transitions.
- Location: `src/protocol/`.
- Contains: `HandshakeKernel`, protocol areas, schemas, inputs, transition guards, canonicalization, events, store port, evidence projections, protocol navigation.
- Depends on: Zod, local protocol modules, `ProtocolStore`.
- Used by: `src/http`, `src/runtime`, `src/sdk`, `src/adapters`, `src/storage`, tests.

**Storage Layer:**
- Purpose: Persist protocol records, stream events, greenlight consumption, idempotency ledger pointers, isolation pointers, protected-path posture pointers, operation claims, and receipt indexes.
- Location: `src/storage/`, `migrations/0001_protocol_kernel.sql`.
- Contains: `D1ProtocolStore`, `InMemoryProtocolStore`, KV cache helpers, D1 statement assembly.
- Depends on: `src/protocol/store/port.ts`, protocol object metadata, Cloudflare D1 types.
- Used by: `src/http/store/resolution.ts`, tests, examples.

**HTTP Transport Layer:**
- Purpose: Expose protocol transitions and evidence reads over Hono/Worker routes without owning protocol meaning.
- Location: `src/http/`, `src/worker.ts`.
- Contains: `createApp`, route definitions, route invokers, admission, request context, errors, evidence handlers, OpenAPI projection, store resolution.
- Depends on: `src/protocol/kernel.ts`, `src/protocol/public/*`, `src/storage/d1`, `src/storage/memory`.
- Used by: `src/sdk`, Worker entrypoint, HTTP/D1 integration tests.

**Runtime Proposal Layer:**
- Purpose: Convert observed generated execution into protocol proposal evidence and refuse ambiguous/bypass-shaped dispatches.
- Location: `src/runtime/`.
- Contains: runtime ingress schemas, package-install/x402/auth.md dispatch families, codemode multi-action runner, graph evidence builders.
- Depends on: protocol public area indexes and action-proposal helpers.
- Used by: `./runtime` package subpath, MCP proposal bridge, runtime tests.

**MCP Surface Layer:**
- Purpose: Provide model-facing metadata, one x402 proposal tool, read-only evidence resources, local stdio process proof, and packageable stdio bin without authority.
- Location: `src/mcp/`.
- Contains: MCP catalog, structured output wrapper, strict x402 proposal input, resource URI mapping, local stdio server/process proof.
- Depends on: `src/sdk/surface-clients`, `src/surfaces`, local MCP modules, MCP SDK packages.
- Used by: `examples/mcp-reference-transcript`, `test/mcp/*`, self-hosted activation packet.

**Package Publication Layer:**
- Purpose: Make the CLI and MCP surfaces installable from npm while preserving source-owned non-authority posture.
- Location: `package.json`, `bin/`, `dist/`, `server.json`, `scripts/check-package-surface.mjs`, `scripts/check-published-entrypoints.mjs`.
- Contains: Node ESM bundles, thin bin wrappers, MCP Registry metadata, dry-run package surface checks, and published-entrypoint smoke checks.
- Depends on: source entrypoints under `src/cli`, `src/mcp`, `src/runtime`, `src/sdk`, `src/conformance`, and `src/experimental`.
- Used by: `npm run build`, `npm run pack:check`, npm publish preparation, MCP Registry preparation.

**Adapter/Gateway Layer:**
- Purpose: Demonstrate protected mutation fixtures that execute only after a `VerifiedGatewayCheck`.
- Location: `src/adapters/`.
- Contains: x402 wallet gateway, package install gateway, repo-write gateway, preview-deploy gateway, auth.md protected API call gateway, bypass probes, adapter conformance.
- Depends on: public gateway verification helpers and protocol schemas; x402 official signer imports are confined to `src/adapters/x402-payment/wallet-gateway.ts`.
- Used by: `src/experimental.ts`, examples, adapter/integration/conformance tests.

**SDK/CLI/Operator Surfaces:**
- Purpose: Provide typed client ergonomics and local evidence commands while preserving non-authority posture.
- Location: `src/sdk/`, `src/cli/`.
- Contains: `HandshakeClient`, role-scoped `RuntimeClient`/`EvidenceClient`, CLI command manifest, local evidence renderers, certificate verification wrapper.
- Depends on: HTTP route shapes and public schemas; CLI may verify supplied terminal certificates but does not mint them.
- Used by: examples, tests, local activation flows.

## Data Flow

### Primary Protected Action Path

1. A runtime or model-facing host records execution/proposal evidence through runtime/MCP/SDK/HTTP; runtime ingress starts at `proposeRuntimeIngressActionContracts()` (`src/runtime/ingress/index.ts:328`) and MCP proposal uses `proposeMcpX402Payment()` (`src/mcp/x402-proposal.ts:102`).
2. The kernel records runtime evidence and generated graph evidence through `HandshakeKernel.createRuntimeExecution()` and `HandshakeKernel.createGeneratedExecutionGraph()` (`src/protocol/kernel.ts:105`, `src/protocol/kernel.ts:109`).
3. The compiler emits a `CandidateAction` or refusal via `compileIntent()` (`src/protocol/areas/intent-compilation/transitions.ts:43`); candidate digests include protected parameters, secret refs, and gateway credential refs.
4. `proposeActionContract()` verifies candidate, catalog, gateway, envelope, runtime/graph, parameter, recovery, and credential-ref bindings before committing the exact `ActionContract` (`src/protocol/areas/action-contract/transitions.ts:52`, `src/protocol/areas/action-contract/transitions.ts:67`).
5. `evaluatePolicy()` loads the contract/envelope, current isolation state, protected-path posture, sequence dependency state, idempotency ledger state, and gateway credential binding state before deciding refusal/review/greenlight (`src/protocol/areas/policy-greenlight/transitions.ts:98`, `src/protocol/areas/policy-greenlight/transitions.ts:161`).
6. If policy greenlights, the policy layer reserves idempotency and emits one `Greenlight`; the response still says no gateway check or mutation occurred (`src/protocol/areas/policy-greenlight/transitions.ts:117`, `src/protocol/areas/policy-greenlight/transitions.ts:335`).
7. The gateway calls `gatewayCheck()` with observed parameters; the gate recomputes params digest, checks policy drift, isolation, protected-path posture, credential bindings, sequence dependencies, and greenlight status (`src/protocol/areas/gateway-gate/transitions.ts:85`, `src/protocol/areas/gateway-gate/transitions.ts:126`).
8. The store atomically consumes the greenlight and commits `GatewayCheckAttempt`, optional `MutationAttempt`, `Receipt`, optional `Refusal`, optional `ProofGap`, stream events, operation-claim indexes, and idempotency updates (`src/protocol/areas/gateway-gate/transitions.ts:213`, `src/protocol/areas/gateway-gate/transitions.ts:297`).
9. Gateway adapters execute only after `verifiedGatewayCheckFromResult()` returns a `VerifiedGatewayCheck`; x402 signs only after that check (`src/protocol/areas/gateway-gate/artifacts.ts:82`, `src/adapters/x402-payment/wallet-gateway.ts:154`).
10. Evidence projections reconstruct redacted contract views, receipt timelines, idempotency recovery, install health, and agent transaction envelopes from protocol records (`src/http/handlers/evidence-read.ts:31`, `src/protocol/evidence-projections/assembly.ts:22`, `src/protocol/evidence-projections/projections.ts:25`).

### x402 Gateway-Held Signer Path

1. x402 install proposals compile endpoint evidence, wallet gateway profile, spend bounds, catalog records, gateway registry entries, and operating envelopes; non-gateway-held signer custody refuses at install proposal time (`src/adapters/x402-payment/install-proposal.ts:106`, `src/adapters/x402-payment/install-proposal.ts:165`).
2. x402 action proposal builds `x402_payment.exact` candidates from exact endpoint, payment requirements, amount, network, token, selected requirement digest, payment identifier posture, and per-call bounds (`src/adapters/x402-payment/action-proposal.ts:123`, `src/adapters/x402-payment/action-proposal.ts:208`).
3. `runX402WalletGateway()` performs the protocol `gatewayCheck()` before calling the signing surface (`src/adapters/x402-payment/wallet-gateway.ts:154`, `src/adapters/x402-payment/wallet-gateway.ts:164`).
4. Official x402 `PaymentPayload` and `PAYMENT-SIGNATURE` creation is confined to `createOfficialExactX402SigningSurface()` inside `src/adapters/x402-payment/wallet-gateway.ts:218`; architecture tests require official signer imports to remain there (`test/architecture/import-posture.test.ts`).
5. After signing, the gateway reconciles the protected surface operation; success records final reconciliation, while unknown downstream status records proof-gap posture instead of downstream success (`src/adapters/x402-payment/wallet-gateway.ts:172`, `src/adapters/x402-payment/wallet-gateway.ts:183`).

This is local/reference buyer-side `exact` proof. It is not broad x402 compatibility, live provider custody, facilitator operation, seller middleware, session/day/review spend-window ledger enforcement, hosted verifier operation, marketplace, certification, or clearing-house operation.

### Auth.md Credential-Custody Path

1. Auth.md adapter profiles normalize discovery/registration/identity/revocation evidence with `authorityCreated: false` and `credentialMaterialIncluded: false` (`src/adapters/auth-md/profiles.ts`).
2. Auth.md proposal builds `auth_md_protected_api_call.exact` candidates with gateway credential refs, PRM/authorization-server metadata digests, required scopes, endpoint/resource origins, and unsafe-shape refusal flags (`src/adapters/auth-md/action-proposal.ts:114`, `src/adapters/auth-md/action-proposal.ts:166`).
3. `runAuthMdProtectedApiCallGateway()` checks the greenlight first, records credential resolution evidence only after a passed gate, rejects raw credential leakage, and reconciles downstream status (`src/adapters/auth-md/gateway.ts:99`, `src/adapters/auth-md/gateway.ts:117`).
4. Credential lifecycle/revocation/drift maps into isolation or suspect posture through adapter-owned revocation/lifecycle helpers (`src/adapters/auth-md/revocation.ts`).

This is a reference protected API-call profile. It does not make Handshake an auth provider, OAuth server, generic API gateway, WorkOS alternative, or provider-side enforcement surface.

### Runtime And MCP Non-Authority Flow

1. Runtime ingress accepts bounded `RuntimeIngressDispatchBlock` shapes and dispatch kinds for package install, x402 payment, and auth.md protected API call (`src/runtime/ingress/index.ts:147`, `src/runtime/ingress/index.ts:193`).
2. Runtime ingress records evidence and may propose action contracts, but its response posture has all authority flags false (`src/runtime/ingress/index.ts:403`, `src/runtime/ingress/index.ts:425`).
3. Raw sibling, dynamic tool construction, late-bound parameters, stale metadata, unsupported graph regions, oversized dispatch blocks, and ambiguous dispatches become refusals or stop/recraft outcomes (`src/runtime/ingress/index.ts`, `test/runtime/runtime-ingress.test.ts`).
4. MCP exposes `handshake.actions.x402_payment.propose` and read-only `handshake://...` resources (`src/mcp/catalog.ts`, `src/mcp/resources.ts`).
5. MCP proposal can call role-scoped runtime client methods through `createRuntimeExecution`, `createToolCallDraft`, `transitionToolCallDraft`, `compileIntent`, and `proposeActionContract`; it cannot evaluate policy, greenlight, gateway-check, mutate, export receipts, or mint certificates (`src/mcp/x402-proposal.ts`, `test/mcp/mcp-x402-proposal.test.ts`).

### Receipt, Proof-Gap, Recovery, And Isolation Flow

1. `buildGateArtifacts()` builds `GatewayCheckAttempt`, optional `MutationAttempt`, `Receipt`, optional `ProofGap`, and optional `Refusal` (`src/protocol/areas/gateway-gate/artifacts.ts:102`).
2. Downstream unknown finality becomes a `ProofGap` via `buildMutationProofGap()` rather than success (`src/protocol/areas/gateway-gate/artifacts.ts:255`).
3. Replays, already-consumed greenlights, operation-claim conflicts, and receipt-index conflicts commit replay refusals with receipts and no mutation attempt (`src/protocol/areas/gateway-gate/replay-refusal/index.ts:25`).
4. `reconcileSurfaceOperation()` observes downstream finality and may resolve or create proof-gap posture without authorizing retry mutation (`src/protocol/areas/operation-lifecycle/transitions.ts`).
5. `createIsolationState()` and `createBreakerDecision()` write persistent authority reducers re-read by policy and gateway checks (`src/protocol/kernel.ts:174`, `src/protocol/kernel.ts:178`).
6. `createRecoveryRecommendation()` recommends follow-up action; any follow-up mutation needs a fresh action contract (`src/protocol/kernel.ts:186`, `src/protocol/areas/recovery/*`).

**State Management:**
- Durable state is append-only protocol records plus ordered stream events through `ProtocolStore` (`src/protocol/store/port.ts:145`).
- Greenlight consumption is separately indexed and atomic (`src/protocol/store/port.ts`, `migrations/0001_protocol_kernel.sql:21`).
- Current idempotency, isolation, protected-path posture, protected-surface operation claim, and receipt-by-mutation indexes are maintained in D1/memory stores (`src/storage/d1/index.ts`, `src/storage/memory/index.ts`).
- `migrations/0001_protocol_kernel.sql` defines D1 as durable reconstruction source; KV cache plumbing under `src/storage/kv/` cannot become authority.

## Key Abstractions

**ToolCapability / ActionType / GatewayRegistryEntry / OperatingEnvelope:**
- Purpose: Declare callable capabilities, consequential action classes, gateway bindings, and attempt bounds.
- Examples: `src/protocol/areas/catalog-envelope/*`, `src/adapters/x402-payment/install-proposal.ts`.
- Pattern: Catalog/envelope records are immutable inputs; catalog presence does not authorize mutation.

**RuntimeExecution / GeneratedExecutionGraph / ToolCallDraft:**
- Purpose: Represent generated code/spec/tool-call evidence before candidate construction.
- Examples: `src/protocol/areas/runtime-evidence/*`, `src/protocol/areas/generated-execution-graph/*`, `src/protocol/areas/tool-call-draft/*`, `src/runtime/ingress/index.ts`.
- Pattern: Observer/compiler evidence can propose or refuse; it cannot issue policy, greenlights, gateway checks, receipts, or mutation attempts.

**IntentCompilationRecord / CandidateAction:**
- Purpose: Separate vague principal intent and generated execution evidence from a contractable or rejected candidate.
- Examples: `src/protocol/areas/intent-compilation/*`.
- Pattern: Compilation emits uncertainty markers and refusal reason codes; rejected candidates record durable refusal evidence.

**ActionContract:**
- Purpose: Exact proposed protected action with pinned catalog/envelope/gateway/runtime/digest/material bindings.
- Examples: `src/protocol/areas/action-contract/*`.
- Pattern: Contract is a proposed commitment, not execution authority.

**PolicyDecision / Greenlight:**
- Purpose: Evaluate one exact contract and optionally issue one-use gateway-bound authority.
- Examples: `src/protocol/areas/policy-greenlight/*`.
- Pattern: Greenlight issuance checks idempotency, isolation, protected path, credential refs, sequence dependencies, and existing greenlights.

**GatewayCheckAttempt / VerifiedGatewayCheck / MutationAttempt:**
- Purpose: Enforce exact greenlight before consequence and produce mutation evidence only after the gate passes.
- Examples: `src/protocol/areas/gateway-gate/*`, `src/adapters/*/gateway.ts`.
- Pattern: Adapters receive a `VerifiedGatewayCheck`; a failed gate yields refusal/receipt/proof-gap evidence and no protected mutation.

**GatewayCredentialRef / CredentialResolutionEvidence:**
- Purpose: Bind provider-neutral gateway-held credential posture without exposing raw credentials.
- Examples: `src/protocol/areas/credential-custody/*`, `src/adapters/auth-md/gateway.ts`.
- Pattern: Credential refs are bound into candidate/contract/policy/gateway digests; resolution evidence can only be recorded after a passed gateway check.

**Receipt / Refusal / ProofGap / Recovery / Isolation:**
- Purpose: Preserve reconstructable outcomes for execution, denial, ambiguity, follow-up, and future authority reduction.
- Examples: `src/protocol/areas/receipt-export/*`, `src/protocol/areas/refusal/*`, `src/protocol/areas/proof-gap/*`, `src/protocol/areas/recovery/*`, `src/protocol/areas/isolation-breaker/*`.
- Pattern: Missing or contradictory evidence is explicit state, not smoothed into success.

**SurfaceBoundary:**
- Purpose: Hold non-authority surface constraints in source so architecture tests can enforce them.
- Examples: `src/surfaces/boundary-manifest.ts`, `test/architecture/surface-boundary-posture.test.ts`.
- Pattern: Surface ids declare custody role, authority posture, allowed/forbidden route families, forbidden imports, credential/output bans, and claim-boundary labels.

## Entry Points

**Package Root:**
- Location: `src/index.ts`
- Triggers: Consumers import `handshake-protocol-kernel`.
- Responsibilities: Curated stable exports: app creation, public protocol schemas/inputs, errors, root client, gateway verification helper, navigation, and authority certificate verification. It does not export `HandshakeKernel`, stores, surface manifest, MCP internals, runtime ingress, or reference gateway runners.

**Experimental Reference Surface:**
- Location: `src/experimental.ts`
- Triggers: Consumers import `handshake-protocol-kernel/experimental`.
- Responsibilities: Exposes reference adapters/gateway fixtures and auth.md/x402 experimental helpers behind explicit experimental naming.

**Runtime Subpath:**
- Location: `src/runtime/index.ts`
- Triggers: Consumers import `handshake-protocol-kernel/runtime`.
- Responsibilities: Exposes runtime ingress schemas and proposal helpers only.

**Role-Scoped SDK Subpath:**
- Location: `src/sdk/surface-clients/index.ts`
- Triggers: Consumers import `handshake-protocol-kernel/sdk/role-clients`.
- Responsibilities: Exposes `RuntimeClient` and `EvidenceClient` without all-role token maps or gateway/policy/mutation methods.

**Conformance Subpath:**
- Location: `src/conformance/index.ts`
- Triggers: Consumers import `handshake-protocol-kernel/conformance`.
- Responsibilities: Exposes reference conformance checks only.

**Worker Entry:**
- Location: `src/worker.ts`
- Triggers: Cloudflare Worker runtime.
- Responsibilities: Wires `createApp().fetch` and no protocol meaning.

**HTTP App:**
- Location: `src/http/app.ts`
- Triggers: `createApp()`, Worker, tests.
- Responsibilities: Adds `/health`, `/openapi.json`, protocol transition routes, evidence read routes, and generic raw record route with object-registry posture checks.

**Local Examples:**
- Location: `examples/self-hosted-activation/run.ts`, `examples/x402-protected-spend/run.ts`, `examples/mcp-reference-transcript/run.ts`.
- Triggers: `npm run demo:self-hosted`, `npm run demo:aps`, `npm run demo:mcp-transcript`.
- Responsibilities: Produce local/reference evidence packets; they are not hosted/provider claims.

## Architectural Constraints

- **Threading:** Runtime is JavaScript/TypeScript async execution. No worker-thread authority model is present. Atomicity is provided by store commits in `ProtocolStore`, `D1ProtocolStore`, and `InMemoryProtocolStore`.
- **Global state:** `InMemoryProtocolStore` holds maps in instance state (`src/storage/memory/index.ts`). MCP reference fixtures provide local fake clients (`src/mcp/reference-transcript-fixtures.ts`). Source modules should not introduce ambient authority singletons.
- **Circular imports:** Architecture tests enforce area-to-area imports through public area indexes, kernel imports through area indexes, public schema/input aggregators only, and transports/clients off area internals (`test/architecture/import-posture.test.ts`).
- **Canonical source priority:** Tracked canon lives in `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, and `docs/internal/*`; `.planning/` is scratch (`docs/internal/decisions.md`).
- **Local/reference boundary:** Present claims are local kernel, local D1/HTTP, local MCP stdio, and reference gateway fixture claims. Hosted operation, provider custody, provider-side enforcement, broad MCP/browser/shell/network interception, cross-org certificate trust, marketplace/certification, facilitator operation, seller middleware, and spend-window ledger enforcement are not established.
- **Gateway custody:** Mutation-capable adapters must operate after `VerifiedGatewayCheck`; official x402 signer/payment-payload creation stays inside `src/adapters/x402-payment/wallet-gateway.ts`.
- **Raw reads:** Object registry `rawReadPosture` blocks `internal_only` objects from generic raw record reads (`src/protocol/areas/object-registry/index.ts`, `src/http/handlers/internal-record-read.ts`).
- **Package posture:** `package.json` is publishable and exposes root, runtime, conformance, role-scoped SDK, CLI, MCP, experimental, and package metadata subpaths. Public Node imports use bundled `dist/*.mjs`; Bun local development can still use source through the `bun` export condition. The `handshake` and `handshake-mcp` bins are package entrypoints, not authority surfaces.

## Anti-Patterns

### Treating Runtime Or MCP Proposal As Authority

**What happens:** Code calls `src/runtime` or `src/mcp` and treats an action-contract proposal as permission to mutate.
**Why it's wrong:** Runtime/MCP surfaces explicitly set authority flags false and do not evaluate policy, issue greenlights, gateway-check, mutate, export receipts, or mint certificates.
**Do this instead:** Route authority through `evaluatePolicy()` and then `gatewayCheck()` (`src/protocol/kernel.ts:154`, `src/protocol/kernel.ts:158`), with mutation-capable adapters consuming `VerifiedGatewayCheck` (`src/protocol/areas/gateway-gate/artifacts.ts:82`).

### Putting Protocol Meaning In HTTP, SDK, Storage, Runtime, Or Adapters

**What happens:** A transport or adapter imports protocol area internals or reimplements policy/gateway state rules locally.
**Why it's wrong:** Protocol meaning belongs to `src/protocol/areas/*`; moving it into surfaces creates divergent authority.
**Do this instead:** Use `HandshakeKernel` from transport (`src/http/routes/transition-invokers.ts`) or public protocol indexes, and keep storage on `ProtocolStore` mechanics (`src/protocol/store/port.ts`).

### Exposing Signer Or Payment Payload Material Outside The x402 Wallet Gateway

**What happens:** `@x402/core/client`, `@x402/evm`, `PaymentPayload`, `PAYMENT-SIGNATURE`, signer, or wallet material appears in runtime/MCP/SDK/CLI or adapter barrels.
**Why it's wrong:** Raw signer access makes the gateway-held signer boundary fake.
**Do this instead:** Keep official x402 signing in `src/adapters/x402-payment/wallet-gateway.ts`; adapter barrel `src/adapters/x402-payment/index.ts` intentionally does not export the official signing factory, and architecture tests enforce that posture.

### Recording Credential Resolution Before Gateway Admission

**What happens:** Credential resolution evidence is recorded before a passed `GatewayCheckAttempt`.
**Why it's wrong:** Credential resolution is post-gate evidence only; pre-gate resolution leaks credential authority into proposal/policy time.
**Do this instead:** Use `recordCredentialResolutionEvidence()` only after `gate.gateDecision === "passed"` (`src/protocol/areas/credential-custody/transitions.ts:314`, `src/protocol/areas/credential-custody/transitions.ts:333`).

### Collapsing Receipt Into Downstream Success

**What happens:** Receipt emission is treated as proof that the external business operation succeeded.
**Why it's wrong:** Receipts distinguish gateway admission, greenlight consumption, mutation attempt status, downstream status, proof gaps, and reconciliation.
**Do this instead:** Read redacted projections and downstream reconciliation status through `src/protocol/evidence-projections/*` and `src/http/handlers/evidence-read.ts`.

### Broadening Local Proof Into Hosted Or Provider Claims

**What happens:** x402, MCP, CLI, SDK, D1, or auth.md reference proofs are described as provider custody, hosted operation, generic runtime control, or certification.
**Why it's wrong:** Current source establishes local/reference proof lanes only.
**Do this instead:** Preserve claim labels from `src/surfaces/boundary-manifest.ts`, `README.md`, and `docs/internal/protocol-notes.md`; require a real provider/customer gateway check before hosted/provider claims.

### Adding New Protocol Areas Without Public Faces And Tests

**What happens:** New protocol files bypass `index.ts`, public schemas/inputs, navigation, object registry, or transition tests.
**Why it's wrong:** Tier 1 guardrails depend on source shape being navigable and enforceable.
**Do this instead:** Add area-owned `schemas.ts`, `inputs.ts`, `types.ts`, `transitions.ts`, `index.ts`, object registry entries, navigation where applicable, and focused tests under `test/protocol` plus architecture guard updates.

## Error Handling

**Strategy:** Fail closed with typed protocol errors, durable refusals, replay refusals, proof gaps, and explicit commit-state metadata.

**Patterns:**
- `HandshakeProtocolError` carries protocol reason codes, HTTP-ish status, retryability, and commit-state metadata (`src/protocol/foundation/errors.ts`).
- HTTP wraps errors into transition envelopes via `src/http/errors/transition-error-envelope.ts`.
- Intent compilation rejected candidates commit `Refusal` records (`src/protocol/areas/intent-compilation/transitions.ts`).
- Policy idempotency conflicts commit refusal decisions instead of issuing fresh authority (`src/protocol/areas/policy-greenlight/transitions.ts`).
- Gateway replay and operation/receipt conflicts commit replay refusals with receipts (`src/protocol/areas/gateway-gate/replay-refusal/index.ts`).
- Missing/unknown/contradictory downstream evidence becomes `ProofGap` records (`src/protocol/areas/proof-gap/*`, `src/protocol/areas/gateway-gate/artifacts.ts`).

## Cross-Cutting Concerns

**Logging:** No application logging framework is central to authority. Durable reconstruction is through protocol records and stream events in `src/protocol/events/*` and `ProtocolStore`.

**Validation:** Zod strict schemas are used across protocol, HTTP, runtime, MCP, install, adapters, and projections (`src/protocol/public/*`, `src/runtime/ingress/index.ts`, `src/mcp/x402-proposal.ts`, `src/install/*`, `src/adapters/*`).

**Authentication/Admission:** HTTP admission supports role-scoped token mode and hosted caller verifier seams in `src/http/admission/*`. Hosted admission is a transport seam, not proof of hosted operation or provider enforcement.

**Credential Custody:** `GatewayCredentialRef` records are opaque and redacted; protocol/http/runtime/sdk contain no vault provider client or `getSecret` retrieval API per `test/architecture/import-posture.test.ts`.

**Idempotency:** Policy reserves idempotency before greenlight issuance, gateway updates ledger state at mutation start, and evidence projections expose recovery disposition (`src/protocol/areas/idempotency-ledger/*`, `src/protocol/evidence-projections/projections.ts`).

**Isolation:** Active isolation states are checked before policy greenlights and gateway checks (`src/protocol/areas/policy-greenlight/transitions.ts`, `src/protocol/areas/gateway-gate/transitions.ts`).

**Claim Boundary:** `test/architecture/claim-boundary.test.ts`, `test/architecture/active-vocabulary.test.ts`, `README.md`, and `docs/internal/*` keep local/reference proof separate from hosted/provider claims.

**Tier 1 Foundation Guardrails:** Use `npm run quality:architecture` and `npm run check:repo` from `package.json` for import posture, naming, package surface, root exports, surface boundary, CLI/MCP posture, conformance, types, lint, format, tests, pack check, and whitespace diff.

---

*Architecture analysis: 2026-05-24*
