<!-- refreshed: 2026-05-21 -->
# Architecture

**Analysis Date:** 2026-05-21

## System Overview

```text
+--------------------------------------------------------------------------------+
|                  Runtime / HTTP / SDK / Adapter Activation                      |
|  `src/runtime/`  `src/http/`  `src/sdk/`  `src/install/`  `src/adapters/`       |
+--------------------------+-------------------------+---------------------------+
                           | invokes kernel methods and reads projections
                           v
+--------------------------------------------------------------------------------+
|                         Tier 1 Protocol Kernel                                  |
|  `src/protocol/kernel.ts`                                                       |
|  `src/protocol/areas/*`                                                         |
|  `src/protocol/foundation/*` `src/protocol/events/*` `src/protocol/store/*`     |
+--------------------------+-------------------------+---------------------------+
                           | commits records, stream events, indexes
                           v
+--------------------------------------------------------------------------------+
|                         Reconstruction Store                                    |
|  `src/storage/memory/index.ts` `src/storage/d1/index.ts`                         |
|  `migrations/0001_protocol_kernel.sql`                                          |
+--------------------------+-------------------------+---------------------------+
                           | gateway reloads exact contract, greenlight, posture
                           v
+--------------------------------------------------------------------------------+
|                         Gateway-Owned Mutation Boundary                         |
|  `src/adapters/*/gateway.ts` `src/adapters/x402-payment/wallet-gateway.ts`      |
|  protected package install / repo write / preview deploy / x402 payment paths   |
+--------------------------------------------------------------------------------+
```

The architecture is a TypeScript protocol kernel with transport, runtime, SDK,
install, storage, and adapter lanes around it. The gateway is the enforcement
point before consequence. Runtime evidence, HTTP routes, SDK calls, review
artifacts, diagnostic projections, install proposals, conformance checks, and
hosted admission seams are not authority unless the path reaches an exact
`ActionContract`, one-use `Greenlight`, and `GatewayCheck` before mutation.

## Tiered Architecture Boundaries

| Tier | Owns | Current source | Authority boundary | Do not put here |
| ---- | ---- | -------------- | ------------------ | ---------------- |
| Tier 1 protocol/kernel foundation | Source-owned authority chain, protocol areas, deterministic schemas, store port, D1/memory reconstruction, HTTP diagnostic evidence reads, terminal `AuthorityCertificate`, local proof profiles as regression evidence only. | `src/protocol/kernel.ts`, `src/protocol/areas/*`, `src/protocol/evidence-projections/*`, `src/protocol/store/port.ts`, `src/storage/*`, `src/http/routes/evidence-read-route-registry.ts`, `src/http/handlers/evidence-read.ts`, `src/protocol/areas/authority-certificate/*`, `test/product/agent-proof-slice.test.ts` | One exact proposed action becomes authority only after policy creates a one-use greenlight and the gateway verifies it before mutation. `AuthorityCertificate` signs terminal evidence only. | Hosted RBAC, policy management UI, CLI/MCP product surfaces, marketplace/certification primitives, external trust roots, or payment rails as protocol drivers. |
| Tier 2 app activation | Runtime ingress, app-layer representation, metadata/challenge/request/evidence surfaces, first protected-action walkthroughs, SDK/CLI/MCP proposal and evidence ergonomics with no authority. | `src/runtime/ingress/index.ts`, `src/runtime/index.ts`, `src/protocol/areas/protected-action-representation/*`, `src/sdk/client.ts`, `.planning/tier2/06-policy-agent-management-interface-map.md` | May observe, describe, propose, challenge, or project. It must not issue policy decisions, greenlights, gateway checks, receipts, or mutations. | Gateway credentials, mutation runners, hosted org policy, or any shortcut from metadata/request/review to mutation authority. |
| Tier 3 hosted operation | Org/RBAC, policy-pack lifecycle, retention, search, alerts, audit export, read models, managed gateway registry, install-health monitoring, exposure counters. | Current code has seams in `src/http/admission/hosted-caller-identity.ts`, `src/http/admission/index.ts`, and scope-aware reads in `src/http/handlers/evidence-read.ts`. Tier 3 product objects are mapped in `.planning/tier2/06-policy-agent-management-interface-map.md`. | Hosted Handshake is not gateway enforcement unless it owns or controls the mutation credential and the gateway still checks the exact greenlight before mutation. | Kernel RBAC, raw `protocol_records` JSON search as product surface, hosted screens treated as clearing, or policy dashboards treated as enforcement. |
| Tier 4 ecosystem/interoperability | External trust roots, cross-org verification, provider/customer gateway custody, conformance/certification marks, market/contracting/compliance/dispute consumers. | Local source exposes terminal certificate primitives in `src/protocol/areas/authority-certificate/*` and reference conformance in `src/conformance/*`; external ecosystem plans live in `.planning/tier2/07-agentic-economy-clearing-house-research.md` and `.planning/tier2/08-external-adapter-plug-in-architecture.md`. | External systems consume signed terminal evidence or run conformance checks. They do not mint greenlights or replace gateway checks. | Tier 1 primitives for ERC-8004, marketplaces, reputation, netting, settlement, or provider certification. |

