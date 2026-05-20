<!-- refreshed: 2026-05-20 -->
<!-- head: 88e6f16 -->
# Architecture

**Analysis Date:** 2026-05-20
**Current HEAD:** `88e6f16`
**Evidence Source:** current working tree source, tests, and tracked canon. `.planning/` is scratch.

## System Overview

```text
+--------------------------------------------------------------------------------+
|                    Public Source Package Boundary                               |
| `src/index.ts` | `src/runtime/index.ts` | `src/conformance/index.ts` |          |
| `src/experimental.ts` | `package.json` exports | `scripts/check-package-surface.mjs` |
+--------------------------+--------------------------+--------------------------+
                           |
                           v
+--------------------------------------------------------------------------------+
|                         Runtime And HTTP Ingress                                 |
| `src/runtime/ingress/index.ts` observes generated dispatches and proposes only.  |
| `src/http/app.ts` routes custody-scoped POST/GET calls into the kernel.          |
+--------------------------+--------------------------+--------------------------+
                           |
                           v
+--------------------------------------------------------------------------------+
|                         Protocol Kernel Facade                                   |
| `src/protocol/kernel.ts` delegates each transition to an owned protocol area.    |
| `src/protocol/public/*` aggregates public schemas, inputs, and transition guards.|
+--------------------------+--------------------------+--------------------------+
                           |
                           v
+--------------------------------------------------------------------------------+
|                         Protocol Areas And Registry                              |
| `src/protocol/areas/*` owns primitives, transitions, schemas, and guards.        |
| `src/protocol/areas/object-registry/*` owns record metadata and raw-read posture.|
+--------------------------+--------------------------+--------------------------+
                           |
              +------------+-------------+
              v                          v
+------------------------------+   +---------------------------------------------+
| Durable Evidence Store        |   | Gateway Fixture / Adapter Boundary           |
| `src/protocol/store/port.ts`  |   | `src/adapters/*` mutates only after           |
| `src/storage/d1/index.ts`     |   | `VerifiedGatewayCheck` from                   |
| `src/storage/memory/index.ts` |   | `src/protocol/areas/gateway-gate/artifacts.ts`|
+------------------------------+   +---------------------------------------------+
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Package root | Curates stable public app, schema, client, navigation, gateway-check, and AuthorityCertificate verifier exports. It intentionally hides `HandshakeKernel`, stores, and experimental gateways. | `src/index.ts` |
| Runtime subpath | Exposes runtime ingress proposal helpers only; it does not export policy, greenlight, gateway, mutation, or receipt authority. | `src/runtime/index.ts` |
| Conformance subpath | Exposes narrow adapter posture checks without claiming provider certification. | `src/conformance/index.ts` |
| Experimental subpath | Exposes reference gateway fixtures behind `experimental*` names. | `src/experimental.ts` |
| HTTP app | Builds Hono routes, admission, request context, OpenAPI, transition dispatch, evidence reads, and raw record reads. | `src/http/app.ts` |
| HTTP route registry | Keeps route metadata, role, scope resolver, request schema, and response schema separate from kernel invocation. | `src/http/routes/transition-route-registry.ts` |
| HTTP transition invokers | Maps route IDs to `HandshakeKernel` methods. | `src/http/routes/transition-invokers.ts` |
| Runtime ingress | Converts observed package-install and x402 dispatch blocks into runtime evidence, generated graphs, finalized tool-call drafts, intent compilations, and action contracts. | `src/runtime/ingress/index.ts` |
| Kernel facade | Provides the authoritative transition API over protocol areas. | `src/protocol/kernel.ts` |
| Object registry | Maps every `ProtocolObjectType` to schema, ID selector, export posture, and raw-read posture. | `src/protocol/areas/object-registry/index.ts` |
| AuthorityCertificate area | Mints terminal signed evidence for receipts, durable refusals, proof gaps, and replay refusals; verifies offline pinned trust material. | `src/protocol/areas/authority-certificate/index.ts` |
| Policy/greenlight area | Evaluates exact contracts against envelope, protected-path posture, isolation, sequence dependencies, and idempotency ledger before issuing one greenlight. | `src/protocol/areas/policy-greenlight/transitions.ts` |
| Gateway gate area | Reloads contract/greenlight/policy, checks drift, posture, params, isolation, idempotency, and sequence before mutation evidence. | `src/protocol/areas/gateway-gate/transitions.ts` |
| Protected-path posture area | Requires fresh, scope-bound bypass-probe coverage before `gateway_checked` posture can satisfy policy or gateway checks. | `src/protocol/areas/protected-path-posture/transitions.ts` |
| Protocol recorder | Canonicalizes records, commits stream events, attaches transition request context, and retries stream appends. | `src/protocol/events/records.ts` |
| Store port | Defines durable record, stream, greenlight consumption, idempotency, isolation, posture, operation-claim, and receipt-index contracts. | `src/protocol/store/port.ts` |
| D1 store | Implements the durable reference store with SQL-backed atomic indexes. | `src/storage/d1/index.ts` |
| Memory store | Implements the in-memory test and invariant oracle store. | `src/storage/memory/index.ts` |
| Install compiler | Defines generic install proposal records compiled by adapter packs into catalog, gateway, and envelope objects. | `src/install/install-proposal/index.ts` |
| x402 adapter pack | Compiles local x402 payment exact install records and spend bounds; session/day/review windows are metadata. | `src/adapters/x402-payment/install-proposal.ts` |
| x402 wallet gateway | Runs a wallet signing surface only after `VerifiedGatewayCheck`, then reconciles downstream status. | `src/adapters/x402-payment/wallet-gateway.ts` |

## Pattern Overview

**Overall:** Hexagonal protocol kernel with area-owned state transitions and append-only evidence records.

**Key Characteristics:**
- Protocol meaning lives in `src/protocol/areas/*`; transport, storage implementations, runtime helpers, adapters, and SDK code stay outside that authority layer.
- Public boundaries are curated through `package.json`, `src/index.ts`, `src/runtime/index.ts`, `src/conformance/index.ts`, and `src/experimental.ts`, then guarded by `test/architecture/root-exports.test.ts` and `test/architecture/claim-boundary.test.ts`.
- Store implementations persist protocol objects through the `ProtocolStore` port in `src/protocol/store/port.ts`; D1 and memory do not decide policy meaning.
- Runtime ingress is observer/compiler evidence. It can propose or refuse, but policy, greenlight, gateway, mutation, receipt, and AuthorityCertificate evidence remain kernel/gateway/store outcomes.

## Layers

**Canonical Documentation Layer:**
- Purpose: Defines active repo truth and claim boundaries.
- Location: `README.md`, `AGENTS.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/decisions.md`, `docs/internal/protocol-definition.md`, `docs/internal/protocol-kernel-architecture.md`, `docs/internal/protocol-notes.md`
- Contains: doctrine, commands, quality rules, structure rules, protocol definition, architecture map, compact implementation notes.
- Depends on: source and tests as operational evidence.
- Used by: planning, reviews, claim-boundary tests, source-lane manifests.

**Public Package Layer:**
- Purpose: Controls what consumers can import.
- Location: `src/index.ts`, `src/runtime/index.ts`, `src/conformance/index.ts`, `src/experimental.ts`, `package.json`
- Contains: stable root exports, runtime observer/compiler subpath, conformance subpath, experimental reference gateway subpath.
- Depends on: HTTP app, protocol public schemas/inputs, SDK client, selected gateway-check and certificate helpers.
- Used by: external package consumers, tests under `test/architecture/*`, pack check in `scripts/check-package-surface.mjs`.

**HTTP Transport Layer:**
- Purpose: Exposes protocol transitions and read-only evidence over Hono/Worker routes.
- Location: `src/http/`
- Contains: `app.ts`, `admission/*`, `routes/*`, `handlers/*`, `errors/*`, `openapi/*`, `navigation/*`, `store/*`
- Depends on: `src/protocol/kernel.ts`, `src/protocol/public/*`, `src/protocol/store/port.ts`, `src/storage/d1/index.ts`, and optionally `src/storage/memory/index.ts`.
- Used by: `src/worker.ts`, `src/sdk/client.ts`, integration tests in `test/http/*` and `test/integration/*`.

**Runtime Ingress Layer:**
- Purpose: Turns observed generated execution into proposal evidence.
- Location: `src/runtime/`
- Contains: `ingress/index.ts`, `package-install/action-proposal.ts`, `repo-write/action-proposal.ts`, `preview-deploy/action-proposal.ts`, `codemode-multi-action/*`
- Depends on: protocol area public indexes, canonical digest helpers, and adapter-specific proposal builders such as `src/adapters/x402-payment/action-proposal.ts`.
- Used by: `test/runtime/runtime-ingress.test.ts`, `test/runtime/package-install-runtime.test.ts`, `test/runtime/codemode-multi-action-runtime.test.ts`.

**Protocol Kernel Layer:**
- Purpose: Owns protocol transitions and authority semantics.
- Location: `src/protocol/`
- Contains: `kernel.ts`, `areas/*`, `foundation/*`, `events/*`, `context/*`, `navigation/*`, `public/*`, `store/*`, `evidence-projections/*`
- Depends on: Zod schemas, canonicalization, event chains, and the store port.
- Used by: HTTP routes, runtime proposal helpers, adapters, storage, SDK schemas, tests.

**Protocol Area Layer:**
- Purpose: Keeps each primitive in an owned area with schemas, inputs, guards, transitions, and local types.
- Location: `src/protocol/areas/*`
- Contains: action contracts, authority certificates, catalog/envelope, runtime evidence, generated graph, tool-call draft, intent compilation, policy/greenlight, idempotency ledger, gateway gate, proof gap, refusal, receipt export, recovery, review binding, protected path posture, bypass probes, operation lifecycle, object registry.
- Depends on: `src/protocol/foundation/*`, `src/protocol/events/*`, `src/protocol/context/*`, `src/protocol/store/*`, and other area public indexes.
- Used by: `src/protocol/kernel.ts`, public schema/input aggregators, object registry, tests.

**Storage Layer:**
- Purpose: Implements protocol record, stream, and index mechanics.
- Location: `src/storage/`, `migrations/0001_protocol_kernel.sql`
- Contains: D1 store, memory store, KV cache posture, SQL statements, storage re-exports.
- Depends on: `src/protocol/store/port.ts`, object-registry metadata, event schemas, canonical digest helpers.
- Used by: HTTP store resolution, tests, worker runtime.

**Adapter And Install Layer:**
- Purpose: Demonstrates protected mutation loops and install-time adapter-pack compilation.
- Location: `src/adapters/`, `src/install/`
- Contains: package install, repo write, preview deploy, x402 payment, protected-path probe executors, generic install proposal schema, adapter-pack schema.
- Depends on: public gateway verification helpers, protocol schemas/inputs, adapter-local parameter schemas.
- Used by: experimental exports, conformance exports, integration tests.

**SDK Layer:**
- Purpose: Typed client ergonomics for public HTTP routes and evidence projections.
- Location: `src/sdk/client.ts`
- Contains: `HandshakeClient`, typed error parsing, role-token routing.
- Depends on: public schemas/inputs and HTTP error/custody types.
- Used by: package root and HTTP tests.

## Data Flow

### Runtime Ingress Proposal Path

1. A caller supplies an observed dispatch block to `proposeRuntimeIngressActionContracts()` (`src/runtime/ingress/index.ts:178`).
2. Runtime ingress records `RuntimeExecution` evidence and a `GeneratedExecutionGraph` through kernel-compatible protocol methods (`src/runtime/ingress/index.ts:184`, `src/runtime/ingress/index.ts:187`).
3. Each dispatch becomes a finalized `ToolCallDraft`, then an `IntentCompilationRecord` (`src/runtime/ingress/index.ts:204`, `src/runtime/ingress/index.ts:205`).
4. Clean dispatches become `ActionContract` proposals; raw sibling, dynamic, late-bound, ambiguous, or truncated graph shapes become refusals without policy or gateway objects (`src/runtime/ingress/index.ts:209`, `src/runtime/ingress/index.ts:223`).
5. The runtime subpath exports only runtime ingress helpers (`src/runtime/index.ts:1`); claim-boundary tests assert it exports no gateway, greenlight, mutation, policy, or receipt authority (`test/architecture/root-exports.test.ts:225`, `test/architecture/claim-boundary.test.ts:18`).

### Primary Gateway-Checked Mutation Path

1. Catalog/envelope records are inserted with immutable digest semantics through `HandshakeKernel.putCatalogObject()` (`src/protocol/kernel.ts:82`).
2. Generated or explicit input compiles into a candidate via `compileIntent()` (`src/protocol/kernel.ts:121`).
3. A clean candidate is canonicalized into an `ActionContract` via `proposeActionContract()` (`src/protocol/kernel.ts:125`).
4. Policy loads the contract and envelope, checks isolation, sequence dependencies, protected-path posture, and idempotency ledger before deciding (`src/protocol/areas/policy-greenlight/transitions.ts:78`, `src/protocol/areas/policy-greenlight/transitions.ts:141`).
5. Greenlight issuance is one-per-contract and reserves the idempotency ledger before commit (`src/protocol/areas/policy-greenlight/guards.ts:24`, `src/protocol/areas/policy-greenlight/transitions.ts:97`).
6. Gateway check reloads contract, greenlight, policy decision, current gateway policy, observed params, isolation, posture, sequence state, and idempotency ledger (`src/protocol/areas/gateway-gate/transitions.ts:83`, `src/protocol/areas/gateway-gate/transitions.ts:124`).
7. A passed gate records a `GatewayCheckAttempt`, `MutationAttempt`, `Receipt`, greenlight consumption, operation claim, idempotency ledger update, and stream events atomically through the store (`src/protocol/areas/gateway-gate/transitions.ts:207`, `src/protocol/store/port.ts:104`).
8. Reference adapters such as `runX402WalletGateway()` only call downstream mutation surfaces after `verifiedGatewayCheckFromResult()` returns a verified gate (`src/adapters/x402-payment/wallet-gateway.ts:96`, `src/adapters/x402-payment/wallet-gateway.ts:106`).

### AuthorityCertificate Path

1. `HandshakeKernel.createAuthorityCertificate()` delegates to the AuthorityCertificate area (`src/protocol/kernel.ts:129`).
2. The transition accepts only receipt, refusal, or proof-gap terminal object refs; non-terminal refs are rejected (`src/protocol/areas/authority-certificate/transitions.ts:142`, `src/protocol/areas/authority-certificate/transitions.ts:164`).
3. Certificate construction projects a redacted agent transaction envelope, includes terminal artifacts, sets required signer roles, signs canonical input, and writes an `authority_certificate` protocol record plus event (`src/protocol/areas/authority-certificate/transitions.ts:77`, `src/protocol/areas/authority-certificate/transitions.ts:47`).
4. Verification is offline: it parses the certificate, recomputes envelope and signing-input digests, checks signature algorithm, pinned trust key, required signer roles, required artifacts, and terminal binding (`src/protocol/areas/authority-certificate/verify.ts:27`, `src/protocol/areas/authority-certificate/verify.ts:172`).
5. Production verification rejects HMAC signatures unless dev HMAC is explicitly allowed in trust material (`src/protocol/areas/authority-certificate/verify.ts:94`).

### HTTP Transition Path

1. `createApp()` creates Hono routes for health, OpenAPI, transition POST routes, evidence GET routes, and raw record reads (`src/http/app.ts:26`, `src/http/app.ts:35`, `src/http/app.ts:38`).
2. Transition routes are role-scoped in `transitionRouteDefinitions`; each route binds a request schema, response schema, summary, and scope resolver (`src/http/routes/transition-route-registry.ts:53`, `src/http/routes/transition-route-registry.ts:66`).
3. `handleTransition()` performs caller admission, protocol-version/request-identity parsing, optional hosted identity scope checks, request-context digesting, and then invokes the kernel (`src/http/app.ts:58`, `src/http/app.ts:70`, `src/http/app.ts:91`).
4. `transitionInvokers` maps route IDs to kernel methods and is the only HTTP dispatch table that imports `HandshakeKernel` (`src/http/routes/transition-invokers.ts:1`, `src/http/routes/transition-invokers.ts:5`).

### Evidence Read And Raw Record Path

1. Redacted projections live in `src/protocol/evidence-projections/*` and are served by `handleEvidenceRead()` (`src/http/handlers/evidence-read.ts:27`).
2. Evidence reads cover generated graph evidence, contract evidence, idempotency recovery, receipt timeline, and protected-path install health (`src/http/handlers/evidence-read.ts:43`, `src/http/handlers/evidence-read.ts:52`, `src/http/handlers/evidence-read.ts:61`, `src/http/handlers/evidence-read.ts:78`, `src/http/handlers/evidence-read.ts:102`).
3. Generic raw record reads use `protocolObjectRegistry[objectType].rawReadPosture`; `internal_only` objects return not found (`src/http/handlers/internal-record-read.ts:11`, `src/http/handlers/internal-record-read.ts:38`).
4. Object-registry tests require schema coverage, ID extraction ownership, export posture, and raw-read posture for every protocol object type (`test/protocol/object-registry.test.ts:58`).

**State Management:**
- Protocol state is append-only durable evidence plus current indexes. The store port tracks records, stream events, current protected-path posture, idempotency ledger entries, protected-surface operation claims, receipt-by-mutation index, isolation states, greenlight consumption, protocol commits, and gateway-check commits (`src/protocol/store/port.ts:145`).
- D1 is the durable reference implementation; `migrations/0001_protocol_kernel.sql` defines records, greenlight consumption, greenlight issuance, idempotency ledger, protected path posture, isolation, operation claim, receipt lookup, and stream event tables (`migrations/0001_protocol_kernel.sql:5`).
- Memory store mirrors the same index behavior for tests and invariant fixtures (`src/storage/memory/index.ts:27`).

## Key Abstractions

**HandshakeKernel:**
- Purpose: The transition facade over protocol areas.
- Examples: `src/protocol/kernel.ts`, `src/http/routes/transition-invokers.ts`
- Pattern: One public method per protocol transition; each method delegates into an owned area and writes through `ProtocolRecorder`.

**ProtocolObjectRegistry:**
- Purpose: Source-owned metadata for every protocol object type.
- Examples: `src/protocol/areas/object-registry/index.ts`, `src/protocol/areas/object-registry/schemas.ts`, `test/protocol/object-registry.test.ts`
- Pattern: Object type -> schema -> ID selector -> export posture -> raw-read posture.

**ProtocolRecorder:**
- Purpose: Converts area outputs into canonical stored records and stream events.
- Examples: `src/protocol/events/records.ts`
- Pattern: Build canonical digest with `getObjectId()`, attach optional transition request context, and commit through `ProtocolStore`.

**AuthorityCertificate:**
- Purpose: Terminal signed evidence for receipt/refusal/proof-gap/replay outcomes.
- Examples: `src/protocol/areas/authority-certificate/*`, `test/protocol/authority-certificate.test.ts`
- Pattern: Sign canonical terminal envelope and artifacts; verify with pinned trust material outside the protocol store.

**VerifiedGatewayCheck:**
- Purpose: Adapter-facing proof that the gateway check passed for one exact mutation attempt.
- Examples: `src/protocol/areas/gateway-gate/artifacts.ts`, `src/adapters/package-install/gateway.ts`, `src/adapters/x402-payment/wallet-gateway.ts`
- Pattern: Adapters receive a narrowed object from `verifiedGatewayCheckFromResult()` and must not mutate without it.

**RuntimeIngressDispatchBlock:**
- Purpose: Runtime-observed dispatch boundary for generated code/tool execution.
- Examples: `src/runtime/ingress/index.ts`, `test/runtime/runtime-ingress.test.ts`
- Pattern: Wrap supported dispatches into graph nodes and candidate actions; mark raw sibling, dynamic, late-bound, ambiguous, or truncated evidence as refusal/bypass/coverage risk.

## Entry Points

**Package Root:**
- Location: `src/index.ts`
- Triggers: Consumers import the package root.
- Responsibilities: Expose stable root schemas, inputs, HTTP app/client helpers, navigation, gateway verification helper, and AuthorityCertificate signing/verifier helpers.

**Runtime Subpath:**
- Location: `src/runtime/index.ts`
- Triggers: Consumers import `handshake-protocol-kernel/runtime`.
- Responsibilities: Expose runtime ingress proposal helpers only.

**Conformance Subpath:**
- Location: `src/conformance/index.ts`
- Triggers: Consumers import `handshake-protocol-kernel/conformance`.
- Responsibilities: Expose conformance checks without exporting mutation authority.

**Experimental Subpath:**
- Location: `src/experimental.ts`
- Triggers: Consumers import `handshake-protocol-kernel/experimental`.
- Responsibilities: Expose reference gateway runners and parameter schemas with `experimental*` naming.

**Worker:**
- Location: `src/worker.ts`
- Triggers: Cloudflare Worker fetch event.
- Responsibilities: Call `createApp()` and expose `app.fetch`.

**Hono App:**
- Location: `src/http/app.ts`
- Triggers: Worker, tests, or local dev.
- Responsibilities: Register transition routes, evidence reads, OpenAPI, health, and raw record reads.

**D1 Store:**
- Location: `src/storage/d1/index.ts`
- Triggers: HTTP store resolution when `c.env.DB` exists.
- Responsibilities: Persist durable protocol evidence and atomic indexes.

## Architectural Constraints

- **Threading:** TypeScript async code runs on the JavaScript event loop. Concurrency safety for authority-bearing transitions is modeled through store-level atomic indexes and conflict results, not locks in area code.
- **Global state:** `createApp()` creates a fallback in-memory store only when `allowEphemeralStore` or an injected store is supplied (`src/http/app.ts:26`). `src/worker.ts` creates one app instance at module load.
- **Authority boundary:** Runtime helpers, SDK clients, conformance checks, HTTP admission, and review artifacts cannot create authority. Authority runs through exact contract -> policy -> one-use greenlight -> gateway check.
- **Kernel-only transitions:** `createGeneratedExecutionGraph` and `createAuthorityCertificate` are present in protocol navigation but intentionally absent from HTTP transition navigation (`test/protocol/protocol-navigation.test.ts:40`).
- **Public boundary:** Root exports are curated and tested. `HandshakeKernel`, stores, recorders, and experimental gateways are not root exports (`test/architecture/root-exports.test.ts:170`).
- **Raw reads:** `internal_only` protocol records cannot be fetched through the generic raw HTTP record route (`src/http/handlers/internal-record-read.ts:38`).
- **Circular imports:** No explicit circular dependency tooling is present. Import posture tests guard directionality between protocol, HTTP, SDK, storage, adapters, object registry, public aggregators, and area internals (`test/architecture/import-posture.test.ts`).

## Anti-Patterns

### Treat Runtime Ingress As Permission

**What happens:** A runtime helper observes a wrapped dispatch and returns an `ActionContract`, then caller code treats that as permission to mutate.
**Why it's wrong:** Runtime ingress records observer/compiler evidence only; tests assert it creates no `policy_decision`, `greenlight`, `gateway_check_attempt`, or `mutation_attempt` (`test/runtime/runtime-ingress.test.ts:16`).
**Do this instead:** Route the proposed contract through `evaluatePolicy()` and `gatewayCheck()` in `src/protocol/kernel.ts`; mutate only inside an adapter after `verifiedGatewayCheckFromResult()` succeeds (`src/protocol/areas/gateway-gate/artifacts.ts:82`).

### Add Adapter Family Semantics To Protocol Areas

**What happens:** x402, package install, repo write, or preview deploy details are added directly to protocol primitives.
**Why it's wrong:** Adapter families are proof profiles and regression fixtures; no adapter family defines the protocol shape.
**Do this instead:** Keep adapter-specific install and proposal logic under `src/adapters/*`, generic install shape under `src/install/*`, and protocol primitives under `src/protocol/areas/*`.

### Expose Internal Evidence Through Raw HTTP Reads

**What happens:** A diagnostic route reads `contract_stream_event`, `bypass_probe`, `tool_call_draft`, or `idempotency_ledger_entry` through the generic record endpoint.
**Why it's wrong:** These objects are marked `internal_only` in `protocolObjectRegistry`; exposing raw internals turns reconstruction evidence into an accidental public audit API.
**Do this instead:** Add a purpose-built redacted projection under `src/protocol/evidence-projections/*` and route it through `src/http/handlers/evidence-read.ts`.

### Reuse A Greenlight For Retry Or Recovery

**What happens:** A retry path attempts to use the same greenlight for a second mutation attempt.
**Why it's wrong:** The store consumes greenlights by `greenlightId`, and replay returns a replay refusal instead of mutation authority (`src/protocol/areas/gateway-gate/transitions.ts:212`).
**Do this instead:** Model follow-up as a new action contract, optionally linked through recovery evidence in `src/protocol/areas/recovery/*`.

## Error Handling

**Strategy:** Typed protocol errors plus durable refusal/proof-gap records.

**Patterns:**
- Throw `HandshakeProtocolError` when a transition cannot proceed because required evidence, binding, scope, or store state is invalid (`src/protocol/foundation/errors.ts`).
- HTTP maps errors into `TransitionErrorEnvelope` via `transitionErrorResult()` (`src/http/errors/transition-error-envelope.ts`).
- Denials that are protocol outcomes are recorded as `refusal` or `proof_gap` records rather than hidden exceptions (`src/protocol/areas/refusal/*`, `src/protocol/areas/proof-gap/*`).
- Store conflicts return explicit commit states such as `greenlight_issuance_conflict`, `idempotency_ledger_conflict`, `already_consumed`, `operation_claim_conflict`, and `stream_conflict` (`src/protocol/store/port.ts:127`).

## Cross-Cutting Concerns

**Logging:** No application logging framework is detected. Evidence is modeled as protocol records, stream events, redacted projections, refusals, receipts, and proof gaps.

**Validation:** Zod strict schemas own protocol and transport validation. Public aggregators live in `src/protocol/public/schemas.ts` and `src/protocol/public/inputs.ts`.

**Authentication:** HTTP routes use role-scoped bearer custody tokens in `src/http/admission/caller-auth.ts`. Optional hosted caller identity is a route-admission seam in `src/http/admission/hosted-caller-identity.ts`; it does not prove hosted operation.

**Canonicalization:** `src/protocol/foundation/canonical.ts` and digest helpers provide deterministic record, signing, ledger, and graph digest material.

**Evidence Reconstruction:** `src/protocol/events/*`, `src/protocol/evidence-projections/*`, `src/http/handlers/evidence-read.ts`, and AuthorityCertificate verification support later reconstruction without converting receipts into downstream business success.

---

*Architecture analysis: 2026-05-20*
