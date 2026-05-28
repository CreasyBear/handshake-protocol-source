<!-- refreshed: 2026-05-28 -->
# Architecture

**Analysis Date:** 2026-05-28

## System Overview

Handshake is a TypeScript protocol kernel for protected action infrastructure. The kernel records exact action contracts, policy decisions, one-use greenlights, gateway checks, receipts, refusals, proof gaps, and optional terminal certificates. Product surfaces (CLI, MCP, SDK, surfaces) propose and read evidence; they do not create authority. Reference gateway adapters in `src/adapters/` perform protected-surface mutation only after a verified `gatewayCheck` transition.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Product surfaces (no authority)                          │
├──────────────┬──────────────┬──────────────┬──────────────┬───────────────┤
│  `src/cli/`  │ `src/mcp/`   │ `src/sdk/`   │`src/surfaces/│`src/x402-     │
│  evidence,   │ stdio tools, │ Handshake    │ readbacks,   │protected-tool/│
│  doctor,     │ resources,   │ Client +     │ proof        │ facade,       │
│  x402 cmds   │ x402 propose │ role clients │ packets      │ readiness     │
└──────┬───────┴──────┬───────┴──────┬───────┴──────┬───────┴───────┬───────┘
       │              │              │              │               │
       │  HTTP/SDK    │  HTTP/SDK    │  POST /v0.2  │  store read   │  runtime
       │  or local    │  or ref      │  transitions │  projections  │  ingress
       ▼              ▼              ▼              ▼               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              Transport & admission (`src/http/`, `src/hosted-admission/`)    │
│  `app.ts` → admission → `transition-invokers` → `HandshakeKernel`            │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
       ┌─────────────────────────────┼─────────────────────────────┐
       ▼                             ▼                             ▼
┌──────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│ `src/runtime/`   │    │ `src/protocol/`       │    │ `src/adapters/`       │
│ ingress,         │───▶│ kernel + areas        │◀───│ x402 wallet gateway,  │
│ proposals,       │    │ (state transitions)   │    │ package-install, etc. │
│ generated graphs │    │                       │    │ mutate AFTER gate     │
└──────────────────┘    └──────────┬───────────┘    └──────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────────────┐
                    │ `src/storage/` — `ProtocolStore` port   │
                    │ `memory/`, `d1/`, `kv/` + `migrations/` │
                    └──────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| HandshakeKernel | Facade over all protocol transitions; no transport | `src/protocol/kernel.ts` |
| Protocol areas | Owned primitives: contract, policy, gateway gate, negotiation, etc. | `src/protocol/areas/*` |
| ProtocolRecorder | Append-only events + atomic record commits | `src/protocol/events/records.ts` |
| ProtocolStore | Durable records, stream tail, greenlight consumption, gate commits | `src/protocol/store/port.ts` |
| HTTP app | Hono routes, admission, transition dispatch, evidence reads | `src/http/app.ts` |
| Transition invokers | Map route IDs to kernel methods (+ runtime ingress bridge) | `src/http/routes/transition-invokers.ts` |
| Runtime ingress | Compile dispatch blocks into candidates/contracts (observer lane) | `src/runtime/ingress/index.ts` |
| HandshakeClient | Typed HTTP transition + evidence calls | `src/sdk/client.ts` |
| Role surface clients | Custody-scoped clients (policy, gateway, evidence, etc.) | `src/sdk/surface-clients/` |
| Reference adapters | Gateway fixtures; enforcement before mutation | `src/adapters/x402-payment/`, etc. |
| MCP stdio server | Proposal tool + redacted evidence resources | `src/mcp/stdio/server.ts` |
| CLI runner | Command manifest, projections, x402 install/doctor | `src/cli/main.ts` |
| Surfaces | Boundary manifest, proof packets, A2A readback | `src/surfaces/boundary-manifest.ts` |
| Worker entry | Cloudflare `fetch` → `createApp()` | `src/worker.ts` |
| Package exports | Curated public API | `src/index.ts` |