## Component Responsibilities

| Component | Responsibility | File |
| --------- | -------------- | ---- |
| Protocol kernel facade | Exposes transition methods and delegates to owned protocol area transitions. | `src/protocol/kernel.ts` |
| Protocol areas | Own primitive schemas, inputs, guards, transitions, and projections for contracts, policy, gateway gates, receipts, proof gaps, refusal, review, recovery, isolation, evidence, and certificates. | `src/protocol/areas/*` |
| Public protocol aggregators | Re-export stable schemas, inputs, and selected transition guards without adding behavior. | `src/protocol/public/schemas.ts`, `src/protocol/public/inputs.ts`, `src/protocol/public/transitions.ts` |
| Foundation | Own canonicalization, IDs, errors, reason codes, core schemas, and transition guard helpers. | `src/protocol/foundation/*` |
| Event recorder | Converts transition records into append-only stream events and stored protocol records. | `src/protocol/events/records.ts`, `src/protocol/events/chains.ts`, `src/protocol/events/schemas.ts` |
| Store port | Defines atomic persistence contracts, indexes, greenlight consumption, idempotency ledger, isolation, posture, receipt lookup, and gateway-check commits. | `src/protocol/store/port.ts` |
| HTTP app | Provides Hono/Worker routes, role admission, request context, transition dispatch, OpenAPI, redacted reads, and raw-read boundary enforcement. | `src/http/app.ts`, `src/http/routes/*`, `src/http/handlers/*`, `src/http/admission/*` |
| Runtime ingress | Converts observed generated dispatch blocks into runtime evidence, generated graph evidence, finalized tool-call drafts, intent compilations, contracts, or refusals. | `src/runtime/ingress/index.ts` |
| Protected-action representation | Defines internal `ProtectedActionMetadata`, `ProtectedActionChallenge`, `ProtectedActionRequest`, and `ProtectedActionEvidenceProjection` non-authority shapes. | `src/protocol/areas/protected-action-representation/*` |
| Install compiler | Defines generic install proposals and adapter packs that compile setup data into catalog, action, gateway, envelope, probe-plan, and receipt-expectation records. | `src/install/install-proposal/index.ts`, `src/install/protected-action-adapter-pack/index.ts` |
| Reference adapters | Hold fixture mutation surfaces and run only after `verifiedGatewayCheckFromResult()` produces a verified gate. | `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, `src/adapters/preview-deploy/gateway.ts`, `src/adapters/x402-payment/wallet-gateway.ts` |
| Storage adapters | Persist protocol records and indexes in memory or D1 without interpreting protocol meaning. | `src/storage/memory/index.ts`, `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `migrations/0001_protocol_kernel.sql` |
| SDK client | Calls HTTP transition and evidence-read routes with role-scoped bearer tokens and parses typed errors. | `src/sdk/client.ts` |
| Conformance checks | Expose narrow reference checks for gateway/posture behavior without standards-certification claims. | `src/conformance/index.ts`, `src/adapters/x402-payment/conformance.ts` |
| Package exports | Curate public, runtime, conformance, and experimental reference surfaces. | `src/index.ts`, `src/runtime/index.ts`, `src/conformance/index.ts`, `src/experimental.ts`, `package.json` |

## Pattern Overview

**Overall:** Layered protocol-kernel architecture with source-owned state
machines, append-only evidence, role-separated transport, and reference gateway
fixtures.

**Key Characteristics:**

- `src/protocol/areas/*` owns protocol meaning; `src/http/*`, `src/sdk/*`,
  `src/runtime/*`, `src/adapters/*`, and `src/storage/*` are lanes around it.
