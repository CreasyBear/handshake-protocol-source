# Architecture

**Analysis Date:** 2026-05-20

## System Overview

```text
Handshake protocol kernel

Runtime / reference adapter layer
`src/runtime/*`  `src/adapters/*`  `src/install/*`  `src/conformance/*`
        |
        | proposes exact consequential action candidates and calls gateways
        v
HTTP / embedded transition boundary
`src/http/*`  `src/protocol/kernel.ts`
        |
        | admits request identity, invokes typed protocol transitions
        v
Protocol transition areas
`src/protocol/areas/*`
        |
        | append-only records, stream events, atomic authority indexes
        v
Protocol store port and implementations
`src/protocol/store/port.ts`
`src/storage/memory/index.ts`  `src/storage/d1/index.ts`
`src/storage/kv/index.ts`
        |
        | evidence projections and constrained representation
        v
Public read / review / reconstruction surfaces
`src/protocol/evidence-projections/*`
`src/http/handlers/evidence-read.ts`
`src/http/handlers/internal-record-read.ts`
```

Handshake is a TypeScript protocol kernel for contracted execution, not a hosted enforcement product by itself. The authority boundary is the gateway check: a gateway that owns the mutation credential must verify an exact one-use greenlight through `src/protocol/areas/gateway-gate/transitions.ts` before any protected mutation occurs. Runtime helpers, generated plans, HTTP admission, review projections, and receipts are evidence or orchestration surfaces; they are not authority.

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Public package surface | Exports curated Tier 1 kernel functions and types; keeps storage, HTTP, experimental gateways, and internal records out of the root API. | `src/index.ts` |
| Experimental package surface | Exports reference gateway fixtures and probes under an explicit experimental surface. | `src/experimental.ts` |
| Protocol kernel facade | Provides the in-process transition API and delegates to protocol area transitions. | `src/protocol/kernel.ts` |
| Protocol navigation | Source-owned transition catalog, lifecycle matrix input, records/events map, authority boundary map, and evidence obligations. | `src/protocol/navigation/index.ts` |
| Protocol store port | Defines append-only record/event storage plus atomic conflict surfaces for greenlight issuance, gateway consumption, idempotency, recovery terminal claims, protected-surface operation claims, and receipt indexes. | `src/protocol/store/port.ts` |
| Protocol recorder | Builds canonical stored records, stores transition request context, commits stream events, and maps store conflicts to transition failures. | `src/protocol/events/records.ts` |
| Object registry | Owns protocol object metadata, schema binding, ID selectors, public export posture, and raw-read posture. | `src/protocol/areas/object-registry/index.ts` |
| Public input/schema adapters | Provide external input schemas and parsed transition inputs without re-exporting internal stored record shapes. | `src/protocol/public/inputs.ts`, `src/protocol/public/schemas.ts`, `src/protocol/public/transitions.ts` |
| Intent compilation area | Converts runtime evidence and vague/exact inputs into candidate action commitments or refusal records. | `src/protocol/areas/intent-compilation/transitions.ts` |
| Action contract area | Canonicalizes proposed candidate actions into exact action contracts with clearing evidence references and idempotency metadata. | `src/protocol/areas/action-contract/transitions.ts`, `src/protocol/areas/action-contract/contract-record.ts` |
| Policy greenlight area | Evaluates action contracts and records greenlight, refusal, review, halt, or quarantine decisions. | `src/protocol/areas/policy-greenlight/transitions.ts` |
| Gateway gate area | Verifies exact greenlight binding before mutation and consumes the greenlight for a single gateway-checked attempt. | `src/protocol/areas/gateway-gate/transitions.ts`, `src/protocol/areas/gateway-gate/artifacts.ts` |
| Protected path posture area | Records wrapper/gateway bypass posture, probe outcomes, and path posture changes without claiming provider-native enforcement. | `src/protocol/areas/protected-path-posture/transitions.ts` |
| Operation lifecycle area | Reconciles attempted protected-surface operations into receipt, refusal, proof gap, downstream uncertainty, or recovery states. | `src/protocol/areas/operation-lifecycle/transitions.ts` |
| Evidence projections | Build redacted, reviewable projections from committed protocol records. | `src/protocol/evidence-projections/projections.ts`, `src/protocol/evidence-projections/schemas.ts` |
| HTTP app | Hosts route metadata, admission, request identity context, transition invocation, evidence reads, and internal raw reads. | `src/http/app.ts` |
| Store resolution | Chooses durable D1 store in hosted mode or explicit fallback store in ephemeral/test mode. | `src/http/store/resolution.ts` |
| Memory store | In-memory store that mirrors protocol atomicity and conflict behavior for tests and embedded use. | `src/storage/memory/index.ts` |
| D1 store | Durable SQLite/D1-backed store using table constraints and batch commits for protocol atomicity. | `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `migrations/0001_protocol_kernel.sql` |
| KV isolation cache | Stores isolation-state snapshots only; it is not an authority or evidence store. | `src/storage/kv/index.ts` |
| Runtime helpers | Turn package install, repo write, preview deploy, and generated program evidence into protocol proposals. | `src/runtime/*` |
| Reference gateways | Demonstrate package install, repo write, preview deploy, and x402 wallet gateway checks using `VerifiedGatewayCheck` before local mutation. | `src/adapters/*` |
| Install adapter pack | Compiles generic install-time adapter metadata, protected action catalogs, gateway manifests, and envelope records. | `src/install/*` |
| Conformance probes | Provide narrow adapter posture checks and expected evidence helpers; they are not certification. | `src/conformance/index.ts` |
| Architecture tests | Enforce lane manifests, import boundaries, package exports, naming posture, and public/private representation boundaries. | `test/architecture/*` |

## Pattern Overview

**Overall:** Source-owned protocol kernel with typed transition areas, append-only evidence, atomic authority indexes, constrained public representation, and experimental reference adapters outside the root package surface.

**Key Characteristics:**
- Protocol behavior lives under `src/protocol/areas/*`; HTTP, storage, runtime helpers, adapters, and install/conformance lanes must not own primitive semantics.
- Authority is exact and one-use: `src/protocol/areas/policy-greenlight/transitions.ts` can issue a greenlight, and `src/protocol/areas/gateway-gate/transitions.ts` must consume it for one gateway-checked mutation attempt.
- Store implementations must preserve the atomicity contract in `src/protocol/store/port.ts`; D1 and memory stores are behaviorally meaningful, while KV is only an isolation cache.
- Evidence projections are read-only reconstructions from protocol records; `src/protocol/evidence-projections/*` must not become a write path or policy input.
- Public representations are curated through `src/index.ts`, `src/protocol/public/*`, and `src/protocol/areas/object-registry/index.ts`; raw internal records stay internal-only unless explicitly marked public.
- Runtime and adapters are proof/reference lanes. They can show generated execution shape and gateway-side enforcement pattern, but they do not prove provider-native or universal runtime enforcement.

## Layers

**Canonical Doctrine and Ownership:**
- Purpose: Defines product invariants, current package orientation, quality rules, source ownership, and durable decisions.
- Location: `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/decisions.md`, `docs/internal/protocol-definition.md`, `docs/internal/protocol-kernel-architecture.md`, `docs/internal/protocol-notes.md`
- Contains: Product doctrine, command surface, quality gates, lane ownership, protocol architecture, durable decisions.
- Depends on: Source and tests for current behavior.
- Used by: Every mapper, planner, executor, and review agent.

**Public Package Surface:**
- Purpose: Exposes the curated protocol kernel API while hiding storage, HTTP app, adapter fixtures, and internal record internals.
- Location: `src/index.ts`, `src/experimental.ts`, `package.json`
- Contains: Root exports, experimental exports, package export map.
- Depends on: `src/protocol/*`, `src/protocol/public/*`, selected experimental adapter files.
- Used by: Package consumers, tests in `test/architecture/root-exports.test.ts`, `test/architecture/package-surface.test.ts`.

**Protocol Transition Kernel:**
- Purpose: Owns protocol state transitions and canonical record creation.
- Location: `src/protocol/kernel.ts`, `src/protocol/areas/*`
- Contains: Transition functions, canonical builders, area-specific schemas, exported protocol types.
- Depends on: `src/protocol/store/port.ts`, `src/protocol/events/records.ts`, `src/protocol/navigation/index.ts`.
- Used by: HTTP transition invokers, runtime helpers, adapters, tests, in-process package consumers.

**Authority and Evidence Store:**
- Purpose: Persists records, stream events, and authority-critical uniqueness/consumption indexes atomically.
- Location: `src/protocol/store/port.ts`, `src/storage/memory/index.ts`, `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `migrations/0001_protocol_kernel.sql`
- Contains: Append-only protocol records, event streams, isolation state, greenlight issuance/consumption, idempotency ledger, protected-surface operation claims, receipt index, recovery terminal claims.
- Depends on: Protocol store types only; storage must not import primitive behavior from protocol areas.
- Used by: `ProtocolRecorder` in `src/protocol/events/records.ts`, hosted HTTP store resolution in `src/http/store/resolution.ts`.

**Hosted HTTP Boundary:**
- Purpose: Converts HTTP requests into transition invocations with admitted request identity and store resolution.
- Location: `src/http/*`
- Contains: Hono app setup, route definitions, transition invokers, admission, request context, evidence reads, internal raw reads, OpenAPI helpers.
- Depends on: Protocol public inputs/schemas/transitions, kernel facade, store resolution.
- Used by: Cloudflare Worker entry in `src/worker.ts`, HTTP tests, hosted deployments.

**Runtime Proposal Helpers:**
- Purpose: Convert concrete execution scenarios and generated program evidence into candidate action proposals.
- Location: `src/runtime/package-install/*`, `src/runtime/repo-write/*`, `src/runtime/preview-deploy/*`, `src/runtime/codemode-multi-action/*`
- Contains: Action proposal helpers, generated execution graph recording, tool-call draft/finalization flows, sibling preflight logic.
- Depends on: `HandshakeKernel`, public protocol types, action catalogs.
- Used by: Reference examples, tests, adapter proof paths.

**Reference and Experimental Adapters:**
- Purpose: Demonstrate gateway-side check-and-mutate patterns for protected actions.
- Location: `src/adapters/package-install/*`, `src/adapters/repo-write/*`, `src/adapters/preview-deploy/*`, `src/adapters/x402-payment/*`, `src/adapters/protected-path-probes/*`
- Contains: Gateway fixtures, bypass probes, x402 install/action proposal helpers, conformance helpers.
- Depends on: Protocol kernel, `verifiedGatewayCheckFromResult` from `src/protocol/areas/gateway-gate/artifacts.ts`, operation lifecycle reconciliation.
- Used by: Experimental package export, examples, conformance checks.

**Install and Conformance Lanes:**
- Purpose: Model adoption-time protected action metadata and narrow adapter posture checks.
- Location: `src/install/*`, `src/conformance/index.ts`
- Contains: Install proposals, adapter pack manifests, protected action catalogs, conformance result types.
- Depends on: Public protocol types and install/adapters metadata.
- Used by: Reference flows and package consumers validating narrow fixture posture.

**Representation and Reconstruction Layer:**
- Purpose: Builds bounded review/read surfaces without exposing internal-only authority records by default.
- Location: `src/protocol/evidence-projections/*`, `src/http/handlers/evidence-read.ts`, `src/http/handlers/internal-record-read.ts`, `src/protocol/areas/object-registry/index.ts`
- Contains: Projection builders, Zod schemas, raw-read posture, redaction/public metadata.
- Depends on: Committed protocol records.
- Used by: Review surfaces, evidence reads, reconstruction tools, architecture tests.

## Data Flow

### Primary Request Path

1. Runtime or adapter code gathers concrete execution evidence and proposes a consequential action through helpers such as `proposePackageInstallAction` in `src/runtime/package-install/action-proposal.ts` or `runGeneratedProgram` in `src/runtime/codemode-multi-action/generated-program-runner.ts`.
2. The helper records generated execution evidence, generated execution graph, tool-call draft/finalization, and intent compilation through `HandshakeKernel` in `src/protocol/kernel.ts`.
3. `compileIntent` emits either candidate action records or refusal records through `src/protocol/areas/intent-compilation/transitions.ts`; it does not emit permission.
4. `proposeActionContract` canonicalizes a candidate into an exact action contract through `src/protocol/areas/action-contract/transitions.ts` and `src/protocol/areas/action-contract/contract-record.ts`.
5. `evaluatePolicy` records a policy decision through `src/protocol/areas/policy-greenlight/transitions.ts`. Possible decision classes include greenlight, refusal, review, halt, and quarantine.
6. A gateway that owns the protected mutation credential calls `gatewayCheck` through `src/protocol/areas/gateway-gate/transitions.ts`. The store atomically verifies an unconsumed matching greenlight and records a gateway check result.
7. The adapter obtains a `VerifiedGatewayCheck` through `src/protocol/areas/gateway-gate/artifacts.ts` before calling the local mutator in files such as `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, `src/adapters/preview-deploy/gateway.ts`, and `src/adapters/x402-payment/wallet-gateway.ts`.
8. The adapter reconciles the mutation attempt through `reconcileSurfaceOperation` in `src/protocol/areas/operation-lifecycle/transitions.ts`, producing receipt, refusal, proof gap, downstream uncertainty, or recovery records.
9. Evidence and reconstruction surfaces read committed records through `src/protocol/evidence-projections/projections.ts`, `src/http/handlers/evidence-read.ts`, and constrained raw reads in `src/http/handlers/internal-record-read.ts`.

### Hosted HTTP Transition Path

1. `createApp` in `src/http/app.ts` creates the Hono app, resolves a protocol store with `src/http/store/resolution.ts`, and registers transition routes from `src/http/routes/transition-route-registry.ts`.
2. `handleTransition` in `src/http/app.ts` parses the JSON body, admits request identity through `src/http/admission/index.ts`, builds request context through `src/http/admission/request-context.ts`, and invokes the route-specific kernel transition.
3. `transitionInvokers` in `src/http/routes/transition-invokers.ts` map route IDs to public transition functions from `src/protocol/public/transitions.ts`.
4. Response schemas live next to route metadata, while transition semantics remain in `src/protocol/areas/*`.

### Generated Program Path

1. `runGeneratedProgram` in `src/runtime/codemode-multi-action/generated-program-runner.ts` records runtime execution and generated graph evidence before any action contract is proposed.
2. The generated program helper preflights sibling actions and refuses the sequence before contract proposal if any sibling cannot compile to the requested action type.
3. Each compiled action candidate becomes a separate tool-call draft, finalized tool call, intent compilation, action contract, and policy decision.
4. The helper does not run gateway checks or mutations; adapters own the gateway-side authority boundary.

### Install and x402 Reference Path

1. `compileInstallProposal` in `src/install/install-proposal/index.ts` compiles declared install metadata into records and refusals.
2. `compileX402InstallProposal` in `src/adapters/x402-payment/install-proposal.ts` validates protected action catalog, gateway manifest, policy envelope, and wallet gateway binding.
3. `proposeX402PaymentAction` in `src/adapters/x402-payment/action-proposal.ts` turns payment-specific evidence into a candidate action proposal or refusal.
4. `createX402WalletGateway` in `src/adapters/x402-payment/wallet-gateway.ts` uses the same gateway-check and lifecycle reconciliation chain as other reference adapters.

**State Management:**
- Protocol state is append-only records plus stream events committed through `ProtocolRecorder` in `src/protocol/events/records.ts`.
- Authority-critical mutable state is represented as atomic indexes in `ProtocolStore`: greenlight issuance/consumption, idempotency ledger, protected-surface operation claims, receipt-by-mutation-attempt, recovery terminal claims, protected path posture, and isolation state.
- `src/storage/d1/index.ts` enforces atomicity with D1 batch statements and database constraints defined in `migrations/0001_protocol_kernel.sql`.
- `src/storage/memory/index.ts` mirrors the same conflicts for tests and embedded use.
- `src/storage/kv/index.ts` caches isolation state only; it must not be used as proof of authority or receipt evidence.
- `ActionAttemptLifecycle` in `src/protocol/areas/action-attempt-lifecycle/*` is derived from `protocolNavigation`, not stored as a separate mutable lifecycle object.

## Key Abstractions

**CandidateAction:**
- Purpose: Represents an exact proposed consequential mutation derived from runtime evidence and intent compilation.
- Examples: `src/protocol/areas/intent-compilation/transitions.ts`, `src/runtime/package-install/action-proposal.ts`, `src/runtime/repo-write/action-proposal.ts`, `src/runtime/preview-deploy/action-proposal.ts`
- Pattern: Proposed commitment only; never policy permission or gateway authority.

**ActionContract:**
- Purpose: Canonical, inspectable, gateway-bound representation of a proposed mutation.
- Examples: `src/protocol/areas/action-contract/contract-record.ts`, `src/protocol/areas/action-contract/transitions.ts`
- Pattern: Deterministic normalization and binding metadata before policy evaluation.

**PolicyDecision / Greenlight:**
- Purpose: Records policy evaluation outcome for a specific action contract.
- Examples: `src/protocol/areas/policy-greenlight/transitions.ts`, `src/protocol/areas/policy-greenlight/policy-record/index.ts`
- Pattern: Greenlight is a one-use authorization for an exact gateway-checked attempt; refusal, review, halt, and quarantine are first-class outcomes.

**GatewayCheck and VerifiedGatewayCheck:**
- Purpose: Final authority check before consequence and typed proof artifact used by reference gateways before mutation.
- Examples: `src/protocol/areas/gateway-gate/transitions.ts`, `src/protocol/areas/gateway-gate/artifacts.ts`, `src/adapters/*/gateway.ts`
- Pattern: Store-backed exact binding verification plus single-use consumption; adapters must not mutate without `VerifiedGatewayCheck`.

**ProtocolStore:**
- Purpose: Minimal storage contract for records/events plus atomic authority and reconstruction indexes.
- Examples: `src/protocol/store/port.ts`, `src/storage/d1/index.ts`, `src/storage/memory/index.ts`
- Pattern: Store implementations enforce conflicts as protocol outcomes; protocol areas must not depend on storage implementation details.

**ProtocolRecorder:**
- Purpose: Centralizes record/event commit behavior, transition request context, and retry/conflict mapping.
- Examples: `src/protocol/events/records.ts`
- Pattern: Area transitions build records through the recorder instead of direct store writes.

**ProtocolNavigation:**
- Purpose: Source-owned map of transitions, protocol phase, outcome class, authority boundary, records/events written, and evidence obligation.
- Examples: `src/protocol/navigation/index.ts`
- Pattern: Derived lifecycle and documentation must use this source instead of parallel lifecycle tables.

**ClearingEvidenceRefs:**
- Purpose: Optional evidence references such as `correlationRef`, `obligationRef`, and `counterpartyRef` carried for reconstruction.
- Examples: `src/protocol/areas/action-contract/contract-record.ts`, `src/protocol/evidence-projections/projections.ts`
- Pattern: Evidence-only fields; do not use them as policy authority, gateway matching input, or greenlight binding.

**AgentTransactionEnvelopeProjection:**
- Purpose: Redacted read-only projection for agent transaction evidence.
- Examples: `src/protocol/evidence-projections/projections.ts`, `src/protocol/evidence-projections/schemas.ts`
- Pattern: Projection only; not a protocol object, write path, or authority source.

**ProtectedPathPosture:**
- Purpose: Records raw/sibling bypass posture and wrapper/gateway protection evidence.
- Examples: `src/protocol/areas/protected-path-posture/transitions.ts`, `src/adapters/protected-path-probes/executor.ts`, `src/adapters/x402-payment/bypass-probes.ts`
- Pattern: Evidence about protection posture; does not claim provider-native enforcement beyond demonstrated wrapper/gateway path.

**InstallProposal / ProtectedActionAdapterPack:**
- Purpose: Adoption-time declaration of protected actions, gateway manifests, policy envelope, and adapter metadata.
- Examples: `src/install/install-proposal/index.ts`, `src/install/protected-action-adapter-pack/index.ts`, `src/adapters/x402-payment/install-proposal.ts`
- Pattern: Compiles bounded install records and refusals; does not issue runtime authority.

## Entry Points

**Package Root:**
- Location: `src/index.ts`
- Triggers: Consumer import from `handshake-protocol-kernel`.
- Responsibilities: Expose curated protocol kernel API, public schemas/inputs, evidence projection helpers, navigation metadata, and conformance helpers.

**Experimental Package Root:**
- Location: `src/experimental.ts`
- Triggers: Consumer import from `handshake-protocol-kernel/experimental`.
- Responsibilities: Expose experimental reference gateway fixtures and probes without promoting them to stable provider enforcement.

**In-Process Kernel:**
- Location: `src/protocol/kernel.ts`
- Triggers: Runtime helper, adapter, test, or package consumer with a `ProtocolStore`.
- Responsibilities: Invoke protocol transitions and keep direct catalog-object writes guarded by object-registry posture.

**Hosted Worker:**
- Location: `src/worker.ts`, `src/http/app.ts`
- Triggers: Cloudflare Worker request.
- Responsibilities: Build HTTP app, resolve durable/ephemeral store, admit request identity, route to transition invokers, expose evidence reads.

**D1 Migration:**
- Location: `migrations/0001_protocol_kernel.sql`
- Triggers: Cloudflare D1 migration command.
- Responsibilities: Create protocol records, events, authority indexes, posture/current-state indexes, and receipt indexes.

**Reference Gateways:**
- Location: `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, `src/adapters/preview-deploy/gateway.ts`, `src/adapters/x402-payment/wallet-gateway.ts`
- Triggers: Explicit reference adapter execution.
- Responsibilities: Call gateway check, require `VerifiedGatewayCheck`, mutate only after verification, then reconcile operation lifecycle.