## Pattern Overview

**Overall:** Layered authority boundary with a single kernel facade and append-only evidence store.

**Key characteristics:**
- Every consequential path reduces to an exact `ActionContract`, then policy, then one-use greenlight, then `gatewayCheck` before mutation.
- Runtime and MCP/CLI are proposal and readback lanes; they never substitute for gateway enforcement.
- HTTP admission binds caller custody role per transition; hosted routes add scope checks via `src/http/admission/hosted-caller-identity.ts`.
- Gateway adapters are the only place that should touch payment/signing/install mutation credentials after a passed gate.

## Layers

**Protocol kernel (`src/protocol/`):**
- Purpose: Source-owned state machine, schemas, canonicalization, transition guards.
- Location: `src/protocol/`
- Contains: `kernel.ts`, `areas/*`, `foundation/*`, `events/*`, `public/*`, `evidence-projections/*`, `navigation/*`, `store/port.ts`
- Depends on: Nothing outside protocol (per `src/protocol/LANE.md`)
- Used by: HTTP invokers, SDK, storage implementations, tests

**HTTP transport (`src/http/`):**
- Purpose: Worker/Hono app, OpenAPI, transition routes, evidence read routes, verifier projections.
- Location: `src/http/`
- Contains: `app.ts`, `routes/`, `handlers/`, `admission/`, `errors/`
- Depends on: Protocol kernel, storage resolution, hosted-admission helpers
- Used by: `src/worker.ts`, integration tests, SDK default transport

**Runtime observer (`src/runtime/`):**
- Purpose: Generated-execution evidence, ingress dispatch parsing, family-specific action proposals.
- Location: `src/runtime/ingress/`, `src/runtime/x402-payment/`, etc.
- Depends on: Protocol types, adapter proposal configs
- Used by: `transitionInvokers.proposeRuntimeIngressActionContracts`, CLI/MCP bridges

**Reference adapters (`src/adapters/`):**
- Purpose: Gateway registry fixtures, wallet gateway, protected-tool facade wiring, bypass probes.
- Location: `src/adapters/x402-payment/`, `src/adapters/package-install/`, etc.
- Depends on: Protocol records, runtime ingress shapes; must not own protocol meaning
- Used by: Integration tests, `src/x402-protected-tool/`, experimental exports

**Product surfaces (`src/cli/`, `src/mcp/`, `src/sdk/`, `src/surfaces/`):**
- Purpose: Ergonomic proposal, evidence projection, conformance status, readbacks.
- Depends on: HTTP/SDK or in-process test clients
- Must not: Evaluate policy, issue greenlights, perform gateway checks, or mutate protected surfaces directly

**Storage (`src/storage/`):**
- Purpose: `ProtocolStore` implementations (memory for tests, D1 for Worker, KV plumbing).
- Location: `src/storage/memory/`, `src/storage/d1/`, `src/storage/kv/`
- Schema: `migrations/` (canonical D1)

## Data Flow

### Primary protected-action chain (kernel)

Applies to all action classes including `x402_payment.exact`:

1. **Catalog / install setup** — `putCatalogObject`, `registerInstallProposalCompiledRecords` (`src/http/routes/transition-invokers.ts` → `src/protocol/kernel.ts`)
2. **Runtime evidence** — `createRuntimeExecution`, optional `createGeneratedExecutionGraph`, `createToolCallDraft` (`src/protocol/areas/runtime-evidence/`, `generated-execution-graph/`, `tool-call-draft/`)
3. **Intent → contract** — `compileIntent` then `proposeActionContract` (`src/protocol/areas/intent-compilation/`, `action-contract/`)
4. **Credential custody evidence** — `registerGatewayCredentialRef`, `recordGatewayCustodyProofPacket`, `recordCredentialResolutionEvidence` (`src/protocol/areas/credential-custody/`) — records only, no secrets
5. **Policy** — `evaluatePolicy` issues greenlight, refusal, review, halt, or quarantine (`src/protocol/areas/policy-greenlight/transitions.ts`)
6. **Gateway check (enforcement boundary)** — `gatewayCheck` (`src/protocol/areas/gateway-gate/transitions.ts`)
7. **Downstream observation** — `reconcileSurfaceOperation`, receipts, proof gaps, optional `createAuthorityCertificate` (`src/protocol/areas/operation-lifecycle/`, `authority-certificate/`)

