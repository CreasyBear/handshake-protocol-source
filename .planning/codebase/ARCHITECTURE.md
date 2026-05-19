<!-- refreshed: 2026-05-19 -->
# Architecture

**Analysis Date:** 2026-05-19

## System Overview

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                 Generated Engineering-Agent Execution                      │
│ runtime wrappers, codemode action lists, SDK callers, HTTP callers         │
│ `src/runtime`, `src/sdk/client.ts`, `src/http/app.ts`                      │
└───────────────┬───────────────────────────────┬────────────────────────────┘
                │                               │
                ▼                               ▼
┌────────────────────────────────┐   ┌───────────────────────────────────────┐
│ Runtime Proposal Helpers        │   │ Hono / Worker Transport               │
│ evidence -> candidate inputs    │   │ admission -> route -> kernel call     │
│ `src/runtime/*/action-proposal` │   │ `src/http/routes/*`, `src/http/app.ts`│
└───────────────┬────────────────┘   └──────────────────┬────────────────────┘
                │                                       │
                └──────────────────┬────────────────────┘
                                   ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                         Protocol Kernel Facade                             │
│ transition methods only; no transport, storage adapter, or mutation logic  │
│ `src/protocol/kernel.ts`                                                   │
└──────────────────────────────────┬─────────────────────────────────────────┘
                                   ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                         Protocol Primitive Areas                           │
│ catalog -> runtime evidence -> graph -> compilation -> contract -> policy  │
│ -> review/isolation -> gateway -> lifecycle -> proof gap/recovery/receipt  │
│ `src/protocol/areas/*`                                                     │
└───────────────┬─────────────────────────────────────────────┬──────────────┘
                │                                             │
                ▼                                             ▼
┌────────────────────────────────────────┐      ┌────────────────────────────┐
│ Append-Only Store Port And Adapters     │      │ Reference Gateway Fixtures │
│ records, events, claims, consumption    │      │ mutate only after verified │
│ `src/protocol/store`, `src/storage/*`   │      │ `src/adapters/*/gateway.ts`│
└────────────────────────────────────────┘      └────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Canonical doctrine | Defines authority rule, state path, claim boundary, and extension boundary. | `docs/internal/protocol-definition.md` |
| Kernel architecture canon | Maps schema owners, transition surface, record taxonomy, authority sequence, store atomicity, and gateway policy lifecycle. | `docs/internal/protocol-kernel-architecture.md` |
| Lane ownership manifests | Define authority owner, proof claim, imports, public surface, and scope boundary for each first-level source lane. | `src/*/LANE.md` |
| Package root | Exposes curated public HTTP, schema, SDK, navigation, error, and verified-gate helpers. | `src/index.ts` |
| Experimental surface | Exposes reference gateway fixtures under an explicit experimental subpath. | `src/experimental.ts` |
| Worker entrypoint | Wires Cloudflare Worker `fetch` to the Hono app. | `src/worker.ts` |
| HTTP app | Registers health, OpenAPI, transition, evidence-read, and internal record routes. | `src/http/app.ts` |
| HTTP route registry | Owns HTTP paths, caller roles, schemas, summaries, and scope resolvers. | `src/http/routes/transition-route-registry.ts` |
| HTTP invokers | Map route IDs to `HandshakeKernel` transition methods. | `src/http/routes/transition-invokers.ts` |
| Admission | Enforces role-scoped bearer custody or hosted caller identity before transition execution. | `src/http/admission/*` |
| Protocol kernel facade | Delegates each transition to protocol area implementations through public area indexes. | `src/protocol/kernel.ts` |
| Protocol areas | Own primitive schemas, inputs, guards, records, and transition behavior. | `src/protocol/areas/*` |
| Foundation | Owns canonicalization, IDs, errors, reason codes, base schemas, and transition guard results. | `src/protocol/foundation/*` |
| Events | Builds digest-chained stream events and stores transition request context evidence. | `src/protocol/events/*` |
| Store port | Defines record, stream, greenlight consumption, commit, posture, receipt, and isolation operations. | `src/protocol/store/port.ts` |
| Storage adapters | Implement `ProtocolStore` for memory and Cloudflare D1; KV is isolation cache only. | `src/storage/*` |
| Runtime helpers | Convert generated tool calls or codemode blocks into protocol inputs and proposals. | `src/runtime/*` |
| Gateway fixtures | Demonstrate package install, repo write, and preview deploy mutation discipline after `VerifiedGatewayCheck`. | `src/adapters/*/gateway.ts` |
| SDK client | Sends typed HTTP requests, role tokens, protocol headers, and parses typed transition errors. | `src/sdk/client.ts` |
| Conformance | Provides narrow adapter probes for "no mutation without verified gate". | `src/conformance/index.ts` |