- Transitions record durable evidence before they create any stronger authority
  state. Refusal, replay refusal, isolation, recovery, and proof gap are normal
  protocol outcomes.
- Authority is exact and one-use: one `ActionContract`, one `PolicyDecision`,
  one optional `Greenlight`, one gateway check before one protected mutation
  attempt.
- Runtime ingress and representation shapes are proposal/evidence layers. They
  cannot create `PolicyDecision`, `Greenlight`, `GatewayCheckAttempt`,
  `Receipt`, or `MutationAttempt`.
- HTTP route metadata, transition invokers, response schemas, and scope
  resolvers are intentionally split in `src/http/routes/*`.
- Storage implements `ProtocolStore`; it stores records and conflict indexes
  but does not import primitive transition modules.

## Layers

**Protocol Kernel:**

- Purpose: Own exact protected-action semantics and transition invariants.
- Location: `src/protocol/`
- Contains: `kernel.ts`, `areas/*`, `foundation/*`, `events/*`, `context/*`, `navigation/*`, `public/*`, `store/*`, `evidence-projections/*`.
- Depends on: Zod, canonicalization helpers, protocol store interface.
- Used by: `src/http/*`, `src/runtime/*`, `src/adapters/*`, tests, and curated root exports in `src/index.ts`.

**Protocol Areas:**

- Purpose: Keep each primitive locally owned with schema, input, guard, transition, and projection files.
- Location: `src/protocol/areas/*`
- Contains: `action-contract`, `policy-greenlight`, `gateway-gate`, `authority-certificate`, `intent-compilation`, `tool-call-draft`, `runtime-evidence`, `generated-execution-graph`, `protected-action-representation`, `protected-path-posture`, `bypass-probe`, `idempotency-ledger`, `receipt-export`, `refusal`, `proof-gap`, `operation-lifecycle`, `recovery`, `review-binding`, `isolation-breaker`, `object-registry`, `catalog-envelope`, `action-attempt-lifecycle`.
- Depends on: Area public indexes, `src/protocol/foundation/*`, `src/protocol/events/*`, and `src/protocol/store/port.ts`.
- Used by: `HandshakeKernel`, public schema aggregators, evidence projections, tests.

**Runtime Proposal Layer:**

- Purpose: Convert generated execution evidence into candidate proposals or refusals.
- Location: `src/runtime/`
- Contains: `src/runtime/ingress/index.ts`, package/repo/preview action proposal helpers, codemode multi-action fixtures.
- Depends on: Protocol kernel methods, public schemas/inputs, canonical digests, adapter-specific proposal builders.
- Used by: `test/runtime/*`, `test/product/agent-proof-slice.test.ts`, `src/runtime/index.ts`.

**HTTP Transport Layer:**

- Purpose: Expose transition routes and diagnostic evidence reads while preserving caller custody and scope.
- Location: `src/http/`
- Contains: `app.ts`, `routes/*`, `handlers/*`, `admission/*`, `errors/*`, `openapi/*`, `navigation/*`, `store/*`.
- Depends on: `HandshakeKernel`, public schemas/inputs, route metadata, store resolution.
- Used by: `src/worker.ts`, `src/sdk/client.ts`, `test/http/*`, `test/integration/*`.

**SDK Layer:**

- Purpose: Provide typed client methods for HTTP transitions and redacted evidence reads.
- Location: `src/sdk/client.ts`
- Contains: `HandshakeClient`, `HandshakeClientError`, role token routing, request identity headers.
- Depends on: Public protocol schemas/inputs and HTTP error/admission types.
- Used by: Tests and external callers through the root export in `src/index.ts`.

**Install And Adapter Layers:**

- Purpose: Compile protected-path setup and prove fixture gateway mutation discipline.
- Location: `src/install/`, `src/adapters/`
- Contains: Generic install proposal contracts, adapter packs, x402 install/proposal/gateway/conformance/probe code, package/repo/preview gateway fixtures.
- Depends on: Public protocol gateway verification helpers and adapter-local schemas.
- Used by: `test/adapters/*`, `test/conformance/*`, `test/product/agent-proof-slice.test.ts`, `src/experimental.ts`.

**Storage Layer:**