**State management:** All authority-bearing state lives in `ProtocolStore` via `ProtocolRecorder` commits. `ActionAttemptLifecycle` is derived evidence in `src/protocol/areas/action-attempt-lifecycle/`, not a separate authority object. Idempotency is enforced in `src/protocol/areas/idempotency-ledger/` before greenlight consumption.

### x402 protected action path (first wedge)

End-to-end local/reference flow (integration anchor: `test/integration/x402-d1-http.test.ts`):

```text
Agent runtime / codemode dispatch
        │
        ▼
Runtime ingress block (x402 family)
  `src/runtime/ingress/` + `src/adapters/x402-payment/action-proposal.ts`
        │
        ▼
HTTP POST proposeRuntimeIngressActionContracts  OR  kernel.proposeActionContract
  `src/http/routes/transition-invokers.ts`
        │
        ▼
evaluatePolicy  →  one-use Greenlight (bound to exact contract digest)
  `src/protocol/areas/policy-greenlight/`
        │
        ▼
╔═══════════════════════════════════════════════════════════════════╗
║  GATEWAY CHECK BOUNDARY — `kernel.gatewayCheck()`                  ║
║  `src/protocol/areas/gateway-gate/transitions.ts`                  ║
║  Verifies: greenlight binding, params digest, isolation,           ║
║  protected-path posture, credential refs, idempotency, drift       ║
║  Records: gate attempt, receipt, refusal, replay refusal, proof gap ║
║  Does NOT: sign payments or call protected HTTP APIs               ║
╚═══════════════════════════════════════════════════════════════════╝
        │
        ▼
Reference wallet gateway / adapter fixture
  `src/adapters/x402-payment/`, `src/adapters/x402-wallet-gateway/`
  Mutation + signer use ONLY after gateDecision === passed
        │
        ▼
recordCredentialResolutionEvidence (post-gate use evidence)
reconcileSurfaceOperation (downstream finality, no retry authority)
```

**MCP proposal path:** `src/mcp/x402-proposal.ts` → runtime client → same transition chain; tool name `handshake.actions.x402_payment.propose` (`src/mcp/catalog.ts`). MCP exposes redacted `handshake://evidence/*` resources (`src/mcp/resources.ts`), not raw records.

**Protected-tool facade path:** `src/x402-protected-tool/index.ts` re-exports `prepareProtectedX402ToolDispatch` from `src/adapters/x402-payment/protected-tool-facade/` — packages readiness snapshots and dispatch preparation for host activation profiles (`src/adapters/x402-payment/protected-tool-profile/*`).

**CLI path:** `src/cli/x402/*`, `src/cli/demo/x402.ts`, `src/cli/simulate/x402-payment.ts` drive install, probes, and evidence views via `src/cli/main.ts`; they render APS/evidence, not gateway custody.

### HTTP request path

1. Request hits `createApp()` route (`src/http/app.ts`)
2. `authorizeTransitionAdmission` — role token + optional hosted identity (`src/http/admission/`)
3. Body parsed against route `requestSchema` (`src/http/routes/transition-route-registry.ts`)
4. `kernelFor` constructs `HandshakeKernel` with store + request context (`src/http/store/resolution.ts`)
5. `transitionInvokers[routeId](kernel, body)` executes transition
6. JSON 201 or structured `TransitionErrorEnvelope` (`src/http/errors/transition-error-envelope.ts`)

