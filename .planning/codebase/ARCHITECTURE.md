<!-- refreshed: 2026-05-29 -->
# Architecture

**Analysis Date:** 2026-05-29

## System Overview

Handshake is a TypeScript protocol kernel for protected action infrastructure. The kernel records exact action contracts, policy decisions, one-use greenlights, gateway checks, receipts, refusals, proof gaps, and optional terminal certificates. Product surfaces (CLI, MCP, SDK, surfaces) propose and read evidence; they do not create authority. Reference gateway adapters in `src/adapters/` perform protected-surface mutation only after a verified `gatewayCheck` transition.

Core model (authority chain):

```text
Principal vague intent
        │
        ▼
Intent compilation (candidate actions, overreach/refusal markers)
  `src/protocol/areas/intent-compilation/`
        │
        ▼
CandidateAction → ActionContract (exact commitment)
  `src/protocol/areas/action-contract/`
        │
        ▼
Atomic policy evaluation (greenlight / refusal / review / halt / quarantine)
  `src/protocol/areas/policy-greenlight/transitions.ts`
        │
        ▼
Gateway check before mutation (enforcement boundary)
  `src/protocol/areas/gateway-gate/transitions.ts`
        │
        ▼
Adapter mutation (only after VerifiedGatewayCheck)
  `src/adapters/*`
        │
        ▼
Receipt / refusal / proof-gap / optional authority certificate
  `src/protocol/areas/operation-lifecycle/`, `refusal/`, `proof-gap/`
```

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Product surfaces (no authority)                          │
├──────────────┬──────────────┬──────────────┬──────────────┬───────────────┤
│  `src/cli/`  │ `src/mcp/`   │ `src/sdk/`   │`src/surfaces/│`src/x402-     │
│  evidence,   │ stdio tools, │ Handshake    │ readbacks,   │protected-tool/│
│  service-    │ resources,   │ Client +     │ proof        │ facade,       │
│  operator    │ x402 propose │ role clients │ packets      │ readiness     │
└──────┬───────┴──────┬───────┴──────┬───────┴──────┬───────┴───────┬───────┘
       │              │              │              │               │
       │  HTTP/SDK    │  HTTP/SDK    │  POST /v0.2  │  store read   │  runtime
       │  or local    │  or ref      │  transitions │  projections  │  ingress
       ▼              ▼              ▼              ▼               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              Transport & admission (`src/http/`, `src/hosted-admission/`)    │
│  `app.ts` → admission → mutation manifest parity → sequence matrix →       │
│  `transition-invokers` → `HandshakeKernel`                                 │
│  Handlers lane: read-only allowlist (evidence, verifier, hosted readiness) │
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
| FailureClass taxonomy | Cross-surface failure classification (HTTP/MCP/SDK) | `src/protocol/foundation/failure-class/index.ts` |
| HTTP app | Hono routes, admission, transition dispatch, evidence reads | `src/http/app.ts` |
| Mutation route manifest | Frozen POST inventory; drift guard at app construction | `src/http/mutation-route-manifest.ts` |
| Transition sequence matrix | Declared prerequisite routes; acyclic drift guard | `src/http/admission/transition-sequence-matrix.ts` |
| Transition invokers | Map route IDs to kernel methods (+ runtime ingress bridge) | `src/http/routes/transition-invokers.ts` |
| Runtime ingress | Compile dispatch blocks into candidates/contracts (observer lane) | `src/runtime/ingress/index.ts` |
| HandshakeClient | Typed HTTP transition + evidence calls | `src/sdk/client.ts` |
| Role surface clients | Custody-scoped clients (policy, gateway, evidence, etc.) | `src/sdk/surface-clients/` |
| Reference adapters | Gateway fixtures; enforcement before mutation | `src/adapters/x402-payment/wallet-gateway.ts`, etc. |
| MCP stdio server | Proposal tool + redacted evidence resources | `src/mcp/stdio/server.ts` |
| CLI runner | Command manifest, projections, service-operator bootstrap | `src/cli/main.ts` |
| Surfaces | Boundary manifest, proof packets, A2A readback, integrator parity | `src/surfaces/boundary-manifest.ts` |
| Hosted admission | Provider-neutral caller identity evidence contracts | `src/hosted-admission/` |
| Worker entry | Cloudflare `fetch` → `createApp()` | `src/worker.ts` |
| Package exports | Curated public API | `src/index.ts` |

## Pattern Overview

**Overall:** Layered authority boundary with a single kernel facade, append-only evidence store, and dual-enforcement transport posture (Phase 04–05).

**Key characteristics:**
- Every consequential path reduces to an exact `ActionContract`, then policy, then one-use greenlight, then `gatewayCheck` before mutation.
- Runtime and MCP/CLI are proposal and readback lanes; they never substitute for gateway enforcement.
- HTTP admission binds caller custody role per transition; hosted routes add scope checks via `src/hosted-admission/hosted-caller-identity.ts`.
- HTTP handlers are read-only; all protocol mutation goes through POST transition routes inventoried in `mutation-route-manifest.ts`.
- Example and adapter runners must call `run*Gateway` before protected mutation (`test/architecture/http-handler-mutation-gating.test.ts`).
- Gateway adapters are the only place that should touch payment/signing/install mutation credentials after a passed gate.

## Layers

**Protocol kernel (`src/protocol/`):**
- Purpose: Source-owned state machine, schemas, canonicalization, transition guards.
- Location: `src/protocol/`
- Contains: `kernel.ts`, `areas/*`, `foundation/*` (including `failure-class/`), `events/*`, `public/*`, `evidence-projections/*`, `navigation/*`, `store/port.ts`
- Depends on: Nothing outside protocol (per `src/protocol/LANE.md`)
- Used by: HTTP invokers, SDK, storage implementations, tests

**HTTP transport (`src/http/`):**
- Purpose: Worker/Hono app, OpenAPI, transition routes, evidence read routes, verifier projections.
- Location: `src/http/`
- Contains: `app.ts`, `routes/`, `handlers/` (read-only allowlist), `admission/`, `errors/`, `mutation-route-manifest.ts`
- Depends on: Protocol kernel, storage resolution, hosted-admission helpers
- Used by: `src/worker.ts`, integration tests, SDK default transport
- Construction guards: `assertMutationRouteManifestParity()` and `assertTransitionSequenceMatrixCoverage()` run at module load in `src/http/app.ts`

**Runtime observer (`src/runtime/`):**
- Purpose: Generated-execution evidence, ingress dispatch parsing, family-specific action proposals.
- Location: `src/runtime/ingress/`, `src/runtime/codemode-multi-action/`, per-family folders
- Depends on: Protocol types, adapter proposal configs
- Used by: `transitionInvokers.proposeRuntimeIngressActionContracts`, CLI/MCP bridges

**Reference adapters (`src/adapters/`):**
- Purpose: Gateway registry fixtures, wallet gateway (gateway-held custody), protected-tool facade wiring, bypass probes.
- Location: `src/adapters/x402-payment/`, `src/adapters/package-install/`, `src/adapters/auth-md/`, etc.
- Depends on: Protocol records, runtime ingress shapes; must not own protocol meaning
- Used by: Integration tests, `src/x402-protected-tool/`, experimental exports

**Product surfaces (`src/cli/`, `src/mcp/`, `src/sdk/`, `src/surfaces/`):**
- Purpose: Ergonomic proposal, evidence projection, conformance status, readbacks, integrator-parity navigation.
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
3. **Intent → contract** — `compileIntent` (`src/protocol/areas/intent-compilation/candidate-decision.ts` derives `CandidateAction` contractability) then `proposeActionContract` (`src/protocol/areas/action-contract/`)
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
Reference wallet gateway (gateway-held custody, D-64)
  `src/adapters/x402-payment/wallet-gateway.ts`
  `assertGatewayHeldSigningCommand()` — signer requires VerifiedGatewayCheck
  + gate-bound `used_by_gateway` credential resolution evidence
  Mutation + signer use ONLY after gateDecision === passed
        │
        ▼
recordCredentialResolutionEvidence (post-gate use evidence)
reconcileSurfaceOperation (downstream finality, no retry authority)
```

**MCP proposal path:** `src/mcp/x402-proposal.ts` → runtime client → same transition chain; tool name `handshake.actions.x402_payment.propose` (`src/mcp/catalog.ts`). MCP exposes redacted `handshake://evidence/*` resources (`src/mcp/resources.ts`), not raw records. MCP tool outcomes attach `FailureClass` via `classifyFailureClassFromReasonCodes` (`src/mcp/output.ts`).

**Protected-tool facade path:** `src/x402-protected-tool/index.ts` re-exports `prepareProtectedX402ToolDispatch` from `src/adapters/x402-payment/protected-tool-facade/` — packages readiness snapshots and dispatch preparation for host activation profiles (`src/adapters/x402-payment/protected-tool-profile/*`).

**CLI path:** `src/cli/x402/*`, `src/cli/demo/x402.ts`, `src/cli/simulate/x402-payment.ts` drive install, probes, and evidence views via `src/cli/main.ts`; they render APS/evidence, not gateway custody. Service-operator bootstrap lives at `src/cli/service-operator/bootstrap.ts` (command id `service.bootstrap` in `src/cli/command-manifest.ts`).

### HTTP request path

1. Request hits `createApp()` route (`src/http/app.ts`)
2. Construction-time guards already verified mutation manifest parity and sequence matrix coverage
3. `authorizeTransitionAdmission` — role token + optional hosted identity (`src/http/admission/`)
4. Body parsed against route `requestSchema` (`src/http/routes/transition-route-registry.ts`)
5. `kernelFor` constructs `HandshakeKernel` with store + request context (`src/http/store/resolution.ts`)
6. `transitionInvokers[routeId](kernel, body)` executes transition
7. JSON 201 or structured `TransitionErrorEnvelope` with `failureClass` (`src/http/errors/transition-error-envelope.ts`)

Evidence reads use GET handlers in `src/http/handlers/evidence-read.ts` and `src/http/routes/evidence-read-route-registry.ts` — read-only projections from `src/protocol/evidence-projections/` (including `store-reader.ts` for in-process readback).

### SDK client path

`HandshakeClient` in `src/sdk/client.ts` posts to `/v0.2/*` transition paths with caller role headers from `src/http/admission/caller-auth.ts`. Specialized clients in `src/sdk/surface-clients/` (control-plane, runtime, policy, gateway, install, evidence) wrap the same transport under explicit custody roles per `src/surfaces/boundary-manifest.ts` and integrator-parity table in `docs/internal/integrator-parity-transitions.md`. SDK transport maps HTTP status to `FailureClass` via `failureClassFromHttpStatus` (`src/sdk/surface-clients/transport.ts`); `src/sdk/repair.ts` derives remediation hints from failure class.

## Dual-enforcement gating (Phase 04–05)

Handshake enforces mutation authority at two complementary layers:

**Layer 1 — HTTP handler allowlist (transport):**
- All first-party HTTP handlers under `src/http/handlers/` must be read-only (evidence, verifier, hosted readiness, internal record read).
- Enforced by `test/architecture/http-handler-mutation-gating.test.ts` against `readOnlyHandlerAllowlist`.
- Handlers must not import `run*Gateway` or perform direct mutation patterns.

**Layer 2 — Adapter-gated runners (mutation side):**
- Protected mutation happens only in `src/adapters/*` after `VerifiedGatewayCheck`.
- Example runners (`examples/x402-protected-spend/run.ts`, etc.) must call `run*Gateway` before mutation.
- Every POST transition row in `src/http/mutation-route-manifest.ts` carries `requiresAdapterGatewayCheck: true` — documenting that HTTP transitions record authority steps; actual protected-surface mutation remains adapter-side after gate pass.

**Service mutation route manifest:**
- Frozen inventory at `src/http/mutation-route-manifest.ts` mirrors `transitionRouteDefinitions` exactly.
- `assertMutationRouteManifestParity()` throws at app construction on drift (missing/extra POST paths).
- Separate from `src/surfaces/boundary-manifest.ts` surface ownership (adjudication #7).

**Transition sequence matrix:**
- `src/http/admission/transition-sequence-matrix.ts` documents canonical prerequisite routes (e.g. `gatewayCheck` requires `proposeActionContract`).
- `assertTransitionSequenceMatrixCoverage()` verifies coverage, referential integrity, and acyclicity at app construction.
- Admission ordering contract only — per-request rejection still comes from kernel guards and scope resolvers.

## FailureClass taxonomy

Central definition: `src/protocol/foundation/failure-class/index.ts`.

| FailureClass | Meaning | Typical sources |
|--------------|---------|-----------------|
| `auth` | Caller custody / bearer failure | HTTP 401, `caller_auth_*` codes |
| `hosted_admission` | Hosted caller identity/config failure | `hosted_*` codes (non-stale) |
| `stale_admission` | Stale protected-path or hosted posture | `hosted_caller_identity_stale`, posture stale codes |
| `protected_action_refusal` | Policy/gateway/isolation refusal | Policy/gateway decision codes, refusals |
| `replay_refusal` | Replay or duplicate authority | `idempotency_duplicate_authority`, replay codes |
| `proof_gap` | Missing or incomplete evidence | HTTP 422, MCP binding/install codes, recovery with proofRef |
| `internal` | Misconfiguration or server fault | HTTP 5xx, unregistered transition errors |

**Surface wiring:**
- HTTP: `src/http/errors/transition-error-envelope.ts` — `failureClassForProtocolError`, `httpStatusForFailureClass`
- MCP: `src/mcp/output.ts`, `src/mcp/x402-proposal.ts` — `mcpFailureClassEvidenceRef(failureClass)`
- SDK: `src/sdk/client.ts`, `src/sdk/surface-clients/transport.ts`, `src/sdk/repair.ts`

Reason-code metadata may pre-classify failures via `classifiedFailure` in `src/protocol/foundation/reason-codes.ts`.

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

**x402 gateway-held custody (D-64):** `assertGatewayHeldSigningCommand` in `src/adapters/x402-payment/wallet-gateway.ts` structurally refuses signing unless the command carries a genuine `VerifiedGatewayCheck` and gate-bound `used_by_gateway` credential resolution evidence with redacted material posture.

**Anti-advisory rule:** Calling `evaluatePolicy` or holding a greenlight does not authorize mutation. Skipping `gatewayCheck` or reusing a greenlight is ambient authority, not Handshake. Admission alone is advisory, not Handshake enforcement (`test/architecture/dual-enforcement-posture.test.ts`).

## Integrator-parity surfaces

Bounded HTTP/SDK surface for service integrators (Phase 04 operator TTHW):

- Navigation tags: `test/architecture/integrator-parity.test.ts` verifies every integrator-parity transition in `src/protocol/navigation/index.ts`
- Role client mapping: `ControlPlaneClient`, `InstallClient`, `RuntimeClient`, `PolicyClient`, `GatewayClient` in `src/sdk/surface-clients/`
- Reference walkthrough: `test/sdk/role-clients-walkthrough.test.ts`
- Appendix: `docs/internal/integrator-parity-transitions.md`
- Runnable wedge in phase 04: x402 only; auth.md and package-install families marked proof-gap

Surface boundary manifest (`src/surfaces/boundary-manifest.ts`) maps surface IDs to route families, custody roles, authority postures, and non-authority flags for CLI/MCP/SDK/x402/surfaces.

## Key Abstractions

**ActionContract:**
- Purpose: Exact proposed commitment for one protected mutation attempt
- Examples: `src/protocol/areas/action-contract/`
- Pattern: Canonical digest binding; proposed via `proposeActionContract`

**CandidateAction / IntentCompilation:**
- Purpose: Compiled candidate from vague intent with contractability status
- Examples: `src/protocol/areas/intent-compilation/candidate-decision.ts`
- Pattern: `deriveCandidateDecision` → `contractable` or `rejected` with reason codes

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
- Examples: `src/protocol/evidence-projections/projections.ts`, `store-reader.ts`

**Surface boundary manifest:**
- Purpose: Maps product surfaces to allowed route families and custody roles
- Examples: `src/surfaces/boundary-manifest.ts`

## Entry Points

**npm package root:**
- Location: `src/index.ts` (package `handshake-protocol-kernel@0.2.7`)
- Triggers: `import from "handshake-protocol-kernel"`
- Responsibilities: Curated exports (HTTP app factory, SDK client, protocol schemas, verifier helpers)

**CLI:**
- Location: `bin/handshake` → `src/cli/main.ts` via `src/cli/index.ts`
- Triggers: `handshake <group> <subcommand>`
- Responsibilities: Operator/evidence commands; `service bootstrap` via `src/cli/service-operator/bootstrap.ts`; no kernel mutation authority

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
- **Dependency direction:** Kernel must not depend on surfaces; surfaces create no authority. Each first-level `src/*` lane maintains `LANE.md` with authority owner and forbidden imports.
- **Body size:** Transition POST bodies capped at 256 KiB (`src/http/app.ts`).
- **Catalog immutability:** `putCatalogObject` rejects digest conflicts for same object id.

## Anti-Patterns

### Product surface performs gateway enforcement

**What happens:** CLI/MCP/SDK code signs, pays, or installs based on policy output alone.

**Why it's wrong:** Policy and greenlight are not execution authority; receipt cannot distinguish advisory checks from gateway checks.

**Do this instead:** Route mutation through adapter code only after `gatewayCheck` passes; use surfaces for proposal and `src/protocol/evidence-projections/` readback.

### HTTP handler performs mutation

**What happens:** A handler under `src/http/handlers/` calls gateway runners or protected APIs directly.

**Why it's wrong:** Violates dual-enforcement handler allowlist; bypasses mutation manifest inventory.

**Do this instead:** Add a transition route + invoker; keep handlers read-only per `test/architecture/http-handler-mutation-gating.test.ts`.

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

**Strategy:** Typed `HandshakeProtocolError` with HTTP mapping via `transitionErrorResult` (`src/protocol/foundation/errors.ts`, `src/http/errors/transition-error-envelope.ts`). All surfaces share `FailureClass` taxonomy from `src/protocol/foundation/failure-class/index.ts`.

**Patterns:**
- Transition guards return refusal codes before commit (`src/protocol/foundation/transition-guards.ts`)
- Gateway refusals recorded as gate decisions with reason codes (`src/protocol/areas/gateway-gate/gateway-policy.ts`)
- Store commit conflicts surface as 409 or structured retryability on envelope
- MCP/SDK attach failure class for operator remediation (`src/sdk/repair.ts`)

## Cross-Cutting Concerns

**Logging:** No centralized logger; CLI uses structured `cliOutput` (`src/cli/output.ts`). Prefer proof gaps and recorded refusals over log-only evidence.

**Validation:** Zod schemas at HTTP boundary and area inputs (`src/protocol/public/schemas.ts`, per-area `schemas.ts`).

**Authentication:** Transition caller roles via bearer tokens in `src/http/admission/caller-auth.ts`; hosted routes add `hosted-admission` evidence (`src/hosted-admission/`). Admission authorizes transition custody, not principal authority over mutations.

**Redaction:** Evidence routes and MCP resources use redaction profiles; raw internal records gated at `src/http/handlers/internal-record-read.ts`.

---

*Architecture analysis: 2026-05-29*