## Pattern Overview

**Overall:** Lane-oriented TypeScript protocol kernel with ports/adapters and explicit state-machine transitions.

**Key Characteristics:**
- Protocol meaning lives in `src/protocol`; transport, runtime wrappers, storage adapters, SDK ergonomics, and gateway fixtures stay outside the meaning boundary.
- Each consequential action path reduces generated execution evidence into a `CandidateAction`, exact `ActionContract`, `PolicyDecision`, optional one-use `Greenlight`, `GatewayCheckAttempt`, `MutationAttempt`, and `Receipt` or `ProofGap`.
- `ProtocolStore` is the durable reconstruction port; D1 and memory implement the same atomic commit surface.
- HTTP route metadata, invokers, response schemas, and scope resolution are deliberately split across `src/http/routes/*`.
- Architecture tests in `test/architecture/*` enforce lane manifests, import posture, naming, package surface, root exports, and active vocabulary.

## Layers

**Canonical Documentation:**
- Purpose: Keep product and architecture claims bounded to installed gateway-checked paths.
- Location: `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/*`
- Contains: Authority rule, source map, ownership rules, implementation notes, and durable decisions.
- Depends on: Source and tests as operational evidence.
- Used by: Planners, implementers, architecture tests, package surface checks.

**Protocol Foundation:**
- Purpose: Provide deterministic primitives used by all protocol areas.
- Location: `src/protocol/foundation`
- Contains: `canonical.ts`, `ids.ts`, `errors.ts`, `reason-codes.ts`, `schema-core.ts`, `transition-guards.ts`, `content-digests.ts`.
- Depends on: Web Crypto and TypeScript runtime APIs.
- Used by: `src/protocol/areas/*`, `src/protocol/events/*`, runtime helpers, adapters.

**Protocol Areas:**
- Purpose: Own primitive-specific schemas, inputs, guards, and transitions.
- Location: `src/protocol/areas`
- Contains: `catalog-envelope`, `runtime-evidence`, `generated-execution-graph`, `intent-compilation`, `action-contract`, `policy-greenlight`, `review-binding`, `protected-path-posture`, `gateway-gate`, `operation-lifecycle`, `proof-gap`, `isolation-breaker`, `recovery`, `receipt-export`, `refusal`, `object-registry`.
- Depends on: Foundation, events, context, store port, and other area public indexes.
- Used by: `src/protocol/kernel.ts`, public schema/input aggregators, selected HTTP/SDK public types.

**Kernel Facade:**
- Purpose: Present the protocol transition surface without embedding transport, storage adapter, or mutation code.
- Location: `src/protocol/kernel.ts`
- Contains: `HandshakeKernel` methods for catalog registration, evidence recording, intent compilation, action proposal, policy, review, gateway, lifecycle, isolation, receipt export, and recovery.
- Depends on: Protocol areas, `ProtocolRecorder`, `ProtocolStore`.
- Used by: HTTP invokers, runtime tests, integration tests, SDK-driven HTTP flows.

**Event And Record Layer:**
- Purpose: Convert protocol records into canonical stored records and append digest-chained stream events.
- Location: `src/protocol/events`
- Contains: `ProtocolRecorder`, event chain construction, stream references, event schemas.
- Depends on: `ProtocolStore`, object registry, request context.
- Used by: Every authority-bearing and evidence-bearing protocol transition.

**Storage Port And Adapters:**
- Purpose: Persist records, stream events, current indexes, greenlight consumption, and conflict outcomes.
- Location: `src/protocol/store`, `src/storage`
- Contains: Store interface, in-memory implementation, D1 implementation, D1 statement builder, KV/noop isolation cache.
- Depends on: Protocol store types and D1/KV platform types.
- Used by: Kernel, HTTP store resolution, tests, Worker deployment.

**HTTP Transport:**
- Purpose: Expose transition and read routes while preserving custody checks and request context evidence.
- Location: `src/http`
- Contains: Hono app, route registries, route invokers, admission, request context, errors, handlers, OpenAPI, navigation, store resolution.
- Depends on: Protocol public schemas/inputs, `HandshakeKernel`, storage adapters, Hono.
- Used by: `src/worker.ts`, `src/sdk/client.ts`, HTTP and D1 tests.