Evidence reads use GET handlers in `src/http/handlers/evidence-read.ts` and `src/http/routes/evidence-read-route-registry.ts` — read-only projections from `src/protocol/evidence-projections/`.

### SDK client path

`HandshakeClient` in `src/sdk/client.ts` posts to `/v0.2/*` transition paths with caller role headers from `src/http/admission/caller-auth.ts`. Specialized clients in `src/sdk/surface-clients/` (e.g. policy, gateway) wrap the same transport under explicit custody roles per `src/surfaces/boundary-manifest.ts`.

## Gateway check boundary

**Where authority ends and enforcement begins:** `HandshakeKernel.gatewayCheck()` → `src/protocol/areas/gateway-gate/transitions.ts`.

**Inside the boundary (kernel records):**
- Exact greenlight-to-contract binding and one-time consumption (`GreenlightConsumption` via store commit)
- Observed params digest vs contract (`protectedActionParamsDigest` in `src/protocol/foundation/canonical.ts`)
- Isolation state, protected-path posture, delegated authority, gateway credential ref bindings
- Gate attempt, receipt, mutation attempt index, replay refusal (`src/protocol/areas/gateway-gate/replay-refusal/`)

**Outside the boundary (adapters only, after pass):**
- Wallet signing, x402 challenge/response HTTP, package manager exec, repo writes
- Implementations live under `src/adapters/*`; conformance probes in `src/conformance/`

**Anti-advisory rule:** Calling `evaluatePolicy` or holding a greenlight does not authorize mutation. Skipping `gatewayCheck` or reusing a greenlight is ambient authority, not Handshake.

## Key Abstractions

**ActionContract:**
- Purpose: Exact proposed commitment for one protected mutation attempt
- Examples: `src/protocol/areas/action-contract/`
- Pattern: Canonical digest binding; proposed via `proposeActionContract`

**Greenlight / PolicyDecision:**
- Purpose: Machine-checkable policy outcome bound to one contract
- Examples: `src/protocol/areas/policy-greenlight/`
- Pattern: One-use; consumed at gateway check

**GatewayCheckResult:**
- Purpose: Gate attempt + receipt (+ optional mutation attempt record)
- Examples: `src/protocol/areas/gateway-gate/artifacts.ts`
- Pattern: `verifiedGatewayCheckFromResult` exported from `src/index.ts` for clients

**ProtocolRecord / object registry:**
- Purpose: Typed persisted objects with stable IDs and digests
- Examples: `src/protocol/areas/object-registry/schemas.ts`

**Evidence projections:**
- Purpose: Redacted read models for CLI/MCP/HTTP evidence routes
- Examples: `src/protocol/evidence-projections/projections.ts`

**Surface boundary manifest:**
- Purpose: Maps product surfaces to allowed route families and custody roles
- Examples: `src/surfaces/boundary-manifest.ts`

## Entry Points

**npm package root:**
- Location: `src/index.ts`
- Triggers: `import from "handshake-protocol-kernel"`
- Responsibilities: Curated exports (HTTP app factory, SDK client, protocol schemas, verifier helpers)

**CLI:**
- Location: `bin/handshake` → `src/cli/main.ts` via `src/cli/index.ts`
- Triggers: `handshake <group> <subcommand>`
- Responsibilities: Operator/evidence commands; no kernel mutation authority

**MCP stdio:**
- Location: `bin/handshake-mcp` → `src/mcp/stdio/server.ts`
- Triggers: MCP host launches stdio server
- Responsibilities: x402 proposal tool + static evidence resources

**Cloudflare Worker:**
- Location: `src/worker.ts` → `src/http/app.ts`
- Triggers: Worker `fetch`
- Responsibilities: Hosted/local HTTP API with D1 bindings via `wrangler.toml`