- Purpose: Provide atomic persistence and reconstruction indexes for protocol records.
- Location: `src/storage/`, `migrations/`
- Contains: Memory store, D1 store, D1 statement builder, KV cache plumbing, D1 SQL schema.
- Depends on: `src/protocol/store/port.ts` and object registry metadata.
- Used by: HTTP store resolution, tests, local D1 harnesses.

## Data Flow

### Primary Protected Action Path

1. Runtime or HTTP caller records execution evidence through `createRuntimeExecution`, `createGeneratedExecutionGraph`, and `ToolCallDraft` (`src/runtime/ingress/index.ts`, `src/protocol/kernel.ts`).
2. `compileIntent` records an `IntentCompilationRecord` and `CandidateAction` or refusal; it validates catalog, envelope, graph, draft, scope, and secret posture (`src/protocol/areas/intent-compilation/*`).
3. `proposeActionContract` canonicalizes a contractable candidate into exact proposed commitment (`src/protocol/areas/action-contract/*`).
4. `evaluatePolicy` evaluates one exact contract against the envelope, sequence, idempotency ledger, protected-path posture, review, and isolation state; it records `PolicyDecision`, optional `Greenlight`, or refusal (`src/protocol/areas/policy-greenlight/*`).
5. Gateway adapter calls `gatewayCheck` with observed parameters and greenlight; protocol reloads contract, greenlight, posture, isolation, policy drift, params digest, and idempotency state before mutation (`src/protocol/areas/gateway-gate/*`).
6. Reference adapter mutates only after `verifiedGatewayCheckFromResult()` returns a verified gate (`src/adapters/package-install/gateway.ts`, `src/adapters/x402-payment/wallet-gateway.ts`).
7. Reconciliation records downstream finality or proof gap without authorizing retry mutation (`src/protocol/areas/operation-lifecycle/*`, `src/protocol/areas/proof-gap/*`).
8. Evidence reads project redacted contract, transaction envelope, idempotency recovery, receipt timeline, generated graph, or install-health views (`src/protocol/evidence-projections/*`, `src/http/handlers/evidence-read.ts`).
9. Terminal certificate mint signs receipt, durable refusal, proof gap, or replay-refusal evidence only (`src/protocol/areas/authority-certificate/*`).

### Runtime Ingress Flow

1. `RuntimeIngressDispatchBlockSchema` accepts wrapped, raw sibling, or ambiguous package-install/x402 dispatches (`src/runtime/ingress/index.ts`).
2. Ingress creates `RuntimeExecution` with loop/retry/branch/dynamic-tool flags (`src/runtime/ingress/index.ts`).
3. Ingress creates `GeneratedExecutionGraph` nodes classified as `candidate_action_eligible`, `bypass_risk`, or `ambiguous` (`src/runtime/ingress/index.ts`).
4. Ingress opens and finalizes a `ToolCallDraft` before compilation (`src/runtime/ingress/index.ts`, `test/protocol/representation-contract.test.ts`).
5. Clean dispatches produce contracts; raw sibling, ambiguous, dynamic, late-bound, or stale dispatches terminate as refusals or bypass-risk evidence (`src/protocol/areas/action-attempt-lifecycle/matrix.ts`, `test/product/agent-proof-slice.test.ts`).

### Evidence Read Flow

1. HTTP evidence routes are declared in `src/http/routes/evidence-read-route-registry.ts`.
2. Admission accepts only `review_custody` or `runtime_evidence` roles (`src/http/admission/index.ts`, `src/http/admission/caller-auth.ts`).
3. `handleEvidenceRead` loads only scoped records and calls projection helpers (`src/http/handlers/evidence-read.ts`).
4. Projection schemas redact raw parameters, secrets, raw internal records, event payloads, and mutation commands (`src/protocol/evidence-projections/schemas.ts`, `src/protocol/areas/protected-action-representation/schemas.ts`).
5. Generic raw record reads consult object-registry `rawReadPosture`; `internal_only` objects are hidden (`src/http/handlers/internal-record-read.ts`, `src/protocol/areas/object-registry/index.ts`).

### X402 Local Proof Profile