**Runtime Proposal Helpers:**
- Purpose: Turn generated tool calls and codemode action lists into protocol evidence and action contract proposals.
- Location: `src/runtime`
- Contains: `package-install/action-proposal.ts`, `repo-write/action-proposal.ts`, `preview-deploy/action-proposal.ts`, `codemode-multi-action/*`.
- Depends on: Protocol public area indexes, canonicalization helpers.
- Used by: Runtime tests, integration tests, reference flows.

**Gateway Fixtures:**
- Purpose: Demonstrate protected mutation-side enforcement only after `VerifiedGatewayCheck`.
- Location: `src/adapters`
- Contains: Package install, repo write, and preview deploy gateway runners and parameter schemas.
- Depends on: Gateway check helpers and operation lifecycle inputs.
- Used by: Adapter tests, conformance tests, integration tests, experimental exports.

**SDK And Conformance:**
- Purpose: Provide client ergonomics and narrow reference conformance probes.
- Location: `src/sdk`, `src/conformance`
- Contains: `HandshakeClient`, `HandshakeClientError`, protected mutation adapter probes.
- Depends on: HTTP route contract, public schemas/inputs, gateway result types.
- Used by: HTTP tests, D1 integration tests, package subpath exports.

## Data Flow

### Primary Request Path

1. HTTP caller reaches the Hono app through `createApp` and route registration (`src/http/app.ts:26`, `src/http/app.ts:39`).
2. `handleTransition` admits the caller, constructs header/request context, parses the Zod request body, optionally resolves hosted tenant/org scope, and dispatches through a route invoker (`src/http/app.ts:58`).
3. Route metadata supplies the path, caller role, request schema, response schema, and scope resolver (`src/http/routes/transition-route-registry.ts:61`).
4. `transitionInvokers` map the route ID to one `HandshakeKernel` method (`src/http/routes/transition-invokers.ts:3`).
5. `kernelFor` creates `HandshakeKernel` around the resolved `ProtocolStore` and transition request context (`src/http/store/resolution.ts`).
6. `HandshakeKernel` delegates to protocol area transitions (`src/protocol/kernel.ts:63`).
7. Protocol transitions validate input, load referenced records, enforce guards, build records/events, and commit through `ProtocolRecorder` (`src/protocol/events/records.ts`).
8. The active `ProtocolStore` commits records, streams, claims, and conflicts atomically through D1 or memory (`src/protocol/store/port.ts:113`, `src/storage/d1/index.ts:208`, `src/storage/memory/index.ts:140`).

### Authority Chain

1. Catalog records are registered with immutable same-ID digest semantics (`src/protocol/kernel.ts:73`).
2. Runtime evidence is recorded without authority (`src/protocol/kernel.ts:85`, `src/runtime/codemode-multi-action/generated-graph-evidence.ts`).
3. Generated execution graph evidence is created, coverage is derived, and nonce replay is rejected (`src/protocol/areas/generated-execution-graph/transitions.ts:26`, `src/protocol/areas/generated-execution-graph/coverage.ts:23`).
4. Intent compilation loads catalog, envelope, gateway, runtime, and graph records; it emits a contractable or rejected `CandidateAction` (`src/protocol/areas/intent-compilation/transitions.ts:39`, `src/protocol/areas/intent-compilation/transitions.ts:107`).
5. Action contract proposal verifies pinned digests, candidate status, generated graph coverage, recovery linkage, and deterministic binding material (`src/protocol/areas/action-contract/transitions.ts:51`, `src/protocol/areas/action-contract/contract-record.ts:27`).
6. Policy evaluation loads the exact contract and envelope, checks isolation, sequence dependencies, and protected-path posture, then records a decision and optional one-use greenlight (`src/protocol/areas/policy-greenlight/transitions.ts:64`, `src/protocol/areas/policy-greenlight/transitions.ts:116`).
7. Review artifact and decision records bind rendered review to exact contract and policy input digests; review evidence does not become authority by itself (`src/protocol/areas/review-binding/artifacts.ts`, `src/protocol/areas/review-binding/decisions.ts`).
8. Gateway check reloads contract, greenlight, policy decision, current gateway policy, protected-path posture, isolation, sequence dependencies, and observed params before any mutation (`src/protocol/areas/gateway-gate/transitions.ts:73`, `src/protocol/areas/gateway-gate/transitions.ts:114`).
9. Gateway fixtures call the protected surface only after `verifiedGatewayCheckFromResult` returns a verified gate (`src/adapters/package-install/gateway.ts:89`, `src/adapters/repo-write/gateway.ts:104`, `src/adapters/preview-deploy/gateway.ts:96`).
10. Surface operation reconciliation observes downstream finality, resolves or creates proof gaps, releases or keeps operation claims, and may create isolation for unknown finality (`src/protocol/areas/operation-lifecycle/transitions.ts:52`).
11. Receipt export packages existing receipt evidence; recovery recommendations require a receipt/proof-gap/refusal source and force a new action contract for follow-up mutation (`src/protocol/areas/recovery/recommendations.ts:36`, `src/protocol/areas/recovery/recommendations.ts:129`).