**Subpath exports:**
- `./runtime`, `./sdk/role-clients`, `./mcp`, `./cli`, `./x402-protected-tool`, `./surfaces/*`, `./hosted-admission`, `./adapter-sdk`, `./conformance` — see `package.json` `exports`

## Architectural Constraints

- **Threading:** Node ≥20 ESM; Worker is single-request isolate. No shared mutable kernel state across requests — store is per-binding/per-test instance.
- **Global state:** Avoid module-level mutable protocol state. `HandshakeKernel` holds `store` + `ProtocolRecorder` per instance (`src/protocol/kernel.ts`).
- **Import posture:** Protocol must not import HTTP, SDK, adapters, or storage implementations (`src/protocol/LANE.md`). Enforced by `test/architecture/import-posture.test.ts`.
- **Body size:** Transition POST bodies capped at 256 KiB (`src/http/app.ts`).
- **Catalog immutability:** `putCatalogObject` rejects digest conflicts for same object id.

## Anti-Patterns

### Product surface performs gateway enforcement

**What happens:** CLI/MCP/SDK code signs, pays, or installs based on policy output alone.

**Why it's wrong:** Policy and greenlight are not execution authority; receipt cannot distinguish advisory checks from gateway checks.

**Do this instead:** Route mutation through adapter code only after `gatewayCheck` passes; use surfaces for proposal and `src/protocol/evidence-projections/` readback.

### Runtime ingress treated as permission

**What happens:** `proposeRuntimeIngressActionContracts` or `compileIntent` outcomes used directly to mutate.

**Why it's wrong:** Runtime lane records evidence and candidates; it does not evaluate policy or verify greenlight binding.

**Do this instead:** Follow kernel chain through `evaluatePolicy` and `gatewayCheck` (`src/runtime/ingress/index.ts` → HTTP transitions).

### HTTP handler embeds policy rules

**What happens:** Route handlers interpret contract fields or approve spend.

**Why it's wrong:** `src/http/` must not own protocol meaning (`STRUCTURE.md` ownership table).

**Do this instead:** Add rules in `src/protocol/areas/policy-greenlight/` and invoke via `transitionInvokers.evaluatePolicy`.

### Negotiation records imply authority

**What happens:** Accepted A2A offer or linked agreement used as reusable auth.

**Why it's wrong:** `src/protocol/areas/negotiation/` is evidence-only; policy may require an active `AgreementObligationBinding` but does not replace gateway check.

**Do this instead:** Bind obligation to exact contract, then run normal policy + gateway path (`docs/internal/decisions.md`).

## Error Handling

**Strategy:** Typed `HandshakeProtocolError` with HTTP mapping via `transitionErrorResult` (`src/protocol/foundation/errors.ts`, `src/http/errors/transition-error-envelope.ts`).

**Patterns:**
- Transition guards return refusal codes before commit (`src/protocol/foundation/transition-guards.ts`)
- Gateway refusals recorded as gate decisions with reason codes (`src/protocol/areas/gateway-gate/gateway-policy.ts`)
- Store commit conflicts surface as 409 or structured retryability on envelope

## Cross-Cutting Concerns

**Logging:** No centralized logger; CLI uses structured `cliOutput` (`src/cli/output.ts`). Prefer proof gaps and recorded refusals over log-only evidence.

**Validation:** Zod schemas at HTTP boundary and area inputs (`src/protocol/public/schemas.ts`, per-area `schemas.ts`).

**Authentication:** Transition caller roles via bearer tokens in `src/http/admission/caller-auth.ts`; hosted routes add `hosted-admission` evidence (`src/hosted-admission/`). Admission authorizes transition custody, not principal authority over mutations.

**Redaction:** Evidence routes and MCP resources use redaction profiles; raw internal records gated at `src/http/handlers/internal-record-read.ts` and `src/http/handlers/raw-read-audit.ts`.

---

*Architecture analysis: 2026-05-28*