1. `compileX402InstallProposal` produces tool capability, action type, gateway registry entry, and operating envelope records when wallet signer custody and bounds pass (`src/adapters/x402-payment/install-proposal.ts`).
2. `proposeRuntimeIngressActionContracts` compiles wrapped x402 dispatch evidence into an `x402_payment.exact` action contract (`src/runtime/ingress/index.ts`, `src/adapters/x402-payment/action-proposal.ts`).
3. `runX402WalletGateway` calls `gatewayCheck`, signs payment only after verified gate, and reconciles payment evidence or proof gap (`src/adapters/x402-payment/wallet-gateway.ts`).
4. Hostile local bypass probes check signer custody, raw private key env, sibling wrapper, MCP direct payment, token passthrough, wrapper drift, and failure-closed posture (`src/adapters/x402-payment/bypass-probes.ts`, `src/adapters/x402-payment/conformance.ts`).
5. `test/product/agent-proof-slice.test.ts` proves the local chain: runtime ingress proposal, no runtime authority, policy greenlight, gateway signature, redacted transaction envelope, replay refusal, mismatch refusal, proof gap, package-install parity, and local certificate verification.

**State Management:**

- Durable state is `ProtocolRecord` plus `ContractStreamEvent` through `ProtocolStore` (`src/protocol/store/port.ts`).
- D1 stores records, greenlight consumptions, idempotency current entries, recovery terminal claims, protected-path posture pointers, isolation state pointers, operation claims, receipt-by-mutation indexes, and stream events (`migrations/0001_protocol_kernel.sql`).
- Memory store mirrors these indexes for tests and invariant oracles (`src/storage/memory/index.ts`).
- KV is cache posture only and cannot be authority (`src/storage/LANE.md`, `src/storage/kv/index.ts`).

## Key Abstractions

**ActionContract:**

- Purpose: Exact proposed commitment produced from a clean candidate.
- Examples: `src/protocol/areas/action-contract/schemas.ts`, `src/protocol/areas/action-contract/transitions.ts`.
- Pattern: Canonical digest binding over candidate, envelope, gateway, params, resource, sequence, idempotency, generated graph, and custody refs.

**PolicyDecision And Greenlight:**

- Purpose: Machine decision and optional one-use gateway-bound pass.
- Examples: `src/protocol/areas/policy-greenlight/schemas.ts`, `src/protocol/areas/policy-greenlight/policy-record/index.ts`.
- Pattern: Policy pins one contract, one envelope, one policy pack/version, isolation snapshot, posture, idempotency reservation, and `maxUses: 1`.

**GatewayCheckAttempt:**

- Purpose: Final pre-mutation verification and greenlight consumption boundary.
- Examples: `src/protocol/areas/gateway-gate/schemas.ts`, `src/protocol/areas/gateway-gate/transitions.ts`, `src/protocol/areas/gateway-gate/gateway-policy.ts`.
- Pattern: Compare observed params, contract digest, greenlight digest, idempotency key, posture, isolation, and gateway policy drift before mutation.

**Receipt, Refusal, ProofGap:**

- Purpose: Terminal or reconstructable evidence outcomes.
- Examples: `src/protocol/areas/receipt-export/*`, `src/protocol/areas/refusal/*`, `src/protocol/areas/proof-gap/*`.
- Pattern: Missing or denied authority is recorded explicitly instead of hidden in logs or exceptions.

**AuthorityCertificate:**

- Purpose: Terminal signed evidence for receipt, durable refusal, proof gap, or replay refusal.
- Examples: `src/protocol/areas/authority-certificate/schemas.ts`, `src/protocol/areas/authority-certificate/transitions.ts`, `src/protocol/areas/authority-certificate/verify.ts`.
- Pattern: Rebuild canonical `signingInput`, verify pinned trust material, reject production HMAC/propose-time contract signatures as portable trust, and operate without store dependency.

**ProtectedActionMetadata / Challenge / Request / EvidenceProjection:**

- Purpose: Tier 2 representation shapes for proposal guidance and reconstruction.
- Examples: `src/protocol/areas/protected-action-representation/schemas.ts`, `test/protocol/representation-contract.test.ts`.
- Pattern: Every shape carries `authorityCreated: false`, `greenlightRef: null`, `gatewayCheckRef: null`, and `mutationAttemptRef: null`.

**AgentTransactionEnvelopeProjection:**

- Purpose: Redacted transaction-shaped projection derived from existing records.
- Examples: `src/protocol/evidence-projections/projections.ts`, `src/protocol/evidence-projections/schemas.ts`, `src/http/routes/evidence-read-route-registry.ts`.
- Pattern: Reads contract, policy, greenlight, gate, mutation, receipt, proof gaps, refusals, ledger, recovery, and isolation refs without creating authority or export proof.

**ProtocolNavigation And ActionAttemptLifecycle:**