### Codemode Multi-Action Flow

1. `proposeCodemodeActionContracts` records runtime execution and generated graph evidence for the whole program (`src/runtime/codemode-multi-action/generated-program-runner.ts:98`).
2. The runner preflights every action before proposing any contract so a refused later sibling cannot leak authority to earlier actions (`src/runtime/codemode-multi-action/generated-program-runner.ts:116`).
3. Later actions are recompiled with `requiredPriorActionContractIds` after prior contracts exist, making sequencing explicit (`src/runtime/codemode-multi-action/generated-program-runner.ts:132`).
4. The runtime lane returns action contracts or refusal outcomes; it never evaluates policy, issues greenlights, performs gateway checks, records receipts, or mutates surfaces (`src/runtime/LANE.md`).

**State Management:**
- All durable protocol state flows through `ProtocolStore` (`src/protocol/store/port.ts:113`).
- D1 schema stores protocol records, greenlight consumptions, greenlight issuances, recovery terminal claims, protected path posture indexes, protected surface operation claims, receipt lookup by mutation attempt, and stream events (`migrations/0001_protocol_kernel.sql:5`).
- Stream events are partitioned by organization, action, run, and protected surface resource, with contiguous offsets and previous-event digests (`src/protocol/events/chains.ts`).
- Memory store mirrors D1 semantics for tests and invariant oracles (`src/storage/memory/index.ts:24`).
- KV isolation cache is non-authoritative cache plumbing; durable isolation state remains in protocol records (`src/storage/kv/index.ts`).

## Key Abstractions

**Protocol Object Registry:**
- Purpose: Central metadata for protocol object schemas, ID selectors, export posture, raw-read posture, and isolation scope helpers.
- Examples: `src/protocol/areas/object-registry/index.ts`, `src/protocol/areas/object-registry/schemas.ts`
- Pattern: Registry over Zod schemas; object metadata only, not primitive transition behavior.

**Action Contract:**
- Purpose: Exact proposed commitment binding candidate, envelope, gateway registry, gateway policy, runtime/graph evidence, params digest, idempotency key, and canonicalizer version.
- Examples: `src/protocol/areas/action-contract/contract-record.ts`, `src/protocol/areas/action-contract/schemas.ts`
- Pattern: Deterministic canonical binding plus optional HMAC signature.

**Policy Decision And Greenlight:**
- Purpose: Bind one exact contract to policy input, isolation snapshot, protected-path posture, review posture, and one-use authority.
- Examples: `src/protocol/areas/policy-greenlight/transitions.ts`, `src/protocol/areas/policy-greenlight/policy-record/index.ts`
- Pattern: Policy decision can greenlight, refuse, require review, halt, or quarantine; greenlight issuance is conflict-guarded per contract.

**Gateway Check And Verified Gate:**
- Purpose: Final pre-mutation enforcement check that validates exact greenlight binding and returns a verifiable mutation gate.
- Examples: `src/protocol/areas/gateway-gate/transitions.ts`, `src/protocol/areas/gateway-gate/artifacts.ts`
- Pattern: Load-and-check at mutation time; refusal and replay are first-class outcomes.

**Receipt, Proof Gap, Recovery:**
- Purpose: Preserve reconstruction evidence without claiming downstream business success or retry authority.
- Examples: `src/protocol/areas/receipt-export`, `src/protocol/areas/proof-gap`, `src/protocol/areas/recovery`
- Pattern: Existing evidence packaging and explicit missing/ambiguous evidence records; follow-up mutation requires a new contract.

