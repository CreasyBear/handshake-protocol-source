<!-- refreshed: 2026-05-25 -->
# Architecture

**Analysis Date:** 2026-05-25

## System Overview

```text
Product and integration surfaces
`src/cli`, `src/mcp`, `src/sdk`, `src/http`, `src/runtime`, `src/surfaces`
        |
        v
HTTP admission and route dispatch
`src/http/app.ts`, `src/http/admission/index.ts`,
`src/http/routes/transition-route-registry.ts`,
`src/http/routes/transition-invokers.ts`
        |
        v
Protocol authority kernel
`src/protocol/kernel.ts`, `src/protocol/areas/*`
        |
        v
Protocol store and reconstruction state
`src/protocol/store/port.ts`, `src/storage/*`, `migrations/0001_protocol_kernel.sql`
        |
        +--> Gateway adapters before mutation
        |    `src/adapters/x402-payment/wallet-gateway.ts`,
        |    `src/adapters/package-install/gateway.ts`
        |
        +--> Evidence projections and read models
             `src/protocol/evidence-projections/*`,
             `src/http/handlers/evidence-read.ts`
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Canonical repo doctrine | Defines current product kernel, authority invariants, and scratch-vs-canon boundaries. | `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/decisions.md`, `docs/internal/protocol-notes.md` |
| Protocol kernel facade | Coordinates protocol transitions and persists append-only state through the store port. | `src/protocol/kernel.ts` |
| Protocol areas | Own source-level schemas, transition inputs, transition outputs, and state-machine rules for each protected-action primitive. | `src/protocol/areas/*` |
| Policy greenlight area | Produces policy decisions and one-use greenlights without performing gateway checks or mutations. | `src/protocol/areas/policy-greenlight/transitions.ts`, `src/protocol/areas/policy-greenlight/policy-record/index.ts` |
| Gateway gate area | Verifies exact greenlight, contract, idempotency, isolation, path posture, credential binding, and drift before consequence. | `src/protocol/areas/gateway-gate/transitions.ts`, `src/protocol/areas/gateway-gate/artifacts.ts` |
| Runtime ingress | Compiles runtime/tool observations into candidate actions and contracts; it is proposal-only. | `src/runtime/ingress/index.ts`, `src/runtime/ingress/registry.ts` |
| HTTP transport | Enforces caller custody/read admission and dispatches route IDs to kernel transitions. | `src/http/app.ts`, `src/http/admission/index.ts`, `src/http/routes/transition-route-registry.ts`, `src/http/routes/transition-invokers.ts` |
| Gateway adapters | Hold mutation-side integration logic and only execute after a verified gateway check. | `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/package-install/gateway.ts` |
| Evidence projections | Build redacted review/readback models from stored protocol records. | `src/protocol/evidence-projections/projections.ts`, `src/protocol/evidence-projections/assembly.ts` |
| Storage adapters | Implement append-only events, current indexes, greenlight consumption, idempotency ledgers, and scoped reads. | `src/storage/memory/index.ts`, `src/storage/d1/index.ts`, `src/protocol/store/port.ts` |
| Architecture tests | Freeze import posture, package surfaces, surface authority boundaries, and public claims. | `test/architecture/*` |

## Pattern Overview

**Overall:** Source-owned protocol kernel with narrow transport/adapters, append-only receipts, and redacted projection read models.

**Key Characteristics:**
- Authority lives in protocol transitions and gateway checks, not in CLI, SDK, MCP, review UI, runtime ingress, public exports, or generated demos.
- Policy greenlights are exact, one-use, gateway-bound records; they are not execution proof and do not perform mutation.
- Gateway adapters hold the final mutation boundary and must obtain `VerifiedGatewayCheck` evidence before calling an external surface.
- Evidence read models are projections assembled from protocol records; they support review and recovery but do not create authority.
- `.planning/` is scratch; tracked source, root docs, and `docs/internal/*` are the current repo truth.

## Layers

**Canonical Doctrine:**
- Purpose: Define the current product boundary and the vocabulary future work must obey.
- Location: `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/decisions.md`, `docs/internal/protocol-notes.md`
- Contains: Product kernel, decisions, quality rules, source ownership rules, protocol notes.
- Depends on: No source implementation.
- Used by: Planning, implementation, architecture tests, package-surface claims.

**Surface and Client Layer:**
- Purpose: Expose Handshake through CLI, MCP, SDK role clients, demos, and public package exports without becoming authority.
- Location: `src/cli`, `src/mcp`, `src/sdk`, `src/surfaces`, `src/index.ts`, `src/experimental.ts`
- Contains: Command manifests, MCP server glue, role clients, renderable surfaces, curated package exports, experimental reference fixtures.
- Depends on: Public protocol/surface contracts and HTTP clients.
- Used by: Consumers, examples, package exports, conformance demos.

**Runtime Proposal Layer:**
- Purpose: Convert runtime/tool observations into intent compilation records and proposed action contracts.
- Location: `src/runtime/ingress/index.ts`, `src/runtime/ingress/families.ts`, `src/runtime/ingress/registry.ts`
- Contains: Proposal-only family registry for `package.install`, `x402_payment.exact`, and `auth.md.protected_api_call`; generated graph and tool-call draft recording.
- Depends on: Protocol kernel transitions that create proposal records.
- Used by: HTTP transition route `runtimeIngress.proposeActionContracts` and demos.

**Admission and Transport Layer:**
- Purpose: Admit or reject HTTP callers by custody role, entitlement, route metadata, tenant/org scope, and hosted scope posture.
- Location: `src/http/app.ts`, `src/http/admission/index.ts`, `src/http/routes/*`, `src/http/handlers/*`
- Contains: Hono app, transition route registry, transition invokers, evidence read routes, record-read handlers, readiness/verifier handlers.
- Depends on: `src/protocol/kernel.ts`, `src/storage/*`, request headers, route metadata.
- Used by: Cloudflare Worker entry point `src/worker.ts`, SDK/CLI/MCP clients, hosted or local HTTP deployments.

**Protocol Authority Kernel:**
- Purpose: Own the state machine that turns exact contracts into policy decisions, one-use greenlights, gateway checks, receipts, refusals, proof gaps, isolation, and certificates.
- Location: `src/protocol/kernel.ts`, `src/protocol/areas/*`
- Contains: Source-owned schemas, transition inputs, transition outputs, digest/canonicalization helpers, status transitions, receipts, isolation records.
- Depends on: Protocol store port and protocol-local utilities.
- Used by: HTTP transport, tests, adapters, projection assembly.

**Gateway Adapter Layer:**
- Purpose: Bridge verified gateway checks to real mutation surfaces.
- Location: `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/package-install/gateway.ts`
- Contains: Adapter-specific gateway execution, credential resolution evidence, official signer custody for x402, package-install surface invocation.
- Depends on: `src/protocol/areas/gateway-gate/artifacts.ts`, kernel gateway-check transitions, adapter-specific mutation APIs.
- Used by: External integration examples and runtime-gateway flows.

**Persistence Layer:**
- Purpose: Persist append-only events and current-state indexes required for reconstruction and replay protection.
- Location: `src/protocol/store/port.ts`, `src/storage/memory/index.ts`, `src/storage/d1/index.ts`, `src/storage/kv`, `migrations/0001_protocol_kernel.sql`
- Contains: Store interface, in-memory implementation, D1 implementation, Cloudflare KV helpers, SQL tables for current ledgers and stream events.
- Depends on: Protocol record types.
- Used by: Kernel, HTTP app, projections, tests.

**Projection and Read Model Layer:**
- Purpose: Build scoped, redacted evidence views for review, recovery, and diagnostics.
- Location: `src/protocol/evidence-projections/projections.ts`, `src/protocol/evidence-projections/assembly.ts`, `src/http/routes/evidence-read-route-registry.ts`, `src/http/handlers/evidence-read.ts`, `src/http/handlers/internal-record-read.ts`
- Contains: Contract evidence projection, transaction envelope projection, timeline projection, read-route role/scope metadata, raw record guardrails.
- Depends on: Store reads and protocol record types.
- Used by: Review custody and runtime evidence read endpoints.

## Authority Boundary

**Authority lives here:**
- `src/protocol/areas/policy-greenlight/transitions.ts` evaluates policy and records policy decisions while explicitly keeping gateway checks and mutation attempts false.
- `src/protocol/areas/policy-greenlight/policy-record/index.ts` creates `Greenlight` records bound to contract digest, policy pack, gateway, idempotency key, and `maxUses: 1`.
- `src/protocol/areas/gateway-gate/transitions.ts` verifies the exact greenlight, observed request digest, isolation state, protected path posture, delegated authority binding, gateway credential binding, sequence dependencies, idempotency ledger, and gateway policy drift before committing a gateway plan.
- `src/protocol/areas/gateway-gate/artifacts.ts` exposes `verifiedGatewayCheckFromResult` only when the gateway check passes and a mutation attempt/surface operation reference exists.
- `src/adapters/x402-payment/wallet-gateway.ts` signs x402 payloads only after deriving verified gateway evidence from the kernel.
- `src/adapters/package-install/gateway.ts` calls the package-install mutation surface only after verified gateway evidence exists.
- `src/storage/memory/index.ts`, `src/storage/d1/index.ts`, and `migrations/0001_protocol_kernel.sql` enforce replay-sensitive current indexes such as greenlight consumption, idempotency ledger, isolation current state, protected path operation claims, and receipt lookup.

**Authority does not live here:**
- `src/runtime/ingress/index.ts` records proposed contracts and sets non-authority posture; it does not issue greenlights, gateway checks, or mutation proof.
- `src/http/admission/index.ts` admits callers to routes and evidence reads; admission is custody/read entitlement, not permission to mutate.
- `src/protocol/evidence-projections/*` builds read models; projections never write greenlights or gateway checks.
- `src/cli`, `src/mcp`, `src/sdk`, `src/surfaces`, and `examples/*` expose product surfaces and demos; they must not become hidden policy or gateway authority.
- `src/index.ts` curates public exports and intentionally excludes the kernel class, stores, internal recorder, and reference gateway runners from the root package surface.

## Passport, Admission, Service Gateway, Principal-Agent Link

**Current source-owned shapes:**
- Passport-like identity is represented as evidence binding, not authority: `ParticipantIdentityBinding` in `src/protocol/areas/catalog-envelope/schemas.ts` and `OperatingEnvelope.participantIdentityBindings` in `src/protocol/areas/catalog-envelope/schemas.ts`.
- The principal-agent link is already explicit on `OperatingEnvelope` in `src/protocol/areas/catalog-envelope/schemas.ts`, copied onto `ActionContract` in `src/protocol/areas/action-contract/schemas.ts`, and bound through `DelegatedAuthorityRef` in `src/protocol/areas/delegated-authority/schemas.ts`.
- Admission is HTTP route custody and read entitlement in `src/http/admission/index.ts`, using metadata from `src/http/routes/transition-route-registry.ts` and `src/http/routes/evidence-read-route-registry.ts`.
- Service gateway concepts map to `GatewayRegistryEntry` in `src/protocol/areas/catalog-envelope/schemas.ts`, `GatewayCredentialRef` and custody proof packets in `src/protocol/areas/credential-custody/schemas.ts`, and gateway checks in `src/protocol/areas/gateway-gate/*`.

**Simplification rule:**
- Do not add a separate `Passport` protocol primitive unless it narrows exact gateway enforcement. Treat passport as a projection/readback name over `ParticipantIdentityBinding`, `OperatingEnvelope`, `ActionContract`, and `DelegatedAuthorityRef`.
- Do not make admission a source of protected-action authority. Keep admission as caller custody and route entitlement, then let policy greenlight and gateway check decide consequence.
- Do not introduce a new service-gateway layer beside the existing gateway registry, credential custody, and gateway gate. Rename or project if needed, but keep the mutation boundary in `src/protocol/areas/gateway-gate/*` and adapter gateway files.
- Keep the principal-agent link as canonical source data on envelope, contract, and delegated authority references; avoid duplicating it into a reusable auth token.

## Data Flow

### Primary Protected-Action Path

1. Caller reaches the Worker/Hono app (`src/worker.ts`, `src/http/app.ts`).
2. HTTP route metadata selects custody requirements and the kernel invoker (`src/http/routes/transition-route-registry.ts`, `src/http/routes/transition-invokers.ts`).
3. Admission checks caller role, route family, hosted scope, tenant/org scope, and evidence-read posture (`src/http/admission/index.ts`).
4. Runtime ingress or explicit transition creates intent compilation, contract, catalog envelope, authority reference, credential posture, and related records (`src/runtime/ingress/index.ts`, `src/protocol/kernel.ts`).
5. Policy evaluation records decision and, when allowed, a one-use greenlight bound to the exact contract and gateway (`src/protocol/areas/policy-greenlight/transitions.ts`, `src/protocol/areas/policy-greenlight/policy-record/index.ts`).
6. Gateway check revalidates current state, exact request digest, idempotency, isolation, delegated authority, credential custody, protected path posture, sequencing, and policy drift (`src/protocol/areas/gateway-gate/transitions.ts`).
7. Adapter performs external mutation only after verified gateway evidence exists (`src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/package-install/gateway.ts`).
8. Receipt, refusal, proof gap, reconciliation, recovery, isolation, or certificate records are appended to the store (`src/protocol/kernel.ts`, `src/protocol/store/port.ts`, `src/storage/*`).

### Evidence Read Path

1. Caller requests a read route declared in `src/http/routes/evidence-read-route-registry.ts`.
2. Admission validates role, read scope, tenant/org scope, and artifact posture (`src/http/admission/index.ts`).
3. Handler loads only needed protocol records from the store (`src/http/handlers/evidence-read.ts`, `src/http/handlers/internal-record-read.ts`).
4. Projection code redacts and assembles review/readback views (`src/protocol/evidence-projections/projections.ts`, `src/protocol/evidence-projections/assembly.ts`).
5. HTTP response returns evidence projection, not raw authority or mutation permission (`src/http/handlers/evidence-read.ts`).

### Runtime Ingress Proposal Path

1. Runtime ingress receives tool/action observations and declared runtime posture (`src/runtime/ingress/index.ts`).
2. Registry selects a proposal-only action family (`src/runtime/ingress/registry.ts`, `src/runtime/ingress/families.ts`).
3. Kernel records runtime execution, generated action graph, tool-call draft, intent compilation, and action contract (`src/runtime/ingress/index.ts`, `src/protocol/kernel.ts`).
4. Response declares candidate actions and explicitly marks policy, greenlight, gateway check, mutation, receipt, certificate, and permission as false (`src/runtime/ingress/index.ts`).

**State Management:**
- State is append-only plus current-index ledgers. `migrations/0001_protocol_kernel.sql` defines durable D1 tables for stream events, greenlight consumption, idempotency current state, isolation current state, protected path operation claims, and receipt lookup. `src/storage/memory/index.ts` mirrors those semantics for tests and local runs.

## Key Abstractions

**Operating Envelope:**
- Purpose: Bounds attempts, runtime context, participant bindings, catalog references, gateway registry references, and evidence expectations.
- Examples: `src/protocol/areas/catalog-envelope/schemas.ts`, `src/protocol/areas/action-contract/contract-record.ts`
- Pattern: Source data copied into exact contracts; it authorizes attempts, not mutations.

**Action Contract:**
- Purpose: Exact proposed commitment derived from intent compilation and bound to principal, agent, tenant, organization, gateway, idempotency, protected path, payload, and evidence expectations.
- Examples: `src/protocol/areas/action-contract/schemas.ts`, `src/protocol/areas/action-contract/transitions.ts`, `src/protocol/areas/action-contract/contract-record.ts`
- Pattern: Deterministic contract record before policy and gateway.

**Policy Decision and Greenlight:**
- Purpose: Machine-checkable decision and one-use authorization candidate for a gateway check.
- Examples: `src/protocol/areas/policy-greenlight/transitions.ts`, `src/protocol/areas/policy-greenlight/policy-record/index.ts`
- Pattern: Policy can allow/refuse/review/halt/quarantine; greenlight is exact and consumed once.

**Gateway Check:**
- Purpose: Final enforcement proof before mutation.
- Examples: `src/protocol/areas/gateway-gate/transitions.ts`, `src/protocol/areas/gateway-gate/artifacts.ts`
- Pattern: Revalidate exact binding and current posture, then produce verified gateway evidence or refusal/proof gap.

**Delegated Authority Reference:**
- Purpose: Binds principal, agent, runtime, envelope, gateway, allowed actions, resource bounds, and spend/amount limits without creating mutation authority or secret material.
- Examples: `src/protocol/areas/delegated-authority/schemas.ts`, `src/protocol/areas/delegated-authority/transitions.ts`
- Pattern: Reference and status evidence, checked later by gateway transitions.

**Credential Custody:**
- Purpose: Records gateway-held credential posture and proof packets while keeping secret material outside protocol records.
- Examples: `src/protocol/areas/credential-custody/schemas.ts`, `src/protocol/areas/credential-custody/transitions.ts`
- Pattern: Evidence of custody and resolution; adapters hold signing/mutation capability.

**Evidence Projection:**
- Purpose: Read model for review/recovery that omits raw secrets and authority-bearing material.
- Examples: `src/protocol/evidence-projections/projections.ts`, `src/protocol/evidence-projections/assembly.ts`
- Pattern: Redacted projection assembled from stored protocol records.

## Entry Points

**Worker HTTP Entry:**
- Location: `src/worker.ts`
- Triggers: Cloudflare Worker fetch events.
- Responsibilities: Instantiate `createApp()` and delegate HTTP handling.

**HTTP App Factory:**
- Location: `src/http/app.ts`
- Triggers: Worker, tests, local server runners.
- Responsibilities: Bind store environment, register transition/read routes, run admission, call invokers, format JSON responses.

**Protocol Kernel:**
- Location: `src/protocol/kernel.ts`
- Triggers: HTTP transition invokers, tests, adapter flows.
- Responsibilities: Execute protocol transitions and write protocol records through `ProtocolStore`.

**Public Package Root:**
- Location: `src/index.ts`
- Triggers: Package consumers importing `handshake-protocol-kernel`.
- Responsibilities: Export public contract types, role clients, surfaces, and non-internal helpers while excluding kernel/store internals.

**Experimental Surface:**
- Location: `src/experimental.ts`
- Triggers: Explicit `./experimental` imports.
- Responsibilities: Export reference fixtures and helpers with experimental naming.

**Adapter Gateways:**
- Location: `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/package-install/gateway.ts`
- Triggers: Adapter-specific protected action execution.
- Responsibilities: Run gateway checks and perform external mutation only after verified gateway evidence.

## Architectural Constraints

- **Threading:** TypeScript runs on a single JavaScript event loop in local and Worker-style environments. Concurrency safety is modeled through store-level conflict detection, greenlight consumption, and idempotency ledgers, not threads.
- **Global state:** Runtime ingress action families are registered in module-level maps in `src/runtime/ingress/families.ts` and `src/runtime/ingress/registry.ts`; architecture tests keep them proposal-only.
- **Circular imports:** Architecture tests require protocol areas and the kernel to import area packages through lane-owned public indexes instead of deep sibling internals (`test/architecture/import-posture.test.ts`).
- **Protocol/storage separation:** `src/protocol/areas/*` must not import `src/storage/*`; persistence flows through `src/protocol/store/port.ts`.
- **Transport/protocol separation:** HTTP route metadata, invokers, and response schemas stay in separate files under `src/http/routes`.
- **Projection/authority separation:** Observer and projection files are blocked from importing policy greenlight, gateway gate, delegated authority, credential custody, receipt, isolation, or certificate authority internals.
- **Official signer custody:** The official x402 signer factory remains in `src/adapters/x402-payment/wallet-gateway.ts`; tests block it from SDK, CLI, MCP, root exports, runtime ingress, and generated outputs.

## Anti-Patterns

### Admission As Authority

**What happens:** HTTP admission allows a route call and the caller treats that as permission to mutate.
**Why it's wrong:** Admission only proves caller custody/read entitlement; it does not bind an exact action contract, one-use greenlight, gateway check, or mutation attempt.
**Do this instead:** Admit the caller in `src/http/admission/index.ts`, then require policy greenlight and gateway verification through `src/protocol/areas/policy-greenlight/*` and `src/protocol/areas/gateway-gate/*`.

### Projection As Proof

**What happens:** A review/readback projection is treated as raw evidence or execution proof.
**Why it's wrong:** Projection code intentionally redacts fields such as contract parameters, secret refs, and contract signatures; it is a read model.
**Do this instead:** Use `src/protocol/evidence-projections/*` for review/readback, then trace raw records through scoped store reads and protocol receipts where the caller has authority.

### Runtime Ingress As Permission

**What happens:** Candidate actions produced by runtime ingress are treated as executable authority.
**Why it's wrong:** Runtime ingress is proposal-only and explicitly reports no policy decision, greenlight, gateway check, mutation attempt, receipt, certificate, or permission.
**Do this instead:** Continue through policy and gateway routes after candidate contract creation (`src/runtime/ingress/index.ts`, `src/protocol/areas/policy-greenlight/*`, `src/protocol/areas/gateway-gate/*`).

### New Passport Primitive

**What happens:** Passport/admission/service gateway/principal-agent link becomes a parallel protocol object beside existing envelope, contract, delegated authority, credential custody, and gateway registry records.
**Why it's wrong:** It duplicates authority-adjacent state and creates room for reusable ambient permission.
**Do this instead:** Project a passport read model from `ParticipantIdentityBinding`, `OperatingEnvelope`, `ActionContract`, `DelegatedAuthorityRef`, and credential/gateway evidence without adding a new authority-bearing record.

## Error Handling

**Strategy:** Protocol transitions return structured decisions, refusals, proof gaps, conflict statuses, and evidence records instead of throwing across authority boundaries.

**Patterns:**
- Gateway checks return passed/refused/proof-gap outcomes with specific failure posture in `src/protocol/areas/gateway-gate/transitions.ts`.
- Store writes detect greenlight consumption, idempotency conflicts, protected-path conflicts, receipt conflicts, and isolation-current conflicts in `src/storage/memory/index.ts` and `src/storage/d1/index.ts`.
- HTTP handlers catch typed transition outcomes and return JSON with route identity headers in `src/http/app.ts`.
- Missing evidence is recorded as proof gap or diagnostic posture rather than converted into success in `src/protocol/areas/*`.

## Cross-Cutting Concerns

**Logging:** Runtime and protocol evidence is structured as records in the store, not free-form logs. Console output is limited to examples and scripts such as `examples/*/run.mjs` and `scripts/*`.
**Validation:** Source-owned schema validation lives beside each protocol area in files such as `src/protocol/areas/action-contract/schemas.ts`, `src/protocol/areas/catalog-envelope/schemas.ts`, and `src/protocol/areas/credential-custody/schemas.ts`.
**Authentication:** HTTP admission validates caller role, route family, hosted verifier entitlement, and scope in `src/http/admission/index.ts`; protected-action authority still requires policy and gateway records.
**Receipts:** Receipts, reconciliation, certificates, recovery, and proof gaps are protocol records assembled into projections by `src/protocol/evidence-projections/assembly.ts`.
**Package Boundaries:** `package.json`, `src/index.ts`, `src/experimental.ts`, and `test/architecture/package-surface.test.ts` keep internal authority surfaces out of public root exports.

---

*Architecture analysis: 2026-05-25*