- Purpose: Source-owned transition metadata and derived lifecycle classifications.
- Examples: `src/protocol/navigation/index.ts`, `src/protocol/areas/action-attempt-lifecycle/matrix.ts`.
- Pattern: Navigation names phase, records written, authority boundary, and evidence obligation; lifecycle derives authority effect from transition outcomes without storing a lifecycle object.

## Entry Points

**Package Root:**

- Location: `src/index.ts`
- Triggers: TypeScript import from package root.
- Responsibilities: Export curated stable public schemas, inputs, HTTP app/client, navigation, certificate verify/signing helpers, gateway verification helper, and error types. It does not export `HandshakeKernel`, stores, recorders, or experimental gateway runners.

**Runtime Subpath:**

- Location: `src/runtime/index.ts`
- Triggers: Package subpath `./runtime`.
- Responsibilities: Export runtime ingress schemas and `proposeRuntimeIngressActionContracts()` for local x402 and package-install dispatch boundaries.

**Conformance Subpath:**

- Location: `src/conformance/index.ts`
- Triggers: Package subpath `./conformance`.
- Responsibilities: Export narrow conformance checks without root package authority claims.

**Experimental Subpath:**

- Location: `src/experimental.ts`
- Triggers: Package subpath `./experimental`.
- Responsibilities: Export reference gateway runners and parameter schemas with explicit experimental names.

**HTTP Worker:**

- Location: `src/worker.ts`
- Triggers: Cloudflare Worker fetch event.
- Responsibilities: Wire `createApp()` to Worker `fetch`.

**HTTP App:**

- Location: `src/http/app.ts`
- Triggers: `createApp()` from root export or Worker.
- Responsibilities: Mount health, OpenAPI, transition routes, evidence read routes, and raw record reads.

**SDK Client:**

- Location: `src/sdk/client.ts`
- Triggers: External or test callers using HTTP transitions.
- Responsibilities: Submit typed transition requests and read diagnostic projections with role tokens.

**D1 Store:**

- Location: `src/storage/d1/index.ts`
- Triggers: HTTP store resolution when D1 binding is present.
- Responsibilities: Persist protocol records and atomic indexes using D1 statements.

## Architectural Constraints