**Isolation State And Breaker Decision:**
- Purpose: Persist future authority reduction for policy and gateway checks.
- Examples: `src/protocol/areas/isolation-breaker/isolation-states.ts`, `src/protocol/areas/isolation-breaker/breaker-decisions.ts`
- Pattern: Scope-keyed state backed by stream watermarks when produced by a breaker decision.

**Transition Navigation:**
- Purpose: Map each protocol transition to phase, records written, events emitted, authority boundary, and evidence obligation.
- Examples: `src/protocol/navigation/index.ts`, `src/http/navigation/index.ts`, `test/protocol/transition-matrix.test.ts`
- Pattern: Declarative navigation metadata guarded against route/invoker drift.

**Lane Manifest:**
- Purpose: Make first-level source ownership and extraction boundaries visible.
- Examples: `src/protocol/LANE.md`, `src/http/LANE.md`, `src/runtime/LANE.md`, `src/storage/LANE.md`
- Pattern: Required manifest fields guarded by `test/architecture/import-posture.test.ts`.

## Entry Points

**Package Root:**
- Location: `src/index.ts`
- Triggers: `import "handshake-protocol-kernel"` or package root import.
- Responsibilities: Export stable public schemas, inputs, HTTP app, SDK client, navigation, auth helpers, errors, and verified gate helpers. It does not export `HandshakeKernel`, stores, recorder, or experimental gateways.

**Experimental Gateway Surface:**
- Location: `src/experimental.ts`
- Triggers: `import "handshake-protocol-kernel/experimental"`.
- Responsibilities: Export reference gateway fixture runners and parameter schemas only.

**Conformance Surface:**
- Location: `src/conformance/index.ts`
- Triggers: `import "handshake-protocol-kernel/conformance"`.
- Responsibilities: Probe protected mutation adapters for mutation without a verified gate.

**Worker Entrypoint:**
- Location: `src/worker.ts`
- Triggers: Cloudflare Worker runtime via `wrangler.toml`.
- Responsibilities: Create the app and expose `fetch`.

**HTTP App:**
- Location: `src/http/app.ts`
- Triggers: Worker, tests, or embedded app construction.
- Responsibilities: Register routes, admission, request context, route dispatch, errors, and evidence reads.

**SDK Client:**
- Location: `src/sdk/client.ts`
- Triggers: TypeScript callers using HTTP transport.
- Responsibilities: Send protocol headers, route role tokens, parse success/error responses, and expose transition methods.

**Kernel Facade:**
- Location: `src/protocol/kernel.ts`
- Triggers: HTTP invokers, tests, runtime helpers, embedded protocol usage.
- Responsibilities: Provide transition methods over a caller-supplied `ProtocolStore`.

**Quality Gates:**
- Location: `package.json`, `.github/workflows/check.yml`
- Triggers: Local `npm run check:repo`, CI workflow.
- Responsibilities: Typecheck, lint, format check, Bun tests, package dry-run, and whitespace diff check.

## Architectural Constraints

- **Threading:** JavaScript async execution under Bun and Cloudflare Worker semantics. No worker-thread or multi-process protocol state ownership is present.
- **Global state:** Source modules avoid module-level mutable protocol state. `createApp` can create one fallback `InMemoryProtocolStore` only when `allowEphemeralStore` is set or an injected store is provided (`src/http/app.ts:26`).
- **Storage consistency:** Authority-bearing transitions prefer explicit conflicts over availability. `ProtocolStore.commitProtocolRecords` and `commitGatewayCheck` expose `stream_conflict`, `greenlight_issuance_conflict`, `recovery_terminal_conflict`, `already_consumed`, and `operation_claim_conflict`.
- **Public API curation:** `src/index.ts` is curated and tested by `test/architecture/root-exports.test.ts`; internal kernel/store/recorder objects stay out of root exports.
- **Import direction:** Protocol does not import HTTP, storage adapters, runtime, SDK, or gateway fixtures. HTTP and SDK use public protocol faces instead of area internals. Storage imports the store port/object registry, not primitive transitions.
- **Gateway authority:** Reference adapters must not mutate before a `VerifiedGatewayCheck`; conformance and adapter tests guard this posture.
- **Planning scratch:** `.planning/` is scratch and is not canonical repo truth. Active repo truth lives in canonical docs and operational enforcement surfaces.
- **Circular imports:** No circular import chain is documented in active canon. Import posture tests enforce lane boundaries and public-index usage as the active guard.