**Generated Program Runner:**
- Location: `src/runtime/codemode-multi-action/generated-program-runner.ts`
- Triggers: Test/reference generated program execution.
- Responsibilities: Record generated program evidence, compile sibling candidates, preflight contractability, and propose independent exact contracts.

## Architectural Constraints

- **Runtime model:** Single-threaded TypeScript runtime; concurrency safety is delegated to store atomicity in `src/protocol/store/port.ts`, `src/storage/d1/index.ts`, and `src/storage/memory/index.ts`.
- **Gateway authority:** Protected mutation authority belongs at the gateway check and credential-holding adapter boundary, not at HTTP admission, runtime helper, review projection, or generated plan rendering.
- **One-use greenlight:** `commitGatewayCheck` in `src/protocol/store/port.ts` must prevent greenlight reuse, operation-claim conflicts, receipt-index conflicts, and stream conflicts.
- **Store parity:** Memory and D1 stores must preserve the same protocol conflicts. `src/storage/kv/index.ts` is only an isolation cache and must not substitute for D1/memory protocol evidence.
- **Global state:** The package should avoid hidden mutable global state. Protocol state is explicit through `ProtocolStore`; HTTP fallback stores are injected or created through `src/http/store/resolution.ts`.
- **Circular imports:** Architecture tests in `test/architecture/import-posture.test.ts` enforce protocol lane direction: protocol areas use public indexes, HTTP depends on protocol public surfaces, storage avoids primitive behavior imports, and adapters avoid storage imports.
- **Representation boundaries:** Raw internal records marked `internal_only` in `src/protocol/areas/object-registry/index.ts` must not be exposed by generic raw HTTP reads in `src/http/handlers/internal-record-read.ts`.
- **Reference adapter boundary:** `src/adapters/*` and `src/runtime/*` demonstrate local fixture enforcement paths only. Do not claim provider-native enforcement unless a gateway owned by that provider verifies the exact greenlight before consequence.
- **Source-owned docs:** `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, and `docs/internal/*` are canonical. `.planning/*` is scratch and must not introduce repo-facing taxonomy, package scripts, exports, or source names.
- **Empty lane placeholders:** Empty directories such as `src/runtime/x402-payment`, `src/runtime/consequence-ingress`, `src/adapters/x402-wallet-gateway`, and `src/conformance/x402-payment` are not active ownership signals. Use active files and lane manifests as source ownership.

## Anti-Patterns

### Treating Intent Compilation as Authority

**What happens:** Runtime helpers compile vague or generated program evidence into candidate actions and then treat the candidate as permission.

**Why it's wrong:** Candidate actions from `src/protocol/areas/intent-compilation/transitions.ts` are proposals only. Permission exists only after a policy greenlight is issued and a gateway consumes it for a matching mutation attempt.

**Do this instead:** Use the full chain in `src/protocol/kernel.ts`: `compileIntent`, `proposeActionContract`, `evaluatePolicy`, `gatewayCheck`, then `reconcileSurfaceOperation`. Reference gateways in `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, `src/adapters/preview-deploy/gateway.ts`, and `src/adapters/x402-payment/wallet-gateway.ts` show the expected check-before-mutation pattern.

### Turning Review or Projection Output into Policy Input

**What happens:** A review UI or evidence projection is used as if it were the bound action contract or policy decision.

**Why it's wrong:** `src/protocol/evidence-projections/projections.ts` builds read-only views from records. A rendered or projected representation is evidence for review/reconstruction, not an authority-bearing object.

**Do this instead:** Bind policy and gateway checks to canonical action contracts from `src/protocol/areas/action-contract/contract-record.ts`; render projections only after or alongside committed records.

### Reusing a Greenlight Across Mutations

**What happens:** One greenlight is treated as ambient permission for multiple retries, branches, or sibling tool calls.

**Why it's wrong:** The invariant is one greenlight for one exact gateway-checked mutation attempt. Reuse collapses gateway enforcement into ambient authority.

**Do this instead:** Rely on `commitGatewayCheck` in `src/protocol/store/port.ts` and implementations in `src/storage/d1/index.ts` and `src/storage/memory/index.ts` to consume a greenlight exactly once. Generated program siblings in `src/runtime/codemode-multi-action/generated-program-runner.ts` must receive separate candidates/contracts/decisions.

### Hiding Provider Enforcement Claims in Adapters

**What happens:** A reference adapter in `src/adapters/*` is described as proving that npm, git, deployment, or x402 providers enforce Handshake natively.

**Why it's wrong:** The current code proves wrapper/reference gateway behavior. Provider-native enforcement requires the provider's real mutation gateway to verify the exact greenlight before consequence.

**Do this instead:** Name `src/adapters/*` as reference or experimental. Keep provider/runtime enforcement claims out of `src/index.ts`, `README.md`, and canonical docs unless source-backed gateway ownership exists.

### Exposing Internal Records Through Generic Reads

**What happens:** Internal transition context, idempotency ledger, bypass probes, stream events, or operation claims are exposed through generic HTTP raw record reads.

**Why it's wrong:** Internal records may contain operational evidence not intended as public protocol representation.

**Do this instead:** Use object-registry read posture in `src/protocol/areas/object-registry/index.ts` and the refusal behavior in `src/http/handlers/internal-record-read.ts`; add explicit redacted projections in `src/protocol/evidence-projections/*` when a public view is needed.

### Creating Parallel Lifecycle Sources

**What happens:** A new table, doc, or enum independently redefines the transition chain or lifecycle phase map.

**Why it's wrong:** Divergent lifecycle maps create stale evidence, incorrect review surfaces, and incomplete reconstruction.

**Do this instead:** Extend `src/protocol/navigation/index.ts` and derive lifecycle summaries from it through `src/protocol/areas/action-attempt-lifecycle/*`.

## Error Handling

**Strategy:** Protocol transitions return typed success/refusal/conflict outcomes where possible and throw only for invalid call paths or infrastructure failures. Store conflicts are meaningful protocol failures, not generic exceptions.

**Patterns:**
- Parse and validate external inputs with public schemas from `src/protocol/public/schemas.ts`, `src/protocol/public/inputs.ts`, and HTTP route schemas in `src/http/routes/transition-route-registry.ts`.
- Model refusal, review, halt, quarantine, proof gap, downstream uncertainty, and recovery as first-class records in `src/protocol/areas/*`.
- Convert store atomicity conflicts from `src/protocol/store/port.ts` into protocol-specific errors or refusal/conflict responses through `src/protocol/events/records.ts`.
- In gateways, mutate only after `verifiedGatewayCheckFromResult` succeeds; otherwise return a refusal/proof outcome and do not call the mutator.
- In HTTP, parse errors, admission failures, hosted-scope violations, and transition errors are handled in `src/http/app.ts` without moving transition semantics into route handlers.

## Cross-Cutting Concerns

**Logging:** No application-wide logging framework is part of the kernel. Durable evidence belongs in protocol records and stream events through `src/protocol/events/records.ts`, not console output.

**Validation:** Zod schemas are used for public inputs, evidence projections, and HTTP route bodies in `src/protocol/public/schemas.ts`, `src/protocol/evidence-projections/schemas.ts`, and `src/http/routes/transition-route-registry.ts`.

**Authentication:** Hosted HTTP admission in `src/http/admission/index.ts` and request context in `src/http/admission/request-context.ts` establish caller identity and role context. This is not mutation authority; gateway checks remain the enforcement boundary.

**Authorization:** Policy evaluation in `src/protocol/areas/policy-greenlight/transitions.ts` issues greenlight/refusal/review/halt/quarantine decisions for exact contracts. Gateway enforcement in `src/protocol/areas/gateway-gate/transitions.ts` is required before consequence.

**Isolation:** Isolation state is stored through `ProtocolStore` and optionally cached by `src/storage/kv/index.ts`. Future policy and gateway checks must respect isolation records before issuing or consuming authority.

**Idempotency and Replay:** Idempotency ledger entries in `src/protocol/areas/idempotency-ledger/entries.ts` and store conflicts in `src/protocol/store/port.ts` are the replay-control mechanism. Retries must resolve to the same exact protected attempt or produce a conflict/refusal.

**Evidence and Audit:** Receipts, refusals, proof gaps, gateway checks, operation lifecycle records, and projections must distinguish gateway verification from downstream business success. `src/protocol/evidence-projections/*` reconstructs evidence from committed records without smoothing gaps into success.

---

*Architecture analysis: 2026-05-20*