- **Runtime model:** TypeScript modules run in Bun tests and Cloudflare Worker/Hono contexts. `src/protocol/*` is runtime-agnostic except for Web Crypto use in certificate signing/verification.
- **Authority state:** `ProtocolStore` is the durable boundary for authority-bearing commits. `commitProtocolRecords()` and `commitGatewayCheck()` return explicit conflict outcomes (`src/protocol/store/port.ts`).
- **Global state:** `createApp()` creates an ephemeral `InMemoryProtocolStore` only when `allowEphemeralStore` or explicit store options allow it (`src/http/app.ts`). Memory store maps are instance state (`src/storage/memory/index.ts`).
- **Export curation:** Root package exports are guarded by `test/architecture/root-exports.test.ts`; reference gateway fixtures stay on `src/experimental.ts`.
- **Import direction:** Protocol modules must not import HTTP, SDK, runtime, adapter, or storage implementations. HTTP/SDK must avoid protocol area internals. Storage must avoid primitive behavior modules. These are enforced in `test/architecture/import-posture.test.ts`.
- **Raw read boundary:** Internal-only records remain hidden from generic raw HTTP record reads (`src/http/handlers/internal-record-read.ts`, `src/protocol/areas/object-registry/index.ts`).
- **Planning boundary:** `.planning/*` is scratch; canonical repo truth is `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, and `docs/internal/*`.
- **Circular imports:** No circular dependency chain is documented in canon. The guarded pattern is area public indexes plus local `types.ts` faces; preserve that pattern.

## Anti-Patterns

### Metadata As Permission

**What happens:** A caller treats `ProtectedActionMetadata`, catalog records, or tool availability as authorization.

**Why it's wrong:** Metadata and catalogs describe what can be proposed; they do not issue policy decisions, greenlights, gateway checks, receipts, or mutations.

**Do this instead:** Map metadata to `RuntimeExecution`, `ToolCallDraft`, `IntentCompilationRecord`, and `CandidateAction`, then use the normal kernel path in `src/protocol/kernel.ts`.

### Runtime Ingress As Gateway

**What happens:** Runtime wrappers or SDK helpers call mutation code or gateway-custody routes directly because they observed a clean-looking dispatch.

**Why it's wrong:** Runtime evidence is observer/compiler evidence. Gateway enforcement requires credential custody and exact greenlight verification.

**Do this instead:** Keep runtime helpers in `src/runtime/*` limited to proposal/refusal evidence. Run mutation only through `src/adapters/*/gateway.ts` after `verifiedGatewayCheckFromResult()`.

### Hosted Operation As Enforcement

**What happens:** Hosted admission, RBAC, policy screens, read models, or audit exports are described as gateway enforcement.

**Why it's wrong:** Hosted operation is evidence and policy management unless hosted Handshake also owns the mutation credential and performs the exact gateway check.

**Do this instead:** Put hosted admission seams in `src/http/admission/*` and Tier 3 product objects outside `src/protocol/areas/*`; keep gateway checks in `src/protocol/areas/gateway-gate/*`.

### X402 As Protocol Driver

**What happens:** `x402_payment.exact` becomes the mental center of the kernel or proof of live provider custody.

**Why it's wrong:** x402 is a local proof profile and regression path. The protocol is action-family neutral.

**Do this instead:** Keep x402 code in `src/adapters/x402-payment/*`, use it to test the generic chain in `test/product/agent-proof-slice.test.ts`, and preserve generic protocol objects in `src/protocol/areas/*`.

### Evidence Read As Export Trust Root

**What happens:** A redacted projection is treated as portable proof, downstream success, or receipt export.

**Why it's wrong:** Evidence reads are diagnostic. They redact internal records and do not sign terminal evidence.

**Do this instead:** Use `src/protocol/evidence-projections/*` for diagnostics and `src/protocol/areas/authority-certificate/*` for terminal signed evidence.

## Error Handling

**Strategy:** Protocol failures become typed `HandshakeProtocolError`,
durable `Refusal`, explicit `ProofGap`, replay refusal, isolation, or structured
transition error envelope depending on phase.

**Patterns:**

- Transition guards return `TransitionGuardResult`; kernel methods throw `HandshakeProtocolError` only at facade boundaries (`src/protocol/kernel.ts`, `src/protocol/foundation/transition-guards.ts`).
- HTTP wraps errors in `TransitionErrorResponseSchema` with retryability, commit state, request identity, proof refs, and refusal refs (`src/http/errors/transition-error-envelope.ts`).
- Caller custody failures fail before mutation and before authority state changes (`src/http/admission/caller-auth.ts`).
- Gateway mismatches become refusal/proof-gap/replay outcomes, not downstream mutation attempts (`src/protocol/areas/gateway-gate/*`).
- Storage conflicts are explicit return values from `ProtocolStore` commits (`src/protocol/store/port.ts`).

## Cross-Cutting Concerns

**Logging:** No logging framework is central to the architecture. Durable evidence is stored as `ProtocolRecord` and `ContractStreamEvent` through `src/protocol/events/*` and `src/protocol/store/port.ts`.

**Validation:** Zod strict schemas are used at protocol, HTTP, SDK, adapter, runtime, and representation boundaries (`src/protocol/public/schemas.ts`, `src/protocol/public/inputs.ts`, `src/http/routes/transition-route-registry.ts`).

**Authentication:** Local role custody uses bearer tokens for `control_plane`, `runtime_evidence`, `gateway_custody`, and `review_custody` (`src/http/admission/caller-auth.ts`). Hosted caller identity is a scoped seam, not hosted RBAC (`src/http/admission/hosted-caller-identity.ts`).

**Authorization:** Authority comes from exact contract, policy decision, one-use greenlight, current isolation/posture checks, and gateway verification. Tool access, identity, metadata, review, SDK, or hosted route access are not substitutes (`docs/internal/protocol-definition.md`).

**Redaction:** Diagnostic evidence projections omit raw parameters, secrets, event payloads, internal-only records, and mutation commands (`src/protocol/evidence-projections/schemas.ts`, `src/http/handlers/internal-record-read.ts`).

**Replay and idempotency:** Policy reserves idempotency scope before greenlight issuance, same-key/same-params returns prior evidence or refusal posture, same-key/different-params refuses, and consumed greenlights replay-refuse at the gateway (`src/protocol/areas/idempotency-ledger/*`, `src/protocol/areas/gateway-gate/replay-refusal/index.ts`).

---

*Architecture analysis: 2026-05-21*