## Anti-Patterns

### Transport Owns Protocol Meaning

**What happens:** A route or handler decides policy, gateway posture, review meaning, proof-gap meaning, or recovery meaning.
**Why it's wrong:** HTTP callers are not authority holders; transport can admit and contextualize, but protocol areas own state transitions.
**Do this instead:** Add the behavior to the relevant `src/protocol/areas/*` module and invoke it through `src/protocol/kernel.ts`; add route metadata in `src/http/routes/transition-route-registry.ts`.

### Runtime Evidence Becomes Permission

**What happens:** Runtime wrappers treat generated code, graph evidence, or a proposed candidate as permission to mutate.
**Why it's wrong:** Generated code and runtime evidence are inputs; authority requires exact contract, policy decision, one-use greenlight, and gateway check.
**Do this instead:** Keep runtime code in `src/runtime/*` limited to `compileIntent` and `proposeActionContract`; let policy and gateway paths run through `src/protocol/areas/policy-greenlight` and `src/protocol/areas/gateway-gate`.

### Adapter Mutates Before Verified Gate

**What happens:** A gateway fixture calls a package manager, repo writer, preview provider, or other protected surface before `verifiedGatewayCheckFromResult` returns a verified gate.
**Why it's wrong:** The generated code escaped the contract boundary.
**Do this instead:** Follow `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, and `src/adapters/preview-deploy/gateway.ts`: run `gatewayCheck`, derive `VerifiedGatewayCheck`, then mutate and reconcile.

### Review Artifact Replaces Binding

**What happens:** A rendered review screen or review decision is accepted without matching the exact contract digest and policy input digest.
**Why it's wrong:** This is review theatre.
**Do this instead:** Bind review artifacts and decisions through `src/protocol/areas/review-binding/artifacts.ts` and `src/protocol/areas/review-binding/decisions.ts`.

### Cache Becomes Authority

**What happens:** KV or an external cache is treated as the source of policy, isolation, receipt, or greenlight truth.
**Why it's wrong:** Cache state can be stale and cannot reconstruct authority-bearing transitions.
**Do this instead:** Store durable evidence through `ProtocolStore`; keep `src/storage/kv/index.ts` limited to cache posture.

### Greenlight Reuse

**What happens:** One greenlight authorizes multiple mutation attempts or a replay after consumption.
**Why it's wrong:** This is ambient authority wearing a badge.
**Do this instead:** Preserve greenlight issuance claims and consumption in `ProtocolStore`; handle replay through `src/protocol/areas/gateway-gate/replay-refusal`.

## Error Handling

**Strategy:** Protocol and HTTP errors are structured, typed, and evidence-aware.

**Patterns:**
- Protocol transitions throw `HandshakeProtocolError` with code, message, HTTP status, and optional metadata (`src/protocol/foundation/errors.ts`).
- HTTP maps protocol and Zod errors into `TransitionErrorEnvelope` with retryability, commit state, request identity, proof ref, and refusal ref (`src/http/errors/transition-error-envelope.ts`).
- Commit ambiguity and conflicts become explicit retryable, terminal, recoverable, or ambiguous outcomes rather than hidden retries.
- Gateway refusal, replay refusal, review refusal, proof gaps, and recovery terminal conflicts are protocol outcomes with records/events where applicable.

## Cross-Cutting Concerns

**Logging:** No application logging framework is present. Source linting disallows `console` except `warn` and `error` in `eslint.config.js`.
**Validation:** Zod strict schemas validate protocol objects, HTTP request/response shapes, hosted identities, runtime tool calls, and adapter parameters.
**Authentication:** Local HTTP mode uses role-scoped bearer tokens through `src/http/admission/caller-auth.ts`; hosted mode uses a caller verifier and `TransitionCallerIdentity` in `src/http/admission/hosted-caller-identity.ts`.
**Canonicalization:** `src/protocol/foundation/canonical.ts` supplies deterministic canonical JSON, SHA-256 digests, and optional HMAC signatures.
**Auditability:** `ProtocolRecorder` writes canonical stored records and digest-chained events; receipts include stream refs and distinguish gateway check, mutation attempt, downstream status, and proof gaps.
**Quality Enforcement:** `test/architecture/*`, `test/protocol/*`, `test/http/*`, `test/runtime/*`, `test/adapters/*`, `test/integration/*`, and `test/conformance/*` guard source shape and behavior.

---

*Architecture analysis: 2026-05-19*
